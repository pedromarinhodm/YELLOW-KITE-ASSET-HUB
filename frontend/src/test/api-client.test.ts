import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api-client';

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

describe('ApiClient - Retry Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve fazer retry em erros de rede transitórios', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const mockRpc = vi.mocked(supabase.rpc);

    // Primeira tentativa falha com erro de rede
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: new Error('Failed to fetch'),
    } as any);

    // Segunda tentativa sucede
    mockRpc.mockResolvedValueOnce({
      data: [{ id: '123' }],
      error: null,
    } as any);

    const result = await apiClient.rpc<any[]>('test_function', {}, {
      retries: 2,
      retryDelay: 10, // Delay curto para testes
    });

    expect(result).toEqual([{ id: '123' }]);
    expect(mockRpc).toHaveBeenCalledTimes(2);
  });

  it('não deve fazer retry em erros de lógica de negócio', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const mockRpc = vi.mocked(supabase.rpc);

    // Erro de lógica (ex: constraint violation)
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    } as any);

    await expect(
      apiClient.rpc('test_function', {}, { retries: 2, retryDelay: 10 })
    ).rejects.toThrow();

    // Não deve fazer retry
    expect(mockRpc).toHaveBeenCalledTimes(1);
  });

  it('deve respeitar o timeout configurado', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const mockRpc = vi.mocked(supabase.rpc);

    // Simula resposta lenta
    mockRpc.mockImplementation(() =>
      new Promise((resolve) => {
        setTimeout(() => resolve({ data: [], error: null } as any), 5000);
      }) as any
    );

    await expect(
      apiClient.rpc('slow_function', {}, { timeout: 100, retries: 0 })
    ).rejects.toThrow(/demorou demais/i);
  });
});

describe('ApiClient - Error Handling', () => {
  it('deve normalizar mensagens de erro para usuário', () => {
    const message = apiClient.handleError(
      new Error('Failed to fetch'),
      'test_operation',
      'Erro desconhecido'
    );

    expect(message).toContain('conexão');
  });

  it('deve usar fallback quando erro não é reconhecido', () => {
    const message = apiClient.handleError(
      new Error('Unknown error XYZ'),
      'test_operation',
      'Algo deu errado'
    );

    expect(message).toBe('Unknown error XYZ');
  });
});

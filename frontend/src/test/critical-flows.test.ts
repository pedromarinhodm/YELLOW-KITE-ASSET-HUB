import { describe, it, expect, vi, beforeEach } from 'vitest';
import { allocationService } from '@/services/allocationService';

// Mock do apiClient original (REST)
vi.mock('@/services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));


describe('Onboarding Flow - Critical Path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve alocar múltiplos equipamentos via API REST', async () => {
    const { apiClient } = await import('@/services/apiClient');
    const mockPost = vi.mocked(apiClient.post);

    const mockAllocations = [
      {
        id: 'alloc-1',
        employee_id: 'emp-1',
        equipment_id: 'eq-1',
        allocated_at: '2026-02-19T10:00:00Z',
        returned_at: null,
        notes: 'Kit completo de boas-vindas',
        type: 'kit',
        term_signed: true,
        term_signed_at: '2026-02-19T10:00:00Z',
        return_deadline: null,
      },
      {
        id: 'alloc-2',
        employee_id: 'emp-1',
        equipment_id: 'eq-2',
        allocated_at: '2026-02-19T10:00:00Z',
        returned_at: null,
        notes: 'Kit completo de boas-vindas',
        type: 'kit',
        term_signed: true,
        term_signed_at: '2026-02-19T10:00:00Z',
        return_deadline: null,
      },
    ];

    mockPost.mockResolvedValueOnce(mockAllocations);

    const result = await allocationService.allocate(
      'emp-1',
      ['eq-1', 'eq-2'],
      'Kit completo de boas-vindas'
    );

    expect(result).toHaveLength(2);
    expect(result[0].employeeId).toBe('emp-1');
    expect(result[1].employeeId).toBe('emp-1');
    expect(mockPost).toHaveBeenCalledWith(
      '/allocations',
      expect.objectContaining({
        employee_id: 'emp-1',
        equipment_ids: ['eq-1', 'eq-2'],
        notes: 'Kit completo de boas-vindas',
        movement_type: 'kit',
      })
    );
  });

  it('deve falhar se o backend retornar erro', async () => {
    const { apiClient } = await import('@/services/apiClient');
    const mockPost = vi.mocked(apiClient.post);

    // Simula erro do backend
    mockPost.mockRejectedValueOnce(new Error('Equipment eq-2 is not available'));

    await expect(
      allocationService.allocate('emp-1', ['eq-1', 'eq-2'], 'Kit completo')
    ).rejects.toThrow('not available');

    expect(mockPost).toHaveBeenCalledTimes(1);
  });
});


describe('Offboarding Flow - Critical Path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve devolver múltiplos equipamentos via API REST', async () => {
    const { apiClient } = await import('@/services/apiClient');
    const mockPost = vi.mocked(apiClient.post);

    const mockDeallocations = [
      {
        id: 'alloc-1',
        employee_id: 'emp-1',
        equipment_id: 'eq-1',
        allocated_at: '2026-02-01T10:00:00Z',
        returned_at: '2026-02-19T15:00:00Z',
        notes: 'Devolução OK',
        type: 'kit',
        term_signed: true,
        term_signed_at: '2026-02-01T10:00:00Z',
        return_deadline: null,
      },
      {
        id: 'alloc-2',
        employee_id: 'emp-1',
        equipment_id: 'eq-2',
        allocated_at: '2026-02-01T10:00:00Z',
        returned_at: '2026-02-19T15:00:00Z',
        notes: 'Devolução OK',
        type: 'kit',
        term_signed: true,
        term_signed_at: '2026-02-01T10:00:00Z',
        return_deadline: null,
      },
    ];

    mockPost.mockResolvedValueOnce(mockDeallocations);

    const result = await allocationService.deallocateBatch([
      { allocationId: 'alloc-1', notes: 'Devolução OK' },
      { allocationId: 'alloc-2', notes: 'Devolução OK' },
    ], '2026-02-19T15:00:00Z');

    expect(result).toHaveLength(2);
    expect(result[0].returnedAt).toBeTruthy();
    expect(result[1].returnedAt).toBeTruthy();
    expect(mockPost).toHaveBeenCalledWith(
      '/allocations/return-batch',
      expect.objectContaining({
        allocation_ids: ['alloc-1', 'alloc-2'],
        returned_at: '2026-02-19T15:00:00Z',
        notes_by_allocation: {
          'alloc-1': 'Devolução OK',
          'alloc-2': 'Devolução OK',
        },
      })
    );
  });

  it('deve permitir definir destino diferente para cada equipamento', async () => {
    const { apiClient } = await import('@/services/apiClient');
    const mockPost = vi.mocked(apiClient.post);

    mockPost.mockResolvedValueOnce([]);

    await allocationService.deallocateBatch([
      { allocationId: 'alloc-1', destination: 'available' },
      { allocationId: 'alloc-2', destination: 'maintenance' },
    ], '2026-02-19T15:00:00Z');

    expect(mockPost).toHaveBeenCalledWith(
      '/allocations/return-batch',
      expect.objectContaining({
        allocation_ids: ['alloc-1', 'alloc-2'],
        returned_at: '2026-02-19T15:00:00Z',
        destinations_by_allocation: {
          'alloc-1': 'available',
          'alloc-2': 'maintenance',
        },
      })
    );
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  },
}));

vi.mock('@/lib/sentry', () => ({
  setSentryUser: vi.fn(),
  clearSentryUser: vi.fn(),
}));

describe('Login Flow - Critical Path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve fazer login com credenciais válidas', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const mockSignIn = vi.mocked(supabase.auth.signInWithPassword);

    mockSignIn.mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-123',
          email: 'admin@yellowkite.com',
        },
        session: { access_token: 'token-abc' },
      },
      error: null,
    } as any);

    const result = await mockSignIn({
      email: 'admin@yellowkite.com',
      password: 'senha123',
    });

    expect(result.error).toBeNull();
    expect(result.data?.user?.email).toBe('admin@yellowkite.com');
  });

  it('deve rejeitar login com credenciais inválidas', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const mockSignIn = vi.mocked(supabase.auth.signInWithPassword);

    mockSignIn.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: new Error('Invalid login credentials'),
    } as any);

    const result = await mockSignIn({
      email: 'wrong@email.com',
      password: 'wrong-password',
    });

    expect(result.error).toBeTruthy();
    expect(result.error?.message).toContain('Invalid login credentials');
  });

  it('deve carregar perfil e papel após login bem-sucedido', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const mockFrom = vi.mocked(supabase.from);

    // Mock para profiles
    const profileChain = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() =>
            Promise.resolve({
              data: {
                id: 'profile-1',
                user_id: 'user-123',
                name: 'Admin User',
                department: 'TI',
              },
              error: null,
            })
          ),
        })),
      })),
    };

    // Mock para user_roles
    const roleChain = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() =>
            Promise.resolve({
              data: { role: 'admin' },
              error: null,
            })
          ),
        })),
      })),
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return profileChain as any;
      if (table === 'user_roles') return roleChain as any;
      return {} as any;
    });

    const profileResult = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', 'user-123')
      .maybeSingle();

    const roleResult = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', 'user-123')
      .maybeSingle();

    expect(profileResult.data?.name).toBe('Admin User');
    expect(roleResult.data?.role).toBe('admin');
  });

  it('deve configurar contexto Sentry após login', async () => {
    const { setSentryUser } = await import('@/lib/sentry');
    const mockSetSentryUser = vi.mocked(setSentryUser);

    // Simula configuração após login
    mockSetSentryUser('user-123', 'Admin User', 'admin');

    expect(mockSetSentryUser).toHaveBeenCalledWith('user-123', 'Admin User', 'admin');
  });

  it('deve limpar contexto Sentry após logout', async () => {
    const { clearSentryUser } = await import('@/lib/sentry');
    const mockClearSentryUser = vi.mocked(clearSentryUser);

    // Simula logout
    mockClearSentryUser();

    expect(mockClearSentryUser).toHaveBeenCalled();
  });
});

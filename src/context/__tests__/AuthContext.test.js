import { describe, expect, it } from 'vitest';

describe('AuthContext module', () => {
  it('exports the provider and auth hook', async () => {
    const mod = await import('../AuthContext.jsx');

    expect(typeof mod.AuthProvider).toBe('function');
    expect(typeof mod.useAuth).toBe('function');
    expect(mod.AUTH_STATES).toMatchObject({
      LOADING: 'loading',
      AUTHENTICATED: 'authenticated',
      UNAUTHENTICATED: 'unauthenticated',
    });
  });
});

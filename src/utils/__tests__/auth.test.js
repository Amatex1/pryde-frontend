import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const loadAuthModule = async () => {
  vi.resetModules();
  return import('../auth.js');
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('auth token storage hardening', () => {
  it('stores access tokens in memory without persisting them to localStorage', async () => {
    const { clearAllTokens, getAuthToken, setAuthToken } = await loadAuthModule();

    setAuthToken('access-token-123');

    expect(getAuthToken()).toBe('access-token-123');
    expect(localStorage.getItem('pryde_access_token')).toBeNull();
    expect(localStorage.getItem('pryde_access_token_time')).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('tokenSetTime')).toBeNull();

    clearAllTokens();
  });

  it('does not restore deprecated persisted access tokens from localStorage', async () => {
    localStorage.setItem('pryde_access_token', 'persisted-token');
    localStorage.setItem('pryde_access_token_time', '123');
    localStorage.setItem('token', 'legacy-token');
    localStorage.setItem('tokenSetTime', '456');

    const { getAuthToken } = await loadAuthModule();

    expect(getAuthToken()).toBeNull();
    expect(localStorage.getItem('pryde_access_token')).toBeNull();
    expect(localStorage.getItem('pryde_access_token_time')).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('tokenSetTime')).toBeNull();
  });
});
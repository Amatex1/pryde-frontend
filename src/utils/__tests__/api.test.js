import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  apiInstance: vi.fn(),
  axiosCreate: vi.fn(),
  requestFulfilled: null,
  requestRejected: null,
  responseFulfilled: null,
  responseRejected: null,
  auth: {
    getAuthToken: vi.fn(),
    logout: vi.fn(),
    isManualLogout: vi.fn(),
    getCurrentUser: vi.fn(),
    getIsLoggingOut: vi.fn()
  },
  refresh: {
    refreshAccessToken: vi.fn(),
    isRefreshInProgress: vi.fn(),
    getRefreshPromise: vi.fn()
  },
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  },
  socket: {
    disconnectSocket: vi.fn(),
    initializeSocket: vi.fn()
  }
}));

vi.mock('axios', () => ({
  default: {
    create: state.axiosCreate
  }
}));

vi.mock('../auth', () => ({
  getAuthToken: state.auth.getAuthToken,
  logout: state.auth.logout,
  isManualLogout: state.auth.isManualLogout,
  getCurrentUser: state.auth.getCurrentUser,
  getIsLoggingOut: state.auth.getIsLoggingOut
}));

vi.mock('../tokenRefresh', () => ({
  refreshAccessToken: state.refresh.refreshAccessToken,
  isRefreshInProgress: state.refresh.isRefreshInProgress,
  getRefreshPromise: state.refresh.getRefreshPromise
}));

vi.mock('../logger', () => ({
  default: state.logger
}));

vi.mock('../socket', () => ({
  disconnectSocket: state.socket.disconnectSocket,
  initializeSocket: state.socket.initializeSocket
}));

vi.mock('../../config/api.js', () => ({
  API_AUTH_URL: 'https://auth.example.com/api'
}));

async function loadApiModule() {
  vi.resetModules();
  const module = await import('../api.js');
  expect(typeof state.requestFulfilled).toBe('function');
  expect(typeof state.responseRejected).toBe('function');
  return module;
}

beforeEach(() => {
  state.requestFulfilled = null;
  state.requestRejected = null;
  state.responseFulfilled = null;
  state.responseRejected = null;

  state.apiInstance.mockReset();
  state.apiInstance.get = vi.fn();
  state.apiInstance.interceptors = {
    request: {
      use: vi.fn((fulfilled, rejected) => {
        state.requestFulfilled = fulfilled;
        state.requestRejected = rejected;
      })
    },
    response: {
      use: vi.fn((fulfilled, rejected) => {
        state.responseFulfilled = fulfilled;
        state.responseRejected = rejected;
      })
    }
  };

  state.axiosCreate.mockReset();
  state.axiosCreate.mockReturnValue(state.apiInstance);

  Object.values(state.auth).forEach((mockFn) => mockFn.mockReset());
  Object.values(state.refresh).forEach((mockFn) => mockFn.mockReset());
  Object.values(state.logger).forEach((mockFn) => mockFn.mockReset());
  Object.values(state.socket).forEach((mockFn) => mockFn.mockReset());

  state.auth.getIsLoggingOut.mockReturnValue(false);
  state.auth.isManualLogout.mockReturnValue(false);
  state.refresh.isRefreshInProgress.mockReturnValue(false);
  window.history.replaceState({}, '', '/feed');
});

describe('api interceptors', () => {
  it('attaches auth and csrf headers for state-changing requests', async () => {
    const { getCsrfToken } = await loadApiModule();
    state.auth.getAuthToken.mockReturnValue('jwt-123');

    await state.responseFulfilled({ headers: { 'x-csrf-token': 'csrf-123' } });
    const config = await state.requestFulfilled({ url: '/posts', method: 'post', headers: {} });

    expect(getCsrfToken()).toBe('csrf-123');
    expect(config.headers.Authorization).toBe('Bearer jwt-123');
    expect(config.headers['X-XSRF-TOKEN']).toBe('csrf-123');
  });

  it('blocks direct Cloudflare API calls from the frontend', async () => {
    await loadApiModule();

    await expect(state.requestFulfilled({ url: 'https://api.cloudflare.com/client/v4/zones', headers: {} })).rejects.toThrow(
      /Blocked illegal Cloudflare API call/
    );
    expect(state.logger.error).toHaveBeenCalledWith('[SECURITY] Blocked Cloudflare API call from frontend');
  });

  it('waits for an in-flight refresh before sending protected requests on protected pages', async () => {
    await loadApiModule();
    window.history.replaceState({}, '', '/feed');
    state.refresh.isRefreshInProgress.mockReturnValue(true);
    state.refresh.getRefreshPromise.mockResolvedValue('fresh-after-wait');
    state.auth.getAuthToken.mockReturnValue('stale-token');

    const config = await state.requestFulfilled({ url: '/notifications', method: 'get', headers: {} });

    expect(state.refresh.getRefreshPromise).toHaveBeenCalledTimes(1);
    expect(config.headers.Authorization).toBe('Bearer fresh-after-wait');
    expect(state.logger.debug).toHaveBeenCalledWith('Refresh already in progress; waiting before sending protected request');
  });

  it('treats 410 responses as terminal resolved states', async () => {
    await loadApiModule();

    const result = await state.responseRejected({
      response: { status: 410 },
      config: { url: '/removed-feature' }
    });

    expect(result).toMatchObject({
      status: 410,
      data: { removed: true, status: 410, url: '/removed-feature' }
    });
  });

  it('retries csrf failures after refreshing the csrf token with debug-only recovery logging', async () => {
    const { getCsrfToken } = await loadApiModule();

    state.apiInstance.get.mockImplementation(async () => {
      await state.responseFulfilled({ headers: { 'x-csrf-token': 'csrf-fresh' } });
      return { status: 200, headers: { 'x-csrf-token': 'csrf-fresh' } };
    });
    state.apiInstance.mockResolvedValue({ status: 200, data: { retried: true } });

    const originalRequest = { url: '/posts', method: 'post', headers: {} };
    const result = await state.responseRejected({
      response: { status: 403, data: { message: 'CSRF token invalid' } },
      config: originalRequest
    });

    expect(state.apiInstance.get).toHaveBeenCalledWith('/posts?limit=1');
    expect(state.logger.debug).toHaveBeenCalledWith('CSRF validation failed - attempting token refresh');
    expect(getCsrfToken()).toBe('csrf-fresh');
    expect(state.apiInstance).toHaveBeenCalledWith(originalRequest);
    expect(result).toEqual({ status: 200, data: { retried: true } });
  });

  it('refreshes expired tokens through the single-flight path and reconnects sockets', async () => {
    await loadApiModule();
    state.refresh.refreshAccessToken.mockResolvedValue('fresh-access-token');
    state.auth.getCurrentUser.mockReturnValue({ id: 'user-123' });
    state.apiInstance.mockResolvedValue({ status: 200, data: { ok: true } });

    const originalRequest = { url: '/messages', headers: {} };
    const result = await state.responseRejected({
      response: { status: 401, data: {} },
      config: originalRequest
    });

    expect(state.refresh.refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(originalRequest._retry).toBe(true);
    expect(originalRequest.headers.Authorization).toBe('Bearer fresh-access-token');
    expect(state.socket.disconnectSocket).toHaveBeenCalledTimes(1);
    expect(state.socket.initializeSocket).toHaveBeenCalledWith('user-123');
    expect(state.apiInstance).toHaveBeenCalledWith(originalRequest);
    expect(result).toEqual({ status: 200, data: { ok: true } });
  });
});
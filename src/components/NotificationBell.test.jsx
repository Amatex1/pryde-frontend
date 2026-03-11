import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import NotificationBell from './NotificationBell';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  useLocation: vi.fn(),
  useAuth: vi.fn(),
  apiGet: vi.fn(),
  apiPut: vi.fn(),
  socket: {
    on: vi.fn(),
    off: vi.fn()
  }
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
  useLocation: () => mocks.useLocation()
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mocks.useAuth()
}));

vi.mock('../utils/api', () => ({
  default: {
    get: mocks.apiGet,
    put: mocks.apiPut
  }
}));

vi.mock('../utils/socket', () => ({
  getSocket: () => mocks.socket
}));

vi.mock('../utils/logger', () => ({
  default: {
    debug: vi.fn(),
    warn: vi.fn()
  }
}));

vi.mock('../constants/notificationTypes', () => ({
  filterSocialNotifications: (items) => items,
  shouldIncrementBellCount: () => true
}));

vi.mock('../utils/lucideDefaults', () => ({
  LUCIDE_DEFAULTS: {}
}));

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useLocation.mockReturnValue({ pathname: '/feed' });
    mocks.useAuth.mockReturnValue({
      isAuthReady: true,
      isAuthenticated: true,
      user: { _id: 'user-123', username: 'alex' }
    });
    mocks.apiGet.mockResolvedValue({ data: [] });
  });

  it('fetches notifications when auth is ready and authenticated', async () => {
    render(<NotificationBell />);

    await waitFor(() => expect(mocks.apiGet).toHaveBeenCalledWith('/notifications'));
    expect(mocks.socket.on).toHaveBeenCalledWith('notification:new', expect.any(Function));
  });

  it('skips the initial notifications fetch on the notifications page', async () => {
    mocks.useLocation.mockReturnValue({ pathname: '/notifications' });

    render(<NotificationBell />);

    await waitFor(() => expect(mocks.socket.on).toHaveBeenCalledWith('notification:new', expect.any(Function)));
    expect(mocks.apiGet).not.toHaveBeenCalled();
  });
});
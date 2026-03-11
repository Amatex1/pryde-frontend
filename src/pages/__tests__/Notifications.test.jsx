import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import Notifications from '../Notifications';

const mockNavigate = vi.fn();
const mockUseOutletContext = vi.fn();
const mockUseAuth = vi.fn();
const mockApiGet = vi.fn();
const mockApiPut = vi.fn();
const mockSendTestNotification = vi.fn();
const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
};

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useOutletContext: () => mockUseOutletContext(),
}));

vi.mock('../../components/Navbar', () => ({ default: () => <div data-testid="navbar" /> }));
vi.mock('../../components/AsyncStateWrapper', () => ({
  default: ({ children, isEmpty, emptyComponent }) => (isEmpty ? emptyComponent : children),
}));
vi.mock('../../components/EmptyState', () => ({
  default: ({ title }) => <div>{title}</div>,
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../utils/api', () => ({
  default: {
    get: (...args) => mockApiGet(...args),
    put: (...args) => mockApiPut(...args),
  },
}));

vi.mock('../../utils/socket', () => ({
  getSocket: () => mockSocket,
}));

vi.mock('../../utils/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../utils/pushNotifications', () => ({
  sendTestNotification: (...args) => mockSendTestNotification(...args),
}));

function buildNotification(overrides = {}) {
  return {
    _id: 'notif-1',
    type: 'like',
    read: false,
    sender: { _id: 'user-2', username: 'alex', displayName: 'Alex' },
    createdAt: '2026-03-11T00:00:00.000Z',
    ...overrides,
  };
}

describe('Notifications page realtime updates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOutletContext.mockReturnValue({ onMenuOpen: vi.fn() });
    mockUseAuth.mockReturnValue({ isAuthReady: true, isAuthenticated: true });
    mockApiPut.mockResolvedValue({ data: {} });
    mockSendTestNotification.mockResolvedValue({ success: true });
    mockApiGet.mockImplementation((path) => {
      if (path === '/notifications') {
        return Promise.resolve({ data: [buildNotification()] });
      }

      if (path === '/login-approval/pending') {
        return Promise.resolve({ data: { approvals: [] } });
      }

      return Promise.reject(new Error(`Unexpected GET ${path}`));
    });
  });

  it('subscribes to notification socket events and prepends realtime notifications', async () => {
    render(<Notifications />);

    await waitFor(() => expect(mockApiGet).toHaveBeenCalledWith('/notifications'));
    expect(mockSocket.on).toHaveBeenCalledWith('notification:new', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('notification:read', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('notification:read_all', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('notification:deleted', expect.any(Function));

    const handleNewNotification = mockSocket.on.mock.calls.find(([eventName]) => eventName === 'notification:new')[1];
    await act(async () => {
      handleNewNotification({
        notification: buildNotification({
          _id: 'notif-2',
          sender: { _id: 'user-3', username: 'sam', displayName: 'Sam' },
        }),
      });
    });

    expect(await screen.findByText('Sam liked your post')).toBeInTheDocument();
  });

  it('ignores message notifications and clears the unread action on read-all events', async () => {
    render(<Notifications />);

    expect(await screen.findByRole('button', { name: /mark all as read/i })).toBeInTheDocument();

    const handleNewNotification = mockSocket.on.mock.calls.find(([eventName]) => eventName === 'notification:new')[1];
    await act(async () => {
      handleNewNotification({
        notification: buildNotification({
          _id: 'notif-message',
          type: 'message',
          message: 'Message notification',
        }),
      });
    });

    await waitFor(() => {
      expect(screen.queryByText('Message notification')).not.toBeInTheDocument();
    });

    const handleReadAll = mockSocket.on.mock.calls.find(([eventName]) => eventName === 'notification:read_all')[1];
    await act(async () => {
      handleReadAll();
    });

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /mark all as read/i })).not.toBeInTheDocument();
    });
  });
});
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SecuritySettings from '../SecuritySettings';

const mockNavigate = vi.fn();
const mockUseOutletContext = vi.fn();
const mockUseAuth = vi.fn();
const mockRefreshUser = vi.fn();
const mockApiGet = vi.fn();
const mockApiPost = vi.fn();
const mockApiPut = vi.fn();
const mockShowPrompt = vi.fn();
const mockIsPushNotificationSubscribed = vi.fn();
const mockSubscribeToPushNotifications = vi.fn();
const mockUnsubscribeFromPushNotifications = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useOutletContext: () => mockUseOutletContext(),
}));

vi.mock('../../components/Navbar', () => ({ default: () => <div data-testid="navbar" /> }));
vi.mock('../../components/security/TwoFactorSetup', () => ({ default: () => <div data-testid="two-factor-setup" /> }));
vi.mock('../../components/security/SessionManagement', () => ({ default: () => <div data-testid="session-management" /> }));
vi.mock('../../components/PasskeyManager', () => ({ default: () => <div data-testid="passkey-manager" /> }));
vi.mock('../../components/RecoveryContacts', () => ({ default: () => <div data-testid="recovery-contacts" /> }));
vi.mock('../../components/CustomModal', () => ({ default: () => null }));

vi.mock('../../hooks/useModal', () => ({
  useModal: () => ({
    modalState: { isOpen: false },
    closeModal: vi.fn(),
    showPrompt: mockShowPrompt,
  }),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../utils/api', () => ({
  default: {
    get: (...args) => mockApiGet(...args),
    post: (...args) => mockApiPost(...args),
    put: (...args) => mockApiPut(...args),
  },
}));

vi.mock('../../utils/pushNotifications', () => ({
  isPushNotificationSubscribed: (...args) => mockIsPushNotificationSubscribed(...args),
  subscribeToPushNotifications: (...args) => mockSubscribeToPushNotifications(...args),
  unsubscribeFromPushNotifications: (...args) => mockUnsubscribeFromPushNotifications(...args),
}));

function buildUser(overrides = {}) {
  const loginAlerts = {
    enabled: false,
    emailOnNewDevice: false,
    emailOnSuspiciousLogin: false,
    ...(overrides.loginAlerts || {})
  };

  return {
    loginAlerts,
    pushTwoFactorEnabled: false,
    hasPushSubscription: false,
    preferPushTwoFactor: true,
    ...overrides
  };
}

describe('SecuritySettings push login approval', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: { permission: 'granted', requestPermission: vi.fn() },
    });
    Object.defineProperty(window, 'PushManager', {
      configurable: true,
      value: function PushManager() {},
    });
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {},
    });

    mockUseOutletContext.mockReturnValue({ onMenuOpen: vi.fn() });
    mockApiGet.mockResolvedValue({ data: { enabled: false, backupCodesRemaining: 0 } });
    mockApiPost.mockResolvedValue({ data: { success: true } });
    mockApiPut.mockResolvedValue({ data: {} });
    mockIsPushNotificationSubscribed.mockResolvedValue(true);
    mockSubscribeToPushNotifications.mockResolvedValue(true);
    mockUnsubscribeFromPushNotifications.mockResolvedValue(true);
    mockUseAuth.mockReturnValue({
      user: buildUser({ hasPushSubscription: false }),
      refreshUser: mockRefreshUser,
    });
  });

  it('uses refreshUser return data instead of stale currentUser state for push enablement', async () => {
    mockRefreshUser.mockResolvedValue({
      authenticated: true,
      user: buildUser({ hasPushSubscription: true })
    });

    render(<SecuritySettings />);

    const enableButton = await screen.findByRole('button', { name: /enable push login approval/i });
    expect(enableButton).not.toBeDisabled();
  });

  it('does not refetch security settings in a loop when auth context user changes after refresh', async () => {
    let authUser = buildUser({ hasPushSubscription: false });

    mockUseAuth.mockImplementation(() => ({
      user: authUser,
      refreshUser: mockRefreshUser,
    }));

    mockRefreshUser.mockImplementation(async () => {
      authUser = buildUser({ hasPushSubscription: true });

      return {
        authenticated: true,
        user: authUser
      };
    });

    render(<SecuritySettings />);

    await screen.findByRole('button', { name: /enable push login approval/i });
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(mockApiGet).toHaveBeenCalledTimes(1);
    expect(mockRefreshUser).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/failed to load security settings/i)).not.toBeInTheDocument();
  });

  it('enables push login approval and refreshes the visible account status', async () => {
    mockRefreshUser
      .mockResolvedValueOnce({
        authenticated: true,
        user: buildUser({ hasPushSubscription: true, pushTwoFactorEnabled: false })
      })
      .mockResolvedValueOnce({
        authenticated: true,
        user: buildUser({ hasPushSubscription: true, pushTwoFactorEnabled: true })
      });

    render(<SecuritySettings />);

    fireEvent.click(await screen.findByRole('button', { name: /enable push login approval/i }));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/login-approval/enable');
    });

    expect(await screen.findByText(/push login approval enabled successfully/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/push login approval is enabled and ready/i)).toBeInTheDocument();
    });
  });
});
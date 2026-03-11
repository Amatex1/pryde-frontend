import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Navbar from './Navbar';

const mockNavigate = vi.fn();
const mockUseOutletContext = vi.fn();

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => mockNavigate,
  useOutletContext: () => mockUseOutletContext(),
}));

vi.mock('../utils/auth', () => ({ logout: vi.fn() }));
vi.mock('../utils/imageUrl', () => ({ getImageUrl: (value) => value || '' }));
vi.mock('../utils/routePrefetch', () => ({ prefetchRoute: vi.fn(), prefetchOnIdle: vi.fn() }));
vi.mock('./GlobalSearch', () => ({ default: () => <div data-testid="global-search" /> }));
vi.mock('./NotificationBell', () => ({ default: () => <div data-testid="notification-bell" /> }));
vi.mock('./MessagesDropdown', () => ({ default: () => <div data-testid="messages-dropdown" /> }));
vi.mock('./SkeletonLoader', () => ({ SkeletonNavbarActions: () => <div /> }));
vi.mock('../utils/api', () => ({ default: { patch: vi.fn() } }));
vi.mock('../utils/themeManager', () => ({
  getQuietMode: () => false,
  setQuietMode: vi.fn(),
  getGalaxyMode: () => false,
  toggleGalaxyMode: vi.fn(() => false),
  toggleSessionQuietOverride: vi.fn(),
}));
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'alex', displayName: 'Alex' },
    updateUser: vi.fn(),
    clearUser: vi.fn(),
  }),
}));
vi.mock('../hooks/useUnreadMessages', () => ({ useUnreadMessages: () => ({ totalUnread: 0 }) }));

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOutletContext.mockReturnValue({
      isMobileNavOpen: false,
      onMenuClose: vi.fn(),
      mobileNavTriggerRef: { current: null },
    });
  });

  it('reflects the closed drawer state and opens via external control', () => {
    const onMenuClick = vi.fn();

    render(<Navbar onMenuClick={onMenuClick} />);

    const toggle = screen.getByRole('button', { name: /open menu/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);

    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });

  it('reflects the open drawer state and closes via outlet context', () => {
    const onMenuClick = vi.fn();
    const onMenuClose = vi.fn();

    mockUseOutletContext.mockReturnValue({
      isMobileNavOpen: true,
      onMenuClose,
      mobileNavTriggerRef: { current: null },
    });

    render(<Navbar onMenuClick={onMenuClick} />);

    const toggle = screen.getByRole('button', { name: /close menu/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(toggle);

    expect(onMenuClose).toHaveBeenCalledTimes(1);
    expect(onMenuClick).not.toHaveBeenCalled();
  });
});
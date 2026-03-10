import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import MobileNavDrawer from './MobileNavDrawer';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => mockNavigate,
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { username: 'alex', displayName: 'Alex' }, clearUser: vi.fn() }),
}));
vi.mock('../hooks/useUnreadMessages', () => ({ useUnreadMessages: () => ({ totalUnread: 0 }) }));
vi.mock('../utils/imageUrl', () => ({ getImageUrl: (value) => value || '' }));
vi.mock('../utils/auth', () => ({ logout: vi.fn() }));
vi.mock('../utils/api', () => ({ default: { patch: vi.fn() } }));
vi.mock('../utils/themeManager', () => ({
  getQuietMode: () => false,
  setQuietMode: vi.fn(),
  getGalaxyMode: () => false,
  toggleGalaxyMode: vi.fn(() => false),
}));

describe('MobileNavDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns focus to the trigger after closing', async () => {
    const onClose = vi.fn();
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    const returnFocusRef = { current: trigger };

    const { rerender } = render(
      <MobileNavDrawer open onClose={onClose} returnFocusRef={returnFocusRef} />
    );

    expect(screen.getByRole('dialog', { name: /navigation menu/i })).toHaveFocus();

    rerender(
      <MobileNavDrawer open={false} onClose={onClose} returnFocusRef={returnFocusRef} />
    );

    await waitFor(() => expect(trigger).toHaveFocus());
    trigger.remove();
  });
});
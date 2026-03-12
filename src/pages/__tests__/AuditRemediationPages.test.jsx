import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Search from '../Search';
import Discover from '../Discover';
import Notifications from '../Notifications';

const mockNavigate = vi.fn();
const mockUseOutletContext = vi.fn();
const mockApiGet = vi.fn();
const mockApiPut = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useOutletContext: () => mockUseOutletContext(),
}));

vi.mock('../../components/Navbar', () => ({ default: () => <div data-testid="navbar" /> }));
vi.mock('../../utils/api', () => ({
  default: {
    get: (...args) => mockApiGet(...args),
    put: (...args) => mockApiPut(...args),
  },
}));
vi.mock('../../utils/logger', () => ({ default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } }));
vi.mock('../../utils/pushNotifications', () => ({ sendTestNotification: vi.fn() }));
vi.mock('../../utils/imageUrl', () => ({ getImageUrl: (value) => value || '' }));
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ isAuthReady: true, isAuthenticated: true, user: { _id: 'user-1' } }),
}));
vi.mock('../../utils/socket', () => ({ getSocket: () => null }));

describe('audit remediation pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOutletContext.mockReturnValue({ onMenuOpen: vi.fn() });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders Search results as semantic buttons', async () => {
    mockApiGet.mockImplementation((url) => {
      if (url.startsWith('/search?q=')) {
        return Promise.resolve({
          data: {
            users: [{ _id: 'user-1', username: 'alex', displayName: 'Alex' }],
            posts: [{ _id: 'post-1', content: 'Hello Pryde', author: { username: 'sam' } }],
          },
        });
      }

      if (url === '/groups') {
        return Promise.resolve({
          data: [{ _id: 'group-1', name: 'Allies', slug: 'allies', description: 'Support space' }],
        });
      }

      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    render(<Search />);

    fireEvent.change(screen.getByRole('textbox', { name: /search/i }), {
      target: { value: 'al' },
    });

    expect(await screen.findByRole('button', { name: /group: allies/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /user: alex/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /post by sam/i })).toBeInTheDocument();
  });

  it('renders Search empty state when no results are returned', async () => {
    mockApiGet.mockImplementation((url) => {
      if (url.startsWith('/search?q=')) {
        return Promise.resolve({ data: { users: [], posts: [] } });
      }

      if (url === '/groups') {
        return Promise.resolve({ data: [] });
      }

      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    render(<Search />);

    fireEvent.change(screen.getByRole('textbox', { name: /search/i }), {
      target: { value: 'zzz' },
    });

    expect(await screen.findByText('No results for "zzz"')).toBeInTheDocument();
    expect(screen.getByText(/try different keywords/i)).toBeInTheDocument();
  });

  it('renders Discover retry UI and semantic group buttons', async () => {
    mockApiGet
      .mockRejectedValueOnce(new Error('Groups failed'))
      .mockResolvedValueOnce({
        data: { groups: [{ _id: 'group-1', name: 'Allies', slug: 'allies', description: 'Support', memberCount: 4 }] },
      });

    render(<Discover />);

    fireEvent.click(await screen.findByRole('button', { name: /try again/i }));

    expect(await screen.findByRole('button', { name: /open group allies/i })).toBeInTheDocument();
  });

  it('renders Notifications empty state when there are no notifications', async () => {
    mockApiGet.mockImplementation((url) => {
      if (url === '/login-approval/pending') return Promise.resolve({ data: { approvals: [] } });
      return Promise.resolve({ data: [] });
    });

    render(<Notifications />);

    expect(await screen.findByText(/no notifications yet/i)).toBeInTheDocument();
    expect(screen.getByText(/you're all caught up for now/i)).toBeInTheDocument();
  });

  it('filters message notifications and renders remaining cards as buttons', async () => {
    mockApiGet.mockImplementation((url) => {
      if (url === '/login-approval/pending') return Promise.resolve({ data: { approvals: [] } });
      return Promise.resolve({ data: [
        { _id: 'message-1', type: 'message', message: 'Should be filtered', createdAt: '2024-01-01T00:00:00.000Z' },
        {
          _id: 'notice-1',
          type: 'like',
          sender: { displayName: 'Alex' },
          postId: 'post-1',
          createdAt: '2024-01-01T00:00:00.000Z',
          read: false,
        },
      ] });
    });

    render(<Notifications />);

    expect(await screen.findByRole('button', { name: /alex liked your post/i })).toBeInTheDocument();
    expect(screen.queryByText('Should be filtered')).toBeNull();
  });
});
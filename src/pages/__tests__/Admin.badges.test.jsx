import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Admin from '../Admin';

const mockNavigate = vi.fn();
const mockApiGet = vi.fn();
const mockUseOutletContext = vi.fn();
const mockUseLocation = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Link: ({ children, ...props }) => <a {...props}>{children}</a>,
    useNavigate: () => mockNavigate,
    useLocation: () => mockUseLocation(),
    useOutletContext: () => mockUseOutletContext(),
  };
});

vi.mock('../../components/Navbar', () => ({ default: () => <div data-testid="navbar" /> }));
vi.mock('../../components/CustomModal', () => ({ default: () => null }));
vi.mock('../../components/OptimizedImage', () => ({ default: () => <div data-testid="optimized-image" /> }));
vi.mock('../../components/admin/ModerationV3Panel', () => ({ default: () => <div data-testid="moderation-v3" /> }));
vi.mock('../../hooks/useModal', () => ({
  useModal: () => ({
    modalState: { isOpen: false },
    closeModal: vi.fn(),
    showAlert: vi.fn(),
    showConfirm: vi.fn(),
    showPrompt: vi.fn(),
  }),
}));
vi.mock('../../utils/api', () => ({
  default: {
    get: (...args) => mockApiGet(...args),
    post: vi.fn(),
    put: vi.fn(),
  },
}));
vi.mock('../../utils/auth', () => ({
  getCurrentUser: () => ({ _id: 'admin-1', role: 'admin', username: 'mod' }),
}));
vi.mock('../../utils/imageUrl', () => ({ getImageUrl: (value) => value || '' }));
vi.mock('../../utils/socketHelpers', () => ({
  getSocket: () => null,
  setupSocketListeners: () => () => {},
}));

describe('Admin page shared states', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOutletContext.mockReturnValue({ onMenuOpen: vi.fn() });
    mockUseLocation.mockReturnValue({ search: '?tab=badges' });
    mockApiGet.mockImplementation((url) => {
      if (url === '/admin/stats') {
        return Promise.resolve({ data: { users: { total: 1, active: 1 } } });
      }

      if (url === '/badges/admin/catalog') {
        return Promise.resolve({
          data: {
            automatic: {
              badges: [
                {
                  id: 'founder',
                  label: 'Founder',
                  icon: '🏳️',
                  tooltip: 'Founding member',
                  assignmentType: 'automatic',
                  type: 'platform',
                  automaticRule: 'joined_before_launch',
                },
              ],
            },
            manual: {
              badges: [
                {
                  id: 'helper',
                  label: 'Helper',
                  icon: '🤝',
                  tooltip: 'Supports others',
                  assignmentType: 'manual',
                  type: 'community',
                },
              ],
            },
          },
        });
      }

      if (url === '/badges/admin/audit-log?limit=50') {
        return Promise.resolve({
          data: {
            logs: [
              {
                _id: 'log-1',
                action: 'assigned',
                badgeLabel: 'Founder',
                username: 'alex',
                isAutomatic: true,
                createdAt: '2026-03-10T00:00:00.000Z',
                assignedBy: 'admin-1',
                assignedByUsername: 'mod',
              },
            ],
          },
        });
      }

      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });
  });

  it('shows a consistent loading state while admin access is being verified', () => {
    mockApiGet.mockImplementation((url) => {
      if (url === '/admin/stats') {
        return new Promise(() => {});
      }

      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });

    render(<Admin />);

    expect(screen.getByRole('status')).toHaveTextContent(/verifying admin access/i);
    expect(screen.getByText(/loading the admin workspace/i)).toBeInTheDocument();
  });

  it('shows a recoverable access error state when admin access is denied', async () => {
    mockApiGet.mockImplementation((url) => {
      if (url === '/admin/stats') {
        return Promise.reject({
          response: { status: 403 },
          message: 'Request failed with status code 403',
        });
      }

      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });

    render(<Admin />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/access denied\. you need admin privileges/i);
    const homeButton = screen.getByRole('button', { name: /go to home/i });
    fireEvent.click(homeButton);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('uses the shared empty-state treatment when the security tab has no logs', async () => {
    mockUseLocation.mockReturnValue({ search: '?tab=security' });
    mockApiGet.mockImplementation((url) => {
      if (url === '/admin/stats') {
        return Promise.resolve({ data: { users: { total: 1, active: 1 } } });
      }

      if (url === '/admin/security-logs?limit=50') {
        return Promise.resolve({
          data: {
            logs: [],
            stats: {
              total: 0,
              unresolved: 0,
              byType: {
                underage_registration: 0,
                underage_login: 0,
                underage_access: 0,
              },
              bySeverity: {
                critical: 0,
              },
            },
          },
        });
      }

      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });

    render(<Admin />);

    expect(await screen.findByRole('heading', { name: /security logs/i })).toBeInTheDocument();
    const emptyState = await screen.findByText(/no security logs found\./i);
    expect(emptyState.closest('.no-data')).not.toBeNull();
  });

  it('shows the dedicated security loading skeleton while security logs are loading', async () => {
    let resolveSecurityRequest;

    mockUseLocation.mockReturnValue({ search: '?tab=security' });
    mockApiGet.mockImplementation((url) => {
      if (url === '/admin/stats') {
        return Promise.resolve({ data: { users: { total: 1, active: 1 } } });
      }

      if (url === '/admin/security-logs?limit=50') {
        return new Promise((resolve) => {
          resolveSecurityRequest = resolve;
        });
      }

      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });

    render(<Admin />);

    const loadingState = await screen.findByRole('status', { name: /loading security logs/i });
    expect(loadingState).toHaveClass('loading-state', 'loading-state--stack', 'security-loading-state');

    const skeletonBlocks = loadingState.querySelectorAll('.security-loading-skeleton');
    expect(skeletonBlocks).toHaveLength(4);
    expect(skeletonBlocks[0]).toHaveClass('security-loading-skeleton', 'security-loading-skeleton--hero');

    resolveSecurityRequest({
      data: {
        logs: [],
        stats: {
          total: 0,
          unresolved: 0,
          byType: {
            underage_registration: 0,
            underage_login: 0,
            underage_access: 0,
          },
          bySeverity: {
            critical: 0,
          },
        },
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /security logs/i })).toBeInTheDocument();
    });
  });

  it('uses shared class hooks for security stats, severity pills, and action badges', async () => {
    mockUseLocation.mockReturnValue({ search: '?tab=security' });
    mockApiGet.mockImplementation((url) => {
      if (url === '/admin/stats') {
        return Promise.resolve({ data: { users: { total: 1, active: 1 } } });
      }

      if (url === '/admin/security-logs?limit=50') {
        return Promise.resolve({
          data: {
            logs: [
              {
                _id: 'sec-1',
                type: 'underage_registration',
                severity: 'critical',
                resolved: false,
                createdAt: '2026-03-10T00:00:00.000Z',
                email: 'minor@example.com',
                ipAddress: '127.0.0.1',
                details: 'Attempted signup with an underage birthday.',
                action: 'banned',
              },
            ],
            stats: {
              total: 1,
              unresolved: 1,
              byType: {
                underage_registration: 1,
                underage_login: 0,
                underage_access: 0,
              },
              bySeverity: {
                critical: 1,
              },
            },
          },
        });
      }

      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });

    render(<Admin />);

    expect(await screen.findByRole('heading', { name: /security logs/i })).toBeInTheDocument();

    const unresolvedCard = screen.getByRole('heading', { name: /unresolved/i }).closest('.stat-card');
    expect(unresolvedCard?.querySelector('.stat-number')).toHaveClass('stat-number', 'stat-number--warning');

    const underageCard = screen.getByRole('heading', { name: /underage attempts/i }).closest('.stat-card');
    expect(underageCard?.querySelector('.stat-number')).toHaveClass('stat-number', 'stat-number--danger');

    const criticalCard = screen.getByRole('heading', { name: /^critical$/i }).closest('.stat-card');
    expect(criticalCard?.querySelector('.stat-number')).toHaveClass('stat-number', 'stat-number--danger');

    expect(screen.getByText('CRITICAL')).toHaveClass('log-severity', 'log-severity--critical');
    expect(screen.getByText('BANNED')).toHaveClass('log-action-badge', 'log-action-badge--danger');
  });

  it('uses the shared empty-state treatment when the reports tab has no pending reports', async () => {
    mockUseLocation.mockReturnValue({ search: '?tab=reports' });
    mockApiGet.mockImplementation((url) => {
      if (url === '/admin/stats') {
        return Promise.resolve({ data: { users: { total: 1, active: 1 } } });
      }

      if (url === '/admin/reports?status=pending') {
        return Promise.resolve({ data: { reports: [] } });
      }

      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });

    render(<Admin />);

    expect(await screen.findByRole('heading', { name: /pending reports/i })).toBeInTheDocument();
    const emptyState = await screen.findByText(/no pending reports\./i);
    expect(emptyState.closest('.no-data')).not.toBeNull();
  });

  it('uses the shared empty-state treatment when the blocks tab has no records', async () => {
    mockUseLocation.mockReturnValue({ search: '?tab=blocks' });
    mockApiGet.mockImplementation((url) => {
      if (url === '/admin/stats') {
        return Promise.resolve({ data: { users: { total: 1, active: 1 } } });
      }

      if (url === '/admin/blocks') {
        return Promise.resolve({ data: { blocks: [] } });
      }

      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });

    render(<Admin />);

    expect(await screen.findByRole('heading', { name: /user blocks/i })).toBeInTheDocument();
    const emptyState = await screen.findByText(/no blocks found\./i);
    expect(emptyState.closest('.no-data')).not.toBeNull();
  });

  it('uses shared user table treatments for missing names and protected owners', async () => {
    mockUseLocation.mockReturnValue({ search: '?tab=users' });
    mockApiGet.mockImplementation((url) => {
      if (url === '/admin/stats') {
        return Promise.resolve({ data: { users: { total: 1, active: 1 } } });
      }

      if (url === '/admin/users') {
        return Promise.resolve({
          data: {
            users: [
              {
                _id: 'user-1',
                username: 'owner',
                fullName: '',
                identity: null,
                isAlly: false,
                email: 'owner@prydeapp.com',
                role: 'super_admin',
                badges: [],
                isBanned: false,
                isSuspended: false,
                isActive: true,
                createdAt: '2026-03-10T00:00:00.000Z',
              },
            ],
          },
        });
      }

      if (url === '/badges/admin/catalog') {
        return Promise.resolve({
          data: {
            automatic: { badges: [] },
            manual: { badges: [] },
          },
        });
      }

      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });

    render(<Admin />);

    expect(await screen.findByRole('heading', { name: /user management/i })).toBeInTheDocument();
    expect(screen.getByText(/not provided/i)).toHaveClass('identity-muted');
    expect(screen.getByText(/platform owner \(protected\)/i)).toHaveClass('platform-owner-label');
    expect(screen.getByText('owner@prydeapp.com').closest('.user-email-cell')).not.toBeNull();
    expect(screen.getByTitle(/update email address/i)).toHaveClass('btn-action', 'btn-small');
  });

  it('closes the badge management modal when escape is pressed', async () => {
    mockUseLocation.mockReturnValue({ search: '?tab=users' });
    mockApiGet.mockImplementation((url) => {
      if (url === '/admin/stats') {
        return Promise.resolve({ data: { users: { total: 1, active: 1 } } });
      }

      if (url === '/admin/users') {
        return Promise.resolve({
          data: {
            users: [
              {
                _id: 'user-1',
                username: 'owner',
                fullName: '',
                identity: null,
                isAlly: false,
                email: 'owner@prydeapp.com',
                role: 'super_admin',
                badges: [],
                isBanned: false,
                isSuspended: false,
                isActive: true,
                createdAt: '2026-03-10T00:00:00.000Z',
              },
            ],
          },
        });
      }

      if (url === '/badges/admin/catalog') {
        return Promise.resolve({
          data: {
            automatic: {
              badges: [
                {
                  id: 'founder',
                  label: 'Founder',
                  icon: '🏳️',
                  tooltip: 'Founding member',
                  assignmentType: 'automatic',
                  type: 'platform',
                },
              ],
            },
            manual: { badges: [] },
          },
        });
      }

      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });

    render(<Admin />);

    expect(await screen.findByRole('heading', { name: /user management/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /manage/i }));

    expect(await screen.findByRole('dialog', { name: /manage badges for owner/i })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /manage badges for owner/i })).not.toBeInTheDocument();
    });
  });

  it('exposes labeled controls and validation hints for manual badge assignments', async () => {
    mockUseLocation.mockReturnValue({ search: '?tab=users' });
    mockApiGet.mockImplementation((url) => {
      if (url === '/admin/stats') {
        return Promise.resolve({ data: { users: { total: 1, active: 1 } } });
      }

      if (url === '/admin/users') {
        return Promise.resolve({
          data: {
            users: [
              {
                _id: 'user-1',
                username: 'owner',
                fullName: '',
                identity: null,
                isAlly: false,
                email: 'owner@prydeapp.com',
                role: 'super_admin',
                badges: [],
                isBanned: false,
                isSuspended: false,
                isActive: true,
                createdAt: '2026-03-10T00:00:00.000Z',
              },
            ],
          },
        });
      }

      if (url === '/badges/admin/catalog') {
        return Promise.resolve({
          data: {
            automatic: { badges: [] },
            manual: {
              badges: [
                {
                  id: 'helper',
                  label: 'Helper',
                  icon: '🤝',
                  tooltip: 'Supports others',
                  assignmentType: 'manual',
                  type: 'community',
                },
              ],
            },
          },
        });
      }

      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });

    render(<Admin />);

    expect(await screen.findByRole('heading', { name: /user management/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /manage/i }));

    const badgeSelect = await screen.findByLabelText(/choose a badge to assign/i);
    fireEvent.change(badgeSelect, { target: { value: 'helper' } });

    const reasonTextarea = screen.getByLabelText(/reason for assignment/i);
    expect(reasonTextarea.getAttribute('aria-describedby')).toContain('badge-reason-help-user-1');
    expect(screen.getByText(/manual badge assignments require a short audit note/i)).toBeInTheDocument();

    const assignButton = screen.getByRole('button', { name: /assign badge/i });
    expect(assignButton).toBeDisabled();

    fireEvent.change(reasonTextarea, { target: { value: 'Helpful mod' } });

    expect(screen.getByText('11/10 characters minimum')).toBeInTheDocument();
    expect(assignButton).not.toBeDisabled();
  });

  it('renders badge cards from the admin catalog on the badges tab', async () => {
    render(<Admin />);

    expect(await screen.findByRole('heading', { name: /badge management/i })).toBeInTheDocument();
    expect(await screen.findByText('Founding member')).toBeInTheDocument();
    expect(screen.getByText('Supports others')).toBeInTheDocument();
    expect(screen.getByText('ID: founder')).toBeInTheDocument();
  });

  it('labels moderation settings and blocked-word controls explicitly', async () => {
    mockUseLocation.mockReturnValue({ search: '?tab=moderation' });
    mockApiGet.mockImplementation((url) => {
      if (url === '/admin/stats') {
        return Promise.resolve({ data: { users: { total: 1, active: 1 } } });
      }

      if (url === '/admin/moderation/settings') {
        return Promise.resolve({
          data: {
            autoMute: {
              enabled: true,
              violationThreshold: 3,
              minutesPerViolation: 30,
              maxMuteDuration: 1440,
              spamMuteDuration: 60,
            },
            toxicity: {
              pointsPerBlockedWord: 10,
              pointsForSpam: 20,
            },
            blockedWords: {
              profanity: [],
              slurs: [],
              sexual: [],
              spam: [],
              custom: ['spoiler'],
            },
          },
        });
      }

      if (url === '/admin/moderation/history?limit=50') {
        return Promise.resolve({ data: { history: [] } });
      }

      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });

    render(<Admin />);

    expect(await screen.findByRole('heading', { name: /moderation settings/i })).toBeInTheDocument();

    const autoMuteCheckbox = screen.getByRole('checkbox', { name: /enable auto-mute/i });
    expect(autoMuteCheckbox).toHaveAttribute('aria-describedby', 'moderation-auto-mute-enabled-help');

    const violationThresholdInput = screen.getByRole('spinbutton', { name: /violation threshold/i });
    expect(violationThresholdInput).toHaveAttribute('aria-describedby', 'moderation-violation-threshold-help');

    expect(screen.getByRole('button', { name: /save settings/i })).toHaveAttribute('type', 'button');

    fireEvent.click(screen.getByRole('button', { name: /blocked words/i }));

    const blockedWordInput = screen.getByLabelText(/blocked word or phrase/i);
    expect(blockedWordInput).toHaveAttribute('aria-describedby', 'moderation-blocked-word-help');

    const blockedWordCategory = screen.getByLabelText(/blocked word category/i);
    expect(blockedWordCategory).toHaveAttribute('aria-describedby', 'moderation-blocked-word-category-help');

    expect(screen.getByRole('button', { name: /add blocked word to custom category/i })).toHaveAttribute('type', 'button');
    expect(screen.getByRole('button', { name: /remove spoiler from custom/i })).toHaveAttribute('type', 'button');
  });

  it('opens the create form and loads the audit log on demand', async () => {
    render(<Admin />);

    await screen.findByRole('heading', { name: /badge management/i });

    fireEvent.click(screen.getByRole('button', { name: /create badge/i }));

    const badgeIdInput = screen.getByLabelText(/badge id/i);
    fireEvent.change(badgeIdInput, { target: { value: 'Early Member' } });
    expect(badgeIdInput).toHaveValue('early_member');

    fireEvent.click(screen.getByRole('button', { name: /audit log/i }));

    await waitFor(() => expect(mockApiGet).toHaveBeenCalledWith('/badges/admin/audit-log?limit=50'));
    const auditMeta = await screen.findByText(/by @mod/i);
    const auditRow = auditMeta.closest('.badge-audit-row');
    expect(auditRow).not.toBeNull();
    expect(auditRow.textContent).toContain('Founder');
    expect(auditRow.textContent).toContain('@alex');
    expect(screen.getAllByText('AUTO').length).toBeGreaterThan(0);
  });
});
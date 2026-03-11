import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import PasskeyLogin from './PasskeyLogin';

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  startAuthentication: vi.fn(),
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('@simplewebauthn/browser', () => ({
  startAuthentication: mocks.startAuthentication
}));

vi.mock('../utils/api', () => ({
  default: {
    get: mocks.apiGet,
    post: mocks.apiPost
  }
}));

vi.mock('../utils/logger', () => ({
  default: mocks.logger
}));

vi.mock('./PasskeyLogin.css', () => ({}));

beforeEach(() => {
  mocks.apiGet.mockReset();
  mocks.apiPost.mockReset();
  mocks.startAuthentication.mockReset();
  Object.values(mocks.logger).forEach((mockFn) => mockFn.mockReset());
});

describe('PasskeyLogin', () => {
  it('requires an email before starting passkey login', () => {
    render(<PasskeyLogin email="" />);

    fireEvent.click(screen.getByRole('button', { name: /sign in with passkey/i }));

    expect(screen.getByText(/please enter your email address first/i)).toBeInTheDocument();
    expect(mocks.apiPost).not.toHaveBeenCalled();
    expect(mocks.startAuthentication).not.toHaveBeenCalled();
  });

  it('continues after csrf preflight failure and completes the passkey login flow', async () => {
    const onSuccess = vi.fn();
    mocks.apiGet.mockRejectedValue(new Error('csrf preflight failed'));
    mocks.apiPost
      .mockResolvedValueOnce({ data: { challenge: 'challenge-1', challengeKey: 'challenge-key-1' } })
      .mockResolvedValueOnce({
        data: {
          accessToken: 'access-token-1',
          user: { id: 'user-123', username: 'pryde-user' }
        }
      });
    mocks.startAuthentication.mockResolvedValue({ id: 'credential-1' });

    render(<PasskeyLogin email="user@example.com" onSuccess={onSuccess} />);

    fireEvent.click(screen.getByRole('button', { name: /sign in with passkey/i }));

    await waitFor(() => {
      expect(mocks.apiPost).toHaveBeenNthCalledWith(1, '/passkey/login-start', { email: 'user@example.com' });
    });
    expect(mocks.logger.debug).toHaveBeenCalledWith('Passkey login CSRF preflight completed');
    expect(mocks.startAuthentication).toHaveBeenCalledWith({
      optionsJSON: { challenge: 'challenge-1', challengeKey: 'challenge-key-1' }
    });

    await waitFor(() => {
      expect(mocks.apiPost).toHaveBeenNthCalledWith(2, '/passkey/login-finish', {
        credential: { id: 'credential-1' },
        challengeKey: 'challenge-key-1'
      });
    });
    expect(onSuccess).toHaveBeenCalledWith(
      { id: 'user-123', username: 'pryde-user' },
      {
        accessToken: 'access-token-1',
        refreshToken: undefined,
        user: { id: 'user-123', username: 'pryde-user' }
      }
    );
  });
});
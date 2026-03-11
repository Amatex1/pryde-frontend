import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import PasskeySetup from './PasskeySetup';

const mocks = vi.hoisted(() => ({
  apiPost: vi.fn(),
  startRegistration: vi.fn(),
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('@simplewebauthn/browser', () => ({
  startRegistration: mocks.startRegistration
}));

vi.mock('../utils/api', () => ({
  default: {
    post: mocks.apiPost
  }
}));

vi.mock('../utils/logger', () => ({
  default: mocks.logger
}));

vi.mock('./PasskeySetup.css', () => ({}));

beforeEach(() => {
  mocks.apiPost.mockReset();
  mocks.startRegistration.mockReset();
  Object.values(mocks.logger).forEach((mockFn) => mockFn.mockReset());
});

describe('PasskeySetup', () => {
  it('creates and saves a passkey after the user names the device', async () => {
    const onSuccess = vi.fn();
    mocks.apiPost
      .mockResolvedValueOnce({ data: { challenge: 'challenge-1' } })
      .mockResolvedValueOnce({
        data: { passkey: { id: 'credential-1', deviceName: 'MacBook Pro' } }
      });
    mocks.startRegistration.mockResolvedValue({ id: 'credential-1' });

    render(<PasskeySetup onSuccess={onSuccess} />);

    fireEvent.click(screen.getByRole('button', { name: /create passkey/i }));

    await screen.findByRole('heading', { name: /name your device/i });
    fireEvent.change(screen.getByPlaceholderText(/macbook pro/i), {
      target: { value: 'MacBook Pro' }
    });
    fireEvent.click(screen.getByRole('button', { name: /save passkey/i }));

    await waitFor(() => {
      expect(mocks.apiPost).toHaveBeenNthCalledWith(2, '/passkey/register-finish', {
        credential: { id: 'credential-1' },
        deviceName: 'MacBook Pro'
      });
    });
    expect(onSuccess).toHaveBeenCalledWith({ id: 'credential-1', deviceName: 'MacBook Pro' });
  });

  it('shows a cancellation message when the browser passkey ceremony is cancelled', async () => {
    mocks.apiPost.mockResolvedValueOnce({ data: { challenge: 'challenge-1' } });
    mocks.startRegistration.mockRejectedValue({ name: 'NotAllowedError' });

    render(<PasskeySetup />);

    fireEvent.click(screen.getByRole('button', { name: /create passkey/i }));

    await screen.findByText(/passkey creation was cancelled/i);
    expect(mocks.logger.debug).toHaveBeenCalledWith('Passkey registration cancelled by user');
  });
});
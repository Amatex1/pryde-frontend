import { useState } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';
import api from '../utils/api';
import './PasskeyLogin.css';

function PasskeyLogin({ onSuccess, email }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePasskeyLogin = async () => {
    try {
      setLoading(true);
      setError('');

      // Step 0: Get CSRF token before attempting passkey login
      // Passkey endpoints require CSRF protection but user isn't logged in yet
      // Make a lightweight GET request to trigger CSRF token generation
      try {
        await api.get('/auth/status');
      } catch (csrfError) {
        // Ignore errors - we just need the CSRF token from the response header
        console.debug('CSRF token fetch completed');
      }

      // Step 1: Start authentication
      const { data: options } = await api.post('/passkey/login-start', {
        email: email || undefined
      });

      // Step 2: Prompt user for biometric/PIN
      let credential;
      try {
        // @simplewebauthn/browser v13+ requires optionsJSON wrapper
        credential = await startAuthentication({ optionsJSON: options });
      } catch (err) {
        if (err.name === 'NotAllowedError') {
          throw new Error('Passkey authentication was cancelled');
        }
        throw new Error('Failed to authenticate with passkey. Please try again.');
      }

      // Step 3: Complete authentication
      const { data } = await api.post('/passkey/login-finish', {
        credential,
        challengeKey: options.challengeKey
      });

      // 🔐 SECURITY: Pass full auth data to parent component
      // Let parent handle AuthContext.login() for proper state management
      // This ensures all auth state (tokens, user, socket) is updated consistently
      setLoading(false);

      if (onSuccess) {
        // Pass both user and full auth data for AuthContext.login()
        onSuccess(data.user, {
          accessToken: data.accessToken || data.token,
          refreshToken: data.refreshToken,
          user: data.user
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to sign in with passkey');
      setLoading(false);
    }
  };

  return (
    <div className="passkey-login">
      {error && <div className="error-message">{error}</div>}

      <button
        onClick={handlePasskeyLogin}
        disabled={loading}
        className="btn-passkey"
      >
        <span className="passkey-icon">🔐</span>
        <span>{loading ? 'Authenticating...' : 'Sign in with Passkey'}</span>
      </button>

      <div className="passkey-help">
        <p>Use your fingerprint, face, or screen lock to sign in securely</p>
      </div>
    </div>
  );
}

export default PasskeyLogin;


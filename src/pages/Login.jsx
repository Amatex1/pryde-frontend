import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { clearManualLogoutFlag } from '../utils/auth';
import { resetLogoutFlag } from '../utils/socket';
import { useAuth } from '../context/AuthContext';
import PasskeyLogin from '../components/PasskeyLogin';
import './Auth.css';

/**
 * Login Page
 * Uses AuthContext.login() for all auth state management
 */
function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [requiresPush2FA, setRequiresPush2FA] = useState(false);
  const [pushApprovalId, setPushApprovalId] = useState('');
  const [pushVerificationCode, setPushVerificationCode] = useState('');
  const [pushStatus, setPushStatus] = useState('pending');
  const [pushExpiresAt, setPushExpiresAt] = useState(null);
  const [pushTimeRemaining, setPushTimeRemaining] = useState(0);
  const [pushMessage, setPushMessage] = useState('');
  const [pushRequestDetails, setPushRequestDetails] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth(); // Get refreshUser from AuthContext
  const twoFactorInputRef = useRef(null);
  const pushCompletionStartedRef = useRef(false);
  // Theme is initialized in main.jsx - no need to set it here

  const resetTwoFactorState = useCallback(() => {
    setRequires2FA(false);
    setTempToken('');
    setTwoFactorCode('');
  }, []);

  const resetPushState = useCallback(() => {
    setRequiresPush2FA(false);
    setPushApprovalId('');
    setPushVerificationCode('');
    setPushStatus('pending');
    setPushExpiresAt(null);
    setPushTimeRemaining(0);
    setPushMessage('');
    setPushRequestDetails(null);
    pushCompletionStartedRef.current = false;
  }, []);

  const completeAuthenticatedLogin = useCallback(async (authData) => {
    await login({
      token: authData.accessToken || authData.token,
      refreshToken: authData.refreshToken,
      user: authData.user,
      countryCode: authData.countryCode,
      requiresSafetyCheck: authData.requiresSafetyCheck
    });

    navigate('/feed');
  }, [login, navigate]);

  // Check if redirected due to expired token
  useEffect(() => {
    // Clear manual logout flag when login page loads
    clearManualLogoutFlag();

    // Reset socket logout flag
    resetLogoutFlag();

    // Handle session-related redirects with calm messaging
    const reason = searchParams.get('reason');
    if (reason === 'auth_instability') {
      setError('Your session ended unexpectedly. Please sign in again.');
    } else if (searchParams.get('expired') === 'true') {
      setError('Your session timed out. You can sign in again when ready.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!requiresPush2FA || !pushExpiresAt) {
      setPushTimeRemaining(0);
      return undefined;
    }

    const updateRemaining = () => {
      const remaining = Math.max(0, Math.ceil((pushExpiresAt - Date.now()) / 1000));
      setPushTimeRemaining(remaining);

      if (remaining === 0) {
        setPushStatus(currentStatus => (currentStatus === 'pending' ? 'expired' : currentStatus));
      }
    };

    updateRemaining();
    const timerId = setInterval(updateRemaining, 1000);

    return () => clearInterval(timerId);
  }, [pushExpiresAt, requiresPush2FA]);

  useEffect(() => {
    if (!requiresPush2FA || !pushApprovalId || pushStatus === 'denied' || pushStatus === 'expired') {
      return undefined;
    }

    let cancelled = false;

    const pollApprovalStatus = async () => {
      try {
        const response = await api.get(`/login-approval/status/${pushApprovalId}`);
        if (cancelled) {
          return;
        }

        const { status, tempToken: approvedTempToken } = response.data;
        if (status) {
          setPushStatus(status);
        }

        if (status === 'approved' && approvedTempToken && !pushCompletionStartedRef.current) {
          pushCompletionStartedRef.current = true;
          setLoading(true);
          setError('');
          setPushMessage('Approval received. Signing you in…');

          try {
            const authResponse = await api.post('/auth/verify-push-login', {
              tempToken: approvedTempToken
            });

            if (!cancelled) {
              await completeAuthenticatedLogin(authResponse.data);
            }
          } catch (err) {
            if (cancelled) {
              return;
            }

            pushCompletionStartedRef.current = false;
            setLoading(false);
            setError(
              err.response?.data?.message
              || 'Approval worked, but sign-in could not be completed. Please try again.'
            );
            setPushMessage('Approval was received, but we could not complete sign-in.');
          }
        } else if (status === 'denied') {
          setLoading(false);
          setPushMessage('This sign-in request was denied on your other device.');
        } else if (status === 'expired') {
          setLoading(false);
          setPushMessage('This sign-in request expired. Please try signing in again.');
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Push approval polling error:', err);
        }
      }
    };

    pollApprovalStatus();
    const intervalId = setInterval(pollApprovalStatus, 3000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [completeAuthenticatedLogin, pushApprovalId, pushStatus, requiresPush2FA]);

  useEffect(() => {
    if (requires2FA) {
      twoFactorInputRef.current?.focus();
    }
  }, [requires2FA]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const submitLogin = useCallback(async () => {
    setError('');
    setLoading(true);
    resetTwoFactorState();
    resetPushState();

    try {
      const response = await api.post('/auth/login', formData);

      if (response.data.requires2FA) {
        setRequires2FA(true);
        setTempToken(response.data.tempToken);
        return;
      }

      if (response.data.requiresPush2FA) {
        const approvalResponse = await api.post('/login-approval/request', {
          userId: response.data.userId,
          deviceInfo: response.data.deviceInfo,
          browser: response.data.browser,
          os: response.data.os,
          ipAddress: response.data.ipAddress
        });

        setRequiresPush2FA(true);
        setPushApprovalId(approvalResponse.data.approvalId);
        setPushVerificationCode(approvalResponse.data.verificationCode);
        setPushStatus('pending');
        setPushExpiresAt(Date.now() + ((approvalResponse.data.expiresIn || 300) * 1000));
        setPushMessage(
          approvalResponse.data.message
          || response.data.message
          || 'Login approval request sent. Check your other device.'
        );
        setPushRequestDetails({
          deviceInfo: response.data.deviceInfo,
          browser: response.data.browser,
          os: response.data.os,
          ipAddress: response.data.ipAddress,
          suspicious: response.data.suspicious
        });
        return;
      }

      await completeAuthenticatedLogin(response.data);
    } catch (err) {
      console.error('Login error:', {
        status: err.response?.status,
        message: err.response?.data?.message,
        error: err.response?.data?.error,
        fullError: err
      });

      const errorMessage = err.response?.data?.message
        || err.message
        || 'That didn\'t work. You can try again in a moment.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [completeAuthenticatedLogin, formData, resetPushState, resetTwoFactorState]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submitLogin();
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/verify-2fa-login', {
        tempToken,
        token: twoFactorCode
      });

      console.log('2FA verification successful:', response.data);
      await completeAuthenticatedLogin(response.data);
    } catch (err) {
      console.error('2FA verification error:', err);
      const errorMessage = err.response?.data?.message
        || 'That code didn\'t match. You can try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const pushStatusLabel = pushStatus === 'approved'
    ? 'Approved on your other device.'
    : pushStatus === 'denied'
      ? 'Denied on your other device.'
      : pushStatus === 'expired'
        ? 'Approval expired.'
        : 'Waiting for approval…';

  const pushTimeRemainingLabel = `${Math.floor(pushTimeRemaining / 60)}:${String(pushTimeRemaining % 60).padStart(2, '0')}`;
  const pushDeviceSummary = [pushRequestDetails?.browser, pushRequestDetails?.os].filter(Boolean).join(' • ');

  return (
    <div className="auth-container">
      <div className="auth-card glossy fade-in">
        <Link to="/" className="auth-home-link">
          ← Back to home
        </Link>

        <div className="auth-header">
          <h1 className="auth-title text-shadow">✨ Pryde Social</h1>
          <p className="auth-subtitle">
            {requires2FA ? 'Enter your verification code' : requiresPush2FA ? 'Approve this sign-in' : 'Sign in'}
          </p>
          {!requires2FA && !requiresPush2FA && (
            <p className="auth-subtext">Take your time.</p>
          )}
        </div>

        {error && (
          <div
            id="login-error"
            className="error-message"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        {/* 2FA Verification Form */}
        {requires2FA ? (
          <form onSubmit={handleVerify2FA} className="auth-form">
            <div className="form-group">
              <label htmlFor="twoFactorCode">Verification code</label>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
                This is the 6-digit code from your authenticator app, or a backup code.
              </p>
              <input
                ref={twoFactorInputRef}
                type="text"
                id="twoFactorCode"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                className="form-input glossy"
                placeholder="000000"
                maxLength={6}
                style={{
                  fontSize: 'var(--font-size-2xl)',
                  textAlign: 'center',
                  letterSpacing: '10px',
                  fontWeight: 'bold'
                }}
              />
            </div>

            <button type="submit" disabled={loading || twoFactorCode.length !== 6} className="btn-primary glossy-gold">
              {loading ? 'Verifying…' : 'Verify code'}
            </button>

            <button
              type="button"
              onClick={() => {
                resetTwoFactorState();
                setLoading(false);
                setError('');
              }}
              className="btn-secondary"
              style={{ marginTop: 'var(--space-sm)', width: '100%' }}
            >
              ← Back
            </button>
          </form>
        ) : requiresPush2FA ? (
          <div className="auth-form" aria-live="polite">
            <div className="form-group">
              <label htmlFor="pushVerificationCode">Two-digit verification code</label>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
                Check one of your signed-in devices and approve this login there. Enter this code when prompted.
              </p>
              <div
                id="pushVerificationCode"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 'var(--space-md)',
                  padding: 'var(--space-md)',
                  borderRadius: 'var(--border-radius-lg)',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {pushVerificationCode.split('').map((digit, index) => (
                  <span
                    key={`${digit}-${index}`}
                    style={{
                      minWidth: '56px',
                      textAlign: 'center',
                      fontSize: 'var(--font-size-3xl)',
                      fontWeight: '700',
                      color: 'var(--color-primary)'
                    }}
                  >
                    {digit}
                  </span>
                ))}
              </div>
            </div>

            {(pushRequestDetails?.deviceInfo || pushDeviceSummary || pushRequestDetails?.ipAddress) && (
              <div
                style={{
                  padding: 'var(--space-md)',
                  borderRadius: 'var(--border-radius-lg)',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-xs)'
                }}
              >
                <strong style={{ color: 'var(--text-main)' }}>
                  {pushRequestDetails?.deviceInfo || 'Unknown device'}
                </strong>
                {pushDeviceSummary && (
                  <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                    {pushDeviceSummary}
                  </span>
                )}
                {pushRequestDetails?.ipAddress && (
                  <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                    IP: {pushRequestDetails.ipAddress}
                  </span>
                )}
                {pushRequestDetails?.suspicious && (
                  <span style={{ color: 'var(--color-danger, #dc2626)', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
                    This sign-in looks unusual. Review it carefully before approving.
                  </span>
                )}
              </div>
            )}

            <div
              style={{
                padding: 'var(--space-md)',
                borderRadius: 'var(--border-radius-lg)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                gap: 'var(--space-md)',
                alignItems: 'center',
                flexWrap: 'wrap'
              }}
            >
              <strong style={{ color: 'var(--text-main)' }}>{pushStatusLabel}</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                Expires in {pushTimeRemainingLabel}
              </span>
            </div>

            {pushMessage && (
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', lineHeight: 1.5 }}>
                {pushMessage}
              </p>
            )}

            {(pushStatus === 'denied' || pushStatus === 'expired') && (
              <button
                type="button"
                onClick={submitLogin}
                disabled={loading}
                className="btn-primary glossy-gold"
              >
                {loading ? 'Trying again…' : 'Try again'}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                resetPushState();
                setLoading(false);
                setError('');
              }}
              className="btn-secondary"
              style={{ width: '100%' }}
            >
              ← Back
            </button>
          </div>
        ) : (
          // Normal Login Form
          <form onSubmit={handleSubmit} className="auth-form" aria-label="Login form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-input glossy"
              placeholder="Your email"
              autoComplete="email"
              aria-required="true"
              aria-invalid={error && error.toLowerCase().includes('email') ? 'true' : 'false'}
              aria-describedby={error && error.toLowerCase().includes('email') ? 'login-error' : undefined}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="form-input glossy"
              placeholder="Your password"
              autoComplete="current-password"
              aria-required="true"
              aria-invalid={error && error.toLowerCase().includes('password') ? 'true' : 'false'}
              aria-describedby={error && error.toLowerCase().includes('password') ? 'login-error' : undefined}
            />
            <div className="forgot-password-link">
              <Link to="/forgot-password" className="auth-link-muted">
                Forgot password?
              </Link>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary glossy-gold">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <PasskeyLogin
            email={formData.email}
            onSuccess={async (userData, authData) => {
              await completeAuthenticatedLogin({
                user: userData,
                ...authData
              });
            }}
          />
        </form>
        )}

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register" className="auth-link">Sign up</Link></p>
          <div className="auth-legal-links">
            <Link to="/terms">Terms</Link>
            <span>•</span>
            <Link to="/privacy">Privacy</Link>
            <span>•</span>
            <Link to="/community">Guidelines</Link>
            <span>•</span>
            <Link to="/safety">Safety</Link>
            <span>•</span>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

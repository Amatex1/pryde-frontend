import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. Please check your email and try again.');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token) => {
    try {
      const response = await api.get(`/auth/verify-email/${token}`);

      setStatus('success');
      setMessage(response.data.message || 'Email verified successfully!');

      // Refresh user data to update emailVerified status
      // This ensures the verification banner won't show anymore
      try {
        await refreshUser();
        // Clear the banner dismissal flag since email is now verified
        localStorage.removeItem('emailVerificationBannerDismissed');
      } catch (refreshError) {
        console.error('Failed to refresh user after verification:', refreshError);
      }

      // Redirect to feed after 3 seconds
      setTimeout(() => {
        navigate('/feed');
      }, 3000);
    } catch (error) {
      console.error('Email verification error:', error);
      setStatus('error');
      setMessage(
        error.response?.data?.message ||
        'Failed to verify email. The link may have expired.'
      );
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glossy fade-in">
        <Link to="/" className="auth-home-link">
          ← Back to home
        </Link>

        <div className="auth-header">
          <h1 className="auth-title text-shadow">✨ Pryde Social</h1>
          <p className="auth-subtitle">Email Verification</p>
        </div>

        {status === 'verifying' && (
          <div className="verification-status">
            <div className="verification-spinner" />
            <p>Verifying your email address...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="verification-status">
            <div className="verification-icon verification-icon--success">✓</div>
            <h3>Email Verified!</h3>
            <p>{message}</p>
            <p className="verification-redirect">Redirecting you to the feed...</p>
            <Link to="/feed" className="btn-primary" style={{ display: 'inline-block', marginTop: 'var(--space-lg)' }}>
              Go to Feed Now
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="verification-status">
            <div className="verification-icon verification-icon--error">✕</div>
            <h3>Verification Failed</h3>
            <p>{message}</p>
            <div className="verification-actions">
              <Link to="/settings" className="btn-primary">
                Go to Settings
              </Link>
              <Link to="/feed" className="btn-secondary">
                Go to Feed
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;


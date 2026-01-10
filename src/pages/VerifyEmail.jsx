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
        <div className="auth-header">
          <h1 className="auth-title text-shadow">✨ Pryde Social</h1>
          <h2>Email Verification</h2>
        </div>

        {status === 'verifying' && (
          <div className="verification-status">
            <div className="spinner"></div>
            <p>Verifying your email address...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="verification-status success">
            <div className="success-icon">✓</div>
            <h3>Email Verified!</h3>
            <p>{message}</p>
            <p className="redirect-message">Redirecting you to the feed...</p>
            <Link to="/feed" className="btn-primary">
              Go to Feed Now
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="verification-status error">
            <div className="error-icon">✕</div>
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

      <style>{`
        .verification-status {
          text-align: center;
          padding: 2rem;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(108, 92, 231, 0.2);
          border-top-color: var(--pryde-purple);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1.5rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .success-icon,
        .error-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          margin: 0 auto 1.5rem;
          font-weight: bold;
        }

        .success-icon {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
        }

        .error-icon {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
        }

        .verification-status h3 {
          margin: 0 0 1rem 0;
          color: var(--text-main);
        }

        .verification-status p {
          color: var(--text-muted);
          margin: 0.5rem 0;
        }

        .redirect-message {
          font-size: 0.9rem;
          margin-top: 1rem !important;
        }

        .verification-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 2rem;
        }
      `}</style>
    </div>
  );
}

export default VerifyEmail;


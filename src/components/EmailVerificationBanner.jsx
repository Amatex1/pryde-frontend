import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './EmailVerificationBanner.css';

function EmailVerificationBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(
    localStorage.getItem('emailVerificationBannerDismissed') === 'true'
  );
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  // Don't show if user is verified or banner is dismissed
  if (!user || user.emailVerified || dismissed) {
    return null;
  }

  const handleResendEmail = async () => {
    setSending(true);
    setMessage('');

    try {
      const response = await api.post('/auth/resend-verification');
      setMessage('✅ Verification email sent! Check your inbox.');
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      console.error('Resend verification error:', error);
      setMessage('❌ Failed to send email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('emailVerificationBannerDismissed', 'true');
  };

  return (
    <div className="email-verification-banner">
      <div className="email-verification-content">
        <div className="email-verification-icon">📧</div>
        <div className="email-verification-text">
          <h3>Verify Your Email</h3>
          <p>
            Please verify your email address to create posts and comments. 
            Check your inbox for the verification link.
          </p>
          {message && <p className="verification-message">{message}</p>}
        </div>
        <div className="email-verification-actions">
          <button 
            onClick={handleResendEmail} 
            className="btn-resend"
            disabled={sending}
          >
            {sending ? 'Sending...' : 'Resend Email'}
          </button>
          <button onClick={handleDismiss} className="btn-dismiss">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmailVerificationBanner;


import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './Auth.css';

/**
 * InviteRequired Page (Phase 7B)
 * 
 * Shown when someone tries to register without an invite code.
 * Explains why Pryde is invite-only and provides a calm way to validate an invite.
 */
function InviteRequired() {
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleValidateInvite = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!inviteCode.trim()) {
      setError('Please enter an invite code.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/invites/validate', { 
        code: inviteCode.trim() 
      });

      if (response.data.valid) {
        // Redirect to register with the validated invite code
        navigate(`/register?invite=${encodeURIComponent(inviteCode.trim().toUpperCase())}`);
      } else {
        setError(response.data.message || 'This invite code is not valid.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to validate invite. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glossy">
        <div className="auth-logo">
          <img 
            src="/pryde-logo.webp" 
            alt="Pryde Logo" 
            className="logo-img"
            onError={(e) => { e.target.src = '/pryde-logo.png'; }}
          />
        </div>

        <h1 className="auth-title">Pryde is Invite-Only</h1>

        <div className="invite-explanation">
          <p className="invite-main-text">
            We're building something different — a calm, safe space for the LGBTQ+ community.
          </p>
          
          <div className="invite-values">
            <div className="invite-value-item">
              <span className="invite-value-icon">🌿</span>
              <span>No algorithms fighting for your attention</span>
            </div>
            <div className="invite-value-item">
              <span className="invite-value-icon">🔒</span>
              <span>No data selling or surveillance</span>
            </div>
            <div className="invite-value-item">
              <span className="invite-value-icon">💜</span>
              <span>A community that grows with intention</span>
            </div>
          </div>

          <p className="invite-secondary-text">
            To join Pryde, you'll need an invite from someone who trusts you to be part of this space.
          </p>
        </div>

        <form onSubmit={handleValidateInvite} className="invite-form">
          <div className="form-group">
            <label htmlFor="inviteCode">Have an invite code?</label>
            <input
              type="text"
              id="inviteCode"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="PRYDE-XXXX-XXXX-XXXX"
              className="form-input"
              autoComplete="off"
              disabled={loading}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button 
            type="submit" 
            className="btn-primary btn-full"
            disabled={loading || !inviteCode.trim()}
          >
            {loading ? 'Validating...' : 'Continue with Invite'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>

        <div className="invite-footer">
          <p className="invite-footer-text">
            Don't have an invite? Ask a friend who's already on Pryde, 
            or check back later as we grow.
          </p>
        </div>
      </div>
    </div>
  );
}

export default InviteRequired;


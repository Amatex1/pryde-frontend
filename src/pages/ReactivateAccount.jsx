/**
 * ReactivateAccount.jsx
 * Screen shown to deactivated users after login attempt
 * Allows users to reactivate their account or log out
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { logout, getCurrentUser } from '../utils/auth';
import { initializeSocket } from '../utils/socket';
import './ReactivateAccount.css';

function ReactivateAccount() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const currentUser = getCurrentUser();

  const handleReactivate = async () => {
    setLoading(true);
    setError('');

    try {
      // Call reactivate endpoint
      const response = await api.put('/users/reactivate');
      
      if (response.data) {
        // Update local user state if needed
        const storedUser = getCurrentUser();
        if (storedUser) {
          storedUser.isActive = true;
          localStorage.setItem('user', JSON.stringify(storedUser));
        }

        // Reconnect socket
        if (storedUser && (storedUser.id || storedUser._id)) {
          initializeSocket(storedUser.id || storedUser._id);
        }

        // Redirect to feed
        navigate('/feed');
      }
    } catch (err) {
      console.error('Reactivation failed:', err);
      setError(err.response?.data?.message || 'Failed to reactivate account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="reactivate-page">
      <div className="reactivate-container glossy">
        <div className="reactivate-icon">🔒</div>
        
        <h1 className="reactivate-title">Your account is currently deactivated</h1>
        
        <p className="reactivate-description">
          Your profile, posts, and messages are hidden until reactivated.
          You can restore your account at any time.
        </p>

        {currentUser && (
          <p className="reactivate-user">
            Logged in as <strong>@{currentUser.username}</strong>
          </p>
        )}

        {error && (
          <div className="reactivate-error">
            {error}
          </div>
        )}

        <div className="reactivate-actions">
          <button
            className="btn-reactivate"
            onClick={handleReactivate}
            disabled={loading}
          >
            {loading ? 'Reactivating...' : '✨ Reactivate my account'}
          </button>

          <button
            className="btn-logout-secondary"
            onClick={handleLogout}
            disabled={loading}
          >
            Log out
          </button>
        </div>

        <p className="reactivate-help">
          Need help? <a href="/contact">Contact Support</a>
        </p>
      </div>
    </div>
  );
}

export default ReactivateAccount;


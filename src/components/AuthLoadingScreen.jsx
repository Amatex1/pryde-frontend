/**
 * AuthLoadingScreen - Global Auth Verification Loading Screen
 * 
 * 🔥 CRITICAL: This screen blocks ALL UI until auth verification completes
 * 
 * Rules:
 * - Shown when authLoading === true
 * - Prevents any protected UI or API calls
 * - Only /auth/me is allowed during this phase
 * - Neutral design (no user-specific content)
 * 
 * This prevents:
 * - Premature API calls
 * - "Unknown User" flashes
 * - 401 spam during login
 * - Race conditions
 */

import { useState, useEffect } from 'react';
import './AuthLoadingScreen.css';

function AuthLoadingScreen() {
  const [showReload, setShowReload] = useState(false);

  useEffect(() => {
    // If auth verification takes more than 10 seconds, show reload button
    const timeout = setTimeout(() => {
      setShowReload(true);
    }, 10000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="auth-loading-screen">
      <div className="auth-loading-content">
        {/* Spinner */}
        <div className="auth-loading-spinner"></div>
        
        {/* Loading text */}
        <p className="auth-loading-text">Verifying authentication...</p>

        {/* Reload button (shown after 10 seconds) */}
        {showReload && (
          <div className="auth-loading-reload">
            <p className="auth-loading-reload-text">
              Taking longer than expected...
            </p>
            <button
              onClick={() => window.location.reload()}
              className="auth-loading-reload-button"
            >
              Reload Page
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthLoadingScreen;


/**
 * QuietReturnToast - Calm Onboarding Phase 4
 * 
 * Shows a soft, dismissible toast for returning users who have been
 * inactive for 14-30 days. Auto-dismisses after 5 seconds.
 * Only shown once per inactivity window.
 * 
 * Message: "Welcome back. You don't need to post to be part of Pryde."
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import './QuietReturnToast.css';

function QuietReturnToast() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Check if user should see quiet return message
  useEffect(() => {
    const checkQuietReturn = async () => {
      try {
        const response = await api.get('/auth/onboarding/quiet-return');
        if (response.data?.showQuietReturn) {
          setIsVisible(true);
          
          // Mark as shown immediately to prevent duplicate shows
          await api.post('/auth/onboarding/quiet-return-shown');
          
          // Auto-dismiss after 5 seconds
          setTimeout(() => {
            handleDismiss();
          }, 5000);
        }
      } catch (error) {
        // Silently fail - don't disrupt user experience
        console.debug('Quiet return check failed:', error.message);
      }
    };

    // Small delay to let the page settle before showing
    const timer = setTimeout(checkQuietReturn, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
    }, 300);
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className={`quiet-return-toast ${isClosing ? 'quiet-return-closing' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="quiet-return-content">
        <span className="quiet-return-message">
          Welcome back. You don't need to post to be part of Pryde.
        </span>
        <button
          className="quiet-return-dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss message"
          type="button"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default QuietReturnToast;


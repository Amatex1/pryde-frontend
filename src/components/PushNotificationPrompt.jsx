import { useState, useEffect } from 'react';
import { subscribeToPushNotifications } from '../utils/pushNotifications';
import './PushNotificationPrompt.css';

const STORAGE_KEY = 'pryde_push_prompt_shown';
const DELAY_MS = 4000; // Show 4 seconds after login so it's not the first thing they see

export default function PushNotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Don't show if: already asked, permission already set, or browser doesn't support it
    if (!('Notification' in window)) return;
    if (!('serviceWorker' in navigator)) return;
    if (Notification.permission !== 'default') return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'dismissed');
    setVisible(false);
  };

  const handleEnable = async () => {
    setLoading(true);
    const success = await subscribeToPushNotifications();
    localStorage.setItem(STORAGE_KEY, success ? 'granted' : 'dismissed');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="push-prompt-overlay" role="dialog" aria-modal="true" aria-label="Enable notifications">
      <div className="push-prompt">
        <div className="push-prompt-icon">🔔</div>
        <h2 className="push-prompt-title">Stay in the loop</h2>
        <p className="push-prompt-body">
          Get notified about messages, friend requests, and activity — even when Pryde isn't open.
        </p>
        <div className="push-prompt-actions">
          <button
            className="push-prompt-btn primary"
            onClick={handleEnable}
            disabled={loading}
          >
            {loading ? 'Enabling…' : 'Enable Notifications'}
          </button>
          <button
            className="push-prompt-btn secondary"
            onClick={dismiss}
            disabled={loading}
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}

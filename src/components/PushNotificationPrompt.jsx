import { useState, useEffect } from 'react';
import { subscribeToPushNotifications } from '../utils/pushNotifications';
import './PushNotificationPrompt.css';

const STORAGE_KEY = 'pryde_push_prompt_shown';
const IOS_INSTALL_KEY = 'pryde_ios_install_prompt_shown';
const DELAY_MS = 4000;

/* -------------------------------------------
   PLATFORM DETECTION HELPERS
--------------------------------------------*/
function isIOS() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function isStandalone() {
  // navigator.standalone is Apple-specific (true when launched from home screen)
  // display-mode: standalone covers iOS 16.4+ PWA and Android Chrome
  return navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
}

function getIOSVersion() {
  const match = navigator.userAgent.match(/OS (\d+)_(\d+)/);
  return match ? parseFloat(`${match[1]}.${match[2]}`) : null;
}

/* -------------------------------------------
   COMPONENT
--------------------------------------------*/
export default function PushNotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const iOS = isIOS();
    const standalone = isStandalone();

    if (iOS && !standalone) {
      // iOS Safari browser — show "Add to Home Screen" guide instead
      // iOS doesn't support Web Push in browser mode, only in installed PWA
      if (localStorage.getItem(IOS_INSTALL_KEY)) return;
      const timer = setTimeout(() => setShowIOSGuide(true), DELAY_MS);
      return () => clearTimeout(timer);
    }

    if (iOS && standalone) {
      // iOS PWA (added to home screen) — only iOS 16.4+ supports Web Push
      const version = getIOSVersion();
      if (version !== null && version < 16.4) return; // too old, silently skip
    }

    // Standard flow: Android, Desktop, iOS 16.4+ standalone
    if (!('Notification' in window)) return;
    if (!('serviceWorker' in navigator)) return;
    if (Notification.permission !== 'default') return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  /* --- Standard notification prompt handlers --- */
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

  /* --- iOS install guide handlers --- */
  const dismissIOSGuide = () => {
    localStorage.setItem(IOS_INSTALL_KEY, 'dismissed');
    setShowIOSGuide(false);
  };

  /* --- iOS install guide --- */
  if (showIOSGuide) {
    return (
      <div className="push-prompt-overlay" role="dialog" aria-modal="true" aria-label="Install Pryde for notifications">
        <div className="push-prompt push-prompt--ios">
          <div className="push-prompt-icon">📲</div>
          <h2 className="push-prompt-title">Get notifications on iPhone</h2>
          <p className="push-prompt-body">
            Add Pryde to your home screen to receive notifications — even when the app is closed.
          </p>
          <ol className="ios-install-steps">
            <li>
              <span className="ios-step-icon">
                {/* Safari share icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
              </span>
              Tap the <strong>Share</strong> button at the bottom of Safari
            </li>
            <li>
              <span className="ios-step-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="3" ry="3"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </span>
              Tap <strong>Add to Home Screen</strong>
            </li>
            <li>
              <span className="ios-step-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>
              Tap <strong>Add</strong>, then open Pryde from your home screen
            </li>
          </ol>
          <div className="push-prompt-actions">
            <button
              className="push-prompt-btn secondary"
              onClick={dismissIOSGuide}
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* --- Standard notification prompt (Android, Desktop, iOS 16.4+ standalone) --- */
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

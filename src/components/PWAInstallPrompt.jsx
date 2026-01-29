import { useState, useEffect } from 'react';
import { promptInstall, isPWA, isInstallPromptAvailable } from '../utils/pwa';
import './PWAInstallPrompt.css';

// How often to show the install prompt after dismissal (in days)
const PROMPT_INTERVAL_DAYS = 7;

function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed or dismissed this session
    if (isPWA() || dismissed) {
      return;
    }

    // Check if user has dismissed before and if enough time has passed
    const dismissedTimestamp = localStorage.getItem('pwa-install-dismissed-at');
    if (dismissedTimestamp) {
      const dismissedDate = new Date(parseInt(dismissedTimestamp, 10));
      const now = new Date();
      const daysSinceDismissed = (now - dismissedDate) / (1000 * 60 * 60 * 24);

      // If not enough time has passed, don't show
      if (daysSinceDismissed < PROMPT_INTERVAL_DAYS) {
        console.log(`[PWA] Install prompt dismissed ${daysSinceDismissed.toFixed(1)} days ago, waiting ${PROMPT_INTERVAL_DAYS} days`);
        setDismissed(true);
        return;
      } else {
        // Enough time has passed, clear the old dismissal
        console.log(`[PWA] ${daysSinceDismissed.toFixed(1)} days since dismissal, showing prompt again`);
        localStorage.removeItem('pwa-install-dismissed-at');
      }
    }

    // 🔥 Check if install prompt was already captured before this component mounted
    // This handles the case where beforeinstallprompt fired before React rendered
    if (isInstallPromptAvailable()) {
      console.log('[PWA] Install prompt already available on mount');
      setShowPrompt(true);
    }

    // Listen for install availability
    const handleInstallAvailable = () => {
      console.log('[PWA] Install available event received');
      setShowPrompt(true);
    };

    const handleInstallCompleted = () => {
      setShowPrompt(false);
    };

    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-install-completed', handleInstallCompleted);

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-install-completed', handleInstallCompleted);
    };
  }, [dismissed]);

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    // Store timestamp instead of boolean so we can show again after interval
    localStorage.setItem('pwa-install-dismissed-at', Date.now().toString());
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="pwa-install-prompt">
      <div className="pwa-install-content">
        <div className="pwa-install-icon">
          <img src="/pryde-logo.png" alt="Pryde Social" />
        </div>
        <div className="pwa-install-text">
          <h3>Install Pryde Social</h3>
          <p>Get the full app experience! Install Pryde Social on your device for faster access and offline support.</p>
        </div>
        <div className="pwa-install-actions">
          <button onClick={handleInstall} className="pwa-install-btn">
            Install App
          </button>
          <button onClick={handleDismiss} className="pwa-dismiss-btn">
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default PWAInstallPrompt;


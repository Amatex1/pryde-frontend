import { refreshAccessToken } from '../utils/auth';
import './UpdateBanner.css';

/**
 * Banner component shown when a new app version is deployed
 * Handles cache clearing and service worker reset while keeping user logged in
 */
export default function UpdateBanner({ onClose }) {
  const handleRefresh = async () => {
    try {
      // Refresh auth token so user stays logged in after reload
      await refreshAccessToken();

      // Unregister ALL service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log(`🗑️ Unregistering ${registrations.length} service workers...`);
        for (const reg of registrations) {
          await reg.unregister();
        }
      }

      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        console.log(`🗑️ Clearing ${cacheNames.length} caches...`);
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      console.log('✅ All caches cleared, reloading...');

      // Force reload from network with cache-busting
      const timestamp = Date.now();
      window.location.href = `${window.location.origin}${window.location.pathname}?v=${timestamp}`;
    } catch (err) {
      console.error('Update refresh failed:', err);
      // Still reload even if token refresh fails
      window.location.reload(true);
    }
  };

  return (
    <div className="update-banner">
      <div className="update-banner-content">
        <span className="emoji">🎉</span>
        <div className="update-banner-text">
          <strong>New update available</strong>
          <p>A new version of Pryde Social is ready.</p>
        </div>
      </div>

      <div className="update-banner-actions">
        <button className="update-btn primary" onClick={handleRefresh}>
          Refresh Now
        </button>
        <button className="update-btn secondary" onClick={onClose}>
          Later
        </button>
      </div>
    </div>
  );
}


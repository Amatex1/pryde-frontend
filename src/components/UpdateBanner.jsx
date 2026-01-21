import { useState } from 'react';
import { refreshBeforeUpdate } from '../utils/auth';
import './UpdateBanner.css';

/**
 * Keys to preserve in localStorage during update (auth-related)
 * Everything else gets cleared to ensure fresh state
 */
const PRESERVED_KEYS = [
  'accessToken',
  'refreshToken',
  'user',
  'pryde_auth_token',
  'pryde_refresh_token',
  'pryde_user',
  'theme',
  'quietMode'
];

/**
 * Banner component shown when a new app version is deployed
 * Handles cache clearing and service worker reset while keeping user logged in
 */
export default function UpdateBanner({ onClose }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRefresh = async () => {
    setIsUpdating(true);
    console.log('🔄 Starting update process...');

    try {
      // 1. Refresh auth token so user stays logged in after reload
      console.log('🔑 Refreshing auth token...');
      await refreshBeforeUpdate().catch(err => {
        console.warn('⚠️ Token refresh failed (will continue anyway):', err);
      });

      // 2. Unregister ALL service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log(`🗑️ Unregistering ${registrations.length} service workers...`);
        for (const reg of registrations) {
          await reg.unregister();
        }
      }

      // 3. Clear all Cache API caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        console.log(`🗑️ Clearing ${cacheNames.length} Cache API caches...`);
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      // 4. Clear localStorage except auth keys
      console.log('🗑️ Clearing localStorage (preserving auth)...');
      const preservedData = {};
      PRESERVED_KEYS.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) preservedData[key] = value;
      });
      localStorage.clear();
      Object.entries(preservedData).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });

      // 5. Clear sessionStorage (stores temporary state)
      console.log('🗑️ Clearing sessionStorage...');
      sessionStorage.clear();

      // 6. Clear IndexedDB databases (except for auth-related)
      if ('indexedDB' in window) {
        try {
          const databases = await indexedDB.databases?.() || [];
          console.log(`🗑️ Clearing ${databases.length} IndexedDB databases...`);
          for (const db of databases) {
            if (db.name && !db.name.includes('auth')) {
              indexedDB.deleteDatabase(db.name);
            }
          }
        } catch (e) {
          console.warn('⚠️ IndexedDB clear failed (non-critical):', e);
        }
      }

      console.log('✅ All caches cleared, reloading...');

      // 7. Force reload from network with cache-busting timestamp
      const timestamp = Date.now();
      window.location.href = `${window.location.origin}${window.location.pathname}?v=${timestamp}`;
    } catch (err) {
      console.error('❌ Update process failed:', err);
      setIsUpdating(false);
      // Still try to reload even if something fails
      window.location.reload(true);
    }
  };

  return (
    <div className="update-banner">
      <div className="update-banner-content">
        <span className="emoji">{isUpdating ? '⏳' : '🎉'}</span>
        <div className="update-banner-text">
          <strong>{isUpdating ? 'Updating...' : 'New update available'}</strong>
          <p>{isUpdating ? 'Clearing caches and refreshing...' : 'A new version of Pryde Social is ready.'}</p>
        </div>
      </div>

      <div className="update-banner-actions">
        <button
          className="update-btn primary"
          onClick={handleRefresh}
          disabled={isUpdating}
        >
          {isUpdating ? 'Updating...' : 'Refresh Now'}
        </button>
        <button
          className="update-btn secondary"
          onClick={onClose}
          disabled={isUpdating}
        >
          Later
        </button>
      </div>
    </div>
  );
}


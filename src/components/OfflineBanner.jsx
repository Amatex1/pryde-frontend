/**
 * Offline Banner Component
 * 
 * 📴 Subtle banner shown when app is offline
 * 
 * Features:
 * - Shows when app goes offline
 * - Hides when app comes back online
 * - Shows offline duration
 * - Non-intrusive design
 */

import { useState, useEffect } from 'react';
import { isAppOffline, onOffline, onReconnect, getOfflineDuration } from '../utils/offlineManager';
import '../styles/OfflineBanner.css';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(isAppOffline());
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    // Subscribe to offline events
    const unsubscribeOffline = onOffline(() => {
      setOffline(true);
    });

    // Subscribe to reconnect events
    const unsubscribeReconnect = onReconnect(() => {
      setOffline(false);
      setDuration(0);
    });

    // Update duration every second while offline
    const interval = setInterval(() => {
      if (isAppOffline()) {
        setDuration(getOfflineDuration());
      }
    }, 1000);

    return () => {
      unsubscribeOffline();
      unsubscribeReconnect();
      clearInterval(interval);
    };
  }, []);

  if (!offline) return null;

  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return (
    <div className="offline-banner">
      <div className="offline-banner-content">
        <span className="offline-icon">📴</span>
        <div className="offline-text">
          <strong>You're offline</strong>
          {duration > 0 && (
            <span className="offline-duration">
              {minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}


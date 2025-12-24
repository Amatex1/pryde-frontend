import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/apiClient';
import logger from '../utils/logger';

/**
 * useUnreadMessages Hook - SINGLETON PATTERN
 *
 * Prevents duplicate polling by using a shared state across all instances.
 * Only one timer runs globally, all components share the same count.
 *
 * Features:
 * - Singleton polling (prevents request storms)
 * - Shared state across all hook instances
 * - Hard guard against rapid fetches (2 min minimum)
 * - Cached responses (60s TTL)
 * - 3-minute polling interval
 *
 * @returns {number} count - The number of unread messages
 */

// Shared state across all hook instances (SINGLETON)
let unreadCache = {
  totalUnread: 0,
  unreadByUser: []
};
let lastFetch = 0;
const listeners = new Set();
let globalInterval = null;

/**
 * Fetch unread count (singleton - only one fetch at a time)
 */
async function fetchUnread() {
  const now = Date.now();

  // Hard guard: prevent fetches more frequent than 2 minutes
  if (now - lastFetch < 120_000) {
    logger.debug('[useUnreadMessages] Skipping fetch (too soon)');
    return;
  }

  lastFetch = now;
  logger.debug('[useUnreadMessages] Fetching unread count...');

  const data = await apiFetch(
    '/messages/unread/counts',
    {},
    { cacheTtl: 60_000 } // 1 minute cache
  );

  if (!data) {
    logger.warn('[useUnreadMessages] Failed to fetch unread count');
    return;
  }

  const newData = {
    totalUnread: data.totalUnread || 0,
    unreadByUser: data.unreadByUser || []
  };

  // Only update if data changed
  if (newData.totalUnread !== unreadCache.totalUnread ||
      JSON.stringify(newData.unreadByUser) !== JSON.stringify(unreadCache.unreadByUser)) {
    unreadCache = newData;
    logger.debug(`[useUnreadMessages] Data updated:`, newData);

    // Notify all listeners
    listeners.forEach(fn => fn(unreadCache));
  }
}

/**
 * Start global polling interval (singleton)
 */
function startPolling() {
  if (globalInterval) return; // Already polling

  logger.debug('[useUnreadMessages] Starting global polling (3 min interval)');
  globalInterval = setInterval(fetchUnread, 180_000); // 3 minutes
}

/**
 * Stop global polling interval
 */
function stopPolling() {
  if (globalInterval) {
    clearInterval(globalInterval);
    globalInterval = null;
    logger.debug('[useUnreadMessages] Stopped global polling');
  }
}

/**
 * Hook to access unread message data
 * @returns {{ totalUnread: number, unreadByUser: Array }} Unread message data
 */
export function useUnreadMessages() {
  const [data, setData] = useState(unreadCache);

  useEffect(() => {
    // Register listener
    listeners.add(setData);
    logger.debug(`[useUnreadMessages] Listener added (total: ${listeners.size})`);

    // Fetch immediately if cache is stale
    fetchUnread();

    // Start polling if this is the first listener
    if (listeners.size === 1) {
      startPolling();
    }

    return () => {
      // Unregister listener
      listeners.delete(setData);
      logger.debug(`[useUnreadMessages] Listener removed (remaining: ${listeners.size})`);

      // Stop polling if no more listeners
      if (listeners.size === 0) {
        stopPolling();
      }
    };
  }, []);

  return data;
}

/**
 * Manually refresh unread count (bypasses cache and guards)
 */
export function refreshUnreadCount() {
  lastFetch = 0; // Reset guard
  return fetchUnread();
}


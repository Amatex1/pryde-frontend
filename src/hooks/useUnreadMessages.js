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
let unreadCache = 0;
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

  const newCount = data.count || 0;

  // Only update if count changed
  if (newCount !== unreadCache) {
    unreadCache = newCount;
    logger.debug(`[useUnreadMessages] Count updated: ${newCount}`);

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
 * Hook to access unread message count
 */
export function useUnreadMessages() {
  const [count, setCount] = useState(unreadCache);

  useEffect(() => {
    // Register listener
    listeners.add(setCount);
    logger.debug(`[useUnreadMessages] Listener added (total: ${listeners.size})`);

    // Fetch immediately if cache is stale
    fetchUnread();

    // Start polling if this is the first listener
    if (listeners.size === 1) {
      startPolling();
    }

    return () => {
      // Unregister listener
      listeners.delete(setCount);
      logger.debug(`[useUnreadMessages] Listener removed (remaining: ${listeners.size})`);

      // Stop polling if no more listeners
      if (listeners.size === 0) {
        stopPolling();
      }
    };
  }, []);

  return count;
}

/**
 * Manually refresh unread count (bypasses cache and guards)
 */
export function refreshUnreadCount() {
  lastFetch = 0; // Reset guard
  return fetchUnread();
}


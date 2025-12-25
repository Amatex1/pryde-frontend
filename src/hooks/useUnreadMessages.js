import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/apiClient';
import logger from '../utils/logger';
import { isAuthConfirmed, subscribeToAuthStatus, AUTH_STATUS } from '../state/authStatus';

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
 * - 🔥 AUTH-GATED: Only polls when user is authenticated
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
let authUnsubscribe = null;

/**
 * Fetch unread count (singleton - only one fetch at a time)
 */
async function fetchUnread() {
  // 🔥 CRITICAL: Do NOT fetch if user is not authenticated
  // This prevents 401 errors from setInterval polling
  if (!isAuthConfirmed()) {
    logger.debug('[useUnreadMessages] Skipping fetch (not authenticated)');
    return;
  }

  const now = Date.now();

  // Hard guard: prevent fetches more frequent than 2 minutes
  if (now - lastFetch < 120_000) {
    logger.debug('[useUnreadMessages] Skipping fetch (too soon)');
    return;
  }

  lastFetch = now;
  logger.debug('[useUnreadMessages] Fetching unread count...');

  try {
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
  } catch (error) {
    // Silently handle auth errors - user may have logged out
    if (error?.response?.status === 401) {
      logger.debug('[useUnreadMessages] Auth error (401) - user may be logged out');
    } else {
      logger.warn('[useUnreadMessages] Fetch error:', error);
    }
  }
}

/**
 * Start global polling interval (singleton)
 */
function startPolling() {
  if (globalInterval) return; // Already polling

  // 🔥 Only start polling if authenticated
  if (!isAuthConfirmed()) {
    logger.debug('[useUnreadMessages] Not starting polling (not authenticated)');
    return;
  }

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
 * Clear cached data (called on logout)
 */
function clearCache() {
  unreadCache = { totalUnread: 0, unreadByUser: [] };
  lastFetch = 0;
  listeners.forEach(fn => fn(unreadCache));
  logger.debug('[useUnreadMessages] Cache cleared');
}

/**
 * Handle auth status changes
 */
function handleAuthChange(newStatus) {
  if (newStatus === AUTH_STATUS.UNAUTHENTICATED) {
    // User logged out - stop polling and clear cache
    stopPolling();
    clearCache();
  } else if (newStatus === AUTH_STATUS.AUTHENTICATED && listeners.size > 0) {
    // User logged in and we have listeners - start polling
    startPolling();
    fetchUnread(); // Fetch immediately on login
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

    // Subscribe to auth changes (singleton - only once)
    if (!authUnsubscribe) {
      authUnsubscribe = subscribeToAuthStatus(handleAuthChange);
    }

    // Fetch immediately if cache is stale AND user is authenticated
    if (isAuthConfirmed()) {
      fetchUnread();

      // Start polling if this is the first listener
      if (listeners.size === 1) {
        startPolling();
      }
    }

    return () => {
      // Unregister listener
      listeners.delete(setData);
      logger.debug(`[useUnreadMessages] Listener removed (remaining: ${listeners.size})`);

      // Stop polling if no more listeners
      if (listeners.size === 0) {
        stopPolling();

        // Unsubscribe from auth changes
        if (authUnsubscribe) {
          authUnsubscribe();
          authUnsubscribe = null;
        }
      }
    };
  }, []);

  return data;
}

/**
 * Manually refresh unread count (bypasses cache and guards)
 */
export function refreshUnreadCount() {
  // Still check auth before refreshing
  if (!isAuthConfirmed()) {
    logger.debug('[useUnreadMessages] Cannot refresh (not authenticated)');
    return Promise.resolve();
  }

  lastFetch = 0; // Reset guard
  return fetchUnread();
}


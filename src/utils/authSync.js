/**
 * Cross-Tab Auth Sync
 * 
 * 🔥 CRITICAL: Ensures all tabs share one auth truth
 * 
 * Features:
 * - BroadcastChannel for cross-tab communication
 * - localStorage fallback for older browsers
 * - Login sync (rehydrate auth in other tabs)
 * - Logout sync (clear auth in all tabs)
 * 
 * This prevents:
 * - Desync between tabs
 * - One tab logged in, another logged out
 * - Stale auth state
 */

import logger from './logger';

const CHANNEL_NAME = 'pryde-auth-sync';
const STORAGE_KEY = 'pryde-auth-event';

// BroadcastChannel for modern browsers
let channel = null;

// Initialize BroadcastChannel if supported
try {
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(CHANNEL_NAME);
    logger.debug('[AuthSync] BroadcastChannel initialized');
  } else {
    logger.debug('[AuthSync] BroadcastChannel not supported - using localStorage fallback');
  }
} catch (error) {
  logger.warn('[AuthSync] Failed to create BroadcastChannel:', error);
}

/**
 * Broadcast auth event to all tabs
 * @param {string} type - Event type ('login' or 'logout')
 * @param {Object} data - Event data
 */
export function broadcastAuthEvent(type, data = {}) {
  const event = {
    type,
    data,
    timestamp: Date.now()
  };

  // Try BroadcastChannel first
  if (channel) {
    try {
      channel.postMessage(event);
      logger.debug(`[AuthSync] Broadcasted ${type} event via BroadcastChannel`);
    } catch (error) {
      logger.error('[AuthSync] Failed to broadcast via BroadcastChannel:', error);
    }
  }

  // Fallback to localStorage for older browsers
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(event));
    // Clear immediately to trigger storage event
    localStorage.removeItem(STORAGE_KEY);
    logger.debug(`[AuthSync] Broadcasted ${type} event via localStorage`);
  } catch (error) {
    logger.error('[AuthSync] Failed to broadcast via localStorage:', error);
  }
}

/**
 * Listen for auth events from other tabs
 * @param {Function} callback - Callback function (type, data) => void
 * @returns {Function} Cleanup function
 */
export function listenForAuthEvents(callback) {
  // BroadcastChannel listener
  const handleChannelMessage = (event) => {
    logger.debug('[AuthSync] Received event via BroadcastChannel:', event.data);
    callback(event.data.type, event.data.data);
  };

  // localStorage listener (fallback)
  const handleStorageEvent = (event) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const data = JSON.parse(event.newValue);
        logger.debug('[AuthSync] Received event via localStorage:', data);
        callback(data.type, data.data);
      } catch (error) {
        logger.error('[AuthSync] Failed to parse storage event:', error);
      }
    }
  };

  // Add listeners
  if (channel) {
    channel.addEventListener('message', handleChannelMessage);
  }
  window.addEventListener('storage', handleStorageEvent);

  logger.debug('[AuthSync] Listening for auth events');

  // Return cleanup function
  return () => {
    if (channel) {
      channel.removeEventListener('message', handleChannelMessage);
    }
    window.removeEventListener('storage', handleStorageEvent);
    logger.debug('[AuthSync] Stopped listening for auth events');
  };
}

/**
 * Broadcast login event
 */
export function broadcastLogin() {
  broadcastAuthEvent('auth:login');
}

/**
 * Broadcast logout event
 */
export function broadcastLogout() {
  broadcastAuthEvent('auth:logout');
}

/**
 * Close BroadcastChannel (cleanup)
 */
export function closeAuthSync() {
  if (channel) {
    channel.close();
    channel = null;
    logger.debug('[AuthSync] BroadcastChannel closed');
  }
}


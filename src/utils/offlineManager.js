/**
 * Offline Manager
 * 
 * 🌐 Graceful offline/online handling for PWA
 * 
 * Features:
 * - Detect online/offline state changes
 * - Pause auth refresh when offline
 * - Pause polling when offline
 * - Never log out due to offline errors
 * - Safe reconnection logic
 * 
 * Rules:
 * - NEVER log out user due to offline errors
 * - Gracefully pause background operations
 * - Resume safely on reconnect
 * - No retry storms
 */

import logger from './logger';

// Offline state
let isOffline = !navigator.onLine;
let offlineSince = null;
let reconnectCallbacks = [];
let offlineCallbacks = [];

/**
 * Initialize offline manager
 */
export function initOfflineManager() {
  logger.info('[Offline Manager] 🌐 Initializing offline manager...');
  
  // Listen for online/offline events
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Initial state
  if (!navigator.onLine) {
    handleOffline();
  }
  
  logger.info('[Offline Manager] ✅ Offline manager initialized');
}

/**
 * Handle offline event
 */
function handleOffline() {
  isOffline = true;
  offlineSince = new Date();
  
  logger.warn('[Offline Manager] 📴 App went offline');
  logger.warn(`   Time: ${offlineSince.toLocaleString()}`);
  
  // Notify all offline callbacks
  offlineCallbacks.forEach(callback => {
    try {
      callback();
    } catch (error) {
      logger.error('[Offline Manager] Error in offline callback:', error);
    }
  });
  
  // Dispatch custom event
  window.dispatchEvent(new CustomEvent('app-offline', {
    detail: { offlineSince }
  }));
}

/**
 * Handle online event
 */
function handleOnline() {
  const wasOffline = isOffline;
  const offlineDuration = offlineSince ? Date.now() - offlineSince.getTime() : 0;
  
  isOffline = false;
  offlineSince = null;
  
  logger.info('[Offline Manager] 🌐 App came back online');
  logger.info(`   Offline duration: ${Math.floor(offlineDuration / 1000)}s`);
  
  if (wasOffline) {
    // Notify all reconnect callbacks
    reconnectCallbacks.forEach(callback => {
      try {
        callback(offlineDuration);
      } catch (error) {
        logger.error('[Offline Manager] Error in reconnect callback:', error);
      }
    });
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('app-online', {
      detail: { offlineDuration }
    }));
  }
}

/**
 * Check if app is currently offline
 */
export function isAppOffline() {
  return isOffline;
}

/**
 * Get offline duration in milliseconds
 */
export function getOfflineDuration() {
  if (!offlineSince) return 0;
  return Date.now() - offlineSince.getTime();
}

/**
 * Register callback for when app goes offline
 */
export function onOffline(callback) {
  offlineCallbacks.push(callback);
  
  // Return unsubscribe function
  return () => {
    offlineCallbacks = offlineCallbacks.filter(cb => cb !== callback);
  };
}

/**
 * Register callback for when app comes back online
 */
export function onReconnect(callback) {
  reconnectCallbacks.push(callback);
  
  // Return unsubscribe function
  return () => {
    reconnectCallbacks = reconnectCallbacks.filter(cb => cb !== callback);
  };
}

/**
 * Pause operation while offline
 * 
 * This wraps an async operation and pauses it if offline
 * 
 * @param {Function} operation - Async operation to execute
 * @param {Object} options - Options
 * @param {boolean} options.skipIfOffline - Skip operation if offline (default: true)
 * @param {number} options.maxWait - Max time to wait for reconnect (ms, default: 30000)
 * @returns {Promise<any>}
 */
export async function pauseWhileOffline(operation, options = {}) {
  const { skipIfOffline = true, maxWait = 30000 } = options;
  
  // If online, execute immediately
  if (!isOffline) {
    return operation();
  }
  
  // If offline and skipIfOffline is true, skip operation
  if (skipIfOffline) {
    logger.debug('[Offline Manager] Skipping operation while offline');
    return null;
  }
  
  // Wait for reconnect (with timeout)
  logger.debug('[Offline Manager] Waiting for reconnect...');
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      reject(new Error('Timeout waiting for reconnect'));
    }, maxWait);
    
    const unsubscribe = onReconnect(() => {
      clearTimeout(timeout);
      unsubscribe();
      
      logger.debug('[Offline Manager] Reconnected - executing operation');
      operation().then(resolve).catch(reject);
    });
  });
}

/**
 * Check if error is due to offline state
 */
export function isOfflineError(error) {
  if (!error) return false;
  
  const offlineMessages = [
    'network error',
    'failed to fetch',
    'networkerror',
    'network request failed',
    'offline'
  ];
  
  const errorMessage = error.message?.toLowerCase() || '';
  return offlineMessages.some(msg => errorMessage.includes(msg));
}

/**
 * Cleanup offline manager
 */
export function cleanupOfflineManager() {
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
  
  reconnectCallbacks = [];
  offlineCallbacks = [];
  
  logger.info('[Offline Manager] Cleaned up');
}


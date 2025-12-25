import { getSocket } from './socket';
import logger from './logger';
import SOCKET_EVENTS from '../constants/socketEvents';

// Re-export getSocket for convenience (components can import from socketHelpers)
export { getSocket };
export { SOCKET_EVENTS };

/**
 * Waits for socket to be initialized and connected, then executes a setup callback.
 * Handles retry logic with configurable interval and max retries.
 *
 * @param {Function} setupCallback - Function to call when socket is ready
 * @param {Object} options - Configuration options
 * @param {number} options.retryInterval - Milliseconds between retries (default: 750ms)
 * @param {number} options.maxRetries - Maximum retry attempts (default: 20, ~15 seconds)
 * @param {Function} options.onTimeout - Callback if max retries exceeded
 * @returns {Function} Cleanup function to cancel pending retries
 *
 * @example
 * const cleanup = setupSocketListeners(() => {
 *   const socket = getSocket();
 *   socket.on('event', handler);
 * });
 *
 * // Later, on component unmount:
 * cleanup();
 */
export function setupSocketListeners(setupCallback, options = {}) {
  const {
    retryInterval = 750,
    maxRetries = 20,
    onTimeout = null
  } = options;

  let retryCount = 0;
  let timeoutId = null;
  let isCancelled = false;

  const checkSocket = () => {
    // If cleanup was called, stop retrying
    if (isCancelled) {
      logger.debug('🛑 Socket retry cancelled');
      return;
    }

    const socket = getSocket();

    if (!socket) {
      retryCount++;
      if (retryCount < maxRetries) {
        logger.debug(`⏳ Socket not initialized yet, retrying in ${retryInterval}ms... (${retryCount}/${maxRetries})`);
        timeoutId = setTimeout(checkSocket, retryInterval);
      } else {
        logger.warn(`⚠️ Socket initialization timed out after ${maxRetries} retries (~${(maxRetries * retryInterval) / 1000}s)`);
        if (onTimeout) onTimeout();
      }
      return;
    }

    logger.debug('✅ Socket found, checking connection status');

    // Set up listeners if already connected, or wait for connection
    if (socket.connected) {
      logger.debug('✅ Socket already connected, setting up listeners');
      setupCallback(socket);
    } else {
      logger.debug('⏳ Socket not connected yet, waiting for connection...');
      const onConnect = () => {
        logger.debug('✅ Socket connected, setting up listeners');
        setupCallback(socket);
      };
      if (typeof socket.once === 'function') {
        socket.once('connect', onConnect);
      } else {
        logger.error('❌ Socket does not have .once() method!');
      }
    }
  };

  // Start the retry loop
  checkSocket();

  // Return cleanup function
  return () => {
    isCancelled = true;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
}

/**
 * Simplified version for components that don't need retry logic.
 * Returns socket immediately if available, null otherwise.
 *
 * @returns {Object|null} Socket instance or null
 *
 * @example
 * const socket = getSocketOrNull();
 * if (!socket) return;
 * socket.on('event', handler);
 */
export function getSocketOrNull() {
  const socket = getSocket();
  if (!socket) {
    logger.debug('⏳ Socket not initialized yet');
    return null;
  }
  return socket;
}

// ═══════════════════════════════════════════════════════════════════
// TYPED EVENT LISTENERS (using standardized events)
// ═══════════════════════════════════════════════════════════════════

/**
 * Subscribe to multiple socket events with automatic cleanup
 *
 * @param {Object} eventHandlers - Map of event names to handler functions
 * @returns {Function} Cleanup function to remove all listeners
 *
 * @example
 * const cleanup = subscribeToEvents({
 *   [SOCKET_EVENTS.POST.CREATED]: (data) => addPost(data),
 *   [SOCKET_EVENTS.POST.DELETED]: (data) => removePost(data.postId),
 * });
 */
export function subscribeToEvents(eventHandlers) {
  const cleanupFns = [];

  const setup = (socket) => {
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socket.on(event, handler);
      cleanupFns.push(() => socket.off(event, handler));
      logger.debug(`📡 Subscribed to ${event}`);
    });
  };

  const cancelRetry = setupSocketListeners(setup);

  return () => {
    cancelRetry();
    cleanupFns.forEach(fn => fn());
    logger.debug(`🔌 Unsubscribed from ${Object.keys(eventHandlers).length} events`);
  };
}

/**
 * Subscribe to a single event with automatic cleanup
 *
 * @param {string} event - Event name (use SOCKET_EVENTS constants)
 * @param {Function} handler - Event handler
 * @returns {Function} Cleanup function
 */
export function subscribeToEvent(event, handler) {
  return subscribeToEvents({ [event]: handler });
}

/**
 * Emit a socket event (fire and forget)
 *
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
export function emitEvent(event, data) {
  const socket = getSocketOrNull();
  if (!socket) {
    logger.warn(`⚠️ Cannot emit ${event}: socket not connected`);
    return false;
  }

  socket.emit(event, data);
  logger.debug(`📤 Emitted ${event}`, data);
  return true;
}

/**
 * Emit an event and wait for acknowledgment
 *
 * @param {string} event - Event name
 * @param {any} data - Event data
 * @param {number} timeout - Timeout in ms (default 5000)
 * @returns {Promise<any>} Response from server
 */
export function emitWithAck(event, data, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const socket = getSocketOrNull();
    if (!socket) {
      reject(new Error('Socket not connected'));
      return;
    }

    const timeoutId = setTimeout(() => {
      reject(new Error(`Socket event ${event} timed out`));
    }, timeout);

    socket.emit(event, data, (response) => {
      clearTimeout(timeoutId);
      if (response?.error) {
        reject(new Error(response.error));
      } else {
        resolve(response);
      }
    });
  });
}


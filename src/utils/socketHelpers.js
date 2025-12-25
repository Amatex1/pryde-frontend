import { getSocket } from './socket';
import logger from './logger';
import SOCKET_EVENTS from '../constants/socketEvents';
import api from './api';

// Re-export getSocket for convenience (components can import from socketHelpers)
export { getSocket };
export { SOCKET_EVENTS };

const isDev = import.meta.env.DEV;

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

// ═══════════════════════════════════════════════════════════════════
// SOCKET CONSISTENCY VERIFICATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Verify socket event data refers to an entity that exists in backend
 * CRITICAL: Prevents applying socket updates for ghost/non-existent entities
 *
 * @param {string} entityType - Type of entity ('post', 'draft', 'comment', etc.)
 * @param {string} entityId - ID of the entity to verify
 * @param {Object} eventData - Original socket event data
 * @returns {Promise<{verified: boolean, exists: boolean, entity?: Object}>}
 */
export async function verifySocketEntity(entityType, entityId, eventData) {
  if (!isDev) {
    // In production, trust socket events for performance
    return { verified: true, exists: true };
  }

  if (!entityId) {
    console.warn(
      `⚠️ [SOCKET CONSISTENCY] Received ${entityType} event with no ID\n`,
      eventData
    );
    return { verified: false, exists: false, reason: 'missing_id' };
  }

  try {
    // Use dev verify endpoint to check entity exists
    const response = await api.get(`/dev/verify/${entityType}/${entityId}`);

    if (response.data?.existsInDB) {
      logger.debug(`✅ [SOCKET VERIFY] ${entityType} ${entityId} verified in database`);
      return {
        verified: true,
        exists: true,
        entity: response.data.comparison?.rawDocument
      };
    } else {
      console.warn(
        `⚠️ [SOCKET CONSISTENCY] ${entityType} ${entityId} from socket event does not exist in DB!\n` +
        `This could indicate a race condition or ghost entity.`
      );
      return { verified: true, exists: false, reason: 'not_in_db' };
    }
  } catch (error) {
    // 404 means entity doesn't exist
    if (error.response?.status === 404) {
      console.warn(
        `⚠️ [SOCKET CONSISTENCY] ${entityType} ${entityId} not found in database\n` +
        `Rejecting socket update for non-existent entity.`
      );
      return { verified: true, exists: false, reason: 'not_found' };
    }

    // Other errors - log but don't block (could be network issue)
    logger.warn(`⚠️ [SOCKET VERIFY] Could not verify ${entityType} ${entityId}:`, error.message);
    return { verified: false, exists: null, reason: 'verification_failed' };
  }
}

/**
 * Create a verified socket event handler
 * Wraps a handler to verify entity exists before processing
 *
 * @param {string} entityType - Entity type to verify
 * @param {Function} idExtractor - Function to extract entity ID from event data
 * @param {Function} handler - Original event handler
 * @param {Object} options - Options
 * @param {boolean} options.blockIfMissing - If true, don't call handler if entity missing
 * @returns {Function} Wrapped handler
 *
 * @example
 * const verifiedHandler = createVerifiedSocketHandler(
 *   'post',
 *   (data) => data.postId,
 *   (data) => addPostToFeed(data.post),
 *   { blockIfMissing: true }
 * );
 * socket.on('post_created', verifiedHandler);
 */
export function createVerifiedSocketHandler(entityType, idExtractor, handler, options = {}) {
  const { blockIfMissing = true } = options;

  return async (eventData) => {
    const entityId = idExtractor(eventData);
    const mutationId = eventData?._mutationId;

    if (isDev) {
      logger.debug(`📡 [SOCKET] Received ${entityType} event`, { entityId, mutationId });
    }

    // Verify entity exists
    const verification = await verifySocketEntity(entityType, entityId, eventData);

    if (!verification.exists && blockIfMissing) {
      console.warn(
        `🚫 [SOCKET] Blocking update for non-existent ${entityType}: ${entityId}\n` +
        `Mutation ID: ${mutationId || 'unknown'}`
      );
      return;
    }

    // Call original handler
    handler(eventData);
  };
}

/**
 * Subscribe to verified socket events
 * Like subscribeToEvents but with entity verification
 *
 * @param {Object} eventConfigs - Map of event names to config objects
 * @returns {Function} Cleanup function
 *
 * @example
 * const cleanup = subscribeToVerifiedEvents({
 *   'post_created': {
 *     entityType: 'post',
 *     idExtractor: (data) => data.post?._id,
 *     handler: (data) => addPost(data.post)
 *   },
 *   'post_deleted': {
 *     entityType: 'post',
 *     idExtractor: (data) => data.postId,
 *     handler: (data) => removePost(data.postId),
 *     verify: false // Skip verification for deletes
 *   }
 * });
 */
export function subscribeToVerifiedEvents(eventConfigs) {
  const handlers = {};

  Object.entries(eventConfigs).forEach(([event, config]) => {
    if (config.verify === false) {
      // No verification needed (e.g., for delete events)
      handlers[event] = config.handler;
    } else {
      // Wrap with verification
      handlers[event] = createVerifiedSocketHandler(
        config.entityType,
        config.idExtractor,
        config.handler,
        { blockIfMissing: config.blockIfMissing ?? true }
      );
    }
  });

  return subscribeToEvents(handlers);
}


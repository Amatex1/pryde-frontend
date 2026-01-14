/**
 * Validated Socket Emit Helper (Frontend)
 * 
 * Ensures all socket emissions use canonical event names.
 * Validation is DEV-ONLY - production behavior unchanged.
 * 
 * @see REALTIME_EVENT_CONTRACT.md in backend /docs
 */

const isDev = process.env.NODE_ENV !== 'production';

// Canonical allowed events (must match REALTIME_EVENT_CONTRACT.md)
// These are the events that the FRONTEND can emit to the server
const ALLOWED_CLIENT_EVENTS = [
  // Messages
  'send_message',
  'mark_read',
  
  // Typing
  'typing',
  'global_chat:typing',
  
  // Presence
  'join',
  'leave',
  'get_online_users',
  
  // Global Chat
  'global_chat:join',
  'global_message:send',
  'global_chat:get_online_users',
  
  // Friend requests
  'friend_request_sent',
  'friend_request_accepted'
];

// Required payload keys per event (for validation)
const REQUIRED_KEYS = {
  'send_message': ['recipientId'], // Only recipientId required - content OR attachment OR voiceNote
  'typing': ['recipientId', 'isTyping'],
  'global_chat:typing': ['isTyping'],
  'global_message:send': ['text']
};

// Track emitted events for duplicate detection
const recentEmits = new Map();
const DUPLICATE_WINDOW_MS = 100; // Ignore duplicate emits within 100ms

/**
 * Validate and emit a socket event
 * @param {Object} socket - Socket.IO client instance
 * @param {string} eventName - Event name to emit
 * @param {Object} payload - Event payload
 * @returns {boolean} - Whether emit was called
 */
export function emitValidated(socket, eventName, payload) {
  if (!socket) {
    if (isDev) {
      console.warn('[Socket] ⚠️ Cannot emit - socket is null');
    }
    return false;
  }

  if (isDev) {
    // Validate event name
    if (!ALLOWED_CLIENT_EVENTS.includes(eventName)) {
      console.warn(
        `[Socket] ⚠️ Invalid emit event: "${eventName}"`,
        '\n   Allowed client events:', ALLOWED_CLIENT_EVENTS.join(', ')
      );
    }
    
    // Validate payload keys
    const requiredKeys = REQUIRED_KEYS[eventName];
    if (requiredKeys && payload) {
      const missingKeys = requiredKeys.filter(key => !(key in payload));
      if (missingKeys.length > 0) {
        console.warn(
          `[Socket] ⚠️ Missing required keys for "${eventName}":`,
          missingKeys.join(', ')
        );
      }
    }

    // Check for duplicate rapid-fire emits
    const emitKey = `${eventName}:${JSON.stringify(payload)}`;
    const lastEmit = recentEmits.get(emitKey);
    if (lastEmit && Date.now() - lastEmit < DUPLICATE_WINDOW_MS) {
      console.warn(
        `[Socket] ⚠️ Duplicate emit detected for "${eventName}" (within ${DUPLICATE_WINDOW_MS}ms)`
      );
    }
    recentEmits.set(emitKey, Date.now());
    
    // Clean up old entries to prevent memory leak
    if (recentEmits.size > 100) {
      const now = Date.now();
      for (const [key, time] of recentEmits.entries()) {
        if (now - time > DUPLICATE_WINDOW_MS * 10) {
          recentEmits.delete(key);
        }
      }
    }
  }
  
  // Always emit (validation is advisory only)
  socket.emit(eventName, payload);
  return true;
}

/**
 * Wrap a socket instance with validated emit
 * @param {Object} socket - Socket.IO client instance
 * @returns {Object} - Wrapped socket with emit method
 */
export function wrapSocket(socket) {
  return {
    emit: (eventName, payload) => emitValidated(socket, eventName, payload),
    on: socket.on.bind(socket),
    off: socket.off.bind(socket),
    connected: socket?.connected
  };
}

export default {
  emitValidated,
  wrapSocket,
  ALLOWED_CLIENT_EVENTS,
  REQUIRED_KEYS
};


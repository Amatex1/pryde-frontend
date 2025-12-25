/**
 * Standardized Socket.IO Event Constants
 * 
 * All socket events across the platform should use these constants
 * to ensure consistency and prevent typos.
 * 
 * Naming Convention:
 * - Client → Server: action (e.g., 'send_message')
 * - Server → Client: entity:action (e.g., 'message:sent')
 */

// ═══════════════════════════════════════════════════════════════════
// POST EVENTS
// ═══════════════════════════════════════════════════════════════════
export const POST_EVENTS = {
  // Server → Client
  CREATED: 'post:created',
  UPDATED: 'post:updated',
  DELETED: 'post:deleted',
  IMAGE_DELETED: 'post:imageDeleted',
  REACTION_ADDED: 'post:reactionAdded',
  REACTION_REMOVED: 'post:reactionRemoved',
  
  // Legacy events (for backward compatibility)
  LEGACY_CREATED: 'post_created',
  LEGACY_UPDATED: 'post_updated',
  LEGACY_DELETED: 'post_deleted',
};

// ═══════════════════════════════════════════════════════════════════
// COMMENT EVENTS
// ═══════════════════════════════════════════════════════════════════
export const COMMENT_EVENTS = {
  // Server → Client
  ADDED: 'comment:added',
  UPDATED: 'comment:updated',
  DELETED: 'comment:deleted',
  REACTION_ADDED: 'comment:reactionAdded',
  REACTION_REMOVED: 'comment:reactionRemoved',
  
  // Legacy events
  LEGACY_ADDED: 'comment_added',
  LEGACY_DELETED: 'comment_deleted',
};

// ═══════════════════════════════════════════════════════════════════
// MESSAGE EVENTS
// ═══════════════════════════════════════════════════════════════════
export const MESSAGE_EVENTS = {
  // Client → Server
  SEND: 'send_message',
  
  // Server → Client
  SENT: 'message:sent',
  RECEIVED: 'message:received',
  DELETED: 'message:deleted',
  EDITED: 'message:edited',
  REACTION_ADDED: 'message:reactionAdded',
  REACTION_REMOVED: 'message:reactionRemoved',
  READ: 'message:read',
  
  // Legacy events
  LEGACY_RECEIVED: 'new_message',
  LEGACY_SENT: 'message_sent',
};

// ═══════════════════════════════════════════════════════════════════
// PROFILE EVENTS
// ═══════════════════════════════════════════════════════════════════
export const PROFILE_EVENTS = {
  // Server → Client
  UPDATED: 'profile:updated',
  PHOTO_UPDATED: 'profile:photoUpdated',
  COVER_UPDATED: 'profile:coverUpdated',
};

// ═══════════════════════════════════════════════════════════════════
// FRIEND/CONNECTION EVENTS
// ═══════════════════════════════════════════════════════════════════
export const FRIEND_EVENTS = {
  // Server → Client
  REQUEST_SENT: 'friend:requestSent',
  REQUEST_RECEIVED: 'friend:request_received',
  REQUEST_ACCEPTED: 'friend:accepted',
  REQUEST_DECLINED: 'friend:request_declined',
  ADDED: 'friend:added',
  REMOVED: 'friend:removed',
  
  // Legacy events
  LEGACY_REQUEST_RECEIVED: 'friendRequestReceived',
  LEGACY_REQUEST_ACCEPTED: 'friendRequestAccepted',
};

// ═══════════════════════════════════════════════════════════════════
// NOTIFICATION EVENTS
// ═══════════════════════════════════════════════════════════════════
export const NOTIFICATION_EVENTS = {
  // Server → Client
  CREATED: 'notification:created',
  READ: 'notification:read',
  READ_ALL: 'notification:read_all',
  DELETED: 'notification:deleted',
};

// ═══════════════════════════════════════════════════════════════════
// PRESENCE EVENTS
// ═══════════════════════════════════════════════════════════════════
export const PRESENCE_EVENTS = {
  // Client → Server
  JOIN: 'join',
  LEAVE: 'leave',
  
  // Server → Client
  ONLINE: 'user:online',
  OFFLINE: 'user:offline',
  TYPING: 'user:typing',
  STOP_TYPING: 'user:stopTyping',
  
  // Legacy
  LEGACY_TYPING: 'typing',
};

// ═══════════════════════════════════════════════════════════════════
// REACTION EVENTS (Generic)
// ═══════════════════════════════════════════════════════════════════
export const REACTION_EVENTS = {
  ADDED: 'reaction:added',
  REMOVED: 'reaction:removed',
};

// All events combined for easy iteration
export const ALL_EVENTS = {
  ...POST_EVENTS,
  ...COMMENT_EVENTS,
  ...MESSAGE_EVENTS,
  ...PROFILE_EVENTS,
  ...FRIEND_EVENTS,
  ...NOTIFICATION_EVENTS,
  ...PRESENCE_EVENTS,
  ...REACTION_EVENTS,
};

export default {
  POST: POST_EVENTS,
  COMMENT: COMMENT_EVENTS,
  MESSAGE: MESSAGE_EVENTS,
  PROFILE: PROFILE_EVENTS,
  FRIEND: FRIEND_EVENTS,
  NOTIFICATION: NOTIFICATION_EVENTS,
  PRESENCE: PRESENCE_EVENTS,
  REACTION: REACTION_EVENTS,
};


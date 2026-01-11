/**
 * CANONICAL NOTIFICATION TYPES (Frontend)
 *
 * Single source of truth for notification type classification.
 * Must match backend constants/notificationTypes.js
 *
 * RULES:
 * - SOCIAL notifications appear in Bell icon (NotificationBell)
 * - MESSAGE notifications appear in Messages badge only (MobileNav, Sidebar)
 * - Bell and Messages never share the same notification types
 */

// ============================================
// SOCIAL NOTIFICATION TYPES (Bell Icon Only)
// ============================================
export const SOCIAL_NOTIFICATION_TYPES = Object.freeze([
  'like',
  'comment',
  'mention',
  'group_mention',
  'group_post',
  'system',
  'moderation',
  'resonance',
  'circle_invite',
  'circle_post',
  'login_approval',
  // Legacy types (deprecated but still supported)
  'friend_request',
  'friend_accept',
  'share',
]);

// ============================================
// MESSAGE NOTIFICATION TYPES (Messages Badge Only)
// ============================================
export const MESSAGE_NOTIFICATION_TYPES = Object.freeze([
  'message',
]);

// ============================================
// TYPE CLASSIFICATION HELPERS
// ============================================

/**
 * Check if a notification type is a SOCIAL type (Bell icon)
 * @param {string} type - Notification type
 * @returns {boolean}
 */
export function isSocialNotificationType(type) {
  return SOCIAL_NOTIFICATION_TYPES.includes(type);
}

/**
 * Check if a notification type is a MESSAGE type (Messages badge)
 * @param {string} type - Notification type
 * @returns {boolean}
 */
export function isMessageNotificationType(type) {
  return MESSAGE_NOTIFICATION_TYPES.includes(type);
}

/**
 * Filter notifications to only include SOCIAL types (for Bell)
 * Logs warning if MESSAGE type is incorrectly routed to Bell
 * @param {Array} notifications - Array of notification objects
 * @returns {Array} Filtered notifications
 */
export function filterSocialNotifications(notifications) {
  return notifications.filter(n => {
    if (isMessageNotificationType(n.type)) {
      // Validation warning per spec
      console.warn(
        `[Notification] MESSAGE type '${n.type}' incorrectly routed to Bell.`,
        { notificationId: n._id }
      );
      return false;
    }
    return isSocialNotificationType(n.type);
  });
}

/**
 * Validate that bell count is not being incremented by message notifications
 * Logs warning if violation detected
 * @param {object} notification - Notification object
 * @returns {boolean} Whether it should increment bell count
 */
export function shouldIncrementBellCount(notification) {
  if (isMessageNotificationType(notification.type)) {
    console.warn(
      `[Notification] Attempted to increment bell count with MESSAGE type '${notification.type}'`,
      { notificationId: notification._id }
    );
    return false;
  }
  return isSocialNotificationType(notification.type);
}

/**
 * Get calm-first notification text (no exclamation marks)
 * @param {object} notification - Notification object
 * @returns {string} Calmed notification text
 */
export function getCalmNotificationText(notification) {
  // Remove exclamation marks from message
  let text = notification.message || '';
  text = text.replace(/!/g, '');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}


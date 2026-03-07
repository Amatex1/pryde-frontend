/**
 * Utility functions for Messages components
 * Extracted from Messages.jsx for shared functionality
 */

/**
 * Compare two IDs safely
 * Handles MongoDB ObjectId comparison and various ID formats
 * @param {string} id1 - First ID to compare
 * @param {string} id2 - Second ID to compare
 * @returns {boolean} - True if IDs match
 */
export const compareIds = (id1, id2) => {
  if (!id1 || !id2) return false;
  return String(id1) === String(id2);
};

/**
 * Check if a message ID is a temporary optimistic ID
 * @param {string} messageId - The message ID to check
 * @returns {boolean} - True if this is a temp ID
 */
export const isTempId = (messageId) => {
  return typeof messageId === 'string' && messageId.startsWith('temp_');
};

/**
 * Format a date for display in message headers
 * @param {Date|string} date - The date to format
 * @returns {string} - Formatted date string
 */
export const formatDateHeader = (date) => {
  const messageDate = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Reset time to midnight for comparison
  const messageDateMidnight = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayMidnight = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

  if (messageDateMidnight.getTime() === todayMidnight.getTime()) {
    return 'Today';
  } else if (messageDateMidnight.getTime() === yesterdayMidnight.getTime()) {
    return 'Yesterday';
  } else {
    // Format as "Monday, January 15, 2024"
    return messageDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
};

/**
 * Check if we need to show a date header between two messages
 * @param {Object} currentMsg - Current message
 * @param {Object} previousMsg - Previous message
 * @returns {boolean} - True if date header should be shown
 */
export const shouldShowDateHeader = (currentMsg, previousMsg) => {
  if (!previousMsg) return true; // Always show header for first message

  const currentDate = new Date(currentMsg.createdAt);
  const previousDate = new Date(previousMsg.createdAt);

  // Compare dates (ignoring time)
  return currentDate.toDateString() !== previousDate.toDateString();
};

/**
 * Get bubble position for message styling
 * @param {number} msgIndex - Index of message in group
 * @param {number} totalMessages - Total messages in group
 * @returns {string} - Position: 'single', 'first', 'last', or 'middle'
 */
export const getBubblePosition = (msgIndex, totalMessages) => {
  if (totalMessages === 1) return 'single';
  if (msgIndex === 0) return 'first';
  if (msgIndex === totalMessages - 1) return 'last';
  return 'middle';
};

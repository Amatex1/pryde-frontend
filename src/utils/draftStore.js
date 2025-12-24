/**
 * Draft Storage Utility
 * 
 * Provides localStorage-based draft persistence for post content,
 * ensuring user content is never lost on refresh, navigation, or updates.
 * 
 * Features:
 * - Auto-save drafts to localStorage
 * - Restore drafts on component mount
 * - Clear drafts on successful submission
 * - Timestamp tracking for draft age
 * - Namespace isolation with 'pryde:draft:' prefix
 */

const KEY_PREFIX = 'pryde:draft:';

/**
 * Save a draft to localStorage
 * @param {string} key - Unique identifier for the draft (e.g., 'create-post', 'edit-post:123')
 * @param {any} value - The draft content to save (will be JSON stringified)
 */
export function saveDraft(key, value) {
  try {
    localStorage.setItem(KEY_PREFIX + key, JSON.stringify({
      value,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.warn('Failed to save draft:', error);
  }
}

/**
 * Load a draft from localStorage
 * @param {string} key - Unique identifier for the draft
 * @returns {any|null} The draft content, or null if not found or invalid
 */
export function loadDraft(key) {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.value;
  } catch (error) {
    console.warn('Failed to load draft:', error);
    return null;
  }
}

/**
 * Clear a specific draft from localStorage
 * @param {string} key - Unique identifier for the draft
 */
export function clearDraft(key) {
  try {
    localStorage.removeItem(KEY_PREFIX + key);
  } catch (error) {
    console.warn('Failed to clear draft:', error);
  }
}

/**
 * Get the timestamp of when a draft was last saved
 * @param {string} key - Unique identifier for the draft
 * @returns {number|null} Timestamp in milliseconds, or null if not found
 */
export function getDraftTimestamp(key) {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.timestamp;
  } catch (error) {
    console.warn('Failed to get draft timestamp:', error);
    return null;
  }
}

/**
 * Clear all drafts from localStorage
 * Useful for logout or cleanup operations
 */
export function clearAllDrafts() {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(KEY_PREFIX))
      .forEach(k => localStorage.removeItem(k));
  } catch (error) {
    console.warn('Failed to clear all drafts:', error);
  }
}

/**
 * Get all draft keys currently stored
 * @returns {string[]} Array of draft keys (without prefix)
 */
export function getAllDraftKeys() {
  try {
    return Object.keys(localStorage)
      .filter(k => k.startsWith(KEY_PREFIX))
      .map(k => k.substring(KEY_PREFIX.length));
  } catch (error) {
    console.warn('Failed to get draft keys:', error);
    return [];
  }
}

/**
 * Check if a draft exists
 * @param {string} key - Unique identifier for the draft
 * @returns {boolean} True if draft exists
 */
export function hasDraft(key) {
  try {
    return localStorage.getItem(KEY_PREFIX + key) !== null;
  } catch (error) {
    return false;
  }
}


/**
 * =========================================
 * PRYDE PLATFORM CORE FLAGS
 * =========================================
 * 
 * These are immutable platform-level constants that define
 * what Pryde is and what it will never become.
 * 
 * These flags serve as guardrails for future development.
 * They prevent accidental reintroduction of patterns that
 * conflict with our core values.
 * 
 * DO NOT CHANGE THESE VALUES without a platform-wide policy change.
 * See docs/FEATURE_LOCK.md for more context.
 */

// =========================================
// FEED & CONTENT DISCOVERY
// =========================================

/** 
 * Pryde shows posts in chronological order.
 * No algorithmic ranking, boosting, or suppression.
 */
export const NO_ALGORITHMIC_FEED = true;

/**
 * Content discovery happens through Groups only.
 * No hashtag virality, no trending topics, no explore pages.
 */
export const GROUPS_ONLY_DISCOVERY = true;

// =========================================
// METRICS & SOCIAL PRESSURE
// =========================================

/**
 * Follower counts are never shown publicly.
 * Users know who follows them, but not the number.
 */
export const NO_PUBLIC_FOLLOWER_COUNTS = true;

/**
 * Like counts are never shown publicly.
 * Users see that reactions exist, not how many.
 */
export const NO_PUBLIC_LIKE_COUNTS = true;

/**
 * View counts are never tracked or shown.
 * No "seen by X people" on posts or stories.
 */
export const NO_VIEW_COUNTS = true;

// =========================================
// MODERATION TRANSPARENCY
// =========================================

/**
 * Moderation logs are not exposed publicly.
 * Actions are communicated privately to affected users.
 */
export const NO_PUBLIC_MOD_LOGS = true;

/**
 * No shadow moderation.
 * If content is removed, the user is notified.
 */
export const NO_SHADOW_MODERATION = true;

// =========================================
// REMOVED FEATURES (LOCKED)
// =========================================

/**
 * Reposts/retweets do not exist.
 * Content stays where it's posted.
 */
export const NO_REPOSTS = true;

/**
 * Trending topics do not exist.
 * No "what's hot" or viral content mechanics.
 */
export const NO_TRENDING = true;

/**
 * Public hashtags with virality do not exist.
 * Tags redirect to Groups instead.
 */
export const NO_VIRAL_HASHTAGS = true;

// =========================================
// HELPER: CHECK IF FEATURE IS LOCKED
// =========================================

/**
 * All platform flags for programmatic access.
 * Useful for conditional checks and testing.
 */
export const PLATFORM_FLAGS = {
  NO_ALGORITHMIC_FEED,
  GROUPS_ONLY_DISCOVERY,
  NO_PUBLIC_FOLLOWER_COUNTS,
  NO_PUBLIC_LIKE_COUNTS,
  NO_VIEW_COUNTS,
  NO_PUBLIC_MOD_LOGS,
  NO_SHADOW_MODERATION,
  NO_REPOSTS,
  NO_TRENDING,
  NO_VIRAL_HASHTAGS,
};

// Guard list to prevent arbitrary property access (object injection safety)
const PLATFORM_FLAG_KEYS = new Set(Object.keys(PLATFORM_FLAGS));

/**
 * Check if a feature is locked (should not be built).
 * @param {string} flagName - The flag name to check
 * @returns {boolean} - True if the feature is locked/disabled
 */
export function isFeatureLocked(flagName) {
  // Only allow known keys to avoid object injection; unknown flags default to unlocked.
  if (!PLATFORM_FLAG_KEYS.has(flagName)) return false;
  return PLATFORM_FLAGS[flagName] === true;
}


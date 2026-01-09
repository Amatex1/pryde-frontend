/**
 * Badge Tier Classification System
 * 
 * Transforms Pryde's badge system from decorative to calm, hierarchical display.
 * 
 * TIER 1 - IDENTITY BADGES (Always visible next to username)
 * - Founder / Team
 * - Moderator
 * - Verified (future)
 * Purpose: Authoritative identity markers
 * 
 * TIER 2 - STATUS BADGES (Small, muted row below name)
 * - Active this month
 * - Group organizer
 * - Profile complete
 * - Early member
 * Purpose: Contextual status information
 * 
 * TIER 3 - COSMETIC BADGES (Hidden in popover/modal)
 * - Fun emojis
 * - Seasonal
 * - Achievement flair
 * Purpose: Personal expression, not critical info
 */

// Tier 1: Identity Badges - Critical authority/role markers
const TIER_1_BADGE_IDS = [
  'pryde_team',
  'founder',
  'moderator',
  'verified',
  'admin'
];

// Tier 2: Status Badges - Contextual activity/status
const TIER_2_BADGE_IDS = [
  'active_this_month',
  'group_organizer',
  'profile_complete',
  'early_member',
  'founding_member',
  'community_leader'
];

// Tier 3: Everything else - Cosmetic/achievement badges
// (Determined by exclusion from Tier 1 & 2)

/**
 * Classify a badge into its tier
 * @param {Object} badge - Badge object with id, label, icon, etc.
 * @returns {1|2|3} - Tier number
 */
export function getBadgeTier(badge) {
  if (!badge || !badge.id) return 3;
  
  if (TIER_1_BADGE_IDS.includes(badge.id)) return 1;
  if (TIER_2_BADGE_IDS.includes(badge.id)) return 2;
  return 3;
}

/**
 * Separate badges into tiers
 * @param {Array} badges - Array of badge objects
 * @returns {Object} - { tier1: [], tier2: [], tier3: [] }
 */
export function separateBadgesByTier(badges) {
  if (!badges || !Array.isArray(badges)) {
    return { tier1: [], tier2: [], tier3: [] };
  }

  const tier1 = [];
  const tier2 = [];
  const tier3 = [];

  badges.forEach(badge => {
    const tier = getBadgeTier(badge);
    if (tier === 1) tier1.push(badge);
    else if (tier === 2) tier2.push(badge);
    else tier3.push(badge);
  });

  // Sort each tier by priority (lower = higher priority)
  const sortByPriority = (a, b) => (a.priority || 100) - (b.priority || 100);
  tier1.sort(sortByPriority);
  tier2.sort(sortByPriority);
  tier3.sort(sortByPriority);

  return { tier1, tier2, tier3 };
}

/**
 * Get only Tier 1 badges (for display next to username)
 * @param {Array} badges - Array of badge objects
 * @returns {Array} - Tier 1 badges only
 */
export function getTier1Badges(badges) {
  return separateBadgesByTier(badges).tier1;
}

/**
 * Get only Tier 2 badges (for status row)
 * @param {Array} badges - Array of badge objects
 * @returns {Array} - Tier 2 badges only
 */
export function getTier2Badges(badges) {
  return separateBadgesByTier(badges).tier2;
}

/**
 * Get only Tier 3 badges (for popover/modal)
 * @param {Array} badges - Array of badge objects
 * @returns {Array} - Tier 3 badges only
 */
export function getTier3Badges(badges) {
  return separateBadgesByTier(badges).tier3;
}

/**
 * Check if user has any Tier 1 badges
 * @param {Array} badges - Array of badge objects
 * @returns {boolean}
 */
export function hasTier1Badges(badges) {
  return getTier1Badges(badges).length > 0;
}

/**
 * Check if user has any Tier 2 badges
 * @param {Array} badges - Array of badge objects
 * @returns {boolean}
 */
export function hasTier2Badges(badges) {
  return getTier2Badges(badges).length > 0;
}

/**
 * Check if user has any Tier 3 badges
 * @param {Array} badges - Array of badge objects
 * @returns {boolean}
 */
export function hasTier3Badges(badges) {
  return getTier3Badges(badges).length > 0;
}

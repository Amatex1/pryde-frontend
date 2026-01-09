/**
 * Role Helpers - Determine user's primary role for profile display
 * 
 * MISSION: Calm, confident, human identity display
 * 
 * ROLE HIERARCHY:
 * 1. ROLE_FOUNDER - Has "founder" badge
 * 2. ROLE_ADMIN - Has role: admin or super_admin
 * 3. ROLE_MODERATOR - Has role: moderator
 * 4. ROLE_MEMBER - Default (no special role)
 * 
 * DISPLAY RULES:
 * - Only ONE role may appear in the header
 * - Founder takes precedence over all
 * - Admin/Moderator based on user.role field
 * - Member is default (no display)
 */

export const ROLE_TYPES = {
  FOUNDER: 'FOUNDER',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
  MEMBER: 'MEMBER'
};

/**
 * Get the user's primary role for display
 * @param {Object} user - User object with role and badges
 * @returns {string} - One of ROLE_TYPES
 */
export function getPrimaryRole(user) {
  if (!user) return ROLE_TYPES.MEMBER;
  
  // Check for founder badge (highest priority)
  if (user.badges?.some(badge => badge.id === 'founder' || badge.id === 'pryde_team')) {
    return ROLE_TYPES.FOUNDER;
  }
  
  // Check user.role field
  if (user.role === 'admin' || user.role === 'super_admin') {
    return ROLE_TYPES.ADMIN;
  }
  
  if (user.role === 'moderator') {
    return ROLE_TYPES.MODERATOR;
  }
  
  return ROLE_TYPES.MEMBER;
}

/**
 * Get role display configuration
 * @param {string} roleType - One of ROLE_TYPES
 * @returns {Object} - { icon, sublabel, showIcon, showSublabel }
 */
export function getRoleDisplay(roleType) {
  switch (roleType) {
    case ROLE_TYPES.FOUNDER:
      return {
        icon: '✦', // Small sparkle/star glyph
        sublabel: 'Founder & Creator',
        showIcon: true,
        showSublabel: true,
        className: 'role-founder'
      };
      
    case ROLE_TYPES.ADMIN:
      return {
        icon: '🛡️', // Shield icon
        sublabel: 'Administrator',
        showIcon: true,
        showSublabel: true,
        className: 'role-admin'
      };
      
    case ROLE_TYPES.MODERATOR:
      return {
        icon: '🛡️', // Shield icon
        sublabel: 'Moderator',
        showIcon: true,
        showSublabel: true,
        className: 'role-moderator'
      };
      
    case ROLE_TYPES.MEMBER:
    default:
      return {
        icon: null,
        sublabel: null,
        showIcon: false,
        showSublabel: false,
        className: 'role-member'
      };
  }
}

/**
 * Check if user has a special role (not member)
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function hasSpecialRole(user) {
  const role = getPrimaryRole(user);
  return role !== ROLE_TYPES.MEMBER;
}

/**
 * Get only Tier 1 (identity) badges for header display
 * Excludes role badges since they're shown separately
 * @param {Array} badges - User's badges array
 * @returns {Array} - Filtered Tier 1 badges (excluding role badges)
 */
export function getTier1BadgesForHeader(badges) {
  if (!badges || !Array.isArray(badges)) return [];
  
  const TIER_1_BADGE_IDS = [
    'pryde_team',
    'founder',
    'moderator',
    'verified',
    'admin'
  ];
  
  // Filter to Tier 1 badges only
  const tier1Badges = badges.filter(badge => 
    TIER_1_BADGE_IDS.includes(badge.id)
  );
  
  // Exclude role badges (founder, admin, moderator) since they're shown via role display
  const roleExcludedBadges = tier1Badges.filter(badge => 
    !['founder', 'pryde_team', 'admin', 'moderator'].includes(badge.id)
  );
  
  return roleExcludedBadges;
}


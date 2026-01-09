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
  // Updated to use 'founder' badge ID (not 'pryde_team')
  if (user.badges?.some(badge => badge.id === 'founder')) {
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
 *
 * MISSION: Calm, authoritative, human — not flashy, not decorative
 *
 * FOUNDER:
 * - Icon: ✦ (small, Pryde purple, inline with name)
 * - Sublabel: "Founder & Creator" (no pill, no box, no emoji)
 *
 * ADMIN/MODERATOR:
 * - Icon: Subtle shield (small, muted)
 * - Sublabel: "Administrator" or "Moderator" (same typography as Founder)
 *
 * @param {string} roleType - One of ROLE_TYPES
 * @returns {Object} - { icon, sublabel, showIcon, showSublabel, className }
 */
export function getRoleDisplay(roleType) {
  switch (roleType) {
    case ROLE_TYPES.FOUNDER:
      return {
        icon: '✦', // Small sparkle - calm, not loud
        sublabel: 'Founder & Creator',
        showIcon: true,
        showSublabel: true,
        className: 'role-founder'
      };

    case ROLE_TYPES.ADMIN:
      return {
        icon: '🛡️', // Subtle shield
        sublabel: 'Administrator',
        showIcon: true,
        showSublabel: true,
        className: 'role-admin'
      };

    case ROLE_TYPES.MODERATOR:
      return {
        icon: '🛡️', // Subtle shield
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
 * Get only non-CORE_ROLE badges for header display
 * CORE_ROLE badges (Founder/Admin/Moderator/Verified) are shown via role display
 * This returns STATUS and COSMETIC badges that user has chosen to display publicly
 *
 * @param {Array} badges - User's badges array (already filtered by publicBadges on backend)
 * @returns {Array} - Filtered badges (excluding CORE_ROLE badges)
 */
export function getTier1BadgesForHeader(badges) {
  if (!badges || !Array.isArray(badges)) return [];

  // Exclude CORE_ROLE badges since they're shown via role display
  // Only show STATUS and COSMETIC badges that user has chosen to display
  const displayBadges = badges.filter(badge =>
    badge.category !== 'CORE_ROLE'
  );

  return displayBadges;
}


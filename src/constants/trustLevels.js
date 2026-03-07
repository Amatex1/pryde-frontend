/**
 * Trust Level Constants
 * 
 * User-friendly trust level labels and colors for the frontend.
 */

/**
 * Trust level labels for UI display
 */
export const TRUST_LEVEL_LABELS = {
  trusted: 'Trusted Member',
  regular: 'Regular Member',
  new: 'New Member',
  caution: 'Caution',
  restricted: 'Restricted'
};

/**
 * Trust level colors for UI
 */
export const TRUST_LEVEL_COLORS = {
  trusted: '#8B5CF6',   // Purple
  regular: '#3B82F6',   // Blue
  new: '#6B7280',       // Gray
  caution: '#F59E0B',   // Orange
  restricted: '#EF4444' // Red
};

/**
 * Trust level descriptions
 */
export const TRUST_LEVEL_DESCRIPTIONS = {
  trusted: 'You are a trusted member of our community with a proven track record.',
  regular: 'You are an active community member in good standing.',
  new: 'You are a new member. Build trust by engaging positively!',
  caution: 'Some activity has raised flags. Contact support if you believe this is an error.',
  restricted: 'Your account has restrictions due to policy violations.'
};

/**
 * Trust level icons (Lucide icon names)
 */
export const TRUST_LEVEL_ICONS = {
  trusted: 'ShieldCheck',
  regular: 'Shield',
  new: 'Sparkles',
  caution: 'AlertTriangle',
  restricted: 'Ban'
};

/**
 * Trust level thresholds
 */
export const TRUST_LEVEL_THRESHOLDS = {
  trusted: 90,
  regular: 70,
  new: 50,
  caution: 30,
  restricted: 0
};

export default {
  TRUST_LEVEL_LABELS,
  TRUST_LEVEL_COLORS,
  TRUST_LEVEL_DESCRIPTIONS,
  TRUST_LEVEL_ICONS,
  TRUST_LEVEL_THRESHOLDS
};

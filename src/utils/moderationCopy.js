/**
 * PRYDE_MODERATION_ROLLOUT_V4 - Human-First Moderation Copy
 * 
 * Frontend copy for moderation explanations.
 * Uses human-first language that never accuses.
 * 
 * RULES:
 * - Never accuse
 * - Never say "spam" or "violation" for expression
 * - Always imply reversibility and care
 */

/**
 * Explanation code to human-first copy mapping
 * Used for displaying moderation reasons to users and admins
 */
export const EXPLANATION_COPY = {
  // Allow actions
  ALLOWED: {
    title: 'Content Allowed',
    message: 'This content was posted without any adjustments.',
    tone: 'positive'
  },
  EXPRESSIVE_ALLOWED: {
    title: 'Expressive Formatting Detected',
    message: 'Expressive formatting detected. No action was needed.',
    tone: 'positive'
  },

  // Note actions (internal logging)
  NOTE_APPLIED: {
    title: 'Noted for Context',
    message: 'Noted for context. No limits applied.',
    tone: 'neutral'
  },
  FLAGGED_FOR_MONITORING: {
    title: 'Flagged for Monitoring',
    message: 'This content has been flagged for monitoring. No action was taken.',
    tone: 'neutral'
  },

  // Dampen actions
  VISIBILITY_DAMPENED: {
    title: 'Visibility Adjusted',
    message: 'Visibility was briefly reduced to prevent feed flooding.',
    tone: 'info'
  },
  FREQUENCY_DAMPENED: {
    title: 'Frequency Adjustment',
    message: 'We noticed increased posting frequency. A brief adjustment was made.',
    tone: 'info'
  },

  // Review actions
  QUEUED_FOR_REVIEW: {
    title: 'Queued for Review',
    message: 'This content has been queued for a quick human review.',
    tone: 'info'
  },
  NEEDS_CONTEXT_CHECK: {
    title: 'Context Check',
    message: 'This content needs additional context review.',
    tone: 'info'
  },

  // Mute actions
  TEMPORARILY_MUTED: {
    title: 'Brief Pause Applied',
    message: 'A brief pause has been applied. This is temporary and reversible.',
    tone: 'warning'
  },
  COOLDOWN_APPLIED: {
    title: 'Cooldown Active',
    message: 'A short cooldown is in effect. This will expire automatically.',
    tone: 'warning'
  },

  // Block actions
  CONTENT_BLOCKED: {
    title: 'Content Not Posted',
    message: 'This content could not be posted at this time.',
    tone: 'error'
  },
  SAFETY_TRIGGERED: {
    title: 'Safety Check',
    message: 'A safety check was triggered. A human moderator will review.',
    tone: 'error'
  }
};

/**
 * V4 Action labels with human-first language
 */
export const ACTION_LABELS = {
  ALLOW: { icon: '✅', text: 'Allowed', description: 'Content posted normally', color: 'green' },
  NOTE: { icon: '📝', text: 'Note', description: 'Logged for context only', color: 'yellow' },
  DAMPEN: { icon: '🔉', text: 'Dampened', description: 'Visibility briefly adjusted', color: 'orange' },
  REVIEW: { icon: '👀', text: 'Review', description: 'Queued for human review', color: 'blue' },
  MUTE: { icon: '🔇', text: 'Muted', description: 'Brief pause applied', color: 'red' },
  BLOCK: { icon: '🚫', text: 'Blocked', description: 'Content not posted', color: 'red' }
};

/**
 * V4 Rollout phase descriptions
 */
export const ROLLOUT_PHASES = {
  0: { name: 'Shadow Only', description: 'All layers execute, no penalties. Observe only.' },
  1: { name: 'Logging', description: 'NOTE action enabled in LIVE mode.' },
  2: { name: 'Dampening', description: 'Visibility dampening active (non-punitive).' },
  3: { name: 'Review Queue', description: 'Human review queue enabled.' },
  4: { name: 'Muting', description: 'Temporary muting enabled.' },
  5: { name: 'Full Enforcement', description: 'All actions enabled.' }
};

/**
 * Get copy for an explanation code
 * @param {string} code - Explanation code from backend
 * @returns {Object} Copy object with title, message, tone
 */
export function getExplanationCopy(code) {
  return EXPLANATION_COPY[code] || {
    title: 'Unknown Status',
    message: code || 'No additional information available.',
    tone: 'neutral'
  };
}

/**
 * Get label for an action
 * @param {string} action - V4 action (ALLOW, NOTE, DAMPEN, etc.)
 * @returns {Object} Label object with icon, text, description, color
 */
export function getActionLabel(action) {
  return ACTION_LABELS[action] || ACTION_LABELS.ALLOW;
}

/**
 * Get rollout phase info
 * @param {number} phase - Phase number (0-5)
 * @returns {Object} Phase info with name and description
 */
export function getRolloutPhase(phase) {
  return ROLLOUT_PHASES[phase] || ROLLOUT_PHASES[0];
}

export default {
  EXPLANATION_COPY,
  ACTION_LABELS,
  ROLLOUT_PHASES,
  getExplanationCopy,
  getActionLabel,
  getRolloutPhase
};


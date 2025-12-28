/**
 * UserBadge Component
 * 
 * Renders a single badge as a small pill/icon.
 * Non-hierarchical recognition system.
 */

import PropTypes from 'prop-types';
import './UserBadge.css';

// Badge color mapping
const BADGE_COLORS = {
  rainbow: 'badge-rainbow',
  purple: 'badge-purple',
  gold: 'badge-gold',
  silver: 'badge-silver',
  lavender: 'badge-lavender',
  teal: 'badge-teal',
  blue: 'badge-blue',
  green: 'badge-green',
  default: 'badge-default'
};

function UserBadge({ badge, showLabel = false }) {
  // Defensive: return null if badge is missing or invalid
  if (!badge || typeof badge !== 'object') return null;
  if (!badge.id || !badge.label || !badge.icon) return null;

  const colorClass = BADGE_COLORS[badge.color] || BADGE_COLORS.default;

  return (
    <span 
      className={`user-badge ${colorClass}`}
      title={badge.tooltip}
      aria-label={badge.tooltip}
    >
      <span className="user-badge-icon">{badge.icon}</span>
      {showLabel && <span className="user-badge-label">{badge.label}</span>}
    </span>
  );
}

UserBadge.propTypes = {
  badge: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    tooltip: PropTypes.string.isRequired,
    color: PropTypes.string
  }),
  showLabel: PropTypes.bool
};

export default UserBadge;


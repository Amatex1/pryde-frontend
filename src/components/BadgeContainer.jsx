/**
 * BadgeContainer Component
 * 
 * Displays user badges with max 2 inline.
 * Additional badges shown via tooltip/overflow indicator.
 * Fixed height container to prevent layout shifts.
 */

import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import UserBadge from './UserBadge';
import './BadgeContainer.css';

const MAX_INLINE_BADGES = 2;

function BadgeContainer({ badges = [], showLabels = false }) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Filter and sort badges by priority (lower = higher priority)
  // Only include badges that are valid objects with required fields
  const sortedBadges = useMemo(() => {
    if (!badges || !Array.isArray(badges)) return [];
    return badges
      .filter(badge =>
        badge &&
        typeof badge === 'object' &&
        badge.id &&
        badge.label &&
        badge.icon
      )
      .sort((a, b) => (a.priority || 100) - (b.priority || 100));
  }, [badges]);

  const inlineBadges = sortedBadges.slice(0, MAX_INLINE_BADGES);
  const overflowBadges = sortedBadges.slice(MAX_INLINE_BADGES);
  const hasOverflow = overflowBadges.length > 0;

  if (sortedBadges.length === 0) return null;

  return (
    <div className="badge-container">
      {/* Inline badges */}
      {inlineBadges.map(badge => (
        <UserBadge 
          key={badge.id} 
          badge={badge} 
          showLabel={showLabels}
        />
      ))}

      {/* Overflow indicator */}
      {hasOverflow && (
        <span 
          className="badge-overflow-indicator"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={() => setShowTooltip(!showTooltip)}
          role="button"
          tabIndex={0}
          aria-label={`+${overflowBadges.length} more badges`}
        >
          +{overflowBadges.length}
          
          {/* Overflow tooltip */}
          {showTooltip && (
            <div className="badge-overflow-tooltip">
              {overflowBadges.map(badge => (
                <UserBadge 
                  key={badge.id} 
                  badge={badge} 
                  showLabel={true}
                />
              ))}
            </div>
          )}
        </span>
      )}
    </div>
  );
}

BadgeContainer.propTypes = {
  badges: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    tooltip: PropTypes.string.isRequired,
    priority: PropTypes.number,
    color: PropTypes.string
  })),
  showLabels: PropTypes.bool
};

export default BadgeContainer;


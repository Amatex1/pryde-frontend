/**
 * BadgeContainer Component
 *
 * Displays user badges. By default shows max 2 inline with overflow indicator.
 * Use showAll prop to display all badges (e.g., on profile pages).
 * Fixed height container to prevent layout shifts.
 */

import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import UserBadge from './UserBadge';
import './BadgeContainer.css';

const MAX_INLINE_BADGES = 2;

function BadgeContainer({ badges = [], showLabels = false, showAll = false }) {
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

  // When showAll is true, display all badges without overflow
  const inlineBadges = showAll ? sortedBadges : sortedBadges.slice(0, MAX_INLINE_BADGES);
  const overflowBadges = showAll ? [] : sortedBadges.slice(MAX_INLINE_BADGES);
  const hasOverflow = overflowBadges.length > 0;

  if (sortedBadges.length === 0) return null;

  return (
    <div className={`badge-container ${showAll ? 'badge-container-all' : ''}`}>
      {/* Inline badges */}
      {inlineBadges.map(badge => (
        <UserBadge
          key={badge.id}
          badge={badge}
          showLabel={showLabels}
        />
      ))}

      {/* Overflow indicator (only when not showing all) */}
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
  showLabels: PropTypes.bool,
  showAll: PropTypes.bool
};

export default BadgeContainer;


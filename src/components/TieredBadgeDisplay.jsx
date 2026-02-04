/**
 * TieredBadgeDisplay Component
 * 
 * Displays badges in a calm, hierarchical manner:
 * - Tier 1: Identity badges (inline with username)
 * - Tier 2: Status badges (muted row)
 * - Tier 3: Cosmetic badges (popover/modal)
 * 
 * This component enforces visual hierarchy and restraint.
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import UserBadge from './UserBadge';
import { separateBadgesByTier } from '../utils/badgeTiers';
import './TieredBadgeDisplay.css';

function TieredBadgeDisplay({ badges = [], context = 'profile' }) {
  const [showMoreModal, setShowMoreModal] = useState(false);

  const { tier1, tier2, tier3 } = separateBadgesByTier(badges);

  // Combine all badges and show max 2 inline
  const allBadges = [...tier1, ...tier2, ...tier3];
  const inlineBadges = allBadges.slice(0, 2);
  const remainingBadges = allBadges.slice(2);

  // Inline badges (max 2, from all tiers combined)
  const renderInlineBadges = () => {
    if (inlineBadges.length === 0) return null;

    return (
      <div className="badge-inline-row">
        {inlineBadges.map(badge => (
          <UserBadge key={badge.id} badge={badge} showLabel={true} />
        ))}
      </div>
    );
  };

  // "View X more" trigger for remaining badges
  const renderMoreTrigger = () => {
    if (remainingBadges.length === 0) return null;

    return (
      <button
        className="badge-more-trigger"
        onClick={() => setShowMoreModal(!showMoreModal)}
        aria-label="View more badges"
      >
        View {remainingBadges.length} more
      </button>
    );
  };

  // Modal for remaining badges
  const renderMoreModal = () => {
    if (!showMoreModal || remainingBadges.length === 0) return null;

    return (
      <>
        <div
          className="badge-more-backdrop"
          onClick={() => setShowMoreModal(false)}
        />
        <div className="badge-more-modal">
          <div className="badge-more-header">
            <h3>All Badges</h3>
            <button
              className="badge-more-close"
              onClick={() => setShowMoreModal(false)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="badge-more-content">
            {remainingBadges.map(badge => (
              <div key={badge.id} className="badge-more-item">
                <UserBadge badge={badge} showLabel={false} />
                <div className="badge-more-info">
                  <span className="badge-more-label">{badge.label}</span>
                  <span className="badge-more-tooltip">{badge.tooltip}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  if (allBadges.length === 0) {
    return null;
  }

  return (
    <div className={`tiered-badge-display tiered-badge-display--${context}`}>
      {renderInlineBadges()}
      {renderMoreTrigger()}
      {renderMoreModal()}
    </div>
  );
}

TieredBadgeDisplay.propTypes = {
  badges: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    tooltip: PropTypes.string.isRequired,
    priority: PropTypes.number,
    color: PropTypes.string
  })),
  context: PropTypes.oneOf(['profile', 'feed', 'card'])
};

export default TieredBadgeDisplay;

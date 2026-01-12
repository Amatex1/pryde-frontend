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
  const [showTier3Modal, setShowTier3Modal] = useState(false);
  
  const { tier1, tier2, tier3 } = separateBadgesByTier(badges);
  
  // Tier 1: Identity badges (always visible, inline)
  const renderTier1 = () => {
    if (tier1.length === 0) return null;

    return (
      <div className="badge-tier-1">
        {tier1.map(badge => (
          <UserBadge key={badge.id} badge={badge} showLabel={true} />
        ))}
      </div>
    );
  };
  
  // Tier 2: Status badges (muted row)
  const renderTier2 = () => {
    if (tier2.length === 0) return null;
    
    return (
      <div className="badge-tier-2">
        {tier2.map(badge => (
          <UserBadge key={badge.id} badge={badge} showLabel={true} />
        ))}
      </div>
    );
  };
  
  // Tier 3: Cosmetic badges (popover trigger)
  const renderTier3Trigger = () => {
    if (tier3.length === 0) return null;

    return (
      <button
        className="badge-tier-3-trigger"
        onClick={() => setShowTier3Modal(!showTier3Modal)}
        aria-label="View more badges"
      >
        ✨ View {tier3.length} more badge{tier3.length !== 1 ? 's' : ''}
      </button>
    );
  };

  // Tier 3: Modal/popover content
  const renderTier3Modal = () => {
    if (!showTier3Modal || tier3.length === 0) return null;

    return (
      <>
        <div
          className="badge-tier-3-backdrop"
          onClick={() => setShowTier3Modal(false)}
        />
        <div className="badge-tier-3-modal">
          <div className="badge-tier-3-header">
            <h3>All Badges</h3>
            <button
              className="badge-tier-3-close"
              onClick={() => setShowTier3Modal(false)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="badge-tier-3-content">
            {tier3.map(badge => (
              <div key={badge.id} className="badge-tier-3-item">
                <UserBadge badge={badge} showLabel={false} />
                <div className="badge-tier-3-info">
                  <span className="badge-tier-3-label">{badge.label}</span>
                  <span className="badge-tier-3-tooltip">{badge.tooltip}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  if (tier1.length === 0 && tier2.length === 0 && tier3.length === 0) {
    return null;
  }

  return (
    <div className={`tiered-badge-display tiered-badge-display--${context}`}>
      {renderTier1()}
      {renderTier2()}
      {renderTier3Trigger()}
      {renderTier3Modal()}
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

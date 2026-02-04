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

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import UserBadge from './UserBadge';
import { separateBadgesByTier } from '../utils/badgeTiers';
import api from '../utils/api';
import './TieredBadgeDisplay.css';

function TieredBadgeDisplay({ badges = [], context = 'profile', isOwnProfile = false, onEditBadges, authorId }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [fullBadges, setFullBadges] = useState(null);
  const [loadingFullBadges, setLoadingFullBadges] = useState(false);

  // Fetch full badges when modal opens for feed context
  useEffect(() => {
    if (modalOpen && context === 'feed' && authorId && !fullBadges && !loadingFullBadges) {
      setLoadingFullBadges(true);
      api.get(`/badges/user/${authorId}`)
        .then(response => {
          setFullBadges(response.data || []);
        })
        .catch(error => {
          console.error('Failed to fetch full badges:', error);
          setFullBadges([]);
        })
        .finally(() => {
          setLoadingFullBadges(false);
        });
    }
  }, [modalOpen, context, authorId, fullBadges, loadingFullBadges]);

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

    const handleClick = context === 'card' ? () => setExpanded(!expanded) : () => setModalOpen(true);
    const buttonText = context === 'card' && expanded ? 'Minimise' : `View ${remainingBadges.length} more`;

    return (
      <button
        className="badge-tier-3-trigger"
        onClick={handleClick}
        aria-label="View more badges"
      >
        {buttonText}
      </button>
    );
  };

  // Expanded badges for card context
  const renderExpandedBadges = () => {
    if (context !== 'card' || !expanded || remainingBadges.length === 0) return null;

    return (
      <div className="badge-expanded-row">
        {remainingBadges.map(badge => (
          <UserBadge key={badge.id} badge={badge} showLabel={true} />
        ))}
      </div>
    );
  };

  // Modal for all badges
  const renderModal = () => {
    if (!modalOpen) return null;

    // Use full badges for feed context if available, otherwise use allBadges
    const badgesToShow = (context === 'feed' && fullBadges) ? fullBadges : allBadges;

    return (
      <>
        <div className="badge-tier-3-backdrop" onClick={() => setModalOpen(false)} />
        <div className="badge-tier-3-modal">
          <div className="badge-tier-3-header">
            <h3>All badges</h3>
            <button
              className="badge-tier-3-close"
              onClick={() => setModalOpen(false)}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
          <div className="badge-tier-3-content">
            {loadingFullBadges ? (
              <div className="badge-loading">Loading badges...</div>
            ) : (
              badgesToShow.map(badge => (
                <div key={badge.id} className="badge-tier-3-item">
                  <div className="badge-tier-3-info">
                    <UserBadge badge={badge} showLabel={true} />
                    <div className="badge-tier-3-tooltip">{badge.tooltip}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </>
    );
  };

  if (allBadges.length === 0) {
    return null;
  }

  // Badge management hint for profile owners
  const renderBadgeHint = () => {
    if (!isOwnProfile || remainingBadges.length === 0) return null;

    return (
      <button
        className="badge-management-hint"
        onClick={onEditBadges}
        aria-label="Edit badge settings"
      >
        View & rearrange badges
      </button>
    );
  };

  return (
    <>
      <div className={`tiered-badge-display tiered-badge-display--${context}`}>
        {renderInlineBadges()}
        {renderMoreTrigger()}
        {renderBadgeHint()}
        {renderExpandedBadges()}
      </div>
      {renderModal()}
    </>
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
  context: PropTypes.oneOf(['profile', 'feed', 'card']),
  isOwnProfile: PropTypes.bool,
  onEditBadges: PropTypes.func,
  authorId: PropTypes.string
};

export default TieredBadgeDisplay;

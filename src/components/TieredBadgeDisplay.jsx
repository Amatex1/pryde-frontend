/**
 * TieredBadgeDisplay Component
 *
 * Displays badges in a calm, hierarchical manner:
 * - Tier 1: Identity badges (inline with username)
 * - Tier 2: Status badges (muted row)
 * - Tier 3: Cosmetic badges (modal)
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
  const [fullBadges, setFullBadges] = useState(null);
  const [loadingFullBadges, setLoadingFullBadges] = useState(false);

  // Fetch full badges when modal opens for feed context
  useEffect(() => {
    if (modalOpen && context === 'feed' && authorId && !fullBadges && !loadingFullBadges) {
      setLoadingFullBadges(true);
      api.get(`/badges/user/${authorId}`)
        .then(response => {
          const data = response.data || {};
          const flat = [...(data.core || []), ...(data.visible || [])];
          const seen = new Set();
          setFullBadges(flat.filter(b => {
            if (seen.has(b.id)) return false;
            seen.add(b.id);
            return true;
          }));
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

  // Filter badges for post/card contexts to show only authority badges
  const AUTHORITY_BADGE_IDS = ['founder', 'pryde_team', 'admin', 'moderator', 'verified'];

  const filteredBadges = (context === 'card' || context === 'post')
    ? badges.filter(badge => AUTHORITY_BADGE_IDS.includes(badge.id))
    : badges;

  const { tier1, tier2, tier3 } = separateBadgesByTier(filteredBadges);
  const allBadges = [...tier1, ...tier2, ...tier3];

  if (allBadges.length === 0 && !isOwnProfile) {
    return null;
  }

  // --- PROFILE context: proper tiered rendering ---
  if (context === 'profile') {
    // Show nothing if no badges and not own profile (already handled above,
    // but isOwnProfile with no badges still renders the "rearrange" hint)
    if (allBadges.length === 0) {
      return isOwnProfile ? (
        <div className="tiered-badge-display tiered-badge-display--profile">
          <button
            className="badge-management-hint"
            onClick={onEditBadges}
            aria-label="Edit badge settings"
          >
            View & rearrange badges
          </button>
        </div>
      ) : null;
    }

    return (
      <>
        <div className="tiered-badge-display tiered-badge-display--profile">
          {tier1.length > 0 && (
            <div className="badge-tier-1">
              {tier1.map(badge => (
                <UserBadge key={badge.id} badge={badge} showLabel={true} />
              ))}
            </div>
          )}
          {tier2.length > 0 && (
            <div className="badge-tier-2">
              {tier2.map(badge => (
                <UserBadge key={badge.id} badge={badge} showLabel={true} />
              ))}
            </div>
          )}
          {tier3.length > 0 && (
            <button
              className="badge-tier-3-trigger"
              onClick={() => setModalOpen(true)}
              aria-label={`View ${tier3.length} more badge${tier3.length !== 1 ? 's' : ''}`}
            >
              +{tier3.length} more
            </button>
          )}
          {isOwnProfile && (
            <button
              className="badge-management-hint"
              onClick={onEditBadges}
              aria-label="Edit badge settings"
            >
              View & rearrange badges
            </button>
          )}
        </div>

        {modalOpen && (
          <>
            <button
              type="button"
              className="badge-tier-3-backdrop"
              onClick={() => setModalOpen(false)}
              aria-label="Close modal"
            />
            <div className="badge-tier-3-modal" role="dialog" aria-modal="true" aria-label="Badge details">
              <div className="badge-tier-3-header">
                <h3>More badges</h3>
                <button
                  className="badge-tier-3-close"
                  onClick={() => setModalOpen(false)}
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>
              <div className="badge-tier-3-content">
                {tier3.map(badge => (
                  <div key={badge.id} className="badge-tier-3-item">
                    <div className="badge-tier-3-info">
                      <UserBadge badge={badge} showLabel={true} />
                      <div className="badge-tier-3-tooltip">{badge.tooltip}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </>
    );
  }

  // --- FEED context: up to 2 inline, modal shows full badge list ---
  if (context === 'feed') {
    const inlineBadges = allBadges.slice(0, 2);
    const hasMore = allBadges.length > 2;
    const modalBadges = fullBadges || allBadges;

    return (
      <>
        <div className="tiered-badge-display tiered-badge-display--feed">
          <div className="badge-inline-row">
            {inlineBadges.map(badge => (
              <UserBadge key={badge.id} badge={badge} showLabel={true} />
            ))}
          </div>
          {hasMore && (
            <button
              className="badge-tier-3-trigger"
              onClick={() => setModalOpen(true)}
              aria-label="View all badges"
            >
              +{allBadges.length - 2}
            </button>
          )}
        </div>

        {modalOpen && (
          <>
            <button
              type="button"
              className="badge-tier-3-backdrop"
              onClick={() => setModalOpen(false)}
              aria-label="Close modal"
            />
            <div className="badge-tier-3-modal" role="dialog" aria-modal="true" aria-label="All badges">
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
                  modalBadges.map(badge => (
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
        )}
      </>
    );
  }

  // --- CARD/POST context: max 2 authority badges, no expansion ---
  const inlineBadges = allBadges.slice(0, 2);
  if (inlineBadges.length === 0) return null;

  return (
    <div className={`tiered-badge-display tiered-badge-display--${context}`}>
      <div className="badge-inline-row">
        {inlineBadges.map(badge => (
          <UserBadge key={badge.id} badge={badge} showLabel={true} />
        ))}
      </div>
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
  context: PropTypes.oneOf(['profile', 'feed', 'card', 'post']),
  isOwnProfile: PropTypes.bool,
  onEditBadges: PropTypes.func,
  authorId: PropTypes.string
};

export default TieredBadgeDisplay;

/**
 * BadgeViewAllModal
 *
 * Shows all non-CORE_ROLE badges a user holds, categorized by STATUS and COSMETIC.
 * If viewing own profile, allows toggling which badges are shown publicly.
 *
 * Props:
 *   allBadges    - Array of non-core badge objects (from badgeResponse.all)
 *   isOwnProfile - Boolean, shows edit controls when true
 *   onClose      - Called when the modal is dismissed
 *   onUpdate     - Called after a successful visibility save
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../utils/api';
import UserBadge from './UserBadge';
import './BadgeViewAllModal.css';

export default function BadgeViewAllModal({ allBadges = [], isOwnProfile, onClose, onUpdate }) {
  const [publicBadges, setPublicBadges] = useState([]);
  const [hiddenBadges, setHiddenBadges] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);

  // Fetch current visibility settings if editing own profile
  useEffect(() => {
    if (!isOwnProfile) return;
    api.get('/badges/me')
      .then(res => {
        setPublicBadges(res.data.publicBadges || []);
        setHiddenBadges(res.data.hiddenBadges || []);
      })
      .catch(() => {
        // Non-critical — editing won't be available but display still works
      });
  }, [isOwnProfile]);

  const statusBadges = allBadges.filter(b => b.category === 'STATUS');
  const cosmeticBadges = allBadges.filter(b => b.category === 'COSMETIC');

  const isPublic = (id) => publicBadges.includes(id);
  const isHidden = (id) => hiddenBadges.includes(id);

  const nonCorePublicCount = publicBadges.filter(id =>
    allBadges.some(b => b.id === id)
  ).length;

  const toggleBadge = (badgeId) => {
    if (!isOwnProfile) return;
    setError('');

    if (isPublic(badgeId)) {
      // Remove from public
      setPublicBadges(prev => prev.filter(id => id !== badgeId));
    } else {
      // Add to public (enforce 3-badge cap)
      if (nonCorePublicCount >= 3) {
        setError('You can only display up to 3 badges. Remove one first.');
        return;
      }
      setPublicBadges(prev => [...prev, badgeId]);
      // Also remove from hidden if it was there
      setHiddenBadges(prev => prev.filter(id => id !== badgeId));
    }
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put('/badges/me/visibility', { publicBadges, hiddenBadges });
      onUpdate();
    } catch (err) {
      const msg = err.response?.data?.message;
      setError(msg || 'Failed to save. Please try again.');
      setSaving(false);
    }
  };

  const renderBadgeRow = (badge) => (
    <div
      key={badge.id}
      className={`bva-badge-row ${isOwnProfile ? 'bva-badge-row--interactive' : ''} ${isPublic(badge.id) ? 'bva-badge-row--public' : ''}`}
      onClick={() => toggleBadge(badge.id)}
      role={isOwnProfile ? 'button' : undefined}
      tabIndex={isOwnProfile ? 0 : undefined}
      aria-pressed={isOwnProfile ? isPublic(badge.id) : undefined}
      aria-label={isOwnProfile ? `${badge.name || 'Badge'}, currently ${isPublic(badge.id) ? 'shown' : 'hidden'}` : undefined}
      onKeyDown={isOwnProfile ? (e) => { if (e.key === 'Enter' || e.key === ' ') toggleBadge(badge.id); } : undefined}
    >
      <UserBadge badge={badge} showLabel={true} />
      <div className="bva-badge-meta">
        <span className="bva-badge-tooltip">{badge.tooltip}</span>
        {isOwnProfile && (
          <span className={`bva-badge-status ${isPublic(badge.id) ? 'bva-badge-status--on' : ''}`}>
            {isPublic(badge.id) ? 'Shown' : 'Hidden'}
          </span>
        )}
      </div>
    </div>
  );

  const modal = (
    <div className="bva-backdrop" onClick={onClose}>
      <div className="bva-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="All badges">
        <div className="bva-header">
          <h2 className="bva-title">All badges</h2>
          <button className="bva-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {isOwnProfile && (
          <p className="bva-hint">
            {nonCorePublicCount}/3 shown on profile. Tap a badge to toggle.
          </p>
        )}

        <div className="bva-content">
          {statusBadges.length > 0 && (
            <section className="bva-section">
              <h3 className="bva-section-title">Status</h3>
              {statusBadges.map(renderBadgeRow)}
            </section>
          )}

          {cosmeticBadges.length > 0 && (
            <section className="bva-section">
              <h3 className="bva-section-title">Cosmetic</h3>
              {cosmeticBadges.map(renderBadgeRow)}
            </section>
          )}

          {allBadges.length === 0 && (
            <p className="bva-empty">No badges yet.</p>
          )}
        </div>

        {error && <p className="bva-error">{error}</p>}

        {isOwnProfile && dirty && (
          <div className="bva-footer">
            <button className="bva-save" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button className="bva-cancel" onClick={onClose} disabled={saving}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

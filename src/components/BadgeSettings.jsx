/**
 * BadgeSettings - User control over badge visibility
 * 
 * MISSION: Let users control which badges appear on their profile
 * 
 * RULES:
 * - CORE_ROLE badges (Founder/Admin/Moderator/Verified) are always visible
 * - Users can choose up to 3 STATUS or COSMETIC badges to display publicly
 * - Users can reorder their public badges
 * - All other badges go into "View all badges" drawer
 */

import { useState, useEffect } from 'react';
import api from '../utils/api';
import UserBadge from './UserBadge';
import './BadgeSettings.css';

export default function BadgeSettings({ onUpdate }) {
  const [badges, setBadges] = useState([]);
  const [publicBadges, setPublicBadges] = useState([]);
  const [hiddenBadges, setHiddenBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      const response = await api.get('/badges/me');
      setBadges(response.data.badges || []);
      setPublicBadges(response.data.publicBadges || []);
      setHiddenBadges(response.data.hiddenBadges || []);
    } catch (error) {
      console.error('Failed to fetch badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.put('/badges/me/visibility', {
        publicBadges,
        hiddenBadges
      });
      setMessage('Badge settings saved successfully!');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to save badge settings:', error);
      setMessage(error.response?.data?.message || 'Failed to save badge settings');
    } finally {
      setSaving(false);
    }
  };

  const togglePublicBadge = (badgeId) => {
    if (publicBadges.includes(badgeId)) {
      setPublicBadges(publicBadges.filter(id => id !== badgeId));
    } else {
      // Count only non-CORE_ROLE badges toward the 3-badge limit
      const nonCoreRolePublicBadges = publicBadges.filter(id => {
        const badge = badges.find(b => b.id === id);
        return badge && badge.category !== 'CORE_ROLE';
      });

      if (nonCoreRolePublicBadges.length >= 3) {
        setMessage('You can only display up to 3 public badges (excluding core role badges)');
        return;
      }
      setPublicBadges([...publicBadges, badgeId]);
    }
  };

  const coreRoleBadges = badges.filter(b => b.category === 'CORE_ROLE');
  const controllableBadges = badges.filter(b => b.category !== 'CORE_ROLE');

  // Count only non-CORE_ROLE badges for the display counter
  const nonCoreRolePublicCount = publicBadges.filter(id => {
    const badge = badges.find(b => b.id === id);
    return badge && badge.category !== 'CORE_ROLE';
  }).length;

  if (loading) return <div>Loading badges...</div>;

  return (
    <div className="badge-settings">
      <h3>Public Badges</h3>
      <p className="badge-settings-description">
        Choose up to 3 badges to display on your profile. Core role badges (Founder/Admin/Moderator/Verified) are always visible.
      </p>

      {/* Core Role Badges (always visible) */}
      {coreRoleBadges.length > 0 && (
        <div className="badge-section">
          <h4>Core Role Badges (Always Visible)</h4>
          <div className="badge-grid">
            {coreRoleBadges.map(badge => (
              <div key={badge.id} className="badge-item disabled">
                <UserBadge badge={badge} showLabel={true} />
                <span className="badge-status">Always visible</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controllable Badges */}
      {controllableBadges.length > 0 && (
        <div className="badge-section">
          <h4>Your Badges ({nonCoreRolePublicCount}/3 selected)</h4>
          <div className="badge-grid">
            {controllableBadges.map(badge => (
              <div 
                key={badge.id} 
                className={`badge-item ${publicBadges.includes(badge.id) ? 'selected' : ''}`}
                onClick={() => togglePublicBadge(badge.id)}
              >
                <UserBadge badge={badge} showLabel={true} />
                <span className="badge-status">
                  {publicBadges.includes(badge.id) ? '✓ Public' : 'Hidden'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {controllableBadges.length === 0 && (
        <p className="no-badges">You don't have any badges yet.</p>
      )}

      <button 
        onClick={handleSave} 
        disabled={saving}
        className="save-button"
      >
        {saving ? 'Saving...' : 'Save Badge Settings'}
      </button>

      {message && (
        <p className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </p>
      )}
    </div>
  );
}


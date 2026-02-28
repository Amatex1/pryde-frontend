/**
 * ProfileIdentitySpine - Calm, confident, human identity display
 *
 * VERTICAL ORDER:
 * 1. Display Name + Role Icon
 * 2. Username
 * 3. Role Sublabel (Founder/Admin/Moderator only)
 * 4. Core badges (CORE_ROLE — always visible, distinct styling)
 * 5. Visible badges (STATUS/COSMETIC — up to 3, user-controlled)
 *    + "View all" trigger when more badges exist
 * 6. Pronouns / Gender / Age (neutral pills)
 * 7. Bio (emotional core)
 * 8. Stats (muted, below bio)
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getPrimaryRole, getRoleDisplay } from '../../utils/roleHelpers';
import { sanitizeBio } from '../../utils/sanitize';
import UserBadge from '../../components/UserBadge';
import BadgeViewAllModal from '../../components/BadgeViewAllModal';
import './ProfileIdentitySpine.css';

export default function ProfileIdentitySpine({
  user,
  userBadges = { core: [], visible: [], all: [] },
  postsCount,
  isOwnProfile = false,
  onBadgesUpdated,
}) {
  const [viewAllOpen, setViewAllOpen] = useState(false);

  if (!user) return null;

  const { core = [], visible = [], all = [] } = userBadges;

  // Role display uses core badges to detect founder/admin/moderator
  const userWithCoreBadges = { ...user, badges: core };
  const primaryRole = getPrimaryRole(userWithCoreBadges);
  const roleDisplay = getRoleDisplay(primaryRole);

  const hasMoreBadges = all.length > visible.length;

  const getAge = () => {
    if (!user.birthday) return null;
    const birthDate = new Date(user.birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = getAge();

  return (
    <div className="profile-identity-spine">
      {/* 1. Display Name + Role Icon */}
      <div className="pis-name-row">
        <h1 className="pis-display-name">
          {user.displayName || user.fullName || user.username}
          {roleDisplay.showIcon && (
            <span className={`pis-role-icon ${roleDisplay.className}`}>
              {roleDisplay.icon}
            </span>
          )}
        </h1>
      </div>

      {/* 2. Username */}
      <p className="pis-username">@{user.username}</p>

      {/* 3. Role Sublabel (Founder/Admin/Moderator only) */}
      {roleDisplay.showSublabel && (
        <p className={`pis-role-sublabel ${roleDisplay.className}`}>
          {roleDisplay.sublabel}
        </p>
      )}

      {/* 4. Core badges — always visible, stronger styling */}
      {core.length > 0 && (
        <div className="pis-core-badges">
          {core.map(badge => (
            <UserBadge key={badge.id} badge={badge} showLabel={true} />
          ))}
        </div>
      )}

      {/* 5. Visible badges (STATUS/COSMETIC — up to 3) + view all trigger */}
      {(visible.length > 0 || hasMoreBadges) && (
        <div className="pis-public-badges">
          {visible.map(badge => (
            <UserBadge key={badge.id} badge={badge} showLabel={true} />
          ))}
          {hasMoreBadges && (
            <button
              className="pis-view-all-btn"
              onClick={() => setViewAllOpen(true)}
              aria-label="View all badges"
            >
              +{all.length - visible.length} more
            </button>
          )}
        </div>
      )}

      {/* 6. Pronouns / Gender / Age */}
      {(user.pronouns || user.gender || age) && (
        <div className="pis-traits">
          {user.pronouns && (
            <span className="pis-trait-pill">
              {user.pronouns.charAt(0).toUpperCase() + user.pronouns.slice(1)}
            </span>
          )}
          {user.gender && (
            <span className="pis-trait-pill">
              {user.gender.charAt(0).toUpperCase() + user.gender.slice(1)}
            </span>
          )}
          {age && (
            <span className="pis-trait-pill">{age} years old</span>
          )}
        </div>
      )}

      {/* 7. Bio */}
      {user.bio && (
        <p className="pis-bio">{sanitizeBio(user.bio)}</p>
      )}

      {/* 8. Stats */}
      <div className="pis-stats">
        <div className="pis-stat-item">
          <span className="pis-stat-value">{postsCount}</span>
          <span className="pis-stat-label">Posts</span>
        </div>
        <Link to={`/profile/${user.username}/followers`} className="pis-stat-item">
          <span className="pis-stat-value">{user.followers?.length || 0}</span>
          <span className="pis-stat-label">Followers</span>
        </Link>
        <Link to={`/profile/${user.username}/following`} className="pis-stat-item">
          <span className="pis-stat-value">{user.following?.length || 0}</span>
          <span className="pis-stat-label">Following</span>
        </Link>
      </div>

      {/* View All Modal */}
      {viewAllOpen && (
        <BadgeViewAllModal
          allBadges={all}
          isOwnProfile={isOwnProfile}
          onClose={() => setViewAllOpen(false)}
          onUpdate={() => {
            setViewAllOpen(false);
            onBadgesUpdated?.();
          }}
        />
      )}
    </div>
  );
}

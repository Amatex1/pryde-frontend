/**
 * ProfileIdentitySpine - Calm, confident, human identity display
 *
 * MISSION: Profiles feel like real people in a real community
 *
 * VERTICAL ORDER:
 * 1. Avatar
 * 2. Display Name + Role Icon
 * 3. Username
 * 4. Role Sublabel (Founder/Admin/Moderator only)
 * 5. Public Badges (up to 3, with labels, soft pills)
 * 6. Pronouns / Gender / Age (neutral pills)
 * 7. Bio (emotional core)
 * 8. Stats (muted, below bio)
 *
 * RULES:
 * - Single vertical column
 * - No floating elements
 * - No side-by-side blocks
 * - Bio is the largest readable block
 * - Stats are muted and below bio
 * - All badges MUST have readable labels (no icon-only badges)
 */

import { Link } from 'react-router-dom';
import { getPrimaryRole, getRoleDisplay, getTier1BadgesForHeader } from '../../utils/roleHelpers';
import { sanitizeBio } from '../../utils/sanitize';
import UserBadge from '../../components/UserBadge';
import './ProfileIdentitySpine.css';

export default function ProfileIdentitySpine({ user, postsCount }) {
  if (!user) return null;

  const primaryRole = getPrimaryRole(user);
  const roleDisplay = getRoleDisplay(primaryRole);
  // Get public badges (STATUS and COSMETIC only, max 3)
  const publicBadges = getTier1BadgesForHeader(user.badges);
  
  // Calculate age from birthday
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

      {/* 4. Public Badges (up to 3, with labels, soft pills) */}
      {publicBadges.length > 0 && (
        <div className="pis-public-badges">
          {publicBadges.map(badge => (
            <UserBadge key={badge.id} badge={badge} showLabel={true} />
          ))}
        </div>
      )}

      {/* 5. Pronouns / Gender / Age (neutral pills, single row) */}
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
            <span className="pis-trait-pill">
              {age} years old
            </span>
          )}
        </div>
      )}

      {/* 6. Bio (emotional core - largest readable block) */}
      {user.bio && (
        <p className="pis-bio">{sanitizeBio(user.bio)}</p>
      )}

      {/* 7. Stats (muted, horizontal row below bio) */}
      <div className="pis-stats">
        <div className="pis-stat-item">
          <span className="pis-stat-value">{postsCount}</span>
          <span className="pis-stat-label">Posts</span>
        </div>
        <Link
          to={`/profile/${user.username}/followers`}
          className="pis-stat-item"
        >
          <span className="pis-stat-value">{user.followers?.length || 0}</span>
          <span className="pis-stat-label">Followers</span>
        </Link>
        <Link
          to={`/profile/${user.username}/following`}
          className="pis-stat-item"
        >
          <span className="pis-stat-value">{user.following?.length || 0}</span>
          <span className="pis-stat-label">Following</span>
        </Link>
      </div>
    </div>
  );
}


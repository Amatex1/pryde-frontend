/**
 * ProfileSidebar - Sidebar content for Profile page
 * 
 * RESPONSIBILITIES:
 * - Render user interests, looking for, social links
 * - Receive all data via props
 * 
 * RULES:
 * - NO layout logic (widths, grids, media queries)
 * - NO data fetching
 * - Layout-agnostic: renders the same on all platforms
 */

import './ProfileSidebar.css';

export default function ProfileSidebar({
  user,
  isOwnProfile = false,
}) {
  if (!user) return null;

  const hasInterests = user.interests && user.interests.length > 0;
  const hasLookingFor = user.lookingFor && user.lookingFor.length > 0;
  const hasSocialLinks = user.socialLinks && user.socialLinks.length > 0;

  // Don't render anything if no sidebar content
  if (!hasInterests && !hasLookingFor && !hasSocialLinks) {
    return null;
  }

  return (
    <div className="profile-sidebar-content">
      {/* Interests */}
      {hasInterests && (
        <div className="sidebar-card glossy fade-in">
          <h3 className="sidebar-title">🏷️ Interests</h3>
          <div className="interests-tags">
            {user.interests.map((interest, index) => (
              <span key={index} className="interest-tag">{interest}</span>
            ))}
          </div>
        </div>
      )}

      {/* Looking For */}
      {hasLookingFor && (
        <div className="sidebar-card glossy fade-in">
          <h3 className="sidebar-title">🔍 Looking For</h3>
          <div className="looking-for-list">
            {user.lookingFor.map((item, index) => (
              <span key={index} className="looking-for-item">
                {item === 'friends' && '👥 Friends'}
                {item === 'support' && '🤝 Support'}
                {item === 'community' && '🌈 Community'}
                {item === 'networking' && '💼 Networking'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Social Links */}
      {hasSocialLinks && (
        <div className="sidebar-card glossy fade-in">
          <h3 className="sidebar-title">🔗 Social Links</h3>
          <div className="social-links-list">
            {user.socialLinks.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
              >
                <strong>{link.platform}</strong>
                <span className="link-arrow">→</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


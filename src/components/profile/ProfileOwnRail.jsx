import { ChevronRight, Globe, MessageCircle, Search, UserPlus, Users } from 'lucide-react';

const LOOKING_FOR_LABELS = {
  friends: 'Friends',
  support: 'Support',
  community: 'Community',
  networking: 'Networking',
};

const LOOKING_FOR_ICONS = {
  friends: <Users size={14} strokeWidth={1.75} aria-hidden="true" />,
  support: <MessageCircle size={14} strokeWidth={1.75} aria-hidden="true" />,
  community: <Globe size={14} strokeWidth={1.75} aria-hidden="true" />,
  networking: <UserPlus size={14} strokeWidth={1.75} aria-hidden="true" />,
};

function ProfileOwnRail({ user, variant = 'desktop' }) {
  if (!user) return null;

  const hasInterests = user.interests?.length > 0;
  const hasLookingFor = user.lookingFor?.length > 0;
  const hasSocialLinks = user.socialLinks?.length > 0;

  if (!hasInterests && !hasLookingFor && !hasSocialLinks) return null;

  if (variant === 'mobile') {
    return (
      <div className="mobile-profile-sidebar">
        {hasInterests && (
          <div className="profile-rail-section">
            <h3 className="profile-rail-section-title">🏷️ Interests</h3>
            <div className="looking-for-grid">
              {user.interests.map((interest, index) => (
                <div key={index} className="looking-for-item">
                  <span className="looking-for-icon">🏷️</span>
                  <span className="looking-for-label">{interest}</span>
                </div>
              ))}
            </div>
            <div className="profile-rail-divider"></div>
          </div>
        )}

        {hasLookingFor && (
          <div className="profile-rail-section">
            <h3 className="profile-rail-section-title"><Search size={14} strokeWidth={1.75} aria-hidden="true" /> Looking For</h3>
            <div className="looking-for-grid">
              {user.lookingFor.map((item, index) => (
                <div key={index} className="looking-for-item">
                  <span className="looking-for-icon">{LOOKING_FOR_ICONS[item] || null}</span>
                  <span className="looking-for-label">{LOOKING_FOR_LABELS[item] || item}</span>
                </div>
              ))}
            </div>
            <div className="profile-rail-divider"></div>
          </div>
        )}

        {hasSocialLinks && (
          <div className="profile-rail-section">
            <h3 className="profile-rail-section-title">Social Links</h3>
            <div className="social-links-inline">
              {user.socialLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link-item"
                >
                  <span className="social-platform-label">{link.platform}</span>
                  <ChevronRight size={14} strokeWidth={1.75} className="social-external-arrow" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="create-post-sidebar">
      {hasInterests && (
        <div className="sidebar-card glossy fade-in">
          <h3 className="sidebar-title">🏷️ Interests</h3>
          <div className="looking-for-list">
            {user.interests.map((interest, index) => (
              <span key={index} className="looking-for-item">🏷️ {interest}</span>
            ))}
          </div>
        </div>
      )}

      {hasLookingFor && (
        <div className="sidebar-card glossy fade-in">
          <h3 className="sidebar-title"><Search size={14} strokeWidth={1.75} aria-hidden="true" /> Looking For</h3>
          <div className="looking-for-list">
            {user.lookingFor.map((item, index) => (
              <span key={index} className="looking-for-item">{LOOKING_FOR_LABELS[item] || item}</span>
            ))}
          </div>
        </div>
      )}

      {hasSocialLinks && (
        <div className="sidebar-card glossy fade-in">
          <h3 className="sidebar-title">Social Links</h3>
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
                <ChevronRight size={14} strokeWidth={1.75} className="link-arrow" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileOwnRail;
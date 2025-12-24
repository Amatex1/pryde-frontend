import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

/**
 * MobileHeader - Context-aware mobile header
 * Shows dynamic titles based on current route
 * Displays back button for nested routes
 * 3-column grid layout: left (back) | center (title) | right (actions)
 */

const TITLES = {
  '/feed': 'Feed',
  '/messages': 'Messages',
  '/profile': 'Profile',
  '/discover': 'Discover',
  '/notifications': 'Notifications',
  '/bookmarks': 'Bookmarks',
  '/events': 'Events',
  '/lounge': 'Lounge',
  '/settings': 'Settings',
  '/journal': 'Journal',
  '/longform': 'Longform',
  '/photo-essay': 'Photo Essay',
};

export default function MobileHeader() {
  const location = useLocation();
  const navigate = useNavigate();

  const path = location.pathname;

  // Find matching title by checking if path starts with any known route
  const matchedRoute = Object.keys(TITLES).find((route) => path.startsWith(route));
  const title = matchedRoute ? TITLES[matchedRoute] : 'Pryde';

  // Show back button for nested routes (e.g., /messages/123, /settings/security)
  const showBack =
    path.includes('/messages/') ||
    path.includes('/settings/') ||
    path.includes('/profile/') && !path.endsWith('/me') ||
    path.includes('/tags/') ||
    path.includes('/hashtag/');

  return (
    <header className="mobile-header">
      <div className="mobile-header-left">
        {showBack && (
          <button
            className="mobile-back"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
        )}
      </div>

      <div className="mobile-header-title">
        {title}
      </div>

      <div className="mobile-header-right">
        {/* Reserved for future actions (search, settings, etc.) */}
      </div>
    </header>
  );
}


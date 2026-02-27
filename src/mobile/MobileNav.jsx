import { NavLink } from 'react-router-dom';
// PERFORMANCE: Tree-shake lucide-react - import only used icons
import Home from 'lucide-react/dist/esm/icons/home';
import Search from 'lucide-react/dist/esm/icons/search';
import Plus from 'lucide-react/dist/esm/icons/plus';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import User from 'lucide-react/dist/esm/icons/user';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import { useAuth } from '../context/AuthContext';
import { LUCIDE_DEFAULTS } from '../utils/lucideDefaults';

/**
 * MobileNav - Polished bottom navigation bar
 * Compact, app-like design with clear visual hierarchy
 * Icons are larger, labels are smaller for better scannability
 * Features unread message badge on Messages tab
 */
export default function MobileNav() {
  const unread = useUnreadMessages();
  const { user } = useAuth();

  return (
    <nav className="mobile-nav" role="navigation" aria-label="Main navigation">
      <NavLink to="/feed" aria-label="Home">
        <span className="nav-icon">
          <Home {...LUCIDE_DEFAULTS} />
        </span>
        <small>Home</small>
      </NavLink>

      <NavLink to="/search" aria-label="Search">
        <span className="nav-icon">
          <Search {...LUCIDE_DEFAULTS} />
        </span>
        <small>Search</small>
      </NavLink>

      <NavLink to="/feed" aria-label="Post">
        <span className="nav-icon">
          <Plus {...LUCIDE_DEFAULTS} />
        </span>
        <small>Post</small>
      </NavLink>

      <NavLink to="/messages" aria-label="Messages" className="mobile-nav-messages">
        <span className="nav-icon">
          <MessageCircle {...LUCIDE_DEFAULTS} />
          {unread > 0 && (
            <em className="nav-badge" aria-label={`${unread} unread messages`}>
              {unread > 9 ? '9+' : unread}
            </em>
          )}
        </span>
        <small>Messages</small>
      </NavLink>

      <NavLink to={user?.username ? `/profile/${user.username}` : '/feed'} aria-label="Profile">
        <span className="nav-icon">
          <User {...LUCIDE_DEFAULTS} />
        </span>
        <small>Profile</small>
      </NavLink>
    </nav>
  );
}


import { NavLink } from 'react-router-dom';
import { Home, Search, Plus, MessageCircle, User } from 'lucide-react';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import { useAuth } from '../context/AuthContext';

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
          <Home size={20} strokeWidth={2} />
        </span>
        <small>Home</small>
      </NavLink>

      <NavLink to="/search" aria-label="Search">
        <span className="nav-icon">
          <Search size={20} strokeWidth={2} />
        </span>
        <small>Search</small>
      </NavLink>

      <NavLink to="/feed" aria-label="Post">
        <span className="nav-icon">
          <Plus size={20} strokeWidth={2} />
        </span>
        <small>Post</small>
      </NavLink>

      <NavLink to="/messages" aria-label="Messages" className="mobile-nav-messages">
        <span className="nav-icon">
          <MessageCircle size={20} strokeWidth={2} />
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
          <User size={20} strokeWidth={2} />
        </span>
        <small>Profile</small>
      </NavLink>
    </nav>
  );
}


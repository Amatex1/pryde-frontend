import { NavLink } from 'react-router-dom';

/**
 * MobileNav - Polished bottom navigation bar
 * Compact, app-like design with clear visual hierarchy
 * Icons are larger, labels are smaller for better scannability
 */
export default function MobileNav() {
  return (
    <nav className="mobile-nav" role="navigation" aria-label="Main navigation">
      <NavLink to="/feed" aria-label="Home">
        <span className="nav-icon" role="img" aria-hidden="true">🏠</span>
        <small>Home</small>
      </NavLink>

      <NavLink to="/discover" aria-label="Search">
        <span className="nav-icon" role="img" aria-hidden="true">🔍</span>
        <small>Search</small>
      </NavLink>

      <NavLink to="/feed" aria-label="Post">
        <span className="nav-icon" role="img" aria-hidden="true">➕</span>
        <small>Post</small>
      </NavLink>

      <NavLink to="/messages" aria-label="Messages">
        <span className="nav-icon" role="img" aria-hidden="true">💬</span>
        <small>Messages</small>
      </NavLink>

      <NavLink to="/profile/me" aria-label="Profile">
        <span className="nav-icon" role="img" aria-hidden="true">👤</span>
        <small>Profile</small>
      </NavLink>
    </nav>
  );
}


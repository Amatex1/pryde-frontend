import { NavLink } from 'react-router-dom';

/**
 * MobileNav - Bottom navigation bar
 * Provides quick access to main app sections
 */
export default function MobileNav({ currentPath }) {
  return (
    <nav className="mobile-nav" role="navigation" aria-label="Main navigation">
      <NavLink 
        to="/feed" 
        className={({ isActive }) => isActive ? 'active' : ''}
        aria-label="Home feed"
      >
        <span role="img" aria-hidden="true">🏠</span>
        <span>Home</span>
      </NavLink>

      <NavLink 
        to="/discover" 
        className={({ isActive }) => isActive ? 'active' : ''}
        aria-label="Search and discover"
      >
        <span role="img" aria-hidden="true">🔍</span>
        <span>Search</span>
      </NavLink>

      <NavLink 
        to="/feed" 
        className={({ isActive }) => isActive ? 'active' : ''}
        aria-label="Create post"
      >
        <span role="img" aria-hidden="true">➕</span>
        <span>Post</span>
      </NavLink>

      <NavLink 
        to="/messages" 
        className={({ isActive }) => isActive ? 'active' : ''}
        aria-label="Messages"
      >
        <span role="img" aria-hidden="true">💬</span>
        <span>Messages</span>
      </NavLink>

      <NavLink 
        to="/profile/me" 
        className={({ isActive }) => isActive ? 'active' : ''}
        aria-label="Your profile"
      >
        <span role="img" aria-hidden="true">👤</span>
        <span>Profile</span>
      </NavLink>
    </nav>
  );
}


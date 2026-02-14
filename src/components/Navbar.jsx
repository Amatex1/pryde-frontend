import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useMediaQuery } from 'react-responsive';
import { logout } from '../utils/auth';
import { getImageUrl } from '../utils/imageUrl';
import { prefetchRoute, prefetchOnIdle } from '../utils/routePrefetch';
import DarkModeToggle from './DarkModeToggle';
import GlobalSearch from './GlobalSearch';
import NotificationBell from './NotificationBell';
import MessagesDropdown from './MessagesDropdown';
import { SkeletonNavbarActions } from './SkeletonLoader';
import api from '../utils/api';
import { getTheme, toggleTheme as toggleThemeManager, getQuietMode, setQuietMode as setQuietModeManager, getGalaxyMode, toggleGalaxyMode as toggleGalaxyModeManager } from '../utils/themeManager';
import prydeLogo from '../assets/pryde-logo.png';
import { useAuth } from '../context/AuthContext';
import { useUnreadMessages } from '../hooks/useUnreadMessages'; // ✅ Use singleton hook
import './Navbar.css';

// Hook to get dark mode state using centralized theme manager
function useDarkMode() {
  const [isDark, setIsDark] = useState(() => getTheme() === 'dark');

  const toggleDarkMode = () => {
    const newTheme = toggleThemeManager();
    setIsDark(newTheme === 'dark');
  };

  return [isDark, toggleDarkMode];
}

/**
 * Navbar Component
 *
 * @param {Object} props
 * @param {Function} props.onMenuClick - Optional callback when hamburger menu is clicked
 *                                       If provided, mobile menu is controlled externally (by AppLayout)
 *                                       If not provided, uses internal state (legacy behavior)
 */
function Navbar({ onMenuClick }) {
  const navigate = useNavigate();
  const isDesktop = useMediaQuery({ minWidth: 1024 });
  const { user, updateUser, clearUser } = useAuth(); // Use centralized auth context
  const [showDropdown, setShowDropdown] = useState(false);
  // Internal mobile menu state - only used if onMenuClick is not provided
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isDark, toggleDarkMode] = useDarkMode();
  const [quietMode, setQuietMode] = useState(() => getQuietMode());
  const [galaxyMode, setGalaxyMode] = useState(() => getGalaxyMode());
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // ✅ Use singleton hook instead of creating own interval
  const { totalUnread } = useUnreadMessages();

  // Determine if we're using external control
  const isExternallyControlled = typeof onMenuClick === 'function';

  const handleLogout = () => {
    // Clear AuthContext first
    clearUser();
    // Then call logout (which handles everything else)
    logout();
    // logout() now handles redirect internally with window.location.href
  };

  const toggleQuietMode = async () => {
    const newValue = !quietMode;
    setQuietMode(newValue);
    setQuietModeManager(newValue);

    // Sync with backend
    try {
      await api.patch('/users/me/settings', { quietModeEnabled: newValue });
    } catch (error) {
      console.error('Failed to sync quiet mode:', error);
    }
  };

  const toggleGalaxyMode = () => {
    const newValue = toggleGalaxyModeManager();
    setGalaxyMode(newValue);
  };

  // Sync quiet mode from user data (only on mount)
  useEffect(() => {
    // Only sync if user is logged in
    if (!user) {
      return;
    }

    // Only sync quiet mode from backend on initial load if not already set locally
    const localQuietMode = localStorage.getItem('quietMode');
    if (localQuietMode === null) {
      // First time loading - use backend value
      const backendQuietMode = user.privacySettings?.quietModeEnabled || false;
      setQuietMode(backendQuietMode);
      localStorage.setItem('quietMode', backendQuietMode);
      setQuietModeManager(backendQuietMode);
    }
    // If already set locally, don't override (user may have just toggled it)
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // PERFORMANCE: Prefetch critical routes on idle
  useEffect(() => {
    prefetchOnIdle(['/messages', '/profile', '/lounge']);
  }, []);

  return (
    <nav className="navbar glossy" role="navigation" aria-label="Main navigation">
      {/* Left: Logo/Brand */}
      <div className="navbar-logo">
        <Link to="/feed" className="navbar-brand" aria-label="Pryde Social - Go to feed">
          <img
            src={prydeLogo}
            alt=""
            aria-hidden="true"
            className="brand-logo"
            width="36"
            height="36"
            loading="eager"
            fetchPriority="high"
          />
          <span className="brand-text">Pryde Social</span>
        </Link>
      </div>

      {/* Center: Search */}
      <div className="navbar-utility-search">
        <GlobalSearch variant="compact" />
      </div>

        {/* Mobile Hamburger Menu - Only render on non-desktop */}
        {!isDesktop && (
          <button
            className="mobile-hamburger-btn"
            onPointerUp={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Use external handler if provided, otherwise toggle internal state
              if (isExternallyControlled) {
                onMenuClick();
              } else {
                setShowMobileMenu(prev => !prev);
              }
            }}
            aria-label="Open menu"
            aria-expanded={false}
            aria-controls="mobile-menu"
          >
            <span aria-hidden="true">☰</span>
          </button>
        )}

        {/* Mobile Menu Overlay - Only render when using internal state (legacy) */}
        {!isExternallyControlled && !isDesktop && showMobileMenu && (
          <div
            className="mobile-menu-overlay"
            onClick={() => setShowMobileMenu(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile Menu - Only render when using internal state (legacy) */}
        {/* When externally controlled, MobileNavDrawer handles the menu */}
        {!isExternallyControlled && !isDesktop && (
        <div
          id="mobile-menu"
          className={`mobile-menu ${showMobileMenu ? 'mobile-menu-visible' : ''}`}
          ref={mobileMenuRef}
          role="menu"
          aria-label="Mobile navigation menu"
          aria-hidden={!showMobileMenu}
        >
          <div className="mobile-menu-header">
            <div className="mobile-menu-user">
              <div className="mobile-menu-avatar" aria-hidden="true">
                {user?.profilePhoto ? (
                  <img src={getImageUrl(user.profilePhoto)} alt="" />
                ) : (
                  <span>{user?.username?.charAt(0).toUpperCase() || '?'}</span>
                )}
              </div>
              <div className="mobile-menu-user-info">
                <div className="mobile-menu-username">{user?.displayName || user?.username}</div>
                <Link to={`/profile/${user?.username}`} className="mobile-menu-view-profile" onClick={() => setShowMobileMenu(false)}>
                  View Profile
                </Link>
              </div>
            </div>
          </div>

          <div className="mobile-menu-items" role="menuitem">
            <Link to="/feed" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
              <span className="mobile-menu-icon" aria-hidden="true">🏠</span>
              <span>Feed</span>
            </Link>

            {/* =========================================
                Explore Pryde — Mobile Access
               ========================================= */}
            <div className="mobile-menu-section-header">Explore Pryde</div>
            <Link to="/groups" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
              <span className="mobile-menu-icon" aria-hidden="true">👥</span>
              <span>Groups</span>
            </Link>
            <Link to="/journal" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
              <span className="mobile-menu-icon" aria-hidden="true">📔</span>
              <span>Journal</span>
            </Link>
            <Link to="/longform" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
              <span className="mobile-menu-icon" aria-hidden="true">📖</span>
              <span>Stories</span>
            </Link>
            <Link to="/photo-essay" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
              <span className="mobile-menu-icon" aria-hidden="true">📸</span>
              <span>Photos</span>
            </Link>
            <Link to="/lounge" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
              <span className="mobile-menu-icon" aria-hidden="true">✨</span>
              <span>Lounge</span>
            </Link>
            <Link to="/messages" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
              <span className="mobile-menu-icon" aria-hidden="true">💬</span>
              <span>Messages</span>
              {totalUnread > 0 && (
                <span className="mobile-menu-badge" aria-label={`${totalUnread} unread messages`}>{totalUnread}</span>
              )}
            </Link>
            <Link to="/notifications" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
              <span className="mobile-menu-icon" aria-hidden="true">🔔</span>
              <span>Notifications</span>
            </Link>
            <Link to="/bookmarks" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
              <span className="mobile-menu-icon" aria-hidden="true">🔖</span>
              <span>Bookmarks</span>
            </Link>
            <Link to="/events" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
              <span className="mobile-menu-icon" aria-hidden="true">📅</span>
              <span>Events</span>
            </Link>
            {user?.role && ['moderator', 'admin', 'super_admin'].includes(user.role) && (
              <Link to="/admin" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
                <span className="mobile-menu-icon" aria-hidden="true">🛡️</span>
                <span>Admin Panel</span>
              </Link>
            )}
            <div className="mobile-menu-divider" role="separator" aria-hidden="true"></div>
            <Link to="/settings" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
              <span className="mobile-menu-icon" aria-hidden="true">⚙️</span>
              <span>Settings</span>
            </Link>
            <button
              className="mobile-menu-item"
              onClick={toggleDarkMode}
              aria-label={`${isDark ? 'Disable' : 'Enable'} dark mode`}
              aria-pressed={isDark}
            >
              <span className="mobile-menu-icon" aria-hidden="true">{isDark ? '☀️' : '🌙'}</span>
              <div className="mobile-menu-item-content">
                <span className="mobile-menu-item-title">Dark Mode</span>
                <span className="mobile-menu-item-description">
                  {isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                </span>
              </div>
              {isDark && <span className="mode-indicator" aria-hidden="true">✓</span>}
            </button>
            <button
              className="mobile-menu-item"
              onClick={toggleQuietMode}
              aria-label={`${quietMode ? 'Disable' : 'Enable'} quiet mode - peaceful browsing with softer colors`}
              aria-pressed={quietMode}
            >
              <span className="mobile-menu-icon" aria-hidden="true">🍃</span>
              <div className="mobile-menu-item-content">
                <span className="mobile-menu-item-title">Quiet Mode</span>
                <span className="mobile-menu-item-description">
                  Peaceful browsing with softer colors
                </span>
              </div>
              {quietMode && <span className="mode-indicator" aria-hidden="true">✓</span>}
            </button>
            <button
              className="mobile-menu-item"
              onClick={toggleGalaxyMode}
              aria-label={`${galaxyMode ? 'Disable' : 'Enable'} galaxy mode - immersive galaxy background`}
              aria-pressed={galaxyMode}
            >
              <span className="mobile-menu-icon" aria-hidden="true">🌌</span>
              <div className="mobile-menu-item-content">
                <span className="mobile-menu-item-title">Galaxy Mode</span>
                <span className="mobile-menu-item-description">
                  Immersive galaxy background
                </span>
              </div>
              {galaxyMode && <span className="mode-indicator" aria-hidden="true">✓</span>}
            </button>
            <div className="mobile-menu-divider" role="separator"></div>
            <button
              onClick={() => { handleLogout(); setShowMobileMenu(false); }}
              className="mobile-menu-item mobile-menu-logout"
              aria-label="Logout from Pryde Social"
            >
              <span className="mobile-menu-icon" aria-hidden="true">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
        )}

        {/* Right: Actions - Show skeleton while user is loading */}
        {!user ? (
          <SkeletonNavbarActions />
        ) : (
          <div className="navbar-actions">
            <MessagesDropdown />
            <NotificationBell />

            <div className="profile-dropdown-container" ref={dropdownRef}>
              <button
                className="user-profile-trigger"
                onClick={() => setShowDropdown(!showDropdown)}
                aria-label={`${showDropdown ? 'Close' : 'Open'} profile menu`}
                aria-expanded={showDropdown}
                aria-haspopup="true"
              >
                <div className="user-avatar">
                  {user?.profilePhoto ? (
                    <img src={getImageUrl(user.profilePhoto)} alt={user?.username || 'User'} />
                  ) : (
                    <span>{user?.username?.charAt(0).toUpperCase() || '?'}</span>
                  )}
                </div>
              <span className="user-name">{user?.displayName || user?.username}</span>
              <span className="dropdown-arrow" aria-hidden="true">{showDropdown ? '▲' : '▼'}</span>
            </button>

            {showDropdown && (
              <div
                className="profile-dropdown"
                role="menu"
                aria-label="Profile menu"
              >
              <Link
                to={`/profile/${user?.username}`}
                className="dropdown-item"
                onClick={() => setShowDropdown(false)}
                role="menuitem"
                aria-label="View my profile"
              >
                <span className="dropdown-icon" aria-hidden="true">👤</span>
                <span>My Profile</span>
              </Link>
              <Link
                to="/bookmarks"
                className="dropdown-item"
                onClick={() => setShowDropdown(false)}
                role="menuitem"
                aria-label="View bookmarks"
              >
                <span className="dropdown-icon" aria-hidden="true">🔖</span>
                <span>Bookmarks</span>
              </Link>
              <Link
                to="/events"
                className="dropdown-item"
                onClick={() => setShowDropdown(false)}
                role="menuitem"
                aria-label="View events"
              >
                <span className="dropdown-icon" aria-hidden="true">📅</span>
                <span>Events</span>
              </Link>
              <Link
                to="/settings"
                className="dropdown-item"
                onClick={() => setShowDropdown(false)}
                role="menuitem"
                aria-label="Open settings"
              >
                <span className="dropdown-icon" aria-hidden="true">⚙️</span>
                <span>Settings</span>
              </Link>
              {user?.role && ['moderator', 'admin', 'super_admin'].includes(user.role) && (
                <Link
                  to="/admin"
                  className="dropdown-item"
                  onClick={() => setShowDropdown(false)}
                  role="menuitem"
                  aria-label="Open admin panel"
                >
                  <span className="dropdown-icon" aria-hidden="true">🛡️</span>
                  <span>Admin Panel</span>
                </Link>
              )}
              <button
                className="dropdown-item dropdown-dark-mode"
                onClick={toggleDarkMode}
                role="menuitemcheckbox"
                aria-checked={isDark}
                aria-label={`${isDark ? 'Disable' : 'Enable'} dark mode`}
              >
                <span className="dark-mode-icon" aria-hidden="true">{isDark ? '☀️' : '🌙'}</span>
                <span>Dark Mode</span>
                {isDark && <span className="mode-indicator" aria-hidden="true">✓</span>}
              </button>
              <button
                className="dropdown-item dropdown-quiet-mode"
                onClick={toggleQuietMode}
                role="menuitemcheckbox"
                aria-checked={quietMode}
                aria-label={`${quietMode ? 'Disable' : 'Enable'} quiet mode - peaceful browsing with softer colors`}
              >
                <span className="quiet-mode-icon" aria-hidden="true">🍃</span>
                <span>Quiet Mode</span>
                {quietMode && <span className="mode-indicator" aria-hidden="true">✓</span>}
              </button>
              <button
                className="dropdown-item dropdown-galaxy-mode"
                onClick={toggleGalaxyMode}
                role="menuitemcheckbox"
                aria-checked={galaxyMode}
                aria-label={`${galaxyMode ? 'Disable' : 'Enable'} galaxy mode - immersive galaxy background`}
              >
                <span className="galaxy-mode-icon" aria-hidden="true">🌌</span>
                <span>Galaxy Mode</span>
                {galaxyMode && <span className="mode-indicator" aria-hidden="true">✓</span>}
              </button>
              <div className="dropdown-divider" role="separator"></div>
              <button
                onClick={handleLogout}
                className="dropdown-item logout-item"
                role="menuitem"
                aria-label="Logout from Pryde Social"
              >
                <span className="dropdown-icon" aria-hidden="true">🚪</span>
                <span>Logout</span>
              </button>
              </div>
            )}
          </div>
          </div>
        )}
    </nav>
  );
}

export default Navbar;

import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import {
  Menu, Search, MessageCircle, Bell,
  Home, Users, BookOpen, BookText, Image, Sparkles,
  Bookmark, Calendar, ShieldCheck, Settings, Leaf,
  Telescope, Palette, User, LogOut,
  ChevronUp, ChevronDown, Check,
} from 'lucide-react';
import { logout } from '../utils/auth';
import { getImageUrl } from '../utils/imageUrl';
import { prefetchRoute, prefetchOnIdle } from '../utils/routePrefetch';
import GlobalSearch from './GlobalSearch';
import NotificationBell from './NotificationBell';
import MessagesDropdown from './MessagesDropdown';
import { SkeletonNavbarActions } from './SkeletonLoader';
import api from '../utils/api';
import { getQuietMode, setQuietMode as setQuietModeManager, getGalaxyMode, toggleGalaxyMode as toggleGalaxyModeManager, toggleSessionQuietOverride } from '../utils/themeManager';
import prydeLogo from '../assets/pryde-logo.png';
import { useAuth } from '../context/AuthContext';
import { useUnreadMessages } from '../hooks/useUnreadMessages'; // ✅ Use singleton hook
import { LUCIDE_DEFAULTS } from '../utils/lucideDefaults';
import './Navbar.css';

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
  const {
    isMobileNavOpen = false,
    onMenuClose,
    mobileNavTriggerRef,
  } = useOutletContext() ?? {};
  const { user, updateUser, clearUser } = useAuth(); // Use centralized auth context
  const [showDropdown, setShowDropdown] = useState(false);
  // Internal mobile menu state - only used if onMenuClick is not provided
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [quietMode, setQuietMode] = useState(() => getQuietMode());
  const [galaxyMode, setGalaxyMode] = useState(() => getGalaxyMode());
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // ✅ Use singleton hook instead of creating own interval
  const { totalUnread } = useUnreadMessages();

  // Determine if we're using external control
  const isExternallyControlled = typeof onMenuClick === 'function';
  const isMobileMenuOpen = isExternallyControlled ? isMobileNavOpen : showMobileMenu;

  const handleHamburgerClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isExternallyControlled) {
      if (isMobileNavOpen && typeof onMenuClose === 'function') {
        onMenuClose();
      } else {
        onMenuClick();
      }
      return;
    }

    setShowMobileMenu(prev => !prev);
  };

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

  const toggleGalaxyMode = async () => {
    const newValue = toggleGalaxyModeManager();
    setGalaxyMode(newValue);

    // Sync with backend so preference persists across refresh/devices
    try {
      await api.patch('/users/me/settings', { galaxyMode: newValue });
    } catch (error) {
      console.error('Failed to sync galaxy mode:', error);
    }
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

  // Glass navbar: activate backdrop blur after scrolling past 10px
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`navbar glossy${scrolled ? ' navbar-glass' : ''}`} role="navigation" aria-label="Main navigation">
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
            fetchpriority="high"
          />
          <span className="brand-text">Pryde Social</span>
        </Link>
      </div>

      {/* Center: Search */}
      <div className="navbar-utility-search">
        <GlobalSearch variant="compact" />
      </div>

        {/* Mobile right group: Messages + Notifications + Hamburger */}
        <div className="navbar-mobile-right">
          {/* Quick-access: Messages with unread badge */}
          <Link
            to="/messages"
            className="navbar-mobile-icon-btn"
            aria-label={totalUnread > 0 ? `Messages, ${totalUnread} unread` : 'Messages'}
            data-tooltip="Messages"
          >
            <MessageCircle {...LUCIDE_DEFAULTS} aria-hidden="true" className="navbar-mobile-icon" />
            {totalUnread > 0 && (
              <span className="navbar-mobile-badge" aria-hidden="true">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </Link>

          {/* Quick-access: Notification bell (reuses existing component with its live badge) */}
          <NotificationBell />

          {/* Search icon — navigates to full search page */}
          <button
            className="navbar-mobile-icon-btn"
            onClick={() => navigate('/search')}
            aria-label="Search"
            data-tooltip="Search"
          >
            <Search {...LUCIDE_DEFAULTS} aria-hidden="true" className="navbar-mobile-icon" />
          </button>

          {/* Hamburger — opens side drawer */}
          <button
            ref={isExternallyControlled ? mobileNavTriggerRef : null}
            className="mobile-hamburger-btn"
            type="button"
            onClick={handleHamburgerClick}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            data-tooltip="Menu"
          >
            <Menu {...LUCIDE_DEFAULTS} aria-hidden="true" />
          </button>
        </div>

        {/* Mobile Menu Overlay - Only render when using internal state (legacy) */}
        {!isExternallyControlled && showMobileMenu && (
          <div
            className="mobile-menu-overlay"
            onClick={() => setShowMobileMenu(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile Menu - Only render when using internal state (legacy) */}
        {/* When externally controlled, MobileNavDrawer handles the menu */}
        {!isExternallyControlled && (
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
              <div className="mobile-menu-avatar avatar-ring avatar-ring--self" aria-hidden="true">
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
              <Home size={18} strokeWidth={1.75} aria-hidden="true" className="mobile-menu-icon" />
              <span>Feed</span>
            </Link>

            {/* =========================================
                Explore Pryde — Mobile Access
               ========================================= */}
            <div className="mobile-menu-section-header">Explore Pryde</div>
            <Link to="/groups" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
              <Users size={18} strokeWidth={1.75} aria-hidden="true" className="mobile-menu-icon" />
              <span>Groups</span>
            </Link>
            <Link to="/journal" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
              <BookOpen size={18} strokeWidth={1.75} aria-hidden="true" className="mobile-menu-icon" />
              <span>Journal</span>
            </Link>
            <Link to="/longform" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
              <BookText size={18} strokeWidth={1.75} aria-hidden="true" className="mobile-menu-icon" />
              <span>Stories</span>
            </Link>
            <Link to="/photo-essay" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
              <Image size={18} strokeWidth={1.75} aria-hidden="true" className="mobile-menu-icon" />
              <span>Photos</span>
            </Link>
            <Link to="/lounge" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
              <Sparkles size={18} strokeWidth={1.75} aria-hidden="true" className="mobile-menu-icon" />
              <span>Lounge</span>
            </Link>
            <Link to="/messages" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
              <MessageCircle size={18} strokeWidth={1.75} aria-hidden="true" className="mobile-menu-icon" />
              <span>Messages</span>
              {totalUnread > 0 && (
                <span className="mobile-menu-badge" aria-label={`${totalUnread} unread messages`}>{totalUnread}</span>
              )}
            </Link>
            <Link to="/notifications" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
              <Bell size={18} strokeWidth={1.75} aria-hidden="true" className="mobile-menu-icon" />
              <span>Notifications</span>
            </Link>
            <Link to="/bookmarks" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
              <Bookmark size={18} strokeWidth={1.75} aria-hidden="true" className="mobile-menu-icon" />
              <span>Bookmarks</span>
            </Link>
            <Link to="/events" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
              <Calendar size={18} strokeWidth={1.75} aria-hidden="true" className="mobile-menu-icon" />
              <span>Events</span>
            </Link>
            {user?.role && ['moderator', 'admin', 'super_admin'].includes(user.role) && (
              <Link to="/admin" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
                <ShieldCheck size={18} strokeWidth={1.75} aria-hidden="true" className="mobile-menu-icon" />
                <span>Admin Panel</span>
              </Link>
            )}
            <div className="mobile-menu-divider" role="separator" aria-hidden="true"></div>
            <Link to="/settings" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
              <Settings size={18} strokeWidth={1.75} aria-hidden="true" className="mobile-menu-icon" />
              <span>Settings</span>
            </Link>
            <button
              className="mobile-menu-item"
              onClick={toggleQuietMode}
              aria-label={`${quietMode ? 'Disable' : 'Enable'} quiet mode - peaceful browsing with softer colors`}
              aria-pressed={quietMode}
            >
              <Leaf size={18} strokeWidth={1.75} aria-hidden="true" className="mobile-menu-icon" />
              <div className="mobile-menu-item-content">
                <span className="mobile-menu-item-title">Quiet Mode</span>
                <span className="mobile-menu-item-description">
                  Peaceful browsing with softer colors
                </span>
              </div>
              {quietMode && <Check size={14} strokeWidth={2} aria-hidden="true" className="mode-indicator" />}
            </button>
            <button
              className="mobile-menu-item"
              onClick={toggleGalaxyMode}
              aria-label={`${galaxyMode ? 'Disable' : 'Enable'} galaxy mode - immersive galaxy background`}
              aria-pressed={galaxyMode}
            >
              <Telescope size={18} strokeWidth={1.75} aria-hidden="true" className="mobile-menu-icon" />
              <div className="mobile-menu-item-content">
                <span className="mobile-menu-item-title">Galaxy Mode</span>
                <span className="mobile-menu-item-description">
                  Immersive galaxy background
                </span>
              </div>
              {galaxyMode && <Check size={14} strokeWidth={2} aria-hidden="true" className="mode-indicator" />}
            </button>
            <Link to="/settings" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
              <Palette size={18} strokeWidth={1.75} aria-hidden="true" className="mobile-menu-icon" />
              <div className="mobile-menu-item-content">
                <span className="mobile-menu-item-title">Appearance</span>
                <span className="mobile-menu-item-description">
                  Light mode & more
                </span>
              </div>
            </Link>
            <div className="mobile-menu-divider" role="separator"></div>
            <button
              onClick={() => { handleLogout(); setShowMobileMenu(false); }}
              className="mobile-menu-item mobile-menu-logout"
              aria-label="Logout from Pryde Social"
            >
              <LogOut size={18} strokeWidth={1.75} aria-hidden="true" className="mobile-menu-icon" />
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
                <div className="user-avatar avatar-ring avatar-ring--self">
                  {user?.profilePhoto ? (
                    <img src={getImageUrl(user.profilePhoto)} alt={user?.username || 'User'} />
                  ) : (
                    <span>{user?.username?.charAt(0).toUpperCase() || '?'}</span>
                  )}
                </div>
              <span className="user-name">{user?.displayName || user?.username}</span>
              {showDropdown
                ? <ChevronUp size={14} strokeWidth={2} aria-hidden="true" className="dropdown-arrow" />
                : <ChevronDown size={14} strokeWidth={2} aria-hidden="true" className="dropdown-arrow" />}
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
                <User size={16} strokeWidth={1.75} aria-hidden="true" className="dropdown-icon" />
                <span>My Profile</span>
              </Link>
              <Link
                to="/bookmarks"
                className="dropdown-item"
                onClick={() => setShowDropdown(false)}
                role="menuitem"
                aria-label="View bookmarks"
              >
                <Bookmark size={16} strokeWidth={1.75} aria-hidden="true" className="dropdown-icon" />
                <span>Bookmarks</span>
              </Link>
              <Link
                to="/events"
                className="dropdown-item"
                onClick={() => setShowDropdown(false)}
                role="menuitem"
                aria-label="View events"
              >
                <Calendar size={16} strokeWidth={1.75} aria-hidden="true" className="dropdown-icon" />
                <span>Events</span>
              </Link>
              <Link
                to="/settings"
                className="dropdown-item"
                onClick={() => setShowDropdown(false)}
                role="menuitem"
                aria-label="Open settings"
              >
                <Settings size={16} strokeWidth={1.75} aria-hidden="true" className="dropdown-icon" />
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
                  <ShieldCheck size={16} strokeWidth={1.75} aria-hidden="true" className="dropdown-icon" />
                  <span>Admin Panel</span>
                </Link>
              )}
              <button
                className="dropdown-item dropdown-quiet-mode"
                onClick={toggleQuietMode}
                role="menuitemcheckbox"
                aria-checked={quietMode}
                aria-label={`${quietMode ? 'Disable' : 'Enable'} quiet mode - peaceful browsing with softer colors`}
              >
                <Leaf size={16} strokeWidth={1.75} aria-hidden="true" className="quiet-mode-icon" />
                <span>Quiet Mode</span>
                {quietMode && <Check size={14} strokeWidth={2} aria-hidden="true" className="mode-indicator" />}
              </button>
              <button
                className="dropdown-item dropdown-galaxy-mode"
                onClick={toggleGalaxyMode}
                role="menuitemcheckbox"
                aria-checked={galaxyMode}
                aria-label={`${galaxyMode ? 'Disable' : 'Enable'} galaxy mode - immersive galaxy background`}
              >
                <Telescope size={16} strokeWidth={1.75} aria-hidden="true" className="galaxy-mode-icon" />
                <span>Galaxy Mode</span>
                {galaxyMode && <Check size={14} strokeWidth={2} aria-hidden="true" className="mode-indicator" />}
              </button>
              <Link
                to="/settings"
                className="dropdown-item"
                onClick={() => setShowDropdown(false)}
                role="menuitem"
                aria-label="Appearance settings"
              >
                <Palette size={16} strokeWidth={1.75} aria-hidden="true" className="dropdown-icon" />
                <span>Appearance</span>
              </Link>
              <div className="dropdown-divider" role="separator"></div>
              <button
                onClick={handleLogout}
                className="dropdown-item logout-item"
                role="menuitem"
                aria-label="Logout from Pryde Social"
              >
                <LogOut size={16} strokeWidth={1.75} aria-hidden="true" className="dropdown-icon" />
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

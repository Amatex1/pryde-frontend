/**
 * MobileNavDrawer - Mobile navigation drawer component
 * 
 * CONTROLLED BY: AppLayout (centralized state)
 * 
 * RESPONSIBILITIES:
 * - Renders the mobile navigation drawer/menu
 * - Handles overlay click to close
 * - Provides navigation links and user actions
 * 
 * RULES:
 * - NO internal open/close state (controlled by parent)
 * - NO viewport detection (visibility via CSS)
 * - Receives open/onClose props from AppLayout
 */

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  X, Home, Users, BookOpen, BookText, Image, Sparkles,
  MessageCircle, Bell, Bookmark, Calendar, Search,
  ShieldCheck, Settings, Leaf, Telescope, Palette, LogOut, Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import { getImageUrl } from '../utils/imageUrl';
import { logout } from '../utils/auth';
import api from '../utils/api';
import { getQuietMode, setQuietMode as setQuietModeManager, getGalaxyMode, toggleGalaxyMode as toggleGalaxyModeManager } from '../utils/themeManager';
import './MobileNavDrawer.css';

export default function MobileNavDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const { user, clearUser } = useAuth();
  const { totalUnread } = useUnreadMessages();
  const drawerRef = useRef(null);
  
  // Theme state
  const [quietMode, setQuietMode] = useState(() => getQuietMode());
  const [galaxyMode, setGalaxyMode] = useState(() => getGalaxyMode());

  const toggleQuietMode = async () => {
    const newQuietMode = !quietMode;
    setQuietMode(newQuietMode);
    setQuietModeManager(newQuietMode);
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

  const handleLogout = () => {
    clearUser();
    logout();
    onClose();
  };

  const handleLinkClick = () => {
    onClose();
  };

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Trap focus when open
  useEffect(() => {
    if (open && drawerRef.current) {
      drawerRef.current.focus();
    }
  }, [open]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`mobile-nav-overlay ${open ? 'mobile-nav-overlay-visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`mobile-nav-drawer ${open ? 'mobile-nav-drawer-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!open}
        tabIndex={-1}
      >
        {/* User Header */}
        <div className="mobile-nav-header">
          <div className="mobile-nav-user">
            <div className="mobile-nav-avatar" aria-hidden="true">
              {user?.profilePhoto ? (
                <img src={getImageUrl(user.profilePhoto)} alt="" />
              ) : (
                <span>{user?.username?.charAt(0).toUpperCase() || '?'}</span>
              )}
            </div>
            <div className="mobile-nav-user-info">
              <div className="mobile-nav-username">{user?.displayName || user?.username}</div>
              <Link 
                to={`/profile/${user?.username}`} 
                className="mobile-nav-view-profile" 
                onClick={handleLinkClick}
              >
                View Profile
              </Link>
            </div>
          </div>
          <button 
            className="mobile-nav-close-btn"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="mobile-nav-items" role="navigation">
          <Link to="/feed" className="mobile-nav-item" onClick={handleLinkClick}>
            <Home size={18} strokeWidth={1.75} className="mobile-nav-icon" aria-hidden="true" />
            <span>Feed</span>
          </Link>

          <div className="mobile-nav-section-header">Explore Pryde</div>
          
          <Link to="/groups" className="mobile-nav-item" onClick={handleLinkClick}>
            <Users size={18} strokeWidth={1.75} className="mobile-nav-icon" aria-hidden="true" />
            <span>Groups</span>
          </Link>
          <Link to="/journal" className="mobile-nav-item" onClick={handleLinkClick}>
            <BookOpen size={18} strokeWidth={1.75} className="mobile-nav-icon" aria-hidden="true" />
            <span>Journal</span>
          </Link>
          <Link to="/longform" className="mobile-nav-item" onClick={handleLinkClick}>
            <BookText size={18} strokeWidth={1.75} className="mobile-nav-icon" aria-hidden="true" />
            <span>Stories</span>
          </Link>
          <Link to="/photo-essay" className="mobile-nav-item" onClick={handleLinkClick}>
            <Image size={18} strokeWidth={1.75} className="mobile-nav-icon" aria-hidden="true" />
            <span>Photos</span>
          </Link>
          <Link to="/lounge" className="mobile-nav-item" onClick={handleLinkClick}>
            <Sparkles size={18} strokeWidth={1.75} className="mobile-nav-icon" aria-hidden="true" />
            <span>Lounge</span>
          </Link>
          <Link to="/messages" className="mobile-nav-item" onClick={handleLinkClick}>
            <MessageCircle size={18} strokeWidth={1.75} className="mobile-nav-icon" aria-hidden="true" />
            <span>Messages</span>
            {totalUnread > 0 && (
              <span className="mobile-nav-badge" aria-label={`${totalUnread} unread messages`}>
                {totalUnread}
              </span>
            )}
          </Link>
          <Link to="/notifications" className="mobile-nav-item" onClick={handleLinkClick}>
            <Bell size={18} strokeWidth={1.75} className="mobile-nav-icon" aria-hidden="true" />
            <span>Notifications</span>
          </Link>
          <Link to="/bookmarks" className="mobile-nav-item" onClick={handleLinkClick}>
            <Bookmark size={18} strokeWidth={1.75} className="mobile-nav-icon" aria-hidden="true" />
            <span>Bookmarks</span>
          </Link>
          <Link to="/events" className="mobile-nav-item" onClick={handleLinkClick}>
            <Calendar size={18} strokeWidth={1.75} className="mobile-nav-icon" aria-hidden="true" />
            <span>Events</span>
          </Link>
          <Link to="/search" className="mobile-nav-item" onClick={handleLinkClick}>
            <Search size={18} strokeWidth={1.75} className="mobile-nav-icon" aria-hidden="true" />
            <span>Find Followers</span>
          </Link>

          {user?.role && ['moderator', 'admin', 'super_admin'].includes(user.role) && (
            <Link to="/admin" className="mobile-nav-item" onClick={handleLinkClick}>
              <ShieldCheck size={18} strokeWidth={1.75} className="mobile-nav-icon" aria-hidden="true" />
              <span>Admin Panel</span>
            </Link>
          )}

          <div className="mobile-nav-divider" role="separator" aria-hidden="true" />

          <Link to="/settings" className="mobile-nav-item" onClick={handleLinkClick}>
            <Settings size={18} strokeWidth={1.75} className="mobile-nav-icon" aria-hidden="true" />
            <span>Settings</span>
          </Link>

          <button
            className="mobile-nav-item"
            onClick={toggleQuietMode}
            aria-label={`${quietMode ? 'Disable' : 'Enable'} quiet mode`}
            aria-pressed={quietMode}
          >
            <Leaf size={18} strokeWidth={1.75} className="mobile-nav-icon" aria-hidden="true" />
            <div className="mobile-nav-item-content">
              <span className="mobile-nav-item-title">Quiet Mode</span>
              <span className="mobile-nav-item-description">
                Peaceful browsing with softer colors
              </span>
            </div>
            {quietMode && <Check size={14} strokeWidth={2} className="mode-indicator" aria-hidden="true" />}
          </button>

          <button
            className="mobile-nav-item"
            onClick={toggleGalaxyMode}
            aria-label={`${galaxyMode ? 'Disable' : 'Enable'} galaxy mode - immersive galaxy background`}
            aria-pressed={galaxyMode}
          >
            <Telescope size={18} strokeWidth={1.75} className="mobile-nav-icon" aria-hidden="true" />
            <div className="mobile-nav-item-content">
              <span className="mobile-nav-item-title">Galaxy Mode</span>
              <span className="mobile-nav-item-description">
                Immersive galaxy background
              </span>
            </div>
            {galaxyMode && <Check size={14} strokeWidth={2} className="mode-indicator" aria-hidden="true" />}
          </button>

          <Link to="/settings" className="mobile-nav-item" onClick={handleLinkClick}>
            <Palette size={18} strokeWidth={1.75} className="mobile-nav-icon" aria-hidden="true" />
            <div className="mobile-nav-item-content">
              <span className="mobile-nav-item-title">Appearance</span>
              <span className="mobile-nav-item-description">
                Light mode & more
              </span>
            </div>
          </Link>

          <div className="mobile-nav-divider" role="separator" aria-hidden="true" />

          <button
            onClick={handleLogout}
            className="mobile-nav-item mobile-nav-logout"
            aria-label="Logout from Pryde Social"
          >
            <LogOut size={18} strokeWidth={1.75} className="mobile-nav-icon" aria-hidden="true" />
            <span>Logout</span>
          </button>
        </nav>
      </div>
    </>
  );
}


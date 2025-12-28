/**
 * FeedController - Data and state management for Feed feature
 *
 * ARCHITECTURE RULE:
 * This file must not contain viewport or device detection logic.
 * Layout decisions belong exclusively in /layouts.
 * Enforced by ESLint: no-restricted-properties, no-restricted-globals
 *
 * RESPONSIBILITIES:
 * - Fetch posts, friends, and related data
 * - Manage all Feed state (posts, comments, UI state)
 * - Handle all user interactions (like, comment, share, etc.)
 * - Compose layout using PageLayout primitive
 *
 * RULES:
 * - NO viewport detection (window.innerWidth, matchMedia)
 * - NO layout CSS (widths, grids, media queries)
 * - Uses PageLayout for responsive layout
 * - Passes data down to FeedStream and FeedSidebar
 * - All business logic lives here
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate, useOutletContext } from 'react-router-dom';
import PageLayout from '../../layouts/PageLayout';
import FeedStream from './FeedStream';
import FeedSidebar from './FeedSidebar';
import Navbar from '../../components/Navbar';
import PasskeyBanner from '../../components/PasskeyBanner';
import ReportModal from '../../components/ReportModal';
import PhotoViewer from '../../components/PhotoViewer';
import CustomModal from '../../components/CustomModal';
import ReactionDetailsModal from '../../components/ReactionDetailsModal';
import Toast from '../../components/Toast';
import PageTitle from '../../components/PageTitle';
import { useModal } from '../../hooks/useModal';
import { useOnlineUsers } from '../../hooks/useOnlineUsers';
import { useUnreadMessages } from '../../hooks/useUnreadMessages';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { getSocket, setupSocketListeners } from '../../utils/socketHelpers';
import logger from '../../utils/logger';
import './FeedController.css';

export default function FeedController() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // Get menu handler from AppLayout outlet context
  const { onMenuOpen } = useOutletContext() || {};
  const { modalState, closeModal, showAlert, showConfirm } = useModal();
  const { onlineUsers, isUserOnline } = useOnlineUsers();
  const { authReady, isAuthenticated, user: currentUser } = useAuth();
  const { toasts, showToast, removeToast } = useToast();
  const { unreadCounts } = useUnreadMessages();

  // Core data state
  const [posts, setPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [quietMode, setQuietMode] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [revealedPosts, setRevealedPosts] = useState({});
  
  // Refs
  const postRefs = useRef({});
  const commentRefs = useRef({});

  // Fetch posts on mount
  useEffect(() => {
    if (!authReady || !isAuthenticated) return;
    
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await api.get('/posts');
        setPosts(response.data.posts || response.data || []);
      } catch (error) {
        logger.error('Failed to fetch posts:', error);
        showToast('Failed to load posts', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [authReady, isAuthenticated]);

  // Fetch friends
  useEffect(() => {
    if (!authReady || !isAuthenticated) return;
    
    const fetchFriends = async () => {
      try {
        const response = await api.get('/friends');
        setFriends(response.data || []);
      } catch (error) {
        logger.error('Failed to fetch friends:', error);
      }
    };

    fetchFriends();
  }, [authReady, isAuthenticated]);

  // Handlers
  const handleRevealPost = useCallback((postId) => {
    setRevealedPosts(prev => ({ ...prev, [postId]: true }));
  }, []);

  const getTimeSince = useCallback((date) => {
    if (!date) return 'Offline';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }, []);

  // Render
  return (
    <>
      <PageTitle title="Feed" />
      <Navbar onMenuClick={onMenuOpen} />
      <PasskeyBanner />
      
      <PageLayout
        variant="two-column"
        stickySecondary
        primary={
          <FeedStream
            posts={posts}
            blockedUsers={blockedUsers}
            currentUser={currentUser}
            bookmarkedPosts={bookmarkedPosts}
            loading={loading}
            quietMode={quietMode}
            revealedPosts={revealedPosts}
            onRevealPost={handleRevealPost}
            postRefs={postRefs}
            commentRefs={commentRefs}
          />
        }
        secondary={
          <FeedSidebar
            friends={friends}
            onlineUsers={onlineUsers}
            unreadMessageCounts={unreadCounts}
            friendSearchQuery={friendSearchQuery}
            onFriendSearchChange={setFriendSearchQuery}
            getTimeSince={getTimeSince}
          />
        }
      />

      {/* Toasts */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      {/* Modal */}
      <CustomModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onConfirm={modalState.onConfirm}
      />
    </>
  );
}


/**
 * ProfileController - Data and state management for Profile feature
 *
 * ARCHITECTURE RULE:
 * This file must not contain viewport or device detection logic.
 * Layout decisions belong exclusively in /layouts.
 * Enforced by ESLint: no-restricted-properties, no-restricted-globals
 *
 * RESPONSIBILITIES:
 * - Fetch user profile, posts, and related data
 * - Manage all Profile state (user, posts, follow status, etc.)
 * - Handle all user interactions (follow, message, block, etc.)
 * - Compose layout using PageLayout primitive
 *
 * RULES:
 * - NO viewport detection (window.innerWidth, matchMedia)
 * - NO layout CSS (widths, grids, media queries)
 * - Uses PageLayout for responsive layout
 * - Passes data down to ProfileHeader, ProfileContent, ProfileSidebar
 * - All business logic lives here
 */

import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import PageLayout from '../../layouts/PageLayout';
import ProfileHeader from './ProfileHeader';
import ProfileContent from './ProfileContent';
import ProfileSidebar from './ProfileSidebar';
import Navbar from '../../components/Navbar';
import ProfileSkeleton from '../../components/ProfileSkeleton';
import ReportModal from '../../components/ReportModal';
import CustomModal from '../../components/CustomModal';
import Toast from '../../components/Toast';

// CODE SPLITTING: Lazy load modals to reduce initial bundle size
const PhotoViewer = lazy(() => import('../../components/PhotoViewer'));
const EditProfileModal = lazy(() => import('../../components/EditProfileModal'));
import { useModal } from '../../hooks/useModal';
import { useToast } from '../../hooks/useToast';
import api from '../../utils/api';
import { getCurrentUser } from '../../utils/auth';
import { setupSocketListeners } from '../../utils/socketHelpers';
import logger from '../../utils/logger';
import './ProfileController.css';

export default function ProfileController() {
  const { id } = useParams();
  const navigate = useNavigate();
  // Get menu handler from AppLayout outlet context
  const { onMenuOpen } = useOutletContext() || {};
  const currentUser = getCurrentUser();
  const { modalState, closeModal, showAlert, showConfirm } = useModal();
  const { toasts, showToast, removeToast } = useToast();

  // Core data state
  const [user, setUser] = useState(null);
  const [userBadges, setUserBadges] = useState([]); // Full badge objects
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [profileError, setProfileError] = useState(null);

  // Follow/friend state
  const [followStatus, setFollowStatus] = useState(null);
  const [followRequestId, setFollowRequestId] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isPrivateAccount, setIsPrivateAccount] = useState(false);
  const [canSendMessage, setCanSendMessage] = useState(false);
  const [permissionsChecked, setPermissionsChecked] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState('posts');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [photoViewerImage, setPhotoViewerImage] = useState(null);
  const [reportModal, setReportModal] = useState({ isOpen: false, type: '', contentId: null, userId: null });

  // Refs
  const actionsMenuRef = useRef(null);
  const postRefs = useRef({});
  const isMountedRef = useRef(true);

  // Derived state
  const isOwnProfile = currentUser?.username === id;

  // ========== API CALLS ==========
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await api.get(`/users/${id}`);
      if (isMountedRef.current) {
        setUser(response.data);
        setProfileError(null);

        // Fetch user's badges (with visibility settings applied)
        if (response.data._id) {
          try {
            const badgesResponse = await api.get(`/badges/user/${response.data._id}`);
            if (isMountedRef.current) {
              setUserBadges(badgesResponse.data || []);
            }
          } catch (badgeError) {
            logger.error('Failed to fetch user badges:', badgeError);
            // Non-critical error, continue without badges
            if (isMountedRef.current) {
              setUserBadges([]);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Failed to fetch user profile:', error);
      if (isMountedRef.current) {
        if (error.response?.status === 404) {
          setProfileError('User not found.');
        } else if (error.response?.status === 403) {
          setProfileError(error.response?.data?.message || 'This profile is not accessible');
        } else {
          setProfileError('Failed to load profile.');
        }
        setUser(null);
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [id]);

  const fetchUserPosts = useCallback(async () => {
    try {
      setLoadingPosts(true);
      const response = await api.get(`/posts/user/${id}`);
      if (isMountedRef.current) {
        setPosts(response.data || []);
      }
    } catch (error) {
      logger.error('Failed to fetch user posts:', error);
      if (isMountedRef.current) setPosts([]);
    } finally {
      if (isMountedRef.current) setLoadingPosts(false);
    }
  }, [id]);

  const checkFollowStatus = useCallback(async () => {
    try {
      const userResponse = await api.get(`/users/${id}`);
      const profileUserId = userResponse.data._id;
      setIsPrivateAccount(userResponse.data.privacySettings?.isPrivateAccount || false);

      const myUserId = currentUser?.id || currentUser?._id;
      if (!myUserId) {
        setFollowStatus('none');
        return;
      }

      const followingResponse = await api.get(`/follow/following/${myUserId}`);
      const followingList = followingResponse.data.following || followingResponse.data;
      const isFollowing = followingList.some(u => u._id === profileUserId);

      if (isFollowing) {
        setFollowStatus('following');
        return;
      }

      if (userResponse.data.privacySettings?.isPrivateAccount) {
        const requestsResponse = await api.get('/follow/requests/sent');
        const sentRequests = requestsResponse.data.sentRequests || requestsResponse.data;
        const pendingRequest = sentRequests.find(req => req.receiver._id === profileUserId);
        if (pendingRequest) {
          setFollowStatus('pending');
          setFollowRequestId(pendingRequest._id);
          return;
        }
      }

      setFollowStatus('none');
    } catch (error) {
      logger.error('Failed to check follow status:', error);
      setFollowStatus('none');
    }
  }, [id, currentUser]);

  const checkBlockStatus = useCallback(async () => {
    try {
      const response = await api.get(`/blocks/check/${id}`);
      setIsBlocked(response.data.isBlocked);
    } catch (error) {
      logger.error('Failed to check block status:', error);
    }
  }, [id]);

  // Update privacy permissions based on user data
  const updatePrivacyPermissions = useCallback((targetUser) => {
    if (!targetUser) return;
    const messageSetting = targetUser.privacySettings?.whoCanMessage || 'followers';
    if (messageSetting === 'no-one') {
      setCanSendMessage(false);
    } else if (messageSetting === 'friends' || messageSetting === 'followers') {
      setCanSendMessage(followStatus === 'following');
    } else if (messageSetting === 'everyone') {
      setCanSendMessage(true);
    }
    setPermissionsChecked(true);
  }, [followStatus]);

  // ========== EFFECTS ==========
  useEffect(() => {
    isMountedRef.current = true;
    setPermissionsChecked(false);

    const fetchPromises = [fetchUserProfile(), fetchUserPosts()];
    if (!isOwnProfile) {
      fetchPromises.push(checkFollowStatus(), checkBlockStatus());
    }

    Promise.all(fetchPromises).catch(error => {
      if (isMountedRef.current) {
        logger.error('Error loading profile data:', error);
      }
    });

    return () => { isMountedRef.current = false; };
  }, [id, isOwnProfile, fetchUserProfile, fetchUserPosts, checkFollowStatus, checkBlockStatus]);

  // Update permissions when user or follow status changes
  useEffect(() => {
    if (user && !isOwnProfile) {
      updatePrivacyPermissions(user);
    }
  }, [user, followStatus, isOwnProfile, updatePrivacyPermissions]);

  // ========== HANDLERS ==========
  const handleFollow = async () => {
    try {
      if (!user?._id) return;
      await api.post(`/follow/request/${user._id}`);
      setFollowStatus(isPrivateAccount ? 'pending' : 'following');
      showToast(isPrivateAccount ? 'Follow request sent!' : 'Now following!', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to follow', 'error');
    }
  };

  const handleUnfollow = async () => {
    try {
      if (!user?._id) return;
      await api.delete(`/follow/unfollow/${user._id}`);
      setFollowStatus('none');
      showToast('Unfollowed', 'success');
    } catch (error) {
      showToast('Failed to unfollow', 'error');
    }
  };

  const handleCancelFollowRequest = async () => {
    try {
      await api.delete(`/follow/request/${followRequestId}`);
      setFollowStatus('none');
      showToast('Follow request cancelled', 'success');
    } catch (error) {
      showToast('Failed to cancel request', 'error');
    }
  };

  const handleMessage = () => {
    if (isOwnProfile) {
      navigate('/messages?chat=self');
    } else {
      navigate(`/messages?chat=${user?._id}`);
    }
  };

  const handleBlockUser = async () => {
    const confirmed = await showConfirm('Are you sure you want to block this user?', 'Block User');
    if (!confirmed) return;
    try {
      await api.post(`/blocks/${user._id}`);
      setIsBlocked(true);
      showToast('User blocked', 'success');
    } catch (error) {
      showToast('Failed to block user', 'error');
    }
  };

  const handleUnblockUser = async () => {
    try {
      await api.delete(`/blocks/${user._id}`);
      setIsBlocked(false);
      showToast('User unblocked', 'success');
    } catch (error) {
      showToast('Failed to unblock user', 'error');
    }
  };

  const handleProfileUpdate = async (updatedUser) => {
    setUser(updatedUser);

    // Refresh badges after profile update
    if (updatedUser._id) {
      try {
        const badgesResponse = await api.get(`/badges/user/${updatedUser._id}`);
        if (isMountedRef.current) {
          setUserBadges(badgesResponse.data || []);
        }
      } catch (badgeError) {
        logger.error('Failed to refresh user badges:', badgeError);
      }
    }

    showToast('Profile updated successfully!', 'success');
  };

  // ========== RENDER ==========
  if (loading) {
    return (
      <>
        <Navbar onMenuClick={onMenuOpen} />
        <ProfileSkeleton />
      </>
    );
  }

  if (profileError) {
    return (
      <>
        <Navbar onMenuClick={onMenuOpen} />
        <div className="profile-error glossy">
          <h2>Profile Unavailable</h2>
          <p>{profileError}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar onMenuClick={onMenuOpen} />

      {/* Profile Header - Full width above layout */}
      <ProfileHeader
        user={user}
        userBadges={userBadges}
        isOwnProfile={isOwnProfile}
        postsCount={posts.length}
        followStatus={followStatus}
        permissionsChecked={permissionsChecked}
        canSendMessage={canSendMessage}
        isBlocked={isBlocked}
        showActionsMenu={showActionsMenu}
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
        onCancelFollowRequest={handleCancelFollowRequest}
        onMessage={handleMessage}
        onEditProfile={() => setEditProfileModal(true)}
        onBlockUser={handleBlockUser}
        onUnblockUser={handleUnblockUser}
        onReportUser={() => setReportModal({ isOpen: true, type: 'user', contentId: null, userId: user?._id })}
        onToggleActionsMenu={() => setShowActionsMenu(!showActionsMenu)}
        onPhotoClick={setPhotoViewerImage}
        actionsMenuRef={actionsMenuRef}
      />

      <PageLayout
        variant="two-column"
        gap="lg"
        stickySecondary
        primary={
          <ProfileContent
            user={user}
            posts={posts}
            currentUser={currentUser}
            isOwnProfile={isOwnProfile}
            activeTab={activeTab}
            loadingPosts={loadingPosts}
            onTabChange={setActiveTab}
            postRefs={postRefs}
          />
        }
        secondary={
          <ProfileSidebar
            user={user}
            isOwnProfile={isOwnProfile}
          />
        }
      />

      {/* Modals - CODE SPLITTING: Wrapped in Suspense for lazy loading */}
      {editProfileModal && (
        <Suspense fallback={<div className="modal-loading">Loading...</div>}>
          <EditProfileModal
            user={user}
            onClose={() => setEditProfileModal(false)}
            onUpdate={handleProfileUpdate}
          />
        </Suspense>
      )}

      {photoViewerImage && (
        <Suspense fallback={<div className="modal-loading">Loading...</div>}>
          <PhotoViewer
            image={photoViewerImage}
            onClose={() => setPhotoViewerImage(null)}
          />
        </Suspense>
      )}

      {reportModal.isOpen && (
        <ReportModal
          isOpen={reportModal.isOpen}
          onClose={() => setReportModal({ isOpen: false, type: '', contentId: null, userId: null })}
          type={reportModal.type}
          contentId={reportModal.contentId}
          userId={reportModal.userId}
        />
      )}

      {toasts.map(toast => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
      ))}

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


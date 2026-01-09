/**
 * ProfileContent - Main content area with posts and tabs
 * 
 * RESPONSIBILITIES:
 * - Render profile tabs (posts, journals, stories, photos)
 * - Render posts list
 * - Handle post interactions (delegated to parent)
 * 
 * RULES:
 * - NO layout logic (widths, grids, media queries)
 * - NO data fetching
 * - Layout-agnostic: renders the same on all platforms
 */

import { Link } from 'react-router-dom';
import PostSkeleton from '../../components/PostSkeleton';
import OptimizedImage from '../../components/OptimizedImage';
import FormattedText from '../../components/FormattedText';
import ReactionButton from '../../components/ReactionButton';
import Poll from '../../components/Poll';
import PinnedPostBadge from '../../components/PinnedPostBadge';
import CommentThread from '../../components/CommentThread';
import PostHeader from '../../components/PostHeader';
import { getImageUrl } from '../../utils/imageUrl';
import './ProfileContent.css';

export default function ProfileContent({
  // Data
  user,
  posts = [],
  journals = [],
  longformPosts = [],
  photoEssays = [],
  currentUser,
  isOwnProfile = false,
  
  // UI State
  activeTab = 'posts',
  loadingPosts = false,
  searchResults = null,
  showCommentBox = {},
  commentText = {},
  postComments = {},
  commentReplies = {},
  openDropdownId,
  editingPostId,
  editPostText,
  bookmarkedPosts = [],
  
  // Handlers
  onTabChange,
  onLike,
  onComment,
  onBookmark,
  onShare,
  onDelete,
  onEdit,
  onToggleCommentBox,
  onCommentTextChange,
  onCommentSubmit,
  onToggleDropdown,
  onImageClick,
  getUserReactionEmoji,
  setReactionDetailsModal,
  
  // Refs
  postRefs,
  commentRefs,
}) {
  // Get the posts to display (search results or all posts)
  const displayPosts = searchResults ? searchResults.posts : posts;
  
  // Sort posts with pinned first (only if not searching)
  const sortedPosts = [...displayPosts].sort((a, b) => {
    if (!searchResults) {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div className="profile-content-area">
      {/* Profile Tabs */}
      <div className="profile-tabs">
        <button
          className={`tab-button ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => onTabChange?.('posts')}
        >
          Posts
        </button>
        <button
          className={`tab-button ${activeTab === 'journals' ? 'active' : ''}`}
          onClick={() => onTabChange?.('journals')}
        >
          Journals
        </button>
        <button
          className={`tab-button ${activeTab === 'longform' ? 'active' : ''}`}
          onClick={() => onTabChange?.('longform')}
        >
          Stories
        </button>
        <button
          className={`tab-button ${activeTab === 'photos' ? 'active' : ''}`}
          onClick={() => onTabChange?.('photos')}
        >
          Photos
        </button>
      </div>

      {/* Tab Content */}
      <div className="profile-posts">
        {activeTab !== 'posts' && (
          <h2 className="section-title" style={{ marginBottom: '20px' }}>
            {activeTab === 'journals' ? 'Journals' : activeTab === 'longform' ? 'Stories' : 'Photo Essays'}
          </h2>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <>
            {loadingPosts ? (
              <>
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
              </>
            ) : sortedPosts.length === 0 ? (
              <div className="empty-state glossy">
                <p>{searchResults ? 'No posts found' : 'No posts yet'}</p>
              </div>
            ) : (
              <div className="posts-list">
                {sortedPosts.map((post) => (
                  <ProfilePostCard
                    key={post._id}
                    post={post}
                    currentUser={currentUser}
                    isOwnProfile={isOwnProfile}
                    isBookmarked={bookmarkedPosts.includes(post._id)}
                    showCommentBox={showCommentBox[post._id]}
                    commentText={commentText[post._id] || ''}
                    comments={postComments[post._id] || []}
                    openDropdownId={openDropdownId}
                    editingPostId={editingPostId}
                    editPostText={editPostText}
                    onLike={onLike}
                    onComment={onComment}
                    onBookmark={onBookmark}
                    onShare={onShare}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onToggleCommentBox={onToggleCommentBox}
                    onCommentTextChange={onCommentTextChange}
                    onCommentSubmit={onCommentSubmit}
                    onToggleDropdown={onToggleDropdown}
                    onImageClick={onImageClick}
                    getUserReactionEmoji={getUserReactionEmoji}
                    postRefs={postRefs}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Simplified post card component (to be expanded)
function ProfilePostCard({ post, currentUser, isOwnProfile, onImageClick, postRefs }) {
  const isLiked = post.hasLiked || false;
  
  return (
    <div
      className="post-card glossy fade-in"
      style={{ borderTop: post.isPinned ? '3px solid var(--pryde-purple)' : 'none' }}
      ref={(el) => postRefs && (postRefs.current[post._id] = el)}
    >
      {post.isPinned && <PinnedPostBadge />}

      <PostHeader
        author={post.author}
        createdAt={post.createdAt}
        visibility={post.visibility}
        edited={post.edited}
        isPinned={post.isPinned}
      />

      {post.content && (
        <div className="post-content">
          <FormattedText text={post.content} />
        </div>
      )}
    </div>
  );
}


/**
 * GroupFeed - Posts within a group
 * 
 * RESPONSIBILITIES:
 * - Display group posts
 * - Post composer for members
 * - Post actions (edit, delete, lock/unlock)
 * - Non-member view with join prompt
 * 
 * RULES:
 * - NO layout logic (widths, grids, media queries)
 * - NO data fetching
 * - Layout-agnostic: renders the same on all platforms
 */

import React, { useRef } from 'react';
import OptimizedImage from '../../components/OptimizedImage';
import PostHeader from '../../components/PostHeader';
import { getImageUrl } from '../../utils/imageUrl';
import './GroupFeed.css';

export default function GroupFeed({
  // Data
  posts = [],
  group,
  currentUser,
  
  // Permissions
  isMember = false,
  isOwner = false,
  isModerator = false,
  isMuted = false,
  
  // Composer state
  newPost = '',
  postMedia = [],
  uploadingMedia = false,
  posting = false,
  
  // Edit state
  editingPost = null,
  editContent = '',
  editMedia = [],
  saving = false,
  
  // Handlers
  onNewPostChange,
  onSubmitPost,
  onMediaSelect,
  onRemoveMedia,
  onEditPost,
  onSaveEdit,
  onCancelEdit,
  onEditContentChange,
  onEditMediaSelect,
  onRemoveEditMedia,
  onDeletePost,
  onLockPost,
  onUnlockPost,
}) {
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  // Non-member view
  if (!isMember) {
    return (
      <div className="group-feed-content">
        <div className="non-member-prompt glossy">
          <p>Join this group to see posts and participate in discussions.</p>
        </div>
      </div>
    );
  }

  const canModerate = isOwner || isModerator;

  return (
    <div className="group-feed-content">
      {/* Post Composer */}
      {!isMuted && (
        <div className="group-composer glossy">
          <textarea
            value={newPost}
            onChange={(e) => onNewPostChange?.(e.target.value)}
            placeholder="Share something with the group..."
            rows={3}
            disabled={posting}
          />
          
          {/* Media preview */}
          {postMedia.length > 0 && (
            <div className="media-preview">
              {postMedia.map((media, index) => (
                <div key={index} className="media-preview-item">
                  <img src={media.preview || getImageUrl(media.url)} alt="" />
                  <button 
                    className="btn-remove-media"
                    onClick={() => onRemoveMedia?.(index)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="composer-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => onMediaSelect?.(e.target.files)}
              style={{ display: 'none' }}
            />
            <button
              className="btn-attach"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingMedia || posting}
            >
              📎 {uploadingMedia ? 'Uploading...' : 'Media'}
            </button>
            <button
              className="btn-post"
              onClick={onSubmitPost}
              disabled={posting || (!newPost.trim() && postMedia.length === 0)}
            >
              {posting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      )}

      {/* Muted notice */}
      {isMuted && (
        <div className="muted-notice glossy">
          <p>You are muted in this group and cannot post.</p>
        </div>
      )}

      {/* Posts list */}
      <div className="posts-list">
        {posts.length === 0 ? (
          <div className="empty-feed glossy">
            <p>No posts yet. Be the first to share something!</p>
          </div>
        ) : (
          posts.map(post => (
            <GroupPost
              key={post._id}
              post={post}
              currentUser={currentUser}
              canModerate={canModerate}
              isEditing={editingPost === post._id}
              editContent={editContent}
              editMedia={editMedia}
              saving={saving}
              editFileInputRef={editFileInputRef}
              onEdit={() => onEditPost?.(post)}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onEditContentChange={onEditContentChange}
              onEditMediaSelect={onEditMediaSelect}
              onRemoveEditMedia={onRemoveEditMedia}
              onDelete={() => onDeletePost?.(post._id)}
              onLock={() => onLockPost?.(post._id)}
              onUnlock={() => onUnlockPost?.(post._id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * GroupPost - Single post in the group feed
 */
function GroupPost({
  post,
  currentUser,
  canModerate,
  isEditing,
  editContent,
  editMedia,
  saving,
  editFileInputRef,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onEditContentChange,
  onEditMediaSelect,
  onRemoveEditMedia,
  onDelete,
  onLock,
  onUnlock,
}) {
  const isAuthor = post.author._id === currentUser?._id;
  const canEdit = isAuthor;
  const canDelete = isAuthor || canModerate;
  const canLock = canModerate;

  return (
    <article className={`group-post glossy ${post.isLocked ? 'locked' : ''}`}>
      {/* Post header */}
      <PostHeader
        author={post.author}
        createdAt={post.createdAt}
        visibility="group"
        edited={post.edited}
      >
        {post.isLocked && (
          <span className="locked-badge" title="Replies disabled">🔒</span>
        )}
      </PostHeader>

      {/* Post content */}
      {isEditing ? (
        <div className="post-edit-form">
          <textarea
            value={editContent}
            onChange={(e) => onEditContentChange?.(e.target.value)}
            rows={3}
          />
          {editMedia.length > 0 && (
            <div className="media-preview">
              {editMedia.map((media, index) => (
                <div key={index} className="media-preview-item">
                  <img src={media.preview || getImageUrl(media.url)} alt="" />
                  <button onClick={() => onRemoveEditMedia?.(index)}>✕</button>
                </div>
              ))}
            </div>
          )}
          <div className="edit-actions">
            <input
              ref={editFileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => onEditMediaSelect?.(e.target.files)}
              style={{ display: 'none' }}
            />
            <button onClick={() => editFileInputRef?.current?.click()}>📎</button>
            <button onClick={onSaveEdit} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={onCancelEdit}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div className="post-content">
            <p>{post.content}</p>
          </div>

          {post.media && post.media.length > 0 && (
            <div className="post-media">
              {post.media.map((media, index) => (
                <OptimizedImage
                  key={index}
                  src={getImageUrl(media.url)}
                  alt=""
                  className="post-image"
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Post actions */}
      {!isEditing && (
        <div className="post-actions">
          {canEdit && (
            <button onClick={onEdit} title="Edit post">✏️ Edit</button>
          )}
          {canDelete && (
            <button onClick={onDelete} title="Delete post">🗑️ Delete</button>
          )}
          {canLock && (
            post.isLocked ? (
              <button onClick={onUnlock} title="Unlock replies">🔓 Unlock</button>
            ) : (
              <button onClick={onLock} title="Lock replies">🔒 Lock</button>
            )
          )}
        </div>
      )}
    </article>
  );
}


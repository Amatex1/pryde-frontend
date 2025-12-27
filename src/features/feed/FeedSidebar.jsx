/**
 * FeedSidebar - Sidebar content for Feed page
 * 
 * RESPONSIBILITIES:
 * - Render sidebar UI (explore links, support, friends list)
 * - Receive data via props
 * 
 * RULES:
 * - NO layout logic (widths, grids, media queries)
 * - NO data fetching (receives data via props)
 * - Layout-agnostic: renders the same on all platforms
 */

import { Link } from 'react-router-dom';
import OptimizedImage from '../../components/OptimizedImage';
import { getImageUrl } from '../../utils/imageUrl';
import { getDisplayName } from '../../utils/getDisplayName';
import './FeedSidebar.css';

export default function FeedSidebar({
  friends = [],
  onlineUsers = [],
  unreadMessageCounts = {},
  friendSearchQuery = '',
  onFriendSearchChange,
  getTimeSince,
}) {
  const filteredFriends = friends.filter(friend =>
    getDisplayName(friend).toLowerCase().includes(friendSearchQuery.toLowerCase())
  );

  return (
    <div className="feed-sidebar-content">
      {/* Explore Pryde - Feature Discovery */}
      <div className="sidebar-card explore-pryde glossy">
        <h3 className="sidebar-title">Explore Pryde</h3>
        <p className="sidebar-subtitle">
          Take your time. These spaces are here when you need them.
        </p>
        <nav className="explore-links">
          <Link to="/groups" className="explore-link">
            <strong>👥 Groups</strong>
            <span>Join shared spaces built around interests, support, and identity.</span>
          </Link>
          <Link to="/journal" className="explore-link">
            <strong>📔 Journal</strong>
            <span>A quiet place to write — just for you, or gently shared.</span>
          </Link>
          <Link to="/longform" className="explore-link">
            <strong>📖 Stories</strong>
            <span>Short moments people choose to share, nothing more.</span>
          </Link>
          <Link to="/photo-essay" className="explore-link">
            <strong>📸 Photos</strong>
            <span>Images, memories, and small glimpses of life.</span>
          </Link>
          <Link to="/lounge" className="explore-link">
            <strong>✨ Lounge</strong>
            <span>A shared space for open conversation, without urgency.</span>
          </Link>
        </nav>
      </div>

      {/* Need Support */}
      <div className="sidebar-card support-card glossy">
        <h3 className="sidebar-title support-title">Need support?</h3>
        <p className="support-description">
          If you're going through something, help is available.
        </p>
        <Link to="/helplines" className="support-link">
          View helplines
        </Link>
      </div>

      {/* Friends List */}
      <div className="sidebar-card glossy">
        <h3 className="sidebar-title">Recent Conversations</h3>

        {/* Search Bar */}
        <div className="friends-search-bar">
          <input
            id="friends-search-input"
            name="friendSearch"
            type="text"
            placeholder="Search friends..."
            value={friendSearchQuery}
            onChange={(e) => onFriendSearchChange?.(e.target.value)}
            className="friends-search-input"
          />
        </div>

        <div className="friends-sidebar-list">
          {filteredFriends.map((friend) => {
            const isOnline = onlineUsers.includes(friend._id);
            const unreadCount = unreadMessageCounts[friend._id] || 0;
            
            return (
              <div key={friend._id} className="friend-sidebar-item">
                <div className="friend-sidebar-main">
                  <div className="friend-sidebar-avatar">
                    {friend.profilePhoto ? (
                      <OptimizedImage
                        src={getImageUrl(friend.profilePhoto)}
                        alt={getDisplayName(friend)}
                        className="avatar-image"
                      />
                    ) : (
                      <span>{getDisplayName(friend).charAt(0).toUpperCase()}</span>
                    )}
                    <span className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
                  </div>
                  <div className="friend-sidebar-info">
                    <div className="friend-sidebar-name">{getDisplayName(friend)}</div>
                    <div className={`friend-sidebar-status ${isOnline ? 'online-status' : 'offline-status'}`}>
                      {isOnline ? 'Online' : getTimeSince?.(friend.lastSeen) || 'Offline'}
                    </div>
                  </div>
                  <div className="friend-sidebar-actions-top">
                    <Link
                      to={`/messages?chat=${friend._id}`}
                      className="btn-friend-action"
                      title="Chat"
                    >
                      💬
                      {unreadCount > 0 && (
                        <span className="friend-message-badge">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      to={`/profile/${friend._id}`}
                      className="btn-friend-action"
                      title="View Profile"
                    >
                      👤
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredFriends.length === 0 && friends.length > 0 && (
            <div className="no-friends">
              <p>No matching friends</p>
            </div>
          )}

          {friends.length === 0 && (
            <div className="no-friends">
              <p>No friends yet</p>
              <p className="friends-hint">Add friends to start chatting!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


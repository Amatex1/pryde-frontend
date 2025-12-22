import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../utils/imageUrl';
import api from '../utils/api';
import './ReactionDetailsModal.css';

/**
 * ReactionDetailsModal Component
 *
 * Fetches and displays detailed reaction information from the universal Reaction collection.
 * No longer relies on the old embedded reactions array in posts.
 *
 * Props:
 * - targetType: 'post' | 'comment'
 * - targetId: string (ID of the post or comment)
 * - onClose: function to close the modal
 */
function ReactionDetailsModal({ targetType, targetId, onClose }) {
  const [selectedTab, setSelectedTab] = useState('all');
  const [reactions, setReactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch reactions from API on mount
  useEffect(() => {
    const fetchReactions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/reactions/${targetType}/${targetId}/details`);
        setReactions(response.data || []);
      } catch (err) {
        console.error('Failed to fetch reaction details:', err);
        setError('Failed to load reactions');
        setReactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReactions();
  }, [targetType, targetId]);

  // Group reactions by emoji
  const reactionsByEmoji = reactions.reduce((acc, reaction) => {
    const emoji = reaction.emoji || '❤️';
    if (!acc[emoji]) {
      acc[emoji] = [];
    }
    acc[emoji].push(reaction);
    return acc;
  }, {});

  const totalCount = reactions.length;

  const displayReactions = selectedTab === 'all'
    ? reactions
    : reactionsByEmoji[selectedTab] || [];

  return (
    <div className="reaction-modal-overlay" onClick={onClose}>
      <div className="reaction-modal" onClick={(e) => e.stopPropagation()}>
        <div className="reaction-modal-header">
          <h3>Reactions</h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="reaction-loading">
            <p>Loading reactions...</p>
          </div>
        ) : error ? (
          <div className="reaction-error">
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="reaction-tabs">
              <button
                className={`reaction-tab ${selectedTab === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedTab('all')}
              >
                All {totalCount}
              </button>
              {Object.entries(reactionsByEmoji).map(([emoji, users]) => (
                <button
                  key={emoji}
                  className={`reaction-tab ${selectedTab === emoji ? 'active' : ''}`}
                  onClick={() => setSelectedTab(emoji)}
                >
                  {emoji} {users.length}
                </button>
              ))}
            </div>

            <div className="reaction-list">
              {displayReactions.length === 0 ? (
                <div className="no-reactions">
                  <p>No reactions yet</p>
                </div>
              ) : (
                displayReactions.map((reaction, index) => {
                  const user = reaction.user;

                  // Handle both populated user objects and user IDs
                  const isPopulated = user && typeof user === 'object' && user._id;
                  const userId = isPopulated ? user._id : user;
                  const username = isPopulated ? (user.username || 'Unknown User') : 'Unknown User';
                  const displayName = isPopulated ? (user.displayName || username) : 'Unknown User';
                  const profilePhoto = isPopulated ? user.profilePhoto : null;

                  // Skip reactions from deleted/invalid users
                  if (!userId || userId === 'Unknown User') {
                    return null;
                  }

                  return (
                    <Link
                      key={`${userId}-${index}`}
                      to={`/profile/${userId}`}
                      className="reaction-item"
                      onClick={onClose}
                    >
                      <div className="reaction-user-avatar">
                        {profilePhoto ? (
                          <img src={getImageUrl(profilePhoto)} alt={username} />
                        ) : (
                          <span>{displayName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="reaction-user-info">
                        <div className="reaction-user-name">{displayName}</div>
                        <div className="reaction-user-username">@{username}</div>
                      </div>
                      <div className="reaction-emoji">{reaction.emoji}</div>
                    </Link>
                  );
                }).filter(Boolean)
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ReactionDetailsModal;


import React, { useState, useEffect, useRef, memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { getImageUrl } from '../utils/imageUrl';
import { getCurrentUser } from '../utils/auth';
import { getSocket } from '../utils/socket';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import './MessagesDropdown.css';

const MessagesDropdown = memo(() => {
  const [conversations, setConversations] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const user = getCurrentUser();
  const userId = user?.id;
  const { totalUnread } = useUnreadMessages();

  const fetchConversations = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const response = await api.get('/messages/list');
      // Sort by lastMessage timestamp and take top 5
      const sorted = [...response.data].sort((a, b) => {
        const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      setConversations(sorted.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on dropdown open
  useEffect(() => {
    if (showDropdown && userId) {
      fetchConversations();
    }
  }, [showDropdown, userId]);

  // Listen for new messages via socket
  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = () => {
      if (showDropdown) fetchConversations();
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:received', handleNewMessage);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:received', handleNewMessage);
    };
  }, [userId, showDropdown]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChatClick = (conv) => {
    setShowDropdown(false);
    navigate(`/messages?chat=${conv.otherUser?._id || conv._id}`);
  };

  const getTimeAgo = (date) => {
    if (!date) return '';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return new Date(date).toLocaleDateString();
  };

  const truncateMessage = (msg, maxLen = 30) => {
    if (!msg) return 'No messages yet';
    return msg.length > maxLen ? msg.substring(0, maxLen) + '...' : msg;
  };

  return (
    <div className="messages-dropdown-container" ref={dropdownRef}>
      <button
        className="messages-dropdown-btn"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="Messages"
        title="Messages"
      >
        <span className="nav-icon">💬</span>
        <span className="nav-label">Messages</span>
        {totalUnread > 0 && (
          <span className="nav-badge">{totalUnread > 99 ? '99+' : totalUnread}</span>
        )}
      </button>

      {showDropdown && (
        <div className="messages-dropdown">
          <div className="messages-dropdown-header">
            <h3>Messages</h3>
          </div>

          <div className="messages-dropdown-list">
            {loading ? (
              <div className="messages-dropdown-loading">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="messages-dropdown-empty">
                <span className="empty-icon">💬</span>
                <p>No conversations yet</p>
              </div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv._id}
                  className={`messages-dropdown-item ${conv.unread > 0 ? 'unread' : ''}`}
                  onClick={() => handleChatClick(conv)}
                >
                  <div className="msg-avatar">
                    {conv.otherUser?.profilePhoto ? (
                      <img src={getImageUrl(conv.otherUser.profilePhoto)} alt="" />
                    ) : (
                      <span>{conv.otherUser?.username?.charAt(0).toUpperCase() || '?'}</span>
                    )}
                  </div>
                  <div className="msg-content">
                    <div className="msg-header">
                      <span className="msg-name">
                        {conv.otherUser?.displayName || conv.otherUser?.username || 'Unknown'}
                      </span>
                      <span className="msg-time">{getTimeAgo(conv.lastMessage?.createdAt)}</span>
                    </div>
                    <p className="msg-preview">{truncateMessage(conv.lastMessage?.content)}</p>
                  </div>
                  {conv.unread > 0 && <div className="unread-indicator">{conv.unread}</div>}
                </div>
              ))
            )}
          </div>

          <Link 
            to="/messages" 
            className="messages-dropdown-viewall"
            onClick={() => setShowDropdown(false)}
          >
            View All Messages
          </Link>
        </div>
      )}
    </div>
  );
});

export default MessagesDropdown;


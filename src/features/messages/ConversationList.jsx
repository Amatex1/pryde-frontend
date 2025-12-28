/**
 * ConversationList - List of message conversations
 * 
 * RESPONSIBILITIES:
 * - Render list of conversations (DMs and groups)
 * - Filter/search conversations
 * - Show unread indicators, online status
 * - Handle conversation selection (via onSelect)
 * 
 * RULES:
 * - NO layout logic (widths, grids, media queries)
 * - NO data fetching
 * - Layout-agnostic: renders the same on all platforms
 */

import { getImageUrl } from '../../utils/imageUrl';
import { getDisplayName, getDisplayNameInitial } from '../../utils/getDisplayName';
import MessageSearch from '../../components/MessageSearch';
import './ConversationList.css';

export default function ConversationList({
  // Data
  conversations = [],
  groupChats = [],
  currentUser,
  onlineUsers = [],
  
  // State
  selectedChatId,
  selectedChatType,
  activeTab = 'all',
  loading = false,
  archivedConversations = [],
  mutedConversations = [],
  conversationFilter = '',
  openDropdownId,
  
  // Handlers
  onSelectChat,
  onTabChange,
  onFilterChange,
  onNewChat,
  onArchive,
  onUnarchive,
  onMute,
  onUnmute,
  onMarkAsUnread,
  onDeleteChat,
  onBlockUser,
  onToggleDropdown,
}) {
  // Filter conversations based on tab and search
  const getFilteredConversations = () => {
    return conversations.filter(conv => {
      const isArchived = archivedConversations.includes(conv._id);
      
      // Tab filter
      if (activeTab === 'archived' && !isArchived) return false;
      if (activeTab !== 'archived' && isArchived) return false;
      if (activeTab === 'unread' && conv.unread === 0 && !conv.manuallyUnread) return false;
      
      // Text filter
      if (conversationFilter) {
        const otherUser = conv.participants?.find(p => p._id !== currentUser?._id);
        const name = getDisplayName(otherUser) || '';
        return name.toLowerCase().includes(conversationFilter.toLowerCase());
      }
      
      return true;
    });
  };

  const filteredConversations = getFilteredConversations();

  return (
    <div className="conversation-list-content">
      {/* Header */}
      <div className="sidebar-header">
        <h2 className="sidebar-title">💬 Messages</h2>
        <div className="header-buttons">
          <button className="btn-new-chat" onClick={onNewChat} title="New Chat">💬</button>
          <button className="btn-new-chat" onClick={() => onTabChange?.('archived')} title="Archived">📦</button>
        </div>
      </div>

      {/* Search/Filter */}
      <div className="message-search-container">
        <MessageSearch
          onSearch={onFilterChange}
          placeholder="Filter by name..."
        />
      </div>

      {/* Tabs */}
      <div className="messages-tabs">
        <button
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => onTabChange?.('all')}
        >
          All
        </button>
        <button
          className={`tab-button ${activeTab === 'unread' ? 'active' : ''}`}
          onClick={() => onTabChange?.('unread')}
        >
          Unread
        </button>
        <button
          className={`tab-button ${activeTab === 'archived' ? 'active' : ''}`}
          onClick={() => onTabChange?.('archived')}
        >
          Archived
        </button>
      </div>

      {/* Conversations List */}
      <div className="conversations-list">
        {loading ? (
          <div className="loading-state">Loading conversations...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="empty-state">
            {conversationFilter ? 'No conversations found' : 'No conversations yet'}
          </div>
        ) : (
          filteredConversations.map(conv => {
            const otherUser = conv.participants?.find(p => p._id !== currentUser?._id);
            const isSelfChat = conv.participants?.length === 1 || 
              (conv.participants?.length === 2 && conv.participants.every(p => p._id === currentUser?._id));
            const isOnline = onlineUsers.includes(conv._id);
            const isMuted = mutedConversations.includes(conv._id);
            const isSelected = selectedChatId === conv._id && selectedChatType === 'user';

            return (
              <ConversationItem
                key={conv._id}
                conversation={conv}
                otherUser={otherUser}
                isSelfChat={isSelfChat}
                isOnline={isOnline}
                isMuted={isMuted}
                isSelected={isSelected}
                isDropdownOpen={openDropdownId === conv._id}
                activeTab={activeTab}
                onSelect={() => onSelectChat?.(conv._id, 'user')}
                onArchive={() => onArchive?.(conv._id)}
                onUnarchive={() => onUnarchive?.(conv._id)}
                onMute={() => onMute?.(conv._id)}
                onUnmute={() => onUnmute?.(conv._id)}
                onMarkAsUnread={() => onMarkAsUnread?.(conv._id)}
                onDelete={() => onDeleteChat?.(conv._id)}
                onBlock={() => onBlockUser?.(otherUser?._id)}
                onToggleDropdown={() => onToggleDropdown?.(conv._id)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

/**
 * ConversationItem - Single conversation row
 */
function ConversationItem({
  conversation,
  otherUser,
  isSelfChat,
  isOnline,
  isMuted,
  isSelected,
  isDropdownOpen,
  activeTab,
  onSelect,
  onArchive,
  onUnarchive,
  onMute,
  onUnmute,
  onMarkAsUnread,
  onDelete,
  onBlock,
  onToggleDropdown,
}) {
  const displayName = isSelfChat ? '📝 Notes to self' : getDisplayName(otherUser);
  const lastMessageText = conversation.lastMessage?.voiceNote?.url
    ? '🎤 Voice note'
    : (conversation.lastMessage?.content || 'No messages');

  return (
    <div className={`conversation-item ${isSelected ? 'active' : ''} ${conversation.manuallyUnread ? 'manually-unread' : ''} ${conversation.unread > 0 ? 'has-unread' : ''}`}>
      <div className="conv-clickable" onClick={onSelect}>
        {/* Avatar */}
        <div className="conv-avatar">
          {otherUser?.profilePhoto ? (
            <img src={getImageUrl(otherUser.profilePhoto)} alt={displayName} />
          ) : (
            <span>{getDisplayNameInitial(otherUser)}</span>
          )}
          {conversation.unread > 0 && <span className="unread-indicator"></span>}
          {!isSelfChat && isOnline && <span className="status-dot online"></span>}
        </div>

        {/* Info */}
        <div className="conv-info">
          <div className="conv-header">
            <div className="conv-name">{displayName}</div>
            <div className="conv-time">
              {conversation.lastMessage?.createdAt
                ? new Date(conversation.lastMessage.createdAt).toLocaleTimeString()
                : ''}
            </div>
          </div>
          <div className="conv-last-message">
            {isMuted && '🔕 '}
            {lastMessageText}
          </div>
        </div>

        {/* Unread badge */}
        {conversation.unread > 0 && (
          <div className="unread-badge">{conversation.unread}</div>
        )}
      </div>

      {/* Actions dropdown */}
      <div className="conv-actions">
        <button
          className="btn-conv-menu"
          onClick={(e) => { e.stopPropagation(); onToggleDropdown?.(); }}
        >
          ⋮
        </button>
        {isDropdownOpen && (
          <div className="conv-dropdown">
            {activeTab !== 'archived' && (
              <button onClick={(e) => { e.stopPropagation(); onMarkAsUnread?.(); }}>
                📧 Mark as Unread
              </button>
            )}
            {isMuted ? (
              <button onClick={(e) => { e.stopPropagation(); onUnmute?.(); }}>
                🔔 Unmute
              </button>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); onMute?.(); }}>
                🔕 Mute
              </button>
            )}
            {activeTab === 'archived' ? (
              <button onClick={(e) => { e.stopPropagation(); onUnarchive?.(); }}>
                📤 Unarchive
              </button>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); onArchive?.(); }}>
                📦 Archive
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); onDelete?.(); }}>
              🗑️ Delete Chat
            </button>
            {!isSelfChat && (
              <button
                onClick={(e) => { e.stopPropagation(); onBlock?.(); }}
                className="danger"
              >
                🚫 Block User
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


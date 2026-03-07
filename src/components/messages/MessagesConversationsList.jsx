import React, { useState, useMemo } from 'react';
import { useOnlineUsers } from '../../hooks/useOnlineUsers';
import { useAuth } from '../../context/AuthContext';
import { getImageUrl } from '../../utils/imageUrl';
import { getDisplayName, getDisplayNameInitial, getUsername } from '../../utils/getDisplayName';
import MessageSearch from '../MessageSearch';
import { compareIds } from './messagesUtils';

/**
 * ConversationsList - Sidebar component showing all conversations
 * Extracted from Messages.jsx for better code organization
 */
export default function MessagesConversationsList({
  conversations,
  groupChats,
  selectedChat,
  selectedChatType,
  archivedConversations,
  mutedConversations,
  activeTab,
  debouncedFilter,
  onSelectChat,
  onArchiveConversation,
  onUnarchiveConversation,
  onMuteConversation,
  onUnmuteConversation,
  onDeleteConversation,
  onBlockUser,
  onMarkAsUnread,
  onSetActiveTab,
  onSetConversationFilter,
  onOpenNewChatModal,
  onOpenNewGroupModal,
  loading
}) {
  const { onlineUsers } = useOnlineUsers();
  const { user: currentUser } = useAuth();
  const [openDropdown, setOpenDropdown] = useState(null);

  // Filter conversations based on active tab and search
  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      const isArchived = archivedConversations.includes(conv._id);
      if (activeTab === 'archived') return isArchived;
      if (activeTab === 'unread') return !isArchived && (conv.unread > 0 || conv.manuallyUnread);
      if (isArchived) return false;

      if (debouncedFilter.trim()) {
        const q = debouncedFilter.toLowerCase();
        const otherUser = conv.otherUser || (
          compareIds(conv.lastMessage?.sender?._id, currentUser?._id)
            ? conv.lastMessage?.recipient
            : conv.lastMessage?.sender
        );
        const displayName = otherUser?.displayName || otherUser?.username || '';
        const username = otherUser?.username || '';
        return displayName.toLowerCase().includes(q) || username.toLowerCase().includes(q);
      }
      return true;
    });
  }, [conversations, archivedConversations, activeTab, debouncedFilter, currentUser]);

  // Handle dropdown click outside
  const handleClickOutside = (e) => {
    if (openDropdown && !e.target.closest('.conv-actions')) {
      setOpenDropdown(null);
    }
  };

  return (
    <div className="conversations-sidebar dm-list" onClick={handleClickOutside}>
      <div className="sidebar-header dm-list-header">
        <h2 className="sidebar-title dm-list-title">Messages</h2>
        <div className="header-buttons">
          <button className="btn-new-chat" onClick={onOpenNewChatModal} title="New Chat">💬</button>
          <button className="btn-new-chat" onClick={() => onSetActiveTab('archived')} title="Archived">📦</button>
        </div>
      </div>

      {/* Conversation Filter */}
      <div className="message-search-container">
        <MessageSearch
          onSearch={onSetConversationFilter}
          placeholder="Filter by name..."
        />
      </div>

      {/* Tabs */}
      <div className="messages-tabs">
        <button
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => onSetActiveTab('all')}
        >
          All
        </button>
        <button
          className={`tab-button ${activeTab === 'unread' ? 'active' : ''}`}
          onClick={() => onSetActiveTab('unread')}
        >
          Unread
        </button>
        <button
          className={`tab-button ${activeTab === 'archived' ? 'active' : ''}`}
          onClick={() => onSetActiveTab('archived')}
        >
          Archived
        </button>
      </div>

      <div className="conversations-list">
        {loading ? (
          <div className="loading-state">Loading conversations...</div>
        ) : (
          <>
            {groupChats.length > 0 && (
              <div className="section-label">Groups</div>
            )}
            
            {filteredConversations.length > 0 && (
              <>
                <div className="section-label">Direct Messages</div>
                {filteredConversations.map((conv) => {
                  const otherUser = conv.otherUser || (
                    compareIds(conv.lastMessage?.sender?._id, currentUser?._id)
                      ? conv.lastMessage?.recipient
                      : conv.lastMessage?.sender
                  );
                  const isSelfChat = compareIds(otherUser?._id, currentUser?._id);

                  return (
                    <ConversationItem
                      key={conv._id}
                      conv={conv}
                      otherUser={otherUser}
                      isSelfChat={isSelfChat}
                      isSelected={selectedChat === otherUser?._id && selectedChatType === 'user'}
                      onlineUsers={onlineUsers}
                      archivedConversations={archivedConversations}
                      mutedConversations={mutedConversations}
                      activeTab={activeTab}
                      openDropdown={openDropdown}
                      onSelect={() => onSelectChat(otherUser?._id, 'user')}
                      onToggleDropdown={() => setOpenDropdown(openDropdown === conv._id ? null : conv._id)}
                      onMarkAsUnread={() => onMarkAsUnread(conv._id)}
                      onArchive={() => onArchiveConversation(conv._id)}
                      onUnarchive={() => onUnarchiveConversation(conv._id)}
                      onMute={() => onMuteConversation(conv._id)}
                      onUnmute={() => onUnmuteConversation(conv._id)}
                      onDelete={() => onDeleteConversation(conv._id)}
                      onBlock={() => onBlockUser(otherUser?._id)}
                    />
                  );
                })}
              </>
            )}

            {conversations.length === 0 && groupChats.length === 0 && (
              <div className="empty-state">No conversations yet</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Conversation Item Component
function ConversationItem({
  conv,
  otherUser,
  isSelfChat,
  isSelected,
  onlineUsers,
  archivedConversations,
  mutedConversations,
  activeTab,
  openDropdown,
  onSelect,
  onToggleDropdown,
  onMarkAsUnread,
  onArchive,
  onUnarchive,
  onMute,
  onUnmute,
  onDelete,
  onBlock
}) {
  return (
    <div className={`conversation-item ${isSelected ? 'active' : ''} ${conv.manuallyUnread ? 'manually-unread' : ''} ${conv.unread > 0 ? 'has-unread' : ''}`}>
      <div className="conv-clickable" onClick={onSelect}>
        <div className="conv-avatar">
          {otherUser?.profilePhoto ? (
            <img src={getImageUrl(otherUser.profilePhoto)} alt={isSelfChat ? 'Notes to self' : getDisplayName(otherUser)} />
          ) : (
            <span>{isSelfChat ? '📝' : getDisplayNameInitial(otherUser)}</span>
          )}
          {conv.unread > 0 && <span className="unread-indicator"></span>}
          {!isSelfChat && onlineUsers.includes(conv._id) && (
            <span className="status-dot online"></span>
          )}
        </div>
        <div className="conv-info">
          <div className="conv-header">
            <div className="conv-name-group">
              <div className="conv-name">{isSelfChat ? '📝 Notes to self' : getDisplayName(otherUser)}</div>
              {!isSelfChat && getUsername(otherUser) && (
                <div className="conv-username">{getUsername(otherUser)}</div>
              )}
            </div>
            <div className="conv-time">
              {conv.lastMessage?.createdAt ? new Date(conv.lastMessage.createdAt).toLocaleTimeString() : ''}
            </div>
          </div>
          <div className="conv-last-message">
            {mutedConversations.includes(conv._id) && '🔕 '}
            {conv.lastMessage?.voiceNote?.url ? '🎤 Voice note' : (conv.lastMessage?.content || 'No messages')}
          </div>
        </div>
        {conv.unread > 0 && <div className="unread-badge">{conv.unread}</div>}
      </div>

      <div className="conv-actions">
        <button className="btn-conv-menu" onClick={onToggleDropdown}>⋮</button>
        
        {openDropdown === conv._id && (
          <div className="conv-dropdown">
            {activeTab !== 'archived' && (
              <button onClick={(e) => { e.stopPropagation(); onMarkAsUnread(); }}>
                📧 Mark as Unread
              </button>
            )}
            {activeTab === 'archived' ? (
              <button onClick={(e) => { e.stopPropagation(); onUnarchive(); }}>
                📤 Unarchive
              </button>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); onArchive(); }}>
                📦 Archive
              </button>
            )}
            {mutedConversations.includes(conv._id) ? (
              <button onClick={(e) => { e.stopPropagation(); onUnmute(); }}>
                🔔 Unmute
              </button>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); onMute(); }}>
                🔕 Mute
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }}>
              🗑️ Delete
            </button>
            <button onClick={(e) => { e.stopPropagation(); onBlock(); }} className="danger">
              🚫 Block User
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

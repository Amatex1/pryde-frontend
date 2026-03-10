/**
 * ThreadList — Conversation List Component
 *
 * Extracted from: src/pages/Messages.jsx lines 1600-1856
 */

import React from 'react';
import {
  MessageCircle, Archive, StickyNote, BellOff, Bell, Users,
  Trash2, Ban, Mic, MoreVertical, MailOpen, ArchiveRestore,
} from 'lucide-react';
import MessageSearch from '../../../components/MessageSearch';
import { getImageUrl } from '../../../utils/imageUrl';
import { getDisplayName, getDisplayNameInitial } from '../../../utils/getDisplayName';
import { quietCopy } from '../../../config/uiCopy';

function formatConversationTime(timestamp) {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'now';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getConversationPreview(conv) {
  if (conv.lastMessage?.voiceNote?.url) {
    return 'Voice note';
  }

  if (conv.lastMessage?.content?.trim()) {
    return conv.lastMessage.content.trim();
  }

  if (conv.lastMessage?.attachment) {
    return 'Attachment';
  }

  return 'No messages yet';
}

export default function ThreadList({
  conversations,
  groupChats,
  loading,
  selectedChat,
  selectedChatType,
  onSelectChat,
  activeTab,
  onTabChange,
  conversationFilter,
  onFilterChange,
  onNewChat,
  currentUser,
  onlineUsers,
  mutedConversations,
  archivedConversations,
  openDropdown,
  setOpenDropdown,
  onArchive,
  onUnarchive,
  onMute,
  onUnmute,
  onMarkAsUnread,
  onDelete,
  onBlock,
  quietMode,
}) {
  const normalizedFilter = conversationFilter.trim().toLowerCase();
  const visibleGroups = groupChats.filter((group) => {
    const isArchived = archivedConversations.includes(group._id);

    if (activeTab === 'archived') return isArchived;
    if (activeTab === 'unread') return false;
    if (isArchived) return false;

    if (!normalizedFilter) return true;
    return (group.name || '').toLowerCase().includes(normalizedFilter);
  });

  return (
    <aside className="messages-app__threads">
      <div className="messages-app__threads-header">
        <h2 className="sidebar-title">Messages</h2>
        <div className="header-buttons">
          <button className="btn-new-chat" onClick={onNewChat} title="New Chat" aria-label="New Chat"><MessageCircle size={18} strokeWidth={1.75} aria-hidden="true" /></button>
          <button className="btn-new-chat" onClick={() => onTabChange('archived')} title="Archived" aria-label="Archived"><Archive size={18} strokeWidth={1.75} aria-hidden="true" /></button>
        </div>
      </div>

      <div className="message-search-container">
        <MessageSearch onSearch={onFilterChange} placeholder="Search conversations" />
      </div>

      <div className="messages-tabs">
        <button className={`tab-button ${activeTab === 'all' ? 'active' : ''}`} onClick={() => onTabChange('all')}>All</button>
        <button className={`tab-button ${activeTab === 'unread' ? 'active' : ''}`} onClick={() => onTabChange('unread')}>Unread</button>
        <button className={`tab-button ${activeTab === 'archived' ? 'active' : ''}`} onClick={() => onTabChange('archived')}>Archived</button>
      </div>

      <div className="messages-app__threads-scroll">
        {loading ? (
          <div className="loading-state">Loading conversations...</div>
        ) : (
          <>
            {conversations.length > 0 && (
              <>
                <div className="section-label">Direct Messages</div>
                {conversations.map((conv) => {
                  const otherUser = conv.otherUser || (
                    conv.lastMessage?.sender?._id === currentUser?._id
                      ? conv.lastMessage?.recipient
                      : conv.lastMessage?.sender
                  );
                  const otherUserId = otherUser?._id;
                  const isSelfChat = otherUser?._id === currentUser?._id;
                  const isActive = selectedChat === otherUserId && selectedChatType === 'user';
                  const isOnline = !isSelfChat && otherUserId && onlineUsers.includes(otherUserId);
                  const isMuted = mutedConversations.includes(conv._id);
                  const hasUnread = conv.unread > 0 || conv.manuallyUnread;
                  const preview = getConversationPreview(conv);

                  return (
                    <div
                      key={conv._id}
                      className={`conversation-item ${isActive ? 'active' : ''} ${conv.manuallyUnread ? 'manually-unread' : ''} ${hasUnread ? 'has-unread' : ''}`}
                    >
                      <div
                        className="conv-clickable"
                        onClick={() => onSelectChat(otherUserId, 'user')}
                      >
                        <div className="conv-avatar">
                          {otherUser?.profilePhoto ? (
                            <img src={getImageUrl(otherUser.profilePhoto)} alt={isSelfChat ? 'Notes to self' : getDisplayName(otherUser)} />
                          ) : (
                            <span>{isSelfChat ? <StickyNote size={16} strokeWidth={1.75} aria-hidden="true" /> : getDisplayNameInitial(otherUser)}</span>
                          )}
                          {conv.unread > 0 && <span className="unread-indicator"></span>}
                          {isOnline && <span className="status-dot online"></span>}
                        </div>
                        <div className="conv-info">
                          <div className="conv-header">
                            <div className="conv-name">{isSelfChat ? 'Notes to self' : getDisplayName(otherUser)}</div>
                            <div className="conv-time">
                              {formatConversationTime(conv.lastMessage?.createdAt)}
                            </div>
                          </div>
                          <div className="conv-last-message">
                            {preview === 'Voice note' && <Mic size={14} strokeWidth={1.75} aria-hidden="true" />}
                            <span className="conv-last-message-text">{preview}</span>
                            {isMuted && <span className="conv-meta-badge"><BellOff size={12} strokeWidth={1.75} aria-hidden="true" /> Muted</span>}
                          </div>
                        </div>
                        {conv.unread > 0 && <div className="unread-badge">{conv.unread > 99 ? '99+' : conv.unread}</div>}
                      </div>

                      <div className="conv-actions">
                        <button
                          className="btn-conv-menu"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(openDropdown === conv._id ? null : conv._id);
                          }}
                          aria-label="More options"
                        ><MoreVertical size={16} strokeWidth={1.75} aria-hidden="true" /></button>

                        {openDropdown === conv._id && (
                          <div className="conv-dropdown">
                            {activeTab !== 'archived' && (
                              <button onClick={(e) => { e.stopPropagation(); onMarkAsUnread(conv._id); }}><MailOpen size={14} strokeWidth={1.75} aria-hidden="true" /> Mark as Unread</button>
                            )}
                            {activeTab === 'archived' ? (
                              <button onClick={(e) => { e.stopPropagation(); onUnarchive(conv._id); }}><ArchiveRestore size={14} strokeWidth={1.75} aria-hidden="true" /> Unarchive</button>
                            ) : (
                              <button onClick={(e) => { e.stopPropagation(); onArchive(conv._id); }}><Archive size={14} strokeWidth={1.75} aria-hidden="true" /> Archive</button>
                            )}
                            {mutedConversations.includes(conv._id) ? (
                              <button onClick={(e) => { e.stopPropagation(); onUnmute(conv._id); }}><Bell size={14} strokeWidth={1.75} aria-hidden="true" /> Unmute</button>
                            ) : (
                              <button onClick={(e) => { e.stopPropagation(); onMute(conv._id); }}><BellOff size={14} strokeWidth={1.75} aria-hidden="true" /> Mute</button>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); onDelete(conv._id); }}><Trash2 size={14} strokeWidth={1.75} aria-hidden="true" /> Delete</button>
                            <button onClick={(e) => { e.stopPropagation(); onBlock(otherUser?._id); }} className="danger"><Ban size={14} strokeWidth={1.75} aria-hidden="true" /> Block User</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {visibleGroups.length > 0 && (
              <>
                <div className="section-label">Groups</div>
                {visibleGroups.map((group) => {
                  const memberCount = group.members?.length || 0;
                  const preview = memberCount > 0
                    ? `${memberCount} member${memberCount === 1 ? '' : 's'}`
                    : 'Group chat';

                  return (
                    <div
                      key={group._id}
                      className={`conversation-item conversation-item--group ${selectedChat === group._id && selectedChatType === 'group' ? 'active' : ''}`}
                    >
                      <div className="conv-clickable" onClick={() => onSelectChat(group._id, 'group')}>
                        <div className="conv-avatar conv-avatar--group">
                          <span>{group.name?.charAt(0)?.toUpperCase() || 'G'}</span>
                        </div>
                        <div className="conv-info">
                          <div className="conv-header">
                            <div className="conv-name">{group.name || 'Group chat'}</div>
                            <div className="conv-time">{formatConversationTime(group.updatedAt)}</div>
                          </div>
                          <div className="conv-last-message">
                            <Users size={14} strokeWidth={1.75} aria-hidden="true" />
                            <span className="conv-last-message-text">{preview}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {conversations.length === 0 && visibleGroups.length === 0 && (
              <div className="empty-state">
                {quietMode ? quietCopy.noMessages : 'No conversations yet'}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}


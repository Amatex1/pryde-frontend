/**
 * ThreadList — Conversation List Component
 *
 * Extracted from: src/pages/Messages.jsx lines 1600-1856
 */

import React from 'react';
import {
  MessageCircle, Archive, StickyNote, BellOff, Bell,
  Trash2, Ban, Mic, MoreVertical, MailOpen, ArchiveRestore,
} from 'lucide-react';
import MessageSearch from '../../../components/MessageSearch';
import { getImageUrl } from '../../../utils/imageUrl';
import { getDisplayName, getDisplayNameInitial, getUsername } from '../../../utils/getDisplayName';
import { quietCopy } from '../../../config/uiCopy';

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
        <MessageSearch onSearch={onFilterChange} placeholder="Filter by name..." />
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
                  const isSelfChat = otherUser?._id === currentUser?._id;

                  return (
                    <div
                      key={conv._id}
                      className={`conversation-item ${selectedChat === otherUser?._id && selectedChatType === 'user' ? 'active' : ''} ${conv.manuallyUnread ? 'manually-unread' : ''} ${conv.unread > 0 ? 'has-unread' : ''}`}
                    >
                      <div
                        className="conv-clickable"
                        onClick={() => onSelectChat(otherUser?._id, 'user')}
                      >
                        <div className="conv-avatar">
                          {otherUser?.profilePhoto ? (
                            <img src={getImageUrl(otherUser.profilePhoto)} alt={isSelfChat ? 'Notes to self' : getDisplayName(otherUser)} />
                          ) : (
                            <span>{isSelfChat ? <StickyNote size={16} strokeWidth={1.75} aria-hidden="true" /> : getDisplayNameInitial(otherUser)}</span>
                          )}
                          {conv.unread > 0 && <span className="unread-indicator"></span>}
                          {!isSelfChat && onlineUsers.includes(conv._id) && <span className="status-dot online"></span>}
                        </div>
                        <div className="conv-info">
                          <div className="conv-header">
                            <div className="conv-name">{isSelfChat ? 'Notes to self' : getDisplayName(otherUser)}</div>
                            <div className="conv-time">
                              {conv.lastMessage?.createdAt ? new Date(conv.lastMessage.createdAt).toLocaleTimeString() : ''}
                            </div>
                          </div>
                          {!isSelfChat && getUsername(otherUser) && (
                            <div className="conv-username">{getUsername(otherUser)}</div>
                          )}
                          <div className="conv-last-message">
                            {mutedConversations.includes(conv._id) && <BellOff size={14} strokeWidth={1.75} aria-hidden="true" style={{marginRight:'4px'}} />}
                            {conv.lastMessage?.voiceNote?.url ? <><Mic size={14} strokeWidth={1.75} aria-hidden="true" /> Voice note</> : (conv.lastMessage?.content || 'No messages')}
                          </div>
                        </div>
                        {conv.unread > 0 && <div className="unread-badge">{conv.unread}</div>}
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

            {conversations.length === 0 && groupChats.length === 0 && (
              <div className="empty-state">
                {quietMode ? quietCopy.noMessages : "No conversations yet"}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}


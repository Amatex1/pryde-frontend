/**
 * MessageList — Scrollable Message Container
 * Extracted from: src/pages/Messages.jsx lines 1954-2175
 */

import React from 'react';
import TypingIndicator from '../../../components/TypingIndicator';
import { getImageUrl } from '../../../utils/imageUrl';
import { getDisplayName, getDisplayNameInitial } from '../../../utils/getDisplayName';
import { getSentMessageColor, getUserChatColor } from '../../../utils/chatColors';
import { sanitizeMessage } from '../../../utils/sanitize';

export default function MessageList({
  selectedChat,
  messages,
  groupMessagesBySender,
  loadingMessages,
  isTyping,
  selectedUser,
  currentUser,
  currentTheme,
  chatContainerRef,
  onScroll,
  showNewMessageIndicator,
  onDismissIndicator,
  lastReadMessageId,
  onUpdateLastRead,
  editingMessageId,
  editMessageText,
  onEditMessageTextChange,
  onSaveEdit,
  onCancelEdit,
  openMessageMenu,
  setOpenMessageMenu,
  onReply,
  onReact,
  onRemoveReaction,
  onEdit,
  onDelete,
}) {
  // Find the index of the last read message (for unread divider positioning)
  const lastReadIndex = React.useMemo(() => {
    if (!lastReadMessageId || !messages.length) return -1;
    return messages.findIndex(msg => msg._id === lastReadMessageId);
  }, [lastReadMessageId, messages]);

  // Check if we should show the unread divider (only if there are unread messages)
  const showUnreadDivider = lastReadIndex >= 0 && lastReadIndex < messages.length - 1;
  return (
    <div className="messages-app__messages-scroll" ref={chatContainerRef} onScroll={onScroll}>
      {selectedChat ? (
        <div className="conversation-wrapper">
          <div className="conversation-inner">
            {!currentUser || loadingMessages ? (
              <div className="loading-messages">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="empty-chat-state">
                <div className="empty-chat-icon">💬</div>
                <p className="empty-title">No messages yet</p>
                <p className="empty-chat-hint">Start a calm conversation</p>
              </div>
            ) : (
              groupMessagesBySender.map((group, groupIndex) => (
                <React.Fragment key={`group-${groupIndex}-${group.senderId}`}>
                  {group.showDateHeader && (
                    <div className="message-date-header"><span>{group.dateHeader}</span></div>
                  )}
                  <div className={`message-group-cluster ${group.isCurrentUser ? 'sent' : 'received'}`}>
                    <div className="message-group-cluster-header">
                      <div className="cluster-avatar">
                        {group.senderInfo.profilePhoto ? (
                          <img src={getImageUrl(group.senderInfo.profilePhoto)} alt={getDisplayName(group.senderInfo)} />
                        ) : (<span>{getDisplayNameInitial(group.senderInfo)}</span>)}
                      </div>
                      <span className="cluster-sender-name">{getDisplayName(group.senderInfo)}</span>
                    </div>
                    {group.messages.map((msg, msgIndex) => {
                      const isEditing = editingMessageId === msg._id;
                      const isFirst = msgIndex === 0;
                      const isLast = msgIndex === group.messages.length - 1;
                      const isSingle = group.messages.length === 1;
                      const bubblePosition = isSingle ? 'single' : isFirst ? 'first' : isLast ? 'last' : 'middle';
                      // Show unread divider after the last-read message
                      const showDividerAfter = showUnreadDivider && msg._id === lastReadMessageId;
                      return (
                        <React.Fragment key={msg._id}>
                          <div className={`message-group ${group.isCurrentUser ? 'sent' : 'received'}`} data-position={bubblePosition}>
                            <div className="message-content">
                            {msg.isDeleted ? (
                              <div className="message-bubble message-deleted">
                                <span className="deleted-icon">🗑️</span>
                                <span className="deleted-text">This message was deleted</span>
                              </div>
                            ) : isEditing ? (
                              <div className="message-edit-box">
                                <input type="text" value={editMessageText} onChange={(e) => onEditMessageTextChange(e.target.value)} className="message-edit-input" autoFocus />
                                <div className="message-edit-actions">
                                  <button onClick={() => onSaveEdit(msg._id)} className="btn-save-edit">✓</button>
                                  <button onClick={onCancelEdit} className="btn-cancel-edit">✕</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div
                                  className={`message-bubble ${bubblePosition}`}
                                  style={group.isCurrentUser
                                    ? { background: getSentMessageColor(currentTheme).background, color: getSentMessageColor(currentTheme).text }
                                    : { background: getUserChatColor(msg.sender._id, currentTheme).background, color: getUserChatColor(msg.sender._id, currentTheme).text }}
                                >
                                  {sanitizeMessage(msg.content)}
                                  {msg.reactions && msg.reactions.length > 0 && (
                                    <div className="message-reactions">
                                      {Object.entries(msg.reactions.reduce((acc, r) => { acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc; }, {})).map(([emoji, count]) => {
                                        const userReacted = msg.reactions.some(r => r.emoji === emoji && r.user._id === currentUser?._id);
                                        return (
                                          <button key={emoji} className={`reaction-badge ${userReacted ? 'user-reacted' : ''}`} onClick={() => userReacted ? onRemoveReaction(msg._id, emoji) : null} title={userReacted ? 'Click to remove' : ''}>
                                            {emoji} {count}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                                {isLast && (
                                  <div className="message-meta">
                                    <div className="message-time">{new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</div>
                                    {msg.edited && <div className="message-edited-indicator">(edited)</div>}
                                  </div>
                                )}
                                <div className="message-actions-menu">
                                  <button className="btn-message-menu" onClick={() => setOpenMessageMenu(openMessageMenu === msg._id ? null : msg._id)} title="More actions">⋮</button>
                                  {openMessageMenu === msg._id && (
                                    <div className="message-menu-dropdown">
                                      <button onClick={() => { onReply(msg); setOpenMessageMenu(null); }} className="menu-item">↩️ Reply</button>
                                      <button onClick={() => { onReact(msg._id); setOpenMessageMenu(null); }} className="menu-item">😊 React</button>
                                      {group.isCurrentUser && (
                                        <>
                                          <button onClick={() => { onEdit(msg._id, msg.content); setOpenMessageMenu(null); }} className="menu-item">✏️ Edit</button>
                                          <button onClick={() => { onDelete(msg._id, true); setOpenMessageMenu(null); }} className="menu-item menu-item-danger">🗑️ Delete</button>
                                        </>
                                      )}
                                      {!group.isCurrentUser && (
                                        <button onClick={() => { onDelete(msg._id, false); setOpenMessageMenu(null); }} className="menu-item menu-item-danger">🗑️ Delete for me</button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                            </div>
                          </div>
                          {/* Unread Divider */}
                          {showDividerAfter && (
                            <div className="unread-divider">
                              <span className="unread-divider__line" />
                              <span className="unread-divider__label">Unread messages</span>
                              <span className="unread-divider__line" />
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </React.Fragment>
              ))
            )}
            <TypingIndicator isTyping={isTyping} userName={selectedUser ? getDisplayName(selectedUser) : null} />
          </div>
        </div>
      ) : (
        <div className="no-chat-selected">
          <h3>Select a conversation</h3>
          <p>Choose a conversation from the sidebar to start messaging</p>
        </div>
      )}
      {/* New Message Indicator */}
      {showNewMessageIndicator && (
        <button
          className="new-message-indicator"
          onClick={onDismissIndicator}
          type="button"
        >
          ↓ New messages
        </button>
      )}
    </div>
  );
}


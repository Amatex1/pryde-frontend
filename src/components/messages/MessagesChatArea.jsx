import React, { useRef, useEffect, useMemo, Suspense, lazy } from 'react';
import TypingIndicator from '../TypingIndicator';
import { getImageUrl } from '../../utils/imageUrl';
import { getDisplayName, getDisplayNameInitial, getUsername } from '../../utils/getDisplayName';
import { getUserChatColor, getSentMessageColor } from '../../utils/chatColors';
import { sanitizeMessage } from '../../utils/sanitize';
import { compareIds } from './messagesUtils';

// Lazy load AudioPlayer for voice notes
const AudioPlayer = lazy(() => import('../AudioPlayer'));

/**
 * MessagesChatArea - Main chat area showing messages
 * Extracted from Messages.jsx for better code organization
 */
export default function MessagesChatArea({
  selectedChat,
  selectedChatType,
  selectedUser,
  selectedGroup,
  currentUser,
  messages,
  loadingMessages,
  isTyping,
  onlineUsers,
  isRecipientUnavailable,
  recipientUnavailableReason,
  editingMessageId,
  editMessageText,
  openMessageMenu,
  mutedConversations,
  currentTheme,
  groupMessagesBySender,
  onSelectChat,
  onSetSelectedChat,
  onSetSelectedChatType,
  onSetEditingMessageId,
  onSetEditMessageText,
  onSetOpenMessageMenu,
  onSetReplyingTo,
  onSaveEditMessage,
  onCancelEdit,
  onReactToMessage,
  onOpenDeleteModal,
  onEditMessage,
  chatContainerRef,
  messagesEndRef,
}) {
  if (!selectedChat) {
    return (
      <div className="chat-area conversation-shell">
        <div className="no-chat-selected no-conversation-selected">
          <h3>Select a conversation</h3>
          <p>Choose a conversation from the sidebar to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`chat-area conversation-shell ${selectedChat ? 'active' : ''}`}>
      {/* Header */}
      <ChatHeader
        selectedChat={selectedChat}
        selectedChatType={selectedChatType}
        selectedUser={selectedUser}
        selectedGroup={selectedGroup}
        currentUser={currentUser}
        onlineUsers={onlineUsers}
        isRecipientUnavailable={isRecipientUnavailable}
        mutedConversations={mutedConversations}
        onToggleMute={() => {
          // Toggle mute - passed from parent handler
        }}
        onBack={() => {
          onSetSelectedChat(null);
          onSetSelectedChatType(null);
        }}
      />

      {/* Messages Area */}
      <div 
        id="message-scroll" 
        className="chat-messages message-scroll" 
        ref={chatContainerRef}
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        <div className="conversation-wrapper">
          <div className="conversation-inner">
            {!currentUser ? (
              <div className="loading-messages empty-conversation">Loading messages...</div>
            ) : loadingMessages ? (
              <div className="loading-messages empty-conversation">Loading messages...</div>
            ) : messages.length === 0 ? (
              <EmptyChatState />
            ) : (
              <MessageGroups
                groups={groupMessagesBySender}
                currentUser={currentUser}
                currentTheme={currentTheme}
                editingMessageId={editingMessageId}
                editMessageText={editMessageText}
                openMessageMenu={openMessageMenu}
                onSetEditingMessageId={onSetEditingMessageId}
                onSetEditMessageText={onSetEditMessageText}
                onSaveEditMessage={onSaveEditMessage}
                onCancelEdit={onCancelEdit}
                onSetOpenMessageMenu={onSetOpenMessageMenu}
                onSetReplyingTo={onSetReplyingTo}
                onReactToMessage={onReactToMessage}
                onOpenDeleteModal={onOpenDeleteModal}
                onEditMessage={onEditMessage}
              />
            )}

            <TypingIndicator
              isTyping={isTyping}
              userName={selectedUser ? getDisplayName(selectedUser) : null}
            />
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Chat Header Component
function ChatHeader({
  selectedChat,
  selectedChatType,
  selectedUser,
  selectedGroup,
  currentUser,
  onlineUsers,
  isRecipientUnavailable,
  mutedConversations,
  onBack,
  onToggleMute
}) {
  const isSelfChat = selectedUser && compareIds(selectedUser._id, currentUser?._id);
  const isMuted = mutedConversations.includes(selectedChat);

  return (
    <header className="chat-header conversation-header" key={`${selectedChat}-${selectedChatType}`}>
      <button className="mobile-back-btn back-btn" onClick={onBack} aria-label="Back to conversations">
        ←
      </button>
      <div className="chat-user">
        {(() => {
          return (
            <>
              <div className="chat-avatar">
                {selectedChatType === 'group' ? (
                  <span>{selectedGroup?.name?.charAt(0).toUpperCase() || 'G'}</span>
                ) : isSelfChat ? (
                  selectedUser?.profilePhoto ? (
                    <img src={getImageUrl(selectedUser.profilePhoto)} alt="Notes to self" />
                  ) : (
                    <span>📝</span>
                  )
                ) : selectedUser?.isDeleted === true ? (
                  <span>👤</span>
                ) : selectedUser?.profilePhoto ? (
                  <img src={getImageUrl(selectedUser.profilePhoto)} alt={getDisplayName(selectedUser)} />
                ) : (
                  <span>{getDisplayNameInitial(selectedUser)}</span>
                )}
              </div>
              <div className="chat-user-info">
                <div className="chat-user-name">
                  <span className="display-name">
                    {selectedChatType === 'group'
                      ? selectedGroup?.name || 'Group Chat'
                      : isSelfChat
                        ? '📝 Notes to self'
                        : selectedUser?.isDeleted === true
                          ? 'Unknown User'
                          : getDisplayName(selectedUser)}
                  </span>
                  {selectedChatType !== 'group' && !isSelfChat && !selectedUser?.isDeleted && getUsername(selectedUser) && (
                    <span className="username">{getUsername(selectedUser)}</span>
                  )}
                  {isMuted && <span className="muted-indicator">🔕</span>}
                </div>
                {selectedChatType !== 'group' && !isSelfChat && selectedUser?.isActive === false && !selectedUser?.isDeleted && (
                  <div className="chat-user-subtitle" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Account deactivated
                  </div>
                )}
                {selectedChatType !== 'group' && !isSelfChat && !isRecipientUnavailable && (
                  <div className={`chat-user-status ${onlineUsers.includes(selectedChat) ? 'online' : 'offline'}`}>
                    {onlineUsers.includes(selectedChat) ? 'Online' : 'Offline'}
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </div>

      <button
        className="btn-chat-settings"
        onClick={onToggleMute}
        title={isMuted ? 'Unmute notifications' : 'Mute notifications'}
      >
        {isMuted ? '🔔' : '🔕'}
      </button>
    </header>
  );
}

// Empty Chat State Component
function EmptyChatState() {
  return (
    <div className="empty-chat-state empty-conversation">
      <div className="empty-chat-icon empty-icon">💬</div>
      <p className="empty-title">No messages yet</p>
      <p className="empty-chat-hint empty-hint">Start a calm conversation</p>
    </div>
  );
}

// Message Groups Component
function MessageGroups({
  groups,
  currentUser,
  currentTheme,
  editingMessageId,
  editMessageText,
  openMessageMenu,
  onSetEditingMessageId,
  onSetEditMessageText,
  onSaveEditMessage,
  onCancelEdit,
  onSetOpenMessageMenu,
  onSetReplyingTo,
  onReactToMessage,
  onOpenDeleteModal,
  onEditMessage
}) {
  return groups.map((group, groupIndex) => (
    <React.Fragment key={`group-${groupIndex}-${group.senderId}`}>
      {group.showDateHeader && (
        <div className="message-date-header">
          <span>{group.dateHeader}</span>
        </div>
      )}
      <div className={`message-group-cluster ${group.isCurrentUser ? 'sent' : 'received'}`}>
        <div className="message-group-cluster-header">
          <div className="cluster-avatar">
            {group.senderInfo.profilePhoto ? (
              <img src={getImageUrl(group.senderInfo.profilePhoto)} alt={getDisplayName(group.senderInfo)} />
            ) : (
              <span>{getDisplayNameInitial(group.senderInfo)}</span>
            )}
          </div>
          <span className="cluster-sender-name">{getDisplayName(group.senderInfo)}</span>
        </div>

        {group.messages.map((msg, msgIndex) => {
          const isEditing = editingMessageId === msg._id;
          const isFirst = msgIndex === 0;
          const isLast = msgIndex === group.messages.length - 1;
          const isSingle = group.messages.length === 1;
          const bubblePosition = isSingle ? 'single' : isFirst ? 'first' : isLast ? 'last' : 'middle';

          return (
            <MessageBubble
              key={msg._id}
              msg={msg}
              bubblePosition={bubblePosition}
              isCurrentUser={group.isCurrentUser}
              isEditing={isEditing}
              editMessageText={editMessageText}
              openMessageMenu={openMessageMenu}
              currentUser={currentUser}
              currentTheme={currentTheme}
              onSetEditingMessageId={onSetEditingMessageId}
              onSetEditMessageText={onSetEditMessageText}
              onSaveEditMessage={onSaveEditMessage}
              onCancelEdit={onCancelEdit}
              onSetOpenMessageMenu={onSetOpenMessageMenu}
              onSetReplyingTo={onSetReplyingTo}
              onReactToMessage={onReactToMessage}
              onOpenDeleteModal={onOpenDeleteModal}
              onEditMessage={onEditMessage}
            />
          );
        })}
      </div>
    </React.Fragment>
  ));
}

// Message Bubble Component
function MessageBubble({
  msg,
  bubblePosition,
  isCurrentUser,
  isEditing,
  editMessageText,
  openMessageMenu,
  currentUser,
  currentTheme,
  onSetEditingMessageId,
  onSetEditMessageText,
  onSaveEditMessage,
  onCancelEdit,
  onSetOpenMessageMenu,
  onSetReplyingTo,
  onReactToMessage,
  onOpenDeleteModal,
  onEditMessage
}) {
  const isLast = true; // Simplified - in real code would check position

  return (
    <div
      className={`message-group ${isCurrentUser ? 'sent' : 'received'}`}
      data-position={bubblePosition}
    >
      <div className="message-content">
        {msg.isDeleted ? (
          <div className="message-bubble message-deleted">
            <span className="deleted-icon">🗑️</span>
            <span className="deleted-text">This message was deleted</span>
          </div>
        ) : isEditing ? (
          <div className="message-edit-box">
            <input
              type="text"
              value={editMessageText}
              onChange={(e) => onSetEditMessageText(e.target.value)}
              className="message-edit-input"
              autoFocus
            />
            <div className="message-edit-actions">
              <button onClick={() => onSaveEditMessage(msg._id)} className="btn-save-edit">
                ✓
              </button>
              <button onClick={onCancelEdit} className="btn-cancel-edit">
                ✕
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              className={`message-bubble ${bubblePosition}`}
              style={
                isCurrentUser
                  ? {
                      background: getSentMessageColor(currentTheme).background,
                      color: getSentMessageColor(currentTheme).text
                    }
                  : {
                      background: getUserChatColor(msg.sender._id, currentTheme).background,
                      color: getUserChatColor(msg.sender._id, currentTheme).text
                    }
              }
            >
              {msg.content && sanitizeMessage(msg.content)}

              {/* Attachment */}
              {msg.attachment && (
                <div className="bubble-attachment">
                  {(msg.attachment.includes('.jpg') ||
                    msg.attachment.includes('.jpeg') ||
                    msg.attachment.includes('.png') ||
                    msg.attachment.includes('.gif') ||
                    msg.attachment.includes('.webp') ||
                    msg.attachment.startsWith('data:image') ||
                    msg.attachment.includes('/upload/image/')) && (
                    <img src={getImageUrl(msg.attachment)} alt="Attachment" loading="lazy" />
                  )}
                  {(msg.attachment.includes('.mp4') ||
                    msg.attachment.includes('.webm') ||
                    msg.attachment.includes('.ogg')) && (
                    <video src={getImageUrl(msg.attachment)} controls preload="metadata" />
                  )}
                </div>
              )}

              {/* Voice Note */}
              {msg.voiceNote?.url && (
                <Suspense fallback={<div className="loading-spinner">Loading...</div>}>
                  <AudioPlayer
                    url={getImageUrl(msg.voiceNote.url)}
                    duration={msg.voiceNote.duration}
                  />
                </Suspense>
              )}

              {/* Reactions */}
              {msg.reactions && msg.reactions.length > 0 && (
                <div className="message-reactions">
                  {Object.entries(
                    msg.reactions.reduce((acc, reaction) => {
                      acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([emoji, count]) => {
                    const userReacted = msg.reactions.some(
                      r => r.emoji === emoji && compareIds(r.user._id, currentUser?._id)
                    );
                    return (
                      <button
                        key={emoji}
                        className={`reaction-badge ${userReacted ? 'user-reacted' : ''}`}
                        onClick={() => userReacted ? onReactToMessage(msg._id, emoji) : null}
                        title={userReacted ? 'Click to remove' : ''}
                      >
                        {emoji} {count}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Timestamp */}
            {isLast && (
              <div className="message-meta">
                <div className="message-time">
                  {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                </div>
                {msg.edited && <div className="message-edited-indicator">(edited)</div>}
              </div>
            )}

            {/* Message Actions Menu */}
            <div className="message-actions-menu">
              <button
                className="btn-message-menu"
                onClick={() => onSetOpenMessageMenu(openMessageMenu === msg._id ? null : msg._id)}
                title="More actions"
              >
                ⋮
              </button>
              {openMessageMenu === msg._id && (
                <div className="message-menu-dropdown">
                  <button onClick={() => { onSetReplyingTo(msg); onSetOpenMessageMenu(null); }} className="menu-item">
                    ↩️ Reply
                  </button>
                  <button onClick={() => { onReactToMessage(msg._id); onSetOpenMessageMenu(null); }} className="menu-item">
                    😊 React
                  </button>
                  {isCurrentUser && (
                    <>
                      <button onClick={() => { onEditMessage(msg._id, msg.content); onSetOpenMessageMenu(null); }} className="menu-item">
                        ✏️ Edit
                      </button>
                      <button onClick={() => { onOpenDeleteModal(msg._id, true); onSetOpenMessageMenu(null); }} className="menu-item menu-item-danger">
                        🗑️ Delete
                      </button>
                    </>
                  )}
                  {!isCurrentUser && (
                    <button onClick={() => { onOpenDeleteModal(msg._id, false); onSetOpenMessageMenu(null); }} className="menu-item menu-item-danger">
                      🗑️ Delete for me
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

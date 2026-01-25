/**
 * ChatColumn — Chat Area Container
 * Extracted from: src/pages/Messages.jsx lines 1862-2357
 */

import React from 'react';
import MessageList from './MessageList';
import Composer from './Composer';
import { getImageUrl } from '../../../utils/imageUrl';
import { getDisplayName, getDisplayNameInitial, getUsername } from '../../../utils/getDisplayName';

export default function ChatColumn({
  selectedChat,
  selectedChatType,
  selectedUser,
  selectedGroup,
  messages,
  groupMessagesBySender,
  loadingMessages,
  isTyping,
  currentUser,
  currentTheme,
  onlineUsers,
  mutedConversations,
  isRecipientUnavailable,
  recipientUnavailableReason,
  chatContainerRef,
  onBack,
  onMute,
  onUnmute,
  message,
  onMessageChange,
  onSendMessage,
  selectedFile,
  onFileSelect,
  onRemoveFile,
  fileInputRef,
  textareaRef,
  uploadingFile,
  uploadProgress,
  selectedGif,
  onRemoveGif,
  contentWarning,
  onContentWarningChange,
  showContentWarning,
  onToggleContentWarning,
  showVoiceRecorder,
  onToggleVoiceRecorder,
  replyingTo,
  onCancelReply,
  editingMessageId,
  editMessageText,
  onEditMessageTextChange,
  onEditMessage,
  onSaveEdit,
  onCancelEdit,
  openMessageMenu,
  setOpenMessageMenu,
  onReply,
  onReact,
  onRemoveReaction,
  onDeleteMessage,
}) {
  const isSelfChat = selectedUser?._id === currentUser?._id;

  return (
    <section className="messages-app__chat">
      {selectedChat && (
        <header className="messages-app__chat-header">
          <button className="mobile-back-btn" onClick={onBack} aria-label="Back">←</button>
          <div className="chat-user">
            <div className="chat-avatar">
              {selectedChatType === 'group' ? (
                <span>{selectedGroup?.name?.charAt(0).toUpperCase() || 'G'}</span>
              ) : isSelfChat ? (
                selectedUser?.profilePhoto ? (
                  <img src={getImageUrl(selectedUser.profilePhoto)} alt="Notes to self" />
                ) : (<span>📝</span>)
              ) : selectedUser?.isDeleted ? (
                <span>👤</span>
              ) : selectedUser?.profilePhoto ? (
                <img src={getImageUrl(selectedUser.profilePhoto)} alt={getDisplayName(selectedUser)} />
              ) : (<span>{getDisplayNameInitial(selectedUser)}</span>)}
            </div>
            <div className="chat-user-info">
              <div className="chat-user-name">
                <span className="display-name">
                  {selectedChatType === 'group' ? (selectedGroup?.name || 'Group Chat')
                    : isSelfChat ? '📝 Notes to self'
                    : selectedUser?.isDeleted ? 'Unknown User'
                    : getDisplayName(selectedUser)}
                </span>
                {selectedChatType !== 'group' && !isSelfChat && !selectedUser?.isDeleted && getUsername(selectedUser) && (
                  <span className="username">{getUsername(selectedUser)}</span>
                )}
                {mutedConversations.includes(selectedChat) && <span className="muted-indicator">🔕</span>}
              </div>
              {selectedChatType !== 'group' && !isSelfChat && selectedUser?.isActive === false && !selectedUser?.isDeleted && (
                <div className="chat-user-subtitle">Account deactivated</div>
              )}
              {selectedChatType !== 'group' && !isSelfChat && !isRecipientUnavailable && (
                <div className={`chat-user-status ${onlineUsers.includes(selectedChat) ? 'online' : 'offline'}`}>
                  {onlineUsers.includes(selectedChat) ? 'Online' : 'Offline'}
                </div>
              )}
            </div>
          </div>
          <button
            className="btn-chat-settings"
            onClick={() => mutedConversations.includes(selectedChat) ? onUnmute(selectedChat, selectedChatType === 'group') : onMute(selectedChat, selectedChatType === 'group')}
            title={mutedConversations.includes(selectedChat) ? 'Unmute' : 'Mute'}
          >
            {mutedConversations.includes(selectedChat) ? '🔔' : '🔕'}
          </button>
        </header>
      )}
      <MessageList
        selectedChat={selectedChat}
        messages={messages}
        groupMessagesBySender={groupMessagesBySender}
        loadingMessages={loadingMessages}
        isTyping={isTyping}
        selectedUser={selectedUser}
        currentUser={currentUser}
        currentTheme={currentTheme}
        chatContainerRef={chatContainerRef}
        editingMessageId={editingMessageId}
        editMessageText={editMessageText}
        onEditMessageTextChange={onEditMessageTextChange}
        onSaveEdit={onSaveEdit}
        onCancelEdit={onCancelEdit}
        openMessageMenu={openMessageMenu}
        setOpenMessageMenu={setOpenMessageMenu}
        onReply={onReply}
        onReact={onReact}
        onRemoveReaction={onRemoveReaction}
        onEdit={onEditMessage}
        onDelete={onDeleteMessage}
      />
      <Composer
        selectedChat={selectedChat}
        message={message}
        onMessageChange={onMessageChange}
        onSendMessage={onSendMessage}
        selectedFile={selectedFile}
        onFileSelect={onFileSelect}
        onRemoveFile={onRemoveFile}
        fileInputRef={fileInputRef}
        textareaRef={textareaRef}
        uploadingFile={uploadingFile}
        uploadProgress={uploadProgress}
        selectedGif={selectedGif}
        onRemoveGif={onRemoveGif}
        contentWarning={contentWarning}
        onContentWarningChange={onContentWarningChange}
        showContentWarning={showContentWarning}
        onToggleContentWarning={onToggleContentWarning}
        showVoiceRecorder={showVoiceRecorder}
        onToggleVoiceRecorder={onToggleVoiceRecorder}
        replyingTo={replyingTo}
        onCancelReply={onCancelReply}
        isRecipientUnavailable={isRecipientUnavailable}
        recipientUnavailableReason={recipientUnavailableReason}
      />
    </section>
  );
}


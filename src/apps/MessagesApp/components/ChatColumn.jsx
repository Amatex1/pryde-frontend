/**
 * ChatColumn — Chat Area Container
 * Extracted from: src/pages/Messages.jsx lines 1862-2357
 */

import React from 'react';
import { ArrowLeft, StickyNote, User, Bell, BellOff, Info } from 'lucide-react';
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
  onScroll,
  showNewMessageIndicator,
  onDismissIndicator,
  onBack,
  onMute,
  onUnmute,
  onToggleInfoPanel,
  lastReadMessageId,
  onUpdateLastRead,
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
  onRecordingComplete,
  showGifPicker,
  onToggleGifPicker,
  onGifSelect,
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
  const isGroupChat = selectedChatType === 'group';
  const isMuted = mutedConversations.includes(selectedChat);
  const isOnline = !isGroupChat && !isSelfChat && onlineUsers.includes(selectedChat);
  const username = !isGroupChat && !isSelfChat && !selectedUser?.isDeleted ? getUsername(selectedUser) : '';

  let chatTitle = 'Conversation';
  if (isGroupChat) {
    chatTitle = selectedGroup?.name || 'Group Chat';
  } else if (isSelfChat) {
    chatTitle = 'Notes to self';
  } else if (selectedUser?.isDeleted) {
    chatTitle = 'Unknown User';
  } else {
    chatTitle = getDisplayName(selectedUser);
  }

  let chatSubtitle = '';
  if (isGroupChat) {
    const memberCount = selectedGroup?.members?.length || 0;
    chatSubtitle = memberCount > 0 ? `${memberCount} member${memberCount === 1 ? '' : 's'}` : 'Group chat';
  } else if (isSelfChat) {
    chatSubtitle = 'Private notes and reminders';
  } else if (selectedUser?.isDeleted) {
    chatSubtitle = 'Profile unavailable';
  } else if (selectedUser?.isActive === false) {
    chatSubtitle = 'Account deactivated';
  } else {
    const metaParts = [];
    if (username) {
      metaParts.push(username.startsWith('@') ? username : `@${username}`);
    }
    if (!isRecipientUnavailable) {
      metaParts.push(isOnline ? 'Online' : 'Offline');
    }
    if (isMuted) {
      metaParts.push('Muted');
    }
    chatSubtitle = metaParts.join(' • ');
  }

  return (
    <section className="messages-app__chat">
      {selectedChat && (
        <header className="messages-app__chat-header">
          <button className="mobile-back-btn" onClick={onBack} aria-label="Back"><ArrowLeft size={20} strokeWidth={1.75} aria-hidden="true" /></button>
          <div className="chat-user">
            <div className="chat-avatar">
              {selectedChatType === 'group' ? (
                <span>{selectedGroup?.name?.charAt(0).toUpperCase() || 'G'}</span>
              ) : isSelfChat ? (
                selectedUser?.profilePhoto ? (
                  <img src={getImageUrl(selectedUser.profilePhoto)} alt="Notes to self" />
                ) : (<span><StickyNote size={18} strokeWidth={1.75} aria-hidden="true" /></span>)
              ) : selectedUser?.isDeleted ? (
                <span><User size={18} strokeWidth={1.75} aria-hidden="true" /></span>
              ) : selectedUser?.profilePhoto ? (
                <img src={getImageUrl(selectedUser.profilePhoto)} alt={getDisplayName(selectedUser)} />
              ) : (<span>{getDisplayNameInitial(selectedUser)}</span>)}
            </div>
            <div className="chat-user-info">
              <div className="chat-user-name">
                <span className="display-name">{chatTitle}</span>
              </div>
              {chatSubtitle && (
                <div className={`chat-user-meta ${isOnline ? 'online' : ''}`}>
                  {chatSubtitle}
                </div>
              )}
            </div>
          </div>
          <div className="chat-header-actions">
            <button
              className="btn-chat-info"
              onClick={onToggleInfoPanel}
              title="Conversation details"
              aria-label="Conversation details"
            >
              <Info size={18} strokeWidth={1.75} aria-hidden="true" />
            </button>
            <button
              className="btn-chat-settings"
              onClick={() => isMuted ? onUnmute(selectedChat, isGroupChat) : onMute(selectedChat, isGroupChat)}
              title={isMuted ? 'Unmute conversation' : 'Mute conversation'}
              aria-label={isMuted ? 'Unmute conversation' : 'Mute conversation'}
              aria-pressed={isMuted}
            >
              {isMuted
                ? <Bell size={18} strokeWidth={1.75} aria-hidden="true" />
                : <BellOff size={18} strokeWidth={1.75} aria-hidden="true" />}
            </button>
          </div>
        </header>
      )}
      <MessageList
        selectedChat={selectedChat}
        selectedChatType={selectedChatType}
        messages={messages}
        groupMessagesBySender={groupMessagesBySender}
        loadingMessages={loadingMessages}
        isTyping={isTyping}
        selectedUser={selectedUser}
        isSelfChat={isSelfChat}
        currentUser={currentUser}
        currentTheme={currentTheme}
        chatContainerRef={chatContainerRef}
        onScroll={onScroll}
        showNewMessageIndicator={showNewMessageIndicator}
        onDismissIndicator={onDismissIndicator}
        lastReadMessageId={lastReadMessageId}
        onUpdateLastRead={onUpdateLastRead}
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
        onRecordingComplete={onRecordingComplete}
        showGifPicker={showGifPicker}
        onToggleGifPicker={onToggleGifPicker}
        onGifSelect={onGifSelect}
        replyingTo={replyingTo}
        onCancelReply={onCancelReply}
        isRecipientUnavailable={isRecipientUnavailable}
        recipientUnavailableReason={recipientUnavailableReason}
      />
    </section>
  );
}


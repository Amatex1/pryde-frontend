/**
 * MessagesApp — Root Component
 *
 * Messenger-style application surface with fixed viewport and 3-column layout.
 * Extracted from: src/pages/Messages.jsx
 */

import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { useOutletContext } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import CustomModal from '../../components/CustomModal';
import MessageSearch from '../../components/MessageSearch';
import ThreadList from './components/ThreadList';
import ChatColumn from './components/ChatColumn';
import InfoPanel from './components/InfoPanel';
import { useModal } from '../../hooks/useModal';
import { useOnlineUsers } from '../../hooks/useOnlineUsers';
import { useAuth } from '../../context/AuthContext';
import { useOptimisticMessages } from './hooks/useOptimisticMessages';
import { useChatSelection } from './hooks/useChatSelection';
import { useConversations } from './hooks/useConversations';
import { useMessages } from './hooks/useMessages';
import { useMessageSocket } from './hooks/useMessageSocket';
import api from '../../utils/api';
import { getImageUrl } from '../../utils/imageUrl';
import { getDisplayName, getDisplayNameInitial, getUsername } from '../../utils/getDisplayName';
import { emitTyping, getSocket, isSocketConnected, sendMessage as socketSendMessage } from '../../utils/socket';
import { compressImage } from '../../utils/compressImage';
import { uploadWithProgress } from '../../utils/uploadWithProgress';
import { saveDraft, loadDraft, clearDraft } from '../../utils/draftStore';
import logger from '../../utils/logger';
import { quietCopy } from '../../config/uiCopy';
import './MessagesApp.css';

const EmojiPicker = lazy(() => import('../../components/EmojiPicker'));
const VoiceRecorder = lazy(() => import('../../components/VoiceRecorder'));

export default function MessagesApp() {
  const { modalState, closeModal, showAlert, showConfirm } = useModal();
  const { onlineUsers, isUserOnline } = useOnlineUsers();
  const { user: currentUser, authReady } = useAuth();
  const { onMenuOpen } = useOutletContext() || {};

  // Chat selection
  const {
    selectedChat,
    setSelectedChat,
    selectedChatType,
    setSelectedChatType,
  } = useChatSelection({ currentUser });

  // Selected user/group info
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isRecipientUnavailable, setIsRecipientUnavailable] = useState(false);
  const [recipientUnavailableReason, setRecipientUnavailableReason] = useState('');

  // Conversations
  const {
    conversations,
    setConversations,
    groupChats,
    setGroupChats,
    loading,
    filteredConversations,
    activeTab,
    setActiveTab,
    conversationFilter,
    setConversationFilter,
    archivedConversations,
    setArchivedConversations,
    mutedConversations,
    setMutedConversations,
    fetchConversations,
  } = useConversations({ authReady, currentUser });

  // Messages
  const {
    messages,
    setMessages,
    loadingMessages,
    groupMessagesBySender,
    chatContainerRef,
  } = useMessages({
    selectedChat,
    selectedChatType,
    currentUser,
    fetchConversations,
    setSelectedUser,
    setSelectedGroup,
    setIsRecipientUnavailable,
    setRecipientUnavailableReason,
  });

  // Optimistic messages
  const {
    isTempId,
    clearOptimisticTimeout,
    scheduleOptimisticRollback,
  } = useOptimisticMessages({ showAlert, setMessages });

  // Socket handlers
  const { isTyping, setIsTyping } = useMessageSocket({
    selectedChat,
    currentUser,
    setMessages,
    setConversations,
    clearOptimisticTimeout,
  });

  // Composer state
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedGif, setSelectedGif] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [contentWarning, setContentWarning] = useState('');
  const [showContentWarning, setShowContentWarning] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // UI state
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [friends, setFriends] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openMessageMenu, setOpenMessageMenu] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editMessageText, setEditMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactingToMessage, setReactingToMessage] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteMessageId, setDeleteMessageId] = useState(null);
  const [deleteIsSender, setDeleteIsSender] = useState(false);

  // Theme
  const [currentTheme, setCurrentTheme] = useState(document.documentElement.getAttribute('data-theme') || 'light');
  const [quietMode, setQuietMode] = useState(document.documentElement.getAttribute('data-quiet') === 'true');

  // Mobile view state
  const mobileView = selectedChat ? 'chat' : 'threads';

  // Restore message draft when chat changes
  useEffect(() => {
    if (selectedChat) {
      const draftKey = `message-${selectedChatType}-${selectedChat}`;
      const localDraft = loadDraft(draftKey);
      if (localDraft) {
        setMessage(localDraft);
      } else {
        setMessage('');
      }
    }
  }, [selectedChat, selectedChatType]);

  // Reset textarea height when message is cleared
  useEffect(() => {
    if (!message && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [message]);

  const handleTyping = (e) => {
    setMessage(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;

    if (selectedChat && e.target.value) {
      const draftKey = `message-${selectedChatType}-${selectedChat}`;
      saveDraft(draftKey, e.target.value);
    }

    if (!selectedChat || !currentUser) return;
    emitTyping(selectedChat, currentUser._id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(selectedChat, currentUser._id);
    }, 1000);
  };

  const handleSendMessage = async (e, voiceNote = null) => {
    if (e) e.preventDefault();
    if ((!message.trim() && !selectedFile && !selectedGif && !voiceNote) || !selectedChat) return;

    const attachmentUrl = selectedGif || selectedFile?.url;
    const messageContent = message.trim();
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const optimisticMessage = {
      _id: tempId,
      sender: {
        _id: currentUser?._id,
        username: currentUser?.username,
        profilePhoto: currentUser?.profilePhoto
      },
      recipient: { _id: selectedChat },
      content: messageContent,
      attachment: attachmentUrl || null,
      contentWarning: contentWarning || null,
      createdAt: new Date().toISOString(),
      _isOptimistic: true
    };

    try {
      if (selectedChatType === 'group') {
        const response = await api.post('/messages', {
          groupChatId: selectedChat,
          content: messageContent,
          attachment: attachmentUrl,
          voiceNote: voiceNote,
          contentWarning: contentWarning
        });
        setMessages((prev) => [...prev, response.data]);
      } else {
        const socket = getSocket();
        const socketConnected = socket && isSocketConnected();

        setMessages((prev) => [...prev, optimisticMessage]);
        scheduleOptimisticRollback(tempId, 45000);

        if (socketConnected) {
          socketSendMessage({
            recipientId: selectedChat,
            content: messageContent,
            attachment: attachmentUrl,
            voiceNote: voiceNote,
            contentWarning: contentWarning,
            _tempId: tempId
          }, (ackResponse) => {
            if (ackResponse?.success) {
              clearOptimisticTimeout(tempId);
            }
          });
        } else {
          const response = await api.post('/messages', {
            recipient: selectedChat,
            content: messageContent,
            attachment: attachmentUrl,
            voiceNote: voiceNote,
            contentWarning: contentWarning
          });
          clearOptimisticTimeout(tempId);
          setMessages((prev) => prev.map(m => m._id === tempId ? response.data : m));
        }
      }

      const draftKey = `message-${selectedChatType}-${selectedChat}`;
      clearDraft(draftKey);
      setMessage('');
      setSelectedFile(null);
      setSelectedGif(null);
      setContentWarning('');
      setShowContentWarning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (currentUser) emitTyping(selectedChat, currentUser._id);
    } catch (error) {
      logger.error('Error sending message:', error);
      clearOptimisticTimeout(tempId);
      setMessages((prev) => prev.filter(m => m._id !== tempId));
      showAlert('Failed to send message', 'Send Failed');
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg'];
    if (!validTypes.includes(file.type)) {
      showAlert('Please select only images or videos', 'Invalid File Type');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showAlert('File size must be less than 10MB', 'File Too Large');
      return;
    }

    setUploadingFile(true);
    setUploadProgress(0);
    try {
      let finalFile = file;
      if (file.type.startsWith('image/')) {
        try {
          finalFile = await compressImage(file, { maxWidth: 1920, maxHeight: 1920, quality: 0.85 });
        } catch (error) {
          logger.warn('Image compression failed, using original:', error);
        }
      }
      const response = await uploadWithProgress({
        url: `${api.defaults.baseURL}/upload/chat-attachment`,
        file: finalFile,
        fieldName: 'file',
        onProgress: (percent) => setUploadProgress(percent)
      });
      setSelectedFile({ url: response.url, name: file.name, type: file.type });
    } catch (error) {
      logger.error('File upload failed:', error);
      showAlert(error.message || 'Failed to upload file', 'Upload Failed');
    } finally {
      setUploadingFile(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Conversation management
  const handleArchiveConversation = async (userId, isGroup = false) => {
    try {
      await api.post(isGroup ? `/groupchats/${userId}/archive` : `/messages/conversations/${userId}/archive`);
      setArchivedConversations(prev => [...prev, userId]);
      setOpenDropdown(null);
      fetchConversations();
    } catch (error) {
      logger.error('Failed to archive:', error);
    }
  };

  const handleUnarchiveConversation = async (userId, isGroup = false) => {
    try {
      await api.post(isGroup ? `/groupchats/${userId}/unarchive` : `/messages/conversations/${userId}/unarchive`);
      setArchivedConversations(prev => prev.filter(id => id !== userId));
      fetchConversations();
    } catch (error) {
      logger.error('Failed to unarchive:', error);
    }
  };

  const handleMuteConversation = async (userId, isGroup = false) => {
    try {
      await api.post(isGroup ? `/groupchats/${userId}/mute` : `/messages/conversations/${userId}/mute`);
      setMutedConversations(prev => [...prev, userId]);
      setOpenDropdown(null);
    } catch (error) {
      logger.error('Failed to mute:', error);
    }
  };

  const handleUnmuteConversation = async (userId, isGroup = false) => {
    try {
      await api.post(isGroup ? `/groupchats/${userId}/unmute` : `/messages/conversations/${userId}/unmute`);
      setMutedConversations(prev => prev.filter(id => id !== userId));
    } catch (error) {
      logger.error('Failed to unmute:', error);
    }
  };

  const handleMarkAsUnread = async (userId) => {
    try {
      await api.post(`/messages/conversations/${userId}/mark-unread`);
      setOpenDropdown(null);
      fetchConversations();
    } catch (error) {
      logger.error('Failed to mark as unread:', error);
    }
  };

  const handleDeleteConversation = async (userId) => {
    const confirmed = await showConfirm('Delete this conversation?', 'Delete Conversation', 'Delete', 'Cancel');
    if (!confirmed) return;
    try {
      await api.delete(`/messages/conversations/${userId}`);
      setOpenDropdown(null);
      if (selectedChat === userId) {
        setSelectedChat(null);
        setSelectedChatType(null);
      }
      fetchConversations();
    } catch (error) {
      logger.error('Failed to delete:', error);
      showAlert('Failed to delete conversation', 'Delete Failed');
    }
  };

  const handleBlockUser = async (userId) => {
    const confirmed = await showConfirm('Block this user?', 'Block User', 'Block', 'Cancel');
    if (!confirmed) return;
    try {
      await api.post('/blocks', { blockedUserId: userId });
      setOpenDropdown(null);
      if (selectedChat === userId) {
        setSelectedChat(null);
        setSelectedChatType(null);
      }
      fetchConversations();
      showAlert('User blocked', 'User Blocked');
    } catch (error) {
      logger.error('Failed to block:', error);
      showAlert('Failed to block user', 'Block Failed');
    }
  };

  // Message actions
  const handleEditMessage = (messageId, content) => {
    setEditingMessageId(messageId);
    const draftKey = `edit-message-${messageId}`;
    setEditMessageText(loadDraft(draftKey) || content);
  };

  const handleSaveEditMessage = async (messageId) => {
    if (!editMessageText.trim()) return;
    if (isTempId(messageId)) {
      showAlert('Please wait for the message to be sent', 'Message Pending');
      return;
    }
    try {
      const response = await api.put(`/messages/${messageId}`, { content: editMessageText });
      setMessages(prev => prev.map(msg => msg._id === messageId ? response.data : msg));
      clearDraft(`edit-message-${messageId}`);
      setEditingMessageId(null);
      setEditMessageText('');
    } catch (error) {
      logger.error('Error editing:', error);
      showAlert('Failed to edit message', 'Edit Failed');
    }
  };

  const handleCancelEdit = () => {
    if (editingMessageId) clearDraft(`edit-message-${editingMessageId}`);
    setEditingMessageId(null);
    setEditMessageText('');
  };

  const openDeleteModal = (messageId, isSender) => {
    setDeleteMessageId(messageId);
    setDeleteIsSender(isSender);
    setDeleteModalOpen(true);
  };

  const handleDeleteMessage = async (deleteForAll = false) => {
    if (!deleteMessageId) return;
    if (isTempId(deleteMessageId)) {
      setMessages(prev => prev.filter(msg => msg._id !== deleteMessageId));
      clearOptimisticTimeout(deleteMessageId);
      setDeleteModalOpen(false);
      setDeleteMessageId(null);
      return;
    }
    try {
      await api.delete(`/messages/${deleteMessageId}${deleteForAll ? '?deleteForAll=true' : ''}`);
      if (deleteForAll) {
        setMessages(prev => prev.map(msg => msg._id === deleteMessageId ? { ...msg, isDeleted: true, content: '', attachment: null } : msg));
      } else {
        setMessages(prev => prev.filter(msg => msg._id !== deleteMessageId));
      }
      setDeleteModalOpen(false);
      setDeleteMessageId(null);
    } catch (error) {
      logger.error('Error deleting:', error);
      showAlert('Failed to delete message', 'Delete Failed');
    }
  };

  const handleReactToMessage = (messageId) => {
    if (isTempId(messageId)) {
      showAlert('Please wait for the message to be sent', 'Message Pending');
      return;
    }
    setReactingToMessage(messageId);
    setShowEmojiPicker(true);
  };

  const handleEmojiSelect = async (emoji) => {
    if (!reactingToMessage || isTempId(reactingToMessage)) {
      setShowEmojiPicker(false);
      setReactingToMessage(null);
      return;
    }
    try {
      const response = await api.post(`/messages/${reactingToMessage}/react`, { emoji });
      setMessages(prev => prev.map(msg => msg._id === reactingToMessage ? response.data : msg));
    } catch (error) {
      logger.error('Error adding reaction:', error);
    }
  };

  const handleRemoveReaction = async (messageId, emoji) => {
    if (isTempId(messageId)) return;
    try {
      const response = await api.delete(`/messages/${messageId}/react`, { data: { emoji } });
      setMessages(prev => prev.map(msg => msg._id === messageId ? response.data : msg));
    } catch (error) {
      logger.error('Error removing reaction:', error);
    }
  };

  // New chat modal
  const fetchFriends = async () => {
    try {
      const response = await api.get('/friends');
      setFriends(response.data);
    } catch (error) {
      logger.error('Failed to fetch friends:', error);
    }
  };

  const handleSearchUsers = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const response = await api.get(`/users/search?q=${searchQuery}`);
      setSearchResults(response.data);
    } catch (error) {
      logger.error('Search failed:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleStartChat = (userId) => {
    setSelectedChat(userId);
    setSelectedChatType('user');
    setShowNewChatModal(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleOpenNewChatModal = () => {
    setShowNewChatModal(true);
    fetchFriends();
  };

  const handleBackToThreads = () => {
    setSelectedChat(null);
    setSelectedChatType(null);
  };

  return (
    <div className="messages-app" data-view={mobileView} data-theme={currentTheme}>
      <Navbar onMenuClick={onMenuOpen} />

      <div className="messages-app__layout">
        <ThreadList
          conversations={filteredConversations}
          groupChats={groupChats}
          loading={loading}
          selectedChat={selectedChat}
          selectedChatType={selectedChatType}
          onSelectChat={(id, type) => {
            setSelectedChat(id);
            setSelectedChatType(type);
          }}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          conversationFilter={conversationFilter}
          onFilterChange={setConversationFilter}
          onNewChat={handleOpenNewChatModal}
          currentUser={currentUser}
          onlineUsers={onlineUsers}
          mutedConversations={mutedConversations}
          archivedConversations={archivedConversations}
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
          onArchive={handleArchiveConversation}
          onUnarchive={handleUnarchiveConversation}
          onMute={handleMuteConversation}
          onUnmute={handleUnmuteConversation}
          onMarkAsUnread={handleMarkAsUnread}
          onDelete={handleDeleteConversation}
          onBlock={handleBlockUser}
          quietMode={quietMode}
        />

        <ChatColumn
          selectedChat={selectedChat}
          selectedChatType={selectedChatType}
          selectedUser={selectedUser}
          selectedGroup={selectedGroup}
          messages={messages}
          groupMessagesBySender={groupMessagesBySender}
          loadingMessages={loadingMessages}
          isTyping={isTyping}
          currentUser={currentUser}
          currentTheme={currentTheme}
          onlineUsers={onlineUsers}
          mutedConversations={mutedConversations}
          isRecipientUnavailable={isRecipientUnavailable}
          recipientUnavailableReason={recipientUnavailableReason}
          chatContainerRef={chatContainerRef}
          onBack={handleBackToThreads}
          onMute={handleMuteConversation}
          onUnmute={handleUnmuteConversation}
          // Composer props
          message={message}
          onMessageChange={handleTyping}
          onSendMessage={handleSendMessage}
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
          onRemoveFile={handleRemoveFile}
          fileInputRef={fileInputRef}
          textareaRef={textareaRef}
          uploadingFile={uploadingFile}
          uploadProgress={uploadProgress}
          selectedGif={selectedGif}
          onRemoveGif={() => setSelectedGif(null)}
          contentWarning={contentWarning}
          onContentWarningChange={setContentWarning}
          showContentWarning={showContentWarning}
          onToggleContentWarning={() => setShowContentWarning(!showContentWarning)}
          showVoiceRecorder={showVoiceRecorder}
          onToggleVoiceRecorder={() => setShowVoiceRecorder(!showVoiceRecorder)}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          // Message actions
          editingMessageId={editingMessageId}
          editMessageText={editMessageText}
          onEditMessageTextChange={setEditMessageText}
          onEditMessage={handleEditMessage}
          onSaveEdit={handleSaveEditMessage}
          onCancelEdit={handleCancelEdit}
          openMessageMenu={openMessageMenu}
          setOpenMessageMenu={setOpenMessageMenu}
          onReply={(msg) => setReplyingTo(msg)}
          onReact={handleReactToMessage}
          onRemoveReaction={handleRemoveReaction}
          onDeleteMessage={openDeleteModal}
        />

        <InfoPanel
          selectedChat={selectedChat}
          selectedUser={selectedUser}
          selectedGroup={selectedGroup}
          selectedChatType={selectedChatType}
          onlineUsers={onlineUsers}
        />
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="modal-overlay" onClick={() => setShowNewChatModal(false)}>
          <div className="modal-content glossy" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Message</h2>
              <button className="btn-close" onClick={() => setShowNewChatModal(false)}>×</button>
            </div>
            <form onSubmit={handleSearchUsers} className="search-form">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for users..."
                className="search-input glossy"
                autoFocus
              />
              <button type="submit" disabled={searchLoading} className="btn-search glossy-gold">
                {searchLoading ? 'Searching...' : 'Search'}
              </button>
            </form>
            <div className="search-results">
              {searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <div key={user._id} className="user-result" onClick={() => handleStartChat(user._id)}>
                    <div className="user-avatar">
                      {user.profilePhoto ? (
                        <img src={getImageUrl(user.profilePhoto)} alt={getDisplayName(user)} />
                      ) : (
                        <span>{getDisplayNameInitial(user)}</span>
                      )}
                    </div>
                    <div className="user-info">
                      <div className="user-name">{getDisplayName(user)}</div>
                      <div className="user-username">@{user.username}</div>
                    </div>
                  </div>
                ))
              ) : searchQuery && !searchLoading ? (
                <div className="no-results">No users found</div>
              ) : friends.length > 0 ? (
                <>
                  <div className="friends-list-header">Your Friends</div>
                  {friends.map((friend) => (
                    <div
                      key={friend._id}
                      className={`user-result ${friend.isActive === false ? 'deactivated-user' : ''}`}
                      onClick={() => friend.isActive !== false && handleStartChat(friend._id)}
                    >
                      <div className="user-avatar">
                        {friend.isActive === false ? (
                          <span>?</span>
                        ) : friend.profilePhoto ? (
                          <img src={getImageUrl(friend.profilePhoto)} alt={getDisplayName(friend)} />
                        ) : (
                          <span>{getDisplayNameInitial(friend)}</span>
                        )}
                      </div>
                      <div className="user-info">
                        <div className="user-name">{getDisplayName(friend)}</div>
                        <div className="user-username">@{friend.username}</div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="no-results">No friends yet</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <Suspense fallback={<div className="loading-spinner">Loading...</div>}>
          <EmojiPicker
            onEmojiSelect={handleEmojiSelect}
            onClose={() => { setShowEmojiPicker(false); setReactingToMessage(null); }}
          />
        </Suspense>
      )}

      {/* Voice Recorder */}
      {showVoiceRecorder && (
        <Suspense fallback={<div className="loading-spinner">Loading...</div>}>
          <VoiceRecorder
            onRecordingComplete={async (audioBlob, duration) => {
              try {
                const formData = new FormData();
                formData.append('audio', audioBlob, 'voice-note.webm');
                formData.append('duration', duration);
                const uploadResponse = await api.post('/upload/voice-note', formData, {
                  headers: { 'Content-Type': 'multipart/form-data' }
                });
                await handleSendMessage(null, { url: uploadResponse.data.url, duration });
                setShowVoiceRecorder(false);
              } catch (error) {
                logger.error('Failed to send voice note:', error);
                showAlert('Failed to send voice note', 'Voice Note Failed');
              }
            }}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        </Suspense>
      )}

      {/* Delete Message Modal */}
      {deleteModalOpen && (
        <div className="modal-overlay" onClick={() => setDeleteModalOpen(false)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Message</h3>
            <p>How would you like to delete this message?</p>
            <div className="delete-modal-actions">
              {deleteIsSender && (
                <button className="btn-delete-for-all" onClick={() => handleDeleteMessage(true)}>
                  🗑️ Delete for everyone
                </button>
              )}
              <button className="btn-delete-for-me" onClick={() => handleDeleteMessage(false)}>
                👤 Delete for me
              </button>
              <button className="btn-cancel" onClick={() => setDeleteModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <CustomModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        placeholder={modalState.placeholder}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        onConfirm={modalState.onConfirm}
        inputType={modalState.inputType}
        defaultValue={modalState.defaultValue}
      />
    </div>
  );
}


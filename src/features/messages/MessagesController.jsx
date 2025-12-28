/**
 * MessagesController - Orchestrates Messages feature
 * 
 * RESPONSIBILITIES:
 * - Manage all messaging state
 * - Handle data fetching and socket events
 * - Coordinate between ConversationList, MessageThread, MessageComposer
 * - Provide handlers to child components
 * 
 * RULES:
 * - NO layout logic (widths, grids, media queries)
 * - NO direct rendering of layout containers
 * - Delegates layout to MessagesLayout
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../api/axios';
import ConversationList from './ConversationList';
import MessageThread from './MessageThread';
import MessageComposer from './MessageComposer';
import MessagesLayout from '../../layouts/MessagesLayout';
import './MessagesController.css';

export default function MessagesController() {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const { user: currentUser } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const messagesEndRef = useRef(null);

  // Conversation list state
  const [conversations, setConversations] = useState([]);
  const [groupChats, setGroupChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [conversationFilter, setConversationFilter] = useState('');
  const [archivedConversations, setArchivedConversations] = useState([]);
  const [mutedConversations, setMutedConversations] = useState([]);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Selected chat state
  const [selectedChatId, setSelectedChatId] = useState(chatId || null);
  const [selectedChatType, setSelectedChatType] = useState('user');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Messages state
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editMessageText, setEditMessageText] = useState('');

  // Composer state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showContentWarning, setShowContentWarning] = useState(false);
  const [contentWarningText, setContentWarningText] = useState('');

  // Recipient availability
  const [isRecipientUnavailable, setIsRecipientUnavailable] = useState(false);
  const [recipientUnavailableReason, setRecipientUnavailableReason] = useState('');

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch messages when chat changes
  useEffect(() => {
    if (selectedChatId) {
      fetchMessages(selectedChatId, selectedChatType);
    }
  }, [selectedChatId, selectedChatType]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      if (message.conversationId === selectedChatId || 
          message.sender._id === selectedChatId ||
          message.recipient === selectedChatId) {
        setMessages(prev => [...prev, message]);
      }
      // Update conversation list
      fetchConversations();
    };

    const handleTyping = ({ userId }) => {
      if (userId === selectedChatId) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('typing', handleTyping);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('typing', handleTyping);
    };
  }, [socket, selectedChatId]);

  // API calls
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/messages/conversations');
      setConversations(response.data.conversations || []);
      setGroupChats(response.data.groupChats || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId, chatType) => {
    try {
      const endpoint = chatType === 'group' 
        ? `/messages/group/${chatId}`
        : `/messages/${chatId}`;
      const response = await api.get(endpoint);
      setMessages(response.data.messages || []);
      
      // Set selected user/group info
      if (chatType === 'user') {
        const conv = conversations.find(c => c._id === chatId);
        const otherUser = conv?.participants?.find(p => p._id !== currentUser?._id);
        setSelectedUser(otherUser || conv?.participants?.[0]);
      } else {
        const group = groupChats.find(g => g._id === chatId);
        setSelectedGroup(group);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() && !isRecording) return;

    try {
      const payload = {
        content: messageText,
        recipientId: selectedChatId,
        replyTo: replyingTo?._id,
        contentWarning: showContentWarning ? contentWarningText : undefined,
      };

      const endpoint = selectedChatType === 'group'
        ? `/messages/group/${selectedChatId}`
        : '/messages';

      await api.post(endpoint, payload);
      
      setMessageText('');
      setReplyingTo(null);
      setShowContentWarning(false);
      setContentWarningText('');
      fetchMessages(selectedChatId, selectedChatType);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handlers
  const handleSelectChat = (chatId, chatType = 'user') => {
    setSelectedChatId(chatId);
    setSelectedChatType(chatType);
    setOpenDropdownId(null);
    navigate(`/messages/${chatId}`);
  };

  const handleBack = () => {
    setSelectedChatId(null);
    setSelectedUser(null);
    setSelectedGroup(null);
    navigate('/messages');
  };

  const handleArchive = async (convId) => {
    setArchivedConversations(prev => [...prev, convId]);
    setOpenDropdownId(null);
  };

  const handleUnarchive = (convId) => {
    setArchivedConversations(prev => prev.filter(id => id !== convId));
    setOpenDropdownId(null);
  };

  const handleMute = (convId) => {
    setMutedConversations(prev => [...prev, convId]);
    setOpenDropdownId(null);
  };

  const handleUnmute = (convId) => {
    setMutedConversations(prev => prev.filter(id => id !== convId));
    setOpenDropdownId(null);
  };

  const handleMarkAsUnread = (convId) => {
    setConversations(prev => prev.map(c =>
      c._id === convId ? { ...c, manuallyUnread: true } : c
    ));
    setOpenDropdownId(null);
  };

  const handleDeleteChat = async (convId) => {
    try {
      await api.delete(`/messages/conversation/${convId}`);
      fetchConversations();
      if (selectedChatId === convId) {
        handleBack();
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
    setOpenDropdownId(null);
  };

  const handleBlockUser = async (userId) => {
    try {
      await api.post(`/users/${userId}/block`);
      fetchConversations();
    } catch (error) {
      console.error('Error blocking user:', error);
    }
    setOpenDropdownId(null);
  };

  const handleReply = (message) => {
    setReplyingTo(message);
  };

  const handleReact = async (messageId) => {
    setShowEmojiPicker(true);
  };

  const handleEdit = (messageId, content) => {
    setEditingMessageId(messageId);
    setEditMessageText(content);
  };

  const handleSaveEdit = async (messageId) => {
    try {
      await api.patch(`/messages/${messageId}`, { content: editMessageText });
      setEditingMessageId(null);
      setEditMessageText('');
      fetchMessages(selectedChatId, selectedChatType);
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditMessageText('');
  };

  const handleDelete = async (messageId) => {
    try {
      await api.delete(`/messages/${messageId}`);
      fetchMessages(selectedChatId, selectedChatType);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleRemoveReaction = async (messageId, emoji) => {
    try {
      await api.delete(`/messages/${messageId}/reactions`, { data: { emoji } });
      fetchMessages(selectedChatId, selectedChatType);
    } catch (error) {
      console.error('Error removing reaction:', error);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessageText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleNewChat = () => {
    navigate('/messages/new');
  };

  const handleToggleMute = () => {
    if (mutedConversations.includes(selectedChatId)) {
      handleUnmute(selectedChatId);
    } else {
      handleMute(selectedChatId);
    }
  };

  // Render components
  const conversationListComponent = (
    <ConversationList
      conversations={conversations}
      groupChats={groupChats}
      currentUser={currentUser}
      onlineUsers={onlineUsers}
      selectedChatId={selectedChatId}
      selectedChatType={selectedChatType}
      activeTab={activeTab}
      loading={loading}
      archivedConversations={archivedConversations}
      mutedConversations={mutedConversations}
      conversationFilter={conversationFilter}
      openDropdownId={openDropdownId}
      onSelectChat={handleSelectChat}
      onTabChange={setActiveTab}
      onFilterChange={setConversationFilter}
      onNewChat={handleNewChat}
      onArchive={handleArchive}
      onUnarchive={handleUnarchive}
      onMute={handleMute}
      onUnmute={handleUnmute}
      onMarkAsUnread={handleMarkAsUnread}
      onDeleteChat={handleDeleteChat}
      onBlockUser={handleBlockUser}
      onToggleDropdown={setOpenDropdownId}
    />
  );

  const messageThreadComponent = selectedChatId ? (
    <MessageThread
      messages={messages}
      currentUser={currentUser}
      selectedUser={selectedUser}
      selectedGroup={selectedGroup}
      selectedChatType={selectedChatType}
      onlineUsers={onlineUsers}
      mutedConversations={mutedConversations}
      selectedChatId={selectedChatId}
      isTyping={isTyping}
      isRecipientUnavailable={isRecipientUnavailable}
      recipientUnavailableReason={recipientUnavailableReason}
      editingMessageId={editingMessageId}
      editMessageText={editMessageText}
      onBack={handleBack}
      onReply={handleReply}
      onReact={handleReact}
      onEdit={handleEdit}
      onSaveEdit={handleSaveEdit}
      onCancelEdit={handleCancelEdit}
      onDelete={handleDelete}
      onRemoveReaction={handleRemoveReaction}
      onEditTextChange={setEditMessageText}
      onToggleMute={handleToggleMute}
      messagesEndRef={messagesEndRef}
    />
  ) : null;

  const messageComposerComponent = selectedChatId ? (
    <MessageComposer
      messageText={messageText}
      replyingTo={replyingTo}
      isRecording={isRecording}
      recordingTime={recordingTime}
      showEmojiPicker={showEmojiPicker}
      showContentWarning={showContentWarning}
      contentWarningText={contentWarningText}
      isRecipientUnavailable={isRecipientUnavailable}
      recipientUnavailableReason={recipientUnavailableReason}
      onMessageChange={setMessageText}
      onSend={sendMessage}
      onCancelReply={() => setReplyingTo(null)}
      onStartRecording={() => setIsRecording(true)}
      onStopRecording={() => setIsRecording(false)}
      onCancelRecording={() => { setIsRecording(false); setRecordingTime(0); }}
      onToggleEmojiPicker={() => setShowEmojiPicker(prev => !prev)}
      onEmojiSelect={handleEmojiSelect}
      onToggleContentWarning={() => setShowContentWarning(prev => !prev)}
      onContentWarningChange={setContentWarningText}
      onKeyDown={handleKeyDown}
    />
  ) : null;

  return (
    <MessagesLayout
      conversationList={conversationListComponent}
      messageThread={messageThreadComponent}
      messageComposer={messageComposerComponent}
      hasActiveChat={!!selectedChatId}
    />
  );
}

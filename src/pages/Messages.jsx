import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import Navbar from '../components/Navbar';
import EmojiPicker from '../components/EmojiPicker';
import GifPicker from '../components/GifPicker';
import CustomModal from '../components/CustomModal';
import MessageSearch from '../components/MessageSearch';
import VoiceRecorder from '../components/VoiceRecorder';
import AudioPlayer from '../components/AudioPlayer';
import { useModal } from '../hooks/useModal';
import { useOnlineUsers } from '../hooks/useOnlineUsers';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { getImageUrl } from '../utils/imageUrl';
import { getUserChatColor, getSentMessageColor } from '../utils/chatColors';
import logger from '../utils/logger';
import { sanitizeMessage } from '../utils/sanitize';
import { getDisplayName, getDisplayNameInitial, getUsername } from '../utils/getDisplayName';
import {
  onNewMessage,
  onMessageSent,
  sendMessage as socketSendMessage,
  emitTyping,
  onUserTyping,
  isSocketConnected,
  getSocket
} from '../utils/socket';
import { setupSocketListeners } from '../utils/socketHelpers';
import { compressImage } from '../utils/compressImage';
import { uploadWithProgress } from '../utils/uploadWithProgress';
import { saveDraft, loadDraft, clearDraft } from '../utils/draftStore';
import { withOptimisticUpdate } from '../utils/consistencyGuard';
import { quietCopy } from '../config/uiCopy';
import './Messages.css';
import '../styles/themes/messages.css';

function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { modalState, closeModal, showAlert, showConfirm } = useModal();
  const { onlineUsers, isUserOnline } = useOnlineUsers();
  const { user: currentUser, authReady } = useAuth(); // Use centralized auth context
  // Get menu handler from AppLayout outlet context
  const { onMenuOpen } = useOutletContext() || {};

  // Don't restore selected chat on mobile - always show conversation list first
  const [selectedChat, setSelectedChat] = useState(() => {
    // Only restore on desktop (width > 768px)
    if (window.innerWidth > 768) {
      const saved = localStorage.getItem('selectedChat');
      return saved || null;
    }
    return null;
  });
  const [selectedChatType, setSelectedChatType] = useState(() => {
    if (window.innerWidth > 768) {
      const saved = localStorage.getItem('selectedChatType');
      return saved || 'user';
    }
    return 'user';
  });
  const [selectedUser, setSelectedUser] = useState(null); // Store selected user info
  const [selectedGroup, setSelectedGroup] = useState(null); // Store selected group info
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState([]);
  const [groupChats, setGroupChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [conversationFilter, setConversationFilter] = useState(''); // Filter conversations by name
  const [friends, setFriends] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactingToMessage, setReactingToMessage] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editMessageText, setEditMessageText] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'unread' or 'archived'
  const [replyingTo, setReplyingTo] = useState(null); // Message being replied to
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // Track which dropdown is open
  const [archivedConversations, setArchivedConversations] = useState([]);
  const [mutedConversations, setMutedConversations] = useState([]);
  const [currentTheme, setCurrentTheme] = useState(document.documentElement.getAttribute('data-theme') || 'light');
  const [quietMode, setQuietMode] = useState(document.documentElement.getAttribute('data-quiet') === 'true');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [selectedGif, setSelectedGif] = useState(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [contentWarning, setContentWarning] = useState('');
  const [showContentWarning, setShowContentWarning] = useState(false);
  const [isRecipientUnavailable, setIsRecipientUnavailable] = useState(false);
  const [recipientUnavailableReason, setRecipientUnavailableReason] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Helper function to format date headers
  const formatDateHeader = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time to midnight for comparison
    const messageDateMidnight = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayMidnight = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (messageDateMidnight.getTime() === todayMidnight.getTime()) {
      return 'Today';
    } else if (messageDateMidnight.getTime() === yesterdayMidnight.getTime()) {
      return 'Yesterday';
    } else {
      // Format as "Monday, January 15, 2024"
      return messageDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  // Helper function to check if we need a date header
  const shouldShowDateHeader = (currentMsg, previousMsg) => {
    if (!previousMsg) return true; // Always show header for first message

    const currentDate = new Date(currentMsg.createdAt);
    const previousDate = new Date(previousMsg.createdAt);

    // Compare dates (ignoring time)
    return currentDate.toDateString() !== previousDate.toDateString();
  };

  // Listen for theme and quiet mode changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const theme = document.documentElement.getAttribute('data-theme') || 'light';
      const quiet = document.documentElement.getAttribute('data-quiet') === 'true';
      setCurrentTheme(theme);
      setQuietMode(quiet);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-quiet']
    });

    return () => observer.disconnect();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openDropdown && !e.target.closest('.conv-actions')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdown]);

  // Save selected chat to localStorage whenever it changes
  useEffect(() => {
    if (selectedChat) {
      localStorage.setItem('selectedChat', selectedChat);
      localStorage.setItem('selectedChatType', selectedChatType);
    }
  }, [selectedChat, selectedChatType]);

  // Log socket connection status on mount and periodically check
  useEffect(() => {
    const checkSocket = () => {
      const socket = getSocket();
      const connected = isSocketConnected();
      logger.debug('🔌 Socket status check:', {
        exists: !!socket,
        connected,
        socketId: socket?.id
      });

      if (!socket) {
        logger.error('❌ Socket instance not found! Messages will not work in real-time.');
      } else if (!connected) {
        logger.warn('⚠️ Socket exists but not connected. Waiting for connection...');
      } else {
        logger.debug('✅ Socket connected and ready');
      }
    };

    // Check immediately
    checkSocket();

    // Check every 5 seconds for the first minute
    const interval = setInterval(checkSocket, 5000);
    const timeout = setTimeout(() => clearInterval(interval), 60000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // Check for chat parameter in URL and open that chat
  useEffect(() => {
    const chatId = searchParams.get('chat');
    if (chatId) {
      // Handle "Notes to self" - use current user's ID
      const actualChatId = chatId === 'self' ? currentUser?._id : chatId;
      if (actualChatId) {
        setSelectedChat(actualChatId);
        setSelectedChatType('user');
      }
      // Remove the parameter from URL after opening the chat
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, currentUser]);

  // Define fetchConversations outside useEffect so it can be reused
  const fetchConversations = async () => {
    try {
      const [messagesRes, groupsRes] = await Promise.all([
        api.get('/messages'),
        api.get('/groupChats')
      ]);
      // Sort conversations by lastMessage timestamp (most recent first)
      const sortedConversations = [...messagesRes.data].sort((a, b) => {
        const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      setConversations(sortedConversations);
      setGroupChats(groupsRes.data);
      setLoading(false);
    } catch (error) {
      logger.error('Error fetching conversations:', error);
      setLoading(false);
    }
  };

  // Fetch conversations and group chats on mount
  useEffect(() => {
    // 🔒 AUTH GUARD: Wait for auth to be ready before making API calls
    if (!authReady) {
      logger.debug('[Messages] Waiting for auth to be ready...');
      return;
    }

    fetchConversations();
  }, [authReady]);

  // Fetch messages and user/group info for selected chat
  useEffect(() => {
    if (selectedChat) {
      const fetchMessages = async () => {
        try {
          setLoadingMessages(true);
          const endpoint = selectedChatType === 'group'
            ? `/messages/group/${selectedChat}`
            : `/messages/${selectedChat}`;
          logger.debug('📥 Fetching messages from:', endpoint);
          const response = await api.get(endpoint);
          logger.debug('✅ Loaded messages:', response.data.length);
          setMessages(response.data);

          // Mark all unread messages as read and remove manual unread status
          if (selectedChatType === 'user') {
            const unreadMessages = response.data.filter(
              msg => msg.sender._id === selectedChat && !msg.read
            );

            for (const msg of unreadMessages) {
              try {
                await api.put(`/messages/${msg._id}/read`);
              } catch (error) {
                logger.error('Error marking message as read:', error);
              }
            }

            // Remove manual unread status
            try {
              await api.delete(`/messages/conversations/${selectedChat}/mark-unread`);
            } catch (error) {
              logger.error('Error removing manual unread status:', error);
            }

            // Refresh conversations to update unread counts
            if (unreadMessages.length > 0) {
              fetchConversations();
            }
          }
        } catch (error) {
          logger.error('Error fetching messages:', error);
        } finally {
          setLoadingMessages(false);
        }
      };

      const fetchChatInfo = async () => {
        try {
          // ✅ Clear previous chat info IMMEDIATELY when switching conversations
          setSelectedUser(null);
          setSelectedGroup(null);
          setIsRecipientUnavailable(false);
          setRecipientUnavailableReason('');

          if (selectedChatType === 'group') {
            const response = await api.get(`/groupchats/${selectedChat}`);
            setSelectedGroup(response.data);
          } else {
            const response = await api.get(`/users/${selectedChat}`);
            const user = response.data;
            setSelectedUser(user);

            // Check if recipient is unavailable for messaging
            const isDeleted = user.isDeleted === true;
            const isDeactivated = user.isActive === false;
            const hasBlocked = user.hasBlockedCurrentUser === true;

            if (isDeleted || isDeactivated || hasBlocked) {
              setIsRecipientUnavailable(true);
              if (isDeactivated) {
                setRecipientUnavailableReason("You can't message this account while it's deactivated.");
              } else {
                setRecipientUnavailableReason("You can't message this account.");
              }
            } else {
              setIsRecipientUnavailable(false);
              setRecipientUnavailableReason('');
            }
          }
        } catch (error) {
          // ✅ Handle 404 for deactivated/deleted users gracefully (expected case - don't log as error)
          if (error.response?.status === 404) {
            logger.debug('[Messages] User not found (404) - showing deactivated placeholder');
            // Set a generic placeholder user for deactivated/deleted accounts
            setSelectedUser({
              _id: selectedChat,
              username: 'Deactivated User',
              displayName: 'Deactivated User',
              profilePhoto: null, // Will show default avatar
              isDeleted: true
            });
            setIsRecipientUnavailable(true);
            setRecipientUnavailableReason("This account is no longer available.");
          } else {
            // Log actual errors (not 404s)
            logger.error('Error fetching chat info:', error);
            // ✅ Clear state on other errors
            setSelectedUser(null);
            setSelectedGroup(null);
          }
        }
      };

      // ✅ Clear messages and user info IMMEDIATELY when switching chats
      setMessages([]);
      setSelectedUser(null);
      setSelectedGroup(null);
      setMessage(''); // Clear input field
      setSelectedFile(null); // Clear any selected file
      setSelectedGif(null); // Clear any selected GIF
      setReplyingTo(null); // Clear reply state
      setLoadingMessages(true);

      fetchMessages();
      fetchChatInfo();
    } else {
      // ✅ Clear everything when no chat is selected
      setSelectedUser(null);
      setSelectedGroup(null);
      setMessages([]);
      setMessage('');
      setSelectedFile(null);
      setSelectedGif(null);
      setReplyingTo(null);
      setIsRecipientUnavailable(false);
      setRecipientUnavailableReason('');
      setLoadingMessages(false);
    }
  }, [selectedChat, selectedChatType]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Note: Online user presence is now managed by useOnlineUsers hook

  // Socket.IO listeners for messages and typing - depend on selectedChat
  useEffect(() => {
    // Ensure socket is connected before setting up listeners
    const setupListeners = (socket) => {
      logger.debug('🎧 Setting up message socket listeners for chat:', selectedChat);

      // Listen for new messages
      const cleanupNewMessage = onNewMessage((newMessage) => {
        logger.debug('📨 Received new_message event:', newMessage);

        // Check if this message is for the currently selected chat
        // Message is relevant if the sender is the selected chat OR the recipient is the selected chat
        const isRelevantMessage =
          selectedChat === newMessage.sender._id ||
          selectedChat === newMessage.recipient._id;

        if (isRelevantMessage) {
          logger.debug('✅ Message is for selected chat, adding to messages');
          setMessages((prev) => {
            // Prevent duplicates - check if message already exists
            if (prev.some(msg => msg._id === newMessage._id)) {
              logger.debug('⚠️ Message already exists, skipping');
              return prev;
            }
            return [...prev, newMessage];
          });
        }

        // Update conversations list - show the conversation with the OTHER person
        const otherPersonId = currentUser?._id === newMessage.sender._id
          ? newMessage.recipient._id
          : newMessage.sender._id;

        const otherPerson = currentUser?._id === newMessage.sender._id
          ? newMessage.recipient
          : newMessage.sender;

        setConversations((prev) => {
          const updated = prev.filter(c => c._id !== otherPersonId);
          return [{ _id: otherPersonId, lastMessage: newMessage, ...otherPerson }, ...updated];
        });
      });

      // Listen for sent message confirmation
      const cleanupMessageSent = onMessageSent((sentMessage) => {
        logger.debug('✅ Received message_sent event:', sentMessage);

        // Only add to messages if this is the selected chat
        if (selectedChat === sentMessage.recipient._id) {
          logger.debug('✅ Sent message is for selected chat, adding to messages');
          setMessages((prev) => {
            // Prevent duplicates - check if message already exists
            if (prev.some(msg => msg._id === sentMessage._id)) {
              logger.debug('⚠️ Message already exists, skipping');
              return prev;
            }
            return [...prev, sentMessage];
          });
        }

        // Update conversations list with the sent message
        setConversations((prev) => {
          const recipientId = sentMessage.recipient._id;
          const updated = prev.filter(c => c._id !== recipientId);
          return [{ _id: recipientId, lastMessage: sentMessage, ...sentMessage.recipient }, ...updated];
        });
      });

      // Listen for typing indicator
      const cleanupTyping = onUserTyping((data) => {
        if (data.userId === selectedChat) {
          setIsTyping(data.isTyping);
        }
      });

      // Return cleanup function
      return () => {
        cleanupNewMessage?.();
        cleanupMessageSent?.();
        cleanupTyping?.();
      };
    };

    // Use shared socket helper with retry logic (uses default 750ms interval)
    let messageCleanup = null;
    const cancelSocketRetry = setupSocketListeners((socket) => {
      messageCleanup = setupListeners(socket);
    });

    return () => {
      cancelSocketRetry();
      if (messageCleanup) {
        messageCleanup();
      }
    };
  }, [selectedChat, currentUser]);

  const handleSendMessage = async (e, voiceNote = null) => {
    if (e) e.preventDefault();
    if ((!message.trim() && !selectedFile && !selectedGif && !voiceNote) || !selectedChat) return;

    // Use GIF URL if selected, otherwise use file attachment
    const attachmentUrl = selectedGif || selectedFile?.url;

    logger.debug('📤 Sending message:', {
      recipientId: selectedChat,
      content: message,
      attachment: attachmentUrl,
      contentWarning: contentWarning,
      chatType: selectedChatType,
      socketConnected: isSocketConnected()
    });

    try {
      if (selectedChatType === 'group') {
        // Send group message via API
        const response = await api.post('/messages', {
          groupChatId: selectedChat,
          content: message,
          attachment: attachmentUrl,
          voiceNote: voiceNote,
          contentWarning: contentWarning
        });
        setMessages((prev) => [...prev, response.data]);
      } else {
        // Check if socket is connected
        const socket = getSocket();
        if (!socket) {
          logger.error('❌ Socket not initialized!');
          alert('Connection not established. Please refresh the page.');
          return;
        }

        if (!isSocketConnected()) {
          logger.error('❌ Socket not connected!');
          alert('Connection lost. Please refresh the page.');
          return;
        }

        // Send via Socket.IO for real-time delivery
        logger.debug('🔌 Emitting send_message via socket', {
          socketId: socket.id,
          recipientId: selectedChat,
          hasContent: !!message,
          hasAttachment: !!attachmentUrl
        });

        try {
          socketSendMessage({
            recipientId: selectedChat,
            content: message,
            attachment: attachmentUrl,
            voiceNote: voiceNote,
            contentWarning: contentWarning
          });
        } catch (error) {
          logger.error('❌ Error sending message via socket:', error);
          alert('Failed to send message. Please try again.');
          return;
        }
      }
      // Clear localStorage draft
      const draftKey = `message-${selectedChatType}-${selectedChat}`;
      clearDraft(draftKey);

      setMessage('');
      setSelectedFile(null);
      setSelectedGif(null);
      setContentWarning('');
      setShowContentWarning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Clear typing indicator
      if (currentUser) {
        emitTyping(selectedChat, currentUser._id);
      }
    } catch (error) {
      logger.error('❌ Error sending message:', error);
      alert('Failed to send message');
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg'];
    if (!validTypes.includes(file.type)) {
      showAlert('Please select only images (JPEG, PNG, GIF, WebP) or videos (MP4, WebM, OGG)', 'Invalid File Type');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      showAlert('File size must be less than 10MB', 'File Too Large');
      return;
    }

    setUploadingFile(true);
    setUploadProgress(0);
    try {
      // Compress image before upload
      let finalFile = file;
      if (file.type.startsWith('image/')) {
        try {
          finalFile = await compressImage(file, {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 0.85
          });
        } catch (error) {
          logger.warn('Image compression failed, using original:', error);
        }
      }

      // Upload with progress tracking
      const response = await uploadWithProgress({
        url: `${api.defaults.baseURL}/upload/chat-attachment`,
        file: finalFile,
        fieldName: 'file',
        onProgress: (percent) => {
          setUploadProgress(percent);
        }
      });

      setSelectedFile({ url: response.url, name: file.name, type: file.type });
    } catch (error) {
      logger.error('File upload failed:', error);

      // Extract user-friendly error message
      const errorMessage = error.message ||
                          'Failed to upload file. Please try again.';

      showAlert(errorMessage, 'Upload Failed');
    } finally {
      setUploadingFile(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);

    // Auto-grow textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;

    // Auto-save message draft
    if (selectedChat && e.target.value) {
      const draftKey = `message-${selectedChatType}-${selectedChat}`;
      saveDraft(draftKey, e.target.value);
    }

    if (!selectedChat || !currentUser) return;

    // Emit typing indicator
    emitTyping(selectedChat, currentUser._id);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(selectedChat, currentUser._id);
    }, 1000);
  };

  // Reset textarea height when message is cleared (after send)
  useEffect(() => {
    if (!message && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [message]);

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

  const handleEditMessage = (messageId, content) => {
    setEditingMessageId(messageId);

    // Try to restore draft first, otherwise use original content
    const draftKey = `edit-message-${messageId}`;
    const localDraft = loadDraft(draftKey);
    setEditMessageText(localDraft || content);
  };

  // Auto-save message edit draft
  useEffect(() => {
    if (editingMessageId && editMessageText) {
      const draftKey = `edit-message-${editingMessageId}`;
      saveDraft(draftKey, editMessageText);
    }
  }, [editMessageText, editingMessageId]);

  const handleSaveEditMessage = async (messageId) => {
    if (!editMessageText.trim()) return;

    try {
      const response = await api.put(`/messages/${messageId}`, {
        content: editMessageText
      });

      // Update the message in the list
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? response.data : msg))
      );

      // Clear localStorage draft
      const draftKey = `edit-message-${messageId}`;
      clearDraft(draftKey);

      setEditingMessageId(null);
      setEditMessageText('');
    } catch (error) {
      logger.error('❌ Error editing message:', error);
      showAlert('Failed to edit message. Please try again.', 'Edit Failed');
    }
  };

  const handleCancelEdit = () => {
    // Clear localStorage draft when canceling
    if (editingMessageId) {
      const draftKey = `edit-message-${editingMessageId}`;
      clearDraft(draftKey);
    }

    setEditingMessageId(null);
    setEditMessageText('');
  };

  const handleDeleteMessage = async (messageId) => {
    const confirmed = await showConfirm(
      'Are you sure you want to delete this message?',
      'Delete Message',
      'Delete',
      'Cancel'
    );
    if (!confirmed) return;

    try {
      await api.delete(`/messages/${messageId}`);

      // Remove the message from the list
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    } catch (error) {
      logger.error('❌ Error deleting message:', error);
      showAlert('Failed to delete message. Please try again.', 'Delete Failed');
    }
  };

  const handleReactToMessage = (messageId) => {
    setReactingToMessage(messageId);
    setShowEmojiPicker(true);
  };

  const handleEmojiSelect = async (emoji) => {
    if (!reactingToMessage) return;

    try {
      const response = await api.post(`/messages/${reactingToMessage}/react`, { emoji });

      // Update the message in the list with new reactions
      setMessages((prev) =>
        prev.map((msg) => (msg._id === reactingToMessage ? response.data : msg))
      );
    } catch (error) {
      logger.error('❌ Error adding reaction:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      }
    }
  };

  const handleRemoveReaction = async (messageId, emoji) => {
    try {
      const response = await api.delete(`/messages/${messageId}/react`, {
        data: { emoji }
      });

      // Update the message in the list
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? response.data : msg))
      );
    } catch (error) {
      logger.error('❌ Error removing reaction:', error);
    }
  };

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

  // Conversation management functions
  const handleArchiveConversation = async (userId, isGroup = false) => {
    try {
      const endpoint = isGroup
        ? `/groupchats/${userId}/archive`
        : `/messages/conversations/${userId}/archive`;

      await api.post(endpoint);

      // Add to archived list
      setArchivedConversations(prev => [...prev, userId]);

      // Close dropdown
      setOpenDropdown(null);

      // Refresh conversations
      fetchConversations();
    } catch (error) {
      logger.error('Failed to archive conversation:', error);
    }
  };

  const handleUnarchiveConversation = async (userId, isGroup = false) => {
    try {
      const endpoint = isGroup
        ? `/groupchats/${userId}/unarchive`
        : `/messages/conversations/${userId}/unarchive`;

      await api.post(endpoint);

      // Remove from archived list
      setArchivedConversations(prev => prev.filter(id => id !== userId));

      // Refresh conversations
      fetchConversations();
    } catch (error) {
      logger.error('Failed to unarchive conversation:', error);
    }
  };

  const handleMuteConversation = async (userId, isGroup = false, duration = null) => {
    try {
      const endpoint = isGroup
        ? `/groupchats/${userId}/mute`
        : `/messages/conversations/${userId}/mute`;

      await api.post(endpoint, { duration });

      // Add to muted list
      setMutedConversations(prev => [...prev, userId]);

      // Close dropdown
      setOpenDropdown(null);
    } catch (error) {
      logger.error('Failed to mute conversation:', error);
    }
  };

  const handleUnmuteConversation = async (userId, isGroup = false) => {
    try {
      const endpoint = isGroup
        ? `/groupchats/${userId}/unmute`
        : `/messages/conversations/${userId}/unmute`;

      await api.post(endpoint);

      // Remove from muted list
      setMutedConversations(prev => prev.filter(id => id !== userId));
    } catch (error) {
      logger.error('Failed to unmute conversation:', error);
    }
  };

  const handleMarkAsUnread = async (userId) => {
    try {
      await api.post(`/messages/conversations/${userId}/mark-unread`);

      // Close dropdown
      setOpenDropdown(null);

      // Refresh conversations
      fetchConversations();
    } catch (error) {
      logger.error('Failed to mark as unread:', error);
    }
  };

  const handleMarkAsRead = async (userId) => {
    try {
      await api.delete(`/messages/conversations/${userId}/mark-unread`);

      // Refresh conversations
      fetchConversations();
    } catch (error) {
      logger.error('Failed to mark as read:', error);
    }
  };

  const handleDeleteConversation = async (userId) => {
    const confirmed = await showConfirm(
      'Are you sure you want to delete this entire conversation? This cannot be undone.',
      'Delete Conversation',
      'Delete',
      'Cancel'
    );
    if (!confirmed) return;

    try {
      await api.delete(`/messages/conversations/${userId}`);

      // Close dropdown
      setOpenDropdown(null);

      // Clear selected chat if it was the deleted one
      if (selectedChat === userId) {
        setSelectedChat(null);
        setSelectedChatType(null);
      }

      // Refresh conversations
      fetchConversations();
    } catch (error) {
      logger.error('Failed to delete conversation:', error);
      showAlert('Failed to delete conversation. Please try again.', 'Delete Failed');
    }
  };

  const handleBlockUser = async (userId) => {
    const confirmed = await showConfirm(
      'Are you sure you want to block this user? They will not be able to message you or view your profile.',
      'Block User',
      'Block',
      'Cancel'
    );
    if (!confirmed) return;

    try {
      await api.post('/blocks', { blockedUserId: userId });

      // Close dropdown
      setOpenDropdown(null);

      // Clear selected chat
      if (selectedChat === userId) {
        setSelectedChat(null);
        setSelectedChatType(null);
      }

      // Refresh conversations
      fetchConversations();

      showAlert('User blocked successfully', 'User Blocked');
    } catch (error) {
      logger.error('Failed to block user:', error);
      showAlert('Failed to block user. Please try again.', 'Block Failed');
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim() || selectedMembers.length === 0) {
      alert('Please enter a group name and select at least one member');
      return;
    }

    try {
      const response = await api.post('/groupChats/create', {
        name: groupName,
        description: groupDescription,
        memberIds: selectedMembers
      });

      setGroupChats([response.data, ...groupChats]);
      setSelectedChat(response.data._id);
      setSelectedChatType('group');
      setShowNewGroupModal(false);
      setGroupName('');
      setGroupDescription('');
      setSelectedMembers([]);
      setSearchResults([]);
    } catch (error) {
      logger.error('Failed to create group:', error);
      alert('Failed to create group chat');
    }
  };

  const toggleMemberSelection = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  return (
    <div
      className="page-container messages-page"
      data-theme={currentTheme}
      data-quiet-mode={quietMode ? 'true' : 'false'}
    >
      <Navbar onMenuClick={onMenuOpen} />

      <div className="messages-container">
        <div className="messages-layout glossy fade-in">
          <div className={`conversations-sidebar ${selectedChat ? 'chat-active' : ''}`}>
            <div className="sidebar-header">
              <h2 className="sidebar-title">💬 Messages</h2>
              <div className="header-buttons">
                <button className="btn-new-chat" onClick={handleOpenNewChatModal} title="New Chat">💬</button>
                {/* Group chat hidden for Plan A - keeping backend for future */}
                {/* <button className="btn-new-chat" onClick={() => setShowNewGroupModal(true)} title="New Group">👥</button> */}
                <button className="btn-new-chat" onClick={() => setActiveTab('archived')} title="Archived">📦</button>
              </div>
            </div>

            {/* Conversation Filter */}
            <div className="message-search-container">
              <MessageSearch
                onSearch={setConversationFilter}
                placeholder="Filter by name..."
              />
            </div>

            {/* Tabs for All/Unread/Archived */}
            <div className="messages-tabs">
              <button
                className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All
              </button>
              <button
                className={`tab-button ${activeTab === 'unread' ? 'active' : ''}`}
                onClick={() => setActiveTab('unread')}
              >
                Unread
              </button>
              <button
                className={`tab-button ${activeTab === 'archived' ? 'active' : ''}`}
                onClick={() => setActiveTab('archived')}
              >
                Archived
              </button>
            </div>

            <div className="conversations-list">
              {loading ? (
                <div className="loading-state">Loading conversations...</div>
              ) : (
                <>
                  {/* Group Chats - Hidden for Plan A */}
                  {false && groupChats.length > 0 && (
                    <>
                      <div className="section-label">Groups</div>
                      {groupChats
                        .filter(group => {
                          const isArchived = archivedConversations.includes(group._id);
                          if (activeTab === 'archived') return isArchived;
                          return !isArchived; // Show non-archived in 'all' and 'unread' tabs
                        })
                        .map((group) => (
                        <div
                          key={group._id}
                          className={`conversation-item ${selectedChat === group._id && selectedChatType === 'group' ? 'active' : ''}`}
                        >
                          <div
                            className="conv-clickable"
                            onClick={() => {
                              setSelectedChat(group._id);
                              setSelectedChatType('group');
                              setShowMobileSidebar(false);
                            }}
                          >
                            <div className="conv-avatar group-avatar">
                              {group.avatar ? (
                                <img src={group.avatar} alt={group.name} />
                              ) : (
                                <span>👥</span>
                              )}
                            </div>
                            <div className="conv-info">
                              <div className="conv-header">
                                <div className="conv-name">{group.name}</div>
                                <div className="conv-time">
                                  {group.lastMessage ? new Date(group.updatedAt).toLocaleTimeString() : ''}
                                </div>
                              </div>
                              <div className="conv-last-message">
                                {mutedConversations.includes(group._id) && '🔕 '}
                                {group.members?.length || 0} members
                              </div>
                            </div>
                          </div>

                          {/* 3-dot dropdown menu for groups */}
                          <div className="conv-actions">
                            <button
                              className="btn-conv-menu"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdown(openDropdown === group._id ? null : group._id);
                              }}
                            >
                              ⋮
                            </button>

                            {openDropdown === group._id && (
                              <div className="conv-dropdown">
                                {activeTab === 'archived' ? (
                                  <button onClick={(e) => { e.stopPropagation(); handleUnarchiveConversation(group._id, true); }}>
                                    📤 Unarchive
                                  </button>
                                ) : (
                                  <button onClick={(e) => { e.stopPropagation(); handleArchiveConversation(group._id, true); }}>
                                    📦 Archive
                                  </button>
                                )}
                                {mutedConversations.includes(group._id) ? (
                                  <button onClick={(e) => { e.stopPropagation(); handleUnmuteConversation(group._id, true); }}>
                                    🔔 Unmute
                                  </button>
                                ) : (
                                  <button onClick={(e) => { e.stopPropagation(); handleMuteConversation(group._id, true); }}>
                                    🔕 Mute
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Direct Messages */}
                  {conversations.length > 0 && (
                    <>
                      <div className="section-label">Direct Messages</div>
                      {conversations
                        .filter(conv => {
                          // Tab filter (archived/unread/all)
                          const isArchived = archivedConversations.includes(conv._id);
                          if (activeTab === 'archived') return isArchived;
                          if (activeTab === 'unread') return !isArchived && (conv.unread > 0 || conv.manuallyUnread);
                          if (isArchived) return false; // 'all' tab shows non-archived

                          // Name filter - search by participant displayName or username
                          if (conversationFilter.trim()) {
                            const q = conversationFilter.toLowerCase();
                            const otherUser = conv.otherUser || (
                              conv.lastMessage?.sender?._id === currentUser?._id
                                ? conv.lastMessage?.recipient
                                : conv.lastMessage?.sender
                            );
                            const displayName = otherUser?.displayName || otherUser?.username || '';
                            const username = otherUser?.username || '';
                            return displayName.toLowerCase().includes(q) || username.toLowerCase().includes(q);
                          }

                          return true;
                        })
                        .map((conv) => {
                        // Use the otherUser field from backend, or fallback to lastMessage sender/recipient
                        const otherUser = conv.otherUser || (
                          conv.lastMessage?.sender?._id === currentUser?._id
                            ? conv.lastMessage?.recipient
                            : conv.lastMessage?.sender
                        );
                        // Detect self-chat (Notes to self)
                        const isSelfChat = otherUser?._id === currentUser?._id;

                        return (
                          <div
                            key={conv._id}
                            className={`conversation-item ${selectedChat === otherUser?._id && selectedChatType === 'user' ? 'active' : ''} ${conv.manuallyUnread ? 'manually-unread' : ''} ${conv.unread > 0 ? 'has-unread' : ''}`}
                          >
                            <div
                              className="conv-clickable"
                              onClick={() => {
                                setSelectedChat(otherUser?._id);
                                setSelectedChatType('user');
                                setShowMobileSidebar(false);
                              }}
                            >
                              <div className="conv-avatar">
                                {otherUser?.profilePhoto ? (
                                  <img src={getImageUrl(otherUser.profilePhoto)} alt={isSelfChat ? 'Notes to self' : getDisplayName(otherUser)} />
                                ) : (
                                  <span>{isSelfChat ? '📝' : getDisplayNameInitial(otherUser)}</span>
                                )}
                                {/* Unread indicator (red dot) */}
                                {conv.unread > 0 && (
                                  <span className="unread-indicator"></span>
                                )}
                                {/* Online status dot - hide for self-chat */}
                                {!isSelfChat && onlineUsers.includes(conv._id) && (
                                  <span className="status-dot online"></span>
                                )}
                              </div>
                              <div className="conv-info">
                                <div className="conv-header">
                                  <div className="conv-name">{isSelfChat ? '📝 Notes to self' : getDisplayName(otherUser)}</div>
                                  <div className="conv-time">
                                    {conv.lastMessage?.createdAt ? new Date(conv.lastMessage.createdAt).toLocaleTimeString() : ''}
                                  </div>
                                </div>
                                {/* Show @username for others, not for self-chat */}
                                {!isSelfChat && getUsername(otherUser) && (
                                  <div className="conv-username">{getUsername(otherUser)}</div>
                                )}
                                <div className="conv-last-message">
                                  {mutedConversations.includes(conv._id) && '🔕 '}
                                  {conv.lastMessage?.voiceNote?.url ? '🎤 Voice note' : (conv.lastMessage?.content || 'No messages')}
                                </div>
                              </div>
                              {conv.unread > 0 && (
                                <div className="unread-badge">{conv.unread}</div>
                              )}
                            </div>

                            {/* 3-dot dropdown menu */}
                            <div className="conv-actions">
                              <button
                                className="btn-conv-menu"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdown(openDropdown === conv._id ? null : conv._id);
                                }}
                              >
                                ⋮
                              </button>

                              {openDropdown === conv._id && (
                                <div className="conv-dropdown">
                                  {activeTab !== 'archived' && (
                                    <button onClick={(e) => { e.stopPropagation(); handleMarkAsUnread(conv._id); }}>
                                      📧 Mark as Unread
                                    </button>
                                  )}
                                  {activeTab === 'archived' ? (
                                    <button onClick={(e) => { e.stopPropagation(); handleUnarchiveConversation(conv._id); }}>
                                      📤 Unarchive
                                    </button>
                                  ) : (
                                    <button onClick={(e) => { e.stopPropagation(); handleArchiveConversation(conv._id); }}>
                                      📦 Archive
                                    </button>
                                  )}
                                  {mutedConversations.includes(conv._id) ? (
                                    <button onClick={(e) => { e.stopPropagation(); handleUnmuteConversation(conv._id); }}>
                                      🔔 Unmute
                                    </button>
                                  ) : (
                                    <button onClick={(e) => { e.stopPropagation(); handleMuteConversation(conv._id); }}>
                                      🔕 Mute
                                    </button>
                                  )}
                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv._id); }}>
                                    🗑️ Delete
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleBlockUser(otherUser?._id); }}
                                    className="danger"
                                  >
                                    🚫 Block User
                                  </button>
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
          </div>

          <div className={`chat-area ${selectedChat ? 'active' : ''}`}>
            {selectedChat ? (
              <>
                <div className="chat-header" key={`${selectedChat}-${selectedChatType}`}>
                  {/* Mobile Back Button */}
                  <button
                    className="mobile-back-btn"
                    onClick={() => {
                      setSelectedChat(null);
                      setSelectedChatType(null);
                    }}
                    aria-label="Back to conversations"
                  >
                    ← Back
                  </button>
                  <div className="chat-user">
                    {/* Self-DM detection for visual adjustments */}
                    {(() => {
                      const isSelfChat = selectedUser?._id === currentUser?._id;
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
                              {/* Show @username inline next to display name */}
                              {selectedChatType !== 'group' && !isSelfChat && !selectedUser?.isDeleted && getUsername(selectedUser) && (
                                <span className="username">@{getUsername(selectedUser)}</span>
                              )}
                              {mutedConversations.includes(selectedChat) && <span className="muted-indicator">🔕</span>}
                            </div>
                            {/* Show account status subtitle */}
                            {selectedChatType !== 'group' && !isSelfChat && selectedUser?.isActive === false && !selectedUser?.isDeleted && (
                              <div className="chat-user-subtitle" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                Account deactivated
                              </div>
                            )}
                            {/* Hide online status for self-DMs and unavailable users */}
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

                  {/* Chat Settings Button */}
                  <button
                    className="btn-chat-settings"
                    onClick={() => {
                      if (mutedConversations.includes(selectedChat)) {
                        handleUnmuteConversation(selectedChat, selectedChatType === 'group');
                      } else {
                        handleMuteConversation(selectedChat, selectedChatType === 'group');
                      }
                    }}
                    title={mutedConversations.includes(selectedChat) ? 'Unmute notifications' : 'Mute notifications'}
                  >
                    {mutedConversations.includes(selectedChat) ? '🔔' : '🔕'}
                  </button>
                </div>

                <div className="chat-messages">
                  {!currentUser ? (
                    <div className="loading-messages">Loading messages...</div>
                  ) : loadingMessages ? (
                    <div className="loading-messages">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="empty-chat-state">
                      <div className="empty-chat-icon">💬</div>
                      <p>No messages yet</p>
                      <p className="empty-chat-hint">Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isSent = msg.sender._id === currentUser._id;
                    const isEditing = editingMessageId === msg._id;
                    const previousMsg = index > 0 ? messages[index - 1] : null;
                    const showDateHeader = shouldShowDateHeader(msg, previousMsg);

                    return (
                      <React.Fragment key={msg._id}>
                        {/* Date Header */}
                        {showDateHeader && (
                          <div className="message-date-header">
                            <span>{formatDateHeader(msg.createdAt)}</span>
                          </div>
                        )}

                        <div className={`message-group ${isSent ? 'sent' : 'received'}`}>
                        <div className="message-content">
                          {/* Show sender name and avatar above message bubble */}
                          <div className="message-header">
                            <div className="message-avatar-small">
                              {msg.sender.profilePhoto ? (
                                <img src={getImageUrl(msg.sender.profilePhoto)} alt={getDisplayName(msg.sender)} />
                              ) : (
                                <span>{getDisplayNameInitial(msg.sender)}</span>
                              )}
                            </div>
                            <div className="message-sender-name">{getDisplayName(msg.sender)}</div>
                          </div>

                          {isEditing ? (
                            <div className="message-edit-box">
                              <input
                                type="text"
                                value={editMessageText}
                                onChange={(e) => setEditMessageText(e.target.value)}
                                className="message-edit-input"
                                autoFocus
                              />
                              <div className="message-edit-actions">
                                <button onClick={() => handleSaveEditMessage(msg._id)} className="btn-save-edit">
                                  ✓
                                </button>
                                <button onClick={handleCancelEdit} className="btn-cancel-edit">
                                  ✕
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div
                                className="message-bubble"
                                style={
                                  isSent
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
                                {sanitizeMessage(msg.content)}

                                {/* Voice Note Player */}
                                {msg.voiceNote?.url && (
                                  <AudioPlayer
                                    url={getImageUrl(msg.voiceNote.url)}
                                    duration={msg.voiceNote.duration}
                                  />
                                )}

                                {/* Display reactions */}
                                {msg.reactions && msg.reactions.length > 0 && (
                                  <div className="message-reactions">
                                    {Object.entries(
                                      msg.reactions.reduce((acc, reaction) => {
                                        acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                                        return acc;
                                      }, {})
                                    ).map(([emoji, count]) => {
                                      const userReacted = msg.reactions.some(
                                        r => r.emoji === emoji && r.user._id === currentUser?._id
                                      );
                                      return (
                                        <button
                                          key={emoji}
                                          className={`reaction-badge ${userReacted ? 'user-reacted' : ''}`}
                                          onClick={() => userReacted ? handleRemoveReaction(msg._id, emoji) : null}
                                          title={userReacted ? 'Click to remove' : ''}
                                        >
                                          {emoji} {count}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              <div className="message-meta">
                                <div className="message-time">
                                  {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                </div>
                                {msg.edited && <div className="message-edited-indicator">(edited)</div>}
                              </div>

                              <div className="message-actions">
                                <button
                                  onClick={() => setReplyingTo(msg)}
                                  className="btn-message-action"
                                  title="Reply to message"
                                >
                                  ↩️
                                </button>
                                <button
                                  onClick={() => handleReactToMessage(msg._id)}
                                  className="btn-message-action"
                                  title="React to message"
                                >
                                  😊
                                </button>
                                {isSent && (
                                  <>
                                    <button
                                      onClick={() => handleEditMessage(msg._id, msg.content)}
                                      className="btn-message-action"
                                      title="Edit message"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      onClick={() => handleDeleteMessage(msg._id)}
                                      className="btn-message-action"
                                      title="Delete message"
                                    >
                                      🗑️
                                    </button>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      </React.Fragment>
                    );
                  })
                  )}
                  {isTyping && (
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="chat-input-area">
                  {showContentWarning && (
                    <div className="content-warning-input">
                      <select
                        value={contentWarning}
                        onChange={(e) => setContentWarning(e.target.value)}
                        className="cw-input glossy"
                      >
                        <option value="">Select a content warning...</option>
                        <option value="Mental Health">Mental Health</option>
                        <option value="Violence">Violence</option>
                        <option value="Sexual Content">Sexual Content</option>
                        <option value="Substance Use">Substance Use</option>
                        <option value="Self-Harm">Self-Harm</option>
                        <option value="Death/Grief">Death/Grief</option>
                        <option value="Eating Disorders">Eating Disorders</option>
                        <option value="Abuse">Abuse</option>
                        <option value="Discrimination">Discrimination</option>
                        <option value="Medical Content">Medical Content</option>
                        <option value="Spoilers">Spoilers</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  )}
                  {replyingTo && (
                    <div className="reply-preview">
                      <div className="reply-preview-content">
                        <div className="reply-preview-label">Replying to {getDisplayName(replyingTo.sender)}</div>
                        <div className="reply-preview-text">{replyingTo.content}</div>
                      </div>
                      <button
                        type="button"
                        className="btn-cancel-reply"
                        onClick={() => setReplyingTo(null)}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  {selectedFile && (
                    <div className="file-preview">
                      <div className="file-preview-content">
                        {selectedFile.type.startsWith('image/') ? (
                          <img src={getImageUrl(selectedFile.url)} alt="Preview" className="file-preview-image" />
                        ) : (
                          <div className="file-preview-icon">🎥</div>
                        )}
                        <span className="file-preview-name">{selectedFile.name}</span>
                      </div>
                      <button
                        type="button"
                        className="btn-cancel-reply"
                        onClick={handleRemoveFile}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  {selectedGif && (
                    <div className="file-preview">
                      <div className="file-preview-content">
                        <img src={selectedGif} alt="Selected GIF" className="file-preview-image" />
                      </div>
                      <button
                        type="button"
                        className="btn-cancel-reply"
                        onClick={() => setSelectedGif(null)}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  <div className="message-composer">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*,video/*"
                      style={{ display: 'none' }}
                    />
                    {/* Attachment buttons - left side */}
                    <div className="composer-actions-left">
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFile || selectedGif || isRecipientUnavailable}
                        title={uploadingFile ? `Uploading... ${uploadProgress}%` : "Attach file"}
                      >
                        {uploadingFile ? `${uploadProgress}%` : '📎'}
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => setShowGifPicker(!showGifPicker)}
                        disabled={selectedFile || isRecipientUnavailable}
                        title="Add GIF"
                      >
                        GIF
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                        disabled={selectedFile || selectedGif || isRecipientUnavailable}
                        title="Record voice note"
                      >
                        🎤
                      </button>
                      <button
                        type="button"
                        className={`icon-btn ${showContentWarning ? 'active' : ''}`}
                        onClick={() => setShowContentWarning(!showContentWarning)}
                        disabled={isRecipientUnavailable}
                        title="Add content warning"
                      >
                        ⚠️
                      </button>
                    </div>
                    {/* Auto-growing textarea */}
                    <textarea
                      ref={textareaRef}
                      rows="1"
                      value={message}
                      onChange={handleTyping}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder={isRecipientUnavailable ? recipientUnavailableReason : (replyingTo ? "Type your reply..." : (selectedGif || selectedFile ? "Add a caption (optional)..." : "Type a message..."))}
                      className="message-input"
                      disabled={isRecipientUnavailable}
                    />
                    {/* Send button - right side */}
                    <button
                      type="submit"
                      className="send-btn"
                      disabled={uploadingFile || isRecipientUnavailable || (!message.trim() && !selectedFile && !selectedGif)}
                    >
                      Send
                    </button>
                  </div>
                  {/* DEPRECATED: GifPicker removed 2025-12-26 */}
                  {showVoiceRecorder && (
                    <VoiceRecorder
                      onRecordingComplete={async (audioBlob, duration) => {
                        try {
                          // Upload voice note using the voice-note endpoint
                          const formData = new FormData();
                          formData.append('audio', audioBlob, 'voice-note.webm');
                          formData.append('duration', duration);

                          const uploadResponse = await api.post('/upload/voice-note', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                          });

                          // Send message with voice note
                          const voiceNoteData = {
                            url: uploadResponse.data.url,
                            duration: duration
                          };

                          await handleSendMessage(null, voiceNoteData);
                          setShowVoiceRecorder(false);
                        } catch (error) {
                          logger.error('Failed to send voice note:', error);
                          showAlert('Failed to send voice note. Please try again.', 'Voice Note Failed');
                        }
                      }}
                      onCancel={() => setShowVoiceRecorder(false)}
                    />
                  )}
                </form>
              </>
            ) : (
              <div className="no-chat-selected">
                <h3>Select a conversation</h3>
                <p>Choose a conversation from the sidebar to start messaging</p>
              </div>
            )}
          </div>
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
                  // Show search results
                  searchResults.map((user) => (
                    <div
                      key={user._id}
                      className="user-result"
                      onClick={() => handleStartChat(user._id)}
                    >
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
                  // Show friends list when no search query
                  <>
                    <div className="friends-list-header">Your Friends</div>
                    {friends.map((friend) => (
                      <div
                        key={friend._id}
                        className={`user-result ${friend.isActive === false ? 'deactivated-user' : ''}`}
                        onClick={() => {
                          if (friend.isActive === false) {
                            alert('You cannot message this user. Their account has been deactivated.');
                          } else {
                            handleStartChat(friend._id);
                          }
                        }}
                        style={{ cursor: friend.isActive === false ? 'not-allowed' : 'pointer' }}
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
                          <div className={`user-name ${friend.isActive === false ? 'deactivated-text' : ''}`}>
                            {getDisplayName(friend)}
                          </div>
                          <div className={`user-username ${friend.isActive === false ? 'deactivated-text' : ''}`}>
                            @{friend.username}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="no-results">No friends yet. Search for users to start chatting!</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* New Group Modal - Hidden for Plan A */}
        {false && showNewGroupModal && (
          <div className="modal-overlay" onClick={() => setShowNewGroupModal(false)}>
            <div className="modal-content glossy" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Create Group Chat</h2>
                <button className="btn-close" onClick={() => setShowNewGroupModal(false)}>×</button>
              </div>

              <form onSubmit={handleCreateGroup} className="group-form">
                <div className="form-group">
                  <label>Group Name *</label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name..."
                    className="search-input glossy"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description (optional)</label>
                  <textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    placeholder="Enter group description..."
                    className="search-input glossy"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Search and Add Members *</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value.trim()) {
                        handleSearchUsers(e);
                      }
                    }}
                    placeholder="Search for users..."
                    className="search-input glossy"
                  />
                </div>

                {selectedMembers.length > 0 && (
                  <div className="selected-members">
                    <label>Selected Members ({selectedMembers.length})</label>
                    <div className="members-chips">
                      {searchResults.filter(u => selectedMembers.includes(u._id)).map(user => (
                        <div key={user._id} className="member-chip">
                          {getDisplayName(user)}
                          <button type="button" onClick={() => toggleMemberSelection(user._id)}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="search-results">
                  {searchResults.length > 0 ? (
                    searchResults.map((user) => (
                      <div
                        key={user._id}
                        className={`user-result ${selectedMembers.includes(user._id) ? 'selected' : ''}`}
                        onClick={() => toggleMemberSelection(user._id)}
                      >
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
                        {selectedMembers.includes(user._id) && <span className="check-mark">✓</span>}
                      </div>
                    ))
                  ) : searchQuery && !searchLoading ? (
                    <div className="no-results">No users found</div>
                  ) : null}
                </div>

                <button type="submit" className="btn-create-group" disabled={!groupName.trim() || selectedMembers.length === 0}>
                  Create Group
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Emoji Picker Modal */}
        {showEmojiPicker && (
          <EmojiPicker
            onEmojiSelect={handleEmojiSelect}
            onClose={() => {
              setShowEmojiPicker(false);
              setReactingToMessage(null);
            }}
          />
        )}

        {/* GIF Picker Modal */}
        {showGifPicker && (
          <GifPicker
            onGifSelect={(gifUrl) => {
              setSelectedGif(gifUrl);
              setShowGifPicker(false);
            }}
            onClose={() => setShowGifPicker(false)}
          />
        )}

        {/* Custom Modal */}
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
    </div>
  );
}

export default Messages;

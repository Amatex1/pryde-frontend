import React, { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CustomModal from '../components/CustomModal';
import MessageSearch from '../components/MessageSearch';

// ⚡ PERFORMANCE: Lazy load heavy components to reduce initial bundle size
const EmojiPicker = lazy(() => import('../components/EmojiPicker'));
const GifPicker = lazy(() => import('../components/GifPicker'));
const VoiceRecorder = lazy(() => import('../components/VoiceRecorder'));
const AudioPlayer = lazy(() => import('../components/AudioPlayer'));
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
  isConnectionReady,
  getSocket
} from '../utils/socket';
import { setupSocketListeners } from '../utils/socketHelpers';
import { compressImage } from '../utils/compressImage';
import { uploadWithProgress } from '../utils/uploadWithProgress';
import { saveDraft, loadDraft, clearDraft } from '../utils/draftStore';
import { withOptimisticUpdate } from '../utils/consistencyGuard';
import { debounce } from '../utils/debounce';
import { quietCopy } from '../config/uiCopy';
import './Messages.css';
import '../styles/themes/messages.css';
import '../styles/messages-unified.css';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';
import TypingIndicator from '../components/TypingIndicator';

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
  const [debouncedFilter, setDebouncedFilter] = useState(''); // ⚡ PERFORMANCE: Debounced filter to reduce re-renders
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
  const [openMessageMenu, setOpenMessageMenu] = useState(null); // Track which message's action menu is open
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null); // 🔥 FIX: Ref to chat-messages container for reliable scrolling
  const lastScrolledChatRef = useRef(null); // 🔥 FIX: Track which chat we've scrolled for
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const optimisticTimeoutsRef = useRef(new Map()); // Track rollback timeouts for optimistic messages

  // ========================================
  // OPTIMISTIC MESSAGE LIFECYCLE HELPERS
  // ========================================

  /**
   * Check if a message ID is a temporary optimistic ID
   * @param {string} messageId - The message ID to check
   * @returns {boolean} - True if this is a temp ID
   */
  const isTempId = (messageId) => {
    return typeof messageId === 'string' && messageId.startsWith('temp_');
  };

  /**
   * Rollback an optimistic message after timeout
   * Called when server confirmation never arrives
   * @param {string} tempId - The temp ID to rollback
   */
  const rollbackOptimisticMessage = useCallback((tempId) => {
    console.warn(`⏰ Optimistic message timeout - rolling back: ${tempId}`);
    setMessages((prev) => {
      const hasMessage = prev.some(msg => msg._id === tempId);
      if (hasMessage) {
        console.warn(`🔄 Removing unconfirmed optimistic message: ${tempId}`);
        return prev.filter(msg => msg._id !== tempId);
      }
      return prev;
    });
    // Clean up the timeout reference
    optimisticTimeoutsRef.current.delete(tempId);
    // Show user feedback
    showAlert('Message failed to send. Please try again.', 'Send Failed');
  }, [showAlert]);

  /**
   * Clear the rollback timeout for an optimistic message
   * Called when message:sent confirmation arrives
   * @param {string} tempId - The temp ID to clear timeout for
   */
  const clearOptimisticTimeout = useCallback((tempId) => {
    const timeout = optimisticTimeoutsRef.current.get(tempId);
    if (timeout) {
      clearTimeout(timeout);
      optimisticTimeoutsRef.current.delete(tempId);
      console.log(`✅ Cleared rollback timeout for: ${tempId}`);
    }
  }, []);

  /**
   * Schedule a rollback for an optimistic message
   * @param {string} tempId - The temp ID to schedule rollback for
   * @param {number} timeoutMs - Timeout in milliseconds (default 15 seconds)
   */
  const scheduleOptimisticRollback = useCallback((tempId, timeoutMs = 15000) => {
    console.log(`⏱️ Scheduling rollback for ${tempId} in ${timeoutMs}ms`);
    const timeout = setTimeout(() => {
      rollbackOptimisticMessage(tempId);
    }, timeoutMs);
    optimisticTimeoutsRef.current.set(tempId, timeout);
  }, [rollbackOptimisticMessage]);

  // Cleanup all optimistic timeouts on unmount
  useEffect(() => {
    return () => {
      optimisticTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      optimisticTimeoutsRef.current.clear();
    };
  }, []);

  // Add/remove body class for iOS overscroll suppression
  useEffect(() => {
    document.body.classList.add('messages-open');
    return () => {
      document.body.classList.remove('messages-open');
    };
  }, []);

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

  /**
   * Group consecutive messages by sender for calm UI rhythm
   * Messages are grouped if:
   * - Same sender
   * - Within 4 minutes of each other
   * - Same date
   * Returns: Array of { senderId, senderInfo, messages: [...], isCurrentUser }
   */
  const groupMessagesBySender = useMemo(() => {
    if (!messages.length || !currentUser) return [];

    const groups = [];
    let currentGroup = null;

    messages.forEach((msg, index) => {
      const senderId = msg.sender._id;
      const isSent = senderId === currentUser._id;
      const previousMsg = index > 0 ? messages[index - 1] : null;

      // Check if this message should start a new group
      const shouldStartNewGroup = () => {
        if (!currentGroup) return true;
        if (currentGroup.senderId !== senderId) return true;
        if (shouldShowDateHeader(msg, previousMsg)) return true;

        // Check time gap (4 minutes = 240000ms)
        const timeDiff = new Date(msg.createdAt) - new Date(currentGroup.messages[currentGroup.messages.length - 1].createdAt);
        if (timeDiff > 240000) return true;

        return false;
      };

      if (shouldStartNewGroup()) {
        // Start a new group
        currentGroup = {
          senderId,
          senderInfo: msg.sender,
          messages: [msg],
          isCurrentUser: isSent,
          showDateHeader: shouldShowDateHeader(msg, previousMsg),
          dateHeader: formatDateHeader(msg.createdAt)
        };
        groups.push(currentGroup);
      } else {
        // Add to existing group
        currentGroup.messages.push(msg);
      }
    });

    return groups;
  }, [messages, currentUser]);

  // ⚡ PERFORMANCE: Debounce conversation filter to reduce re-renders during typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilter(conversationFilter);
    }, 300); // 300ms delay

    return () => clearTimeout(handler);
  }, [conversationFilter]);

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
        api.get('/messages/list'),
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
          const startTime = performance.now();

          const endpoint = selectedChatType === 'group'
            ? `/messages/group/${selectedChat}`
            : `/messages/${selectedChat}`;
          logger.debug('📥 Fetching messages from:', endpoint);

          // ⚡ PERFORMANCE: Add limit parameter to reduce initial load
          const response = await api.get(endpoint, {
            params: {
              limit: 50 // Only load last 50 messages initially
            }
          });

          const fetchTime = performance.now() - startTime;
          logger.debug(`✅ Loaded ${response.data.length} messages in ${Math.round(fetchTime)}ms`);

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

  // Scroll to bottom when messages change or loading completes
  useEffect(() => {
    // 🔥 FIX: Only scroll after loading is complete and messages exist
    if (messages.length > 0 && !loadingMessages && chatContainerRef.current) {
      const container = chatContainerRef.current;

      const scrollToBottom = (instant = false) => {
        if (!container) return;
        if (instant) {
          // Instant scroll - set scrollTop directly
          container.scrollTop = container.scrollHeight;
        } else {
          // Smooth scroll
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          });
        }
      };

      // For initial load or when switching chats, use instant scroll after DOM update
      const isInitialLoad = messages.length <= 50;

      if (isInitialLoad) {
        // Use multiple attempts to ensure scroll happens after render
        // Immediate attempt
        scrollToBottom(true);

        // After next frame
        requestAnimationFrame(() => {
          scrollToBottom(true);

          // After paint
          requestAnimationFrame(() => {
            scrollToBottom(true);
          });
        });

        // Fallback after longer delay (catches lazy-loaded images and profile photos)
        setTimeout(() => scrollToBottom(true), 200);
        setTimeout(() => scrollToBottom(true), 400);
      } else {
        // For new messages, smooth scroll
        setTimeout(() => scrollToBottom(false), 50);
      }
    }
  }, [messages, loadingMessages]);

  // Additional scroll trigger when initial load completes for a chat
  useEffect(() => {
    // Only scroll once per chat, when loading completes and we have messages
    if (selectedChat &&
        messages.length > 0 &&
        !loadingMessages &&
        chatContainerRef.current &&
        lastScrolledChatRef.current !== selectedChat) {

      // Mark this chat as scrolled
      lastScrolledChatRef.current = selectedChat;

      const container = chatContainerRef.current;

      // Wait for DOM to fully render, then scroll
      const scrollAfterRender = () => {
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      };

      // Multiple delayed attempts to catch all render cycles (images, avatars, etc.)
      const timeouts = [50, 150, 300, 500].map(delay =>
        setTimeout(scrollAfterRender, delay)
      );

      return () => timeouts.forEach(clearTimeout);
    }

    // Reset scroll tracking when chat changes
    if (!selectedChat) {
      lastScrolledChatRef.current = null;
    }
  }, [selectedChat, messages.length, loadingMessages]);

  // Note: Online user presence is now managed by useOnlineUsers hook

  // Socket.IO listeners for messages and typing - depend on selectedChat
  useEffect(() => {
    // Ensure socket is connected before setting up listeners
    const setupListeners = (socket) => {
      logger.debug('🎧 Setting up message socket listeners for chat:', selectedChat);

      // Listen for new messages
      const cleanupNewMessage = onNewMessage((newMessage) => {
        logger.debug('📨 Received message:new event:', newMessage);

        // 🔥 CRITICAL FIX: Only process messages where WE are the RECIPIENT
        // The sender gets their own message via 'message:sent', not 'message:new'
        // This prevents duplicate messages on the sender's side
        const isRecipient = currentUser?._id === newMessage.recipient._id;
        const isSenderInSelectedChat = selectedChat === newMessage.sender._id;

        // Only add message if we're the recipient AND the sender is the selected chat
        if (isRecipient && isSenderInSelectedChat) {
          logger.debug('✅ Message is for selected chat (we are recipient), adding to messages');
          setMessages((prev) => {
            // Prevent duplicates - check if message already exists
            if (prev.some(msg => msg._id === newMessage._id)) {
              logger.debug('⚠️ Message already exists, skipping');
              return prev;
            }
            return [...prev, newMessage];
          });
        } else {
          logger.debug('⏭️ Skipping message:new (not recipient or wrong chat)', {
            isRecipient,
            isSenderInSelectedChat,
            currentUserId: currentUser?._id,
            recipientId: newMessage.recipient._id,
            senderId: newMessage.sender._id,
            selectedChat
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

      // Listen for sent message confirmation (message:sent - Phase R unified)
      const cleanupMessageSent = onMessageSent((sentMessage) => {
        // 🔥 TEMP DEBUG - always log to console
        console.log('✅ [Messages.jsx] Received message:sent event:', sentMessage);
        logger.debug('✅ Received message:sent event:', sentMessage);

        // 🔥 CRITICAL: Clear the rollback timeout - message confirmed!
        // The server may send back the original _tempId for reconciliation
        if (sentMessage._tempId) {
          clearOptimisticTimeout(sentMessage._tempId);
        }

        // Only process if this is the selected chat
        if (selectedChat === sentMessage.recipient._id) {
          logger.debug('✅ Sent message is for selected chat, reconciling...');
          setMessages((prev) => {
            // OPTIMISTIC UI RECONCILIATION: Replace temp message with real one
            // Find the optimistic message that matches this confirmation
            const optimisticIndex = prev.findIndex(msg => msg._isOptimistic);

            if (optimisticIndex !== -1) {
              logger.debug('🔄 Replacing optimistic message with confirmed message');
              // Clear any pending timeout for this optimistic message
              const optimisticMsg = prev[optimisticIndex];
              if (optimisticMsg._id) {
                clearOptimisticTimeout(optimisticMsg._id);
              }

              // Replace the optimistic message with the confirmed one
              const updated = [...prev];
              updated[optimisticIndex] = sentMessage;
              return updated;
            }

            // No optimistic message found - check for duplicates and add
            if (prev.some(msg => msg._id === sentMessage._id)) {
              logger.debug('⚠️ Message already exists, skipping');
              return prev;
            }
            return [...prev, sentMessage];
          });
        } else {
          // 🔥 FIX: Even if user switched chats, still clear the optimistic message
          // from wherever it is (prevents orphaned temp messages)
          setMessages((prev) => {
            const hasOptimistic = prev.some(msg => msg._isOptimistic);
            if (hasOptimistic) {
              logger.debug('🔄 Clearing optimistic message from previous chat');
              return prev.filter(msg => !msg._isOptimistic);
            }
            return prev;
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

      // Listen for message deletion events
      const handleMessageDeleted = (data) => {
        logger.debug('🗑️ Received message:deleted event:', data);
        if (data.deleteForAll) {
          // Show deleted placeholder
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === data.messageId
                ? { ...msg, isDeleted: true, content: '', attachment: null }
                : msg
            )
          );
        } else {
          // Remove from view (deleted for self)
          setMessages((prev) => prev.filter((msg) => msg._id !== data.messageId));
        }
      };
      socket.on('message:deleted', handleMessageDeleted);

      // 🔥 CRITICAL: Listen for message errors
      const handleMessageError = (error) => {
        logger.error('❌ Message error received:', error);
        console.error('❌ Message error:', error);
        alert(`Message error: ${error.message || 'Unknown error'}`);
      };
      socket.on('message:error', handleMessageError);

      // Return cleanup function
      return () => {
        cleanupNewMessage?.();
        cleanupMessageSent?.();
        cleanupTyping?.();
        socket.off('message:deleted', handleMessageDeleted);
        socket.off('message:error', handleMessageError);
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
    // 🔥 CRITICAL DEBUG: Show socket state
    const socket = getSocket();
    const socketConnected = socket?.connected;
    alert(`Socket connected: ${socketConnected}\nSocket ID: ${socket?.id || 'none'}\nselectedChat: ${selectedChat}\nchatType: ${selectedChatType}`);

    if (e) e.preventDefault();
    if ((!message.trim() && !selectedFile && !selectedGif && !voiceNote) || !selectedChat) {
      console.log('❌ Early return - missing content or selectedChat');
      return;
    }

    // Use GIF URL if selected, otherwise use file attachment
    const attachmentUrl = selectedGif || selectedFile?.url;
    const messageContent = message.trim();

    // Generate temporary ID for optimistic update
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create optimistic message object
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
      _isOptimistic: true // Flag for reconciliation
    };

    console.log('📤 Sending message (optimistic UI):', {
      tempId,
      recipientId: selectedChat,
      content: messageContent,
      attachment: attachmentUrl,
      chatType: selectedChatType
    });

    try {
      if (selectedChatType === 'group') {
        // Send group message via API (no optimistic for groups yet)
        const response = await api.post('/messages', {
          groupChatId: selectedChat,
          content: messageContent,
          attachment: attachmentUrl,
          voiceNote: voiceNote,
          contentWarning: contentWarning
        });
        setMessages((prev) => [...prev, response.data]);
      } else {
        // Check if socket is connected
        const socket = getSocket();
        const socketConnected = socket && isSocketConnected();
        console.log('🔌 Socket check:', { socket: !!socket, connected: socketConnected, socketId: socket?.id });

        // OPTIMISTIC UI: Add message immediately before server confirms
        setMessages((prev) => [...prev, optimisticMessage]);

        // 🔥 CRITICAL: Schedule rollback timeout in case server confirmation never arrives
        // This prevents orphaned optimistic messages from staying in UI forever
        scheduleOptimisticRollback(tempId, 15000); // 15 seconds timeout

        if (socketConnected) {
          // ✅ PREFERRED: Send via Socket.IO for real-time delivery
          console.log('🔌 Sending via Socket.IO', {
            socketId: socket.id,
            tempId,
            recipientId: selectedChat,
            content: messageContent
          });

          try {
            const messagePayload = {
              recipientId: selectedChat,
              content: messageContent,
              attachment: attachmentUrl,
              voiceNote: voiceNote,
              contentWarning: contentWarning,
              _tempId: tempId // Send tempId for reconciliation
            };

            console.log('📤 [SEND] Calling socketSendMessage with payload:', {
              recipientId: selectedChat,
              hasContent: !!messageContent,
              contentLength: messageContent?.length,
              contentPreview: messageContent?.substring(0, 50),
              hasAttachment: !!attachmentUrl,
              hasVoiceNote: !!voiceNote,
              socketConnected: socket?.connected,
              socketId: socket?.id
            });

            // 🔥 ENHANCED: Use ACK callback for immediate confirmation
            socketSendMessage(messagePayload, (ackResponse) => {
              if (ackResponse?.success) {
                console.log('✅ Message ACK received:', ackResponse);
                // Clear the rollback timeout - message confirmed!
                clearOptimisticTimeout(tempId);
              } else if (ackResponse?.queued) {
                // Message queued - don't rollback, wait for actual send
                console.log('📬 Message queued, waiting for send:', ackResponse);
                // Keep the optimistic message and rollback timeout active
              } else if (ackResponse?.error) {
                console.error('❌ Message ACK error:', ackResponse);
                // Rollback on ACK error
                clearOptimisticTimeout(tempId);
                setMessages((prev) => prev.filter(m => m._id !== tempId));
              }
            });
            console.log('✅ socketSendMessage called successfully');
          } catch (error) {
            console.error('❌ Error sending message via socket:', error);
            console.error('Error details:', {
              name: error.name,
              message: error.message,
              stack: error.stack
            });
            // ROLLBACK: Remove optimistic message on error (immediate)
            clearOptimisticTimeout(tempId);
            setMessages((prev) => prev.filter(m => m._id !== tempId));
            alert('Failed to send message. Please try again.');
            return;
          }
        } else {
          // 🔥 FALLBACK: Use REST API if socket not connected
          console.warn('⚠️ Socket not connected, falling back to REST API');

          try {
            const response = await api.post('/messages', {
              recipient: selectedChat,
              content: messageContent,
              attachment: attachmentUrl,
              voiceNote: voiceNote,
              contentWarning: contentWarning
            });

            // 🔥 SUCCESS: Clear the rollback timeout
            clearOptimisticTimeout(tempId);

            // Replace optimistic message with real one
            setMessages((prev) =>
              prev.map(m => m._id === tempId ? response.data : m)
            );
            console.log('✅ Message sent via REST API');
          } catch (error) {
            console.error('❌ Error sending message via REST API:', error);
            // ROLLBACK: Remove optimistic message on error (immediate)
            clearOptimisticTimeout(tempId);
            setMessages((prev) => prev.filter(m => m._id !== tempId));
            alert('Failed to send message. Please try again.');
            return;
          }
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
      // ROLLBACK: Remove optimistic message on error (immediate)
      clearOptimisticTimeout(tempId);
      setMessages((prev) => prev.filter(m => m._id !== tempId));
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

    // 🔥 CRITICAL: Block temp_* IDs from reaching REST API
    if (isTempId(messageId)) {
      logger.warn('⚠️ Cannot edit optimistic message - waiting for server confirmation');
      showAlert('Please wait for the message to be sent before editing.', 'Message Pending');
      return;
    }

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

  // State for delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteMessageId, setDeleteMessageId] = useState(null);
  const [deleteIsSender, setDeleteIsSender] = useState(false);

  const openDeleteModal = (messageId, isSender) => {
    setDeleteMessageId(messageId);
    setDeleteIsSender(isSender);
    setDeleteModalOpen(true);
  };

  const handleDeleteMessage = async (deleteForAll = false) => {
    if (!deleteMessageId) return;

    // 🔥 CRITICAL: Block temp_* IDs from reaching REST API
    if (isTempId(deleteMessageId)) {
      logger.warn('⚠️ Cannot delete optimistic message - waiting for server confirmation');
      // For optimistic messages, just remove from UI locally (no API call)
      setMessages((prev) => prev.filter((msg) => msg._id !== deleteMessageId));
      clearOptimisticTimeout(deleteMessageId);
      setDeleteModalOpen(false);
      setDeleteMessageId(null);
      return;
    }

    try {
      const queryParam = deleteForAll ? '?deleteForAll=true' : '';
      await api.delete(`/messages/${deleteMessageId}${queryParam}`);

      if (deleteForAll) {
        // Mark message as deleted (show placeholder)
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === deleteMessageId
              ? { ...msg, isDeleted: true, content: '', attachment: null }
              : msg
          )
        );
      } else {
        // Remove from view for this user
        setMessages((prev) => prev.filter((msg) => msg._id !== deleteMessageId));
      }

      setDeleteModalOpen(false);
      setDeleteMessageId(null);
    } catch (error) {
      logger.error('❌ Error deleting message:', error);
      showAlert('Failed to delete message. Please try again.', 'Delete Failed');
    }
  };

  const handleReactToMessage = (messageId) => {
    // 🔥 CRITICAL: Block reactions on temp_* IDs
    if (isTempId(messageId)) {
      logger.warn('⚠️ Cannot react to optimistic message - waiting for server confirmation');
      showAlert('Please wait for the message to be sent before reacting.', 'Message Pending');
      return;
    }
    setReactingToMessage(messageId);
    setShowEmojiPicker(true);
  };

  const handleEmojiSelect = async (emoji) => {
    if (!reactingToMessage) return;

    // 🔥 CRITICAL: Double-check temp_* ID (defensive)
    if (isTempId(reactingToMessage)) {
      logger.warn('⚠️ Cannot react to optimistic message');
      setShowEmojiPicker(false);
      setReactingToMessage(null);
      return;
    }

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
    // 🔥 CRITICAL: Block temp_* IDs from reaching REST API
    if (isTempId(messageId)) {
      logger.warn('⚠️ Cannot remove reaction from optimistic message');
      return;
    }

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

  // ⚡ PERFORMANCE: Memoize filtered conversations to prevent re-filtering on every render
  // Uses debounced filter to reduce re-renders during typing
  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      // Tab filter (archived/unread/all)
      const isArchived = archivedConversations.includes(conv._id);
      if (activeTab === 'archived') return isArchived;
      if (activeTab === 'unread') return !isArchived && (conv.unread > 0 || conv.manuallyUnread);
      if (isArchived) return false; // 'all' tab shows non-archived

      // Name filter - search by participant displayName or username (DEBOUNCED)
      if (debouncedFilter.trim()) {
        const q = debouncedFilter.toLowerCase();
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
    });
  }, [conversations, archivedConversations, activeTab, debouncedFilter, currentUser]);

  return (
    <div
      className="page-container messages-page"
      data-theme={currentTheme}
      data-quiet-mode={quietMode ? 'true' : 'false'}
    >
      <Navbar onMenuClick={onMenuOpen} />

      <div className="messages-container">
        <div className={`messages-layout messages-root glossy fade-in ${selectedChat ? 'in-conversation' : ''}`}>
          <div className={`conversations-sidebar dm-list ${selectedChat ? 'chat-active' : ''}`}>
            <div className="sidebar-header dm-list-header">
              <h2 className="sidebar-title dm-list-title">Messages</h2>
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

                  {/* Direct Messages - Optimized with Memoization & Debouncing */}
                  {conversations.length > 0 && (
                    <>
                      <div className="section-label">Direct Messages</div>
                      {/* ⚡ PERFORMANCE: Memoized and debounced filtering */}
                      {filteredConversations.map((conv) => {
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

          <div className={`chat-area conversation-shell ${selectedChat ? 'active' : ''}`}>
            {selectedChat ? (
              <>
                <header className="chat-header conversation-header" key={`${selectedChat}-${selectedChatType}`}>
                  {/* Mobile Back Button - Chevron */}
                  <button
                    className="mobile-back-btn back-btn"
                    onClick={() => {
                      setSelectedChat(null);
                      setSelectedChatType(null);
                    }}
                    aria-label="Back to conversations"
                  >
                    ←
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
                </header>

                {/* Chat Messages Area - Centered Conversation Container */}
                <div id="message-scroll" className="chat-messages message-scroll" ref={chatContainerRef}>
                  {/* Conversation wrapper - centers content with max-width */}
                  <div className="conversation-wrapper">
                    {/* Inner container - the "quiet room" for messages */}
                    <div className="conversation-inner">
                      {!currentUser ? (
                        <div className="loading-messages empty-conversation">Loading messages...</div>
                      ) : loadingMessages ? (
                        <div className="loading-messages empty-conversation">Loading messages...</div>
                      ) : messages.length === 0 ? (
                        <div className="empty-chat-state empty-conversation">
                          <div className="empty-chat-icon empty-icon">💬</div>
                          <p className="empty-title">No messages yet</p>
                          <p className="empty-chat-hint empty-hint">Start a calm conversation</p>
                        </div>
                      ) : (
                        /* Render grouped messages for rhythm and flow */
                        groupMessagesBySender.map((group, groupIndex) => (
                          <React.Fragment key={`group-${groupIndex}-${group.senderId}`}>
                            {/* Date Header - only shown when date changes */}
                            {group.showDateHeader && (
                              <div className="message-date-header">
                                <span>{group.dateHeader}</span>
                              </div>
                            )}

                            {/* Message Group Cluster - consecutive messages from same sender */}
                            <div className={`message-group-cluster ${group.isCurrentUser ? 'sent' : 'received'}`}>
                              {/* Group header - avatar + name (only shown once per cluster) */}
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

                              {/* Individual messages within the cluster */}
                              {group.messages.map((msg, msgIndex) => {
                                const isEditing = editingMessageId === msg._id;
                                const isFirst = msgIndex === 0;
                                const isLast = msgIndex === group.messages.length - 1;
                                const isSingle = group.messages.length === 1;
                                const bubblePosition = isSingle ? 'single' : isFirst ? 'first' : isLast ? 'last' : 'middle';

                                return (
                                  <div
                                    key={msg._id}
                                    className={`message-group ${group.isCurrentUser ? 'sent' : 'received'}`}
                                    data-position={bubblePosition}
                                  >
                                    <div className="message-content">
                                      {/* Show deleted message placeholder */}
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
                                            className={`message-bubble ${bubblePosition}`}
                                            style={
                                              group.isCurrentUser
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

                                            {/* Voice Note Player - Lazy Loaded */}
                                            {msg.voiceNote?.url && (
                                              <Suspense fallback={<div className="loading-spinner">Loading...</div>}>
                                                <AudioPlayer
                                                  url={getImageUrl(msg.voiceNote.url)}
                                                  duration={msg.voiceNote.duration}
                                                />
                                              </Suspense>
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

                                          {/* Show timestamp only on last message in cluster */}
                                          {isLast && (
                                            <div className="message-meta">
                                              <div className="message-time">
                                                {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                              </div>
                                              {msg.edited && <div className="message-edited-indicator">(edited)</div>}
                                            </div>
                                          )}

                                          {/* 3-dot menu for message actions */}
                                          <div className="message-actions-menu">
                                            <button
                                              className="btn-message-menu"
                                              onClick={() => setOpenMessageMenu(openMessageMenu === msg._id ? null : msg._id)}
                                              title="More actions"
                                            >
                                              ⋮
                                            </button>
                                            {openMessageMenu === msg._id && (
                                              <div className="message-menu-dropdown">
                                                <button
                                                  onClick={() => { setReplyingTo(msg); setOpenMessageMenu(null); }}
                                                  className="menu-item"
                                                >
                                                  ↩️ Reply
                                                </button>
                                                <button
                                                  onClick={() => { handleReactToMessage(msg._id); setOpenMessageMenu(null); }}
                                                  className="menu-item"
                                                >
                                                  😊 React
                                                </button>
                                                {group.isCurrentUser && (
                                                  <>
                                                    <button
                                                      onClick={() => { handleEditMessage(msg._id, msg.content); setOpenMessageMenu(null); }}
                                                      className="menu-item"
                                                    >
                                                      ✏️ Edit
                                                    </button>
                                                    <button
                                                      onClick={() => { openDeleteModal(msg._id, true); setOpenMessageMenu(null); }}
                                                      className="menu-item menu-item-danger"
                                                    >
                                                      🗑️ Delete
                                                    </button>
                                                  </>
                                                )}
                                                {!group.isCurrentUser && (
                                                  <button
                                                    onClick={() => { openDeleteModal(msg._id, false); setOpenMessageMenu(null); }}
                                                    className="menu-item menu-item-danger"
                                                  >
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
                              })}
                            </div>
                          </React.Fragment>
                        ))
                      )}

                      {/* Typing indicator - Calm fade, no bouncing */}
                      <TypingIndicator
                        isTyping={isTyping}
                        userName={selectedUser ? getDisplayName(selectedUser) : null}
                      />
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
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
                  {/* Calm Composer - Single row with inline actions */}
                  <div className="message-composer calm-composer">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*,video/*"
                      style={{ display: 'none' }}
                    />

                    {/* Input container with inline actions */}
                    <div className="composer-input-row">
                      {/* Attachment button - leading */}
                      <button
                        type="button"
                        className="composer-action-btn"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFile || selectedGif || isRecipientUnavailable}
                        title={uploadingFile ? `Uploading... ${uploadProgress}%` : "Attach"}
                      >
                        {uploadingFile ? `${uploadProgress}%` : '+'}
                      </button>

                      {/* Text input - grows to fill */}
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
                        placeholder={isRecipientUnavailable ? recipientUnavailableReason : (replyingTo ? "Reply..." : (selectedGif || selectedFile ? "Caption..." : "Message..."))}
                        className="message-input"
                        disabled={isRecipientUnavailable}
                      />

                      {/* Trailing actions group */}
                      <div className="composer-trailing-actions">
                        <button
                          type="button"
                          className="composer-action-btn"
                          onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                          disabled={selectedFile || selectedGif || isRecipientUnavailable}
                          title="Voice note"
                        >
                          🎤
                        </button>
                        <button
                          type="button"
                          className={`composer-action-btn ${showContentWarning ? 'active' : ''}`}
                          onClick={() => setShowContentWarning(!showContentWarning)}
                          disabled={isRecipientUnavailable}
                          title="Content warning"
                        >
                          ⚠️
                        </button>
                      </div>

                      {/* Send button */}
                      <button
                        type="submit"
                        className="send-btn"
                        disabled={uploadingFile || isRecipientUnavailable || (!message.trim() && !selectedFile && !selectedGif)}
                        aria-label="Send"
                      >
                        ↑
                      </button>
                    </div>
                  </div>
                  {/* DEPRECATED: GifPicker removed 2025-12-26 */}
                  {showVoiceRecorder && (
                    <Suspense fallback={<div className="loading-spinner">Loading...</div>}>
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
                    </Suspense>
                  )}
                </form>
              </>
            ) : (
              <div className="no-chat-selected no-conversation-selected">
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

        {/* Emoji Picker Modal - Lazy Loaded */}
        {showEmojiPicker && (
          <Suspense fallback={<div className="loading-spinner">Loading...</div>}>
            <EmojiPicker
              onEmojiSelect={handleEmojiSelect}
              onClose={() => {
                setShowEmojiPicker(false);
                setReactingToMessage(null);
              }}
            />
          </Suspense>
        )}

        {/* GIF Picker Modal - Lazy Loaded */}
        {showGifPicker && (
          <Suspense fallback={<div className="loading-spinner">Loading...</div>}>
            <GifPicker
              onGifSelect={(gifUrl) => {
                setSelectedGif(gifUrl);
                setShowGifPicker(false);
              }}
              onClose={() => setShowGifPicker(false)}
            />
          </Suspense>
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

        {/* Delete Message Confirmation Modal */}
        {deleteModalOpen && (
          <div className="modal-overlay" onClick={() => setDeleteModalOpen(false)}>
            <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Delete Message</h3>
              <p>How would you like to delete this message?</p>
              <div className="delete-modal-actions">
                {deleteIsSender && (
                  <button
                    className="btn-delete-for-all"
                    onClick={() => handleDeleteMessage(true)}
                  >
                    🗑️ Delete for everyone
                  </button>
                )}
                <button
                  className="btn-delete-for-me"
                  onClick={() => handleDeleteMessage(false)}
                >
                  👤 Delete for me
                </button>
                <button
                  className="btn-cancel"
                  onClick={() => setDeleteModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Messages;

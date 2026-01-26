import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import Navbar from '../components/Navbar';
import GifPicker from '../components/GifPicker';
import FormattedText from '../components/FormattedText';
import api from '../utils/api';
import { getImageUrl } from '../utils/imageUrl';
import { getSocket } from '../utils/socket';
import { emitValidated } from '../utils/emitValidated';
import { saveDraft, loadDraft, clearDraft } from '../utils/draftStore';
import { quietCopy } from '../config/uiCopy';
import './Lounge.css';

function Lounge() {
  const navigate = useNavigate();
  // Get menu handler from AppLayout outlet context
  const { onMenuOpen } = useOutletContext() || {};
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [contentWarning, setContentWarning] = useState('');
  const [showCWInput, setShowCWInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [selectedGif, setSelectedGif] = useState(null);
  const [showOnlineUsersModal, setShowOnlineUsersModal] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loadingOnlineUsers, setLoadingOnlineUsers] = useState(false);
  const [onlineUsersCache, setOnlineUsersCache] = useState({ users: [], timestamp: 0 });
  const [isQuietMode, setIsQuietMode] = useState(document.documentElement.getAttribute('data-quiet') === 'true');
  const [typingUsers, setTypingUsers] = useState(new Map()); // Map of userId -> timeout
  const [openMessageMenu, setOpenMessageMenu] = useState(null); // Track which message's action menu is open
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteMessageId, setDeleteMessageId] = useState(null);
  const [deleteIsSender, setDeleteIsSender] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Listen for quiet mode changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsQuietMode(document.documentElement.getAttribute('data-quiet') === 'true');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-quiet'] });
    return () => observer.disconnect();
  }, []);

  // Handler to block Enter key submission when GIF picker is open
  const handleKeyDown = useCallback((e) => {
    if (showGifPicker && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  }, [showGifPicker]);

  // Scroll to bottom - 🔥 FIX: Use scrollTop directly on container for reliability
  const scrollToBottom = useCallback((instant = false) => {
    const container = messagesContainerRef.current;
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
  }, []);

  // Check if user is near bottom of messages
  const isNearBottom = () => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 100;
  };

  // 🚀 OPTIMIZED: Combine all initial data loading into ONE useEffect
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Get current user from localStorage (synchronous)
        const user = JSON.parse(localStorage.getItem('user'));
        setCurrentUser(user);

        // 2. Restore draft from localStorage (synchronous)
        const localDraft = loadDraft('lounge-message');
        if (localDraft) {
          setNewMessage(localDraft.text || '');
          setSelectedGif(localDraft.gifUrl || null);
          setContentWarning(localDraft.contentWarning || '');
          setShowCWInput(!!localDraft.contentWarning);
        }

        // 3. Load messages and online count in parallel (asynchronous)
        // 🚀 PERFORMANCE: Reduced from 50 to 30 messages for faster initial load
        const [messagesResponse, onlineCountResponse] = await Promise.all([
          api.get('/global-chat/messages?limit=30'),
          api.get('/global-chat/online-count').catch(() => ({ data: { count: 0 } }))
        ]);

        setMessages(messagesResponse.data.messages || []);
        setHasMore(messagesResponse.data.hasMore || false);

        if (onlineCountResponse.data.count > 0) {
          setOnlineCount(onlineCountResponse.data.count);
        }

        // 🔥 FIX: Scroll to bottom instantly on initial load - multiple attempts for reliability
        scrollToBottom(true); // Immediate
        requestAnimationFrame(() => {
          scrollToBottom(true); // After frame
          requestAnimationFrame(() => scrollToBottom(true)); // After paint
        });
        setTimeout(() => scrollToBottom(true), 200); // Fallback for lazy-loaded content
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Single useEffect for all initial data loading

  // Auto-save draft to localStorage
  useEffect(() => {
    if (newMessage || selectedGif || contentWarning) {
      const draftData = {
        text: newMessage,
        gifUrl: selectedGif,
        contentWarning: contentWarning
      };
      saveDraft('lounge-message', draftData);
    }
  }, [newMessage, selectedGif, contentWarning]);

  // 🔥 FIX: Create stable handler functions with useCallback to prevent re-creation
  const handleNewMessage = useCallback((message) => {
    console.log('📨 Lounge: Received new message', message);

    // Use functional update for better performance
    setMessages(prev => {
      // ⚡ OPTIMISTIC UI: Replace optimistic message with real one
      const hasOptimistic = prev.some(m => m._isOptimistic);
      if (hasOptimistic) {
        console.log('🔄 Lounge: Replacing optimistic message with confirmed message');
        // Replace the first optimistic message with the confirmed one
        let replaced = false;
        return prev.map(m => {
          if (!replaced && m._isOptimistic) {
            replaced = true;
            return message;
          }
          return m;
        });
      }

      // Check for duplicates (in case of double-emit)
      if (prev.some(m => m._id === message._id)) {
        console.warn('⚠️ Duplicate message received, skipping');
        return prev;
      }
      return [...prev, message];
    });

    // Auto-scroll if user is near bottom (reduced delay)
    if (isNearBottom()) {
      setTimeout(scrollToBottom, 50);
    }
  }, []);

  const handleDeletedMessage = useCallback(({ messageId, deleteForAll }) => {
    if (deleteForAll) {
      // Show deleted placeholder for delete-for-all
      setMessages(prev => prev.map(msg =>
        msg._id === messageId
          ? { ...msg, isDeleted: true }
          : msg
      ));
    } else {
      // Remove from view (should not typically happen via socket for delete-for-self)
      // This is just a fallback
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
    }
  }, []);

  const handleOnlineCount = useCallback(({ count }) => {
    setOnlineCount(count);
  }, []);

  const handleOnlineUsersList = useCallback(({ users }) => {
    console.log('📥 Lounge: Received online users list', users.length, 'users');

    // Clear timeout if it exists
    if (socketRef.onlineUsersTimeout) {
      clearTimeout(socketRef.onlineUsersTimeout);
      socketRef.onlineUsersTimeout = null;
    }

    // Update cache
    setOnlineUsersCache({ users, timestamp: Date.now() });

    setOnlineUsers(users);
    setLoadingOnlineUsers(false);
  }, []);

  const handleUserTyping = useCallback(({ userId, isTyping }) => {
    setTypingUsers(prev => {
      const newMap = new Map(prev);

      if (isTyping) {
        // Clear existing timeout for this user
        if (newMap.has(userId)) {
          clearTimeout(newMap.get(userId));
        }

        // Set new timeout to remove typing indicator after 3 seconds
        const timeout = setTimeout(() => {
          setTypingUsers(current => {
            const updated = new Map(current);
            updated.delete(userId);
            return updated;
          });
        }, 3000);

        newMap.set(userId, timeout);
      } else {
        // User stopped typing - delay removal by 500ms to prevent flicker
        if (newMap.has(userId)) {
          clearTimeout(newMap.get(userId));

          const removeTimeout = setTimeout(() => {
            setTypingUsers(current => {
              const updated = new Map(current);
              updated.delete(userId);
              return updated;
            });
          }, 500);

          newMap.set(userId, removeTimeout);
        }
      }

      return newMap;
    });
  }, []);

  const handleSocketError = useCallback((data) => {
    console.error('❌ Lounge: Socket error', data);
    setError(data.message);
    setTimeout(() => setError(''), 5000);
    setLoadingOnlineUsers(false);
  }, []);

  const handleTransportUpgrade = useCallback((transport) => {
    console.log('⚡ Lounge: Transport upgraded to', transport.name);
  }, []);

  // Socket.IO setup - FIX: Use ref to prevent re-running on handler changes
  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    if (!socket) {
      console.error('❌ Socket not initialized in Lounge');
      return;
    }

    console.log('🔌 Lounge: Socket initialized', {
      connected: socket.connected,
      id: socket.id,
      transport: socket.io?.engine?.transport?.name || 'unknown'
    });

    // 🔥 CRITICAL FIX: Check if listeners are already attached
    // This prevents duplicate listeners in React StrictMode
    const listenerCount = socket.listeners('global_message:new').length;
    if (listenerCount > 0) {
      console.warn(`⚠️ Lounge: ${listenerCount} listeners already attached, skipping setup`);
      return;
    }

    // Function to set up listeners
    const setupListeners = () => {
      console.log('📡 Lounge: Setting up Socket.IO listeners');

      // Join global chat room (using validated emit)
      emitValidated(socket, 'global_chat:join', {});
      console.log('📡 Lounge: Emitted global_chat:join');

      // 🔥 FIX: Attach stable handlers (can be properly removed)
      socket.on('global_message:new', handleNewMessage);
      socket.on('global_message:deleted', handleDeletedMessage);
      socket.on('global_chat:online_count', handleOnlineCount);
      socket.on('global_chat:online_users_list', handleOnlineUsersList);
      socket.on('global_chat:user_typing', handleUserTyping);
      socket.on('error', handleSocketError);
      socket.io.engine.on('upgrade', handleTransportUpgrade);

      console.log('✅ Lounge: Listeners attached. Current count:', socket.listeners('global_message:new').length);
    };

    // Set up listeners immediately if connected, or wait for connection
    if (socket.connected) {
      console.log('✅ Lounge: Socket already connected, setting up listeners');
      setupListeners();
    } else {
      console.log('⏳ Lounge: Socket not connected yet, waiting...');
      socket.once('connect', () => {
        console.log('✅ Lounge: Socket connected, setting up listeners');
        setupListeners();
      });
    }

    return () => {
      console.log('🧹 Lounge: Cleaning up Socket.IO listeners');
      console.log('🔍 Before cleanup - listener count:', socket?.listeners('global_message:new').length);

      // 🔥 FIX: Remove specific stable handlers to prevent duplicates
      if (socket && typeof socket.off === 'function') {
        socket.off('global_message:new', handleNewMessage);
        socket.off('global_message:deleted', handleDeletedMessage);
        socket.off('global_chat:online_count', handleOnlineCount);
        socket.off('global_chat:online_users_list', handleOnlineUsersList);
        socket.off('global_chat:user_typing', handleUserTyping);
        socket.off('error', handleSocketError);

        if (socket.io?.engine) {
          socket.io.engine.off('upgrade', handleTransportUpgrade);
        }
      }

      console.log('🔍 After cleanup - listener count:', socket?.listeners('global_message:new').length);

      // Clear all typing timeouts
      typingUsers.forEach(timeout => clearTimeout(timeout));
    };
  }, [handleNewMessage, handleDeletedMessage, handleOnlineCount, handleOnlineUsersList, handleUserTyping, handleSocketError, handleTransportUpgrade]);

  // Load more messages (pagination)
  const loadMoreMessages = async () => {
    if (!hasMore || loadingMore || messages.length === 0) return;

    try {
      setLoadingMore(true);
      const oldestMessage = messages[0];
      // 🚀 PERFORMANCE: Reduced from 50 to 30 messages per page
      const response = await api.get(`/global-chat/messages?before=${oldestMessage.createdAt}&limit=30`);

      const newMessages = response.data.messages || [];
      setMessages(prev => [...newMessages, ...prev]);
      setHasMore(response.data.hasMore || false);
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle scroll for pagination
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop } = messagesContainerRef.current;
    
    // Load more when scrolled to top
    if (scrollTop === 0 && hasMore && !loadingMore) {
      loadMoreMessages();
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    // Block submission if GIF picker is open
    if (showGifPicker) {
      return;
    }

    if (!newMessage.trim() && !selectedGif) return;

    if (newMessage.length > 2000) {
      setError('Message is too long (max 2000 characters)');
      setTimeout(() => setError(''), 5000);
      return;
    }

    try {
      setSending(true);
      setError('');

      const socket = socketRef.current;

      if (!socket) {
        console.error('❌ Lounge: Socket not available');
        setError('Connection error. Please refresh the page.');
        setTimeout(() => setError(''), 5000);
        return;
      }

      if (!socket.connected) {
        console.error('❌ Lounge: Socket not connected');
        setError('Not connected. Please check your internet connection.');
        setTimeout(() => setError(''), 5000);
        return;
      }

      // ⚡ OPTIMISTIC UI: Create temporary message and add to UI immediately
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const optimisticMessage = {
        _id: tempId,
        text: newMessage.trim() || '',
        gifUrl: selectedGif || null,
        contentWarning: contentWarning.trim() || null,
        sender: {
          id: currentUser._id,
          _id: currentUser._id,
          username: currentUser.username,
          displayName: currentUser.displayName,
          avatar: currentUser.profilePhoto
        },
        createdAt: new Date().toISOString(),
        _isOptimistic: true // Flag for styling (show as pending)
      };

      // Add optimistic message to UI immediately
      setMessages(prev => [...prev, optimisticMessage]);
      console.log('⚡ Lounge: Added optimistic message to UI');

      const messageData = {
        text: newMessage.trim() || '',
        gifUrl: selectedGif || null,
        contentWarning: contentWarning.trim() || null
      };

      console.log('📤 Lounge: Sending message via Socket.IO', messageData);

      // Send via Socket.IO for real-time delivery (validated emit)
      emitValidated(socket, 'global_message:send', messageData);

      // Clear localStorage draft
      clearDraft('lounge-message');

      // Clear input
      setNewMessage('');
      setSelectedGif(null);
      setContentWarning('');
      setShowCWInput(false);

      console.log('✅ Lounge: Message sent successfully');
    } catch (error) {
      console.error('❌ Lounge: Error sending message:', error);
      setError('Failed to send message');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSending(false);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (messageId, isSender) => {
    setDeleteMessageId(messageId);
    setDeleteIsSender(isSender);
    setDeleteModalOpen(true);
  };

  // Delete message with options
  const handleDeleteMessage = async (deleteForAll = false) => {
    if (!deleteMessageId) return;

    try {
      const queryParam = deleteForAll ? '?deleteForAll=true' : '';
      await api.delete(`/global-chat/messages/${deleteMessageId}${queryParam}`);

      if (deleteForAll) {
        // Message will be updated via Socket.IO event for delete-for-all
        // But also update locally immediately for responsiveness
        setMessages(prev => prev.map(msg =>
          msg._id === deleteMessageId
            ? { ...msg, isDeleted: true }
            : msg
        ));
      } else {
        // Remove from view for this user only (delete for self)
        setMessages(prev => prev.filter(msg => msg._id !== deleteMessageId));
      }

      setDeleteModalOpen(false);
      setDeleteMessageId(null);
    } catch (error) {
      console.error('Error deleting message:', error);
      setError('Failed to delete message');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Navigate to DM with user
  const handleMessageUser = (userId) => {
    if (userId === currentUser?._id) return; // Don't DM yourself
    navigate(`/messages?user=${userId}`);
  };

  // Handle clicking online count (for privileged users)
  const handleOnlineCountClick = () => {
    // Check if user has permission to view online users
    if (!currentUser || !['super_admin', 'admin', 'moderator'].includes(currentUser.role)) {
      return; // Don't show modal for regular users
    }

    setShowOnlineUsersModal(true);

    // Check if we have cached data less than 10 seconds old
    const now = Date.now();
    const cacheAge = now - onlineUsersCache.timestamp;

    if (cacheAge < 10000 && onlineUsersCache.users.length > 0) {
      // Use cached data
      console.log('📦 Lounge: Using cached online users list');
      setOnlineUsers(onlineUsersCache.users);
      setLoadingOnlineUsers(false);
      return;
    }

    // Fetch fresh data
    setLoadingOnlineUsers(true);
    setOnlineUsers([]); // Clear previous list

    // Request online users list from server
    const socket = socketRef.current;
    if (socket && socket.connected) {
      console.log('📡 Lounge: Requesting online users list');
      emitValidated(socket, 'global_chat:get_online_users', {});

      // Set timeout to stop loading if no response after 10 seconds (increased from 5s)
      // This gives the server more time for DB queries when cache is cold or many users online
      const timeoutId = setTimeout(() => {
        setLoadingOnlineUsers(prev => {
          // Only show error if still loading (response didn't arrive)
          if (prev) {
            setError('Failed to load online users. Please try again.');
            setTimeout(() => setError(''), 3000);
          }
          return false;
        });
      }, 10000); // Increased from 5000ms to 10000ms

      // Store timeout ID to clear it if response arrives
      socketRef.onlineUsersTimeout = timeoutId;
    } else {
      setLoadingOnlineUsers(false);
      setError('Not connected. Please refresh the page.');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Close online users modal
  const closeOnlineUsersModal = () => {
    setShowOnlineUsersModal(false);
    setOnlineUsers([]);
  };

  // Handle typing in input (OPTIMIZED - throttled to max 1 emit per 1s)
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);

    // Emit typing indicator (throttled, using validated emit)
    const socket = socketRef.current;
    if (socket && socket.connected && e.target.value.trim()) {
      // Only emit if we haven't emitted in the last 1 second
      const now = Date.now();
      const lastEmit = socketRef.lastTypingEmit || 0;

      if (now - lastEmit > 1000) {
        emitValidated(socket, 'global_chat:typing', { isTyping: true });
        socketRef.lastTypingEmit = now;
      }

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing indicator after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        emitValidated(socket, 'global_chat:typing', { isTyping: false });
        socketRef.lastTypingEmit = 0;
      }, 2000);
    } else if (!e.target.value.trim()) {
      // If input is empty, immediately stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (socket && socket.connected) {
        emitValidated(socket, 'global_chat:typing', { isTyping: false });
        socketRef.lastTypingEmit = 0;
      }
    }
  };

  // Format timestamp
  const formatTime = (date) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffMs = now - messageDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Check if user is admin/mod
  const isAdmin = currentUser?.role && ['moderator', 'admin', 'super_admin'].includes(currentUser.role);

  return (
    <div className="lounge-page">
      <Navbar onMenuClick={onMenuOpen} />

      <div className="lounge-container">
        {/* Header */}
        <div className="lounge-header">
          <div className="lounge-title-section">
            <h1 className="lounge-title">✨ Lounge</h1>
            <p className="lounge-subtitle">
              {isQuietMode
                ? quietCopy.loungeIntro
                : "A calm, site-wide chat room for all members. Say hi, share your day, or just sit quietly with us."}
            </p>
          </div>

          {onlineCount > 0 && (
            <div
              className={`lounge-online-count ${currentUser && ['super_admin', 'admin', 'moderator'].includes(currentUser.role) ? 'clickable' : ''}`}
              onClick={handleOnlineCountClick}
              style={{ cursor: currentUser && ['super_admin', 'admin', 'moderator'].includes(currentUser.role) ? 'pointer' : 'default' }}
            >
              <span className="online-indicator"></span>
              {onlineCount} {onlineCount === 1 ? 'member' : 'members'} online
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="lounge-error">
            {error}
          </div>
        )}

        {/* Messages */}
        <div
          className="lounge-messages"
          ref={messagesContainerRef}
          onScroll={handleScroll}
        >
          {loading ? (
            <div className="lounge-loading">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="lounge-empty">
              <p>The Lounge is quiet right now. Be the first to say hi ✨</p>
            </div>
          ) : (
            <>
              {loadingMore && (
                <div className="lounge-loading-more">Loading more...</div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`lounge-message ${msg.isDeleted ? 'deleted' : ''} ${msg._isOptimistic ? 'optimistic' : ''} ${msg.sender?.id === currentUser?._id ? 'own-message' : ''}`}
                >
                  {msg.isDeleted ? (
                    <div className="lounge-message-deleted">
                      <span className="deleted-icon">🗑️</span>
                      Message removed by moderation
                    </div>
                  ) : (
                    <>
                      <div
                        className="lounge-message-avatar-wrapper"
                        onClick={() => navigate(`/profile/${msg.sender?.username}`)}
                      >
                        {msg.sender?.avatar ? (
                          <img
                            src={getImageUrl(msg.sender.avatar)}
                            alt={msg.sender?.displayName}
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <span className="avatar-letter">
                            {msg.sender?.displayName?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>

                      <div className="lounge-message-content">
                        <div className="lounge-message-header">
                          <span
                            className="lounge-message-sender"
                            onClick={() => navigate(`/profile/${msg.sender?.username}`)}
                          >
                            {msg.sender?.displayName || msg.sender?.username}
                          </span>
                          <span className="lounge-message-time">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>

                        {msg.contentWarning && (
                          <div className="lounge-message-cw">
                            CW: {msg.contentWarning}
                          </div>
                        )}

                        {msg.text && (
                          <div className="lounge-message-text">
                            <FormattedText text={msg.text} />
                          </div>
                        )}

                        {msg.gifUrl && (
                          <div className="lounge-message-gif">
                            <img
                              src={msg.gifUrl}
                              alt="GIF"
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                        )}

                        {/* 3-dot menu for message actions */}
                        <div className="lounge-message-actions-menu">
                          <button
                            className="btn-lounge-menu"
                            onClick={() => setOpenMessageMenu(openMessageMenu === msg._id ? null : msg._id)}
                            title="More actions"
                          >
                            ⋮
                          </button>
                          {openMessageMenu === msg._id && (
                            <div className="lounge-menu-dropdown">
                              {msg.sender?.id !== currentUser?._id && (
                                <button
                                  onClick={() => { handleMessageUser(msg.sender?.id); setOpenMessageMenu(null); }}
                                  className="menu-item"
                                >
                                  💬 Send DM
                                </button>
                              )}
                              {/* Sender can delete for all or for self */}
                              {msg.sender?.id === currentUser?._id && (
                                <button
                                  onClick={() => { openDeleteModal(msg._id, true); setOpenMessageMenu(null); }}
                                  className="menu-item menu-item-danger"
                                >
                                  🗑️ Delete
                                </button>
                              )}
                              {/* Non-sender can delete for self only */}
                              {msg.sender?.id !== currentUser?._id && (
                                <button
                                  onClick={() => { openDeleteModal(msg._id, false); setOpenMessageMenu(null); }}
                                  className="menu-item menu-item-danger"
                                >
                                  🗑️ Delete for me
                                </button>
                              )}
                              {/* Admin can also delete for all */}
                              {isAdmin && msg.sender?.id !== currentUser?._id && (
                                <button
                                  onClick={() => { openDeleteModal(msg._id, true); setOpenMessageMenu(null); }}
                                  className="menu-item menu-item-danger"
                                >
                                  🛡️ Mod Delete
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {typingUsers.size > 0 && (
                <div className="lounge-typing-indicator">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span className="typing-text">
                    {typingUsers.size === 1
                      ? 'Someone is typing...'
                      : `${typingUsers.size} people are typing...`}
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <form className="lounge-input-container" onSubmit={handleSendMessage}>
          {showCWInput && (
            <div className="lounge-cw-input">
              <input
                type="text"
                placeholder="Content warning (optional)"
                value={contentWarning}
                onChange={(e) => setContentWarning(e.target.value)}
                maxLength={50}
                className="lounge-cw-field"
              />
              <button
                type="button"
                className="lounge-cw-close"
                onClick={() => {
                  setShowCWInput(false);
                  setContentWarning('');
                }}
              >
                ✕
              </button>
            </div>
          )}

          {selectedGif && (
            <div className="lounge-gif-preview">
              <img src={selectedGif} alt="Selected GIF" />
              <button
                type="button"
                className="lounge-gif-remove"
                onClick={() => setSelectedGif(null)}
              >
                ✕
              </button>
            </div>
          )}

          <div className="lounge-input-row">
            <button
              type="button"
              className="lounge-cw-btn"
              onClick={() => setShowCWInput(!showCWInput)}
              title="Add content warning"
            >
              CW
            </button>

            <button
              type="button"
              className="lounge-gif-btn"
              onClick={() => setShowGifPicker(!showGifPicker)}
              title="Add GIF"
            >
              GIF
            </button>

            <input
              type="text"
              placeholder={selectedGif ? "Add a caption (optional)..." : "Type a message..."}
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              maxLength={2000}
              className="lounge-input"
              disabled={sending}
            />

            <button
              type="submit"
              className="lounge-send-btn"
              disabled={(!newMessage.trim() && !selectedGif) || sending}
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>

          {showGifPicker && (
            <GifPicker
              onGifSelect={(gifUrl) => {
                setSelectedGif(gifUrl);
                setShowGifPicker(false);
              }}
              onClose={() => setShowGifPicker(false)}
            />
          )}

          {newMessage.length > 1800 && (
            <div className="lounge-char-count">
              {newMessage.length} / 2000 characters
            </div>
          )}
        </form>
      </div>

      {/* Online Users Modal (for privileged users) */}
      {showOnlineUsersModal && (
        <div className="modal-overlay" onClick={closeOnlineUsersModal}>
          <div className="modal-content online-users-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Online Members ({onlineUsers.length})</h2>
              <button type="button" className="modal-close" onClick={closeOnlineUsersModal}>✕</button>
            </div>

            <div className="modal-body">
              {loadingOnlineUsers ? (
                <div className="loading-state">Loading...</div>
              ) : onlineUsers.length === 0 ? (
                <div className="empty-state">No users online</div>
              ) : (
                <div className="online-users-list">
                  {onlineUsers.map(user => (
                    <div key={user.id} className="online-user-item">
                      <div className="online-user-avatar">
                        {user.avatar ? (
                          <img src={getImageUrl(user.avatar)} alt={user.displayName} />
                        ) : (
                          <div className="avatar-placeholder">
                            {user.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="online-indicator-small"></span>
                      </div>
                      <div className="online-user-info">
                        <div className="online-user-name">
                          {user.displayName}
                          {user.role !== 'user' && (
                            <span className={`role-badge role-${user.role}`}>
                              {user.role === 'super_admin' ? 'Super Admin' :
                               user.role === 'admin' ? 'Admin' :
                               user.role === 'moderator' ? 'Moderator' : ''}
                            </span>
                          )}
                        </div>
                        <div className="online-user-username">@{user.username}</div>
                      </div>
                      <button
                        type="button"
                        className="btn-message-user"
                        onClick={() => {
                          handleMessageUser(user.id);
                          closeOnlineUsersModal();
                        }}
                      >
                        Message
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Message Confirmation Modal */}
      {deleteModalOpen && (
        <div className="modal-overlay" onClick={() => setDeleteModalOpen(false)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Message</h3>
            <p>How would you like to delete this message?</p>
            <div className="delete-modal-actions">
              {(deleteIsSender || isAdmin) && (
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
  );
}

export default Lounge;


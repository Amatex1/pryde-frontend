// src/utils/socket.js
import { io } from "socket.io-client";
import API_CONFIG from "../config/api";
import logger from './logger';
import { emitValidated } from './emitValidated';

const SOCKET_URL = API_CONFIG.SOCKET_URL;

let socket = null;
let isLoggingOut = false; // Flag to prevent reconnection during logout
let connectionReady = false; // 🔥 NEW: Track if room join is confirmed
let messageQueue = []; // 🔥 NEW: Queue for messages when socket not ready
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

// 🔥 NEW: Helper to get userId from JWT token
const getUserIdFromToken = () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;

        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId;
    } catch (error) {
        logger.error('Error extracting userId from token:', error);
        return null;
    }
};

// 🔥 NEW: Process queued messages when connection is ready
const processMessageQueue = () => {
    logger.debug(`📬 Processing ${messageQueue.length} queued messages`);

    while (messageQueue.length > 0) {
        const { event, data, callback } = messageQueue.shift();
        if (socket && socket.connected) {
            socket.emit(event, data, callback);
        } else {
            logger.warn('⚠️ Socket disconnected while processing queue, re-queuing message');
            messageQueue.unshift({ event, data, callback });
            break;
        }
    }
};

// Initialize socket with userId (Blink expects this)
// Returns socket instance or null (never undefined)
export const initializeSocket = (userId) => {
    const result = connectSocket(userId);
    // Ensure we never return undefined - always return null or socket
    return result !== undefined ? result : null;
};

// Connect socket
export const connectSocket = (userId) => {
    // 🔥 CRITICAL: Don't reconnect if we're logging out
    if (isLoggingOut) {
        logger.debug('🚫 Skipping socket connection - logout in progress');
        return null;
    }

    if (!socket) {
        // Get JWT token from localStorage
        const token = localStorage.getItem('token');

        // 🔥 FIX: Removed 15-minute token age check - it was blocking socket connections
        // The actual JWT expiry is handled by the server. If the token is invalid,
        // the server will reject the connection and we'll get a connect_error.
        if (!token) {
            logger.warn('⚠️ No token found, cannot connect socket');
            return null;
        }

        logger.debug('🔌 Connecting socket (userId from JWT)');
        logger.debug('🔑 Token exists:', !!token);
        logger.debug('🔑 Token preview:', token ? token.substring(0, 20) + '...' : 'null');

        socket = io(SOCKET_URL, {
            // 🔥 ENHANCED: WebSocket primary with polling fallback for reliability
            transports: ['websocket', 'polling'],
            // ✅ Send JWT via auth object (NOT query params)
            auth: {
                token: token
            },
            // ✅ Reconnection settings
            reconnection: true,
            reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            // 🔥 CHANGED: Allow upgrade from polling to websocket
            forceNew: false,
            upgrade: true,
            rememberUpgrade: true,
            withCredentials: true,
            // ✅ Enhanced stability settings
            autoConnect: true,
            randomizationFactor: 0.5,
            closeOnBeforeunload: false,
            // ✅ Connection state recovery (matches server config)
            ackTimeout: 10000,
            retries: 3
        });

        // Add connection event listeners
        socket.on('connect', () => {
            logger.debug('✅ Socket connected successfully!');
            logger.debug('🔌 Transport:', socket.io.engine.transport.name);
            logger.debug('🆔 Socket ID:', socket.id);
            reconnectAttempts = 0;
            lastPongTime = Date.now(); // Reset pong timer

            // 🔥 DIAGNOSTIC: Log transport type
            if (socket.io.engine.transport.name === 'polling') {
                console.warn('⚠️ Using POLLING transport - will upgrade to WebSocket if possible');
            } else {
                console.log('✅ Using WebSocket transport (fast, real-time)');
            }

            // 🔥 NEW: Re-join user room on connect
            const tokenUserId = getUserIdFromToken();
            if (tokenUserId) {
                logger.debug(`🔄 Joining user room: user_${tokenUserId}`);
                socket.emit('join', tokenUserId);

                // Verify connection after 1 second
                setTimeout(() => {
                    if (socket && socket.connected) {
                        socket.emit('ping', (response) => {
                            logger.debug('🏓 Ping response:', response);
                            lastPongTime = Date.now();
                        });
                    }
                }, 1000);
            }

            // 🏥 Start health monitoring
            startHealthMonitoring();
        });

        // 🔥 NEW: Listen for room join confirmation
        socket.on('room:joined', (data) => {
            logger.debug('✅ Room joined:', data);
            connectionReady = true;

            // Process any queued messages
            processMessageQueue();
        });

        socket.on('room:error', (error) => {
            logger.error('❌ Room join error:', error);
            connectionReady = false;
        });

        // 🔥 FIX: Fallback timer to process queue even if room:joined is missed
        // This prevents messages from getting stuck in queue forever
        let queueProcessTimeout = null;
        socket.on('connect', () => {
            // Clear any existing timeout
            if (queueProcessTimeout) {
                clearTimeout(queueProcessTimeout);
            }

            // Set fallback timer - if room not joined in 3 seconds, force process queue
            queueProcessTimeout = setTimeout(() => {
                if (!connectionReady && messageQueue.length > 0) {
                    logger.warn('⚠️ Room join confirmation not received, force processing queue');
                    // Mark as ready anyway to prevent infinite waiting
                    connectionReady = true;
                    processMessageQueue();
                }
            }, 3000);
        });

        // DEV WARNING: Detect deprecated event names (Phase R)
        // These events should no longer be emitted by the server
        if (process.env.NODE_ENV === 'development') {
            socket.on('new_message', () => {
                console.warn('[Socket] ⚠️ Deprecated event received: "new_message". Server should emit "message:new" instead.');
            });
            socket.on('newMessage', () => {
                console.warn('[Socket] ⚠️ Deprecated event received: "newMessage". Server should emit "message:new" instead.');
            });
            socket.on('message_sent', () => {
                console.warn('[Socket] ⚠️ Deprecated event received: "message_sent". Server should emit "message:sent" instead.');
            });
        }

        socket.on('connect_error', (error) => {
            logger.error('❌ Socket connection error:', error.message);
            console.error('❌ Socket connection error:', error);

            // 🔥 DIAGNOSTIC: Log detailed error info for debugging
            if (error.message.includes('timeout')) {
                logger.error('⏱️ Socket authentication timeout - backend may be slow or down');
                console.error('⏱️ This usually means the backend is not responding or CORS is blocking the request');
            } else if (error.message.includes('Authentication')) {
                logger.error('🔑 Socket authentication failed - token may be invalid');
                console.error('🔑 Check if your JWT token is valid and not expired');
            } else if (error.message.includes('websocket')) {
                console.error('🔌 WebSocket connection failed!');
                console.error('Possible causes:');
                console.error('1. Cloudflare Pages blocking WebSocket');
                console.error('2. CORS not allowing WebSocket upgrade');
                console.error('3. Backend not accepting WebSocket connections');
                console.error('4. Firewall/proxy blocking WebSocket');
            }

            // 🔥 CRITICAL: If we're logging out, stop reconnection attempts
            if (isLoggingOut) {
                logger.debug('🚫 Stopping reconnection - logout in progress');
                socket.io.opts.reconnection = false;
                socket.disconnect();
            }
        });

        socket.on('disconnect', (reason) => {
            logger.debug('🔌 Socket disconnected:', reason);
            connectionReady = false; // 🔥 Reset connection ready state

            // 🏥 Stop health monitoring when disconnected
            stopHealthMonitoring();

            // 🔥 CRITICAL: If we're logging out, prevent reconnection
            if (isLoggingOut) {
                logger.debug('🚫 Preventing reconnection - logout in progress');
                socket.io.opts.reconnection = false;
            }
        });

        // ✅ Enhanced stability: Handle reconnection attempts
        socket.io.on('reconnect_attempt', (attemptNumber) => {
            logger.debug(`🔄 Reconnection attempt #${attemptNumber}`);
            reconnectAttempts = attemptNumber;
        });

        socket.io.on('reconnect', (attemptNumber) => {
            logger.debug(`✅ Reconnected after ${attemptNumber} attempts`);
            reconnectAttempts = 0;

            // Re-join user room on reconnect
            const tokenUserId = getUserIdFromToken();
            if (tokenUserId) {
                logger.debug(`🔄 Re-joining user room after reconnect: user_${tokenUserId}`);
                socket.emit('join', tokenUserId);
            }
        });

        socket.io.on('reconnect_error', (error) => {
            logger.error('❌ Reconnection error:', error.message);
        });

        socket.io.on('reconnect_failed', () => {
            logger.error('❌ Reconnection failed - max attempts reached');
            connectionReady = false;
        });

        // ✅ Enhanced stability: Handle transport changes
        socket.io.engine.on('upgrade', (transport) => {
            logger.debug(`⬆️ Transport upgraded to: ${transport.name}`);
        });

        socket.io.engine.on('upgradeError', (error) => {
            logger.warn('⚠️ Transport upgrade error:', error.message);
        });

        // Listen for force logout (session terminated from another device or manual logout)
        socket.on('force_logout', (data) => {
            logger.debug('🚪 Force logout received:', data.reason);

            // 🔥 CRITICAL: Set logout flag to prevent reconnection
            isLoggingOut = true;

            // Disable reconnection immediately
            if (socket) {
                socket.io.opts.reconnection = false;
                socket.disconnect();
                socket = null;
            }

            // Clear all auth state
            localStorage.removeItem('token');
            localStorage.removeItem('tokenSetTime');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            sessionStorage.clear();

            // Show message if not a final logout (from another device)
            if (!data.final) {
                alert(`You have been logged out: ${data.reason}`);
            }

            // Redirect to login
            window.location.href = '/login';
        });

        // Log transport upgrades
        if (socket.io && socket.io.engine && typeof socket.io.engine.on === 'function') {
            socket.io.engine.on('upgrade', (transport) => {
                logger.debug('⬆️ Socket upgraded to:', transport.name);
            });
        }

        // Handle page visibility changes for bfcache compatibility
        // IMPORTANT: Close WebSocket BEFORE page is cached to allow bfcache
        const handlePageHide = (event) => {
            // Always disconnect on pagehide to allow bfcache
            logger.debug('📦 Page hiding, disconnecting socket for bfcache');
            if (socket && socket.connected) {
                socket.disconnect();
            }
        };

        const handlePageShow = (event) => {
            if (event.persisted) {
                // Page restored from cache, reconnect socket
                logger.debug('📦 Page restored from cache, reconnecting socket');
                if (socket && !socket.connected) {
                    socket.connect();
                }
            }
        };

        // Use 'pagehide' instead of 'beforeunload' for better bfcache support
        window.addEventListener('pagehide', handlePageHide, { capture: true });
        window.addEventListener('pageshow', handlePageShow, { capture: true });

        // 🔧 DEBUG: Expose socket to window for debugging
        if (typeof window !== 'undefined') {
            window.socket = socket;
            logger.debug('✅ Socket exposed to window.socket for debugging');
        }
    }
    return socket;
};

// Disconnect socket
export const disconnectSocket = () => {
    if (socket) {
        logger.debug('🔌 Disconnecting socket');
        socket.disconnect();
        socket = null;
    }
    connectionReady = false;
    messageQueue = [];
};

// 🔥 NEW: Disconnect socket for logout (prevents reconnection)
export const disconnectSocketForLogout = () => {
    logger.debug('🚪 Disconnecting socket for logout');

    // Set logout flag to prevent reconnection
    isLoggingOut = true;
    connectionReady = false;
    messageQueue = [];

    if (socket) {
        // Disable reconnection
        socket.io.opts.reconnection = false;

        // Disconnect
        socket.disconnect();
        socket = null;
    }
};

// 🔥 NEW: Reset logout flag (for testing or re-login)
export const resetLogoutFlag = () => {
    isLoggingOut = false;
    connectionReady = false;
    messageQueue = [];
    logger.debug('🔄 Logout flag reset');
};

// Get socket instance
export const getSocket = () => socket;

// Check if socket is connected
export const isSocketConnected = () => socket && socket.connected;

// 🔥 NEW: Check if connection is fully ready (room joined)
export const isConnectionReady = () => connectionReady;

// 🔥 NEW: Get message queue length (for debugging)
export const getMessageQueueLength = () => messageQueue.length;

// -----------------------------
// CONNECTION HEALTH MONITORING
// -----------------------------

let healthCheckInterval = null;
let lastPongTime = Date.now();
const PING_INTERVAL = 15000; // 15 seconds
const PONG_TIMEOUT = 30000; // 30 seconds - if no pong received, consider connection dead

/**
 * Start health monitoring - sends periodic pings to verify connection
 */
export const startHealthMonitoring = () => {
    if (healthCheckInterval) {
        logger.debug('⚠️ Health monitoring already running');
        return;
    }

    logger.debug('🏥 Starting connection health monitoring');

    healthCheckInterval = setInterval(() => {
        if (!socket || !socket.connected) {
            logger.debug('⚠️ Health check: socket not connected');
            return;
        }

        // Check if last pong was too long ago
        const timeSinceLastPong = Date.now() - lastPongTime;
        if (timeSinceLastPong > PONG_TIMEOUT) {
            logger.warn('❌ Connection unhealthy: no pong received in 30s, reconnecting...');
            // Force reconnection
            socket.disconnect();
            socket.connect();
            return;
        }

        // Send ping
        socket.emit('ping', (response) => {
            if (response && response.status === 'ok') {
                lastPongTime = Date.now();
                logger.debug('🏓 Pong received, connection healthy');
            } else {
                logger.warn('⚠️ Unexpected ping response:', response);
            }
        });
    }, PING_INTERVAL);
};

/**
 * Stop health monitoring
 */
export const stopHealthMonitoring = () => {
    if (healthCheckInterval) {
        logger.debug('🏥 Stopping connection health monitoring');
        clearInterval(healthCheckInterval);
        healthCheckInterval = null;
    }
};

/**
 * Get connection health status
 */
export const getConnectionHealth = () => {
    const timeSinceLastPong = Date.now() - lastPongTime;
    return {
        isHealthy: socket && socket.connected && timeSinceLastPong < PONG_TIMEOUT,
        lastPongTime,
        timeSinceLastPong,
        isConnected: socket && socket.connected,
        isReady: connectionReady,
        queueLength: messageQueue.length
    };
};

// -----------------------------
// MESSAGES (Phase R: Unified event naming + Validated emits + ACK)
// -----------------------------

/**
 * Send a message with ACK callback support, automatic retries, and error handling
 * @param {Object} data - Message data
 * @param {Function} callback - Optional callback for ACK response
 * @param {Number} retryCount - Internal retry counter (do not set manually)
 */
export const sendMessage = (data, callback, retryCount = 0) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 second

    const messagePayload = {
        ...data,
        _tempId: data._tempId || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // If socket not ready, queue the message
    if (!socket || !socket.connected) {
        logger.warn('⚠️ Socket not connected, queuing message');
        messageQueue.push({ event: 'send_message', data: messagePayload, callback });

        // Notify callback of queued status
        if (typeof callback === 'function') {
            callback({
                success: false,
                queued: true,
                message: 'Message queued - socket not connected'
            });
        }
        return;
    }

    // If connection not fully ready (room not joined), queue the message
    if (!connectionReady) {
        logger.warn('⚠️ Connection not ready (room not joined), queuing message');
        messageQueue.push({ event: 'send_message', data: messagePayload, callback });

        // Notify callback of queued status
        if (typeof callback === 'function') {
            callback({
                success: false,
                queued: true,
                message: 'Message queued - room not joined'
            });
        }
        return;
    }

    logger.debug('📤 Emitting send_message with ACK (attempt ' + (retryCount + 1) + '):', messagePayload);

    // Set timeout for ACK response
    const ackTimeout = setTimeout(() => {
        logger.error('❌ Message ACK timeout - no response from server');

        // Retry if under max retries
        if (retryCount < MAX_RETRIES) {
            logger.warn(`🔄 Retrying message send (${retryCount + 1}/${MAX_RETRIES})...`);
            setTimeout(() => {
                sendMessage(data, callback, retryCount + 1);
            }, RETRY_DELAY * (retryCount + 1)); // Exponential backoff
        } else {
            // Max retries reached, call callback with error
            if (typeof callback === 'function') {
                callback({
                    success: false,
                    error: 'ACK_TIMEOUT',
                    message: 'Failed to send message after ' + MAX_RETRIES + ' retries',
                    _tempId: messagePayload._tempId
                });
            }
        }
    }, 10000); // 10 second timeout

    // Use socket.emit with callback for ACK
    socket.emit('send_message', messagePayload, (response) => {
        // Clear timeout since we got a response
        clearTimeout(ackTimeout);

        if (response) {
            if (response.success) {
                logger.debug('✅ Message ACK received:', response);
            } else if (response.error) {
                logger.error('❌ Message ACK error:', response);

                // Retry on certain error types
                const retryableErrors = ['VALIDATION_ERROR', 'SEND_MESSAGE_ERROR'];
                if (retryableErrors.includes(response.code) && retryCount < MAX_RETRIES) {
                    logger.warn(`🔄 Retrying message send due to ${response.code} (${retryCount + 1}/${MAX_RETRIES})...`);
                    setTimeout(() => {
                        sendMessage(data, callback, retryCount + 1);
                    }, RETRY_DELAY * (retryCount + 1));
                    return; // Don't call callback yet, we're retrying
                }
            }
        }

        // Call the provided callback
        if (typeof callback === 'function') {
            callback(response || {
                success: false,
                error: 'NO_RESPONSE',
                message: 'No response from server'
            });
        }
    });
};

/**
 * Listen for message sent confirmation (message:sent)
 * Phase R: Unified to 'message:sent' event
 */
export const onMessageSent = (callback) => {
    if (socket && typeof socket.on === 'function') {
        // UNIFIED: Listen to 'message:sent' (Phase R)
        socket.on("message:sent", callback);
        logger.debug('✅ [onMessageSent] Listener attached for message:sent');
    } else {
        // 🔥 CRITICAL: Log when listener fails to attach
        console.error('❌ [onMessageSent] FAILED to attach listener - socket is null or invalid!', {
            socketExists: !!socket,
            hasOnMethod: socket && typeof socket.on === 'function'
        });
    }
    // Return cleanup function
    return () => {
        if (socket && typeof socket.off === 'function') {
            socket.off("message:sent", callback);
        }
    };
};

/**
 * Listen for new messages (message:new)
 * Phase R: Unified to 'message:new' event
 */
export const onNewMessage = (callback) => {
    if (socket && typeof socket.on === 'function') {
        // UNIFIED: Listen to 'message:new' (Phase R)
        socket.on("message:new", callback);
        logger.debug('✅ [onNewMessage] Listener attached for message:new');
    } else {
        // 🔥 CRITICAL: Log when listener fails to attach
        console.error('❌ [onNewMessage] FAILED to attach listener - socket is null or invalid!', {
            socketExists: !!socket,
            hasOnMethod: socket && typeof socket.on === 'function'
        });
    }
    // Return cleanup function
    return () => {
        if (socket && typeof socket.off === 'function') {
            socket.off("message:new", callback);
        }
    };
};

// -----------------------------
// TYPING INDICATOR
// -----------------------------
export const emitTyping = (conversationId, userId) => {
    if (socket) emitValidated(socket, "typing", { recipientId: conversationId, isTyping: true, userId });
};

export const onUserTyping = (callback) => {
    if (socket && typeof socket.on === 'function') {
        // Don't remove previous listeners - allow multiple components to listen
        socket.on("typing", callback);
    }
    // Return cleanup function
    return () => {
        if (socket && typeof socket.off === 'function') {
            socket.off("typing", callback);
        }
    };
};

// -----------------------------
// FRIEND REQUESTS
// -----------------------------
export const emitFriendRequestSent = (data) => {
    if (socket) emitValidated(socket, "friend_request_sent", data);
};

export const emitFriendRequestAccepted = (data) => {
    if (socket) emitValidated(socket, "friend_request_accepted", data);
};

export const onFriendRequestReceived = (callback) => {
    if (socket && typeof socket.on === 'function') {
        socket.on("friendRequestReceived", callback);
        return () => {
            if (socket && typeof socket.off === 'function') {
                socket.off("friendRequestReceived", callback);
            }
        };
    }
    return () => {};
};

export const onFriendRequestAccepted = (callback) => {
    if (socket && typeof socket.on === 'function') {
        socket.on("friendRequestAccepted", callback);
        return () => {
            if (socket && typeof socket.off === 'function') {
                socket.off("friendRequestAccepted", callback);
            }
        };
    }
    return () => {};
};

// -----------------------------
// ONLINE STATUS
// -----------------------------
// Request online users list from server
export const requestOnlineUsers = () => {
    if (socket && socket.connected) {
        logger.debug('📡 Requesting online users list from server');
        emitValidated(socket, 'get_online_users', {});
    } else {
        logger.warn('⚠️ Cannot request online users - socket not connected');
    }
};

export const onUserOnline = (callback) => {
    if (socket && typeof socket.on === 'function') {
        // Create a named handler function so we can remove it later
        const handler = (data) => {
            logger.debug('🔌 Socket received user_online event:', data);
            callback(data);
        };
        socket.on("user_online", handler);

        // Return cleanup function that removes THIS specific handler
        return () => {
            if (socket && typeof socket.off === 'function') {
                socket.off("user_online", handler);
            }
        };
    }
    return () => {}; // Return empty cleanup if no socket
};

export const onUserOffline = (callback) => {
    if (socket && typeof socket.on === 'function') {
        // Create a named handler function so we can remove it later
        const handler = (data) => {
            logger.debug('🔌 Socket received user_offline event:', data);
            callback(data);
        };
        socket.on("user_offline", handler);

        // Return cleanup function that removes THIS specific handler
        return () => {
            if (socket && typeof socket.off === 'function') {
                socket.off("user_offline", handler);
            }
        };
    }
    return () => {}; // Return empty cleanup if no socket
};

export const onOnlineUsers = (callback) => {
    if (socket && typeof socket.on === 'function') {
        // Create a named handler function so we can remove it later
        const handler = (users) => {
            logger.debug('🔌 Socket received online_users event:', users);
            callback(users);
        };
        socket.on("online_users", handler);

        // Return cleanup function that removes THIS specific handler
        return () => {
            if (socket && typeof socket.off === 'function') {
                socket.off("online_users", handler);
            }
        };
    }
    return () => {}; // Return empty cleanup if no socket
};

export default {
    initializeSocket,
    connectSocket,
    disconnectSocket,
    disconnectSocketForLogout,
    resetLogoutFlag,
    getSocket,
    isSocketConnected,
    isConnectionReady,
    getMessageQueueLength,
    startHealthMonitoring,
    stopHealthMonitoring,
    getConnectionHealth,
    sendMessage,
    onMessageSent,
    onNewMessage,
    emitTyping,
    onUserTyping,
    emitFriendRequestSent,
    emitFriendRequestAccepted,
    onFriendRequestReceived,
    onFriendRequestAccepted,
    requestOnlineUsers,
    onUserOnline,
    onUserOffline,
    onOnlineUsers
};

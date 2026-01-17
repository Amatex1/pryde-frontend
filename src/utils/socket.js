// src/utils/socket.js
import { io } from "socket.io-client";
import API_CONFIG from "../config/api";
import logger from './logger';
import { emitValidated } from './emitValidated';

const SOCKET_URL = API_CONFIG.SOCKET_URL;

// 🔥 PROD DEBUG: Log when this module is loaded
console.log('📦 [socket.js] Module loaded. SOCKET_URL:', SOCKET_URL);

let socket = null;

// 🔒 CANONICAL LIVE SOCKET REFERENCE (prevents stale emits)
// This ref object always points to the current active socket
// Even if 'socket' variable gets out of sync, socketRef.current is authoritative
const socketRef = { current: null };

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
    // 🔥 PROD DEBUG: Use console.warn to show in production
    console.warn(`📬 [Queue] Processing ${messageQueue.length} queued messages`);

    while (messageQueue.length > 0) {
        const { event, data, callback } = messageQueue.shift();
        if (socket && socket.connected) {
            console.warn(`📬 [Queue] Sending queued message:`, event, data?._tempId);
            socket.emit(event, data, callback);
        } else {
            console.warn('⚠️ [Queue] Socket disconnected while processing, re-queuing');
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
    // 🔥 PROD DEBUG: Always log this
    console.log('🔌 [connectSocket] Called with userId:', userId);

    // 🔥 CRITICAL: Don't reconnect if we're logging out
    if (isLoggingOut) {
        console.log('🚫 [connectSocket] Skipping - logout in progress');
        return null;
    }

    if (!socket) {
        // Get JWT token from localStorage
        const token = localStorage.getItem('token');
        console.log('🔑 [connectSocket] Token exists:', !!token);

        // 🔥 FIX: Removed 15-minute token age check - it was blocking socket connections
        // The actual JWT expiry is handled by the server. If the token is invalid,
        // the server will reject the connection and we'll get a connect_error.
        if (!token) {
            console.error('❌ [connectSocket] No token found, cannot connect');
            return null;
        }

        console.log('🔌 [connectSocket] Creating new socket connection to:', SOCKET_URL);

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

        // 🔒 CRITICAL: Update socketRef to point to the new socket
        socketRef.current = socket;
        console.warn('🔒 [Socket] socketRef.current updated to:', socket.id || 'pending');

        // Add connection event listeners
        socket.on('connect', () => {
            // 🔒 CRITICAL: Update socketRef on every connect (including reconnects)
            socketRef.current = socket;
            console.warn('🔒 [Socket] socketRef.current confirmed:', socket.id);
            // 🔥 PROD DEBUG: Use console.warn to show in production
            console.warn('🔌 [Socket] Connected! ID:', socket.id);
            console.warn('🔌 [Socket] Transport:', socket.io.engine.transport.name);
            reconnectAttempts = 0;
            lastPongTime = Date.now(); // Reset pong timer

            // 🔥 DIAGNOSTIC: Log transport type
            if (socket.io.engine.transport.name === 'polling') {
                console.warn('⚠️ Using POLLING transport - will upgrade to WebSocket if possible');
            } else {
                console.warn('✅ Using WebSocket transport (fast, real-time)');
            }

            // 🔥 NEW: Re-join user room on connect
            const tokenUserId = getUserIdFromToken();
            console.warn('🔌 [Socket] User ID from token:', tokenUserId);
            if (tokenUserId) {
                console.warn(`🔌 [Socket] Emitting 'join' for user room: user_${tokenUserId}`);
                socket.emit('join', tokenUserId);

                // Verify connection after 1 second
                setTimeout(() => {
                    if (socket && socket.connected) {
                        socket.emit('ping', (response) => {
                            console.warn('🏓 [Socket] Ping response:', response);
                            lastPongTime = Date.now();
                        });
                    }
                }, 1000);
            } else {
                console.error('❌ [Socket] No userId from token! Messages will fail.');
            }

            // 🏥 Start health monitoring
            startHealthMonitoring();
        });

        // 🔥 NEW: Listen for room join confirmation
        socket.on('room:joined', (data) => {
            // 🔥 PROD DEBUG: Use console.warn to show in production
            console.warn('✅ [Socket] Room joined:', data);
            connectionReady = true;

            // Process any queued messages
            processMessageQueue();
        });

        socket.on('room:error', (error) => {
            console.error('❌ [Socket] Room join error:', error);
            connectionReady = false;
        });

        // 🔥 GLOBAL DEBUG: Listen for ALL message events to diagnose delivery
        socket.on('message:new', (msg) => {
            console.warn('📨 [Socket GLOBAL] message:new received!', {
                messageId: msg?._id,
                senderId: msg?.sender?._id,
                recipientId: msg?.recipient?._id,
                contentPreview: msg?.content?.substring(0, 50)
            });
        });

        socket.on('message:sent', (msg) => {
            console.warn('📨 [Socket GLOBAL] message:sent received!', {
                messageId: msg?._id,
                _tempId: msg?._tempId
            });
        });

        // 🔥 FIX: Fallback timer to set connectionReady even if room:joined is missed
        // This prevents messages from being rejected due to connectionReady being false
        let queueProcessTimeout = null;
        socket.on('connect', () => {
            // 🔥 PROD DEBUG: Use console.warn to show in production
            console.warn('🔌 [Socket] Connected event fired! socketId:', socket?.id);

            // Clear any existing timeout
            if (queueProcessTimeout) {
                clearTimeout(queueProcessTimeout);
            }

            // Set fallback timer - if room not joined in 3 seconds, force mark as ready
            queueProcessTimeout = setTimeout(() => {
                // 🔥 BUG FIX: Only set connectionReady if socket is STILL connected
                // Previously, if socket disconnected before timer fired, we'd set ready=true incorrectly
                if (!connectionReady && socket && socket.connected) {
                    console.warn('⚠️ [Socket] Room join not received after 3s, forcing connectionReady = true');
                    // Mark as ready anyway to prevent infinite waiting
                    connectionReady = true;
                    // Process any queued messages if they exist
                    if (messageQueue.length > 0) {
                        console.warn(`📬 [Socket] Processing ${messageQueue.length} queued messages after fallback`);
                        processMessageQueue();
                    }
                } else if (!connectionReady && (!socket || !socket.connected)) {
                    console.warn('⚠️ [Socket] Fallback timer fired but socket disconnected - not setting ready');
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
            // 🔥 PROD DEBUG: Use console.warn to show in production
            console.warn('🔌 [Socket] Disconnected! Reason:', reason);
            connectionReady = false; // 🔥 Reset connection ready state

            // 🏥 Stop health monitoring when disconnected
            stopHealthMonitoring();

            // 🔥 CRITICAL: If we're logging out, prevent reconnection
            if (isLoggingOut) {
                console.warn('🚫 [Socket] Preventing reconnection - logout in progress');
                socket.io.opts.reconnection = false;
            }
        });

        // ✅ Enhanced stability: Handle reconnection attempts
        socket.io.on('reconnect_attempt', (attemptNumber) => {
            logger.debug(`🔄 Reconnection attempt #${attemptNumber}`);
            reconnectAttempts = attemptNumber;

            // 🔥 CRITICAL: Update auth token on each reconnect attempt
            // This ensures we use the latest token if it was refreshed
            const freshToken = localStorage.getItem('token');
            if (freshToken && socket.auth) {
                socket.auth.token = freshToken;
                logger.debug('🔑 Updated socket auth token for reconnect');
            } else if (!freshToken) {
                logger.warn('⚠️ No token available for reconnect - connection will likely fail');
            }
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
    // 🔒 CRITICAL: Clear socketRef on disconnect
    socketRef.current = null;
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
    // 🔒 CRITICAL: Clear socketRef on logout
    socketRef.current = null;
};

// 🔥 NEW: Reset logout flag (for testing or re-login)
export const resetLogoutFlag = () => {
    isLoggingOut = false;
    connectionReady = false;
    messageQueue = [];
    logger.debug('🔄 Logout flag reset');
};

// Get socket instance - 🔒 ALWAYS return socketRef.current (canonical reference)
export const getSocket = () => socketRef.current || socket;

// Check if socket is connected - 🔒 Use socketRef.current
export const isSocketConnected = () => {
    const activeSocket = socketRef.current || socket;
    return activeSocket && activeSocket.connected;
};

// 🔥 NEW: Check if connection is fully ready (room joined)
export const isConnectionReady = () => connectionReady;

// 🔥 NEW: Get message queue length (for debugging)
export const getMessageQueueLength = () => messageQueue.length;

// -----------------------------
// CONNECTION HEALTH MONITORING
// -----------------------------

let healthCheckInterval = null;
let lastPongTime = Date.now();
let missedPongs = 0;
const PING_INTERVAL = 30000; // 🔥 CHANGED: 30 seconds (was 15s) - less aggressive
const PONG_TIMEOUT = 60000; // 🔥 CHANGED: 60 seconds (was 30s) - more tolerant
const MAX_MISSED_PONGS = 2; // 🔥 NEW: Only force reconnect after 2 consecutive misses

/**
 * Start health monitoring - sends periodic pings to verify connection
 * 🔥 FIX: Made less aggressive to prevent unnecessary disconnects
 */
export const startHealthMonitoring = () => {
    if (healthCheckInterval) {
        logger.debug('⚠️ Health monitoring already running');
        return;
    }

    logger.debug('🏥 Starting connection health monitoring (30s interval)');
    lastPongTime = Date.now(); // Reset on start
    missedPongs = 0;

    healthCheckInterval = setInterval(() => {
        if (!socket || !socket.connected) {
            logger.debug('⚠️ Health check: socket not connected');
            return;
        }

        // Check if last pong was too long ago
        const timeSinceLastPong = Date.now() - lastPongTime;
        if (timeSinceLastPong > PONG_TIMEOUT) {
            missedPongs++;
            console.warn(`⚠️ Health check: missed pong #${missedPongs}, time since last: ${timeSinceLastPong}ms`);

            if (missedPongs >= MAX_MISSED_PONGS) {
                logger.warn('❌ Connection unhealthy: multiple missed pongs, reconnecting...');
                console.warn('❌ Connection unhealthy: forcing reconnect');
                missedPongs = 0;
                // Force reconnection via Socket.IO's reconnect mechanism (not disconnect/connect)
                socket.io.engine.close();
                return;
            }
        }

        // Send ping with timeout protection
        let pingAcked = false;
        const pingTimeout = setTimeout(() => {
            if (!pingAcked) {
                console.warn('⚠️ Ping timeout - no response after 10s');
                // Don't increment missedPongs on first timeout - connection might still be okay
            }
        }, 10000);

        socket.emit('ping', (response) => {
            pingAcked = true;
            clearTimeout(pingTimeout);

            // 🔥 FIX: Accept null response if socket is still connected
            // Some edge cases return null but connection is actually fine
            if (response && response.status === 'ok') {
                lastPongTime = Date.now();
                missedPongs = 0; // Reset on success
                logger.debug('🏓 Pong received, connection healthy');
            } else if (response === null && socket && socket.connected) {
                // Null response but socket is connected - reset pong time anyway
                console.warn('⚠️ Ping returned null but socket connected - treating as healthy');
                lastPongTime = Date.now();
                missedPongs = 0;
            } else {
                missedPongs++;
                console.warn('⚠️ Unexpected ping response:', response, 'missedPongs:', missedPongs);
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
    const RETRY_DELAY = 1000;

    // 🔒 Force JSON-serialisable payload to prevent Socket.IO serialization failures
    let safeData;
    try {
        safeData = JSON.parse(JSON.stringify(data));
    } catch (err) {
        console.error('❌ [sendMessage] Payload is not serializable', data, err);
        if (typeof callback === 'function') {
            callback({
                success: false,
                error: 'INVALID_MESSAGE_PAYLOAD',
                message: 'Message data contains non-serializable values'
            });
        }
        return;
    }

    const messagePayload = {
        ...safeData,
        _tempId: safeData._tempId || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // Check transport state (no blocking alerts!)
    const transport = socket?.io?.engine?.transport;
    const transportName = transport?.name || 'unknown';
    const wsReadyState = transport?.ws?.readyState;

    // 🔥 FIX: WebSocket readyState 1 = OPEN, but also accept if socket.connected is true
    // The socket.connected property is the most reliable indicator
    // Transport check is a secondary validation
    const isTransportOpen =
        socket?.connected || // Primary check - Socket.IO's own connected state
        transportName === 'polling' || // Polling transport is always "open"
        (transportName === 'websocket' && wsReadyState === 1); // WebSocket open

    console.log('🔍 [sendMessage] Transport check:', {
        socketExists: !!socket,
        socketConnected: socket?.connected,
        transportName,
        wsReadyState,
        isTransportOpen,
        connectionReady
    });

    // If socket not connected, queue and let Socket.IO handle reconnection
    if (!socket || !socket.connected) {
        console.warn('⚠️ [sendMessage] Socket not connected! socket:', !!socket, 'connected:', socket?.connected);

        // 🔥 FIX: Force reconnection attempt when socket is disconnected
        if (socket && !socket.connected) {
            console.warn('🔄 [sendMessage] Triggering reconnect...');
            // Check if Socket.IO is already reconnecting
            if (!socket.io.reconnecting) {
                socket.connect(); // Attempt to connect
            } else {
                console.warn('🔄 [sendMessage] Socket.IO already reconnecting, waiting...');
            }
        }

        messageQueue.push({ event: 'send_message', data: messagePayload, callback });
        if (typeof callback === 'function') {
            callback({ success: false, queued: true, message: 'Message queued - reconnecting' });
        }
        return;
    }

    // If connection not fully ready (room not joined), queue the message
    if (!connectionReady) {
        // 🔥 PROD DEBUG: Use console.warn to show in production
        console.warn('⚠️ [sendMessage] Room not joined yet, queuing message. socketId:', socket?.id, 'queueLength:', messageQueue.length + 1);
        messageQueue.push({ event: 'send_message', data: messagePayload, callback });
        if (typeof callback === 'function') {
            callback({ success: false, queued: true, message: 'Message queued - room not joined' });
        }
        return;
    }

    // 🔥 PROD DEBUG: Use console.warn for all send logging
    console.warn('📤 [sendMessage] Emitting attempt', retryCount + 1, 'of', MAX_RETRIES + 1);

    // 🔥 FIX: Increased ACK timeout to 30 seconds (was 10s)
    // Database operations + network latency can take time
    const ACK_TIMEOUT_MS = 30000;

    // Set up ACK timeout
    const ackTimeout = setTimeout(() => {
        console.error('❌ [sendMessage] ACK timeout after', ACK_TIMEOUT_MS, 'ms');
        if (retryCount < MAX_RETRIES) {
            console.warn('🔄 [sendMessage] Retrying...', retryCount + 1, 'of', MAX_RETRIES);
            setTimeout(() => sendMessage(data, callback, retryCount + 1), RETRY_DELAY * (retryCount + 1));
        } else {
            console.error('❌ [sendMessage] All retries exhausted');
            if (typeof callback === 'function') {
                callback({
                    success: false,
                    error: 'ACK_TIMEOUT',
                    message: 'Failed to send message after retries',
                    _tempId: messagePayload._tempId
                });
            }
        }
    }, ACK_TIMEOUT_MS);

    // Emit with ACK callback
    const emitTime = Date.now();

    // 🔒 CANONICAL: Use socketRef.current as the authoritative socket reference
    const refSocket = socketRef.current;
    const moduleSocket = socket;
    const windowSocket = typeof window !== 'undefined' ? window.socket : null;

    console.warn('📤 [sendMessage] Emitting send_message event at', new Date().toISOString());
    console.warn('📤 [sendMessage] Socket verification:', {
        refSocketId: refSocket?.id,
        moduleSocketId: moduleSocket?.id,
        windowSocketId: windowSocket?.id,
        refConnected: refSocket?.connected,
        moduleConnected: moduleSocket?.connected,
        windowConnected: windowSocket?.connected,
        allSame: refSocket === moduleSocket && moduleSocket === windowSocket,
        payload: {
            recipientId: messagePayload.recipientId,
            hasContent: !!messagePayload.content,
            tempId: messagePayload._tempId
        }
    });

    // 🔒 PRIORITY: socketRef.current > window.socket > module socket
    const socketToUse = (refSocket?.connected) ? refSocket
                      : (windowSocket?.connected) ? windowSocket
                      : moduleSocket;

    if (!socketToUse || !socketToUse.connected) {
        console.error('❌ [sendMessage] No valid socket available! Queuing message.');
        clearTimeout(ackTimeout);
        messageQueue.push({ event: 'send_message', data: messagePayload, callback });
        if (typeof callback === 'function') {
            callback({ success: false, queued: true, message: 'Message queued - socket unavailable' });
        }
        return;
    }

    console.warn('📤 [sendMessage] Using socket:', socketToUse.id, '(transport:', socketToUse.io?.engine?.transport?.name, ')');

    socketToUse.emit('send_message', messagePayload, (response) => {
        const ackTime = Date.now() - emitTime;
        clearTimeout(ackTimeout);
        console.warn('✅ [sendMessage] ACK received in', ackTime, 'ms:', response);
        if (typeof callback === 'function') {
            callback(response || { success: false, error: 'NO_RESPONSE' });
        }
    });
};

/**
 * Listen for message sent confirmation (message:sent)
 * Phase R: Unified to 'message:sent' event
 */
export const onMessageSent = (callback) => {
    // 🔥 DIAGNOSTIC: Always log to console for debugging
    console.log('🎧 [onMessageSent] Attaching listener...', {
        socketExists: !!socket,
        socketConnected: socket?.connected,
        socketId: socket?.id
    });

    if (socket && typeof socket.on === 'function') {
        // UNIFIED: Listen to 'message:sent' (Phase R)
        // 🔥 DIAGNOSTIC: Wrap callback to log when event is received
        const wrappedCallback = (data) => {
            console.log('📨 [onMessageSent] EVENT RECEIVED! message:sent:', data);
            callback(data);
        };
        socket.on("message:sent", wrappedCallback);
        logger.debug('✅ [onMessageSent] Listener attached for message:sent');
        console.log('✅ [onMessageSent] Listener attached for message:sent');

        // Return cleanup function
        return () => {
            console.log('🧹 [onMessageSent] Cleaning up listener');
            if (socket && typeof socket.off === 'function') {
                socket.off("message:sent", wrappedCallback);
            }
        };
    } else {
        // 🔥 CRITICAL: Log when listener fails to attach
        console.error('❌ [onMessageSent] FAILED to attach listener - socket is null or invalid!', {
            socketExists: !!socket,
            hasOnMethod: socket && typeof socket.on === 'function'
        });
        // Return no-op cleanup
        return () => {};
    }
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

// 🔥 GLOBAL DEBUG: Expose socket for console debugging
if (typeof window !== 'undefined') {
    window.__PRYDE_SOCKET__ = {
        getSocket: () => socket,
        isConnected: () => socket?.connected,
        isReady: () => connectionReady,
        queueLength: () => messageQueue.length,
        debug: () => {
            console.log('=== PRYDE SOCKET DEBUG ===');
            console.log('Socket exists:', !!socket);
            console.log('Socket connected:', socket?.connected);
            console.log('Socket ID:', socket?.id);
            console.log('Connection ready:', connectionReady);
            console.log('Queue length:', messageQueue.length);
            console.log('Transport:', socket?.io?.engine?.transport?.name);
            console.log('==========================');
            return { socket: !!socket, connected: socket?.connected, id: socket?.id, ready: connectionReady };
        }
    };
    console.log('🔧 Debug: window.__PRYDE_SOCKET__.debug() available');
}

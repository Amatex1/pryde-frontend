/**
 * SocketContext - Provides Socket.IO connection to all components
 *
 * CRITICAL: This context was missing, causing all socket functionality to fail
 *
 * Features:
 * - Manages single socket instance across the app
 * - Tracks online users
 * - Provides connection status
 * - Handles reconnection automatically
 * - Exposes socket to child components
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  getSocket,
  initializeSocket,
  isSocketConnected,
  isConnectionReady,
  disconnectSocketForLogout,
  resetLogoutFlag,
  getConnectionHealth
} from '../utils/socket';
import { useAuth } from './AuthContext';
import logger from '../utils/logger';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  // 🔐 RACE CONDITION FIX: Get isAuthReady to prevent premature socket init
  const { user, isAuthenticated, isAuthReady } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [connectionHealth, setConnectionHealth] = useState(null);
  const initializationRef = useRef(false);
  const reconnectTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 5;

  // Get user ID from user object
  const userId = user?.id || user?._id;

  // Ref to track which socket we've attached listeners to
  const attachedSocketRef = useRef(null);

  /**
   * Initialize socket connection
   */
  const initSocket = useCallback(() => {
    // 🔐 RACE CONDITION FIX: Check isAuthReady before attempting socket init
    if (!isAuthReady) {
      logger.debug('[SocketContext] Skipping - auth not ready yet');
      return;
    }

    if (!userId || !isAuthenticated) {
      logger.debug('[SocketContext] Skipping - no user or not authenticated');
      return;
    }

    if (initializationRef.current) {
      logger.debug('[SocketContext] Skipping - already initializing');
      return;
    }

    initializationRef.current = true;
    logger.debug('[SocketContext] Calling initializeSocket for user:', userId);

    try {
      const sock = initializeSocket(userId);
      logger.debug('[SocketContext] initializeSocket returned:', sock ? 'socket object' : 'null');

      if (sock) {
        setSocket(sock);
        setIsConnected(sock.connected);
        retryCountRef.current = 0; // Reset retry count on success

        // 🔥 FIX: Only attach listeners ONCE per socket instance
        // This prevents duplicate handlers when React re-renders
        if (attachedSocketRef.current !== sock) {
          attachedSocketRef.current = sock;

          // Listen for connection events
          sock.on('connect', () => {
            setIsConnected(true);
            clearTimeout(reconnectTimeoutRef.current);
          });

          sock.on('disconnect', () => {
            setIsConnected(false);
            setIsReady(false);
          });

          // Listen for room join confirmation
          sock.on('room:joined', () => {
            setIsReady(true);
          });

          // Listen for online users updates
          sock.on('online_users', (users) => {
            setOnlineUsers(users || []);
          });

          // Listen for presence updates
          sock.on('presence:update', ({ userId: onlineUserId, online }) => {
            setOnlineUsers(prev => {
              if (online) {
                return prev.includes(onlineUserId) ? prev : [...prev, onlineUserId];
              } else {
                return prev.filter(id => id !== onlineUserId);
              }
            });
          });

          logger.debug('[SocketContext] Socket listeners attached');
        }
      } else {
        // 🔐 RACE CONDITION FIX: Only retry if auth is confirmed ready
        // If socket returns null but auth says ready+authenticated, it's a transient issue
        // If auth is not ready, don't retry - wait for auth to become ready
        initializationRef.current = false;

        if (isAuthReady && isAuthenticated && retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          logger.debug(`[SocketContext] Socket null, retrying (${retryCountRef.current}/${MAX_RETRIES})`);
          reconnectTimeoutRef.current = setTimeout(() => {
            initSocket();
          }, 2000);
        } else if (retryCountRef.current >= MAX_RETRIES) {
          logger.warn('[SocketContext] Max retries reached, stopping retry loop');
        }
        // If !isAuthReady or !isAuthenticated, don't log warning - this is expected
      }
    } catch (error) {
      logger.error('[SocketContext] Error initializing socket:', error);
      initializationRef.current = false;
    }
  }, [userId, isAuthenticated, isAuthReady]);

  /**
   * Initialize socket when user logs in
   */
  useEffect(() => {
    if (isAuthenticated && userId) {
      // Reset logout flag in case user logged out and back in
      resetLogoutFlag();
      initSocket();
    } else if (!isAuthenticated) {
      // Clean up socket on logout
      if (socket) {
        logger.debug('[SocketContext] User logged out, disconnecting socket');
        disconnectSocketForLogout();
        setSocket(null);
        setIsConnected(false);
        setIsReady(false);
        setOnlineUsers([]);
      }
      initializationRef.current = false;
    }

    return () => {
      clearTimeout(reconnectTimeoutRef.current);
    };
  // 🔥 FIX: Removed initSocket from dependency array (redundant - already memoized with same deps)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, userId]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      clearTimeout(reconnectTimeoutRef.current);
      if (socket) {
        logger.debug('[SocketContext] Cleaning up socket listeners');
        socket.off('connect');
        socket.off('disconnect');
        socket.off('room:joined');
        socket.off('online_users');
        socket.off('presence:update');
      }
    };
  }, [socket]);

  /**
   * Periodically check socket health and update connection status
   */
  useEffect(() => {
    if (!socket || !isConnected) {
      setConnectionHealth(null);
      return;
    }

    const healthCheckInterval = setInterval(() => {
      const connected = isSocketConnected();
      const ready = isConnectionReady();
      const health = getConnectionHealth();

      setIsConnected(connected);
      setIsReady(ready);
      setConnectionHealth(health);

      if (!connected) {
        logger.warn('[SocketContext] Socket health check failed - not connected');
      } else if (!health.isHealthy) {
        logger.warn('[SocketContext] Connection unhealthy:', health);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(healthCheckInterval);
  }, [socket, isConnected]);

  const contextValue = {
    socket,
    onlineUsers,
    isConnected,
    isReady,
    connectionHealth,
    reconnect: initSocket
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}

/**
 * Hook to access socket context
 */
export function useSocket() {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }

  return context;
}

export default SocketContext;

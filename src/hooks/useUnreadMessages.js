import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/apiClient';
import logger from '../utils/logger';
import { isAuthConfirmed, subscribeToAuthStatus, AUTH_STATUS } from '../state/authStatus';
import { getSocket } from '../utils/socket';
import SOCKET_EVENTS from '../constants/socketEvents';

// PHASE 3c: Multi-tab sync using BroadcastChannel
let broadcastChannel = null;
const CHANNEL_NAME = 'pryde-unread-sync';

/**
 * useUnreadMessages Hook - SINGLETON PATTERN (PHASE R: Socket-first)
 *
 * PHASE R: Now uses Socket.IO for real-time updates instead of polling.
 * Polling is ONLY used as fallback when socket is disconnected.
 *
 * Features:
 * - Socket.IO real-time updates (primary)
 * - Fallback polling only when socket disconnected
 * - Singleton pattern (prevents duplicate subscriptions)
 * - Shared state across all hook instances
 * - 🔥 AUTH-GATED: Only activates when user is authenticated
 *
 * @returns {{ totalUnread: number, unreadByUser: Array }} Unread message data
 */

// Shared state across all hook instances (SINGLETON)
let unreadCache = {
  totalUnread: 0,
  unreadByUser: []
};
let lastFetch = 0;
const listeners = new Set();
let globalInterval = null;
let authUnsubscribe = null;
let socketListenersSetup = false;

/**
 * 🔐 RACE CONDITION FIX: Check if auth is ready from window snapshot
 */
function isAuthReadyFromContext() {
  if (typeof window === 'undefined') return false;
  return window.__PRYDE_AUTH__?.isAuthReady === true;
}

/**
 * Fetch unread count (singleton - only one fetch at a time)
 */
async function fetchUnread() {
  // 🔐 RACE CONDITION FIX: BOOT GUARD - Do NOT fetch if auth not ready
  const authReady = isAuthReadyFromContext();
  if (!authReady || !isAuthConfirmed()) {
    logger.debug('[useUnreadMessages] Skipping fetch (auth not ready)', { authReady, authConfirmed: isAuthConfirmed() });
    return;
  }

  const now = Date.now();

  // Hard guard: prevent fetches more frequent than 2 minutes
  if (now - lastFetch < 120_000) {
    logger.debug('[useUnreadMessages] Skipping fetch (too soon)');
    return;
  }

  lastFetch = now;
  logger.debug('[useUnreadMessages] Fetching unread count...');

  try {
    const data = await apiFetch(
      '/messages/unread/counts',
      {},
      { cacheTtl: 60_000 } // 1 minute cache
    );

    if (!data) {
      logger.warn('[useUnreadMessages] Failed to fetch unread count');
      return;
    }

    const newData = {
      totalUnread: data.totalUnread || 0,
      unreadByUser: data.unreadByUser || []
    };

    // Only update if data changed
    if (newData.totalUnread !== unreadCache.totalUnread ||
        JSON.stringify(newData.unreadByUser) !== JSON.stringify(unreadCache.unreadByUser)) {
      unreadCache = newData;
      logger.debug(`[useUnreadMessages] Data updated:`, newData);

      // Notify all listeners
      listeners.forEach(fn => fn(unreadCache));
    }
  } catch (error) {
    // Silently handle auth errors - user may have logged out
    if (error?.response?.status === 401) {
      logger.debug('[useUnreadMessages] Auth error (401) - user may be logged out');
    } else {
      logger.warn('[useUnreadMessages] Fetch error:', error);
    }
  }
}

/**
 * PHASE R: Setup socket listeners for real-time message updates
 */
// PHASE 3b: Track seen message IDs to prevent duplicate processing
const seenMessageIds = new Set();
const MAX_SEEN_IDS = 500; // Prevent memory leak

function setupSocketListeners() {
  if (socketListenersSetup) return;

  const socket = getSocket();
  if (!socket) {
    logger.debug('[useUnreadMessages] Socket not available, will use polling fallback');
    return;
  }

  socketListenersSetup = true;
  logger.debug('[useUnreadMessages] Setting up socket listeners for real-time sync');

  // Handle new message received - increment unread count
  const handleNewMessage = (data) => {
    // PHASE 3b: Duplicate event protection
    const messageId = data._id || data.id;
    if (messageId && seenMessageIds.has(messageId)) {
      logger.debug('[useUnreadMessages] Duplicate message ID, ignoring:', messageId);
      return;
    }
    if (messageId) {
      seenMessageIds.add(messageId);
      // Cleanup old IDs to prevent memory leak
      if (seenMessageIds.size > MAX_SEEN_IDS) {
        const idsArray = Array.from(seenMessageIds);
        for (let i = 0; i < 100; i++) {
          seenMessageIds.delete(idsArray[i]);
        }
      }
    }

    logger.debug('[useUnreadMessages] Socket: new message received', data);
    // Increment total unread count
    const newCache = {
      ...unreadCache,
      totalUnread: unreadCache.totalUnread + 1
    };
    // Update user-specific count if we have sender info
    if (data.sender && data.sender._id) {
      const existingUser = newCache.unreadByUser.find(u => u.userId === data.sender._id);
      if (existingUser) {
        existingUser.count += 1;
      } else {
        newCache.unreadByUser = [...newCache.unreadByUser, {
          userId: data.sender._id,
          username: data.sender.username,
          displayName: data.sender.displayName,
          count: 1
        }];
      }
    }
    unreadCache = newCache;
    listeners.forEach(fn => fn(unreadCache));
  };

  // Handle message read - decrement unread count
  const handleMessageRead = (data) => {
    logger.debug('[useUnreadMessages] Socket: message read', data);
    // Refresh from server to get accurate count
    lastFetch = 0; // Reset guard
    fetchUnread();
  };

  // Handle all messages read
  const handleMessagesReadAll = () => {
    logger.debug('[useUnreadMessages] Socket: all messages read');
    unreadCache = { totalUnread: 0, unreadByUser: [] };
    listeners.forEach(fn => fn(unreadCache));

    // PHASE 3c: Broadcast to other tabs
    broadcastToOtherTabs({ type: 'READ_ALL' });
  };

  // Subscribe to socket events (Phase R: Unified event naming)
  // UNIFIED: Only listen to 'message:new' - legacy events removed
  socket.on(SOCKET_EVENTS.MESSAGE.NEW, handleNewMessage);
  socket.on(SOCKET_EVENTS.MESSAGE.READ, handleMessageRead);
  socket.on('messages:read_all', handleMessagesReadAll);

  // PHASE 3c: Setup multi-tab sync
  setupMultiTabSync();

  // Handle socket disconnect - start polling as fallback
  socket.on('disconnect', () => {
    logger.debug('[useUnreadMessages] Socket disconnected, starting polling fallback');
    startPolling();
  });

  // Handle socket reconnect - stop polling
  socket.on('connect', () => {
    logger.debug('[useUnreadMessages] Socket reconnected, stopping polling');
    stopPolling();
    // Refresh count after reconnect
    lastFetch = 0;
    fetchUnread();
  });
}

/**
 * PHASE 3c: Setup multi-tab synchronization using BroadcastChannel
 */
function setupMultiTabSync() {
  if (broadcastChannel) return; // Already setup

  if (typeof BroadcastChannel === 'undefined') {
    logger.debug('[useUnreadMessages] BroadcastChannel not supported');
    return;
  }

  broadcastChannel = new BroadcastChannel(CHANNEL_NAME);

  broadcastChannel.onmessage = (event) => {
    const { type, data } = event.data;
    logger.debug('[useUnreadMessages] Multi-tab sync received:', type);

    switch (type) {
      case 'READ_ALL':
        // Another tab marked all as read
        unreadCache = { totalUnread: 0, unreadByUser: [] };
        listeners.forEach(fn => fn(unreadCache));
        break;
      case 'SYNC':
        // Another tab is sharing its state
        if (data) {
          unreadCache = data;
          listeners.forEach(fn => fn(unreadCache));
        }
        break;
      default:
        break;
    }
  };

  logger.debug('[useUnreadMessages] Multi-tab sync initialized');
}

/**
 * PHASE 3c: Broadcast state to other tabs
 */
function broadcastToOtherTabs(message) {
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(message);
    } catch (e) {
      logger.debug('[useUnreadMessages] Broadcast failed:', e.message);
    }
  }
}

/**
 * Start global polling interval (FALLBACK ONLY - when socket disconnected)
 */
function startPolling() {
  if (globalInterval) return; // Already polling

  // 🔥 Only start polling if authenticated
  if (!isAuthConfirmed()) {
    logger.debug('[useUnreadMessages] Not starting polling (not authenticated)');
    return;
  }

  // PHASE R: Check if socket is connected - if so, don't poll
  const socket = getSocket();
  if (socket?.connected) {
    logger.debug('[useUnreadMessages] Socket connected, skipping polling');
    return;
  }

  logger.debug('[useUnreadMessages] Starting fallback polling (3 min interval)');
  globalInterval = setInterval(fetchUnread, 180_000); // 3 minutes
}

/**
 * Stop global polling interval
 */
function stopPolling() {
  if (globalInterval) {
    clearInterval(globalInterval);
    globalInterval = null;
    logger.debug('[useUnreadMessages] Stopped polling');
  }
}

/**
 * Clear cached data (called on logout)
 */
function clearCache() {
  unreadCache = { totalUnread: 0, unreadByUser: [] };
  lastFetch = 0;
  socketListenersSetup = false;
  listeners.forEach(fn => fn(unreadCache));
  logger.debug('[useUnreadMessages] Cache cleared');
}

/**
 * Handle auth status changes
 */
function handleAuthChange(newStatus) {
  if (newStatus === AUTH_STATUS.UNAUTHENTICATED) {
    // User logged out - stop polling and clear cache
    stopPolling();
    clearCache();
  } else if (newStatus === AUTH_STATUS.AUTHENTICATED && listeners.size > 0) {
    // User logged in - setup socket listeners and fetch
    setupSocketListeners();
    fetchUnread(); // Fetch immediately on login
  }
}

/**
 * Hook to access unread message data
 * @returns {{ totalUnread: number, unreadByUser: Array }} Unread message data
 */
export function useUnreadMessages() {
  const [data, setData] = useState(unreadCache);

  useEffect(() => {
    // Register listener
    listeners.add(setData);
    logger.debug(`[useUnreadMessages] Listener added (total: ${listeners.size})`);

    // Subscribe to auth changes (singleton - only once)
    if (!authUnsubscribe) {
      authUnsubscribe = subscribeToAuthStatus(handleAuthChange);
    }

    // PHASE R: Setup socket listeners for real-time updates
    if (isAuthConfirmed()) {
      fetchUnread();

      // Setup socket listeners (primary) - polling will only start if socket unavailable
      if (listeners.size === 1) {
        setupSocketListeners();
        // startPolling is now only called as fallback when socket disconnects
      }
    }

    return () => {
      // Unregister listener
      listeners.delete(setData);
      logger.debug(`[useUnreadMessages] Listener removed (remaining: ${listeners.size})`);

      // Stop polling if no more listeners
      if (listeners.size === 0) {
        stopPolling();

        // Unsubscribe from auth changes
        if (authUnsubscribe) {
          authUnsubscribe();
          authUnsubscribe = null;
        }
      }
    };
  }, []);

  return data;
}

/**
 * Manually refresh unread count (bypasses cache and guards)
 */
export function refreshUnreadCount() {
  // Still check auth before refreshing
  if (!isAuthConfirmed()) {
    logger.debug('[useUnreadMessages] Cannot refresh (not authenticated)');
    return Promise.resolve();
  }

  lastFetch = 0; // Reset guard
  return fetchUnread();
}


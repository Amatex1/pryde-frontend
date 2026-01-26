/**
 * useMessageScroll — Scroll position persistence and auto-scroll behavior
 * 
 * Responsibilities:
 * - Persist scrollTop per chatId (in-memory Map)
 * - Restore scroll position on chat switch
 * - Detect "user at bottom" (threshold: 48px)
 * - Expose helpers: scrollToBottom, isAtBottom, onScroll
 * 
 * Rules:
 * - First time opening a chat → scroll to bottom
 * - Returning to chat → restore previous scroll
 * - If user scrolls up → DO NOT auto-scroll
 * - New incoming message: if at bottom → auto-scroll, else show indicator
 */

import { useRef, useCallback, useEffect, useState } from 'react';

// In-memory scroll position storage (persists across chat switches, not page reloads)
const scrollPositions = new Map();
const visitedChats = new Set();

export function useMessageScroll(chatId, containerRef) {
  const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false);
  const isAtBottomRef = useRef(true);
  const lastMessageCountRef = useRef(0);
  const isRestoringScrollRef = useRef(false);

  // Check if user is at bottom (within threshold)
  const isAtBottom = useCallback(() => {
    const container = containerRef?.current;
    if (!container) return true;
    
    const threshold = 48;
    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight <= threshold;
  }, [containerRef]);

  // Scroll to bottom
  const scrollToBottom = useCallback(({ smooth = true } = {}) => {
    const container = containerRef?.current;
    if (!container) return;
    
    container.scrollTo({
      top: container.scrollHeight,
      behavior: smooth ? 'smooth' : 'instant'
    });
    setShowNewMessageIndicator(false);
    isAtBottomRef.current = true;
  }, [containerRef]);

  // Handle scroll events
  const onScroll = useCallback(() => {
    if (isRestoringScrollRef.current) return;
    
    const container = containerRef?.current;
    if (!container || !chatId) return;
    
    // Update at-bottom state
    isAtBottomRef.current = isAtBottom();
    
    // Save scroll position
    scrollPositions.set(chatId, container.scrollTop);
    
    // Hide indicator if user scrolled to bottom
    if (isAtBottomRef.current) {
      setShowNewMessageIndicator(false);
    }
  }, [chatId, containerRef, isAtBottom]);

  // Restore scroll position when chat changes
  useEffect(() => {
    if (!chatId || !containerRef?.current) return;
    
    const container = containerRef.current;
    const hasVisited = visitedChats.has(chatId);
    const savedPosition = scrollPositions.get(chatId);
    
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      isRestoringScrollRef.current = true;
      
      if (hasVisited && savedPosition !== undefined) {
        // Returning to chat → restore previous scroll
        container.scrollTop = savedPosition;
      } else {
        // First time opening chat → scroll to bottom
        container.scrollTop = container.scrollHeight;
        visitedChats.add(chatId);
      }
      
      isAtBottomRef.current = isAtBottom();
      
      // Allow scroll events after a short delay
      setTimeout(() => {
        isRestoringScrollRef.current = false;
      }, 100);
    });
    
    // Reset indicator when switching chats
    setShowNewMessageIndicator(false);
  }, [chatId, containerRef, isAtBottom]);

  // Handle new messages
  const handleNewMessage = useCallback((messageCount) => {
    if (messageCount > lastMessageCountRef.current) {
      // New message arrived
      if (isAtBottomRef.current) {
        // User is at bottom → auto-scroll
        scrollToBottom({ smooth: true });
      } else {
        // User is scrolled up → show indicator
        setShowNewMessageIndicator(true);
      }
    }
    lastMessageCountRef.current = messageCount;
  }, [scrollToBottom]);

  // Dismiss indicator and scroll to bottom
  const dismissIndicator = useCallback(() => {
    scrollToBottom({ smooth: true });
    setShowNewMessageIndicator(false);
  }, [scrollToBottom]);

  return {
    isAtBottom,
    scrollToBottom,
    onScroll,
    handleNewMessage,
    showNewMessageIndicator,
    dismissIndicator,
  };
}


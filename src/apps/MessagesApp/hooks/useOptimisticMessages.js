/**
 * useOptimisticMessages — Optimistic UI for Message Sending
 *
 * Extracted from: src/pages/Messages.jsx lines 120-187
 */

import { useCallback, useRef, useEffect } from 'react';

export function useOptimisticMessages({ showAlert, setMessages }) {
  const optimisticTimeoutsRef = useRef(new Map());

  /**
   * Check if a message ID is a temporary optimistic ID
   */
  const isTempId = (messageId) => {
    return typeof messageId === 'string' && messageId.startsWith('temp_');
  };

  /**
   * Rollback an optimistic message after timeout
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
    optimisticTimeoutsRef.current.delete(tempId);
    showAlert('Message failed to send. Please try again.', 'Send Failed');
  }, [showAlert, setMessages]);

  /**
   * Clear the rollback timeout for an optimistic message
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

  return {
    isTempId,
    rollbackOptimisticMessage,
    clearOptimisticTimeout,
    scheduleOptimisticRollback,
    optimisticTimeoutsRef,
  };
}

export default useOptimisticMessages;


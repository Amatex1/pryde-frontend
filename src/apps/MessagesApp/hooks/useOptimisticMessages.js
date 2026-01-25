/**
 * useOptimisticMessages — Optimistic UI for Message Sending
 * 
 * Phase 1 Scaffold: Stub only, no logic.
 * 
 * Responsibility:
 * - Generate temporary IDs for optimistic messages
 * - Schedule rollback timeouts (15 seconds default)
 * - Clear timeouts on confirmation
 * - Rollback failed messages
 * - Cleanup on unmount
 * 
 * Extracted from: src/pages/Messages.jsx lines 120-187
 * 
 * Key Functions:
 * - isTempId(id) → boolean
 * - rollbackOptimisticMessage(tempId)
 * - clearOptimisticTimeout(tempId)
 * - scheduleOptimisticRollback(tempId, timeoutMs)
 * 
 * Interface (to be implemented in Phase 2):
 * useOptimisticMessages({
 *   setMessages: (updater) => void,
 *   showAlert: (msg, title) => void
 * }) => {
 *   isTempId: (id) => boolean,
 *   addOptimistic: (tempMsg) => void,
 *   confirmMessage: (tempId, realMsg) => void,
 *   rollback: (tempId) => void,
 *   scheduleRollback: (tempId, timeoutMs) => void,
 *   clearRollback: (tempId) => void
 * }
 */

export function useOptimisticMessages() {
  // Logic added in Phase 2
  return {
    isTempId: () => false,
    addOptimistic: () => {},
    confirmMessage: () => {},
    rollback: () => {},
    scheduleRollback: () => {},
    clearRollback: () => {}
  };
}

export default useOptimisticMessages;


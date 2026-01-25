/**
 * useChatSelection — Selected Chat State Management
 * 
 * Phase 1 Scaffold: Stub only, no logic.
 * 
 * Responsibility:
 * - Track currently selected chat ID
 * - Track chat type (user vs group)
 * - Persist selection to localStorage (desktop only)
 * - Restore selection on mount (desktop only)
 * - Handle URL query params (?chat=xxx)
 * - Fetch selected user/group info
 * 
 * Extracted from: src/pages/Messages.jsx
 * - selectedChat state: lines 54-61
 * - selectedChatType state: lines 62-68
 * - localStorage persistence: lines 326-331
 * - URL params handling: lines 367-379
 * - Fetch user info: lines 415-480
 * 
 * Interface (to be implemented in Phase 2):
 * useChatSelection() => {
 *   selectedChat: string | null,
 *   selectedChatType: 'user' | 'group' | null,
 *   selectedUser: Object | null,
 *   selectedGroup: Object | null,
 *   setSelectedChat: (id, type) => void,
 *   clearSelection: () => void
 * }
 */

export function useChatSelection() {
  // Logic added in Phase 2
  return {
    selectedChat: null,
    selectedChatType: null,
    selectedUser: null,
    selectedGroup: null,
    setSelectedChat: () => {},
    clearSelection: () => {}
  };
}

export default useChatSelection;


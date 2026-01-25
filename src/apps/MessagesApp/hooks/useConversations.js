/**
 * useConversations — Conversation List Management
 * 
 * Phase 1 Scaffold: Stub only, no logic.
 * 
 * Responsibility:
 * - Fetch conversations from API
 * - Fetch group chats from API
 * - Filter conversations by search query
 * - Filter by tab (all/unread/archived)
 * - Handle archive/unarchive
 * - Handle mute/unmute
 * - Handle mark as read/unread
 * 
 * Extracted from: src/pages/Messages.jsx
 * - fetchConversations: lines 381-403
 * - filteredConversations: lines 1565-1600
 * - Debounced filter: lines 288-294
 * - Archive handlers: various
 * 
 * Dependencies:
 * - src/utils/api.js
 * 
 * Interface (to be implemented in Phase 2):
 * useConversations({
 *   currentUser: User,
 *   authReady: boolean
 * }) => {
 *   conversations: Array,
 *   groupChats: Array,
 *   loading: boolean,
 *   filteredConversations: Array,
 *   filter: string,
 *   setFilter: Function,
 *   activeTab: string,
 *   setActiveTab: Function,
 *   refetch: Function
 * }
 */

export function useConversations() {
  // Logic added in Phase 2
  return {
    conversations: [],
    groupChats: [],
    loading: false,
    filteredConversations: [],
    filter: '',
    setFilter: () => {},
    activeTab: 'all',
    setActiveTab: () => {},
    refetch: () => {}
  };
}

export default useConversations;


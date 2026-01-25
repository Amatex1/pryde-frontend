/**
 * useConversations — Conversation List Management
 *
 * Extracted from: src/pages/Messages.jsx lines 381-412, 1565-1588
 */

import { useState, useEffect, useMemo } from 'react';
import api from '../../../utils/api';
import logger from '../../../utils/logger';

export function useConversations({ authReady, currentUser }) {
  const [conversations, setConversations] = useState([]);
  const [groupChats, setGroupChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [conversationFilter, setConversationFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [archivedConversations, setArchivedConversations] = useState([]);
  const [mutedConversations, setMutedConversations] = useState([]);

  // Debounce conversation filter
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilter(conversationFilter);
    }, 300);
    return () => clearTimeout(handler);
  }, [conversationFilter]);

  const fetchConversations = async () => {
    try {
      const [messagesRes, groupsRes] = await Promise.all([
        api.get('/messages/list'),
        api.get('/groupChats')
      ]);
      const sortedConversations = [...messagesRes.data].sort((a, b) => {
        const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      setConversations(sortedConversations);
      setGroupChats(groupsRes.data);
      setLoading(false);
    } catch (error) {
      logger.error('Error fetching conversations:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authReady) {
      logger.debug('[Messages] Waiting for auth to be ready...');
      return;
    }
    fetchConversations();
  }, [authReady]);

  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      const isArchived = archivedConversations.includes(conv._id);
      if (activeTab === 'archived') return isArchived;
      if (activeTab === 'unread') return !isArchived && (conv.unread > 0 || conv.manuallyUnread);
      if (isArchived) return false;

      if (debouncedFilter.trim()) {
        const q = debouncedFilter.toLowerCase();
        const otherUser = conv.otherUser || (
          conv.lastMessage?.sender?._id === currentUser?._id
            ? conv.lastMessage?.recipient
            : conv.lastMessage?.sender
        );
        const displayName = otherUser?.displayName || otherUser?.username || '';
        const username = otherUser?.username || '';
        return displayName.toLowerCase().includes(q) || username.toLowerCase().includes(q);
      }
      return true;
    });
  }, [conversations, archivedConversations, activeTab, debouncedFilter, currentUser]);

  return {
    conversations,
    setConversations,
    groupChats,
    setGroupChats,
    loading,
    filteredConversations,
    activeTab,
    setActiveTab,
    conversationFilter,
    setConversationFilter,
    archivedConversations,
    setArchivedConversations,
    mutedConversations,
    setMutedConversations,
    fetchConversations,
  };
}

export default useConversations;


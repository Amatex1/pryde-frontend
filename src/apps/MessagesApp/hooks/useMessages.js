/**
 * useMessages — Message List Management
 *
 * Extracted from: src/pages/Messages.jsx lines 415-555, 243-286, 198-233
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import api from '../../../utils/api';
import logger from '../../../utils/logger';

export function useMessages({
  selectedChat,
  selectedChatType,
  currentUser,
  fetchConversations,
  setSelectedUser,
  setSelectedGroup,
  setIsRecipientUnavailable,
  setRecipientUnavailableReason,
}) {
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const chatContainerRef = useRef(null);
  const lastScrolledChatRef = useRef(null);

  // Helper function to format date headers
  const formatDateHeader = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const messageDateMidnight = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayMidnight = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (messageDateMidnight.getTime() === todayMidnight.getTime()) {
      return 'Today';
    } else if (messageDateMidnight.getTime() === yesterdayMidnight.getTime()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  // Helper function to check if we need a date header
  const shouldShowDateHeader = (currentMsg, previousMsg) => {
    if (!previousMsg) return true;
    const currentDate = new Date(currentMsg.createdAt);
    const previousDate = new Date(previousMsg.createdAt);
    return currentDate.toDateString() !== previousDate.toDateString();
  };

  // Group consecutive messages by sender
  const groupMessagesBySender = useMemo(() => {
    if (!messages.length || !currentUser) return [];

    const groups = [];
    let currentGroup = null;

    messages.forEach((msg, index) => {
      const senderId = msg.sender._id;
      const isSent = senderId === currentUser._id;
      const previousMsg = index > 0 ? messages[index - 1] : null;

      const shouldStartNewGroup = () => {
        if (!currentGroup) return true;
        if (currentGroup.senderId !== senderId) return true;
        if (shouldShowDateHeader(msg, previousMsg)) return true;
        const timeDiff = new Date(msg.createdAt) - new Date(currentGroup.messages[currentGroup.messages.length - 1].createdAt);
        if (timeDiff > 240000) return true;
        return false;
      };

      if (shouldStartNewGroup()) {
        currentGroup = {
          senderId,
          senderInfo: msg.sender,
          messages: [msg],
          isCurrentUser: isSent,
          showDateHeader: shouldShowDateHeader(msg, previousMsg),
          dateHeader: formatDateHeader(msg.createdAt)
        };
        groups.push(currentGroup);
      } else {
        currentGroup.messages.push(msg);
      }
    });

    return groups;
  }, [messages, currentUser]);

  // Fetch messages and user/group info for selected chat
  useEffect(() => {
    if (selectedChat) {
      const fetchMessages = async () => {
        try {
          setLoadingMessages(true);
          const endpoint = selectedChatType === 'group'
            ? `/messages/group/${selectedChat}`
            : `/messages/${selectedChat}`;

          const response = await api.get(endpoint, { params: { limit: 50 } });
          setMessages(response.data);

          if (selectedChatType === 'user') {
            const unreadMessages = response.data.filter(
              msg => msg.sender._id === selectedChat && !msg.read
            );
            for (const msg of unreadMessages) {
              try {
                await api.put(`/messages/${msg._id}/read`);
              } catch (error) {
                logger.error('Error marking message as read:', error);
              }
            }
            try {
              await api.delete(`/messages/conversations/${selectedChat}/mark-unread`);
            } catch (error) {
              logger.error('Error removing manual unread status:', error);
            }
            if (unreadMessages.length > 0) {
              fetchConversations();
            }
          }
        } catch (error) {
          logger.error('Error fetching messages:', error);
        } finally {
          setLoadingMessages(false);
        }
      };

      const fetchChatInfo = async () => {
        try {
          setSelectedUser(null);
          setSelectedGroup(null);
          setIsRecipientUnavailable(false);
          setRecipientUnavailableReason('');

          if (selectedChatType === 'group') {
            const response = await api.get(`/groupchats/${selectedChat}`);
            setSelectedGroup(response.data);
          } else {
            const response = await api.get(`/users/${selectedChat}`);
            const user = response.data;
            setSelectedUser(user);

            const isDeleted = user.isDeleted === true;
            const isDeactivated = user.isActive === false;
            const hasBlocked = user.hasBlockedCurrentUser === true;

            if (isDeleted || isDeactivated || hasBlocked) {
              setIsRecipientUnavailable(true);
              if (isDeactivated) {
                setRecipientUnavailableReason("You can't message this account while it's deactivated.");
              } else {
                setRecipientUnavailableReason("You can't message this account.");
              }
            }
          }
        } catch (error) {
          if (error.response?.status === 404) {
            setSelectedUser({
              _id: selectedChat,
              username: 'Deactivated User',
              displayName: 'Deactivated User',
              profilePhoto: null,
              isDeleted: true
            });
            setIsRecipientUnavailable(true);
            setRecipientUnavailableReason("This account is no longer available.");
          } else {
            logger.error('Error fetching chat info:', error);
            setSelectedUser(null);
            setSelectedGroup(null);
          }
        }
      };

      setMessages([]);
      setLoadingMessages(true);
      fetchMessages();
      fetchChatInfo();
    } else {
      setSelectedUser(null);
      setSelectedGroup(null);
      setMessages([]);
      setIsRecipientUnavailable(false);
      setRecipientUnavailableReason('');
      setLoadingMessages(false);
    }
  }, [selectedChat, selectedChatType]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && !loadingMessages && chatContainerRef.current) {
      const container = chatContainerRef.current;
      const scrollToBottom = (instant = false) => {
        if (!container) return;
        if (instant) {
          container.scrollTop = container.scrollHeight;
        } else {
          container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        }
      };

      const isInitialLoad = messages.length <= 50;
      if (isInitialLoad) {
        scrollToBottom(true);
        requestAnimationFrame(() => {
          scrollToBottom(true);
          requestAnimationFrame(() => scrollToBottom(true));
        });
        setTimeout(() => scrollToBottom(true), 200);
        setTimeout(() => scrollToBottom(true), 400);
      } else {
        setTimeout(() => scrollToBottom(false), 50);
      }
    }
  }, [messages, loadingMessages]);

  return {
    messages,
    setMessages,
    loadingMessages,
    groupMessagesBySender,
    chatContainerRef,
    formatDateHeader,
    shouldShowDateHeader,
  };
}

export default useMessages;


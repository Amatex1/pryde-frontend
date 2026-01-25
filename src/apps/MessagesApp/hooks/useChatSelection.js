/**
 * useChatSelection — Selected Chat State Management
 *
 * Extracted from: src/pages/Messages.jsx lines 54-68, 326-331, 367-379
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useChatSelection({ currentUser }) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Don't restore selected chat on mobile - always show conversation list first
  const [selectedChat, setSelectedChat] = useState(() => {
    if (window.innerWidth > 768) {
      const saved = localStorage.getItem('selectedChat');
      return saved || null;
    }
    return null;
  });
  const [selectedChatType, setSelectedChatType] = useState(() => {
    if (window.innerWidth > 768) {
      const saved = localStorage.getItem('selectedChatType');
      return saved || 'user';
    }
    return 'user';
  });

  // Save selected chat to localStorage whenever it changes
  useEffect(() => {
    if (selectedChat) {
      localStorage.setItem('selectedChat', selectedChat);
      localStorage.setItem('selectedChatType', selectedChatType);
    }
  }, [selectedChat, selectedChatType]);

  // Check for chat parameter in URL and open that chat
  useEffect(() => {
    const chatId = searchParams.get('chat');
    if (chatId) {
      const actualChatId = chatId === 'self' ? currentUser?._id : chatId;
      if (actualChatId) {
        setSelectedChat(actualChatId);
        setSelectedChatType('user');
      }
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, currentUser]);

  return {
    selectedChat,
    setSelectedChat,
    selectedChatType,
    setSelectedChatType,
  };
}

export default useChatSelection;


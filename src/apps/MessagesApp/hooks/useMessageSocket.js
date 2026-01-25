/**
 * useMessageSocket — Socket.IO Message Handlers
 *
 * Extracted from: src/pages/Messages.jsx lines 641-861
 */

import { useEffect, useState } from 'react';
import {
  onNewMessage,
  onMessageSent,
  onUserTyping,
  getSocket,
  isSocketConnected,
} from '../../../utils/socket';
import { setupSocketListeners } from '../../../utils/socketHelpers';
import logger from '../../../utils/logger';

export function useMessageSocket({
  selectedChat,
  currentUser,
  setMessages,
  setConversations,
  clearOptimisticTimeout,
}) {
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const setupListeners = (socket) => {
      logger.debug('🎧 Setting up message socket listeners for chat:', selectedChat);

      const cleanupNewMessage = onNewMessage((newMessage) => {
        console.warn('📨 [MessagesApp] Received message:new event:', {
          messageId: newMessage?._id,
          senderId: newMessage?.sender?._id,
          recipientId: newMessage?.recipient?._id,
          selectedChat,
          currentUserId: currentUser?._id
        });

        const isRecipient = String(currentUser?._id) === String(newMessage.recipient?._id);
        const isSenderInSelectedChat = String(selectedChat) === String(newMessage.sender?._id);

        if (isRecipient && isSenderInSelectedChat) {
          setMessages((prev) => {
            if (prev.some(msg => msg._id === newMessage._id)) return prev;
            return [...prev, newMessage];
          });
        }

        const isSender = String(currentUser?._id) === String(newMessage.sender?._id);
        const otherPersonId = isSender ? newMessage.recipient?._id : newMessage.sender?._id;
        const otherPerson = isSender ? newMessage.recipient : newMessage.sender;

        setConversations((prev) => {
          const updated = prev.filter(c => String(c._id) !== String(otherPersonId));
          return [{ _id: otherPersonId, lastMessage: newMessage, ...otherPerson }, ...updated];
        });
      });

      const cleanupMessageSent = onMessageSent((sentMessage) => {
        console.log('✅ [MessagesApp] Received message:sent event:', sentMessage);

        if (sentMessage._tempId) {
          clearOptimisticTimeout(sentMessage._tempId);
        }

        if (String(selectedChat) === String(sentMessage.recipient?._id)) {
          setMessages((prev) => {
            let optimisticIndex = -1;
            if (sentMessage._tempId) {
              optimisticIndex = prev.findIndex(msg => msg._id === sentMessage._tempId);
            }
            if (optimisticIndex === -1) {
              optimisticIndex = prev.findIndex(msg => msg._isOptimistic);
            }

            if (optimisticIndex !== -1) {
              const optimisticMsg = prev[optimisticIndex];
              if (optimisticMsg._id) {
                clearOptimisticTimeout(optimisticMsg._id);
              }
              const updated = [...prev];
              updated[optimisticIndex] = sentMessage;
              return updated;
            }

            if (prev.some(msg => msg._id === sentMessage._id)) return prev;
            return [...prev, sentMessage];
          });
        } else {
          setMessages((prev) => {
            if (sentMessage._tempId) {
              const hasMatch = prev.some(msg => msg._id === sentMessage._tempId);
              if (hasMatch) {
                return prev.filter(msg => msg._id !== sentMessage._tempId);
              }
            }
            const hasOptimistic = prev.some(msg => msg._isOptimistic);
            if (hasOptimistic) {
              return prev.filter(msg => !msg._isOptimistic);
            }
            return prev;
          });
        }

        setConversations((prev) => {
          const recipientId = sentMessage.recipient._id;
          const updated = prev.filter(c => c._id !== recipientId);
          return [{ _id: recipientId, lastMessage: sentMessage, ...sentMessage.recipient }, ...updated];
        });
      });

      const cleanupTyping = onUserTyping((data) => {
        if (data.userId === selectedChat) {
          setIsTyping(data.isTyping);
        }
      });

      const handleMessageDeleted = (data) => {
        logger.debug('🗑️ Received message:deleted event:', data);
        if (data.deleteForAll) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === data.messageId
                ? { ...msg, isDeleted: true, content: '', attachment: null }
                : msg
            )
          );
        } else {
          setMessages((prev) => prev.filter((msg) => msg._id !== data.messageId));
        }
      };
      socket.on('message:deleted', handleMessageDeleted);

      const handleMessageError = (error) => {
        logger.error('❌ Message error received:', error);
        console.error('❌ Message error:', error);
        alert(`Message error: ${error.message || 'Unknown error'}`);
      };
      socket.on('message:error', handleMessageError);

      return () => {
        cleanupNewMessage?.();
        cleanupMessageSent?.();
        cleanupTyping?.();
        socket.off('message:deleted', handleMessageDeleted);
        socket.off('message:error', handleMessageError);
      };
    };

    let messageCleanup = null;
    const cancelSocketRetry = setupSocketListeners((socket) => {
      messageCleanup = setupListeners(socket);
    });

    return () => {
      cancelSocketRetry();
      if (messageCleanup) {
        messageCleanup();
      }
    };
  }, [selectedChat, currentUser, setMessages, setConversations, clearOptimisticTimeout]);

  return { isTyping, setIsTyping };
}

export default useMessageSocket;


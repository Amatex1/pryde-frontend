/**
 * ChatColumn — Main Chat Area Component
 * 
 * Phase 1 Scaffold: Structure only, no logic.
 * 
 * Responsibility:
 * - Container for chat header, message list, and composer
 * - Flex layout with header/composer fixed, messages scrollable
 * - Handle empty state when no chat selected
 * 
 * Extracted from: src/pages/Messages.jsx
 * - Chat area container: lines 1859-2100
 * - Chat header: lines 1864-1950
 * - Messages rendering: lines 1960-2080
 * 
 * Props (to be implemented in Phase 3):
 * - selectedChat: string
 * - selectedUser: Object
 * - selectedGroup: Object
 * - messages: Array
 * - isTyping: boolean
 * - onSendMessage: Function
 * - onBack: Function (mobile)
 */

import React from 'react';
import MessageList from './MessageList';
import Composer from './Composer';

export default function ChatColumn() {
  return (
    <section className="messages-app__chat">
      {/* ChatColumn scaffold — logic added in Phase 3 */}
      <header className="messages-app__chat-header">
        {/* Chat header with user info + actions */}
      </header>
      
      <MessageList />
      
      <Composer />
    </section>
  );
}


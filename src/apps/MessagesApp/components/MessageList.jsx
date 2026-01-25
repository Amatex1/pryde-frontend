/**
 * MessageList — Scrollable Message Container
 * 
 * Phase 1 Scaffold: Structure only, no logic.
 * 
 * Responsibility:
 * - Render grouped messages with date headers
 * - Handle scroll behavior (auto-scroll to bottom)
 * - Display typing indicator
 * - Handle empty state
 * 
 * Extracted from: src/pages/Messages.jsx
 * - Message grouping logic: lines 243-286
 * - Message rendering loop: lines 1960-2080
 * - Scroll to bottom: lines 557-640
 * - Date header logic: lines 198-233
 * 
 * Props (to be implemented in Phase 3):
 * - messages: Array
 * - groupedMessages: Array (from useMessages hook)
 * - isTyping: boolean
 * - currentUser: Object
 * 
 * Will reuse:
 * - src/components/MessageBubble.jsx
 * - src/components/TypingIndicator.jsx
 */

import React from 'react';

export default function MessageList() {
  return (
    <div className="messages-app__messages-scroll">
      {/* MessageList scaffold — logic added in Phase 3 */}
      {/* Will contain:
          - Date headers
          - MessageGroup components
          - MessageBubble components (reused)
          - TypingIndicator (reused)
      */}
    </div>
  );
}


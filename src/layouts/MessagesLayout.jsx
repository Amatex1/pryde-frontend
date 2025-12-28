/**
 * MessagesLayout - Layout component for Messages feature
 *
 * RESPONSIBILITIES:
 * - Handle the split-pane layout for messages
 * - Manage responsive behavior (mobile vs desktop)
 * - Control visibility of conversation list vs thread on mobile
 *
 * RULES:
 * - ONLY layout logic (widths, grids, media queries)
 * - NO business logic
 * - NO data fetching
 *
 * NOTE: Messages has a specialized layout that doesn't use PageLayout
 * because it needs a split-pane view with different mobile behavior.
 */

import React from 'react';
import { useViewport } from '../hooks/useViewport';
import './MessagesLayout.css';

export default function MessagesLayout({
  conversationList,
  messageThread,
  messageComposer,
  hasActiveChat = false,
}) {
  const { isMobile } = useViewport();

  // On mobile, show either conversation list OR thread (not both)
  // On desktop, show both side by side
  const showConversationList = !isMobile || !hasActiveChat;
  const showThread = !isMobile || hasActiveChat;

  return (
    <div className="messages-layout">
      {/* Conversation List Panel */}
      {showConversationList && (
        <div className="messages-sidebar">
          {conversationList}
        </div>
      )}

      {/* Message Thread Panel */}
      {showThread && (
        <div className="messages-main">
          {hasActiveChat ? (
            <>
              <div className="messages-thread-area">
                {messageThread}
              </div>
              <div className="messages-composer-area">
                {messageComposer}
              </div>
            </>
          ) : (
            <div className="messages-empty-state">
              <div className="empty-state-content">
                <span className="empty-icon">💬</span>
                <h3>Select a conversation</h3>
                <p>Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


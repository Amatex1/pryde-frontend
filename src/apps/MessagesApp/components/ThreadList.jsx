/**
 * ThreadList — Conversation List Component
 * 
 * Phase 1 Scaffold: Structure only, no logic.
 * 
 * Responsibility:
 * - Display list of conversations (DMs and groups)
 * - Handle conversation selection
 * - Filter by tabs (All/Unread/Archived)
 * - Search/filter conversations
 * 
 * Extracted from: src/pages/Messages.jsx
 * - Conversation list rendering: lines 1600-1856
 * - Sidebar header: lines 1104-1113
 * - Tab filtering: lines 1565-1600
 * 
 * Props (to be implemented in Phase 3):
 * - conversations: Array
 * - groupChats: Array
 * - selectedChat: string
 * - onSelectChat: Function
 * - activeTab: 'all' | 'unread' | 'archived'
 * - onTabChange: Function
 */

import React from 'react';

export default function ThreadList() {
  return (
    <aside className="messages-app__threads">
      {/* ThreadList scaffold — logic added in Phase 3 */}
      <div className="messages-app__threads-header">
        {/* Header with title + action buttons */}
      </div>
      <div className="messages-app__threads-tabs">
        {/* All / Unread / Archived tabs */}
      </div>
      <div className="messages-app__threads-scroll">
        {/* Scrollable conversation list */}
      </div>
    </aside>
  );
}


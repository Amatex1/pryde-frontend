/**
 * MessagesApp — Root Component
 * 
 * Phase 1 Scaffold: Structure only, no logic.
 * 
 * Architecture: App-style surface (not page)
 * - Fixed viewport height
 * - 3-column grid layout
 * - Container-owned scroll (not browser)
 * 
 * Extracted from: src/pages/Messages.jsx
 */

import React from 'react';
import ThreadList from './components/ThreadList';
import ChatColumn from './components/ChatColumn';
import InfoPanel from './components/InfoPanel';
import './MessagesApp.css';

export default function MessagesApp() {
  return (
    <div className="messages-app">
      {/* Column 1: Thread/Conversation List */}
      <ThreadList />
      
      {/* Column 2: Chat Area (Header + Messages + Composer) */}
      <ChatColumn />
      
      {/* Column 3: Info Panel (User/Group details) */}
      <InfoPanel />
    </div>
  );
}


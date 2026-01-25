/**
 * Composer — Message Input Component
 * 
 * Phase 1 Scaffold: Structure only, no logic.
 * 
 * Responsibility:
 * - Message text input with auto-resize
 * - File/image attachment
 * - Emoji picker trigger
 * - GIF picker trigger
 * - Voice recorder trigger
 * - Reply-to preview
 * - Send button
 * 
 * Extracted from: src/pages/Messages.jsx
 * - Composer area: lines 2080-2100
 * - Send message logic: lines 880-1050
 * - File upload logic: lines 1050-1140
 * - Draft management: lines 1151-1180
 * 
 * Props (to be implemented in Phase 3):
 * - disabled: boolean
 * - onSend: Function
 * - onTyping: Function
 * - replyingTo: Object
 * - onCancelReply: Function
 * 
 * Will reuse:
 * - src/components/MessageInput.jsx
 * - src/components/EmojiPicker.jsx (lazy)
 * - src/components/GifPicker.jsx (lazy)
 * - src/components/VoiceRecorder.jsx (lazy)
 */

import React from 'react';

export default function Composer() {
  return (
    <footer className="messages-app__composer">
      {/* Composer scaffold — logic added in Phase 3 */}
      {/* Will contain:
          - Reply preview (conditional)
          - MessageInput component (reused)
          - Attachment buttons
          - Send button
      */}
    </footer>
  );
}


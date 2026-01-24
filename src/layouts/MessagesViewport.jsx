/**
 * MessagesViewport - Full viewport control for Messages
 * 
 * Provides a dedicated viewport container that bypasses
 * the standard page container for Messenger-style layout.
 */

import './MessagesViewport.css';

export default function MessagesViewport({ children }) {
  return (
    <div className="messages-viewport">
      {children}
    </div>
  );
}


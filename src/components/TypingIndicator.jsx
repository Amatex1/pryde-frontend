/**
 * TypingIndicator - Calm, subtle typing status
 *
 * Design rules:
 * - No bouncing dots
 * - No noise
 * - Calm fade-in/out only
 * - Never push layout
 * - Never animate movement
 */

export default function TypingIndicator({ isTyping, userName }) {
  return (
    <div className={`typing-indicator ${isTyping ? 'active' : ''}`}>
      {userName ? `${userName} is typing…` : 'Typing…'}
    </div>
  );
}

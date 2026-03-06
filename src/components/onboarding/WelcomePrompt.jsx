/**
 * WelcomePrompt - First-time user onboarding prompt
 * 
 * Gentle welcome card shown to new users (account < 48 hours)
 * Maintains Pryde's calm, non-intrusive philosophy.
 * 
 * Features:
 * - Soft, welcoming design
 * - Dismissible
 * - Shows at top of feed
 * - Random prompt from community prompts list
 */

import { useState, useEffect } from 'react';
import './WelcomePrompt.css';

/**
 * Community prompts for new users
 */
const WELCOME_PROMPTS = [
  "What's something that made you smile today?",
  "Share something small from your day.",
  "Say hello to the community.",
  "What's a small win you had recently?",
  "What are you looking forward to?",
  "Share something you're grateful for."
];

/**
 * Get random prompt
 */
const getRandomPrompt = () => {
  const index = Math.floor(Math.random() * WELCOME_PROMPTS.length);
  return WELCOME_PROMPTS[index];
};

/**
 * WelcomePrompt Component
 * @param {boolean} isVisible - Whether to show the prompt
 * @param {function} onDismiss - Callback when user dismisses prompt
 * @param {string} className - Additional CSS classes
 */
export function WelcomePrompt({ isVisible = true, onDismiss, className = '' }) {
  const [prompt, setPrompt] = useState(getRandomPrompt());
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Refresh prompt on mount
    setPrompt(getRandomPrompt());
  }, []);

  if (!isVisible || isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div className={`welcome-prompt ${className} ${isMinimized ? 'welcome-prompt-minimized' : ''}`}>
      <div className="welcome-prompt-header">
        <span className="welcome-prompt-title">Welcome to Pryde</span>
        <div className="welcome-prompt-actions">
          <button 
            className="welcome-prompt-btn welcome-prompt-btn-minimize"
            onClick={handleMinimize}
            aria-label={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? '▲' : '▼'}
          </button>
          <button 
            className="welcome-prompt-btn welcome-prompt-btn-dismiss"
            onClick={handleDismiss}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
      
      {!isMinimized && (
        <>
          <p className="welcome-prompt-message">
            {prompt}
          </p>
          
          <div className="welcome-prompt-actions-row">
            <button className="welcome-prompt-create-btn">
              Create Post
            </button>
            <button className="welcome-prompt-skip-btn" onClick={handleDismiss}>
              Skip for now
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default WelcomePrompt;

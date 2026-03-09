/**
 * Keyboard Shortcuts
 * Power user keyboard navigation
 */

import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Keyboard shortcuts configuration
 */
const DEFAULT_SHORTCUTS = {
  // Navigation
  'j': { action: 'next', description: 'Next post' },
  'k': { action: 'prev', description: 'Previous post' },
  'Enter': { action: 'open', description: 'Open post' },
  'Escape': { action: 'close', description: 'Close modal' },
  
  // Actions
  'l': { action: 'like', description: 'Like post' },
  'r': { action: 'reply', description: 'Reply to post' },
  'b': { action: 'bookmark', description: 'Bookmark post' },
  's': { action: 'share', description: 'Share post' },
  
  // Navigation
  'h': { action: 'home', description: 'Go to home' },
  'm': { action: 'messages', description: 'Go to messages' },
  'n': { action: 'notifications', description: 'Go to notifications' },
  'p': { action: 'profile', description: 'Go to profile' },
  '/': { action: 'search', description: 'Focus search' },
  '?': { action: 'help', description: 'Show keyboard shortcuts' },
  
  // Compose
  'c': { action: 'compose', description: 'New post' },
};

/**
 * useKeyboardShortcuts hook
 * @param {Object} handlers - Map of action names to handler functions
 * @param {Object} options - Configuration options
 */
export function useKeyboardShortcuts(handlers = {}, options = {}) {
  const {
    enabled = true,
    shortcuts = DEFAULT_SHORTCUTS,
    ignoreInputs = true,
    ignoreTags = ['INPUT', 'TEXTAREA', 'SELECT']
  } = options;

  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    // Don't trigger in input fields (unless explicitly allowed)
    if (ignoreInputs && ignoreTags.includes(event.target.tagName)) {
      // Allow certain shortcuts in inputs
      if (event.key === 'Escape') {
        event.target.blur();
        return;
      }
      return;
    }

    // Don't trigger when modifier keys are pressed
    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    const key = event.key;
    const shortcut = shortcuts[key];

    if (shortcut && handlers[shortcut.action]) {
      event.preventDefault();
      handlers[shortcut.action](event);
    }
  }, [enabled, handlers, shortcuts, ignoreInputs, ignoreTags]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    shortcuts,
    shortcutsList: Object.entries(shortcuts).map(([key, value]) => ({
      key,
      ...value
    }))
  };
}

/**
 * KeyboardShortcutsModal component
 * Shows available keyboard shortcuts
 */
export function KeyboardShortcutsModal({ isOpen, onClose }) {
  const shortcuts = Object.entries(DEFAULT_SHORTCUTS).map(([key, value]) => ({
    key,
    ...value
  }));

  if (!isOpen) return null;

  return (
    <div 
      className="keyboard-shortcuts-modal"
      role="dialog"
      aria-label="Keyboard shortcuts"
    >
      <div className="shortcuts-header">
        <h2>Keyboard Shortcuts</h2>
        <button onClick={onClose} aria-label="Close">✕</button>
      </div>
      <div className="shortcuts-list">
        {shortcuts.map(({ key, action, description }) => (
          <div key={key} className="shortcut-item">
            <kbd className="shortcut-key">{key}</kbd>
            <span className="shortcut-description">{description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * createKeyboardHandler - Factory for creating action handlers
 */
export function createKeyboardHandler(navigate) {
  return {
    next: () => {
      // Implement: move to next post
      window.dispatchEvent(new CustomEvent('keyboard:next'));
    },
    prev: () => {
      window.dispatchEvent(new CustomEvent('keyboard:prev'));
    },
    open: () => {
      window.dispatchEvent(new CustomEvent('keyboard:open'));
    },
    close: () => {
      window.dispatchEvent(new CustomEvent('keyboard:close'));
    },
    like: () => {
      window.dispatchEvent(new CustomEvent('keyboard:like'));
    },
    reply: () => {
      window.dispatchEvent(new CustomEvent('keyboard:reply'));
    },
    bookmark: () => {
      window.dispatchEvent(new CustomEvent('keyboard:bookmark'));
    },
    share: () => {
      window.dispatchEvent(new CustomEvent('keyboard:share'));
    },
    home: () => navigate('/'),
    messages: () => navigate('/messages'),
    notifications: () => navigate('/notifications'),
    profile: () => navigate('/profile'),
    search: () => {
      const searchInput = document.querySelector('[data-search-input]');
      searchInput?.focus();
    },
    help: () => {
      window.dispatchEvent(new CustomEvent('keyboard:showHelp'));
    },
    compose: () => {
      window.dispatchEvent(new CustomEvent('keyboard:compose'));
    }
  };
}

export default {
  useKeyboardShortcuts,
  KeyboardShortcutsModal,
  createKeyboardHandler,
  DEFAULT_SHORTCUTS
};

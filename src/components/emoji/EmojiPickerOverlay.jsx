import React, { useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { PRYDE_REACTIONS } from './prydeEmojis';
import './EmojiPickerOverlay.css';

/**
 * Portal-based Emoji Picker Overlay
 * 
 * Renders emoji picker as a portal to #overlay-root for stable positioning.
 * Supports desktop (popover) and mobile (bottom sheet) modes.
 */
const EmojiPickerOverlay = ({
  open,
  mode = 'desktop', // 'desktop' | 'mobile'
  anchorRect = null, // { top, left, bottom, right } for desktop positioning
  onSelect,
  onClose
}) => {
  const overlayRef = useRef(null);
  const pickerRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose();
      }
    };

    // Small delay to avoid closing immediately on the click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [open, onClose]);

  // Close on scroll (desktop only)
  useEffect(() => {
    if (!open || mode !== 'desktop') return;

    const handleScroll = () => {
      onClose();
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [open, mode, onClose]);

  // Calculate popover position (desktop)
  const getPopoverStyle = useCallback(() => {
    if (!anchorRect) return {};

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const pickerWidth = 340;
    const pickerHeight = 80;
    const padding = 8;

    let left = anchorRect.left;
    let top = anchorRect.top - pickerHeight - padding;

    // Clamp to viewport bounds
    if (left + pickerWidth > viewportWidth - padding) {
      left = viewportWidth - pickerWidth - padding;
    }
    if (left < padding) {
      left = padding;
    }

    // If not enough room above, position below
    if (top < padding) {
      top = anchorRect.bottom + padding;
    }

    // If still not enough room, center vertically
    if (top + pickerHeight > viewportHeight - padding) {
      top = viewportHeight - pickerHeight - padding;
    }

    return { top, left };
  }, [anchorRect]);

  const handleEmojiSelect = (emoji) => {
    onSelect(emoji);
    onClose();
  };

  if (!open) return null;

  const overlayRoot = document.getElementById('overlay-root');
  if (!overlayRoot) {
    console.warn('EmojiPickerOverlay: #overlay-root not found');
    return null;
  }

  const isDesktop = mode === 'desktop';
  const popoverStyle = isDesktop ? getPopoverStyle() : {};

  const content = (
    <div
      ref={overlayRef}
      className={`emoji-picker-overlay ${isDesktop ? 'emoji-picker-popover' : 'emoji-picker-sheet'}`}
      role="dialog"
      aria-label="Emoji picker"
    >
      {!isDesktop && (
        <div className="emoji-picker-sheet-header">
          <div className="emoji-picker-sheet-handle" />
          <span className="emoji-picker-sheet-title">React</span>
          <button className="emoji-picker-sheet-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
      )}
      <div
        ref={pickerRef}
        className="emoji-picker-content"
        style={isDesktop ? popoverStyle : undefined}
      >
        <div className="pryde-emoji-grid">
          {PRYDE_REACTIONS.map(({ id, emoji, label }) => (
            <button
              key={id}
              className="pryde-emoji-button"
              onClick={() => handleEmojiSelect(emoji)}
              title={label}
              aria-label={label}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, overlayRoot);
};

export default EmojiPickerOverlay;


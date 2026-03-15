import React, { useState, useRef, useEffect } from 'react';
import './EmojiPicker.css';

const EmojiPicker = ({ onEmojiSelect, onClose }) => {
  const pickerRef = useRef(null);
  const emojis = [
    '❤️', '😂', '😮', '😢', '😡', '👍', '👎', '🎉', '🔥', '💯',
    '😊', '😍', '🤔', '😎', '🙏', '👏', '💪', '✨', '⭐', '💜'
  ];

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="emoji-picker-overlay">
      <div className="emoji-picker" ref={pickerRef} role="dialog" aria-modal="true" aria-labelledby="emoji-picker-title">
        <div className="emoji-picker-header">
          <h4 id="emoji-picker-title">React with an emoji</h4>
          <button className="emoji-picker-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="emoji-grid">
          {emojis.map((emoji, index) => (
            <button
              key={index}
              className="emoji-button"
              onClick={() => {
                onEmojiSelect(emoji);
                onClose();
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmojiPicker;


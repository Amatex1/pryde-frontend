import React, { useState, useRef, useEffect } from 'react';
import api from '../utils/api';
import { getSocket } from '../utils/socket';
import './ReactionButton.css';

/**
 * Universal ReactionButton Component
 *
 * A reusable Facebook-style reaction button for posts, comments, and replies.
 *
 * Props:
 * - targetType: 'post' | 'comment'
 * - targetId: string (ID of the post or comment)
 * - currentUserId: string (current user's ID, for calculating user reaction)
 * - initialUserReaction: string (optional, user's current reaction emoji from parent)
 * - onReactionChange: function (optional, callback when reaction changes)
 * - onCountClick: function (optional, callback when reaction count is clicked)
 */
const ReactionButton = ({
  targetType,
  targetId,
  currentUserId,
  initialUserReaction,
  onReactionChange,
  onCountClick
}) => {
  const [reactions, setReactions] = useState({});
  const [userReaction, setUserReaction] = useState(initialUserReaction || null);
  const [showPicker, setShowPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(!!initialUserReaction);

  const pickerRef = useRef(null);
  const buttonRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  // Fetch reactions on mount
  useEffect(() => {
    const fetchReactions = async () => {
      try {
        const response = await api.get(`/reactions/${targetType}/${targetId}`);
        setReactions(response.data.reactions || {});
        // Only update userReaction if API returns a valid value
        // Preserve initialUserReaction if API returns null/undefined
        setUserReaction(prev =>
          response.data.userReaction !== undefined && response.data.userReaction !== null
            ? response.data.userReaction
            : prev
        );
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to fetch reactions:', error);
        setIsInitialized(true);
      }
    };

    fetchReactions();
  }, [targetType, targetId]);

  // Listen for real-time reaction updates
  useEffect(() => {
    const socket = getSocket();

    // Skip if socket is not available
    if (!socket || typeof socket.on !== 'function') {
      return;
    }

    const handleReactionAdded = (data) => {
      if (data.targetType === targetType && data.targetId === targetId) {
        setReactions(data.reactions);
        // Update user reaction if it was this user who reacted
        if (data.userId === currentUserId) {
          setUserReaction(data.emoji);
        }
      }
    };

    const handleReactionRemoved = (data) => {
      if (data.targetType === targetType && data.targetId === targetId) {
        setReactions(data.reactions);
        // Update user reaction if it was this user who removed their reaction
        if (data.userId === currentUserId) {
          setUserReaction(null);
        }
      }
    };

    socket.on('reaction_added', handleReactionAdded);
    socket.on('reaction_removed', handleReactionRemoved);

    return () => {
      if (socket && typeof socket.off === 'function') {
        socket.off('reaction_added', handleReactionAdded);
        socket.off('reaction_removed', handleReactionRemoved);
      }
    };
  }, [targetType, targetId, currentUserId]);

  // Approved Pryde Reaction Set
  const availableEmojis = [
    '👍', '❤️', '😂', '😮', '🥺', '😡',
    '🤗', '🎉', '🔥', '👏', '🏳️‍🌈', '🏳️‍⚧️'
  ];

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        pickerRef.current && 
        !pickerRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle reaction click
  const handleReaction = async (emoji) => {
    if (isLoading) return;

    setIsLoading(true);
    setShowPicker(false);

    // Optimistic update
    const previousReactions = { ...reactions };
    const previousUserReaction = userReaction;

    try {
      // Update UI optimistically
      const newReactions = { ...reactions };
      
      // Remove old reaction count
      if (previousUserReaction && newReactions[previousUserReaction]) {
        newReactions[previousUserReaction]--;
        if (newReactions[previousUserReaction] === 0) {
          delete newReactions[previousUserReaction];
        }
      }

      // Add new reaction count (or remove if same emoji)
      if (emoji === previousUserReaction) {
        // Toggle off
        setUserReaction(null);
      } else {
        // Add or update
        newReactions[emoji] = (newReactions[emoji] || 0) + 1;
        setUserReaction(emoji);
      }

      setReactions(newReactions);

      // API call
      const response = await api.post('/reactions', {
        targetType,
        targetId,
        emoji
      });

      // Update with server response
      setReactions(response.data.reactions);
      setUserReaction(response.data.action === 'removed' ? null : emoji);

      // Callback
      if (onReactionChange) {
        onReactionChange(response.data.reactions, response.data.action === 'removed' ? null : emoji);
      }
    } catch (error) {
      console.error('Failed to react:', error);
      // Revert optimistic update
      setReactions(previousReactions);
      setUserReaction(previousUserReaction);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle hover (desktop only)
  const handleMouseEnter = () => {
    if (window.innerWidth > 768) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      hoverTimeoutRef.current = setTimeout(() => {
        setShowPicker(true);
      }, 500);
    }
  };

  const handleMouseLeave = () => {
    if (window.innerWidth > 768) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      hoverTimeoutRef.current = setTimeout(() => {
        setShowPicker(false);
      }, 500);
    }
  };

  // Handle click (mobile)
  const handleClick = () => {
    if (window.innerWidth <= 768) {
      setShowPicker(!showPicker);
    } else if (!userReaction) {
      setShowPicker(!showPicker);
    } else {
      // On desktop, clicking when you have a reaction removes it
      handleReaction(userReaction);
    }
  };

  // Calculate total reaction count
  const totalCount = Object.values(reactions).reduce((sum, count) => sum + count, 0);

  // Show loading state while fetching
  if (!isInitialized) {
    return (
      <div className="reaction-button-container">
        <button className="reaction-button" disabled>
          👍
        </button>
      </div>
    );
  }

  return (
    <div className="reaction-button-container">
      <button
        ref={buttonRef}
        className={`reaction-button ${userReaction ? 'has-reaction' : ''}`}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={isLoading}
        aria-label={userReaction ? `You reacted with ${userReaction}` : 'React'}
      >
        {userReaction || '👍'}
      </button>

      {totalCount > 0 && (
        <button
          type="button"
          className="reaction-count"
          onClick={onCountClick}
          aria-label="View reactions"
        >
          {totalCount}
        </button>
      )}

      {showPicker && (
        <div 
          ref={pickerRef}
          className="reaction-picker"
          onMouseEnter={() => {
            if (window.innerWidth > 768 && hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
            }
          }}
          onMouseLeave={handleMouseLeave}
        >
          {availableEmojis.map(emoji => (
            <button
              key={emoji}
              className={`reaction-emoji ${userReaction === emoji ? 'selected' : ''}`}
              onClick={() => handleReaction(emoji)}
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReactionButton;


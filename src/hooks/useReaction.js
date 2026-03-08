import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { getSocket } from '../utils/socket';

/**
 * useReaction - Hook for managing reactions on posts/comments
 * 
 * Handles:
 * - Fetching reactions
 * - Adding/removing reactions
 * - Real-time updates via socket
 * 
 * @param {Object} options
 * @param {string} options.targetType - 'post' or 'comment'
 * @param {string} options.targetId - ID of the target
 * @param {string} options.currentUserId - Current user's ID
 * @returns {Object} Reaction state and handlers
 */
export function useReaction({ targetType, targetId, currentUserId }) {
  const [reactions, setReactions] = useState({});
  const [userReaction, setUserReaction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch reactions on mount
  useEffect(() => {
    const fetchReactions = async () => {
      if (!targetType || !targetId) return;
      
      try {
        const response = await api.get(`/reactions/${targetType}/${targetId}`);
        setReactions(response.data.reactions || {});
        setUserReaction(response.data.userReaction || null);
      } catch (error) {
        console.error('Failed to fetch reactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReactions();
  }, [targetType, targetId]);

  // Listen for real-time updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket || typeof socket.on !== 'function') return;

    const handleReactionAdded = (data) => {
      if (data.targetType === targetType && data.targetId === targetId) {
        setReactions(data.reactions || {});
        if (data.userId === currentUserId) {
          setUserReaction(data.emoji);
        }
      }
    };

    const handleReactionRemoved = (data) => {
      if (data.targetType === targetType && data.targetId === targetId) {
        setReactions(data.reactions || {});
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

  // Handle reaction change
  const handleReaction = useCallback(async (emoji) => {
    if (isUpdating || !targetType || !targetId) return;

    setIsUpdating(true);
    
    // Optimistic update
    const previousReactions = { ...reactions };
    const previousUserReaction = userReaction;

    try {
      const newReactions = { ...reactions };
      
      // Remove old reaction
      if (previousUserReaction && newReactions[previousUserReaction]) {
        newReactions[previousUserReaction]--;
        if (newReactions[previousUserReaction] === 0) {
          delete newReactions[previousUserReaction];
        }
      }

      // Add new or toggle off
      if (emoji === previousUserReaction) {
        setUserReaction(null);
      } else {
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

      setReactions(response.data.reactions || {});
      setUserReaction(response.data.action === 'removed' ? null : emoji);
    } catch (error) {
      console.error('Failed to react:', error);
      // Revert optimistic update
      setReactions(previousReactions);
      setUserReaction(previousUserReaction);
    } finally {
      setIsUpdating(false);
    }
  }, [targetType, targetId, reactions, userReaction, isUpdating]);

  // Calculate total count
  const totalCount = Object.values(reactions).reduce((sum, count) => sum + count, 0);

  return {
    reactions,
    userReaction,
    totalCount,
    isLoading,
    isUpdating,
    handleReaction,
  };
}

export default useReaction;


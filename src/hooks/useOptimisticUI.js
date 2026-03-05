import { useState, useCallback } from 'react';

/**
 * useOptimisticUI - Hook for optimistic UI updates
 * 
 * Provides instant feedback while API requests complete in background.
 * Automatically rolls back if the API call fails.
 * 
 * Usage:
 * const { data, setOptimistic, execute, isOptimistic } = useOptimisticUI({
 *   initialValue: false,
 *   onSuccess: (newValue) => api.update(value),
 *   onError: (error, rollback) => rollback()
 * });
 * 
 * // For toggle actions (like/unlike, follow/unfollow):
 * const { data: isLiked, toggle: toggleLike } = useOptimisticToggle({
 *   initialValue: post.isLiked,
 *   onToggle: () => api.toggleLike(postId)
 * });
 */
export function useOptimisticUI({
  initialValue,
  onExecute,
  onSuccess,
  onError,
  rollbackOnError = true
}) {
  const [data, setData] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [isOptimistic, setIsOptimistic] = useState(false);
  const [error, setError] = useState(null);

  // Set an optimistic value immediately
  const setOptimistic = useCallback((optimisticValue) => {
    setData(optimisticValue);
    setIsOptimistic(true);
  }, []);

  // Rollback to previous value
  const rollback = useCallback((previousValue) => {
    setData(previousValue);
    setIsOptimistic(false);
    setError(null);
  }, []);

  // Execute the actual API call
  const execute = useCallback(async (...args) => {
    const previousValue = data;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await onExecute(...args);
      
      // Success
      setIsOptimistic(false);
      onSuccess?.(result);
      
      return result;
    } catch (err) {
      // Error - rollback if enabled
      if (rollbackOnError) {
        setData(previousValue);
        setIsOptimistic(false);
      }
      
      setError(err);
      onError?.(err, () => rollback(previousValue));
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [data, onExecute, onSuccess, onError, rollback, rollbackOnError]);

  return {
    data,
    setData,
    setOptimistic,
    rollback,
    execute,
    isLoading,
    isOptimistic,
    error,
    // Reset to initial state
    reset: useCallback(() => {
      setData(initialValue);
      setIsOptimistic(false);
      setError(null);
    }, [initialValue])
  };
}

/**
 * useOptimisticToggle - Simplified hook for toggle actions
 * 
 * Perfect for like/unlike, follow/unfollow, bookmark, etc.
 * 
 * Usage:
 * const { value: isLiked, toggle, isPending } = useOptimisticToggle({
 *   initialValue: post.isLiked,
 *   onToggle: (newValue) => api.setLike(postId, newValue)
 * });
 * 
 * // In JSX:
 * <button onClick={toggle} className={isLiked ? 'liked' : ''}>
 *   {isLiked ? '❤️' : '🤍'}
 * </button>
 */
export function useOptimisticToggle({
  initialValue,
  onToggle,
  enabled = true
}) {
  const [value, setValue] = useState(initialValue);
  const [isPending, setIsPending] = useState(false);

  const toggle = useCallback(async () => {
    if (!enabled || isPending) return;
    
    const previousValue = value;
    const newValue = !previousValue;
    
    // Optimistic update
    setValue(newValue);
    setIsPending(true);
    
    try {
      await onToggle(newValue);
    } catch (error) {
      // Rollback on error
      setValue(previousValue);
      console.error('Optimistic toggle failed:', error);
    } finally {
      setIsPending(false);
    }
  }, [value, onToggle, enabled, isPending]);

  return {
    value,
    setValue,
    toggle,
    isPending,
    // Reset to initial value
    reset: useCallback(() => {
      setValue(initialValue);
    }, [initialValue])
  };
}

/**
 * useOptimisticList - For adding/removing items from lists
 * 
 * Usage:
 * const { 
 *   items, 
 *   addItem, 
 *   removeItem, 
 *   updateItem,
 *   isPending 
 * } = useOptimisticList({
 *   initialItems: [],
 *   onAdd: (item) => api.create(item),
 *   onRemove: (id) => api.delete(id),
 *   onUpdate: (id, updates) => api.update(id, updates)
 * });
 */
export function useOptimisticList({
  initialItems = [],
  onAdd,
  onRemove,
  onUpdate,
  getKey = (item) => item._id || item.id
}) {
  const [items, setItems] = useState(initialItems);
  const [pendingIds, setPendingIds] = useState(new Set());

  const addItem = useCallback(async (newItem) => {
    const tempId = `temp_${Date.now()}`;
    const itemWithTempId = { ...newItem, tempId, _pending: true };
    
    // Optimistically add
    setItems(prev => [...prev, itemWithTempId]);
    setPendingIds(prev => new Set([...prev, tempId]));
    
    try {
      const savedItem = await onAdd(newItem);
      // Replace temp item with real item
      setItems(prev => prev.map(i => 
        i.tempId === tempId ? { ...savedItem, _pending: false } : i
      ));
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
      return savedItem;
    } catch (error) {
      // Remove on error
      setItems(prev => prev.filter(i => i.tempId !== tempId));
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
      throw error;
    }
  }, [onAdd]);

  const removeItem = useCallback(async (id) => {
    const key = getKey({ _id: id, id });
    const itemToRemove = items.find(i => getKey(i) === key);
    
    // Optimistically remove
    setItems(prev => prev.filter(i => getKey(i) !== key));
    setPendingIds(prev => new Set([...prev, key]));
    
    try {
      await onRemove(id);
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    } catch (error) {
      // Restore on error
      if (itemToRemove) {
        setItems(prev => [...prev, itemToRemove]);
      }
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      throw error;
    }
  }, [items, onRemove, getKey]);

  const updateItem = useCallback(async (id, updates) => {
    const key = getKey({ _id: id, id });
    const previousItem = items.find(i => getKey(i) === key);
    
    // Optimistically update
    setItems(prev => prev.map(i => 
      getKey(i) === key ? { ...i, ...updates, _pending: true } : i
    ));
    setPendingIds(prev => new Set([...prev, key]));
    
    try {
      const updatedItem = await onUpdate(id, updates);
      setItems(prev => prev.map(i => 
        getKey(i) === key ? { ...updatedItem, _pending: false } : i
      ));
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      return updatedItem;
    } catch (error) {
      // Restore on error
      if (previousItem) {
        setItems(prev => prev.map(i => 
          getKey(i) === key ? previousItem : i
        ));
      }
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      throw error;
    }
  }, [items, onUpdate, getKey]);

  return {
    items,
    setItems,
    addItem,
    removeItem,
    updateItem,
    isPending: pendingIds.size > 0,
    pendingIds,
    isItemPending: useCallback((id) => {
      const key = getKey({ _id: id, id });
      return pendingIds.has(key);
    }, [pendingIds, getKey])
  };
}

export default useOptimisticUI;

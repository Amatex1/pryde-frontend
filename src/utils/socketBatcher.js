/**
 * ⚡ PERFORMANCE: Socket Event Batcher
 *
 * Batches multiple socket events within a time window to reduce React state updates.
 * Instead of N individual setState calls, we batch them into 1 call.
 *
 * Example: If 10 reaction events arrive within 100ms, instead of 10 re-renders,
 * we get 1 re-render with all 10 updates applied.
 *
 * Phase 2C: Socket Batching for Feed performance
 */

import { useRef, useEffect } from 'react';

/**
 * Creates a batched event handler that collects events and flushes them together.
 * 
 * @param {Function} processBatch - Function that receives array of batched events
 * @param {number} delay - Time window in ms to collect events (default: 100ms)
 * @returns {Object} - { add: (event) => void, flush: () => void, destroy: () => void }
 */
export function createEventBatcher(processBatch, delay = 100) {
  let batch = [];
  let timeoutId = null;

  const flush = () => {
    if (batch.length > 0) {
      const events = [...batch];
      batch = [];
      processBatch(events);
    }
    timeoutId = null;
  };

  const add = (event) => {
    batch.push(event);
    
    // Reset timer on each new event (debounce pattern)
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(flush, delay);
  };

  const destroy = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    batch = [];
  };

  return { add, flush, destroy };
}

/**
 * Creates a keyed batcher that batches events by a key (e.g., postId).
 * Only keeps the latest event for each key within the batch window.
 * 
 * Useful for reactions where we only care about the final state.
 * 
 * @param {Function} processBatch - Function that receives Map of key -> latest event
 * @param {Function} getKey - Function to extract key from event (e.g., event => event.postId)
 * @param {number} delay - Time window in ms (default: 100ms)
 * @returns {Object} - { add: (event) => void, flush: () => void, destroy: () => void }
 */
export function createKeyedBatcher(processBatch, getKey, delay = 100) {
  let batch = new Map();
  let timeoutId = null;

  const flush = () => {
    if (batch.size > 0) {
      const events = new Map(batch);
      batch = new Map();
      processBatch(events);
    }
    timeoutId = null;
  };

  const add = (event) => {
    const key = getKey(event);
    batch.set(key, event); // Latest event wins
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(flush, delay);
  };

  const destroy = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    batch = new Map();
  };

  return { add, flush, destroy };
}

/**
 * React hook for creating a batched socket event handler.
 * Automatically cleans up on unmount.
 *
 * @param {Function} processBatch - Function to process batched events
 * @param {number} delay - Batch window in ms
 * @returns {Function} - Function to add events to the batch
 */
export function useBatchedHandler(processBatch, delay = 100) {
  const batcherRef = useRef(null);

  // Create batcher on first render
  if (!batcherRef.current) {
    batcherRef.current = createEventBatcher(processBatch, delay);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      batcherRef.current?.destroy();
    };
  }, []);

  return batcherRef.current.add;
}

/**
 * React hook for creating a keyed batched handler.
 *
 * @param {Function} processBatch - Function to process Map of key -> event
 * @param {Function} getKey - Function to extract key from event
 * @param {number} delay - Batch window in ms
 * @returns {Function} - Function to add events to the batch
 */
export function useKeyedBatchedHandler(processBatch, getKey, delay = 100) {
  const batcherRef = useRef(null);

  if (!batcherRef.current) {
    batcherRef.current = createKeyedBatcher(processBatch, getKey, delay);
  }

  useEffect(() => {
    return () => {
      batcherRef.current?.destroy();
    };
  }, []);

  return batcherRef.current.add;
}


/**
 * useScrollMemory - Hook for persisting scroll position
 * 
 * Behavior:
 * - Save scroll position in sessionStorage
 * - Restore on return to the same path
 * - Clear when navigating away from tracked paths
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook for scroll position memory
 * @param {string} key - Unique key for this scroll context (default: 'default')
 * @returns {Object} - { saveScroll, restoreScroll, clearScroll }
 */
export function useScrollMemory(key = 'default') {
  const location = useLocation();
  const scrollPositions = useRef({});
  const isRestoring = useRef(false);

  // Generate storage key based on location and key
  const getStorageKey = (pathname) => `scroll_${key}_${pathname}`;

  // Save current scroll position
  const saveScroll = () => {
    if (isRestoring.current) return;
    
    const scrollY = window.scrollY || window.pageYOffset;
    const storageKey = getStorageKey(location.pathname);
    
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({
        scrollY,
        timestamp: Date.now()
      }));
    } catch (e) {
      // sessionStorage might be full or disabled
      console.warn('Failed to save scroll position:', e);
    }
  };

  // Restore scroll position
  const restoreScroll = () => {
    const storageKey = getStorageKey(location.pathname);
    
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const { scrollY } = JSON.parse(saved);
        
        // Small delay to ensure DOM is ready
        isRestoring.current = true;
        setTimeout(() => {
          window.scrollTo(0, scrollY);
          isRestoring.current = false;
        }, 100);
        
        return true;
      }
    } catch (e) {
      console.warn('Failed to restore scroll position:', e);
    }
    
    return false;
  };

  // Clear saved scroll position
  const clearScroll = () => {
    const storageKey = getStorageKey(location.pathname);
    try {
      sessionStorage.removeItem(storageKey);
    } catch (e) {
      // Ignore
    }
  };

  // On mount, try to restore scroll position
  useEffect(() => {
    restoreScroll();
  }, [location.pathname]);

  // Save scroll on beforeunload and visibility change
  useEffect(() => {
    const handleSave = () => saveScroll();
    
    window.addEventListener('beforeunload', handleSave);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        handleSave();
      }
    });

    return () => {
      window.removeEventListener('beforeunload', handleSave);
    };
  }, [location.pathname]);

  return {
    saveScroll,
    restoreScroll,
    clearScroll
  };
}

export default useScrollMemory;

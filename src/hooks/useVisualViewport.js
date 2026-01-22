/**
 * useVisualViewport - Hook for Visual Viewport API
 * 
 * Provides accurate keyboard detection and viewport measurements on mobile.
 * The Visual Viewport API gives us the actual visible area, excluding
 * the virtual keyboard, address bar, etc.
 * 
 * @returns {Object} Viewport state
 * @returns {number} viewportHeight - Current visible viewport height
 * @returns {number} keyboardHeight - Estimated keyboard height (0 if hidden)
 * @returns {boolean} isKeyboardVisible - Whether keyboard is likely open
 * @returns {number} offsetTop - Visual viewport offset from top
 * @returns {number} scale - Current zoom scale
 */

import { useState, useEffect, useCallback } from 'react';

// Threshold to consider keyboard as "visible" (pixels)
const KEYBOARD_THRESHOLD = 150;

export function useVisualViewport() {
  const [state, setState] = useState(() => ({
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    keyboardHeight: 0,
    isKeyboardVisible: false,
    offsetTop: 0,
    scale: 1,
  }));

  const updateViewport = useCallback(() => {
    if (typeof window === 'undefined') return;

    const vv = window.visualViewport;
    
    if (vv) {
      // Visual Viewport API available (modern browsers)
      const layoutHeight = window.innerHeight;
      const visualHeight = vv.height;
      const keyboardHeight = Math.max(0, layoutHeight - visualHeight - vv.offsetTop);
      
      setState({
        viewportHeight: visualHeight,
        keyboardHeight,
        isKeyboardVisible: keyboardHeight > KEYBOARD_THRESHOLD,
        offsetTop: vv.offsetTop,
        scale: vv.scale,
      });
    } else {
      // Fallback for older browsers
      setState(prev => ({
        ...prev,
        viewportHeight: window.innerHeight,
        keyboardHeight: 0,
        isKeyboardVisible: false,
      }));
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const vv = window.visualViewport;

    // Initial update
    updateViewport();

    if (vv) {
      // Use Visual Viewport API events
      vv.addEventListener('resize', updateViewport);
      vv.addEventListener('scroll', updateViewport);
      
      return () => {
        vv.removeEventListener('resize', updateViewport);
        vv.removeEventListener('scroll', updateViewport);
      };
    } else {
      // Fallback to window resize
      window.addEventListener('resize', updateViewport);
      
      return () => {
        window.removeEventListener('resize', updateViewport);
      };
    }
  }, [updateViewport]);

  return state;
}

/**
 * useKeyboardAwareHeight - Returns a CSS custom property value for keyboard-aware layouts
 * 
 * Use this to set heights that automatically adjust when keyboard opens.
 * 
 * @example
 * const heightStyle = useKeyboardAwareHeight();
 * return <div style={{ height: heightStyle }}>...</div>
 */
export function useKeyboardAwareHeight() {
  const { viewportHeight } = useVisualViewport();
  return `${viewportHeight}px`;
}

/**
 * Standalone function to get current keyboard state
 * Useful for one-off checks without the hook
 */
export function getKeyboardState() {
  if (typeof window === 'undefined' || !window.visualViewport) {
    return { isVisible: false, height: 0 };
  }

  const vv = window.visualViewport;
  const layoutHeight = window.innerHeight;
  const visualHeight = vv.height;
  const keyboardHeight = Math.max(0, layoutHeight - visualHeight - vv.offsetTop);

  return {
    isVisible: keyboardHeight > KEYBOARD_THRESHOLD,
    height: keyboardHeight,
  };
}

export default useVisualViewport;


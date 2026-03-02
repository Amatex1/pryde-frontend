/**
 * Centralized Breakpoint Hook
 * 
 * Provides SSR-safe breakpoint detection with a single resize listener.
 * Consolidates all viewport detection logic in one place.
 * 
 * Breakpoints:
 *   - mobile: 768px (mobile vs desktop)
 *   - sheetMobile: 600px (comment sheet / mobile sheet detection)
 *   - desktopLarge: 1025px (large desktop)
 */

import { useState, useEffect } from 'react';

export const BREAKPOINTS = {
  mobile: 768,
  sheetMobile: 600,
  desktopLarge: 1025
};

/**
 * SSR-safe breakpoint hook
 * @returns {Object} { isMobile, isSheetMobile, isDesktopLarge }
 */
export function useBreakpoint() {
  const [breakpoints, setBreakpoints] = useState({
    isMobile: false,
    isSheetMobile: false,
    isDesktopLarge: false
  });

  useEffect(() => {
    // Handle SSR - window not available
    if (typeof window === 'undefined') {
      return;
    }

    const updateBreakpoints = () => {
      const width = window.innerWidth;
      
      setBreakpoints({
        isMobile: width <= BREAKPOINTS.mobile,
        isSheetMobile: width <= BREAKPOINTS.sheetMobile,
        isDesktopLarge: width >= BREAKPOINTS.desktopLarge
      });
    };

    // Initial check
    updateBreakpoints();

    // Single resize listener
    window.addEventListener('resize', updateBreakpoints);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', updateBreakpoints);
    };
  }, []);

  return breakpoints;
}

export default useBreakpoint;

/**
 * useViewport - Hook for common viewport breakpoints
 * 
 * Provides semantic viewport state for responsive layouts.
 * Uses the same breakpoints as CSS media queries.
 * 
 * @returns {Object} Viewport state
 * @returns {boolean} isMobile - Screen width <= 768px
 * @returns {boolean} isTablet - Screen width 769px - 1024px
 * @returns {boolean} isDesktop - Screen width > 1024px
 * @returns {boolean} isLargeDesktop - Screen width > 1440px
 * 
 * @example
 * const { isMobile, isDesktop } = useViewport();
 * if (isMobile) {
 *   // Render mobile layout
 * }
 */

import { useMediaQuery } from './useMediaQuery';

// Breakpoint constants (match CSS variables)
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
};

export function useViewport() {
  const isMobile = useMediaQuery(`(max-width: ${BREAKPOINTS.mobile}px)`);
  const isTablet = useMediaQuery(`(min-width: ${BREAKPOINTS.mobile + 1}px) and (max-width: ${BREAKPOINTS.tablet}px)`);
  const isDesktop = useMediaQuery(`(min-width: ${BREAKPOINTS.tablet + 1}px)`);
  const isLargeDesktop = useMediaQuery(`(min-width: ${BREAKPOINTS.desktop + 1}px)`);

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    // Convenience combinations
    isMobileOrTablet: isMobile || isTablet,
    isTabletOrDesktop: isTablet || isDesktop,
  };
}


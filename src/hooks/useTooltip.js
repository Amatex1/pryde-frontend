import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * useTooltip - JavaScript-based tooltip hook
 * 
 * Provides a fallback for CSS-based tooltips that may fail in production
 * due to overflow clipping, z-index issues, or ad blockers.
 * 
 * Features:
 * - Uses portal to render outside normal DOM flow (prevents clipping)
 * - Detects viewport boundaries and adjusts position accordingly
 * - Works with both mouse hover and keyboard focus
 * - Lightweight and performant
 * 
 * @param {Object} options
 * @param {string} options.content - Tooltip text content
 * @param {string} options.position - 'top' | 'bottom' | 'left' | 'right' (default: 'bottom')
 * @param {number} options.delay - Show delay in ms (default: 300)
 * @returns {Object} { tooltipProps, TooltipComponent }
 */
export function useTooltip({ content = '', position = 'bottom', delay = 300 } = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [viewportInfo, setViewportInfo] = useState({});
  const timeoutRef = useRef(null);
  const elementRef = useRef(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Calculate position based on element and viewport
  const calculatePosition = useCallback((element) => {
    if (!element) return { top: 0, left: 0, position: 'bottom' };

    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipHeight = 32; // Estimated tooltip height
    const tooltipWidth = 120; // Estimated tooltip width
    const gap = 8; // Gap between element and tooltip

    let newPosition = position;
    let top = 0;
    let left = 0;

    // Calculate horizontal center of element
    const elementCenterX = rect.left + rect.width / 2;
    const elementCenterY = rect.top + rect.height / 2;

    switch (position) {
      case 'top':
        top = rect.top - tooltipHeight - gap;
        left = elementCenterX - tooltipWidth / 2;
        
        // Adjust if would go off screen
        if (top < 10) {
          newPosition = 'bottom';
          top = rect.bottom + gap;
        }
        if (left < 10) left = 10;
        if (left + tooltipWidth > viewportWidth - 10) {
          left = viewportWidth - tooltipWidth - 10;
        }
        break;

      case 'bottom':
        top = rect.bottom + gap;
        left = elementCenterX - tooltipWidth / 2;
        
        // Adjust if would go off screen
        if (top + tooltipHeight > viewportHeight - 10) {
          newPosition = 'top';
          top = rect.top - tooltipHeight - gap;
        }
        if (left < 10) left = 10;
        if (left + tooltipWidth > viewportWidth - 10) {
          left = viewportWidth - tooltipWidth - 10;
        }
        break;

      case 'left':
        top = elementCenterY - tooltipHeight / 2;
        left = rect.left - tooltipWidth - gap;
        
        // Adjust if would go off screen
        if (left < 10) {
          newPosition = 'right';
          left = rect.right + gap;
        }
        if (top < 10) top = 10;
        if (top + tooltipHeight > viewportHeight - 10) {
          top = viewportHeight - tooltipHeight - 10;
        }
        break;

      case 'right':
        top = elementCenterY - tooltipHeight / 2;
        left = rect.right + gap;
        
        // Adjust if would go off screen
        if (left + tooltipWidth > viewportWidth - 10) {
          newPosition = 'left';
          left = rect.left - tooltipWidth - gap;
        }
        if (top < 10) top = 10;
        if (top + tooltipHeight > viewportHeight - 10) {
          top = viewportHeight - tooltipHeight - 10;
        }
        break;

      default:
        top = rect.bottom + gap;
        left = elementCenterX - tooltipWidth / 2;
    }

    return { top, left, position: newPosition };
  }, [position]);

  const handleMouseEnter = useCallback((e) => {
    const element = e.currentTarget;
    elementRef.current = element;
    
    timeoutRef.current = setTimeout(() => {
      const pos = calculatePosition(element);
      setCoords({ x: pos.left, y: pos.top });
      setViewportInfo({ position: pos.position });
      setIsVisible(true);
    }, delay);
  }, [delay, calculatePosition]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  }, []);

  const handleFocus = useCallback((e) => {
    const element = e.currentTarget;
    elementRef.current = element;
    
    timeoutRef.current = setTimeout(() => {
      const pos = calculatePosition(element);
      setCoords({ x: pos.left, y: pos.top });
      setViewportInfo({ position: pos.position });
      setIsVisible(true);
    }, delay);
  }, [delay, calculatePosition]);

  const handleBlur = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  }, []);

  // Update position on scroll/resize while visible
  useEffect(() => {
    if (!isVisible) return;

    const handleUpdate = () => {
      if (elementRef.current) {
        const pos = calculatePosition(elementRef.current);
        setCoords({ x: pos.left, y: pos.top });
        setViewportInfo({ position: pos.position });
      }
    };

    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isVisible, calculatePosition]);

  const tooltipProps = {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleFocus,
    onBlur: handleBlur,
    // Don't override if element already has these handlers
    ...(content ? { 'data-tooltip-js': content } : {}),
  };

  const TooltipComponent = isVisible && content ? (
    createPortal(
      <div
        style={{
          position: 'fixed',
          left: coords.x,
          top: coords.y,
          zIndex: 9999999,
          animation: 'tooltipFadeIn 150ms ease-out',
        }}
        className={`tooltip-js tooltip-js--${viewportInfo.position || position}`}
      >
        <div className="tooltip-js__content">
          {content}
        </div>
      </div>,
      document.body
    )
  ) : null;

  return { tooltipProps, TooltipComponent, isVisible };
}

/**
 * Tooltip wrapper component that combines CSS and JS tooltips
 * Use this component instead of manually adding data-tooltip attributes
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The element to attach tooltip to
 * @param {string} props.content - Tooltip text content
 * @param {string} props.position - Position: 'top' | 'bottom' | 'left' | 'right'
 * @param {number} props.delay - Show delay in ms
 * @param {string} props.className - Additional class names
 */
export function Tooltip({ children, content, position = 'bottom', delay = 300, className = '' }) {
  const { tooltipProps, TooltipComponent } = useTooltip({ content, position, delay });

  return (
    <>
      <span className={className} {...tooltipProps}>
        {children}
      </span>
      {TooltipComponent}
    </>
  );
}

export default useTooltip;

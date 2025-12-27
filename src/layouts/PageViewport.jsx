/**
 * PageViewport - The root scroll container for all pages
 * 
 * RESPONSIBILITIES:
 * - Single vertical scroll container
 * - Safe area insets for notched devices
 * - Background color ownership
 * 
 * RULES:
 * - NO layout logic (columns, grids)
 * - NO breakpoint detection
 * - NO business logic
 */

import './PageViewport.css';

export default function PageViewport({ children, className = '' }) {
  return (
    <div className={`page-viewport ${className}`}>
      {children}
    </div>
  );
}


/**
 * PageContainer - Centers content with max-width constraint
 * 
 * RESPONSIBILITIES:
 * - Center content horizontally
 * - Apply max-width constraint
 * - Apply responsive horizontal padding
 * 
 * RULES:
 * - NO layout logic (columns, grids)
 * - NO breakpoint detection in JS
 * - NO business logic
 * - Padding controlled by CSS variable --page-padding
 */

import './PageContainer.css';

export default function PageContainer({ children, className = '' }) {
  return (
    <div className={`page-container ${className}`}>
      {children}
    </div>
  );
}


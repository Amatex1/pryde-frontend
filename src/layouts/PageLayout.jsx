/**
 * PageLayout - The ONLY component allowed to handle responsive layout
 * 
 * RESPONSIBILITIES:
 * - CSS Grid-based column layout
 * - Responsive column collapsing (via CSS)
 * - Gap control between columns
 * - Sticky secondary panel (desktop only)
 * 
 * RULES:
 * - NO JavaScript viewport detection
 * - NO data fetching or business logic
 * - All responsive behavior handled by CSS
 * - Features must NOT set their own layout
 * 
 * VARIANTS:
 * - single: Full-width single column
 * - two-column: Primary + Secondary (sidebar)
 * - three-column: Tertiary + Primary + Secondary
 * 
 * RESPONSIVE BEHAVIOR (defined in CSS):
 * - Mobile (≤600px): Always single column
 * - Tablet (601-1024px): Two-column max
 * - Desktop (≥1025px): Full variant support
 */

import './PageLayout.css';

const GAP_MAP = {
  sm: 'var(--space-sm)',
  md: 'var(--space-md)',
  lg: 'var(--space-lg)',
};

export default function PageLayout({
  variant = 'single',
  primary,
  secondary,
  tertiary,
  stickySecondary = false,
  gap = 'md',
  className = '',
}) {
  const gapValue = GAP_MAP[gap] || GAP_MAP.md;
  
  return (
    <div 
      className={`page-layout page-layout--${variant} ${className}`}
      style={{ '--layout-gap': gapValue }}
      data-sticky-secondary={stickySecondary ? 'true' : undefined}
    >
      {/* Tertiary column (left sidebar) - only for three-column */}
      {variant === 'three-column' && tertiary && (
        <aside className="page-layout__tertiary">
          {tertiary}
        </aside>
      )}
      
      {/* Primary column (main content) - always present */}
      <main className="page-layout__primary">
        {primary}
      </main>
      
      {/* Secondary column (right sidebar) - for two-column and three-column */}
      {(variant === 'two-column' || variant === 'three-column') && secondary && (
        <aside className="page-layout__secondary">
          <div className={stickySecondary ? 'page-layout__sticky-wrapper' : ''}>
            {secondary}
          </div>
        </aside>
      )}
    </div>
  );
}


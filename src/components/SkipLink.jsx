/**
 * SkipLink - Accessibility component for keyboard navigation
 * Allows keyboard users to skip navigation and jump to main content
 * WCAG 2.1 Success Criterion 2.4.1 (Bypass Blocks)
 */

import { memo } from 'react';
import './SkipLink.css';

/**
 * SkipLink component that provides keyboard-accessible skip navigation
 * Positioned at top of page, visible on Tab focus
 */
const SkipLink = memo(function SkipLink() {
  const handleClick = (e) => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      // Prevent default to avoid hash in URL
      e.preventDefault();
      // Set focus on main content
      mainContent.focus();
      // Smooth scroll to main content
      mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="skip-link"
        onClick={handleClick}
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>
      
      {/* Skip to navigation link for power users */}
      <a
        href="#primary-navigation"
        className="skip-link skip-link--secondary"
        onClick={(e) => {
          e.preventDefault();
          const nav = document.getElementById('primary-navigation');
          if (nav) {
            nav.focus();
            nav.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }}
        aria-label="Skip to navigation"
      >
        Skip to navigation
      </a>
    </>
  );
});

export default SkipLink;

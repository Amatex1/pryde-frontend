/**
 * PRYDE MOTION SYSTEM v1 — Boot Utility
 *
 * The feed stagger animation is now handled entirely in CSS via
 * @keyframes pryde-post-enter + :nth-child() delays in motion.css.
 * This avoids the IntersectionObserver / content-visibility: auto
 * conflict that existed in the previous approach.
 *
 * This module is kept as the single boot point for any future
 * JS-driven motion enhancements (e.g., scroll-linked effects).
 *
 * Reaction animation: handled in ReactionButton.jsx via isReacting state.
 * Avatar rings: handled in CSS via .avatar-ring utility class.
 * Feed stagger: handled in CSS via .post-card.fade-in + :nth-child().
 */

export function initMotionSystem() {
  // CSS-driven — no JS motion logic required at boot.
  // prefers-reduced-motion is handled by @media in motion.css.
}

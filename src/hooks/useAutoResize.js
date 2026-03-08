import { useEffect } from 'react';

/**
 * Adjusts a textarea's height to fit its content on every value change.
 * Respects max-height set via CSS — once reached, scrolling takes over.
 *
 * @param {React.RefObject} ref - ref attached to the textarea element
 * @param {string} value       - the controlled value (triggers resize on change)
 */
export function useAutoResize(ref, value) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [ref, value]);
}

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import "./CommentSheet.css";

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function CommentSheet({ children, onClose }) {
  const sheetRef = useRef(null);

  // Focus trap: keeps keyboard focus inside the sheet while open
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    const focusable = Array.from(sheet.querySelectorAll(FOCUSABLE)).filter(
      (el) => !el.disabled && el.offsetParent !== null
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    // Focus the close button on open
    first?.focus();

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;
      // Re-query in case children changed (e.g. GIF picker opened)
      const live = Array.from(sheet.querySelectorAll(FOCUSABLE)).filter(
        (el) => !el.disabled && el.offsetParent !== null
      );
      const liveFirst = live[0];
      const liveLast = live[live.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === liveFirst) {
          e.preventDefault();
          liveLast?.focus();
        }
      } else {
        if (document.activeElement === liveLast) {
          e.preventDefault();
          liveFirst?.focus();
        }
      }
    };

    sheet.addEventListener('keydown', handleTab);
    return () => sheet.removeEventListener('keydown', handleTab);
  }, []);

  return (
    <div className="comment-sheet-backdrop" onClick={onClose} aria-hidden="true">
      <div
        ref={sheetRef}
        className="comment-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Comments"
        onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      >
        <div className="comment-sheet-header">
          <span className="sheet-title">Comments</span>
          <button
            className="sheet-close-btn"
            onClick={onClose}
            aria-label="Close comments"
            data-tooltip="Close"
          >
            <X size={22} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        <div className="comment-sheet-content">
          {children}
        </div>
      </div>
    </div>
  );
}

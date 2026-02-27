import { X } from 'lucide-react';
import "./CommentSheet.css";

export default function CommentSheet({ children, onClose }) {
  return (
    <div className="comment-sheet-backdrop" onClick={onClose}>
      <div
        className="comment-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="comment-sheet-header">
          <span className="sheet-title">Comments</span>
          <button className="sheet-close-btn" onClick={onClose} aria-label="Close comments" data-tooltip="Close"><X size={22} strokeWidth={2} aria-hidden="true" /></button>
        </div>

        <div className="comment-sheet-content">
          {children}
        </div>
      </div>
    </div>
  );
}


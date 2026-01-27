import "./CommentSheet.css";

export default function CommentSheet({ children, onClose }) {
  return (
    <div className="comment-sheet-backdrop" onClick={onClose}>
      <div
        className="comment-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="comment-sheet-header">
          <button className="sheet-close-btn" onClick={onClose}>⬇</button>
          <span className="sheet-title">Comments</span>
          <button className="sheet-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="comment-sheet-content">
          {children}
        </div>
      </div>
    </div>
  );
}


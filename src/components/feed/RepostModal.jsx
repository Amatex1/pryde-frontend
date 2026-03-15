import { useState } from 'react';
import { Repeat2, Quote, X } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUrl';
import './RepostModal.css';

/**
 * RepostModal — lets the user choose between a simple repost or a quote post.
 */
export default function RepostModal({ post, currentUser, hasReposted, onClose, onRepost }) {
  const [mode, setMode] = useState(null); // null | 'quote'
  const [quoteText, setQuoteText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const author = post.author || {};

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    await onRepost(mode === 'quote' ? 'quote' : 'repost', quoteText.trim());
    setSubmitting(false);
  }

  return (
    <div className="repost-modal-overlay" onClick={onClose}>
      <div className="repost-modal" onClick={e => e.stopPropagation()}>
        <button className="repost-modal-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        {mode === null && (
          <div className="repost-modal-options">
            <h3>Repost</h3>
            {hasReposted ? (
              <button className="repost-option-btn undo" onClick={() => onRepost('undo')}>
                <Repeat2 size={20} /> Undo Repost
              </button>
            ) : (
              <button className="repost-option-btn" onClick={() => onRepost('repost')}>
                <Repeat2 size={20} /> Repost
              </button>
            )}
            <button className="repost-option-btn" onClick={() => setMode('quote')}>
              <Quote size={20} /> Quote Post
            </button>
          </div>
        )}

        {mode === 'quote' && (
          <form className="repost-quote-form" onSubmit={handleSubmit}>
            <h3>Quote Post</h3>
            <textarea
              className="repost-quote-input"
              placeholder="Add your thoughts..."
              value={quoteText}
              onChange={e => setQuoteText(e.target.value.slice(0, 500))}
              maxLength={500}
              autoFocus
            />
            <span className="repost-quote-count">{quoteText.length}/500</span>

            {/* Embedded original post preview */}
            <div className="repost-quoted-preview">
              <div className="repost-quoted-author">
                {author.profilePhoto
                  ? <img src={getImageUrl(author.profilePhoto)} alt={author.displayName} className="repost-quoted-avatar" />
                  : <span className="repost-quoted-avatar-placeholder">{author.displayName?.charAt(0)}</span>
                }
                <strong>{author.displayName}</strong>
                <span className="repost-quoted-username">@{author.username}</span>
              </div>
              <p className="repost-quoted-content">{post.content?.slice(0, 200)}{post.content?.length > 200 ? '…' : ''}</p>
            </div>

            <div className="repost-quote-actions">
              <button type="button" className="btn-ghost" onClick={() => setMode(null)}>Back</button>
              <button type="submit" className="btn-primary" disabled={submitting || !quoteText.trim()}>
                {submitting ? 'Posting…' : 'Quote Post'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

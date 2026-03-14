/**
 * ReportModal.jsx — Phase 8
 *
 * Improved UX:
 *  - Richer reason labels + helper text under each option
 *  - Calm, premium "Raise a concern" framing
 *  - Inline success confirmation state (no alert())
 *  - Warning shown if content was already reported (409 / 400 duplicate)
 *  - Character counter for description (unchanged behaviour)
 *  - Keyboard: ESC closes (unchanged)
 */

import { useState } from 'react';
import api from '../utils/api';
import './ReportModal.css';

const REASONS = [
  {
    value: 'spam',
    label: 'Spam or misleading content',
    hint: 'Repetitive, irrelevant, or deceptive posts and messages.'
  },
  {
    value: 'harassment',
    label: 'Harassment or bullying',
    hint: 'Targeted abuse, threats, or intimidation toward a person.'
  },
  {
    value: 'hate_speech',
    label: 'Hate speech or symbols',
    hint: 'Content that attacks people based on identity or promotes hatred.'
  },
  {
    value: 'violence',
    label: 'Violence or dangerous content',
    hint: 'Glorification of violence, self-harm, or dangerous organisations.'
  },
  {
    value: 'nudity',
    label: 'Nudity or sexual content',
    hint: 'Explicit imagery or content that violates community standards.'
  },
  {
    value: 'misinformation',
    label: 'False or misleading information',
    hint: 'Demonstrably false claims that could cause harm.'
  },
  {
    value: 'impersonation',
    label: 'Impersonation',
    hint: 'Pretending to be another person, brand, or public figure.'
  },
  {
    value: 'self_harm',
    label: 'Self-harm or suicide',
    hint: 'Content that encourages or depicts self-harm or eating disorders.'
  },
  {
    value: 'other',
    label: 'Something else',
    hint: 'A concern not covered by the categories above.'
  }
];

const TYPE_LABELS = {
  post:    'post',
  comment: 'comment',
  message: 'message',
  user:    'account'
};

function ReportModal({ isOpen, onClose, reportType, contentId, userId }) {
  const [reason, setReason]           = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [error, setError]             = useState('');

  const typeLabel = TYPE_LABELS[reportType] || reportType;

  const handleClose = () => {
    // Reset on close so the modal is fresh if reopened
    setReason('');
    setDescription('');
    setSubmitted(false);
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      setError('Please select a reason before submitting.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await api.post('/reports', {
        reportType,
        reportedContent: contentId,
        reportedUser: userId,
        reason,
        description
      });
      setSubmitted(true);
    } catch (err) {
      const msg = err?.response?.data?.message || '';
      if (msg.toLowerCase().includes('already reported')) {
        setError('You have already raised a concern about this content. Our team is reviewing it.');
      } else if (err?.response?.status === 429) {
        setError('You have submitted too many reports recently. Please wait a moment and try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose} aria-hidden="true">
      <div
        className="modal-content report-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Raise a concern about this ${typeLabel}`}
        onKeyDown={e => { if (e.key === 'Escape') handleClose(); }}
        tabIndex={-1}
      >
        <div className="modal-header">
          <h2>Raise a concern</h2>
          <button className="modal-close" onClick={handleClose} aria-label="Close">✕</button>
        </div>

        {/* ── Success state ────────────────────────────────────────────── */}
        {submitted ? (
          <div className="report-success">
            <div className="report-success-icon">✓</div>
            <h3>Thank you for letting us know</h3>
            <p>
              Your concern about this {typeLabel} has been received anonymously
              and will be reviewed by our moderation team.
            </p>
            <button className="btn-submit" onClick={handleClose} style={{ marginTop: '1rem' }}>
              Done
            </button>
          </div>
        ) : (
          /* ── Form ─────────────────────────────────────────────────── */
          <form onSubmit={handleSubmit} className="report-form">
            <div className="form-group">
              <label htmlFor="report-reason">
                What's the concern with this {typeLabel}?
              </label>
              <select
                id="report-reason"
                value={reason}
                onChange={e => { setReason(e.target.value); setError(''); }}
                className="form-input"
                required
              >
                <option value="">Select a reason…</option>
                {REASONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              {reason && (
                <p className="report-reason-hint">
                  {REASONS.find(r => r.value === reason)?.hint}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="report-desc">Additional context <span className="report-optional">(optional)</span></label>
              <textarea
                id="report-desc"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="form-input"
                rows="3"
                maxLength="1000"
                placeholder="Share any details that might help our team review this faster…"
              />
              <small className={description.length > 900 ? 'report-char-warn' : ''}>
                {description.length}/1000
              </small>
            </div>

            {error && (
              <div className="report-error" role="alert">{error}</div>
            )}

            <div className="report-info">
              <p>Your concern is anonymous and will not be shared with the reported user.</p>
            </div>

            <div className="modal-actions">
              <button type="button" onClick={handleClose} className="btn-cancel">
                Cancel
              </button>
              <button type="submit" disabled={submitting || !reason} className="btn-submit">
                {submitting ? 'Submitting…' : 'Submit concern'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ReportModal;

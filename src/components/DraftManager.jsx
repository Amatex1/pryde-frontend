import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';
import './DraftManager.css';

/**
 * Performance budget for click handlers (ms)
 * Exceeding this will trigger a dev warning
 */
const CLICK_HANDLER_BUDGET_MS = 100;

/**
 * DEV-MODE WARNING: Log warning for operations on non-persisted entities
 * Deferred to not block click handler
 */
const warnNonPersistedEntity = (action, draftId) => {
  if (import.meta.env.DEV) {
    // Defer logging to not block UI
    setTimeout(() => {
      console.warn(`⚠️ Attempted ${action} on non-persisted entity.`);
      console.warn(`📍 Draft ID: ${draftId}`);
      console.warn('This action will fail on refresh.');
    }, 0);
  }
};

/**
 * DEV-MODE: Measure and warn if click handler exceeds performance budget
 */
const measureClickHandler = (startTime, handlerName) => {
  if (import.meta.env.DEV) {
    const duration = performance.now() - startTime;
    if (duration > CLICK_HANDLER_BUDGET_MS) {
      console.warn(`⚠️ Click handler exceeded performance budget (${Math.round(duration)}ms)`);
      console.warn(`📍 Handler: ${handlerName}`);
      console.warn(`📋 Budget: ${CLICK_HANDLER_BUDGET_MS}ms`);
    }
  }
};

const DraftManager = ({ draftType, onRestoreDraft, onClose }) => {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteError, setDeleteError] = useState(null);

  // Track pending deletes to prevent duplicate operations
  const pendingDeletes = useRef(new Set());
  // Track drafts state for async operations
  const draftsRef = useRef(drafts);
  draftsRef.current = drafts;

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      setDeleteError(null);
      const params = draftType ? { type: draftType } : {};
      const response = await api.get('/drafts', { params });
      // CRITICAL: Only show drafts that exist on the backend
      // This prevents ghost drafts from being displayed
      setDrafts(response.data.drafts || []);
    } catch (error) {
      console.error('Error fetching drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftType]);

  /**
   * Async mutation handler - performs backend delete OUTSIDE of click handler
   * This runs after the UI has already been updated optimistically
   */
  const performDeleteMutation = useCallback(async (draftId, draftExisted) => {
    try {
      await api.delete(`/drafts/${draftId}`);

      // Defer non-critical logging
      if (import.meta.env.DEV) {
        setTimeout(() => {
          console.log(`✅ Draft ${draftId} deleted successfully`);
        }, 0);
      }
    } catch (error) {
      // Handle 404 - draft doesn't exist on server (ghost entity)
      if (error.response?.status === 404) {
        // Defer dev warnings to background
        if (import.meta.env.DEV) {
          setTimeout(() => {
            console.warn(`⚠️ DELETE 404: Draft ${draftId} not found on server (ghost entity)`);
            console.warn('Draft was already removed from UI optimistically.');
          }, 0);
        }
        // Show user-facing error briefly
        setDeleteError('Draft was already deleted or never saved.');
        setTimeout(() => setDeleteError(null), 3000);
      } else {
        // Defer error logging
        setTimeout(() => {
          console.error('Error deleting draft:', error);
        }, 0);

        // On failure, we could restore the draft to UI, but since it's a delete
        // and we're syncing with server truth, we leave it removed
        // Only show error message
        setDeleteError('Failed to delete draft from server.');
        setTimeout(() => setDeleteError(null), 3000);
      }
    } finally {
      // Remove from pending deletes
      pendingDeletes.current.delete(draftId);
    }
  }, []);

  /**
   * OPTIMISTIC DELETE: Click handler that returns immediately
   * - Immediately removes draft from UI
   * - Schedules backend work outside click handler
   * - No awaits in the synchronous path
   */
  const deleteDraft = useCallback((draftId) => {
    const startTime = import.meta.env.DEV ? performance.now() : 0;

    // CRITICAL: Validate draft ID exists before attempting delete
    if (!draftId) {
      warnNonPersistedEntity('DELETE', draftId);
      if (import.meta.env.DEV) measureClickHandler(startTime, 'deleteDraft');
      return;
    }

    // Prevent duplicate delete operations
    if (pendingDeletes.current.has(draftId)) {
      if (import.meta.env.DEV) measureClickHandler(startTime, 'deleteDraft');
      return;
    }

    // Check if this draft exists in our local state (came from backend)
    const draftExists = draftsRef.current.some(d => d._id === draftId);
    if (!draftExists) {
      warnNonPersistedEntity('DELETE', draftId);
      // Defer the console.warn
      setTimeout(() => {
        console.warn('⚠️ Draft not found in fetched drafts - may be a ghost entity');
      }, 0);
    }

    // Mark as pending delete
    pendingDeletes.current.add(draftId);

    // ═══════════════════════════════════════════════════════════════════════
    // OPTIMISTIC UI UPDATE: Remove from UI immediately (single setState call)
    // ═══════════════════════════════════════════════════════════════════════
    setDrafts(currentDrafts => currentDrafts.filter(d => d._id !== draftId));
    setDeleteError(null);

    // ═══════════════════════════════════════════════════════════════════════
    // DEFERRED BACKEND WORK: Schedule mutation outside click handler
    // Using setTimeout(0) to move to next event loop tick
    // ═══════════════════════════════════════════════════════════════════════
    setTimeout(() => {
      performDeleteMutation(draftId, draftExists);
    }, 0);

    // Measure click handler performance (dev only)
    if (import.meta.env.DEV) measureClickHandler(startTime, 'deleteDraft');

    // Click handler returns immediately - UI feels instant
  }, [performDeleteMutation]);

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  const getDraftPreview = (draft) => {
    if (draft.content) return draft.content.substring(0, 100);
    if (draft.title) return draft.title;
    if (draft.body) return draft.body.substring(0, 100);
    return 'Untitled draft';
  };

  const getDraftTypeLabel = (type) => {
    const labels = {
      post: 'Post',
      journal: 'Journal',
      longform: 'Longform',
      photoEssay: 'Photo Essay'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="draft-manager">
        <div className="draft-manager-header">
          <h3>Drafts</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="draft-loading">Loading drafts...</div>
      </div>
    );
  }

  return (
    <div className="draft-manager">
      <div className="draft-manager-header">
        <h3>Drafts</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      {/* Show delete error if any */}
      {deleteError && (
        <div className="draft-error">
          ⚠️ {deleteError}
        </div>
      )}

      {drafts.length === 0 ? (
        <div className="no-drafts">
          <p>No drafts saved</p>
        </div>
      ) : (
        <div className="draft-list">
          {drafts.map(draft => (
            <div key={draft._id} className="draft-item">
              <div className="draft-type-badge">{getDraftTypeLabel(draft.draftType)}</div>
              <div className="draft-content">
                <p className="draft-preview">{getDraftPreview(draft)}</p>
                <span className="draft-time">{formatDate(draft.lastAutoSaved)}</span>
              </div>
              <div className="draft-actions">
                <button
                  className="restore-btn"
                  onClick={() => {
                    onRestoreDraft(draft);
                    onClose();
                  }}
                >
                  Restore
                </button>
                <button
                  className="delete-btn"
                  onClick={() => {
                    if (window.confirm('Delete this draft?')) {
                      deleteDraft(draft._id);
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DraftManager;


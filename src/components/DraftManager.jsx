import { useState, useEffect } from 'react';
import api from '../utils/api';
import './DraftManager.css';

/**
 * DEV-MODE WARNING: Log warning for operations on non-persisted entities
 */
const warnNonPersistedEntity = (action, draftId) => {
  if (import.meta.env.DEV) {
    console.warn(`⚠️ Attempted ${action} on non-persisted entity.`);
    console.warn(`📍 Draft ID: ${draftId}`);
    console.warn('This action will fail on refresh.');
  }
};

const DraftManager = ({ draftType, onRestoreDraft, onClose }) => {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteError, setDeleteError] = useState(null);

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

  const deleteDraft = async (draftId) => {
    // CRITICAL: Validate draft ID exists before attempting delete
    if (!draftId) {
      warnNonPersistedEntity('DELETE', draftId);
      return;
    }

    // Check if this draft exists in our local state (came from backend)
    const draftExists = drafts.some(d => d._id === draftId);
    if (!draftExists) {
      warnNonPersistedEntity('DELETE', draftId);
      console.warn('⚠️ Draft not found in fetched drafts - may be a ghost entity');
    }

    try {
      setDeleteError(null);
      await api.delete(`/drafts/${draftId}`);
      setDrafts(drafts.filter(d => d._id !== draftId));
    } catch (error) {
      // Handle 404 - draft doesn't exist on server (ghost entity)
      if (error.response?.status === 404) {
        if (import.meta.env.DEV) {
          console.warn(`⚠️ DELETE 404: Draft ${draftId} not found on server (ghost entity)`);
          console.warn('Removing from local state to sync with server truth.');
        }
        // Remove from local state anyway - sync with server truth
        setDrafts(drafts.filter(d => d._id !== draftId));
        setDeleteError('Draft was already deleted or never saved.');
        // Clear error after 3 seconds
        setTimeout(() => setDeleteError(null), 3000);
      } else {
        console.error('Error deleting draft:', error);
        setDeleteError('Failed to delete draft. Please try again.');
        setTimeout(() => setDeleteError(null), 3000);
      }
    }
  };

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


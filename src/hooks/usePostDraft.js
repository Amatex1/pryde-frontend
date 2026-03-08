import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';

/**
 * usePostDraft - Hook for managing post draft state
 * 
 * Handles:
 * - Draft text state
 * - Draft media
 * - Auto-save functionality
 * - Draft restoration
 * 
 * @param {Object} options
 * @param {string} options.draftKey - Unique key for localStorage (e.g., 'feed-draft', 'profile-draft')
 * @param {number} options.autoSaveDelay - Debounce delay in ms (default: 1000)
 * @returns {Object} Draft state and handlers
 */
export function usePostDraft({ draftKey = 'default-draft', autoSaveDelay = 1000 }) {
  const [draft, setDraft] = useState('');
  const [draftMedia, setDraftMedia] = useState([]);
  const [draftVisibility, setDraftVisibility] = useState('public');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const saveTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(`pryde-draft-${draftKey}`);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setDraft(parsed.content || '');
        setDraftMedia(parsed.media || []);
        setDraftVisibility(parsed.visibility || 'public');
      } catch (error) {
        console.error('Failed to parse draft:', error);
      }
    }

    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, [draftKey]);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveDraft();
    }, autoSaveDelay);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [draft, draftMedia, draftVisibility, hasUnsavedChanges, autoSaveDelay]);

  // Save draft to localStorage
  const saveDraft = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setIsSaving(true);
    try {
      const draftData = {
        content: draft,
        media: draftMedia,
        visibility: draftVisibility,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(`pryde-draft-${draftKey}`, JSON.stringify(draftData));
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [draft, draftMedia, draftVisibility, draftKey]);

  // Update draft content
  const updateDraft = useCallback((content) => {
    setDraft(content);
    setHasUnsavedChanges(true);
  }, []);

  // Add media to draft
  const addMedia = useCallback((media) => {
    setDraftMedia(prev => [...prev, media]);
    setHasUnsavedChanges(true);
  }, []);

  // Remove media from draft
  const removeMedia = useCallback((index) => {
    setDraftMedia(prev => prev.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  }, []);

  // Clear all draft
  const clearDraft = useCallback(() => {
    setDraft('');
    setDraftMedia([]);
    setDraftVisibility('public');
    setHasUnsavedChanges(false);
    localStorage.removeItem(`pryde-draft-${draftKey}`);
    setLastSaved(null);
  }, [draftKey]);

  // Publish draft as post
  const publishDraft = useCallback(async () => {
    if (!draft.trim() && draftMedia.length === 0) return null;

    setIsSaving(true);
    try {
      const response = await api.post('/posts', {
        content: draft,
        media: draftMedia,
        visibility: draftVisibility
      });
      
      // Clear draft after successful post
      clearDraft();
      
      return response.data;
    } catch (error) {
      console.error('Failed to publish draft:', error);
      throw error;
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [draft, draftMedia, draftVisibility, clearDraft]);

  // Restore from server draft (if applicable)
  const restoreServerDraft = useCallback(async () => {
    try {
      const response = await api.get('/drafts/current');
      if (response.data?.content) {
        setDraft(response.data.content);
        setDraftMedia(response.data.media || []);
        setDraftVisibility(response.data.visibility || 'public');
        setHasUnsavedChanges(true);
      }
    } catch (error) {
      // Silently fail - server draft is optional
      console.debug('No server draft found');
    }
  }, []);

  return {
    // State
    draft,
    draftMedia,
    draftVisibility,
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    
    // Setters
    setDraft,
    setDraftMedia,
    setDraftVisibility,
    
    // Handlers
    updateDraft,
    addMedia,
    removeMedia,
    saveDraft,
    clearDraft,
    publishDraft,
    restoreServerDraft,
  };
}

export default usePostDraft;


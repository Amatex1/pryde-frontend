import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import './ProfileUrlSetting.css';

const ProfileUrlSetting = ({ currentSlug, onUpdate }) => {
  const [slug, setSlug] = useState(currentSlug || '');
  const [status, setStatus] = useState(null); // null, 'checking', 'available', 'taken', 'invalid', 'saved', 'error'
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // Debounced availability check
  const checkAvailability = useCallback(async (value) => {
    if (!value || value.length < 3) {
      setStatus(null);
      setMessage('');
      return;
    }

    setStatus('checking');
    setMessage('Checking availability...');

    try {
      const response = await api.get(`/profile-slug/check/${value}`);
      if (response.data.available) {
        setStatus('available');
        setMessage('✓ This URL is available!');
      } else {
        setStatus('taken');
        setMessage(response.data.message || 'This URL is not available');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Error checking availability');
    }
  }, []);

  // Debounce input
  useEffect(() => {
    if (slug === currentSlug) {
      setStatus(null);
      setMessage('');
      return;
    }

    const timer = setTimeout(() => {
      if (slug.length >= 3) {
        checkAvailability(slug);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [slug, currentSlug, checkAvailability]);

  const handleInputChange = (e) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setSlug(value);
    
    if (value.length > 0 && value.length < 3) {
      setStatus('invalid');
      setMessage('URL must be at least 3 characters');
    } else if (value.length > 30) {
      setStatus('invalid');
      setMessage('URL must be 30 characters or less');
    }
  };

  const handleSave = async () => {
    if (!slug || slug.length < 3 || status === 'taken' || status === 'invalid') {
      return;
    }

    setSaving(true);
    try {
      const response = await api.post('/profile-slug/set', { slug });
      if (response.data.success) {
        setStatus('saved');
        setMessage('✓ Profile URL saved successfully!');
        if (onUpdate) onUpdate(response.data.slug);
      }
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Failed to save URL');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!currentSlug) return;
    
    setSaving(true);
    try {
      await api.delete('/profile-slug');
      setSlug('');
      setStatus(null);
      setMessage('Profile URL removed');
      if (onUpdate) onUpdate(null);
    } catch (error) {
      setStatus('error');
      setMessage('Failed to remove URL');
    } finally {
      setSaving(false);
    }
  };

  const canSave = slug.length >= 3 && 
                  slug.length <= 30 && 
                  status === 'available' && 
                  slug !== currentSlug;

  return (
    <div className="profile-url-setting">
      <h3 className="section-title">🔗 Custom Profile URL</h3>
      <p className="section-description">
        Choose a custom link to share your profile. This makes it easier for others to find you.
      </p>

      <div className="url-input-container">
        <span className="url-prefix">pryde.social/</span>
        <input
          type="text"
          value={slug}
          onChange={handleInputChange}
          placeholder="your-custom-url"
          className="url-input"
          maxLength={30}
          disabled={saving}
        />
      </div>

      {message && (
        <div className={`url-status ${status}`}>
          {status === 'checking' && <span className="spinner">⏳</span>}
          {message}
        </div>
      )}

      <div className="url-actions">
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="btn-primary"
        >
          {saving ? 'Saving...' : 'Save URL'}
        </button>
        
        {currentSlug && (
          <button
            onClick={handleRemove}
            disabled={saving}
            className="btn-secondary"
          >
            Remove URL
          </button>
        )}
      </div>

      <p className="url-hint">
        Only lowercase letters, numbers, and underscores. 3-30 characters.
      </p>
    </div>
  );
};

export default ProfileUrlSetting;


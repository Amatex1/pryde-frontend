/**
 * Collections Page - Personal collections of saved posts (Life-Signal Feature)
 * 
 * Features:
 * - List user's collections
 * - Create new collections
 * - Add/remove posts to collections
 * - View collection details with saved posts
 * 
 * Access: /collections
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import Navbar from '../components/Navbar';
import OptimizedImage from '../components/OptimizedImage';
import PostHeader from '../components/PostHeader';
import FormattedText from '../components/FormattedText';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import api from '../utils/api';
import { getCurrentUser } from '../utils/auth';
import { getImageUrl } from '../utils/imageUrl';
import './Collections.css';

/**
 * Helper to compare IDs safely
 */
const compareIds = (id1, id2) => {
  if (!id1 || !id2) return false;
  return String(id1) === String(id2);
};

function Collections() {
  const navigate = useNavigate();
  const { onMenuOpen } = useOutletContext() || {};
  const currentUser = getCurrentUser();
  
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Create form state
  const [newCollectionTitle, setNewCollectionTitle] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  
  const { toasts, showToast, removeToast } = useToast();

  // Fetch user's collections
  const fetchCollections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/collections');
      setCollections(response.data || []);
    } catch (err) {
      console.error('Failed to fetch collections:', err);
      setError('Failed to load collections');
      showToast('Failed to load collections', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Create new collection
  const handleCreateCollection = async (e) => {
    e.preventDefault();
    
    if (!newCollectionTitle.trim()) {
      showToast('Please provide a title', 'error');
      return;
    }

    try {
      setCreating(true);
      
      const response = await api.post('/collections', {
        title: newCollectionTitle.trim(),
        description: newCollectionDescription.trim()
      });
      
      // Add new collection to list
      setCollections(prev => [response.data, ...prev]);
      
      // Reset form
      setNewCollectionTitle('');
      setNewCollectionDescription('');
      setShowCreateModal(false);
      
      showToast('Collection created!', 'success');
    } catch (err) {
      console.error('Failed to create collection:', err);
      showToast(err.response?.data?.message || 'Failed to create collection', 'error');
    } finally {
      setCreating(false);
    }
  };

  // Delete collection
  const handleDeleteCollection = async (collectionId, collectionTitle) => {
    if (!window.confirm(`Delete "${collectionTitle}"? This won't delete the posts themselves.`)) return;
    
    try {
      await api.delete(`/collections/${collectionId}`);
      setCollections(prev => prev.filter(c => c._id !== collectionId));
      showToast('Collection deleted', 'info');
    } catch (err) {
      console.error('Failed to delete collection:', err);
      showToast(err.response?.data?.message || 'Failed to delete collection', 'error');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <Navbar onMenuClick={onMenuOpen} />
        <div className="collections-container">
          <div className="loading">Loading collections...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar onMenuOpen={onMenuOpen} />
      
      <div className="collections-container">
        {/* Header */}
        <div className="collections-header">
          <div className="collections-title-section">
            <h1>📚 Collections</h1>
            <p className="collections-subtitle">
              Save and organize posts that resonate with you. 
              Collections are private to you.
            </p>
          </div>
          
          <button 
            className="btn-create-collection glossy"
            onClick={() => setShowCreateModal(true)}
          >
            ✨ New Collection
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div className="collections-error">
            {error}
            <button onClick={fetchCollections}>Retry</button>
          </div>
        )}

        {/* Collections list */}
        {collections.length === 0 ? (
          <div className="collections-empty glossy">
            <div className="empty-icon">📚</div>
            <h2>No collections yet</h2>
            <p>
              Create collections to save posts that matter to you. 
              You can add posts to collections from any post's menu.
            </p>
            <button 
              className="btn-create-first glossy"
              onClick={() => setShowCreateModal(true)}
            >
              Create your first collection
            </button>
          </div>
        ) : (
          <div className="collections-grid">
            {collections.map(collection => (
              <div key={collection._id} className="collection-card glossy">
                <Link 
                  to={`/collections/${collection._id}`}
                  className="collection-card-link"
                >
                  <div className="collection-icon">📚</div>
                  <div className="collection-info">
                    <h3>{collection.title}</h3>
                    {collection.description && (
                      <p className="collection-description">
                        {collection.description}
                      </p>
                    )}
                    <span className="collection-count">
                      {collection.itemCount || 0} saved posts
                    </span>
                  </div>
                </Link>
                
                <div className="collection-actions">
                  <button 
                    className="btn-delete-collection"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteCollection(collection._id, collection.title);
                    }}
                    title="Delete collection"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info section */}
        <div className="collections-info glossy">
          <h3>About Collections</h3>
          <ul>
            <li><strong>Private:</strong> Only you can see your collections</li>
            <li><strong>Organized:</strong> Group posts by theme or topic</li>
            <li><strong>Easy to add:</strong> Use the "Save to Collection" option on any post</li>
            <li><strong>Permanent:</strong> Collections stay until you delete them</li>
          </ul>
        </div>
      </div>

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div 
            className="create-collection-modal glossy"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Create a Collection</h2>
              <button 
                className="btn-close"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateCollection}>
              <div className="form-group">
                <label htmlFor="collectionTitle">Title *</label>
                <input
                  type="text"
                  id="collectionTitle"
                  value={newCollectionTitle}
                  onChange={e => setNewCollectionTitle(e.target.value)}
                  placeholder="e.g., Inspiring Posts, Things to Try"
                  maxLength={100}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="collectionDescription">Description (optional)</label>
                <textarea
                  id="collectionDescription"
                  value={newCollectionDescription}
                  onChange={e => setNewCollectionDescription(e.target.value)}
                  placeholder="What's this collection for?"
                  maxLength={300}
                />
              </div>
              
              <div className="modal-buttons">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-create"
                  disabled={creating || !newCollectionTitle.trim()}
                >
                  {creating ? 'Creating...' : 'Create Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

export default Collections;


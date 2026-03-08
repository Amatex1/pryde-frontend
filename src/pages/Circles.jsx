/**
 * Circles Page - Small intimate communities (Life-Signal Feature 4)
 * 
 * Features:
 * - List user's circles
 * - Create new circles (max 20 members)
 * - View circle details and members
 * - Invite members
 * - Circle feed (isolated from global feed)
 * 
 * Access: /circles
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import Navbar from '../components/Navbar';
import OptimizedImage from '../components/OptimizedImage';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import api from '../utils/api';
import { getCurrentUser } from '../utils/auth';
import { getImageUrl } from '../utils/imageUrl';
import './Circles.css';

/**
 * Helper to compare IDs safely
 */
const compareIds = (id1, id2) => {
  if (!id1 || !id2) return false;
  return String(id1) === String(id2);
};

function Circles() {
  const navigate = useNavigate();
  const { onMenuOpen } = useOutletContext() || {};
  const currentUser = getCurrentUser();
  
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Create form state
  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleIntent, setNewCircleIntent] = useState('');
  const [newCircleRules, setNewCircleRules] = useState('');
  
  const { toasts, showToast, removeToast } = useToast();

  // Fetch user's circles
  const fetchCircles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/circles');
      setCircles(response.data || []);
    } catch (err) {
      console.error('Failed to fetch circles:', err);
      setError('Failed to load circles');
      showToast('Failed to load circles', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCircles();
  }, [fetchCircles]);

  // Create new circle
  const handleCreateCircle = async (e) => {
    e.preventDefault();
    
    if (!newCircleName.trim() || !newCircleIntent.trim()) {
      showToast('Please provide a name and intent', 'error');
      return;
    }

    try {
      setCreating(true);
      
      const response = await api.post('/circles', {
        name: newCircleName.trim(),
        intent: newCircleIntent.trim(),
        rules: newCircleRules.trim()
      });
      
      // Add new circle to list
      setCircles(prev => [response.data, ...prev]);
      
      // Reset form
      setNewCircleName('');
      setNewCircleIntent('');
      setNewCircleRules('');
      setShowCreateModal(false);
      
      showToast('Circle created!', 'success');
      
      // Navigate to the new circle
      if (response.data._id) {
        navigate(`/circles/${response.data._id}`);
      }
    } catch (err) {
      console.error('Failed to create circle:', err);
      showToast(err.response?.data?.message || 'Failed to create circle', 'error');
    } finally {
      setCreating(false);
    }
  };

  // Leave circle
  const handleLeaveCircle = async (circleId, circleName) => {
    if (!window.confirm(`Leave "${circleName}"?`)) return;
    
    try {
      await api.post(`/circles/${circleId}/leave`);
      setCircles(prev => prev.filter(c => c._id !== circleId));
      showToast(`Left ${circleName}`, 'info');
    } catch (err) {
      console.error('Failed to leave circle:', err);
      showToast(err.response?.data?.message || 'Failed to leave circle', 'error');
    }
  };

  // Get user's role badge
  const getRoleBadge = (role) => {
    switch (role) {
      case 'owner':
        return <span className="circle-role-badge owner">👑 Owner</span>;
      case 'member':
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <Navbar onMenuClick={onMenuOpen} />
        <div className="circles-container">
          <div className="loading">Loading circles...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar onMenuClick={onMenuOpen} />
      
      <div className="circles-container">
        {/* Header */}
        <div className="circles-header">
          <div className="circles-title-section">
            <h1>🌱 Circles</h1>
            <p className="circles-subtitle">
              Small, intimate communities built around shared intentions. 
              Max 20 members per circle.
            </p>
          </div>
          
          <button 
            className="btn-create-circle glossy"
            onClick={() => setShowCreateModal(true)}
          >
            ✨ Create Circle
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div className="circles-error">
            {error}
            <button onClick={fetchCircles}>Retry</button>
          </div>
        )}

        {/* Circles list */}
        {circles.length === 0 ? (
          <div className="circles-empty glossy">
            <div className="empty-icon">🌱</div>
            <h2>No circles yet</h2>
            <p>
              Circles are small, intimate communities where you can 
              connect more deeply with a select group of people.
            </p>
            <button 
              className="btn-create-first glossy"
              onClick={() => setShowCreateModal(true)}
            >
              Create your first circle
            </button>
          </div>
        ) : (
          <div className="circles-grid">
            {circles.map(circle => (
              <div key={circle._id} className="circle-card glossy">
                <div className="circle-card-header">
                  <div className="circle-icon">👥</div>
                  <div className="circle-info">
                    <h3>{circle.name}</h3>
                    {circle.intent && (
                      <p className="circle-intent">{circle.intent}</p>
                    )}
                  </div>
                </div>
                
                <div className="circle-stats">
                  <span className="circle-members">
                    👥 {circle.memberCount || 0} / 20 members
                  </span>
                </div>
                
                <div className="circle-actions">
                  {getRoleBadge(circle.role)}
                  <Link 
                    to={`/circles/${circle._id}`}
                    className="btn-view-circle"
                  >
                    View
                  </Link>
                  {circle.role !== 'owner' && (
                    <button 
                      className="btn-leave-circle"
                      onClick={() => handleLeaveCircle(circle._id, circle.name)}
                    >
                      Leave
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info section */}
        <div className="circles-info glossy">
          <h3>About Circles</h3>
          <ul>
            <li><strong>Intimate:</strong> Maximum 20 members per circle</li>
            <li><strong>Private:</strong> Circle posts don't appear in global feeds</li>
            <li><strong>Intent-focused:</strong> Each circle has a purpose or intention</li>
            <li><strong>Invite-only:</strong> Members invite people they trust</li>
          </ul>
        </div>
      </div>

      {/* Create Circle Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div 
            className="create-circle-modal glossy"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Create a Circle</h2>
              <button 
                className="btn-close"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateCircle}>
              <div className="form-group">
                <label htmlFor="circleName">Circle Name *</label>
                <input
                  type="text"
                  id="circleName"
                  value={newCircleName}
                  onChange={e => setNewCircleName(e.target.value)}
                  placeholder="e.g., Close Friends, Support Circle"
                  maxLength={50}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="circleIntent">Intent *</label>
                <textarea
                  id="circleIntent"
                  value={newCircleIntent}
                  onChange={e => setNewCircleIntent(e.target.value)}
                  placeholder="What's the purpose of this circle? e.g., Mutual support during tough times"
                  maxLength={200}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="circleRules">Community Guidelines (optional)</label>
                <textarea
                  id="circleRules"
                  value={newCircleRules}
                  onChange={e => setNewCircleRules(e.target.value)}
                  placeholder="Any rules or expectations for members..."
                  maxLength={500}
                />
              </div>
              
              <div className="form-note">
                Max 20 members per circle. Circle posts won't appear in global feeds.
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
                  disabled={creating || !newCircleName.trim() || !newCircleIntent.trim()}
                >
                  {creating ? 'Creating...' : 'Create Circle'}
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

export default Circles;


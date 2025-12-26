/**
 * Phase 2: Groups List Page
 *
 * Shows all available groups with join/view functionality.
 * Includes create group feature (requires admin approval).
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import './GroupsList.css';

function GroupsList() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create group modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/groups');
      setGroups(response.data.groups || []);
    } catch (err) {
      console.error('Failed to fetch groups:', err);
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleGroupClick = (slug, status) => {
    // Don't navigate to pending groups
    if (status === 'pending') return;
    navigate(`/groups/${slug}`);
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim() || creating) return;

    try {
      setCreating(true);
      setCreateError(null);

      const response = await api.post('/groups', {
        name: newGroupName.trim(),
        description: newGroupDescription.trim()
      });

      // Close modal and refresh
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDescription('');
      fetchGroups();

      // Show appropriate message based on status
      const isApproved = response.data.group?.status === 'approved';
      alert(isApproved
        ? 'Group created successfully!'
        : 'Group submitted for approval! You\'ll be notified when it\'s approved.');

    } catch (err) {
      console.error('Failed to create group:', err);
      setCreateError(err.response?.data?.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page-container">
      <Navbar />
      <div className="groups-list-container">
        <header className="groups-list-header glossy">
          <h1>👥 Groups</h1>
          <p className="groups-list-subtitle">
            Join private communities for focused discussion and connection.
          </p>
          <button
            className="btn-create-group"
            onClick={() => setShowCreateModal(true)}
          >
            + Create Group
          </button>
        </header>

        {loading ? (
          <div className="loading">Loading groups...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : groups.length === 0 ? (
          <div className="empty-state glossy">
            <p>No groups available yet.</p>
            <p className="empty-hint">Be the first to create one!</p>
          </div>
        ) : (
          <div className="groups-grid">
            {groups.map(group => (
              <div
                key={group._id}
                className={`group-card glossy ${group.status === 'pending' ? 'pending' : ''}`}
                onClick={() => handleGroupClick(group.slug, group.status)}
              >
                <div className="group-card-header">
                  <h3 className="group-card-name">{group.name}</h3>
                  {group.status === 'pending' && (
                    <span className="pending-badge">⏳ Pending</span>
                  )}
                  {group.status !== 'pending' && group.isMember && (
                    <span className="member-badge">✓ Member</span>
                  )}
                  {group.status !== 'pending' && group.isOwner && (
                    <span className="owner-badge">👑 Owner</span>
                  )}
                </div>
                {group.description && (
                  <p className="group-card-description">{group.description}</p>
                )}
                <div className="group-card-footer">
                  <span className="member-count">
                    {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                  </span>
                  <span className="visibility-badge">
                    {group.visibility === 'private' ? '🔒 Private' : '🌐 Public'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Group Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="create-group-modal glossy" onClick={e => e.stopPropagation()}>
              <h2>Create a New Group</h2>
              <p className="modal-subtitle">
                Groups require admin approval before becoming visible to others.
              </p>

              <form onSubmit={handleCreateGroup}>
                <div className="form-group">
                  <label htmlFor="groupName">Group Name *</label>
                  <input
                    id="groupName"
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g., Book Club, Art Corner"
                    maxLength={100}
                    disabled={creating}
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="groupDescription">Description</label>
                  <textarea
                    id="groupDescription"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    placeholder="What is this group about?"
                    maxLength={500}
                    rows={3}
                    disabled={creating}
                  />
                </div>

                {createError && (
                  <div className="create-error">{createError}</div>
                )}

                <div className="modal-buttons">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowCreateModal(false)}
                    disabled={creating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={creating || !newGroupName.trim()}
                  >
                    {creating ? 'Submitting...' : 'Submit for Approval'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GroupsList;


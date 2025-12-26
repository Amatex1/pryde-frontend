/**
 * Phase 2: Groups List Page
 *
 * Shows all available groups with join/view functionality.
 * Includes create/edit/delete group features.
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

  // Edit group modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState(null);

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

  const handleGroupClick = (slug, status, isOwner, e) => {
    // If clicking on action buttons, don't navigate
    if (e.target.closest('.group-actions')) return;
    // Don't navigate to pending groups
    if (status === 'pending') return;
    navigate(`/groups/${slug}`);
  };

  const openEditModal = (group, e) => {
    e.stopPropagation();
    setEditingGroup(group);
    setEditName(group.name);
    setEditDescription(group.description || '');
    setEditError(null);
    setShowEditModal(true);
  };

  const handleEditGroup = async (e) => {
    e.preventDefault();
    if (!editName.trim() || editing || !editingGroup) return;

    try {
      setEditing(true);
      setEditError(null);

      await api.patch(`/groups/${editingGroup.slug}`, {
        name: editName.trim(),
        description: editDescription.trim()
      });

      setShowEditModal(false);
      setEditingGroup(null);
      fetchGroups();

    } catch (err) {
      console.error('Failed to edit group:', err);
      setEditError(err.response?.data?.message || 'Failed to update group');
    } finally {
      setEditing(false);
    }
  };

  const handleDeleteGroup = async (group, e) => {
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete "${group.name}"? This will also delete all posts in the group. This cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/groups/${group.slug}`);
      fetchGroups();
    } catch (err) {
      console.error('Failed to delete group:', err);
      alert(err.response?.data?.message || 'Failed to delete group');
    }
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
                onClick={(e) => handleGroupClick(group.slug, group.status, group.isOwner, e)}
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
                {/* Owner actions */}
                {group.isOwner && (
                  <div className="group-actions">
                    <button
                      className="btn-edit-group"
                      onClick={(e) => openEditModal(group, e)}
                      title="Edit group"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-delete-group"
                      onClick={(e) => handleDeleteGroup(group, e)}
                      title="Delete group"
                    >
                      🗑️
                    </button>
                  </div>
                )}
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

        {/* Edit Group Modal */}
        {showEditModal && editingGroup && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="create-group-modal glossy" onClick={e => e.stopPropagation()}>
              <h2>Edit Group</h2>

              <form onSubmit={handleEditGroup}>
                <div className="form-group">
                  <label htmlFor="editGroupName">Group Name *</label>
                  <input
                    id="editGroupName"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g., Book Club, Art Corner"
                    maxLength={100}
                    disabled={editing}
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="editGroupDescription">Description</label>
                  <textarea
                    id="editGroupDescription"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="What is this group about?"
                    maxLength={500}
                    rows={3}
                    disabled={editing}
                  />
                </div>

                {editError && (
                  <div className="create-error">{editError}</div>
                )}

                <div className="modal-buttons">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowEditModal(false)}
                    disabled={editing}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={editing || !editName.trim()}
                  >
                    {editing ? 'Saving...' : 'Save Changes'}
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


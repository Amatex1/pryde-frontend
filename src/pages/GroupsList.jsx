/**
 * Phase 5A: Manual, Calm Group Discovery
 *
 * Shows all listed groups with join/view functionality.
 * - Intentional, quiet discovery experience
 * - No algorithms, no virality, no engagement pressure
 * - Sorting: Alphabetical (default), Recently Created, Recently Active
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

  // Phase 5A: Sorting - NO trending/popular/recommended
  const [sortBy, setSortBy] = useState('alphabetical');

  // Joining state for optimistic UI
  const [joiningGroup, setJoiningGroup] = useState(null);

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
  const [editVisibility, setEditVisibility] = useState('listed');
  const [editJoinMode, setEditJoinMode] = useState('approval');
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState(null);

  // Phase 5B: AbortController to prevent double-fetch in StrictMode
  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const fetchGroupsData = async () => {
      try {
        setLoading(true);
        setError(null);
        // Phase 5A: Pass sort parameter
        const response = await api.get(`/groups?sort=${sortBy}`, {
          signal: abortController.signal
        });
        if (isMounted) {
          setGroups(response.data.groups || []);
        }
      } catch (err) {
        // Ignore aborted requests
        if (err.name === 'AbortError' || err.name === 'CanceledError') return;

        if (isMounted) {
          console.error('Failed to fetch groups:', err);
          setError('Failed to load groups');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchGroupsData();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [sortBy]);

  // Manual refetch for after mutations
  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/groups?sort=${sortBy}`);
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
    if (e.target.closest('.group-actions') || e.target.closest('.join-btn')) return;
    // Don't navigate to pending groups
    if (status === 'pending') return;
    navigate(`/groups/${slug}`);
  };

  // Phase 5A: Join flow with optimistic UI
  const handleJoinGroup = async (group, e) => {
    e.stopPropagation();
    if (joiningGroup === group.slug) return; // Prevent double-click

    setJoiningGroup(group.slug);
    try {
      const response = await api.post(`/groups/${group.slug}/join`);

      // Optimistic UI update
      setGroups(prev => prev.map(g => {
        if (g.slug === group.slug) {
          return {
            ...g,
            isMember: response.data.isMember,
            hasPendingRequest: response.data.hasPendingRequest,
            memberCount: response.data.memberCount || g.memberCount + (response.data.isMember ? 1 : 0)
          };
        }
        return g;
      }));
    } catch (err) {
      console.error('Failed to join group:', err);
      // Don't show alert - just reset state
    } finally {
      setJoiningGroup(null);
    }
  };

  const openEditModal = (group, e) => {
    e.stopPropagation();
    setEditingGroup(group);
    setEditName(group.name);
    setEditDescription(group.description || '');
    // Phase 5A: Include visibility and joinMode
    setEditVisibility(group.visibility || 'listed');
    setEditJoinMode(group.joinMode || 'approval');
    setEditError(null);
    setShowEditModal(true);
  };

  const handleEditGroup = async (e) => {
    e.preventDefault();
    if (!editName.trim() || editing || !editingGroup) return;

    try {
      setEditing(true);
      setEditError(null);

      // Phase 5A: Include visibility and joinMode
      await api.patch(`/groups/${editingGroup.slug}`, {
        name: editName.trim(),
        description: editDescription.trim(),
        visibility: editVisibility,
        joinMode: editJoinMode
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

  // Phase 5A: Render join button based on state
  const renderJoinButton = (group) => {
    if (group.status === 'pending') return null;
    if (group.isMember) return null;

    const isJoining = joiningGroup === group.slug;

    if (group.hasPendingRequest) {
      return (
        <button className="join-btn request-sent" disabled>
          Request Sent
        </button>
      );
    }

    const joinMode = group.joinMode || 'approval';
    const buttonText = isJoining
      ? 'Joining…'
      : joinMode === 'approval'
        ? 'Request to Join'
        : 'Join Group';

    return (
      <button
        className={`join-btn ${isJoining ? 'joining' : ''}`}
        onClick={(e) => handleJoinGroup(group, e)}
        disabled={isJoining}
      >
        {buttonText}
      </button>
    );
  };

  return (
    <div className="page-container">
      <Navbar />
      <div className="groups-list-container">
        <header className="groups-list-header glossy">
          <h1>👥 Groups</h1>
          <p className="groups-list-subtitle">
            Find communities for focused discussion and connection.
          </p>
          <div className="header-actions">
            <button
              className="btn-create-group"
              onClick={() => setShowCreateModal(true)}
            >
              + Create Group
            </button>
          </div>
        </header>

        {/* Phase 5A: Sorting controls - NO trending/popular/recommended */}
        <div className="sort-controls">
          <label>Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="alphabetical">Alphabetical (A–Z)</option>
            <option value="recent">Recently Created</option>
            <option value="active">Recently Active</option>
          </select>
        </div>

        {loading ? (
          <div className="loading">Loading groups...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : groups.length === 0 ? (
          <div className="empty-state glossy">
            <p>No groups here — this is a fresh start.</p>
            <p className="empty-hint">Create the first group and invite others to join.</p>
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
                  <div className="group-badges">
                    {group.status === 'pending' && (
                      <span className="pending-badge">⏳ Pending</span>
                    )}
                    {group.status !== 'pending' && group.isOwner && (
                      <span className="owner-badge">👑 Owner</span>
                    )}
                    {group.status !== 'pending' && !group.isOwner && group.isMember && (
                      <span className="member-badge">✓ Member</span>
                    )}
                  </div>
                </div>
                {group.description && (
                  <p className="group-card-description">{group.description}</p>
                )}
                <div className="group-card-footer">
                  <span className="member-count">
                    {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                  </span>
                  {/* Phase 5A: Privacy badge based on joinMode */}
                  <span className="privacy-badge">
                    {group.joinMode === 'auto' ? '🌐 Open' : '🔒 Invite-only'}
                  </span>
                </div>

                {/* Phase 5A: Join button for non-members */}
                {renderJoinButton(group)}

                {/* Owner actions */}
                {group.isOwner && (
                  <div className="group-actions">
                    <button
                      className="btn-edit-group"
                      onClick={(e) => openEditModal(group, e)}
                      title="Edit group settings"
                    >
                      ⚙️
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

        {/* Phase 5A: Edit Group Settings Modal */}
        {showEditModal && editingGroup && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="create-group-modal glossy" onClick={e => e.stopPropagation()}>
              <h2>Group Settings</h2>

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

                {/* Phase 5A: Visibility setting */}
                <div className="form-group">
                  <label htmlFor="editVisibility">Discovery</label>
                  <select
                    id="editVisibility"
                    value={editVisibility}
                    onChange={(e) => setEditVisibility(e.target.value)}
                    disabled={editing}
                    className="form-select"
                  >
                    <option value="listed">Listed — Appears in /groups</option>
                    <option value="unlisted">Unlisted — Direct link only</option>
                  </select>
                </div>

                {/* Phase 5A: Join mode setting */}
                <div className="form-group">
                  <label htmlFor="editJoinMode">Join Mode</label>
                  <select
                    id="editJoinMode"
                    value={editJoinMode}
                    onChange={(e) => setEditJoinMode(e.target.value)}
                    disabled={editing}
                    className="form-select"
                  >
                    <option value="approval">Approval Required — You approve each request</option>
                    <option value="auto">Open — Anyone can join immediately</option>
                  </select>
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


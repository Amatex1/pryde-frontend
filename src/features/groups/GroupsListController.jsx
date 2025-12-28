/**
 * GroupsListController - Orchestrates the groups listing page
 * 
 * RESPONSIBILITIES:
 * - Fetch groups list (my groups, discover)
 * - Handle search/filter
 * - Create group modal
 * 
 * RULES:
 * - NO layout logic (widths, grids, media queries)
 * - Passes data and handlers to child components
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GroupsGrid from './GroupsGrid';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import api from '../../utils/api';
import { getCurrentUser } from '../../utils/auth';
import './GroupsListController.css';

export default function GroupsListController() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const { toasts, showToast, removeToast } = useToast();

  // State
  const [myGroups, setMyGroups] = useState([]);
  const [discoverGroups, setDiscoverGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('my-groups');
  const [searchQuery, setSearchQuery] = useState('');

  // Create group modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    visibility: 'public',
    requireApproval: false
  });

  // Fetch groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        setError(null);

        const [myResponse, discoverResponse] = await Promise.all([
          api.get('/groups/my-groups'),
          api.get('/groups/discover')
        ]);

        setMyGroups(myResponse.data.groups || []);
        setDiscoverGroups(discoverResponse.data.groups || []);
      } catch (err) {
        console.error('Failed to fetch groups:', err);
        setError('Failed to load groups');
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  // Filter groups by search
  const filteredGroups = (activeTab === 'my-groups' ? myGroups : discoverGroups)
    .filter(group => 
      !searchQuery || 
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Create group handler
  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) {
      showToast('Group name is required', 'error');
      return;
    }

    try {
      setCreating(true);
      const response = await api.post('/groups', newGroup);
      const createdGroup = response.data.group;
      
      setMyGroups(prev => [createdGroup, ...prev]);
      setShowCreateModal(false);
      setNewGroup({ name: '', description: '', visibility: 'public', requireApproval: false });
      showToast('Group created!', 'success');
      
      // Navigate to the new group
      navigate(`/groups/${createdGroup.slug}`);
    } catch (err) {
      console.error('Failed to create group:', err);
      showToast(err.response?.data?.message || 'Failed to create group', 'error');
    } finally {
      setCreating(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="groups-list-loading">
        <div className="loading-spinner" />
        <p>Loading groups...</p>
      </div>
    );
  }

  return (
    <div className="groups-list-controller">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="groups-list-header">
        <h1>Groups</h1>
        <button className="btn-create-group" onClick={() => setShowCreateModal(true)}>
          + Create Group
        </button>
      </div>

      {/* Tabs */}
      <div className="groups-tabs">
        <button 
          className={`tab ${activeTab === 'my-groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-groups')}
        >
          My Groups ({myGroups.length})
        </button>
        <button 
          className={`tab ${activeTab === 'discover' ? 'active' : ''}`}
          onClick={() => setActiveTab('discover')}
        >
          Discover
        </button>
      </div>

      {/* Search */}
      <div className="groups-search">
        <input
          type="text"
          placeholder="Search groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Groups grid */}
      <GroupsGrid
        groups={filteredGroups}
        emptyMessage={
          activeTab === 'my-groups' 
            ? "You haven't joined any groups yet" 
            : "No groups to discover"
        }
        onGroupClick={(group) => navigate(`/groups/${group.slug}`)}
      />

      {/* Create group modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Create Group</h2>
            {/* Modal form content - simplified for now */}
            <input
              type="text"
              placeholder="Group name"
              value={newGroup.name}
              onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
            />
            <textarea
              placeholder="Description"
              value={newGroup.description}
              onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
            />
            <div className="modal-actions">
              <button onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button onClick={handleCreateGroup} disabled={creating}>
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


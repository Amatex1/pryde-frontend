/**
 * Phase 2: Groups List Page
 * 
 * Shows all available groups with join/view functionality.
 * Replaces the old /discover (Tags) page functionality.
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import './GroupsList.css';

function GroupsList() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const handleGroupClick = (slug) => {
    navigate(`/groups/${slug}`);
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
        </header>

        {loading ? (
          <div className="loading">Loading groups...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : groups.length === 0 ? (
          <div className="empty-state glossy">
            <p>No groups available yet.</p>
            <p className="empty-hint">Check back soon!</p>
          </div>
        ) : (
          <div className="groups-grid">
            {groups.map(group => (
              <div
                key={group._id}
                className="group-card glossy"
                onClick={() => handleGroupClick(group.slug)}
              >
                <div className="group-card-header">
                  <h3 className="group-card-name">{group.name}</h3>
                  {group.isMember && (
                    <span className="member-badge">✓ Member</span>
                  )}
                  {group.isOwner && (
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
      </div>
    </div>
  );
}

export default GroupsList;


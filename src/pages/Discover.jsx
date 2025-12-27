/**
 * Phase 2C: Discover Page - Group Discovery
 *
 * Discover private groups and find your community.
 * All tag references removed - groups are the primary community structure.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import './Discover.css';

function Discover() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/groups');
      setGroups(response.data.groups || response.data || []);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupClick = (slug) => {
    navigate(`/groups/${slug}`);
  };

  return (
    <>
      <Navbar />
      <div className="discover-container">
        <div className="discover-header">
          <h1>👥 Explore Groups</h1>
          <p className="discover-subtitle">Find your space and connect with like-minded people</p>
        </div>

        {loading ? (
          <div className="loading">Loading groups...</div>
        ) : groups.length === 0 ? (
          <div className="no-groups" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
            <p>No groups here — this is a fresh start.</p>
          </div>
        ) : (
          <div className="discover-groups-grid">
            {groups.map(group => (
              <div
                key={group._id}
                className="discover-group-card glossy"
                onClick={() => handleGroupClick(group.slug)}
              >
                <div className="group-icon">👥</div>
                <h3 className="group-label">{group.name}</h3>
                <p className="group-description">{group.description}</p>
                <div className="group-stats">
                  <span className="group-member-count">{group.memberCount || 0} members</span>
                  {group.isPrivate && <span className="visibility-badge">🔒 Private</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default Discover;


/**
 * Phase 2C: Discover Page - Group Discovery
 *
 * Discover private groups and find your community.
 * All tag references removed - groups are the primary community structure.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import api from '../utils/api';
import AsyncStateWrapper from '../components/AsyncStateWrapper';
import EmptyState from '../components/EmptyState';
import Navbar from '../components/Navbar';
import './Discover.css';

function Discover() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  // Get menu handler from AppLayout outlet context
  const { onMenuOpen } = useOutletContext() || {};

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/groups');
      setGroups(response.data.groups || response.data || []);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupClick = (slug) => {
    navigate(`/groups/${slug}`);
  };

  return (
    <>
      <Navbar onMenuClick={onMenuOpen} />
      <div className="discover-container">
        <div className="discover-header">
          <h1>👥 Explore Groups</h1>
          <p className="discover-subtitle">Find your space and connect with like-minded people</p>
        </div>

        <AsyncStateWrapper
          isLoading={loading}
          isError={Boolean(error)}
          isEmpty={!loading && !error && groups.length === 0}
          error={error}
          onRetry={fetchGroups}
          loadingMessage="Loading groups..."
          emptyComponent={(
            <EmptyState
              type="groups"
              title="No groups available yet"
              description="This space is ready for the first community to join."
            />
          )}
        >
          <div className="discover-groups-grid">
            {groups.map(group => (
              <button
                key={group._id}
                className="discover-group-card glossy"
                type="button"
                onClick={() => handleGroupClick(group.slug)}
                aria-label={`Open group ${group.name}`}
              >
                <div className="group-icon">👥</div>
                <h3 className="group-label">{group.name}</h3>
                <p className="group-description">{group.description}</p>
                <div className="group-stats">
                  <span className="group-member-count">{group.memberCount || 0} members</span>
                  {group.isPrivate && <span className="visibility-badge">🔒 Private</span>}
                </div>
              </button>
            ))}
          </div>
        </AsyncStateWrapper>
      </div>
    </>
  );
}

export default Discover;


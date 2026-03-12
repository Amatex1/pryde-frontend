/**
 * Discover Page - Group Discovery (ENHANCED)
 * Features: Search, Category filters, Improved group cards
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import api from '../utils/api';
import AsyncStateWrapper from '../components/AsyncStateWrapper';
import EmptyState from '../components/EmptyState';
import Navbar from '../components/Navbar';
import { getImageUrl } from '../utils/imageUrl';
import './Discover.css';

const CATEGORIES = [
  { id: 'all', label: 'All', emoji: '✨' },
  { id: 'social', label: 'Social', emoji: '💬' },
  { id: 'art', label: 'Art & Creative', emoji: '🎨' },
  { id: 'tech', label: 'Tech', emoji: '💻' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'gaming', label: 'Gaming', emoji: '🎮' },
  { id: 'wellness', label: 'Wellness', emoji: '🧘' },
  { id: 'support', label: 'Support', emoji: '💜' },
];

function Discover() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const navigate = useNavigate();
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
    } catch (err) {
      console.error('Failed to fetch groups:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = useMemo(() => {
    let result = groups;
    if (activeCategory !== 'all') {
      result = result.filter(group => 
        group.category === activeCategory || 
        group.name.toLowerCase().includes(activeCategory) ||
        group.description?.toLowerCase().includes(activeCategory)
      );
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(group =>
        group.name.toLowerCase().includes(query) ||
        group.description?.toLowerCase().includes(query)
      );
    }
    return result;
  }, [groups, searchQuery, activeCategory]);

  return (
    <>
      <Navbar onMenuClick={onMenuOpen} />
      <div className="discover-container">
        <div className="discover-header">
          <h1>Explore Groups</h1>
          <p className="discover-subtitle">Find your space and connect with like-minded people</p>
        </div>

        <div className="discover-search">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search groups..."
              className="discover-search-input"
            />
            {searchQuery && (
              <button 
                className="clear-search" 
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="category-filters">
          {CATEGORIES.map(category => (
            <button
              key={category.id}
              className={`category-chip ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              <span className="category-emoji">{category.emoji}</span>
              <span className="category-label">{category.label}</span>
            </button>
          ))}
        </div>

        <AsyncStateWrapper
          isLoading={loading}
          isError={Boolean(error)}
          isEmpty={!loading && !error && filteredGroups.length === 0}
          error={error}
          onRetry={fetchGroups}
          loadingMessage="Loading groups..."
          emptyComponent={
            searchQuery || activeCategory !== 'all' ? (
              <EmptyState
                type="search"
                title="No groups found"
                description={searchQuery ? `No groups matching "${searchQuery}"` : "No groups in this category yet."}
              />
            ) : (
              <EmptyState
                type="groups"
                title="No groups available yet"
                description="This space is ready for the first community to join."
              />
            )
          }
        >
          <div className="discover-groups-grid">
            {filteredGroups.map(group => (
              <button
                key={group._id}
                className="discover-group-card glossy"
                type="button"
                onClick={() => navigate(`/groups/${group.slug}`)}
                aria-label={`Open group ${group.name}`}
              >
                <div className="group-cover">
                  {group.coverImage ? (
                    <img src={getImageUrl(group.coverImage)} alt="" />
                  ) : (
                    <div className="group-cover-placeholder">
                      <span>{group.name?.charAt(0).toUpperCase() || '👥'}</span>
                    </div>
                  )}
                </div>
                <div className="group-icon">
                  {group.avatar ? (
                    <img src={getImageUrl(group.avatar)} alt="" />
                  ) : (
                    <span>{group.name?.charAt(0).toUpperCase() || '👥'}</span>
                  )}
                </div>
                <h3 className="group-label">{group.name}</h3>
                <p className="group-description">{group.description}</p>
                <div className="group-stats">
                  <div className="member-avatar-stack" aria-label={`${group.memberCount || 0} members`}>
                    {[...Array(Math.min(3, group.memberCount || 0))].map((_, i) => (
                      <div key={i} className="member-avatar-thumb" aria-hidden="true" />
                    ))}
                    <span className="member-count-label">
                      {group.memberCount || 0} {group.memberCount === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                  {group.isPrivate && <span className="visibility-badge">🔒 Private</span>}
                </div>
              </button>
            ))}
          </div>
          {!loading && filteredGroups.length > 0 && (
            <p className="results-count">
              Showing {filteredGroups.length} {filteredGroups.length === 1 ? 'group' : 'groups'}
              {searchQuery && ` for "${searchQuery}"`}
            </p>
          )}
        </AsyncStateWrapper>
      </div>
    </>
  );
}

export default Discover;
/**
 * Phase 4C: Mobile Search Page
 * Full-page search experience for mobile users
 * Provides the same search functionality as GlobalSearch on desktop
 *
 * PHASE 4C: Hashtag search removed - groups are the only topic-based container
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search as SearchIcon, X } from 'lucide-react';
import api from '../utils/api';
import { getImageUrl } from '../utils/imageUrl';
import './Search.css';

function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  // PHASE 4C: Removed hashtags from search results
  const [searchResults, setSearchResults] = useState({ users: [], posts: [], groups: [] });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performSearch();
      } else {
        setSearchResults({ users: [], posts: [], groups: [] });
        setHasSearched(false);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const performSearch = async () => {
    setLoading(true);
    try {
      // Search users and posts from main search endpoint
      const response = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`);

      // Also search groups by name/description
      let groups = [];
      try {
        const groupsResponse = await api.get('/groups');
        const allGroups = groupsResponse.data.groups || groupsResponse.data || [];
        const query = searchQuery.toLowerCase();
        groups = allGroups.filter(g =>
          g.name?.toLowerCase().includes(query) ||
          g.description?.toLowerCase().includes(query)
        ).slice(0, 5);
      } catch (err) {
        console.error('Group search error:', err);
      }

      setSearchResults({ ...response.data, groups });
      setHasSearched(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (username) => {
    navigate(`/profile/${username}`);
  };

  const handleGroupClick = (slug) => {
    navigate(`/groups/${slug}`);
  };

  const handlePostClick = (postId) => {
    navigate(`/feed?post=${postId}`);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults({ users: [], posts: [], groups: [] });
    setHasSearched(false);
  };

  const hasResults = searchResults.users.length > 0 ||
                     searchResults.posts.length > 0 ||
                     searchResults.groups?.length > 0;

  return (
    <div className="search-page">
      <div className="search-header">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={24} />
        </button>
        <div className="search-input-container">
          <SearchIcon size={20} className="search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users, posts, groups..."
            className="search-input"
            autoFocus
            autoComplete="off"
          />
          {searchQuery && (
            <button className="clear-btn" onClick={clearSearch} aria-label="Clear search">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="search-results">
        {loading && (
          <div className="search-loading">
            <span>Searching...</span>
          </div>
        )}

        {!loading && hasSearched && !hasResults && (
          <div className="no-results">
            <p>No results found for "{searchQuery}"</p>
            <p className="no-results-hint">Try searching for users, posts, or groups</p>
          </div>
        )}

        {!hasSearched && !loading && (
          <div className="search-hints">
            <p>🔍 Search for users by name or username</p>
            <p>📝 Search posts by content</p>
            <p>👥 Search groups by name</p>
          </div>
        )}

        {/* PHASE 4C: Groups replace hashtags */}
        {searchResults.groups?.length > 0 && (
          <div className="results-section">
            <h3 className="section-title">Groups</h3>
            {searchResults.groups.map((group) => (
              <div
                key={group._id}
                className="result-item group-item"
                onClick={() => handleGroupClick(group.slug)}
              >
                <span className="group-icon">👥</span>
                <div className="group-info">
                  <span className="group-name">{group.name}</span>
                  <span className="group-description">{group.description?.substring(0, 50)}{group.description?.length > 50 ? '...' : ''}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {searchResults.users.length > 0 && (
          <div className="results-section">
            <h3 className="section-title">Users</h3>
            {searchResults.users.map((user) => (
              <div
                key={user._id}
                className="result-item user-item"
                onClick={() => handleUserClick(user.username)}
              >
                <div className="user-avatar">
                  {user.profilePhoto ? (
                    <img src={getImageUrl(user.profilePhoto)} alt={user.displayName} />
                  ) : (
                    <span>{user.displayName?.charAt(0).toUpperCase() || 'U'}</span>
                  )}
                </div>
                <div className="user-info">
                  <span className="user-name">{user.displayName || user.username}</span>
                  <span className="user-username">@{user.username}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {searchResults.posts.length > 0 && (
          <div className="results-section">
            <h3 className="section-title">Posts</h3>
            {searchResults.posts.slice(0, 10).map((post) => (
              <div
                key={post._id}
                className="result-item post-item"
                onClick={() => handlePostClick(post._id)}
              >
                <div className="post-preview">
                  <span className="post-author">
                    {post.author?.displayName || post.author?.username}
                  </span>
                  <p className="post-content">
                    {post.content?.substring(0, 100)}
                    {post.content?.length > 100 && '...'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Search;


/**
 * Phase 4C: Mobile Search Page
 * Full-page search experience for mobile users
 * Provides the same search functionality as GlobalSearch on desktop
 *
 * PHASE 4C: Hashtag search removed - groups are the only topic-based container
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// PERFORMANCE: Tree-shake lucide-react - import only used icons
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import SearchIcon from 'lucide-react/dist/esm/icons/search';
import X from 'lucide-react/dist/esm/icons/x';
import Users from 'lucide-react/dist/esm/icons/users';
import AsyncStateWrapper from '../components/AsyncStateWrapper';
import EmptyState from '../components/EmptyState';
import api from '../utils/api';
import { getImageUrl } from '../utils/imageUrl';
import './Search.css';

function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ users: [], posts: [], groups: [] });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performSearch();
      } else {
        setSearchResults({ users: [], posts: [], groups: [] });
        setHasSearched(false);
        setError(null);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const performSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch users/posts and all groups in parallel
      const [searchResponse, groupsResponse] = await Promise.allSettled([
        api.get(`/search?q=${encodeURIComponent(searchQuery)}`),
        api.get('/groups'),
      ]);

      const mainResults = searchResponse.status === 'fulfilled'
        ? searchResponse.value.data
        : { users: [], posts: [] };

      let groups = [];
      if (groupsResponse.status === 'fulfilled') {
        const allGroups = groupsResponse.value.data.groups || groupsResponse.value.data || [];
        const query = searchQuery.toLowerCase();
        groups = allGroups.filter(g =>
          g.name?.toLowerCase().includes(query) ||
          g.description?.toLowerCase().includes(query)
        ).slice(0, 5);
      }

      setError(searchResponse.status === 'rejected'
        ? searchResponse.reason || new Error('Search failed. Please try again.')
        : null);

      setSearchResults({ ...mainResults, groups });
      setHasSearched(true);
    } catch (err) {
      console.error('Search error:', err);
      setError(err);
      setHasSearched(true);
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
    setError(null);
  };

  const hasResults = searchResults.users.length > 0 ||
                     searchResults.posts.length > 0 ||
                     searchResults.groups?.length > 0;

  return (
    <div className="search-page">
      <div className="search-header">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={20} strokeWidth={1.75} />
        </button>
        <div className="search-input-container">
          <SearchIcon size={20} className="search-icon" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users, posts, groups..."
            className="search-input"
            autoFocus
            autoComplete="off"
            aria-label="Search users, posts, and groups"
          />
          {searchQuery && (
            <button className="clear-btn" onClick={clearSearch} aria-label="Clear search">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="search-results">
        {!searchQuery.trim() && !loading && (
          <div className="search-hints">
            <p>Search for users by name or username</p>
            <p>Search posts by content</p>
            <p>Search groups by name</p>
          </div>
        )}

        {searchQuery.trim() && (
          <AsyncStateWrapper
            isLoading={loading}
            isError={Boolean(error)}
            isEmpty={hasSearched && !error && !hasResults}
            error={error}
            onRetry={performSearch}
            loadingMessage="Searching across Pryde..."
            emptyComponent={(
              <EmptyState
                type="search"
                title={`No results for "${searchQuery}"`}
                description="Try searching for users, posts, or groups."
              />
            )}
          >
            {/* PHASE 4C: Groups replace hashtags */}
            {searchResults.groups?.length > 0 && (
              <div className="results-section">
                <h3 className="section-title">Groups</h3>
                {searchResults.groups.map((group) => (
                  <button
                    key={group._id}
                    type="button"
                    className="result-item group-item"
                    onClick={() => handleGroupClick(group.slug)}
                    aria-label={`Group: ${group.name}`}
                  >
                    <div className="group-icon" aria-hidden="true">
                      <Users size={20} strokeWidth={1.75} />
                    </div>
                    <div className="group-info">
                      <span className="group-name">{group.name}</span>
                      {group.description && (
                        <span className="group-description">
                          {group.description.substring(0, 60)}{group.description.length > 60 ? '...' : ''}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchResults.users.length > 0 && (
              <div className="results-section">
                <h3 className="section-title">Users</h3>
                {searchResults.users.map((user) => (
                  <button
                    key={user._id}
                    type="button"
                    className="result-item user-item"
                    onClick={() => handleUserClick(user.username)}
                    aria-label={`User: ${user.displayName || user.username}`}
                  >
                    <div className="user-avatar" aria-hidden="true">
                      {user.profilePhoto ? (
                        <img src={getImageUrl(user.profilePhoto)} alt="" />
                      ) : (
                        <span>{user.displayName?.charAt(0).toUpperCase() || 'U'}</span>
                      )}
                    </div>
                    <div className="user-info">
                      <span className="user-name">{user.displayName || user.username}</span>
                      <span className="user-username">@{user.username}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchResults.posts.length > 0 && (
              <div className="results-section">
                <h3 className="section-title">Posts</h3>
                {searchResults.posts.slice(0, 10).map((post) => (
                  <button
                    key={post._id}
                    type="button"
                    className="result-item post-item"
                    onClick={() => handlePostClick(post._id)}
                    aria-label={`Post by ${post.author?.displayName || post.author?.username}`}
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
                  </button>
                ))}
              </div>
            )}
          </AsyncStateWrapper>
        )}
      </div>
    </div>
  );
}

export default Search;

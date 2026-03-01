import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader } from 'lucide-react';
import Users from 'lucide-react/dist/esm/icons/users';
import api from '../utils/api';
import { getImageUrl } from '../utils/imageUrl';
import { quietCopy } from '../config/uiCopy';
import './GlobalSearch.css';

function GlobalSearch({ variant = 'default' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ users: [], posts: [], groups: [] });
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isQuietMode, setIsQuietMode] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Listen for quiet mode changes
  useEffect(() => {
    const checkQuietMode = () => {
      const quietAttr = document.documentElement.getAttribute('data-quiet');
      setIsQuietMode(quietAttr === 'true');
    };
    checkQuietMode();

    const observer = new MutationObserver(checkQuietMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-quiet'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performSearch();
      } else {
        setSearchResults({ users: [], posts: [], groups: [] });
        setShowResults(false);
        setError(false);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const performSearch = async () => {
    setLoading(true);
    setError(false);
    try {
      // Fetch users/posts and groups in parallel
      const [searchResponse, groupsResponse] = await Promise.allSettled([
        api.get(`/search?q=${encodeURIComponent(searchQuery)}`),
        api.get('/groups'),
      ]);

      const mainResults = searchResponse.status === 'fulfilled' ? searchResponse.value.data : { users: [], posts: [] };

      let groups = [];
      if (groupsResponse.status === 'fulfilled') {
        const allGroups = groupsResponse.value.data.groups || groupsResponse.value.data || [];
        const query = searchQuery.toLowerCase();
        groups = allGroups.filter(g =>
          g.name?.toLowerCase().includes(query) ||
          g.description?.toLowerCase().includes(query)
        ).slice(0, 3);
      }

      if (searchResponse.status === 'rejected') {
        setError(true);
      }

      setSearchResults({ ...mainResults, groups });
      setShowResults(true);
    } catch (err) {
      console.error('Search error:', err);
      setError(true);
      setShowResults(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (username) => {
    navigate(`/profile/${username}`);
    setShowResults(false);
    setSearchQuery('');
  };

  const handlePostClick = (postId) => {
    navigate(`/feed?post=${postId}`);
    setShowResults(false);
    setSearchQuery('');
  };

  const handleGroupClick = (slug) => {
    navigate(`/groups/${slug}`);
    setShowResults(false);
    setSearchQuery('');
  };

  const handleSeeMore = () => {
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    setShowResults(false);
    setSearchQuery('');
  };

  const handleKeyActivate = (e, callback) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback();
    }
  };

  const hasResults = searchResults.users.length > 0 ||
                     searchResults.posts.length > 0 ||
                     searchResults.groups.length > 0;

  return (
    <div className={`global-search ${variant === 'compact' ? 'global-search-compact' : ''}`} ref={searchRef} data-variant={variant}>
      <div className="search-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          id="global-search-input"
          name="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery && setShowResults(true)}
          placeholder={isQuietMode ? quietCopy.searchPlaceholder : (variant === 'compact' ? 'Search...' : 'Search users and posts...')}
          className="search-input"
          data-variant={variant}
          autoComplete="off"
          aria-label="Search users, posts, and groups"
          aria-expanded={showResults}
          aria-haspopup="listbox"
        />
        {loading && <Loader size={16} strokeWidth={1.75} className="search-loading" aria-hidden="true" />}
      </div>

      {showResults && (
        <div className="search-results-dropdown" role="listbox" aria-label="Search results">
          {error && (
            <div className="no-search-results search-error">Search failed — please try again</div>
          )}

          {!error && !hasResults && !loading && (
            <div className="no-search-results">No results found</div>
          )}

          {searchResults.groups.length > 0 && (
            <div className="search-section">
              <div className="search-section-title">Groups</div>
              {searchResults.groups.map((group) => (
                <div
                  key={group._id}
                  className="search-result-item group-item"
                  role="option"
                  tabIndex={0}
                  onClick={() => handleGroupClick(group.slug)}
                  onKeyDown={(e) => handleKeyActivate(e, () => handleGroupClick(group.slug))}
                  aria-label={`Group: ${group.name}`}
                >
                  <div className="group-icon-circle" aria-hidden="true">
                    <Users size={18} strokeWidth={1.75} />
                  </div>
                  <div className="user-info">
                    <div className="user-name">{group.name}</div>
                    {group.description && (
                      <div className="user-username">{group.description.substring(0, 50)}{group.description.length > 50 ? '...' : ''}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchResults.users.length > 0 && (
            <div className="search-section">
              <div className="search-section-title">Users</div>
              {searchResults.users.map((user) => (
                <div
                  key={user._id}
                  className="search-result-item user-item"
                  role="option"
                  tabIndex={0}
                  onClick={() => handleUserClick(user.username)}
                  onKeyDown={(e) => handleKeyActivate(e, () => handleUserClick(user.username))}
                  aria-label={`User: ${user.displayName || user.username}`}
                >
                  <div className="user-avatar-small">
                    {user.profilePhoto ? (
                      <img src={getImageUrl(user.profilePhoto)} alt="" aria-hidden="true" />
                    ) : (
                      <span aria-hidden="true">{user.displayName?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="user-info">
                    <div className="user-name">{user.displayName || user.username}</div>
                    <div className="user-username">@{user.username}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchResults.posts.length > 0 && (
            <div className="search-section">
              <div className="search-section-title">Posts</div>
              {searchResults.posts.slice(0, 5).map((post) => (
                <div
                  key={post._id}
                  className="search-result-item post-item"
                  role="option"
                  tabIndex={0}
                  onClick={() => handlePostClick(post._id)}
                  onKeyDown={(e) => handleKeyActivate(e, () => handlePostClick(post._id))}
                  aria-label={`Post by ${post.author?.displayName || post.author?.username}`}
                >
                  <div className="post-preview">
                    <div className="post-author-small">
                      {post.author?.displayName || post.author?.username}
                    </div>
                    <div className="post-content-preview">
                      {post.content?.substring(0, 100)}
                      {post.content?.length > 100 && '...'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div
            className="search-see-more"
            role="option"
            tabIndex={0}
            onClick={handleSeeMore}
            onKeyDown={(e) => handleKeyActivate(e, handleSeeMore)}
            aria-label="See more results"
          >
            See more results
          </div>
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;

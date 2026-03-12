/**
 * Phase 4C: Mobile Search Page
 * Full-page search experience for mobile users
 * Provides the same search functionality as GlobalSearch on desktop
 *
 * PHASE 4C: Hashtag search removed - groups are the only topic-based container
 * 
 * IMPROVED: Added hero header, filter tabs, skeleton loading, trending section,
 * recent searches, and premium styling to match Pryde Social design standards
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search as SearchIcon, X, Users, Clock, TrendingUp } from 'lucide-react';
import SearchSkeleton from '../components/SearchSkeleton';
import SearchTabs from '../components/SearchTabs';
import api from '../utils/api';
import { getImageUrl } from '../utils/imageUrl';\nimport SearchFilters from '../components/SearchFilters';\nimport SearchAutocomplete from '../components/SearchAutocomplete';\nimport { Mic, Filter as FilterIcon, ChevronLeft, Loader2 } from 'lucide-react';\nimport './Search.css';\n\n\nfunction Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ users: [], posts: [], groups: [] });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [recentSearches, setRecentSearches] = useState([]);
  const navigate = useNavigate();\n  const searchInputRef = useRef(null);\n  const loaderRef = useRef(null);\n  const autocompleteRef = useRef(null);\n\n  // New SOTA states\n  const [filters, setFilters] = useState({\n    tab: 'all',\n    sort: 'relevance',\n    verified: false,\n    media: false,\n    dateFrom: '',\n    dateTo: ''\n  });\n  const [suggestions, setSuggestions] = useState([]);\n  const [autocompleteLoading, setAutocompleteLoading] = useState(false);\n  const [isFiltersOpen, setIsFiltersOpen] = useState(false);\n  const [savedSearches, setSavedSearches] = useState([]);\n  const [page, setPage] = useState(1);\n  const [hasMore, setHasMore] = useState(true);\n  const [voiceActive, setVoiceActive] = useState(false);\n\n  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pryde_recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((query) => {
    if (!query.trim()) return;
    setRecentSearches((current) => {
      const updated = [query, ...current.filter((s) => s !== query)].slice(0, 10);
      localStorage.setItem('pryde_recent_searches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistory = () => {
    setRecentSearches([]);
    localStorage.removeItem('pryde_recent_searches');
  };

  const removeFromHistory = (query) => {
    const updated = recentSearches.filter(s => s !== query);
    setRecentSearches(updated);
    localStorage.setItem('pryde_recent_searches', JSON.stringify(updated));
  };

  const performSearch = useCallback(async () => {
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
        const allGroups = groupsResponse.value.data?.groups || groupsResponse.value.data || [];
        const query = searchQuery.toLowerCase();
        groups = allGroups.filter(g =>
          g.name?.toLowerCase().includes(query) ||
          g.description?.toLowerCase().includes(query)
        ).slice(0, 5);
      }

      setSearchResults({ ...mainResults, groups });
      setHasSearched(true);
      
      // Save to recent searches on successful search
      if (mainResults.users?.length > 0 || mainResults.posts?.length > 0 || groups.length > 0) {
        saveRecentSearch(searchQuery);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  }, [saveRecentSearch, searchQuery]);

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
  }, [performSearch, searchQuery]);

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
    searchInputRef.current?.focus();
  };

  const handleRecentSearchClick = (query) => {
    setSearchQuery(query);
  };

  // Filter results based on active tab
  const getFilteredResults = () => {
    if (activeTab === 'users') return { users: searchResults.users, posts: [], groups: [] };
    if (activeTab === 'posts') return { users: [], posts: searchResults.posts, groups: [] };
    if (activeTab === 'groups') return { users: [], posts: [], groups: searchResults.groups };
    return searchResults;
  };

  const filteredResults = getFilteredResults();
  const filteredHasResults = filteredResults.users.length > 0 ||
                             filteredResults.posts.length > 0 ||
                             filteredResults.groups?.length > 0;

  // Trending topics (simulated)
  const trendingTopics = ['photography', 'music', 'travel', 'food', 'art', 'fitness', 'tech', 'gaming'];

  return (
    <div className="search-page">
      {/* Hero Header */}
      <div className="search-hero">
        <h1 className="search-title">🔍 Discover</h1>
        <p className="search-subtitle">Find people, posts, and communities</p>
      </div>

      {/* Search Header */}
      <div className="search-header">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={20} strokeWidth={1.75} />
        </button>
        <div className="search-input-container">
          <SearchIcon size={20} className="search-icon" aria-hidden="true" />\n          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users, posts, groups..."
            className="search-input"
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

      <SearchTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="search-results">
        {/* Loading State with Skeletons */}
{loading && <SearchSkeleton />}

        {/* Empty Search State - Show Suggestions */}
        {!searchQuery.trim() && !loading && (
          <div className="search-suggestions">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="recent-searches">
                <div className="recent-header">
                  <h3 className="section-title">
                    <Clock size={16} />
                    Recent Searches
                  </h3>
                  <button onClick={clearHistory} className="clear-history">
                    Clear all
                  </button>
                </div>
                <div className="recent-list">
                  {recentSearches.map((item, index) => (
                    <button
                      key={index}
                      className="recent-item"
                      onClick={() => handleRecentSearchClick(item)}
                    >
                      <Clock size={16} className="recent-icon" />
                      <span>{item}</span>
                      <X 
                        size={16} 
                        className="remove-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromHistory(item);
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Topics */}
            <div className="trending-section">
              <h3 className="section-title">
                <TrendingUp size={16} />
                Trending Topics
              </h3>
              <div className="trending-tags">
                {trendingTopics.map((tag) => (
                  <button
                    key={tag}
                    className="trending-tag"
                    onClick={() => setSearchQuery(tag)}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Hints */}
            <div className="search-hints">
              <p>Search for users by name or username</p>
              <p>Search posts by content</p>
              <p>Search groups by name</p>
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchQuery.trim() && !loading && (
          <>
            {error && (
              <div className="search-error">
                <p>Something went wrong. Please try again.</p>
                <button onClick={performSearch} className="retry-btn">
                  Retry
                </button>
              </div>
            )}

            {!error && hasSearched && !filteredHasResults && (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <h3>No results found</h3>
                <p>Try different keywords or browse suggested users</p>
              </div>
            )}

            {!error && filteredHasResults && (
              <div className="results-list">
                {/* Groups Results */}
                {filteredResults.groups?.length > 0 && (
                  <div className="results-section">
                    <h3 className="section-title">Groups</h3>
                    {filteredResults.groups.map((group) => (
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

                {/* Users Results */}
                {filteredResults.users.length > 0 && (
                  <div className="results-section">
                    <h3 className="section-title">Users</h3>
                    {filteredResults.users.map((user) => (
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

                {/* Posts Results */}
                {filteredResults.posts.length > 0 && (
                  <div className="results-section">
                    <h3 className="section-title">Posts</h3>
                    {filteredResults.posts.slice(0, 10).map((post) => (
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
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Search;

/**
 * Mobile Search Page
 * Full-page search experience for mobile users
 * Provides the same search functionality as GlobalSearch on desktop
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search as SearchIcon, X } from 'lucide-react';
import api from '../utils/api';
import { getImageUrl } from '../utils/imageUrl';
import './Search.css';

function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ users: [], posts: [], hashtags: [] });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performSearch();
      } else {
        setSearchResults({ users: [], posts: [], hashtags: [] });
        setHasSearched(false);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data);
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

  const handleHashtagClick = (hashtag) => {
    navigate(`/hashtag/${hashtag.replace('#', '')}`);
  };

  const handlePostClick = (postId) => {
    navigate(`/feed?post=${postId}`);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults({ users: [], posts: [], hashtags: [] });
    setHasSearched(false);
  };

  const hasResults = searchResults.users.length > 0 || 
                     searchResults.posts.length > 0 || 
                     searchResults.hashtags.length > 0;

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
            placeholder="Search users, posts, hashtags..."
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
            <p className="no-results-hint">Try searching for users, posts, or hashtags</p>
          </div>
        )}

        {!hasSearched && !loading && (
          <div className="search-hints">
            <p>🔍 Search for users by name or username</p>
            <p>📝 Search posts by content</p>
            <p>#️⃣ Search hashtags</p>
          </div>
        )}

        {searchResults.hashtags.length > 0 && (
          <div className="results-section">
            <h3 className="section-title">Hashtags</h3>
            {searchResults.hashtags.map((item, index) => (
              <div
                key={index}
                className="result-item hashtag-item"
                onClick={() => handleHashtagClick(item.hashtag)}
              >
                <span className="hashtag-icon">#</span>
                <div className="hashtag-info">
                  <span className="hashtag-name">{item.hashtag}</span>
                  <span className="hashtag-count">{item.count} posts</span>
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


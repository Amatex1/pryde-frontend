/**
 * Search Page — Modern Discovery Layout
 *
 * Empty state  → Hero + discovery grid (Recents, Suggested People,
 *                Trending Topics, Active Conversations)
 * Active query → existing search results (users / posts / groups)
 *
 * All original search logic and API calls are preserved unchanged.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search as SearchIcon, X,
  Clock, TrendingUp, Users, FileText,
} from 'lucide-react';
import SuggestedPeople      from '../components/search/SuggestedPeople';
import PopularCommunities   from '../components/discovery/PopularCommunities';
import ActiveConversations  from '../components/discovery/ActiveConversations';
import NewCommunities       from '../components/discovery/NewCommunities';
import api        from '../utils/api';
import { getImageUrl } from '../utils/imageUrl';
import './Search.css';
import '../styles/searchDiscovery.css';

/* ── Constants ── */
const TABS = [
  { id: 'all',    label: 'All' },
  { id: 'users',  label: 'People' },
  { id: 'posts',  label: 'Posts' },
  { id: 'groups', label: 'Groups' },
];

const TRENDING = ['photography', 'music', 'travel', 'food', 'art', 'fitness', 'tech', 'gaming'];

/* ── Skeleton rows (shown while searching) ── */
function SkeletonRows({ count = 5 }) {
  return (
    <div className="search-skeletons">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skeleton-row" key={i}>
          <div className="skeleton-avatar" />
          <div className="skeleton-lines">
            <div className="skeleton-line" />
            <div className="skeleton-line skeleton-line-short" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main component ── */
function Search() {
  const [query, setQuery]             = useState('');
  const [results, setResults]         = useState({ users: [], posts: [], groups: [] });
  const [loading, setLoading]         = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError]             = useState(null);
  const [activeTab, setActiveTab]     = useState('all');
  const [recents, setRecents]         = useState([]);
  // Discovery engine — groups fetched once for Popular & New Communities
  const [discGroups, setDiscGroups]   = useState([]);
  const [discLoading, setDiscLoading] = useState(true);
  const navigate  = useNavigate();
  const inputRef  = useRef(null);

  /* Load recent searches + prefetch groups for discovery engine */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pryde_recent_searches');
      if (saved) setRecents(JSON.parse(saved));
    } catch { /* ignore bad JSON */ }
    inputRef.current?.focus();

    // Fetch groups once — shared by PopularCommunities & NewCommunities
    api.get('/groups')
      .then((res) => {
        const list = res.data?.groups || res.data || [];
        // Only show listed/public groups in discovery
        setDiscGroups(list.filter(g =>
          !g.visibility || g.visibility === 'listed' || g.visibility === 'public'
        ));
      })
      .catch(() => { /* discovery fails silently */ })
      .finally(() => setDiscLoading(false));
  }, []);

  const saveRecent = useCallback((q) => {
    if (!q.trim()) return;
    setRecents((prev) => {
      const next = [q, ...prev.filter((s) => s !== q)].slice(0, 10);
      localStorage.setItem('pryde_recent_searches', JSON.stringify(next));
      return next;
    });
  }, []);

  const removeRecent = (q, e) => {
    e.stopPropagation();
    setRecents((prev) => {
      const next = prev.filter((s) => s !== q);
      localStorage.setItem('pryde_recent_searches', JSON.stringify(next));
      return next;
    });
  };

  const clearRecents = () => {
    setRecents([]);
    localStorage.removeItem('pryde_recent_searches');
  };

  /* ── Search (unchanged logic) ── */
  const performSearch = useCallback(async (q) => {
    setLoading(true);
    setError(null);
    try {
      const [searchRes, groupsRes] = await Promise.allSettled([
        api.get(`/search?q=${encodeURIComponent(q)}`),
        api.get('/groups'),
      ]);

      const main = searchRes.status === 'fulfilled'
        ? searchRes.value.data
        : { users: [], posts: [] };

      let groups = [];
      if (groupsRes.status === 'fulfilled') {
        const all   = groupsRes.value.data?.groups || groupsRes.value.data || [];
        const lower = q.toLowerCase();
        groups = all
          .filter((g) =>
            g.name?.toLowerCase().includes(lower) ||
            g.description?.toLowerCase().includes(lower)
          )
          .slice(0, 5);
      }

      const merged = { ...main, groups };
      setResults(merged);
      setHasSearched(true);

      if (main.users?.length || main.posts?.length || groups.length) {
        saveRecent(q);
      }
    } catch (err) {
      setError(err);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  }, [saveRecent]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        performSearch(query.trim());
      } else {
        setResults({ users: [], posts: [], groups: [] });
        setHasSearched(false);
        setError(null);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const clearSearch = () => {
    setQuery('');
    setResults({ users: [], posts: [], groups: [] });
    setHasSearched(false);
    setError(null);
    inputRef.current?.focus();
  };

  /* Filtered results for active tab */
  const filtered = (() => {
    if (activeTab === 'users')  return { users: results.users,  posts: [],            groups: [] };
    if (activeTab === 'posts')  return { users: [],             posts: results.posts, groups: [] };
    if (activeTab === 'groups') return { users: [],             posts: [],            groups: results.groups };
    return results;
  })();

  const hasResults = filtered.users.length || filtered.posts.length || filtered.groups?.length;

  /* ── Render ── */
  return (
    <div className="search-page">

      {/* ── Back button ── */}
      <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">
        <ArrowLeft size={20} strokeWidth={2} />
      </button>

      {/* ════════════════════════════════════════
          STEP 1 — Search Hero
          ════════════════════════════════════════ */}
      <div className="search-hero">
        <h1 className="search-title">Search Pryde</h1>
        <p className="search-subtitle">Find people, posts, and communities</p>

        {/* Search input */}
        <div className="search-input-wrapper">
          <SearchIcon size={16} className="search-icon" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people, posts, groups..."
            className="search-input"
            autoComplete="off"
            aria-label="Search"
          />
          {query && (
            <button className="clear-btn" onClick={clearSearch} aria-label="Clear search">
              <X size={12} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="search-tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`search-tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {/* ── end hero ── */}

      {/* ── Body ── */}
      <div className="search-body">

        {/* Loading skeletons */}
        {loading && <SkeletonRows count={6} />}

        {/* ════════════════════════════════════════
            EMPTY STATE — Discovery sections
            Only shown when no active query
            ════════════════════════════════════════ */}
        {!query.trim() && !loading && (
          <div className="search-discovery">

            {/* STEPS 2 & 3 — Discovery grid */}
            <div className="search-discovery-grid">

              {/* Recent searches card */}
              <div className="search-card recent-searches-card">
                <h3 className="search-card-title">
                  <Clock size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  Recent
                </h3>

                {recents.length === 0 ? (
                  <p className="search-card-empty">No recent searches yet.</p>
                ) : (
                  <>
                    <div className="recent-list">
                      {recents.map((item) => (
                        <button
                          key={item}
                          className="recent-item"
                          onClick={() => setQuery(item)}
                        >
                          <Clock size={14} className="recent-icon" />
                          <span className="recent-item-text">{item}</span>
                          <button
                            className="recent-remove-btn"
                            aria-label={`Remove ${item}`}
                            onClick={(e) => removeRecent(item, e)}
                          >
                            <X size={13} strokeWidth={2} />
                          </button>
                        </button>
                      ))}
                    </div>
                    <button className="clear-history" onClick={clearRecents}>
                      Clear all
                    </button>
                  </>
                )}
              </div>

              {/* STEP 3 — Suggested people card */}
              <div className="search-card suggested-people-card">
                <h3 className="search-card-title">People to Follow</h3>
                <SuggestedPeople />
              </div>
            </div>
            {/* end discovery grid */}

            {/* STEP 4 — Trending Topics */}
            <div className="trending-topics">
              <h3 className="discovery-section-title">
                <TrendingUp size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Trending Topics
              </h3>
              <div className="topic-chip-grid">
                {TRENDING.map((tag) => (
                  <button
                    key={tag}
                    className="topic-chip"
                    onClick={() => setQuery(tag)}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            {/* ════════════════════════════════════════
                STEPS 5-13 — Community Discovery Engine
                Only rendered when query is empty
                ════════════════════════════════════════ */}
            <div className="discovery-engine">
              <PopularCommunities groups={discGroups} loading={discLoading} />
              <ActiveConversations />
              <NewCommunities groups={discGroups} loading={discLoading} />
            </div>

          </div>
        )}
        {/* end discovery */}

        {/* ════════════════════════════════════════
            ACTIVE QUERY — Search Results
            (original logic, untouched)
            ════════════════════════════════════════ */}
        {query.trim() && !loading && (
          <>
            {/* Error state */}
            {error && (
              <div className="search-state-center">
                <div className="search-state-icon">
                  <SearchIcon size={24} />
                </div>
                <p className="search-state-title">Something went wrong</p>
                <p className="search-state-sub">Check your connection and try again.</p>
                <button className="retry-btn" onClick={() => performSearch(query.trim())}>
                  Retry
                </button>
              </div>
            )}

            {/* No results */}
            {!error && hasSearched && !hasResults && (
              <div className="search-state-center">
                <div className="search-state-icon">
                  <SearchIcon size={24} />
                </div>
                <p className="search-state-title">No results for "{query}"</p>
                <p className="search-state-sub">Try different keywords or check the spelling.</p>
              </div>
            )}

            {/* Results */}
            {!error && hasResults > 0 && (
              <div className="results-list">

                {/* Groups */}
                {filtered.groups?.length > 0 && (
                  <>
                    {activeTab === 'all' && (
                      <div className="results-section-label">Groups</div>
                    )}
                    {filtered.groups.map((group) => (
                      <button
                        key={group._id}
                        type="button"
                        className="result-row"
                        onClick={() => navigate(`/groups/${group.slug}`)}
                        aria-label={`Group: ${group.name}`}
                      >
                        <div className="result-group-icon">
                          <Users size={20} strokeWidth={1.75} />
                        </div>
                        <div className="result-text">
                          <span className="result-primary">{group.name}</span>
                          {group.description && (
                            <span className="result-secondary">
                              {group.description.length > 65
                                ? group.description.substring(0, 65) + '…'
                                : group.description}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </>
                )}

                {/* Users */}
                {filtered.users.length > 0 && (
                  <>
                    {activeTab === 'all' && (
                      <div className="results-section-label">People</div>
                    )}
                    {filtered.users.map((user) => (
                      <button
                        key={user._id}
                        type="button"
                        className="result-row"
                        onClick={() => navigate(`/profile/${user.username}`)}
                        aria-label={`User: ${user.displayName || user.username}`}
                      >
                        <div className="result-avatar">
                          {user.profilePhoto
                            ? <img src={getImageUrl(user.profilePhoto)} alt="" />
                            : <span>{(user.displayName || user.username || 'U').charAt(0).toUpperCase()}</span>
                          }
                        </div>
                        <div className="result-text">
                          <span className="result-primary">{user.displayName || user.username}</span>
                          <span className="result-secondary">@{user.username}</span>
                        </div>
                      </button>
                    ))}
                  </>
                )}

                {/* Posts */}
                {filtered.posts.length > 0 && (
                  <>
                    {activeTab === 'all' && (
                      <div className="results-section-label">Posts</div>
                    )}
                    {filtered.posts.slice(0, 10).map((post) => (
                      <button
                        key={post._id}
                        type="button"
                        className="result-row"
                        onClick={() => navigate(`/feed?post=${post._id}`)}
                        aria-label={`Post by ${post.author?.displayName || post.author?.username}`}
                      >
                        <div className="result-post-icon">
                          <FileText size={20} strokeWidth={1.75} />
                        </div>
                        <div className="result-text">
                          <span className="result-primary">
                            {post.author?.displayName || post.author?.username}
                          </span>
                          <span className="result-secondary">
                            {post.content?.length > 80
                              ? post.content.substring(0, 80) + '…'
                              : post.content}
                          </span>
                        </div>
                      </button>
                    ))}
                  </>
                )}

              </div>
            )}
          </>
        )}

      </div>
      {/* end search-body */}
    </div>
  );
}

export default Search;

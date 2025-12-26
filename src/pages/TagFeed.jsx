/**
 * Migration Phase 1: Tags → Groups (UI Handoff)
 *
 * LEGACY TAG FEED PAGE - READ-ONLY MIGRATION STUB
 *
 * This page is a legacy entry point only.
 * Tags are no longer active for new content.
 * No posting is permitted here by design.
 *
 * Behavior:
 * - If group mapping exists: Show handoff CTA to /groups/:slug
 * - If no group mapping: Show "topic no longer active" message
 * - No posts are displayed (privacy: posts live in groups now)
 * - No composer is rendered
 * - No API calls to create posts with tags
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import './TagFeed.css';

function TagFeed() {
  const { slug } = useParams();

  // Migration Phase 1: Tags → Groups
  // Only track tag metadata and group mapping - NO posts
  const [tag, setTag] = useState(null);
  const [groupMapping, setGroupMapping] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Migration Phase 1: POSTING DISABLED
  // This flag ensures no posting UI is ever rendered
  const POSTING_DISABLED = true;

  useEffect(() => {
    fetchTagInfo();
  }, [slug]);

  /**
   * Migration Phase 1: Fetch only tag metadata and group mapping
   * NO posts are fetched - they now live in private groups
   */
  const fetchTagInfo = async () => {
    try {
      setLoading(true);
      setNotFound(false);

      // Check if this tag has been migrated to a group
      try {
        const mappingResponse = await api.get(`/tags/${slug}/group-mapping`);
        if (mappingResponse.data.hasMigrated) {
          setGroupMapping(mappingResponse.data.group);
        }
      } catch (mappingError) {
        // Migration Phase 1: Mapping not found is expected for non-migrated tags
        console.debug('Group mapping check:', mappingError.message);
      }

      // Fetch basic tag metadata only (for title/description display)
      try {
        const tagResponse = await api.get(`/tags/${slug}`);
        setTag(tagResponse.data);
      } catch (tagError) {
        if (tagError.response?.status === 404) {
          setNotFound(true);
        }
        console.debug('Tag fetch error:', tagError.message);
      }
    } catch (error) {
      console.error('Failed to fetch tag info:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Humanize slug for display when tag data unavailable
   * Example: "deep-thoughts" → "Deep Thoughts"
   */
  const humanizeSlug = (s) => {
    if (!s) return '';
    return s
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Loading state
  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="tag-feed-container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  // Tag not found - show generic inactive message
  if (notFound) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="tag-feed-container">
          <div className="tag-migration-stub glossy">
            <div className="migration-stub-icon">🏷️</div>
            <h1>{humanizeSlug(slug)}</h1>
            <p className="migration-stub-message">
              This topic is no longer active.
            </p>
            <p className="migration-stub-hint">
              Browse the main feed or discover new groups to connect with your community.
            </p>
            <Link to="/feed" className="btn-go-to-feed">
              Go to Feed
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Migration Phase 1: Group mapping exists - show handoff CTA
  if (groupMapping) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="tag-feed-container">
          <div className="tag-migration-stub glossy">
            <div className="migration-stub-icon">🚀</div>
            <h1>{tag?.label || humanizeSlug(slug)}</h1>
            {tag?.description && (
              <p className="tag-description">{tag.description}</p>
            )}
            <div className="migration-stub-divider"></div>
            <h2 className="migration-stub-title">This topic now lives as a private group</h2>
            <p className="migration-stub-message">
              Join the <strong>{groupMapping.name}</strong> group to view and participate in discussions.
            </p>
            <Link to={`/groups/${groupMapping.slug}`} className="btn-go-to-group">
              Go to Group →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Migration Phase 1: No group mapping - show inactive message
  // NO posts displayed, NO composer rendered
  return (
    <div className="page-container">
      <Navbar />
      <div className="tag-feed-container">
        <div className="tag-migration-stub glossy">
          <div className="migration-stub-icon">{tag?.icon || '🏷️'}</div>
          <h1>{tag?.label || humanizeSlug(slug)}</h1>
          {tag?.description && (
            <p className="tag-description">{tag.description}</p>
          )}
          <div className="migration-stub-divider"></div>
          <p className="migration-stub-message">
            This topic is no longer active.
          </p>
          <p className="migration-stub-hint">
            New discussions have moved to private groups. Browse the main feed or discover new communities.
          </p>
          <Link to="/feed" className="btn-go-to-feed">
            Go to Feed
          </Link>
        </div>

        {/*
          Migration Phase 1: POSTING DISABLED BY DESIGN
          No composer is rendered. The POSTING_DISABLED constant
          ensures this section is never accidentally enabled.
        */}
        {!POSTING_DISABLED && (
          <div className="create-post glossy" style={{ display: 'none' }}>
            {/* Composer intentionally removed - Migration Phase 1 */}
          </div>
        )}

        {/*
          Migration Phase 1: POSTS NOT DISPLAYED BY DESIGN
          Posts now live in private groups. Showing them here
          would bypass group membership requirements.
        */}
      </div>
    </div>
  );
}

export default TagFeed;


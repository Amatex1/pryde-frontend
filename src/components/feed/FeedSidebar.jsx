import { Link } from 'react-router-dom';
import CommunityResources from '../Sidebar/CommunityResources';
import SuggestedConnections from '../Sidebar/SuggestedConnections';
import CommunitySidebar, { CommunitySpotlight, CommunityThemes, ActiveMembers } from '../Sidebar/CommunitySpotlight';

/**
 * FeedSidebar — static right-hand panel shown on desktop.
 * Extracted from Feed.jsx (Phase 3 reorganisation).
 */
export default function FeedSidebar({ showMobileSidebar }) {
  return (
    <aside className={`feed-sidebar ${showMobileSidebar ? 'mobile-visible' : ''}`}>
      {/* =========================================
          Community Features (Spotlight, Themes, Active Members)
         ========================================= */}
      <div className="sidebar-card community-features glossy">
        <CommunitySpotlight />
        <CommunityThemes />
        <ActiveMembers />
      </div>

      {/* =========================================
          Explore Pryde — Feature Discovery
         ========================================= */}
      <div className="sidebar-card explore-pryde glossy">
        <h3 className="sidebar-title">Explore Pryde</h3>
        <p className="sidebar-subtitle">
          Take your time. These spaces are here when you need them.
        </p>
        <nav className="explore-links">
          <Link to="/groups" className="explore-link">
            <strong>👥 Groups</strong>
            <span>Join shared spaces built around interests, support, and identity.</span>
          </Link>
          <Link to="/circles" className="explore-link">
            <strong>🌱 Circles</strong>
            <span>Small, intimate communities with people you trust.</span>
          </Link>
          <Link to="/collections" className="explore-link">
            <strong>📚 Collections</strong>
            <span>Save and organize posts that matter to you.</span>
          </Link>
          <Link to="/journal" className="explore-link">
            <strong>📔 Journal</strong>
            <span>A quiet place to write — just for you, or gently shared.</span>
          </Link>
          <Link to="/longform" className="explore-link">
            <strong>📖 Stories</strong>
            <span>Short moments people choose to share, nothing more.</span>
          </Link>
          <Link to="/photo-essay" className="explore-link">
            <strong>📸 Photos</strong>
            <span>Images, memories, and small glimpses of life.</span>
          </Link>
          <Link to="/lounge" className="explore-link">
            <strong>✨ Lounge</strong>
            <span>A shared space for open conversation, without urgency.</span>
          </Link>
        </nav>
      </div>

      {/* Need Support */}
      <div className="sidebar-card support-card glossy">
        <h3 className="sidebar-title support-title">Need support?</h3>
        <p className="support-description">
          If you're going through something, help is available.
        </p>
        <Link
          to="/helplines"
          className="support-link"
        >
          View helplines
        </Link>
      </div>

      {/* Subtle divider between support and resources */}
      <div className="sidebar-divider" aria-hidden="true" />

      {/* Community & Resources - Curated LGBTQ+ links */}
      <div className="sidebar-card glossy">
        <CommunityResources />
      </div>

      {/* Suggested Connections */}
      <div className="sidebar-card glossy">
        <SuggestedConnections />
      </div>
    </aside>
  );
}

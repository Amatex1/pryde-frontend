/**
 * FeedSidebar - Sidebar content for Feed page
 *
 * RESPONSIBILITIES:
 * - Render sidebar UI (explore links, support, suggested connections)
 *
 * RULES:
 * - NO layout logic (widths, grids, media queries)
 * - Layout-agnostic: renders the same on all platforms
 */

import { Link } from 'react-router-dom';
import SuggestedConnections from '../../components/Sidebar/SuggestedConnections';
import './FeedSidebar.css';

export default function FeedSidebar() {
  return (
    <div className="feed-sidebar-content">
      {/* Explore Pryde - Feature Discovery */}
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
        <Link to="/helplines" className="support-link">
          View helplines
        </Link>
      </div>

      {/* Suggested Connections */}
      <div className="sidebar-card glossy">
        <SuggestedConnections />
      </div>
    </div>
  );
}


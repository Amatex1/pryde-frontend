/**
 * Phase 2B: Tags → Groups Migration Complete
 *
 * This page redirects to the corresponding group.
 * Tags have been fully deprecated.
 */

import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './TagFeed.css';

function TagFeed() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Auto-redirect to the group with the same slug
  useEffect(() => {
    // Redirect after a brief delay to show the message
    const timer = setTimeout(() => {
      navigate(`/groups/${slug}`, { replace: true });
    }, 2000);

    return () => clearTimeout(timer);
  }, [slug, navigate]);

  /**
   * Humanize slug for display
   * Example: "deep-thoughts" → "Deep Thoughts"
   */
  const humanizeSlug = (s) => {
    if (!s) return '';
    return s
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="page-container">
      <Navbar />
      <div className="tag-feed-container">
        <div className="tag-migration-stub glossy">
          <div className="migration-stub-icon">🚀</div>
          <h1>{humanizeSlug(slug)}</h1>
          <div className="migration-stub-divider"></div>
          <h2 className="migration-stub-title">Tags have moved to Groups</h2>
          <p className="migration-stub-message">
            Redirecting you to the group...
          </p>
          <Link to={`/groups/${slug}`} className="btn-go-to-group">
            Go to Group Now
          </Link>
        </div>
      </div>
    </div>
  );
}

export default TagFeed;


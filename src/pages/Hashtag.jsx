import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Feed.css';

/**
 * Phase 2B: Hashtag Page - Redirects to Groups
 * Hashtags have been migrated to Groups.
 */
function Hashtag() {
  const { tag } = useParams();
  const navigate = useNavigate();

  // Auto-redirect to the group with the same slug
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(`/groups/${tag}`, { replace: true });
    }, 2000);

    return () => clearTimeout(timer);
  }, [tag, navigate]);

  return (
    <div className="page-container feed-page">
      <Navbar />
      <div className="feed-layout hashtag-feed">
        <main className="feed-main">
          <div className="hashtag-header glossy">
            <h1 className="hashtag-title">#{tag}</h1>
            <p className="hashtag-subtitle">Redirecting to Group...</p>
          </div>

          <div className="no-posts glossy" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚀</div>
            <p className="no-posts-primary" style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Hashtags have moved to Groups
            </p>
            <p className="no-posts-secondary" style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Redirecting you to the group...
            </p>
            <Link
              to={`/groups/${tag}`}
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                background: 'var(--primary-gradient, linear-gradient(135deg, #667eea 0%, #764ba2 100%))',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 500,
                textDecoration: 'none'
              }}
            >
              Go to Group Now
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Hashtag;


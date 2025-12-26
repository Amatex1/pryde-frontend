import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Feed.css';

/**
 * Hashtag Page - DEPRECATED
 * Hashtag search functionality has been removed as of 2025-12-26 (Phase 5)
 * This page now shows a deprecation notice and offers to redirect to Feed
 */
function Hashtag() {
  const { tag } = useParams();
  const navigate = useNavigate();

  const handleGoToFeed = () => {
    navigate('/feed');
  };

  return (
    <div className="page-container feed-page">
      <Navbar />
      <div className="feed-layout hashtag-feed">
        <main className="feed-main">
          <div className="hashtag-header glossy">
            <h1 className="hashtag-title">#{tag}</h1>
            <p className="hashtag-subtitle">Feature Removed</p>
          </div>

          <div className="no-posts glossy" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏷️</div>
            <p className="no-posts-primary" style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Hashtag Search Has Been Removed
            </p>
            <p className="no-posts-secondary" style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              We've simplified the platform to focus on what matters most - connecting with people you care about.
            </p>
            <button
              onClick={handleGoToFeed}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'var(--primary-gradient, linear-gradient(135deg, #667eea 0%, #764ba2 100%))',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Go to Feed
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Hashtag;


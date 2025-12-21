import './PinnedPostBadge.css';

/**
 * PinnedPostBadge Component
 *
 * Displays a badge indicating that a post is pinned.
 */
const PinnedPostBadge = () => {
  return (
    <div className="pinned-post-badge">
      <span className="pin-icon">📌</span>
      <span className="pin-text">Pinned</span>
    </div>
  );
};

export default PinnedPostBadge;

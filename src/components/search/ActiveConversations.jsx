/**
 * ActiveConversations — Search Discovery
 * Shows up to 4 posts with high engagement (4+ comments in last 24h).
 * Uses /api/feed/conversations endpoint.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';
import api from '../../utils/api';

function ActiveConversations() {
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    api.get('/feed/conversations')
      .then((res) => {
        if (!cancelled) {
          const list = Array.isArray(res.data)
            ? res.data
            : (res.data?.posts || res.data?.data || []);
          setPosts(list.slice(0, 4));
        }
      })
      .catch(() => { /* fail silently */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="active-conversations">
        <h3 className="discovery-section-title">Active Conversations</h3>
        <div className="ac-skeleton-list">
          {[1, 2, 3].map((i) => (
            <div className="ac-skeleton-card" key={i}>
              <div className="ac-skeleton-line" />
              <div className="ac-skeleton-line ac-skeleton-line-short" />
              <div className="ac-skeleton-meta" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!posts.length) return null;

  return (
    <div className="active-conversations">
      <h3 className="discovery-section-title">Active Conversations</h3>

      {posts.map((post) => {
        const text    = post.content || post.text || '';
        const likes   = post.likes?.length ?? post.likesCount ?? 0;
        const comments = post.comments?.length ?? post.commentsCount ?? 0;
        const author  = post.author?.displayName || post.author?.username || 'Someone';

        return (
          <button
            key={post._id}
            type="button"
            className="conversation-card"
            onClick={() => navigate(`/feed?post=${post._id}`)}
            aria-label={`Post by ${author}`}
          >
            <div className="conversation-author">{author}</div>
            <div className="conversation-text">
              {text.length > 120 ? text.substring(0, 120) + '…' : text}
            </div>
            <div className="conversation-meta">
              <span className="conversation-stat">
                <Heart size={13} strokeWidth={2} />
                {likes}
              </span>
              <span className="conversation-stat">
                <MessageCircle size={13} strokeWidth={2} />
                {comments}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default ActiveConversations;

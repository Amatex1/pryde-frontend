/**
 * ActiveConversations — Discovery Engine
 * Shows up to 5 posts ranked by heat score from /api/discovery/heat.
 * Includes group name when available.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Flame } from 'lucide-react';
import api from '../../utils/api';

function ActiveConversations() {
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    // STEP 4 — heat-ranked discovery endpoint
    api.get('/discovery/heat')
      .then((res) => {
        if (!cancelled) {
          const list = Array.isArray(res.data)
            ? res.data
            : (res.data?.posts || res.data?.data || []);
          setPosts(list.slice(0, 5));
        }
      })
      .catch(() => { /* fail silently — section stays hidden */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="discovery-section">
        <h3 className="discovery-section-title">
          <Flame size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />
          Active Conversations
        </h3>
        <div className="disc-skeleton-list">
          {[1, 2, 3].map((i) => (
            <div className="disc-conv-skeleton" key={i}>
              <div className="disc-skeleton-line" style={{ width: '40%', marginBottom: 8 }} />
              <div className="disc-skeleton-line" />
              <div className="disc-skeleton-line disc-skeleton-line-short" style={{ marginTop: 6 }} />
              <div className="disc-skeleton-line" style={{ width: '30%', marginTop: 8 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!posts.length) return null;

  return (
    <div className="discovery-section">
      <h3 className="discovery-section-title">
        <Flame size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />
        Active Conversations
      </h3>
      {posts.map((post) => {
        const text     = post.content || post.text || '';
        const likes    = post.likes?.length    ?? post.likesCount    ?? 0;
        const comments = post.comments?.length ?? post.commentsCount ?? 0;
        const author   = post.author?.displayName || post.author?.username || 'Someone';
        const groupName = post.group?.name || post.groupName || null;

        return (
          <div
            key={post._id}
            className="conversation-card"
            onClick={() => navigate(`/feed?post=${post._id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(`/feed?post=${post._id}`)}
            aria-label={`Post by ${author}`}
          >
            {groupName && (
              <div className="conversation-group">{groupName}</div>
            )}
            <div className="conversation-author">{author}</div>
            <div className="conversation-text">
              {text.length > 120 ? text.substring(0, 120) + '…' : text}
            </div>
            <div className="conversation-meta">
              <span className="conversation-stat">
                <Heart size={12} strokeWidth={2} />
                {likes}
              </span>
              <span className="conversation-stat">
                <MessageCircle size={12} strokeWidth={2} />
                {comments}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ActiveConversations;

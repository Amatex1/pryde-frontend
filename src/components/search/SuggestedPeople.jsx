/**
 * SuggestedPeople — Search Discovery
 * Fetches up to 5 suggested users and lets the viewer follow them.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { getImageUrl } from '../../utils/imageUrl';

function Avatar({ user, size = 36 }) {
  const initial = (user.displayName || user.username || 'U').charAt(0).toUpperCase();
  return (
    <div
      className="sp-avatar"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      onClick={() => {}}
    >
      {user.profilePhoto
        ? <img src={getImageUrl(user.profilePhoto)} alt="" />
        : <span>{initial}</span>
      }
    </div>
  );
}

function SuggestedPeople() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [following, setFollowing] = useState({}); // userId → 'loading' | 'done'
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    api.get('/users/suggested')
      .then((res) => {
        if (!cancelled) {
          const list = Array.isArray(res.data) ? res.data : (res.data?.users || []);
          setUsers(list.slice(0, 5));
        }
      })
      .catch(() => { /* fail silently — section just stays hidden */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleFollow = async (user) => {
    const id = user._id;
    setFollowing((prev) => ({ ...prev, [id]: 'loading' }));
    try {
      await api.post(`/follow/${id}`);
      setFollowing((prev) => ({ ...prev, [id]: 'done' }));
    } catch {
      setFollowing((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="sp-skeleton-list">
        {[1, 2, 3].map((i) => (
          <div className="sp-skeleton-row" key={i}>
            <div className="sp-skeleton-avatar" />
            <div className="sp-skeleton-lines">
              <div className="sp-skeleton-line" />
              <div className="sp-skeleton-line sp-skeleton-line-short" />
            </div>
            <div className="sp-skeleton-btn" />
          </div>
        ))}
      </div>
    );
  }

  if (!users.length) return null;

  return (
    <div className="suggested-people-list">
      {users.map((user) => {
        const state = following[user._id];
        return (
          <div className="suggested-user" key={user._id}>
            <div
              className="sp-user-left"
              onClick={() => navigate(`/profile/${user.username}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/profile/${user.username}`)}
            >
              <Avatar user={user} size={38} />
              <div className="user-info">
                <div className="sp-name">{user.displayName || user.username}</div>
                <div className="sp-username">@{user.username}</div>
              </div>
            </div>

            <button
              className={`follow-btn${state === 'done' ? ' follow-btn--done' : ''}`}
              onClick={() => state !== 'done' && handleFollow(user)}
              disabled={state === 'loading'}
              aria-label={state === 'done' ? 'Following' : `Follow ${user.username}`}
            >
              {state === 'loading' ? '…' : state === 'done' ? 'Following' : 'Follow'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default SuggestedPeople;

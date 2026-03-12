/**
 * NewCommunities — Discovery Engine
 * Shows up to 4 recently created groups sorted by createdAt desc.
 * Join button wires to POST /api/groups/:slug/join.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import api from '../../utils/api';

function timeAgo(dateStr) {
  if (!dateStr) return 'Recently created';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Created today';
  if (days === 1) return 'Created yesterday';
  if (days < 7) return `Created ${days} days ago`;
  if (days < 30) return `Created ${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
  return 'Created recently';
}

function JoinButton({ group }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle');

  const handleJoin = async (e) => {
    e.stopPropagation();
    if (status !== 'idle') return;
    setStatus('loading');
    try {
      const res = await api.post(`/groups/${group.slug}/join`);
      const { isMember, isPending } = res.data;
      setStatus(isMember ? 'joined' : isPending ? 'pending' : 'joined');
    } catch {
      setStatus('idle');
    }
  };

  if (status === 'joined') {
    return (
      <button
        className="disc-join-btn disc-join-btn--done"
        onClick={(e) => { e.stopPropagation(); navigate(`/groups/${group.slug}`); }}
      >
        View
      </button>
    );
  }
  if (status === 'pending') {
    return <button className="disc-join-btn disc-join-btn--pending" disabled>Requested</button>;
  }

  return (
    <button
      className="disc-join-btn"
      onClick={handleJoin}
      disabled={status === 'loading'}
      aria-label={`Join ${group.name}`}
    >
      {status === 'loading' ? '…' : 'Join'}
    </button>
  );
}

function NewCommunities({ groups = [], loading }) {
  const navigate = useNavigate();

  const sorted = [...groups]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);

  if (loading) {
    return (
      <div className="discovery-section">
        <h3 className="discovery-section-title">
          <Sparkles size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />
          New Communities
        </h3>
        <div className="disc-skeleton-list">
          {[1, 2].map((i) => (
            <div className="disc-skeleton-card" key={i}>
              <div className="disc-skeleton-lines" style={{ flex: 1 }}>
                <div className="disc-skeleton-line" />
                <div className="disc-skeleton-line disc-skeleton-line-short" />
              </div>
              <div className="disc-skeleton-btn" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!sorted.length) return null;

  return (
    <div className="discovery-section">
      <h3 className="discovery-section-title">
        <Sparkles size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />
        New Communities
      </h3>
      {sorted.map((group) => (
        <div
          key={group._id}
          className="community-card"
          onClick={() => navigate(`/groups/${group.slug}`)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate(`/groups/${group.slug}`)}
          aria-label={`${group.name} — new community`}
        >
          <div className="community-info" style={{ flex: 1 }}>
            <div className="community-name">{group.name}</div>
            <div className="community-meta">{timeAgo(group.createdAt)}</div>
          </div>
          <JoinButton group={group} />
        </div>
      ))}
    </div>
  );
}

export default NewCommunities;

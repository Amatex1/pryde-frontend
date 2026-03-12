/**
 * PopularCommunities — Discovery Engine
 *
 * Fetches personalised recommendations from GET /api/groups/recommended.
 * Falls back to sorting the `groups` prop by member count if the
 * recommendation endpoint is unavailable or returns nothing.
 *
 * Join button wires to POST /api/groups/:slug/join.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Sparkles } from 'lucide-react';
import api from '../../utils/api';

const ICONS = ['🌟', '🎨', '🎵', '📷', '✈️', '🏋️', '💻', '🎮', '📚', '🌿'];

function getMemberCount(group) {
  if (typeof group.memberCount === 'number') return group.memberCount;
  return (group.members?.length || 0) + (group.moderators?.length || 0) + 1;
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

function SkeletonCards() {
  return (
    <div className="disc-skeleton-list">
      {[1, 2, 3].map((i) => (
        <div className="disc-skeleton-card" key={i}>
          <div className="disc-skeleton-icon" />
          <div className="disc-skeleton-lines">
            <div className="disc-skeleton-line" />
            <div className="disc-skeleton-line disc-skeleton-line-short" />
          </div>
          <div className="disc-skeleton-btn" />
        </div>
      ))}
    </div>
  );
}

function PopularCommunities({ groups: propGroups = [], loading: propLoading }) {
  const navigate = useNavigate();

  // Try to fetch personalised recommendations; fall back to prop-based list
  const [recGroups,   setRecGroups]   = useState(null);   // null = not yet loaded
  const [recLoading,  setRecLoading]  = useState(true);
  const [isPersonalised, setIsPersonalised] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.get('/groups/recommended')
      .then((res) => {
        if (!cancelled) {
          const list = (res.data?.groups || []).map((item) =>
            // Recommendation endpoint wraps each entry as { group, score, signals }
            item.group ? { ...item.group, _recScore: item.score } : item
          );
          if (list.length) {
            setRecGroups(list);
            setIsPersonalised(true);
          } else {
            setRecGroups([]); // trigger fallback
          }
        }
      })
      .catch(() => { if (!cancelled) setRecGroups([]); }) // trigger fallback
      .finally(() => { if (!cancelled) setRecLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // While recommendations are loading, show skeleton
  const isLoading = recLoading || propLoading;
  if (isLoading) {
    return (
      <div className="discovery-section">
        <h3 className="discovery-section-title">Suggested Communities</h3>
        <SkeletonCards />
      </div>
    );
  }

  // Choose source: personalised recs if available, otherwise sort prop by member count
  let displayGroups;
  if (recGroups && recGroups.length > 0) {
    displayGroups = recGroups.slice(0, 6);
  } else {
    displayGroups = [...propGroups]
      .sort((a, b) => getMemberCount(b) - getMemberCount(a))
      .slice(0, 6);
  }

  if (!displayGroups.length) return null;

  const title = isPersonalised ? 'Suggested for You' : 'Popular Communities';

  return (
    <div className="discovery-section">
      <h3 className="discovery-section-title">
        {isPersonalised && (
          <Sparkles size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />
        )}
        {title}
      </h3>

      {displayGroups.map((group, i) => {
        const count = getMemberCount(group);
        return (
          <div
            key={group._id}
            className="community-card"
            onClick={() => navigate(`/groups/${group.slug}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(`/groups/${group.slug}`)}
            aria-label={`${group.name} — ${count} members`}
          >
            <div className="community-icon" aria-hidden="true">
              {ICONS[i % ICONS.length]}
            </div>
            <div className="community-info">
              <div className="community-name">{group.name}</div>
              <div className="community-meta">
                <Users size={11} strokeWidth={2} />
                {count.toLocaleString()} {count === 1 ? 'member' : 'members'}
              </div>
            </div>
            <JoinButton group={group} />
          </div>
        );
      })}
    </div>
  );
}

export default PopularCommunities;

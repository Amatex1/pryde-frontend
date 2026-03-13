/**
 * CommunitySignalCard
 *
 * Renders a lightweight, non-interactive feed card for community activity signals.
 * These cards appear between regular posts to surface real platform activity.
 *
 * Supported signal types:
 *   new_member         — "👋 {displayName} joined Pryde"
 *   conversation_heating — "💬 Conversation heating up in {threadTitle}"
 *   active_journal     — "🌿 Active journaling thread"
 *   group_discussion   — "☕ Discussion started in {groupName}"
 *   reply_spike        — "🔥 {replyCount} replies in the last hour"
 */

const SIGNAL_CONFIG = {
  new_member: {
    icon: '👋',
    label: (data) => `${data.displayName || data.username || 'Someone'} just joined Pryde`,
  },
  conversation_heating: {
    icon: '💬',
    label: (data) => `Conversation heating up${data.threadTitle ? ` in ${data.threadTitle}` : ''}`,
  },
  active_journal: {
    icon: '🌿',
    label: () => 'Active journaling thread',
  },
  group_discussion: {
    icon: '☕',
    label: (data) => `Discussion started in ${data.groupName || 'a group'}`,
  },
  reply_spike: {
    icon: '🔥',
    label: (data) => `${data.replyCount || 'Many'} replies in the last hour`,
  },
};

export default function CommunitySignalCard({ signal }) {
  const config = SIGNAL_CONFIG[signal.signalType];

  if (!config) return null;

  const data = signal.signalData || {};

  return (
    <div className="community-signal-card" aria-label="Community activity">
      <span className="community-signal-icon" aria-hidden="true">
        {config.icon}
      </span>
      <span className="community-signal-label">
        {config.label(data)}
      </span>
    </div>
  );
}

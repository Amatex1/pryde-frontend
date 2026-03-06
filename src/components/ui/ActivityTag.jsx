/**
 * ActivityTag - Component for calm feed activity badges
 * 
 * Displays gentle activity indicators for posts:
 * - 🌿 Active conversation (3+ comments in last 6 hours)
 * - ☕ Ongoing discussion (5+ comments over time)
 * - 👋 New member (account < 7 days)
 * - 💬 Community moment (active older posts)
 */

import './ActivityTag.css';

/**
 * ActivityTag Component
 * @param {string} type - Activity type: 'active', 'discussion', 'newMember', 'communityMoment'
 * @param {string} className - Additional CSS classes
 */
export function ActivityTag({ type, className = '' }) {
  if (!type) return null;

  const tagConfig = {
    active: {
      icon: '🌿',
      label: 'Active conversation',
      className: 'activity-tag-active'
    },
    discussion: {
      icon: '☕',
      label: 'Ongoing discussion',
      className: 'activity-tag-discussion'
    },
    newMember: {
      icon: '👋',
      label: 'New member',
      className: 'activity-tag-new-member'
    },
    communityMoment: {
      icon: '💬',
      label: 'Community moment',
      className: 'activity-tag-community'
    }
  };

  const config = tagConfig[type];
  if (!config) return null;

  return (
    <span className={`activity-tag ${config.className} ${className}`}>
      <span className="activity-tag-icon" aria-hidden="true">
        {config.icon}
      </span>
      <span className="activity-tag-label">{config.label}</span>
    </span>
  );
}

/**
 * ActivityTagList - Component for multiple activity tags
 * @param {array} tags - Array of activity types
 * @param {string} className - Additional CSS classes
 */
export function ActivityTagList({ tags, className = '' }) {
  if (!tags || tags.length === 0) return null;

  // Only show first tag to keep it calm
  const primaryTag = tags[0];

  return (
    <div className={`activity-tag-list ${className}`}>
      <ActivityTag type={primaryTag} />
    </div>
  );
}

export default ActivityTag;

/**
 * ActiveMembersList
 * 
 * Shows currently active members in the community.
 * Uses real-time online status from Socket.IO.
 */

import { memo } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import OptimizedImage from './OptimizedImage';
import { getImageUrl } from '../utils/imageUrl';
import './ActiveMembersList.css';

const ActiveMembersList = memo(function ActiveMembersList({
  members = [],
  maxDisplay = 5,
  showCount = true,
  onMemberClick,
}) {
  const displayMembers = members.slice(0, maxDisplay);
  const remainingCount = members.length - maxDisplay;

  if (members.length === 0) {
    return (
      <div className="active-members-list">
        <div className="active-members-header">
          <span className="active-members-icon">🌿</span>
          <span className="active-members-title">Active now</span>
        </div>
        <p className="active-members-empty">
          No members active right now
        </p>
      </div>
    );
  }

  return (
    <div className="active-members-list">
      <div className="active-members-header">
        <span className="active-members-icon">🌿</span>
        <span className="active-members-title">Active now</span>
        {showCount && members.length > 0 && (
          <span className="active-members-count">
            {members.length} online
          </span>
        )}
      </div>

      <div className="active-members-avatars">
        {displayMembers.map((member, index) => (
          <Link
            key={member._id || member.id || index}
            to={`/profile/${member.username}`}
            className="active-member-link"
            onClick={onMemberClick}
            title={`${member.displayName || member.username} is active`}
            style={{ 
              zIndex: displayMembers.length - index,
              '--member-index': index 
            }}
          >
            {member.profilePhoto ? (
              <OptimizedImage
                src={getImageUrl(member.profilePhoto)}
                alt={member.username}
                className="active-member-avatar"
                imageSize="avatar"
              />
            ) : (
              <div className="active-member-avatar-fallback">
                {(member.displayName || member.username || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <span className="active-member-status" />
          </Link>
        ))}

        {remainingCount > 0 && (
          <div 
            className="active-members-more"
            title={`${remainingCount} more online`}
          >
            +{remainingCount}
          </div>
        )}
      </div>

      {displayMembers.length > 0 && (
        <div className="active-members-names">
          {displayMembers.slice(0, 3).map((member, index) => (
            <span key={member._id || member.id || index} className="active-member-name">
              {index > 0 && (index === displayMembers.slice(0, 3).length - 1 ? ' and ' : ', ')}
              <Link to={`/profile/${member.username}`}>
                {member.displayName || member.username}
              </Link>
            </span>
          ))}
          {displayMembers.length > 3 && (
            <span className="active-members-others">
              {' '}and {remainingCount + displayMembers.length - 3} others
            </span>
          )}
        </div>
      )}
    </div>
  );
});

ActiveMembersList.propTypes = {
  members: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      id: PropTypes.string,
      username: PropTypes.string.isRequired,
      displayName: PropTypes.string,
      profilePhoto: PropTypes.string,
    })
  ),
  maxDisplay: PropTypes.number,
  showCount: PropTypes.bool,
  onMemberClick: PropTypes.func,
};

export default ActiveMembersList;


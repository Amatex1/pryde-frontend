import OptimizedImage from '../OptimizedImage';
import { getImageUrl } from '../../utils/imageUrl';
import { getDisplayName } from '../../utils/getDisplayName';

export default function FeedPrivacyModal({
  isOpen,
  friends,
  hiddenFromUsers,
  onHiddenUsersChange,
  onClose,
}) {
  if (!isOpen) {
    return null;
  }

  const handleFriendToggle = (friendId, checked) => {
    if (checked) {
      onHiddenUsersChange(
        hiddenFromUsers.includes(friendId)
          ? hiddenFromUsers
          : [...hiddenFromUsers, friendId]
      );
      return;
    }

    onHiddenUsersChange(hiddenFromUsers.filter((id) => id !== friendId));
  };

  const handleClearAll = () => {
    onHiddenUsersChange([]);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} aria-hidden="true">
      <div
        className="modal-content privacy-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Custom Privacy Settings"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onClose();
          }
        }}
      >
        <div className="modal-header">
          <h2>Custom Privacy Settings</h2>
          <button className="btn-close" onClick={onClose} type="button">×</button>
        </div>

        <div className="privacy-modal-body">
          <div className="privacy-section">
            <h3>Hide from specific friends</h3>
            <p className="privacy-description">Select friends who won't see this post</p>
            <div className="friends-checklist">
              {friends.map((friend) => (
                <label key={friend._id} className="friend-checkbox-item">
                  <input
                    id={`hide-from-${friend._id}`}
                    name={`hideFrom-${friend._id}`}
                    type="checkbox"
                    checked={hiddenFromUsers.includes(friend._id)}
                    onChange={(e) => handleFriendToggle(friend._id, e.target.checked)}
                  />
                  <div className="friend-info">
                    <div className="friend-avatar-small">
                      {friend.profilePhoto ? (
                        <OptimizedImage
                          src={getImageUrl(friend.profilePhoto)}
                          alt={getDisplayName(friend)}
                          className="avatar-image"
                          imageSize="avatar"
                        />
                      ) : (
                        <span>{getDisplayName(friend).charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span>{getDisplayName(friend)}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={handleClearAll} type="button">
            Clear All
          </button>
          <button className="btn-primary glossy-gold" onClick={onClose} type="button">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
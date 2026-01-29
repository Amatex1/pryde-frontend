/**
 * InfoPanel — User/Group Info Sidebar
 * Extracted from: src/pages/Messages.jsx lines 2362-2392
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../../../utils/imageUrl';
import { getDisplayName, getDisplayNameInitial } from '../../../utils/getDisplayName';
import SharedMedia from './SharedMedia';

export default function InfoPanel({
  selectedChat,
  selectedUser,
  selectedGroup,
  selectedChatType,
  onlineUsers,
  currentUserId,
  onBlockUser,
  onReportUser,
  isOpen,
  onClose,
}) {
  const navigate = useNavigate();
  const isSelfChat = selectedUser?._id === currentUserId;

  const handleViewProfile = () => {
    if (selectedUser?.username) {
      navigate(`/profile/${selectedUser.username}`);
    }
  };

  const isOnline = onlineUsers.includes(selectedChat);

  return (
    <aside className={`messages-app__info ${isOpen ? 'mobile-open' : ''}`}>
      {selectedChat && selectedUser ? (
        <>
          {/* Mobile close button */}
          <button className="info-close-btn" onClick={onClose} aria-label="Close info panel">
            ✕
          </button>
          <div className="info-header">
            <div className="info-avatar">
              {selectedUser?.profilePhoto ? (
                <img src={getImageUrl(selectedUser.profilePhoto)} alt={getDisplayName(selectedUser)} />
              ) : (
                <span>{getDisplayNameInitial(selectedUser)}</span>
              )}
              {/* Status dot on avatar */}
              <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
            </div>
            <h3 className="info-name">{getDisplayName(selectedUser)}</h3>
            {selectedUser?.username && <p className="info-username">@{selectedUser.username}</p>}
          </div>
          {selectedUser?.bio && (
            <div className="info-bio"><p>{selectedUser.bio}</p></div>
          )}

          {/* Action Buttons */}
          {!isSelfChat && !selectedUser?.isDeleted && (
            <div className="info-actions">
              <button
                type="button"
                className="info-action-btn"
                onClick={handleViewProfile}
              >
                👤 View Profile
              </button>
              <button
                type="button"
                className="info-action-btn info-action-btn--danger"
                onClick={() => onBlockUser?.(selectedChat)}
              >
                🚫 Block User
              </button>
              <button
                type="button"
                className="info-action-btn info-action-btn--danger"
                onClick={() => onReportUser?.(selectedUser?._id)}
              >
                🚩 Report User
              </button>
            </div>
          )}

          {/* Shared Media Section */}
          <SharedMedia userId={selectedChat} />
        </>
      ) : (
        <div className="info-empty-state" />
      )}
    </aside>
  );
}


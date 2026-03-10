/**
 * InfoPanel — User/Group Info Sidebar
 * Extracted from: src/pages/Messages.jsx lines 2362-2392
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, User, Ban, Flag, Users } from 'lucide-react';
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
  const isGroupChat = selectedChatType === 'group';
  const hasSelection = Boolean(selectedChat) && (isGroupChat ? Boolean(selectedGroup) : Boolean(selectedUser));
  const isSelfChat = selectedUser?._id === currentUserId;

  const handleViewProfile = () => {
    if (selectedUser?.username) {
      navigate(`/profile/${selectedUser.username}`);
    }
  };

  const isOnline = !isGroupChat && onlineUsers.includes(selectedChat);
  const groupDescription = selectedGroup?.description || selectedGroup?.bio;
  const groupMemberCount = selectedGroup?.members?.length || 0;

  return (
    <aside className={`messages-app__info ${isOpen ? 'is-open' : ''}`}>
      {hasSelection ? (
        <>
          <button className="info-close-btn" onClick={onClose} aria-label="Close info panel">
            <X size={22} strokeWidth={2} aria-hidden="true" />
          </button>
          <div className="info-header">
            <div className={`info-avatar ${isGroupChat ? 'info-avatar--group' : ''}`}>
              {isGroupChat ? (
                <span>{selectedGroup?.name?.charAt(0)?.toUpperCase() || 'G'}</span>
              ) : selectedUser?.profilePhoto ? (
                <img src={getImageUrl(selectedUser.profilePhoto)} alt={getDisplayName(selectedUser)} />
              ) : (
                <span>{getDisplayNameInitial(selectedUser)}</span>
              )}
              {!isGroupChat && !isSelfChat && <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>}
            </div>
            <h3 className="info-name">{isGroupChat ? (selectedGroup?.name || 'Group Chat') : getDisplayName(selectedUser)}</h3>
            {isGroupChat ? (
              <p className="info-username">{groupMemberCount > 0 ? `${groupMemberCount} member${groupMemberCount === 1 ? '' : 's'}` : 'Group chat'}</p>
            ) : selectedUser?.username ? (
              <p className="info-username">@{selectedUser.username}</p>
            ) : null}
          </div>
          {(groupDescription || selectedUser?.bio) && (
            <div className="info-bio"><p>{isGroupChat ? groupDescription : selectedUser.bio}</p></div>
          )}

          {isGroupChat ? (
            <div className="info-stat-grid">
              <div className="info-stat-card">
                <span className="info-stat-label">Type</span>
                <span className="info-stat-value">Group chat</span>
              </div>
              <div className="info-stat-card">
                <span className="info-stat-label">Members</span>
                <span className="info-stat-value">{groupMemberCount || '—'}</span>
              </div>
            </div>
          ) : !isSelfChat && !selectedUser?.isDeleted && (
            <div className="info-actions">
              <button
                type="button"
                className="info-action-btn"
                onClick={handleViewProfile}
              >
                <User size={14} strokeWidth={1.75} aria-hidden="true" /> View Profile
              </button>
              <button
                type="button"
                className="info-action-btn info-action-btn--danger"
                onClick={() => onBlockUser?.(selectedChat)}
              >
                <Ban size={14} strokeWidth={1.75} aria-hidden="true" /> Block User
              </button>
              <button
                type="button"
                className="info-action-btn info-action-btn--danger"
                onClick={() => onReportUser?.(selectedUser?._id)}
              >
                <Flag size={14} strokeWidth={1.75} aria-hidden="true" /> Report User
              </button>
            </div>
          )}

          {isGroupChat ? (
            <div className="info-detail-card info-detail-card--group">
              <div className="info-detail-title"><Users size={16} strokeWidth={1.75} aria-hidden="true" /> Group details</div>
              <div className="info-detail-text">Member management and shared media for groups can stay lightweight in Phase 1 while the drawer remains useful and non-empty.</div>
            </div>
          ) : (
            <SharedMedia userId={selectedChat} />
          )}
        </>
      ) : (
        <div className="info-empty-state">Select a conversation to view details.</div>
      )}
    </aside>
  );
}


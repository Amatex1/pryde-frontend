/**
 * InfoPanel — User/Group Info Sidebar
 * Extracted from: src/pages/Messages.jsx lines 2362-2392
 */

import React from 'react';
import { getImageUrl } from '../../../utils/imageUrl';
import { getDisplayName, getDisplayNameInitial } from '../../../utils/getDisplayName';

export default function InfoPanel({
  selectedChat,
  selectedUser,
  selectedGroup,
  selectedChatType,
  onlineUsers,
}) {
  return (
    <aside className="messages-app__info">
      {selectedChat && selectedUser ? (
        <>
          <div className="info-header">
            <div className="info-avatar">
              {selectedUser?.profilePhoto ? (
                <img src={getImageUrl(selectedUser.profilePhoto)} alt={getDisplayName(selectedUser)} />
              ) : (
                <span>{getDisplayNameInitial(selectedUser)}</span>
              )}
            </div>
            <h3 className="info-name">{getDisplayName(selectedUser)}</h3>
            {selectedUser?.username && <p className="info-username">@{selectedUser.username}</p>}
          </div>
          <div className="info-status">
            <span className={`status-dot ${onlineUsers.includes(selectedChat) ? 'online' : 'offline'}`}></span>
            {onlineUsers.includes(selectedChat) ? 'Online' : 'Offline'}
          </div>
          {selectedUser?.bio && (
            <div className="info-bio"><p>{selectedUser.bio}</p></div>
          )}
        </>
      ) : (
        <div className="info-empty-state" />
      )}
    </aside>
  );
}


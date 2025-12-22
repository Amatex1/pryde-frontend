import React from 'react';

const NotificationBell = () => {
  // NOTE: Push notification subscription is now handled in Settings page
  // where users can explicitly enable/disable notifications with a user gesture.
  // This prevents browser console violations about requesting permission
  // without user interaction.

  return (
    <div className="notification-bell">
      <i className="fas fa-bell"></i>
    </div>
  );
};

export default NotificationBell;

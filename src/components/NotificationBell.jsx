import React, { useEffect } from 'react';
import { subscribeToPushNotifications, unsubscribeFromPushNotifications } from '../utils/pushNotifications';

const NotificationBell = () => {
  useEffect(() => {
    const registerForPushNotifications = async () => {
      try {
        await subscribeToPushNotifications();
      } catch (error) {
        console.error('Error registering for push notifications:', error);
      }
    };

    const unregisterFromPushNotifications = async () => {
      try {
        await unsubscribeFromPushNotifications();
      } catch (error) {
        console.error('Error unregistering from push notifications:', error);
      }
    };

    registerForPushNotifications();

    return () => {
      unregisterFromPushNotifications();
    };
  }, []);

  return (
    <div className="notification-bell">
      <i className="fas fa-bell"></i>
    </div>
  );
};

export default NotificationBell;

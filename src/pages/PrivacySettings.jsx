import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useToast } from '../hooks/useToast';
import './PrivacySettings.css';

const PrivacySettings = () => {
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    whoCanMessage: 'followers',
    quietModeEnabled: false,
    blockedUsers: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    fetchPrivacySettings();
    fetchBlockedUsers();
  }, []);

  const fetchPrivacySettings = async () => {
    try {
      const response = await api.get('/privacy/settings');
      setPrivacySettings(response.data);
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
      showToast('Failed to load privacy settings', 'error');
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      const response = await api.get('/privacy/blocked-users');
      setPrivacySettings(prev => ({
        ...prev,
        blockedUsers: response.data.blockedUsers || []
      }));
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    }
  };

  const updatePrivacySetting = async (key, value) => {
    try {
      await api.patch('/privacy/settings', { [key]: value });
      setPrivacySettings(prev => ({ ...prev, [key]: value }));
      showToast(`${key} updated successfully`, 'success');
    } catch (error) {
      console.error(`Error updating ${key}:`, error);
      showToast(`Failed to update ${key}`, 'error');
    }
  };

  const searchUsers = async () => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await api.get('/users/search', {
        params: { q: searchQuery, excludeBlocked: true }
      });
      setSearchResults(response.data.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
      showToast('Failed to search users', 'error');
    }
  };

  const blockUser = async (userId) => {
    try {
      await api.post('/privacy/block', { userId });
      fetchBlockedUsers();
      showToast('User blocked successfully', 'success');
    } catch (error) {
      console.error('Error blocking user:', error);
      showToast('Failed to block user', 'error');
    }
  };

  const unblockUser = async (userId) => {
    try {
      await api.delete(`/privacy/block/${userId}`);
      fetchBlockedUsers();
      showToast('User unblocked successfully', 'success');
    } catch (error) {
      console.error('Error unblocking user:', error);
      showToast('Failed to unblock user', 'error');
    }
  };

  return (
    <div className="privacy-settings-container">
      <h1>Privacy & Security</h1>

      <section className="privacy-section">
        <h2>Profile Visibility</h2>
        <div className="setting-group">
          <label>
            <input
              type="radio"
              name="profileVisibility"
              value="public"
              checked={privacySettings.profileVisibility === 'public'}
              onChange={() => updatePrivacySetting('profileVisibility', 'public')}
            />
            Public (Anyone can view)
          </label>
          <label>
            <input
              type="radio"
              name="profileVisibility"
              value="followers"
              checked={privacySettings.profileVisibility === 'followers'}
              onChange={() => updatePrivacySetting('profileVisibility', 'followers')}
            />
            Followers Only
          </label>
        </div>
      </section>

      <section className="privacy-section">
        <h2>Messaging</h2>
        <div className="setting-group">
          <label>
            <input
              type="radio"
              name="whoCanMessage"
              value="everyone"
              checked={privacySettings.whoCanMessage === 'everyone'}
              onChange={() => updatePrivacySetting('whoCanMessage', 'everyone')}
            />
            Everyone
          </label>
          <label>
            <input
              type="radio"
              name="whoCanMessage"
              value="followers"
              checked={privacySettings.whoCanMessage === 'followers'}
              onChange={() => updatePrivacySetting('whoCanMessage', 'followers')}
            />
            Followers Only
          </label>
          <label>
            <input
              type="radio"
              name="whoCanMessage"
              value="no-one"
              checked={privacySettings.whoCanMessage === 'no-one'}
              onChange={() => updatePrivacySetting('whoCanMessage', 'no-one')}
            />
            No One
          </label>
        </div>
      </section>

      <section className="privacy-section">
        <h2>Quiet Mode</h2>
        <div className="setting-group">
          <label>
            <input
              type="checkbox"
              checked={privacySettings.quietModeEnabled}
              onChange={(e) => updatePrivacySetting('quietModeEnabled', e.target.checked)}
            />
            Enable Quiet Mode (Suppress non-critical notifications)
          </label>
        </div>
      </section>

      <section className="privacy-section">
        <h2>Blocked Users</h2>
        <div className="blocked-users-search">
          <input
            type="text"
            placeholder="Search users to block"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchUsers();
            }}
          />
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map(user => (
                <div key={user._id} className="search-result-item">
                  <img 
                    src={user.profilePhoto || '/default-avatar.png'} 
                    alt={user.username} 
                    className="user-avatar"
                  />
                  <div className="user-info">
                    <span className="user-name">{user.displayName}</span>
                    <span className="user-username">@{user.username}</span>
                  </div>
                  <button onClick={() => blockUser(user._id)}>Block</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="blocked-users-list">
          <h3>Currently Blocked Users</h3>
          {privacySettings.blockedUsers.length === 0 ? (
            <p>No users blocked</p>
          ) : (
            privacySettings.blockedUsers.map(user => (
              <div key={user._id} className="blocked-user-item">
                <img 
                  src={user.profilePhoto || '/default-avatar.png'} 
                  alt={user.username} 
                  className="user-avatar"
                />
                <div className="user-info">
                  <span className="user-name">{user.displayName}</span>
                  <span className="user-username">@{user.username}</span>
                </div>
                <button onClick={() => unblockUser(user._id)}>Unblock</button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default PrivacySettings;

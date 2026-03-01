import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from '../hooks/useToast';
import { isHighRiskCountry } from '../utils/geolocation';
import './PrivacySettings.css';

const ToggleRow = ({ label, desc, checked, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border-subtle)' }}>
    <div style={{ flex: 1, marginRight: '16px' }}>
      <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>{label}</span>
      <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0', lineHeight: 1.4 }}>{desc}</p>
    </div>
    <label className="toggle-switch" style={{ flexShrink: 0 }}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="toggle-slider"></span>
    </label>
  </div>
);

const PrivacySettings = () => {
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    whoCanMessage: 'followers',
    blockedUsers: []
  });
  const [safety, setSafety] = useState({
    showRealName: true,
    allowAnonymousPosts: true,
    hideProfileFromSearch: false,
    hideOnlineStatus: false,
    friendOnlyProfile: false,
    showBadgesPublicly: true,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isHighRisk, setIsHighRisk] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchPrivacySettings();
    fetchBlockedUsers();
    fetchSafetySettings();
    const country = localStorage.getItem('userCountry');
    if (country && isHighRiskCountry(country)) setIsHighRisk(true);
  }, []);

  const fetchPrivacySettings = async () => {
    try {
      const response = await api.get('/privacy/settings');
      setPrivacySettings(prev => ({
        ...prev,
        ...response.data,
        blockedUsers: response.data.blockedUsers ?? prev.blockedUsers
      }));
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
      showToast('Failed to load privacy settings', 'error');
    }
  };

  const fetchSafetySettings = async () => {
    try {
      const response = await api.get('/privacy/safety');
      setSafety(prev => ({ ...prev, ...response.data }));
    } catch {
      showToast('Failed to load safety settings', 'error');
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

  const updateSafetySetting = async (key, value) => {
    const prev = safety[key];
    setSafety(s => ({ ...s, [key]: value }));
    try {
      await api.patch('/privacy/safety', { [key]: value });
      showToast('Setting updated', 'success');
    } catch {
      setSafety(s => ({ ...s, [key]: prev }));
      showToast('Failed to update setting', 'error');
    }
  };

  const searchUsers = async (query) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await api.get('/users/search', {
        params: { q: query, excludeBlocked: true }
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
      <h1>Privacy & Safety</h1>

      {isHighRisk && (
        <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#4338ca' }}>
          <span style={{ fontSize: '18px' }}>🌍</span>
          <span>Based on your region, you may want to review your privacy settings for additional protection.</span>
        </div>
      )}

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
        <h2>Identity Visibility</h2>
        <ToggleRow
          label="Show Real Name"
          desc="Display your real name on your profile. If off, only your username is shown."
          checked={safety.showRealName}
          onChange={(e) => updateSafetySetting('showRealName', e.target.checked)}
        />
        <ToggleRow
          label="Allow Anonymous Posting"
          desc="Post and reply anonymously. Staff can always see the real author."
          checked={safety.allowAnonymousPosts}
          onChange={(e) => updateSafetySetting('allowAnonymousPosts', e.target.checked)}
        />
        <ToggleRow
          label="Show Badges Publicly"
          desc="Display your earned badges on your profile and posts."
          checked={safety.showBadgesPublicly}
          onChange={(e) => updateSafetySetting('showBadgesPublicly', e.target.checked)}
        />
      </section>

      <section className="privacy-section">
        <h2>Profile Exposure</h2>
        <ToggleRow
          label="Hide Profile from Search"
          desc="Prevent your profile from appearing in search results."
          checked={safety.hideProfileFromSearch}
          onChange={(e) => updateSafetySetting('hideProfileFromSearch', e.target.checked)}
        />
        <ToggleRow
          label="Friends-Only Profile"
          desc="Only approved connections can view your full profile."
          checked={safety.friendOnlyProfile}
          onChange={(e) => updateSafetySetting('friendOnlyProfile', e.target.checked)}
        />
        <ToggleRow
          label="Hide Online Status"
          desc="Others won't see when you're online."
          checked={safety.hideOnlineStatus}
          onChange={(e) => updateSafetySetting('hideOnlineStatus', e.target.checked)}
        />
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
              searchUsers(e.target.value);
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
          {(privacySettings.blockedUsers ?? []).length === 0 ? (
            <p>No users blocked</p>
          ) : (
            (privacySettings.blockedUsers ?? []).map(user => (
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

      {/* Phase 6B: Trust & Safety Link */}
      <section className="privacy-section privacy-link-card trust-safety-card">
        <div className="privacy-link-content">
          <div>
            <h2 style={{ margin: 0, marginBottom: '5px', fontSize: '1.2rem', color: 'var(--text-primary)' }}>🛡️ Trust & Safety</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>
              Learn how we keep Pryde safe, how reporting works, and what we can see
            </p>
          </div>
          <Link to="/trust-and-safety" className="privacy-link-button">
            Learn More →
          </Link>
        </div>
      </section>

      {/* Phase 7A: Platform Guarantees Link */}
      <section className="privacy-section privacy-link-card guarantees-card">
        <div className="privacy-link-content">
          <div>
            <h2 style={{ margin: 0, marginBottom: '5px', fontSize: '1.2rem', color: 'var(--text-primary)' }}>💜 Platform Guarantees</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>
              What Pryde promises — no algorithms, no data selling, and what we'll never do
            </p>
          </div>
          <Link to="/guarantees" className="privacy-link-button guarantees-button">
            Our Promises →
          </Link>
        </div>
      </section>
    </div>
  );
};

export default PrivacySettings;

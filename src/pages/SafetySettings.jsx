import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from '../hooks/useToast';
import './PrivacySettings.css'; // Reuse privacy settings styles

const SafetySettings = () => {
  const [safety, setSafety] = useState({
    showRealName: true,
    allowAnonymousPosts: true,
    hideProfileFromSearch: false,
    hideOnlineStatus: false,
    friendOnlyProfile: false,
    showBadgesPublicly: true,
  });
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchSafetySettings();
  }, []);

  const fetchSafetySettings = async () => {
    try {
      const response = await api.get('/privacy/safety');
      setSafety(prev => ({ ...prev, ...response.data }));
    } catch (error) {
      showToast('Failed to load safety settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key, value) => {
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

  if (loading) {
    return (
      <div className="privacy-settings-page">
        <div className="privacy-settings-container">
          <div className="loading">Loading safety settings...</div>
        </div>
      </div>
    );
  }

  const toggles = [
    { key: 'allowAnonymousPosts', label: '🕵️ Allow Anonymous Posting', desc: 'Let yourself post anonymously. Staff can always see the real author.' },
    { key: 'showRealName', label: '📛 Show Real Name', desc: 'Display your real name on your profile. If off, only your username is shown.' },
    { key: 'hideProfileFromSearch', label: '🔍 Hide Profile from Search', desc: 'Prevent your profile from appearing in search results.' },
    { key: 'hideOnlineStatus', label: '🟢 Hide Online Status', desc: 'Others won\'t see when you\'re online.' },
    { key: 'friendOnlyProfile', label: '🔒 Friends-Only Profile', desc: 'Only approved connections can view your full profile.' },
    { key: 'showBadgesPublicly', label: '🏅 Show Badges Publicly', desc: 'Display your earned badges on your profile and posts.' },
  ];

  return (
    <div className="privacy-settings-page">
      <div className="privacy-settings-container">
        <div className="privacy-header">
          <Link to="/settings" className="back-link">← Back to Settings</Link>
          <h1>🛡️ Safety & Privacy</h1>
          <p className="privacy-subtitle">
            Control how your identity and data are exposed on Pryde.
          </p>
        </div>

        <div className="privacy-section">
          <h2>Identity & Visibility</h2>
          {toggles.map(({ key, label, desc }) => (
            <div key={key} className="privacy-option" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, marginRight: '16px' }}>
                  <label style={{ fontWeight: 600, fontSize: '15px' }}>{label}</label>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0' }}>{desc}</p>
                </div>
                <label className="toggle-switch" style={{ flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    checked={safety[key]}
                    onChange={(e) => updateSetting(key, e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SafetySettings;


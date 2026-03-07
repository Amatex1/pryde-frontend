import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from '../hooks/useToast';
import { isHighRiskCountry } from '../utils/geolocation';
import TrustBadge from '../components/TrustBadge';
import { TRUST_LEVEL_COLORS, TRUST_LEVEL_DESCRIPTIONS } from '../constants/trustLevels';
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

const SectionCard = ({ icon, title, children }) => (
  <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
    <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span>{icon}</span> {title}
    </h2>
    <div>{children}</div>
  </div>
);

const SafetySettings = () => {
  const [safety, setSafety] = useState({
    showRealName: true,
    allowAnonymousPosts: true,
    hideProfileFromSearch: false,
    hideOnlineStatus: false,
    friendOnlyProfile: false,
    showBadgesPublicly: true,
    quietModeEnabled: false,
  });
  const [trustData, setTrustData] = useState({ trustScore: null, trustLevel: null });
  const [loading, setLoading] = useState(true);
  const [isHighRisk, setIsHighRisk] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchSafetySettings();
    fetchTrustLevel();
    const country = localStorage.getItem('userCountry');
    if (country && isHighRiskCountry(country)) setIsHighRisk(true);
  }, []);

  const fetchSafetySettings = async () => {
    try {
      const response = await api.get('/privacy/safety');
      setSafety(prev => ({ ...prev, ...response.data }));
    } catch {
      showToast('Failed to load safety settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrustLevel = async () => {
    try {
      const response = await api.get('/users/me/trust');
      setTrustData({
        trustScore: response.data.trustScore,
        trustLevel: response.data.trustLevel
      });
    } catch (error) {
      console.error('Failed to fetch trust level:', error);
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
        <div className="privacy-settings-container" style={{ maxWidth: '820px' }}>
          <div className="loading">Loading safety settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="privacy-settings-page">
      <div className="privacy-settings-container" style={{ maxWidth: '820px' }}>
        <div className="privacy-header">
          <Link to="/settings" className="back-link">← Back to Settings</Link>
          <h1>🛡️ Safety & Privacy</h1>
          <p className="privacy-subtitle">Control how your identity and data are exposed on Pryde.</p>
        </div>

        {isHighRisk && (
          <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#4338ca' }}>
            <span style={{ fontSize: '18px' }}>🌍</span>
            <span>Based on your region, you may want to review your privacy settings for additional protection.</span>
          </div>
        )}

        <SectionCard icon="👤" title="Identity Visibility">
          <ToggleRow label="Show Real Name" desc="Display your real name on your profile. If off, only your username is shown." checked={safety.showRealName} onChange={(e) => updateSetting('showRealName', e.target.checked)} />
          <ToggleRow label="Allow Anonymous Posting" desc="Post and reply anonymously. Staff can always see the real author." checked={safety.allowAnonymousPosts} onChange={(e) => updateSetting('allowAnonymousPosts', e.target.checked)} />
          <ToggleRow label="Show Badges Publicly" desc="Display your earned badges on your profile and posts." checked={safety.showBadgesPublicly} onChange={(e) => updateSetting('showBadgesPublicly', e.target.checked)} />
        </SectionCard>

        <SectionCard icon="🔒" title="Profile Exposure">
          <ToggleRow label="Hide Profile from Search" desc="Prevent your profile from appearing in search results." checked={safety.hideProfileFromSearch} onChange={(e) => updateSetting('hideProfileFromSearch', e.target.checked)} />
          <ToggleRow label="Friends-Only Profile" desc="Only approved connections can view your full profile." checked={safety.friendOnlyProfile} onChange={(e) => updateSetting('friendOnlyProfile', e.target.checked)} />
          <ToggleRow label="Hide Online Status" desc="Others won't see when you're online." checked={safety.hideOnlineStatus} onChange={(e) => updateSetting('hideOnlineStatus', e.target.checked)} />
        </SectionCard>

        <SectionCard icon="🤫" title="Expression Controls">
          <ToggleRow label="Quiet Mode" desc="Reduce social pressure — hide like counts and reaction details from your view." checked={safety.quietModeEnabled} onChange={(e) => updateSetting('quietModeEnabled', e.target.checked)} />
        </SectionCard>

        <SectionCard icon="🛡️" title="Trust & Safety">
          {trustData.trustScore !== null ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <TrustBadge trustLevel={trustData.trustLevel} showLabel={true} size="large" />
                <span style={{ fontSize: '24px', fontWeight: 700, color: TRUST_LEVEL_COLORS[trustData.trustLevel] }}>
                  {trustData.trustScore}
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px', lineHeight: 1.5 }}>
                {TRUST_LEVEL_DESCRIPTIONS[trustData.trustLevel]}
              </p>
              <div style={{ background: 'var(--bg-elevated)', borderRadius: '8px', padding: '12px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Factors that affect your trust level:
                </p>
                <ul style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, paddingLeft: '16px', lineHeight: 1.6 }}>
                  <li>Account age and verification</li>
                  <li>Positive community interactions</li>
                  <li>Following community guidelines</li>
                  <li>Profile completeness</li>
                </ul>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Loading trust level...
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
};

export default SafetySettings;


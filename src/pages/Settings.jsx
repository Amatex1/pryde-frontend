import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CustomModal from '../components/CustomModal';
import InviteManagement from '../components/InviteManagement'; // Phase 7B
import ProfileUrlSetting from '../components/ProfileUrlSetting'; // Custom profile URLs
import { useModal } from '../hooks/useModal';
import api from '../utils/api';
import { logout } from '../utils/auth';
import { setQuietMode, setQuietSubToggle, getQuietSubToggle, setCursorStyle, getCursorStyle, getCursorStyleOptions } from '../utils/themeManager';
import { useAuth } from '../context/AuthContext';
import logger from '../utils/logger';
import './Settings.css';

function Settings() {
  const { modalState, closeModal, showAlert, showConfirm, showPrompt } = useModal();
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useAuth(); // Use centralized auth context
  // Get menu handler from AppLayout outlet context
  const { onMenuOpen } = useOutletContext() || {};
  const [formData, setFormData] = useState({
    fullName: '',
    displayName: '',
    nickname: '',
    pronouns: '',
    customPronouns: '',
    gender: '',
    customGender: '',
    relationshipStatus: '',
    bio: '',
    location: '',
    website: '',
    socialLinks: []
  });
  const [loading, setLoading] = useState(true); // ✅ Start with loading state
  const [message, setMessage] = useState('');
  const [quietModeEnabled, setQuietModeEnabled] = useState(false); // PHASE 2: Quiet Mode
  // QUIET MODE V2: Sub-toggles for granular control
  const [quietVisuals, setQuietVisuals] = useState(true);
  const [quietWriting, setQuietWriting] = useState(true);
  const [quietMetrics, setQuietMetrics] = useState(false);
  // BADGE SYSTEM V1: Hide badges toggle
  const [hideBadges, setHideBadges] = useState(false);
  // CURSOR CUSTOMIZATION: Optional cursor styles
  const [cursorStyle, setCursorStyleState] = useState('system');
  // NOTE: Verification system removed 2025-12-26 (returns 410 Gone)
  // State and API calls removed to prevent 410 loops

  // ✅ Fetch data on mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  // ✅ Update form data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFormData({
        fullName: currentUser.fullName || '',
        displayName: currentUser.displayName || '',
        nickname: currentUser.nickname || '',
        pronouns: currentUser.pronouns || '',
        customPronouns: currentUser.customPronouns || '',
        gender: currentUser.gender || '',
        customGender: currentUser.customGender || '',
        relationshipStatus: currentUser.relationshipStatus || '',
        bio: currentUser.bio || '',
        location: currentUser.location || '',
        website: currentUser.website || '',
        socialLinks: currentUser.socialLinks || []
      });

      // PHASE 2: Load quiet mode settings
      const quietMode = currentUser.privacySettings?.quietModeEnabled || false;
      setQuietModeEnabled(quietMode);
      setQuietMode(quietMode);

      // QUIET MODE V2: Load sub-toggle settings from localStorage (with backend sync)
      const settings = currentUser.privacySettings || {};
      setQuietVisuals(settings.quietVisuals ?? getQuietSubToggle('visuals'));
      setQuietWriting(settings.quietWriting ?? getQuietSubToggle('writing'));
      setQuietMetrics(settings.quietMetrics ?? getQuietSubToggle('metrics'));
      // BADGE SYSTEM V1: Load hide badges setting
      setHideBadges(settings.hideBadges ?? false);
      // CURSOR CUSTOMIZATION: Load cursor style
      setCursorStyleState(settings.cursorStyle ?? getCursorStyle());
    }
  }, [currentUser]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      // Refresh user data from API (bypasses cache)
      await refreshUser();

      // NOTE: Verification status fetch removed 2025-12-26
      // The endpoint returns 410 Gone - feature intentionally removed
    } catch (error) {
      logger.error('Failed to fetch initial data:', error);
      setMessage('Failed to load settings. Please refresh the page.');
    } finally {
      // ✅ CRITICAL: Always set loading to false
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const addSocialLink = () => {
    setFormData({
      ...formData,
      socialLinks: [...formData.socialLinks, { platform: '', url: '' }]
    });
  };

  const removeSocialLink = (index) => {
    const newLinks = formData.socialLinks.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      socialLinks: newLinks
    });
  };

  const updateSocialLink = (index, field, value) => {
    const newLinks = [...formData.socialLinks];
    newLinks[index][field] = value;
    setFormData({
      ...formData,
      socialLinks: newLinks
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await api.put('/users/profile', formData);
      setCurrentUser({ ...currentUser, ...response.data });
      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage('Failed to update profile');
      logger.error('Update profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  // PHASE 2: Handle Quiet Mode toggle
  const handleQuietModeToggle = async () => {
    try {
      const newValue = !quietModeEnabled;
      await api.patch('/users/me/settings', { quietModeEnabled: newValue });
      setQuietModeEnabled(newValue);
      setMessage(newValue ? 'Quiet Mode enabled' : 'Quiet Mode disabled');
      setQuietMode(newValue);
    } catch (error) {
      logger.error('Failed to toggle quiet mode:', error);
      setMessage('Failed to update quiet mode');
    }
  };

  // QUIET MODE V2: Handle sub-toggle changes
  const handleQuietSubToggle = async (toggle, value) => {
    try {
      // Update local state immediately
      switch (toggle) {
        case 'visuals':
          setQuietVisuals(value);
          break;
        case 'writing':
          setQuietWriting(value);
          break;
        case 'metrics':
          setQuietMetrics(value);
          break;
      }

      // Apply to DOM via theme manager
      setQuietSubToggle(toggle, value);

      // Sync with backend
      const settingKey = `quiet${toggle.charAt(0).toUpperCase() + toggle.slice(1)}`;
      await api.patch('/users/me/settings', { [settingKey]: value });
    } catch (error) {
      logger.error(`Failed to toggle quiet ${toggle}:`, error);
      setMessage(`Failed to update ${toggle} setting`);
    }
  };

  // BADGE SYSTEM V1: Handle hide badges toggle
  const handleHideBadgesToggle = async () => {
    try {
      const newValue = !hideBadges;
      setHideBadges(newValue);
      await api.patch('/users/me/settings', { hideBadges: newValue });
      setMessage(newValue ? 'Badges hidden from your profile' : 'Badges visible on your profile');
    } catch (error) {
      logger.error('Failed to toggle hide badges:', error);
      setMessage('Failed to update badge visibility');
      // Revert on error
      setHideBadges(!hideBadges);
    }
  };

  // CURSOR CUSTOMIZATION: Handle cursor style change
  const handleCursorStyleChange = async (newStyle) => {
    const previousStyle = cursorStyle;
    try {
      // Update local state and apply to DOM immediately
      setCursorStyleState(newStyle);
      setCursorStyle(newStyle);

      // Sync with backend
      await api.patch('/users/me/settings', { cursorStyle: newStyle });
      setMessage(newStyle === 'system' ? 'Using system cursor' : `Cursor style: ${newStyle}`);
    } catch (error) {
      logger.error('Failed to update cursor style:', error);
      setMessage('Failed to update cursor style');
      // Revert on error
      setCursorStyleState(previousStyle);
      setCursorStyle(previousStyle);
    }
  };

  const handleDownloadData = async () => {
    try {
      setMessage('Preparing your data...');
      logger.debug('📥 Requesting data download...');

      // Debug: Check if token exists
      const token = localStorage.getItem('token');
      logger.debug('🔑 Token exists:', !!token);
      logger.debug('🔑 Token preview:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');

      const response = await api.get('/users/download-data');
      logger.debug('✅ Data received:', response.data);

      // Create a blob and download
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pryde-social-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage('Your data has been downloaded!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      logger.error('Download data error:', error);
      logger.error('Error response:', error.response?.data);
      logger.error('Error status:', error.response?.status);

      if (error.response?.status === 401) {
        setMessage('Authentication failed. Please log in again.');
      } else {
        setMessage(`Failed to download data: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleDeactivateAccount = async () => {
    const confirmed = await showConfirm(
      'Your profile will be hidden and you won\'t be able to use Pryde Social until you reactivate.\n\n' +
      'You can reactivate by logging in again.',
      'Deactivate Account?',
      'Deactivate',
      'Cancel'
    );

    if (!confirmed) return;

    try {
      await api.put('/users/deactivate');
      logout();
      navigate('/login');
      showAlert('Your account has been deactivated. You can reactivate by logging in again.', 'Account Deactivated');
    } catch (error) {
      logger.error('Deactivate account error:', error);
      setMessage('Failed to deactivate account');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await showConfirm(
      '⚠️ WARNING: This action is PERMANENT and CANNOT be undone!\n\n' +
      'This will permanently delete:\n' +
      '• Your profile and all personal information\n' +
      '• All your posts and comments\n' +
      '• All your messages\n' +
      '• All your friend connections\n' +
      '• Everything associated with your account\n\n' +
      'Type "DELETE" in the next prompt to confirm.',
      'Delete Account Permanently?',
      'Continue',
      'Cancel'
    );

    if (!confirmed) return;

    const confirmation = await showPrompt('Type DELETE to confirm account deletion:', 'Confirm Deletion', 'Type DELETE');

    if (confirmation !== 'DELETE') {
      showAlert('Account deletion cancelled. You must type DELETE exactly to confirm.', 'Cancelled');
      return;
    }

    try {
      await api.delete('/users/account');
      logout();
      navigate('/');
      showAlert('Your account has been permanently deleted.', 'Account Deleted');
    } catch (error) {
      logger.error('Delete account error:', error);
      setMessage('Failed to delete account');
    }
  };

  // NOTE: handleRequestVerification removed 2025-12-26
  // Verification request endpoint returns 410 Gone - feature intentionally removed

  // ✅ Show loading state
  if (loading) {
    return (
      <div className="page-container">
        <Navbar onMenuClick={onMenuOpen} />
        <div className="settings-container">
          <div className="settings-card glossy fade-in">
            <h1 className="settings-title text-shadow">⚙️ Settings</h1>
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Loading settings...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar onMenuClick={onMenuOpen} />

      <div className="settings-container">
        <div className="settings-card glossy fade-in">
          <h1 className="settings-title text-shadow">⚙️ Settings</h1>

          {message && (
            <div className={`message ${message.toLowerCase().includes('failed') || message.toLowerCase().includes('error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          {/* Security Settings Link */}
          <div className="settings-section security-settings-link">
            <div className="security-settings-content">
              <div className="security-settings-info">
                <h2 className="section-title">🔐 Security Settings</h2>
                <p className="security-settings-description">
                  Manage passkeys, 2FA, active sessions, and login alerts
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/settings/security')}
                className="btn-primary"
                style={{ whiteSpace: 'nowrap' }}
              >
                Manage Security →
              </button>
            </div>
          </div>

          {/* Privacy Settings Link */}
          <div className="settings-section" style={{ background: 'linear-gradient(135deg, #EDEAFF 0%, #F7F7F7 100%)', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 className="section-title" style={{ margin: 0, marginBottom: '5px' }}>🔒 Privacy Settings</h2>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>
                  Control who can see your profile, send messages, and more
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/settings/privacy')}
                className="btn-primary"
                style={{ whiteSpace: 'nowrap' }}
              >
                Manage Privacy →
              </button>
            </div>
          </div>

          {/* Basic Information moved to Edit Profile modal on Profile page */}

          {/* Custom Profile URL */}
          <div className="settings-section">
            <ProfileUrlSetting
              currentSlug={currentUser?.profileSlug}
              onUpdate={(newSlug) => {
                refreshUser();
              }}
            />
          </div>

          {/* NOTE: Verification Request Section removed 2025-12-26
              The verification system has been intentionally removed.
              Endpoint returns 410 Gone. */}

          {/* Phase 7B: Invite Management (Admin/Super Admin only) */}
          {currentUser && (currentUser.role === 'admin' || currentUser.role === 'super_admin') && (
            <div className="settings-section">
              <InviteManagement />
            </div>
          )}

          {/* PHASE 2: Quiet Mode + V2 Sub-toggles */}
          <div className="settings-section">
            <h2 className="section-title">🌿 Quiet Mode</h2>
            <p className="section-description">
              A peaceful browsing experience with softer colors and reduced distractions.
              Perfect for introverts, late-night users, and anyone who prefers a calmer space.
            </p>

            <div className="notification-settings">
              {/* Main Quiet Mode Toggle */}
              <div className="notification-item">
                <div className="notification-info">
                  <h3>Enable Quiet Mode</h3>
                  <p>Activate a calm, distraction-free experience across the app.</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    id="quiet-mode-toggle"
                    name="quietMode"
                    checked={quietModeEnabled}
                    onChange={handleQuietModeToggle}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {/* QUIET MODE V2: Sub-toggles (only visible when quiet mode is enabled) */}
              {quietModeEnabled && (
                <div className="quiet-mode-subtoggle-section">
                  <p className="subtoggle-header">Customize your quiet experience:</p>

                  {/* Calm Visuals Toggle */}
                  <div className="notification-item subtoggle">
                    <div className="notification-info">
                      <h3>🎨 Calm Visuals</h3>
                      <p>Reduce motion, soften colors, and minimize visual noise.</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        id="quiet-visuals-toggle"
                        name="quietVisuals"
                        checked={quietVisuals}
                        onChange={(e) => handleQuietSubToggle('visuals', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  {/* Writing Focus Toggle */}
                  <div className="notification-item subtoggle">
                    <div className="notification-info">
                      <h3>✍️ Writing Focus</h3>
                      <p>Distraction-free space for journaling and composing posts.</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        id="quiet-writing-toggle"
                        name="quietWriting"
                        checked={quietWriting}
                        onChange={(e) => handleQuietSubToggle('writing', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  {/* Hide Metrics Toggle */}
                  <div className="notification-item subtoggle">
                    <div className="notification-info">
                      <h3>📊 Hide Metrics</h3>
                      <p>Hide likes, reaction counts, and follower numbers to reduce comparison.</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        id="quiet-metrics-toggle"
                        name="quietMetrics"
                        checked={quietMetrics}
                        onChange={(e) => handleQuietSubToggle('metrics', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  {/* BADGE SYSTEM V1: Hide Badges Toggle */}
                  <div className="notification-item subtoggle">
                    <div className="notification-info">
                      <h3>🏅 Hide Badges</h3>
                      <p>Hide badges from your profile and posts for a cleaner look.</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        id="hide-badges-toggle"
                        name="hideBadges"
                        checked={hideBadges}
                        onChange={handleHideBadgesToggle}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CURSOR CUSTOMIZATION: Optional cursor styles */}
          <div className="settings-section">
            <h2 className="section-title">🖱️ Cursor Style</h2>
            <p className="section-description">
              Optional cursor styles for people who like small details.
              The default system cursor is always available.
            </p>

            <div className="cursor-style-options">
              {getCursorStyleOptions().map((option) => (
                <label
                  key={option.value}
                  className={`cursor-style-option ${cursorStyle === option.value ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="cursorStyle"
                    value={option.value}
                    checked={cursorStyle === option.value}
                    onChange={() => handleCursorStyleChange(option.value)}
                  />
                  <div className="cursor-option-content">
                    <span className="cursor-option-label">{option.label}</span>
                    <span className="cursor-option-description">{option.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="settings-section danger-zone">
            <h2 className="section-title">Account Management</h2>

            <div className="account-actions">
              <div className="action-item">
                <div className="action-info">
                  <h3>📥 Download Your Data</h3>
                  <p>Download a copy of all your data including posts, messages, and profile information</p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadData}
                  className="btn-download"
                >
                  Download Data
                </button>
              </div>

              <div className="action-item">
                <div className="action-info">
                  <h3>⏸️ Deactivate Account</h3>
                  <p>Temporarily deactivate your account. You can reactivate by logging in again.</p>
                </div>
                <button
                  type="button"
                  onClick={handleDeactivateAccount}
                  className="btn-deactivate"
                >
                  Deactivate Account
                </button>
              </div>

              <div className="action-item danger">
                <div className="action-info">
                  <h3>🗑️ Delete Account</h3>
                  <p className="danger-text">Permanently delete your account and all associated data. This action cannot be undone!</p>
                </div>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="btn-delete-account"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h2 className="section-title">Legal & Policies</h2>

            <div className="legal-links">
              <a href="/guarantees" target="_blank" rel="noopener noreferrer" className="legal-link">
                <div className="legal-link-content">
                  <div className="legal-icon">💜</div>
                  <div className="legal-info">
                    <h3>Platform Guarantees</h3>
                    <p>What Pryde promises — and what we don't do</p>
                  </div>
                </div>
                <span className="legal-arrow">→</span>
              </a>

              <a href="/terms" target="_blank" rel="noopener noreferrer" className="legal-link">
                <div className="legal-link-content">
                  <div className="legal-icon">📄</div>
                  <div className="legal-info">
                    <h3>Terms of Service</h3>
                    <p>Read our terms and conditions</p>
                  </div>
                </div>
                <span className="legal-arrow">→</span>
              </a>

              <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="legal-link">
                <div className="legal-link-content">
                  <div className="legal-icon">🔒</div>
                  <div className="legal-info">
                    <h3>Privacy Policy</h3>
                    <p>Learn how we protect your data</p>
                  </div>
                </div>
                <span className="legal-arrow">→</span>
              </a>

              <a href="/cookie-policy" target="_blank" rel="noopener noreferrer" className="legal-link">
                <div className="legal-link-content">
                  <div className="legal-icon">🍪</div>
                  <div className="legal-info">
                    <h3>Cookie Policy</h3>
                    <p>How we use cookies</p>
                  </div>
                </div>
                <span className="legal-arrow">→</span>
              </a>

              <a href="/community-guidelines" target="_blank" rel="noopener noreferrer" className="legal-link">
                <div className="legal-link-content">
                  <div className="legal-icon">👥</div>
                  <div className="legal-info">
                    <h3>Community Guidelines</h3>
                    <p>Our community standards and rules</p>
                  </div>
                </div>
                <span className="legal-arrow">→</span>
              </a>

              <a href="/acceptable-use" target="_blank" rel="noopener noreferrer" className="legal-link">
                <div className="legal-link-content">
                  <div className="legal-icon">✅</div>
                  <div className="legal-info">
                    <h3>Acceptable Use Policy</h3>
                    <p>Guidelines for using our platform</p>
                  </div>
                </div>
                <span className="legal-arrow">→</span>
              </a>

              <a href="/dmca" target="_blank" rel="noopener noreferrer" className="legal-link">
                <div className="legal-link-content">
                  <div className="legal-icon">©️</div>
                  <div className="legal-info">
                    <h3>DMCA Policy</h3>
                    <p>Copyright and intellectual property</p>
                  </div>
                </div>
                <span className="legal-arrow">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <CustomModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        placeholder={modalState.placeholder}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        onConfirm={modalState.onConfirm}
        inputType={modalState.inputType}
        defaultValue={modalState.defaultValue}
      />
    </div>
  );
}

export default Settings;

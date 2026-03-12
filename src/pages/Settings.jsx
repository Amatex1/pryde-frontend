import { useState, useEffect } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CustomModal from '../components/CustomModal';
import InviteManagement from '../components/InviteManagement'; // Phase 7B
import ProfileUrlSetting from '../components/ProfileUrlSetting'; // Custom profile URLs
import AppearanceSection from '../components/settings/AppearanceSection';
import AccountManagementSection from '../components/settings/AccountManagementSection';
import { useModal } from '../hooks/useModal';
import api from '../utils/api';
import { logout, getAuthToken } from '../utils/auth';
import { 
  getTheme, 
  setTheme as setThemeManager, 
  getGalaxyMode, 
  setGalaxyMode as setGalaxyModeManager, 
  setQuietMode, 
  setQuietSubToggle, 
  getQuietSubToggle, 
  setCursorStyle, 
  getCursorStyle, 
  setTextDensity, 
  getTextDensity,
  setQuietEnhancement,
  getQuietEnhancement,
  getAllQuietEnhancements,
  toggleSessionQuietOverride
} from '../utils/themeManager';
import { useAuth } from '../context/AuthContext';
import logger from '../utils/logger';
import { promptInstall, isPWA, isInstallPromptAvailable } from '../utils/pwa';
import './Settings.css';

function Settings() {
  const { modalState, closeModal, showAlert, showConfirm, showPrompt } = useModal();
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useAuth(); // Use centralized auth context
  // Get menu handler from AppLayout outlet context
  const { onMenuOpen } = useOutletContext() || {};
  const [loading, setLoading] = useState(true); // ✅ Start with loading state
  const [message, setMessage] = useState('');
  const [settingsSearch, setSettingsSearch] = useState('');
  // APPEARANCE: Theme and Galaxy state
  const [currentTheme, setCurrentTheme] = useState(() => getTheme());
  const [galaxyEnabled, setGalaxyEnabled] = useState(() => getGalaxyMode());
  const [quietModeEnabled, setQuietModeEnabled] = useState(false); // PHASE 2: Quiet Mode
  // QUIET MODE V2: Sub-toggles for granular control
  const [quietVisuals, setQuietVisuals] = useState(true);
  const [quietWriting, setQuietWriting] = useState(true);
  const [quietMetrics, setQuietMetrics] = useState(false);
  
  // QUIET MODE ENHANCEMENTS: All 10 improvements state
  const [quietEnhancements, setQuietEnhancements] = useState({
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    quietOnWorkFocus: false,
    quietContentFilter: 'all',
    quietHideViral: false,
    quietFollowedOnly: false,
    quietGentleTransitions: true,
    quietColorScheme: 'default',
    quietHideStories: false,
    quietDeepQuiet: false,
    quietDisableAnimations: false,
    quietMinimalUI: false,
    quietHideTrending: false,
    quietAutoTrigger: false,
    quietNegativeThreshold: 5,
    quietKeywordTriggers: [],
    quietShowHiddenCount: true,
    quietFeedSettings: 'default',
    quietMessageSettings: 'default',
    quietHighContrast: false,
    quietHideMentions: false,
    quietMuteGroupSummary: false,
    quietReduceStoryNotifications: false,
  });
  
  // CURSOR CUSTOMIZATION: Optional cursor styles
  const [cursorStyle, setCursorStyleState] = useState('system');
  // TEXT DENSITY: Compact or Cozy text sizing
  const [textDensity, setTextDensityState] = useState(() => getTextDensity());
  // IDENTITY: LGBTQ+ or Ally (can be updated after registration)
  const [identity, setIdentity] = useState(null);
  const [identitySaving, setIdentitySaving] = useState(false);
  // PWA Install button state
  const [canInstallPWA, setCanInstallPWA] = useState(false);
  // NOTE: Verification system removed 2025-12-26 (returns 410 Gone)
  // State and API calls removed to prevent 410 loops

  // ✅ Fetch data on mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  // PWA: Check if app can be installed
  useEffect(() => {
    const checkInstallability = () => {
      // Can install if: not already a PWA AND install prompt is available
      setCanInstallPWA(!isPWA() && isInstallPromptAvailable());
    };

    checkInstallability();

    // Listen for install availability changes
    const handleInstallAvailable = () => checkInstallability();
    const handleInstallCompleted = () => setCanInstallPWA(false);

    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-install-completed', handleInstallCompleted);

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-install-completed', handleInstallCompleted);
    };
  }, []);

  // Load appearance/identity settings when currentUser changes
  useEffect(() => {
    if (currentUser) {
      // PHASE 2: Load quiet mode settings
      const quietMode = currentUser.privacySettings?.quietModeEnabled || false;
      setQuietModeEnabled(quietMode);
      setQuietMode(quietMode);

      // QUIET MODE V2: Load sub-toggle settings from localStorage (with backend sync)
      const settings = currentUser.privacySettings || {};
      setQuietVisuals(settings.quietVisuals ?? getQuietSubToggle('visuals'));
      setQuietWriting(settings.quietWriting ?? getQuietSubToggle('writing'));
      setQuietMetrics(settings.quietMetrics ?? getQuietSubToggle('metrics'));
      // CURSOR CUSTOMIZATION: Load cursor style
      setCursorStyleState(settings.cursorStyle ?? getCursorStyle());
      // IDENTITY: Load from user profile
      setIdentity(currentUser.identity || null);
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

  // IDENTITY: Handle identity change
  const handleIdentityChange = async (newIdentity) => {
    try {
      setIdentitySaving(true);
      await api.put('/users/profile', { identity: newIdentity });
      setIdentity(newIdentity);
      await refreshUser();
      setMessage(newIdentity ? `Identity updated to ${newIdentity}` : 'Identity cleared');
    } catch (error) {
      logger.error('Failed to update identity:', error);
      setMessage('Failed to update identity');
    } finally {
      setIdentitySaving(false);
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

  // TEXT DENSITY: Handle density change
  const handleDensityChange = async (density) => {
    const previousDensity = textDensity;
    try {
      // Update local state and apply to DOM immediately
      setTextDensityState(density);
      setTextDensity(density);

      // Sync with backend
      await api.patch('/users/me/settings', { textDensity: density });
      setMessage(density === 'cozy' ? 'Text density: Cozy' : 'Text density: Compact');
    } catch (error) {
      logger.error('Failed to update text density:', error);
      setMessage('Failed to update text density');
      // Revert on error
      setTextDensityState(previousDensity);
      setTextDensity(previousDensity);
    }
  };

  // APPEARANCE: Handle light mode toggle
  const handleThemeToggle = async (useLightMode) => {
    const newTheme = useLightMode ? 'light' : 'dark';
    try {
      setCurrentTheme(newTheme);
      setThemeManager(newTheme);
      await api.patch('/users/me/settings', { theme: newTheme });
      setMessage(useLightMode ? 'Light mode enabled' : 'Dark mode enabled');
    } catch (error) {
      logger.error('Failed to update theme:', error);
      setMessage('Failed to update theme');
      // Revert on error
      const revert = useLightMode ? 'dark' : 'light';
      setCurrentTheme(revert);
      setThemeManager(revert);
    }
  };

  // APPEARANCE: Handle galaxy toggle
  const handleGalaxyToggle = async (enabled) => {
    try {
      setGalaxyEnabled(enabled);
      setGalaxyModeManager(enabled);
      await api.patch('/users/me/settings', { galaxyMode: enabled });
      setMessage(enabled ? 'Galaxy background enabled' : 'Galaxy background disabled');
    } catch (error) {
      logger.error('Failed to update galaxy mode:', error);
      setMessage('Failed to update galaxy mode');
      // Revert on error
      setGalaxyEnabled(!enabled);
      setGalaxyModeManager(!enabled);
    }
  };

  const handleDownloadData = async () => {
    try {
      setMessage('Preparing your data...');
      logger.debug('📥 Requesting data download...');

      // Debug: Check if token exists (from in-memory storage)
      const token = getAuthToken();
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
    // Step 1 — explain what will happen (30-day recovery window)
    const confirmed = await showConfirm(
      '⚠️ Are you sure you want to delete your account?\n\n' +
      'Your account will be scheduled for deletion. You have 30 days to change your mind by logging in again.\n\n' +
      'After 30 days, the following will be permanently removed:\n' +
      '• Your profile and all personal information\n' +
      '• All your posts and comments\n' +
      '• All your friend connections\n\n' +
      'You will receive a confirmation email to verify this request.',
      'Delete Account?',
      'Continue',
      'Cancel'
    );

    if (!confirmed) return;

    // Step 2 — password confirmation
    const password = await showPrompt(
      'Enter your password to confirm account deletion:',
      'Confirm with Password',
      'Your password'
    );

    if (!password) {
      showAlert('Account deletion cancelled.', 'Cancelled');
      return;
    }

    try {
      await api.post('/users/account/delete-request', { password });
      showAlert(
        'A confirmation email has been sent to your email address.\n\n' +
        'Click the link in the email to confirm your deletion request.\n\n' +
        'You have 30 days to cancel by logging in again.',
        'Check Your Email'
      );
    } catch (error) {
      logger.error('Delete account error:', error);
      const msg = error.response?.data?.message || 'Failed to request account deletion. Please try again.';
      showAlert(msg, 'Error');
    }
  };

  const handleCancelDeletion = async () => {
    const confirmed = await showConfirm(
      'Cancel your account deletion request?\n\nYour account will be fully restored.',
      'Cancel Deletion?',
      'Yes, keep my account',
      'No'
    );
    if (!confirmed) return;

    try {
      await api.post('/users/account/cancel-deletion');
      await refreshUser();
      showAlert('Your account deletion has been cancelled. Welcome back!', 'Account Restored');
    } catch (error) {
      logger.error('Cancel deletion error:', error);
      showAlert('Could not cancel deletion. Please contact support.', 'Error');
    }
  };

  // NOTE: handleRequestVerification removed 2025-12-26
  // Verification request endpoint returns 410 Gone - feature intentionally removed

  // PWA: Handle Install App button click
  const handleInstallApp = async () => {
    try {
      const accepted = await promptInstall();
      if (accepted) {
        showAlert('Pryde Social has been installed on your device!', 'App Installed');
        setCanInstallPWA(false);
      }
    } catch (error) {
      logger.error('Install app error:', error);
      showAlert('Could not install the app. Please try again.', 'Install Failed');
    }
  };

  // ✅ Show loading state
  if (loading) {
    return (
      <div className="page-container">
        <Navbar onMenuClick={onMenuOpen} />
        <div className="settings-container">
          <div className="settings-card glossy fade-in">
            <h1 className="settings-title text-shadow"><SettingsIcon size={20} strokeWidth={1.75} aria-hidden="true" /> Settings</h1>
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

          <input
            type="search"
            className="settings-search-bar"
            placeholder="Search settings…"
            value={settingsSearch}
            onChange={(e) => setSettingsSearch(e.target.value)}
            aria-label="Search settings"
          />

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
          <div className="settings-section" style={{ background: 'linear-gradient(135deg, var(--color-brand-muted) 0%, var(--color-surface-muted) 100%)', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 className="section-title" style={{ margin: 0, marginBottom: '5px' }}>🔒 Privacy & Safety</h2>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>
                  Profile visibility, messaging, identity controls, and blocked users
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

          {/* Identity Selection - Can be updated after registration */}
          <div className="settings-section">
            <h2 className="section-title">🌈 Your Identity</h2>
            <p className="section-description">
              How do you identify on Pryde? This helps us tailor your experience.
              {!identity && <span style={{ color: 'var(--pryde-purple)', fontWeight: '500' }}> You skipped this during registration - you can set it now!</span>}
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => handleIdentityChange('LGBTQ+')}
                disabled={identitySaving}
                className={identity === 'LGBTQ+' ? 'btn-primary' : 'btn-secondary'}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  opacity: identitySaving ? 0.7 : 1,
                  border: identity === 'LGBTQ+' ? '2px solid var(--pryde-purple)' : '2px solid transparent'
                }}
              >
                🌈 I am LGBTQ+
              </button>
              <button
                type="button"
                onClick={() => handleIdentityChange('Ally')}
                disabled={identitySaving}
                className={identity === 'Ally' ? 'btn-primary' : 'btn-secondary'}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  opacity: identitySaving ? 0.7 : 1,
                  border: identity === 'Ally' ? '2px solid var(--pryde-purple)' : '2px solid transparent'
                }}
              >
                🤝 I am an Ally
              </button>
            </div>
            {identity && (
              <p style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '14px' }}>
                Currently set to: <strong>{identity}</strong>
              </p>
            )}
          </div>

          {/* Custom Profile URL */}
          <div className="settings-section">
            <ProfileUrlSetting
              currentSlug={currentUser?.profileSlug}
              onUpdate={(newSlug) => {
                refreshUser();
              }}
            />
          </div>

          {/* Email Verification Section */}
          <div className="settings-section">
            <h2 className="section-title">📧 Email Verification</h2>
            {currentUser?.emailVerified ? (
              <div className="verification-verified">
                <div className="verified-icon">✓</div>
                <div className="verified-text">
                  <h3>Email Verified</h3>
                  <p>Your email address has been verified. You have full access to all features.</p>
                </div>
              </div>
            ) : (
              <div className="verification-info">
                <p>
                  Please verify your email address to create posts and comments.
                  Check your inbox for the verification link.
                </p>
                <button
                  onClick={async () => {
                    try {
                      await api.post('/auth/resend-verification');
                      showAlert('Verification email sent! Check your inbox.', 'Success');
                    } catch (error) {
                      showAlert(error.response?.data?.message || 'Failed to send verification email', 'Error');
                    }
                  }}
                  className="btn-verification"
                >
                  Resend Verification Email
                </button>
              </div>
            )}
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

          <AppearanceSection
            currentTheme={currentTheme}
            galaxyEnabled={galaxyEnabled}
            quietModeEnabled={quietModeEnabled}
            quietVisuals={quietVisuals}
            quietWriting={quietWriting}
            quietMetrics={quietMetrics}
            canInstallPWA={canInstallPWA}
            cursorStyle={cursorStyle}
            textDensity={textDensity}
            onThemeToggle={handleThemeToggle}
            onGalaxyToggle={handleGalaxyToggle}
            onQuietModeToggle={handleQuietModeToggle}
            onQuietSubToggle={handleQuietSubToggle}
            onInstallApp={handleInstallApp}
            onCursorStyleChange={handleCursorStyleChange}
            onDensityChange={handleDensityChange}
          />

          <AccountManagementSection
            currentUser={currentUser}
            onDownloadData={handleDownloadData}
            onDeactivate={handleDeactivateAccount}
            onDelete={handleDeleteAccount}
            onCancelDeletion={handleCancelDeletion}
          />

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

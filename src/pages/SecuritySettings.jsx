import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import Navbar from '../components/Navbar';
import TwoFactorSetup from '../components/security/TwoFactorSetup';
import SessionManagement from '../components/security/SessionManagement';
import PasskeyManager from '../components/PasskeyManager';
import RecoveryContacts from '../components/RecoveryContacts';
import CustomModal from '../components/CustomModal';
import { useModal } from '../hooks/useModal';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  isPushNotificationSubscribed,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications
} from '../utils/pushNotifications';
import './Settings.css';

const DEFAULT_LOGIN_ALERTS = {
  enabled: true,
  emailOnNewDevice: true,
  emailOnSuspiciousLogin: true
};

function getPushNotificationSupport() {
  return typeof window !== 'undefined'
    && typeof navigator !== 'undefined'
    && 'Notification' in window
    && 'serviceWorker' in navigator
    && 'PushManager' in window;
}

function buildPushLoginStatus(overrides = {}) {
  return {
    supported: getPushNotificationSupport(),
    deviceSubscribed: false,
    accountEnabled: false,
    accountHasSubscription: false,
    preferPushTwoFactor: true,
    ...overrides
  };
}

function SecuritySettings() {
  const navigate = useNavigate();
  const { onMenuOpen } = useOutletContext() || {};
  const { modalState, closeModal, showPrompt } = useModal();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [twoFactorStatus, setTwoFactorStatus] = useState({
    enabled: false,
    backupCodesRemaining: 0
  });
  const [loginAlerts, setLoginAlerts] = useState(DEFAULT_LOGIN_ALERTS);
  const [pushLoginStatus, setPushLoginStatus] = useState(buildPushLoginStatus());
  const [pushActionLoading, setPushActionLoading] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);

  const showStatusMessage = useCallback((text, type = 'success', durationMs = 3000) => {
    setMessage(text);
    setMessageType(type);

    if (durationMs > 0) {
      setTimeout(() => setMessage(''), durationMs);
    }
  }, []);

  const syncAuthDerivedSecurityState = useCallback(async () => {
    const [authResult, deviceSubscribed] = await Promise.all([
      refreshUser(),
      isPushNotificationSubscribed()
    ]);

    const refreshedUser = authResult?.user;

    setLoginAlerts({
      ...DEFAULT_LOGIN_ALERTS,
      ...(refreshedUser?.loginAlerts || {})
    });

    setPushLoginStatus(buildPushLoginStatus({
      deviceSubscribed,
      accountEnabled: refreshedUser?.pushTwoFactorEnabled ?? false,
      accountHasSubscription: refreshedUser?.hasPushSubscription ?? false,
      preferPushTwoFactor: refreshedUser?.preferPushTwoFactor ?? true
    }));
  }, [refreshUser]);

  const fetchSecuritySettings = useCallback(async () => {
    try {
      setLoading(true);

      const twoFactorResponse = await api.get('/2fa/status');
      setTwoFactorStatus({
        enabled: twoFactorResponse.data?.enabled ?? false,
        backupCodesRemaining: twoFactorResponse.data?.backupCodesRemaining ?? 0
      });

      await syncAuthDerivedSecurityState();
    } catch (error) {
      console.error('Failed to fetch security settings:', error);
      showStatusMessage('Failed to load security settings. Using default values.', 'error');
      setTwoFactorStatus({
        enabled: false,
        backupCodesRemaining: 0
      });
      setLoginAlerts(DEFAULT_LOGIN_ALERTS);
      setPushLoginStatus(buildPushLoginStatus());
    } finally {
      setLoading(false);
    }
  }, [showStatusMessage, syncAuthDerivedSecurityState]);

  useEffect(() => {
    fetchSecuritySettings();
  }, [fetchSecuritySettings]);

  const handleLoginAlertsChange = async (field, value) => {
    try {
      const updatedAlerts = { ...loginAlerts, [field]: value };
      setLoginAlerts(updatedAlerts);

      await api.put('/users/profile', { loginAlerts: updatedAlerts });
      showStatusMessage('Login alert settings updated successfully');
    } catch (error) {
      console.error('Failed to update login alerts:', error);
      showStatusMessage('Failed to update login alert settings', 'error');
    }
  };

  const handleDisable2FA = async () => {
    const password = await showPrompt('Enter your password to disable 2FA:', 'Disable 2FA', 'Password', '', 'password');
    if (!password) return;

    try {
      await api.post('/2fa/disable', { password });
      setTwoFactorStatus({ enabled: false, backupCodesRemaining: 0 });
      showStatusMessage('Two-factor authentication disabled successfully');
    } catch (error) {
      console.error('Failed to disable 2FA:', error);
      showStatusMessage(error.response?.data?.message || 'Failed to disable 2FA', 'error');
    }
  };

  const handleRegenerateBackupCodes = async () => {
    const password = await showPrompt('Enter your password to regenerate backup codes:', 'Regenerate Backup Codes', 'Password', '', 'password');
    if (!password) return;

    try {
      const response = await api.post('/2fa/regenerate-backup-codes', { password });
      const blob = new Blob([response.data.backupCodes.join('\n')], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'pryde-backup-codes.txt';
      link.click();
      window.URL.revokeObjectURL(url);

      setTwoFactorStatus(prev => ({ ...prev, backupCodesRemaining: 10 }));
      showStatusMessage('Backup codes regenerated successfully. Please save them in a secure location.', 'success', 5000);
    } catch (error) {
      console.error('Failed to regenerate backup codes:', error);
      showStatusMessage(error.response?.data?.message || 'Failed to regenerate backup codes', 'error');
    }
  };

  const handleEnablePushNotifications = async () => {
    try {
      setPushActionLoading(true);
      const subscribed = await subscribeToPushNotifications();

      if (!subscribed) {
        showStatusMessage('Failed to enable notifications on this device', 'error');
        return;
      }

      await syncAuthDerivedSecurityState();
      showStatusMessage('Push notifications enabled on this device');
    } catch (error) {
      console.error('Failed to enable push notifications:', error);
      showStatusMessage('Failed to enable notifications on this device', 'error');
    } finally {
      setPushActionLoading(false);
    }
  };

  const handleDisablePushNotifications = async () => {
    try {
      setPushActionLoading(true);
      const unsubscribed = await unsubscribeFromPushNotifications();

      if (!unsubscribed) {
        showStatusMessage('Failed to disable notifications on this device', 'error');
        return;
      }

      await syncAuthDerivedSecurityState();
      showStatusMessage('Push notifications disabled on this device');
    } catch (error) {
      console.error('Failed to disable push notifications:', error);
      showStatusMessage('Failed to disable notifications on this device', 'error');
    } finally {
      setPushActionLoading(false);
    }
  };

  const handleEnablePushLogin = async () => {
    if (!pushLoginStatus.accountHasSubscription) {
      showStatusMessage(
        'Enable notifications on at least one signed-in device before enabling Push Login Approval.',
        'error',
        5000
      );
      return;
    }

    try {
      setPushActionLoading(true);
      await api.post('/login-approval/enable');
      await syncAuthDerivedSecurityState();
      showStatusMessage('Push login approval enabled successfully');
    } catch (error) {
      console.error('Failed to enable push login approval:', error);
      showStatusMessage(error.response?.data?.message || 'Failed to enable Push Login Approval', 'error');
    } finally {
      setPushActionLoading(false);
    }
  };

  const handleDisablePushLogin = async () => {
    try {
      setPushActionLoading(true);
      await api.post('/login-approval/disable');
      await syncAuthDerivedSecurityState();
      showStatusMessage('Push login approval disabled successfully');
    } catch (error) {
      console.error('Failed to disable push login approval:', error);
      showStatusMessage(error.response?.data?.message || 'Failed to disable Push Login Approval', 'error');
    } finally {
      setPushActionLoading(false);
    }
  };

  let pushStatusClassName = 'security-status-card alert-warning';
  let pushStatusIcon = '⚠️';
  let pushStatusTitle = 'Push login approval is not enabled yet';
  let pushStatusDescription = 'Enable notifications on a signed-in device, then turn on Push Login Approval for your account.';

  if (!pushLoginStatus.supported) {
    pushStatusTitle = 'This browser cannot receive push login approvals';
    pushStatusDescription = 'Use a browser or device with notifications enabled to approve sign-ins with the 2-digit code flow.';
  } else if (pushLoginStatus.accountEnabled && pushLoginStatus.accountHasSubscription) {
    pushStatusClassName = 'security-status-card alert-success';
    pushStatusIcon = '✅';
    pushStatusTitle = 'Push login approval is enabled and ready';
    pushStatusDescription = 'New sign-ins can use the 2-digit push approval flow instead of falling back to the 6-digit code.';
  } else if (pushLoginStatus.accountEnabled && !pushLoginStatus.accountHasSubscription) {
    pushStatusTitle = 'Push login approval is on, but no subscribed device is available';
    pushStatusDescription = 'Enable notifications on at least one signed-in device or login will keep falling back to the 6-digit code.';
  }

  if (loading) {
    return (
      <div className="page-container">
        <Navbar onMenuClick={onMenuOpen} />
        <div className="settings-container">
          <div className="settings-card glossy fade-in">
            <p>Loading security settings...</p>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <button
              onClick={() => navigate('/settings')}
              className="btn-secondary"
              style={{ padding: '8px 12px' }}
            >
              ← Back to Settings
            </button>
            <h1 className="settings-title text-shadow">🔐 Security Settings</h1>
          </div>

          {message && (
            <div className={`message ${messageType === 'success' ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <div className="settings-section">
            <PasskeyManager />
          </div>

          <div className="settings-section">
            <h2 className="section-title">Two-Factor Authentication (2FA)</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '15px' }}>
              Add an extra layer of security to your account by requiring a verification code in addition to your password.
            </p>

            {twoFactorStatus.enabled ? (
              <div className="security-status-card alert-success" style={{ padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '24px' }}>✅</span>
                  <div>
                    <strong>2FA is enabled</strong>
                    <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
                      Your account is protected with two-factor authentication
                    </p>
                  </div>
                </div>
                <div style={{ marginTop: '10px', fontSize: '14px' }}>
                  <strong>Backup codes remaining:</strong> {twoFactorStatus.backupCodesRemaining} / 10
                </div>
                <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                  <button onClick={handleRegenerateBackupCodes} className="btn-secondary">
                    🔄 Regenerate Backup Codes
                  </button>
                  <button onClick={handleDisable2FA} className="btn-danger">
                    ❌ Disable 2FA
                  </button>
                </div>
              </div>
            ) : (
              <div className="security-status-card alert-warning" style={{ padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '24px' }}>⚠️</span>
                  <div>
                    <strong>2FA is not enabled</strong>
                    <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
                      Your account is less secure without two-factor authentication
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTwoFactorSetup(true)}
                  className="btn-primary"
                  style={{ marginTop: '10px' }}
                >
                  🔒 Enable 2FA
                </button>
              </div>
            )}

            {showTwoFactorSetup && !twoFactorStatus.enabled && (
              <TwoFactorSetup
                onClose={() => setShowTwoFactorSetup(false)}
                onSuccess={() => {
                  setShowTwoFactorSetup(false);
                  fetchSecuritySettings();
                  showStatusMessage('Two-factor authentication enabled successfully!', 'success', 5000);
                }}
              />
            )}
          </div>

          <div className="settings-section">
            <h2 className="section-title">Push Login Approval</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>
              Approve sign-ins from another device by matching a 2-digit code instead of typing a 6-digit authenticator code.
            </p>

            <div className={pushStatusClassName} style={{ padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '24px' }}>{pushStatusIcon}</span>
                <div>
                  <strong>{pushStatusTitle}</strong>
                  <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
                    {pushStatusDescription}
                  </p>
                </div>
              </div>

              <div style={{ marginTop: '10px', fontSize: '14px', display: 'grid', gap: '6px' }}>
                <div><strong>This device notifications:</strong> {pushLoginStatus.deviceSubscribed ? 'Enabled' : 'Not enabled'}</div>
                <div><strong>Account ready for push login:</strong> {pushLoginStatus.accountHasSubscription ? 'Yes' : 'No'}</div>
                <div><strong>Push login approval:</strong> {pushLoginStatus.accountEnabled ? 'Enabled' : 'Disabled'}</div>
                {pushLoginStatus.accountEnabled && pushLoginStatus.preferPushTwoFactor && (
                  <div><strong>Login preference:</strong> Push approval is preferred over the 6-digit code when a subscribed device is available.</div>
                )}
              </div>

              {pushLoginStatus.supported && (
                <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {pushLoginStatus.deviceSubscribed ? (
                    <button
                      onClick={handleDisablePushNotifications}
                      className="btn-secondary"
                      disabled={pushActionLoading}
                    >
                      🔕 Disable Notifications on This Device
                    </button>
                  ) : (
                    <button
                      onClick={handleEnablePushNotifications}
                      className="btn-secondary"
                      disabled={pushActionLoading}
                    >
                      🔔 Enable Notifications on This Device
                    </button>
                  )}

                  {pushLoginStatus.accountEnabled ? (
                    <button
                      onClick={handleDisablePushLogin}
                      className="btn-danger"
                      disabled={pushActionLoading}
                    >
                      ❌ Disable Push Login Approval
                    </button>
                  ) : (
                    <button
                      onClick={handleEnablePushLogin}
                      className="btn-primary"
                      disabled={pushActionLoading || !pushLoginStatus.accountHasSubscription}
                    >
                      🔐 Enable Push Login Approval
                    </button>
                  )}
                </div>
              )}

              {!pushLoginStatus.accountHasSubscription && pushLoginStatus.supported && (
                <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-muted)' }}>
                  Enable notifications on at least one signed-in device first, then turn on Push Login Approval.
                </p>
              )}

              {pushActionLoading && (
                <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-muted)' }}>
                  Updating push login settings...
                </p>
              )}
            </div>
          </div>

          <div className="settings-section">
            <h2 className="section-title">Login Alerts</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>
              Get notified when someone logs into your account from a new device or location.
            </p>

            <div className="setting-item toggle-item">
              <div className="toggle-info">
                <span>Enable login alerts</span>
                <p className="setting-description">
                  Receive email notifications when you log in
                </p>
              </div>
              <label className="toggle-switch" aria-label="Enable login alerts">
                <input
                  type="checkbox"
                  checked={loginAlerts.enabled}
                  onChange={(e) => handleLoginAlertsChange('enabled', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className={`setting-item toggle-item ${!loginAlerts.enabled ? 'disabled' : ''}`}>
              <div className="toggle-info">
                <span>Email on new device login</span>
                <p className="setting-description">
                  Get notified when you log in from a device we don't recognize
                </p>
              </div>
              <label className="toggle-switch" aria-label="Email on new device login">
                <input
                  type="checkbox"
                  checked={loginAlerts.emailOnNewDevice}
                  onChange={(e) => handleLoginAlertsChange('emailOnNewDevice', e.target.checked)}
                  disabled={!loginAlerts.enabled}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className={`setting-item toggle-item ${!loginAlerts.enabled ? 'disabled' : ''}`}>
              <div className="toggle-info">
                <span>Email on suspicious login</span>
                <p className="setting-description">
                  Get alerted if we detect unusual login activity
                </p>
              </div>
              <label className="toggle-switch" aria-label="Email on suspicious login">
                <input
                  type="checkbox"
                  checked={loginAlerts.emailOnSuspiciousLogin}
                  onChange={(e) => handleLoginAlertsChange('emailOnSuspiciousLogin', e.target.checked)}
                  disabled={!loginAlerts.enabled}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="settings-section">
            <RecoveryContacts />
          </div>

          <div className="settings-section">
            <h2 className="section-title">Active Sessions</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>
              Manage devices and locations where you're currently logged in.
            </p>

            <SessionManagement />
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

export default SecuritySettings;


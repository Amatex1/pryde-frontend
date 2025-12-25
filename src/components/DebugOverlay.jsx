/**
 * Debug Overlay Component
 * 
 * 🔍 Visual diagnostics for auth, cache, and network state
 * 
 * Features:
 * - Auth state (authLoading, authReady, isAuthenticated)
 * - Token status (present/absent, expiry)
 * - Service worker status
 * - Cache version
 * - Frontend/backend versions
 * - Online/offline state
 * 
 * Toggle with: ?debug=true or Ctrl+Shift+D
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FRONTEND_VERSION } from '../utils/pwaSafety';
import logger from '../utils/logger';
import '../styles/DebugOverlay.css';

export default function DebugOverlay() {
  const { user, loading, authReady, isAuthenticated } = useAuth();
  const [visible, setVisible] = useState(false);
  const [swStatus, setSwStatus] = useState(null);
  const [backendVersion, setBackendVersion] = useState('unknown');
  const [online, setOnline] = useState(navigator.onLine);
  const [tokenInfo, setTokenInfo] = useState(null);

  // Check URL params for ?debug=true
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === 'true') {
      setVisible(true);
    }
  }, []);

  // Keyboard shortcut: Ctrl+Shift+D
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setVisible(prev => !prev);
        logger.debug('[Debug Overlay] Toggled:', !visible);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible]);

  // Monitor online/offline state
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check service worker status
  useEffect(() => {
    if (!visible) return;

    const checkSWStatus = async () => {
      if (!('serviceWorker' in navigator)) {
        setSwStatus({ active: false, reason: 'Not supported' });
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        setSwStatus({ active: false, reason: 'Not registered' });
        return;
      }

      setSwStatus({
        active: !!registration.active,
        scope: registration.scope,
        installing: !!registration.installing,
        waiting: !!registration.waiting
      });
    };

    checkSWStatus();
    const interval = setInterval(checkSWStatus, 5000);
    return () => clearInterval(interval);
  }, [visible]);

  // Check token info
  useEffect(() => {
    if (!visible) return;

    const checkToken = () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setTokenInfo({ present: false });
        return;
      }

      try {
        // Decode JWT to get expiry (simple base64 decode)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp ? new Date(payload.exp * 1000) : null;
        const now = new Date();
        const expired = exp && exp < now;

        setTokenInfo({
          present: true,
          expired,
          expiresAt: exp ? exp.toLocaleString() : 'unknown',
          timeLeft: exp ? Math.max(0, Math.floor((exp - now) / 1000)) : null
        });
      } catch (error) {
        setTokenInfo({ present: true, error: 'Invalid token format' });
      }
    };

    checkToken();
    const interval = setInterval(checkToken, 1000);
    return () => clearInterval(interval);
  }, [visible]);

  // Fetch backend version
  useEffect(() => {
    if (!visible) return;

    const fetchBackendVersion = async () => {
      try {
        const response = await fetch('/api/version/status');
        const data = await response.json();
        setBackendVersion(data.backendVersion || 'unknown');
      } catch (error) {
        setBackendVersion('error');
      }
    };

    fetchBackendVersion();
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="debug-overlay">
      <div className="debug-overlay-header">
        <h3>🔍 Debug Overlay</h3>
        <button onClick={() => setVisible(false)}>✕</button>
      </div>

      <div className="debug-overlay-content">
        {/* Auth State */}
        <section>
          <h4>🔐 Auth State</h4>
          <div className="debug-row">
            <span>authLoading:</span>
            <span className={loading ? 'status-warning' : 'status-success'}>
              {loading ? 'true' : 'false'}
            </span>
          </div>
          <div className="debug-row">
            <span>authReady:</span>
            <span className={authReady ? 'status-success' : 'status-warning'}>
              {authReady ? 'true' : 'false'}
            </span>
          </div>
          <div className="debug-row">
            <span>isAuthenticated:</span>
            <span className={isAuthenticated ? 'status-success' : 'status-error'}>
              {isAuthenticated ? 'true' : 'false'}
            </span>
          </div>
          <div className="debug-row">
            <span>user:</span>
            <span>{user ? user.username : 'null'}</span>
          </div>
        </section>

        {/* Token Info */}
        <section>
          <h4>🎫 Token</h4>
          {tokenInfo && (
            <>
              <div className="debug-row">
                <span>present:</span>
                <span className={tokenInfo.present ? 'status-success' : 'status-error'}>
                  {tokenInfo.present ? 'true' : 'false'}
                </span>
              </div>
              {tokenInfo.present && (
                <>
                  <div className="debug-row">
                    <span>expired:</span>
                    <span className={tokenInfo.expired ? 'status-error' : 'status-success'}>
                      {tokenInfo.expired ? 'true' : 'false'}
                    </span>
                  </div>
                  <div className="debug-row">
                    <span>expiresAt:</span>
                    <span className="debug-small">{tokenInfo.expiresAt}</span>
                  </div>
                  {tokenInfo.timeLeft !== null && (
                    <div className="debug-row">
                      <span>timeLeft:</span>
                      <span>{Math.floor(tokenInfo.timeLeft / 60)}m {tokenInfo.timeLeft % 60}s</span>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>

        {/* Service Worker */}
        <section>
          <h4>⚙️ Service Worker</h4>
          {swStatus && (
            <>
              <div className="debug-row">
                <span>active:</span>
                <span className={swStatus.active ? 'status-success' : 'status-error'}>
                  {swStatus.active ? 'true' : 'false'}
                </span>
              </div>
              {swStatus.reason && (
                <div className="debug-row">
                  <span>reason:</span>
                  <span>{swStatus.reason}</span>
                </div>
              )}
              {swStatus.scope && (
                <div className="debug-row">
                  <span>scope:</span>
                  <span className="debug-small">{swStatus.scope}</span>
                </div>
              )}
            </>
          )}
        </section>

        {/* Versions */}
        <section>
          <h4>📦 Versions</h4>
          <div className="debug-row">
            <span>frontend:</span>
            <span>{FRONTEND_VERSION}</span>
          </div>
          <div className="debug-row">
            <span>backend:</span>
            <span>{backendVersion}</span>
          </div>
        </section>

        {/* Network */}
        <section>
          <h4>🌐 Network</h4>
          <div className="debug-row">
            <span>online:</span>
            <span className={online ? 'status-success' : 'status-error'}>
              {online ? 'true' : 'false'}
            </span>
          </div>
        </section>
      </div>

      <div className="debug-overlay-footer">
        <small>Press Ctrl+Shift+D to toggle</small>
      </div>
    </div>
  );
}


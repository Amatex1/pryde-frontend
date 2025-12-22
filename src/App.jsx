import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import { isAuthenticated, getCurrentUser, setAuthToken, setRefreshToken } from './utils/auth';
import { initializeSocket, disconnectSocket, disconnectSocketForLogout, resetLogoutFlag, onNewMessage } from './utils/socket';
import { playNotificationSound, requestNotificationPermission } from './utils/notifications';
import { initializeQuietMode } from './utils/quietMode';
import { preloadCriticalResources, preloadFeedData } from './utils/resourcePreloader';
import { startVersionCheck, checkForUpdate } from './utils/versionCheck';
import { registerSW } from 'virtual:pwa-register';
import api from './utils/api';
import axios from 'axios';
import { API_BASE_URL } from './config/api';
import logger from './utils/logger';
import {
  AUTH_STATUS,
  getAuthStatus,
  setAuthStatus,
  markAuthenticated,
  markUnauthenticated
} from './state/authStatus';

// ... (previous imports remain the same)

function App() {
  // CRITICAL: Use 3-state auth model to prevent redirect loops
  // - "loading": Auth state unknown (initial state, checking token)
  // - "authenticated": User is confirmed logged in
  // - "unauthenticated": User is confirmed logged out
  const [authStatus, setAuthStatusState] = useState(AUTH_STATUS.UNKNOWN);
  const [authReady, setAuthReady] = useState(false);
  const [initError, setInitError] = useState(false);
  // Update banner state
  const updateAvailable = useAppVersion();
  const [showUpdateBanner, setShowUpdateBanner] = useState(true);

  // Derived state for backward compatibility
  const isAuth = authStatus === AUTH_STATUS.AUTHENTICATED;
  const authLoading = authStatus === AUTH_STATUS.UNKNOWN;

  useEffect(() => {
    let cancelled = false;

    // CRITICAL: Bootstrap auth state on app load
    const bootstrapAuth = async () => {
      try {
        // Ensure authReady is set to true no matter what happens
        if (cancelled) return;

        // Check if token exists in localStorage
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');

        if (!token && !refreshToken) {
          // No tokens = definitely unauthenticated
          logger.debug('🔐 No tokens found - marking unauthenticated');
          setAuthStatusState(AUTH_STATUS.UNAUTHENTICATED);
          markUnauthenticated();
          return;
        }

        // Token exists - verify it with backend
        logger.debug('🔐 Token found - verifying with backend...');

        try {
          const response = await api.get('/auth/status');
          const isCurrentlyAuth = response.data.authenticated;

          if (isCurrentlyAuth) {
            logger.debug('🔐 Auth verified - marking authenticated');
            setAuthStatusState(AUTH_STATUS.AUTHENTICATED);
            markAuthenticated();

            // 🚀 OPTIMIZATION: Preload critical resources after auth
            Promise.all([
              preloadCriticalResources(),
              preloadFeedData()
            ]).catch(err => {
              logger.debug('Resource preload failed (non-critical):', err);
            });
          } else {
            // Auth status returned false - try to refresh token before giving up
            logger.debug('🔐 Auth status false - attempting token refresh...');

            if (refreshToken) {
              try {
                const refreshResponse = await axios.post(`${API_BASE_URL}/refresh`, {
                  refreshToken
                }, {
                  withCredentials: true
                });

                if (refreshResponse.data.accessToken) {
                  logger.debug('✅ Token refreshed successfully during bootstrap');
                  setAuthToken(refreshResponse.data.accessToken);

                  if (refreshResponse.data.refreshToken) {
                    setRefreshToken(refreshResponse.data.refreshToken);
                  }

                  // Now verify auth again with new token
                  const retryResponse = await api.get('/auth/status');
                  if (retryResponse.data.authenticated) {
                    logger.debug('🔐 Auth verified after refresh - marking authenticated');
                    setAuthStatusState(AUTH_STATUS.AUTHENTICATED);
                    markAuthenticated();
                    return;
                  }
                }
              } catch (refreshError) {
                logger.warn('Token refresh failed during bootstrap:', refreshError);
              }
            }

            // If we get here, refresh failed or no refresh token
            logger.debug('🔐 Auth failed - marking unauthenticated');
            setAuthStatusState(AUTH_STATUS.UNAUTHENTICATED);
            markUnauthenticated();
          }

          logger.debug('🔐 Auth bootstrap complete:', {
            status: isCurrentlyAuth ? 'authenticated' : 'unauthenticated',
            user: response.data.user?.username
          });
        } catch (statusError) {
          // If auth status check fails with error, try to refresh token
          logger.warn('Auth status check failed - attempting token refresh:', statusError);

          if (refreshToken) {
            try {
              const refreshResponse = await axios.post(`${API_BASE_URL}/refresh`, {
                refreshToken
              }, {
                withCredentials: true
              });

              if (refreshResponse.data.accessToken) {
                logger.debug('✅ Token refreshed successfully after status error');
                setAuthToken(refreshResponse.data.accessToken);

                if (refreshResponse.data.refreshToken) {
                  setRefreshToken(refreshResponse.data.refreshToken);
                }

                // Verify auth with new token
                const retryResponse = await api.get('/auth/status');
                if (retryResponse.data.authenticated) {
                  logger.debug('🔐 Auth verified after refresh - marking authenticated');
                  setAuthStatusState(AUTH_STATUS.AUTHENTICATED);
                  markAuthenticated();
                  return;
                }
              }
            } catch (refreshError) {
              logger.warn('Token refresh failed:', refreshError);
            }
          }

          // If we get here, everything failed
          logger.debug('🔐 All auth attempts failed - marking unauthenticated');
          setAuthStatusState(AUTH_STATUS.UNAUTHENTICATED);
          markUnauthenticated();
        }
      } catch (error) {
        // Unexpected error
        logger.error('Unexpected error during auth bootstrap:', error);
        setAuthStatusState(AUTH_STATUS.UNAUTHENTICATED);
        markUnauthenticated();
      } finally {
        // CRITICAL: Always set authReady to true, no matter what happens
        if (!cancelled) {
          console.log("Auth bootstrap finished");
          setAuthReady(true);
        }
      }
    };

    // Emergency escape hatch to prevent infinite loading
    const authTimeout = setTimeout(() => {
      if (!authReady) {
        console.warn('Auth bootstrap timed out - forcing authReady');
        setAuthStatusState(AUTH_STATUS.UNAUTHENTICATED);
        setAuthReady(true);
      }
    }, 10000); // 10 seconds timeout

    bootstrapAuth();

    // Cleanup function
    return () => {
      cancelled = true;
      clearTimeout(authTimeout);
    };
  }, []);

  // Rest of the code remains the same...
}

export default App;

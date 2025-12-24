import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import { isAuthenticated, getCurrentUser, setAuthToken, setRefreshToken } from './utils/auth';
import { initializeSocket, disconnectSocket, disconnectSocketForLogout, resetLogoutFlag, onNewMessage } from './utils/socket';
import { playNotificationSound } from './utils/notifications';
import { initializeQuietMode } from './utils/quietMode';
import { preloadCriticalResources, preloadFeedData } from './utils/resourcePreloader';
import { startVersionCheck, checkForUpdate } from './utils/versionCheck';
import { checkVersion } from './utils/versionChecker';
import { useUpdateStore } from './state/updateStore';
import { registerSW } from 'virtual:pwa-register';
import api from './utils/api';
import axios from 'axios';
import { API_BASE_URL } from './config/api';
import logger from './utils/logger';
import { apiFetch } from './utils/apiClient';
import {
  AUTH_STATUS,
  getAuthStatus,
  setAuthStatus,
  markAuthenticated,
  markUnauthenticated
} from './state/authStatus';
import { AuthProvider } from './context/AuthContext';

// Eager load critical components (needed immediately)
// IMPORTANT: Only load components that DON'T use React Router hooks
import SafetyWarning from './components/SafetyWarning';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import CookieBanner from './components/CookieBanner';
import ErrorBoundary from './components/ErrorBoundary';
import UpdateBanner from './components/UpdateBanner';
import { AppReadyProvider } from './state/appReady';
import LoadingGate from './components/LoadingGate';
import useAppVersion from './hooks/useAppVersion';

// Harden lazy imports: catch failures and reload to clear stale cache
const lazyWithReload = (importFn) => {
  return lazy(() =>
    importFn().catch((err) => {
      console.error('Lazy load failed, reloading page to clear cache...', err);
      window.location.reload();
      return { default: () => null }; // Fallback to prevent crash during reload
    })
  );
};

// Lazy load ALL pages with cache-mismatch protection
const Home = lazyWithReload(() => import('./pages/Home'));
const Login = lazyWithReload(() => import('./pages/Login'));
const Register = lazyWithReload(() => import('./pages/Register'));
const Footer = lazyWithReload(() => import('./components/Footer'));
const ForgotPassword = lazyWithReload(() => import('./pages/ForgotPassword'));
const ResetPassword = lazyWithReload(() => import('./pages/ResetPassword'));
const Feed = lazyWithReload(() => import('./pages/Feed'));
const FollowingFeed = lazyWithReload(() => import('./pages/FollowingFeed'));
const Journal = lazyWithReload(() => import('./pages/Journal'));
const Longform = lazyWithReload(() => import('./pages/Longform'));
const Discover = lazyWithReload(() => import('./pages/Discover'));
const TagFeed = lazyWithReload(() => import('./pages/TagFeed'));
const PhotoEssay = lazyWithReload(() => import('./pages/PhotoEssay'));
const Profile = lazyWithReload(() => import('./pages/Profile'));
const Followers = lazyWithReload(() => import('./pages/Followers'));
const Following = lazyWithReload(() => import('./pages/Following'));
const Settings = lazyWithReload(() => import('./pages/Settings'));
const SecuritySettings = lazyWithReload(() => import('./pages/SecuritySettings'));
const PrivacySettings = lazyWithReload(() => import('./pages/PrivacySettings'));
const Bookmarks = lazyWithReload(() => import('./pages/Bookmarks'));
const Events = lazyWithReload(() => import('./pages/Events'));
const Messages = lazyWithReload(() => import('./pages/Messages'));
const Lounge = lazyWithReload(() => import('./pages/Lounge'));
const Notifications = lazyWithReload(() => import('./pages/Notifications'));
const Admin = lazyWithReload(() => import('./pages/Admin'));
const Hashtag = lazyWithReload(() => import('./pages/Hashtag'));
const ReactivateAccount = lazyWithReload(() => import('./pages/ReactivateAccount'));

// Lazy load legal pages with cache-mismatch protection
const Terms = lazyWithReload(() => import('./pages/legal/Terms'));
const Privacy = lazyWithReload(() => import('./pages/legal/Privacy'));
const Community = lazyWithReload(() => import('./pages/legal/Community'));
const Safety = lazyWithReload(() => import('./pages/legal/Safety'));
const Security = lazyWithReload(() => import('./pages/legal/Security'));
const Contact = lazyWithReload(() => import('./pages/legal/Contact'));
const FAQ = lazyWithReload(() => import('./pages/legal/FAQ'));
const LegalRequests = lazyWithReload(() => import('./pages/legal/LegalRequests'));
const DMCA = lazyWithReload(() => import('./pages/legal/DMCA'));
const AcceptableUse = lazyWithReload(() => import('./pages/legal/AcceptableUse'));
const CookiePolicy = lazyWithReload(() => import('./pages/legal/CookiePolicy'));
const Helplines = lazyWithReload(() => import('./pages/legal/Helplines'));

// Layout components - eager load for immediate layout switching
import MobileLayout from './layouts/MobileLayout';
import DesktopLayout from './layouts/DesktopLayout';

// Loading fallback component with timeout
const PageLoader = () => {
  const [showReload, setShowReload] = useState(false);

  useEffect(() => {
    // If loading takes more than 10 seconds, show reload button
    const timeout = setTimeout(() => {
      setShowReload(true);
    }, 10000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#f7f7f7', // Hardcoded fallback color
      color: '#2b2b2b'
    }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #6C5CE7',
          borderTop: '4px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }}></div>
        <p style={{ marginBottom: '1rem' }}>Loading...</p>

        {showReload && (
          <div style={{ marginTop: '2rem' }}>
            <p style={{
              marginBottom: '1rem',
              color: '#616161',
              fontSize: '0.9rem'
            }}>
              Taking longer than expected...
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                border: '2px solid #6C5CE7',
                background: '#6C5CE7',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Reload Page
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  // CRITICAL: Use 3-state auth model to prevent redirect loops
  // - "loading": Auth state unknown (initial state, checking token)
  // - "authenticated": User is confirmed logged in
  // - "unauthenticated": User is confirmed logged out
  const [authStatus, setAuthStatusState] = useState(AUTH_STATUS.UNKNOWN);
  const [initError, setInitError] = useState(false);

  // Update banner state - using new version checker
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(true);

  // Derived state for backward compatibility
  const isAuth = authStatus === AUTH_STATUS.AUTHENTICATED;
  const authLoading = authStatus === AUTH_STATUS.UNKNOWN;

  // Detect mobile vs desktop for layout switching
  const [isMobile, setIsMobile] = useState(
    window.matchMedia('(max-width: 768px)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleResize = (e) => setIsMobile(e.matches);

    mediaQuery.addEventListener('change', handleResize);
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, []);

  useEffect(() => {
    // 🔥 PRE-WARM BACKEND: Wake backend immediately on app load
    // This prevents cold start delays on first API call
    const preWarmBackend = async () => {
      try {
        // Use lightweight health endpoint to wake backend
        // This doesn't require auth and is very fast
        await fetch(API_BASE_URL.replace('/api', '') + '/api/health', {
          credentials: 'include',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        logger.debug('🔥 Backend pre-warmed successfully');
      } catch (error) {
        // Silently fail - this is just an optimization
        logger.debug('Backend pre-warm failed (non-critical):', error);
      }
    };

    // Start pre-warming immediately (non-blocking)
    preWarmBackend();

    // CRITICAL: Bootstrap auth state on app load
    // This prevents refresh loops and ensures CSRF token is available
    const bootstrapAuth = async () => {
      try {
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
      }
    };

    bootstrapAuth();

    // 🔄 Register service worker with auto-update handling
    // This will automatically reload the page when a new service worker is installed
    const updateSW = registerSW({
      immediate: true,
      async onNeedRefresh() {
        console.log('🔄 New service worker available - clearing caches and reloading...');

        // Clear all caches before updating to ensure fresh content
        try {
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            console.log(`🗑️ Clearing ${cacheNames.length} caches before update...`);
            await Promise.all(cacheNames.map(name => caches.delete(name)));
          }
        } catch (error) {
          console.error('⚠️ Error clearing caches:', error);
        }

        // Automatically reload when new service worker is ready
        // This ensures users always get the latest version
        updateSW(true);
      },
      onOfflineReady() {
        console.log('✅ App ready to work offline');
      },
      onRegistered(registration) {
        console.log('✅ Service worker registered');
        // Check for updates every 5 minutes (more frequent for faster updates)
        if (registration) {
          setInterval(() => {
            console.log('🔍 Checking for service worker updates...');
            registration.update();
          }, 5 * 60 * 1000); // 5 minutes (changed from 1 hour)
        }
      },
      onRegisterError(error) {
        console.error('❌ Service worker registration failed:', error);
      }
    });

    // ✅ FIXED: Use ONLY ONE version checker (backend API)
    // Removed duplicate startVersionCheck() to prevent banner spam

    // Expose checkForUpdate globally for testing in console
    // Usage: window.checkForUpdate()
    window.checkForUpdate = checkForUpdate;

    // Subscribe to update notifications
    const unsubscribe = useUpdateStore(setUpdateAvailable);

    // Check immediately on load
    checkVersion();

    // ✅ FIXED: Reduced from 60s to 5 minutes to prevent spam
    const versionCheckInterval = setInterval(checkVersion, 5 * 60 * 1000); // 5 minutes

    // ✅ FIXED: Debounced focus check to prevent rapid checks
    let focusTimeout;
    const onFocus = () => {
      clearTimeout(focusTimeout);
      focusTimeout = setTimeout(checkVersion, 2000); // Wait 2s after focus
    };
    window.addEventListener('focus', onFocus);

    // ✅ REMOVED: visibility and online checks - redundant with focus check

    // Cleanup
    return () => {
      clearTimeout(focusTimeout);
      unsubscribe();
      clearInterval(versionCheckInterval);
      window.removeEventListener('focus', onFocus);
    };

    // Initialize Quiet Mode globally - only when authenticated
    const initQuietMode = async (retries = 3) => {
      // Only initialize if authenticated
      if (authStatus !== AUTH_STATUS.AUTHENTICATED) {
        return;
      }

      try {
        // Use apiFetch with cache to prevent duplicate requests
        const user = await apiFetch(
          '/auth/me',
          {},
          { cacheTtl: 300_000 } // 5 minutes cache
        );

        if (!user) {
          throw new Error('Failed to fetch user data');
        }

        // Initialize quiet mode with user settings
        initializeQuietMode(user);
        setInitError(false);
      } catch (error) {
        logger.error('Failed to initialize quiet mode:', error);

        // Retry if we have retries left
        if (retries > 0) {
          logger.debug(`Retrying quiet mode initialization... (${retries} retries left)`);
          setTimeout(() => initQuietMode(retries - 1), 2000);
        } else {
          logger.warn('Quiet mode initialization failed after all retries');
          // Don't block the app - just use default settings
          setInitError(true);
        }
      }
    };

    // Only initialize quiet mode when authenticated
    if (authStatus === AUTH_STATUS.AUTHENTICATED) {
      initQuietMode();
    }

    // Initialize Socket.IO when user is authenticated
    if (authStatus === AUTH_STATUS.AUTHENTICATED) {
      // 🔥 CRITICAL: Reset logout flag when user is authenticated
      // This allows socket to reconnect after a fresh login
      resetLogoutFlag();

      const user = getCurrentUser();
      if (user && (user.id || user._id)) {
        try {
          initializeSocket(user.id || user._id);

          // NOTE: Notification permission is now requested only when user explicitly
          // enables notifications in Settings, not automatically on login.
          // This prevents browser console violations about requesting permission
          // without user gesture.

          // Listen for new messages and play sound
          const cleanupNewMessage = onNewMessage((msg) => {
            playNotificationSound().catch(err => {
              logger.warn('Failed to play notification sound:', err);
            });
          });

          // Cleanup on unmount or when user logs out
          return () => {
            cleanupNewMessage?.();
            if (authStatus !== AUTH_STATUS.AUTHENTICATED) {
              // Use logout-specific disconnect to prevent reconnection
              disconnectSocketForLogout();
            }
          };
        } catch (error) {
          logger.error('Socket initialization failed:', error);
          // Don't block the app - socket features just won't work
        }
      }
    } else if (authStatus === AUTH_STATUS.UNAUTHENTICATED) {
      // 🔥 CRITICAL: User is not authenticated, ensure socket is disconnected
      disconnectSocketForLogout();
    }
  }, [authStatus]);

  const PrivateRoute = ({ children }) => {
    // CRITICAL: Don't redirect while auth state is loading
    // This prevents redirect loops
    if (authLoading) {
      return <PageLoader />;
    }

    return isAuth ? children : <Navigate to="/login" />;
  };

  return (
    <ErrorBoundary>
      <AppReadyProvider>
        <LoadingGate>
          <AuthProvider>
            <Router>
              <Suspense fallback={<PageLoader />}>
                <div className="app-container">
                  {/* Safety Warning for high-risk regions */}
                  {isAuth && <SafetyWarning />}

                {/* Update banner for new deployments */}
                {updateAvailable && showUpdateBanner && (
                  <UpdateBanner onClose={() => setShowUpdateBanner(false)} />
                )}

                <main id="main-content">
                  <Routes>
            {/* Layout wrapper - switches between mobile and desktop */}
            <Route element={isMobile ? <MobileLayout /> : <DesktopLayout />}>
              {/* Public Home Page - Redirect to feed if logged in */}
              <Route path="/" element={
                authLoading ? <PageLoader /> :
                !isAuth ? <Home /> : <Navigate to="/feed" />
              } />

            {/* Auth Pages - Don't redirect while loading */}
            <Route path="/login" element={
              authLoading ? <PageLoader /> :
              !isAuth ? <Login setIsAuth={(val) => {
                setAuthStatusState(val ? AUTH_STATUS.AUTHENTICATED : AUTH_STATUS.UNAUTHENTICATED);
                if (val) markAuthenticated();
                else markUnauthenticated();
              }} /> : <Navigate to="/feed" />
            } />
            <Route path="/register" element={
              authLoading ? <PageLoader /> :
              !isAuth ? <Register setIsAuth={(val) => {
                setAuthStatusState(val ? AUTH_STATUS.AUTHENTICATED : AUTH_STATUS.UNAUTHENTICATED);
                if (val) markAuthenticated();
                else markUnauthenticated();
              }} /> : <Navigate to="/feed" />
            } />
            <Route path="/forgot-password" element={
              authLoading ? <PageLoader /> :
              !isAuth ? <ForgotPassword /> : <Navigate to="/feed" />
            } />
            <Route path="/reset-password" element={
              authLoading ? <PageLoader /> :
              !isAuth ? <ResetPassword /> : <Navigate to="/feed" />
            } />

            {/* Reactivate Account - accessible with valid tokens but deactivated account */}
            <Route path="/reactivate" element={
              authLoading ? <PageLoader /> :
              isAuth ? <ReactivateAccount /> : <Navigate to="/login" />
            } />

          {/* Protected Routes */}
          <Route path="/feed" element={<PrivateRoute><Feed /></PrivateRoute>} />
          <Route path="/feed/following" element={<PrivateRoute><FollowingFeed /></PrivateRoute>} /> {/* PHASE 2 */}
          <Route path="/journal" element={<PrivateRoute><Journal /></PrivateRoute>} /> {/* PHASE 3 */}
          <Route path="/longform" element={<PrivateRoute><Longform /></PrivateRoute>} /> {/* PHASE 3 */}
          <Route path="/discover" element={<PrivateRoute><Discover /></PrivateRoute>} /> {/* PHASE 4 */}
          <Route path="/tags/:slug" element={<PrivateRoute><TagFeed /></PrivateRoute>} /> {/* PHASE 4 */}
          <Route path="/photo-essay" element={<PrivateRoute><PhotoEssay /></PrivateRoute>} /> {/* OPTIONAL */}
          <Route path="/photo-essay/:id" element={<PrivateRoute><PhotoEssay /></PrivateRoute>} /> {/* OPTIONAL */}
          <Route path="/profile/:id" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/profile/:username/followers" element={<PrivateRoute><Followers /></PrivateRoute>} />
          <Route path="/profile/:username/following" element={<PrivateRoute><Following /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="/settings/security" element={<PrivateRoute><SecuritySettings /></PrivateRoute>} />
          <Route path="/settings/privacy" element={<PrivateRoute><PrivacySettings /></PrivateRoute>} />
          <Route path="/bookmarks" element={<PrivateRoute><Bookmarks /></PrivateRoute>} />
          <Route path="/events" element={<PrivateRoute><Events /></PrivateRoute>} />
          {/* PHASE 1 REFACTOR: Friends/Connections routes removed */}
          {/* <Route path="/connections" element={<PrivateRoute><Friends /></PrivateRoute>} /> */}
          {/* <Route path="/friends" element={<PrivateRoute><Friends /></PrivateRoute>} /> */}
          <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
          <Route path="/lounge" element={<PrivateRoute><Lounge /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
          <Route path="/hashtag/:tag" element={<PrivateRoute><Hashtag /></PrivateRoute>} />

          {/* Admin Panel - Hidden Route (requires admin role) */}
          <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />

          {/* Legal Pages - Public Access */}
          <Route path="/terms" element={<><Terms /><Footer /></>} />
          <Route path="/privacy" element={<><Privacy /><Footer /></>} />
          <Route path="/community" element={<><Community /><Footer /></>} />
          <Route path="/community-guidelines" element={<><Community /><Footer /></>} />
          <Route path="/safety" element={<><Safety /><Footer /></>} />
          <Route path="/security" element={<><Security /><Footer /></>} />
          <Route path="/contact" element={<><Contact /><Footer /></>} />
          <Route path="/faq" element={<><FAQ /><Footer /></>} />
          <Route path="/legal-requests" element={<><LegalRequests /><Footer /></>} />
          <Route path="/dmca" element={<><DMCA /><Footer /></>} />
          <Route path="/acceptable-use" element={<><AcceptableUse /><Footer /></>} />
          <Route path="/cookie-policy" element={<><CookiePolicy /><Footer /></>} />
          <Route path="/helplines" element={<><Helplines /><Footer /></>} />
            </Route>
            {/* End layout wrapper */}
          </Routes>
          </main>

          {/* PWA Install Prompt */}
          {isAuth && <PWAInstallPrompt />}

              {/* Cookie Banner */}
              <CookieBanner />
            </div>
          </Suspense>
        </Router>
      </AuthProvider>
      </LoadingGate>
    </AppReadyProvider>
    </ErrorBoundary>
  );
}

export default App;

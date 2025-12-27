import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import { getCurrentUser } from './utils/auth';
import { resetLogoutFlag, onNewMessage, disconnectSocketForLogout } from './utils/socket';
import { playNotificationSound } from './utils/notifications';
import { initializeQuietMode } from './utils/quietMode';
import { preloadCriticalResources, preloadFeedData } from './utils/resourcePreloader';
import { checkForUpdate } from './utils/versionCheck';
import { API_BASE_URL } from './config/api';
import logger from './utils/logger';
import { AuthProvider, useAuth, AUTH_STATES } from './context/AuthContext';
import { executePWASafetyChecks } from './utils/pwaSafety';
import { disablePWAAndReload, forceReloadWithCacheClear } from './utils/emergencyRecovery';
import { initOfflineManager } from './utils/offlineManager';
import DebugOverlay from './components/DebugOverlay';
import OfflineBanner from './components/OfflineBanner';

// Eager load critical components (needed immediately)
// IMPORTANT: Only load components that DON'T use React Router hooks
import SafetyWarning from './components/SafetyWarning';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import CookieBanner from './components/CookieBanner';
import ErrorBoundary from './components/ErrorBoundary';
import UpdateBanner from './components/UpdateBanner';
import AuthLoadingScreen from './components/AuthLoadingScreen'; // 🔥 NEW: Global auth loading screen
import AuthGate from './components/AuthGate'; // 🔥 NEW: Auth gate wrapper
import { AppReadyProvider } from './state/appReady';
import LoadingGate from './components/LoadingGate';
import RoleRoute from './components/RoleRoute'; // Role-based route protection for admin
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
const Search = lazyWithReload(() => import('./pages/Search'));
// Phase 2B: TagFeed removed - redirects to /groups/:slug
const GroupsList = lazyWithReload(() => import('./pages/GroupsList')); // Phase 2: Groups listing
const Groups = lazyWithReload(() => import('./pages/Groups')); // Phase 2: Individual group page
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
// Phase 2B: Hashtag removed - redirects to /groups/:tag
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
const TrustAndSafety = lazyWithReload(() => import('./pages/legal/TrustAndSafety')); // Phase 6B
const PlatformGuarantees = lazyWithReload(() => import('./pages/PlatformGuarantees')); // Phase 7A

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

/**
 * PrivateRoute - Protects routes that require authentication
 * Uses AuthContext for auth state (single source of truth)
 */
function PrivateRoute({ children }) {
  const { authStatus } = useAuth();

  // Show loading while auth is being verified
  if (authStatus === AUTH_STATES.LOADING) {
    return <PageLoader />;
  }

  // Redirect to login if not authenticated
  if (authStatus === AUTH_STATES.UNAUTHENTICATED) {
    return <Navigate to="/login" />;
  }

  return children;
}

/**
 * Phase 2B: Tags → Groups Migration Redirects
 * Redirects /tags/:slug to /groups/:slug
 * Preserves bookmarks, SEO, avoids 404s
 */
function TagToGroupRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/groups/${slug}`} replace />;
}

/**
 * Phase 2B: Hashtag → Groups Migration Redirect
 * Redirects /hashtag/:tag to /groups/:tag
 */
function HashtagToGroupRedirect() {
  const { tag } = useParams();
  return <Navigate to={`/groups/${tag}`} replace />;
}

/**
 * AppContent - Main app content (inside AuthProvider)
 * Uses AuthContext for all auth state
 */
function AppContent() {
  const { authStatus, isAuthenticated, user, login } = useAuth();

  // Update banner state
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(true);

  // Derived state for convenience
  const isAuth = isAuthenticated;
  const authLoading = authStatus === AUTH_STATES.LOADING;

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

  // 🔥 AUTHENTICATED USER EFFECTS
  // These only run when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Initialize quiet mode with user settings
    initializeQuietMode(user);

    // Reset logout flag to allow socket reconnection
    resetLogoutFlag();

    // Listen for new messages and play sound
    const cleanupNewMessage = onNewMessage((msg) => {
      playNotificationSound().catch(err => {
        logger.warn('Failed to play notification sound:', err);
      });
    });

    // Preload resources for authenticated users
    Promise.all([
      preloadCriticalResources(),
      preloadFeedData()
    ]).catch(err => {
      logger.debug('Resource preload failed (non-critical):', err);
    });

    return () => {
      cleanupNewMessage?.();
    };
  }, [isAuthenticated, user]);

  // 🔥 UNAUTHENTICATED EFFECTS
  useEffect(() => {
    if (authStatus === AUTH_STATES.UNAUTHENTICATED) {
      disconnectSocketForLogout();
    }
  }, [authStatus]);

  // Expose checkForUpdate globally for testing
  useEffect(() => {
    window.checkForUpdate = checkForUpdate;
  }, []);

  return (
    <AuthGate>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <div className="app-container">
            {/* Phase 5C: Skip link for keyboard users */}
            <a href="#main-content" className="skip-link">
              Skip to main content
            </a>

            {/* Screen reader live region for announcements */}
            <div
              id="aria-live-announcer"
              aria-live="polite"
              aria-atomic="true"
              className="aria-live-region"
            />

            {/* Safety Warning for high-risk regions */}
            {isAuth && <SafetyWarning />}

            {/* Update banner for new deployments */}
            {updateAvailable && showUpdateBanner && (
              <UpdateBanner onClose={() => setShowUpdateBanner(false)} />
            )}

            <main id="main-content" role="main">
              <Routes>
                {/* Layout wrapper - switches between mobile and desktop */}
                <Route element={isMobile ? <MobileLayout /> : <DesktopLayout />}>
                  {/* Public Home Page - Redirect to feed if logged in */}
                  <Route path="/" element={
                    authLoading ? <PageLoader /> :
                    !isAuth ? <Home /> : <Navigate to="/feed" />
                  } />

                  {/* Auth Pages - Use AuthContext login function */}
                  <Route path="/login" element={
                    authLoading ? <PageLoader /> :
                    !isAuth ? <Login onLoginSuccess={login} /> : <Navigate to="/feed" />
                  } />
                  <Route path="/register" element={
                    authLoading ? <PageLoader /> :
                    !isAuth ? <Register onLoginSuccess={login} /> : <Navigate to="/feed" />
                  } />
                  <Route path="/forgot-password" element={
                    authLoading ? <PageLoader /> :
                    !isAuth ? <ForgotPassword /> : <Navigate to="/feed" />
                  } />
                  <Route path="/reset-password" element={
                    authLoading ? <PageLoader /> :
                    !isAuth ? <ResetPassword /> : <Navigate to="/feed" />
                  } />

                  {/* Reactivate Account */}
                  <Route path="/reactivate" element={
                    authLoading ? <PageLoader /> :
                    isAuth ? <ReactivateAccount /> : <Navigate to="/login" />
                  } />

                  {/* Protected Routes */}
                  <Route path="/feed" element={<PrivateRoute><Feed /></PrivateRoute>} />
                  <Route path="/feed/following" element={<PrivateRoute><FollowingFeed /></PrivateRoute>} />
                  <Route path="/journal" element={<PrivateRoute><Journal /></PrivateRoute>} />
                  <Route path="/longform" element={<PrivateRoute><Longform /></PrivateRoute>} />
                  <Route path="/discover" element={<PrivateRoute><Discover /></PrivateRoute>} />
                  <Route path="/search" element={<PrivateRoute><Search /></PrivateRoute>} />
                  <Route path="/groups" element={<PrivateRoute><GroupsList /></PrivateRoute>} />
                  <Route path="/groups/:slug" element={<PrivateRoute><Groups /></PrivateRoute>} />
                  <Route path="/photo-essay" element={<PrivateRoute><PhotoEssay /></PrivateRoute>} />
                  <Route path="/photo-essay/:id" element={<PrivateRoute><PhotoEssay /></PrivateRoute>} />
                  <Route path="/profile/:id" element={<PrivateRoute><Profile /></PrivateRoute>} />
                  <Route path="/profile/:username/followers" element={<PrivateRoute><Followers /></PrivateRoute>} />
                  <Route path="/profile/:username/following" element={<PrivateRoute><Following /></PrivateRoute>} />
                  <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                  <Route path="/settings/security" element={<PrivateRoute><SecuritySettings /></PrivateRoute>} />
                  <Route path="/settings/privacy" element={<PrivateRoute><PrivacySettings /></PrivateRoute>} />
                  <Route path="/bookmarks" element={<PrivateRoute><Bookmarks /></PrivateRoute>} />
                  <Route path="/events" element={<PrivateRoute><Events /></PrivateRoute>} />
                  <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
                  <Route path="/lounge" element={<PrivateRoute><Lounge /></PrivateRoute>} />
                  <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />

                  {/* Phase 2B: Tags → Groups Migration Redirects */}
                  {/* Preserve bookmarks, SEO, avoid 404s */}
                  <Route path="/tags" element={<Navigate to="/groups" replace />} />
                  <Route path="/tags/:slug" element={<TagToGroupRedirect />} />
                  <Route path="/hashtag/:tag" element={<HashtagToGroupRedirect />} />

                  {/* Admin Panel - Role-protected */}
                  <Route path="/admin" element={
                    <PrivateRoute>
                      <RoleRoute allowedRoles={['moderator', 'admin', 'super_admin']}>
                        <Admin />
                      </RoleRoute>
                    </PrivateRoute>
                  } />

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
                  <Route path="/trust-and-safety" element={<><TrustAndSafety /><Footer /></>} />
                  <Route path="/guarantees" element={<><PlatformGuarantees /><Footer /></>} />
                </Route>
              </Routes>
            </main>

            {/* PWA Install Prompt */}
            {isAuth && <PWAInstallPrompt />}

            {/* Cookie Banner */}
            <CookieBanner />
          </div>
        </Suspense>
      </Router>

      {/* 🔍 Debug Overlay - Toggle with ?debug=true or Ctrl+Shift+D */}
      <DebugOverlay />

      {/* 📴 Offline Banner - Shows when app is offline */}
      <OfflineBanner />
    </AuthGate>
  );
}

/**
 * App - Root component that provides all context providers
 * AuthProvider is the outermost provider for auth state
 */
function App() {
  // 🛡️ PWA SAFETY CHECKS (runs once on mount)
  useEffect(() => {
    const runPWASafetyChecks = async () => {
      try {
        logger.info('[App] 🛡️ Running PWA safety checks...');
        const safetyResult = await executePWASafetyChecks();

        if (!safetyResult.safe) {
          logger.warn('[App] 🔥 PWA safety check failed:', safetyResult.action);

          switch (safetyResult.action) {
            case 'disable_pwa':
              disablePWAAndReload(safetyResult.message);
              return;
            case 'force_reload':
            case 'version_mismatch':
              forceReloadWithCacheClear(safetyResult.message);
              return;
            default:
              logger.warn('[App] Unknown safety action:', safetyResult.action);
          }
        }

        logger.info('[App] ✅ PWA safety checks passed');
      } catch (error) {
        logger.error('[App] PWA safety checks failed:', error);
        // Continue anyway (fail open)
      }
    };

    // Initialize offline manager
    initOfflineManager();

    // Pre-warm backend (non-blocking)
    fetch(API_BASE_URL.replace('/api', '') + '/api/health', {
      credentials: 'include',
      signal: AbortSignal.timeout(5000)
    }).then(() => {
      logger.debug('🔥 Backend pre-warmed successfully');
    }).catch(() => {
      logger.debug('Backend pre-warm failed (non-critical)');
    });

    // Run PWA safety checks
    runPWASafetyChecks();
  }, []);

  return (
    <ErrorBoundary>
      <AppReadyProvider>
        <LoadingGate>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </LoadingGate>
      </AppReadyProvider>
    </ErrorBoundary>
  );
}

export default App;

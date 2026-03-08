import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import { getCurrentUser } from './utils/auth';
import { setupAuthLifecycle, cleanupAuthLifecycle } from './utils/authLifecycle';
import { resetLogoutFlag, onNewMessage, disconnectSocketForLogout } from './utils/socket';
import { playNotificationSound } from './utils/notifications';
import './utils/socketDiagnostics'; // Load diagnostics tool
import { applyUserTheme } from './utils/themeManager';
import { preloadCriticalResources, preloadFeedData } from './utils/resourcePreloader';
import { checkForUpdate } from './utils/versionCheck';
import { API_AUTH_URL } from './config/api';
import logger from './utils/logger';
import { AuthProvider, useAuth, AUTH_STATES } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { executePWASafetyChecks } from './utils/pwaSafety';
import { disablePWAAndReload, forceReloadWithCacheClear } from './utils/emergencyRecovery';
import { initOfflineManager } from './utils/offlineManager';
import { checkDomOrder } from './utils/domOrderCheck';
import { isPWA } from './utils/pwa';
import { initThemeListener, getThemePreference, setThemeMode } from './utils/themeManager';
import DebugOverlay from './components/DebugOverlay';
import OfflineBanner from './components/OfflineBanner';
import MaintenanceBanner from './components/MaintenanceBanner';
import OnboardingTour from './components/onboarding/OnboardingTour';
import QuietReturnToast from './components/onboarding/QuietReturnToast';

// Eager load critical components (needed immediately)
// IMPORTANT: Only load components that DON'T use React Router hooks
import SafetyWarning from './components/SafetyWarning';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import CookieBanner from './components/CookieBanner';
import PushNotificationPrompt from './components/PushNotificationPrompt';
import ErrorBoundary from './components/ErrorBoundary';
// UpdateBanner removed - updates now happen silently in background
import AuthLoadingScreen from './components/AuthLoadingScreen';
import AuthGate from './components/AuthGate';
import { AppReadyProvider } from './state/appReady';
import LoadingGate from './components/LoadingGate';
import RoleRoute from './components/RoleRoute';

// Harden lazy imports: catch failures gracefully (NEVER auto-reload - causes infinite loops!)
const lazyWithReload = (importFn) => {
  return lazy(async () => {
    try {
      return await importFn();
    } catch (err) {
      console.error('Lazy load failed:', err);
      return {
        default: () => (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <h2>Failed to load this page</h2>
            <p style={{ color: '#666' }}>This usually happens after an update. Please refresh to get the latest version.</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                backgroundColor: '#7c3aed',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Refresh Page
            </button>
          </div>
        )
      };
    }
  });
};

// Eagerly loaded entry pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// Lazy load remaining pages with cache-mismatch protection
const InviteRequired = lazyWithReload(() => import('./pages/InviteRequired'));
const Welcome = lazyWithReload(() => import('./pages/Welcome'));
const TourIntro = lazyWithReload(() => import('./pages/TourIntro'));
const Footer = lazyWithReload(() => import('./components/Footer'));
const ForgotPassword = lazyWithReload(() => import('./pages/ForgotPassword'));
const ResetPassword = lazyWithReload(() => import('./pages/ResetPassword'));
const VerifyEmail = lazyWithReload(() => import('./pages/VerifyEmail'));
const Feed = lazyWithReload(() => import('./pages/Feed'));
const FeedController = lazyWithReload(() => import('./features/feed/FeedController'));
const FollowingFeed = lazyWithReload(() => import('./pages/FollowingFeed'));
const Journal = lazyWithReload(() => import('./pages/Journal'));
const Longform = lazyWithReload(() => import('./pages/Longform'));
const Discover = lazyWithReload(() => import('./pages/Discover'));
const Search = lazyWithReload(() => import('./pages/Search'));
const GroupsList = lazyWithReload(() => import('./pages/GroupsList'));
const Groups = lazyWithReload(() => import('./pages/Groups'));
const PhotoEssay = lazyWithReload(() => import('./pages/PhotoEssay'));
const Profile = lazyWithReload(() => import('./pages/Profile'));
const Followers = lazyWithReload(() => import('./pages/Followers'));
const Following = lazyWithReload(() => import('./pages/Following'));
const Settings = lazyWithReload(() => import('./pages/Settings'));
const SecuritySettings = lazyWithReload(() => import('./pages/SecuritySettings'));
const PrivacySettings = lazyWithReload(() => import('./pages/PrivacySettings'));
const Bookmarks = lazyWithReload(() => import('./pages/Bookmarks'));
const Events = lazyWithReload(() => import('./pages/Events'));
const Messages = lazyWithReload(() => import('./apps/MessagesApp'));
const Lounge = lazyWithReload(() => import('./pages/Lounge'));
const Notifications = lazyWithReload(() => import('./pages/Notifications'));
const Admin = lazyWithReload(() => import('./pages/Admin'));
const ReactivateAccount = lazyWithReload(() => import('./pages/ReactivateAccount'));

// Lazy load legal pages
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
const TrustAndSafety = lazyWithReload(() => import('./pages/legal/TrustAndSafety'));
const PlatformGuarantees = lazyWithReload(() => import('./pages/PlatformGuarantees'));
const TrustCenter = lazyWithReload(() => import('./pages/TrustCenter'));
const CommunityGuidelines = lazyWithReload(() => import('./pages/CommunityGuidelines'));
const SafetyModeration = lazyWithReload(() => import('./pages/SafetyModeration'));
const SecurityOverview = lazyWithReload(() => import('./pages/SecurityOverview'));

// Layout components
import AppLayout from './layouts/AppLayout';
import FullViewportLayout from './layouts/FullViewportLayout';

// Loading fallback component with timeout
const PageLoader = () => {
  const [showReload, setShowReload] = useState(false);

  useEffect(() => {
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
      background: '#f7f7f7',
      color: '#2b2b2b'
    }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid var(--accent-primary)',
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
                border: '2px solid var(--accent-primary)',
                background: 'var(--accent-primary)',
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

function PrivateRoute({ children }) {
  const { authStatus } = useAuth();
  console.log('[PrivateRoute] authStatus:', authStatus);

  if (authStatus === AUTH_STATES.LOADING) {
    return <PageLoader />;
  }

  if (authStatus === AUTH_STATES.UNAUTHENTICATED) {
    console.warn('[PrivateRoute] Redirecting to /login');
    return <Navigate to="/login" />;
  }

  return children;
}

function TagToGroupRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/groups/${slug}`} replace />;
}

function HashtagToGroupRedirect() {
  const { tag } = useParams();
  return <Navigate to={`/groups/${tag}`} replace />;
}

function AppContent() {
  const { authStatus, isAuthenticated, isAuthReady, user, login, updateUser } = useAuth();

  // Note: Version updates now happen silently via checkAndApplyPendingUpdate in main.jsx
  // No banner is shown - updates apply automatically on next page load

  const [showTour, setShowTour] = useState(false);
  const isAuth = isAuthenticated;
  const authLoading = authStatus === AUTH_STATES.LOADING;

  useEffect(() => {
    if (isAuthenticated && user && user.showTour === true) {
      const timer = setTimeout(() => {
        setShowTour(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    const cleanup = setupAuthLifecycle();
    return () => cleanup?.();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !isAuthenticated || !user) return;

    applyUserTheme(user);
    resetLogoutFlag();

    const cleanupNewMessage = onNewMessage((msg) => {
      playNotificationSound().catch(err => {
        logger.warn('Failed to play notification sound:', err);
      });
    });

    Promise.all([
      preloadCriticalResources(),
      preloadFeedData(),
      import('./pages/Feed').catch(() => {})
    ]).catch(err => {
      logger.debug('Resource preload failed:', err);
    });

    return () => {
      cleanupNewMessage?.();
    };
  }, [isAuthReady, isAuthenticated, user]);

  useEffect(() => {
    if (authStatus === AUTH_STATES.UNAUTHENTICATED) {
      disconnectSocketForLogout();
      cleanupAuthLifecycle();
    }
  }, [authStatus]);

  useEffect(() => {
    window.checkForUpdate = checkForUpdate;
  }, []);

  useEffect(() => {
    checkDomOrder();
  }, []);

  return (
    <AuthGate>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <div className="app-container">
            <a href="#main-content" className="skip-link">
              Skip to main content
            </a>

            <div
              id="aria-live-announcer"
              aria-live="polite"
              aria-atomic="true"
              className="aria-live-region"
            />

            {isAuth && <SafetyWarning />}

            {/* Update banner removed - updates now happen silently in background */}

            <main id="main-content" role="main">
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path="/" element={
                    authLoading ? <PageLoader /> :
                    !isAuth ? <Home /> : <Navigate to="/feed" />
                  } />

                  <Route path="/login" element={
                    authLoading ? <PageLoader /> :
                    !isAuth ? <Login onLoginSuccess={login} /> : <Navigate to="/feed" />
                  } />
                  <Route path="/register" element={
                    authLoading ? <PageLoader /> :
                    !isAuth ? <Register onLoginSuccess={login} /> : <Navigate to="/feed" />
                  } />
                  <Route path="/invite-required" element={
                    authLoading ? <PageLoader /> :
                    !isAuth ? <InviteRequired /> : <Navigate to="/feed" />
                  } />
                  <Route path="/forgot-password" element={
                    authLoading ? <PageLoader /> :
                    !isAuth ? <ForgotPassword /> : <Navigate to="/feed" />
                  } />
                  <Route path="/reset-password" element={
                    authLoading ? <PageLoader /> :
                    !isAuth ? <ResetPassword /> : <Navigate to="/feed" />
                  } />
                  <Route path="/verify-email" element={<VerifyEmail />} />

                  <Route path="/reactivate" element={
                    authLoading ? <PageLoader /> :
                    isAuth ? <ReactivateAccount /> : <Navigate to="/login" />
                  } />

                  <Route path="/welcome" element={<PrivateRoute><Welcome /></PrivateRoute>} />
                  <Route path="/tour-intro" element={<PrivateRoute><TourIntro /></PrivateRoute>} />

                  <Route path="/feed" element={<PrivateRoute><Feed /></PrivateRoute>} />
                  <Route path="/feed-v2" element={<PrivateRoute><FeedController /></PrivateRoute>} />
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
                  <Route path="/settings/safety" element={<Navigate to="/settings/privacy" replace />} />
                  <Route path="/bookmarks" element={<PrivateRoute><Bookmarks /></PrivateRoute>} />
                  <Route path="/events" element={<PrivateRoute><Events /></PrivateRoute>} />
                  <Route path="/lounge" element={<PrivateRoute><Lounge /></PrivateRoute>} />
                  <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />

                  <Route path="/tags" element={<Navigate to="/groups" replace />} />
                  <Route path="/tags/:slug" element={<TagToGroupRedirect />} />
                  <Route path="/hashtag/:tag" element={<HashtagToGroupRedirect />} />

                  <Route path="/admin" element={
                    <PrivateRoute>
                      <RoleRoute allowedRoles={['moderator', 'admin', 'super_admin']}>
                        <Admin />
                      </RoleRoute>
                    </PrivateRoute>
                  } />

                  <Route path="/trust-center" element={<><TrustCenter /><Footer /></>} />
                  <Route path="/terms" element={<><Terms /><Footer /></>} />
                  <Route path="/privacy" element={<><Privacy /><Footer /></>} />
                  <Route path="/dmca" element={<><DMCA /><Footer /></>} />
                  <Route path="/community-guidelines" element={<><CommunityGuidelines /><Footer /></>} />
                  <Route path="/safety-moderation" element={<><SafetyModeration /><Footer /></>} />
                  <Route path="/security" element={<><SecurityOverview /><Footer /></>} />

                  <Route path="/acceptable-use" element={<Navigate to="/community-guidelines" replace />} />
                  <Route path="/safety" element={<Navigate to="/safety-moderation" replace />} />
                  <Route path="/safety-center" element={<Navigate to="/safety-moderation" replace />} />
                  <Route path="/trust-safety" element={<Navigate to="/safety-moderation" replace />} />
                  <Route path="/trust-and-safety" element={<Navigate to="/safety-moderation" replace />} />
                  <Route path="/cookie-policy" element={<Navigate to="/privacy" replace />} />

                  <Route path="/community" element={<><Community /><Footer /></>} />
                  <Route path="/contact" element={<><Contact /><Footer /></>} />
                  <Route path="/faq" element={<><FAQ /><Footer /></>} />
                  <Route path="/legal-requests" element={<><LegalRequests /><Footer /></>} />
                  <Route path="/helplines" element={<><Helplines /><Footer /></>} />
                  <Route path="/guarantees" element={<><PlatformGuarantees /><Footer /></>} />

                  <Route path="/@:slug" element={<PrivateRoute><Profile /></PrivateRoute>} />
                </Route>

                <Route element={<FullViewportLayout />}>
                  <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
                </Route>
              </Routes>
            </main>

            <PWAInstallPrompt />
            <CookieBanner />
            {isAuthenticated && <PushNotificationPrompt />}

            <OnboardingTour
              isOpen={showTour}
              onClose={() => {
                setShowTour(false);
                if (updateUser) {
                  updateUser({ showTour: false, hasCompletedTour: true });
                }
              }}
              onComplete={() => {
                if (updateUser) {
                  updateUser({ showTour: false, hasCompletedTour: true });
                }
              }}
            />

            {user && (user.hasCompletedTour || user.hasSkippedTour || user.onboardingTourDismissed) && (
              <QuietReturnToast />
            )}
          </div>
        </Suspense>
      </Router>

      <DebugOverlay />
      <OfflineBanner />
      <MaintenanceBanner />
    </AuthGate>
  );
}

function App() {
  useEffect(() => {
    const cleanup = initThemeListener();
    const preference = getThemePreference();
    if (preference !== 'auto') {
      setThemeMode(preference);
    }
    logger.info('[App] Theme listener initialized, preference:', preference);
    return cleanup;
  }, []);

  useEffect(() => {
    const checkPWA = () => {
      const pwaMode = isPWA();
      if (pwaMode) {
        document.body.classList.add('pwa-mode');
        document.body.classList.remove('browser-mode');
      } else {
        document.body.classList.add('browser-mode');
        document.body.classList.remove('pwa-mode');
      }
      logger.info('[App] Running in PWA mode:', pwaMode);
    };

    checkPWA();
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => checkPWA();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  useEffect(() => {
    const runPWASafetyChecks = async () => {
      try {
        logger.info('[App] Running PWA safety checks...');
        const safetyResult = await executePWASafetyChecks();

        if (!safetyResult.safe) {
          logger.warn('[App] PWA safety check failed:', safetyResult.action);
          switch (safetyResult.action) {
            case 'maintenance': {
              // Check for admin bypass - admins can continue using the site during maintenance
              const isAdminBypass = localStorage.getItem('admin_maintenance_bypass') === 'true';
              const userRole = localStorage.getItem('user_role');
              const isAdmin = userRole === 'admin' || userRole === 'super_admin';
              
              if (isAdminBypass || isAdmin) {
                logger.warn('[App] ⚠️ Admin bypass - showing maintenance warning banner');
                // Store maintenance info for the banner
                sessionStorage.setItem('maintenance_warning', JSON.stringify({
                  message: safetyResult.message,
                  eta: safetyResult.eta
                }));
                // Continue with app - show warning banner instead
                return;
              }
              
              // Redirect to maintenance page with optional message
              const maintenanceUrl = safetyResult.message 
                ? `/maintenance.html?message=${encodeURIComponent(safetyResult.message)}`
                : '/maintenance.html';
              window.location.href = maintenanceUrl;
              return;
            }
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
        logger.info('[App] PWA safety checks passed');
      } catch (error) {
        logger.error('[App] PWA safety checks failed:', error);
      }
    };

    initOfflineManager();
    runPWASafetyChecks();
  }, []);

  return (
    <ErrorBoundary>
      <AppReadyProvider>
        <LoadingGate>
          <AuthProvider>
            <SocketProvider>
              <AppContent />
            </SocketProvider>
          </AuthProvider>
        </LoadingGate>
      </AppReadyProvider>
    </ErrorBoundary>
  );
}

export default App;

/**
 * AuthGate - Blocks all UI until auth verification completes
 *
 * 🔥 CRITICAL: This is the FOUNDATIONAL auth hardening feature
 *
 * Rules:
 * - Shows AuthLoadingScreen while authLoading === true
 * - Prevents ANY protected UI or API calls before authReady
 * - Only /auth/me is allowed during this phase
 *
 * This prevents:
 * - Premature API calls
 * - "Unknown User" flashes
 * - 401 spam during login
 * - Race conditions
 *
 * 🔥 LCP FIX: Public routes (/, /login, /register, /legal/*) are NOT blocked
 * This allows the landing page to render instantly without waiting for auth
 */

import { useAuth } from '../context/AuthContext';
import AuthLoadingScreen from './AuthLoadingScreen';

// Routes that should render immediately without waiting for auth
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/terms',
  '/privacy',
  '/community',
  '/safety',
  '/cookie-policy',
  '/invite-required'
];

function AuthGate({ children }) {
  const { authLoading } = useAuth();

  // 🔥 LCP FIX: Don't block public routes - let them render immediately
  const currentPath = window.location.pathname;
  const isPublicRoute = PUBLIC_ROUTES.some(route =>
    currentPath === route || currentPath.startsWith('/legal/')
  );

  // Public routes render immediately (no auth blocking)
  if (isPublicRoute) {
    return children;
  }

  // 🔥 BLOCK private UI until auth verification completes
  if (authLoading) {
    return <AuthLoadingScreen />;
  }

  // Auth verification complete - render app
  return children;
}

export default AuthGate;


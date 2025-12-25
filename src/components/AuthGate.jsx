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
 */

import { useAuth } from '../context/AuthContext';
import AuthLoadingScreen from './AuthLoadingScreen';

function AuthGate({ children }) {
  const { authLoading } = useAuth();

  // 🔥 BLOCK ALL UI until auth verification completes
  if (authLoading) {
    return <AuthLoadingScreen />;
  }

  // Auth verification complete - render app
  return children;
}

export default AuthGate;


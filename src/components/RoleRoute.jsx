/**
 * RoleRoute - Role-based route protection wrapper
 * 
 * PURPOSE:
 * Prevents unauthorized users from mounting protected components by checking
 * user role BEFORE the component renders. This eliminates UI flash and prevents
 * unnecessary API calls from unauthorized users.
 * 
 * USAGE:
 * <PrivateRoute>
 *   <RoleRoute allowedRoles={['moderator', 'admin', 'super_admin']}>
 *     <Admin />
 *   </RoleRoute>
 * </PrivateRoute>
 * 
 * BEHAVIOR:
 * - While auth is loading → show PageLoader
 * - If user is unauthenticated → redirect to /login (handled by PrivateRoute)
 * - If role is not allowed → redirect to / immediately
 * - If role is allowed → render children
 * 
 * DEFENSE-IN-DEPTH:
 * This is an additional layer on top of:
 * - PrivateRoute (checks authentication)
 * - Backend middleware (enforces permissions)
 * - Component-level checks (validates specific actions)
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * PageLoader component (inline to avoid circular dependencies)
 */
const PageLoader = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'var(--background-color, #f7f7f7)',
      color: 'var(--text-color, #2b2b2b)'
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
        <p style={{ marginBottom: '1rem' }}>Verifying access...</p>
      </div>
    </div>
  );
};

/**
 * RoleRoute Component
 * 
 * @param {Object} props
 * @param {string[]} props.allowedRoles - Array of allowed role names (e.g., ['moderator', 'admin', 'super_admin'])
 * @param {React.ReactNode} props.children - Component to render if role is allowed
 * @param {string} props.redirectTo - Path to redirect to if role is not allowed (default: '/')
 * @returns {React.ReactNode}
 */
function RoleRoute({ children, allowedRoles = [], redirectTo = '/' }) {
  const { user, loading, authLoading } = useAuth();

  // STEP 1: Wait for auth to complete
  // This prevents premature redirects during app initialization
  if (loading || authLoading) {
    return <PageLoader />;
  }

  // STEP 2: Check if user exists
  // If no user, PrivateRoute will handle redirect to /login
  // This is a safety check in case RoleRoute is used without PrivateRoute
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // STEP 3: Check if user's role is in the allowed list
  // This is the core role-based access control
  const userRole = user.role;
  const isAllowed = allowedRoles.includes(userRole);

  if (!isAllowed) {
    // User is authenticated but doesn't have the required role
    // Redirect immediately - component never mounts
    console.warn(`[RoleRoute] Access denied: User role "${userRole}" not in allowed roles [${allowedRoles.join(', ')}]`);
    return <Navigate to={redirectTo} replace />;
  }

  // STEP 4: User has required role - render children
  return children;
}

export default RoleRoute;


/**
 * MessagesApp — Feature Flag Router
 * 
 * Phase 1 Scaffold: Routes between legacy and new implementation.
 * 
 * Environment Variable:
 *   VITE_USE_NEW_MESSAGES_APP=true  → Use new MessagesApp
 *   VITE_USE_NEW_MESSAGES_APP=false → Use legacy Messages (default)
 * 
 * This allows parallel testing and safe rollback.
 */

import { lazy, Suspense } from 'react';

// Feature flag - defaults to legacy implementation
const USE_NEW_MESSAGES_APP = 
  import.meta.env.VITE_USE_NEW_MESSAGES_APP === 'true';

// Lazy load both implementations
const MessagesApp = lazy(() => import('./MessagesApp'));
const LegacyMessages = lazy(() => import('../../pages/Messages'));

// Loading fallback
function MessagesLoadingSkeleton() {
  return (
    <div className="messages-loading-skeleton" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: 'var(--text-secondary)'
    }}>
      Loading messages...
    </div>
  );
}

export default function MessagesRouter(props) {
  const Component = USE_NEW_MESSAGES_APP ? MessagesApp : LegacyMessages;
  
  return (
    <Suspense fallback={<MessagesLoadingSkeleton />}>
      <Component {...props} />
    </Suspense>
  );
}


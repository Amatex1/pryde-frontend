/**
 * Resilience Components Index
 * PHASE 3: Export all frontend resilience components and hooks
 * 
 * These components and hooks ensure:
 * - No white screens from unhandled errors
 * - Consistent loading/error/empty states
 * - Action locking to prevent double-posting
 */

// Error Boundaries
export { default as PageErrorBoundary } from '../PageErrorBoundary';
export { default as ErrorBoundary } from '../ErrorBoundary';

// Async State Handling
export { default as AsyncStateWrapper } from '../AsyncStateWrapper';

// Action Locking
export { default as LockedButton } from '../LockedButton';

// Re-export hooks for convenience
export { useFetch, FetchState } from '../../hooks/useFetch';
export { useActionLock, ActionState } from '../../hooks/useActionLock';
export { useMutation } from '../../hooks/useMutation';


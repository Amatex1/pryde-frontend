/**
 * AsyncStateWrapper - Unified component for handling async states
 * PHASE 3: Ensures consistent loading/error/empty handling across the app
 * 
 * Features:
 * - Renders appropriate UI for loading, error, empty, and success states
 * - Provides consistent UX across the platform
 * - Supports custom renderers for each state
 * - Prevents conditional rendering without guards
 */

import React from 'react';
import './AsyncStateWrapper.css';

/**
 * Default loading component
 */
const DefaultLoading = ({ message }) => (
  <div className="async-loading">
    <div className="async-loading-spinner" />
    {message && <p className="async-loading-message">{message}</p>}
  </div>
);

/**
 * Default error component
 */
const DefaultError = ({ error, onRetry }) => (
  <div className="async-error">
    <div className="async-error-icon">⚠️</div>
    <h3 className="async-error-title">Something went wrong</h3>
    <p className="async-error-message">
      {error?.message || 'Failed to load. Please try again.'}
    </p>
    {onRetry && (
      <button className="async-error-retry" onClick={onRetry}>
        Try Again
      </button>
    )}
  </div>
);

/**
 * Default empty component
 */
const DefaultEmpty = ({ message }) => (
  <div className="async-empty">
    <div className="async-empty-icon">📭</div>
    <p className="async-empty-message">
      {message || 'Nothing here yet'}
    </p>
  </div>
);

/**
 * AsyncStateWrapper - Wraps async content with state handling
 * 
 * @param {Object} props
 * @param {boolean} props.isLoading - Whether data is loading
 * @param {boolean} props.isError - Whether an error occurred
 * @param {boolean} props.isEmpty - Whether data is empty
 * @param {Error} props.error - Error object if isError is true
 * @param {Function} props.onRetry - Retry function for error state
 * @param {ReactNode} props.children - Content to render on success
 * @param {ReactNode|Function} props.loadingComponent - Custom loading component
 * @param {ReactNode|Function} props.errorComponent - Custom error component
 * @param {ReactNode|Function} props.emptyComponent - Custom empty component
 * @param {string} props.loadingMessage - Message to show while loading
 * @param {string} props.emptyMessage - Message to show when empty
 * @param {string} props.className - Additional CSS class
 */
const AsyncStateWrapper = ({
  isLoading,
  isError,
  isEmpty,
  error,
  onRetry,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent,
  loadingMessage,
  emptyMessage,
  className = '',
}) => {
  // Loading state - always render loading UI
  if (isLoading) {
    if (loadingComponent) {
      return typeof loadingComponent === 'function' 
        ? loadingComponent({ message: loadingMessage })
        : loadingComponent;
    }
    return (
      <div className={`async-wrapper ${className}`}>
        <DefaultLoading message={loadingMessage} />
      </div>
    );
  }

  // Error state - always render error UI with retry option
  if (isError) {
    if (errorComponent) {
      return typeof errorComponent === 'function'
        ? errorComponent({ error, onRetry })
        : errorComponent;
    }
    return (
      <div className={`async-wrapper ${className}`}>
        <DefaultError error={error} onRetry={onRetry} />
      </div>
    );
  }

  // Empty state - render empty UI
  if (isEmpty) {
    if (emptyComponent) {
      return typeof emptyComponent === 'function'
        ? emptyComponent({ message: emptyMessage })
        : emptyComponent;
    }
    return (
      <div className={`async-wrapper ${className}`}>
        <DefaultEmpty message={emptyMessage} />
      </div>
    );
  }

  // Success state - render children
  return <>{children}</>;
};

export default AsyncStateWrapper;


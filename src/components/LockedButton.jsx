/**
 * LockedButton - Button with built-in action locking and feedback
 * PHASE 3: Prevents double-clicks and shows clear success/error feedback
 * 
 * Features:
 * - Automatic disabling during action
 * - Loading spinner while pending
 * - Success/error feedback
 * - Prevents double-posting
 */

import React from 'react';
import { useActionLock, ActionState } from '../hooks/useActionLock';
import './LockedButton.css';

/**
 * LockedButton - Self-locking button with feedback
 * 
 * @param {Object} props
 * @param {Function} props.onClick - Async function to execute on click
 * @param {ReactNode} props.children - Button content
 * @param {string} props.successMessage - Message to show on success
 * @param {string} props.errorMessage - Message to show on error
 * @param {boolean} props.disabled - External disabled state
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.variant - Button variant: primary, secondary, danger
 * @param {boolean} props.showFeedback - Whether to show success/error message
 * @param {Function} props.onSuccess - Callback on success
 * @param {Function} props.onError - Callback on error
 * @param {Object} props.rest - Additional button props
 */
const LockedButton = ({
  onClick,
  children,
  successMessage = 'Done!',
  errorMessage,
  disabled = false,
  className = '',
  variant = 'primary',
  showFeedback = true,
  onSuccess,
  onError,
  ...rest
}) => {
  const {
    execute,
    isPending,
    isSuccess,
    isError,
    message,
  } = useActionLock({
    actionName: 'button-action',
    successResetMs: 1500,
    errorResetMs: 2500,
  });

  const handleClick = async (e) => {
    e.preventDefault();
    
    if (!onClick) return;

    try {
      await execute(onClick, {
        successMessage,
        errorMessage,
        onSuccess,
        onError,
      });
    } catch {
      // Error already handled by useActionLock
    }
  };

  const isDisabled = disabled || isPending;

  // Determine button content based on state
  const renderContent = () => {
    if (isPending) {
      return (
        <>
          <span className="locked-button-spinner" />
          <span className="locked-button-text">Working...</span>
        </>
      );
    }

    if (showFeedback && isSuccess) {
      return (
        <>
          <span className="locked-button-icon">✓</span>
          <span className="locked-button-text">{message || successMessage}</span>
        </>
      );
    }

    if (showFeedback && isError) {
      return (
        <>
          <span className="locked-button-icon">✗</span>
          <span className="locked-button-text">{message || 'Error'}</span>
        </>
      );
    }

    return children;
  };

  const stateClass = isPending ? 'pending' : isSuccess ? 'success' : isError ? 'error' : '';

  return (
    <button
      className={`locked-button locked-button--${variant} ${stateClass} ${className}`}
      onClick={handleClick}
      disabled={isDisabled}
      aria-busy={isPending}
      aria-disabled={isDisabled}
      {...rest}
    >
      {renderContent()}
    </button>
  );
};

export default LockedButton;


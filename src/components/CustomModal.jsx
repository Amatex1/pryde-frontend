import { useState, useEffect, useRef, useCallback } from 'react';
import './CustomModal.css';

/**
 * Custom Pryde-themed modal to replace JavaScript alert/confirm/prompt
 *
 * Types:
 * - 'alert': Simple message with OK button
 * - 'confirm': Message with Cancel and Confirm buttons
 * - 'prompt': Message with text input and Cancel/Submit buttons
 *
 * Accessibility (Phase 5C Enhanced):
 * - Focus trap keeps keyboard navigation within modal
 * - ARIA attributes for screen readers
 * - Escape key closes modal
 * - Focus returns to trigger element on close
 * - Prevents body scroll when open
 */
function CustomModal({
  isOpen,
  onClose,
  type = 'alert',
  title = '',
  message = '',
  placeholder = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm = null,
  inputType = 'text',
  defaultValue = '',
  children
}) {
  const [inputValue, setInputValue] = useState(defaultValue);
  const triggerRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    setInputValue(defaultValue);
  }, [defaultValue, isOpen]);

  // Store trigger element and handle focus return + body scroll lock
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement;
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
      if (triggerRef.current) {
        triggerRef.current.focus();
      }
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Phase 5C: Focus trap - keep focus within modal
  const handleKeyDown = useCallback((e) => {
    if (!isOpen || !modalRef.current) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === 'Tab') {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (type === 'prompt') {
      onConfirm?.(inputValue);
    } else {
      onConfirm?.();
    }
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && type !== 'prompt') {
      handleConfirm();
    }
  };

  return (
    <div
      className="custom-modal-overlay"
      onClick={handleCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      aria-describedby="modal-message"
    >
      <div
        ref={modalRef}
        className="custom-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h3 id="modal-title" className="custom-modal-title">{title}</h3>}

        {children ? (
          // If children are provided, render them instead of the default modal content
          children
        ) : (
          <>
            <div id="modal-message" className="custom-modal-message">
              {message}
            </div>

            {type === 'prompt' && (
              <input
                type={inputType}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={placeholder}
                className="custom-modal-input"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleConfirm()}
                aria-label={placeholder || 'Input field'}
                aria-required="true"
              />
            )}

            <div className="custom-modal-actions">
              {type === 'alert' ? (
                <button
                  className="custom-modal-btn custom-modal-btn-primary"
                  onClick={handleConfirm}
                  onKeyPress={handleKeyPress}
                  autoFocus
                  aria-label="Close dialog"
                >
                  OK
                </button>
              ) : (
                <>
                  <button
                    className="custom-modal-btn custom-modal-btn-secondary"
                    onClick={handleCancel}
                    aria-label={`Cancel ${type === 'confirm' ? 'action' : 'input'}`}
                  >
                    {cancelText}
                  </button>
                  <button
                    className="custom-modal-btn custom-modal-btn-primary"
                    onClick={handleConfirm}
                    autoFocus
                    aria-label={`${confirmText} ${type === 'confirm' ? 'action' : 'and submit'}`}
                  >
                    {confirmText}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CustomModal;


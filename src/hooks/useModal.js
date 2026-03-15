import { useState } from 'react';

/**
 * Custom hook to manage modal state and provide alert/confirm/prompt functions
 * 
 * Usage:
 * const { modalComponent, showAlert, showConfirm, showPrompt } = useModal();
 * 
 * return (
 *   <>
 *     {modalComponent}
 *     <button onClick={() => showAlert('Hello!')}>Show Alert</button>
 *   </>
 * );
 */
export function useModal() {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    placeholder: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: null,
    inputType: 'text',
    defaultValue: ''
  });

  const closeModal = () => {
    // Resolve any pending confirm/prompt promise as cancelled before closing
    if (modalState.onCancel) {
      modalState.onCancel();
    }
    setModalState(prev => ({ ...prev, isOpen: false, onCancel: null }));
  };

  const showAlert = (message, title = '') => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        type: 'alert',
        title,
        message,
        onConfirm: () => resolve(true),
        placeholder: '',
        confirmText: 'OK',
        cancelText: 'Cancel',
        inputType: 'text',
        defaultValue: ''
      });
    });
  };

  const showConfirm = (message, title = '', confirmText = 'Confirm', cancelText = 'Cancel') => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        type: 'confirm',
        title,
        message,
        confirmText,
        cancelText,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
        placeholder: '',
        inputType: 'text',
        defaultValue: ''
      });
    });
  };

  const showPrompt = (message, title = '', placeholder = '', defaultValue = '', inputType = 'text') => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        type: 'prompt',
        title,
        message,
        placeholder,
        defaultValue,
        inputType,
        confirmText: 'Submit',
        cancelText: 'Cancel',
        onConfirm: (value) => resolve(value),
        onCancel: () => resolve(null)
      });
    });
  };

  return {
    modalState,
    closeModal,
    showAlert,
    showConfirm,
    showPrompt
  };
}


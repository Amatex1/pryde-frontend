import { useState, useCallback } from 'react';

/**
 * useModalState - Hook for managing modal state
 * 
 * Handles:
 * - Open/close modal state
 * - Modal type
 * - Modal data/payload
 * - Alert/confirm/prompt dialogs
 * 
 * @param {Object} options
 * @param {boolean} options.defaultOpen - Initial open state
 * @returns {Object} Modal state and handlers
 */
export function useModalState({ defaultOpen = false } = {}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [modalType, setModalType] = useState(null);
  const [modalData, setModalData] = useState(null);

  // Open modal
  const openModal = useCallback((type = 'default', data = null) => {
    setModalType(type);
    setModalData(data);
    setIsOpen(true);
  }, []);

  // Close modal
  const closeModal = useCallback(() => {
    setIsOpen(false);
    setModalType(null);
    setModalData(null);
  }, []);

  // Toggle modal
  const toggleModal = useCallback((type = 'default', data = null) => {
    if (isOpen && modalType === type) {
      closeModal();
    } else {
      openModal(type, data);
    }
  }, [isOpen, modalType, closeModal, openModal]);

  // Update modal data without reopening
  const updateModalData = useCallback((data) => {
    setModalData(prev => ({ ...prev, ...data }));
  }, []);

  return {
    // State
    isOpen,
    modalType,
    modalData,
    
    // Handlers
    openModal,
    closeModal,
    toggleModal,
    updateModalData,
  };
}

/**
 * useModal - Legacy hook for compatibility with existing useModal
 * 
 * Provides the same interface as the existing useModal hook in the codebase.
 * Wraps useModalState with additional alert/confirm/prompt functionality.
 * 
 * @returns {Object} Modal state and handlers
 */
export function useModal() {
  const { isOpen, modalType, modalData, openModal, closeModal, toggleModal, updateModalData } = useModalState();
  
  const [alertCallback, setAlertCallback] = useState(null);
  const [confirmCallback, setConfirmCallback] = useState(null);
  const [promptCallback, setPromptCallback] = useState(null);

  // Show alert dialog
  const showAlert = useCallback((message, title = 'Alert') => {
    return new Promise((resolve) => {
      setAlertCallback(() => resolve);
      openModal('alert', { message, title });
    });
  }, [openModal]);

  // Show confirm dialog
  const showConfirm = useCallback((message, title = 'Confirm', confirmText = 'Confirm', cancelText = 'Cancel') => {
    return new Promise((resolve) => {
      setConfirmCallback(() => resolve);
      openModal('confirm', { message, title, confirmText, cancelText });
    });
  }, [openModal]);

  // Show prompt dialog
  const showPrompt = useCallback((message, title = 'Prompt', defaultValue = '', inputType = 'text') => {
    return new Promise((resolve) => {
      setPromptCallback(() => resolve);
      openModal('prompt', { message, title, defaultValue, inputType });
    });
  }, [openModal]);

  // Handle modal close
  const handleClose = useCallback((result) => {
    if (modalType === 'alert') {
      alertCallback?.(true);
    } else if (modalType === 'confirm') {
      confirmCallback?.(result);
    } else if (modalType === 'prompt') {
      promptCallback?.(result);
    }
    closeModal();
  }, [modalType, alertCallback, confirmCallback, promptCallback, closeModal]);

  // Handle alert confirm
  const handleAlertConfirm = useCallback(() => {
    alertCallback?.(true);
    closeModal();
  }, [alertCallback, closeModal]);

  // Handle confirm result
  const handleConfirmResult = useCallback((confirmed) => {
    confirmCallback?.(confirmed);
    closeModal();
  }, [confirmCallback, closeModal]);

  // Handle prompt result
  const handlePromptResult = useCallback((value) => {
    promptCallback?.(value);
    closeModal();
  }, [promptCallback, closeModal]);

  return {
    modalState: {
      isOpen,
      type: modalType,
      message: modalData?.message,
      title: modalData?.title,
      confirmText: modalData?.confirmText,
      cancelText: modalData?.cancelText,
      placeholder: modalData?.placeholder,
      defaultValue: modalData?.defaultValue,
      inputType: modalData?.inputType,
    },
    closeModal: handleClose,
    showAlert,
    showConfirm,
    showPrompt,
    // Internal handlers for modal component
    _handleAlertConfirm: handleAlertConfirm,
    _handleConfirmResult: handleConfirmResult,
    _handlePromptResult: handlePromptResult,
  };
}

export default useModalState;


import { useCallback } from 'react';
import { useToastContext } from '@/components/providers/ToastProvider';

interface UseFormConfirmationOptions {
  hasUnsavedChanges?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function useFormConfirmation() {
  const { success, error: showError } = useToastContext();

  const confirmFormClose = useCallback(({
    hasUnsavedChanges = true,
    onConfirm,
    onCancel
  }: UseFormConfirmationOptions) => {
    if (!hasUnsavedChanges) {
      onConfirm();
      return;
    }

    // Show confirmation toast
    const confirmAction = () => {
      onConfirm();
      success('Form Closed', 'Your changes have been discarded.');
    };

    const cancelAction = () => {
      if (onCancel) {
        onCancel();
      }
      showError('Action Cancelled', 'Form remains open. Your changes are preserved.');
    };

    // Create a custom confirmation dialog
    const shouldClose = window.confirm(
      'Are you sure you want to close this form?\n\nIf you do, any unsaved changes will be lost.'
    );

    if (shouldClose) {
      confirmAction();
    } else {
      cancelAction();
    }
  }, [success, showError]);

  return { confirmFormClose };
}

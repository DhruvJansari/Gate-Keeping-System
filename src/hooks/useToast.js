import toast from 'react-hot-toast';

/**
 * Custom hook for showing toast notifications
 * @returns {Object} Toast methods
 */
export function useToast() {
  return {
    /**
     * Show success toast
     * @param {string} message - Success message to display
     * @returns {string} Toast ID
     */
    success: (message) => {
      return toast.success(message);
    },

    /**
     * Show error toast
     * @param {string} message - Error message to display
     * @returns {string} Toast ID
     */
    error: (message) => {
      return toast.error(message);
    },

    /**
     * Show loading toast
     * @param {string} message - Loading message to display
     * @returns {string} Toast ID
     */
    loading: (message) => {
      return toast.loading(message);
    },

    /**
     * Dismiss a specific toast or all toasts
     * @param {string} [id] - Toast ID to dismiss (optional)
     */
    dismiss: (id) => {
      if (id) {
        toast.dismiss(id);
      } else {
        toast.dismiss();
      }
    },

    /**
     * Show a promise-based toast
     * @param {Promise} promise - Promise to track
     * @param {Object} messages - Messages for loading, success, error
     */
    promise: (promise, messages) => {
      return toast.promise(promise, messages);
    },
  };
}

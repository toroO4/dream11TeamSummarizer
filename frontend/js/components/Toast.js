// Toast Notification Component
class Toast {
    constructor() {
        this.errorToast = null;
        this.successToast = null;
        this.errorMessage = null;
        this.successMessage = null;
        this.isInitialized = false;
    }

    initialize(errorToastId, errorMessageId, successToastId, successMessageId) {
        this.errorToast = document.getElementById(errorToastId);
        this.successToast = document.getElementById(successToastId);
        this.errorMessage = document.getElementById(errorMessageId);
        this.successMessage = document.getElementById(successMessageId);
        
        this.isInitialized = true;
        
        // Ensure toasts start hidden
        if (this.errorToast) {
            this.errorToast.classList.add('translate-y-full');
        }
        if (this.successToast) {
            this.successToast.classList.add('translate-y-full');
        }
        
        console.log('Toast initialized:', {
            errorToast: !!this.errorToast,
            successToast: !!this.successToast,
            errorMessage: !!this.errorMessage,
            successMessage: !!this.successMessage
        });
    }

    showError(message, duration = 5000) {
        console.log('Showing error toast:', message);
        
        if (!this.isInitialized) {
            console.warn('Toast not initialized, falling back to alert');
            alert(`Error: ${message}`);
            return;
        }
        
        if (!this.errorToast || !this.errorMessage) {
            console.error('Error toast elements not found');
            alert(`Error: ${message}`);
            return;
        }
        
        // Set message
        this.errorMessage.textContent = message;
        
        // Show toast by removing translate-y-full class
        this.errorToast.classList.remove('translate-y-full');
        
        // Auto-hide after duration
        setTimeout(() => {
            this.hideError();
        }, duration);
    }

    showSuccess(message, duration = 4000) {
        console.log('Showing success toast:', message);
        
        if (!this.isInitialized) {
            console.warn('Toast not initialized, falling back to alert');
            alert(`Success: ${message}`);
            return;
        }
        
        if (!this.successToast || !this.successMessage) {
            console.error('Success toast elements not found');
            alert(`Success: ${message}`);
            return;
        }
        
        // Set message
        this.successMessage.textContent = message;
        
        // Show toast by removing translate-y-full class
        this.successToast.classList.remove('translate-y-full');
        
        // Auto-hide after duration
        setTimeout(() => {
            this.hideSuccess();
        }, duration);
    }

    hideError() {
        if (this.errorToast) {
            this.errorToast.classList.add('translate-y-full');
        }
    }

    hideSuccess() {
        if (this.successToast) {
            this.successToast.classList.add('translate-y-full');
        }
    }

    showWarning(message, duration = 5000) {
        // Use error toast for warnings with different styling
        this.showError(message, duration);
    }

    showInfo(message, duration = 4000) {
        // Use success toast for info messages
        this.showSuccess(message, duration);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Toast;
} else {
    window.Toast = Toast;
} 
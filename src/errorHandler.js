// ============================================
// GLOBAL ERROR HANDLER
// ============================================
// Centralized error handling and logging system

class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 100;
    this.initGlobalHandlers();
  }

  // Initialize global error handlers
  initGlobalHandlers() {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'Uncaught Error',
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        error: event.error,
        timestamp: new Date().toISOString()
      });

      // Show user-friendly error message
      this.showUserError('An unexpected error occurred. The game may not work correctly.');

      // Prevent default browser error handling for cleaner UX
      event.preventDefault();
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'Unhandled Promise Rejection',
        message: event.reason?.message || String(event.reason),
        error: event.reason,
        timestamp: new Date().toISOString()
      });

      this.showUserError('An unexpected error occurred in an async operation.');

      // Prevent default browser error handling
      event.preventDefault();
    });
  }

  // Log error to internal array
  logError(errorInfo) {
    console.error('[Bugdom Error]', errorInfo);

    this.errorLog.push(errorInfo);

    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }
  }

  // Handle specific error types with context
  handleError(error, context = '') {
    const errorInfo = {
      type: 'Handled Error',
      context,
      message: error.message || String(error),
      stack: error.stack,
      timestamp: new Date().toISOString()
    };

    this.logError(errorInfo);

    // Return false to indicate error occurred
    return false;
  }

  // Show user-friendly error message
  showUserError(message, duration = 5000) {
    // Check if we're in a browser environment
    if (typeof document === 'undefined') return;

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: rgba(220, 53, 69, 0.95);
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: bold;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      max-width: 90%;
      text-align: center;
      animation: slideDown 0.3s ease-out;
    `;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(errorDiv);

    // Auto-remove after duration
    setTimeout(() => {
      errorDiv.style.transition = 'opacity 0.3s ease-out';
      errorDiv.style.opacity = '0';
      setTimeout(() => {
        errorDiv.remove();
        style.remove();
      }, 300);
    }, duration);
  }

  // Get error log for debugging
  getErrorLog() {
    return [...this.errorLog];
  }

  // Clear error log
  clearErrorLog() {
    this.errorLog = [];
  }
}

// Create and export singleton instance
export const errorHandler = new ErrorHandler();

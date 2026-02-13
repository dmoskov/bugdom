/**
 * Error Handler Unit Tests
 *
 * Tests for the ErrorHandler class which provides centralized error
 * handling and logging for the Bugdom game.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { errorHandler } from './errorHandler.js';

describe('ErrorHandler', () => {
  let consoleErrorSpy;
  let consoleWarnSpy;

  beforeEach(() => {
    // Spy on console methods
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Clear error log before each test
    errorHandler.clearErrorLog();

    // Mock DOM methods
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = {
        tagName: tagName.toUpperCase(),
        className: '',
        textContent: '',
        style: { cssText: '' },
        remove: vi.fn()
      };
      return element;
    });

    // Mock appendChild methods
    if (document.head) {
      vi.spyOn(document.head, 'appendChild').mockImplementation(() => {});
    }
    if (document.body) {
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    }
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with empty error log', () => {
      errorHandler.clearErrorLog();
      const log = errorHandler.getErrorLog();

      expect(log).toEqual([]);
    });

    it('should have max log size of 100', () => {
      expect(errorHandler.maxLogSize).toBe(100);
    });

    it('should have error handler registered', () => {
      expect(errorHandler.errorHandler).toBeDefined();
      expect(typeof errorHandler.errorHandler).toBe('function');
    });

    it('should have rejection handler registered', () => {
      expect(errorHandler.rejectionHandler).toBeDefined();
      expect(typeof errorHandler.rejectionHandler).toBe('function');
    });
  });

  describe('Error Logging', () => {
    it('should log error to console', () => {
      const errorInfo = {
        type: 'Test Error',
        message: 'Test error message',
        timestamp: new Date().toISOString()
      };

      errorHandler.logError(errorInfo);

      expect(consoleErrorSpy).toHaveBeenCalledWith('[Bugdom Error]', errorInfo);
    });

    it('should add error to error log', () => {
      const errorInfo = {
        type: 'Test Error',
        message: 'Test error message',
        timestamp: new Date().toISOString()
      };

      errorHandler.logError(errorInfo);

      const log = errorHandler.getErrorLog();
      expect(log).toHaveLength(1);
      expect(log[0]).toEqual(errorInfo);
    });

    it('should maintain multiple errors in log', () => {
      errorHandler.logError({ type: 'Error 1', message: 'First error' });
      errorHandler.logError({ type: 'Error 2', message: 'Second error' });
      errorHandler.logError({ type: 'Error 3', message: 'Third error' });

      const log = errorHandler.getErrorLog();
      expect(log).toHaveLength(3);
    });

    it('should keep log size under max limit', () => {
      // Add more than maxLogSize errors
      for (let i = 0; i < 105; i++) {
        errorHandler.logError({ type: `Error ${i}`, message: `Error ${i}` });
      }

      const log = errorHandler.getErrorLog();
      expect(log).toHaveLength(100); // Should be capped at maxLogSize
    });

    it('should remove oldest errors when exceeding max size', () => {
      // Add 102 errors
      for (let i = 0; i < 102; i++) {
        errorHandler.logError({ type: `Error ${i}`, message: `Message ${i}` });
      }

      const log = errorHandler.getErrorLog();
      expect(log[0].message).toBe('Message 2'); // First two should be removed
    });
  });

  describe('Handle Error', () => {
    it('should handle error with context', () => {
      const error = new Error('Test error');
      const context = 'Test Context';

      const result = errorHandler.handleError(error, context);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      const log = errorHandler.getErrorLog();
      expect(log).toHaveLength(1);
      expect(log[0].context).toBe(context);
      expect(log[0].message).toBe('Test error');
    });

    it('should handle error without context', () => {
      const error = new Error('Test error');

      const result = errorHandler.handleError(error);

      expect(result).toBe(false);

      const log = errorHandler.getErrorLog();
      expect(log).toHaveLength(1);
      expect(log[0].context).toBe('');
    });

    it('should handle non-Error objects', () => {
      const result = errorHandler.handleError('String error', 'Context');

      expect(result).toBe(false);

      const log = errorHandler.getErrorLog();
      expect(log).toHaveLength(1);
      expect(log[0].message).toBe('String error');
    });

    it('should include stack trace from Error object', () => {
      const error = new Error('Test error');

      errorHandler.handleError(error, 'Test Context');

      const log = errorHandler.getErrorLog();
      expect(log[0].stack).toBeDefined();
    });

    it('should always return false', () => {
      const error = new Error('Test error');

      const result = errorHandler.handleError(error);

      expect(result).toBe(false);
    });

    it('should include timestamp', () => {
      const error = new Error('Test error');

      errorHandler.handleError(error, 'Context');

      const log = errorHandler.getErrorLog();
      expect(log[0].timestamp).toBeDefined();
      expect(typeof log[0].timestamp).toBe('string');
    });

    it('should mark error type as Handled Error', () => {
      const error = new Error('Test error');

      errorHandler.handleError(error, 'Context');

      const log = errorHandler.getErrorLog();
      expect(log[0].type).toBe('Handled Error');
    });
  });

  describe('Show User Error', () => {
    it('should not create error notification if document is undefined', () => {
      const originalDocument = global.document;
      global.document = undefined;

      errorHandler.showUserError('Test error');

      // Should not throw and should handle gracefully
      expect(() => errorHandler.showUserError('Test error')).not.toThrow();

      global.document = originalDocument;
    });

    it('should create error notification element', () => {
      errorHandler.showUserError('Test error message');

      expect(document.createElement).toHaveBeenCalledWith('div');
    });

    it('should set error message as text content', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      const mockDiv = {
        className: '',
        textContent: '',
        style: { cssText: '' }
      };
      const mockStyle = {
        textContent: ''
      };

      // Return different mocks for div and style elements
      createElementSpy.mockImplementation((tagName) => {
        if (tagName === 'div') return mockDiv;
        if (tagName === 'style') return mockStyle;
        return { textContent: '', style: { cssText: '' } };
      });

      errorHandler.showUserError('Test error message');

      expect(mockDiv.textContent).toBe('Test error message');

      createElementSpy.mockRestore();
    });

    it('should set error-notification class', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      const mockDiv = {
        className: '',
        textContent: '',
        style: { cssText: '' }
      };
      createElementSpy.mockReturnValue(mockDiv);

      errorHandler.showUserError('Test error message');

      expect(mockDiv.className).toBe('error-notification');

      createElementSpy.mockRestore();
    });

    it('should create style element for animation', () => {
      errorHandler.showUserError('Test error message');

      expect(document.createElement).toHaveBeenCalledWith('style');
    });

    it('should append error notification to body', () => {
      errorHandler.showUserError('Test error message');

      expect(document.body.appendChild).toHaveBeenCalled();
    });

    it('should append style element to head', () => {
      errorHandler.showUserError('Test error message');

      expect(document.head.appendChild).toHaveBeenCalled();
    });

    it('should use default duration of 5000ms', () => {
      vi.useFakeTimers();

      const createElementSpy = vi.spyOn(document, 'createElement');
      const mockDiv = {
        className: '',
        textContent: '',
        style: { cssText: '', transition: '', opacity: '' },
        remove: vi.fn()
      };
      createElementSpy.mockReturnValue(mockDiv);

      errorHandler.showUserError('Test error message');

      // Fast-forward time
      vi.advanceTimersByTime(5000);

      expect(mockDiv.style.transition).toBe('opacity 0.3s ease-out');

      vi.useRealTimers();
      createElementSpy.mockRestore();
    });

    it('should use custom duration when provided', () => {
      vi.useFakeTimers();

      const createElementSpy = vi.spyOn(document, 'createElement');
      const mockDiv = {
        className: '',
        textContent: '',
        style: { cssText: '', transition: '', opacity: '' },
        remove: vi.fn()
      };
      createElementSpy.mockReturnValue(mockDiv);

      errorHandler.showUserError('Test error message', 3000);

      // Fast-forward time
      vi.advanceTimersByTime(3000);

      expect(mockDiv.style.transition).toBe('opacity 0.3s ease-out');

      vi.useRealTimers();
      createElementSpy.mockRestore();
    });
  });

  describe('Get Error Log', () => {
    it('should return empty array initially', () => {
      errorHandler.clearErrorLog();
      const log = errorHandler.getErrorLog();

      expect(log).toEqual([]);
    });

    it('should return copy of error log', () => {
      const errorInfo = { type: 'Test', message: 'Test' };
      errorHandler.logError(errorInfo);

      const log1 = errorHandler.getErrorLog();
      const log2 = errorHandler.getErrorLog();

      expect(log1).toEqual(log2);
      expect(log1).not.toBe(log2); // Should be different array instances
    });

    it('should not modify original log when returned array is modified', () => {
      errorHandler.logError({ type: 'Test', message: 'Test' });

      const log = errorHandler.getErrorLog();
      log.push({ type: 'New', message: 'New' });

      const actualLog = errorHandler.getErrorLog();
      expect(actualLog).toHaveLength(1); // Original should be unchanged
    });
  });

  describe('Clear Error Log', () => {
    it('should clear all errors from log', () => {
      errorHandler.logError({ type: 'Error 1', message: 'Message 1' });
      errorHandler.logError({ type: 'Error 2', message: 'Message 2' });

      errorHandler.clearErrorLog();

      const log = errorHandler.getErrorLog();
      expect(log).toEqual([]);
    });

    it('should allow adding errors after clearing', () => {
      errorHandler.logError({ type: 'Error 1', message: 'Message 1' });
      errorHandler.clearErrorLog();
      errorHandler.logError({ type: 'Error 2', message: 'Message 2' });

      const log = errorHandler.getErrorLog();
      expect(log).toHaveLength(1);
      expect(log[0].type).toBe('Error 2');
    });
  });

  describe('Global Error Handler', () => {
    it('should catch uncaught errors', () => {
      const errorEvent = {
        message: 'Uncaught error',
        filename: 'test.js',
        lineno: 10,
        colno: 5,
        error: new Error('Test error'),
        preventDefault: vi.fn()
      };

      errorHandler.errorHandler(errorEvent);

      const log = errorHandler.getErrorLog();
      expect(log).toHaveLength(1);
      expect(log[0].type).toBe('Uncaught Error');
      expect(log[0].message).toBe('Uncaught error');
    });

    it('should prevent default error handling', () => {
      const errorEvent = {
        message: 'Uncaught error',
        filename: 'test.js',
        lineno: 10,
        colno: 5,
        error: new Error('Test error'),
        preventDefault: vi.fn()
      };

      errorHandler.errorHandler(errorEvent);

      expect(errorEvent.preventDefault).toHaveBeenCalled();
    });

    it('should include file location in error log', () => {
      const errorEvent = {
        message: 'Uncaught error',
        filename: 'test.js',
        lineno: 10,
        colno: 5,
        error: new Error('Test error'),
        preventDefault: vi.fn()
      };

      errorHandler.errorHandler(errorEvent);

      const log = errorHandler.getErrorLog();
      expect(log[0].filename).toBe('test.js');
      expect(log[0].line).toBe(10);
      expect(log[0].column).toBe(5);
    });

    it('should include timestamp in error log', () => {
      const errorEvent = {
        message: 'Uncaught error',
        filename: 'test.js',
        lineno: 10,
        colno: 5,
        error: new Error('Test error'),
        preventDefault: vi.fn()
      };

      errorHandler.errorHandler(errorEvent);

      const log = errorHandler.getErrorLog();
      expect(log[0].timestamp).toBeDefined();
    });
  });

  describe('Unhandled Promise Rejection Handler', () => {
    it('should catch unhandled promise rejections', () => {
      const rejectionEvent = {
        reason: new Error('Promise rejection'),
        preventDefault: vi.fn()
      };

      errorHandler.rejectionHandler(rejectionEvent);

      const log = errorHandler.getErrorLog();
      expect(log).toHaveLength(1);
      expect(log[0].type).toBe('Unhandled Promise Rejection');
    });

    it('should handle rejection with Error object', () => {
      const rejectionEvent = {
        reason: new Error('Promise rejection'),
        preventDefault: vi.fn()
      };

      errorHandler.rejectionHandler(rejectionEvent);

      const log = errorHandler.getErrorLog();
      expect(log[0].message).toBe('Promise rejection');
    });

    it('should handle rejection with string', () => {
      const rejectionEvent = {
        reason: 'String rejection',
        preventDefault: vi.fn()
      };

      errorHandler.rejectionHandler(rejectionEvent);

      const log = errorHandler.getErrorLog();
      expect(log[0].message).toBe('String rejection');
    });

    it('should prevent default rejection handling', () => {
      const rejectionEvent = {
        reason: new Error('Promise rejection'),
        preventDefault: vi.fn()
      };

      errorHandler.rejectionHandler(rejectionEvent);

      expect(rejectionEvent.preventDefault).toHaveBeenCalled();
    });

    it('should include timestamp in error log', () => {
      const rejectionEvent = {
        reason: new Error('Promise rejection'),
        preventDefault: vi.fn()
      };

      errorHandler.rejectionHandler(rejectionEvent);

      const log = errorHandler.getErrorLog();
      expect(log[0].timestamp).toBeDefined();
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners and set handlers to null', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      // Store the original handler references before cleanup
      const originalErrorHandler = errorHandler.errorHandler;
      const originalRejectionHandler = errorHandler.rejectionHandler;

      // Verify handlers exist before cleanup
      expect(originalErrorHandler).not.toBeNull();
      expect(originalRejectionHandler).not.toBeNull();

      errorHandler.cleanup();

      // Verify removeEventListener was called for both handlers
      expect(removeEventListenerSpy).toHaveBeenCalledWith('error', originalErrorHandler);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', originalRejectionHandler);

      // Verify handlers are now null
      expect(errorHandler.errorHandler).toBeNull();
      expect(errorHandler.rejectionHandler).toBeNull();

      removeEventListenerSpy.mockRestore();
    });

    it('should not error when called multiple times', () => {
      // Call cleanup once
      errorHandler.cleanup();

      // Calling again should not throw
      expect(() => errorHandler.cleanup()).not.toThrow();
    });
  });

  describe('Singleton Pattern', () => {
    it('should export a singleton instance', () => {
      expect(errorHandler).toBeDefined();
      expect(typeof errorHandler.logError).toBe('function');
      expect(typeof errorHandler.handleError).toBe('function');
    });
  });

  describe('Error Info Structure', () => {
    it('should create consistent error info objects', () => {
      const error = new Error('Test error');
      errorHandler.handleError(error, 'Test Context');

      const log = errorHandler.getErrorLog();
      const errorInfo = log[0];

      expect(errorInfo).toHaveProperty('type');
      expect(errorInfo).toHaveProperty('context');
      expect(errorInfo).toHaveProperty('message');
      expect(errorInfo).toHaveProperty('stack');
      expect(errorInfo).toHaveProperty('timestamp');
    });
  });
});

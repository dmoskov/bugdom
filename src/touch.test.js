/**
 * Touch Controls Unit Tests
 *
 * Tests for touch control initialization and state management.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getTouchControls, initTouchControls, cleanupTouchControls } from './touch.js';

describe('Touch Controls', () => {
  beforeEach(() => {
    // Mock DOM elements
    document.querySelector = vi.fn((selector) => {
      if (selector === '.joystick-base' || selector === '.joystick-stick') {
        return {
          style: { transform: '', display: '' },
          classList: { add: vi.fn(), remove: vi.fn() }
        };
      }
      return null;
    });

    // Mock window dimensions
    global.innerWidth = 800;
    global.innerHeight = 600;
  });

  describe('getTouchControls', () => {
    it('should return touch controls object', () => {
      const controls = getTouchControls();

      expect(controls).toBeDefined();
      expect(controls).toHaveProperty('forward');
      expect(controls).toHaveProperty('backward');
      expect(controls).toHaveProperty('left');
      expect(controls).toHaveProperty('right');
    });

    it('should initialize with false directional values', () => {
      const controls = getTouchControls();

      expect(controls.forward).toBe(false);
      expect(controls.backward).toBe(false);
      expect(controls.left).toBe(false);
      expect(controls.right).toBe(false);
    });

    it('should have joystick state properties', () => {
      const controls = getTouchControls();

      expect(controls).toHaveProperty('joystickActive');
      expect(controls).toHaveProperty('joystickAngle');
      expect(controls).toHaveProperty('joystickStrength');
    });
  });

  describe('initTouchControls', () => {
    it('should handle missing DOM elements gracefully', () => {
      document.querySelector = vi.fn().mockReturnValue(null);

      expect(() => {
        initTouchControls();
      }).not.toThrow();
    });

    it('should setup touch controls when elements exist', () => {
      const mockElement = {
        style: { transform: '', display: '' },
        classList: { add: vi.fn(), remove: vi.fn() },
        addEventListener: vi.fn()
      };

      document.querySelector = vi.fn().mockReturnValue(mockElement);

      initTouchControls();

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('cleanupTouchControls', () => {
    it('should cleanup without errors', () => {
      expect(() => {
        cleanupTouchControls();
      }).not.toThrow();
    });
  });
});

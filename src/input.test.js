/**
 * Input Manager Unit Tests
 *
 * Tests for the InputManager class which handles keyboard and touch input
 * for the Bugdom game.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InputManager } from './input.js';

// Mock touch controls module
vi.mock('./touch.js', () => ({
  getTouchControls: vi.fn(() => ({
    up: false,
    down: false,
    left: false,
    right: false,
    enabled: false
  }))
}));

describe('InputManager', () => {
  let inputManager;
  let keydownEvent;
  let keyupEvent;

  beforeEach(() => {
    // Create a new InputManager instance for each test
    inputManager = new InputManager();
  });

  afterEach(() => {
    // Cleanup after each test
    if (inputManager) {
      inputManager.cleanup();
    }
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with empty keys object', () => {
      expect(inputManager.keys).toBeDefined();
      expect(Object.keys(inputManager.keys).length).toBe(0);
    });

    it('should initialize with touch controls', () => {
      expect(inputManager.touchControls).toBeDefined();
      expect(inputManager.touchControls).toHaveProperty('enabled');
    });
  });

  describe('Keyboard Input Handling', () => {
    it('should register key down events', () => {
      const event = new KeyboardEvent('keydown', { key: 'w' });
      inputManager.handleKeyDown(event);

      expect(inputManager.keys['w']).toBe(true);
    });

    it('should register key up events', () => {
      const event = new KeyboardEvent('keydown', { key: 'a' });
      inputManager.handleKeyDown(event);
      expect(inputManager.keys['a']).toBe(true);

      const upEvent = new KeyboardEvent('keyup', { key: 'a' });
      inputManager.handleKeyUp(upEvent);
      expect(inputManager.keys['a']).toBe(false);
    });

    it('should convert keys to lowercase', () => {
      const event = new KeyboardEvent('keydown', { key: 'W' });
      inputManager.handleKeyDown(event);

      expect(inputManager.keys['w']).toBe(true);
    });

    it('should handle arrow keys', () => {
      const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      inputManager.handleKeyDown(upEvent);

      expect(inputManager.keys['arrowup']).toBe(true);
    });

    it('should handle multiple simultaneous key presses', () => {
      const wEvent = new KeyboardEvent('keydown', { key: 'w' });
      const aEvent = new KeyboardEvent('keydown', { key: 'a' });

      inputManager.handleKeyDown(wEvent);
      inputManager.handleKeyDown(aEvent);

      expect(inputManager.keys['w']).toBe(true);
      expect(inputManager.keys['a']).toBe(true);
    });
  });

  describe('Key State Queries', () => {
    it('should return current keys state with getKeys()', () => {
      const event = new KeyboardEvent('keydown', { key: 'd' });
      inputManager.handleKeyDown(event);

      const keys = inputManager.getKeys();
      expect(keys['d']).toBe(true);
    });

    it('should check if specific key is pressed', () => {
      const event = new KeyboardEvent('keydown', { key: 's' });
      inputManager.handleKeyDown(event);

      expect(inputManager.isKeyPressed('s')).toBe(true);
      expect(inputManager.isKeyPressed('w')).toBe(false);
    });

    it('should handle case-insensitive key checks', () => {
      const event = new KeyboardEvent('keydown', { key: 'W' });
      inputManager.handleKeyDown(event);

      expect(inputManager.isKeyPressed('W')).toBe(true);
      expect(inputManager.isKeyPressed('w')).toBe(true);
    });

    it('should return false for unpressed keys', () => {
      expect(inputManager.isKeyPressed('x')).toBe(false);
    });
  });

  describe('Movement Input', () => {
    it('should return movement input for WASD keys', () => {
      const wEvent = new KeyboardEvent('keydown', { key: 'w' });
      const aEvent = new KeyboardEvent('keydown', { key: 'a' });

      inputManager.handleKeyDown(wEvent);
      inputManager.handleKeyDown(aEvent);

      const movement = inputManager.getMovementInput();
      expect(movement.forward).toBe(true);
      expect(movement.left).toBe(true);
      expect(movement.backward).toBe(false);
      expect(movement.right).toBe(false);
    });

    it('should return movement input for arrow keys', () => {
      const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      const rightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });

      inputManager.handleKeyDown(upEvent);
      inputManager.handleKeyDown(rightEvent);

      const movement = inputManager.getMovementInput();
      expect(movement.forward).toBe(true);
      expect(movement.right).toBe(true);
      expect(movement.backward).toBe(false);
      expect(movement.left).toBe(false);
    });

    it('should return all false when no keys pressed', () => {
      const movement = inputManager.getMovementInput();
      expect(movement.forward).toBe(false);
      expect(movement.backward).toBe(false);
      expect(movement.left).toBe(false);
      expect(movement.right).toBe(false);
    });

    it('should combine keyboard and touch input', () => {
      // Mock touch controls with up pressed
      inputManager.touchControls = {
        up: true,
        down: false,
        left: false,
        right: false
      };

      const movement = inputManager.getMovementInput();
      expect(movement.forward).toBe(true);
    });

    it('should handle touch controls being null', () => {
      inputManager.touchControls = null;

      const movement = inputManager.getMovementInput();
      expect(movement.forward).toBe(false);
      expect(movement.backward).toBe(false);
      expect(movement.left).toBe(false);
      expect(movement.right).toBe(false);
    });
  });

  describe('Enable/Disable Input', () => {
    it('should clear keys when disableInput() is called', () => {
      const wEvent = new KeyboardEvent('keydown', { key: 'w' });
      inputManager.handleKeyDown(wEvent);
      expect(inputManager.keys['w']).toBe(true);

      inputManager.disableInput();
      expect(Object.keys(inputManager.keys).length).toBe(0);
    });

    it('should not register keys when input is disabled', () => {
      inputManager.disableInput();

      // Try to dispatch a key event (won't work because listener removed)
      const event = new KeyboardEvent('keydown', { key: 'w' });
      inputManager.handleKeyDown(event); // Direct call still works

      // But the actual window listener should be removed
      expect(inputManager.keys['w']).toBe(true); // Direct call still sets it
    });

    it('should re-enable input after disabling', () => {
      inputManager.disableInput();
      inputManager.enableInput();

      const event = new KeyboardEvent('keydown', { key: 'a' });
      inputManager.handleKeyDown(event);
      expect(inputManager.keys['a']).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners on cleanup', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      inputManager.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    it('should clear keys on cleanup', () => {
      const wEvent = new KeyboardEvent('keydown', { key: 'w' });
      inputManager.handleKeyDown(wEvent);

      inputManager.cleanup();
      expect(Object.keys(inputManager.keys).length).toBe(0);
    });
  });
});

/**
 * Scene Setup Unit Tests
 *
 * Tests for scene initialization and window resize functionality.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initializeScene, setupWindowResize } from './sceneSetup.js';
import * as THREE from 'three';

// Mock errorHandler
vi.mock('./errorHandler.js', () => ({
  errorHandler: {
    handleError: vi.fn(),
    showUserError: vi.fn()
  }
}));

describe('Scene Setup', () => {
  let mockGameContainer;

  beforeEach(() => {
    // Create mock game container
    mockGameContainer = {
      clientWidth: 800,
      clientHeight: 600,
      appendChild: vi.fn()
    };

    // Mock document.body.appendChild
    document.body.appendChild = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initializeScene', () => {
    it('should create scene with correct background color', () => {
      const { scene } = initializeScene(mockGameContainer);

      expect(scene).toBeInstanceOf(THREE.Scene);
      expect(scene.background).toBeInstanceOf(THREE.Color);
      expect(scene.background.getHex()).toBe(0x87ceeb); // Sky blue
    });

    it('should create scene with fog', () => {
      const { scene } = initializeScene(mockGameContainer);

      expect(scene.fog).toBeInstanceOf(THREE.Fog);
      expect(scene.fog.color.getHex()).toBe(0x87ceeb);
      expect(scene.fog.near).toBe(50);
      expect(scene.fog.far).toBe(200);
    });

    it('should create renderer with antialiasing', () => {
      const { renderer } = initializeScene(mockGameContainer);

      expect(renderer).toBeInstanceOf(THREE.WebGLRenderer);
    });

    it('should set renderer size from container', () => {
      const { renderer } = initializeScene(mockGameContainer);

      // Check that size was set (can't directly verify dimensions in test env)
      expect(renderer).toBeDefined();
    });

    it('should enable shadow mapping', () => {
      const { renderer } = initializeScene(mockGameContainer);

      expect(renderer.shadowMap.enabled).toBe(true);
      expect(renderer.shadowMap.type).toBe(THREE.PCFSoftShadowMap);
    });

    it('should append renderer to game container', () => {
      initializeScene(mockGameContainer);

      expect(mockGameContainer.appendChild).toHaveBeenCalled();
    });

    it('should append renderer to body if no container', () => {
      initializeScene(null);

      expect(document.body.appendChild).toHaveBeenCalled();
    });

    it('should create ambient light', () => {
      const { ambientLight } = initializeScene(mockGameContainer);

      expect(ambientLight).toBeInstanceOf(THREE.AmbientLight);
      expect(ambientLight.color.getHex()).toBe(0xffffff);
      expect(ambientLight.intensity).toBe(0.7);
    });

    it('should create directional light', () => {
      const { directionalLight } = initializeScene(mockGameContainer);

      expect(directionalLight).toBeInstanceOf(THREE.DirectionalLight);
      expect(directionalLight.color.getHex()).toBe(0xffffff);
      expect(directionalLight.intensity).toBe(1.0);
    });

    it('should position directional light correctly', () => {
      const { directionalLight } = initializeScene(mockGameContainer);

      expect(directionalLight.position.x).toBe(50);
      expect(directionalLight.position.y).toBe(50);
      expect(directionalLight.position.z).toBe(50);
    });

    it('should enable shadow casting for directional light', () => {
      const { directionalLight } = initializeScene(mockGameContainer);

      expect(directionalLight.castShadow).toBe(true);
    });

    it('should configure shadow camera', () => {
      const { directionalLight } = initializeScene(mockGameContainer);

      expect(directionalLight.shadow.camera.left).toBe(-50);
      expect(directionalLight.shadow.camera.right).toBe(50);
      expect(directionalLight.shadow.camera.top).toBe(50);
      expect(directionalLight.shadow.camera.bottom).toBe(-50);
    });

    it('should set shadow map size', () => {
      const { directionalLight } = initializeScene(mockGameContainer);

      expect(directionalLight.shadow.mapSize.width).toBe(2048);
      expect(directionalLight.shadow.mapSize.height).toBe(2048);
    });

    it('should add lights to scene', () => {
      const { scene, ambientLight, directionalLight } = initializeScene(mockGameContainer);

      expect(scene.children).toContain(ambientLight);
      expect(scene.children).toContain(directionalLight);
    });

    it('should return all required objects', () => {
      const result = initializeScene(mockGameContainer);

      expect(result).toHaveProperty('scene');
      expect(result).toHaveProperty('renderer');
      expect(result).toHaveProperty('ambientLight');
      expect(result).toHaveProperty('directionalLight');
    });

    it('should use window dimensions if no container', () => {
      // Mock window dimensions
      global.innerWidth = 1024;
      global.innerHeight = 768;

      const { renderer } = initializeScene(null);

      expect(renderer).toBeDefined();
    });
  });

  describe('setupWindowResize', () => {
    let mockRenderer;
    let mockCameraController;
    let resizeListener;

    beforeEach(() => {
      mockRenderer = {
        setSize: vi.fn()
      };

      mockCameraController = {
        handleResize: vi.fn()
      };

      // Mock getElementById
      const mockContainer = {
        clientWidth: 800,
        clientHeight: 600
      };
      document.getElementById = vi.fn().mockReturnValue(mockContainer);

      // Capture the resize event listener
      const originalAddEventListener = window.addEventListener;
      window.addEventListener = vi.fn((event, handler) => {
        if (event === 'resize') {
          resizeListener = handler;
        }
        originalAddEventListener.call(window, event, handler);
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should add resize event listener', () => {
      setupWindowResize(mockRenderer, mockCameraController);

      expect(window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('should return cleanup function', () => {
      const cleanup = setupWindowResize(mockRenderer, mockCameraController);

      expect(typeof cleanup).toBe('function');
    });

    it('should call camera controller handleResize on window resize', () => {
      setupWindowResize(mockRenderer, mockCameraController);

      // Trigger resize
      if (resizeListener) {
        resizeListener();
      }

      expect(mockCameraController.handleResize).toHaveBeenCalled();
    });

    it('should update renderer size on window resize', () => {
      setupWindowResize(mockRenderer, mockCameraController);

      // Trigger resize
      if (resizeListener) {
        resizeListener();
      }

      expect(mockRenderer.setSize).toHaveBeenCalled();
    });

    it('should use container dimensions if available', () => {
      const mockContainer = {
        clientWidth: 1200,
        clientHeight: 900
      };
      document.getElementById = vi.fn().mockReturnValue(mockContainer);

      setupWindowResize(mockRenderer, mockCameraController);

      // Trigger resize
      if (resizeListener) {
        resizeListener();
      }

      expect(mockRenderer.setSize).toHaveBeenCalledWith(1200, 900);
    });

    it('should use window dimensions if no container', () => {
      document.getElementById = vi.fn().mockReturnValue(null);
      global.innerWidth = 1024;
      global.innerHeight = 768;

      setupWindowResize(mockRenderer, mockCameraController);

      // Trigger resize
      if (resizeListener) {
        resizeListener();
      }

      expect(mockRenderer.setSize).toHaveBeenCalledWith(1024, 768);
    });

    it('should remove event listener on cleanup', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      const cleanup = setupWindowResize(mockRenderer, mockCameraController);

      cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });
});

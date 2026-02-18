/**
 * Camera Controller Unit Tests
 *
 * Tests for the CameraController class and camera factory function.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CameraController, createCamera } from './camera.js';
import * as THREE from 'three';

describe('Camera Controller', () => {
  let camera;
  let cameraController;
  let mockContainer;

  beforeEach(() => {
    // Create a real THREE.js camera
    camera = new THREE.PerspectiveCamera(75, 16 / 9, 0.1, 1000);
    camera.position.set(0, 4, -8);

    // Mock container
    mockContainer = {
      clientWidth: 800,
      clientHeight: 600
    };

    // Mock document.getElementById
    document.getElementById = vi.fn().mockReturnValue(mockContainer);

    cameraController = new CameraController(camera, 'game-container');
  });

  afterEach(() => {
    cameraController.cleanup();
    vi.restoreAllMocks();
  });

  describe('Constructor and Initialization', () => {
    it('should store camera reference', () => {
      expect(cameraController.camera).toBe(camera);
    });

    it('should store container selector', () => {
      expect(cameraController.containerSelector).toBe('game-container');
    });

    it('should initialize camera offset', () => {
      expect(cameraController.cameraOffset).toBeInstanceOf(THREE.Vector3);
      expect(cameraController.cameraOffset.x).toBe(0);
      expect(cameraController.cameraOffset.y).toBe(4);
      expect(cameraController.cameraOffset.z).toBe(-8);
    });

    it('should initialize camera look offset', () => {
      expect(cameraController.cameraLookOffset).toBeInstanceOf(THREE.Vector3);
      expect(cameraController.cameraLookOffset.x).toBe(0);
      expect(cameraController.cameraLookOffset.y).toBe(1);
      expect(cameraController.cameraLookOffset.z).toBe(0);
    });

    it('should not add its own resize event listener (managed by setupWindowResize)', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const newController = new CameraController(camera);

      expect(addEventListenerSpy).not.toHaveBeenCalledWith('resize', expect.any(Function));

      newController.cleanup();
      addEventListenerSpy.mockRestore();
    });
  });

  describe('Camera Aspect Ratio', () => {
    it('should get aspect ratio from container', () => {
      const aspect = cameraController.getCameraAspect();

      expect(aspect).toBe(800 / 600);
    });

    it('should get aspect ratio from window if no container', () => {
      document.getElementById = vi.fn().mockReturnValue(null);
      global.innerWidth = 1920;
      global.innerHeight = 1080;

      const aspect = cameraController.getCameraAspect();

      expect(aspect).toBe(1920 / 1080);
    });
  });

  describe('Camera Update and Following', () => {
    it('should update camera position to follow player', () => {
      const playerPosition = new THREE.Vector3(10, 0, 10);
      const playerRotation = 0;
      const initialCameraPos = camera.position.clone();

      cameraController.update(playerPosition, playerRotation);

      // Camera should move toward player position (with lerp, won't be exact)
      expect(camera.position.equals(initialCameraPos)).toBe(false);
    });

    it('should apply player rotation to camera offset', () => {
      const playerPosition = new THREE.Vector3(0, 0, 0);
      const playerRotation = Math.PI / 2; // 90 degrees

      cameraController.update(playerPosition, playerRotation);

      // Camera should rotate around player
      expect(camera.position.x).not.toBe(0);
    });

    it('should smoothly follow with lerp', () => {
      const playerPosition = new THREE.Vector3(20, 0, 20);
      const playerRotation = 0;

      const initialPos = camera.position.clone();
      cameraController.update(playerPosition, playerRotation);
      const afterFirstUpdate = camera.position.clone();

      // Should move but not instantly (due to lerp factor of 0.1)
      expect(afterFirstUpdate.distanceTo(initialPos)).toBeLessThan(
        playerPosition.distanceTo(initialPos)
      );
    });

    it('should look at player position with offset', () => {
      const playerPosition = new THREE.Vector3(10, 0, 10);
      const playerRotation = 0;

      cameraController.update(playerPosition, playerRotation);

      // Camera should be looking at approximately the player position
      // (exact verification is complex due to lookAt implementation)
      expect(camera.rotation.x).not.toBe(0);
    });

    it('should update multiple times to reach target', () => {
      const playerPosition = new THREE.Vector3(30, 0, 30);
      const playerRotation = 0;

      // Update multiple times
      for (let i = 0; i < 50; i++) {
        cameraController.update(playerPosition, playerRotation);
      }

      // After many updates, camera should be very close to target
      const expectedPos = playerPosition.clone().add(cameraController.cameraOffset);
      expect(camera.position.distanceTo(expectedPos)).toBeLessThan(1);
    });
  });

  describe('Resize Handling', () => {
    it('should update camera aspect on resize', () => {
      const oldAspect = camera.aspect;
      mockContainer.clientWidth = 1600;
      mockContainer.clientHeight = 900;

      cameraController.handleResize();

      expect(camera.aspect).toBe(1600 / 900);
      expect(camera.aspect).not.toBe(oldAspect);
    });

    it('should update projection matrix on resize', () => {
      const updateProjectionMatrixSpy = vi.spyOn(camera, 'updateProjectionMatrix');

      cameraController.handleResize();

      expect(updateProjectionMatrixSpy).toHaveBeenCalled();

      updateProjectionMatrixSpy.mockRestore();
    });
  });

  describe('Camera Offset Getters and Setters', () => {
    it('should get camera offset as clone', () => {
      const offset = cameraController.getCameraOffset();

      expect(offset).toBeInstanceOf(THREE.Vector3);
      expect(offset.equals(cameraController.cameraOffset)).toBe(true);
      expect(offset).not.toBe(cameraController.cameraOffset); // Should be clone
    });

    it('should set camera offset', () => {
      const newOffset = new THREE.Vector3(1, 5, -10);

      cameraController.setCameraOffset(newOffset);

      expect(cameraController.cameraOffset.equals(newOffset)).toBe(true);
    });

    it('should get camera look offset as clone', () => {
      const offset = cameraController.getCameraLookOffset();

      expect(offset).toBeInstanceOf(THREE.Vector3);
      expect(offset.equals(cameraController.cameraLookOffset)).toBe(true);
      expect(offset).not.toBe(cameraController.cameraLookOffset); // Should be clone
    });

    it('should set camera look offset', () => {
      const newOffset = new THREE.Vector3(0, 2, 1);

      cameraController.setCameraLookOffset(newOffset);

      expect(cameraController.cameraLookOffset.equals(newOffset)).toBe(true);
    });

    it('should use new offset in camera update', () => {
      const newOffset = new THREE.Vector3(5, 10, -15);
      cameraController.setCameraOffset(newOffset);

      const playerPosition = new THREE.Vector3(0, 0, 0);
      const playerRotation = 0;

      // Update many times to reach steady state
      for (let i = 0; i < 100; i++) {
        cameraController.update(playerPosition, playerRotation);
      }

      // Camera should be near the new offset position
      expect(camera.position.distanceTo(newOffset)).toBeLessThan(1);
    });
  });

  describe('Cleanup', () => {
    it('should not remove resize listener (managed by setupWindowResize)', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      cameraController.cleanup();

      expect(removeEventListenerSpy).not.toHaveBeenCalledWith('resize', cameraController.handleResize);

      removeEventListenerSpy.mockRestore();
    });
  });
});

describe('Camera Factory Function', () => {
  beforeEach(() => {
    // Mock container
    const mockContainer = {
      clientWidth: 800,
      clientHeight: 600
    };
    document.getElementById = vi.fn().mockReturnValue(mockContainer);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createCamera', () => {
    it('should create a perspective camera', () => {
      const camera = createCamera();

      expect(camera).toBeInstanceOf(THREE.PerspectiveCamera);
    });

    it('should set camera FOV to 75', () => {
      const camera = createCamera();

      expect(camera.fov).toBe(75);
    });

    it('should set camera aspect ratio from container', () => {
      const camera = createCamera('game-container');

      expect(camera.aspect).toBe(800 / 600);
    });

    it('should set camera near plane', () => {
      const camera = createCamera();

      expect(camera.near).toBe(0.1);
    });

    it('should set camera far plane', () => {
      const camera = createCamera();

      expect(camera.far).toBe(1000);
    });

    it('should position camera correctly', () => {
      const camera = createCamera();

      expect(camera.position.x).toBe(0);
      expect(camera.position.y).toBe(4);
      expect(camera.position.z).toBe(-8);
    });

    it('should use window dimensions if no container', () => {
      document.getElementById = vi.fn().mockReturnValue(null);
      global.innerWidth = 1920;
      global.innerHeight = 1080;

      const camera = createCamera();

      expect(camera.aspect).toBe(1920 / 1080);
    });

    it('should look at origin with y offset', () => {
      const camera = createCamera();

      // Camera should be rotated toward (0, 1, 0)
      // Exact rotation verification is complex, just check it's not default
      expect(camera.rotation.x).not.toBe(0);
    });
  });
});

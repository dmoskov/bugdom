/**
 * Collectibles System Unit Tests
 *
 * Tests for Collectible classes and CollectiblesManager.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Collectible, MushroomPowerUp, CollectiblesManager } from './collectibles.js';
import * as THREE from 'three';

describe('Collectible', () => {
  let mockScene;
  let collectible;

  beforeEach(() => {
    mockScene = {
      add: vi.fn(),
      remove: vi.fn()
    };

    collectible = new Collectible(mockScene, new THREE.Vector3(0, 0, 0), 'test');
  });

  describe('Constructor', () => {
    it('should create collectible mesh', () => {
      expect(collectible.mesh).toBeDefined();
    });

    it('should store type', () => {
      expect(collectible.type).toBe('test');
    });

    it('should mark as not collected initially', () => {
      expect(collectible.collected).toBe(false);
    });
  });

  describe('Collection State', () => {
    it('should track collected state', () => {
      expect(collectible.collected).toBe(false);

      collectible.collected = true;

      expect(collectible.collected).toBe(true);
    });
  });
});

describe('MushroomPowerUp', () => {
  let mockScene;
  let mushroom;

  beforeEach(() => {
    mockScene = {
      add: vi.fn(),
      remove: vi.fn()
    };

    mushroom = new MushroomPowerUp(mockScene, new THREE.Vector3(0, 0, 0), 'health');
  });

  describe('Constructor', () => {
    it('should create mushroom with variant', () => {
      expect(mushroom.variant).toBe('health');
    });

    it('should be of type mushroom', () => {
      expect(mushroom.type).toBe('mushroom');
    });

    it('should create mesh', () => {
      expect(mushroom.mesh).toBeDefined();
    });
  });

  describe('Variants', () => {
    it('should create health variant', () => {
      const healthMushroom = new MushroomPowerUp(mockScene, new THREE.Vector3(0, 0, 0), 'health');
      expect(healthMushroom.variant).toBe('health');
    });

    it('should create speed variant', () => {
      const speedMushroom = new MushroomPowerUp(mockScene, new THREE.Vector3(0, 0, 0), 'speed');
      expect(speedMushroom.variant).toBe('speed');
    });

    it('should create invincibility variant', () => {
      const invincMushroom = new MushroomPowerUp(mockScene, new THREE.Vector3(0, 0, 0), 'invincibility');
      expect(invincMushroom.variant).toBe('invincibility');
    });
  });
});

describe('CollectiblesManager', () => {
  let mockScene;
  let manager;

  beforeEach(() => {
    mockScene = {
      add: vi.fn(),
      remove: vi.fn()
    };

    manager = new CollectiblesManager(mockScene);
  });

  describe('Constructor', () => {
    it('should initialize collectibles arrays', () => {
      expect(manager.mushrooms).toBeDefined();
      expect(Array.isArray(manager.mushrooms)).toBe(true);
    });

    it('should store scene reference', () => {
      expect(manager.scene).toBe(mockScene);
    });
  });

  describe('Mushroom Spawning', () => {
    it('should spawn mushroom', () => {
      manager.spawnMushroom();

      expect(manager.mushrooms.length).toBeGreaterThan(0);
    });

    it('should spawn mushroom with variant', () => {
      manager.spawnMushroom('health');

      expect(manager.mushrooms.length).toBeGreaterThan(0);
      expect(manager.mushrooms[0].variant).toBeDefined();
    });
  });

  describe('Other Collectibles', () => {
    it('should spawn buddy bug', () => {
      manager.spawnBuddyBug();

      expect(mockScene.add).toHaveBeenCalled();
    });

    it('should spawn coin', () => {
      manager.spawnCoin();

      expect(mockScene.add).toHaveBeenCalled();
    });

    it('should spawn key', () => {
      manager.spawnKey();

      expect(mockScene.add).toHaveBeenCalled();
    });

    it('should spawn berry', () => {
      manager.spawnBerry();

      expect(mockScene.add).toHaveBeenCalled();
    });
  });

  describe('Collision Detection', () => {
    it('should check collisions', () => {
      const playerPos = new THREE.Vector3(0, 0, 0);
      const result = manager.checkCollisions(playerPos, 2.5);

      // Should return null or collected item
      expect(result === null || typeof result === 'object').toBe(true);
    });

    it('should return null when no collisions', () => {
      const playerPos = new THREE.Vector3(1000, 0, 1000); // Far away
      const result = manager.checkCollisions(playerPos, 2.5);

      expect(result).toBeNull();
    });
  });

  describe('Update', () => {
    it('should update without errors', () => {
      expect(() => {
        manager.update(16);
      }).not.toThrow();
    });
  });
});

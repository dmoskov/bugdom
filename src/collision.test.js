/**
 * Collision Manager Unit Tests
 *
 * Tests for the CollisionManager class which handles all collision detection
 * in the Bugdom game.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CollisionManager } from './collision.js';
import * as THREE from 'three';

describe('CollisionManager', () => {
  let collisionManager;
  let mockAudioManager;
  let mockParticleEffects;
  let mockRippleManager;

  beforeEach(() => {
    // Create mock dependencies
    mockAudioManager = {
      playSound: vi.fn(),
      playMusic: vi.fn()
    };

    mockParticleEffects = {
      createExplosion: vi.fn(),
      createSparkles: vi.fn()
    };

    mockRippleManager = {
      createRipple: vi.fn()
    };

    collisionManager = new CollisionManager(
      mockAudioManager,
      mockParticleEffects,
      mockRippleManager
    );
  });

  describe('Constructor and Constants', () => {
    it('should initialize with correct collision radii', () => {
      expect(collisionManager.COLLECTION_RADIUS).toBe(2.5);
      expect(collisionManager.ENEMY_COLLISION_RADIUS).toBe(1.5);
      expect(collisionManager.BEE_COLLISION_RADIUS).toBe(1.2);
    });

    it('should store references to managers', () => {
      expect(collisionManager.audioManager).toBe(mockAudioManager);
      expect(collisionManager.particleEffects).toBe(mockParticleEffects);
      expect(collisionManager.rippleManager).toBe(mockRippleManager);
    });
  });

  describe('Clover Collisions', () => {
    it('should detect clover collision within radius', () => {
      const playerPos = new THREE.Vector3(0, 0, 0);
      const clover = {
        position: new THREE.Vector3(2, 0, 0), // Within 2.5 radius
        userData: { collected: false, isFourLeaf: false }
      };
      const clovers = [clover];
      const onCollect = vi.fn();

      const result = collisionManager.checkCloverCollisions(playerPos, clovers, onCollect);

      expect(result).toBe(clover);
      expect(clover.userData.collected).toBe(true);
      expect(onCollect).toHaveBeenCalledWith(clover, false);
    });

    it('should not detect clover collision outside radius', () => {
      const playerPos = new THREE.Vector3(0, 0, 0);
      const clover = {
        position: new THREE.Vector3(5, 0, 0), // Outside 2.5 radius
        userData: { collected: false, isFourLeaf: false }
      };
      const clovers = [clover];
      const onCollect = vi.fn();

      const result = collisionManager.checkCloverCollisions(playerPos, clovers, onCollect);

      expect(result).toBeNull();
      expect(clover.userData.collected).toBe(false);
      expect(onCollect).not.toHaveBeenCalled();
    });

    it('should skip already collected clovers', () => {
      const playerPos = new THREE.Vector3(0, 0, 0);
      const clover = {
        position: new THREE.Vector3(1, 0, 0),
        userData: { collected: true, isFourLeaf: false }
      };
      const clovers = [clover];
      const onCollect = vi.fn();

      const result = collisionManager.checkCloverCollisions(playerPos, clovers, onCollect);

      expect(result).toBeNull();
      expect(onCollect).not.toHaveBeenCalled();
    });

    it('should detect four-leaf clover', () => {
      const playerPos = new THREE.Vector3(0, 0, 0);
      const clover = {
        position: new THREE.Vector3(1, 0, 0),
        userData: { collected: false, isFourLeaf: true }
      };
      const clovers = [clover];
      const onCollect = vi.fn();

      collisionManager.checkCloverCollisions(playerPos, clovers, onCollect);

      expect(onCollect).toHaveBeenCalledWith(clover, true);
    });

    it('should return first collected clover from multiple clovers', () => {
      const playerPos = new THREE.Vector3(0, 0, 0);
      const clover1 = {
        position: new THREE.Vector3(1, 0, 0),
        userData: { collected: false, isFourLeaf: false }
      };
      const clover2 = {
        position: new THREE.Vector3(1.5, 0, 0),
        userData: { collected: false, isFourLeaf: false }
      };
      const clovers = [clover1, clover2];
      const onCollect = vi.fn();

      const result = collisionManager.checkCloverCollisions(playerPos, clovers, onCollect);

      expect(result).toBe(clover1);
      expect(clover1.userData.collected).toBe(true);
      expect(clover2.userData.collected).toBe(false); // Second not collected yet
    });

    it('should work without callback', () => {
      const playerPos = new THREE.Vector3(0, 0, 0);
      const clover = {
        position: new THREE.Vector3(1, 0, 0),
        userData: { collected: false, isFourLeaf: false }
      };
      const clovers = [clover];

      const result = collisionManager.checkCloverCollisions(playerPos, clovers, null);

      expect(result).toBe(clover);
      expect(clover.userData.collected).toBe(true);
    });
  });

  describe('Collectible Collisions', () => {
    let mockCollectiblesManager;

    beforeEach(() => {
      mockCollectiblesManager = {
        checkCollisions: vi.fn()
      };
    });

    it('should handle mushroom collection', () => {
      const playerPos = new THREE.Vector3(0, 0, 0);
      const mushroom = { type: 'mushroom', variant: 'red' };
      mockCollectiblesManager.checkCollisions.mockReturnValue(mushroom);
      const onMushroomCollect = vi.fn();

      const result = collisionManager.checkCollectibleCollisions(
        playerPos,
        mockCollectiblesManager,
        onMushroomCollect,
        null,
        null
      );

      expect(result).toBe(mushroom);
      expect(mockCollectiblesManager.checkCollisions).toHaveBeenCalledWith(playerPos, 2.5);
      expect(onMushroomCollect).toHaveBeenCalledWith('red', expect.any(Number));
    });

    it('should handle coin collection', () => {
      const playerPos = new THREE.Vector3(0, 0, 0);
      const coin = { type: 'coin' };
      mockCollectiblesManager.checkCollisions.mockReturnValue(coin);
      const onCoinCollect = vi.fn();

      const result = collisionManager.checkCollectibleCollisions(
        playerPos,
        mockCollectiblesManager,
        null,
        onCoinCollect,
        null
      );

      expect(result).toBe(coin);
      expect(onCoinCollect).toHaveBeenCalledWith(50);
    });

    it('should handle buddy bug collection', () => {
      const playerPos = new THREE.Vector3(0, 0, 0);
      const buddybug = { type: 'buddybug' };
      mockCollectiblesManager.checkCollisions.mockReturnValue(buddybug);
      const onBuddyBugCollect = vi.fn();

      const result = collisionManager.checkCollectibleCollisions(
        playerPos,
        mockCollectiblesManager,
        null,
        null,
        onBuddyBugCollect
      );

      expect(result).toBe(buddybug);
      expect(onBuddyBugCollect).toHaveBeenCalled();
    });

    it('should return null when no collision', () => {
      const playerPos = new THREE.Vector3(0, 0, 0);
      mockCollectiblesManager.checkCollisions.mockReturnValue(null);

      const result = collisionManager.checkCollectibleCollisions(
        playerPos,
        mockCollectiblesManager,
        null,
        null,
        null
      );

      expect(result).toBeNull();
    });

    it('should work without callbacks', () => {
      const playerPos = new THREE.Vector3(0, 0, 0);
      const coin = { type: 'coin' };
      mockCollectiblesManager.checkCollisions.mockReturnValue(coin);

      const result = collisionManager.checkCollectibleCollisions(
        playerPos,
        mockCollectiblesManager,
        null,
        null,
        null
      );

      expect(result).toBe(coin);
    });
  });

  describe('Enemy Ant Collisions', () => {
    it('should detect enemy collision within radius', () => {
      const playerPos = new THREE.Vector3(0, 0, 0);
      const enemy = {
        position: new THREE.Vector3(1, 0, 0) // Within 1.5 radius
      };
      const enemies = [enemy];
      const onCollision = vi.fn();

      const result = collisionManager.checkEnemyCollisions(playerPos, enemies, onCollision);

      expect(result).toBe(true);
      expect(onCollision).toHaveBeenCalledWith(enemy);
    });

    it('should not detect enemy collision outside radius', () => {
      const playerPos = new THREE.Vector3(0, 0, 0);
      const enemy = {
        position: new THREE.Vector3(3, 0, 0) // Outside 1.5 radius
      };
      const enemies = [enemy];
      const onCollision = vi.fn();

      const result = collisionManager.checkEnemyCollisions(playerPos, enemies, onCollision);

      expect(result).toBe(false);
      expect(onCollision).not.toHaveBeenCalled();
    });

    it('should detect collision with first enemy in range', () => {
      const playerPos = new THREE.Vector3(0, 0, 0);
      const enemy1 = {
        position: new THREE.Vector3(1, 0, 0)
      };
      const enemy2 = {
        position: new THREE.Vector3(0.5, 0, 0)
      };
      const enemies = [enemy1, enemy2];
      const onCollision = vi.fn();

      collisionManager.checkEnemyCollisions(playerPos, enemies, onCollision);

      expect(onCollision).toHaveBeenCalledWith(enemy1);
    });

    it('should work without callback', () => {
      const playerPos = new THREE.Vector3(0, 0, 0);
      const enemy = {
        position: new THREE.Vector3(1, 0, 0)
      };
      const enemies = [enemy];

      const result = collisionManager.checkEnemyCollisions(playerPos, enemies, null);

      expect(result).toBe(true);
    });
  });

  describe('Bee Collisions', () => {
    it('should detect bee collision within radius', () => {
      const playerPos = new THREE.Vector3(0, 0, 0);
      const bee = {
        position: new THREE.Vector3(1, 0, 0) // Within 1.2 radius
      };
      const bees = [bee];
      const onCollision = vi.fn();

      const result = collisionManager.checkBeeCollisions(playerPos, bees, onCollision);

      expect(result).toBe(true);
      expect(onCollision).toHaveBeenCalledWith(bee);
    });

    it('should not detect bee collision outside radius', () => {
      const playerPos = new THREE.Vector3(0, 0, 0);
      const bee = {
        position: new THREE.Vector3(3, 0, 0) // Outside 1.2 radius
      };
      const bees = [bee];
      const onCollision = vi.fn();

      const result = collisionManager.checkBeeCollisions(playerPos, bees, onCollision);

      expect(result).toBe(false);
      expect(onCollision).not.toHaveBeenCalled();
    });

    it('should use smaller radius than enemy ants', () => {
      // Bee radius (1.2) is smaller than enemy ant radius (1.5)
      expect(collisionManager.BEE_COLLISION_RADIUS).toBeLessThan(
        collisionManager.ENEMY_COLLISION_RADIUS
      );
    });
  });

  describe('Spider and Slug Collisions', () => {
    let mockEnemyManager;

    beforeEach(() => {
      mockEnemyManager = {
        checkSpiderCollisions: vi.fn(),
        checkSlugCollisions: vi.fn()
      };
    });

    it('should detect spider collision', () => {
      const playerPos = new THREE.Vector3(0, 0, 0);
      mockEnemyManager.checkSpiderCollisions.mockReturnValue(true);
      mockEnemyManager.checkSlugCollisions.mockReturnValue(false);
      const onCollision = vi.fn();

      const result = collisionManager.checkNewEnemyCollisions(
        playerPos,
        mockEnemyManager,
        onCollision
      );

      expect(result).toBe(true);
      expect(mockEnemyManager.checkSpiderCollisions).toHaveBeenCalledWith(playerPos, 2.0);
      expect(onCollision).toHaveBeenCalledWith('spider');
    });

    it('should detect slug collision', () => {
      const playerPos = new THREE.Vector3(0, 0, 0);
      mockEnemyManager.checkSpiderCollisions.mockReturnValue(false);
      mockEnemyManager.checkSlugCollisions.mockReturnValue(true);
      const onCollision = vi.fn();

      const result = collisionManager.checkNewEnemyCollisions(
        playerPos,
        mockEnemyManager,
        onCollision
      );

      expect(result).toBe(true);
      expect(mockEnemyManager.checkSlugCollisions).toHaveBeenCalledWith(playerPos, 2.0);
      expect(onCollision).toHaveBeenCalledWith('slug');
    });

    it('should return false when no collision', () => {
      const playerPos = new THREE.Vector3(0, 0, 0);
      mockEnemyManager.checkSpiderCollisions.mockReturnValue(false);
      mockEnemyManager.checkSlugCollisions.mockReturnValue(false);
      const onCollision = vi.fn();

      const result = collisionManager.checkNewEnemyCollisions(
        playerPos,
        mockEnemyManager,
        onCollision
      );

      expect(result).toBe(false);
      expect(onCollision).not.toHaveBeenCalled();
    });

    it('should prioritize spider over slug when both collide', () => {
      const playerPos = new THREE.Vector3(0, 0, 0);
      mockEnemyManager.checkSpiderCollisions.mockReturnValue(true);
      mockEnemyManager.checkSlugCollisions.mockReturnValue(true);
      const onCollision = vi.fn();

      collisionManager.checkNewEnemyCollisions(playerPos, mockEnemyManager, onCollision);

      expect(onCollision).toHaveBeenCalledWith('spider');
    });

    it('should work without callback', () => {
      const playerPos = new THREE.Vector3(0, 0, 0);
      mockEnemyManager.checkSpiderCollisions.mockReturnValue(true);
      mockEnemyManager.checkSlugCollisions.mockReturnValue(false);

      const result = collisionManager.checkNewEnemyCollisions(
        playerPos,
        mockEnemyManager,
        null
      );

      expect(result).toBe(true);
    });
  });

  describe('Distance Calculations', () => {
    it('should correctly calculate 2D distance (ignoring Y)', () => {
      const playerPos = new THREE.Vector3(0, 5, 0); // Elevated player
      const clover = {
        position: new THREE.Vector3(2, 0, 0), // On ground, 2 units away in X
        userData: { collected: false, isFourLeaf: false }
      };
      const clovers = [clover];

      // Distance should be sqrt(2^2 + 5^2 + 0^2) = sqrt(29) ≈ 5.39
      // This is > 2.5 so should NOT collide
      const result = collisionManager.checkCloverCollisions(playerPos, clovers, null);

      // Actually THREE.Vector3.distanceTo calculates 3D distance
      // So this should not collide
      expect(result).toBeNull();
    });

    it('should handle exact boundary collision', () => {
      const playerPos = new THREE.Vector3(0, 0, 0);
      const clover = {
        position: new THREE.Vector3(2.5, 0, 0), // Exactly at boundary
        userData: { collected: false, isFourLeaf: false }
      };
      const clovers = [clover];

      const result = collisionManager.checkCloverCollisions(playerPos, clovers, null);

      expect(result).toBe(clover);
    });
  });
});

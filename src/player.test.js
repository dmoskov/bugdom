/**
 * Player Character Unit Tests
 *
 * Tests for the PlayerCharacter class which handles player creation,
 * movement, animation, damage, and difficulty modifiers.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlayerCharacter } from './player.js';
import * as THREE from 'three';

describe('PlayerCharacter', () => {
  let player;
  let mockScene;

  beforeEach(() => {
    // Mock THREE.js scene
    mockScene = {
      add: vi.fn(),
      remove: vi.fn()
    };

    player = new PlayerCharacter(mockScene);
  });

  describe('Constructor and Initialization', () => {
    it('should create player with initial state', () => {
      expect(player.velocity).toBeInstanceOf(THREE.Vector3);
      expect(player.rotation).toBe(0);
      expect(player.baseMoveSpeed).toBe(0.15);
      expect(player.moveSpeed).toBe(0.15);
      expect(player.rotationSpeed).toBe(0.08);
      expect(player.isMoving).toBe(false);
      expect(player.legAnimationTime).toBe(0);
    });

    it('should initialize flash effect state', () => {
      expect(player.isFlashing).toBe(false);
      expect(player.flashEndTime).toBe(0);
      expect(player.originalColors).toEqual([]);
    });

    it('should set boundary constant', () => {
      expect(player.BOUNDARY).toBe(45);
    });

    it('should set speed boost multiplier', () => {
      expect(player.SPEED_BOOST_MULTIPLIER).toBe(1.5);
    });

    it('should create player bug mesh', () => {
      expect(player.playerBug).toBeDefined();
      expect(player.playerBug).toBeInstanceOf(THREE.Group);
    });

    it('should add player to scene', () => {
      expect(mockScene.add).toHaveBeenCalledWith(player.playerBug);
    });

    it('should store leg references', () => {
      expect(player.legs).toBeDefined();
      expect(Array.isArray(player.legs)).toBe(true);
    });
  });

  describe('Bug Character Creation', () => {
    it('should create bug with multiple children', () => {
      const bug = player.createBugCharacter();
      expect(bug.children.length).toBeGreaterThan(0);
    });

    it('should have legs stored in userData', () => {
      const bug = player.createBugCharacter();
      expect(bug.userData.legs).toBeDefined();
      expect(Array.isArray(bug.userData.legs)).toBe(true);
    });

    it('should create exactly 6 legs', () => {
      const bug = player.createBugCharacter();
      const legs = bug.userData.legs;
      expect(legs.length).toBe(6);
    });

    it('should mark legs with legIndex', () => {
      const bug = player.createBugCharacter();
      const legs = bug.userData.legs;
      legs.forEach((leg, index) => {
        expect(leg.userData.legIndex).toBe(index);
      });
    });
  });

  describe('Position and Rotation', () => {
    it('should get player mesh', () => {
      const mesh = player.getMesh();
      expect(mesh).toBe(player.playerBug);
    });

    it('should get player position as clone', () => {
      player.playerBug.position.set(5, 1, 10);
      const position = player.getPosition();

      expect(position).toBeInstanceOf(THREE.Vector3);
      expect(position.x).toBe(5);
      expect(position.y).toBe(1);
      expect(position.z).toBe(10);
      expect(position).not.toBe(player.playerBug.position); // Should be clone
    });

    it('should set player position', () => {
      player.setPosition(10, 2, 15);

      expect(player.playerBug.position.x).toBe(10);
      expect(player.playerBug.position.y).toBe(2);
      expect(player.playerBug.position.z).toBe(15);
    });

    it('should get rotation', () => {
      player.rotation = Math.PI / 2;
      expect(player.getRotation()).toBe(Math.PI / 2);
    });

    it('should set rotation', () => {
      player.setRotation(Math.PI);

      expect(player.rotation).toBe(Math.PI);
      expect(player.playerBug.rotation.y).toBe(Math.PI);
    });
  });

  describe('Movement', () => {
    it('should rotate left when left input is true', () => {
      const initialRotation = player.rotation;
      const movementInput = { forward: false, backward: false, left: true, right: false };

      player.updateMovement(movementInput);

      expect(player.rotation).toBeGreaterThan(initialRotation);
      expect(player.playerBug.rotation.y).toBe(player.rotation);
    });

    it('should rotate right when right input is true', () => {
      const initialRotation = player.rotation;
      const movementInput = { forward: false, backward: false, left: false, right: true };

      player.updateMovement(movementInput);

      expect(player.rotation).toBeLessThan(initialRotation);
      expect(player.playerBug.rotation.y).toBe(player.rotation);
    });

    it('should move forward', () => {
      player.setPosition(0, 0, 0);
      player.setRotation(0);
      const movementInput = { forward: true, backward: false, left: false, right: false };

      player.updateMovement(movementInput);

      expect(player.isMoving).toBe(true);
      // Position should change in z direction (forward)
      expect(player.playerBug.position.z).not.toBe(0);
    });

    it('should move backward', () => {
      player.setPosition(0, 0, 0);
      player.setRotation(0);
      const movementInput = { forward: false, backward: true, left: false, right: false };

      player.updateMovement(movementInput);

      expect(player.isMoving).toBe(true);
      // Position should change in z direction (backward)
      expect(player.playerBug.position.z).not.toBe(0);
    });

    it('should apply speed boost when active', () => {
      player.setPosition(0, 0, 0);
      player.setRotation(0);
      const movementInput = { forward: true, backward: false, left: false, right: false };

      // Move without speed boost
      player.updateMovement(movementInput, false);
      const normalDistance = Math.abs(player.playerBug.position.z);

      // Reset position
      player.setPosition(0, 0, 0);

      // Move with speed boost
      player.updateMovement(movementInput, true);
      const boostedDistance = Math.abs(player.playerBug.position.z);

      expect(boostedDistance).toBeGreaterThan(normalDistance);
    });

    it('should keep player within boundaries', () => {
      player.setPosition(50, 0, 50); // Beyond boundaries
      const movementInput = { forward: true, backward: false, left: false, right: false };

      player.updateMovement(movementInput);

      expect(player.playerBug.position.x).toBeLessThanOrEqual(player.BOUNDARY);
      expect(player.playerBug.position.x).toBeGreaterThanOrEqual(-player.BOUNDARY);
      expect(player.playerBug.position.z).toBeLessThanOrEqual(player.BOUNDARY);
      expect(player.playerBug.position.z).toBeGreaterThanOrEqual(-player.BOUNDARY);
    });

    it('should set isMoving to false when not moving', () => {
      const movementInput = { forward: false, backward: false, left: true, right: false };

      player.updateMovement(movementInput);

      expect(player.isMoving).toBe(false);
    });

    it('should call ripple callback when moving', () => {
      const rippleCallback = vi.fn();
      const movementInput = { forward: true, backward: false, left: false, right: false };

      // Call multiple times to increase chance of ripple (10% chance)
      for (let i = 0; i < 100; i++) {
        player.updateMovement(movementInput, false, rippleCallback);
      }

      // Should have been called at least once in 100 iterations
      // (probability of never calling in 100 tries with 10% chance is ~0.0027%)
      expect(rippleCallback.mock.calls.length).toBeGreaterThan(0);
    });

    it('should work without ripple callback', () => {
      const movementInput = { forward: true, backward: false, left: false, right: false };

      expect(() => {
        player.updateMovement(movementInput, false, null);
      }).not.toThrow();
    });
  });

  describe('Leg Animation', () => {
    it('should not animate legs when not moving', () => {
      player.isMoving = false;
      const initialAnimationTime = player.legAnimationTime;

      player.animateLegs(16);

      expect(player.legAnimationTime).toBe(initialAnimationTime);
    });

    it('should animate legs when moving', () => {
      player.isMoving = true;
      const initialAnimationTime = player.legAnimationTime;

      player.animateLegs(16);

      expect(player.legAnimationTime).toBeGreaterThan(initialAnimationTime);
    });

    it('should apply tripod gait pattern to legs', () => {
      player.isMoving = true;

      // Store initial rotations
      const initialRotations = player.legs.map(leg => leg.rotation.x);

      player.animateLegs(16);

      // At least some legs should have different rotations
      const rotationsChanged = player.legs.some((leg, i) => leg.rotation.x !== initialRotations[i]);
      expect(rotationsChanged).toBe(true);
    });
  });

  describe('Damage and Flash Effect', () => {
    it('should take damage and flash', () => {
      const currentTime = 1000;
      const result = player.takeDamage(10, currentTime);

      expect(result).toBe(true);
      expect(player.isFlashing).toBe(true);
    });

    it('should flash red when taking damage', () => {
      const currentTime = 1000;

      player.flashRed(currentTime);

      expect(player.isFlashing).toBe(true);
      expect(player.flashEndTime).toBe(currentTime + 200);
      expect(player.originalColors.length).toBeGreaterThan(0);
    });

    it('should store original colors when flashing', () => {
      const currentTime = 1000;

      player.flashRed(currentTime);

      expect(player.originalColors).toBeDefined();
      expect(Array.isArray(player.originalColors)).toBe(true);
    });

    it('should restore colors after flash ends', () => {
      const currentTime = 1000;

      player.flashRed(currentTime);
      expect(player.isFlashing).toBe(true);

      // Update flash after duration
      player.updateFlash(currentTime + 300);

      expect(player.isFlashing).toBe(false);
      expect(player.originalColors.length).toBe(0);
    });

    it('should not restore colors before flash ends', () => {
      const currentTime = 1000;

      player.flashRed(currentTime);
      expect(player.isFlashing).toBe(true);

      // Update flash before duration
      player.updateFlash(currentTime + 100);

      expect(player.isFlashing).toBe(true);
    });
  });

  describe('Difficulty Modifiers', () => {
    it('should apply speed multiplier from difficulty preset', () => {
      const difficultyPreset = {
        playerSpeedMultiplier: 1.5
      };

      player.applyDifficultyModifiers(difficultyPreset);

      expect(player.moveSpeed).toBe(player.baseMoveSpeed * 1.5);
    });

    it('should apply slower speed for harder difficulty', () => {
      const difficultyPreset = {
        playerSpeedMultiplier: 0.8
      };

      player.applyDifficultyModifiers(difficultyPreset);

      expect(player.moveSpeed).toBe(player.baseMoveSpeed * 0.8);
    });

    it('should apply faster speed for easier difficulty', () => {
      const difficultyPreset = {
        playerSpeedMultiplier: 1.2
      };

      player.applyDifficultyModifiers(difficultyPreset);

      expect(player.moveSpeed).toBe(player.baseMoveSpeed * 1.2);
    });

    it('should preserve base move speed', () => {
      const originalBaseSpeed = player.baseMoveSpeed;
      const difficultyPreset = {
        playerSpeedMultiplier: 2.0
      };

      player.applyDifficultyModifiers(difficultyPreset);

      expect(player.baseMoveSpeed).toBe(originalBaseSpeed);
    });
  });

  describe('Bounding Box', () => {
    it('should get bounding box for collision detection', () => {
      const bbox = player.getBoundingBox();

      expect(bbox).toBeInstanceOf(THREE.Box3);
    });

    it('should have valid bounding box', () => {
      const bbox = player.getBoundingBox();

      expect(bbox.min).toBeInstanceOf(THREE.Vector3);
      expect(bbox.max).toBeInstanceOf(THREE.Vector3);
    });
  });

  describe('Speed Constants', () => {
    it('should have consistent speed boost multiplier', () => {
      expect(player.SPEED_BOOST_MULTIPLIER).toBe(1.5);
    });

    it('should calculate boosted speed correctly', () => {
      const normalSpeed = player.moveSpeed;
      const boostedSpeed = normalSpeed * player.SPEED_BOOST_MULTIPLIER;

      expect(boostedSpeed).toBe(normalSpeed * 1.5);
    });
  });
});

/**
 * Level Manager Unit Tests
 *
 * Tests for the LevelManager class which handles level progression.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LevelManager } from './levels.js';

describe('LevelManager', () => {
  let levelManager;
  let mockDependencies;

  beforeEach(() => {
    mockDependencies = {
      scene: { add: vi.fn(), remove: vi.fn() },
      gameState: {
        getCurrentLevel: vi.fn().mockReturnValue(1),
        getDifficultySettings: vi.fn().mockReturnValue({
          enemySpeed: 0.04,
          maxEnemies: 3,
          spawnRate: 0
        })
      },
      enemyManager: {
        spawnSpider: vi.fn(),
        spawnSlug: vi.fn(),
        update: vi.fn()
      },
      collectiblesManager: {
        spawnMushroom: vi.fn(),
        spawnCoin: vi.fn()
      }
    };

    levelManager = new LevelManager(mockDependencies);
  });

  describe('Constructor', () => {
    it('should store scene reference', () => {
      expect(levelManager.scene).toBe(mockDependencies.scene);
    });

    it('should store game state reference', () => {
      expect(levelManager.gameState).toBe(mockDependencies.gameState);
    });

    it('should store enemy manager reference', () => {
      expect(levelManager.enemyManager).toBe(mockDependencies.enemyManager);
    });

    it('should store collectibles manager reference', () => {
      expect(levelManager.collectiblesManager).toBe(mockDependencies.collectiblesManager);
    });
  });

  describe('Enemy Spawning', () => {
    it('should spawn enemy', () => {
      levelManager.spawnEnemy();

      // Should call one of the spawn methods
      const spawned = mockDependencies.enemyManager.spawnSpider.mock.calls.length > 0 ||
                     mockDependencies.enemyManager.spawnSlug.mock.calls.length > 0;
      expect(spawned).toBe(true);
    });

    it('should not throw when spawning enemy', () => {
      expect(() => {
        levelManager.spawnEnemy();
      }).not.toThrow();
    });
  });

  describe('Update', () => {
    it('should update without errors', () => {
      expect(() => {
        levelManager.update(16);
      }).not.toThrow();
    });

    it('should call enemy manager update', () => {
      const playerPos = { x: 0, y: 0, z: 0 };
      levelManager.update(16, playerPos);

      expect(mockDependencies.enemyManager.update).toHaveBeenCalled();
    });
  });

  describe('Level Settings', () => {
    it('should get current level settings', () => {
      mockDependencies.gameState.getCurrentLevel.mockReturnValue(2);

      // Should call getDifficultySettings
      levelManager.update(16);

      expect(mockDependencies.gameState.getDifficultySettings).toHaveBeenCalled();
    });
  });
});

/**
 * Game Loop Unit Tests
 *
 * Tests for the GameLoop class which orchestrates game updates and lifecycle events.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameLoop } from './gameLoop.js';

describe('GameLoop', () => {
  let gameLoop;
  let mockDependencies;

  beforeEach(() => {
    // Create comprehensive mock dependencies
    mockDependencies = {
      scene: { add: vi.fn(), remove: vi.fn() },
      camera: {},
      renderer: { render: vi.fn() },
      gameState: {
        incrementComboCount: vi.fn(),
        setLastCollectTime: vi.fn(),
        updateComboMultiplier: vi.fn(),
        getComboMultiplier: vi.fn().mockReturnValue(1),
        addScore: vi.fn(),
        addCloverCollected: vi.fn(),
        getCloversCollected: vi.fn().mockReturnValue(0),
        getTotalClovers: vi.fn().mockReturnValue(30),
        getGameWon: vi.fn().mockReturnValue(false),
        getCurrentLevel: vi.fn().mockReturnValue(1),
        getMaxLevel: vi.fn().mockReturnValue(10),
        setCurrentLevel: vi.fn(),
        CLOVERS_PER_LEVEL: 3,
        getPlayerHealth: vi.fn().mockReturnValue(100),
        getMaxHealth: vi.fn().mockReturnValue(100),
        setPlayerHealth: vi.fn(),
        damagePlayer: vi.fn(),
        activateSpeedBoost: vi.fn(),
        activateInvincibility: vi.fn(),
        addExtraLife: vi.fn(),
        getGameState: vi.fn().mockReturnValue('playing'),
        setGameState: vi.fn(),
        checkAndUpdateHighScore: vi.fn(),
        GameState: { PLAYING: 'playing', PAUSED: 'paused', GAME_OVER: 'game_over' }
      },
      player: {
        getPosition: vi.fn().mockReturnValue({ x: 0, y: 0, z: 0 }),
        updateMovement: vi.fn(),
        animateLegs: vi.fn(),
        updateFlash: vi.fn(),
        takeDamage: vi.fn()
      },
      cameraController: { update: vi.fn() },
      inputManager: {
        getMovementInput: vi.fn().mockReturnValue({
          forward: false,
          backward: false,
          left: false,
          right: false
        })
      },
      levelManager: { spawnEnemy: vi.fn(), update: vi.fn() },
      collectiblesManager: { update: vi.fn(), checkCollisions: vi.fn() },
      particleEffects: { update: vi.fn() },
      rippleManager: { update: vi.fn(), createRipple: vi.fn() },
      collisionManager: {
        checkCloverCollisions: vi.fn(),
        checkCollectibleCollisions: vi.fn(),
        checkEnemyCollisions: vi.fn(),
        checkBeeCollisions: vi.fn(),
        checkNewEnemyCollisions: vi.fn()
      },
      uiManager: {
        showComboPopup: vi.fn(),
        showLevelUpPopup: vi.fn(),
        showPowerUpMessage: vi.fn(),
        updateScoreDisplay: vi.fn(),
        updateCloverCountDisplay: vi.fn(),
        updateComboDisplay: vi.fn(),
        updateLivesDisplay: vi.fn(),
        updateHealthDisplay: vi.fn(),
        showGameOver: vi.fn(),
        showVictory: vi.fn()
      },
      audioManager: {
        playCollect: vi.fn(),
        playLevelUp: vi.fn(),
        playPowerUp: vi.fn(),
        playHit: vi.fn(),
        playGameOver: vi.fn(),
        playVictory: vi.fn()
      },
      dayNightCycle: { update: vi.fn() },
      clovers: []
    };

    gameLoop = new GameLoop(mockDependencies);
  });

  describe('Constructor and Initialization', () => {
    it('should store all dependencies', () => {
      expect(gameLoop.scene).toBe(mockDependencies.scene);
      expect(gameLoop.camera).toBe(mockDependencies.camera);
      expect(gameLoop.renderer).toBe(mockDependencies.renderer);
      expect(gameLoop.gameState).toBe(mockDependencies.gameState);
      expect(gameLoop.player).toBe(mockDependencies.player);
    });

    it('should initialize timing variables', () => {
      expect(gameLoop.lastTime).toBe(0);
      expect(gameLoop.animationTime).toBe(0);
      expect(gameLoop.animationFrameId).toBeNull();
    });

    it('should store clovers reference', () => {
      expect(gameLoop.clovers).toBe(mockDependencies.clovers);
    });
  });

  describe('Clover Collection', () => {
    let mockClover;

    beforeEach(() => {
      mockClover = {
        visible: true,
        userData: { collected: false }
      };
    });

    it('should increment combo count on clover collect', () => {
      gameLoop.onCloverCollect(mockClover, false);

      expect(mockDependencies.gameState.incrementComboCount).toHaveBeenCalled();
    });

    it('should update last collect time', () => {
      gameLoop.onCloverCollect(mockClover, false);

      expect(mockDependencies.gameState.setLastCollectTime).toHaveBeenCalledWith(expect.any(Number));
    });

    it('should update combo multiplier', () => {
      gameLoop.onCloverCollect(mockClover, false);

      expect(mockDependencies.gameState.updateComboMultiplier).toHaveBeenCalled();
    });

    it('should add base points for normal clover', () => {
      mockDependencies.gameState.getComboMultiplier.mockReturnValue(1);

      gameLoop.onCloverCollect(mockClover, false);

      expect(mockDependencies.gameState.addScore).toHaveBeenCalledWith(5); // 5 * 1
    });

    it('should add bonus points for four-leaf clover', () => {
      mockDependencies.gameState.getComboMultiplier.mockReturnValue(1);

      gameLoop.onCloverCollect(mockClover, true);

      expect(mockDependencies.gameState.addScore).toHaveBeenCalledWith(15); // 15 * 1
    });

    it('should multiply points by combo multiplier', () => {
      mockDependencies.gameState.getComboMultiplier.mockReturnValue(3);

      gameLoop.onCloverCollect(mockClover, false);

      expect(mockDependencies.gameState.addScore).toHaveBeenCalledWith(15); // 5 * 3
    });

    it('should increment clovers collected', () => {
      gameLoop.onCloverCollect(mockClover, false);

      expect(mockDependencies.gameState.addCloverCollected).toHaveBeenCalled();
    });

    it('should play collection sound', () => {
      gameLoop.onCloverCollect(mockClover, false);

      expect(mockDependencies.audioManager.playCollect).toHaveBeenCalled();
    });

    it('should hide collected clover', () => {
      gameLoop.onCloverCollect(mockClover, false);

      expect(mockClover.visible).toBe(false);
    });

    it('should show combo popup when multiplier > 1', () => {
      mockDependencies.gameState.getComboMultiplier.mockReturnValue(2);

      gameLoop.onCloverCollect(mockClover, false);

      expect(mockDependencies.uiManager.showComboPopup).toHaveBeenCalledWith(2, 10);
    });

    it('should not show combo popup when multiplier = 1', () => {
      mockDependencies.gameState.getComboMultiplier.mockReturnValue(1);

      gameLoop.onCloverCollect(mockClover, false);

      expect(mockDependencies.uiManager.showComboPopup).not.toHaveBeenCalled();
    });

    it('should update UI displays', () => {
      gameLoop.onCloverCollect(mockClover, false);

      expect(mockDependencies.uiManager.updateScoreDisplay).toHaveBeenCalled();
      expect(mockDependencies.uiManager.updateCloverCountDisplay).toHaveBeenCalled();
      expect(mockDependencies.uiManager.updateComboDisplay).toHaveBeenCalled();
    });

    it('should trigger level up at threshold', () => {
      mockDependencies.gameState.getCloversCollected.mockReturnValue(3); // 3 clovers = level 2
      mockDependencies.gameState.getCurrentLevel.mockReturnValue(1);

      gameLoop.onCloverCollect(mockClover, false);

      expect(mockDependencies.gameState.setCurrentLevel).toHaveBeenCalledWith(2);
      expect(mockDependencies.uiManager.showLevelUpPopup).toHaveBeenCalledWith(2);
      expect(mockDependencies.audioManager.playLevelUp).toHaveBeenCalled();
      expect(mockDependencies.levelManager.spawnEnemy).toHaveBeenCalled();
    });

    it('should not level up beyond max level', () => {
      mockDependencies.gameState.getCloversCollected.mockReturnValue(33);
      mockDependencies.gameState.getCurrentLevel.mockReturnValue(10);
      mockDependencies.gameState.getMaxLevel.mockReturnValue(10);

      gameLoop.onCloverCollect(mockClover, false);

      // Should not call setCurrentLevel to 11
      expect(mockDependencies.uiManager.showLevelUpPopup).not.toHaveBeenCalled();
    });

    it('should trigger victory when all clovers collected', () => {
      mockDependencies.gameState.getCloversCollected.mockReturnValue(30);
      mockDependencies.gameState.getTotalClovers.mockReturnValue(30);
      mockDependencies.gameState.getGameWon.mockReturnValue(false);

      const victorySpy = vi.spyOn(gameLoop, 'victory');

      gameLoop.onCloverCollect(mockClover, false);

      expect(victorySpy).toHaveBeenCalled();

      victorySpy.mockRestore();
    });

    it('should not trigger victory if already won', () => {
      mockDependencies.gameState.getCloversCollected.mockReturnValue(30);
      mockDependencies.gameState.getTotalClovers.mockReturnValue(30);
      mockDependencies.gameState.getGameWon.mockReturnValue(true);

      const victorySpy = vi.spyOn(gameLoop, 'victory');

      gameLoop.onCloverCollect(mockClover, false);

      expect(victorySpy).not.toHaveBeenCalled();

      victorySpy.mockRestore();
    });
  });

  describe('Lifecycle Control', () => {
    it('should start game loop', () => {
      gameLoop.start();

      expect(gameLoop.animationFrameId).not.toBeNull();
    });

    it('should stop game loop', () => {
      gameLoop.start();
      const frameId = gameLoop.animationFrameId;

      gameLoop.stop();

      expect(gameLoop.animationFrameId).toBeNull();
    });

    it('should not error when stopping already stopped loop', () => {
      expect(() => {
        gameLoop.stop();
      }).not.toThrow();
    });
  });

  describe('Victory State', () => {
    it('should set game state to game over on victory', () => {
      gameLoop.victory = vi.fn(() => {
        mockDependencies.gameState.setGameState('game_over');
      });

      gameLoop.victory();

      expect(mockDependencies.gameState.setGameState).toHaveBeenCalled();
    });
  });

  describe('Game Over State', () => {
    it('should set game state to game over', () => {
      gameLoop.gameOver = vi.fn(() => {
        mockDependencies.gameState.setGameState('game_over');
      });

      gameLoop.gameOver();

      expect(mockDependencies.gameState.setGameState).toHaveBeenCalled();
    });
  });
});

/**
 * Game State Manager Unit Tests
 *
 * Tests for the GameStateManager class which handles all game state including
 * score, difficulty, combos, health, and power-ups.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameStateManager } from './gameState.js';

describe('GameStateManager', () => {
  let gameState;

  beforeEach(() => {
    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };

    gameState = new GameStateManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with default score values', () => {
      expect(gameState.score).toBe(0);
      expect(gameState.highScore).toBe(0);
      expect(gameState.isNewHighScore).toBe(false);
      expect(gameState.cloversCollected).toBe(0);
      expect(gameState.TOTAL_CLOVERS).toBe(30);
    });

    it('should initialize with PLAYING game state', () => {
      expect(gameState.gameState).toBe(gameState.GameState.PLAYING);
      expect(gameState.gameWon).toBe(false);
    });

    it('should initialize with medium difficulty', () => {
      expect(gameState.selectedDifficulty).toBe('medium');
    });

    it('should initialize at level 1', () => {
      expect(gameState.currentLevel).toBe(1);
      expect(gameState.MAX_LEVEL).toBe(10);
      expect(gameState.CLOVERS_PER_LEVEL).toBe(3);
    });

    it('should initialize with full health', () => {
      expect(gameState.playerHealth).toBe(100);
      expect(gameState.MAX_HEALTH).toBe(100);
      expect(gameState.extraLives).toBe(0);
    });

    it('should initialize with no active power-ups', () => {
      expect(gameState.speedBoostActive).toBe(false);
      expect(gameState.invincibilityActive).toBe(false);
    });

    it('should initialize combo system', () => {
      expect(gameState.comboCount).toBe(0);
      expect(gameState.comboMultiplier).toBe(1);
      expect(gameState.lastCollectTime).toBe(0);
      expect(gameState.COMBO_WINDOW).toBe(3000);
      expect(gameState.MAX_COMBO_MULTIPLIER).toBe(5);
    });
  });

  describe('Score Management', () => {
    it('should add score points', () => {
      gameState.addScore(100);
      expect(gameState.getScore()).toBe(100);

      gameState.addScore(50);
      expect(gameState.getScore()).toBe(150);
    });

    it('should track clovers collected', () => {
      gameState.addCloverCollected();
      expect(gameState.getCloversCollected()).toBe(1);

      gameState.addCloverCollected();
      expect(gameState.getCloversCollected()).toBe(2);
    });

    it('should get total clovers', () => {
      expect(gameState.getTotalClovers()).toBe(30);
    });
  });

  describe('High Score Persistence', () => {
    it('should load high score from localStorage', () => {
      global.localStorage.getItem.mockReturnValue('1000');
      const newGameState = new GameStateManager();

      expect(newGameState.highScore).toBe(1000);
      expect(global.localStorage.getItem).toHaveBeenCalledWith('bugdom_highscore');
    });

    it('should handle missing high score in localStorage', () => {
      global.localStorage.getItem.mockReturnValue(null);
      const newGameState = new GameStateManager();

      expect(newGameState.highScore).toBe(0);
    });

    it('should handle invalid high score in localStorage', () => {
      global.localStorage.getItem.mockReturnValue('invalid');
      const newGameState = new GameStateManager();

      expect(newGameState.highScore).toBe(0);
    });

    it('should handle localStorage errors gracefully', () => {
      global.localStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const newGameState = new GameStateManager();
      expect(newGameState.highScore).toBe(0);
    });

    it('should save high score to localStorage', () => {
      gameState.highScore = 5000;
      gameState.saveHighScore();

      expect(global.localStorage.setItem).toHaveBeenCalledWith('bugdom_highscore', '5000');
    });

    it('should handle save errors gracefully', () => {
      global.localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      gameState.highScore = 5000;
      expect(() => gameState.saveHighScore()).not.toThrow();
    });

    it('should update high score if current score is higher', () => {
      gameState.score = 1500;
      gameState.highScore = 1000;

      const updated = gameState.checkAndUpdateHighScore();

      expect(updated).toBe(true);
      expect(gameState.highScore).toBe(1500);
      expect(gameState.isNewHighScore).toBe(true);
      expect(global.localStorage.setItem).toHaveBeenCalled();
    });

    it('should not update high score if current score is lower', () => {
      gameState.score = 500;
      gameState.highScore = 1000;

      const updated = gameState.checkAndUpdateHighScore();

      expect(updated).toBe(false);
      expect(gameState.highScore).toBe(1000);
      expect(gameState.isNewHighScore).toBe(false);
    });

    it('should get high score', () => {
      gameState.highScore = 2000;
      expect(gameState.getHighScore()).toBe(2000);
    });

    it('should set high score', () => {
      gameState.setHighScore(3000);
      expect(gameState.highScore).toBe(3000);
    });
  });

  describe('Game State Management', () => {
    it('should get game state', () => {
      expect(gameState.getGameState()).toBe('playing');
    });

    it('should set game state', () => {
      gameState.setGameState(gameState.GameState.PAUSED);
      expect(gameState.getGameState()).toBe('paused');
    });

    it('should check if game is playing', () => {
      gameState.setGameState(gameState.GameState.PLAYING);
      expect(gameState.isPlaying()).toBe(true);
      expect(gameState.isPaused()).toBe(false);
      expect(gameState.isGameOver()).toBe(false);
    });

    it('should check if game is paused', () => {
      gameState.setGameState(gameState.GameState.PAUSED);
      expect(gameState.isPaused()).toBe(true);
      expect(gameState.isPlaying()).toBe(false);
      expect(gameState.isGameOver()).toBe(false);
    });

    it('should check if game is over', () => {
      gameState.setGameState(gameState.GameState.GAME_OVER);
      expect(gameState.isGameOver()).toBe(true);
      expect(gameState.isPlaying()).toBe(false);
      expect(gameState.isPaused()).toBe(false);
    });

    it('should set game won status', () => {
      gameState.setGameWon(true);
      expect(gameState.getGameWon()).toBe(true);
    });

    it('should track game start time', () => {
      gameState.setGameStartTime(1000);
      expect(gameState.getGameStartTime()).toBe(1000);
    });

    it('should track paused time', () => {
      gameState.addPausedTime(500);
      gameState.addPausedTime(300);
      expect(gameState.getPausedTime()).toBe(800);
    });
  });

  describe('Level Progression', () => {
    it('should get current level', () => {
      expect(gameState.getCurrentLevel()).toBe(1);
    });

    it('should set current level', () => {
      gameState.setCurrentLevel(5);
      expect(gameState.getCurrentLevel()).toBe(5);
    });

    it('should not exceed max level when setting', () => {
      gameState.setCurrentLevel(15);
      expect(gameState.getCurrentLevel()).toBe(10); // MAX_LEVEL
    });

    it('should increment level', () => {
      const incremented = gameState.incrementLevel();
      expect(incremented).toBe(true);
      expect(gameState.getCurrentLevel()).toBe(2);
    });

    it('should not increment beyond max level', () => {
      gameState.setCurrentLevel(10);
      const incremented = gameState.incrementLevel();

      expect(incremented).toBe(false);
      expect(gameState.getCurrentLevel()).toBe(10);
    });

    it('should get max level', () => {
      expect(gameState.getMaxLevel()).toBe(10);
    });

    it('should get clovers per level', () => {
      expect(gameState.getCloversPerLevel()).toBe(3);
    });
  });

  describe('Difficulty System', () => {
    it('should have all difficulty presets defined', () => {
      expect(gameState.DIFFICULTY_PRESETS.easy).toBeDefined();
      expect(gameState.DIFFICULTY_PRESETS.medium).toBeDefined();
      expect(gameState.DIFFICULTY_PRESETS.hard).toBeDefined();
    });

    it('should get selected difficulty', () => {
      expect(gameState.getSelectedDifficulty()).toBe('medium');
    });

    it('should set valid difficulty', () => {
      const result = gameState.setSelectedDifficulty('hard');
      expect(result).toBe(true);
      expect(gameState.getSelectedDifficulty()).toBe('hard');
    });

    it('should reject invalid difficulty', () => {
      const result = gameState.setSelectedDifficulty('extreme');
      expect(result).toBe(false);
      expect(gameState.getSelectedDifficulty()).toBe('medium'); // unchanged
    });

    it('should get difficulty preset', () => {
      const preset = gameState.getDifficultyPreset('easy');
      expect(preset.playerHealthMultiplier).toBe(1.5);
      expect(preset.enemySpeedMultiplier).toBe(0.7);
    });

    it('should get current difficulty preset when no argument', () => {
      gameState.setSelectedDifficulty('hard');
      const preset = gameState.getDifficultyPreset();
      expect(preset.playerHealthMultiplier).toBe(0.75);
    });

    it('should calculate difficulty settings for level', () => {
      gameState.setSelectedDifficulty('medium');
      const settings = gameState.getDifficultySettings(1);

      expect(settings.enemySpeed).toBe(0.04); // base * 1.0
      expect(settings.maxEnemies).toBe(3); // base * 1.0
      expect(settings.spawnRate).toBe(0); // level 1 has 0 spawn rate
    });

    it('should scale difficulty settings with hard mode', () => {
      gameState.setSelectedDifficulty('hard');
      const settings = gameState.getDifficultySettings(2);

      expect(settings.enemySpeed).toBe(0.05 * 1.3); // base * hard multiplier
      expect(settings.maxEnemies).toBe(Math.ceil(4 * 1.3)); // 6 enemies
      expect(settings.spawnRate).toBe(15000 * 0.7); // faster spawn
    });

    it('should scale difficulty settings with easy mode', () => {
      gameState.setSelectedDifficulty('easy');
      const settings = gameState.getDifficultySettings(3);

      expect(settings.enemySpeed).toBe(0.06 * 0.7); // base * easy multiplier
      expect(settings.maxEnemies).toBe(Math.ceil(5 * 0.7)); // 4 enemies
      expect(settings.spawnRate).toBe(12000 * 1.5); // slower spawn
    });
  });

  describe('Combo System', () => {
    it('should get combo count', () => {
      gameState.comboCount = 5;
      expect(gameState.getComboCount()).toBe(5);
    });

    it('should set combo count', () => {
      gameState.setComboCount(10);
      expect(gameState.getComboCount()).toBe(10);
    });

    it('should increment combo count', () => {
      gameState.incrementComboCount();
      expect(gameState.getComboCount()).toBe(1);

      gameState.incrementComboCount();
      expect(gameState.getComboCount()).toBe(2);
    });

    it('should reset combo', () => {
      gameState.comboCount = 10;
      gameState.comboMultiplier = 4;

      gameState.resetCombo();

      expect(gameState.getComboCount()).toBe(0);
      expect(gameState.getComboMultiplier()).toBe(1);
    });

    it('should get combo multiplier', () => {
      gameState.comboMultiplier = 3;
      expect(gameState.getComboMultiplier()).toBe(3);
    });

    it('should set combo multiplier', () => {
      gameState.setComboMultiplier(4);
      expect(gameState.getComboMultiplier()).toBe(4);
    });

    it('should cap combo multiplier at max', () => {
      gameState.setComboMultiplier(10);
      expect(gameState.getComboMultiplier()).toBe(5); // MAX_COMBO_MULTIPLIER
    });

    it('should update combo multiplier based on combo count', () => {
      gameState.comboCount = 0;
      gameState.updateComboMultiplier();
      expect(gameState.getComboMultiplier()).toBe(1); // 1 + floor(0/3) = 1

      gameState.comboCount = 3;
      gameState.updateComboMultiplier();
      expect(gameState.getComboMultiplier()).toBe(2); // 1 + floor(3/3) = 2

      gameState.comboCount = 9;
      gameState.updateComboMultiplier();
      expect(gameState.getComboMultiplier()).toBe(4); // 1 + floor(9/3) = 4

      gameState.comboCount = 50;
      gameState.updateComboMultiplier();
      expect(gameState.getComboMultiplier()).toBe(5); // capped at MAX
    });

    it('should track last collect time', () => {
      gameState.setLastCollectTime(5000);
      expect(gameState.getLastCollectTime()).toBe(5000);
    });

    it('should get combo window', () => {
      expect(gameState.getComboWindow()).toBe(3000);
    });

    it('should get max combo multiplier', () => {
      expect(gameState.getMaxComboMultiplier()).toBe(5);
    });

    it('should not expire combo within window', () => {
      gameState.setLastCollectTime(1000);
      gameState.comboCount = 5;

      const expired = gameState.checkComboExpiration(3000); // 2s elapsed

      expect(expired).toBe(false);
      expect(gameState.getComboCount()).toBe(5);
    });

    it('should expire combo after window', () => {
      gameState.setLastCollectTime(1000);
      gameState.comboCount = 5;
      gameState.comboMultiplier = 3;

      const expired = gameState.checkComboExpiration(5000); // 4s elapsed (> 3s window)

      expect(expired).toBe(true);
      expect(gameState.getComboCount()).toBe(0);
      expect(gameState.getComboMultiplier()).toBe(1);
    });

    it('should not expire combo when lastCollectTime is 0', () => {
      gameState.setLastCollectTime(0);
      gameState.comboCount = 5;

      const expired = gameState.checkComboExpiration(5000);

      expect(expired).toBe(false);
      expect(gameState.getComboCount()).toBe(5);
    });
  });

  describe('Health System', () => {
    it('should get player health', () => {
      expect(gameState.getPlayerHealth()).toBe(100);
    });

    it('should set player health', () => {
      gameState.setPlayerHealth(50);
      expect(gameState.getPlayerHealth()).toBe(50);
    });

    it('should not set health below 0', () => {
      gameState.setPlayerHealth(-10);
      expect(gameState.getPlayerHealth()).toBe(0);
    });

    it('should not set health above max', () => {
      gameState.setPlayerHealth(150);
      expect(gameState.getPlayerHealth()).toBe(100); // MAX_HEALTH
    });

    it('should damage player', () => {
      gameState.setPlayerHealth(100);
      const newHealth = gameState.damagePlayer(30);

      expect(newHealth).toBe(70);
      expect(gameState.getPlayerHealth()).toBe(70);
    });

    it('should not damage below 0', () => {
      gameState.setPlayerHealth(20);
      const newHealth = gameState.damagePlayer(50);

      expect(newHealth).toBe(0);
      expect(gameState.getPlayerHealth()).toBe(0);
    });

    it('should heal player', () => {
      gameState.setPlayerHealth(50);
      const newHealth = gameState.healPlayer(30);

      expect(newHealth).toBe(80);
      expect(gameState.getPlayerHealth()).toBe(80);
    });

    it('should not heal above max health', () => {
      gameState.setPlayerHealth(90);
      const newHealth = gameState.healPlayer(30);

      expect(newHealth).toBe(100);
      expect(gameState.getPlayerHealth()).toBe(100);
    });

    it('should get max health', () => {
      expect(gameState.getMaxHealth()).toBe(100);
    });

    it('should set max health', () => {
      gameState.setMaxHealth(150);
      expect(gameState.getMaxHealth()).toBe(150);
    });
  });

  describe('Power-up System', () => {
    it('should have correct power-up durations', () => {
      expect(gameState.SPEED_BOOST_DURATION).toBe(8000);
      expect(gameState.INVINCIBILITY_DURATION).toBe(10000);
      expect(gameState.SPEED_BOOST_MULTIPLIER).toBe(1.5);
    });

    it('should initialize with no active power-ups', () => {
      expect(gameState.speedBoostActive).toBe(false);
      expect(gameState.invincibilityActive).toBe(false);
      expect(gameState.speedBoostEndTime).toBe(0);
      expect(gameState.invincibilityEndTime).toBe(0);
    });
  });

  describe('Enemy Spawn Timing', () => {
    it('should track last enemy spawn time', () => {
      expect(gameState.lastEnemySpawnTime).toBe(0);
    });

    it('should allow updating last spawn time', () => {
      gameState.lastEnemySpawnTime = 5000;
      expect(gameState.lastEnemySpawnTime).toBe(5000);
    });
  });

  describe('Difficulty Presets Validation', () => {
    it('should have valid easy preset', () => {
      const easy = gameState.DIFFICULTY_PRESETS.easy;
      expect(easy.playerHealthMultiplier).toBe(1.5);
      expect(easy.enemySpeedMultiplier).toBe(0.7);
      expect(easy.damageMultiplier).toBe(0.7);
    });

    it('should have valid medium preset', () => {
      const medium = gameState.DIFFICULTY_PRESETS.medium;
      expect(medium.playerHealthMultiplier).toBe(1.0);
      expect(medium.enemySpeedMultiplier).toBe(1.0);
      expect(medium.damageMultiplier).toBe(1.0);
    });

    it('should have valid hard preset', () => {
      const hard = gameState.DIFFICULTY_PRESETS.hard;
      expect(hard.playerHealthMultiplier).toBe(0.75);
      expect(hard.enemySpeedMultiplier).toBe(1.3);
      expect(hard.damageMultiplier).toBe(1.5);
    });
  });

  describe('Base Difficulty Settings', () => {
    it('should have settings for all levels', () => {
      for (let level = 1; level <= 10; level++) {
        const settings = gameState.BASE_DIFFICULTY_SETTINGS[level];
        expect(settings).toBeDefined();
        expect(settings.enemySpeed).toBeGreaterThan(0);
        expect(settings.maxEnemies).toBeGreaterThan(0);
        expect(settings.spawnRate).toBeGreaterThanOrEqual(0);
      }
    });

    it('should have increasing difficulty across levels', () => {
      const level1 = gameState.BASE_DIFFICULTY_SETTINGS[1];
      const level5 = gameState.BASE_DIFFICULTY_SETTINGS[5];
      const level10 = gameState.BASE_DIFFICULTY_SETTINGS[10];

      expect(level5.enemySpeed).toBeGreaterThan(level1.enemySpeed);
      expect(level10.enemySpeed).toBeGreaterThan(level5.enemySpeed);

      expect(level5.maxEnemies).toBeGreaterThan(level1.maxEnemies);
      expect(level10.maxEnemies).toBeGreaterThan(level5.maxEnemies);
    });
  });
});

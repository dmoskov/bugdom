// ============================================
// GAME STATE MANAGER
// ============================================
// Pure state management module with no dependencies on THREE.js or DOM
// Handles all game state including score, difficulty, combos, health, and power-ups

export class GameStateManager {
  constructor() {
    // ============================================
    // SCORE STATE
    // ============================================
    this.score = 0;
    this.highScore = 0;
    this.isNewHighScore = false;
    this.cloversCollected = 0;
    this.TOTAL_CLOVERS = 30;

    // ============================================
    // GAME STATE ENUM AND VARIABLES
    // ============================================
    this.GameState = {
      PLAYING: 'playing',
      PAUSED: 'paused',
      GAME_OVER: 'game_over'
    };
    this.gameState = this.GameState.PLAYING;
    this.gameWon = false;
    this.gameStartTime = 0;
    this.pausedTime = 0; // Track time spent paused

    // ============================================
    // DIFFICULTY & PROGRESSION SYSTEM
    // ============================================

    // Base difficulty presets
    this.DIFFICULTY_PRESETS = {
      easy: {
        name: 'Easy',
        description: 'Relaxed gameplay - Perfect for beginners',
        playerHealthMultiplier: 1.5,   // 150 health
        playerSpeedMultiplier: 1.1,    // 10% faster movement
        enemySpeedMultiplier: 0.7,     // 30% slower enemies
        enemyHealthMultiplier: 0.7,    // 30% less health
        enemyCountMultiplier: 0.7,     // Fewer enemies (rounded down)
        spawnRateMultiplier: 1.5,      // 50% slower spawn rate (higher = slower)
        damageMultiplier: 0.7          // Take 30% less damage
      },
      medium: {
        name: 'Medium',
        description: 'Balanced gameplay - Recommended for most players',
        playerHealthMultiplier: 1.0,   // 100 health (normal)
        playerSpeedMultiplier: 1.0,    // Normal movement
        enemySpeedMultiplier: 1.0,     // Normal enemy speed
        enemyHealthMultiplier: 1.0,    // Normal enemy health
        enemyCountMultiplier: 1.0,     // Normal enemy count
        spawnRateMultiplier: 1.0,      // Normal spawn rate
        damageMultiplier: 1.0          // Normal damage
      },
      hard: {
        name: 'Hard',
        description: 'Intense challenge - For experienced players only!',
        playerHealthMultiplier: 0.75,  // 75 health
        playerSpeedMultiplier: 0.9,    // 10% slower movement
        enemySpeedMultiplier: 1.3,     // 30% faster enemies
        enemyHealthMultiplier: 1.5,    // 50% more health
        enemyCountMultiplier: 1.3,     // More enemies (rounded up)
        spawnRateMultiplier: 0.7,      // 30% faster spawn rate (lower = faster)
        damageMultiplier: 1.5          // Take 50% more damage
      }
    };

    // Current selected difficulty
    this.selectedDifficulty = 'medium'; // default

    // Level progression
    this.currentLevel = 1;
    this.MAX_LEVEL = 10;
    this.CLOVERS_PER_LEVEL = 3; // Every 3 clovers = level up

    // Base enemy scaling per level (modified by difficulty preset)
    this.BASE_DIFFICULTY_SETTINGS = {
      1: { enemySpeed: 0.04, maxEnemies: 3, spawnRate: 0 },
      2: { enemySpeed: 0.05, maxEnemies: 4, spawnRate: 15000 },
      3: { enemySpeed: 0.06, maxEnemies: 5, spawnRate: 12000 },
      4: { enemySpeed: 0.07, maxEnemies: 6, spawnRate: 10000 },
      5: { enemySpeed: 0.08, maxEnemies: 7, spawnRate: 9000 },  // Smoothed: was 8 enemies, 8000ms
      6: { enemySpeed: 0.09, maxEnemies: 9, spawnRate: 7000 },
      7: { enemySpeed: 0.10, maxEnemies: 10, spawnRate: 6000 },
      8: { enemySpeed: 0.11, maxEnemies: 11, spawnRate: 5000 }, // Reduced: was 12 enemies
      9: { enemySpeed: 0.12, maxEnemies: 13, spawnRate: 4500 }, // Reduced: was 14 enemies
      10: { enemySpeed: 0.13, maxEnemies: 15, spawnRate: 4500 } // Reduced: was 16 enemies, 4000ms
    };

    // ============================================
    // COMBO SYSTEM
    // ============================================
    this.comboCount = 0;
    this.comboMultiplier = 1;
    this.lastCollectTime = 0;
    this.COMBO_WINDOW = 3000; // 3 seconds to maintain combo
    this.MAX_COMBO_MULTIPLIER = 5;

    // ============================================
    // PLAYER HEALTH
    // ============================================
    this.BASE_MAX_HEALTH = 100;
    this.MAX_HEALTH = 100; // Adjusted on game start
    this.playerHealth = 100; // Adjusted on game start
    this.extraLives = 0;

    // ============================================
    // POWER-UP STATES
    // ============================================
    this.speedBoostActive = false;
    this.speedBoostEndTime = 0;
    this.invincibilityActive = false;
    this.invincibilityEndTime = 0;
    this.SPEED_BOOST_MULTIPLIER = 1.5;
    this.SPEED_BOOST_DURATION = 8000; // 8 seconds
    this.INVINCIBILITY_DURATION = 10000; // 10 seconds

    // ============================================
    // ENEMY SPAWN TIMING
    // ============================================
    this.lastEnemySpawnTime = 0;

    // Load persisted high score
    this.loadHighScore();
  }

  // ============================================
  // SCORE METHODS
  // ============================================

  addScore(points) {
    this.score += points;
  }

  getScore() {
    return this.score;
  }

  getHighScore() {
    return this.highScore;
  }

  setHighScore(value) {
    this.highScore = value;
  }

  getIsNewHighScore() {
    return this.isNewHighScore;
  }

  addCloverCollected() {
    this.cloversCollected++;
  }

  getCloversCollected() {
    return this.cloversCollected;
  }

  getTotalClovers() {
    return this.TOTAL_CLOVERS;
  }

  // ============================================
  // HIGH SCORE PERSISTENCE
  // ============================================

  loadHighScore() {
    try {
      const saved = localStorage.getItem('bugdom_highscore');
      if (saved !== null) {
        this.highScore = parseInt(saved, 10);
        if (isNaN(this.highScore)) this.highScore = 0;
      }
    } catch (e) {
      console.warn('Could not load high score:', e);
      this.highScore = 0;
    }
  }

  saveHighScore() {
    try {
      localStorage.setItem('bugdom_highscore', this.highScore.toString());
    } catch (e) {
      console.warn('Could not save high score:', e);
    }
  }

  checkAndUpdateHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.isNewHighScore = true;
      this.saveHighScore();
      return true;
    }
    return false;
  }

  // ============================================
  // GAME STATE METHODS
  // ============================================

  getGameState() {
    return this.gameState;
  }

  setGameState(state) {
    this.gameState = state;
  }

  isPlaying() {
    return this.gameState === this.GameState.PLAYING;
  }

  isPaused() {
    return this.gameState === this.GameState.PAUSED;
  }

  isGameOver() {
    return this.gameState === this.GameState.GAME_OVER;
  }

  setGameWon(won) {
    this.gameWon = won;
  }

  getGameWon() {
    return this.gameWon;
  }

  setGameStartTime(time) {
    this.gameStartTime = time;
  }

  getGameStartTime() {
    return this.gameStartTime;
  }

  addPausedTime(time) {
    this.pausedTime += time;
  }

  getPausedTime() {
    return this.pausedTime;
  }

  // ============================================
  // LEVEL PROGRESSION METHODS
  // ============================================

  getCurrentLevel() {
    return this.currentLevel;
  }

  setCurrentLevel(level) {
    this.currentLevel = Math.min(level, this.MAX_LEVEL);
  }

  incrementLevel() {
    if (this.currentLevel < this.MAX_LEVEL) {
      this.currentLevel++;
      return true;
    }
    return false;
  }

  getMaxLevel() {
    return this.MAX_LEVEL;
  }

  getCloversPerLevel() {
    return this.CLOVERS_PER_LEVEL;
  }

  // ============================================
  // DIFFICULTY METHODS
  // ============================================

  getSelectedDifficulty() {
    return this.selectedDifficulty;
  }

  setSelectedDifficulty(difficulty) {
    if (this.DIFFICULTY_PRESETS[difficulty]) {
      this.selectedDifficulty = difficulty;
      return true;
    }
    return false;
  }

  getDifficultyPreset(difficulty) {
    return this.DIFFICULTY_PRESETS[difficulty || this.selectedDifficulty];
  }

  getDifficultySettings(level) {
    const baseSettings = this.BASE_DIFFICULTY_SETTINGS[level];
    const preset = this.DIFFICULTY_PRESETS[this.selectedDifficulty];

    return {
      enemySpeed: baseSettings.enemySpeed * preset.enemySpeedMultiplier,
      maxEnemies: Math.ceil(baseSettings.maxEnemies * preset.enemyCountMultiplier),
      spawnRate: baseSettings.spawnRate > 0 ? baseSettings.spawnRate * preset.spawnRateMultiplier : 0
    };
  }

  // ============================================
  // COMBO METHODS
  // ============================================

  getComboCount() {
    return this.comboCount;
  }

  setComboCount(count) {
    this.comboCount = count;
  }

  incrementComboCount() {
    this.comboCount++;
  }

  resetCombo() {
    this.comboCount = 0;
    this.comboMultiplier = 1;
  }

  getComboMultiplier() {
    return this.comboMultiplier;
  }

  setComboMultiplier(multiplier) {
    this.comboMultiplier = Math.min(multiplier, this.MAX_COMBO_MULTIPLIER);
  }

  updateComboMultiplier() {
    // Calculate combo multiplier based on combo count
    this.comboMultiplier = Math.min(
      1 + Math.floor(this.comboCount / 3),
      this.MAX_COMBO_MULTIPLIER
    );
  }

  getLastCollectTime() {
    return this.lastCollectTime;
  }

  setLastCollectTime(time) {
    this.lastCollectTime = time;
  }

  getComboWindow() {
    return this.COMBO_WINDOW;
  }

  getMaxComboMultiplier() {
    return this.MAX_COMBO_MULTIPLIER;
  }

  // Check if combo should expire based on current time
  checkComboExpiration(currentTime) {
    if (this.lastCollectTime > 0 &&
        currentTime - this.lastCollectTime > this.COMBO_WINDOW) {
      this.resetCombo();
      return true;
    }
    return false;
  }

  // ============================================
  // HEALTH METHODS
  // ============================================

  getPlayerHealth() {
    return this.playerHealth;
  }

  setPlayerHealth(health) {
    this.playerHealth = Math.max(0, Math.min(health, this.MAX_HEALTH));
  }

  damagePlayer(amount) {
    this.playerHealth = Math.max(0, this.playerHealth - amount);
    return this.playerHealth;
  }

  healPlayer(amount) {
    this.playerHealth = Math.min(this.MAX_HEALTH, this.playerHealth + amount);
    return this.playerHealth;
  }

  getMaxHealth() {
    return this.MAX_HEALTH;
  }

  setMaxHealth(health) {
    this.MAX_HEALTH = health;
  }

  getBaseMaxHealth() {
    return this.BASE_MAX_HEALTH;
  }

  isPlayerAlive() {
    return this.playerHealth > 0;
  }

  getExtraLives() {
    return this.extraLives;
  }

  setExtraLives(lives) {
    this.extraLives = Math.max(0, lives);
  }

  addExtraLife() {
    this.extraLives++;
  }

  useExtraLife() {
    if (this.extraLives > 0) {
      this.extraLives--;
      return true;
    }
    return false;
  }

  // ============================================
  // POWER-UP METHODS
  // ============================================

  // Speed Boost
  isSpeedBoostActive() {
    return this.speedBoostActive;
  }

  activateSpeedBoost(currentTime) {
    this.speedBoostActive = true;
    this.speedBoostEndTime = currentTime + this.SPEED_BOOST_DURATION;
  }

  deactivateSpeedBoost() {
    this.speedBoostActive = false;
    this.speedBoostEndTime = 0;
  }

  getSpeedBoostEndTime() {
    return this.speedBoostEndTime;
  }

  getSpeedBoostDuration() {
    return this.SPEED_BOOST_DURATION;
  }

  getSpeedBoostMultiplier() {
    return this.SPEED_BOOST_MULTIPLIER;
  }

  checkSpeedBoostExpiration(currentTime) {
    if (this.speedBoostActive && currentTime >= this.speedBoostEndTime) {
      this.deactivateSpeedBoost();
      return true;
    }
    return false;
  }

  // Invincibility
  isInvincibilityActive() {
    return this.invincibilityActive;
  }

  activateInvincibility(currentTime) {
    this.invincibilityActive = true;
    this.invincibilityEndTime = currentTime + this.INVINCIBILITY_DURATION;
  }

  deactivateInvincibility() {
    this.invincibilityActive = false;
    this.invincibilityEndTime = 0;
  }

  getInvincibilityEndTime() {
    return this.invincibilityEndTime;
  }

  getInvincibilityDuration() {
    return this.INVINCIBILITY_DURATION;
  }

  checkInvincibilityExpiration(currentTime) {
    if (this.invincibilityActive && currentTime >= this.invincibilityEndTime) {
      this.deactivateInvincibility();
      return true;
    }
    return false;
  }

  // Check all power-up expirations
  checkPowerUpExpirations(currentTime) {
    const speedBoostExpired = this.checkSpeedBoostExpiration(currentTime);
    const invincibilityExpired = this.checkInvincibilityExpiration(currentTime);
    return speedBoostExpired || invincibilityExpired;
  }

  // ============================================
  // ENEMY SPAWN TIMING METHODS
  // ============================================

  getLastEnemySpawnTime() {
    return this.lastEnemySpawnTime;
  }

  setLastEnemySpawnTime(time) {
    this.lastEnemySpawnTime = time;
  }

  // ============================================
  // RESET METHOD
  // ============================================

  reset() {
    // Reset score (but keep high score)
    this.score = 0;
    this.isNewHighScore = false;
    this.cloversCollected = 0;

    // Reset game state
    this.gameState = this.GameState.PLAYING;
    this.gameWon = false;
    this.gameStartTime = 0;
    this.pausedTime = 0;

    // Reset progression
    this.currentLevel = 1;

    // Reset combo
    this.comboCount = 0;
    this.comboMultiplier = 1;
    this.lastCollectTime = 0;

    // Reset health (will be adjusted by difficulty on game start)
    this.MAX_HEALTH = this.BASE_MAX_HEALTH;
    this.playerHealth = this.BASE_MAX_HEALTH;
    this.extraLives = 0;

    // Reset power-ups
    this.speedBoostActive = false;
    this.speedBoostEndTime = 0;
    this.invincibilityActive = false;
    this.invincibilityEndTime = 0;

    // Reset spawn timing
    this.lastEnemySpawnTime = 0;
  }

  // Reset for new game (keeps difficulty selection)
  resetForNewGame() {
    this.reset();
    // Difficulty setting is preserved
  }

  // Full reset including difficulty
  resetAll() {
    this.reset();
    this.selectedDifficulty = 'medium';
  }
}

// Create and export a singleton instance
export const gameStateManager = new GameStateManager();

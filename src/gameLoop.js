// ============================================
// GAME LOOP AND LIFECYCLE MANAGEMENT
// ============================================
// Handles the main game loop, game lifecycle callbacks (victory, game over, collisions)
// and game state transitions

/**
 * GameLoop class - Orchestrates game updates and lifecycle events
 */
export class GameLoop {
    constructor(dependencies) {
        this.scene = dependencies.scene;
        this.camera = dependencies.camera;
        this.renderer = dependencies.renderer;
        this.gameState = dependencies.gameState;
        this.player = dependencies.player;
        this.cameraController = dependencies.cameraController;
        this.inputManager = dependencies.inputManager;
        this.levelManager = dependencies.levelManager;
        this.collectiblesManager = dependencies.collectiblesManager;
        this.particleEffects = dependencies.particleEffects;
        this.rippleManager = dependencies.rippleManager;
        this.collisionManager = dependencies.collisionManager;
        this.uiManager = dependencies.uiManager;
        this.audioManager = dependencies.audioManager;
        this.dayNightCycle = dependencies.dayNightCycle;

        this.clovers = dependencies.clovers;

        this.lastTime = 0;
        this.animationTime = 0;
        this.animationFrameId = null;
    }

    // ============================================
    // GAME LIFECYCLE CALLBACKS
    // ============================================

    /**
     * Handle clover collection
     */
    onCloverCollect(clover, isFourLeaf) {
        // Update combo
        this.gameState.incrementComboCount();
        this.gameState.setLastCollectTime(performance.now());
        this.gameState.updateComboMultiplier();

        // Calculate points
        const basePoints = isFourLeaf ? 15 : 5;
        const points = basePoints * this.gameState.getComboMultiplier();

        // Add score
        this.gameState.addScore(points);

        // Increment collected count
        this.gameState.addCloverCollected();

        // Play collection sound
        this.audioManager.playCollect();

        // Show combo popup if applicable
        if (this.gameState.getComboMultiplier() > 1) {
            this.uiManager.showComboPopup(this.gameState.getComboMultiplier(), points);
        }

        // Animate clover collection (remove from scene)
        clover.visible = false;

        // Check for level up (every 3 clovers)
        if (this.gameState.getCloversCollected() % this.gameState.CLOVERS_PER_LEVEL === 0) {
            const newLevel = Math.floor(this.gameState.getCloversCollected() / this.gameState.CLOVERS_PER_LEVEL) + 1;
            if (newLevel > this.gameState.getCurrentLevel() && newLevel <= this.gameState.getMaxLevel()) {
                this.gameState.setCurrentLevel(newLevel);
                this.uiManager.showLevelUpPopup(newLevel);
                this.audioManager.playLevelUp();

                // Spawn new enemy for level
                this.levelManager.spawnEnemy();
            }
        }

        // Check for victory
        if (this.gameState.getCloversCollected() >= this.gameState.getTotalClovers() && !this.gameState.getGameWon()) {
            this.victory();
        }

        // Update UI
        this.uiManager.updateScoreDisplay();
        this.uiManager.updateCloverCountDisplay();
        this.uiManager.updateComboDisplay();
    }

    /**
     * Handle collectible collection (mushrooms, coins, buddy bugs)
     */
    onCollectibleCollect(collectible) {
        const type = collectible.userData.type;
        const variant = collectible.userData.variant;

        if (type === 'mushroom') {
            this.handleMushroomPowerUp(variant, performance.now());
        } else if (type === 'buddy-bug') {
            this.gameState.addExtraLife();
            this.uiManager.updateLivesDisplay();
            this.audioManager.playPowerUp();
            this.uiManager.showPowerUpMessage('Extra Life! +1 ❤️');
        }
    }

    /**
     * Handle mushroom power-up collection
     */
    handleMushroomPowerUp(variant, currentTime) {
        if (variant === 'health') {
            this.gameState.setPlayerHealth(this.gameState.getMaxHealth());
            this.uiManager.updateHealthDisplay();
            this.audioManager.playPowerUp();
            this.uiManager.showPowerUpMessage('Health Restored! ❤️');
        } else if (variant === 'speed') {
            this.gameState.activateSpeedBoost(currentTime);
            this.audioManager.playPowerUp();
            this.uiManager.showPowerUpMessage('Speed Boost! ⚡');
        } else if (variant === 'invincibility') {
            this.gameState.activateInvincibility(currentTime);
            this.audioManager.playPowerUp();
            this.uiManager.showPowerUpMessage('Invincibility! ✨');
        }
    }

    /**
     * Handle enemy collision
     */
    onEnemyHit(currentTime) {
        // Check invincibility
        if (this.gameState.isInvincibilityActive()) {
            return;
        }

        // Take damage
        const difficultyPreset = this.gameState.getDifficultyPreset(this.gameState.getSelectedDifficulty());
        const damage = 20 * difficultyPreset.damageMultiplier;
        this.gameState.damagePlayer(damage);

        // Update UI
        this.uiManager.updateHealthDisplay();

        // Flash player
        this.player.flashPlayer(currentTime);

        // Play hit sound
        this.audioManager.playHit();

        // Check game over
        if (this.gameState.getPlayerHealth() <= 0 && this.gameState.getExtraLives() > 0) {
            // Lost a life, respawn
            this.gameState.useExtraLife();
            this.gameState.setPlayerHealth(this.gameState.getMaxHealth());
            this.uiManager.updateLivesDisplay();
            this.uiManager.updateHealthDisplay();

            // Reset player position
            this.player.setPosition(0, 0, 0);
        } else if (this.gameState.getPlayerHealth() <= 0 && this.gameState.getExtraLives() <= 0) {
            // Game over
            this.gameOver();
        }
    }

    /**
     * Handle victory
     */
    victory() {
        this.gameState.setGameWon(true);

        // Calculate time
        const totalTime = performance.now() - this.gameState.getGameStartTime() - this.gameState.getPausedTime();
        const seconds = Math.floor(totalTime / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const timeString = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;

        // Check and update high score
        this.gameState.checkAndUpdateHighScore();
        const isNewHighScore = this.gameState.getIsNewHighScore();

        // Show victory screen with stats
        this.uiManager.showVictoryScreen(timeString, {
            score: this.gameState.getScore(),
            highScore: this.gameState.getHighScore(),
            isNewHighScore: isNewHighScore,
            level: this.gameState.getCurrentLevel()
        });

        // Play victory sound
        this.audioManager.playVictory();

        // Create confetti
        this.levelManager.createConfetti(this.player.getPosition());
    }

    /**
     * Handle game over
     */
    gameOver() {
        this.gameState.setGameState(this.gameState.GameState.GAME_OVER);
        this.audioManager.playGameOver();
        this.uiManager.showGameOverScreen(`0:00`, {
            score: this.gameState.getScore(),
            highScore: this.gameState.getHighScore(),
            level: this.gameState.getCurrentLevel()
        });
    }

    // ============================================
    // MAIN ANIMATION LOOP
    // ============================================

    /**
     * Start the animation loop
     */
    start() {
        this.lastTime = performance.now();
        this.animate(this.lastTime);
    }

    /**
     * Stop the animation loop
     */
    stop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * Main animation loop
     */
    animate(currentTime) {
        this.animationFrameId = requestAnimationFrame((time) => this.animate(time));

        try {
            const deltaTimeMs = currentTime - this.lastTime;
            this.lastTime = currentTime;
            const deltaTime = deltaTimeMs / 1000; // Convert to seconds

            // If game is paused, only render
            if (this.gameState.getGameState() === this.gameState.GameState.PAUSED) {
                this.renderer.render(this.scene, this.camera);
                return;
            }

            this.animationTime += 16; // ~60fps for clover animation

            // Update player
            const movementInput = this.inputManager.getMovementInput();
            const isSpeedBoostActive = this.gameState.isSpeedBoostActive();
            this.player.updateMovement(movementInput, isSpeedBoostActive);
            this.player.animateLegs(deltaTime);
            this.player.updateFlash(currentTime);

            // Update camera
            this.cameraController.update(this.player.getPosition(), this.player.getRotation());

            // Update level elements
            this.levelManager.animateClovers(this.clovers, this.animationTime);

            // Collision detection (if playing and not won)
            if (!this.gameState.getGameWon() && this.gameState.getGameState() !== this.gameState.GameState.GAME_OVER) {
                // Check clover collisions
                this.collisionManager.checkCloverCollisions(
                    this.player.getPosition(),
                    this.clovers,
                    (clover, isFourLeaf) => this.onCloverCollect(clover, isFourLeaf)
                );

                // Check collectible collisions
                this.collisionManager.checkCollectibleCollisions(
                    this.player.getPosition(),
                    this.collectiblesManager.collectibles,
                    (collectible) => {
                        this.collectiblesManager.collectCollectible(collectible);
                        this.onCollectibleCollect(collectible);
                    }
                );

                // Check enemy collisions
                this.collisionManager.checkEnemyCollisions(
                    this.player.getPosition(),
                    this.levelManager.getEnemies(),
                    () => this.onEnemyHit(currentTime)
                );

                // Check bee collisions
                this.collisionManager.checkBeeCollisions(
                    this.player.getPosition(),
                    this.levelManager.getBees(),
                    () => this.onEnemyHit(currentTime)
                );
            }

            // Update managers
            this.collectiblesManager.update(deltaTime);
            this.particleEffects.update(deltaTime);
            this.rippleManager.update(deltaTime);

            if (this.dayNightCycle) {
                this.dayNightCycle.update(deltaTime);
            }

            // Update power-ups
            this.gameState.checkPowerUpExpirations(currentTime);

            // Update combo timer
            this.gameState.checkComboExpiration(currentTime);
            this.uiManager.updateComboDisplay();

            // Update enemies
            const diffSettings = this.gameState.getDifficultySettings(this.gameState.getCurrentLevel());
            this.levelManager.updateEnemies(this.player.getPosition(), deltaTime, currentTime, diffSettings);
            this.levelManager.updateBees(this.player.getPosition(), deltaTime, currentTime);
            this.levelManager.checkBeeSpawn(this.gameState.getCurrentLevel(), currentTime);

            // Update confetti if exists
            if (this.levelManager.confetti) {
                this.levelManager.updateConfetti();
            }

            // Update UI
            this.uiManager.drawMinimap(
                this.player.getPosition(),
                this.player.getRotation(),
                this.clovers,
                this.levelManager.getEnemies(),
                this.levelManager.getBees()
            );

            this.renderer.render(this.scene, this.camera);
        } catch (error) {
            // Log error but don't stop the animation loop
            console.error('Error in animation loop:', error);
        }
    }
}

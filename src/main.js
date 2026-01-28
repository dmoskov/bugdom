// ============================================
// IMPORTS
// ============================================
import * as THREE from 'three';
import { audioManager } from './audio.js';
import { DayNightCycle } from './daynight.js';
import { CollectiblesManager } from './collectibles.js';
import { EnemyManager } from './enemies.js';
import { ParticleEffectsManager, RippleManager } from './particles.js';
import { GameStateManager } from './gameState.js';
import { PlayerCharacter } from './player.js';
import { CameraController, createCamera } from './camera.js';
import { InputManager } from './input.js';
import { CollisionManager } from './collision.js';
import { UIManager } from './ui.js';
import { LevelManager } from './levels.js';

// ============================================
// SCENE SETUP
// ============================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue
scene.fog = new THREE.Fog(0x87ceeb, 50, 200);

// ============================================
// RENDERER SETUP
// ============================================
const renderer = new THREE.WebGLRenderer({ antialias: true });
const gameContainer = document.getElementById('game-container');
const canvasWidth = gameContainer ? gameContainer.clientWidth : window.innerWidth;
const canvasHeight = gameContainer ? gameContainer.clientHeight : window.innerHeight;
renderer.setSize(canvasWidth, canvasHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
if (gameContainer) {
    gameContainer.appendChild(renderer.domElement);
} else {
    document.body.appendChild(renderer.domElement);
}

// ============================================
// LIGHTING
// ============================================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(50, 50, 50);
directionalLight.castShadow = true;
directionalLight.shadow.camera.left = -50;
directionalLight.shadow.camera.right = 50;
directionalLight.shadow.camera.top = 50;
directionalLight.shadow.camera.bottom = -50;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// ============================================
// INITIALIZE MANAGERS
// ============================================
const gameState = new GameStateManager();
const collectiblesManager = new CollectiblesManager(scene);
const enemyManager = new EnemyManager(scene);
const particleEffects = new ParticleEffectsManager(scene);
const rippleManager = new RippleManager(scene);
const inputManager = new InputManager();
const player = new PlayerCharacter(scene);
const camera = createCamera();
const cameraController = new CameraController(camera);
const levelManager = new LevelManager(scene);
const collisionManager = new CollisionManager(audioManager, particleEffects, rippleManager);
const uiManager = new UIManager(audioManager, gameState);

// ============================================
// WORLD SETUP
// ============================================
levelManager.setupGround();
levelManager.setupRocks();
levelManager.setupFlowers();
levelManager.setupBoundaries();
levelManager.setupFencePosts();
const clovers = levelManager.spawnClovers();

// Spawn collectibles
collectiblesManager.spawnMushroom(new THREE.Vector3(30, 1, 30), 'health');
collectiblesManager.spawnMushroom(new THREE.Vector3(-30, 1, 30), 'speed');
collectiblesManager.spawnMushroom(new THREE.Vector3(-30, 1, -30), 'invincibility');
collectiblesManager.spawnBuddyBug(new THREE.Vector3(30, 1, -30));

// Initialize renderer in container
renderer.setSize(canvasWidth, canvasHeight);
if (gameContainer) {
    gameContainer.appendChild(renderer.domElement);
}

// Day/Night Cycle (initialized when game starts)
let dayNightCycle = null;

// Game started flag
let gameStarted = false;

// ============================================
// GAME LIFECYCLE CALLBACKS
// ============================================

/**
 * Handle clover collection
 */
function onCloverCollect(clover, isFourLeaf) {
    // Update combo
    gameState.incrementComboCount();
    gameState.setLastCollectTime(performance.now());
    gameState.updateComboMultiplier();

    // Calculate points
    const basePoints = isFourLeaf ? 15 : 5;
    const points = basePoints * gameState.getComboMultiplier();

    // Add score
    gameState.addScore(points);

    // Increment collected count
    gameState.addCloverCollected();

    // Play collection sound
    audioManager.playCollect();

    // Show combo popup if applicable
    if (gameState.getComboMultiplier() > 1) {
        uiManager.showComboPopup(gameState.getComboMultiplier(), points);
    }

    // Animate clover collection (remove from scene)
    clover.visible = false;

    // Check for level up (every 3 clovers)
    if (gameState.getCloversCollected() % gameState.CLOVERS_PER_LEVEL === 0) {
        const newLevel = Math.floor(gameState.getCloversCollected() / gameState.CLOVERS_PER_LEVEL) + 1;
        if (newLevel > gameState.getCurrentLevel() && newLevel <= gameState.getMaxLevel()) {
            gameState.setCurrentLevel(newLevel);
            uiManager.showLevelUpPopup(newLevel);
            audioManager.playLevelUp();

            // Spawn new enemy for level
            levelManager.spawnEnemy();
        }
    }

    // Check for victory
    if (gameState.getCloversCollected() >= gameState.getTotalClovers() && !gameState.getGameWon()) {
        victory();
    }

    // Update UI
    uiManager.updateScoreDisplay();
    uiManager.updateCloverCountDisplay();
    uiManager.updateComboDisplay();
}

/**
 * Handle collectible collection (mushrooms, coins, buddy bugs)
 */
function onCollectibleCollect(collectible) {
    const type = collectible.userData.type;
    const variant = collectible.userData.variant;

    if (type === 'mushroom') {
        handleMushroomPowerUp(variant, performance.now());
    } else if (type === 'buddy-bug') {
        gameState.addExtraLife();
        uiManager.updateLivesDisplay();
        audioManager.playPowerUp();
        uiManager.showPowerUpMessage('Extra Life! +1 ❤️');
    }
}

/**
 * Handle mushroom power-up collection
 */
function handleMushroomPowerUp(variant, currentTime) {
    if (variant === 'health') {
        gameState.setPlayerHealth(gameState.getMaxHealth());
        uiManager.updateHealthDisplay();
        audioManager.playPowerUp();
        uiManager.showPowerUpMessage('Health Restored! ❤️');
    } else if (variant === 'speed') {
        gameState.activateSpeedBoost(currentTime);
        audioManager.playPowerUp();
        uiManager.showPowerUpMessage('Speed Boost! ⚡');
    } else if (variant === 'invincibility') {
        gameState.activateInvincibility(currentTime);
        audioManager.playPowerUp();
        uiManager.showPowerUpMessage('Invincibility! ✨');
    }
}

/**
 * Handle enemy collision
 */
function onEnemyHit(currentTime) {
    // Check invincibility
    if (gameState.getPowerUpStates().invincibility) {
        return;
    }

    // Take damage
    const damageSettings = gameState.getDifficultySettings(gameState.getCurrentLevel());
    const damage = 20 * damageSettings.damageMultiplier;
    gameState.takeDamage(damage);

    // Update UI
    uiManager.updateHealthDisplay(gameState.health);

    // Flash player
    player.flashPlayer(currentTime);

    // Play hit sound
    audioManager.playHit();

    // Check game over
    if (gameState.health <= 0 && gameState.lives > 0) {
        // Lost a life, respawn
        gameState.loseLife();
        gameState.setHealth(100);
        uiManager.updateLivesDisplay(gameState.lives);
        uiManager.updateHealthDisplay(gameState.health);

        // Reset player position
        player.setPosition(new THREE.Vector3(0, 0, 0));
    } else if (gameState.health <= 0 && gameState.lives <= 0) {
        // Game over
        gameOver();
    }
}

/**
 * Apply level environment changes
 */
function applyLevelEnvironment(levelSettings) {
    // Update scene background color
    scene.background.setHex(levelSettings.skyColor);
    scene.fog.color.setHex(levelSettings.skyColor);

    // Update ambient light
    ambientLight.color.setHex(levelSettings.ambientColor);
    ambientLight.intensity = levelSettings.ambientIntensity;

    // Update directional light
    directionalLight.color.setHex(levelSettings.lightColor);
    directionalLight.intensity = levelSettings.lightIntensity;
}

/**
 * Handle victory
 */
function victory() {
    gameState.setGameWon(true);

    // Calculate time
    const totalTime = performance.now() - gameState.gameStartTime - gameState.pausedTime;
    const seconds = Math.floor(totalTime / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const timeString = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;

    // Check and update high score
    const highScoreResult = gameState.checkAndUpdateHighScore();
    if (highScoreResult.isNewHighScore) {
        uiManager.showVictoryScreen(timeString, true);
    } else {
        uiManager.showVictoryScreen(timeString, false);
    }

    // Play victory sound
    audioManager.playVictory();

    // Create confetti
    levelManager.createConfetti();
}

/**
 * Handle game over
 */
function gameOver() {
    gameState.setState(gameState.GameState.GAME_OVER);
    audioManager.playGameOver();
    uiManager.showGameOverScreen(gameState.score);
}

// ============================================
// MAIN ANIMATION LOOP
// ============================================
let lastTime = 0;
let animationTime = 0;

function animate(currentTime) {
    requestAnimationFrame(animate);

    const deltaTimeMs = currentTime - lastTime;
    lastTime = currentTime;
    const deltaTime = deltaTimeMs / 1000; // Convert to seconds

    // If game is paused, only render
    if (gameState.getState() === gameState.GameState.PAUSED) {
        renderer.render(scene, camera);
        return;
    }

    animationTime += 16; // ~60fps for clover animation

    // Update player
    const movementInput = inputManager.getMovementInput();
    const powerUpStates = gameState.getPowerUpStates();
    player.updateMovement(movementInput, powerUpStates.speedBoost);
    player.animateLegs(deltaTime);
    player.updateFlash(currentTime);

    // Update camera
    cameraController.update(player.getPosition(), player.getRotation());

    // Update level elements
    levelManager.animateClovers(clovers, animationTime);

    // Collision detection (if playing and not won)
    if (!gameState.isGameWon() && gameState.getState() !== gameState.GameState.GAME_OVER) {
        // Check clover collisions
        collisionManager.checkCloverCollisions(
            player.getPosition(),
            clovers,
            (clover, isFourLeaf) => onCloverCollect(clover, isFourLeaf)
        );

        // Check collectible collisions
        collisionManager.checkCollectibleCollisions(
            player.getPosition(),
            collectiblesManager.collectibles,
            (collectible) => {
                collectiblesManager.collectCollectible(collectible);
                onCollectibleCollect(collectible);
            }
        );

        // Check enemy collisions
        collisionManager.checkEnemyCollisions(
            player.getPosition(),
            levelManager.getEnemies(),
            () => onEnemyHit(currentTime)
        );

        // Check bee collisions
        collisionManager.checkBeeCollisions(
            player.getPosition(),
            levelManager.getBees(),
            () => onEnemyHit(currentTime)
        );
    }

    // Update managers
    collectiblesManager.update(deltaTime);
    particleEffects.update(deltaTime);
    rippleManager.update(deltaTime);
    enemyManager.update(player.getMesh(), deltaTime);
    if (dayNightCycle) {
        dayNightCycle.update(deltaTime);
    }

    // Update power-ups
    gameState.updatePowerUps(currentTime);

    // Update combo timer
    gameState.updateComboTimer(currentTime);
    uiManager.updateComboDisplay(gameState.comboCount, gameState.comboMultiplier);

    // Update enemies
    const diffSettings = gameState.getDifficultySettings(gameState.getCurrentLevel());
    levelManager.updateEnemies(player.getPosition(), deltaTime, currentTime, diffSettings);
    levelManager.updateBees(player.getPosition(), deltaTime, currentTime);
    levelManager.checkBeeSpawn(gameState.getCurrentLevel(), currentTime);

    // Update confetti if exists
    if (levelManager.confetti) {
        levelManager.updateConfetti();
    }

    // Update UI
    uiManager.drawMinimap(
        player.getPosition(),
        player.getRotation(),
        clovers,
        levelManager.getEnemies(),
        levelManager.getBees()
    );

    renderer.render(scene, camera);
}

// ============================================
// EVENT HANDLERS
// ============================================

/**
 * Initialize audio (handles browser autoplay restriction)
 */
function initAudio() {
    if (audioManager.init()) {
        audioManager.resume();
        audioManager.startMusic();
    }
}

/**
 * Start game
 */
function startGame() {
    gameStarted = true;
    gameState.setGameStartTime(performance.now());

    // Apply difficulty settings
    const difficulty = gameState.getSelectedDifficulty();
    const diffSettings = gameState.DIFFICULTY_PRESETS[difficulty];
    player.applyDifficultyModifier(diffSettings.playerSpeedMultiplier);
    gameState.setMaxHealth(100 * diffSettings.playerHealthMultiplier);
    gameState.setHealth(100 * diffSettings.playerHealthMultiplier);

    // Initialize audio
    initAudio();

    // Initialize day/night cycle
    dayNightCycle = new DayNightCycle(scene, ambientLight, directionalLight);

    // Spawn initial enemies
    const enemyCount = Math.floor(3 * diffSettings.enemyCountMultiplier);
    levelManager.initEnemies(enemyCount);

    // Update UI
    uiManager.updateCloverCountDisplay(gameState.cloversCollected, gameState.TOTAL_CLOVERS);
    uiManager.updateLevelDisplay(gameState.getCurrentLevel(), difficulty);
    uiManager.updateLivesDisplay(gameState.lives);
    uiManager.updateHealthDisplay(gameState.health);

    // Show welcome message
    setTimeout(() => uiManager.showWelcomeMessage(), 1000);
}

/**
 * Pause game
 */
function pauseGame() {
    gameState.pauseGame(performance.now());
    audioManager.playPause();
    audioManager.pause();
    uiManager.showPauseOverlay();
}

/**
 * Resume game
 */
function resumeGame() {
    gameState.resumeGame(performance.now());
    audioManager.resume();
    audioManager.playResume();
    uiManager.hidePauseOverlay();
}

/**
 * Restart game
 */
function restartGame() {
    location.reload();
}

/**
 * Toggle mute
 */
function toggleMute() {
    audioManager.toggleMute();
}

/**
 * Set music volume
 */
function setMusicVolume(value) {
    audioManager.setMusicVolume(value);
}

/**
 * Set SFX volume
 */
function setSfxVolume(value) {
    audioManager.setSfxVolume(value);
}

/**
 * Handle difficulty selection
 */
function selectDifficulty(difficulty) {
    gameState.setSelectedDifficulty(difficulty);
}

// ============================================
// SETUP UI EVENT HANDLERS
// ============================================
uiManager.setupUIEventHandlers({
    onStart: startGame,
    onPause: pauseGame,
    onResume: resumeGame,
    onRestart: restartGame,
    onToggleMute: toggleMute,
    onMusicVolumeChange: setMusicVolume,
    onSfxVolumeChange: setSfxVolume,
    onDifficultySelect: selectDifficulty
});

// Handle window resize
window.addEventListener('resize', () => {
    cameraController.handleResize();
    const container = document.getElementById('game-container');
    const width = container ? container.clientWidth : window.innerWidth;
    const height = container ? container.clientHeight : window.innerHeight;
    renderer.setSize(width, height);
});

// ============================================
// INITIALIZE GAME
// ============================================
// Load high score
gameState.loadHighScore();
uiManager.updateHighScoreDisplay(gameState.highScore);

// Start animation loop
animate(0);

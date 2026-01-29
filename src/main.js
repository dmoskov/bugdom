// ============================================
// MAIN ENTRY POINT - BUGDOM GAME
// ============================================
// Core orchestration: imports, initialization, and game loop coordination

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
import { GameLoop } from './gameLoop.js';
import { initializeScene, setupWindowResize } from './sceneSetup.js';

// ============================================
// INITIALIZE SCENE AND RENDERER
// ============================================
const gameContainer = document.getElementById('game-container');
const { scene, renderer, ambientLight, directionalLight } = initializeScene(gameContainer);

// ============================================
// INITIALIZE MANAGERS AND SYSTEMS
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
// SETUP WORLD
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

// Day/Night Cycle (initialized when game starts)
let dayNightCycle = null;

// ============================================
// INITIALIZE GAME LOOP
// ============================================
const gameLoop = new GameLoop({
    scene,
    camera,
    renderer,
    gameState,
    player,
    cameraController,
    inputManager,
    levelManager,
    collectiblesManager,
    particleEffects,
    rippleManager,
    collisionManager,
    uiManager,
    audioManager,
    dayNightCycle,
    clovers
});

// ============================================
// GAME CONTROL FUNCTIONS
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
    gameState.setGameStartTime(performance.now());

    // Apply difficulty settings
    const difficulty = gameState.getSelectedDifficulty();
    const diffSettings = gameState.getDifficultyPreset(difficulty);
    player.applyDifficultyModifiers(diffSettings);
    gameState.setMaxHealth(gameState.getBaseMaxHealth() * diffSettings.playerHealthMultiplier);
    gameState.setPlayerHealth(gameState.getMaxHealth());

    // Initialize audio
    initAudio();

    // Initialize day/night cycle
    dayNightCycle = new DayNightCycle(scene, ambientLight, directionalLight);
    gameLoop.dayNightCycle = dayNightCycle;

    // Spawn initial enemies
    const enemyCount = Math.floor(3 * diffSettings.enemyCountMultiplier);
    levelManager.initEnemies(enemyCount);

    // Update UI
    uiManager.updateCloverCountDisplay();
    uiManager.updateLevelDisplay();
    uiManager.updateLivesDisplay();
    uiManager.updateHealthDisplay();

    // Show welcome message
    setTimeout(() => uiManager.showWelcomeMessage(), 1000);
}

/**
 * Pause game
 */
let lastPauseTime = 0;

function pauseGame() {
    gameState.setGameState(gameState.GameState.PAUSED);
    lastPauseTime = performance.now();
    audioManager.playPause();
    audioManager.pause();
    uiManager.showPauseOverlay();
}

/**
 * Resume game
 */
function resumeGame() {
    gameState.setGameState(gameState.GameState.PLAYING);
    const pauseDuration = performance.now() - lastPauseTime;
    gameState.addPausedTime(pauseDuration);
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

// Setup window resize handler
setupWindowResize(renderer, cameraController);

// ============================================
// START GAME LOOP
// ============================================
gameLoop.start();

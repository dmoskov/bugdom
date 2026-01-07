import * as THREE from 'three';
import { audioManager } from './audio.js';
import { DayNightCycle } from './daynight.js';
import { getTouchControls } from './touch.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue
scene.fog = new THREE.Fog(0x87ceeb, 50, 200);

// Camera setup
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

// ============================================
// PLAYER BUG CHARACTER
// ============================================

// Create the player bug character
function createBugCharacter() {
    const bugGroup = new THREE.Group();

    // Body (main ellipsoid sphere)
    const bodyGeometry = new THREE.SphereGeometry(0.6, 16, 12);
    bodyGeometry.scale(1, 0.7, 1.2);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b4513, // Brown
        roughness: 0.6,
        metalness: 0.1
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    body.castShadow = true;
    bugGroup.add(body);

    // Head (smaller sphere)
    const headGeometry = new THREE.SphereGeometry(0.35, 12, 10);
    const headMaterial = new THREE.MeshStandardMaterial({
        color: 0x654321, // Darker brown
        roughness: 0.5,
        metalness: 0.1
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 0.6, 0.7);
    head.castShadow = true;
    bugGroup.add(head);

    // Eyes (two small white spheres with black pupils)
    const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 6);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const pupilGeometry = new THREE.SphereGeometry(0.05, 6, 4);
    const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });

    [-0.15, 0.15].forEach(xOffset => {
        const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        eye.position.set(xOffset, 0.7, 1.0);
        bugGroup.add(eye);

        const pupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        pupil.position.set(xOffset, 0.7, 1.08);
        bugGroup.add(pupil);
    });

    // Antennae
    const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6);
    const antennaMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
    const antennaTipGeometry = new THREE.SphereGeometry(0.05, 6, 4);

    [-0.12, 0.12].forEach((xOffset, i) => {
        const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        antenna.position.set(xOffset, 1.0, 0.8);
        antenna.rotation.x = Math.PI / 6;
        antenna.rotation.z = xOffset > 0 ? -0.3 : 0.3;
        bugGroup.add(antenna);

        const tip = new THREE.Mesh(antennaTipGeometry, antennaMaterial);
        tip.position.set(xOffset * 1.5, 1.15, 0.95);
        bugGroup.add(tip);
    });

    // Legs (6 legs - 3 on each side)
    const legGeometry = new THREE.CylinderGeometry(0.03, 0.02, 0.5, 6);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });

    const legPositions = [
        { x: -0.4, z: 0.3, rotZ: 0.8 },   // Front left
        { x: 0.4, z: 0.3, rotZ: -0.8 },   // Front right
        { x: -0.5, z: 0, rotZ: 1.0 },     // Middle left
        { x: 0.5, z: 0, rotZ: -1.0 },     // Middle right
        { x: -0.4, z: -0.3, rotZ: 0.8 },  // Back left
        { x: 0.4, z: -0.3, rotZ: -0.8 }   // Back right
    ];

    legPositions.forEach((pos, index) => {
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(pos.x, 0.3, pos.z);
        leg.rotation.z = pos.rotZ;
        leg.rotation.x = 0.2;
        leg.castShadow = true;
        leg.userData.legIndex = index;
        bugGroup.add(leg);
    });

    // Store reference to legs for animation
    bugGroup.userData.legs = bugGroup.children.filter(child => child.userData.legIndex !== undefined);

    return bugGroup;
}

// Create the player bug
const playerBug = createBugCharacter();
playerBug.position.set(0, 0, 0);
scene.add(playerBug);

// Player state
const playerState = {
    velocity: new THREE.Vector3(),
    rotation: 0,
    moveSpeed: 0.15,
    rotationSpeed: 0.08,
    isMoving: false,
    legAnimationTime: 0
};

// Third-person camera offset
const cameraOffset = new THREE.Vector3(0, 4, -8);
const cameraLookOffset = new THREE.Vector3(0, 1, 0);
camera.position.set(0, 4, -8);
camera.lookAt(0, 1, 0);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(50, 50, 50);
directionalLight.castShadow = true;
directionalLight.shadow.camera.left = -50;
directionalLight.shadow.camera.right = 50;
directionalLight.shadow.camera.top = 50;
directionalLight.shadow.camera.bottom = -50;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Day/Night Cycle System
let dayNightCycle = null;

// Ground plane with grass texture
const groundGeometry = new THREE.PlaneGeometry(100, 100, 32, 32);
const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a9d2e,
    roughness: 0.8,
    metalness: 0.2
});

// Add some vertex displacement for a more natural look
const positionAttribute = groundGeometry.getAttribute('position');
for (let i = 0; i < positionAttribute.count; i++) {
    const z = positionAttribute.getZ(i);
    positionAttribute.setZ(i, z + Math.random() * 0.3);
}
positionAttribute.needsUpdate = true;
groundGeometry.computeVertexNormals();

const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Add grass patches (darker green spots)
for (let i = 0; i < 20; i++) {
    const patchGeometry = new THREE.CircleGeometry(Math.random() * 2 + 1, 16);
    const patchMaterial = new THREE.MeshStandardMaterial({
        color: 0x3d8026,
        roughness: 0.9
    });
    const patch = new THREE.Mesh(patchGeometry, patchMaterial);
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(
        Math.random() * 80 - 40,
        0.01,
        Math.random() * 80 - 40
    );
    scene.add(patch);
}

// Add rocks (obstacles)
const rockPositions = [
    { x: -15, z: -10, size: 2 },
    { x: 10, z: -15, size: 1.5 },
    { x: -5, z: 8, size: 1.8 },
    { x: 20, z: 5, size: 2.2 },
    { x: -20, z: 15, size: 1.6 },
    { x: 15, z: -5, size: 1.4 },
    { x: -8, z: -18, size: 1.9 }
];

rockPositions.forEach(pos => {
    const rockGeometry = new THREE.DodecahedronGeometry(pos.size, 0);
    const rockMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080,
        roughness: 0.9,
        metalness: 0.1
    });

    // Randomize the rock shape slightly
    const posAttr = rockGeometry.getAttribute('position');
    for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        const z = posAttr.getZ(i);
        const scale = 1 + (Math.random() - 0.5) * 0.3;
        posAttr.setXYZ(i, x * scale, y * scale, z * scale);
    }
    posAttr.needsUpdate = true;
    rockGeometry.computeVertexNormals();

    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.set(pos.x, pos.size, pos.z);
    rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );
    rock.castShadow = true;
    rock.receiveShadow = true;
    rock.userData.obstacle = true;
    scene.add(rock);
});

// Add flowers (colorful obstacles)
const flowerPositions = [
    { x: -12, z: 5, color: 0xff69b4 },
    { x: 5, z: 12, color: 0xffff00 },
    { x: -18, z: -5, color: 0xff1493 },
    { x: 8, z: -8, color: 0xff69b4 },
    { x: -2, z: 15, color: 0xffa500 },
    { x: 18, z: -12, color: 0xffff00 },
    { x: -10, z: -15, color: 0xff1493 },
    { x: 12, z: 8, color: 0xffa500 }
];

flowerPositions.forEach(pos => {
    // Flower stem
    const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.set(pos.x, 0.5, pos.z);
    stem.castShadow = true;
    scene.add(stem);

    // Flower petals
    const petalGroup = new THREE.Group();
    for (let i = 0; i < 6; i++) {
        const petalGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const petalMaterial = new THREE.MeshStandardMaterial({ color: pos.color });
        const petal = new THREE.Mesh(petalGeometry, petalMaterial);
        const angle = (i / 6) * Math.PI * 2;
        petal.position.set(Math.cos(angle) * 0.4, 0, Math.sin(angle) * 0.4);
        petal.scale.set(1, 0.3, 1);
        petal.castShadow = true;
        petalGroup.add(petal);
    }

    // Flower center
    const centerGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    const centerMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    const center = new THREE.Mesh(centerGeometry, centerMaterial);
    center.castShadow = true;
    petalGroup.add(center);

    petalGroup.position.set(pos.x, 1, pos.z);
    petalGroup.userData.obstacle = true;
    scene.add(petalGroup);
});

// Boundaries (invisible walls)
const boundarySize = 50;
const boundaries = [
    { x: 0, z: boundarySize, rotation: 0 },      // North
    { x: 0, z: -boundarySize, rotation: 0 },     // South
    { x: boundarySize, z: 0, rotation: Math.PI / 2 },  // East
    { x: -boundarySize, z: 0, rotation: Math.PI / 2 }  // West
];

boundaries.forEach(boundary => {
    const wallGeometry = new THREE.PlaneGeometry(100, 10);
    const wallMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
    });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(boundary.x, 5, boundary.z);
    wall.rotation.y = boundary.rotation;
    wall.userData.boundary = true;
    scene.add(wall);
});

// Visual boundary markers (fence posts)
const fencePosts = [];
for (let i = -40; i <= 40; i += 10) {
    // North and South
    [boundarySize - 2, -boundarySize + 2].forEach(z => {
        const postGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
        const postMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
        const post = new THREE.Mesh(postGeometry, postMaterial);
        post.position.set(i, 1, z);
        post.castShadow = true;
        scene.add(post);
    });

    // East and West
    [boundarySize - 2, -boundarySize + 2].forEach(x => {
        const postGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
        const postMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
        const post = new THREE.Mesh(postGeometry, postMaterial);
        post.position.set(x, 1, i);
        post.castShadow = true;
        scene.add(post);
    });
}

// ============================================
// COLLECTIBLE CLOVERS
// ============================================

// Score state
let score = 0;
let highScore = 0;
let isNewHighScore = false;
const clovers = [];
let cloversCollected = 0;
const TOTAL_CLOVERS = 13;

// ============================================
// HIGH SCORE PERSISTENCE
// ============================================

// Load high score from localStorage
function loadHighScore() {
    try {
        const saved = localStorage.getItem('bugdom_highscore');
        if (saved !== null) {
            highScore = parseInt(saved, 10);
            if (isNaN(highScore)) highScore = 0;
        }
    } catch (e) {
        console.warn('Could not load high score:', e);
        highScore = 0;
    }
}

// Save high score to localStorage
function saveHighScore() {
    try {
        localStorage.setItem('bugdom_highscore', highScore.toString());
    } catch (e) {
        console.warn('Could not save high score:', e);
    }
}

// Update high score if current score exceeds it
function checkAndUpdateHighScore() {
    if (score > highScore) {
        highScore = score;
        isNewHighScore = true;
        saveHighScore();
        return true;
    }
    return false;
}

// Initialize high score on game load
loadHighScore();

// Game state enum
const GameState = {
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over'
};

// Game state
let gameState = GameState.PLAYING;
let gameWon = false;
let gameStartTime = 0;
let pausedTime = 0; // Track time spent paused

// ============================================
// DIFFICULTY & PROGRESSION SYSTEM
// ============================================

// Base difficulty presets
const DIFFICULTY_PRESETS = {
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
let selectedDifficulty = 'medium'; // default

// Difficulty state
let currentLevel = 1;
const MAX_LEVEL = 5;
const CLOVERS_PER_LEVEL = 3; // Every 3 clovers = level up

// Base enemy scaling per level (modified by difficulty preset)
const BASE_DIFFICULTY_SETTINGS = {
    1: { enemySpeed: 0.04, maxEnemies: 3, spawnRate: 0 },
    2: { enemySpeed: 0.05, maxEnemies: 4, spawnRate: 15000 },
    3: { enemySpeed: 0.06, maxEnemies: 5, spawnRate: 12000 },
    4: { enemySpeed: 0.07, maxEnemies: 6, spawnRate: 10000 },
    5: { enemySpeed: 0.08, maxEnemies: 8, spawnRate: 8000 }
};

// Get difficulty settings for current level and preset
function getDifficultySettings(level) {
    const baseSettings = BASE_DIFFICULTY_SETTINGS[level];
    const preset = DIFFICULTY_PRESETS[selectedDifficulty];

    return {
        enemySpeed: baseSettings.enemySpeed * preset.enemySpeedMultiplier,
        maxEnemies: Math.ceil(baseSettings.maxEnemies * preset.enemyCountMultiplier),
        spawnRate: baseSettings.spawnRate > 0 ? baseSettings.spawnRate * preset.spawnRateMultiplier : 0
    };
}

// Rename old DIFFICULTY_SETTINGS references
const DIFFICULTY_SETTINGS = new Proxy({}, {
    get: function(target, prop) {
        return getDifficultySettings(parseInt(prop));
    }
});

// Combo system state
let comboCount = 0;
let comboMultiplier = 1;
let lastCollectTime = 0;
const COMBO_WINDOW = 3000; // 3 seconds to maintain combo
const MAX_COMBO_MULTIPLIER = 5;

// Spawn timer for new enemies
let lastEnemySpawnTime = 0;

// Create a single clover leaf (heart shape)
function createCloverLeaf() {
    const shape = new THREE.Shape();

    // Heart-shaped leaf
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.1, 0.1, 0.2, 0.2, 0.15, 0.35);
    shape.bezierCurveTo(0.1, 0.5, 0, 0.45, 0, 0.35);
    shape.bezierCurveTo(0, 0.45, -0.1, 0.5, -0.15, 0.35);
    shape.bezierCurveTo(-0.2, 0.2, -0.1, 0.1, 0, 0);

    const extrudeSettings = {
        depth: 0.05,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
        bevelSegments: 2
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}

// Create a full clover (3 or 4 leaves)
function createClover(x, z, isFourLeaf = false) {
    const cloverGroup = new THREE.Group();

    // Clover leaves
    const leafCount = isFourLeaf ? 4 : 3;
    const leafMaterial = new THREE.MeshStandardMaterial({
        color: 0x228b22,
        roughness: 0.6,
        metalness: 0.1,
        emissive: 0x114411,
        emissiveIntensity: 0.2
    });

    for (let i = 0; i < leafCount; i++) {
        const leafGeometry = createCloverLeaf();
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        const angle = (i / leafCount) * Math.PI * 2;
        leaf.position.set(0, 0.5, 0);
        leaf.rotation.x = -Math.PI / 2;
        leaf.rotation.z = angle;
        leaf.scale.set(0.8, 0.8, 0.8);
        leaf.castShadow = true;
        cloverGroup.add(leaf);
    }

    // Stem
    const stemGeometry = new THREE.CylinderGeometry(0.03, 0.04, 0.5, 6);
    const stemMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a6b1a,
        roughness: 0.7
    });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.25;
    stem.castShadow = true;
    cloverGroup.add(stem);

    // Position the clover
    cloverGroup.position.set(x, 0.1, z);

    // Add floating animation properties
    cloverGroup.userData = {
        collectible: true,
        collected: false,
        baseY: 0.1,
        rotationSpeed: 0.02 + Math.random() * 0.01,
        floatSpeed: 2 + Math.random(),
        floatOffset: Math.random() * Math.PI * 2,
        isFourLeaf: isFourLeaf
    };

    return cloverGroup;
}

// Generate clover positions (avoiding rocks and flowers)
const cloverPositions = [
    { x: 5, z: 3 },
    { x: -8, z: 12 },
    { x: 12, z: -8 },
    { x: -15, z: -12 },
    { x: 20, z: 10 },
    { x: -22, z: 8 },
    { x: 8, z: -20 },
    { x: -5, z: -5 },
    { x: 15, z: 15 },
    { x: -18, z: -18 },
    { x: 25, z: -5 },
    { x: -10, z: 20 },
    { x: 0, z: -15 }
];

// Add clovers to scene
cloverPositions.forEach((pos, index) => {
    // Make every 4th clover a four-leaf clover (worth more points)
    const isFourLeaf = index % 4 === 0;
    const clover = createClover(pos.x, pos.z, isFourLeaf);
    scene.add(clover);
    clovers.push(clover);
});

// Collision detection radius
const COLLECTION_RADIUS = 2.5;

// Check for clover collection (based on bug position)
function checkCloverCollision() {
    clovers.forEach(clover => {
        if (clover.userData.collected) return;

        const distance = playerBug.position.distanceTo(clover.position);

        if (distance < COLLECTION_RADIUS) {
            collectClover(clover);
        }
    });
}

// Collect a clover
function collectClover(clover) {
    if (clover.userData.collected) return;

    const currentTime = performance.now();
    clover.userData.collected = true;
    cloversCollected++;

    // Update combo system
    if (currentTime - lastCollectTime < COMBO_WINDOW) {
        comboCount++;
        comboMultiplier = Math.min(MAX_COMBO_MULTIPLIER, 1 + Math.floor(comboCount / 2));
    } else {
        comboCount = 1;
        comboMultiplier = 1;
    }
    lastCollectTime = currentTime;

    // Four-leaf clovers worth more, apply combo multiplier
    const basePoints = clover.userData.isFourLeaf ? 25 : 10;
    const points = basePoints * comboMultiplier;
    score += points;

    // Show combo popup if multiplier > 1
    if (comboMultiplier > 1) {
        showComboPopup(comboMultiplier, points);
        // Play combo sound
        audioManager.playCombo(comboMultiplier);
    }

    // Play collection sound
    audioManager.playCloverCollect(clover.userData.isFourLeaf);

    // Update score display
    updateScoreDisplay();
    updateCloverCountDisplay();
    updateComboDisplay();

    // Check for level up
    checkLevelUp();

    // Animate collection (scale down and fade)
    animateCollection(clover);

    // Check for victory
    if (cloversCollected >= TOTAL_CLOVERS) {
        victory();
    }
}

// Check and handle level up
function checkLevelUp() {
    const newLevel = Math.min(MAX_LEVEL, Math.floor(cloversCollected / CLOVERS_PER_LEVEL) + 1);

    if (newLevel > currentLevel) {
        currentLevel = newLevel;
        updateLevelDisplay();
        showLevelUpPopup();

        // Play level up sound
        audioManager.playLevelUp();

        // Apply new difficulty settings
        applyDifficultySettings();
    }
}

// Apply difficulty settings for current level
function applyDifficultySettings() {
    const settings = DIFFICULTY_SETTINGS[currentLevel];

    // Spawn additional enemies if needed
    const enemiesToSpawn = settings.maxEnemies - enemies.length;
    for (let i = 0; i < enemiesToSpawn; i++) {
        setTimeout(() => spawnEnemy(), i * 500); // Stagger spawns
    }
}

// Show combo popup
function showComboPopup(multiplier, points) {
    const popup = document.createElement('div');
    popup.className = 'combo-popup';
    popup.innerHTML = `
        <div class="combo-multiplier">x${multiplier} COMBO!</div>
        <div class="combo-points">+${points}</div>
    `;
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 500;
        text-align: center;
        pointer-events: none;
        animation: comboFade 1s ease-out forwards;
    `;
    document.body.appendChild(popup);

    setTimeout(() => popup.remove(), 1000);
}

// Show level up popup
function showLevelUpPopup() {
    const popup = document.createElement('div');
    popup.className = 'levelup-popup';
    popup.innerHTML = `
        <div class="levelup-text">LEVEL ${currentLevel}!</div>
        <div class="levelup-warning">Enemies are getting stronger!</div>
    `;
    popup.style.cssText = `
        position: fixed;
        top: 30%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 500;
        text-align: center;
        pointer-events: none;
        animation: levelUpFade 2s ease-out forwards;
    `;
    document.body.appendChild(popup);

    setTimeout(() => popup.remove(), 2000);
}

// Collection animation
function animateCollection(clover) {
    const startScale = clover.scale.x;
    const startY = clover.position.y;
    let progress = 0;

    function animateStep() {
        progress += 0.08;

        if (progress >= 1) {
            scene.remove(clover);
            return;
        }

        // Scale down
        const scale = startScale * (1 - progress);
        clover.scale.set(scale, scale, scale);

        // Float up
        clover.position.y = startY + progress * 2;

        // Spin
        clover.rotation.y += 0.2;

        requestAnimationFrame(animateStep);
    }

    animateStep();
}

// Update score display in UI
function updateScoreDisplay() {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        if (highScore > 0) {
            scoreElement.innerHTML = `Score: ${score}<br><span style="font-size: 14px; color: #ffcc00;">Best: ${highScore}</span>`;
        } else {
            scoreElement.textContent = `Score: ${score}`;
        }
    }
}

// Update clover count display in UI
function updateCloverCountDisplay() {
    const cloverCountElement = document.getElementById('clover-count');
    if (cloverCountElement) {
        cloverCountElement.textContent = `Clovers: ${cloversCollected}/${TOTAL_CLOVERS}`;
    }
}

// Update combo display in UI
function updateComboDisplay() {
    const comboElement = document.getElementById('combo-display');
    if (comboElement) {
        if (comboMultiplier > 1) {
            comboElement.textContent = `x${comboMultiplier} Combo`;
            comboElement.classList.add('active');
        } else {
            comboElement.textContent = '';
            comboElement.classList.remove('active');
        }
    }
}

// Update level display in UI
function updateLevelDisplay() {
    const levelElement = document.getElementById('level-display');
    if (levelElement) {
        const difficultyEmoji = { easy: '🟢', medium: '🟡', hard: '🔴' }[selectedDifficulty];
        levelElement.textContent = `${difficultyEmoji} Level ${currentLevel}`;
        // Flash animation on level up
        levelElement.classList.remove('level-up');
        void levelElement.offsetWidth; // Force reflow
        levelElement.classList.add('level-up');
    }
}

// Reset combo if timer expires
function updateComboTimer(currentTime) {
    if (comboMultiplier > 1 && currentTime - lastCollectTime > COMBO_WINDOW) {
        comboCount = 0;
        comboMultiplier = 1;
        updateComboDisplay();
    }
}

// ============================================
// CONFETTI PARTICLE SYSTEM
// ============================================

let confettiParticles = null;
const CONFETTI_COUNT = 500;

function createConfetti() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(CONFETTI_COUNT * 3);
    const colors = new Float32Array(CONFETTI_COUNT * 3);
    const velocities = [];
    const rotations = [];

    // Confetti colors (festive)
    const confettiColors = [
        new THREE.Color(0xff0000), // Red
        new THREE.Color(0x00ff00), // Green
        new THREE.Color(0x0000ff), // Blue
        new THREE.Color(0xffff00), // Yellow
        new THREE.Color(0xff00ff), // Magenta
        new THREE.Color(0x00ffff), // Cyan
        new THREE.Color(0xff8800), // Orange
        new THREE.Color(0x88ff00), // Lime
        new THREE.Color(0xffffff)  // White
    ];

    for (let i = 0; i < CONFETTI_COUNT; i++) {
        // Start from player position, spread out
        positions[i * 3] = playerBug.position.x + (Math.random() - 0.5) * 10;
        positions[i * 3 + 1] = playerBug.position.y + Math.random() * 20 + 5;
        positions[i * 3 + 2] = playerBug.position.z + (Math.random() - 0.5) * 10;

        // Random velocity (mostly upward, then falling)
        velocities.push({
            x: (Math.random() - 0.5) * 0.3,
            y: Math.random() * 0.2 + 0.1,
            z: (Math.random() - 0.5) * 0.3,
            gravity: 0.008 + Math.random() * 0.005
        });

        rotations.push(Math.random() * Math.PI * 2);

        // Random color
        const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.4,
        vertexColors: true,
        transparent: true,
        opacity: 1
    });

    confettiParticles = new THREE.Points(geometry, material);
    confettiParticles.userData.velocities = velocities;
    confettiParticles.userData.startTime = performance.now();
    scene.add(confettiParticles);
}

function updateConfetti() {
    if (!confettiParticles) return;

    const positions = confettiParticles.geometry.attributes.position.array;
    const velocities = confettiParticles.userData.velocities;
    const elapsed = (performance.now() - confettiParticles.userData.startTime) / 1000;

    // Fade out after 4 seconds
    if (elapsed > 4) {
        confettiParticles.material.opacity = Math.max(0, 1 - (elapsed - 4) / 2);
    }

    // Remove after 6 seconds
    if (elapsed > 6) {
        scene.remove(confettiParticles);
        confettiParticles.geometry.dispose();
        confettiParticles.material.dispose();
        confettiParticles = null;
        return;
    }

    for (let i = 0; i < CONFETTI_COUNT; i++) {
        positions[i * 3] += velocities[i].x;
        positions[i * 3 + 1] += velocities[i].y;
        positions[i * 3 + 2] += velocities[i].z;

        // Apply gravity
        velocities[i].y -= velocities[i].gravity;

        // Add some swaying motion
        positions[i * 3] += Math.sin(elapsed * 5 + i) * 0.02;
    }

    confettiParticles.geometry.attributes.position.needsUpdate = true;
}

// ============================================
// VICTORY SCREEN
// ============================================

function victory() {
    if (gameWon) return;
    gameWon = true;
    gameState = GameState.GAME_OVER;

    // Check and update high score
    checkAndUpdateHighScore();

    // Calculate elapsed time
    const elapsedTime = (performance.now() - gameStartTime) / 1000;
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = Math.floor(elapsedTime % 60);
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Play victory sound (also stops music)
    audioManager.playVictory();

    // Create confetti celebration
    createConfetti();

    // Delay showing the victory screen to let confetti start
    setTimeout(() => {
        showVictoryScreen(timeString);
    }, 1500);
}

function showVictoryScreen(timeString) {
    // Create victory overlay
    const overlay = document.createElement('div');
    overlay.id = 'victory-screen';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        color: white;
        font-family: Arial, sans-serif;
        animation: fadeIn 0.5s ease-in;
    `;

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes bounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        @keyframes sparkle {
            0%, 100% { text-shadow: 0 0 10px gold, 0 0 20px gold, 0 0 30px gold; }
            50% { text-shadow: 0 0 20px gold, 0 0 40px gold, 0 0 60px gold; }
        }
        #victory-screen h1 {
            animation: bounce 1s ease-in-out infinite, sparkle 1.5s ease-in-out infinite;
        }
        #victory-screen .stat {
            background: rgba(255, 255, 255, 0.1);
            padding: 15px 30px;
            border-radius: 10px;
            margin: 10px;
            min-width: 200px;
            text-align: center;
        }
        #victory-screen .stat-label {
            font-size: 14px;
            color: #aaa;
            margin-bottom: 5px;
        }
        #victory-screen .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: #4a9d2e;
        }
        #victory-screen button {
            padding: 15px 40px;
            font-size: 20px;
            background: linear-gradient(135deg, #4a9d2e, #228b22);
            color: white;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            margin: 10px;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }
        #victory-screen button:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
        }
    `;
    document.head.appendChild(style);

    const highScoreMessage = isNewHighScore
        ? '<p style="font-size: 28px; color: #ffcc00; margin: 10px 0; animation: sparkle 1.5s ease-in-out infinite;">🎉 NEW HIGH SCORE! 🎉</p>'
        : '';

    overlay.innerHTML = `
        <h1 style="font-size: 64px; color: gold; margin-bottom: 20px;">LEVEL COMPLETE!</h1>
        ${highScoreMessage}
        <div style="display: flex; flex-wrap: wrap; justify-content: center; margin-bottom: 30px;">
            <div class="stat">
                <div class="stat-label">TIME</div>
                <div class="stat-value">${timeString}</div>
            </div>
            <div class="stat">
                <div class="stat-label">SCORE</div>
                <div class="stat-value">${score}</div>
            </div>
            <div class="stat">
                <div class="stat-label">HIGH SCORE</div>
                <div class="stat-value" style="color: #ffcc00;">${highScore}</div>
            </div>
            <div class="stat">
                <div class="stat-label">CLOVERS</div>
                <div class="stat-value">${cloversCollected}/${TOTAL_CLOVERS}</div>
            </div>
            <div class="stat">
                <div class="stat-label">DIFFICULTY</div>
                <div class="stat-value" style="color: #9933ff;">${DIFFICULTY_PRESETS[selectedDifficulty].name} - Level ${currentLevel}</div>
            </div>
        </div>
        <div>
            <button onclick="location.reload()">Play Again</button>
        </div>
    `;

    document.body.appendChild(overlay);
}

// Animate clovers (floating and rotating)
function animateClovers(time) {
    clovers.forEach(clover => {
        if (clover.userData.collected) return;

        // Floating animation
        const floatY = Math.sin(time * 0.001 * clover.userData.floatSpeed + clover.userData.floatOffset) * 0.15;
        clover.position.y = clover.userData.baseY + floatY + 0.3;

        // Rotation
        clover.rotation.y += clover.userData.rotationSpeed;
    });
}

// ============================================
// ENEMY ANTS
// ============================================

// Player health state (will be adjusted by difficulty)
const BASE_MAX_HEALTH = 100;
let MAX_HEALTH = 100; // Adjusted on game start
let playerHealth = 100; // Adjusted on game start
const BASE_DAMAGE_PER_HIT = 10;
let DAMAGE_PER_HIT = 10; // Adjusted by difficulty
const DAMAGE_COOLDOWN = 1000; // 1 second invincibility after being hit
let lastDamageTime = 0;

// Apply difficulty modifiers to player stats
function applyDifficultyToPlayer() {
    const preset = DIFFICULTY_PRESETS[selectedDifficulty];
    MAX_HEALTH = Math.floor(BASE_MAX_HEALTH * preset.playerHealthMultiplier);
    playerHealth = MAX_HEALTH;
    DAMAGE_PER_HIT = Math.floor(BASE_DAMAGE_PER_HIT * preset.damageMultiplier);
    playerState.moveSpeed = 0.15 * preset.playerSpeedMultiplier;
    updateHealthDisplay();
}

// Enemy state
const enemies = [];
const ENEMY_COUNT = 3;
const BASE_ENEMY_SPEED = 0.04;
const ENEMY_COLLISION_RADIUS = 1.5;

// Flying bee enemies
const bees = [];
const BEE_SPEED = 0.06;
const BEE_COLLISION_RADIUS = 1.2;

// Create enemy ant (similar to player bug but red)
function createEnemyAnt() {
    const antGroup = new THREE.Group();

    // Body (main ellipsoid sphere) - RED
    const bodyGeometry = new THREE.SphereGeometry(0.5, 16, 12);
    bodyGeometry.scale(1, 0.6, 1.3);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0xcc2222, // Red
        roughness: 0.5,
        metalness: 0.1
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.4;
    body.castShadow = true;
    antGroup.add(body);

    // Head (smaller sphere) - Darker red
    const headGeometry = new THREE.SphereGeometry(0.3, 12, 10);
    const headMaterial = new THREE.MeshStandardMaterial({
        color: 0x991111, // Darker red
        roughness: 0.4,
        metalness: 0.1
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 0.5, 0.6);
    head.castShadow = true;
    antGroup.add(head);

    // Eyes (two small black spheres)
    const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 6);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });

    [-0.12, 0.12].forEach(xOffset => {
        const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        eye.position.set(xOffset, 0.55, 0.85);
        antGroup.add(eye);
    });

    // Mandibles (two small cone shapes)
    const mandibleGeometry = new THREE.ConeGeometry(0.06, 0.2, 6);
    const mandibleMaterial = new THREE.MeshStandardMaterial({ color: 0x661111 });

    [-0.1, 0.1].forEach((xOffset, i) => {
        const mandible = new THREE.Mesh(mandibleGeometry, mandibleMaterial);
        mandible.position.set(xOffset, 0.4, 0.9);
        mandible.rotation.x = Math.PI / 2;
        mandible.rotation.z = xOffset > 0 ? 0.3 : -0.3;
        antGroup.add(mandible);
    });

    // Antennae
    const antennaGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.35, 6);
    const antennaMaterial = new THREE.MeshStandardMaterial({ color: 0x661111 });
    const antennaTipGeometry = new THREE.SphereGeometry(0.04, 6, 4);

    [-0.1, 0.1].forEach((xOffset, i) => {
        const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        antenna.position.set(xOffset, 0.85, 0.7);
        antenna.rotation.x = Math.PI / 6;
        antenna.rotation.z = xOffset > 0 ? -0.3 : 0.3;
        antGroup.add(antenna);

        const tip = new THREE.Mesh(antennaTipGeometry, antennaMaterial);
        tip.position.set(xOffset * 1.3, 0.98, 0.82);
        antGroup.add(tip);
    });

    // Legs (6 legs - 3 on each side)
    const legGeometry = new THREE.CylinderGeometry(0.025, 0.015, 0.45, 6);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x661111 });

    const legPositions = [
        { x: -0.35, z: 0.25, rotZ: 0.8 },   // Front left
        { x: 0.35, z: 0.25, rotZ: -0.8 },   // Front right
        { x: -0.42, z: 0, rotZ: 1.0 },      // Middle left
        { x: 0.42, z: 0, rotZ: -1.0 },      // Middle right
        { x: -0.35, z: -0.25, rotZ: 0.8 },  // Back left
        { x: 0.35, z: -0.25, rotZ: -0.8 }   // Back right
    ];

    legPositions.forEach((pos, index) => {
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(pos.x, 0.25, pos.z);
        leg.rotation.z = pos.rotZ;
        leg.rotation.x = 0.2;
        leg.castShadow = true;
        leg.userData.legIndex = index;
        antGroup.add(leg);
    });

    // Store reference to legs for animation
    antGroup.userData.legs = antGroup.children.filter(child => child.userData.legIndex !== undefined);
    antGroup.userData.legAnimationTime = Math.random() * Math.PI * 2;

    return antGroup;
}

// Spawn an enemy at a random edge position
function spawnEnemy() {
    const enemy = createEnemyAnt();

    // Spawn at random edge (outside boundary but within view)
    const edge = Math.floor(Math.random() * 4);
    const offset = Math.random() * 80 - 40;

    switch(edge) {
        case 0: // North
            enemy.position.set(offset, 0, -45);
            break;
        case 1: // South
            enemy.position.set(offset, 0, 45);
            break;
        case 2: // East
            enemy.position.set(45, 0, offset);
            break;
        case 3: // West
            enemy.position.set(-45, 0, offset);
            break;
    }

    enemy.userData.isEnemy = true;
    scene.add(enemy);
    enemies.push(enemy);

    return enemy;
}

// Initialize enemies
function initEnemies() {
    for (let i = 0; i < ENEMY_COUNT; i++) {
        spawnEnemy();
    }
}

// Update enemy AI - chase the player
function updateEnemies(deltaTime, currentTime) {
    const settings = DIFFICULTY_SETTINGS[currentLevel];
    const currentSpeed = settings.enemySpeed;

    enemies.forEach(enemy => {
        // Direction to player
        const direction = new THREE.Vector3();
        direction.subVectors(playerBug.position, enemy.position);
        direction.y = 0; // Keep on ground

        if (direction.length() > 0.1) {
            direction.normalize();

            // Move toward player (speed scales with difficulty)
            enemy.position.x += direction.x * currentSpeed;
            enemy.position.z += direction.z * currentSpeed;

            // Rotate to face player
            const targetRotation = Math.atan2(direction.x, direction.z);
            enemy.rotation.y = targetRotation;

            // Animate legs
            enemy.userData.legAnimationTime += deltaTime * 0.012;
            const legs = enemy.userData.legs;
            legs.forEach((leg, index) => {
                const phase = index % 2 === 0 ? 0 : Math.PI;
                const swing = Math.sin(enemy.userData.legAnimationTime * 8 + phase) * 0.25;
                leg.rotation.x = 0.2 + swing;
            });
        }

        // Keep enemies within boundaries
        enemy.position.x = Math.max(-48, Math.min(48, enemy.position.x));
        enemy.position.z = Math.max(-48, Math.min(48, enemy.position.z));
    });

    // Periodic enemy spawning based on difficulty
    if (settings.spawnRate > 0 && currentTime - lastEnemySpawnTime > settings.spawnRate) {
        if (enemies.length < settings.maxEnemies) {
            spawnEnemy();
            lastEnemySpawnTime = currentTime;
        }
    }
}

// ============================================
// FLYING BEE ENEMIES
// ============================================

// Create a flying bee enemy (yellow/black, flies above ground)
function createBee() {
    const beeGroup = new THREE.Group();

    // Body (oval shape) - yellow with black stripes
    const bodyGeometry = new THREE.SphereGeometry(0.4, 16, 12);
    bodyGeometry.scale(1, 0.8, 1.4);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0xffcc00, // Yellow
        roughness: 0.4,
        metalness: 0.1
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0;
    body.castShadow = true;
    beeGroup.add(body);

    // Black stripes on body
    const stripeGeometry = new THREE.TorusGeometry(0.38, 0.06, 8, 16);
    const stripeMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });

    [-0.15, 0.05, 0.25].forEach(zPos => {
        const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
        stripe.position.set(0, 0, zPos);
        stripe.rotation.y = Math.PI / 2;
        beeGroup.add(stripe);
    });

    // Head - black
    const headGeometry = new THREE.SphereGeometry(0.25, 12, 10);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 0.05, 0.55);
    head.castShadow = true;
    beeGroup.add(head);

    // Eyes (two red spheres)
    const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 6);
    const eyeMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0x440000,
        emissiveIntensity: 0.3
    });

    [-0.12, 0.12].forEach(xOffset => {
        const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        eye.position.set(xOffset, 0.1, 0.72);
        beeGroup.add(eye);
    });

    // Stinger
    const stingerGeometry = new THREE.ConeGeometry(0.05, 0.3, 6);
    const stingerMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const stinger = new THREE.Mesh(stingerGeometry, stingerMaterial);
    stinger.position.set(0, 0, -0.55);
    stinger.rotation.x = Math.PI / 2;
    beeGroup.add(stinger);

    // Wings (translucent)
    const wingGeometry = new THREE.PlaneGeometry(0.6, 0.3);
    const wingMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
    });

    [-0.3, 0.3].forEach((xOffset, i) => {
        const wing = new THREE.Mesh(wingGeometry, wingMaterial);
        wing.position.set(xOffset, 0.2, 0);
        wing.rotation.x = Math.PI / 2;
        wing.rotation.z = xOffset > 0 ? 0.3 : -0.3;
        wing.userData.wingIndex = i;
        beeGroup.add(wing);
    });

    // Store wing references for animation
    beeGroup.userData.wings = beeGroup.children.filter(child => child.userData.wingIndex !== undefined);
    beeGroup.userData.wingTime = Math.random() * Math.PI * 2;

    return beeGroup;
}

// Spawn a bee at a random position
function spawnBee() {
    const bee = createBee();

    // Spawn at random edge, elevated
    const edge = Math.floor(Math.random() * 4);
    const offset = Math.random() * 60 - 30;
    const height = 2 + Math.random() * 2; // Fly 2-4 units high

    switch(edge) {
        case 0: bee.position.set(offset, height, -45); break;
        case 1: bee.position.set(offset, height, 45); break;
        case 2: bee.position.set(45, height, offset); break;
        case 3: bee.position.set(-45, height, offset); break;
    }

    // Movement pattern data
    bee.userData.isBee = true;
    bee.userData.baseHeight = height;
    bee.userData.phase = Math.random() * Math.PI * 2;
    bee.userData.circleAngle = Math.random() * Math.PI * 2;
    bee.userData.diveBombCooldown = 0;

    scene.add(bee);
    bees.push(bee);

    return bee;
}

// Update bee AI - circle around and occasionally dive bomb
function updateBees(deltaTime, currentTime) {
    bees.forEach(bee => {
        const distToPlayer = bee.position.distanceTo(playerBug.position);

        // Wing animation (always)
        bee.userData.wingTime += deltaTime * 0.05;
        bee.userData.wings.forEach((wing, i) => {
            const flap = Math.sin(bee.userData.wingTime * 20) * 0.5;
            wing.rotation.z = (i === 0 ? -0.3 : 0.3) + flap;
        });

        // Bobbing motion
        const bob = Math.sin(currentTime * 0.003 + bee.userData.phase) * 0.3;
        bee.position.y = bee.userData.baseHeight + bob;

        // Circle toward player
        const dirToPlayer = new THREE.Vector3();
        dirToPlayer.subVectors(playerBug.position, bee.position);
        dirToPlayer.y = 0;

        if (dirToPlayer.length() > 3) {
            // Move toward player in a circling pattern
            bee.userData.circleAngle += deltaTime * 0.002;
            const circleOffset = new THREE.Vector3(
                Math.cos(bee.userData.circleAngle) * 0.5,
                0,
                Math.sin(bee.userData.circleAngle) * 0.5
            );

            dirToPlayer.normalize();
            dirToPlayer.add(circleOffset);
            dirToPlayer.normalize();

            bee.position.x += dirToPlayer.x * BEE_SPEED;
            bee.position.z += dirToPlayer.z * BEE_SPEED;
        }

        // Face movement direction
        if (dirToPlayer.length() > 0.1) {
            const targetRotation = Math.atan2(dirToPlayer.x, dirToPlayer.z);
            bee.rotation.y = targetRotation;
        }

        // Keep bees within boundaries
        bee.position.x = Math.max(-48, Math.min(48, bee.position.x));
        bee.position.z = Math.max(-48, Math.min(48, bee.position.z));
    });
}

// Spawn bees at higher difficulty levels
function checkBeeSpawn(currentTime) {
    // Bees only appear at level 3+
    if (currentLevel >= 3 && bees.length < currentLevel - 1) {
        // Chance to spawn bee every 20 seconds
        if (Math.random() < 0.001) {
            spawnBee();
        }
    }
}

// Check collision between player and enemies (including bees)
function checkEnemyCollision(currentTime) {
    // Check if player is still in invincibility period
    if (currentTime - lastDamageTime < DAMAGE_COOLDOWN) {
        return;
    }

    // Check ant collisions
    enemies.forEach(enemy => {
        const distance = playerBug.position.distanceTo(enemy.position);

        if (distance < ENEMY_COLLISION_RADIUS) {
            // Take damage!
            takeDamage(currentTime);
        }
    });

    // Check bee collisions
    bees.forEach(bee => {
        const distance = playerBug.position.distanceTo(bee.position);

        if (distance < BEE_COLLISION_RADIUS) {
            takeDamage(currentTime);
        }
    });
}

// Handle player taking damage
function takeDamage(currentTime) {
    lastDamageTime = currentTime;
    playerHealth = Math.max(0, playerHealth - DAMAGE_PER_HIT);

    // Play damage sound
    audioManager.playAntHit();

    // Update health display
    updateHealthDisplay();

    // Flash the player red briefly
    flashPlayer();

    // Check for game over
    if (playerHealth <= 0) {
        gameOver();
    }
}

// Flash player red when hit
function flashPlayer() {
    const originalColors = [];

    // Store original colors and set to red
    playerBug.traverse(child => {
        if (child.isMesh && child.material) {
            originalColors.push({
                mesh: child,
                color: child.material.color.getHex()
            });
            child.material.color.setHex(0xff0000);
        }
    });

    // Restore after 200ms
    setTimeout(() => {
        originalColors.forEach(item => {
            if (item.mesh.material) {
                item.mesh.material.color.setHex(item.color);
            }
        });
    }, 200);
}

// Update health display in UI
function updateHealthDisplay() {
    const healthBar = document.getElementById('health-bar');
    const healthText = document.getElementById('health-text');

    if (healthBar) {
        // Update bar width
        const healthPercent = (playerHealth / MAX_HEALTH) * 100;
        healthBar.style.width = `${healthPercent}%`;

        // Update visual state classes
        healthBar.classList.remove('warning', 'critical');
        if (playerHealth <= 25) {
            healthBar.classList.add('critical');
        } else if (playerHealth <= 50) {
            healthBar.classList.add('warning');
        }
    }

    if (healthText) {
        healthText.textContent = `${playerHealth} / ${MAX_HEALTH}`;
    }
}

// Game over handler
let gameOverTriggered = false;

function gameOver() {
    if (gameOverTriggered) return;
    gameOverTriggered = true;
    gameState = GameState.GAME_OVER;

    // Check and update high score
    checkAndUpdateHighScore();

    // Play game over sound (also stops music)
    audioManager.playGameOver();

    // Calculate elapsed time
    const elapsedTime = (performance.now() - gameStartTime) / 1000;
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = Math.floor(elapsedTime % 60);
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Add game over specific styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInGameOver {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
        }
        @keyframes shakeTitle {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        #game-over {
            animation: fadeInGameOver 0.5s ease-out;
        }
        #game-over h1 {
            animation: shakeTitle 0.8s ease-in-out;
            text-shadow: 0 0 20px rgba(200, 0, 0, 0.5), 0 0 40px rgba(200, 0, 0, 0.3);
        }
        #game-over .stat-box {
            background: rgba(255, 255, 255, 0.1);
            padding: 15px 30px;
            border-radius: 10px;
            margin: 10px;
            min-width: 150px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        #game-over .stat-label {
            font-size: 14px;
            color: #aaa;
            margin-bottom: 5px;
        }
        #game-over .stat-value {
            font-size: 28px;
            font-weight: bold;
            color: #ff6666;
        }
        #game-over button {
            padding: 18px 50px;
            font-size: 22px;
            background: linear-gradient(135deg, #cc3333, #aa2222);
            color: white;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            margin-top: 20px;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
        }
        #game-over button:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 20px rgba(200, 0, 0, 0.4);
            background: linear-gradient(135deg, #dd4444, #bb3333);
        }
    `;
    document.head.appendChild(style);

    // Create game over overlay
    const overlay = document.createElement('div');
    overlay.id = 'game-over';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(20, 0, 0, 0.9);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        color: white;
        font-family: Arial, sans-serif;
    `;
    const enemyMsg = bees.length > 0 ? 'The bugs got you!' : 'The ants got you!';
    const highScoreMessage = isNewHighScore
        ? '<p style="font-size: 24px; color: #ffcc00; margin: 10px 0;">🎉 NEW HIGH SCORE! 🎉</p>'
        : '';

    overlay.innerHTML = `
        <h1 style="font-size: 72px; color: #cc2222; margin-bottom: 10px;">GAME OVER</h1>
        <p style="font-size: 18px; color: #888; margin-bottom: 10px;">${enemyMsg}</p>
        ${highScoreMessage}
        <div style="display: flex; flex-wrap: wrap; justify-content: center; margin-bottom: 20px;">
            <div class="stat-box">
                <div class="stat-label">FINAL SCORE</div>
                <div class="stat-value">${score}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">HIGH SCORE</div>
                <div class="stat-value" style="color: #ffcc00;">${highScore}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">TIME</div>
                <div class="stat-value">${timeString}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">CLOVERS</div>
                <div class="stat-value">${cloversCollected}/${TOTAL_CLOVERS}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">LEVEL</div>
                <div class="stat-value" style="color: #9933ff;">${currentLevel}</div>
            </div>
        </div>
        <button onclick="location.reload()">Try Again</button>
    `;
    document.body.appendChild(overlay);
}

// Initialize enemies when game starts
initEnemies();

// ============================================
// PLAYER CONTROLS
// ============================================

const keys = {
    w: false, a: false, s: false, d: false,
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false
};

window.addEventListener('keydown', (e) => {
    if (e.key in keys) keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key in keys) keys[e.key] = false;
});

// Animate the bug's legs when moving
function animateBugLegs(deltaTime) {
    if (!playerState.isMoving) return;

    playerState.legAnimationTime += deltaTime * 0.015;
    const legs = playerBug.userData.legs;

    legs.forEach((leg, index) => {
        // Alternate leg movement pattern (tripod gait)
        const phase = index % 2 === 0 ? 0 : Math.PI;
        const swing = Math.sin(playerState.legAnimationTime * 10 + phase) * 0.3;
        leg.rotation.x = 0.2 + swing;
    });
}

// Update player bug position based on input
function updatePlayerBug() {
    // Get touch input if mobile
    const touchInput = getTouchControls();

    const moveForward = keys.w || keys.ArrowUp || touchInput.forward;
    const moveBackward = keys.s || keys.ArrowDown || touchInput.backward;
    const turnLeft = keys.a || keys.ArrowLeft || touchInput.left;
    const turnRight = keys.d || keys.ArrowRight || touchInput.right;

    // Rotation
    if (turnLeft) {
        playerState.rotation += playerState.rotationSpeed;
    }
    if (turnRight) {
        playerState.rotation -= playerState.rotationSpeed;
    }

    // Apply rotation to bug
    playerBug.rotation.y = playerState.rotation;

    // Movement
    playerState.isMoving = false;
    const direction = new THREE.Vector3();

    if (moveForward) {
        direction.z = 1;
        playerState.isMoving = true;
    }
    if (moveBackward) {
        direction.z = -1;
        playerState.isMoving = true;
    }

    if (direction.length() > 0) {
        direction.normalize();
        // Rotate direction by bug's rotation
        direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), playerState.rotation);

        // Apply movement
        playerBug.position.x += direction.x * playerState.moveSpeed;
        playerBug.position.z += direction.z * playerState.moveSpeed;

        // Keep bug within boundaries
        playerBug.position.x = Math.max(-45, Math.min(45, playerBug.position.x));
        playerBug.position.z = Math.max(-45, Math.min(45, playerBug.position.z));
    }
}

// Update camera to follow the bug (third-person view)
function updateCamera() {
    // Calculate desired camera position based on bug's position and rotation
    const offset = cameraOffset.clone();
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), playerState.rotation);

    const targetCameraPos = playerBug.position.clone().add(offset);

    // Smooth camera follow
    camera.position.lerp(targetCameraPos, 0.1);

    // Look at bug with slight offset
    const lookTarget = playerBug.position.clone().add(cameraLookOffset);
    camera.lookAt(lookTarget);
}

// ============================================
// MINIMAP SYSTEM
// ============================================

const minimapCanvas = document.getElementById('minimap');
const minimapCtx = minimapCanvas ? minimapCanvas.getContext('2d') : null;
const MINIMAP_SIZE = 150;
const WORLD_SIZE = 100; // -50 to 50 in game units
const MINIMAP_SCALE = MINIMAP_SIZE / WORLD_SIZE;

// Convert world coordinates to minimap coordinates
function worldToMinimap(worldX, worldZ) {
    const minimapX = (worldX + WORLD_SIZE / 2) * MINIMAP_SCALE;
    const minimapY = (worldZ + WORLD_SIZE / 2) * MINIMAP_SCALE;
    return { x: minimapX, y: minimapY };
}

// Draw the minimap
function drawMinimap() {
    if (!minimapCtx) return;

    // Clear the canvas with semi-transparent background
    minimapCtx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    minimapCtx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    // Draw boundary outline
    minimapCtx.strokeStyle = 'rgba(139, 69, 19, 0.5)';
    minimapCtx.lineWidth = 2;
    const boundaryPadding = 5 * MINIMAP_SCALE;
    minimapCtx.strokeRect(
        boundaryPadding,
        boundaryPadding,
        MINIMAP_SIZE - boundaryPadding * 2,
        MINIMAP_SIZE - boundaryPadding * 2
    );

    // Draw uncollected clovers as yellow dots
    minimapCtx.fillStyle = '#ffcc00';
    clovers.forEach(clover => {
        if (!clover.userData.collected) {
            const pos = worldToMinimap(clover.position.x, clover.position.z);
            minimapCtx.beginPath();
            minimapCtx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
            minimapCtx.fill();
        }
    });

    // Draw enemies (ants) as red dots
    minimapCtx.fillStyle = '#ff3333';
    enemies.forEach(enemy => {
        const pos = worldToMinimap(enemy.position.x, enemy.position.z);
        minimapCtx.beginPath();
        minimapCtx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
        minimapCtx.fill();
    });

    // Draw bees as orange dots
    minimapCtx.fillStyle = '#ff9900';
    bees.forEach(bee => {
        const pos = worldToMinimap(bee.position.x, bee.position.z);
        minimapCtx.beginPath();
        minimapCtx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
        minimapCtx.fill();
    });

    // Draw player as green dot with direction indicator
    const playerPos = worldToMinimap(playerBug.position.x, playerBug.position.z);

    // Player direction indicator (triangle)
    minimapCtx.fillStyle = '#00ff00';
    minimapCtx.save();
    minimapCtx.translate(playerPos.x, playerPos.y);
    minimapCtx.rotate(-playerState.rotation);
    minimapCtx.beginPath();
    minimapCtx.moveTo(0, -6);  // Point forward
    minimapCtx.lineTo(-4, 4);
    minimapCtx.lineTo(4, 4);
    minimapCtx.closePath();
    minimapCtx.fill();
    minimapCtx.restore();

    // Player glow effect
    minimapCtx.fillStyle = 'rgba(0, 255, 0, 0.3)';
    minimapCtx.beginPath();
    minimapCtx.arc(playerPos.x, playerPos.y, 8, 0, Math.PI * 2);
    minimapCtx.fill();
}

// ============================================
// PAUSE/RESUME FUNCTIONALITY
// ============================================

let lastPauseTime = 0;

function togglePause() {
    if (gameState === GameState.GAME_OVER || !gameStarted) return;

    if (gameState === GameState.PLAYING) {
        pauseGame();
    } else if (gameState === GameState.PAUSED) {
        resumeGame();
    }
}

function pauseGame() {
    gameState = GameState.PAUSED;
    lastPauseTime = performance.now();

    // Play pause sound
    audioManager.playPause();

    // Show pause overlay
    showPauseOverlay();

    // Pause audio
    audioManager.pause();
}

function resumeGame() {
    gameState = GameState.PLAYING;

    // Track paused time to adjust game timer
    const pauseDuration = performance.now() - lastPauseTime;
    pausedTime += pauseDuration;

    // Hide pause overlay
    hidePauseOverlay();

    // Resume audio
    audioManager.resume();
    
    // Play resume sound
    audioManager.playResume();
}

function showPauseOverlay() {
    const pauseOverlay = document.getElementById('pause-overlay');
    if (pauseOverlay) {
        pauseOverlay.classList.remove('hidden');
    }
}

function hidePauseOverlay() {
    const pauseOverlay = document.getElementById('pause-overlay');
    if (pauseOverlay) {
        pauseOverlay.classList.add('hidden');
    }
}

function restartGame() {
    // Reload the page to restart the game
    location.reload();
}

// ============================================
// ANIMATION LOOP
// ============================================

let animationTime = 0;
let lastTime = 0;

function animate(currentTime) {
    requestAnimationFrame(animate);

    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    // If game is paused, don't update game logic, only render
    if (gameState === GameState.PAUSED) {
        renderer.render(scene, camera);
        return;
    }

    animationTime += 16; // ~60fps for clover animation

    // Update player bug movement (even after victory for camera to work)
    updatePlayerBug();

    // Animate bug legs
    animateBugLegs(deltaTime);

    // Update third-person camera
    updateCamera();

    // Update clovers animation
    animateClovers(animationTime);

    // Check for clover collection (only if not won yet)
    if (!gameWon) {
        checkCloverCollision();
    }

    // Update enemy ants (only if game not won)
    if (!gameWon && !gameOverTriggered) {
        updateEnemies(deltaTime, currentTime);
        updateBees(deltaTime, currentTime);
        checkBeeSpawn(currentTime);
        // Check for enemy collision
        checkEnemyCollision(currentTime);
        // Update combo timer
        updateComboTimer(currentTime);
    }

    // Update confetti particles
    updateConfetti();

    // Update day/night cycle
    if (dayNightCycle && gameStarted) {
        dayNightCycle.update(deltaTime);
    }

    // Draw minimap (real-time update)
    drawMinimap();

    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ============================================
// AUDIO INITIALIZATION & CONTROLS
// ============================================

// Game started flag (for audio unlock)
let gameStarted = false;

// Initialize audio on start button click (handles browser autoplay restriction)
function initAudio() {
    if (audioManager.init()) {
        audioManager.resume();
        audioManager.startMusic();
    }
}

// Start button click handler
const startButton = document.getElementById('start-button');
const startOverlay = document.getElementById('start-overlay');
const welcomeMessage = document.getElementById('welcome-message');

let welcomeMessageShown = false;

// Show welcome message after game starts
function showWelcomeMessage() {
    if (welcomeMessage && !welcomeMessageShown) {
        welcomeMessageShown = true;
        welcomeMessage.classList.remove('hidden');

        // Auto-hide after 5 seconds
        setTimeout(() => {
            welcomeMessage.classList.add('hiding');
            setTimeout(() => {
                welcomeMessage.classList.add('hidden');
                welcomeMessage.classList.remove('hiding');
            }, 500); // Match animation duration
        }, 5000);
    }
}

// Difficulty selection handlers
const difficultyButtons = document.querySelectorAll('.difficulty-btn');
const difficultyDesc = document.getElementById('difficulty-desc');

if (difficultyButtons && difficultyDesc) {
    difficultyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove selected class from all buttons
            difficultyButtons.forEach(b => b.classList.remove('selected'));

            // Add selected class to clicked button
            btn.classList.add('selected');

            // Update selected difficulty
            selectedDifficulty = btn.dataset.difficulty;

            // Update description
            const preset = DIFFICULTY_PRESETS[selectedDifficulty];
            difficultyDesc.textContent = preset.description;
        });
    });
}

if (startButton && startOverlay) {
    startButton.addEventListener('click', () => {
        gameStarted = true;
        gameStartTime = performance.now();
        startOverlay.classList.add('hidden');

        // Apply difficulty settings to player
        applyDifficultyToPlayer();

        initAudio();
        updateCloverCountDisplay();
        updateLevelDisplay(); // Show initial level with difficulty
        // Initialize day/night cycle
        dayNightCycle = new DayNightCycle(scene, ambientLight, directionalLight);

        // Show welcome message after a short delay
        setTimeout(showWelcomeMessage, 1000);
    });
}

// Audio control event listeners
const muteBtn = document.getElementById('mute-btn');
const musicVolume = document.getElementById('music-volume');
const sfxVolume = document.getElementById('sfx-volume');

if (muteBtn) {
    muteBtn.addEventListener('click', () => {
        // Play UI click sound before toggling (so it can be heard)
        if (!audioManager.getMuteState()) {
            audioManager.playUIClick();
        }
        const isMuted = audioManager.toggleMute();
        muteBtn.textContent = isMuted ? '🔇' : '🔊';
        muteBtn.classList.toggle('muted', isMuted);
    });
}

if (musicVolume) {
    musicVolume.addEventListener('input', (e) => {
        audioManager.setMusicVolume(e.target.value / 100);
    });
}

if (sfxVolume) {
    sfxVolume.addEventListener('input', (e) => {
        audioManager.setSfxVolume(e.target.value / 100);
    });
}

// ============================================
// PAUSE SYSTEM CONTROLS
// ============================================

const pauseButton = document.getElementById('pause-button');
const resumeButton = document.getElementById('resume-button');
const restartButton = document.getElementById('restart-button');

if (pauseButton) {
    pauseButton.addEventListener('click', togglePause);
}

if (resumeButton) {
    resumeButton.addEventListener('click', resumeGame);
}

if (restartButton) {
    restartButton.addEventListener('click', restartGame);
}

// ============================================
// HELP SYSTEM CONTROLS
// ============================================

const helpButton = document.getElementById('help-button');
const helpOverlay = document.getElementById('help-overlay');
const helpClose = document.getElementById('help-close');

// Toggle help overlay
function toggleHelp() {
    if (helpOverlay) {
        helpOverlay.classList.toggle('show');
    }
}

// Close help overlay
function closeHelp() {
    if (helpOverlay) {
        helpOverlay.classList.remove('show');
    }
}

// Help button click
if (helpButton) {
    helpButton.addEventListener('click', toggleHelp);
}

// Help close button click
if (helpClose) {
    helpClose.addEventListener('click', closeHelp);
}

// Keyboard shortcuts for help and pause
document.addEventListener('keydown', (e) => {
    // H key to toggle help
    if (e.key === 'h' || e.key === 'H') {
        toggleHelp();
    }
    // ESC key to close help or resume from pause
    if (e.key === 'Escape') {
        if (helpOverlay && helpOverlay.classList.contains('show')) {
            closeHelp();
        } else if (gameState === GameState.PAUSED) {
            resumeGame();
        }
    }
    // P key or Space bar to toggle pause
    if ((e.key === 'p' || e.key === 'P' || e.key === ' ') && gameStarted) {
        e.preventDefault(); // Prevent page scroll on spacebar
        togglePause();
    }
});

// Start animation
animate(0);

// Export scene for testing
export { scene, camera, renderer, score, clovers, playerBug, enemies, bees, playerHealth, MAX_HEALTH, audioManager, cloversCollected, TOTAL_CLOVERS, gameWon, gameOverTriggered, currentLevel, comboMultiplier };

import * as THREE from 'three';

/**
 * LevelManager class - Manages all level/world setup and enemy systems
 * Handles world geometry, collectibles, enemies, and level progression
 */
export class LevelManager {
    constructor(scene) {
        this.scene = scene;
        this.enemies = [];
        this.bees = [];
        this.confetti = null;
        this._pendingTimeouts = [];
        this._pendingAnimationFrames = [];
        this._currentLevel = null;
        this._initializePositions();
        this.boundarySize = 50;
    }

    /**
     * Cancel all pending timeouts and animation frames.
     * Call this on level change to prevent stale callbacks from firing.
     */
    cancelPendingTimers() {
        this._pendingTimeouts.forEach(id => clearTimeout(id));
        this._pendingTimeouts = [];
        this._pendingAnimationFrames.forEach(id => cancelAnimationFrame(id));
        this._pendingAnimationFrames = [];
    }

    /**
     * Initialize position arrays for level obstacles and collectibles
     * @private
     */
    _initializePositions() {
        this.rockPositions = [
            { x: -15, z: -10, size: 2 },
            { x: 10, z: -15, size: 1.5 },
            { x: -5, z: 8, size: 1.8 },
            { x: 20, z: 5, size: 2.2 },
            { x: -20, z: 15, size: 1.6 },
            { x: 15, z: -5, size: 1.4 },
            { x: -8, z: -18, size: 1.9 }
        ];

        this.flowerPositions = [
            { x: -12, z: 5, color: 0xff69b4 },
            { x: 5, z: 12, color: 0xffff00 },
            { x: -18, z: -5, color: 0xff1493 },
            { x: 8, z: -8, color: 0xff69b4 },
            { x: -2, z: 15, color: 0xffa500 },
            { x: 18, z: -12, color: 0xffff00 },
            { x: -10, z: -15, color: 0xff1493 },
            { x: 12, z: 8, color: 0xffa500 }
        ];

        this.cloverPositions = [
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
            { x: 0, z: -15 },
            { x: 18, z: -15 },
            { x: -25, z: -8 },
            { x: 10, z: 22 },
            { x: -12, z: -22 },
            { x: 28, z: 5 },
            { x: -28, z: 15 },
            { x: 3, z: -25 },
            { x: -20, z: 5 },
            { x: 22, z: -12 },
            { x: -8, z: -15 },
            { x: 14, z: 8 },
            { x: -16, z: 18 },
            { x: 6, z: -18 },
            { x: -24, z: -3 },
            { x: 26, z: 12 },
            { x: -6, z: 25 },
            { x: 16, z: -22 }
        ];
    }

    // ============================================
    // WORLD SETUP METHODS
    // ============================================

    /**
     * Setup the ground plane with grass texture and vertex displacement
     */
    setupGround() {
        const groundGeometry = new THREE.PlaneGeometry(100, 100, 32, 32);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x5db83c, // Brighter, more saturated green like original Bugdom
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
        this.scene.add(ground);

        // Add grass patches (darker green spots)
        for (let i = 0; i < 20; i++) {
            const patchGeometry = new THREE.CircleGeometry(Math.random() * 2 + 1, 16);
            const patchMaterial = new THREE.MeshStandardMaterial({
                color: 0x4a9d2e, // Slightly brighter grass patches
                roughness: 0.9
            });
            const patch = new THREE.Mesh(patchGeometry, patchMaterial);
            patch.rotation.x = -Math.PI / 2;
            patch.position.set(
                Math.random() * 80 - 40,
                0.01,
                Math.random() * 80 - 40
            );
            this.scene.add(patch);
        }
    }

    /**
     * Setup rocks (obstacles) in the world
     */
    setupRocks() {
        this.rockPositions.forEach(pos => {
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
            this.scene.add(rock);
        });
    }

    /**
     * Setup flowers (colorful obstacles) in the world
     */
    setupFlowers() {
        this.flowerPositions.forEach(pos => {
            // Flower stem
            const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
            const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
            const stem = new THREE.Mesh(stemGeometry, stemMaterial);
            stem.position.set(pos.x, 0.5, pos.z);
            stem.castShadow = true;
            this.scene.add(stem);

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
            this.scene.add(petalGroup);
        });
    }

    /**
     * Setup invisible boundary walls
     */
    setupBoundaries() {
        const boundaries = [
            { x: 0, z: this.boundarySize, rotation: 0 },      // North
            { x: 0, z: -this.boundarySize, rotation: 0 },     // South
            { x: this.boundarySize, z: 0, rotation: Math.PI / 2 },  // East
            { x: -this.boundarySize, z: 0, rotation: Math.PI / 2 }  // West
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
            this.scene.add(wall);
        });
    }

    /**
     * Setup visual boundary markers (fence posts)
     */
    setupFencePosts() {
        for (let i = -40; i <= 40; i += 10) {
            // North and South
            [this.boundarySize - 2, -this.boundarySize + 2].forEach(z => {
                const postGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
                const postMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
                const post = new THREE.Mesh(postGeometry, postMaterial);
                post.position.set(i, 1, z);
                post.castShadow = true;
                this.scene.add(post);
            });

            // East and West
            [this.boundarySize - 2, -this.boundarySize + 2].forEach(x => {
                const postGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
                const postMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
                const post = new THREE.Mesh(postGeometry, postMaterial);
                post.position.set(x, 1, i);
                post.castShadow = true;
                this.scene.add(post);
            });
        }
    }

    // ============================================
    // CLOVER MANAGEMENT
    // ============================================

    /**
     * Create a single clover leaf (heart shape)
     */
    createCloverLeaf() {
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

    /**
     * Create a full clover (3 or 4 leaves)
     */
    createClover(x, z, isFourLeaf = false) {
        const cloverGroup = new THREE.Group();

        this._addCloverLeaves(cloverGroup, isFourLeaf);
        this._addCloverStem(cloverGroup);
        this._positionClover(cloverGroup, x, z, isFourLeaf);

        return cloverGroup;
    }

    /**
     * Add leaves to clover group
     * @private
     */
    _addCloverLeaves(cloverGroup, isFourLeaf) {
        const leafCount = isFourLeaf ? 4 : 3;
        const leafMaterial = new THREE.MeshStandardMaterial({
            color: 0x228b22,
            roughness: 0.6,
            metalness: 0.1,
            emissive: 0x114411,
            emissiveIntensity: 0.2
        });

        for (let i = 0; i < leafCount; i++) {
            const leafGeometry = this.createCloverLeaf();
            const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
            const angle = (i / leafCount) * Math.PI * 2;
            leaf.position.set(0, 0.5, 0);
            leaf.rotation.x = -Math.PI / 2;
            leaf.rotation.z = angle;
            leaf.scale.set(0.8, 0.8, 0.8);
            leaf.castShadow = true;
            cloverGroup.add(leaf);
        }
    }

    /**
     * Add stem to clover group
     * @private
     */
    _addCloverStem(cloverGroup) {
        const stemGeometry = new THREE.CylinderGeometry(0.03, 0.04, 0.5, 6);
        const stemMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a6b1a,
            roughness: 0.7
        });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 0.25;
        stem.castShadow = true;
        cloverGroup.add(stem);
    }

    /**
     * Position clover and set animation properties
     * @private
     */
    _positionClover(cloverGroup, x, z, isFourLeaf) {
        cloverGroup.position.set(x, 0.1, z);
        cloverGroup.userData = {
            collectible: true,
            collected: false,
            baseY: 0.1,
            rotationSpeed: 0.02 + Math.random() * 0.01,
            floatSpeed: 2 + Math.random(),
            floatOffset: Math.random() * Math.PI * 2,
            isFourLeaf: isFourLeaf
        };
    }

    /**
     * Spawn all clovers in the world
     * @returns {Array} Array of clover objects
     */
    spawnClovers() {
        const clovers = [];

        this.cloverPositions.forEach((pos, index) => {
            // Make every 4th clover a four-leaf clover (worth more points)
            const isFourLeaf = index % 4 === 0;
            const clover = this.createClover(pos.x, pos.z, isFourLeaf);
            this.scene.add(clover);
            clovers.push(clover);
        });

        return clovers;
    }

    /**
     * Animate clovers (floating and rotating)
     */
    animateClovers(clovers, time) {
        clovers.forEach(clover => {
            if (clover.userData.collected) return;

            // Floating animation
            const floatY = Math.sin(time * 0.001 * clover.userData.floatSpeed + clover.userData.floatOffset) * 0.15;
            clover.position.y = clover.userData.baseY + floatY + 0.3;

            // Rotation
            clover.rotation.y += clover.userData.rotationSpeed;
        });
    }

    /**
     * Animate clover collection (scale down and fade)
     */
    animateCollection(clover, onComplete) {
        const startScale = clover.scale.x;
        const startY = clover.position.y;
        let progress = 0;

        const animateStep = () => {
            progress += 0.08;

            if (progress >= 1) {
                this.scene.remove(clover);
                if (onComplete) onComplete();
                return;
            }

            // Scale down
            const scale = startScale * (1 - progress);
            clover.scale.set(scale, scale, scale);

            // Float up
            clover.position.y = startY + progress * 2;

            // Spin
            clover.rotation.y += 0.2;

            const rafId = requestAnimationFrame(animateStep);
            this._pendingAnimationFrames.push(rafId);
        };

        animateStep();
    }

    // ============================================
    // CONFETTI SYSTEM
    // ============================================

    /**
     * Create confetti particle system for victory celebration
     */
    createConfetti(playerPosition) {
        const CONFETTI_COUNT = 500;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(CONFETTI_COUNT * 3);
        const colors = new Float32Array(CONFETTI_COUNT * 3);
        const velocities = [];

        const confettiColors = this._getConfettiColors();
        this._initializeConfettiParticles(CONFETTI_COUNT, positions, colors, velocities, playerPosition, confettiColors);

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.4,
            vertexColors: true,
            transparent: true,
            opacity: 1
        });

        this.confetti = new THREE.Points(geometry, material);
        this.confetti.userData.velocities = velocities;
        this.confetti.userData.startTime = performance.now();
        this.confetti.userData.confettiCount = CONFETTI_COUNT;
        this.scene.add(this.confetti);
    }

    /**
     * Get confetti color palette
     * @private
     */
    _getConfettiColors() {
        return [
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
    }

    /**
     * Initialize confetti particle positions, colors, and velocities
     * @private
     */
    _initializeConfettiParticles(count, positions, colors, velocities, playerPosition, confettiColors) {
        for (let i = 0; i < count; i++) {
            // Start from player position, spread out
            positions[i * 3] = playerPosition.x + (Math.random() - 0.5) * 10;
            positions[i * 3 + 1] = playerPosition.y + Math.random() * 20 + 5;
            positions[i * 3 + 2] = playerPosition.z + (Math.random() - 0.5) * 10;

            // Random velocity (mostly upward, then falling)
            velocities.push({
                x: (Math.random() - 0.5) * 0.3,
                y: Math.random() * 0.2 + 0.1,
                z: (Math.random() - 0.5) * 0.3,
                gravity: 0.008 + Math.random() * 0.005
            });

            // Random color
            const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
    }

    /**
     * Update confetti particle system
     */
    updateConfetti() {
        if (!this.confetti) return;

        const positions = this.confetti.geometry.attributes.position.array;
        const velocities = this.confetti.userData.velocities;
        const confettiCount = this.confetti.userData.confettiCount;
        const elapsed = (performance.now() - this.confetti.userData.startTime) / 1000;

        // Fade out after 4 seconds
        if (elapsed > 4) {
            this.confetti.material.opacity = Math.max(0, 1 - (elapsed - 4) / 2);
        }

        // Remove after 6 seconds
        if (elapsed > 6) {
            this.clearConfetti();
            return;
        }

        for (let i = 0; i < confettiCount; i++) {
            positions[i * 3] += velocities[i].x;
            positions[i * 3 + 1] += velocities[i].y;
            positions[i * 3 + 2] += velocities[i].z;

            // Apply gravity
            velocities[i].y -= velocities[i].gravity;

            // Add some swaying motion
            positions[i * 3] += Math.sin(elapsed * 5 + i) * 0.02;
        }

        this.confetti.geometry.attributes.position.needsUpdate = true;
    }

    /**
     * Clear confetti system
     */
    clearConfetti() {
        if (!this.confetti) return;

        this.scene.remove(this.confetti);
        this.confetti.geometry.dispose();
        this.confetti.material.dispose();
        this.confetti = null;
    }

    // ============================================
    // LEVEL ENVIRONMENT
    // ============================================

    /**
     * Apply level-specific environmental effects and mechanics
     */
    applyLevelEnvironment(level, ambientLight, directionalLight, scene, enemyManager, collectiblesManager) {
        this.cancelPendingTimers();
        this.clearConfetti();
        this._currentLevel = level;

        if (level === 3) {
            this.applyLevel3Environment(ambientLight, directionalLight, scene, enemyManager);
        } else if (level === 4) {
            this.applyLevel4Environment(ambientLight, directionalLight, scene, enemyManager, collectiblesManager);
        } else if (level >= 5) {
            this.applyLevel5PlusEnvironment(ambientLight, directionalLight, scene);
        } else {
            this.applyDefaultEnvironment(ambientLight, directionalLight);
        }
    }

    applyLevel3Environment(ambientLight, directionalLight, scene, enemyManager) {
        scene.fog = new THREE.Fog(0x87ceeb, 30, 120); // Denser fog
        if (ambientLight) {
            ambientLight.intensity = 0.5; // Slightly dimmer
        }
        if (directionalLight) {
            directionalLight.intensity = 0.7; // Softer shadows
        }
        // Spawn additional spiders for level 3
        const spidersToAdd = 2;
        const levelAtCall = 3;
        for (let i = 0; i < spidersToAdd; i++) {
            const id = setTimeout(() => {
                if (this._currentLevel !== levelAtCall) return;
                const x = (Math.random() - 0.5) * 80;
                const z = (Math.random() - 0.5) * 80;
                enemyManager.spawnSpider(x, 8, z);
            }, i * 1000);
            this._pendingTimeouts.push(id);
        }
    }

    applyLevel4Environment(ambientLight, directionalLight, scene, enemyManager, collectiblesManager) {
        scene.fog = new THREE.Fog(0x7ba8c4, 40, 140); // Slightly darker fog
        if (ambientLight) {
            ambientLight.intensity = 0.45; // Even dimmer
        }
        if (directionalLight) {
            directionalLight.intensity = 0.65;
            directionalLight.color.setHex(0xf0e6d2); // Slightly warmer tint
        }
        // Spawn slugs for level 4
        const slugsToAdd = 3;
        const levelAtCall = 4;
        for (let i = 0; i < slugsToAdd; i++) {
            const id = setTimeout(() => {
                if (this._currentLevel !== levelAtCall) return;
                const x = (Math.random() - 0.5) * 80;
                const z = (Math.random() - 0.5) * 80;
                enemyManager.spawnSlug(x, 0.5, z);
            }, i * 1200);
            this._pendingTimeouts.push(id);
        }
        // Add extra power-ups for compensation
        const extraPowerUps = 2;
        for (let i = 0; i < extraPowerUps; i++) {
            const id = setTimeout(() => {
                if (this._currentLevel !== levelAtCall) return;
                const x = (Math.random() - 0.5) * 70;
                const z = (Math.random() - 0.5) * 70;
                const powerUpType = Math.random() < 0.5 ? 'speed' : 'invincibility';
                collectiblesManager.spawnMushroom(new THREE.Vector3(x, 1, z), powerUpType);
            }, i * 1500 + 500);
            this._pendingTimeouts.push(id);
        }
    }

    applyLevel5PlusEnvironment(ambientLight, directionalLight, scene) {
        scene.fog = new THREE.Fog(0x6a95b0, 35, 150);
        if (ambientLight) {
            ambientLight.intensity = 0.5;
        }
        if (directionalLight) {
            directionalLight.intensity = 0.7;
            directionalLight.color.setHex(0xffffff); // Reset to white
        }
    }

    applyDefaultEnvironment(ambientLight, directionalLight) {
        if (ambientLight) {
            ambientLight.intensity = 0.6; // Default
        }
        if (directionalLight) {
            directionalLight.intensity = 0.8; // Default
            directionalLight.color.setHex(0xffffff);
        }
    }

    // ============================================
    // ENEMY ANT SYSTEM
    // ============================================

    /**
     * Create enemy ant (similar to player bug but red)
     */
    createEnemyAnt() {
        const antGroup = new THREE.Group();

        this.addAntBody(antGroup);
        this.addAntHead(antGroup);
        this.addAntEyes(antGroup);
        this.addAntMandibles(antGroup);
        this.addAntAntennae(antGroup);
        this.addAntLegs(antGroup);

        // Store reference to legs for animation
        antGroup.userData.legs = antGroup.children.filter(child => child.userData.legIndex !== undefined);
        antGroup.userData.legAnimationTime = Math.random() * Math.PI * 2;

        return antGroup;
    }

    addAntBody(antGroup) {
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
    }

    addAntHead(antGroup) {
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
    }

    addAntEyes(antGroup) {
        const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 6);
        const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });

        [-0.12, 0.12].forEach(xOffset => {
            const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            eye.position.set(xOffset, 0.55, 0.85);
            antGroup.add(eye);
        });
    }

    addAntMandibles(antGroup) {
        const mandibleGeometry = new THREE.ConeGeometry(0.06, 0.2, 6);
        const mandibleMaterial = new THREE.MeshStandardMaterial({ color: 0x661111 });

        [-0.1, 0.1].forEach((xOffset) => {
            const mandible = new THREE.Mesh(mandibleGeometry, mandibleMaterial);
            mandible.position.set(xOffset, 0.4, 0.9);
            mandible.rotation.x = Math.PI / 2;
            mandible.rotation.z = xOffset > 0 ? 0.3 : -0.3;
            antGroup.add(mandible);
        });
    }

    addAntAntennae(antGroup) {
        const antennaGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.35, 6);
        const antennaMaterial = new THREE.MeshStandardMaterial({ color: 0x661111 });
        const antennaTipGeometry = new THREE.SphereGeometry(0.04, 6, 4);

        [-0.1, 0.1].forEach((xOffset) => {
            const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
            antenna.position.set(xOffset, 0.85, 0.7);
            antenna.rotation.x = Math.PI / 6;
            antenna.rotation.z = xOffset > 0 ? -0.3 : 0.3;
            antGroup.add(antenna);

            const tip = new THREE.Mesh(antennaTipGeometry, antennaMaterial);
            tip.position.set(xOffset * 1.3, 0.98, 0.82);
            antGroup.add(tip);
        });
    }

    addAntLegs(antGroup) {
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
    }

    /**
     * Spawn an enemy at a random edge position
     */
    spawnEnemy() {
        const enemy = this.createEnemyAnt();

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
        this.scene.add(enemy);
        this.enemies.push(enemy);

        return enemy;
    }

    /**
     * Initialize enemies at game start
     */
    initEnemies(count) {
        for (let i = 0; i < count; i++) {
            this.spawnEnemy();
        }
    }

    /**
     * Update enemy AI - chase the player
     */
    updateEnemies(playerPos, deltaTime, currentTime, settings) {
        const currentSpeed = settings.enemySpeed;

        this.enemies.forEach(enemy => {
            // Direction to player
            const direction = new THREE.Vector3();
            direction.subVectors(playerPos, enemy.position);
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
    }

    /**
     * Get enemies array
     */
    getEnemies() {
        return this.enemies;
    }

    // ============================================
    // BEE SYSTEM
    // ============================================

    /**
     * Create a flying bee enemy (yellow/black, flies above ground)
     */
    createBee() {
        const beeGroup = new THREE.Group();

        this.addBeeBody(beeGroup);
        this.addBeeStripes(beeGroup);
        this.addBeeHead(beeGroup);
        this.addBeeEyes(beeGroup);
        this.addBeeStinger(beeGroup);
        this.addBeeWings(beeGroup);

        // Store wing references for animation
        beeGroup.userData.wings = beeGroup.children.filter(child => child.userData.wingIndex !== undefined);
        beeGroup.userData.wingTime = Math.random() * Math.PI * 2;

        return beeGroup;
    }

    addBeeBody(beeGroup) {
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
    }

    addBeeStripes(beeGroup) {
        const stripeGeometry = new THREE.TorusGeometry(0.38, 0.06, 8, 16);
        const stripeMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });

        [-0.15, 0.05, 0.25].forEach(zPos => {
            const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
            stripe.position.set(0, 0, zPos);
            stripe.rotation.y = Math.PI / 2;
            beeGroup.add(stripe);
        });
    }

    addBeeHead(beeGroup) {
        const headGeometry = new THREE.SphereGeometry(0.25, 12, 10);
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 0.05, 0.55);
        head.castShadow = true;
        beeGroup.add(head);
    }

    addBeeEyes(beeGroup) {
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
    }

    addBeeStinger(beeGroup) {
        const stingerGeometry = new THREE.ConeGeometry(0.05, 0.3, 6);
        const stingerMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const stinger = new THREE.Mesh(stingerGeometry, stingerMaterial);
        stinger.position.set(0, 0, -0.55);
        stinger.rotation.x = Math.PI / 2;
        beeGroup.add(stinger);
    }

    addBeeWings(beeGroup) {
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
    }

    /**
     * Spawn a bee at a random position
     */
    spawnBee() {
        const bee = this.createBee();

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

        this.scene.add(bee);
        this.bees.push(bee);

        return bee;
    }

    /**
     * Update bee AI - circle around and occasionally dive bomb
     */
    updateBees(playerPos, deltaTime, currentTime) {
        const BEE_SPEED = 0.06;

        this.bees.forEach(bee => {
            const distToPlayer = bee.position.distanceTo(playerPos);

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
            dirToPlayer.subVectors(playerPos, bee.position);
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

    /**
     * Spawn bees at higher difficulty levels
     */
    checkBeeSpawn(currentLevel, currentTime) {
        // Bees only appear at level 3+, capped at 8 max bees
        const maxBees = Math.min(8, currentLevel - 1);

        // Level-specific spawn rates
        let spawnChance = 0.001; // Base spawn chance
        if (currentLevel === 3) {
            spawnChance = 0.0015; // 50% more frequent at level 3
        } else if (currentLevel === 4) {
            spawnChance = 0.002; // 100% more frequent at level 4
        } else if (currentLevel >= 5) {
            spawnChance = 0.0025; // Even more frequent at higher levels
        }

        if (currentLevel >= 3 && this.bees.length < maxBees) {
            // Chance to spawn bee based on level
            if (Math.random() < spawnChance) {
                this.spawnBee();
            }
        }
    }

    /**
     * Get bees array
     */
    getBees() {
        return this.bees;
    }
}

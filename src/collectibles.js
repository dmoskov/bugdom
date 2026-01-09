/**
 * COLLECTIBLES.JS
 * Port of collectible items system from Jorio's Bugdom C implementation
 * Source: https://github.com/jorio/Bugdom
 *
 * This module provides collectible items including power-ups, health items,
 * keys, coins, and other pickups found throughout the game world.
 */

import * as THREE from 'three';

// ============================================
// BASE COLLECTIBLE CLASS
// ============================================

export class Collectible {
    constructor(scene, position, type) {
        this.scene = scene;
        this.type = type;
        this.mesh = null;
        this.collected = false;
        this.bobPhase = Math.random() * Math.PI * 2;
        this.rotationSpeed = 2.0;
        this.bobHeight = 0.3;
        this.bobSpeed = 2.0;
        this.baseY = position.y;

        this.createMesh(position);
    }

    createMesh(position) {
        // Override in subclasses
    }

    update(deltaTime) {
        if (!this.mesh || this.collected) return;

        // Bob up and down
        this.bobPhase += deltaTime * this.bobSpeed;
        this.mesh.position.y = this.baseY + Math.sin(this.bobPhase) * this.bobHeight;

        // Rotate
        this.mesh.rotation.y += deltaTime * this.rotationSpeed;
    }

    checkCollision(player, collectRadius = 1.0) {
        if (this.collected || !this.mesh) return false;

        const distance = this.mesh.position.distanceTo(player.position);
        if (distance < collectRadius) {
            this.onCollect(player);
            return true;
        }
        return false;
    }

    onCollect(player) {
        this.collected = true;
        // Override in subclasses for specific effects
    }

    remove() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
    }
}

// ============================================
// MUSHROOM POWER-UPS
// Three types: Health, Speed, Invincibility
// ============================================

export class MushroomPowerUp extends Collectible {
    constructor(scene, position, mushroomType = 'health') {
        super(scene, position, 'mushroom');
        this.mushroomType = mushroomType; // 'health', 'speed', 'invincibility'
    }

    createMesh(position) {
        const mushroomGroup = new THREE.Group();

        // Mushroom cap (dome)
        const capGeometry = new THREE.SphereGeometry(0.4, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        let capColor, spotColor;

        switch (this.mushroomType) {
            case 'health':
                capColor = 0xff3333; // Red mushroom - health restore
                spotColor = 0xffffff;
                break;
            case 'speed':
                capColor = 0x3333ff; // Blue mushroom - speed boost
                spotColor = 0xffff00;
                break;
            case 'invincibility':
                capColor = 0xffaa00; // Orange mushroom - invincibility
                spotColor = 0xffffff;
                break;
        }

        const capMaterial = new THREE.MeshStandardMaterial({
            color: capColor,
            roughness: 0.5,
            metalness: 0.1
        });
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.castShadow = true;
        mushroomGroup.add(cap);

        // White spots on cap
        const spotGeometry = new THREE.SphereGeometry(0.08, 8, 6);
        const spotMaterial = new THREE.MeshStandardMaterial({ color: spotColor });

        const spotPositions = [
            { x: 0, y: 0.35, z: 0 },
            { x: 0.2, y: 0.25, z: 0.1 },
            { x: -0.2, y: 0.25, z: 0.1 },
            { x: 0, y: 0.2, z: 0.3 },
            { x: 0.15, y: 0.15, z: -0.2 },
            { x: -0.15, y: 0.15, z: -0.2 }
        ];

        spotPositions.forEach(pos => {
            const spot = new THREE.Mesh(spotGeometry, spotMaterial);
            spot.position.set(pos.x, pos.y, pos.z);
            mushroomGroup.add(spot);
        });

        // Mushroom stem
        const stemGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.5, 12);
        const stemMaterial = new THREE.MeshStandardMaterial({
            color: 0xeeeecc,
            roughness: 0.7
        });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = -0.25;
        stem.castShadow = true;
        mushroomGroup.add(stem);

        // Glow effect
        const glowGeometry = new THREE.SphereGeometry(0.5, 16, 12);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: capColor,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        mushroomGroup.add(glow);

        mushroomGroup.position.copy(position);
        this.mesh = mushroomGroup;
        this.mesh.userData.collectible = this;
        this.scene.add(mushroomGroup);
    }

    onCollect(player) {
        super.onCollect(player);

        switch (this.mushroomType) {
            case 'health':
                // Restore 50 health
                if (player.userData.health !== undefined) {
                    player.userData.health = Math.min(100, player.userData.health + 50);
                }
                break;
            case 'speed':
                // Speed boost for 10 seconds
                player.userData.speedBoost = 10.0;
                player.userData.speedMultiplier = 1.5;
                break;
            case 'invincibility':
                // Invincibility for 8 seconds
                player.userData.invincible = 8.0;
                break;
        }

        // Create collection effect
        this.createCollectEffect();
    }

    createCollectEffect() {
        // Sparkle effect on collection
        if (window.particleEffects) {
            window.particleEffects.createSparks(this.mesh.position, 15, 0xffff00);
        }
    }
}

// ============================================
// KEYS
// Five different colored keys for doors
// ============================================

export class Key extends Collectible {
    constructor(scene, position, color = 'red') {
        super(scene, position, 'key');
        this.keyColor = color; // 'red', 'blue', 'green', 'yellow', 'purple'
    }

    createMesh(position) {
        const keyGroup = new THREE.Group();

        const colorMap = {
            'red': 0xff0000,
            'blue': 0x0000ff,
            'green': 0x00ff00,
            'yellow': 0xffff00,
            'purple': 0xff00ff
        };

        const keyColorValue = colorMap[this.keyColor] || 0xcccccc;

        // Key shaft
        const shaftGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8);
        const keyMaterial = new THREE.MeshStandardMaterial({
            color: keyColorValue,
            metalness: 0.8,
            roughness: 0.2
        });
        const shaft = new THREE.Mesh(shaftGeometry, keyMaterial);
        shaft.rotation.z = Math.PI / 2;
        shaft.castShadow = true;
        keyGroup.add(shaft);

        // Key head (ring)
        const headGeometry = new THREE.TorusGeometry(0.15, 0.05, 8, 12);
        const head = new THREE.Mesh(headGeometry, keyMaterial);
        head.position.x = -0.45;
        head.castShadow = true;
        keyGroup.add(head);

        // Key teeth
        const toothGeometry = new THREE.BoxGeometry(0.1, 0.08, 0.05);
        const tooth1 = new THREE.Mesh(toothGeometry, keyMaterial);
        tooth1.position.set(0.35, -0.06, 0);
        keyGroup.add(tooth1);

        const tooth2 = new THREE.Mesh(toothGeometry, keyMaterial);
        tooth2.position.set(0.25, -0.06, 0);
        keyGroup.add(tooth2);

        const tooth3 = new THREE.Mesh(toothGeometry, keyMaterial);
        tooth3.position.set(0.15, -0.06, 0);
        keyGroup.add(tooth3);

        // Glow
        const glowGeometry = new THREE.SphereGeometry(0.3, 12, 10);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: keyColorValue,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        keyGroup.add(glow);

        keyGroup.position.copy(position);
        this.mesh = keyGroup;
        this.mesh.userData.collectible = this;
        this.scene.add(keyGroup);
    }

    onCollect(player) {
        super.onCollect(player);

        // Add key to player's inventory
        if (!player.userData.keys) {
            player.userData.keys = {};
        }
        player.userData.keys[this.keyColor] = true;

        this.createCollectEffect();
    }

    createCollectEffect() {
        if (window.particleEffects) {
            const colorMap = {
                'red': 0xff0000,
                'blue': 0x0000ff,
                'green': 0x00ff00,
                'yellow': 0xffff00,
                'purple': 0xff00ff
            };
            window.particleEffects.createBurst(this.mesh.position, 20, colorMap[this.keyColor]);
        }
    }
}

// ============================================
// COINS / BONUS POINTS
// ============================================

export class Coin extends Collectible {
    constructor(scene, position, value = 1) {
        super(scene, position, 'coin');
        this.value = value; // Point value
        this.rotationSpeed = 3.0; // Coins spin faster
    }

    createMesh(position) {
        const coinGroup = new THREE.Group();

        // Coin disc
        const coinGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.08, 16);
        const coinMaterial = new THREE.MeshStandardMaterial({
            color: 0xffdd00,
            metalness: 0.9,
            roughness: 0.1
        });
        const coin = new THREE.Mesh(coinGeometry, coinMaterial);
        coin.rotation.x = Math.PI / 2;
        coin.castShadow = true;
        coinGroup.add(coin);

        // Emblem on coin (star shape approximation)
        const emblemGeometry = new THREE.CircleGeometry(0.15, 5);
        const emblemMaterial = new THREE.MeshStandardMaterial({
            color: 0xffaa00,
            metalness: 0.7,
            roughness: 0.3
        });
        const emblem = new THREE.Mesh(emblemGeometry, emblemMaterial);
        emblem.position.z = 0.05;
        coinGroup.add(emblem);

        const emblem2 = new THREE.Mesh(emblemGeometry, emblemMaterial);
        emblem2.position.z = -0.05;
        emblem2.rotation.z = Math.PI;
        coinGroup.add(emblem2);

        coinGroup.position.copy(position);
        this.mesh = coinGroup;
        this.mesh.userData.collectible = this;
        this.scene.add(coinGroup);
    }

    onCollect(player) {
        super.onCollect(player);

        // Add coins to player score
        if (player.userData.coins === undefined) {
            player.userData.coins = 0;
        }
        player.userData.coins += this.value;

        this.createCollectEffect();
    }

    createCollectEffect() {
        if (window.particleEffects) {
            window.particleEffects.createSparks(this.mesh.position, 10, 0xffdd00);
        }
    }
}

// ============================================
// BERRIES / HEALTH RESTORE
// Small health pickup
// ============================================

export class Berry extends Collectible {
    constructor(scene, position, berryType = 'red') {
        super(scene, position, 'berry');
        this.berryType = berryType;
        this.bobHeight = 0.15; // Less bob than larger items
    }

    createMesh(position) {
        const berryGroup = new THREE.Group();

        const colorMap = {
            'red': 0xff3333,
            'blue': 0x3333ff,
            'purple': 0x9933ff,
            'green': 0x33ff33
        };

        const berryColor = colorMap[this.berryType] || 0xff3333;

        // Berry body
        const berryGeometry = new THREE.SphereGeometry(0.15, 12, 10);
        const berryMaterial = new THREE.MeshStandardMaterial({
            color: berryColor,
            roughness: 0.3,
            metalness: 0.1
        });
        const berry = new THREE.Mesh(berryGeometry, berryMaterial);
        berry.castShadow = true;
        berryGroup.add(berry);

        // Stem
        const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 6);
        const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x226622 });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 0.15;
        berryGroup.add(stem);

        // Leaf
        const leafGeometry = new THREE.CircleGeometry(0.08, 3);
        const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x33aa33 });
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        leaf.position.set(0.08, 0.2, 0);
        leaf.rotation.z = -Math.PI / 4;
        berryGroup.add(leaf);

        berryGroup.position.copy(position);
        this.mesh = berryGroup;
        this.mesh.userData.collectible = this;
        this.scene.add(berryGroup);
    }

    onCollect(player) {
        super.onCollect(player);

        // Small health restore (10 points)
        if (player.userData.health !== undefined) {
            player.userData.health = Math.min(100, player.userData.health + 10);
        }

        this.createCollectEffect();
    }

    createCollectEffect() {
        if (window.particleEffects) {
            window.particleEffects.createDustPuff(this.mesh.position, 8, 0xff9999);
        }
    }
}

// ============================================
// BUDDY BUG / EXTRA LIFE
// ============================================

export class BuddyBug extends Collectible {
    constructor(scene, position) {
        super(scene, position, 'buddybug');
        this.wingFlapPhase = 0;
    }

    createMesh(position) {
        const bugGroup = new THREE.Group();

        // Body
        const bodyGeometry = new THREE.SphereGeometry(0.2, 12, 10);
        bodyGeometry.scale(1, 0.8, 1.2);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xff8800,
            roughness: 0.5
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        bugGroup.add(body);

        // Head
        const headGeometry = new THREE.SphereGeometry(0.12, 10, 8);
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0xff6600 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 0.05, 0.25);
        bugGroup.add(head);

        // Wings
        const wingGeometry = new THREE.CircleGeometry(0.25, 8);
        const wingMaterial = new THREE.MeshStandardMaterial({
            color: 0xaaeeff,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });

        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-0.15, 0.1, 0);
        leftWing.rotation.y = -Math.PI / 4;
        bugGroup.add(leftWing);
        bugGroup.userData.leftWing = leftWing;

        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(0.15, 0.1, 0);
        rightWing.rotation.y = Math.PI / 4;
        bugGroup.add(rightWing);
        bugGroup.userData.rightWing = rightWing;

        bugGroup.position.copy(position);
        this.mesh = bugGroup;
        this.mesh.userData.collectible = this;
        this.scene.add(bugGroup);
    }

    update(deltaTime) {
        super.update(deltaTime);

        // Flap wings
        this.wingFlapPhase += deltaTime * 15;
        const flap = Math.sin(this.wingFlapPhase) * 0.5;

        if (this.mesh.userData.leftWing) {
            this.mesh.userData.leftWing.rotation.y = -Math.PI / 4 - flap;
        }
        if (this.mesh.userData.rightWing) {
            this.mesh.userData.rightWing.rotation.y = Math.PI / 4 + flap;
        }
    }

    onCollect(player) {
        super.onCollect(player);

        // Grant extra life
        if (player.userData.lives === undefined) {
            player.userData.lives = 3;
        }
        player.userData.lives++;

        this.createCollectEffect();
    }

    createCollectEffect() {
        if (window.particleEffects) {
            window.particleEffects.createBurst(this.mesh.position, 30, 0xff8800);
        }
    }
}

// ============================================
// COLLECTIBLES MANAGER
// ============================================

export class CollectiblesManager {
    constructor(scene) {
        this.scene = scene;
        this.collectibles = [];
    }

    spawnMushroom(position, type = 'health') {
        const mushroom = new MushroomPowerUp(this.scene, position, type);
        this.collectibles.push(mushroom);
        return mushroom;
    }

    spawnKey(position, color = 'red') {
        const key = new Key(this.scene, position, color);
        this.collectibles.push(key);
        return key;
    }

    spawnCoin(position, value = 1) {
        const coin = new Coin(this.scene, position, value);
        this.collectibles.push(coin);
        return coin;
    }

    spawnBerry(position, type = 'red') {
        const berry = new Berry(this.scene, position, type);
        this.collectibles.push(berry);
        return berry;
    }

    spawnBuddyBug(position) {
        const buddy = new BuddyBug(this.scene, position);
        this.collectibles.push(buddy);
        return buddy;
    }

    checkCollisions(playerPosition, collectionRadius) {
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const collectible = this.collectibles[i];
            const distance = playerPosition.distanceTo(collectible.position);

            if (distance < collectionRadius) {
                // Get collectible info before removing
                const collectedInfo = {
                    type: collectible.constructor.name.toLowerCase(),
                    variant: collectible.type || collectible.color || collectible.value || null,
                    position: collectible.position.clone()
                };

                // Map constructor names to expected types
                if (collectible instanceof MushroomPowerUp) {
                    collectedInfo.type = 'mushroom';
                    collectedInfo.variant = collectible.type;
                } else if (collectible instanceof BuddyBug) {
                    collectedInfo.type = 'buddybug';
                } else if (collectible instanceof Coin) {
                    collectedInfo.type = 'coin';
                    collectedInfo.variant = collectible.value;
                } else if (collectible instanceof Key) {
                    collectedInfo.type = 'key';
                    collectedInfo.variant = collectible.color;
                } else if (collectible instanceof Berry) {
                    collectedInfo.type = 'berry';
                    collectedInfo.variant = collectible.type;
                }

                collectible.remove();
                this.collectibles.splice(i, 1);
                return collectedInfo;
            }
        }
        return null;
    }

    update(player, deltaTime) {
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const collectible = this.collectibles[i];

            collectible.update(deltaTime);

            // Check collision with player
            if (collectible.checkCollision(player)) {
                collectible.remove();
                this.collectibles.splice(i, 1);
            }
        }
    }

    removeAll() {
        this.collectibles.forEach(c => c.remove());
        this.collectibles = [];
    }
}

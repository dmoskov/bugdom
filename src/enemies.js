/**
 * ENEMIES.JS
 * Port of enemy systems from Jorio's Bugdom C implementation
 * Source: https://github.com/jorio/Bugdom/tree/master/src/Enemies
 *
 * This module provides enemy AI, behaviors, and attack patterns
 * for various creatures in the game world.
 */

import * as THREE from 'three';

// ============================================
// SPIDER ENEMY SYSTEM
// Ported from: src/Enemies/Enemy_Spider.c
// ============================================

export class Spider {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.state = 'WAITING';
        this.health = 2.0;
        this.damage = 0.15;
        this.webCooldown = 0;
        this.threadLength = 0;
        this.targetPlayer = null;

        // State machine timers
        this.stateTimer = 0;
        this.dropSpeed = 0;

        // Animation parameters
        this.legPhase = 0;
        this.bodyBobPhase = 0;

        // Create the spider mesh
        this.createSpiderMesh();
    }

    createSpiderMesh() {
        const spiderGroup = new THREE.Group();

        // Create body parts
        const body = this.createSpiderBody();
        const head = this.createSpiderHead();
        spiderGroup.add(body);
        spiderGroup.add(head);

        // Add eyes
        this.addSpiderEyes(spiderGroup);

        // Add legs
        const legs = this.createSpiderLegs(spiderGroup);

        spiderGroup.userData.legs = legs;
        spiderGroup.userData.body = body;
        spiderGroup.userData.head = head;

        this.mesh = spiderGroup;
        this.mesh.userData.enemyType = 'spider';
        this.mesh.userData.controller = this;
    }

    createSpiderBody() {
        const bodyGeometry = new THREE.SphereGeometry(0.5, 16, 12);
        bodyGeometry.scale(1.2, 0.8, 1.5); // Elongated spider body
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a, // Black
            roughness: 0.8,
            metalness: 0.1
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.4;
        body.castShadow = true;
        return body;
    }

    createSpiderHead() {
        const headGeometry = new THREE.SphereGeometry(0.35, 12, 10);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a, // Slightly lighter black
            roughness: 0.7,
            metalness: 0.1
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 0.4, 0.7);
        head.castShadow = true;
        return head;
    }

    addSpiderEyes(spiderGroup) {
        const eyeGeometry = new THREE.SphereGeometry(0.05, 6, 4);
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.5
        });

        const eyePositions = [
            { x: -0.15, y: 0.5, z: 0.85 },
            { x: -0.08, y: 0.52, z: 0.88 },
            { x: 0.08, y: 0.52, z: 0.88 },
            { x: 0.15, y: 0.5, z: 0.85 },
            { x: -0.2, y: 0.45, z: 0.75 },
            { x: -0.25, y: 0.42, z: 0.7 },
            { x: 0.2, y: 0.45, z: 0.75 },
            { x: 0.25, y: 0.42, z: 0.7 }
        ];

        eyePositions.forEach(pos => {
            const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            eye.position.set(pos.x, pos.y, pos.z);
            spiderGroup.add(eye);
        });
    }

    createSpiderLegs(spiderGroup) {
        const legs = [];
        const legSegmentGeometry = new THREE.CylinderGeometry(0.03, 0.02, 0.6, 6);
        const legMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });

        const legBasePositions = [
            { x: -0.5, z: 0.4, side: -1, index: 0 },   // Front left
            { x: -0.5, z: 0.15, side: -1, index: 1 },  // Front-mid left
            { x: -0.5, z: -0.15, side: -1, index: 2 }, // Back-mid left
            { x: -0.5, z: -0.4, side: -1, index: 3 },  // Back left
            { x: 0.5, z: 0.4, side: 1, index: 0 },     // Front right
            { x: 0.5, z: 0.15, side: 1, index: 1 },    // Front-mid right
            { x: 0.5, z: -0.15, side: 1, index: 2 },   // Back-mid right
            { x: 0.5, z: -0.4, side: 1, index: 3 }     // Back right
        ];

        legBasePositions.forEach((pos, i) => {
            const legGroup = this.createSpiderLeg(legSegmentGeometry, legMaterial, pos, i);
            spiderGroup.add(legGroup);
            legs.push(legGroup);
        });

        return legs;
    }

    createSpiderLeg(legSegmentGeometry, legMaterial, pos, i) {
        const legGroup = new THREE.Group();

        // Upper leg segment
        const upperLeg = new THREE.Mesh(legSegmentGeometry, legMaterial);
        upperLeg.position.set(0, -0.3, 0);
        upperLeg.rotation.z = pos.side * 0.8;
        upperLeg.rotation.x = 0.3;
        upperLeg.castShadow = true;
        legGroup.add(upperLeg);

        // Lower leg segment
        const lowerLeg = new THREE.Mesh(legSegmentGeometry, legMaterial);
        lowerLeg.position.set(pos.side * 0.4, -0.6, 0.2);
        lowerLeg.rotation.z = pos.side * 1.2;
        lowerLeg.rotation.x = -0.5;
        lowerLeg.castShadow = true;
        legGroup.add(lowerLeg);

        legGroup.position.set(pos.x, 0.4, pos.z);
        legGroup.userData.legIndex = i;
        legGroup.userData.side = pos.side;
        legGroup.userData.baseRotation = legGroup.rotation.clone();

        return legGroup;
    }

    // State: WAITING - Hidden, drops when player approaches
    stateWaiting(player, deltaTime) {
        if (!player) return;

        const distance = this.mesh.position.distanceTo(player.position);

        // Activate when player comes within 700 units (scaled to our world)
        if (distance < 15) {
            this.state = 'DROP';
            this.dropSpeed = 0;
            this.threadLength = 10; // Starting height
            this.mesh.position.y = 10;
        }
    }

    // State: DROP - Descending from above on web thread
    stateDrop(deltaTime) {
        // Accelerate downward with slowing
        this.dropSpeed += 3.0 * deltaTime;
        this.mesh.position.y -= this.dropSpeed * deltaTime;

        // Reached ground
        if (this.mesh.position.y <= 0.4) {
            this.mesh.position.y = 0.4;
            this.state = 'WALKING';
            this.stateTimer = 0;
        }
    }

    // State: WALKING - Moving toward player
    stateWalking(player, deltaTime) {
        if (!player) return;

        const direction = new THREE.Vector3();
        direction.subVectors(player.position, this.mesh.position);
        direction.y = 0; // Only move horizontally
        direction.normalize();

        // Move at 300 units/second (scaled)
        const speed = 2.5;
        this.mesh.position.x += direction.x * speed * deltaTime;
        this.mesh.position.z += direction.z * speed * deltaTime;

        // Face the player
        const angle = Math.atan2(direction.x, direction.z);
        this.mesh.rotation.y = angle;

        // Animate legs
        this.legPhase += deltaTime * 8;
        this.animateLegs();

        // Body bob
        this.bodyBobPhase += deltaTime * 6;
        if (this.mesh.userData.body) {
            this.mesh.userData.body.position.y = 0.4 + Math.sin(this.bodyBobPhase) * 0.05;
        }

        // Check attack range
        const distance = this.mesh.position.distanceTo(player.position);

        // Web attack if in range and cooldown ready
        if (distance < 8 && this.webCooldown <= 0 && !player.userData.isWebbed) {
            this.state = 'SPIT';
            this.webCooldown = 3.0; // 3 second cooldown
            this.stateTimer = 0.5; // Attack animation duration
        }
        // Jump attack if player is already webbed
        else if (distance < 6 && player.userData.isWebbed) {
            this.state = 'JUMP';
            this.stateTimer = 0;
        }

        // Update cooldown
        if (this.webCooldown > 0) {
            this.webCooldown -= deltaTime;
        }
    }

    // State: SPIT - Shooting web at player
    stateSpit(player, deltaTime) {
        this.stateTimer -= deltaTime;

        if (this.stateTimer <= 0.25 && !this.mesh.userData.webShot) {
            // Fire web projectile
            this.shootWeb(player);
            this.mesh.userData.webShot = true;
        }

        if (this.stateTimer <= 0) {
            this.state = 'WALKING';
            this.mesh.userData.webShot = false;
        }
    }

    // State: JUMP - Pouncing at webbed player
    stateJump(player, deltaTime) {
        if (this.stateTimer === 0) {
            // Launch toward player
            const direction = new THREE.Vector3();
            direction.subVectors(player.position, this.mesh.position);
            direction.normalize();

            this.mesh.userData.jumpVelocity = new THREE.Vector3(
                direction.x * 8,
                11, // High vertical jump
                direction.z * 8
            );
            this.stateTimer = 0.01; // Started jump
        }

        // Apply velocity
        if (this.mesh.userData.jumpVelocity) {
            const vel = this.mesh.userData.jumpVelocity;
            this.mesh.position.x += vel.x * deltaTime;
            this.mesh.position.y += vel.y * deltaTime;
            this.mesh.position.z += vel.z * deltaTime;

            // Apply gravity
            vel.y -= 20 * deltaTime;

            // Landed
            if (this.mesh.position.y <= 0.4) {
                this.mesh.position.y = 0.4;
                this.state = 'WALKING';
                this.mesh.userData.jumpVelocity = null;
            }
        }
    }

    // Shoot web projectile at player
    shootWeb(player) {
        if (!this.scene || !player) return;

        const webGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const webMaterial = new THREE.MeshStandardMaterial({
            color: 0xeeeeee,
            transparent: true,
            opacity: 0.8,
            emissive: 0xaaaaaa
        });
        const web = new THREE.Mesh(webGeometry, webMaterial);

        // Position at spider's head
        web.position.copy(this.mesh.position);
        web.position.y += 0.5;

        // Calculate velocity toward player
        const direction = new THREE.Vector3();
        direction.subVectors(player.position, web.position);
        direction.normalize();

        web.userData.velocity = direction.multiplyScalar(15); // Fast projectile
        web.userData.isWeb = true;
        web.userData.lifetime = 3.0; // Disappear after 3 seconds

        this.scene.add(web);

        // Store in scene for update
        if (!this.scene.userData.projectiles) {
            this.scene.userData.projectiles = [];
        }
        this.scene.userData.projectiles.push(web);
    }

    // Animate spider legs with walking motion
    animateLegs() {
        const legs = this.mesh.userData.legs;
        if (!legs) return;

        legs.forEach((leg, i) => {
            const phase = this.legPhase + (i * Math.PI / 4);
            const side = leg.userData.side;

            // Alternate leg raising
            const lift = Math.max(0, Math.sin(phase)) * 0.15;
            leg.position.y = 0.4 + lift;

            // Leg swing
            const swing = Math.sin(phase) * 0.2;
            leg.rotation.y = swing * side;
        });
    }

    // Main update function
    update(player, deltaTime) {
        switch (this.state) {
            case 'WAITING':
                this.stateWaiting(player, deltaTime);
                break;
            case 'DROP':
                this.stateDrop(deltaTime);
                break;
            case 'WALKING':
                this.stateWalking(player, deltaTime);
                break;
            case 'SPIT':
                this.stateSpit(player, deltaTime);
                break;
            case 'JUMP':
                this.stateJump(player, deltaTime);
                break;
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            return true; // Dead
        }
        return false;
    }
}

// ============================================
// SLUG ENEMY SYSTEM
// Ported from: src/Enemies/Enemy_Slug.c
// ============================================

export class Slug {
    constructor(scene, path = null) {
        this.scene = scene;
        this.mesh = null;
        this.health = 1.0;
        this.damage = 0.1;
        this.path = path; // Spline path to follow
        this.pathProgress = 0;
        this.speed = 1.5; // Slower than spider

        // Undulation animation
        this.undulatePhase = 0;

        // Create the slug mesh
        this.createSlugMesh();
    }

    createSlugMesh() {
        const slugGroup = new THREE.Group();

        // Slug body as segmented cylinders for undulation effect
        const segments = 8;
        const segmentRadius = 0.25;
        const segmentHeight = 0.3;

        const bodySegments = [];

        for (let i = 0; i < segments; i++) {
            const segmentGeometry = new THREE.SphereGeometry(segmentRadius, 12, 8);
            segmentGeometry.scale(1, 0.7, 1.2);

            // Color gradient from head (greenish) to tail (darker)
            const colorMix = i / segments;
            const color = new THREE.Color();
            color.setRGB(
                0.2 + colorMix * 0.3,
                0.5 - colorMix * 0.2,
                0.1
            );

            const segmentMaterial = new THREE.MeshStandardMaterial({
                color: color,
                roughness: 0.9,
                metalness: 0.0
            });

            const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
            segment.position.z = -i * (segmentHeight * 0.8);
            segment.position.y = segmentRadius * 0.7;
            segment.castShadow = true;
            segment.userData.segmentIndex = i;

            slugGroup.add(segment);
            bodySegments.push(segment);
        }

        // Head features (on first segment)
        const headSegment = bodySegments[0];

        // Eye stalks
        const eyeStalkGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 6);
        const eyeStalkMaterial = new THREE.MeshStandardMaterial({ color: 0x446622 });
        const eyeGeometry = new THREE.SphereGeometry(0.06, 8, 6);
        const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });

        [-0.12, 0.12].forEach(xOffset => {
            const stalk = new THREE.Mesh(eyeStalkGeometry, eyeStalkMaterial);
            stalk.position.set(xOffset, segmentRadius * 1.2, segmentHeight * 0.3);
            stalk.rotation.x = -0.3;
            slugGroup.add(stalk);

            const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            eye.position.set(xOffset, segmentRadius * 1.4, segmentHeight * 0.4);
            slugGroup.add(eye);
        });

        // Slime trail effect (will be added dynamically)
        slugGroup.userData.bodySegments = bodySegments;
        slugGroup.userData.slimeTimer = 0;

        this.mesh = slugGroup;
        this.mesh.userData.enemyType = 'slug';
        this.mesh.userData.controller = this;

        // Scale up (slugs are big)
        this.mesh.scale.set(2, 2, 2);
    }

    // Update slug movement and animation
    update(player, deltaTime) {
        if (!player) return;

        // Move toward player
        const direction = new THREE.Vector3();
        direction.subVectors(player.position, this.mesh.position);
        direction.y = 0;
        direction.normalize();

        this.mesh.position.x += direction.x * this.speed * deltaTime;
        this.mesh.position.z += direction.z * this.speed * deltaTime;

        // Face direction of movement
        const angle = Math.atan2(direction.x, direction.z);
        this.mesh.rotation.y = angle;

        // Undulation animation
        this.undulatePhase += deltaTime * 3;
        this.animateUndulation();

        // Leave slime trail
        this.mesh.userData.slimeTimer += deltaTime;
        if (this.mesh.userData.slimeTimer > 0.3) {
            this.createSlimeTrail();
            this.mesh.userData.slimeTimer = 0;
        }
    }

    // Animate body undulation
    animateUndulation() {
        const segments = this.mesh.userData.bodySegments;
        if (!segments) return;

        segments.forEach((segment, i) => {
            // Sinusoidal wave along body
            const phase = this.undulatePhase + i * 1.6;
            const wave = Math.sin(phase) * 0.3;

            // Apply vertical wave motion
            segment.position.y = segment.geometry.parameters.radius * 0.7 + wave * 0.15;

            // Slight rotation for more organic feel
            segment.rotation.x = wave * 0.1;
        });
    }

    // Create slime trail particle
    createSlimeTrail() {
        if (!this.scene) return;

        const slimeGeometry = new THREE.CircleGeometry(0.3, 8);
        const slimeMaterial = new THREE.MeshBasicMaterial({
            color: 0x88aa44,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        const slime = new THREE.Mesh(slimeGeometry, slimeMaterial);

        slime.position.copy(this.mesh.position);
        slime.position.y = 0.01; // Just above ground
        slime.rotation.x = -Math.PI / 2; // Lay flat

        slime.userData.lifetime = 5.0; // Fade over 5 seconds
        slime.userData.maxLifetime = 5.0;
        slime.userData.isSlimeTrail = true;

        this.scene.add(slime);

        // Store for cleanup
        if (!this.scene.userData.slimeTrails) {
            this.scene.userData.slimeTrails = [];
        }
        this.scene.userData.slimeTrails.push(slime);
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            return true; // Dead
        }
        return false;
    }
}

// ============================================
// ENEMY MANAGER
// ============================================

export class EnemyManager {
    constructor(scene) {
        this.scene = scene;
        this.enemies = [];
        this.spiders = [];
        this.slugs = [];
    }

    spawnSpider(position) {
        const spider = new Spider(this.scene);
        spider.mesh.position.copy(position);
        this.scene.add(spider.mesh);
        this.enemies.push(spider);
        this.spiders.push(spider);
        return spider;
    }

    spawnSlug(position) {
        const slug = new Slug(this.scene);
        slug.mesh.position.copy(position);
        this.scene.add(slug.mesh);
        this.enemies.push(slug);
        this.slugs.push(slug);
        return slug;
    }

    update(player, deltaTime) {
        // Update all enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(player, deltaTime);

            // Remove dead enemies
            if (enemy.health <= 0) {
                this.scene.remove(enemy.mesh);
                this.enemies.splice(i, 1);

                // Remove from specific arrays
                const spiderIdx = this.spiders.indexOf(enemy);
                if (spiderIdx >= 0) this.spiders.splice(spiderIdx, 1);

                const slugIdx = this.slugs.indexOf(enemy);
                if (slugIdx >= 0) this.slugs.splice(slugIdx, 1);
            }
        }

        // Update projectiles (web shots)
        if (this.scene.userData.projectiles) {
            for (let i = this.scene.userData.projectiles.length - 1; i >= 0; i--) {
                const proj = this.scene.userData.projectiles[i];

                if (proj.userData.velocity) {
                    proj.position.x += proj.userData.velocity.x * deltaTime;
                    proj.position.y += proj.userData.velocity.y * deltaTime;
                    proj.position.z += proj.userData.velocity.z * deltaTime;
                }

                proj.userData.lifetime -= deltaTime;

                // Check collision with player
                if (proj.userData.isWeb && player) {
                    const dist = proj.position.distanceTo(player.position);
                    if (dist < 1.0 && !player.userData.isWebbed) {
                        // Web hit!
                        this.webPlayer(player);
                        this.scene.remove(proj);
                        this.scene.userData.projectiles.splice(i, 1);
                        continue;
                    }
                }

                // Remove expired projectiles
                if (proj.userData.lifetime <= 0) {
                    this.scene.remove(proj);
                    this.scene.userData.projectiles.splice(i, 1);
                }
            }
        }

        // Update slime trails
        if (this.scene.userData.slimeTrails) {
            for (let i = this.scene.userData.slimeTrails.length - 1; i >= 0; i--) {
                const slime = this.scene.userData.slimeTrails[i];
                slime.userData.lifetime -= deltaTime;

                // Fade out
                const lifeRatio = slime.userData.lifetime / slime.userData.maxLifetime;
                slime.material.opacity = 0.4 * lifeRatio;

                if (slime.userData.lifetime <= 0) {
                    this.scene.remove(slime);
                    this.scene.userData.slimeTrails.splice(i, 1);
                }
            }
        }
    }

    webPlayer(player) {
        player.userData.isWebbed = true;
        player.userData.webTimer = 2.5; // 2.5 seconds paralysis

        // Create web sphere effect around player
        const webGeometry = new THREE.IcosahedronGeometry(1.5, 1);
        const webMaterial = new THREE.MeshBasicMaterial({
            color: 0xeeeeee,
            transparent: true,
            opacity: 0.3,
            wireframe: true
        });
        const webSphere = new THREE.Mesh(webGeometry, webMaterial);
        webSphere.position.copy(player.position);

        this.scene.add(webSphere);
        player.userData.webSphere = webSphere;
    }

    checkSpiderCollisions(playerPosition, collisionRadius) {
        for (const spider of this.spiders) {
            if (!spider.mesh) continue;
            const distance = playerPosition.distanceTo(spider.mesh.position);
            if (distance < collisionRadius) {
                return { enemy: spider, type: 'spider', damage: spider.damage || 15 };
            }
        }
        return null;
    }

    checkSlugCollisions(playerPosition, collisionRadius) {
        for (const slug of this.slugs) {
            if (!slug.mesh) continue;
            const distance = playerPosition.distanceTo(slug.mesh.position);
            if (distance < collisionRadius) {
                return { enemy: slug, type: 'slug', damage: slug.damage || 5 };
            }
        }
        return null;
    }

    removeAll() {
        this.enemies.forEach(enemy => {
            this.scene.remove(enemy.mesh);
        });
        this.enemies = [];
        this.spiders = [];
        this.slugs = [];
    }
}

/**
 * PARTICLES.JS
 * Port of particle effects system from Jorio's Bugdom C implementation
 * Source: https://github.com/jorio/Bugdom/tree/master/src/Items/Effects.c
 *
 * This module provides visual effects including sparks, dust, splashes,
 * ripples, and other particle-based effects.
 */

import * as THREE from 'three';

// ============================================
// PARTICLE GROUP SYSTEM
// Ported from: src/Items/Effects.c
// ============================================

export class ParticleGroup {
    constructor(maxParticles = 200) {
        this.particles = [];
        this.maxParticles = maxParticles;
        this.type = 'standard';
        this.geometry = null;
        this.material = null;
        this.mesh = null;
    }

    addParticle(config) {
        if (this.particles.length >= this.maxParticles) {
            return null;
        }

        const particle = {
            position: config.position.clone(),
            velocity: config.velocity.clone(),
            color: config.color || new THREE.Color(0xffffff),
            size: config.size || 0.1,
            lifetime: config.lifetime || 1.0,
            maxLifetime: config.lifetime || 1.0,
            gravity: config.gravity !== undefined ? config.gravity : -9.8,
            fadeRate: config.fadeRate || 1.0,
            alpha: 1.0,
            scale: 1.0,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 4,
            bounces: config.bounces || false
        };

        this.particles.push(particle);
        return particle;
    }

    update(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            // Update position
            p.position.x += p.velocity.x * deltaTime;
            p.position.y += p.velocity.y * deltaTime;
            p.position.z += p.velocity.z * deltaTime;

            // Apply gravity
            p.velocity.y += p.gravity * deltaTime;

            // Ground collision with bounce
            if (p.bounces && p.position.y < 0.1) {
                p.position.y = 0.1;
                p.velocity.y *= -0.5; // Bounce with energy loss
                p.velocity.x *= 0.8; // Friction
                p.velocity.z *= 0.8;
            }

            // Update lifetime and fade
            p.lifetime -= deltaTime;
            p.alpha -= p.fadeRate * deltaTime;

            // Update rotation
            p.rotation += p.rotationSpeed * deltaTime;

            // Remove dead particles
            if (p.lifetime <= 0 || p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    isEmpty() {
        return this.particles.length === 0;
    }
}

// ============================================
// PARTICLE EFFECTS MANAGER
// ============================================

export class ParticleEffectsManager {
    constructor(scene) {
        this.scene = scene;
        this.particleGroups = [];
        this.maxGroups = 50;

        // Shared geometries for performance
        this.sparkGeometry = new THREE.PlaneGeometry(0.1, 0.1);
        this.dustGeometry = new THREE.PlaneGeometry(0.3, 0.3);
        this.splashGeometry = new THREE.PlaneGeometry(0.2, 0.2);
    }

    // Create falling sparks effect
    createSparks(position, count = 20, color = 0xffaa00) {
        const group = new ParticleGroup(count);
        group.type = 'sparks';

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            const upSpeed = 3 + Math.random() * 5;

            group.addParticle({
                position: position.clone(),
                velocity: new THREE.Vector3(
                    Math.cos(angle) * speed,
                    upSpeed,
                    Math.sin(angle) * speed
                ),
                color: new THREE.Color(color),
                size: 0.08 + Math.random() * 0.12,
                lifetime: 0.8 + Math.random() * 0.6,
                gravity: -15,
                fadeRate: 1.2,
                bounces: true
            });
        }

        this.particleGroups.push(group);
        this.createSparkMeshes(group);
        return group;
    }

    // Create dust puff effect
    createDustPuff(position, count = 15, color = 0xccaa88) {
        const group = new ParticleGroup(count);
        group.type = 'dust';

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 1.5;

            group.addParticle({
                position: position.clone(),
                velocity: new THREE.Vector3(
                    Math.cos(angle) * speed,
                    0.5 + Math.random() * 1,
                    Math.sin(angle) * speed
                ),
                color: new THREE.Color(color),
                size: 0.2 + Math.random() * 0.3,
                lifetime: 1.0 + Math.random() * 0.8,
                gravity: -2,
                fadeRate: 0.6
            });
        }

        this.particleGroups.push(group);
        this.createDustMeshes(group);
        return group;
    }

    // Create splash effect (water, etc.)
    createSplash(position, count = 30, color = 0x4488ff) {
        const group = new ParticleGroup(count);
        group.type = 'splash';

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            const upSpeed = 4 + Math.random() * 6;

            group.addParticle({
                position: position.clone(),
                velocity: new THREE.Vector3(
                    Math.cos(angle) * speed,
                    upSpeed,
                    Math.sin(angle) * speed
                ),
                color: new THREE.Color(color),
                size: 0.1 + Math.random() * 0.15,
                lifetime: 1.2 + Math.random() * 0.6,
                gravity: -12,
                fadeRate: 0.8,
                bounces: false
            });
        }

        this.particleGroups.push(group);
        this.createSplashMeshes(group);
        return group;
    }

    // Create burst effect (explosion-like)
    createBurst(position, count = 40, color = 0xff6600) {
        const group = new ParticleGroup(count);
        group.type = 'burst';

        for (let i = 0; i < count; i++) {
            // Spherical distribution
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.acos(2 * Math.random() - 1);
            const speed = 4 + Math.random() * 6;

            const vx = speed * Math.sin(theta) * Math.cos(phi);
            const vy = speed * Math.sin(theta) * Math.sin(phi);
            const vz = speed * Math.cos(theta);

            group.addParticle({
                position: position.clone(),
                velocity: new THREE.Vector3(vx, Math.abs(vy), vz),
                color: new THREE.Color(color),
                size: 0.12 + Math.random() * 0.18,
                lifetime: 0.6 + Math.random() * 0.5,
                gravity: -10,
                fadeRate: 1.5
            });
        }

        this.particleGroups.push(group);
        this.createBurstMeshes(group);
        return group;
    }

    // Create trail effect (following an object)
    createTrail(position, velocity, color = 0xffff00, size = 0.15) {
        const group = new ParticleGroup(10);
        group.type = 'trail';

        group.addParticle({
            position: position.clone(),
            velocity: velocity.clone().multiplyScalar(-0.3), // Opposite direction
            color: new THREE.Color(color),
            size: size,
            lifetime: 0.5,
            gravity: 0,
            fadeRate: 2.0
        });

        this.particleGroups.push(group);
        this.createTrailMeshes(group);
        return group;
    }

    // Create spark meshes for rendering
    createSparkMeshes(group) {
        const instancedMesh = new THREE.InstancedMesh(
            this.sparkGeometry,
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            }),
            group.maxParticles
        );

        group.mesh = instancedMesh;
        this.scene.add(instancedMesh);
    }

    // Create dust meshes
    createDustMeshes(group) {
        const instancedMesh = new THREE.InstancedMesh(
            this.dustGeometry,
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.6,
                depthWrite: false
            }),
            group.maxParticles
        );

        group.mesh = instancedMesh;
        this.scene.add(instancedMesh);
    }

    // Create splash meshes
    createSplashMeshes(group) {
        const instancedMesh = new THREE.InstancedMesh(
            this.splashGeometry,
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            }),
            group.maxParticles
        );

        group.mesh = instancedMesh;
        this.scene.add(instancedMesh);
    }

    // Create burst meshes
    createBurstMeshes(group) {
        const geometry = new THREE.PlaneGeometry(0.15, 0.15);
        const instancedMesh = new THREE.InstancedMesh(
            geometry,
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            }),
            group.maxParticles
        );

        group.mesh = instancedMesh;
        this.scene.add(instancedMesh);
    }

    // Create trail meshes
    createTrailMeshes(group) {
        const geometry = new THREE.PlaneGeometry(0.2, 0.2);
        const instancedMesh = new THREE.InstancedMesh(
            geometry,
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            }),
            group.maxParticles
        );

        group.mesh = instancedMesh;
        this.scene.add(instancedMesh);
    }

    // Update all particle groups
    update(deltaTime, camera) {
        for (let i = this.particleGroups.length - 1; i >= 0; i--) {
            const group = this.particleGroups[i];

            // Update particles
            group.update(deltaTime);

            // Update instanced mesh
            if (group.mesh) {
                this.updateInstancedMesh(group, camera);
            }

            // Remove empty groups
            if (group.isEmpty()) {
                if (group.mesh) {
                    this.scene.remove(group.mesh);
                    group.mesh.geometry.dispose();
                    group.mesh.material.dispose();
                }
                this.particleGroups.splice(i, 1);
            }
        }
    }

    // Update instanced mesh with particle data
    updateInstancedMesh(group, camera) {
        const mesh = group.mesh;
        const matrix = new THREE.Matrix4();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();

        group.particles.forEach((p, i) => {
            // Billboard particles to face camera
            quaternion.copy(camera.quaternion);

            // Apply rotation
            const rotQuat = new THREE.Quaternion();
            rotQuat.setFromAxisAngle(new THREE.Vector3(0, 0, 1), p.rotation);
            quaternion.multiply(rotQuat);

            // Scale based on size and lifetime
            const lifeRatio = p.lifetime / p.maxLifetime;
            const currentSize = p.size * (0.5 + lifeRatio * 0.5);
            scale.set(currentSize, currentSize, currentSize);

            // Build matrix
            matrix.compose(p.position, quaternion, scale);
            mesh.setMatrixAt(i, matrix);

            // Set color and opacity
            const color = new THREE.Color();
            color.copy(p.color);
            mesh.setColorAt(i, color);
        });

        // Hide unused instances
        for (let i = group.particles.length; i < group.maxParticles; i++) {
            scale.set(0, 0, 0);
            matrix.compose(new THREE.Vector3(0, -1000, 0), quaternion, scale);
            mesh.setMatrixAt(i, matrix);
        }

        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) {
            mesh.instanceColor.needsUpdate = true;
        }

        // Update overall opacity
        if (group.particles.length > 0) {
            const avgAlpha = group.particles.reduce((sum, p) => sum + p.alpha, 0) / group.particles.length;
            mesh.material.opacity = Math.max(0, Math.min(1, avgAlpha));
        }
    }

    // Clean up all particle groups
    removeAll() {
        this.particleGroups.forEach(group => {
            if (group.mesh) {
                this.scene.remove(group.mesh);
                group.mesh.geometry.dispose();
                group.mesh.material.dispose();
            }
        });
        this.particleGroups = [];
    }
}

// ============================================
// RIPPLE EFFECTS MANAGER
// Ported from: Effects.c ripple system
// ============================================

export class RippleManager {
    constructor(scene) {
        this.scene = scene;
        this.ripples = [];
        this.maxRipples = 20;
    }

    // Create a ground ripple effect
    createRipple(position, maxRadius = 3, duration = 1.5, color = 0xffffff) {
        if (this.ripples.length >= this.maxRipples) {
            // Remove oldest ripple
            const oldest = this.ripples.shift();
            this.scene.remove(oldest.mesh);
        }

        const rippleGeometry = new THREE.RingGeometry(0.1, 0.2, 32);
        const rippleMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        const ripple = new THREE.Mesh(rippleGeometry, rippleMaterial);
        ripple.rotation.x = -Math.PI / 2; // Lay flat on ground
        ripple.position.copy(position);
        ripple.position.y = 0.05; // Just above ground

        const rippleData = {
            mesh: ripple,
            age: 0,
            duration: duration,
            maxRadius: maxRadius,
            initialOpacity: 0.8
        };

        this.ripples.push(rippleData);
        this.scene.add(ripple);

        return rippleData;
    }

    // Update all ripples
    update(deltaTime) {
        for (let i = this.ripples.length - 1; i >= 0; i--) {
            const ripple = this.ripples[i];
            ripple.age += deltaTime;

            const progress = ripple.age / ripple.duration;

            if (progress >= 1.0) {
                // Ripple finished
                this.scene.remove(ripple.mesh);
                ripple.mesh.geometry.dispose();
                ripple.mesh.material.dispose();
                this.ripples.splice(i, 1);
            } else {
                // Expand ripple
                const currentRadius = ripple.maxRadius * progress;
                ripple.mesh.scale.set(currentRadius, currentRadius, 1);

                // Fade out (transparency decreases at 0.8 per frame in original)
                ripple.mesh.material.opacity = ripple.initialOpacity * (1 - progress);
            }
        }
    }

    // Clean up all ripples
    removeAll() {
        this.ripples.forEach(ripple => {
            this.scene.remove(ripple.mesh);
            ripple.mesh.geometry.dispose();
            ripple.mesh.material.dispose();
        });
        this.ripples = [];
    }
}


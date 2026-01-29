/**
 * INTEGRATION_EXAMPLE.JS
 * Example code showing how to integrate the ported enemy, particle, and collectible systems
 * into the main game.
 *
 * This file demonstrates proper usage patterns and can be used as a reference
 * when integrating these systems into main.js.
 */

import * as THREE from 'three';
import { Spider, Slug, EnemyManager } from './enemies.js';
import { ParticleEffectsManager, RippleManager, GravitoidSystem } from './particles.js';
import { CollectiblesManager } from './collectibles.js';

// ============================================
// INITIALIZATION EXAMPLE
// ============================================

export function initializeGameSystems(scene, player) {
    // Initialize managers
    const enemyManager = new EnemyManager(scene);
    const particleEffects = new ParticleEffectsManager(scene);
    const rippleManager = new RippleManager(scene);
    const collectiblesManager = new CollectiblesManager(scene);

    // Make particle effects globally accessible for visual feedback
    window.particleEffects = particleEffects;

    // Spawn some test enemies
    enemyManager.spawnSpider(new THREE.Vector3(10, 10, 10)); // Spider starts high, waiting
    enemyManager.spawnSlug(new THREE.Vector3(-15, 0, 5));
    enemyManager.spawnSlug(new THREE.Vector3(15, 0, -10));

    // Spawn collectibles around the level
    collectiblesManager.spawnMushroom(new THREE.Vector3(5, 1, 5), 'health');
    collectiblesManager.spawnMushroom(new THREE.Vector3(-8, 1, 3), 'speed');
    collectiblesManager.spawnMushroom(new THREE.Vector3(12, 1, -7), 'invincibility');

    // Spawn keys of different colors
    collectiblesManager.spawnKey(new THREE.Vector3(8, 1, -3), 'red');
    collectiblesManager.spawnKey(new THREE.Vector3(-12, 1, 8), 'blue');
    collectiblesManager.spawnKey(new THREE.Vector3(0, 1, 15), 'green');

    // Spawn coins
    for (let i = 0; i < 10; i++) {
        const x = (Math.random() - 0.5) * 30;
        const z = (Math.random() - 0.5) * 30;
        collectiblesManager.spawnCoin(new THREE.Vector3(x, 1, z));
    }

    // Spawn berries
    for (let i = 0; i < 5; i++) {
        const x = (Math.random() - 0.5) * 25;
        const z = (Math.random() - 0.5) * 25;
        collectiblesManager.spawnBerry(new THREE.Vector3(x, 0.5, z), 'red');
    }

    // Spawn a buddy bug (extra life)
    collectiblesManager.spawnBuddyBug(new THREE.Vector3(0, 1, 20));

    return {
        enemyManager,
        particleEffects,
        rippleManager,
        collectiblesManager
    };
}

// ============================================
// UPDATE LOOP EXAMPLE
// ============================================

export function updateGameSystems(systems, player, camera, deltaTime) {
    const { enemyManager, particleEffects, rippleManager, collectiblesManager } = systems;

    // Update enemies
    enemyManager.update(player, deltaTime);

    // Update particle effects
    particleEffects.update(deltaTime, camera);

    // Update ripples
    rippleManager.update(deltaTime);

    // Update collectibles
    collectiblesManager.update(player, deltaTime);

    // Handle player web status (from spider web attacks)
    if (player.userData.isWebbed) {
        player.userData.webTimer -= deltaTime;

        if (player.userData.webTimer <= 0) {
            player.userData.isWebbed = false;

            // Remove web sphere visual
            if (player.userData.webSphere) {
                systems.enemyManager.scene.remove(player.userData.webSphere);
                player.userData.webSphere = null;
            }
        } else if (player.userData.webSphere) {
            // Update web sphere position
            player.userData.webSphere.position.copy(player.position);
            player.userData.webSphere.rotation.y += deltaTime * 2;
        }
    }

    // Handle player speed boost
    if (player.userData.speedBoost !== undefined && player.userData.speedBoost > 0) {
        player.userData.speedBoost -= deltaTime;

        if (player.userData.speedBoost <= 0) {
            player.userData.speedMultiplier = 1.0;
        }
    }

    // Handle player invincibility
    if (player.userData.invincible !== undefined && player.userData.invincible > 0) {
        player.userData.invincible -= deltaTime;

        // Flash effect
        if (player.visible !== undefined) {
            player.visible = Math.floor(player.userData.invincible * 10) % 2 === 0;
        }

        if (player.userData.invincible <= 0) {
            player.visible = true;
        }
    }
}

// ============================================
// PLAYER ACTION EXAMPLES
// ============================================

export function playerJumpLanded(systems, position) {
    // Create dust puff when player lands
    systems.particleEffects.createDustPuff(position, 12, 0xccaa88);

    // Create ground ripple
    systems.rippleManager.createRipple(position, 2, 1.0, 0xaa8866);
}

export function playerAttack(systems, position, direction) {
    // Create attack spark effect
    const attackPos = position.clone();
    attackPos.add(direction.clone().multiplyScalar(0.5));

    systems.particleEffects.createSparks(attackPos, 15, 0xffaa00);
}

export function playerEntersWater(systems, position) {
    // Create water splash
    systems.particleEffects.createSplash(position, 30, 0x4488ff);

    // Create ripples
    systems.rippleManager.createRipple(position, 3, 2.0, 0x88ccff);
}

export function enemyKilled(systems, position) {
    // Create burst effect
    systems.particleEffects.createBurst(position, 40, 0xff6600);

    // Create multiple ripples
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            systems.rippleManager.createRipple(position, 2 + i, 1.5, 0xffaa00);
        }, i * 200);
    }
}

// ============================================
// COLLISION DETECTION HELPERS
// ============================================

export function checkPlayerEnemyCollisions(player, enemyManager, systems) {
    // Skip if player is invincible
    if (player.userData.invincible > 0) {
        return;
    }

    // Skip if player is webbed (already caught)
    if (player.userData.isWebbed) {
        return;
    }

    for (const enemy of enemyManager.enemies) {
        const distance = player.position.distanceTo(enemy.mesh.position);

        if (distance < 1.0) {
            // Player hit by enemy
            takeDamage(player, enemy.damage, systems);

            // Knockback effect
            const knockback = new THREE.Vector3();
            knockback.subVectors(player.position, enemy.mesh.position);
            knockback.normalize();
            knockback.multiplyScalar(5);

            if (player.userData.velocity) {
                player.userData.velocity.add(knockback);
            }

            // Visual feedback
            systems.particleEffects.createBurst(player.position, 20, 0xff0000);
        }
    }
}

export function checkPlayerAttackHitsEnemy(attackPosition, enemyManager, systems, damage = 1.0) {
    for (const enemy of enemyManager.enemies) {
        const distance = attackPosition.distanceTo(enemy.mesh.position);

        if (distance < 1.5) {
            // Enemy hit!
            const isDead = enemy.takeDamage(damage);

            // Visual feedback
            systems.particleEffects.createSparks(enemy.mesh.position, 20, 0xffaa00);

            if (isDead) {
                enemyKilled(systems, enemy.mesh.position);
            }
        }
    }
}

function takeDamage(player, amount, systems) {
    if (player.userData.health === undefined) {
        player.userData.health = 100;
    }

    player.userData.health -= amount * 10; // Scale damage

    // Screen shake could be triggered here
    // Camera flash effect could be added

    if (player.userData.health <= 0) {
        // Player died
        // Reset or game over logic here
    }
}

// ============================================
// DEBUGGING / TESTING
// ============================================

export function spawnTestItems(systems, playerPosition) {
    const forward = new THREE.Vector3(0, 0, -1);
    const right = new THREE.Vector3(1, 0, 0);

    // Spawn items in a grid in front of player
    const testPos = playerPosition.clone().add(forward.clone().multiplyScalar(5));

    systems.collectiblesManager.spawnMushroom(testPos.clone().add(right.clone().multiplyScalar(-4)), 'health');
    systems.collectiblesManager.spawnMushroom(testPos.clone().add(right.clone().multiplyScalar(-2)), 'speed');
    systems.collectiblesManager.spawnMushroom(testPos.clone(), 'invincibility');

    systems.collectiblesManager.spawnKey(testPos.clone().add(right.clone().multiplyScalar(2)), 'red');
    systems.collectiblesManager.spawnKey(testPos.clone().add(right.clone().multiplyScalar(4)), 'blue');

    // Spawn test enemies
    const enemyPos = playerPosition.clone().add(forward.clone().multiplyScalar(10));
    systems.enemyManager.spawnSpider(enemyPos.clone().add(right.clone().multiplyScalar(-3)));
    systems.enemyManager.spawnSlug(enemyPos.clone().add(right.clone().multiplyScalar(3)));
}

export function createTestExplosion(systems, position) {
    // Create multiple particle effects at once
    systems.particleEffects.createBurst(position, 50, 0xff6600);
    systems.particleEffects.createSparks(position, 30, 0xffaa00);

    // Chain ripples
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            systems.rippleManager.createRipple(position, 2 + i * 0.5, 1.0, 0xff8800);
        }, i * 100);
    }
}

// ============================================
// KEYBOARD SHORTCUTS FOR TESTING
// ============================================

export function setupTestingKeyboard(systems, player, camera) {
    document.addEventListener('keydown', (event) => {
        switch (event.key) {
            case 'p': // Test particles
                systems.particleEffects.createBurst(player.position, 40, 0xff00ff);
                break;

            case 'o': // Test ripple
                systems.rippleManager.createRipple(player.position, 4, 2.0, 0x00ffff);
                break;

            case 'i': // Spawn items
                spawnTestItems(systems, player.position);
                break;

            case 'u': // Spawn spider
                const spiderPos = player.position.clone();
                spiderPos.z -= 10;
                spiderPos.y = 8;
                systems.enemyManager.spawnSpider(spiderPos);
                break;

            case 'y': // Spawn slug
                const slugPos = player.position.clone();
                slugPos.z -= 8;
                systems.enemyManager.spawnSlug(slugPos);
                break;

            case 't': // Test explosion
                createTestExplosion(systems, player.position);
                break;
        }
    });
}

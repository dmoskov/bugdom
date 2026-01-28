import * as THREE from 'three';

/**
 * CollisionManager - Handles all collision detection in the game
 *
 * This module provides pure collision detection without side effects.
 * All game state changes are handled through callbacks to maintain
 * separation of concerns.
 */
export class CollisionManager {
  constructor(audioManager, particleEffects, rippleManager) {
    this.audioManager = audioManager;
    this.particleEffects = particleEffects;
    this.rippleManager = rippleManager;

    // Collision constants
    this.COLLECTION_RADIUS = 2.5;
    this.ENEMY_COLLISION_RADIUS = 1.5;
    this.BEE_COLLISION_RADIUS = 1.2;
  }

  /**
   * Check clover collisions and handle collection
   * @param {THREE.Vector3} playerPos - Player position
   * @param {Array} clovers - Array of clover objects
   * @param {Function} onCollect - Callback (clover, isFourLeaf) when clover collected
   * @returns {Object|null} Collected clover or null
   */
  checkCloverCollisions(playerPos, clovers, onCollect) {
    for (const clover of clovers) {
      if (clover.userData.collected) continue;

      const distance = playerPos.distanceTo(clover.position);

      if (distance < this.COLLECTION_RADIUS) {
        // Mark as collected to prevent double-collection
        clover.userData.collected = true;

        // Trigger callback with clover data
        if (onCollect) {
          onCollect(clover, clover.userData.isFourLeaf);
        }

        return clover;
      }
    }

    return null;
  }

  /**
   * Check collectible collisions (mushrooms, coins, buddy bugs)
   * @param {THREE.Vector3} playerPos - Player position
   * @param {Object} collectiblesManager - CollectiblesManager instance
   * @param {Function} onMushroomCollect - Callback (variant, currentTime)
   * @param {Function} onCoinCollect - Callback (points)
   * @param {Function} onBuddyBugCollect - Callback ()
   * @returns {Object|null} Collected item or null
   */
  checkCollectibleCollisions(playerPos, collectiblesManager, onMushroomCollect, onCoinCollect, onBuddyBugCollect) {
    const collected = collectiblesManager.checkCollisions(playerPos, this.COLLECTION_RADIUS);

    if (collected) {
      switch (collected.type) {
        case 'mushroom':
          if (onMushroomCollect) {
            onMushroomCollect(collected.variant, performance.now());
          }
          break;
        case 'buddybug':
          if (onBuddyBugCollect) {
            onBuddyBugCollect();
          }
          break;
        case 'coin':
          if (onCoinCollect) {
            onCoinCollect(50); // Coin points value
          }
          break;
      }
    }

    return collected;
  }

  /**
   * Check enemy ant collisions
   * @param {THREE.Vector3} playerPos - Player position
   * @param {Array} enemies - Array of enemy ants
   * @param {Function} onCollision - Callback when hit
   * @returns {Boolean} True if collision detected
   */
  checkEnemyCollisions(playerPos, enemies, onCollision) {
    for (const enemy of enemies) {
      const distance = playerPos.distanceTo(enemy.position);

      if (distance < this.ENEMY_COLLISION_RADIUS) {
        if (onCollision) {
          onCollision(enemy);
        }
        return true;
      }
    }

    return false;
  }

  /**
   * Check bee collisions
   * @param {THREE.Vector3} playerPos - Player position
   * @param {Array} bees - Array of bees
   * @param {Function} onCollision - Callback when hit
   * @returns {Boolean} True if collision detected
   */
  checkBeeCollisions(playerPos, bees, onCollision) {
    for (const bee of bees) {
      const distance = playerPos.distanceTo(bee.position);

      if (distance < this.BEE_COLLISION_RADIUS) {
        if (onCollision) {
          onCollision(bee);
        }
        return true;
      }
    }

    return false;
  }

  /**
   * Check spider and slug collisions
   * @param {THREE.Vector3} playerPos - Player position
   * @param {Object} enemyManager - EnemyManager instance
   * @param {Function} onCollision - Callback when hit
   * @returns {Boolean} True if collision detected
   */
  checkNewEnemyCollisions(playerPos, enemyManager, onCollision) {
    const spiderCollision = enemyManager.checkSpiderCollisions(playerPos, 2.0);
    const slugCollision = enemyManager.checkSlugCollisions(playerPos, 2.0);

    if (spiderCollision || slugCollision) {
      if (onCollision) {
        onCollision(spiderCollision ? 'spider' : 'slug');
      }
      return true;
    }

    return false;
  }
}

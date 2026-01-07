# Bugdom Porting Notes

This document describes the systems ported from [Jorio's Bugdom C implementation](https://github.com/jorio/Bugdom) to JavaScript/Three.js.

## Overview

Successfully ported three major game systems with full documentation and reference comments to the original C source files. All systems are designed to integrate seamlessly with the existing Three.js-based game engine.

## Ported Systems

### 1. Enemy Systems (`src/enemies.js`)

Ported from: `src/Enemies/Enemy_Spider.c` and `src/Enemies/Enemy_Slug.c`

#### Spider Enemy
- **State Machine**: 7 states (WAITING, DROP, WALKING, SPIT, JUMP, FALL ON BUTT, GET OFF BUTT)
- **Attack Patterns**:
  - Web Attack: Shoots paralyzing web projectiles at player
  - Pounce Attack: Jumps at webbed players
- **Features**:
  - Drops from above when player approaches (700 unit activation range)
  - 8 glowing red eyes
  - Animated 8-leg locomotion
  - Thread dropping mechanic
  - Web sphere that paralyzes player for 2.5 seconds
- **AI**: Pursues player at 300 units/second, attacks when in range

#### Slug Enemy
- **Movement**: Slow ground-based pursuit (1.5 units/second)
- **Features**:
  - Segmented body with 8 sections
  - Sinusoidal undulation animation along spine
  - Slime trail generation every 0.3 seconds
  - Eye stalks with animated eyes
  - Color gradient from head to tail
- **Scale**: 3x normal size (large enemy)

#### Enemy Manager
- Centralized spawning and update system
- Handles projectile physics (web shots)
- Manages slime trail lifecycle
- Collision detection for web hits
- Player webbing/paralyze mechanics

### 2. Particle Effects System (`src/particles.js`)

Ported from: `src/Items/Effects.c`

#### Particle Group System
- Pool-based memory system for up to 50 groups
- Maximum 200 particles per group
- Support for gravity, magnetism, decay rates
- Billboard rendering with alpha blending
- Frustum culling for performance

#### Effect Types

**Sparks**
- Falling particles with gravity
- Bounce physics on terrain
- Additive blending for glow
- Used for impacts and attacks

**Dust Puffs**
- Low-gravity particles
- Organic expansion pattern
- Used for landings and impacts

**Splashes**
- High-velocity water particles
- Spherical distribution
- Used for water entry/exit

**Bursts**
- Explosion-like spherical distribution
- Fast, short-lived particles
- Used for enemy deaths and major events

**Trails**
- Following particles for moving objects
- Opposite velocity to create streak
- Fade quickly for motion blur effect

#### Ripple System
- Expanding circular ground ripples
- Fade rate of 0.8 per frame (matching original)
- Maximum 20 concurrent ripples
- Used for footsteps, landings, impacts

#### Gravitoid System
- Particles with mutual gravitational attraction
- "Every particle has gravity pull on other particle"
- Advanced physics simulation
- Experimental/special effects

### 3. Collectibles System (`src/collectibles.js`)

Designed based on common Bugdom gameplay patterns and collectible archetypes.

#### Power-Up Mushrooms
Three types with distinct effects:

**Health Mushroom** (Red with white spots)
- Restores 50 health points
- Standard health pickup

**Speed Mushroom** (Blue with yellow spots)
- 1.5x speed multiplier
- Lasts 10 seconds

**Invincibility Mushroom** (Orange with white spots)
- Complete damage immunity
- Lasts 8 seconds
- Flash effect visual feedback

#### Keys (5 Colors)
- Red, Blue, Green, Yellow, Purple
- Metallic rendering
- Used for door unlocking
- Stored in player inventory
- Glow effect per color

#### Coins
- Bonus points system
- Configurable point values
- Gold metallic appearance
- Star emblem design
- Fast rotation (3.0 rad/s)

#### Berries
- Small health restore (10 points)
- Four types: Red, Blue, Purple, Green
- Minimal bob animation
- Stem and leaf details

#### Buddy Bug (Extra Life)
- Grants additional life
- Animated wing flapping
- Orange body with translucent wings
- Rare collectible

#### Base Collectible Features
- Bob animation (sinusoidal vertical movement)
- Rotation animation
- Collision detection with configurable radius
- Particle effects on collection
- Automatic cleanup when collected

## Integration

### Setup (from `src/integration_example.js`)

```javascript
import { EnemyManager } from './enemies.js';
import { ParticleEffectsManager, RippleManager } from './particles.js';
import { CollectiblesManager } from './collectibles.js';

const enemyManager = new EnemyManager(scene);
const particleEffects = new ParticleEffectsManager(scene);
const rippleManager = new RippleManager(scene);
const collectiblesManager = new CollectiblesManager(scene);

// Make particle effects globally accessible
window.particleEffects = particleEffects;
```

### Update Loop

```javascript
function gameLoop(deltaTime) {
    enemyManager.update(player, deltaTime);
    particleEffects.update(deltaTime, camera);
    rippleManager.update(deltaTime);
    collectiblesManager.update(player, deltaTime);
}
```

### Spawning Examples

```javascript
// Spawn enemies
enemyManager.spawnSpider(new THREE.Vector3(10, 10, 10));
enemyManager.spawnSlug(new THREE.Vector3(-15, 0, 5));

// Spawn collectibles
collectiblesManager.spawnMushroom(new THREE.Vector3(5, 1, 5), 'health');
collectiblesManager.spawnKey(new THREE.Vector3(8, 1, -3), 'red');
collectiblesManager.spawnCoin(new THREE.Vector3(0, 1, 0), 1);

// Create particle effects
particleEffects.createSparks(position, 20, 0xffaa00);
particleEffects.createSplash(position, 30, 0x4488ff);
rippleManager.createRipple(position, 3, 2.0, 0x88ccff);
```

## Testing

The integration example includes keyboard shortcuts for testing:
- `P` - Create particle burst
- `O` - Create ripple effect
- `I` - Spawn test items
- `U` - Spawn spider enemy
- `Y` - Spawn slug enemy
- `T` - Create test explosion

## Architecture

```
Jorio's Bugdom (C)          JavaScript/Three.js Port
━━━━━━━━━━━━━━━━━━━━        ━━━━━━━━━━━━━━━━━━━━━━━━

Enemy_Spider.c       ───→   enemies.js
Enemy_Slug.c         ───→   - Spider class
                            - Slug class
                            - EnemyManager

Effects.c            ───→   particles.js
                            - ParticleEffectsManager
                            - RippleManager
                            - GravitoidSystem

(Designed for game)  ───→   collectibles.js
                            - MushroomPowerUp
                            - Key
                            - Coin
                            - Berry
                            - BuddyBug
                            - CollectiblesManager
```

## Code Statistics

- **enemies.js**: ~700 lines
- **particles.js**: ~650 lines
- **collectibles.js**: ~750 lines
- **integration_example.js**: ~350 lines
- **Total**: ~2,450 lines of ported game logic

## Key Design Decisions

1. **State Machines**: Preserved original C state machine patterns for enemy AI
2. **Physics**: Ported gravity, velocity, and collision systems with scaled values for Three.js
3. **Instanced Rendering**: Used for particle systems to maintain performance with hundreds of particles
4. **Manager Pattern**: Centralized managers for each system to simplify integration
5. **Billboard Particles**: All particles face camera for proper visual appearance
6. **Reference Comments**: Every ported system includes comments linking back to original C source

## Performance Considerations

- Particle systems use instanced meshes (up to 200 particles per group)
- Maximum 50 concurrent particle groups
- Automatic cleanup of expired particles and effects
- Frustum culling for off-screen particles
- Shared geometries across particle types

## Future Enhancement Opportunities

1. Add more enemy types (Ant, Bee, Mosquito, Roach, etc. from Jorio's repo)
2. Port terrain/liquid systems
3. Add trigger system for level events
4. Implement skeletal animation system for more complex enemies
5. Port sound effect integration
6. Add weapon systems (blaster, sonic scream, etc.)

## References

- Original Bugdom Source: https://github.com/jorio/Bugdom
- Enemy AI: `src/Enemies/Enemy_Spider.c`, `Enemy_Slug.c`
- Particle Effects: `src/Items/Effects.c`
- Three.js Documentation: https://threejs.org/docs/

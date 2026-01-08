# Bugdom Implementation - Detailed Subtask Breakdown

**Reference**: Jorio Bugdom → [github.com/jorio/Bugdom](https://github.com/jorio/Bugdom)
**Goal**: Expand from 1-level demo to 10-level full game
**Current Completion**: ~10-15% of target feature set

---

## Quick Reference: Priority Labels

- 🔴 **CRITICAL** - Blocking other work, must do first
- 🟠 **HIGH** - Core features needed for MVP
- 🟡 **MEDIUM** - Important for completeness
- 🟢 **LOW** - Polish and nice-to-haves
- 🔵 **OPTIONAL** - Beyond original scope

---

## PHASE 1: Multi-Level Infrastructure 🔴 CRITICAL

### 1.1: Level System Architecture 🔴

**Context**: Currently all game logic is hardcoded for a single level. Need flexible system to support 10+ distinct levels with different terrain, enemies, objectives.

#### Subtask 1.1.1: Create Level Manager Class
- **Priority**: 🔴 CRITICAL (blocks all other level work)
- **Effort**: 4-6 hours
- **File**: Create `src/LevelManager.js`
- **Dependencies**: None
- **Details**:
  - Singleton pattern to manage current level state
  - Methods: `loadLevel(levelId)`, `unloadLevel()`, `getCurrentLevel()`
  - Handle cleanup of Three.js objects when switching levels
  - Emit events: `levelLoaded`, `levelUnloaded`, `levelComplete`
  - Store reference to current level data and state
- **Acceptance**:
  - Can load a level by ID
  - Properly cleans up previous level resources
  - Fires events that other systems can listen to
  - No memory leaks when switching levels repeatedly

#### Subtask 1.1.2: Design Level Data Format
- **Priority**: 🔴 CRITICAL (defines how all levels are structured)
- **Effort**: 3-4 hours
- **File**: Create `src/levels/LevelSchema.js` and `src/levels/level_training.js` (example)
- **Dependencies**: None
- **Details**:
  - Define JSON schema or JS object structure for level data
  - Required fields:
    ```javascript
    {
      id: "training",
      name: "Training Ground",
      terrain: {
        size: [100, 100],
        heightmap: null or array,
        texture: "grass",
        obstacles: [{type, position, scale}]
      },
      spawns: {
        player: {x, y, z},
        enemies: [{type, position, count, behavior}]
      },
      collectibles: [{type, position, value}],
      objectives: {
        type: "collect_clovers",
        target: 30,
        description: "Collect all clovers"
      },
      environment: {
        lighting: "day",
        fog: {color, density},
        skybox: "clear"
      },
      nextLevel: "lawn" or null
    }
    ```
  - Create validation function to check level data integrity
- **Acceptance**:
  - Schema is documented and clear
  - Can represent all current game features
  - Extensible for future features (bosses, triggers, etc.)
  - At least 1 complete level example exists

#### Subtask 1.1.3: Implement Level Transition System
- **Priority**: 🔴 CRITICAL
- **Effort**: 5-7 hours
- **Files**: `src/Transitions.js`, update `src/main.js`
- **Dependencies**: 1.1.1, 1.1.2
- **Details**:
  - Fade to black effect (CSS overlay or renderer effect)
  - Loading screen with progress indicator
  - Pause game during transition
  - Clear all entities from previous level
  - Load new level data
  - Initialize new level state (spawn player, enemies, collectibles)
  - Fade in to new level
  - Handle errors gracefully (fallback to main menu)
- **Acceptance**:
  - Smooth visual transition (no jarring cuts)
  - No leftover entities from previous level
  - Loading screen shows actual progress
  - Can transition between any two levels
  - Performance: transition completes in <2 seconds

#### Subtask 1.1.4: Create Level Select UI
- **Priority**: 🟠 HIGH
- **Effort**: 4-6 hours
- **Files**: `src/ui/LevelSelect.js`, update `index.html`
- **Dependencies**: 1.1.1, 1.1.2
- **Details**:
  - Grid layout showing all 10 levels
  - Each level shows: thumbnail, name, best score, completion status
  - Locked/unlocked states (progression-based)
  - Click to select and start level
  - Back button to main menu
  - Responsive design for mobile
- **Acceptance**:
  - All levels visible in grid
  - Shows which levels are unlocked
  - Displays player stats per level
  - Mobile-friendly touch targets
  - Smooth animations on hover/click

#### Subtask 1.1.5: Add Level Progression Persistence
- **Priority**: 🟠 HIGH
- **Effort**: 3-4 hours
- **Files**: `src/SaveSystem.js`, update `src/LevelManager.js`
- **Dependencies**: 1.1.1, 1.1.4
- **Details**:
  - localStorage schema:
    ```javascript
    {
      unlockedLevels: ["training", "lawn", "pond"],
      levelStats: {
        training: {completed: true, bestScore: 5000, bestTime: 180},
        lawn: {completed: false, bestScore: 0, bestTime: 0}
      },
      currentLevel: "lawn"
    }
    ```
  - Save after level completion
  - Unlock next level on completion
  - Handle save/load errors (corrupt data, quota exceeded)
  - Reset progress option in settings
- **Acceptance**:
  - Progress persists across browser sessions
  - Completing a level unlocks the next one
  - High scores and best times are saved
  - Can reset all progress

---

### 1.2: Terrain System Expansion 🔴

**Context**: Current terrain is hardcoded procedural generation. Need data-driven system to create varied environments (grass, sand, water, underground).

#### Subtask 1.2.1: Refactor Terrain to be Data-Driven
- **Priority**: 🔴 CRITICAL
- **Effort**: 6-8 hours
- **Files**: `src/Terrain.js` (major refactor of main.js terrain code)
- **Dependencies**: 1.1.2
- **Details**:
  - Extract terrain generation from main.js into dedicated class
  - Accept level terrain data as parameter
  - Create `TerrainBuilder` class with methods:
    - `generateFlat(size)` - flat plane
    - `generateHilly(size, amplitude, frequency)` - rolling hills
    - `generateFromHeightmap(size, heightData)` - custom heights
  - Support multiple terrain types in single level (zones)
  - Maintain current vertex displacement for variation
- **Acceptance**:
  - Terrain created from level data, not hardcoded
  - Can create flat, hilly, or custom terrain
  - Performance: <100ms generation time for 100x100 terrain
  - No breaking changes to current level

#### Subtask 1.2.2: Implement Heightmap-Based Terrain
- **Priority**: 🟠 HIGH
- **Effort**: 5-7 hours
- **Files**: Update `src/Terrain.js`
- **Dependencies**: 1.2.1
- **Details**:
  - Support heightmap input (2D array or image data)
  - Normalize height values to world scale
  - Generate normals for proper lighting
  - Optimize mesh (reduce vertex count where possible)
  - Add collision detection with terrain surface
- **Acceptance**:
  - Can load heightmap data and create terrain
  - Lighting looks correct on slopes
  - Player collision works on uneven terrain
  - Performance: 60fps with 200x200 heightmap terrain

#### Subtask 1.2.3: Add Terrain Texture Variation
- **Priority**: 🟠 HIGH
- **Effort**: 4-6 hours
- **Files**: Update `src/Terrain.js`, `src/materials/`
- **Dependencies**: 1.2.1
- **Details**:
  - Support texture types: grass, sand, dirt, rock, snow, water
  - Use Three.js multi-material or texture atlasing
  - Blend between textures at boundaries (optional)
  - Adjust material properties per type:
    - Grass: green, roughness 0.9
    - Sand: tan, roughness 0.8
    - Water: blue, transparent, reflective
  - Procedural texture generation if needed
- **Acceptance**:
  - 5+ distinct terrain textures
  - Textures look appropriate for material type
  - Can mix multiple textures in one level
  - Performance impact: <5fps drop

#### Subtask 1.2.4: Create Terrain Biome System
- **Priority**: 🟡 MEDIUM
- **Effort**: 4-5 hours
- **Files**: Update `src/Terrain.js`, create `src/Biomes.js`
- **Dependencies**: 1.2.3
- **Details**:
  - Define biome presets: grassland, desert, beach, forest, cave
  - Each biome specifies:
    - Terrain texture
    - Ambient lighting color
    - Fog color/density
    - Decoration types (rocks, plants)
    - Sky color/skybox
  - Apply biome settings automatically from level data
- **Acceptance**:
  - 5+ biome presets defined
  - Applying biome changes all related visuals
  - Biomes create distinct atmosphere
  - Easy to create new biome by copying preset

#### Subtask 1.2.5: Add Terrain Decoration System
- **Priority**: 🟡 MEDIUM
- **Effort**: 5-6 hours
- **Files**: Update `src/Terrain.js`, create `src/Decorations.js`
- **Dependencies**: 1.2.1
- **Details**:
  - Procedural placement of decorative objects
  - Decoration types: rocks, flowers, grass patches, mushrooms, logs
  - Placement rules:
    - Density (objects per area)
    - Size variation (min/max scale)
    - Rotation randomization
    - Slope restrictions (don't place on steep hills)
  - Avoid placement on spawn points or paths
  - Instanced meshes for performance
- **Acceptance**:
  - Levels feel populated, not empty
  - Decorations don't interfere with gameplay
  - Performance: can place 100+ decorations with <5fps impact
  - Variation creates organic look

---

### 1.3: First Three New Levels 🟠

#### Subtask 1.3.1: Training Level
- **Priority**: 🟠 HIGH (first new level, validates system)
- **Effort**: 6-8 hours
- **Files**: `src/levels/level_training.js`, update UI
- **Dependencies**: 1.1.x, 1.2.1
- **Details**:
  - **Design**: Smaller map (60x60), enclosed area with fences
  - **Objectives**: Tutorial steps (move, collect clover, defeat ant, find exit)
  - **Enemies**: 2 red ants (easy), spawn after tutorial steps
  - **Collectibles**: 10 clovers, 1 mushroom
  - **Features**:
    - On-screen prompts: "Use WASD to move", "Collect the clover", etc.
    - Gated progression (can't proceed until objective done)
    - Exit portal appears after all objectives complete
  - **Environment**: Clear day, bright lighting, grassy
- **Acceptance**:
  - New player can complete without confusion
  - Teaches all basic mechanics
  - Takes 2-3 minutes to complete
  - No softlock situations

#### Subtask 1.3.2: Lawn Level (Expanded)
- **Priority**: 🟠 HIGH
- **Effort**: 5-7 hours
- **Files**: `src/levels/level_lawn.js`
- **Dependencies**: 1.1.x, 1.2.x
- **Details**:
  - **Design**: Larger map (150x150), rolling hills terrain
  - **Objectives**: Collect 40 clovers
  - **Enemies**:
    - 8 red ants
    - 3 spiders (hidden in grass)
    - 4 slugs
    - 2 bees (after level 3)
  - **Collectibles**: 40 clovers, 10 coins, 2 mushrooms, 1 BuddyBug
  - **Features**:
    - More varied terrain (hills and valleys)
    - 15 rocks as obstacles
    - 20 flowers for decoration
    - Some hidden clovers (behind rocks, in valleys)
  - **Environment**: Mixed day/sunset cycle
- **Acceptance**:
  - Feels like expanded version of current level
  - More challenging than Training
  - 5-8 minute completion time
  - No performance issues

#### Subtask 1.3.3: Pond Level (Water Environment)
- **Priority**: 🟡 MEDIUM (requires swimming mechanics from Phase 2)
- **Effort**: 8-10 hours
- **Files**: `src/levels/level_pond.js`
- **Dependencies**: 1.1.x, 1.2.x, 2.2.1 (swimming)
- **Details**:
  - **Design**: Mixed land/water (100x100), central pond with islands
  - **Objectives**: Collect 35 clovers (some underwater)
  - **Enemies**:
    - 3 PondFish (water only)
    - 5 mosquitos (flying over water)
    - 4 slugs (land areas)
  - **Collectibles**: 35 clovers (20 land, 15 underwater), 8 coins
  - **Features**:
    - Water zone (blue, translucent plane)
    - Lily pads as platforms
    - Underwater clovers (requires swimming)
    - Cattails and reeds as decoration
  - **Environment**: Misty, blue-tinted lighting
- **Acceptance**:
  - Water looks convincing
  - Swimming works smoothly (if Phase 2 done)
  - Aquatic enemies behave correctly
  - Clear visual distinction between land/water

---

## PHASE 2: Player Mechanics Expansion 🟠 HIGH

### 2.1: Ball Mode Implementation 🟠

**Context**: Jorio Bugdom has dual player forms (bug and ball). Ball mode allows faster movement but less control, used for specific areas and puzzles.

#### Subtask 2.1.1: Ball Physics System
- **Priority**: 🟠 HIGH
- **Effort**: 8-10 hours
- **Files**: Create `src/player/BallPhysics.js`
- **Dependencies**: None (can start early)
- **Details**:
  - Implement rolling physics using Three.js
  - Ball properties:
    - Radius: 1 unit
    - Mass: affects acceleration/deceleration
    - Friction: slows rolling on flat ground
    - Rolling resistance: slows on uphill
  - Physics calculations:
    - Apply gravity on slopes (roll downhill)
    - Angular velocity (rotation matches movement)
    - Momentum (continues rolling after input stops)
    - Collision response (bounce off walls)
  - Tune constants for fun gameplay (not realistic simulation)
- **Acceptance**:
  - Ball rolls smoothly in response to input
  - Momentum feels natural
  - Can roll uphill with enough speed
  - Stops naturally on flat ground after time
  - Performance: <1ms per frame for physics

#### Subtask 2.1.2: Ball Visual Design
- **Priority**: 🟠 HIGH
- **Effort**: 3-4 hours
- **Files**: Create `src/player/BallModel.js`
- **Dependencies**: None
- **Details**:
  - Create ball geometry (sphere with good detail)
  - Texture: Brown with bug pattern or stripes
  - Material: Slightly shiny (metalness 0.3, roughness 0.6)
  - Rotation animation (rotate mesh to match physics)
  - Particle trail when rolling fast (dust)
  - Sound effect: rolling sound (pitch varies with speed)
- **Acceptance**:
  - Ball looks distinct from bug form
  - Rotation is smooth and matches movement
  - Visual feedback for speed (particles)
  - Audio feedback for rolling

#### Subtask 2.1.3: Mode Switching Mechanic
- **Priority**: 🟠 HIGH
- **Effort**: 5-6 hours
- **Files**: Update `src/main.js`, create `src/player/ModeManager.js`
- **Dependencies**: 2.1.1, 2.1.2
- **Details**:
  - Key binding: press 'B' or 'Space' to toggle forms
  - Transformation animation:
    - Bug curls into ball (0.5 sec animation)
    - Ball unfolds into bug (0.5 sec animation)
  - Transfer state: position, velocity (adjusted), health
  - Cannot switch:
    - While in air (must be grounded)
    - While taking damage (invincibility frames)
    - In water (for now, until swimming works in ball mode)
  - UI indicator: show current form (icon)
  - Tutorial: teach switching in Training level extension
- **Acceptance**:
  - Smooth transition between forms
  - No state loss or glitches
  - Clear visual/audio feedback
  - Cannot exploit switching to skip mechanics

#### Subtask 2.1.4: Ball-Specific Controls
- **Priority**: 🟠 HIGH
- **Effort**: 4-5 hours
- **Files**: Update `src/player/BallPhysics.js`, `src/controls.js`
- **Dependencies**: 2.1.1, 2.1.3
- **Details**:
  - Input scheme:
    - WASD: apply force in direction (not instant velocity)
    - Mouse: camera follows ball from behind
    - No attack ability in ball mode
  - Movement characteristics:
    - Faster top speed than bug mode (1.5x)
    - Slower acceleration (build-up time)
    - Higher momentum (slides longer)
    - Wider turn radius (less maneuverable)
  - Camera adjustments:
    - Further back (10 units vs 8)
    - Slightly higher (6 units vs 4)
    - Smoother following (more lerp damping)
- **Acceptance**:
  - Ball feels different from bug (faster but harder to control)
  - Fun to roll around at speed
  - Can navigate levels effectively
  - Camera feels appropriate

#### Subtask 2.1.5: Ball-Only Areas/Puzzles
- **Priority**: 🟡 MEDIUM
- **Effort**: 4-6 hours (per level)
- **Files**: Update level designs
- **Dependencies**: 2.1.x complete, 1.3.x levels
- **Details**:
  - Design level sections requiring ball mode:
    - **Speed ramps**: Must roll fast to jump gap
    - **Bowling puzzles**: Knock over pins to open door
    - **Downhill races**: Timed section, must reach end in ball mode
    - **Narrow paths**: Bug too slow, ball momentum needed
  - Place mode-switch triggers:
    - Force ball mode in certain zones
    - Force bug mode in others (tight spaces)
  - Collectibles accessible only as ball (high ledges via ramps)
- **Acceptance**:
  - At least 1 puzzle per level uses ball mode
  - Puzzles are intuitive (clear what to do)
  - Challenging but fair
  - Adds variety to gameplay

---

### 2.2: Advanced Movement Mechanics 🟡

#### Subtask 2.2.1: Swimming System
- **Priority**: 🟡 MEDIUM (required for Pond, Beach levels)
- **Effort**: 7-9 hours
- **Files**: Create `src/player/Swimming.js`, update `src/Terrain.js`
- **Dependencies**: 1.2.x (water terrain)
- **Details**:
  - **Water detection**: Raycast to detect water surface, trigger swim mode
  - **Swimming controls**:
    - WASD: Move in horizontal plane (slower than land)
    - Space: Swim up (float toward surface)
    - Ctrl: Dive down (descend)
    - Sprint disabled underwater
  - **Oxygen system**:
    - Air meter UI (100%, depletes over time underwater)
    - 30 seconds before damage starts
    - Rise to surface to replenish instantly
    - Damage: 5 HP/sec when out of air
  - **Swimming animation**:
    - Legs paddle motion
    - Body tilted forward
    - Air bubbles particle effect
  - **Entry/exit**:
    - Walk into water → gradual transition to swimming
    - Swim to shallow water → stand up on land
  - **Camera**: Follows underwater, can see both above/below surface
- **Acceptance**:
  - Smooth transition between land and water
  - Swimming feels slower but controlled
  - Oxygen system creates tension but is fair
  - Can navigate underwater areas effectively
  - Camera doesn't clip weirdly at water surface

#### Subtask 2.2.2: Jumping System
- **Priority**: 🟡 MEDIUM
- **Effort**: 5-7 hours
- **Files**: Update `src/main.js`, `src/player/Movement.js`
- **Dependencies**: None
- **Details**:
  - **Jump input**: Spacebar (or button on mobile)
  - **Jump physics**:
    - Initial upward velocity: 5 units/sec
    - Gravity: -9.8 units/sec² (adjust for fun, not realism)
    - Jump height: ~1.5 units
    - Arc duration: ~0.8 seconds
  - **Jump rules**:
    - Can only jump when grounded (coyote time: 0.1sec)
    - Cannot jump while swimming or in ball mode
    - Variable height: hold space longer = higher jump (max)
  - **Animation**:
    - Legs tuck during ascent
    - Legs extend during descent
    - Landing impact (particles, sound)
  - **Gameplay uses**:
    - Reach higher platforms
    - Dodge enemy attacks
    - Jump small gaps
- **Acceptance**:
  - Jump feels responsive and fun
  - Can chain movement + jump smoothly
  - Landing doesn't feel harsh
  - Consistent height/distance

#### Subtask 2.2.3: Wall Climbing
- **Priority**: 🟢 LOW (nice-to-have)
- **Effort**: 6-8 hours
- **Files**: Create `src/player/Climbing.js`
- **Dependencies**: 2.2.2 (jumping to grab walls)
- **Details**:
  - **Climbable surfaces**: Mark certain walls/rocks as climbable
  - **Grab mechanic**:
    - Jump into wall → grab automatically if climbable
    - Stick to surface (override gravity)
  - **Climbing movement**:
    - WASD: Move up/down/left/right on surface
    - Speed: Slower than ground (0.5x)
    - Space: Jump off wall (backflip)
  - **Stamina system** (optional):
    - 10 seconds max climb time
    - Rest on ledges to recover
  - **Animation**: Leg and body movement while climbing
- **Acceptance**:
  - Grabbing walls feels natural
  - Climbing is smooth, not jittery
  - Clear visual indicator for climbable surfaces
  - Adds verticality to level design

#### Subtask 2.2.4: Flying (Limited/Power-up)
- **Priority**: 🟢 LOW
- **Effort**: 5-6 hours
- **Files**: Create `src/player/Flying.js`
- **Dependencies**: 2.3.2 (DragonFly mount, or make standalone power-up)
- **Details**:
  - **Trigger**: Mount DragonFly OR collect "Wings" power-up
  - **Flight controls**:
    - WASD: Move in 3D space
    - Space: Ascend
    - Ctrl: Descend
    - Mouse: Look direction
  - **Flight properties**:
    - Speed: 2x ground speed
    - Max altitude: 20 units above terrain
    - Duration: 30 seconds (if power-up), unlimited (if mounted)
  - **Visual**: Wing animation, flight trail particles
  - **Restrictions**: Cannot attack while flying
- **Acceptance**:
  - Flight feels freeing and fast
  - Easy to navigate 3D space
  - Doesn't break level design (altitude limit)
  - Fun but not overpowered

---

### 2.3: Rideable Creatures 🟡

#### Subtask 2.3.1: Mount/Dismount System
- **Priority**: 🟡 MEDIUM
- **Effort**: 6-8 hours
- **Files**: Create `src/player/MountSystem.js`
- **Dependencies**: None (framework before specific mounts)
- **Details**:
  - **Mount interaction**:
    - Approach rideable creature (within 2 units)
    - Press 'E' to mount
    - Player disappears, creature becomes controllable
  - **Dismount**:
    - Press 'E' again
    - Player reappears next to creature
    - Creature returns to idle/wander state
  - **Mount properties** (per creature type):
    - Speed multiplier
    - Jump height
    - Special ability (flight, high jump, etc.)
    - Health (shared with player? or independent?)
  - **UI**: Indicator when near mountable creature
  - **State transfer**: Position, velocity preserved
- **Acceptance**:
  - Smooth mount/dismount (no teleporting weirdness)
  - Clear visual feedback
  - Cannot mount during combat or in mid-air
  - Mount state persists until dismount

#### Subtask 2.3.2: DragonFly Mount (Flying)
- **Priority**: 🟡 MEDIUM
- **Effort**: 7-9 hours
- **Files**: Create `src/mounts/DragonFly.js`
- **Dependencies**: 2.3.1
- **Details**:
  - **Model**: Dragonfly with 4 transparent wings, long body
  - **Animation**: Wings flap rapidly (blur effect)
  - **Flying ability**:
    - Fully 3D movement (no altitude limit, or high limit)
    - Speed: 1.8x player ground speed
    - Controls: WASD + Space/Ctrl for altitude
  - **Spawn locations**: Placed in specific levels (Pond, Flight, Beach)
  - **Behavior when not mounted**: Hovers in place, gentle bobbing
  - **Special**: Can access aerial collectibles and shortcuts
- **Acceptance**:
  - DragonFly model looks good
  - Flight is smooth and enjoyable
  - Enables access to new areas
  - Visually distinct from player flying power-up

#### Subtask 2.3.3: Grasshopper Mount (Super Jump)
- **Priority**: 🟢 LOW
- **Effort**: 5-7 hours
- **Files**: Create `src/mounts/Grasshopper.js`
- **Dependencies**: 2.3.1, 2.2.2
- **Details**:
  - **Model**: Large green grasshopper with powerful hind legs
  - **Super jump ability**:
    - Space: Charge jump (hold longer = higher)
    - Release: Launch (up to 10 units high)
    - Trajectory arc (can control direction mid-air)
  - **Ground movement**: Same speed as player bug mode
  - **Jump cooldown**: 1 second between jumps
  - **Spawn locations**: Lawn, Night, AntHill levels
  - **Use cases**: Reach high platforms, escape swarms, traverse gaps
- **Acceptance**:
  - Charge-up mechanic is clear
  - Jump height feels impressive
  - Can reach areas inaccessible to player alone
  - Fun to bounce around levels

#### Subtask 2.3.4: Mount-Specific Abilities
- **Priority**: 🟢 LOW
- **Effort**: Variable (per ability)
- **Files**: Update mount classes
- **Dependencies**: 2.3.2, 2.3.3
- **Details**:
  - **DragonFly**: Aerial dash (burst of speed forward)
  - **Grasshopper**: Ground pound (damage enemies on landing)
  - **Future mounts**: Ladybug (glide), Beetle (charge attack)
  - Button: Right-click or dedicated key
  - Cooldown: 10 seconds per ability
  - Visual/audio feedback
- **Acceptance**:
  - Each mount has 1 unique ability
  - Abilities are useful, not gimmicky
  - Clear cooldown indicator
  - Balanced (not overpowered)

---

## PHASE 3: Enemy Expansion 🟠 HIGH

*(Continuing with abbreviated format for remaining phases)*

### 3.1: Flying Enemies 🟠

#### Subtask 3.1.1: Mosquito
- **Priority**: 🟠 HIGH
- **Effort**: 5-6 hours
- **Details**: Fast flier, erratic movement, drains health slowly on contact, buzzing sound, spawns near water
- **AI**: Random flight path with player tracking, flee when damaged

#### Subtask 3.1.2: FireFly
- **Priority**: 🟡 MEDIUM
- **Effort**: 4-5 hours
- **Details**: Glows (point light), nocturnal (Night level), attracted to player light sources, peaceful until provoked
- **AI**: Wander → investigate light → return to wander

#### Subtask 3.1.3: BoxerFly
- **Priority**: 🟡 MEDIUM
- **Effort**: 6-7 hours
- **Details**: Aggressive, punching attack (lunges forward), territorial (defends area), boxing glove hands
- **AI**: Patrol zone → detect player → close distance → punch combo → retreat

---

### 3.2: Ground Enemies 🟠

#### Subtask 3.2.1: FireAnt
- **Priority**: 🟠 HIGH
- **Effort**: 4-5 hours
- **Details**: Red-orange with embers, faster than regular ants (1.5x), fire damage (bypasses some armor), leaves fire trail
- **AI**: Chase player more aggressively, coordination with other FireAnts

#### Subtask 3.2.2: Roach
- **Priority**: 🟡 MEDIUM
- **Effort**: 5-6 hours
- **Details**: Brown/black, very fast (2x player speed), low health, flees when damaged, hard to hit
- **AI**: Ambush from hiding → scurry toward player → flee when health <50%

#### Subtask 3.2.3: Tick
- **Priority**: 🟡 MEDIUM
- **Effort**: 6-7 hours
- **Details**: Small, jumps onto player, latches on (status effect), drains health over time (2 HP/sec), must be shaken off (mash keys)
- **AI**: Wait in grass → detect player proximity → jump → latch or miss

#### Subtask 3.2.4: Caterpillar
- **Priority**: 🟢 LOW
- **Effort**: 5-6 hours
- **Details**: Green, segmented body, slow but tanky (3x health), blocks narrow paths, pushable
- **AI**: Idle/sleep → wake when player near → move slowly toward player → return to idle if player leaves

---

### 3.3: Water Enemies 🟡

#### Subtask 3.3.1: PondFish
- **Priority**: 🟡 MEDIUM (Pond level requirement)
- **Effort**: 6-7 hours
- **Details**: Swims underwater, jumps out to attack player on shore, splashing sound, silver scales
- **AI**: Patrol underwater → detect player near shore → jump attack → re-enter water

#### Subtask 3.3.2: Larva
- **Priority**: 🟢 LOW
- **Effort**: 4-5 hours
- **Details**: Aquatic worm-like, swarms (spawn in groups of 5), weak individually, annoying in numbers
- **AI**: School behavior (follow leader), swarm around player if underwater

---

### 3.4: Advanced Enemy Behaviors 🟡

#### Subtask 3.4.1: Patrol Routes (Waypoint System)
- **Priority**: 🟡 MEDIUM
- **Effort**: 5-6 hours
- **Details**: Define waypoints in level data, enemies follow path, loop or ping-pong, pause at waypoints
- **Implementation**: Update enemy AI to use waypoint queue, lerp movement between points

#### Subtask 3.4.2: Group Coordination (Pack Behavior)
- **Priority**: 🟡 MEDIUM
- **Effort**: 6-8 hours
- **Details**: Enemies communicate (shared "AI group"), coordinate attacks (surround player), call for help
- **Implementation**: Group manager class, shared target, flocking algorithm basics

#### Subtask 3.4.3: Triggered Spawning
- **Priority**: 🟡 MEDIUM
- **Effort**: 4-5 hours
- **Details**: Enemies spawn based on events (player enters zone, collects item, timer), not all present at start
- **Implementation**: Trigger system in level data, spawn manager listens for events

#### Subtask 3.4.4: Environmental Awareness
- **Priority**: 🟢 LOW
- **Effort**: 7-9 hours
- **Details**: Enemies use cover (hide behind rocks), flank player, avoid hazards (water, cliffs)
- **Implementation**: Navmesh or raycast-based pathfinding, tactical position selection

---

## PHASE 4: Boss Battles 🟡 MEDIUM

### 4.1: Boss Framework 🟡

#### Subtask 4.1.1: Boss Health System
- **Priority**: 🟡 MEDIUM
- **Effort**: 4-5 hours
- **Details**: Multi-stage health (3 phases), phase transitions at 66% and 33% HP, visual changes per phase

#### Subtask 4.1.2: Boss Arena System
- **Priority**: 🟡 MEDIUM
- **Effort**: 3-4 hours
- **Details**: Invisible walls lock player in arena during fight, unlock on victory, arena markers

#### Subtask 4.1.3: Boss State Machine
- **Priority**: 🟡 MEDIUM
- **Effort**: 5-6 hours
- **Details**: Complex AI with multiple attacks, phase-specific behaviors, cooldown management, telegraphed attacks

#### Subtask 4.1.4: Boss UI
- **Priority**: 🟡 MEDIUM
- **Effort**: 3-4 hours
- **Details**: Large health bar at top of screen, phase indicators, attack warnings, boss name display

---

### 4.2: King Ant Boss 🟡

#### Subtask 4.2.1: AntKing Level Design
- **Priority**: 🟡 MEDIUM
- **Effort**: 6-7 hours
- **Details**: Circular arena inside ant hill, pillars for cover, elevated throne area, dark lighting with torches

#### Subtask 4.2.2: KingAnt Model
- **Priority**: 🟡 MEDIUM
- **Effort**: 4-5 hours
- **Details**: 3x size of regular ant, crown, armor plates, darker red color, glowing eyes

#### Subtask 4.2.3: KingAnt Fight (3 Phases)
- **Priority**: 🟡 MEDIUM
- **Effort**: 10-12 hours
- **Details**:
  - **Phase 1 (100-66% HP)**: Charge attacks, ground pound (AOE), mandible swipes
  - **Phase 2 (66-33% HP)**: Summons ant minions (5 at a time), retreat to throne, player must clear minions
  - **Phase 3 (<33% HP)**: Berserk mode, faster attacks, adds fire damage, arena pillars collapse
- **Attacks**:
  - Charge: Telegraphed (2sec), rushes in straight line, avoidable by sidestep
  - Ground Pound: Jumps up, slams down, AOE 5 unit radius, avoid by running away
  - Mandible Swipe: 180° arc in front, medium damage, short range
  - Summon: Roar animation, ants spawn from holes in walls

#### Subtask 4.2.4: Victory Sequence
- **Priority**: 🟢 LOW
- **Effort**: 3-4 hours
- **Details**: KingAnt collapse animation, crown drops (collectible trophy), walls open, portal to next level, fanfare music

---

### 4.3: Queen Bee Boss 🟡

#### Subtask 4.3.1: QueenBee Level Design
- **Priority**: 🟡 MEDIUM
- **Effort**: 6-7 hours
- **Details**: Hive interior, hexagonal platforms at multiple heights, honeycomb walls, hanging hive entrance, golden lighting

#### Subtask 4.3.2: QueenBee Model
- **Priority**: 🟡 MEDIUM
- **Effort**: 4-5 hours
- **Details**: 4x bee size, ornate crown, longer stinger, elegant wings, yellow-gold coloring

#### Subtask 4.3.3: QueenBee Fight (3 Phases)
- **Priority**: 🟡 MEDIUM
- **Effort**: 10-12 hours
- **Details**:
  - **Phase 1 (100-66% HP)**: Aerial fight, stinger dive attacks, flies around arena
  - **Phase 2 (66-33% HP)**: Summons worker bee swarms (10 bees), player must survive/kill bees
  - **Phase 3 (<33% HP)**: Honey projectile barrage, sticky honey puddles slow player, desperation mode
- **Attacks**:
  - Stinger Dive: Flies high, dives at player location, avoidable by moving
  - Bee Swarm: Worker bees spawn, attack player for 30 seconds
  - Honey Shot: Fires 3 projectiles in spread, creates puddles on impact
  - Wing Gust: Knockback attack, pushes player toward edges

#### Subtask 4.3.4: Victory Sequence
- **Priority**: 🟢 LOW
- **Effort**: 3-4 hours
- **Details**: QueenBee falls, hive opens, rescued ladybugs appear, celebration animation, ending cutscene (if final boss)

---

## PHASE 5: Advanced Level Environments 🟡 MEDIUM

*(Levels 4-8)*

### 5.1: Night Level 🟡
- **Effort**: 8-10 hours
- **Details**: Dark lighting (limited visibility 10 unit radius), fireflies provide light sources, nocturnal enemies (FireFly, more spiders), torches to light for better vision, moonlit sky, eerie ambiance

### 5.2: Beach Level 🟡
- **Effort**: 8-10 hours
- **Details**: Sand terrain (different physics, slower movement), ocean waves (visual, not gameplay), seashells, driftwood, seagull ambiance, crabs as enemies, sunny bright lighting, salty wind sound

### 5.3: Flight Level 🟡
- **Effort**: 9-11 hours
- **Details**: Entirely aerial (player on DragonFly mount), clouds as platforms, sky backdrop, emphasis on flying enemies (bees, mosquitos, flies), ring gates for navigation, optional timed race, no ground

### 5.4: AntHill Level 🟡
- **Effort**: 9-11 hours
- **Details**: Underground tunnels (maze-like), dirt walls and floors, claustrophobic corridors, ant colony (many ants), dark with sporadic lighting (glowing mushrooms), leads to KingAnt boss arena

### 5.5: BeeHive Level 🟡
- **Effort**: 9-11 hours
- **Details**: Interior of giant hive, hexagonal honeycomb geometry, sticky honey floors (slow movement zones), worker bees everywhere, vertical climbing sections, yellow-golden lighting, leads to QueenBee boss

---

## PHASE 6: Items & Power-ups 🟡 MEDIUM

### 6.1: Power-ups 🟡

#### 6.1.1: Shield Power-up
- **Effort**: 3-4 hours
- **Details**: Blocks next 3 hits, visual bubble around player, 60 second duration or until 3 hits, blue glow

#### 6.1.2: Speed Boost (Refine Existing)
- **Effort**: 2-3 hours
- **Details**: Increase to 2x speed, 10 second duration, motion blur effect, refine visual feedback

#### 6.1.3: Super Jump Power-up
- **Effort**: 3-4 hours
- **Details**: Triple jump height for 30 seconds, allows access to high areas, spring sound effect

#### 6.1.4: Time Slow Power-up
- **Effort**: 4-5 hours
- **Details**: Enemies move at 0.5x speed for 15 seconds, player normal speed, grayscale effect on enemies, tactical advantage

---

### 6.2: Collectibles 🟡

#### 6.2.1: Keys System
- **Effort**: 4-5 hours
- **Details**: Colored keys (red, blue, yellow), unlock matching gates/doors, required for progression in some levels, inventory UI

#### 6.2.2: Gems (High-Value)
- **Effort**: 2-3 hours
- **Details**: Rare collectibles (1-3 per level), worth 500 points each, sparkle effect, hidden in secrets

#### 6.2.3: Health Packs (Variation)
- **Effort**: 2-3 hours
- **Details**: Small (+10 HP), Medium (+30 HP, current mushroom), Large (+50 HP), visual size differences

#### 6.2.4: Extra Lives (Expand BuddyBug)
- **Effort**: 2-3 hours
- **Details**: Keep BuddyBug, add 1-Up icon collectible, very rare (1 per 2-3 levels), distinct sound

---

### 6.3: Inventory System 🟢

#### 6.3.1: Inventory UI
- **Effort**: 5-6 hours
- **Details**: Slots for keys, equipped items, visual item icons, hotkey numbers, pause menu access

#### 6.3.2: Usable Items
- **Effort**: 6-7 hours (if pursuing)
- **Details**: Throwable rocks (stun enemies), health potions (instant heal), bombs (AOE damage), use with number keys

---

## PHASE 7: Traps & Hazards 🟢 LOW

### 7.1: Trap Types 🟢

#### 7.1.1: Spike Traps
- **Effort**: 3-4 hours
- **Details**: Retractable spikes on timer, 20 damage on hit, warning light/sound before activation

#### 7.1.2: Moving Platforms
- **Effort**: 5-6 hours
- **Details**: Platforms on rails/paths, player must ride, fall detection, various speeds

#### 7.1.3: Falling Objects (Debris)
- **Effort**: 4-5 hours
- **Details**: Rocks fall from ceiling (trigger or timed), warning shadow on ground, instant kill or high damage

#### 7.1.4: Pressure Plates
- **Effort**: 4-5 hours
- **Details**: Step on plate → trigger event (door open, trap activate, enemy spawn), visual feedback

---

### 7.2: Environmental Hazards 🟢

#### 7.2.1: Water Currents
- **Effort**: 3-4 hours
- **Details**: Push player in direction while swimming, visual flow particles, makes navigation harder

#### 7.2.2: Wind Zones
- **Effort**: 3-4 hours
- **Details**: Affects movement direction and jump arcs, visual wind particles, sound effect, in Flight level

#### 7.2.3: Poison Puddles
- **Effort**: 3-4 hours
- **Details**: Green toxic pools, damage over time (5 HP/sec), visual poison bubbles, avoidable

#### 7.2.4: Fire Hazards
- **Effort**: 3-4 hours
- **Details**: Flame jets, burning logs, instant 15 damage on contact, clear visual flames

---

## PHASE 8: Game Systems Polish 🟢 LOW

### 8.1: Audio Enhancement 🟢

#### 8.1.1: Replace Procedural Audio with Files
- **Effort**: 6-8 hours
- **Details**: Source/create sound effects library, replace Web Audio API generation with file playback, maintain volume controls

#### 8.1.2: Ambient Sounds per Level
- **Effort**: 4-5 hours
- **Details**: Birds chirping (Lawn), water lapping (Pond), wind (Night), waves (Beach), unique atmosphere per level

#### 8.1.3: Unique Enemy Sounds
- **Effort**: 5-6 hours
- **Details**: Each enemy type has distinct attack/idle/death sounds, improve immersion

#### 8.1.4: Boss Fight Music
- **Effort**: 4-5 hours
- **Details**: Epic music tracks for KingAnt and QueenBee fights, intensity increases with phase

#### 8.1.5: Music Crossfading
- **Effort**: 3-4 hours
- **Details**: Smooth transition between level music tracks, fade in/out during transitions

---

### 8.2: Visual Polish 🟢

#### 8.2.1: Improve Particle Effects
- **Effort**: 5-6 hours
- **Details**: Higher resolution textures, more particles, better physics (smoke rises, water splashes)

#### 8.2.2: Weather Effects
- **Effort**: 6-7 hours
- **Details**: Rain (with ripples), fog (dense in Night level), snow (if adding winter level), per-level weather

#### 8.2.3: Enhanced Shadows/Lighting
- **Effort**: 4-5 hours
- **Details**: Better shadow mapping (higher resolution), dynamic lights (torches, fireflies), ambient occlusion

#### 8.2.4: Post-Processing Effects
- **Effort**: 5-6 hours
- **Details**: Bloom (glow on bright objects), color grading (warmer/cooler tones per level), vignette

---

### 8.3: UI/UX Improvements 🟢

#### 8.3.1: Animated Menus
- **Effort**: 4-5 hours
- **Details**: Smooth transitions (fade, slide), hover effects, button animations, modern look

#### 8.3.2: Level Preview Screens
- **Effort**: 5-6 hours
- **Details**: Before starting level, show description, objectives, enemies present, tips

#### 8.3.3: Statistics Tracking
- **Effort**: 4-5 hours
- **Details**: Track kills, deaths, secrets found, completion percentage, display in UI

#### 8.3.4: Achievement System
- **Effort**: 6-7 hours
- **Details**: Unlock achievements for milestones (beat boss, collect all in level, speedrun), show notifications, trophy case

#### 8.3.5: Settings Menu
- **Effort**: 5-6 hours
- **Details**: Graphics settings (quality, resolution, shadows), control remapping, audio sliders, apply/reset

---

### 8.4: Story & Narrative 🟢

#### 8.4.1: Intro Cutscene
- **Effort**: 6-8 hours
- **Details**: Animated sequence showing King Thorax capturing ladybugs, Rollie's quest begins, skippable

#### 8.4.2: Inter-Level Story Segments
- **Effort**: 5-6 hours (total)
- **Details**: Brief text/image between levels, advance plot, Rollie comments on progress

#### 8.4.3: NPC Dialogue System
- **Effort**: 7-9 hours
- **Details**: Rescued ladybugs give hints/thanks, simple dialogue boxes, character portraits

#### 8.4.4: Ending Cutscene
- **Effort**: 6-8 hours
- **Details**: Victory animation after QueenBee, ladybugs freed, celebration, credits, replay option

---

## PHASE 9: Advanced Features 🔵 OPTIONAL

### 9.1: Multiplayer 🔵

#### 9.1.1: Local Co-op
- **Effort**: 20-30 hours (major undertaking)
- **Details**: Split-screen or shared screen, 2 players control separate bugs, shared collectibles/score, double difficulty

#### 9.1.2: Competitive Modes
- **Effort**: 15-20 hours
- **Details**: Race to collect clovers, arena combat (PvP), leaderboards

---

### 9.2: Procedural Content 🔵

#### 9.2.1: Procedural Level Generation
- **Effort**: 25-35 hours
- **Details**: Algorithm to generate terrain, place enemies/collectibles randomly, infinite replayability

#### 9.2.2: Daily Challenge Mode
- **Effort**: 10-12 hours
- **Details**: Procedural level with seed of the day, leaderboard for daily challenge, 1 attempt per day

#### 9.2.3: Randomized Enemy Spawns
- **Effort**: 6-8 hours
- **Details**: Each playthrough, enemy positions different, increases replay value

---

### 9.3: Modding Support 🔵

#### 9.3.1: Level Editor
- **Effort**: 30-40 hours
- **Details**: In-game tool to create custom levels, place objects/enemies, save/load levels, share with community

#### 9.3.2: Custom Enemy Creator
- **Effort**: 20-25 hours
- **Details**: Define enemy stats, behaviors, appearance, import into game

#### 9.3.3: Asset Import System
- **Effort**: 15-20 hours
- **Details**: Load custom 3D models, textures, sounds, mod folder structure

---

## Summary Statistics

### Total Subtasks by Priority
- 🔴 **CRITICAL**: 10 subtasks (~40-60 hours)
- 🟠 **HIGH**: 35 subtasks (~150-200 hours)
- 🟡 **MEDIUM**: 55 subtasks (~250-350 hours)
- 🟢 **LOW**: 45 subtasks (~200-280 hours)
- 🔵 **OPTIONAL**: 8 subtasks (~135-200 hours)

**TOTAL (excluding optional)**: ~145 subtasks, ~640-890 hours of development work

### Estimated Timeline (Full-time equivalent)
- **MVP** (Phases 1-2): 8-12 weeks
- **Expanded** (Phases 1-4): 16-22 weeks
- **Full Game** (Phases 1-8): 30-40 weeks
- **With Optional** (Phases 1-9): 40-50 weeks

---

## Recommended Implementation Order

### Sprint 1-2 (Weeks 1-4): Foundation
- 1.1.1, 1.1.2, 1.1.3 (Level infrastructure)
- 1.2.1 (Terrain refactor)
- 1.3.1 (Training level as proof-of-concept)

### Sprint 3-4 (Weeks 5-8): Core Expansion
- 1.1.4, 1.1.5 (Level UI and saving)
- 1.2.2, 1.2.3 (Terrain variation)
- 1.3.2 (Lawn level)

### Sprint 5-6 (Weeks 9-12): Player Mechanics
- 2.1.1, 2.1.2, 2.1.3, 2.1.4 (Ball mode complete)
- 2.2.2 (Jumping)
- Testing and refinement

### Sprint 7-8 (Weeks 13-16): Enemy Variety
- 3.1.1, 3.1.2, 3.1.3 (Flying enemies)
- 3.2.1, 3.2.2 (Ground enemies)
- 3.4.1 (Patrol routes)

*(Continue with remaining sprints as per Phase priority)*

---

## Risk Assessment

### High Risk Items
1. **Ball physics** (2.1.1) - Complex to feel good, may need extensive tuning
2. **Swimming system** (2.2.1) - Water/air transitions can be buggy
3. **Boss AI** (4.1.3, 4.2.3, 4.3.3) - Complex state machines prone to edge cases
4. **Performance** - Too many enemies/particles may cause framerate drops

### Mitigation Strategies
- **Prototype early**: Test risky features in isolation before integrating
- **Playtesting**: Regular testing to catch feel issues
- **Performance budget**: Profile regularly, optimize as you go
- **Scope flexibility**: Optional features can be cut if timeline slips

---

## Conclusion

This breakdown provides a clear, actionable roadmap from the current 1-level demo to a feature-complete 10-level game matching the Jorio Bugdom implementation. Each subtask is specified with effort estimate, dependencies, and acceptance criteria.

**Recommended Starting Point**: Begin with Phase 1 (Multi-Level Infrastructure) as it's critical for all subsequent work. Once the level system is in place, work can proceed in parallel on enemies, player mechanics, and additional levels.

The phasing ensures that at any point, the game is in a playable state with incremental improvements rather than a broken partial implementation.

**Next Action**: Review this document, adjust priorities based on resources/timeline, then begin Subtask 1.1.1 (Level Manager Class).

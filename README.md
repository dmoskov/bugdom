# Bugdom - Level 1 Test Terrain

This is the first test level for the Bugdom 3D game remake, featuring a fully playable 3D adventure game with collectibles, enemies, power-ups, and dynamic effects.

## Features

### Core Gameplay
- **Ground Plane**: 100x100 unit grass-textured terrain with natural vertex displacement
- **Obstacles**: 7 rocks of varying sizes and 8 colorful flowers scattered across the terrain
- **Boundaries**: Invisible walls with visible fence posts marking the playable area (±50 units)
- **Lighting**: Dynamic day/night cycle with ambient and directional light transitions
- **Camera**: Third-person follow camera with WASD/Arrow key controls
- **Audio System**: Background music, sound effects for collecting, damage, combos, and power-ups

### Collectibles
- **Clovers (13 total)**: Primary objective - collect all to win! Features combo system for quick collection
- **Coins (8 total)**: Bonus points worth 50 each
- **Power-Up Mushrooms**:
  - 🔴 Health Mushroom: Restores 30 health points
  - 🟢 Speed Mushroom: 8-second speed boost (1.5x faster movement)
  - 🔵 Invincibility Mushroom: 10 seconds of invulnerability with cyan glow effect
- **BuddyBug**: Extra life collectible - resurrects player when health reaches zero

### Enemy Types
- **Red Ants**: Ground-based enemies that chase the player
- **Flying Bees**: Aerial enemies that spawn as difficulty increases
- **Spiders**: Drop from above and patrol areas
- **Slugs**: Slow-moving ground enemies that leave trails

### Game Systems
- **Health System**: 100 HP with visual bar (green/orange/red states)
- **Scoring System**: Points for clovers with combo multipliers for fast collection
- **Level Progression**: Difficulty increases as you collect more clovers (4 levels)
- **Extra Lives**: Collected BuddyBugs provide second chances
- **Difficulty Selection**: Easy/Medium/Hard modes at start

### Visual Effects
- **Day/Night Cycle**: Dynamic lighting with dawn, day, dusk, and night phases
- **Particle Effects**: Movement particles and environmental effects
- **Ripples**: Water-like ripple effects when player moves
- **Confetti**: Victory celebration particles
- **Power-Up Effects**: Visual feedback for invincibility and speed boosts

### UI Elements
- Score display with combo multipliers
- Health bar with color-coded states
- Clover collection counter (X/13)
- Level indicator
- Extra lives display (when applicable)
- Minimap showing player, enemies, and collectibles
- Pause menu (P or Space)
- Help screen (H key)

## Setup

```bash
npm install
npm run dev
```

## Controls

- **Movement**: WASD or Arrow Keys
- **Look Around**: Move mouse
- **Camera stays within boundaries automatically**

## Structure

- `index.html` - Entry point with basic UI overlay
- `src/main.js` - Main Three.js scene setup with terrain, obstacles, and controls
- `package.json` - Dependencies (Three.js, Vite)

## Testing Player Movement

This terrain is designed to test:
1. Basic player movement in 3D space
2. Collision detection with obstacles (rocks, flowers)
3. Boundary constraints
4. Camera controls and viewport

## Next Steps

- Add player character model
- Implement proper collision detection system
- Add physics for player movement
- Create more detailed textures
- Add sound effects

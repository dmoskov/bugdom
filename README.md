# Bugdom - Level 1 Test Terrain

This is the first test level for the Bugdom 3D game remake, featuring a simple lawn-themed terrain with obstacles.

## Features

- **Ground Plane**: 100x100 unit grass-textured terrain with natural vertex displacement
- **Obstacles**:
  - 7 rocks of varying sizes scattered across the terrain
  - 8 colorful flowers (pink, yellow, orange) with stems
- **Boundaries**: Invisible walls with visible fence posts marking the playable area (±50 units)
- **Lighting**: Ambient + directional light with shadow mapping
- **Camera Controls**: WASD/Arrow keys for movement, mouse for looking around

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

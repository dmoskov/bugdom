# Time System Usage Guide

## Overview

The Bugdom game features a configurable day/night cycle system implemented in the `DayNightCycle` class. This system provides:

- Configurable cycle duration
- Adjustable time speed multiplier
- Event-based callbacks for time changes
- Visual effects (sun, moon, stars, fireflies, lighting)
- Phase-based gameplay mechanics

## Basic Usage

### Creating the Cycle

```javascript
import { DayNightCycle } from './daynight.js';

// Default configuration (5-minute cycle, normal speed)
const cycle = new DayNightCycle(scene, ambientLight, directionalLight);

// Custom configuration
const cycle = new DayNightCycle(scene, ambientLight, directionalLight, {
    cycleDuration: 180,  // 3 minutes = 180 seconds
    timeSpeed: 2.0       // 2x speed (time passes twice as fast)
});
```

### Updating the Cycle

Call the `update()` method in your game loop with deltaTime in milliseconds:

```javascript
function animate() {
    const deltaTime = clock.getDelta() * 1000; // Convert to milliseconds
    cycle.update(deltaTime);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
```

## Configuration Methods

### Cycle Duration

```javascript
// Get current cycle duration (in seconds)
const duration = cycle.getCycleDuration();  // Returns: 300 (default)

// Set new cycle duration (in seconds)
cycle.setCycleDuration(600);  // 10-minute cycle
cycle.setCycleDuration(60);   // 1-minute cycle (for testing)
```

### Time Speed

```javascript
// Get current time speed multiplier
const speed = cycle.getTimeSpeed();  // Returns: 1.0 (default)

// Set new time speed multiplier
cycle.setTimeSpeed(2.0);   // Time passes 2x faster
cycle.setTimeSpeed(0.5);   // Time passes at half speed
cycle.setTimeSpeed(0);     // Pause time
cycle.setTimeSpeed(10.0);  // Time passes 10x faster (for testing)
```

### Time Information

```javascript
// Get current time in seconds
const time = cycle.getCurrentTime();  // Returns: 45.3 (seconds into cycle)

// Get current progress (0 to 1)
const progress = cycle.getProgress();  // Returns: 0.25 (25% through cycle)

// Get time in 24-hour format
const timeInfo = cycle.getTimeIn24HourFormat();
// Returns: { hours: 6, minutes: 0, formatted: "06:00" }
console.log(timeInfo.formatted);  // "06:00"

// Get current phase
const phase = cycle.getPhase();  // Returns: "day", "sunset", "night", or "sunrise"

// Check if it's night
if (cycle.isNight()) {
    // Spawn enemies, enable night-only features, etc.
}
```

## Event System

The time system provides three event types for callbacks:

### 1. Time Change Events

Fired continuously during updates:

```javascript
cycle.on('timeChange', (data) => {
    console.log(`Time: ${data.cycleTime.toFixed(1)}s`);
    console.log(`Progress: ${(data.cycleProgress * 100).toFixed(1)}%`);
    console.log(`Phase: ${data.phase}`);
});
```

### 2. Phase Change Events

Fired when transitioning between day/sunset/night/sunrise:

```javascript
cycle.on('phaseChange', (data) => {
    console.log(`Phase changed to: ${data.phase}`);

    switch(data.phase) {
        case 'night':
            // Spawn nocturnal enemies
            spawnNightEnemies();
            playNightMusic();
            break;
        case 'day':
            // Day-specific logic
            spawnDayEnemies();
            playDayMusic();
            break;
    }
});
```

### 3. Cycle Complete Events

Fired when the cycle completes (returns to start):

```javascript
cycle.on('cycleComplete', (data) => {
    console.log('Day cycle completed!');
    // Increment day counter, trigger daily events, etc.
    dayCounter++;
});
```

### Removing Event Listeners

```javascript
const handler = (data) => {
    console.log('Phase changed!', data.phase);
};

// Add listener
cycle.on('phaseChange', handler);

// Remove listener
cycle.off('phaseChange', handler);
```

## Time Phases

The cycle is divided into four phases:

| Phase | Time Range | Progress | Description |
|-------|-----------|----------|-------------|
| **Day** | 0% - 35% | 0.0 - 0.35 | Full daylight, bright sky |
| **Sunset** | 35% - 45% | 0.35 - 0.45 | Transition to night, orange sky |
| **Night** | 45% - 85% | 0.45 - 0.85 | Dark sky, moon, stars, fireflies |
| **Sunrise** | 85% - 100% | 0.85 - 1.0 | Transition to day, pink sky |

## Manually Setting Time

For testing or special gameplay moments:

```javascript
// Set time to specific progress (0 to 1)
cycle.setTime(0.0);   // Start of day
cycle.setTime(0.35);  // Start of sunset
cycle.setTime(0.5);   // Middle of night
cycle.setTime(0.85);  // Start of sunrise
```

## Visual Features

The time system automatically manages:

- **Sun position and opacity** - Rises during sunrise, sets during sunset
- **Moon position and opacity** - Visible during night
- **Stars** - Fade in/out during transitions
- **Fireflies** - Appear at night, fade during transitions
- **Ambient lighting** - Color and intensity change by phase
- **Directional lighting** - Follows sun/moon position
- **Sky color** - Smooth transitions between phases
- **Fog color** - Matches sky for consistency
- **Point lights** - Streetlamps turn on at night
- **Time display UI** - Shows current phase with icon

## Example: Complete Integration

```javascript
import { DayNightCycle, PHASES } from './daynight.js';

// Initialize
const cycle = new DayNightCycle(scene, ambientLight, directionalLight, {
    cycleDuration: 300,  // 5 minutes
    timeSpeed: 1.0
});

// Set up event listeners
cycle.on('phaseChange', (data) => {
    console.log(`Entering ${data.phase} phase`);

    if (data.phase === PHASES.NIGHT) {
        // Night-specific gameplay
        spawnNightEnemies();
        increaseEnemyDifficulty();
    } else if (data.phase === PHASES.DAY) {
        // Day-specific gameplay
        spawnDayEnemies();
        restorePlayerHealth();
    }
});

cycle.on('cycleComplete', () => {
    console.log('Day completed!');
    saveProgress();
});

// Game loop
const clock = new THREE.Clock();

function animate() {
    const deltaTime = clock.getDelta() * 1000;

    cycle.update(deltaTime);

    // Your game logic here
    updatePlayer();
    updateEnemies();

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();
```

## Performance Considerations

- The system uses InstancedMesh for fireflies (100 particles in a single draw call)
- Point lights use optimized shadow maps (512x512)
- All color/position updates use smooth interpolation
- Event callbacks are wrapped in try-catch for stability

## Testing

```javascript
// Speed up time for testing
cycle.setTimeSpeed(10.0);  // 10x speed

// Jump to specific phase
cycle.setTime(0.5);  // Jump to night
console.log(cycle.getPhase());  // "night"

// Log all phase changes
cycle.on('phaseChange', (data) => {
    console.log(`[${data.cycleProgress.toFixed(2)}] Phase: ${data.phase}`);
});
```

## Constants

```javascript
import { PHASES, DEFAULT_CYCLE_DURATION } from './daynight.js';

console.log(PHASES.DAY);       // "day"
console.log(PHASES.SUNSET);    // "sunset"
console.log(PHASES.NIGHT);     // "night"
console.log(PHASES.SUNRISE);   // "sunrise"

console.log(DEFAULT_CYCLE_DURATION);  // 300 (seconds)
```

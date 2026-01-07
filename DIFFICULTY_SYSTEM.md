# Bugdom Difficulty System

## Overview
The Bugdom game now features a comprehensive difficulty system that allows players to choose between three preset difficulty levels, each offering a unique gameplay experience. The system also maintains the existing progressive difficulty that increases as players collect clovers.

## Difficulty Presets

### 🟢 Easy
**Perfect for beginners**
- **Player Health**: 150 HP (1.5x multiplier)
- **Player Speed**: 10% faster movement
- **Enemy Speed**: 30% slower
- **Enemy Count**: 30% fewer enemies
- **Damage Taken**: 30% less damage
- **Spawn Rate**: 50% slower enemy spawning

### 🟡 Medium (Default)
**Balanced gameplay - Recommended**
- **Player Health**: 100 HP (baseline)
- **Player Speed**: Normal
- **Enemy Speed**: Normal
- **Enemy Count**: Normal
- **Damage Taken**: Normal
- **Spawn Rate**: Normal

### 🔴 Hard
**Intense challenge for experienced players**
- **Player Health**: 75 HP (0.75x multiplier)
- **Player Speed**: 10% slower movement
- **Enemy Speed**: 30% faster
- **Enemy Count**: 30% more enemies
- **Damage Taken**: 50% more damage
- **Spawn Rate**: 30% faster enemy spawning

## Progressive Difficulty

The progressive difficulty system works **on top** of the selected base difficulty:

| Level | Enemies | Enemy Speed | Spawn Rate |
|-------|---------|-------------|------------|
| 1     | 3       | 0.04        | None       |
| 2     | 4       | 0.05        | 15s        |
| 3     | 5       | 0.06        | 12s        |
| 4     | 6       | 0.07        | 10s        |
| 5     | 8       | 0.08        | 8s         |

**Level Up**: Every 3 clovers collected = Level up

## Implementation Details

### Files Modified
1. **index.html**
   - Added difficulty selection UI with three buttons
   - Mobile-responsive styling for difficulty buttons
   - Visual feedback for selected difficulty

2. **src/main.js**
   - `DIFFICULTY_PRESETS` object with multipliers for each difficulty
   - `getDifficultySettings()` function to calculate scaled settings
   - `applyDifficultyToPlayer()` function to apply difficulty on game start
   - Updated level display to show difficulty emoji
   - Updated victory/game-over screens to show difficulty name

### Key Functions

#### `applyDifficultyToPlayer()`
Called when game starts, applies the selected difficulty multipliers to:
- Player maximum health
- Player movement speed
- Damage taken per hit

#### `getDifficultySettings(level)`
Returns difficulty-scaled enemy settings for the current level:
- Enemy speed (progressive level speed × difficulty multiplier)
- Max enemies (progressive level count × difficulty multiplier)
- Spawn rate (progressive spawn rate × difficulty multiplier)

### UI Components

#### Start Screen
- Difficulty selection with three colored buttons
- Dynamic description text that updates on hover/selection
- Selected difficulty highlighted with white border and scale effect

#### In-Game
- Level display shows difficulty emoji (🟢/🟡/🔴) + current level
- All HUD elements remain functional

#### End Screens
- Both victory and game-over screens display selected difficulty name
- Difficulty shown alongside final level reached

## Balance Rationale

### Easy Mode
- Higher health pool allows beginners to survive longer and learn mechanics
- Faster movement helps with enemy avoidance
- Slower, fewer enemies reduce overwhelming pressure
- Less damage gives more room for error

### Medium Mode
- Baseline experience as originally designed
- Balanced for most players
- Progressive difficulty provides natural challenge curve

### Hard Mode
- Lower health requires careful play and avoiding damage
- Slower movement reduces margin for error
- Faster, more numerous enemies create intense pressure
- Higher damage punishes mistakes severely
- Designed for players who have mastered the game

## Testing Recommendations

1. **Easy Mode**: Should feel relaxed, allowing exploration and learning
2. **Medium Mode**: Should feel balanced and achievable with focus
3. **Hard Mode**: Should feel challenging even for experienced players
4. **Level Transitions**: Each level up should noticeably increase challenge
5. **Mobile Play**: Difficulty selection UI should work well on touch devices

## Future Enhancements

Potential future additions:
- Save difficulty preference to localStorage
- Difficulty-based high score tracking
- Achievement system per difficulty level
- Custom difficulty with slider controls
- Difficulty-specific enemy types or behaviors

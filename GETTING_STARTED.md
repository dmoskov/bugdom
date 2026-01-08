# Getting Started with Bugdom Implementation

**Quick Start Guide for Developers**

This guide will help you begin implementing the features identified in the comprehensive Jorio Bugdom analysis.

---

## 📚 Document Overview

Before you start coding, familiarize yourself with these documents:

1. **JORIO_ANALYSIS_SUMMARY.md** - Start here! Executive overview of the entire project
2. **IMPLEMENTATION_ROADMAP.md** - Detailed phase breakdown with context and explanations
3. **SUBTASKS_DETAILED.md** - Granular task specifications (~145 subtasks with acceptance criteria)
4. **FEATURE_COMPARISON.md** - Side-by-side comparison showing what exists vs what's needed
5. **PHASE_DEPENDENCIES.mmd** - Visual dependency graph (can view on GitHub or mermaid.live)

**Recommended Reading Order**: Summary → Roadmap → Subtasks (as needed)

---

## 🎯 Current State (As of January 8, 2026)

You have:
- ✅ 1 playable level (100x100 grass terrain)
- ✅ 4 enemy types working (Red Ants, Spiders, Slugs, Flying Bees)
- ✅ Player controls (WASD movement, mouse camera)
- ✅ Basic combat and health system
- ✅ Collectibles (30 clovers, coins, mushrooms, BuddyBug)
- ✅ Scoring with combos
- ✅ Day/night visual cycle
- ✅ Particle effects
- ✅ Procedural audio
- ✅ Mobile touch controls

This represents **~10-15% of the target feature set**.

---

## 🚀 Where to Start: Phase 1 (Multi-Level Infrastructure)

**Why Phase 1 First?**
- It's BLOCKING all other level-related work
- Without it, you can't add new levels
- It's the foundation everything else builds on

**What You'll Build:**
1. Level Manager system to load/unload levels dynamically
2. Level data format (JSON/JS objects defining level properties)
3. Level transition system (smooth switches between levels)
4. Level select UI
5. Save/load progression system

---

## 📋 Your First Week: Recommended Tasks

### Day 1-2: Architecture & Planning
**Goal**: Design the level system before coding

**Tasks**:
1. Read **SUBTASKS_DETAILED.md** → Section 1.1 (Level System Architecture)
2. Design the level data format (Subtask 1.1.2)
   - Decide: JSON files or JavaScript objects?
   - Define required fields (terrain, spawns, objectives, environment)
   - Create schema/TypeScript interface if desired
3. Sketch out the Level Manager API
   - What methods do you need? (`loadLevel`, `unloadLevel`, etc.)
   - How will it integrate with existing code in `main.js`?

**Deliverable**: Document your design decisions (could be a new `DESIGN_NOTES.md`)

### Day 3-4: Level Manager Implementation
**Goal**: Build the core Level Manager class

**Task**: Implement Subtask 1.1.1 (Level Manager Class)

**Steps**:
1. Create new file: `src/LevelManager.js`
2. Implement as singleton:
   ```javascript
   class LevelManager {
     constructor() {
       this.currentLevel = null;
       this.levelData = null;
     }

     loadLevel(levelId) {
       // 1. Cleanup current level (remove enemies, collectibles, terrain)
       // 2. Load new level data
       // 3. Initialize new level (create terrain, spawn entities)
       // 4. Emit 'levelLoaded' event
     }

     unloadLevel() {
       // Clean up all Three.js objects
       // Reset game state
     }

     getCurrentLevel() {
       return this.currentLevel;
     }
   }

   export const levelManager = new LevelManager();
   ```
3. Test by loading the current level through the manager
4. Ensure no memory leaks (check Chrome DevTools Performance tab)

**Deliverable**: Working Level Manager that can load/unload the existing level

### Day 5: Level Data Format
**Goal**: Create the first level data file

**Task**: Implement Subtask 1.1.2 (Level Data Format)

**Steps**:
1. Create folder: `src/levels/`
2. Create file: `src/levels/level_current.js` (export current level as data)
3. Define structure:
   ```javascript
   export const levelCurrent = {
     id: "current",
     name: "Grassland Demo",
     terrain: {
       size: [100, 100],
       type: "grass",
       heightmap: null, // flat for now
       decorations: {
         rocks: 7,
         flowers: 8,
         grassPatches: 20
       }
     },
     spawns: {
       player: { x: 0, y: 0.5, z: 0 },
       enemies: [
         { type: "ant", count: 3, behavior: "chase" },
         { type: "spider", count: 2, behavior: "drop" },
         { type: "slug", count: 3, behavior: "chase" },
         { type: "bee", count: 2, behavior: "fly", minLevel: 3 }
       ]
     },
     collectibles: {
       clovers: 30,
       coins: 8,
       mushrooms: 3,
       buddyBug: 1
     },
     objectives: {
       type: "collect_clovers",
       target: 30,
       description: "Collect all 30 clovers to win!"
     },
     environment: {
       lighting: "day",
       fogColor: 0x87CEEB,
       fogDensity: 0.0015,
       skyColor: 0x87CEEB
     },
     nextLevel: "training" // or null if last level
   };
   ```
4. Refactor `main.js` to use this data instead of hardcoded values

**Deliverable**: Level defined as data, game still works the same

---

## 🎓 Training Level: Your First New Level

After completing Week 1, you're ready to create your first new level.

**Task**: Implement Subtask 1.3.1 (Training Level)

### Training Level Specifications

**Purpose**: Tutorial to teach new players the basic mechanics

**Design**:
- Smaller map (60x60 units)
- Enclosed area (fences on all sides)
- Guided objectives (step-by-step prompts)

**Level Data** (`src/levels/level_training.js`):
```javascript
export const levelTraining = {
  id: "training",
  name: "Training Ground",
  terrain: {
    size: [60, 60],
    type: "grass",
    heightmap: null, // flat
    decorations: {
      rocks: 3,
      flowers: 5,
      grassPatches: 10,
      fencePosts: 24 // border every 10 units
    }
  },
  spawns: {
    player: { x: 0, y: 0.5, z: -20 }, // south side
    enemies: [] // spawn dynamically during tutorial
  },
  collectibles: {
    clovers: 10,
    coins: 0,
    mushrooms: 1,
    buddyBug: 0
  },
  objectives: {
    type: "tutorial",
    steps: [
      { id: "move", text: "Use WASD or Arrow keys to move", check: "playerMoved" },
      { id: "collect", text: "Collect the glowing clover", check: "cloverCollected" },
      { id: "combat", text: "Defeat the ant by touching it", check: "antDefeated", spawnEnemy: "ant" },
      { id: "health", text: "Collect the mushroom to restore health", check: "mushroomCollected" },
      { id: "exit", text: "Find and enter the exit portal", check: "portalEntered" }
    ],
    description: "Complete the training course"
  },
  environment: {
    lighting: "day",
    fogColor: 0xBBDDFF,
    fogDensity: 0.002,
    skyColor: 0xBBDDFF
  },
  nextLevel: "lawn",
  unlockRequirement: null // always unlocked
};
```

**Implementation Steps**:
1. Create the level data file
2. Add tutorial UI system:
   - Create `src/ui/Tutorial.js`
   - Display step instructions on screen
   - Track step completion
   - Show "Step X/5 Complete" feedback
3. Implement dynamic enemy spawning:
   - Spawn ant when step 3 is active
   - Despawn if not defeated (or keep trying)
4. Create exit portal:
   - Glowing portal object
   - Appears after all steps complete
   - Triggers level transition when player enters
5. Update Level Manager to handle tutorial state

**Testing Checklist**:
- [ ] Training level loads successfully
- [ ] Each tutorial step triggers correctly
- [ ] Prompts are clear and readable
- [ ] Ant spawns during combat step
- [ ] Portal appears after completion
- [ ] Entering portal transitions to next level
- [ ] Can restart training if failed

---

## 🔧 Development Best Practices

### Code Organization
- Keep files small and focused (single responsibility)
- Use ES6 modules (`import`/`export`)
- Separate concerns: logic, rendering, UI
- Document non-obvious code with comments

### Testing
- Test in multiple browsers (Chrome, Firefox, Safari)
- Test on mobile devices (touch controls)
- Check performance (60 FPS target)
- Test level transitions multiple times (memory leaks)

### Version Control
- Commit often with clear messages
- Reference Asana task ID in commits: `Task: #1212678505917776`
- Use branches for experimental features
- Don't commit broken builds (keep main stable)

### Performance Monitoring
```javascript
// Add FPS counter during development
const stats = new Stats();
document.body.appendChild(stats.dom);

function animate() {
  stats.begin();
  // ... your render code ...
  stats.end();
  requestAnimationFrame(animate);
}
```

---

## 🐛 Common Pitfalls & Solutions

### Issue: Three.js Memory Leaks
**Problem**: Game slows down after multiple level loads
**Solution**: Properly dispose of geometries, materials, textures:
```javascript
function cleanupLevel() {
  scene.traverse(object => {
    if (object.geometry) object.geometry.dispose();
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach(mat => mat.dispose());
      } else {
        object.material.dispose();
      }
    }
  });
  scene.clear();
}
```

### Issue: Game State Not Resetting Between Levels
**Problem**: Enemies from previous level still attack
**Solution**: Clear all entity arrays:
```javascript
enemies.length = 0;
collectibles.length = 0;
particles.length = 0;
```

### Issue: Hardcoded Values Break with New Levels
**Problem**: Enemy speed works for one level but not others
**Solution**: Make values level-dependent:
```javascript
const enemySpeed = levelData.difficulty?.enemySpeed || 0.05;
```

---

## 📊 Tracking Your Progress

### Phase 1 Checklist
Use this to track your completion of Phase 1:

- [ ] 1.1.1: Level Manager Class created and working
- [ ] 1.1.2: Level Data Format defined and documented
- [ ] 1.1.3: Level Transition System implemented (fade in/out)
- [ ] 1.1.4: Level Select UI created (shows all levels)
- [ ] 1.1.5: Save/Load System working (localStorage)
- [ ] 1.2.1: Terrain is data-driven (not hardcoded)
- [ ] 1.2.2: Heightmap-based terrain working
- [ ] 1.2.3: Multiple texture types supported
- [ ] 1.2.4: Biome system implemented
- [ ] 1.2.5: Decoration placement is automated
- [ ] 1.3.1: Training Level playable
- [ ] 1.3.2: Lawn Level (expanded) playable
- [ ] 1.3.3: Pond Level playable (requires swimming from Phase 2)

**Phase 1 Complete When**: You can select and play 3+ distinct levels with smooth transitions

---

## 🆘 Getting Help

### Resources
- **Three.js Docs**: https://threejs.org/docs/
- **Game Dev Tutorials**: https://www.youtube.com/c/SimonDev (excellent Three.js game dev)
- **WebGL Fundamentals**: https://webglfundamentals.org/

### Questions to Ask Yourself
- Is this the simplest solution?
- Will this scale to 10 levels?
- Am I reinventing existing Three.js features?
- Have I tested edge cases?

### When Stuck
1. Check SUBTASKS_DETAILED.md for acceptance criteria
2. Review existing code patterns in current implementation
3. Prototype the hard part in isolation first
4. Ask for code review before moving to next subtask

---

## 🎯 Success Metrics

### You're Ready to Move On When:

**After Week 1**:
- ✅ Level Manager can load/unload levels
- ✅ Current level defined as data
- ✅ No memory leaks when reloading level
- ✅ You understand the architecture

**After Week 2-3**:
- ✅ Training level fully playable
- ✅ Tutorial system works smoothly
- ✅ Level transitions are polished
- ✅ Save/load system persists progress

**After Week 4**:
- ✅ 3+ levels are playable
- ✅ Each level feels distinct
- ✅ All levels are performant (60 FPS)
- ✅ Ready to start Phase 2 (Player Mechanics)

---

## 🚀 Next Steps After Phase 1

Once Phase 1 is complete, you have options:

### Option A: Continue Sequential (Recommended)
**Phase 2: Player Mechanics**
- Implement ball mode (rolling physics)
- Add swimming system
- Add jumping

**Why**: Ball mode and swimming unlock Pond and Flight levels

### Option B: Parallelize Work
**Split into two tracks:**
- Track 1: Phase 2 (Player Mechanics)
- Track 2: Phase 3 (Enemy Expansion)

**Why**: Enemies and player mechanics are mostly independent

### Option C: Focus on Content
**Create remaining levels first**
- Night, Beach, AntHill, BeeHive levels
- Then add mechanics they need

**Why**: Validates level system early, shows progress

**Recommendation**: Follow sequential order (A) unless you have multiple developers

---

## 📝 Template for New Levels

Use this as a starting point when creating new levels:

```javascript
// src/levels/level_[name].js
export const level[Name] = {
  id: "[name]",
  name: "[Display Name]",

  terrain: {
    size: [100, 100], // width, depth in units
    type: "grass", // grass, sand, dirt, rock, water
    heightmap: null, // array or null for flat
    decorations: {
      rocks: 5,
      flowers: 10,
      // level-specific decorations
    }
  },

  spawns: {
    player: { x: 0, y: 0.5, z: 0 },
    enemies: [
      { type: "ant", count: 5, behavior: "chase" },
      // more enemies
    ]
  },

  collectibles: {
    clovers: 30,
    coins: 8,
    mushrooms: 2,
    buddyBug: 1
  },

  objectives: {
    type: "collect_clovers", // or "defeat_boss", "tutorial", "timed"
    target: 30,
    description: "Collect all clovers!"
  },

  environment: {
    lighting: "day", // day, sunset, night, dawn
    fogColor: 0x87CEEB,
    fogDensity: 0.0015,
    skyColor: 0x87CEEB,
    // optional: weatherEffect: "rain"
  },

  nextLevel: "[next_level_id]",
  unlockRequirement: {
    previousLevel: "[prev_level_id]",
    minScore: 0 // optional
  }
};
```

---

## 🎉 Conclusion

You now have everything you need to start implementing! Remember:

1. **Start with Phase 1** - it's foundational
2. **Work through subtasks sequentially** - they build on each other
3. **Test frequently** - catch issues early
4. **Commit often** - small, working increments
5. **Refer to SUBTASKS_DETAILED.md** - it has all the specifics

**First Action**: Open `SUBTASKS_DETAILED.md` and start reading Section 1.1.1 (Level Manager Class)

**Questions?** Review the analysis documents or refer to the acceptance criteria in each subtask.

Good luck! You're building something awesome. 🐛🎮

---

**Document Version**: 1.0
**Last Updated**: January 8, 2026
**Next Review**: After Phase 1 completion

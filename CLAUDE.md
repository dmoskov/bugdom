# Project: Bugdom

3D bug adventure game — a Three.js remake of the classic Bugdom, playable in-browser.

## Tech Stack

- **Runtime:** Browser (ES modules, no transpilation beyond Vite)
- **Renderer:** Three.js ^0.160 (WebGL, shadow maps, fog)
- **Bundler:** Vite 5 (dev server on port 3000, output to `dist/`)
- **Language:** JavaScript (ES modules, `"type": "module"`)
- **Testing:** Vitest 1 + jsdom environment + V8 coverage
- **Hosting:** AWS Amplify (see `amplify.yml`)
- **Linting:** ESLint 10 (flat config in `eslint.config.js`)
- **CI:** GitHub Actions (lint + test on PR, Dependabot auto-merge for patch/minor)

## Commands

```bash
npm install              # Install dependencies
npm run dev              # Start Vite dev server (port 3000, auto-open)
npm run build            # Production build → dist/
npm run preview          # Preview production build
npm run lint             # ESLint (src/ only)
npm run test             # Run vitest in watch mode
npm run test:run         # Run vitest once (CI mode)
npm run test:ui          # Vitest browser UI
```

## Project Structure

```
├── index.html               # Entry point — game UI/HUD markup + styles (large file)
├── CLAUDE.md                # This file — project conventions
├── package.json             # Dependencies: three, vite, vitest, jsdom, eslint
├── eslint.config.js         # ESLint flat config (ES modules, browser globals)
├── vite.config.js           # Vite config (port 3000, dist output)
├── vitest.config.js         # Vitest config (jsdom env, V8 coverage)
├── amplify.yml              # AWS Amplify build spec
├── .claude/CLAUDE.md        # VSM agent memory (Letta) — do not edit manually
├── .github/
│   ├── dependabot.yml       # Dependabot config
│   └── workflows/
│       ├── ci.yml           # Lint + test on push/PR to main
│       └── dependabot-auto-merge.yml
└── src/
    ├── main.js              # Entry point — imports all modules, wires dependencies, starts game loop
    ├── sceneSetup.js        # Three.js scene, renderer, lighting initialization
    ├── gameLoop.js           # Main animation loop + game lifecycle (victory, game over, level-up)
    ├── gameState.js          # Pure state manager — score, health, combos, difficulty, power-ups
    ├── player.js             # PlayerCharacter class — movement, animation, damage, difficulty mods
    ├── camera.js             # Third-person follow camera + CameraController
    ├── input.js              # Keyboard input handling (WASD/arrows)
    ├── touch.js              # Mobile touch controls
    ├── collision.js          # CollisionManager — player-collectible, player-enemy detection
    ├── collectibles.js       # Clovers, coins, mushroom power-ups, BuddyBug (extra life)
    ├── enemies.js            # EnemyManager — ants, bees, spiders, slugs (ported from Jorio/Bugdom C)
    ├── levels.js             # LevelManager — terrain, rocks, flowers, boundaries, clover spawning
    ├── particles.js          # ParticleEffectsManager + RippleManager — visual effects
    ├── daynight.js           # DayNightCycle — dawn/day/dusk/night lighting transitions
    ├── audio.js              # AudioManager — Web Audio API music + SFX (procedural generation)
    ├── ui.js                 # UIManager — HUD, menus, minimap, overlays, DOM event wiring
    ├── errorHandler.js       # Global error/promise rejection handler
    └── *.test.js             # Co-located test files (vitest)
```

## Architecture

### Game Initialization Flow

`index.html` → `src/main.js` → creates all managers → wires dependencies → `gameLoop.start()`

### Manager Pattern

The game uses a **dependency-injection manager pattern**. Each system is an independent class:

1. `main.js` instantiates all managers and passes them as constructor dependencies
2. `GameLoop` receives all managers and orchestrates per-frame updates
3. `GameStateManager` is pure state (no THREE.js or DOM dependencies)
4. `UIManager` owns all DOM interactions and event listeners

### Key Systems

- **Collision:** Sphere-based detection between player ↔ collectibles ↔ enemies
- **Levels:** 4 difficulty tiers that scale enemy count/speed as clovers are collected
- **Day/Night:** Timed lighting cycle (dawn → day → dusk → night) affecting ambient + directional lights
- **Audio:** Procedural Web Audio API — no audio files, all sounds are synthesized
- **Particles:** Three.js point systems for movement trails, ripples, confetti
- **Power-ups:** Health mushroom, speed boost (1.5x, 8s), invincibility (10s)

### Event Listener Cleanup

Every module that adds event listeners provides a `cleanup()` method. `main.js` calls all cleanup methods on `beforeunload` and game restart. **Governance rule:** every `setTimeout`/`setInterval` must store its ID and use clear-before-set pattern.

## Testing

- **Framework:** Vitest with jsdom environment
- **Pattern:** Co-located test files (`src/audio.test.js` next to `src/audio.js`)
- **Coverage:** V8 provider, reports in text/json/html
- **Mocking:** Tests mock THREE.js objects and DOM APIs at the boundary
- **Run before committing:** `npm run test:run`

### Test Coverage

All 18 source modules have co-located test files:
`audio`, `camera`, `collectibles`, `collision`, `daynight`, `enemies`,
`errorHandler`, `gameLoop`, `gameState`, `initialization`, `input`,
`levels`, `particles`, `player`, `sceneSetup`, `touch`, `ui`

## CI Pipeline

CI runs on every push/PR to `main` via `.github/workflows/ci.yml`.

### Lint (gate)

- **ESLint must pass** — lint failure blocks the PR.
- Config: `eslint.config.js` (flat config, ESLint v10). Scopes to `src/` only.
- ~28 pre-existing warnings are configured as `warn`, not `error`, so they do not fail CI.
- Run locally: `npm run lint`

### Tests (non-blocking)

- **~70 of ~491 tests fail** due to jsdom not supporting WebGL canvas. These are pre-existing on `main`, NOT regressions.
- CI test step uses `continue-on-error: true` — tests report results but **do not gate PRs**.
- **Do NOT try to "fix" these WebGL test failures** unless specifically tasked with adding WebGL mocking or switching to a canvas-capable test environment.

## Before Committing

1. `npm run lint` — ESLint must pass (zero errors)
2. `npm run test:run` — run tests; ~70 WebGL-related failures are pre-existing (see CI section above)
3. No `console.log` debugging statements (removed per governance)
4. Verify event listener cleanup if you add new listeners
5. Timer IDs must be stored and cleared properly

## Code Conventions

- ES module imports/exports throughout (no CommonJS)
- Class-based managers with constructor dependency injection
- JSDoc comments on public methods
- Section headers use `// ============` comment blocks
- No TypeScript yet — JSDoc type annotations preferred where helpful
- `gameState.GameState.PLAYING | PAUSED | GAME_OVER` for state machine

## Game Controls

- **Movement:** WASD or Arrow Keys
- **Pause:** P or Space
- **Help:** H key
- **Camera:** Mouse movement (third-person follow)

## Known Issues

- `index.html` is very large (~1000 lines) — contains all UI markup and inline styles
- `enemies.js` and `levels.js` are the largest source files (>1000 lines each)
- Some README sections are outdated (e.g., "Next Steps" lists features already implemented)
- Root directory has many analysis/report markdown files from past code reviews
- No Prettier configured — no automated code formatting
- `.gitmodules` references a submodule but `ai-dev-tools/` directory is empty

## Deployment

- **AWS Amplify** — configured via `amplify.yml`
- Build: `npm run build` → `dist/`
- No environment variables required (pure client-side game)

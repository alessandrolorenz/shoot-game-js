# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

```bash
# Development server (hot reload)
npm run dev
# Then open http://localhost:5173

# Production build + preview (required to test PWA / service worker)
npm run build && npm run preview
# Then open http://localhost:4173
```

Opening `index.html` directly in a browser will NOT work — Vite bundles the JS modules and the PWA service worker requires an HTTP server.

## Tech Stack

- **Bundler**: Vite 5 (`vite.config.js`)
- **Renderer**: Three.js 0.158.0 (npm, not CDN)
- **PWA**: `vite-plugin-pwa` v1.2 — generates `dist/sw.js` via Workbox on `npm run build`
- **Language**: Vanilla ES Modules, no TypeScript, no framework

## Architecture

Entry point is `index.html` → `src/main.js` → `GridRunnerGame`. All source lives under `src/`.

### Key classes / modules

**`src/GridRunnerGame.js`** — main orchestrator. Owns the Three.js scene, camera, renderer, player, obstacle/bullet arrays, and the `LevelManager`. Game loop: `requestAnimationFrame` → `animate()` → `update()`. Key methods:
- `startGame()` — resets everything, shows level 1 banner, begins level 1
- `_handleLevelComplete()` — clears scene, shows next-level banner, calls `_applyLevelConfig()`
- `_applyLevelConfig()` — sets `gameState.speed` / `spawnInterval` from level config, releases spawn lock
- `_onEnemyKilled()` / `_onObstacleDespawned()` — kill/miss callbacks forwarded to `LevelManager`
- `_activateBomb()` — wrapper that passes the kill callback to `activateBomb()`

**`src/game/GameState.js`** — mutable game data: state machine (`LOADING` → `MENU` → `PLAYING` → `GAMEOVER`), score, high score (`localStorage`), `speed`, `spawnInterval`. **Speed and spawn interval are now set by the level config, not by time-based difficulty.** `checkDifficulty` is no longer called.

**`src/systems/levelManager.js`** — level configuration array (`LEVEL_CONFIGS`, 9 entries) and `LevelManager` class. Tracks `spawnedCount`, `killedCount`, `missedCount`, `isTransitioning`. `isLevelComplete()` returns true when every spawned enemy is either killed or has flown past. Key methods: `canSpawn()`, `recordSpawn/Kill/Miss()`, `beginTransition()`, `advanceLevel()`, `startLevel()`.

**`src/game/boss.js`** — Level 9 boss. `createBoss()` adds a 2× scale enemy to the shared `obstacles[]`. `updateBoss()` drives sine-wave lateral movement and fires 2-bullet salvos toward the player every 1.5 s. `updateBossBullets()` moves red spheres forward and triggers game over on proximity hit.

**`src/game/obstacles.js`** — `createObstacle(scene, obstacles, models, gameState, levelConfig?)`. When `levelConfig` is provided, `dodgeChance` and `multiDodge` come from it instead of the legacy speed formula. Multi-dodge enemies re-arm `nextDodgeZ` +20 units after each lane switch. Boss objects (`userData.isBoss = true`) are skipped in the Z-advance loop — their position is controlled by `boss.js`. `updateObstacles` accepts an optional `onDespawn` callback.

**`src/game/bomb.js`** — `activateBomb(obstacles, scene, gameState, bombReadyRef, playerTargetPos, onKill?)`. The `onKill` callback is invoked per removed obstacle so the level manager counts bomb kills.

### Level progression

| Level | Enemies | Speed | Spawn ms | Dodge |
|---|---|---|---|---|
| 1 | 6 | 0.18 | 1800 | none |
| 2 | 6 | 0.25 | 1400 | none |
| 3 | 10 | 0.25 | 1400 | none |
| 4 | 10 | 0.32 | 1200 | none |
| 5 | 10 | 0.32 | 1200 | 30% single-switch |
| 6 | 12 | 0.40 | 1000 | 50% single-switch |
| 7 | 15 | 0.40 | 900 | 65% single-switch |
| 8 | 15 | 0.48 | 800 | 65% multi-switch |
| 9 | Boss | — | — | Shoots projectiles |

Level advances when `killedCount + missedCount >= totalEnemies`. A 2 s banner (`#level-banner`) blocks spawning during the transition.

### Grid Coordinate System

The play field is a **3×3 grid** (configured in `CONFIG.GRID`):
- X axis: 3 columns (left/center/right), world positions at `(col − 1) × 2.5`
- Y axis: 3 rows (bottom/middle/top), same formula
- Z axis: obstacles spawn at `z = −100` and move toward `z = 0`; despawn at `z = +5`

Player movement interpolates between integer grid positions each frame (`MOVE_SPEED = 0.2` lerp factor). Collision checked when obstacle `z` is within `±1.5` of the player plane.

### 3D Assets

GLB models are served from `public/models/` (Vite `publicDir`):
- `player.glb` — player aircraft (scale 2.0)
- `enemy.glb` — enemy planes (scale ~4.5–9.0 for boss)
- `tank.glb` — tank obstacles (bottom row only, Y=0, scale ~2.5–3.0)
- `environment-models/` — background scenery (signpost, mine, watermill, watchtower)

All loaded in parallel via `GLTFLoader` at startup. Each obstacle is a `.clone()` of the cached scene. Failures fall back to geometry without error.

### PWA

`vite-plugin-pwa` (`vite.config.js`) generates:
- `dist/manifest.webmanifest` — name, fullscreen display, landscape, SVG icons
- `dist/sw.js` — Workbox service worker:
  - **Precache**: HTML, JS chunks, CSS, SVG (~572 KB total)
  - **Runtime CacheFirst**: all `/models/**/*.glb` requests (`glb-models-v1` cache, 7-day TTL)

To test offline behaviour: `npm run build && npm run preview`, then DevTools → Application → Service Workers.

### Source layout

```
src/
├── main.js                  Entry point
├── config.js                Centralised CONFIG object (grid, camera, game, bullets, dodge)
├── GridRunnerGame.js        Main orchestrator
├── style.css
│
├── assets/loader.js         GLTFLoader wrapper (parallel model loading)
│
├── core/                    Three.js setup
│   ├── camera.js
│   ├── lights.js
│   ├── renderer.js
│   └── scene.js
│
├── environment/             Scrolling world
│   ├── ground.js
│   ├── particles.js
│   └── scrolling.js
│
├── game/                    Game mechanics
│   ├── GameState.js
│   ├── bomb.js              Bomb activation + onEnemyDestroyed
│   ├── boss.js              Level 9 boss (movement + projectiles)
│   ├── bullets.js           Player bullets (auto + manual)
│   ├── obstacles.js         Spawn, move, collision, dodge, multi-dodge
│   └── player.js
│
├── systems/
│   ├── input.js             Keyboard + mobile controls
│   ├── levelManager.js      LEVEL_CONFIGS array + LevelManager class
│   └── spawn.js             shouldSpawn() timing helper
│
└── ui/
    ├── hud.js
    ├── levelUI.js           showLevelBanner, showVictoryBanner, updateLevelHUD
    └── menus.js             show/hide loading, start, game-over, back-menu screens
```

### x-index.html

Older prototype (WW2 theme). Not part of the build — ignore unless comparing earlier implementations.

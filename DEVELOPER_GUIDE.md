# Grid Airplane Game — Developer Guide

A comprehensive reference for understanding, maintaining, and extending this codebase.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Module Dependency Map](#2-module-dependency-map)
3. [Core Patterns](#3-core-patterns)
4. [Data Flow: One Game Frame](#4-data-flow-one-game-frame)
5. [State Machine](#5-state-machine)
6. [Level System Deep Dive](#6-level-system-deep-dive)
7. [Enemy & Obstacle Lifecycle](#7-enemy--obstacle-lifecycle)
8. [Combat System](#8-combat-system)
9. [Boss Phase](#9-boss-phase)
10. [UI Layer](#10-ui-layer)
11. [Environment & Rendering](#11-environment--rendering)
12. [PWA & Build Pipeline](#12-pwa--build-pipeline)
13. [How to Add a New Level](#13-how-to-add-a-new-level)
14. [How to Add a New Enemy Type](#14-how-to-add-a-new-enemy-type)
15. [How to Add a New Power-up](#15-how-to-add-a-new-power-up)
16. [How to Add a New Game Mechanic](#16-how-to-add-a-new-game-mechanic)
17. [Common Gotchas & Pitfalls](#17-common-gotchas--pitfalls)
18. [Performance Notes](#18-performance-notes)
19. [Config Reference](#19-config-reference)
20. [Naming & Style Conventions](#20-naming--style-conventions)

---

## 1. Architecture Overview

The game is a **single-class orchestrator + pure-function modules** design. One top-level class (`GridRunnerGame`) owns all mutable state and calls into stateless helper modules each frame.

```
index.html
  └── src/main.js          ← entry: new GridRunnerGame(), PWA install prompt
        └── GridRunnerGame.js   ← owns ALL shared arrays & state
              ├── core/         ← Three.js scene/camera/renderer/lights (setup only)
              ├── assets/       ← GLTFLoader wrapper (parallel load)
              ├── environment/  ← ground, scrolling tiles, buildings, particles
              ├── game/         ← player, obstacles, bullets, bomb, boss, GameState
              ├── systems/      ← input, spawn timing, level manager, difficulty
              └── ui/           ← HUD, level banners, menus (DOM only, no Three.js)
```

**Key principle:** modules under `game/`, `environment/`, `systems/`, and `ui/` are **stateless pure functions** (or minimal classes). They receive what they need as arguments; they do not import `GridRunnerGame` and do not hold references to each other. All coordination happens in `GridRunnerGame`.

---

## 2. Module Dependency Map

```
GridRunnerGame.js
  ├── game/GameState.js        ← score, speed, spawnInterval, state machine
  ├── core/scene.js            ← createScene()
  ├── core/camera.js           ← createCamera()
  ├── core/renderer.js         ← createRenderer(), onWindowResize()
  ├── core/lights.js           ← setupLights()
  ├── assets/loader.js         ← loadAssets() → { player, enemy, tank, envModels[] }
  ├── environment/ground.js    ← setupGround()
  ├── environment/scrolling.js ← setupScrollingEnvironment(), setupSideBuildings(),
  │                               updateScrollingEnvironment()
  ├── environment/particles.js ← setupParticles(), updateParticles()
  ├── game/player.js           ← createPlayer(), updatePlayerPosition(), movePlayer()
  ├── game/obstacles.js        ← createObstacle(), updateObstacles()
  ├── game/bullets.js          ← createBullet(), checkAutoShoot(), manualShoot(),
  │                               updateBullets()
  ├── game/bomb.js             ← onEnemyDestroyed(), activateBomb()
  ├── game/boss.js             ← createBoss(), updateBoss(), updateBossBullets()
  ├── systems/input.js         ← setupKeyboard(), setupMobileControls()
  ├── systems/spawn.js         ← shouldSpawn()
  ├── systems/levelManager.js  ← LEVEL_CONFIGS[], LevelManager class
  ├── ui/menus.js              ← hide/show loading, start, game-over screens
  └── ui/levelUI.js            ← showLevelBanner(), showVictoryBanner(), updateLevelHUD()
```

> `systems/difficulty.js` exists but is **unused** — `checkDifficulty()` is never called. Speed and spawn interval are driven entirely by `LEVEL_CONFIGS`.

---

## 3. Core Patterns

### 3.1 Shared Mutable Arrays Passed by Reference

`GridRunnerGame` owns `obstacles[]`, `bullets[]`, and `bossBullets[]`. These arrays are passed directly into every function that needs them. Functions splice from them in reverse-index loops to safely remove items mid-iteration.

```js
// Safe removal pattern used throughout
for (let i = array.length - 1; i >= 0; i--) {
    if (shouldRemove(array[i])) {
        scene.remove(array[i]);
        array.splice(i, 1);
    }
}
```

### 3.2 userData as Entity Component Data

Three.js objects carry all their game data in `mesh.userData`:

```js
obstacle.userData = {
    gridX, gridY,          // grid position (integer)
    z,                     // world Z (float, advances each frame)
    baseScale,             // scale before depth scaling
    health,                // hit points
    type,                  // 'enemy' | 'tank' | 'boss'
    isBoss,                // skips normal Z advancement
    willDodge, dodging,    // dodge state machine
    dodgeProgress,         // lerp progress [0..1]
    sourceWorldX,          // world X at dodge start
    targetGridX,           // destination grid column
    canMultiDodge,         // re-arms after each dodge
    nextDodgeZ,            // Z threshold for next dodge trigger
};
```

This keeps all game logic co-located with the object it describes, without needing a separate entity registry.

### 3.3 Callback Injection for Cross-Module Events

Rather than a global event bus, `GridRunnerGame` injects callback functions into modules that need to signal back:

```js
// GridRunnerGame.update():
updateObstacles(obstacles, scene, gameState, playerGridPos,
    () => this._onObstacleDespawned()   // ← injected callback
);

updateBullets(bullets, obstacles, scene,
    () => this._onEnemyKilled()         // ← injected callback
);
```

This keeps modules decoupled: `updateBullets` doesn't know about `LevelManager`; it just calls back.

### 3.4 Ref Objects for Mutable Primitives

Because JS passes primitives by value, mutable flags are wrapped in single-key objects:

```js
this.destroyedCount = { value: 0 };
this.bombReady      = { value: false };
```

Functions receive these objects and mutate `.value`, allowing side-effects to be visible to the caller.

### 3.5 Grid Coordinate System

All game logic uses integer **grid coordinates** (`gridX` 0–2, `gridY` 0–2). World positions are derived on demand:

```js
worldX = (gridX - 1) * CONFIG.GRID.SPACING;  // e.g. col 0→-2.5, 1→0, 2→+2.5
worldY = (gridY - 1) * CONFIG.GRID.SPACING;
```

Collision detection uses rounded grid positions, avoiding floating-point drift:

```js
const playerX = Math.round(playerGridPos.x);  // lerped float → integer
if (playerX === obstacle.userData.gridX) ...
```

### 3.6 Level Config as Data, Not Code

All difficulty parameters live in a flat array of plain objects (`LEVEL_CONFIGS`), not in branching logic. Adding, reordering, or tweaking a level is a one-line data change with no code changes required.

---

## 4. Data Flow: One Game Frame

```
requestAnimationFrame
  └── GridRunnerGame.animate()
        └── GridRunnerGame.update()
              │
              ├─ gameState.updateScore(dt)          // +time*10 pts per second
              │
              ├─ updatePlayerPosition(player, ...)  // lerp grid→world
              │
              ├─ updateObstacles(...)               // Z advance, dodge, collision, despawn
              │    └─ onDespawn() → levelManager.recordMiss()
              │
              ├─ checkAutoShoot / updateBullets()   // spawn & move bullets, hit detection
              │    └─ onEnemyDestroyed() → levelManager.recordKill() + bomb charge
              │
              ├─ updateScrollingEnvironment()       // ground tiles, stripes, buildings
              ├─ updateParticles()                  // particle Z wrap-around
              │
              ├─ [boss phase only]
              │    ├─ createBoss() once via levelManager.canSpawn()
              │    ├─ updateBoss() → sine movement + fire salvos
              │    └─ updateBossBullets() → move + player collision
              │
              ├─ [normal levels] shouldSpawn() + createObstacle()
              │    └─ levelManager.recordSpawn()
              │
              └─ levelManager.isLevelComplete() → _handleLevelComplete()
                    └─ levelManager.advanceLevel() + showLevelBanner(onComplete)
                          └─ onComplete: _applyLevelConfig()
                                └─ levelManager.startLevel() ← releases spawn lock
```

---

## 5. State Machine

`GameState.state` drives what logic runs each frame:

```
LOADING  ──→  MENU  ──→  PLAYING  ──→  GAMEOVER
               ↑             │              │
               └─────────────┴──────────────┘
                    goToMenu() / restartGame()
```

| State     | What happens                                             |
|-----------|----------------------------------------------------------|
| `LOADING` | Assets loading; loading screen shown                     |
| `MENU`    | Start screen shown; `update()` skips game logic          |
| `PLAYING` | Full game loop active                                    |
| `GAMEOVER`| Score/high-score shown; game loop paused                 |

`update()` checks `this.gameState.state === 'PLAYING'` at the top — everything inside is gated on it.

---

## 6. Level System Deep Dive

### LEVEL_CONFIGS array (`src/systems/levelManager.js`)

Each entry is a plain object:

| Field           | Type    | Description                                               |
|-----------------|---------|-----------------------------------------------------------|
| `level`         | number  | 1-based label (cosmetic only)                             |
| `totalEnemies`  | number  | Enemies to spawn before the level can complete            |
| `spawnInterval` | ms      | Minimum time between spawns                               |
| `enemySpeed`    | float   | Z units advanced per frame (set on `gameState.speed`)     |
| `dodgeChance`   | 0–1     | Probability each spawned enemy will lane-switch           |
| `multiDodge`    | boolean | Whether enemies re-arm their dodge after each switch      |
| `isBoss`        | boolean | Activates boss spawn path instead of normal obstacles     |
| `bossHealth`    | number  | Hit-points (boss levels only)                             |

### LevelManager class

```
LevelManager
  currentLevelIndex  → 0-based index into LEVEL_CONFIGS
  currentLevel       → getter: currentLevelIndex + 1
  config             → getter: LEVEL_CONFIGS[currentLevelIndex]
  spawnedCount       → incremented by recordSpawn()
  killedCount        → incremented by recordKill()
  missedCount        → incremented by recordMiss()
  clearedCount       → getter: killed + missed
  isTransitioning    → spawn & completion checks are disabled while true
```

**Level complete condition:** `spawnedCount >= totalEnemies && clearedCount >= totalEnemies`

This means every enemy must be either killed or fly past — no indefinite waiting.

### Transition sequence

```
isLevelComplete() === true
  → _handleLevelComplete()
      → levelManager.beginTransition()    // locks spawning
      → _clearScene()                     // remove all obstacles/bullets
      → levelManager.advanceLevel()       // currentLevelIndex++
      → showLevelBanner(level, isBoss, callback)
            // 2-second timer fires callback:
            → _applyLevelConfig()
                → gameState.speed = cfg.enemySpeed
                → gameState.spawnInterval = cfg.spawnInterval
                → levelManager.startLevel()  // resets counts, clears isTransitioning
```

---

## 7. Enemy & Obstacle Lifecycle

```
createObstacle()
  → randomize gridX, gridY
  → clone GLB model (enemy/tank) or fallback BoxGeometry
  → assign userData (health, dodge state, etc.)
  → scene.add() + obstacles.push()

updateObstacles() [each frame]
  → skip if userData.isBoss (boss.js controls its position)
  → userData.z += gameState.speed
  → if willDodge && z >= nextDodgeZ → start dodge (set targetGridX, dodging=true)
  → if dodging → advance dodgeProgress, lerp worldX via smoothstep
  → if dodgeProgress >= 1 → finalize (gridX = targetGridX)
      → if canMultiDodge → re-arm nextDodgeZ = z + 20
      → else willDodge = false
  → updateObstaclePosition() → set mesh position + depth scale
  → if |z| < COLLISION_THRESHOLD && gridX/Y matches player → gameOver()
  → if z > DESPAWN_Z → scene.remove() + splice + onDespawn()
```

**Depth scaling formula:**

```js
const scale = 1 + (obstacle.userData.z + CONFIG.GRID.SPAWN_Z) * 0.015;
obstacle.scale.setScalar(baseScale * scale);
```

Obstacles start small at z=−100 and grow to `baseScale` as they approach z=0.

### Health values

| Type   | Health | Notes                           |
|--------|--------|---------------------------------|
| Enemy  | 2      | 2 bullet hits to destroy        |
| Tank   | 6      | Bottom row only (gridY === 0)   |
| Boss   | 30     | (configurable in LEVEL_CONFIGS) |

---

## 8. Combat System

### Bullet flow

```
Auto mode:  checkAutoShoot() → every 300ms → createBullet()
Manual mode: Space key / btn-shoot → manualShootFn() → createBullet()

updateBullets() [each frame]:
  → bullet.position.z -= BULLETS.SPEED (2.5 u/frame)
  → if z < -120 → despawn (geometry.dispose())
  → for each obstacle: distance check vs HIT_RADIUS (2.5)
      → hit: obs.userData.health--
      → if health <= 0: scene.remove(obs) + onEnemyDestroyed()
      → bullet is always removed on any hit
```

### Bomb mechanic

- Tracks kills in `destroyedCount.value` (increments in `onEnemyDestroyed`)
- Every 10 kills (destroyedCount % 10 === 0) → `bombReady.value = true` + show btn-bomb
- `activateBomb()`: removes all obstacles sharing the player's exact `gridX`/`gridY`
- Calls `onKill()` per removal so `LevelManager.recordKill()` counts them

> Note: The bomb currently targets only the player's exact cell, not an entire column or row.

### Score accumulation

- +`deltaTime * 10` per frame while playing (time-based)
- +100 flat per enemy kill (in `onEnemyDestroyed`)
- High score persisted to `localStorage` key `'highScore'`

---

## 9. Boss Phase

The boss level (level 9) bypasses the normal spawn/obstacle pipeline:

```
_applyLevelConfig() sets gameState.speed = 0.35 (environment keeps scrolling)

In update():
  if levelCfg.isBoss:
    if canSpawn() && !bossRef:
      bossRef = createBoss(scene, obstacles, models, bossHealth)
      levelManager.recordSpawn()   // spawnedCount = 1, totalEnemies = 1

    if bossRef && bossRef.parent:
      updateBoss(...)    // sine movement, fires salvos
      updateBossBullets(...)   // moves red spheres + player hit detection
```

**Boss is in `obstacles[]`**: normal `updateBullets()` hit detection applies. When `health <= 0`, `bullets.js` calls `scene.remove(boss)` and the `onEnemyDestroyed` callback fires. On next frame `bossRef.parent` is null, so `updateBoss` skips — then `isLevelComplete()` returns true, triggering the victory banner.

**Boss bullet behaviour:**
- Fires 2-bullet salvos every 1500ms
- Shot 1: aimed directly at player's current world X/Y
- Shot 2: offset ±1 lane from Shot 1
- Bullets travel at 0.14 Z/frame (slow, forcing precise dodging)
- Collision radius: 2.0 world units

---

## 10. UI Layer

The UI is entirely DOM-based (no Three.js). Three.js renders into `#game-canvas`; the `.ui-overlay` sits on top via `position: fixed`.

### Screen hierarchy

```
.ui-overlay
  ├── #loading          (loading/splash screen)
  ├── #hud              (score, high score, kills, level)
  ├── #level-banner     (transition banner — animated in/out via CSS class)
  ├── #btn-back-menu    (← Menu button during play)
  ├── #start-screen     (mode selection)
  ├── #game-over-screen (score + restart)
  ├── #mobile-controls  (d-pad buttons)
  └── #action-btns      (#btn-shoot, #btn-bomb)
```

### Visibility pattern

Elements use either:
- `.hidden` class → `display: none` (removed from layout)
- `.visible` class → opacity/transform transition into view

This dual pattern exists for historical reasons. New elements should prefer `.hidden`/`.visible` consistently.

### Banner timing

`showLevelBanner()` in `levelUI.js` drives the spawn lock:

```js
banner.classList.add('visible');         // CSS fade-in
bannerTimer = setTimeout(() => {
    banner.classList.remove('visible');
    if (onComplete) onComplete();        // releases spawn lock
}, 2000);
```

The 2-second delay is hard-coded. If you change it, ensure enemies don't spawn before the banner is gone (or make spawn lock independent of the banner).

---

## 11. Environment & Rendering

### Three.js setup

| Setting              | Value                                         |
|----------------------|-----------------------------------------------|
| Background           | `0x0a0a0a` (near-black)                       |
| Fog                  | Linear, near=30, far=60                        |
| Lights               | AmbientLight + DirectionalLight + HemisphereLight |
| Shadow map           | PCFSoftShadowMap                              |
| Pixel ratio cap      | `Math.min(devicePixelRatio, 2)`               |
| Camera FOV           | 70°, positioned at (0, 7, 8), looking at (0, -1, -8) |

### Scrolling world

The illusion of movement comes from three independently scrolling layers, all moving at `gameState.speed` per frame:

| Layer          | Objects       | Reset when z >  | Reset offset |
|----------------|---------------|-----------------|--------------|
| Ground tiles   | 3 PlaneGeometry | 30            | −120         |
| Road stripes   | 10 PlaneGeometry | 6            | −120         |
| Side buildings | 40 objects    | 15              | −295         |

Buildings are GLB clones (from `envModels[]`) when models load, otherwise procedural `BoxGeometry` with optional glow roof strips.

### Particles

150 points in a `BufferGeometry`, randomly distributed across the field. Each frame:

```js
pos[i * 3 + 2] += speed * 3;  // move toward camera 3× faster than obstacles
if (pos[z] > 7) reset to z = -100  // wrap around
```

---

## 12. PWA & Build Pipeline

### Vite config

- `manualChunks: { three: ['three'] }` → Three.js goes into its own bundle chunk
- Target: `es2020`
- `publicDir: 'public'` → GLB models served from `public/models/`

### Service worker (Workbox via vite-plugin-pwa)

- **Precache**: `html, css, js, svg, ico, woff, woff2` — app shell only
- **GLB models**: `CacheFirst` runtime cache, 7-day TTL, 20-entry limit
- GLBs are NOT precached (too large), but cached after first load
- `clientsClaim: true`, `skipWaiting: true` → updates take over immediately

### Testing PWA

```bash
npm run build && npm run preview
# open http://localhost:4173
# DevTools → Application → Service Workers
```

### Install banner

`main.js` captures `beforeinstallprompt` (Chromium only) and shows a custom banner after 3 seconds. iOS users follow the native Share → Add to Home Screen path.

---

## 13. How to Add a New Level

Add one entry to `LEVEL_CONFIGS` in [src/systems/levelManager.js](src/systems/levelManager.js):

```js
// Example: level 10 with new ultra-speed multi-dodge
{ level: 10, totalEnemies: 20, spawnInterval: 600, enemySpeed: 0.60,
  dodgeChance: 0.80, multiDodge: true },
```

Then add a subtitle in `SUBTITLES` in [src/ui/levelUI.js](src/ui/levelUI.js):

```js
const SUBTITLES = {
    // ...existing entries...
    10: 'Maximum chaos!',
};
```

That's it. No other code changes are needed.

> The level system is driven entirely by data. `LevelManager.hasNextLevel()` uses `LEVEL_CONFIGS.length - 1` dynamically, so the victory condition always triggers after the last entry.

---

## 14. How to Add a New Enemy Type

**Step 1 — Add the model** (optional)

Place your `.glb` in `public/models/` and load it in [src/assets/loader.js](src/assets/loader.js):

```js
models.newEnemy = await loadModel('/models/new-enemy.glb');
```

**Step 2 — Spawn it in createObstacle()**

In [src/game/obstacles.js](src/game/obstacles.js), add a branch in `createObstacle()`:

```js
if (gridY === 1 && models.newEnemy) {
    obstacle = models.newEnemy.clone();
    // set rotation, scale, etc.
    baseScale = 3.0;
} else if (gridY === 0 && models.tank) {
    // existing tank code...
```

**Step 3 — Set userData**

Add any custom fields to `obstacle.userData`. Existing fields (`health`, `type`, `willDodge`, etc.) are required for the rest of the system to work:

```js
obstacle.userData = {
    gridX, gridY, z: CONFIG.GRID.SPAWN_Z,
    baseScale, health: 4,
    type: 'newEnemy',
    isBoss: false,
    willDodge: false,
    // ...all other required fields
};
```

**Step 4 — Add level config support** (optional)

If your enemy needs per-level parameters, add them to `LEVEL_CONFIGS` entries and read them in `createObstacle()` via `levelConfig.yourNewField`.

---

## 15. How to Add a New Power-up

Power-ups should follow the same pattern as the bomb:

**Step 1 — Track the charge**

In `GridRunnerGame`, add a new ref:

```js
this.shieldReady = { value: false };
```

**Step 2 — Charge it in onEnemyKilled()**

In `GridRunnerGame._onEnemyKilled()` (or in `bomb.js:onEnemyDestroyed()`) add your threshold check:

```js
if (destroyedCountRef.value % 15 === 0) {
    shieldReadyRef.value = true;
    document.getElementById('btn-shield').classList.add('visible');
}
```

**Step 3 — Activate it**

Create `src/game/shield.js` following the `bomb.js` pattern: pure function, accepts scene/gameState/ref/callback, returns nothing. Wire it into `GridRunnerGame.setupUI()` and `setupControls()`.

**Step 4 — Add the DOM button**

In `index.html`, add to `#action-btns`:

```html
<button id="btn-shield">🛡️</button>
```

In `src/ui/menus.js`, add `resetShieldUI()` similar to `resetBombUI()`.

---

## 16. How to Add a New Game Mechanic

### New movement direction (e.g. diagonal)

1. In [src/systems/input.js](src/systems/input.js), add key cases and call `movePlayer('upright')` etc.
2. In [src/game/player.js](src/game/player.js) `movePlayer()`, handle the new case by adjusting both `x` and `y` simultaneously.

### New obstacle behaviour (e.g. homing enemy)

1. Add a boolean to `obstacle.userData` (e.g. `isHoming: true`)
2. In `updateObstacles()` in [src/game/obstacles.js](src/game/obstacles.js), add a new branch before `updateObstaclePosition()`:
   ```js
   if (obstacle.userData.isHoming) {
       // adjust gridX toward playerGridPos.x each frame
   }
   ```

### New scoring event

All score mutations go through `GameState`. Add a method:

```js
// In GameState.js
addBonusScore(amount) {
    this.score += amount;
    this.updateUI();
}
```

Then call it from whatever module detects the scoring event, passing it as a callback from `GridRunnerGame`.

### New screen/state

1. Add HTML to `index.html`
2. Add show/hide helpers to `src/ui/menus.js`
3. If the new state suspends gameplay, add it to the `GameState` state machine and gate `update()` accordingly

---

## 17. Common Gotchas & Pitfalls

### Removing from arrays mid-iteration

**Always iterate backwards** when removing from `obstacles[]`, `bullets[]`, or `bossBullets[]`:

```js
// CORRECT
for (let i = array.length - 1; i >= 0; i--) {
    if (condition) array.splice(i, 1);
}

// WRONG — skips elements after a splice
for (let i = 0; i < array.length; i++) {
    if (condition) array.splice(i, 1);
}
```

### Boss skipped in updateObstacles

`updateObstacles()` has an early `continue` for boss objects:

```js
if (obstacle.userData.isBoss) continue;
```

Any new enemy type that needs special per-frame movement must set `isBoss: true` (or add its own flag and skip condition) to avoid the standard Z-advance overwriting its position.

### isTransitioning must be cleared

After `levelManager.beginTransition()` is called, **nothing will spawn and isLevelComplete() always returns false** until `levelManager.startLevel()` is called. `startLevel()` is called inside `_applyLevelConfig()`, which is the `onComplete` callback of `showLevelBanner`. If you add a custom banner or transition, ensure `startLevel()` is always called.

### geometry.dispose() on bullet removal

Bullets are created with `new THREE.SphereGeometry(...)` each time (not cloned from a shared asset). Forgetting `geometry.dispose()` leaks GPU memory:

```js
scene.remove(bullet);
bullet.geometry.dispose();  // ← required
bullets.splice(i, 1);
```

Obstacles are cloned GLB models — their geometry is shared with the original, so **do not dispose** it on obstacle removal.

### playerGridPos vs playerTargetPos

| Variable          | Type  | Description                                      |
|-------------------|-------|--------------------------------------------------|
| `playerTargetPos` | {x,y} | Integer grid cell the player is moving toward    |
| `playerGridPos`   | {x,y} | Lerped float position (visual, used for world XY)|

Collision detection rounds `playerGridPos.x/y` to get the integer cell. Input writes to `playerTargetPos`. Never use `playerGridPos` directly for game logic without rounding.

### Bomb targets exact grid cell, not lane

`activateBomb()` only removes obstacles where `obs.userData.gridX === gridX && obs.userData.gridY === gridY`. Enemies in adjacent cells are unaffected.

### shouldSpawn uses Date.now(), not deltaTime

`shouldSpawn(lastSpawnTime, spawnInterval)` compares `Date.now()` — wall clock milliseconds. `spawnInterval` in `LEVEL_CONFIGS` is also in ms. Don't mix this with `deltaTime` (seconds from Three.js Clock).

---

## 18. Performance Notes

### MAX_OBSTACLES cap

`CONFIG.GAME.MAX_OBSTACLES = 20` prevents unbounded obstacle accumulation. `createObstacle()` returns early if this limit is reached.

### Depth scaling is cheap

The per-frame scale update uses `setScalar()` which is a single Three.js call. It's safe to have it on every obstacle every frame.

### Particle buffer is shared

The particle `Float32Array` is mutated in-place each frame, then `needsUpdate = true` flushes it to GPU. This is efficient; do not create new BufferGeometry or BufferAttribute each frame.

### Environment objects never dispose

Ground tiles, road stripes, and side buildings are created once and scrolled in a wrap-around loop. They are never removed or re-created mid-game.

### Shadow map scope

The directional light shadow camera covers −20 to +20 in X/Y. Objects far from this range won't cast shadows. Extend if you add enemies that start off-field.

---

## 19. Config Reference

All tunable constants live in [src/config.js](src/config.js):

```js
CONFIG.GRID = {
    X_POSITIONS: 3,         // number of columns
    Y_POSITIONS: 3,         // number of rows
    SPACING: 2.5,           // world units between cells
    SPAWN_Z: -100,          // obstacles start here
    DESPAWN_Z: 5,           // obstacles removed here
    COLLISION_THRESHOLD: 1.5 // |z| < this triggers collision check
}

CONFIG.CAMERA = {
    FOV: 70,
    POSITION: { x:0, y:7, z:8 },
    LOOKAT: { x:0, y:-1, z:-8 }
}

CONFIG.GAME = {
    BASE_SPEED: 0.2,           // initial obstacle speed (overridden by level config)
    BASE_SPAWN_INTERVAL: 1000, // initial spawn interval (overridden by level config)
    SPEED_INCREASE: 1.08,      // multiplier for legacy difficulty system (unused)
    SPAWN_DECREASE: 0.95,      // multiplier for legacy difficulty system (unused)
    DIFFICULTY_INTERVAL: 10000,// legacy difficulty system (unused)
    MAX_OBSTACLES: 20
}

CONFIG.PLAYER = {
    MOVE_SPEED: 0.2,  // lerp factor per frame (higher = snappier)
    SCALE: 2.0
}

CONFIG.BULLETS = {
    SPEED: 2.5,       // Z units per frame
    FIRE_RATE: 300,   // ms between shots
    DESPAWN_Z: -120,  // removed when z < this
    HIT_RADIUS: 2.5,  // distance-based collision radius
    SIZE: 0.45        // sphere radius
}

CONFIG.ENEMY_DODGE = {
    SWITCH_Z: -50,      // Z at which first dodge triggers (legacy, overridden by level config)
    SWITCH_SPEED: 0.05, // lerp rate per frame (~20 frames per dodge at 60fps)
    MIN_SPEED: 0.25,    // min gameState.speed before legacy dodge activates
    MAX_CHANCE: 0.65    // cap on legacy dodge probability
}
```

> `CONFIG.GAME.SPEED_INCREASE`, `SPAWN_DECREASE`, `DIFFICULTY_INTERVAL` and `CONFIG.ENEMY_DODGE.MIN_SPEED`/`MAX_CHANCE` belong to the legacy time-based difficulty system. They are not used in current gameplay but are preserved for reference.

---

## 20. Naming & Style Conventions

### Files

- `camelCase.js` for all modules
- `PascalCase.js` for class files (`GridRunnerGame.js`, `GameState.js`)

### Functions

- `setup*()` — one-time scene construction (returns created objects)
- `update*()` — per-frame mutation (returns nothing or a mutated value)
- `create*()` — creates and adds a Three.js object to the scene
- `show*/hide*()` — DOM visibility toggles
- `_privateMethods()` prefixed with `_` when on a class

### Callbacks convention

When a module needs to signal upward (without importing the caller), it receives a nullable callback:

```js
function updateObstacles(obstacles, scene, gameState, playerGridPos, onDespawn) {
    // ...
    if (onDespawn) onDespawn();
}
```

Always guard with `if (callback) callback()` to keep modules usable without wiring.

### userData fields

All Three.js objects that participate in game logic must have a complete `userData` block assigned at creation time. Do not add fields to `userData` after creation — it makes the data contract unclear.

---

*Last updated: April 2026*

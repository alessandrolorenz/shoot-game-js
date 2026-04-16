# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

The game requires an HTTP server to load `.glb` 3D models (CORS blocks `file://` access):

```bash
# Python (built-in)
python -m http.server 8000
# Then open http://localhost:8000/index.html

# Node.js
npx http-server -p 8000
```

Opening `index.html` directly in a browser still works, but 3D models won't load — the game falls back to geometric primitives (cone for player, boxes for enemies).

## Architecture

The entire game lives in a single file: **[index.html](index.html)**. There is no build step, no bundler, and no dependencies beyond Three.js loaded via CDN using an import map.

Three.js version is pinned at `0.158.0` via `https://unpkg.com/three@0.158.0/`.

### Key Classes

**`GameState`** — owns all mutable game data: state machine (`LOADING` → `MENU` → `PLAYING` → `GAMEOVER`), score, high score (persisted to `localStorage`), current speed, and spawn interval. Handles difficulty escalation (+8% speed, −5% spawn interval every 10 seconds).

**`GridRunnerGame`** — main class that owns the Three.js scene, camera, renderer, player mesh, and the live obstacles array. Calls `GameState` methods for state transitions. The game loop runs via `requestAnimationFrame` → `animate()` → `update()`.

### Grid Coordinate System

The play field is a **3×3 grid** (configured in `CONFIG.GRID`):
- X axis: 3 columns (left/center/right), world positions at `(col − 1) × 2.5`
- Y axis: 3 rows (bottom/middle/top), same formula
- Z axis: obstacles spawn at `z = −100` and move toward the player at `z = 0`; despawn at `z = +5`

Player movement interpolates between integer grid positions each frame using `MOVE_SPEED = 0.2` (lerp factor). Collision is checked only when an obstacle's `z` is within `±1.5` of the player plane.

### 3D Assets

GLB models live in [models/](models/):
- `player.glb` — player aircraft (scale 2.4, rotated −90° Y)
- `enemy.glb` — enemy plane obstacles (scale ~4.5–5.0, rotated −90° Y)
- `tank.glb` — tank obstacles used only on the bottom row (Y=0, scale ~2.5–3.0)

All three are loaded in parallel via `GLTFLoader` at startup. Each obstacle is a `.clone()` of the cached model scene. If any model fails to load, the game substitutes a geometric fallback without error.

### x-index.html

`x-index.html` is an older prototype/scratch file (WW2 theme, sky-blue background). It is not served as the main game — ignore it unless comparing earlier implementations.



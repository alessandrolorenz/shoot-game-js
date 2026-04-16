/**
 * Level configuration and progression manager.
 *
 * Each level defines:
 *  - totalEnemies   : exact enemies to spawn before level can complete
 *  - spawnInterval  : ms between spawns
 *  - enemySpeed     : obstacle Z-movement per frame (gameState.speed)
 *  - dodgeChance    : probability [0–1] that an enemy will perform a lane switch
 *  - multiDodge     : whether enemies can switch lanes multiple times mid-flight
 *  - isBoss         : flags the boss phase (level 9)
 *  - bossHealth     : hit-points for the boss
 */
export const LEVEL_CONFIGS = [
    // ── Level 1 ── Very slow, few enemies, no dodging (tutorial feel)
    { level: 1, totalEnemies: 6,  spawnInterval: 1800, enemySpeed: 0.18, dodgeChance: 0,    multiDodge: false },
    // ── Level 2 ── Same count, faster spawn + movement
    { level: 2, totalEnemies: 6,  spawnInterval: 1400, enemySpeed: 0.25, dodgeChance: 0,    multiDodge: false },
    // ── Level 3 ── More enemies introduced
    { level: 3, totalEnemies: 10, spawnInterval: 1400, enemySpeed: 0.25, dodgeChance: 0,    multiDodge: false },
    // ── Level 4 ── Same count, noticeably faster movement
    { level: 4, totalEnemies: 10, spawnInterval: 1200, enemySpeed: 0.32, dodgeChance: 0,    multiDodge: false },
    // ── Level 5 ── Lane-switching introduced (30% of enemies dodge once)
    { level: 5, totalEnemies: 10, spawnInterval: 1200, enemySpeed: 0.32, dodgeChance: 0.30, multiDodge: false },
    // ── Level 6 ── Speed increase + more dodgers
    { level: 6, totalEnemies: 12, spawnInterval: 1000, enemySpeed: 0.40, dodgeChance: 0.50, multiDodge: false },
    // ── Level 7 ── More enemies, most of them dodge
    { level: 7, totalEnemies: 15, spawnInterval: 900,  enemySpeed: 0.40, dodgeChance: 0.65, multiDodge: false },
    // ── Level 8 ── Multi-dodge: enemies switch lanes several times en route
    { level: 8, totalEnemies: 15, spawnInterval: 800,  enemySpeed: 0.48, dodgeChance: 0.65, multiDodge: true  },
    // ── Level 9 ── Boss fight (optional phase)
    { level: 9, totalEnemies: 1,  spawnInterval: 0,    enemySpeed: 0,    dodgeChance: 0,    multiDodge: false,
      isBoss: true, bossHealth: 30 },
];

export class LevelManager {
    constructor() {
        this.currentLevelIndex = 0;
        this.spawnedCount = 0;
        this.killedCount  = 0;
        this.missedCount  = 0;   // enemies that flew past the player
        this.isTransitioning = false;
    }

    /** 1-based current level number */
    get currentLevel() { return this.currentLevelIndex + 1; }

    /** Config object for the active level */
    get config() { return LEVEL_CONFIGS[this.currentLevelIndex]; }

    /** Total enemies gone this level (killed OR flew past) */
    get clearedCount() { return this.killedCount + this.missedCount; }

    /** Full reset to level 1 (called on new game) */
    reset() {
        this.currentLevelIndex = 0;
        this.startLevel();
    }

    /** Reset per-level counters and clear the transition lock */
    startLevel() {
        this.spawnedCount    = 0;
        this.killedCount     = 0;
        this.missedCount     = 0;
        this.isTransitioning = false;
    }

    /** Prevent spawning and level-complete checks during the banner animation */
    beginTransition() { this.isTransitioning = true; }

    // ── Spawn control ─────────────────────────────────────────────────────────

    canSpawn() {
        return !this.isTransitioning && this.spawnedCount < this.config.totalEnemies;
    }

    recordSpawn() { this.spawnedCount++; }

    // ── Kill / miss tracking ──────────────────────────────────────────────────

    recordKill() { this.killedCount++; }
    recordMiss() { this.missedCount++; }

    // ── Completion check ──────────────────────────────────────────────────────

    /**
     * Level is complete when every enemy that was spawned has either been
     * destroyed by the player or has flown past the player plane.
     */
    isLevelComplete() {
        if (this.isTransitioning) return false;
        return this.spawnedCount >= this.config.totalEnemies &&
               this.clearedCount >= this.config.totalEnemies;
    }

    hasNextLevel() {
        return this.currentLevelIndex < LEVEL_CONFIGS.length - 1;
    }

    /** Advance index only — caller must call startLevel() when ready */
    advanceLevel() {
        this.currentLevelIndex++;
    }
}

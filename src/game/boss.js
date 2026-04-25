/**
 * Boss system — Level 9 phase.
 *
 * The boss:
 *  - Is spawned once and placed at a fixed Z depth (−35)
 *  - Does NOT advance toward the player on Z (unlike normal obstacles)
 *  - Moves laterally in a sine-wave pattern across X and Y
 *  - Fires red projectiles toward the player every 1.5 s
 *  - Has high health (30 hits by default)
 *  - Is stored in the shared obstacles[] array so existing bullet-hit logic
 *    works without modification
 */

import * as THREE from 'three';
import { CONFIG } from '../config.js';

const BOSS_Z          = -35;          // fixed depth
const BOSS_SHOOT_MS   = 3000;         // ms between salvos
const BOSS_BULLET_SPD = 0.14;         // Z units per frame
const BOSS_BULLET_RAD = 0.55;         // visual radius
const BOSS_HIT_RADIUS = 0.5;          // collision radius for boss bullets vs player
const BOSS_FIRST_SHOT_DELAY = 3000;   // grace period before the very first salvo

// ── Creation ─────────────────────────────────────────────────────────────────

/**
 * Spawn the boss and push it into the obstacles array (so bullets can hit it).
 * Returns the boss mesh so GridRunnerGame can keep a reference.
 */
export function createBoss(scene, obstacles, models, health = 30) {
    let boss;
    let baseScale;

    if (models.boss) {
        boss = models.boss.clone();
        baseScale = 4.0;
        boss.scale.set(baseScale, baseScale, baseScale);
    } else if (models.enemy) {
        boss = models.enemy.clone();
        boss.rotation.x = 160;
        boss.rotation.y = Math.PI / -2;
        baseScale = 9.0;
        boss.scale.set(baseScale, baseScale, baseScale);
    } else {
        // Fallback geometry
        const geo = new THREE.BoxGeometry(12, 12, 12);
        const mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        boss = new THREE.Mesh(geo, mat);
        baseScale = 1;
    }

    boss.castShadow = true;

    // Populate userData so bullets.js hit-detection and obstacles.js both work
    boss.userData = {
        gridX:          1,
        gridY:          1,
        z:              BOSS_Z,
        baseScale,
        health,
        type:           'boss',
        isBoss:         true,
        bossTime:       0,
        lastShootTime:  Date.now() + BOSS_FIRST_SHOT_DELAY - BOSS_SHOOT_MS,
        // Dummy fields expected by updateObstaclePosition / dodge logic
        willDodge:      false,
        dodging:        false,
        dodgeProgress:  0,
        canMultiDodge:  false,
        nextDodgeZ:     0,
        sourceWorldX:   0,
        targetGridX:    null,
    };

    boss.position.set(0, 0, BOSS_Z);
    scene.add(boss);
    obstacles.push(boss);
    return boss;
}

// ── Per-frame update ──────────────────────────────────────────────────────────

/**
 * Update boss lateral movement and shoot projectiles.
 * Called every frame from GridRunnerGame.update() only during the boss level.
 *
 * @param {THREE.Mesh}   boss
 * @param {THREE.Scene}  scene
 * @param {THREE.Mesh[]} bossBullets   array managed by GridRunnerGame
 * @param {{x,y}}        playerGridPos
 * @param {object}       gameState
 * @param {number}       deltaTime     seconds since last frame
 */
export function updateBoss(boss, scene, bossBullets, playerGridPos, gameState, deltaTime) {
    // Boss may have been removed from the scene by bullets.js when health reaches 0
    if (!boss || !boss.parent) return;

    boss.userData.bossTime += deltaTime;
    const t = boss.userData.bossTime;

    // Smooth sine-wave lateral movement within the 3-lane grid bounds
    const worldX = Math.sin(t * 1.8) * CONFIG.GRID.SPACING;
    const worldY = Math.cos(t * 0.9) * (CONFIG.GRID.SPACING * 0.5);
    boss.position.set(worldX, worldY, BOSS_Z);

    // Keep gridX/Y in sync for any grid-based logic that might query them
    boss.userData.gridX = Math.max(0, Math.min(2, Math.round(worldX / CONFIG.GRID.SPACING + 1)));
    boss.userData.gridY = Math.max(0, Math.min(2, Math.round(worldY / CONFIG.GRID.SPACING + 1)));

    // Fire projectiles on interval
    const now = Date.now();
    if (now - boss.userData.lastShootTime >= BOSS_SHOOT_MS) {
        boss.userData.lastShootTime = now;
        _fireSalvo(boss, scene, bossBullets, playerGridPos);
    }
}

function _fireSalvo(boss, scene, bossBullets, playerGridPos) {
    const playerWorldX = (playerGridPos.x - 1) * CONFIG.GRID.SPACING;
    const playerWorldY = (Math.round(playerGridPos.y) - 1) * CONFIG.GRID.SPACING;

    // Shot 1: aimed directly at player's current lane
    _spawnBossBullet(scene, bossBullets, playerWorldX, playerWorldY, BOSS_Z);

    // Shot 2: slightly offset (±1 lane width) to force dodging
    const spread = (Math.random() < 0.5 ? 1 : -1) * CONFIG.GRID.SPACING;
    _spawnBossBullet(scene, bossBullets, playerWorldX + spread, playerWorldY, BOSS_Z);
}

function _spawnBossBullet(scene, bossBullets, x, y, z) {
    const geo    = new THREE.SphereGeometry(BOSS_BULLET_RAD, 8, 8);
    const mat    = new THREE.MeshBasicMaterial({ color: 0xff2200 });
    const bullet = new THREE.Mesh(geo, mat);
    bullet.position.set(x, y, z);
    scene.add(bullet);
    bossBullets.push(bullet);
}

// ── Boss-bullet update ────────────────────────────────────────────────────────

/**
 * Move boss projectiles toward the player and test collision.
 * Must be called each frame during the boss phase.
 *
 * @param {THREE.Mesh[]} bossBullets
 * @param {THREE.Scene}  scene
 * @param {{x,y}}        playerGridPos
 * @param {object}       gameState
 */
export function updateBossBullets(bossBullets, scene, playerGridPos, gameState) {
    if (gameState.state !== 'PLAYING') return;

    const playerWorldX = (Math.round(playerGridPos.x) - 1) * CONFIG.GRID.SPACING;
    const playerWorldY = (Math.round(playerGridPos.y) - 1) * CONFIG.GRID.SPACING;

    for (let i = bossBullets.length - 1; i >= 0; i--) {
        const b = bossBullets[i];
        b.position.z += BOSS_BULLET_SPD;

        // Hit-test only while the bullet is still approaching (not past the player)
        if (b.position.z >= -CONFIG.GRID.COLLISION_THRESHOLD && b.position.z <= 0) {
            const dx   = b.position.x - playerWorldX;
            const dy   = b.position.y - playerWorldY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < BOSS_HIT_RADIUS) {
                // Player hit — clean up all projectiles then trigger game over
                bossBullets.forEach(bb => { if (bb.parent) scene.remove(bb); });
                bossBullets.length = 0;
                console.log('Player hit by boss bullet!');
                gameState.gameOver();
                return;
            }
        }

        // Despawn once past the player plane
        if (b.position.z > CONFIG.GRID.DESPAWN_Z + 5) {
            scene.remove(b);
            bossBullets.splice(i, 1);
        }
    }
}

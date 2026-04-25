import * as THREE from 'three';
import { CONFIG } from '../config.js';

/**
 * Spawn a single enemy obstacle.
 *
 * @param {THREE.Scene}  scene
 * @param {object[]}     obstacles   shared live-obstacle array
 * @param {object}       models      preloaded GLB scenes
 * @param {object}       gameState
 * @param {object|null}  levelConfig  current level config from levelManager.js
 *                                   When provided, dodge behaviour comes from
 *                                   levelConfig.dodgeChance / .multiDodge
 *                                   instead of the legacy speed-based formula.
 */
function applyEmissive(root, color, intensity) {
    root.traverse(child => {
        if (child.isMesh && child.material) {
            child.material = child.material.clone();
            child.material.emissive = new THREE.Color(color);
            child.material.emissiveIntensity = intensity;
        }
    });
}

export function createObstacle(scene, obstacles, models, gameState, levelConfig) {
    if (obstacles.length >= CONFIG.GAME.MAX_OBSTACLES) return;

    const gridX = Math.floor(Math.random() * CONFIG.GRID.X_POSITIONS);
    const gridY = Math.floor(Math.random() * CONFIG.GRID.Y_POSITIONS);

    let obstacle;
    let baseScale;

    // Model selection strictly by row: bottom=tank, middle=enemy, top=enemyDub
    let enemyType;
    if (gridY === 0) {
        enemyType = 'tank';
    } else if (gridY === 2 && models.enemyDub) {
        enemyType = 'enemyDub';
    } else {
        enemyType = 'enemy';
    }

    if (enemyType === 'tank' && models.tank) {
        obstacle = models.tank.clone();
        baseScale = 2.5 + Math.random() * 0.5;
        obstacle.scale.set(baseScale, baseScale, baseScale);
        obstacle.rotation.x = 160;
        obstacle.rotation.y = Math.PI / 2;
        applyEmissive(obstacle, 0xff6600, 0.7);
    } else if (enemyType === 'enemyDub' && models.enemyDub) {
        obstacle = models.enemyDub.clone();
        obstacle.rotation.x = 160;
        obstacle.rotation.y = Math.PI * 2;
        baseScale = 1.5 + Math.random() * 0.5;
        obstacle.scale.set(baseScale, baseScale, baseScale);
        applyEmissive(obstacle, 0x003853, 0.7);
    } else if (models.enemy) {
        obstacle = models.enemy.clone();
        obstacle.rotation.x = 160;
        obstacle.rotation.y = Math.PI / -2;
        baseScale = 1.5 + Math.random() * 0.5;
        obstacle.scale.set(baseScale, baseScale, baseScale);
        applyEmissive(obstacle, 0x00aaff, 0.7);
    } else {
        const geometry = new THREE.BoxGeometry(7, 7, 7);
        const material = new THREE.MeshStandardMaterial({ color: 0xff4444 });
        obstacle = new THREE.Mesh(geometry, material);
        baseScale = 1.0;
    }

    obstacle.castShadow = true;
    const isTank = enemyType === 'tank';

    // ── Dodge probability ──────────────────────────────────────────────────
    // Level config takes precedence; fall back to the original speed-based
    // calculation so the function stays backward-compatible without a config.
    let dodgeChance;
    if (levelConfig) {
        dodgeChance = levelConfig.dodgeChance;
    } else {
        const speedFactor = gameState
            ? Math.max(0, (gameState.speed - CONFIG.ENEMY_DODGE.MIN_SPEED) / 0.25)
            : 0;
        dodgeChance = Math.min(CONFIG.ENEMY_DODGE.MAX_CHANCE, speedFactor * CONFIG.ENEMY_DODGE.MAX_CHANCE);
    }

    const willDodge     = !isTank && Math.random() < dodgeChance;
    // Multi-dodge: enemy keeps re-arming after each completed lane switch
    const canMultiDodge = willDodge && !!(levelConfig && levelConfig.multiDodge);

    obstacle.userData = {
        gridX,
        gridY,
        z:              CONFIG.GRID.SPAWN_Z,
        baseScale,
        health:         isTank ? 3 : 2,
        type:           isTank ? 'tank' : 'enemy',
        bulletProof:    false,
        isBoss:         false,
        // Dodge state
        willDodge,
        dodging:        false,
        dodgeProgress:  0,
        sourceWorldX:   (gridX - 1) * CONFIG.GRID.SPACING,
        targetGridX:    null,
        // Multi-dodge support
        canMultiDodge,
        // Z threshold at which the first (or next) dodge is triggered
        nextDodgeZ:     CONFIG.ENEMY_DODGE.SWITCH_Z,
    };

    updateObstaclePosition(obstacle);
    scene.add(obstacle);
    obstacles.push(obstacle);
}

function smoothstep(t) { return t * t * (3 - 2 * t); }

/** Translate userData grid / dodge state into world-space position + depth scale. */
export function updateObstaclePosition(obstacle) {
    let worldX;
    if (obstacle.userData.dodging && obstacle.userData.targetGridX !== null) {
        const targetWorldX = (obstacle.userData.targetGridX - 1) * CONFIG.GRID.SPACING;
        worldX = obstacle.userData.sourceWorldX +
            (targetWorldX - obstacle.userData.sourceWorldX) *
            smoothstep(obstacle.userData.dodgeProgress);
    } else {
        worldX = (obstacle.userData.gridX - 1) * CONFIG.GRID.SPACING;
    }
    const worldY = (obstacle.userData.gridY - 1) * CONFIG.GRID.SPACING;

    obstacle.position.set(worldX, worldY, obstacle.userData.z);

    const scale     = 1 + (obstacle.userData.z + CONFIG.GRID.SPAWN_Z) * 0.015;
    const baseScale = obstacle.userData.baseScale || 1;
    obstacle.scale.setScalar(baseScale * scale);
}

/**
 * Per-frame obstacle update.
 *
 * @param {object[]}      obstacles
 * @param {THREE.Scene}   scene
 * @param {object}        gameState
 * @param {{x,y}}         playerGridPos
 * @param {Function|null} onDespawn  Called when an enemy flies past without
 *                                   a collision (level manager counts "misses").
 */
export function updateObstacles(obstacles, scene, gameState, playerGridPos, onDespawn) {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];

        // ── Boss enemies: position is managed by boss.js — skip here ─────
        if (obstacle.userData.isBoss) continue;

        obstacle.userData.z += gameState.speed;

        // ── Trigger lane-switch dodge ─────────────────────────────────────
        if (obstacle.userData.willDodge &&
            !obstacle.userData.dodging &&
            obstacle.userData.targetGridX === null &&
            obstacle.userData.z >= obstacle.userData.nextDodgeZ) {

            let newGridX;
            do { newGridX = Math.floor(Math.random() * CONFIG.GRID.X_POSITIONS); }
            while (newGridX === obstacle.userData.gridX);

            obstacle.userData.sourceWorldX  = obstacle.position.x;
            obstacle.userData.targetGridX   = newGridX;
            obstacle.userData.dodging        = true;
            obstacle.userData.dodgeProgress  = 0;
        }

        // ── Advance dodge animation ───────────────────────────────────────
        if (obstacle.userData.dodging) {
            obstacle.userData.dodgeProgress = Math.min(
                1,
                obstacle.userData.dodgeProgress + CONFIG.ENEMY_DODGE.SWITCH_SPEED
            );

            if (obstacle.userData.dodgeProgress >= 1) {
                obstacle.userData.gridX  = obstacle.userData.targetGridX;
                obstacle.userData.dodging = false;

                if (obstacle.userData.canMultiDodge) {
                    // Re-arm: trigger again 20 Z-units further ahead
                    obstacle.userData.targetGridX   = null;
                    obstacle.userData.dodgeProgress  = 0;
                    obstacle.userData.nextDodgeZ     = obstacle.userData.z + 20;
                    // willDodge stays true
                } else {
                    obstacle.userData.willDodge = false;
                }
            }
        }

        updateObstaclePosition(obstacle);

        // ── Player collision ──────────────────────────────────────────────
        // Only test while the obstacle is still approaching (z <= 0).
        // Using playerTargetPos (integer) means the player's dodge is
        // registered the instant they press a key, not mid-lerp.
        if (obstacle.userData.z >= -CONFIG.GRID.COLLISION_THRESHOLD &&
            obstacle.userData.z <= 0) {

            if (playerGridPos.x === obstacle.userData.gridX &&
                playerGridPos.y === obstacle.userData.gridY) {
                gameState.gameOver();
                return;
            }
        }

        // ── Despawn past player ───────────────────────────────────────────
        if (obstacle.userData.z > CONFIG.GRID.DESPAWN_Z) {
            scene.remove(obstacle);
            obstacles.splice(i, 1);
            if (onDespawn) onDespawn();
        }
    }
}

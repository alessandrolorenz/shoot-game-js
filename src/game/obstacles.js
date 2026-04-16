import * as THREE from 'three';
import { CONFIG } from '../config.js';

export function createObstacle(scene, obstacles, models) {
    if (obstacles.length >= CONFIG.GAME.MAX_OBSTACLES) return;

    const gridX = Math.floor(Math.random() * CONFIG.GRID.X_POSITIONS);
    const gridY = Math.floor(Math.random() * CONFIG.GRID.Y_POSITIONS);

    let obstacle;
    let baseScale;

    if (gridY === 0 && models.tank) {
        obstacle = models.tank.clone();
        baseScale = 2.5 + Math.random() * 0.5;
        obstacle.scale.set(baseScale, baseScale, baseScale);
        obstacle.rotation.x = 160;
        obstacle.rotation.y = Math.PI / 2;
    } else if (models.enemy) {
        obstacle = models.enemy.clone();
        obstacle.rotation.x = 160;
        obstacle.rotation.y = Math.PI / -2;
        baseScale = 4.5 + Math.random() * 0.5;
        obstacle.scale.set(baseScale, baseScale, baseScale);
    } else {
        const geometry = new THREE.BoxGeometry(7, 7, 7);
        const material = new THREE.MeshStandardMaterial({ color: 0xff4444 });
        obstacle = new THREE.Mesh(geometry, material);
        baseScale = 1.0;
    }

    obstacle.castShadow = true;
    const isTank = gridY === 0 && models.tank;
    obstacle.userData = {
        gridX,
        gridY,
        z: CONFIG.GRID.SPAWN_Z,
        baseScale,
        health: isTank ? 6 : 2,
        type: isTank ? 'tank' : 'enemy'
    };

    updateObstaclePosition(obstacle);
    scene.add(obstacle);
    obstacles.push(obstacle);
}

export function updateObstaclePosition(obstacle) {
    const worldX = (obstacle.userData.gridX - 1) * CONFIG.GRID.SPACING;
    const worldY = (obstacle.userData.gridY - 1) * CONFIG.GRID.SPACING;

    obstacle.position.set(worldX, worldY, obstacle.userData.z);

    const scale = 1 + (obstacle.userData.z + CONFIG.GRID.SPAWN_Z) * 0.015;
    const baseScale = obstacle.userData.baseScale || 1;
    obstacle.scale.setScalar(baseScale * scale);
}

export function updateObstacles(obstacles, scene, gameState, playerGridPos) {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        obstacle.userData.z += gameState.speed;

        updateObstaclePosition(obstacle);

        if (Math.abs(obstacle.userData.z) < CONFIG.GRID.COLLISION_THRESHOLD) {
            const playerX = Math.round(playerGridPos.x);
            const playerY = Math.round(playerGridPos.y);

            if (playerX === obstacle.userData.gridX && playerY === obstacle.userData.gridY) {
                gameState.gameOver();
                return;
            }
        }

        if (obstacle.userData.z > CONFIG.GRID.DESPAWN_Z) {
            scene.remove(obstacle);
            obstacles.splice(i, 1);
        }
    }
}

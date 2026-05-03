import * as THREE from 'three';
import { CONFIG } from '../config.js';

export function createPlayer(scene, models) {
    let player;

    if (models.player) {
        player = models.player.clone();
        player.scale.set(2.4, 2.4, 2.4);
        player.rotation.y = Math.PI;
    } else {
        const geometry = new THREE.ConeGeometry(0.5, 1.5, 8);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff88 });
        player = new THREE.Mesh(geometry, material);
        player.rotation.x = Math.PI * 0.2;
    }

    player.castShadow = true;
    scene.add(player);
    return player;
}

export function updatePlayerPosition(player, playerGridPos, playerTargetPos) {
    if (!player) return;

    playerGridPos.x += (playerTargetPos.x - playerGridPos.x) * CONFIG.PLAYER.MOVE_SPEED;
    playerGridPos.y += (playerTargetPos.y - playerGridPos.y) * CONFIG.PLAYER.MOVE_SPEED;

    const worldX = (playerGridPos.x - 1) * CONFIG.GRID.SPACING;
    const worldY = (playerGridPos.y - 1) * CONFIG.GRID.SPACING;

    player.position.set(worldX, worldY, 0);
}

export function movePlayer(direction, playerTargetPos, gameState) {
    if (gameState.state !== 'PLAYING') return;

    switch (direction) {
        case 'left':
            playerTargetPos.x = Math.max(0, playerTargetPos.x - 1);
            break;
        case 'right':
            playerTargetPos.x = Math.min(2, playerTargetPos.x + 1);
            break;
        case 'up':
            playerTargetPos.y = Math.min(2, playerTargetPos.y + 1);
            break;
        case 'down':
            playerTargetPos.y = Math.max(0, playerTargetPos.y - 1);
            break;
    }
}

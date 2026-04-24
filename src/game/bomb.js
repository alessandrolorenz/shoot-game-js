import { spawnDestroyEffect } from './bullets.js';

/**
 * Called for every enemy destroyed (bullet hit or bomb).
 * Tracks kills for the bomb-ready threshold and updates the score.
 * The kills-display DOM element is now owned by levelUI.js / GridRunnerGame.
 */
export function onEnemyDestroyed(gameState, destroyedCountRef, bombReadyRef) {
    gameState.score += 100;
    gameState.updateUI();

    destroyedCountRef.value++;

    if (destroyedCountRef.value % 10 === 0 && !bombReadyRef.value) {
        bombReadyRef.value = true;
        document.getElementById('bomb-indicator').classList.remove('hidden');
        document.getElementById('btn-bomb').classList.add('visible');
    }
}

/**
 * Detonate the bomb — removes all enemies in the player's current lane.
 *
 * @param {object[]}     obstacles
 * @param {THREE.Scene}  scene
 * @param {object}       gameState
 * @param {object}       bombReadyRef
 * @param {{x,y}}        playerTargetPos
 * @param {Function|null} onKill  Optional callback invoked per removed obstacle
 *                                so the level manager can count bomb kills.
 */
export function activateBomb(obstacles, scene, gameState, bombReadyRef, playerTargetPos, onKill) {
    if (!bombReadyRef.value || gameState.state !== 'PLAYING') return;

    const gridX = Math.round(playerTargetPos.x);
    const gridY = Math.round(playerTargetPos.y);

    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        if (obs.userData.gridX === gridX && obs.userData.gridY === gridY) {
            spawnDestroyEffect(scene, obs.position.clone());
            scene.remove(obs);
            obstacles.splice(i, 1);
            if (onKill) onKill();
        }
    }

    bombReadyRef.value = false;
    document.getElementById('bomb-indicator').classList.add('hidden');
    document.getElementById('btn-bomb').classList.remove('visible');
}

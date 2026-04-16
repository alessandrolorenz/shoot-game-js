export function onEnemyDestroyed(gameState, destroyedCountRef, bombReadyRef) {
    gameState.score += 100;
    gameState.updateUI();

    destroyedCountRef.value++;
    document.getElementById('kills-display').textContent = `Kills: ${destroyedCountRef.value}`;

    if (destroyedCountRef.value % 10 === 0 && !bombReadyRef.value) {
        bombReadyRef.value = true;
        document.getElementById('btn-bomb').classList.add('visible');
    }
}

export function activateBomb(obstacles, scene, gameState, bombReadyRef, playerTargetPos) {
    if (!bombReadyRef.value || gameState.state !== 'PLAYING') return;

    const gridX = Math.round(playerTargetPos.x);
    const gridY = Math.round(playerTargetPos.y);

    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        if (obs.userData.gridX === gridX && obs.userData.gridY === gridY) {
            scene.remove(obs);
            obstacles.splice(i, 1);
        }
    }

    bombReadyRef.value = false;
    document.getElementById('btn-bomb').classList.remove('visible');
}

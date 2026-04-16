export function updateHUD(score, highScore) {
    document.getElementById('score').textContent = Math.floor(score);
    document.getElementById('high-score').textContent = `High Score: ${highScore}`;
}

export function updateKills(count) {
    document.getElementById('kills-display').textContent = `Kills: ${count}`;
}

import { CONFIG } from '../config.js';

export function checkDifficulty(gameState, currentTime) {
    if (currentTime - gameState.lastDifficultyIncrease > CONFIG.GAME.DIFFICULTY_INTERVAL) {
        gameState.increaseDifficulty();
        gameState.lastDifficultyIncrease = currentTime;
    }
}

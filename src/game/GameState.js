import { CONFIG } from '../config.js';

export class GameState {
    constructor() {
        this.state = 'LOADING';
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('highScore') || '0');
        this.speed = CONFIG.GAME.BASE_SPEED;
        this.spawnInterval = CONFIG.GAME.BASE_SPAWN_INTERVAL;
        this.startTime = 0;
        this.lastDifficultyIncrease = 0;
    }

    setState(newState) {
        this.state = newState;
        console.log(`Game state: ${newState}`);
    }

    updateScore(deltaTime) {
        if (this.state === 'PLAYING') {
            this.score += deltaTime * 10;
            this.updateUI();
        }
    }

    increaseDifficulty() {
        this.speed *= CONFIG.GAME.SPEED_INCREASE;
        this.spawnInterval *= CONFIG.GAME.SPAWN_DECREASE;
        console.log(`Difficulty increased! Speed: ${this.speed.toFixed(2)}, Interval: ${this.spawnInterval.toFixed(0)}ms`);
    }

    gameOver() {
        this.setState('GAMEOVER');
        const finalScore = Math.floor(this.score);
        const isNewHighScore = finalScore > this.highScore;

        if (isNewHighScore) {
            this.highScore = finalScore;
            localStorage.setItem('highScore', this.highScore.toString());
        }

        this.showGameOver(finalScore, isNewHighScore);
    }

    showGameOver(finalScore, isNewHighScore) {
        document.getElementById('final-score').textContent = `Score: ${finalScore}`;
        document.getElementById('new-high-score').classList.toggle('visible', isNewHighScore);
        document.getElementById('game-over-screen').classList.add('visible');
    }

    updateUI() {
        document.getElementById('score').textContent = Math.floor(this.score);
        document.getElementById('high-score').textContent = `High Score: ${this.highScore}`;
    }

    reset() {
        this.score = 0;
        this.speed = CONFIG.GAME.BASE_SPEED;
        this.spawnInterval = CONFIG.GAME.BASE_SPAWN_INTERVAL;
        this.startTime = Date.now();
        this.lastDifficultyIncrease = this.startTime;
        this.updateUI();
    }
}

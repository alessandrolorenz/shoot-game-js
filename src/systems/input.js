export function setupKeyboard(callbacks) {
    const { movePlayer, manualShoot, activateBomb, startGame, restartGame, getState } = callbacks;

    window.addEventListener('keydown', (e) => {
        const state = getState();

        if (state === 'MENU' && (e.key === ' ' || e.key === 'Enter')) {
            startGame();
            return;
        }

        if (state === 'GAMEOVER' && (e.key === ' ' || e.key === 'Enter')) {
            restartGame();
            return;
        }

        if (state === 'PLAYING') {
            switch (e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    movePlayer('left');
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    movePlayer('right');
                    break;
                case 'ArrowUp':
                case 'w':
                case 'W':
                    movePlayer('up');
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    movePlayer('down');
                    break;
                case ' ':
                    manualShoot();
                    break;
                case 'b':
                case 'B':
                    activateBomb();
                    break;
            }
        }
    });
}

export function setupMobileControls(callbacks) {
    const { movePlayer } = callbacks;

    document.getElementById('btn-left').addEventListener('click', () => movePlayer('left'));
    document.getElementById('btn-right').addEventListener('click', () => movePlayer('right'));
    document.getElementById('btn-up').addEventListener('click', () => movePlayer('up'));
    document.getElementById('btn-down').addEventListener('click', () => movePlayer('down'));

    ['btn-left', 'btn-right', 'btn-up', 'btn-down'].forEach(id => {
        const btn = document.getElementById(id);
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            btn.click();
        });
    });
}

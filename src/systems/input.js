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
                case 'b':
                case 'B':
                    activateBomb();
                    break;
            }
        }
    });
}

export function setupSwipeControls(callbacks) {
    const { movePlayer, getState } = callbacks;

    let startX = null;
    let startY = null;
    const THRESHOLD = 30;

    const isUIElement = (el) =>
        !!el.closest('button, a, #mobile-controls, #action-btns, #start-screen, #game-over-screen, #loading');

    document.addEventListener('touchstart', (e) => {
        if (isUIElement(e.target)) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        if (startX === null) return;
        if (getState() !== 'PLAYING') { startX = null; startY = null; return; }

        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        startX = null;
        startY = null;

        if (Math.abs(dx) < THRESHOLD && Math.abs(dy) < THRESHOLD) return;

        if (Math.abs(dx) > Math.abs(dy)) {
            movePlayer(dx > 0 ? 'right' : 'left');
        } else {
            movePlayer(dy > 0 ? 'down' : 'up');
        }
    }, { passive: true });
}

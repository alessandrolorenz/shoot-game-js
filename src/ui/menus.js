export function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

export function hideStartScreen() {
    document.getElementById('start-screen').classList.add('hidden');
}

export function showStartScreen() {
    document.getElementById('start-screen').classList.remove('hidden');
}

export function showBackMenuButton() {
    document.getElementById('btn-back-menu').classList.remove('hidden');
}

export function hideBackMenuButton() {
    document.getElementById('btn-back-menu').classList.add('hidden');
}

export function hideGameOverScreen() {
    document.getElementById('game-over-screen').classList.remove('visible');
}

export function showShootButton(visible) {
    const btn = document.getElementById('btn-shoot');
    if (visible) {
        btn.classList.remove('hidden');
    } else {
        btn.classList.add('hidden');
    }
}

export function resetBombUI() {
    document.getElementById('btn-bomb').classList.remove('visible');
}

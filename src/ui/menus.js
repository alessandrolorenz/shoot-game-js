const BADGE_CONFIGS = {
    impossible: { label: 'IMPOSSIBLE!', sub: 'Flawless pilot!',    cls: 'badge-impossible' },
    incredible: { label: 'INCREDIBLE!', sub: 'That was awesome!',  cls: 'badge-incredible' },
    ok:         { label: 'OK...',       sub: 'Keep practicing!',   cls: 'badge-ok'         },
};

/**
 * @param {{ finalScore:number, isNewHighScore:boolean, isVictory:boolean,
 *            totalKills:number, badge:'impossible'|'yeah'|'ok' }} data
 */
export function showResultsScreen({ finalScore, isNewHighScore, isVictory, totalKills, badge }) {
    const screen  = document.getElementById('results-screen');
    const badgeCfg = BADGE_CONFIGS[badge] || BADGE_CONFIGS.ok;

    const titleEl = document.getElementById('results-title');
    titleEl.textContent = isVictory ? '🏆 VICTORY!' : 'GAME OVER';
    titleEl.classList.toggle('victory', isVictory);

    const badgeEl = document.getElementById('results-badge');
    badgeEl.className = badgeCfg.cls;
    document.getElementById('results-badge-label').textContent = badgeCfg.label;
    document.getElementById('results-badge-sub').textContent   = badgeCfg.sub;

    document.getElementById('results-enemies').textContent = totalKills;
    document.getElementById('results-score').textContent   = finalScore.toLocaleString();
    document.getElementById('results-new-high').classList.toggle('hidden', !isNewHighScore);

    screen.classList.add('visible');
}

export function hideResultsScreen() {
    document.getElementById('results-screen').classList.remove('visible');
}

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

export function resetBombUI() {
    document.getElementById('bomb-indicator').classList.add('hidden');
    document.getElementById('btn-bomb').classList.remove('visible');
}

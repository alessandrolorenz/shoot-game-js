/**
 * Level UI — banner animations and HUD updates.
 *
 * The banner (#level-banner) is a full-screen overlay that fades in and out
 * automatically over 2 seconds.  It is controlled entirely from JS so that
 * the onComplete callback fires at exactly the right moment regardless of
 * CSS timing quirks.
 */

let bannerTimer = null;

const SUBTITLES = {
    1: 'Engage!',
    2: 'Faster now…',
    3: 'More incoming!',
    4: 'Hold the line!',
    5: "They're evading!",
    6: 'Speed up!',
    7: 'Overwhelming!',
    8: "They're slippery!",
};

/**
 * Show a level-start banner for 2 seconds, then call onComplete.
 * @param {number}   levelNumber
 * @param {boolean}  isBoss
 * @param {Function} onComplete  Called after the banner hides
 */
export function showLevelBanner(levelNumber, isBoss, onComplete) {
    const banner = document.getElementById('level-banner');
    const title  = document.getElementById('level-banner-title');
    const sub    = document.getElementById('level-banner-sub');

    // Force animation restart if banner is already showing
    banner.classList.remove('visible', 'victory');
    void banner.offsetWidth; // trigger reflow

    if (isBoss) {
        title.textContent = '⚠ BOSS FIGHT';
        sub.textContent   = 'Destroy the commander!';
        banner.classList.add('boss');
    } else {
        banner.classList.remove('boss');
        title.textContent = `LEVEL ${levelNumber}`;
        sub.textContent   = SUBTITLES[levelNumber] || `Wave ${levelNumber}`;
    }

    banner.classList.add('visible');

    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => {
        banner.classList.remove('visible', 'boss');
        if (onComplete) onComplete();
    }, 2000);
}

/**
 * Show a victory banner for 3 seconds, then call onComplete.
 * @param {Function} onComplete
 */
export function showVictoryBanner(onComplete) {
    const banner = document.getElementById('level-banner');
    const title  = document.getElementById('level-banner-title');
    const sub    = document.getElementById('level-banner-sub');

    banner.classList.remove('visible', 'boss');
    void banner.offsetWidth;

    title.textContent = '🏆 VICTORY';
    sub.textContent   = 'All waves cleared!';
    banner.classList.add('visible', 'victory');

    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => {
        banner.classList.remove('visible', 'victory');
        if (onComplete) onComplete();
    }, 3000);
}

/**
 * Update the HUD level indicator and kills counter.
 * @param {number} levelNumber
 * @param {number} killed     enemies destroyed this level
 * @param {number} total      total enemies this level
 */
export function updateLevelHUD(levelNumber, killed, total) {
    const lvlEl  = document.getElementById('level-display');
    const killEl = document.getElementById('kills-display');

    if (lvlEl)  lvlEl.textContent  = `LVL ${levelNumber}`;
    if (killEl) killEl.textContent = `Kills: ${killed}/${total}`;
}

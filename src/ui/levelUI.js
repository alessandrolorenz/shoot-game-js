/**
 * Level UI — banner animations and HUD updates.
 *
 * The banner (#level-banner) is a full-screen overlay that fades in and out
 * automatically over 2 seconds.  It is controlled entirely from JS so that
 * the onComplete callback fires at exactly the right moment regardless of
 * CSS timing quirks.
 */

let bannerTimer = null;

function _getResultText(killedCount, totalEnemies) {
    if (killedCount === totalEnemies) return { msg: 'Awesome! Impossible!!!', cls: 'result-perfect' };
    if (killedCount > totalEnemies / 2)  return { msg: 'Good!!',             cls: 'result-good'    };
    return                                       { msg: 'Pretty ok!!',        cls: 'result-ok'      };
}

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
 * Show a level-result banner (performance feedback) for 1.8 s, then call onComplete.
 * @param {number}   killedCount  enemies destroyed this level
 * @param {number}   totalEnemies total enemies this level
 * @param {number}   levelNumber  the level that just ended
 * @param {Function} onComplete
 */
export function showLevelResultBanner(killedCount, totalEnemies, levelNumber, onComplete) {
    const banner = document.getElementById('level-banner');
    const title  = document.getElementById('level-banner-title');
    const sub    = document.getElementById('level-banner-sub');

    banner.classList.remove('visible', 'boss', 'victory', 'result', 'result-perfect', 'result-good', 'result-ok');
    void banner.offsetWidth;

    const { msg, cls } = _getResultText(killedCount, totalEnemies);
    title.textContent = `LEVEL ${levelNumber} CLEAR!`;
    sub.textContent   = msg;
    banner.classList.add('visible', 'result', cls);

    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => {
        banner.classList.remove('visible', 'result', 'result-perfect', 'result-good', 'result-ok');
        if (onComplete) onComplete();
    }, 1800);
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

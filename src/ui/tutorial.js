const FADE_START = 4300;
const HIDE_DELAY = 7000;

let fadeTimer = null;
let hideTimer = null;

export function showTutorial() {
    const overlay = document.getElementById('tutorial-overlay');
    overlay.classList.remove('hidden', 'tut-fadeout');

    clearTimeout(fadeTimer);
    clearTimeout(hideTimer);

    fadeTimer = setTimeout(() => {
        overlay.classList.add('tut-fadeout');
    }, FADE_START);

    hideTimer = setTimeout(() => {
        overlay.classList.add('hidden');
        overlay.classList.remove('tut-fadeout');
    }, HIDE_DELAY);
}

export function hideTutorial() {
    clearTimeout(fadeTimer);
    clearTimeout(hideTimer);
    const overlay = document.getElementById('tutorial-overlay');
    overlay.classList.add('hidden');
    overlay.classList.remove('tut-fadeout');
}

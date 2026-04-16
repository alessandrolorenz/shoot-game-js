import './style.css';
import { GridRunnerGame } from './GridRunnerGame.js';

new GridRunnerGame();

// ── PWA Install Prompt ────────────────────────────────────────────────────────
// Capture the browser's install prompt before it auto-fires, then show a
// subtle banner after a short delay. Only fires on Chromium browsers
// (Chrome, Edge, Samsung Internet). iOS uses the native Share → Add to Home
// Screen flow — no code needed for that path.

let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  setTimeout(showInstallBanner, 3000);
});

function showInstallBanner() {
  if (!deferredInstallPrompt) return;

  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.innerHTML = `
    <span>Install for offline play</span>
    <button id="pwa-install-btn">Install</button>
    <button id="pwa-dismiss-btn">&#x2715;</button>
  `;
  Object.assign(banner.style, {
    position: 'fixed', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
    background: '#111', color: '#00ff88', border: '1px solid #00ff88',
    padding: '10px 18px', borderRadius: '8px', zIndex: '9999',
    display: 'flex', alignItems: 'center', gap: '12px',
    fontFamily: 'Arial, sans-serif', fontSize: '13px',
    boxShadow: '0 0 20px rgba(0,255,136,0.3)', whiteSpace: 'nowrap'
  });
  document.body.appendChild(banner);

  document.getElementById('pwa-install-btn').onclick = async () => {
    banner.remove();
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
  };

  document.getElementById('pwa-dismiss-btn').onclick = () => {
    banner.remove();
    deferredInstallPrompt = null;
  };
}

// Log when running as an installed PWA (useful for conditional UI tweaks later)
if (window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: standalone)').matches) {
  console.log('[PWA] Running as installed app');
}

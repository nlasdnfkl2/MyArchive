// ============================================================
// MY-ARCHIVE 95 OS — Retro Mini-Game Pack Shell (GAMEPACK95.EXE)
// ============================================================

window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
window.__MOD_VERSIONS.gamepack = typeof APP_BUILD_VERSION !== 'undefined'
  ? APP_BUILD_VERSION
  : 'v2026.11.26-gamepack-shell-modular';

window.GamePackModules = window.GamePackModules || {};

const GP_RESPONSIVE_STYLE_ID = 'myarchive95-gamepack-responsive-style';

let activeGameTab = 'solitaire';
let cleanupActiveGame = null;

// 1995년 16x16 도트 픽셀 SVG 아이콘 (이모지 미사용)
const GAMEPACK_PIXEL_ICONS = {
  mine: `
    <svg class="pixel-svg-14" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true" style="vertical-align:-2px;">
      <path fill="#000000" d="M7 1h2v2h2v1h1v2h2v2h-2v2h-1v1H9v2H7v-2H5v-1H4V8H2V6h2V4h1V3h2V1z"/>
      <path fill="#000000" d="M3 2h2v2H3V2zm8 0h2v2h-2V2zM3 10h2v2H3v-2zm8 0h2v2h-2v-2z"/>
      <path fill="#ffffff" d="M6 5h2v2H6V5z"/>
    </svg>`,
  flag: `
    <svg class="pixel-svg-14" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true" style="vertical-align:-2px;">
      <path fill="#ff0000" d="M4 2h5v1h2v2H9v1H4V2z"/>
      <path fill="#000000" d="M8 6h1v6H8V6zM5 12h7v1H5v-1zM4 13h9v2H4v-2z"/>
    </svg>`,
  star: `
    <svg class="pixel-svg-14" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true" style="vertical-align:-2px;">
      <path fill="#000000" d="M7 1h2v3h5v2h-2v2h1v5h-2v-1H9v-1H7v1H5v1H3V8h1V6H2V4h5V1z"/>
      <path fill="#ffd83b" d="M7 2h2v3h4v1h-2v2h1v4h-2v-1H9v-1H7v1H6v1H4V8h1V6H3V5h4V2z"/>
    </svg>`,
  trophy: `
    <svg class="pixel-svg-14" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true" style="vertical-align:-2px;">
      <path fill="#000000" d="M4 1h8v2h2v4h-2v1h-2v2H9v2h3v2H4v-2h3v-2H6V8H4V7H2V3h2V1z"/>
      <path fill="#ffd83b" d="M5 2h6v5H9v2H7V7H5V2zM3 4h1v2H3V4zm9 0h1v2h-1V4zM5 12h6v1H5v-1z"/>
    </svg>`,
  yutStick: `
    <svg class="pixel-svg-14" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true" style="vertical-align:-2px;">
      <path fill="#111111" d="M6 1h4v14H6V1z"/>
      <path fill="#f5deb3" d="M7 2h2v12H7V2z"/>
      <path fill="#b8860b" d="M7 5h2v1H7V5zm0 5h2v1H7v-1z"/>
    </svg>`,
  nodeDot: `
    <svg width="10" height="10" viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true" style="flex-shrink:0;">
      <rect x="2" y="1" width="4" height="6" fill="#6d4c2f"/>
      <rect x="1" y="2" width="6" height="4" fill="#8d6542"/>
      <rect x="3" y="3" width="2" height="2" fill="#fff3c4"/>
    </svg>`,
  nodeStar: `
    <svg width="12" height="12" viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true" style="flex-shrink:0;">
      <rect x="3" y="0" width="2" height="8" fill="#d63031"/>
      <rect x="0" y="3" width="8" height="2" fill="#d63031"/>
      <rect x="2" y="2" width="4" height="4" fill="#ffd83b"/>
    </svg>`,
  nodeGoal: `
    <svg width="12" height="12" viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true" style="flex-shrink:0;">
      <rect x="1" y="1" width="2" height="6" fill="#111111"/>
      <rect x="3" y="1" width="4" height="3" fill="#008000"/>
    </svg>`,
  tokenPlayer: `
    <svg width="12" height="12" viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true" style="flex-shrink:0;">
      <rect x="2" y="1" width="4" height="6" fill="#111111"/>
      <rect x="1" y="2" width="6" height="4" fill="#1e90ff"/>
      <rect x="3" y="2" width="2" height="2" fill="#b8ecff"/>
    </svg>`,
  tokenAi: `
    <svg width="12" height="12" viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true" style="flex-shrink:0;">
      <rect x="2" y="1" width="4" height="6" fill="#111111"/>
      <rect x="1" y="2" width="6" height="4" fill="#ff4757"/>
      <rect x="3" y="2" width="2" height="2" fill="#ffd1d6"/>
    </svg>`
};

function applyGamePackResponsiveStyle() {
  if (document.getElementById(GP_RESPONSIVE_STYLE_ID)) return;
  const parent = document.head || document.documentElement;
  if (!parent) return;

  const style = document.createElement('style');
  style.id = GP_RESPONSIVE_STYLE_ID;
  style.textContent = `
    @keyframes gpPopIn {
      0% { transform: scale(0.92) translateY(2px); opacity: 0.65; }
      70% { transform: scale(1.03) translateY(-1px); opacity: 1; }
      100% { transform: scale(1) translateY(0); opacity: 1; }
    }
    @keyframes gpYutToss {
      0% { transform: translateY(0) rotate(0deg); }
      35% { transform: translateY(-7px) rotate(-6deg); }
      70% { transform: translateY(2px) rotate(4deg); }
      100% { transform: translateY(0) rotate(0deg); }
    }
    @keyframes gpPulseTarget {
      0%, 100% { box-shadow: inset 0 0 0 2px #d63031, 0 0 0 0 rgba(214, 48, 49, 0.35); }
      50% { box-shadow: inset 0 0 0 2px #d63031, 0 0 0 3px rgba(214, 48, 49, 0); }
    }
    .gp-anim-pop {
      animation: gpPopIn 0.22s steps(5, end);
    }
    .gp-anim-toss {
      animation: gpYutToss 0.34s steps(5, end);
    }
    .gp-yut-target {
      animation: gpPulseTarget 1.1s infinite;
    }
    .gp-sol-card {
      transition: transform 0.12s ease, background-color 0.12s ease, border-color 0.12s ease;
    }
    .gp-sol-card:active {
      transform: translateY(1px);
    }
    #gamepack-body .gp-tab-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 10px;
    }
    #gamepack-body .gp-tab-bar .pill-btn {
      flex: 1 1 auto;
      min-width: 110px;
      text-align: center;
      box-sizing: border-box;
    }
    #gamepack-stage {
      min-width: 0;
      box-sizing: border-box;
      overflow-x: hidden;
    }
    #gamepack-stage .box-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      flex-wrap: wrap;
    }
    .gp-sol-top-grid,
    .gp-sol-tab-grid {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 5px;
    }
    .gp-sol-top-grid {
      margin-bottom: 12px;
    }
    .gp-sol-tab-grid {
      align-items: start;
      min-height: 210px;
    }
    .gp-mine-grid {
      display: grid;
      grid-template-columns: repeat(8, 34px);
      gap: 0;
      border: 2px solid #808080;
      background: #808080;
    }
    .gp-mine-cell {
      width: 34px;
      height: 34px;
      font-weight: 900;
      font-size: 0.9rem;
      font-family: var(--font-mono, Consolas, monospace);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      box-sizing: border-box;
    }
    .gp-yut-board {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 4px;
      background: #b99b62;
      border: 2.5px solid #111111;
      padding: 6px;
      margin-bottom: 10px;
      box-shadow: inset 0 0 0 2px #e6d2a2;
    }
    .gp-yut-footer-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.35fr) minmax(0, 0.65fr);
      gap: 8px;
    }
    .gp-hilo-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 12px;
    }
    @media (prefers-reduced-motion: reduce) {
      .gp-anim-pop,
      .gp-anim-toss,
      .gp-yut-target {
        animation: none !important;
      }
      .gp-sol-card {
        transition: none !important;
      }
    }
    @media (max-width: 768px) {
      #gamepack-body .gp-tab-bar .pill-btn {
        flex: 1 1 calc(50% - 6px);
        min-width: 0;
        font-size: 0.76rem;
        padding: 6px 8px;
      }
      .gp-yut-footer-grid {
        grid-template-columns: minmax(0, 1fr) !important;
      }
      .gp-yut-board {
        gap: 3px;
        padding: 4px;
      }
      .yut-board-cell {
        min-height: 46px !important;
        padding: 2px !important;
      }
    }
    @media (max-width: 600px) {
      .gp-sol-top-grid,
      .gp-sol-tab-grid {
        gap: 3px;
      }
      .gp-sol-top-grid > button,
      .gp-sol-top-grid > div {
        height: 46px !important;
        font-size: 0.72rem !important;
      }
      .gp-sol-card {
        height: 28px !important;
        font-size: 0.72rem !important;
        padding: 0 3px !important;
      }
      .gp-mine-grid {
        grid-template-columns: repeat(8, minmax(0, 1fr)) !important;
        width: 100%;
        max-width: 288px;
      }
      .gp-mine-cell {
        width: 100% !important;
        aspect-ratio: 1 / 1;
        height: auto !important;
        font-size: 0.8rem !important;
      }
      .gp-hilo-grid {
        grid-template-columns: minmax(0, 1fr) !important;
        gap: 8px;
      }
    }
  `;
  parent.appendChild(style);
}

function safePlayGameTone(type) {
  if (typeof playRetroTone === 'function') {
    playRetroTone(type);
  }
}

function getGameArchivePool() {
  if (typeof getMyVisibleArchiveItems === 'function') {
    return getMyVisibleArchiveItems();
  }
  return Array.isArray(window.archiveItems) ? window.archiveItems : [];
}

function setGameCleanup(fn) {
  cleanupActiveGame = typeof fn === 'function' ? fn : null;
}

function runGameCleanup() {
  if (typeof cleanupActiveGame === 'function') {
    cleanupActiveGame();
    cleanupActiveGame = null;
  }
}

const GAME_TABS = [
  { id: 'solitaire', label: '카드 솔리테어 95' },
  { id: 'mine', label: '지뢰찾기 95 (8x8)' },
  { id: 'yut', label: '레트로 윷놀이 vs AI' },
  { id: 'hilo', label: '작품 별점 하이로우' }
];

function launchActiveGame(tabId) {
  const stage = document.getElementById('gamepack-stage');
  if (!stage) return;

  runGameCleanup();

  const mod = window.GamePackModules && window.GamePackModules[tabId];
  if (mod && typeof mod.render === 'function') {
    mod.render({
      stage,
      icons: GAMEPACK_PIXEL_ICONS,
      playTone: safePlayGameTone,
      getArchivePool: getGameArchivePool,
      esc: typeof esc === 'function' ? esc : (s => String(s ?? '')),
      setCleanup: setGameCleanup
    });
  } else {
    stage.innerHTML = `<div style="padding:20px;text-align:center;font-weight:800;">모듈(${esc(tabId)})이 로드되지 않았습니다. 스크립트 포함 순서를 확인하십시오.</div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  applyGamePackResponsiveStyle();
  window.addEventListener('window:opened', ev => {
    if (ev.detail && ev.detail.id === 'win-gamepack') {
      renderGamePackShell();
    }
  });
  window.addEventListener('window:closed', ev => {
    if (ev.detail && ev.detail.id === 'win-gamepack') {
      runGameCleanup();
    }
  });
});

function renderGamePackShell() {
  applyGamePackResponsiveStyle();
  runGameCleanup();

  const body = document.getElementById('gamepack-body');
  if (!body) return;

  body.innerHTML = `
    <div class="gp-tab-bar" role="tablist" aria-label="미니게임 선택">
      ${GAME_TABS.map(t => `
        <button type="button" class="pill-btn ${activeGameTab === t.id ? 'active' : ''}" data-gtab="${t.id}">${t.label}</button>
      `).join('')}
    </div>
    <div id="gamepack-stage" class="sunken-box"></div>
  `;

  body.querySelectorAll('[data-gtab]').forEach(btn => {
    btn.addEventListener('click', () => {
      safePlayGameTone('click');
      activeGameTab = btn.dataset.gtab;
      renderGamePackShell();
    });
  });

  launchActiveGame(activeGameTab);
}

window.renderGamePackShell = renderGamePackShell;
window.GAMEPACK_PIXEL_ICONS = GAMEPACK_PIXEL_ICONS;

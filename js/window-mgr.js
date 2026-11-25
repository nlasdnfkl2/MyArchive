// ============================================================
// MY-ARCHIVE 95 OS — Window Manager, Safe-Area Dock, Collapse,
// Spotlight (Ctrl+K), BIOS Text Setup & Workspace Snapshots
// ============================================================

window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
window.__MOD_VERSIONS.windowMgr =
  typeof APP_BUILD_VERSION !== 'undefined' ? APP_BUILD_VERSION : 'v2026.11.25-04';

const BIOS_SETUP_STORAGE_KEY = 'MYARCHIVE95_BIOS_CONFIG_V1';

const ALL_DESKTOP_THEMES = [
  'theme-teal',
  'theme-navy',
  'theme-olive',
  'theme-plum',
  'theme-brick',
  'theme-matrix',
  'theme-grid',
  'theme-vaporwave',
  'theme-amber-crt'
];

const TASKBAR_WIN_ICONS = {
  'win-main': `<svg width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="flex-shrink:0;"><path fill="#ffff00" stroke="#000" d="M1 3h6l1 2h7v9H1V3z"/></svg>`,
  'win-stats': `<svg width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="flex-shrink:0;"><rect x="1" y="2" width="14" height="12" fill="#ffffff" stroke="#000"/><rect x="3" y="8" width="2" height="4" fill="#000080"/><rect x="7" y="5" width="2" height="7" fill="#008000"/><rect x="11" y="6" width="2" height="6" fill="#800000"/></svg>`,
  'win-mailbox': `<svg width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="flex-shrink:0;"><rect x="1" y="3" width="14" height="10" fill="#ffff00" stroke="#000"/><polyline points="1,3 8,9 15,3" fill="none" stroke="#000" stroke-width="1.5"/></svg>`,
  'win-jukebox': `<svg width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="flex-shrink:0;"><path fill="#008000" d="M6 2h7v9h-1v2H9v-2h2V5H7v7H6v2H3v-2h2V2h1z"/></svg>`,
  'win-browser': `<svg width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="flex-shrink:0;"><rect x="2" y="2" width="12" height="12" fill="#000080" stroke="#000"/><rect x="4" y="4" width="8" height="8" fill="#00ffff"/></svg>`,
  'win-community': `<svg width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="flex-shrink:0;"><rect x="2" y="2" width="12" height="12" fill="#008000" stroke="#000"/><rect x="4" y="5" width="8" height="6" fill="#ffffff"/></svg>`,
  'win-visualizer': `<svg width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="flex-shrink:0;"><circle cx="4" cy="4" r="2" fill="#000080"/><circle cx="12" cy="5" r="2" fill="#800080"/><circle cx="8" cy="12" r="2" fill="#008000"/><line x1="4" y1="4" x2="12" y2="5" stroke="#000"/><line x1="4" y1="4" x2="8" y2="12" stroke="#000"/></svg>`,
  'win-calendar': `<svg width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="flex-shrink:0;"><rect x="2" y="2" width="12" height="12" fill="#ffffff" stroke="#000"/><rect x="2" y="2" width="12" height="3" fill="#800000"/></svg>`,
  'win-mood': `<svg width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="flex-shrink:0;"><rect x="2" y="2" width="12" height="12" fill="#ffff00" stroke="#000"/><rect x="5" y="5" width="2" height="2" fill="#000"/><rect x="9" y="5" width="2" height="2" fill="#000"/><rect x="5" y="10" width="6" height="2" fill="#000"/></svg>`,
  'win-quiz': `<svg width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="flex-shrink:0;"><rect x="2" y="2" width="12" height="12" fill="#000080" stroke="#000"/><text x="8" y="12" fill="#ffff00" font-size="10" font-weight="bold" text-anchor="middle">?</text></svg>`,
  'win-timeline': `<svg width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="flex-shrink:0;"><line x1="2" y1="8" x2="14" y2="8" stroke="#000" stroke-width="2"/><rect x="3" y="5" width="3" height="6" fill="#008080"/><rect x="10" y="4" width="3" height="8" fill="#800080"/></svg>`,
  'win-stamp': `<svg width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="flex-shrink:0;"><rect x="3" y="3" width="10" height="10" fill="#ffffff" stroke="#800000" stroke-width="2"/><rect x="5" y="5" width="6" height="6" fill="#800000"/></svg>`,
  'win-gamepack': `<svg width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="flex-shrink:0;"><rect x="1" y="4" width="14" height="8" fill="#dfdfdf" stroke="#000"/><rect x="4" y="6" width="2" height="4" fill="#000"/><rect x="3" y="7" width="4" height="2" fill="#000"/><rect x="10" y="7" width="2" height="2" fill="#800000"/></svg>`,
  'win-display-props': `<svg width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="flex-shrink:0;"><rect x="2" y="2" width="12" height="9" fill="#008080" stroke="#000"/><rect x="5" y="12" width="6" height="2" fill="#808080"/></svg>`
};

const DEFAULT_TASKBAR_ICON = `<svg width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="flex-shrink:0;"><rect x="1" y="2" width="14" height="12" fill="#c0c0c0" stroke="#000"/><rect x="2" y="3" width="12" height="3" fill="#000080"/></svg>`;

function sanitizeRetroWindowTitle(rawTitle) {
  return String(rawTitle || '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F]/gu, '')
    .replace(/^\[\s*\]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getShortTaskbarLabel(winEl) {
  const raw = sanitizeRetroWindowTitle(winEl.dataset.winTitle || winEl.id);
  const withoutCode = raw.replace(/^\[[A-Z0-9]+\]\s*/i, '');
  const trimmed = withoutCode.split('—')[0].split(' - ')[0].trim() || withoutCode;
  return trimmed.length > 18 ? `${trimmed.slice(0, 17)}…` : trimmed;
}

// ============================================================
// 0. 동기화 상태 배지 제어 (↻ 동기화 중 / ↻ 동기화 오류)
// ============================================================
let syncBadgeObserverBound = false;
let currentSyncErrorState = false;

function applyCleanSyncBadge(isError = false) {
  currentSyncErrorState = Boolean(isError);
  const badge = document.getElementById('cache-status-badge');
  if (!badge) return;

  const expectedHtml = isError
    ? `<span class="sync-arrow-icon" style="color:#cc0000;font-weight:700;">↻</span><span>동기화 오류</span>`
    : `<span class="sync-arrow-icon" style="color:#00aa00;font-weight:700;">↻</span><span>동기화 중</span>`;

  if (badge.innerHTML !== expectedHtml) {
    badge.innerHTML = expectedHtml;
  }
  badge.classList.toggle('error', isError);
  badge.classList.toggle('offline', isError);
}

function bindSyncBadgeGuard() {
  const badge = document.getElementById('cache-status-badge');
  if (!badge) return;

  applyCleanSyncBadge(navigator.onLine === false);

  if (!syncBadgeObserverBound && typeof MutationObserver !== 'undefined') {
    syncBadgeObserverBound = true;
    const observer = new MutationObserver(() => {
      const txt = (badge.textContent || '').trim();
      if (txt.includes('SHEET') || txt.includes('CACHE') || txt.includes('SYNCED') || txt.includes('OFFLINE')) {
        applyCleanSyncBadge(currentSyncErrorState || navigator.onLine === false);
      }
    });
    observer.observe(badge, { childList: true, characterData: true, subtree: true });
  }

  window.addEventListener('offline', () => applyCleanSyncBadge(true));
  window.addEventListener('online', () => applyCleanSyncBadge(false));
}

// ============================================================
// 1. 브라우저 설정 저장 및 BIOS 텍스트 설정 화면
// ============================================================
function readBrowserBiosConfig() {
  try {
    const raw = localStorage.getItem(BIOS_SETUP_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function writeBrowserBiosConfig(cfg) {
  try {
    localStorage.setItem(BIOS_SETUP_STORAGE_KEY, JSON.stringify(cfg));
  } catch {}
  if (typeof saveLocalCache === 'function' && typeof STORAGE_KEYS !== 'undefined' && STORAGE_KEYS.PREFS) {
    saveLocalCache(STORAGE_KEYS.PREFS, {
      theme: cfg.theme || 'teal',
      crt: Boolean(cfg.crt),
      soundEnabled: cfg.sound !== false,
      biosConfigured: true
    });
  }
}

function applyBiosConfigToSystem(cfg) {
  if (!cfg) return;
  applyTheme(cfg.theme || 'teal', false);
  applyCrtOverlayState(cfg.crt !== false);
  const statusLeft = document.getElementById('status-left');
  if (statusLeft && cfg.userName) {
    statusLeft.textContent = `BIOS CMOS 로드됨 — 운영자: ${cfg.userName} (${cfg.viewportWidth || 800}px 모드)`;
  }
}

function openBiosTextSetupScreen(existingCfg = {}) {
  let overlay = document.getElementById('bios-text-setup-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'bios-text-setup-overlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 250000;
      background: #0000a8;
      color: #f0f0f0;
      font-family: 'DungGeunMo', 'Fixedsys', monospace;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      overflow-y: auto;
    `;
    overlay.innerHTML = `
      <div style="position:fixed;inset:0;pointer-events:none;background:repeating-linear-gradient(to bottom,rgba(0,0,0,0.32) 0px,rgba(0,0,0,0.32) 2px,transparent 2px,transparent 4px);z-index:1;"></div>
      <div style="position:relative;z-index:2;width:min(740px,100%);border:3px double #ffffff;background:#000080;box-shadow:0 0 0 2px #0000a8,0 0 24px rgba(0,0,0,0.65);padding:14px 18px;">
        <div style="background:#c0c0c0;color:#000080;padding:3px 8px;font-weight:700;font-size:0.88rem;display:flex;justify-content:space-between;margin-bottom:12px;">
          <span>AWARD / ARCHIVE95 BIOS SETUP UTILITY — 초기 환경 설정</span>
          <span>CMOS v1.95</span>
        </div>
        <div style="font-size:0.78rem;color:#ffff55;line-height:1.5;margin-bottom:12px;border-bottom:1px dashed #8080ff;padding-bottom:8px;">
          * 브라우저 저장소에 초기 설정이 감지되지 않았습니다.<br/>
          * 아래 텍스트 설정 항목을 구성한 뒤 [F10 / 설정 저장 후 접속]을 눌러 시스템에 진입하십시오.
        </div>
        <div style="display:grid;grid-template-columns:180px 1fr;gap:10px 12px;align-items:center;font-size:0.84rem;margin-bottom:14px;">
          <label for="bios-cfg-user" style="color:#ffffff;font-weight:700;">[01] 사용자 이름</label>
          <input type="text" id="bios-cfg-user" value="문태양" style="background:#000040;color:#55ff55;border:1px solid #c0c0c0;padding:4px 8px;font-family:inherit;font-size:0.84rem;" />

          <label for="bios-cfg-theme" style="color:#ffffff;font-weight:700;">[02] 바탕화면 테마</label>
          <select id="bios-cfg-theme" style="background:#000040;color:#55ff55;border:1px solid #c0c0c0;padding:4px 8px;font-family:inherit;font-size:0.84rem;">
            <option value="teal">TEAL (클래식 청록)</option>
            <option value="navy">NAVY (딥 네이비)</option>
            <option value="olive">OLIVE (올리브 그린)</option>
            <option value="plum">PLUM (플럼 퍼플)</option>
            <option value="brick">BRICK (레트로 벽돌)</option>
            <option value="matrix">MATRIX (터미널 그린)</option>
            <option value="grid">GRID (모눈 그리드)</option>
          </select>

          <label for="bios-cfg-crt" style="color:#ffffff;font-weight:700;">[03] CRT 스캔라인</label>
          <select id="bios-cfg-crt" style="background:#000040;color:#55ff55;border:1px solid #c0c0c0;padding:4px 8px;font-family:inherit;font-size:0.84rem;">
            <option value="on">ENABLED (스캔라인 활성)</option>
            <option value="off">DISABLED (스캔라인 해제)</option>
          </select>

          <label for="bios-cfg-sound" style="color:#ffffff;font-weight:700;">[04] 8비트 사운드</label>
          <select id="bios-cfg-sound" style="background:#000040;color:#55ff55;border:1px solid #c0c0c0;padding:4px 8px;font-family:inherit;font-size:0.84rem;">
            <option value="on">ENABLED (효과음 켜기)</option>
            <option value="off">DISABLED (음소거)</option>
          </select>
        </div>
        <div style="background:#000040;border:1px solid #8080ff;padding:8px 10px;font-size:0.76rem;color:#00ffff;margin-bottom:14px;">
          STORAGE TARGET : BROWSER LOCALSTORAGE (${BIOS_SETUP_STORAGE_KEY})<br/>
          DISPLAY PROFILE : 800px COMPACT RETRO DESKTOP MODE
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;">
          <button type="button" id="bios-cfg-save-btn" style="background:#c0c0c0;color:#000000;border:2px solid #ffffff;padding:5px 14px;font-family:inherit;font-size:0.84rem;font-weight:700;cursor:pointer;">
            [ 설정 저장 후 접속 ]
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  document.getElementById('bios-cfg-user').value = existingCfg.userName || '문태양';
  document.getElementById('bios-cfg-theme').value = existingCfg.theme || 'teal';
  document.getElementById('bios-cfg-crt').value = existingCfg.crt === false ? 'off' : 'on';
  document.getElementById('bios-cfg-sound').value = existingCfg.sound === false ? 'off' : 'on';

  overlay.style.display = 'flex';

  const saveBtn = document.getElementById('bios-cfg-save-btn');
  saveBtn.onclick = () => {
    const nextCfg = {
      userName: (document.getElementById('bios-cfg-user').value || '문태양').trim(),
      theme: document.getElementById('bios-cfg-theme').value || 'teal',
      crt: document.getElementById('bios-cfg-crt').value === 'on',
      sound: document.getElementById('bios-cfg-sound').value === 'on',
      viewportWidth: 800,
      savedAt: new Date().toISOString()
    };
    writeBrowserBiosConfig(nextCfg);
    applyBiosConfigToSystem(nextCfg);
    overlay.style.display = 'none';
    if (typeof playRetroTone === 'function' && nextCfg.sound) playRetroTone('open');
  };
}

function checkFirstBootBiosSetup() {
  const cfg = readBrowserBiosConfig();
  if (!cfg) {
    openBiosTextSetupScreen({});
  } else {
    applyBiosConfigToSystem(cfg);
  }
}

// ============================================================
// 2. 바탕화면 안전 영역, 접기(Collapse), 스포트라이트 & 특수 테마 스타일 주입
// ============================================================
function injectOsEnhancementStyles() {
  if (document.getElementById('os95-enhancement-styles')) return;
  const style = document.createElement('style');
  style.id = 'os95-enhancement-styles';
  style.textContent = `
    .desktop-icons {
      z-index: 20 !important;
      max-height: calc(100vh - 80px);
    }
    .floating-win.win-collapsed {
      height: auto !important;
      min-height: 0 !important;
    }
    .floating-win.win-collapsed > .win-body {
      display: none !important;
    }
    body.audio-reactive-on .floating-win.focused {
      box-shadow: 4px 4px 0px #111111, 0 0 calc(8px + var(--audio-energy, 0) * 18px) rgba(255, 216, 59, calc(0.25 + var(--bass-level, 0) * 0.55)) !important;
    }
    body.theme-vaporwave {
      background: linear-gradient(135deg, #2b1055 0%, #7597de 100%) !important;
    }
    body.theme-amber-crt {
      background: #1a1100 !important;
    }
    #os95-spotlight-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.45);
      z-index: 19500;
      display: none;
      align-items: flex-start;
      justify-content: center;
      padding-top: 72px;
    }
    #os95-spotlight-backdrop.open {
      display: flex;
    }
    #os95-spotlight-box {
      width: min(580px, 92vw);
      background: var(--win-gray, #c0c0c0);
      border: 3px solid #111111;
      box-shadow: 6px 6px 0px #111111;
    }
    .spot-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      padding: 7px 10px;
      border-bottom: 1px solid #999;
      background: #ffffff;
      cursor: pointer;
      font-size: 0.84rem;
      font-weight: 800;
      color: #111111;
    }
    .spot-item.selected, .spot-item:hover {
      background: #000080;
      color: #ffffff;
    }
    .spot-item .spot-tag {
      font-family: var(--font-mono, monospace);
      font-size: 0.72rem;
      padding: 1px 6px;
      border: 1px solid currentColor;
      flex-shrink: 0;
    }
  `;
  document.head.appendChild(style);
}

// ============================================================
// 3. 초기 창 배치 (800px 폭 기준 정렬)
// ============================================================
function detectIconColumnSide() {
  const iconWrap = document.querySelector('.desktop-icons');
  if (!iconWrap) return 'left';
  const rect = iconWrap.getBoundingClientRect();
  if (rect.width === 0) return 'left';
  return rect.left > window.innerWidth / 2 ? 'right' : 'left';
}

function positionInitialWindows() {
  if (window.innerWidth <= 768) return;

  const cfg = window.DESKTOP_LAYOUT_CONFIG || {
    TOP_MENUBAR_HEIGHT: 30,
    ICON_COL_WIDTH: 124,
    EDGE_MARGIN: 14
  };
  const iconSide = detectIconColumnSide();
  const safeLeft = iconSide === 'left' ? cfg.ICON_COL_WIDTH + 12 : cfg.EDGE_MARGIN;
  const safeRight = iconSide === 'right' ? cfg.ICON_COL_WIDTH + 12 : cfg.EDGE_MARGIN;

  const statsWin = document.getElementById('win-stats') || document.querySelector('.floating-win[data-dock="right"]');
  if (statsWin && !statsWin.dataset.userMoved) {
    const statsW = Math.min(340, statsWin.offsetWidth || 320);
    const targetLeft = Math.max(safeLeft, window.innerWidth - statsW - safeRight);
    statsWin.style.right = 'auto';
    statsWin.style.left = `${targetLeft}px`;
    statsWin.style.top = `${cfg.TOP_MENUBAR_HEIGHT + 12}px`;
  }

  const mainWin = document.getElementById('win-main');
  if (mainWin && !mainWin.dataset.userMoved) {
    mainWin.style.left = `${safeLeft}px`;
    mainWin.style.top = `${cfg.TOP_MENUBAR_HEIGHT + 12}px`;
    const max800 = Math.min(760, window.innerWidth - safeLeft - safeRight);
    if (max800 >= 480) {
      mainWin.style.width = `${max800}px`;
      mainWin.style.maxWidth = `${max800}px`;
    }
  }
}

function attachCollapseButtonToWindow(winEl) {
  if (!winEl) return;
  const controls = winEl.querySelector('.win-controls');
  if (!controls || controls.querySelector('[data-action="collapse"]')) return;

  const colBtn = document.createElement('button');
  colBtn.type = 'button';
  colBtn.className = 'win-ctrl-btn';
  colBtn.dataset.action = 'collapse';
  colBtn.dataset.target = winEl.id;
  colBtn.title = '창 접기 / 펼치기';
  colBtn.textContent = '-';
  controls.insertBefore(colBtn, controls.firstChild);
}

function toggleCollapseWindow(winId) {
  const winEl = document.getElementById(winId);
  if (!winEl) return;
  const collapsed = winEl.classList.toggle('win-collapsed');
  const btn = winEl.querySelector('[data-action="collapse"]');
  if (btn) btn.textContent = collapsed ? '+' : '-';
  if (typeof playRetroTone === 'function') playRetroTone('click');
}

// ============================================================
// 4. 멀티 윈도우 제어 & 작업 표시줄 활성 창 숨김 토글
// ============================================================
function focusWindow(winEl) {
  if (!winEl) return;
  document.querySelectorAll('.floating-win').forEach(w => w.classList.remove('focused'));
  winEl.classList.remove('minimized');
  winEl.classList.add('focused');
  if (typeof topZIndex !== 'undefined') {
    winEl.style.zIndex = String(++topZIndex);
  }
  syncTaskbar();
}

function openWindow(winId) {
  const winEl = document.getElementById(winId);
  if (!winEl) return;
  attachCollapseButtonToWindow(winEl);
  const wasClosed = !winEl.classList.contains('open');
  winEl.classList.add('open');
  winEl.classList.remove('minimized');
  focusWindow(winEl);
  if (wasClosed && winId !== 'win-sys-msgbox' && typeof playRetroTone === 'function') {
    playRetroTone('open');
  }
  window.dispatchEvent(new CustomEvent('window:opened', { detail: { id: winId } }));
}

function closeWindow(winId) {
  const winEl = document.getElementById(winId);
  if (!winEl) return;
  if (typeof playRetroTone === 'function') playRetroTone('close');
  if (winEl.dataset.dynamic === 'true') {
    winEl.remove();
  } else {
    winEl.classList.remove('open', 'focused', 'minimized', 'win-maximized', 'win-collapsed');
  }
  syncTaskbar();
}

function minimizeWindow(winId) {
  const winEl = document.getElementById(winId);
  if (!winEl) return;
  if (typeof playRetroTone === 'function') playRetroTone('click');
  winEl.classList.add('minimized');
  winEl.classList.remove('focused');
  syncTaskbar();
}

function tileOpenWindows() {
  const openWins = Array.from(document.querySelectorAll('.floating-win.open:not(.minimized)'));
  if (!openWins.length) return;
  const iconSide = detectIconColumnSide();
  const safeLeft = iconSide === 'left' ? 132 : 16;
  const safeRight = iconSide === 'right' ? 132 : 16;
  const areaW = Math.min(800, Math.max(360, window.innerWidth - safeLeft - safeRight));
  const areaH = Math.max(300, window.innerHeight - 80);
  const cols = openWins.length === 1 ? 1 : 2;
  const rows = Math.ceil(openWins.length / cols);
  const cellW = Math.floor(areaW / cols) - 8;
  const cellH = Math.floor(areaH / rows) - 8;

  openWins.forEach((w, idx) => {
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    w.classList.remove('win-maximized', 'win-collapsed');
    w.dataset.userMoved = 'true';
    w.style.transform = 'none';
    w.style.left = `${safeLeft + c * (cellW + 8)}px`;
    w.style.top = `${38 + r * (cellH + 8)}px`;
    w.style.width = `${cellW}px`;
  });
  if (typeof playRetroTone === 'function') playRetroTone('click');
}

function cascadeOpenWindows() {
  const iconSide = detectIconColumnSide();
  const baseLeft = iconSide === 'left' ? 136 : 24;
  document.querySelectorAll('.floating-win.open').forEach((w, idx) => {
    w.classList.remove('minimized', 'win-maximized', 'win-collapsed');
    w.dataset.userMoved = 'true';
    w.style.transform = 'none';
    w.style.top = `${44 + idx * 28}px`;
    w.style.left = `${baseLeft + idx * 28}px`;
    focusWindow(w);
  });
  if (typeof playRetroTone === 'function') playRetroTone('click');
}

function syncTaskbar() {
  const container = document.getElementById('taskbar-windows');
  if (!container) return;
  container.innerHTML = '';

  document.querySelectorAll('.floating-win.open').forEach(winEl => {
    const tab = document.createElement('button');
    tab.type = 'button';
    const isActive = winEl.classList.contains('focused') && !winEl.classList.contains('minimized');
    tab.className = 'taskbar-win-btn' + (isActive ? ' active' : '');

    const iconSvg = TASKBAR_WIN_ICONS[winEl.id] || DEFAULT_TASKBAR_ICON;
    const labelText = getShortTaskbarLabel(winEl);
    tab.title = sanitizeRetroWindowTitle(winEl.dataset.winTitle || winEl.id);

    const iconWrap = document.createElement('span');
    iconWrap.className = 'taskbar-win-icon';
    iconWrap.innerHTML = iconSvg;

    const textSpan = document.createElement('span');
    textSpan.className = 'taskbar-win-label';
    textSpan.textContent = labelText || winEl.id;

    tab.appendChild(iconWrap);
    tab.appendChild(textSpan);

    // 작업 표시줄에서 활성 창을 누르면 숨김(최소화), 숨겨진 창을 누르면 다시 표시
    tab.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const currentlyActive = winEl.classList.contains('focused') && !winEl.classList.contains('minimized');
      if (currentlyActive) {
        minimizeWindow(winEl.id);
      } else {
        openWindow(winEl.id);
      }
    });
    container.appendChild(tab);
  });
}

// ============================================================
// 5. 창 타이틀바 드래그 이동 (마우스 및 터치 지원)
// ============================================================
function enableWindowDrag(winEl) {
  if (!winEl || winEl.dataset.dragBound === 'true') return;
  winEl.dataset.dragBound = 'true';
  attachCollapseButtonToWindow(winEl);

  winEl.addEventListener('mousedown', () => focusWindow(winEl));
  winEl.addEventListener('touchstart', () => focusWindow(winEl), { passive: true });

  const handle = winEl.querySelector('.draggable');
  if (!handle) return;

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let origLeft = 0;
  let origTop = 0;

  const onStart = (clientX, clientY, target) => {
    if (target.closest('button, a, input, select, textarea')) return;
    if (window.innerWidth <= 768) return;
    if (winEl.classList.contains('win-maximized')) return;
    isDragging = true;
    winEl.dataset.userMoved = 'true';
    focusWindow(winEl);

    if (winEl.style.transform && winEl.style.transform.includes('translate')) {
      const rect = winEl.getBoundingClientRect();
      winEl.style.transform = 'none';
      winEl.style.left = `${rect.left}px`;
      winEl.style.top = `${rect.top}px`;
    }

    startX = clientX;
    startY = clientY;
    origLeft = winEl.offsetLeft;
    origTop = winEl.offsetTop;
  };

  const onMove = (clientX, clientY) => {
    if (!isDragging) return;
    const nextLeft = Math.max(0, Math.min(window.innerWidth - 120, origLeft + (clientX - startX)));
    const nextTop = Math.max(30, Math.min(window.innerHeight - 60, origTop + (clientY - startY)));
    winEl.style.left = `${nextLeft}px`;
    winEl.style.top = `${nextTop}px`;
  };

  const onEnd = () => {
    isDragging = false;
  };

  handle.addEventListener('mousedown', e => onStart(e.clientX, e.clientY, e.target));
  window.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
  window.addEventListener('mouseup', onEnd);

  handle.addEventListener('touchstart', e => {
    if (e.touches.length === 1) onStart(e.touches[0].clientX, e.touches[0].clientY, e.target);
  }, { passive: true });
  window.addEventListener('touchmove', e => {
    if (isDragging && e.touches.length === 1) onMove(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  window.addEventListener('touchend', onEnd);
}

document.addEventListener('click', e => {
  const ctrlBtn = e.target.closest('[data-action][data-target]');
  if (!ctrlBtn) return;
  e.preventDefault();
  e.stopPropagation();
  const action = ctrlBtn.dataset.action;
  const targetId = ctrlBtn.dataset.target;
  if (action === 'minimize') minimizeWindow(targetId);
  if (action === 'close') closeWindow(targetId);
  if (action === 'collapse') toggleCollapseWindow(targetId);
});

// ============================================================
// 6. 작업 공간 프리셋 & 스포트라이트 (Ctrl+K)
// ============================================================
const BUILTIN_WORKSPACES = [
  { id: 'ws-listen', name: '감상 모드 (주크박스 + 시각화)', windows: ['win-jukebox', 'win-visualizer'] },
  { id: 'ws-explore', name: '탐색 모드 (아카이브 + 정보바다 탐색기)', windows: ['win-main', 'win-browser'] },
  { id: 'ws-plaza', name: '광장 모드 (커뮤니티 + 주크박스)', windows: ['win-community', 'win-jukebox'] }
];

function applyWorkspacePreset(presetId) {
  const saved = typeof loadLocalCache === 'function' ? loadLocalCache(STORAGE_KEYS.WORKSPACES, []) : [];
  const allPresets = [...BUILTIN_WORKSPACES, ...(Array.isArray(saved) ? saved : [])];
  const preset = allPresets.find(p => p.id === presetId);
  if (!preset) return;

  document.querySelectorAll('.floating-win.open').forEach(w => {
    if (!preset.windows.includes(w.id)) closeWindow(w.id);
  });

  preset.windows.forEach(winId => {
    if (winId === 'win-browser' && typeof window.openVirtualBrowser === 'function') {
      window.openVirtualBrowser('about:home');
    } else {
      openWindow(winId);
    }
  });

  tileOpenWindows();
  if (typeof playRetroTone === 'function') playRetroTone('open');
}

function saveCurrentWorkspaceSnapshot() {
  const openWins = Array.from(document.querySelectorAll('.floating-win.open:not(.minimized)'));
  if (!openWins.length) return;
  const layoutMap = {};
  openWins.forEach(w => {
    layoutMap[w.id] = {
      left: w.style.left || `${w.offsetLeft}px`,
      top: w.style.top || `${w.offsetTop}px`,
      width: w.style.width || ''
    };
  });
  const saved = typeof loadLocalCache === 'function' ? loadLocalCache(STORAGE_KEYS.WORKSPACES, []) : [];
  const next = [
    ...(Array.isArray(saved) ? saved.filter(x => x.id !== 'ws-custom-latest') : []),
    { id: 'ws-custom-latest', name: `사용자 저장 배치 (${openWins.length}개 창)`, windows: openWins.map(w => w.id), layoutMap }
  ];
  if (typeof saveLocalCache === 'function') saveLocalCache(STORAGE_KEYS.WORKSPACES, next);
  if (typeof playRetroTone === 'function') playRetroTone('open');
}

let spotlightSelectedIndex = 0;
let spotlightFilteredItems = [];

function ensureSpotlightPalette() {
  if (document.getElementById('os95-spotlight-backdrop')) return;
  const backdrop = document.createElement('div');
  backdrop.id = 'os95-spotlight-backdrop';
  backdrop.innerHTML = `
    <div id="os95-spotlight-box" role="dialog" aria-label="SPOTLIGHT 95 커맨드 팔레트">
      <div class="win-titlebar" style="background:#000080; color:#ffffff;">
        <div class="win-title-left"><span class="win-title-dot"></span><span>SPOTLIGHT95.EXE — 통합 검색 (Ctrl+K)</span></div>
        <div class="win-controls"><button type="button" class="win-ctrl-btn close" id="btn-spot-close">X</button></div>
      </div>
      <div style="padding:10px;">
        <input type="text" id="os95-spotlight-input" placeholder="아카이브 제목, 앱 실행, 설정 화면 검색..." style="width:100%; font-size:0.88rem; font-weight:800; padding:7px 9px; margin-bottom:8px;" />
        <div id="os95-spotlight-list" style="max-height:290px; overflow-y:auto; border:2px solid #111111; background:#ffffff;"></div>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  backdrop.addEventListener('click', e => { if (e.target === backdrop) closeSpotlightPalette(); });
  document.getElementById('btn-spot-close')?.addEventListener('click', closeSpotlightPalette);

  const inp = document.getElementById('os95-spotlight-input');
  inp?.addEventListener('input', () => { spotlightSelectedIndex = 0; renderSpotlightResults(inp.value); });
  inp?.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (spotlightFilteredItems.length) { spotlightSelectedIndex = (spotlightSelectedIndex + 1) % spotlightFilteredItems.length; renderSpotlightResults(inp.value); }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (spotlightFilteredItems.length) { spotlightSelectedIndex = (spotlightSelectedIndex - 1 + spotlightFilteredItems.length) % spotlightFilteredItems.length; renderSpotlightResults(inp.value); }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const chosen = spotlightFilteredItems[spotlightSelectedIndex];
      if (chosen && typeof chosen.run === 'function') { closeSpotlightPalette(); chosen.run(); }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeSpotlightPalette();
    }
  });
}

function buildSpotlightCatalog() {
  const cmds = [
    { tag: 'APP', label: '아카이브 탐색기 열기 (MY-ARCHIVE)', run: () => openWindow('win-main') },
    { tag: 'BIOS', label: 'BIOS 텍스트 설정 화면 열기', run: () => openBiosTextSetupScreen(readBrowserBiosConfig() || {}) },
    { tag: 'NEW', label: '새 감상 기록 등록하기 (+)', run: () => { if (typeof openRegisterModal === 'function') openRegisterModal(); } },
    { tag: 'AUD', label: '주크박스 95 열기 (JUKEBOX95.EXE)', run: () => { openWindow('win-jukebox'); if (typeof updateJukebox === 'function') updateJukebox(); } },
    { tag: 'WIN', label: '열린 창 바둑판 정렬', run: tileOpenWindows },
    { tag: 'WIN', label: '열린 창 계단식 정렬', run: cascadeOpenWindows }
  ];
  const items = Array.isArray(archiveItems) ? archiveItems : [];
  items.slice(0, 60).forEach(it => {
    cmds.push({
      tag: it.category || 'DAT',
      label: `${it.title} — ${it.creator} (${it.watchDate})`,
      run: () => { if (typeof spawnDetailWindow === 'function') spawnDetailWindow(it); }
    });
  });
  return cmds;
}

function renderSpotlightResults(query = '') {
  const listEl = document.getElementById('os95-spotlight-list');
  if (!listEl) return;
  const q = String(query || '').trim().toLowerCase();
  const catalog = buildSpotlightCatalog();
  spotlightFilteredItems = q ? catalog.filter(c => `${c.tag} ${c.label}`.toLowerCase().includes(q)).slice(0, 14) : catalog.slice(0, 12);
  if (spotlightSelectedIndex >= spotlightFilteredItems.length) spotlightSelectedIndex = 0;

  listEl.innerHTML = spotlightFilteredItems.map((item, idx) => `
    <div class="spot-item ${idx === spotlightSelectedIndex ? 'selected' : ''}" data-spot-idx="${idx}">
      <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(item.label)}</span>
      <span class="spot-tag">${esc(item.tag)}</span>
    </div>
  `).join('');

  listEl.querySelectorAll('[data-spot-idx]').forEach(row => {
    row.addEventListener('click', () => {
      const chosen = spotlightFilteredItems[Number(row.dataset.spotIdx)];
      if (chosen && typeof chosen.run === 'function') { closeSpotlightPalette(); chosen.run(); }
    });
  });
}

function openSpotlightPalette() {
  ensureSpotlightPalette();
  const backdrop = document.getElementById('os95-spotlight-backdrop');
  const inp = document.getElementById('os95-spotlight-input');
  if (!backdrop || !inp) return;
  spotlightSelectedIndex = 0;
  inp.value = '';
  renderSpotlightResults('');
  backdrop.classList.add('open');
  setTimeout(() => inp.focus(), 10);
}

function closeSpotlightPalette() {
  document.getElementById('os95-spotlight-backdrop')?.classList.remove('open');
}

// ============================================================
// 7. 테마, CRT, 시계, 작업 관리자 및 초기화
// ============================================================
function applyTheme(themeName, persist = true) {
  const safeTheme = String(themeName || 'teal').trim() || 'teal';
  document.body.classList.remove(...ALL_DESKTOP_THEMES);
  document.body.classList.add(`theme-${safeTheme}`);

  if (persist) {
    const cur = readBrowserBiosConfig() || {};
    cur.theme = safeTheme;
    writeBrowserBiosConfig(cur);
  }
}

function applyCrtOverlayState(enabled) {
  const crtEnabled = Boolean(enabled);
  const crtEl = document.getElementById('crt-overlay');
  if (crtEl) {
    crtEl.classList.toggle('hidden', !crtEnabled);
    crtEl.style.display = crtEnabled ? 'block' : 'none';
  }
  const topChk = document.getElementById('chk-crt');
  if (topChk) topChk.checked = crtEnabled;
  const dispChk = document.getElementById('chk-crt-scanline');
  if (dispChk) dispChk.checked = crtEnabled;
}

function applyDesktopPreferences() {
  const cfg = readBrowserBiosConfig();
  if (cfg) {
    applyBiosConfigToSystem(cfg);
  } else {
    applyTheme('teal', false);
    applyCrtOverlayState(true);
  }
}

function updateTaskbarClock() {
  const el = document.getElementById('taskbar-clock');
  if (!el) return;
  const now = new Date();
  el.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function openTaskManager() {
  openWindow('win-taskmgr');
  renderTaskManagerList();
}

function renderTaskManagerList() {
  const listBox = document.getElementById('taskmgr-list');
  if (!listBox) return;
  const openWins = Array.from(document.querySelectorAll('.floating-win.open'));
  if (!openWins.length) {
    listBox.innerHTML = '<div style="padding:12px;color:#555;font-size:0.8rem;">현재 실행 중인 응용 프로그램이 없습니다.</div>';
    return;
  }
  listBox.innerHTML = openWins.map(w => {
    const title = sanitizeRetroWindowTitle(w.dataset.winTitle || w.id) || w.id;
    const status = w.classList.contains('minimized') ? '최소화됨' : '응답 중';
    return `
      <div class="taskmgr-row" data-win-id="${esc(w.id)}">
        <span><b>${esc(title)}</b></span>
        <span style="font-size:0.74rem;color:#006600;font-weight:800;">[${status}]</span>
        <div style="display:flex;gap:4px;">
          <button type="button" class="btn95 sm" data-tm-focus="${esc(w.id)}">전환</button>
          <button type="button" class="btn95 pink sm" data-tm-kill="${esc(w.id)}">작업 끝내기</button>
        </div>
      </div>
    `;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  injectOsEnhancementStyles();
  bindSyncBadgeGuard();
  applyDesktopPreferences();
  checkFirstBootBiosSetup();

  document.querySelectorAll('.floating-win').forEach(enableWindowDrag);
  positionInitialWindows();
  syncTaskbar();
  updateTaskbarClock();
  setInterval(updateTaskbarClock, 15000);

  window.addEventListener('resize', positionInitialWindows);

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const bd = document.getElementById('os95-spotlight-backdrop');
      if (bd && bd.classList.contains('open')) closeSpotlightPalette();
      else openSpotlightPalette();
    }
  });

  document.querySelectorAll('[data-theme-opt]').forEach(btn => {
    btn.addEventListener('click', () => {
      applyTheme(btn.dataset.themeOpt, true);
      if (typeof playRetroTone === 'function') playRetroTone('click');
    });
  });

  document.getElementById('mnu-toggle-crt')?.addEventListener('click', () => {
    const cfg = readBrowserBiosConfig() || { theme: 'teal', crt: true, sound: true };
    cfg.crt = !cfg.crt;
    writeBrowserBiosConfig(cfg);
    applyCrtOverlayState(cfg.crt);
  });

  const bindLauncher = (selectors, winId) => {
    selectors.forEach(sel => {
      document.getElementById(sel)?.addEventListener('click', () => openWindow(winId));
    });
  };

  bindLauncher(['icon-calendar', 'mnu-open-calendar', 'sm-calendar'], 'win-calendar');
  bindLauncher(['icon-mood', 'mnu-open-mood', 'sm-mood'], 'win-mood');
  bindLauncher(['icon-quiz', 'mnu-open-quiz', 'sm-quiz'], 'win-quiz');
  bindLauncher(['icon-timeline', 'mnu-open-timeline', 'sm-timeline'], 'win-timeline');
  bindLauncher(['icon-stamp', 'mnu-open-stamp', 'sm-stamp'], 'win-stamp');
  bindLauncher(['icon-mailbox', 'mnu-open-mailbox', 'sm-mailbox'], 'win-mailbox');
  bindLauncher(['icon-jukebox', 'mnu-open-jukebox', 'tray-jukebox-mini'], 'win-jukebox');
  bindLauncher(['icon-visualizer', 'mnu-open-visualizer'], 'win-visualizer');
  bindLauncher(['icon-gamepack', 'mnu-open-gamepack'], 'win-gamepack');
});

window.focusWindow = focusWindow;
window.openWindow = openWindow;
window.closeWindow = closeWindow;
window.minimizeWindow = minimizeWindow;
window.toggleCollapseWindow = toggleCollapseWindow;
window.tileOpenWindows = tileOpenWindows;
window.cascadeOpenWindows = cascadeOpenWindows;
window.positionInitialWindows = positionInitialWindows;
window.openSpotlightPalette = openSpotlightPalette;
window.applyWorkspacePreset = applyWorkspacePreset;
window.syncTaskbar = syncTaskbar;
window.enableWindowDrag = enableWindowDrag;
window.applyTheme = applyTheme;
window.openTaskManager = openTaskManager;
window.openBiosTextSetupScreen = openBiosTextSetupScreen;
window.applyCleanSyncBadge = applyCleanSyncBadge;

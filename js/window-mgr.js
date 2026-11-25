// ============================================================
// MY-ARCHIVE 95 OS — Window Manager, Safe-Area Dock, Collapse,
// Spotlight (Ctrl+K) Command Palette & Workspace Snapshots
// ============================================================

window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
window.__MOD_VERSIONS.windowMgr = typeof APP_BUILD_VERSION !== 'undefined' ? APP_BUILD_VERSION : 'v2026.11.25-01';

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

function sanitizeRetroWindowTitle(rawTitle) {
  return String(rawTitle || '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F]/gu, '')
    .replace(/^\[\s*\]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================
// 0. 바탕화면 안전 영역, 접기(Collapse), 스포트라이트 & 특수 테마 스타일 주입
// ============================================================
function injectOsEnhancementStyles() {
  if (document.getElementById('os95-enhancement-styles')) return;
  const style = document.createElement('style');
  style.id = 'os95-enhancement-styles';
  style.textContent = `
    /* 1단계: 바탕화면 아이콘 안전 영역 보호 */
    .desktop-icons {
      z-index: 20 !important;
      max-height: calc(100vh - 76px);
    }
    /* 창 접기(Roll-up Collapse) 상태 */
    .floating-win.win-collapsed {
      height: auto !important;
      min-height: 0 !important;
    }
    .floating-win.win-collapsed > .win-body {
      display: none !important;
    }
    /* 오디오 리액티브 활성 창 글로우 (jukebox.js 브로드캐스트 연동) */
    body.audio-reactive-on .floating-win.focused {
      box-shadow: 4px 4px 0px #111111, 0 0 calc(8px + var(--audio-energy, 0) * 18px) rgba(255, 216, 59, calc(0.25 + var(--bass-level, 0) * 0.55)) !important;
    }
    /* 해금 전용 히든 테마 */
    body.theme-vaporwave {
      background: linear-gradient(135deg, #2b1055 0%, #7597de 100%) !important;
    }
    body.theme-amber-crt {
      background: #1a1100 !important;
    }
    /* 스포트라이트(Ctrl+K) 커맨드 팔레트 */
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
      font-size: 0.82rem;
      font-weight: 800;
      color: #111111;
    }
    .spot-item.selected, .spot-item:hover {
      background: #000080;
      color: #ffffff;
    }
    .spot-item .spot-tag {
      font-family: var(--font-mono, monospace);
      font-size: 0.7rem;
      padding: 1px 6px;
      border: 1px solid currentColor;
      flex-shrink: 0;
    }
    /* 바탕화면 포스트잇 스티커 레이어 */
    #os95-sticker-layer {
      position: fixed;
      inset: 30px 0 40px 0;
      pointer-events: none;
      z-index: 25;
    }
    .desk-sticky-note {
      position: absolute;
      width: 215px;
      background: #fff9a6;
      border: 2px solid #111111;
      box-shadow: 3px 3px 0px #111111;
      pointer-events: auto;
      font-size: 0.76rem;
      color: #111111;
    }
    .desk-sticky-head {
      background: #ffd83b;
      border-bottom: 1.5px solid #111111;
      padding: 3px 7px;
      font-weight: 900;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: move;
      user-select: none;
    }
    .desk-sticky-body {
      padding: 7px 8px;
      font-weight: 700;
      line-height: 1.4;
      word-break: keep-all;
    }
  `;
  document.head.appendChild(style);
}

// ============================================================
// 1. 초기 통계 창 / 우측 창 안전 영역 분리 및 동적 좌표 보정
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
    ICON_COL_WIDTH: 116,
    EDGE_MARGIN: 16
  };
  const iconSide = detectIconColumnSide();
  const safeLeft = iconSide === 'left' ? cfg.ICON_COL_WIDTH + 12 : cfg.EDGE_MARGIN;
  const safeRight = iconSide === 'right' ? cfg.ICON_COL_WIDTH + 12 : cfg.EDGE_MARGIN;

  // 1) 통계 창(#win-stats 또는 [data-dock="right"]) 우측 안전 영역 끝 고정 배치
  const statsWin = document.getElementById('win-stats') || document.querySelector('.floating-win[data-dock="right"]');
  if (statsWin && !statsWin.dataset.userMoved) {
    const statsW = statsWin.offsetWidth || 320;
    const targetLeft = Math.max(safeLeft, window.innerWidth - statsW - safeRight);
    statsWin.style.right = 'auto';
    statsWin.style.left = `${targetLeft}px`;
    statsWin.style.top = `${cfg.TOP_MENUBAR_HEIGHT + 14}px`;
  }

  // 2) 메인 아카이브 창(#win-main)이 바탕화면 아이콘 열 또는 우측 통계 창과 겹치지 않도록 보정
  const mainWin = document.getElementById('win-main');
  if (mainWin && !mainWin.dataset.userMoved) {
    mainWin.style.left = `${safeLeft}px`;
    mainWin.style.top = `${cfg.TOP_MENUBAR_HEIGHT + 12}px`;
    if (statsWin && statsWin.classList.contains('open')) {
      const availWidth = window.innerWidth - safeLeft - (statsWin.offsetWidth || 320) - safeRight - 14;
      if (availWidth >= 520) {
        mainWin.style.maxWidth = `${availWidth}px`;
      }
    } else {
      const maxAvail = window.innerWidth - safeLeft - safeRight;
      if (maxAvail >= 520) {
        mainWin.style.maxWidth = `${maxAvail}px`;
      }
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
// 2. 멀티 윈도우 제어 (포커스, 열기/닫기, 최소화, 정렬, 작업표시줄)
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
  const safeLeft = iconSide === 'left' ? 128 : 16;
  const safeRight = iconSide === 'right' ? 128 : 16;
  const areaW = Math.max(360, window.innerWidth - safeLeft - safeRight);
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
  const baseLeft = iconSide === 'left' ? 132 : 24;
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
    tab.className = 'taskbar-tab' + (winEl.classList.contains('focused') && !winEl.classList.contains('minimized') ? ' active' : '');
    const cleanTitle = sanitizeRetroWindowTitle(winEl.dataset.winTitle || winEl.id);
    tab.textContent = cleanTitle || winEl.id;
    tab.addEventListener('click', () => {
      if (winEl.classList.contains('minimized') || !winEl.classList.contains('focused')) {
        focusWindow(winEl);
      } else {
        minimizeWindow(winEl.id);
      }
    });
    container.appendChild(tab);
  });
}

// ============================================================
// 3. 창 타이틀바 드래그 이동 (마우스 및 터치 지원)
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

// 창 컨트롤 버튼([_], [-], [X]) 전역 위임
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
// 4. 작업 공간 프리셋 (Workspace Snapshots)
// ============================================================
const BUILTIN_WORKSPACES = [
  {
    id: 'ws-listen',
    name: '감상 모드 (주크박스 + 시각화)',
    windows: ['win-jukebox', 'win-visualizer']
  },
  {
    id: 'ws-explore',
    name: '탐색 모드 (아카이브 + 정보바다 탐색기)',
    windows: ['win-main', 'win-browser']
  },
  {
    id: 'ws-plaza',
    name: '광장 모드 (커뮤니티 + 주크박스)',
    windows: ['win-community', 'win-jukebox']
  }
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

  if (preset.layoutMap) {
    Object.entries(preset.layoutMap).forEach(([winId, pos]) => {
      const el = document.getElementById(winId);
      if (el && pos) {
        el.dataset.userMoved = 'true';
        el.style.left = pos.left;
        el.style.top = pos.top;
        if (pos.width) el.style.width = pos.width;
      }
    });
  } else {
    tileOpenWindows();
  }

  const statusLeft = document.getElementById('status-left');
  if (statusLeft) statusLeft.textContent = `[WORKSPACE] '${preset.name}' 레이아웃 적용 완료`;
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
    {
      id: 'ws-custom-latest',
      name: `사용자 저장 배치 (${openWins.length}개 창)`,
      windows: openWins.map(w => w.id),
      layoutMap
    }
  ];
  if (typeof saveLocalCache === 'function') saveLocalCache(STORAGE_KEYS.WORKSPACES, next);
  const statusLeft = document.getElementById('status-left');
  if (statusLeft) statusLeft.textContent = '[WORKSPACE] 현재 열려 있는 창 배치가 스냅샷으로 저장되었습니다.';
  if (typeof playRetroTone === 'function') playRetroTone('open');
}

// ============================================================
// 5. 스포트라이트(Spotlight) 통합 커맨드 팔레트 (Ctrl/Cmd + K)
// ============================================================
let spotlightSelectedIndex = 0;
let spotlightFilteredItems = [];

function ensureSpotlightPalette() {
  if (document.getElementById('os95-spotlight-backdrop')) return;
  const backdrop = document.createElement('div');
  backdrop.id = 'os95-spotlight-backdrop';
  backdrop.innerHTML = `
    <div id="os95-spotlight-box" role="dialog" aria-label="SPOTLIGHT 95 커맨드 팔레트">
      <div class="win-titlebar" style="background:#000080; color:#ffffff;">
        <div class="win-title-left">
          <span class="win-title-dot" style="background:var(--brutal-yellow, #ffd83b);"></span>
          <span>SPOTLIGHT95.EXE — 통합 검색 및 빠른 명령 (Ctrl+K)</span>
        </div>
        <div class="win-controls">
          <button type="button" class="win-ctrl-btn close" id="btn-spot-close">X</button>
        </div>
      </div>
      <div style="padding:10px;">
        <input type="text" id="os95-spotlight-input" placeholder="아카이브 제목, 음악, 앱 실행, 창 정렬, 작업 공간 프리셋 검색..." style="width:100%; font-size:0.88rem; font-weight:800; padding:7px 9px; margin-bottom:8px;" />
        <div id="os95-spotlight-list" style="max-height:290px; overflow-y:auto; border:2px solid #111111; background:#ffffff;"></div>
        <div style="display:flex; justify-content:space-between; font-size:0.72rem; font-weight:800; color:#333; margin-top:6px;">
          <span>[↑/↓] 이동 · [Enter] 실행 · [ESC] 닫기</span>
          <span>MY-ARCHIVE 95 COMMAND</span>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) closeSpotlightPalette();
  });
  document.getElementById('btn-spot-close')?.addEventListener('click', closeSpotlightPalette);

  const inp = document.getElementById('os95-spotlight-input');
  inp?.addEventListener('input', () => {
    spotlightSelectedIndex = 0;
    renderSpotlightResults(inp.value);
  });

  inp?.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (spotlightFilteredItems.length) {
        spotlightSelectedIndex = (spotlightSelectedIndex + 1) % spotlightFilteredItems.length;
        renderSpotlightResults(inp.value);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (spotlightFilteredItems.length) {
        spotlightSelectedIndex = (spotlightSelectedIndex - 1 + spotlightFilteredItems.length) % spotlightFilteredItems.length;
        renderSpotlightResults(inp.value);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const chosen = spotlightFilteredItems[spotlightSelectedIndex];
      if (chosen && typeof chosen.run === 'function') {
        closeSpotlightPalette();
        chosen.run();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeSpotlightPalette();
    }
  });
}

function buildSpotlightCatalog() {
  const cmds = [
    { tag: 'APP', label: '아카이브 탐색기 열기 (MY-ARCHIVE)', run: () => openWindow('win-main') },
    { tag: 'NEW', label: '새 감상 기록 등록하기 (+)', run: () => { if (typeof openRegisterModal === 'function') openRegisterModal(); } },
    { tag: 'AUD', label: '주크박스 95 열기 (JUKEBOX95.EXE)', run: () => { openWindow('win-jukebox'); if (typeof updateJukebox === 'function') updateJukebox(); } },
    { tag: 'VIS', label: '지식 그래프 & 키워드 시각화 (VISUALIZER95.EXE)', run: () => openWindow('win-visualizer') },
    { tag: 'WEB', label: '정보바다 탐색기 95 열기 (EXPLORER95.EXE)', run: () => { if (typeof openVirtualBrowser === 'function') openVirtualBrowser('about:home'); } },
    { tag: 'SNS', label: '광장 게시판 열기 (COMMUNITY95.EXE)', run: () => { if (typeof openCommunityBoard === 'function') openCommunityBoard(); } },
    { tag: 'GAM', label: '레트로 미니게임 팩 열기 (GAMEPACK95.EXE)', run: () => openWindow('win-gamepack') },
    { tag: 'CAL', label: '월별 감상 달력 & D-Day 열기 (CALENDAR95.EXE)', run: () => openWindow('win-calendar') },
    { tag: 'MOD', label: '감정 상태별 작품 추천기 (MOODPICK.EXE)', run: () => openWindow('win-mood') },
    { tag: 'QUZ', label: '아카이브 복습 퀴즈 & 초성 챌린지 (QUIZ95.EXE)', run: () => openWindow('win-quiz') },
    { tag: 'TIM', label: '연대기 가로 연표 & 레이더 차트 (TIMELINE95.EXE)', run: () => openWindow('win-timeline') },
    { tag: 'STM', label: '전자 직인 생성기 & 문화생활 가계부 (STAMP95.EXE)', run: () => openWindow('win-stamp') },
    { tag: 'MAL', label: '비밀 추천 우체통 & 모바일 QR (MAILBOX95.EXE)', run: () => openWindow('win-mailbox') },
    { tag: 'TXT', label: '퀵 메모장 열기 (MEMOPAD.EXE)', run: () => { if (typeof openMemoWindow === 'function') openMemoWindow(); } },
    { tag: 'WIN', label: '열린 창 바둑판 정렬 (Tile Windows)', run: tileOpenWindows },
    { tag: 'WIN', label: '열린 창 계단식 정렬 (Cascade Windows)', run: cascadeOpenWindows },
    { tag: 'WSP', label: '작업 공간: 감상 모드 (주크박스 + 시각화)', run: () => applyWorkspacePreset('ws-listen') },
    { tag: 'WSP', label: '작업 공간: 탐색 모드 (아카이브 + 탐색기)', run: () => applyWorkspacePreset('ws-explore') },
    { tag: 'WSP', label: '작업 공간: 광장 모드 (커뮤니티 + 주크박스)', run: () => applyWorkspacePreset('ws-plaza') },
    { tag: 'WSP', label: '작업 공간: 사용자 저장 배치 불러오기', run: () => applyWorkspacePreset('ws-custom-latest') },
    { tag: 'WSP', label: '작업 공간: 현재 창 배치 스냅샷 저장', run: saveCurrentWorkspaceSnapshot },
    { tag: 'STK', label: '바탕화면 포스트잇 스티커 레이어 토글', run: () => { if (typeof window.toggleDesktopStickerLayer === 'function') window.toggleDesktopStickerLayer(); } }
  ];

  const items = Array.isArray(archiveItems) ? archiveItems : [];
  items.slice(0, 60).forEach(it => {
    cmds.push({
      tag: it.category || 'DAT',
      label: `${it.title} — ${it.creator} (${it.watchDate})`,
      run: () => {
        if (typeof spawnDetailWindow === 'function') spawnDetailWindow(it);
      }
    });
    if (it.category === '음악') {
      cmds.push({
        tag: 'PLAY',
        label: `[주크박스 즉시 재생] ${it.title} — ${it.creator}`,
        run: () => {
          openWindow('win-jukebox');
          if (typeof updateJukebox === 'function') updateJukebox();
          if (typeof playJukeboxTrack === 'function') {
            const idx = (window.jbState?.playlist || []).findIndex(x => x.id === it.id);
            playJukeboxTrack(idx >= 0 ? idx : 0);
          }
        }
      });
    }
  });

  return cmds;
}

function renderSpotlightResults(query = '') {
  const listEl = document.getElementById('os95-spotlight-list');
  if (!listEl) return;
  const q = String(query || '').trim().toLowerCase();
  const catalog = buildSpotlightCatalog();
  spotlightFilteredItems = q
    ? catalog.filter(c => `${c.tag} ${c.label}`.toLowerCase().includes(q)).slice(0, 14)
    : catalog.slice(0, 12);

  if (spotlightSelectedIndex >= spotlightFilteredItems.length) {
    spotlightSelectedIndex = 0;
  }

  if (!spotlightFilteredItems.length) {
    listEl.innerHTML = `<div style="padding:14px; text-align:center; font-size:0.8rem; color:#555;">일치하는 명령이나 아카이브 자료가 없습니다.</div>`;
    return;
  }

  listEl.innerHTML = spotlightFilteredItems.map((item, idx) => `
    <div class="spot-item ${idx === spotlightSelectedIndex ? 'selected' : ''}" data-spot-idx="${idx}">
      <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(item.label)}</span>
      <span class="spot-tag">${esc(item.tag)}</span>
    </div>
  `).join('');

  listEl.querySelectorAll('[data-spot-idx]').forEach(row => {
    row.addEventListener('click', () => {
      const idx = Number(row.dataset.spotIdx);
      const chosen = spotlightFilteredItems[idx];
      if (chosen && typeof chosen.run === 'function') {
        closeSpotlightPalette();
        chosen.run();
      }
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
  if (typeof playRetroTone === 'function') playRetroTone('open');
  setTimeout(() => inp.focus(), 10);
}

function closeSpotlightPalette() {
  const backdrop = document.getElementById('os95-spotlight-backdrop');
  if (backdrop) backdrop.classList.remove('open');
}

// ============================================================
// 6. 바탕화면 테마, CRT 효과, 시스템 시계, BSOD 및 창 런처 바인딩
// ============================================================
function applyTheme(themeName, persist = true) {
  const safeTheme = String(themeName || 'teal').trim() || 'teal';
  document.body.classList.remove(...ALL_DESKTOP_THEMES);
  document.body.classList.add(`theme-${safeTheme}`);

  if (persist && typeof loadLocalCache === 'function' && typeof saveLocalCache === 'function' && typeof STORAGE_KEYS !== 'undefined') {
    const prefs = loadLocalCache(STORAGE_KEYS.PREFS, { theme: 'teal', crt: false, soundEnabled: true }) || {};
    prefs.theme = safeTheme;
    saveLocalCache(STORAGE_KEYS.PREFS, prefs);
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
  const prefs = (typeof loadLocalCache === 'function' && typeof STORAGE_KEYS !== 'undefined')
    ? (loadLocalCache(STORAGE_KEYS.PREFS, { theme: 'teal', crt: false, soundEnabled: true }) || {})
    : { theme: 'teal', crt: false, soundEnabled: true };

  applyTheme(prefs.theme || 'teal', false);
  applyCrtOverlayState(Boolean(prefs.crt));
}

function updateTaskbarClock() {
  const el = document.getElementById('taskbar-clock');
  if (!el) return;
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  el.textContent = `${hh}:${mm}`;
}

function triggerBsodEasterEgg() {
  if (typeof playRetroTone === 'function') playRetroTone('boom');
  const existing = document.getElementById('win95-bsod');
  if (existing) existing.remove();

  const bsod = document.createElement('div');
  bsod.id = 'win95-bsod';
  bsod.style.cssText = 'position:fixed;inset:0;background:#0000aa;color:#ffffff;font-family:monospace;z-index:20000;display:flex;align-items:center;justify-content:center;padding:24px;cursor:pointer;';
  bsod.innerHTML = `
    <div style="max-width:620px;line-height:1.7;">
      <div style="background:#c0c0c0;color:#0000aa;display:inline-block;padding:2px 10px;font-weight:900;margin-bottom:18px;">MY-ARCHIVE 95 OS</div>
      <p style="margin-bottom:14px;">치명적인 취향 과부하 예외 0E가 0028:C0011E36에서 발생했습니다. 현재 실행 중인 감상 기록은 중앙 Google Sheets 및 LocalStorage에 안전하게 보호되고 있습니다.</p>
      <p style="margin-bottom:14px;">* 화면의 아무 곳이나 클릭하거나 키보드의 아무 키나 누르면 데스크톱으로 복귀합니다.</p>
      <p style="text-align:center;margin-top:24px;">Press any key to continue _</p>
    </div>
  `;
  const closeBsod = () => {
    bsod.remove();
    document.removeEventListener('keydown', closeBsod);
  };
  bsod.addEventListener('click', closeBsod);
  document.addEventListener('keydown', closeBsod);
  document.body.appendChild(bsod);
}

function injectTopMenubarQuickControls() {
  const menubar = document.querySelector('.top-menubar');
  if (!menubar || document.getElementById('os95-menubar-quick')) return;
  const bar = document.createElement('div');
  bar.id = 'os95-menubar-quick';
  bar.style.cssText = 'margin-left:auto; display:flex; align-items:center; gap:5px; padding-right:8px;';
  bar.innerHTML = `
    <button type="button" class="btn95 sm" id="btn-top-spotlight" style="padding:1px 7px; font-size:0.72rem; font-weight:900;" title="통합 검색 및 명령 (Ctrl+K)">[Ctrl+K] 검색</button>
    <select id="sel-top-workspace" class="win95-select" style="padding:1px 4px; font-size:0.72rem; height:22px;" title="작업 공간 프리셋 전환">
      <option value="">작업 공간 프리셋...</option>
      <option value="ws-listen">감상 모드 (주크박스+시각화)</option>
      <option value="ws-explore">탐색 모드 (아카이브+탐색기)</option>
      <option value="ws-plaza">광장 모드 (커뮤니티+주크박스)</option>
      <option value="ws-tile">창 바둑판 정렬</option>
      <option value="ws-save">+ 현재 창 배치 저장</option>
      <option value="ws-custom-latest">저장된 배치 복원</option>
    </select>
  `;
  menubar.appendChild(bar);

  document.getElementById('btn-top-spotlight')?.addEventListener('click', openSpotlightPalette);
  document.getElementById('sel-top-workspace')?.addEventListener('change', e => {
    const val = e.target.value;
    e.target.value = '';
    if (!val) return;
    if (val === 'ws-tile') tileOpenWindows();
    else if (val === 'ws-save') saveCurrentWorkspaceSnapshot();
    else applyWorkspacePreset(val);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  injectOsEnhancementStyles();
  applyDesktopPreferences();
  document.querySelectorAll('.floating-win').forEach(enableWindowDrag);
  positionInitialWindows();
  injectTopMenubarQuickControls();
  syncTaskbar();
  updateTaskbarClock();
  setInterval(updateTaskbarClock, 15000);

  window.addEventListener('resize', positionInitialWindows);

  // Ctrl+K / Cmd+K 전역 단축키
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const bd = document.getElementById('os95-spotlight-backdrop');
      if (bd && bd.classList.contains('open')) closeSpotlightPalette();
      else openSpotlightPalette();
    }
  });

  // 바탕화면 테마 전환
  document.querySelectorAll('[data-theme-opt]').forEach(btn => {
    btn.addEventListener('click', () => {
      applyTheme(btn.dataset.themeOpt, true);
      if (typeof playRetroTone === 'function') playRetroTone('click');
    });
  });

  // CRT 스캔라인 토글
  document.getElementById('mnu-toggle-crt')?.addEventListener('click', () => {
    const prefs = loadLocalCache(STORAGE_KEYS.PREFS, { theme: 'teal', crt: false, soundEnabled: true });
    prefs.crt = !prefs.crt;
    saveLocalCache(STORAGE_KEYS.PREFS, prefs);
    applyCrtOverlayState(prefs.crt);
    if (typeof playRetroTone === 'function') playRetroTone('click');
  });

  document.getElementById('chk-crt')?.addEventListener('change', e => {
    const prefs = loadLocalCache(STORAGE_KEYS.PREFS, { theme: 'teal', crt: false, soundEnabled: true });
    prefs.crt = Boolean(e.target.checked);
    saveLocalCache(STORAGE_KEYS.PREFS, prefs);
    applyCrtOverlayState(prefs.crt);
    if (typeof playRetroTone === 'function') playRetroTone('click');
  });

  // 8비트 효과음 음소거 토글
  document.getElementById('mnu-toggle-sound')?.addEventListener('click', () => {
    const prefs = loadLocalCache(STORAGE_KEYS.PREFS, { theme: 'teal', crt: false, soundEnabled: true });
    prefs.soundEnabled = prefs.soundEnabled === false ? true : false;
    saveLocalCache(STORAGE_KEYS.PREFS, prefs);
    if (prefs.soundEnabled && typeof playRetroTone === 'function') playRetroTone('open');
    if (typeof showWin95MessageBox === 'function') {
      showWin95MessageBox('오디오 설정 — MY-ARCHIVE 95', prefs.soundEnabled ? '8비트 레트로 효과음이 활성화되었습니다.' : '8비트 레트로 효과음이 음소거되었습니다.', 'click');
    }
  });

  document.getElementById('mnu-trigger-bsod')?.addEventListener('click', triggerBsodEasterEgg);

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

// ============================================================
// 7. Windows 95 작업 관리자 (Ctrl+Alt+Delete) & 화면 보호기
// ============================================================
function openTaskManager() {
  openWindow('win-taskmgr');
  renderTaskManagerList();
}

function renderTaskManagerList() {
  const listBox = document.getElementById('taskmgr-list');
  if (!listBox) return;
  const openWins = Array.from(document.querySelectorAll('.floating-win.open'));
  if (openWins.length === 0) {
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
          <button type="button" class="btn95 sm" data-tm-focus="${esc(w.id)}" style="padding:2px 7px;font-size:0.72rem;">전환</button>
          <button type="button" class="btn95 pink sm" data-tm-kill="${esc(w.id)}" style="padding:2px 7px;font-size:0.72rem;">작업 끝내기</button>
        </div>
      </div>
    `;
  }).join('');

  listBox.querySelectorAll('[data-tm-focus]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.tmFocus);
      if (target) focusWindow(target);
    });
  });

  listBox.querySelectorAll('[data-tm-kill]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeWindow(btn.dataset.tmKill);
      renderTaskManagerList();
    });
  });
}

let screensaverAnimId = null;

function startWin95Screensaver() {
  const scr = document.getElementById('win95-screensaver');
  const canvas = document.getElementById('screensaver-canvas');
  if (!scr || !canvas) return;

  scr.style.display = 'block';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');

  const colors = ['#ff4b4b', '#4be36a', '#4ba3ff', '#ffd83b', '#ff9f43', '#a29bfe'];
  const sprites = Array.from({ length: 14 }, (_, i) => ({
    x: Math.random() * (canvas.width - 96),
    y: Math.random() * (canvas.height - 50),
    vx: (Math.random() < 0.5 ? -1 : 1) * (1.8 + Math.random() * 2.2),
    vy: (Math.random() < 0.5 ? -1 : 1) * (1.5 + Math.random() * 2.0),
    color: colors[i % colors.length],
    label: i % 2 === 0 ? 'ARCHIVE 95' : 'WIN95 OS'
  }));

  const stopScreensaver = () => {
    if (screensaverAnimId) {
      cancelAnimationFrame(screensaverAnimId);
      screensaverAnimId = null;
    }
    scr.style.display = 'none';
    document.removeEventListener('keydown', stopScreensaver);
  };

  scr.onclick = stopScreensaver;
  document.addEventListener('keydown', stopScreensaver);

  const loop = () => {
    if (scr.style.display === 'none') return;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    sprites.forEach(s => {
      s.x += s.vx;
      s.y += s.vy;
      if (s.x <= 0 || s.x + 96 >= canvas.width) s.vx *= -1;
      if (s.y <= 0 || s.y + 34 >= canvas.height) s.vy *= -1;

      ctx.fillStyle = s.color;
      ctx.fillRect(s.x, s.y, 96, 34);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(s.x, s.y, 96, 34);
      ctx.fillStyle = '#111111';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(s.label, s.x + 48, s.y + 21);
    });

    screensaverAnimId = requestAnimationFrame(loop);
  };
  screensaverAnimId = requestAnimationFrame(loop);
}

document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.altKey && (e.key === 'Delete' || e.key === 'Backspace')) {
    e.preventDefault();
    openTaskManager();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('mnu-open-taskmgr')?.addEventListener('click', openTaskManager);
  document.getElementById('mnu-start-screensaver')?.addEventListener('click', startWin95Screensaver);
  document.getElementById('btn-tm-refresh')?.addEventListener('click', renderTaskManagerList);
  document.getElementById('btn-tm-reboot')?.addEventListener('click', () => {
    closeWindow('win-taskmgr');
    if (typeof startBiosBootSequence === 'function') startBiosBootSequence();
  });
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
window.triggerBsodEasterEgg = triggerBsodEasterEgg;
window.openTaskManager = openTaskManager;
window.startWin95Screensaver = startWin95Screensaver;

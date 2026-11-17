// ============================================================
// MY-ARCHIVE 95 OS — Pure Window Manager & Desktop Shell UI
// ============================================================

window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
window.__MOD_VERSIONS.windowMgr = typeof APP_BUILD_VERSION !== 'undefined' ? APP_BUILD_VERSION : 'v2026.11.17-05';

// ============================================================
// 1. 멀티 윈도우 제어 (포커스, 열기/닫기, 최소화, 작업표시줄 동기화)
// ============================================================
function focusWindow(winEl) {
  if (!winEl) return;
  document.querySelectorAll('.floating-win').forEach(w => w.classList.remove('focused'));
  winEl.classList.remove('minimized');
  winEl.classList.add('focused');
  winEl.style.zIndex = String(++topZIndex);
  syncTaskbar();
}

function openWindow(winId) {
  const winEl = document.getElementById(winId);
  if (!winEl) return;
  const wasClosed = !winEl.classList.contains('open');
  winEl.classList.add('open');
  winEl.classList.remove('minimized');
  focusWindow(winEl);
  if (wasClosed && winId !== 'win-sys-msgbox') {
    playRetroTone('open');
  }
  window.dispatchEvent(new CustomEvent('window:opened', { detail: { id: winId } }));
}

function closeWindow(winId) {
  const winEl = document.getElementById(winId);
  if (!winEl) return;
  playRetroTone('close');
  if (winEl.dataset.dynamic === 'true') {
    winEl.remove();
  } else {
    winEl.classList.remove('open', 'focused', 'minimized');
  }
  syncTaskbar();
}

function minimizeWindow(winId) {
  const winEl = document.getElementById(winId);
  if (!winEl) return;
  playRetroTone('click');
  winEl.classList.add('minimized');
  winEl.classList.remove('focused');
  syncTaskbar();
}

function syncTaskbar() {
  const container = document.getElementById('taskbar-windows');
  if (!container) return;
  container.innerHTML = '';

  document.querySelectorAll('.floating-win.open').forEach(winEl => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'taskbar-tab' + (winEl.classList.contains('focused') && !winEl.classList.contains('minimized') ? ' active' : '');
    tab.textContent = winEl.dataset.winTitle || winEl.id;
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
// 2. 창 타이틀바 드래그 이동 (마우스 및 터치 지원)
// ============================================================
function enableWindowDrag(winEl) {
  if (!winEl || winEl.dataset.dragBound === 'true') return;
  winEl.dataset.dragBound = 'true';

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
    if (window.innerWidth <= 768) return; // 모바일 1열 반응형 모드에서는 위치 고정
    isDragging = true;
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

// 창 컨트롤 버튼([_], [X]) 전역 위임
document.addEventListener('click', e => {
  const ctrlBtn = e.target.closest('[data-action][data-target]');
  if (!ctrlBtn) return;
  e.preventDefault();
  e.stopPropagation();
  const action = ctrlBtn.dataset.action;
  const targetId = ctrlBtn.dataset.target;
  if (action === 'minimize') minimizeWindow(targetId);
  if (action === 'close') closeWindow(targetId);
});

// ============================================================
// 3. 바탕화면 테마, CRT 효과, 시스템 시계, BSOD 및 창 런처 바인딩
// ============================================================
function applyDesktopPreferences() {
  const prefs = loadLocalCache(STORAGE_KEYS.PREFS, {
    theme: 'teal',
    crt: false,
    soundEnabled: true
  });

  document.body.classList.remove('theme-teal', 'theme-grid', 'theme-brick');
  document.body.classList.add(`theme-${prefs.theme || 'teal'}`);

  const crtEl = document.getElementById('crt-overlay');
  if (crtEl) crtEl.style.display = prefs.crt ? 'block' : 'none';
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
  playRetroTone('boom');
  const existing = document.getElementById('win95-bsod');
  if (existing) existing.remove();

  const bsod = document.createElement('div');
  bsod.id = 'win95-bsod';
  bsod.style.cssText = 'position:fixed;inset:0;background:#0000aa;color:#ffffff;font-family:monospace;z-index:20000;display:flex;align-items:center;justify-content:center;padding:24px;cursor:pointer;';
  bsod.innerHTML = `
    <div style="max-width:620px;line-height:1.7;">
      <div style="background:#c0c0c0;color:#0000aa;display:inline-block;padding:2px 10px;font-weight:900;margin-bottom:18px;">MY-ARCHIVE 95 OS</div>
      <p style="margin-bottom:14px;">치명적인 취향 과부하 예외 0E가 0028:C0011E36에서 발생했습니다. 현재 실행 중인 감상 기록은 Google Sheets 및 LocalStorage에 안전하게 보호되고 있습니다.</p>
      <p style="margin-bottom:14px;">* 아무 곳이나 클릭하거나 키를 누르면 데스크톱으로 복귀합니다.</p>
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

document.addEventListener('DOMContentLoaded', () => {
  applyDesktopPreferences();
  document.querySelectorAll('.floating-win').forEach(enableWindowDrag);
  syncTaskbar();
  updateTaskbarClock();
  setInterval(updateTaskbarClock, 15000);

  // 바탕화면 테마 전환
  document.querySelectorAll('[data-theme-opt]').forEach(btn => {
    btn.addEventListener('click', () => {
      const prefs = loadLocalCache(STORAGE_KEYS.PREFS, { theme: 'teal', crt: false, soundEnabled: true });
      prefs.theme = btn.dataset.themeOpt;
      saveLocalCache(STORAGE_KEYS.PREFS, prefs);
      applyDesktopPreferences();
      playRetroTone('click');
    });
  });

  // CRT 스캔라인 토글
  document.getElementById('mnu-toggle-crt')?.addEventListener('click', () => {
    const prefs = loadLocalCache(STORAGE_KEYS.PREFS, { theme: 'teal', crt: false, soundEnabled: true });
    prefs.crt = !prefs.crt;
    saveLocalCache(STORAGE_KEYS.PREFS, prefs);
    applyDesktopPreferences();
    playRetroTone('click');
  });

  // 8비트 효과음 음소거 토글
  document.getElementById('mnu-toggle-sound')?.addEventListener('click', () => {
    const prefs = loadLocalCache(STORAGE_KEYS.PREFS, { theme: 'teal', crt: false, soundEnabled: true });
    prefs.soundEnabled = prefs.soundEnabled === false ? true : false;
    saveLocalCache(STORAGE_KEYS.PREFS, prefs);
    if (prefs.soundEnabled) playRetroTone('open');
    if (typeof showWin95MessageBox === 'function') {
      showWin95MessageBox('오디오 설정 — MY-ARCHIVE 95', prefs.soundEnabled ? '8비트 레트로 효과음이 활성화되었습니다.' : '8비트 레트로 효과음이 음소거되었습니다.', 'click');
    }
  });

  // BSOD 테스트
  document.getElementById('mnu-trigger-bsod')?.addEventListener('click', triggerBsodEasterEgg);

  // 각 프로그램 창 열기 런처 바인딩 (바탕화면 아이콘, 상단 메뉴, 시작 메뉴)
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

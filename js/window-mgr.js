// ============================================================
// MY-ARCHIVE 95 OS — Pure Window Manager & Desktop Shell UI
// (Multi-Window Focus/Drag, 6-Theme Engine, CRT, Widgets, Task Manager & About/License)
// ============================================================

window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
window.__MOD_VERSIONS.windowMgr = typeof APP_BUILD_VERSION !== 'undefined' ? APP_BUILD_VERSION : 'v2026.11.25-09';

const ALL_DESKTOP_THEMES = [
  'theme-teal',
  'theme-navy',
  'theme-olive',
  'theme-plum',
  'theme-brick',
  'theme-matrix',
  'theme-grid'
];

// 구버전 HTML data-win-title에 이모지가 남아 있어도 작업표시줄에는 95년 규격 텍스트만 표시
function sanitizeRetroWindowTitle(rawTitle) {
  return String(rawTitle || '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F]/gu, '')
    .replace(/^\[\s*\]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================
// 1. 멀티 윈도우 제어 (포커스, 열기/닫기, 최소화, 작업표시줄 동기화)
// ============================================================
function focusWindow(winEl) {
  if (!winEl) return;
  document.querySelectorAll('.floating-win').forEach(w => w.classList.remove('focused'));
  winEl.classList.remove('minimized');
  winEl.classList.add('focused');
  if (typeof topZIndex !== 'undefined') {
    winEl.style.zIndex = String(++topZIndex);
  } else {
    window.__fallbackTopZ = (window.__fallbackTopZ || 240) + 1;
    winEl.style.zIndex = String(window.__fallbackTopZ);
  }
  syncTaskbar();
}

function openWindow(winId) {
  const winEl = document.getElementById(winId);
  if (!winEl) return;
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
    winEl.classList.remove('open', 'focused', 'minimized', 'win-maximized');
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
    if (winEl.classList.contains('win-maximized')) return;
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
// 2-1. 제작자 소개 및 라이선스 정보 팝업 창 (About & License 95)
// ============================================================
function openAboutAndLicenseWindow(initialTab = 'creator') {
  const winId = 'win-about-license';
  let winEl = document.getElementById(winId);

  if (!winEl) {
    winEl = document.createElement('div');
    winEl.id = winId;
    winEl.className = 'floating-win';
    winEl.dataset.winTitle = '제작자 및 라이선스 정보 — MY-ARCHIVE 95';
    winEl.dataset.dynamic = 'true';

    const initLeft = Math.max(24, Math.round((window.innerWidth - 460) / 2));
    const initTop = Math.max(46, Math.round((window.innerHeight - 430) / 2));
    winEl.style.cssText = `width:min(460px, calc(100vw - 24px)); left:${initLeft}px; top:${initTop}px;`;

    const buildVer = window.__MOD_VERSIONS?.windowMgr || 'v2026.11.25';

    winEl.innerHTML = `
      <div class="win-titlebar draggable">
        <div class="win-title-left" style="display:flex;align-items:center;gap:6px;">
          <svg width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">
            <rect x="2" y="1" width="12" height="14" fill="#ffffff" stroke="#111111" stroke-width="1.5"/>
            <rect x="4" y="3" width="8" height="3" fill="#000080"/>
            <rect x="4" y="8" width="8" height="1.5" fill="#111111"/>
            <rect x="4" y="11" width="5" height="1.5" fill="#111111"/>
          </svg>
          <span>제작자 및 라이선스 정보 — MY-ARCHIVE 95</span>
        </div>
        <div class="win-ctrl-btns">
          <button type="button" class="win-ctrl-btn" data-action="minimize" data-target="${winId}" title="최소화">_</button>
          <button type="button" class="win-ctrl-btn" data-action="close" data-target="${winId}" title="닫기">X</button>
        </div>
      </div>
      <div class="win-body" style="padding:12px;">
        <div style="display:flex;align-items:center;gap:12px;background:#19191f;color:#ffffff;border:2px solid #111111;padding:10px 12px;margin-bottom:10px;">
          <div style="width:46px;height:46px;background:#ffd83b;border:2px solid #ffffff;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="30" height="30" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">
              <rect x="2" y="2" width="12" height="12" fill="#008080" stroke="#111111" stroke-width="1.5"/>
              <rect x="4" y="4" width="8" height="5" fill="#ffffff"/>
              <rect x="5" y="10" width="6" height="2" fill="#ffd83b"/>
            </svg>
          </div>
          <div style="min-width:0;">
            <div style="font-family:var(--font-mono, Consolas, monospace);font-size:0.92rem;font-weight:900;color:#ffd83b;">
              MY-ARCHIVE 95 OS
            </div>
            <div style="font-size:0.76rem;color:#48dbfb;font-weight:700;margin-top:2px;">
              Retro Desktop Personal Archive &amp; Web Utility Shell (${buildVer})
            </div>
          </div>
        </div>

        <div style="display:flex;gap:4px;margin-bottom:8px;">
          <button type="button" class="btn95 sm yellow" data-about-tab="creator" style="flex:1;">제작자 설명</button>
          <button type="button" class="btn95 sm" data-about-tab="license" style="flex:1;">라이선스 · 고지</button>
        </div>

        <div id="about-pane-creator" class="sunken-box" style="padding:10px;background:#ffffff;color:#111111;font-size:0.8rem;line-height:1.55;">
          <div style="font-weight:900;font-size:0.86rem;color:#000080;margin-bottom:6px;border-bottom:1px solid #c0c0c0;padding-bottom:4px;">
            CREATOR PROFILE — 제작자 안내
          </div>
          <p style="margin:0 0 8px 0;">
            <b>MY-ARCHIVE 95 OS</b>는 1995년 클래식 데스크톱 인터페이스의 감성을 바탕으로, 음악·독서·영상·일상 기록과 웹 유틸리티를 한 공간에 수집하기 위해 제작된 개인 웹 아카이브 프로젝트입니다.
          </p>
          <ul style="margin:0 0 10px 0;padding-left:18px;">
            <li><b>기획 · 디자인 · 개발:</b> nlasdnfkl2 (nn80300)</li>
            <li><b>주요 구성:</b> 주크박스 95, 무드 뮤직 로컬 AI, 탐색기 95, 플로팅 위젯 &amp; 타임라인 보관함</li>
            <li><b>문의 및 업데이트 기록:</b> 아래 공식 블로그 및 GitHub 저장소에서 확인할 수 있습니다.</li>
          </ul>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
            <a href="https://blog.naver.com/nn80300" target="_blank" rel="noopener noreferrer" class="btn95 yellow sm" style="text-decoration:none;text-align:center;display:inline-flex;align-items:center;justify-content:center;gap:4px;">
              <span>Naver Blog (nn80300)</span>
            </a>
            <a href="https://github.com/nlasdnfkl2" target="_blank" rel="noopener noreferrer" class="btn95 sky sm" style="text-decoration:none;text-align:center;display:inline-flex;align-items:center;justify-content:center;gap:4px;">
              <span>GitHub (nlasdnfkl2)</span>
            </a>
          </div>
        </div>

        <div id="about-pane-license" class="sunken-box" style="display:none;padding:10px;background:#ffffff;color:#111111;font-size:0.76rem;line-height:1.5;max-height:215px;overflow-y:auto;font-family:var(--font-mono, Consolas, monospace);">
          <div style="font-weight:900;color:#000080;margin-bottom:6px;">
            MIT License — Copyright (c) 2026 nlasdnfkl2 (nn80300)
          </div>
          <p style="margin:0 0 8px 0;">
            Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, subject to the following conditions:
          </p>
          <p style="margin:0 0 8px 0;">
            The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
          </p>
          <p style="margin:0 0 8px 0;color:#444444;">
            THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.
          </p>
          <div style="border-top:1px dashed #808080;padding-top:6px;margin-top:6px;color:#222222;">
            <b>[외부 연동 및 저작권 고지]</b><br/>
            • 주크박스 및 위젯 내 스트리밍 영상·음원의 저작권은 각 원저작자 및 YouTube 게시자에게 있습니다.<br/>
            • 본 프로젝트의 UI 스타일은 1995년 클래식 OS 데스크톱 메타포를 오마주한 창작 디자인입니다.
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;gap:8px;">
          <span style="font-family:var(--font-mono, Consolas, monospace);font-size:0.7rem;color:#333333;">
            All Rights Reserved · 1995–2026
          </span>
          <button type="button" class="btn95 green sm" id="btn-about-ok" style="min-width:74px;">확인</button>
        </div>
      </div>
    `;

    (document.getElementById('dynamic-windows-container') || document.body).appendChild(winEl);
    enableWindowDrag(winEl);

    winEl.querySelectorAll('[data-about-tab]').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        if (typeof playRetroTone === 'function') playRetroTone('click');
        const mode = tabBtn.dataset.aboutTab;
        winEl.querySelectorAll('[data-about-tab]').forEach(b => b.classList.toggle('yellow', b.dataset.aboutTab === mode));
        const creatorPane = winEl.querySelector('#about-pane-creator');
        const licensePane = winEl.querySelector('#about-pane-license');
        if (creatorPane) creatorPane.style.display = mode === 'creator' ? 'block' : 'none';
        if (licensePane) licensePane.style.display = mode === 'license' ? 'block' : 'none';
      });
    });

    winEl.querySelector('#btn-about-ok')?.addEventListener('click', () => {
      closeWindow(winId);
    });
  }

  // 탭 초기 상태 전환
  const targetTabBtn = winEl.querySelector(`[data-about-tab="${initialTab}"]`);
  if (targetTabBtn) targetTabBtn.click();

  openWindow(winId);
}

// ============================================================
// 3. 바탕화면 위젯·정보 아이콘 자동 생성 & 상단 메뉴 항목 연결
// ============================================================
function injectDesktopWidgetIcons() {
  const sampleIcon =
    document.getElementById('icon-jukebox') ||
    document.getElementById('icon-main') ||
    document.getElementById('icon-calendar');
  const iconContainer = sampleIcon ? sampleIcon.parentElement : document.querySelector('.desktop-icons, .icon-grid');

  if (!iconContainer) return;

  const sampleTag = sampleIcon ? sampleIcon.tagName.toLowerCase() : 'button';
  const sampleClass = sampleIcon ? sampleIcon.className : 'desktop-icon';

  const widgetDefs = [
    {
      id: 'icon-cdplayer',
      label: 'CD Player',
      svg: `
        <svg width="32" height="32" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">
          <circle cx="16" cy="17" r="11" fill="#e4e4e4" stroke="#111111" stroke-width="2"/>
          <polygon points="16,17 9,10 14,7" fill="#48dbfb"/>
          <polygon points="16,17 23,24 18,27" fill="#ff9ff3"/>
          <circle cx="16" cy="17" r="4" fill="#ffffff" stroke="#111111" stroke-width="2"/>
          <path d="M21 4h6v10h-2V7h-2v8a2.5 2.5 0 1 1-2-2.4V4z" fill="#111111"/>
        </svg>`,
      onOpen: () => {
        if (window.Win95Widgets?.openCdPlayer) window.Win95Widgets.openCdPlayer();
        else openWindow('win-jukebox');
      }
    },
    {
      id: 'icon-mood-music',
      label: 'Mood Music AI',
      svg: `
        <svg width="32" height="32" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">
          <rect x="4" y="5" width="24" height="22" fill="#ffd83b" stroke="#111111" stroke-width="2"/>
          <circle cx="11" cy="13" r="2" fill="#111111"/>
          <circle cx="21" cy="13" r="2" fill="#111111"/>
          <path d="M10 19q6 5 12 0" fill="none" stroke="#111111" stroke-width="2"/>
          <path d="M23 3h6v8h-2V5h-2v6a2 2 0 1 1-2-2V3z" fill="#ff2e55"/>
        </svg>`,
      onOpen: () => {
        if (window.Win95Widgets?.openMoodMusic) window.Win95Widgets.openMoodMusic();
        else openWindow('win-mood');
      }
    },
    {
      id: 'icon-clock',
      label: 'Clock 95',
      svg: `
        <svg width="32" height="32" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">
          <rect x="4" y="4" width="24" height="24" fill="#ffd83b" stroke="#111111" stroke-width="2"/>
          <rect x="7" y="7" width="18" height="18" fill="#ffffff" stroke="#111111" stroke-width="1.5"/>
          <rect x="15" y="9" width="2" height="8" fill="#111111"/>
          <rect x="15" y="15" width="7" height="2" fill="#d63031"/>
        </svg>`,
      onOpen: () => {
        if (window.Win95Widgets?.openClock) window.Win95Widgets.openClock();
      }
    },
    {
      id: 'icon-about-license',
      label: '제작자 · 라이선스',
      svg: `
        <svg width="32" height="32" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">
          <rect x="5" y="3" width="22" height="26" fill="#ffffff" stroke="#111111" stroke-width="2"/>
          <rect x="5" y="3" width="22" height="6" fill="#000080"/>
          <rect x="9" y="13" width="14" height="2" fill="#111111"/>
          <rect x="9" y="17" width="14" height="2" fill="#111111"/>
          <rect x="9" y="21" width="9" height="2" fill="#008080"/>
          <rect x="20" y="20" width="4" height="5" fill="#ffd83b" stroke="#111111" stroke-width="1"/>
        </svg>`,
      onOpen: () => {
        openAboutAndLicenseWindow('creator');
      }
    }
  ];

  widgetDefs.forEach(def => {
    if (document.getElementById(def.id)) return;
    const el = document.createElement(sampleTag);
    if (sampleTag === 'button') el.type = 'button';
    el.id = def.id;
    el.className = sampleClass;
    el.innerHTML = `
      <span class="desktop-icon-art">${def.svg}</span>
      <span class="desktop-icon-label">${def.label}</span>
    `;
    el.addEventListener('click', () => {
      if (typeof playRetroTone === 'function') playRetroTone('open');
      def.onOpen();
    });
    iconContainer.appendChild(el);
  });
}

function injectAboutMenuItems() {
  // 1) 이미 HTML에 #mnu-open-about-license가 있다면 이벤트만 연결
  const existingMenuBtn = document.getElementById('mnu-open-about-license');
  if (existingMenuBtn && !existingMenuBtn.dataset.bound) {
    existingMenuBtn.dataset.bound = 'true';
    existingMenuBtn.addEventListener('click', () => openAboutAndLicenseWindow('creator'));
  }

  // 2) 상단 메뉴바의 드롭다운 목록 끝에 '제작자 및 라이선스 정보' 자동 삽입
  if (!document.getElementById('mnu-open-about-license')) {
    const dropdownLists = document.querySelectorAll(
      '.top-menubar .menu-dropdown, .menubar .menu-dropdown, .win-menubar .menu-dropdown, .menu-list, [role="menu"]'
    );
    const targetDropdown = dropdownLists.length ? dropdownLists[dropdownLists.length - 1] : null;

    if (targetDropdown) {
      const sampleItem = targetDropdown.querySelector('button, a, .menu-item, li');
      const sep = document.createElement('div');
      sep.style.cssText = 'height:1px;background:#808080;border-bottom:1px solid #ffffff;margin:4px 2px;';
      targetDropdown.appendChild(sep);

      const mnuBtn = document.createElement(sampleItem && sampleItem.tagName.toLowerCase() === 'a' ? 'a' : 'button');
      if (mnuBtn.tagName.toLowerCase() === 'button') mnuBtn.type = 'button';
      if (mnuBtn.tagName.toLowerCase() === 'a') mnuBtn.href = '#about-license';
      mnuBtn.id = 'mnu-open-about-license';
      if (sampleItem && sampleItem.className) mnuBtn.className = sampleItem.className;
      mnuBtn.textContent = '제작자 및 라이선스 정보...';
      mnuBtn.addEventListener('click', e => {
        e.preventDefault();
        openAboutAndLicenseWindow('creator');
      });
      targetDropdown.appendChild(mnuBtn);
    }
  }

  // 3) 시작 메뉴가 있을 경우 하단에도 연결
  const startMenuList = document.querySelector('#start-menu .start-menu-items, #start-menu-list, .start-menu-list');
  if (startMenuList && !document.getElementById('sm-about-license')) {
    const smBtn = document.createElement('button');
    smBtn.type = 'button';
    smBtn.id = 'sm-about-license';
    smBtn.className = 'start-menu-item';
    smBtn.textContent = '제작자 및 라이선스 정보';
    smBtn.addEventListener('click', () => {
      document.getElementById('start-menu')?.classList.add('hidden');
      openAboutAndLicenseWindow('creator');
    });
    startMenuList.appendChild(smBtn);
  }
}

// ============================================================
// 4. 바탕화면 테마, CRT 효과, 시스템 시계, BSOD 및 창 런처 바인딩
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

document.addEventListener('DOMContentLoaded', () => {
  applyDesktopPreferences();
  injectDesktopWidgetIcons();
  injectAboutMenuItems();
  document.querySelectorAll('.floating-win').forEach(enableWindowDrag);
  syncTaskbar();
  updateTaskbarClock();
  setInterval(updateTaskbarClock, 15000);

  // 바탕화면 테마 전환
  document.querySelectorAll('[data-theme-opt]').forEach(btn => {
    btn.addEventListener('click', () => {
      applyTheme(btn.dataset.themeOpt, true);
      if (typeof playRetroTone === 'function') playRetroTone('click');
    });
  });

  // CRT 스캔라인 토글 (메뉴 버튼 및 체크박스 겸용)
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

  // 위젯 런처 바인딩 (CD Player, Mood Music AI, Clock 95, Calendar 95 + 작업표시줄 시계 클릭 연동)
  ['mnu-open-cdplayer', 'sm-cdplayer'].forEach(sel => {
    document.getElementById(sel)?.addEventListener('click', () => {
      window.Win95Widgets?.openCdPlayer?.();
    });
  });

  ['mnu-open-mood-music', 'sm-mood-music'].forEach(sel => {
    document.getElementById(sel)?.addEventListener('click', () => {
      window.Win95Widgets?.openMoodMusic?.();
    });
  });

  ['mnu-open-clock', 'sm-clock', 'taskbar-clock'].forEach(sel => {
    const el = document.getElementById(sel);
    if (!el) return;
    if (sel === 'taskbar-clock') {
      el.style.cursor = 'pointer';
      el.title = '클릭하여 Clock 95 위젯 열기';
    }
    el.addEventListener('click', () => {
      window.Win95Widgets?.openClock?.();
    });
  });

  ['mnu-open-calendar-widget', 'sm-calendar-widget'].forEach(sel => {
    document.getElementById(sel)?.addEventListener('click', () => {
      window.Win95Widgets?.openCalendar?.();
    });
  });
});

// ============================================================
// 5. Windows 95 작업 관리자 (Ctrl+Alt+Delete) & 화면 보호기
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

// 전역 창 관리자 API 노출
window.focusWindow = focusWindow;
window.openWindow = openWindow;
window.closeWindow = closeWindow;
window.minimizeWindow = minimizeWindow;
window.syncTaskbar = syncTaskbar;
window.enableWindowDrag = enableWindowDrag;
window.applyTheme = applyTheme;
window.triggerBsodEasterEgg = triggerBsodEasterEgg;
window.openTaskManager = openTaskManager;
window.startWin95Screensaver = startWin95Screensaver;
window.openAboutAndLicenseWindow = openAboutAndLicenseWindow;

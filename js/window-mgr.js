// ============================================================
// MY-ARCHIVE 95 OS — Window Manager, YT Jukebox & GamePack 95
// ============================================================

window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
window.__MOD_VERSIONS.windowMgr = typeof APP_BUILD_VERSION !== 'undefined' ? APP_BUILD_VERSION : 'v2026.11.17-04';

// ============================================================
// 1. 멀티 윈도우 제어 (포커스, 열기/닫기, 최소화, 작업표시줄)
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

// 창 타이틀바 드래그 이동 (마우스 및 터치 지원)
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
// 2. OS 테마, CRT 효과, 시계, BSOD 이스터에그 및 런처 바인딩
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

  // 테마 변경 메뉴
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

  // 확장 프로그램 창 런처 연결 (아이콘, 상단 메뉴, 시작 메뉴)
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

  initGamePack95();
});

// ============================================================
// 3. 계정 없는 YouTube 백그라운드 주크박스 (JUKEBOX95.EXE)
// ============================================================
let ytPlayer = null;
let ytApiReady = false;
let jukeboxTracks = [];
let currentTrackIdx = 0;
let isJukeboxPlaying = false;

function extractYouTubeVideoId(url) {
  const s = String(url || '').trim();
  if (!s) return '';
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|music\.youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m && m[1]) return m[1];
  }
  return '';
}

function ensureYouTubeIframeApi() {
  if (window.YT && window.YT.Player) {
    ytApiReady = true;
    return;
  }
  if (document.getElementById('yt-iframe-api-script')) return;
  const tag = document.createElement('script');
  tag.id = 'yt-iframe-api-script';
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
}

window.onYouTubeIframeAPIReady = function () {
  ytApiReady = true;
  if (jukeboxTracks.length > 0) {
    renderJukeboxUI();
  }
};

function updateJukebox() {
  const musicItems = (archiveItems || []).filter(i => i.category === '음악');
  jukeboxTracks = musicItems.map(item => ({
    id: item.id,
    title: item.title,
    creator: item.creator,
    coverUrl: item.coverUrl || FALLBACK_COVER,
    sourceUrl: item.sourceUrl || '',
    videoId: extractYouTubeVideoId(item.sourceUrl)
  }));

  if (currentTrackIdx >= jukeboxTracks.length) currentTrackIdx = 0;
  renderJukeboxUI();
}

async function resolveTrackVideoId(track) {
  if (!track) return '';
  if (track.videoId) return track.videoId;
  try {
    const q = encodeURIComponent(`${track.creator} ${track.title}`);
    const res = await fetch(`${GAS_WEB_APP_URL}?action=search&q=${q}&category=${encodeURIComponent('음악')}`);
    const json = await res.json();
    const cands = json.candidates || [];
    for (const c of cands) {
      const vid = extractYouTubeVideoId(c.sourceUrl);
      if (vid) {
        track.videoId = vid;
        return vid;
      }
    }
  } catch {
    // 폴백 조회 실패 무시
  }
  return '';
}

async function playJukeboxTrack(idx) {
  if (!jukeboxTracks.length) return;
  currentTrackIdx = (idx + jukeboxTracks.length) % jukeboxTracks.length;
  const track = jukeboxTracks[currentTrackIdx];
  renderJukeboxUI();

  ensureYouTubeIframeApi();
  const statusEl = document.getElementById('jb-status-text');
  if (statusEl) statusEl.textContent = `트랙 영상 매칭 중: 「${track.title}」...`;

  const vid = await resolveTrackVideoId(track);
  if (!vid) {
    if (statusEl) statusEl.textContent = `YouTube 영상 ID를 찾지 못했습니다: 「${track.title}」`;
    return;
  }

  if (!ytApiReady || !window.YT || !window.YT.Player) {
    if (statusEl) statusEl.textContent = 'YouTube 플레이어 엔진 로딩 중... 2초 후 다시 재생을 눌러주세요.';
    return;
  }

  if (!ytPlayer) {
    ytPlayer = new YT.Player('yt-hidden-player', {
      height: '180',
      width: '100%',
      videoId: vid,
      playerVars: { autoplay: 1, playsinline: 1 },
      events: {
        onReady: ev => {
          ev.target.playVideo();
          isJukeboxPlaying = true;
          renderJukeboxUI();
        },
        onStateChange: ev => {
          if (ev.data === YT.PlayerState.ENDED) {
            playJukeboxTrack(currentTrackIdx + 1);
          } else if (ev.data === YT.PlayerState.PLAYING) {
            isJukeboxPlaying = true;
            renderJukeboxUI();
          } else if (ev.data === YT.PlayerState.PAUSED) {
            isJukeboxPlaying = false;
            renderJukeboxUI();
          }
        }
      }
    });
  } else if (typeof ytPlayer.loadVideoById === 'function') {
    ytPlayer.loadVideoById(vid);
    isJukeboxPlaying = true;
    renderJukeboxUI();
  }
}

function renderJukeboxUI() {
  const body = document.getElementById('jukebox-body');
  if (!body) return;

  if (!jukeboxTracks.length) {
    body.innerHTML = `
      <div class="sunken-box" style="text-align:center;padding:24px;">
        <p style="font-weight:900;margin-bottom:8px;">아카이브에 등록된 '음악' 기록이 없습니다.</p>
        <p style="font-size:0.8rem;color:#555;">[+ 새 감상 기록하기]에서 음악 트랙을 등록하면 자동으로 주크박스 재생목록이 구성됩니다.</p>
      </div>
    `;
    return;
  }

  const cur = jukeboxTracks[currentTrackIdx] || jukeboxTracks[0];
  body.innerHTML = `
    <div class="sunken-box" style="background:#111;color:#2ed573;margin-bottom:10px;">
      <div style="display:flex;gap:12px;align-items:center;">
        <img src="${esc(cur.coverUrl)}" alt="" style="width:68px;height:68px;object-fit:cover;border:2px solid #2ed573;" onerror="this.src='${FALLBACK_COVER}'" />
        <div style="flex:1;min-width:0;">
          <div style="font-size:0.72rem;color:#ffd83b;font-family:var(--font-mono);">TRACK ${currentTrackIdx + 1} / ${jukeboxTracks.length}</div>
          <div style="font-size:1rem;font-weight:900;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(cur.title)}</div>
          <div style="font-size:0.8rem;color:#48dbfb;">${esc(cur.creator)}</div>
          <div id="jb-status-text" style="font-size:0.72rem;margin-top:4px;color:#2ed573;">${isJukeboxPlaying ? '▶ 백그라운드 재생 중...' : '■ 대기 중'}</div>
        </div>
      </div>
      <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;">
        <button type="button" class="btn95 sm" id="jb-prev">◀ 이전 곡</button>
        <button type="button" class="btn95 yellow sm" id="jb-play">▶ 재생</button>
        <button type="button" class="btn95 sm" id="jb-pause">❚❚ 일시정지</button>
        <button type="button" class="btn95 sm" id="jb-next">다음 곡 ▶</button>
      </div>
      <div style="margin-top:10px;border:1.5px solid #333;background:#000;">
        <div id="yt-hidden-player"></div>
      </div>
    </div>

    <div class="sunken-box" style="max-height:190px;overflow-y:auto;">
      <div class="box-head"><span>재생목록 (음악 아카이브 연동)</span><span class="tag-mini">${jukeboxTracks.length}곡</span></div>
      ${jukeboxTracks.map((t, idx) => `
        <div class="jb-track-row" data-idx="${idx}" style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;border-bottom:1px solid #ddd;cursor:pointer;background:${idx === currentTrackIdx ? '#fff6bf' : '#fff'};font-size:0.8rem;font-weight:800;">
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${idx === currentTrackIdx ? '▶ ' : `${idx + 1}. `}${esc(t.title)} — ${esc(t.creator)}</span>
          <span style="font-size:0.7rem;color:#000080;">${t.videoId ? 'YT연결됨' : '자동매칭'}</span>
        </div>
      `).join('')}
    </div>
  `;

  document.getElementById('jb-prev')?.addEventListener('click', () => playJukeboxTrack(currentTrackIdx - 1));
  document.getElementById('jb-next')?.addEventListener('click', () => playJukeboxTrack(currentTrackIdx + 1));
  document.getElementById('jb-play')?.addEventListener('click', () => {
    if (ytPlayer && typeof ytPlayer.playVideo === 'function' && cur.videoId) {
      ytPlayer.playVideo();
      isJukeboxPlaying = true;
      renderJukeboxUI();
    } else {
      playJukeboxTrack(currentTrackIdx);
    }
  });
  document.getElementById('jb-pause')?.addEventListener('click', () => {
    if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
      ytPlayer.pauseVideo();
      isJukeboxPlaying = false;
      renderJukeboxUI();
    }
  });
  body.querySelectorAll('.jb-track-row').forEach(row => {
    row.addEventListener('click', () => playJukeboxTrack(Number(row.dataset.idx)));
  });
}

// ============================================================
// 4. 내장 레트로 미니게임 팩 (GAMEPACK95.EXE)
// ============================================================
let activeGameTab = 'flip';

function initGamePack95() {
  window.addEventListener('window:opened', ev => {
    if (ev.detail && ev.detail.id === 'win-gamepack') {
      renderGamePackShell();
    }
  });
}

function renderGamePackShell() {
  const body = document.getElementById('gamepack-body');
  if (!body) return;

  body.innerHTML = `
    <div class="pill-group" style="margin-bottom:12px;">
      <button type="button" class="pill-btn ${activeGameTab === 'flip' ? 'active' : ''}" data-gtab="flip">아카이브 카드 짝맞추기</button>
      <button type="button" class="pill-btn ${activeGameTab === 'mine' ? 'active' : ''}" data-gtab="mine">지뢰찾기 95 (8×8)</button>
      <button type="button" class="pill-btn ${activeGameTab === 'hilo' ? 'active' : ''}" data-gtab="hilo">작품 별점 하이로우</button>
    </div>
    <div id="gamepack-stage" class="sunken-box"></div>
  `;

  body.querySelectorAll('[data-gtab]').forEach(btn => {
    btn.addEventListener('click', () => {
      playRetroTone('click');
      activeGameTab = btn.dataset.gtab;
      renderGamePackShell();
    });
  });

  if (activeGameTab === 'flip') renderMemoryFlipGame();
  else if (activeGameTab === 'mine') renderMinesweeperGame();
  else renderStarHiLoGame();
}

// 4-1. 아카이브 표지/제목 12장 카드 뒤집기 (10주차 실습 5 응용)
function renderMemoryFlipGame() {
  const stage = document.getElementById('gamepack-stage');
  if (!stage) return;

  const fallbackPairs = [
    { key: 'B1', label: '문학 도서' },
    { key: 'M1', label: '인디 음악' },
    { key: 'V1', label: 'SF 영화' },
    { key: 'G1', label: '에세이' },
    { key: 'G2', label: '클래식 OST' },
    { key: 'G3', label: '다큐멘터리' }
  ];

  const sourcePool = (archiveItems || []).slice(0, 6).map((item, i) => ({
    key: `ARC-${i}`,
    label: item.title.slice(0, 12)
  }));
  while (sourcePool.length < 6) {
    sourcePool.push(fallbackPairs[sourcePool.length]);
  }

  const deck = [...sourcePool, ...sourcePool]
    .map(c => ({ ...c, uid: Math.random() }))
    .sort((a, b) => a.uid - b.uid);

  let flippedIndices = [];
  let matchedKeys = new Set();
  let score = 0;
  let lockBoard = false;

  const draw = () => {
    stage.innerHTML = `
      <div class="box-head">
        <span>아카이브 12장 카드 뒤집기 (점수: ${score}점 / 완료: ${matchedKeys.size}/6쌍)</span>
        <button type="button" class="btn95 yellow sm" id="btn-flip-reset">다시 시작</button>
      </div>
      <div class="flip-card-grid">
        ${deck.map((card, idx) => {
          const isOpen = flippedIndices.includes(idx) || matchedKeys.has(card.key);
          const isDone = matchedKeys.has(card.key);
          return `<div class="flip-card ${isOpen ? 'flipped' : ''} ${isDone ? 'matched' : ''}" data-cidx="${idx}">
            ${isOpen ? esc(card.label) : 'ARCHIVE 95'}
          </div>`;
        }).join('')}
      </div>
    `;

    document.getElementById('btn-flip-reset')?.addEventListener('click', () => {
      playRetroTone('click');
      renderMemoryFlipGame();
    });

    stage.querySelectorAll('.flip-card').forEach(el => {
      el.addEventListener('click', () => {
        const idx = Number(el.dataset.cidx);
        if (lockBoard || flippedIndices.includes(idx) || matchedKeys.has(deck[idx].key)) return;
        playRetroTone('click');
        flippedIndices.push(idx);
        draw();

        if (flippedIndices.length === 2) {
          const [a, b] = flippedIndices;
          if (deck[a].key === deck[b].key) {
            matchedKeys.add(deck[a].key);
            score += 100;
            flippedIndices = [];
            playRetroTone(matchedKeys.size === 6 ? 'fanfare' : 'open');
            draw();
          } else {
            lockBoard = true;
            setTimeout(() => {
              flippedIndices = [];
              lockBoard = false;
              draw();
            }, 850);
          }
        }
      });
    });
  };

  draw();
}

// 4-2. 지뢰찾기 95 (8x8)
function renderMinesweeperGame() {
  const stage = document.getElementById('gamepack-stage');
  if (!stage) return;

  const SIZE = 8;
  const MINES = 10;
  let flagMode = false;
  let gameOver = false;
  let won = false;

  const board = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => ({ mine: false, open: false, flag: false, count: 0 }))
  );

  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * SIZE);
    const c = Math.floor(Math.random() * SIZE);
    if (!board[r][c].mine) {
      board[r][c].mine = true;
      placed++;
    }
  }

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c].mine) continue;
      let cnt = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc].mine) cnt++;
        }
      }
      board[r][c].count = cnt;
    }
  }

  const reveal = (r, c) => {
    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return;
    const cell = board[r][c];
    if (cell.open || cell.flag) return;
    cell.open = true;
    if (cell.count === 0 && !cell.mine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) reveal(r + dr, c + dc);
      }
    }
  };

  const checkWin = () => {
    let safeOpened = 0;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (!board[r][c].mine && board[r][c].open) safeOpened++;
      }
    }
    if (safeOpened === SIZE * SIZE - MINES) {
      won = true;
      gameOver = true;
      playRetroTone('fanfare');
    }
  };

  const draw = () => {
    stage.innerHTML = `
      <div class="box-head">
        <span>지뢰찾기 95 ${won ? '— 🎉 승리!' : gameOver ? '— 💥 지뢰 폭발!' : `(지뢰 ${MINES}개)`}</span>
        <div style="display:flex;gap:6px;">
          <button type="button" class="btn95 sm ${flagMode ? 'pink' : ''}" id="btn-mine-flag">🚩 깃발 모드: ${flagMode ? 'ON' : 'OFF'}</button>
          <button type="button" class="btn95 yellow sm" id="btn-mine-reset">새 게임</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(${SIZE},34px);gap:2px;justify-content:center;padding:8px;">
        ${board.map((row, r) => row.map((cell, c) => {
          let label = '';
          let bg = '#c0c0c0';
          if (cell.open) {
            bg = cell.mine ? '#ff4757' : '#ffffff';
            label = cell.mine ? '💣' : (cell.count || '');
          } else if (cell.flag) {
            label = '🚩';
          }
          return `<button type="button" class="mine-cell" data-r="${r}" data-c="${c}" style="width:34px;height:34px;border:2px solid #111;background:${bg};font-weight:900;cursor:pointer;">${label}</button>`;
        }).join('')).join('')}
      </div>
    `;

    document.getElementById('btn-mine-flag')?.addEventListener('click', () => {
      flagMode = !flagMode;
      playRetroTone('click');
      draw();
    });
    document.getElementById('btn-mine-reset')?.addEventListener('click', () => {
      playRetroTone('click');
      renderMinesweeperGame();
    });

    stage.querySelectorAll('.mine-cell').forEach(btn => {
      btn.addEventListener('click', () => {
        if (gameOver) return;
        const r = Number(btn.dataset.r), c = Number(btn.dataset.c);
        const cell = board[r][c];
        if (flagMode) {
          if (!cell.open) cell.flag = !cell.flag;
          playRetroTone('click');
          draw();
          return;
        }
        if (cell.flag || cell.open) return;
        if (cell.mine) {
          cell.open = true;
          gameOver = true;
          playRetroTone('boom');
        } else {
          reveal(r, c);
          playRetroTone('click');
          checkWin();
        }
        draw();
      });
    });
  };

  draw();
}

// 4-3. 내 아카이브 작품 별점 하이로우 (Hi-Lo)
function renderStarHiLoGame() {
  const stage = document.getElementById('gamepack-stage');
  if (!stage) return;

  if (!archiveItems || archiveItems.length < 2) {
    stage.innerHTML = `<div style="padding:20px;text-align:center;font-weight:800;">별점 하이로우 대결을 진행하려면 최소 2건 이상의 감상 기록이 필요합니다.</div>`;
    return;
  }

  let streak = 0;
  let feedback = '오른쪽 작품의 평점이 왼쪽 작품보다 높거나 같을지 맞춰보세요!';

  const pickPair = () => {
    const aIdx = Math.floor(Math.random() * archiveItems.length);
    let bIdx = Math.floor(Math.random() * archiveItems.length);
    while (bIdx === aIdx) bIdx = Math.floor(Math.random() * archiveItems.length);
    return [archiveItems[aIdx], archiveItems[bIdx]];
  };

  let [leftItem, rightItem] = pickPair();
  let revealed = false;

  const draw = () => {
    stage.innerHTML = `
      <div class="box-head">
        <span>작품 별점 하이로우 대결</span>
        <span class="tag-mini">연속 정답: ${streak}연승</span>
      </div>
      <p style="font-size:0.82rem;font-weight:800;margin-bottom:10px;">${esc(feedback)}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        <div class="sunken-box" style="text-align:center;background:#fff6bf;">
          <div style="font-size:0.75rem;font-weight:800;">[기준 작품]</div>
          <div style="font-size:0.95rem;font-weight:900;margin:4px 0;">${esc(leftItem.title)}</div>
          <div style="font-size:0.75rem;color:#555;margin-bottom:6px;">${esc(leftItem.creator)}</div>
          <div style="font-size:1.2rem;font-weight:900;color:#d63031;">★ ${leftItem.rating}점</div>
        </div>
        <div class="sunken-box" style="text-align:center;background:#e8f8ff;">
          <div style="font-size:0.75rem;font-weight:800;">[도전 작품]</div>
          <div style="font-size:0.95rem;font-weight:900;margin:4px 0;">${esc(rightItem.title)}</div>
          <div style="font-size:0.75rem;color:#555;margin-bottom:6px;">${esc(rightItem.creator)}</div>
          <div style="font-size:1.2rem;font-weight:900;color:#000080;">${revealed ? `★ ${rightItem.rating}점` : '★ ?점'}</div>
        </div>
      </div>
      <div style="display:flex;justify-content:center;gap:8px;">
        ${!revealed ? `
          <button type="button" class="btn95 green sm" id="btn-hilo-up">▲ 높거나 같다 (≥ ${leftItem.rating}점)</button>
          <button type="button" class="btn95 pink sm" id="btn-hilo-down">▼ 더 낮다 (&lt; ${leftItem.rating}점)</button>
        ` : `
          <button type="button" class="btn95 yellow sm" id="btn-hilo-next">다음 라운드 진행 &gt;&gt;</button>
        `}
      </div>
    `;

    document.getElementById('btn-hilo-up')?.addEventListener('click', () => {
      revealed = true;
      if (Number(rightItem.rating) >= Number(leftItem.rating)) {
        streak++;
        feedback = `정답입니다! 「${rightItem.title}」의 평점은 ${rightItem.rating}점입니다.`;
        playRetroTone('fanfare');
      } else {
        streak = 0;
        feedback = `아쉽습니다! 「${rightItem.title}」의 평점은 ${rightItem.rating}점으로 더 낮았습니다.`;
        playRetroTone('boom');
      }
      draw();
    });

    document.getElementById('btn-hilo-down')?.addEventListener('click', () => {
      revealed = true;
      if (Number(rightItem.rating) < Number(leftItem.rating)) {
        streak++;
        feedback = `정답입니다! 「${rightItem.title}」의 평점은 ${rightItem.rating}점입니다.`;
        playRetroTone('fanfare');
      } else {
        streak = 0;
        feedback = `아쉽습니다! 「${rightItem.title}」의 평점은 ${rightItem.rating}점으로 더 높거나 같았습니다.`;
        playRetroTone('boom');
      }
      draw();
    });

    document.getElementById('btn-hilo-next')?.addEventListener('click', () => {
      [leftItem, rightItem] = pickPair();
      revealed = false;
      feedback = '오른쪽 작품의 평점이 왼쪽 작품보다 높거나 같을지 맞춰보세요!';
      playRetroTone('click');
      draw();
    });
  };

  draw();
}

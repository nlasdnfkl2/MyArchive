// ============================================================
// MY-ARCHIVE 95 OS — Floating Win95 Widgets Controller
// (CD Player + Live Clock + Existing Jukebox Bridge)
// ============================================================

(function () {
  window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
  window.__MOD_VERSIONS.win95Widgets = 'v2026.11.25-01';

  const WIDGET_STATE_KEY = 'myarchive95_widgets_state_v1';
  const FALLBACK_ALBUM_ART =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
        <rect width="96" height="96" fill="#222222"/>
        <rect x="8" y="8" width="80" height="80" fill="#ffd83b" stroke="#111111" stroke-width="3"/>
        <circle cx="48" cy="48" r="22" fill="#111111"/>
        <circle cx="48" cy="48" r="7" fill="#48dbfb"/>
      </svg>`
    );

  const DEFAULT_TRACKS = [
    {
      id: 'trk-1',
      title: "Don't You (Forget About Me)",
      creator: 'Simple Minds',
      coverUrl: FALLBACK_ALBUM_ART,
      durationSec: 263,
      sourceUrl: ''
    },
    {
      id: 'trk-2',
      title: 'Midnight Tape #04',
      creator: 'Archive 95 Session',
      coverUrl: FALLBACK_ALBUM_ART,
      durationSec: 214,
      sourceUrl: ''
    },
    {
      id: 'trk-3',
      title: 'Gongju Rainy Afternoon',
      creator: 'Lo-Fi Study Log',
      coverUrl: FALLBACK_ALBUM_ART,
      durationSec: 188,
      sourceUrl: ''
    }
  ];

  const widgetStore = {
    widgets: new Map(),
    topZ: 320,
    clockTimer: null,
    cdTimer: null,
    cdState: {
      tracks: [...DEFAULT_TRACKS],
      index: 0,
      playing: false,
      elapsedSec: 91
    }
  };

  function safeEsc(str) {
    if (typeof window.esc === 'function') return window.esc(str);
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function beep(type = 'click') {
    if (typeof window.playRetroTone === 'function') {
      window.playRetroTone(type);
    }
  }

  function formatMMSS(totalSec) {
    const sec = Math.max(0, Math.floor(Number(totalSec) || 0));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function loadSavedWidgetPositions() {
    try {
      const raw = localStorage.getItem(WIDGET_STATE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveWidgetPosition(id, left, top, open) {
    try {
      const all = loadSavedWidgetPositions();
      all[id] = { left, top, open: Boolean(open) };
      localStorage.setItem(WIDGET_STATE_KEY, JSON.stringify(all));
    } catch {}
  }

  function ensureWidgetStyles() {
    if (document.getElementById('win95-widget-style')) return;
    const style = document.createElement('style');
    style.id = 'win95-widget-style';
    style.textContent = `
      .w95-widget {
        position: fixed;
        z-index: 320;
        background: #c0c0c0;
        border-top: 2px solid #ffffff;
        border-left: 2px solid #ffffff;
        border-right: 2px solid #111111;
        border-bottom: 2px solid #111111;
        box-shadow: 3px 3px 0px rgba(17, 17, 17, 0.85), inset 1px 1px 0px #dfdfdf, inset -1px -1px 0px #808080;
        font-family: 'Pretendard Variable', Pretendard, 'Consolas', sans-serif;
        color: #111111;
        user-select: none;
      }
      .w95-widget.hidden {
        display: none !important;
      }
      .w95-w-titlebar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        padding: 3px 5px;
        background: #808080;
        color: #ffffff;
        font-size: 0.78rem;
        font-weight: 900;
        cursor: grab;
      }
      .w95-widget.active .w95-w-titlebar {
        background: linear-gradient(90deg, #000080 0%, #1084d0 100%);
      }
      .w95-w-titlebar:active {
        cursor: grabbing;
      }
      .w95-w-title-left {
        display: flex;
        align-items: center;
        gap: 5px;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .w95-w-btns {
        display: flex;
        align-items: center;
        gap: 2px;
        flex-shrink: 0;
      }
      .w95-w-btn {
        width: 18px;
        height: 16px;
        padding: 0;
        background: #c0c0c0;
        color: #111111;
        border-top: 1.5px solid #ffffff;
        border-left: 1.5px solid #ffffff;
        border-right: 1.5px solid #111111;
        border-bottom: 1.5px solid #111111;
        font-family: 'Consolas', monospace;
        font-size: 0.7rem;
        font-weight: 900;
        line-height: 1;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .w95-w-btn:active {
        border-top: 1.5px solid #111111;
        border-left: 1.5px solid #111111;
        border-right: 1.5px solid #ffffff;
        border-bottom: 1.5px solid #ffffff;
      }
      .w95-w-body {
        padding: 10px;
      }
      .w95-cd-top {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
      }
      .w95-cd-art {
        width: 66px;
        height: 66px;
        object-fit: cover;
        flex-shrink: 0;
        border-top: 2px solid #808080;
        border-left: 2px solid #808080;
        border-right: 2px solid #ffffff;
        border-bottom: 2px solid #ffffff;
        background: #111111;
      }
      .w95-cd-meta {
        min-width: 0;
        flex: 1;
      }
      .w95-cd-artist {
        font-size: 0.86rem;
        font-weight: 800;
        color: #111111;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 2px;
      }
      .w95-cd-track {
        font-size: 0.84rem;
        font-weight: 700;
        color: #222222;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .w95-cd-time-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        font-family: 'Consolas', monospace;
        font-size: 0.74rem;
        font-weight: 800;
        margin-bottom: 8px;
      }
      .w95-cd-track-bar {
        position: relative;
        flex: 1;
        height: 12px;
        background: #c0c0c0;
        border-top: 2px solid #808080;
        border-left: 2px solid #808080;
        border-right: 2px solid #ffffff;
        border-bottom: 2px solid #ffffff;
        cursor: pointer;
      }
      .w95-cd-fill {
        height: 100%;
        width: 35%;
        background: #808080;
      }
      .w95-cd-thumb {
        position: absolute;
        top: -2px;
        width: 10px;
        height: 12px;
        background: #c0c0c0;
        border-top: 2px solid #ffffff;
        border-left: 2px solid #ffffff;
        border-right: 2px solid #111111;
        border-bottom: 2px solid #111111;
        transform: translateX(-50%);
      }
      .w95-cd-controls {
        display: grid;
        grid-template-columns: 1.4fr 1fr 1fr;
        gap: 6px;
      }
      .w95-cd-btn {
        height: 36px;
        background: #c0c0c0;
        color: #111111;
        border-top: 2px solid #ffffff;
        border-left: 2px solid #ffffff;
        border-right: 2px solid #111111;
        border-bottom: 2px solid #111111;
        box-shadow: inset -1px -1px 0 #808080;
        font-family: 'Consolas', monospace;
        font-size: 0.9rem;
        font-weight: 900;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .w95-cd-btn:active,
      .w95-cd-btn.pressed {
        border-top: 2px solid #111111;
        border-left: 2px solid #111111;
        border-right: 2px solid #ffffff;
        border-bottom: 2px solid #ffffff;
        box-shadow: inset 1px 1px 0 #808080;
        background: #b5b5b5;
      }
      .w95-clock-lcd {
        background: #111111;
        color: #ffd83b;
        border-top: 2px solid #808080;
        border-left: 2px solid #808080;
        border-right: 2px solid #ffffff;
        border-bottom: 2px solid #ffffff;
        padding: 8px 10px;
        font-family: 'Consolas', monospace;
        text-align: center;
      }
      .w95-clock-main {
        font-size: 1.25rem;
        font-weight: 900;
        letter-spacing: 0.04em;
      }
      .w95-clock-sub {
        font-size: 0.72rem;
        color: #48dbfb;
        margin-top: 2px;
      }
    `;
    document.head.appendChild(style);
  }

  function focusWidget(id) {
    widgetStore.topZ += 1;
    widgetStore.widgets.forEach((el, key) => {
      el.classList.toggle('active', key === id);
      if (key === id) el.style.zIndex = String(widgetStore.topZ);
    });
  }

  function makeDraggable(el, id) {
    const bar = el.querySelector('.w95-w-titlebar');
    if (!bar) return;

    bar.addEventListener('pointerdown', e => {
      if (e.target.closest('.w95-w-btn')) return;
      e.preventDefault();
      focusWidget(id);
      bar.setPointerCapture(e.pointerId);

      const startX = e.clientX;
      const startY = e.clientY;
      const rect = el.getBoundingClientRect();
      const origLeft = rect.left;
      const origTop = rect.top;

      const onMove = moveEvent => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        const maxLeft = Math.max(4, window.innerWidth - el.offsetWidth - 4);
        const maxTop = Math.max(32, window.innerHeight - el.offsetHeight - 42);
        const nextLeft = Math.min(maxLeft, Math.max(4, origLeft + dx));
        const nextTop = Math.min(maxTop, Math.max(32, origTop + dy));
        el.style.left = `${nextLeft}px`;
        el.style.top = `${nextTop}px`;
      };

      const onUp = () => {
        bar.releasePointerCapture?.(e.pointerId);
        bar.removeEventListener('pointermove', onMove);
        bar.removeEventListener('pointerup', onUp);
        const finalRect = el.getBoundingClientRect();
        saveWidgetPosition(id, Math.round(finalRect.left), Math.round(finalRect.top), !el.classList.contains('hidden'));
      };

      bar.addEventListener('pointermove', onMove);
      bar.addEventListener('pointerup', onUp);
    });
  }

  function createWidgetShell({ id, title, iconSvg, width, defaultLeft, defaultTop, bodyHtml }) {
    ensureWidgetStyles();
    if (widgetStore.widgets.has(id)) {
      const existing = widgetStore.widgets.get(id);
      existing.classList.remove('hidden');
      focusWidget(id);
      return existing;
    }

    const saved = loadSavedWidgetPositions()[id] || {};
    const left = typeof saved.left === 'number' ? saved.left : defaultLeft;
    const top = typeof saved.top === 'number' ? saved.top : defaultTop;

    const el = document.createElement('div');
    el.className = 'w95-widget';
    el.id = id;
    el.style.width = `${width}px`;
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;

    el.innerHTML = `
      <div class="w95-w-titlebar">
        <div class="w95-w-title-left">
          ${iconSvg || ''}
          <span>${safeEsc(title)}</span>
        </div>
        <div class="w95-w-btns">
          <button type="button" class="w95-w-btn" data-w-act="min" title="최소화">_</button>
          <button type="button" class="w95-w-btn" data-w-act="close" title="닫기">X</button>
        </div>
      </div>
      <div class="w95-w-body">${bodyHtml}</div>
    `;

    el.addEventListener('pointerdown', () => focusWidget(id));
    el.querySelector('[data-w-act="min"]')?.addEventListener('click', () => {
      beep('click');
      el.classList.add('hidden');
      saveWidgetPosition(id, el.offsetLeft, el.offsetTop, false);
    });
    el.querySelector('[data-w-act="close"]')?.addEventListener('click', () => {
      beep('close');
      el.classList.add('hidden');
      saveWidgetPosition(id, el.offsetLeft, el.offsetTop, false);
    });

    (document.getElementById('dynamic-windows-container') || document.body).appendChild(el);
    widgetStore.widgets.set(id, el);
    makeDraggable(el, id);
    focusWidget(id);
    return el;
  }

  // ------------------------------------------------------------
  // 1. CD Player 위젯 (이미지 스타일 + 아카이브 음악/주크박스 연동)
  // ------------------------------------------------------------
  function syncTracksFromArchive() {
    if (!Array.isArray(window.archiveItems) || !window.archiveItems.length) return;
    const musicItems = window.archiveItems
      .filter(it => it && it.category === '음악' && it.title)
      .slice(0, 12)
      .map((it, i) => ({
        id: it.id || `arc-trk-${i}`,
        title: String(it.title),
        creator: String(it.creator || 'Unknown Artist'),
        coverUrl: it.coverUrl || FALLBACK_ALBUM_ART,
        durationSec: 210 + (i % 5) * 24,
        sourceUrl: it.sourceUrl || ''
      }));

    if (musicItems.length) {
      widgetStore.cdState.tracks = musicItems;
      if (widgetStore.cdState.index >= musicItems.length) {
        widgetStore.cdState.index = 0;
      }
    }
  }

  function renderCdPlayerUI() {
    const win = widgetStore.widgets.get('widget-cd-player');
    if (!win) return;
    const { tracks, index, playing, elapsedSec } = widgetStore.cdState;
    const track = tracks[index] || DEFAULT_TRACKS[0];
    const ratio = track.durationSec > 0 ? Math.min(1, Math.max(0, elapsedSec / track.durationSec)) : 0;

    const artEl = win.querySelector('#w95-cd-art');
    const artistEl = win.querySelector('#w95-cd-artist');
    const titleEl = win.querySelector('#w95-cd-title');
    const curEl = win.querySelector('#w95-cd-cur');
    const durEl = win.querySelector('#w95-cd-dur');
    const fillEl = win.querySelector('#w95-cd-fill');
    const thumbEl = win.querySelector('#w95-cd-thumb');
    const playBtn = win.querySelector('#w95-cd-play');

    if (artEl) {
      artEl.src = track.coverUrl || FALLBACK_ALBUM_ART;
      artEl.onerror = () => {
        artEl.onerror = null;
        artEl.src = FALLBACK_ALBUM_ART;
      };
    }
    if (artistEl) artistEl.textContent = track.creator;
    if (titleEl) titleEl.textContent = track.title;
    if (curEl) curEl.textContent = formatMMSS(elapsedSec);
    if (durEl) durEl.textContent = formatMMSS(track.durationSec);
    if (fillEl) fillEl.style.width = `${(ratio * 100).toFixed(1)}%`;
    if (thumbEl) thumbEl.style.left = `${(ratio * 100).toFixed(1)}%`;
    if (playBtn) {
      playBtn.textContent = playing ? '❚❚' : '▶';
      playBtn.classList.toggle('pressed', playing);
    }
  }

  function startCdTick() {
    if (widgetStore.cdTimer) clearInterval(widgetStore.cdTimer);
    widgetStore.cdTimer = setInterval(() => {
      if (!widgetStore.cdState.playing) return;
      const curTrack = widgetStore.cdState.tracks[widgetStore.cdState.index] || DEFAULT_TRACKS[0];
      widgetStore.cdState.elapsedSec += 1;
      if (widgetStore.cdState.elapsedSec >= curTrack.durationSec) {
        widgetStore.cdState.index = (widgetStore.cdState.index + 1) % widgetStore.cdState.tracks.length;
        widgetStore.cdState.elapsedSec = 0;
      }
      renderCdPlayerUI();
    }, 1000);
  }

  function openCdPlayerWidget() {
    syncTracksFromArchive();
    const cdIcon = `
      <svg width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">
        <circle cx="8" cy="8" r="6" fill="#e0e0e0" stroke="#111111" stroke-width="1.5"/>
        <circle cx="8" cy="8" r="2" fill="#48dbfb" stroke="#111111" stroke-width="1"/>
      </svg>`;

    const el = createWidgetShell({
      id: 'widget-cd-player',
      title: 'CD Player',
      iconSvg: cdIcon,
      width: 268,
      defaultLeft: 120,
      defaultTop: 72,
      bodyHtml: `
        <div class="w95-cd-top">
          <img id="w95-cd-art" class="w95-cd-art" src="${FALLBACK_ALBUM_ART}" alt="Album Cover" />
          <div class="w95-cd-meta">
            <div id="w95-cd-artist" class="w95-cd-artist">Simple Minds</div>
            <div id="w95-cd-title" class="w95-cd-track">Don't You (Forget...</div>
          </div>
        </div>
        <div class="w95-cd-time-row">
          <span id="w95-cd-cur">01:31</span>
          <div id="w95-cd-bar" class="w95-cd-track-bar" title="클릭하여 위치 이동">
            <div id="w95-cd-fill" class="w95-cd-fill"></div>
            <div id="w95-cd-thumb" class="w95-cd-thumb"></div>
          </div>
          <span id="w95-cd-dur">04:23</span>
        </div>
        <div class="w95-cd-controls">
          <button type="button" id="w95-cd-play" class="w95-cd-btn" title="재생/일시정지">▶</button>
          <button type="button" id="w95-cd-prev" class="w95-cd-btn" title="이전 곡">|◀</button>
          <button type="button" id="w95-cd-next" class="w95-cd-btn" title="다음 곡">▶|</button>
        </div>
      `
    });

    if (!el.dataset.cdBound) {
      el.dataset.cdBound = 'true';
      startCdTick();

      el.querySelector('#w95-cd-play')?.addEventListener('click', () => {
        beep('click');
        widgetStore.cdState.playing = !widgetStore.cdState.playing;
        renderCdPlayerUI();
      });

      el.querySelector('#w95-cd-prev')?.addEventListener('click', () => {
        beep('click');
        const len = widgetStore.cdState.tracks.length;
        widgetStore.cdState.index = (widgetStore.cdState.index - 1 + len) % len;
        widgetStore.cdState.elapsedSec = 0;
        renderCdPlayerUI();
      });

      el.querySelector('#w95-cd-next')?.addEventListener('click', () => {
        beep('click');
        const len = widgetStore.cdState.tracks.length;
        widgetStore.cdState.index = (widgetStore.cdState.index + 1) % len;
        widgetStore.cdState.elapsedSec = 0;
        renderCdPlayerUI();
      });

      el.querySelector('#w95-cd-bar')?.addEventListener('click', e => {
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        const curTrack = widgetStore.cdState.tracks[widgetStore.cdState.index] || DEFAULT_TRACKS[0];
        widgetStore.cdState.elapsedSec = Math.floor(ratio * curTrack.durationSec);
        beep('click');
        renderCdPlayerUI();
      });
    }

    renderCdPlayerUI();
  }

  // ------------------------------------------------------------
  // 2. 시계(Clock) 위젯
  // ------------------------------------------------------------
  function openClockWidget() {
    const el = createWidgetShell({
      id: 'widget-clock',
      title: 'Clock 95',
      iconSvg: '',
      width: 220,
      defaultLeft: 410,
      defaultTop: 72,
      bodyHtml: `
        <div class="w95-clock-lcd">
          <div id="w95-clock-time" class="w95-clock-main">--:--:--</div>
          <div id="w95-clock-date" class="w95-clock-sub">----.--.--</div>
        </div>
      `
    });

    const updateClock = () => {
      const now = new Date();
      const timeEl = el.querySelector('#w95-clock-time');
      const dateEl = el.querySelector('#w95-clock-date');
      if (timeEl) {
        timeEl.textContent = now.toTimeString().slice(0, 8);
      }
      if (dateEl) {
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        dateEl.textContent = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
          now.getDate()
        ).padStart(2, '0')} (${days[now.getDay()]})`;
      }
    };

    updateClock();
    if (!widgetStore.clockTimer) {
      widgetStore.clockTimer = setInterval(updateClock, 1000);
    }
  }

  // 외부에서 아카이브 갱신 후 트랙 동기화할 때 호출 가능
  window.addEventListener('DOMContentLoaded', () => {
    const saved = loadSavedWidgetPositions();
    if (saved['widget-cd-player']?.open) openCdPlayerWidget();
    if (saved['widget-clock']?.open) openClockWidget();
  });

  window.Win95Widgets = {
    open: openCdPlayerWidget,
    openCdPlayer: openCdPlayerWidget,
    openClock: openClockWidget,
    create: createWidgetShell,
    syncTracks: () => {
      syncTracksFromArchive();
      renderCdPlayerUI();
    }
  };
})();

// ============================================================
// MY-ARCHIVE 95 OS — Floating Win95 Widgets Controller
// (CD Player + Live Clock + Mood Music Local AI + Jukebox 95 Sync)
// ============================================================

(function () {
  window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
  window.__MOD_VERSIONS.win95Widgets = 'v2026.11.25-03';

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
      genre: '80s Synth Pop / Rock',
      rating: 5,
      review: '경쾌한 리듬과 웅장한 후렴이 기분을 끌어올리는 클래식 트랙.',
      coverUrl: 'https://i.ytimg.com/vi/CdqoNKCCt7A/hqdefault.jpg',
      durationSec: 263,
      sourceUrl: 'https://www.youtube.com/watch?v=CdqoNKCCt7A'
    },
    {
      id: 'trk-2',
      title: 'Take On Me',
      creator: 'a-ha',
      genre: '80s Synth Pop',
      rating: 5,
      review: '레트로 신스 리프와 시원한 고음이 돋보이는 대표곡.',
      coverUrl: 'https://i.ytimg.com/vi/djV11Xbc914/hqdefault.jpg',
      durationSec: 225,
      sourceUrl: 'https://www.youtube.com/watch?v=djV11Xbc914'
    },
    {
      id: 'trk-3',
      title: 'lofi hip hop radio - beats to relax/study to',
      creator: 'Lofi Girl',
      genre: 'Lo-Fi / Study',
      rating: 5,
      review: '차분하게 집중하거나 휴식을 취할 때 틀어두기 좋은 로파이 사운드.',
      coverUrl: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg',
      durationSec: 3600,
      sourceUrl: 'https://www.youtube.com/watch?v=jfKfPfyJRdk'
    }
  ];

  // 로컬 AI 감성 프로파일 (유튜브 기본 트랙 포함 + 아카이브 우선 매칭)
  const MOOD_PROFILES = {
    happy: {
      key: 'happy',
      label: '기쁨 · 설렘',
      accentBtn: 'yellow',
      keywords: [
        { word: '행복', weight: 4 },
        { word: '설렘', weight: 4 },
        { word: '신나', weight: 4 },
        { word: '밝', weight: 3 },
        { word: '사랑', weight: 3 },
        { word: '청량', weight: 3.5 },
        { word: '기분', weight: 2 },
        { word: '여행', weight: 2.5 },
        { word: '드라이브', weight: 2.5 }
      ],
      genres: ['pop', 'synth', 'funk', 'disco', 'indie pop', 'j-pop', 'k-pop', '팝', '신스'],
      daytimeBonus: hour => (hour >= 9 && hour <= 18 ? 1.5 : 0.5),
      fallbackTracks: [
        {
          id: 'ai-happy-1',
          title: 'Walking On Sunshine',
          creator: 'Katrina & The Waves',
          genre: 'Pop Rock',
          rating: 5,
          review: '흐린 날도 단숨에 밝게 만들어 주는 경쾌한 에너지.',
          coverUrl: 'https://i.ytimg.com/vi/iPUmE-tne5U/hqdefault.jpg',
          durationSec: 239,
          sourceUrl: 'https://www.youtube.com/watch?v=iPUmE-tne5U'
        },
        {
          id: 'ai-happy-2',
          title: 'Sunday Morning',
          creator: 'Maroon 5',
          genre: 'Soul Pop',
          rating: 4,
          review: '여유롭고 기분 좋은 미소가 지어지는 멜로디.',
          coverUrl: 'https://i.ytimg.com/vi/S2Cti12XBw4/hqdefault.jpg',
          durationSec: 244,
          sourceUrl: 'https://www.youtube.com/watch?v=S2Cti12XBw4'
        }
      ]
    },
    sad: {
      key: 'sad',
      label: '센치 · 위로',
      accentBtn: 'sky',
      keywords: [
        { word: '슬픔', weight: 4 },
        { word: '위로', weight: 4.5 },
        { word: '눈물', weight: 3.5 },
        { word: '그리움', weight: 4 },
        { word: '감성', weight: 3 },
        { word: '잔잔', weight: 3 },
        { word: '이별', weight: 3.5 },
        { word: '비', weight: 3 },
        { word: '밤', weight: 2.5 }
      ],
      genres: ['ballad', 'r&b', 'acoustic', 'indie', '발라드', '어쿠스틱', '알앤비', '소울'],
      daytimeBonus: hour => (hour >= 21 || hour <= 4 ? 2.0 : 0.5),
      fallbackTracks: [
        {
          id: 'ai-sad-1',
          title: 'Fix You',
          creator: 'Coldplay',
          genre: 'Alternative Ballad',
          rating: 5,
          review: '조용히 감정을 받아주며 끝내 따뜻하게 감싸 안는 곡.',
          coverUrl: 'https://i.ytimg.com/vi/k4V3Mo61fJM/hqdefault.jpg',
          durationSec: 295,
          sourceUrl: 'https://www.youtube.com/watch?v=k4V3Mo61fJM'
        },
        {
          id: 'ai-sad-2',
          title: 'Yellow',
          creator: 'Coldplay',
          genre: 'Alternative Rock',
          rating: 5,
          review: '깊은 여운과 서정성이 오래 남는 감성 넘버.',
          coverUrl: 'https://i.ytimg.com/vi/yKNxeF4KMsY/hqdefault.jpg',
          durationSec: 269,
          sourceUrl: 'https://www.youtube.com/watch?v=yKNxeF4KMsY'
        }
      ]
    },
    burnout: {
      key: 'burnout',
      label: '번아웃 · 휴식',
      accentBtn: 'green',
      keywords: [
        { word: '휴식', weight: 4.5 },
        { word: '힐링', weight: 4.5 },
        { word: '번아웃', weight: 5 },
        { word: '지침', weight: 4 },
        { word: '여유', weight: 3.5 },
        { word: '산책', weight: 3 },
        { word: '로파이', weight: 4 },
        { word: 'lofi', weight: 4 },
        { word: 'ambient', weight: 4 }
      ],
      genres: ['lo-fi', 'lofi', 'ambient', 'chill', 'jazz', 'acoustic', '로파이', '앰비언트', '재즈'],
      daytimeBonus: hour => (hour >= 18 || hour <= 6 ? 1.8 : 1.0),
      fallbackTracks: [
        {
          id: 'ai-burn-1',
          title: 'lofi hip hop radio - beats to relax/study to',
          creator: 'Lofi Girl',
          genre: 'Lo-Fi / Chill',
          rating: 5,
          review: '생각의 속도를 늦추고 호흡을 고르게 해주는 차분한 비트.',
          coverUrl: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg',
          durationSec: 3600,
          sourceUrl: 'https://www.youtube.com/watch?v=jfKfPfyJRdk'
        },
        {
          id: 'ai-burn-2',
          title: 'Clair de Lune',
          creator: 'Claude Debussy',
          genre: 'Classical / Ambient',
          rating: 5,
          review: '긴장을 풀고 조용히 숨을 고르기 좋은 피아노 선율.',
          coverUrl: 'https://i.ytimg.com/vi/CvFH_6DNRCY/hqdefault.jpg',
          durationSec: 300,
          sourceUrl: 'https://www.youtube.com/watch?v=CvFH_6DNRCY'
        }
      ]
    },
    stress: {
      key: 'stress',
      label: '집중 · 환기',
      accentBtn: 'pink',
      keywords: [
        { word: '집중', weight: 4 },
        { word: '환기', weight: 4 },
        { word: '스트레스', weight: 4.5 },
        { word: '불안', weight: 3.5 },
        { word: '몰입', weight: 4 },
        { word: '에너지', weight: 3.5 },
        { word: '록', weight: 3 },
        { word: 'rock', weight: 3 },
        { word: 'electronic', weight: 3 }
      ],
      genres: ['rock', 'electronic', 'post-rock', 'instrumental', 'synthwave', '록', '일렉트로닉', '인스트루멘털'],
      daytimeBonus: hour => (hour >= 9 && hour <= 22 ? 1.5 : 0.5),
      fallbackTracks: [
        {
          id: 'ai-stress-1',
          title: 'synthwave radio - beats to chill/game to',
          creator: 'Lofi Girl Synthwave',
          genre: 'Synthwave / Focus',
          rating: 5,
          review: '잡념을 끊어내고 일정한 리듬으로 몰입하게 만드는 사운드.',
          coverUrl: 'https://i.ytimg.com/vi/4xDzrJKXOOY/hqdefault.jpg',
          durationSec: 3600,
          sourceUrl: 'https://www.youtube.com/watch?v=4xDzrJKXOOY'
        },
        {
          id: 'ai-stress-2',
          title: 'Your Hand In Mine',
          creator: 'Explosions In The Sky',
          genre: 'Post-Rock',
          rating: 5,
          review: '차분히 쌓아 올리다 시원하게 터지는 전개가 답답함을 날려준다.',
          coverUrl: 'https://i.ytimg.com/vi/cdiY6kijYHE/hqdefault.jpg',
          durationSec: 497,
          sourceUrl: 'https://www.youtube.com/watch?v=cdiY6kijYHE'
        }
      ]
    }
  };

  const widgetStore = {
    widgets: new Map(),
    topZ: 320,
    clockTimer: null,
    cdTimer: null,
    cdState: {
      tracks: [...DEFAULT_TRACKS],
      index: 0,
      playing: false,
      elapsedSec: 0,
      syncStatus: '대기 중'
    },
    moodState: {
      moodKey: 'happy',
      customNote: '',
      lastPickedKey: '',
      currentRec: null
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

  function extractYouTubeVideoId(urlOrId) {
    const raw = String(urlOrId || '').trim();
    if (!raw) return '';
    if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /[?&]v=([a-zA-Z0-9_-]{11})/
    ];
    for (const re of patterns) {
      const m = raw.match(re);
      if (m && m[1]) return m[1];
    }
    return '';
  }

  function resolveCoverUrl(rawCover, sourceUrl) {
    if (rawCover && /^https?:\/\//i.test(rawCover)) return rawCover;
    const vid = extractYouTubeVideoId(sourceUrl);
    if (vid) return `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
    return FALLBACK_ALBUM_ART;
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
      .w95-cd-sync-tag {
        margin-top: 4px;
        font-family: 'Consolas', monospace;
        font-size: 0.68rem;
        font-weight: 800;
        color: #000080;
        background: #dfdfdf;
        border: 1px solid #808080;
        padding: 1px 5px;
        display: inline-block;
        max-width: 100%;
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
        width: 0%;
        background: #000080;
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
        grid-template-columns: 1.4fr 1fr 1fr 0.9fr;
        gap: 5px;
      }
      .w95-cd-btn {
        height: 34px;
        background: #c0c0c0;
        color: #111111;
        border-top: 2px solid #ffffff;
        border-left: 2px solid #ffffff;
        border-right: 2px solid #111111;
        border-bottom: 2px solid #111111;
        box-shadow: inset -1px -1px 0 #808080;
        font-family: 'Consolas', monospace;
        font-size: 0.82rem;
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
      .w95-mood-chips {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 5px;
        margin-bottom: 8px;
      }
      .w95-mini-btn {
        padding: 5px 8px;
        background: #c0c0c0;
        color: #111111;
        border-top: 2px solid #ffffff;
        border-left: 2px solid #ffffff;
        border-right: 2px solid #111111;
        border-bottom: 2px solid #111111;
        font-size: 0.76rem;
        font-weight: 900;
        cursor: pointer;
        text-align: center;
      }
      .w95-mini-btn:active,
      .w95-mini-btn.active {
        background: #ffd83b;
        border-top: 2px solid #111111;
        border-left: 2px solid #111111;
        border-right: 2px solid #ffffff;
        border-bottom: 2px solid #ffffff;
      }
      .w95-mini-btn.sky.active {
        background: #48dbfb;
      }
      .w95-mini-btn.green.active {
        background: #2ed573;
      }
      .w95-mini-btn.pink.active {
        background: #ff9ff3;
      }
      .w95-mood-input {
        width: 100%;
        box-sizing: border-box;
        padding: 5px 7px;
        font-size: 0.76rem;
        font-weight: 700;
        background: #ffffff;
        color: #111111;
        border-top: 2px solid #808080;
        border-left: 2px solid #808080;
        border-right: 2px solid #ffffff;
        border-bottom: 2px solid #ffffff;
        margin-bottom: 8px;
        user-select: text;
      }
      .w95-mood-card {
        background: #fffdf2;
        border: 2px solid #111111;
        padding: 8px;
        margin-bottom: 8px;
      }
      .w95-mood-reason {
        font-size: 0.7rem;
        font-weight: 800;
        color: #000080;
        background: #e8f4ff;
        border: 1px solid #111111;
        padding: 4px 6px;
        margin-top: 6px;
        line-height: 1.35;
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
  // 1. 주크박스 95 & 유튜브 플레이어 양방향 브리지
  // ------------------------------------------------------------
  function getJukeboxMediaBridge() {
    // 1) YouTube IFrame API 인스턴스 탐색
    const ytCandidates = [
      window.jukeboxYtPlayer,
      window.ytPlayer,
      window.jukeboxPlayer,
      window.player
    ].filter(p => p && typeof p.getCurrentTime === 'function');

    if (ytCandidates.length) {
      const yt = ytCandidates[0];
      return {
        type: 'youtube',
        isPlaying: () => (typeof yt.getPlayerState === 'function' ? yt.getPlayerState() === 1 : false),
        getCurrentTime: () => Number(yt.getCurrentTime?.()) || 0,
        getDuration: () => Number(yt.getDuration?.()) || 0,
        play: () => yt.playVideo?.(),
        pause: () => yt.pauseVideo?.(),
        seekTo: sec => yt.seekTo?.(sec, true)
      };
    }

    // 2) 주크박스 창 내부 <audio> / <video> 엘리먼트 탐색
    const jukeboxWin = document.getElementById('win-jukebox');
    const htmlMedia = jukeboxWin?.querySelector('audio, video') || document.querySelector('audio');
    if (htmlMedia && htmlMedia.src) {
      return {
        type: 'html5',
        isPlaying: () => !htmlMedia.paused && !htmlMedia.ended,
        getCurrentTime: () => Number(htmlMedia.currentTime) || 0,
        getDuration: () => Number(htmlMedia.duration) || 0,
        play: () => htmlMedia.play?.(),
        pause: () => htmlMedia.pause?.(),
        seekTo: sec => {
          htmlMedia.currentTime = sec;
        }
      };
    }

    return null;
  }

  function triggerJukeboxYouTubeSearch(query) {
    const q = String(query || '').trim();
    if (!q) return false;

    if (typeof window.searchYouTubeInJukebox === 'function') {
      window.searchYouTubeInJukebox(q);
      return true;
    }
    if (typeof window.searchJukeboxYouTube === 'function') {
      window.searchJukeboxYouTube(q);
      return true;
    }

    const jukeboxWin = document.getElementById('win-jukebox');
    if (!jukeboxWin) return false;

    const searchInput = jukeboxWin.querySelector(
      '#jukebox-yt-search-input, #jukebox-search-input, #yt-search-input, input[placeholder*="유튜브"], input[placeholder*="검색"]'
    );
    if (!searchInput) return false;

    searchInput.value = q;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));

    const searchBtn = jukeboxWin.querySelector(
      '#btn-jukebox-yt-search, #btn-jukebox-search, #btn-yt-search, button[data-action="yt-search"]'
    );
    if (searchBtn) {
      searchBtn.click();
      return true;
    }

    searchInput.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true })
    );
    return true;
  }

  function mountUrlInExistingJukebox(track) {
    const url = String(track?.sourceUrl || '').trim();
    const vid = extractYouTubeVideoId(url);
    const jukeboxWin = document.getElementById('win-jukebox');

    // 주크박스 창이 닫혀 있으면 백그라운드에서도 오디오가 돌 수 있도록 openWindow 호출
    if (jukeboxWin && !jukeboxWin.classList.contains('open') && typeof window.openWindow === 'function') {
      window.openWindow('win-jukebox');
      // 위젯 포커스 유지
      const cdEl = widgetStore.widgets.get('widget-cd-player');
      if (cdEl && !cdEl.classList.contains('hidden')) focusWidget('widget-cd-player');
    }

    // 1) 전역 주크박스 재생 함수가 있으면 최우선 호출
    if (typeof window.playJukeboxTrack === 'function') {
      try {
        window.playJukeboxTrack(track);
        widgetStore.cdState.syncStatus = '주크박스 95 연동 재생';
        return true;
      } catch {}
    }

    if (typeof window.mountYouTubeEmbedInJukebox === 'function' && (url || vid)) {
      try {
        window.mountYouTubeEmbedInJukebox(url || `https://www.youtube.com/watch?v=${vid}`, track.title);
        widgetStore.cdState.syncStatus = 'YouTube 임베드 재생 중';
        return true;
      } catch {}
    }

    // 2) URL이 있으면 주크박스 URL 입력창 또는 iframe에 직접 주입
    if (url || vid) {
      const watchUrl = url || `https://www.youtube.com/watch?v=${vid}`;
      if (jukeboxWin) {
        const urlInput = jukeboxWin.querySelector(
          '#jukebox-url-input, #jukebox-yt-url, #jukebox-source-url, input[placeholder*="youtu"], input[placeholder*="URL"]'
        );
        if (urlInput) {
          urlInput.value = watchUrl;
          urlInput.dispatchEvent(new Event('input', { bubbles: true }));
          const loadBtn = jukeboxWin.querySelector(
            '#btn-jukebox-load-url, #btn-jukebox-play-url, #btn-load-jukebox, button[data-action="load-url"]'
          );
          if (loadBtn) {
            loadBtn.click();
            widgetStore.cdState.syncStatus = '주크박스 URL 로드됨';
            return true;
          }
        }

        // 3) 주크박스 내 iframe이 있을 경우 autoplay=1로 직접 교체
        const iframe = jukeboxWin.querySelector('iframe');
        if (iframe && vid) {
          iframe.src = `https://www.youtube.com/embed/${vid}?autoplay=1&enablejsapi=1&rel=0`;
          widgetStore.cdState.syncStatus = 'YouTube 직결 재생 중';
          return true;
        }
      }
    }

    // 4) URL이 없는 곡이면 주크박스 유튜브 영상 탐색 자동 실행
    const searched = triggerJukeboxYouTubeSearch(`${track.creator} ${track.title}`);
    widgetStore.cdState.syncStatus = searched ? '유튜브 영상 자동 탐색됨' : '로컬 타이머 모드';
    return searched;
  }

  function bridgeToExistingJukebox(track, forceReload = true) {
    if (!track) return;

    const titleEl = document.getElementById('jukebox-now-title');
    const artistEl = document.getElementById('jukebox-now-artist');
    if (titleEl) titleEl.textContent = track.title;
    if (artistEl) artistEl.textContent = track.creator;

    if (forceReload) {
      mountUrlInExistingJukebox(track);
    }
  }

  // ------------------------------------------------------------
  // 2. CD Player 위젯 (아카이브 & 주크박스 95 트랙 통합)
  // ------------------------------------------------------------
  function syncTracksFromArchive() {
    const merged = [];
    const seen = new Set();

    const pushTrack = (raw, fallbackIdx = 0) => {
      if (!raw || !raw.title) return;
      const title = String(raw.title).trim();
      const creator = String(raw.creator || raw.artist || 'Unknown Artist').trim();
      const sourceUrl = String(raw.sourceUrl || raw.url || raw.youtubeUrl || '').trim();
      const dedupKey = `${title.toLowerCase()}|${creator.toLowerCase()}`;
      if (seen.has(dedupKey)) return;
      seen.add(dedupKey);

      merged.push({
        id: raw.id || `trk-${fallbackIdx}-${Date.now()}`,
        title,
        creator,
        genre: String(raw.genre || '음악'),
        rating: Number(raw.rating) || 4,
        review: String(raw.review || ''),
        coverUrl: resolveCoverUrl(raw.coverUrl, sourceUrl),
        durationSec: Number(raw.durationSec) || 225,
        sourceUrl
      });
    };

    // 1) 주크박스 전역 플레이리스트가 있으면 우선 수집
    if (Array.isArray(window.jukeboxPlaylist)) {
      window.jukeboxPlaylist.forEach((it, idx) => pushTrack(it, idx));
    }

    // 2) 아카이브 항목 중 음악 카테고리 또는 유튜브 URL 보유 항목 수집
    if (Array.isArray(window.archiveItems)) {
      window.archiveItems
        .filter(
          it =>
            it &&
            it.title &&
            (it.category === '음악' ||
              String(it.category || '').includes('음악') ||
              Boolean(extractYouTubeVideoId(it.sourceUrl)))
        )
        .forEach((it, idx) => pushTrack(it, idx + 100));
    }

    // 3) 수집된 항목이 없으면 기본 트랙 사용
    if (!merged.length) {
      DEFAULT_TRACKS.forEach((it, idx) => pushTrack(it, idx + 500));
    }

    const currentTrack = widgetStore.cdState.tracks[widgetStore.cdState.index];
    widgetStore.cdState.tracks = merged;
    if (currentTrack) {
      const nextIdx = merged.findIndex(
        t => t.title === currentTrack.title && t.creator === currentTrack.creator
      );
      widgetStore.cdState.index = nextIdx >= 0 ? nextIdx : 0;
    } else if (widgetStore.cdState.index >= merged.length) {
      widgetStore.cdState.index = 0;
    }
  }

  function loadAndPlayTrackInCd(track, autoPlay = true) {
    if (!track) return;
    openCdPlayerWidget();
    syncTracksFromArchive();

    const normalized = {
      id: track.id || `mood-${Date.now()}`,
      title: String(track.title),
      creator: String(track.creator || 'Unknown Artist'),
      genre: String(track.genre || '음악'),
      rating: Number(track.rating) || 4,
      review: String(track.review || ''),
      coverUrl: resolveCoverUrl(track.coverUrl, track.sourceUrl),
      durationSec: Number(track.durationSec) || 225,
      sourceUrl: String(track.sourceUrl || '').trim()
    };

    const existingIdx = widgetStore.cdState.tracks.findIndex(
      t =>
        String(t.id) === String(normalized.id) ||
        (t.title.toLowerCase() === normalized.title.toLowerCase() &&
          t.creator.toLowerCase() === normalized.creator.toLowerCase())
    );

    if (existingIdx >= 0) {
      widgetStore.cdState.tracks[existingIdx] = {
        ...widgetStore.cdState.tracks[existingIdx],
        ...normalized
      };
      widgetStore.cdState.index = existingIdx;
    } else {
      widgetStore.cdState.tracks.unshift(normalized);
      widgetStore.cdState.index = 0;
    }

    widgetStore.cdState.elapsedSec = 0;
    widgetStore.cdState.playing = Boolean(autoPlay);
    renderCdPlayerUI();
    bridgeToExistingJukebox(normalized, true);
  }

  function renderCdPlayerUI() {
    const win = widgetStore.widgets.get('widget-cd-player');
    if (!win) return;
    const { tracks, index, playing, elapsedSec, syncStatus } = widgetStore.cdState;
    const track = tracks[index] || DEFAULT_TRACKS[0];
    const ratio =
      track.durationSec > 0 ? Math.min(1, Math.max(0, elapsedSec / track.durationSec)) : 0;

    const artEl = win.querySelector('#w95-cd-art');
    const artistEl = win.querySelector('#w95-cd-artist');
    const titleEl = win.querySelector('#w95-cd-title');
    const syncEl = win.querySelector('#w95-cd-sync-tag');
    const curEl = win.querySelector('#w95-cd-cur');
    const durEl = win.querySelector('#w95-cd-dur');
    const fillEl = win.querySelector('#w95-cd-fill');
    const thumbEl = win.querySelector('#w95-cd-thumb');
    const playBtn = win.querySelector('#w95-cd-play');

    if (artEl) {
      const targetArt = resolveCoverUrl(track.coverUrl, track.sourceUrl);
      if (artEl.dataset.curSrc !== targetArt) {
        artEl.dataset.curSrc = targetArt;
        artEl.src = targetArt;
        artEl.onerror = () => {
          artEl.onerror = null;
          artEl.src = FALLBACK_ALBUM_ART;
        };
      }
    }
    if (artistEl) artistEl.textContent = track.creator;
    if (titleEl) titleEl.textContent = `[${index + 1}/${tracks.length}] ${track.title}`;
    if (syncEl) syncEl.textContent = `JB95: ${syncStatus}`;
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
      const bridge = getJukeboxMediaBridge();
      const curTrack =
        widgetStore.cdState.tracks[widgetStore.cdState.index] || DEFAULT_TRACKS[0];

      // 실제 유튜브/오디오 플레이어가 연결된 경우 실제 재생 시간과 동기화
      if (bridge) {
        const realDur = bridge.getDuration();
        const realCur = bridge.getCurrentTime();
        if (realDur > 0) curTrack.durationSec = Math.floor(realDur);
        if (realCur >= 0) widgetStore.cdState.elapsedSec = Math.floor(realCur);
        widgetStore.cdState.playing = bridge.isPlaying();
        widgetStore.cdState.syncStatus =
          bridge.type === 'youtube' ? 'YouTube 실시간 동기화' : '오디오 실시간 동기화';
        renderCdPlayerUI();
        return;
      }

      if (!widgetStore.cdState.playing) return;
      widgetStore.cdState.elapsedSec += 1;
      if (widgetStore.cdState.elapsedSec >= curTrack.durationSec) {
        widgetStore.cdState.index =
          (widgetStore.cdState.index + 1) % widgetStore.cdState.tracks.length;
        widgetStore.cdState.elapsedSec = 0;
        bridgeToExistingJukebox(
          widgetStore.cdState.tracks[widgetStore.cdState.index],
          true
        );
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
      title: 'CD Player (Jukebox 95 Sync)',
      iconSvg: cdIcon,
      width: 284,
      defaultLeft: 120,
      defaultTop: 72,
      bodyHtml: `
        <div class="w95-cd-top">
          <img id="w95-cd-art" class="w95-cd-art" src="${FALLBACK_ALBUM_ART}" alt="Album Cover" />
          <div class="w95-cd-meta">
            <div id="w95-cd-artist" class="w95-cd-artist">-</div>
            <div id="w95-cd-title" class="w95-cd-track">-</div>
            <div id="w95-cd-sync-tag" class="w95-cd-sync-tag">JB95: 대기 중</div>
          </div>
        </div>
        <div class="w95-cd-time-row">
          <span id="w95-cd-cur">00:00</span>
          <div id="w95-cd-bar" class="w95-cd-track-bar" title="클릭하여 위치 이동">
            <div id="w95-cd-fill" class="w95-cd-fill"></div>
            <div id="w95-cd-thumb" class="w95-cd-thumb"></div>
          </div>
          <span id="w95-cd-dur">00:00</span>
        </div>
        <div class="w95-cd-controls">
          <button type="button" id="w95-cd-play" class="w95-cd-btn" title="재생/일시정지">▶</button>
          <button type="button" id="w95-cd-prev" class="w95-cd-btn" title="이전 곡">|◀</button>
          <button type="button" id="w95-cd-next" class="w95-cd-btn" title="다음 곡">▶|</button>
          <button type="button" id="w95-cd-open-jb" class="w95-cd-btn" title="주크박스 95 열기">JB</button>
        </div>
      `
    });

    if (!el.dataset.cdBound) {
      el.dataset.cdBound = 'true';
      startCdTick();

      el.querySelector('#w95-cd-play')?.addEventListener('click', () => {
        beep('click');
        const nextPlaying = !widgetStore.cdState.playing;
        widgetStore.cdState.playing = nextPlaying;
        const curTrack = widgetStore.cdState.tracks[widgetStore.cdState.index];
        const bridge = getJukeboxMediaBridge();

        if (bridge) {
          if (nextPlaying) bridge.play();
          else bridge.pause();
        } else if (nextPlaying) {
          bridgeToExistingJukebox(curTrack, true);
        }
        renderCdPlayerUI();
      });

      el.querySelector('#w95-cd-prev')?.addEventListener('click', () => {
        beep('click');
        const len = widgetStore.cdState.tracks.length;
        widgetStore.cdState.index = (widgetStore.cdState.index - 1 + len) % len;
        widgetStore.cdState.elapsedSec = 0;
        widgetStore.cdState.playing = true;
        renderCdPlayerUI();
        bridgeToExistingJukebox(widgetStore.cdState.tracks[widgetStore.cdState.index], true);
      });

      el.querySelector('#w95-cd-next')?.addEventListener('click', () => {
        beep('click');
        const len = widgetStore.cdState.tracks.length;
        widgetStore.cdState.index = (widgetStore.cdState.index + 1) % len;
        widgetStore.cdState.elapsedSec = 0;
        widgetStore.cdState.playing = true;
        renderCdPlayerUI();
        bridgeToExistingJukebox(widgetStore.cdState.tracks[widgetStore.cdState.index], true);
      });

      el.querySelector('#w95-cd-open-jb')?.addEventListener('click', () => {
        beep('open');
        if (typeof window.openWindow === 'function') {
          window.openWindow('win-jukebox');
        }
        bridgeToExistingJukebox(widgetStore.cdState.tracks[widgetStore.cdState.index], true);
      });

      el.querySelector('#w95-cd-bar')?.addEventListener('click', e => {
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        const curTrack =
          widgetStore.cdState.tracks[widgetStore.cdState.index] || DEFAULT_TRACKS[0];
        const nextSec = Math.floor(ratio * curTrack.durationSec);
        widgetStore.cdState.elapsedSec = nextSec;
        const bridge = getJukeboxMediaBridge();
        if (bridge) bridge.seekTo(nextSec);
        beep('click');
        renderCdPlayerUI();
      });
    }

    renderCdPlayerUI();
  }

  // ------------------------------------------------------------
  // 3. 로컬 AI 기분별 음악 추천 엔진 & 위젯
  // ------------------------------------------------------------
  function buildCandidateMusicPool(moodKey) {
    const profile = MOOD_PROFILES[moodKey] || MOOD_PROFILES.happy;
    const pool = [];

    if (Array.isArray(window.archiveItems)) {
      window.archiveItems
        .filter(
          it =>
            it &&
            it.title &&
            (it.category === '음악' ||
              String(it.category || '').includes('음악') ||
              Boolean(extractYouTubeVideoId(it.sourceUrl)))
        )
        .forEach((it, idx) => {
          const sourceUrl = String(it.sourceUrl || '').trim();
          pool.push({
            id: it.id || `arc-m-${idx}`,
            title: String(it.title),
            creator: String(it.creator || 'Unknown Artist'),
            genre: String(it.genre || '음악'),
            rating: Number(it.rating) || 4,
            review: String(it.review || ''),
            coverUrl: resolveCoverUrl(it.coverUrl, sourceUrl),
            durationSec: 225,
            sourceUrl,
            fromArchive: true
          });
        });
    }

    (profile.fallbackTracks || []).forEach(ft => {
      const dup = pool.some(p => p.title.toLowerCase() === ft.title.toLowerCase());
      if (!dup) pool.push({ ...ft, fromArchive: false });
    });

    return pool;
  }

  function recommendMusicLocally(moodKey, customNote = '') {
    const profile = MOOD_PROFILES[moodKey] || MOOD_PROFILES.happy;
    const nowHour = new Date().getHours();
    const customTokens = String(customNote || '')
      .toLowerCase()
      .split(/[\s,./!?;:]+/)
      .map(t => t.trim())
      .filter(t => t.length >= 2);

    const pool = buildCandidateMusicPool(moodKey);
    const scored = pool.map(item => {
      const corpus = `${item.title} ${item.creator} ${item.genre} ${item.review}`.toLowerCase();
      const genreLower = String(item.genre || '').toLowerCase();
      let score = 0;
      const reasons = [];

      profile.keywords.forEach(kw => {
        if (corpus.includes(kw.word.toLowerCase())) {
          score += kw.weight;
          if (reasons.length < 2) reasons.push(`키워드 '${kw.word}'`);
        }
      });

      if (profile.genres.some(g => genreLower.includes(g.toLowerCase()))) {
        score += 3.0;
        reasons.push(`장르 '${item.genre}'`);
      }

      customTokens.forEach(tok => {
        if (corpus.includes(tok)) {
          score += 4.0;
          reasons.push(`입력어 '${tok}'`);
        }
      });

      const ratingNum = Number(item.rating) || 3;
      score += (ratingNum - 3) * 0.8;
      if (item.fromArchive) score += 1.2;
      if (item.sourceUrl) score += 1.0;

      score += profile.daytimeBonus(nowHour);

      const uniqueKey = `${item.id}|${item.title}`;
      if (uniqueKey === widgetStore.moodState.lastPickedKey) {
        score -= 8.0;
      }
      score += Math.random() * 1.6;

      return {
        item,
        score,
        reasonText:
          reasons.length > 0
            ? `${profile.label} · ${reasons.join(', ')} 매칭 (${ratingNum}★)`
            : `${profile.label} · ${nowHour}시 시간대 & 평점(${ratingNum}★) 기반 추천`
      };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored[0] || {
      item: DEFAULT_TRACKS[0],
      reasonText: `${profile.label} 기본 추천 트랙`
    };

    widgetStore.moodState.lastPickedKey = `${top.item.id}|${top.item.title}`;
    widgetStore.moodState.currentRec = {
      ...top.item,
      moodKey: profile.key,
      moodLabel: profile.label,
      score: Number(top.score.toFixed(1)),
      reasonText: top.reasonText
    };
    return widgetStore.moodState.currentRec;
  }

  function renderMoodMusicUI() {
    const win = widgetStore.widgets.get('widget-mood-music');
    if (!win) return;

    const rec =
      widgetStore.moodState.currentRec ||
      recommendMusicLocally(widgetStore.moodState.moodKey, widgetStore.moodState.customNote);

    win.querySelectorAll('[data-mood-pick]').forEach(btn => {
      const k = btn.dataset.moodPick;
      const prof = MOOD_PROFILES[k];
      btn.classList.toggle('active', k === widgetStore.moodState.moodKey);
      btn.classList.remove('sky', 'green', 'pink');
      if (prof && prof.accentBtn && prof.accentBtn !== 'yellow') {
        btn.classList.add(prof.accentBtn);
      }
    });

    const artEl = win.querySelector('#w95-mood-art');
    const titleEl = win.querySelector('#w95-mood-title');
    const artistEl = win.querySelector('#w95-mood-artist');
    const reasonEl = win.querySelector('#w95-mood-reason');

    if (artEl) {
      artEl.src = resolveCoverUrl(rec.coverUrl, rec.sourceUrl);
      artEl.onerror = () => {
        artEl.onerror = null;
        artEl.src = FALLBACK_ALBUM_ART;
      };
    }
    if (titleEl) titleEl.textContent = rec.title;
    if (artistEl) artistEl.textContent = `${rec.creator} · ${rec.genre || '음악'}`;
    if (reasonEl) {
      const ytFlag = rec.sourceUrl ? 'YouTube 직결' : '유튜브 자동탐색';
      reasonEl.textContent = `AI 매칭: ${rec.reasonText} [${ytFlag}]`;
    }
  }

  function openMoodMusicWidget(initialMoodKey) {
    if (initialMoodKey && MOOD_PROFILES[initialMoodKey]) {
      widgetStore.moodState.moodKey = initialMoodKey;
    }

    const moodIcon = `
      <svg width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">
        <rect x="2" y="2" width="12" height="12" fill="#ffd83b" stroke="#111111" stroke-width="1.5"/>
        <circle cx="6" cy="6.5" r="1.2" fill="#111111"/>
        <circle cx="10" cy="6.5" r="1.2" fill="#111111"/>
        <path d="M5 10q3 2.5 6 0" fill="none" stroke="#111111" stroke-width="1.4"/>
      </svg>`;

    const el = createWidgetShell({
      id: 'widget-mood-music',
      title: 'Mood Music AI',
      iconSvg: moodIcon,
      width: 286,
      defaultLeft: 120,
      defaultTop: 268,
      bodyHtml: `
        <div class="w95-mood-chips">
          <button type="button" class="w95-mini-btn" data-mood-pick="happy">기쁨 · 설렘</button>
          <button type="button" class="w95-mini-btn" data-mood-pick="sad">센치 · 위로</button>
          <button type="button" class="w95-mini-btn" data-mood-pick="burnout">번아웃 · 휴식</button>
          <button type="button" class="w95-mini-btn" data-mood-pick="stress">집중 · 환기</button>
        </div>
        <input
          type="text"
          id="w95-mood-note"
          class="w95-mood-input"
          placeholder="상황·키워드 추가 (예: 비, 공부, 새벽, 인디)..."
          value="${safeEsc(widgetStore.moodState.customNote)}"
        />
        <div class="w95-mood-card">
          <div style="display:flex;gap:8px;align-items:center;">
            <img id="w95-mood-art" class="w95-cd-art" style="width:52px;height:52px;" src="${FALLBACK_ALBUM_ART}" alt="Recommended Cover" />
            <div style="min-width:0;flex:1;">
              <div id="w95-mood-title" style="font-size:0.86rem;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">-</div>
              <div id="w95-mood-artist" style="font-size:0.75rem;font-weight:700;color:#4a4a4a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">-</div>
            </div>
          </div>
          <div id="w95-mood-reason" class="w95-mood-reason">AI 분석 대기 중...</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1.25fr;gap:6px;">
          <button type="button" class="w95-mini-btn" id="w95-mood-reroll">다른 곡 추천</button>
          <button type="button" class="w95-mini-btn active" id="w95-mood-play">▶ 주크박스 재생</button>
        </div>
      `
    });

    if (!el.dataset.moodBound) {
      el.dataset.moodBound = 'true';

      el.querySelectorAll('[data-mood-pick]').forEach(btn => {
        btn.addEventListener('click', () => {
          beep('click');
          widgetStore.moodState.moodKey = btn.dataset.moodPick;
          recommendMusicLocally(widgetStore.moodState.moodKey, widgetStore.moodState.customNote);
          renderMoodMusicUI();
        });
      });

      el.querySelector('#w95-mood-note')?.addEventListener('input', e => {
        widgetStore.moodState.customNote = e.target.value;
      });

      el.querySelector('#w95-mood-note')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          beep('click');
          recommendMusicLocally(widgetStore.moodState.moodKey, widgetStore.moodState.customNote);
          renderMoodMusicUI();
        }
      });

      el.querySelector('#w95-mood-reroll')?.addEventListener('click', () => {
        beep('click');
        recommendMusicLocally(widgetStore.moodState.moodKey, widgetStore.moodState.customNote);
        renderMoodMusicUI();
      });

      el.querySelector('#w95-mood-play')?.addEventListener('click', () => {
        beep('open');
        const rec =
          widgetStore.moodState.currentRec ||
          recommendMusicLocally(widgetStore.moodState.moodKey, widgetStore.moodState.customNote);
        loadAndPlayTrackInCd(rec, true);
      });
    }

    recommendMusicLocally(widgetStore.moodState.moodKey, widgetStore.moodState.customNote);
    renderMoodMusicUI();
  }

  // ------------------------------------------------------------
  // 4. 시계(Clock) 위젯
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

  window.addEventListener('DOMContentLoaded', () => {
    const saved = loadSavedWidgetPositions();
    if (saved['widget-cd-player']?.open) openCdPlayerWidget();
    if (saved['widget-clock']?.open) openClockWidget();
    if (saved['widget-mood-music']?.open) openMoodMusicWidget();
  });

  window.Win95Widgets = {
    open: openCdPlayerWidget,
    openCdPlayer: openCdPlayerWidget,
    openClock: openClockWidget,
    openMoodMusic: openMoodMusicWidget,
    recommendMoodMusic: recommendMusicLocally,
    loadTrackToCd: loadAndPlayTrackInCd,
    searchYouTube: triggerJukeboxYouTubeSearch,
    create: createWidgetShell,
    syncTracks: () => {
      syncTracksFromArchive();
      renderCdPlayerUI();
      renderMoodMusicUI();
    }
  };
})();

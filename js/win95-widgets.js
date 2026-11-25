// ============================================================
// MY-ARCHIVE 95 OS — Floating Win95 Widgets Controller
// Standalone YouTube Playback + Playback Sync + Mobile/Low-Res Guard
// ============================================================

(function () {
  window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
  window.__MOD_VERSIONS.win95Widgets = 'v2026.11.26-standalone-yt-sync-responsive';

  const WIDGET_STATE_KEY = 'myarchive95_widgets_state_v1';
  const WIDGET_RESPONSIVE_STYLE_ID = 'win95-widget-responsive-guard-style';
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

  // 그라인더·톱·망치질 등 회색소음 랜덤 재생 풀
  const GRAY_NOISE_POOL = [
    {
      id: 'gn-1',
      title: 'Angle Grinder Noise 1 hour ASMR',
      tag: 'GRINDER',
      videoId: '2J68ncJd3nA',
      sourceUrl: 'https://www.youtube.com/watch?v=2J68ncJd3nA&t=2333s&pp=ygUHZ3JpbmRlcg%3D%3D'
    },
    {
      id: 'gn-2',
      title: 'ASMR 10 Hours Of Angle Grinder 💕',
      tag: 'GRINDER',
      videoId: 'vvbGUFe18ig',
      sourceUrl: 'https://www.youtube.com/watch?v=vvbGUFe18ig&t=2061s&pp=ygUHZ3JpbmRlcg%3D%3D'
    },
    {
      id: 'gn-3',
      title: 'Grass Trimmer Noise 1 Hour ASMR',
      tag: 'TRIMMER',
      videoId: 'PcMVl2bWxZw',
      sourceUrl: 'https://www.youtube.com/watch?v=PcMVl2bWxZw&t=207s'
    },
    {
      id: 'gn-4',
      title: '1 hour loop of Electric Saw Sound Effect for Construction',
      tag: 'ELECTRIC SAW',
      videoId: 'KKlqK8YptwE',
      sourceUrl: 'https://www.youtube.com/watch?v=KKlqK8YptwE'
    },
    {
      id: 'gn-5',
      title: 'Construction Site Sound Effects - 8 HOURS - with Video. Hammering, Hand Sawing Wood, Drilling etc',
      tag: 'CONSTRUCTION / SAW / DRILL',
      videoId: 'aJCilj7qMGg',
      sourceUrl: 'https://www.youtube.com/watch?v=aJCilj7qMGg&t=12932s&pp=0gcJCTcIAYcqIYzv'
    },
    {
      id: 'gn-6',
      title: '1 Hour Factory Background Ambience Sound',
      tag: 'FACTORY AMBIENCE',
      videoId: 'hWBfldtaqBs',
      sourceUrl: 'https://www.youtube.com/watch?v=hWBfldtaqBs'
    },
    {
      id: 'gn-7',
      title: 'Abracadabra ASMR - Fan sound 01 Industrial Air Con. Deep Low Rumbling Sound relaxation Study Sleep',
      tag: 'INDUSTRIAL FAN / AIR CON',
      videoId: 'RyP9_O4RuSw',
      sourceUrl: 'https://www.youtube.com/watch?v=RyP9_O4RuSw'
    },
    {
      id: 'gn-8',
      title: 'Big Industrial Fan With Mid Tone (Long With Fade)',
      tag: 'INDUSTRIAL FAN',
      videoId: 'hSvPwz55UdY',
      sourceUrl: 'https://www.youtube.com/watch?v=hSvPwz55UdY&pp=ygUUaW5kdXN0cmlhbCBmYW4gc291bmQ%3D'
    }
  ];

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
      videoId: 'CdqoNKCCt7A',
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
      videoId: 'djV11Xbc914',
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
      videoId: 'jfKfPfyJRdk',
      sourceUrl: 'https://www.youtube.com/watch?v=jfKfPfyJRdk'
    }
  ];

  const MOOD_PROFILES = {
    happy: {
      key: 'happy',
      label: '기쁨 · 설렘',
      accentBtn: 'yellow',
      keywords: [
        { word: '행복', weight: 4 },
        { word: '설렘', weight: 4 },
        { word: '신나', weight: 4 },
        { word: '밝은', weight: 3 },
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
          videoId: 'iPUmE-tne5U',
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
          videoId: 'S2Cti12XBw4',
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
          videoId: 'k4V3Mo61fJM',
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
          videoId: 'yKNxeF4KMsY',
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
          videoId: 'jfKfPfyJRdk',
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
          videoId: 'CvFH_6DNRCY',
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
          videoId: '4xDzrJKXOOY',
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
          videoId: 'cdiY6kijYHE',
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
      syncStatus: '단독 YT 준비됨',
      lastEmitKey: ''
    },
    moodState: {
      moodKey: 'happy',
      customNote: '',
      lastPickedKey: '',
      currentRec: null
    },
    calState: {
      year: new Date().getFullYear(),
      month: new Date().getMonth(),
      selectedDay: new Date().getDate()
    },
    grayNoise: {
      lastId: '',
      current: null,
      spawnSeq: 0
    },
    standaloneYt: {
      videoId: '',
      title: '',
      playing: false,
      startSec: 0,
      startedAtMs: 0
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
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /[?&]v=([a-zA-Z0-9_-]{11})/
    ];
    for (const re of patterns) {
      const m = raw.match(re);
      if (m && m[1]) return m[1];
    }
    return '';
  }

  function resolveCoverUrl(rawCover, sourceUrl, videoId = '') {
    if (rawCover && /^https?:\/\//i.test(rawCover)) return rawCover;
    const vid = extractYouTubeVideoId(videoId || sourceUrl);
    if (vid) return `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
    return FALLBACK_ALBUM_ART;
  }

  function getViewportMetrics() {
    const vw = window.visualViewport?.width || window.innerWidth || 1024;
    const vh = window.visualViewport?.height || window.innerHeight || 768;
    const isMobile = vw <= 768;
    const topbarH = document.querySelector('.os-menubar, .top-menubar')?.offsetHeight || 34;
    const taskbarH = document.querySelector('.os-taskbar')?.offsetHeight || 38;
    return { vw, vh, isMobile, topbarH, taskbarH };
  }

  function syncWidgetViewportVars() {
    const { vh } = getViewportMetrics();
    if (vh > 0) {
      document.documentElement.style.setProperty('--app-vh', `${Math.round(vh)}px`);
    }
  }

  function clampWidgetPos(left, top, width = 280, height = 180) {
    const { vw, vh, isMobile, topbarH, taskbarH } = getViewportMetrics();
    const sidePad = isMobile ? 8 : 12;
    const w = Math.min(Math.max(140, Number(width) || 280), Math.max(140, vw - sidePad * 2));
    const h = Math.min(Math.max(96, Number(height) || 180), Math.max(96, vh - topbarH - taskbarH - 12));
    const minLeft = sidePad;
    const minTop = topbarH + 6;
    const maxLeft = Math.max(minLeft, vw - w - sidePad);
    const maxTop = Math.max(minTop, vh - h - taskbarH - 6);
    const safeLeft = Number.isFinite(Number(left))
      ? Math.min(maxLeft, Math.max(minLeft, Number(left)))
      : minLeft;
    const safeTop = Number.isFinite(Number(top))
      ? Math.min(maxTop, Math.max(minTop, Number(top)))
      : minTop;
    return { left: safeLeft, top: safeTop, width: w, height: h };
  }

  function getSafeRandomWidgetPos(width = 320, height = 230) {
    const { vw, vh, isMobile, topbarH, taskbarH } = getViewportMetrics();
    const sidePad = isMobile ? 8 : 12;
    const w = Math.min(Math.max(140, Number(width) || 320), Math.max(140, vw - sidePad * 2));
    const h = Math.min(Math.max(96, Number(height) || 230), Math.max(96, vh - topbarH - taskbarH - 12));
    const minLeft = sidePad;
    const minTop = topbarH + 6;
    const maxLeft = Math.max(minLeft, vw - w - sidePad);
    const maxTop = Math.max(minTop, vh - h - taskbarH - 6);

    const randLeft = minLeft + Math.random() * Math.max(0, maxLeft - minLeft);
    const randTop = minTop + Math.random() * Math.max(0, maxTop - minTop);
    return clampWidgetPos(Math.round(randLeft), Math.round(randTop), w, h);
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

  function stopWidgetMedia(el) {
    if (!el) return;
    el.querySelectorAll('audio, video').forEach(media => {
      try {
        media.pause();
        media.currentTime = 0;
      } catch {}
    });
    el.querySelectorAll('iframe').forEach(frame => {
      try {
        frame.setAttribute('src', 'about:blank');
      } catch {}
    });
    if (el.id === 'widget-cd-player') {
      widgetStore.standaloneYt.playing = false;
      widgetStore.standaloneYt.videoId = '';
      widgetStore.standaloneYt.startedAtMs = 0;
    }
  }

  function ensureWidgetStyles() {
    if (!document.getElementById('win95-widget-style')) {
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
          pointer-events: auto;
          touch-action: none;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
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
          touch-action: none;
          flex-shrink: 0;
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
          min-width: 0;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
        }
        .w95-cd-top {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
          min-width: 0;
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
        .w95-cd-yt-slot {
          width: 100%;
          height: 54px;
          background: #111111;
          border-top: 2px solid #808080;
          border-left: 2px solid #808080;
          border-right: 2px solid #ffffff;
          border-bottom: 2px solid #ffffff;
          margin-bottom: 8px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Consolas', monospace;
          font-size: 0.68rem;
          color: #a0e9ff;
          padding: 0 6px;
          text-align: center;
          box-sizing: border-box;
        }
        .w95-cd-yt-slot iframe {
          width: 100%;
          height: 100%;
          border: 0;
          display: block;
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
          min-width: 0;
        }
        .w95-cd-track-bar {
          position: relative;
          flex: 1;
          min-width: 48px;
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
          min-width: 0;
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
          padding: 0 4px;
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
        .w95-cal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4px;
          margin-bottom: 6px;
          background: #000080;
          color: #ffffff;
          padding: 3px 5px;
          font-family: 'Consolas', monospace;
          font-size: 0.78rem;
          font-weight: 900;
        }
        .w95-cal-nav-btn {
          background: #c0c0c0;
          color: #111111;
          border-top: 1.5px solid #ffffff;
          border-left: 1.5px solid #ffffff;
          border-right: 1.5px solid #111111;
          border-bottom: 1.5px solid #111111;
          font-family: 'Consolas', monospace;
          font-size: 0.7rem;
          font-weight: 900;
          padding: 1px 6px;
          cursor: pointer;
          flex-shrink: 0;
        }
        .w95-cal-nav-btn:active {
          border-top: 1.5px solid #111111;
          border-left: 1.5px solid #111111;
          border-right: 1.5px solid #ffffff;
          border-bottom: 1.5px solid #ffffff;
        }
        .w95-cal-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 2px;
          background: #ffffff;
          border-top: 2px solid #808080;
          border-left: 2px solid #808080;
          border-right: 2px solid #ffffff;
          border-bottom: 2px solid #ffffff;
          padding: 4px;
          font-family: 'Consolas', monospace;
          font-size: 0.72rem;
          text-align: center;
        }
        .w95-cal-dow {
          font-weight: 900;
          padding: 2px 0;
          border-bottom: 1px solid #c0c0c0;
          color: #222222;
        }
        .w95-cal-dow.sun { color: #c00000; }
        .w95-cal-dow.sat { color: #0000a8; }
        .w95-cal-day {
          padding: 3px 0;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid transparent;
          min-width: 0;
        }
        .w95-cal-day:hover:not(.empty) {
          background: #dfdfdf;
          border: 1px dotted #111111;
        }
        .w95-cal-day.sun { color: #c00000; }
        .w95-cal-day.sat { color: #0000a8; }
        .w95-cal-day.today {
          background: #ffd83b;
          color: #111111 !important;
          font-weight: 900;
          border: 1px solid #111111;
        }
        .w95-cal-day.selected:not(.today) {
          background: #000080;
          color: #ffffff !important;
          font-weight: 900;
        }
        .w95-cal-footer {
          margin-top: 6px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4px;
          font-family: 'Consolas', monospace;
          font-size: 0.69rem;
          font-weight: 800;
          color: #222222;
        }
        .w95-mood-chips {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 5px;
          margin-bottom: 8px;
        }
        .w95-mini-btn {
          padding: 5px 8px;
          min-width: 0;
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
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          box-sizing: border-box;
        }
        .w95-mini-btn:active,
        .w95-mini-btn.active {
          background: #ffd83b;
          border-top: 2px solid #111111;
          border-left: 2px solid #111111;
          border-right: 2px solid #ffffff;
          border-bottom: 2px solid #ffffff;
        }
        .w95-mini-btn.sky.active { background: #48dbfb; }
        .w95-mini-btn.green.active { background: #2ed573; }
        .w95-mini-btn.pink.active { background: #ff9ff3; }
        .w95-mini-btn.gray-noise {
          background: #a8a8a8;
          color: #111111;
          font-family: 'Consolas', monospace;
          font-size: 0.72rem;
          letter-spacing: 0.02em;
        }
        .w95-mini-btn.gray-noise:hover { background: #969696; }
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
          min-width: 0;
        }
        .w95-mood-card {
          background: #fffdf2;
          border: 2px solid #111111;
          padding: 8px;
          margin-bottom: 8px;
          min-width: 0;
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
          word-break: break-word;
        }
      `;
      document.head.appendChild(style);
    }

    if (!document.getElementById(WIDGET_RESPONSIVE_STYLE_ID)) {
      const rStyle = document.createElement('style');
      rStyle.id = WIDGET_RESPONSIVE_STYLE_ID;
      rStyle.textContent = `
        @media (max-width: 768px) {
          .w95-widget {
            max-width: calc(100vw - 16px) !important;
            max-height: calc(var(--app-vh, 100vh) - 92px) !important;
          }
          .w95-w-body {
            padding: 8px !important;
          }
          .w95-cd-art {
            width: 54px !important;
            height: 54px !important;
          }
          .w95-clock-main {
            font-size: 1.08rem !important;
          }
        }
        @media (max-width: 480px) {
          .w95-cd-controls {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .w95-mood-chips {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .w95-mini-btn {
            font-size: 0.72rem !important;
            padding: 5px 6px !important;
          }
        }
      `;
      document.head.appendChild(rStyle);
    }
  }

  function focusWidget(id) {
    widgetStore.topZ += 1;
    widgetStore.widgets.forEach((el, key) => {
      el.classList.toggle('active', key === id);
      if (key === id) el.style.zIndex = String(widgetStore.topZ);
    });
  }

  function makeDraggable(el, id, { persistPosition = true } = {}) {
    const bar = el.querySelector('.w95-w-titlebar');
    if (!bar || bar.dataset.dragBound === 'true') return;
    bar.dataset.dragBound = 'true';

    bar.addEventListener('pointerdown', e => {
      if (e.button !== undefined && e.button !== 0) return;
      if (e.target.closest('.w95-w-btn, button, a, input')) return;
      e.preventDefault();
      e.stopPropagation();
      focusWidget(id);

      const pointerId = e.pointerId;
      try {
        bar.setPointerCapture(pointerId);
      } catch {}

      const startX = e.clientX;
      const startY = e.clientY;
      const rect = el.getBoundingClientRect();
      const origLeft = rect.left;
      const origTop = rect.top;

      const onMove = moveEvent => {
        if (moveEvent.pointerId !== undefined && moveEvent.pointerId !== pointerId) return;
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        const clamped = clampWidgetPos(
          origLeft + dx,
          origTop + dy,
          el.offsetWidth || 260,
          el.offsetHeight || 160
        );
        el.style.left = `${clamped.left}px`;
        el.style.top = `${clamped.top}px`;
      };

      const onUp = upEvent => {
        if (upEvent.pointerId !== undefined && upEvent.pointerId !== pointerId) return;
        try {
          bar.releasePointerCapture(pointerId);
        } catch {}
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);

        const finalRect = el.getBoundingClientRect();
        const savedPos = clampWidgetPos(
          Math.round(finalRect.left),
          Math.round(finalRect.top),
          el.offsetWidth || 260,
          el.offsetHeight || 160
        );
        if (persistPosition) {
          saveWidgetPosition(id, savedPos.left, savedPos.top, !el.classList.contains('hidden'));
        }
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    });
  }

  function createWidgetShell({
    id,
    title,
    iconSvg,
    width,
    defaultLeft,
    defaultTop,
    bodyHtml,
    persistPosition = true,
    destroyOnClose = false
  }) {
    ensureWidgetStyles();
    syncWidgetViewportVars();
    const w = Number(width) || 260;

    if (!destroyOnClose && widgetStore.widgets.has(id)) {
      const existing = widgetStore.widgets.get(id);
      existing.classList.remove('hidden');
      const curRect = existing.getBoundingClientRect();
      const safePos = clampWidgetPos(
        curRect.left || defaultLeft || 120,
        curRect.top || defaultTop || 80,
        existing.offsetWidth || w,
        existing.offsetHeight || 180
      );
      existing.style.width = `${safePos.width}px`;
      existing.style.left = `${safePos.left}px`;
      existing.style.top = `${safePos.top}px`;
      focusWidget(id);
      return existing;
    }

    const saved = persistPosition ? (loadSavedWidgetPositions()[id] || {}) : {};
    const rawLeft = typeof saved.left === 'number' ? saved.left : (defaultLeft ?? 120);
    const rawTop = typeof saved.top === 'number' ? saved.top : (defaultTop ?? 80);
    const { left, top, width: fitW } = clampWidgetPos(rawLeft, rawTop, w, 180);

    const el = document.createElement('div');
    el.className = 'w95-widget';
    el.id = id;
    el.style.width = `${fitW}px`;
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
      if (persistPosition) {
        saveWidgetPosition(id, el.offsetLeft, el.offsetTop, false);
      }
    });
    el.querySelector('[data-w-act="close"]')?.addEventListener('click', () => {
      beep('close');
      stopWidgetMedia(el);
      if (id === 'widget-cd-player') {
        widgetStore.cdState.playing = false;
        widgetStore.cdState.syncStatus = '닫힘 (정지됨)';
        emitPlaybackSync('stop');
      }
      if (destroyOnClose) {
        widgetStore.widgets.delete(id);
        el.remove();
      } else {
        el.classList.add('hidden');
        if (persistPosition) {
          saveWidgetPosition(id, el.offsetLeft, el.offsetTop, false);
        }
      }
    });

    (document.getElementById('dynamic-windows-container') || document.body).appendChild(el);
    widgetStore.widgets.set(id, el);
    makeDraggable(el, id, { persistPosition });
    focusWidget(id);
    return el;
  }

  // ------------------------------------------------------------
  // 1. 단독 유튜브 탐색/재생 엔진 & 주크박스 상태 양방향 동기화
  // ------------------------------------------------------------
  function getAllKnownTracksPool() {
    const list = [];
    const seen = new Set();

    const addItem = raw => {
      if (!raw || !raw.title) return;
      const title = String(raw.title).trim();
      const creator = String(raw.creator || raw.artist || 'Unknown Artist').trim();
      const sourceUrl = String(raw.sourceUrl || raw.url || raw.youtubeUrl || '').trim();
      const videoId = extractYouTubeVideoId(raw.videoId || sourceUrl);
      const key = `${title.toLowerCase()}|${creator.toLowerCase()}|${videoId}`;
      if (seen.has(key)) return;
      seen.add(key);

      list.push({
        id: raw.id || `trk-${list.length}`,
        title,
        creator,
        genre: String(raw.genre || '음악'),
        rating: Number(raw.rating) || 4,
        review: String(raw.review || ''),
        coverUrl: resolveCoverUrl(raw.coverUrl, sourceUrl, videoId),
        durationSec: Number(raw.durationSec) || 225,
        videoId,
        sourceUrl: sourceUrl || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : '')
      });
    };

    DEFAULT_TRACKS.forEach(addItem);
    Object.values(MOOD_PROFILES).forEach(prof => {
      (prof.fallbackTracks || []).forEach(addItem);
    });
    if (Array.isArray(window.jukeboxPlaylist)) {
      window.jukeboxPlaylist.forEach(addItem);
    }
    if (Array.isArray(window.archiveItems)) {
      window.archiveItems.forEach(addItem);
    }
    return list;
  }

  function resolveTrackYouTubeSource(track) {
    if (!track) return DEFAULT_TRACKS[0];
    const directUrl = String(track.sourceUrl || track.url || track.youtubeUrl || '').trim();
    const directVid = extractYouTubeVideoId(track.videoId || directUrl);
    if (directVid) {
      return {
        ...track,
        videoId: directVid,
        sourceUrl: directUrl || `https://www.youtube.com/watch?v=${directVid}`,
        coverUrl: resolveCoverUrl(track.coverUrl, directUrl, directVid)
      };
    }

    const queryText = `${track.title || ''} ${track.creator || ''} ${track.genre || ''} ${track.review || ''}`
      .toLowerCase()
      .trim();
    const tokens = queryText
      .split(/[\s,./!?;:()\-]+/)
      .map(t => t.trim())
      .filter(t => t.length >= 2);

    const candidates = getAllKnownTracksPool().filter(item => Boolean(item.videoId));
    let bestMatch = null;
    let bestScore = -1;

    for (const cand of candidates) {
      const hay = `${cand.title} ${cand.creator} ${cand.genre} ${cand.review}`.toLowerCase();
      let score = 0;
      if (cand.title.toLowerCase() === String(track.title || '').toLowerCase()) score += 20;
      if (cand.creator.toLowerCase() === String(track.creator || '').toLowerCase()) score += 10;
      for (const tok of tokens) {
        if (hay.includes(tok)) score += 3;
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = cand;
      }
    }

    const chosen = bestMatch || DEFAULT_TRACKS[0];
    return {
      ...track,
      videoId: chosen.videoId,
      sourceUrl: chosen.sourceUrl || `https://www.youtube.com/watch?v=${chosen.videoId}`,
      coverUrl: resolveCoverUrl(track.coverUrl, chosen.sourceUrl, chosen.videoId)
    };
  }

  function buildStandaloneYouTubeEmbedUrl(videoId, { autoplay = true, startSec = 0 } = {}) {
    const sec = Math.max(0, Math.floor(Number(startSec) || 0));
    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      start: String(sec),
      rel: '0',
      playsinline: '1',
      enablejsapi: '1'
    });
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
  }

  function renderStandaloneYouTubePlayer(track, { autoplay = true, startSec = 0 } = {}) {
    const win = widgetStore.widgets.get('widget-cd-player');
    if (!win) return '';
    const slot = win.querySelector('#w95-cd-yt-slot');
    if (!slot) return '';

    const resolved = resolveTrackYouTubeSource(track);
    const vid = resolved.videoId;
    if (!vid) {
      slot.textContent = `YT 매칭 없음: ${track?.title || 'Track'}`;
      return '';
    }

    const embedUrl = buildStandaloneYouTubeEmbedUrl(vid, { autoplay, startSec });
    const prevVid = widgetStore.standaloneYt.videoId;
    const prevStart = widgetStore.standaloneYt.startSec;

    widgetStore.standaloneYt.videoId = vid;
    widgetStore.standaloneYt.title = resolved.title;
    widgetStore.standaloneYt.playing = Boolean(autoplay);
    widgetStore.standaloneYt.startSec = Math.max(0, Math.floor(Number(startSec) || 0));
    widgetStore.standaloneYt.startedAtMs = autoplay ? Date.now() : 0;

    const existingIframe = slot.querySelector('iframe');
    if (
      existingIframe &&
      prevVid === vid &&
      Math.abs(prevStart - widgetStore.standaloneYt.startSec) < 2 &&
      existingIframe.getAttribute('src') &&
      existingIframe.getAttribute('src') !== 'about:blank'
    ) {
      return vid;
    }

    slot.innerHTML = `
      <iframe
        src="${embedUrl}"
        title="${safeEsc(resolved.title)}"
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen>
      </iframe>
    `;
    return vid;
  }

  function getExternalJukeboxMediaBridge() {
    const ytCandidates = [
      window.jukeboxYtPlayer,
      window.jbState?.ytPlayer,
      window.ytPlayer,
      window.jukeboxPlayer,
      window.player
    ].filter(p => p && typeof p.getCurrentTime === 'function');

    if (ytCandidates.length) {
      const yt = ytCandidates[0];
      return {
        type: 'youtube',
        isPlaying: () =>
          typeof yt.getPlayerState === 'function'
            ? yt.getPlayerState() === 1
            : Boolean(window.jbState?.isPlaying),
        getCurrentTime: () => Number(yt.getCurrentTime?.()) || 0,
        getDuration: () => Number(yt.getDuration?.()) || 0,
        play: () => {
          yt.playVideo?.();
          if (window.jbState) window.jbState.isPlaying = true;
        },
        pause: () => {
          yt.pauseVideo?.();
          if (window.jbState) window.jbState.isPlaying = false;
        },
        seekTo: sec => yt.seekTo?.(sec, true)
      };
    }

    const jukeboxWin = document.getElementById('win-jukebox');
    const htmlMedia = jukeboxWin?.querySelector('audio, video') || null;
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

  function emitPlaybackSync(reason = 'state') {
    const curTrack = widgetStore.cdState.tracks[widgetStore.cdState.index] || DEFAULT_TRACKS[0];
    const detail = {
      source: 'win95-widgets',
      reason,
      track: { ...curTrack },
      isPlaying: Boolean(widgetStore.cdState.playing),
      timerSec: Math.max(0, Math.floor(Number(widgetStore.cdState.elapsedSec) || 0)),
      durationSec: Math.max(1, Math.floor(Number(curTrack.durationSec) || 225))
    };
    try {
      window.dispatchEvent(new CustomEvent('widgets:playback', { detail }));
    } catch {}
  }

  function playTrackStandaloneYouTube(track, { autoPlay = true, startSec = 0 } = {}) {
    const resolved = resolveTrackYouTubeSource(track);
    widgetStore.cdState.tracks[widgetStore.cdState.index] = {
      ...(widgetStore.cdState.tracks[widgetStore.cdState.index] || {}),
      ...resolved
    };
    widgetStore.cdState.elapsedSec = Math.max(0, Math.floor(Number(startSec) || 0));
    widgetStore.cdState.playing = Boolean(autoPlay);
    widgetStore.cdState.syncStatus = autoPlay
      ? `단독 YT 재생 중 (${resolved.videoId})`
      : `단독 YT 일시정지 (${resolved.videoId})`;

    renderCdPlayerUI();
    renderStandaloneYouTubePlayer(resolved, {
      autoplay: Boolean(autoPlay),
      startSec: widgetStore.cdState.elapsedSec
    });

    const bridge = getExternalJukeboxMediaBridge();
    if (bridge) {
      try {
        if (autoPlay) bridge.play();
        else bridge.pause();
      } catch {}
    }

    emitPlaybackSync(autoPlay ? 'play' : 'pause');
    return resolved;
  }

  function pauseStandaloneYouTube() {
    widgetStore.cdState.playing = false;
    widgetStore.cdState.syncStatus = '단독 YT 일시정지';
    widgetStore.standaloneYt.playing = false;
    widgetStore.standaloneYt.startSec = widgetStore.cdState.elapsedSec;
    widgetStore.standaloneYt.startedAtMs = 0;

    const win = widgetStore.widgets.get('widget-cd-player');
    const slot = win?.querySelector('#w95-cd-yt-slot');
    const iframe = slot?.querySelector('iframe');
    if (iframe) {
      iframe.setAttribute('src', 'about:blank');
    }

    const bridge = getExternalJukeboxMediaBridge();
    if (bridge) {
      try { bridge.pause(); } catch {}
    }

    renderCdPlayerUI();
    emitPlaybackSync('pause');
  }

  function bindPlaybackSyncEvents() {
    if (window.__win95PlaybackSyncBound) return;
    window.__win95PlaybackSyncBound = true;

    window.addEventListener('jukebox:sync', e => {
      const detail = e?.detail || {};
      if (detail.source === 'win95-widgets') return;

      if (detail.type === 'playlist') {
        syncTracksFromArchive();
        renderCdPlayerUI();
        renderMoodMusicUI();
        return;
      }

      if (detail.track && detail.track.title) {
        syncTracksFromArchive();
        const resolved = resolveTrackYouTubeSource(detail.track);
        const foundIdx = widgetStore.cdState.tracks.findIndex(
          t =>
            t.title.toLowerCase() === String(resolved.title).toLowerCase() &&
            t.creator.toLowerCase() === String(resolved.creator || '').toLowerCase()
        );
        if (foundIdx >= 0) {
          widgetStore.cdState.tracks[foundIdx] = {
            ...widgetStore.cdState.tracks[foundIdx],
            ...resolved
          };
          widgetStore.cdState.index = foundIdx;
        } else {
          widgetStore.cdState.tracks.unshift(resolved);
          widgetStore.cdState.index = 0;
        }
      }

      if (typeof detail.isPlaying === 'boolean') {
        widgetStore.cdState.playing = detail.isPlaying;
      }
      if (typeof detail.timerSec === 'number') {
        widgetStore.cdState.elapsedSec = Math.max(0, Math.floor(detail.timerSec));
      }

      widgetStore.cdState.syncStatus = widgetStore.cdState.playing
        ? '주크박스 상태 동기화 (재생 중)'
        : '주크박스 상태 동기화 (정지/대기)';
      renderCdPlayerUI();
    });

    window.addEventListener('window:closed', e => {
      const closedId = e?.detail?.id;
      if (closedId === 'win-jukebox') {
        const curTrack = widgetStore.cdState.tracks[widgetStore.cdState.index];
        if (widgetStore.cdState.playing && curTrack) {
          playTrackStandaloneYouTube(curTrack, {
            autoPlay: true,
            startSec: widgetStore.cdState.elapsedSec
          });
        } else {
          widgetStore.cdState.syncStatus = '단독 YT 준비됨';
          renderCdPlayerUI();
        }
      }
    });
  }

  // ------------------------------------------------------------
  // 2. CD Player 위젯 (주크박스 독립 유튜브 재생 + 상태 동기화)
  // ------------------------------------------------------------
  function syncTracksFromArchive() {
    const merged = [];
    const seen = new Set();

    const pushTrack = (raw, fallbackIdx = 0) => {
      if (!raw || !raw.title) return;
      const title = String(raw.title).trim();
      const creator = String(raw.creator || raw.artist || 'Unknown Artist').trim();
      const sourceUrl = String(raw.sourceUrl || raw.url || raw.youtubeUrl || '').trim();
      const videoId = extractYouTubeVideoId(raw.videoId || sourceUrl);
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
        coverUrl: resolveCoverUrl(raw.coverUrl, sourceUrl, videoId),
        durationSec: Number(raw.durationSec) || 225,
        videoId,
        sourceUrl
      });
    };

    if (Array.isArray(window.jukeboxPlaylist)) {
      window.jukeboxPlaylist.forEach((it, idx) => pushTrack(it, idx));
    }

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

    const sourceUrl = String(track.sourceUrl || '').trim();
    const videoId = extractYouTubeVideoId(track.videoId || sourceUrl);
    const normalized = {
      id: track.id || `mood-${Date.now()}`,
      title: String(track.title),
      creator: String(track.creator || 'Unknown Artist'),
      genre: String(track.genre || '음악'),
      rating: Number(track.rating) || 4,
      review: String(track.review || ''),
      coverUrl: resolveCoverUrl(track.coverUrl, sourceUrl, videoId),
      durationSec: Number(track.durationSec) || 225,
      videoId,
      sourceUrl
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

    playTrackStandaloneYouTube(normalized, {
      autoPlay: Boolean(autoPlay),
      startSec: 0
    });
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
    const slotEl = win.querySelector('#w95-cd-yt-slot');

    if (artEl) {
      const targetArt = resolveCoverUrl(track.coverUrl, track.sourceUrl, track.videoId);
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
    if (syncEl) syncEl.textContent = syncStatus;
    if (curEl) curEl.textContent = formatMMSS(elapsedSec);
    if (durEl) durEl.textContent = formatMMSS(track.durationSec);
    if (fillEl) fillEl.style.width = `${(ratio * 100).toFixed(1)}%`;
    if (thumbEl) thumbEl.style.left = `${(ratio * 100).toFixed(1)}%`;
    if (playBtn) {
      playBtn.textContent = playing ? '❚❚' : '▶';
      playBtn.classList.toggle('pressed', playing);
    }
    if (slotEl && !playing && !slotEl.querySelector('iframe')) {
      const preview = resolveTrackYouTubeSource(track);
      slotEl.textContent = preview.videoId
        ? `YT READY: ${preview.videoId} (▶ 눌러 재생)`
        : 'YT 음원 준비됨';
    }
  }

  function startCdTick() {
    if (widgetStore.cdTimer) clearInterval(widgetStore.cdTimer);
    widgetStore.cdTimer = setInterval(() => {
      const bridge = getExternalJukeboxMediaBridge();
      const curTrack =
        widgetStore.cdState.tracks[widgetStore.cdState.index] || DEFAULT_TRACKS[0];

      if (bridge && bridge.isPlaying()) {
        const realDur = bridge.getDuration();
        const realCur = bridge.getCurrentTime();
        if (realDur > 0) curTrack.durationSec = Math.floor(realDur);
        if (realCur >= 0) widgetStore.cdState.elapsedSec = Math.floor(realCur);
        widgetStore.cdState.playing = true;
        widgetStore.cdState.syncStatus = '주크박스 실시간 동기화 중';
        renderCdPlayerUI();
        return;
      }

      if (!widgetStore.cdState.playing) return;
      widgetStore.cdState.elapsedSec += 1;
      if (widgetStore.cdState.elapsedSec >= curTrack.durationSec) {
        const len = widgetStore.cdState.tracks.length || 1;
        widgetStore.cdState.index = (widgetStore.cdState.index + 1) % len;
        playTrackStandaloneYouTube(widgetStore.cdState.tracks[widgetStore.cdState.index], {
          autoPlay: true,
          startSec: 0
        });
        return;
      }
      renderCdPlayerUI();
    }, 1000);
  }

  function openCdPlayerWidget() {
    bindPlaybackSyncEvents();
    syncTracksFromArchive();
    const cdIcon = `
      <svg width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">
        <circle cx="8" cy="8" r="6" fill="#e0e0e0" stroke="#111111" stroke-width="1.5"/>
        <circle cx="8" cy="8" r="2" fill="#48dbfb" stroke="#111111" stroke-width="1"/>
      </svg>`;

    const el = createWidgetShell({
      id: 'widget-cd-player',
      title: 'CD Player (Standalone YT + Sync)',
      iconSvg: cdIcon,
      width: 288,
      defaultLeft: 120,
      defaultTop: 72,
      bodyHtml: `
        <div class="w95-cd-top">
          <img id="w95-cd-art" class="w95-cd-art" src="${FALLBACK_ALBUM_ART}" alt="Album Cover" />
          <div class="w95-cd-meta">
            <div id="w95-cd-artist" class="w95-cd-artist">-</div>
            <div id="w95-cd-title" class="w95-cd-track">-</div>
            <div id="w95-cd-sync-tag" class="w95-cd-sync-tag">단독 YT 준비됨</div>
          </div>
        </div>
        <div id="w95-cd-yt-slot" class="w95-cd-yt-slot">YT 음원 준비됨</div>
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
        const curTrack =
          widgetStore.cdState.tracks[widgetStore.cdState.index] || DEFAULT_TRACKS[0];
        if (!widgetStore.cdState.playing) {
          playTrackStandaloneYouTube(curTrack, {
            autoPlay: true,
            startSec: widgetStore.cdState.elapsedSec
          });
        } else {
          pauseStandaloneYouTube();
        }
      });

      el.querySelector('#w95-cd-prev')?.addEventListener('click', () => {
        beep('click');
        const len = widgetStore.cdState.tracks.length || 1;
        widgetStore.cdState.index = (widgetStore.cdState.index - 1 + len) % len;
        playTrackStandaloneYouTube(widgetStore.cdState.tracks[widgetStore.cdState.index], {
          autoPlay: true,
          startSec: 0
        });
      });

      el.querySelector('#w95-cd-next')?.addEventListener('click', () => {
        beep('click');
        const len = widgetStore.cdState.tracks.length || 1;
        widgetStore.cdState.index = (widgetStore.cdState.index + 1) % len;
        playTrackStandaloneYouTube(widgetStore.cdState.tracks[widgetStore.cdState.index], {
          autoPlay: true,
          startSec: 0
        });
      });

      el.querySelector('#w95-cd-open-jb')?.addEventListener('click', () => {
        beep('open');
        if (typeof window.openWindow === 'function') {
          window.openWindow('win-jukebox');
        }
        emitPlaybackSync('open-jukebox');
      });

      el.querySelector('#w95-cd-bar')?.addEventListener('click', e => {
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        const curTrack =
          widgetStore.cdState.tracks[widgetStore.cdState.index] || DEFAULT_TRACKS[0];
        const nextSec = Math.floor(ratio * curTrack.durationSec);
        beep('click');
        if (widgetStore.cdState.playing) {
          playTrackStandaloneYouTube(curTrack, {
            autoPlay: true,
            startSec: nextSec
          });
        } else {
          widgetStore.cdState.elapsedSec = nextSec;
          renderCdPlayerUI();
          emitPlaybackSync('seek');
        }
      });
    }

    renderCdPlayerUI();
  }

  // ------------------------------------------------------------
  // 3. 로컬 AI 기분별 음악 추천 엔진 & 위젯 + '회색소음' 다중 팝업
  // ------------------------------------------------------------
  function pickRandomGrayNoiseItem() {
    const pool = GRAY_NOISE_POOL;
    const candidates =
      pool.length > 1
        ? pool.filter(it => it.id !== widgetStore.grayNoise.lastId)
        : pool;
    const chosen = candidates[Math.floor(Math.random() * candidates.length)] || pool[0];
    widgetStore.grayNoise.lastId = chosen.id;
    widgetStore.grayNoise.current = chosen;
    return chosen;
  }

  function buildGrayNoiseEmbedUrl(videoId) {
    const params = new URLSearchParams({
      autoplay: '1',
      rel: '0',
      playsinline: '1',
      vq: 'large'
    });
    return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
  }

  function openGrayNoiseEasterEgg(spawnNew = false) {
    beep('open');
    const item = pickRandomGrayNoiseItem();
    const vid = extractYouTubeVideoId(item.sourceUrl || item.videoId) || 'vvbGUFe18ig';
    const embedUrl = buildGrayNoiseEmbedUrl(vid);

    const winWidth = 320;
    const estWinHeight = 236;
    const isExtraWindow = Boolean(spawnNew);
    const seqNum = isExtraWindow ? ++widgetStore.grayNoise.spawnSeq : 0;
    const widgetId = isExtraWindow
      ? `widget-gray-noise-popup-${seqNum}`
      : 'widget-gray-noise-popup';

    const pos = isExtraWindow
      ? getSafeRandomWidgetPos(winWidth, estWinHeight)
      : clampWidgetPos(
          Math.min(Math.max(24, (window.innerWidth || 1024) - 348), 460),
          110,
          winWidth,
          estWinHeight
        );

    const noiseIcon = `
      <svg width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">
        <rect x="2" y="2" width="12" height="12" fill="#808080" stroke="#111111" stroke-width="1.5"/>
        <path fill="#ffd83b" d="M5 5h6v2H8v4H6V7H5V5z"/>
      </svg>`;

    const titleText = isExtraWindow
      ? `GRAY NOISE #${seqNum} — ${item.tag}`
      : `GRAY NOISE — ${item.tag}`;

    const el = createWidgetShell({
      id: widgetId,
      title: titleText,
      iconSvg: noiseIcon,
      width: winWidth,
      defaultLeft: pos.left,
      defaultTop: pos.top,
      persistPosition: !isExtraWindow,
      destroyOnClose: isExtraWindow,
      bodyHtml: `
        <div style="background:#19191f;color:#d0d0d0;border:2px solid #111;padding:6px 8px;margin-bottom:8px;font-family:'Consolas',monospace;font-size:0.74rem;display:flex;justify-content:space-between;align-items:center;gap:6px;">
          <span class="w95-gn-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:900;color:#ffd83b;">${safeEsc(item.title)}</span>
          <span style="font-size:0.65rem;background:#333;padding:1px 5px;border:1px solid #777;flex-shrink:0;">${isExtraWindow ? `LAYER ${seqNum}` : 'BONUS'}</span>
        </div>
        <div class="w95-gn-frame" style="width:100%;aspect-ratio:16/9;background:#000;border:2px solid #111;overflow:hidden;margin-bottom:8px;">
          <iframe
            src="${embedUrl}"
            title="${safeEsc(item.title)}"
            style="width:100%;height:100%;border:0;display:block;"
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen>
          </iframe>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
          <button type="button" class="w95-mini-btn gray-noise w95-gn-reroll" style="flex:1;">다른 소음 랜덤 재생</button>
          <a class="w95-mini-btn w95-gn-ext" href="${safeEsc(item.sourceUrl)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;font-size:0.72rem;">YT 창</a>
        </div>
      `
    });

    if (!isExtraWindow) {
      const titleBarSpan = el.querySelector('.w95-w-title-left span');
      if (titleBarSpan) titleBarSpan.textContent = titleText;

      const titleEl = el.querySelector('.w95-gn-title');
      if (titleEl) titleEl.textContent = item.title;

      const extEl = el.querySelector('.w95-gn-ext');
      if (extEl) extEl.setAttribute('href', item.sourceUrl);

      const frameEl = el.querySelector('.w95-gn-frame');
      if (frameEl) {
        frameEl.innerHTML = `
          <iframe
            src="${embedUrl}"
            title="${safeEsc(item.title)}"
            style="width:100%;height:100%;border:0;display:block;"
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen>
          </iframe>
        `;
      }
    }

    if (!el.dataset.gnBound) {
      el.dataset.gnBound = 'true';
      el.querySelector('.w95-gn-reroll')?.addEventListener('click', () => {
        openGrayNoiseEasterEgg(true);
      });
    }
  }

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
          const videoId = extractYouTubeVideoId(it.videoId || sourceUrl);
          pool.push({
            id: it.id || `arc-m-${idx}`,
            title: String(it.title),
            creator: String(it.creator || 'Unknown Artist'),
            genre: String(it.genre || '음악'),
            rating: Number(it.rating) || 4,
            review: String(it.review || ''),
            coverUrl: resolveCoverUrl(it.coverUrl, sourceUrl, videoId),
            durationSec: Number(it.durationSec) || 225,
            videoId,
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
      if (item.sourceUrl || item.videoId) score += 1.0;

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

    const resolvedTop = resolveTrackYouTubeSource(top.item);
    widgetStore.moodState.lastPickedKey = `${top.item.id}|${top.item.title}`;
    widgetStore.moodState.currentRec = {
      ...resolvedTop,
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
      artEl.src = resolveCoverUrl(rec.coverUrl, rec.sourceUrl, rec.videoId);
      artEl.onerror = () => {
        artEl.onerror = null;
        artEl.src = FALLBACK_ALBUM_ART;
      };
    }
    if (titleEl) titleEl.textContent = rec.title;
    if (artistEl) artistEl.textContent = `${rec.creator} · ${rec.genre || '음악'}`;
    if (reasonEl) {
      const ytFlag = rec.videoId ? `YT ${rec.videoId} 단독재생` : 'YT 자동매칭';
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
      width: 288,
      defaultLeft: 120,
      defaultTop: 310,
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
        <div style="display:grid;grid-template-columns:1fr 1.25fr;gap:6px;margin-bottom:6px;">
          <button type="button" class="w95-mini-btn" id="w95-mood-reroll">다른 곡 추천</button>
          <button type="button" class="w95-mini-btn active" id="w95-mood-play">▶ 유튜브 재생</button>
        </div>
        <button type="button" class="w95-mini-btn gray-noise" id="w95-mood-gray-noise" style="width:100%;" title="그라인더·톱·망치질 랜덤 소음 팝업">회색소음</button>
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

      el.querySelector('#w95-mood-gray-noise')?.addEventListener('click', () => {
        openGrayNoiseEasterEgg(false);
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
      defaultLeft: 420,
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

  // ------------------------------------------------------------
  // 5. 옛날 캘린더(Calendar 95) 위젯
  // ------------------------------------------------------------
  function renderCalendarUI() {
    const win = widgetStore.widgets.get('widget-calendar');
    if (!win) return;

    const { year, month, selectedDay } = widgetStore.calState;
    const now = new Date();
    const isSameYearMonth = now.getFullYear() === year && now.getMonth() === month;
    const todayDate = now.getDate();

    const titleEl = win.querySelector('#w95-cal-ym');
    const gridEl = win.querySelector('#w95-cal-grid');
    const infoEl = win.querySelector('#w95-cal-selected');

    if (titleEl) {
      titleEl.textContent = `${year}.${String(month + 1).padStart(2, '0')}`;
    }

    if (gridEl) {
      const firstDow = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const dows = ['일', '월', '화', '수', '목', '금', '토'];

      let html = dows
        .map((d, idx) => {
          const cls = idx === 0 ? 'sun' : idx === 6 ? 'sat' : '';
          return `<div class="w95-cal-dow ${cls}">${d}</div>`;
        })
        .join('');

      for (let i = 0; i < firstDow; i++) {
        html += `<div class="w95-cal-day empty"></div>`;
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const dow = (firstDow + day - 1) % 7;
        const classes = ['w95-cal-day'];
        if (dow === 0) classes.push('sun');
        if (dow === 6) classes.push('sat');
        if (isSameYearMonth && day === todayDate) classes.push('today');
        if (day === selectedDay) classes.push('selected');
        html += `<div class="${classes.join(' ')}" data-cal-day="${day}">${day}</div>`;
      }

      gridEl.innerHTML = html;
      gridEl.querySelectorAll('[data-cal-day]').forEach(cell => {
        cell.addEventListener('click', () => {
          beep('click');
          widgetStore.calState.selectedDay = Number(cell.dataset.calDay) || 1;
          renderCalendarUI();
        });
      });
    }

    if (infoEl) {
      const selDateObj = new Date(year, month, selectedDay || 1);
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      infoEl.textContent = `${year}-${String(month + 1).padStart(2, '0')}-${String(
        selectedDay || 1
      ).padStart(2, '0')} (${dayNames[selDateObj.getDay()]})`;
    }
  }

  function openCalendarWidget() {
    const calIcon = `
      <svg width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">
        <rect x="2" y="3" width="12" height="11" fill="#ffffff" stroke="#111111" stroke-width="1.5"/>
        <rect x="2" y="3" width="12" height="3" fill="#000080"/>
      </svg>`;

    const el = createWidgetShell({
      id: 'widget-calendar',
      title: 'Calendar 95',
      iconSvg: calIcon,
      width: 226,
      defaultLeft: 420,
      defaultTop: 176,
      bodyHtml: `
        <div class="w95-cal-header">
          <button type="button" class="w95-cal-nav-btn" id="w95-cal-prev" title="이전 달">◀</button>
          <span id="w95-cal-ym">----.--</span>
          <button type="button" class="w95-cal-nav-btn" id="w95-cal-next" title="다음 달">▶</button>
        </div>
        <div id="w95-cal-grid" class="w95-cal-grid"></div>
        <div class="w95-cal-footer">
          <span id="w95-cal-selected">----.--.--</span>
          <button type="button" class="w95-cal-nav-btn" id="w95-cal-today">오늘</button>
        </div>
      `
    });

    if (!el.dataset.calBound) {
      el.dataset.calBound = 'true';

      el.querySelector('#w95-cal-prev')?.addEventListener('click', () => {
        beep('click');
        if (widgetStore.calState.month === 0) {
          widgetStore.calState.year -= 1;
          widgetStore.calState.month = 11;
        } else {
          widgetStore.calState.month -= 1;
        }
        const maxDay = new Date(widgetStore.calState.year, widgetStore.calState.month + 1, 0).getDate();
        widgetStore.calState.selectedDay = Math.min(widgetStore.calState.selectedDay || 1, maxDay);
        renderCalendarUI();
      });

      el.querySelector('#w95-cal-next')?.addEventListener('click', () => {
        beep('click');
        if (widgetStore.calState.month === 11) {
          widgetStore.calState.year += 1;
          widgetStore.calState.month = 0;
        } else {
          widgetStore.calState.month += 1;
        }
        const maxDay = new Date(widgetStore.calState.year, widgetStore.calState.month + 1, 0).getDate();
        widgetStore.calState.selectedDay = Math.min(widgetStore.calState.selectedDay || 1, maxDay);
        renderCalendarUI();
      });

      el.querySelector('#w95-cal-today')?.addEventListener('click', () => {
        beep('click');
        const now = new Date();
        widgetStore.calState.year = now.getFullYear();
        widgetStore.calState.month = now.getMonth();
        widgetStore.calState.selectedDay = now.getDate();
        renderCalendarUI();
      });
    }

    renderCalendarUI();
  }

  function handleWidgetViewportResize() {
    syncWidgetViewportVars();
    widgetStore.widgets.forEach((el, id) => {
      if (!el || el.classList.contains('hidden')) return;
      const rect = el.getBoundingClientRect();
      const clamped = clampWidgetPos(
        rect.left,
        rect.top,
        el.offsetWidth || 260,
        el.offsetHeight || 180
      );
      el.style.width = `${clamped.width}px`;
      el.style.left = `${clamped.left}px`;
      el.style.top = `${clamped.top}px`;
      if (!id.startsWith('widget-gray-noise-popup-')) {
        saveWidgetPosition(id, clamped.left, clamped.top, true);
      }
    });
  }

  window.addEventListener('resize', handleWidgetViewportResize, { passive: true });
  window.addEventListener('orientationchange', handleWidgetViewportResize, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleWidgetViewportResize, { passive: true });
  }

  window.addEventListener('DOMContentLoaded', () => {
    ensureWidgetStyles();
    syncWidgetViewportVars();
    bindPlaybackSyncEvents();
    const saved = loadSavedWidgetPositions();
    if (saved['widget-cd-player']?.open) openCdPlayerWidget();
    if (saved['widget-clock']?.open) openClockWidget();
    if (saved['widget-calendar']?.open) openCalendarWidget();
    if (saved['widget-mood-music']?.open) openMoodMusicWidget();
  });

  window.Win95Widgets = {
    open: openCdPlayerWidget,
    openCdPlayer: openCdPlayerWidget,
    openClock: openClockWidget,
    openCalendar: openCalendarWidget,
    openMoodMusic: openMoodMusicWidget,
    openGrayNoise: openGrayNoiseEasterEgg,
    recommendMoodMusic: recommendMusicLocally,
    loadTrackToCd: loadAndPlayTrackInCd,
    playStandaloneYouTube: playTrackStandaloneYouTube,
    pauseStandaloneYouTube,
    emitPlaybackSync,
    searchYouTube: trackOrQuery => {
      const resolved =
        typeof trackOrQuery === 'string'
          ? resolveTrackYouTubeSource({ title: trackOrQuery, creator: '' })
          : resolveTrackYouTubeSource(trackOrQuery);
      openCdPlayerWidget();
      return renderStandaloneYouTubePlayer(resolved, { autoplay: true, startSec: 0 });
    },
    create: createWidgetShell,
    syncTracks: () => {
      syncTracksFromArchive();
      renderCdPlayerUI();
      renderMoodMusicUI();
    }
  };
})();

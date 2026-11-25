// ============================================================
// MY-ARCHIVE 95 OS — WINAMP / JUKEBOX 95.EXE
// (1995 Stereo Engine, YouTube Auto-Search, Player API & Widget Sync + Responsive Guard)
// ============================================================

window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
window.__MOD_VERSIONS.jukebox = 'v2026.11.26-480p-abr-widget-sync-responsive';

const JB_CACHE_KEY = 'myarchive95_yt_track_cache_v2';
const JB_RESPONSIVE_STYLE_ID = 'myarchive95-jukebox-responsive-style';
const JB_PREFERRED_MAX_QUALITY = 'large'; // 480p 이하 권장 힌트 (tiny:144p, small:240p, medium:360p, large:480p)
const JB_HIGH_QUALITIES = new Set(['hd720', 'hd1080', 'hd1440', 'highres']);

// 1995년 16x16 도트 픽셀 SVG 아이콘 (이모지 미사용)
const JUKEBOX_PIXEL_ICONS = {
  globe: `
    <svg class="pixel-svg-14" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true" style="vertical-align:-2px;">
      <path fill="#000000" d="M5 1h6v1h2v1h1v2h1v6h-1v2h-1v1h-2v1H5v-1H3v-1H2v-2H1V5h1V3h1V2h2V1z"/>
      <path fill="#0000ff" d="M5 2h6v1h2v2h1v6h-1v2h-2v1H5v-1H3v-2H2V5h1V3h2V2z"/>
      <path fill="#00ff00" d="M6 2h3v2H7v1H5V3h1V2zm4 3h3v3h-2v2H9V7h1V5zM3 7h3v3H5v2H3V7z"/>
      <path fill="#ffffff" d="M4 3h2v1H4V3z"/>
    </svg>`,
  search: `
    <svg class="pixel-svg-14" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true" style="vertical-align:-2px;">
      <path fill="#ffd83b" d="M4 1h5v1h2v2h1v5h-1v1h1v1h1v1h1v2h-2v-1h-1v-1h-1v-1H9v1H4v-1H2V9H1V4h1V2h2V1z"/>
      <path fill="#19191f" d="M4 3h5v1h1v5H9v1H4V9H3V4h1V3z"/>
    </svg>`
};

const JB_BUILTIN_FALLBACK_TRACKS = [
  {
    title: "Don't You (Forget About Me)",
    creator: 'Simple Minds',
    genre: '80s Synth Pop / Rock',
    videoId: 'CdqoNKCCt7A'
  },
  {
    title: 'Take On Me',
    creator: 'a-ha',
    genre: '80s Synth Pop',
    videoId: 'djV11Xbc914'
  },
  {
    title: 'lofi hip hop radio - beats to relax/study to',
    creator: 'Lofi Girl',
    genre: 'Lo-Fi / Study',
    videoId: 'jfKfPfyJRdk'
  },
  {
    title: 'Walking On Sunshine',
    creator: 'Katrina & The Waves',
    genre: 'Pop Rock',
    videoId: 'iPUmE-tne5U'
  },
  {
    title: 'Sunday Morning',
    creator: 'Maroon 5',
    genre: 'Soul Pop',
    videoId: 'S2Cti12XBw4'
  },
  {
    title: 'Fix You',
    creator: 'Coldplay',
    genre: 'Alternative Ballad',
    videoId: 'k4V3Mo61fJM'
  },
  {
    title: 'Yellow',
    creator: 'Coldplay',
    genre: 'Alternative Rock',
    videoId: 'yKNxeF4KMsY'
  },
  {
    title: 'Clair de Lune',
    creator: 'Claude Debussy',
    genre: 'Classical / Ambient',
    videoId: 'CvFH_6DNRCY'
  },
  {
    title: 'synthwave radio - beats to chill/game to',
    creator: 'Lofi Girl Synthwave',
    genre: 'Synthwave / Focus',
    videoId: '4xDzrJKXOOY'
  },
  {
    title: 'Your Hand In Mine',
    creator: 'Explosions In The Sky',
    genre: 'Post-Rock',
    videoId: 'cdiY6kijYHE'
  }
];

const jbState = {
  playlist: [],
  currentIndex: 0,
  isPlaying: false,
  isShuffle: false,
  isRepeatOne: false,
  musicOnly: true,
  hideVideo: false,
  candidates: [],
  candidateIdx: 0,
  timerSec: 0,
  timerInterval: null,
  sleepEndAt: 0,
  abortCtrl: null,
  ytPlayer: null,
  ytIframeId: 'jb-yt-player-iframe'
};

window.jbState = jbState;
window.jukeboxPlaylist = jbState.playlist;

function applyJukeboxResponsiveStyle() {
  if (document.getElementById(JB_RESPONSIVE_STYLE_ID)) return;
  const parent = document.head || document.documentElement;
  if (!parent) return;

  const style = document.createElement('style');
  style.id = JB_RESPONSIVE_STYLE_ID;
  style.textContent = `
    #win-jukebox .jb-lcd-grid {
      display: grid;
      grid-template-columns: 112px minmax(0, 1fr);
      gap: 10px;
      align-items: center;
    }
    #win-jukebox .jb-ctrl-row {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-bottom: 8px;
      align-items: center;
    }
    #win-jukebox .jb-url-row {
      display: flex;
      gap: 5px;
      flex-wrap: wrap;
      align-items: center;
    }
    #win-jukebox .jb-track-row {
      min-width: 0;
    }
    #win-jukebox .jb-track-row > div {
      min-width: 0;
      flex: 1;
    }
    @media (max-width: 768px) {
      #win-jukebox .jb-lcd-grid {
        grid-template-columns: minmax(0, 1fr) !important;
        gap: 8px !important;
      }
      #win-jukebox .jb-lcd-box {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        text-align: left !important;
      }
      #win-jukebox #jb-lcd-time {
        font-size: 1.15rem !important;
      }
      #win-jukebox #jb-eq-bars {
        margin-top: 0 !important;
        height: 20px !important;
      }
      #win-jukebox #jb-player-frame-wrap {
        max-height: 150px !important;
      }
      #win-jukebox #jb-playlist-box {
        max-height: 145px !important;
      }
    }
    @media (max-width: 480px) {
      #win-jukebox .jb-ctrl-row .btn95 {
        flex: 1 1 calc(50% - 5px);
        justify-content: center;
        text-align: center;
      }
      #win-jukebox .jb-url-row > input {
        flex: 1 1 100% !important;
        min-width: 0 !important;
      }
      #win-jukebox .jb-url-row > button {
        flex: 1 1 auto;
      }
    }
  `;
  parent.appendChild(style);
}

function safeJbEsc(str) {
  if (typeof window.esc === 'function') return window.esc(str);
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resolveGasApiUrl() {
  if (typeof GAS_WEB_APP_URL !== 'undefined' && GAS_WEB_APP_URL) return String(GAS_WEB_APP_URL).trim();
  if (window.GAS_WEB_APP_URL) return String(window.GAS_WEB_APP_URL).trim();
  if (window.CONFIG?.GAS_WEB_APP_URL) return String(window.CONFIG.GAS_WEB_APP_URL).trim();
  return '';
}

function getJbCache() {
  try {
    return JSON.parse(localStorage.getItem(JB_CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

function setJbCache(map) {
  try {
    localStorage.setItem(JB_CACHE_KEY, JSON.stringify(map));
  } catch {}
}

function parseYtIdFromUrl(url) {
  const s = String(url || '').trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i);
  return m ? m[1] : '';
}

function getTrackCacheKey(item) {
  return `${String(item?.creator || '').trim().toLowerCase()}|${String(item?.title || '').trim().toLowerCase()}`;
}

function normalizeYtCandidateList(rawList, fallbackQuery = '') {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .filter(v => v && v.videoId)
    .map(v => ({
      videoId: String(v.videoId).trim(),
      title: String(v.title || fallbackQuery || 'YouTube Audio').trim(),
      channel: String(v.channel || v.creator || v.author || 'YouTube').trim(),
      sourceUrl: String(v.sourceUrl || v.url || `https://www.youtube.com/watch?v=${v.videoId}`).trim()
    }));
}

function findFallbackYouTubeCandidates(track) {
  const titleLower = String(track?.title || '').toLowerCase();
  const creatorLower = String(track?.creator || '').toLowerCase();
  const genreLower = String(track?.genre || '').toLowerCase();
  const tokens = `${titleLower} ${creatorLower} ${genreLower}`
    .split(/[\s,./!?;:()\-]+/)
    .map(t => t.trim())
    .filter(t => t.length >= 2);

  const scored = JB_BUILTIN_FALLBACK_TRACKS.map(item => {
    const hay = `${item.title} ${item.creator} ${item.genre}`.toLowerCase();
    let score = 0;
    if (titleLower && item.title.toLowerCase().includes(titleLower)) score += 12;
    if (creatorLower && item.creator.toLowerCase().includes(creatorLower)) score += 8;
    for (const tok of tokens) {
      if (hay.includes(tok)) score += 3;
    }
    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const topMatches = scored
    .filter(s => s.score > 0)
    .slice(0, 3)
    .map(s => s.item);

  const pool = topMatches.length ? topMatches : JB_BUILTIN_FALLBACK_TRACKS.slice(0, 3);
  return pool.map((entry, idx) => ({
    videoId: entry.videoId,
    title: idx === 0 && topMatches.length
      ? `${track.title || entry.title} (${entry.title})`
      : `${entry.title} — ${entry.creator}`,
    channel: entry.creator,
    sourceUrl: `https://www.youtube.com/watch?v=${entry.videoId}`
  }));
}

function emitJukeboxSyncEvent(type = 'state') {
  const track = jbState.playlist[jbState.currentIndex] || null;
  window.jukeboxPlaylist = jbState.playlist;
  window.jukeboxYtPlayer = jbState.ytPlayer;
  window.dispatchEvent(
    new CustomEvent('jukebox:sync', {
      detail: {
        source: 'jukebox-95',
        type,
        track,
        index: jbState.currentIndex,
        isPlaying: jbState.isPlaying,
        timerSec: jbState.timerSec
      }
    })
  );
}

// 대역폭에 맞춰 480p 이하가 유지되도록 권장 화질 힌트 적용
function applyLowBandwidthQualityHint(player, forceCapIfHigh = false) {
  if (!player) return;
  try {
    const currentQuality = typeof player.getPlaybackQuality === 'function'
      ? String(player.getPlaybackQuality() || '').toLowerCase()
      : '';
    const isHigh = JB_HIGH_QUALITIES.has(currentQuality);

    if ((forceCapIfHigh && isHigh) || !currentQuality || isHigh) {
      if (typeof player.setPlaybackQuality === 'function') {
        player.setPlaybackQuality(JB_PREFERRED_MAX_QUALITY);
      }
    }
  } catch {}
}

function buildJukeboxUI() {
  applyJukeboxResponsiveStyle();
  const win = document.getElementById('win-jukebox');
  if (!win) return;
  const body = win.querySelector('.win-body');
  if (!body || body.dataset.jbInitialized === 'true') return;
  body.dataset.jbInitialized = 'true';

  body.innerHTML = `
    <div style="background:#19191f; color:#39ff14; border:3px solid #111; padding:10px; box-shadow:inset 2px 2px 0 #000, inset -2px -2px 0 #444; margin-bottom:10px; font-family:var(--font-mono);">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; flex-wrap:wrap; font-size:0.72rem; color:#ffd83b; margin-bottom:6px; border-bottom:1px solid #333; padding-bottom:4px;">
        <span>WINAMP / JUKEBOX 95 — STEREO AUDIO ENGINE (&lt;=480P ABR)</span>
        <span id="jb-status-pill" style="background:#111; border:1px solid #39ff14; color:#39ff14; padding:1px 6px;">READY</span>
      </div>

      <div class="jb-lcd-grid">
        <div class="jb-lcd-box" style="background:#08120c; border:2px solid #333; padding:6px; text-align:center;">
          <div id="jb-lcd-time" style="font-size:1.35rem; font-weight:900; letter-spacing:1px; color:#39ff14;">00:00</div>
          <div id="jb-eq-bars" style="display:flex; align-items:flex-end; justify-content:center; gap:3px; height:26px; margin-top:6px;">
            ${Array.from({ length: 12 }).map((_, i) => `<span class="jb-bar" style="width:5px; height:${6 + (i % 4) * 4}px; background:#39ff14; display:inline-block; transition:height 0.15s;"></span>`).join('')}
          </div>
          <div style="font-size:0.65rem; color:#88cc99; margin-top:4px;">480P MAX · ABR</div>
        </div>

        <div style="min-width:0;">
          <div style="background:#08120c; border:1.5px solid #333; padding:5px 8px; overflow:hidden; white-space:nowrap; margin-bottom:6px;">
            <div id="jb-marquee-title" style="font-size:0.86rem; font-weight:900; color:#39ff14; overflow:hidden; text-overflow:ellipsis;">재생할 트랙을 선택하여 시작하십시오.</div>
          </div>
          <div id="jb-track-sub" style="font-size:0.74rem; color:#cccccc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:6px;">
            대기 중 · 내 아카이브 음악 라이브러리 및 위젯 동기화 연결됨
          </div>
          <div id="jb-review-ticker" style="font-size:0.74rem; color:#ffd83b; background:#101016; border:1px dashed #444; padding:4px 7px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            [MEMO] 감상 한줄평 메모가 이곳에 표시됩니다.
          </div>
        </div>
      </div>

      <!-- YouTube IFrame 플레이어 영역 -->
      <div id="jb-player-frame-wrap" style="margin-top:8px; background:#000; border:2px solid #333; position:relative; aspect-ratio:16/9; max-height:165px; width:100%; overflow:hidden;">
        <div id="jb-player-placeholder" style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#88cc99; font-size:0.8rem; gap:6px; padding:12px; text-align:center;">
          <span>하단 수록곡을 클릭하면 YouTube 음원/영상을 480p 이하로 불러옵니다.</span>
        </div>
      </div>

      <!-- 검색 후보 1~5번 전환 바 -->
      <div id="jb-cand-bar" style="display:none; margin-top:7px; padding-top:6px; border-top:1px dashed #333; align-items:center; justify-content:space-between; gap:6px; flex-wrap:wrap;">
        <span style="font-size:0.7rem; color:#ffd83b;">다른 스트림 버전 선택:</span>
        <div id="jb-cand-btns" style="display:flex; gap:4px; flex-wrap:wrap;"></div>
      </div>
    </div>

    <!-- Winamp 물리 컨트롤 버튼 -->
    <div class="jb-ctrl-row">
      <button type="button" class="btn95 sm" id="jb-btn-prev" title="이전 곡">|&lt; 이전</button>
      <button type="button" class="btn95 yellow sm" id="jb-btn-play" title="재생 / 일시정지">&gt; 재생</button>
      <button type="button" class="btn95 sm" id="jb-btn-stop" title="정지">[] 정지</button>
      <button type="button" class="btn95 sm" id="jb-btn-next" title="다음 곡">&gt;| 다음</button>
      <button type="button" class="btn95 sm" id="jb-btn-shuffle">[SHF] 셔플: OFF</button>
      <button type="button" class="btn95 sm" id="jb-btn-repeat">[RPT] 한곡반복: OFF</button>
      <button type="button" class="btn95 sky sm" id="jb-btn-toggle-vid">화면 접기</button>
    </div>

    <!-- 직접 YouTube 링크 지정 & 가상 브라우저 연동 바 -->
    <div class="sunken-box" style="padding:7px 8px; margin-bottom:8px; background:var(--win-gray);">
      <div class="jb-url-row">
        <input type="text" id="jb-manual-yt-inp" placeholder="URL을 붙여넣어 현재 곡에 연결..." style="flex:1; min-width:160px; font-size:0.76rem;" />
        <button type="button" class="btn95 green sm" id="jb-btn-bind-yt">링크 연결·재생</button>
        <button type="button" class="btn95 pink sm" id="jb-btn-open-browser">${JUKEBOX_PIXEL_ICONS.globe} 탐색기 95에서 찾기</button>
      </div>
    </div>

    <!-- 재생목록 (Playlist Editor) -->
    <div class="sunken-box" style="padding:8px;">
      <div class="box-head" style="margin-bottom:6px; flex-wrap:wrap; gap:6px;">
        <span>PLAYLIST — 수록곡 목록 (<span id="jb-count-num">0</span>곡)</span>
        <div style="display:flex; gap:4px;">
          <button type="button" class="btn95 sm yellow" id="jb-filter-music" style="padding:2px 7px; font-size:0.72rem;">음악만</button>
          <button type="button" class="btn95 sm" id="jb-filter-all" style="padding:2px 7px; font-size:0.72rem;">전체보관함</button>
        </div>
      </div>
      <div id="jb-playlist-box" style="max-height:175px; overflow-y:auto; display:flex; flex-direction:column; gap:4px;"></div>
    </div>
  `;

  bindJukeboxControls();
}

function getNextPlaylistIndex() {
  if (!jbState.playlist.length) return 0;
  if (jbState.isRepeatOne) return jbState.currentIndex;
  if (jbState.isShuffle && jbState.playlist.length > 1) {
    let nextIdx = jbState.currentIndex;
    while (nextIdx === jbState.currentIndex) {
      nextIdx = Math.floor(Math.random() * jbState.playlist.length);
    }
    return nextIdx;
  }
  return (jbState.currentIndex + 1) % jbState.playlist.length;
}

function bindJukeboxControls() {
  document.getElementById('jb-btn-prev')?.addEventListener('click', () => {
    if (!jbState.playlist.length) return;
    if (typeof playRetroTone === 'function') playRetroTone('click');
    jbState.currentIndex = (jbState.currentIndex - 1 + jbState.playlist.length) % jbState.playlist.length;
    playJukeboxTrack(jbState.currentIndex);
  });

  document.getElementById('jb-btn-next')?.addEventListener('click', () => {
    if (!jbState.playlist.length) return;
    if (typeof playRetroTone === 'function') playRetroTone('click');
    jbState.currentIndex = getNextPlaylistIndex();
    playJukeboxTrack(jbState.currentIndex);
  });

  document.getElementById('jb-btn-play')?.addEventListener('click', () => {
    if (!jbState.playlist.length) return;
    if (typeof playRetroTone === 'function') playRetroTone('click');
    if (jbState.isPlaying && jbState.ytPlayer && typeof jbState.ytPlayer.pauseVideo === 'function') {
      try {
        jbState.ytPlayer.pauseVideo();
        stopJukeboxTimer();
        const pill = document.getElementById('jb-status-pill');
        if (pill) pill.textContent = 'PAUSED';
        return;
      } catch {}
    }
    playJukeboxTrack(jbState.currentIndex);
  });

  document.getElementById('jb-btn-stop')?.addEventListener('click', () => {
    if (typeof playRetroTone === 'function') playRetroTone('close');
    stopJukeboxPlayback();
  });

  document.getElementById('jb-btn-shuffle')?.addEventListener('click', e => {
    jbState.isShuffle = !jbState.isShuffle;
    e.currentTarget.textContent = `[SHF] 셔플: ${jbState.isShuffle ? 'ON' : 'OFF'}`;
    e.currentTarget.classList.toggle('yellow', jbState.isShuffle);
    if (typeof playRetroTone === 'function') playRetroTone('click');
    emitJukeboxSyncEvent('mode');
  });

  document.getElementById('jb-btn-repeat')?.addEventListener('click', e => {
    jbState.isRepeatOne = !jbState.isRepeatOne;
    e.currentTarget.textContent = `[RPT] 한곡반복: ${jbState.isRepeatOne ? 'ON' : 'OFF'}`;
    e.currentTarget.classList.toggle('yellow', jbState.isRepeatOne);
    if (typeof playRetroTone === 'function') playRetroTone('click');
    emitJukeboxSyncEvent('mode');
  });

  document.getElementById('jb-btn-toggle-vid')?.addEventListener('click', e => {
    jbState.hideVideo = !jbState.hideVideo;
    const wrap = document.getElementById('jb-player-frame-wrap');
    if (wrap) {
      wrap.style.maxHeight = jbState.hideVideo ? '42px' : '165px';
    }
    e.currentTarget.textContent = jbState.hideVideo ? '화면 펼치기' : '화면 접기';
    if (typeof playRetroTone === 'function') playRetroTone('click');
  });

  document.getElementById('jb-filter-music')?.addEventListener('click', () => {
    jbState.musicOnly = true;
    document.getElementById('jb-filter-music')?.classList.add('yellow');
    document.getElementById('jb-filter-all')?.classList.remove('yellow');
    if (typeof playRetroTone === 'function') playRetroTone('click');
    updateJukebox();
  });

  document.getElementById('jb-filter-all')?.addEventListener('click', () => {
    jbState.musicOnly = false;
    document.getElementById('jb-filter-all')?.classList.add('yellow');
    document.getElementById('jb-filter-music')?.classList.remove('yellow');
    if (typeof playRetroTone === 'function') playRetroTone('click');
    updateJukebox();
  });

  document.getElementById('jb-btn-bind-yt')?.addEventListener('click', () => {
    const inp = document.getElementById('jb-manual-yt-inp');
    const url = (inp?.value || '').trim();
    const vid = parseYtIdFromUrl(url);
    const track = jbState.playlist[jbState.currentIndex];
    if (!track) return;
    if (!vid) {
      if (typeof showWin95MessageBox === 'function') {
        showWin95MessageBox('YouTube 링크 오류 — JUKEBOX 95', '올바른 YouTube 동영상 URL(youtube.com/watch?v=... 또는 youtu.be/...)을 입력해 주십시오.', 'boom');
      }
      return;
    }

    const cache = getJbCache();
    const key = getTrackCacheKey(track);
    const customEntry = [{
      videoId: vid,
      title: `${track.title} (사용자 지정 링크)`,
      channel: track.creator || 'YouTube',
      sourceUrl: `https://www.youtube.com/watch?v=${vid}`
    }];
    cache[key] = customEntry;
    setJbCache(cache);
    track.sourceUrl = `https://www.youtube.com/watch?v=${vid}`;
    if (inp) inp.value = '';
    if (typeof playRetroTone === 'function') playRetroTone('open');
    jbState.candidates = customEntry;
    jbState.candidateIdx = 0;
    mountYouTubeEmbedInJukebox(vid, customEntry[0].title);
    renderJukeboxCandidates();
    renderJukeboxPlaylist();
  });

  document.getElementById('jb-btn-open-browser')?.addEventListener('click', () => {
    const track = jbState.playlist[jbState.currentIndex];
    const query = track ? `${track.creator} ${track.title}` : '인기 음악 플레이리스트';
    if (typeof window.openVirtualBrowserWithQuery === 'function') {
      window.openVirtualBrowserWithQuery(query, true);
    }
  });
}

function updateJukebox() {
  buildJukeboxUI();
  const myItems = typeof getMyVisibleArchiveItems === 'function'
    ? getMyVisibleArchiveItems()
    : (Array.isArray(window.archiveItems) ? window.archiveItems : []);
  const validList = myItems.filter(it => it && it.title && String(it.title).trim() !== '');

  jbState.playlist = jbState.musicOnly
    ? validList.filter(it => it.category === '음악')
    : [...validList];

  if (!jbState.playlist.length) {
    jbState.playlist = JB_BUILTIN_FALLBACK_TRACKS.slice(0, 3).map((b, i) => ({
      id: `jb-def-${i + 1}`,
      category: '음악',
      title: b.title,
      creator: b.creator,
      genre: b.genre,
      rating: 5,
      review: '내장 기본 유튜브 트랙',
      sourceUrl: `https://www.youtube.com/watch?v=${b.videoId}`
    }));
  }

  window.jukeboxPlaylist = jbState.playlist;

  if (jbState.currentIndex >= jbState.playlist.length) {
    jbState.currentIndex = 0;
  }

  const countEl = document.getElementById('jb-count-num');
  if (countEl) countEl.textContent = String(jbState.playlist.length);

  renderJukeboxPlaylist();
  emitJukeboxSyncEvent('playlist');
}

function renderJukeboxPlaylist() {
  const box = document.getElementById('jb-playlist-box');
  if (!box) return;

  if (!jbState.playlist.length) {
    box.innerHTML = `<div style="padding:14px; text-align:center; font-size:0.8rem; font-weight:800; color:#555;">내 보관함에 재생할 수록곡이 없습니다.</div>`;
    return;
  }

  box.innerHTML = jbState.playlist.map((item, idx) => {
    const active = idx === jbState.currentIndex;
    const cached = getJbCache()[getTrackCacheKey(item)];
    const hasYt = Boolean(parseYtIdFromUrl(item.sourceUrl) || (cached && cached.length));
    return `
      <div class="jb-track-row" data-jb-idx="${idx}" style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:5px 8px; cursor:pointer; border:1.5px solid #111; background:${active ? '#111111' : '#ffffff'}; color:${active ? '#39ff14' : '#111111'}; font-size:0.78rem; font-weight:800;">
        <div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
          <span>${active ? '&gt;' : `${idx + 1}.`}</span>
          <span>[${safeJbEsc(item.category || '음악')}] ${safeJbEsc(item.title)} — ${safeJbEsc(item.creator)}</span>
        </div>
        <span style="font-size:0.68rem; padding:1px 5px; border:1px solid currentColor; flex-shrink:0;">
          ${hasYt ? 'YT READY' : 'AUTO-YT'}
        </span>
      </div>
    `;
  }).join('');

  box.querySelectorAll('[data-jb-idx]').forEach(row => {
    row.addEventListener('click', () => {
      const idx = Number(row.dataset.jbIdx);
      if (typeof playRetroTone === 'function') playRetroTone('click');
      playJukeboxTrack(idx);
    });
  });
}

function updateLcdTimeDisplay(sec, { emit = true } = {}) {
  const safeSec = Math.max(0, Math.floor(Number(sec) || 0));
  jbState.timerSec = safeSec;
  const mm = String(Math.floor(safeSec / 60)).padStart(2, '0');
  const ss = String(safeSec % 60).padStart(2, '0');
  const lcd = document.getElementById('jb-lcd-time');
  if (lcd) lcd.textContent = `${mm}:${ss}`;
  if (emit) emitJukeboxSyncEvent('tick');
}

function startJukeboxTimer() {
  stopJukeboxTimer();
  jbState.isPlaying = true;
  jbState.timerInterval = setInterval(() => {
    if (!jbState.isPlaying) return;

    if (jbState.ytPlayer && typeof jbState.ytPlayer.getCurrentTime === 'function') {
      try {
        const cur = Number(jbState.ytPlayer.getCurrentTime());
        if (!Number.isNaN(cur) && cur >= 0) {
          updateLcdTimeDisplay(cur);
        } else {
          updateLcdTimeDisplay(jbState.timerSec + 1);
        }
      } catch {
        updateLcdTimeDisplay(jbState.timerSec + 1);
      }
    } else {
      updateLcdTimeDisplay(jbState.timerSec + 1);
    }

    document.querySelectorAll('#jb-eq-bars .jb-bar').forEach(bar => {
      bar.style.height = `${4 + Math.floor(Math.random() * 22)}px`;
    });
  }, 1000);
  emitJukeboxSyncEvent('play');
}

function stopJukeboxTimer() {
  if (jbState.timerInterval) {
    clearInterval(jbState.timerInterval);
    jbState.timerInterval = null;
  }
  jbState.isPlaying = false;
  document.querySelectorAll('#jb-eq-bars .jb-bar').forEach((bar, i) => {
    bar.style.height = `${5 + (i % 3) * 3}px`;
  });
  emitJukeboxSyncEvent('pause');
}

function destroyJukeboxYtPlayer() {
  if (jbState.ytPlayer && typeof jbState.ytPlayer.destroy === 'function') {
    try {
      jbState.ytPlayer.destroy();
    } catch {}
  }
  jbState.ytPlayer = null;
  window.jukeboxYtPlayer = null;
}

function stopJukeboxPlayback() {
  if (jbState.abortCtrl) {
    jbState.abortCtrl.abort();
    jbState.abortCtrl = null;
  }
  destroyJukeboxYtPlayer();
  stopJukeboxTimer();
  updateLcdTimeDisplay(0, { emit: false });
  const pill = document.getElementById('jb-status-pill');
  if (pill) pill.textContent = 'STOPPED';
  const wrap = document.getElementById('jb-player-frame-wrap');
  if (wrap) {
    wrap.innerHTML = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#88cc99; font-size:0.8rem;">[STOP] 재생이 정지되었습니다.</div>`;
  }
  emitJukeboxSyncEvent('stop');
}

function attachYouTubeIframeApi() {
  const initPlayer = () => {
    if (!window.YT || !window.YT.Player) return;
    const targetEl = document.getElementById(jbState.ytIframeId);
    if (!targetEl) return;

    try {
      jbState.ytPlayer = new window.YT.Player(jbState.ytIframeId, {
        events: {
          onReady: ev => {
            window.jukeboxYtPlayer = jbState.ytPlayer;
            applyLowBandwidthQualityHint(ev?.target || jbState.ytPlayer, true);
            emitJukeboxSyncEvent('player-ready');
          },
          onStateChange: ev => {
            const stateCode = ev?.data;
            const playerInstance = ev?.target || jbState.ytPlayer;
            if (stateCode === 1 || stateCode === 3) {
              applyLowBandwidthQualityHint(playerInstance, true);
            }
            if (stateCode === 1) {
              jbState.isPlaying = true;
              const pill = document.getElementById('jb-status-pill');
              if (pill) pill.textContent = 'PLAYING';
              emitJukeboxSyncEvent('play');
            } else if (stateCode === 2) {
              jbState.isPlaying = false;
              const pill = document.getElementById('jb-status-pill');
              if (pill) pill.textContent = 'PAUSED';
              emitJukeboxSyncEvent('pause');
            } else if (stateCode === 0) {
              jbState.currentIndex = getNextPlaylistIndex();
              playJukeboxTrack(jbState.currentIndex);
            }
          }
        }
      });
      window.jukeboxYtPlayer = jbState.ytPlayer;
    } catch {}
  };

  if (window.YT && window.YT.Player) {
    initPlayer();
    return;
  }

  if (!document.getElementById('yt-iframe-api-script')) {
    const tag = document.createElement('script');
    tag.id = 'yt-iframe-api-script';
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }

  const prevReady = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    if (typeof prevReady === 'function') prevReady();
    initPlayer();
  };
}

function mountYouTubeEmbedInJukebox(videoId, labelText) {
  buildJukeboxUI();
  const cleanId = parseYtIdFromUrl(videoId) || String(videoId || '').trim();
  if (!cleanId) return;

  destroyJukeboxYtPlayer();
  updateLcdTimeDisplay(0, { emit: false });

  const wrap = document.getElementById('jb-player-frame-wrap');
  const pill = document.getElementById('jb-status-pill');
  const sub = document.getElementById('jb-track-sub');
  const marquee = document.getElementById('jb-marquee-title');
  if (!wrap) return;

  const params = new URLSearchParams({
    autoplay: '1',
    rel: '0',
    playsinline: '1',
    vq: JB_PREFERRED_MAX_QUALITY,
    enablejsapi: '1',
    origin: window.location.origin
  });
  if (jbState.isRepeatOne) {
    params.set('loop', '1');
    params.set('playlist', cleanId);
  }
  const embedUrl = `https://www.youtube.com/embed/${encodeURIComponent(cleanId)}?${params.toString()}`;

  wrap.innerHTML = `
    <iframe
      id="${safeJbEsc(jbState.ytIframeId)}"
      src="${embedUrl}"
      title="${safeJbEsc(labelText || 'YouTube Player')}"
      style="width:100%; height:100%; border:0; display:block;"
      allow="autoplay; encrypted-media; picture-in-picture"
      referrerpolicy="strict-origin-when-cross-origin"
      allowfullscreen>
    </iframe>
  `;

  if (pill) pill.textContent = 'PLAYING';
  if (labelText) {
    if (marquee && marquee.textContent.includes('버튼을 누르십시오')) {
      marquee.textContent = labelText;
    }
    if (sub) sub.textContent = `연결된 스트림 (480p 이하 ABR): ${labelText}`;
  }
  startJukeboxTimer();
  attachYouTubeIframeApi();
}

function renderJukeboxCandidates() {
  const bar = document.getElementById('jb-cand-bar');
  const btns = document.getElementById('jb-cand-btns');
  if (!bar || !btns) return;

  if (!jbState.candidates || jbState.candidates.length <= 1) {
    bar.style.display = 'none';
    return;
  }

  bar.style.display = 'flex';
  btns.innerHTML = jbState.candidates.slice(0, 5).map((c, idx) => `
    <button type="button" class="btn95 sm ${idx === jbState.candidateIdx ? 'yellow' : ''}" data-jb-cand="${idx}" style="padding:1px 6px; font-size:0.68rem;" title="${safeJbEsc(c.title)}">
      #${idx + 1}
    </button>
  `).join('');

  btns.querySelectorAll('[data-jb-cand]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.jbCand);
      const chosen = jbState.candidates[idx];
      if (!chosen) return;
      jbState.candidateIdx = idx;
      if (typeof playRetroTone === 'function') playRetroTone('click');
      const chanName = chosen.channel || chosen.creator || chosen.author || 'YouTube';
      mountYouTubeEmbedInJukebox(chosen.videoId, `${chosen.title} (${chanName})`);
      renderJukeboxCandidates();
    });
  });
}

async function playJukeboxTrack(indexOrTrack) {
  buildJukeboxUI();

  let track = null;
  if (typeof indexOrTrack === 'object' && indexOrTrack && indexOrTrack.title) {
    track = indexOrTrack;
    const foundIdx = jbState.playlist.findIndex(
      t => t.title === track.title && t.creator === track.creator
    );
    if (foundIdx >= 0) {
      jbState.currentIndex = foundIdx;
    } else {
      jbState.playlist.unshift(track);
      jbState.currentIndex = 0;
      window.jukeboxPlaylist = jbState.playlist;
    }
  } else {
    if (!jbState.playlist.length) updateJukebox();
    if (!jbState.playlist.length) return;
    const rawIdx = Number(indexOrTrack) || 0;
    jbState.currentIndex = Math.max(0, Math.min(rawIdx, jbState.playlist.length - 1));
    track = jbState.playlist[jbState.currentIndex];
  }

  if (!track) return;
  renderJukeboxPlaylist();

  const marquee = document.getElementById('jb-marquee-title');
  const sub = document.getElementById('jb-track-sub');
  const ticker = document.getElementById('jb-review-ticker');
  const pill = document.getElementById('jb-status-pill');
  const wrap = document.getElementById('jb-player-frame-wrap');

  if (marquee) marquee.textContent = `${jbState.currentIndex + 1}. ${track.title} — ${track.creator}`;
  if (ticker) ticker.textContent = `[${track.rating || 5}점] "${track.review || '등록된 한줄평 없음'}"`;

  // 1순위: 기록 자체에 저장된 YouTube URL이 있는 경우 즉시 재생
  const directId = parseYtIdFromUrl(track.sourceUrl || track.videoId);
  if (directId) {
    jbState.candidates = [{ videoId: directId, title: track.title, channel: track.creator || 'YouTube' }];
    jbState.candidateIdx = 0;
    renderJukeboxCandidates();
    mountYouTubeEmbedInJukebox(directId, `${track.title} (저장된 원본 링크)`);
    return;
  }

  // 2순위: 로컬 캐시에 이미 검색된 YouTube 후보가 있는 경우 즉시 재생
  const cache = getJbCache();
  const cacheKey = getTrackCacheKey(track);
  if (Array.isArray(cache[cacheKey]) && cache[cacheKey].length > 0) {
    const normalizedCached = normalizeYtCandidateList(cache[cacheKey], track.title);
    if (normalizedCached.length > 0) {
      jbState.candidates = normalizedCached;
      jbState.candidateIdx = 0;
      renderJukeboxCandidates();
      const first = jbState.candidates[0];
      mountYouTubeEmbedInJukebox(first.videoId, `${first.title} (${first.channel})`);
      return;
    }
  }

  // 3순위: Apps Script 전용 ytsearch 엔드포인트 호출 (실패 시 내장 유튜브 후보 자동 매칭)
  const apiUrl = resolveGasApiUrl();
  if (!apiUrl) {
    const fallbackList = findFallbackYouTubeCandidates(track);
    jbState.candidates = fallbackList;
    jbState.candidateIdx = 0;
    renderJukeboxCandidates();
    const first = fallbackList[0];
    mountYouTubeEmbedInJukebox(first.videoId, `${first.title} (${first.channel})`);
    return;
  }

  if (jbState.abortCtrl) jbState.abortCtrl.abort();
  const ctrl = new AbortController();
  jbState.abortCtrl = ctrl;
  const timeoutId = setTimeout(() => ctrl.abort(), 11000);

  if (pill) pill.textContent = 'SEARCHING...';
  if (sub) sub.textContent = `YouTube에서 「${track.creator} - ${track.title}」 검색 중...`;
  if (wrap) {
    wrap.innerHTML = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; gap:6px; color:#ffd83b; font-size:0.82rem; font-weight:900;">${JUKEBOX_PIXEL_ICONS.search}<span>YouTube 오디오 스트림 자동 탐색 중...</span></div>`;
  }

  try {
    const query = track.category === '음악'
      ? `${track.creator} ${track.title} official audio`
      : `${track.title} ${track.creator}`;
    const res = await fetch(`${apiUrl}?action=ytsearch&q=${encodeURIComponent(query)}&limit=5`, {
      signal: ctrl.signal
    });
    const json = await res.json();
    const videos = normalizeYtCandidateList(json.videos, query);

    if (!videos.length) {
      throw new Error('일치하는 YouTube 영상을 찾지 못했습니다.');
    }

    cache[cacheKey] = videos;
    setJbCache(cache);
    jbState.candidates = videos;
    jbState.candidateIdx = 0;
    renderJukeboxCandidates();
    renderJukeboxPlaylist();

    const best = videos[0];
    mountYouTubeEmbedInJukebox(best.videoId, `${best.title} (${best.channel})`);
  } catch {
    const fallbackList = findFallbackYouTubeCandidates(track);
    jbState.candidates = fallbackList;
    jbState.candidateIdx = 0;
    renderJukeboxCandidates();
    renderJukeboxPlaylist();
    const best = fallbackList[0];
    if (sub) sub.textContent = `자동 매칭 스트림 재생 중: ${best.title}`;
    mountYouTubeEmbedInJukebox(best.videoId, `${best.title} (${best.channel})`);
  } finally {
    clearTimeout(timeoutId);
    if (jbState.abortCtrl === ctrl) jbState.abortCtrl = null;
  }
}

// 위젯(CD Player / Mood Music AI) 재생 상태 변화와 동기화
window.addEventListener('widgets:playback', ev => {
  const detail = ev?.detail || {};
  if (detail.source !== 'win95-widgets') return;

  buildJukeboxUI();

  if (detail.track && detail.track.title) {
    const foundIdx = jbState.playlist.findIndex(
      t =>
        String(t.title || '').toLowerCase() === String(detail.track.title).toLowerCase() &&
        String(t.creator || '').toLowerCase() === String(detail.track.creator || '').toLowerCase()
    );
    if (foundIdx >= 0) {
      jbState.currentIndex = foundIdx;
    } else {
      jbState.playlist.unshift({
        id: detail.track.id || `w-${Date.now()}`,
        category: '음악',
        title: detail.track.title,
        creator: detail.track.creator || 'Unknown Artist',
        genre: detail.track.genre || '음악',
        rating: detail.track.rating || 5,
        review: detail.track.review || '',
        sourceUrl: detail.track.sourceUrl || ''
      });
      jbState.currentIndex = 0;
      window.jukeboxPlaylist = jbState.playlist;
    }
    renderJukeboxPlaylist();
  }

  const curTrack = jbState.playlist[jbState.currentIndex];
  const marquee = document.getElementById('jb-marquee-title');
  const sub = document.getElementById('jb-track-sub');
  const pill = document.getElementById('jb-status-pill');

  if (curTrack && marquee) {
    marquee.textContent = `${jbState.currentIndex + 1}. ${curTrack.title} — ${curTrack.creator}`;
  }

  if (detail.reason === 'stop') {
    jbState.isPlaying = false;
    updateLcdTimeDisplay(0, { emit: false });
    if (pill) pill.textContent = 'WIDGET STOP';
    if (sub) sub.textContent = '위젯 재생이 정지되었습니다.';
    return;
  }

  if (typeof detail.timerSec === 'number') {
    updateLcdTimeDisplay(detail.timerSec, { emit: false });
  }

  if (typeof detail.isPlaying === 'boolean') {
    jbState.isPlaying = detail.isPlaying;
    if (pill) pill.textContent = detail.isPlaying ? 'WIDGET PLAY' : 'WIDGET PAUSE';
    if (sub && curTrack) {
      sub.textContent = detail.isPlaying
        ? `위젯 단독 재생 동기화 중: ${curTrack.title}`
        : `위젯 일시정지 동기화됨: ${curTrack.title}`;
    }
  }
});

// 주크박스 창이 닫힐 때 플레이어 인스턴스까지 확실히 해제
window.addEventListener('window:closed', ev => {
  if (ev?.detail?.id === 'win-jukebox') {
    stopJukeboxPlayback();
  }
});

window.addEventListener('DOMContentLoaded', () => {
  applyJukeboxResponsiveStyle();
});

window.updateJukebox = updateJukebox;
window.playJukeboxTrack = playJukeboxTrack;
window.mountYouTubeEmbedInJukebox = mountYouTubeEmbedInJukebox;
window.stopJukeboxPlayback = stopJukeboxPlayback;

// ============================================================
// MY-ARCHIVE 95 OS — WINAMP / JUKEBOX 95.EXE
// (1995 Stereo Engine, YouTube Auto-Search & Explorer95 Bridge)
// ============================================================

window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
window.__MOD_VERSIONS.jukebox = 'v2026.11.22-03';

const JB_CACHE_KEY = 'myarchive95_yt_track_cache_v2';

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
  abortCtrl: null
};

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
  const s = String(url || '');
  const m = s.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i);
  return m ? m[1] : '';
}

function getTrackCacheKey(item) {
  return `${String(item.creator || '').trim().toLowerCase()}|${String(item.title || '').trim().toLowerCase()}`;
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

function buildJukeboxUI() {
  const win = document.getElementById('win-jukebox');
  if (!win) return;
  const body = win.querySelector('.win-body');
  if (!body || body.dataset.jbInitialized === 'true') return;
  body.dataset.jbInitialized = 'true';

  body.innerHTML = `
    <div style="background:#19191f; color:#39ff14; border:3px solid #111; padding:10px; box-shadow:inset 2px 2px 0 #000, inset -2px -2px 0 #444; margin-bottom:10px; font-family:var(--font-mono);">
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.72rem; color:#ffd83b; margin-bottom:6px; border-bottom:1px solid #333; padding-bottom:4px;">
        <span>WINAMP / JUKEBOX 95 — STEREO AUDIO ENGINE</span>
        <span id="jb-status-pill" style="background:#111; border:1px solid #39ff14; color:#39ff14; padding:1px 6px;">READY</span>
      </div>

      <div style="display:grid; grid-template-columns:112px 1fr; gap:10px; align-items:center;">
        <div style="background:#08120c; border:2px solid #333; padding:6px; text-align:center;">
          <div id="jb-lcd-time" style="font-size:1.35rem; font-weight:900; letter-spacing:1px; color:#39ff14;">00:00</div>
          <div id="jb-eq-bars" style="display:flex; align-items:flex-end; justify-content:center; gap:3px; height:26px; margin-top:6px;">
            ${Array.from({ length: 12 }).map((_, i) => `<span class="jb-bar" style="width:5px; height:${6 + (i % 4) * 4}px; background:#39ff14; display:inline-block; transition:height 0.15s;"></span>`).join('')}
          </div>
          <div style="font-size:0.65rem; color:#88cc99; margin-top:4px;">128 KBPS · 44 KHZ</div>
        </div>

        <div style="min-width:0;">
          <div style="background:#08120c; border:1.5px solid #333; padding:5px 8px; overflow:hidden; white-space:nowrap; margin-bottom:6px;">
            <div id="jb-marquee-title" style="font-size:0.86rem; font-weight:900; color:#39ff14;">재생할 트랙을 선택하여 시작하십시오.</div>
          </div>
          <div id="jb-track-sub" style="font-size:0.74rem; color:#cccccc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:6px;">
            대기 중 · 내 아카이브 음악 라이브러리 연동됨
          </div>
          <div id="jb-review-ticker" style="font-size:0.74rem; color:#ffd83b; background:#101016; border:1px dashed #444; padding:4px 7px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            [MEMO] 감상 한줄평 메모가 이곳에 표시됩니다.
          </div>
        </div>
      </div>

      <!-- YouTube IFrame 플레이어 영역 -->
      <div id="jb-player-frame-wrap" style="margin-top:8px; background:#000; border:2px solid #333; position:relative; aspect-ratio:16/9; max-height:205px; width:100%; overflow:hidden;">
        <div id="jb-player-placeholder" style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#88cc99; font-size:0.8rem; gap:6px; padding:12px; text-align:center;">
          <span>하단 수록곡을 클릭하면 YouTube 음원/영상을 찾아 재생합니다.</span>
        </div>
      </div>

      <!-- 검색 후보 1~5번 전환 바 -->
      <div id="jb-cand-bar" style="display:none; margin-top:7px; padding-top:6px; border-top:1px dashed #333; align-items:center; justify-content:space-between; gap:6px; flex-wrap:wrap;">
        <span style="font-size:0.7rem; color:#ffd83b;">다른 스트림 버전 선택:</span>
        <div id="jb-cand-btns" style="display:flex; gap:4px; flex-wrap:wrap;"></div>
      </div>
    </div>

    <!-- Winamp 물리 컨트롤 버튼 -->
    <div style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:8px; align-items:center;">
      <button type="button" class="btn95 sm" id="jb-btn-prev" title="이전 곡">|&lt; 이전</button>
      <button type="button" class="btn95 yellow sm" id="jb-btn-play" title="재생 / 다시 불러오기">&gt; 재생</button>
      <button type="button" class="btn95 sm" id="jb-btn-stop" title="정지">[] 정지</button>
      <button type="button" class="btn95 sm" id="jb-btn-next" title="다음 곡">&gt;| 다음</button>
      <button type="button" class="btn95 sm" id="jb-btn-shuffle">[SHF] 셔플: OFF</button>
      <button type="button" class="btn95 sm" id="jb-btn-repeat">[RPT] 한곡반복: OFF</button>
      <button type="button" class="btn95 sky sm" id="jb-btn-toggle-vid">[VID] 화면접기</button>
    </div>

    <!-- 직접 YouTube 링크 지정 & 가상 브라우저 연동 바 -->
    <div class="sunken-box" style="padding:7px 8px; margin-bottom:8px; background:var(--win-gray);">
      <div style="display:flex; gap:5px; flex-wrap:wrap; align-items:center;">
        <input type="text" id="jb-manual-yt-inp" placeholder="URL을 붙여넣어 현재 곡에 연결..." style="flex:1; min-width:190px; font-size:0.76rem;" />
        <button type="button" class="btn95 green sm" id="jb-btn-bind-yt">링크 연결·재생</button>
        <button type="button" class="btn95 pink sm" id="jb-btn-open-browser">${JUKEBOX_PIXEL_ICONS.globe} 탐색기 95에서 찾기</button>
      </div>
    </div>

    <!-- 재생목록 (Playlist Editor) -->
    <div class="sunken-box" style="padding:8px;">
      <div class="box-head" style="margin-bottom:6px;">
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
    if (jbState.isShuffle && jbState.playlist.length > 1) {
      let nextIdx = jbState.currentIndex;
      while (nextIdx === jbState.currentIndex) {
        nextIdx = Math.floor(Math.random() * jbState.playlist.length);
      }
      jbState.currentIndex = nextIdx;
    } else {
      jbState.currentIndex = (jbState.currentIndex + 1) % jbState.playlist.length;
    }
    playJukeboxTrack(jbState.currentIndex);
  });

  document.getElementById('jb-btn-play')?.addEventListener('click', () => {
    if (!jbState.playlist.length) return;
    if (typeof playRetroTone === 'function') playRetroTone('click');
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
  });

  document.getElementById('jb-btn-repeat')?.addEventListener('click', e => {
    jbState.isRepeatOne = !jbState.isRepeatOne;
    e.currentTarget.textContent = `[RPT] 한곡반복: ${jbState.isRepeatOne ? 'ON' : 'OFF'}`;
    e.currentTarget.classList.toggle('yellow', jbState.isRepeatOne);
    if (typeof playRetroTone === 'function') playRetroTone('click');
  });

  document.getElementById('jb-btn-toggle-vid')?.addEventListener('click', e => {
    jbState.hideVideo = !jbState.hideVideo;
    const wrap = document.getElementById('jb-player-frame-wrap');
    if (wrap) {
      wrap.style.maxHeight = jbState.hideVideo ? '42px' : '205px';
    }
    e.currentTarget.textContent = jbState.hideVideo ? '[VID] 화면펼치기' : '[VID] 화면접기';
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

  // 수동 YouTube URL 직접 연결
  document.getElementById('jb-btn-bind-yt')?.addEventListener('click', () => {
    const inp = document.getElementById('jb-manual-yt-inp');
    const url = (inp?.value || '').trim();
    const vid = parseYtIdFromUrl(url);
    const track = jbState.playlist[jbState.currentIndex];
    if (!track) return;
    if (!vid) {
      showWin95MessageBox('YouTube 링크 오류 — JUKEBOX 95', '올바른 YouTube 동영상 URL(youtube.com/watch?v=... 또는 youtu.be/...)을 입력해 주십시오.', 'boom');
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
    if (inp) inp.value = '';
    if (typeof playRetroTone === 'function') playRetroTone('open');
    jbState.candidates = customEntry;
    jbState.candidateIdx = 0;
    mountYouTubeEmbedInJukebox(vid, customEntry[0].title);
    renderJukeboxCandidates();
  });

  // 현재 곡을 가상 탐색기 95에서 유튜브 검색
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
    : (Array.isArray(archiveItems) ? archiveItems : []);
  const validList = myItems.filter(it => it && it.title && String(it.title).trim() !== '');

  jbState.playlist = jbState.musicOnly
    ? validList.filter(it => it.category === '음악')
    : [...validList];

  if (jbState.currentIndex >= jbState.playlist.length) {
    jbState.currentIndex = 0;
  }

  const countEl = document.getElementById('jb-count-num');
  if (countEl) countEl.textContent = String(jbState.playlist.length);

  renderJukeboxPlaylist();
}

function renderJukeboxPlaylist() {
  const box = document.getElementById('jb-playlist-box');
  if (!box) return;

  if (!jbState.playlist.length) {
    box.innerHTML = `<div style="padding:14px; text-align:center; font-size:0.8rem; font-weight:800; color:#555;">내 보관함에 재생할 수록곡이 없습니다. 음악 기록을 추가하거나 [전체보관함] 버튼을 선택해 주십시오.</div>`;
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
          <span>[${esc(item.category)}] ${esc(item.title)} — ${esc(item.creator)}</span>
        </div>
        <span style="font-size:0.68rem; padding:1px 5px; border:1px solid currentColor; flex-shrink:0;">
          ${hasYt ? 'YT READY' : 'AUTO-FIND'}
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

function startJukeboxTimer() {
  stopJukeboxTimer();
  jbState.timerSec = 0;
  jbState.isPlaying = true;
  jbState.timerInterval = setInterval(() => {
    if (!jbState.isPlaying) return;
    jbState.timerSec += 1;
    const mm = String(Math.floor(jbState.timerSec / 60)).padStart(2, '0');
    const ss = String(jbState.timerSec % 60).padStart(2, '0');
    const lcd = document.getElementById('jb-lcd-time');
    if (lcd) lcd.textContent = `${mm}:${ss}`;

    document.querySelectorAll('#jb-eq-bars .jb-bar').forEach(bar => {
      bar.style.height = `${4 + Math.floor(Math.random() * 22)}px`;
    });
  }, 1000);
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
}

function stopJukeboxPlayback() {
  if (jbState.abortCtrl) {
    jbState.abortCtrl.abort();
    jbState.abortCtrl = null;
  }
  stopJukeboxTimer();
  const pill = document.getElementById('jb-status-pill');
  if (pill) pill.textContent = 'STOPPED';
  const wrap = document.getElementById('jb-player-frame-wrap');
  if (wrap) {
    wrap.innerHTML = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#88cc99; font-size:0.8rem;">[STOP] 재생이 정지되었습니다.</div>`;
  }
}

function mountYouTubeEmbedInJukebox(videoId, labelText) {
  buildJukeboxUI();
  const wrap = document.getElementById('jb-player-frame-wrap');
  const pill = document.getElementById('jb-status-pill');
  const sub = document.getElementById('jb-track-sub');
  const marquee = document.getElementById('jb-marquee-title');
  if (!wrap) return;

  const embedUrl = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0&playsinline=1&enablejsapi=1${jbState.isRepeatOne ? `&loop=1&playlist=${encodeURIComponent(videoId)}` : ''}`;

  wrap.innerHTML = `
    <iframe
      src="${embedUrl}"
      title="${esc(labelText || 'YouTube Player')}"
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
    if (sub) sub.textContent = `연결된 스트림: ${labelText}`;
  }
  startJukeboxTimer();
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
    <button type="button" class="btn95 sm ${idx === jbState.candidateIdx ? 'yellow' : ''}" data-jb-cand="${idx}" style="padding:1px 6px; font-size:0.68rem;" title="${esc(c.title)}">
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

async function playJukeboxTrack(index) {
  buildJukeboxUI();
  if (!jbState.playlist.length) return;

  jbState.currentIndex = Math.max(0, Math.min(index, jbState.playlist.length - 1));
  const track = jbState.playlist[jbState.currentIndex];
  renderJukeboxPlaylist();

  const marquee = document.getElementById('jb-marquee-title');
  const sub = document.getElementById('jb-track-sub');
  const ticker = document.getElementById('jb-review-ticker');
  const pill = document.getElementById('jb-status-pill');
  const wrap = document.getElementById('jb-player-frame-wrap');

  if (marquee) marquee.textContent = `${jbState.currentIndex + 1}. ${track.title} — ${track.creator}`;
  if (ticker) ticker.textContent = `[${track.rating || 5}점] "${track.review || '등록된 한줄평 없음'}"`;

  // 1순위: 기록 자체에 저장된 YouTube URL이 있는 경우 즉시 재생
  const directId = parseYtIdFromUrl(track.sourceUrl);
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

  // 3순위: Apps Script 전용 ytsearch 엔드포인트 호출
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
    const res = await fetch(`${GAS_WEB_APP_URL}?action=ytsearch&q=${encodeURIComponent(query)}&limit=5`, {
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

    const best = videos[0];
    mountYouTubeEmbedInJukebox(best.videoId, `${best.title} (${best.channel})`);
  } catch (err) {
    stopJukeboxTimer();
    if (pill) pill.textContent = 'NOT FOUND';
    if (sub) sub.textContent = (err && err.name === 'AbortError')
      ? '검색 시간 초과 — 아래에서 직접 링크를 연결해 주십시오.'
      : (err.message || '자동 검색 실패');
    if (wrap) {
      const ytFallbackSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${track.creator} ${track.title}`)}`;
      wrap.innerHTML = `
        <div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; padding:12px; text-align:center; color:#fff; font-size:0.78rem;">
          <div>자동 매칭에 실패했습니다. 탐색기 95에서 검색하거나 아래 입력창에 YouTube 링크를 붙여넣어 연결하십시오.</div>
          <a class="btn95 pink sm" href="${ytFallbackSearch}" target="_blank" rel="noopener noreferrer">새 탭에서 YouTube 검색 &gt;&gt;</a>
        </div>
      `;
    }
  } finally {
    clearTimeout(timeoutId);
    if (jbState.abortCtrl === ctrl) jbState.abortCtrl = null;
  }
}

window.updateJukebox = updateJukebox;
window.playJukeboxTrack = playJukeboxTrack;
window.mountYouTubeEmbedInJukebox = mountYouTubeEmbedInJukebox;

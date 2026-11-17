// ============================================================
// MY-ARCHIVE 95 OS — YouTube Background Jukebox (JUKEBOX95.EXE)
// ============================================================

window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
window.__MOD_VERSIONS.jukebox = typeof APP_BUILD_VERSION !== 'undefined' ? APP_BUILD_VERSION : 'v2026.11.17-05';

let ytPlayer = null;
let ytApiReady = false;
let jukeboxTracks = [];
let currentTrackIdx = 0;
let isJukeboxPlaying = false;

const YT_VID_CACHE_KEY = 'my_archive_95_yt_vid_cache_v1';

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('window:opened', ev => {
    if (ev.detail && ev.detail.id === 'win-jukebox') {
      updateJukebox();
    }
  });
});

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

function normalizeMusicMatchStr(str) {
  return String(str || '')
    .replace(/\s*-\s*topic$/i, '')
    .replace(/[^\w가-힣]/g, '')
    .toLowerCase();
}

// 부분 포함 매칭: "- Topic" 채널 및 아티스트명 생략 업로드 허용
function isLenientYouTubeMatch(cand, track) {
  const normTrackTitle = normalizeMusicMatchStr(track.title);
  const normTrackCreator = normalizeMusicMatchStr(track.creator);
  const normCandTitle = normalizeMusicMatchStr(cand.title);
  const normCandCreator = normalizeMusicMatchStr(cand.creator);
  const combinedCand = normCandTitle + normCandCreator;

  const titleIncluded = !normTrackTitle ||
    combinedCand.includes(normTrackTitle) ||
    (normCandTitle.length >= 2 && normTrackTitle.includes(normCandTitle));

  const creatorTokens = String(track.creator || '')
    .split(/[,&/·()\[\]]+/)
    .map(t => normalizeMusicMatchStr(t))
    .filter(t => t.length >= 2);

  const artistIncluded = !normTrackCreator ||
    combinedCand.includes(normTrackCreator) ||
    creatorTokens.some(tok => combinedCand.includes(tok));

  if (titleIncluded && artistIncluded) return 2;
  if (titleIncluded) return 1;
  return 0;
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
  const vidCache = loadLocalCache(YT_VID_CACHE_KEY, {});

  jukeboxTracks = musicItems.map(item => {
    const cacheKey = `${normalizeMusicMatchStr(item.creator)}::${normalizeMusicMatchStr(item.title)}`;
    const directVid = extractYouTubeVideoId(item.sourceUrl);
    return {
      id: item.id,
      title: item.title,
      creator: item.creator,
      coverUrl: item.coverUrl || FALLBACK_COVER,
      sourceUrl: item.sourceUrl || '',
      videoId: directVid || (vidCache && vidCache[cacheKey]) || ''
    };
  });

  if (currentTrackIdx >= jukeboxTracks.length) currentTrackIdx = 0;
  renderJukeboxUI();
}

async function resolveTrackVideoId(track) {
  if (!track) return '';
  if (track.videoId) return track.videoId;

  const cacheKey = `${normalizeMusicMatchStr(track.creator)}::${normalizeMusicMatchStr(track.title)}`;
  const vidCache = loadLocalCache(YT_VID_CACHE_KEY, {});
  if (vidCache && vidCache[cacheKey]) {
    track.videoId = vidCache[cacheKey];
    return track.videoId;
  }

  try {
    const q = encodeURIComponent(`${track.creator} ${track.title}`.trim());
    const t = encodeURIComponent(track.title || '');
    const c = encodeURIComponent(track.creator || '');
    const res = await fetch(`${GAS_WEB_APP_URL}?action=search&q=${q}&title=${t}&creator=${c}&category=${encodeURIComponent('음악')}`);
    const json = await res.json();
    const cands = (json.candidates || []).filter(item => Boolean(extractYouTubeVideoId(item.sourceUrl)));

    if (!cands.length) return '';

    cands.sort((a, b) => isLenientYouTubeMatch(b, track) - isLenientYouTubeMatch(a, track));

    const matchedVid = extractYouTubeVideoId(cands[0].sourceUrl);
    if (matchedVid) {
      track.videoId = matchedVid;
      vidCache[cacheKey] = matchedVid;
      saveLocalCache(YT_VID_CACHE_KEY, vidCache);
      return matchedVid;
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

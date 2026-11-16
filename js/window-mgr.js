window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
window.__MOD_VERSIONS.windowMgr = typeof APP_BUILD_VERSION !== 'undefined' ? APP_BUILD_VERSION : 'v2026.11.17-03';

function focusWindow(winEl) {
  if (!winEl) return;
  document.querySelectorAll('.win95-window, .floating-win').forEach(w => w.classList.remove('focused'));
  winEl.classList.add('focused');

  if (winEl.id === 'win-main') {
    winEl.style.zIndex = 10;
  } else {
    topZIndex += 1;
    winEl.style.zIndex = topZIndex;
  }
  syncTaskbar();
}

function openWindow(winId) {
  const winEl = document.getElementById(winId);
  if (!winEl) return;
  winEl.style.setProperty('display', winEl.classList.contains('floating-win') ? 'flex' : 'block', 'important');
  winEl.classList.add('open');
  winEl.classList.remove('minimized');
  focusWindow(winEl);
  playRetroTone('open');
}

function closeWindow(winId) {
  const winEl = document.getElementById(winId);
  if (!winEl) return;
  playRetroTone('click');
  if (winEl.dataset.dynamic === 'true') winEl.remove();
  else {
    winEl.classList.remove('open');
    winEl.style.display = 'none';
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
  const bar = document.getElementById('taskbar-tasks');
  const startBtn = document.getElementById('btn-start');
  if (!bar || !startBtn) return;
  bar.innerHTML = '';
  bar.appendChild(startBtn);

  const windows = [
    document.getElementById('win-main'),
    ...document.querySelectorAll('.floating-win.open')
  ].filter(w => w && w.style.display !== 'none');

  windows.forEach(w => {
    const btn = document.createElement('button');
    btn.type = 'button';
    const isFocused = w.classList.contains('focused') && !w.classList.contains('minimized');
    btn.className = `task-tab ${isFocused ? 'active' : ''}`;
    btn.textContent = w.dataset.winTitle || '창';
    btn.addEventListener('click', () => {
      if (w.classList.contains('minimized')) {
        w.classList.remove('minimized');
        focusWindow(w);
      } else if (w.classList.contains('focused')) {
        minimizeWindow(w.id);
      } else {
        focusWindow(w);
      }
    });
    bar.appendChild(btn);
  });
}

document.addEventListener('click', e => {
  const ctrl = e.target.closest('.win-ctrl-btn');
  if (ctrl) {
    e.stopPropagation();
    const action = ctrl.dataset.action;
    const targetId = ctrl.dataset.target;
    if (action === 'minimize') minimizeWindow(targetId);
    else if (action === 'close') closeWindow(targetId);
    else if (action === 'reset-pos') {
      const w = document.getElementById(targetId);
      if (w) { w.style.position = 'relative'; w.style.left = '0px'; w.style.top = '0px'; w.style.width = 'auto'; }
    }
    return;
  }
  const clickedWin = e.target.closest('.win95-window, .floating-win');
  if (clickedWin && !clickedWin.classList.contains('focused')) {
    focusWindow(clickedWin);
  }
});

const ghostBox = document.getElementById('drag-ghost-box');

function enableWindowDrag(winEl) {
  const bar = winEl.querySelector('.win-titlebar.draggable');
  if (!bar) return;
  let isDragging = false, startX = 0, startY = 0, origLeft = 0, origTop = 0, targetLeft = 0, targetTop = 0;

  bar.addEventListener('mousedown', e => {
    if (e.target.closest('.win-ctrl-btn')) return;
    isDragging = true;
    focusWindow(winEl);
    startX = e.clientX;
    startY = e.clientY;
    const rect = winEl.getBoundingClientRect();
    origLeft = rect.left;
    origTop = rect.top;
    targetLeft = origLeft;
    targetTop = origTop;

    if (useGhostDrag && ghostBox) {
      ghostBox.style.width = `${rect.width}px`;
      ghostBox.style.height = `${rect.height}px`;
      ghostBox.style.left = `${origLeft}px`;
      ghostBox.style.top = `${origTop}px`;
      ghostBox.style.display = 'block';
    } else if (winEl.id === 'win-main' && getComputedStyle(winEl).position !== 'fixed') {
      winEl.style.width = `${rect.width}px`;
      winEl.style.position = 'fixed';
      winEl.style.left = `${origLeft}px`;
      winEl.style.top = `${origTop}px`;
    }
  });

  document.addEventListener('mousemove', e => {
    if (!isDragging) return;
    targetLeft = Math.max(-200, Math.min(window.innerWidth - 120, origLeft + (e.clientX - startX)));
    targetTop = Math.max(0, Math.min(window.innerHeight - 60, origTop + (e.clientY - startY)));
    if (useGhostDrag && ghostBox) {
      ghostBox.style.left = `${targetLeft}px`;
      ghostBox.style.top = `${targetTop}px`;
    } else {
      winEl.style.left = `${targetLeft}px`;
      winEl.style.top = `${targetTop}px`;
    }
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    if (useGhostDrag && ghostBox) {
      ghostBox.style.display = 'none';
      if (winEl.id === 'win-main' && getComputedStyle(winEl).position !== 'fixed') {
        const rect = winEl.getBoundingClientRect();
        winEl.style.width = `${rect.width}px`;
        winEl.style.position = 'fixed';
      }
      winEl.style.left = `${targetLeft}px`;
      winEl.style.top = `${targetTop}px`;
    }
    playRetroTone('click');
  });
}

document.querySelectorAll('.win95-window, .floating-win').forEach(enableWindowDrag);

document.getElementById('mnu-toggle-dragmode')?.addEventListener('click', e => {
  useGhostDrag = !useGhostDrag;
  e.currentTarget.firstElementChild.textContent = useGhostDrag
    ? '드래그 방식: 점선 와이어프레임 (전환)'
    : '드래그 방식: 실시간 창 이동 (전환)';
  playRetroTone('click');
});

const wpClasses = ['', 'wp-grid', 'wp-bricks'];
let wpIndex = 0;
function cycleWallpaper() {
  wpIndex = (wpIndex + 1) % wpClasses.length;
  document.body.classList.remove('wp-grid', 'wp-bricks');
  if (wpClasses[wpIndex]) document.body.classList.add(wpClasses[wpIndex]);
  playRetroTone('click');
}
document.getElementById('mnu-cycle-wallpaper')?.addEventListener('click', cycleWallpaper);
document.getElementById('btn-widget-wp')?.addEventListener('click', cycleWallpaper);

function toggleCRT() {
  document.body.classList.toggle('crt-on');
  playRetroTone('click');
}
document.getElementById('mnu-toggle-crt')?.addEventListener('click', toggleCRT);
document.getElementById('btn-widget-crt')?.addEventListener('click', toggleCRT);

// Clocks
function updateClocks() {
  const now = new Date();
  const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
  const trayClock = document.getElementById('tray-clock');
  if (trayClock) trayClock.textContent = `${h >= 12 ? '오후' : '오전'} ${h % 12 || 12}:${String(m).padStart(2, '0')}`;
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dateLbl = document.getElementById('digital-date-lbl');
  if (dateLbl) dateLbl.textContent = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} (${days[now.getDay()]})`;
  const clkH = document.getElementById('clk-hour');
  const clkM = document.getElementById('clk-min');
  const clkS = document.getElementById('clk-sec');
  if (clkH) clkH.style.transform = `rotate(${(h % 12) * 30 + m * 0.5}deg)`;
  if (clkM) clkM.style.transform = `rotate(${m * 6}deg)`;
  if (clkS) clkS.style.transform = `rotate(${s * 6}deg)`;
}
setInterval(updateClocks, 1000);
updateClocks();

// ==========================================
// Winamp Jukebox (YouTube Music / YouTube Background Player)
// ==========================================
let jbIndex = 0;
let eqTimer = null;
let ytPlayer = null;
let ytApiReady = false;
let pendingVideoId = null;
const jbVideoCache = {};

(function initYouTubeBackgroundAPI() {
  if (!document.getElementById('yt-bg-player-host')) {
    const host = document.createElement('div');
    host.id = 'yt-bg-player-host';
    host.style.cssText = 'position:fixed; width:1px; height:1px; left:-9999px; top:-9999px; opacity:0; pointer-events:none;';
    host.innerHTML = '<div id="yt-bg-player"></div>';
    document.body.appendChild(host);
  }
  if (!window.YT && !document.querySelector('script[src*="youtube.com/iframe_api"]')) {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }
})();

window.onYouTubeIframeAPIReady = function () {
  ytPlayer = new YT.Player('yt-bg-player', {
    height: '1',
    width: '1',
    playerVars: {
      autoplay: 0,
      controls: 0,
      disablekb: 1,
      fs: 0,
      rel: 0,
      playsinline: 1
    },
    events: {
      onReady: () => {
        ytApiReady = true;
        if (pendingVideoId) {
          const vid = pendingVideoId;
          pendingVideoId = null;
          ytPlayer.loadVideoById(vid);
        }
      },
      onStateChange: e => {
        if (e.data === YT.PlayerState.PLAYING) {
          setEqualizer(true);
        } else if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.BUFFERING) {
          setEqualizer(false);
        } else if (e.data === YT.PlayerState.ENDED) {
          setEqualizer(false);
          jbIndex++;
          updateJukebox(true);
        }
      },
      onError: () => {
        const tracks = archiveItems.filter(i => i.category === '음악');
        if (tracks.length > 1) {
          jbIndex++;
          updateJukebox(true);
        } else {
          setEqualizer(false);
        }
      }
    }
  });
};

function extractYouTubeVideoId(url) {
  if (!url) return null;
  const reg = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|music\.youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/;
  const m = String(url).match(reg);
  return m ? m[1] : null;
}

function normalizeMatchText(str) {
  return String(str || '').toLowerCase().replace(/[\s\(\)\[\]\-\_\.\,\!\?\'\"·]/g, '');
}

async function resolveTrackYouTubeId(track) {
  const cacheKey = track.id || `${track.creator}::${track.title}`;
  if (jbVideoCache[cacheKey]) return jbVideoCache[cacheKey];

  const directId = extractYouTubeVideoId(track.sourceUrl);
  if (directId) {
    jbVideoCache[cacheKey] = directId;
    return directId;
  }

  try {
    const q = `${track.creator} ${track.title}`.trim();
    const res = await fetch(`${GAS_WEB_APP_URL}?action=search&q=${encodeURIComponent(q)}&category=${encodeURIComponent('음악')}`);
    const data = await res.json();
    const candidates = Array.isArray(data.candidates) ? data.candidates : [];

    const normTitle = normalizeMatchText(track.title);
    const normCreator = normalizeMatchText(track.creator);

    let bestVid = null;
    let bestScore = -1;

    for (const cand of candidates) {
      const vid = extractYouTubeVideoId(cand.sourceUrl);
      if (!vid) continue;
      const cTitle = normalizeMatchText(cand.title);
      const cCreator = normalizeMatchText(cand.creator);

      let score = 0;
      if (cTitle === normTitle) score += 50;
      else if (cTitle.includes(normTitle) || normTitle.includes(cTitle)) score += 30;

      if (cCreator === normCreator) score += 50;
      else if (cCreator.includes(normCreator) || normCreator.includes(cCreator)) score += 30;

      if (String(cand.source || '').toLowerCase().includes('youtube')) score += 10;

      if (score > bestScore) {
        bestScore = score;
        bestVid = vid;
      }
    }

    if (bestVid) {
      jbVideoCache[cacheKey] = bestVid;
      return bestVid;
    }
  } catch {}
  return null;
}

function playYouTubeTrackId(videoId) {
  if (!videoId) return;
  if (ytApiReady && ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
    ytPlayer.loadVideoById(videoId);
  } else {
    pendingVideoId = videoId;
  }
}

async function updateJukebox(autoPlay = false) {
  const musicTracks = archiveItems.filter(i => i.category === '음악');
  const trackEl = document.getElementById('jukebox-track');
  const artistEl = document.getElementById('jukebox-artist');
  const ytBtn = document.getElementById('jb-yt');
  if (!trackEl || !artistEl || !ytBtn) return;

  if (!musicTracks.length) {
    trackEl.textContent = '01. MY-ARCHIVE 95 THEME';
    artistEl.textContent = '음악 기록 추가 시 자동 연동';
    ytBtn.href = 'https://music.youtube.com/search?q=synthwave+windows+95';
    return;
  }

  jbIndex = (jbIndex + musicTracks.length) % musicTracks.length;
  const cur = musicTracks[jbIndex];
  const ytMusicSearchUrl = `https://music.youtube.com/search?q=${encodeURIComponent(`${cur.creator} ${cur.title}`)}`;

  trackEl.textContent = `${String(jbIndex + 1).padStart(2, '0')}. ${cur.title}`;
  artistEl.textContent = `${cur.creator} (${cur.genre || '음악'})`;
  ytBtn.href = extractYouTubeVideoId(cur.sourceUrl) ? cur.sourceUrl : ytMusicSearchUrl;

  if (autoPlay) {
    artistEl.textContent = `${cur.creator} — 트랙 매칭 중...`;
    const vid = await resolveTrackYouTubeId(cur);
    if (vid) {
      artistEl.textContent = `${cur.creator} [YT MUSIC PLAY]`;
      ytBtn.href = `https://music.youtube.com/watch?v=${vid}`;
      playYouTubeTrackId(vid);
    } else {
      artistEl.textContent = `${cur.creator} (일치 영상 없음)`;
      setEqualizer(false);
    }
  }
}

function setEqualizer(active) {
  if (eqTimer) clearInterval(eqTimer);
  const bars = document.querySelectorAll('#eq-bars .eq-bar');
  if (!active) { bars.forEach(b => { b.style.height = '18%'; }); return; }
  eqTimer = setInterval(() => { bars.forEach(b => { b.style.height = `${15 + Math.floor(Math.random() * 85)}%`; }); }, 150);
}

document.getElementById('jb-play')?.addEventListener('click', async () => {
  playRetroTone('open');
  const musicTracks = archiveItems.filter(i => i.category === '음악');
  if (!musicTracks.length) {
    setEqualizer(true);
    return;
  }
  if (ytApiReady && ytPlayer && typeof ytPlayer.getPlayerState === 'function' && ytPlayer.getPlayerState() === YT.PlayerState.PAUSED) {
    ytPlayer.playVideo();
    return;
  }
  await updateJukebox(true);
});

document.getElementById('jb-stop')?.addEventListener('click', () => {
  playRetroTone('click');
  setEqualizer(false);
  if (ytApiReady && ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
    ytPlayer.pauseVideo();
  }
});

document.getElementById('jb-prev')?.addEventListener('click', () => {
  jbIndex--;
  playRetroTone('click');
  updateJukebox(true);
});

document.getElementById('jb-next')?.addEventListener('click', () => {
  jbIndex++;
  playRetroTone('click');
  updateJukebox(true);
});

// ==========================================
// GAME PACK 95: 클래식 카드놀이 + 스파이더 + 지뢰찾기 + 아카이브 게임
// ==========================================
function openGamePackWindow() {
  const winId = 'win-gamepack';
  if (document.getElementById(winId)) {
    openWindow(winId);
    return;
  }

  const winEl = document.createElement('div');
  winEl.className = 'floating-win open focused';
  winEl.id = winId;
  winEl.dataset.winTitle = '[*] GAMEPACK95.EXE';
  winEl.style.top = '48px';
  winEl.style.left = '150px';
  winEl.style.width = '740px';

  winEl.innerHTML = `
    <div class="win-titlebar draggable">
      <div class="win-title-left"><span class="win-title-dot" style="background: var(--brutal-yellow);"></span><span>GAMEPACK95.EXE — 윈도우 클래식 카드놀이 &amp; 아카이브 게임</span></div>
      <div class="win-controls">
        <button type="button" class="win-ctrl-btn" data-action="minimize" data-target="${winId}">_</button>
        <button type="button" class="win-ctrl-btn close" data-action="close" data-target="${winId}">X</button>
      </div>
    </div>
    <div class="win-body">
      <div style="display:flex; gap:5px; flex-wrap:wrap; margin-bottom:12px; background:var(--win-gray); padding:6px 8px; border:2px solid #111; box-shadow:var(--bevel-out);">
        <button type="button" class="btn95 yellow sm" id="gp-tab-sol">[1] 카드놀이 (SOL.EXE)</button>
        <button type="button" class="btn95 sm" id="gp-tab-spider">[2] 스파이더 카드놀이</button>
        <button type="button" class="btn95 sm" id="gp-tab-mine">[3] 지뢰찾기</button>
        <button type="button" class="btn95 sm" id="gp-tab-mem">[4] 아카이브 짝맞추기</button>
        <button type="button" class="btn95 sm" id="gp-tab-hl">[5] 별점 하이로우</button>
      </div>

      <!-- 1. 클론다이크 카드놀이 (SOL.EXE) -->
      <div id="gp-panel-sol">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; background:var(--win-gray); padding:6px 10px; border:2px solid #111; box-shadow:var(--bevel-in);">
          <span id="sol-status" style="font-size:0.8rem; font-weight:900;">클릭: 선택 후 대상 클릭 / 더블클릭: 완성 홈 자동 이동</span>
          <button type="button" class="btn95 yellow sm" id="sol-reset">[NEW] 새 게임</button>
        </div>
        <div class="sol-board" id="sol-board"></div>
      </div>

      <!-- 2. 스파이더 카드놀이 (SPIDER.EXE) -->
      <div id="gp-panel-spider" style="display:none;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:8px; background:var(--win-gray); padding:6px 10px; border:2px solid #111; box-shadow:var(--bevel-in);">
          <span id="spider-status" style="font-size:0.8rem; font-weight:900;">완성된 세트: 0 / 8</span>
          <div style="display:flex; gap:5px; align-items:center;">
            <select id="spider-suits" class="win95-select" style="padding:3px 24px 3px 6px; font-size:0.76rem;">
              <option value="1">초급 (1무늬 ♠)</option>
              <option value="2">중급 (2무늬 ♠♥)</option>
            </select>
            <button type="button" class="btn95 green sm" id="spider-deal">카드 배분 (5회)</button>
            <button type="button" class="btn95 yellow sm" id="spider-reset">[NEW] 새 게임</button>
          </div>
        </div>
        <div class="sol-board" id="spider-board"></div>
      </div>

      <!-- 3. 지뢰찾기 -->
      <div id="gp-panel-mine" style="display:none; text-align:center;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; background:var(--win-gray); padding:6px 10px; border:2px solid #111; box-shadow:var(--bevel-in);">
          <span id="gp-mine-left" style="font-family:monospace; font-size:1.1rem; font-weight:900; background:#111; color:#ff4757; padding:2px 8px;">010</span>
          <button type="button" class="btn95 yellow sm" id="gp-mine-reset">[:-)] 다시 시작</button>
          <span style="font-size:0.75rem; font-weight:800;">우클릭: 깃발 [F]</span>
        </div>
        <div class="mine-grid" id="gp-mine-grid"></div>
      </div>

      <!-- 4. 아카이브 짝맞추기 카드 -->
      <div id="gp-panel-mem" style="display:none;">
        <div style="display:flex; justify-content:space-between; align-items:center; background:var(--win-gray); padding:6px 10px; border:2px solid #111; box-shadow:var(--bevel-in);">
          <span id="gp-mem-stat" style="font-size:0.8rem; font-weight:900;">시도: 0회 | 매칭: 0 / 6쌍</span>
          <button type="button" class="btn95 green sm" id="gp-mem-reset">[NEW] 새 덱 섞기</button>
        </div>
        <div style="font-size:0.76rem; font-weight:700; color:#4a4a4a; margin-top:6px;">* 내 아카이브에 등록된 작품 표지와 제목으로 구성된 12장 카드의 짝을 맞추십시오.</div>
        <div class="mem-grid" id="gp-mem-grid"></div>
      </div>

      <!-- 5. 별점 하이로우 카드 -->
      <div id="gp-panel-hl" style="display:none;">
        <div style="display:flex; justify-content:space-between; align-items:center; background:var(--win-gray); padding:6px 10px; border:2px solid #111; box-shadow:var(--bevel-in);">
          <span id="gp-hl-score" style="font-size:0.82rem; font-weight:900;">연승 기록: 0연승</span>
          <button type="button" class="btn95 sky sm" id="gp-hl-reset">[NEW] 라운드 초기화</button>
        </div>
        <div style="font-size:0.78rem; font-weight:800; margin-top:8px;">Q. 오른쪽 작품의 <strong>평점</strong>이 왼쪽 작품보다 높거나 같을까요, 낮을까요?</div>
        <div class="hl-arena" id="gp-hl-arena"></div>
      </div>
    </div>
  `;

  (document.getElementById('dynamic-windows-container') || document.body).appendChild(winEl);
  enableWindowDrag(winEl);
  focusWindow(winEl);
  playRetroTone('open');

  const tabs = [
    { btn: 'gp-tab-sol', panel: 'gp-panel-sol', init: () => initKlondike() },
    { btn: 'gp-tab-spider', panel: 'gp-panel-spider', init: () => initSpider() },
    { btn: 'gp-tab-mine', panel: 'gp-panel-mine', init: () => initGpMine() },
    { btn: 'gp-tab-mem', panel: 'gp-panel-mem', init: () => initGpMemory() },
    { btn: 'gp-tab-hl', panel: 'gp-panel-hl', init: () => initGpHighLow() }
  ];

  tabs.forEach(t => {
    document.getElementById(t.btn).addEventListener('click', () => {
      playRetroTone('click');
      tabs.forEach(x => {
        document.getElementById(x.btn).classList.remove('yellow');
        document.getElementById(x.panel).style.display = 'none';
      });
      document.getElementById(t.btn).classList.add('yellow');
      document.getElementById(t.panel).style.display = 'block';
      t.init();
    });
  });

  document.getElementById('sol-reset').addEventListener('click', initKlondike);
  document.getElementById('spider-reset').addEventListener('click', initSpider);
  document.getElementById('spider-suits').addEventListener('change', initSpider);
  document.getElementById('spider-deal').addEventListener('click', dealSpiderRow);
  document.getElementById('gp-mine-reset').addEventListener('click', initGpMine);
  document.getElementById('gp-mem-reset').addEventListener('click', initGpMemory);
  document.getElementById('gp-hl-reset').addEventListener('click', () => { hlStreak = 0; initGpHighLow(); });

  initKlondike();
}

const CARD_SUITS = ['♠', '♥', '♦', '♣'];
const CARD_RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function isRedSuit(suit) {
  return suit === '♥' || suit === '♦';
}

function renderCardHTML(card, extraCls = '') {
  if (!card.faceUp) {
    return `<div class="p-card back ${extraCls}"></div>`;
  }
  const colorCls = isRedSuit(card.suit) ? 'red' : 'black';
  const lbl = `${CARD_RANKS[card.rank - 1]}${card.suit}`;
  return `
    <div class="p-card ${colorCls} ${extraCls}">
      <div style="line-height:1;">${lbl}</div>
      <div class="p-card-center">${card.suit}</div>
      <div style="line-height:1; text-align:right;">${lbl}</div>
    </div>
  `;
}

// 1. 클론다이크 카드놀이
let solState = null;

function initKlondike() {
  const deck = [];
  for (const suit of CARD_SUITS) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({ suit, rank, faceUp: false });
    }
  }
  deck.sort(() => Math.random() - 0.5);

  const tableau = Array.from({ length: 7 }, () => []);
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const c = deck.pop();
      c.faceUp = (row === col);
      tableau[col].push(c);
    }
  }

  solState = {
    stock: deck,
    waste: [],
    foundations: [[], [], [], []],
    tableau,
    selected: null
  };
  renderKlondike();
}

function drawSolStock() {
  if (!solState) return;
  solState.selected = null;
  if (solState.stock.length > 0) {
    const c = solState.stock.pop();
    c.faceUp = true;
    solState.waste.push(c);
  } else {
    while (solState.waste.length > 0) {
      const c = solState.waste.pop();
      c.faceUp = false;
      solState.stock.push(c);
    }
  }
  playRetroTone('click');
  renderKlondike();
}

function tryAutoMoveToFoundation(card, removeFn) {
  const fIdx = CARD_SUITS.indexOf(card.suit);
  const fPile = solState.foundations[fIdx];
  if (fPile.length + 1 === card.rank) {
    removeFn();
    fPile.push(card);
    solState.selected = null;
    playRetroTone('open');
    checkSolWin();
    renderKlondike();
    return true;
  }
  return false;
}

function checkSolWin() {
  const total = solState.foundations.reduce((s, p) => s + p.length, 0);
  if (total === 52) {
    playRetroTone('boot');
    document.getElementById('sol-status').textContent = '[CLEAR] 축하합니다! 52장 카드놀이를 완성했습니다!';
  }
}

function renderKlondike() {
  const board = document.getElementById('sol-board');
  if (!board || !solState) return;

  const sel = solState.selected;
  const wasteTop = solState.waste[solState.waste.length - 1];
  const wasteSel = sel && sel.from === 'waste' ? 'selected' : '';

  let topHTML = `<div class="sol-top-row">`;
  topHTML += solState.stock.length
    ? `<div id="sol-stock" class="p-card back" title="카드 뽑기 (${solState.stock.length}장)"></div>`
    : `<div id="sol-stock" class="card-slot" style="cursor:pointer;">다시</div>`;
  topHTML += wasteTop
    ? `<div id="sol-waste">${renderCardHTML(wasteTop, wasteSel)}</div>`
    : `<div class="card-slot">버림</div>`;
  topHTML += `<div></div>`;
  for (let f = 0; f < 4; f++) {
    const pile = solState.foundations[f];
    const top = pile[pile.length - 1];
    topHTML += top
      ? `<div class="sol-found" data-f="${f}">${renderCardHTML(top)}</div>`
      : `<div class="card-slot sol-found" data-f="${f}">${CARD_SUITS[f]}</div>`;
  }
  topHTML += `</div>`;

  let colsHTML = `<div class="sol-cols">`;
  for (let c = 0; c < 7; c++) {
    const colCards = solState.tableau[c];
    colsHTML += `<div class="card-stack sol-col" data-c="${c}">`;
    if (!colCards.length) {
      colsHTML += `<div class="card-slot">K</div>`;
    } else {
      colCards.forEach((card, idx) => {
        const isSel = sel && sel.from === 'tab' && sel.col === c && idx >= sel.idx ? 'selected' : '';
        colsHTML += `<div class="sol-card-node" data-c="${c}" data-idx="${idx}">${renderCardHTML(card, isSel)}</div>`;
      });
    }
    colsHTML += `</div>`;
  }
  colsHTML += `</div>`;

  board.innerHTML = topHTML + colsHTML;

  document.getElementById('sol-stock')?.addEventListener('click', drawSolStock);

  const wasteEl = document.getElementById('sol-waste');
  if (wasteEl && wasteTop) {
    wasteEl.addEventListener('click', () => {
      if (sel && sel.from === 'waste') solState.selected = null;
      else solState.selected = { from: 'waste' };
      playRetroTone('click');
      renderKlondike();
    });
    wasteEl.addEventListener('dblclick', () => {
      tryAutoMoveToFoundation(wasteTop, () => solState.waste.pop());
    });
  }

  board.querySelectorAll('.sol-found').forEach(el => {
    el.addEventListener('click', () => {
      if (!solState.selected) return;
      const fIdx = Number(el.dataset.f);
      const targetSuit = CARD_SUITS[fIdx];
      const fPile = solState.foundations[fIdx];

      let movingCard = null;
      if (solState.selected.from === 'waste') {
        movingCard = solState.waste[solState.waste.length - 1];
      } else if (solState.selected.from === 'tab') {
        const colArr = solState.tableau[solState.selected.col];
        if (solState.selected.idx === colArr.length - 1) movingCard = colArr[colArr.length - 1];
      }

      if (movingCard && movingCard.suit === targetSuit && fPile.length + 1 === movingCard.rank) {
        if (solState.selected.from === 'waste') solState.waste.pop();
        else {
          const colArr = solState.tableau[solState.selected.col];
          colArr.pop();
          if (colArr.length) colArr[colArr.length - 1].faceUp = true;
        }
        fPile.push(movingCard);
        solState.selected = null;
        playRetroTone('open');
        checkSolWin();
        renderKlondike();
      }
    });
  });

  board.querySelectorAll('.sol-col').forEach(colEl => {
    const targetCol = Number(colEl.dataset.c);

    colEl.querySelectorAll('.sol-card-node').forEach(node => {
      const idx = Number(node.dataset.idx);
      const card = solState.tableau[targetCol][idx];

      node.addEventListener('dblclick', e => {
        e.stopPropagation();
        if (!card.faceUp || idx !== solState.tableau[targetCol].length - 1) return;
        tryAutoMoveToFoundation(card, () => {
          const colArr = solState.tableau[targetCol];
          colArr.pop();
          if (colArr.length) colArr[colArr.length - 1].faceUp = true;
        });
      });

      node.addEventListener('click', e => {
        e.stopPropagation();
        if (!card.faceUp) return;

        if (solState.selected) {
          if (solState.selected.from === 'tab' && solState.selected.col === targetCol && solState.selected.idx === idx) {
            solState.selected = null;
            renderKlondike();
            return;
          }
          if (attemptMoveToTableau(targetCol)) return;
        }
        solState.selected = { from: 'tab', col: targetCol, idx };
        playRetroTone('click');
        renderKlondike();
      });
    });

    colEl.addEventListener('click', () => {
      if (solState.selected && solState.tableau[targetCol].length === 0) {
        attemptMoveToTableau(targetCol);
      }
    });
  });
}

function attemptMoveToTableau(targetCol) {
  const sel = solState.selected;
  if (!sel) return false;

  let movingCards = [];
  if (sel.from === 'waste') {
    movingCards = [solState.waste[solState.waste.length - 1]];
  } else if (sel.from === 'tab') {
    if (sel.col === targetCol) return false;
    movingCards = solState.tableau[sel.col].slice(sel.idx);
  }
  if (!movingCards.length) return false;

  const lead = movingCards[0];
  const destCol = solState.tableau[targetCol];
  const destTop = destCol[destCol.length - 1];

  const canPlace = !destTop
    ? (lead.rank === 13)
    : (destTop.faceUp && isRedSuit(destTop.suit) !== isRedSuit(lead.suit) && destTop.rank === lead.rank + 1);

  if (!canPlace) return false;

  if (sel.from === 'waste') {
    solState.waste.pop();
  } else {
    const srcCol = solState.tableau[sel.col];
    srcCol.splice(sel.idx);
    if (srcCol.length) srcCol[srcCol.length - 1].faceUp = true;
  }

  destCol.push(...movingCards);
  solState.selected = null;
  playRetroTone('click');
  renderKlondike();
  return true;
}

// 2. 스파이더 카드놀이
let spiderState = null;

function initSpider() {
  const suitCount = Number(document.getElementById('spider-suits')?.value) || 1;
  const suitsPool = suitCount === 1 ? ['♠'] : ['♠', '♥'];
  const deck = [];

  for (let set = 0; set < 8; set++) {
    const suit = suitsPool[set % suitsPool.length];
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({ suit, rank, faceUp: false });
    }
  }
  deck.sort(() => Math.random() - 0.5);

  const cols = Array.from({ length: 10 }, () => []);
  for (let i = 0; i < 54; i++) {
    const c = deck.pop();
    cols[i % 10].push(c);
  }
  cols.forEach(col => {
    if (col.length) col[col.length - 1].faceUp = true;
  });

  spiderState = {
    stock: deck,
    cols,
    completed: 0,
    selected: null
  };
  updateSpiderHeader();
  renderSpider();
}

function updateSpiderHeader() {
  if (!spiderState) return;
  const dealsLeft = Math.floor(spiderState.stock.length / 10);
  const dealBtn = document.getElementById('spider-deal');
  if (dealBtn) {
    dealBtn.textContent = `카드 배분 (${dealsLeft}회)`;
    dealBtn.disabled = dealsLeft === 0;
  }
  const st = document.getElementById('spider-status');
  if (st) {
    st.textContent = spiderState.completed === 8
      ? '[CLEAR] 축하합니다! 스파이더 카드놀이 8세트를 모두 완성했습니다!'
      : `완성된 세트: ${spiderState.completed} / 8`;
  }
}

function dealSpiderRow() {
  if (!spiderState || spiderState.stock.length < 10) return;
  if (spiderState.cols.some(c => c.length === 0)) {
    alert('빈 열이 있을 때는 새 카드를 배분할 수 없습니다. 모든 열에 최소 1장의 카드를 놓으십시오.');
    return;
  }
  for (let c = 0; c < 10; c++) {
    const card = spiderState.stock.pop();
    card.faceUp = true;
    spiderState.cols[c].push(card);
    checkSpiderRunComplete(c);
  }
  spiderState.selected = null;
  playRetroTone('open');
  updateSpiderHeader();
  renderSpider();
}

function isMovableSpiderSequence(colArr, startIdx) {
  if (!colArr[startIdx] || !colArr[startIdx].faceUp) return false;
  for (let i = startIdx; i < colArr.length - 1; i++) {
    if (colArr[i].suit !== colArr[i + 1].suit || colArr[i].rank !== colArr[i + 1].rank + 1) {
      return false;
    }
  }
  return true;
}

function checkSpiderRunComplete(colIdx) {
  const colArr = spiderState.cols[colIdx];
  if (colArr.length < 13) return;
  const tail = colArr.slice(-13);
  if (tail[0].rank !== 13) return;
  const suit = tail[0].suit;
  for (let i = 0; i < 13; i++) {
    if (!tail[i].faceUp || tail[i].suit !== suit || tail[i].rank !== 13 - i) return;
  }
  colArr.splice(-13);
  if (colArr.length) colArr[colArr.length - 1].faceUp = true;
  spiderState.completed += 1;
  playRetroTone('boot');
  updateSpiderHeader();
}

function renderSpider() {
  const board = document.getElementById('spider-board');
  if (!board || !spiderState) return;

  const sel = spiderState.selected;
  let html = `<div class="spider-cols">`;
  for (let c = 0; c < 10; c++) {
    const colArr = spiderState.cols[c];
    html += `<div class="card-stack sp-col" data-c="${c}">`;
    if (!colArr.length) {
      html += `<div class="card-slot" style="height:64px;">빈칸</div>`;
    } else {
      colArr.forEach((card, idx) => {
        const isSel = sel && sel.col === c && idx >= sel.idx ? 'selected' : '';
        html += `<div class="sp-card-node" data-c="${c}" data-idx="${idx}">${renderCardHTML(card, isSel)}</div>`;
      });
    }
    html += `</div>`;
  }
  html += `</div>`;
  board.innerHTML = html;

  board.querySelectorAll('.sp-col').forEach(colEl => {
    const targetCol = Number(colEl.dataset.c);

    colEl.querySelectorAll('.sp-card-node').forEach(node => {
      const idx = Number(node.dataset.idx);
      node.addEventListener('click', e => {
        e.stopPropagation();
        if (spiderState.selected) {
          if (spiderState.selected.col === targetCol && spiderState.selected.idx === idx) {
            spiderState.selected = null;
            renderSpider();
            return;
          }
          if (attemptMoveSpider(targetCol)) return;
        }
        if (isMovableSpiderSequence(spiderState.cols[targetCol], idx)) {
          spiderState.selected = { col: targetCol, idx };
          playRetroTone('click');
          renderSpider();
        }
      });
    });

    colEl.addEventListener('click', () => {
      if (spiderState.selected && spiderState.cols[targetCol].length === 0) {
        attemptMoveSpider(targetCol);
      }
    });
  });
}

function attemptMoveSpider(targetCol) {
  const sel = spiderState.selected;
  if (!sel || sel.col === targetCol) return false;

  const srcCol = spiderState.cols[sel.col];
  const moving = srcCol.slice(sel.idx);
  if (!moving.length) return false;

  const destCol = spiderState.cols[targetCol];
  const destTop = destCol[destCol.length - 1];
  const canPlace = !destTop || (destTop.faceUp && destTop.rank === moving[0].rank + 1);
  if (!canPlace) return false;

  srcCol.splice(sel.idx);
  if (srcCol.length) srcCol[srcCol.length - 1].faceUp = true;
  destCol.push(...moving);

  spiderState.selected = null;
  playRetroTone('click');
  checkSpiderRunComplete(targetCol);
  renderSpider();
  return true;
}

// 3. 지뢰찾기
const MINE_SIZE = 8, MINE_TOTAL = 10;
let mineBoard = [], mineGameOver = false;

function initGpMine() {
  mineGameOver = false;
  const resetBtn = document.getElementById('gp-mine-reset');
  if (resetBtn) resetBtn.textContent = '[:-)] 다시 시작';
  mineBoard = Array.from({ length: MINE_SIZE * MINE_SIZE }, (_, idx) => ({ idx, mine: false, revealed: false, flagged: false, count: 0 }));
  let placed = 0;
  while (placed < MINE_TOTAL) {
    const r = Math.floor(Math.random() * mineBoard.length);
    if (!mineBoard[r].mine) { mineBoard[r].mine = true; placed++; }
  }
  mineBoard.forEach(cell => {
    if (!cell.mine) cell.count = getMineNeighbors(cell.idx).filter(n => mineBoard[n].mine).length;
  });
  renderGpMine();
}

function getMineNeighbors(idx) {
  const r = Math.floor(idx / MINE_SIZE), c = idx % MINE_SIZE, res = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < MINE_SIZE && nc >= 0 && nc < MINE_SIZE) res.push(nr * MINE_SIZE + nc);
    }
  }
  return res;
}

function revealGpMine(idx) {
  const cell = mineBoard[idx];
  if (mineGameOver || cell.revealed || cell.flagged) return;
  cell.revealed = true;
  if (cell.mine) {
    mineGameOver = true;
    playRetroTone('boom');
    document.getElementById('gp-mine-reset').textContent = '[X-(] 게임 오버';
    mineBoard.forEach(c => { if (c.mine) c.revealed = true; });
    renderGpMine();
    return;
  }
  playRetroTone('click');
  if (cell.count === 0) getMineNeighbors(idx).forEach(n => revealGpMine(n));
  if (mineBoard.filter(c => !c.mine && !c.revealed).length === 0) {
    mineGameOver = true;
    playRetroTone('boot');
    document.getElementById('gp-mine-reset').textContent = '[B-)] 클리어!';
  }
  renderGpMine();
}

function renderGpMine() {
  const grid = document.getElementById('gp-mine-grid');
  if (!grid) return;
  grid.innerHTML = '';
  const flagged = mineBoard.filter(c => c.flagged).length;
  document.getElementById('gp-mine-left').textContent = String(Math.max(0, MINE_TOTAL - flagged)).padStart(3, '0');
  mineBoard.forEach(cell => {
    const div = document.createElement('div');
    div.className = 'mine-cell' + (cell.revealed ? ' revealed' : '') + (cell.revealed && cell.mine ? ' boom' : '');
    if (cell.revealed) {
      div.textContent = cell.mine ? '[*]' : (cell.count > 0 ? cell.count : '');
      if (cell.count === 1) div.style.color = '#000080';
      if (cell.count === 2) div.style.color = '#008000';
      if (cell.count >= 3) div.style.color = '#ff4757';
    } else if (cell.flagged) {
      div.textContent = '[F]';
      div.style.color = '#ff4757';
    }
    div.addEventListener('click', () => revealGpMine(cell.idx));
    div.addEventListener('contextmenu', e => {
      e.preventDefault();
      if (mineGameOver || cell.revealed) return;
      cell.flagged = !cell.flagged;
      playRetroTone('click');
      renderGpMine();
    });
    grid.appendChild(div);
  });
}

// 4 & 5. 아카이브 짝맞추기 & 별점 하이로우 카드
function getGameDeckPool() {
  if (archiveItems.length >= 6) return [...archiveItems];
  const fallbackPool = [
    { id: 'S1', title: '소나기', creator: '황순원', category: '도서', rating: 5, watchDate: '2026-09-10', coverUrl: FALLBACK_COVER },
    { id: 'S2', title: '아몬드', creator: '손원평', category: '도서', rating: 4, watchDate: '2026-08-22', coverUrl: FALLBACK_COVER },
    { id: 'S3', title: '밤양갱', creator: '비비', category: '음악', rating: 5, watchDate: '2026-10-05', coverUrl: FALLBACK_COVER },
    { id: 'S4', title: '인셉션', creator: '크리스토퍼 놀란', category: '영상', rating: 5, watchDate: '2026-07-14', coverUrl: FALLBACK_COVER },
    { id: 'S5', title: '어린 왕자', creator: '생텍쥐페리', category: '도서', rating: 5, watchDate: '2026-06-01', coverUrl: FALLBACK_COVER },
    { id: 'S6', title: 'Hype Boy', creator: 'NewJeans', category: '음악', rating: 4, watchDate: '2026-10-18', coverUrl: FALLBACK_COVER }
  ];
  return [...archiveItems, ...fallbackPool];
}

function initGpMemory() {
  const pool = getGameDeckPool().sort(() => Math.random() - 0.5).slice(0, 6);
  const deck = [...pool, ...pool]
    .map((item, idx) => ({ uid: idx, key: item.id || item.title, item, flipped: false, matched: false }))
    .sort(() => Math.random() - 0.5);

  let flippedCards = [], lockBoard = false, attempts = 0, matchedPairs = 0;
  const statEl = document.getElementById('gp-mem-stat');
  const grid = document.getElementById('gp-mem-grid');

  function renderMem() {
    statEl.textContent = `시도: ${attempts}회 | 매칭: ${matchedPairs} / 6쌍`;
    grid.innerHTML = '';
    deck.forEach(card => {
      const el = document.createElement('div');
      el.className = 'mem-card' + (card.flipped ? ' flipped' : '') + (card.matched ? ' matched' : '');
      if (card.flipped || card.matched) {
        el.innerHTML = `
          <img src="${esc(card.item.coverUrl || FALLBACK_COVER)}" alt="" onerror="this.onerror=null;this.src='${FALLBACK_COVER}';" />
          <div style="width:100%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(card.item.title)}</div>
        `;
      } else {
        el.innerHTML = `<div>[ARCHIVE]</div><div style="font-size:0.65rem; color:#ffffff; margin-top:2px;">CARD</div>`;
      }

      el.addEventListener('click', () => {
        if (lockBoard || card.flipped || card.matched) return;
        card.flipped = true;
        flippedCards.push(card);
        playRetroTone('click');
        renderMem();

        if (flippedCards.length === 2) {
          attempts++;
          lockBoard = true;
          const [c1, c2] = flippedCards;
          if (c1.key === c2.key) {
            c1.matched = true; c2.matched = true; matchedPairs++;
            flippedCards = []; lockBoard = false;
            playRetroTone('open');
            renderMem();
            if (matchedPairs === 6) {
              playRetroTone('boot');
              statEl.textContent = `[CLEAR] 총 ${attempts}회 만에 6쌍 모두 매칭 완료!`;
            }
          } else {
            setTimeout(() => {
              c1.flipped = false; c2.flipped = false;
              flippedCards = []; lockBoard = false;
              renderMem();
            }, 650);
          }
        }
      });
      grid.appendChild(el);
    });
  }
  renderMem();
}

let hlStreak = 0;
function initGpHighLow() {
  const pool = getGameDeckPool().sort(() => Math.random() - 0.5);
  const leftItem = pool[0], rightItem = pool[1];
  const arena = document.getElementById('gp-hl-arena');
  const scoreEl = document.getElementById('gp-hl-score');
  scoreEl.textContent = `연승 기록: ${hlStreak}연승`;

  arena.innerHTML = `
    <div class="hl-card">
      <img src="${esc(leftItem.coverUrl || FALLBACK_COVER)}" alt="" onerror="this.onerror=null;this.src='${FALLBACK_COVER}';" />
      <div style="font-size:0.74rem; font-weight:800; color:#4a4a4a;">[${esc(leftItem.category)}] ${esc(leftItem.creator)}</div>
      <div style="font-size:0.95rem; font-weight:900; margin:3px 0 8px;">${esc(leftItem.title)}</div>
      <div style="background:var(--brutal-yellow); border:2px solid #111; padding:5px; font-weight:900; font-size:0.86rem;">
        평점: ${Number(leftItem.rating)}점 (${esc(leftItem.watchDate)})
      </div>
    </div>
    <div class="hl-card">
      <img src="${esc(rightItem.coverUrl || FALLBACK_COVER)}" alt="" onerror="this.onerror=null;this.src='${FALLBACK_COVER}';" />
      <div style="font-size:0.74rem; font-weight:800; color:#4a4a4a;">[${esc(rightItem.category)}] ${esc(rightItem.creator)}</div>
      <div style="font-size:0.95rem; font-weight:900; margin:3px 0 8px;">${esc(rightItem.title)}</div>
      <div id="hl-right-reveal" style="background:var(--win-gray); border:2px solid #111; padding:5px; font-weight:900; font-size:0.86rem;">
        평점: [ ??? ]
      </div>
      <div id="hl-btn-box" style="display:flex; gap:6px; margin-top:8px;">
        <button type="button" class="btn95 green sm" style="flex:1;" id="btn-hl-up">높거나 같음 (UP)</button>
        <button type="button" class="btn95 pink sm" style="flex:1;" id="btn-hl-down">낮음 (DOWN)</button>
      </div>
    </div>
  `;

  function judge(guessUp) {
    const lVal = Number(leftItem.rating) || 4;
    const rVal = Number(rightItem.rating) || 4;
    const win = guessUp ? (rVal >= lVal) : (rVal < lVal);
    const rev = document.getElementById('hl-right-reveal');
    rev.textContent = `평점: ${rVal}점 (${rightItem.watchDate})`;
    if (win) {
      hlStreak++;
      playRetroTone('open');
      rev.style.background = 'var(--brutal-green)';
      scoreEl.textContent = `[정답] 연승 기록: ${hlStreak}연승!`;
    } else {
      hlStreak = 0;
      playRetroTone('boom');
      rev.style.background = 'var(--brutal-pink)';
      rev.style.color = '#ffffff';
      scoreEl.textContent = `[실패] 연승 초기화 (0연승)`;
    }
    document.getElementById('hl-btn-box').innerHTML = `<button type="button" class="btn95 yellow sm" style="width:100%;" id="btn-hl-next">다음 카드 대결 &gt;&gt;</button>`;
    document.getElementById('btn-hl-next').addEventListener('click', initGpHighLow);
  }

  document.getElementById('btn-hl-up').addEventListener('click', () => judge(true));
  document.getElementById('btn-hl-down').addEventListener('click', () => judge(false));
}

document.getElementById('icon-mine')?.addEventListener('click', openGamePackWindow);
document.getElementById('sm-mine')?.addEventListener('click', openGamePackWindow);

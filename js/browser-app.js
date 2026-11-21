// ============================================================
// MY-ARCHIVE 95 OS — Virtual Retro Browser (EXPLORER95.EXE) & OS Shell
// ============================================================

window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
window.__MOD_VERSIONS.browserApp = 'v2026.11.22-01';

const BROWSER_BM_CACHE_KEY = 'myarchive95_bookmarks_v1';
const OS_PREFS_CACHE_KEY = 'myarchive95_osprefs_v1';

const browserState = {
  history: [],
  historyIdx: -1,
  currentPage: null, // { url, title, creator, category, coverUrl, isYouTube, videoId }
  viewMode: 'reader', // 'reader' | 'iframe'
  bookmarks: [],
  bmFilter: 'ALL',
  abortCtrl: null
};

const defaultOsPrefs = {
  ownerName: '문태양',
  wallpaper: 'teal', // 'teal' | 'navy' | 'checker' | 'grid' | 'purple'
  crtScanline: false
};

// ============================================================
// 1. OS 개인화 환경설정 & 바탕화면 우클릭 메뉴
// ============================================================
function loadOsPrefs() {
  return { ...defaultOsPrefs, ...loadLocalCache(OS_PREFS_CACHE_KEY, {}) };
}

function saveOsPrefs(prefs) {
  saveLocalCache(OS_PREFS_CACHE_KEY, prefs);
  applyOsPrefs(prefs);
}

function applyOsPrefs(prefs) {
  const p = prefs || loadOsPrefs();
  const root = document.body;
  if (!root) return;

  root.dataset.osWallpaper = p.wallpaper || 'teal';
  root.classList.toggle('crt-scanlines-on', Boolean(p.crtScanline));

  const statusLeft = document.getElementById('status-left');
  if (statusLeft && p.ownerName) {
    statusLeft.title = `${p.ownerName}의 MY-ARCHIVE 95 개인용 워크스테이션`;
  }
}

function initDesktopShellEnhancements() {
  applyOsPrefs();

  // 1. 바탕화면 아이콘 자동 등록 (없을 경우)
  const iconContainer = document.querySelector('.desktop-icons');
  if (iconContainer && !document.getElementById('icon-browser')) {
    const iconBtn = document.createElement('button');
    iconBtn.type = 'button';
    iconBtn.className = 'desk-icon';
    iconBtn.id = 'icon-browser';
    iconBtn.innerHTML = `
      <div class="desk-icon-box" style="background:var(--brutal-sky);">🌐</div>
      <span>인터넷 탐색기</span>
    `;
    iconBtn.addEventListener('click', () => openVirtualBrowser());
    iconContainer.appendChild(iconBtn);
  }

  // 2. 시작 메뉴 항목 자동 등록 (없을 경우)
  const startMenuList = document.querySelector('#start-menu .start-menu-items') || document.getElementById('start-menu');
  if (startMenuList && !document.getElementById('sm-browser')) {
    const itemBrowser = document.createElement('button');
    itemBrowser.type = 'button';
    itemBrowser.className = 'start-item';
    itemBrowser.id = 'sm-browser';
    itemBrowser.innerHTML = `<span>🌐</span><span>인터넷 탐색기 95 (YouTube·웹)</span>`;
    itemBrowser.addEventListener('click', () => openVirtualBrowser());

    const itemDisplay = document.createElement('button');
    itemDisplay.type = 'button';
    itemDisplay.className = 'start-item';
    itemDisplay.id = 'sm-display';
    itemDisplay.innerHTML = `<span>🎨</span><span>디스플레이 등록 정보 (테마·CRT)</span>`;
    itemDisplay.addEventListener('click', () => openDisplayPropsWindow());

    startMenuList.appendChild(itemBrowser);
    startMenuList.appendChild(itemDisplay);
  }

  // 3. 상단 메뉴바 '프로그램/도구' 확장 항목 추가
  const firstMenuDrop = document.querySelector('.menu-item-wrap .menu-dropdown');
  if (firstMenuDrop && !document.getElementById('mnu-open-browser')) {
    const mnuBr = document.createElement('button');
    mnuBr.type = 'button';
    mnuBr.className = 'menu-drop-item';
    mnuBr.id = 'mnu-open-browser';
    mnuBr.textContent = '🌐 인터넷 탐색기 95 열기...';
    mnuBr.addEventListener('click', () => openVirtualBrowser());
    firstMenuDrop.prepend(mnuBr);
  }

  // 4. 창 제목 표시줄 더블클릭 시 최대화/원래 크기 토글
  document.addEventListener('dblclick', e => {
    const titlebar = e.target.closest('.win-titlebar');
    if (!titlebar || e.target.closest('.win-controls')) return;
    const win = titlebar.closest('.floating-win');
    if (!win) return;
    win.classList.toggle('win-maximized');
    playRetroTone('click');
  });

  // 5. 바탕화면 우클릭 컨텍스트 메뉴
  ensureDesktopContextMenu();
  document.addEventListener('contextmenu', e => {
    // 입력창이나 창 내부가 아닌 바탕화면 영역 우클릭 시
    if (e.target.closest('.floating-win, #start-menu, .taskbar, .top-menubar, input, textarea')) return;
    e.preventDefault();
    showDesktopContextMenu(e.clientX, e.clientY);
  });

  document.addEventListener('click', () => {
    const ctx = document.getElementById('win95-desk-ctx');
    if (ctx) ctx.style.display = 'none';
  });
}

function ensureDesktopContextMenu() {
  if (document.getElementById('win95-desk-ctx')) return;
  const menu = document.createElement('div');
  menu.id = 'win95-desk-ctx';
  menu.style.cssText = `
    display:none; position:fixed; z-index:99999; width:215px;
    background:var(--win-gray, #c0c0c0); border:2px solid #111111;
    box-shadow:3px 3px 0px #111111, inset 1px 1px 0 #ffffff;
    padding:3px; font-size:0.8rem; font-weight:800;
  `;
  menu.innerHTML = `
    <button type="button" class="ctx-item" data-ctx="browser">🌐 인터넷 탐색기 95 열기</button>
    <button type="button" class="ctx-item" data-ctx="jukebox">🎵 주크박스 95 열기</button>
    <button type="button" class="ctx-item" data-ctx="new">➕ 새 감상 기록 등록</button>
    <button type="button" class="ctx-item" data-ctx="memo">📝 퀵 메모장 열기</button>
    <div style="height:2px; background:#808080; border-bottom:1px solid #fff; margin:3px 2px;"></div>
    <button type="button" class="ctx-item" data-ctx="sync">🔄 구글 시트 새로 고침(E)</button>
    <button type="button" class="ctx-item" data-ctx="display">🎨 디스플레이 등록 정보(R)...</button>
  `;
  document.body.appendChild(menu);

  menu.querySelectorAll('.ctx-item').forEach(btn => {
    btn.style.cssText = `
      display:block; width:100%; text-align:left; background:transparent;
      border:0; padding:6px 10px; font-weight:800; cursor:pointer; color:#111111;
    `;
    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#000080';
      btn.style.color = '#ffffff';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'transparent';
      btn.style.color = '#111111';
    });
    btn.addEventListener('click', () => {
      menu.style.display = 'none';
      const act = btn.dataset.ctx;
      if (act === 'browser') openVirtualBrowser();
      else if (act === 'jukebox') { openWindow('win-jukebox'); updateJukebox(); }
      else if (act === 'new') openRegisterModal();
      else if (act === 'memo') openMemoWindow();
      else if (act === 'sync') loadArchiveData(true);
      else if (act === 'display') openDisplayPropsWindow();
    });
  });
}

function showDesktopContextMenu(x, y) {
  const menu = document.getElementById('win95-desk-ctx');
  if (!menu) return;
  menu.style.display = 'block';
  const maxX = window.innerWidth - 225;
  const maxY = window.innerHeight - 230;
  menu.style.left = `${Math.max(8, Math.min(x, maxX))}px`;
  menu.style.top = `${Math.max(28, Math.min(y, maxY))}px`;
  playRetroTone('click');
}

// ============================================================
// 2. 디스플레이 등록 정보 (DISPLAY95.EXE — 배경 패턴 & CRT 모니터 효과)
// ============================================================
function openDisplayPropsWindow() {
  let win = document.getElementById('win-display-props');
  if (!win) {
    win = document.createElement('div');
    win.className = 'floating-win';
    win.id = 'win-display-props';
    win.dataset.winTitle = '[🎨] 디스플레이 등록 정보';
    win.style.top = '90px';
    win.style.left = '240px';
    win.style.width = '420px';
    win.innerHTML = `
      <div class="win-titlebar draggable">
        <div class="win-title-left"><span class="win-title-dot" style="background:var(--brutal-sky);"></span><span>디스플레이 및 시스템 등록 정보</span></div>
        <div class="win-controls">
          <button type="button" class="win-ctrl-btn close" data-action="close" data-target="win-display-props">X</button>
        </div>
      </div>
      <div class="win-body">
        <div class="sunken-box" style="margin-bottom:10px;">
          <div class="box-head"><span>바탕화면 배경 패턴 / 테마</span><span class="tag-mini">WALLPAPER</span></div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
            <button type="button" class="btn95 sm" data-wp="teal">🟩 클래식 틸 (#008080)</button>
            <button type="button" class="btn95 sm" data-wp="navy">🟦 미드나잇 블루 (#000080)</button>
            <button type="button" class="btn95 sm" data-wp="checker">🏁 95 체크 패턴</button>
            <button type="button" class="btn95 sm" data-wp="grid">📐 플로피 그리드</button>
            <button type="button" class="btn95 sm" data-wp="purple" style="grid-column:1 / -1;">🟪 신스웨이브 퍼플</button>
          </div>
        </div>

        <div class="sunken-box" style="margin-bottom:10px;">
          <div class="box-head"><span>브라운관(CRT) 효과 &amp; 사용자 등록</span><span class="tag-mini">SYSTEM</span></div>
          <label style="display:flex; align-items:center; gap:8px; font-size:0.82rem; font-weight:800; margin-bottom:10px; cursor:pointer;">
            <input type="checkbox" id="chk-crt-scanline" />
            <span>CRT 모니터 스캔라인(주사선) 오버레이 켜기</span>
          </label>
          <div>
            <label style="display:block; font-size:0.78rem; font-weight:800; margin-bottom:3px;">워크스테이션 소유자 이름</label>
            <div style="display:flex; gap:6px;">
              <input type="text" id="inp-os-owner" style="flex:1;" placeholder="예: 문태양" />
              <button type="button" class="btn95 yellow sm" id="btn-save-os-prefs">적용</button>
            </div>
          </div>
        </div>
      </div>
    `;
    (document.getElementById('dynamic-windows-container') || document.body).appendChild(win);
    enableWindowDrag(win);

    win.querySelectorAll('[data-wp]').forEach(btn => {
      btn.addEventListener('click', () => {
        const prefs = loadOsPrefs();
        prefs.wallpaper = btn.dataset.wp;
        saveOsPrefs(prefs);
        playRetroTone('click');
      });
    });

    document.getElementById('chk-crt-scanline')?.addEventListener('change', e => {
      const prefs = loadOsPrefs();
      prefs.crtScanline = e.target.checked;
      saveOsPrefs(prefs);
      playRetroTone('click');
    });

    document.getElementById('btn-save-os-prefs')?.addEventListener('click', () => {
      const prefs = loadOsPrefs();
      prefs.ownerName = document.getElementById('inp-os-owner')?.value.trim() || '문태양';
      saveOsPrefs(prefs);
      playRetroTone('open');
      closeWindow('win-display-props');
    });
  }

  const cur = loadOsPrefs();
  const chk = document.getElementById('chk-crt-scanline');
  const inp = document.getElementById('inp-os-owner');
  if (chk) chk.checked = Boolean(cur.crtScanline);
  if (inp) inp.value = cur.ownerName || '문태양';
  openWindow('win-display-props');
}

// ============================================================
// 3. 가상 레트로 웹 & 유튜브 탐색기 (EXPLORER95.EXE)
// ============================================================
function ensureVirtualBrowserWindow() {
  let win = document.getElementById('win-browser');
  if (win) return win;

  win = document.createElement('div');
  win.className = 'floating-win';
  win.id = 'win-browser';
  win.dataset.winTitle = '[🌐] 인터넷 탐색기 95';
  win.style.top = '42px';
  win.style.left = '110px';
  win.style.width = '820px';

  win.innerHTML = `
    <div class="win-titlebar draggable" style="background:#000080; color:#ffffff;">
      <div class="win-title-left">
        <span class="win-title-dot" style="background:var(--brutal-sky);"></span>
        <span id="br-titlebar-text">MY-EXPLORER 95 — Internet &amp; YouTube Browser</span>
      </div>
      <div class="win-controls">
        <button type="button" class="win-ctrl-btn" data-action="minimize" data-target="win-browser">_</button>
        <button type="button" class="win-ctrl-btn close" data-action="close" data-target="win-browser">X</button>
      </div>
    </div>

    <div class="win-body" style="padding:8px;">
      <!-- IE 95 툴바 버튼 줄 -->
      <div style="display:flex; flex-wrap:wrap; gap:4px; align-items:center; margin-bottom:6px; padding-bottom:6px; border-bottom:2px solid #808080;">
        <button type="button" class="btn95 sm" id="br-btn-back" disabled>◀ 뒤로</button>
        <button type="button" class="btn95 sm" id="br-btn-fwd" disabled>앞으로 ▶</button>
        <button type="button" class="btn95 sm" id="br-btn-reload">🔄 새로고침</button>
        <button type="button" class="btn95 sm" id="br-btn-home">🏠 시작페이지</button>
        <button type="button" class="btn95 sky sm" id="br-btn-toggle-bm">📂 즐겨찾기 서랍</button>

        <div style="margin-left:auto; display:flex; gap:4px; flex-wrap:wrap;">
          <button type="button" class="btn95 yellow sm" id="br-btn-add-bm">★ 즐겨찾기 추가</button>
          <button type="button" class="btn95 pink sm" id="br-btn-clip-archive">💾 이 페이지 감상 기록하기</button>
        </div>
      </div>

      <!-- 주소(Address) & 유튜브 검색 통합 바 -->
      <form id="br-addr-form" style="display:flex; gap:5px; align-items:center; margin-bottom:7px;">
        <span style="font-size:0.76rem; font-weight:900; padding:0 4px;">주소(D):</span>
        <input type="text" id="br-addr-inp" placeholder="웹 URL(https://...) 또는 유튜브 검색어 입력 (예: yt: 잔나비 주저하는 연인들을 위해)" style="flex:1; font-family:var(--font-mono); font-size:0.8rem;" />
        <button type="submit" class="btn95 yellow sm">이동 (Go)</button>
        <button type="button" class="btn95 sm" id="br-btn-mode" title="표시 방식 전환">뷰: 리더모드</button>
      </form>

      <!-- 즉석 감상 기록 슬라이드 패널 (클릭 시 열림) -->
      <form id="br-clip-drawer" class="sunken-box" style="display:none; margin-bottom:8px; background:#fffbe6; border:2px solid #111;">
        <div class="box-head" style="margin-bottom:6px;">
          <span>💾 현재 탐색 중인 페이지 · 영상 즉석 아카이브 저장</span>
          <button type="button" class="btn95 sm" id="br-clip-close" style="padding:1px 7px;">닫기 X</button>
        </div>
        <div style="display:grid; grid-template-columns:100px 1fr 1fr 120px; gap:6px; margin-bottom:6px;">
          <select id="br-clip-cat" class="win95-select">
            <option value="도서">도서</option>
            <option value="음악" selected>음악</option>
            <option value="영상">영상</option>
            <option value="기타">기타</option>
          </select>
          <input type="text" id="br-clip-title" placeholder="작품 제목 *" required />
          <input type="text" id="br-clip-creator" placeholder="제작자 / 채널 *" required />
          <select id="br-clip-rating" class="win95-select">
            <option value="5">★★★★★ (5점)</option>
            <option value="4">★★★★☆ (4점)</option>
            <option value="3">★★★☆☆ (3점)</option>
            <option value="2">★★☆☆☆ (2점)</option>
            <option value="1">★☆☆☆☆ (1점)</option>
          </select>
        </div>
        <div style="display:flex; gap:6px;">
          <input type="text" id="br-clip-review" placeholder="지금 듣고 보면서 느낀 한줄평을 바로 남기세요..." required style="flex:1;" />
          <button type="submit" class="btn95 green sm" id="br-clip-submit">시트에 즉시 저장</button>
        </div>
      </form>

      <!-- 메인 뷰포트 + 즐겨찾기 사이드바 -->
      <div style="display:grid; grid-template-columns:1fr; gap:8px;" id="br-main-split">
        <!-- 즐겨찾기 서랍 (토글) -->
        <div id="br-bm-sidebar" class="sunken-box" style="display:none; background:var(--win-gray); max-height:430px; overflow-y:auto;">
          <div class="box-head">
            <span>★ 내 즐겨찾기 폴더</span>
            <span class="tag-mini" id="br-bm-count">0건</span>
          </div>
          <div style="display:flex; gap:4px; margin-bottom:6px; flex-wrap:wrap;">
            ${['ALL', '도서', '음악', '영상', '기타'].map(c => `
              <button type="button" class="btn95 sm" data-bm-cat="${c}" style="padding:2px 6px; font-size:0.7rem;">${c === 'ALL' ? '전체' : c}</button>
            `).join('')}
          </div>
          <div id="br-bm-list" style="display:flex; flex-direction:column; gap:5px;"></div>
        </div>

        <!-- 가상 브라우저 뷰포트 -->
        <div id="br-viewport" class="sunken-box" style="background:#ffffff; min-height:390px; max-height:440px; overflow-y:auto; padding:12px;">
        </div>
      </div>

      <!-- IE 95 하단 상태 표시줄 -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; padding:3px 7px; background:var(--win-gray); border:1.5px solid #808080; font-size:0.72rem; font-weight:800;">
        <span id="br-status-text">준비 완료 — MY-PORTAL 95</span>
        <span style="font-family:var(--font-mono);">🌐 56.6 Kbps Connected · [인터넷 영역]</span>
      </div>
    </div>
  `;

  (document.getElementById('dynamic-windows-container') || document.body).appendChild(win);
  enableWindowDrag(win);
  bindVirtualBrowserEvents();
  return win;
}

function bindVirtualBrowserEvents() {
  document.getElementById('br-addr-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const raw = (document.getElementById('br-addr-inp')?.value || '').trim();
    if (!raw) return;
    navigateVirtualBrowser(raw, true);
  });

  document.getElementById('br-btn-back')?.addEventListener('click', () => {
    if (browserState.historyIdx > 0) {
      browserState.historyIdx -= 1;
      playRetroTone('click');
      navigateVirtualBrowser(browserState.history[browserState.historyIdx], false);
    }
  });

  document.getElementById('br-btn-fwd')?.addEventListener('click', () => {
    if (browserState.historyIdx < browserState.history.length - 1) {
      browserState.historyIdx += 1;
      playRetroTone('click');
      navigateVirtualBrowser(browserState.history[browserState.historyIdx], false);
    }
  });

  document.getElementById('br-btn-reload')?.addEventListener('click', () => {
    const cur = browserState.history[browserState.historyIdx] || 'about:home';
    playRetroTone('click');
    navigateVirtualBrowser(cur, false);
  });

  document.getElementById('br-btn-home')?.addEventListener('click', () => {
    playRetroTone('click');
    navigateVirtualBrowser('about:home', true);
  });

  // 뷰 모드 전환 (리더/메타 파싱 뷰 vs 라이브 IFrame 뷰)
  document.getElementById('br-btn-mode')?.addEventListener('click', e => {
    browserState.viewMode = browserState.viewMode === 'reader' ? 'iframe' : 'reader';
    e.currentTarget.textContent = browserState.viewMode === 'reader' ? '뷰: 리더모드' : '뷰: 라이브프레임';
    playRetroTone('click');
    const cur = browserState.history[browserState.historyIdx] || 'about:home';
    navigateVirtualBrowser(cur, false);
  });

  // 즐겨찾기 서랍 토글
  document.getElementById('br-btn-toggle-bm')?.addEventListener('click', () => {
    const split = document.getElementById('br-main-split');
    const sidebar = document.getElementById('br-bm-sidebar');
    if (!split || !sidebar) return;
    const willShow = sidebar.style.display === 'none';
    sidebar.style.display = willShow ? 'block' : 'none';
    split.style.gridTemplateColumns = willShow ? '235px 1fr' : '1fr';
    playRetroTone('click');
    if (willShow) loadBrowserBookmarks();
  });

  document.querySelectorAll('[data-bm-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      browserState.bmFilter = btn.dataset.bmCat;
      renderBrowserBookmarks();
    });
  });

  // 현재 페이지 즐겨찾기 추가
  document.getElementById('br-btn-add-bm')?.addEventListener('click', async () => {
    const page = browserState.currentPage;
    if (!page || !page.url || page.url === 'about:home') {
      showWin95MessageBox('즐겨찾기 안내 — EXPLORER 95', '먼저 저장할 웹페이지나 YouTube 영상을 탐색해 주세요.', 'boom');
      return;
    }

    const newBm = {
      id: `BM-${Date.now()}`,
      createdAt: normalizeDateString(''),
      category: page.category || '기타',
      title: page.title || page.url,
      creator: page.creator || 'WEB',
      url: page.url,
      coverUrl: page.coverUrl || '',
      memo: ''
    };

    browserState.bookmarks.unshift(newBm);
    saveLocalCache(BROWSER_BM_CACHE_KEY, browserState.bookmarks);
    renderBrowserBookmarks();
    playRetroTone('open');

    try {
      const res = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'save_bookmark', ...newBm })
      });
      const json = await res.json();
      if (json.status === 'success' && json.bookmark) {
        browserState.bookmarks[0] = json.bookmark;
        saveLocalCache(BROWSER_BM_CACHE_KEY, browserState.bookmarks);
        renderBrowserBookmarks();
      }
    } catch {}

    showWin95MessageBox('즐겨찾기 저장 완료 — EXPLORER 95', `「${newBm.title}」 페이지가 즐겨찾기에 등록되었습니다.`, 'open');
  });

  // 즉석 감상 기록 패널 열기/닫기
  document.getElementById('br-btn-clip-archive')?.addEventListener('click', () => {
    const drawer = document.getElementById('br-clip-drawer');
    if (!drawer) return;
    const page = browserState.currentPage || {};
    document.getElementById('br-clip-cat').value = ['도서', '음악', '영상', '기타'].includes(page.category) ? page.category : '음악';
    document.getElementById('br-clip-title').value = page.title && page.url !== 'about:home' ? page.title : '';
    document.getElementById('br-clip-creator').value = page.creator || '';
    document.getElementById('br-clip-review').value = '';
    drawer.style.display = 'block';
    playRetroTone('open');
    document.getElementById('br-clip-review')?.focus();
  });

  document.getElementById('br-clip-close')?.addEventListener('click', () => {
    const drawer = document.getElementById('br-clip-drawer');
    if (drawer) drawer.style.display = 'none';
  });

  // 즉석 감상 기록 Google Sheets 저장
  document.getElementById('br-clip-drawer')?.addEventListener('submit', async e => {
    e.preventDefault();
    const page = browserState.currentPage || {};
    const category = document.getElementById('br-clip-cat').value;
    const title = document.getElementById('br-clip-title').value.trim();
    const creator = document.getElementById('br-clip-creator').value.trim();
    const rating = Number(document.getElementById('br-clip-rating').value) || 5;
    const review = document.getElementById('br-clip-review').value.trim();
    if (!title || !creator || !review) return;

    const btn = document.getElementById('br-clip-submit');
    btn.disabled = true;
    btn.textContent = '저장 중...';
    setLoadingCursor(true);

    try {
      const payload = {
        action: 'create',
        category,
        title,
        creator,
        genre: page.isYouTube ? 'YouTube 스트림' : '웹 탐색 기록',
        rating,
        watchDate: normalizeDateString(''),
        review,
        coverUrl: page.coverUrl || '',
        sourceUrl: page.url && page.url !== 'about:home' ? page.url : ''
      };
      const res = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.status === 'duplicate') {
        showWin95MessageBox('중복 기록 안내 — EXPLORER 95', json.message || '이미 동일한 기록이 있습니다.', 'boom');
        return;
      }
      if (json.status === 'success' && json.item) {
        playRetroTone('fanfare');
        archiveItems.unshift(json.item);
        saveLocalCache(STORAGE_KEYS.ARCHIVE, archiveItems);
        refreshAllViews();
        document.getElementById('br-clip-drawer').style.display = 'none';
        showWin95MessageBox('즉석 아카이브 저장 완료 — EXPLORER 95', `「${title}」 감상 기록이 구글 시트와 메인 화면에 즉시 반영되었습니다!`, 'open');
      }
    } catch {
      showWin95MessageBox('저장 오류 — EXPLORER 95', '네트워크 통신 중 오류가 발생했습니다.', 'boom');
    } finally {
      btn.disabled = false;
      btn.textContent = '시트에 즉시 저장';
      setLoadingCursor(false);
    }
  });
}

function updateBrowserNavButtons() {
  const backBtn = document.getElementById('br-btn-back');
  const fwdBtn = document.getElementById('br-btn-fwd');
  if (backBtn) backBtn.disabled = browserState.historyIdx <= 0;
  if (fwdBtn) fwdBtn.disabled = browserState.historyIdx >= browserState.history.length - 1;
}

function openVirtualBrowser(initialTarget = 'about:home') {
  ensureVirtualBrowserWindow();
  openWindow('win-browser');
  loadBrowserBookmarks();
  navigateVirtualBrowser(initialTarget, true);
}

function openVirtualBrowserWithQuery(query, isYouTube = true) {
  const target = isYouTube ? `yt:${query}` : query;
  openVirtualBrowser(target);
}

async function navigateVirtualBrowser(rawTarget, pushHistory = true) {
  ensureVirtualBrowserWindow();
  const target = String(rawTarget || 'about:home').trim();

  if (pushHistory) {
    browserState.history = browserState.history.slice(0, browserState.historyIdx + 1);
    browserState.history.push(target);
    browserState.historyIdx = browserState.history.length - 1;
  }
  updateBrowserNavButtons();

  const addrInp = document.getElementById('br-addr-inp');
  if (addrInp) addrInp.value = target;

  const viewport = document.getElementById('br-viewport');
  const statusEl = document.getElementById('br-status-text');
  if (!viewport) return;

  // 1. 시작 페이지 (MY-PORTAL 95)
  if (target === 'about:home') {
    browserState.currentPage = { url: 'about:home', title: 'MY-PORTAL 95 시작페이지', category: '기타' };
    if (statusEl) statusEl.textContent = '완료 — MY-PORTAL 95 시작페이지';
    renderBrowserPortalHome(viewport);
    return;
  }

  // 2. 유튜브 검색 모드 (`yt:검색어` 또는 URL이 아닌 일반 검색어)
  const isUrl = /^https?:\/\//i.test(target) || /^[a-z0-9-]+\.[a-z]{2,}/i.test(target);
  if (target.toLowerCase().startsWith('yt:') || !isUrl) {
    const query = target.replace(/^yt:/i, '').trim();
    await renderBrowserYouTubeSearch(viewport, query);
    return;
  }

  // 3. 일반 웹 URL 또는 YouTube 직접 URL
  const fullUrl = /^https?:\/\//i.test(target) ? target : `https://${target}`;
  if (addrInp) addrInp.value = fullUrl;

  if (browserState.abortCtrl) browserState.abortCtrl.abort();
  const ctrl = new AbortController();
  browserState.abortCtrl = ctrl;
  const timeoutId = setTimeout(() => ctrl.abort(), 12000);

  if (statusEl) statusEl.textContent = `${fullUrl} 사이트에 연결하는 중...`;
  viewport.innerHTML = `<div style="padding:36px; text-align:center; font-weight:900;">🌐 ${esc(fullUrl)} 페이지를 불러오는 중입니다...</div>`;

  try {
    const res = await fetch(`${GAS_WEB_APP_URL}?action=browse&url=${encodeURIComponent(fullUrl)}`, { signal: ctrl.signal });
    const json = await res.json();
    if (json.status !== 'success' || !json.page) {
      throw new Error(json.message || '페이지를 불러올 수 없습니다.');
    }

    const p = json.page;
    browserState.currentPage = {
      url: p.url,
      title: p.title,
      creator: p.creator,
      category: p.category,
      coverUrl: p.coverUrl,
      isYouTube: p.isYouTube,
      videoId: p.videoId
    };

    if (statusEl) statusEl.textContent = `완료 — ${p.title}`;

    // YouTube 직접 링크인 경우 인앱 플레이어로 즉시 재생
    if (p.isYouTube && p.videoId) {
      viewport.innerHTML = `
        <div style="background:#111; color:#fff; border:2px solid #111; padding:10px; margin-bottom:10px;">
          <div style="aspect-ratio:16/9; max-height:290px; width:100%; background:#000;">
            <iframe src="https://www.youtube.com/embed/${encodeURIComponent(p.videoId)}?autoplay=1&rel=0&playsinline=1&enablejsapi=1" style="width:100%; height:100%; border:0;" allow="autoplay; encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
          </div>
          <div style="margin-top:8px; display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
            <div>
              <div style="font-size:1rem; font-weight:900; color:#ffd83b;">${esc(p.title)}</div>
              <div style="font-size:0.78rem; color:#ccc;">채널: ${esc(p.creator)}</div>
            </div>
            <button type="button" class="btn95 yellow sm" id="br-send-to-jukebox">🎵 주크박스 95에서 듣기</button>
          </div>
        </div>
      `;
      document.getElementById('br-send-to-jukebox')?.addEventListener('click', () => {
        openWindow('win-jukebox');
        updateJukebox();
        mountYouTubeEmbedInJukebox(p.videoId, `${p.title} (${p.creator})`);
      });
      return;
    }

    // 라이브 IFrame 뷰 선택 시
    if (browserState.viewMode === 'iframe') {
      viewport.innerHTML = `
        <div style="background:#fff6bf; border:1.5px solid #111; padding:6px 8px; font-size:0.75rem; font-weight:800; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
          <span>일부 대형 사이트는 보안 정책(X-Frame-Options)으로 빈 화면이 나올 수 있습니다. 그럴 땐 상단 [뷰: 리더모드]로 전환하세요.</span>
          <a class="btn95 sm" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">새 탭 열기</a>
        </div>
        <iframe src="${esc(p.url)}" style="width:100%; height:355px; border:2px solid #111; background:#fff;"></iframe>
      `;
      return;
    }

    // 1995 웹 리더 & 하이퍼링크 파도타기 뷰
    viewport.innerHTML = `
      <div style="border-bottom:2px solid #111; padding-bottom:10px; margin-bottom:10px; display:flex; gap:12px; align-items:flex-start;">
        ${p.coverUrl ? `<img src="${esc(p.coverUrl)}" alt="" style="width:96px; height:96px; object-fit:cover; border:2px solid #111; flex-shrink:0;" onerror="this.style.display='none';" />` : ''}
        <div style="flex:1; min-width:0;">
          <div style="display:flex; gap:6px; margin-bottom:4px; flex-wrap:wrap;">
            <span class="tag-mini">${esc(p.siteName)}</span>
            <span class="tag-mini" style="background:var(--brutal-yellow);">자동분류: ${esc(p.category)}</span>
            <a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer" style="font-size:0.74rem; font-weight:800; color:#000080;">[원본 새 탭 ↗]</a>
          </div>
          <h2 style="font-size:1.12rem; font-weight:900; margin-bottom:4px;">${esc(p.title)}</h2>
          <div style="font-size:0.78rem; font-weight:700; color:#444;">작성/제공: ${esc(p.creator)}</div>
        </div>
      </div>

      ${p.description ? `<div style="background:var(--brutal-paper); border:1.5px solid #111; padding:8px 10px; font-size:0.84rem; font-weight:700; margin-bottom:10px;">${esc(p.description)}</div>` : ''}

      ${p.excerpts && p.excerpts.length ? `
        <div style="margin-bottom:12px;">
          <div style="font-size:0.78rem; font-weight:900; color:#000080; margin-bottom:5px;">📄 추출된 본문 요약</div>
          ${p.excerpts.map(txt => `<p style="font-size:0.82rem; line-height:1.55; margin-bottom:6px; color:#222;">• ${esc(txt)}</p>`).join('')}
        </div>
      ` : ''}

      ${p.links && p.links.length ? `
        <div style="border-top:1.5px dashed #808080; padding-top:8px;">
          <div style="font-size:0.78rem; font-weight:900; color:#000080; margin-bottom:6px;">🔗 페이지 내 하이퍼링크 (클릭하여 계속 탐색)</div>
          <div style="display:flex; flex-direction:column; gap:4px;">
            ${p.links.map(lk => `
              <a href="#" data-br-link="${esc(lk.url)}" style="font-size:0.8rem; font-weight:700; color:#0000ee; text-decoration:underline; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ▸ ${esc(lk.title)}
              </a>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;

    viewport.querySelectorAll('[data-br-link]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        playRetroTone('click');
        navigateVirtualBrowser(a.dataset.brLink, true);
      });
    });
  } catch (err) {
    if (statusEl) statusEl.textContent = '페이지 로드 오류';
    viewport.innerHTML = `
      <div style="padding:24px; text-align:center;">
        <p style="font-weight:900; margin-bottom:8px;">페이지를 불러오는 중 오류가 발생했습니다.</p>
        <p style="font-size:0.8rem; color:#555; margin-bottom:12px;">${esc(err.message || '')}</p>
        <a class="btn95 yellow sm" href="${esc(fullUrl)}" target="_blank" rel="noopener noreferrer">외부 새 탭에서 직접 열기</a>
      </div>
    `;
  } finally {
    clearTimeout(timeoutId);
    if (browserState.abortCtrl === ctrl) browserState.abortCtrl = null;
  }
}

function renderBrowserPortalHome(viewport) {
  viewport.innerHTML = `
    <div style="text-align:center; padding:14px 8px 18px; border-bottom:2px solid #111; margin-bottom:12px; background:linear-gradient(180deg, #e8f4ff 0%, #ffffff 100%);">
      <div style="display:inline-block; background:#000080; color:#ffd83b; font-family:var(--font-mono); font-size:0.74rem; font-weight:900; padding:2px 8px; margin-bottom:6px;">
        WELCOME TO MY-PORTAL 95
      </div>
      <h2 style="font-size:1.25rem; font-weight:900; margin-bottom:4px;">가상 웹 &amp; YouTube 탐색기 95</h2>
      <p style="font-size:0.8rem; font-weight:700; color:#444; margin-bottom:12px;">
        노래나 영상을 바로 검색·재생하고, 상단의 <b>[💾 이 페이지 감상 기록하기]</b>로 아카이브에 즉시 저장하세요!
      </p>
      <form id="br-portal-search-form" style="display:flex; max-width:520px; margin:0 auto; gap:6px;">
        <input type="text" id="br-portal-q" placeholder="YouTube 음악·영상 검색어 또는 웹 URL 입력..." style="flex:1;" />
        <button type="submit" class="btn95 yellow sm">YouTube 검색</button>
      </form>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
      <div class="sunken-box" style="background:var(--win-gray);">
        <div class="box-head"><span>🎵 원클릭 추천 탐색 채널</span><span class="tag-mini">QUICK</span></div>
        <div style="display:flex; flex-direction:column; gap:5px;">
          <button type="button" class="btn95 sm" data-portal-go="yt:새벽 감성 인디 음악 플레이리스트">🎧 새벽 감성 인디 플레이리스트</button>
          <button type="button" class="btn95 sm" data-portal-go="yt:90년대 명곡 시티팝 모음">🌃 90년대 레트로·시티팝 명곡</button>
          <button type="button" class="btn95 sm" data-portal-go="yt:올해의 추천 영화 예고편">🎬 추천 영화 트레일러 탐색</button>
          <button type="button" class="btn95 sm" data-portal-go="https://ko.wikipedia.org/wiki/메인_페이지">📚 위키백과 백과사전 서핑</button>
        </div>
      </div>

      <div class="sunken-box" style="background:var(--win-gray);">
        <div class="box-head"><span>★ 최근 저장한 북마크</span><span class="tag-mini">BOOKMARKS</span></div>
        <div id="br-portal-bm-preview" style="display:flex; flex-direction:column; gap:5px; font-size:0.78rem;"></div>
      </div>
    </div>
  `;

  document.getElementById('br-portal-search-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const q = document.getElementById('br-portal-q')?.value.trim();
    if (q) navigateVirtualBrowser(q, true);
  });

  viewport.querySelectorAll('[data-portal-go]').forEach(btn => {
    btn.addEventListener('click', () => {
      playRetroTone('click');
      navigateVirtualBrowser(btn.dataset.portalGo, true);
    });
  });

  const preview = document.getElementById('br-portal-bm-preview');
  if (preview) {
    const list = browserState.bookmarks.slice(0, 4);
    preview.innerHTML = list.length ? list.map(bm => `
      <button type="button" class="btn95 sm" data-bm-open="${esc(bm.url)}" style="text-align:left; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
        [${esc(bm.category)}] ${esc(bm.title)}
      </button>
    `).join('') : '<div style="color:#555; font-weight:700; padding:6px;">아직 즐겨찾기한 페이지가 없습니다.</div>';

    preview.querySelectorAll('[data-bm-open]').forEach(btn => {
      btn.addEventListener('click', () => navigateVirtualBrowser(btn.dataset.bmOpen, true));
    });
  }
}

async function renderBrowserYouTubeSearch(viewport, query) {
  const statusEl = document.getElementById('br-status-text');
  if (statusEl) statusEl.textContent = `YouTube에서 「${query}」 검색 중...`;
  viewport.innerHTML = `<div style="padding:36px; text-align:center; font-weight:900;">🎬 YouTube 95에서 「${esc(query)}」 영상을 찾는 중입니다...</div>`;

  try {
    const res = await fetch(`${GAS_WEB_APP_URL}?action=ytsearch&q=${encodeURIComponent(query)}&limit=8`);
    const json = await res.json();
    const videos = Array.isArray(json.videos) ? json.videos : [];

    if (statusEl) statusEl.textContent = `완료 — 「${query}」 검색 결과 ${videos.length}건`;

    if (!videos.length) {
      viewport.innerHTML = `<div style="padding:24px; text-align:center; font-weight:800;">검색 결과가 없습니다. 다른 키워드로 검색해 보세요.</div>`;
      return;
    }

    // 첫 번째 영상을 기본 현재 페이지 컨텍스트로 설정
    const first = videos[0];
    browserState.currentPage = {
      url: first.sourceUrl,
      title: first.title,
      creator: first.channel || first.creator,
      category: '음악',
      coverUrl: first.coverUrl,
      isYouTube: true,
      videoId: first.videoId
    };

    viewport.innerHTML = `
      <div id="br-yt-stage" style="background:#111; color:#fff; border:2px solid #111; padding:8px; margin-bottom:10px;">
        <div style="aspect-ratio:16/9; max-height:245px; width:100%; background:#000;">
          <iframe id="br-yt-iframe" src="https://www.youtube.com/embed/${encodeURIComponent(first.videoId)}?autoplay=1&rel=0&playsinline=1&enablejsapi=1" style="width:100%; height:100%; border:0;" allow="autoplay; encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
        </div>
        <div style="margin-top:6px; display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
          <div style="min-width:0; flex:1;">
            <div id="br-yt-now-title" style="font-size:0.92rem; font-weight:900; color:#ffd83b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(first.title)}</div>
            <div id="br-yt-now-chan" style="font-size:0.74rem; color:#ccc;">${esc(first.channel || first.creator)}</div>
          </div>
          <button type="button" class="btn95 yellow sm" id="br-yt-to-jb">🎵 주크박스 95 전송</button>
        </div>
      </div>

      <div style="font-size:0.78rem; font-weight:900; margin-bottom:6px;">📺 검색된 동영상 목록 (클릭 시 상단 플레이어에서 재생 및 감상 기록 연동)</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
        ${videos.map((v, idx) => `
          <div class="br-yt-card" data-br-vidx="${idx}" style="display:flex; gap:8px; align-items:center; padding:5px; border:1.5px solid #111; background:${idx === 0 ? '#fff6bf' : '#ffffff'}; cursor:pointer;">
            <img src="${esc(v.coverUrl)}" alt="" style="width:76px; height:48px; object-fit:cover; border:1px solid #111; flex-shrink:0;" />
            <div style="min-width:0; flex:1;">
              <div style="font-size:0.78rem; font-weight:900; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(v.title)}</div>
              <div style="font-size:0.7rem; color:#555; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(v.channel || v.creator)} ${v.duration ? `· ${esc(v.duration)}` : ''}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    document.getElementById('br-yt-to-jb')?.addEventListener('click', () => {
      const cur = browserState.currentPage;
      if (!cur || !cur.videoId) return;
      openWindow('win-jukebox');
      updateJukebox();
      mountYouTubeEmbedInJukebox(cur.videoId, `${cur.title} (${cur.creator})`);
    });

    viewport.querySelectorAll('[data-br-vidx]').forEach(card => {
      card.addEventListener('click', () => {
        const v = videos[Number(card.dataset.brVidx)];
        if (!v) return;
        playRetroTone('click');
        browserState.currentPage = {
          url: v.sourceUrl,
          title: v.title,
          creator: v.channel || v.creator,
          category: '음악',
          coverUrl: v.coverUrl,
          isYouTube: true,
          videoId: v.videoId
        };
        const ifr = document.getElementById('br-yt-iframe');
        if (ifr) ifr.src = `https://www.youtube.com/embed/${encodeURIComponent(v.videoId)}?autoplay=1&rel=0&playsinline=1&enablejsapi=1`;
        const tEl = document.getElementById('br-yt-now-title');
        const cEl = document.getElementById('br-yt-now-chan');
        if (tEl) tEl.textContent = v.title;
        if (cEl) cEl.textContent = v.channel || v.creator;

        viewport.querySelectorAll('[data-br-vidx]').forEach(el => (el.style.background = '#ffffff'));
        card.style.background = '#fff6bf';
      });
    });
  } catch {
    viewport.innerHTML = `<div style="padding:24px; text-align:center; font-weight:800;">YouTube 검색 중 오류가 발생했습니다.</div>`;
  }
}

// ============================================================
// 4. 즐겨찾기(Bookmarks) 동기화 및 렌더링
// ============================================================
async function loadBrowserBookmarks() {
  browserState.bookmarks = loadLocalCache(BROWSER_BM_CACHE_KEY, []);
  renderBrowserBookmarks();
  try {
    const res = await fetch(`${GAS_WEB_APP_URL}?action=bookmarks`);
    const json = await res.json();
    if (json.status === 'success' && Array.isArray(json.bookmarks)) {
      browserState.bookmarks = json.bookmarks;
      saveLocalCache(BROWSER_BM_CACHE_KEY, browserState.bookmarks);
      renderBrowserBookmarks();
    }
  } catch {}
}

function renderBrowserBookmarks() {
  const listEl = document.getElementById('br-bm-list');
  const countEl = document.getElementById('br-bm-count');
  if (!listEl) return;

  const filtered = browserState.bookmarks.filter(bm =>
    browserState.bmFilter === 'ALL' ? true : bm.category === browserState.bmFilter
  );

  if (countEl) countEl.textContent = `${filtered.length}건`;

  if (!filtered.length) {
    listEl.innerHTML = `<div style="font-size:0.75rem; color:#555; padding:8px;">저장된 즐겨찾기가 없습니다.</div>`;
    return;
  }

  listEl.innerHTML = filtered.map(bm => `
    <div style="background:#fff; border:1.5px solid #111; padding:5px 7px; font-size:0.74rem;">
      <div style="font-weight:900; color:#000080; margin-bottom:2px;">[${esc(bm.category)}] ${esc(bm.title)}</div>
      <div style="display:flex; justify-content:space-between; gap:4px; margin-top:4px;">
        <button type="button" class="btn95 yellow sm" data-bm-visit="${esc(bm.url)}" style="padding:1px 6px; font-size:0.68rem; flex:1;">열기</button>
        <button type="button" class="btn95 sm" data-bm-del="${esc(bm.id)}" style="padding:1px 6px; font-size:0.68rem;">삭제</button>
      </div>
    </div>
  `).join('');

  listEl.querySelectorAll('[data-bm-visit]').forEach(btn => {
    btn.addEventListener('click', () => {
      playRetroTone('click');
      navigateVirtualBrowser(btn.dataset.bmVisit, true);
    });
  });

  listEl.querySelectorAll('[data-bm-del]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.bmDel;
      browserState.bookmarks = browserState.bookmarks.filter(x => x.id !== id);
      saveLocalCache(BROWSER_BM_CACHE_KEY, browserState.bookmarks);
      renderBrowserBookmarks();
      playRetroTone('close');
      try {
        await fetch(GAS_WEB_APP_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'delete_bookmark', id })
        });
      } catch {}
    });
  });
}

window.openVirtualBrowser = openVirtualBrowser;
window.openVirtualBrowserWithQuery = openVirtualBrowserWithQuery;

document.addEventListener('DOMContentLoaded', () => {
  initDesktopShellEnhancements();
  loadBrowserBookmarks();
});

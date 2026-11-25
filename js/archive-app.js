// ============================================================
// MY-ARCHIVE 95 OS — Main CRUD Controller & Extension Apps
// ============================================================

window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
window.__MOD_VERSIONS.archiveApp =
  typeof APP_BUILD_VERSION !== 'undefined' ? APP_BUILD_VERSION : 'v2026.11.25-03';

function checkCanEditItem(item) {
  if (typeof canEditArchiveItem === 'function') return canEditArchiveItem(item);
  if (typeof canDeleteArchiveItem === 'function') return canDeleteArchiveItem(item);
  const me = typeof getCurrentUser === 'function' ? getCurrentUser() : { username: '문태양', role: 'owner' };
  if (!me) return false;
  if (typeof isAdminUser === 'function' && isAdminUser(me)) return true;
  const owner = String(item?.owner || '문태양').trim();
  return owner === String(me.username || '').trim();
}

function checkCanDeleteItem(item) {
  if (typeof canDeleteArchiveItem === 'function') return canDeleteArchiveItem(item);
  return checkCanEditItem(item);
}

function checkIsPublicItem(item) {
  if (typeof isPublicArchiveItem === 'function') return isPublicArchiveItem(item);
  const owner = String(item?.owner || '').trim();
  return owner === '공용' || owner === 'public';
}

// ============================================================
// 1. 동기화 상태 배지 & 우측 상단 계정 설정 창 연결
// ============================================================
function renderSyncBadge(isOnline, isSyncing = false) {
  const badge = document.getElementById('cache-status-badge');
  if (!badge) return;

  badge.classList.add('sync-status-badge');
  if (isOnline) {
    badge.classList.remove('error', 'offline');
    badge.innerHTML = `<span class="sync-arrow-icon${isSyncing ? ' spinning' : ''}">↻</span><span>동기화 중</span>`;
  } else {
    badge.classList.add('error', 'offline');
    badge.innerHTML = `<span class="sync-arrow-icon">↻</span><span>동기화 오류</span>`;
  }
}

function openAccountSettingsWindow() {
  let win = document.getElementById('win-account-settings');
  const me = typeof getCurrentUser === 'function'
    ? getCurrentUser()
    : { username: '문태양', role: 'owner' };

  if (!win) {
    win = document.createElement('div');
    win.className = 'floating-win';
    win.id = 'win-account-settings';
    win.dataset.dynamic = 'true';
    win.dataset.winTitle = '[계정] 계정 설정';
    win.style.top = '56px';
    win.style.right = '24px';
    win.style.left = 'auto';
    win.style.width = '380px';

    win.innerHTML = `
      <div class="win-titlebar draggable">
        <div class="win-title-left"><span class="win-title-dot"></span><span>계정 설정</span></div>
        <div class="win-controls">
          <button type="button" class="win-ctrl-btn" data-action="close" data-target="win-account-settings">X</button>
        </div>
      </div>
      <div class="win-body">
        <div class="sunken-box" style="margin-bottom: 10px;">
          <div class="box-head"><span>현재 접속 계정</span><span class="tag-mini">PROFILE</span></div>
          <div style="font-size: 0.82rem; margin-bottom: 4px;"><b>사용자:</b> <span id="acc-set-name"></span></div>
          <div style="font-size: 0.8rem; color: #333;"><b>권한:</b> <span id="acc-set-role"></span></div>
        </div>
        <div style="display: flex; justify-content: space-between; gap: 6px; flex-wrap: wrap;">
          <button type="button" class="btn95 yellow sm" id="btn-acc-switch">계정 전환 / 로그인 화면</button>
          <button type="button" class="btn95 red sm" id="btn-acc-logout">로그아웃</button>
        </div>
      </div>
    `;
    (document.getElementById('dynamic-windows-container') || document.body).appendChild(win);
    enableWindowDrag(win);

    document.getElementById('btn-acc-switch')?.addEventListener('click', () => {
      closeWindow('win-account-settings');
      if (typeof openLoginDialog === 'function') openLoginDialog();
      else if (typeof showLoginScreen === 'function') showLoginScreen();
    });

    document.getElementById('btn-acc-logout')?.addEventListener('click', () => {
      closeWindow('win-account-settings');
      if (typeof logoutCurrentUser === 'function') logoutCurrentUser();
      else if (typeof handleLogout === 'function') handleLogout();
      else location.reload();
    });
  }

  const nameEl = document.getElementById('acc-set-name');
  const roleEl = document.getElementById('acc-set-role');
  if (nameEl) nameEl.textContent = me?.username || '문태양';
  if (roleEl) roleEl.textContent = me?.role || '사용자';

  openWindow('win-account-settings');
}

function bindAccountSettingsTrigger() {
  const candidates = [
    document.getElementById('btn-account-menu'),
    document.getElementById('btn-user-account'),
    document.getElementById('account-badge-btn'),
    document.querySelector('.menu-bar-right .account-btn'),
    document.querySelector('[data-open-account]')
  ].filter(Boolean);

  // 기존 바로 로그아웃 바인딩을 가로채 계정 설정 창을 띄우도록 캡처 단계에서 처리
  document.addEventListener('click', e => {
    const btn = e.target.closest(
      '#btn-account-menu, #btn-user-account, #account-badge-btn, .account-chip-btn, [data-open-account]'
    );
    if (btn) {
      e.preventDefault();
      e.stopImmediatePropagation();
      openAccountSettingsWindow();
      return;
    }

    // 우측 상단 메뉴바 내 계정 이름 텍스트가 포함된 버튼 fallback
    const menuRightBtn = e.target.closest('.menu-bar-right button, .os-menubar button');
    if (menuRightBtn && !menuRightBtn.closest('.menu-item-wrap') && menuRightBtn.id !== 'cache-status-badge') {
      const txt = (menuRightBtn.textContent || '').trim();
      if (txt.includes('TAEYANG') || txt.includes('관리자') || txt.includes('계정')) {
        e.preventDefault();
        e.stopImmediatePropagation();
        openAccountSettingsWindow();
      }
    }
  }, true);

  void candidates;
}

// ============================================================
// 2. 상단 메뉴바 & 바탕화면·시작 메뉴 이벤트 바인딩
// ============================================================
document.querySelectorAll('.menu-item-wrap').forEach(wrap => {
  wrap.querySelector('.menu-root')?.addEventListener('click', e => {
    e.stopPropagation();
    const wasOpen = wrap.classList.contains('open');
    document.querySelectorAll('.menu-item-wrap').forEach(w => w.classList.remove('open'));
    if (!wasOpen) wrap.classList.add('open');
  });
});

document.addEventListener('click', () => {
  document.querySelectorAll('.menu-item-wrap').forEach(w => w.classList.remove('open'));
  document.getElementById('start-menu')?.classList.remove('open');
  document.getElementById('btn-start')?.classList.remove('pressed');
});

document.getElementById('mnu-open-memo')?.addEventListener('click', openMemoWindow);
document.getElementById('mnu-sync-sheet')?.addEventListener('click', () => loadArchiveData(true));

document.getElementById('mnu-export-csv')?.addEventListener('click', () => {
  if (!archiveItems.length) {
    showWin95MessageBox('데이터 백업 오류 — MY-ARCHIVE 95', '내보낼 감상 기록 데이터가 없습니다.', 'boom');
    return;
  }
  const headers = ['ID', '매체', '제목', '제작자', '장르', '평점', '감상일', '한줄평', '원본링크', '작성자', '공개여부'];
  const rows = archiveItems.map(i => [
    i.id,
    i.category,
    `"${String(i.title || '').replace(/"/g, '""')}"`,
    `"${String(i.creator || '').replace(/"/g, '""')}"`,
    `"${String(i.genre || '').replace(/"/g, '""')}"`,
    i.rating,
    i.watchDate,
    `"${String(i.review || '').replace(/"/g, '""')}"`,
    i.sourceUrl || '',
    `"${String(i.owner || '문태양').replace(/"/g, '""')}"`,
    String(i.shared || 'Y').toUpperCase()
  ]);
  const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MyArchive_백업_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

document.querySelectorAll('[data-cat-menu]').forEach(btn => {
  btn.addEventListener('click', () => selectCategoryFilter(btn.dataset.catMenu));
});

document.getElementById('mnu-toggle-charts')?.addEventListener('click', () => {
  const sec = document.getElementById('charts-section');
  if (sec) sec.style.display = sec.style.display === 'none' ? 'grid' : 'none';
});

document.getElementById('mnu-cascade')?.addEventListener('click', () => {
  document.querySelectorAll('.floating-win.open').forEach((w, idx) => {
    w.classList.remove('minimized');
    w.style.top = `${46 + idx * 24}px`;
    w.style.left = `${132 + idx * 24}px`;
    focusWindow(w);
  });
});

document.getElementById('mnu-close-all-popups')?.addEventListener('click', () => {
  document.querySelectorAll('.floating-win.open').forEach(w => {
    if (w.id !== 'win-main') closeWindow(w.id);
  });
});

const startBtn = document.getElementById('btn-start');
const startMenu = document.getElementById('start-menu');
if (startBtn && startMenu) {
  startBtn.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = startMenu.classList.toggle('open');
    startBtn.classList.toggle('pressed', isOpen);
    playRetroTone('click');
  });
}

document.addEventListener('click', e => {
  const trigger = e.target.closest('#icon-new, #sm-new, #btn-open-register, #mnu-new-archive');
  if (trigger) {
    e.preventDefault();
    e.stopPropagation();
    openRegisterModal();
  }
});

document.getElementById('icon-main')?.addEventListener('click', () => selectCategoryFilter('ALL'));
document.getElementById('icon-memo')?.addEventListener('click', openMemoWindow);
document.getElementById('sm-memo')?.addEventListener('click', openMemoWindow);
document.getElementById('sm-all')?.addEventListener('click', () => selectCategoryFilter('ALL'));
document.getElementById('sm-book')?.addEventListener('click', () => selectCategoryFilter('도서'));
document.getElementById('sm-music')?.addEventListener('click', () => selectCategoryFilter('음악'));
document.getElementById('sm-video')?.addEventListener('click', () => selectCategoryFilter('영상'));
document.getElementById('sm-reload')?.addEventListener('click', () => loadArchiveData(true));

function selectCategoryFilter(cat) {
  openWindow('win-main');
  selectedCategory = cat;
  document.querySelectorAll('#cat-filter-group .pill-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
  renderArchiveGrid();
}

// ============================================================
// 3. 초기 부팅 & Google Sheets + LocalStorage 하이브리드 동기화
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  bindAccountSettingsTrigger();
  renderSyncBadge(navigator.onLine !== false, true);

  if (typeof runBootAnimation === 'function') runBootAnimation();
  ensureRegisterWindowExists();

  const cachedItems = loadLocalCache(STORAGE_KEYS.ARCHIVE, null);
  if (Array.isArray(cachedItems) && cachedItems.length > 0) {
    archiveItems = cachedItems;
    updateCacheBadge(true);
    refreshAllViews();
  }

  loadArchiveData(false);
  loadNotesData();
  initExtensionApps();

  window.addEventListener('offline', () => updateCacheBadge(false));
  window.addEventListener('online', () => loadArchiveData(false));
});

function updateCacheBadge(isOnline, isSyncing = false) {
  renderSyncBadge(Boolean(isOnline), Boolean(isSyncing));
}

async function loadArchiveData(showFeedback = false) {
  setLoadingCursor(true);
  updateCacheBadge(navigator.onLine !== false, true);
  const statusLeft = document.getElementById('status-left');
  if (statusLeft) statusLeft.textContent = `중앙 데이터 서버 접속 중... (${window.__MOD_VERSIONS.archiveApp})`;

  try {
    const res = await fetch(`${GAS_WEB_APP_URL}?action=list`);
    const json = await res.json();
    if (json.status === 'success' && Array.isArray(json.items)) {
      archiveItems = json.items;
      saveLocalCache(STORAGE_KEYS.ARCHIVE, archiveItems);
      updateCacheBadge(true, false);
      if (statusLeft) {
        statusLeft.textContent = `통신 접속 완료 [${window.__MOD_VERSIONS.archiveApp}] — 제목 표시줄을 끌어 창 이동`;
      }
      if (showFeedback) playRetroTone('open');
    } else {
      throw new Error('Invalid response');
    }
  } catch {
    const fallback = loadLocalCache(STORAGE_KEYS.ARCHIVE, []);
    archiveItems = Array.isArray(fallback) ? fallback : [];
    updateCacheBadge(false, false);
    if (statusLeft) {
      statusLeft.textContent = `동기화 오류 [${window.__MOD_VERSIONS.archiveApp}] — 캐시 데이터 표시 중`;
    }
  } finally {
    setLoadingCursor(false);
  }
  refreshAllViews();
}

function refreshAllViews() {
  updateKPIs();
  renderCharts();
  renderArchiveGrid();
  if (typeof updateJukebox === 'function') updateJukebox();

  const visWin = document.getElementById('win-visualizer');
  if (visWin && visWin.classList.contains('open') && typeof renderVisualizerWorkspace === 'function') {
    renderVisualizerWorkspace();
  }
  const calWin = document.getElementById('win-calendar');
  if (calWin && calWin.classList.contains('open')) renderCalendarApp();

  const tlWin = document.getElementById('win-timeline');
  if (tlWin && tlWin.classList.contains('open')) renderTimelineAndRadarApp();

  const commWin = document.getElementById('win-community');
  if (commWin && commWin.classList.contains('open') && typeof renderCommunityBoard === 'function') {
    renderCommunityBoard();
  }
}

// ============================================================
// 4. KPI 요약 카드 & 차트 & 메인 카드 그리드
// ============================================================
function getMyVisibleArchiveItems() {
  const me = typeof getCurrentUser === 'function' ? getCurrentUser() : { username: '문태양', role: 'owner' };
  const adminFlag = typeof isAdminUser === 'function' ? isAdminUser(me) : false;
  if (!me || me.role === 'public' || adminFlag) return archiveItems;
  return archiveItems.filter(it => (it.owner || '문태양') === me.username);
}

function updateKPIs() {
  const myItems = getMyVisibleArchiveItems();
  const total = myItems.length;
  const kpiTotalEl = document.getElementById('kpi-total');
  if (kpiTotalEl) kpiTotalEl.textContent = `${total}건`;

  if (!total) {
    if (document.getElementById('kpi-recent-sub')) document.getElementById('kpi-recent-sub').textContent = '첫 감상 자료를 등록해 보십시오';
    if (document.getElementById('kpi-avg-rating')) document.getElementById('kpi-avg-rating').textContent = '0.0점';
    if (document.getElementById('kpi-top-cat')) document.getElementById('kpi-top-cat').textContent = '-';
    if (document.getElementById('kpi-top-cat-sub')) document.getElementById('kpi-top-cat-sub').textContent = '기록 없음';
    if (document.getElementById('kpi-top-genre')) document.getElementById('kpi-top-genre').textContent = '-';
    if (document.getElementById('kpi-top-genre-sub')) document.getElementById('kpi-top-genre-sub').textContent = '기록 없음';
    return;
  }

  if (document.getElementById('kpi-recent-sub')) {
    document.getElementById('kpi-recent-sub').textContent = `최근 수록: 「${myItems[0].title}」`;
  }
  const avg = myItems.reduce((s, c) => s + (Number(c.rating) || 0), 0) / total;
  if (document.getElementById('kpi-avg-rating')) {
    document.getElementById('kpi-avg-rating').textContent = `${avg.toFixed(1)}점`;
  }

  const catMap = {};
  myItems.forEach(i => { catMap[i.category] = (catMap[i.category] || 0) + 1; });
  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
  if (document.getElementById('kpi-top-cat')) document.getElementById('kpi-top-cat').textContent = topCat[0];
  if (document.getElementById('kpi-top-cat-sub')) {
    document.getElementById('kpi-top-cat-sub').textContent = `전체 중 ${topCat[1]}건 (${Math.round((topCat[1] / total) * 100)}%)`;
  }

  const gMap = {};
  myItems.forEach(i => { const g = (i.genre || '일반').trim(); gMap[g] = (gMap[g] || 0) + 1; });
  const topG = Object.entries(gMap).sort((a, b) => b[1] - a[1])[0];
  if (document.getElementById('kpi-top-genre')) document.getElementById('kpi-top-genre').textContent = topG[0];
  if (document.getElementById('kpi-top-genre-sub')) {
    document.getElementById('kpi-top-genre-sub').textContent = `누적 ${topG[1]}건 수록`;
  }
}

function renderCharts() {
  if (typeof Chart === 'undefined') return;
  Chart.defaults.font.family = "'Galmuri11', 'DungGeunMo', sans-serif";
  Chart.defaults.font.size = 11;
  Chart.defaults.font.weight = 700;
  Chart.defaults.color = '#000000';

  const myItems = getMyVisibleArchiveItems();
  const cats = ['도서', '음악', '영상', '기타'];
  const catVals = cats.map(c => myItems.filter(i => i.category === c).length);
  const catCanvas = document.getElementById('chart-category');
  if (catCanvas) {
    if (categoryChart) categoryChart.destroy();
    categoryChart = new Chart(catCanvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: cats,
        datasets: [{
          data: catVals,
          backgroundColor: ['#ffff00', '#00ffff', '#ff4757', '#2ed573'],
          borderColor: '#000000',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'right', labels: { boxWidth: 10, padding: 6 } } }
      }
    });
  }

  const mMap = {};
  myItems.forEach(i => { const ym = (i.watchDate || '').slice(0, 7); if (ym) mMap[ym] = (mMap[ym] || 0) + 1; });
  const months = Object.keys(mMap).sort();
  const monCanvas = document.getElementById('chart-monthly');
  if (monCanvas) {
    if (monthlyChart) monthlyChart.destroy();
    monthlyChart = new Chart(monCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: months.length ? months : ['기록 없음'],
        datasets: [{
          data: months.length ? months.map(m => mMap[m]) : [0],
          backgroundColor: '#2ed573',
          borderColor: '#000000',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#dfdcd3' } },
          x: { grid: { display: false } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }
}

document.querySelectorAll('#cat-filter-group .pill-btn').forEach(btn => {
  btn.addEventListener('click', () => selectCategoryFilter(btn.dataset.cat));
});
document.getElementById('filter-rating')?.addEventListener('change', renderArchiveGrid);
document.getElementById('filter-keyword')?.addEventListener('input', renderArchiveGrid);

function renderArchiveGrid() {
  const minRating = Number(document.getElementById('filter-rating')?.value) || 0;
  const kw = (document.getElementById('filter-keyword')?.value || '').trim().toLowerCase();
  const myItems = getMyVisibleArchiveItems();
  const filtered = myItems.filter(item => {
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
    if (Number(item.rating) < minRating) return false;
    if (kw && !`${item.title} ${item.creator} ${item.genre} ${item.review} ${item.owner || ''}`.toLowerCase().includes(kw)) return false;
    return true;
  });

  const statusRight = document.getElementById('status-right');
  if (statusRight) statusRight.textContent = `${filtered.length}개 개체 표시됨`;
  const grid = document.getElementById('archive-grid');
  if (!grid) return;
  grid.innerHTML = '';

  if (!filtered.length) {
    grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 24px 12px; background: #ffffff; border: 2px dashed #000000; font-weight: 700;">디스크에 표시할 감상 자료가 없습니다. [+ 새 감상 기록하기] 단추를 눌러 첫 자료를 등록하십시오.</div>`;
    return;
  }

  filtered.forEach(item => {
    const catCls = item.category === '음악' ? 'music' : item.category === '영상' ? 'video' : item.category === '기타' ? 'etc' : '';
    const catIcon = item.category === '도서' ? PIXEL_ICONS.BOOK : item.category === '음악' ? PIXEL_ICONS.MUSIC : item.category === '영상' ? PIXEL_ICONS.MOVIE : PIXEL_ICONS.ETC;
    const ratingNum = Math.max(1, Math.min(5, Number(item.rating) || 5));
    const stars = '★'.repeat(ratingNum) + '☆'.repeat(5 - ratingNum);
    const coverSrc = item.coverUrl ? esc(item.coverUrl) : FALLBACK_COVER;
    const ownerLabel = checkIsPublicItem(item) ? '공용' : esc(item.owner || '문태양');

    const card = document.createElement('article');
    card.className = 'archive-card item-card';
    card.innerHTML = `
      <div class="item-card-bar"><span>${esc(item.id || 'ARCHIVE.DAT')}</span><span>[열람·편집]</span></div>
      <div class="item-thumb-box">
        <img class="item-thumb" src="${coverSrc}" alt="${esc(item.title)}" onerror="this.onerror=null;this.src='${FALLBACK_COVER}';" />
        <span class="cat-sticker ${catCls}">${catIcon} ${esc(item.category)}</span>
        <span class="star-sticker">${stars}</span>
      </div>
      <div class="item-content">
        <h3 class="item-title">${esc(item.title)}</h3>
        <div class="item-creator">${esc(item.creator)} · ${esc(item.genre || '일반')}</div>
        <p class="item-memo">${esc(item.review)}</p>
        <div class="item-footer"><span>${esc(item.watchDate)} · @${ownerLabel}</span><span>열람 &gt;&gt;</span></div>
      </div>
    `;
    card.addEventListener('click', () => spawnDetailWindow(item));
    grid.appendChild(card);
  });
}

// ============================================================
// 5. Windows 95 시스템 메시지 박스 다이얼로그
// ============================================================
function showWin95MessageBox(title, message, tone = 'boom') {
  const existing = document.getElementById('win-sys-msgbox');
  if (existing) existing.remove();

  playRetroTone(tone);

  const box = document.createElement('div');
  box.className = 'floating-win open focused';
  box.id = 'win-sys-msgbox';
  box.dataset.dynamic = 'true';
  box.dataset.winTitle = `[!] ${title}`;
  box.style.width = '360px';
  box.style.top = '50%';
  box.style.left = '50%';
  box.style.transform = 'translate(-50%, -50%)';
  box.style.zIndex = String(++topZIndex + 150);

  box.innerHTML = `
    <div class="win-titlebar draggable" style="background: var(--brutal-pink); color: #ffffff;">
      <div class="win-title-left"><span class="win-title-dot" style="background: var(--brutal-yellow);"></span><span>${esc(title)}</span></div>
      <div class="win-controls">
        <button type="button" class="win-ctrl-btn close" id="btn-msgbox-x">X</button>
      </div>
    </div>
    <div class="win-body" style="background: var(--win-gray); padding: 14px 12px;">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
        <div style="width: 28px; height: 28px; flex-shrink: 0; background: var(--brutal-yellow); border: 2px solid #000000; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1rem; color: #000000;">!</div>
        <div style="font-size: 0.78rem; font-weight: 700; line-height: 1.4; color: #000000; word-break: keep-all;">${esc(message)}</div>
      </div>
      <div style="display: flex; justify-content: center;">
        <button type="button" class="btn95 yellow sm" id="btn-msgbox-ok" style="min-width: 84px;">확인 (OK)</button>
      </div>
    </div>
  `;

  (document.getElementById('dynamic-windows-container') || document.body).appendChild(box);
  enableWindowDrag(box);

  const closeMsgBox = () => {
    playRetroTone('close');
    closeWindow('win-sys-msgbox');
  };

  document.getElementById('btn-msgbox-ok')?.addEventListener('click', closeMsgBox);
  document.getElementById('btn-msgbox-x')?.addEventListener('click', closeMsgBox);
  document.getElementById('btn-msgbox-ok')?.focus();
}

// ============================================================
// 6. 상세 탐색기 창 (조회 + 수정 + 권한별 삭제 + 연관 추천)
// ============================================================
const detailItemRegistry = {};

async function spawnDetailWindow(item) {
  const itemKey = String(item.id || `tmp-${Date.now()}`);
  detailItemRegistry[itemKey] = item;

  const winId = `win-detail-${itemKey}`;
  const existing = document.getElementById(winId);
  if (existing) {
    openWindow(winId);
    return;
  }

  detailWindowCount += 1;
  const offset = (detailWindowCount % 6) * 22;
  const ytQuery = item.category === '음악'
    ? `${item.creator} ${item.title} official`
    : item.category === '도서'
      ? `${item.title} ${item.creator} 북트레일러 리뷰`
      : `${item.title} ${item.creator}`;
  const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(ytQuery)}`;

  const editable = checkCanEditItem(item);
  const deletable = checkCanDeleteItem(item);
  const isPublicPost = checkIsPublicItem(item);
  const authorBadgeText = isPublicPost ? '공용 계정' : `@${item.owner || '문태양'}`;
  const permDenyMsg = isPublicPost
    ? '공용 계정 게시물은 관리자 계정으로만 편집·삭제할 수 있습니다.'
    : '자료 편집 및 삭제는 작성자 본인 또는 관리자 계정으로만 가능합니다.';
  const ratingNum = Math.max(1, Math.min(5, Number(item.rating) || 5));

  const winEl = document.createElement('div');
  winEl.className = 'floating-win open focused';
  winEl.id = winId;
  winEl.dataset.dynamic = 'true';
  winEl.dataset.itemKey = itemKey;
  winEl.dataset.winTitle = `[INFO] ${item.title}`;
  winEl.style.top = `${52 + offset}px`;
  winEl.style.left = `${136 + offset}px`;
  winEl.style.width = '600px';

  winEl.innerHTML = `
    <div class="win-titlebar draggable">
      <div class="win-title-left"><span class="win-title-dot" style="background: var(--brutal-green);"></span><span>${esc(item.title)} — 상세 정보</span></div>
      <div class="win-controls">
        <button type="button" class="win-ctrl-btn" data-action="minimize" data-target="${winId}">_</button>
        <button type="button" class="win-ctrl-btn close" data-action="close" data-target="${winId}">X</button>
      </div>
    </div>
    <div class="win-body">
      <div class="det-view-mode">
        <div style="display:grid; grid-template-columns:120px 1fr; gap:10px; margin-bottom:10px;">
          <img src="${esc(item.coverUrl || FALLBACK_COVER)}" alt="${esc(item.title)}" onerror="this.onerror=null;this.src='${FALLBACK_COVER}';" style="width:120px; height:150px; object-fit:cover; border:1px solid #000;" />
          <div>
            <div style="display:flex; gap:4px; margin-bottom:6px; flex-wrap:wrap;">
              <span style="padding:1px 6px; border:1px solid #000; background:var(--brutal-yellow); font-size:0.74rem; font-weight:700;">${esc(item.category)}</span>
              <span style="padding:1px 6px; border:1px solid #000; background:#fff; font-size:0.74rem; font-weight:700;">${'★'.repeat(ratingNum)}${'☆'.repeat(5 - ratingNum)}</span>
              <span style="padding:1px 6px; border:1px solid #000; background:var(--win-gray); font-size:0.74rem;">${esc(item.watchDate)}</span>
              <span style="padding:1px 6px; border:1px solid #000; background:#fff; font-size:0.74rem;">${esc(authorBadgeText)}</span>
            </div>
            <h2 style="font-size:1rem; font-weight:700; margin-bottom:2px;">${esc(item.title)}</h2>
            <div style="font-size:0.78rem; color:#333; margin-bottom:6px;">${esc(item.creator)} · ${esc(item.genre || '일반')}</div>
            <p style="background:#ffffff; box-shadow:var(--bevel-sunken); padding:7px; font-size:0.78rem; white-space:pre-wrap; word-break:break-word;">${esc(item.review)}</p>
            <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:8px; align-items:center;">
              <a class="btn95 pink sm" href="${ytUrl}" target="_blank" rel="noopener noreferrer">[PLAY] YouTube</a>
              ${item.sourceUrl ? `<a class="btn95 sky sm" href="${esc(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">원본 링크 &gt;&gt;</a>` : ''}
              ${editable
                ? `<button type="button" class="btn95 sm btn-toggle-share">${String(item.shared || 'Y').toUpperCase() !== 'N' ? '광장 공개중' : '개인 보관함'}</button>
                   <button type="button" class="btn95 yellow sm btn-toggle-edit">[EDIT] 편집</button>`
                : `<button type="button" class="btn95 sm" disabled style="opacity:0.55;" title="${esc(permDenyMsg)}">편집 불가</button>`
              }
              ${deletable
                ? `<button type="button" class="btn95 sm btn-delete-item">[DEL] 삭제</button>`
                : `<button type="button" class="btn95 sm" disabled style="opacity:0.55;" title="${esc(permDenyMsg)}">삭제 불가</button>`
              }
            </div>
            ${deletable ? `
            <div class="del-confirm-bar" style="display:none; margin-top:8px; padding:6px 8px; background:#800000; color:#fff; border:1px solid #000; font-size:0.76rem; font-weight:700; align-items:center; justify-content:space-between; gap:6px;">
              <span>본 자료를 영구 삭제하시겠습니까?</span>
              <div style="display:flex; gap:4px;">
                <button type="button" class="btn95 sm btn-delete-cancel">취소</button>
                <button type="button" class="btn95 yellow sm btn-delete-confirm">삭제(Y)</button>
              </div>
            </div>` : ''}
          </div>
        </div>
        <div class="sunken-box">
          <div class="box-head"><span>연관 추천 자료</span><span class="tag-mini">SIMILAR</span></div>
          <div class="rec-status-msg" style="font-size:0.76rem; color:#444;">연관 자료를 조회하고 있습니다...</div>
          <div class="rec-grid" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; margin-top:6px;"></div>
        </div>
      </div>

      <form class="det-edit-form sunken-box" style="display:none; background: var(--win-gray);">
        <div class="box-head"><span>[EDIT] 자료 편집 (${esc(item.id || 'NO-ID')})</span><span class="tag-mini">EDIT</span></div>
        <div style="display:grid; grid-template-columns:1fr 1.2fr; gap:6px; margin-bottom:6px;">
          <div><label style="display:block; font-size:0.74rem; font-weight:700; margin-bottom:2px;">매체</label>
            <select name="category" class="win95-select" style="width:100%;">
              <option value="도서" ${item.category === '도서' ? 'selected' : ''}>도서</option>
              <option value="음악" ${item.category === '음악' ? 'selected' : ''}>음악</option>
              <option value="영상" ${item.category === '영상' ? 'selected' : ''}>영상</option>
              <option value="기타" ${item.category === '기타' ? 'selected' : ''}>기타</option>
            </select>
          </div>
          <div><label style="display:block; font-size:0.74rem; font-weight:700; margin-bottom:2px;">감상일</label>
            <div style="display:flex; gap:3px;">
              <select name="dateY" class="win95-select"></select>
              <select name="dateM" class="win95-select"></select>
              <select name="dateD" class="win95-select"></select>
            </div>
          </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:6px;">
          <div><label style="display:block; font-size:0.74rem; font-weight:700; margin-bottom:2px;">제목 *</label><input type="text" name="title" value="${esc(item.title)}" required style="width:100%;" /></div>
          <div><label style="display:block; font-size:0.74rem; font-weight:700; margin-bottom:2px;">제작자 *</label><input type="text" name="creator" value="${esc(item.creator)}" required style="width:100%;" /></div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1.2fr; gap:6px; margin-bottom:6px;">
          <div><label style="display:block; font-size:0.74rem; font-weight:700; margin-bottom:2px;">장르</label><input type="text" name="genre" value="${esc(item.genre)}" style="width:100%;" /></div>
          <div><span style="display:block; font-size:0.74rem; font-weight:700; margin-bottom:2px;">평점</span>
            <div style="display:flex; gap:6px; font-size:0.74rem;">
              ${[1, 2, 3, 4, 5].map(r => `
                <label style="display:inline-flex; align-items:center; gap:2px; cursor:pointer;">
                  <input type="radio" name="editRating" value="${r}" ${ratingNum === r ? 'checked' : ''} />
                  <span>${r}점</span>
                </label>
              `).join('')}
            </div>
          </div>
        </div>
        <div style="margin-bottom:6px;"><label style="display:block; font-size:0.74rem; font-weight:700; margin-bottom:2px;">표지 URL</label><input type="text" name="coverUrl" value="${esc(item.coverUrl)}" style="width:100%;" /></div>
        <div style="margin-bottom:6px;"><label style="display:block; font-size:0.74rem; font-weight:700; margin-bottom:2px;">원본 URL</label><input type="text" name="sourceUrl" value="${esc(item.sourceUrl)}" style="width:100%;" /></div>
        <div style="margin-bottom:6px;"><label style="display:block; font-size:0.74rem; font-weight:700; margin-bottom:2px;">감상평 *</label><textarea name="review" rows="3" required style="width:100%;">${esc(item.review)}</textarea></div>
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
          <label style="display:flex; align-items:center; gap:4px; font-size:0.74rem; font-weight:700; cursor:pointer;">
            <input type="checkbox" name="shared" ${String(item.shared || 'Y').toUpperCase() !== 'N' ? 'checked' : ''} />
            <span>광장 공개</span>
          </label>
          <div style="display:flex; gap:4px;">
            <button type="button" class="btn95 sm btn-cancel-edit">취소</button>
            <button type="submit" class="btn95 yellow sm btn-save-edit">저장(S)</button>
          </div>
        </div>
      </form>
    </div>
  `;

  (document.getElementById('dynamic-windows-container') || document.body).appendChild(winEl);
  enableWindowDrag(winEl);
  focusWindow(winEl);
  playRetroTone('open');

  const editForm = winEl.querySelector('.det-edit-form');
  if (typeof populateWin95DateSelects === 'function') {
    populateWin95DateSelects(editForm.dateY, editForm.dateM, editForm.dateD, item.watchDate);
  }

  const statusEl = winEl.querySelector('.rec-status-msg');
  const recGrid = winEl.querySelector('.rec-grid');
  try {
    let recs = [];
    if (item.category === '음악') {
      const q = encodeURIComponent(`${item.creator} ${item.genre !== '일반' ? item.genre : ''}`.trim());
      const json = await (await fetch(`https://itunes.apple.com/search?term=${q}&country=KR&media=music&limit=6`)).json();
      recs = (json.results || []).filter(r => (r.trackName || '').toLowerCase() !== item.title.toLowerCase()).slice(0, 3).map(r => ({
        title: r.trackName || r.collectionName, creator: r.artistName,
        thumb: r.artworkUrl100 ? r.artworkUrl100.replace('100x100bb', '300x300bb') : FALLBACK_COVER,
        yt: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${r.artistName} ${r.trackName}`)}`, link: r.trackViewUrl || ''
      }));
    } else if (item.category === '영상') {
      const q = encodeURIComponent(`${item.genre !== '일반' ? item.genre : item.creator}`);
      const json = await (await fetch(`https://itunes.apple.com/search?term=${q}&country=KR&media=movie&limit=6`)).json();
      recs = (json.results || []).filter(r => (r.trackName || '').toLowerCase() !== item.title.toLowerCase()).slice(0, 3).map(r => ({
        title: r.trackName, creator: r.artistName || r.primaryGenreName,
        thumb: r.artworkUrl100 ? r.artworkUrl100.replace('100x100bb', '300x300bb') : FALLBACK_COVER,
        yt: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${r.trackName} 예고편`)}`, link: r.trackViewUrl || ''
      }));
    } else {
      const q = encodeURIComponent(`${item.creator !== '미상' ? item.creator : item.title}`);
      const json = await (await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=6`)).json();
      recs = (json.items || []).map(v => v.volumeInfo).filter(info => (info.title || '').toLowerCase() !== item.title.toLowerCase()).slice(0, 3).map(info => ({
        title: info.title, creator: (info.authors || ['저자미상']).join(', '),
        thumb: ((info.imageLinks && info.imageLinks.thumbnail) || FALLBACK_COVER).replace(/^http:\/\//i, 'https://'),
        yt: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${info.title} 책 리뷰`)}`, link: info.infoLink || ''
      }));
    }

    if (!recs.length) statusEl.textContent = '일치하는 연관 추천 자료가 없습니다.';
    else {
      statusEl.textContent = `유사 자료 ${recs.length}건`;
      recGrid.innerHTML = recs.map(r => `
        <div style="background:var(--win-gray); box-shadow:var(--bevel-btn); padding:5px; display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <img src="${esc(r.thumb)}" alt="${esc(r.title)}" onerror="this.onerror=null;this.src='${FALLBACK_COVER}';" style="width:100%; height:76px; object-fit:cover; border:1px solid #000; margin-bottom:4px;" />
            <div style="font-size:0.74rem; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(r.title)}</div>
            <div style="font-size:0.68rem; color:#444; margin-bottom:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(r.creator)}</div>
          </div>
          <div style="display:flex; gap:3px;">
            <a class="btn95 pink sm" style="flex:1;" href="${r.yt}" target="_blank" rel="noopener noreferrer">YouTube</a>
            ${r.link ? `<a class="btn95 sm" href="${esc(r.link)}" target="_blank" rel="noopener noreferrer">정보</a>` : ''}
          </div>
        </div>
      `).join('');
    }
  } catch { statusEl.textContent = '연관 자료 조회 중 통신 오류가 발생했습니다.'; }
}

document.addEventListener('click', async e => {
  const winEl = e.target.closest('.floating-win[data-item-key]');
  if (!winEl) return;

  const itemKey = winEl.dataset.itemKey;
  const item = detailItemRegistry[itemKey];
  const viewBox = winEl.querySelector('.det-view-mode');
  const editForm = winEl.querySelector('.det-edit-form');
  const confirmBar = winEl.querySelector('.del-confirm-bar');

  if (e.target.closest('.btn-toggle-share')) {
    e.preventDefault();
    e.stopPropagation();
    if (!item || !item.id || !checkCanEditItem(item)) return;
    const shareBtn = e.target.closest('.btn-toggle-share');
    shareBtn.disabled = true;
    try {
      const res = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'toggle_share', id: item.id })
      });
      const json = await res.json();
      if (json.status === 'success' && json.item) {
        playRetroTone('open');
        const idx = archiveItems.findIndex(x => String(x.id) === String(item.id));
        if (idx !== -1) archiveItems[idx] = json.item;
        saveLocalCache(STORAGE_KEYS.ARCHIVE, archiveItems);
        refreshAllViews();
        closeWindow(winEl.id);
        spawnDetailWindow(json.item);
      }
    } finally {
      shareBtn.disabled = false;
    }
    return;
  }

  if (e.target.closest('.btn-toggle-edit')) {
    e.preventDefault();
    e.stopPropagation();
    if (!checkCanEditItem(item)) return;
    playRetroTone('click');
    if (viewBox) viewBox.style.display = 'none';
    if (editForm) editForm.style.display = 'block';
    return;
  }

  if (e.target.closest('.btn-cancel-edit')) {
    e.preventDefault();
    e.stopPropagation();
    playRetroTone('click');
    if (editForm) editForm.style.display = 'none';
    if (viewBox) viewBox.style.display = 'block';
    return;
  }

  if (e.target.closest('.btn-delete-item')) {
    e.preventDefault();
    e.stopPropagation();
    if (!checkCanDeleteItem(item)) return;
    playRetroTone('click');
    if (confirmBar) confirmBar.style.display = 'flex';
    return;
  }

  if (e.target.closest('.btn-delete-cancel')) {
    e.preventDefault();
    e.stopPropagation();
    playRetroTone('click');
    if (confirmBar) confirmBar.style.display = 'none';
    return;
  }

  if (e.target.closest('.btn-delete-confirm')) {
    e.preventDefault();
    e.stopPropagation();
    if (!item || !item.id || !checkCanDeleteItem(item)) return;
    const me = typeof getCurrentUser === 'function' ? getCurrentUser() : { username: '', role: '' };
    const delBtn = e.target.closest('.btn-delete-confirm');
    delBtn.disabled = true;
    delBtn.textContent = '삭제 중...';
    setLoadingCursor(true);
    try {
      const res = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'delete', id: item.id, requester: me.username, requesterRole: me.role })
      });
      const json = await res.json();
      if (json.status === 'success') {
        playRetroTone('boom');
        archiveItems = archiveItems.filter(x => String(x.id) !== String(item.id));
        saveLocalCache(STORAGE_KEYS.ARCHIVE, archiveItems);
        delete detailItemRegistry[itemKey];
        refreshAllViews();
        closeWindow(winEl.id);
      }
    } finally {
      delBtn.disabled = false;
      delBtn.textContent = '삭제(Y)';
      setLoadingCursor(false);
    }
  }
});

document.addEventListener('submit', async e => {
  const editForm = e.target.closest('.det-edit-form');
  if (!editForm) return;
  e.preventDefault();
  e.stopPropagation();

  const winEl = editForm.closest('.floating-win[data-item-key]');
  if (!winEl) return;
  const itemKey = winEl.dataset.itemKey;
  const item = detailItemRegistry[itemKey];
  if (!item || !item.id || !checkCanEditItem(item)) return;

  const categoryVal = (editForm.category?.value || item.category || '도서').trim();
  const titleVal = (editForm.title?.value || '').trim();
  const creatorVal = (editForm.creator?.value || '').trim();
  const genreVal = (editForm.genre?.value || '').trim() || '일반';
  const coverUrlVal = (editForm.coverUrl?.value || '').trim();
  const sourceUrlVal = (editForm.sourceUrl?.value || '').trim();
  const reviewVal = (editForm.review?.value || '').trim();
  const checkedRating = editForm.querySelector('input[name="editRating"]:checked');
  const ratingVal = checkedRating ? Number(checkedRating.value) : (Number(item.rating) || 5);
  const sharedVal = editForm.shared ? (editForm.shared.checked ? 'Y' : 'N') : (item.shared || 'Y');
  const watchDateVal = editForm.dateY && editForm.dateM && editForm.dateD && typeof getWin95DateValue === 'function'
    ? getWin95DateValue(editForm.dateY, editForm.dateM, editForm.dateD)
    : item.watchDate || normalizeDateString('');

  if (!titleVal || !creatorVal || !reviewVal) {
    showWin95MessageBox('입력 오류 — MY-ARCHIVE 95', '작품 제목, 저작·제작자, 감상 비평문은 필수 항목입니다.', 'boom');
    return;
  }

  const me = typeof getCurrentUser === 'function' ? getCurrentUser() : { username: '', role: '' };
  const saveBtn = editForm.querySelector('.btn-save-edit');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = '저장 중...'; }
  setLoadingCursor(true);

  try {
    const res = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'update', id: item.id, category: categoryVal, title: titleVal, creator: creatorVal,
        genre: genreVal, rating: ratingVal, watchDate: watchDateVal, review: reviewVal,
        coverUrl: coverUrlVal, sourceUrl: sourceUrlVal, owner: item.owner || me.username || '문태양',
        shared: sharedVal, requester: me.username, requesterRole: me.role
      })
    });
    const json = await res.json();
    if (json.status === 'success' && json.item) {
      playRetroTone('open');
      const idx = archiveItems.findIndex(x => String(x.id) === String(item.id));
      if (idx !== -1) archiveItems[idx] = json.item;
      detailItemRegistry[itemKey] = json.item;
      saveLocalCache(STORAGE_KEYS.ARCHIVE, archiveItems);
      refreshAllViews();
      closeWindow(winEl.id);
      spawnDetailWindow(json.item);
    }
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = '저장(S)'; }
    setLoadingCursor(false);
  }
});

// ============================================================
// 7. 새 감상 기록 등록 모달 & 메모장 & 미니 앱
// ============================================================
let regEventsBound = false;
let regSearchAbortCtrl = null;

function syncRegisterCategoryState(cat) {
  const cleanCat = ['도서', '음악', '영상', '기타'].includes(cat) ? cat : '';
  const catSelect = document.getElementById('inp-category');
  const statusBadge = document.getElementById('reg-cat-badge');
  const searchInp = document.getElementById('inp-search-query');
  const searchBtn = document.getElementById('btn-auto-search');
  if (catSelect) catSelect.value = cleanCat;
  document.querySelectorAll('[data-reg-cat-pill]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.regCatPill === cleanCat);
  });
  if (statusBadge) statusBadge.textContent = cleanCat ? `선택: ${cleanCat}` : '미선택';
  if (searchInp && searchBtn) {
    searchInp.disabled = !cleanCat;
    searchBtn.disabled = !cleanCat;
    searchInp.placeholder = cleanCat ? `${cleanCat} 제목, 제작자 또는 URL 입력...` : '먼저 위에서 매체를 선택하세요...';
  }
}

function ensureRegisterWindowExists() {
  let regWin = document.getElementById('win-register');
  if (!regWin) {
    regWin = document.createElement('div');
    regWin.className = 'floating-win';
    regWin.id = 'win-register';
    regWin.dataset.winTitle = '[+] 새 감상 기록하기';
    regWin.style.top = '48px';
    regWin.style.left = '150px';
    regWin.style.width = '560px';
    regWin.innerHTML = `
      <div class="win-titlebar draggable">
        <div class="win-title-left"><span class="win-title-dot"></span><span>새 감상 기록하기</span></div>
        <div class="win-controls">
          <button type="button" class="win-ctrl-btn" data-action="minimize" data-target="win-register">_</button>
          <button type="button" class="win-ctrl-btn close" data-action="close" data-target="win-register">X</button>
        </div>
      </div>
      <div class="win-body">
        <div class="sunken-box" style="margin-bottom:7px; background:#fffdf2;">
          <div class="box-head"><span>1. 매체 선택 *</span><span class="tag-mini" id="reg-cat-badge">미선택</span></div>
          <div class="pill-group" style="display:flex; gap:4px; flex-wrap:wrap;">
            <button type="button" class="pill-btn" data-reg-cat-pill="도서" style="flex:1;">도서</button>
            <button type="button" class="pill-btn" data-reg-cat-pill="음악" style="flex:1;">음악</button>
            <button type="button" class="pill-btn" data-reg-cat-pill="영상" style="flex:1;">영상</button>
            <button type="button" class="pill-btn" data-reg-cat-pill="기타" style="flex:1;">기타</button>
          </div>
        </div>
        <div class="sunken-box" style="margin-bottom:8px; background:var(--win-gray);">
          <label style="display:block; font-size:0.76rem; font-weight:700; margin-bottom:4px;">2. 작품명 · 아티스트 · URL 검색</label>
          <div style="display:flex; gap:4px;">
            <input type="text" id="inp-search-query" placeholder="먼저 위에서 매체를 선택하세요..." disabled style="flex:1;" />
            <button type="button" class="btn95 yellow sm" id="btn-auto-search" disabled>검색</button>
          </div>
          <div id="reg-alert" class="dialog-banner"></div>
          <div id="rank-list" class="rank-list"></div>
        </div>
        <form id="archive-form" class="sunken-box">
          <div style="display:grid; grid-template-columns:104px 1fr; gap:8px; margin-bottom:7px;">
            <div>
              <img id="preview-cover" src="${FALLBACK_COVER}" alt="표지" style="width:100%; height:120px; object-fit:cover; border:1px solid #000; background:#111; margin-bottom:3px;" />
              <label class="btn95 sm" style="width:100%; font-size:0.7rem;">사진 압축<input type="file" id="inp-cover-file" accept="image/*" style="display:none;" /></label>
            </div>
            <div style="display:flex; flex-direction:column; gap:5px;">
              <div style="display:grid; grid-template-columns:1fr 1.3fr; gap:5px;">
                <div><label style="display:block; font-size:0.72rem; font-weight:700;">매체 *</label><select id="inp-category" class="win95-select" required style="width:100%;"><option value="">-- 선택 --</option><option value="도서">도서</option><option value="음악">음악</option><option value="영상">영상</option><option value="기타">기타</option></select></div>
                <div><label style="display:block; font-size:0.72rem; font-weight:700;">감상일</label><div style="display:flex; gap:2px;"><select id="inp-date-y" class="win95-select"></select><select id="inp-date-m" class="win95-select"></select><select id="inp-date-d" class="win95-select"></select></div></div>
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px;">
                <div><label style="display:block; font-size:0.72rem; font-weight:700;">제목 *</label><input type="text" id="inp-title" required style="width:100%;" /></div>
                <div><label style="display:block; font-size:0.72rem; font-weight:700;">제작자/저자 *</label><input type="text" id="inp-creator" required style="width:100%;" /></div>
              </div>
              <div><label style="display:block; font-size:0.72rem; font-weight:700;">장르</label><input type="text" id="inp-genre" style="width:100%;" /></div>
            </div>
          </div>
          <div style="margin-bottom:6px;"><span style="display:block; font-size:0.72rem; font-weight:700; margin-bottom:2px;">평점</span><div style="display:flex; gap:8px; font-size:0.74rem;">${[1,2,3,4,5].map(r => `<label style="display:inline-flex; align-items:center; gap:2px; cursor:pointer;"><input type="radio" name="reg-rating" value="${r}" ${r === 5 ? 'checked' : ''} /><span>${r}점</span></label>`).join('')}</div></div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px; margin-bottom:6px;">
            <div><label style="display:block; font-size:0.72rem; font-weight:700;">표지 URL</label><input type="text" id="inp-cover-url" style="width:100%;" /></div>
            <div><label style="display:block; font-size:0.72rem; font-weight:700;">원본 링크 URL</label><input type="text" id="inp-source-url" style="width:100%;" /></div>
          </div>
          <div style="margin-bottom:7px;"><label style="display:block; font-size:0.72rem; font-weight:700;">한줄평 *</label><textarea id="inp-review" rows="2" required style="width:100%;"></textarea></div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <label style="display:flex; align-items:center; gap:4px; font-size:0.74rem; font-weight:700;"><input type="checkbox" id="inp-share-board" checked /><span>광장 게시판 공개</span></label>
            <div style="display:flex; gap:4px;"><button type="button" class="btn95 sm" id="btn-cancel-reg" data-action="close" data-target="win-register">취소</button><button type="submit" class="btn95 yellow sm" id="btn-submit-reg">확인 및 저장</button></div>
          </div>
        </form>
      </div>
    `;
    (document.getElementById('dynamic-windows-container') || document.body).appendChild(regWin);
    enableWindowDrag(regWin);
  }

  if (!regEventsBound) {
    regEventsBound = true;
    document.querySelectorAll('[data-reg-cat-pill]').forEach(btn => {
      btn.addEventListener('click', () => {
        playRetroTone('click');
        syncRegisterCategoryState(btn.dataset.regCatPill);
      });
    });
    document.getElementById('inp-category')?.addEventListener('change', e => syncRegisterCategoryState(e.target.value));
    document.getElementById('archive-form')?.addEventListener('submit', handleRegisterSubmit);
  }
}

function openRegisterModal() {
  ensureRegisterWindowExists();
  const form = document.getElementById('archive-form');
  if (form) form.reset();
  syncRegisterCategoryState('');
  const ySel = document.getElementById('inp-date-y');
  const mSel = document.getElementById('inp-date-m');
  const dSel = document.getElementById('inp-date-d');
  if (ySel && mSel && dSel && typeof populateWin95DateSelects === 'function') populateWin95DateSelects(ySel, mSel, dSel);
  openWindow('win-register');
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const categoryVal = (document.getElementById('inp-category')?.value || '').trim();
  if (!categoryVal) return;
  const checkedRating = document.querySelector('input[name="reg-rating"]:checked');
  const ratingVal = checkedRating ? Number(checkedRating.value) : 5;
  const ySel = document.getElementById('inp-date-y');
  const mSel = document.getElementById('inp-date-m');
  const dSel = document.getElementById('inp-date-d');
  const watchDateVal = (ySel && mSel && dSel && typeof getWin95DateValue === 'function')
    ? getWin95DateValue(ySel, mSel, dSel)
    : normalizeDateString('');
  const titleVal = document.getElementById('inp-title').value.trim();
  const me = typeof getCurrentUser === 'function' ? getCurrentUser() : { username: '문태양' };
  const payload = {
    action: 'create', category: categoryVal, title: titleVal,
    creator: document.getElementById('inp-creator').value.trim(),
    genre: document.getElementById('inp-genre').value.trim() || '일반',
    rating: ratingVal, watchDate: watchDateVal,
    review: document.getElementById('inp-review').value.trim(),
    coverUrl: document.getElementById('inp-cover-url').value.trim(),
    sourceUrl: document.getElementById('inp-source-url').value.trim(),
    owner: me.username,
    shared: document.getElementById('inp-share-board')?.checked !== false ? 'Y' : 'N'
  };
  const btn = document.getElementById('btn-submit-reg');
  btn.disabled = true; btn.textContent = '저장 중...'; setLoadingCursor(true);
  try {
    const res = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.status === 'success' && json.item) {
      playRetroTone('boot');
      archiveItems.unshift(json.item);
      saveLocalCache(STORAGE_KEYS.ARCHIVE, archiveItems);
      refreshAllViews();
      closeWindow('win-register');
    }
  } finally {
    btn.disabled = false; btn.textContent = '확인 및 저장'; setLoadingCursor(false);
  }
}

function openMemoWindow() { openWindow('win-memo'); loadNotesData(); }

async function loadNotesData() {
  try {
    const json = await (await fetch(`${GAS_WEB_APP_URL}?action=notes`)).json();
    memoNotes = (json.status === 'success' && Array.isArray(json.notes)) ? json.notes : [];
    saveLocalCache(STORAGE_KEYS.NOTES, memoNotes);
  } catch {
    memoNotes = loadLocalCache(STORAGE_KEYS.NOTES, []);
  }
  renderNotesList();
}

function renderNotesList() {
  const container = document.getElementById('memo-list-container');
  const countBadge = document.getElementById('memo-count-badge');
  if (countBadge) countBadge.textContent = `${memoNotes.length}건`;
  if (!container) return;
  container.innerHTML = memoNotes.length
    ? memoNotes.map(n => `<div style="background:#fff;box-shadow:var(--bevel-sunken);padding:6px;margin-bottom:5px;"><div style="font-size:0.7rem;font-weight:700;color:#444;">${esc(n.title || '무제 메모')} · ${esc(n.createdAt)}</div><div style="font-size:0.78rem;white-space:pre-wrap;">${esc(n.content)}</div></div>`).join('')
    : `<div style="font-size:0.78rem;color:#444;">저장된 메모가 없습니다.</div>`;
}

document.getElementById('memo-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const title = document.getElementById('memo-title').value.trim() || '무제 아이디어';
  const content = document.getElementById('memo-content').value.trim();
  if (!content) return;
  const res = await fetch(GAS_WEB_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'note', title, content })
  });
  const json = await res.json();
  if (json.status === 'success' && json.note) {
    memoNotes.unshift(json.note);
    saveLocalCache(STORAGE_KEYS.NOTES, memoNotes);
    renderNotesList();
    document.getElementById('memo-form').reset();
  }
});

function initExtensionApps() {
  window.addEventListener('window:opened', ev => {
    const id = ev.detail && ev.detail.id;
    if (id === 'win-calendar') renderCalendarApp();
    if (id === 'win-mood') renderMoodRecommenderApp();
    if (id === 'win-quiz') renderArchiveQuizApp();
    if (id === 'win-timeline') renderTimelineAndRadarApp();
    if (id === 'win-stamp') renderStampAndReceiptApp();
    if (id === 'win-mailbox') renderMailboxAndQrApp();
  });
}

function renderCalendarApp() {
  const body = document.getElementById('calendar-app-body');
  if (body) body.innerHTML = `<div class="sunken-box">달력 보기 준비됨 (총 ${archiveItems.length}건)</div>`;
}
function renderMoodRecommenderApp() {
  const body = document.getElementById('mood-app-body');
  if (body) body.innerHTML = `<div class="sunken-box">기분별 추천 준비됨</div>`;
}
function renderArchiveQuizApp() {
  const body = document.getElementById('quiz-app-body');
  if (body) body.innerHTML = `<div class="sunken-box">퀴즈 준비됨</div>`;
}
function renderTimelineAndRadarApp() {
  const body = document.getElementById('timeline-app-body');
  if (body) body.innerHTML = `<div class="sunken-box">연대기 준비됨</div>`;
}
function renderStampAndReceiptApp() {
  const body = document.getElementById('stamp-app-body');
  if (body) body.innerHTML = `<div class="sunken-box">직인 생성기 준비됨</div>`;
}
function renderMailboxAndQrApp() {
  const body = document.getElementById('mailbox-app-body');
  if (body) body.innerHTML = `<div class="sunken-box">추천 우체통 준비됨</div>`;
}

window.openRegisterModal = openRegisterModal;
window.openAccountSettingsWindow = openAccountSettingsWindow;
window.spawnDetailWindow = spawnDetailWindow;
window.loadArchiveData = loadArchiveData;
window.refreshAllViews = refreshAllViews;
window.showWin95MessageBox = showWin95MessageBox;
window.selectCategoryFilter = selectCategoryFilter;

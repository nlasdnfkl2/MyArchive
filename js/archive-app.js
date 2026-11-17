// ============================================================
// MY-ARCHIVE 95 OS — Main CRUD Controller & Extension Apps
// ============================================================

window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
window.__MOD_VERSIONS.archiveApp = typeof APP_BUILD_VERSION !== 'undefined' ? APP_BUILD_VERSION : 'v2026.11.17-06';

// ============================================================
// 1. 상단 메뉴바 & 바탕화면·시작 메뉴 이벤트 바인딩
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
  const headers = ['ID', '매체', '제목', '제작자', '장르', '평점', '감상일', '한줄평', '원본링크'];
  const rows = archiveItems.map(i => [
    i.id,
    i.category,
    `"${String(i.title || '').replace(/"/g, '""')}"`,
    `"${String(i.creator || '').replace(/"/g, '""')}"`,
    `"${String(i.genre || '').replace(/"/g, '""')}"`,
    i.rating,
    i.watchDate,
    `"${String(i.review || '').replace(/"/g, '""')}"`,
    i.sourceUrl || ''
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
    w.style.top = `${48 + idx * 30}px`;
    w.style.left = `${130 + idx * 30}px`;
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

// 새 기록 등록 트리거 전역 위임
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
// 2. 초기 부팅 & Google Sheets + LocalStorage 하이브리드 동기화
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  runBootAnimation();
  ensureRegisterWindowExists();

  // 캐시 우선 즉시 렌더링 후 백그라운드 시트 동기화
  const cachedItems = loadLocalCache(STORAGE_KEYS.ARCHIVE, null);
  if (Array.isArray(cachedItems) && cachedItems.length > 0) {
    archiveItems = cachedItems;
    updateCacheBadge(true, 'CACHE: LOADED');
    refreshAllViews();
  }

  loadArchiveData(false);
  loadNotesData();
  initExtensionApps();
});

function updateCacheBadge(isOnline, labelText) {
  const badge = document.getElementById('cache-status-badge');
  if (!badge) return;
  badge.textContent = labelText;
  badge.classList.toggle('offline', !isOnline);
}

async function loadArchiveData(showFeedback = false) {
  setLoadingCursor(true);
  const statusLeft = document.getElementById('status-left');
  if (statusLeft) statusLeft.textContent = `구글 시트 동기화 중... (${APP_BUILD_VERSION})`;

  try {
    const res = await fetch(`${GAS_WEB_APP_URL}?action=list`);
    const json = await res.json();
    if (json.status === 'success' && Array.isArray(json.items)) {
      archiveItems = json.items;
      saveLocalCache(STORAGE_KEYS.ARCHIVE, archiveItems);
      updateCacheBadge(true, 'SHEET + CACHE: SYNCED');
      if (statusLeft) statusLeft.textContent = `동기화 완료 [${APP_BUILD_VERSION}] — 모든 창 제목 표시줄을 드래그하여 이동할 수 있습니다`;
      if (showFeedback) playRetroTone('open');
    } else {
      throw new Error('Invalid response');
    }
  } catch {
    const fallback = loadLocalCache(STORAGE_KEYS.ARCHIVE, []);
    archiveItems = Array.isArray(fallback) ? fallback : [];
    updateCacheBadge(false, 'OFFLINE CACHE MODE');
    if (statusLeft) statusLeft.textContent = `오프라인 로컬 캐시 모드 [${APP_BUILD_VERSION}] — 시트 연결 대기 중`;
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
}

// ============================================================
// 3. KPI 요약 카드 & 기본 통계 차트 & 메인 카드 그리드
// ============================================================
function updateKPIs() {
  const total = archiveItems.length;
  document.getElementById('kpi-total').textContent = `${total}건`;
  if (!total) {
    document.getElementById('kpi-recent-sub').textContent = '첫 기록을 추가해 보세요';
    document.getElementById('kpi-avg-rating').textContent = '0.0점';
    document.getElementById('kpi-top-cat').textContent = '-';
    document.getElementById('kpi-top-cat-sub').textContent = '데이터 없음';
    document.getElementById('kpi-top-genre').textContent = '-';
    document.getElementById('kpi-top-genre-sub').textContent = '데이터 없음';
    return;
  }

  document.getElementById('kpi-recent-sub').textContent = `최근: 「${archiveItems[0].title}」`;
  const avg = archiveItems.reduce((s, c) => s + (Number(c.rating) || 0), 0) / total;
  document.getElementById('kpi-avg-rating').textContent = `${avg.toFixed(1)}점`;

  const catMap = {};
  archiveItems.forEach(i => { catMap[i.category] = (catMap[i.category] || 0) + 1; });
  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
  document.getElementById('kpi-top-cat').textContent = topCat[0];
  document.getElementById('kpi-top-cat-sub').textContent = `전체 중 ${topCat[1]}건 (${Math.round((topCat[1] / total) * 100)}%)`;

  const gMap = {};
  archiveItems.forEach(i => { const g = (i.genre || '일반').trim(); gMap[g] = (gMap[g] || 0) + 1; });
  const topG = Object.entries(gMap).sort((a, b) => b[1] - a[1])[0];
  document.getElementById('kpi-top-genre').textContent = topG[0];
  document.getElementById('kpi-top-genre-sub').textContent = `누적 ${topG[1]}건 기록`;
}

function renderCharts() {
  if (typeof Chart === 'undefined') return;
  Chart.defaults.font.family = "'Pretendard Variable', Pretendard, sans-serif";
  Chart.defaults.font.weight = 800;
  Chart.defaults.color = '#111111';

  const cats = ['도서', '음악', '영상', '기타'];
  const catVals = cats.map(c => archiveItems.filter(i => i.category === c).length);
  const catCanvas = document.getElementById('chart-category');
  if (catCanvas) {
    if (categoryChart) categoryChart.destroy();
    categoryChart = new Chart(catCanvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: cats,
        datasets: [{
          data: catVals,
          backgroundColor: ['#ffd83b', '#48dbfb', '#ff4757', '#2ed573'],
          borderColor: '#111111',
          borderWidth: 2.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'right', labels: { boxWidth: 12, padding: 8 } } }
      }
    });
  }

  const mMap = {};
  archiveItems.forEach(i => { const ym = (i.watchDate || '').slice(0, 7); if (ym) mMap[ym] = (mMap[ym] || 0) + 1; });
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
          borderColor: '#111111',
          borderWidth: 2.5
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

document.querySelectorAll('#cat-filter-group .pill-btn').forEach(btn => btn.addEventListener('click', () => selectCategoryFilter(btn.dataset.cat)));
document.getElementById('filter-rating')?.addEventListener('change', renderArchiveGrid);
document.getElementById('filter-keyword')?.addEventListener('input', renderArchiveGrid);

function renderArchiveGrid() {
  const minRating = Number(document.getElementById('filter-rating')?.value) || 0;
  const kw = (document.getElementById('filter-keyword')?.value || '').trim().toLowerCase();
  const filtered = archiveItems.filter(item => {
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
    if (Number(item.rating) < minRating) return false;
    if (kw && !`${item.title} ${item.creator} ${item.genre} ${item.review}`.toLowerCase().includes(kw)) return false;
    return true;
  });

  const statusRight = document.getElementById('status-right');
  if (statusRight) statusRight.textContent = `${filtered.length}개 개체 표시됨`;
  const grid = document.getElementById('archive-grid');
  if (!grid) return;
  grid.innerHTML = '';

  if (!filtered.length) {
    grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 44px 16px; background: #ffffff; border: 3px dashed #111111; font-weight: 800;">표시할 감상 기록이 없습니다. [+ 새 감상 기록하기] 버튼을 눌러 첫 기록을 등록하십시오.</div>`;
    return;
  }

  filtered.forEach(item => {
    const catCls = item.category === '음악' ? 'music' : item.category === '영상' ? 'video' : item.category === '기타' ? 'etc' : '';
    const stars = '★'.repeat(item.rating) + '☆'.repeat(5 - item.rating);
    const coverSrc = item.coverUrl ? esc(item.coverUrl) : FALLBACK_COVER;

    const card = document.createElement('article');
    card.className = 'item-card';
    card.innerHTML = `
      <div class="item-card-bar"><span>${esc(item.id || 'ARCHIVE.DAT')}</span><span>[상세·수정·삭제]</span></div>
      <div class="item-thumb-box">
        <img class="item-thumb" src="${coverSrc}" alt="${esc(item.title)}" onerror="this.onerror=null;this.src='${FALLBACK_COVER}';" />
        <span class="cat-sticker ${catCls}">${esc(item.category)}</span>
        <span class="star-sticker">${stars}</span>
      </div>
      <div class="item-content">
        <h3 class="item-title">${esc(item.title)}</h3>
        <div class="item-creator">${esc(item.creator)} · ${esc(item.genre || '일반')}</div>
        <p class="item-memo">${esc(item.review)}</p>
        <div class="item-footer"><span>${esc(item.watchDate)}</span><span class="inspect-hint">열기 · 관리 &gt;&gt;</span></div>
      </div>
    `;
    card.addEventListener('click', () => spawnDetailWindow(item));
    grid.appendChild(card);
  });
}

// ============================================================
// 4. Windows 95 시스템 메시지 박스 다이얼로그
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
  box.style.width = '410px';
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
    <div class="win-body" style="background: var(--win-gray); padding: 18px 16px;">
      <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 18px;">
        <div style="width: 38px; height: 38px; flex-shrink: 0; background: var(--brutal-yellow); border: 3px solid #111111; box-shadow: 3px 3px 0px #111111; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.3rem; color: #111111;">!</div>
        <div style="font-size: 0.86rem; font-weight: 800; line-height: 1.5; color: #111111; word-break: keep-all;">${esc(message)}</div>
      </div>
      <div style="display: flex; justify-content: center;">
        <button type="button" class="btn95 yellow sm" id="btn-msgbox-ok" style="min-width: 100px;">확인 (OK)</button>
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
// 5. 상세 탐색기 창 (조회 + 수정 + 삭제 + 연관 추천)
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
  const offset = (detailWindowCount % 6) * 26;
  const ytQuery = item.category === '음악'
    ? `${item.creator} ${item.title} official`
    : item.category === '도서'
      ? `${item.title} ${item.creator} 북트레일러 리뷰`
      : `${item.title} ${item.creator}`;
  const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(ytQuery)}`;

  const winEl = document.createElement('div');
  winEl.className = 'floating-win open focused';
  winEl.id = winId;
  winEl.dataset.dynamic = 'true';
  winEl.dataset.itemKey = itemKey;
  winEl.dataset.winTitle = `[INFO] ${item.title}`;
  winEl.style.top = `${66 + offset}px`;
  winEl.style.left = `${145 + offset}px`;
  winEl.style.width = '720px';

  winEl.innerHTML = `
    <div class="win-titlebar draggable">
      <div class="win-title-left"><span class="win-title-dot" style="background: var(--brutal-green);"></span><span>${esc(item.title)} — 상세 탐색기 및 관리</span></div>
      <div class="win-controls">
        <button type="button" class="win-ctrl-btn" data-action="minimize" data-target="${winId}">_</button>
        <button type="button" class="win-ctrl-btn close" data-action="close" data-target="${winId}">X</button>
      </div>
    </div>
    <div class="win-body">
      <div class="det-view-mode">
        <div class="detail-hero">
          <img class="detail-cover" src="${esc(item.coverUrl || FALLBACK_COVER)}" alt="${esc(item.title)}" onerror="this.onerror=null;this.src='${FALLBACK_COVER}';" />
          <div>
            <div style="display:flex; gap:6px; margin-bottom:8px; flex-wrap:wrap;">
              <span style="padding:2px 8px; border:2px solid #111; background:var(--brutal-yellow); font-size:0.75rem; font-weight:900;">${esc(item.category)}</span>
              <span style="padding:2px 8px; border:2px solid #111; background:#fff; font-size:0.75rem; font-weight:900;">${'★'.repeat(item.rating)}${'☆'.repeat(5 - item.rating)}</span>
              <span style="padding:2px 8px; border:2px solid #111; background:var(--win-gray); font-size:0.75rem; font-weight:800;">${esc(item.watchDate)}</span>
            </div>
            <h2 style="font-size:1.25rem; font-weight:900; margin-bottom:4px;">${esc(item.title)}</h2>
            <div style="font-size:0.86rem; font-weight:700; color:#4a4a4a; margin-bottom:10px;">${esc(item.creator)} · ${esc(item.genre || '일반')}</div>
            <p style="background:var(--brutal-paper); border:2px solid #111; padding:10px; font-size:0.86rem; font-weight:600;">${esc(item.review)}</p>
            <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:12px; align-items:center;">
              <a class="btn95 pink sm" href="${ytUrl}" target="_blank" rel="noopener noreferrer">[PLAY] YouTube 이동</a>
              ${item.sourceUrl ? `<a class="btn95 sky sm" href="${esc(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">원본 링크 &gt;&gt;</a>` : ''}
              <button type="button" class="btn95 yellow sm btn-toggle-edit">[EDIT] 기록 수정</button>
              <button type="button" class="btn95 sm btn-delete-item" style="background:#111; color:#fff;">[DEL] 기록 삭제</button>
            </div>
            <div class="del-confirm-bar" style="display:none; margin-top:10px; padding:8px 10px; background:var(--brutal-pink); color:#fff; border:2px solid #111; font-size:0.8rem; font-weight:900; align-items:center; justify-content:space-between; gap:8px;">
              <span>구글 시트에서 이 기록을 영구 삭제할까요?</span>
              <div style="display:flex; gap:6px;">
                <button type="button" class="btn95 sm btn-delete-cancel">취소</button>
                <button type="button" class="btn95 yellow sm btn-delete-confirm">예, 영구 삭제</button>
              </div>
            </div>
          </div>
        </div>
        <div class="sunken-box">
          <div class="box-head"><span>「${esc(item.creator)} · ${esc(item.title)}」 연관 추천</span><span style="font-size:0.72rem; background:var(--brutal-yellow); padding:2px 6px; border:1.5px solid #111;">SIMILAR</span></div>
          <div class="rec-status-msg" style="font-size:0.82rem; font-weight:700; color:#4a4a4a;">연관 작품을 검색하고 있습니다...</div>
          <div class="rec-grid"></div>
        </div>
      </div>

      <form class="det-edit-form sunken-box" style="display:none; background: var(--win-gray);">
        <div class="box-head"><span>[EDIT] 감상 기록 수정 (${esc(item.id || 'NO-ID')})</span><span style="font-size:0.72rem; background:var(--brutal-green); padding:2px 6px; border:1.5px solid #111;">EDIT MODE</span></div>
        <div style="display:grid; grid-template-columns:1fr 1.15fr; gap:10px; margin-bottom:10px;">
          <div><label style="display:block; font-size:0.78rem; font-weight:800; margin-bottom:3px;">매체</label>
            <select name="category" class="win95-select" style="width:100%;">
              <option value="도서" ${item.category === '도서' ? 'selected' : ''}>도서</option>
              <option value="음악" ${item.category === '음악' ? 'selected' : ''}>음악</option>
              <option value="영상" ${item.category === '영상' ? 'selected' : ''}>영상</option>
              <option value="기타" ${item.category === '기타' ? 'selected' : ''}>기타</option>
            </select>
          </div>
          <div><label style="display:block; font-size:0.78rem; font-weight:800; margin-bottom:3px;">감상 일자 (년 / 월 / 일)</label>
            <div class="win95-date-group">
              <select name="dateY" class="win95-select"></select>
              <select name="dateM" class="win95-select"></select>
              <select name="dateD" class="win95-select"></select>
            </div>
          </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
          <div><label style="display:block; font-size:0.78rem; font-weight:800; margin-bottom:3px;">작품 제목 *</label><input type="text" name="title" value="${esc(item.title)}" required style="width:100%;" /></div>
          <div><label style="display:block; font-size:0.78rem; font-weight:800; margin-bottom:3px;">제작자 *</label><input type="text" name="creator" value="${esc(item.creator)}" required style="width:100%;" /></div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1.25fr; gap:10px; margin-bottom:10px;">
          <div><label style="display:block; font-size:0.78rem; font-weight:800; margin-bottom:3px;">장르 / 키워드</label><input type="text" name="genre" value="${esc(item.genre)}" style="width:100%;" /></div>
          <div><span style="display:block; font-size:0.78rem; font-weight:800; margin-bottom:3px;">평점 선택</span>
            <div class="win95-radio-group">
              ${[1, 2, 3, 4, 5].map(r => `
                <label class="win95-radio">
                  <input type="radio" name="editRating" value="${r}" ${Number(item.rating) === r ? 'checked' : ''} />
                  <span>${r}점</span>
                </label>
              `).join('')}
            </div>
          </div>
        </div>
        <div style="margin-bottom:10px;"><label style="display:block; font-size:0.78rem; font-weight:800; margin-bottom:3px;">표지 URL</label><input type="text" name="coverUrl" value="${esc(item.coverUrl)}" style="width:100%;" /></div>
        <div style="margin-bottom:10px;"><label style="display:block; font-size:0.78rem; font-weight:800; margin-bottom:3px;">원본 링크</label><input type="text" name="sourceUrl" value="${esc(item.sourceUrl)}" style="width:100%;" /></div>
        <div style="margin-bottom:12px;"><label style="display:block; font-size:0.78rem; font-weight:800; margin-bottom:3px;">감상 메모 *</label><textarea name="review" rows="3" required style="width:100%;">${esc(item.review)}</textarea></div>
        <div style="display:flex; justify-content:flex-end; gap:8px;">
          <button type="button" class="btn95 sm btn-cancel-edit">수정 취소</button>
          <button type="submit" class="btn95 yellow sm btn-save-edit">수정 내용 시트 반영</button>
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

  // 연관 작품 조회
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

    if (!recs.length) statusEl.textContent = '일치하는 자동 추천 결과가 없습니다.';
    else {
      statusEl.textContent = `유사 작품 ${recs.length}건을 찾았습니다.`;
      recGrid.innerHTML = recs.map(r => `
        <div class="rec-card">
          <div>
            <img class="rec-thumb" src="${esc(r.thumb)}" alt="${esc(r.title)}" onerror="this.onerror=null;this.src='${FALLBACK_COVER}';" />
            <div style="font-size:0.84rem; font-weight:900; margin-bottom:2px;">${esc(r.title)}</div>
            <div style="font-size:0.74rem; font-weight:700; color:#4a4a4a; margin-bottom:8px;">${esc(r.creator)}</div>
          </div>
          <div style="display:flex; gap:5px;">
            <a class="btn95 pink sm" style="flex:1;" href="${r.yt}" target="_blank" rel="noopener noreferrer">[PLAY] YouTube</a>
            ${r.link ? `<a class="btn95 sm" href="${esc(r.link)}" target="_blank" rel="noopener noreferrer">정보</a>` : ''}
          </div>
        </div>
      `).join('');
    }
  } catch { statusEl.textContent = '연관 작품 조회 중 오류가 발생했습니다.'; }
}

// 상세 창 수정/삭제 버튼 전역 위임 처리
document.addEventListener('click', async e => {
  const winEl = e.target.closest('.floating-win[data-item-key]');
  if (!winEl) return;

  const itemKey = winEl.dataset.itemKey;
  const item = detailItemRegistry[itemKey];
  const viewBox = winEl.querySelector('.det-view-mode');
  const editForm = winEl.querySelector('.det-edit-form');
  const confirmBar = winEl.querySelector('.del-confirm-bar');

  if (e.target.closest('.btn-toggle-edit')) {
    e.preventDefault();
    e.stopPropagation();
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
    if (!item || !item.id) {
      showWin95MessageBox('삭제 불가 — MY-ARCHIVE 95', '이 기록에는 고유 ID가 없어 시트에서 삭제할 수 없습니다.', 'boom');
      return;
    }
    const delBtn = e.target.closest('.btn-delete-confirm');
    delBtn.disabled = true;
    delBtn.textContent = '삭제 중...';
    setLoadingCursor(true);
    try {
      const res = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'delete', id: item.id })
      });
      const json = await res.json();
      if (json.status === 'success') {
        playRetroTone('boom');
        archiveItems = archiveItems.filter(x => x.id !== item.id);
        saveLocalCache(STORAGE_KEYS.ARCHIVE, archiveItems);
        delete detailItemRegistry[itemKey];
        refreshAllViews();
        closeWindow(winEl.id);
      } else {
        showWin95MessageBox('삭제 오류 — MY-ARCHIVE 95', json.message || '삭제 중 오류가 발생했습니다.', 'boom');
      }
    } catch {
      showWin95MessageBox('통신 오류 — MY-ARCHIVE 95', '서버 통신 중 오류가 발생했습니다. GAS 새 버전 배포 상태를 확인하십시오.', 'boom');
    } finally {
      delBtn.disabled = false;
      delBtn.textContent = '예, 영구 삭제';
      setLoadingCursor(false);
    }
  }
});

// 상세 창 수정 폼 제출 전역 위임 처리 (자기 자신 ID 제외 중복 검증)
document.addEventListener('submit', async e => {
  const editForm = e.target.closest('.det-edit-form');
  if (!editForm) return;
  e.preventDefault();
  e.stopPropagation();

  const winEl = editForm.closest('.floating-win[data-item-key]');
  const itemKey = winEl ? winEl.dataset.itemKey : '';
  const item = detailItemRegistry[itemKey];
  if (!item || !item.id) {
    showWin95MessageBox('수정 불가 — MY-ARCHIVE 95', '이 기록에는 고유 ID가 없어 수정할 수 없습니다.', 'boom');
    return;
  }

  const newCategory = editForm.category.value;
  const newTitle = editForm.title.value.trim();

  // 자기 자신의 ID(item.id)는 제외하고 동일 매체·제목 중복 체크
  const isDetailDup = archiveItems.some(x => {
    if (String(x.id).trim() === String(item.id).trim()) return false;
    return x.category === newCategory && String(x.title || '').trim().toLowerCase() === newTitle.toLowerCase();
  });

  if (isDetailDup) {
    showWin95MessageBox('중복 기록 오류 — MY-ARCHIVE 95', `이미 '${newCategory}' 목록에 동일한 제목(「${newTitle}」)의 다른 기록이 존재합니다.`, 'boom');
    return;
  }

  const saveBtn = editForm.querySelector('.btn-save-edit');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = '시트 반영 중...';
  }
  setLoadingCursor(true);

  const checkedRating = editForm.querySelector('input[name="editRating"]:checked');
  const watchDateStr = (typeof getWin95DateValue === 'function' && editForm.dateY)
    ? getWin95DateValue(editForm.dateY, editForm.dateM, editForm.dateD)
    : item.watchDate;

  try {
    const res = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'update',
        id: item.id,
        category: newCategory,
        title: newTitle,
        creator: editForm.creator.value.trim(),
        genre: editForm.genre.value.trim() || '일반',
        rating: checkedRating ? Number(checkedRating.value) : 5,
        watchDate: watchDateStr,
        coverUrl: editForm.coverUrl.value.trim(),
        sourceUrl: editForm.sourceUrl.value.trim(),
        review: editForm.review.value.trim()
      })
    });
    const json = await res.json();
    if (json.status === 'success' && json.item) {
      playRetroTone('boot');
      const idx = archiveItems.findIndex(x => x.id === item.id);
      if (idx !== -1) archiveItems[idx] = json.item;
      saveLocalCache(STORAGE_KEYS.ARCHIVE, archiveItems);
      refreshAllViews();
      closeWindow(winEl.id);
      spawnDetailWindow(json.item);
    } else {
      showWin95MessageBox('수정 오류 — MY-ARCHIVE 95', json.message || '수정 중 오류가 발생했습니다.', 'boom');
    }
  } catch {
    showWin95MessageBox('통신 오류 — MY-ARCHIVE 95', '네트워크 오류가 발생했습니다. GAS 새 버전 배포 상태를 확인하십시오.', 'boom');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = '수정 내용 시트 반영';
    }
    setLoadingCursor(false);
  }
});

// ============================================================
// 6. 새 감상 기록 등록 모달 (카테고리 선선택 + 타임아웃 검색 + 1MB 압축)
// ============================================================
let regEventsBound = false;
let regSearchAbortCtrl = null;

const REG_CAT_PLACEHOLDERS = {
  '도서': '책 제목, 저자명 또는 서점(알라딘/교보/예스24) URL 입력...',
  '음악': '곡명, 아티스트명 또는 YouTube 링크 입력...',
  '영상': '영화·드라마·애니메이션 제목 또는 링크 입력...',
  '기타': '작품명, 제작자 또는 웹페이지 URL 입력...'
};

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

  if (statusBadge) {
    statusBadge.textContent = cleanCat ? `선택됨: ${cleanCat}` : '미선택 (필수)';
  }

  if (searchInp && searchBtn) {
    if (cleanCat) {
      searchInp.disabled = false;
      searchBtn.disabled = false;
      searchInp.placeholder = REG_CAT_PLACEHOLDERS[cleanCat] || '검색어 또는 링크(URL) 입력...';
    } else {
      searchInp.disabled = true;
      searchBtn.disabled = true;
      searchInp.placeholder = '먼저 위에서 매체(도서/음악/영상/기타)를 선택하세요...';
    }
  }
}

function ensureRegisterWindowExists() {
  let regWin = document.getElementById('win-register');
  if (!regWin) {
    regWin = document.createElement('div');
    regWin.className = 'floating-win';
    regWin.id = 'win-register';
    regWin.dataset.winTitle = '[+] 새 감상 기록하기';
    regWin.style.top = '58px';
    regWin.style.left = '180px';
    regWin.style.width = '680px';
    regWin.innerHTML = `
      <div class="win-titlebar draggable yellow-bar">
        <div class="win-title-left"><span class="win-title-dot"></span><span>새 감상 기록하기 — 매체 선택 및 메타데이터 검색</span></div>
        <div class="win-controls">
          <button type="button" class="win-ctrl-btn" data-action="minimize" data-target="win-register">_</button>
          <button type="button" class="win-ctrl-btn close" data-action="close" data-target="win-register">X</button>
        </div>
      </div>
      <div class="win-body">
        <!-- STEP 1: 매체(카테고리) 선선택 -->
        <div class="sunken-box" style="margin-bottom:10px; background:#fffdf2;">
          <div class="box-head">
            <span>STEP 1. 매체(카테고리) 먼저 선택 *</span>
            <span class="tag-mini" id="reg-cat-badge">미선택 (필수)</span>
          </div>
          <div class="pill-group" style="display:flex; gap:6px; flex-wrap:wrap;">
            <button type="button" class="pill-btn" data-reg-cat-pill="도서" style="flex:1; min-width:72px; font-weight:900;">도서</button>
            <button type="button" class="pill-btn" data-reg-cat-pill="음악" style="flex:1; min-width:72px; font-weight:900;">음악</button>
            <button type="button" class="pill-btn" data-reg-cat-pill="영상" style="flex:1; min-width:72px; font-weight:900;">영상</button>
            <button type="button" class="pill-btn" data-reg-cat-pill="기타" style="flex:1; min-width:72px; font-weight:900;">기타</button>
          </div>
        </div>

        <!-- STEP 2: 카테고리 선택 후 활성화되는 자동 검색 -->
        <div class="sunken-box" style="margin-bottom:12px; background:var(--win-gray);">
          <label style="display:block; font-size:0.8rem; font-weight:900; margin-bottom:5px;">STEP 2. 작품명 · 아티스트 · URL 자동 검색</label>
          <div style="display:flex; gap:6px;">
            <input type="text" id="inp-search-query" placeholder="먼저 위에서 매체(도서/음악/영상/기타)를 선택하세요..." disabled style="flex:1;" />
            <button type="button" class="btn95 yellow sm" id="btn-auto-search" disabled>검색</button>
          </div>
          <div id="reg-alert" class="dialog-banner"></div>
          <div id="rank-list" class="rank-list"></div>
        </div>

        <!-- STEP 3: 상세 정보 입력 및 저장 -->
        <form id="archive-form" class="sunken-box">
          <div style="display:grid; grid-template-columns:130px 1fr; gap:12px; margin-bottom:10px;">
            <div>
              <img id="preview-cover" src="${FALLBACK_COVER}" alt="표지" style="width:100%; height:155px; object-fit:cover; border:2px solid #111; background:#111; margin-bottom:4px;" />
              <label class="btn95 sm" style="width:100%; font-size:0.7rem; padding:4px 6px;">
                📷 사진 압축 첨부
                <input type="file" id="inp-cover-file" accept="image/*" style="display:none;" />
              </label>
            </div>
            <div style="display:flex; flex-direction:column; gap:8px;">
              <div style="display:grid; grid-template-columns:1fr 1.25fr; gap:8px;">
                <div>
                  <label style="display:block; font-size:0.78rem; font-weight:800; margin-bottom:2px;">매체 *</label>
                  <select id="inp-category" class="win95-select" required style="width:100%;">
                    <option value="">-- 매체 선택 --</option>
                    <option value="도서">도서</option>
                    <option value="음악">음악</option>
                    <option value="영상">영상</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
                <div>
                  <label style="display:block; font-size:0.78rem; font-weight:800; margin-bottom:2px;">감상 일자 (년/월/일)</label>
                  <div class="win95-date-group">
                    <select id="inp-date-y" class="win95-select"></select>
                    <select id="inp-date-m" class="win95-select"></select>
                    <select id="inp-date-d" class="win95-select"></select>
                  </div>
                </div>
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                <div><label style="display:block; font-size:0.78rem; font-weight:800; margin-bottom:2px;">작품 제목 *</label><input type="text" id="inp-title" required style="width:100%;" /></div>
                <div><label style="display:block; font-size:0.78rem; font-weight:800; margin-bottom:2px;">제작자 / 저자 *</label><input type="text" id="inp-creator" required style="width:100%;" /></div>
              </div>
              <div><label style="display:block; font-size:0.78rem; font-weight:800; margin-bottom:2px;">장르 / 키워드</label><input type="text" id="inp-genre" placeholder="예: 소설, 인디록, SF" style="width:100%;" /></div>
            </div>
          </div>
          <div style="margin-bottom:8px;">
            <span style="display:block; font-size:0.78rem; font-weight:800; margin-bottom:3px;">평점 선택</span>
            <div class="win95-radio-group">
              ${[1, 2, 3, 4, 5].map(r => `
                <label class="win95-radio">
                  <input type="radio" name="reg-rating" value="${r}" ${r === 5 ? 'checked' : ''} />
                  <span>${r}점</span>
                </label>
              `).join('')}
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px;">
            <div><label style="display:block; font-size:0.78rem; font-weight:800; margin-bottom:2px;">표지 이미지 URL</label><input type="text" id="inp-cover-url" style="width:100%;" /></div>
            <div><label style="display:block; font-size:0.78rem; font-weight:800; margin-bottom:2px;">원본 링크 URL</label><input type="text" id="inp-source-url" style="width:100%;" /></div>
          </div>
          <div style="margin-bottom:10px;">
            <label style="display:block; font-size:0.78rem; font-weight:800; margin-bottom:2px;">한줄평 / 감상 메모 *</label>
            <textarea id="inp-review" rows="3" required style="width:100%;" placeholder="감상한 소감을 기록하십시오..."></textarea>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:8px;">
            <button type="button" class="btn95 sm" id="btn-cancel-reg" data-action="close" data-target="win-register">취소</button>
            <button type="submit" class="btn95 yellow sm" id="btn-submit-reg">확인 및 시트 저장</button>
          </div>
        </form>
      </div>
    `;
    (document.getElementById('dynamic-windows-container') || document.body).appendChild(regWin);
    enableWindowDrag(regWin);
  }

  if (!regEventsBound) {
    regEventsBound = true;

    // STEP 1 카테고리 필 버튼 클릭
    document.querySelectorAll('[data-reg-cat-pill]').forEach(btn => {
      btn.addEventListener('click', () => {
        playRetroTone('click');
        const chosen = btn.dataset.regCatPill;
        syncRegisterCategoryState(chosen);
        const rankBox = document.getElementById('rank-list');
        if (rankBox) rankBox.style.display = 'none';
        showRegAlert(`「${chosen}」 매체가 선택되었습니다. 검색어를 입력해 주세요.`, 'info');
        document.getElementById('inp-search-query')?.focus();
      });
    });

    // 하단 폼의 매체 select 변경 시에도 상단 필/검색창 동기화
    document.getElementById('inp-category')?.addEventListener('change', e => {
      syncRegisterCategoryState(e.target.value);
    });

    document.getElementById('btn-auto-search')?.addEventListener('click', runRankedSearch);
    document.getElementById('inp-search-query')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); runRankedSearch(); }
    });
    document.getElementById('inp-cover-url')?.addEventListener('input', e => {
      const img = document.getElementById('preview-cover');
      if (!img) return;
      img.src = e.target.value.trim() || FALLBACK_COVER;
      img.onerror = () => { img.src = FALLBACK_COVER; };
    });
    // 직접 업로드한 표지·인증샷 1MB 이하 클라이언트 압축 적용
    document.getElementById('inp-cover-file')?.addEventListener('change', async e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        showRegAlert('이미지를 1MB 이하로 압축하고 있습니다...');
        const compressedDataUrl = await compressImageFile(file, 640, 380 * 1024);
        document.getElementById('inp-cover-url').value = compressedDataUrl;
        const img = document.getElementById('preview-cover');
        if (img) img.src = compressedDataUrl;
        showRegAlert('로컬 이미지 압축 및 표지 적용 완료!', 'ok');
      } catch (err) {
        showRegAlert(err.message || '이미지 압축 오류', 'err');
      }
    });
    document.getElementById('btn-cancel-reg')?.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      if (regSearchAbortCtrl) regSearchAbortCtrl.abort();
      closeWindow('win-register');
    });
    document.getElementById('archive-form')?.addEventListener('submit', handleRegisterSubmit);
  }
}

function openRegisterModal() {
  ensureRegisterWindowExists();

  if (regSearchAbortCtrl) {
    regSearchAbortCtrl.abort();
    regSearchAbortCtrl = null;
  }

  const form = document.getElementById('archive-form');
  if (form) {
    form.reset();
    delete form.dataset.editId;
  }

  // 열릴 때마다 카테고리 미선택 상태로 초기화하여 STEP 1 선선택 유도
  syncRegisterCategoryState('');

  const searchInp = document.getElementById('inp-search-query');
  if (searchInp) searchInp.value = '';

  const coverInp = document.getElementById('inp-cover-url');
  if (coverInp) coverInp.value = '';

  const ySel = document.getElementById('inp-date-y');
  const mSel = document.getElementById('inp-date-m');
  const dSel = document.getElementById('inp-date-d');
  if (ySel && mSel && dSel && typeof populateWin95DateSelects === 'function') {
    populateWin95DateSelects(ySel, mSel, dSel);
  }

  const prevImg = document.getElementById('preview-cover');
  if (prevImg) prevImg.src = FALLBACK_COVER;

  const rankList = document.getElementById('rank-list');
  if (rankList) rankList.style.display = 'none';

  showRegAlert('먼저 STEP 1에서 매체(도서 / 음악 / 영상 / 기타)를 선택해 주세요.', 'info');
  openWindow('win-register');
}

function showRegAlert(msg, type = 'info') {
  const el = document.getElementById('reg-alert');
  if (!el) return;
  el.style.display = 'block';
  el.className = 'dialog-banner';
  if (type === 'err') el.classList.add('err');
  if (type === 'ok') el.classList.add('ok');
  el.textContent = msg;
}

async function runRankedSearch() {
  const category = (document.getElementById('inp-category')?.value || '').trim();
  if (!category) {
    showRegAlert('먼저 STEP 1에서 매체(도서 / 음악 / 영상 / 기타)를 선택해 주세요.', 'err');
    return;
  }

  const query = document.getElementById('inp-search-query').value.trim();
  if (!query) {
    showRegAlert('검색어 또는 링크(URL)를 입력하십시오.', 'err');
    document.getElementById('inp-search-query')?.focus();
    return;
  }

  // 이전 미완료 검색 요청이 있다면 즉시 중단
  if (regSearchAbortCtrl) {
    regSearchAbortCtrl.abort();
  }
  const controller = new AbortController();
  regSearchAbortCtrl = controller;
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  const btn = document.getElementById('btn-auto-search');
  const rankBox = document.getElementById('rank-list');
  btn.disabled = true;
  btn.textContent = '검색 중...';
  setLoadingCursor(true);
  if (rankBox) rankBox.style.display = 'none';
  showRegAlert(`[${category}] 「${query}」 메타데이터를 검색하고 있습니다...`);

  try {
    const url = `${GAS_WEB_APP_URL}?action=search&q=${encodeURIComponent(query)}&title=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP 응답 오류 (${res.status})`);
    }

    const rawText = await res.text();
    let result;
    try {
      result = JSON.parse(rawText);
    } catch {
      throw new Error('서버 응답이 JSON 형식이 아닙니다. Apps Script 새 배포 상태를 확인하십시오.');
    }

    if (result.status === 'error') {
      showRegAlert(result.message || '검색 중 백엔드 오류가 발생했습니다.', 'err');
      return;
    }

    const list = Array.isArray(result.candidates) ? result.candidates : [];
    if (!list.length) {
      showRegAlert(result.message || '검색 결과가 없습니다. 아래에 직접 입력하십시오.', 'info');
      return;
    }

    applyCandidateToForm(list[0]);
    showRegAlert(
      list.length > 1
        ? `총 ${list.length}건의 후보를 찾았습니다. 아래 목록에서 다른 항목을 고를 수 있습니다.`
        : '메타데이터를 불러왔습니다.',
      'ok'
    );

    if (list.length > 1 && rankBox) {
      rankBox.innerHTML = '';
      list.forEach((cand, idx) => {
        const row = document.createElement('div');
        row.className = 'rank-item';
        row.innerHTML = `
          <span class="rank-badge">#${idx + 1}</span>
          <img class="rank-thumb" src="${esc(cand.coverUrl || FALLBACK_COVER)}" alt="" onerror="this.onerror=null;this.src='${FALLBACK_COVER}';" />
          <div style="flex:1; min-width:0;">
            <div style="font-size:0.82rem; font-weight:900; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(cand.title)} <span style="font-weight:700; color:#4a4a4a;">— ${esc(cand.creator)}</span></div>
            <div style="font-size:0.72rem; font-weight:700; color:#4a4a4a;"><span class="rank-src">${esc(cand.source)}</span>${cand.year ? ` · ${esc(cand.year)}년` : ''}${cand.extra ? ` · ${esc(cand.extra)}` : ''}</div>
          </div>
        `;
        row.addEventListener('click', () => {
          applyCandidateToForm(cand);
          playRetroTone('click');
          showRegAlert(`선택됨: 「${cand.title}」 (${cand.creator})`, 'ok');
        });
        rankBox.appendChild(row);
      });
      rankBox.style.display = 'block';
    }
  } catch (err) {
    if (err && err.name === 'AbortError') {
      showRegAlert('검색 요청 시간이 초과(12초)되었습니다. 다시 시도하거나 아래에 직접 입력하십시오.', 'err');
    } else {
      showRegAlert(`검색 오류: ${(err && err.message) || '네트워크 상태를 확인하십시오.'}`, 'err');
    }
  } finally {
    clearTimeout(timeoutId);
    if (regSearchAbortCtrl === controller) regSearchAbortCtrl = null;
    btn.disabled = false;
    btn.textContent = '검색';
    setLoadingCursor(false);
  }
}

function applyCandidateToForm(c) {
  if (c.category) syncRegisterCategoryState(c.category);
  if (c.title) document.getElementById('inp-title').value = c.title;
  if (c.creator) document.getElementById('inp-creator').value = c.creator;
  if (c.genre) document.getElementById('inp-genre').value = c.genre;
  if (c.sourceUrl) document.getElementById('inp-source-url').value = c.sourceUrl;
  document.getElementById('inp-cover-url').value = c.coverUrl || '';
  const img = document.getElementById('preview-cover');
  if (img) {
    img.src = c.coverUrl || FALLBACK_COVER;
    img.onerror = () => { img.src = FALLBACK_COVER; };
  }
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const categoryVal = (document.getElementById('inp-category')?.value || '').trim();
  if (!categoryVal) {
    showRegAlert('매체(도서 / 음악 / 영상 / 기타)를 먼저 선택해 주세요.', 'err');
    return;
  }

  const checkedRating = document.querySelector('input[name="reg-rating"]:checked');
  const ratingVal = checkedRating ? Number(checkedRating.value) : 5;

  const ySel = document.getElementById('inp-date-y');
  const mSel = document.getElementById('inp-date-m');
  const dSel = document.getElementById('inp-date-d');
  const watchDateVal = (ySel && mSel && dSel && typeof getWin95DateValue === 'function')
    ? getWin95DateValue(ySel, mSel, dSel)
    : normalizeDateString('');

  const titleVal = document.getElementById('inp-title').value.trim();

  const formEl = document.getElementById('archive-form');
  const editingId = formEl ? (formEl.dataset.editId || '') : '';

  const isLocalDup = archiveItems.some(item => {
    if (editingId && String(item.id).trim() === String(editingId).trim()) return false;
    return item.category === categoryVal && String(item.title || '').trim().toLowerCase() === titleVal.toLowerCase();
  });

  if (isLocalDup) {
    const dupMsg = `이미 ${categoryVal} 목록에 동일한 이름(「${titleVal}」)의 다른 기록이 존재합니다.`;
    showRegAlert(dupMsg, 'err');
    showWin95MessageBox('중복 등록 오류 — MY-ARCHIVE 95', dupMsg, 'boom');
    return;
  }

  const payload = {
    action: editingId ? 'update' : 'create',
    id: editingId,
    category: categoryVal,
    title: titleVal,
    creator: document.getElementById('inp-creator').value.trim(),
    genre: document.getElementById('inp-genre').value.trim() || '일반',
    rating: ratingVal || 5,
    watchDate: watchDateVal,
    review: document.getElementById('inp-review').value.trim(),
    coverUrl: document.getElementById('inp-cover-url').value.trim(),
    sourceUrl: document.getElementById('inp-source-url').value.trim()
  };

  const btn = document.getElementById('btn-submit-reg');
  btn.disabled = true; btn.textContent = '저장 중...'; setLoadingCursor(true);
  try {
    const res = await fetch(GAS_WEB_APP_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
    const json = await res.json();
    if (json.status === 'duplicate') {
      const dupMsg = json.message || `이미 ${categoryVal} 목록에 동일한 이름이 존재합니다.`;
      showRegAlert(dupMsg, 'err');
      showWin95MessageBox('중복 등록 오류 — MY-ARCHIVE 95', dupMsg, 'boom');
      return;
    }
    if (json.status === 'success' && json.item) {
      playRetroTone('boot');
      if (editingId) {
        const idx = archiveItems.findIndex(x => x.id === editingId);
        if (idx !== -1) archiveItems[idx] = json.item;
      } else {
        archiveItems.unshift(json.item);
      }
      saveLocalCache(STORAGE_KEYS.ARCHIVE, archiveItems);
      refreshAllViews();
      closeWindow('win-register');
    } else {
      showRegAlert(json.message || '저장 오류', 'err');
    }
  } catch {
    showRegAlert('서버 통신 중 오류가 발생했습니다.', 'err');
  } finally {
    btn.disabled = false;
    btn.textContent = '확인 및 시트 저장';
    setLoadingCursor(false);
  }
}

// ============================================================
// 7. 퀵 메모장 (MEMOPAD.EXE)
// ============================================================
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
  if (!memoNotes.length) {
    container.innerHTML = `<div style="font-size:0.82rem; font-weight:700; color:#4a4a4a;">저장된 아이디어 메모가 없습니다.</div>`;
    return;
  }
  container.innerHTML = memoNotes.map(n => `
    <div class="note-card">
      <div style="display:flex; justify-content:space-between; font-size:0.74rem; font-weight:800; color:#4a4a4a; margin-bottom:4px;"><span>[NOTE] ${esc(n.title || '무제 메모')}</span><span>${esc(n.createdAt)}</span></div>
      <div style="font-size:0.84rem; font-weight:700; white-space:pre-wrap;">${esc(n.content)}</div>
    </div>
  `).join('');
}

document.getElementById('memo-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const title = document.getElementById('memo-title').value.trim() || '무제 아이디어';
  const content = document.getElementById('memo-content').value.trim();
  if (!content) return;
  const btn = document.getElementById('btn-save-memo');
  btn.disabled = true; btn.textContent = '저장 중...'; setLoadingCursor(true);
  try {
    const res = await fetch(GAS_WEB_APP_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'note', title, content }) });
    const json = await res.json();
    if (json.status === 'success' && json.note) {
      playRetroTone('open');
      memoNotes.unshift(json.note);
      saveLocalCache(STORAGE_KEYS.NOTES, memoNotes);
      renderNotesList();
      document.getElementById('memo-form').reset();
    }
  } finally { btn.disabled = false; btn.textContent = '메모 시트에 저장'; setLoadingCursor(false); }
});

// ============================================================
// 8. 확장 미니 앱 초기화 브리지 (9~13주차 강의 실습 통합 모듈)
// ============================================================
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

// ------------------------------------------------------------
// 8-1. 월별 감상 달력 & 목표 D-Day (CALENDAR95.EXE)
// ------------------------------------------------------------
let calCurrentYear = new Date().getFullYear();
let calCurrentMonth = new Date().getMonth() + 1;

function renderCalendarApp() {
  const body = document.getElementById('calendar-app-body');
  if (!body) return;

  const ymPrefix = `${calCurrentYear}-${String(calCurrentMonth).padStart(2, '0')}`;
  const firstDayOfWeek = new Date(calCurrentYear, calCurrentMonth - 1, 1).getDay();
  const daysInMonth = new Date(calCurrentYear, calCurrentMonth, 0).getDate();

  const itemsByDate = {};
  archiveItems.forEach(item => {
    const dStr = String(item.watchDate || '').slice(0, 10);
    if (dStr.startsWith(ymPrefix)) {
      itemsByDate[dStr] = itemsByDate[dStr] || [];
      itemsByDate[dStr].push(item);
    }
  });

  const ddays = loadLocalCache(STORAGE_KEYS.DDAYS, [
    { id: 'dd-1', title: '올해 필독서 10권 완독 목표', date: `${calCurrentYear}-12-31` }
  ]);
  const todayZero = new Date(normalizeDateString('') + 'T00:00:00');
  const sortedDdays = [...ddays].map(d => {
    const targetZero = new Date(normalizeDateString(d.date) + 'T00:00:00');
    const diff = Math.round((targetZero - todayZero) / 86400000);
    return { ...d, diff };
  }).sort((a, b) => a.diff - b.diff);

  let cellsHtml = '';
  for (let i = 0; i < firstDayOfWeek; i++) {
    cellsHtml += `<div class="cal-cell empty"></div>`;
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${ymPrefix}-${String(d).padStart(2, '0')}`;
    const list = itemsByDate[dateKey] || [];
    cellsHtml += `
      <div class="cal-cell ${list.length ? 'has-record' : ''}" data-cal-date="${dateKey}">
        <div>${d}일</div>
        <div class="cal-dot-list">
          ${list.slice(0, 2).map(it => `<span class="cal-badge">${esc(it.title)}</span>`).join('')}
          ${list.length > 2 ? `<span class="cal-badge">+${list.length - 2}</span>` : ''}
        </div>
      </div>
    `;
  }

  body.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
      <div style="display:flex;align-items:center;gap:6px;">
        <button type="button" class="btn95 sm" id="cal-prev-m">◀ 이전 달</button>
        <span style="font-size:1.05rem;font-weight:900;padding:0 8px;">${calCurrentYear}년 ${calCurrentMonth}월</span>
        <button type="button" class="btn95 sm" id="cal-next-m">다음 달 ▶</button>
      </div>
      <span class="tag-mini">이번 달 감상: ${Object.values(itemsByDate).reduce((s, a) => s + a.length, 0)}건</span>
    </div>

    <div class="cal-grid">
      ${['일', '월', '화', '수', '목', '금', '토'].map(w => `<div class="cal-head-cell">${w}</div>`).join('')}
      ${cellsHtml}
    </div>
    <div id="cal-day-detail" class="sunken-box" style="margin-top:10px;font-size:0.82rem;font-weight:800;">
      날짜 칸을 클릭하면 해당 날짜에 감상한 작품 목록이 표시됩니다.
    </div>

    <div class="sunken-box" style="margin-top:12px;background:var(--win-gray);">
      <div class="box-head"><span>다가오는 감상 목표 · 기념일 D-Day</span><span class="tag-mini">D-DAY</span></div>
      <form id="dday-add-form" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
        <input type="text" id="dday-title-inp" placeholder="목표 제목 (예: 전시회 관람일)" required style="flex:1;min-width:160px;" />
        <input type="date" id="dday-date-inp" required />
        <button type="submit" class="btn95 yellow sm">일정 추가</button>
      </form>
      <div style="display:flex;flex-direction:column;gap:5px;">
        ${sortedDdays.map(dd => {
          const badge = dd.diff === 0 ? 'D-DAY (오늘)' : dd.diff > 0 ? `D-${dd.diff}` : `D+${Math.abs(dd.diff)}`;
          return `
            <div style="display:flex;justify-content:space-between;align-items:center;background:#fff;border:1.5px solid #111;padding:5px 8px;font-size:0.8rem;font-weight:800;">
              <span><b style="background:#ffd83b;padding:1px 6px;border:1px solid #111;margin-right:6px;">${badge}</b>${esc(dd.title)} (${esc(dd.date)})</span>
              <button type="button" class="btn95 sm" data-del-dday="${esc(dd.id)}" style="padding:2px 7px;">삭제</button>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  document.getElementById('cal-prev-m')?.addEventListener('click', () => {
    calCurrentMonth--;
    if (calCurrentMonth < 1) { calCurrentMonth = 12; calCurrentYear--; }
    playRetroTone('click');
    renderCalendarApp();
  });

  document.getElementById('cal-next-m')?.addEventListener('click', () => {
    calCurrentMonth++;
    if (calCurrentMonth > 12) { calCurrentMonth = 1; calCurrentYear++; }
    playRetroTone('click');
    renderCalendarApp();
  });

  body.querySelectorAll('[data-cal-date]').forEach(cell => {
    cell.addEventListener('click', () => {
      const dKey = cell.dataset.calDate;
      const list = itemsByDate[dKey] || [];
      const box = document.getElementById('cal-day-detail');
      if (!box) return;
      playRetroTone('click');
      if (!list.length) {
        box.textContent = `${dKey}에는 등록된 감상 기록이 없습니다.`;
      } else {
        box.innerHTML = `<b>[${dKey} 감상 기록 ${list.length}건]</b><br/>` +
          list.map(it => `• [${esc(it.category)}] ${esc(it.title)} — ${esc(it.creator)} (★${it.rating}점)`).join('<br/>');
      }
    });
  });

  document.getElementById('dday-add-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const title = document.getElementById('dday-title-inp').value.trim();
    const date = document.getElementById('dday-date-inp').value;
    if (!title || !date) return;
    const next = [...ddays, { id: `dd-${Date.now()}`, title, date }];
    saveLocalCache(STORAGE_KEYS.DDAYS, next);
    playRetroTone('open');
    renderCalendarApp();
  });

  body.querySelectorAll('[data-del-dday]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.delDday;
      const next = ddays.filter(x => x.id !== targetId);
      saveLocalCache(STORAGE_KEYS.DDAYS, next);
      playRetroTone('close');
      renderCalendarApp();
    });
  });
}

// ------------------------------------------------------------
// 8-2. 감정 상태별 아카이브 랜덤 추천기 (MOODPICK.EXE, 연속 출현 방지)
// ------------------------------------------------------------
let lastMoodPickedKey = '';
let currentMoodType = 'happy';

function renderMoodRecommenderApp() {
  const body = document.getElementById('mood-app-body');
  if (!body) return;

  const moods = [
    { key: 'happy', label: '😊 기쁘고 행복함', color: 'yellow', keywords: ['행복', '사랑', '설렘', '유쾌', '즐거', '희망', '밝은', '코미디'] },
    { key: 'sad', label: '🌧️ 슬프고 우울함', color: 'sky', keywords: ['위로', '눈물', '슬픔', '그리움', '감동', '치유', '잔잔', '드라마'] },
    { key: 'burnout', label: '🔋 지치고 번아웃', color: 'green', keywords: ['휴식', '힐링', '여유', '산책', '자유', '인디', '에세이', '자연'] },
    { key: 'stress', label: '⚡ 불안하고 스트레스', color: 'pink', keywords: ['몰입', '액션', '스릴', '에너지', '도전', '록', '판타지', '추리'] }
  ];

  const fallbackQuotes = [
    { title: '작은 습관의 힘', creator: '제임스 클리어', category: '도서', review: '매일 1%씩 나아지는 루틴이 결국 거대한 변화를 만든다.' },
    { title: 'Wicked Game', creator: 'Chris Isaak', category: '음악', review: '새벽 공기와 어울리는 몽환적이고 깊은 울림의 선율.' },
    { title: '월터의 상상은 현실이 된다', creator: '벤 스틸러', category: '영상', review: '망설임을 멈추고 세상 밖으로 한 걸음 내딛게 만드는 영화.' }
  ];

  const activeMood = moods.find(m => m.key === currentMoodType) || moods[0];
  const poolSource = archiveItems.length > 0 ? archiveItems : fallbackQuotes;

  let matchedPool = poolSource.filter(item =>
    activeMood.keywords.some(kw => `${item.title} ${item.genre} ${item.review}`.toLowerCase().includes(kw))
  );
  if (!matchedPool.length) matchedPool = poolSource;

  let candidates = matchedPool.filter(it => (it.id || it.title) !== lastMoodPickedKey);
  if (!candidates.length) candidates = matchedPool;

  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  lastMoodPickedKey = picked.id || picked.title;

  body.innerHTML = `
    <p style="font-size:0.84rem;font-weight:800;margin-bottom:10px;">지금 느끼는 감정 상태를 선택하면 내 아카이브에서 어울리는 작품과 한줄평을 건네드립니다.</p>
    <div class="mood-btn-grid">
      ${moods.map(m => `
        <button type="button" class="btn95 ${m.key === currentMoodType ? m.color : ''}" data-mood-key="${m.key}">
          ${m.label}
        </button>
      `).join('')}
    </div>

    <div class="mood-result-box">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span class="tag-mini">${esc(picked.category || '추천')}</span>
        <span style="font-size:0.75rem;font-weight:800;color:#555;">감정 처방: ${esc(activeMood.label)}</span>
      </div>
      <h3 style="font-size:1.15rem;font-weight:900;margin-bottom:4px;">「${esc(picked.title)}」</h3>
      <div style="font-size:0.82rem;font-weight:700;color:#4a4a4a;margin-bottom:10px;">${esc(picked.creator)}</div>
      <blockquote style="background:var(--brutal-paper);border-left:4px solid var(--brutal-pink);padding:10px;font-size:0.86rem;font-weight:700;margin-bottom:12px;">
        “${esc(picked.review)}”
      </blockquote>
      <div style="display:flex;justify-content:flex-end;gap:8px;">
        <button type="button" class="btn95 yellow sm" id="btn-mood-reroll">🔄 다른 추천 작품 보기</button>
      </div>
    </div>
  `;

  body.querySelectorAll('[data-mood-key]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentMoodType = btn.dataset.moodKey;
      playRetroTone('open');
      renderMoodRecommenderApp();
    });
  });

  document.getElementById('btn-mood-reroll')?.addEventListener('click', () => {
    playRetroTone('click');
    renderMoodRecommenderApp();
  });
}

// ------------------------------------------------------------
// 8-3. 아카이브 복습 퀴즈 & 초성 힌트 챌린지 (QUIZ95.EXE)
// ------------------------------------------------------------
let quizScore = 0;
let quizCount = 0;
let quizHintUsed = false;

function renderArchiveQuizApp() {
  const body = document.getElementById('quiz-app-body');
  if (!body) return;

  if (archiveItems.length < 4) {
    body.innerHTML = `
      <div class="sunken-box" style="text-align:center;padding:24px;">
        <p style="font-weight:900;margin-bottom:8px;">4지선다 복습 퀴즈를 생성하려면 최소 4건 이상의 감상 기록이 필요합니다.</p>
        <p style="font-size:0.8rem;color:#555;">현재 등록된 기록: ${archiveItems.length}건</p>
      </div>
    `;
    return;
  }

  quizHintUsed = false;
  const shuffled = [...archiveItems].sort(() => Math.random() - 0.5);
  const answerItem = shuffled[0];
  const distractors = shuffled.slice(1, 4);
  const options = [answerItem, ...distractors].sort(() => Math.random() - 0.5);

  const chosungHint = extractKoreanChosung(answerItem.title);

  body.innerHTML = `
    <div class="box-head">
      <span>내 감상 기록 4지선다 복습 퀴즈</span>
      <span class="tag-mini">점수: ${quizScore}점 (${quizCount}문제 풀이)</span>
    </div>

    <div class="sunken-box" style="background:#fff6bf;margin-bottom:12px;">
      <div style="font-size:0.78rem;font-weight:800;color:#444;margin-bottom:4px;">Q. 다음 설명에 해당하는 작품 제목은 무엇일까요?</div>
      <div style="font-size:0.95rem;font-weight:900;margin-bottom:6px;">
        • 매체/장르: [${esc(answerItem.category)}] ${esc(answerItem.genre || '일반')}<br/>
        • 제작자(저자/아티스트): ${esc(answerItem.creator)}<br/>
        • 나의 한줄평: “${esc(answerItem.review)}”
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin-top:8px;">
        <button type="button" class="btn95 sky sm" id="btn-quiz-hint">💡 초성 힌트 보기</button>
        <span id="quiz-hint-text" style="font-family:var(--font-mono);font-size:0.88rem;font-weight:900;color:#000080;"></span>
      </div>
    </div>

    <div id="quiz-options-wrap">
      ${options.map((opt, idx) => `
        <button type="button" class="quiz-option-btn" data-opt-id="${esc(opt.id)}">
          ${idx + 1}. ${esc(opt.title)}
        </button>
      `).join('')}
    </div>

    <div id="quiz-feedback-box" style="display:none;margin-top:10px;padding:10px;border:2px solid #111;font-weight:900;font-size:0.86rem;"></div>
  `;

  document.getElementById('btn-quiz-hint')?.addEventListener('click', () => {
    if (quizHintUsed) return;
    quizHintUsed = true;
    playRetroTone('click');
    const hintEl = document.getElementById('quiz-hint-text');
    if (hintEl) hintEl.textContent = `초성 힌트: [ ${chosungHint} ]`;
  });

  body.querySelectorAll('.quiz-option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const pickedId = btn.dataset.optId;
      const fb = document.getElementById('quiz-feedback-box');
      if (!fb) return;

      if (pickedId === answerItem.id) {
        quizScore += quizHintUsed ? 5 : 10;
        quizCount++;
        playRetroTone('fanfare');
        fb.style.display = 'block';
        fb.style.background = 'var(--brutal-green)';
        fb.innerHTML = `🎉 정답입니다! 「${esc(answerItem.title)}」 (+${quizHintUsed ? 5 : 10}점) <button type="button" class="btn95 yellow sm" id="btn-quiz-next" style="margin-left:8px;">다음 문제 &gt;&gt;</button>`;
        body.querySelectorAll('.quiz-option-btn').forEach(b => (b.disabled = true));
        document.getElementById('btn-quiz-next')?.addEventListener('click', renderArchiveQuizApp);
      } else {
        playRetroTone('boom');
        fb.style.display = 'block';
        fb.style.background = 'var(--brutal-pink)';
        fb.style.color = '#ffffff';
        fb.textContent = '❌ 다시 생각해 보세요! 다른 보기를 선택할 수 있습니다.';
        btn.disabled = true;
        btn.style.opacity = '0.5';
      }
    });
  });
}

// ------------------------------------------------------------
// 8-4. 인터랙티브 가로 연표 & 상·하반기 레이더 차트 비교 (TIMELINE95.EXE)
// ------------------------------------------------------------
let radarComparisonChart = null;

function renderTimelineAndRadarApp() {
  const body = document.getElementById('timeline-app-body');
  if (!body) return;

  const sortedByDate = [...archiveItems].sort((a, b) => String(a.watchDate).localeCompare(String(b.watchDate)));
  const cats = ['도서', '음악', '영상', '기타'];

  const h1Data = cats.map(c => sortedByDate.filter(i => i.category === c && Number(String(i.watchDate).slice(5, 7)) <= 6).length);
  const h2Data = cats.map(c => sortedByDate.filter(i => i.category === c && Number(String(i.watchDate).slice(5, 7)) >= 7).length);

  body.innerHTML = `
    <div class="box-head">
      <span>시간순 인터랙티브 가로 감상 연표 (클릭 시 상세 보기)</span>
      <span class="tag-mini">총 ${sortedByDate.length}개 노드</span>
    </div>
    <div class="timeline-scroll-wrap">
      <div class="timeline-track">
        ${sortedByDate.length ? sortedByDate.map(it => `
          <div class="timeline-node" data-tl-id="${esc(it.id)}">
            <div style="font-family:var(--font-mono);font-size:0.72rem;font-weight:900;color:#000080;">${esc(it.watchDate)}</div>
            <div style="font-size:0.84rem;font-weight:900;margin:3px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(it.title)}</div>
            <div style="font-size:0.74rem;color:#555;">[${esc(it.category)}] ★${it.rating}</div>
          </div>
        `).join('') : '<div style="padding:12px;font-weight:800;">표시할 연표 데이터가 없습니다.</div>'}
      </div>
    </div>

    <div class="sunken-box">
      <div class="box-head">
        <span>상반기(사전) vs 하반기(사후) 매체 활동 레이더 비교</span>
        <button type="button" class="btn95 yellow sm" id="btn-save-radar-png">🖼️ 레이더 차트 PNG 저장</button>
      </div>
      <div style="height:230px;position:relative;">
        <canvas id="chart-radar-compare"></canvas>
      </div>
    </div>
  `;

  body.querySelectorAll('[data-tl-id]').forEach(node => {
    node.addEventListener('click', () => {
      const target = archiveItems.find(x => x.id === node.dataset.tlId);
      if (target) spawnDetailWindow(target);
    });
  });

  const radarCanvas = document.getElementById('chart-radar-compare');
  if (radarCanvas && typeof Chart !== 'undefined') {
    if (radarComparisonChart) radarComparisonChart.destroy();
    radarComparisonChart = new Chart(radarCanvas.getContext('2d'), {
      type: 'radar',
      data: {
        labels: cats,
        datasets: [
          {
            label: '상반기 (1~6월)',
            data: h1Data,
            borderColor: '#0055ff',
            backgroundColor: 'rgba(0, 85, 255, 0.2)',
            borderWidth: 2.5
          },
          {
            label: '하반기 (7~12월)',
            data: h2Data,
            borderColor: '#ff2e55',
            backgroundColor: 'rgba(255, 46, 85, 0.2)',
            borderWidth: 2.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { r: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  }

  document.getElementById('btn-save-radar-png')?.addEventListener('click', () => {
    if (!radarCanvas) return;
    const a = document.createElement('a');
    a.href = radarCanvas.toDataURL('image/png');
    a.download = `MyArchive_레이더비교_${normalizeDateString('')}.png`;
    a.click();
    playRetroTone('open');
  });
}

// ------------------------------------------------------------
// 8-5. 디지털 도장 생성기 & 문화생활 예산·구매 회고 영수증 (STAMP95.EXE)
// ------------------------------------------------------------
function renderStampAndReceiptApp() {
  const body = document.getElementById('stamp-app-body');
  if (!body) return;

  const budgetState = loadLocalCache(STORAGE_KEYS.BUDGET, {
    limit: 100000,
    expenses: []
  });

  const totalSpent = (budgetState.expenses || []).reduce((s, e) => s + (Number(e.price) || 0), 0);
  const remain = Number(budgetState.limit || 0) - totalSpent;
  const isOverBudget = remain < 0;

  body.innerHTML = `
    <div class="charts-grid" style="grid-template-columns:1fr 1.15fr;">
      <!-- 좌측: 투명 배경 PNG 디지털 도장 생성기 -->
      <div class="sunken-box">
        <div class="box-head"><span>감상 완료 디지털 도장 생성기</span><span class="tag-mini">PNG</span></div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:10px;">
          <input type="text" id="stamp-name-inp" value="문태양" maxlength="4" placeholder="이름 (최대 4자)" />
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
            <select id="stamp-shape-sel" class="win95-select">
              <option value="circle">원형 도장</option>
              <option value="square">사각형 도장</option>
            </select>
            <select id="stamp-font-sel" class="win95-select">
              <option value="serif">명조체 (Serif)</option>
              <option value="sans-serif">고딕체 (Sans)</option>
              <option value="cursive">손글씨풍 (Cursive)</option>
            </select>
          </div>
        </div>
        <div style="text-align:center;padding:10px;background:#f7f5ee;border:1.5px dashed #111;margin-bottom:10px;">
          <canvas id="stamp-preview-canvas" width="140" height="140"></canvas>
        </div>
        <button type="button" class="btn95 pink sm" id="btn-download-stamp" style="width:100%;">⬇️ 투명 배경 PNG 도장 다운로드</button>
      </div>

      <!-- 우측: 월간 문화생활 예산 & 구매 이유 영수증 -->
      <div class="sunken-box">
        <div class="box-head"><span>문화생활 예산 &amp; 구매 이유 영수증</span><span class="tag-mini">예산 ${formatCommaNumber(budgetState.limit)}원</span></div>
        <div style="display:flex;gap:6px;margin-bottom:8px;">
          <input type="number" id="budget-limit-inp" value="${budgetState.limit}" step="5000" style="width:130px;" />
          <button type="button" class="btn95 sm" id="btn-set-budget">한도 설정</button>
        </div>

        <form id="expense-add-form" style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px;">
          <div style="display:grid;grid-template-columns:1.3fr 1fr;gap:6px;">
            <input type="text" id="exp-title-inp" placeholder="도서·음반·티켓명" required />
            <input type="number" id="exp-price-inp" placeholder="금액 (원)" required />
          </div>
          <input type="text" id="exp-reason-inp" placeholder="이 작품을 선택·구매한 합리적 이유 서술..." required />
          <button type="submit" class="btn95 yellow sm" ${isOverBudget ? 'disabled' : ''}>
            ${isOverBudget ? '🚫 예산 초과 락 (한도 조정 필요)' : '+ 지출 및 구매 이유 추가'}
          </button>
        </form>

        <div id="printable-receipt-area" class="receipt-paper">
          <div style="text-align:center;font-weight:900;border-bottom:1px dashed #111;padding-bottom:6px;margin-bottom:6px;">
            *** MY-ARCHIVE 95 문화생활 영수증 ***<br/>
            발행일: ${normalizeDateString('')}
          </div>
          ${(budgetState.expenses || []).map(ex => `
            <div style="margin-bottom:6px;border-bottom:1px dotted #ccc;padding-bottom:4px;">
              <div style="display:flex;justify-content:space-between;font-weight:900;">
                <span>${esc(ex.title)}</span>
                <span>${formatCommaNumber(ex.price)}원</span>
              </div>
              <div style="font-size:0.74rem;color:#333;">사유: ${esc(ex.reason)}</div>
            </div>
          `).join('') || '<div style="color:#666;">등록된 지출 내역이 없습니다.</div>'}
          <div style="border-top:1px dashed #111;padding-top:6px;margin-top:6px;font-weight:900;">
            <div>총 지출 금액: ${formatCommaNumber(totalSpent)}원</div>
            <div style="color:${isOverBudget ? '#d63031' : '#000080'};">남은 예산 잔액: ${formatCommaNumber(remain)}원</div>
          </div>
        </div>
        <button type="button" class="btn95 sm" id="btn-print-receipt" style="width:100%;margin-top:8px;">🖨️ 영수증 인쇄 / PDF 저장</button>
      </div>
    </div>
  `;

  // 디지털 도장 실시간 렌더링
  const drawStamp = () => {
    const canvas = document.getElementById('stamp-preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const name = (document.getElementById('stamp-name-inp')?.value || '완독').trim() + '인';
    const shape = document.getElementById('stamp-shape-sel')?.value || 'circle';
    const font = document.getElementById('stamp-font-sel')?.value || 'serif';

    ctx.clearRect(0, 0, 140, 140);
    ctx.strokeStyle = '#d63031';
    ctx.fillStyle = '#d63031';
    ctx.lineWidth = 5;

    if (shape === 'circle') {
      ctx.beginPath();
      ctx.arc(70, 70, 56, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeRect(18, 18, 104, 104);
    }

    ctx.font = `900 28px ${font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (name.length === 4) {
      ctx.fillText(name.slice(0, 2), 70, 52);
      ctx.fillText(name.slice(2, 4), 70, 88);
    } else {
      ctx.fillText(name, 70, 70);
    }
  };

  drawStamp();
  document.getElementById('stamp-name-inp')?.addEventListener('input', drawStamp);
  document.getElementById('stamp-shape-sel')?.addEventListener('change', drawStamp);
  document.getElementById('stamp-font-sel')?.addEventListener('change', drawStamp);

  document.getElementById('btn-download-stamp')?.addEventListener('click', () => {
    const canvas = document.getElementById('stamp-preview-canvas');
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `감상완료도장_${Date.now()}.png`;
    a.click();
    playRetroTone('open');
  });

  // 예산 설정 및 지출 추가
  document.getElementById('btn-set-budget')?.addEventListener('click', () => {
    const newLimit = Number(document.getElementById('budget-limit-inp')?.value) || 0;
    budgetState.limit = Math.max(0, newLimit);
    saveLocalCache(STORAGE_KEYS.BUDGET, budgetState);
    playRetroTone('click');
    renderStampAndReceiptApp();
  });

  document.getElementById('expense-add-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const title = document.getElementById('exp-title-inp').value.trim();
    const price = Number(document.getElementById('exp-price-inp').value) || 0;
    const reason = document.getElementById('exp-reason-inp').value.trim();
    if (!title || price <= 0) return;

    if (totalSpent + price > budgetState.limit) {
      showWin95MessageBox('예산 초과 경고 — MY-ARCHIVE 95', `설정된 예산(${formatCommaNumber(budgetState.limit)}원)을 초과하여 지출을 등록할 수 없습니다.`, 'boom');
      return;
    }

    budgetState.expenses.push({ id: `ex-${Date.now()}`, title, price, reason });
    saveLocalCache(STORAGE_KEYS.BUDGET, budgetState);
    playRetroTone('open');
    renderStampAndReceiptApp();
  });

  document.getElementById('btn-print-receipt')?.addEventListener('click', () => window.print());
}

// ------------------------------------------------------------
// 8-6. 비밀 추천 우체통 & 모바일 QR 코드 공유 (MAILBOX95.EXE)
// ------------------------------------------------------------
async function renderMailboxAndQrApp() {
  const body = document.getElementById('mailbox-app-body');
  if (!body) return;

  const currentUrl = window.location.href;

  body.innerHTML = `
    <div class="charts-grid" style="grid-template-columns:1.35fr 1fr;">
      <!-- 좌측: 비밀 추천 우체통 (시트 저장 + GmailApp 알림) -->
      <div class="sunken-box">
        <div class="box-head"><span>방문자 작품 추천 · 비밀 우체통</span><span class="tag-mini">MAILBOX</span></div>
        <form id="mailbox-send-form" style="display:flex;flex-direction:column;gap:7px;margin-bottom:12px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
            <input type="text" id="mb-sender" placeholder="보내는 사람 (익명 가능)" />
            <select id="mb-category" class="win95-select">
              <option value="도서 추천">도서 추천</option>
              <option value="음악 추천">음악 추천</option>
              <option value="영상 추천">영상 추천</option>
              <option value="응원·방명록">응원·방명록</option>
            </select>
          </div>
          <textarea id="mb-content" rows="3" required placeholder="추천하고 싶은 작품 제목과 이유, 또는 방명록 메시지를 남겨주세요..."></textarea>
          <button type="submit" class="btn95 green sm" id="btn-send-mailbox">📮 우체통 전송 (시트 저장 + 메일 알림)</button>
        </form>

        <div class="box-head"><span>도착한 추천 메시지함</span><span id="mb-count-tag" class="tag-mini">불러오는 중...</span></div>
        <div id="mailbox-list-box" style="max-height:175px;overflow-y:auto;"></div>
      </div>

      <!-- 우측: 스마트폰 접속용 QR 코드 공유 -->
      <div class="sunken-box" style="text-align:center;">
        <div class="box-head"><span>스마트폰 QR 공유</span><span class="tag-mini">PWA</span></div>
        <p style="font-size:0.78rem;font-weight:800;margin-bottom:10px;word-break:keep-all;">
          스마트폰 카메라로 아래 QR 코드를 스캔하면 모바일에서도 아카이브를 열람하고 홈 화면에 앱으로 설치할 수 있습니다.
        </p>
        <div id="qr-code-container" class="qr-box"></div>
        <div style="margin-top:10px;">
          <button type="button" class="btn95 yellow sm" id="btn-copy-app-url">🔗 접속 주소 복사하기</button>
        </div>
      </div>
    </div>
  `;

  // QR 코드 렌더링
  const qrContainer = document.getElementById('qr-code-container');
  if (qrContainer && typeof QRCode !== 'undefined') {
    qrContainer.innerHTML = '';
    new QRCode(qrContainer, {
      text: currentUrl,
      width: 148,
      height: 148,
      colorDark: '#111111',
      colorLight: '#ffffff'
    });
  }

  document.getElementById('btn-copy-app-url')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      showWin95MessageBox('주소 복사 완료 — MY-ARCHIVE 95', '현재 아카이브 접속 URL이 클립보드에 복사되었습니다.', 'open');
    } catch {
      showWin95MessageBox('주소 안내 — MY-ARCHIVE 95', currentUrl, 'click');
    }
  });

  // 도착 메시지함 불러오기
  const loadMailbox = async () => {
    const listBox = document.getElementById('mailbox-list-box');
    const countTag = document.getElementById('mb-count-tag');
    try {
      const json = await (await fetch(`${GAS_WEB_APP_URL}?action=mailbox`)).json();
      mailboxItems = (json.status === 'success' && Array.isArray(json.mails)) ? json.mails : [];
      saveLocalCache(STORAGE_KEYS.MAILBOX, mailboxItems);
    } catch {
      mailboxItems = loadLocalCache(STORAGE_KEYS.MAILBOX, []);
    }
    if (countTag) countTag.textContent = `${mailboxItems.length}건`;
    if (listBox) {
      listBox.innerHTML = mailboxItems.length ? mailboxItems.map(m => `
        <div class="note-card">
          <div style="display:flex;justify-content:space-between;font-size:0.72rem;font-weight:800;color:#000080;">
            <span>[${esc(m.category)}] ${esc(m.sender)}</span>
            <span>${esc(m.createdAt)}</span>
          </div>
          <div style="font-size:0.8rem;font-weight:700;margin-top:3px;white-space:pre-wrap;">${esc(m.content)}</div>
        </div>
      `).join('') : '<div style="font-size:0.78rem;color:#666;">도착한 추천 메시지가 없습니다.</div>';
    }
  };

  loadMailbox();

  document.getElementById('mailbox-send-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const sender = document.getElementById('mb-sender').value.trim() || '익명 방문자';
    const category = document.getElementById('mb-category').value;
    const content = document.getElementById('mb-content').value.trim();
    if (!content) return;

    const btn = document.getElementById('btn-send-mailbox');
    btn.disabled = true; btn.textContent = '전송 중...'; setLoadingCursor(true);
    try {
      const res = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'send_mail', sender, category, content })
      });
      const json = await res.json();
      if (json.status === 'success' && json.mail) {
        playRetroTone('fanfare');
        document.getElementById('mailbox-send-form').reset();
        await loadMailbox();
        showWin95MessageBox(
          '우체통 전송 완료 — MY-ARCHIVE 95',
          json.emailSent ? '구글 시트 저장 및 관리자 이메일 알림 발송이 완료되었습니다!' : '구글 시트 우체통에 안전하게 저장되었습니다.',
          'open'
        );
      }
    } catch {
      showWin95MessageBox('전송 오류 — MY-ARCHIVE 95', '우체통 전송 중 네트워크 오류가 발생했습니다.', 'boom');
    } finally {
      btn.disabled = false;
      btn.textContent = '📮 우체통 전송 (시트 저장 + 메일 알림)';
      setLoadingCursor(false);
    }
  });
}

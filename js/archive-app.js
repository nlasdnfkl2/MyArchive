window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
window.__MOD_VERSIONS.archiveApp = typeof APP_BUILD_VERSION !== 'undefined' ? APP_BUILD_VERSION : 'v2026.11.17-02';

// Menu & Start Menu Events
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
document.getElementById('mnu-sync-sheet')?.addEventListener('click', loadArchiveData);

document.getElementById('mnu-export-csv')?.addEventListener('click', () => {
  if (!archiveItems.length) return alert('내보낼 데이터가 없습니다.');
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
    w.style.top = `${56 + idx * 34}px`;
    w.style.left = `${140 + idx * 34}px`;
    focusWindow(w);
  });
});

document.getElementById('mnu-close-all-popups')?.addEventListener('click', () => {
  document.querySelectorAll('.floating-win.open').forEach(w => closeWindow(w.id));
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
document.getElementById('icon-book')?.addEventListener('click', () => selectCategoryFilter('도서'));
document.getElementById('icon-music')?.addEventListener('click', () => selectCategoryFilter('음악'));
document.getElementById('icon-video')?.addEventListener('click', () => selectCategoryFilter('영상'));

document.getElementById('sm-memo')?.addEventListener('click', openMemoWindow);
document.getElementById('sm-all')?.addEventListener('click', () => selectCategoryFilter('ALL'));
document.getElementById('sm-book')?.addEventListener('click', () => selectCategoryFilter('도서'));
document.getElementById('sm-music')?.addEventListener('click', () => selectCategoryFilter('음악'));
document.getElementById('sm-video')?.addEventListener('click', () => selectCategoryFilter('영상'));
document.getElementById('sm-reload')?.addEventListener('click', loadArchiveData);

function selectCategoryFilter(cat) {
  openWindow('win-main');
  selectedCategory = cat;
  document.querySelectorAll('#cat-filter-group .pill-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
  renderArchiveGrid();
}

// Initial Boot & Data Fetch
document.addEventListener('DOMContentLoaded', () => {
  runBootAnimation();
  ensureRegisterWindowExists();
  loadArchiveData();
  loadNotesData();
});

async function loadArchiveData() {
  setLoadingCursor(true);
  const statusLeft = document.getElementById('status-left');
  if (statusLeft) statusLeft.textContent = `구글 시트 동기화 중... (${APP_BUILD_VERSION})`;
  try {
    const res = await fetch(`${GAS_WEB_APP_URL}?action=list`);
    const json = await res.json();
    archiveItems = (json.status === 'success' && Array.isArray(json.items)) ? json.items : [];
  } catch {
    archiveItems = [];
  } finally {
    setLoadingCursor(false);
    if (statusLeft) statusLeft.textContent = `준비 완료 [${APP_BUILD_VERSION}] — 모든 창 제목 표시줄을 드래그하여 이동할 수 있습니다`;
  }
  refreshAllViews();
}

function refreshAllViews() {
  updateKPIs();
  renderCharts();
  renderArchiveGrid();
  updateJukebox();
  const visWin = document.getElementById('win-visualizer');
  if (visWin && visWin.classList.contains('open') && typeof buildVisualizerData === 'function') {
    buildVisualizerData();
  }
}

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
  Chart.defaults.font.family = "'Pretendard Variable', Pretendard, sans-serif";
  Chart.defaults.font.weight = 800;
  Chart.defaults.color = '#111111';

  const cats = ['도서', '음악', '영상', '기타'];
  const catVals = cats.map(c => archiveItems.filter(i => i.category === c).length);
  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart(document.getElementById('chart-category').getContext('2d'), {
    type: 'doughnut',
    data: { labels: cats, datasets: [{ data: catVals, backgroundColor: ['#ffd83b', '#48dbfb', '#ff4757', '#2ed573'], borderColor: '#111111', borderWidth: 3 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 13, padding: 10 } } } }
  });

  const mMap = {};
  archiveItems.forEach(i => { const ym = (i.watchDate || '').slice(0, 7); if (ym) mMap[ym] = (mMap[ym] || 0) + 1; });
  const months = Object.keys(mMap).sort();
  if (monthlyChart) monthlyChart.destroy();
  monthlyChart = new Chart(document.getElementById('chart-monthly').getContext('2d'), {
    type: 'bar',
    data: { labels: months.length ? months : ['기록 없음'], datasets: [{ data: months.length ? months.map(m => mMap[m]) : [0], backgroundColor: '#2ed573', borderColor: '#111111', borderWidth: 3 }] },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#dfdcd3' } }, x: { grid: { display: false } } }, plugins: { legend: { display: false } } }
  });
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

// ==========================================
// Detail Window (View + Edit + Delete + Recommendations)
// ==========================================
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
      alert('이 기록에는 고유 ID가 없어 시트에서 삭제할 수 없습니다.');
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
        delete detailItemRegistry[itemKey];
        refreshAllViews();
        closeWindow(winEl.id);
      } else {
        alert(json.message || '삭제 중 오류가 발생했습니다.');
      }
    } catch {
      alert('서버 통신 중 오류가 발생했습니다. GAS 새 버전 배포 상태를 확인하십시오.');
    } finally {
      delBtn.disabled = false;
      delBtn.textContent = '예, 영구 삭제';
      setLoadingCursor(false);
    }
  }
});

// 상세 창 수정 폼 제출 전역 위임 처리
document.addEventListener('submit', async e => {
  const editForm = e.target.closest('.det-edit-form');
  if (!editForm) return;
  e.preventDefault();
  e.stopPropagation();

  const winEl = editForm.closest('.floating-win[data-item-key]');
  const itemKey = winEl ? winEl.dataset.itemKey : '';
  const item = detailItemRegistry[itemKey];
  if (!item || !item.id) {
    alert('이 기록에는 고유 ID가 없어 수정할 수 없습니다.');
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
        category: editForm.category.value,
        title: editForm.title.value.trim(),
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
      refreshAllViews();
      closeWindow(winEl.id);
      spawnDetailWindow(json.item);
    } else {
      alert(json.message || '수정 중 오류가 발생했습니다.');
    }
  } catch {
    alert('네트워크 오류가 발생했습니다. GAS 새 버전 배포 상태를 확인하십시오.');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = '수정 내용 시트 반영';
    }
    setLoadingCursor(false);
  }
});

// ==========================================
// Register Modal
// ==========================================
let regEventsBound = false;

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
        <div class="win-title-left"><span class="win-title-dot"></span><span>새 감상 기록하기 — 메타데이터 검색 및 등록</span></div>
        <div class="win-controls">
          <button type="button" class="win-ctrl-btn" data-action="minimize" data-target="win-register">_</button>
          <button type="button" class="win-ctrl-btn close" data-action="close" data-target="win-register">X</button>
        </div>
      </div>
      <div class="win-body">
        <div class="sunken-box" style="margin-bottom:12px; background:var(--win-gray);">
          <label style="display:block; font-size:0.8rem; font-weight:900; margin-bottom:5px;">[SEARCH] 작품명 · 아티스트 · URL 자동 검색</label>
          <div style="display:flex; gap:6px;">
            <input type="text" id="inp-search-query" placeholder="예: 소나기, 뉴진스 Hype Boy, 인셉션 또는 링크..." style="flex:1;" />
            <button type="button" class="btn95 yellow sm" id="btn-auto-search">검색</button>
          </div>
          <div id="reg-alert" class="dialog-banner"></div>
          <div id="rank-list" class="rank-list"></div>
        </div>
        <form id="archive-form" class="sunken-box">
          <div style="display:grid; grid-template-columns:130px 1fr; gap:12px; margin-bottom:10px;">
            <div>
              <img id="preview-cover" src="${FALLBACK_COVER}" alt="표지" style="width:100%; height:165px; object-fit:cover; border:2px solid #111; background:#111;" />
            </div>
            <div style="display:flex; flex-direction:column; gap:8px;">
              <div style="display:grid; grid-template-columns:1fr 1.25fr; gap:8px;">
                <div>
                  <label style="display:block; font-size:0.78rem; font-weight:800; margin-bottom:2px;">매체 *</label>
                  <select id="inp-category" class="win95-select" style="width:100%;">
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
            <button type="button" class="btn95 sm" data-action="close" data-target="win-register">취소</button>
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
    document.getElementById('archive-form')?.addEventListener('submit', handleRegisterSubmit);
  }
}

function openRegisterModal() {
  ensureRegisterWindowExists();

  const form = document.getElementById('archive-form');
  if (form) form.reset();

  const searchInp = document.getElementById('inp-search-query');
  if (searchInp) searchInp.value = '';

  const coverInp = document.getElementById('inp-cover-url');
  if (coverInp) coverInp.value = '';

  const ySel = document.getElementById('inp-date-y');
  const mSel = document.getElementById('inp-date-m');
  const dSel = document.getElementById('inp-date-d');
  const singleDate = document.getElementById('inp-date');

  if (ySel && mSel && dSel && typeof populateWin95DateSelects === 'function') {
    populateWin95DateSelects(ySel, mSel, dSel);
  } else if (singleDate) {
    singleDate.value = new Date().toISOString().slice(0, 10);
  }

  const prevImg = document.getElementById('preview-cover');
  if (prevImg) prevImg.src = FALLBACK_COVER;

  const regAlert = document.getElementById('reg-alert');
  if (regAlert) regAlert.style.display = 'none';

  const rankList = document.getElementById('rank-list');
  if (rankList) rankList.style.display = 'none';

  openWindow('win-register');
  if (searchInp) searchInp.focus();
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
  const query = document.getElementById('inp-search-query').value.trim();
  const category = document.getElementById('inp-category').value;
  if (!query) { showRegAlert('검색어 또는 링크(URL)를 입력하십시오.', 'err'); return; }

  const btn = document.getElementById('btn-auto-search');
  const rankBox = document.getElementById('rank-list');
  btn.disabled = true; btn.textContent = '검색 중...'; setLoadingCursor(true);
  if (rankBox) rankBox.style.display = 'none';
  showRegAlert('메타데이터를 검색하고 있습니다...');

  try {
    const res = await fetch(`${GAS_WEB_APP_URL}?action=search&q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`);
    const result = await res.json();
    const list = result.candidates || [];
    if (!list.length) { showRegAlert(result.message || '검색 결과가 없습니다. 아래에 직접 입력하십시오.', 'info'); return; }

    applyCandidateToForm(list[0]);
    showRegAlert(list.length > 1 ? `총 ${list.length}건의 후보를 찾았습니다. 아래 목록에서 다른 항목을 고를 수 있습니다.` : '메타데이터를 불러왔습니다.', 'ok');

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
        row.addEventListener('click', () => { applyCandidateToForm(cand); playRetroTone('click'); showRegAlert(`선택됨: 「${cand.title}」 (${cand.creator})`, 'ok'); });
        rankBox.appendChild(row);
      });
      rankBox.style.display = 'block';
    }
  } catch { showRegAlert('검색 중 오류가 발생했습니다.', 'err'); }
  finally { btn.disabled = false; btn.textContent = '검색'; setLoadingCursor(false); }
}

function applyCandidateToForm(c) {
  if (c.category) document.getElementById('inp-category').value = c.category;
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
  const checkedRating = document.querySelector('input[name="reg-rating"]:checked');
  const selectRating = document.getElementById('inp-rating');
  const ratingVal = checkedRating
    ? Number(checkedRating.value)
    : (selectRating ? Number(selectRating.value) : 5);

  const ySel = document.getElementById('inp-date-y');
  const mSel = document.getElementById('inp-date-m');
  const dSel = document.getElementById('inp-date-d');
  const singleDate = document.getElementById('inp-date');
  const watchDateVal = (ySel && mSel && dSel && typeof getWin95DateValue === 'function')
    ? getWin95DateValue(ySel, mSel, dSel)
    : (singleDate ? singleDate.value : new Date().toISOString().slice(0, 10));

  const payload = {
    action: 'create',
    category: document.getElementById('inp-category').value,
    title: document.getElementById('inp-title').value.trim(),
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
    if (json.status === 'duplicate') { playRetroTone('boom'); showRegAlert(json.message, 'err'); return; }
    if (json.status === 'success' && json.item) { playRetroTone('boot'); archiveItems.unshift(json.item); refreshAllViews(); closeWindow('win-register'); }
    else showRegAlert(json.message || '저장 오류', 'err');
  } catch { showRegAlert('서버 통신 중 오류가 발생했습니다.', 'err'); }
  finally { btn.disabled = false; btn.textContent = '확인 및 시트 저장'; setLoadingCursor(false); }
}

// ==========================================
// Desktop Quick Memo
// ==========================================
function openMemoWindow() { openWindow('win-memo'); loadNotesData(); }

async function loadNotesData() {
  try {
    const json = await (await fetch(`${GAS_WEB_APP_URL}?action=notes`)).json();
    memoNotes = (json.status === 'success' && Array.isArray(json.notes)) ? json.notes : [];
  } catch { memoNotes = []; }
  renderNotesList();
}

function renderNotesList() {
  const container = document.getElementById('memo-list-container');
  const countBadge = document.getElementById('memo-count-badge');
  if (countBadge) countBadge.textContent = `${memoNotes.length}건`;
  if (!container) return;
  if (!memoNotes.length) { container.innerHTML = `<div style="font-size:0.82rem; font-weight:700; color:#4a4a4a;">저장된 아이디어 메모가 없습니다.</div>`; return; }
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
    if (json.status === 'success' && json.note) { playRetroTone('open'); memoNotes.unshift(json.note); renderNotesList(); document.getElementById('memo-form').reset(); }
  } finally { btn.disabled = false; btn.textContent = '메모 시트에 저장'; setLoadingCursor(false); }
});

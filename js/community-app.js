// ============================================================
// MY-ARCHIVE 95 OS — Community SNS Feed & Global Statistics
// (COMMUNITY95.EXE)
// ============================================================

window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
window.__MOD_VERSIONS.communityApp = 'v2026.11.22-v6';

const communityState = {
  catFilter: 'ALL',
  authorFilter: 'ALL',
  minRating: 0,
  sortBy: 'latest', // 'latest' | 'likes' | 'rating'
  keyword: '',
  showStats: true,
  isBusy: false,
  likes: {},    // { archiveId: [username, ...] }
  comments: {}, // { archiveId: [{ id, createdAt, author, content }] }
  openComments: {}
};

let commCatChart = null;
let commMonthChart = null;

function showCommunityLoadingOverlay(message = '중앙 전산실과 통신 중입니다...') {
  communityState.isBusy = true;
  if (typeof setLoadingCursor === 'function') setLoadingCursor(true);
  if (typeof window.setArchiveSyncStatus === 'function') {
    window.setArchiveSyncStatus('syncing', '동기화 중');
  }

  const host = document.getElementById('win-community') || document.body;
  if (host && getComputedStyle(host).position === 'static') {
    host.style.position = 'relative';
  }

  let overlay = document.getElementById('comm-loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'comm-loading-overlay';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    overlay.style.cssText = `
      position: absolute;
      inset: 0;
      z-index: 9999;
      background: rgba(0, 0, 0, 0.38);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      cursor: wait;
    `;
    overlay.innerHTML = `
      <div style="
        background: #c0c0c0;
        border: 2px solid #ffffff;
        outline: 2px solid #111111;
        box-shadow: 4px 4px 0 #111111;
        min-width: 240px;
        max-width: 360px;
      ">
        <div style="
          background: #000080;
          color: #ffffff;
          padding: 4px 8px;
          font-size: 0.78rem;
          font-weight: 900;
          display: flex;
          align-items: center;
          gap: 6px;
        ">
          <span class="archive-sync-spin" style="color:#00ff00;">↻</span>
          <span>COMMUNITY95.EXE — 통신 처리 중</span>
        </div>
        <div style="padding: 14px 16px; text-align: center;">
          <div id="comm-loading-text" style="font-size: 0.82rem; font-weight: 800; color: #111111; margin-bottom: 10px;">
            ${esc(message)}
          </div>
          <div style="height: 14px; background: #ffffff; border: 2px inset #808080; overflow: hidden;">
            <div class="archive-sync-spin" style="width: 100%; height: 100%; background: repeating-linear-gradient(90deg, #000080 0 10px, #48dbfb 10px 20px);"></div>
          </div>
        </div>
      </div>
    `;
    host.appendChild(overlay);
  } else {
    const txt = overlay.querySelector('#comm-loading-text');
    if (txt) txt.textContent = message;
    overlay.style.display = 'flex';
  }
}

function hideCommunityLoadingOverlay() {
  communityState.isBusy = false;
  if (typeof setLoadingCursor === 'function') setLoadingCursor(false);
  const overlay = document.getElementById('comm-loading-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

async function runCommunityServerAction(loadingText, requestFn) {
  if (communityState.isBusy) return null;
  showCommunityLoadingOverlay(loadingText);
  try {
    const result = await requestFn();
    if (typeof window.setArchiveSyncStatus === 'function') {
      window.setArchiveSyncStatus('done', '동기화 완료');
    }
    return result;
  } catch (err) {
    if (typeof window.setArchiveSyncStatus === 'function') {
      window.setArchiveSyncStatus('error', '동기화 실패');
    }
    throw err;
  } finally {
    hideCommunityLoadingOverlay();
  }
}

function openCommunityBoard() {
  openWindow('win-community');
  if (!Array.isArray(archiveItems) || archiveItems.length === 0) {
    if (typeof loadArchiveData === 'function') loadArchiveData(false);
  }
  loadCommunityInteractions();
  renderCommunityBoard();
}

async function loadCommunityInteractions() {
  try {
    const res = await fetch(`${GAS_WEB_APP_URL}?action=feed_interactions`);
    const json = await res.json();
    if (json.status === 'success') {
      communityState.likes = json.likes || {};
      communityState.comments = json.comments || {};
      renderCommunityBoard();
    }
  } catch {}
}

function getSharedFeedItems() {
  const all = Array.isArray(archiveItems) ? archiveItems : [];
  return all.filter(it => String(it.shared || 'Y').toUpperCase() !== 'N');
}

function renderCommunityBoard() {
  const body = document.getElementById('community-app-body');
  if (!body) return;

  const activeEl = document.activeElement;
  const isSearchFocused = activeEl && activeEl.id === 'comm-search-kw';
  const selStart = isSearchFocused ? activeEl.selectionStart : null;
  const selEnd = isSearchFocused ? activeEl.selectionEnd : null;

  const sharedAll = getSharedFeedItems();
  const me = typeof getCurrentUser === 'function'
    ? getCurrentUser()
    : { username: '문태양', role: 'owner', avatar: 'USER' };

  const authors = Array.from(new Set(sharedAll.map(i => i.owner || '문태양')));

  let filtered = sharedAll.filter(item => {
    if (communityState.catFilter !== 'ALL' && item.category !== communityState.catFilter) return false;
    if (communityState.authorFilter !== 'ALL' && (item.owner || '문태양') !== communityState.authorFilter) return false;
    if (Number(item.rating) < communityState.minRating) return false;
    if (communityState.keyword) {
      const hay = `${item.title} ${item.creator} ${item.genre} ${item.review} ${item.owner}`.toLowerCase();
      if (!hay.includes(communityState.keyword.toLowerCase())) return false;
    }
    return true;
  });

  if (communityState.sortBy === 'likes') {
    filtered = [...filtered].sort((a, b) => ((communityState.likes[b.id] || []).length) - ((communityState.likes[a.id] || []).length));
  } else if (communityState.sortBy === 'rating') {
    filtered = [...filtered].sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
  }

  const totalShared = sharedAll.length;
  const avgRating = totalShared > 0
    ? (sharedAll.reduce((s, c) => s + (Number(c.rating) || 0), 0) / totalShared).toFixed(1)
    : '0.0';
  const catCount = {};
  const authorCount = {};
  sharedAll.forEach(i => {
    catCount[i.category] = (catCount[i.category] || 0) + 1;
    const ow = i.owner || '문태양';
    authorCount[ow] = (authorCount[ow] || 0) + 1;
  });
  const topCat = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0] || ['-', 0];
  const topAuthors = Object.entries(authorCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const roleLabel = isAdminUser(me) ? '시스템 관리자' : (me.role === 'public' ? '공용 단말 계정' : '개인 회원 계정');

  body.innerHTML = `
    <!-- 상단 광장 게시판 빠른 공개 배너 -->
    <div class="sunken-box" style="background:#fffdf2; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
      <div style="display:flex; align-items:center; gap:10px;">
        <div class="sns-avatar-box">${typeof renderPixelAvatarHtml === 'function' ? renderPixelAvatarHtml(me.avatar, 24, me.role) : (me.role === 'public' ? PIXEL_ICONS.PUB_BADGE : PIXEL_ICONS.USER_BADGE)}</div>
        <div>
          <div style="font-size:0.84rem; font-weight:900;">현재 접속: <span style="color:#000080;">${esc(me.username)}</span> (${roleLabel})</div>
          <div style="font-size:0.75rem; color:#444; font-weight:700;">나의 감상평을 광장 게시판에 공개하거나 다른 회원의 추천 자료를 개인 보관함으로 스크랩하십시오.</div>
        </div>
      </div>
      <div style="display:flex; gap:6px; flex-wrap:wrap;">
        <button type="button" class="btn95 sm" id="btn-comm-toggle-stats">${communityState.showStats ? '[통계] 광장 통계 접기' : '[통계] 광장 통계 펼치기'}</button>
        <button type="button" class="btn95 yellow sm" id="btn-comm-write-post">+ 광장 게시판에 자료 올리기</button>
      </div>
    </div>

    <!-- 전체 게시판 통계 대시보드 -->
    <div id="comm-stats-panel" style="display:${communityState.showStats ? 'block' : 'none'}; margin-bottom:12px;">
      <div class="kpi-grid" style="margin-bottom:10px;">
        <div class="kpi-card yellow">
          <div class="kpi-label">광장 공개 게시물</div>
          <div class="kpi-val">${totalShared}건</div>
          <div class="kpi-sub">참여 회원 ${authors.length}명</div>
        </div>
        <div class="kpi-card sky">
          <div class="kpi-label">광장 평균 평점</div>
          <div class="kpi-val">${avgRating}점</div>
          <div class="kpi-sub">공개 자료 전체 기준</div>
        </div>
        <div class="kpi-card green">
          <div class="kpi-label">최다 공개 매체</div>
          <div class="kpi-val">${esc(topCat[0])}</div>
          <div class="kpi-sub">${topCat[1]}건 수록됨</div>
        </div>
        <div class="kpi-card pink">
          <div class="kpi-label">최다 기고 회원</div>
          <div class="kpi-val" style="font-size:1rem;">${topAuthors[0] ? esc(topAuthors[0][0]) : '-'}</div>
          <div class="kpi-sub">${topAuthors[0] ? `${topAuthors[0][1]}건 기고` : '기록 없음'}</div>
        </div>
      </div>

      <div class="charts-grid" style="margin-bottom:8px;">
        <div class="sunken-box">
          <div class="box-head"><span>광장 게시판 매체 분포</span><span class="tag-mini">COMMUNITY</span></div>
          <div style="height:140px; position:relative;"><canvas id="comm-chart-cat"></canvas></div>
        </div>
        <div class="sunken-box">
          <div class="box-head"><span>월별 광장 공개 추이</span><span class="tag-mini">TREND</span></div>
          <div style="height:140px; position:relative;"><canvas id="comm-chart-month"></canvas></div>
        </div>
      </div>
    </div>

    <!-- 광장 피드 필터 & 검색 바 -->
    <div class="toolbar-box" style="margin-bottom:12px;">
      <div class="pill-group">
        ${['ALL', '도서', '음악', '영상', '기타'].map(c => `
          <button type="button" class="pill-btn ${communityState.catFilter === c ? 'active' : ''}" data-comm-cat="${c}">${c === 'ALL' ? '전체 광장' : c}</button>
        `).join('')}
      </div>

      <div class="filter-controls" style="flex-wrap:wrap;">
        <select id="comm-filter-author" class="win95-select">
          <option value="ALL">모든 작성자 (${authors.length}명)</option>
          ${authors.map(a => `<option value="${esc(a)}" ${communityState.authorFilter === a ? 'selected' : ''}>@${esc(a)}</option>`).join('')}
        </select>
        <select id="comm-filter-rating" class="win95-select">
          <option value="0" ${communityState.minRating === 0 ? 'selected' : ''}>모든 평가 등급</option>
          <option value="5" ${communityState.minRating === 5 ? 'selected' : ''}>★★★★★ (5점)</option>
          <option value="4" ${communityState.minRating === 4 ? 'selected' : ''}>★★★★☆ (4점+)</option>
        </select>
        <select id="comm-sort-by" class="win95-select">
          <option value="latest" ${communityState.sortBy === 'latest' ? 'selected' : ''}>최신 등록순</option>
          <option value="likes" ${communityState.sortBy === 'likes' ? 'selected' : ''}>추천 인기순</option>
          <option value="rating" ${communityState.sortBy === 'rating' ? 'selected' : ''}>평점 높은순</option>
        </select>
        <input type="text" id="comm-search-kw" value="${esc(communityState.keyword)}" placeholder="작품명·작성자·비평문 검색..." />
      </div>
    </div>

    <!-- 광장 타임라인 리스트 -->
    <div class="sns-feed-stream" style="display:flex; flex-direction:column; gap:14px;">
      ${filtered.length === 0 ? `
        <div class="sunken-box" style="text-align:center; padding:36px; font-weight:800;">
          검색 조건에 부합하는 공개 게시물이 없습니다. 첫 감상평을 등록해 보십시오.
        </div>
      ` : filtered.map(item => buildSnsFeedCardHtml(item, me)).join('')}
    </div>
  `;

  bindCommunityBoardEvents(body);
  if (communityState.showStats) renderCommunityCharts(sharedAll);

  if (isSearchFocused) {
    const nextSearch = document.getElementById('comm-search-kw');
    if (nextSearch) {
      nextSearch.focus();
      if (selStart !== null && selEnd !== null) {
        nextSearch.setSelectionRange(selStart, selEnd);
      }
    }
  }
}

function buildSnsFeedCardHtml(item, me) {
  const likeUsers = communityState.likes[item.id] || [];
  const isLiked = likeUsers.includes(me.username);
  const cmtList = communityState.comments[item.id] || [];
  const isCmtOpen = Boolean(communityState.openComments[item.id]);
  const isPublicPost = isPublicArchiveItem(item);
  const deletable = canDeleteArchiveItem(item, me);
  const rVal = Math.max(1, Math.min(5, Number(item.rating) || 5));
  const stars = '★'.repeat(rVal) + '☆'.repeat(5 - rVal);

  return `
    <article class="sns-post-card" data-post-id="${esc(item.id)}">
      <div class="sns-post-header">
        <div style="display:flex; align-items:center; gap:8px;">
          <div class="sns-avatar-box">${isPublicPost ? PIXEL_ICONS.PUB_BADGE : PIXEL_ICONS.USER_BADGE}</div>
          <div>
            <div style="font-size:0.86rem; font-weight:900; display:flex; align-items:center; gap:6px;">
              <span>@${esc(item.owner || '문태양')}</span>
              <span class="sns-role-tag ${isPublicPost ? 'pub' : 'priv'}">${isPublicPost ? '공용 단말 게시물 (관리자 삭제)' : '개인 아카이브 공개'}</span>
            </div>
            <div style="font-size:0.72rem; color:#555; font-weight:700;">감상일자: ${esc(item.watchDate)} · 등록일자: ${esc(item.createdAt || item.watchDate)}</div>
          </div>
        </div>
        <div style="display:flex; gap:5px; align-items:center;">
          <span class="tag-mini" style="background:var(--brutal-yellow);">${esc(item.category)}</span>
          <span class="tag-mini" style="background:#111; color:#ffd83b;">${stars}</span>
        </div>
      </div>

      <div class="sns-post-body">
        <img class="sns-post-cover" src="${esc(item.coverUrl || FALLBACK_COVER)}" alt="${esc(item.title)}" onerror="this.onerror=null;this.src='${FALLBACK_COVER}';" />
        <div style="flex:1; min-width:0;">
          <h3 style="font-size:1.05rem; font-weight:900; margin-bottom:3px;">${esc(item.title)}</h3>
          <div style="font-size:0.78rem; font-weight:800; color:#000080; margin-bottom:8px;">${esc(item.creator)} · #${esc(item.genre || '일반')}</div>
          <p class="sns-post-review">${esc(item.review)}</p>
          <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;">
            <button type="button" class="btn95 sm btn-sns-inspect" data-id="${esc(item.id)}">상세 열람</button>
            ${item.sourceUrl ? `<a class="btn95 sky sm" href="${esc(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">원본 자료실</a>` : ''}
            ${(item.owner || '') !== me.username ? `<button type="button" class="btn95 sm btn-sns-scrap" data-id="${esc(item.id)}">내 보관함으로 스크랩</button>` : ''}
            ${deletable ? `<button type="button" class="btn95 sm btn-sns-delete-post" data-id="${esc(item.id)}" style="background:#111; color:#fff;">[DEL] 삭제</button>` : ''}
          </div>
        </div>
      </div>

      <div class="sns-post-actions">
        <button type="button" class="btn95 sm btn-sns-like ${isLiked ? 'pink' : ''}" data-id="${esc(item.id)}">
          ${isLiked ? '추천 취소' : '추천하기'} (${likeUsers.length})
        </button>
        <button type="button" class="btn95 sm btn-sns-cmt-toggle" data-id="${esc(item.id)}">
          한줄 의견 (${cmtList.length})
        </button>
      </div>

      <div class="sns-cmt-drawer" style="display:${isCmtOpen ? 'block' : 'none'};">
        <div style="display:flex; flex-direction:column; gap:5px; margin-bottom:8px;">
          ${cmtList.length === 0
            ? '<div style="font-size:0.75rem; color:#666;">첫 번째 한줄 의견을 남겨 보십시오.</div>'
            : cmtList.map(c => `
              <div style="background:#fff; border:1.5px solid #111; padding:5px 8px; font-size:0.78rem;">
                <b>@${esc(c.author)}</b> <span style="color:#666; font-size:0.7rem;">(${esc(c.createdAt)})</span>: ${esc(c.content)}
              </div>
            `).join('')}
        </div>
        <form class="sns-cmt-form" data-id="${esc(item.id)}" style="display:flex; gap:6px;">
          <input type="text" class="sns-cmt-input" placeholder="${esc(me.username)} 계정으로 한줄 의견 입력..." style="flex:1;" required />
          <button type="submit" class="btn95 yellow sm">등록</button>
        </form>
      </div>
    </article>
  `;
}

function renderCommunityCharts(items) {
  if (typeof Chart === 'undefined') return;
  const cats = ['도서', '음악', '영상', '기타'];
  const catVals = cats.map(c => items.filter(i => i.category === c).length);
  const c1 = document.getElementById('comm-chart-cat');
  if (c1) {
    if (commCatChart) commCatChart.destroy();
    commCatChart = new Chart(c1.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: cats,
        datasets: [{ data: catVals, backgroundColor: ['#ffd83b', '#48dbfb', '#ff4757', '#2ed573'], borderColor: '#111', borderWidth: 2 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 11 } } } }
    });
  }

  const mMap = {};
  items.forEach(i => { const ym = (i.watchDate || '').slice(0, 7); if (ym) mMap[ym] = (mMap[ym] || 0) + 1; });
  const months = Object.keys(mMap).sort();
  const c2 = document.getElementById('comm-chart-month');
  if (c2) {
    if (commMonthChart) commMonthChart.destroy();
    commMonthChart = new Chart(c2.getContext('2d'), {
      type: 'bar',
      data: {
        labels: months.length ? months : ['기록 없음'],
        datasets: [{ data: months.length ? months.map(m => mMap[m]) : [0], backgroundColor: '#48dbfb', borderColor: '#111', borderWidth: 2 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });
  }
}

function bindCommunityBoardEvents(body) {
  document.getElementById('btn-comm-toggle-stats')?.addEventListener('click', () => {
    communityState.showStats = !communityState.showStats;
    renderCommunityBoard();
  });

  document.getElementById('btn-comm-write-post')?.addEventListener('click', () => {
    if (typeof openRegisterModal === 'function') openRegisterModal(true);
  });

  body.querySelectorAll('[data-comm-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      communityState.catFilter = btn.dataset.commCat;
      renderCommunityBoard();
    });
  });

  document.getElementById('comm-filter-author')?.addEventListener('change', e => {
    communityState.authorFilter = e.target.value;
    renderCommunityBoard();
  });

  document.getElementById('comm-filter-rating')?.addEventListener('change', e => {
    communityState.minRating = Number(e.target.value) || 0;
    renderCommunityBoard();
  });

  document.getElementById('comm-sort-by')?.addEventListener('change', e => {
    communityState.sortBy = e.target.value;
    renderCommunityBoard();
  });

  document.getElementById('comm-search-kw')?.addEventListener('input', e => {
    communityState.keyword = e.target.value;
    renderCommunityBoard();
  });

  body.querySelectorAll('.btn-sns-inspect').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = archiveItems.find(x => x.id === btn.dataset.id);
      if (target && typeof spawnDetailWindow === 'function') spawnDetailWindow(target);
    });
  });

  // 권한 검증 기반 게시물 삭제 (작성자 본인 또는 관리자만 허용, 공용 게시물은 관리자 전용)
  body.querySelectorAll('.btn-sns-delete-post').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (communityState.isBusy) return;
      const target = archiveItems.find(x => x.id === btn.dataset.id);
      if (!target) return;

      if (!canDeleteArchiveItem(target)) {
        showWin95MessageBox(
          '삭제 권한 없음 — MY-ARCHIVE 95',
          isPublicArchiveItem(target)
            ? '공용 계정 게시물은 관리자 계정으로만 삭제할 수 있습니다.'
            : '감상평 삭제는 작성자 본인 또는 관리자 계정으로만 가능합니다.',
          'boom'
        );
        return;
      }

      const me = typeof getCurrentUser === 'function' ? getCurrentUser() : { username: '', role: '' };
      await runCommunityServerAction('게시물을 삭제하는 중입니다...', async () => {
        try {
          const res = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'delete',
              id: target.id,
              requester: me.username,
              requesterRole: me.role
            })
          });
          const json = await res.json();
          if (json.status === 'success') {
            playRetroTone('boom');
            archiveItems = archiveItems.filter(x => x.id !== target.id);
            saveLocalCache(STORAGE_KEYS.ARCHIVE, archiveItems);
            refreshAllViews();
          } else {
            showWin95MessageBox('삭제 거부 — MY-ARCHIVE 95', json.message || '삭제 처리 중 오류가 발생했습니다.', 'boom');
          }
        } catch {
          showWin95MessageBox('통신 오류 — MY-ARCHIVE 95', '서버 통신 중 회선 오류가 발생했습니다.', 'boom');
        }
      });
    });
  });

  // 추천 토글
  body.querySelectorAll('.btn-sns-like').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (communityState.isBusy) return;
      const arcId = btn.dataset.id;
      const me = getCurrentUser();
      playRetroTone('click');
      await runCommunityServerAction('추천 상태를 반영하는 중입니다...', async () => {
        try {
          const res = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'toggle_like', archiveId: arcId, author: me.username })
          });
          const json = await res.json();
          if (json.status === 'success') {
            communityState.likes = json.likes || {};
            communityState.comments = json.comments || {};
            renderCommunityBoard();
          }
        } catch {}
      });
    });
  });

  // 한줄 의견 서랍 열기/닫기
  body.querySelectorAll('.btn-sns-cmt-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const arcId = btn.dataset.id;
      communityState.openComments[arcId] = !communityState.openComments[arcId];
      renderCommunityBoard();
    });
  });

  // 한줄 의견 작성
  body.querySelectorAll('.sns-cmt-form').forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (communityState.isBusy) return;
      const arcId = form.dataset.id;
      const inp = form.querySelector('.sns-cmt-input');
      const text = (inp?.value || '').trim();
      if (!text) return;
      const me = getCurrentUser();
      await runCommunityServerAction('한줄 의견을 등록하는 중입니다...', async () => {
        try {
          const res = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'add_comment', archiveId: arcId, author: me.username, content: text })
          });
          const json = await res.json();
          if (json.status === 'success') {
            playRetroTone('open');
            communityState.openComments[arcId] = true;
            communityState.likes = json.likes || {};
            communityState.comments = json.comments || {};
            renderCommunityBoard();
          }
        } catch {}
      });
    });
  });

  // 내 보관함으로 스크랩
  body.querySelectorAll('.btn-sns-scrap').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (communityState.isBusy) return;
      const src = archiveItems.find(x => x.id === btn.dataset.id);
      const me = getCurrentUser();
      if (!src) return;
      await runCommunityServerAction('개인 보관함으로 스크랩하는 중입니다...', async () => {
        const res = await fetch(GAS_WEB_APP_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'create',
            category: src.category,
            title: src.title,
            creator: src.creator,
            genre: src.genre,
            rating: src.rating,
            watchDate: normalizeDateString(''),
            review: `[스크랩 @${src.owner}] ${src.review}`,
            coverUrl: src.coverUrl,
            sourceUrl: src.sourceUrl,
            owner: me.username,
            shared: 'N'
          })
        });
        const json = await res.json();
        if (json.status === 'success' && json.item) {
          archiveItems.unshift(json.item);
          saveLocalCache(STORAGE_KEYS.ARCHIVE, archiveItems);
          refreshAllViews();
          showWin95MessageBox('스크랩 완료 — MY-ARCHIVE 95', `「${src.title}」 자료가 ${me.username}님의 개인 보관함에 복사되었습니다.`, 'open');
        } else {
          showWin95MessageBox('스크랩 안내 — MY-ARCHIVE 95', json.message || '이미 개인 보관함에 존재하는 자료입니다.', 'boom');
        }
      });
    });
  });
}

window.openCommunityBoard = openCommunityBoard;
window.renderCommunityBoard = renderCommunityBoard;

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('window:opened', ev => {
    if (ev.detail && ev.detail.id === 'win-community') {
      loadCommunityInteractions();
      renderCommunityBoard();
    }
  });
});

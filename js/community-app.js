// ============================================================
// MY-ARCHIVE 95 OS — Community SNS Feed & Global Statistics
// (COMMUNITY95.EXE)
// ============================================================

window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
window.__MOD_VERSIONS.communityApp = 'v2026.11.22-v3';

const communityState = {
  catFilter: 'ALL',
  authorFilter: 'ALL',
  minRating: 0,
  sortBy: 'latest', // 'latest' | 'likes' | 'rating'
  keyword: '',
  showStats: true,
  likes: {},    // { archiveId: [username, ...] }
  comments: {}, // { archiveId: [{ id, createdAt, author, content }] }
  openComments: {}
};

let commCatChart = null;
let commMonthChart = null;

function openCommunityBoard() {
  openWindow('win-community');
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

  const sharedAll = getSharedFeedItems();
  const me = typeof getCurrentUser === 'function' ? getCurrentUser() : { username: '문태양', role: 'owner', avatar: '🐸' };

  // 작성자 목록 추출
  const authors = Array.from(new Set(sharedAll.map(i => i.owner || '문태양')));

  // 필터링 & 정렬
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

  // 전체 게시판 통계 지표 계산
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

  body.innerHTML = `
    <!-- 상단 SNS 빠른 공유 배너 -->
    <div class="sunken-box" style="background:#fffdf2; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="font-size:1.5rem;">${esc(me.avatar || '👤')}</span>
        <div>
          <div style="font-size:0.84rem; font-weight:900;">현재 접속: <span style="color:#000080;">${esc(me.username)}</span> (${me.role === 'public' ? '공용 계정' : '개인 계정'})</div>
          <div style="font-size:0.75rem; color:#444; font-weight:700;">내 감상을 전체 게시판에 공유하거나 다른 이용자의 추천작을 스크랩하세요!</div>
        </div>
      </div>
      <div style="display:flex; gap:6px; flex-wrap:wrap;">
        <button type="button" class="btn95 sm" id="btn-comm-toggle-stats">${communityState.showStats ? '📊 전체 통계 접기' : '📊 전체 통계 펼치기'}</button>
        <button type="button" class="btn95 yellow sm" id="btn-comm-write-post">✍️ 전체 게시판에 감상 올리기</button>
      </div>
    </div>

    <!-- 전체 게시판 통계 대시보드 -->
    <div id="comm-stats-panel" style="display:${communityState.showStats ? 'block' : 'none'}; margin-bottom:12px;">
      <div class="kpi-grid" style="margin-bottom:10px;">
        <div class="kpi-card yellow">
          <div class="kpi-label">전체 공유 게시글</div>
          <div class="kpi-val">${totalShared}건</div>
          <div class="kpi-sub">참여 이용자 ${authors.length}명</div>
        </div>
        <div class="kpi-card sky">
          <div class="kpi-label">커뮤니티 평균 평점</div>
          <div class="kpi-val">${avgRating}점</div>
          <div class="kpi-sub">전체 공유작 기준</div>
        </div>
        <div class="kpi-card green">
          <div class="kpi-label">인기 공유 매체</div>
          <div class="kpi-val">${esc(topCat[0])}</div>
          <div class="kpi-sub">${topCat[1]}건 공유됨</div>
        </div>
        <div class="kpi-card pink">
          <div class="kpi-label">활발한 공유 멤버</div>
          <div class="kpi-val" style="font-size:1rem;">${topAuthors[0] ? esc(topAuthors[0][0]) : '-'}</div>
          <div class="kpi-sub">${topAuthors[0] ? `${topAuthors[0][1]}건 공유` : '기록 없음'}</div>
        </div>
      </div>

      <div class="charts-grid" style="margin-bottom:8px;">
        <div class="sunken-box">
          <div class="box-head"><span>전체 게시판 매체 분포</span><span class="tag-mini">COMMUNITY</span></div>
          <div style="height:140px; position:relative;"><canvas id="comm-chart-cat"></canvas></div>
        </div>
        <div class="sunken-box">
          <div class="box-head"><span>전체 월별 공유 추이 &amp; 멤버 랭킹</span><span class="tag-mini">TREND</span></div>
          <div style="height:140px; position:relative;"><canvas id="comm-chart-month"></canvas></div>
        </div>
      </div>
    </div>

    <!-- SNS 피드 필터 & 검색 바 -->
    <div class="toolbar-box" style="margin-bottom:12px;">
      <div class="pill-group">
        ${['ALL', '도서', '음악', '영상', '기타'].map(c => `
          <button type="button" class="pill-btn ${communityState.catFilter === c ? 'active' : ''}" data-comm-cat="${c}">${c === 'ALL' ? '전체 피드' : c}</button>
        `).join('')}
      </div>

      <div class="filter-controls" style="flex-wrap:wrap;">
        <select id="comm-filter-author" class="win95-select">
          <option value="ALL">모든 작성자 (${authors.length}명)</option>
          ${authors.map(a => `<option value="${esc(a)}" ${communityState.authorFilter === a ? 'selected' : ''}>@${esc(a)}</option>`).join('')}
        </select>
        <select id="comm-filter-rating" class="win95-select">
          <option value="0" ${communityState.minRating === 0 ? 'selected' : ''}>모든 별점</option>
          <option value="5" ${communityState.minRating === 5 ? 'selected' : ''}>★★★★★ (5점)</option>
          <option value="4" ${communityState.minRating === 4 ? 'selected' : ''}>★★★★☆ (4점+)</option>
        </select>
        <select id="comm-sort-by" class="win95-select">
          <option value="latest" ${communityState.sortBy === 'latest' ? 'selected' : ''}>최신 공유순</option>
          <option value="likes" ${communityState.sortBy === 'likes' ? 'selected' : ''}>❤️ 좋아요 인기순</option>
          <option value="rating" ${communityState.sortBy === 'rating' ? 'selected' : ''}>★ 별점 높은순</option>
        </select>
        <input type="text" id="comm-search-kw" value="${esc(communityState.keyword)}" placeholder="작품명·작성자·감상평 검색..." />
      </div>
    </div>

    <!-- SNS 피드 타임라인 리스트 -->
    <div class="sns-feed-stream" style="display:flex; flex-direction:column; gap:14px;">
      ${filtered.length === 0 ? `
        <div class="sunken-box" style="text-align:center; padding:36px; font-weight:800;">
          조건에 일치하는 공유 게시글이 없습니다. 첫 감상을 공유해 보세요!
        </div>
      ` : filtered.map(item => buildSnsFeedCardHtml(item, me)).join('')}
    </div>
  `;

  bindCommunityBoardEvents(body);
  if (communityState.showStats) renderCommunityCharts(sharedAll);
}

function buildSnsFeedCardHtml(item, me) {
  const likeUsers = communityState.likes[item.id] || [];
  const isLiked = likeUsers.includes(me.username);
  const cmtList = communityState.comments[item.id] || [];
  const isCmtOpen = Boolean(communityState.openComments[item.id]);
  const isPublicPost = (item.owner || '') === '공용';
  const stars = '★'.repeat(Number(item.rating) || 5) + '☆'.repeat(5 - (Number(item.rating) || 5));

  return `
    <article class="sns-post-card" data-post-id="${esc(item.id)}">
      <!-- SNS 카드 상단 프로필 바 -->
      <div class="sns-post-header">
        <div style="display:flex; align-items:center; gap:8px;">
          <div class="sns-avatar-box">${isPublicPost ? '🌐' : '👤'}</div>
          <div>
            <div style="font-size:0.86rem; font-weight:900; display:flex; align-items:center; gap:6px;">
              <span>@${esc(item.owner || '문태양')}</span>
              <span class="sns-role-tag ${isPublicPost ? 'pub' : 'priv'}">${isPublicPost ? '공용 워크스테이션' : '개인 아카이브 공유'}</span>
            </div>
            <div style="font-size:0.72rem; color:#555; font-weight:700;">감상일: ${esc(item.watchDate)} · 등록: ${esc(item.createdAt || item.watchDate)}</div>
          </div>
        </div>
        <div style="display:flex; gap:5px; align-items:center;">
          <span class="tag-mini" style="background:var(--brutal-yellow);">${esc(item.category)}</span>
          <span class="tag-mini" style="background:#111; color:#ffd83b;">${stars}</span>
        </div>
      </div>

      <!-- SNS 카드 본문 (표지 + 작품 정보 + 감상평) -->
      <div class="sns-post-body">
        <img class="sns-post-cover" src="${esc(item.coverUrl || FALLBACK_COVER)}" alt="${esc(item.title)}" onerror="this.onerror=null;this.src='${FALLBACK_COVER}';" />
        <div style="flex:1; min-width:0;">
          <h3 style="font-size:1.05rem; font-weight:900; margin-bottom:3px;">${esc(item.title)}</h3>
          <div style="font-size:0.78rem; font-weight:800; color:#000080; margin-bottom:8px;">${esc(item.creator)} · #${esc(item.genre || '일반')}</div>
          <p class="sns-post-review">${esc(item.review)}</p>
          <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;">
            <button type="button" class="btn95 sm btn-sns-inspect" data-id="${esc(item.id)}">🔍 상세 보기</button>
            ${item.sourceUrl ? `<a class="btn95 sky sm" href="${esc(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">🔗 원본 링크</a>` : ''}
            ${(item.owner || '') !== me.username ? `<button type="button" class="btn95 sm btn-sns-scrap" data-id="${esc(item.id)}">📥 내 아카이브로 담기</button>` : ''}
          </div>
        </div>
      </div>

      <!-- SNS 하단 액션 바 (좋아요 / 댓글) -->
      <div class="sns-post-actions">
        <button type="button" class="btn95 sm btn-sns-like ${isLiked ? 'pink' : ''}" data-id="${esc(item.id)}">
          ${isLiked ? '❤️ 좋아요 취소' : '🤍 좋아요'} (${likeUsers.length})
        </button>
        <button type="button" class="btn95 sm btn-sns-cmt-toggle" data-id="${esc(item.id)}">
          💬 댓글 (${cmtList.length})
        </button>
      </div>

      <!-- 댓글 영역 -->
      <div class="sns-cmt-drawer" style="display:${isCmtOpen ? 'block' : 'none'};">
        <div style="display:flex; flex-direction:column; gap:5px; margin-bottom:8px;">
          ${cmtList.length === 0
            ? '<div style="font-size:0.75rem; color:#666;">첫 번째 감상 댓글을 남겨보세요!</div>'
            : cmtList.map(c => `
              <div style="background:#fff; border:1.5px solid #111; padding:5px 8px; font-size:0.78rem;">
                <b>@${esc(c.author)}</b> <span style="color:#666; font-size:0.7rem;">(${esc(c.createdAt)})</span>: ${esc(c.content)}
              </div>
            `).join('')}
        </div>
        <form class="sns-cmt-form" data-id="${esc(item.id)}" style="display:flex; gap:6px;">
          <input type="text" class="sns-cmt-input" placeholder="${esc(me.username)}님으로 한줄 댓글 남기기..." style="flex:1;" required />
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
        labels: months.length ? months : ['데이터 없음'],
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

  // 좋아요 토글
  body.querySelectorAll('.btn-sns-like').forEach(btn => {
    btn.addEventListener('click', async () => {
      const arcId = btn.dataset.id;
      const me = getCurrentUser();
      playRetroTone('click');
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

  // 댓글 서랍 열기/닫기
  body.querySelectorAll('.btn-sns-cmt-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const arcId = btn.dataset.id;
      communityState.openComments[arcId] = !communityState.openComments[arcId];
      renderCommunityBoard();
    });
  });

  // 댓글 작성
  body.querySelectorAll('.sns-cmt-form').forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const arcId = form.dataset.id;
      const inp = form.querySelector('.sns-cmt-input');
      const text = (inp?.value || '').trim();
      if (!text) return;
      const me = getCurrentUser();
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

  // 내 아카이브로 스크랩
  body.querySelectorAll('.btn-sns-scrap').forEach(btn => {
    btn.addEventListener('click', async () => {
      const src = archiveItems.find(x => x.id === btn.dataset.id);
      const me = getCurrentUser();
      if (!src) return;
      btn.disabled = true;
      btn.textContent = '담는 중...';
      try {
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
          showWin95MessageBox('스크랩 완료 — MY-ARCHIVE 95', `「${src.title}」 작품이 ${me.username}님의 개인 아카이브에 복사되었습니다!`, 'open');
        } else {
          showWin95MessageBox('스크랩 안내 — MY-ARCHIVE 95', json.message || '이미 내 아카이브에 존재하는 작품입니다.', 'boom');
        }
      } finally {
        btn.disabled = false;
        btn.textContent = '📥 내 아카이브로 담기';
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('window:opened', ev => {
    if (ev.detail && ev.detail.id === 'win-community') {
      loadCommunityInteractions();
      renderCommunityBoard();
    }
  });
});

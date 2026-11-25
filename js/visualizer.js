// ============================================================
// MY-ARCHIVE 95 OS — Keyword WordCloud, Physics Node Map & Stats
// (1995 Dot-Pixel UI, Stepped Win95 Motion & Force-Directed Graph)
// ============================================================

window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
window.__MOD_VERSIONS.visualizer = typeof APP_BUILD_VERSION !== 'undefined' ? APP_BUILD_VERSION : 'v2026.11.22-04';

let nodeSimAnimId = null;
let selectedCloudKeyword = '';
let visualizerScope = null; // null(초기 자동 감지) | 'MY' (현재 계정 전체) | 'SHARED' (공개 + 공용 계정 전체)

// Win95 레트로 스텝 프레임 설정 (약 12.5fps, 정수 픽셀 스냅)
const WIN95_STEP_MS = 80;
const PIXEL_SNAP = 2;

function snapPx(val, step = PIXEL_SNAP) {
  return Math.round(val / step) * step;
}

// 1995년 16x16 도트 픽셀 SVG 아이콘 (이모지 미사용)
const VISUALIZER_PIXEL_ICONS = {
  chart: `
    <svg class="pixel-svg-14" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true" style="vertical-align:-2px;">
      <path fill="#000000" d="M1 1h2v12h12v2H1V1z"/>
      <path fill="#000080" d="M4 8h2v5H4V8z"/>
      <path fill="#008000" d="M8 5h2v8H8V5z"/>
      <path fill="#ff0000" d="M12 2h2v11h-2V2z"/>
    </svg>`,
  user: `
    <svg class="pixel-svg-14" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true" style="vertical-align:-2px;">
      <path fill="#000000" d="M6 1h4v1h1v4h-1v1H6V6H5V2h1V1zM4 8h8v1h1v5H3V9h1V8z"/>
      <path fill="#ffff00" d="M6 2h4v4H6V2z"/>
      <path fill="#008080" d="M4 9h8v4H4V9z"/>
    </svg>`,
  globe: `
    <svg class="pixel-svg-14" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true" style="vertical-align:-2px;">
      <path fill="#000000" d="M5 1h6v1h2v1h1v2h1v6h-1v2h-1v1h-2v1H5v-1H3v-1H2v-2H1V5h1V3h1V2h2V1z"/>
      <path fill="#0000ff" d="M5 2h6v1h2v2h1v6h-1v2h-2v1H5v-1H3v-2H2V5h1V3h2V2z"/>
      <path fill="#00ff00" d="M6 2h3v2H7v1H5V3h1V2zm4 3h3v3h-2v2H9V7h1V5zM3 7h3v3H5v2H3V7z"/>
      <path fill="#ffffff" d="M4 3h2v1H4V3z"/>
    </svg>`
};

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('window:opened', ev => {
    if (ev.detail && ev.detail.id === 'win-visualizer') {
      renderVisualizerWorkspace();
    }
  });
});

function isPublicArchiveOwner(ownerName) {
  const o = String(ownerName || '').trim();
  return o === '' || o === '공용' || o === '공용 계정' || o.toUpperCase() === 'PUBLIC' || o.toUpperCase() === 'GUEST';
}

// ============================================================
// 0. 시각화 대상 데이터 범위 필터 (내 계정 전체 vs 공개+공용 전체)
// ============================================================
function getVisualizerItemsByScope(requestedScope) {
  const all = Array.isArray(archiveItems) ? archiveItems : [];
  const me = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  const myName = me && me.username ? String(me.username).trim() : '';
  const isGuestMode = !me || me.isGuest || me.role === 'public' || isPublicArchiveOwner(myName);

  const effectiveScope = requestedScope || (isGuestMode ? 'SHARED' : 'MY');

  const myItems = typeof getMyVisibleArchiveItems === 'function'
    ? getMyVisibleArchiveItems()
    : all.filter(it => {
        const owner = String(it.owner || '').trim();
        if (isGuestMode) {
          return isPublicArchiveOwner(owner) || String(it.shared || 'Y').toUpperCase() !== 'N';
        }
        return owner.toLowerCase() === myName.toLowerCase();
      });

  const publicAndGuestItems = all.filter(it => {
    const owner = String(it.owner || '').trim();
    const isShared = String(it.shared || 'Y').toUpperCase() !== 'N';
    return isShared || isPublicArchiveOwner(owner);
  });

  return {
    effectiveScope,
    isGuestMode,
    myItems,
    publicAndGuestItems,
    activeItems: effectiveScope === 'SHARED' ? publicAndGuestItems : myItems
  };
}

// ============================================================
// 1. 시각화 메인 워크스페이스 렌더링
// ============================================================
function renderVisualizerWorkspace() {
  const body = document.getElementById('visualizer-body');
  if (!body) return;

  if (nodeSimAnimId) {
    cancelAnimationFrame(nodeSimAnimId);
    nodeSimAnimId = null;
  }

  const { effectiveScope, myItems, publicAndGuestItems, activeItems } = getVisualizerItemsByScope(visualizerScope);
  visualizerScope = effectiveScope;
  const items = activeItems;

  const scopeToolbarHtml = `
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px;padding:6px 8px;background:var(--win-gray);border:1.5px solid #111;">
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
        <span style="font-size:0.78rem;font-weight:900;">${VISUALIZER_PIXEL_ICONS.chart} 분석 범위:</span>
        <button type="button" class="btn95 sm ${visualizerScope === 'MY' ? 'yellow' : ''}" data-vis-scope="MY">
          ${VISUALIZER_PIXEL_ICONS.user} 내 계정 전체 (${myItems.length}건)
        </button>
        <button type="button" class="btn95 sm ${visualizerScope === 'SHARED' ? 'yellow' : ''}" data-vis-scope="SHARED">
          ${VISUALIZER_PIXEL_ICONS.globe} 공개 + 공용 계정 (${publicAndGuestItems.length}건)
        </button>
      </div>
      <div style="display:flex;gap:6px;">
        <button type="button" class="btn95 sky sm" id="btn-vis-reheat">물리 엔진 재정렬</button>
        <button type="button" class="btn95 sm" id="btn-vis-refresh">중앙 시트 동기화</button>
      </div>
    </div>
  `;

  if (items.length === 0) {
    body.innerHTML = `
      ${scopeToolbarHtml}
      <div class="sunken-box" style="text-align:center;padding:32px;">
        <p style="font-size:1rem;font-weight:900;margin-bottom:8px;">
          ${visualizerScope === 'MY' ? '현재 계정에 시각화할 감상 기록이 없습니다.' : '공개 및 공용 계정의 감상 기록 데이터가 없습니다.'}
        </p>
        <p style="font-size:0.82rem;color:#555;">
          ${visualizerScope === 'MY'
            ? '상단에서 [공개 + 공용 계정] 범위로 전환하거나 [+ 새 감상 기록하기]에서 기록을 등록해 주십시오.'
            : '먼저 [+ 새 감상 기록하기]에서 도서·음악·영상 기록을 등록해 주십시오.'}
        </p>
      </div>
    `;
    bindVisualizerScopeButtons(body);
    return;
  }

  const statsReport = buildArchiveStatsAndBias(items);
  const wordList = extractArchiveKeywords(items);

  body.innerHTML = `
    ${scopeToolbarHtml}

    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
      <div style="font-size:0.8rem;font-weight:900;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <span>노드 구성:</span>
        <span style="display:inline-flex;align-items:center;gap:4px;"><span style="display:inline-block;width:10px;height:10px;background:#48dbfb;border:1.5px solid #111;"></span>매체</span>
        <span>—</span>
        <span style="display:inline-flex;align-items:center;gap:4px;"><span style="display:inline-block;width:10px;height:10px;background:#ff4757;border:1.5px solid #111;"></span>장르</span>
        <span>—</span>
        <span style="display:inline-flex;align-items:center;gap:4px;"><span style="display:inline-block;width:10px;height:10px;background:#2ed573;border:1.5px solid #111;"></span>작품 (클릭 시 상세창 열기)</span>
      </div>
      <span class="tag-mini">${visualizerScope === 'MY' ? '내 아카이브 분석 모드' : '공개·공용 통합 분석 모드'}</span>
    </div>

    <!-- 1. Win95 도트 스타일 물리 노드 맵 -->
    <div class="sunken-box" style="padding:6px;background:#080808;margin-bottom:12px;position:relative;image-rendering:pixelated;">
      <canvas id="node-physics-canvas" width="780" height="340" style="width:100%;height:auto;display:block;cursor:grab;image-rendering:pixelated;"></canvas>
      <div id="node-hover-tip" style="display:none;position:absolute;pointer-events:none;background:#ffd83b;color:#111;border:2px solid #111;padding:2px 7px;font-size:0.72rem;font-weight:900;font-family:var(--font-mono);box-shadow:2px 2px 0 #000;"></div>
    </div>

    <div class="charts-grid" style="margin-bottom:12px;">
      <!-- 2. 한줄평·장르 키워드 워드클라우드 -->
      <div class="sunken-box">
        <div class="box-head">
          <span>한줄평 &amp; 장르 키워드 워드클라우드</span>
          <span class="tag-mini">TOP ${wordList.length}</span>
        </div>
        <div id="wordcloud-stage" style="display:flex;flex-wrap:wrap;align-items:center;gap:6px;min-height:110px;padding:4px;">
          ${wordList.length > 0 ? wordList.map(w => {
            const isSel = selectedCloudKeyword === w.word;
            return `<button type="button" class="wc-tag-btn" data-word="${esc(w.word)}" style="font-size:${w.fontSize}px;font-weight:900;padding:2px 7px;border:1.5px solid #111;background:${isSel ? '#111' : w.bg};color:${isSel ? '#ffd83b' : '#111'};cursor:pointer;">
              #${esc(w.word)} <small>(${w.count})</small>
            </button>`;
          }).join('') : '<span style="font-size:0.8rem;color:#666;">추출할 한줄평 키워드가 부족합니다.</span>'}
        </div>
        <div id="wordcloud-match-box" style="margin-top:8px;font-size:0.76rem;font-weight:700;color:#222;"></div>
      </div>

      <!-- 3. 백분율(%) 통계 집계표 & 취향 편중도 진단 -->
      <div class="sunken-box">
        <div class="box-head">
          <span>매체별 백분율(%) &amp; 취향 편중도 진단</span>
          <span class="tag-mini">최장 연속 ${statsReport.maxStreak}일</span>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:0.78rem;margin-bottom:8px;">
          <thead>
            <tr style="background:#111;color:#fff;">
              <th style="padding:4px 6px;text-align:left;">매체</th>
              <th style="padding:4px 6px;text-align:right;">기록 수</th>
              <th style="padding:4px 6px;text-align:right;">비중(%)</th>
              <th style="padding:4px 6px;text-align:right;">평균 평점</th>
            </tr>
          </thead>
          <tbody>
            ${statsReport.rows.map(r => `
              <tr style="border-bottom:1px solid #ccc;">
                <td style="padding:4px 6px;font-weight:900;">${esc(r.category)}</td>
                <td style="padding:4px 6px;text-align:right;font-family:var(--font-mono);">${r.count}건</td>
                <td style="padding:4px 6px;text-align:right;font-family:var(--font-mono);font-weight:900;color:#000080;">${r.pct}%</td>
                <td style="padding:4px 6px;text-align:right;font-family:var(--font-mono);">${r.avgRating}점</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="background:#fff6bf;border:1.5px solid #111;padding:7px 9px;font-size:0.76rem;line-height:1.45;font-weight:800;">
          ${esc(statsReport.diagnosis)}
        </div>
      </div>
    </div>
  `;

  bindVisualizerScopeButtons(body);

  body.querySelectorAll('.wc-tag-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (typeof playRetroTone === 'function') playRetroTone('click');
      const word = btn.dataset.word;
      selectedCloudKeyword = selectedCloudKeyword === word ? '' : word;
      renderVisualizerWorkspace();
    });
  });

  if (selectedCloudKeyword) {
    const matched = items.filter(it =>
      `${it.title} ${it.genre} ${it.review}`.toLowerCase().includes(selectedCloudKeyword.toLowerCase())
    );
    const matchBox = document.getElementById('wordcloud-match-box');
    if (matchBox) {
      matchBox.innerHTML = `선택 키워드 <b>「#${esc(selectedCloudKeyword)}」</b> 포함 작품 (${matched.length}건): ` +
        matched.slice(0, 5).map(m => `<span style="text-decoration:underline;cursor:pointer;color:#000080;margin-right:6px;" data-open-arc="${esc(m.id)}">${esc(m.title)}</span>`).join('');
      matchBox.querySelectorAll('[data-open-arc]').forEach(el => {
        el.addEventListener('click', () => {
          const target = items.find(x => x.id === el.dataset.openArc);
          if (target && typeof spawnDetailWindow === 'function') spawnDetailWindow(target);
        });
      });
    }
  }

  startPhysicsNodeSimulation(items);
}

function bindVisualizerScopeButtons(container) {
  container.querySelectorAll('[data-vis-scope]').forEach(btn => {
    btn.addEventListener('click', () => {
      const nextScope = btn.dataset.visScope;
      if (nextScope && nextScope !== visualizerScope) {
        visualizerScope = nextScope;
        selectedCloudKeyword = '';
        if (typeof playRetroTone === 'function') playRetroTone('click');
        renderVisualizerWorkspace();
      }
    });
  });

  document.getElementById('btn-vis-refresh')?.addEventListener('click', async () => {
    if (typeof playRetroTone === 'function') playRetroTone('click');
    if (typeof loadArchiveData === 'function') {
      await loadArchiveData(true);
    }
    renderVisualizerWorkspace();
  });
}

// ============================================================
// 2. 키워드 추출기 & 백분율·편중도 진단 로직
// ============================================================
function extractArchiveKeywords(items) {
  const STOPWORDS = new Set([
    '정말', '진짜', '너무', '매우', '완전', '조금', '약간', '가장', '다시', '계속',
    '있는', '없는', '같은', '좋은', '많이', '하는', '했다', '한다', '그리고', '하지만',
    '그래서', '대한', '통해', '위해', '일반', '기타', '작품', '느낌', '생각', '부분'
  ]);
  const TAG_COLORS = ['#ffd83b', '#48dbfb', '#2ed573', '#ff9f43', '#f7f5ee'];

  const freqMap = {};
  items.forEach(item => {
    const rawText = `${item.genre || ''} ${item.review || ''}`;
    const tokens = rawText
      .replace(/[^\w가-힣\s]/g, ' ')
      .split(/\s+/)
      .map(t => t.trim())
      .filter(t => t.length >= 2 && !STOPWORDS.has(t));

    tokens.forEach(tok => {
      freqMap[tok] = (freqMap[tok] || 0) + 1;
    });
  });

  const sorted = Object.entries(freqMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 22);

  if (sorted.length === 0) return [];
  const maxCnt = sorted[0][1];
  const minCnt = sorted[sorted.length - 1][1];

  return sorted.map(([word, count], idx) => {
    const ratio = maxCnt === minCnt ? 0.5 : (count - minCnt) / (maxCnt - minCnt);
    const fontSize = Math.round(12 + ratio * 9);
    return {
      word,
      count,
      fontSize,
      bg: TAG_COLORS[idx % TAG_COLORS.length]
    };
  });
}

function buildArchiveStatsAndBias(items) {
  const categories = ['도서', '음악', '영상', '기타'];
  const total = items.length;

  const rows = categories.map(cat => {
    const sub = items.filter(i => (i.category || '기타') === cat);
    const count = sub.length;
    const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
    const avgRating = count > 0
      ? (sub.reduce((acc, cur) => acc + (Number(cur.rating) || 0), 0) / count).toFixed(1)
      : '-';
    return { category: cat, count, pct, avgRating };
  }).filter(r => r.count > 0);

  const uniqueDates = Array.from(
    new Set(items.map(i => String(i.watchDate || '').slice(0, 10)).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)))
  ).sort();

  let maxStreak = uniqueDates.length > 0 ? 1 : 0;
  let curStreak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1] + 'T00:00:00');
    const curr = new Date(uniqueDates[i] + 'T00:00:00');
    const diffDays = Math.round((curr - prev) / 86400000);
    if (diffDays === 1) {
      curStreak++;
      if (curStreak > maxStreak) maxStreak = curStreak;
    } else {
      curStreak = 1;
    }
  }

  const sortedByCount = [...rows].sort((a, b) => b.count - a.count);
  const top = sortedByCount[0];
  const low = categories.find(c => !rows.some(r => r.category === c)) || sortedByCount[sortedByCount.length - 1]?.category;
  const scopeLabel = visualizerScope === 'MY' ? '내 아카이브' : '공개·공용 아카이브';

  let diagnosis = '';
  if (top && Number(top.pct) >= 55) {
    diagnosis = `[편중도 진단] '${top.category}' 매체가 ${scopeLabel} 전체의 ${top.pct}%를 차지하는 집중형 구성입니다. 균형 확장을 위해 '${low}' 분야 감상을 추가해 보십시오.`;
  } else if (top) {
    diagnosis = `[균형도 진단] '${top.category}'(${top.pct}%)를 중심으로 여러 매체가 고르게 축적되고 있습니다. 최장 연속 감상 기록은 ${maxStreak}일입니다.`;
  }

  return { rows, maxStreak, diagnosis };
}

// ============================================================
// 3. Win95 도트 스타일 스텝형 물리 노드 맵 엔진
// ============================================================
function drawDotStippleLine(ctx, x0, y0, x1, y1, color, step = 4) {
  const sx0 = snapPx(x0, 2);
  const sy0 = snapPx(y0, 2);
  const sx1 = snapPx(x1, 2);
  const sy1 = snapPx(y1, 2);

  const dx = sx1 - sx0;
  const dy = sy1 - sy0;
  const steps = Math.max(1, Math.floor(Math.hypot(dx, dy) / step));

  ctx.fillStyle = color;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const px = snapPx(sx0 + dx * t, 2);
    const py = snapPx(sy0 + dy * t, 2);
    ctx.fillRect(px, py, 2, 2);
  }
}

function drawPixelBlockNode(ctx, cx, cy, halfSize, fillColor, isHover) {
  const h = snapPx(halfSize + (isHover ? 2 : 0), 2);
  const x = snapPx(cx - h, 2);
  const y = snapPx(cy - h, 2);
  const size = h * 2;

  // Win95 스타일 드롭 섀도우 (2px)
  ctx.fillStyle = '#000000';
  ctx.fillRect(x + 2, y + 2, size, size);

  // 외곽 픽셀 테두리
  ctx.fillStyle = '#111111';
  ctx.fillRect(x, y, size, size);

  // 내부 채우기 (2px 베벨 보더)
  ctx.fillStyle = isHover ? '#ffd83b' : fillColor;
  ctx.fillRect(x + 2, y + 2, Math.max(2, size - 4), Math.max(2, size - 4));

  // 좌상단 하이라이트 도트
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + 2, y + 2, Math.max(2, size - 6), 2);
}

function startPhysicsNodeSimulation(items) {
  const canvas = document.getElementById('node-physics-canvas');
  const tipEl = document.getElementById('node-hover-tip');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const W = canvas.width;
  const H = canvas.height;

  const nodes = [];
  const edges = [];
  const nodeMap = {};

  const addNode = (id, label, type, radius, color, itemObj = null) => {
    if (nodeMap[id]) return nodeMap[id];
    const n = {
      id,
      label,
      type,
      radius,
      color,
      itemObj,
      x: snapPx(W / 2 + (Math.random() - 0.5) * 260, 4),
      y: snapPx(H / 2 + (Math.random() - 0.5) * 160, 4),
      vx: 0,
      vy: 0
    };
    nodes.push(n);
    nodeMap[id] = n;
    return n;
  };

  const sampleItems = items.slice(0, 28);
  sampleItems.forEach(item => {
    const cat = item.category || '기타';
    const genre = (item.genre || '일반').trim();
    const catId = `CAT:${cat}`;
    const genreId = `GEN:${cat}:${genre}`;
    const itemId = `ITM:${item.id}`;

    const catNode = addNode(catId, cat, 'category', 16, '#48dbfb');
    const genreNode = addNode(genreId, genre, 'genre', 11, '#ff4757');
    const itemNode = addNode(itemId, item.title, 'item', 8, '#2ed573', item);

    edges.push({ source: catNode, target: genreNode, dist: 76 });
    edges.push({ source: genreNode, target: itemNode, dist: 50 });
  });

  let draggedNode = null;
  let hoveredNode = null;
  let dragMoved = false;
  let lastStepTime = 0;

  const getCanvasPos = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (W / rect.width),
      y: (clientY - rect.top) * (H / rect.height)
    };
  };

  const findNodeAt = (x, y) => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const pad = n.radius + 6;
      if (Math.abs(x - n.x) <= pad && Math.abs(y - n.y) <= pad) return n;
    }
    return null;
  };

  canvas.onmousedown = e => {
    const pos = getCanvasPos(e.clientX, e.clientY);
    const hit = findNodeAt(pos.x, pos.y);
    if (hit) {
      draggedNode = hit;
      dragMoved = false;
      canvas.style.cursor = 'grabbing';
    }
  };

  canvas.onmousemove = e => {
    const pos = getCanvasPos(e.clientX, e.clientY);
    if (draggedNode) {
      dragMoved = true;
      draggedNode.x = snapPx(Math.max(24, Math.min(W - 24, pos.x)), 2);
      draggedNode.y = snapPx(Math.max(24, Math.min(H - 24, pos.y)), 2);
      draggedNode.vx = 0;
      draggedNode.vy = 0;
      return;
    }

    const hit = findNodeAt(pos.x, pos.y);
    hoveredNode = hit;
    canvas.style.cursor = hit ? 'pointer' : 'grab';

    if (tipEl) {
      if (hit) {
        const rect = canvas.getBoundingClientRect();
        tipEl.style.display = 'block';
        tipEl.style.left = `${snapPx(Math.min(rect.width - 180, Math.max(8, e.clientX - rect.left + 12)), 2)}px`;
        tipEl.style.top = `${snapPx(Math.max(8, e.clientY - rect.top - 26), 2)}px`;
        tipEl.textContent = hit.type === 'item'
          ? `[클릭하여 상세 보기] ${hit.label} (${hit.itemObj?.rating || 5}점)`
          : `[${hit.type === 'category' ? '매체' : '장르'}] ${hit.label}`;
      } else {
        tipEl.style.display = 'none';
      }
    }
  };

  canvas.onmouseup = () => {
    if (draggedNode && !dragMoved && draggedNode.type === 'item' && draggedNode.itemObj) {
      if (typeof spawnDetailWindow === 'function') {
        spawnDetailWindow(draggedNode.itemObj);
      }
    }
    draggedNode = null;
    canvas.style.cursor = hoveredNode ? 'pointer' : 'grab';
  };

  canvas.onmouseleave = () => {
    draggedNode = null;
    hoveredNode = null;
    if (tipEl) tipEl.style.display = 'none';
  };

  document.getElementById('btn-vis-reheat')?.addEventListener('click', () => {
    if (typeof playRetroTone === 'function') playRetroTone('click');
    nodes.forEach(n => {
      n.vx += snapPx((Math.random() - 0.5) * 24, 4);
      n.vy += snapPx((Math.random() - 0.5) * 24, 4);
    });
  });

  const renderFrame = () => {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#080808';
    ctx.fillRect(0, 0, W, H);

    // Win95 도트 패턴 그리드 (2px 점선 격자)
    ctx.fillStyle = '#242424';
    for (let gx = 0; gx < W; gx += 20) {
      for (let gy = 0; gy < H; gy += 20) {
        ctx.fillRect(gx, gy, 2, 2);
      }
    }

    // 도트 스티플 연결선 그리기
    edges.forEach(edge => {
      const activeEdge = hoveredNode && (edge.source === hoveredNode || edge.target === hoveredNode);
      drawDotStippleLine(
        ctx,
        edge.source.x,
        edge.source.y,
        edge.target.x,
        edge.target.y,
        activeEdge ? '#ffd83b' : '#7a7a7a',
        4
      );
    });

    // 도트 블록 노드 및 고정폭 라벨 그리기
    nodes.forEach(n => {
      const isHover = hoveredNode === n;
      drawPixelBlockNode(ctx, n.x, n.y, n.radius, n.color, isHover);

      ctx.font = n.type === 'category'
        ? 'bold 11px "DungGeunMo", monospace'
        : '10px "DungGeunMo", monospace';
      ctx.textAlign = 'center';
      const shortLabel = n.label.length > 10 ? n.label.slice(0, 10) + '..' : n.label;
      const lx = snapPx(n.x, 2);
      const ly = snapPx(n.y + n.radius + 14, 2);

      // 가독성을 위한 1px 도트 외곽 그림자
      ctx.fillStyle = '#000000';
      ctx.fillText(shortLabel, lx + 1, ly + 1);
      ctx.fillStyle = isHover ? '#ffd83b' : '#f0f0f0';
      ctx.fillText(shortLabel, lx, ly);
    });
  };

  const tick = (now = 0) => {
    const winEl = document.getElementById('win-visualizer');
    if (!document.body.contains(canvas) || !winEl || !winEl.classList.contains('open') || winEl.classList.contains('minimized')) {
      nodeSimAnimId = null;
      return;
    }

    if (now - lastStepTime >= WIN95_STEP_MS) {
      lastStepTime = now;

      // 1. 노드 간 척력
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let distSq = dx * dx + dy * dy || 1;
          if (distSq < 18000) {
            const force = 620 / distSq;
            const dist = Math.sqrt(distSq);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            if (a !== draggedNode) { a.vx -= fx; a.vy -= fy; }
            if (b !== draggedNode) { b.vx += fx; b.vy += fy; }
          }
        }
      }

      // 2. 엣지 용수철 인력
      edges.forEach(edge => {
        const { source, target, dist } = edge;
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const curDist = Math.sqrt(dx * dx + dy * dy) || 1;
        const diff = (curDist - dist) * 0.085;
        const fx = (dx / curDist) * diff;
        const fy = (dy / curDist) * diff;
        if (source !== draggedNode) { source.vx += fx; source.vy += fy; }
        if (target !== draggedNode) { target.vx -= fx; target.vy -= fy; }
      });

      // 3. 중앙 인력, 감쇠 및 정수 픽셀 스냅 적분
      nodes.forEach(n => {
        if (n === draggedNode) return;
        n.vx += (W / 2 - n.x) * 0.012;
        n.vy += (H / 2 - n.y) * 0.012;
        n.vx *= 0.72;
        n.vy *= 0.72;
        if (Math.abs(n.vx) < 0.35) n.vx = 0;
        if (Math.abs(n.vy) < 0.35) n.vy = 0;

        n.x = snapPx(Math.max(26, Math.min(W - 26, n.x + n.vx)), PIXEL_SNAP);
        n.y = snapPx(Math.max(26, Math.min(H - 26, n.y + n.vy)), PIXEL_SNAP);
      });

      renderFrame();
    }

    nodeSimAnimId = requestAnimationFrame(tick);
  };

  renderFrame();
  nodeSimAnimId = requestAnimationFrame(tick);
}

window.renderVisualizerWorkspace = renderVisualizerWorkspace;

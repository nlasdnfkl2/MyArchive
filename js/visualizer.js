// ============================================================
// MY-ARCHIVE 95 OS — Keyword WordCloud, Physics Node Map & Stats
// ============================================================

window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
window.__MOD_VERSIONS.visualizer = typeof APP_BUILD_VERSION !== 'undefined' ? APP_BUILD_VERSION : 'v2026.11.17-04';

let nodeSimAnimId = null;
let selectedCloudKeyword = '';

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('window:opened', ev => {
    if (ev.detail && ev.detail.id === 'win-visualizer') {
      renderVisualizerWorkspace();
    }
  });
});

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

  const items = Array.isArray(archiveItems) ? archiveItems : [];
  if (items.length === 0) {
    body.innerHTML = `
      <div class="sunken-box" style="text-align:center;padding:32px;">
        <p style="font-size:1rem;font-weight:900;margin-bottom:8px;">시각화할 감상 기록 데이터가 없습니다.</p>
        <p style="font-size:0.82rem;color:#555;">먼저 [+ 새 감상 기록하기]에서 도서·음악·영상 기록을 등록해 주세요.</p>
      </div>
    `;
    return;
  }

  const statsReport = buildArchiveStatsAndBias(items);
  const wordList = extractArchiveKeywords(items);

  body.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
      <div style="font-size:0.82rem;font-weight:900;">
        노드 구성: <span style="color:#000080;">■ 매체</span> — <span style="color:#d63031;">● 장르</span> — <span style="color:#009432;">◆ 작품(클릭 시 상세창 열기)</span>
      </div>
      <div style="display:flex;gap:6px;">
        <button type="button" class="btn95 yellow sm" id="btn-vis-reheat">물리 엔진 재정렬</button>
        <button type="button" class="btn95 sm" id="btn-vis-refresh">데이터 새로고침</button>
      </div>
    </div>

    <!-- 1. Canvas 물리 기반 인터랙티브 데이터 노드 맵 -->
    <div class="sunken-box" style="padding:8px;background:#111111;margin-bottom:12px;position:relative;">
      <canvas id="node-physics-canvas" width="780" height="340" style="width:100%;height:auto;display:block;cursor:grab;"></canvas>
      <div id="node-hover-tip" style="display:none;position:absolute;pointer-events:none;background:#ffd83b;color:#111;border:2px solid #111;padding:3px 8px;font-size:0.74rem;font-weight:900;box-shadow:2px 2px 0 #000;"></div>
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

      <!-- 3. 백분율(%) 통계 집계표 & 취향 편중도 진단 (11주차 중급 반영) -->
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
                <td style="padding:4px 6px;text-align:right;">★ ${r.avgRating}</td>
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

  // 워드클라우드 키워드 클릭 필터 바인딩
  body.querySelectorAll('.wc-tag-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playRetroTone('click');
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

  document.getElementById('btn-vis-refresh')?.addEventListener('click', () => {
    playRetroTone('click');
    renderVisualizerWorkspace();
  });

  startPhysicsNodeSimulation(items);
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

  // 최장 연속 감상 일수(Streak) 계산
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

  // 강점·편중도 진단 메시지 생성
  const sortedByCount = [...rows].sort((a, b) => b.count - a.count);
  const top = sortedByCount[0];
  const low = categories.find(c => !rows.some(r => r.category === c)) || sortedByCount[sortedByCount.length - 1]?.category;

  let diagnosis = '';
  if (top && Number(top.pct) >= 55) {
    diagnosis = `[편중도 진단] '${top.category}' 매체가 전체의 ${top.pct}%를 차지하는 집중형 아카이브입니다. 균형 확장을 위해 '${low}' 분야 감상을 추가해 보세요.`;
  } else if (top) {
    diagnosis = `[균형도 진단] '${top.category}'(${top.pct}%)를 중심으로 여러 매체가 고르게 축적되고 있습니다. 최장 연속 감상 기록은 ${maxStreak}일입니다.`;
  }

  return { rows, maxStreak, diagnosis };
}

// ============================================================
// 3. Canvas 물리 기반 인터랙티브 데이터 노드 맵 엔진
// ============================================================
function startPhysicsNodeSimulation(items) {
  const canvas = document.getElementById('node-physics-canvas');
  const tipEl = document.getElementById('node-hover-tip');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
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
      x: W / 2 + (Math.random() - 0.5) * 260,
      y: H / 2 + (Math.random() - 0.5) * 160,
      vx: 0,
      vy: 0
    };
    nodes.push(n);
    nodeMap[id] = n;
    return n;
  };

  // 최근 최대 28개 작품으로 노드 밀도 최적화
  const sampleItems = items.slice(0, 28);
  sampleItems.forEach(item => {
    const cat = item.category || '기타';
    const genre = (item.genre || '일반').trim();
    const catId = `CAT:${cat}`;
    const genreId = `GEN:${cat}:${genre}`;
    const itemId = `ITM:${item.id}`;

    const catNode = addNode(catId, cat, 'category', 20, '#48dbfb');
    const genreNode = addNode(genreId, genre, 'genre', 13, '#ff4757');
    const itemNode = addNode(itemId, item.title, 'item', 8, '#2ed573', item);

    edges.push({ source: catNode, target: genreNode, dist: 72 });
    edges.push({ source: genreNode, target: itemNode, dist: 48 });
  });

  let draggedNode = null;
  let hoveredNode = null;
  let dragMoved = false;

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
      const dx = x - n.x;
      const dy = y - n.y;
      if (dx * dx + dy * dy <= (n.radius + 5) * (n.radius + 5)) return n;
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
      draggedNode.x = Math.max(24, Math.min(W - 24, pos.x));
      draggedNode.y = Math.max(24, Math.min(H - 24, pos.y));
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
        tipEl.style.left = `${Math.min(rect.width - 180, Math.max(8, e.clientX - rect.left + 12))}px`;
        tipEl.style.top = `${Math.max(8, e.clientY - rect.top - 26)}px`;
        tipEl.textContent = hit.type === 'item'
          ? `[클릭하여 상세 보기] ${hit.label} (★${hit.itemObj?.rating || 5})`
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
    playRetroTone('click');
    nodes.forEach(n => {
      n.vx += (Math.random() - 0.5) * 14;
      n.vy += (Math.random() - 0.5) * 14;
    });
  });

  const tick = () => {
    const winEl = document.getElementById('win-visualizer');
    if (!document.body.contains(canvas) || !winEl || !winEl.classList.contains('open') || winEl.classList.contains('minimized')) {
      nodeSimAnimId = null;
      return;
    }

    // 1. 노드 간 척력 (Repulsion)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let distSq = dx * dx + dy * dy || 1;
        if (distSq < 18000) {
          const force = 520 / distSq;
          const dist = Math.sqrt(distSq);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          if (a !== draggedNode) { a.vx -= fx; a.vy -= fy; }
          if (b !== draggedNode) { b.vx += fx; b.vy += fy; }
        }
      }
    }

    // 2. 엣지 용수철 인력 (Spring Attraction)
    edges.forEach(edge => {
      const { source, target, dist } = edge;
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const curDist = Math.sqrt(dx * dx + dy * dy) || 1;
      const diff = (curDist - dist) * 0.035;
      const fx = (dx / curDist) * diff;
      const fy = (dy / curDist) * diff;
      if (source !== draggedNode) { source.vx += fx; source.vy += fy; }
      if (target !== draggedNode) { target.vx -= fx; target.vy -= fy; }
    });

    // 3. 중앙 인력 및 감쇠 적분
    nodes.forEach(n => {
      if (n === draggedNode) return;
      n.vx += (W / 2 - n.x) * 0.0045;
      n.vy += (H / 2 - n.y) * 0.0045;
      n.vx *= 0.84;
      n.vy *= 0.84;
      n.x = Math.max(26, Math.min(W - 26, n.x + n.vx));
      n.y = Math.max(26, Math.min(H - 26, n.y + n.vy));
    });

    // 4. Canvas 렌더링
    ctx.clearRect(0, 0, W, H);

    // 배경 그리드 라인
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < W; gx += 40) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (let gy = 0; gy < H; gy += 40) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }

    // 연결선(Edge) 그리기
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    edges.forEach(edge => {
      ctx.beginPath();
      ctx.moveTo(edge.source.x, edge.source.y);
      ctx.lineTo(edge.target.x, edge.target.y);
      ctx.stroke();
    });

    // 노드(Node) 및 라벨 그리기
    nodes.forEach(n => {
      const isHover = hoveredNode === n;
      ctx.beginPath();
      ctx.arc(n.x, n.y, isHover ? n.radius + 3 : n.radius, 0, Math.PI * 2);
      ctx.fillStyle = isHover ? '#ffd83b' : n.color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#111111';
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = n.type === 'category' ? 'bold 12px sans-serif' : '11px sans-serif';
      ctx.textAlign = 'center';
      const shortLabel = n.label.length > 10 ? n.label.slice(0, 10) + '..' : n.label;
      ctx.fillText(shortLabel, n.x, n.y + n.radius + 13);
    });

    nodeSimAnimId = requestAnimationFrame(tick);
  };

  nodeSimAnimId = requestAnimationFrame(tick);
}

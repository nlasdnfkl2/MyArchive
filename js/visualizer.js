let nodeAnimId = null;

function openVisualizerWindow() {
  openWindow('win-visualizer');
  buildVisualizerData();
}

document.getElementById('icon-visualizer').addEventListener('click', openVisualizerWindow);
document.getElementById('mnu-open-visualizer').addEventListener('click', openVisualizerWindow);
document.getElementById('btn-open-vis-hero').addEventListener('click', openVisualizerWindow);
document.getElementById('btn-widget-vis').addEventListener('click', openVisualizerWindow);
document.getElementById('sm-visualizer').addEventListener('click', openVisualizerWindow);
document.getElementById('btn-rebuild-vis').addEventListener('click', () => { playRetroTone('open'); buildVisualizerData(); });
document.getElementById('vis-cat-scope').addEventListener('change', buildVisualizerData);

document.getElementById('vis-tab-node').addEventListener('click', () => {
  document.getElementById('vis-panel-node').style.display = 'block';
  document.getElementById('vis-panel-wc').style.display = 'none';
  document.getElementById('vis-tab-node').classList.add('yellow');
  document.getElementById('vis-tab-wc').classList.remove('yellow');
  buildVisualizerData();
});

document.getElementById('vis-tab-wc').addEventListener('click', () => {
  document.getElementById('vis-panel-node').style.display = 'none';
  document.getElementById('vis-panel-wc').style.display = 'block';
  document.getElementById('vis-tab-wc').classList.add('yellow');
  document.getElementById('vis-tab-node').classList.remove('yellow');
  buildVisualizerData();
});

function buildVisualizerData() {
  const scope = document.getElementById('vis-cat-scope').value;
  const scopedItems = scope === 'ALL' ? archiveItems : archiveItems.filter(i => i.category === scope);
  renderWordCloud(scopedItems);
  renderDataNodeGraph(scopedItems);
}

function renderWordCloud(items) {
  const stage = document.getElementById('wordcloud-stage');
  stage.innerHTML = '';
  if (!items.length) {
    stage.innerHTML = `<div style="font-weight:800; color:#4a4a4a;">분석할 아카이브 데이터가 없습니다.</div>`;
    return;
  }

  const stopWords = new Set(['있는', '하는', '그리고', '정말', '너무', '매우', '대한', '통해', '위해', '같은', '것이다', '수준', '일반']);
  const freq = {};
  items.forEach(item => {
    const rawText = `${item.genre} ${item.creator} ${item.review}`;
    rawText.replace(/[^\w가-힣\s]/g, ' ').split(/\s+/).map(w => w.trim()).forEach(tok => {
      if (tok.length >= 2 && !stopWords.has(tok)) freq[tok] = (freq[tok] || 0) + 1;
    });
  });

  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 28);
  if (!sorted.length) {
    stage.innerHTML = `<div style="font-weight:800; color:#4a4a4a;">추출 가능한 키워드가 부족합니다.</div>`;
    return;
  }

  const maxCnt = sorted[0][1];
  const palette = ['#ffd83b', '#48dbfb', '#2ed573', '#ffffff', '#ff9ff3'];
  const shuffled = [...sorted].sort(() => Math.random() - 0.5);

  shuffled.forEach(([word, count], idx) => {
    const ratio = count / maxCnt;
    const span = document.createElement('span');
    span.className = 'wc-word';
    span.style.fontSize = `${(0.82 + ratio * 1.15).toFixed(2)}rem`;
    span.style.background = palette[idx % palette.length];
    span.textContent = `${word} (${count})`;
    span.title = `클릭 시 '${word}' 키워드로 아카이브 필터링`;
    span.addEventListener('click', () => {
      document.getElementById('filter-keyword').value = word;
      renderArchiveGrid();
      openWindow('win-main');
    });
    stage.appendChild(span);
  });
}

function renderDataNodeGraph(items) {
  if (nodeAnimId) cancelAnimationFrame(nodeAnimId);
  const canvas = document.getElementById('node-graph-canvas');
  const ctx = canvas.getContext('2d');
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width || 760;
  canvas.height = rect.height || 360;

  if (!items.length) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 14px Pretendard, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('표시할 아카이브 노드가 없습니다.', canvas.width / 2, canvas.height / 2);
    return;
  }

  const nodes = [], links = [], nodeMap = {};
  function getOrCreateNode(id, label, type, color, radius, itemRef = null) {
    if (!nodeMap[id]) {
      const n = {
        id, label, type, color, radius, itemRef,
        x: canvas.width / 2 + (Math.random() - 0.5) * 260,
        y: canvas.height / 2 + (Math.random() - 0.5) * 200,
        vx: 0, vy: 0
      };
      nodeMap[id] = n;
      nodes.push(n);
    }
    return nodeMap[id];
  }

  const rootNode = getOrCreateNode('ROOT', 'MY ARCHIVE', 'root', '#ffffff', 22);
  items.slice(0, 24).forEach(item => {
    const catColor = item.category === '음악' ? '#48dbfb' : item.category === '영상' ? '#ff4757' : item.category === '기타' ? '#2ed573' : '#ffd83b';
    const catNode = getOrCreateNode(`CAT_${item.category}`, item.category, 'cat', catColor, 17);
    links.push({ source: rootNode, target: catNode });

    const genreName = (item.genre || '일반').trim();
    const genreNode = getOrCreateNode(`GEN_${item.category}_${genreName}`, `#${genreName}`, 'genre', '#c0c0c0', 13);
    links.push({ source: catNode, target: genreNode });

    const workNode = getOrCreateNode(`WORK_${item.id}`, item.title, 'work', catColor, 10, item);
    links.push({ source: genreNode, target: workNode });
  });

  let draggedNode = null, dragMoved = false;
  canvas.onmousedown = e => {
    const r = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    dragMoved = false;
    draggedNode = nodes.find(n => Math.hypot(n.x - mx, n.y - my) <= n.radius + 5) || null;
  };
  canvas.onmousemove = e => {
    if (!draggedNode) return;
    const r = canvas.getBoundingClientRect();
    dragMoved = true;
    draggedNode.x = Math.max(24, Math.min(canvas.width - 24, e.clientX - r.left));
    draggedNode.y = Math.max(24, Math.min(canvas.height - 24, e.clientY - r.top));
    draggedNode.vx = 0;
    draggedNode.vy = 0;
  };
  canvas.onmouseup = () => {
    if (draggedNode && !dragMoved && draggedNode.itemRef) spawnDetailWindow(draggedNode.itemRef);
    draggedNode = null;
  };

  function tick() {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy) || 1;
        if (dist < 110) {
          const f = (110 - dist) * 0.025, fx = (dx / dist) * f, fy = (dy / dist) * f;
          if (a !== draggedNode) { a.vx -= fx; a.vy -= fy; }
          if (b !== draggedNode) { b.vx += fx; b.vy += fy; }
        }
      }
    }
    links.forEach(l => {
      const dx = l.target.x - l.source.x, dy = l.target.y - l.source.y, dist = Math.hypot(dx, dy) || 1;
      const targetLen = l.source.type === 'root' ? 85 : 65;
      const f = (dist - targetLen) * 0.015, fx = (dx / dist) * f, fy = (dy / dist) * f;
      if (l.source !== draggedNode) { l.source.vx += fx; l.source.vy += fy; }
      if (l.target !== draggedNode) { l.target.vx -= fx; l.target.vy -= fy; }
    });
    nodes.forEach(n => {
      if (n === draggedNode) return;
      n.vx += (canvas.width / 2 - n.x) * 0.002;
      n.vy += (canvas.height / 2 - n.y) * 0.002;
      n.vx *= 0.85; n.vy *= 0.85;
      n.x = Math.max(30, Math.min(canvas.width - 30, n.x + n.vx));
      n.y = Math.max(26, Math.min(canvas.height - 26, n.y + n.vy));
    });

    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 28) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
    for (let y = 0; y < canvas.height; y += 28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }

    ctx.strokeStyle = '#808080';
    ctx.lineWidth = 1.5;
    links.forEach(l => { ctx.beginPath(); ctx.moveTo(l.source.x, l.source.y); ctx.lineTo(l.target.x, l.target.y); ctx.stroke(); });

    nodes.forEach(n => {
      ctx.beginPath(); ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
      ctx.fillStyle = n.color; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#ffffff'; ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = n.type === 'work' ? '700 11px Pretendard, sans-serif' : '900 12px Pretendard, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(n.label.length > 14 ? n.label.slice(0, 13) + '…' : n.label, n.x, n.y + n.radius + 14);
    });
    nodeAnimId = requestAnimationFrame(tick);
  }
  tick();
}

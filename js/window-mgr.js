function focusWindow(winEl) {
  if (!winEl) return;
  document.querySelectorAll('.win95-window, .floating-win').forEach(w => w.classList.remove('focused'));
  winEl.classList.add('focused');
  topZIndex += 1;
  winEl.style.zIndex = topZIndex;
  syncTaskbar();
}

function openWindow(winId) {
  const winEl = document.getElementById(winId);
  if (!winEl) return;
  winEl.style.display = winEl.classList.contains('floating-win') ? 'flex' : 'block';
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
  if (clickedWin) focusWindow(clickedWin);
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

    if (useGhostDrag) {
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
    if (useGhostDrag) {
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
    if (useGhostDrag) {
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

document.getElementById('mnu-toggle-dragmode').addEventListener('click', e => {
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
document.getElementById('mnu-cycle-wallpaper').addEventListener('click', cycleWallpaper);
document.getElementById('btn-widget-wp').addEventListener('click', cycleWallpaper);

function toggleCRT() {
  document.body.classList.toggle('crt-on');
  playRetroTone('click');
}
document.getElementById('mnu-toggle-crt').addEventListener('click', toggleCRT);
document.getElementById('btn-widget-crt').addEventListener('click', toggleCRT);

// Clocks
function updateClocks() {
  const now = new Date();
  const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
  document.getElementById('tray-clock').textContent = `${h >= 12 ? '오후' : '오전'} ${h % 12 || 12}:${String(m).padStart(2, '0')}`;
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  document.getElementById('digital-date-lbl').textContent = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} (${days[now.getDay()]})`;
  document.getElementById('clk-hour').style.transform = `rotate(${(h % 12) * 30 + m * 0.5}deg)`;
  document.getElementById('clk-min').style.transform = `rotate(${m * 6}deg)`;
  document.getElementById('clk-sec').style.transform = `rotate(${s * 6}deg)`;
}
setInterval(updateClocks, 1000);
updateClocks();

// Winamp Jukebox
let jbIndex = 0, eqTimer = null;
function updateJukebox() {
  const musicTracks = archiveItems.filter(i => i.category === '음악');
  const trackEl = document.getElementById('jukebox-track');
  const artistEl = document.getElementById('jukebox-artist');
  const ytBtn = document.getElementById('jb-yt');
  if (!musicTracks.length) {
    trackEl.textContent = '01. MY-ARCHIVE 95 THEME';
    artistEl.textContent = '음악 기록 추가 시 자동 연동';
    ytBtn.href = 'https://www.youtube.com/results?search_query=synthwave+windows+95';
    return;
  }
  jbIndex = (jbIndex + musicTracks.length) % musicTracks.length;
  const cur = musicTracks[jbIndex];
  trackEl.textContent = `${String(jbIndex + 1).padStart(2, '0')}. ${cur.title}`;
  artistEl.textContent = `${cur.creator} (${cur.genre || '음악'})`;
  ytBtn.href = cur.sourceUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${cur.creator} ${cur.title}`)}`;
}

function setEqualizer(active) {
  if (eqTimer) clearInterval(eqTimer);
  const bars = document.querySelectorAll('#eq-bars .eq-bar');
  if (!active) { bars.forEach(b => { b.style.height = '18%'; }); return; }
  eqTimer = setInterval(() => { bars.forEach(b => { b.style.height = `${15 + Math.floor(Math.random() * 85)}%`; }); }, 150);
}
document.getElementById('jb-play').addEventListener('click', () => { playRetroTone('open'); setEqualizer(true); });
document.getElementById('jb-stop').addEventListener('click', () => { playRetroTone('click'); setEqualizer(false); });
document.getElementById('jb-prev').addEventListener('click', () => { jbIndex--; updateJukebox(); playRetroTone('click'); });
document.getElementById('jb-next').addEventListener('click', () => { jbIndex++; updateJukebox(); playRetroTone('click'); });

// Minesweeper
const MINE_SIZE = 8, MINE_TOTAL = 10;
let mineBoard = [], mineGameOver = false;
function initMinesweeper() {
  mineGameOver = false;
  document.getElementById('btn-mine-reset').textContent = '🙂 다시 시작';
  mineBoard = Array.from({ length: MINE_SIZE * MINE_SIZE }, (_, idx) => ({ idx, mine: false, revealed: false, flagged: false, count: 0 }));
  let placed = 0;
  while (placed < MINE_TOTAL) {
    const r = Math.floor(Math.random() * mineBoard.length);
    if (!mineBoard[r].mine) { mineBoard[r].mine = true; placed++; }
  }
  mineBoard.forEach(cell => {
    if (!cell.mine) cell.count = getMineNeighbors(cell.idx).filter(n => mineBoard[n].mine).length;
  });
  renderMinesweeper();
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

function revealMineCell(idx) {
  const cell = mineBoard[idx];
  if (mineGameOver || cell.revealed || cell.flagged) return;
  cell.revealed = true;
  if (cell.mine) {
    mineGameOver = true;
    playRetroTone('boom');
    document.getElementById('btn-mine-reset').textContent = '😵 게임 오버';
    mineBoard.forEach(c => { if (c.mine) c.revealed = true; });
    renderMinesweeper();
    return;
  }
  playRetroTone('click');
  if (cell.count === 0) getMineNeighbors(idx).forEach(n => revealMineCell(n));
  if (mineBoard.filter(c => !c.mine && !c.revealed).length === 0) {
    mineGameOver = true;
    playRetroTone('boot');
    document.getElementById('btn-mine-reset').textContent = '😎 클리어!';
  }
  renderMinesweeper();
}

function renderMinesweeper() {
  const grid = document.getElementById('mine-grid');
  grid.innerHTML = '';
  const flagged = mineBoard.filter(c => c.flagged).length;
  document.getElementById('mine-left-lbl').textContent = String(Math.max(0, MINE_TOTAL - flagged)).padStart(3, '0');
  mineBoard.forEach(cell => {
    const div = document.createElement('div');
    div.className = 'mine-cell' + (cell.revealed ? ' revealed' : '') + (cell.revealed && cell.mine ? ' boom' : '');
    if (cell.revealed) {
      div.textContent = cell.mine ? '💣' : (cell.count > 0 ? cell.count : '');
      if (cell.count === 1) div.style.color = '#000080';
      if (cell.count === 2) div.style.color = '#008000';
      if (cell.count >= 3) div.style.color = '#ff4757';
    } else if (cell.flagged) div.textContent = '🚩';
    div.addEventListener('click', () => revealMineCell(cell.idx));
    div.addEventListener('contextmenu', e => {
      e.preventDefault();
      if (mineGameOver || cell.revealed) return;
      cell.flagged = !cell.flagged;
      playRetroTone('click');
      renderMinesweeper();
    });
    grid.appendChild(div);
  });
}

document.getElementById('btn-mine-reset').addEventListener('click', initMinesweeper);
document.getElementById('icon-mine').addEventListener('click', () => { initMinesweeper(); openWindow('win-mine'); });
document.getElementById('sm-mine').addEventListener('click', () => { initMinesweeper(); openWindow('win-mine'); });

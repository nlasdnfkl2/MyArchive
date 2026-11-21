// ============================================================
// MY-ARCHIVE 95 OS — Retro Mini-Game Pack (GAMEPACK95.EXE)
// (Solitaire 95, Classic Bevel Minesweeper, Memory Flip & Hi-Lo)
// ============================================================

window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
window.__MOD_VERSIONS.gamepack = typeof APP_BUILD_VERSION !== 'undefined' ? APP_BUILD_VERSION : 'v2026.11.22-03';

let activeGameTab = 'solitaire';

// 1995년 16x16 도트 픽셀 SVG 아이콘 (이모지 미사용)
const GAMEPACK_PIXEL_ICONS = {
  mine: `
    <svg class="pixel-svg-14" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true" style="vertical-align:-2px;">
      <path fill="#000000" d="M7 1h2v2h2v1h1v2h2v2h-2v2h-1v1H9v2H7v-2H5v-1H4V8H2V6h2V4h1V3h2V1z"/>
      <path fill="#000000" d="M3 2h2v2H3V2zm8 0h2v2h-2V2zM3 10h2v2H3v-2zm8 0h2v2h-2v-2z"/>
      <path fill="#ffffff" d="M6 5h2v2H6V5z"/>
    </svg>`,
  flag: `
    <svg class="pixel-svg-14" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true" style="vertical-align:-2px;">
      <path fill="#ff0000" d="M4 2h5v1h2v2H9v1H4V2z"/>
      <path fill="#000000" d="M8 6h1v6H8V6zM5 12h7v1H5v-1zM4 13h9v2H4v-2z"/>
    </svg>`,
  star: `
    <svg class="pixel-svg-14" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true" style="vertical-align:-2px;">
      <path fill="#000000" d="M7 1h2v3h5v2h-2v2h1v5h-2v-1H9v-1H7v1H5v1H3V8h1V6H2V4h5V1z"/>
      <path fill="#ffd83b" d="M7 2h2v3h4v1h-2v2h1v4h-2v-1H9v-1H7v1H6v1H4V8h1V6H3V5h4V2z"/>
    </svg>`,
  trophy: `
    <svg class="pixel-svg-14" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true" style="vertical-align:-2px;">
      <path fill="#000000" d="M4 1h8v2h2v4h-2v1h-2v2H9v2h3v2H4v-2h3v-2H6V8H4V7H2V3h2V1z"/>
      <path fill="#ffd83b" d="M5 2h6v5H9v2H7V7H5V2zM3 4h1v2H3V4zm9 0h1v2h-1V4zM5 12h6v1H5v-1z"/>
    </svg>`
};

function safePlayGameTone(type) {
  if (typeof playRetroTone === 'function') {
    playRetroTone(type);
  }
}

function getGameArchivePool() {
  if (typeof getMyVisibleArchiveItems === 'function') {
    return getMyVisibleArchiveItems();
  }
  return Array.isArray(archiveItems) ? archiveItems : [];
}

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('window:opened', ev => {
    if (ev.detail && ev.detail.id === 'win-gamepack') {
      renderGamePackShell();
    }
  });
});

function renderGamePackShell() {
  const body = document.getElementById('gamepack-body');
  if (!body) return;

  body.innerHTML = `
    <div class="pill-group" style="margin-bottom:12px;">
      <button type="button" class="pill-btn ${activeGameTab === 'solitaire' ? 'active' : ''}" data-gtab="solitaire">카드 솔리테어 95</button>
      <button type="button" class="pill-btn ${activeGameTab === 'mine' ? 'active' : ''}" data-gtab="mine">지뢰찾기 95 (8x8)</button>
      <button type="button" class="pill-btn ${activeGameTab === 'flip' ? 'active' : ''}" data-gtab="flip">아카이브 카드 짝맞추기</button>
      <button type="button" class="pill-btn ${activeGameTab === 'hilo' ? 'active' : ''}" data-gtab="hilo">작품 별점 하이로우</button>
    </div>
    <div id="gamepack-stage" class="sunken-box"></div>
  `;

  body.querySelectorAll('[data-gtab]').forEach(btn => {
    btn.addEventListener('click', () => {
      safePlayGameTone('click');
      activeGameTab = btn.dataset.gtab;
      renderGamePackShell();
    });
  });

  if (activeGameTab === 'solitaire') renderSolitaireGame();
  else if (activeGameTab === 'mine') renderMinesweeperGame();
  else if (activeGameTab === 'flip') renderMemoryFlipGame();
  else renderStarHiLoGame();
}

// ============================================================
// 1. 클론다이크 솔리테어 95 (PC 클릭 및 모바일 터치 최적화)
// ============================================================
function renderSolitaireGame() {
  const stage = document.getElementById('gamepack-stage');
  if (!stage) return;

  const SUITS = [
    { key: 'S', symbol: '♠', color: '#111111', isRed: false },
    { key: 'H', symbol: '♥', color: '#d63031', isRed: true },
    { key: 'D', symbol: '♦', color: '#d63031', isRed: true },
    { key: 'C', symbol: '♣', color: '#111111', isRed: false }
  ];
  const RANK_LABELS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  const fullDeck = [];
  SUITS.forEach(s => {
    for (let r = 1; r <= 13; r++) {
      fullDeck.push({
        suit: s.key,
        symbol: s.symbol,
        color: s.color,
        isRed: s.isRed,
        rank: r,
        label: `${s.symbol}${RANK_LABELS[r]}`,
        faceUp: false
      });
    }
  });

  for (let i = fullDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [fullDeck[i], fullDeck[j]] = [fullDeck[j], fullDeck[i]];
  }

  const tableau = Array.from({ length: 7 }, () => []);
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = fullDeck.pop();
      if (row === col) card.faceUp = true;
      tableau[col].push(card);
    }
  }

  let stock = fullDeck;
  let waste = [];
  const foundations = { S: [], H: [], D: [], C: [] };
  let selected = null; // { zone: 'waste' | 'tableau', col?: number, idx?: number }
  let moves = 0;

  const revealTopTableau = () => {
    tableau.forEach(pile => {
      if (pile.length > 0 && !pile[pile.length - 1].faceUp) {
        pile[pile.length - 1].faceUp = true;
      }
    });
  };

  const canMoveToFoundation = (card) => {
    if (!card) return false;
    const fPile = foundations[card.suit];
    return fPile.length === 0 ? card.rank === 1 : fPile[fPile.length - 1].rank === card.rank - 1;
  };

  const canMoveToTableau = (card, targetCol) => {
    const destPile = tableau[targetCol];
    if (destPile.length === 0) return card.rank === 13; // 빈 칸에는 K만 이동 가능
    const topCard = destPile[destPile.length - 1];
    return topCard.faceUp && topCard.isRed !== card.isRed && topCard.rank === card.rank + 1;
  };

  const tryAutoFoundation = (zone, col, idx) => {
    if (zone === 'waste' && waste.length > 0) {
      const top = waste[waste.length - 1];
      if (canMoveToFoundation(top)) {
        foundations[top.suit].push(waste.pop());
        moves++;
        selected = null;
        safePlayGameTone('open');
        return true;
      }
    } else if (zone === 'tableau') {
      const pile = tableau[col];
      if (idx === pile.length - 1) {
        const top = pile[pile.length - 1];
        if (canMoveToFoundation(top)) {
          foundations[top.suit].push(pile.pop());
          revealTopTableau();
          moves++;
          selected = null;
          safePlayGameTone('open');
          return true;
        }
      }
    }
    return false;
  };

  const checkSolitaireWin = () => {
    const totalDone = Object.values(foundations).reduce((s, p) => s + p.length, 0);
    if (totalDone === 52) {
      safePlayGameTone('fanfare');
      return true;
    }
    return false;
  };

  const draw = () => {
    const isWon = checkSolitaireWin();

    stage.innerHTML = `
      <div class="box-head">
        <span>클론다이크 솔리테어 95 ${isWon ? `— ${GAMEPACK_PIXEL_ICONS.trophy} [CLEAR] 완승 축하합니다!` : `(이동: ${moves}회)`}</span>
        <div style="display:flex;gap:6px;">
          <button type="button" class="btn95 sky sm" id="btn-sol-auto">[AUTO] 자동 올리기</button>
          <button type="button" class="btn95 yellow sm" id="btn-sol-new">새 카드 배분</button>
        </div>
      </div>

      <div style="background:#006432;border:2px solid #111;padding:10px;color:#fff;">
        <!-- 상단 줄: 덱(Stock) + 버린카드(Waste) + 완성집(Foundations 4곳) -->
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:14px;">
          <button type="button" id="sol-stock" style="height:56px;border:2px solid #111;background:${stock.length ? '#000080' : 'rgba(255,255,255,0.15)'};color:#ffd83b;font-weight:900;font-size:0.75rem;cursor:pointer;">
            ${stock.length ? `DECK<br/>(${stock.length})` : '[RELOAD]'}
          </button>

          <div id="sol-waste" style="height:56px;border:2px solid ${selected && selected.zone === 'waste' ? '#ffd83b' : '#111'};background:${waste.length ? '#ffffff' : 'rgba(255,255,255,0.1)'};color:${waste.length ? waste[waste.length - 1].color : '#ccc'};display:flex;align-items:center;justify-content:center;font-weight:900;font-size:0.95rem;cursor:pointer;box-shadow:${selected && selected.zone === 'waste' ? '0 0 0 2px #ffd83b' : 'none'};">
            ${waste.length ? esc(waste[waste.length - 1].label) : 'WASTE'}
          </div>

          <div></div>

          ${SUITS.map(s => {
            const pile = foundations[s.key];
            const top = pile[pile.length - 1];
            return `<button type="button" class="sol-found" data-suit="${s.key}" style="height:56px;border:2px solid #111;background:${top ? '#ffffff' : 'rgba(255,255,255,0.15)'};color:${top ? top.color : '#ffd83b'};font-weight:900;font-size:0.9rem;cursor:pointer;">
              ${top ? esc(top.label) : `${s.symbol} A`}
            </button>`;
          }).join('')}
        </div>

        <!-- 하단 7열 작업대(Tableau) -->
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;align-items:start;min-height:230px;">
          ${tableau.map((pile, colIdx) => `
            <div class="sol-col" data-col="${colIdx}" style="min-height:190px;border:1.5px dashed rgba(255,255,255,0.35);padding:3px;display:flex;flex-direction:column;gap:3px;">
              ${pile.length === 0 ? `<div style="height:44px;display:flex;align-items:center;justify-content:center;font-size:0.7rem;color:rgba(255,255,255,0.5);">[K]</div>` : ''}
              ${pile.map((card, cIdx) => {
                const isSel = selected && selected.zone === 'tableau' && selected.col === colIdx && cIdx >= selected.idx;
                if (!card.faceUp) {
                  return `<div style="height:20px;background:#000080;border:1.5px solid #111;"></div>`;
                }
                return `<button type="button" class="sol-card" data-col="${colIdx}" data-cidx="${cIdx}" style="height:34px;border:2px solid ${isSel ? '#ffd83b' : '#111'};background:${isSel ? '#fff6bf' : '#ffffff'};color:${card.color};font-weight:900;font-size:0.84rem;text-align:left;padding:0 5px;cursor:pointer;">
                  ${esc(card.label)}
                </button>`;
              }).join('')}
            </div>
          `).join('')}
        </div>
      </div>
      <div style="margin-top:6px;font-size:0.74rem;font-weight:800;color:#444;">
        조작법: 카드를 한 번 클릭하여 선택한 뒤 이동할 열 또는 상단 완성집을 클릭하십시오. (선택된 맨 위 카드를 다시 클릭하면 완성집으로 자동 이동)
      </div>
    `;

    document.getElementById('btn-sol-new')?.addEventListener('click', () => {
      safePlayGameTone('click');
      renderSolitaireGame();
    });

    // 가능한 카드 한 번에 완성집으로 자동 올리기
    document.getElementById('btn-sol-auto')?.addEventListener('click', () => {
      let movedAny = false;
      let progress = true;
      while (progress) {
        progress = false;
        if (waste.length > 0 && canMoveToFoundation(waste[waste.length - 1])) {
          const c = waste.pop();
          foundations[c.suit].push(c);
          moves++;
          movedAny = true;
          progress = true;
        }
        for (let col = 0; col < 7; col++) {
          const pile = tableau[col];
          if (pile.length > 0 && canMoveToFoundation(pile[pile.length - 1])) {
            const c = pile.pop();
            foundations[c.suit].push(c);
            revealTopTableau();
            moves++;
            movedAny = true;
            progress = true;
          }
        }
      }
      if (movedAny) {
        selected = null;
        safePlayGameTone('open');
        draw();
      } else {
        safePlayGameTone('click');
      }
    });

    // 덱(Stock) 클릭
    document.getElementById('sol-stock')?.addEventListener('click', () => {
      selected = null;
      if (stock.length > 0) {
        const drawn = stock.pop();
        drawn.faceUp = true;
        waste.push(drawn);
      } else if (waste.length > 0) {
        stock = waste.reverse().map(c => ({ ...c, faceUp: false }));
        waste = [];
      }
      moves++;
      safePlayGameTone('click');
      draw();
    });

    // Waste 카드 클릭
    document.getElementById('sol-waste')?.addEventListener('click', () => {
      if (!waste.length) return;
      if (selected && selected.zone === 'waste') {
        if (!tryAutoFoundation('waste')) selected = null;
        draw();
        return;
      }
      selected = { zone: 'waste' };
      safePlayGameTone('click');
      draw();
    });

    // 완성집(Foundation) 클릭
    stage.querySelectorAll('.sol-found').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!selected) return;
        const targetSuit = btn.dataset.suit;
        let movingCard = null;
        if (selected.zone === 'waste' && waste.length > 0) {
          movingCard = waste[waste.length - 1];
        } else if (selected.zone === 'tableau') {
          const pile = tableau[selected.col];
          if (selected.idx === pile.length - 1) movingCard = pile[pile.length - 1];
        }

        if (movingCard && movingCard.suit === targetSuit && canMoveToFoundation(movingCard)) {
          if (selected.zone === 'waste') waste.pop();
          else {
            tableau[selected.col].pop();
            revealTopTableau();
          }
          foundations[targetSuit].push(movingCard);
          moves++;
          selected = null;
          safePlayGameTone('open');
          draw();
        }
      });
    });

    // 작업대(Tableau) 카드 클릭
    stage.querySelectorAll('.sol-card').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const col = Number(btn.dataset.col);
        const cIdx = Number(btn.dataset.cidx);

        // 이미 선택된 상태일 때 이동 시도
        if (selected) {
          if (selected.zone === 'tableau' && selected.col === col && selected.idx === cIdx) {
            if (!tryAutoFoundation('tableau', col, cIdx)) selected = null;
            draw();
            return;
          }

          let movingCard = null;
          if (selected.zone === 'waste') movingCard = waste[waste.length - 1];
          else if (selected.zone === 'tableau') movingCard = tableau[selected.col][selected.idx];

          if (movingCard && canMoveToTableau(movingCard, col)) {
            if (selected.zone === 'waste') {
              tableau[col].push(waste.pop());
            } else {
              const movedSlice = tableau[selected.col].splice(selected.idx);
              tableau[col].push(...movedSlice);
              revealTopTableau();
            }
            moves++;
            selected = null;
            safePlayGameTone('click');
            draw();
            return;
          }
        }

        selected = { zone: 'tableau', col, idx: cIdx };
        safePlayGameTone('click');
        draw();
      });
    });

    // 빈 작업대 열(Empty Tableau Column) 클릭 시 K 이동
    stage.querySelectorAll('.sol-col').forEach(colEl => {
      colEl.addEventListener('click', () => {
        const col = Number(colEl.dataset.col);
        if (!selected || tableau[col].length > 0) return;

        let movingCard = null;
        if (selected.zone === 'waste') movingCard = waste[waste.length - 1];
        else if (selected.zone === 'tableau') movingCard = tableau[selected.col][selected.idx];

        if (movingCard && canMoveToTableau(movingCard, col)) {
          if (selected.zone === 'waste') {
            tableau[col].push(waste.pop());
          } else {
            const movedSlice = tableau[selected.col].splice(selected.idx);
            tableau[col].push(...movedSlice);
            revealTopTableau();
          }
          moves++;
          selected = null;
          safePlayGameTone('click');
          draw();
        }
      });
    });
  };

  draw();
}

// ============================================================
// 2. 지뢰찾기 95 (8x8 — 정통 Windows 95 양각 베벨 & 우클릭 깃발)
// ============================================================
function renderMinesweeperGame() {
  const stage = document.getElementById('gamepack-stage');
  if (!stage) return;

  const SIZE = 8;
  const MINES = 10;
  let flagMode = false;
  let gameOver = false;
  let won = false;
  let boomPos = null;

  const NUM_COLORS = {
    1: '#0000ff',
    2: '#008000',
    3: '#ff0000',
    4: '#000080',
    5: '#800000',
    6: '#008080',
    7: '#000000',
    8: '#808080'
  };

  const board = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => ({ mine: false, open: false, flag: false, count: 0 }))
  );

  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * SIZE);
    const c = Math.floor(Math.random() * SIZE);
    if (!board[r][c].mine) {
      board[r][c].mine = true;
      placed++;
    }
  }

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c].mine) continue;
      let cnt = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc].mine) cnt++;
        }
      }
      board[r][c].count = cnt;
    }
  }

  const reveal = (r, c) => {
    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return;
    const cell = board[r][c];
    if (cell.open || cell.flag) return;
    cell.open = true;
    if (cell.count === 0 && !cell.mine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) reveal(r + dr, c + dc);
      }
    }
  };

  const revealAllMines = () => {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c].mine) board[r][c].open = true;
      }
    }
  };

  const checkWin = () => {
    let safeOpened = 0;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (!board[r][c].mine && board[r][c].open) safeOpened++;
      }
    }
    if (safeOpened === SIZE * SIZE - MINES) {
      won = true;
      gameOver = true;
      safePlayGameTone('fanfare');
    }
  };

  const draw = () => {
    const flagCount = board.flat().filter(c => c.flag).length;
    const remainMines = Math.max(0, MINES - flagCount);

    stage.innerHTML = `
      <div class="box-head">
        <span>지뢰찾기 95 ${won ? `— ${GAMEPACK_PIXEL_ICONS.trophy} [CLEAR] 승리!` : gameOver ? `— ${GAMEPACK_PIXEL_ICONS.mine} [BOOM] 지뢰 폭발!` : `(남은 지뢰: ${remainMines}개)`}</span>
        <div style="display:flex;gap:6px;">
          <button type="button" class="btn95 sm ${flagMode ? 'pink' : ''}" id="btn-mine-flag">${GAMEPACK_PIXEL_ICONS.flag} 깃발 모드: ${flagMode ? 'ON' : 'OFF'}</button>
          <button type="button" class="btn95 yellow sm" id="btn-mine-reset">새 게임</button>
        </div>
      </div>
      <div style="background:#c0c0c0;border:2px solid #111;padding:10px;display:flex;justify-content:center;">
        <div style="display:grid;grid-template-columns:repeat(${SIZE},34px);gap:0;border:2px solid #808080;background:#808080;">
          ${board.map((row, r) => row.map((cell, c) => {
            let contentHtml = '';
            let styleStr = 'width:34px;height:34px;font-weight:900;font-size:0.9rem;font-family:var(--font-mono);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;';
            if (cell.open) {
              const isBoom = boomPos && boomPos.r === r && boomPos.c === c;
              const bg = cell.mine ? (isBoom ? '#ff0000' : '#d8d8d8') : '#dcdcdc';
              const txtColor = NUM_COLORS[cell.count] || '#111111';
              styleStr += `background:${bg};color:${txtColor};border:1px solid #808080;`;
              contentHtml = cell.mine ? GAMEPACK_PIXEL_ICONS.mine : (cell.count ? String(cell.count) : '');
            } else {
              styleStr += 'background:#c0c0c0;border-width:2px;border-style:solid;border-color:#ffffff #808080 #808080 #ffffff;';
              if (cell.flag) {
                contentHtml = GAMEPACK_PIXEL_ICONS.flag;
              }
            }
            return `<button type="button" class="mine-cell" data-r="${r}" data-c="${c}" style="${styleStr}">${contentHtml}</button>`;
          }).join('')).join('')}
        </div>
      </div>
      <div style="margin-top:6px;font-size:0.74rem;font-weight:800;color:#444;">
        조작법: 좌클릭으로 칸을 열고, 마우스 우클릭(또는 상단 [깃발 모드])으로 지뢰 위치를 표시하십시오.
      </div>
    `;

    document.getElementById('btn-mine-flag')?.addEventListener('click', () => {
      flagMode = !flagMode;
      safePlayGameTone('click');
      draw();
    });
    document.getElementById('btn-mine-reset')?.addEventListener('click', () => {
      safePlayGameTone('click');
      renderMinesweeperGame();
    });

    stage.querySelectorAll('.mine-cell').forEach(btn => {
      btn.addEventListener('contextmenu', e => {
        e.preventDefault();
        if (gameOver) return;
        const r = Number(btn.dataset.r), c = Number(btn.dataset.c);
        const cell = board[r][c];
        if (!cell.open) {
          cell.flag = !cell.flag;
          safePlayGameTone('click');
          draw();
        }
      });

      btn.addEventListener('click', () => {
        if (gameOver) return;
        const r = Number(btn.dataset.r), c = Number(btn.dataset.c);
        const cell = board[r][c];
        if (flagMode) {
          if (!cell.open) cell.flag = !cell.flag;
          safePlayGameTone('click');
          draw();
          return;
        }
        if (cell.flag || cell.open) return;
        if (cell.mine) {
          boomPos = { r, c };
          gameOver = true;
          revealAllMines();
          safePlayGameTone('boom');
        } else {
          reveal(r, c);
          safePlayGameTone('click');
          checkWin();
        }
        draw();
      });
    });
  };

  draw();
}

// ============================================================
// 3. 아카이브 12장 카드 뒤집기 (Memory Flip)
// ============================================================
function renderMemoryFlipGame() {
  const stage = document.getElementById('gamepack-stage');
  if (!stage) return;

  const fallbackPairs = [
    { key: 'B1', label: '문학 도서' },
    { key: 'M1', label: '인디 음악' },
    { key: 'V1', label: 'SF 영화' },
    { key: 'G1', label: '에세이' },
    { key: 'G2', label: '클래식 OST' },
    { key: 'G3', label: '다큐멘터리' }
  ];

  const visiblePool = getGameArchivePool();
  const sourcePool = visiblePool.slice(0, 6).map((item, i) => ({
    key: `ARC-${i}`,
    label: String(item.title || '').slice(0, 12)
  }));
  while (sourcePool.length < 6) {
    sourcePool.push(fallbackPairs[sourcePool.length]);
  }

  const deck = [...sourcePool, ...sourcePool]
    .map(c => ({ ...c, uid: Math.random() }))
    .sort((a, b) => a.uid - b.uid);

  let flippedIndices = [];
  let matchedKeys = new Set();
  let score = 0;
  let lockBoard = false;

  const draw = () => {
    stage.innerHTML = `
      <div class="box-head">
        <span>아카이브 12장 카드 뒤집기 (점수: ${score}점 / 완료: ${matchedKeys.size}/6쌍)</span>
        <button type="button" class="btn95 yellow sm" id="btn-flip-reset">다시 시작</button>
      </div>
      <div class="flip-card-grid">
        ${deck.map((card, idx) => {
          const isOpen = flippedIndices.includes(idx) || matchedKeys.has(card.key);
          const isDone = matchedKeys.has(card.key);
          return `<div class="flip-card ${isOpen ? 'flipped' : ''} ${isDone ? 'matched' : ''}" data-cidx="${idx}">
            ${isOpen ? esc(card.label) : 'ARCHIVE 95'}
          </div>`;
        }).join('')}
      </div>
    `;

    document.getElementById('btn-flip-reset')?.addEventListener('click', () => {
      safePlayGameTone('click');
      renderMemoryFlipGame();
    });

    stage.querySelectorAll('.flip-card').forEach(el => {
      el.addEventListener('click', () => {
        const idx = Number(el.dataset.cidx);
        if (lockBoard || flippedIndices.includes(idx) || matchedKeys.has(deck[idx].key)) return;
        safePlayGameTone('click');
        flippedIndices.push(idx);
        draw();

        if (flippedIndices.length === 2) {
          const [a, b] = flippedIndices;
          if (deck[a].key === deck[b].key) {
            matchedKeys.add(deck[a].key);
            score += 100;
            flippedIndices = [];
            safePlayGameTone(matchedKeys.size === 6 ? 'fanfare' : 'open');
            draw();
          } else {
            lockBoard = true;
            setTimeout(() => {
              flippedIndices = [];
              lockBoard = false;
              draw();
            }, 850);
          }
        }
      });
    });
  };

  draw();
}

// ============================================================
// 4. 내 아카이브 작품 별점 하이로우 (Star Rating Hi-Lo)
// ============================================================
function renderStarHiLoGame() {
  const stage = document.getElementById('gamepack-stage');
  if (!stage) return;

  const pool = getGameArchivePool();

  if (!pool || pool.length < 2) {
    stage.innerHTML = `<div style="padding:20px;text-align:center;font-weight:800;">별점 하이로우 대결을 진행하려면 최소 2건 이상의 감상 기록이 필요합니다. 먼저 감상 기록을 등록해 주십시오.</div>`;
    return;
  }

  let streak = 0;
  let feedback = '오른쪽 작품의 평점이 왼쪽 작품보다 높거나 같을지 맞추어 보십시오.';

  const pickPair = () => {
    const aIdx = Math.floor(Math.random() * pool.length);
    let bIdx = Math.floor(Math.random() * pool.length);
    while (bIdx === aIdx) bIdx = Math.floor(Math.random() * pool.length);
    return [pool[aIdx], pool[bIdx]];
  };

  let [leftItem, rightItem] = pickPair();
  let revealed = false;

  const draw = () => {
    stage.innerHTML = `
      <div class="box-head">
        <span>작품 별점 하이로우 대결</span>
        <span class="tag-mini">연속 정답: ${streak}연승</span>
      </div>
      <p style="font-size:0.82rem;font-weight:800;margin-bottom:10px;">${esc(feedback)}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        <div class="sunken-box" style="text-align:center;background:#fff6bf;">
          <div style="font-size:0.75rem;font-weight:800;">[기준 작품]</div>
          <div style="font-size:0.95rem;font-weight:900;margin:4px 0;">${esc(leftItem.title)}</div>
          <div style="font-size:0.75rem;color:#555;margin-bottom:6px;">${esc(leftItem.creator)}</div>
          <div style="font-size:1.15rem;font-weight:900;color:#d63031;display:flex;align-items:center;justify-content:center;gap:4px;">
            ${GAMEPACK_PIXEL_ICONS.star}<span>${leftItem.rating}점</span>
          </div>
        </div>
        <div class="sunken-box" style="text-align:center;background:#e8f8ff;">
          <div style="font-size:0.75rem;font-weight:800;">[도전 작품]</div>
          <div style="font-size:0.95rem;font-weight:900;margin:4px 0;">${esc(rightItem.title)}</div>
          <div style="font-size:0.75rem;color:#555;margin-bottom:6px;">${esc(rightItem.creator)}</div>
          <div style="font-size:1.15rem;font-weight:900;color:#000080;display:flex;align-items:center;justify-content:center;gap:4px;">
            ${GAMEPACK_PIXEL_ICONS.star}<span>${revealed ? `${rightItem.rating}점` : '?점'}</span>
          </div>
        </div>
      </div>
      <div style="display:flex;justify-content:center;gap:8px;">
        ${!revealed ? `
          <button type="button" class="btn95 green sm" id="btn-hilo-up">▲ 높거나 같다 (&gt;= ${leftItem.rating}점)</button>
          <button type="button" class="btn95 pink sm" id="btn-hilo-down">▼ 더 낮다 (&lt; ${leftItem.rating}점)</button>
        ` : `
          <button type="button" class="btn95 yellow sm" id="btn-hilo-next">다음 라운드 진행 &gt;&gt;</button>
        `}
      </div>
    `;

    document.getElementById('btn-hilo-up')?.addEventListener('click', () => {
      revealed = true;
      if (Number(rightItem.rating) >= Number(leftItem.rating)) {
        streak++;
        feedback = `[정답] 「${rightItem.title}」의 평점은 ${rightItem.rating}점입니다.`;
        safePlayGameTone('fanfare');
      } else {
        streak = 0;
        feedback = `[오답] 「${rightItem.title}」의 평점은 ${rightItem.rating}점으로 더 낮았습니다.`;
        safePlayGameTone('boom');
      }
      draw();
    });

    document.getElementById('btn-hilo-down')?.addEventListener('click', () => {
      revealed = true;
      if (Number(rightItem.rating) < Number(leftItem.rating)) {
        streak++;
        feedback = `[정답] 「${rightItem.title}」의 평점은 ${rightItem.rating}점입니다.`;
        safePlayGameTone('fanfare');
      } else {
        streak = 0;
        feedback = `[오답] 「${rightItem.title}」의 평점은 ${rightItem.rating}점으로 더 높거나 같았습니다.`;
        safePlayGameTone('boom');
      }
      draw();
    });

    document.getElementById('btn-hilo-next')?.addEventListener('click', () => {
      [leftItem, rightItem] = pickPair();
      revealed = false;
      feedback = '오른쪽 작품의 평점이 왼쪽 작품보다 높거나 같을지 맞추어 보십시오.';
      safePlayGameTone('click');
      draw();
    });
  };

  draw();
}

window.renderGamePackShell = renderGamePackShell;

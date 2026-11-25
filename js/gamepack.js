// ============================================================
// MY-ARCHIVE 95 OS — Retro Mini-Game Pack (GAMEPACK95.EXE)
// (Solitaire 95, Classic Bevel Minesweeper, Retro Yut vs AI & Hi-Lo)
// ============================================================

window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
window.__MOD_VERSIONS.gamepack = typeof APP_BUILD_VERSION !== 'undefined' ? APP_BUILD_VERSION : 'v2026.11.25-yut-board-visual-v2';

let activeGameTab = 'solitaire';
let cleanupActiveGame = null;

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
    </svg>`,
  yutStick: `
    <svg class="pixel-svg-14" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true" style="vertical-align:-2px;">
      <path fill="#111111" d="M6 1h4v14H6V1z"/>
      <path fill="#f5deb3" d="M7 2h2v12H7V2z"/>
      <path fill="#b8860b" d="M7 5h2v1H7V5zm0 5h2v1H7v-1z"/>
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
  if (typeof cleanupActiveGame === 'function') {
    cleanupActiveGame();
    cleanupActiveGame = null;
  }

  const body = document.getElementById('gamepack-body');
  if (!body) return;

  body.innerHTML = `
    <div class="pill-group" style="margin-bottom:12px;">
      <button type="button" class="pill-btn ${activeGameTab === 'solitaire' ? 'active' : ''}" data-gtab="solitaire">카드 솔리테어 95</button>
      <button type="button" class="pill-btn ${activeGameTab === 'mine' ? 'active' : ''}" data-gtab="mine">지뢰찾기 95 (8x8)</button>
      <button type="button" class="pill-btn ${activeGameTab === 'yut' ? 'active' : ''}" data-gtab="yut">레트로 윷놀이 vs AI</button>
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
  else if (activeGameTab === 'yut') renderRetroYutGame();
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
  let selected = null;
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
    if (destPile.length === 0) return card.rank === 13;
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

    stage.querySelectorAll('.sol-card').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const col = Number(btn.dataset.col);
        const cIdx = Number(btn.dataset.cidx);

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
// 3. 레트로 윷놀이 vs AI (직관적 사각형 윷판 + 도착 미리보기 + 칸 클릭 이동)
// ============================================================
function renderRetroYutGame() {
  const stage = document.getElementById('gamepack-stage');
  if (!stage) return;

  // 5x5 격자 [row(0..4), col(0..4)] 좌표 매핑
  // 외곽 시계반대방향: 20(우하 출발/골) -> 1..4(우측) -> 5(우상) -> 6..9(상단) -> 10(좌상) -> 11..14(좌측) -> 15(좌하) -> 16..19(하단)
  const NODE_META = {
    0: { label: '출발 대기', short: '대기', kind: 'start' },
    1: { label: '1칸(우)', short: '1', kind: 'outer', r: 3, c: 4 },
    2: { label: '2칸(우)', short: '2', kind: 'outer', r: 2, c: 4 },
    3: { label: '3칸(우)', short: '3', kind: 'outer', r: 1, c: 4 },
    4: { label: '4칸(우)', short: '4', kind: 'outer', r: 0, c: 4 },
    5: { label: '우상 모서리★', short: '5★', kind: 'corner', r: 0, c: 3 },
    6: { label: '6칸(상)', short: '6', kind: 'outer', r: 0, c: 2 },
    7: { label: '7칸(상)', short: '7', kind: 'outer', r: 0, c: 1 },
    8: { label: '8칸(상)', short: '8', kind: 'outer', r: 0, c: 0 },
    9: { label: '9칸(상)', short: '9', kind: 'outer', r: 1, c: 0 },
    10: { label: '좌상 모서리★', short: '10★', kind: 'corner', r: 2, c: 0 },
    11: { label: '11칸(좌)', short: '11', kind: 'outer', r: 3, c: 0 },
    12: { label: '12칸(좌)', short: '12', kind: 'outer', r: 4, c: 0 },
    13: { label: '13칸(좌)', short: '13', kind: 'outer', r: 4, c: 1 },
    14: { label: '14칸(좌)', short: '14', kind: 'outer', r: 4, c: 2 },
    15: { label: '좌하 모서리', short: '15', kind: 'corner', r: 4, c: 3 },
    16: { label: '16칸(하)', short: '16', kind: 'outer', r: 4, c: 4 },
    17: { label: '17칸(하)', short: '17', kind: 'outer', r: 3, c: 3 },
    18: { label: '18칸(하)', short: '18', kind: 'outer', r: 3, c: 1 },
    19: { label: '19칸(하)', short: '19', kind: 'outer', r: 1, c: 3 },
    20: { label: '출발·골인점', short: '출/골', kind: 'goal', r: 4, c: 4 },
    21: { label: '우상 지름길1', short: '우지1', kind: 'diag', r: 1, c: 3 },
    22: { label: '우상 지름길2', short: '우지2', kind: 'diag', r: 2, c: 3 },
    23: { label: '중앙 방★', short: '중앙★', kind: 'center', r: 2, c: 2 },
    24: { label: '중앙→좌하1', short: '중좌1', kind: 'diag', r: 3, c: 1 },
    25: { label: '중앙→좌하2', short: '중좌2', kind: 'diag', r: 3, c: 2 },
    26: { label: '좌상 지름길1', short: '좌지1', kind: 'diag', r: 2, c: 1 },
    27: { label: '좌상 지름길2', short: '좌지2', kind: 'diag', r: 1, c: 1 },
    28: { label: '중앙→골인1', short: '중골1', kind: 'diag', r: 3, c: 3 },
    29: { label: '중앙→골인2', short: '중골2', kind: 'diag', r: 3, c: 2 },
    GOAL: { label: '완주(GOAL)', short: '완주', kind: 'goal' }
  };

  // 5x5 시각적 윷판 격자(겹치지 않는 깔끔한 사각 윷판 레이아웃)
  // 외곽 테두리 + 대각선 5칸(중앙 포함)
  const BOARD_GRID_LAYOUT = [
    [8, 7, 6, 5, 4],
    [9, 27, null, 21, 3],
    [10, 26, 23, 22, 2],
    [11, 24, null, 28, 1],
    [12, 13, 14, 15, 20]
  ];

  const YUT_OUTCOMES = [
    { name: '도', steps: 1, bonusThrow: false, flatCount: 1 },
    { name: '개', steps: 2, bonusThrow: false, flatCount: 2 },
    { name: '걸', steps: 3, bonusThrow: false, flatCount: 3 },
    { name: '윷', steps: 4, bonusThrow: true, flatCount: 4 },
    { name: '모', steps: 5, bonusThrow: true, flatCount: 0 }
  ];

  let tokens = {
    player: [0, 0],
    ai: [0, 0]
  };

  let turn = 'player';
  let pendingThrow = null;
  let activeTokenIdx = 0;
  let sticks = [true, false, false, false];
  let lastThrowLabel = '대기 중';
  let statusMsg = '내 차례! [윷 던지기]를 눌러 한 판 시작하세요.';
  let winner = null;
  let aiTimerId = null;

  const clearAiTimer = () => {
    if (aiTimerId) {
      clearTimeout(aiTimerId);
      aiTimerId = null;
    }
  };

  const rollYut = () => {
    const r = Math.random();
    let picked;
    if (r < 0.25) picked = YUT_OUTCOMES[0];
    else if (r < 0.58) picked = YUT_OUTCOMES[1];
    else if (r < 0.84) picked = YUT_OUTCOMES[2];
    else if (r < 0.94) picked = YUT_OUTCOMES[3];
    else picked = YUT_OUTCOMES[4];

    const nextSticks = [false, false, false, false];
    for (let i = 0; i < picked.flatCount; i++) nextSticks[i] = true;
    for (let i = nextSticks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nextSticks[i], nextSticks[j]] = [nextSticks[j], nextSticks[i]];
    }
    return { ...picked, sticks: nextSticks };
  };

  const computeDestination = (side, tokenIdx, steps, useShortcut) => {
    const cur = tokens[side][tokenIdx];
    if (cur === 'GOAL') return 'GOAL';

    if (cur === 0) {
      return steps >= 20 ? 'GOAL' : steps;
    }

    if (cur >= 1 && cur <= 20) {
      if (cur === 5 && useShortcut) {
        const diagPath = [5, 21, 22, 23, 24, 25, 15, 16, 17, 18, 19, 20, 'GOAL'];
        return diagPath[Math.min(diagPath.length - 1, steps)];
      }
      if (cur === 10 && useShortcut) {
        const diagPath = [10, 26, 27, 23, 24, 25, 15, 16, 17, 18, 19, 20, 'GOAL'];
        return diagPath[Math.min(diagPath.length - 1, steps)];
      }
      const nextOuter = cur + steps;
      return nextOuter > 20 ? 'GOAL' : nextOuter;
    }

    if (cur === 21 || cur === 22) {
      const path = cur === 21
        ? [21, 22, 23, 24, 25, 15, 16, 17, 18, 19, 20, 'GOAL']
        : [22, 23, 24, 25, 15, 16, 17, 18, 19, 20, 'GOAL'];
      return path[Math.min(path.length - 1, steps)];
    }

    if (cur === 23) {
      if (useShortcut) {
        const goalPath = [23, 28, 29, 'GOAL'];
        return goalPath[Math.min(goalPath.length - 1, steps)];
      }
      const leftDownPath = [23, 24, 25, 15, 16, 17, 18, 19, 20, 'GOAL'];
      return leftDownPath[Math.min(leftDownPath.length - 1, steps)];
    }

    if (cur === 24 || cur === 25) {
      const path = cur === 24
        ? [24, 25, 15, 16, 17, 18, 19, 20, 'GOAL']
        : [25, 15, 16, 17, 18, 19, 20, 'GOAL'];
      return path[Math.min(path.length - 1, steps)];
    }

    if (cur === 26 || cur === 27) {
      const path = cur === 26
        ? [26, 27, 23, 24, 25, 15, 16, 17, 18, 19, 20, 'GOAL']
        : [27, 23, 24, 25, 15, 16, 17, 18, 19, 20, 'GOAL'];
      return path[Math.min(path.length - 1, steps)];
    }

    if (cur === 28 || cur === 29) {
      const path = cur === 28 ? [28, 29, 'GOAL'] : [29, 'GOAL'];
      return path[Math.min(path.length - 1, steps)];
    }

    return 'GOAL';
  };

  const canOfferShortcut = (pos) => pos === 5 || pos === 10 || pos === 23;

  const getStackedIndices = (side, tokenIdx) => {
    const pos = tokens[side][tokenIdx];
    if (pos === 0 || pos === 'GOAL') return [tokenIdx];
    return tokens[side]
      .map((p, i) => (p === pos ? i : -1))
      .filter(i => i !== -1);
  };

  const checkWinner = () => {
    if (tokens.player.every(p => p === 'GOAL')) return 'player';
    if (tokens.ai.every(p => p === 'GOAL')) return 'ai';
    return null;
  };

  const ensureValidActiveToken = () => {
    if (tokens.player[activeTokenIdx] !== 'GOAL') return;
    const nextIdx = tokens.player.findIndex(p => p !== 'GOAL');
    if (nextIdx !== -1) activeTokenIdx = nextIdx;
  };

  const executeMove = (side, tokenIdx, useShortcut = false) => {
    if (!pendingThrow || winner) return;
    const { steps, bonusThrow } = pendingThrow;
    const enemySide = side === 'player' ? 'ai' : 'player';
    const sideLabel = side === 'player' ? '내 말(P)' : 'AI';

    const curPos = tokens[side][tokenIdx];
    if (curPos === 'GOAL') return;

    const stacked = getStackedIndices(side, tokenIdx);
    const destPos = computeDestination(side, tokenIdx, steps, useShortcut);

    stacked.forEach(idx => {
      tokens[side][idx] = destPos;
    });

    let captured = false;
    if (destPos !== 'GOAL' && destPos !== 0) {
      tokens[enemySide].forEach((ePos, eIdx) => {
        if (ePos === destPos) {
          tokens[enemySide][eIdx] = 0;
          captured = true;
        }
      });
    }

    const stackedText = stacked.length > 1
      ? `${stacked.map(i => (side === 'player' ? `P${i + 1}` : `A${i + 1}`)).join('+')} 업기`
      : (side === 'player' ? `P${tokenIdx + 1}` : `A${tokenIdx + 1}`);

    pendingThrow = null;
    winner = checkWinner();

    if (winner) {
      safePlayGameTone('fanfare');
      statusMsg = winner === 'player'
        ? '승리! 내 말 두 개가 모두 완주했습니다!'
        : '패배! AI가 먼저 두 말을 완주했습니다.';
      draw();
      return;
    }

    if (captured) {
      safePlayGameTone('open');
      statusMsg = `${sideLabel}(${stackedText}) 상대 말 잡기 성공! 한 번 더 던지세요.`;
      if (side === 'ai') scheduleAiTurn();
      draw();
      return;
    }

    safePlayGameTone(destPos === 'GOAL' ? 'open' : 'click');

    if (bonusThrow) {
      statusMsg = `${sideLabel}(${stackedText}) ${lastThrowLabel} 보너스! 한 번 더 던지세요.`;
      if (side === 'ai') scheduleAiTurn();
      draw();
      return;
    }

    turn = enemySide;
    statusMsg = turn === 'player'
      ? '내 차례입니다. [윷 던지기]를 누르세요.'
      : 'AI가 윷을 던지는 중...';
    draw();
    if (turn === 'ai') scheduleAiTurn();
  };

  const pickBestAiMove = (steps) => {
    const enemyArr = tokens.player;
    const candidates = [];

    for (let idx = 0; idx < 2; idx++) {
      const cur = tokens.ai[idx];
      if (cur === 'GOAL') continue;

      const options = canOfferShortcut(cur) ? [false, true] : [false];
      for (const useSc of options) {
        const dest = computeDestination('ai', idx, steps, useSc);
        let score = 0;
        if (dest === 'GOAL') score += 150;
        else if (typeof dest === 'number') {
          score += dest * 2;
          if (enemyArr.some(ep => ep === dest)) score += 110;
          if (tokens.ai.some((ap, ai) => ai !== idx && ap === dest)) score += 45;
          if (useSc) score += 25;
        }
        candidates.push({ idx, useSc, score });
      }
    }

    if (!candidates.length) return null;
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0];
  };

  const scheduleAiTurn = () => {
    clearAiTimer();
    if (winner) return;

    aiTimerId = setTimeout(() => {
      if (winner || turn !== 'ai') return;
      const rolled = rollYut();
      sticks = rolled.sticks;
      pendingThrow = rolled;
      lastThrowLabel = `${rolled.name} (+${rolled.steps})`;
      safePlayGameTone('click');
      statusMsg = `AI가 [${rolled.name} +${rolled.steps}칸]을 던졌습니다.`;
      draw();

      aiTimerId = setTimeout(() => {
        if (winner || turn !== 'ai' || !pendingThrow) return;
        const best = pickBestAiMove(pendingThrow.steps);
        if (best) {
          executeMove('ai', best.idx, best.useSc);
        } else {
          pendingThrow = null;
          turn = 'player';
          statusMsg = '내 차례입니다. [윷 던지기]를 누르세요.';
          draw();
        }
      }, 600);
    }, 600);
  };

  cleanupActiveGame = () => clearAiTimer();

  const draw = () => {
    ensureValidActiveToken();

    const pGoal = tokens.player.filter(p => p === 'GOAL').length;
    const aiGoal = tokens.ai.filter(p => p === 'GOAL').length;
    const canPlayerMove = Boolean(!winner && turn === 'player' && pendingThrow);

    // 현재 선택된 말의 이동 후보(일반 / 지름길)
    const curPos = tokens.player[activeTokenIdx];
    const normalDest = canPlayerMove && curPos !== 'GOAL'
      ? computeDestination('player', activeTokenIdx, pendingThrow.steps, false)
      : null;
    const shortcutDest = canPlayerMove && curPos !== 'GOAL' && canOfferShortcut(curPos)
      ? computeDestination('player', activeTokenIdx, pendingThrow.steps, true)
      : null;

    const getActionBadgeForDest = (dest) => {
      if (!dest) return '';
      if (dest === 'GOAL') return '완주!';
      if (typeof dest === 'number' && dest > 0) {
        const hitsEnemy = tokens.ai.some(ap => ap === dest);
        const stacksSelf = tokens.player.some((pp, i) => i !== activeTokenIdx && pp === dest);
        if (hitsEnemy) return '잡기!';
        if (stacksSelf) return '업기!';
        return '이동';
      }
      return '';
    };

    const renderBoardCell = (nodeId) => {
      if (nodeId === null) {
        return `<div style="min-height:54px;border:1px dashed rgba(17,17,17,0.12);background:rgba(255,255,255,0.25);"></div>`;
      }

      const meta = NODE_META[nodeId];
      const pHere = tokens.player.map((pos, i) => (pos === nodeId ? `P${i + 1}` : null)).filter(Boolean);
      const aiHere = tokens.ai.map((pos, i) => (pos === nodeId ? `A${i + 1}` : null)).filter(Boolean);

      const isNormalTarget = normalDest === nodeId;
      const isShortcutTarget = shortcutDest === nodeId;
      const isTarget = isNormalTarget || isShortcutTarget;

      let bg = '#ffffff';
      if (nodeId === 20) bg = '#e8f5e9';
      else if (meta.kind === 'center') bg = '#ffe0f0';
      else if (meta.kind === 'corner') bg = '#fff3b0';
      else if (meta.kind === 'diag') bg = '#e3f4ff';

      if (isTarget) bg = '#b8ff9e';

      const targetHint = isTarget
        ? getActionBadgeForDest(isShortcutTarget ? shortcutDest : normalDest)
        : '';

      return `
        <button type="button"
          class="yut-board-cell"
          data-node="${nodeId}"
          data-sc="${isShortcutTarget && !isNormalTarget ? '1' : '0'}"
          style="min-height:56px;width:100%;border:${isTarget ? '2.5px solid #d63031' : '1.5px solid #111'};background:${bg};padding:3px;display:flex;flex-direction:column;justify-content:space-between;align-items:stretch;cursor:${isTarget ? 'pointer' : 'default'};text-align:left;position:relative;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:2px;">
            <span style="font-size:0.68rem;font-weight:900;color:#111;">${esc(meta.short)}</span>
            ${targetHint ? `<span style="background:#d63031;color:#fff;font-size:0.62rem;font-weight:900;padding:0 3px;border:1px solid #111;">${esc(targetHint)}</span>` : ''}
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:2px;min-height:18px;align-items:center;">
            ${pHere.length ? `<span style="background:#000080;color:#fff;font-size:0.66rem;font-weight:900;padding:1px 4px;border:1px solid #111;">${pHere.join('+')}</span>` : ''}
            ${aiHere.length ? `<span style="background:#d63031;color:#fff;font-size:0.66rem;font-weight:900;padding:1px 4px;border:1px solid #111;">${aiHere.join('+')}</span>` : ''}
            ${!pHere.length && !aiHere.length && isTarget ? `<span style="font-size:0.64rem;font-weight:900;color:#005a16;">도착점</span>` : ''}
          </div>
        </button>
      `;
    };

    stage.innerHTML = `
      <div class="box-head">
        <span>레트로 윷놀이 95 vs AI — 완주: 내 말 ${pGoal}/2 · AI ${aiGoal}/2</span>
        <button type="button" class="btn95 yellow sm" id="btn-yut-reset">새 판 시작</button>
      </div>

      <div style="background:#efe4c4;border:2px solid #111;padding:10px;color:#111;">
        <!-- 상단 상태바 & 윷 던지기 -->
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;background:#fff;border:2px solid #111;padding:8px;margin-bottom:10px;">
          <div style="font-size:0.8rem;font-weight:900;">${esc(statusMsg)}</div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="tag-mini">${esc(lastThrowLabel)}</span>
            ${!winner && turn === 'player' && !pendingThrow
              ? `<button type="button" class="btn95 pink sm" id="btn-yut-throw">${GAMEPACK_PIXEL_ICONS.yutStick} 윷 던지기</button>`
              : ''}
          </div>
        </div>

        <!-- 윷가락 4개 시각화 -->
        <div style="display:flex;justify-content:center;gap:10px;background:#decb9c;border:2px solid #111;padding:6px;margin-bottom:10px;">
          ${sticks.map((isFlat, i) => `
            <div style="width:36px;height:52px;border:2px solid #111;background:${isFlat ? '#fff9e0' : '#c69563'};display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:3px 0;font-size:0.68rem;font-weight:900;">
              <span>${i + 1}</span>
              <span>${isFlat ? '배' : '등'}</span>
              <span>${isFlat ? '■' : '●'}</span>
            </div>
          `).join('')}
        </div>

        <!-- 사각형 윷판 본체 -->
        <div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;background:#c8b27c;border:2.5px solid #111;padding:6px;margin-bottom:10px;">
          ${BOARD_GRID_LAYOUT.map(row => row.map(renderBoardCell).join('')).join('')}
        </div>

        <!-- 내 말 선택 및 이동 컨트롤 -->
        <div style="display:grid;grid-template-columns:1.35fr 0.65fr;gap:8px;">
          <div style="background:#fff;border:2px solid #111;padding:8px;">
            <div style="font-size:0.75rem;font-weight:900;color:#000080;margin-bottom:6px;">
              내 말 선택 & 이동 (초록색 도착 칸을 눌러도 이동 가능)
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;">
              ${tokens.player.map((pos, idx) => {
                const isDone = pos === 'GOAL';
                const isSelected = activeTokenIdx === idx && !isDone;
                const posLabel = isDone ? '완주!' : NODE_META[pos].label;
                const stacked = getStackedIndices('player', idx);
                const stackBadge = stacked.length > 1 ? ` (${stacked.map(i => `P${i + 1}`).join('+')} 업힘)` : '';
                const showShortcut = canPlayerMove && !isDone && canOfferShortcut(pos);
                const destNormal = canPlayerMove && !isDone ? computeDestination('player', idx, pendingThrow.steps, false) : null;
                const destLabel = destNormal === 'GOAL' ? '완주' : (destNormal ? NODE_META[destNormal].short : '');

                return `
                  <div style="display:flex;flex-wrap:wrap;gap:5px;align-items:center;">
                    <button type="button"
                      class="btn95 sm ${isSelected ? 'sky' : ''}"
                      data-yut-select="${idx}"
                      ${isDone ? 'disabled' : ''}>
                      P${idx + 1}: ${posLabel}${stackBadge}
                    </button>
                    ${canPlayerMove && !isDone ? `
                      <button type="button" class="btn95 green sm" data-yut-move="${idx}" data-sc="0">
                        일반 이동 → ${destLabel}
                      </button>
                    ` : ''}
                    ${showShortcut ? `
                      <button type="button" class="btn95 yellow sm" data-yut-move="${idx}" data-sc="1">
                        ★ 지름길 이동
                      </button>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div style="background:#fff;border:2px solid #111;padding:8px;">
            <div style="font-size:0.75rem;font-weight:900;color:#d63031;margin-bottom:6px;">AI 말 위치</div>
            <div style="display:flex;flex-direction:column;gap:5px;font-size:0.74rem;font-weight:800;">
              ${tokens.ai.map((pos, idx) => {
                const posLabel = pos === 'GOAL' ? '완주!' : NODE_META[pos].label;
                return `<div class="tag-mini">A${idx + 1}: ${esc(posLabel)}</div>`;
              }).join('')}
            </div>
            <div style="margin-top:8px;font-size:0.68rem;color:#555;font-weight:700;line-height:1.35;">
              · 대기(0) 말은 윷판 밖 대기 상태입니다.<br/>
              · 상대 칸에 가면 말을 잡고 한 번 더 던집니다.
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-yut-reset')?.addEventListener('click', () => {
      clearAiTimer();
      safePlayGameTone('click');
      renderRetroYutGame();
    });

    document.getElementById('btn-yut-throw')?.addEventListener('click', () => {
      if (winner || turn !== 'player' || pendingThrow) return;
      const rolled = rollYut();
      sticks = rolled.sticks;
      pendingThrow = rolled;
      lastThrowLabel = `${rolled.name} (+${rolled.steps})`;
      safePlayGameTone('click');

      const hasMovable = tokens.player.some(p => p !== 'GOAL');
      if (!hasMovable) {
        pendingThrow = null;
        turn = 'ai';
        statusMsg = '이동할 내 말이 없어 AI 턴으로 넘어갑니다.';
        draw();
        scheduleAiTurn();
        return;
      }

      ensureValidActiveToken();
      statusMsg = `[${rolled.name} +${rolled.steps}칸] 초록색 도착 칸을 누르거나 [일반 이동]을 누르세요.`;
      draw();
    });

    stage.querySelectorAll('[data-yut-select]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.yutSelect);
        if (tokens.player[idx] === 'GOAL') return;
        activeTokenIdx = idx;
        safePlayGameTone('click');
        draw();
      });
    });

    stage.querySelectorAll('[data-yut-move]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!canPlayerMove) return;
        const idx = Number(btn.dataset.yutMove);
        const useSc = btn.dataset.sc === '1';
        activeTokenIdx = idx;
        executeMove('player', idx, useSc);
      });
    });

    // 윷판의 하이라이트된 도착 칸 직접 클릭 시 이동
    stage.querySelectorAll('.yut-board-cell').forEach(cellBtn => {
      cellBtn.addEventListener('click', () => {
        if (!canPlayerMove) return;
        const nodeId = Number(cellBtn.dataset.node);
        const useSc = cellBtn.dataset.sc === '1';
        const targetMatch = useSc ? shortcutDest === nodeId : normalDest === nodeId;
        if (!targetMatch) return;
        executeMove('player', activeTokenIdx, useSc);
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

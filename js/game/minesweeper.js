// ============================================================
// GAMEPACK MODULE — 지뢰찾기 95 (8x8)
// ============================================================

window.GamePackModules = window.GamePackModules || {};

window.GamePackModules.mine = {
  render({ stage, icons, playTone }) {
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
        playTone('fanfare');
      }
    };

    const draw = () => {
      const flagCount = board.flat().filter(c => c.flag).length;
      const remainMines = Math.max(0, MINES - flagCount);

      stage.innerHTML = `
        <div class="box-head">
          <span>지뢰찾기 95 ${won ? `— ${icons.trophy} [CLEAR] 승리!` : gameOver ? `— ${icons.mine} [BOOM] 지뢰 폭발!` : `(남은 지뢰: ${remainMines}개)`}</span>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button type="button" class="btn95 sm ${flagMode ? 'pink' : ''}" id="btn-mine-flag">${icons.flag} 깃발 모드: ${flagMode ? 'ON' : 'OFF'}</button>
            <button type="button" class="btn95 yellow sm" id="btn-mine-reset">새 게임</button>
          </div>
        </div>
        <div style="background:#c0c0c0;border:2px solid #111;padding:10px;display:flex;justify-content:center;box-sizing:border-box;">
          <div class="gp-mine-grid">
            ${board.map((row, r) => row.map((cell, c) => {
              let contentHtml = '';
              let extraStyle = '';
              if (cell.open) {
                const isBoom = boomPos && boomPos.r === r && boomPos.c === c;
                const bg = cell.mine ? (isBoom ? '#ff0000' : '#d8d8d8') : '#dcdcdc';
                const txtColor = NUM_COLORS[cell.count] || '#111111';
                extraStyle = `background:${bg};color:${txtColor};border:1px solid #808080;`;
                contentHtml = cell.mine ? icons.mine : (cell.count ? String(cell.count) : '');
              } else {
                extraStyle = 'background:#c0c0c0;border-width:2px;border-style:solid;border-color:#ffffff #808080 #808080 #ffffff;';
                if (cell.flag) {
                  contentHtml = icons.flag;
                }
              }
              return `<button type="button" class="mine-cell gp-mine-cell" data-r="${r}" data-c="${c}" style="${extraStyle}">${contentHtml}</button>`;
            }).join('')).join('')}
          </div>
        </div>
        <div style="margin-top:6px;font-size:0.74rem;font-weight:800;color:#444;">
          조작법: 좌클릭으로 칸을 열고, 마우스 우클릭(또는 상단 [깃발 모드])으로 지뢰 위치를 표시하십시오.
        </div>
      `;

      document.getElementById('btn-mine-flag')?.addEventListener('click', () => {
        flagMode = !flagMode;
        playTone('click');
        draw();
      });
      document.getElementById('btn-mine-reset')?.addEventListener('click', () => {
        playTone('click');
        this.render({ stage, icons, playTone });
      });

      stage.querySelectorAll('.mine-cell').forEach(btn => {
        btn.addEventListener('contextmenu', e => {
          e.preventDefault();
          if (gameOver) return;
          const r = Number(btn.dataset.r), c = Number(btn.dataset.c);
          const cell = board[r][c];
          if (!cell.open) {
            cell.flag = !cell.flag;
            playTone('click');
            draw();
          }
        });

        btn.addEventListener('click', () => {
          if (gameOver) return;
          const r = Number(btn.dataset.r), c = Number(btn.dataset.c);
          const cell = board[r][c];
          if (flagMode) {
            if (!cell.open) cell.flag = !cell.flag;
            playTone('click');
            draw();
            return;
          }
          if (cell.flag || cell.open) return;
          if (cell.mine) {
            boomPos = { r, c };
            gameOver = true;
            revealAllMines();
            playTone('boom');
          } else {
            reveal(r, c);
            playTone('click');
            checkWin();
          }
          draw();
        });
      });
    };

    draw();
  }
};

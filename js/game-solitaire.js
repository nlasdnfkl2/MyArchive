// ============================================================
// GAMEPACK MODULE — 클론다이크 솔리테어 95
// ============================================================

window.GamePackModules = window.GamePackModules || {};

window.GamePackModules.solitaire = {
  render({ stage, icons, playTone, esc }) {
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
    let lastActionKey = '';

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
          lastActionKey = `f:${top.suit}`;
          playTone('open');
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
            lastActionKey = `f:${top.suit}`;
            playTone('open');
            return true;
          }
        }
      }
      return false;
    };

    const checkSolitaireWin = () => {
      const totalDone = Object.values(foundations).reduce((s, p) => s + p.length, 0);
      if (totalDone === 52) {
        playTone('fanfare');
        return true;
      }
      return false;
    };

    const draw = () => {
      const isWon = checkSolitaireWin();
      const animKey = lastActionKey;
      lastActionKey = '';

      stage.innerHTML = `
        <div class="box-head">
          <span>클론다이크 솔리테어 95 ${isWon ? `— ${icons.trophy} [CLEAR] 완승 축하합니다!` : `(이동: ${moves}회)`}</span>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button type="button" class="btn95 sky sm" id="btn-sol-auto">[AUTO] 자동 올리기</button>
            <button type="button" class="btn95 yellow sm" id="btn-sol-new">새 카드 배분</button>
          </div>
        </div>

        <div style="background:#006432;border:2px solid #111;padding:8px;color:#fff;box-sizing:border-box;">
          <div class="gp-sol-top-grid">
            <button type="button" id="sol-stock" class="${animKey === 'stock' ? 'gp-anim-pop' : ''}" style="height:56px;min-width:0;border:2px solid #111;background:${stock.length ? '#000080' : 'rgba(255,255,255,0.15)'};color:#ffd83b;font-weight:900;font-size:0.75rem;cursor:pointer;">
              ${stock.length ? `DECK<br/>(${stock.length})` : '[RELOAD]'}
            </button>

            <div id="sol-waste" class="${animKey === 'waste' ? 'gp-anim-pop' : ''}" style="height:56px;min-width:0;border:2px solid ${selected && selected.zone === 'waste' ? '#ffd83b' : '#111'};background:${waste.length ? '#ffffff' : 'rgba(255,255,255,0.1)'};color:${waste.length ? waste[waste.length - 1].color : '#ccc'};display:flex;align-items:center;justify-content:center;font-weight:900;font-size:0.9rem;cursor:pointer;box-shadow:${selected && selected.zone === 'waste' ? '0 0 0 2px #ffd83b' : 'none'};transform:${selected && selected.zone === 'waste' ? 'translateY(-2px)' : 'none'};transition:transform 0.12s ease;">
              ${waste.length ? esc(waste[waste.length - 1].label) : 'WASTE'}
            </div>

            <div></div>

            ${SUITS.map(s => {
              const pile = foundations[s.key];
              const top = pile[pile.length - 1];
              const fAnim = animKey === `f:${s.key}` ? 'gp-anim-pop' : '';
              return `<button type="button" class="sol-found ${fAnim}" data-suit="${s.key}" style="height:56px;min-width:0;border:2px solid #111;background:${top ? '#ffffff' : 'rgba(255,255,255,0.15)'};color:${top ? top.color : '#ffd83b'};font-weight:900;font-size:0.86rem;cursor:pointer;">
                ${top ? esc(top.label) : `${s.symbol} A`}
              </button>`;
            }).join('')}
          </div>

          <div class="gp-sol-tab-grid">
            ${tableau.map((pile, colIdx) => `
              <div class="sol-col" data-col="${colIdx}" style="min-height:185px;min-width:0;border:1.5px dashed rgba(255,255,255,0.35);padding:2px;display:flex;flex-direction:column;gap:3px;box-sizing:border-box;">
                ${pile.length === 0 ? `<div style="height:44px;display:flex;align-items:center;justify-content:center;font-size:0.7rem;color:rgba(255,255,255,0.5);">[K]</div>` : ''}
                ${pile.map((card, cIdx) => {
                  const isSel = selected && selected.zone === 'tableau' && selected.col === colIdx && cIdx >= selected.idx;
                  const isLanded = animKey === `t:${colIdx}:${cIdx}`;
                  if (!card.faceUp) {
                    return `<div style="height:20px;background:#000080;border:1.5px solid #111;"></div>`;
                  }
                  return `<button type="button" class="sol-card gp-sol-card ${isLanded ? 'gp-anim-pop' : ''}" data-col="${colIdx}" data-cidx="${cIdx}" style="height:34px;min-width:0;border:2px solid ${isSel ? '#ffd83b' : '#111'};background:${isSel ? '#fff6bf' : '#ffffff'};color:${card.color};font-weight:900;font-size:0.82rem;text-align:left;padding:0 4px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transform:${isSel ? 'translateY(-2px)' : 'none'};">
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
        playTone('click');
        this.render({ stage, icons, playTone, esc });
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
            lastActionKey = `f:${c.suit}`;
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
              lastActionKey = `f:${c.suit}`;
            }
          }
        }
        if (movedAny) {
          selected = null;
          playTone('open');
          draw();
        } else {
          playTone('click');
        }
      });

      document.getElementById('sol-stock')?.addEventListener('click', () => {
        selected = null;
        if (stock.length > 0) {
          const drawn = stock.pop();
          drawn.faceUp = true;
          waste.push(drawn);
          lastActionKey = 'waste';
        } else if (waste.length > 0) {
          stock = waste.reverse().map(c => ({ ...c, faceUp: false }));
          waste = [];
          lastActionKey = 'stock';
        }
        moves++;
        playTone('click');
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
        playTone('click');
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
            lastActionKey = `f:${targetSuit}`;
            playTone('open');
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
                lastActionKey = `t:${col}:${tableau[col].length - 1}`;
              } else {
                const startLandIdx = tableau[col].length;
                const movedSlice = tableau[selected.col].splice(selected.idx);
                tableau[col].push(...movedSlice);
                revealTopTableau();
                lastActionKey = `t:${col}:${startLandIdx}`;
              }
              moves++;
              selected = null;
              playTone('click');
              draw();
              return;
            }
          }

          selected = { zone: 'tableau', col, idx: cIdx };
          playTone('click');
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
            lastActionKey = `t:${col}:0`;
            playTone('click');
            draw();
          }
        });
      });
    };

    draw();
  }
};

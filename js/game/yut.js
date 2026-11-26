// ============================================================
// GAMEPACK MODULE — 레트로 윷놀이 95 vs AI
// ============================================================

window.GamePackModules = window.GamePackModules || {};

window.GamePackModules.yut = {
  render({ stage, icons, playTone, esc, setCleanup }) {
    const NODE_META = {
      0: { label: '출발 대기', short: '대기', kind: 'start' },
      1: { label: '1칸(우)', short: '1', kind: 'outer' },
      2: { label: '2칸(우)', short: '2', kind: 'outer' },
      3: { label: '3칸(우)', short: '3', kind: 'outer' },
      4: { label: '4칸(우)', short: '4', kind: 'outer' },
      5: { label: '우상 모서리★', short: '5★', kind: 'corner' },
      6: { label: '6칸(상)', short: '6', kind: 'outer' },
      7: { label: '7칸(상)', short: '7', kind: 'outer' },
      8: { label: '8칸(상)', short: '8', kind: 'outer' },
      9: { label: '9칸(상)', short: '9', kind: 'outer' },
      10: { label: '좌상 모서리★', short: '10★', kind: 'corner' },
      11: { label: '11칸(좌)', short: '11', kind: 'outer' },
      12: { label: '12칸(좌)', short: '12', kind: 'outer' },
      13: { label: '13칸(좌)', short: '13', kind: 'outer' },
      14: { label: '14칸(좌)', short: '14', kind: 'outer' },
      15: { label: '좌하 모서리', short: '15', kind: 'corner' },
      16: { label: '16칸(하)', short: '16', kind: 'outer' },
      17: { label: '17칸(하)', short: '17', kind: 'outer' },
      18: { label: '18칸(하)', short: '18', kind: 'outer' },
      19: { label: '19칸(하)', short: '19', kind: 'outer' },
      20: { label: '출발·골인점', short: '출/골', kind: 'goal' },
      21: { label: '우상 지름길1', short: '우지1', kind: 'diag' },
      22: { label: '우상 지름길2', short: '우지2', kind: 'diag' },
      23: { label: '중앙 방★', short: '중앙★', kind: 'center' },
      24: { label: '중앙→좌하1', short: '중좌1', kind: 'diag' },
      25: { label: '중앙→좌하2', short: '중좌2', kind: 'diag' },
      26: { label: '좌상 지름길1', short: '좌지1', kind: 'diag' },
      27: { label: '좌상 지름길2', short: '좌지2', kind: 'diag' },
      28: { label: '중앙→골인1', short: '중골1', kind: 'diag' },
      29: { label: '중앙→골인2', short: '중골2', kind: 'diag' },
      GOAL: { label: '완주(GOAL)', short: '완주', kind: 'goal' }
    };

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
    let tossAnimFlag = false;
    let movedNodeId = null;

    const clearAiTimer = () => {
      if (aiTimerId) {
        clearTimeout(aiTimerId);
        aiTimerId = null;
      }
    };

    setCleanup(clearAiTimer);

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
      movedNodeId = destPos;

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
        playTone('fanfare');
        statusMsg = winner === 'player'
          ? '승리! 내 말 두 개가 모두 완주했습니다!'
          : '패배! AI가 먼저 두 말을 완주했습니다.';
        draw();
        return;
      }

      if (captured) {
        playTone('open');
        statusMsg = `${sideLabel}(${stackedText}) 상대 말 잡기 성공! 한 번 더 던지세요.`;
        if (side === 'ai') scheduleAiTurn();
        draw();
        return;
      }

      playTone(destPos === 'GOAL' ? 'open' : 'click');

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
        tossAnimFlag = true;
        lastThrowLabel = `${rolled.name} (+${rolled.steps})`;
        playTone('click');
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

    const renderNodeGraphic = (nodeId, kind) => {
      if (nodeId === 20) return icons.nodeGoal;
      if (kind === 'center' || kind === 'corner') return icons.nodeStar;
      return icons.nodeDot;
    };

    const draw = () => {
      ensureValidActiveToken();

      const pGoal = tokens.player.filter(p => p === 'GOAL').length;
      const aiGoal = tokens.ai.filter(p => p === 'GOAL').length;
      const canPlayerMove = Boolean(!winner && turn === 'player' && pendingThrow);

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
          return `<div style="min-height:54px;border:1px dashed rgba(90,65,30,0.22);background:rgba(255,248,225,0.22);display:flex;align-items:center;justify-content:center;">
            <span style="width:6px;height:6px;background:rgba(110,80,40,0.18);display:inline-block;"></span>
          </div>`;
        }

        const meta = NODE_META[nodeId];
        const pHere = tokens.player.map((pos, i) => (pos === nodeId ? `P${i + 1}` : null)).filter(Boolean);
        const aiHere = tokens.ai.map((pos, i) => (pos === nodeId ? `A${i + 1}` : null)).filter(Boolean);

        const isNormalTarget = normalDest === nodeId;
        const isShortcutTarget = shortcutDest === nodeId;
        const isTarget = isNormalTarget || isShortcutTarget;
        const isJustMoved = movedNodeId === nodeId;

        let bg = '#fffdf7';
        if (nodeId === 20) bg = '#dff7e3';
        else if (meta.kind === 'center') bg = '#ffe1f0';
        else if (meta.kind === 'corner') bg = '#fff1a8';
        else if (meta.kind === 'diag') bg = '#e0f3ff';

        if (isTarget) bg = '#b8ff9e';

        const targetHint = isTarget
          ? getActionBadgeForDest(isShortcutTarget ? shortcutDest : normalDest)
          : '';

        return `
          <button type="button"
            class="yut-board-cell ${isTarget ? 'gp-yut-target' : ''} ${isJustMoved ? 'gp-anim-pop' : ''}"
            data-node="${nodeId}"
            data-sc="${isShortcutTarget && !isNormalTarget ? '1' : '0'}"
            style="min-height:56px;min-width:0;width:100%;border:${isTarget ? '2.5px solid #d63031' : '1.5px solid #111'};background:${bg};padding:3px;display:flex;flex-direction:column;justify-content:space-between;align-items:stretch;cursor:${isTarget ? 'pointer' : 'default'};text-align:left;position:relative;box-sizing:border-box;">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:2px;min-width:0;">
              <span style="display:inline-flex;align-items:center;gap:2px;font-size:0.66rem;font-weight:900;color:#111;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                ${renderNodeGraphic(nodeId, meta.kind)}
                <span>${esc(meta.short)}</span>
              </span>
              ${targetHint ? `<span style="background:#d63031;color:#fff;font-size:0.6rem;font-weight:900;padding:0 3px;border:1px solid #111;flex-shrink:0;">${esc(targetHint)}</span>` : ''}
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:2px;min-height:18px;align-items:center;">
              ${pHere.length ? `<span style="display:inline-flex;align-items:center;gap:2px;background:#000080;color:#fff;font-size:0.64rem;font-weight:900;padding:1px 4px;border:1px solid #111;">${icons.tokenPlayer}${pHere.join('+')}</span>` : ''}
              ${aiHere.length ? `<span style="display:inline-flex;align-items:center;gap:2px;background:#d63031;color:#fff;font-size:0.64rem;font-weight:900;padding:1px 4px;border:1px solid #111;">${icons.tokenAi}${aiHere.join('+')}</span>` : ''}
              ${!pHere.length && !aiHere.length && isTarget ? `<span style="font-size:0.62rem;font-weight:900;color:#005a16;">도착점</span>` : ''}
            </div>
          </button>
        `;
      };

      const shouldToss = tossAnimFlag;
      tossAnimFlag = false;
      movedNodeId = null;

      stage.innerHTML = `
        <div class="box-head">
          <span>레트로 윷놀이 95 vs AI — 완주: 내 말 ${pGoal}/2 · AI ${aiGoal}/2</span>
          <button type="button" class="btn95 yellow sm" id="btn-yut-reset">새 판 시작</button>
        </div>

        <div style="background:#efe4c4;border:2px solid #111;padding:8px;color:#111;box-sizing:border-box;">
          <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;background:#fff;border:2px solid #111;padding:8px;margin-bottom:8px;">
            <div style="font-size:0.8rem;font-weight:900;min-width:0;flex:1;">${esc(statusMsg)}</div>
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <span class="tag-mini">${esc(lastThrowLabel)}</span>
              ${!winner && turn === 'player' && !pendingThrow
                ? `<button type="button" class="btn95 pink sm" id="btn-yut-throw">${icons.yutStick} 윷 던지기</button>`
                : ''}
            </div>
          </div>

          <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;background:#decb9c;border:2px solid #111;padding:6px;margin-bottom:8px;">
            ${sticks.map((isFlat, i) => `
              <div class="${shouldToss ? 'gp-anim-toss' : ''}" style="width:36px;height:52px;border:2px solid #111;background:${isFlat ? '#fff9e0' : '#c69563'};display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:3px 0;font-size:0.68rem;font-weight:900;box-shadow:2px 2px 0 rgba(0,0,0,0.22);">
                <span>${i + 1}</span>
                <span>${isFlat ? '배' : '등'}</span>
                <span>${isFlat ? '■' : '●'}</span>
              </div>
            `).join('')}
          </div>

          <div class="gp-yut-board">
            ${BOARD_GRID_LAYOUT.map(row => row.map(renderBoardCell).join('')).join('')}
          </div>

          <div class="gp-yut-footer-grid">
            <div style="background:#fff;border:2px solid #111;padding:8px;min-width:0;">
              <div style="font-size:0.75rem;font-weight:900;color:#000080;margin-bottom:6px;display:flex;align-items:center;gap:4px;">
                ${icons.tokenPlayer}<span>내 말 선택 & 이동 (초록색 도착 칸을 눌러도 이동 가능)</span>
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

            <div style="background:#fff;border:2px solid #111;padding:8px;min-width:0;">
              <div style="font-size:0.75rem;font-weight:900;color:#d63031;margin-bottom:6px;display:flex;align-items:center;gap:4px;">
                ${icons.tokenAi}<span>AI 말 위치</span>
              </div>
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
        playTone('click');
        this.render({ stage, icons, playTone, esc, setCleanup });
      });

      document.getElementById('btn-yut-throw')?.addEventListener('click', () => {
        if (winner || turn !== 'player' || pendingThrow) return;
        const rolled = rollYut();
        sticks = rolled.sticks;
        pendingThrow = rolled;
        tossAnimFlag = true;
        lastThrowLabel = `${rolled.name} (+${rolled.steps})`;
        playTone('click');

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
          playTone('click');
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
};

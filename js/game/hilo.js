// ============================================================
// GAMEPACK MODULE — 작품 별점 하이로우 (Star Rating Hi-Lo)
// ============================================================

window.GamePackModules = window.GamePackModules || {};

window.GamePackModules.hilo = {
  render({ stage, icons, playTone, getArchivePool, esc }) {
    const pool = getArchivePool();

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
        <div class="gp-hilo-grid">
          <div class="sunken-box gp-anim-pop" style="text-align:center;background:#fff6bf;min-width:0;">
            <div style="font-size:0.75rem;font-weight:800;">[기준 작품]</div>
            <div style="font-size:0.95rem;font-weight:900;margin:4px 0;word-break:break-word;">${esc(leftItem.title)}</div>
            <div style="font-size:0.75rem;color:#555;margin-bottom:6px;word-break:break-word;">${esc(leftItem.creator)}</div>
            <div style="font-size:1.15rem;font-weight:900;color:#d63031;display:flex;align-items:center;justify-content:center;gap:4px;">
              ${icons.star}<span>${leftItem.rating}점</span>
            </div>
          </div>
          <div class="sunken-box ${revealed ? 'gp-anim-pop' : ''}" style="text-align:center;background:#e8f8ff;min-width:0;">
            <div style="font-size:0.75rem;font-weight:800;">[도전 작품]</div>
            <div style="font-size:0.95rem;font-weight:900;margin:4px 0;word-break:break-word;">${esc(rightItem.title)}</div>
            <div style="font-size:0.75rem;color:#555;margin-bottom:6px;word-break:break-word;">${esc(rightItem.creator)}</div>
            <div style="font-size:1.15rem;font-weight:900;color:#000080;display:flex;align-items:center;justify-content:center;gap:4px;">
              ${icons.star}<span>${revealed ? `${rightItem.rating}점` : '?점'}</span>
            </div>
          </div>
        </div>
        <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;">
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
          playTone('fanfare');
        } else {
          streak = 0;
          feedback = `[오답] 「${rightItem.title}」의 평점은 ${rightItem.rating}점으로 더 낮았습니다.`;
          playTone('boom');
        }
        draw();
      });

      document.getElementById('btn-hilo-down')?.addEventListener('click', () => {
        revealed = true;
        if (Number(rightItem.rating) < Number(leftItem.rating)) {
          streak++;
          feedback = `[정답] 「${rightItem.title}」의 평점은 ${rightItem.rating}점입니다.`;
          playTone('fanfare');
        } else {
          streak = 0;
          feedback = `[오답] 「${rightItem.title}」의 평점은 ${rightItem.rating}점으로 더 높거나 같았습니다.`;
          playTone('boom');
        }
        draw();
      });

      document.getElementById('btn-hilo-next')?.addEventListener('click', () => {
        [leftItem, rightItem] = pickPair();
        revealed = false;
        feedback = '오른쪽 작품의 평점이 왼쪽 작품보다 높거나 같을지 맞추어 보십시오.';
        playTone('click');
        draw();
      });
    };

    draw();
  }
};

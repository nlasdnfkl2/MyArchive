// ============================================================
// MY-ARCHIVE 95 OS — Retro Print Preview Utility (PRINT95.EXE)
// ============================================================

(function () {
  window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
  window.__MOD_VERSIONS.print95 = 'v2026.11.26-print95-v1';

  const STYLE_ID = 'myarchive95-print95-style';

  function escHtml(v) {
    if (typeof esc === 'function') return esc(v);
    return String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function tone(type) {
    if (typeof playRetroTone === 'function') {
      try { playRetroTone(type); } catch {}
    }
  }

  function getArchiveItems() {
    if (typeof getMyVisibleArchiveItems === 'function') {
      const res = getMyVisibleArchiveItems();
      if (Array.isArray(res)) return res;
    }
    if (Array.isArray(window.archiveItems)) return window.archiveItems;
    return [];
  }

  function normalizeItem(item, idx) {
    const raw = item && typeof item === 'object' ? item : {};
    return {
      id: raw.id || `item-${idx + 1}`,
      title: String(raw.title || raw.name || `무제 기록 #${idx + 1}`),
      category: String(raw.category || raw.type || raw.media || '기록'),
      rating: raw.rating ?? raw.score ?? raw.star ?? '-',
      date: String(raw.date || raw.createdAt || raw.updatedAt || '').slice(0, 10),
      note: String(raw.note || raw.review || raw.memo || raw.summary || '')
    };
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const parent = document.head || document.documentElement;
    if (!parent) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .p95-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        align-items: center;
        margin-bottom: 10px;
      }
      .p95-controls {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 8px;
        margin-bottom: 10px;
      }
      .p95-paper-wrap {
        background: #666666;
        padding: 12px;
        border: 2px solid #111111;
        max-height: 360px;
        overflow-y: auto;
      }
      .p95-paper {
        background: #fffef7;
        color: #111111;
        border: 2px solid #111111;
        box-shadow: 4px 4px 0 #111111;
        padding: 14px;
        font-family: var(--font-mono, Consolas, 'Courier New', monospace);
      }
      .p95-paper.mode-receipt {
        max-width: 320px;
        margin: 0 auto;
        border-style: dashed;
        box-shadow: none;
        font-size: 0.76rem;
      }
      .p95-paper.mode-card {
        max-width: 440px;
        margin: 0 auto;
        background: #fffdf0;
      }
      .p95-sheet-head {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        border-bottom: 2px solid #111111;
        padding-bottom: 6px;
        margin-bottom: 10px;
        font-size: 0.78rem;
        font-weight: 900;
      }
      .p95-entry {
        border-bottom: 1px dashed #888888;
        padding: 7px 0;
      }
      .p95-entry:last-child {
        border-bottom: none;
      }
      @media print {
        body > *:not(#print95-print-portal) {
          display: none !important;
        }
        #print95-print-portal {
          display: block !important;
          position: static !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        #print95-print-portal .p95-paper {
          max-width: 100% !important;
          box-shadow: none !important;
          border: 1px solid #000000 !important;
        }
      }
    `;
    parent.appendChild(style);
  }

  function buildPlainText(items, mode, titleText) {
    const lines = [
      `========================================`,
      `MY-ARCHIVE 95 OS // ${titleText}`,
      `MODE: ${mode.toUpperCase()} | ITEMS: ${items.length}`,
      `========================================`
    ];
    items.forEach((it, i) => {
      lines.push(`${i + 1}. [${it.category}] ${it.title} (★ ${it.rating})${it.date ? ` — ${it.date}` : ''}`);
      if (it.note) lines.push(`   ${it.note}`);
    });
    return lines.join('\n');
  }

  function triggerPrintSheet(paperHtml) {
    let portal = document.getElementById('print95-print-portal');
    if (!portal) {
      portal = document.createElement('div');
      portal.id = 'print95-print-portal';
      document.body.appendChild(portal);
    }
    portal.innerHTML = paperHtml;
    tone('click');
    setTimeout(() => {
      try {
        window.print();
      } catch {}
    }, 60);
  }

  function renderPrint95(container) {
    if (!container) return;
    ensureStyle();

    const rawList = getArchiveItems().map(normalizeItem);
    const categories = Array.from(new Set(rawList.map(x => x.category).filter(Boolean)));

    let selectedCat = 'ALL';
    let selectedMode = 'a4'; // 'a4' | 'card' | 'receipt'
    let limitCount = 15;

    function getFiltered() {
      const filtered = selectedCat === 'ALL'
        ? rawList
        : rawList.filter(x => x.category === selectedCat);
      return filtered.slice(0, limitCount);
    }

    function paint() {
      const items = getFiltered();
      const sheetTitle = selectedMode === 'receipt'
        ? 'DOT-MATRIX RECEIPT LOG'
        : selectedMode === 'card'
          ? 'ARCHIVE INDEX CARD'
          : 'A4 ARCHIVE PRINT SHEET';

      const paperHtml = `
        <div class="p95-paper mode-${escHtml(selectedMode)}">
          <div class="p95-sheet-head">
            <span>${escHtml(sheetTitle)}</span>
            <span>${new Date().toISOString().slice(0, 10)}</span>
          </div>
          ${items.length === 0
            ? `<div style="padding:18px;text-align:center;font-weight:800;">인쇄할 감상 기록이 없습니다.</div>`
            : items.map(it => `
              <div class="p95-entry">
                <div style="font-weight:900;font-size:0.84rem;">
                  [${escHtml(it.category)}] ${escHtml(it.title)}
                  <span style="float:right;">★ ${escHtml(it.rating)}</span>
                </div>
                ${it.date ? `<div style="font-size:0.7rem;color:#555555;">DATE: ${escHtml(it.date)}</div>` : ''}
                ${it.note ? `<div style="margin-top:4px;font-size:0.76rem;line-height:1.45;white-space:pre-wrap;">${escHtml(it.note)}</div>` : ''}
              </div>
            `).join('')
          }
        </div>
      `;

      container.innerHTML = `
        <div class="p95-toolbar">
          <button type="button" class="btn95 sm yellow" id="p95-btn-print">인쇄하기 (PRINT)</button>
          <button type="button" class="btn95 sm sky" id="p95-btn-copy">텍스트 복사</button>
          <button type="button" class="btn95 sm" id="p95-btn-refresh">목록 새로고침</button>
          <span id="p95-status" style="font-size:0.75rem;font-weight:800;margin-left:auto;">표시 중: ${items.length}건</span>
        </div>

        <div class="p95-controls">
          <div>
            <label style="display:block;font-size:0.72rem;font-weight:800;margin-bottom:3px;">양식 모드</label>
            <select id="p95-mode" class="win95-input" style="width:100%;">
              <option value="a4" ${selectedMode === 'a4' ? 'selected' : ''}>A4 감상 시트</option>
              <option value="card" ${selectedMode === 'card' ? 'selected' : ''}>인덱스 카드</option>
              <option value="receipt" ${selectedMode === 'receipt' ? 'selected' : ''}>도트 영수증</option>
            </select>
          </div>
          <div>
            <label style="display:block;font-size:0.72rem;font-weight:800;margin-bottom:3px;">분류 필터</label>
            <select id="p95-cat" class="win95-input" style="width:100%;">
              <option value="ALL" ${selectedCat === 'ALL' ? 'selected' : ''}>전체 (${rawList.length})</option>
              ${categories.map(c => `<option value="${escHtml(c)}" ${selectedCat === c ? 'selected' : ''}>${escHtml(c)}</option>`).join('')}
            </select>
          </div>
          <div>
            <label style="display:block;font-size:0.72rem;font-weight:800;margin-bottom:3px;">출력 건수</label>
            <select id="p95-limit" class="win95-input" style="width:100%;">
              <option value="5" ${limitCount === 5 ? 'selected' : ''}>최근 5건</option>
              <option value="15" ${limitCount === 15 ? 'selected' : ''}>최근 15건</option>
              <option value="30" ${limitCount === 30 ? 'selected' : ''}>최근 30건</option>
            </select>
          </div>
        </div>

        <div class="p95-paper-wrap">${paperHtml}</div>
      `;

      container.querySelector('#p95-mode')?.addEventListener('change', e => {
        selectedMode = e.target.value;
        tone('click');
        paint();
      });
      container.querySelector('#p95-cat')?.addEventListener('change', e => {
        selectedCat = e.target.value;
        tone('click');
        paint();
      });
      container.querySelector('#p95-limit')?.addEventListener('change', e => {
        limitCount = Number(e.target.value) || 15;
        tone('click');
        paint();
      });
      container.querySelector('#p95-btn-refresh')?.addEventListener('click', () => {
        tone('click');
        renderPrint95(container);
      });
      container.querySelector('#p95-btn-print')?.addEventListener('click', () => {
        triggerPrintSheet(paperHtml);
      });
      container.querySelector('#p95-btn-copy')?.addEventListener('click', async () => {
        const plain = buildPlainText(items, selectedMode, sheetTitle);
        const statusEl = container.querySelector('#p95-status');
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(plain);
          }
          tone('click');
          if (statusEl) statusEl.textContent = '클립보드에 복사 완료!';
        } catch {
          if (statusEl) statusEl.textContent = '복사 권한을 확인해 주세요.';
        }
      });
    }

    paint();
  }

  function openPrint95Window() {
    const winId = 'win-print95';
    let winEl = document.getElementById(winId);
    if (!winEl) {
      winEl = document.createElement('div');
      winEl.id = winId;
      winEl.className = 'floating-win';
      winEl.dataset.winTitle = 'PRINT95.EXE — 레트로 인쇄 미리보기';
      winEl.dataset.dynamic = 'true';
      winEl.style.cssText = 'width:min(620px, calc(100vw - 16px)); left:90px; top:68px;';
      winEl.innerHTML = `
        <div class="win-titlebar draggable">
          <div class="win-title-left"><span>PRINT95.EXE — 레트로 인쇄 미리보기</span></div>
          <div class="win-ctrl-btns">
            <button type="button" class="win-ctrl-btn" data-action="minimize" data-target="${winId}" title="최소화">_</button>
            <button type="button" class="win-ctrl-btn" data-action="close" data-target="${winId}" title="닫기">X</button>
          </div>
        </div>
        <div class="win-body" style="padding:10px;"><div id="print95-stage"></div></div>
      `;
      (document.getElementById('dynamic-windows-container') || document.body).appendChild(winEl);
      if (typeof enableWindowDrag === 'function') enableWindowDrag(winEl);
    }

    if (typeof openWindow === 'function') openWindow(winId);
    else {
      winEl.classList.add('open');
      winEl.style.display = 'flex';
    }
    renderPrint95(document.getElementById('print95-stage'));
  }

  window.Print95App = {
    render: renderPrint95,
    open: openPrint95Window
  };
  window.openPrint95Window = openPrint95Window;
})();

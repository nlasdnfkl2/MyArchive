// ============================================================
// MY-ARCHIVE 95 OS — Retro Recycle Bin Utility (RECYCLE.BIN)
// ============================================================

(function () {
  window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
  window.__MOD_VERSIONS.recycleBin = 'v2026.11.26-recycle-bin-v1';

  const STORAGE_KEY = 'myarchive95_recycle_bin_v1';
  const STYLE_ID = 'myarchive95-recycle-bin-style';

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

  function loadBin() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveBin(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {}
    window.dispatchEvent(new CustomEvent('recyclebin:changed', { detail: { count: list.length } }));
  }

  function moveToRecycleBin(item) {
    const list = loadBin();
    const entry = {
      binId: `bin-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      deletedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      payload: item && typeof item === 'object' ? { ...item } : { title: String(item ?? '항목') }
    };
    list.unshift(entry);
    saveBin(list);
    tone('click');
    return entry;
  }

  function restoreFromRecycleBin(binId) {
    const list = loadBin();
    const idx = list.findIndex(x => x.binId === binId);
    if (idx === -1) return null;
    const [removed] = list.splice(idx, 1);
    saveBin(list);

    if (removed && removed.payload) {
      if (Array.isArray(window.archiveItems)) {
        window.archiveItems.unshift(removed.payload);
      }
      window.dispatchEvent(new CustomEvent('recyclebin:restore', { detail: { item: removed.payload } }));
    }
    tone('open');
    return removed.payload;
  }

  function deletePermanently(binId) {
    const next = loadBin().filter(x => x.binId !== binId);
    saveBin(next);
    tone('close');
  }

  function emptyRecycleBin() {
    saveBin([]);
    tone('boom');
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const parent = document.head || document.documentElement;
    if (!parent) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .rb-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        align-items: center;
        margin-bottom: 10px;
      }
      .rb-list {
        background: #ffffff;
        color: #111111;
        border: 2px inset #808080;
        max-height: 280px;
        overflow-y: auto;
      }
      .rb-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 8px 10px;
        border-bottom: 1px solid #d4d4d4;
        flex-wrap: wrap;
      }
      .rb-row:last-child {
        border-bottom: none;
      }
      .rb-title {
        font-weight: 900;
        font-size: 0.82rem;
      }
      .rb-meta {
        font-size: 0.7rem;
        color: #555555;
        font-family: var(--font-mono, Consolas, monospace);
      }
      .rb-actions {
        display: flex;
        gap: 4px;
      }
    `;
    parent.appendChild(style);
  }

  function renderRecycleBin(container) {
    if (!container) return;
    ensureStyle();

    const list = loadBin();

    container.innerHTML = `
      <div class="rb-toolbar">
        <button type="button" class="btn95 sm pink" id="rb-btn-empty" ${list.length === 0 ? 'disabled' : ''}>휴지통 비우기</button>
        <button type="button" class="btn95 sm" id="rb-btn-demo">+ 테스트 항목 넣기</button>
        <span style="margin-left:auto;font-size:0.75rem;font-weight:800;">보관 중: ${list.length}개</span>
      </div>

      <div class="rb-list">
        ${list.length === 0
          ? `<div style="padding:24px;text-align:center;color:#555555;font-size:0.8rem;font-weight:800;">휴지통이 비어 있습니다.</div>`
          : list.map(entry => {
            const p = entry.payload || {};
            const title = p.title || p.name || '이름 없는 기록';
            const cat = p.category || p.type || '기록';
            return `
              <div class="rb-row" data-bin-id="${escHtml(entry.binId)}">
                <div style="min-width:0;flex:1;">
                  <div class="rb-title">[${escHtml(cat)}] ${escHtml(title)}</div>
                  <div class="rb-meta">삭제 시각: ${escHtml(entry.deletedAt)}</div>
                </div>
                <div class="rb-actions">
                  <button type="button" class="btn95 sm green" data-rb-restore="${escHtml(entry.binId)}">복원</button>
                  <button type="button" class="btn95 sm" data-rb-del="${escHtml(entry.binId)}">영구 삭제</button>
                </div>
              </div>
            `;
          }).join('')
        }
      </div>
    `;

    container.querySelector('#rb-btn-empty')?.addEventListener('click', () => {
      emptyRecycleBin();
      renderRecycleBin(container);
    });

    container.querySelector('#rb-btn-demo')?.addEventListener('click', () => {
      moveToRecycleBin({
        title: `임시 감상 메모 #${Math.floor(Math.random() * 90 + 10)}`,
        category: '메모',
        note: '휴지통 테스트용 임시 데이터'
      });
      renderRecycleBin(container);
    });

    container.querySelectorAll('[data-rb-restore]').forEach(btn => {
      btn.addEventListener('click', () => {
        restoreFromRecycleBin(btn.dataset.rbRestore);
        renderRecycleBin(container);
      });
    });

    container.querySelectorAll('[data-rb-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        deletePermanently(btn.dataset.rbDel);
        renderRecycleBin(container);
      });
    });
  }

  function openRecycleBinWindow() {
    const winId = 'win-recycle-bin';
    let winEl = document.getElementById(winId);
    if (!winEl) {
      winEl = document.createElement('div');
      winEl.id = winId;
      winEl.className = 'floating-win';
      winEl.dataset.winTitle = 'RECYCLE.BIN — 휴지통';
      winEl.dataset.dynamic = 'true';
      winEl.style.cssText = 'width:min(520px, calc(100vw - 16px)); left:110px; top:84px;';
      winEl.innerHTML = `
        <div class="win-titlebar draggable">
          <div class="win-title-left"><span>RECYCLE.BIN — 휴지통</span></div>
          <div class="win-ctrl-btns">
            <button type="button" class="win-ctrl-btn" data-action="minimize" data-target="${winId}" title="최소화">_</button>
            <button type="button" class="win-ctrl-btn" data-action="close" data-target="${winId}" title="닫기">X</button>
          </div>
        </div>
        <div class="win-body" style="padding:10px;"><div id="recycle-bin-stage"></div></div>
      `;
      (document.getElementById('dynamic-windows-container') || document.body).appendChild(winEl);
      if (typeof enableWindowDrag === 'function') enableWindowDrag(winEl);
    }

    if (typeof openWindow === 'function') openWindow(winId);
    else {
      winEl.classList.add('open');
      winEl.style.display = 'flex';
    }
    renderRecycleBin(document.getElementById('recycle-bin-stage'));
  }

  window.RecycleBinApp = {
    render: renderRecycleBin,
    open: openRecycleBinWindow,
    moveToBin: moveToRecycleBin,
    restore: restoreFromRecycleBin,
    deletePermanent: deletePermanently,
    empty: emptyRecycleBin,
    getItems: loadBin
  };
  window.openRecycleBinWindow = openRecycleBinWindow;
})();

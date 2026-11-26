// ============================================================
// MY-ARCHIVE 95 OS — Retro Recycle Bin Utility (RECYCLE.BIN)
// (Public Read/Restore, Anonymous Deletion Meta, 30-Day Auto Expiry, Admin Delete, GAS Sync)
// ============================================================

(function () {
  window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
  window.__MOD_VERSIONS.recycleBin = 'v2026.11.26-recycle-bin-v3';

  const DEFAULT_GAS_URL =
    'https://script.google.com/macros/s/AKfycbwH-hzWi2Z3_oTFt0PWBhzYMP10VEx4e-32E9EW7d5SMF2k_bwxQL0_3ONaQ8Ze3sdKUQ/exec';
  const STORAGE_KEY = 'myarchive95_recycle_bin_v1';
  const ADMIN_FLAG_KEY = 'myarchive95_recycle_admin_v1';
  const STYLE_ID = 'myarchive95-recycle-bin-style';
  const RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30일

  function getGasUrl() {
    if (typeof APPS_SCRIPT_URL === 'string' && APPS_SCRIPT_URL.trim()) {
      return APPS_SCRIPT_URL.trim();
    }
    if (typeof window.APPS_SCRIPT_URL === 'string' && window.APPS_SCRIPT_URL.trim()) {
      return window.APPS_SCRIPT_URL.trim();
    }
    return DEFAULT_GAS_URL;
  }

  function getRequesterName() {
    try {
      if (window.currentUser && window.currentUser.username) {
        return String(window.currentUser.username).trim();
      }
      if (window.activeUser && window.activeUser.username) {
        return String(window.activeUser.username).trim();
      }
    } catch {}
    return '';
  }

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

  function isAdminUser() {
    try {
      if (window.isAdmin === true || window.__MYARCHIVE_ADMIN__ === true) return true;
      if (window.currentUser && ['admin', 'owner'].includes(String(window.currentUser.role || '').toLowerCase())) {
        return true;
      }
      if (localStorage.getItem(ADMIN_FLAG_KEY) === '1') return true;
    } catch {}
    return false;
  }

  function setAdminUser(enabled) {
    try {
      if (enabled) localStorage.setItem(ADMIN_FLAG_KEY, '1');
      else localStorage.removeItem(ADMIN_FLAG_KEY);
    } catch {}
    tone('click');
  }

  // 삭제자 정보를 제거하고 순수 payload만 추출
  function sanitizePayload(item) {
    if (!item || typeof item !== 'object') {
      return { title: String(item ?? '항목') };
    }
    const forbiddenKeys = new Set([
      'deletedBy', 'deleted_by', 'actor', 'user', 'userId', 'user_id',
      'author', 'email', 'ip', 'operator', 'ownerId', 'owner_id'
    ]);
    const clean = {};
    Object.keys(item).forEach(k => {
      if (!forbiddenKeys.has(k)) {
        clean[k] = item[k];
      }
    });
    return clean;
  }

  function parseDateMs(val) {
    if (Number.isFinite(Number(val)) && Number(val) > 0) return Number(val);
    if (!val) return NaN;
    const str = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(:\d{2})?$/.test(str)) {
      const ms = Date.parse(str.replace(' ', 'T') + '+09:00');
      if (Number.isFinite(ms)) return ms;
    }
    return Date.parse(str);
  }

  function normalizeEntry(entry, nowMs = Date.now()) {
    if (!entry || typeof entry !== 'object') return null;
    const deletedMs = parseDateMs(entry.deletedAtMs ?? entry.deletedAt);
    const baseMs = Number.isFinite(deletedMs) ? deletedMs : nowMs;
    if (nowMs - baseMs >= RETENTION_MS) return null;
    return {
      binId: String(entry.binId || entry.id || `bin-${baseMs}-${Math.random().toString(36).slice(2, 7)}`),
      deletedAtMs: baseMs,
      deletedAt: new Date(baseMs).toISOString().replace('T', ' ').slice(0, 19),
      payload: sanitizePayload(entry.payload || entry)
    };
  }

  function pruneExpired(list, nowMs = Date.now()) {
    const valid = [];
    let removedAny = false;
    (Array.isArray(list) ? list : []).forEach(entry => {
      const norm = normalizeEntry(entry, nowMs);
      if (!norm) {
        removedAny = true;
        return;
      }
      valid.push(norm);
    });
    return { valid, removedAny };
  }

  function loadBin() {
    const nowMs = Date.now();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const { valid, removedAny } = pruneExpired(parsed, nowMs);
      if (removedAny) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(valid)); } catch {}
      }
      return valid;
    } catch {
      return [];
    }
  }

  function saveBin(list) {
    const { valid } = pruneExpired(list, Date.now());
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
    } catch {}
    window.dispatchEvent(new CustomEvent('recyclebin:changed', { detail: { count: valid.length } }));
    return valid;
  }

  async function postToGas(payload) {
    const url = getGasUrl();
    if (!url) return null;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  }

  async function syncFromCloud() {
    const url = getGasUrl();
    if (!url) return loadBin();
    try {
      const sep = url.includes('?') ? '&' : '?';
      const res = await fetch(`${url}${sep}action=recycle_bin&_=${Date.now()}`);
      const data = await res.json();
      if (data && data.status === 'success' && Array.isArray(data.items)) {
        const nowMs = Date.now();
        const remoteNorm = data.items
          .map(it => normalizeEntry({
            binId: it.id || it.binId,
            deletedAtMs: parseDateMs(it.deletedAt),
            deletedAt: it.deletedAt,
            payload: it.payload || it
          }, nowMs))
          .filter(Boolean);

        const localList = loadBin();
        const mergedMap = new Map();
        remoteNorm.forEach(item => mergedMap.set(item.binId, item));
        localList.forEach(item => {
          if (!mergedMap.has(item.binId)) mergedMap.set(item.binId, item);
        });

        const merged = Array.from(mergedMap.values()).sort((a, b) => b.deletedAtMs - a.deletedAtMs);
        saveBin(merged);
        return merged;
      }
    } catch {}
    return loadBin();
  }

  function moveToRecycleBin(item) {
    const nowMs = Date.now();
    const list = loadBin();
    const entry = {
      binId: `bin-${nowMs}-${Math.random().toString(36).slice(2, 7)}`,
      deletedAtMs: nowMs,
      deletedAt: new Date(nowMs).toISOString().replace('T', ' ').slice(0, 19),
      payload: sanitizePayload(item)
    };
    list.unshift(entry);
    saveBin(list);
    tone('click');

    postToGas({
      action: 'move_to_recycle_bin',
      item: {
        ...entry.payload,
        id: entry.binId
      }
    }).catch(() => {});

    return entry;
  }

  function restoreFromRecycleBin(binId) {
    const list = loadBin();
    const idx = list.findIndex(x => x.binId === binId);
    const removed = idx !== -1 ? list.splice(idx, 1)[0] : null;
    if (idx !== -1) {
      saveBin(list);
      if (removed && removed.payload) {
        if (Array.isArray(window.archiveItems)) {
          window.archiveItems.unshift(removed.payload);
        }
        window.dispatchEvent(new CustomEvent('recyclebin:restore', { detail: { item: removed.payload } }));
      }
      tone('open');
    }

    postToGas({
      action: 'restore_recycle_bin',
      id: binId
    }).catch(() => {});

    return removed ? removed.payload : null;
  }

  function deletePermanently(binId) {
    if (!isAdminUser()) return false;
    const next = loadBin().filter(x => x.binId !== binId);
    saveBin(next);
    tone('close');

    postToGas({
      action: 'delete_recycle_bin_permanent',
      id: binId,
      requester: getRequesterName() || '문태양'
    }).catch(() => {});

    return true;
  }

  function emptyRecycleBin() {
    if (!isAdminUser()) return false;
    saveBin([]);
    tone('boom');

    postToGas({
      action: 'empty_recycle_bin',
      requester: getRequesterName() || '문태양'
    }).catch(() => {});

    return true;
  }

  function formatRemainingDays(deletedAtMs, nowMs = Date.now()) {
    const elapsed = Math.max(0, nowMs - Number(deletedAtMs || nowMs));
    const remainMs = Math.max(0, RETENTION_MS - elapsed);
    const days = Math.ceil(remainMs / (24 * 60 * 60 * 1000));
    return days <= 1 ? '오늘 자동 삭제 예정' : `${days}일 후 자동 삭제`;
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
        margin-bottom: 8px;
      }
      .rb-notice {
        background: #fffef5;
        color: #111111;
        border: 1.5px solid #111111;
        padding: 6px 8px;
        font-size: 0.72rem;
        font-weight: 700;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-wrap: wrap;
      }
      .rb-list {
        background: #ffffff;
        color: #111111;
        border: 2px inset #808080;
        max-height: 270px;
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
    const admin = isAdminUser();
    const nowMs = Date.now();

    container.innerHTML = `
      <div class="rb-toolbar">
        <button type="button" class="btn95 sm pink" id="rb-btn-empty" ${(list.length === 0 || !admin) ? 'disabled' : ''}>휴지통 비우기</button>
        <button type="button" class="btn95 sm" id="rb-btn-demo">+ 테스트 항목 넣기</button>
        <button type="button" class="btn95 sm" id="rb-btn-sync">시트 동기화</button>
        <span style="margin-left:auto;font-size:0.75rem;font-weight:800;">보관 중: ${list.length}개 (30일 보관)</span>
      </div>

      <div class="rb-notice">
        <span>누구나 삭제된 기록을 확인·복원할 수 있으며, 삭제자 정보는 기록되지 않습니다. 영구 삭제는 관리자 또는 30일 경과 시 자동 처리됩니다.</span>
        <label style="display:inline-flex;align-items:center;gap:4px;cursor:pointer;font-weight:900;">
          <input type="checkbox" id="rb-admin-toggle" ${admin ? 'checked' : ''} />
          <span>관리자 모드</span>
        </label>
      </div>

      <div id="rb-feedback" style="font-size:0.72rem;font-weight:800;color:#b30000;margin-bottom:6px;display:none;"></div>

      <div class="rb-list">
        ${list.length === 0
          ? `<div style="padding:24px;text-align:center;color:#555555;font-size:0.8rem;font-weight:800;">휴지통이 비어 있습니다.</div>`
          : list.map(entry => {
            const p = entry.payload || {};
            const title = p.title || p.name || '이름 없는 기록';
            const cat = p.category || p.type || '기록';
            const remainText = formatRemainingDays(entry.deletedAtMs, nowMs);
            return `
              <div class="rb-row" data-bin-id="${escHtml(entry.binId)}">
                <div style="min-width:0;flex:1;">
                  <div class="rb-title">[${escHtml(cat)}]${escHtml(title)}</div>
                  <div class="rb-meta">삭제 시각: ${escHtml(entry.deletedAt)} ·${escHtml(remainText)}</div>
                </div>
                <div class="rb-actions">
                  <button type="button" class="btn95 sm green" data-rb-restore="${escHtml(entry.binId)}">복원</button>
                  <button type="button" class="btn95 sm" data-rb-del="${escHtml(entry.binId)}" ${!admin ? 'disabled title="관리자만 영구 삭제 가능"' : ''}>영구 삭제</button>
                </div>
              </div>
            `;
          }).join('')
        }
      </div>
    `;

    const showFeedback = (msg, ok = false) => {
      const fb = container.querySelector('#rb-feedback');
      if (!fb) return;
      fb.textContent = msg;
      fb.style.color = ok ? '#006600' : '#b30000';
      fb.style.display = msg ? 'block' : 'none';
    };

    container.querySelector('#rb-admin-toggle')?.addEventListener('change', e => {
      setAdminUser(Boolean(e.target.checked));
      renderRecycleBin(container);
    });

    container.querySelector('#rb-btn-empty')?.addEventListener('click', () => {
      if (!emptyRecycleBin()) {
        showFeedback('관리자 모드에서만 휴지통을 비울 수 있습니다.');
        return;
      }
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

    container.querySelector('#rb-btn-sync')?.addEventListener('click', async () => {
      showFeedback('Google Sheets 휴지통 동기화 중...', true);
      await syncFromCloud();
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
        if (!deletePermanently(btn.dataset.rbDel)) {
          showFeedback('관리자 모드에서만 영구 삭제할 수 있습니다.');
          return;
        }
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
      winEl.style.cssText = 'width:min(540px, calc(100vw - 16px)); left:110px; top:84px;';
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
    const stage = document.getElementById('recycle-bin-stage');
    renderRecycleBin(stage);
    syncFromCloud().then(() => {
      const currentStage = document.getElementById('recycle-bin-stage');
      if (currentStage) renderRecycleBin(currentStage);
    });
  }

  window.RecycleBinApp = {
    render: renderRecycleBin,
    open: openRecycleBinWindow,
    moveToBin: moveToRecycleBin,
    restore: restoreFromRecycleBin,
    deletePermanent: deletePermanently,
    empty: emptyRecycleBin,
    sync: syncFromCloud,
    getItems: loadBin,
    isAdmin: isAdminUser,
    setAdmin: setAdminUser
  };
  window.openRecycleBinWindow = openRecycleBinWindow;
})();

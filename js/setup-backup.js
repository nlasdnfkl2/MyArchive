// ============================================================
// MY-ARCHIVE 95 OS — Data Backup Wizard (SETUP.EXE)
// ============================================================

(function () {
  window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
  window.__MOD_VERSIONS.setupBackup = 'v2026.11.26-setup-backup-v1';

  const STYLE_ID = 'myarchive95-setup-backup-style';

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

  function collectArchiveData() {
    if (typeof getMyVisibleArchiveItems === 'function') {
      const res = getMyVisibleArchiveItems();
      if (Array.isArray(res)) return res;
    }
    if (Array.isArray(window.archiveItems)) return window.archiveItems;
    return [];
  }

  function collectLocalSnapshot() {
    const snap = {};
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (k.startsWith('myarchive95') || k.startsWith('archive') || k.includes('95')) {
          snap[k] = localStorage.getItem(k);
        }
      }
    } catch {}
    return snap;
  }

  function toCsv(items) {
    const rows = [['index', 'category', 'title', 'rating', 'date', 'note']];
    items.forEach((raw, idx) => {
      const it = raw && typeof raw === 'object' ? raw : {};
      const cols = [
        idx + 1,
        it.category || it.type || '',
        it.title || it.name || '',
        it.rating ?? it.score ?? '',
        it.date || it.createdAt || '',
        String(it.note || it.review || it.memo || '').replace(/\r?\n/g, ' ')
      ].map(val => `"${String(val ?? '').replace(/"/g, '""')}"`);
      rows.push(cols.join(','));
    });
    return '\uFEFF' + rows.join('\n');
  }

  function toMarkdown(items) {
    const lines = [
      `# MY-ARCHIVE 95 백업 로그`,
      ``,
      `- 생성일시: ${new Date().toLocaleString('ko-KR')}`,
      `- 총 기록 수: ${items.length}건`,
      ``
    ];
    items.forEach((raw, i) => {
      const it = raw && typeof raw === 'object' ? raw : {};
      const title = it.title || it.name || `기록 #${i + 1}`;
      const cat = it.category || it.type || '기타';
      const rating = it.rating ?? it.score ?? '-';
      lines.push(`## ${i + 1}. ${title}`);
      lines.push(`- 분류: ${cat} | 평점: ${rating}`);
      const note = it.note || it.review || it.memo || '';
      if (note) lines.push(``, String(note));
      lines.push(``);
    });
    return lines.join('\n');
  }

  function buildBackupPayload(format, includePrefs) {
    const items = collectArchiveData();
    const stamp = new Date().toISOString().slice(0, 10);

    if (format === 'csv') {
      return {
        filename: `my-archive-95-backup-${stamp}.csv`,
        mime: 'text/csv;charset=utf-8;',
        content: toCsv(items)
      };
    }

    if (format === 'md') {
      return {
        filename: `my-archive-95-backup-${stamp}.md`,
        mime: 'text/markdown;charset=utf-8;',
        content: toMarkdown(items)
      };
    }

    const bundle = {
      app: 'MY-ARCHIVE 95 OS',
      exportedAt: new Date().toISOString(),
      itemCount: items.length,
      items
    };
    if (includePrefs) {
      bundle.localStorageSnapshot = collectLocalSnapshot();
    }

    return {
      filename: `my-archive-95-backup-${stamp}.json`,
      mime: 'application/json;charset=utf-8;',
      content: JSON.stringify(bundle, null, 2)
    };
  }

  function downloadFile(filename, mime, content) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const parent = document.head || document.documentElement;
    if (!parent) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .sb-banner {
        background: #000080;
        color: #ffffff;
        padding: 10px 12px;
        border: 2px solid #111111;
        margin-bottom: 10px;
      }
      .sb-banner-title {
        font-weight: 900;
        font-size: 0.9rem;
        color: #ffe600;
      }
      .sb-banner-sub {
        font-size: 0.74rem;
        margin-top: 2px;
      }
      .sb-progress-track {
        width: 100%;
        height: 22px;
        background: #ffffff;
        border: 2px inset #808080;
        margin: 10px 0;
        overflow: hidden;
      }
      .sb-progress-fill {
        height: 100%;
        width: 0%;
        background: #008080;
        transition: width 0.14s linear;
      }
      .sb-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        margin-top: 12px;
        padding-top: 8px;
        border-top: 1px solid #808080;
        flex-wrap: wrap;
      }
    `;
    parent.appendChild(style);
  }

  function renderSetupBackup(container) {
    if (!container) return;
    ensureStyle();

    let step = 1; // 1: 옵션, 2: 생성 중, 3: 완료
    let format = 'json';
    let includePrefs = true;
    let progress = 0;
    let timerId = null;
    let generated = null;

    function stopTimer() {
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
    }

    function startBackupProcess() {
      step = 2;
      progress = 12;
      tone('click');
      paint();

      stopTimer();
      timerId = setInterval(() => {
        progress = Math.min(100, progress + 22);
        if (progress >= 100) {
          stopTimer();
          generated = buildBackupPayload(format, includePrefs);
          step = 3;
          tone('open');
        }
        paint();
      }, 140);
    }

    function paint() {
      const items = collectArchiveData();

      let bodyHtml = '';
      if (step === 1) {
        bodyHtml = `
          <div class="sunken-box" style="padding:10px;background:#ffffff;color:#111111;font-size:0.8rem;">
            <div style="font-weight:900;margin-bottom:6px;">1단계: 백업 포맷 및 옵션 선택 (현재 기록: ${items.length}건)</div>
            <label style="display:block;margin-bottom:6px;font-weight:700;">
              백업 형식:
              <select id="sb-format" class="win95-input" style="margin-left:6px;">
                <option value="json" ${format === 'json' ? 'selected' : ''}>JSON (.json — 전체 복원용)</option>
                <option value="csv" ${format === 'csv' ? 'selected' : ''}>CSV (.csv — 표/스프레드시트용)</option>
                <option value="md" ${format === 'md' ? 'selected' : ''}>Markdown (.md — 문서/노트용)</option>
              </select>
            </label>
            <label style="display:flex;align-items:center;gap:6px;font-size:0.76rem;cursor:pointer;">
              <input type="checkbox" id="sb-prefs" ${includePrefs ? 'checked' : ''} ${format !== 'json' ? 'disabled' : ''}/>
              <span>로컬 스토리지 설정 스냅샷 포함 (JSON 전용)</span>
            </label>
          </div>
        `;
      } else if (step === 2) {
        bodyHtml = `
          <div class="sunken-box" style="padding:12px;background:#ffffff;color:#111111;font-size:0.8rem;">
            <div style="font-weight:900;">2단계: 아카이브 데이터를 패키징하는 중... (${progress}%)</div>
            <div class="sb-progress-track">
              <div class="sb-progress-fill" style="width:${progress}%;"></div>
            </div>
            <div style="font-size:0.72rem;color:#555555;">잠시만 기다려 주세요.</div>
          </div>
        `;
      } else {
        const pkg = generated || buildBackupPayload(format, includePrefs);
        bodyHtml = `
          <div class="sunken-box" style="padding:12px;background:#ffffff;color:#111111;font-size:0.8rem;">
            <div style="font-weight:900;color:#006600;margin-bottom:6px;">3단계: 백업 패키지 준비 완료!</div>
            <div style="font-family:var(--font-mono, Consolas, monospace);font-size:0.75rem;margin-bottom:8px;">
              파일명: <b>${escHtml(pkg.filename)}</b> (${pkg.content.length.toLocaleString()} bytes)
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <button type="button" class="btn95 sm green" id="sb-btn-download">파일 다운로드</button>
              <button type="button" class="btn95 sm sky" id="sb-btn-copy">내용 복사</button>
            </div>
            <div id="sb-done-msg" style="margin-top:6px;font-size:0.74rem;font-weight:800;color:#000080;"></div>
          </div>
        `;
      }

      container.innerHTML = `
        <div class="sb-banner">
          <div class="sb-banner-title">MY-ARCHIVE 95 BACKUP WIZARD (SETUP.EXE)</div>
          <div class="sb-banner-sub">감상 기록을 안전하게 내보내고 백업 파일을 생성합니다.</div>
        </div>
        ${bodyHtml}
        <div class="sb-footer">
          <button type="button" class="btn95 sm" id="sb-btn-reset">처음으로</button>
          <div style="display:flex;gap:6px;">
            ${step === 1 ? `<button type="button" class="btn95 sm yellow" id="sb-btn-next">백업 생성 &gt;</button>` : ''}
            ${step === 3 ? `<button type="button" class="btn95 sm" id="sb-btn-again">다시 만들기</button>` : ''}
          </div>
        </div>
      `;

      container.querySelector('#sb-format')?.addEventListener('change', e => {
        format = e.target.value;
        tone('click');
        paint();
      });

      container.querySelector('#sb-prefs')?.addEventListener('change', e => {
        includePrefs = Boolean(e.target.checked);
      });

      container.querySelector('#sb-btn-next')?.addEventListener('click', startBackupProcess);

      container.querySelector('#sb-btn-reset')?.addEventListener('click', () => {
        stopTimer();
        step = 1;
        progress = 0;
        generated = null;
        tone('click');
        paint();
      });

      container.querySelector('#sb-btn-again')?.addEventListener('click', () => {
        stopTimer();
        step = 1;
        progress = 0;
        generated = null;
        tone('click');
        paint();
      });

      container.querySelector('#sb-btn-download')?.addEventListener('click', () => {
        const pkg = generated || buildBackupPayload(format, includePrefs);
        downloadFile(pkg.filename, pkg.mime, pkg.content);
        tone('click');
        const msg = container.querySelector('#sb-done-msg');
        if (msg) msg.textContent = `${pkg.filename} 다운로드를 시작했습니다.`;
      });

      container.querySelector('#sb-btn-copy')?.addEventListener('click', async () => {
        const pkg = generated || buildBackupPayload(format, includePrefs);
        const msg = container.querySelector('#sb-done-msg');
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(pkg.content);
          }
          tone('click');
          if (msg) msg.textContent = '백업 내용이 클립보드에 복사되었습니다.';
        } catch {
          if (msg) msg.textContent = '클립보드 복사에 실패했습니다.';
        }
      });
    }

    paint();
  }

  function openSetupBackupWindow() {
    const winId = 'win-setup-backup';
    let winEl = document.getElementById(winId);
    if (!winEl) {
      winEl = document.createElement('div');
      winEl.id = winId;
      winEl.className = 'floating-win';
      winEl.dataset.winTitle = 'SETUP.EXE — 데이터 백업 마법사';
      winEl.dataset.dynamic = 'true';
      winEl.style.cssText = 'width:min(540px, calc(100vw - 16px)); left:130px; top:100px;';
      winEl.innerHTML = `
        <div class="win-titlebar draggable">
          <div class="win-title-left"><span>SETUP.EXE — 데이터 백업 마법사</span></div>
          <div class="win-ctrl-btns">
            <button type="button" class="win-ctrl-btn" data-action="minimize" data-target="${winId}" title="최소화">_</button>
            <button type="button" class="win-ctrl-btn" data-action="close" data-target="${winId}" title="닫기">X</button>
          </div>
        </div>
        <div class="win-body" style="padding:10px;"><div id="setup-backup-stage"></div></div>
      `;
      (document.getElementById('dynamic-windows-container') || document.body).appendChild(winEl);
      if (typeof enableWindowDrag === 'function') enableWindowDrag(winEl);
    }

    if (typeof openWindow === 'function') openWindow(winId);
    else {
      winEl.classList.add('open');
      winEl.style.display = 'flex';
    }
    renderSetupBackup(document.getElementById('setup-backup-stage'));
  }

  window.SetupBackupApp = {
    render: renderSetupBackup,
    open: openSetupBackupWindow
  };
  window.openSetupBackupWindow = openSetupBackupWindow;
})();

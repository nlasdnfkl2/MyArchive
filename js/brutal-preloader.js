// ============================================================
// MY-ARCHIVE 95 OS — Neo-Brutalism Boot Preloader (Min 2s)
// ============================================================

(function () {
  window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
  window.__MOD_VERSIONS.brutalPreloader = 'v2026.11.25-brutal-2s-tvoff';

  const MIN_PRELOAD_MS = 2000;
  const PRELOADER_ID = 'brutal-js-preloader';
  const STYLE_ID = 'brutal-js-preloader-style';
  const startTime = performance.now();

  const FALLBACK_JS_FILES = [
    'js/shell-builder.js',
    'js/boot-controller.js',
    'js/config.js',
    'js/window-mgr.js',
    'js/jukebox.js',
    'js/gamepack.js',
    'js/visualizer.js',
    'js/archive-app.js',
    'js/browser-app.js',
    'js/community-app.js',
    'js/boot-wait.js',
    'js/boot-animation.js',
    'js/boot-login.js',
    'js/win95-widgets.js'
  ];

  function collectJsFileNames() {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const names = scripts
      .map((s) => s.getAttribute('src') || '')
      .filter((src) => src.includes('js/') && !src.includes('brutal-preloader.js'))
      .map((src) => src.split('?')[0].trim())
      .filter(Boolean);

    return names.length > 0 ? names : FALLBACK_JS_FILES;
  }

  function injectBrutalStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      @keyframes brutalTvPowerOff {
        0% {
          transform: scaleX(1) scaleY(1);
          filter: brightness(1);
          opacity: 1;
        }
        45% {
          transform: scaleX(1.03) scaleY(0.012);
          filter: brightness(1.8);
          opacity: 1;
        }
        78% {
          transform: scaleX(0.06) scaleY(0.012);
          filter: brightness(2.2);
          opacity: 0.95;
        }
        100% {
          transform: scaleX(0) scaleY(0);
          filter: brightness(0);
          opacity: 0;
        }
      }

      #${PRELOADER_ID} {
        position: fixed;
        inset: 0;
        z-index: 2147483640;
        background: #f7f4eb;
        color: #111111;
        font-family: 'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
        transform-origin: center center;
      }

      #${PRELOADER_ID}.tv-power-off {
        animation: brutalTvPowerOff 0.46s cubic-bezier(0.7, 0, 0.84, 0) forwards;
        pointer-events: none;
      }

      .brutal-loader-card {
        width: 100%;
        max-width: 560px;
        background: #ffffff;
        border: 3px solid #111111;
        box-shadow: 7px 7px 0px #111111;
        padding: 20px;
        box-sizing: border-box;
      }

      .brutal-loader-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        border-bottom: 3px solid #111111;
        padding-bottom: 12px;
        margin-bottom: 16px;
      }

      .brutal-loader-badge {
        display: inline-block;
        background: #ffd83b;
        color: #111111;
        border: 2px solid #111111;
        padding: 3px 8px;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.04em;
      }

      .brutal-loader-pct {
        font-size: 18px;
        font-weight: 900;
        font-variant-numeric: tabular-nums;
      }

      .brutal-loader-title {
        margin: 0 0 6px 0;
        font-size: 20px;
        font-weight: 900;
        letter-spacing: -0.02em;
        color: #111111;
      }

      .brutal-loader-file {
        font-size: 13px;
        font-weight: 700;
        color: #111111;
        background: #f7f4eb;
        border: 2px solid #111111;
        padding: 8px 10px;
        margin-bottom: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .brutal-progress-track {
        width: 100%;
        height: 24px;
        background: #ffffff;
        border: 3px solid #111111;
        box-sizing: border-box;
        overflow: hidden;
        margin-bottom: 14px;
      }

      .brutal-progress-fill {
        height: 100%;
        width: 0%;
        background: #111111;
        transition: width 80ms linear;
      }

      .brutal-file-list {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6px;
        max-height: 156px;
        overflow-y: auto;
        padding: 8px;
        background: #f7f4eb;
        border: 2px solid #111111;
        font-size: 12px;
        font-weight: 600;
      }

      .brutal-file-item {
        padding: 4px 6px;
        border: 1.5px solid #111111;
        background: #ffffff;
        color: #555555;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .brutal-file-item.is-active {
        background: #ffd83b;
        color: #111111;
        font-weight: 800;
      }

      .brutal-file-item.is-done {
        background: #111111;
        color: #ffffff;
        font-weight: 700;
      }

      @media (max-width: 520px) {
        .brutal-file-list {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function mountPreloader() {
    if (document.getElementById(PRELOADER_ID)) return;
    injectBrutalStyle();

    const files = collectJsFileNames();
    const el = document.createElement('div');
    el.id = PRELOADER_ID;
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');

    el.innerHTML = `
      <div class="brutal-loader-card">
        <div class="brutal-loader-top">
          <span class="brutal-loader-badge">MODULE LOADER</span>
          <span class="brutal-loader-pct" id="brutal-loader-pct">0%</span>
        </div>
        <h1 class="brutal-loader-title">스크립트 모듈 초기화 중</h1>
        <div class="brutal-loader-file" id="brutal-loader-current">준비 중...</div>
        <div class="brutal-progress-track">
          <div class="brutal-progress-fill" id="brutal-loader-fill"></div>
        </div>
        <div class="brutal-file-list" id="brutal-loader-list">
          ${files
            .map(
              (f, idx) =>
                `<div class="brutal-file-item" data-file-idx="${idx}" title="${f}">${f}</div>`
            )
            .join('')}
        </div>
      </div>
    `;

    const parent = document.body || document.documentElement;
    parent.appendChild(el);
  }

  function updatePreloaderProgress(ratio, currentFile, activeIndex) {
    const clamped = Math.max(0, Math.min(1, ratio));
    const pct = Math.round(clamped * 100);

    const pctEl = document.getElementById('brutal-loader-pct');
    const fillEl = document.getElementById('brutal-loader-fill');
    const curEl = document.getElementById('brutal-loader-current');
    const listEl = document.getElementById('brutal-loader-list');

    if (pctEl) pctEl.textContent = `${pct}%`;
    if (fillEl) fillEl.style.width = `${pct}%`;
    if (curEl && currentFile) curEl.textContent = `로딩: ${currentFile}`;

    if (listEl) {
      const items = listEl.querySelectorAll('.brutal-file-item');
      items.forEach((item, idx) => {
        item.classList.remove('is-active', 'is-done');
        if (idx < activeIndex) {
          item.classList.add('is-done');
        } else if (idx === activeIndex) {
          item.classList.add('is-active');
          item.scrollIntoView({ block: 'nearest' });
        }
      });
    }
  }

  function triggerExistingFirstScreen() {
    window.__BRUTAL_PRELOAD_DONE = true;
    if (typeof window.__onBrutalPreloadReady === 'function') {
      window.__onBrutalPreloadReady();
    } else if (
      typeof window.mountPreClickStartScreen === 'function' &&
      typeof window.__enterBootAfterStartClick === 'function'
    ) {
      window.mountPreClickStartScreen(window.__enterBootAfterStartClick);
    }
  }

  let finished = false;
  function completeWithTvPowerOff() {
    if (finished) return;
    finished = true;

    const files = collectJsFileNames();
    updatePreloaderProgress(1, files[files.length - 1] || '완료', files.length);

    const el = document.getElementById(PRELOADER_ID);
    if (!el) {
      triggerExistingFirstScreen();
      return;
    }

    // 기존 TV 꺼짐 연출 재활용 (또는 폴백 키프레임)
    if (typeof window.triggerTvTurnOffEffect === 'function') {
      try {
        window.triggerTvTurnOffEffect(el);
      } catch {
        el.classList.add('tv-power-off');
      }
    } else if (typeof window.playTvPowerOffAnimation === 'function') {
      try {
        window.playTvPowerOffAnimation(el);
      } catch {
        el.classList.add('tv-power-off');
      }
    } else {
      el.classList.add('tv-power-off');
    }

    setTimeout(() => {
      el.remove();
      triggerExistingFirstScreen();
    }, 480);
  }

  function runPreloaderLoop() {
    mountPreloader();
    const files = collectJsFileNames();
    const totalFiles = files.length;

    const tick = () => {
      if (finished) return;
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / MIN_PRELOAD_MS);
      const activeIdx = Math.min(totalFiles - 1, Math.floor(progress * totalFiles));
      updatePreloaderProgress(progress, files[activeIdx], activeIdx);

      if (elapsed >= MIN_PRELOAD_MS && document.readyState !== 'loading') {
        completeWithTvPowerOff();
        return;
      }
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  // 스크립트 로드 즉시 프리로더 마운트
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runPreloaderLoop, { once: true });
    // body가 아직 없을 수도 있으므로 즉시 시도
    setTimeout(runPreloaderLoop, 0);
  } else {
    runPreloaderLoop();
  }

  window.addEventListener('load', () => {
    const elapsed = performance.now() - startTime;
    const remain = Math.max(0, MIN_PRELOAD_MS - elapsed);
    setTimeout(completeWithTvPowerOff, remain);
  }, { once: true });
})();

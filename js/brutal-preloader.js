// ============================================================
// MY-ARCHIVE 95 OS — Neo-Brutalism / Pop-Art Boot Preloader
// ============================================================

(function () {
  window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
  window.__MOD_VERSIONS.brutalPreloader = 'v2026.11.25-random-per-file-500-1500ms';

  const FILE_MIN_MS = 500;
  const FILE_MAX_MS = 1500;
  const COMPLETE_HOLD_MS = 650;
  const PRELOADER_ID = 'brutal-js-preloader';
  const STYLE_ID = 'brutal-js-preloader-style';
  const startTime = performance.now();

  let lastActiveFileKey = '';
  let completionBannerShown = false;
  let powerOffScheduled = false;
  let finished = false;
  let loopStarted = false;
  let filesCache = null;
  let totalPlannedMs = null;

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

  function getRandomFileDurationMs() {
    return Math.floor(FILE_MIN_MS + Math.random() * (FILE_MAX_MS - FILE_MIN_MS + 1));
  }

  function collectJsFileNames() {
    if (filesCache && filesCache.length > 0) return filesCache;
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const names = scripts
      .map((s) => s.getAttribute('src') || '')
      .filter((src) => src.includes('js/') && !src.includes('brutal-preloader.js'))
      .map((src) => src.split('?')[0].trim())
      .filter(Boolean);

    filesCache = names.length > 0 ? names : FALLBACK_JS_FILES;
    return filesCache;
  }

  function injectBrutalStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const head = document.head || document.documentElement;
    if (!head) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      @keyframes brutalTvPowerOff {
        0% { transform: scaleX(1) scaleY(1); filter: brightness(1); opacity: 1; }
        45% { transform: scaleX(1.04) scaleY(0.012); filter: brightness(1.9); opacity: 1; }
        78% { transform: scaleX(0.06) scaleY(0.012); filter: brightness(2.4); opacity: 0.95; }
        100% { transform: scaleX(0) scaleY(0); filter: brightness(0); opacity: 0; }
      }

      @keyframes tickerScrollLeft {
        0% { transform: translateX(0%); }
        100% { transform: translateX(-50%); }
      }

      @keyframes bubblePopExaggerated {
        0% { transform: translateY(14px) scale(0.35) rotate(-9deg); opacity: 0; }
        45% { transform: translateY(-10px) scale(1.18) rotate(4deg); opacity: 1; }
        72% { transform: translateY(2px) scale(0.94) rotate(-2deg); opacity: 1; }
        100% { transform: translateY(0px) scale(1) rotate(0deg); opacity: 1; }
      }

      @keyframes completeStampSlam {
        0% { transform: scale(2.1) rotate(-14deg); opacity: 0; }
        55% { transform: scale(0.92) rotate(5deg); opacity: 1; }
        80% { transform: scale(1.06) rotate(-2deg); opacity: 1; }
        100% { transform: scale(1) rotate(-3deg); opacity: 1; }
      }

      @keyframes cardShakePunch {
        0%, 100% { transform: translate(0, 0) rotate(0deg); }
        25% { transform: translate(-3px, -2px) rotate(-1.2deg); }
        50% { transform: translate(3px, 2px) rotate(1.2deg); }
        75% { transform: translate(-2px, 1px) rotate(-0.6deg); }
      }

      @keyframes popStripeShift {
        0% { background-position: 0 0; }
        100% { background-position: 32px 0; }
      }

      #${PRELOADER_ID} {
        position: fixed;
        inset: 0;
        z-index: 2147483640;
        background-color: #ffe600;
        background-image: radial-gradient(#111111 1.4px, transparent 1.4px);
        background-size: 16px 16px;
        color: #111111;
        font-family: 'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        box-sizing: border-box;
        transform-origin: center center;
        overflow: hidden;
      }

      #${PRELOADER_ID}.tv-power-off {
        animation: brutalTvPowerOff 0.48s cubic-bezier(0.7, 0, 0.84, 0) forwards;
        pointer-events: none;
      }

      .brutal-ticker-strip {
        width: 100%;
        background: #111111;
        color: #ffffff;
        border-top: 4px solid #111111;
        border-bottom: 4px solid #111111;
        overflow: hidden;
        white-space: nowrap;
        padding: 8px 0;
        box-sizing: border-box;
      }

      .brutal-ticker-track {
        display: inline-flex;
        width: max-content;
        animation: tickerScrollLeft 9s linear infinite;
      }

      .brutal-ticker-msg {
        display: inline-block;
        padding-right: 48px;
        font-size: 13px;
        font-weight: 900;
        letter-spacing: 0.08em;
        color: #ffffff;
      }

      .brutal-center-wrap {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 18px;
        box-sizing: border-box;
      }

      .brutal-loader-card {
        position: relative;
        width: 100%;
        max-width: 580px;
        background: #ffffff;
        border: 4px solid #111111;
        box-shadow: 10px 10px 0px #111111;
        padding: 22px;
        box-sizing: border-box;
      }

      .brutal-loader-card.is-punching {
        animation: cardShakePunch 0.24s cubic-bezier(0.22, 1, 0.36, 1);
      }

      .brutal-loader-card.is-complete {
        background: #e9ffe8;
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
        background: #ff2a6d;
        color: #ffffff;
        border: 3px solid #111111;
        box-shadow: 3px 3px 0 #111111;
        padding: 4px 10px;
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 0.05em;
      }

      .brutal-loader-badge.is-complete {
        background: #111111;
        color: #39ff14;
      }

      .brutal-loader-pct {
        background: #05d9e8;
        color: #111111;
        border: 3px solid #111111;
        box-shadow: 3px 3px 0 #111111;
        padding: 3px 10px;
        font-size: 18px;
        font-weight: 900;
        font-variant-numeric: tabular-nums;
      }

      .brutal-loader-pct.is-complete {
        background: #39ff14;
        color: #111111;
      }

      .brutal-loader-title {
        margin: 0 0 18px 0;
        font-size: 22px;
        font-weight: 900;
        letter-spacing: -0.02em;
        color: #111111;
      }

      .brutal-bar-stage {
        position: relative;
        padding-top: 46px;
        margin-bottom: 16px;
      }

      .brutal-speech-bubble {
        position: absolute;
        top: 0;
        left: 0;
        max-width: 100%;
        background: #111111;
        color: #ffffff;
        border: 3px solid #111111;
        box-shadow: 4px 4px 0 rgba(17, 17, 17, 0.28);
        padding: 6px 12px;
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 0.01em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        transform-origin: 24px 100%;
        z-index: 5;
      }

      .brutal-speech-bubble::after {
        content: '';
        position: absolute;
        left: 18px;
        bottom: -9px;
        width: 0;
        height: 0;
        border-left: 7px solid transparent;
        border-right: 7px solid transparent;
        border-top: 9px solid #111111;
      }

      .brutal-speech-bubble.is-popping {
        animation: bubblePopExaggerated 0.42s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .brutal-speech-bubble.is-complete {
        background: #39ff14;
        color: #111111;
      }

      .brutal-speech-bubble.is-complete::after {
        border-top-color: #39ff14;
      }

      .brutal-complete-stamp {
        display: none;
        margin-top: 10px;
        background: #111111;
        color: #ffe600;
        border: 3px solid #111111;
        box-shadow: 5px 5px 0 #ff2a6d;
        padding: 8px 12px;
        font-size: 13px;
        font-weight: 900;
        letter-spacing: 0.05em;
        text-align: center;
      }

      .brutal-complete-stamp.is-visible {
        display: block;
        animation: completeStampSlam 0.42s cubic-bezier(0.22, 1.35, 0.36, 1) forwards;
      }

      .popart-progress-track {
        position: relative;
        width: 100%;
        height: 32px;
        background-color: #ffffff;
        background-image: repeating-linear-gradient(
          -45deg,
          rgba(17, 17, 17, 0.14) 0px,
          rgba(17, 17, 17, 0.14) 6px,
          transparent 6px,
          transparent 12px
        );
        background-size: 17px 17px;
        animation: popStripeShift 0.7s linear infinite;
        border: 4px solid #111111;
        box-shadow: 5px 5px 0 #111111;
        box-sizing: border-box;
        overflow: hidden;
      }

      .popart-progress-fill {
        height: 100%;
        width: 0%;
        background: #ff2a6d;
        border-right: 4px solid #111111;
        box-sizing: border-box;
        transition: width 70ms linear, background-color 140ms ease;
      }

      .brutal-file-list {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6px;
        max-height: 152px;
        overflow-y: auto;
        padding: 8px;
        background: #ffe600;
        border: 3px solid #111111;
        font-size: 12px;
        font-weight: 700;
      }

      .brutal-file-item {
        padding: 5px 7px;
        border: 2px solid #111111;
        background: #ffffff;
        color: #333333;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        transition: transform 90ms ease;
      }

      .brutal-file-item.is-active {
        background: #05d9e8;
        color: #111111;
        font-weight: 900;
        transform: translate(-1px, -1px);
        box-shadow: 2px 2px 0 #111111;
      }

      .brutal-file-item.is-done {
        background: #111111;
        color: #ffffff;
        font-weight: 800;
      }

      @media (max-width: 520px) {
        .brutal-file-list { grid-template-columns: 1fr; }
        .brutal-loader-card { padding: 16px; box-shadow: 6px 6px 0 #111111; }
      }
    `;
    head.appendChild(style);
  }

  function buildTickerContent(files) {
    const joined = files.join('  ///  ');
    const line = `POP-BRUTAL MODULE PRELOADER  ★  RANDOM 0.5-1.5S / FILE (${files.length} FILES)  ★  ${joined}  ★  `;
    return `<span class="brutal-ticker-msg">${line}</span><span class="brutal-ticker-msg">${line}</span>`;
  }

  function mountPreloader() {
    injectBrutalStyle();
    const targetParent = document.body || document.documentElement;
    if (!targetParent) return;

    let el = document.getElementById(PRELOADER_ID);
    if (el) {
      if (document.body && el.parentElement !== document.body) {
        document.body.appendChild(el);
      }
      return;
    }

    const files = collectJsFileNames();
    el = document.createElement('div');
    el.id = PRELOADER_ID;
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');

    el.innerHTML = `
      <div class="brutal-ticker-strip" aria-hidden="true">
        <div class="brutal-ticker-track">${buildTickerContent(files)}</div>
      </div>

      <div class="brutal-center-wrap">
        <div class="brutal-loader-card" id="brutal-loader-card">
          <div class="brutal-loader-top">
            <span class="brutal-loader-badge" id="brutal-loader-badge">POP-BRUTAL LOADER</span>
            <span class="brutal-loader-pct" id="brutal-loader-pct">0%</span>
          </div>

          <h1 class="brutal-loader-title" id="brutal-loader-title">JAVASCRIPT MODULES INITIALIZING</h1>

          <div class="brutal-bar-stage">
            <div class="brutal-speech-bubble" id="brutal-speech-bubble">BOOTING MODULE...</div>
            <div class="popart-progress-track">
              <div class="popart-progress-fill" id="brutal-loader-fill"></div>
            </div>
            <div class="brutal-complete-stamp" id="brutal-complete-stamp">
              ★ ALL MODULES LOADED — STANDBY FOR POWER OFF ★
            </div>
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
      </div>

      <div class="brutal-ticker-strip" aria-hidden="true">
        <div class="brutal-ticker-track" style="animation-direction: reverse;">${buildTickerContent(files)}</div>
      </div>
    `;

    targetParent.appendChild(el);
  }

  function getPopBarColor(pct) {
    if (pct < 35) return '#ff2a6d';
    if (pct < 70) return '#05d9e8';
    if (pct < 100) return '#ffe600';
    return '#39ff14';
  }

  function triggerSpeechBubblePop(bubbleEl, cardEl, fileName, fileIndex, totalFiles, pct, stepDurationMs) {
    if (!bubbleEl) return;
    const secLabel = `${(stepDurationMs / 1000).toFixed(2)}s`;
    bubbleEl.textContent = `⚡ [${fileIndex + 1}/${totalFiles}] ${fileName} (${secLabel})`;

    bubbleEl.classList.remove('is-popping');
    void bubbleEl.offsetWidth;
    bubbleEl.classList.add('is-popping');

    if (cardEl && pct < 100) {
      cardEl.classList.remove('is-punching');
      void cardEl.offsetWidth;
      cardEl.classList.add('is-punching');
    }
  }

  function showCompletionBanner(filesCount) {
    if (completionBannerShown) return;
    completionBannerShown = true;

    const cardEl = document.getElementById('brutal-loader-card');
    const badgeEl = document.getElementById('brutal-loader-badge');
    const pctEl = document.getElementById('brutal-loader-pct');
    const titleEl = document.getElementById('brutal-loader-title');
    const bubbleEl = document.getElementById('brutal-speech-bubble');
    const stampEl = document.getElementById('brutal-complete-stamp');
    const listEl = document.getElementById('brutal-loader-list');

    if (cardEl) cardEl.classList.add('is-complete');
    if (badgeEl) {
      badgeEl.textContent = 'LOAD COMPLETE!';
      badgeEl.classList.add('is-complete');
    }
    if (pctEl) {
      pctEl.textContent = '100%';
      pctEl.classList.add('is-complete');
    }
    if (titleEl) {
      titleEl.textContent = 'ALL JAVASCRIPT MODULES READY!';
    }
    if (bubbleEl) {
      bubbleEl.textContent = `✔ ${filesCount} MODULES LOADED!`;
      bubbleEl.classList.add('is-complete');
      bubbleEl.classList.remove('is-popping');
      void bubbleEl.offsetWidth;
      bubbleEl.classList.add('is-popping');
    }
    if (stampEl) {
      stampEl.classList.add('is-visible');
    }
    if (listEl) {
      listEl.querySelectorAll('.brutal-file-item').forEach((item) => {
        item.classList.remove('is-active');
        item.classList.add('is-done');
      });
    }
  }

  function updatePreloaderProgress(ratio, currentFile, activeIndex, totalFiles, stepDurationMs) {
    const clamped = Math.max(0, Math.min(1, ratio));
    const pct = Math.round(clamped * 100);

    const pctEl = document.getElementById('brutal-loader-pct');
    const fillEl = document.getElementById('brutal-loader-fill');
    const bubbleEl = document.getElementById('brutal-speech-bubble');
    const cardEl = document.getElementById('brutal-loader-card');
    const listEl = document.getElementById('brutal-loader-list');

    if (pctEl) pctEl.textContent = `${pct}%`;
    if (fillEl) {
      fillEl.style.width = `${pct}%`;
      fillEl.style.backgroundColor = getPopBarColor(pct);
    }

    const fileKey = `${activeIndex}:${currentFile || ''}`;
    if (currentFile && fileKey !== lastActiveFileKey) {
      lastActiveFileKey = fileKey;
      triggerSpeechBubblePop(bubbleEl, cardEl, currentFile, activeIndex, totalFiles, pct, stepDurationMs);
    }

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

  function executeTvPowerOffNow() {
    if (finished) return;
    finished = true;

    const el = document.getElementById(PRELOADER_ID);
    if (!el) {
      triggerExistingFirstScreen();
      return;
    }

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
    }, 500);
  }

  function completeWithTvPowerOff() {
    if (powerOffScheduled || finished) return;
    powerOffScheduled = true;

    const files = collectJsFileNames();
    const lastFile = files[files.length - 1] || 'ALL MODULES READY';
    updatePreloaderProgress(1, `${lastFile} — DONE!`, files.length, files.length, FILE_MIN_MS);
    showCompletionBanner(files.length);

    setTimeout(executeTvPowerOffNow, COMPLETE_HOLD_MS);
  }

  // 파일 하나당 매번 500ms ~ 1500ms 랜덤 시간으로 순차 진행
  function runPerFileSequentialSteps(files, onAllFilesCompleted) {
    const totalFiles = Math.max(1, files.length);
    const stepDurations = Array.from({ length: totalFiles }, () => getRandomFileDurationMs());
    totalPlannedMs = stepDurations.reduce((acc, ms) => acc + ms, 0);

    let currentIndex = 0;
    let completedMs = 0;

    const runSingleFileStep = () => {
      if (finished || powerOffScheduled) return;
      mountPreloader();

      const fileName = files[currentIndex] || files[files.length - 1];
      const stepDurationMs = stepDurations[currentIndex] || FILE_MIN_MS;
      const stepStart = performance.now();

      const animateCurrentFile = () => {
        if (finished || powerOffScheduled) return;
        mountPreloader();

        const stepElapsed = Math.max(0, performance.now() - stepStart);
        const clampedStepElapsed = Math.min(stepDurationMs, stepElapsed);
        const overallRatio = totalPlannedMs > 0
          ? Math.min(1, (completedMs + clampedStepElapsed) / totalPlannedMs)
          : Math.min(1, (currentIndex + clampedStepElapsed / stepDurationMs) / totalFiles);

        updatePreloaderProgress(overallRatio, fileName, currentIndex, totalFiles, stepDurationMs);

        if (stepElapsed < stepDurationMs) {
          requestAnimationFrame(animateCurrentFile);
          return;
        }

        completedMs += stepDurationMs;
        currentIndex += 1;

        if (currentIndex < totalFiles) {
          runSingleFileStep();
        } else {
          updatePreloaderProgress(1, fileName, totalFiles - 1, totalFiles, stepDurationMs);
          onAllFilesCompleted();
        }
      };

      requestAnimationFrame(animateCurrentFile);
    };

    runSingleFileStep();
  }

  function runPreloaderLoop() {
    mountPreloader();
    if (loopStarted) return;
    loopStarted = true;

    const files = collectJsFileNames();
    let filesStepsDone = false;
    let documentReady = document.readyState !== 'loading';

    const tryFinish = () => {
      if (filesStepsDone && documentReady && !powerOffScheduled && !finished) {
        completeWithTvPowerOff();
      }
    };

    if (!documentReady) {
      document.addEventListener('DOMContentLoaded', () => {
        documentReady = true;
        mountPreloader();
        tryFinish();
      }, { once: true });
    }

    runPerFileSequentialSteps(files, () => {
      filesStepsDone = true;
      tryFinish();
    });
  }

  runPreloaderLoop();

  window.addEventListener('load', () => {
    mountPreloader();
    const files = collectJsFileNames();
    const fallbackTotalMs = typeof totalPlannedMs === 'number'
      ? totalPlannedMs
      : Math.max(1, files.length) * FILE_MIN_MS;
    const elapsed = Math.max(0, performance.now() - startTime);
    const remain = Math.max(0, fallbackTotalMs - elapsed);
    setTimeout(() => {
      if (!powerOffScheduled && !finished && performance.now() - startTime >= fallbackTotalMs) {
        completeWithTvPowerOff();
      }
    }, remain);
  }, { once: true });
})();

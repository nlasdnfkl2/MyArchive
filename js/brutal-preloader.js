// ============================================================
// MY-ARCHIVE 95 OS — Neo-Brutalism / Pop-Art Boot Preloader
// ============================================================

(function () {
  window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
  window.__MOD_VERSIONS.brutalPreloader = 'v2026.11.25-win95-rewind-sfx';

  const TARGET_AVG_MS = 4500, HOLD_MS = 1000, WAIT_SETUP_KEY = 'myarchive95_setup_v1';
  const LOADER_ID = 'brutal-js-preloader', STYLE_ID = 'brutal-js-preloader-style';
  const START_TS = performance.now();

  const FILE_WEIGHTS = [
    ['js/archive-app.js', 6.8],
    ['js/browser-app.js', 4.6],
    ['js/community-app.js', 4.2],
    ['js/boot-animation.js', 3.4],
    ['js/window-mgr.js', 3.2],
    ['js/gamepack.js', 3.0],
    ['js/shell-builder.js', 2.8],
    ['js/boot-login.js', 2.6],
    ['js/visualizer.js', 2.4],
    ['js/win95-widgets.js', 2.2],
    ['js/jukebox.js', 2.0],
    ['js/config.js', 1.8],
    ['js/boot-wait.js', 1.6],
    ['js/boot-controller.js', 1.4]
  ];

  let lastKey = '', bannerShown = false, powerOffQueued = false, done = false, started = false, plannedMs = null;
  let rewindCtl = null;

  function isSoundAllowed() {
    if (typeof window.__WIN95_SOUND_ENABLED === 'boolean') return window.__WIN95_SOUND_ENABLED;
    try {
      const parsed = JSON.parse(localStorage.getItem(WAIT_SETUP_KEY) || 'null');
      return typeof parsed?.sound === 'boolean' ? parsed.sound : true;
    } catch { return true; }
  }

  // 프리로더 전용 테이프 뒤로 감기(REWIND) 사운드 생성기
  function startRewindAudio() {
    if (rewindCtl || !isSoundAllowed()) return rewindCtl;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    let ctx = null, motorOsc = null, wobbleOsc = null, wobbleGain = null, motorFilter = null;
    let tapeSrc = null, tapeBp = null, masterGain = null, stopped = false, unlockBound = null;

    const setupNodes = () => {
      if (stopped || !ctx || masterGain) return;
      const now = ctx.currentTime;

      masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, now);
      masterGain.gain.linearRampToValueAtTime(0.065, now + 0.14);
      masterGain.connect(ctx.destination);

      // 1) 고속 릴 회전음 + 역방향 위닝 피치
      motorOsc = ctx.createOscillator();
      motorOsc.type = 'sawtooth';
      motorOsc.frequency.setValueAtTime(215, now);
      motorOsc.frequency.exponentialRampToValueAtTime(340, now + 0.9);

      wobbleOsc = ctx.createOscillator();
      wobbleOsc.type = 'sine';
      wobbleOsc.frequency.setValueAtTime(14.5, now);

      wobbleGain = ctx.createGain();
      wobbleGain.gain.setValueAtTime(28, now);

      motorFilter = ctx.createBiquadFilter();
      motorFilter.type = 'bandpass';
      motorFilter.frequency.setValueAtTime(680, now);
      motorFilter.Q.setValueAtTime(2.4, now);

      const motorGain = ctx.createGain();
      motorGain.gain.setValueAtTime(0.42, now);

      wobbleOsc.connect(wobbleGain);
      wobbleGain.connect(motorOsc.frequency);
      motorOsc.connect(motorFilter);
      motorFilter.connect(motorGain);
      motorGain.connect(masterGain);

      // 2) 테이프 스침 및 고속 프레임 틱 텍스처 (노이즈 대신 규칙적 뒤로 감기 결)
      const len = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const ch = buf.getChannelData(0);
      const tickPeriod = Math.max(18, Math.floor(ctx.sampleRate / 68));
      for (let i = 0; i < len; i++) {
        const mod = i % tickPeriod;
        const pulse = mod < 4 ? (1 - mod / 4) * 0.75 : 0;
        const flutter = Math.sin((i / ctx.sampleRate) * Math.PI * 2 * 19) * 0.16;
        ch[i] = pulse + flutter * 0.25;
      }

      tapeSrc = ctx.createBufferSource();
      tapeSrc.buffer = buf;
      tapeSrc.loop = true;

      tapeBp = ctx.createBiquadFilter();
      tapeBp.type = 'bandpass';
      tapeBp.frequency.setValueAtTime(2100, now);
      tapeBp.Q.setValueAtTime(1.5, now);

      const tapeGain = ctx.createGain();
      tapeGain.gain.setValueAtTime(0.36, now);

      tapeSrc.connect(tapeBp);
      tapeBp.connect(tapeGain);
      tapeGain.connect(masterGain);

      motorOsc.start(now);
      wobbleOsc.start(now);
      tapeSrc.start(now);
    };

    try {
      ctx = typeof window.getWaitAudioContext === 'function' ? window.getWaitAudioContext() : new AudioCtx();
      if (!ctx) return null;
      if (ctx.state === 'running') {
        setupNodes();
      } else {
        ctx.resume().then(() => { if (!stopped) setupNodes(); }).catch(() => {});
        unlockBound = () => {
          if (stopped) return;
          ctx.resume().then(() => { if (!stopped) setupNodes(); }).catch(() => {});
        };
        window.addEventListener('pointerdown', unlockBound, { once: true, passive: true });
        window.addEventListener('keydown', unlockBound, { once: true, passive: true });
      }
    } catch { return null; }

    rewindCtl = {
      stop: () => {
        if (stopped) return;
        stopped = true;
        if (unlockBound) {
          window.removeEventListener('pointerdown', unlockBound);
          window.removeEventListener('keydown', unlockBound);
        }
        try {
          if (ctx && masterGain) {
            const t = ctx.currentTime;
            if (motorOsc) motorOsc.frequency.exponentialRampToValueAtTime(95, t + 0.16);
            masterGain.gain.cancelScheduledValues(t);
            masterGain.gain.setValueAtTime(Math.max(0.0001, masterGain.gain.value), t);
            masterGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
          }
          setTimeout(() => {
            try { motorOsc?.stop(); wobbleOsc?.stop(); tapeSrc?.stop(); } catch {}
            try { motorOsc?.disconnect(); wobbleOsc?.disconnect(); tapeSrc?.disconnect(); masterGain?.disconnect(); } catch {}
          }, 210);
        } catch {}
        rewindCtl = null;
      }
    };
    return rewindCtl;
  }

  function getShuffledEntries() {
    const arr = FILE_WEIGHTS.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function computeWeightedDurations(entries) {
    const raw = entries.map(([, w]) => w * (0.75 + Math.random() * 0.5));
    const sum = raw.reduce((a, b) => a + b, 0) || 1;
    const totalTarget = TARGET_AVG_MS * (0.92 + Math.random() * 0.16);
    return raw.map((v) => Math.max(110, Math.round((v / sum) * totalTarget)));
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID) || !(document.head || document.documentElement)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      @keyframes brutalTvPowerOff{0%{transform:scaleX(1) scaleY(1);filter:brightness(1);opacity:1}45%{transform:scaleX(1.04) scaleY(.012);filter:brightness(1.9);opacity:1}78%{transform:scaleX(.06) scaleY(.012);filter:brightness(2.4);opacity:.95}100%{transform:scaleX(0) scaleY(0);filter:brightness(0);opacity:0}}
      @keyframes tickerScrollLeft{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
      @keyframes bubblePopExaggerated{0%{transform:translateY(14px) scale(.35) rotate(-9deg);opacity:0}45%{transform:translateY(-10px) scale(1.18) rotate(4deg);opacity:1}72%{transform:translateY(2px) scale(.94) rotate(-2deg);opacity:1}100%{transform:translateY(0) scale(1) rotate(0);opacity:1}}
      @keyframes completeStampSlam{0%{transform:scale(2.1) rotate(-14deg);opacity:0}55%{transform:scale(.92) rotate(5deg);opacity:1}80%{transform:scale(1.06) rotate(-2deg);opacity:1}100%{transform:scale(1) rotate(-3deg);opacity:1}}
      @keyframes cardShakePunch{0%,100%{transform:translate(0,0) rotate(0)}25%{transform:translate(-3px,-2px) rotate(-1.2deg)}50%{transform:translate(3px,2px) rotate(1.2deg)}75%{transform:translate(-2px,1px) rotate(-.6deg)}}
      @keyframes popStripeShift{0%{background-position:0 0}100%{background-position:32px 0}}
      #${LOADER_ID}{position:fixed;inset:0;z-index:2147483640;background:#ffe600 radial-gradient(#111 1.4px,transparent 1.4px);background-size:16px 16px;color:#111;font-family:'Pretendard Variable','Pretendard',-apple-system,BlinkMacSystemFont,sans-serif;display:flex;flex-direction:column;justify-content:space-between;box-sizing:border-box;transform-origin:center;overflow:hidden}
      #${LOADER_ID}.tv-power-off{animation:brutalTvPowerOff .48s cubic-bezier(.7,0,.84,0) forwards;pointer-events:none}
      .brutal-ticker-strip{width:100%;background:#111;color:#fff;border-top:4px solid #111;border-bottom:4px solid #111;overflow:hidden;white-space:nowrap;padding:8px 0;box-sizing:border-box}
      .brutal-ticker-track{display:inline-flex;width:max-content;animation:tickerScrollLeft 9s linear infinite}
      .brutal-ticker-msg{display:inline-block;padding-right:48px;font-size:13px;font-weight:900;letter-spacing:.08em}
      .brutal-center-wrap{flex:1;display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box}
      .brutal-loader-card{position:relative;width:100%;max-width:580px;background:#fff;border:4px solid #111;box-shadow:10px 10px 0 #111;padding:22px;box-sizing:border-box}
      .brutal-loader-card.is-punching{animation:cardShakePunch .24s cubic-bezier(.22,1,.36,1)}
      .brutal-loader-card.is-complete{background:#e9ffe8}
      .brutal-loader-top{display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:3px solid #111;padding-bottom:12px;margin-bottom:16px}
      .brutal-loader-badge{background:#ff2a6d;color:#fff;border:3px solid #111;box-shadow:3px 3px 0 #111;padding:4px 10px;font-size:12px;font-weight:900;letter-spacing:.05em}
      .brutal-loader-badge.is-complete{background:#111;color:#39ff14}
      .brutal-loader-pct{background:#05d9e8;color:#111;border:3px solid #111;box-shadow:3px 3px 0 #111;padding:3px 10px;font-size:18px;font-weight:900;font-variant-numeric:tabular-nums}
      .brutal-loader-pct.is-complete{background:#39ff14}
      .brutal-loader-title{margin:0 0 18px;font-size:22px;font-weight:900;letter-spacing:-.02em}
      .brutal-bar-stage{position:relative;padding-top:46px;margin-bottom:16px}
      .brutal-speech-bubble{position:absolute;top:0;left:0;max-width:100%;background:#111;color:#fff;border:3px solid #111;box-shadow:4px 4px 0 rgba(17,17,17,.28);padding:6px 12px;font-size:12px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transform-origin:24px 100%;z-index:5}
      .brutal-speech-bubble::after{content:'';position:absolute;left:18px;bottom:-9px;border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid #111}
      .brutal-speech-bubble.is-popping{animation:bubblePopExaggerated .42s cubic-bezier(.34,1.56,.64,1)}
      .brutal-speech-bubble.is-complete{background:#39ff14;color:#111}
      .brutal-speech-bubble.is-complete::after{border-top-color:#39ff14}
      .brutal-complete-stamp{display:none;margin-top:10px;background:#111;color:#ffe600;border:3px solid #111;box-shadow:5px 5px 0 #ff2a6d;padding:8px 12px;font-size:13px;font-weight:900;letter-spacing:.05em;text-align:center}
      .brutal-complete-stamp.is-visible{display:block;animation:completeStampSlam .42s cubic-bezier(.22,1.35,.36,1) forwards}
      .popart-progress-track{position:relative;width:100%;height:32px;background:#fff repeating-linear-gradient(-45deg,rgba(17,17,17,.14) 0,rgba(17,17,17,.14) 6px,transparent 6px,transparent 12px);background-size:17px 17px;animation:popStripeShift .7s linear infinite;border:4px solid #111;box-shadow:5px 5px 0 #111;box-sizing:border-box;overflow:hidden}
      .popart-progress-fill{height:100%;width:0;background:#ff2a6d;border-right:4px solid #111;box-sizing:border-box;transition:width 70ms linear,background-color .14s ease}
      .brutal-file-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;max-height:152px;overflow-y:auto;scrollbar-width:none;-ms-overflow-style:none;padding:8px;background:#ffe600;border:3px solid #111;font-size:12px;font-weight:700;scroll-behavior:smooth}
      .brutal-file-list::-webkit-scrollbar{display:none}
      .brutal-file-item{padding:5px 7px;border:2px solid #111;background:#fff;color:#333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:transform 90ms ease}
      .brutal-file-item.is-active{background:#05d9e8;color:#111;font-weight:900;transform:translate(-1px,-1px);box-shadow:2px 2px 0 #111}
      .brutal-file-item.is-done{background:#111;color:#fff;font-weight:800}
      @media(max-width:520px){.brutal-file-list{grid-template-columns:1fr}.brutal-loader-card{padding:16px;box-shadow:6px 6px 0 #111}}
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  const buildTicker = (files) => {
    const line = `MY-ARCHIVE 95 WIN95 PRELOADER ★ REWINDING ${files.length} SYSTEM MODULES ★ ${files.join(' /// ')} ★ `;
    return `<span class="brutal-ticker-msg">${line}</span><span class="brutal-ticker-msg">${line}</span>`;
  };

  function mount(files) {
    injectStyle();
    const parent = document.body || document.documentElement;
    if (!parent) return;
    let el = document.getElementById(LOADER_ID);
    if (el) {
      if (document.body && el.parentElement !== document.body) document.body.appendChild(el);
      return;
    }
    el = document.createElement('div');
    el.id = LOADER_ID;
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML = `
      <div class="brutal-ticker-strip" aria-hidden="true"><div class="brutal-ticker-track">${buildTicker(files)}</div></div>
      <div class="brutal-center-wrap">
        <div class="brutal-loader-card" id="brutal-loader-card">
          <div class="brutal-loader-top">
            <span class="brutal-loader-badge" id="brutal-loader-badge">WIN95 MODULE LOADER</span>
            <span class="brutal-loader-pct" id="brutal-loader-pct">0%</span>
          </div>
          <h1 class="brutal-loader-title" id="brutal-loader-title">WIN95 SYSTEM MODULES LOADING</h1>
          <div class="brutal-bar-stage">
            <div class="brutal-speech-bubble" id="brutal-speech-bubble">REWINDING MODULE...</div>
            <div class="popart-progress-track"><div class="popart-progress-fill" id="brutal-loader-fill"></div></div>
            <div class="brutal-complete-stamp" id="brutal-complete-stamp">★ WIN95 SYSTEM MODULES READY — LAUNCHING MY-ARCHIVE 95 ★</div>
          </div>
          <div class="brutal-file-list" id="brutal-loader-list">
            ${files.map((f, i) => `<div class="brutal-file-item" data-file-idx="${i}" title="${f}">${f}</div>`).join('')}
          </div>
        </div>
      </div>
      <div class="brutal-ticker-strip" aria-hidden="true"><div class="brutal-ticker-track" style="animation-direction:reverse">${buildTicker(files)}</div></div>
    `;
    parent.appendChild(el);
  }

  const barColor = (pct) => (pct < 35 ? '#ff2a6d' : pct < 70 ? '#05d9e8' : pct < 100 ? '#ffe600' : '#39ff14');

  const reanimate = (el, cls) => {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  };

  function updateProgress(ratio, file, idx, total) {
    const pct = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
    const pctEl = document.getElementById('brutal-loader-pct');
    const fillEl = document.getElementById('brutal-loader-fill');
    const bubbleEl = document.getElementById('brutal-speech-bubble');
    const cardEl = document.getElementById('brutal-loader-card');
    const listEl = document.getElementById('brutal-loader-list');

    if (pctEl) pctEl.textContent = `${pct}%`;
    if (fillEl) { fillEl.style.width = `${pct}%`; fillEl.style.backgroundColor = barColor(pct); }

    const key = `${idx}:${file || ''}`;
    if (file && key !== lastKey) {
      lastKey = key;
      if (bubbleEl) {
        bubbleEl.textContent = `⏪ [${idx + 1}/${total}] ${file}`;
        reanimate(bubbleEl, 'is-popping');
      }
      if (cardEl && pct < 100) reanimate(cardEl, 'is-punching');
    }

    if (listEl) {
      let activeItem = null;
      listEl.querySelectorAll('.brutal-file-item').forEach((item, i) => {
        item.classList.remove('is-active', 'is-done');
        if (i < idx) item.classList.add('is-done');
        else if (i === idx) { item.classList.add('is-active'); activeItem = item; }
      });
      if (activeItem) {
        const targetTop = activeItem.offsetTop - listEl.offsetTop - listEl.clientHeight / 2 + activeItem.offsetHeight / 2;
        listEl.scrollTop = Math.max(0, targetTop);
      }
    }
  }

  function showComplete(count) {
    if (bannerShown) return;
    bannerShown = true;
    rewindCtl?.stop?.();
    document.getElementById('brutal-loader-card')?.classList.add('is-complete');
    const badge = document.getElementById('brutal-loader-badge');
    const pct = document.getElementById('brutal-loader-pct');
    const title = document.getElementById('brutal-loader-title');
    const bubble = document.getElementById('brutal-speech-bubble');
    if (badge) { badge.textContent = 'WIN95 READY'; badge.classList.add('is-complete'); }
    if (pct) { pct.textContent = '100%'; pct.classList.add('is-complete'); }
    if (title) title.textContent = 'WIN95 MODULES LOADED — READY!';
    if (bubble) { bubble.textContent = `✔ ${count} WIN95 MODULES LOADED!`; bubble.classList.add('is-complete'); reanimate(bubble, 'is-popping'); }
    document.getElementById('brutal-complete-stamp')?.classList.add('is-visible');
    const listEl = document.getElementById('brutal-loader-list');
    if (listEl) {
      listEl.querySelectorAll('.brutal-file-item').forEach((item) => {
        item.classList.remove('is-active');
        item.classList.add('is-done');
      });
      listEl.scrollTop = listEl.scrollHeight;
    }
  }

  function triggerNextScreen() {
    window.__BRUTAL_PRELOAD_DONE = true;
    if (typeof window.__onBrutalPreloadReady === 'function') window.__onBrutalPreloadReady();
    else if (typeof window.mountPreClickStartScreen === 'function' && typeof window.__enterBootAfterStartClick === 'function') {
      window.mountPreClickStartScreen(window.__enterBootAfterStartClick);
    }
  }

  function powerOffNow() {
    if (done) return;
    done = true;
    rewindCtl?.stop?.();
    const el = document.getElementById(LOADER_ID);
    if (!el) return triggerNextScreen();

    const fx = window.triggerTvTurnOffEffect || window.playTvPowerOffAnimation;
    if (typeof fx === 'function') { try { fx(el); } catch { el.classList.add('tv-power-off'); } }
    else el.classList.add('tv-power-off');

    setTimeout(() => { el.remove(); triggerNextScreen(); }, 500);
  }

  function finishSequence(files) {
    if (powerOffQueued || done) return;
    powerOffQueued = true;
    updateProgress(1, `${files[files.length - 1] || 'WIN95 MODULES'} — LOADED!`, files.length, files.length);
    showComplete(files.length);
    setTimeout(powerOffNow, HOLD_MS);
  }

  function runWeightedSequence(entries, onComplete) {
    const files = entries.map(([name]) => name);
    const total = Math.max(1, files.length);
    const durations = computeWeightedDurations(entries);
    plannedMs = durations.reduce((a, b) => a + b, 0);
    let idx = 0, doneMs = 0;

    const step = () => {
      if (done || powerOffQueued) return;
      mount(files);
      const file = files[idx] || files[total - 1];
      const stepMs = durations[idx] || 200;
      const t0 = performance.now();

      const tick = () => {
        if (done || powerOffQueued) return;
        mount(files);
        const elapsed = Math.max(0, performance.now() - t0);
        const ratio = Math.min(1, (doneMs + Math.min(stepMs, elapsed)) / plannedMs);
        updateProgress(ratio, file, idx, total);
        if (elapsed < stepMs) return requestAnimationFrame(tick);

        doneMs += stepMs;
        idx += 1;
        if (idx < total) step();
        else { updateProgress(1, file, total - 1, total); onComplete(); }
      };
      requestAnimationFrame(tick);
    };
    step();
  }

  const entries = getShuffledEntries();
  const files = entries.map(([name]) => name);
  mount(files);
  startRewindAudio();

  if (!started) {
    started = true;
    let stepsDone = false, ready = document.readyState !== 'loading';
    const tryFinish = () => { if (stepsDone && ready && !powerOffQueued && !done) finishSequence(files); };
    if (!ready) {
      document.addEventListener('DOMContentLoaded', () => { ready = true; mount(files); tryFinish(); }, { once: true });
    }
    runWeightedSequence(entries, () => { stepsDone = true; tryFinish(); });
  }

  window.addEventListener('load', () => {
    mount(files);
    const targetMs = typeof plannedMs === 'number' ? plannedMs : TARGET_AVG_MS;
    const remain = Math.max(0, targetMs - (performance.now() - START_TS));
    setTimeout(() => {
      if (!powerOffQueued && !done && performance.now() - START_TS >= targetMs) finishSequence(files);
    }, remain);
  }, { once: true });
})();

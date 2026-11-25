// ============================================================
// MY-ARCHIVE 95 OS — Neo-Brutalism / Pop-Art Boot Preloader
// ============================================================

(function () {
  window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
  window.__MOD_VERSIONS.brutalPreloader = 'v2026.11.25-nostalgic-intro-parody-rewind';

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
  let rewindCtl = null, currentRatio = 0;

  const isSoundAllowed = () => {
    if (typeof window.__WIN95_SOUND_ENABLED === 'boolean') return window.__WIN95_SOUND_ENABLED;
    try {
      const parsed = JSON.parse(localStorage.getItem(WAIT_SETUP_KEY) || 'null');
      return typeof parsed?.sound === 'boolean' ? parsed.sound : true;
    } catch { return true; }
  };

  // 원곡 전주(00:00~00:16)의 통통 튀는 동기를 패러디한 노스탤직 음원 생성 후 역방향 버퍼 반환
  function createNostalgicParodyBuffer(ctx) {
    const sr = ctx.sampleRate, stepSec = 0.165;
    // 전주의 경쾌한 상행/반복 펄스 동기를 노스탤직한 메이저/애드9 톤으로 패러디
    const leadFreqs = [
      392.00, 392.00, 440.00, 493.88, 587.33, 523.25, 493.88, 440.00,
      392.00, 440.00, 493.88, 587.33, 659.25, 587.33, 523.25, 493.88,
      329.63, 329.63, 392.00, 440.00, 493.88, 440.00, 392.00, 329.63,
      349.23, 392.00, 440.00, 523.25, 493.88, 440.00, 392.00, 349.23
    ];
    const bassFreqs = [
      130.81, 130.81, 196.00, 130.81, 164.81, 164.81, 246.94, 164.81,
      146.83, 146.83, 220.00, 146.83, 196.00, 196.00, 146.83, 130.81
    ];

    const totalSec = leadFreqs.length * stepSec;
    const len = Math.max(1, Math.floor(sr * totalSec));
    const forward = new Float32Array(len);

    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const step = Math.floor(t / stepSec) % leadFreqs.length;
      const localT = t - step * stepSec;
      const fLead = leadFreqs[step];
      const fBass = bassFreqs[step % bassFreqs.length];

      // 따뜻한 일렉트릭 피아노/신스 패드 감성 엔벨로프
      const attack = Math.min(1, localT / 0.014);
      const decay = Math.exp(-localT * 5.2);
      const env = attack * decay;

      const leadTone =
        Math.sin(2 * Math.PI * fLead * t) * 0.52 +
        Math.sin(2 * Math.PI * fLead * 2 * t) * 0.16 +
        Math.sin(2 * Math.PI * fLead * 1.5 * t) * 0.08;

      const bassTone =
        Math.sin(2 * Math.PI * fBass * t) * 0.34 +
        Math.sin(2 * Math.PI * (fBass * 1.5) * t) * 0.08;

      // 노스탤직 테이프 워블(미세한 피치 흔들림)
      const wow = 1 + 0.006 * Math.sin(2 * Math.PI * 2.4 * t);
      const sample = (leadTone * 0.65 + bassTone * 0.35) * env;
      forward[i] = Math.max(-0.95, Math.min(0.95, sample * (0.92 + 0.08 * wow)));
    }

    // 뒤로 감기용 시간 역방향 변환
    forward.reverse();
    const buf = ctx.createBuffer(1, len, sr);
    buf.getChannelData(0).set(forward);
    return buf;
  }

  // 카세트 테이프 삽입('달칵') 사운드
  function playTapeInsertDalkak(ctx, startTime) {
    const mkClick = (offset, freqStart, freqEnd, dur, peak) => {
      const t0 = startTime + offset;
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freqStart, t0);
      osc.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
      gain.gain.setValueAtTime(0.0004, t0);
      gain.gain.linearRampToValueAtTime(peak, t0 + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0003, t0 + dur);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t0); osc.stop(t0 + dur + 0.008);
    };
    mkClick(0, 340, 115, 0.036, 0.24);
    mkClick(0.068, 1680, 520, 0.026, 0.26);
  }

  // '달칵' 후 노스탤직 패러디 음원을 뒤로 점점 빠르게 감는 컨트롤러
  function startRewindAudio() {
    if (rewindCtl || !isSoundAllowed()) return rewindCtl;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    let ctx = null, src = null, filter = null, gain = null, stopped = false, rafAccel = 0, unlockBound = null;

    const beginTapeRewind = () => {
      if (stopped || !ctx || src) return;
      const now = ctx.currentTime;
      playTapeInsertDalkak(ctx, now);

      const rewindStart = now + 0.11;
      const revBuf = createNostalgicParodyBuffer(ctx);

      src = ctx.createBufferSource();
      src.buffer = revBuf;
      src.loop = true;
      src.playbackRate.setValueAtTime(0.95, rewindStart);

      filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, rewindStart);
      filter.Q.setValueAtTime(1.1, rewindStart);

      gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0002, rewindStart);
      gain.gain.linearRampToValueAtTime(0.18, rewindStart + 0.05);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(rewindStart);

      const tickSpeed = () => {
        if (stopped || !src || !ctx) return;
        const p = Math.max(0, Math.min(1, currentRatio));
        const speed = 0.95 + Math.pow(p, 1.35) * 2.5;
        const cutoff = 2400 + p * 2600;
        try {
          src.playbackRate.setTargetAtTime(speed, ctx.currentTime, 0.04);
          if (filter) filter.frequency.setTargetAtTime(cutoff, ctx.currentTime, 0.05);
        } catch {}
        rafAccel = requestAnimationFrame(tickSpeed);
      };
      rafAccel = requestAnimationFrame(tickSpeed);
    };

    try {
      ctx = typeof window.getWaitAudioContext === 'function' ? window.getWaitAudioContext() : new AudioCtx();
      if (!ctx) return null;
      if (ctx.state === 'running') {
        beginTapeRewind();
      } else {
        ctx.resume().then(() => { if (!stopped) beginTapeRewind(); }).catch(() => {});
        unlockBound = () => {
          if (stopped) return;
          ctx.resume().then(() => { if (!stopped) beginTapeRewind(); }).catch(() => {});
        };
        window.addEventListener('pointerdown', unlockBound, { once: true, passive: true });
        window.addEventListener('keydown', unlockBound, { once: true, passive: true });
      }
    } catch { return null; }

    rewindCtl = {
      stop: () => {
        if (stopped) return;
        stopped = true;
        if (rafAccel) cancelAnimationFrame(rafAccel);
        if (unlockBound) {
          window.removeEventListener('pointerdown', unlockBound);
          window.removeEventListener('keydown', unlockBound);
        }
        try {
          if (ctx && gain) {
            const t = ctx.currentTime;
            gain.gain.cancelScheduledValues(t);
            gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
          }
          setTimeout(() => {
            try { src?.stop(); src?.disconnect(); filter?.disconnect(); gain?.disconnect(); } catch {}
          }, 170);
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
    const line = `MY-ARCHIVE 95 WIN95 PRELOADER ★ REWINDING NOSTALGIC INTRO PARODY ★ ${files.join(' /// ')} ★ `;
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
    const clamped = Math.max(0, Math.min(1, ratio));
    currentRatio = clamped;
    const pct = Math.round(clamped * 100);
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
    currentRatio = 1;
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

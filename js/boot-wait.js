// ============================================================
// MY-ARCHIVE 95 OS — Pre-Click Wait Screen
// ============================================================

window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
window.__MOD_VERSIONS.bootWait = 'v2026.11.25-test-txt-binary-audio';

const WAIT_SETUP_KEY = 'myarchive95_setup_v1';

const waitSafeEsc = str => (typeof window.esc === 'function'
  ? window.esc(str)
  : String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'));

function isWaitSoundEnabled() {
  if (typeof window.__WIN95_SOUND_ENABLED === 'boolean') return window.__WIN95_SOUND_ENABLED;
  try {
    const parsed = JSON.parse(localStorage.getItem(WAIT_SETUP_KEY) || 'null');
    return typeof parsed?.sound === 'boolean' ? parsed.sound : true;
  } catch { return true; }
}

let __waitAudioCtx = null;
let __activeForwardLoop = null;
let __waitScreenMounted = false;

function getWaitAudioContext() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!__waitAudioCtx || __waitAudioCtx.state === 'closed') __waitAudioCtx = new AudioCtx();
  if (__waitAudioCtx.state === 'suspended') __waitAudioCtx.resume().catch(() => {});
  return __waitAudioCtx;
}

function stopPreClickWaitAudio() {
  try { __activeForwardLoop?.stop?.(); } catch {}
  __activeForwardLoop = null;
}

function createSwitchTransientBurst(ctx, startTime, durationSec, centerFreq, peakGain, highpassHz = 600, qFactor = 2.6, decayPow = 2.8) {
  const len = Math.max(32, Math.floor(ctx.sampleRate * durationSec));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const p = i / len;
    ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - p, decayPow) * (i < ctx.sampleRate * 0.002 ? 1.35 : 1.0);
  }
  const src = ctx.createBufferSource(); src.buffer = buf;
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.setValueAtTime(highpassHz, startTime);
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(centerFreq, startTime); bp.Q.setValueAtTime(qFactor, startTime);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0005, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.0018);
  gain.gain.exponentialRampToValueAtTime(0.0004, startTime + durationSec);
  src.connect(hp); hp.connect(bp); bp.connect(gain); gain.connect(ctx.destination);
  src.start(startTime); src.stop(startTime + durationSec + 0.006);
}

function playButtonClickSound(options = {}) {
  if (!isWaitSoundEnabled()) return;
  try {
    const ctx = getWaitAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const gap = typeof options.gapSec === 'number' ? options.gapSec : 0.072;
    const vol = typeof options.volume === 'number' ? options.volume : 1.0;

    const oscIn = ctx.createOscillator(), bodyIn = ctx.createOscillator(), gainIn = ctx.createGain(), bodyGainIn = ctx.createGain();
    oscIn.type = 'triangle'; oscIn.frequency.setValueAtTime(520, now); oscIn.frequency.exponentialRampToValueAtTime(175, now + 0.028);
    bodyIn.type = 'square'; bodyIn.frequency.setValueAtTime(260, now); bodyIn.frequency.exponentialRampToValueAtTime(115, now + 0.022);
    bodyGainIn.gain.setValueAtTime(0.11 * vol, now); bodyGainIn.gain.exponentialRampToValueAtTime(0.0004, now + 0.024);
    gainIn.gain.setValueAtTime(0.0005, now); gainIn.gain.linearRampToValueAtTime(0.26 * vol, now + 0.0025); gainIn.gain.exponentialRampToValueAtTime(0.0004, now + 0.034);
    oscIn.connect(gainIn); bodyIn.connect(bodyGainIn); bodyIn.connect(gainIn); gainIn.connect(ctx.destination);
    oscIn.start(now); bodyIn.start(now); oscIn.stop(now + 0.038); bodyIn.stop(now + 0.03);
    createSwitchTransientBurst(ctx, now, 0.028, 980, 0.26 * vol, 380, 1.8, 3.2);

    const tOut = now + gap;
    const oscOut = ctx.createOscillator(), snapOut = ctx.createOscillator(), filterOut = ctx.createBiquadFilter(), gainOut = ctx.createGain();
    oscOut.type = 'square'; oscOut.frequency.setValueAtTime(1450, tOut); oscOut.frequency.exponentialRampToValueAtTime(3650, tOut + 0.018);
    snapOut.type = 'triangle'; snapOut.frequency.setValueAtTime(2950, tOut); snapOut.frequency.exponentialRampToValueAtTime(4200, tOut + 0.014);
    filterOut.type = 'bandpass'; filterOut.frequency.setValueAtTime(2850, tOut); filterOut.Q.setValueAtTime(1.9, tOut);
    gainOut.gain.setValueAtTime(0.0005, tOut); gainOut.gain.linearRampToValueAtTime(0.25 * vol, tOut + 0.002); gainOut.gain.exponentialRampToValueAtTime(0.0004, tOut + 0.026);
    oscOut.connect(filterOut); snapOut.connect(filterOut); filterOut.connect(gainOut); gainOut.connect(ctx.destination);
    oscOut.start(tOut); snapOut.start(tOut); oscOut.stop(tOut + 0.03); snapOut.stop(tOut + 0.022);
    createSwitchTransientBurst(ctx, tOut, 0.022, 3250, 0.32 * vol, 1400, 2.4, 3.6);
    createSwitchTransientBurst(ctx, tOut + 0.024, 0.014, 2400, 0.09 * vol, 1200, 3.0, 4.2);
  } catch {}
}

// 클릭 대기 화면 진입 시 순방향으로 반복 재생되는 버퍼 생성
function createForwardParodyBuffer(ctx) {
  if (typeof window.createNostalgicParodyForwardBuffer === 'function') {
    return window.createNostalgicParodyForwardBuffer(ctx);
  }
  const sr = ctx.sampleRate;
  const beatSec = 60 / 90;
  const melodyNotes = [
    [440.00, 3], [392.00, 4],
    [440.00, 3], [392.00, 4],
    [293.66, 1], [392.00, 3], [349.23, 4],
    [293.66, 1], [392.00, 3], [349.23, 4]
  ];
  const totalBeats = melodyNotes.reduce((acc, [, b]) => acc + b, 0);
  const len = Math.max(1, Math.floor(sr * totalBeats * beatSec));
  const buf = ctx.createBuffer(1, len, sr);
  const ch = buf.getChannelData(0);

  const segments = [];
  let cursor = 0;
  for (const [freq, beats] of melodyNotes) {
    const startSec = cursor * beatSec;
    const durSec = beats * beatSec;
    segments.push({ freq, startSec, endSec: startSec + durSec, durSec });
    cursor += beats;
  }

  let segIdx = 0;
  for (let i = 0; i < len; i++) {
    const t = i / sr;
    while (segIdx < segments.length - 1 && t >= segments[segIdx].endSec) segIdx++;
    const seg = segments[segIdx];
    const localT = Math.max(0, t - seg.startSec);
    const remainT = Math.max(0, seg.endSec - t);
    const env = Math.min(1, localT / 0.022) * Math.min(1, remainT / 0.045) * (0.68 + 0.32 * Math.exp(-localT * 1.45));
    const tone =
      Math.sin(2 * Math.PI * seg.freq * t) * 0.56 +
      Math.sin(2 * Math.PI * seg.freq * 2 * t) * 0.14 +
      Math.sin(2 * Math.PI * seg.freq * 0.5 * t) * 0.22;
    const wow = 1 + 0.0045 * Math.sin(2 * Math.PI * 2.1 * t);
    ch[i] = Math.max(-0.95, Math.min(0.95, tone * env * (0.94 + 0.06 * wow)));
  }
  return buf;
}

function resolveForwardBufferAsync(ctx) {
  if (typeof window.loadTestTxtForwardBuffer === 'function') {
    return window.loadTestTxtForwardBuffer(ctx).catch(() => createForwardParodyBuffer(ctx));
  }
  return Promise.resolve(createForwardParodyBuffer(ctx));
}

function startForwardNostalgicLoop() {
  stopPreClickWaitAudio();
  if (!isWaitSoundEnabled() || !__waitScreenMounted) return null;
  try {
    const ctx = getWaitAudioContext();
    if (!ctx) return null;

    const targetGain = 0.16;
    const minGain = 0.0002;
    let stopped = false, started = false, unlockFn = null, launchSeq = 0;
    let loopTimerId = null;
    let activeSources = [];
    let currentGainNode = null;

    const cleanupNodes = (entry) => {
      try { entry.timerId && clearTimeout(entry.timerId); } catch {}
      try { entry.src?.stop(); } catch {}
      try {
        entry.src?.disconnect();
        entry.filter?.disconnect();
        entry.gain?.disconnect();
      } catch {}
    };

    const launchLoop = () => {
      if (stopped || started || !ctx || !__waitScreenMounted) return;
      if (window.__PRELOAD_REWIND_ACTIVE) return;
      started = true;
      const seq = ++launchSeq;

      resolveForwardBufferAsync(ctx).then((buf) => {
        if (stopped || seq !== launchSeq || !ctx || !__waitScreenMounted || window.__PRELOAD_REWIND_ACTIVE) return;
        if (!buf || !buf.duration || buf.duration <= 0.1) return;

        const dur = buf.duration;
        const xfadeSec = Math.min(0.06, dur * 0.03);
        const stepSec = Math.max(0.15, dur - xfadeSec);

        const spawnSegment = (startAt, fadeInSec, isFirst) => {
          if (stopped || seq !== launchSeq || !ctx || !__waitScreenMounted || window.__PRELOAD_REWIND_ACTIVE) return;

          const t0 = Math.max(ctx.currentTime + 0.005, startAt);
          const src = ctx.createBufferSource();
          src.buffer = buf;
          src.loop = false;
          src.playbackRate.setValueAtTime(1.0, t0);

          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(2800, t0);
          filter.Q.setValueAtTime(0.9, t0);

          const gain = ctx.createGain();
          gain.gain.setValueAtTime(minGain, t0);
          const actualFadeIn = isFirst ? Math.min(0.12, fadeInSec) : fadeInSec;
          gain.gain.linearRampToValueAtTime(targetGain, t0 + actualFadeIn);

          // 루프 끝 구간에서 서서히 볼륨 낮추기
          const fadeOutStart = t0 + stepSec;
          const fadeOutEnd = t0 + dur;
          gain.gain.setValueAtTime(targetGain, fadeOutStart);
          gain.gain.linearRampToValueAtTime(minGain, fadeOutEnd);

          src.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          src.start(t0, 0, dur);
          src.stop(fadeOutEnd + 0.02);

          currentGainNode = gain;
          const entry = { src, filter, gain, timerId: null };
          activeSources.push(entry);

          src.onended = () => {
            activeSources = activeSources.filter((item) => item !== entry);
            try {
              src.disconnect();
              filter.disconnect();
              gain.disconnect();
            } catch {}
          };

          // 끝나기 xfadeSec 전에 미리 다음 루프(첫 부분) 시작
          const nextStartAt = fadeOutStart;
          const delayMs = Math.max(10, (nextStartAt - ctx.currentTime) * 1000);
          loopTimerId = setTimeout(() => {
            if (stopped || seq !== launchSeq || !__waitScreenMounted || window.__PRELOAD_REWIND_ACTIVE) return;
            spawnSegment(nextStartAt, xfadeSec, false);
          }, delayMs);
          entry.timerId = loopTimerId;
        };

        spawnSegment(ctx.currentTime, xfadeSec, true);
      }).catch(() => {});
    };

    const tryWhenUnlocked = () => {
      if (stopped || started || !__waitScreenMounted || window.__PRELOAD_REWIND_ACTIVE) return;
      if (ctx.state === 'running') {
        launchLoop();
      } else {
        ctx.resume().then(() => { if (!stopped && __waitScreenMounted && !window.__PRELOAD_REWIND_ACTIVE) launchLoop(); }).catch(() => {});
      }
    };

    window.__allowWaitForwardLoop = tryWhenUnlocked;

    if (!window.__PRELOAD_REWIND_ACTIVE) {
      tryWhenUnlocked();
    }

    unlockFn = () => {
      if (!stopped && __waitScreenMounted && !window.__PRELOAD_REWIND_ACTIVE) tryWhenUnlocked();
    };
    window.addEventListener('pointerdown', unlockFn, { passive: true });
    window.addEventListener('keydown', unlockFn, { passive: true });

    const ctl = {
      resume: () => {
        if (stopped || !__waitScreenMounted || window.__PRELOAD_REWIND_ACTIVE) return;
        try {
          if (!started) tryWhenUnlocked();
          if (currentGainNode && ctx) {
            const t = ctx.currentTime;
            currentGainNode.gain.cancelScheduledValues(t);
            currentGainNode.gain.setValueAtTime(Math.max(0.0005, currentGainNode.gain.value), t);
            currentGainNode.gain.linearRampToValueAtTime(targetGain, t + 0.08);
          }
        } catch {}
      },
      stop: () => {
        if (stopped) return;
        stopped = true;
        launchSeq += 1;
        if (loopTimerId) {
          clearTimeout(loopTimerId);
          loopTimerId = null;
        }
        if (__activeForwardLoop === ctl) __activeForwardLoop = null;
        if (window.__allowWaitForwardLoop === tryWhenUnlocked) window.__allowWaitForwardLoop = null;
        if (unlockFn) {
          window.removeEventListener('pointerdown', unlockFn);
          window.removeEventListener('keydown', unlockFn);
        }
        const list = activeSources.splice(0, activeSources.length);
        for (const item of list) {
          try {
            if (ctx && item.gain) {
              const t = ctx.currentTime;
              item.gain.gain.cancelScheduledValues(t);
              item.gain.gain.setValueAtTime(0.0001, t);
            }
          } catch {}
          cleanupNodes(item);
        }
        currentGainNode = null;
      }
    };

    __activeForwardLoop = ctl;
    return ctl;
  } catch { return null; }
}

function startBlurredBackground3dCrt() {
  document.getElementById('pre-click-blurred-3d-crt')?.remove();
  const backdrop = document.createElement('div');
  backdrop.id = 'pre-click-blurred-3d-crt';
  backdrop.style.cssText = 'position:fixed;inset:0;z-index:1000001;pointer-events:none;background:#05070a;filter:blur(8px) brightness(0.68) contrast(1.06);transform:scale(1.05);opacity:1;transition:filter 0.45s ease,transform 0.45s ease,opacity 0.35s ease;overflow:hidden;';
  document.body.appendChild(backdrop);

  let rafId = 0, renderer = null, stopped = false, onResize = null;
  const ensureThree = () => (window.THREE
    ? Promise.resolve(window.THREE)
    : typeof window.loadThreeJsLibrary === 'function'
      ? window.loadThreeJsLibrary()
      : new Promise((res, rej) => {
          const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js'; s.async = true;
          s.onload = () => (window.THREE ? res(window.THREE) : rej(new Error('THREE missing'))); s.onerror = rej; document.head.appendChild(s);
        }));

  const buildFallbackCrt = THREE => {
    if (typeof window.buildLowPolyCrt3dGroup === 'function') return window.buildLowPolyCrt3dGroup(THREE);
    const g = new THREE.Group();
    const shell = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.5, 1.4), new THREE.MeshStandardMaterial({ color: 0xc8c3b4, roughness: 0.8, flatShading: true }));
    const screen = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 0.2), new THREE.MeshStandardMaterial({ color: 0x163848, emissive: 0x0d2836, flatShading: true }));
    screen.position.set(0, 0.05, 0.68);
    g.add(shell, screen);
    return g;
  };

  ensureThree().then(THREE => {
    if (stopped) return;
    const w = window.innerWidth || 1280, h = window.innerHeight || 720;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x06080c);
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.05, 100); camera.position.set(0.35, 0.25, 7.6); camera.lookAt(0, -0.1, 0);
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(w, h); renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    backdrop.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.15));
    const key = new THREE.DirectionalLight(0xfff7e6, 1.9); key.position.set(4.5, 5.5, 6.0); scene.add(key);
    const rim = new THREE.DirectionalLight(0x9ec5ff, 0.9); rim.position.set(-5.0, 2.0, -4.0); scene.add(rim);

    const crt = buildFallbackCrt(THREE); crt.position.set(0.65, -0.05, -0.8); crt.rotation.set(0.08, 0.78, 0); scene.add(crt);
    onResize = () => {
      if (stopped || !renderer) return;
      camera.aspect = (window.innerWidth || 1280) / (window.innerHeight || 720);
      camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth || 1280, window.innerHeight || 720);
    };
    window.addEventListener('resize', onResize);

    const renderLoop = now => {
      if (stopped) return;
      crt.rotation.y = 0.78 + Math.sin(now * 0.0008) * 0.06;
      crt.position.y = -0.05 + Math.cos(now * 0.0011) * 0.04;
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(renderLoop);
    };
    rafId = requestAnimationFrame(renderLoop);
  }).catch(() => {});

  return {
    focusAndClear: () => { backdrop.style.filter = 'blur(0px) brightness(1) contrast(1)'; backdrop.style.transform = 'scale(1)'; },
    stop: () => {
      if (stopped) return; stopped = true;
      if (onResize) window.removeEventListener('resize', onResize);
      if (rafId) cancelAnimationFrame(rafId);
      backdrop.style.opacity = '0';
      setTimeout(() => { try { renderer?.dispose(); renderer?.domElement?.remove(); } catch {} backdrop.remove(); }, 360);
    }
  };
}

function startBrutalLightRays() {
  document.getElementById('brutal-wait-light-rays')?.remove();
  if (!document.getElementById('brutal-wait-rays-style')) {
    const st = document.createElement('style');
    st.id = 'brutal-wait-rays-style';
    st.textContent = `
      #brutal-wait-light-rays{position:fixed;inset:0;z-index:1000003;pointer-events:none;overflow:hidden;opacity:1;transition:opacity .22s ease}
      #brutal-wait-light-rays.fade-out{opacity:0}
      .brutal-light-beam{position:absolute;top:-35%;width:var(--beam-w,110px);height:170%;pointer-events:none;opacity:0;transform:translate3d(var(--bx,0px),0,0) rotate(var(--ang,-28deg)) skewX(-14deg);border-left:3px solid rgba(17,17,17,.65);border-right:3px solid rgba(17,17,17,.65);background:linear-gradient(90deg,transparent 0%,var(--beam-col,rgba(255,216,59,.22)) 22%,rgba(255,255,255,.32) 50%,var(--beam-col,rgba(255,216,59,.22)) 78%,transparent 100%);mix-blend-mode:screen;animation:brutalBeamFlash var(--dur,1.4s) cubic-bezier(.16,1,.3,1) forwards}
      @keyframes brutalBeamFlash{0%{opacity:0;transform:translate3d(var(--bx,0px),-8%,0) rotate(var(--ang,-28deg)) scaleX(.6)}25%{opacity:.85;transform:translate3d(var(--bx,0px),0%,0) rotate(var(--ang,-28deg)) scaleX(1.05)}65%{opacity:.45;transform:translate3d(calc(var(--bx,0px) + 28px),2%,0) rotate(var(--ang,-28deg)) scaleX(.92)}100%{opacity:0;transform:translate3d(calc(var(--bx,0px) + 56px),6%,0) rotate(var(--ang,-28deg)) scaleX(.5)}}
    `;
    document.head.appendChild(st);
  }

  const wrap = document.createElement('div');
  wrap.id = 'brutal-wait-light-rays';
  document.body.appendChild(wrap);

  const palette = ['rgba(255,216,59,0.22)', 'rgba(72,219,251,0.20)', 'rgba(255,71,87,0.14)', 'rgba(255,255,255,0.24)'];
  let stopped = false, timerId = null;

  const spawnBeam = () => {
    if (stopped) return;
    const beam = document.createElement('div');
    beam.className = 'brutal-light-beam';
    const vw = window.innerWidth || 1280;
    const bx = Math.floor(Math.random() * (vw * 1.1) - vw * 0.15);
    const ang = (-36 + Math.random() * 72).toFixed(1);
    const bw = Math.floor(54 + Math.random() * 120);
    const dur = (0.85 + Math.random() * 1.15).toFixed(2);
    const col = palette[Math.floor(Math.random() * palette.length)];

    beam.style.setProperty('--bx', `${bx}px`);
    beam.style.setProperty('--ang', `${ang}deg`);
    beam.style.setProperty('--beam-w', `${bw}px`);
    beam.style.setProperty('--dur', `${dur}s`);
    beam.style.setProperty('--beam-col', col);
    wrap.appendChild(beam);

    setTimeout(() => beam.remove(), Math.ceil(parseFloat(dur) * 1000) + 80);
    timerId = setTimeout(spawnBeam, Math.floor(420 + Math.random() * 980));
  };

  timerId = setTimeout(spawnBeam, 280);

  return () => {
    if (stopped) return;
    stopped = true;
    if (timerId) clearTimeout(timerId);
    wrap.classList.add('fade-out');
    setTimeout(() => wrap.remove(), 240);
  };
}

function ensurePreClickNoiseTitleStyles() {
  if (document.getElementById('pre-click-noise-title-style')) return;
  const style = document.createElement('style');
  style.id = 'pre-click-noise-title-style';
  style.textContent = `
    #pre-click-noise-title-layer{position:fixed;inset:0;z-index:1000005;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:space-between;perspective:920px;overflow:hidden;opacity:1;transition:opacity .24s ease;background-image:linear-gradient(to right,rgba(255,216,59,.07) 1px,transparent 1px),linear-gradient(to bottom,rgba(72,219,251,.07) 1px,transparent 1px);background-size:28px 28px}
    #pre-click-noise-title-layer.fade-out{opacity:0}
    .brutal-gate-marquee{width:100%;overflow:hidden;white-space:nowrap;border-bottom:3px solid #111;border-top:3px solid #111;padding:8px 0;font-family:'Pretendard Variable','DungGeunMo','Consolas',monospace;font-size:clamp(.78rem,1.35vw,.96rem);font-weight:900;letter-spacing:.05em;flex-shrink:0}
    .brutal-gate-marquee.top-strip{background:#ffd83b;color:#111;border-top:0;box-shadow:0 4px 0 #111}
    .brutal-gate-marquee.bottom-strip{background:#111;color:#48dbfb;border-bottom:0;box-shadow:0 -4px 0 #ffd83b}
    .brutal-gate-track{display:inline-flex;gap:22px;will-change:transform;animation:brutalGateScrollLeft 22s linear infinite}
    .brutal-gate-marquee.bottom-strip .brutal-gate-track{animation:brutalGateScrollRight 25s linear infinite}
    .brutal-gate-sep{color:#ff4757}
    .brutal-gate-marquee.bottom-strip .brutal-gate-sep{color:#ffd83b}
    @keyframes brutalGateScrollLeft{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    @keyframes brutalGateScrollRight{0%{transform:translateX(-50%)}100%{transform:translateX(0)}}
    #pre-click-noise-title-box{width:56vw;max-width:800px;min-width:280px;max-height:62vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#fff;font-family:'Pretendard Variable','DungGeunMo','Consolas',monospace;transform-style:preserve-3d;will-change:transform;animation:noiseTitleMicroJitter .18s steps(2,end) infinite;padding:10px 0}
    .brutal-gate-kicker{display:inline-block;background:#48dbfb;color:#111;border:3px solid #111;box-shadow:4px 4px 0 #111;padding:3px 12px;font-size:clamp(.75rem,1.3vw,.95rem);font-weight:900;letter-spacing:.04em;margin-bottom:clamp(8px,1.2vh,14px)}
    .noise-bleed-text{position:relative;color:#fff;text-shadow:-6px 0 6px rgba(255,255,255,.42),6px 0 6px rgba(255,255,255,.42),-14px 0 12px rgba(210,235,255,.2),14px 0 12px rgba(255,220,220,.2);animation:horizontalNoiseSmear 2.4s infinite}
    .noise-bleed-text::before,.noise-bleed-text::after{content:attr(data-text);position:absolute;inset:0;pointer-events:none;color:#fff;opacity:.62}
    .noise-bleed-text::before{transform:translateX(-4px);clip-path:inset(18% 0 52% 0);text-shadow:-8px 0 5px rgba(255,255,255,.65);animation:smearSliceLeft 1.35s infinite steps(2,end)}
    .noise-bleed-text::after{transform:translateX(4px);clip-path:inset(58% 0 14% 0);text-shadow:8px 0 5px rgba(255,255,255,.65);animation:smearSliceRight 1.55s infinite steps(2,end)}
    .noise-main-title{font-size:clamp(2.1rem,4.4vw,4.1rem);font-weight:900;letter-spacing:.08em;line-height:1.12;margin-bottom:clamp(8px,1.3vh,16px)}
    .noise-maker-line{font-size:clamp(1rem,1.9vw,1.75rem);font-weight:800;letter-spacing:.04em;line-height:1.3;margin-bottom:clamp(12px,1.8vh,22px)}
    .brutal-retrace-pill{display:inline-block;background:#ffd83b;color:#111;border:3px solid #111;box-shadow:5px 5px 0 #ff4757;padding:clamp(6px,1vh,11px) clamp(16px,2.5vw,28px);margin-bottom:clamp(10px,1.6vh,18px);transform:rotate(-1.5deg);animation:brutalCtaPulse 1.3s ease-in-out infinite alternate}
    .noise-retrace-cta{font-size:clamp(1.05rem,2vw,1.85rem);font-weight:900;letter-spacing:.1em;line-height:1.2;color:#111;text-shadow:none;animation:none}
    .noise-retrace-cta::before,.noise-retrace-cta::after{display:none}
    @keyframes brutalCtaPulse{0%{transform:rotate(-1.5deg) translateY(0)}100%{transform:rotate(1deg) translateY(-3px)}}
    .noise-copyleft-row{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-size:clamp(.82rem,1.45vw,1.25rem);font-weight:800;letter-spacing:.05em;line-height:1.25;opacity:.92}
    .flipped-copyright-symbol{display:inline-block;transform:scale(-1,-1);font-weight:900;text-shadow:-4px 0 5px rgba(255,255,255,.5),4px 0 5px rgba(255,255,255,.5)}
    @keyframes noiseTitleMicroJitter{0%{margin-left:0;margin-top:0}25%{margin-left:-1.5px;margin-top:1px}50%{margin-left:1.5px;margin-top:-1px}75%{margin-left:-1px;margin-top:-1px}100%{margin-left:1px;margin-top:1px}}
    @keyframes horizontalNoiseSmear{0%,84%,100%{transform:skewX(0) scaleX(1)}86%{transform:skewX(-7deg) scaleX(1.03)}89%{transform:skewX(6deg) scaleX(.98)}92%{transform:skewX(-4deg) scaleX(1.02)}}
    @keyframes smearSliceLeft{0%,78%,100%{transform:translateX(-3px)}82%{transform:translateX(-11px)}86%{transform:translateX(4px)}}
    @keyframes smearSliceRight{0%,80%,100%{transform:translateX(3px)}84%{transform:translateX(12px)}88%{transform:translateX(-5px)}}
  `;
  document.head.appendChild(style);
}

function startPreClickNoiseTitleLayer() {
  ensurePreClickNoiseTitleStyles();
  document.getElementById('pre-click-noise-title-layer')?.remove();

  const topItems = ['MY-ARCHIVE 95 WORKSTATION', 'CULTURE & ART ARCHIVE OS', '3D CRT BOOT SEQUENCE READY', 'CLICK ANYWHERE TO RETRACE'];
  const bottomItems = ['AWARD BIOS v4.51PG', 'JUKEBOX · BBS · TIMELINE · QUIZ', 'NEO-BRUTALISM + WIN95', 'TAEYANG MUN (nlasdnfkl2)'];
  const buildTrackHtml = items => [...items, ...items, ...items, ...items].map(txt => `<span>${waitSafeEsc(txt)}</span><span class="brutal-gate-sep">✦</span>`).join('');

  const layer = document.createElement('div');
  layer.id = 'pre-click-noise-title-layer';
  layer.innerHTML = `
    <div class="brutal-gate-marquee top-strip" aria-hidden="true"><div class="brutal-gate-track">${buildTrackHtml(topItems)}</div></div>
    <div id="pre-click-noise-title-box">
      <div class="brutal-gate-kicker">SIGNAL STANDBY // CH-95</div>
      <div class="noise-bleed-text noise-main-title" data-text="MY-ARCHIVE 95">MY-ARCHIVE 95</div>
      <div class="noise-bleed-text noise-maker-line" data-text="만든 이: TAEYANG MUN (nlasdnfkl2)">만든 이: TAEYANG MUN (nlasdnfkl2)</div>
      <div class="brutal-retrace-pill"><div class="noise-bleed-text noise-retrace-cta" data-text="CLICK TO RETRACE">CLICK TO RETRACE</div></div>
      <div class="noise-copyleft-row"><span class="flipped-copyright-symbol" aria-hidden="true">©</span><span class="noise-bleed-text" data-text="COPYLEFT TAEYANG MUN (nlasdnfkl2)">COPYLEFT TAEYANG MUN (nlasdnfkl2)</span></div>
    </div>
    <div class="brutal-gate-marquee bottom-strip" aria-hidden="true"><div class="brutal-gate-track">${buildTrackHtml(bottomItems)}</div></div>
  `;
  document.body.appendChild(layer);

  const box = layer.querySelector('#pre-click-noise-title-box');
  let targetX = 0, targetY = 0, rotX = 0, rotY = 0, rafId = 0, stopped = false;

  const onPointerMove = e => {
    targetY = ((e.clientX / (window.innerWidth || 1280)) * 2 - 1) * 9;
    targetX = -((e.clientY / (window.innerHeight || 720)) * 2 - 1) * 7;
  };
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  const tick3dGaze = now => {
    if (stopped) return;
    rotY += ((targetY + Math.sin(now * 0.0014) * 3.2) - rotY) * 0.09;
    rotX += ((targetX + Math.cos(now * 0.0011) * 2.2) - rotX) * 0.09;
    if (box) box.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translate3d(${(rotY * 1.1).toFixed(1)}px,${(-rotX * 0.9).toFixed(1)}px,0)`;
    rafId = requestAnimationFrame(tick3dGaze);
  };
  rafId = requestAnimationFrame(tick3dGaze);

  return () => {
    if (stopped) return; stopped = true;
    window.removeEventListener('pointermove', onPointerMove);
    if (rafId) cancelAnimationFrame(rafId);
    layer.classList.add('fade-out');
    setTimeout(() => layer.remove(), 250);
  };
}

function startFullScreenStaticEffect() {
  if (!document.getElementById('fullscreen-crt-static-style')) {
    const st = document.createElement('style'); st.id = 'fullscreen-crt-static-style';
    st.textContent = `#fullscreen-crt-static-overlay{position:fixed;inset:0;z-index:1000010;pointer-events:none;overflow:hidden;opacity:.9;mix-blend-mode:screen;transition:opacity .25s ease}#fullscreen-crt-static-overlay.fade-out{opacity:0}#fullscreen-crt-static-canvas{width:100%;height:100%;display:block}#fullscreen-crt-scanlines{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(255,255,255,.045) 0,rgba(255,255,255,.045) 1px,rgba(0,0,0,.24) 1px,rgba(0,0,0,.24) 3px);animation:staticScanRoll .35s linear infinite}@keyframes staticScanRoll{0%{transform:translateY(0)}100%{transform:translateY(3px)}}`;
    document.head.appendChild(st);
  }
  document.getElementById('fullscreen-crt-static-overlay')?.remove();

  const wrap = document.createElement('div'); wrap.id = 'fullscreen-crt-static-overlay';
  const canvas = document.createElement('canvas'); canvas.id = 'fullscreen-crt-static-canvas';
  const scanlines = document.createElement('div'); scanlines.id = 'fullscreen-crt-scanlines';
  wrap.append(canvas, scanlines);
  document.body.appendChild(wrap);

  const ctx = canvas.getContext('2d'), cw = 256, ch = 144;
  canvas.width = cw; canvas.height = ch;
  let rafId = 0, stopped = false;

  const renderStatic = () => {
    if (stopped) return;
    const img = ctx.createImageData(cw, ch), buf = img.data;
    for (let i = 0; i < buf.length; i += 4) {
      const n = Math.random(), spark = n > 0.985 ? 235 : Math.floor(n * 85);
      buf[i] = buf[i + 1] = buf[i + 2] = spark;
      buf[i + 3] = n > 0.92 ? 52 : 18;
    }
    ctx.putImageData(img, 0, 0);
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(0, Math.floor(Math.random() * ch), cw, 1 + Math.floor(Math.random() * 2));
    rafId = requestAnimationFrame(renderStatic);
  };
  rafId = requestAnimationFrame(renderStatic);

  return () => {
    if (stopped) return; stopped = true;
    if (rafId) cancelAnimationFrame(rafId);
    wrap.classList.add('fade-out');
    setTimeout(() => wrap.remove(), 220);
  };
}

function mountPreClickStartScreen(onStartBoot) {
  document.getElementById('pre-click-start-hit-layer')?.remove();
  __waitScreenMounted = true;

  const hitLayer = document.createElement('div');
  hitLayer.id = 'pre-click-start-hit-layer';
  hitLayer.setAttribute('role', 'button'); hitLayer.setAttribute('tabindex', '0'); hitLayer.setAttribute('aria-label', '화면을 클릭하여 부팅 시작');
  hitLayer.style.cssText = 'position:fixed;inset:0;z-index:1000020;background:transparent;cursor:pointer;';
  document.body.appendChild(hitLayer);

  const blur3d = startBlurredBackground3dCrt();
  const stopRays = startBrutalLightRays();
  const stopTitle = startPreClickNoiseTitleLayer();
  const stopStatic = startFullScreenStaticEffect();
  const forwardLoop = startForwardNostalgicLoop();

  let triggered = false;
  const triggerStart = e => {
    if (triggered) return;
    if (e?.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
    if (e?.type === 'keydown') e.preventDefault();
    triggered = true;
    __waitScreenMounted = false;

    hitLayer.style.pointerEvents = 'none';
    playButtonClickSound({ gapSec: 0.065, volume: 1.05 });
    // 클릭 즉시 순재생 루프 정지(바이오스 화면 진입 시 잔여음 방지)
    forwardLoop?.stop?.();
    stopPreClickWaitAudio();
    stopRays(); stopTitle(); stopStatic();
    blur3d.focusAndClear();

    setTimeout(() => {
      stopPreClickWaitAudio();
      blur3d.stop(); hitLayer.remove();
      if (typeof onStartBoot === 'function') onStartBoot();
    }, 360);
  };

  hitLayer.addEventListener('click', triggerStart);
  hitLayer.addEventListener('keydown', triggerStart);

  return () => {
    triggered = true;
    __waitScreenMounted = false;
    hitLayer.removeEventListener('click', triggerStart); hitLayer.removeEventListener('keydown', triggerStart);
    stopPreClickWaitAudio();
    stopRays(); stopTitle(); stopStatic(); blur3d.stop();
  };
}

Object.assign(window, {
  getWaitAudioContext, playButtonClickSound, startForwardNostalgicLoop,
  stopPreClickWaitAudio, startBlurredBackground3dCrt, startBrutalLightRays,
  startPreClickNoiseTitleLayer, startFullScreenStaticEffect, mountPreClickStartScreen
});

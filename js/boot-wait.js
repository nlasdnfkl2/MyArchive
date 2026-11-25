// ============================================================
// MY-ARCHIVE 95 OS — Pre-Click Wait Screen
// ============================================================

window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
window.__MOD_VERSIONS.bootWait = 'v2026.11.25-ddal-kkak-split';

const WAIT_SETUP_KEY = 'myarchive95_setup_v1';

function waitSafeEsc(str) {
  if (typeof window.esc === 'function') return window.esc(str);
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isWaitSoundEnabled() {
  if (typeof window.__WIN95_SOUND_ENABLED === 'boolean') return window.__WIN95_SOUND_ENABLED;
  try {
    const raw = localStorage.getItem(WAIT_SETUP_KEY);
    if (!raw) return true;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed.sound === 'boolean' ? parsed.sound : true;
  } catch {
    return true;
  }
}

// ============================================================
// 공유 AudioContext & "딸-깍" (들어가는 소리 + 나오는 소리)
// ============================================================
let __waitAudioCtx = null;

function getWaitAudioContext() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!__waitAudioCtx || __waitAudioCtx.state === 'closed') {
    __waitAudioCtx = new AudioCtx();
  }
  if (__waitAudioCtx.state === 'suspended') {
    __waitAudioCtx.resume().catch(() => {});
  }
  return __waitAudioCtx;
}

/**
 * 스위치 반동 노이즈 버스트 생성 ('딸' 또는 '깍' 타격감용)
 */
function createSwitchTransientBurst(ctx, startTime, durationSec, centerFreq, peakGain, highpassHz = 600) {
  const sampleCount = Math.max(32, Math.floor(ctx.sampleRate * durationSec));
  const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < sampleCount; i++) {
    const env = Math.pow(1 - i / sampleCount, 2.4);
    data[i] = (Math.random() * 2 - 1) * env;
  }

  const src = ctx.createBufferSource();
  src.buffer = buffer;

  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.setValueAtTime(highpassHz, startTime);

  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(centerFreq, startTime);
  bp.Q.setValueAtTime(2.6, startTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(peakGain, startTime);
  gain.gain.exponentialRampToValueAtTime(0.0004, startTime + durationSec);

  src.connect(hp);
  hp.connect(bp);
  bp.connect(gain);
  gain.connect(ctx.destination);

  src.start(startTime);
  src.stop(startTime + durationSec + 0.005);
}

/**
 * 1단계: "딸" (버튼이 들어가는 소리 — 하강 피치 + 둔탁한 접촉)
 * 2단계: "깍" (버튼이 나오는 소리 — 상승/스냅 피치 + 날카로운 복귀)
 */
function playButtonClickSound(options = {}) {
  if (!isWaitSoundEnabled()) return;
  try {
    const ctx = getWaitAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const releaseGapSec = typeof options.gapSec === 'number' ? options.gapSec : 0.065;
    const volumeScale = typeof options.volume === 'number' ? options.volume : 1.0;

    // [1] 들어가는 소리 ("딸"): 1550Hz -> 310Hz로 떨어지며 하우징에 닿는 소리
    const tIn = now;
    const oscIn = ctx.createOscillator();
    const gainIn = ctx.createGain();
    oscIn.type = 'triangle';
    oscIn.frequency.setValueAtTime(1550, tIn);
    oscIn.frequency.exponentialRampToValueAtTime(310, tIn + 0.026);

    gainIn.gain.setValueAtTime(0.0005, tIn);
    gainIn.gain.linearRampToValueAtTime(0.28 * volumeScale, tIn + 0.003);
    gainIn.gain.exponentialRampToValueAtTime(0.0004, tIn + 0.032);

    oscIn.connect(gainIn);
    gainIn.connect(ctx.destination);
    oscIn.start(tIn);
    oscIn.stop(tIn + 0.036);

    createSwitchTransientBurst(ctx, tIn, 0.024, 1450, 0.22 * volumeScale, 550);

    // [2] 나오는 소리 ("깍"): 간격 후 920Hz -> 2480Hz로 튀어 오르며 복귀하는 소리
    const tOut = now + releaseGapSec;
    const oscOut = ctx.createOscillator();
    const gainOut = ctx.createGain();
    oscOut.type = 'square';
    oscOut.frequency.setValueAtTime(920, tOut);
    oscOut.frequency.exponentialRampToValueAtTime(2480, tOut + 0.022);

    const outFilter = ctx.createBiquadFilter();
    outFilter.type = 'bandpass';
    outFilter.frequency.setValueAtTime(2100, tOut);
    outFilter.Q.setValueAtTime(1.4, tOut);

    gainOut.gain.setValueAtTime(0.0005, tOut);
    gainOut.gain.linearRampToValueAtTime(0.24 * volumeScale, tOut + 0.0025);
    gainOut.gain.exponentialRampToValueAtTime(0.0004, tOut + 0.03);

    oscOut.connect(outFilter);
    outFilter.connect(gainOut);
    gainOut.connect(ctx.destination);
    oscOut.start(tOut);
    oscOut.stop(tOut + 0.034);

    createSwitchTransientBurst(ctx, tOut, 0.022, 2650, 0.25 * volumeScale, 1100);
  } catch {}
}

function startSubtleStaticNoise() {
  if (!isWaitSoundEnabled()) return null;
  try {
    const ctx = getWaitAudioContext();
    if (!ctx) return null;
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      const crackle = Math.random() > 0.9965 ? (Math.random() * 2 - 1) * 0.85 : 0;
      lastOut = (lastOut + 0.14 * white) / 1.14;
      data[i] = lastOut * 0.65 + crackle * 0.25;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1850, ctx.currentTime);
    bandpass.Q.setValueAtTime(0.65, ctx.currentTime);

    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.022, now + 0.16);

    noise.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);

    return {
      resume: () => {
        try {
          if (ctx.state === 'suspended') ctx.resume().catch(() => {});
          const t = ctx.currentTime;
          gain.gain.cancelScheduledValues(t);
          gain.gain.setValueAtTime(Math.max(0.0005, gain.gain.value), t);
          gain.gain.linearRampToValueAtTime(0.022, t + 0.08);
        } catch {}
      },
      stop: () => {
        try {
          const t = ctx.currentTime;
          gain.gain.cancelScheduledValues(t);
          gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), t);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
          setTimeout(() => {
            try {
              noise.stop();
            } catch {}
          }, 160);
        } catch {}
      }
    };
  } catch {
    return null;
  }
}

// ============================================================
// 첫 클릭 전 노이즈 뒤 네오 브루탈리즘 마키 + 3D 타이틀 레이어
// ============================================================
function ensurePreClickNoiseTitleStyles() {
  if (document.getElementById('pre-click-noise-title-style')) return;
  const style = document.createElement('style');
  style.id = 'pre-click-noise-title-style';
  style.textContent = `
    #pre-click-noise-title-layer {
      position: fixed;
      inset: 0;
      z-index: 1000005;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      perspective: 920px;
      overflow: hidden;
      opacity: 1;
      transition: opacity 0.24s ease;
      background-image:
        linear-gradient(to right, rgba(255, 216, 59, 0.07) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(72, 219, 251, 0.07) 1px, transparent 1px);
      background-size: 28px 28px;
    }
    #pre-click-noise-title-layer.fade-out {
      opacity: 0;
    }

    .brutal-gate-marquee {
      width: 100%;
      overflow: hidden;
      white-space: nowrap;
      border-bottom: 3px solid #111111;
      border-top: 3px solid #111111;
      padding: 8px 0;
      font-family: 'Pretendard Variable', 'DungGeunMo', 'Consolas', monospace;
      font-size: clamp(0.78rem, 1.35vw, 0.96rem);
      font-weight: 900;
      letter-spacing: 0.05em;
      flex-shrink: 0;
    }
    .brutal-gate-marquee.top-strip {
      background: #ffd83b;
      color: #111111;
      border-top: 0;
      box-shadow: 0 4px 0 #111111;
    }
    .brutal-gate-marquee.bottom-strip {
      background: #111111;
      color: #48dbfb;
      border-bottom: 0;
      box-shadow: 0 -4px 0 #ffd83b;
    }
    .brutal-gate-track {
      display: inline-flex;
      gap: 22px;
      will-change: transform;
      animation: brutalGateScrollLeft 22s linear infinite;
    }
    .brutal-gate-marquee.bottom-strip .brutal-gate-track {
      animation: brutalGateScrollRight 25s linear infinite;
    }
    .brutal-gate-sep {
      color: #ff4757;
    }
    .brutal-gate-marquee.bottom-strip .brutal-gate-sep {
      color: #ffd83b;
    }
    @keyframes brutalGateScrollLeft {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    @keyframes brutalGateScrollRight {
      0% { transform: translateX(-50%); }
      100% { transform: translateX(0); }
    }

    #pre-click-noise-title-box {
      width: 56vw;
      max-width: 800px;
      min-width: 280px;
      max-height: 62vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: #ffffff;
      font-family: 'Pretendard Variable', 'DungGeunMo', 'Consolas', monospace;
      transform-style: preserve-3d;
      will-change: transform;
      animation: noiseTitleMicroJitter 0.18s steps(2, end) infinite;
      padding: 10px 0;
    }
    .brutal-gate-kicker {
      display: inline-block;
      background: #48dbfb;
      color: #111111;
      border: 3px solid #111111;
      box-shadow: 4px 4px 0 #111111;
      padding: 3px 12px;
      font-size: clamp(0.75rem, 1.3vw, 0.95rem);
      font-weight: 900;
      letter-spacing: 0.04em;
      margin-bottom: clamp(8px, 1.2vh, 14px);
    }
    .noise-bleed-text {
      position: relative;
      color: #ffffff;
      text-shadow:
        -6px 0 6px rgba(255, 255, 255, 0.42),
        6px 0 6px rgba(255, 255, 255, 0.42),
        -14px 0 12px rgba(210, 235, 255, 0.2),
        14px 0 12px rgba(255, 220, 220, 0.2);
      animation: horizontalNoiseSmear 2.4s infinite;
    }
    .noise-bleed-text::before,
    .noise-bleed-text::after {
      content: attr(data-text);
      position: absolute;
      inset: 0;
      pointer-events: none;
      color: #ffffff;
      opacity: 0.62;
    }
    .noise-bleed-text::before {
      transform: translateX(-4px);
      clip-path: inset(18% 0 52% 0);
      text-shadow: -8px 0 5px rgba(255, 255, 255, 0.65);
      animation: smearSliceLeft 1.35s infinite steps(2, end);
    }
    .noise-bleed-text::after {
      transform: translateX(4px);
      clip-path: inset(58% 0 14% 0);
      text-shadow: 8px 0 5px rgba(255, 255, 255, 0.65);
      animation: smearSliceRight 1.55s infinite steps(2, end);
    }
    .noise-main-title {
      font-size: clamp(2.1rem, 4.4vw, 4.1rem);
      font-weight: 900;
      letter-spacing: 0.08em;
      line-height: 1.12;
      margin-bottom: clamp(8px, 1.3vh, 16px);
    }
    .noise-maker-line {
      font-size: clamp(1rem, 1.9vw, 1.75rem);
      font-weight: 800;
      letter-spacing: 0.04em;
      line-height: 1.3;
      margin-bottom: clamp(12px, 1.8vh, 22px);
    }
    .brutal-retrace-pill {
      display: inline-block;
      background: #ffd83b;
      color: #111111;
      border: 3px solid #111111;
      box-shadow: 5px 5px 0 #ff4757;
      padding: clamp(6px, 1vh, 11px) clamp(16px, 2.5vw, 28px);
      margin-bottom: clamp(10px, 1.6vh, 18px);
      transform: rotate(-1.5deg);
      animation: brutalCtaPulse 1.3s ease-in-out infinite alternate;
    }
    .noise-retrace-cta {
      font-size: clamp(1.05rem, 2vw, 1.85rem);
      font-weight: 900;
      letter-spacing: 0.1em;
      line-height: 1.2;
      color: #111111;
      text-shadow: none;
      animation: none;
    }
    .noise-retrace-cta::before,
    .noise-retrace-cta::after {
      display: none;
    }
    @keyframes brutalCtaPulse {
      0% { transform: rotate(-1.5deg) translateY(0); }
      100% { transform: rotate(1deg) translateY(-3px); }
    }
    .noise-copyleft-row {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: clamp(0.82rem, 1.45vw, 1.25rem);
      font-weight: 800;
      letter-spacing: 0.05em;
      line-height: 1.25;
      opacity: 0.92;
    }
    .flipped-copyright-symbol {
      display: inline-block;
      transform: scale(-1, -1);
      font-weight: 900;
      text-shadow:
        -4px 0 5px rgba(255, 255, 255, 0.5),
        4px 0 5px rgba(255, 255, 255, 0.5);
    }
    @keyframes noiseTitleMicroJitter {
      0% { margin-left: 0px; margin-top: 0px; }
      25% { margin-left: -1.5px; margin-top: 1px; }
      50% { margin-left: 1.5px; margin-top: -1px; }
      75% { margin-left: -1px; margin-top: -1px; }
      100% { margin-left: 1px; margin-top: 1px; }
    }
    @keyframes horizontalNoiseSmear {
      0%, 84%, 100% {
        transform: skewX(0deg) scaleX(1);
      }
      86% {
        transform: skewX(-7deg) scaleX(1.03);
      }
      89% {
        transform: skewX(6deg) scaleX(0.98);
      }
      92% {
        transform: skewX(-4deg) scaleX(1.02);
      }
    }
    @keyframes smearSliceLeft {
      0%, 78%, 100% { transform: translateX(-3px); }
      82% { transform: translateX(-11px); }
      86% { transform: translateX(4px); }
    }
    @keyframes smearSliceRight {
      0%, 80%, 100% { transform: translateX(3px); }
      84% { transform: translateX(12px); }
      88% { transform: translateX(-5px); }
    }
  `;
  document.head.appendChild(style);
}

function startPreClickNoiseTitleLayer() {
  ensurePreClickNoiseTitleStyles();
  const prev = document.getElementById('pre-click-noise-title-layer');
  if (prev) prev.remove();

  const topItems = [
    'MY-ARCHIVE 95 WORKSTATION',
    'CULTURE & ART ARCHIVE OS',
    '3D CRT BOOT SEQUENCE READY',
    'CLICK ANYWHERE TO RETRACE'
  ];
  const bottomItems = [
    'AWARD BIOS v4.51PG',
    'JUKEBOX · BBS · TIMELINE · QUIZ',
    'NEO-BRUTALISM + WIN95',
    'TAEYANG MUN (nlasdnfkl2)'
  ];

  const buildTrackHtml = (items) => {
    const repeated = [...items, ...items, ...items, ...items];
    return repeated
      .map(txt => `<span>${waitSafeEsc(txt)}</span><span class="brutal-gate-sep">✦</span>`)
      .join('');
  };

  const layer = document.createElement('div');
  layer.id = 'pre-click-noise-title-layer';
  layer.innerHTML = `
    <div class="brutal-gate-marquee top-strip" aria-hidden="true">
      <div class="brutal-gate-track">${buildTrackHtml(topItems)}</div>
    </div>

    <div id="pre-click-noise-title-box">
      <div class="brutal-gate-kicker">SIGNAL STANDBY // CH-95</div>
      <div class="noise-bleed-text noise-main-title" data-text="MY-ARCHIVE 95">MY-ARCHIVE 95</div>
      <div class="noise-bleed-text noise-maker-line" data-text="만든 이: TAEYANG MUN (nlasdnfkl2)">만든 이: TAEYANG MUN (nlasdnfkl2)</div>
      <div class="brutal-retrace-pill">
        <div class="noise-bleed-text noise-retrace-cta" data-text="CLICK TO RETRACE">CLICK TO RETRACE</div>
      </div>
      <div class="noise-copyleft-row">
        <span class="flipped-copyright-symbol" aria-hidden="true">©</span>
        <span class="noise-bleed-text" data-text="COPYLEFT TAEYANG MUN (nlasdnfkl2)">COPYLEFT TAEYANG MUN (nlasdnfkl2)</span>
      </div>
    </div>

    <div class="brutal-gate-marquee bottom-strip" aria-hidden="true">
      <div class="brutal-gate-track">${buildTrackHtml(bottomItems)}</div>
    </div>
  `;

  document.body.appendChild(layer);
  const box = layer.querySelector('#pre-click-noise-title-box');

  let pointerTargetX = 0;
  let pointerTargetY = 0;
  let curRotX = 0;
  let curRotY = 0;
  let rafId = 0;
  let stopped = false;

  const onPointerMove = e => {
    const w = window.innerWidth || 1280;
    const h = window.innerHeight || 720;
    const nx = (e.clientX / w) * 2 - 1;
    const ny = (e.clientY / h) * 2 - 1;
    pointerTargetY = nx * 9;
    pointerTargetX = -ny * 7;
  };

  window.addEventListener('pointermove', onPointerMove, { passive: true });

  const tick3dGaze = now => {
    if (stopped) return;
    const idleYaw = Math.sin(now * 0.0014) * 3.2;
    const idlePitch = Math.cos(now * 0.0011) * 2.2;
    const goalY = pointerTargetY + idleYaw;
    const goalX = pointerTargetX + idlePitch;

    curRotY += (goalY - curRotY) * 0.09;
    curRotX += (goalX - curRotX) * 0.09;

    if (box) {
      box.style.transform = `rotateX(${curRotX.toFixed(2)}deg) rotateY(${curRotY.toFixed(2)}deg) translate3d(${(curRotY * 1.1).toFixed(1)}px,${(-curRotX * 0.9).toFixed(1)}px, 0)`;
    }
    rafId = requestAnimationFrame(tick3dGaze);
  };

  rafId = requestAnimationFrame(tick3dGaze);

  return () => {
    if (stopped) return;
    stopped = true;
    window.removeEventListener('pointermove', onPointerMove);
    if (rafId) cancelAnimationFrame(rafId);
    layer.classList.add('fade-out');
    setTimeout(() => layer.remove(), 250);
  };
}

// ============================================================
// 전체 화면 '치지직' 시각 효과 오버레이
// ============================================================
function ensureFullScreenStaticStyles() {
  if (document.getElementById('fullscreen-crt-static-style')) return;
  const style = document.createElement('style');
  style.id = 'fullscreen-crt-static-style';
  style.textContent = `
    #fullscreen-crt-static-overlay {
      position: fixed;
      inset: 0;
      z-index: 1000010;
      pointer-events: none;
      overflow: hidden;
      opacity: 0.9;
      mix-blend-mode: screen;
      transition: opacity 0.25s ease;
    }
    #fullscreen-crt-static-overlay.fade-out {
      opacity: 0;
    }
    #fullscreen-crt-static-canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
    #fullscreen-crt-scanlines {
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        0deg,
        rgba(255, 255, 255, 0.045) 0px,
        rgba(255, 255, 255, 0.045) 1px,
        rgba(0, 0, 0, 0.24) 1px,
        rgba(0, 0, 0, 0.24) 3px
      );
      animation: staticScanRoll 0.35s linear infinite;
    }
    @keyframes staticScanRoll {
      0% { transform: translateY(0px); }
      100% { transform: translateY(3px); }
    }
  `;
  document.head.appendChild(style);
}

function startFullScreenStaticEffect() {
  ensureFullScreenStaticStyles();
  const prev = document.getElementById('fullscreen-crt-static-overlay');
  if (prev) prev.remove();

  const wrap = document.createElement('div');
  wrap.id = 'fullscreen-crt-static-overlay';

  const canvas = document.createElement('canvas');
  canvas.id = 'fullscreen-crt-static-canvas';
  wrap.appendChild(canvas);

  const scanlines = document.createElement('div');
  scanlines.id = 'fullscreen-crt-scanlines';
  wrap.appendChild(scanlines);

  document.body.appendChild(wrap);

  const ctx = canvas.getContext('2d');
  const cw = 256;
  const ch = 144;
  canvas.width = cw;
  canvas.height = ch;

  let rafId = 0;
  let stopped = false;

  const renderStatic = () => {
    if (stopped) return;
    const imgData = ctx.createImageData(cw, ch);
    const buf = imgData.data;

    for (let i = 0; i < buf.length; i += 4) {
      const n = Math.random();
      const spark = n > 0.985 ? 235 : Math.floor(n * 85);
      buf[i] = spark;
      buf[i + 1] = spark;
      buf[i + 2] = spark;
      buf[i + 3] = n > 0.92 ? 52 : 18;
    }
    ctx.putImageData(imgData, 0, 0);

    const bandY = Math.floor(Math.random() * ch);
    const bandH = 1 + Math.floor(Math.random() * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.fillRect(0, bandY, cw, bandH);

    rafId = requestAnimationFrame(renderStatic);
  };

  rafId = requestAnimationFrame(renderStatic);

  return () => {
    if (stopped) return;
    stopped = true;
    if (rafId) cancelAnimationFrame(rafId);
    wrap.classList.add('fade-out');
    setTimeout(() => wrap.remove(), 220);
  };
}

window.getWaitAudioContext = getWaitAudioContext;
window.playButtonClickSound = playButtonClickSound;
window.startSubtleStaticNoise = startSubtleStaticNoise;
window.startPreClickNoiseTitleLayer = startPreClickNoiseTitleLayer;
window.startFullScreenStaticEffect = startFullScreenStaticEffect;

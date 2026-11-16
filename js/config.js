const APP_BUILD_VERSION = 'v2026.11.17-03';
window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
window.__MOD_VERSIONS.config = APP_BUILD_VERSION;

const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwH-hzWi2Z3_oTFt0PWBhzYMP10VEx4e-32E9EW7d5SMF2k_bwxQL0_3ONaQ8Ze3sdKUQ/exec';

const FALLBACK_COVER = "data:image/svg+xml;utf8," + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <rect width="400" height="300" fill="#ffd83b"/>
    <rect x="20" y="20" width="360" height="260" fill="#ffffff" stroke="#111111" stroke-width="6"/>
    <text x="200" y="142" font-family="sans-serif" font-size="24" font-weight="900" fill="#111111" text-anchor="middle">MY-ARCHIVE 95</text>
    <text x="200" y="176" font-family="sans-serif" font-size="14" font-weight="700" fill="#4a4a4a" text-anchor="middle">NO COVER IMAGE</text>
  </svg>
`);

let archiveItems = [];
let memoNotes = [];
let selectedCategory = 'ALL';
let categoryChart = null;
let monthlyChart = null;
let topZIndex = 400;
let detailWindowCount = 0;
let soundEnabled = true;
let useGhostDrag = true;

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function populateWin95DateSelects(ySel, mSel, dSel, isoDateStr) {
  if (!ySel || !mSel || !dSel) return;
  const curYear = new Date().getFullYear();
  ySel.innerHTML = '';
  for (let y = curYear + 1; y >= 1980; y--) {
    const opt = document.createElement('option');
    opt.value = String(y);
    opt.textContent = `${y}년`;
    ySel.appendChild(opt);
  }
  mSel.innerHTML = '';
  for (let m = 1; m <= 12; m++) {
    const val = String(m).padStart(2, '0');
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = `${m}월`;
    mSel.appendChild(opt);
  }
  dSel.innerHTML = '';
  for (let d = 1; d <= 31; d++) {
    const val = String(d).padStart(2, '0');
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = `${d}일`;
    dSel.appendChild(opt);
  }
  const parts = (isoDateStr || new Date().toISOString().slice(0, 10)).split('-');
  if (parts.length === 3) {
    ySel.value = parts[0];
    mSel.value = parts[1].padStart(2, '0');
    dSel.value = parts[2].padStart(2, '0');
  }
}

function getWin95DateValue(ySel, mSel, dSel) {
  return `${ySel.value}-${mSel.value}-${dSel.value}`;
}

// Windows 95 스타일 다성부 8비트/신스 효과음 합성기
function playRetroTone(type = 'click') {
  if (!soundEnabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'boot') {
      // Windows 95 시동음풍 4성부 화음 아르페지오
      const notes = [
        { freq: 311.13, t: 0.00, dur: 0.55 }, // Eb4
        { freq: 466.16, t: 0.14, dur: 0.55 }, // Bb4
        { freq: 622.25, t: 0.28, dur: 0.65 }, // Eb5
        { freq: 698.46, t: 0.44, dur: 0.85 }  // F5
      ];
      notes.forEach(n => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.freq, now + n.t);
        gain.gain.setValueAtTime(0.001, now + n.t);
        gain.gain.linearRampToValueAtTime(0.055, now + n.t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + n.t + n.dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + n.t);
        osc.stop(now + n.t + n.dur);
      });
    } else if (type === 'open') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(660, now + 0.045);
      gain.gain.setValueAtTime(0.028, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.11);
    } else if (type === 'close') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.setValueAtTime(340, now + 0.045);
      gain.gain.setValueAtTime(0.025, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'boom') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.32);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
    } else if (type === 'post') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.13);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(620, now);
      gain.gain.setValueAtTime(0.018, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.045);
    }
  } catch {}
}

function setLoadingCursor(on) {
  document.body.classList.toggle('is-loading', on);
}

// 모든 JS/CSS 구성요소 최신 버전 무결성 검증
function verifySystemModules() {
  const v = window.__MOD_VERSIONS || {};
  const cssLoaded = Array.from(document.styleSheets).some(s => (s.href || '').includes('style.css'));
  const checks = [
    { name: 'config.js', ver: v.config || 'OLD/MISSING', ok: v.config === APP_BUILD_VERSION },
    { name: 'window-mgr.js', ver: v.windowMgr || 'OLD/MISSING', ok: v.windowMgr === APP_BUILD_VERSION },
    { name: 'archive-app.js', ver: v.archiveApp || 'OLD/MISSING', ok: v.archiveApp === APP_BUILD_VERSION },
    { name: 'style.css', ver: cssLoaded ? 'LINKED' : 'MISSING', ok: cssLoaded }
  ];
  const allOk = checks.every(c => c.ok);
  return { allOk, checks };
}

// 1995 Award Modular BIOS POST 화면 + DEL 키 CMOS SETUP 진입 지원
function runBootAnimation() {
  const splash = document.getElementById('win95-boot-screen');
  if (!splash) return;

  const { allOk, checks } = verifySystemModules();
  let finished = false;
  let inSetup = false;
  const timers = [];

  function finishBoot() {
    if (finished) return;
    finished = true;
    timers.forEach(t => clearInterval(t));
    timers.forEach(t => clearTimeout(t));
    splash.style.display = 'none';
    document.removeEventListener('keydown', onBootKey);
    playRetroTone('boot');
  }

  function openCmosSetup() {
    inSetup = true;
    timers.forEach(t => clearInterval(t));
    timers.forEach(t => clearTimeout(t));
    playRetroTone('post');

    splash.style.background = '#0000aa';
    splash.style.color = '#ffffff';
    splash.innerHTML = `
      <div class="bios-top-wrap" style="border: 3px double #ffffff; padding: 18px 22px; background: #0000aa;">
        <div style="text-align:center; background:#c0c0c0; color:#111111; font-weight:900; padding:4px; margin-bottom:16px;">
          ROM PCI/ISA BIOS (2A59CA39) — CMOS SETUP UTILITY — AWARD SOFTWARE, INC.
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:18px;">
          <div style="border:1px solid #ffffff; padding:12px;">
            <div class="bios-yellow" style="margin-bottom:8px;">[ SYSTEM CONFIGURATION ]</div>
            <div style="margin-bottom:8px; cursor:pointer;" id="cmos-opt-sound">1. Onboard Speaker   : <span class="bios-cyan">[${soundEnabled ? 'ENABLED' : 'DISABLED'}]</span></div>
            <div style="margin-bottom:8px; cursor:pointer;" id="cmos-opt-drag">2. Window Drag Mode  : <span class="bios-cyan">[${useGhostDrag ? 'WIREFRAME' : 'REALTIME'}]</span></div>
            <div style="margin-bottom:8px; cursor:pointer;" id="cmos-opt-crt">3. CRT Scanline FX   : <span class="bios-cyan">[${document.body.classList.contains('crt-on') ? 'ON' : 'OFF'}]</span></div>
          </div>
          <div style="border:1px solid #ffffff; padding:12px;">
            <div class="bios-yellow" style="margin-bottom:8px;">[ MODULE INTEGRITY TABLE ]</div>
            ${checks.map(c => `<div>${c.name.padEnd(15, ' ')} : <span style="color:${c.ok ? '#2ed573' : '#ff4757'};">${c.ok ? 'OK' : 'WARN'} (${c.ver})</span></div>`).join('')}
          </div>
        </div>
        <div style="border-top:1px solid #ffffff; padding-top:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <span>항목을 클릭하여 설정 변경 | <span class="bios-yellow">F10 / ENTER</span> : 저장 후 OS 부팅</span>
          <button type="button" id="cmos-save-exit" style="background:#ffd83b; color:#111111; border:2px solid #ffffff; padding:4px 12px; font-family:monospace; font-weight:900; cursor:pointer;">SAVE &amp; EXIT SETUP (F10)</button>
        </div>
      </div>
    `;

    document.getElementById('cmos-opt-sound')?.addEventListener('click', e => {
      soundEnabled = !soundEnabled;
      const spkBtn = document.getElementById('btn-sound-toggle');
      if (spkBtn) spkBtn.textContent = soundEnabled ? 'SPK:ON' : 'SPK:OFF';
      e.currentTarget.querySelector('span').textContent = `[${soundEnabled ? 'ENABLED' : 'DISABLED'}]`;
      playRetroTone('click');
    });

    document.getElementById('cmos-opt-drag')?.addEventListener('click', e => {
      useGhostDrag = !useGhostDrag;
      e.currentTarget.querySelector('span').textContent = `[${useGhostDrag ? 'WIREFRAME' : 'REALTIME'}]`;
      playRetroTone('click');
    });

    document.getElementById('cmos-opt-crt')?.addEventListener('click', e => {
      document.body.classList.toggle('crt-on');
      e.currentTarget.querySelector('span').textContent = `[${document.body.classList.contains('crt-on') ? 'ON' : 'OFF'}]`;
      playRetroTone('click');
    });

    document.getElementById('cmos-save-exit')?.addEventListener('click', finishBoot);
  }

  function onBootKey(e) {
    if (inSetup) {
      if (e.key === 'F10' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        finishBoot();
      }
      return;
    }
    if (e.key === 'Delete') {
      e.preventDefault();
      openCmosSetup();
    } else {
      finishBoot();
    }
  }

  splash.addEventListener('click', () => {
    if (!inSetup) finishBoot();
  });
  document.addEventListener('keydown', onBootKey);

  playRetroTone('post');

  splash.innerHTML = `
    <div class="bios-top-wrap">
      <div class="bios-header">
        <div>
          <div class="bios-bright">Award Modular BIOS v4.51PG, An Energy Star Ally</div>
          <div>Copyright (C) 1984-95, Award Software, Inc.</div>
          <div class="bios-cyan" style="margin-top:6px;">MY-ARCHIVE 95 OS REVISION 2.0 (${APP_BUILD_VERSION})</div>
        </div>
        <div class="bios-epa-box">  ★ ENERGY ★
  ┌──────────┐
  │   EPA    │
  │ POLLUTION│
  │ PREVENTER│
  └──────────┘</div>
      </div>

      <div class="bios-line">PENTIUM-S CPU at 133MHz</div>
      <div class="bios-line">Memory Test : <span id="bios-mem-val" class="bios-bright">0K</span></div>
      <div id="bios-post-log" style="margin-top:12px;"></div>
      <div style="margin-top:8px;"><span class="bios-cursor"></span></div>
    </div>

    <div class="bios-footer">
      <div>Press <span class="bios-bright">DEL</span> to enter SETUP, <span class="bios-bright">CLICK</span> or <span class="bios-bright">ANY KEY</span> to skip POST</div>
      <div style="margin-top:2px;">11/17/95-i430FX-2A59CA39C-00</div>
    </div>
  `;

  // 메모리 카운팅 (0K -> 65536K OK)
  const memEl = document.getElementById('bios-mem-val');
  let mem = 0;
  const memInterval = setInterval(() => {
    mem += 4096;
    if (mem >= 65536) {
      mem = 65536;
      if (memEl) memEl.textContent = '65536K OK';
      clearInterval(memInterval);
    } else if (memEl) {
      memEl.textContent = `${mem}K`;
    }
  }, 22);
  timers.push(memInterval);

  const modSummary = checks.map(c => `${c.name}[${c.ok ? 'OK' : 'OLD'}]`).join('  ');
  const logBox = document.getElementById('bios-post-log');
  const postSteps = [
    { delay: 360, html: `<div class="bios-line">Award Plug and Play BIOS Extension v1.0A</div>` },
    { delay: 600, html: `<div class="bios-line">Detecting HDD Primary Master   ... <span class="bios-green">MY-ARCHIVE-STORAGE 2100MB</span></div>` },
    { delay: 820, html: `<div class="bios-line">Detecting HDD Primary Slave    ... <span class="bios-yellow">GOOGLE-SHEETS-CLOUD-DB</span></div>` },
    { delay: 1020, html: `<div class="bios-line">Detecting CD-ROM Secondary     ... <span class="bios-cyan">YT-MUSIC-JUKEBOX-DRIVE</span></div>` },
    { delay: 1240, html: `<div class="bios-line" style="margin-top:8px; color:${allOk ? '#2ed573' : '#ff4757'};">System Modules : ${esc(modSummary)}</div>` },
    { delay: 1480, html: `<div class="bios-line" style="margin-top:6px;">Starting MY-ARCHIVE 95 Desktop Environment ...</div>` }
  ];

  postSteps.forEach(step => {
    const t = setTimeout(() => {
      if (logBox && !finished && !inSetup) logBox.insertAdjacentHTML('beforeend', step.html);
    }, step.delay);
    timers.push(t);
  });

  timers.push(setTimeout(() => {
    if (!inSetup) finishBoot();
  }, allOk ? 2050 : 2850));
}

// BSOD & Screensaver & Sound Toggle & Win95 Keyboard Shortcuts
document.getElementById('btn-sound-toggle')?.addEventListener('click', e => {
  soundEnabled = !soundEnabled;
  e.target.textContent = soundEnabled ? 'SPK:ON' : 'SPK:OFF';
  if (soundEnabled) playRetroTone('click');
});

const bsodEl = document.getElementById('win95-bsod');
function triggerBSOD() {
  if (!bsodEl) return;
  playRetroTone('boom');
  bsodEl.style.display = 'flex';
}
bsodEl?.addEventListener('click', () => { bsodEl.style.display = 'none'; });

document.addEventListener('keydown', e => {
  if (bsodEl && bsodEl.style.display === 'flex') bsodEl.style.display = 'none';
  if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'b') triggerBSOD();

  // Ctrl + Esc: 시작 메뉴 토글
  if (e.ctrlKey && e.key === 'Escape') {
    e.preventDefault();
    const sm = document.getElementById('start-menu');
    const sb = document.getElementById('btn-start');
    if (sm && sb) {
      const open = sm.classList.toggle('open');
      sb.classList.toggle('pressed', open);
      playRetroTone('click');
    }
  }

  // Alt + F4: 현재 포커스된 팝업 창 닫기
  if (e.altKey && e.key === 'F4') {
    const focusedPopup = document.querySelector('.floating-win.open.focused');
    if (focusedPopup && typeof closeWindow === 'function') {
      e.preventDefault();
      closeWindow(focusedPopup.id);
    }
  }
});
document.getElementById('mnu-bsod')?.addEventListener('click', triggerBSOD);

let ssAnimId = null;
function startScreensaver() {
  const overlay = document.getElementById('screensaver-overlay');
  const canvas = document.getElementById('screensaver-canvas');
  if (!overlay || !canvas) return;
  const ctx = canvas.getContext('2d');
  overlay.style.display = 'block';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const stars = Array.from({ length: 180 }, () => ({
    x: (Math.random() - 0.5) * canvas.width,
    y: (Math.random() - 0.5) * canvas.height,
    z: Math.random() * canvas.width,
    color: ['#ffffff', '#ffd83b', '#48dbfb', '#2ed573', '#ff4757'][Math.floor(Math.random() * 5)]
  }));

  function draw() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2, cy = canvas.height / 2;
    stars.forEach(st => {
      st.z -= 8;
      if (st.z <= 1) {
        st.z = canvas.width;
        st.x = (Math.random() - 0.5) * canvas.width;
        st.y = (Math.random() - 0.5) * canvas.height;
      }
      const sx = cx + (st.x / st.z) * cx;
      const sy = cy + (st.y / st.z) * cy;
      const size = Math.max(1.5, (1 - st.z / canvas.width) * 5);
      ctx.fillStyle = st.color;
      ctx.fillRect(sx, sy, size, size);
    });
    ssAnimId = requestAnimationFrame(draw);
  }
  draw();
}

function stopScreensaver() {
  const overlay = document.getElementById('screensaver-overlay');
  if (overlay && overlay.style.display === 'block') {
    overlay.style.display = 'none';
    if (ssAnimId) cancelAnimationFrame(ssAnimId);
  }
}
document.getElementById('screensaver-overlay')?.addEventListener('click', stopScreensaver);
document.addEventListener('keydown', stopScreensaver);
document.getElementById('mnu-run-screensaver')?.addEventListener('click', startScreensaver);
document.getElementById('btn-widget-ss')?.addEventListener('click', startScreensaver);
document.getElementById('sm-screensaver')?.addEventListener('click', startScreensaver);

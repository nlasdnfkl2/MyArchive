const APP_BUILD_VERSION = 'v2026.11.17-01';
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

function playRetroTone(type = 'click') {
  if (!soundEnabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'boot') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(261.63, now);
      osc.frequency.setValueAtTime(329.63, now + 0.12);
      osc.frequency.setValueAtTime(392.00, now + 0.24);
      osc.frequency.setValueAtTime(523.25, now + 0.36);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc.start(now);
      osc.stop(now + 0.7);
    } else if (type === 'open') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(660, now + 0.05);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'boom') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      osc.type = 'square';
      osc.frequency.setValueAtTime(580, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  } catch {}
}

function setLoadingCursor(on) {
  document.body.classList.toggle('is-loading', on);
}

// 첫 로딩 화면 버전 표시 및 모든 JS/CSS 구성요소 최신 버전 무결성 검증
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

function runBootAnimation() {
  const bar = document.getElementById('boot-progress');
  const splash = document.getElementById('win95-boot-screen');
  if (!bar || !splash) return;

  const bootBox = splash.querySelector('.boot-box') || splash;
  const { allOk, checks } = verifySystemModules();

  let diagEl = document.getElementById('boot-version-diag');
  if (!diagEl) {
    diagEl = document.createElement('div');
    diagEl.id = 'boot-version-diag';
    diagEl.style.cssText = 'margin-top:14px; padding:8px 10px; background:#111111; color:#2ed573; border:2px solid #ffffff; font-size:0.74rem; text-align:left; line-height:1.55;';
    bootBox.appendChild(diagEl);
  }

  const lines = checks.map(c => `${c.ok ? '[OK]' : '[!] '} ${c.name} : ${c.ver}`);
  diagEl.innerHTML = `
    <div style="color:#ffd83b; font-weight:900; margin-bottom:4px;">SYSTEM BUILD : ${APP_BUILD_VERSION}</div>
    ${lines.map(l => `<div>${esc(l)}</div>`).join('')}
    <div style="margin-top:5px; color:${allOk ? '#48dbfb' : '#ff4757'}; font-weight:900;">
      ${allOk ? '>> 모든 구성요소 최신 버전 동기화 완료' : '>> [경고] 일부 구버전 캐시 감지 (Ctrl+Shift+R 권장)'}
    </div>
  `;

  let count = 0;
  const timer = setInterval(() => {
    count++;
    const block = document.createElement('div');
    block.className = 'boot-block';
    bar.appendChild(block);
    if (count >= 16) {
      clearInterval(timer);
      setTimeout(() => {
        splash.style.display = 'none';
        playRetroTone('boot');
      }, allOk ? 450 : 1400);
    }
  }, 40);
}

// BSOD & Screensaver & Sound Toggle
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

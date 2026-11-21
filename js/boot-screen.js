// ============================================================
// MY-ARCHIVE 95 OS — BIOS POST, Splash & Windows 95 Logon Shell
// ============================================================

window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
window.__MOD_VERSIONS.bootScreen = 'v2026.11.22-01';

const BOOT_PREFS_KEY = 'myarchive95_osprefs_v1';

const bootState = {
  stage: 'bios', // 'bios' | 'splash' | 'login' | 'done'
  timers: [],
  ramInterval: null,
  biosBeepPlayed: false
};

function clearBootTimers() {
  bootState.timers.forEach(id => clearTimeout(id));
  bootState.timers = [];
  if (bootState.ramInterval) {
    clearInterval(bootState.ramInterval);
    bootState.ramInterval = null;
  }
}

function getSavedOwnerName() {
  try {
    const raw = JSON.parse(localStorage.getItem(BOOT_PREFS_KEY) || '{}');
    return (raw && raw.ownerName) ? String(raw.ownerName) : '문태양';
  } catch {
    return '문태양';
  }
}

function persistOwnerName(name) {
  try {
    const raw = JSON.parse(localStorage.getItem(BOOT_PREFS_KEY) || '{}');
    raw.ownerName = name || '문태양';
    localStorage.setItem(BOOT_PREFS_KEY, JSON.stringify(raw));
  } catch {}
}

// ============================================================
// Web Audio API: BIOS 비프음 & Windows 95 시작 화음 합성기
// ============================================================
function playBiosPostBeep() {
  if (bootState.biosBeepPlayed) return;
  bootState.biosBeepPlayed = true;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {}
}

function playWin95StartupSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(2600, now + 1.1);
    filter.connect(ctx.destination);

    // 1단계 화음 (F4 - Bb4 - Eb5 - G5) -> 2단계 해결 화음 (Eb4 - G4 - Bb4 - D5 - F5)
    const notes = [
      { freq: 349.23, start: 0.00, dur: 1.05, vol: 0.055 }, // F4
      { freq: 466.16, start: 0.05, dur: 1.05, vol: 0.050 }, // Bb4
      { freq: 622.25, start: 0.10, dur: 1.10, vol: 0.050 }, // Eb5
      { freq: 783.99, start: 0.16, dur: 1.15, vol: 0.045 }, // G5
      { freq: 311.13, start: 0.95, dur: 1.85, vol: 0.065 }, // Eb4
      { freq: 392.00, start: 1.00, dur: 1.80, vol: 0.050 }, // G4
      { freq: 466.16, start: 1.05, dur: 1.75, vol: 0.050 }, // Bb4
      { freq: 587.33, start: 1.12, dur: 1.70, vol: 0.045 }, // D5
      { freq: 698.46, start: 1.18, dur: 1.65, vol: 0.045 }  // F5
    ];

    notes.forEach(n => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, now + n.start);

      gain.gain.setValueAtTime(0.0001, now + n.start);
      gain.gain.linearRampToValueAtTime(n.vol, now + n.start + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.start + n.dur);

      osc.connect(gain);
      gain.connect(filter);
      osc.start(now + n.start);
      osc.stop(now + n.start + n.dur + 0.05);
    });
  } catch {}
}

// ============================================================
// 부팅 단계 전환 컨트롤러 (BIOS -> SPLASH -> LOGIN -> DESKTOP)
// ============================================================
function setBootStage(stageName) {
  bootState.stage = stageName;
  const biosEl = document.getElementById('boot-stage-bios');
  const splashEl = document.getElementById('boot-stage-splash');
  const loginEl = document.getElementById('boot-stage-login');

  if (biosEl) biosEl.style.display = stageName === 'bios' ? 'flex' : 'none';
  if (splashEl) splashEl.style.display = stageName === 'splash' ? 'flex' : 'none';
  if (loginEl) loginEl.style.display = stageName === 'login' ? 'flex' : 'none';

  if (stageName === 'login') {
    const userInp = document.getElementById('login-username');
    if (userInp) {
      userInp.value = getSavedOwnerName();
    }
    const statusEl = document.getElementById('login-cloud-status');
    if (statusEl) {
      const count = Array.isArray(window.archiveItems) ? window.archiveItems.length : 0;
      statusEl.textContent = count > 0
        ? `● Google Sheets 아카이브 동기화 완료 (${count}건 대기 중)`
        : '● Google Sheets 아카이브 연결 준비 완료';
    }
    setTimeout(() => {
      document.getElementById('btn-win95-login')?.focus();
    }, 40);
  }
}

function startBiosBootSequence() {
  clearBootTimers();
  bootState.biosBeepPlayed = false;

  const overlay = document.getElementById('os-boot-overlay');
  if (!overlay) return;

  overlay.style.display = 'flex';
  overlay.classList.remove('boot-fade-out');
  document.body.classList.add('boot-locked');

  setBootStage('bios');

  const ramEl = document.getElementById('bios-ram-count');
  const logEl = document.getElementById('bios-log-lines');
  const syncBadge = document.getElementById('bios-sync-badge');

  if (logEl) logEl.innerHTML = '';
  if (ramEl) ramEl.textContent = '640';

  // 1. RAM 카운팅 애니메이션 (640K -> 65536K)
  let ramVal = 640;
  bootState.ramInterval = setInterval(() => {
    ramVal += 4096;
    if (ramVal >= 65536) {
      ramVal = 65536;
      clearInterval(bootState.ramInterval);
      bootState.ramInterval = null;
    }
    if (ramEl) ramEl.textContent = String(ramVal);
  }, 55);

  // 2. 하드웨어 & 드라이버 부팅 로그 순차 출력
  const postSteps = [
    { delay: 220, text: 'Detecting IDE Primary Master   ... MY-ARCHIVE-SSD [OK]' },
    { delay: 480, text: 'Detecting IDE Primary Slave    ... JUKEBOX-CDROM 4X [OK]' },
    { delay: 760, text: 'Initializing WebAudio Synth    ... Sound Blaster 16 Emulated [OK]' },
    { delay: 1050, text: 'Connecting Google Apps Script  ... Cloud Drive Mounted [OK]' },
    { delay: 1380, text: 'Verifying DMI Pool Data ........ Update Success' },
    { delay: 1680, text: 'Starting MY-ARCHIVE 95...' }
  ];

  postSteps.forEach(step => {
    const tid = setTimeout(() => {
      if (bootState.stage !== 'bios' || !logEl) return;
      const line = document.createElement('div');
      line.textContent = step.text;
      if (step.text.includes('Starting MY-ARCHIVE 95')) {
        line.style.color = '#ffff55';
        line.style.fontWeight = '900';
        line.style.marginTop = '8px';
      }
      logEl.appendChild(line);

      if (syncBadge && step.text.includes('Cloud Drive')) {
        syncBadge.textContent = 'CLOUD SYNC: CONNECTED';
        syncBadge.style.color = '#55ff55';
      }
    }, step.delay);
    bootState.timers.push(tid);
  });

  // 3. Windows 95 로고 스플래시 화면으로 전환
  bootState.timers.push(setTimeout(() => {
    if (bootState.stage === 'bios') {
      setBootStage('splash');
    }
  }, 2150));

  // 4. Windows 95 로그인 대화상자 표시 (여기서 버튼 클릭 대기)
  bootState.timers.push(setTimeout(() => {
    if (bootState.stage === 'splash') {
      setBootStage('login');
    }
  }, 3350));
}

function completeWin95Login(username, mode = 'owner') {
  clearBootTimers();
  bootState.stage = 'done';

  const cleanName = (username || '').trim() || (mode === 'guest' ? '방문자' : '문태양');
  persistOwnerName(cleanName);

  // 바탕화면 및 상태 표시줄 소유자 정보 갱신
  const statusLeft = document.getElementById('status-left');
  if (statusLeft) {
    statusLeft.textContent = mode === 'guest'
      ? `방문자 모드(${cleanName})로 접속됨 — MY-ARCHIVE 95 OS`
      : `${cleanName}님 환영합니다 — MY-ARCHIVE 95 OS 준비 완료`;
  }

  // Windows 95 시작 화음 재생
  playWin95StartupSound();

  const overlay = document.getElementById('os-boot-overlay');
  if (overlay) {
    overlay.classList.add('boot-fade-out');
    setTimeout(() => {
      overlay.style.display = 'none';
      document.body.classList.remove('boot-locked');
    }, 420);
  } else {
    document.body.classList.remove('boot-locked');
  }
}

function bindBootScreenEvents() {
  // BIOS 화면 클릭 시 1회 비프음 후 즉시 로그인 화면으로 이동
  document.getElementById('boot-stage-bios')?.addEventListener('click', () => {
    playBiosPostBeep();
    clearBootTimers();
    setBootStage('login');
  });

  // 스플래시 화면 클릭 시 즉시 로그인 화면으로 이동
  document.getElementById('boot-stage-splash')?.addEventListener('click', () => {
    clearBootTimers();
    setBootStage('login');
  });

  // 키보드 단축키 (BIOS 중 Space/Enter 스킵, Delete CMOS 토글)
  document.addEventListener('keydown', e => {
    if (bootState.stage === 'bios') {
      playBiosPostBeep();
      if (e.key === 'Delete') {
        e.preventDefault();
        const cmos = document.getElementById('bios-cmos-easter');
        if (cmos) cmos.style.display = cmos.style.display === 'none' ? 'block' : 'none';
      } else if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        clearBootTimers();
        setBootStage('login');
      }
    } else if (bootState.stage === 'splash' && (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape')) {
      e.preventDefault();
      clearBootTimers();
      setBootStage('login');
    }
  });

  // 로그인 폼 제출 ([확인 (로그인)] 버튼 또는 Enter)
  document.getElementById('win95-login-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const userInp = document.getElementById('login-username');
    const modeSel = document.getElementById('login-session-mode');
    completeWin95Login(userInp?.value, modeSel?.value || 'owner');
  });

  // [방문자 입장] 버튼
  document.getElementById('btn-win95-guest')?.addEventListener('click', () => {
    completeWin95Login('방문자', 'guest');
  });

  // [?] 버튼 클릭 시 BIOS 부팅 화면 처음부터 다시 재생
  document.getElementById('btn-reboot-bios')?.addEventListener('click', () => {
    playBiosPostBeep();
    startBiosBootSequence();
  });

  // 시작 메뉴에 '로그오프 / 사용자 전환' 버튼 자동 추가
  const startMenuList = document.querySelector('#start-menu .start-menu-items') || document.getElementById('start-menu');
  if (startMenuList && !document.getElementById('sm-logoff')) {
    const logoffBtn = document.createElement('button');
    logoffBtn.type = 'button';
    logoffBtn.className = 'start-item';
    logoffBtn.id = 'sm-logoff';
    logoffBtn.innerHTML = `<span>🔑</span><span>로그오프 / 다시 부팅...</span>`;
    logoffBtn.addEventListener('click', () => {
      const sm = document.getElementById('start-menu');
      if (sm) sm.classList.remove('open');
      startBiosBootSequence();
    });
    startMenuList.appendChild(logoffBtn);
  }
}

window.startBiosBootSequence = startBiosBootSequence;

document.addEventListener('DOMContentLoaded', () => {
  bindBootScreenEvents();
  startBiosBootSequence();
});

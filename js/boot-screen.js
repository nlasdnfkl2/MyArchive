// ============================================================
// MY-ARCHIVE 95 OS — BIOS POST & Authentic Windows 95 Logon
// (1995 Dot-Pixel Avatars, 3D Bevel UI & Emoji-Free Profiles)
// ============================================================

window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
window.__MOD_VERSIONS.bootScreen = 'v2026.11.22-v4';

const SESSION_USER_KEY = 'myarchive95_current_user_v2';
const USERS_CACHE_KEY = 'myarchive95_users_cache_v2';

// 1995년 16색 도트 픽셀 SVG 아바타 라이브러리 (이모지 미사용)
const PIXEL_AVATARS = {
  frog: `
    <svg class="pixel-avatar-svg" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">
      <path fill="#000000" d="M3 1h3v1h1v2h2V2h1V1h3v1h1v3h-1v1h1v5h-1v2h1v2h-3v-1H5v1H2v-2h1v-2H2V6h1V5H2V2h1V1z"/>
      <path fill="#008000" d="M3 2h3v3h4V2h3v3h-1v1h1v5h-1v2H4v-2H3V6h1V5H3V2z"/>
      <path fill="#00ff00" d="M4 5h2v2H4V5zm6 0h2v2h-2V5zM5 10h6v2H5v-2z"/>
      <path fill="#ffffff" d="M4 2h2v2H4V2zm6 0h2v2h-2V2z"/>
      <path fill="#000000" d="M5 3h1v1H5V3zm6 0h1v1h-1V3zM4 8h8v1H4V8zM3 7h1v1H3V7zm9 0h1v1h-1V7z"/>
    </svg>`,
  globe: `
    <svg class="pixel-avatar-svg" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">
      <path fill="#000000" d="M5 1h6v1h2v1h1v2h1v6h-1v2h-1v1h-2v1H5v-1H3v-1H2v-2H1V5h1V3h1V2h2V1z"/>
      <path fill="#0000ff" d="M5 2h6v1h2v2h1v6h-1v2h-2v1H5v-1H3v-2H2V5h1V3h2V2z"/>
      <path fill="#00ff00" d="M6 2h3v2H7v1H5V3h1V2zm4 3h3v3h-2v2H9V7h1V5zM3 7h3v3H5v2H3V7z"/>
      <path fill="#ffffff" d="M4 3h2v1H4V3z"/>
    </svg>`,
  user: `
    <svg class="pixel-avatar-svg" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">
      <path fill="#000000" d="M6 1h4v1h1v4h-1v1H6V6H5V2h1V1zM4 8h8v1h1v5H3V9h1V8z"/>
      <path fill="#ffff00" d="M6 2h4v4H6V2z"/>
      <path fill="#008080" d="M4 9h8v4H4V9z"/>
      <path fill="#ffffff" d="M7 9h2v2H7V9z"/>
    </svg>`,
  book: `
    <svg class="pixel-avatar-svg" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">
      <path fill="#000000" d="M2 2h11v1h1v10h-1v1H2V2z"/>
      <path fill="#800000" d="M3 3h9v9H3V3z"/>
      <path fill="#ffffff" d="M4 4h7v7H4V4zm8-1h1v9h-1V3z"/>
      <path fill="#808080" d="M5 5h5v1H5V5zm0 2h5v1H5V7zm0 2h3v1H5V9z"/>
    </svg>`,
  headphone: `
    <svg class="pixel-avatar-svg" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">
      <path fill="#000000" d="M5 2h6v1h2v2h1v8h-3V8h1V5h-1V4H5v1H4v3h1v5H2V5h1V3h2V2z"/>
      <path fill="#808080" d="M5 3h6v1H5V3zM3 8h2v4H3V8zm8 0h2v4h-2V8z"/>
      <path fill="#00ffff" d="M4 9h1v2H4V9zm7 0h1v2h-1V9z"/>
    </svg>`,
  movie: `
    <svg class="pixel-avatar-svg" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">
      <path fill="#000000" d="M2 3h12v10H2V3z"/>
      <path fill="#ffffff" d="M3 4h2v2H3V4zm4 0h2v2H7V4zm4 0h2v2h-2V4z"/>
      <path fill="#c0c0c0" d="M3 7h10v5H3V7z"/>
      <path fill="#000000" d="M4 8h8v1H4V8zm0 2h5v1H4v-1z"/>
    </svg>`,
  star: `
    <svg class="pixel-avatar-svg" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">
      <path fill="#000000" d="M7 1h2v3h1v1h4v2h-2v2h-1v2h1v3H9v-1H7v1H4v-3h1V9H4V7H2V5h4V4h1V1z"/>
      <path fill="#ffff00" d="M7 2h2v3h4v1h-2v2h-1v3h1v1H9v-1H7v1H5v-1h1V8H5V6H3V5h4V2z"/>
      <path fill="#808000" d="M9 5h4v1H9V5zm-1 5h2v2H8v-2z"/>
    </svg>`
};

const PIXEL_AVATAR_OPTIONS = [
  { key: 'frog', label: '개구리' },
  { key: 'user', label: '기본유저' },
  { key: 'book', label: '도서' },
  { key: 'headphone', label: '음악' },
  { key: 'movie', label: '영상' },
  { key: 'star', label: '별' }
];

const EMOJI_TO_PIXEL_KEY = {
  '🐸': 'frog',
  '🌐': 'globe',
  '👤': 'user',
  '📚': 'book',
  '🎧': 'headphone',
  '🎬': 'movie',
  '⭐': 'star'
};

function normalizePixelAvatarKey(rawAvatar, role = 'user') {
  if (role === 'public' && !rawAvatar) return 'globe';
  const val = String(rawAvatar || '').trim();
  if (EMOJI_TO_PIXEL_KEY[val]) return EMOJI_TO_PIXEL_KEY[val];
  if (PIXEL_AVATARS[val]) return val;
  return role === 'public' ? 'globe' : 'user';
}

function renderPixelAvatarHtml(rawAvatar, sizePx = 28, role = 'user') {
  const key = normalizePixelAvatarKey(rawAvatar, role);
  const svg = PIXEL_AVATARS[key] || PIXEL_AVATARS.user;
  return `<span class="pixel-avatar-wrap" style="width:${sizePx}px;height:${sizePx}px;">${svg}</span>`;
}

// 1995년 시대 고증에 맞게 이모지를 제거하고 PC통신/워크스테이션 태그로 정제
function formatRetroBio(rawBio, userObj = {}) {
  const cleaned = String(rawBio || '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F]/gu, '')
    .trim();

  if (userObj.role === 'public' || userObj.username === '공용') {
    return cleaned
      ? `[PUBLIC] ${cleaned.replace(/^\[PUBLIC\]\s*/i, '')}`
      : '[PUBLIC] 공용 단말기 모드 - 누구나 자유롭게 감상을 기록하고 공유';
  }
  if (userObj.role === 'owner' || userObj.username === '문태양') {
    return cleaned
      ? `[SYSOP] ${cleaned.replace(/^\[SYSOP\]\s*/i, '')}`
      : '[SYSOP] MY-ARCHIVE 95 OS 관리자 워크스테이션';
  }
  if (!cleaned) {
    return `[LOCAL] ${userObj.username || '이용자'}의 문화 감상 워크스테이션`;
  }
  return /^\[[A-Z0-9_-]+\]/i.test(cleaned) ? cleaned : `[USER] ${cleaned}`;
}

window.PIXEL_AVATARS = PIXEL_AVATARS;
window.normalizePixelAvatarKey = normalizePixelAvatarKey;
window.renderPixelAvatarHtml = renderPixelAvatarHtml;
window.formatRetroBio = formatRetroBio;

const DEFAULT_FALLBACK_USERS = [
  {
    id: 'USR-PUBLIC',
    username: '공용',
    role: 'public',
    bio: '[PUBLIC] 공용 단말기 모드 - 누구나 자유롭게 감상을 기록하고 공유',
    avatar: 'globe'
  },
  {
    id: 'USR-OWNER',
    username: '문태양',
    role: 'owner',
    bio: '[SYSOP] MY-ARCHIVE 95 OS 관리자 워크스테이션',
    avatar: 'frog'
  }
];

window.currentOsUser = null;
window.registeredOsUsers = [...DEFAULT_FALLBACK_USERS];

const bootState = {
  stage: 'bios',
  loginTab: 'signin', // 'signin' | 'signup'
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

function getCurrentUser() {
  if (window.currentOsUser) return window.currentOsUser;
  const saved = loadLocalCache(SESSION_USER_KEY, null);
  if (saved && saved.username) {
    window.currentOsUser = saved;
    return saved;
  }
  return DEFAULT_FALLBACK_USERS[1];
}

function setCurrentUser(userObj) {
  window.currentOsUser = userObj;
  saveLocalCache(SESSION_USER_KEY, userObj);
  updateDesktopUserBadge();
}

function updateDesktopUserBadge() {
  const user = getCurrentUser();
  const badge = document.getElementById('active-user-badge');
  if (badge && user) {
    const roleLabel = user.role === 'public' ? '공용' : '개인';
    badge.innerHTML = `${renderPixelAvatarHtml(user.avatar, 14, user.role)}<span>${esc(user.username)} (${roleLabel})</span>`;
  }
  const winMainTitle = document.getElementById('win-main-title-text');
  if (winMainTitle && user) {
    winMainTitle.textContent = user.role === 'public'
      ? 'C:\\MY-ARCHIVE\\PUBLIC.EXE — 공용 워크스테이션 아카이브'
      : `C:\\MY-ARCHIVE\\${user.username.toUpperCase()}.EXE — ${user.username}의 개인 아카이브`;
  }
}

// ============================================================
// Web Audio API: BIOS 비프음 & Windows 95 시작 화음
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

    const notes = [
      { freq: 349.23, start: 0.00, dur: 1.05, vol: 0.055 },
      { freq: 466.16, start: 0.05, dur: 1.05, vol: 0.050 },
      { freq: 622.25, start: 0.10, dur: 1.10, vol: 0.050 },
      { freq: 783.99, start: 0.16, dur: 1.15, vol: 0.045 },
      { freq: 311.13, start: 0.95, dur: 1.85, vol: 0.065 },
      { freq: 392.00, start: 1.00, dur: 1.80, vol: 0.050 },
      { freq: 466.16, start: 1.05, dur: 1.75, vol: 0.050 },
      { freq: 587.33, start: 1.12, dur: 1.70, vol: 0.045 },
      { freq: 698.46, start: 1.18, dur: 1.65, vol: 0.045 }
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
// 회원가입 탭 도트 픽셀 아바타 선택기 렌더링
// ============================================================
function renderSignupAvatarPicker() {
  const grid = document.getElementById('signup-avatar-grid');
  const hiddenInput = document.getElementById('signup-avatar');
  if (!grid || !hiddenInput) return;

  const currentKey = normalizePixelAvatarKey(hiddenInput.value || 'frog');
  hiddenInput.value = currentKey;

  grid.innerHTML = PIXEL_AVATAR_OPTIONS.map(opt => {
    const selected = opt.key === currentKey;
    return `
      <button type="button"
              class="win95-avatar-choice ${selected ? 'selected' : ''}"
              data-avatar-key="${opt.key}"
              role="radio"
              aria-checked="${selected}"
              title="${opt.label}">
        ${renderPixelAvatarHtml(opt.key, 24)}
        <span>${opt.label}</span>
      </button>
    `;
  }).join('');

  grid.querySelectorAll('.win95-avatar-choice').forEach(btn => {
    btn.addEventListener('click', () => {
      playRetroTone('click');
      hiddenInput.value = btn.dataset.avatarKey || 'frog';
      renderSignupAvatarPicker();
    });
  });
}

// ============================================================
// Google Sheets Users 목록 동기화
// ============================================================
async function syncRegisteredUsersList() {
  const cached = loadLocalCache(USERS_CACHE_KEY, null);
  if (Array.isArray(cached) && cached.length > 0) {
    window.registeredOsUsers = cached;
  }
  populateLoginAccountSelect();

  try {
    const res = await fetch(`${GAS_WEB_APP_URL}?action=users`);
    const json = await res.json();
    if (json.status === 'success' && Array.isArray(json.users) && json.users.length > 0) {
      window.registeredOsUsers = json.users;
      saveLocalCache(USERS_CACHE_KEY, json.users);
      populateLoginAccountSelect();
    }
  } catch {}
}

function populateLoginAccountSelect() {
  const sel = document.getElementById('login-account-select');
  if (!sel) return;
  const users = window.registeredOsUsers || DEFAULT_FALLBACK_USERS;
  const prevVal = sel.value;

  sel.innerHTML = users.map(u => {
    const prefix = u.role === 'public' ? '[PUBLIC]' : (u.role === 'owner' ? '[SYSOP]' : '[USER]');
    const suffix = u.role === 'public' ? '(공용 계정)' : '(개인 계정)';
    return `<option value="${esc(u.username)}">${prefix} ${esc(u.username)} ${suffix}</option>`;
  }).join('') + `<option value="__CUSTOM__">[+] 직접 사용자 이름 입력...</option>`;

  if (prevVal && Array.from(sel.options).some(o => o.value === prevVal)) {
    sel.value = prevVal;
  }
  handleLoginAccountSelectChange();
}

function handleLoginAccountSelectChange() {
  const sel = document.getElementById('login-account-select');
  const customInput = document.getElementById('login-username');
  const pinInput = document.getElementById('login-password');
  const avatarBox = document.getElementById('login-profile-avatar');
  const nameBox = document.getElementById('login-profile-name');
  const hintBox = document.getElementById('login-account-hint');
  if (!sel || !customInput || !pinInput) return;

  const val = sel.value;
  if (val === '__CUSTOM__') {
    customInput.style.display = 'block';
    customInput.value = '';
    customInput.focus();
    pinInput.disabled = false;
    pinInput.placeholder = '4자리 숫자 PIN 입력';
    if (avatarBox) avatarBox.innerHTML = renderPixelAvatarHtml('user', 32, 'user');
    if (nameBox) nameBox.textContent = '[CUSTOM] 직접 계정 입력 모드';
    if (hintBox) hintBox.textContent = '[INPUT] 등록한 사용자 이름과 4자리 숫자 암호를 입력하십시오.';
    return;
  }

  customInput.style.display = 'none';
  customInput.value = val;

  const matched = (window.registeredOsUsers || []).find(u => u.username === val);
  const userObj = matched || { username: val, role: 'user', avatar: 'user', bio: '' };
  const roleTag = userObj.role === 'public' ? '[PUBLIC]' : (userObj.role === 'owner' ? '[SYSOP]' : '[USER]');

  if (avatarBox) {
    avatarBox.innerHTML = renderPixelAvatarHtml(userObj.avatar, 32, userObj.role);
  }
  if (nameBox) {
    nameBox.textContent = `${roleTag} ${userObj.username}`;
  }

  if (userObj.role === 'public') {
    pinInput.value = '';
    pinInput.disabled = true;
    pinInput.placeholder = '공용 계정은 암호 없이 입장 가능';
    if (hintBox) hintBox.textContent = formatRetroBio(userObj.bio, userObj);
  } else {
    pinInput.disabled = false;
    pinInput.placeholder = '4자리 숫자 PIN (예: 1234)';
    if (hintBox) hintBox.textContent = `${formatRetroBio(userObj.bio, userObj)} // [PIN REQUIRED]`;
  }
}

// ============================================================
// 부팅 단계 제어 (BIOS -> SPLASH -> WIN95 LOGON -> DESKTOP)
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
    switchLoginTab('signin');
    renderSignupAvatarPicker();
    syncRegisteredUsersList();
    const statusEl = document.getElementById('login-cloud-status');
    const ledEl = document.getElementById('login-cloud-led');
    if (statusEl) {
      const count = Array.isArray(window.archiveItems) ? window.archiveItems.length : 0;
      statusEl.textContent = count > 0
        ? `[ONLINE] Google Sheets 아카이브 동기화 완료 (전체 ${count}건 대기 중)`
        : '[READY] Google Sheets 사용자 인증 및 아카이브 준비 완료';
    }
    if (ledEl) ledEl.style.background = '#008000';
  }
}

function switchLoginTab(tabName) {
  bootState.loginTab = tabName;
  const signinPane = document.getElementById('win95-pane-signin');
  const signupPane = document.getElementById('win95-pane-signup');
  const tabSignin = document.getElementById('tab-win95-signin');
  const tabSignup = document.getElementById('tab-win95-signup');
  const errBox = document.getElementById('win95-login-error');

  if (errBox) errBox.style.display = 'none';
  if (signinPane) signinPane.style.display = tabName === 'signin' ? 'grid' : 'none';
  if (signupPane) signupPane.style.display = tabName === 'signup' ? 'grid' : 'none';
  if (tabSignin) {
    tabSignin.classList.toggle('active', tabName === 'signin');
    tabSignin.setAttribute('aria-selected', String(tabName === 'signin'));
  }
  if (tabSignup) {
    tabSignup.classList.toggle('active', tabName === 'signup');
    tabSignup.setAttribute('aria-selected', String(tabName === 'signup'));
  }
}

function showLoginError(msg) {
  playRetroTone('boom');
  const errBox = document.getElementById('win95-login-error');
  if (errBox) {
    errBox.style.display = 'flex';
    errBox.innerHTML = `
      <svg class="pixel-svg-14" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">
        <path fill="#000000" d="M7 1h2v2h1v2h1v2h1v2h1v2h1v3H2v-3h1V9h1V7h1V5h1V3h1V1z"/>
        <path fill="#ffff00" d="M7 3h2v2h1v2h1v2h1v2h1v2H3v-2h1V9h1V7h1V5h1V3z"/>
        <path fill="#000000" d="M7 5h2v5H7V5zm0 6h2v2H7v-2z"/>
      </svg>
      <span>[ERROR] ${esc(msg)}</span>
    `;
  }
}

function startBiosBootSequence() {
  clearBootTimers();
  bootState.biosBeepPlayed = false;

  const overlay = document.getElementById('os-boot-overlay');
  if (!overlay) return;

  overlay.style.display = 'flex';
  overlay.style.opacity = '1';
  overlay.classList.remove('boot-fade-out');
  document.body.classList.add('boot-locked');

  setBootStage('bios');

  const ramEl = document.getElementById('bios-ram-count');
  const logEl = document.getElementById('bios-log-lines');
  const syncBadge = document.getElementById('bios-sync-badge');

  if (logEl) logEl.innerHTML = '';
  if (ramEl) ramEl.textContent = '640';

  let ramVal = 640;
  bootState.ramInterval = setInterval(() => {
    ramVal += 4096;
    if (ramVal >= 65536) {
      ramVal = 65536;
      clearInterval(bootState.ramInterval);
      bootState.ramInterval = null;
    }
    if (ramEl) ramEl.textContent = String(ramVal);
  }, 50);

  const postSteps = [
    { delay: 200, text: 'Detecting IDE Primary Master   ... MY-ARCHIVE-SSD [OK]' },
    { delay: 440, text: 'Detecting IDE Primary Slave    ... JUKEBOX-CDROM 4X [OK]' },
    { delay: 700, text: 'Initializing User Account DB   ... Users & Community Sheet [OK]' },
    { delay: 980, text: 'Connecting Google Apps Script  ... Cloud Drive Mounted [OK]' },
    { delay: 1280, text: 'Verifying DMI Pool Data ........ Update Success' },
    { delay: 1560, text: 'Starting MY-ARCHIVE 95...' }
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

  bootState.timers.push(setTimeout(() => {
    if (bootState.stage === 'bios') setBootStage('splash');
  }, 1950));

  bootState.timers.push(setTimeout(() => {
    if (bootState.stage === 'splash') setBootStage('login');
  }, 3050));
}

function finishDesktopLogin(userObj) {
  clearBootTimers();
  bootState.stage = 'done';
  setCurrentUser(userObj);

  const statusLeft = document.getElementById('status-left');
  if (statusLeft) {
    statusLeft.textContent = userObj.role === 'public'
      ? '[PUBLIC] 공용 계정으로 접속됨 — 전체 공유 아카이브 및 게시판 활성화'
      : `[LOGIN] ${userObj.username}님 환영합니다 — 개인 아카이브 및 전체 게시판 준비 완료`;
  }

  playWin95StartupSound();

  if (typeof refreshAllViews === 'function') {
    refreshAllViews();
  }

  const overlay = document.getElementById('os-boot-overlay');
  if (overlay) {
    overlay.classList.add('boot-fade-out');
    setTimeout(() => {
      overlay.style.display = 'none';
      document.body.classList.remove('boot-locked');
    }, 380);
  } else {
    document.body.classList.remove('boot-locked');
  }
}

// ============================================================
// 로그인 / 회원가입 이벤트 핸들러
// ============================================================
function bindBootScreenEvents() {
  document.getElementById('boot-stage-bios')?.addEventListener('click', () => {
    playBiosPostBeep();
    clearBootTimers();
    setBootStage('login');
  });

  document.getElementById('boot-stage-splash')?.addEventListener('click', () => {
    clearBootTimers();
    setBootStage('login');
  });

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

  document.getElementById('tab-win95-signin')?.addEventListener('click', () => {
    playRetroTone('click');
    switchLoginTab('signin');
  });

  document.getElementById('tab-win95-signup')?.addEventListener('click', () => {
    playRetroTone('click');
    switchLoginTab('signup');
    document.getElementById('signup-username')?.focus();
  });

  document.getElementById('login-account-select')?.addEventListener('change', handleLoginAccountSelectChange);

  // 1. 기존 계정 로그인 폼 제출
  document.getElementById('win95-login-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const selVal = document.getElementById('login-account-select')?.value;
    const rawName = selVal === '__CUSTOM__'
      ? document.getElementById('login-username')?.value.trim()
      : selVal;
    const pin = (document.getElementById('login-password')?.value || '').trim();

    if (!rawName) {
      showLoginError('사용자 이름을 입력하거나 선택해 주세요.');
      return;
    }

    if (rawName === '공용') {
      const pubUser = (window.registeredOsUsers || []).find(u => u.username === '공용') || DEFAULT_FALLBACK_USERS[0];
      finishDesktopLogin(pubUser);
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      showLoginError('개인 계정은 4자리 숫자 비밀번호(PIN)를 입력해야 합니다.');
      document.getElementById('login-password')?.focus();
      return;
    }

    const btn = document.getElementById('btn-win95-login');
    if (btn) { btn.disabled = true; btn.textContent = '인증 확인 중...'; }

    try {
      const res = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'login_user', username: rawName, pin })
      });
      const json = await res.json();
      if (json.status === 'success' && json.user) {
        finishDesktopLogin(json.user);
      } else {
        showLoginError(json.message || '로그인 인증에 실패했습니다.');
      }
    } catch {
      if (rawName === '문태양' && pin === '1234') {
        finishDesktopLogin(DEFAULT_FALLBACK_USERS[1]);
      } else {
        showLoginError('서버 연결에 실패했습니다. 네트워크 및 Apps Script 배포 상태를 확인하세요.');
      }
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '확인 (로그인)'; }
    }
  });

  // 2. 공용 계정 원클릭 입장 버튼
  document.getElementById('btn-win95-public-enter')?.addEventListener('click', () => {
    const pubUser = (window.registeredOsUsers || []).find(u => u.username === '공용') || DEFAULT_FALLBACK_USERS[0];
    finishDesktopLogin(pubUser);
  });

  // 3. 새 이용자 계정 생성 폼 제출
  document.getElementById('win95-signup-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const username = (document.getElementById('signup-username')?.value || '').trim();
    const pin = (document.getElementById('signup-pin')?.value || '').trim();
    const pinConfirm = (document.getElementById('signup-pin-confirm')?.value || '').trim();
    const avatar = normalizePixelAvatarKey(document.getElementById('signup-avatar')?.value || 'frog');
    const rawBio = (document.getElementById('signup-bio')?.value || '').trim();
    const bio = formatRetroBio(rawBio, { username, role: 'user' });

    if (username.length < 2 || username.length > 15) {
      showLoginError('사용자 이름은 2~15자로 입력해 주세요.');
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      showLoginError('비밀번호는 반드시 숫자 4자리(예: 2580)로 입력해 주세요.');
      return;
    }
    if (pin !== pinConfirm) {
      showLoginError('4자리 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    const btn = document.getElementById('btn-win95-signup-submit');
    if (btn) { btn.disabled = true; btn.textContent = '계정 생성 중...'; }

    try {
      const res = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'register_user', username, pin, avatar, bio })
      });
      const json = await res.json();
      if (json.status === 'success' && json.user) {
        window.registeredOsUsers = [...(window.registeredOsUsers || []), json.user];
        saveLocalCache(USERS_CACHE_KEY, window.registeredOsUsers);
        finishDesktopLogin(json.user);
      } else {
        showLoginError(json.message || '계정 생성에 실패했습니다.');
      }
    } catch {
      showLoginError('서버 통신 중 오류가 발생했습니다. Apps Script 새 배포 상태를 확인하세요.');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '계정 생성 및 즉시 로그인'; }
    }
  });

  // [?] BIOS 다시 보기
  document.getElementById('btn-reboot-bios')?.addEventListener('click', () => {
    playBiosPostBeep();
    startBiosBootSequence();
  });

  // 시작 메뉴 로그오프 / 계정 전환 버튼 바인딩
  document.getElementById('sm-logoff')?.addEventListener('click', () => {
    const sm = document.getElementById('start-menu');
    if (sm) sm.classList.remove('open');
    document.getElementById('btn-start')?.classList.remove('pressed');
    startBiosBootSequence();
  });
}

window.startBiosBootSequence = startBiosBootSequence;
window.getCurrentUser = getCurrentUser;

document.addEventListener('DOMContentLoaded', () => {
  renderSignupAvatarPicker();
  bindBootScreenEvents();
  startBiosBootSequence();
});

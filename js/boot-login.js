// ============================================================
// MY-ARCHIVE 95 OS — Logon, Signup, User Search, Sync & Boot Entry
// ============================================================

window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
window.__MOD_VERSIONS.bootLogin = 'v2026.11.26-boot-login-desktop-width-guard';

const SESSION_USER_KEY = 'myarchive95_current_user_v2';
const USERS_CACHE_KEY = 'myarchive95_users_cache_v2';
const LOGIN_RESPONSIVE_STYLE_ID = 'myarchive95-login-responsive-style';

function applyLoginResponsiveStyle() {
  if (document.getElementById(LOGIN_RESPONSIVE_STYLE_ID)) return;
  const parent = document.head || document.documentElement;
  if (!parent) return;

  const style = document.createElement('style');
  style.id = LOGIN_RESPONSIVE_STYLE_ID;
  style.textContent = `
    #boot-stage-login,
    #win95-account-settings-modal {
      box-sizing: border-box;
      max-width: 100vw;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
    }
    #boot-stage-login .win95-login-dialog,
    #win95-account-settings-modal .win95-login-dialog {
      box-sizing: border-box !important;
      width: min(480px, 100%) !important;
      max-width: 480px !important;
      min-width: 0 !important;
      max-height: calc(var(--app-vh, 100vh) - 20px) !important;
      margin: 0 auto !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
    }
    #boot-stage-login .win95-logon-body,
    #win95-account-settings-modal .win95-logon-body {
      min-width: 0;
      overflow-y: auto;
      overflow-x: hidden;
      overflow-wrap: anywhere;
      word-break: break-word;
      -webkit-overflow-scrolling: touch;
    }
    #boot-stage-login .win95-logon-grid,
    #win95-account-settings-modal .win95-logon-grid {
      min-width: 0;
    }
    #boot-stage-login select,
    #boot-stage-login input,
    #win95-account-settings-modal select,
    #win95-account-settings-modal input {
      box-sizing: border-box;
      max-width: 100%;
      min-width: 0;
    }
    #boot-stage-login .win95-avatar-grid,
    #win95-account-settings-modal .win95-avatar-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 6px;
      min-width: 0;
    }
    #boot-stage-login .win95-avatar-choice,
    #win95-account-settings-modal .win95-avatar-choice {
      min-width: 0;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    @media (max-width: 768px) {
      #boot-stage-login {
        padding: 8px !important;
        align-items: flex-start !important;
        height: auto !important;
        min-height: var(--app-vh, 100vh) !important;
      }
      #win95-account-settings-modal {
        padding: 8px !important;
        align-items: flex-start !important;
      }
      #boot-stage-login .win95-login-dialog,
      #win95-account-settings-modal .win95-login-dialog {
        width: 100% !important;
        max-width: 100% !important;
        margin: 4px auto !important;
        max-height: calc(var(--app-vh, 100vh) - 16px) !important;
      }
      #boot-stage-login .win95-logon-grid,
      #win95-account-settings-modal .win95-logon-grid {
        grid-template-columns: 1fr !important;
        gap: 6px !important;
      }
      #boot-stage-login .win95-logon-label,
      #win95-account-settings-modal .win95-logon-label {
        padding-top: 2px !important;
      }
      #login-user-search-row {
        flex-wrap: wrap !important;
        gap: 6px !important;
      }
      #login-user-search-input {
        flex: 1 1 160px !important;
        width: 100%;
      }
    }
    @media (max-width: 480px) {
      #boot-stage-login .win95-avatar-grid,
      #win95-account-settings-modal .win95-avatar-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }
      #boot-stage-login .win95-logon-actions,
      #win95-account-settings-modal .win95-logon-actions {
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 6px !important;
      }
      #boot-stage-login .win95-logon-actions button,
      #win95-account-settings-modal .win95-logon-actions button {
        width: 100%;
      }
    }
  `;
  parent.appendChild(style);
}

function syncLoginViewportHeight() {
  applyLoginResponsiveStyle();
  const vh = window.visualViewport && typeof window.visualViewport.height === 'number' && window.visualViewport.height > 0
    ? Math.round(window.visualViewport.height)
    : window.innerHeight;
  if (vh > 0) {
    document.documentElement.style.setProperty('--app-vh', `${vh}px`);
  }
}

function loginSafeEsc(str) {
  if (typeof window.esc === 'function') return window.esc(str);
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function loginSafeLoadCache(key, fallback) {
  if (typeof window.loadLocalCache === 'function') {
    try { return window.loadLocalCache(key, fallback); } catch {}
  }
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function loginSafeSaveCache(key, value) {
  if (typeof window.saveLocalCache === 'function') {
    try { window.saveLocalCache(key, value); return; } catch {}
  }
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function getGasApiUrl() {
  if (typeof GAS_WEB_APP_URL !== 'undefined' && GAS_WEB_APP_URL) return String(GAS_WEB_APP_URL).trim();
  if (window.GAS_WEB_APP_URL) return String(window.GAS_WEB_APP_URL).trim();
  if (window.CONFIG?.GAS_WEB_APP_URL) return String(window.CONFIG.GAS_WEB_APP_URL).trim();
  if (window.APP_CONFIG?.GAS_WEB_APP_URL) return String(window.APP_CONFIG.GAS_WEB_APP_URL).trim();
  return '';
}

function isLoginSoundEnabled() {
  if (typeof window.__WIN95_SOUND_ENABLED === 'boolean') return window.__WIN95_SOUND_ENABLED;
  const setup = typeof window.loadInitialSetup === 'function' ? window.loadInitialSetup() : null;
  return setup ? Boolean(setup.sound) : true;
}

function loginSafeTone(type) {
  if (!isLoginSoundEnabled()) return;
  if (typeof window.playRetroTone === 'function') {
    try { window.playRetroTone(type); } catch {}
  }
}

// ============================================================
// 1995년 16색 도트 픽셀 SVG 아바타 라이브러리
// ============================================================
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

const AVATAR_ALIAS_MAP = {
  ADMIN: 'frog',
  PUBLIC: 'globe',
  USER: 'user',
  '\u{1F438}': 'frog',
  '\u{1F310}': 'globe',
  '\u{1F464}': 'user',
  '\u{1F4DA}': 'book',
  '\u{1F3A7}': 'headphone',
  '\u{1F3AC}': 'movie',
  '\u{2B50}': 'star'
};

function normalizePixelAvatarKey(rawAvatar, role = 'user') {
  const normRole = String(role || 'user').trim().toLowerCase();
  if (normRole === 'public' && !rawAvatar) return 'globe';
  if ((normRole === 'owner' || normRole === 'admin') && !rawAvatar) return 'frog';
  const val = String(rawAvatar || '').trim();
  const upperVal = val.toUpperCase();
  if (AVATAR_ALIAS_MAP[val]) return AVATAR_ALIAS_MAP[val];
  if (AVATAR_ALIAS_MAP[upperVal]) return AVATAR_ALIAS_MAP[upperVal];
  if (PIXEL_AVATARS[val]) return val;
  return normRole === 'public' ? 'globe' : ((normRole === 'owner' || normRole === 'admin') ? 'frog' : 'user');
}

function renderPixelAvatarHtml(rawAvatar, sizePx = 28, role = 'user') {
  const key = normalizePixelAvatarKey(rawAvatar, role);
  const svg = PIXEL_AVATARS[key] || PIXEL_AVATARS.user;
  return `<span class="pixel-avatar-wrap" style="width:${sizePx}px;height:${sizePx}px;display:inline-flex;align-items:center;justify-content:center;">${svg}</span>`;
}

function formatRetroBio(rawBio, userObj = {}) {
  const cleaned = String(rawBio || '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F]/gu, '')
    .trim();

  const normRole = String(userObj.role || '').trim().toLowerCase();
  const isAdmin = typeof window.isAdminUser === 'function'
    ? window.isAdminUser(userObj)
    : (normRole === 'owner' || normRole === 'admin' || userObj.username === '문태양');

  if (normRole === 'public' || userObj.username === '공용') {
    return cleaned
      ? `[PUBLIC] ${cleaned.replace(/^\[PUBLIC\]\s*/i, '')}`
      : '[PUBLIC] 공용 단말기 모드 - 누구나 자유롭게 감상을 기록하고 광장 게시판에 공유';
  }
  if (isAdmin) {
    return cleaned
      ? `[SYSOP] ${cleaned.replace(/^\[SYSOP\]\s*/i, '')}`
      : '[SYSOP] 시스템 관리자 워크스테이션 - 개인 서재 및 광장 게시판 전체 관리';
  }
  if (!cleaned) {
    return '[USER] 개인 서재 보관함 관리 및 광장 게시판 기고·스크랩 지원';
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
    bio: '[PUBLIC] 공용 단말기 모드 - 누구나 자유롭게 감상을 기록하고 광장 게시판에 공유',
    avatar: 'globe'
  },
  {
    id: 'USR-OWNER',
    username: '문태양',
    role: 'owner',
    bio: '[SYSOP] 시스템 관리자 워크스테이션 - 개인 서재 및 광장 게시판 전체 관리',
    avatar: 'frog'
  }
];

window.currentOsUser = null;
window.registeredOsUsers = [...DEFAULT_FALLBACK_USERS];

const bootState = {
  stage: 'intro',
  loginTab: 'signin',
  userSearchOpen: false,
  userSearchQuery: '',
  isSubmitting: false,
  timers: [],
  ramInterval: null,
  biosBeepPlayed: false,
  startupSoundPlayed: false,
  bootSeqId: 0
};

function getPersonalUsersList() {
  const all = Array.isArray(window.registeredOsUsers) ? window.registeredOsUsers : DEFAULT_FALLBACK_USERS;
  return all.filter(u =>
    u &&
    String(u.role || '').trim().toLowerCase() !== 'public' &&
    String(u.username || '').trim() !== '공용' &&
    String(u.id || '') !== 'USR-PUBLIC'
  );
}

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
  const saved = loginSafeLoadCache(SESSION_USER_KEY, null);
  if (saved && saved.username) {
    window.currentOsUser = saved;
    return saved;
  }
  return DEFAULT_FALLBACK_USERS[1];
}

function setCurrentUser(userObj) {
  const normalizedRole = String(userObj.role || 'member').trim().toLowerCase();
  const normalized = {
    ...userObj,
    role: normalizedRole,
    avatar: normalizePixelAvatarKey(userObj.avatar, normalizedRole)
  };
  window.currentOsUser = normalized;
  loginSafeSaveCache(SESSION_USER_KEY, normalized);
  updateDesktopUserBadge();
}

function updateDesktopUserBadge() {
  const user = getCurrentUser();
  const normRole = String(user?.role || '').trim().toLowerCase();
  const isAdmin = typeof window.isAdminUser === 'function'
    ? window.isAdminUser(user)
    : (normRole === 'owner' || normRole === 'admin');

  const badge = document.getElementById('active-user-badge');
  if (badge && user) {
    const roleLabel = normRole === 'public' ? '비로그인' : (isAdmin ? '관리자' : '개인');
    badge.innerHTML = `${renderPixelAvatarHtml(user.avatar, 14, normRole)}<span>${loginSafeEsc(user.username)} (${roleLabel})</span>`;
  }
  const winMainTitle = document.getElementById('win-main-title-text');
  if (winMainTitle && user) {
    winMainTitle.textContent = normRole === 'public'
      ? 'C:\\MY-ARCHIVE\\PUBLIC.EXE — 공용 단말기 아카이브'
      : `C:\\MY-ARCHIVE\\${user.username.toUpperCase()}.EXE — ${user.username}의 개인 아카이브`;
  }
}

// ============================================================
// 동기화 상태 배지 실시간 업데이트
// ============================================================
let __syncPollTimer = null;

function setArchiveSyncStatus(mode = 'done', customLabel = '') {
  const badge = document.getElementById('cache-status-badge');
  if (!badge) return;

  if (mode === 'syncing') {
    badge.style.background = '#ecfdf5';
    badge.style.color = '#14532d';
    badge.style.borderColor = '#16a34a';
    badge.innerHTML = `<span id="sync-status-icon" class="archive-sync-spin" style="color:#16a34a;font-weight:900;">↻</span><span id="sync-status-text">${loginSafeEsc(customLabel || '동기화 중')}</span>`;
  } else if (mode === 'error') {
    badge.style.background = '#fef2f2';
    badge.style.color = '#991b1b';
    badge.style.borderColor = '#dc2626';
    badge.innerHTML = `<span id="sync-status-icon" style="color:#dc2626;font-weight:900;">✕</span><span id="sync-status-text">${loginSafeEsc(customLabel || '동기화 실패')}</span>`;
  } else {
    badge.style.background = '#f0fdf4';
    badge.style.color = '#166534';
    badge.style.borderColor = '#16a34a';
    badge.innerHTML = `<span id="sync-status-icon" style="color:#16a34a;font-weight:900;">✓</span><span id="sync-status-text">${loginSafeEsc(customLabel || '동기화 완료')}</span>`;
  }
}

function hookArchiveSyncLifecycle() {
  if (typeof window.loadArchiveData === 'function' && !window.loadArchiveData.__syncWrapped) {
    const origLoad = window.loadArchiveData;
    const wrappedLoad = async function (...args) {
      setArchiveSyncStatus('syncing', '동기화 중');
      try {
        const result = await origLoad.apply(this, args);
        setArchiveSyncStatus('done', '동기화 완료');
        return result;
      } catch (err) {
        setArchiveSyncStatus('error', '동기화 실패');
        throw err;
      }
    };
    wrappedLoad.__syncWrapped = true;
    window.loadArchiveData = wrappedLoad;
  }

  if (!__syncPollTimer) {
    __syncPollTimer = setInterval(() => {
      if (document.hidden || bootState.stage !== 'done') return;
      if (typeof window.loadArchiveData === 'function') {
        hookArchiveSyncLifecycle();
        window.loadArchiveData(true).catch(() => setArchiveSyncStatus('error', '동기화 실패'));
      }
    }, 30000);
  }
}

window.setArchiveSyncStatus = setArchiveSyncStatus;

// ============================================================
// 메인 화면 계정명 클릭 시 뜨는 계정 설정 팝업
// ============================================================
function openAccountSettingsModal() {
  syncLoginViewportHeight();
  loginSafeTone('click');
  const prev = document.getElementById('win95-account-settings-modal');
  if (prev) prev.remove();

  const curUser = getCurrentUser() || DEFAULT_FALLBACK_USERS[1];
  const isPublic = String(curUser.role || '').toLowerCase() === 'public' || curUser.username === '공용';
  const curAvatar = normalizePixelAvatarKey(curUser.avatar, curUser.role);
  const curBio = String(curUser.bio || '').replace(/^\[(SYSOP|USER|PUBLIC)\]\s*/i, '');

  const modal = document.createElement('div');
  modal.id = 'win95-account-settings-modal';
  modal.style.cssText = `
    position: fixed; inset: 0; z-index: 150000;
    background: rgba(0, 0, 0, 0.45);
    display: flex; align-items: center; justify-content: center; padding: 12px;
  `;

  modal.innerHTML = `
    <div class="win95-login-dialog" style="width: 100%; max-width: 440px; margin: 0;">
      <div class="win95-logon-titlebar">
        <div class="win95-logon-title-left">
          <span>계정 설정 — ${loginSafeEsc(curUser.username)}</span>
        </div>
        <button type="button" id="btn-acct-close-x" class="win95-title-help-btn">X</button>
      </div>

      <div class="win95-logon-body">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px; padding:8px; background:#fff; border:1.5px solid #808080;">
          <div id="acct-modal-avatar-preview">${renderPixelAvatarHtml(curAvatar, 32, curUser.role)}</div>
          <div style="min-width:0; flex:1;">
            <div style="font-weight:900; font-size:0.9rem; overflow:hidden; text-overflow:ellipsis;">${loginSafeEsc(curUser.username)}</div>
            <div style="font-size:0.75rem; color:#555;">${isPublic ? '공용 단말기 세션' : '개인 계정 세션'}</div>
          </div>
        </div>

        ${!isPublic ? `
          <div class="win95-logon-grid">
            <span class="win95-logon-label" style="align-self:start; padding-top:6px;">초상화:</span>
            <div>
              <input type="hidden" id="acct-edit-avatar" value="${loginSafeEsc(curAvatar)}" />
              <div id="acct-edit-avatar-grid" class="win95-avatar-grid" role="radiogroup"></div>
            </div>

            <label class="win95-logon-label" for="acct-edit-bio">한줄 소개:</label>
            <input type="text" id="acct-edit-bio" class="win95-logon-input" maxlength="60" value="${loginSafeEsc(curBio)}" placeholder="한줄 소개를 입력하세요" />

            <label class="win95-logon-label" for="acct-edit-pin">새 PIN(4자리):</label>
            <input type="password" id="acct-edit-pin" class="win95-logon-input" maxlength="4" inputmode="numeric" pattern="[0-9]{4}" placeholder="변경할 때만 4자리 입력" />
          </div>
        ` : `
          <div style="font-size:0.8rem; color:#333; padding:8px; background:#fff; border:1.5px solid #808080; margin-bottom:10px;">
            공용 단말기로 접속 중입니다. 개인 계정으로 전환하려면 [로그아웃 / 계정 전환]을 누르십시오.
          </div>
        `}

        <div class="win95-logon-actions" style="justify-content:space-between; margin-top:14px; gap:6px; flex-wrap:wrap;">
          <button type="button" id="btn-acct-logout" class="win95-dlg-btn">로그아웃 / 계정 전환</button>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button type="button" id="btn-acct-cancel" class="win95-dlg-btn">취소</button>
            ${!isPublic ? `<button type="button" id="btn-acct-save" class="win95-dlg-btn primary">설정 저장</button>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeModal = () => modal.remove();
  modal.querySelector('#btn-acct-close-x')?.addEventListener('click', closeModal);
  modal.querySelector('#btn-acct-cancel')?.addEventListener('click', closeModal);
  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });

  modal.querySelector('#btn-acct-logout')?.addEventListener('click', () => {
    closeModal();
    startBiosBootSequence({ skip3d: true });
  });

  if (!isPublic) {
    const paintAvatarGrid = () => {
      const hidden = modal.querySelector('#acct-edit-avatar');
      const grid = modal.querySelector('#acct-edit-avatar-grid');
      const prevBox = modal.querySelector('#acct-modal-avatar-preview');
      if (!hidden || !grid) return;
      const key = normalizePixelAvatarKey(hidden.value || curAvatar, curUser.role);
      hidden.value = key;
      if (prevBox) prevBox.innerHTML = renderPixelAvatarHtml(key, 32, curUser.role);
      grid.innerHTML = PIXEL_AVATAR_OPTIONS.map(opt => {
        const sel = opt.key === key;
        return `
          <button type="button" class="win95-avatar-choice ${sel ? 'selected' : ''}" data-acct-av="${opt.key}">
            ${renderPixelAvatarHtml(opt.key, 18)}
            <span>${opt.label}</span>
          </button>
        `;
      }).join('');
      grid.querySelectorAll('[data-acct-av]').forEach(b => {
        b.addEventListener('click', () => {
          loginSafeTone('click');
          hidden.value = b.dataset.acctAv;
          paintAvatarGrid();
        });
      });
    };
    paintAvatarGrid();

    modal.querySelector('#acct-edit-pin')?.addEventListener('input', e => {
      e.target.value = String(e.target.value || '').replace(/\D/g, '').slice(0, 4);
    });

    modal.querySelector('#btn-acct-save')?.addEventListener('click', async () => {
      const nextAvatar = normalizePixelAvatarKey(modal.querySelector('#acct-edit-avatar')?.value || curAvatar, curUser.role);
      const rawBio = (modal.querySelector('#acct-edit-bio')?.value || '').trim();
      const nextBio = formatRetroBio(rawBio, curUser);
      const nextPin = (modal.querySelector('#acct-edit-pin')?.value || '').trim();

      if (nextPin && !/^\d{4}$/.test(nextPin)) {
        loginSafeTone('boom');
        alert('PIN은 숫자 4자리로 입력해 주십시오.');
        return;
      }

      const updatedUser = {
        ...curUser,
        avatar: nextAvatar,
        bio: nextBio
      };
      setCurrentUser(updatedUser);

      window.registeredOsUsers = (window.registeredOsUsers || []).map(u =>
        u.username === curUser.username ? { ...u, avatar: nextAvatar, bio: nextBio } : u
      );
      loginSafeSaveCache(USERS_CACHE_KEY, window.registeredOsUsers);

      const apiUrl = getGasApiUrl();
      if (apiUrl) {
        setArchiveSyncStatus('syncing', '동기화 중');
        try {
          const payload = {
            action: 'update_user',
            username: curUser.username,
            avatar: nextAvatar,
            bio: nextBio
          };
          if (nextPin) payload.pin = nextPin;
          await fetch(apiUrl, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
          });
          setArchiveSyncStatus('done', '동기화 완료');
        } catch {
          setArchiveSyncStatus('error', '동기화 실패');
        }
      }

      loginSafeTone('open');
      closeModal();
    });
  }
}

window.openAccountSettingsModal = openAccountSettingsModal;

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
        ${renderPixelAvatarHtml(opt.key, 20)}
        <span>${opt.label}</span>
      </button>
    `;
  }).join('');

  grid.querySelectorAll('.win95-avatar-choice').forEach(btn => {
    btn.addEventListener('click', () => {
      loginSafeTone('click');
      hiddenInput.value = btn.dataset.avatarKey || 'frog';
      renderSignupAvatarPicker();
    });
  });
}

// ============================================================
// 등록 사용자 목록 동기화 & 유저 검색 필터링
// ============================================================
async function syncRegisteredUsersList() {
  const cached = loginSafeLoadCache(USERS_CACHE_KEY, null);
  if (Array.isArray(cached) && cached.length > 0) {
    window.registeredOsUsers = cached;
  }
  populateLoginAccountSelect();
  updateLogonStatusLine();

  const apiUrl = getGasApiUrl();
  if (!apiUrl) return;

  try {
    const res = await fetch(`${apiUrl}?action=users`, { redirect: 'follow' });
    const json = await res.json();
    if (json.status === 'success' && Array.isArray(json.users) && json.users.length > 0) {
      window.registeredOsUsers = json.users;
      loginSafeSaveCache(USERS_CACHE_KEY, json.users);

      if (window.currentOsUser && window.currentOsUser.username) {
        const syncedMe = json.users.find(u => u.username === window.currentOsUser.username);
        if (syncedMe && syncedMe.role !== window.currentOsUser.role) {
          setCurrentUser({ ...window.currentOsUser, role: syncedMe.role });
        }
      }

      populateLoginAccountSelect();
      updateLogonStatusLine();
    }
  } catch {}
}

function updateLogonStatusLine() {
  const statusEl = document.getElementById('login-cloud-status');
  const statusBox = statusEl?.closest('.win95-status-bar-box');
  if (statusEl) statusEl.textContent = '';
  if (statusBox) statusBox.style.display = 'none';
}

function populateLoginAccountSelect() {
  const sel = document.getElementById('login-account-select');
  if (!sel) return;

  const personalUsers = getPersonalUsersList();
  const q = bootState.userSearchQuery.trim().toLowerCase();
  const filteredUsers = q
    ? personalUsers.filter(u => `${u.username} ${u.bio || ''}`.toLowerCase().includes(q))
    : personalUsers;

  const countBadge = document.getElementById('login-user-search-count');
  if (countBadge) {
    countBadge.textContent = `${filteredUsers.length}/${personalUsers.length}명`;
  }

  const prevVal = sel.value;

  if (filteredUsers.length === 0) {
    sel.innerHTML = q
      ? `<option value="__NO_MATCH__">[검색 결과 없음] 일치하는 이용자가 없습니다</option><option value="__CUSTOM__">[+] 직접 사용자 이름 입력...</option>`
      : `<option value="__CUSTOM__">[+] 등록된 개인 계정 없음 — 직접 이름 입력...</option>`;
  } else {
    sel.innerHTML = filteredUsers.map(u => {
      const normRole = String(u.role || '').trim().toLowerCase();
      const isAdmin = typeof window.isAdminUser === 'function' ? window.isAdminUser(u) : (normRole === 'owner' || normRole === 'admin');
      const prefix = isAdmin ? '[SYSOP]' : '[USER]';
      const roleDesc = isAdmin ? '관리자 계정' : '개인 계정';
      return `<option value="${loginSafeEsc(u.username)}">${prefix} ${loginSafeEsc(u.username)} (${roleDesc})</option>`;
    }).join('') + `<option value="__CUSTOM__">[+] 직접 사용자 이름 입력...</option>`;
  }

  if (prevVal && Array.from(sel.options).some(o => o.value === prevVal)) {
    sel.value = prevVal;
  } else if (filteredUsers.length > 0) {
    sel.value = filteredUsers[0].username;
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
  if (val === '__NO_MATCH__') {
    customInput.style.display = 'none';
    customInput.value = '';
    pinInput.value = '';
    pinInput.disabled = true;
    pinInput.placeholder = '검색 조건과 일치하는 계정 없음';
    if (avatarBox) avatarBox.innerHTML = renderPixelAvatarHtml('user', 32, 'user');
    if (nameBox) nameBox.textContent = '[SEARCH] 일치하는 이용자 없음';
    if (hintBox) hintBox.textContent = '[INFO] 검색어를 변경하거나 하단의 [공용 단말기 접속]을 선택하십시오.';
    return;
  }

  if (val === '__CUSTOM__') {
    customInput.style.display = 'block';
    customInput.value = '';
    if (document.activeElement?.id !== 'login-user-search-input') {
      customInput.focus();
    }
    pinInput.disabled = false;
    pinInput.placeholder = '4자리 숫자 PIN 입력';
    if (avatarBox) avatarBox.innerHTML = renderPixelAvatarHtml('user', 32, 'user');
    if (nameBox) nameBox.textContent = '[CUSTOM] 직접 계정 입력 모드';
    if (hintBox) hintBox.textContent = '[INPUT] 등록한 개인 사용자 이름과 4자리 숫자 암호를 입력하십시오.';
    return;
  }

  customInput.style.display = 'none';
  customInput.value = val;

  const matched = getPersonalUsersList().find(u => u.username === val);
  const userObj = matched || { username: val, role: 'user', avatar: 'user', bio: '' };
  const normRole = String(userObj.role || '').trim().toLowerCase();
  const isAdmin = typeof window.isAdminUser === 'function' ? window.isAdminUser(userObj) : (normRole === 'owner' || normRole === 'admin');
  const roleTag = isAdmin ? '[SYSOP]' : '[USER]';

  if (avatarBox) {
    avatarBox.innerHTML = renderPixelAvatarHtml(userObj.avatar, 32, normRole);
  }
  if (nameBox) {
    nameBox.textContent = `${roleTag} ${userObj.username}`;
  }

  pinInput.disabled = false;
  pinInput.placeholder = '4자리 숫자 PIN (예: 1234)';
  if (hintBox) {
    hintBox.textContent = formatRetroBio(userObj.bio, userObj);
  }
}

// ============================================================
// 부팅 단계 제어 & 로그인/회원가입 실행기
// ============================================================
function setBootStage(stageName) {
  syncLoginViewportHeight();
  if (bootState.stage === 'done' && stageName !== 'bios' && stageName !== 'intro') {
    return;
  }
  clearBootTimers();
  bootState.stage = stageName;
  const overlay = document.getElementById('os-boot-overlay');
  const biosEl = document.getElementById('boot-stage-bios');
  const splashEl = document.getElementById('boot-stage-splash');
  const loginEl = document.getElementById('boot-stage-login');

  const showOverlay = stageName === 'bios' || stageName === 'splash' || stageName === 'login';
  if (showOverlay) {
    document.body.classList.add('boot-locked');
  }
  if (overlay) {
    overlay.classList.remove('boot-fade-out');
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = showOverlay ? 'auto' : 'none';
    overlay.style.display = showOverlay ? 'flex' : 'none';
    overlay.style.background = stageName === 'login' ? '#008080' : '#000000';
    overlay.style.alignItems = window.innerWidth <= 768 ? 'flex-start' : 'center';
    overlay.style.justifyContent = 'center';
  }

  if (biosEl) biosEl.style.display = stageName === 'bios' ? 'flex' : 'none';
  if (splashEl) splashEl.style.display = stageName === 'splash' ? 'flex' : 'none';
  if (loginEl) {
    loginEl.style.display = stageName === 'login' ? 'flex' : 'none';
    if (stageName === 'login') {
      loginEl.style.width = '100%';
      loginEl.style.height = 'auto';
      loginEl.style.minHeight = '100%';
      loginEl.style.background = '#008080';
      loginEl.style.alignItems = window.innerWidth <= 768 ? 'flex-start' : 'center';
      loginEl.style.justifyContent = 'center';
      if (typeof window.triggerCrtPowerOnFlash === 'function') {
        window.triggerCrtPowerOnFlash(loginEl.firstElementChild);
      }
    }
  }

  if (stageName === 'splash' && splashEl) {
    if (typeof window.triggerCrtPowerOnFlash === 'function') {
      window.triggerCrtPowerOnFlash(splashEl.querySelector('.win95-splash-card'));
    }
    if (typeof window.playWin95StartupSound === 'function') {
      window.playWin95StartupSound(true, bootState);
    }
  }

  if (stageName === 'login') {
    bootState.userSearchOpen = false;
    bootState.userSearchQuery = '';
    const searchRow = document.getElementById('login-user-search-row');
    const searchBtn = document.getElementById('btn-toggle-user-search');
    const searchInput = document.getElementById('login-user-search-input');
    if (searchRow) searchRow.style.display = 'none';
    if (searchBtn) searchBtn.classList.remove('active');
    if (searchInput) searchInput.value = '';

    switchLoginTab('signin');
    renderSignupAvatarPicker();
    syncRegisteredUsersList();
    updateLogonStatusLine();
  }
}

function switchLoginTab(tabName) {
  const targetTab = tabName === 'signup' ? 'signup' : 'signin';
  bootState.loginTab = targetTab;

  const signinPane = document.getElementById('win95-pane-signin');
  const signupPane = document.getElementById('win95-pane-signup');
  const tabSignin = document.getElementById('tab-win95-signin');
  const tabSignup = document.getElementById('tab-win95-signup');
  const errBox = document.getElementById('win95-login-error');

  if (errBox) errBox.style.display = 'none';
  if (signinPane) signinPane.style.display = targetTab === 'signin' ? 'block' : 'none';
  if (signupPane) {
    signupPane.style.display = targetTab === 'signup' ? 'block' : 'none';
    if (targetTab === 'signup') {
      renderSignupAvatarPicker();
    }
  }

  if (tabSignin) {
    tabSignin.classList.toggle('active', targetTab === 'signin');
    tabSignin.setAttribute('aria-selected', String(targetTab === 'signin'));
  }
  if (tabSignup) {
    tabSignup.classList.toggle('active', targetTab === 'signup');
    tabSignup.setAttribute('aria-selected', String(targetTab === 'signup'));
  }
}

function showLoginError(msg) {
  loginSafeTone('boom');
  const errBox = document.getElementById('win95-login-error');
  if (!errBox) {
    alert('[ERROR] ' + msg);
    return;
  }

  const activePane = bootState.loginTab === 'signup'
    ? document.getElementById('win95-pane-signup')
    : document.getElementById('win95-pane-signin');
  if (activePane && !activePane.contains(errBox) && (errBox.closest('#win95-pane-signin') || errBox.closest('#win95-pane-signup'))) {
    activePane.insertBefore(errBox, activePane.firstChild);
  }

  errBox.innerHTML = `
    <svg class="pixel-svg-14" style="flex-shrink:0;width:14px;height:14px;" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">
      <path fill="#000000" d="M7 1h2v2h1v2h1v2h1v2h1v2h1v3H2v-3h1V9h1V7h1V5h1V3h1V1z"/>
      <path fill="#ffff00" d="M7 3h2v2h1v2h1v2h1v2h1v2H3v-2h1V9h1V7h1V5h1V3z"/>
      <path fill="#000000" d="M7 5h2v5H7V5zm0 6h2v2H7v-2z"/>
    </svg>
    <span style="color:#800000;font-weight:700;line-height:1.35;min-width:0;word-break:break-word;">[ERROR] ${loginSafeEsc(msg)}</span>
  `;
  errBox.style.display = 'flex';
}

async function startBiosBootSequence(options = {}) {
  clearBootTimers();
  const seqId = ++bootState.bootSeqId;
  bootState.biosBeepPlayed = false;
  bootState.startupSoundPlayed = false;
  bootState.stage = 'intro';

  document.body.classList.add('boot-locked');
  const overlay = document.getElementById('os-boot-overlay');
  if (overlay) {
    overlay.style.display = 'none';
    overlay.style.opacity = '1';
    overlay.style.background = '#000000';
    overlay.classList.remove('boot-fade-out');
  }

  const biosEl = document.getElementById('boot-stage-bios');
  const splashEl = document.getElementById('boot-stage-splash');
  const loginEl = document.getElementById('boot-stage-login');
  if (biosEl) biosEl.style.display = 'none';
  if (splashEl) splashEl.style.display = 'none';
  if (loginEl) loginEl.style.display = 'none';

  const skip3d = Boolean(options.skip3d);
  if (!skip3d && typeof window.play3dCrtMonitorAnimation === 'function') {
    await window.play3dCrtMonitorAnimation({ alreadyClicked: Boolean(options.alreadyClicked) });
    if (seqId !== bootState.bootSeqId) return;
  }

  const launchBiosStageNow = () => {
    if (seqId !== bootState.bootSeqId) return;
    setBootStage('bios');
    if (typeof window.runBiosPostSequenceOnly === 'function') {
      window.runBiosPostSequenceOnly(seqId, bootState, setBootStage);
    }
  };

  if (typeof window.__runBeforeBiosAfterAnimation === 'function') {
    window.__runBeforeBiosAfterAnimation(launchBiosStageNow);
    return;
  }

  launchBiosStageNow();
}

function finishDesktopLogin(userObj) {
  bootState.bootSeqId += 1;
  clearBootTimers();
  document.getElementById('pre-click-start-hit-layer')?.remove();
  document.getElementById('pre-click-blurred-3d-crt')?.remove();
  document.getElementById('pre-click-noise-title-layer')?.remove();
  document.getElementById('retro-3d-crt-stage')?.remove();
  document.getElementById('fullscreen-crt-static-overlay')?.remove();
  bootState.stage = 'done';
  setCurrentUser(userObj);
  hookArchiveSyncLifecycle();

  const normRole = String(userObj.role || '').trim().toLowerCase();
  const isAdmin = typeof window.isAdminUser === 'function'
    ? window.isAdminUser(userObj)
    : (normRole === 'owner' || normRole === 'admin');

  const statusLeft = document.getElementById('status-left');
  if (statusLeft) {
    if (normRole === 'public') {
      statusLeft.textContent = '[GUEST] 공용 단말기 접속 중 — 광장 게시판 및 공용 자료 열람 활성화';
    } else if (isAdmin) {
      statusLeft.textContent = `[SYSOP] 관리자(${userObj.username}) 접속 완료 — 개인 보관함 및 광장 게시판 전체 관리 권한`;
    } else {
      statusLeft.textContent = `[LOGIN] ${userObj.username}님 환영합니다 — 개인 감상 보관함 및 광장 게시판 준비 완료`;
    }
  }

  if (typeof window.playWin95StartupSound === 'function') {
    window.playWin95StartupSound(true, bootState);
  }

  if (typeof window.refreshAllViews === 'function') {
    window.refreshAllViews();
  }

  const overlay = document.getElementById('os-boot-overlay');
  if (overlay) {
    overlay.style.pointerEvents = 'none';
    overlay.classList.add('boot-fade-out');
    setTimeout(() => {
      if (bootState.stage !== 'done') return;
      overlay.style.display = 'none';
      document.body.classList.remove('boot-locked', 'pre-login-lock');
    }, 380);
  } else {
    document.body.classList.remove('boot-locked', 'pre-login-lock');
  }
}

async function submitUserLogin() {
  if (bootState.isSubmitting) return;

  const selVal = document.getElementById('login-account-select')?.value;
  if (selVal === '__NO_MATCH__') {
    showLoginError('선택된 계정이 없습니다. 검색어를 초기화하거나 하단의 [공용 단말기 접속]을 누르십시오.');
    return;
  }

  const rawName = (!selVal || selVal === '__CUSTOM__')
    ? (document.getElementById('login-username')?.value || '').trim()
    : selVal.trim();
  const pin = (document.getElementById('login-password')?.value || '').trim();

  if (!rawName) {
    showLoginError('이용자 이름을 선택하거나 직접 입력해 주십시오.');
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

  const apiUrl = getGasApiUrl();
  if (!apiUrl || !/^https:\/\/script\.google\.com\//i.test(apiUrl)) {
    if (rawName === '문태양' && pin === '1234') {
      finishDesktopLogin(DEFAULT_FALLBACK_USERS[1]);
    } else {
      showLoginError('js/config.js에 Google Apps Script 배포 URL(GAS_WEB_APP_URL)이 설정되지 않았습니다.');
    }
    return;
  }

  const btn = document.getElementById('btn-win95-login');
  const prevBtnText = btn ? btn.textContent : '확인 (접속)';
  bootState.isSubmitting = true;
  if (btn) { btn.disabled = true; btn.textContent = '인증 확인 중...'; }

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'login_user', username: rawName, pin })
    });
    const rawText = await res.text();
    if (rawText.trim().startsWith('<')) {
      throw new Error("Apps Script 웹 앱 권한을 '모든 사용자(Anyone)'로 배포했는지 확인해 주십시오.");
    }
    const json = JSON.parse(rawText);
    if (json.status === 'success' && json.user) {
      finishDesktopLogin(json.user);
    } else {
      showLoginError(json.message || '로그인 인증에 실패했습니다.');
    }
  } catch (err) {
    if (rawName === '문태양' && pin === '1234') {
      finishDesktopLogin(DEFAULT_FALLBACK_USERS[1]);
    } else {
      showLoginError(err?.message || '중앙 서버 회선 연결에 실패했습니다. 통신 상태를 확인하십시오.');
    }
  } finally {
    bootState.isSubmitting = false;
    if (btn) { btn.disabled = false; btn.textContent = prevBtnText; }
  }
}

async function submitNewUserSignup() {
  if (bootState.isSubmitting) return;

  const username = (document.getElementById('signup-username')?.value || '').trim();
  const pin = (document.getElementById('signup-pin')?.value || '').trim();
  const pinConfirmEl = document.getElementById('signup-pin-confirm');
  const pinConfirm = pinConfirmEl ? String(pinConfirmEl.value || '').trim() : pin;
  const avatar = normalizePixelAvatarKey(document.getElementById('signup-avatar')?.value || 'frog');
  const rawBio = (document.getElementById('signup-bio')?.value || '').trim();
  const bio = formatRetroBio(rawBio, { username, role: 'member' });

  if (username.length < 2 || username.length > 15) {
    showLoginError('사용자 이름은 2~15자로 입력해 주십시오.');
    document.getElementById('signup-username')?.focus();
    return;
  }
  if (username === '공용' || username.toUpperCase() === 'PUBLIC' || username.toUpperCase() === 'GUEST') {
    showLoginError('예약된 시스템 이름은 사용할 수 없습니다.');
    document.getElementById('signup-username')?.focus();
    return;
  }
  if (!/^\d{4}$/.test(pin)) {
    showLoginError('비밀번호는 반드시 숫자 4자리(예: 0000)로 입력해 주십시오.');
    document.getElementById('signup-pin')?.focus();
    return;
  }
  if (pinConfirmEl && pin !== pinConfirm) {
    showLoginError('4자리 비밀번호 확인이 일치하지 않습니다.');
    pinConfirmEl.focus();
    return;
  }

  const apiUrl = getGasApiUrl();
  if (!apiUrl || !/^https:\/\/script\.google\.com\//i.test(apiUrl)) {
    showLoginError('js/config.js에 Google Apps Script 배포 URL(GAS_WEB_APP_URL)이 설정되지 않았습니다.');
    return;
  }

  const btn = document.getElementById('btn-win95-signup-submit');
  const prevBtnText = btn ? btn.textContent : '계정 생성 및 즉시 로그인';
  bootState.isSubmitting = true;
  if (btn) { btn.disabled = true; btn.textContent = '계정 생성 중...'; }

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'register_user', username, pin, avatar, bio })
    });

    const rawText = await res.text();
    if (rawText.trim().startsWith('<')) {
      throw new Error("Apps Script 웹 앱 권한을 '모든 사용자(Anyone)'로 배포했는지 확인해 주십시오.");
    }
    const json = JSON.parse(rawText);

    if (json && json.status === 'success' && json.user) {
      window.registeredOsUsers = [...(window.registeredOsUsers || []), json.user];
      loginSafeSaveCache(USERS_CACHE_KEY, window.registeredOsUsers);
      finishDesktopLogin(json.user);
    } else {
      showLoginError((json && json.message) || '계정 생성에 실패했습니다.');
    }
  } catch (err) {
    showLoginError(err?.message || '중앙 서버 통신 중 회선 오류가 발생했습니다. 잠시 후 다시 시도하십시오.');
  } finally {
    bootState.isSubmitting = false;
    if (btn) { btn.disabled = false; btn.textContent = prevBtnText; }
  }
}

// ============================================================
// 이벤트 바인딩 & 시작점
// ============================================================
function bindBootScreenEvents() {
  document.getElementById('boot-stage-bios')?.addEventListener('click', () => {
    window.playBiosPostBeep?.(760, 0.08);
    bootState.bootSeqId += 1;
    setBootStage('login');
  });

  document.getElementById('boot-stage-splash')?.addEventListener('click', () => {
    loginSafeTone('click');
    bootState.bootSeqId += 1;
    setBootStage('login');
  });

  document.addEventListener('keydown', e => {
    if (document.getElementById('bios-text-setup-overlay')) return;
    if (bootState.stage === 'bios') {
      if (e.key === 'Delete') {
        e.preventDefault();
        window.playBiosPostBeep?.(1046, 0.1);
        const cmos = document.getElementById('bios-cmos-easter');
        if (cmos) cmos.style.display = cmos.style.display === 'none' ? 'block' : 'none';
      } else if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        window.playBiosPostBeep?.(760, 0.08);
        bootState.bootSeqId += 1;
        setBootStage('login');
      }
    } else if (bootState.stage === 'splash' && (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape')) {
      e.preventDefault();
      loginSafeTone('click');
      bootState.bootSeqId += 1;
      setBootStage('login');
    }
  });

  const loginStageEl = document.getElementById('boot-stage-login');
  loginStageEl?.addEventListener('click', e => {
    const tabBtn = e.target.closest('#tab-win95-signin, #tab-win95-signup, [data-login-tab]');
    if (!tabBtn) return;
    e.preventDefault();
    loginSafeTone('click');
    const isSignup = tabBtn.id === 'tab-win95-signup' || tabBtn.dataset.loginTab === 'signup';
    switchLoginTab(isSignup ? 'signup' : 'signin');
    if (isSignup) {
      document.getElementById('signup-username')?.focus();
    }
  });

  document.getElementById('login-account-select')?.addEventListener('change', handleLoginAccountSelectChange);

  ['login-password', 'signup-pin', 'signup-pin-confirm'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', e => {
      e.target.value = String(e.target.value || '').replace(/\D/g, '').slice(0, 4);
    });
  });

  document.getElementById('btn-toggle-user-search')?.addEventListener('click', () => {
    loginSafeTone('click');
    bootState.userSearchOpen = !bootState.userSearchOpen;
    const searchRow = document.getElementById('login-user-search-row');
    const searchBtn = document.getElementById('btn-toggle-user-search');
    const searchInput = document.getElementById('login-user-search-input');

    if (searchRow) searchRow.style.display = bootState.userSearchOpen ? 'flex' : 'none';
    if (searchBtn) searchBtn.classList.toggle('active', bootState.userSearchOpen);

    if (bootState.userSearchOpen) {
      searchInput?.focus();
    } else {
      bootState.userSearchQuery = '';
      if (searchInput) searchInput.value = '';
      populateLoginAccountSelect();
    }
  });

  document.getElementById('login-user-search-input')?.addEventListener('input', e => {
    bootState.userSearchQuery = e.target.value;
    const clearBtn = document.getElementById('btn-clear-user-search');
    if (clearBtn) clearBtn.style.display = bootState.userSearchQuery ? 'inline-flex' : 'none';
    populateLoginAccountSelect();
  });

  document.getElementById('login-user-search-input')?.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      e.preventDefault();
      document.getElementById('btn-toggle-user-search')?.click();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('login-password')?.focus();
    }
  });

  document.getElementById('btn-clear-user-search')?.addEventListener('click', () => {
    loginSafeTone('click');
    bootState.userSearchQuery = '';
    const searchInput = document.getElementById('login-user-search-input');
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
    const clearBtn = document.getElementById('btn-clear-user-search');
    if (clearBtn) clearBtn.style.display = 'none';
    populateLoginAccountSelect();
  });

  document.getElementById('win95-login-form')?.addEventListener('submit', e => {
    e.preventDefault();
    submitUserLogin();
  });
  document.getElementById('btn-win95-login')?.addEventListener('click', e => {
    if (e.currentTarget.type !== 'submit') {
      e.preventDefault();
      submitUserLogin();
    }
  });

  document.getElementById('btn-win95-public-enter')?.addEventListener('click', () => {
    const pubUser = (window.registeredOsUsers || []).find(u => u.username === '공용') || DEFAULT_FALLBACK_USERS[0];
    finishDesktopLogin(pubUser);
  });

  document.getElementById('win95-signup-form')?.addEventListener('submit', e => {
    e.preventDefault();
    submitNewUserSignup();
  });
  document.getElementById('btn-win95-signup-submit')?.addEventListener('click', e => {
    if (e.currentTarget.type !== 'submit') {
      e.preventDefault();
      submitNewUserSignup();
    }
  });

  document.getElementById('btn-reboot-bios')?.addEventListener('click', () => {
    window.playBiosPostBeep?.(880, 0.12);
    startBiosBootSequence({ skip3d: true });
  });

  document.getElementById('sm-logoff')?.addEventListener('click', () => {
    const sm = document.getElementById('start-menu');
    if (sm) sm.classList.remove('open');
    document.getElementById('btn-start')?.classList.remove('pressed');
    startBiosBootSequence({ skip3d: true });
  });
}

window.startBiosBootSequence = startBiosBootSequence;
window.getCurrentUser = getCurrentUser;
window.switchLoginTab = switchLoginTab;

window.addEventListener('resize', syncLoginViewportHeight, { passive: true });
window.addEventListener('orientationchange', syncLoginViewportHeight, { passive: true });
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', syncLoginViewportHeight, { passive: true });
}

document.addEventListener('DOMContentLoaded', () => {
  syncLoginViewportHeight();
  document.body.classList.add('boot-locked', 'pre-login-lock');
  renderSignupAvatarPicker();
  bindBootScreenEvents();
  hookArchiveSyncLifecycle();

  const startAfterGate = () => {
    window.__ARCHIVE_GATE_DISMISSED = true;
    startBiosBootSequence({ alreadyClicked: true });
  };

  if (typeof window.mountPreClickStartScreen === 'function') {
    window.mountPreClickStartScreen(startAfterGate);
  } else {
    startAfterGate();
  }
});

window.runBootAnimation = window.runBootAnimation || function () {};

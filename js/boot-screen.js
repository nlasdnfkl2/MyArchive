// ============================================================
// MY-ARCHIVE 95 OS — Context-Aware BIOS POST, Setup & Logon
// ============================================================

window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
window.__MOD_VERSIONS.bootScreen = 'v2026.11.25-07';

const SESSION_USER_KEY = 'myarchive95_current_user_v2';
const USERS_CACHE_KEY = 'myarchive95_users_cache_v2';
const BIOS_CONFIG_KEY = 'MYARCHIVE95_BIOS_CONFIG_V1';

const BIOS_RESOLUTION_OPTIONS = [
  { value: '640x480', label: '640x480 (VGA 4:3 — 가로 640 레트로 표준)' },
  { value: '800x600', label: '800x600 (SVGA 4:3 — 가로 800 클래식)' },
  { value: '1024x768', label: '1024x768 (XGA 4:3 — 가로 1024 표준)' },
  { value: '1280x800', label: '1280x800 (WXGA 16:10 — 가로 1280 와이드)' },
  { value: '1440x900', label: '1440x900 (WXGA+ 16:10 — 가로 1440 데스크톱)' },
  { value: '1920x1080', label: '1920x1080 (FHD 16:9 — 가로 1920 고해상도)' }
];

function safeEsc(str) {
  if (typeof window.esc === 'function') return window.esc(str);
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeLoadCache(key, fallback) {
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

function safeSaveCache(key, value) {
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

function safeBootTone(type) {
  const saved = getSavedBiosConfig();
  if (saved && saved.sound === false) return;
  if (typeof window.playRetroTone === 'function') {
    try { window.playRetroTone(type); } catch {}
  }
}

// ============================================================
// 로그온 화면 & 다중 해상도 (640px ~ 1920px+) 스타일 주입
// ============================================================
function injectLogonAndResponsiveStyles() {
  if (document.getElementById('boot-logon-responsive-styles')) return;
  const style = document.createElement('style');
  style.id = 'boot-logon-responsive-styles';
  style.textContent = `
    #os-boot-overlay {
      position: fixed;
      inset: 0;
      z-index: 99990;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: auto;
      font-family: 'Galmuri11', 'DungGeunMo', monospace;
      box-sizing: border-box;
    }
    #boot-stage-bios {
      width: 100%;
      min-height: 100vh;
      padding: clamp(14px, 3vw, 32px);
      background: #000000;
      color: #d8dee9;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
    }
    #boot-stage-login {
      width: 100%;
      min-height: 100vh;
      padding: clamp(10px, 2.5vw, 28px);
      background: #008080;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
    }
    .win95-logon-window {
      width: 100%;
      max-width: 520px;
      background: #c0c0c0;
      color: #000000;
      border-top: 2px solid #ffffff;
      border-left: 2px solid #ffffff;
      border-right: 2px solid #404040;
      border-bottom: 2px solid #404040;
      box-shadow: inset 1px 1px 0 #dfdfdf, inset -1px -1px 0 #808080, 4px 4px 0 rgba(0, 0, 0, 0.35);
      padding: 3px;
      box-sizing: border-box;
    }
    .win95-logon-titlebar {
      background: linear-gradient(90deg, #000080, #1084d0);
      color: #ffffff;
      padding: 4px 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: clamp(0.74rem, 1.4vw, 0.84rem);
      font-weight: 700;
    }
    .win95-logon-tabs {
      display: flex;
      gap: 2px;
      padding: 6px 6px 0 6px;
      flex-wrap: wrap;
    }
    .win95-logon-tab {
      background: #c0c0c0;
      color: #000000;
      border-top: 2px solid #ffffff;
      border-left: 2px solid #ffffff;
      border-right: 2px solid #404040;
      border-bottom: none;
      padding: 5px 10px;
      font-family: inherit;
      font-size: clamp(0.72rem, 1.3vw, 0.78rem);
      font-weight: 700;
      cursor: pointer;
      position: relative;
      top: 2px;
    }
    .win95-logon-tab.active {
      background: #c0c0c0;
      padding-bottom: 7px;
      top: 0;
      z-index: 2;
    }
    .win95-logon-sheet {
      margin: 0 6px 6px 6px;
      padding: clamp(10px, 2vw, 14px);
      background: #c0c0c0;
      border-top: 2px solid #ffffff;
      border-left: 2px solid #ffffff;
      border-right: 2px solid #404040;
      border-bottom: 2px solid #404040;
      box-shadow: inset 1px 1px 0 #dfdfdf, inset -1px -1px 0 #808080;
    }
    .win95-logon-intro {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 12px;
      font-size: clamp(0.74rem, 1.3vw, 0.8rem);
      line-height: 1.45;
      font-weight: 700;
    }
    .win95-logon-row {
      display: grid;
      grid-template-columns: 104px minmax(0, 1fr);
      align-items: center;
      gap: 8px;
      margin-bottom: 9px;
      font-size: clamp(0.74rem, 1.3vw, 0.8rem);
      font-weight: 700;
    }
    .win95-logon-field-wrap {
      display: flex;
      align-items: center;
      gap: 4px;
      min-width: 0;
      width: 100%;
    }
    .win95-logon-sheet input[type="text"],
    .win95-logon-sheet input[type="password"] {
      width: 100%;
      min-width: 0;
      padding: 4px 6px;
      background: #ffffff;
      color: #000000;
      border-top: 2px solid #808080;
      border-left: 2px solid #808080;
      border-right: 2px solid #ffffff;
      border-bottom: 2px solid #ffffff;
      box-shadow: inset 1px 1px 0 #000000;
      font-family: inherit;
      font-size: 0.78rem;
      font-weight: 700;
      box-sizing: border-box;
    }
    .win95-logon-icon-btn {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #c0c0c0;
      color: #000000;
      border-top: 2px solid #ffffff;
      border-left: 2px solid #ffffff;
      border-right: 2px solid #404040;
      border-bottom: 2px solid #404040;
      cursor: pointer;
      padding: 0;
    }
    .win95-logon-icon-btn.active {
      border-top: 2px solid #404040;
      border-left: 2px solid #404040;
      border-right: 2px solid #ffffff;
      border-bottom: 2px solid #ffffff;
      background: #b0b0b0;
    }
    .win95-profile-fieldset {
      margin: 10px 0 8px 0;
      padding: 8px 10px;
      border-top: 2px solid #808080;
      border-left: 2px solid #808080;
      border-right: 2px solid #ffffff;
      border-bottom: 2px solid #ffffff;
      box-shadow: inset 1px 1px 0 #dfdfdf;
      font-size: 0.75rem;
    }
    .win95-profile-fieldset legend {
      padding: 0 4px;
      font-weight: 700;
      font-size: 0.74rem;
    }
    .win95-avatar-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 5px;
      width: 100%;
    }
    .win95-avatar-choice {
      display: inline-flex;
      align-items: center;
      justify-content: flex-start;
      gap: 6px;
      padding: 4px 7px;
      background: #c0c0c0;
      color: #000000;
      border-top: 2px solid #ffffff;
      border-left: 2px solid #ffffff;
      border-right: 2px solid #404040;
      border-bottom: 2px solid #404040;
      font-family: inherit;
      font-size: 0.74rem;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
    }
    .win95-avatar-choice.selected {
      background: #000080;
      color: #ffffff;
      border-top: 2px solid #404040;
      border-left: 2px solid #404040;
      border-right: 2px solid #ffffff;
      border-bottom: 2px solid #ffffff;
    }
    .win95-logon-actions {
      display: flex;
      justify-content: flex-end;
      gap: 6px;
      flex-wrap: wrap;
      margin-top: 12px;
    }
    .win95-logon-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 12px;
      background: #c0c0c0;
      color: #000000;
      border-top: 2px solid #ffffff;
      border-left: 2px solid #ffffff;
      border-right: 2px solid #404040;
      border-bottom: 2px solid #404040;
      box-shadow: inset -1px -1px 0 #808080;
      font-family: inherit;
      font-size: 0.76rem;
      font-weight: 700;
      cursor: pointer;
    }
    .win95-logon-btn:active {
      border-top: 2px solid #404040;
      border-left: 2px solid #404040;
      border-right: 2px solid #ffffff;
      border-bottom: 2px solid #ffffff;
    }
    @media (max-width: 680px) {
      .win95-logon-row {
        grid-template-columns: 1fr;
        gap: 4px;
      }
      .win95-avatar-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .win95-logon-actions {
        justify-content: stretch;
      }
      .win95-logon-btn {
        flex: 1 1 auto;
        justify-content: center;
      }
    }
    @media (min-width: 1600px) {
      .win95-logon-window {
        max-width: 560px;
      }
    }
  `;
  document.head.appendChild(style);
}

// ============================================================
// BIOS 환경 설정 저장·적용 & 첫 진입 텍스트 Setup 화면
// ============================================================
function getSavedBiosConfig() {
  return safeLoadCache(BIOS_CONFIG_KEY, null);
}

function saveBiosConfig(cfg) {
  safeSaveCache(BIOS_CONFIG_KEY, cfg);
}

function applyBiosResolutionProfile(resolutionValue) {
  const res = String(resolutionValue || '1024x768');
  const widthNum = Number(res.split('x')[0]) || 1024;
  document.documentElement.dataset.biosResolution = res;

  const desktopEl = document.getElementById('desktop') || document.querySelector('.desktop-area') || document.body;
  if (widthNum <= 640) {
    desktopEl.style.maxWidth = '640px';
    desktopEl.style.margin = '0 auto';
  } else if (widthNum <= 800) {
    desktopEl.style.maxWidth = '800px';
    desktopEl.style.margin = '0 auto';
  } else if (widthNum <= 1024) {
    desktopEl.style.maxWidth = '1024px';
    desktopEl.style.margin = '0 auto';
  } else if (widthNum <= 1280) {
    desktopEl.style.maxWidth = '1280px';
    desktopEl.style.margin = '0 auto';
  } else if (widthNum <= 1440) {
    desktopEl.style.maxWidth = '1440px';
    desktopEl.style.margin = '0 auto';
  } else {
    desktopEl.style.maxWidth = '1920px';
    desktopEl.style.margin = '0 auto';
  }
}

function applyBiosSettingsToSystem(cfg) {
  if (!cfg || typeof cfg !== 'object') return;
  if (cfg.resolution) applyBiosResolutionProfile(cfg.resolution);
  if (cfg.theme && typeof window.applyWallpaperTheme === 'function') {
    try { window.applyWallpaperTheme(cfg.theme); } catch {}
  }
  if (cfg.crt !== undefined && typeof window.setCrtScanlinesEnabled === 'function') {
    try { window.setCrtScanlinesEnabled(Boolean(cfg.crt)); } catch {}
  }
  if (cfg.sound !== undefined && typeof window.setRetroSoundEnabled === 'function') {
    try { window.setRetroSoundEnabled(Boolean(cfg.sound)); } catch {}
  }
}

function openBiosTextSetup(onComplete) {
  injectLogonAndResponsiveStyles();
  const existing = document.getElementById('bios-text-setup-overlay');
  if (existing) existing.remove();

  const saved = getSavedBiosConfig() || {};
  const currentRes = saved.resolution || '1024x768';
  const currentTheme = saved.theme || 'teal';
  const currentCrt = saved.crt !== undefined ? String(Boolean(saved.crt)) : 'true';
  const currentSound = saved.sound !== undefined ? String(Boolean(saved.sound)) : 'true';

  const overlay = document.createElement('div');
  overlay.id = 'bios-text-setup-overlay';
  overlay.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:999999',
    'background:#030724',
    'color:#e6f0ff',
    'font-family:"Galmuri11","DungGeunMo",monospace',
    'padding:clamp(14px, 3vw, 28px)',
    'overflow:auto',
    'display:flex',
    'justify-content:center',
    'align-items:flex-start',
    'box-sizing:border-box'
  ].join(';');

  const biosSelectStyle =
    'background:#040826;color:#00ff88;border:1px solid #55aaff;padding:4px 8px;font-family:inherit;font-size:0.82rem;font-weight:700;cursor:pointer;width:100%;max-width:340px;box-sizing:border-box;';

  overlay.innerHTML = `
    <div style="width:100%;max-width:780px;border:2px solid #7ab8ff;padding:clamp(12px, 2.5vw, 20px);background:#050b33;box-shadow:0 0 0 2px #030724,0 0 0 4px #3b6fd8;box-sizing:border-box;">
      <div style="background:#b8bec8;color:#050b33;padding:5px 10px;font-weight:900;font-size:clamp(0.76rem, 1.5vw, 0.86rem);display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
        <span>AWARD / ARCHIVE95 BIOS SETUP UTILITY — 초기 환경 설정</span>
        <span>CMOS v1.95</span>
      </div>

      <div style="color:#ffd83b;font-size:0.8rem;line-height:1.6;margin-bottom:14px;border-bottom:1px dashed #4a6fb8;padding-bottom:10px;">
        <div>* 브라우저 저장소에 초기 환경 설정이 감지되지 않았습니다.</div>
        <div>* 해상도 및 디스플레이 옵션을 선택한 뒤 [설정 저장 후 접속]을 눌러 진행하십시오.</div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(170px, 1fr));row-gap:12px;column-gap:12px;align-items:center;font-size:0.82rem;margin-bottom:18px;">
        <label for="bios-inp-resolution" style="font-weight:900;color:#7fd8ff;">[01] 해상도</label>
        <div>
          <select id="bios-inp-resolution" style="${biosSelectStyle}">
            ${BIOS_RESOLUTION_OPTIONS.map(opt =>
              `<option value="${opt.value}" ${currentRes === opt.value ? 'selected' : ''}>${opt.label}</option>`
            ).join('')}
          </select>
        </div>

        <label for="bios-inp-theme" style="font-weight:900;color:#7fd8ff;">[02] 바탕화면 테마</label>
        <div>
          <select id="bios-inp-theme" style="${biosSelectStyle}">
            <option value="teal" ${currentTheme === 'teal' ? 'selected' : ''}>TEAL (클래식 청록)</option>
            <option value="navy" ${currentTheme === 'navy' ? 'selected' : ''}>NAVY (딥 네이비)</option>
            <option value="olive" ${currentTheme === 'olive' ? 'selected' : ''}>OLIVE (올리브 그린)</option>
            <option value="plum" ${currentTheme === 'plum' ? 'selected' : ''}>PLUM (레트로 플럼)</option>
            <option value="brick" ${currentTheme === 'brick' ? 'selected' : ''}>BRICK (테라코타 브릭)</option>
            <option value="matrix" ${currentTheme === 'matrix' ? 'selected' : ''}>MATRIX (터미널 그린)</option>
            <option value="grid" ${currentTheme === 'grid' ? 'selected' : ''}>GRID (도트 그리드)</option>
          </select>
        </div>

        <label for="bios-inp-crt" style="font-weight:900;color:#7fd8ff;">[03] CRT 스캔라인</label>
        <div>
          <select id="bios-inp-crt" style="${biosSelectStyle}">
            <option value="true" ${currentCrt === 'true' ? 'selected' : ''}>ENABLED (스캔라인 활성)</option>
            <option value="false" ${currentCrt === 'false' ? 'selected' : ''}>DISABLED (스캔라인 끔)</option>
          </select>
        </div>

        <label for="bios-inp-sound" style="font-weight:900;color:#7fd8ff;">[04] 8비트 사운드</label>
        <div>
          <select id="bios-inp-sound" style="${biosSelectStyle}">
            <option value="true" ${currentSound === 'true' ? 'selected' : ''}>ENABLED (효과음 켜기)</option>
            <option value="false" ${currentSound === 'false' ? 'selected' : ''}>DISABLED (효과음 끄기)</option>
          </select>
        </div>
      </div>

      <div style="background:#03061c;border:1px solid #3c5ea6;padding:8px 10px;font-size:0.74rem;color:#7cf29c;line-height:1.5;margin-bottom:16px;">
        <div>STORAGE TARGET : BROWSER LOCALSTORAGE (MYARCHIVE95_BIOS_CONFIG_V1)</div>
        <div>USER SESSION   : HANDLED BY LOGON SCREEN</div>
      </div>

      <div style="display:flex;justify-content:flex-end;">
        <button type="button" id="btn-bios-save-enter" style="background:#c0c7d0;color:#000;border-top:2px solid #fff;border-left:2px solid #fff;border-right:2px solid #333;border-bottom:2px solid #333;padding:6px 14px;font-family:inherit;font-size:0.82rem;font-weight:900;cursor:pointer;">
          [ 설정 저장 후 접속 ]
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const commitAndProceed = () => {
    const selectedRes = document.getElementById('bios-inp-resolution')?.value || '1024x768';
    const selectedTheme = document.getElementById('bios-inp-theme')?.value || 'teal';
    const selectedCrt = document.getElementById('bios-inp-crt')?.value === 'true';
    const selectedSound = document.getElementById('bios-inp-sound')?.value === 'true';

    const nextCfg = {
      resolution: selectedRes,
      theme: selectedTheme,
      crt: selectedCrt,
      sound: selectedSound
    };
    saveBiosConfig(nextCfg);
    applyBiosSettingsToSystem(nextCfg);

    overlay.remove();
    if (typeof onComplete === 'function') onComplete(nextCfg);
  };

  document.getElementById('btn-bios-save-enter')?.addEventListener('click', commitAndProceed);
  overlay.addEventListener('keydown', e => {
    if (e.key === 'F10' || (e.key === 'Enter' && e.target.tagName !== 'SELECT')) {
      e.preventDefault();
      commitAndProceed();
    }
  });
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
  return `<span class="pixel-avatar-wrap" style="width:${sizePx}px;height:${sizePx}px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">${svg}</span>`;
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
  stage: 'bios',
  loginTab: 'signin',
  userSearchOpen: false,
  userSearchQuery: '',
  isSubmitting: false,
  timers: [],
  ramInterval: null,
  biosBeepPlayed: false
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
  const saved = safeLoadCache(SESSION_USER_KEY, null);
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
  safeSaveCache(SESSION_USER_KEY, normalized);
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
    badge.innerHTML = `${renderPixelAvatarHtml(user.avatar, 14, normRole)}<span>${safeEsc(user.username)} (${roleLabel})</span>`;
  }
  const winMainTitle = document.getElementById('win-main-title-text');
  if (winMainTitle && user) {
    winMainTitle.textContent = normRole === 'public'
      ? 'C:\\MY-ARCHIVE\\PUBLIC.EXE — 공용 단말기 아카이브'
      : `C:\\MY-ARCHIVE\\${user.username.toUpperCase()}.EXE — ${user.username}의 개인 아카이브`;
  }
}

// ============================================================
// Web Audio API: BIOS 비프음 & Windows 95 시작 화음
// ============================================================
function playBiosPostBeep() {
  const saved = getSavedBiosConfig();
  if (saved && saved.sound === false) return;
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
  const saved = getSavedBiosConfig();
  if (saved && saved.sound === false) return;
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

  grid.classList.add('win95-avatar-grid');
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
        ${renderPixelAvatarHtml(opt.key, 18)}
        <span>${opt.label}</span>
      </button>
    `;
  }).join('');

  grid.querySelectorAll('.win95-avatar-choice').forEach(btn => {
    btn.addEventListener('click', () => {
      safeBootTone('click');
      hiddenInput.value = btn.dataset.avatarKey || 'frog';
      renderSignupAvatarPicker();
    });
  });
}

// ============================================================
// 등록 사용자 목록 동기화 & 유저 검색 필터링
// ============================================================
async function syncRegisteredUsersList() {
  const cached = safeLoadCache(USERS_CACHE_KEY, null);
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
      safeSaveCache(USERS_CACHE_KEY, json.users);

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
  const ledEl = document.getElementById('login-cloud-led');
  if (!statusEl) return;

  const personalCount = getPersonalUsersList().length;
  const archiveCount = Array.isArray(window.archiveItems) ? window.archiveItems.length : 0;
  statusEl.textContent = archiveCount > 0
    ? `중앙 아카이브 서버 접속 완료 (등록 이용자 ${personalCount}명 · 전체 자료 ${archiveCount}건)`
    : `사용자 인증 및 아카이브 단말기 준비 완료 (등록 이용자 ${personalCount}명)`;
  if (ledEl) ledEl.style.background = '#008000';
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
      return `<option value="${safeEsc(u.username)}">${prefix} ${safeEsc(u.username)} (${roleDesc})</option>`;
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
// 컨텍스트 기반 스마트 부팅 로그 생성기 & BIOS 출력 보장
// ============================================================
function buildSmartBiosPostSteps() {
  const hour = new Date().getHours();
  const timeBanner = hour < 6
    ? 'LATE-NIGHT DEEP ARCHIVE MODE'
    : hour < 12
      ? 'MORNING CATALOGING SESSION'
      : hour < 19
        ? 'DAYTIME WORKSTATION SESSION'
        : 'EVENING LOUNGE & JUKEBOX MODE';

  const cachedArchive = safeLoadCache(
    typeof STORAGE_KEYS !== 'undefined' ? STORAGE_KEYS.ARCHIVE : 'my_archive_95_items_cache_v1',
    []
  );
  const itemCount = Array.isArray(cachedArchive) ? cachedArchive.length : 0;
  const lastUser = safeLoadCache(SESSION_USER_KEY, null);
  const unlocks = typeof window.getOsUnlocks === 'function' ? window.getOsUnlocks() : { themes: [], tracks: [] };
  const unlockCount = (unlocks.themes?.length || 0) + (unlocks.tracks?.length || 0);

  return [
    { delay: 120, text: `System Clock & Profile  ... ${timeBanner} [OK]` },
    { delay: 320, text: `IDE Primary Master      ... MY-ARCHIVE-HDD (${itemCount} RECORDS CACHED) [OK]` },
    { delay: 540, text: `IDE Primary Slave       ... JUKEBOX-CDROM 4X + AMBIENT DSP [OK]` },
    { delay: 780, text: lastUser ? `Session Telemetry       ... Returning User (@${lastUser.username}) Detected [OK]` : 'Initializing User Registry ... Local & Network Accounts [OK]' },
    { delay: 1020, text: `Verifying DMI & Unlocks ... ${unlockCount} Hidden Extensions Active [OK]` },
    { delay: 1280, text: 'Starting MY-ARCHIVE 95...' }
  ];
}

function ensureBiosLogContainer(biosEl) {
  if (!biosEl) return null;
  let logEl = document.getElementById('bios-log-lines') || biosEl.querySelector('.bios-log, #bios-post-log, pre');
  if (!logEl) {
    logEl = document.createElement('div');
    logEl.id = 'bios-log-lines';
    logEl.style.cssText = 'margin:12px 0;font-size:0.84rem;line-height:1.55;color:#7cf29c;white-space:pre-wrap;word-break:break-word;';
    biosEl.appendChild(logEl);
  }
  logEl.style.display = 'block';
  logEl.style.visibility = 'visible';
  logEl.style.opacity = '1';
  logEl.style.color = '#7cf29c';
  return logEl;
}

// ============================================================
// 부팅 단계 제어 (BIOS -> SPLASH -> WIN95 LOGON -> DESKTOP)
// ============================================================
function setBootStage(stageName) {
  bootState.stage = stageName;
  const overlay = document.getElementById('os-boot-overlay');
  const biosEl = document.getElementById('boot-stage-bios');
  const splashEl = document.getElementById('boot-stage-splash');
  const loginEl = document.getElementById('boot-stage-login');

  if (overlay) {
    overlay.style.background = stageName === 'login' ? '#008080' : '#000000';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
  }

  if (biosEl) biosEl.style.display = stageName === 'bios' ? 'flex' : 'none';
  if (splashEl) splashEl.style.display = stageName === 'splash' ? 'flex' : 'none';
  if (loginEl) {
    loginEl.style.display = stageName === 'login' ? 'flex' : 'none';
    if (stageName === 'login') {
      loginEl.style.width = '100%';
      loginEl.style.height = '100%';
      loginEl.style.minHeight = '100vh';
      loginEl.style.background = '#008080';
      loginEl.style.alignItems = 'center';
      loginEl.style.justifyContent = 'center';
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
  safeBootTone('boom');
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
    <span style="color:#800000;font-weight:700;line-height:1.35;">[ERROR] ${safeEsc(msg)}</span>
  `;
  errBox.style.display = 'flex';
}

function runPostAndLogonFlow() {
  injectLogonAndResponsiveStyles();
  clearBootTimers();
  bootState.biosBeepPlayed = false;

  const savedCfg = getSavedBiosConfig();
  if (savedCfg) {
    applyBiosSettingsToSystem(savedCfg);
  }

  const overlay = document.getElementById('os-boot-overlay');
  if (!overlay) return;

  overlay.style.display = 'flex';
  overlay.style.opacity = '1';
  overlay.style.background = '#000000';
  overlay.classList.remove('boot-fade-out');
  document.body.classList.add('boot-locked');

  setBootStage('bios');

  const biosEl = document.getElementById('boot-stage-bios');
  const ramEl = document.getElementById('bios-ram-count') || biosEl?.querySelector('.bios-ram');
  const logEl = ensureBiosLogContainer(biosEl);
  const syncBadge = document.getElementById('bios-sync-badge');

  if (logEl) {
    logEl.innerHTML = '<div>AWARD MODULAR BIOS v4.51PG — MY-ARCHIVE 95 POST INITIALIZING...</div>';
  }
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
  }, 45);

  const postSteps = buildSmartBiosPostSteps();

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

      if (syncBadge && step.text.includes('MY-ARCHIVE-HDD')) {
        syncBadge.textContent = 'ARCHIVE HOST: READY';
        syncBadge.style.color = '#55ff55';
      }
    }, step.delay);
    bootState.timers.push(tid);
  });

  bootState.timers.push(setTimeout(() => {
    if (bootState.stage === 'bios') setBootStage('splash');
  }, 1750));

  bootState.timers.push(setTimeout(() => {
    if (bootState.stage === 'splash') setBootStage('login');
  }, 2750));
}

function startBiosBootSequence() {
  injectLogonAndResponsiveStyles();
  const savedCfg = getSavedBiosConfig();
  if (!savedCfg) {
    document.body.classList.add('boot-locked');
    const overlay = document.getElementById('os-boot-overlay');
    if (overlay) overlay.style.display = 'none';
    openBiosTextSetup(() => {
      runPostAndLogonFlow();
    });
    return;
  }
  runPostAndLogonFlow();
}

function finishDesktopLogin(userObj) {
  clearBootTimers();
  bootState.stage = 'done';
  setCurrentUser(userObj);

  const normRole = String(userObj.role || '').trim().toLowerCase();
  const isAdmin = typeof window.isAdminUser === 'function'
    ? window.isAdminUser(userObj)
    : (normRole === 'owner' || normRole === 'admin');

  const statusLeft = document.getElementById('status-left');
  if (statusLeft) {
    if (normRole === 'public') {
      statusLeft.textContent = '[GUEST] 공용 단말기 접속 중 — 광장 게시판 및 공용 자료 열람 활성화';
    } else if (isAdmin) {
      statusLeft.textContent = `[SYSOP] 관리자(${userObj.username}) 접속 완료 — [Ctrl+K] 통합 검색 지원`;
    } else {
      statusLeft.textContent = `[LOGIN] ${userObj.username}님 환영합니다 — [Ctrl+K] 통합 검색 지원`;
    }
  }

  playWin95StartupSound();

  if (typeof window.refreshAllViews === 'function') {
    window.refreshAllViews();
  }
  if (typeof window.positionInitialWindows === 'function') {
    window.positionInitialWindows();
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
// 로그인 & 신규 이용자 가입 실행기
// ============================================================
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
      safeSaveCache(USERS_CACHE_KEY, window.registeredOsUsers);
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
// 로그인 / 회원가입 / 유저 검색 이벤트 핸들러
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
    if (document.getElementById('bios-text-setup-overlay')) return;
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

  const loginStageEl = document.getElementById('boot-stage-login');
  loginStageEl?.addEventListener('click', e => {
    const tabBtn = e.target.closest('#tab-win95-signin, #tab-win95-signup, [data-login-tab]');
    if (!tabBtn) return;
    e.preventDefault();
    safeBootTone('click');
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
    safeBootTone('click');
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
    safeBootTone('click');
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
    playBiosPostBeep();
    startBiosBootSequence();
  });

  document.getElementById('sm-logoff')?.addEventListener('click', () => {
    const sm = document.getElementById('start-menu');
    if (sm) sm.classList.remove('open');
    document.getElementById('btn-start')?.classList.remove('pressed');
    startBiosBootSequence();
  });
}

window.startBiosBootSequence = startBiosBootSequence;
window.openBiosTextSetup = openBiosTextSetup;
window.getCurrentUser = getCurrentUser;
window.switchLoginTab = switchLoginTab;

document.addEventListener('DOMContentLoaded', () => {
  injectLogonAndResponsiveStyles();
  renderSignupAvatarPicker();
  bindBootScreenEvents();
  startBiosBootSequence();
});
window.runBootAnimation = window.runBootAnimation || function () {};

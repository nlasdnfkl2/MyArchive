// ============================================================
// 초기 실행 텍스트 기반 SETUP 화면 (저장된 설정 없을 때 1회 표시)
// ============================================================
const INITIAL_SETUP_KEY = 'myarchive95_setup_v1';

const DEFAULT_INITIAL_SETUP = {
  resolution: '100',     // '100' (표준 100%) | '90' (컴팩트 90%) | '110' (와이드 110%)
  theme: 'theme-teal',   // 'theme-teal' | 'theme-navy' | 'theme-olive' | 'theme-plum' | 'theme-brick' | 'theme-matrix' | 'theme-grid'
  crt: true,             // CRT 스캔라인 표시 여부
  sound: true            // 레트로 사운드 활성화 여부
};

function loadInitialSetup() {
  try {
    const raw = localStorage.getItem(INITIAL_SETUP_KEY);
    if (!raw) return null;
    return { ...DEFAULT_INITIAL_SETUP, ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

function applyInitialSetupToSystem(cfg) {
  const settings = { ...DEFAULT_INITIAL_SETUP, ...(cfg || {}) };

  // 1. 배경화면 테마 적용
  const themeClasses = [
    'theme-teal', 'theme-navy', 'theme-olive',
    'theme-plum', 'theme-brick', 'theme-matrix', 'theme-grid'
  ];
  document.body.classList.remove(...themeClasses);
  if (themeClasses.includes(settings.theme)) {
    document.body.classList.add(settings.theme);
  } else {
    document.body.classList.add('theme-teal');
  }

  // 2. 해상도(배율/여백) 적용
  if (settings.resolution === '90') {
    document.documentElement.style.fontSize = '13px';
  } else if (settings.resolution === '110') {
    document.documentElement.style.fontSize = '15px';
  } else {
    document.documentElement.style.fontSize = '14px';
  }

  // 3. CRT 스캔라인 적용
  let crtEl = document.querySelector('.crt-overlay');
  if (!crtEl && settings.crt) {
    crtEl = document.createElement('div');
    crtEl.className = 'crt-overlay';
    document.body.appendChild(crtEl);
  }
  if (crtEl) {
    crtEl.style.display = settings.crt ? 'block' : 'none';
  }

  // 4. 사운드 플래그 동기화
  window.__WIN95_SOUND_ENABLED = Boolean(settings.sound);
  if (!settings.sound) {
    window.playRetroTone = () => {};
  }

  try {
    localStorage.setItem(INITIAL_SETUP_KEY, JSON.stringify(settings));
  } catch {}
}

function openInitialSetupScreen(forceOpen = false) {
  const existingCfg = loadInitialSetup();
  if (existingCfg && !forceOpen) {
    applyInitialSetupToSystem(existingCfg);
    startBiosBootSequence();
    return;
  }

  document.body.classList.add('boot-locked');
  const current = existingCfg || { ...DEFAULT_INITIAL_SETUP };

  const prevOverlay = document.getElementById('bios-text-setup-overlay');
  if (prevOverlay) prevOverlay.remove();

  const overlay = document.createElement('div');
  overlay.id = 'bios-text-setup-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 999999;
    background: #000080;
    color: #ffffff;
    font-family: 'DungGeunMo', 'Galmuri11', 'Fixedsys', monospace;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    box-sizing: border-box;
    user-select: none;
  `;

  overlay.innerHTML = `
    <div style="
      width: 100%;
      max-width: 680px;
      border: 2px solid #ffffff;
      outline: 2px solid #000080;
      background: #000080;
      box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.55);
      display: flex;
      flex-direction: column;
    ">
      <div style="
        background: #c0c0c0;
        color: #000080;
        padding: 4px 10px;
        font-weight: 700;
        font-size: 0.9rem;
        display: flex;
        justify-content: space-between;
      ">
        <span>MY-ARCHIVE 95 SYSTEM SETUP UTILITY v1.0</span>
        <span>[TEXT MODE]</span>
      </div>

      <div style="padding: 14px 16px; display: flex; flex-direction: column; gap: 12px; font-size: 0.86rem;">
        <div style="color: #ffff55; line-height: 1.45;">
          최초 실행 환경설정입니다. 원하는 표시 및 사운드 옵션을 선택한 뒤<br>
          [저장 및 부팅]을 누르십시오. (설정은 브라우저에 저장됩니다)
        </div>

        <div style="border: 1px solid #80bfff; padding: 12px; display: grid; gap: 10px;">
          <div style="display: grid; grid-template-columns: 150px 1fr; align-items: center; gap: 8px;">
            <label for="setup-res-select" style="color: #00ffff; font-weight: 700;">1. 화면 해상도</label>
            <select id="setup-res-select">
              <option value="90" ${current.resolution === '90' ? 'selected' : ''}>COMPACT (90% / 13px)</option>
              <option value="100" ${current.resolution === '100' ? 'selected' : ''}>STANDARD (100% / 14px - 기본)</option>
              <option value="110" ${current.resolution === '110' ? 'selected' : ''}>LARGE (110% / 15px)</option>
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 150px 1fr; align-items: center; gap: 8px;">
            <label for="setup-theme-select" style="color: #00ffff; font-weight: 700;">2. 바탕화면 테마</label>
            <select id="setup-theme-select">
              <option value="theme-teal" ${current.theme === 'theme-teal' ? 'selected' : ''}>WIN95 TEAL (#008080 - 기본)</option>
              <option value="theme-navy" ${current.theme === 'theme-navy' ? 'selected' : ''}>DEEP NAVY (#102542)</option>
              <option value="theme-olive" ${current.theme === 'theme-olive' ? 'selected' : ''}>MILITARY OLIVE (#3B5323)</option>
              <option value="theme-plum" ${current.theme === 'theme-plum' ? 'selected' : ''}>RETRO PLUM (#4A2545)</option>
              <option value="theme-brick" ${current.theme === 'theme-brick' ? 'selected' : ''}>BRICK WALL PATTERN</option>
              <option value="theme-matrix" ${current.theme === 'theme-matrix' ? 'selected' : ''}>MATRIX TERMINAL GRID</option>
              <option value="theme-grid" ${current.theme === 'theme-grid' ? 'selected' : ''}>DRAFTING PAPER GRID</option>
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 150px 1fr; align-items: center; gap: 8px;">
            <label for="setup-crt-select" style="color: #00ffff; font-weight: 700;">3. CRT 스캔라인</label>
            <select id="setup-crt-select">
              <option value="on" ${current.crt ? 'selected' : ''}>ENABLED (스캔라인 켜기 - 기본)</option>
              <option value="off" ${!current.crt ? 'selected' : ''}>DISABLED (스캔라인 끄기)</option>
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 150px 1fr; align-items: center; gap: 8px;">
            <label for="setup-sound-select" style="color: #00ffff; font-weight: 700;">4. 시스템 사운드</label>
            <select id="setup-sound-select">
              <option value="on" ${current.sound ? 'selected' : ''}>ENABLED (비프음/부팅음 켜기 - 기본)</option>
              <option value="off" ${!current.sound ? 'selected' : ''}>MUTED (무음 모드)</option>
            </select>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; color: #c0c0c0; font-size: 0.78rem;">
          <span>[ENTER] 저장 및 부팅 · [ESC] 기본값 사용</span>
          <div style="display: flex; gap: 8px;">
            <button type="button" id="btn-setup-default" style="
              background: #040826; color: #ffffff; border: 1px solid #80bfff;
              padding: 5px 10px; font-family: inherit; font-weight: 700; cursor: pointer;
            ">기본값으로 진행</button>
            <button type="button" id="btn-setup-save" style="
              background: #c0c0c0; color: #000080; border: 2px solid #ffffff;
              padding: 5px 14px; font-family: inherit; font-weight: 700; cursor: pointer;
            ">저장 및 부팅</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const finalizeSetup = (cfgToSave) => {
    window.removeEventListener('keydown', onSetupKeyDown);
    applyInitialSetupToSystem(cfgToSave);
    overlay.remove();
    startBiosBootSequence();
  };

  const readFormValues = () => ({
    resolution: document.getElementById('setup-res-select')?.value || '100',
    theme: document.getElementById('setup-theme-select')?.value || 'theme-teal',
    crt: (document.getElementById('setup-crt-select')?.value || 'on') === 'on',
    sound: (document.getElementById('setup-sound-select')?.value || 'on') === 'on'
  });

  function onSetupKeyDown(e) {
    if (!document.getElementById('bios-text-setup-overlay')) return;
    if (e.key === 'Enter' && document.activeElement?.tagName !== 'SELECT') {
      e.preventDefault();
      e.stopPropagation();
      finalizeSetup(readFormValues());
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      finalizeSetup(DEFAULT_INITIAL_SETUP);
    }
  }

  window.addEventListener('keydown', onSetupKeyDown, true);

  document.getElementById('btn-setup-save')?.addEventListener('click', () => {
    finalizeSetup(readFormValues());
  });

  document.getElementById('btn-setup-default')?.addEventListener('click', () => {
    finalizeSetup(DEFAULT_INITIAL_SETUP);
  });
}

window.openInitialSetupScreen = openInitialSetupScreen;

document.addEventListener('DOMContentLoaded', () => {
  renderSignupAvatarPicker();
  bindBootScreenEvents();
  openInitialSetupScreen(false);
});
window.runBootAnimation = window.runBootAnimation || function () {};

// ============================================================
// MY-ARCHIVE 95 OS — 3D CRT Animation, BIOS POST, Splash & Text SETUP
// ============================================================

window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
window.__MOD_VERSIONS.bootAnimation = 'v2026.11.25-auto-boot';

const ANIM_SETUP_KEY = 'myarchive95_setup_v1';

const DEFAULT_ANIM_SETUP = {
  resolution: '100',
  theme: 'theme-teal',
  crt: true,
  sound: true
};

function animSafeEsc(str) {
  if (typeof window.esc === 'function') return window.esc(str);
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isAnimSoundEnabled() {
  if (typeof window.__WIN95_SOUND_ENABLED === 'boolean') return window.__WIN95_SOUND_ENABLED;
  const setup = loadInitialSetup();
  return setup ? Boolean(setup.sound) : true;
}

function animSafeTone(type) {
  if (!isAnimSoundEnabled()) return;
  if (typeof window.playRetroTone === 'function') {
    try { window.playRetroTone(type); } catch {}
  }
}

// ============================================================
// 초기 실행 텍스트 기반 SETUP 화면
// ============================================================
function loadInitialSetup() {
  try {
    const raw = localStorage.getItem(ANIM_SETUP_KEY);
    if (!raw) return null;
    return { ...DEFAULT_ANIM_SETUP, ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

function applyInitialSetupToSystem(cfg) {
  const settings = { ...DEFAULT_ANIM_SETUP, ...(cfg || {}) };

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

  if (settings.resolution === '90') {
    document.documentElement.style.fontSize = '13px';
  } else if (settings.resolution === '110') {
    document.documentElement.style.fontSize = '15px';
  } else {
    document.documentElement.style.fontSize = '14px';
  }

  let crtEl = document.querySelector('.crt-overlay');
  if (!crtEl && settings.crt) {
    crtEl = document.createElement('div');
    crtEl.className = 'crt-overlay';
    document.body.appendChild(crtEl);
  }
  if (crtEl) {
    crtEl.classList.toggle('hidden', !settings.crt);
    crtEl.style.display = settings.crt ? 'block' : 'none';
  }

  window.__WIN95_SOUND_ENABLED = Boolean(settings.sound);
  if (!settings.sound) {
    window.playRetroTone = () => {};
  }

  try {
    localStorage.setItem(ANIM_SETUP_KEY, JSON.stringify(settings));
  } catch {}
}

function openInitialSetupScreen(forceOpen = false, onCompleteCallback = null) {
  document.body.classList.add('boot-locked');
  const existingCfg = loadInitialSetup();
  const nextStep = typeof onCompleteCallback === 'function' ? onCompleteCallback : window.startBiosBootSequence;

  if (existingCfg && !forceOpen) {
    applyInitialSetupToSystem(existingCfg);
    if (typeof nextStep === 'function') nextStep();
    return;
  }

  const current = existingCfg || { ...DEFAULT_ANIM_SETUP };

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
            <select id="setup-res-select" style="background:#040826;color:#ffffff;border:1px solid #80bfff;padding:5px 8px;font-family:inherit;">
              <option value="90" ${current.resolution === '90' ? 'selected' : ''}>COMPACT (90% / 13px)</option>
              <option value="100" ${current.resolution === '100' ? 'selected' : ''}>STANDARD (100% / 14px - 기본)</option>
              <option value="110" ${current.resolution === '110' ? 'selected' : ''}>LARGE (110% / 15px)</option>
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 150px 1fr; align-items: center; gap: 8px;">
            <label for="setup-theme-select" style="color: #00ffff; font-weight: 700;">2. 바탕화면 테마</label>
            <select id="setup-theme-select" style="background:#040826;color:#ffffff;border:1px solid #80bfff;padding:5px 8px;font-family:inherit;">
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
            <select id="setup-crt-select" style="background:#040826;color:#ffffff;border:1px solid #80bfff;padding:5px 8px;font-family:inherit;">
              <option value="on" ${current.crt ? 'selected' : ''}>ENABLED (스캔라인 켜기 - 기본)</option>
              <option value="off" ${!current.crt ? 'selected' : ''}>DISABLED (스캔라인 끄기)</option>
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 150px 1fr; align-items: center; gap: 8px;">
            <label for="setup-sound-select" style="color: #00ffff; font-weight: 700;">4. 시스템 사운드</label>
            <select id="setup-sound-select" style="background:#040826;color:#ffffff;border:1px solid #80bfff;padding:5px 8px;font-family:inherit;">
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
    window.removeEventListener('keydown', onSetupKeyDown, true);
    applyInitialSetupToSystem(cfgToSave);
    overlay.remove();
    if (typeof nextStep === 'function') nextStep();
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
      finalizeSetup(DEFAULT_ANIM_SETUP);
    }
  }

  window.addEventListener('keydown', onSetupKeyDown, true);

  document.getElementById('btn-setup-save')?.addEventListener('click', () => {
    finalizeSetup(readFormValues());
  });

  document.getElementById('btn-setup-default')?.addEventListener('click', () => {
    finalizeSetup(DEFAULT_ANIM_SETUP);
  });
}

function triggerCrtPowerOnFlash(targetEl) {
  if (!targetEl) return;
  targetEl.animate(
    [
      {
        transform: 'scaleY(0.01) scaleX(0.18)',
        filter: 'brightness(4.2) drop-shadow(0 0 28px #ffffff)',
        opacity: 0.95
      },
      {
        transform: 'scaleY(0.028) scaleX(1.02)',
        filter: 'brightness(3.2) drop-shadow(0 0 22px #a8f5ff)',
        opacity: 1,
        offset: 0.42
      },
      {
        transform: 'scaleY(1.01) scaleX(1)',
        filter: 'brightness(1.85) drop-shadow(0 0 12px rgba(255, 255, 255, 0.6))',
        opacity: 1,
        offset: 0.72
      },
      {
        transform: 'scaleY(1) scaleX(1)',
        filter: 'brightness(1) drop-shadow(0 0 0 transparent)',
        opacity: 1
      }
    ],
    { duration: 820, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
  );
}

// ============================================================
// Three.js 로우-폴리 3D CRT 모니터
// ============================================================
let __threeScriptPromise = null;

function loadThreeJsLibrary() {
  if (window.THREE) return Promise.resolve(window.THREE);
  if (__threeScriptPromise) return __threeScriptPromise;

  __threeScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js';
    script.async = true;
    script.onload = () => (window.THREE ? resolve(window.THREE) : reject(new Error('THREE unavailable')));
    script.onerror = () => reject(new Error('Failed to load THREE'));
    document.head.appendChild(script);
  });

  return __threeScriptPromise;
}

function createCrtScreenCanvasTexture(THREE) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#05080c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#d8e4f0';
  ctx.font = 'bold 18px Consolas, monospace';
  ctx.fillText('AWARD MODULAR BIOS v4.51PG', 22, 38);
  ctx.fillStyle = '#7cd4ff';
  ctx.font = '15px Consolas, monospace';
  ctx.fillText('MY-ARCHIVE 95 WORKSTATION', 22, 66);
  ctx.fillStyle = '#66ff66';
  ctx.fillText('CPU: PENTIUM-CLASS 133MHz [OK]', 22, 106);
  ctx.fillText('MEMORY TEST: 65536K OK', 22, 130);
  ctx.fillStyle = '#ffff66';
  ctx.fillText('BIOS READY...', 22, 174);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  for (let y = 0; y < canvas.height; y += 4) {
    ctx.fillRect(0, y, canvas.width, 1.5);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function buildLowPolyCrt3dGroup(THREE) {
  const root = new THREE.Group();

  const bezelMat = new THREE.MeshStandardMaterial({
    color: 0xd0ccc0,
    roughness: 0.78,
    metalness: 0.04,
    flatShading: true
  });
  const bevelRidgeMat = new THREE.MeshStandardMaterial({
    color: 0xc2beb0,
    roughness: 0.8,
    metalness: 0.05,
    flatShading: true
  });
  const darkTrimMat = new THREE.MeshStandardMaterial({
    color: 0x67645a,
    roughness: 0.85,
    metalness: 0.08,
    flatShading: true
  });
  const backShellMat = new THREE.MeshStandardMaterial({
    color: 0x9c988a,
    roughness: 0.82,
    metalness: 0.06,
    flatShading: true
  });
  const ledMat = new THREE.MeshStandardMaterial({
    color: 0x3be85e,
    emissive: 0x22b542,
    emissiveIntensity: 0.85,
    flatShading: true
  });
  const powerBtnMat = new THREE.MeshStandardMaterial({
    color: 0x3b6fd8,
    roughness: 0.45,
    metalness: 0.15,
    flatShading: true
  });

  const topBar = new THREE.Mesh(new THREE.BoxGeometry(3.24, 0.34, 0.36), bezelMat);
  topBar.position.set(0, 1.13, 1.04);
  root.add(topBar);

  const bottomChin = new THREE.Mesh(new THREE.BoxGeometry(3.24, 0.54, 0.42), bezelMat);
  bottomChin.position.set(0, -1.03, 1.06);
  root.add(bottomChin);

  const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.92, 0.36), bezelMat);
  leftPillar.position.set(-1.44, 0.01, 1.04);
  root.add(leftPillar);

  const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.92, 0.36), bezelMat);
  rightPillar.position.set(1.44, 0.01, 1.04);
  root.add(rightPillar);

  const innerRim = new THREE.Mesh(new THREE.BoxGeometry(2.58, 1.96, 0.14), darkTrimMat);
  innerRim.position.set(0, 0.01, 0.96);
  root.add(innerRim);

  const screenGeo = new THREE.PlaneGeometry(2.44, 1.82, 10, 8);
  const posAttr = screenGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i) / 1.22;
    const y = posAttr.getY(i) / 0.91;
    const bulge = Math.max(0, 1 - 0.32 * (x * x + y * y)) * 0.08;
    posAttr.setZ(i, bulge);
  }
  screenGeo.computeVertexNormals();

  const screenMat = new THREE.MeshStandardMaterial({
    map: createCrtScreenCanvasTexture(THREE),
    roughness: 0.25,
    metalness: 0.05,
    emissive: 0x16222c,
    emissiveIntensity: 0.55,
    flatShading: true
  });
  const screenMesh = new THREE.Mesh(screenGeo, screenMat);
  screenMesh.position.set(0, 0.01, 1.06);
  root.add(screenMesh);

  const pwrBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.12, 8), powerBtnMat);
  pwrBtn.rotation.x = Math.PI / 2;
  pwrBtn.position.set(1.28, -1.03, 1.27);
  root.add(pwrBtn);

  const ledDot = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.06), ledMat);
  ledDot.position.set(-1.18, -1.03, 1.28);
  root.add(ledDot);

  const chevronShape = new THREE.Shape();
  chevronShape.moveTo(-0.75, -1.24);
  chevronShape.lineTo(0.86, -1.24);
  chevronShape.lineTo(1.06, 0.0);
  chevronShape.lineTo(0.86, 1.24);
  chevronShape.lineTo(-0.75, 1.24);
  chevronShape.closePath();

  const chevronSideGeo = new THREE.ExtrudeGeometry(chevronShape, {
    depth: 0.24,
    bevelEnabled: false,
    steps: 1
  });
  chevronSideGeo.rotateY(Math.PI / 2);

  const leftChevronSide = new THREE.Mesh(chevronSideGeo, bevelRidgeMat);
  leftChevronSide.position.set(-1.58, 0, 0.24);
  root.add(leftChevronSide);

  const rightChevronSide = new THREE.Mesh(chevronSideGeo, bevelRidgeMat);
  rightChevronSide.position.set(1.34, 0, 0.24);
  root.add(rightChevronSide);

  const mainBody = new THREE.Mesh(new THREE.BoxGeometry(3.12, 2.5, 1.22), bezelMat);
  mainBody.position.set(0, 0, 0.26);
  root.add(mainBody);

  const rearCone = new THREE.Mesh(new THREE.CylinderGeometry(1.06, 0.68, 1.16, 6), backShellMat);
  rearCone.rotation.x = Math.PI / 2;
  rearCone.position.set(0, 0.04, -0.88);
  root.add(rearCone);

  const rearCap = new THREE.Mesh(new THREE.BoxGeometry(1.32, 1.22, 0.22), darkTrimMat);
  rearCap.position.set(0, 0.04, -1.48);
  root.add(rearCap);

  const neck = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.34, 0.84), darkTrimMat);
  neck.position.set(0, -1.36, 0.14);
  root.add(neck);

  const baseShape = new THREE.Shape();
  baseShape.moveTo(-0.92, -0.92);
  baseShape.lineTo(0.92, -0.92);
  baseShape.lineTo(1.14, 0.0);
  baseShape.lineTo(0.92, 0.92);
  baseShape.lineTo(-0.92, 0.92);
  baseShape.lineTo(-1.14, 0.0);
  baseShape.closePath();

  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: 0.22,
    bevelEnabled: false,
    steps: 1
  });
  baseGeo.rotateX(Math.PI / 2);

  const base = new THREE.Mesh(baseGeo, bezelMat);
  base.position.set(0, -1.52, 0.16);
  root.add(base);

  return root;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeInOutQuart(t) {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

function play3dCrtMonitorAnimation(options = {}) {
  return new Promise(resolve => {
    const prev = document.getElementById('retro-3d-crt-stage');
    if (prev) prev.remove();

    const alreadyClicked = Boolean(options.alreadyClicked);
    const autoStart = alreadyClicked || options.autoStart !== false;

    const stage = document.createElement('div');
    stage.id = 'retro-3d-crt-stage';
    stage.title = 'CLICK TO SKIP 3D BOOT';
    stage.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 1000000;
      background: #000000;
      opacity: 1;
      transition: opacity 0.25s ease;
      cursor: pointer;
    `;
    document.body.appendChild(stage);

    let finished = false;
    let rafId = 0;
    let renderer = null;
    let rotationStarted = autoStart;
    let turnStartTime = autoStart ? performance.now() : 0;

    let stopNoiseTitleLayer = (!autoStart && typeof window.startPreClickNoiseTitleLayer === 'function')
      ? window.startPreClickNoiseTitleLayer()
      : null;
    let stopStaticVisual = (!autoStart && typeof window.startFullScreenStaticEffect === 'function')
      ? window.startFullScreenStaticEffect()
      : null;
    let stopNoiseAudio = (!autoStart && typeof window.startSubtleStaticNoise === 'function')
      ? window.startSubtleStaticNoise()
      : null;

    const cleanup = () => {
      if (stopNoiseTitleLayer) {
        stopNoiseTitleLayer();
        stopNoiseTitleLayer = null;
      }
      if (stopStaticVisual) {
        stopStaticVisual();
        stopStaticVisual = null;
      }
      if (stopNoiseAudio) {
        stopNoiseAudio.stop();
        stopNoiseAudio = null;
      }
      if (rafId) cancelAnimationFrame(rafId);
      if (renderer) {
        try {
          renderer.dispose();
          renderer.domElement?.remove();
        } catch {}
      }
    };

    const finishIntro = () => {
      if (finished) return;
      finished = true;
      stage.style.opacity = '0';
      stage.style.pointerEvents = 'none';
      setTimeout(() => {
        cleanup();
        stage.remove();
        resolve();
      }, 240);
    };

    const turnDurationMs = 2650;
    const zoomDurationMs = 2750;

    const triggerRotationFromClick = now => {
      if (rotationStarted) {
        finishIntro();
        return;
      }
      rotationStarted = true;
      turnStartTime = now || performance.now();
      if (stopNoiseTitleLayer) {
        stopNoiseTitleLayer();
        stopNoiseTitleLayer = null;
      }
      if (stopNoiseAudio?.resume) stopNoiseAudio.resume();
      if (typeof window.playButtonClickSound === 'function') {
        window.playButtonClickSound({ gapSec: 0.068, volume: 1.05 });
      }
    };

    stage.addEventListener('click', () => {
      triggerRotationFromClick(performance.now());
    });

    loadThreeJsLibrary()
      .then(THREE => {
        if (finished) return;
        if (rotationStarted && !turnStartTime) {
          turnStartTime = performance.now();
        }

        const width = window.innerWidth || 1280;
        const height = window.innerHeight || 720;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);

        const camera = new THREE.PerspectiveCamera(42, width / height, 0.05, 100);
        camera.position.set(0.35, 0.25, 7.6);
        camera.lookAt(0, -0.1, 0);

        renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        stage.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.15);
        scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0xfff7e6, 1.95);
        keyLight.position.set(4.5, 5.5, 6.0);
        scene.add(keyLight);

        const rimLight = new THREE.DirectionalLight(0x9ec5ff, 0.95);
        rimLight.position.set(-5.0, 2.0, -4.0);
        scene.add(rimLight);

        const crtModel = buildLowPolyCrt3dGroup(THREE);
        crtModel.position.set(0.65, -0.05, -0.8);
        crtModel.rotation.set(0.08, 0.78, 0);
        crtModel.visible = rotationStarted;
        scene.add(crtModel);

        const onResize = () => {
          if (finished || !renderer) return;
          const w = window.innerWidth || 1280;
          const h = window.innerHeight || 720;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        };
        window.addEventListener('resize', onResize);

        const animateFrame = now => {
          if (finished) {
            window.removeEventListener('resize', onResize);
            return;
          }

          if (!rotationStarted) {
            crtModel.visible = false;
          } else {
            crtModel.visible = true;
            const elapsedTurn = Math.max(0, now - turnStartTime);
            const turnRaw = Math.min(1, elapsedTurn / turnDurationMs);
            const tEase = easeInOutCubic(turnRaw);

            crtModel.rotation.y = 0.78 * (1 - tEase);
            crtModel.rotation.x = 0.08 * (1 - tEase);
            crtModel.position.x = 0.65 * (1 - tEase);
            crtModel.position.y = -0.05 * (1 - tEase);
            crtModel.position.z = -0.8 * (1 - tEase);

            if (elapsedTurn > turnDurationMs * 0.74) {
              const zoomStart = turnDurationMs * 0.74;
              const zoomRaw = Math.min(1, Math.max(0, (elapsedTurn - zoomStart) / zoomDurationMs));
              const zEase = easeInOutQuart(zoomRaw);

              camera.position.x = 0.35 * (1 - tEase);
              camera.position.y = 0.25 * (1 - tEase) + 0.01 * zEase;
              camera.position.z = 7.6 - 5.95 * zEase;
              camera.lookAt(0, 0.01 * zEase, 0.85 * zEase);

              if (zoomRaw >= 1) {
                window.removeEventListener('resize', onResize);
                finishIntro();
                return;
              }
            }
          }

          renderer.render(scene, camera);
          rafId = requestAnimationFrame(animateFrame);
        };

        rafId = requestAnimationFrame(animateFrame);
      })
      .catch(() => {
        if (!finished) finishIntro();
      });
  });
}

// ============================================================
// BIOS 비프음 / 드라이브 틱음 / 레트로 부팅음 & BIOS POST 실행
// ============================================================
function playBiosPostBeep(freq = 880, dur = 0.14) {
  if (!isAnimSoundEnabled()) return;
  try {
    const ctx = typeof window.getWaitAudioContext === 'function'
      ? window.getWaitAudioContext()
      : new (window.AudioContext || window.webkitAudioContext)();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.055, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.02);
  } catch {}
}

function playDriveSeekTick() {
  if (!isAnimSoundEnabled()) return;
  try {
    const ctx = typeof window.getWaitAudioContext === 'function'
      ? window.getWaitAudioContext()
      : new (window.AudioContext || window.webkitAudioContext)();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(145, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(65, ctx.currentTime + 0.035);
    gain.gain.setValueAtTime(0.035, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.045);
  } catch {}
}

function playWin95StartupSound(forceOnce = true, bootState = null) {
  if (!isAnimSoundEnabled()) return;
  if (forceOnce && bootState?.startupSoundPlayed) return;
  if (bootState) bootState.startupSoundPlayed = true;

  try {
    const ctx = typeof window.getWaitAudioContext === 'function'
      ? window.getWaitAudioContext()
      : new (window.AudioContext || window.webkitAudioContext)();
    if (!ctx) return;
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    const delay = ctx.createDelay();
    const delayGain = ctx.createGain();

    delay.delayTime.value = 0.3;
    delayGain.gain.value = 0.4;

    masterGain.connect(ctx.destination);
    masterGain.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(masterGain);

    masterGain.gain.setValueAtTime(0.6, now);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 4.5);

    const frequencies = [130.81, 196.00, 261.63];
    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = index === 1 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 4.0);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 4.5);
    });

    const chimeNotes = [659.25, 783.99, 587.33, 523.25];
    const startTimeOffsets = [0.4, 0.6, 0.9, 1.2];

    chimeNotes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const toneStart = now + startTimeOffsets[index];
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.setValueAtTime(freq, toneStart);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.setValueAtTime(0.0001, toneStart);
      gain.gain.linearRampToValueAtTime(0.25, toneStart + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, toneStart + 1.5);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(toneStart + 1.6);
    });
  } catch {}
}

function runBiosPostSequenceOnly(seqId, bootState, onSetStage) {
  const biosEl = document.getElementById('boot-stage-bios');
  triggerCrtPowerOnFlash(biosEl);

  const ramEl = document.getElementById('bios-ram-count');
  const logEl = document.getElementById('bios-log-lines');
  const syncBadge = document.getElementById('bios-sync-badge');

  if (logEl) logEl.innerHTML = '';
  if (ramEl) ramEl.textContent = '640';

  let ramVal = 640;
  bootState.ramInterval = setInterval(() => {
    if (seqId !== bootState.bootSeqId) return;
    ramVal += 4096;
    if (ramVal >= 65536) {
      ramVal = 65536;
      clearInterval(bootState.ramInterval);
      bootState.ramInterval = null;
      if (!bootState.biosBeepPlayed && bootState.stage === 'bios') {
        bootState.biosBeepPlayed = true;
        playBiosPostBeep(920, 0.12);
      }
    }
    if (ramEl) ramEl.textContent = String(ramVal);
  }, 45);

  const postSteps = [
    { delay: 220, text: 'Detecting IDE Primary Master   ... MY-ARCHIVE-HDD [OK]', tick: true },
    { delay: 480, text: 'Detecting IDE Primary Slave    ... JUKEBOX-CDROM 4X [OK]', tick: true },
    { delay: 760, text: 'Initializing Sound Blaster 16  ... Port 220H IRQ 5 DMA 1 [OK]', tick: true },
    { delay: 1040, text: 'Connecting Archive Host        ... Network Drive Mounted [OK]', tick: true },
    { delay: 1320, text: 'Verifying DMI Pool Data ........ Update Success', tick: false },
    { delay: 1600, text: 'Starting MY-ARCHIVE 95...', tick: false, accent: true }
  ];

  postSteps.forEach(step => {
    const tid = setTimeout(() => {
      if (seqId !== bootState.bootSeqId || bootState.stage !== 'bios' || !logEl) return;
      if (step.tick) playDriveSeekTick();

      const line = document.createElement('div');
      line.textContent = step.text;
      if (step.accent) {
        line.style.color = '#ffff55';
        line.style.fontWeight = '900';
        line.style.marginTop = '8px';
      }
      logEl.appendChild(line);

      if (syncBadge && step.text.includes('Archive Host')) {
        syncBadge.textContent = 'ARCHIVE HOST: CONNECTED';
        syncBadge.style.color = '#55ff55';
      }
    }, step.delay);
    bootState.timers.push(tid);
  });

  // BIOS -> 로딩 스플래시 자동 진입
  bootState.timers.push(setTimeout(() => {
    if (seqId === bootState.bootSeqId && bootState.stage === 'bios') onSetStage('splash');
  }, 2050));

  // 로딩 스플래시 재생 완료 후 클릭 없이 자동으로 로그온 화면 전환
  bootState.timers.push(setTimeout(() => {
    if (seqId === bootState.bootSeqId && bootState.stage === 'splash') onSetStage('login');
  }, 3500));

  bootState.timers.push(setTimeout(() => {
    if (seqId === bootState.bootSeqId && (bootState.stage === 'bios' || bootState.stage === 'splash')) {
      onSetStage('login');
    }
  }, 4800));
}

window.loadInitialSetup = loadInitialSetup;
window.applyInitialSetupToSystem = applyInitialSetupToSystem;
window.openInitialSetupScreen = openInitialSetupScreen;
window.triggerCrtPowerOnFlash = triggerCrtPowerOnFlash;
window.play3dCrtMonitorAnimation = play3dCrtMonitorAnimation;
window.playBiosPostBeep = playBiosPostBeep;
window.playDriveSeekTick = playDriveSeekTick;
window.playWin95StartupSound = playWin95StartupSound;
window.runBiosPostSequenceOnly = runBiosPostSequenceOnly;

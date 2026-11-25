// ============================================================
// MY-ARCHIVE 95 OS — Boot Lifecycle Controller (Stage Flow)
// Flow: Preloader(500ms/file + Complete Hold) -> TV Off
//       -> Wait(Text+Noise) -> [Click/Key] -> 3D Anim -> BIOS
//       -> [Click/Key] -> Loading Splash -> Logon
// ============================================================

(function () {
  window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
  window.__MOD_VERSIONS.bootController = 'v2026.11.25-stage-flow-preloader-v7';

  window.__ARCHIVE_LOGGED_IN = false;
  window.__ARCHIVE_GATE_DISMISSED = false;
  let __waitBootStarted = false;
  let __firstScreenMounted = false;

  function setPreLoginLock(locked) {
    if (!document.body) return;
    if (locked) {
      document.body.classList.add('boot-locked');
      document.body.classList.add('pre-login-lock');
    } else {
      document.body.classList.remove('boot-locked');
      document.body.classList.remove('pre-login-lock');
    }
  }

  function dismissPreClickStartScreen() {
    window.__ARCHIVE_GATE_DISMISSED = true;
    const hitLayer = document.getElementById('pre-click-start-hit-layer');
    if (hitLayer) {
      hitLayer.style.pointerEvents = 'none';
      hitLayer.remove();
    }
    const waitScreen = document.getElementById('pre-click-start-screen');
    if (waitScreen) {
      waitScreen.remove();
    }
  }

  // 1단계(글자+노이즈 화면)에서 클릭 또는 아무 키 입력 시 -> 2단계(애니메이션 -> BIOS) 진입
  function enterBootAfterStartClick() {
    if (__waitBootStarted || window.__ARCHIVE_LOGGED_IN) return;
    __waitBootStarted = true;
    dismissPreClickStartScreen();

    const overlay = document.getElementById('os-boot-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
    }

    if (typeof window.__runActualBiosSequence === 'function') {
      return window.__runActualBiosSequence();
    }
    if (typeof window.__origStartBiosBootSequence === 'function') {
      return window.__origStartBiosBootSequence();
    }
    if (typeof window.startBiosBootSequence === 'function') {
      return window.startBiosBootSequence();
    }
    if (typeof window.openInitialSetupScreen === 'function') {
      return window.openInitialSetupScreen(false);
    }
  }

  window.__enterBootAfterStartClick = enterBootAfterStartClick;

  function mountWaitScreenAfterPreload() {
    if (__firstScreenMounted || window.__ARCHIVE_LOGGED_IN || __waitBootStarted) return;
    __firstScreenMounted = true;

    if (typeof window.mountPreClickStartScreen === 'function') {
      window.mountPreClickStartScreen(enterBootAfterStartClick);
    } else {
      enterBootAfterStartClick();
    }
  }

  window.__onBrutalPreloadReady = mountWaitScreenAfterPreload;

  function hookBootLifecycle() {
    // boot-animation.js / boot-login.js의 부팅 시퀀스 훅
    if (typeof window.startBiosBootSequence === 'function' && !window.__origStartBiosBootSequence) {
      window.__origStartBiosBootSequence = window.startBiosBootSequence;

      window.startBiosBootSequence = function () {
        if (!window.__ARCHIVE_LOGGED_IN) {
          setPreLoginLock(true);
        }
        // 아직 첫 대기 화면(글자+노이즈)이 닫히지 않았다면 대기 화면부터 먼저 표시
        if (!window.__ARCHIVE_GATE_DISMISSED && typeof window.mountPreClickStartScreen === 'function') {
          __firstScreenMounted = true;
          window.mountPreClickStartScreen(enterBootAfterStartClick);
          return;
        }
        const overlay = document.getElementById('os-boot-overlay');
        if (overlay) overlay.style.display = 'flex';
        return window.__origStartBiosBootSequence.apply(this, arguments);
      };

      window.__runActualBiosSequence = function () {
        return window.__origStartBiosBootSequence.apply(window, arguments);
      };
    }

    // 로그온 완료 시 바탕화면 잠금 해제
    if (typeof window.finishDesktopLogin === 'function' && !window.finishDesktopLogin.__archiveHooked) {
      const origFinish = window.finishDesktopLogin;
      const wrappedFinish = function () {
        window.__ARCHIVE_LOGGED_IN = true;
        dismissPreClickStartScreen();
        const res = origFinish.apply(this, arguments);
        setPreLoginLock(false);
        return res;
      };
      wrappedFinish.__archiveHooked = true;
      window.finishDesktopLogin = wrappedFinish;
    }
  }

  // 보조: BIOS 화면에서 클릭 또는 아무 키(DEL 제외) 입력 시 로딩 스플래시로 넘어가도록 보장
  function bindBiosAdvanceFallback() {
    if (window.__biosAdvanceBound) return;
    window.__biosAdvanceBound = true;

    const handleBiosAdvance = (e) => {
      const biosStage = document.getElementById('boot-stage-bios');
      if (!biosStage || biosStage.style.display === 'none') return;
      if (e.type === 'keydown') {
        const key = (e.key || '').toUpperCase();
        // DEL 키는 CMOS 이스터에그용이므로 스킵에서 제외
        if (key === 'DELETE' || key === 'DEL') return;
      }
      if (typeof window.skipBiosPostToSplash === 'function') {
        window.skipBiosPostToSplash();
      }
    };

    window.addEventListener('keydown', handleBiosAdvance, true);
    window.addEventListener('pointerdown', handleBiosAdvance, true);
  }

  if (typeof window.openCommunityBoard !== 'function') {
    window.openCommunityBoard = function () {
      const winEl = document.getElementById('win-community');
      if (winEl) {
        winEl.classList.add('open', 'focused');
        winEl.style.display = 'block';
      }
    };
  }

  if (typeof window.openAccountSettingsModal !== 'function') {
    window.openAccountSettingsModal = function () {
      const loginStage = document.getElementById('boot-stage-login');
      const overlay = document.getElementById('os-boot-overlay');
      if (overlay && loginStage) {
        setPreLoginLock(true);
        overlay.style.display = 'flex';
        loginStage.style.display = 'flex';
      }
    };
  }

  function bindShellActions() {
    document.querySelectorAll('#icon-community, #mnu-open-community, #sm-community').forEach((el) => {
      if (el && !el.__communityBound) {
        el.__communityBound = true;
        el.addEventListener('click', () => {
          if (typeof window.openCommunityBoard === 'function') window.openCommunityBoard();
        });
      }
    });

    const userBadge = document.getElementById('active-user-badge');
    if (userBadge && !userBadge.__accountBound) {
      userBadge.__accountBound = true;
      userBadge.addEventListener('click', () => {
        if (typeof window.openAccountSettingsModal === 'function') window.openAccountSettingsModal();
      });
    }

    const portfolioIcon = document.getElementById('icon-portfolio');
    const portfolioWin = document.getElementById('win-portfolio');
    const portfolioFrame = document.getElementById('portfolio-frame');
    const portfolioUrlBar = document.getElementById('portfolio-url-bar');
    const portfolioReloadBtn = document.getElementById('btn-portfolio-reload');
    const portfolioStatusLeft = document.getElementById('portfolio-status-left');
    const portfolioUrl = 'https://nlasdnfkl2.github.io/my-webpage/';

    function ensurePortfolioLoaded(forceReload) {
      if (!portfolioFrame) return;
      const targetUrl = (portfolioUrlBar && portfolioUrlBar.value.trim()) || portfolioUrl;
      if (!portfolioFrame.getAttribute('src') || forceReload) {
        if (portfolioStatusLeft) portfolioStatusLeft.textContent = '포트폴리오 불러오는 중...';
        portfolioFrame.setAttribute('src', targetUrl);
      }
    }

    if (portfolioFrame && !portfolioFrame.__loadBound) {
      portfolioFrame.__loadBound = true;
      portfolioFrame.addEventListener('load', () => {
        if (portfolioFrame.getAttribute('src') && portfolioStatusLeft) {
          portfolioStatusLeft.textContent = '연결 완료 — ' + portfolioFrame.getAttribute('src');
        }
      });
    }

    if (portfolioIcon && !portfolioIcon.__bound) {
      portfolioIcon.__bound = true;
      portfolioIcon.addEventListener('click', () => {
        if (portfolioWin) {
          portfolioWin.classList.remove('minimized');
          portfolioWin.classList.add('open', 'focused');
          portfolioWin.style.display = '';
        }
        ensurePortfolioLoaded(false);
      });
    }

    if (portfolioReloadBtn && !portfolioReloadBtn.__bound) {
      portfolioReloadBtn.__bound = true;
      portfolioReloadBtn.addEventListener('click', () => {
        ensurePortfolioLoaded(true);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('os-boot-overlay') && typeof window.mountArchiveShell === 'function') {
      window.mountArchiveShell();
    }
    setPreLoginLock(true);
    hookBootLifecycle();
    bindShellActions();
    bindBiosAdvanceFallback();

    const preloaderActive = Boolean(document.getElementById('brutal-js-preloader')) && !window.__BRUTAL_PRELOAD_DONE;
    if (!preloaderActive) {
      mountWaitScreenAfterPreload();
    }
  });

  window.addEventListener('load', () => {
    hookBootLifecycle();
    bindShellActions();
  }, { once: true });
})();

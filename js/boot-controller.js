// ============================================================
// MY-ARCHIVE 95 OS — Boot Lifecycle Controller (Stage Flow)
// Flow: Preloader -> TV Off -> Wait -> [Click/Key]
//       -> 3D CRT Animation -> [First Run & No Setup] Initial Setup
//       -> BIOS -> Splash -> Logon
// ============================================================

(function () {
  window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
  window.__MOD_VERSIONS.bootController = 'v2026.11.25-setup-strictly-after-anim-before-bios';

  const SETUP_STORAGE_KEY = 'myarchive95_setup_v1';

  window.__ARCHIVE_LOGGED_IN = false;
  window.__ARCHIVE_GATE_DISMISSED = false;
  let __waitBootStarted = false;
  let __firstScreenMounted = false;
  let __stageMusicStopped = false;
  let __postAnimSetupShown = false;
  let __postAnimSetupResumed = false;
  let __continueToBiosFn = null;

  function hasSavedSetupData() {
    try {
      const raw = localStorage.getItem(SETUP_STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return Boolean(parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0);
    } catch {
      return false;
    }
  }

  function stopAllBootMusicForStage() {
    if (__stageMusicStopped) return;
    __stageMusicStopped = true;
    try {
      if (typeof window.__stopWaitMusicForBios === 'function') {
        window.__stopWaitMusicForBios();
      }
    } catch {}
    try {
      if (typeof window.stopPreClickWaitAudio === 'function') {
        window.stopPreClickWaitAudio();
      }
    } catch {}
  }

  function isElementVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle ? window.getComputedStyle(el) : null;
    if (el.style.display === 'none' || el.hidden) return false;
    if (style && (style.display === 'none' || style.visibility === 'hidden')) return false;
    return true;
  }

  function observeBiosAndSetupAppearance() {
    const checkStages = () => {
      const biosStage = document.getElementById('boot-stage-bios');
      const setupStage = document.getElementById('bios-text-setup-overlay');
      if ((biosStage && isElementVisible(biosStage)) || (setupStage && isElementVisible(setupStage))) {
        stopAllBootMusicForStage();
      }
    };

    checkStages();

    const targetRoot = document.getElementById('os-boot-overlay') || document.body || document.documentElement;
    if (!targetRoot || typeof MutationObserver !== 'function') return;

    const observer = new MutationObserver(() => {
      checkStages();
    });

    observer.observe(targetRoot, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['style', 'class', 'hidden']
    });
  }

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

  function proceedToBiosAfterSetup() {
    if (__postAnimSetupResumed) return;
    __postAnimSetupResumed = true;
    stopAllBootMusicForStage();

    const overlay = document.getElementById('os-boot-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
    }

    const fn = __continueToBiosFn;
    __continueToBiosFn = null;
    if (typeof fn === 'function') {
      return fn();
    }
  }

  window.__onInitialSetupComplete = proceedToBiosAfterSetup;

  function watchSetupModalClose() {
    const findSetupEl = () => document.getElementById('bios-text-setup-overlay');

    if (typeof MutationObserver === 'function') {
      const observer = new MutationObserver(() => {
        const curEl = findSetupEl();
        if (curEl && isElementVisible(curEl)) {
          stopAllBootMusicForStage();
        }
        if (__postAnimSetupResumed) {
          observer.disconnect();
          return;
        }
        if (!curEl || !isElementVisible(curEl)) {
          observer.disconnect();
          proceedToBiosAfterSetup();
        }
      });

      observer.observe(document.body || document.documentElement, {
        attributes: true,
        childList: true,
        subtree: true,
        attributeFilter: ['style', 'class', 'hidden']
      });
    }
  }

  // 3D 애니메이션 완료 후 ~ BIOS 화면 진입 직전에 호출되는 훅
  function runBeforeBiosAfterAnimation(continueToBiosFn) {
    __continueToBiosFn = continueToBiosFn;

    if (__postAnimSetupShown || __postAnimSetupResumed || hasSavedSetupData() || typeof window.openInitialSetupScreen !== 'function') {
      return proceedToBiosAfterSetup();
    }

    __postAnimSetupShown = true;
    stopAllBootMusicForStage();

    const overlay = document.getElementById('os-boot-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
    }

    try {
      window.openInitialSetupScreen(true, proceedToBiosAfterSetup);
    } catch {
      try {
        window.openInitialSetupScreen();
      } catch {
        return proceedToBiosAfterSetup();
      }
    }
    stopAllBootMusicForStage();
    watchSetupModalClose();
  }

  window.__runBeforeBiosAfterAnimation = runBeforeBiosAfterAnimation;

  function enterBootAfterStartClick() {
    if (__waitBootStarted || window.__ARCHIVE_LOGGED_IN) return;
    __waitBootStarted = true;
    dismissPreClickStartScreen();

    const overlay = document.getElementById('os-boot-overlay');
    if (overlay) overlay.style.display = 'flex';

    if (typeof window.__origStartBiosBootSequence === 'function') {
      return window.__origStartBiosBootSequence({ alreadyClicked: true });
    }
    if (typeof window.startBiosBootSequence === 'function') {
      return window.startBiosBootSequence({ alreadyClicked: true });
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

  function createControllerBiosWrapper(rawFn) {
    const wrapped = function () {
      if (!window.__ARCHIVE_LOGGED_IN) {
        setPreLoginLock(true);
      }
      if (!window.__ARCHIVE_GATE_DISMISSED && typeof window.mountPreClickStartScreen === 'function') {
        __firstScreenMounted = true;
        window.mountPreClickStartScreen(enterBootAfterStartClick);
        return;
      }
      const overlay = document.getElementById('os-boot-overlay');
      if (overlay) overlay.style.display = 'flex';
      return rawFn.apply(this, arguments);
    };
    wrapped.__bootControllerWrapped = true;
    return wrapped;
  }

  function hookBootLifecycle() {
    if (typeof window.startBiosBootSequence === 'function' && !window.startBiosBootSequence.__bootControllerWrapped) {
      window.__origStartBiosBootSequence = window.startBiosBootSequence;
      window.startBiosBootSequence = createControllerBiosWrapper(window.__origStartBiosBootSequence);
      window.__runActualBiosSequence = function () {
        const overlay = document.getElementById('os-boot-overlay');
        if (overlay) overlay.style.display = 'flex';
        return window.__origStartBiosBootSequence.apply(window, arguments);
      };
    }

    if (typeof window.skipBiosPostToSplash === 'function' && !window.skipBiosPostToSplash.__biosAudioHooked) {
      const origSkip = window.skipBiosPostToSplash;
      const wrappedSkip = function () {
        stopAllBootMusicForStage();
        return origSkip.apply(this, arguments);
      };
      wrappedSkip.__biosAudioHooked = true;
      window.skipBiosPostToSplash = wrappedSkip;
    }

    if (typeof window.finishDesktopLogin === 'function' && !window.finishDesktopLogin.__archiveHooked) {
      const origFinish = window.finishDesktopLogin;
      const wrappedFinish = function () {
        window.__ARCHIVE_LOGGED_IN = true;
        stopAllBootMusicForStage();
        dismissPreClickStartScreen();
        const res = origFinish.apply(this, arguments);
        setPreLoginLock(false);
        return res;
      };
      wrappedFinish.__archiveHooked = true;
      window.finishDesktopLogin = wrappedFinish;
    }
  }

  function bindBiosAdvanceFallback() {
    if (window.__biosAdvanceBound) return;
    window.__biosAdvanceBound = true;

    const handleBiosAdvance = (e) => {
      const biosStage = document.getElementById('boot-stage-bios');
      if (!biosStage || biosStage.style.display === 'none') return;
      stopAllBootMusicForStage();
      if (e.type === 'keydown') {
        const key = (e.key || '').toUpperCase();
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
    observeBiosAndSetupAppearance();

    const preloaderActive = Boolean(document.getElementById('brutal-js-preloader')) && !window.__BRUTAL_PRELOAD_DONE;
    if (!preloaderActive) {
      mountWaitScreenAfterPreload();
    }
  });

  window.addEventListener('load', () => {
    hookBootLifecycle();
    bindShellActions();
    observeBiosAndSetupAppearance();
  }, { once: true });
})();

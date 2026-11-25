// ============================================================
// MY-ARCHIVE 95 OS — Boot Lifecycle Controller & Fallback Wrappers
// ============================================================

(function () {
  window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
  window.__MOD_VERSIONS.bootController = 'v2026.11.25-split-controller';

  window.__ARCHIVE_LOGGED_IN = false;
  window.__ARCHIVE_GATE_DISMISSED = true;
  let __bootTriggeredOnce = false;

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
  }

  function runBootTarget() {
    if (typeof window.mountArchiveShell === 'function') {
      window.mountArchiveShell();
    }
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

  function enterBootAfterStartClick() {
    dismissPreClickStartScreen();
    __bootTriggeredOnce = true;
    runBootTarget();
  }

  window.__enterBootAfterStartClick = enterBootAfterStartClick;

  function hookBootLifecycle() {
    if (typeof window.startBiosBootSequence === 'function' && !window.__origStartBiosBootSequence) {
      window.__origStartBiosBootSequence = window.startBiosBootSequence;
      let allowDirectCall = false;

      window.startBiosBootSequence = function () {
        if (!window.__ARCHIVE_LOGGED_IN) {
          setPreLoginLock(true);
        }
        const overlay = document.getElementById('os-boot-overlay');
        if (overlay) overlay.style.display = 'flex';
        return window.__origStartBiosBootSequence.apply(this, arguments);
      };

      window.__runActualBiosSequence = function () {
        allowDirectCall = true;
        try {
          return window.__origStartBiosBootSequence.apply(window, arguments);
        } finally {
          allowDirectCall = false;
        }
      };
    }

    if (typeof window.finishDesktopLogin === 'function' && !window.finishDesktopLogin.__archiveHooked) {
      const origFinish = window.finishDesktopLogin;
      const wrappedFinish = function () {
        window.__ARCHIVE_LOGGED_IN = true;
        dismissPreClickStartScreen();
        const asciiBanner = document.getElementById('ascii-boot-banner');
        if (asciiBanner) asciiBanner.remove();
        const res = origFinish.apply(this, arguments);
        setPreLoginLock(false);
        return res;
      };
      wrappedFinish.__archiveHooked = true;
      window.finishDesktopLogin = wrappedFinish;
    }
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
    if (typeof window.mountArchiveShell === 'function') {
      window.mountArchiveShell();
    }
    setPreLoginLock(true);
    hookBootLifecycle();
    bindShellActions();

    if (typeof window.mountPreClickStartScreen === 'function') {
      window.mountPreClickStartScreen(() => {
        window.__ARCHIVE_GATE_DISMISSED = true;
        __bootTriggeredOnce = true;
        runBootTarget();
      });
    }

    if (!__bootTriggeredOnce && !window.__ARCHIVE_LOGGED_IN) {
      __bootTriggeredOnce = true;
      dismissPreClickStartScreen();
      setTimeout(() => {
        runBootTarget();
      }, 60);
    }
  });

  window.addEventListener('load', () => {
    hookBootLifecycle();
    bindShellActions();
    if (!__bootTriggeredOnce && !window.__ARCHIVE_LOGGED_IN) {
      __bootTriggeredOnce = true;
      dismissPreClickStartScreen();
      runBootTarget();
    }
  }, { once: true });
})();

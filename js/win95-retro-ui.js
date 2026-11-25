// ============================================================
// MY-ARCHIVE 95 OS — Authentic Windows 95 ComboBox & Popup Engine
// Replaces native OS <select> menus & provides Win95 modal dialogs
// ============================================================

(function () {
  if (window.__WIN95_RETRO_UI_LOADED) return;
  window.__WIN95_RETRO_UI_LOADED = true;

  let activePopupEl = null;
  let activeTriggerEl = null;
  let activeSelectEl = null;
  let highlightedIndex = -1;

  function injectWin95ComboStyles() {
    if (document.getElementById('w95-retro-ui-styles')) return;
    const style = document.createElement('style');
    style.id = 'w95-retro-ui-styles';
    style.textContent = `
      .w95-native-select-hidden {
        display: none !important;
      }
      .w95-combo {
        position: relative;
        display: inline-flex;
        align-items: stretch;
        min-width: 0;
        vertical-align: middle;
        box-sizing: border-box;
      }
      .w95-combo-btn {
        width: 100%;
        min-height: 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        padding: 2px 3px 2px 7px;
        background: #ffffff;
        color: #000000;
        border-top: 2px solid #808080;
        border-left: 2px solid #808080;
        border-right: 2px solid #ffffff;
        border-bottom: 2px solid #ffffff;
        box-shadow: inset 1px 1px 0 #000000, inset -1px -1px 0 #dfdfdf;
        font-family: 'Galmuri11', 'DungGeunMo', sans-serif;
        font-size: 0.78rem;
        font-weight: 700;
        text-align: left;
        cursor: pointer;
        box-sizing: border-box;
      }
      .w95-combo-btn:focus {
        outline: none;
      }
      .w95-combo-btn:focus .w95-combo-label {
        background: #000080;
        color: #ffffff;
      }
      .w95-combo-btn:disabled {
        background: #c0c0c0;
        color: #666666;
        cursor: not-allowed;
      }
      .w95-combo-label {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        padding: 1px 3px;
      }
      .w95-combo-arrow {
        flex-shrink: 0;
        width: 17px;
        height: 18px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: #c0c0c0;
        border-top: 1px solid #ffffff;
        border-left: 1px solid #ffffff;
        border-right: 1px solid #404040;
        border-bottom: 1px solid #404040;
        box-shadow: inset -1px -1px 0 #808080;
      }
      .w95-combo-btn.open .w95-combo-arrow {
        border-top: 1px solid #404040;
        border-left: 1px solid #404040;
        border-right: 1px solid #ffffff;
        border-bottom: 1px solid #ffffff;
        box-shadow: none;
        padding-top: 1px;
        padding-left: 1px;
      }
      .w95-combo-popup {
        position: fixed;
        z-index: 1000000;
        max-height: 220px;
        overflow-y: auto;
        background: #ffffff;
        color: #000000;
        border: 1px solid #000000;
        box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.45);
        font-family: 'Galmuri11', 'DungGeunMo', sans-serif;
        font-size: 0.78rem;
        font-weight: 700;
        box-sizing: border-box;
      }
      .w95-combo-option {
        padding: 4px 8px;
        cursor: pointer;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .w95-combo-option.highlighted,
      .w95-combo-option.selected {
        background: #000080;
        color: #ffffff;
      }
      .w95-combo-option.disabled {
        color: #808080;
        cursor: not-allowed;
      }
    `;
    document.head.appendChild(style);
  }

  function playWin95Click() {
    if (typeof window.playRetroTone === 'function') {
      try { window.playRetroTone('click'); } catch {}
    }
  }

  function styleBiosSelect(selectEl) {
    if (!selectEl || selectEl.dataset.biosStyled === 'true') return;
    selectEl.dataset.biosStyled = 'true';
    selectEl.style.display = 'inline-block';
    selectEl.style.backgroundColor = '#040826';
    selectEl.style.color = '#00ff88';
    selectEl.style.border = '1px solid #55aaff';
    selectEl.style.padding = '4px 8px';
    selectEl.style.fontFamily = "'Galmuri11', 'DungGeunMo', monospace";
    selectEl.style.fontSize = '0.84rem';
    selectEl.style.fontWeight = '700';
    selectEl.style.cursor = 'pointer';
  }

  function installSelectHooks() {
    const valDesc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
    if (valDesc && valDesc.set && valDesc.get && !valDesc.set.__w95Hooked) {
      const origSet = valDesc.set;
      const hookedSet = function (v) {
        origSet.call(this, v);
        if (typeof this.__w95Sync === 'function') this.__w95Sync();
      };
      hookedSet.__w95Hooked = true;
      Object.defineProperty(HTMLSelectElement.prototype, 'value', {
        get: valDesc.get,
        set: hookedSet,
        configurable: true
      });
    }

    const idxDesc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'selectedIndex');
    if (idxDesc && idxDesc.set && idxDesc.get && !idxDesc.set.__w95Hooked) {
      const origIdxSet = idxDesc.set;
      const hookedIdxSet = function (v) {
        origIdxSet.call(this, v);
        if (typeof this.__w95Sync === 'function') this.__w95Sync();
      };
      hookedIdxSet.__w95Hooked = true;
      Object.defineProperty(HTMLSelectElement.prototype, 'selectedIndex', {
        get: idxDesc.get,
        set: hookedIdxSet,
        configurable: true
      });
    }
  }

  function closeComboPopup() {
    if (activePopupEl) {
      activePopupEl.remove();
      activePopupEl = null;
    }
    if (activeTriggerEl) {
      activeTriggerEl.classList.remove('open');
      activeTriggerEl.setAttribute('aria-expanded', 'false');
      activeTriggerEl = null;
    }
    activeSelectEl = null;
    highlightedIndex = -1;
  }

  function openComboPopup(selectEl, triggerBtn) {
    if (activeSelectEl === selectEl) {
      closeComboPopup();
      return;
    }
    closeComboPopup();

    const options = Array.from(selectEl.options);
    if (!options.length) return;

    activeSelectEl = selectEl;
    activeTriggerEl = triggerBtn;
    triggerBtn.classList.add('open');
    triggerBtn.setAttribute('aria-expanded', 'true');

    const popup = document.createElement('div');
    popup.className = 'w95-combo-popup';
    popup.setAttribute('role', 'listbox');

    highlightedIndex = Math.max(0, selectEl.selectedIndex);

    options.forEach((opt, idx) => {
      const item = document.createElement('div');
      item.className = 'w95-combo-option';
      if (idx === selectEl.selectedIndex) item.classList.add('selected', 'highlighted');
      if (opt.disabled) item.classList.add('disabled');
      item.textContent = opt.textContent;
      item.dataset.idx = String(idx);

      item.addEventListener('mouseenter', () => {
        if (opt.disabled) return;
        popup.querySelectorAll('.w95-combo-option').forEach(el => el.classList.remove('highlighted'));
        item.classList.add('highlighted');
        highlightedIndex = idx;
      });

      item.addEventListener('mousedown', e => {
        e.preventDefault();
        e.stopPropagation();
        if (opt.disabled) return;
        selectComboOption(selectEl, idx);
      });

      popup.appendChild(item);
    });

    document.body.appendChild(popup);
    activePopupEl = popup;

    const rect = triggerBtn.getBoundingClientRect();
    const popRect = popup.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 6;
    const spaceAbove = rect.top - 6;

    popup.style.minWidth = `${Math.max(rect.width, 110)}px`;
    popup.style.left = `${Math.min(rect.left, window.innerWidth - Math.max(rect.width, popRect.width) - 6)}px`;

    if (spaceBelow < popRect.height && spaceAbove > spaceBelow) {
      popup.style.top = `${Math.max(4, rect.top - popRect.height)}px`;
    } else {
      popup.style.top = `${rect.bottom}px`;
    }

    const selItem = popup.querySelector('.w95-combo-option.selected');
    if (selItem) selItem.scrollIntoView({ block: 'nearest' });
  }

  function selectComboOption(selectEl, idx) {
    const changed = selectEl.selectedIndex !== idx;
    selectEl.selectedIndex = idx;
    if (typeof selectEl.__w95Sync === 'function') selectEl.__w95Sync();
    playWin95Click();
    closeComboPopup();

    if (changed) {
      selectEl.dispatchEvent(new Event('input', { bubbles: true }));
      selectEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function enhanceSelect(selectEl) {
    if (!selectEl || selectEl.dataset.w95Enhanced === 'true') return;
    if (selectEl.multiple || Number(selectEl.size) > 1) return;

    if (selectEl.closest('#bios-text-setup-overlay')) {
      styleBiosSelect(selectEl);
      return;
    }

    injectWin95ComboStyles();

    // 원본 <select>의 레이아웃 속성(flex, width)을 wrapper에 계승
    const computed = window.getComputedStyle(selectEl);
    const parentComputed = selectEl.parentElement ? window.getComputedStyle(selectEl.parentElement) : null;
    const isParentFlex = parentComputed && (parentComputed.display === 'flex' || parentComputed.display === 'inline-flex');

    selectEl.dataset.w95Enhanced = 'true';
    selectEl.classList.add('w95-native-select-hidden');
    selectEl.style.display = 'none';

    const wrapper = document.createElement('div');
    wrapper.className = 'w95-combo';
    if (selectEl.classList.contains('win95-logon-select') || selectEl.id === 'login-account-select') {
      wrapper.classList.add('w95-combo-logon');
      wrapper.style.flex = '1 1 auto';
      wrapper.style.width = '100%';
    } else if (selectEl.style.width === '100%' || computed.width === '100%') {
      wrapper.style.width = '100%';
    } else if (isParentFlex && (selectEl.style.flex || computed.flexGrow !== '0')) {
      wrapper.style.flex = selectEl.style.flex || '1 1 auto';
    }

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'w95-combo-btn';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    if (selectEl.disabled) trigger.disabled = true;

    const labelSpan = document.createElement('span');
    labelSpan.className = 'w95-combo-label';

    const arrowBox = document.createElement('span');
    arrowBox.className = 'w95-combo-arrow';
    arrowBox.setAttribute('aria-hidden', 'true');
    arrowBox.innerHTML = `
      <svg width="9" height="6" viewBox="0 0 9 6" shape-rendering="crispEdges">
        <rect x="1" y="1" width="7" height="1" fill="#000"/>
        <rect x="2" y="2" width="5" height="1" fill="#000"/>
        <rect x="3" y="3" width="3" height="1" fill="#000"/>
        <rect x="4" y="4" width="1" height="1" fill="#000"/>
      </svg>
    `;

    trigger.appendChild(labelSpan);
    trigger.appendChild(arrowBox);

    selectEl.parentNode.insertBefore(wrapper, selectEl);
    wrapper.appendChild(selectEl);
    wrapper.appendChild(trigger);

    const syncLabel = () => {
      const opt = selectEl.options[selectEl.selectedIndex] || selectEl.options[0];
      labelSpan.textContent = opt ? opt.textContent : '';
      trigger.disabled = Boolean(selectEl.disabled);
    };

    selectEl.__w95Sync = syncLabel;
    syncLabel();

    trigger.addEventListener('mousedown', e => {
      e.preventDefault();
      e.stopPropagation();
      if (selectEl.disabled) return;
      trigger.focus();
      openComboPopup(selectEl, trigger);
    });

    trigger.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!activePopupEl) {
          openComboPopup(selectEl, trigger);
        } else if (e.key === 'Enter') {
          if (highlightedIndex >= 0) selectComboOption(selectEl, highlightedIndex);
        } else {
          const opts = Array.from(selectEl.options);
          const dir = e.key === 'ArrowDown' ? 1 : -1;
          let next = highlightedIndex + dir;
          if (next < 0) next = opts.length - 1;
          if (next >= opts.length) next = 0;
          highlightedIndex = next;
          activePopupEl.querySelectorAll('.w95-combo-option').forEach((el, i) => {
            el.classList.toggle('highlighted', i === next);
          });
        }
      } else if (e.key === 'Escape') {
        closeComboPopup();
      }
    });

    selectEl.addEventListener('change', syncLabel);

    const optObserver = new MutationObserver(syncLabel);
    optObserver.observe(selectEl, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true
    });
  }

  function scanAllSelects(root = document) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('select').forEach(enhanceSelect);
  }

  const WIN95_DIALOG_ICONS = {
    info: `<svg width="32" height="32" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="4" y="1" width="8" height="14" fill="#000"/><rect x="2" y="3" width="12" height="10" fill="#000"/><rect x="4" y="2" width="8" height="12" fill="#fff"/><rect x="3" y="4" width="10" height="8" fill="#fff"/><rect x="7" y="4" width="2" height="2" fill="#000080"/><rect x="7" y="7" width="2" height="5" fill="#000080"/></svg>`,
    warn: `<svg width="32" height="32" viewBox="0 0 16 16" shape-rendering="crispEdges"><path fill="#000" d="M7 1h2v2h1v2h1v2h1v2h1v2h1v3H2v-3h1V9h1V7h1V5h1V3h1V1z"/><path fill="#ffff00" d="M7 3h2v2h1v2h1v2h1v2h1v2H3v-2h1V9h1V7h1V5h1V3z"/><rect x="7" y="5" width="2" height="5" fill="#000"/><rect x="7" y="11" width="2" height="2" fill="#000"/></svg>`,
    question: `<svg width="32" height="32" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="4" y="1" width="8" height="14" fill="#000"/><rect x="2" y="3" width="12" height="10" fill="#000"/><rect x="4" y="2" width="8" height="12" fill="#fff"/><rect x="3" y="4" width="10" height="8" fill="#fff"/><path fill="#000080" d="M6 4h4v1h1v2h-1v1H8v2H7V7h2V5H6V4zm1 7h2v2H7v-2z"/></svg>`,
    error: `<svg width="32" height="32" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="4" y="1" width="8" height="14" fill="#000"/><rect x="2" y="3" width="12" height="10" fill="#000"/><rect x="4" y="2" width="8" height="12" fill="#ff0000"/><rect x="3" y="4" width="10" height="8" fill="#ff0000"/><path fill="#fff" d="M5 5h2v2h2V5h2v2H9v2h2v2H9V9H7v2H5V9h2V7H5V5z"/></svg>`
  };

  function showWin95Popup({
    title = 'MY-ARCHIVE 95',
    message = '',
    icon = 'info',
    inputDefault = null,
    buttons = [{ label: '확인', value: true, primary: true }]
  } = {}) {
    return new Promise(resolve => {
      closeComboPopup();

      const overlay = document.createElement('div');
      overlay.className = 'w95-popup-overlay';

      const dlg = document.createElement('div');
      dlg.className = 'w95-popup-dialog';
      dlg.setAttribute('role', 'dialog');
      dlg.setAttribute('aria-modal', 'true');

      const iconSvg = WIN95_DIALOG_ICONS[icon] || WIN95_DIALOG_ICONS.info;
      const hasInput = inputDefault !== null && inputDefault !== undefined;

      dlg.innerHTML = `
        <div class="w95-popup-titlebar">
          <span>${String(title)}</span>
          <button type="button" class="win-ctrl-btn close" data-w95-close>X</button>
        </div>
        <div class="w95-popup-body">
          <div class="w95-popup-content">
            <div class="w95-popup-icon">${iconSvg}</div>
            <div class="w95-popup-text">
              <div class="w95-popup-msg"></div>
              ${hasInput ? `<input type="text" class="w95-popup-input" />` : ''}
            </div>
          </div>
          <div class="w95-popup-actions"></div>
        </div>
      `;

      const msgEl = dlg.querySelector('.w95-popup-msg');
      msgEl.textContent = String(message);

      const inputEl = dlg.querySelector('.w95-popup-input');
      if (inputEl) inputEl.value = String(inputDefault);

      const actionsEl = dlg.querySelector('.w95-popup-actions');
      const cleanup = result => {
        overlay.remove();
        resolve(result);
      };

      dlg.querySelector('[data-w95-close]')?.addEventListener('click', () => {
        playWin95Click();
        cleanup(hasInput ? null : false);
      });

      buttons.forEach((btnCfg, idx) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `win95-dlg-btn ${btnCfg.primary ? 'primary' : ''}`;
        b.textContent = btnCfg.label;
        b.addEventListener('click', () => {
          playWin95Click();
          if (hasInput) {
            cleanup(btnCfg.value ? (inputEl ? inputEl.value : '') : null);
          } else {
            cleanup(btnCfg.value);
          }
        });
        actionsEl.appendChild(b);
        if (idx === 0 && !inputEl) {
          setTimeout(() => b.focus(), 10);
        }
      });

      if (inputEl) {
        setTimeout(() => {
          inputEl.focus();
          inputEl.select();
        }, 10);
        inputEl.addEventListener('keydown', e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            playWin95Click();
            cleanup(inputEl.value);
          } else if (e.key === 'Escape') {
            e.preventDefault();
            cleanup(null);
          }
        });
      }

      overlay.appendChild(dlg);
      document.body.appendChild(overlay);
    });
  }

  window.showWin95Popup = showWin95Popup;
  window.win95Alert = (message, title = '알림 — MY-ARCHIVE 95', icon = 'info') =>
    showWin95Popup({ title, message, icon, buttons: [{ label: '확인', value: true, primary: true }] });
  window.win95Confirm = (message, title = '확인 — MY-ARCHIVE 95') =>
    showWin95Popup({
      title,
      message,
      icon: 'question',
      buttons: [
        { label: '예(Y)', value: true, primary: true },
        { label: '아니오(N)', value: false, primary: false }
      ]
    });
  window.win95Prompt = (message, defaultValue = '', title = '입력 — MY-ARCHIVE 95') =>
    showWin95Popup({
      title,
      message,
      icon: 'question',
      inputDefault: defaultValue,
      buttons: [
        { label: '확인', value: true, primary: true },
        { label: '취소', value: false, primary: false }
      ]
    });

  document.addEventListener('mousedown', e => {
    if (activePopupEl && !activePopupEl.contains(e.target) && (!activeTriggerEl || !activeTriggerEl.contains(e.target))) {
      closeComboPopup();
    }
  });
  window.addEventListener('resize', closeComboPopup);

  installSelectHooks();

  const init = () => {
    injectWin95ComboStyles();
    scanAllSelects(document);
    const domObserver = new MutationObserver(mutations => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType === 1) {
            if (node.tagName === 'SELECT') enhanceSelect(node);
            else if (node.querySelectorAll) scanAllSelects(node);
          }
        }
      }
    });
    domObserver.observe(document.body, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

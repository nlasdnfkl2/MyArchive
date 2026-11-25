/**
 * MY-ARCHIVE 95 OS — Main CRUD, Auth (4-Digit PIN), Metadata & Community Controller
 * File: archive-app.js
 */

(function (global) {
  'use strict';

  // ============================================================================
  // 1. SYSTEM CONFIGURATION & STATE
  // ============================================================================
  const CONFIG = {
    // 배포한 Google Apps Script 웹 앱 URL을 입력하세요. (미설정 시 로컬 스토리지 모드로 자동 동작)
    SCRIPT_URL: 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL',
    STORAGE_KEYS: {
      SESSION: 'myarchive95_session_v2',
      ITEMS: 'myarchive95_items_v2',
      USERS: 'myarchive95_users_v2',
      LIKED: 'myarchive95_liked_v2'
    },
    CATEGORIES: {
      book: { label: '도서', code: 'BOOK', color: '#000080' },
      music: { label: '음악', code: 'AUDIO', color: '#008080' },
      video: { label: '영상', code: 'VIDEO', color: '#800000' },
      etc: { label: '기타', code: 'MISC', color: '#404040' }
    }
  };

  const State = {
    currentUser: null,        // { userId, nickname }
    items: [],                // 전체 아카이브 레코드 배열
    filteredItems: [],        // 개인 아카이브 필터링 결과
    activeCategory: 'all',    // 'all' | 'book' | 'music' | 'video' | 'etc'
    communityCategory: 'all', // COMMUNITY95.EXE 카테고리 필터
    searchQuery: '',
    communityQuery: '',
    sortBy: 'newest',         // 'newest' | 'oldest' | 'rating'
    editingId: null,          // 수정 중인 레코드 ID (null이면 신규 등록)
    isSyncing: false,
    likedIds: new Set()
  };

  // ============================================================================
  // 2. DOM UTILITIES & WINDOW HELPERS
  // ============================================================================
  function $id(id) {
    return document.getElementById(id);
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(isoStr) {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return String(isoStr).slice(0, 10);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  }

  function renderStars(rating) {
    const score = Math.max(0, Math.min(5, Number(rating) || 0));
    return '★'.repeat(score) + '☆'.repeat(5 - score);
  }

  function setStatus(message, isError = false) {
    const statusEl = $id('archive-status-text') || $id('os-status-text');
    if (statusEl) {
      statusEl.textContent = isError ? `[ERR] ${message}` : `[SYS] ${message}`;
      statusEl.style.color = isError ? '#a80000' : '';
    }
  }

  function bringWindowToFront(winEl) {
    if (!winEl) return;
    if (global.OSCore && typeof global.OSCore.focusWindow === 'function' && winEl.id) {
      global.OSCore.focusWindow(winEl.id);
      return;
    }
    let maxZ = 100;
    document.querySelectorAll('.os-window, .win95-window').forEach((el) => {
      const z = parseInt(window.getComputedStyle(el).zIndex, 10);
      if (!Number.isNaN(z) && z > maxZ) maxZ = z;
    });
    winEl.style.zIndex = String(maxZ + 1);
  }

  function openModalWindow(winId) {
    const win = $id(winId);
    if (!win) return;
    win.classList.remove('hidden', 'minimized');
    if (win.style.display === 'none' || !win.style.display) {
      win.style.display = 'flex';
    }
    bringWindowToFront(win);
  }

  function closeModalWindow(winId) {
    const win = $id(winId);
    if (!win) return;
    win.classList.add('hidden');
    win.style.display = 'none';
  }

  function isGasConfigured() {
    return (
      typeof CONFIG.SCRIPT_URL === 'string' &&
      CONFIG.SCRIPT_URL.startsWith('https://script.google.com/')
    );
  }

  // ============================================================================
  // 3. GOOGLE APPS SCRIPT (GAS) & LOCAL STORAGE SYNC ENGINE
  // ============================================================================
  async function apiRequest(payload) {
    if (!isGasConfigured()) {
      return localApiFallback(payload);
    }

    State.isSyncing = true;
    setStatus('서버와 데이터를 동기화하는 중...');

    try {
      const response = await fetch(CONFIG.SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data && data.status === 'error') {
        throw new Error(data.message || '서버 처리 오류');
      }

      setStatus('동기화 완료');
      return data;
    } catch (err) {
      console.error('[ArchiveApp] GAS Sync Error:', err);
      setStatus(`통신 오류 (${err.message}) - 로컬 캐시로 전환`, true);
      return localApiFallback(payload);
    } finally {
      State.isSyncing = false;
    }
  }

  function getSeedItems() {
    return [
      {
        id: 'seed-101',
        userId: 'sysop',
        nickname: 'SYSOP_95',
        category: 'book',
        title: '도서관의 삶, 책들의 운명',
        creator: '알베르토 망겔',
        year: '2020',
        rating: 5,
        coverUrl: '',
        review: '인류가 지식을 분류하고 보존해 온 역사를 개인의 서재와 도서관 공간의 기억으로 풀어낸 기록. 정보 조직의 본질을 다시 생각하게 만든다.',
        isShared: true,
        likes: 4,
        createdAt: '2026-11-18T14:20:00.000Z',
        updatedAt: '2026-11-18T14:20:00.000Z'
      },
      {
        id: 'seed-102',
        userId: 'sysop',
        nickname: 'SYSOP_95',
        category: 'music',
        title: 'Selected Ambient Works 85-92',
        creator: 'Aphex Twin',
        year: '1992',
        rating: 5,
        coverUrl: '',
        review: '차갑고 미니멀한 아날로그 신시사이저 질감 속에 묘한 향수가 배어 있는 앰비언트 테크노의 기준점.',
        isShared: true,
        likes: 7,
        createdAt: '2026-11-20T09:15:00.000Z',
        updatedAt: '2026-11-20T09:15:00.000Z'
      }
    ];
  }

  function localApiFallback(payload) {
    const users = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USERS) || '[]');
    let items = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.ITEMS) || 'null');
    if (!Array.isArray(items)) {
      items = getSeedItems();
      localStorage.setItem(CONFIG.STORAGE_KEYS.ITEMS, JSON.stringify(items));
    }

    switch (payload.action) {
      case 'register': {
        const exists = users.some(
          (u) => u.userId.toLowerCase() === payload.userId.toLowerCase()
        );
        if (exists) {
          return { status: 'error', message: '이미 사용 중인 사용자 ID입니다.' };
        }
        const newUser = {
          userId: payload.userId,
          nickname: payload.nickname,
          pin: payload.pin,
          createdAt: new Date().toISOString()
        };
        users.push(newUser);
        localStorage.setItem(CONFIG.STORAGE_KEYS.USERS, JSON.stringify(users));
        return {
          status: 'success',
          user: { userId: newUser.userId, nickname: newUser.nickname }
        };
      }

      case 'login': {
        if (payload.userId === 'guest' && payload.pin === '0000') {
          return {
            status: 'success',
            user: { userId: 'guest', nickname: 'GUEST_95' }
          };
        }
        const found = users.find(
          (u) => u.userId.toLowerCase() === payload.userId.toLowerCase()
        );
        if (!found) {
          return { status: 'error', message: '존재하지 않는 사용자 ID입니다.' };
        }
        if (String(found.pin) !== String(payload.pin)) {
          return { status: 'error', message: '4자리 PIN 번호가 일치하지 않습니다.' };
        }
        return {
          status: 'success',
          user: { userId: found.userId, nickname: found.nickname }
        };
      }

      case 'getAll': {
        return { status: 'success', items };
      }

      case 'create': {
        const record = {
          ...payload.item,
          id: payload.item.id || `rec-${Date.now()}`,
          likes: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        items.unshift(record);
        localStorage.setItem(CONFIG.STORAGE_KEYS.ITEMS, JSON.stringify(items));
        return { status: 'success', item: record, items };
      }

      case 'update': {
        const idx = items.findIndex((it) => String(it.id) === String(payload.item.id));
        if (idx === -1) {
          return { status: 'error', message: '수정할 기록을 찾을 수 없습니다.' };
        }
        items[idx] = {
          ...items[idx],
          ...payload.item,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem(CONFIG.STORAGE_KEYS.ITEMS, JSON.stringify(items));
        return { status: 'success', item: items[idx], items };
      }

      case 'delete': {
        const nextItems = items.filter((it) => String(it.id) !== String(payload.id));
        localStorage.setItem(CONFIG.STORAGE_KEYS.ITEMS, JSON.stringify(nextItems));
        return { status: 'success', items: nextItems };
      }

      case 'like': {
        const target = items.find((it) => String(it.id) === String(payload.id));
        if (target) {
          target.likes = (Number(target.likes) || 0) + (payload.delta || 1);
          localStorage.setItem(CONFIG.STORAGE_KEYS.ITEMS, JSON.stringify(items));
        }
        return { status: 'success', items };
      }

      default:
        return { status: 'success', items };
    }
  }

  // ============================================================================
  // 4. 4-DIGIT PIN USER AUTHENTICATION & REGISTRATION WINDOW CONTROLLER
  // ============================================================================
  function resetAuthMessages() {
    const loginErr = $id('login-error-msg');
    const regErr = $id('register-error-msg');
    if (loginErr) {
      loginErr.textContent = '';
      loginErr.style.display = 'none';
    }
    if (regErr) {
      regErr.textContent = '';
      regErr.style.display = 'none';
    }
  }

  function showAuthError(elementId, message) {
    const el = $id(elementId);
    if (el) {
      el.textContent = message;
      el.style.display = 'block';
    } else {
      alert(message);
    }
  }

  function openLoginModal() {
    resetAuthMessages();
    const form = $id('login-form');
    if (form) form.reset();
    closeModalWindow('win-register');
    openModalWindow('win-login');
    const idInput = $id('login-userid');
    if (idInput) setTimeout(() => idInput.focus(), 30);
  }

  function openRegisterModal(e) {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
      e.stopPropagation();
    }
    resetAuthMessages();

    // 등록 창 열기 전 모든 입력값 및 버튼 상태 완전 초기화 (창 재오픈 버그 방지)
    const regForm = $id('register-form');
    if (regForm) regForm.reset();

    const submitBtn = $id('register-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '계정 생성';
    }

    openModalWindow('win-register');
    const idInput = $id('reg-userid');
    if (idInput) setTimeout(() => idInput.focus(), 30);
  }

  function closeRegisterModal(e) {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
      e.stopPropagation();
    }
    resetAuthMessages();
    closeModalWindow('win-register');
  }

  function validatePinFormat(pin) {
    return /^\d{4}$/.test(String(pin || '').trim());
  }

  async function handleRegister(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    resetAuthMessages();

    const userId = ($id('reg-userid')?.value || '').trim();
    const nickname = ($id('reg-nickname')?.value || '').trim();
    const pin = ($id('reg-pin')?.value || '').trim();
    const pinConfirm = ($id('reg-pin-confirm')?.value || '').trim();

    if (!userId || userId.length < 2 || userId.length > 20) {
      showAuthError('register-error-msg', '아이디는 2~20자 사이로 입력하세요.');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(userId)) {
      showAuthError('register-error-msg', '아이디는 영문, 숫자, 밑줄(_), 하이픈(-)만 사용할 수 있습니다.');
      return;
    }
    if (!nickname || nickname.length < 1 || nickname.length > 16) {
      showAuthError('register-error-msg', '표시 닉네임을 1~16자 이내로 입력하세요.');
      return;
    }
    if (!validatePinFormat(pin)) {
      showAuthError('register-error-msg', '보안 PIN은 반드시 숫자 4자리여야 합니다.');
      return;
    }
    if (pinConfirm && pin !== pinConfirm) {
      showAuthError('register-error-msg', '확인용 4자리 PIN 번호가 일치하지 않습니다.');
      return;
    }

    const submitBtn = $id('register-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '처리 중...';
    }

    try {
      const res = await apiRequest({
        action: 'register',
        userId,
        nickname,
        pin
      });

      if (res.status !== 'success') {
        showAuthError('register-error-msg', res.message || '회원가입에 실패했습니다.');
        return;
      }

      State.currentUser = res.user;
      localStorage.setItem(CONFIG.STORAGE_KEYS.SESSION, JSON.stringify(res.user));
      closeRegisterModal();
      closeModalWindow('win-login');
      updateAuthUI();
      setStatus(`${res.user.nickname} (${res.user.userId}) 계정으로 로그인되었습니다.`);
      await refreshAllData();
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '계정 생성';
      }
    }
  }

  async function handleLogin(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    resetAuthMessages();

    const userId = ($id('login-userid')?.value || '').trim();
    const pin = ($id('login-pin')?.value || '').trim();

    if (!userId) {
      showAuthError('login-error-msg', '사용자 ID를 입력하세요.');
      return;
    }
    if (!validatePinFormat(pin)) {
      showAuthError('login-error-msg', '4자리 숫자 PIN을 입력하세요.');
      return;
    }

    const res = await apiRequest({
      action: 'login',
      userId,
      pin
    });

    if (res.status !== 'success') {
      showAuthError('login-error-msg', res.message || '로그인에 실패했습니다.');
      return;
    }

    State.currentUser = res.user;
    localStorage.setItem(CONFIG.STORAGE_KEYS.SESSION, JSON.stringify(res.user));
    closeModalWindow('win-login');
    updateAuthUI();
    setStatus(`${res.user.nickname}님 환영합니다.`);
    await refreshAllData();
  }

  function handleLogout() {
    State.currentUser = null;
    localStorage.removeItem(CONFIG.STORAGE_KEYS.SESSION);
    updateAuthUI();
    renderPersonalArchive();
    setStatus('로그아웃되었습니다.');
  }

  function restoreSession() {
    try {
      const saved = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.SESSION) || 'null');
      if (saved && saved.userId) {
        State.currentUser = saved;
      }
      const liked = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.LIKED) || '[]');
      if (Array.isArray(liked)) {
        State.likedIds = new Set(liked.map(String));
      }
    } catch (e) {
      console.warn('[ArchiveApp] Session restore warning:', e);
    }
    updateAuthUI();
  }

  function updateAuthUI() {
    const userBadge = $id('current-user-badge');
    const loginBtn = $id('btn-open-login');
    const logoutBtn = $id('btn-logout');
    const addBtn = $id('btn-new-record');

    if (State.currentUser) {
      if (userBadge) {
        userBadge.textContent = `${State.currentUser.nickname} (@${State.currentUser.userId})`;
      }
      if (loginBtn) loginBtn.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'inline-block';
      if (addBtn) addBtn.disabled = false;
    } else {
      if (userBadge) {
        userBadge.textContent = '비로그인 (게스트 열람 모드)';
      }
      if (loginBtn) loginBtn.style.display = 'inline-block';
      if (logoutBtn) logoutBtn.style.display = 'none';
    }
  }

  // ============================================================================
  // 5. EXTERNAL METADATA AUTO-FETCH (BOOKS / MUSIC / VIDEO)
  // ============================================================================
  async function searchMetadata() {
    const category = $id('record-category')?.value || 'book';
    const query = ($id('meta-search-input')?.value || $id('record-title')?.value || '').trim();
    const resultsContainer = $id('meta-search-results');

    if (!query) {
      setStatus('검색할 작품명 또는 아티스트를 입력하세요.', true);
      return;
    }

    if (resultsContainer) {
      resultsContainer.innerHTML = '<div class="meta-loading">외부 데이터베이스 검색 중...</div>';
      resultsContainer.style.display = 'block';
    }

    try {
      let candidates = [];

      if (category === 'book') {
        const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=6`;
        const res = await fetch(url);
        const data = await res.json();
        candidates = (data.items || []).map((item) => {
          const info = item.volumeInfo || {};
          const thumb = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || '';
          return {
            title: info.title || '',
            creator: Array.isArray(info.authors) ? info.authors.join(', ') : '저자 미상',
            year: (info.publishedDate || '').slice(0, 4),
            coverUrl: thumb.replace(/^http:\/\//i, 'https://'),
            summary: info.description || ''
          };
        });
      } else if (category === 'music') {
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=album&limit=6&country=KR`;
        const res = await fetch(url);
        const data = await res.json();
        candidates = (data.results || []).map((item) => ({
          title: item.collectionName || item.trackName || '',
          creator: item.artistName || '아티스트 미상',
          year: (item.releaseDate || '').slice(0, 4),
          coverUrl: (item.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
          summary: item.primaryGenreName ? `장르: ${item.primaryGenreName}` : ''
        }));
      } else if (category === 'video') {
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=movie&limit=6&country=KR`;
        const res = await fetch(url);
        const data = await res.json();
        candidates = (data.results || []).map((item) => ({
          title: item.trackName || item.collectionName || '',
          creator: item.artistName || '감독 미상',
          year: (item.releaseDate || '').slice(0, 4),
          coverUrl: (item.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
          summary: item.longDescription || item.shortDescription || ''
        }));
      } else {
        setStatus('기타 카테고리는 수동 입력을 지원합니다.');
        if (resultsContainer) resultsContainer.style.display = 'none';
        return;
      }

      renderMetadataCandidates(candidates);
    } catch (err) {
      console.error('[ArchiveApp] Metadata fetch error:', err);
      if (resultsContainer) {
        resultsContainer.innerHTML = `<div class="meta-error">메타데이터 조회 실패: ${escapeHtml(err.message)}</div>`;
      }
    }
  }

  function renderMetadataCandidates(candidates) {
    const container = $id('meta-search-results');
    if (!container) return;

    if (!candidates.length) {
      container.innerHTML = '<div class="meta-empty">일치하는 검색 결과가 없습니다.</div>';
      return;
    }

    container.innerHTML = '';
    candidates.forEach((cand) => {
      const row = document.createElement('div');
      row.className = 'meta-result-item';
      row.innerHTML = `
        <div class="meta-thumb">
          ${cand.coverUrl ? `<img src="${escapeHtml(cand.coverUrl)}" alt="">` : '<span>NO IMG</span>'}
        </div>
        <div class="meta-info">
          <strong>${escapeHtml(cand.title)}</strong>
          <div>${escapeHtml(cand.creator)} ${cand.year ? `(${escapeHtml(cand.year)})` : ''}</div>
        </div>
        <button type="button" class="win95-btn btn-sm">적용</button>
      `;

      row.querySelector('button').addEventListener('click', () => {
        if ($id('record-title')) $id('record-title').value = cand.title;
        if ($id('record-creator')) $id('record-creator').value = cand.creator;
        if ($id('record-year')) $id('record-year').value = cand.year;
        if ($id('record-cover')) $id('record-cover').value = cand.coverUrl;
        const reviewEl = $id('record-review');
        if (reviewEl && !reviewEl.value.trim() && cand.summary) {
          reviewEl.value = cand.summary.slice(0, 300);
        }
        container.style.display = 'none';
        setStatus(`"${cand.title}" 메타데이터가 입력되었습니다.`);
      });

      container.appendChild(row);
    });
  }

  // ============================================================================
  // 6. ARCHIVE CRUD OPERATIONS (CREATE / READ / UPDATE / DELETE)
  // ============================================================================
  async function refreshAllData() {
    const res = await apiRequest({ action: 'getAll' });
    if (res && Array.isArray(res.items)) {
      State.items = res.items.map(normalizeRecord);
    }
    renderPersonalArchive();
    renderCommunityFeed();
    renderStatsAndNodes();
  }

  function normalizeRecord(raw) {
    return {
      id: String(raw.id || ''),
      userId: String(raw.userId || 'unknown'),
      nickname: String(raw.nickname || raw.userId || '익명'),
      category: CONFIG.CATEGORIES[raw.category] ? raw.category : 'etc',
      title: String(raw.title || '제목 없음'),
      creator: String(raw.creator || ''),
      year: String(raw.year || ''),
      rating: Math.max(1, Math.min(5, Number(raw.rating) || 5)),
      coverUrl: String(raw.coverUrl || ''),
      review: String(raw.review || ''),
      isShared: raw.isShared === true || String(raw.isShared).toUpperCase() === 'TRUE' || raw.isShared === 1,
      likes: Number(raw.likes) || 0,
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString()
    };
  }

  function openRecordEditor(recordId = null) {
    if (!State.currentUser) {
      setStatus('기록을 작성하거나 수정하려면 먼저 로그인하세요.', true);
      openLoginModal();
      return;
    }

    const form = $id('record-form');
    if (form) form.reset();
    const metaBox = $id('meta-search-results');
    if (metaBox) metaBox.style.display = 'none';

    const titleHeader = $id('editor-window-title');

    if (recordId) {
      const target = State.items.find((it) => String(it.id) === String(recordId));
      if (!target) {
        setStatus('대상 기록을 찾을 수 없습니다.', true);
        return;
      }
      if (target.userId !== State.currentUser.userId) {
        setStatus('본인이 작성한 기록만 수정할 수 있습니다.', true);
        return;
      }

      State.editingId = target.id;
      if (titleHeader) titleHeader.textContent = `RECORD_EDIT.EXE - [${target.title}]`;
      if ($id('record-category')) $id('record-category').value = target.category;
      if ($id('record-title')) $id('record-title').value = target.title;
      if ($id('record-creator')) $id('record-creator').value = target.creator;
      if ($id('record-year')) $id('record-year').value = target.year;
      if ($id('record-rating')) $id('record-rating').value = String(target.rating);
      if ($id('record-cover')) $id('record-cover').value = target.coverUrl;
      if ($id('record-review')) $id('record-review').value = target.review;
      if ($id('record-shared')) $id('record-shared').checked = Boolean(target.isShared);
    } else {
      State.editingId = null;
      if (titleHeader) titleHeader.textContent = 'NEW_ARCHIVE_ENTRY.EXE';
      if ($id('record-rating')) $id('record-rating').value = '5';
      if ($id('record-shared')) $id('record-shared').checked = true;
    }

    openModalWindow('win-record-editor');
  }

  async function saveArchiveItem(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();

    if (!State.currentUser) {
      openLoginModal();
      return;
    }

    const category = $id('record-category')?.value || 'book';
    const title = ($id('record-title')?.value || '').trim();
    const creator = ($id('record-creator')?.value || '').trim();
    const year = ($id('record-year')?.value || '').trim();
    const rating = Number($id('record-rating')?.value || 5);
    const coverUrl = ($id('record-cover')?.value || '').trim();
    const review = ($id('record-review')?.value || '').trim();
    const isShared = Boolean($id('record-shared')?.checked);

    if (!title) {
      setStatus('작품 제목은 필수 입력 항목입니다.', true);
      $id('record-title')?.focus();
      return;
    }

    const itemPayload = {
      id: State.editingId || undefined,
      userId: State.currentUser.userId,
      nickname: State.currentUser.nickname,
      category,
      title,
      creator,
      year,
      rating,
      coverUrl,
      review,
      isShared
    };

    const action = State.editingId ? 'update' : 'create';
    const res = await apiRequest({
      action,
      userId: State.currentUser.userId,
      item: itemPayload
    });

    if (res.status !== 'success') {
      setStatus(res.message || '저장에 실패했습니다.', true);
      return;
    }

    State.editingId = null;
    closeModalWindow('win-record-editor');
    await refreshAllData();
    setStatus(`"${title}" 기록이 저장되었습니다.`);
  }

  async function deleteArchiveItem(recordId) {
    if (!State.currentUser) {
      openLoginModal();
      return;
    }

    const target = State.items.find((it) => String(it.id) === String(recordId));
    if (!target) return;

    if (target.userId !== State.currentUser.userId) {
      setStatus('본인이 작성한 기록만 삭제할 수 있습니다.', true);
      return;
    }

    const confirmed = window.confirm(`[경고] "${target.title}" 기록을 영구 삭제하시겠습니까?`);
    if (!confirmed) return;

    const res = await apiRequest({
      action: 'delete',
      id: recordId,
      userId: State.currentUser.userId
    });

    if (res.status !== 'success') {
      setStatus(res.message || '삭제 중 오류가 발생했습니다.', true);
      return;
    }

    await refreshAllData();
    setStatus('기록이 삭제되었습니다.');
  }

  // ============================================================================
  // 7. PERSONAL ARCHIVE RENDERER & DETAIL VIEWER
  // ============================================================================
  function getVisiblePersonalItems() {
    let list = [...State.items];

    // 로그인 시 본인 기록 우선 필터링 (비로그인 시 공개 샘플 표시)
    if (State.currentUser) {
      list = list.filter((it) => it.userId === State.currentUser.userId);
    } else {
      list = list.filter((it) => it.isShared);
    }

    if (State.activeCategory !== 'all') {
      list = list.filter((it) => it.category === State.activeCategory);
    }

    if (State.searchQuery) {
      const q = State.searchQuery.toLowerCase();
      list = list.filter(
        (it) =>
          it.title.toLowerCase().includes(q) ||
          it.creator.toLowerCase().includes(q) ||
          it.review.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (State.sortBy === 'rating') return b.rating - a.rating;
      if (State.sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    State.filteredItems = list;
    return list;
  }

  function renderPersonalArchive() {
    const container = $id('archive-list-container') || $id('archive-grid');
    if (!container) return;

    const items = getVisiblePersonalItems();
    const countEl = $id('archive-total-count');
    if (countEl) countEl.textContent = `${items.length}개 항목`;

    if (!items.length) {
      container.innerHTML = `
        <div class="empty-state-box">
          <p>표시할 아카이브 기록이 없습니다.</p>
          <p>${State.currentUser ? '[새 기록 작성] 버튼을 눌러 첫 번째 감상 데이터를 추가하세요.' : '로그인하면 나만의 문화 감상 데이터베이스를 관리할 수 있습니다.'}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    items.forEach((item) => {
      const cat = CONFIG.CATEGORIES[item.category] || CONFIG.CATEGORIES.etc;
      const isOwner = State.currentUser && State.currentUser.userId === item.userId;

      const card = document.createElement('article');
      card.className = 'archive-card win95-panel';
      card.innerHTML = `
        <div class="archive-card-header" style="border-left: 4px solid ${cat.color};">
          <span class="cat-badge">[${cat.code}] ${cat.label}</span>
          <span class="share-badge">${item.isShared ? 'PUBLIC' : 'PRIVATE'}</span>
        </div>
        <div class="archive-card-body">
          ${
            item.coverUrl
              ? `<div class="archive-cover"><img src="${escapeHtml(item.coverUrl)}" alt="${escapeHtml(item.title)}" loading="lazy"></div>`
              : `<div class="archive-cover no-cover"><span>${cat.code}</span></div>`
          }
          <div class="archive-meta">
            <h3 class="archive-title">${escapeHtml(item.title)}</h3>
            <div class="archive-creator">${escapeHtml(item.creator || '작자 미상')} ${item.year ? `· ${escapeHtml(item.year)}` : ''}</div>
            <div class="archive-rating" aria-label="평점 ${item.rating}점">${renderStars(item.rating)}</div>
            <p class="archive-excerpt">${escapeHtml(item.review || '작성된 감상평이 없습니다.')}</p>
          </div>
        </div>
        <div class="archive-card-footer">
          <span class="archive-date">${formatDate(item.createdAt)}</span>
          <div class="archive-actions">
            <button type="button" class="win95-btn btn-view">전문 보기</button>
            ${
              isOwner
                ? `<button type="button" class="win95-btn btn-edit">수정</button>
                   <button type="button" class="win95-btn btn-del">삭제</button>`
                : ''
            }
          </div>
        </div>
      `;

      card.querySelector('.btn-view').addEventListener('click', () => openDetailViewer(item.id));
      if (isOwner) {
        card.querySelector('.btn-edit').addEventListener('click', () => openRecordEditor(item.id));
        card.querySelector('.btn-del').addEventListener('click', () => deleteArchiveItem(item.id));
      }

      container.appendChild(card);
    });
  }

  function openDetailViewer(recordId) {
    const item = State.items.find((it) => String(it.id) === String(recordId));
    if (!item) return;

    const cat = CONFIG.CATEGORIES[item.category] || CONFIG.CATEGORIES.etc;
    const bodyEl = $id('detail-viewer-body');
    const titleEl = $id('detail-viewer-title');

    if (titleEl) {
      titleEl.textContent = `VIEWER.EXE - ${item.title}`;
    }

    if (bodyEl) {
      bodyEl.innerHTML = `
        <div class="detail-header-block">
          <div class="detail-badges">
            <span class="cat-badge">[${cat.code}] ${cat.label}</span>
            <span class="author-badge">작성자: ${escapeHtml(item.nickname)} (@${escapeHtml(item.userId)})</span>
            <span class="date-badge">${formatDate(item.createdAt)}</span>
          </div>
          <h2>${escapeHtml(item.title)}</h2>
          <p class="detail-sub">${escapeHtml(item.creator || '작자 미상')} ${item.year ? `(${escapeHtml(item.year)})` : ''} | 평점: ${renderStars(item.rating)}</p>
        </div>
        ${
          item.coverUrl
            ? `<div class="detail-cover-wrap"><img src="${escapeHtml(item.coverUrl)}" alt="${escapeHtml(item.title)}"></div>`
            : ''
        }
        <div class="detail-fulltext-box" style="white-space: pre-wrap; word-break: break-word;">${escapeHtml(item.review || '작성된 본문이 없습니다.')}</div>
      `;
    }

    openModalWindow('win-detail-viewer');
  }

  // ============================================================================
  // 8. COMMUNITY95.EXE — FULL-TEXT SOCIAL FEED CONTROLLER
  // ============================================================================
  function renderCommunityFeed() {
    const feedEl = $id('community-feed-list') || $id('community95-feed');
    if (!feedEl) return;

    let sharedItems = State.items.filter((it) => it.isShared);

    if (State.communityCategory !== 'all') {
      sharedItems = sharedItems.filter((it) => it.category === State.communityCategory);
    }

    if (State.communityQuery) {
      const q = State.communityQuery.toLowerCase();
      sharedItems = sharedItems.filter(
        (it) =>
          it.title.toLowerCase().includes(q) ||
          it.creator.toLowerCase().includes(q) ||
          it.nickname.toLowerCase().includes(q) ||
          it.review.toLowerCase().includes(q)
      );
    }

    sharedItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const counterEl = $id('community-post-count');
    if (counterEl) counterEl.textContent = `전체 공유 게시물 ${sharedItems.length}건`;

    if (!sharedItems.length) {
      feedEl.innerHTML = `
        <div class="empty-state-box">
          <p>공유된 커뮤니티 피드가 없습니다.</p>
          <p>기록 작성 시 [COMMUNITY95.EXE 전체 공개]를 체크하면 이곳에 전문이 공유됩니다.</p>
        </div>
      `;
      return;
    }

    feedEl.innerHTML = '';
    sharedItems.forEach((item) => {
      const cat = CONFIG.CATEGORIES[item.category] || CONFIG.CATEGORIES.etc;
      const isLiked = State.likedIds.has(String(item.id));

      const post = document.createElement('article');
      post.className = 'community-post-card win95-panel';
      post.innerHTML = `
        <div class="comm-post-top">
          <div class="comm-author-group">
            <span class="comm-avatar">[${escapeHtml(item.nickname.slice(0, 2).toUpperCase())}]</span>
            <div>
              <strong>${escapeHtml(item.nickname)}</strong>
              <span class="comm-userid">@${escapeHtml(item.userId)}</span>
            </div>
          </div>
          <div class="comm-meta-right">
            <span class="cat-badge">[${cat.code}] ${cat.label}</span>
            <span class="comm-time">${formatDate(item.createdAt)}</span>
          </div>
        </div>

        <div class="comm-work-banner">
          ${
            item.coverUrl
              ? `<img class="comm-thumb" src="${escapeHtml(item.coverUrl)}" alt="" loading="lazy">`
              : ''
          }
          <div>
            <h4 class="comm-work-title">${escapeHtml(item.title)}</h4>
            <div class="comm-work-sub">${escapeHtml(item.creator || '작자 미상')} ${item.year ? `(${escapeHtml(item.year)})` : ''} · ${renderStars(item.rating)}</div>
          </div>
        </div>

        <div class="comm-fulltext-body" style="white-space: pre-wrap; word-break: break-word;">${escapeHtml(item.review || '(본문 내용 없음)')}</div>

        <div class="comm-post-actions">
          <button type="button" class="win95-btn btn-like ${isLiked ? 'active' : ''}">
            ${isLiked ? '■ 공감됨' : '□ 공감'} (${Number(item.likes) || 0})
          </button>
          <button type="button" class="win95-btn btn-open-full">단독 창으로 읽기</button>
        </div>
      `;

      post.querySelector('.btn-like').addEventListener('click', () => toggleCommunityLike(item.id));
      post.querySelector('.btn-open-full').addEventListener('click', () => openDetailViewer(item.id));

      feedEl.appendChild(post);
    });
  }

  async function toggleCommunityLike(recordId) {
    const idStr = String(recordId);
    const alreadyLiked = State.likedIds.has(idStr);
    const delta = alreadyLiked ? -1 : 1;

    if (alreadyLiked) {
      State.likedIds.delete(idStr);
    } else {
      State.likedIds.add(idStr);
    }
    localStorage.setItem(CONFIG.STORAGE_KEYS.LIKED, JSON.stringify([...State.likedIds]));

    const target = State.items.find((it) => String(it.id) === idStr);
    if (target) {
      target.likes = Math.max(0, (Number(target.likes) || 0) + delta);
    }
    renderCommunityFeed();

    await apiRequest({
      action: 'like',
      id: recordId,
      delta
    });
  }

  // ============================================================================
  // 9. STATISTICS & DATA NODE VISUALIZATION (STATS95.EXE)
  // ============================================================================
  function renderStatsAndNodes() {
    const sourceItems = State.currentUser
      ? State.items.filter((it) => it.userId === State.currentUser.userId)
      : State.items;

    // 1) 요약 수치 업데이트
    const totalEl = $id('stat-total-items');
    const avgEl = $id('stat-avg-rating');
    const sharedEl = $id('stat-shared-count');

    if (totalEl) totalEl.textContent = String(sourceItems.length);
    if (avgEl) {
      const avg = sourceItems.length
        ? (sourceItems.reduce((acc, cur) => acc + cur.rating, 0) / sourceItems.length).toFixed(2)
        : '0.00';
      avgEl.textContent = `${avg} / 5.0`;
    }
    if (sharedEl) {
      const sharedCount = sourceItems.filter((it) => it.isShared).length;
      sharedEl.textContent = `${sharedCount}건`;
    }

    // 2) 카테고리 분포 바 차트
    const barContainer = $id('stat-category-bars');
    if (barContainer) {
      const total = Math.max(1, sourceItems.length);
      barContainer.innerHTML = Object.entries(CONFIG.CATEGORIES)
        .map(([key, meta]) => {
          const count = sourceItems.filter((it) => it.category === key).length;
          const pct = Math.round((count / total) * 100);
          return `
            <div class="stat-bar-row">
              <span class="stat-bar-label">[${meta.code}] ${meta.label}</span>
              <div class="stat-bar-track">
                <div class="stat-bar-fill" style="width: ${pct}%; background: ${meta.color};"></div>
              </div>
              <span class="stat-bar-val">${count} (${pct}%)</span>
            </div>
          `;
        })
        .join('');
    }

    // 3) 실시간 데이터 노드 그래프 (Canvas)
    renderNodeCanvas(sourceItems);
  }

  function renderNodeCanvas(items) {
    const canvas = $id('node-graph-canvas') || $id('stats-node-canvas');
    if (!canvas || !canvas.getContext) return;

    const ctx = canvas.getContext('2d');
    const w = (canvas.width = canvas.clientWidth || 480);
    const h = (canvas.height = canvas.clientHeight || 260);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // 모눈 그리드 배경
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const cx = w / 2;
    const cy = h / 2;
    const catKeys = Object.keys(CONFIG.CATEGORIES);
    const catPositions = {};

    // 카테고리 허브 좌표 배치
    catKeys.forEach((key, idx) => {
      const angle = (idx / catKeys.length) * Math.PI * 2 - Math.PI / 4;
      catPositions[key] = {
        x: cx + Math.cos(angle) * Math.min(w, h) * 0.26,
        y: cy + Math.sin(angle) * Math.min(w, h) * 0.26
      };
    });

    // 아이템 노드 연결선 그리기
    const visibleNodes = items.slice(0, 24);
    visibleNodes.forEach((item, idx) => {
      const hub = catPositions[item.category] || { x: cx, y: cy };
      const subAngle = (idx * 2.39996) % (Math.PI * 2); // 골든 앵글 분산
      const dist = 34 + (idx % 4) * 14;
      const nx = Math.max(20, Math.min(w - 20, hub.x + Math.cos(subAngle) * dist));
      const ny = Math.max(20, Math.min(h - 20, hub.y + Math.sin(subAngle) * dist));

      ctx.strokeStyle = '#808080';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hub.x, hub.y);
      ctx.lineTo(nx, ny);
      ctx.stroke();

      // 개별 레코드 노드
      ctx.fillStyle = CONFIG.CATEGORIES[item.category]?.color || '#000000';
      ctx.fillRect(nx - 4, ny - 4, 8, 8);
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(nx - 4, ny - 4, 8, 8);
    });

    // 중앙 루트 노드 및 카테고리 허브 노드 그리기
    catKeys.forEach((key) => {
      const pos = catPositions[key];
      const meta = CONFIG.CATEGORIES[key];

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();

      ctx.fillStyle = meta.color;
      ctx.fillRect(pos.x - 18, pos.y - 10, 36, 20);
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(pos.x - 18, pos.y - 10, 36, 20);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(meta.code, pos.x, pos.y);
    });

    // 루트 노드 (MY-ARCHIVE 95)
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(cx - 28, cy - 12, 56, 24);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 28, cy - 12, 56, 24);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ROOT_95', cx, cy);
  }

  // ============================================================================
  // 10. EVENT BINDING & INITIALIZATION
  // ============================================================================
  function bindEvents() {
    // 인증 & 회원가입 폼
    $id('login-form')?.addEventListener('submit', handleLogin);
    $id('register-form')?.addEventListener('submit', handleRegister);
    $id('btn-open-login')?.addEventListener('click', openLoginModal);
    $id('btn-open-register')?.addEventListener('click', openRegisterModal);
    $id('btn-close-register')?.addEventListener('click', closeRegisterModal);
    $id('btn-logout')?.addEventListener('click', handleLogout);

    // 기록 생성/수정/메타검색
    $id('btn-new-record')?.addEventListener('click', () => openRecordEditor(null));
    $id('record-form')?.addEventListener('submit', saveArchiveItem);
    $id('btn-meta-search')?.addEventListener('click', searchMetadata);
    $id('btn-sync-now')?.addEventListener('click', refreshAllData);

    // 개인 아카이브 카테고리 탭
    document.querySelectorAll('[data-archive-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-archive-cat]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        State.activeCategory = btn.getAttribute('data-archive-cat') || 'all';
        renderPersonalArchive();
      });
    });

    // 개인 아카이브 검색 및 정렬
    $id('archive-search-input')?.addEventListener('input', (e) => {
      State.searchQuery = e.target.value.trim();
      renderPersonalArchive();
    });

    $id('archive-sort-select')?.addEventListener('change', (e) => {
      State.sortBy = e.target.value;
      renderPersonalArchive();
    });

    // COMMUNITY95.EXE 필터 & 검색
    document.querySelectorAll('[data-community-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-community-cat]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        State.communityCategory = btn.getAttribute('data-community-cat') || 'all';
        renderCommunityFeed();
      });
    });

    $id('community-search-input')?.addEventListener('input', (e) => {
      State.communityQuery = e.target.value.trim();
      renderCommunityFeed();
    });

    // 창 크기 변경 시 노드 캔버스 리렌더링
    window.addEventListener('resize', () => {
      renderNodeCanvas(State.items);
    });
  }

  async function init() {
    restoreSession();
    bindEvents();
    await refreshAllData();
  }

  // 전역 네임스페이스 및 HTML 인라인 이벤트 호환용 바인딩
  const ArchiveApp = {
    CONFIG,
    State,
    init,
    refreshAllData,
    openLoginModal,
    openRegisterModal,
    closeRegisterModal,
    handleLogin,
    handleRegister,
    handleLogout,
    openRecordEditor,
    saveArchiveItem,
    deleteArchiveItem,
    openDetailViewer,
    searchMetadata,
    renderPersonalArchive,
    renderCommunityFeed,
    renderStatsAndNodes
  };

  global.ArchiveApp = ArchiveApp;
  global.openLoginModal = openLoginModal;
  global.openRegisterModal = openRegisterModal;
  global.closeRegisterModal = closeRegisterModal;
  global.openRecordEditor = openRecordEditor;
  global.searchMetadata = searchMetadata;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);

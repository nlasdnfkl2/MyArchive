// ============================================================
// MY-ARCHIVE 95 OS — Global Config, Storage Cache & Core Utils
// ============================================================

const APP_BUILD_VERSION = 'v2026.11.25-01';
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwH-hzWi2Z3_oTFt0PWBhzYMP10VEx4e-32E9EW7d5SMF2k_bwxQL0_3ONaQ8Ze3sdKUQ/exec';
window.GAS_WEB_APP_URL = GAS_WEB_APP_URL;

const FALLBACK_COVER = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="300" height="400" fill="#c0c0c0"/><rect x="12" y="12" width="276" height="376" fill="#f7f5ee" stroke="#111111" stroke-width="6"/><rect x="12" y="12" width="276" height="36" fill="#000080"/><text x="26" y="36" fill="#ffffff" font-family="monospace" font-size="16" font-weight="bold">ARCHIVE_ITEM.DAT</text><rect x="85" y="110" width="130" height="130" fill="#ffd83b" stroke="#111111" stroke-width="5"/><text x="150" y="188" text-anchor="middle" fill="#111111" font-family="sans-serif" font-size="44" font-weight="900">NO IMG</text><text x="150" y="290" text-anchor="middle" fill="#111111" font-family="sans-serif" font-size="18" font-weight="900">MY-ARCHIVE 95</text><text x="150" y="318" text-anchor="middle" fill="#4a4a4a" font-family="monospace" font-size="13" font-weight="bold">COVER NOT AVAILABLE</text></svg>`
);

var archiveItems = window.archiveItems = window.archiveItems || [];
var memoNotes = window.memoNotes = window.memoNotes || [];
var mailboxItems = window.mailboxItems = window.mailboxItems || [];
var selectedCategory = window.selectedCategory || 'ALL';
var categoryChart = window.categoryChart || null;
var monthlyChart = window.monthlyChart || null;
var topZIndex = window.topZIndex || 120;
var detailWindowCount = window.detailWindowCount || 0;

// 0. 16x16 도트 SVG 아이콘 맵
const PIXEL_ICONS = {
  ALL: `<svg class="px-icon" width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="vertical-align:-2px;"><rect x="1" y="3" width="6" height="2" fill="#ffd83b" stroke="#111"/><rect x="1" y="5" width="14" height="9" fill="#ffd83b" stroke="#111"/></svg>`,
  BOOK: `<svg class="px-icon" width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="vertical-align:-2px;"><rect x="2" y="1" width="12" height="14" fill="#000080" stroke="#111"/><rect x="4" y="3" width="8" height="3" fill="#fff"/></svg>`,
  MOVIE: `<svg class="px-icon" width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="vertical-align:-2px;"><rect x="1" y="2" width="14" height="12" fill="#222" stroke="#111"/><rect x="3" y="4" width="10" height="8" fill="#008080"/></svg>`,
  MUSIC: `<svg class="px-icon" width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="vertical-align:-2px;"><rect x="2" y="2" width="12" height="12" fill="#c0c0c0" stroke="#111"/><rect x="6" y="6" width="4" height="4" fill="#ffd83b" stroke="#111"/></svg>`,
  ETC: `<svg class="px-icon" width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="vertical-align:-2px;"><rect x="2" y="1" width="12" height="14" fill="#000080" stroke="#111"/><rect x="4" y="1" width="8" height="5" fill="#fff"/><rect x="4" y="9" width="8" height="5" fill="#c0c0c0"/></svg>`,
  CAMERA: `<svg class="px-icon" width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="vertical-align:-2px;"><rect x="1" y="4" width="14" height="9" fill="#c0c0c0" stroke="#111"/><rect x="5" y="2" width="6" height="2" fill="#ffd83b" stroke="#111"/><rect x="6" y="6" width="4" height="4" fill="#000080" stroke="#111"/></svg>`,
  SPEAKER: `<svg class="px-icon" width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="vertical-align:-2px;"><polygon points="2,6 6,6 11,2 11,14 6,10 2,10" fill="#ffd83b" stroke="#111"/><rect x="13" y="5" width="2" height="6" fill="#111"/></svg>`,
  LOCK: `<svg class="px-icon" width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="vertical-align:-2px;"><rect x="4" y="2" width="8" height="5" fill="none" stroke="#111" stroke-width="2"/><rect x="2" y="7" width="12" height="7" fill="#c0c0c0" stroke="#111"/><rect x="7" y="9" width="2" height="3" fill="#111"/></svg>`,
  MOOD_HAPPY: `<svg class="px-icon" width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="vertical-align:-2px;"><rect x="1" y="1" width="14" height="14" fill="#ffd83b" stroke="#111"/><rect x="4" y="5" width="2" height="2" fill="#111"/><rect x="10" y="5" width="2" height="2" fill="#111"/><rect x="4" y="10" width="8" height="2" fill="#111"/></svg>`,
  MOOD_SAD: `<svg class="px-icon" width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="vertical-align:-2px;"><rect x="1" y="1" width="14" height="14" fill="#48dbfb" stroke="#111"/><rect x="4" y="5" width="2" height="2" fill="#111"/><rect x="10" y="5" width="2" height="2" fill="#111"/><rect x="4" y="11" width="8" height="2" fill="#111"/></svg>`,
  MOOD_BURNOUT: `<svg class="px-icon" width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="vertical-align:-2px;"><rect x="2" y="4" width="11" height="8" fill="#fff" stroke="#111"/><rect x="13" y="6" width="2" height="4" fill="#111"/><rect x="4" y="6" width="3" height="4" fill="#ff4757"/></svg>`,
  MOOD_STRESS: `<svg class="px-icon" width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="vertical-align:-2px;"><polygon points="9,1 3,9 8,9 7,15 13,7 8,7" fill="#ff4757" stroke="#111"/></svg>`,
  REROLL: `<svg class="px-icon" width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="vertical-align:-2px;"><rect x="2" y="3" width="12" height="2" fill="#111"/><rect x="2" y="11" width="12" height="2" fill="#111"/><rect x="11" y="1" width="3" height="5" fill="#000080"/><rect x="2" y="10" width="3" height="5" fill="#000080"/></svg>`,
  BULB: `<svg class="px-icon" width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="vertical-align:-2px;"><rect x="4" y="2" width="8" height="7" fill="#ffd83b" stroke="#111"/><rect x="5" y="10" width="6" height="4" fill="#c0c0c0" stroke="#111"/></svg>`,
  TROPHY: `<svg class="px-icon" width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="vertical-align:-2px;"><rect x="3" y="2" width="10" height="7" fill="#ffd83b" stroke="#111"/><rect x="6" y="9" width="4" height="3" fill="#ffd83b" stroke="#111"/><rect x="4" y="12" width="8" height="2" fill="#111"/></svg>`,
  CROSS: `<svg class="px-icon" width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="vertical-align:-2px;"><rect x="2" y="2" width="12" height="12" fill="#fff" stroke="#111"/><line x1="4" y1="4" x2="12" y2="12" stroke="#111" stroke-width="2"/><line x1="12" y1="4" x2="4" y2="12" stroke="#111" stroke-width="2"/></svg>`,
  CHART: `<svg class="px-icon" width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="vertical-align:-2px;"><rect x="1" y="1" width="14" height="14" fill="#fff" stroke="#111"/><rect x="3" y="8" width="2" height="5" fill="#000080"/><rect x="7" y="5" width="2" height="8" fill="#ff4757"/><rect x="11" y="3" width="2" height="10" fill="#2ed573"/></svg>`,
  DOWNLOAD: `<svg class="px-icon" width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="vertical-align:-2px;"><rect x="6" y="1" width="4" height="7" fill="#111"/><polygon points="3,8 13,8 8,13" fill="#111"/><rect x="2" y="13" width="12" height="2" fill="#111"/></svg>`,
  BAN: `<svg class="px-icon" width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="vertical-align:-2px;"><rect x="2" y="2" width="12" height="12" fill="#ff4757" stroke="#111"/><rect x="4" y="7" width="8" height="2" fill="#fff"/></svg>`,
  PRINTER: `<svg class="px-icon" width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="vertical-align:-2px;"><rect x="4" y="1" width="8" height="4" fill="#fff" stroke="#111"/><rect x="1" y="5" width="14" height="6" fill="#c0c0c0" stroke="#111"/><rect x="4" y="9" width="8" height="6" fill="#fff" stroke="#111"/></svg>`,
  MAILBOX: `<svg class="px-icon" width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="vertical-align:-2px;"><rect x="1" y="3" width="14" height="10" fill="#ffd83b" stroke="#111"/><polyline points="1,3 8,9 15,3" fill="none" stroke="#111" stroke-width="1.5"/></svg>`,
  LINK: `<svg class="px-icon" width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges" style="vertical-align:-2px;"><rect x="1" y="5" width="6" height="6" fill="none" stroke="#111" stroke-width="2"/><rect x="9" y="5" width="6" height="6" fill="none" stroke="#111" stroke-width="2"/><rect x="5" y="7" width="6" height="2" fill="#000080"/></svg>`,
  USER_BADGE: `<svg class="px-icon" width="16" height="16" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="5" y="2" width="6" height="5" fill="#000080"/><rect x="2" y="9" width="12" height="6" fill="#000080"/></svg>`,
  PUB_BADGE: `<svg class="px-icon" width="16" height="16" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="1" y="3" width="14" height="9" fill="#008080" stroke="#111"/><rect x="5" y="12" width="6" height="2" fill="#111"/></svg>`
};

// 0-1. 계정 권한 판별 유틸리티
function isAdminUser(user) {
  if (!user || typeof user !== 'object') return false;
  const role = String(user.role || '').trim().toLowerCase();
  const uname = String(user.username || '').trim().toLowerCase();
  return user.isAdmin === true || role === 'admin' || role === 'owner' || uname === '관리자' || uname === 'admin' || uname === 'taeyang';
}

function isPublicArchiveItem(item) {
  if (!item || typeof item !== 'object') return false;
  const owner = String(item.owner || '').trim();
  const isSharedFlag = item.isShared === true || String(item.isShared || '').trim().toLowerCase() === 'true';
  return isSharedFlag || !owner || owner === '공용' || owner.toUpperCase() === 'PUBLIC' || owner.toUpperCase() === 'GUEST';
}

function canDeleteArchiveItem(item, user = null) {
  if (!item) return false;
  const me = user || (typeof window.getCurrentUser === 'function' ? window.getCurrentUser() : null);
  if (!me || !me.username) return false;
  if (isAdminUser(me)) return true;

  const role = String(me.role || '').trim().toLowerCase();
  const myName = String(me.username || '').trim();
  if (role === 'public' || myName === '공용') return false;
  if (isPublicArchiveItem(item)) return false;

  return String(item.owner || '').trim() === myName;
}

// 1. LocalStorage 하이브리드 캐시 관리
const STORAGE_KEYS = {
  ARCHIVE: 'my_archive_95_items_cache_v1',
  COVER_CACHE: 'my_archive_95_cover_lru_v1',
  NOTES: 'my_archive_95_notes_cache_v1',
  MAILBOX: 'my_archive_95_mailbox_cache_v1',
  PREFS: 'my_archive_95_prefs_v1',
  BUDGET: 'my_archive_95_budget_v1',
  DDAYS: 'my_archive_95_ddays_v1'
};

function saveLocalCache(key, value) {
  try {
    let payloadToStore = value;
    if (key === STORAGE_KEYS.ARCHIVE && Array.isArray(value)) {
      const coverEntries = [];
      payloadToStore = value.map(item => {
        if (item && typeof item.coverUrl === 'string' && item.coverUrl.startsWith('data:')) {
          if (coverEntries.length < 6 && item.id != null) coverEntries.push([String(item.id), item.coverUrl]);
          return { ...item, coverUrl: `__CACHED_COVER__:${item.id ?? ''}` };
        }
        return item;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.COVER_CACHE, JSON.stringify(Object.fromEntries(coverEntries)));
      } catch {}
    }
    localStorage.setItem(key, JSON.stringify({ updatedAt: new Date().toISOString(), data: payloadToStore }));
    return true;
  } catch (err) {
    console.warn('[디스크 캐시 저장 한도 초과 또는 차단]:', err);
    return false;
  }
}

function loadLocalCache(key, fallbackValue = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallbackValue;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.data === undefined) return fallbackValue;

    if (key === STORAGE_KEYS.ARCHIVE && Array.isArray(parsed.data)) {
      let coverMap = {};
      try { coverMap = JSON.parse(localStorage.getItem(STORAGE_KEYS.COVER_CACHE) || '{}'); } catch {}
      return parsed.data.map(item => {
        if (item && typeof item.coverUrl === 'string' && item.coverUrl.startsWith('__CACHED_COVER__:')) {
          const id = item.coverUrl.slice('__CACHED_COVER__:'.length);
          return { ...item, coverUrl: coverMap[id] || '' };
        }
        return item;
      });
    }
    return parsed.data;
  } catch {
    return fallbackValue;
  }
}

function getCacheTimestamp(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return parsed?.updatedAt || '';
  } catch {
    return '';
  }
}

// 2. 데이터 정규화 & 문자열/초성 유틸리티
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatCommaNumber(val) {
  const num = Number(String(val ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(num) ? num.toLocaleString('ko-KR') : '0';
}

function normalizeDateString(input) {
  const match = String(input || '').trim().match(/(\d{4})[-./년\s]+(\d{1,2})[-./월\s]+(\d{1,2})/);
  if (match) {
    return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  }
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function extractKoreanChosung(text) {
  const CHOSUNG = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  const src = String(text || '');
  let out = '';
  for (let i = 0; i < src.length; i++) {
    const code = src.charCodeAt(i);
    out += (code >= 0xAC00 && code <= 0xD7A3) ? (CHOSUNG[Math.floor((code - 0xAC00) / 588)] || src[i]) : src[i];
  }
  return out;
}

// 3. 클라이언트 이미지 1MB 이하 압축 유틸리티
function compressImageFile(file, maxWidth = 900, maxBytes = 950 * 1024) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      reject(new Error('유효한 이미지 파일이 아닙니다.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('이미지를 읽는 중 오류가 발생했습니다.'));
    reader.onload = ev => {
      const img = new Image();
      img.onerror = () => reject(new Error('이미지 디코딩에 실패했습니다.'));
      img.onload = () => {
        let w = img.naturalWidth || img.width || maxWidth;
        let h = img.naturalHeight || img.height || maxWidth;
        if (w > maxWidth) {
          h = Math.max(1, Math.round((h * maxWidth) / w));
          w = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('캔버스 컨텍스트를 생성할 수 없습니다.'));
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        let quality = 0.86;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        const getBytes = url => Math.floor(((url.split(',')[1] || '').length) * 0.75);
        while (getBytes(dataUrl) > maxBytes && quality > 0.35) {
          quality = Math.round((quality - 0.1) * 100) / 100;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(dataUrl);
      };
      img.src = ev.target?.result;
    };
    reader.readAsDataURL(file);
  });
}

// 4. Windows 95 날짜 드롭다운(년/월/일) 컨트롤러
function populateWin95DateSelects(ySel, mSel, dSel, targetDateStr = '') {
  if (!ySel || !mSel || !dSel) return;
  const [initY, initM, initD] = normalizeDateString(targetDateStr).split('-').map(Number);
  const currentYear = new Date().getFullYear();

  ySel.innerHTML = '';
  for (let y = currentYear + 1; y >= 1980; y--) {
    const opt = new Option(`${y}년`, String(y), false, y === initY);
    ySel.appendChild(opt);
  }

  mSel.innerHTML = '';
  for (let m = 1; m <= 12; m++) {
    const val = String(m).padStart(2, '0');
    mSel.appendChild(new Option(`${m}월`, val, false, m === initM));
  }

  const refreshDays = keepDay => {
    const maxDays = new Date(Number(ySel.value) || initY, Number(mSel.value) || initM, 0).getDate();
    const targetDay = Math.min(Math.max(1, keepDay), maxDays);
    dSel.innerHTML = '';
    for (let d = 1; d <= maxDays; d++) {
      const val = String(d).padStart(2, '0');
      dSel.appendChild(new Option(`${d}일`, val, false, d === targetDay));
    }
  };

  refreshDays(initD);
  ySel.onchange = () => refreshDays(Number(dSel.value) || 1);
  mSel.onchange = () => refreshDays(Number(dSel.value) || 1);
}

function getWin95DateValue(ySel, mSel, dSel) {
  if (!ySel || !mSel || !dSel) return normalizeDateString('');
  return `${ySel.value || new Date().getFullYear()}-${String(mSel.value || '01').padStart(2, '0')}-${String(dSel.value || '01').padStart(2, '0')}`;
}

// 5. 8비트 Web Audio 효과음 합성기 & 커서/부팅 연출
let sharedAudioCtx = null;

function playRetroTone(type = 'click') {
  const prefs = loadLocalCache(STORAGE_KEYS.PREFS, { soundEnabled: true });
  if (prefs && prefs.soundEnabled === false) return;

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!sharedAudioCtx) sharedAudioCtx = new AudioCtx();

    const triggerNotes = () => {
      const now = sharedAudioCtx.currentTime;
      const playNote = (freq, offset, dur, wave = 'square', gainVal = 0.045) => {
        const osc = sharedAudioCtx.createOscillator();
        const gain = sharedAudioCtx.createGain();
        osc.type = wave;
        osc.frequency.setValueAtTime(freq, now + offset);
        gain.gain.setValueAtTime(gainVal, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + dur);
        osc.connect(gain);
        gain.connect(sharedAudioCtx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + dur);
      };

      const patterns = {
        click: [[880, 0, 0.045, 'square', 0.035]],
        open: [[523.25, 0, 0.07, 'triangle', 0.05], [783.99, 0.06, 0.11, 'triangle', 0.05]],
        close: [[659.25, 0, 0.06, 'triangle', 0.045], [440.0, 0.05, 0.09, 'triangle', 0.045]],
        boot: [[523.25, 0, 0.12, 'triangle', 0.055], [659.25, 0.11, 0.12, 'triangle', 0.055], [783.99, 0.22, 0.14, 'triangle', 0.055], [1046.5, 0.35, 0.26, 'triangle', 0.06]],
        boom: [[190, 0, 0.14, 'sawtooth', 0.06], [130, 0.12, 0.22, 'sawtooth', 0.06]],
        fanfare: [[587.33, 0, 0.09, 'square', 0.045], [783.99, 0.09, 0.09, 'square', 0.045], [987.77, 0.18, 0.09, 'square', 0.045], [1174.66, 0.27, 0.25, 'square', 0.055]]
      };
      (patterns[type] || patterns.click).forEach(args => playNote(...args));
    };

    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().then(triggerNotes).catch(() => {});
    } else {
      triggerNotes();
    }
  } catch {}
}

function setLoadingCursor(isLoading) {
  if (document.body) document.body.classList.toggle('cursor-wait', Boolean(isLoading));
}

function runBootAnimation() {
  const bootScreen = document.getElementById('boot-screen');
  if (!bootScreen) return;
  setTimeout(() => {
    bootScreen.classList.add('fade-out');
    setTimeout(() => { bootScreen.style.display = 'none'; }, 350);
  }, 450);
}

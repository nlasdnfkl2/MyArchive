// ============================================================
// MY-ARCHIVE 95 OS — Global Config, Storage Cache & Core Utils
// ============================================================

const APP_BUILD_VERSION = 'v2026.11.22-05';

// Google Apps Script 웹 앱 배포 URL (/exec)을 아래에 입력하세요.
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwH-hzWi2Z3_oTFt0PWBhzYMP10VEx4e-32E9EW7d5SMF2k_bwxQL0_3ONaQ8Ze3sdKUQ/exec';

// 외부 폴더 의존성 없는 인라인 SVG 기본 표지 이미지
const FALLBACK_COVER = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400">
  <rect width="300" height="400" fill="#c0c0c0"/>
  <rect x="12" y="12" width="276" height="376" fill="#f7f5ee" stroke="#111111" stroke-width="6"/>
  <rect x="12" y="12" width="276" height="36" fill="#000080"/>
  <text x="26" y="36" fill="#ffffff" font-family="monospace" font-size="16" font-weight="bold">ARCHIVE_ITEM.DAT</text>
  <rect x="85" y="110" width="130" height="130" fill="#ffd83b" stroke="#111111" stroke-width="5"/>
  <text x="150" y="188" text-anchor="middle" fill="#111111" font-family="sans-serif" font-size="44" font-weight="900">NO IMG</text>
  <text x="150" y="290" text-anchor="middle" fill="#111111" font-family="sans-serif" font-size="18" font-weight="900">MY-ARCHIVE 95</text>
  <text x="150" y="318" text-anchor="middle" fill="#4a4a4a" font-family="monospace" font-size="13" font-weight="bold">COVER NOT AVAILABLE</text>
</svg>
`);

// 전역 상태 변수 (타 JS 모듈에서 직접 참조 및 갱신)
var archiveItems = [];
var memoNotes = [];
var mailboxItems = [];
var selectedCategory = 'ALL';
var categoryChart = null;
var monthlyChart = null;
var topZIndex = 120;
var detailWindowCount = 0;

// ============================================================
// 0. Windows 95 + Neo-Brutalism 16x16 도트 SVG 아이콘 맵
// ============================================================
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

// ============================================================
// 0-1. 계정 권한 판별 유틸리티 (boot-screen.js의 getCurrentUser 연동)
// ============================================================
function isAdminUser(user) {
  if (!user) return false;
  const role = String(user.role || '').trim().toLowerCase();
  const uname = String(user.username || '').trim().toLowerCase();
  return role === 'admin' || user.isAdmin === true || uname === '관리자' || uname === 'admin';
}

function isPublicArchiveItem(item) {
  if (!item) return false;
  const owner = String(item.owner || '').trim();
  const isSharedFlag = item.isShared === true || String(item.isShared || '').toLowerCase() === 'true';
  return isSharedFlag || !owner || owner === '공용' || owner.toUpperCase() === 'PUBLIC' || owner.toUpperCase() === 'GUEST';
}

function canDeleteArchiveItem(item, user = null) {
  if (!item) return false;
  const me = user || (typeof getCurrentUser === 'function' ? getCurrentUser() : null);
  if (!me || !me.username) return false;

  // 1. 관리자 계정은 모든 게시물(공용 계정 게시물 포함) 삭제 가능
  if (isAdminUser(me)) return true;

  // 2. 공용 계정으로 접속 중인 상태에서는 어떠한 게시물도 삭제 불가
  const role = String(me.role || '').trim().toLowerCase();
  const myName = String(me.username || '').trim();
  if (role === 'public' || myName === '공용') return false;

  // 3. 공용 계정 게시물은 오직 관리자 계정으로만 삭제 가능
  if (isPublicArchiveItem(item)) return false;

  // 4. 일반 개인 계정은 본인이 작성한 게시물만 삭제 가능
  return String(item.owner || '').trim() === myName;
}

// ============================================================
// 1. LocalStorage 하이브리드 캐시 관리 (약 5MB 한도 방어)
// ============================================================
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

    // 아카이브 저장 시 Base64(data:) 이미지는 별도 LRU 캐시(최대 6개)로 분리해 5MB 한도 초과 방지
    if (key === STORAGE_KEYS.ARCHIVE && Array.isArray(value)) {
      const coverEntries = [];
      payloadToStore = value.map(item => {
        if (item && typeof item.coverUrl === 'string' && item.coverUrl.startsWith('data:')) {
          if (coverEntries.length < 6) {
            coverEntries.push([item.id, item.coverUrl]);
          }
          return { ...item, coverUrl: `__CACHED_COVER__:${item.id}` }; } return item; }); try { localStorage.setItem(STORAGE_KEYS.COVER_CACHE, JSON.stringify(Object.fromEntries(coverEntries))); } catch {} }  const serialized = JSON.stringify({ updatedAt: new Date().toISOString(), data: payloadToStore }); localStorage.setItem(key, serialized); return true; } catch (err) { console.warn('[디스크 캐시 저장 한도 초과 또는 차단]:', err); return false; } }  function loadLocalCache(key, fallbackValue = null) { try { const raw = localStorage.getItem(key); if (!raw) return fallbackValue; const parsed = JSON.parse(raw); if (!parsed \vert{}\vert{} parsed.data === undefined) return fallbackValue;  if (key === STORAGE_KEYS.ARCHIVE && Array.isArray(parsed.data)) { let coverMap = {}; try { coverMap = JSON.parse(localStorage.getItem(STORAGE_KEYS.COVER_CACHE) \vert{}\vert{} '{}'); } catch {} return parsed.data.map(item => { if (item && typeof item.coverUrl === 'string' && item.coverUrl.startsWith('__CACHED_COVER__:')) { const id = item.coverUrl.replace('__CACHED_COVER__:', ''); return { ...item, coverUrl: coverMap[id] \vert{}\vert{} '' }; } return item; }); }  return parsed.data; } catch (err) { return fallbackValue; } }  function getCacheTimestamp(key) { try { const raw = localStorage.getItem(key); if (!raw) return ''; const parsed = JSON.parse(raw); return parsed && parsed.updatedAt ? parsed.updatedAt : ''; } catch { return ''; } }  // ============================================================ // 2. 데이터 정규화 & 문자열/초성 유틸리티 // ============================================================ function esc(str) { return String(str ?? '') .replace(/&/g, '&amp;') .replace(/</g, '&lt;') .replace(/>/g, '&gt;') .replace(/"/g, '&quot;') .replace(/'/g, '&#39;'); }  function formatCommaNumber(val) { const num = Number(String(val ?? '').replace(/[^\d.-]/g, '')); if (Number.isNaN(num)) return '0'; return num.toLocaleString('ko-KR'); }  function normalizeDateString(input) { const s = String(input \vert{}\vert{} '').trim(); const match = s.match(/(\d{4})[-./년\s]+(\d{1,2})[-./월\s]+(\d{1,2})/); if (match) { const y = match[1]; const m = match[2].padStart(2, '0'); const d = match[3].padStart(2, '0'); return `${y}-${m}-${d}`;
  }
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

function extractKoreanChosung(text) {
  const CHOSUNG_LIST = [
    'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
    'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
  ];
  const src = String(text || '');
  let result = '';
  for (let i = 0; i < src.length; i++) {
    const code = src.charCodeAt(i);
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const idx = Math.floor((code - 0xAC00) / 588);
      result += CHOSUNG_LIST[idx] || src[i];
    } else {
      result += src[i];
    }
  }
  return result;
}

// ============================================================
// 3. 클라이언트 이미지 1MB 이하 압축 유틸리티
// ============================================================
function compressImageFile(file, maxWidth = 900, maxBytes = 950 * 1024) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('유효한 이미지 파일이 아닙니다.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('이미지를 읽는 중 오류가 발생했습니다.'));
    reader.onload = ev => {
      const img = new Image();
      img.onerror = () => reject(new Error('이미지 디코딩에 실패했습니다.'));
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        let quality = 0.86;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (dataUrl.length * 0.75 > maxBytes && quality > 0.35) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(dataUrl);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ============================================================
// 4. Windows 95 날짜 드롭다운(년/월/일) 컨트롤러
// ============================================================
function populateWin95DateSelects(ySel, mSel, dSel, targetDateStr = '') {
  if (!ySel || !mSel || !dSel) return;

  const iso = normalizeDateString(targetDateStr);
  const [initY, initM, initD] = iso.split('-').map(Number);
  const currentYear = new Date().getFullYear();

  ySel.innerHTML = '';
  for (let y = currentYear + 1; y >= 1980; y--) {
    const opt = document.createElement('option');
    opt.value = String(y);
    opt.textContent = `${y}년`; if (y === initY) opt.selected = true; ySel.appendChild(opt); }  mSel.innerHTML = ''; for (let m = 1; m <= 12; m++) { const opt = document.createElement('option'); opt.value = String(m).padStart(2, '0'); opt.textContent = `${m}월`;
    if (m === initM) opt.selected = true;
    mSel.appendChild(opt);
  }

  const refreshDays = (keepDay) => {
    const selYear = Number(ySel.value) || initY;
    const selMonth = Number(mSel.value) || initM;
    const maxDays = new Date(selYear, selMonth, 0).getDate();
    dSel.innerHTML = '';
    for (let d = 1; d <= maxDays; d++) {
      const opt = document.createElement('option');
      opt.value = String(d).padStart(2, '0');
      opt.textContent = `${d}일`; if (d === Math.min(keepDay, maxDays)) opt.selected = true; dSel.appendChild(opt); } };  refreshDays(initD); ySel.onchange = () => refreshDays(Number(dSel.value) \vert{}\vert{} 1); mSel.onchange = () => refreshDays(Number(dSel.value) \vert{}\vert{} 1); }  function getWin95DateValue(ySel, mSel, dSel) { if (!ySel \vert{}\vert{} !mSel \vert{}\vert{} !dSel) return normalizeDateString(''); const y = String(ySel.value \vert{}\vert{} new Date().getFullYear()); const m = String(mSel.value \vert{}\vert{} '01').padStart(2, '0'); const d = String(dSel.value \vert{}\vert{} '01').padStart(2, '0'); return `${y}-${m}-${d}`;
}

// ============================================================
// 5. 8비트 Web Audio 효과음 합성기 & 커서/부팅 연출
// ============================================================
let sharedAudioCtx = null;

function playRetroTone(type = 'click') {
  const prefs = loadLocalCache(STORAGE_KEYS.PREFS, { soundEnabled: true });
  if (prefs && prefs.soundEnabled === false) return;

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!sharedAudioCtx) sharedAudioCtx = new AudioCtx();
    if (sharedAudioCtx.state === 'suspended') sharedAudioCtx.resume();

    const now = sharedAudioCtx.currentTime;
    const playNote = (freq, startOffset, duration, wave = 'square', gainVal = 0.045) => {
      const osc = sharedAudioCtx.createOscillator();
      const gain = sharedAudioCtx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, now + startOffset);
      gain.gain.setValueAtTime(gainVal, now + startOffset);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);
      osc.connect(gain);
      gain.connect(sharedAudioCtx.destination);
      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration);
    };

    if (type === 'click') {
      playNote(880, 0, 0.045, 'square', 0.035);
    } else if (type === 'open') {
      playNote(523.25, 0, 0.07, 'triangle', 0.05);
      playNote(783.99, 0.06, 0.11, 'triangle', 0.05);
    } else if (type === 'close') {
      playNote(659.25, 0, 0.06, 'triangle', 0.045);
      playNote(440.0, 0.05, 0.09, 'triangle', 0.045);
    } else if (type === 'boot') {
      playNote(523.25, 0, 0.12, 'triangle', 0.055);
      playNote(659.25, 0.11, 0.12, 'triangle', 0.055);
      playNote(783.99, 0.22, 0.14, 'triangle', 0.055);
      playNote(1046.5, 0.35, 0.26, 'triangle', 0.06);
    } else if (type === 'boom') {
      playNote(190, 0, 0.14, 'sawtooth', 0.06);
      playNote(130, 0.12, 0.22, 'sawtooth', 0.06);
    } else if (type === 'fanfare') {
      playNote(587.33, 0, 0.09, 'square', 0.045);
      playNote(783.99, 0.09, 0.09, 'square', 0.045);
      playNote(987.77, 0.18, 0.09, 'square', 0.045);
      playNote(1174.66, 0.27, 0.25, 'square', 0.055);
    }
  } catch {}
}

function setLoadingCursor(isLoading) {
  document.body.classList.toggle('cursor-wait', Boolean(isLoading));
}

function runBootAnimation() {
  const bootScreen = document.getElementById('boot-screen');
  if (!bootScreen) return;
  setTimeout(() => {
    bootScreen.classList.add('fade-out');
    setTimeout(() => {
      bootScreen.style.display = 'none';
    }, 350);
  }, 450);
}

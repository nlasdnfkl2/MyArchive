// ============================================================
// MY-ARCHIVE 95 OS — SEC-RET Code-Only Pixel SVG Sprite Bank
// ============================================================

(function () {
  window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
  window.__MOD_VERSIONS.secRetSprites = 'v2026.11.26-sprites-v1';

  window.GamePackModules = window.GamePackModules || {};

  function svgWrap(viewBox, inner, extraStyle = '') {
    return `<svg class="secret-pixel-svg" viewBox="${viewBox}" shape-rendering="crispEdges" aria-hidden="true" style="display:block;${extraStyle}">${inner}</svg>`;
  }

  // 1. 단일 주인공 캐릭터 스프라이트 (SEC-RET 회귀 기물)
  const HERO_SPRITES = {
    idle: svgWrap('0 0 16 16', `
      <path fill="#111111" d="M6 1h4v2h2v2h-1v2h2v3h-1v2h1v3H3v-3h1v-2H3V7h2V5H4V3h2V1z"/>
      <path fill="#05d9e8" d="M7 2h2v2H7V2zm-1 3h4v2H6V5z"/>
      <path fill="#ffe600" d="M7 5h2v1H7V5z"/>
      <path fill="#1e90ff" d="M5 7h6v3H5V7zm0 3h6v2H5v-2z"/>
      <path fill="#ffffff" d="M6 8h1v1H6V8zm3 0h1v1H9V8z"/>
      <path fill="#00f5d4" d="M4 13h3v1H4v-1zm5 0h3v1H9v-1z"/>
    `),
    move: svgWrap('0 0 16 16', `
      <path fill="#111111" d="M6 1h4v2h2v2h-1v2h3v3h-2v2h1v3H4v-3h1v-2H3V7h2V5H4V3h2V1z"/>
      <path fill="#05d9e8" d="M7 2h2v2H7V2zm-1 3h4v2H6V5z"/>
      <path fill="#ffe600" d="M7 5h2v1H7V5z"/>
      <path fill="#1e90ff" d="M5 7h6v4H5V7z"/>
      <path fill="#39ff14" d="M6 8h1v1H6V8zm3 0h1v1H9V8z"/>
      <path fill="#00f5d4" d="M2 8h2v1H2V8zm-1 2h3v1H1v-1z"/>
    `),
    retEcho: svgWrap('0 0 16 16', `
      <path fill="#00f5d4" d="M6 2h4v2h1v3h1v3h-1v3H5v-3H4V7h1V4h1V2z" opacity="0.55"/>
      <path fill="#111111" d="M6 4h4v2H6V4zm-1 4h6v3H5V8z" opacity="0.45"/>
      <path fill="#ffe600" d="M7 5h2v1H7V5z" opacity="0.7"/>
    `)
  };

  // 2. 공격 방식(체스 기물 모티브 + RET 공격) SVG 아이콘 & 이펙트
  const ATTACK_SPRITES = {
    // 룩(Rook): 직선 4방향 참격/빔
    rook: svgWrap('0 0 16 16', `
      <path fill="#111111" d="M3 2h2v2h2V2h2v2h2V2h2v4h-2v5h2v3H3v-3h2V6H3V2z"/>
      <path fill="#ff2a6d" d="M6 6h4v5H6V6z"/>
      <path fill="#ffe600" d="M7 7h2v3H7V7z"/>
    `),
    // 비숍(Bishop): 대각선 4방향 프리즘
    bishop: svgWrap('0 0 16 16', `
      <path fill="#111111" d="M7 1h2v2h2v2h1v4h-1v2h2v3H3v-3h2V9H4V5h1V3h2V1z"/>
      <path fill="#a29bfe" d="M7 2h2v2h1v5H6V4h1V2z"/>
      <path fill="#ffffff" d="M7 5h1v2H7V5z"/>
    `),
    // 나이트(Knight): L자 도약 충격파
    knight: svgWrap('0 0 16 16', `
      <path fill="#111111" d="M6 1h4v1h2v2h1v4h-2v2h2v4H3v-3h2V8H4V5h2V1z"/>
      <path fill="#ff9f43" d="M7 2h2v2h2v3H8v4H6V7H5V5h2V2z"/>
      <path fill="#111111" d="M8 4h1v1H8V4z"/>
    `),
    // 퀸(Queen): 전방위 왕관 파동
    queen: svgWrap('0 0 16 16', `
      <path fill="#111111" d="M2 3h2v2h2V2h1v1h2V2h1v3h2V3h2v4l-2 5v2H4v-2L2 7V3z"/>
      <path fill="#ffe600" d="M4 5h2v2h4V5h2v2l-1 4H5L4 7V5z"/>
      <path fill="#ff2a6d" d="M7 7h2v2H7V7z"/>
    `),
    // RET 잔상 공명 공격
    retEchoStrike: svgWrap('0 0 16 16', `
      <path fill="#111111" d="M5 1h6v2h2v4h-2v2h2v4h-2v2H5v-2H3v-4h2V7H3V3h2V1z"/>
      <path fill="#00f5d4" d="M6 2h4v4H6V2zm0 8h4v4H6v-4z"/>
      <path fill="#ffe600" d="M4 7h8v2H4V7z"/>
    `),
    // RET 역행 파동
    retRewindWave: svgWrap('0 0 16 16', `
      <path fill="#111111" d="M6 1h4v2h3v2h2v6h-2v2h-3v2H6v-2H3v-2H1V5h2V3h3V1z"/>
      <path fill="#05d9e8" d="M6 3h4v2h2v6h-2v2H6v-2H4V5h2V3z"/>
      <path fill="#39ff14" d="M7 5h2v2h2v2H9v2H7V9H5V7h2V5z"/>
    `)
  };

  // 3. 적 기물(폰·나이트·비숍·룩·시계태엽 보스) SVG 스프라이트
  const ENEMY_SPRITES = {
    pawn: svgWrap('0 0 16 16', `
      <path fill="#111111" d="M6 2h4v4h-1v1h2v2H9v2h2v3H5v-3h2V9H5V7h2V6H6V2z"/>
      <path fill="#ff4757" d="M7 3h2v3H7V3zm-1 5h4v1H6V8zm0 4h4v1H6v-1z"/>
    `),
    knight: svgWrap('0 0 16 16', `
      <path fill="#111111" d="M6 1h4v2h2v4h-2v3h2v4H4v-3h2V7H4V4h2V1z"/>
      <path fill="#ff6b81" d="M7 2h2v2h2v2H7v5H6V6H5V4h2V2z"/>
    `),
    bishop: svgWrap('0 0 16 16', `
      <path fill="#111111" d="M7 1h2v2h2v5h-1v3h2v3H4v-3h2V8H5V3h2V1z"/>
      <path fill="#c56cf0" d="M7 2h2v6H6V3h1V2zm-1 10h4v1H6v-1z"/>
    `),
    rook: svgWrap('0 0 16 16', `
      <path fill="#111111" d="M3 2h2v2h2V2h2v2h2V2h2v4h-1v5h2v3H2v-3h2V6H3V2z"/>
      <path fill="#eb2f06" d="M5 6h6v6H5V6z"/>
      <path fill="#ffd83b" d="M7 8h2v2H7V8z"/>
    `),
    boss: svgWrap('0 0 16 16', `
      <path fill="#111111" d="M2 2h3v2h2V1h2v3h2V2h3v4l-1 6v2H3v-2L2 6V2z"/>
      <path fill="#ff2a6d" d="M4 5h8v6H4V5z"/>
      <path fill="#ffe600" d="M6 6h4v4H6V6z"/>
      <path fill="#111111" d="M7 7h2v2H7V7z"/>
    `)
  };

  // 4. 능력 카드 & 보드 마커 SVG 아이콘
  const ABILITY_SPRITES = {
    multStat: svgWrap('0 0 16 16', `
      <path fill="#111111" d="M2 2h12v12H2V2z"/>
      <path fill="#ffe600" d="M3 3h10v10H3V3z"/>
      <path fill="#111111" d="M5 5h2v2h2V5h2v2L9 8l2 2v1H9V9H7v2H5v-1l2-2-2-1V5z"/>
    `),
    levelJump: svgWrap('0 0 16 16', `
      <path fill="#111111" d="M2 2h12v12H2V2z"/>
      <path fill="#39ff14" d="M3 3h10v10H3V3z"/>
      <path fill="#111111" d="M7 4h2v3h2v2H9v3H7V9H5V7h2V4z"/>
    `),
    attackMod: svgWrap('0 0 16 16', `
      <path fill="#111111" d="M2 2h12v12H2V2z"/>
      <path fill="#05d9e8" d="M3 3h10v10H3V3z"/>
      <path fill="#ff2a6d" d="M10 4h2v2l-5 5H5V9l5-5z"/>
    `),
    defenseMod: svgWrap('0 0 16 16', `
      <path fill="#111111" d="M2 2h12v12H2V2z"/>
      <path fill="#a29bfe" d="M3 3h10v10H3V3z"/>
      <path fill="#ffffff" d="M5 4h6v4l-3 4-3-4V4z"/>
      <path fill="#000080" d="M6 5h4v3l-2 2-2-2V5z"/>
    `),
    dice: svgWrap('0 0 16 16', `
      <path fill="#111111" d="M2 2h12v12H2V2z"/>
      <path fill="#ffffff" d="M3 3h10v10H3V3z"/>
      <path fill="#111111" d="M5 5h2v2H5V5zm4 4h2v2H9V9zM7 7h2v2H7V7z"/>
    `),
    clockSec: svgWrap('0 0 16 16', `
      <path fill="#111111" d="M5 1h6v1h2v2h1v8h-1v2h-2v1H5v-1H3v-2H2V4h1V2h2V1z"/>
      <path fill="#fffef5" d="M5 2h6v1h2v9h-2v1H5v-1H3V3h2V2z"/>
      <path fill="#ff2a6d" d="M7 4h2v4h3v2H7V4z"/>
    `)
  };

  window.GamePackModules.secretSprites = {
    hero: HERO_SPRITES,
    attacks: ATTACK_SPRITES,
    enemies: ENEMY_SPRITES,
    abilities: ABILITY_SPRITES
  };
})();

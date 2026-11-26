// ============================================================
// MY-ARCHIVE 95 OS — SEC-RET (1-Sec Turn Chess Return Defense)
// ============================================================

(function () {
  window.__MOD_VERSIONS = window.__MOD_VERSIONS || {};
  window.__MOD_VERSIONS.secRet = 'v2026.11.26-sec-ret-v1';

  window.GamePackModules = window.GamePackModules || {};

  const BOARD_SIZE = 7;
  const MAX_LEVEL = 30;
  const MAX_DICE = 3;
  const STEP_MS = 340;
  const CHOICE_LEVELS = new Set([2, 3, 4, 5, 7, 9, 12, 15, 18, 20, 23, 27, 30]);

  const ABILITY_POOL = [
    // 1. 특정 기본 능력치 곱증가 (x 배율)
    {
      id: 'mult_atk',
      kind: 'mult',
      badge: '곱증가 ×',
      name: '초시계 증폭기',
      desc: '기본 공격력에 ×1.25 곱연산 적용',
      apply(st) {
        st.multAtk = +(st.multAtk * 1.25).toFixed(3);
      }
    },
    {
      id: 'mult_hp',
      kind: 'mult',
      badge: '곱증가 ×',
      name: '강철 기어 코어',
      desc: '최대 체력 ×1.30 곱증가 및 현재 체력 30% 회복',
      apply(st) {
        st.multHp = +(st.multHp * 1.3).toFixed(3);
        const maxHp = getMaxHp(st);
        st.hp = Math.min(maxHp, Math.round(st.hp + maxHp * 0.3));
      }
    },
    {
      id: 'mult_crit',
      kind: 'mult',
      badge: '곱증가 ×',
      name: '임계 회심 배율기',
      desc: '치명타 피해 ×1.35 곱증가 및 치명타 확률 +10%',
      apply(st) {
        st.multCritDmg = +(st.multCritDmg * 1.35).toFixed(3);
        st.critChance = Math.min(0.85, +(st.critChance + 0.1).toFixed(2));
      }
    },
    {
      id: 'mult_ret_power',
      kind: 'mult',
      badge: '곱증가 ×',
      name: '회귀 위상 증폭',
      desc: 'RET 잔상·역행 공격 위력 ×1.35 곱증가',
      apply(st) {
        st.multRet = +(st.multRet * 1.35).toFixed(3);
      }
    },

    // 2. 다음 능력 선택 분기점까지 즉시 레벨업
    {
      id: 'jump_to_next_choice',
      kind: 'jump',
      badge: '레벨 도약',
      name: '타임 리프 (Time Leap)',
      desc: '다음 능력 선택 레벨까지 즉시 레벨업 및 누적 스탯 획득',
      apply(st, api) {
        api.jumpToNextChoiceLevel();
      }
    },
    {
      id: 'jump_plus_two',
      kind: 'jump',
      badge: '레벨 도약',
      name: '파라독스 점프',
      desc: '즉시 +2 레벨 상승 및 해당 레벨 기본 능력치 일괄 반영',
      apply(st, api) {
        api.gainLevels(2, true);
      }
    },

    // 3. 체스 기물 모티브 & RET 공격 추가/강화
    {
      id: 'atk_rook',
      kind: 'attack',
      spriteKey: 'rook',
      badge: '룩(ROOK) 공격',
      name: '룩 직선 참격빔',
      desc: '매 1초마다 상·하·좌·우 직선 라인에 참격 발사 (없으면 획득, 있으면 위력 +35%)',
      apply(st) {
        st.attacks.rook = (st.attacks.rook || 0) + 1;
      }
    },
    {
      id: 'atk_bishop',
      kind: 'attack',
      spriteKey: 'bishop',
      badge: '비숍(BISHOP) 공격',
      name: '비숍 대각 프리즘',
      desc: '매 1초마다 4개 대각선 방향으로 광선 발사 (없으면 획득, 있으면 위력 +35%)',
      apply(st) {
        st.attacks.bishop = (st.attacks.bishop || 0) + 1;
      }
    },
    {
      id: 'atk_knight',
      kind: 'attack',
      spriteKey: 'knight',
      badge: '나이트(KNIGHT) 공격',
      name: '나이트 L자 충격파',
      desc: '매 1초마다 L자(나이트) 오프셋 지점에 충격파 타격 (없으면 획득, 있으면 위력 +40%)',
      apply(st) {
        st.attacks.knight = (st.attacks.knight || 0) + 1;
      }
    },
    {
      id: 'atk_queen',
      kind: 'attack',
      spriteKey: 'queen',
      badge: '퀸(QUEEN) 공격',
      name: '퀸 전방위 왕관파',
      desc: '2초마다 주변 8방향 전방위 파동 방출 (없으면 획득, 있으면 위력 +40%)',
      apply(st) {
        st.attacks.queen = (st.attacks.queen || 0) + 1;
      }
    },
    {
      id: 'atk_ret_echo',
      kind: 'attack',
      spriteKey: 'retEchoStrike',
      badge: 'RET 공격',
      name: '회귀 잔상 공명(RET)',
      desc: '2초 전 위치의 RET 잔상에서도 동시 파동 공격 (없으면 획득, 있으면 위력 +40%)',
      apply(st) {
        st.attacks.retEcho = (st.attacks.retEcho || 0) + 1;
      }
    },
    {
      id: 'atk_ret_wave',
      kind: 'attack',
      spriteKey: 'retRewindWave',
      badge: 'RET 공격',
      name: '역행 펄스(RET-WAVE)',
      desc: '3초마다 주변 적에게 시간 역행 피해 및 1칸 밀어내기 (없으면 획득, 있으면 강화)',
      apply(st) {
        st.attacks.retWave = (st.attacks.retWave || 0) + 1;
      }
    },

    // 4. 이동 기동 확장 & 방어/귀환 스킬 추가/강화
    {
      id: 'move_knight_leap',
      kind: 'defense',
      badge: '체스 기동',
      name: '나이트 도약 기동',
      desc: '체스 나이트(L자) 칸으로도 이동 가능 (없으면 해금, 있으면 도약 추가타)',
      apply(st) {
        st.moveModes.knight = (st.moveModes.knight || 0) + 1;
      }
    },
    {
      id: 'move_line_dash',
      kind: 'defense',
      badge: '체스 기동',
      name: '룩·비숍 2칸 활주',
      desc: '직선·대각선 2칸 이동 칸 추가 해금 (없으면 해금, 있으면 사거리 +1)',
      apply(st) {
        st.moveModes.dashRange = (st.moveModes.dashRange || 0) + 1;
      }
    },
    {
      id: 'def_return_3s',
      kind: 'defense',
      badge: 'RET 방어',
      name: '3초 전 귀환(3S RETURN)',
      desc: '체력이 0이 되거나 위기 시 3초 전 위치·체력으로 자동 회귀 (쿨다운 8초)',
      apply(st) {
        st.defenses.return3s = (st.defenses.return3s || 0) + 1;
        st.returnCooldown = 0;
      }
    },
    {
      id: 'def_chrono_slow',
      kind: 'defense',
      badge: '방어/제어',
      name: '시간 둔화 장판',
      desc: '인접 적의 이동을 지연시켜 2초마다 1칸 이동하도록 감속',
      apply(st) {
        st.defenses.chronoSlow = (st.defenses.chronoSlow || 0) + 1;
      }
    },
    {
      id: 'def_aegis_shield',
      kind: 'defense',
      badge: '방어/보호막',
      name: '에기스 실드',
      desc: '4초마다 보호막을 생성해 피해를 먼저 흡수 (강화 시 보호막량 증가)',
      apply(st) {
        st.defenses.aegis = (st.defenses.aegis || 0) + 1;
        st.shield = Math.max(st.shield, getShieldGain(st));
      }
    },
    {
      id: 'def_thorn_gear',
      kind: 'defense',
      badge: '방어/반사',
      name: '가시 톱니 방패',
      desc: '피격 시 주변 적에게 반사 피해 및 방어력 +2',
      apply(st) {
        st.defenses.thorn = (st.defenses.thorn || 0) + 1;
        st.baseArmor += 2;
      }
    }
  ];

  function getMaxHp(st) {
    return Math.max(20, Math.round(st.baseMaxHp * st.multHp));
  }

  function getAtk(st) {
    return Math.max(5, Math.round(st.baseAtk * st.multAtk));
  }

  function getShieldGain(st) {
    const lv = st.defenses.aegis || 0;
    if (lv <= 0) return 0;
    return Math.round((12 + lv * 8 + st.level * 1.5) * st.multHp);
  }

  function xpRequiredForLevel(lv) {
    return Math.round(24 + lv * 11 + Math.pow(lv, 1.35) * 2.2);
  }

  function createInitialState() {
    const startX = Math.floor(BOARD_SIZE / 2);
    const startY = Math.floor(BOARD_SIZE / 2);
    const st = {
      status: 'playing', // 'playing' | 'choosing' | 'victory' | 'gameover'
      sec: 0,
      level: 1,
      xp: 0,
      kills: 0,
      x: startX,
      y: startY,
      lastAction: 'move', // 'idle' | 'move'
      baseMaxHp: 100,
      baseAtk: 14,
      baseArmor: 2,
      multAtk: 1,
      multHp: 1,
      multCritDmg: 1.5,
      multRet: 1,
      critChance: 0.12,
      hp: 100,
      shield: 0,
      returnCooldown: 0,
      diceLeft: MAX_DICE,
      choiceQueue: [],
      pendingChoices: null,
      pickedHistory: [],
      attacks: {
        rook: 1, // 기본 룩 참격 1개 보유
        bishop: 0,
        knight: 0,
        queen: 0,
        retEcho: 0,
        retWave: 0
      },
      moveModes: {
        knight: 0,
        dashRange: 0
      },
      defenses: {
        return3s: 0,
        chronoSlow: 0,
        aegis: 0,
        thorn: 0
      },
      history: [
        { sec: 0, x: startX, y: startY, hp: 100, shield: 0 }
      ],
      enemies: [],
      fxCells: new Map(), // "x,y" -> { color, label, ttl }
      logs: ['[0s] SEC-RET 기동 완료. 이동할 칸을 선택해 1초를 진행하세요.']
    };
    st.hp = getMaxHp(st);
    st.history[0].hp = st.hp;
    spawnInitialEnemies(st);
    return st;
  }

  function pushLog(st, msg) {
    st.logs.unshift(msg);
    if (st.logs.length > 6) st.logs.length = 6;
  }

  function markFx(st, x, y, color, text = '') {
    if (x < 0 || y < 0 || x >= BOARD_SIZE || y >= BOARD_SIZE) return;
    st.fxCells.set(`${x},${y}`, { color, text, ttl: 1 });
  }

  function getEnemyAt(st, x, y) {
    return st.enemies.find(e => e.hp > 0 && e.x === x && e.y === y) || null;
  }

  function getMoveTargets(st) {
    const targets = new Map();
    const addTarget = (nx, ny, mode) => {
      if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) return;
      if (nx === st.x && ny === st.y) return;
      if (getEnemyAt(st, nx, ny)) return;
      const key = `${nx},${ny}`;
      if (!targets.has(key)) {
        targets.set(key, { x: nx, y: ny, mode });
      }
    };

    // 기본 8방향 인접 이동
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        addTarget(st.x + dx, st.y + dy, 'step');
      }
    }

    // 직선·대각선 활주(2~3칸)
    const dashSteps = st.moveModes.dashRange > 0 ? Math.min(3, 1 + st.moveModes.dashRange) : 0;
    if (dashSteps >= 2) {
      const dirs = [
        [1, 0], [-1, 0], [0, 1], [0, -1],
        [1, 1], [1, -1], [-1, 1], [-1, -1]
      ];
      for (const [dx, dy] of dirs) {
        for (let step = 2; step <= dashSteps; step++) {
          const nx = st.x + dx * step;
          const ny = st.y + dy * step;
          if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) break;
          if (getEnemyAt(st, nx, ny)) break;
          addTarget(nx, ny, 'dash');
        }
      }
    }

    // 나이트(L자) 도약 이동
    if (st.moveModes.knight > 0) {
      const jumps = [
        [2, 1], [2, -1], [-2, 1], [-2, -1],
        [1, 2], [1, -2], [-1, 2], [-1, -2]
      ];
      for (const [dx, dy] of jumps) {
        addTarget(st.x + dx, st.y + dy, 'knight');
      }
    }

    return Array.from(targets.values());
  }

  function makeEnemy(st, forceType = null) {
    const edges = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      edges.push([i, 0], [i, BOARD_SIZE - 1], [0, i], [BOARD_SIZE - 1, i]);
    }
    const freeEdges = edges.filter(([ex, ey]) => !(ex === st.x && ey === st.y) && !getEnemyAt(st, ex, ey));
    if (freeEdges.length === 0) return null;
    const [x, y] = freeEdges[Math.floor(Math.random() * freeEdges.length)];

    let type = forceType;
    if (!type) {
      const r = Math.random();
      if (st.sec >= 18 && r < 0.22) type = 'rook';
      else if (st.sec >= 12 && r < 0.45) type = 'bishop';
      else if (st.sec >= 6 && r < 0.7) type = 'knight';
      else type = 'pawn';
    }

    const scale = 1 + (st.level - 1) * 0.14 + st.sec * 0.015;
    const configs = {
      pawn: { hp: 20, atk: 6, xp: 10, moveEvery: 1 },
      knight: { hp: 32, atk: 9, xp: 15, moveEvery: 1 },
      bishop: { hp: 38, atk: 11, xp: 18, moveEvery: 1 },
      rook: { hp: 56, atk: 14, xp: 24, moveEvery: 1 },
      boss: { hp: 140, atk: 20, xp: 60, moveEvery: 1 }
    };
    const cfg = configs[type] || configs.pawn;
    return {
      id: `${st.sec}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      x,
      y,
      maxHp: Math.round(cfg.hp * scale),
      hp: Math.round(cfg.hp * scale),
      atk: Math.max(2, Math.round(cfg.atk * (1 + (st.level - 1) * 0.08 + st.sec * 0.008))),
      xp: cfg.xp,
      moveEvery: cfg.moveEvery,
      stepAccum: 0
    };
  }

  function spawnInitialEnemies(st) {
    for (let i = 0; i < 3; i++) {
      const e = makeEnemy(st, i === 0 ? 'pawn' : null);
      if (e) st.enemies.push(e);
    }
  }

  function rollAbilityChoices(st) {
    const pool = ABILITY_POOL.slice();
    const picks = [];
    while (picks.length < 3 && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      picks.push(pool.splice(idx, 1)[0]);
    }
    return picks;
  }

  function applyLevelUpStatGrowth(st, levelsCount) {
    if (levelsCount <= 0) return;
    st.baseMaxHp += 8 * levelsCount;
    st.baseAtk += 2 * levelsCount;
    if (st.level % 3 === 0) {
      st.baseArmor += 1;
    }
    const maxHp = getMaxHp(st);
    st.hp = Math.min(maxHp, st.hp + 10 * levelsCount);
  }

  function triggerLevelUp(st, count = 1) {
    for (let i = 0; i < count; i++) {
      if (st.level >= MAX_LEVEL) {
        st.level = MAX_LEVEL;
        break;
      }
      st.level += 1;
      applyLevelUpStatGrowth(st, 1);
      if (CHOICE_LEVELS.has(st.level)) {
        st.choiceQueue.push(st.level);
      }
    }
  }

  function flushChoiceQueue(st) {
    if (st.status === 'gameover' || st.status === 'victory') return;
    if (st.pendingChoices) return;
    if (st.choiceQueue.length > 0) {
      const lv = st.choiceQueue.shift();
      st.pendingChoices = rollAbilityChoices(st);
      st.status = 'choosing';
      pushLog(st, `[Lv.${lv}] 능력 분기점 도달! 3개 중 1개를 선택하세요.`);
    }
  }

  function getNextChoiceLevelAfter(currentLv) {
    for (let lv = currentLv + 1; lv <= MAX_LEVEL; lv++) {
      if (CHOICE_LEVELS.has(lv)) return lv;
    }
    return MAX_LEVEL;
  }

  function damageEnemy(st, enemy, rawDmg, color = '#ff2a6d', label = '') {
    if (!enemy || enemy.hp <= 0) return;
    const isCrit = Math.random() < st.critChance;
    const dmg = Math.max(1, Math.round(rawDmg * (isCrit ? st.multCritDmg : 1)));
    enemy.hp -= dmg;
    markFx(st, enemy.x, enemy.y, isCrit ? '#ffe600' : color, label || (isCrit ? `${dmg}!` : `${dmg}`));

    if (enemy.hp <= 0) {
      enemy.hp = 0;
      st.kills += 1;
      st.xp += enemy.xp;
      while (st.level < MAX_LEVEL && st.xp >= xpRequiredForLevel(st.level)) {
        st.xp -= xpRequiredForLevel(st.level);
        triggerLevelUp(st, 1);
      }
    }
  }

  function applyDamageToHero(st, rawIncoming, fromEnemy = null) {
    if (st.status !== 'playing' && st.status !== 'choosing') return;
    let dmg = Math.max(1, rawIncoming - st.baseArmor);

    if (st.shield > 0) {
      const absorbed = Math.min(st.shield, dmg);
      st.shield -= absorbed;
      dmg -= absorbed;
      markFx(st, st.x, st.y, '#05d9e8', `SHD -${absorbed}`);
    }

    if (dmg > 0) {
      st.hp = Math.max(0, st.hp - dmg);
      markFx(st, st.x, st.y, '#ff4757', `-${dmg}`);
    }

    // 가시 톱니 반사 피해
    if (st.defenses.thorn > 0 && fromEnemy && fromEnemy.hp > 0) {
      const thornDmg = Math.max(4, Math.round(getAtk(st) * 0.45 * st.defenses.thorn));
      damageEnemy(st, fromEnemy, thornDmg, '#a29bfe', `THN ${thornDmg}`);
    }

    // 3초 전 귀환(3S RETURN) 발동 판정
    if (st.hp <= 0 && st.defenses.return3s > 0 && st.returnCooldown <= 0) {
      const snapIdx = Math.max(0, st.history.length - 1 - 3);
      const snap = st.history[snapIdx] || st.history[0];
      const restoreHp = Math.max(Math.round(getMaxHp(st) * 0.65), snap.hp);
      st.x = snap.x;
      st.y = snap.y;
      st.hp = Math.min(getMaxHp(st), restoreHp);
      st.shield = Math.max(st.shield, snap.shield || 0);
      st.returnCooldown = Math.max(4, 9 - st.defenses.return3s);
      markFx(st, st.x, st.y, '#39ff14', 'RETURN 3S!');
      pushLog(st, `[${st.sec}s] 3S RETURN 발동! ${snap.sec}s 시점으로 회귀했습니다.`);
      return;
    }

    if (st.hp <= 0) {
      st.hp = 0;
      st.status = 'gameover';
      pushLog(st, `[${st.sec}s] 기물 파괴! (도달 Lv.${st.level}, 처치 ${st.kills})`);
    }
  }

  function runAttacksForTurn(st, playTone) {
    const baseAtk = getAtk(st);
    const dirs4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const diag4 = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    const knight8 = [
      [2, 1], [2, -1], [-2, 1], [-2, -1],
      [1, 2], [1, -2], [-1, 2], [-1, -2]
    ];

    // 1) 룩(Rook): 4방향 직선 참격
    if (st.attacks.rook > 0) {
      const dmg = Math.round(baseAtk * (0.85 + (st.attacks.rook - 1) * 0.35));
      for (const [dx, dy] of dirs4) {
        for (let r = 1; r <= 3; r++) {
          const tx = st.x + dx * r;
          const ty = st.y + dy * r;
          if (tx < 0 || ty < 0 || tx >= BOARD_SIZE || ty >= BOARD_SIZE) break;
          markFx(st, tx, ty, '#ff2a6d');
          const hit = getEnemyAt(st, tx, ty);
          if (hit) damageEnemy(st, hit, dmg, '#ff2a6d');
        }
      }
    }

    // 2) 비숍(Bishop): 4개 대각선 프리즘
    if (st.attacks.bishop > 0) {
      const dmg = Math.round(baseAtk * (0.9 + (st.attacks.bishop - 1) * 0.35));
      for (const [dx, dy] of diag4) {
        for (let r = 1; r <= 3; r++) {
          const tx = st.x + dx * r;
          const ty = st.y + dy * r;
          if (tx < 0 || ty < 0 || tx >= BOARD_SIZE || ty >= BOARD_SIZE) break;
          markFx(st, tx, ty, '#a29bfe');
          const hit = getEnemyAt(st, tx, ty);
          if (hit) damageEnemy(st, hit, dmg, '#a29bfe');
        }
      }
    }

    // 3) 나이트(Knight): L자 충격파
    if (st.attacks.knight > 0) {
      const dmg = Math.round(baseAtk * (1.1 + (st.attacks.knight - 1) * 0.4));
      for (const [dx, dy] of knight8) {
        const tx = st.x + dx;
        const ty = st.y + dy;
        if (tx < 0 || ty < 0 || tx >= BOARD_SIZE || ty >= BOARD_SIZE) continue;
        markFx(st, tx, ty, '#ff9f43');
        const hit = getEnemyAt(st, tx, ty);
        if (hit) damageEnemy(st, hit, dmg, '#ff9f43');
      }
    }

    // 4) 퀸(Queen): 2초마다 8방향 왕관파
    if (st.attacks.queen > 0 && st.sec % 2 === 0) {
      const dmg = Math.round(baseAtk * (1.15 + (st.attacks.queen - 1) * 0.4));
      for (const [dx, dy] of [...dirs4, ...diag4]) {
        const tx = st.x + dx;
        const ty = st.y + dy;
        markFx(st, tx, ty, '#ffe600');
        const hit = getEnemyAt(st, tx, ty);
        if (hit) damageEnemy(st, hit, dmg, '#ffe600');
      }
    }

    // 5) RET 잔상 공명(2초 전 위치 잔상에서 4방향 타격)
    if (st.attacks.retEcho > 0) {
      const echoSnap = st.history[Math.max(0, st.history.length - 1 - 2)];
      if (echoSnap) {
        const echoDmg = Math.round(baseAtk * st.multRet * (0.85 + (st.attacks.retEcho - 1) * 0.35));
        markFx(st, echoSnap.x, echoSnap.y, '#00f5d4', 'RET');
        for (const [dx, dy] of dirs4) {
          const tx = echoSnap.x + dx;
          const ty = echoSnap.y + dy;
          markFx(st, tx, ty, '#00f5d4');
          const hit = getEnemyAt(st, tx, ty);
          if (hit) damageEnemy(st, hit, echoDmg, '#00f5d4');
        }
      }
    }

    // 6) RET 역행 펄스(3초마다 주변 1칸 적 밀어내기 + 피해)
    if (st.attacks.retWave > 0 && st.sec % 3 === 0) {
      const waveDmg = Math.round(baseAtk * st.multRet * (1.0 + (st.attacks.retWave - 1) * 0.4));
      for (const [dx, dy] of [...dirs4, ...diag4]) {
        const tx = st.x + dx;
        const ty = st.y + dy;
        const hit = getEnemyAt(st, tx, ty);
        if (hit) {
          damageEnemy(st, hit, waveDmg, '#39ff14', 'RET!');
          const pushX = hit.x + dx;
          const pushY = hit.y + dy;
          if (
            hit.hp > 0 &&
            pushX >= 0 && pushY >= 0 && pushX < BOARD_SIZE && pushY < BOARD_SIZE &&
            !(pushX === st.x && pushY === st.y) &&
            !getEnemyAt(st, pushX, pushY)
          ) {
            hit.x = pushX;
            hit.y = pushY;
          }
        }
      }
    }

    st.enemies = st.enemies.filter(e => e.hp > 0);
    if (typeof playTone === 'function') {
      playTone('click');
    }
  }

  function stepEnemiesOneSec(st) {
    const slowActive = st.defenses.chronoSlow > 0;
    const moveThreshold = slowActive ? 2 : 1;

    for (const e of st.enemies) {
      if (e.hp <= 0) continue;
      e.stepAccum += 1;
      if (e.stepAccum < moveThreshold) continue;
      e.stepAccum = 0;

      const dx = st.x - e.x;
      const dy = st.y - e.y;
      const dist = Math.max(Math.abs(dx), Math.abs(dy));

      // 인접(1칸 이내) 시 공격
      if (dist <= 1) {
        applyDamageToHero(st, e.atk, e);
        if (st.status === 'gameover') return;
        continue;
      }

      const stepX = dx === 0 ? 0 : dx / Math.abs(dx);
      const stepY = dy === 0 ? 0 : dy / Math.abs(dy);
      const candidates = [
        [e.x + stepX, e.y + stepY],
        [e.x + stepX, e.y],
        [e.x, e.y + stepY]
      ];

      for (const [nx, ny] of candidates) {
        if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) continue;
        if (nx === st.x && ny === st.y) {
          applyDamageToHero(st, e.atk, e);
          if (st.status === 'gameover') return;
          break;
        }
        if (!getEnemyAt(st, nx, ny)) {
          e.x = nx;
          e.y = ny;
          break;
        }
      }
    }

    // 스폰 주기: 초반 2초마다, 이후 1초마다 적 추가
    const aliveCount = st.enemies.filter(e => e.hp > 0).length;
    const maxCap = Math.min(14, 5 + Math.floor(st.level / 2));
    if (aliveCount < maxCap && (st.sec % 2 === 1 || st.level >= 5)) {
      const forceBoss = st.sec > 0 && st.sec % 30 === 0;
      const spawned = makeEnemy(st, forceBoss ? 'boss' : null);
      if (spawned) st.enemies.push(spawned);
    }
  }

  function renderSecretGame({ stage, icons, playTone, esc, setCleanup }) {
    const spriteBank = (window.GamePackModules && window.GamePackModules.secretSprites) || {
      hero: {},
      attacks: {},
      enemies: {},
      abilities: {}
    };

    let state = createInitialState();
    let busyTurn = false;
    let timers = [];
    let destroyed = false;

    const clearTimers = () => {
      timers.forEach(id => clearTimeout(id));
      timers = [];
    };

    const schedule = (fn, delay) => {
      const id = setTimeout(() => {
        if (destroyed) return;
        fn();
      }, delay);
      timers.push(id);
      return id;
    };

    setCleanup(() => {
      destroyed = true;
      clearTimers();
    });

    const jumpApi = {
      gainLevels(n, allowChoiceTrigger) {
        if (n <= 0) return;
        const prevChoiceQueue = state.choiceQueue.slice();
        triggerLevelUp(state, n);
        if (!allowChoiceTrigger) {
          state.choiceQueue = prevChoiceQueue;
        }
      },
      jumpToNextChoiceLevel() {
        const targetLv = getNextChoiceLevelAfter(state.level);
        if (targetLv > state.level) {
          const diff = targetLv - state.level;
          triggerLevelUp(state, diff);
          pushLog(state, `[TIME LEAP] Lv.${targetLv} 분기점까지 단숨에 도약!`);
        }
      }
    };

    function advanceOneSecond(targetX, targetY) {
      if (busyTurn || state.status !== 'playing') return;
      const validTargets = getMoveTargets(state);
      const chosen = validTargets.find(t => t.x === targetX && t.y === targetY);
      if (!chosen) return;

      busyTurn = true;
      clearTimers();
      state.fxCells.clear();

      // Step 1 (+1 SEC): 이동 및 시간 경과
      state.sec += 1;
      state.x = chosen.x;
      state.y = chosen.y;
      state.lastAction = 'move';
      if (state.returnCooldown > 0) state.returnCooldown -= 1;

      state.history.push({
        sec: state.sec,
        x: state.x,
        y: state.y,
        hp: state.hp,
        shield: state.shield
      });
      if (state.history.length > 8) state.history.shift();

      if (state.defenses.aegis > 0 && state.sec % 4 === 0) {
        const gain = getShieldGain(state);
        state.shield = Math.max(state.shield, gain);
        markFx(state, state.x, state.y, '#05d9e8', `+SHD ${gain}`);
      }

      if (typeof playTone === 'function') playTone('click');
      paint();

      // Step 2 (+340ms): 체스 공격 및 RET 잔상 발동
      schedule(() => {
        if (state.status === 'gameover') {
          busyTurn = false;
          paint();
          return;
        }
        runAttacksForTurn(state, playTone);
        paint();

        // Step 3 (+680ms): 적 1초 이동·공격·스폰 및 레벨 분기점 판정
        schedule(() => {
          if (state.status !== 'gameover') {
            stepEnemiesOneSec(state);
          }
          if (state.status !== 'gameover' && state.level >= MAX_LEVEL && state.sec >= 60) {
            state.status = 'victory';
            pushLog(state, `[${state.sec}s] Lv.30 & 60초 생존 달성! SEC-RET 마스터!`);
          }
          flushChoiceQueue(state);
          busyTurn = false;
          paint();
        }, STEP_MS);
      }, STEP_MS);
    }

    function selectAbility(index) {
      if (!state.pendingChoices || state.status !== 'choosing') return;
      const card = state.pendingChoices[index];
      if (!card) return;

      card.apply(state, jumpApi);
      state.pickedHistory.push(card.name);
      state.pendingChoices = null;
      state.status = 'playing';
      pushLog(state, `[선택] '${card.name}' 능력 적용 완료.`);

      if (typeof playTone === 'function') playTone('win');
      flushChoiceQueue(state);
      paint();
    }

    function rerollChoices() {
      if (!state.pendingChoices || state.status !== 'choosing') return;
      if (state.diceLeft <= 0) return;
      state.diceLeft -= 1;
      state.pendingChoices = rollAbilityChoices(state);
      if (typeof playTone === 'function') playTone('click');
      pushLog(state, `[DICE] 다이스를 굴려 새 능력을 불러왔습니다. (남은 다이스: ${state.diceLeft}/${MAX_DICE})`);
      paint();
    }

    function restartGame() {
      clearTimers();
      busyTurn = false;
      state = createInitialState();
      if (typeof playTone === 'function') playTone('click');
      paint();
    }

    function renderAbilitySummaryBar(st) {
      const atkBadges = [];
      if (st.attacks.rook > 0) atkBadges.push(`룩×${st.attacks.rook}`);
      if (st.attacks.bishop > 0) atkBadges.push(`비숍×${st.attacks.bishop}`);
      if (st.attacks.knight > 0) atkBadges.push(`나이트×${st.attacks.knight}`);
      if (st.attacks.queen > 0) atkBadges.push(`퀸×${st.attacks.queen}`);
      if (st.attacks.retEcho > 0) atkBadges.push(`RET잔상×${st.attacks.retEcho}`);
      if (st.attacks.retWave > 0) atkBadges.push(`RET역행×${st.attacks.retWave}`);

      const defBadges = [];
      if (st.defenses.return3s > 0) {
        defBadges.push(`3S귀환(${st.returnCooldown > 0 ? `${st.returnCooldown}s` : 'READY'})`);
      }
      if (st.defenses.chronoSlow > 0) defBadges.push(`둔화×${st.defenses.chronoSlow}`);
      if (st.defenses.aegis > 0) defBadges.push(`실드:${st.shield}`);
      if (st.defenses.thorn > 0) defBadges.push(`가시×${st.defenses.thorn}`);
      if (st.moveModes.knight > 0) defBadges.push(`L도약×${st.moveModes.knight}`);
      if (st.moveModes.dashRange > 0) defBadges.push(`활주+${st.moveModes.dashRange}`);

      return `
        <div class="sunken-box" style="margin-top:10px;padding:8px;background:#fffef5;font-size:0.74rem;">
          <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:4px;">
            <strong>공격(체스·RET):</strong>
            <span>${esc(atkBadges.join(' · ') || '없음')}</span>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:4px;">
            <strong>방어·기동·귀환:</strong>
            <span>${esc(defBadges.join(' · ') || '기본 인접 이동')}</span>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:10px;font-family:var(--font-mono,Consolas,monospace);color:#222;">
            <span>ATK:${getAtk(st)}(×${st.multAtk})</span>
            <span>MAXHP:${getMaxHp(st)}(×${st.multHp})</span>
            <span>ARM:${st.baseArmor}</span>
            <span>RET×:${st.multRet}</span>
            <span>처치:${st.kills}</span>
          </div>
        </div>
      `;
    }

    function renderChoiceOverlay(st) {
      if (st.status !== 'choosing' || !st.pendingChoices) return '';
      const diceIcon = spriteBank.abilities.dice || '';
      return `
        <div class="sunken-box gp-anim-pop" style="margin-top:10px;padding:10px;background:#ffe600;border:2.5px solid #111;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
            <div style="font-weight:900;font-size:0.84rem;">
              ${icons.star || ''} Lv.${st.level} 능력 분기점 — 3개 중 1개 선택
            </div>
            <button type="button" class="btn95 sm" id="secret-reroll-btn" ${st.diceLeft <= 0 ? 'disabled' : ''} style="display:inline-flex;align-items:center;gap:4px;">
              ${diceIcon}
              <span>다이스 (${st.diceLeft}/${MAX_DICE})</span>
            </button>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:8px;">
            ${st.pendingChoices.map((c, idx) => {
              const iconSvg =
                (c.spriteKey && spriteBank.attacks[c.spriteKey]) ||
                (c.kind === 'mult' && spriteBank.abilities.multStat) ||
                (c.kind === 'jump' && spriteBank.abilities.levelJump) ||
                (c.kind === 'attack' && spriteBank.abilities.attackMod) ||
                spriteBank.abilities.defenseMod ||
                '';
              return `
                <button type="button" class="btn95 secret-choice-btn" data-cidx="${idx}" style="text-align:left;padding:8px;background:#ffffff;display:flex;flex-direction:column;gap:4px;height:auto;white-space:normal;">
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;width:100%;">
                    <span style="display:inline-flex;align-items:center;gap:6px;font-weight:900;font-size:0.8rem;">
                      ${iconSvg}
                      <span>${esc(c.name)}</span>
                    </span>
                    <span class="tag-mini">${esc(c.badge)}</span>
                  </div>
                  <div style="font-size:0.72rem;line-height:1.35;color:#222;">${esc(c.desc)}</div>
                </button>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    function paint() {
      if (destroyed) return;
      const moveTargets = state.status === 'playing' && !busyTurn ? getMoveTargets(state) : [];
      const moveMap = new Map(moveTargets.map(t => [`${t.x},${t.y}`, t.mode]));
      const echoSnap = state.history.length >= 3 ? state.history[state.history.length - 3] : null;
      const needXp = xpRequiredForLevel(state.level);
      const xpPct = state.level >= MAX_LEVEL ? 100 : Math.min(100, Math.round((state.xp / needXp) * 100));
      const hpPct = Math.max(0, Math.min(100, Math.round((state.hp / getMaxHp(state)) * 100)));

      const clockIcon = spriteBank.abilities.clockSec || '';
      const heroSvg =
        (busyTurn ? spriteBank.hero.move : spriteBank.hero.idle) ||
        '<span style="font-weight:900;">R</span>';
      const echoSvg = spriteBank.hero.retEcho || '';

      let bannerHtml = '';
      if (state.status === 'gameover') {
        bannerHtml = `
          <div class="sunken-box gp-anim-pop" style="margin-top:10px;padding:10px;background:#ffd1d6;border:2px solid #111;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
            <div>
              <strong style="font-size:0.86rem;">GAME OVER — ${state.sec}초 생존 / Lv.${state.level}</strong>
              <div style="font-size:0.75rem;">처치 ${state.kills}기 · 다시 시작해 30레벨에 도전하세요.</div>
            </div>
            <button type="button" class="btn95 yellow sm" id="secret-restart-btn">새 게임 시작</button>
          </div>
        `;
      } else if (state.status === 'victory') {
        bannerHtml = `
          <div class="sunken-box gp-anim-pop" style="margin-top:10px;padding:10px;background:#d8ffdc;border:2px solid #111;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
            <div>
              <strong style="font-size:0.86rem;">${icons.trophy || ''} SEC-RET 클리어 — ${state.sec}초 / Lv.${state.level}</strong>
              <div style="font-size:0.75rem;">계속 이동하여 기록을 늘리거나 새 게임을 시작할 수 있습니다.</div>
            </div>
            <button type="button" class="btn95 yellow sm" id="secret-restart-btn">새 게임 시작</button>
          </div>
        `;
      }

      const cellsHtml = [];
      for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
          const isDark = (x + y) % 2 === 1;
          const isHero = state.x === x && state.y === y;
          const isEcho = !isHero && echoSnap && echoSnap.x === x && echoSnap.y === y && state.attacks.retEcho > 0;
          const enemy = getEnemyAt(state, x, y);
          const moveMode = moveMap.get(`${x},${y}`);
          const fx = state.fxCells.get(`${x},${y}`);

          let bg = isDark ? '#9fb3a8' : '#f4f1e4';
          let borderStyle = '1px solid #4a5550';
          let cursor = 'default';
          let dataAttr = '';

          if (moveMode) {
            cursor = 'pointer';
            bg = moveMode === 'knight' ? '#ffeaa7' : moveMode === 'dash' ? '#c7ecee' : '#d8ffdc';
            borderStyle = '2px solid #008000';
            dataAttr = `data-mx="${x}" data-my="${y}"`;
          }

          let inner = '';
          if (isEcho) {
            inner += `<div style="position:absolute;inset:2px;display:flex;align-items:center;justify-content:center;pointer-events:none;">${echoSvg}</div>`;
          }
          if (enemy) {
            const eSvg = spriteBank.enemies[enemy.type] || spriteBank.enemies.pawn || '';
            inner += `
              <div style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;line-height:1;">
                <div style="width:24px;height:24px;">${eSvg}</div>
                <span style="font-size:0.62rem;font-weight:900;background:#111;color:#fff;padding:0 3px;">${enemy.hp}</span>
              </div>
            `;
          }
          if (isHero) {
            inner += `
              <div style="position:relative;z-index:3;display:flex;flex-direction:column;align-items:center;line-height:1;">
                <div style="width:28px;height:28px;">${heroSvg}</div>
                <span style="font-size:0.62rem;font-weight:900;background:#000080;color:#ffe600;padding:0 3px;">RET</span>
              </div>
            `;
          } else if (moveMode && !enemy) {
            const dotColor = moveMode === 'knight' ? '#e67e22' : moveMode === 'dash' ? '#0984e3' : '#008000';
            inner += `<span style="width:8px;height:8px;border-radius:50%;background:${dotColor};opacity:0.75;pointer-events:none;"></span>`;
          }

          if (fx) {
            inner += `
              <div style="position:absolute;inset:0;z-index:4;background:${fx.color};opacity:0.32;pointer-events:none;"></div>
              ${fx.text ? `<span style="position:absolute;top:1px;right:2px;z-index:5;font-size:0.62rem;font-weight:900;color:#111;background:#fff;padding:0 2px;border:1px solid #111;pointer-events:none;">${esc(fx.text)}</span>` : ''}
            `;
          }

          cellsHtml.push(`
            <button
              type="button"
              ${dataAttr}
              ${moveMode ? '' : 'disabled'}
              style="position:relative;aspect-ratio:1/1;width:100%;background:${bg};border:${borderStyle};cursor:${cursor};display:flex;align-items:center;justify-content:center;padding:0;box-sizing:border-box;overflow:hidden;"
            >${inner}</button>
          `);
        }
      }

      stage.innerHTML = `
        <div class="box-head" style="margin-bottom:8px;">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <span style="display:inline-flex;align-items:center;gap:4px;font-weight:900;">
              ${clockIcon}
              <span>SEC-RET (${state.sec}초 경과)</span>
            </span>
            <span class="tag-mini">LV.${state.level}/${MAX_LEVEL}</span>
            <span class="tag-mini">DICE ${state.diceLeft}/${MAX_DICE}</span>
          </div>
          <button type="button" class="btn95 sm" id="secret-reset-top">초기화</button>
        </div>

        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:8px;font-size:0.74rem;font-weight:800;">
          <div class="sunken-box" style="padding:5px 7px;background:#fff;">
            <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
              <span>HP ${state.hp}/${getMaxHp(state)}</span>
              <span>SHD ${state.shield}</span>
            </div>
            <div style="height:8px;background:#e0e0e0;border:1px solid #111;">
              <div style="height:100%;width:${hpPct}%;background:#ff4757;"></div>
            </div>
          </div>
          <div class="sunken-box" style="padding:5px 7px;background:#fff;">
            <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
              <span>LV.${state.level} EXP</span>
              <span>${state.level >= MAX_LEVEL ? 'MAX' : `${state.xp}/${needXp}`}</span>
            </div>
            <div style="height:8px;background:#e0e0e0;border:1px solid #111;">
              <div style="height:100%;width:${xpPct}%;background:#05d9e8;"></div>
            </div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,210px);gap:10px;align-items:start;">
          <div style="display:grid;grid-template-columns:repeat(${BOARD_SIZE},minmax(0,1fr));border:3px solid #111;background:#111;max-width:390px;width:100%;">
            ${cellsHtml.join('')}
          </div>

          <div class="sunken-box" style="padding:8px;background:#fff;font-size:0.73rem;">
            <div style="font-weight:900;margin-bottom:5px;border-bottom:1px solid #808080;padding-bottom:3px;">턴 조작 안내</div>
            <div style="margin-bottom:6px;line-height:1.4;">
              • <strong>초록/하늘/주황 칸</strong> 클릭 시 <strong>+1초</strong> 진행<br>
              • 이동 칸 선택 &amp; 분기점 능력 선택만 가능
            </div>
            <div style="font-weight:900;margin-bottom:4px;border-bottom:1px solid #808080;padding-bottom:3px;">초시계 로그</div>
            <div style="display:flex;flex-direction:column;gap:3px;font-family:var(--font-mono,Consolas,monospace);font-size:0.69rem;max-height:165px;overflow-y:auto;">
              ${state.logs.map(l => `<div>${esc(l)}</div>`).join('')}
            </div>
          </div>
        </div>

        ${renderChoiceOverlay(state)}
        ${bannerHtml}
        ${renderAbilitySummaryBar(state)}
      `;

      stage.querySelectorAll('[data-mx][data-my]').forEach(btn => {
        btn.addEventListener('click', () => {
          const mx = Number(btn.dataset.mx);
          const my = Number(btn.dataset.my);
          advanceOneSecond(mx, my);
        });
      });

      stage.querySelectorAll('.secret-choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.dataset.cidx);
          selectAbility(idx);
        });
      });

      const rerollBtn = stage.querySelector('#secret-reroll-btn');
      if (rerollBtn) rerollBtn.addEventListener('click', rerollChoices);

      const restartBtn = stage.querySelector('#secret-restart-btn');
      if (restartBtn) restartBtn.addEventListener('click', restartGame);

      const resetTopBtn = stage.querySelector('#secret-reset-top');
      if (resetTopBtn) resetTopBtn.addEventListener('click', restartGame);
    }

    paint();
  }

  window.GamePackModules.secret = {
    id: 'secret',
    title: 'SEC-RET // RETURN DEFENSE',
    render: renderSecretGame
  };
})();

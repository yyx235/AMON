'use strict';
/* ===== 奶蛙工厂 · 游戏逻辑 ===== */

var G = {
  scene: 'factory',           // 'factory' | 'play'
  state: 'menu',              // menu / play / paused / settings / dex / clear / over / angryPause / rareShow / overAnim
  mode: 'normal',             // 'normal' 普通关卡 | 'infinite' 无限模式（关卡无上限、分数跨关累计、目标涨幅递增）
  reached: false,             // 无限模式：本关是否已达标（达标只提示，倒计时归零才结算）
  infPrevN: 0, infPrevT: 0, levelStartScore: 0,   // 无限模式：推进状态 / 进入本关时的分数
  tight: false,               // 无限模式：密集摆放（场地能塞更多奶蛙）
  level: 1, score: 0, target: 800,
  time: LEVEL_TIME, timeMax: LEVEL_TIME,
  items: [], fx: [], parts: [],
  shake: 0,
  claw: { angle: 0, len: MINLEN, st: 'swing', phase: Math.random() * 6.28, item: null },
  deco: [],
  planeX: 100, planeDir: 1, planeY: 60,
  odAngry: 0,
  missCount: 0,
  dandanX: 375, dandanY: 114, dandanJump: 0, dandanFaceDead: false,
  bomb: null,
  angryState: null,
  rareShowTimer: 0,
  difficulty: 'easy',
  pivotT: 0,
  rockUnit: 5, rockCount: 0, iceMeltRate: 0,
  laughClock: 0
};

var settingsPrevState = 'menu';
var dexPrevState = 'menu';

/* ===== 关卡生成 ===== */
function genDeco(){
  G.deco = [];
  for(var i = 0; i < 34; i++){
    G.deco.push({
      x: rand(10, W - 10), y: rand(SOIL_TOP + 20, H - 20), r: rand(2, 7),
      c: Math.random() < 0.5 ? 'rgba(255,214,120,0.10)' : 'rgba(30,15,5,0.28)'
    });
  }
  for(var k = 0; k < 7; k++){
    G.deco.push({ x: rand(60, W - 60), y: rand(SOIL_TOP + 40, H - 60), r: 0, c: 'root',
      len: rand(30, 90), ang: rand(-0.6, 0.6) });
  }
}

/* 在随机位置放一个物品，避免互相重叠 */
function place(type, count){
  var cfg = ITEMCFG[type];
  for(var k = 0; k < count; k++){
    for(var tries = 0; tries < 400; tries++){
      var a;
      if(type === 'diamond' && !G.tight){
        a = (Math.random() < 0.5 ? -1 : 1) * rand(0.62, 0.98) * MAXA;
      } else {
        a = rand(-0.95, 0.95) * MAXA;
      }
      var cosA = Math.max(0.52, Math.cos(a));
      var lenMax = Math.min(MAXLEN - 24, (H - 46 - PIVOT.y) / cosA);
      if(lenMax < 150) lenMax = 150;
      var len = type === 'diamond' ? rand(lenMax * 0.82, lenMax * 0.98) : rand(160, lenMax);
      var x = PIVOT.x + Math.sin(a) * len;
      var y = PIVOT.y + cosA * len;
      if(y < SOIL_TOP + 85) continue;
      if(x - cfg.w / 2 < 8 || x + cfg.w / 2 > W - 8) continue;   /* 不贴左右边 */
      if(y + cfg.h / 2 > H - 12) continue;            /* 不卡底边 */
      var ok = true;
      var pad = G.tight ? 16 : 20;   /* 任务3：空隙加大（原4/14），钩子可自由穿过 */
      for(var j = 0; j < G.items.length; j++){
        var it = G.items[j];
        if(Math.hypot(it.x - x, it.y - y) < it.r + cfg.r + pad){ ok = false; break; }
      }
      if(ok){
        var item = { type: type, x: x, y: y, r: cfg.r, w: cfg.w, h: cfg.h,
                     value: cfg.value(), grabbed: false, collected: false };
        if(type === 'rock'){
          var offs = [];
          for(var m = 0; m < 7; m++) offs.push(0.72 + Math.random() * 0.28);
          item.offs = offs;
        }
        G.items.push(item);
        break;
      }
    }
  }
}

/* 摆放小矮人：专用的高容错摆放（先按较宽松间距摆，摆不满再用允许轻微重叠的间距补）
   ——矮人体积小、画在最上层，允许站得比奶蛙更紧凑，保证每关都能出 3~6 只 */
function placeDwarf(count){
  var cfg = ITEMCFG.dwarf;
  var placed = 0;
  for(var pass = 0; pass < 2 && placed < count; pass++){
    var sepBase = pass === 0 ? null : 4;   /* 第二遍：边距退到 4px（仍不重叠） */
    for(var k = placed; k < count; k++){
      for(var tries = 0; tries < 1200; tries++){
        var a = rand(-0.97, 0.97) * MAXA;
        var cosA = Math.max(0.5, Math.cos(a));
        var lenMax = Math.min(MAXLEN - 20, (H - 40 - PIVOT.y) / cosA);
        if(lenMax < 150) lenMax = 150;
        var len = rand(150, lenMax);
        var x = PIVOT.x + Math.sin(a) * len;
        var y = PIVOT.y + cosA * len;
        if(y < SOIL_TOP + 50) continue;
        if(x - cfg.w / 2 < 8 || x + cfg.w / 2 > W - 8) continue;   /* 矮人不贴左右边 */
        if(y + cfg.h / 2 > H - 12) continue;
        var ok = true;
        for(var j = 0; j < G.items.length; j++){
          var it = G.items[j];
          var sep = it.r + cfg.r + (sepBase == null ? 14 : sepBase);   /* 边到边留缝，杜绝重叠 */
          if(Math.hypot(it.x - x, it.y - y) < sep){ ok = false; break; }
        }
        if(ok){
          var mdir = Math.random() < 0.5 ? 1 : -1;
          G.items.push({ type: 'dwarf', x: x, y: y, r: cfg.r, w: cfg.w, h: cfg.h,
                         value: cfg.value(), grabbed: false, collected: false,
                         flip: mdir < 0,
                         /* 游走状态：dir=水平巡逻方向, speed=本只速度(30~38), cool=障碍折返冷却
                            （ty/turnT 已停用：仅水平移动，行固定） */
                         mv: { dir: mdir, speed: rand(DWARF_SPEED.min, DWARF_SPEED.max),
                               ty: y, turnT: rand(2.5, 5.5), cool: 0 },
                         walkPhase: rand(0, 6.28) });
          placed++;
          break;
        }
      }
    }
  }
  return placed;
}

/* 冰簇：每簇 1~3 块，初始尺寸随机；最大那簇融光后保留最小可见形体 */
function placeIce(cubes){
  var base = ICE_BASE[cubes];
  var ratio = rand(0.55, 1.0);
  for(var tries = 0; tries < 600; tries++){
    var a = rand(-0.95, 0.95) * MAXA;
    var cosA = Math.max(0.52, Math.cos(a));
    var lenMax = Math.min(MAXLEN - 24, (H - 46 - PIVOT.y) / cosA);
    if(lenMax < 160) lenMax = 160;
    var len = rand(lenMax * (0.55 + 0.15 * (3 - cubes)), lenMax * 0.99);
    var x = PIVOT.x + Math.sin(a) * len;
    var y = PIVOT.y + cosA * len;
    var w = base.w * ratio, h = base.h * ratio, r = base.r * ratio;
    if(x - w / 2 < 6 || x + w / 2 > W - 6) continue;
    if(y - h / 2 < SOIL_TOP + 40 || y + h / 2 > H - 16) continue;
    var ok = true;
    for(var j = 0; j < G.items.length; j++){
      var oit = G.items[j];
      if(Math.hypot(oit.x - x, oit.y - y) < oit.r + r + 16){ ok = false; break; }
    }
    if(!ok) continue;
    var it = { type: 'ice', cubes: cubes, x: x, y: y, r: r, w: w, h: h,
               baseW: base.w, baseH: base.h, baseR: base.r,
               initRatio: ratio, sizeRatio: ratio, isBiggest: false,
               unitValue: 0, value: 0, grabbed: false, collected: false };
    G.items.push(it);
    return it;
  }
  return null;
}

function spawnIce(){
  var clusters = Math.max(1, Math.ceil((G.rockCount || 2) / 2));
  var made = [];
  for(var ci = 0; ci < clusters; ci++){
    var it = placeIce(1 + Math.floor(Math.random() * 3));
    if(it) made.push(it);
  }
  if(!made.length) return;
  var biggest = made[0];
  made.forEach(function(m){ if(m.initRatio > biggest.initRatio) biggest = m; });
  biggest.isBiggest = true;
  var unit = G.rockUnit || 5;
  made.forEach(function(m){
    m.unitValue = m.cubes * ICE_PER_CUBE * 10 * unit;
    m.value = Math.round(m.unitValue * m.sizeRatio);
  });
}

/* 场上（不含会融化的冰块）总价值；skip 传类型名（逗号可多选）可再排除该类型；
   抱钻石奖励 diamondBonus 一并计入（钻石按原价 $600） */
function calcTotal(skip){
  var skips = skip ? String(skip).split(',') : null;
  var total = 0;
  G.items.forEach(function(it){
    if(it.type === 'ice') return;
    if(skips && skips.indexOf(it.type) >= 0) return;
    total += it.value + (it.diamondBonus || 0);
  });
  return total;
}

/* 按价值倍率重新结算场上物品价值（无限模式用）——已停用：无限模式物品价值不随关卡放大 */

/* 无限模式：第 n 关需要新抓到的分数——涨幅逐关变大（线性项 + 二次项） */
function infDelta(n){
  if(n <= 1) return 700;
  return 700 + (n - 1) * 20 + Math.round((n - 1) * (n - 2) * 1.6);
}

/* 生成一关（G.mode = 'infinite' 时按无限模式扩容 + 抬高目标） */
function genLevel(n){
  G.items = []; genDeco();
  SND.resetSpecial();

  var inf = (G.mode === 'infinite');
  /* 奖励关（任务4）：无限模式第 6/12/18…关有 REWARD_CHANCE 概率 → 全场只有钻石+奶娃
     公式：reward = inf && n % 6 === 0 && Math.random() < REWARD_CHANCE（概率常量在 data.js） */
  var reward = inf && (n % 6 === 0) && (Math.random() < REWARD_CHANCE);
  G.reward = reward;
  G.tight = inf;                                     /* 无限模式：密集摆放 */

  if(inf){
    /* 无限模式配比：奶娃总数恒定、屏幕留足空位，越往后高价值占比越高
         FROG_TOTAL = 10 只奶娃（任务3 对齐原作 ~18 件量级，不随关卡增加）
         big   = min(2 + floor((n-1)/4), 5)   每 4 关多 1 只大奶蛙($500)，上限 5
         tiny  = max(1, 3 - floor((n-1)/8))   每 8 关少 1 只极小奶蛙($50)，下限 1
         small = FROG_TOTAL - big - tiny       小奶蛙($100)自动补齐，总数恒定 */
    var FROG_TOTAL = 10;
    var bigN = Math.min(2 + Math.floor((n - 1) / 4), 5);
    var tinyN = Math.max(1, 3 - Math.floor((n - 1) / 8));
    var smallN = FROG_TOTAL - bigN - tinyN;
    place('small', smallN);
    place('tiny', tinyN);
    place('big', bigN);
  } else {
    /* 普通模式：奶蛙数量随关卡增加（原规则不变） */
    place('small', 2 + Math.min(n, 4));
    place('tiny', n >= 4 ? 2 : 1);
    place('big', Math.min(1 + Math.ceil(n / 2), 4));
  }

  /* 中等 / 困难：大奶蛙抱着钻石左右跑（奶蛙本身仍是 $500 档，钻石按 $600 单独加）；奖励关不抱钻 */
  if(!reward && G.difficulty !== 'easy'){
    G.items.forEach(function(it){
      if(it.type === 'big'){
        it.wander = { dir: Math.random() < 0.5 ? 1 : -1, range: 80, cx: it.x, speed: rand(30, 85) };
        it.holdsDiamond = true;
        it.diamondBonus = ITEMCFG.diamond.value();
      }
    });
  }

  place('diamond', reward ? (4 + Math.floor(Math.random() * 9)) : (inf ? 3 : (n >= 2 ? 2 : 1)));   /* 奖励关钻石 4~12 均匀随机 */
  place('rock', reward ? 0 : (inf ? Math.min(2 + Math.ceil(n / 1.5), 3) : Math.min(2 + Math.ceil(n / 1.5), 4)));

  var rockSum = 0, rockN = 0;
  G.items.forEach(function(it){ if(it.type === 'rock'){ rockSum += it.value; rockN++; } });
  G.rockUnit = rockN ? rockSum / rockN : 5;
  G.rockCount = rockN;
  if(!reward) spawnIce();

  /* ===== 问号袋（两模式的物品池都加，低概率、限量）=====
     价值在生成这一刻就随机定死 1~800 存在实体上，deliver 才揭晓；
     不计入过关目标（玩家开袋前不知道价值，不能让目标随未知价值浮动）。
     普通模式：35% 概率每关至多 1 个（轻量）；
     无限模式：60% 概率出 1 个，其中 30% 追加第 2 个 → 每关 0~2 个。 */
  if(inf){
    if(!reward && Math.random() < 0.6) place('bag', Math.random() < 0.3 ? 2 : 1);
  } else {
    if(!reward && Math.random() < 0.35) place('bag', 1);
  }

  /* 稀有奶蛙：优先挑还没收集到的；两遍摆放——先按宽松间距，摆不下再收紧，
     保证每关都能出（它带「新图鉴 +50%」加成，掉不得） */
  var dex = loadDex();
  var ungot = RARE.filter(function(r){ return dex.indexOf(r.id) < 0; });
  var chosen = ungot.length ? ungot[Math.floor(Math.random() * ungot.length)]
                            : RARE[Math.floor(Math.random() * RARE.length)];
  for(var pass = 0; pass < 2; pass++){
    var gap = pass === 0 ? 50 : 18;
    for(var rt = 0; rt < 500; rt++){
      var ra = rand(-0.95, 0.95) * MAXA;
      var rcos = Math.max(0.52, Math.cos(ra));
      var rlenMax = Math.min(MAXLEN - 24, (H - 46 - PIVOT.y) / rcos);
      if(rlenMax < 150) rlenMax = 150;
      var rlen = rand(160, rlenMax);
      var rx = PIVOT.x + Math.sin(ra) * rlen;
      var ry = PIVOT.y + rcos * rlen;
      if(ry < SOIL_TOP + 85) continue;
      if(rx - 36 < 8 || rx + 36 > W - 8) continue;   /* 稀有蛙不贴左右边 */
      if(ry + 40 > H - 12) continue;
      var free = true;
      for(var ri = 0; ri < G.items.length; ri++){
        if(Math.hypot(G.items[ri].x - rx, G.items[ri].y - ry) < G.items[ri].r + 36 + gap){ free = false; break; }   /* 补上 rare 自身半径，杜绝重叠 */
      }
      if(free){
        G.items.push({ type: 'rare', rareId: chosen.id, rareName: chosen.name,
          x: rx, y: ry, r: 36, w: 72, h: 80, value: chosen.val || ITEMCFG.rare.value(),
          grabbed: false, collected: false });
        pass = 2;
        break;
      }
    }
  }

  /* ===== 小矮人（仅无限模式出现，放在最后摆，保证不挤占奶蛙/钻石/冰块的原有位置）=====
     出现概率曲线 DWF_CHANCE：
       p(n) = (n <= 1) ? 0 : min(chanceCap, chancePerLevel × (n - 1))
       即：第 1 关 0% 必不出现 → 第 2 关 5% → 第 10 关 45% → 第 19 关起 90% 封顶。
       参数都在 ITEMCFG.dwarf 里（chancePerLevel=0.05、chanceCap=0.9），改数值即可调曲线。
     出现时数量 = random[minCount, maxCount]（3~6 只）。 */
  if(!reward && inf && n >= 2){
    var dwcfg = ITEMCFG.dwarf;
    var dwP = Math.min(dwcfg.chanceCap, dwcfg.chancePerLevel * (n - 1));
    if(Math.random() < dwP){
      var dwCount = dwcfg.minCount + Math.floor(Math.random() * (dwcfg.maxCount - dwcfg.minCount + 1));
      placeDwarf(dwCount);
    }
  }

  /* 目标只算不会消失的物品；冰块会融光，算额外奖励
     （小矮人、问号袋都不计入补足额：矮人价值仅名义 2 且不可抓，袋子价值开袋前未知） */
  var total = calcTotal('dwarf,bag');
  if(G.mode === 'infinite'){
    /* 无限模式（闯关式，分数累计）：
       本关要求 infDelta(n) 逐关递增 → 累计目标一路走高，过关后分数保留 */
    var delta = infDelta(n);
    if(G.infPrevN === n - 1){
      /* 连续推进：累计目标 += 本关要求 */
      G.target = G.target + delta;
      G.infPrevN = n;
      G.levelStartScore = G.score;      /* 进入本关时的分数，失败重试时还原 */
    } else if(G.infPrevN !== n){
      /* 新开一局：直接算第 1..n 关的累计要求 */
      var sum = 0;
      for(var i = 1; i <= n; i++) sum += infDelta(i);
      G.target = sum;
      G.infPrevN = n;
      G.levelStartScore = G.score;
    }
    /* 重试同一关（infPrevN === n）：累计目标不变，分数由调用方还原 */

    /* 注意：无限模式不再按目标倒推补物品——配比在生成处固定（奶娃总数恒定、
       高价值占比随关卡上升），保持屏幕有充足空间；价值也绝不随关卡放大 */
  } else {
    G.target = Math.max(500, Math.round(total * 0.62 / 50) * 50);
  }

  G.time = G.timeMax = LEVEL_TIME;
  G.reached = false;   /* 每关重置达标状态 */
  var maxInit = 0;
  G.items.forEach(function(it){ if(it.type === 'ice' && it.initRatio > maxInit) maxInit = it.initRatio; });
  G.iceMeltRate = maxInit > 0 ? maxInit / G.timeMax : 0;
  if(reward){
    /* 奖励关字幕：复用飘字/音效机制（同 reachedCue 风格） */
    pop(400, 100, '奖励关！', 36, '#ffd75e', TOAST.banner);
    pop(400, 150, '全场只有钻石和奶娃', 18, '#c8f0ff', TOAST.banner);
    SND.reached();
    confetti(400, 180);
  }
  G.missCount = 0;
  updateHUD();
}

/* ===== 冰块融化 ===== */
var ICE_MIN_VIS = 0.1;
function updateIce(dt){
  if(!G.iceMeltRate) return;
  for(var i = 0; i < G.items.length; i++){
    var it = G.items[i];
    if(it.type !== 'ice' || it.collected || it.grabbed) continue;
    it.sizeRatio = Math.max(0, it.sizeRatio - G.iceMeltRate * dt);
    var eff = it.sizeRatio;
    if(it.isBiggest && eff < ICE_MIN_VIS) eff = ICE_MIN_VIS;
    it.w = it.baseW * eff;
    it.h = it.baseH * eff;
    it.r = it.baseR * eff;
    it.value = Math.round(it.unitValue * it.sizeRatio);
    if(it.sizeRatio <= 0 && !it.isBiggest){
      it.collected = true;
      dust(it.x, it.y);
    }
  }
}
/* 冰块越小 → 抓到时的叫声越尖 */
function iceRate(it){
  return 0.8 + (1 - clamp(it.sizeRatio, 0, 1)) * 1.4;
}

/* ===== 特效 ===== */
function pop(x, y, txt, size, color, dur){
  var d = dur || TOAST.normal;   /* 时长统一走 data.js TOAST 配置 */
  G.fx.push({ x: x, y: y, txt: txt, size: size || 20, color: color || '#ffe14d',
              vy: -44, life: d, max: d, rot: rand(-0.12, 0.12) });
}
function burst(x, y, n, colors, spd, grav, sz, life){
  for(var i = 0; i < n; i++){
    var a = Math.random() * Math.PI * 2, v = rand(spd * 0.4, spd);
    G.parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - spd * 0.3,
      g: grav || 260, life: life || 0.7, max: life || 0.7,
      size: rand(sz * 0.6, sz), color: colors[Math.floor(Math.random() * colors.length)] });
  }
}
function sparkle(x, y){ burst(x, y, 22, ['#ffe14d', '#ffd75e', '#fff6c9', '#f5a623'], 190, 120, 5, 0.7); }
function confetti(x, y){ burst(x, y, 34, ['#ffe14d', '#ff9d3d', '#58a84f', '#ff6b5e', '#6ec6ff'], 230, 260, 5, 1.0); }
function dust(x, y){ burst(x, y, 14, ['#a0835c', '#8a6b45', '#6b4f2e'], 110, 40, 6, 0.8); }
function diamondBurst(x, y){
  burst(x, y, 40, ['#ffffff', '#c8f0ff', '#5db4ec', '#ffe14d'], 260, 100, 4, 1.0);
  for(var i = 0; i < 8; i++){
    G.fx.push({ x: x, y: y, txt: '✦', size: 18 + Math.random() * 14, color: '#fff',
      vy: -30 - Math.random() * 40, life: 1.2, max: 1.2, rot: rand(-0.3, 0.3) });
  }
}
function updateFx(dt){
  for(var i = G.fx.length - 1; i >= 0; i--){
    var f = G.fx[i]; f.life -= dt; f.y += f.vy * dt; f.vy *= (1 - 1.4 * dt);
    if(f.life <= 0) G.fx.splice(i, 1);
  }
  for(var j = G.parts.length - 1; j >= 0; j--){
    var p = G.parts[j]; p.life -= dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if(p.life <= 0) G.parts.splice(j, 1);
  }
}

/* ===== 抓钩 ===== */
function tip(){
  var c = G.claw;
  return { x: PIVOT.x + Math.sin(c.angle) * c.len, y: PIVOT.y + Math.cos(c.angle) * c.len };
}
function swingOnly(dt){
  var c = G.claw;
  c.phase += dt * Math.PI * 2 * FREQ;
  c.angle = MAXA * Math.sin(c.phase);
  c.len = MINLEN;
}
function updateClaw(dt){
  var c = G.claw;
  /* 抓到奶娃后「向上提的整个过程」持续大笑：每帧同步起停（laugh.js syncCatchLaugh） */
  if(typeof syncCatchLaugh === 'function') syncCatchLaugh(c.st === 'retract' ? c.item : null);
  if(c.st === 'swing'){
    swingOnly(dt);
  } else if(c.st === 'drop'){
    c.len += DROP_SPEED * dt;
    if(c.len >= MAXLEN){ c.st = 'retract'; c.item = null; onMiss(); return; }
    var t = tip(), best = null, bestD = 1e9;
    for(var i = 0; i < G.items.length; i++){
      var it = G.items[i];
      if(it.collected || it.grabbed) continue;
      /* 小矮人可抓（方案B，用户选定）：抓住后进入挣扎收钩，结算价值 2 */
      var d = Math.hypot(t.x - it.x, t.y - it.y);
      if(d < it.r + 12 && d < bestD){ bestD = d; best = it; }
    }
    if(best) grab(best);
  } else if(c.st === 'retract'){
    var sp = c.item ? SPEED[c.item.type] : RETRACT_EMPTY;
    if(c.item && c.item.type === 'ice'){
      sp = 90 + 210 * clamp(c.item.sizeRatio, 0, 1);   // 越大越沉
    }
    if(c.item && c.item.type === 'dwarf'){
      /* 小矮人拼命挣扎：收钩大幅变慢，耐久耗尽就挣脱逃跑 */
      var dcfg = ITEMCFG.dwarf;
      c.struggleT = (c.struggleT || 0) + dt;
      sp = SPEED.dwarf * dcfg.struggle;
      /* 挣扎时甩出尘土 */
      if(Math.random() < dt * 8){
        var dtp = tip();
        G.parts.push({ x: dtp.x + rand(-8, 8), y: dtp.y + 6, vx: rand(-30, 30),
          vy: rand(-60, -20), g: 240, life: 0.4, max: 0.4, size: 3, color: '#d9c9a8' });
      }
      if(c.struggleT >= dcfg.hp){ escapeDwarf(); return; }
    }
    if(c.item && c.item.type === 'big'){
      /* 大奶蛙很沉：一顿一顿地被拖上来 */
      var ph = (performance.now() % 800) / 800;
      if(ph > 0.4) sp *= 0.05;
      if(Math.random() < dt * 4){
        var tp = tip();
        G.parts.push({ x: tp.x + rand(-7, 7), y: tp.y + 10, vx: rand(-15, 15),
          vy: rand(-90, -40), g: 280, life: 0.45, max: 0.45, size: 3, color: '#d8f6ff' });
      }
    }
    /* 问号袋：改用抓取时随机定下的收钩速度（见 data.js BAG_PULL），耗时落在奶娃区间内 */
    if(c.item && c.item.pullSpeed) sp = c.item.pullSpeed;
    c.len -= sp * dt;
    if(c.item){ var t2 = tip(); c.item.x = t2.x; c.item.y = t2.y; }
    if(c.len <= MINLEN){ deliver(); c.st = 'swing'; c.item = null; }
  }
}

/* 小矮人挣脱：从钩上逃跑、从场上消失，不加分也不算空钩 */
function escapeDwarf(){
  var c = G.claw;
  if(c.item){ c.item.collected = true; c.item = null; }
  c.st = 'swing';
  c.struggleT = 0;
  SND.dwarfEscape();
  var tp = tip();
  pop(tp.x, tp.y - 24, '挣脱了！', 22, '#ff6b5e');
  burst(tp.x, tp.y, 12, ['#d9c9a8', '#a0835c', '#8a6b45'], 140, 200, 4, 0.6);
}

function onMiss(){
  G.missCount++;
  G.odAngry = 1.2;
  if(G.missCount >= 3){
    G.missCount = 0;
    startAngryCutscene();
  }
}

function startAngryCutscene(){
  if(G.state !== 'play') return;
  G.state = 'angryPause';
  G.odAngry = 3;
  var quote = ANGRY_QUOTES[Math.floor(Math.random() * ANGRY_QUOTES.length)];
  G.angryState = { timer: 0, quote: quote,
    bullet: { x: G.planeX, y: G.planeY + 15, vx: 0, vy: 0, hit: false } };
  SND.fail();
  var bt = 1.0;
  G.angryState.bullet.vx = (G.dandanX - G.planeX) / bt;
  G.angryState.bullet.vy = ((G.dandanY - 20) - (G.planeY + 15)) / bt;
}

function grab(it){
  var c = G.claw;
  it.grabbed = true; c.item = it; c.st = 'retract';
  G.dandanJump = 0.5;
  if(it.type === 'small' || it.type === 'tiny' || it.type === 'big' || it.type === 'rare'){
    G.laughClock = 0.0001;
    SND.croak(voiceRate(it.type));
    SND.special();
    G.missCount = 0;
    if(it.type === 'big'){
      G.shake = 0.5;
      pop(it.x, it.y - 60, '好重！', 24, '#ffe14d');
      sparkle(it.x, it.y);
    } else if(it.type !== 'rare'){
      sparkle(it.x, it.y);
    }
  } else if(it.type === 'rock'){
    SND.rock(); dust(it.x, it.y);
    pop(it.x, it.y - 30, '好沉…', 16, '#cfc4ae');
    G.missCount++;
    if(G.missCount >= 3){ G.odAngry = 2.5; G.missCount = 0; pop(400, 60, '厂长生气了！', 22, '#ff6b5e', TOAST.boss); }
  } else if(it.type === 'ice'){
    G.laughClock = 0.0001;
    /* 抓冰音效 = 原作提取的 冰/冰冰/冰冰冰（ice-sfx.js 按 it.cubes 选 1~3 档，只播一遍）；
       抓住瞬间即响（上面 c.st 已置 'retract'，收钩上升途中），n 与到顶结算同一字段；
       原 SND.ice 合成音完全替换，文件缺失时静默跳过、游戏照常 */
    if(typeof playIceCatch === 'function') playIceCatch(it.cubes, iceRate(it));

    G.missCount = 0;
    sparkle(it.x, it.y);
    pop(it.x, it.y - it.h / 2 - 12, it.cubes + '连冰！', 18, '#bfe9ff');
  } else if(it.type === 'diamond'){
    SND.diamond(); diamondBurst(it.x, it.y);
    pop(it.x, it.y - 30, '钻石！', 22, '#c8f0ff');
  } else if(it.type === 'dwarf'){
    /* 小矮人：抓住后开始挣扎计时（耐久见 ITEMCFG.dwarf.hp），收回家结算价值 2 */
    c.struggleT = 0;
    SND.dwarfGrab();
    /* 抓住瞬间（上面 c.st 已置 'retract'，收钩上升途中）响抖音原声「你的胆子真是肥嘟嘟的」
       （dwarf-voice.js：同一钩只在本处触发一次；连续抓挂 1 个 pending 接续不截断；
         挣脱/结算不打断不重播；音量只读 SND.fxVol；文件缺失静默跳过、游戏照常） */
    if(typeof playDwarfVoice === 'function') playDwarfVoice();
    G.shake = 0.25;
    pop(it.x, it.y - it.h / 2 - 14, '抓住了！在挣扎！', 18, '#ffd75e');
  } else if(it.type === 'bag'){
    /* 每个袋子抓取瞬间随机一个收钩速度（区间见 data.js BAG_PULL，与袋子价值完全无关） */
    it.pullSpeed = rand(BAG_PULL.min, BAG_PULL.max);
    /* 问号袋：抓取过程只显示「？」，真实价值要 deliver 才揭晓 */
    SND.coinUp();
    sparkle(it.x, it.y);
    pop(it.x, it.y - it.h / 2 - 14, '问号袋 ？', 18, '#ffd75e');
  }
  if(it.type === 'rare') showRareShow(it);
}

/* 体积 × 质量 → 叫声的音调：大蛙沉、小蛙尖 */
function voiceRate(type){
  var cfg = ITEMCFG[type];
  if(!cfg) return 1;
  var bulk = cfg.w * cfg.h * (SPEED.big / SPEED[type]);
  var maxB = ITEMCFG.big.w * ITEMCFG.big.h, minB = ITEMCFG.tiny.w * ITEMCFG.tiny.h;
  var span = Math.log(maxB / minB);
  return clamp(0.8 + 1.2 * Math.log(maxB / bulk) / span, 0.8, 2);
}

function deliver(){
  var it = G.claw.item;
  if(!it) return;

  /* 计分 = 基础价值（奶蛙四档固定）+ 加成 */
  var gain = it.value || 0;
  var bonus = 0;
  var isNewBook = false;

  /* 图鉴首次解锁 +50%：抓到「图鉴里尚未解锁」的奶蛙才加成（×1.5）；
     抓到即刻写入 localStorage，之后重开/刷新再抓同一只不再加成 */
  if(it.type === 'rare'){
    var dex = loadDex();
    isNewBook = dex.indexOf(it.rareId) < 0;
    if(isNewBook){
      bonus = Math.round(gain * DEX_BONUS);
      dex.push(it.rareId);
      saveDex(dex);
    }
  }
  /* 中等/困难：大奶蛙抱着的钻石按钻石原价单独计（奶蛙本体仍是 $500 档） */
  if(it.diamondBonus) bonus += it.diamondBonus;

  var totalGain = gain + bonus;
  G.score += totalGain;

  if(it.type === 'rock'){
    dust(PIVOT.x, PIVOT.y + 40, 12);
    pop(400, 108, '+' + gain, 20, '#cfc4ae');
  } else if(it.type === 'ice'){
    SND.coin();
    pop(400, 108, '+' + gain, 27, '#bfe9ff');
    pop(400, 148, it.cubes + '块冰 × ' + it.cubes * ICE_PER_CUBE * 10 + '石头', 18, '#8fd4ff');
    diamondBurst(400, 170);
  } else if(it.type === 'bag'){
    /* 问号袋开奖：此处才揭晓真实价值（生成时随机的 1~800） */
    SND.coin();
    pop(400, 108, '问号袋 +' + gain, 27, '#ffd75e');
    pop(400, 148, gain >= 400 ? '手气不错！' : '就这？', 18, '#ff9d3d');
    sparkle(400, 150);
  } else {
    SND.coin();
    /* 持续大笑在 updateClaw 收钩时已循环播放，钩子到顶这里收口停音 */
    if(typeof stopCatchLaugh === 'function') stopCatchLaugh();
    pop(400, 108, '+' + totalGain, 27, '#ffe14d');
    if(it.type === 'big'){
      G.shake = Math.max(G.shake, 0.3);
      pop(400, 148, '好重…终于收工！', 20, '#ff9d3d');
      if(it.diamondBonus) pop(400, 184, '抱钻石 +' + it.diamondBonus, 18, '#c8f0ff');
      confetti(400, 170);
    }
    if(it.type === 'rare'){
      if(isNewBook){
        /* 明显提示加成已触发 */
        pop(400, 148, '新图鉴 +50%！ +' + bonus, 24, '#ff5b4d', TOAST.banner);
        pop(400, 186, '图鉴解锁：' + it.rareName, 20, '#ffd75e', TOAST.banner);
        confetti(400, 170);
        sparkle(400, 140);
      } else {
        pop(400, 148, '又是' + it.rareName, 20, '#ffd75e');
      }
    }
    if(it.type === 'diamond') diamondBurst(400, 170);
  }
  it.collected = true;
  G.dandanFaceDead = false;
  updateHUD();
  if(G.score >= G.target && G.state === 'play'){
    if(G.mode === 'infinite'){
      /* 无限模式：达标只提示，不跳关——继续抓到倒计时归零 */
      if(!G.reached) reachedCue();
    } else {
      levelClear();   /* 普通模式：达标即过关（原逻辑不动） */
    }
  }
}

/* 无限模式达标提示（只触发一次）：音效 + 飘字 + 彩带，不改变状态、不停表 */
function reachedCue(){
  G.reached = true;
  SND.reached();
  pop(400, 96, '目标达成！继续抓到时间结束', 24, '#8fe06a', TOAST.banner);
  pop(400, 136, '分数照样累计 ✓', 18, '#ffd75e', TOAST.banner);
  confetti(400, 170);
  G.shake = Math.max(G.shake, 0.3);
  updateHUD();
}

function showRareShow(it){
  G.state = 'rareShow';
  G.rareShowTimer = 2.2;
  var info = RARE.filter(function(r){ return r.id === it.rareId; })[0];
  $('rareShowLabel').textContent = info ? info.name : '稀有奶蛙';
  drawRareCard(info);
  show('ovRareShow');
  SND.applause(); SND.cheer();
}
function hideRareShow(){
  hide('ovRareShow');
  if(G.state === 'rareShow') G.state = 'play';
}

/* ===== 失败：炸弹掉下来 ===== */
function dropBomb(){
  var t = Math.max(0.8, Math.sqrt(2 * (G.dandanY + 10 - (G.planeY + 20)) / 600));
  G.bomb = { x: G.planeX, y: G.planeY + 20, vy: 0,
    vx: (G.dandanX - G.planeX) / t, exploded: false, tx: G.dandanX, ty: G.dandanY + 10 };
}
function updateBomb(dt){
  if(!G.bomb) return;
  if(!G.bomb.exploded){
    G.bomb.vy += 600 * dt;
    G.bomb.y += G.bomb.vy * dt;
    G.bomb.x += G.bomb.vx * dt;
    G.parts.push({ x: G.bomb.x, y: G.bomb.y, vx: 0, vy: 0, g: 0, life: 0.3, max: 0.3, size: 3, color: '#666' });
    if(G.bomb.y >= G.bomb.ty){
      G.bomb.exploded = true;
      G.shake = 1.2;
      G.dandanFaceDead = true;
      SND.explosion();
      burst(G.dandanX, G.dandanY, 60, ['#ff6b3a', '#ffd75e', '#333', '#666', '#999', '#fff'], 320, 220, 7, 1.8);
      pop(G.dandanX, G.dandanY - 50, '轰——！', 38, '#ff9d3d', TOAST.boss);
      setTimeout(function(){ G.bomb = null; }, 1500);
    }
  }
}

function updateWander(dt){
  if(G.state !== 'play') return;
  G.items.forEach(function(it){
    if(it.wander && !it.grabbed){
      it.x += it.wander.dir * it.wander.speed * dt;
      if(it.x > it.wander.cx + it.wander.range) it.wander.dir = -1;
      if(it.x < it.wander.cx - it.wander.range) it.wander.dir = 1;
    }
  });
}

/* ===== 小矮人游走（方案B：可抓价值2，持续在场地内来回巡逻）=====
   路线：沿水平方向巡逻，走到左右边界折返；每 2.5~5.5s 决定一次——
   50% 概率换行（目标行在原行 ±34px 内微调，纵向平滑靠近 ≤45px/s）、
   50% 概率原地折返；前进方向上遇到石头/冰块会在跟前折返（0.7s 冷却防抖）并顺带微调行。
   速度：生成时每只随机取 DWARF_SPEED.min~max（60~90 px/s）。
   摧毁：碰到 DWARF_KILL 白名单里「有价值的东西」→ 直接消失（不给分、无抓取飘字）。 */
/* ===== 小矮人游走（任务1 修正：仅在出生行水平来回，不上下移动）=====
   边界：左右墙留建模宽度边距（w/2+8）；速度 px/s 见 data.js DWARF_SPEED（30~38，横穿约 20~25 秒）
   障碍：同排前方有石头/冰块 → 原地折返（0.7s 冷却防抖），不换行
   摧毁：碰到 DWARF_KILL 白名单里「有价值的东西」→ 直接消失（不给分、无抓取飘字）——保持不变 */
function updateDwarf(dt){
  if(G.state !== 'play') return;
  var margin = ITEMCFG.dwarf.w / 2 + 8;
  var minX = margin, maxX = W - margin;
  for(var i = 0; i < G.items.length; i++){
    var it = G.items[i];
    if(it.type !== 'dwarf' || it.grabbed || it.collected) continue;
    var mv = it.mv;
    if(!mv) continue;

    /* 水平巡逻（y 恒定不动） */
    it.x += mv.dir * mv.speed * dt;
    if(it.x < minX){ it.x = minX; mv.dir = 1; }
    else if(it.x > maxX){ it.x = maxX; mv.dir = -1; }

    /* 同排前方遇到石头/冰块 → 折返（带冷却防抖），不改行 */
    mv.cool = Math.max(0, mv.cool - dt);
    if(mv.cool <= 0){
      for(var j = 0; j < G.items.length; j++){
        var ob = G.items[j];
        if(ob.collected || ob.grabbed || (ob.type !== 'rock' && ob.type !== 'ice')) continue;
        var fwd = (ob.x - it.x) * mv.dir, lat = Math.abs(ob.y - it.y);
        var reach = it.r + ob.r + 4;
        if(fwd > 0 && fwd < reach && lat < reach * 0.9){
          mv.dir = -mv.dir; mv.cool = 0.7;
          break;
        }
      }
    }
    it.flip = mv.dir < 0;

    /* 摧毁有价值的东西（石头/冰块/矮人不在白名单 → 不受影响） */
    for(var k = 0; k < G.items.length; k++){
      var v = G.items[k];
      if(v === it || v.collected || v.grabbed || !DWARF_KILL[v.type]) continue;
      if(Math.hypot(v.x - it.x, v.y - it.y) < it.r + v.r){
        v.collected = true;
        dust(v.x, v.y);
        pop(v.x, v.y - (v.h || 40) * 0.5 - 12, '毁掉了！', 16, '#ff6b5e');
      }
    }
  }
}
function updatePivot(dt){
  if(G.difficulty !== 'hard' || G.state !== 'play') return;
  G.pivotT += dt * 0.6;
  PIVOT.x = 400 + Math.sin(G.pivotT) * 80;
  G.dandanX = PIVOT.x - 25;
}
function updateAngry(dt){
  if(!G.angryState) return;
  var a = G.angryState;
  a.timer += dt;
  if(!a.bullet.hit){
    a.bullet.x += a.bullet.vx * dt;
    a.bullet.y += a.bullet.vy * dt;
    if(Math.hypot(a.bullet.x - G.dandanX, a.bullet.y - (G.dandanY - 20)) < 12){
      a.bullet.hit = true;
      G.dandanFaceDead = true;
      G.shake = 0.6;
      SND.explosion();
      burst(G.dandanX, G.dandanY - 20, 24, ['#ff6b3a', '#333', '#666', '#999'], 220, 180, 5, 1.0);
      setTimeout(function(){ G.dandanFaceDead = false; }, 1200);
    }
  }
  if(a.timer >= 2.0){   /* 厂长过场缩短：3.0→2.0s（任务2 用户要求） */
    G.angryState = null;
    G.state = 'play';
  }
}

/* ===== 流程 ===== */
function resetClaw(){
  G.claw = { angle: 0, len: MINLEN, st: 'swing', phase: Math.random() * 6.28, item: null };
}
function startGame(mode){
  G.scene = 'play'; G.state = 'menu';
  G.mode = (mode === 'infinite') ? 'infinite' : 'normal';
  G.infPrevN = 0; G.infPrevT = 0; G.levelStartScore = 0;
  G.target = 0;
  G.level = 1; G.score = 0;
  G.dandanFaceDead = false; G.bomb = null; G.angryState = null; G.odAngry = 0;
  PIVOT.x = 400;
  genLevel(1); resetClaw();
  hide('ovFactory');
  $('btnStart').textContent = G.mode === 'infinite' ? '开始挖矿（无限）' : '开始挖矿';
  show('ovMenu');
}
function enterMiner(){
  hide('ovMenu');
  G.state = 'play';
  genLevel(1); resetClaw();
}
function nextLevel(){
  SND.click();
  G.level++;
  if(G.mode !== 'infinite') G.score = 0;   /* 无限模式分数跨关累计（闯关式） */
  genLevel(G.level); resetClaw();
  G.state = 'play';
  hide('ovClear');
}
function retryLevel(){
  SND.click();
  /* 无限模式：还原到进入本关时的分数；普通模式清零 */
  G.score = (G.mode === 'infinite') ? (G.levelStartScore || 0) : 0;
  G.dandanFaceDead = false; G.bomb = null; G.angryState = null;
  genLevel(G.level); resetClaw();
  G.state = 'play';
  hide('ovOver');
}
function toFactory(){
  SND.click();
  G.scene = 'factory'; G.state = 'menu';
  G.mode = 'normal';
  G.infPrevN = 0; G.infPrevT = 0;
  G.score = 0; G.level = 1;
  PIVOT.x = 400;
  genLevel(1); resetClaw();
  G.dandanFaceDead = false; G.bomb = null; G.angryState = null;
  hide('ovPause'); hide('ovClear'); hide('ovOver'); hide('ovMenu'); hide('ovDex');
  show('ovFactory');
}
function levelClear(){
  G.state = 'clear';
  SND.fanfare(); SND.applause(); SND.cheer();
  if(G.mode === 'infinite'){
    var gained = Math.max(0, G.score - (G.levelStartScore || 0));
    $('clearText').textContent = '累计 ' + money(G.score) + ' ／ 目标 ' + money(G.target) +
      '（本关 +' + money(gained) + '）';
  } else {
    $('clearText').textContent = '本关累计 ' + money(G.score) + ' ／ 目标 ' + money(G.target);
  }
  show('ovClear');
}
function gameOver(){
  G.state = 'overAnim';
  SND.fail();
  var lack = Math.max(0, G.target - G.score);
  $('overText').textContent = '还差 ' + money(lack) + ' 没抓够';
  dropBomb();
  setTimeout(function(){
    G.state = 'over';
    show('ovOver');
  }, 2800);
}

function togglePause(){
  SND.click();
  if(G.state === 'play'){ G.state = 'paused'; show('ovPause'); }
  else if(G.state === 'paused'){ G.state = 'play'; hide('ovPause'); }
}
function openSettings(){
  SND.click();
  setRangeUI('bgmRange', 'bgmVal', SND.bgmVol);
  setRangeUI('fxRange', 'fxVal', SND.fxVol);
  settingsPrevState = G.state;
  if(G.state === 'play') G.state = 'settings';
  show('ovSettings');
}
function closeSettings(){
  SND.click();
  hide('ovSettings');
  if(settingsPrevState === 'play' && G.state === 'settings') G.state = 'play';
}
function openClearConfirm(){ SND.click(); show('ovConfirm'); }
function cancelClear(){ SND.click(); hide('ovConfirm'); }
function clearAllData(){
  SND.click();
  try{
    localStorage.removeItem('nwfDex');
    localStorage.removeItem('nwfVol');
  }catch(e){}
  G.level = 1; G.score = 0;
  mutedVol = null;
  SND.bgmVol = 0.25; SND.fxVol = 1;
  SND.applyVolumes(); SND.saveVol();
  setRangeUI('bgmRange', 'bgmVal', SND.bgmVol);
  setRangeUI('fxRange', 'fxVal', SND.fxVol);
  hide('ovConfirm');
  hide('ovSettings');
  toFactory();
}
function setRangeUI(rangeId, valId, v){
  var r = $(rangeId);
  if(r) r.value = Math.round(v * 100);
  var lab = $(valId);
  if(lab) lab.textContent = Math.round(v * 100) + '%';
}
var mutedVol = null;
function toggleMute(){
  SND.click();
  if(mutedVol){
    SND.bgmVol = mutedVol.bgm; SND.fxVol = mutedVol.fx; mutedVol = null;
  } else {
    mutedVol = { bgm: SND.bgmVol, fx: SND.fxVol };
    SND.bgmVol = 0; SND.fxVol = 0;
  }
  SND.applyVolumes(); SND.saveVol();
  setRangeUI('bgmRange', 'bgmVal', SND.bgmVol);
  setRangeUI('fxRange', 'fxVal', SND.fxVol);
}

function dropOrRetract(){
  if(G.state !== 'play') return;
  var c = G.claw;
  if(c.st === 'swing'){ c.st = 'drop'; SND.drop(); }
  else if(c.st === 'drop'){ c.st = 'retract'; c.item = null; onMiss(); }
}

function updateHUD(){
  $('score').textContent = money(G.score);
  $('target').textContent = money(G.target) + (G.reached ? ' ✓' : '');
  $('level').textContent = G.mode === 'infinite' ? G.level + ' ∞' : G.level;
  $('time').textContent = Math.max(0, Math.ceil(G.time));
  $('timeStat').className = 'stat' + (G.time <= 10 ? ' warn' : '');
}

function update(dt){
  G.shake = Math.max(0, G.shake - dt);
  if(G.laughClock > 0) G.laughClock += dt;
  updateFx(dt);
  updateBomb(dt);
  updateWander(dt);
  updateDwarf(dt);
  updatePivot(dt);
  updateAngry(dt);

  if(G.state === 'rareShow'){
    G.rareShowTimer -= dt;
    if(G.rareShowTimer <= 0) hideRareShow();
    return;
  }
  if(G.scene === 'play' && G.state === 'play'){
    G.planeX += G.planeDir * 60 * dt;
    if(G.planeX > W - 80){ G.planeX = W - 80; G.planeDir = -1; }
    if(G.planeX < 80){ G.planeX = 80; G.planeDir = 1; }
    if(G.odAngry > 0) G.odAngry -= dt;
    if(G.dandanJump > 0) G.dandanJump -= dt;
  }
  if(G.state === 'menu'){ swingOnly(dt); return; }
  if(G.state !== 'play') return;

  G.time -= dt;
  updateClaw(dt);
  updateIce(dt);
  /* 计时器独立结算：与「达标」完全解耦——倒计时归零才判定本关胜负
     （无限模式达标不跳关，继续抓到时间结束；普通模式保持原逻辑） */
  if(G.time <= 0){
    G.time = 0;
    if(G.mode === 'infinite'){
      if(G.score >= G.target) levelClear();   /* 时间到且已达标 → 过关面板 */
      else gameOver();                        /* 时间到但没达标 → 失败 */
    } else if(G.score < G.target){
      gameOver();
    }
  }
  updateHUD();
}

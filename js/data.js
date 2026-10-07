'use strict';
/* ===== 奶蛙工厂 · 基础数据与配置 ===== */

var W = 800, H = 600;
var SOIL_TOP = 152;              // 地面高度
var PIVOT = { x: 400, y: 128 };  // 抓钩支点（困难模式会左右移动）
var MINLEN = 54, MAXLEN = 470;   // 钩索最短 / 最长
var MAXA = 1.05, FREQ = 0.5;     // 摆动幅度（弧度）与频率
var DROP_SPEED = 330;            // 下放速度 px/s
var RETRACT_EMPTY = 420;         // 空钩收回速度
var SPEED = { small: 250, tiny: 285, big: 70, diamond: 330, rock: 90, rare: 260, ice: 120, dwarf: 210, bag: 160 };
/* 问号袋（冰红茶）收钩速度随机区间：抓上来耗时必须落在「抓不同大小奶娃」的耗时区间内（同钩索长度下）
   最快端 = 极小奶娃 SPEED.tiny = 285 px/s；最慢端 = 大奶蛙「一顿一顿」的实际平均速度
   SPEED.big × (0.4×1 + 0.6×0.05 = 0.43) ≈ 30.1 px/s（game.js big 分支 ph>0.4 时 sp×0.05，60% 时间在停顿）
   grab() 时对每个袋子在 [min,max] 均匀随机取一个速度 → 每只耗时都不同，且与袋子价值完全无关 */
var BAG_PULL = { min: +(SPEED.big * 0.43).toFixed(1), max: SPEED.tiny };
var FONT = '"ZCOOL KuaiLe","Microsoft YaHei","PingFang SC",sans-serif';
var LEVEL_TIME = 45;             // 每关秒数
var ICE_ROCK_PER_CUBE = 1;       // 1 块冰 = ICE_ROCK_PER_CUBE × 单块石头价（下面乘以 10）

/* 小矮人缩放：等效整体缩放 ≈0.65（原建模 52×62、r26 → 35×39、r17）
   35×39 = 普通奶蛙 58×56 的 60% 宽 × 70% 高，正好落在「普通奶蛙的 60%~70%」带内；
   建模绘制（render.js drawDwarf）与碰撞/占位（r）同步用这套尺寸 */
var DWARF_SCALE = 0.65;
var DWARF_SIZE = { w: 35, h: 39, r: 17 };
/* 小矮人游走速度（px/s）：任务1 标定值 30~38 ≈ 横穿 748px 场地需 20~25 秒
   （原作速度未查到：6 个搜索通道全灭，Steam 商店页无速度数值；此值为感知标定，
    2026-10-04 用户确认）——矮人只在出生行水平来回，逻辑见 game.js updateDwarf */
var DWARF_SPEED = { min: 30, max: 38 };
/* 小矮人「摧毁」白名单：碰到这些「有价值的东西」→ 直接摧毁消失（不给分、无抓取飘字）
   石头 rock（无价值障碍）、冰块 ice（按原融化逻辑自然处理）、矮人自身 dwarf 都不在名单里 → 不受影响 */
var DWARF_KILL = { small: 1, tiny: 1, big: 1, rare: 1, diamond: 1, bag: 1 };
/* 奖励关（任务4）：无限模式第 6/12/18…关掷一次 REWARD_CHANCE，命中=整场只有钻石+奶娃 */
var REWARD_CHANCE = 0.4;
/* 提示时长统一配置（任务2）：normal=普通飘字(原1.1s) / banner=奖励关·达标·图鉴加成(原1.1s)
   boss=厂长相关（按用户要求反而缩短：原1.1s/过场3.0s）——调时长只改这里 */
var TOAST = { normal: 2.2, banner: 3.3, boss: 0.8 };
/* 问号袋开奖区间与图鉴加成率：说明面板与 deliver 共同读取（改数值只改这里） */
var BAG_RANGE = { min: 1, max: 800 };
var DEX_BONUS = 0.5;

/* 首页玩法说明文案：所有数值从上面的配置实时读取，改配置说明自动更新 */
function howtoLines(){
  return [
    ['🪝', '放钩：空格 / 点屏幕；再按一次提前收钩'],
    ['🎯', '普通模式：抓够目标分就过关'],
    ['∞', '无限模式：时间耗尽才结算，分数跨关累计、目标逐关递增'],
    ['🐸', '奶蛙四档：$' + ITEMCFG.tiny.value() + ' 极小 / $' + ITEMCFG.small.value() + ' 小 / $' + ITEMCFG.rare.value() + ' 稀有 / $' + ITEMCFG.big.value() + ' 大'],
    ['💎', '钻石：$' + ITEMCFG.diamond.value() + ' 一个（大奶蛙抱的再加一份）'],
    ['🎁', '问号袋：随机 $' + BAG_RANGE.min + '~$' + BAG_RANGE.max + '，抓到才揭晓'],
    ['👺', '小矮人：只值 $' + ITEMCFG.dwarf.value() + '，碰到啥毁啥，小心它'],
    ['📖', '图鉴首次解锁：那一次得分 +' + Math.round(DEX_BONUS * 100) + '%'],
    ['🎉', '奖励关：无限模式每 6 关有 ' + Math.round(REWARD_CHANCE * 100) + '% 概率，满场钻石']
  ];
}

/* 各类物品的体积与价值
   ——奶蛙四档固定价值（按体型从小到大对应，不再随机）：
     极小奶蛙 tiny  (42×40, 最小) → $50
     小奶蛙   small (58×56)       → $100
     稀有奶蛙 rare  (72×80)       → $250
     大奶蛙   big   (90×126, 最大) → $500
   非奶蛙物品（钻石/石头/冰块/小矮人）价值规则不变 */
var ITEMCFG = {
  small:   { r: 30, w: 58,  h: 56,  value: function(){ return 100; } },
  tiny:    { r: 24, w: 42,  h: 40,  value: function(){ return 50; } },
  big:     { r: 50, w: 90,  h: 126, value: function(){ return 500; } },
  diamond: { r: 18, w: 26,  h: 26,  value: function(){ return 600; } },
  rock:    { r: 38, w: 56,  h: 54,  value: function(){ return 1 + Math.floor(Math.random() * 10); } },
  rare:    { r: 36, w: 72,  h: 80,  value: function(){ return 250; } },
  /* 问号袋=冰红茶瓶贴图（assets/bag.webp），价值开局生成时随机定死 1~800，deliver 时才揭晓
     抓取速度 SPEED.bag = 160（比小奶蛙 250 慢、比大奶蛙 70 快 → 中等重量的布袋）
     2026-10-06 整体放大 2 倍（r 22→44、w 44→88、h 52→104）：素材 251×460 上「冰红茶」文字块实测 170×82px，
     原 h=52 画出来单字仅 6.4×9.3px 看不清；h=104 时单字 12.8×18.5px 可读，故整体翻倍 */
  bag:     { r: 44, w: 88,  h: 104, value: function(){ return BAG_RANGE.min + Math.floor(Math.random() * (BAG_RANGE.max - BAG_RANGE.min + 1)); } },
  /* 小矮人（仅无限模式出现，仿《黄金矿工》矮人）
     r/w/h : 建模与碰撞/占位尺寸已统一按 DWARF_SCALE(0.65) 缩小（≈普通奶蛙的 60~70%）
     value : 抓回家结算价值 = 2（方案B可抓，用户选定；抓住后须在挣扎耐久内收回家）
     hp     : 挣扎耐久（秒）——抓住后 3 秒内没收回家就挣脱逃跑
     struggle: 挣扎期间收钩速度倍率（越小挣扎得越狠）——抓住矮人即生效
     chancePerLevel / chanceCap: 出现概率曲线参数，公式见 game.js 里的 DWF_CHANCE 注释
     minCount / maxCount: 每次出现 3~6 只 */
  dwarf:   { r: Math.round(26 * DWARF_SCALE), w: Math.round(52 * DWARF_SCALE), h: Math.round(62 * DWARF_SCALE),
             value: function(){ return 2; },
             hp: 3.0, struggle: 0.42,
             chancePerLevel: 0.05, chanceCap: 0.9,
             minCount: 3, maxCount: 6 }
};

/* 冰簇：1~3 块冰，初始大小随机，随时间融化变小、变便宜 */
var ICE_BASE = {
  1: { w: 78,  h: 78,  r: 33 },
  2: { w: 118, h: 117, r: 49 },
  3: { w: 168, h: 112, r: 66 }
};
var ICE_PER_CUBE = 10;   // 单块冰 = 10 个石头的价

/* 稀有奶蛙图鉴（每关随机出一只未收集的）——名称/价值与原站一致 */
var RARE = [
  { id: 1,  name: '呐喊蛙',   value: 600 },
  { id: 2,  name: '洛丽塔蛙', value: 650 },
  { id: 3,  name: '艺术蛙',   value: 650 },
  { id: 4,  name: '奶茶蛙',   value: 600 },
  { id: 5,  name: '吸猫蛙',   value: 700 },
  { id: 6,  name: '蹦蹦蛙',   value: 550 },
  { id: 7,  name: '耶耶蛙',   value: 600 },
  { id: 8,  name: '花束蛙',   value: 650 },
  { id: 9,  name: '生气蛙',   value: 550 },
  { id:10,  name: '打工奶龙', value: 620 },
  { id:11,  name: '摆烂奶龙', value: 657 },
  { id:12,  name: '摸鱼奶龙', value: 694 },
  /* 慈爱娃：阶段1新增（用户拍板价值档 500 = big 档）；
     val 是它专属的结算价值字段，game.js 用 chosen.val || ITEMCFG.rare.value() 取，
     老条目没有 val 字段 → 仍走 ITEMCFG.rare 的 250，不受影响 */
  { id:13,  name: '慈爱娃',   value: 500, val: 500 },
  /* 民大娃：中央民族大学校徽款，结算价值 1000（val 专属字段，game.js:291 取 chosen.val） */
  { id:14,  name: '民大娃',   value: 1000, val: 1000 },
  /* 愤怒娃：红横幅「切换愤怒模式」已去除，价值 500（用户指定） */
  { id:15,  name: '愤怒娃',   value: 500, val: 500 },
  /* 天使娃：金色天使款（原图自带透明底，原样存入），价值 500（用户指定） */
  { id:16,  name: '天使娃',   value: 500, val: 500 },
];

/* ===== 建模素材：直接引用原站图片 =====
   由浏览器在线加载；加载失败（断网等）时自动回退到本项目自带的矢量绘制 */
var ASSET_BASE = 'assets/';   /* 本地素材目录（相对 index.html），断网也能跑；加载失败仍回退矢量兜底 */
function loadImg(name){
  var im = new Image();
  im.src = ASSET_BASE + name;
  return im;
}
var SHEET_W = 144, SHEET_H = 192, SHEET_N = 20;   /* 大奶蛙大笑序列帧：20 帧 × 144×192 */
var IMG = {
  small:  loadImg('frog-small.webp'),
  big:    loadImg('frog-big.webp'),
  sheet:  loadImg('laugh-sheet2.webp'),
  dandan: loadImg('dandan-head.webp'),
  od:     loadImg('od-boss.webp'),
  odMenu: loadImg('od-menu.webp'),
  odAngry:loadImg('od-angry.webp'),
  diamond:loadImg('diamond-small.webp'),
  ice:    [loadImg('ice-1.webp'), loadImg('ice-2.webp'), loadImg('ice-3.webp')],
  dwarf:  loadImg('dwarf.webp'),
  bag:    loadImg('bag.webp'),
  rare:   {}
};
RARE.forEach(function(r){ IMG.rare[r.id] = loadImg('frog-rare-' + r.id + '.webp'); });
function imgOK(im){ return !!(im && im.complete && im.naturalWidth > 0); }

/* 厂长骂人台词 */
var ANGRY_QUOTES = ['没用的蛋蛋！', '蛋蛋你怎么又空钩了！', '蛋蛋你今天不许吃晚饭！'];

/* 分镜文案 */
var INTRO_SCENES = [
  { art: 'forest', text: '从前，奶蛙们在森林里自由自在地生活……' },
  { art: 'boss',    text: '直到od厂长发现：奶蛙做的罐头，竟然异常好卖！' },
  { art: 'cage',    text: '他到处搜捕奶蛙，把它们统统关进罐头工厂。' },
  { art: 'dandan',  text: '他的手下蛋蛋正在帮忙收蛙——而你，就是蛋蛋！' },
  { art: 'rare',    text: '抓齐所有稀有奶蛙，成为厂长最得力的助手！' }
];

/* ===== 存档 ===== */
function loadDex(){ try{ return JSON.parse(localStorage.getItem('nwfDex') || '[]'); }catch(e){ return []; } }
function saveDex(a){ try{ localStorage.setItem('nwfDex', JSON.stringify(a)); }catch(e){} }
function loadVol(){
  try{
    var v = JSON.parse(localStorage.getItem('nwfVol') || 'null');
    if(v){
      var b = Number(v.bgm), f = Number(v.fx);
      if(isFinite(b) && isFinite(f)){
        if(b > 1) b /= 100;
        if(f > 1) f /= 100;
        return { bgm: Math.min(1, Math.max(0, b)), fx: Math.min(1, Math.max(0, f)) };
      }
    }
  }catch(e){}
  return { bgm: 0.25, fx: 1 };
}
var VOL = loadVol();

/* ===== 小工具 ===== */
function $(id){ return document.getElementById(id); }
function show(id){ var el = $(id); if(el) el.classList.remove('hidden'); }
function hide(id){ var el = $(id); if(el) el.classList.add('hidden'); }
function rand(a, b){ return a + Math.random() * (b - a); }
function clamp(v, a, b){ return v < a ? a : (v > b ? b : v); }
function money(n){ return '$' + Number(n).toLocaleString(); }

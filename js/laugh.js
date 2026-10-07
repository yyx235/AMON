'use strict';
/* ===== 抓到奶娃的大笑音效（音源=原作提取，本地相对路径加载） =====
   来源 https://66970010-boop.github.io/frog-miner/js/audio.js
     L6-11   var LAUGH_FILES = ['assets/laugh-1.mp3', ... 4 个]
     L170-175 playLaugh: function(rate){ this.voice.src = LAUGH_FILES[Math.floor(Math.random() * ...)] ... voice.play(); }
   4 个文件已原样下载为 assets/catch-laugh-{1..4}.mp3（Content-Length 与服务器逐一相等，未剪辑/变速/重压缩）。
   触发：game.js deliver() 内统一调 playCatchLaugh(it.type)，所有奶娃走同一处 → 后续新增奶娃自动继承。
   接入方式：独立 HTMLAudioElement（不接入 WebAudio 总线），只在播放时读 SND.fxVol 定音量，
   不改动 js/audio.js 任何合成代码，故与 BGM / 现有合成音效互不压制（系统层混音，无 ducking）。
   重复播放：每次触发 cloneNode 一个新实例 → 可叠加、不会出现"第二只没声音"的截断。
   兜底：文件缺失/被浏览器拒绝时 error 与 play().catch 都只计数不抛错，游戏照常运行。 */

var LAUGH_FILES = [
  'assets/catch-laugh-1.mp3', 'assets/catch-laugh-2.mp3',
  'assets/catch-laugh-3.mp3', 'assets/catch-laugh-4.mp3'
];
/* 只有奶娃四档会响：钻石/石头/冰块/问号袋/小矮人不响 */
var LAUGH_FROG_TYPES = { small: 1, tiny: 1, big: 1, rare: 1 };
var LAUGH_TPL = [];      /* 预加载模板（也顺带把文件拉进浏览器缓存） */
var LAUGH_READY = false; /* 预加载是否成功建立 */
var LAUGH_ERR = 0;       /* 错误计数（缺失/自动播放被拒），只观测不抛出 */
/* 调试开关：URL 带 ?laughdbg=1 时每次播放在屏幕左下打一条绿色徽标（默认关闭，不影响游戏） */
var LAUGH_DBG = (typeof location !== 'undefined') && /[?&]laughdbg/.test(location.search || '');


(function preloadLaugh(){
  try{
    for(var i = 0; i < LAUGH_FILES.length; i++){
      var a = document.createElement('audio');
      a.preload = 'auto';
      a.src = LAUGH_FILES[i];
      (function(el){ el.addEventListener('error', function(){ LAUGH_ERR++; }); })(a);
      LAUGH_TPL.push(a);
    }
    LAUGH_READY = true;
  }catch(e){ LAUGH_READY = false; }
})();

function laughDbgBadge(text){
  if(!LAUGH_DBG) return;
  try{
    var bd = document.getElementById('laughDbgBadge');
    if(!bd){
      bd = document.createElement('div'); bd.id = 'laughDbgBadge';
      bd.style.cssText = 'position:fixed;left:0;bottom:0;z-index:9999;background:#003b00;color:#39ff6a;'
        +'font:14px monospace;padding:5px 9px;pointer-events:none';
      document.body.appendChild(bd);
    }
    bd.textContent = text;
  }catch(e){}
}

/* 播放一次抓取大笑：返回本次的 Audio 实例（非奶娃/失败返回 null） */
function playCatchLaugh(type){
  if(!LAUGH_FROG_TYPES[type]) return null;
  if(!LAUGH_READY || !LAUGH_TPL.length) return null;
  var tpl = LAUGH_TPL[Math.floor(Math.random() * LAUGH_TPL.length)];
  try{
    var a = tpl.cloneNode(true);
    a.preload = 'auto';
    /* 音量只跟随现有特效音量滑杆（SND.fxVol 0~1），不改任何合成参数 */
    a.volume = (typeof SND !== 'undefined' && SND && typeof SND.fxVol === 'number')
      ? Math.max(0, Math.min(1, SND.fxVol)) : 1;
    a.addEventListener('error', function(){ LAUGH_ERR++; });
    laughDbgBadge('[laugh] type=' + type + ' src=' + (a.currentSrc || a.src).split('/').pop() + ' vol=' + a.volume + ' @' + new Date().toTimeString().slice(0,8));
    var p = a.play();
    if(p && typeof p.catch === 'function') p.catch(function(){ LAUGH_ERR++; });
    return a;
  }catch(e){ LAUGH_ERR++; return null; }
}

/* ===== 上提全程持续大笑（v2：抓住后一直笑到钩子回顶） =====
   调用方：game.js updateClaw 每帧 syncCatchLaugh(收钩中的物品)，音随收钩起停。
   大奶蛙收钩约 11.5s，远超单条音频 3.4~4.15s → a.loop=true 循环播放。
   看门狗：游戏循环一旦停了（暂停/过关/弹窗）就没人喊停，500ms 一次检查，
   心跳超过 1.5s 没更新就自动收音，避免音效在弹窗后面无限循环。 */
var LAUGH_ACT = null;      /* 当前循环中的 Audio */
var LAUGH_ACT_TYPE = null;
var LAUGH_BEAT = 0;        /* 最近一次 sync 心跳 */
var LAUGH_PLAY_MS = 0;     /* 本次累计播放毫秒（验收用，靠心跳推进） */

function fxVolNow(){
  return (typeof SND !== 'undefined' && SND && typeof SND.fxVol === 'number')
    ? Math.max(0, Math.min(1, SND.fxVol)) : 1;
}

function stopCatchLaugh(){
  if(!LAUGH_ACT) return;
  try{ LAUGH_ACT.pause(); LAUGH_ACT.currentTime = 0; }catch(e){}
  LAUGH_ACT = null; LAUGH_ACT_TYPE = null;
}

/* 开始持续大笑（同一类型已在响就只刷新音量） */
function startCatchLaugh(type){
  if(!LAUGH_FROG_TYPES[type]){ stopCatchLaugh(); return; }
  if(LAUGH_ACT && LAUGH_ACT_TYPE === type){
    LAUGH_ACT.volume = fxVolNow();
    return;
  }
  stopCatchLaugh();
  if(!LAUGH_READY || !LAUGH_TPL.length) return;
  var tpl = LAUGH_TPL[Math.floor(Math.random() * LAUGH_TPL.length)];
  try{
    var a = tpl.cloneNode(true);
    a.loop = true;                     /* 收钩可长达 11.5s，必须循环 */
    a.preload = 'auto';
    a.volume = fxVolNow();
    a.addEventListener('error', function(){ LAUGH_ERR++; });
    LAUGH_ACT = a; LAUGH_ACT_TYPE = type;
    var p = a.play();
    if(p && typeof p.catch === 'function') p.catch(function(){ LAUGH_ERR++; stopCatchLaugh(); });
    laughDbgBadge('[laugh:start] type=' + type + ' loop=1 src=' + tpl.src.split('/').pop()
      + ' vol=' + a.volume + ' @' + new Date().toTimeString().slice(0,8));
  }catch(e){ LAUGH_ERR++; stopCatchLaugh(); }
}

/* 每帧同步：收钩中的奶娃 → 持续大笑；其它情况一律停 */
function syncCatchLaugh(item){
  LAUGH_BEAT = Date.now();
  if(item && LAUGH_FROG_TYPES[item.type]) startCatchLaugh(item.type);
  else stopCatchLaugh();
}

/* 看门狗：心跳断了就自动停（暂停/过关/切换场景兜底） */
setInterval(function(){
  if(!LAUGH_ACT) return;
  if(Date.now() - LAUGH_BEAT > 1500){
    laughDbgBadge('[laugh:watchdog-stop] no heartbeat 1.5s @'
      + new Date().toTimeString().slice(0,8));
    stopCatchLaugh();
  }
}, 500);

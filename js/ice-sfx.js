'use strict';
/* ===== 抓冰「冰 / 冰冰 / 冰冰冰」音效（音源=原作提取，本地相对路径加载） =====
   来源 https://66970010-boop.github.io/frog-miner/js/audio.js
     L16-20   var ICE_FILES = ['assets/ice-1.mp3','assets/ice-2.mp3','assets/ice-3.mp3']
              （注释：// 冰块音效：按冰簇里冰块的数量选择（1块/2块/3块））
     L192-198 localAud.playIce: src = ICE_FILES[clamp(count,1,3)-1]，loop=false，playbackRate=clamp(0.8,2.5,rate)
     L393-398 playIce(count, rate) → startGrabSound('ice', clamp(count,1,3)-1, false)（注释：冰块声只播一遍）
   3 个文件已原样下载为 assets/ice-{1,2,3}.mp3（18231/21992/25754 字节，Content-Length 与服务器逐一相等，未剪辑/变速/重压缩）。
   触发：game.js grab() 抓住瞬间（收钩上升入口，内部把 c.st 置 'retract'）调 playIceCatch(it.cubes, iceRate(it))，
        即「收钩上升途中」响起，不是到顶 deliver。
   块数口径：n = it.cubes（抓住瞬间定死），与到顶结算「N块冰 × … 石头」用同一个字段，不另算一套；
        n>3 封顶按 3 声档 ice-3（与原作 clamp 逻辑一致）；中途融化/改抓都不影响已定的 n。
   接入方式：独立 HTMLAudioElement（不进 WebAudio 总线），音量只读 SND.fxVol，loop=false 只播一遍，
        不改 js/audio.js 任何合成代码；与奶娃大笑（也是独立元素）可同时播、互不截断。
   缺失/报错：error 与 play().catch 只累加 ICE_SFX_ERR，不抛错，游戏照常（完全替换原 SND.ice 合成音）。 */

var ICE_SFX_FILES = ['assets/ice-1.mp3', 'assets/ice-2.mp3', 'assets/ice-3.mp3'];
var ICE_SFX_ERR = 0;       /* 错误计数（缺失/自动播放被拒），只观测不抛出 */
var ICE_SFX_TPL = [];      /* 预加载模板（顺带把文件拉进浏览器缓存） */
var ICE_SFX_READY = false;
/* 调试开关：URL 带 ?icedbg=1 时每次播放在屏幕左下打一条绿字徽标（默认关闭） */
var ICE_SFX_DBG = (typeof location !== 'undefined') && /[?&]icedbg/.test(location.search || '');

(function preloadIceSfx(){
  try{
    for(var i = 0; i < ICE_SFX_FILES.length; i++){
      var a = document.createElement('audio');
      a.preload = 'auto';
      a.src = ICE_SFX_FILES[i];
      (function(el){ el.addEventListener('error', function(){ ICE_SFX_ERR++; }); })(a);
      ICE_SFX_TPL.push(a);
    }
    ICE_SFX_READY = true;
  }catch(e){ ICE_SFX_READY = false; }
})();

function iceSfxVol(){
  return (typeof SND !== 'undefined' && SND && typeof SND.fxVol === 'number')
    ? Math.max(0, Math.min(1, SND.fxVol)) : 1;
}

function iceSfxDbg(text){
  if(!ICE_SFX_DBG) return;
  try{
    var bd = document.getElementById('iceSfxDbgBadge');
    if(!bd){
      bd = document.createElement('div'); bd.id = 'iceSfxDbgBadge';
      bd.style.cssText = 'position:fixed;left:0;bottom:26px;z-index:9999;background:#002b3b;'
        +'color:#5ad7ff;font:14px monospace;padding:5px 9px;pointer-events:none';
      document.body.appendChild(bd);
    }
    bd.textContent = text;
  }catch(e){}
}

/* 抓到冰簇：按块数 n 播 1/2/3 声档的原作音频（只播一遍）。
   返回本次 Audio 实例；文件缺失/被拒返回 null，绝不抛错。 */
function playIceCatch(count, rate){
  var n = Math.max(1, Math.min(3, count | 0));      /* n 封顶 3 档，与原作一致 */
  if(!ICE_SFX_READY || !ICE_SFX_TPL.length){ ICE_SFX_ERR++; return null; }
  var tpl = ICE_SFX_TPL[n - 1];
  try{
    var a = tpl.cloneNode(true);
    a.loop = false;                                  /* 冰块声只播一遍 */
    a.preload = 'auto';
    var r = Math.max(0.8, Math.min(2.5, rate || 1)); /* 越小越尖，区间同原作 */
    a.playbackRate = r;
    a.volume = iceSfxVol();                          /* 只跟随「特效音量」滑杆 */
    a.addEventListener('error', function(){ ICE_SFX_ERR++; });
    var p = a.play();
    if(p && typeof p.catch === 'function') p.catch(function(){ ICE_SFX_ERR++; });
    iceSfxDbg('[ice] n=' + n + ' src=' + tpl.src.split('/').pop() + ' rate=' + r.toFixed(2)
      + ' vol=' + a.volume + ' loop=0 @' + new Date().toTimeString().slice(0,8));
    return a;
  }catch(e){ ICE_SFX_ERR++; return null; }
}

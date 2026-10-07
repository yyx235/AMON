'use strict';
/* ===== 小矮人人声「你的胆子真是肥嘟嘟的」（音源=抖音原声，本地相对路径加载） =====
   来源 https://v.douyin.com/5q_6NbiVTRk/ → 落地页 https://www.douyin.com/note/7675289304537867761
     浏览器 video.currentSrc = https://sf11-cdn-tos.douyinstatic.com/obj/ies-music/7674550284103289641.mp3?is_ssr=1&temp=1
     下载 200 / audio/mpeg / 44704 字节 / SHA256 9C722F81FB03BBCEE625B443D7CF638E12D564798BFE0C70F09830C83BB6EBE8
     mp3 帧解析：2.717s / 128kbps / 44.1kHz / 104 帧；ID3v2.4 内 videoDuration=2666ms（源视频全长 2.666 秒）
     → 整段源视频就只有这一句，无需截取：原样落地 assets/dwarf-voice.mp3（未剪辑/未变速/未重编码/非合成）
   触发：game.js grab() 的 dwarf 分支（此时 c.st 已置 'retract'，收钩上升途中）调 playDwarfVoice()。
   同一钩只播一次：grab() 每次抓住只执行一次，voice 只在该处接入，无第二触发点。
   连续抓矮人：上一句没播完时新抓取只挂 1 个 pending（封顶 1，不排队堆积），
        等当前句 'ended' 后接续播下一句——两句都完整，不互相截断只剩半句。
   挣脱处理：小矮人 3 秒耐久挣脱（escapeDwarf）不打断已播句子、也不重播；
        人声与钩子状态解耦，只认「抓住瞬间」这一个触发点，挣脱/到顶结算都不再碰它。
   音量：起播瞬间只读 SND.fxVol（「特效音乐」滑杆）；独立 HTMLAudioElement 不进 WebAudio 总线，
        与奶娃大笑/抓冰/达标/奖励关音效和 BGM 互不干扰，只调自己的音量参数。
   缺失/报错：preload error 与 play().catch 只累加 DV_ERR，不抛错，游戏照常。 */

var DV_SRC = 'assets/dwarf-voice.mp3';
var DV_ERR = 0;              /* 错误计数（缺失/自动播放被拒），只观测不抛出 */
var DV_TPL = null;           /* 预加载模板（顺带把文件拉进浏览器缓存） */
var DV_PENDING = 0;          /* 接续挂起数（封顶 1：上一句没播完时新抓取不截断、只补播一次） */
var DV = { cur: null, plays: 0 };
var DV_DBG = (typeof location !== 'undefined') && /[?&]dvdbg/.test(location.search || '');

(function preloadDwarfVoice(){
  try{
    var a = document.createElement('audio');
    a.preload = 'auto';
    a.src = DV_SRC;
    a.addEventListener('error', function(){ DV_ERR++; });
    DV_TPL = a;
  }catch(e){ DV_TPL = null; }
})();

function dvVol(){
  return (typeof SND !== 'undefined' && SND && typeof SND.fxVol === 'number')
    ? Math.max(0, Math.min(1, SND.fxVol)) : 1;
}

function dvDbg(text){
  if(!DV_DBG) return;
  try{
    var bd = document.getElementById('dvDbgBadge');
    if(!bd){
      bd = document.createElement('div'); bd.id = 'dvDbgBadge';
      bd.style.cssText = 'position:fixed;left:0;bottom:52px;z-index:9999;background:#2b1a00;'
        +'color:#ffd75e;font:14px monospace;padding:5px 9px;pointer-events:none';
      document.body.appendChild(bd);
    }
    bd.textContent = text;
  }catch(e){}
}

/* 起播一句（克隆模板，不复用同一元素，避免相互 seek 截断）；链式补播 pending */
function dvStart(){
  if(!DV_TPL){ DV_ERR++; return null; }
  try{
    var a = DV_TPL.cloneNode(true);
    a.loop = false;
    a.preload = 'auto';
    a.volume = dvVol();                    /* 只跟随「特效音量」滑杆 */
    a.addEventListener('error', function(){ DV_ERR++; });
    a.addEventListener('ended', function(){
      if(DV.cur === a) DV.cur = null;
      if(DV_PENDING > 0){ DV_PENDING--; dvStart(); }   /* 接续补播下一句 */
    });
    var p = a.play();
    if(p && typeof p.catch === 'function') p.catch(function(){ DV_ERR++; });
    DV.cur = a; DV.plays++;
    dvDbg('[dwarfVoice] play#' + DV.plays + ' vol=' + a.volume + ' pending=' + DV_PENDING
      + ' @' + new Date().toTimeString().slice(0, 8));
    return a;
  }catch(e){ DV_ERR++; return null; }
}

/* 抓住小矮人：收钩上升途中响一句原声。
   正在播 → 只挂 1 个 pending（接续，不截断当前句）；否则直接起播。文件缺失返回 null，绝不抛错。 */
function playDwarfVoice(){
  if(DV.cur && !DV.cur.paused && !DV.cur.ended){
    if(DV_PENDING < 1) DV_PENDING++;
    return DV.cur;
  }
  return dvStart();
}
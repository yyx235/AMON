'use strict';
/* ===== 奶蛙工厂 · 音频（全部用 WebAudio 现场合成，无需素材） ===== */

var SND = (function(){
  var actx = null;
  var bgmGain = null, fxGain = null;
  var bgmVol = VOL.bgm, fxVol = VOL.fx;
  var bgmTimer = null, bgmStep = 0, bgmNext = 0;

  function ac(){
    if(!actx){
      var AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return null;
      actx = new AC();
      bgmGain = actx.createGain(); bgmGain.gain.value = bgmVol; bgmGain.connect(actx.destination);
      fxGain = actx.createGain();  fxGain.gain.value = fxVol;  fxGain.connect(actx.destination);
    }
    return actx;
  }
  function resume(){ var c = ac(); if(c && c.state === 'suspended') c.resume(); }

  /* 单音 */
  function tone(o){
    var c = ac(); if(!c) return;
    var t = c.currentTime + (o.at || 0);
    var osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(o.f, t);
    if(o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t + (o.dur || .2));
    var v = (o.vol == null ? .3 : o.vol);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (o.dur || .2));
    osc.connect(g); g.connect(o.bgm ? bgmGain : fxGain);
    osc.start(t); osc.stop(t + (o.dur || .2) + 0.05);
  }
  /* 噪声（用于石头、爆炸、欢呼） */
  function noise(o){
    var c = ac(); if(!c) return;
    var t = c.currentTime + (o.at || 0);
    var dur = o.dur || .3;
    var buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    var d = buf.getChannelData(0);
    for(var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    var src = c.createBufferSource(); src.buffer = buf;
    var f = c.createBiquadFilter();
    f.type = o.filter || 'lowpass';
    f.frequency.setValueAtTime(o.freq || 900, t);
    if(o.freq2) f.frequency.exponentialRampToValueAtTime(o.freq2, t + dur);
    var g = c.createGain();
    g.gain.setValueAtTime(o.vol == null ? .3 : o.vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(o.bgm ? bgmGain : fxGain);
    src.start(t);
  }

  /* ---- 背景音乐：一段简单的循环小调 ---- */
  var MELODY = [ 69,0, 72,74, 76,0, 74,72, 69,0, 67,69, 71,0, 72,0,
                 76,0, 74,72, 71,0, 69,0, 67,0, 69,71, 72,0, 69,0 ];   // MIDI
  var BASS  = [ 45,0,0,0, 40,0,0,0, 45,0,0,0, 43,0,0,0,
                45,0,0,0, 40,0,0,0, 43,0,0,0, 45,0,0,0 ];
  function mtof(m){ return 440 * Math.pow(2, (m - 69) / 12); }

  function bgmTick(){
    var c = ac(); if(!c) return;
    while(bgmNext < c.currentTime + 0.15){
      var lead = MELODY[bgmStep % MELODY.length];
      var bass = BASS[bgmStep % BASS.length];
      var at = bgmNext - c.currentTime;
      if(lead) tone({ f: mtof(lead), dur: .22, vol: .10, type: 'triangle', at: at, bgm: true });
      if(bass) tone({ f: mtof(bass), dur: .34, vol: .09, type: 'sine',     at: at, bgm: true });
      if(bgmStep % 4 === 0) noise({ dur: .06, vol: .05, freq: 4000, filter: 'highpass', at: at, bgm: true });
      bgmNext += 0.24;
      bgmStep++;
    }
  }
  function startBgm(){
    /* 只有在用户手势创建过 AudioContext 之后才开音乐 */
    if(!actx || bgmTimer || bgmVol <= 0) return;
    var c = actx;
    bgmNext = c.currentTime + 0.05;
    bgmTimer = setInterval(bgmTick, 60);
  }
  function stopBgm(){ if(bgmTimer){ clearInterval(bgmTimer); bgmTimer = null; } }
  function applyVolumes(){
    if(bgmGain) bgmGain.gain.value = bgmVol;
    if(fxGain)  fxGain.gain.value  = fxVol;
    if(bgmVol > 0) startBgm(); else stopBgm();
  }
  function saveVol(){ try{ localStorage.setItem('nwfVol', JSON.stringify({ bgm: Math.round(bgmVol * 100), fx: Math.round(fxVol * 100) })); }catch(e){} }

  /* ---- 音效 ---- */
  var specialUsed = false;
  return {
    ac: resume,
    get bgmVol(){ return bgmVol; },
    set bgmVol(v){ bgmVol = v; applyVolumes(); },
    get fxVol(){ return fxVol; },
    set fxVol(v){ fxVol = v; applyVolumes(); },
    applyVolumes: applyVolumes,
    saveVol: saveVol,
    startBgm: startBgm,
    stopBgm: stopBgm,
    resetSpecial: function(){ specialUsed = false; },

    click:    function(){ tone({ f: 660, f2: 880, dur: .07, vol: .18, type: 'square' }); },
    drop:     function(){ tone({ f: 700, f2: 160, dur: .3, vol: .2, type: 'sawtooth' }); },
    coin:     function(){ tone({ f: 880, dur: .07, vol: .25 }); tone({ f: 1320, dur: .16, vol: .22, at: .07 }); },
    diamond:  function(){ [1046, 1318, 1568, 2093].forEach(function(f, i){ tone({ f: f, dur: .14, vol: .2, type: 'triangle', at: i * .07 }); }); },
    rock:     function(){ noise({ dur: .3, vol: .3, freq: 500, freq2: 120 }); tone({ f: 110, f2: 60, dur: .25, vol: .2, type: 'sine' }); },
    ice:      function(rate){ var r = rate || 1; [1568, 1976, 2637].forEach(function(f, i){ tone({ f: f * r, dur: .1, vol: .16, type: 'triangle', at: i * .05 }); }); },
    /* 抓到奶蛙的叫声：rate 越小越低沉（越大越沉）、越大越尖（越小） */
    croak: function(rate){
      var r = rate || 1;
      for(var i = 0; i < 3; i++){
        tone({ f: 240 * r, f2: 130 * r, dur: .16, vol: .22, type: 'sawtooth', at: i * .19 });
        tone({ f: 120 * r, dur: .16, vol: .14, type: 'square', at: i * .19 + .04 });
      }
    },
    special:  function(){ if(specialUsed) return; specialUsed = true;
      [523, 659, 784, 1046, 1318].forEach(function(f, i){ tone({ f: f, dur: .18, vol: .22, type: 'triangle', at: i * .09 }); }); },
    coinUp:   function(){ tone({ f: 523, dur: .1, vol: .2 }); tone({ f: 784, dur: .1, vol: .2, at: .1 }); },
    fanfare:  function(){ [523, 523, 523, 659, 784, 784, 1046].forEach(function(f, i){ tone({ f: f, dur: .18, vol: .26, type: 'square', at: i * .13 }); }); },
    applause: function(){ for(var i = 0; i < 16; i++) noise({ dur: .07, vol: .12, freq: 2500, filter: 'highpass', at: i * .06 + Math.random() * .04 }); },
    cheer:    function(){ tone({ f: 400, f2: 900, dur: .6, vol: .16, type: 'sawtooth' }); noise({ dur: .8, vol: .14, freq: 900, freq2: 3000, filter: 'bandpass' }); },
    fail:     function(){ [440, 392, 330, 262].forEach(function(f, i){ tone({ f: f, dur: .26, vol: .24, type: 'sawtooth', at: i * .17 }); }); },
    explosion:function(){ noise({ dur: .9, vol: .5, freq: 1600, freq2: 60 }); tone({ f: 90, f2: 40, dur: .7, vol: .3, type: 'sine' }); },
    /* 小矮人：抓住时的短促叫声 / 挣脱逃跑的溜走声 */
    dwarfGrab: function(){
      tone({ f: 320, f2: 200, dur: .14, vol: .26, type: 'square' });
      tone({ f: 260, f2: 170, dur: .14, vol: .2, type: 'square', at: .15 });
    },
    dwarfEscape:function(){
      tone({ f: 520, f2: 980, dur: .28, vol: .22, type: 'sawtooth' });
      noise({ dur: .25, vol: .12, freq: 1800, freq2: 500, filter: 'highpass', at: .1 });
    },
    /* 达标提示（无限模式到目标分时响一次） */
    reached: function(){
      [784, 988, 1319].forEach(function(f, i){ tone({ f: f, dur: .16, vol: .24, type: 'triangle', at: i * .1 }); });
      noise({ dur: .5, vol: .1, freq: 2400, freq2: 5000, filter: 'highpass', at: .3 });
    },
    muteJingle:function(){ tone({ f: 660, dur: .08, vol: .2 }); }
  };
})();

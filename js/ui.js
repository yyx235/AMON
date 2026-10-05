'use strict';
/* ===== 奶蛙工厂 · 交互与主循环 ===== */

/* ---------- 输入 ---------- */
canvas.addEventListener('pointerdown', function(e){
  e.preventDefault();
  SND.ac(); SND.startBgm(); dropOrRetract();
});
document.addEventListener('keydown', function(e){
  if(e.code === 'Space' || e.code === 'ArrowDown'){ e.preventDefault(); SND.ac(); SND.startBgm(); dropOrRetract(); }
  else if(e.key === 'p' || e.key === 'P'){ if(G.scene === 'play') togglePause(); }
  else if(e.key === 'm' || e.key === 'M'){ toggleMute(); }
});
canvas.addEventListener('contextmenu', function(e){ e.preventDefault(); });

/* ---------- 游戏背景（分镜） ---------- */
var introIdx = 0;
function startIntro(){ introIdx = 0; show('ovIntro'); showIntroScene(); }
function showIntroScene(){
  var s = INTRO_SCENES[introIdx];
  $('introContent').textContent = s.text;
  drawIntroArt(introIdx);
}
function nextIntro(){
  SND.click();
  introIdx++;
  if(introIdx >= INTRO_SCENES.length){ hide('ovIntro'); }
  else showIntroScene();
}
$('ovIntro').addEventListener('click', nextIntro);

/* ---------- 图鉴 ---------- */
function showDex(){
  dexPrevState = G.state;
  if(G.state === 'play') G.state = 'dex';

  var dex = loadDex();
  var cells = [
    { name: '小奶蛙', owned: true, kind: 'small', frog: { body: '#f8df78', belly: '#fff6dd', t: 1 } },
    { name: '大奶蛙', owned: true, kind: 'big',   frog: { body: '#f0b94c', belly: '#ffe9b0', t: 1 } }
  ];
  RARE.forEach(function(r){
    var owned = dex.indexOf(r.id) >= 0;
    cells.push({
      name: owned ? r.name : '???',
      owned: owned,
      kind: 'rare',
      rareId: r.id,
      frog: { body: '#f5c14f', belly: '#fff6dc', t: 1 }
    });
  });

  var grid = $('dexGrid');
  grid.innerHTML = '';
  cells.forEach(function(c){
    var cell = document.createElement('div');
    cell.className = 'dexCell' + (c.owned ? '' : ' locked');
    var cv = document.createElement('canvas');
    cv.width = 76; cv.height = 76;
    var nm = document.createElement('div');
    nm.className = 'nm'; nm.textContent = c.name;
    cell.appendChild(cv); cell.appendChild(nm);
    grid.appendChild(cell);
    drawDexCell(cv, c);
  });

  var ownedCount = cells.filter(function(c){ return c.owned; }).length;
  $('dexCount').textContent = '已收集 ' + ownedCount + ' / ' + cells.length;
  show('ovDex');
}
function closeDex(){
  SND.click();
  hide('ovDex');
  if(dexPrevState === 'play' && G.state === 'dex') G.state = 'play';
}

/* ---------- 按钮 ---------- */
document.querySelectorAll('.diffBtn').forEach(function(btn){
  btn.addEventListener('click', function(){
    document.querySelectorAll('.diffBtn').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    G.difficulty = btn.dataset.diff;
    SND.ac(); SND.click();
    genLevel(1); resetClaw();
  });
});
$('btnIntro').addEventListener('click', function(){ SND.ac(); SND.click(); startIntro(); });
$('btnPlay').addEventListener('click', function(){ SND.ac(); SND.click(); SND.startBgm(); startGame('normal'); });
$('btnInfinite').addEventListener('click', function(){ SND.ac(); SND.click(); SND.startBgm(); startGame('infinite'); });
$('btnStart').addEventListener('click', function(){ SND.ac(); SND.click(); enterMiner(); });
$('btnDex').addEventListener('click', function(){ SND.ac(); SND.click(); showDex(); });
$('btnDexHud').addEventListener('click', function(){ SND.ac(); SND.click(); showDex(); });
$('btnDexClose').addEventListener('click', closeDex);
$('btnQuit').addEventListener('click', toFactory);
$('btnPause').addEventListener('click', function(){ SND.ac(); togglePause(); });
$('btnSettings').addEventListener('click', function(){ SND.ac(); openSettings(); });
$('btnSettingsClose').addEventListener('click', closeSettings);
$('btnClearData').addEventListener('click', openClearConfirm);
$('btnConfirmClear').addEventListener('click', clearAllData);
$('btnCancelClear').addEventListener('click', cancelClear);
$('bgmRange').addEventListener('input', function(){
  SND.bgmVol = Number(this.value) / 100;
  if(SND.bgmVol > 0) mutedVol = null;
  setRangeUI('bgmRange', 'bgmVal', SND.bgmVol);
  SND.saveVol();
  if(SND.bgmVol > 0){ SND.ac(); SND.startBgm(); }
});
$('fxRange').addEventListener('input', function(){
  SND.fxVol = Number(this.value) / 100;
  if(SND.fxVol > 0) mutedVol = null;
  setRangeUI('fxRange', 'fxVal', SND.fxVol);
  SND.saveVol();
});
$('btnResume').addEventListener('click', togglePause);
$('btnNext').addEventListener('click', nextLevel);
$('btnRetry').addEventListener('click', retryLevel);
$('btnMenu').addEventListener('click', toFactory);

/* 键盘也能操作首页按钮 */
$('btnPlay').addEventListener('keydown', function(e){
  if(e.code === 'Space' || e.code === 'Enter'){ e.preventDefault(); SND.ac(); SND.click(); startGame('normal'); }
});
$('btnInfinite').addEventListener('keydown', function(e){
  if(e.code === 'Space' || e.code === 'Enter'){ e.preventDefault(); SND.ac(); SND.click(); startGame('infinite'); }
});

/* ---------- 首页玩法说明面板（可折叠；文案与数值全部来自 data.js howtoLines） ---------- */
(function(){
  var box = document.createElement('div');
  box.className = 'howto';
  var head = document.createElement('div');
  head.className = 'howtoHead';
  var title = document.createElement('span');
  title.textContent = '📖 玩法说明';
  var fold = document.createElement('b');
  fold.className = 'howtoFold';
  fold.textContent = '收起 ▴';
  head.appendChild(title); head.appendChild(fold);
  var body = document.createElement('div');
  body.className = 'howtoBody';
  howtoLines().forEach(function(l){
    var row = document.createElement('div');
    row.className = 'howtoRow';
    var ic = document.createElement('i');
    ic.textContent = l[0];
    var tx = document.createElement('span');
    tx.textContent = l[1];
    row.appendChild(ic); row.appendChild(tx);
    body.appendChild(row);
  });
  head.addEventListener('click', function(){
    SND.ac(); SND.click();
    box.classList.toggle('fold');
    fold.textContent = box.classList.contains('fold') ? '展开 ▾' : '收起 ▴';
  });
  box.appendChild(head); box.appendChild(body);
  $('ovFactory').appendChild(box);
})();
/* ---------- 初始化 ---------- */
genLevel(1);
resetClaw();
updateHUD();
drawStaticFrogs();
SND.applyVolumes();
setRangeUI('bgmRange', 'bgmVal', SND.bgmVol);
setRangeUI('fxRange', 'fxVal', SND.fxVol);

/* ---------- 主循环 ---------- */
var last = performance.now();
function loop(now){
  var dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

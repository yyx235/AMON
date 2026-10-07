'use strict';
/* ===== 奶蛙工厂 · 绘制（全部用 Canvas 矢量画，无图片素材） ===== */

var canvas = $('game');
var ctx = canvas.getContext('2d');
var dpr = Math.min(window.devicePixelRatio || 1, 2);
canvas.width = W * dpr; canvas.height = H * dpr;
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

/* ---------- 基础绘制 ---------- */
function drawText(g, txt, x, y, size, color, stroke){
  g.font = size + 'px ' + FONT;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = Math.max(2, size / 9);
  g.lineJoin = 'round';
  g.strokeStyle = stroke || 'rgba(0,0,0,0.55)';
  g.strokeText(txt, x, y);
  g.fillStyle = color;
  g.fillText(txt, x, y);
}
function roundRectPath(g, x, y, w, h, r){
  g.beginPath();
  g.moveTo(x + r, y);
  g.lineTo(x + w - r, y);
  g.quadraticCurveTo(x + w, y, x + w, y + r);
  g.lineTo(x + w, y + h - r);
  g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  g.lineTo(x + r, y + h);
  g.quadraticCurveTo(x, y + h, x, y + h - r);
  g.lineTo(x, y + r);
  g.quadraticCurveTo(x, y, x + r, y);
  g.closePath();
}
function shadowEllipse(g, x, y, w, h){
  g.fillStyle = 'rgba(0,0,0,0.20)';
  g.beginPath(); g.ellipse(x, y + h * 0.47, w * 0.44, h * 0.11, 0, 0, Math.PI * 2); g.fill();
}

/* ---------- 奶蛙（原样保留的矢量造型，仅在图片素材加载失败时兜底） ----------
   g: 画布上下文  (cx,cy): 中心  (w,h): 尺寸
   o: { body, belly, mood:'idle'|'laugh', acc:配饰, flip, t } */
function drawFrog(g, cx, cy, w, h, o){
  o = o || {};
  var body = o.body || '#f8df78';
  var belly = o.belly || '#fff6dd';
  var t = o.t || 0;
  var line = '#8a5a1f';
  g.save();
  if(o.flip){ g.translate(cx, cy); g.scale(-1, 1); cx = 0; cy = 0; }
  g.lineJoin = 'round';

  /* 披风在身体后面 */
  if(o.acc === 'cape'){
    g.fillStyle = '#e04f3c';
    g.beginPath();
    g.moveTo(cx - w * 0.38, cy - h * 0.18);
    g.lineTo(cx - w * 0.68, cy + h * 0.52);
    g.lineTo(cx, cy + h * 0.40);
    g.lineTo(cx + w * 0.68, cy + h * 0.52);
    g.lineTo(cx + w * 0.38, cy - h * 0.18);
    g.closePath(); g.fill();
    g.strokeStyle = '#a02f22'; g.lineWidth = 2; g.stroke();
  }

  g.strokeStyle = line;
  g.lineWidth = Math.max(1.5, w * 0.032);

  /* 脚掌 */
  [-1, 1].forEach(function(s){
    g.fillStyle = darken(body, 0.1);
    g.beginPath();
    g.ellipse(cx + s * w * 0.22, cy + h * 0.45, w * 0.16, h * 0.075, 0, 0, Math.PI * 2);
    g.fill(); g.stroke();
    /* 脚趾纹 */
    g.lineWidth = Math.max(1, w * 0.02);
    g.beginPath();
    g.moveTo(cx + s * w * 0.22 - w * 0.05, cy + h * 0.45);
    g.lineTo(cx + s * w * 0.22 - w * 0.05, cy + h * 0.49);
    g.stroke();
    g.lineWidth = Math.max(1.5, w * 0.032);
  });

  /* 手臂（身体两侧的小短手） */
  [-1, 1].forEach(function(s){
    g.save();
    g.translate(cx + s * w * 0.43, cy + h * 0.08);
    g.rotate(s * 0.55);
    g.fillStyle = body;
    g.beginPath(); g.ellipse(0, 0, w * 0.085, h * 0.15, 0, 0, Math.PI * 2);
    g.fill(); g.stroke();
    g.restore();
  });

  /* 身体：上窄下宽的奶蛙形 */
  var grad = g.createLinearGradient(cx - w * 0.5, cy - h * 0.5, cx + w * 0.5, cy + h * 0.5);
  grad.addColorStop(0, lighten(body, 0.14));
  grad.addColorStop(0.55, body);
  grad.addColorStop(1, darken(body, 0.16));
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(cx - w * 0.38, cy + h * 0.34);
  g.bezierCurveTo(cx - w * 0.54, cy + h * 0.04, cx - w * 0.40, cy - h * 0.50, cx, cy - h * 0.50);
  g.bezierCurveTo(cx + w * 0.40, cy - h * 0.50, cx + w * 0.54, cy + h * 0.04, cx + w * 0.38, cy + h * 0.34);
  g.quadraticCurveTo(cx, cy + h * 0.54, cx - w * 0.38, cy + h * 0.34);
  g.closePath();
  g.fill();
  g.lineWidth = Math.max(2, w * 0.035);
  g.stroke();

  /* 肚皮 */
  g.fillStyle = belly;
  g.beginPath();
  g.ellipse(cx, cy + h * 0.19, w * 0.29, h * 0.24, 0, 0, Math.PI * 2);
  g.fill();

  /* 斑点 */
  g.fillStyle = 'rgba(180,120,40,0.20)';
  [[-0.30, -0.04], [0.31, -0.02], [0.02, -0.34]].forEach(function(p){
    g.beginPath();
    g.ellipse(cx + p[0] * w, cy + p[1] * h, w * 0.08, h * 0.055, 0, 0, Math.PI * 2);
    g.fill();
  });

  /* 高光 */
  g.fillStyle = 'rgba(255,255,255,0.5)';
  g.beginPath();
  g.ellipse(cx - w * 0.15, cy - h * 0.3, w * 0.12, h * 0.06, -0.5, 0, Math.PI * 2);
  g.fill();

  /* 腮红 */
  g.fillStyle = 'rgba(240,140,110,0.35)';
  [-1, 1].forEach(function(s){
    g.beginPath();
    g.ellipse(cx + s * w * 0.29, cy - h * 0.03, w * 0.09, h * 0.06, 0, 0, Math.PI * 2);
    g.fill();
  });

  /* 眼睛：小黑豆眼 */
  var edx = w * 0.16, edy = cy - h * 0.20, er = Math.max(3, w * 0.072);
  if(o.mood === 'laugh'){
    g.strokeStyle = '#3a2a12'; g.lineWidth = Math.max(2, w * 0.05); g.lineCap = 'round';
    [-1, 1].forEach(function(s){
      g.beginPath();
      g.arc(cx + s * edx, edy + er * 0.35, er * 1.1, Math.PI * 1.12, Math.PI * 1.88);
      g.stroke();
    });
  } else {
    [-1, 1].forEach(function(s){
      g.fillStyle = '#241a0c';
      g.beginPath(); g.arc(cx + s * edx, edy, er, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ffffff';
      g.beginPath(); g.arc(cx + s * edx - er * 0.3, edy - er * 0.35, er * 0.3, 0, Math.PI * 2); g.fill();
    });
  }

  /* 嘴 */
  if(o.mood === 'laugh'){
    g.fillStyle = '#6e2f22';
    g.beginPath(); g.ellipse(cx, cy - h * 0.04, w * 0.15, h * 0.1, 0, 0, Math.PI * 2); g.fill();
    g.lineWidth = Math.max(2, w * 0.03); g.strokeStyle = '#3a2a12'; g.stroke();
    g.fillStyle = '#ef9a9a';
    g.beginPath(); g.ellipse(cx, cy + h * 0.0, w * 0.09, h * 0.05, 0, 0, Math.PI * 2); g.fill();
  } else {
    g.strokeStyle = '#7a4a1a'; g.lineWidth = Math.max(2, w * 0.04); g.lineCap = 'round';
    g.beginPath();
    g.moveTo(cx - w * 0.09, cy - h * 0.07);
    g.quadraticCurveTo(cx, cy - h * 0.01, cx + w * 0.09, cy - h * 0.07);
    g.stroke();
  }

  drawAccessory(g, cx, cy, w, h, o.acc, t);
  g.restore();
}

function drawAccessory(g, cx, cy, w, h, acc, t){
  if(!acc) return;
  g.save();
  g.lineJoin = 'round';
  switch(acc){
    case 'cap': {
      g.fillStyle = '#e94f3c';
      g.beginPath(); g.ellipse(cx, cy - h * 0.42, w * 0.34, h * 0.2, Math.PI, 0, false); g.fill();
      g.fillStyle = '#c23c2c';
      g.beginPath(); g.ellipse(cx + w * 0.3, cy - h * 0.42, w * 0.24, h * 0.06, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ffd93d';
      g.beginPath(); g.arc(cx, cy - h * 0.56, w * 0.05, 0, Math.PI * 2); g.fill();
      break;
    }
    case 'glasses': {
      g.strokeStyle = '#2b2b2b'; g.lineWidth = Math.max(2, w * 0.05);
      [-1, 1].forEach(function(s){
        g.beginPath(); g.arc(cx + s * w * 0.26, cy - h * 0.33, w * 0.21, 0, Math.PI * 2); g.stroke();
      });
      g.beginPath(); g.moveTo(cx - w * 0.05, cy - h * 0.33); g.lineTo(cx + w * 0.05, cy - h * 0.33); g.stroke();
      g.fillStyle = 'rgba(200,235,255,.35)';
      [-1, 1].forEach(function(s){
        g.beginPath(); g.arc(cx + s * w * 0.26, cy - h * 0.33, w * 0.17, 0, Math.PI * 2); g.fill();
      });
      break;
    }
    case 'shades': {
      g.fillStyle = '#141414';
      roundRectPath(g, cx - w * 0.44, cy - h * 0.44, w * 0.88, h * 0.19, h * 0.07); g.fill();
      g.fillStyle = 'rgba(255,255,255,.35)';
      g.beginPath(); g.ellipse(cx - w * 0.24, cy - h * 0.37, w * 0.08, h * 0.03, -0.4, 0, Math.PI * 2); g.fill();
      break;
    }
    case 'milktea': {
      var bx = cx + w * 0.52, by = cy - h * 0.1;
      g.fillStyle = '#f6e3c8';
      g.beginPath();
      g.moveTo(bx - w * 0.11, by - h * 0.14);
      g.lineTo(bx + w * 0.11, by - h * 0.14);
      g.lineTo(bx + w * 0.08, by + h * 0.16);
      g.lineTo(bx - w * 0.08, by + h * 0.16);
      g.closePath(); g.fill();
      g.strokeStyle = '#b98c53'; g.lineWidth = 2; g.stroke();
      g.fillStyle = '#d9a066';
      g.fillRect(bx - w * 0.1, by, w * 0.2, h * 0.15);
      g.fillStyle = '#6b4a2a';
      g.fillRect(bx - w * 0.02, by - h * 0.3, w * 0.05, h * 0.18);
      g.fillStyle = '#3b2a1a';
      [[-0.05,0.06],[0.03,0.1],[-0.01,0.02]].forEach(function(p){
        g.beginPath(); g.ellipse(bx + p[0] * w, by + p[1] * h, w * 0.025, h * 0.02, 0, 0, Math.PI * 2); g.fill();
      });
      break;
    }
    case 'crown': {
      g.fillStyle = '#ffd93d'; g.strokeStyle = '#b8860b'; g.lineWidth = 2;
      g.beginPath();
      g.moveTo(cx - w * 0.3, cy - h * 0.44);
      g.lineTo(cx - w * 0.3, cy - h * 0.66);
      g.lineTo(cx - w * 0.14, cy - h * 0.52);
      g.lineTo(cx, cy - h * 0.72);
      g.lineTo(cx + w * 0.14, cy - h * 0.52);
      g.lineTo(cx + w * 0.3, cy - h * 0.66);
      g.lineTo(cx + w * 0.3, cy - h * 0.44);
      g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#e94f3c';
      g.beginPath(); g.arc(cx, cy - h * 0.5, w * 0.05, 0, Math.PI * 2); g.fill();
      break;
    }
    case 'flower': {
      var fx = cx - w * 0.32, fy = cy - h * 0.5;
      g.fillStyle = '#fff';
      for(var i = 0; i < 5; i++){
        var a = i / 5 * Math.PI * 2;
        g.beginPath(); g.ellipse(fx + Math.cos(a) * w * 0.09, fy + Math.sin(a) * w * 0.09, w * 0.07, w * 0.05, a, 0, Math.PI * 2); g.fill();
      }
      g.fillStyle = '#ffb703';
      g.beginPath(); g.arc(fx, fy, w * 0.06, 0, Math.PI * 2); g.fill();
      break;
    }
    case 'scarf': {
      g.fillStyle = '#e94f3c';
      roundRectPath(g, cx - w * 0.4, cy + h * 0.2, w * 0.8, h * 0.14, h * 0.06); g.fill();
      g.fillStyle = '#c23c2c';
      g.beginPath();
      g.moveTo(cx - w * 0.1, cy + h * 0.3);
      g.lineTo(cx + w * 0.06, cy + h * 0.3);
      g.lineTo(cx + w * 0.02, cy + h * 0.52);
      g.lineTo(cx - w * 0.12, cy + h * 0.46);
      g.closePath(); g.fill();
      g.fillStyle = '#fff';
      g.fillRect(cx - w * 0.4, cy + h * 0.25, w * 0.8, h * 0.03);
      break;
    }
    case 'mustache': {
      g.strokeStyle = '#3b2a1a'; g.lineWidth = Math.max(3, w * 0.07); g.lineCap = 'round';
      g.beginPath();
      g.moveTo(cx - w * 0.24, cy + h * 0.16);
      g.quadraticCurveTo(cx - w * 0.06, cy + h * 0.24, cx, cy + h * 0.14);
      g.quadraticCurveTo(cx + w * 0.06, cy + h * 0.24, cx + w * 0.24, cy + h * 0.16);
      g.stroke();
      break;
    }
    case 'star': {
      drawStar(g, cx, cy + h * 0.2, w * 0.18, '#ffd93d', '#b8860b');
      break;
    }
    case 'bow': {
      var bx2 = cx + w * 0.3, by2 = cy - h * 0.5;
      g.fillStyle = '#e94f3c'; g.strokeStyle = '#a82f22'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(bx2, by2); g.lineTo(bx2 - w * 0.2, by2 - h * 0.1); g.lineTo(bx2 - w * 0.2, by2 + h * 0.1); g.closePath();
      g.fill(); g.stroke();
      g.beginPath(); g.moveTo(bx2, by2); g.lineTo(bx2 + w * 0.2, by2 - h * 0.1); g.lineTo(bx2 + w * 0.2, by2 + h * 0.1); g.closePath();
      g.fill(); g.stroke();
      g.fillStyle = '#ffd93d';
      g.beginPath(); g.arc(bx2, by2, w * 0.05, 0, Math.PI * 2); g.fill();
      break;
    }
    case 'halo': {
      g.save();
      g.translate(cx, cy - h * 0.72);
      g.rotate(Math.sin(t * 2) * 0.15);
      g.strokeStyle = 'rgba(255,225,110,.95)'; g.lineWidth = Math.max(3, w * 0.06);
      g.beginPath(); g.ellipse(0, 0, w * 0.3, h * 0.08, 0, 0, Math.PI * 2); g.stroke();
      g.restore();
      break;
    }
    case 'cape': {
      g.fillStyle = '#ffd93d';
      roundRectPath(g, cx - w * 0.36, cy - h * 0.2, w * 0.72, h * 0.07, h * 0.03); g.fill();
      break;
    }
  }
  g.restore();
}
function drawStar(g, cx, cy, r, fill, stroke){
  g.beginPath();
  for(var i = 0; i < 10; i++){
    var a = -Math.PI / 2 + i * Math.PI / 5;
    var rr = i % 2 ? r * 0.45 : r;
    var x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
    if(i === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.closePath();
  g.fillStyle = fill; g.fill();
  if(stroke){ g.strokeStyle = stroke; g.lineWidth = 2; g.stroke(); }
}
function lighten(hex, amt){ return shade(hex, amt); }
function darken(hex, amt){ return shade(hex, -amt); }
function shade(hex, amt){
  var c = hex.replace('#', '');
  if(c.length === 3) c = c.replace(/./g, function(m){ return m + m; });
  var n = parseInt(c, 16);
  var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = clamp(Math.round(r + 255 * amt), 0, 255);
  g = clamp(Math.round(g + 255 * amt), 0, 255);
  b = clamp(Math.round(b + 255 * amt), 0, 255);
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}

/* ---------- 蛋蛋（玩家角色）：原站 dandan-head 素材，加载失败时用矢量兜底 ---------- */
function drawDandan(g, x, y, o){
  o = o || {};
  if(o.jump > 0){
    var jp = 1 - o.jump / 0.5;
    y += Math.abs(Math.sin(jp * Math.PI * 2)) * -12;
  }
  g.save();
  /* 身体：火柴人 */
  g.strokeStyle = '#2b2b2b'; g.lineWidth = 2.5; g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x, y); g.lineTo(x, y + 14);
  g.moveTo(x - 14, y + 6); g.lineTo(x, y + 8); g.lineTo(x + 14, y + 6);
  g.moveTo(x, y + 14); g.lineTo(x - 8, y + 26);
  g.moveTo(x, y + 14); g.lineTo(x + 8, y + 26);
  g.stroke();

  var headCy = y - 20, R = 18, hs = 40;

  if(imgOK(IMG.dandan)){
    /* 原站头部素材 */
    g.drawImage(IMG.dandan, x - hs / 2, headCy - hs / 2, hs, hs);
    if(o.dead){
      g.fillStyle = 'rgba(30,30,30,0.85)';
      g.beginPath(); g.ellipse(x, headCy, R, R * 1.06, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#ff5b4d'; g.lineWidth = 2.5; g.lineCap = 'round';
      [-1, 1].forEach(function(s){
        var ex = x + s * 7, ey = headCy - 3;
        g.beginPath(); g.moveTo(ex - 4, ey - 4); g.lineTo(ex + 4, ey + 4);
        g.moveTo(ex + 4, ey - 4); g.lineTo(ex - 4, ey + 4); g.stroke();
      });
      g.beginPath(); g.arc(x, headCy + 8, 5, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
    }
    g.restore();
    return;
  }

  /* 矢量兜底：白色圆头 */
  g.fillStyle = '#ffffff';
  g.beginPath(); g.ellipse(x, headCy, R, R * 1.06, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#2b2b2b'; g.lineWidth = 2.2; g.stroke();

  /* 头顶一撮黑发 */
  g.strokeStyle = '#1a1a1a'; g.lineWidth = 3; g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x - 3, headCy - R * 1.0);
  g.quadraticCurveTo(x + 4, headCy - R * 1.5, x + 11, headCy - R * 1.05);
  g.stroke();
  g.beginPath();
  g.moveTo(x + 2, headCy - R * 0.98);
  g.quadraticCurveTo(x + 7, headCy - R * 1.35, x + 13, headCy - R * 0.9);
  g.stroke();

  if(o.dead){
    g.fillStyle = 'rgba(30,30,30,0.85)';
    g.beginPath(); g.ellipse(x, headCy, R, R * 1.06, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#ff5b4d'; g.lineWidth = 2.5; g.lineCap = 'round';
    [-1, 1].forEach(function(s){
      var ex = x + s * 7, ey = headCy - 3;
      g.beginPath(); g.moveTo(ex - 4, ey - 4); g.lineTo(ex + 4, ey + 4);
      g.moveTo(ex + 4, ey - 4); g.lineTo(ex - 4, ey + 4); g.stroke();
    });
    g.beginPath(); g.arc(x, headCy + 8, 5, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
  } else {
    /* 小豆眼 + 微笑 */
    g.fillStyle = '#1a1a1a';
    [-1, 1].forEach(function(s){
      g.beginPath(); g.arc(x + s * 6.5, headCy - 2, 2.4, 0, Math.PI * 2); g.fill();
    });
    g.strokeStyle = '#1a1a1a'; g.lineWidth = 2; g.lineCap = 'round';
    g.beginPath(); g.arc(x, headCy + 3, 6.5, 0.18 * Math.PI, 0.82 * Math.PI); g.stroke();
    g.fillStyle = 'rgba(255,150,150,.45)';
    [-1, 1].forEach(function(s){
      g.beginPath(); g.ellipse(x + s * 11, headCy + 3, 3.6, 2.4, 0, 0, Math.PI * 2); g.fill();
    });
  }
  g.restore();
}

/* ---------- 小矮人（初版建模，仿《黄金矿工》矮人；后续收到正式建模图整体替换本函数即可）----------
   g: 画布上下文  (cx,cy): 中心  (w,h): 尺寸——尺寸由 ITEMCFG.dwarf 按 DWARF_SCALE=0.65 给出
                                             （34×40 ≈ 普通奶蛙的 60%~70%，碰撞占位同步缩小）
   o: { t: 全局时间(秒), walk: 是否走动(游走中恒为 true), flip: 朝向, ph: 步伐相位 }
   造型：黄色矿灯安全帽 + 大胡子 + 蓝色背带工装 + 铁镐 */
function drawDwarf(g, cx, cy, w, h, o){
  o = o || {};
  var t = o.t || 0;
  var line = '#3a2410';
  var SKIN = '#ffd9a8';
  var HELM = '#ffcc33';
  var DENIM = '#3f6fb5';
  g.save();
  if(o.flip){ g.translate(cx, cy); g.scale(-1, 1); cx = 0; cy = 0; }
  g.lineJoin = 'round'; g.lineCap = 'round';

  /* 走动时上下颠步（相位按只错开，避免全场同步蹦跶） */
  var bob = o.walk ? Math.sin(t * 6 + (o.ph || 0)) * h * 0.03 : 0;
  g.translate(0, bob);

  /* 小矮人贴图：有素材就等比适配居中画进原版 35x39 框内（flip/bob 已在此层生效），
     保持原始比例不拉伸、不越框；素材未加载完则回退下方原矢量造型 */
  if(imgOK(IMG.dwarf)){
    var kAr = IMG.dwarf.naturalWidth / IMG.dwarf.naturalHeight;
    var kDw = w, kDh = w / kAr;
    if(kDh > h){ kDh = h; kDw = h * kAr; }
    g.drawImage(IMG.dwarf, cx - kDw / 2, cy - kDh / 2, kDw, kDh);
    g.restore();
    return;
  }

  /* 铁镐（背后） */
  g.strokeStyle = '#8a5a1f'; g.lineWidth = Math.max(2, w * 0.05);
  g.beginPath();
  g.moveTo(cx + w * 0.30, cy - h * 0.24);
  g.lineTo(cx + w * 0.44, cy + h * 0.36);
  g.stroke();
  g.strokeStyle = '#b9c2cc'; g.lineWidth = Math.max(2.5, w * 0.07);
  g.beginPath();
  g.moveTo(cx + w * 0.18, cy - h * 0.34);
  g.quadraticCurveTo(cx + w * 0.34, cy - h * 0.24, cx + w * 0.42, cy - h * 0.30);
  g.stroke();

  /* 鞋子 */
  g.fillStyle = '#5a3a1f'; g.strokeStyle = line; g.lineWidth = Math.max(1.5, w * 0.035);
  [-1, 1].forEach(function(s){
    g.beginPath();
    g.ellipse(cx + s * w * 0.20, cy + h * 0.44, w * 0.17, h * 0.08, 0, 0, Math.PI * 2);
    g.fill(); g.stroke();
  });

  /* 身体：蓝色背带工装 */
  g.fillStyle = DENIM;
  g.beginPath();
  g.moveTo(cx - w * 0.34, cy + h * 0.06);
  g.quadraticCurveTo(cx - w * 0.40, cy + h * 0.34, cx - w * 0.30, cy + h * 0.40);
  g.lineTo(cx + w * 0.30, cy + h * 0.40);
  g.quadraticCurveTo(cx + w * 0.40, cy + h * 0.34, cx + w * 0.34, cy + h * 0.06);
  g.quadraticCurveTo(cx, cy - h * 0.06, cx - w * 0.34, cy + h * 0.06);
  g.closePath(); g.fill(); g.stroke();
  /* 背带 */
  g.lineWidth = Math.max(2, w * 0.06);
  g.beginPath();
  g.moveTo(cx - w * 0.16, cy + h * 0.04); g.lineTo(cx - w * 0.20, cy - h * 0.16);
  g.moveTo(cx + w * 0.16, cy + h * 0.04); g.lineTo(cx + w * 0.20, cy - h * 0.16);
  g.stroke();
  /* 纽扣 */
  g.fillStyle = '#ffd93d';
  [-1, 1].forEach(function(s){
    g.beginPath(); g.arc(cx + s * w * 0.17, cy + h * 0.05, w * 0.04, 0, Math.PI * 2); g.fill();
  });

  /* 手臂 */
  [-1, 1].forEach(function(s){
    g.fillStyle = SKIN; g.strokeStyle = line;
    g.lineWidth = Math.max(1.5, w * 0.035);
    g.beginPath();
    g.ellipse(cx + s * w * 0.38, cy + h * 0.14, w * 0.09, h * 0.15, s * 0.5, 0, Math.PI * 2);
    g.fill(); g.stroke();
  });

  /* 头（大胡子占下半张脸） */
  g.fillStyle = SKIN; g.strokeStyle = line;
  g.lineWidth = Math.max(2, w * 0.04);
  g.beginPath(); g.ellipse(cx, cy - h * 0.20, w * 0.34, h * 0.30, 0, 0, Math.PI * 2);
  g.fill(); g.stroke();

  /* 大胡子：盖住嘴和下巴 */
  g.fillStyle = '#d9a441';
  g.beginPath();
  g.moveTo(cx - w * 0.33, cy - h * 0.20);
  g.quadraticCurveTo(cx - w * 0.34, cy + h * 0.24, cx, cy + h * 0.26);
  g.quadraticCurveTo(cx + w * 0.34, cy + h * 0.24, cx + w * 0.33, cy - h * 0.20);
  g.quadraticCurveTo(cx + w * 0.18, cy - h * 0.06, cx, cy - h * 0.10);
  g.quadraticCurveTo(cx - w * 0.18, cy - h * 0.06, cx - w * 0.33, cy - h * 0.20);
  g.closePath(); g.fill(); g.stroke();

  /* 眼睛 / 眉毛 */
  g.fillStyle = '#2b1c10';
  [-1, 1].forEach(function(s){
    g.beginPath(); g.arc(cx + s * w * 0.13, cy - h * 0.24, Math.max(2, w * 0.045), 0, Math.PI * 2); g.fill();
  });
  g.strokeStyle = '#8a5a1f'; g.lineWidth = Math.max(2, w * 0.05);
  [-1, 1].forEach(function(s){
    g.beginPath();
    g.moveTo(cx + s * w * 0.05, cy - h * 0.33);
    g.lineTo(cx + s * w * 0.21, cy - h * 0.30);
    g.stroke();
  });
  /* 鼻子 */
  g.fillStyle = '#ffb87a';
  g.beginPath(); g.ellipse(cx, cy - h * 0.16, w * 0.07, h * 0.055, 0, 0, Math.PI * 2); g.fill();

  /* 黄色安全帽 + 矿灯 */
  g.fillStyle = HELM; g.strokeStyle = line; g.lineWidth = Math.max(2, w * 0.04);
  g.beginPath();
  g.ellipse(cx, cy - h * 0.38, w * 0.36, h * 0.26, 0, Math.PI, 0);
  g.closePath(); g.fill(); g.stroke();
  /* 帽檐 */
  g.fillStyle = '#f0b429';
  g.beginPath();
  g.ellipse(cx, cy - h * 0.38, w * 0.46, h * 0.07, 0, 0, Math.PI * 2);
  g.fill(); g.stroke();
  /* 矿灯 */
  g.fillStyle = '#fff6c9';
  g.beginPath(); g.arc(cx, cy - h * 0.50, Math.max(2.5, w * 0.075), 0, Math.PI * 2);
  g.fill(); g.stroke();
  g.fillStyle = 'rgba(255,240,150,.35)';
  g.beginPath(); g.arc(cx, cy - h * 0.50, w * 0.13, 0, Math.PI * 2); g.fill();

  g.restore();
}

/* ---------- od厂长：棕色乱发 + 大胡子 + 藏青白条纹T恤 ----------
   g 为画布，(x,y) 为头顶位置，s 为缩放（s=1 时约 150 宽 × 315 高） */
function drawBoss(g, x, y, s, o){
  o = o || {};
  var angry = !!o.angry;
  var SKIN = '#fdecd8', SKIN_S = '#f3d6bb';
  var HAIR = '#5b3a1f', HAIR_L = '#7a4f2a';
  var NAVY = '#2b3047', WHITE = '#ffffff';
  var line = '#2b1c10';

  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.lineJoin = 'round'; g.lineCap = 'round';

  /* ---- 腿与凉鞋 ---- */
  [-1, 1].forEach(function(si){
    g.fillStyle = SKIN;
    g.strokeStyle = line; g.lineWidth = 4;
    roundRectPath(g, si * 26 - 17, 268, 34, 44, 12); g.fill(); g.stroke();
    /* 凉鞋 */
    g.fillStyle = '#3a2a18';
    roundRectPath(g, si * 26 - 24, 306, 48, 16, 8); g.fill(); g.stroke();
    g.fillStyle = SKIN;
    roundRectPath(g, si * 26 - 18, 300, 36, 14, 7); g.fill(); g.stroke();
    g.strokeStyle = '#3a2a18'; g.lineWidth = 5;
    g.beginPath();
    g.moveTo(si * 26 - 14, 302); g.lineTo(si * 26 + 4, 312);
    g.stroke();
  });

  /* ---- 短裤 ---- */
  g.fillStyle = '#2f3a2b';
  g.strokeStyle = line; g.lineWidth = 4;
  g.beginPath();
  g.moveTo(-56, 224); g.lineTo(56, 224); g.lineTo(50, 282);
  g.lineTo(6, 282); g.quadraticCurveTo(0, 268, -6, 282);
  g.lineTo(-50, 282);
  g.closePath(); g.fill(); g.stroke();

  /* ---- 条纹T恤 ---- */
  g.save();
  g.beginPath();
  g.moveTo(-64, 138);
  g.quadraticCurveTo(-74, 176, -66, 232);
  g.lineTo(66, 232);
  g.quadraticCurveTo(74, 176, 64, 138);
  g.quadraticCurveTo(34, 124, 0, 132);
  g.quadraticCurveTo(-34, 124, -64, 138);
  g.closePath();
  g.clip();
  g.fillStyle = NAVY;
  g.fillRect(-80, 120, 160, 130);
  g.fillStyle = WHITE;
  for(var sy = 142; sy < 232; sy += 18){
    g.fillRect(-80, sy, 160, 9);
  }
  g.restore();
  g.strokeStyle = line; g.lineWidth = 4;
  g.beginPath();
  g.moveTo(-64, 138);
  g.quadraticCurveTo(-74, 176, -66, 232);
  g.lineTo(66, 232);
  g.quadraticCurveTo(74, 176, 64, 138);
  g.quadraticCurveTo(34, 124, 0, 132);
  g.quadraticCurveTo(-34, 124, -64, 138);
  g.closePath();
  g.stroke();

  /* ---- 手臂（短袖外露出的前臂，画在T恤之后） ---- */
  [-1, 1].forEach(function(si){
    g.fillStyle = SKIN;
    g.strokeStyle = line; g.lineWidth = 4;
    g.beginPath();
    g.moveTo(si * 58, 148);
    g.quadraticCurveTo(si * 92, 176, si * 86, 226);
    g.quadraticCurveTo(si * 84, 244, si * 68, 244);
    g.quadraticCurveTo(si * 74, 204, si * 62, 172);
    g.closePath(); g.fill(); g.stroke();
    /* 手 */
    g.fillStyle = SKIN;
    g.beginPath(); g.ellipse(si * 78, 244, 15, 14, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    /* 拇指 */
    g.lineWidth = 3;
    g.beginPath(); g.moveTo(si * 70, 240); g.quadraticCurveTo(si * 78, 236, si * 86, 240); g.stroke();
  });

  /* ---- 耳朵 ---- */
  [-1, 1].forEach(function(si){
    g.fillStyle = SKIN;
    g.strokeStyle = line; g.lineWidth = 4;
    g.beginPath(); g.ellipse(si * 54, 74, 13, 17, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.strokeStyle = SKIN_S; g.lineWidth = 3;
    g.beginPath(); g.arc(si * 56, 74, 6, Math.PI * 1.3, Math.PI * 1.9); g.stroke();
  });

  /* ---- 脸 ---- */
  g.fillStyle = angry ? '#ffd0b0' : SKIN;
  g.strokeStyle = line; g.lineWidth = 4;
  g.beginPath(); g.ellipse(0, 66, 54, 56, 0, 0, Math.PI * 2); g.fill(); g.stroke();

  /* 脸颊红晕 */
  g.fillStyle = 'rgba(240,120,110,.35)';
  [-1, 1].forEach(function(si){
    g.beginPath(); g.ellipse(si * 32, 84, 13, 8, 0, 0, Math.PI * 2); g.fill();
  });

  /* ---- 大胡子（覆盖下半张脸）---- */
  g.fillStyle = HAIR;
  g.strokeStyle = line; g.lineWidth = 4;
  g.beginPath();
  g.moveTo(-52, 66);
  g.quadraticCurveTo(-58, 108, -40, 130);
  g.quadraticCurveTo(-20, 148, 0, 146);
  g.quadraticCurveTo(20, 148, 40, 130);
  g.quadraticCurveTo(58, 108, 52, 66);
  g.quadraticCurveTo(34, 84, 18, 86);
  g.quadraticCurveTo(0, 94, -18, 86);
  g.quadraticCurveTo(-34, 84, -52, 66);
  g.closePath(); g.fill(); g.stroke();

  /* 胡子上的嘴 */
  if(angry){
    /* 怒：咬牙切齿 */
    g.fillStyle = '#ffffff';
    roundRectPath(g, -18, 104, 36, 18, 5); g.fill();
    g.strokeStyle = '#2b1c10'; g.lineWidth = 3;
    g.beginPath();
    g.moveTo(-18, 113); g.lineTo(18, 113);
    g.moveTo(-9, 104); g.lineTo(-9, 122);
    g.moveTo(9, 104); g.lineTo(9, 122);
    g.stroke();
    g.beginPath(); g.moveTo(-20, 100); g.lineTo(20, 100); g.stroke();
  } else {
    g.fillStyle = '#ffffff';
    roundRectPath(g, -16, 104, 32, 14, 6); g.fill();
    g.strokeStyle = '#2b1c10'; g.lineWidth = 3;
    g.stroke();
  }

  /* ---- 眉毛 / 眼睛 ---- */
  g.fillStyle = '#2b1c10';
  [-1, 1].forEach(function(si){
    g.beginPath(); g.ellipse(si * 20, 68, 7, 8, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffffff';
    g.beginPath(); g.arc(si * 20 - 2, 65, 2.4, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2b1c10';
  });
  g.strokeStyle = HAIR; g.lineWidth = 7;
  [-1, 1].forEach(function(si){
    g.beginPath();
    if(angry){
      g.moveTo(si * 8, 46); g.lineTo(si * 34, 56);
    } else {
      g.moveTo(si * 8, 50); g.lineTo(si * 32, 47);
    }
    g.stroke();
  });

  /* 鼻子 */
  g.fillStyle = SKIN_S;
  g.strokeStyle = line; g.lineWidth = 3;
  g.beginPath(); g.ellipse(0, 84, 9, 7, 0, 0, Math.PI * 2); g.fill(); g.stroke();

  /* ---- 头发：棕色乱发 ---- */
  g.fillStyle = HAIR;
  g.strokeStyle = line; g.lineWidth = 4;
  g.beginPath();
  g.moveTo(-56, 60);
  g.quadraticCurveTo(-70, 10, -40, -6);
  g.quadraticCurveTo(-30, -22, -8, -12);
  g.quadraticCurveTo(4, -30, 22, -14);
  g.quadraticCurveTo(48, -22, 54, 6);
  g.quadraticCurveTo(72, 26, 56, 62);
  g.quadraticCurveTo(46, 34, 34, 30);
  g.quadraticCurveTo(10, 40, -12, 32);
  g.quadraticCurveTo(-34, 40, -50, 34);
  g.closePath(); g.fill(); g.stroke();
  /* 发丝高光 */
  g.strokeStyle = HAIR_L; g.lineWidth = 5;
  g.beginPath();
  g.moveTo(-34, 6); g.quadraticCurveTo(-24, -8, -6, -4);
  g.moveTo(6, -8); g.quadraticCurveTo(24, -12, 36, 4);
  g.stroke();

  /* 怒气符号 */
  if(angry){
    g.fillStyle = '#ff4d3d';
    g.beginPath(); g.arc(56, 20, 7, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(68, 8, 9, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffd93d';
    g.beginPath(); g.arc(68, 8, 4.5, 0, Math.PI * 2); g.fill();
  }
  g.restore();
}

/* ---------- 天空里的飞机 ---------- */
function drawPlane(g, x, y, angry){
  g.save();
  g.fillStyle = 'rgba(0,0,0,0.15)';
  g.beginPath(); g.ellipse(x, y + 14, 32, 4, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#ffffff'; g.strokeStyle = '#9ab8d6'; g.lineWidth = 2;
  g.beginPath(); g.ellipse(x, y, 34, 11, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = '#cfe6ff';
  g.beginPath(); g.ellipse(x - 6, y - 4, 14, 7, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.moveTo(x - 18, y - 2); g.lineTo(x - 10, y - 22); g.lineTo(x + 6, y - 22); g.lineTo(x + 12, y - 2);
  g.closePath(); g.fill(); g.stroke();
  g.beginPath();
  g.moveTo(x + 24, y - 4); g.lineTo(x + 32, y - 16); g.lineTo(x + 38, y - 4);
  g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = '#666'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(x - 34, y); g.lineTo(x - 42, y); g.stroke();
  g.fillStyle = '#888';
  g.beginPath(); g.ellipse(x - 42, y, 2, 8, 0, 0, Math.PI * 2); g.fill();
  /* 机长 od 只露头肩（原站 od-boss 素材，失败时矢量兜底） */
  g.save();
  g.beginPath(); g.rect(x - 26, y - 54, 52, 52); g.clip();
  if(imgOK(IMG.od)){
    var ow = IMG.od.naturalWidth, oh = IMG.od.naturalHeight;
    var srcH = oh * 0.45;
    var dw = 34, dh = dw * srcH / ow;
    g.drawImage(IMG.od, 0, 0, ow, srcH, x - dw / 2, y - dh - 2, dw, dh);
  } else {
    drawBoss(g, x - 6, y - 44, 0.24, { angry: false });
  }
  g.restore();
  if(angry){
    g.fillStyle = '#ff6b3a';
    g.beginPath(); g.arc(x - 6, y - 40, 5, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(x + 2, y - 44, 6, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(x + 8, y - 38, 4, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffd75e';
    g.beginPath(); g.arc(x + 2, y - 44, 3, 0, Math.PI * 2); g.fill();
  }
  g.restore();
}

/* ---------- 场景 ---------- */
function drawBg(g){
  g = g || ctx;
  var sky = g.createLinearGradient(0, 0, 0, SOIL_TOP);
  sky.addColorStop(0, '#a9dcff'); sky.addColorStop(1, '#e7f6ff');
  g.fillStyle = sky; g.fillRect(0, 0, W, SOIL_TOP);
  g.fillStyle = '#58a84f'; g.fillRect(0, 132, W, 24);
  g.fillStyle = '#3f8038'; g.fillRect(0, 150, W, 8);
  var soil = g.createLinearGradient(0, 158, 0, H);
  soil.addColorStop(0, '#8a5a2b'); soil.addColorStop(0.5, '#7a4a21'); soil.addColorStop(1, '#4d2f14');
  g.fillStyle = soil; g.fillRect(0, 158, W, H - 158);

  for(var i = 0; i < G.deco.length; i++){
    var d = G.deco[i];
    if(d.c === 'root'){
      g.strokeStyle = 'rgba(40,22,8,0.35)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(d.x, d.y);
      g.quadraticCurveTo(d.x + Math.cos(d.ang) * d.len * 0.5, d.y - 10,
                         d.x + Math.cos(d.ang) * d.len, d.y - 18);
      g.stroke();
    } else {
      g.fillStyle = d.c;
      g.beginPath(); g.ellipse(d.x, d.y, d.r, d.r * 0.7, 0, 0, Math.PI * 2); g.fill();
    }
  }
  /* 云 */
  g.fillStyle = 'rgba(255,255,255,.85)';
  [[110, 44, 1], [640, 62, .8], [330, 34, .65]].forEach(function(c){
    var cx = c[0], cy = c[1], s = c[2];
    g.beginPath();
    g.arc(cx, cy, 16 * s, 0, Math.PI * 2);
    g.arc(cx + 18 * s, cy + 4 * s, 13 * s, 0, Math.PI * 2);
    g.arc(cx - 18 * s, cy + 5 * s, 12 * s, 0, Math.PI * 2);
    g.arc(cx + 4 * s, cy - 8 * s, 13 * s, 0, Math.PI * 2);
    g.fill();
  });
}

function drawHut(g, px){
  var hx = px + 90;
  g.fillStyle = '#8a4b22';
  g.beginPath(); g.moveTo(hx - 72, 66); g.lineTo(hx + 72, 66); g.lineTo(hx, 38); g.closePath(); g.fill();
  g.fillStyle = '#a05c2a';
  g.beginPath(); g.moveTo(hx - 72, 66); g.lineTo(hx + 72, 66); g.lineTo(hx, 44); g.closePath(); g.fill();
  g.fillStyle = '#6b4226';
  roundRectPath(g, hx - 58, 66, 116, 64, 6); g.fill();
  g.fillStyle = '#57321a';
  roundRectPath(g, hx - 58, 66, 116, 12, 6); g.fill();
  g.fillStyle = '#ffe9a0';
  roundRectPath(g, hx - 20, 80, 40, 28, 5); g.fill();
  g.strokeStyle = '#57321a'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(hx, 80); g.lineTo(hx, 108); g.moveTo(hx - 20, 94); g.lineTo(hx + 20, 94); g.stroke();
  /* 支点绞盘 */
  g.fillStyle = '#3a2410';
  g.beginPath(); g.arc(px, PIVOT.y + 3, 9, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#caa44e';
  g.beginPath(); g.arc(px, PIVOT.y + 3, 4, 0, Math.PI * 2); g.fill();
}

/* ---------- 物品 ---------- */
function drawDiamond(g, x, y, s, t){
  g.save(); g.translate(x, y);
  var tw = 0.65 + 0.35 * Math.sin(t * 4.2);
  g.globalAlpha = tw;
  var h = s, w = s;
  var grad = g.createLinearGradient(0, -h / 2, 0, h / 2);
  grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.35, '#e6f7ff');
  grad.addColorStop(0.7, '#a5d8f5'); grad.addColorStop(1, '#5babe4');
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(0, -h / 2); g.lineTo(w * 0.4, -h * 0.42); g.lineTo(w / 2, h * 0.05);
  g.lineTo(0, h / 2); g.lineTo(-w / 2, h * 0.05); g.lineTo(-w * 0.4, -h * 0.42);
  g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.95)';
  g.beginPath();
  g.moveTo(0, -h / 2); g.lineTo(w * 0.4, -h * 0.42); g.lineTo(0, -h * 0.34); g.lineTo(-w * 0.4, -h * 0.42);
  g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 1.2;
  var fl = (0.5 + 0.5 * Math.sin(t * 5)) * s * 0.42;
  g.beginPath(); g.moveTo(-fl, 0); g.lineTo(fl, 0); g.moveTo(0, -fl * 1.2); g.lineTo(0, fl * 0.8); g.stroke();
  g.globalAlpha = 1;
  g.restore();
}

function drawRock(g, x, y, w, h, offs){
  var pts = 7;
  if(!offs || offs.length < pts) offs = [0.9, 0.85, 0.95, 0.88, 0.92, 0.84, 0.9];
  g.save(); g.translate(x, y);
  var grad = g.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  grad.addColorStop(0, '#9a9186'); grad.addColorStop(1, '#6f675c');
  g.fillStyle = grad;
  g.beginPath();
  for(var j = 0; j < pts; j++){
    var a = (j / pts) * Math.PI * 2;
    var px = Math.cos(a) * w / 2 * offs[j], py = Math.sin(a) * h / 2 * offs[j];
    if(j === 0) g.moveTo(px, py); else g.lineTo(px, py);
  }
  g.closePath(); g.fill();
  g.strokeStyle = 'rgba(40,32,22,0.5)'; g.lineWidth = 2.5; g.stroke();
  g.strokeStyle = 'rgba(40,32,22,0.35)'; g.lineWidth = 2;
  g.beginPath();
  g.moveTo(-w * 0.16, -h * 0.22); g.lineTo(-w * 0.03, h * 0.06); g.lineTo(-w * 0.18, h * 0.24);
  g.stroke();
  g.restore();
}

/* 问号袋：画布袋（束口麻袋 + 问号）——纯矢量，后续要换贴图可整体替换本函数
   g: 画布上下文  (cx,cy): 中心  (w,h): 尺寸
   o: { t: 全局时间(秒), grabbed: 是否被抓在钩上 } */
function drawBag(g, cx, cy, w, h, o){
  o = o || {};
  var t = o.t || 0;
  var line = '#5a3a1f';
  g.save();
  g.lineJoin = 'round'; g.lineCap = 'round';

  /* 待机轻微呼吸晃动 / 被抓时左右猛晃（同矮人挣扎的表现手法） */
  var rot = o.grabbed ? Math.sin(t * 30) * 0.09 : Math.sin(t * 2.2) * 0.035;
  g.translate(cx, cy); g.rotate(rot);
  var pulse = 1 + Math.sin(t * 3.1) * 0.02;
  g.scale(pulse, pulse);
  g.translate(-cx, -cy);

  /* 问号袋贴图（冰红茶瓶）：有素材就等比适配居中画进原版 44x52 框内，
     上面的呼吸/挣扎旋转缩放已生效；素材未加载完则回退下方矢量布袋 */
  if(imgOK(IMG.bag)){
    var bagAr = IMG.bag.naturalWidth / IMG.bag.naturalHeight;
    var bagDw = w, bagDh = w / bagAr;
    if(bagDh > h){ bagDh = h; bagDw = h * bagAr; }
    g.drawImage(IMG.bag, cx - bagDw / 2, cy - bagDh / 2, bagDw, bagDh);
    g.restore();
    return;
  }

  /* 袋身：上窄下宽的鼓布袋 */
  var grad = g.createLinearGradient(cx - w * 0.5, cy - h * 0.5, cx + w * 0.5, cy + h * 0.5);
  grad.addColorStop(0, '#f2d49a');
  grad.addColorStop(0.55, '#d5a961');
  grad.addColorStop(1, '#9e733a');
  g.fillStyle = grad;
  g.strokeStyle = line;
  g.lineWidth = Math.max(2, w * 0.05);
  g.beginPath();
  g.moveTo(cx - w * 0.17, cy - h * 0.26);
  g.bezierCurveTo(cx - w * 0.47, cy - h * 0.14, cx - w * 0.51, cy + h * 0.24, cx - w * 0.27, cy + h * 0.42);
  g.quadraticCurveTo(cx, cy + h * 0.57, cx + w * 0.27, cy + h * 0.42);
  g.bezierCurveTo(cx + w * 0.51, cy + h * 0.24, cx + w * 0.47, cy - h * 0.14, cx + w * 0.17, cy - h * 0.26);
  g.closePath();
  g.fill(); g.stroke();

  /* 底部褶皱 */
  g.strokeStyle = 'rgba(90,58,31,0.5)';
  g.lineWidth = Math.max(1.2, w * 0.03);
  [-0.20, 0.17].forEach(function(px){
    g.beginPath();
    g.moveTo(cx + px * w, cy + h * 0.20);
    g.quadraticCurveTo(cx + (px + 0.05) * w, cy + h * 0.33, cx + (px - 0.01) * w, cy + h * 0.46);
    g.stroke();
  });

  /* 高光 */
  g.fillStyle = 'rgba(255,255,255,0.35)';
  g.beginPath();
  g.ellipse(cx - w * 0.22, cy + h * 0.04, w * 0.10, h * 0.17, -0.4, 0, Math.PI * 2);
  g.fill();

  /* 袋口张开的布边（三片扇褶，锯齿轮廓） */
  var m0 = cx - w * 0.17, m1 = cx + w * 0.17, my = cy - h * 0.26;
  g.fillStyle = '#e8c88c';
  g.strokeStyle = line;
  g.lineWidth = Math.max(1.5, w * 0.035);
  g.beginPath();
  g.moveTo(m0, my);
  g.lineTo(m0 + w * 0.05, my - h * 0.13);
  g.lineTo(m0 + w * 0.11, my - h * 0.05);
  g.lineTo(cx, my - h * 0.18);
  g.lineTo(m1 - w * 0.11, my - h * 0.05);
  g.lineTo(m1 - w * 0.05, my - h * 0.13);
  g.lineTo(m1, my);
  g.closePath(); g.fill(); g.stroke();

  /* 束口绳 */
  g.strokeStyle = '#8a5a1f';
  g.lineWidth = Math.max(2.5, w * 0.075);
  g.beginPath();
  g.moveTo(m0, my + h * 0.02);
  g.quadraticCurveTo(cx, my + h * 0.08, m1, my + h * 0.02);
  g.stroke();
  /* 绳结 */
  g.fillStyle = '#a06a2f';
  g.beginPath(); g.arc(cx, my + h * 0.05, Math.max(2.5, w * 0.06), 0, Math.PI * 2); g.fill();

  /* 正面大问号 */
  drawText(g, '?', cx, cy + h * 0.10, Math.round(h * 0.46), '#ffe14d', '#6b4212');
  /* 两侧小闪光点 */
  g.fillStyle = 'rgba(255,255,255,0.85)';
  var tw = 0.5 + 0.5 * Math.sin(t * 5);
  [[-1, -0.05], [1, 0.30]].forEach(function(p){
    var sx = cx + p[0] * w * 0.38, sy = cy + p[1] * h;
    g.beginPath();
    g.moveTo(sx, sy - 4 * tw - 1); g.lineTo(sx + 1.6, sy); g.lineTo(sx, sy + 4 * tw + 1); g.lineTo(sx - 1.6, sy);
    g.closePath(); g.fill();
  });

  g.restore();
}

function drawIce(g, x, y, cubes, w, h, ratio){
  g.save();
  g.translate(x, y);
  g.globalAlpha = 0.72 + 0.28 * clamp(ratio, 0, 1);
  var s = Math.min(w, h) * 0.42;
  if(cubes === 1) drawIceCube(g, 0, 0, s);
  else if(cubes === 2){ drawIceCube(g, -w * 0.24, 0, s * 0.9); drawIceCube(g, w * 0.24, -h * 0.06, s * 0.9); }
  else { drawIceCube(g, -w * 0.28, h * 0.1, s * 0.78); drawIceCube(g, w * 0.26, h * 0.12, s * 0.72); drawIceCube(g, 0, -h * 0.26, s * 0.8); }
  g.restore();
}

/* 冰块：接近透明的白冰（参考造型） */
function drawIceCube(g, dx, dy, s){
  var grad = g.createLinearGradient(-s, -s, s, s);
  grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.55, '#eaf5fe'); grad.addColorStop(1, '#cde8fa');
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(-s * 0.9 + dx, -s * 0.6 + dy);
  g.lineTo(-s * 0.5 + dx, -s + dy);
  g.lineTo(s * 0.7 + dx, -s * 0.85 + dy);
  g.lineTo(s * 0.95 + dx, -s * 0.2 + dy);
  g.lineTo(s * 0.6 + dx, s * 0.85 + dy);
  g.lineTo(-s * 0.6 + dx, s * 0.9 + dy);
  g.closePath(); g.fill();
  g.strokeStyle = '#a9d8f2'; g.lineWidth = Math.max(1.5, s * 0.08); g.stroke();
  /* 高光棱面 */
  g.fillStyle = 'rgba(255,255,255,.95)';
  g.beginPath();
  g.moveTo(-s * 0.5 + dx, -s * 0.6 + dy);
  g.lineTo(-s * 0.1 + dx, -s * 0.8 + dy);
  g.lineTo(-s * 0.3 + dx, -s * 0.2 + dy);
  g.closePath(); g.fill();
  /* 气泡 */
  g.fillStyle = 'rgba(255,255,255,.8)';
  [[0.25, 0.2, 0.09], [-0.2, 0.35, 0.07], [0.4, -0.35, 0.06]].forEach(function(p){
    g.beginPath(); g.arc(dx + p[0] * s, dy + p[1] * s, p[2] * s, 0, Math.PI * 2); g.fill();
  });
}

function drawRareGlow(g, x, y, r, t){
  var grad = g.createRadialGradient(x, y, 0, x, y, r);
  grad.addColorStop(0, 'rgba(255,225,77,0.55)');
  grad.addColorStop(0.5, 'rgba(255,157,61,0.25)');
  grad.addColorStop(1, 'rgba(255,157,61,0)');
  g.fillStyle = grad;
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  g.save();
  g.translate(x, y); g.rotate(t * 1.5);
  for(var i = 0; i < 6; i++){
    g.rotate(Math.PI / 3);
    var rg = g.createLinearGradient(0, 0, r, 0);
    rg.addColorStop(0, 'rgba(255,240,150,0.6)');
    rg.addColorStop(1, 'rgba(255,240,150,0)');
    g.fillStyle = rg;
    g.beginPath();
    g.moveTo(0, -4); g.lineTo(r, -1); g.lineTo(r, 1); g.lineTo(0, 4);
    g.closePath(); g.fill();
  }
  g.restore();
}

/* 居中画图（支持水平翻转） */
function drawImgC(g, im, cx, cy, w, h, flip){
  if(flip){
    g.save(); g.translate(cx, cy); g.scale(-1, 1);
    g.drawImage(im, -w / 2, -h / 2, w, h);
    g.restore();
  } else {
    g.drawImage(im, cx - w / 2, cy - h / 2, w, h);
  }
}
/* 钻石：有素材用素材，否则矢量 */
function drawDiamondItem(g, x, y, s, t){
  if(imgOK(IMG.diamond)) drawImgC(g, IMG.diamond, x, y, s, s, false);
  else drawDiamond(g, x, y, s, t);
}
/* 冰块：有素材用素材（保持原始比例、按融化程度变透明） */
function drawIceItem(g, it){
  var im = IMG.ice[Math.max(0, Math.min(2, it.cubes - 1))];
  if(imgOK(im)){
    var ar = im.naturalWidth / im.naturalHeight;
    var dw = it.w, dh = it.w / ar;
    if(dh > it.h){ dh = it.h; dw = it.h * ar; }
    g.save();
    g.globalAlpha = 0.72 + 0.28 * clamp(it.sizeRatio, 0, 1);
    g.drawImage(im, it.x - dw / 2, it.y - dh / 2, dw, dh);
    g.restore();
  } else {
    drawIce(g, it.x, it.y, it.cubes, it.w, it.h, it.sizeRatio);
  }
}

function drawItems(g, t){
  for(var i = 0; i < G.items.length; i++){
    var it = G.items[i];
    if(it.collected) continue;
    if(it.type !== 'rare') shadowEllipse(g, it.x, it.y, it.w, it.h);

    if(it.type === 'big'){
      var scale = 1, lift = 0;
      if(it.grabbed && G.claw.st === 'retract'){
        scale = Math.max(0.12, (G.claw.len - MINLEN) / 140);
        lift = (1 - scale) * 46;
      }
      var bw = it.w * scale, bh = it.h * scale;
      var bx = it.x, by = it.y - 12 * (1 - scale) - lift;
      var flip = it.wander ? it.wander.dir < 0 : false;
      if(it.grabbed && imgOK(IMG.sheet)){
        /* 抓到时播放大笑序列帧 */
        var fr = Math.floor(t * 11) % SHEET_N;
        g.drawImage(IMG.sheet, fr * SHEET_W, 0, SHEET_W, SHEET_H, bx - bw / 2, by - bh / 2, bw, bh);
      } else if(imgOK(IMG.big)){
        drawImgC(g, IMG.big, bx, by, bw, bh, flip);
      } else {
        drawFrog(g, bx, by, bw, bh, {
          body: '#f0b94c', belly: '#ffe9b0', mood: it.grabbed ? 'laugh' : 'idle',
          flip: flip, t: t
        });
      }
      if(it.holdsDiamond && !(it.grabbed && G.claw.st === 'retract')){
        drawDiamondItem(g, it.x + it.w * 0.32, it.y + it.h * 0.1, 24, t);
      }
    } else if(it.type === 'small' || it.type === 'tiny'){
      var k = it.type === 'tiny' ? 0.72 : 1;
      if(imgOK(IMG.small)){
        drawImgC(g, IMG.small, it.x, it.y, it.w * k, it.h * k, false);
      } else {
        var col = it.type === 'tiny'
          ? { body: '#fbe9b0', belly: '#fffaf0' }
          : { body: '#f8df78', belly: '#fff6dd' };
        drawFrog(g, it.x, it.y, it.w * k, it.h * k, { body: col.body, belly: col.belly, t: t });
      }
    } else if(it.type === 'rare'){
      var info = RARE.filter(function(r){ return r.id === it.rareId; })[0] || RARE[0];
      var rim = IMG.rare[it.rareId];
      drawRareGlow(g, it.x, it.y, it.h * 0.9, t);
      g.fillStyle = 'rgba(0,0,0,0.22)';
      g.beginPath(); g.ellipse(it.x, it.y + it.h * 0.46, it.w * 0.4, 6, 0, 0, Math.PI * 2); g.fill();
      if(imgOK(rim)){
        var rh = it.h, rw = rh * rim.naturalWidth / rim.naturalHeight;
        drawImgC(g, rim, it.x, it.y, rw, rh, false);
      } else {
        drawFrog(g, it.x, it.y, it.w, it.h, { body: '#f5c14f', belly: '#fff6dc', t: t });
      }
    } else if(it.type === 'diamond'){
      drawDiamondItem(g, it.x, it.y, it.w, t);
    } else if(it.type === 'bag'){
      drawBag(g, it.x, it.y, it.w, it.h, { t: t, grabbed: it.grabbed });
    } else if(it.type === 'dwarf'){
      /* 抓在钩上时左右猛晃，表现挣扎 */
      var shake = it.grabbed ? Math.sin(t * 34) * 4 : 0;
      drawDwarf(g, it.x + shake, it.y, it.w, it.h,
                { t: t, walk: !it.grabbed, flip: it.flip || false, ph: it.walkPhase || 0 });
    } else if(it.type === 'rock'){
      drawRock(g, it.x, it.y, it.w, it.h, it.offs);
    } else if(it.type === 'ice'){
      drawIceItem(g, it);
    }
  }
}

/* ---------- 钩索 ---------- */
function drawChain(g){
  var c = G.claw, tp = tip();
  if(c.item && c.item.type === 'big' && c.st === 'retract'){
    tp.x += (Math.random() - 0.5) * 3.2;
    tp.y += (Math.random() - 0.5) * 3.2;
  }
  g.strokeStyle = '#caa44e'; g.lineWidth = 3; g.lineCap = 'round';
  g.beginPath(); g.moveTo(PIVOT.x, PIVOT.y + 4); g.lineTo(tp.x, tp.y); g.stroke();
  g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(PIVOT.x + 1.5, PIVOT.y + 4); g.lineTo(tp.x + 1.5, tp.y); g.stroke();

  g.save();
  g.translate(tp.x, tp.y); g.rotate(c.angle);
  g.fillStyle = '#43331f'; g.fillRect(-6, 0, 12, 10);
  var spread = c.item ? 0.1 : 0.5;
  g.strokeStyle = '#6b5a33'; g.lineWidth = 3.5;
  g.beginPath(); g.moveTo(-5, 10); g.quadraticCurveTo(-5 - 8 * spread, 17, -2 - 7 * spread, 26); g.stroke();
  g.beginPath(); g.moveTo(5, 10); g.quadraticCurveTo(5 + 8 * spread, 17, 2 + 7 * spread, 26); g.stroke();
  g.restore();
}

function drawBomb(g){
  if(!G.bomb || G.bomb.exploded) return;
  g.fillStyle = '#222';
  g.beginPath(); g.arc(G.bomb.x, G.bomb.y, 8, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#666';
  g.beginPath(); g.arc(G.bomb.x - 3, G.bomb.y - 3, 2, 0, Math.PI * 2); g.fill();
}

/* ---------- 厂长发火过场（原站 od-angry 素材，失败时矢量兜底） ---------- */
function drawAngryCutscene(g){
  if(!G.angryState) return;
  var a = G.angryState;
  var slideT = Math.min(a.timer / 0.35, 1);
  var ease = 1 - Math.pow(1 - slideT, 3);
  var s = 1.15;
  var bw2 = 150 * s, bh2 = 330 * s;
  var odX = W + 40 - (W + 40 - (W - bw2 - 16)) * ease;
  var odY = H - bh2 + 26;
  g.save();
  g.translate(odX + bw2 / 2, odY + bh2 * 0.5);
  g.rotate(Math.sin(a.timer * 14) * 0.07);
  g.translate(-(odX + bw2 / 2), -(odY + bh2 * 0.5));
  if(imgOK(IMG.odAngry)){
    var natW = IMG.odAngry.naturalWidth, natH = IMG.odAngry.naturalHeight;
    var odW = 340, odH = odW * (natH * 0.72) / natW;
    var tx = W - odW - 16;
    var px = (W + 40) + (tx - (W + 40)) * ease;
    g.drawImage(IMG.odAngry, 0, 0, natW, natH * 0.72, px, H - odH, odW, odH);
  } else {
    drawBoss(g, odX, odY, s, { angry: true });
  }
  g.restore();

  var bw = 300, bh = 56;
  var bx = (W - bw) / 2, by = H - bh - 8;
  g.fillStyle = '#ffd75e'; g.strokeStyle = '#a06810'; g.lineWidth = 3;
  roundRectPath(g, bx, by, bw, bh, 14); g.fill(); g.stroke();
  var chars = Math.min(a.quote.length, Math.floor((a.timer - 0.35) * 12));
  if(chars > 0){
    g.fillStyle = '#4a2c0f';
    g.font = 'bold 20px ' + FONT;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(a.quote.substring(0, chars), bx + bw / 2, by + bh / 2);
  }
  if(!a.bullet.hit){
    g.fillStyle = '#222';
    g.beginPath(); g.arc(a.bullet.x, a.bullet.y, 6, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ff6b3a';
    g.beginPath(); g.arc(a.bullet.x - 2, a.bullet.y - 2, 2, 0, Math.PI * 2); g.fill();
  }
}

/* ---------- 飘字 / 粒子 ---------- */
function drawFx(g){
  for(var i = 0; i < G.fx.length; i++){
    var f = G.fx[i];
    g.save();
    g.globalAlpha = Math.max(0, f.life / f.max);
    g.translate(f.x, f.y); g.rotate(f.rot);
    drawText(g, f.txt, 0, 0, f.size, f.color);
    g.restore();
  }
  for(var j = 0; j < G.parts.length; j++){
    var p = G.parts[j];
    g.globalAlpha = Math.max(0, p.life / p.max);
    g.fillStyle = p.color;
    g.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  g.globalAlpha = 1;
}

/* ---------- 主绘制 ---------- */
function draw(){
  var g = ctx;
  g.save();
  if(G.shake > 0){
    g.translate((Math.random() - 0.5) * G.shake * 16, (Math.random() - 0.5) * G.shake * 16);
  }
  drawBg(g);
  drawItems(g, performance.now() / 1000);
  drawChain(g);
  drawHut(g, PIVOT.x);
  drawDandan(g, G.dandanX, G.dandanY, { jump: G.dandanJump, dead: G.dandanFaceDead });
  if(G.scene === 'play') drawPlane(g, G.planeX, G.planeY, G.odAngry > 0);
  drawBomb(g);
  drawAngryCutscene(g);
  drawFx(g);
  g.restore();
}

/* ===== 独立小画布：图鉴 / 分镜 / 首页 ===== */
function setupCanvas(el){
  if(!el) return null;
  var c = el.getContext('2d');
  var d = Math.min(window.devicePixelRatio || 1, 2);
  /* 逻辑尺寸只取一次，避免重复调用时被反复放大 */
  if(!el.dataset.w){ el.dataset.w = String(el.width); el.dataset.h = String(el.height); }
  var w = Number(el.dataset.w), h = Number(el.dataset.h);
  el.width = w * d; el.height = h * d;
  el.style.width = w + 'px'; el.style.height = 'auto';
  c.setTransform(d, 0, 0, d, 0, 0);
  c.clearW = w; c.clearH = h;
  return c;
}

function drawRareCard(info){
  var g = setupCanvas($('rareCanvas'));
  if(!g || !info) return;
  g.clearRect(0, 0, g.clearW, g.clearH);
  var t = performance.now() / 1000;
  drawRareGlow(g, g.clearW / 2, g.clearH / 2, 150, t);
  var rim = IMG.rare[info.id];
  if(imgOK(rim)){
    var rh = 280, rw = rh * rim.naturalWidth / rim.naturalHeight;
    if(rw > g.clearW - 20){ rw = g.clearW - 20; rh = rw * rim.naturalHeight / rim.naturalWidth; }
    g.drawImage(rim, (g.clearW - rw) / 2, (g.clearH - rh) / 2 + 10, rw, rh);
  } else {
    drawFrog(g, g.clearW / 2, g.clearH / 2 + 10, 200, 230, { mood: 'laugh', t: t });
  }
}

function drawDexCell(canvasEl, cfg){
  var g = setupCanvas(canvasEl);
  if(!g) return;
  g.clearRect(0, 0, g.clearW, g.clearH);
  var im = cfg.kind === 'big' ? IMG.big : (cfg.kind === 'rare' ? IMG.rare[cfg.rareId] : IMG.small);
  var cw = g.clearW, ch = g.clearH;
  if(cfg.owned){
    if(imgOK(im)){
      var dw = 62, dh = 62;
      if(cfg.kind === 'rare' || cfg.kind === 'big'){
        dh = 64; dw = dh * im.naturalWidth / im.naturalHeight;
        if(dw > cw - 8){ dw = cw - 8; dh = dw * im.naturalHeight / im.naturalWidth; }
      }
      g.drawImage(im, (cw - dw) / 2, (ch - dh) / 2 + 2, dw, dh);
    } else {
      drawFrog(g, cw / 2, ch / 2 + 4, 58, 62, cfg.frog);
    }
  } else {
    /* 未收集：原站做法是把小奶蛙压黑 */
    if(imgOK(IMG.small)){
      g.save();
      g.globalAlpha = .3;
      g.drawImage(IMG.small, (cw - 58) / 2, (ch - 58) / 2 + 2, 58, 58);
      g.restore();
    } else {
      g.save();
      g.globalAlpha = .35;
      drawFrog(g, cw / 2, ch / 2 + 4, 58, 62, { body: '#9a9a9a', belly: '#c8c8c8' });
      g.restore();
    }
    drawText(g, '?', cw / 2, ch / 2, 34, '#ffffff', 'rgba(0,0,0,.4)');
  }
}

/* 首页 / 说明里的装饰（原站素材优先，矢量兜底） */
function drawStaticFrogs(){
  var g1 = setupCanvas($('playFrog'));
  if(g1){
    g1.clearRect(0, 0, g1.clearW, g1.clearH);
    if(imgOK(IMG.small)) g1.drawImage(IMG.small, 6, 8, 84, 84);
    else drawFrog(g1, 48, 52, 84, 88, { body: '#f8df78', belly: '#fff6dd', mood: 'laugh', t: 1 });
  }

  var g2 = setupCanvas($('bossFrog'));
  if(g2){
    g2.clearRect(0, 0, g2.clearW, g2.clearH);
    var t = performance.now() / 1000;
    if(imgOK(IMG.odMenu)) g2.drawImage(IMG.odMenu, 0, 40, 210, 210);
    else drawBoss(g2, 76, 48, 0.75, { angry: false });
    if(imgOK(IMG.big)) g2.drawImage(IMG.big, 176, 132, 118, 166);
    else drawFrog(g2, 216, 246, 148, 184, { body: '#f0b94c', belly: '#ffe9b0', mood: 'idle', t: t });
  }

  var g3 = setupCanvas($('menuFrogBig'));
  if(g3){
    g3.clearRect(0, 0, g3.clearW, g3.clearH);
    if(imgOK(IMG.big)) g3.drawImage(IMG.big, 6, 4, 78, 110);
    else drawFrog(g3, 45, 55, 84, 104, { body: '#f0b94c', belly: '#ffe9b0', mood: 'laugh', t: 1 });
  }
  var g4 = setupCanvas($('menuFrogSmall'));
  if(g4){
    g4.clearRect(0, 0, g4.clearW, g4.clearH);
    if(imgOK(IMG.small)) g4.drawImage(IMG.small, 3, 3, 64, 64);
    else drawFrog(g4, 35, 38, 64, 66, { body: '#f8df78', belly: '#fff6dd', t: 1 });
  }
}

/* 分镜插画 */
function drawIntroArt(idx){
  var g = setupCanvas($('introCanvas'));
  if(!g) return;
  var Wc = g.clearW, Hc = g.clearH;
  var scene = INTRO_SCENES[idx] || INTRO_SCENES[0];
  var t = performance.now() / 1000;

  var sky = g.createLinearGradient(0, 0, 0, Hc);
  if(scene.art === 'cage' || scene.art === 'boss'){
    sky.addColorStop(0, '#3a2a1a'); sky.addColorStop(1, '#170f07');
  } else {
    sky.addColorStop(0, '#a9dcff'); sky.addColorStop(1, '#e7f6ff');
  }
  g.fillStyle = sky; g.fillRect(0, 0, Wc, Hc);

  if(scene.art === 'forest'){
    g.fillStyle = '#58a84f'; g.fillRect(0, Hc - 60, Wc, 60);
    if(imgOK(IMG.big)) g.drawImage(IMG.big, 80, Hc - 176, 108, 152);
    else drawFrog(g, 140, Hc - 96, 120, 130, { t: t, mood: 'laugh' });
    if(imgOK(IMG.small)) g.drawImage(IMG.small, 258, Hc - 130, 84, 84);
    else drawFrog(g, 300, Hc - 86, 92, 100, { body: '#f0b94c', belly: '#ffe9b0', t: t + 2 });
    if(imgOK(IMG.rare[8])) g.drawImage(IMG.rare[8], 372, Hc - 126, 76, 90);
    else drawFrog(g, 420, Hc - 78, 70, 76, { t: t + 4 });
  } else if(scene.art === 'boss'){
    g.fillStyle = '#241708'; g.fillRect(0, Hc - 70, Wc, 70);
    g.fillStyle = '#5a3a1a';
    g.fillRect(60, Hc - 190, 140, 120);
    g.fillStyle = '#7a5226';
    g.beginPath(); g.moveTo(40, Hc - 190); g.lineTo(220, Hc - 190); g.lineTo(130, Hc - 240); g.closePath(); g.fill();
    g.fillStyle = '#ff9d3d';
    g.beginPath(); g.arc(130, Hc - 140, 16, 0, Math.PI * 2); g.fill();
    drawText(g, '💰', 150, Hc - 140, 26, '#fff');
    if(imgOK(IMG.odMenu)) g.drawImage(IMG.odMenu, 300, 30, 240, 240);
    else drawBoss(g, 330, 40, 0.78, { angry: false });
  } else if(scene.art === 'cage'){
    g.fillStyle = '#241708'; g.fillRect(0, Hc - 60, Wc, 60);
    if(imgOK(IMG.big)) g.drawImage(IMG.big, 130, Hc - 178, 100, 140);
    else drawFrog(g, 180, Hc - 110, 110, 120, { t: t });
    /* 笼子 */
    g.strokeStyle = '#c9a227'; g.lineWidth = 7;
    g.strokeRect(110, Hc - 190, 150, 140);
    for(var i = 1; i < 5; i++){
      g.beginPath();
      g.moveTo(110 + i * 30, Hc - 190); g.lineTo(110 + i * 30, Hc - 50);
      g.stroke();
    }
    if(imgOK(IMG.odAngry)){
      var aw = 200, ah = aw * IMG.odAngry.naturalHeight / IMG.odAngry.naturalWidth;
      g.drawImage(IMG.odAngry, 0, 0, IMG.odAngry.naturalWidth, IMG.odAngry.naturalHeight * 0.6, 380, Hc - 250, aw, aw * (IMG.odAngry.naturalHeight * 0.6) / IMG.odAngry.naturalWidth);
    } else {
      drawBoss(g, 400, 45, 0.75, { angry: true });
    }
  } else if(scene.art === 'dandan'){
    g.fillStyle = '#58a84f'; g.fillRect(0, Hc - 60, Wc, 60);
    drawDandan(g, 170, Hc - 110, { jump: 0, dead: false });
    if(imgOK(IMG.odMenu)) g.drawImage(IMG.odMenu, 320, 40, 220, 220);
    else drawBoss(g, 380, 45, 0.75, { angry: false });
    drawText(g, '!', 250, Hc - 170, 60, '#ffd93d');
  } else if(scene.art === 'rare'){
    var rim = IMG.rare[5];
    drawRareGlow(g, Wc / 2, Hc / 2, 190, t);
    if(imgOK(rim)){
      var rh = 230, rw = rh * rim.naturalWidth / rim.naturalHeight;
      g.drawImage(rim, Wc / 2 - rw / 2, Hc / 2 - rh / 2 + 16, rw, rh);
    } else {
      drawFrog(g, Wc / 2, Hc / 2 + 16, 190, 210, { mood: 'laugh', t: t });
    }
    drawText(g, '✦', 90, 70, 40, '#fff');
    drawText(g, '✦', Wc - 90, 90, 34, '#fff');
    drawText(g, '✦', Wc - 120, Hc - 60, 28, '#fff');
  }
}

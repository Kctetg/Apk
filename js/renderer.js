'use strict';
/* ═══════════════ رندر تمیز و کلاسیک جنگل پیکسلی از بالا ═══════════════ */
var canvas = $('#game'), ctx = canvas.getContext('2d');
if (ctx) ctx.imageSmoothingEnabled = false;
var previewCanvas = $('#previewCanvas');
var pCtx = previewCanvas ? previewCanvas.getContext('2d') : null;

function isLowFx(){
  return !!(save && save.settings && save.settings.lowFx);
}

var TYPES = {
  apple:    { ico:'apple',    color:'#ff4757' },
  gold:     { ico:'gold',     color:'#ffd43b' },
  crystal:  { ico:'crystal',  color:'#c084fc' },
  fireball: { ico:'fireball', color:'#ff9800' },
  key:      { ico:'key',      color:'#ffd43b' }
};

function drawBoard(t){
  var wo = getWorldObj('forest');
  var bg1 = wo.bg, bg2 = wo.bg2;

  /* زمین آرام و یکدست جنگل بدون چشمک‌زدن */
  for (var y=0;y<ROWS;y++){
    for (var x=0;x<COLS;x++){
      ctx.fillStyle = ((x+y)&1) ? bg2 : bg1;
      ctx.fillRect(x*cell, y*cell, cell, cell);
      if (((x*5 + y*11) % 13) === 0){
        ctx.fillStyle = 'rgba(84,163,111,0.12)';
        ctx.fillRect(x*cell + Math.round(cell*0.35), y*cell + Math.round(cell*0.4), Math.max(2, Math.round(cell*0.18)), Math.max(2, Math.round(cell*0.18)));
      }
    }
  }

  /* دیوارهای سنگی یکدست جنگل */
  walls.forEach(function(wl){
    var wx = wl.x*cell, wy = wl.y*cell;
    ctx.fillStyle = wo.wall;
    ctx.fillRect(wx+1, wy+1, cell-2, cell-2);
    ctx.fillStyle = wo.wallHi;
    ctx.fillRect(wx+1, wy+1, cell-2, Math.max(2, Math.round(cell*0.22)));
    ctx.fillStyle = '#163022';
    ctx.fillRect(wx+1, wy+cell-Math.max(2, Math.round(cell*0.18)), cell-2, Math.max(2, Math.round(cell*0.18)));
  });

  /* دیوارهای مخفی با خزه ترک‌خورده */
  secretWalls.forEach(function(sw){
    var wx = sw.x*cell, wy = sw.y*cell;
    ctx.fillStyle = '#25523b';
    ctx.fillRect(wx+1, wy+1, cell-2, cell-2);
    ctx.fillStyle = '#4ea06b';
    ctx.fillRect(wx+1, wy+1, cell-2, Math.max(2, Math.round(cell*0.20)));
    ctx.fillStyle = '#86efac';
    ctx.fillRect(wx+Math.round(cell*0.25), wy+Math.round(cell*0.42), Math.max(2, Math.round(cell*0.5)), Math.max(2, Math.round(cell*0.14)));
  });

  /* سنگ فشاری معما برای باز کردن مسیر مخفی */
  switches.forEach(function(pz){
    var sp = PX_ICONS.switch_pad;
    if (sp){
      var sz = Math.round(cell * 0.86);
      ctx.save();
      ctx.globalAlpha = pz.active ? 0.45 : 0.95;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sp, Math.round((pz.x+0.5)*cell - sz/2), Math.round((pz.y+0.5)*cell - sz/2), sz, sz);
      ctx.restore();
    }
  });

  /* دروازه خروجی (قفل تا انجام هدف؛ سپس همیشه سبز!) */
  if (doorCell){
    var dx = doorCell.x*cell, dy = doorCell.y*cell;
    var spDoor = exitUnlocked ? PX_ICONS.door_open : PX_ICONS.door_locked;
    if (exitUnlocked){
      ctx.fillStyle = 'rgba(34,197,94,0.22)';
      ctx.fillRect(dx, dy, cell, cell);
    }
    if (spDoor){
      var dsz = Math.round(cell * 0.96);
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(spDoor, Math.round((doorCell.x+0.5)*cell - dsz/2), Math.round((doorCell.y+0.5)*cell - dsz/2), dsz, dsz);
      ctx.restore();
    }
  }
}

function drawItems(t){
  items.forEach(function(it){
    var def = TYPES[it.type] || TYPES.apple;
    var bob = Math.sin(t/240 + it.x) * (cell * 0.05);
    var cx = (it.x + 0.5) * cell;
    var cy = (it.y + 0.5) * cell + bob;
    var sp = PX_ICONS[def.ico];
    if (sp){
      var sz = Math.round(cell * 0.94);
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sp, Math.round(cx - sz/2), Math.round(cy - sz/2), sz, sz);
      ctx.restore();
    }
  });
}

function interpolateBodyPts(currBody, prevBody, interp){
  var pts = [];
  for (var s=0; s<currBody.length; s++){
    var cur = currBody[s];
    var prv = (prevBody && prevBody[s]) ? prevBody[s] : cur;
    var dx = cur.x - prv.x, dy = cur.y - prv.y;
    var isJump = Math.abs(dx) > 1 || Math.abs(dy) > 1;
    var rx = isJump ? cur.x : (prv.x + dx * interp);
    var ry = isJump ? cur.y : (prv.y + dy * interp);
    var pNext = (s < currBody.length - 1) ? currBody[s+1] : null;
    var wrapNext = pNext ? (Math.abs(cur.x - pNext.x) > 1 || Math.abs(cur.y - pNext.y) > 1) : false;
    pts.push({ x:(rx+0.5)*cell, y:(ry+0.5)*cell, wrapNext:wrapNext, pivot:null });
  }
  return pts;
}

function render(t){
  var dpr = Math.min(window.devicePixelRatio||1, 2);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  var w = COLS*cell, h = ROWS*cell;
  ctx.clearRect(0, 0, w, h);

  ctx.save();
  if (shakeMag > 0.01 && !isLowFx()){
    var sx = (Math.random()-0.5)*shakeMag*cell*0.35;
    var sy = (Math.random()-0.5)*shakeMag*cell*0.35;
    ctx.translate(sx, sy);
    shakeMag *= 0.82;
  } else {
    shakeMag = 0;
  }

  drawBoard(t);
  drawItems(t);

  var interp = (state === 'play' && tickAcc >= 0) ? Math.min(1, tickAcc / Math.max(40, currentStepMs())) : 1;

  /* مار نگهبان (در مراحل پیشرفته / ویژه) */
  rivals.forEach(function(rv){
    if (!rv.body || !rv.body.length) return;
    var rPts = interpolateBodyPts(rv.body, rv.prev, interp);
    drawSeamlessSnake(ctx, rPts, rv.dir, rv.skinObj, cell, t, {});
  });

  /* پرتابه بازیکن در مرحله باس */
  pShots.forEach(function(p){
    var px = (p.x+0.5)*cell, py = (p.y+0.5)*cell;
    var sp = PX_ICONS.fireball;
    if (sp){
      var s = Math.round(cell * 0.88);
      ctx.drawImage(sp, Math.round(px-s/2), Math.round(py-s/2), s, s);
    }
  });

  /* پرتابه‌های باس */
  bossShots.forEach(function(b){
    var bx = b.x*cell, by = b.y*cell;
    var sp = PX_ICONS.orb;
    if (sp){
      var s = Math.round(cell * 0.86);
      ctx.drawImage(sp, Math.round(bx-s/2), Math.round(by-s/2), s, s);
    }
  });

  /* مار اصلی بازیکن */
  if (snake.length){
    var pts = interpolateBodyPts(snake, prevSnake, interp);
    var sk = getSkinObj(save.skin);
    ctx.save();
    if (invulnT > 0 && Math.floor(t/90)%2===0) ctx.globalAlpha = 0.38;
    drawSeamlessSnake(ctx, pts, dir, sk, cell, t, {
      rainbow: (sk.body === 'rainbow'),
      accId: save.acc
    });
    ctx.restore();
  }

  /* باس ساده جنگل در مراحل ویژه */
  if (boss){
    var bx = boss.x * w, by = boss.y * h;
    var bs = cell * 2.1;
    var bStage = boss.fireShow > 0 ? 'fire' : 'idle';
    ctx.save();
    if (boss.hitFlash > 0 && Math.floor(t/60)%2===0) ctx.globalAlpha = 0.55;
    drawPixelDragonOn(ctx, t, bx, by, bs, boss.key, bStage, boss.faceL);
    ctx.restore();

    var bw = Math.min(w*0.52, 160), bh = 7;
    var barX = bx - bw/2, barY = Math.max(8, by - bs*0.92);
    ctx.fillStyle = '#090d16';
    ctx.fillRect(barX-2, barY-2, bw+4, bh+4);
    ctx.fillStyle = '#46f88f';
    ctx.fillRect(barX, barY, Math.max(0, bw * (boss.hp / boss.maxHp)), bh);
    ctx.strokeStyle = '#ffd43b'; ctx.lineWidth = 1.5;
    ctx.strokeRect(barX-1, barY-1, bw+2, bh+2);
  }

  /* ذرات مختصر هنگام خوردن سیب یا باز شدن مسیر مخفی */
  if (!isLowFx()){
    for (var pi=particles.length-1;pi>=0;pi--){
      var pt = particles[pi];
      pt.x += pt.vx; pt.y += pt.vy; pt.life -= pt.decay || 0.04;
      if (pt.life <= 0){ particles.splice(pi,1); continue; }
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.fillStyle = pt.color;
      var sz = Math.max(2, Math.round(pt.size));
      ctx.fillRect(Math.round(pt.x-sz/2), Math.round(pt.y-sz/2), sz, sz);
      ctx.globalAlpha = 1;
    }
  } else {
    particles.length = 0;
  }

  for (var fi=floatTexts.length-1;fi>=0;fi--){
    var ft = floatTexts[fi];
    ft.y += ft.vy; ft.life -= 0.028;
    if (ft.life <= 0){ floatTexts.splice(fi,1); continue; }
    ctx.globalAlpha = Math.max(0, ft.life);
    ctx.fillStyle = ft.color || '#ffd43b';
    ctx.font = 'bold ' + Math.max(10, Math.round(cell*0.55)) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

/* پیش‌نمایش آرام مار در منوی خانه */
function renderMenuPreview(t){
  if (pCtx && previewCanvas && $('#menuScreen') && $('#menuScreen').classList.contains('active')){
    pCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    pCtx.imageSmoothingEnabled = false;
    var sk = getSkinObj(save.skin);
    var wo = getWorldObj('forest');
    pCtx.fillStyle = wo.bg;
    pCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
    pCtx.fillStyle = wo.bg2;
    for (var gx=0; gx<previewCanvas.width; gx+=14){
      for (var gy=0; gy<previewCanvas.height; gy+=14){
        if (((gx+gy)/14) % 2 === 0) pCtx.fillRect(gx, gy, 14, 14);
      }
    }
    var bob = Math.sin(t/300) * 2.5;
    var pts = [
      {x:108, y:48+bob}, {x:92, y:48+bob*0.7}, {x:76, y:48+bob*0.3},
      {x:60, y:48-bob*0.3}, {x:44, y:48-bob*0.7}, {x:28, y:48-bob}
    ];
    drawSeamlessSnake(pCtx, pts, 'right', sk, 20, t, { rainbow:(sk.body==='rainbow'), accId:save.acc });
  }
  requestAnimationFrame(renderMenuPreview);
}
requestAnimationFrame(renderMenuPreview);

'use strict';
/* ═══════════════ رندر پیکسلی میدان، پورتال‌ها، همزاد سایه و بازگشت زمان ═══════════════ */
var canvas = $('#game'), ctx = canvas.getContext('2d');
if (ctx) ctx.imageSmoothingEnabled = false;
var previewCanvas = $('#previewCanvas');
var pCtx = previewCanvas ? previewCanvas.getContext('2d') : null;

function isLowFx(){
  return !!(save && save.settings && save.settings.lowFx);
}

var TYPES = {
  apple:     { ico:'apple',      color:'#ff4757' },
  gold:      { ico:'gold',       color:'#ffd43b' },
  crystal:   { ico:'crystal',    color:'#c084fc' },
  bomb:      { ico:'bomb',       color:'#94a3b8' },
  ghost:     { ico:'ghost',      color:'#93c5fd' },
  slow:      { ico:'slow',       color:'#38bdf8' },
  double:    { ico:'double',     color:'#ffd43b' },
  orb:       { ico:'orb',        color:'#38bdf8' },
  acid:      { ico:'acid',       color:'#d946ef' },
  portal:    { ico:'portal',     color:'#ffffff' },
  fireball:  { ico:'fireball',   color:'#ff9800' },
  superfire: { ico:'superfire',  color:'#ffd43b' },
  heart:     { ico:'heart_full', color:'#ff4757' },
  shield:    { ico:'shield',     color:'#60a5fa' },
  key:       { ico:'key',        color:'#ffd43b' },
  mimic:     { ico:'mimic',      color:'#ef4444' },
  coin_drop:   { ico:'coin',       color:'#ffd43b' },
  timer:       { ico:'timer',      color:'#46f88f' },
  relic_orb:   { ico:'relic_eye',  color:'#a855f7' },
  map_piece:   { ico:'map_piece',  color:'#fde68a' },
  shop_heart:  { ico:'heart_full', color:'#ff4757' },
  shop_shield: { ico:'shield',     color:'#38bdf8' },
  shop_relic:  { ico:'merchant',   color:'#a855f7' }
};

function drawBoard(t){
  var w = COLS * cell, h = ROWS * cell;
  var wo = getWorldObj(world);
  var bg1 = wo.bg, bg2 = wo.bg2;
  if (world === 'lava' && level >= 2) bg2 = '#38120c';

  for (var y=0;y<ROWS;y++){
    for (var x=0;x<COLS;x++){
      ctx.fillStyle = ((x+y)&1) ? bg2 : bg1;
      ctx.fillRect(x*cell, y*cell, cell, cell);
      /* بافت ظریف پیکسلی جهان در هر ۴ کاشی */
      if (((x*7 + y*13) % 9) === 0){
        ctx.fillStyle = wo.accent;
        ctx.globalAlpha = 0.06;
        ctx.fillRect(x*cell + cell*0.35, y*cell + cell*0.35, Math.max(2, cell*0.2), Math.max(2, cell*0.2));
        ctx.globalAlpha = 1;
      }
    }
  }

  /* محدوده جمع‌شونده در سیاهچال یا موج‌های بالا */
  if (shrinkBorder > 0){
    ctx.fillStyle = 'rgba(255,46,76,0.18)';
    for (var sy=0;sy<ROWS;sy++){
      for (var sx=0;sx<COLS;sx++){
        if (sx<shrinkBorder || sx>=COLS-shrinkBorder || sy<shrinkBorder || sy>=ROWS-shrinkBorder){
          ctx.fillRect(sx*cell, sy*cell, cell, cell);
        }
      }
    }
  }

  /* کاشی‌های یخی، مذاب، شن روان و سست */
  iceTiles.forEach(function(ic){
    ctx.fillStyle = 'rgba(56,189,248,0.24)';
    ctx.fillRect(ic.x*cell+1, ic.y*cell+1, cell-2, cell-2);
    ctx.fillStyle = 'rgba(224,242,254,0.48)';
    ctx.fillRect(ic.x*cell+3, ic.y*cell+3, Math.max(2, cell*0.3), 2);
  });

  hotTiles.forEach(function(ht){
    var pulse = 0.25 + 0.14 * Math.sin(t/180 + ht.x);
    ctx.fillStyle = 'rgba(249,115,22,'+pulse+')';
    ctx.fillRect(ht.x*cell+1, ht.y*cell+1, cell-2, cell-2);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(ht.x*cell + cell*0.28, ht.y*cell + cell*0.45, cell*0.45, 2);
  });

  sandTiles.forEach(function(st){
    ctx.fillStyle = 'rgba(217,119,6,0.28)';
    ctx.fillRect(st.x*cell+1, st.y*cell+1, cell-2, cell-2);
    ctx.fillStyle = 'rgba(253,224,71,0.45)';
    ctx.fillRect(st.x*cell+3, st.y*cell+Math.round(cell*0.6), cell-6, 2);
  });

  crumbleTiles.forEach(function(cr){
    if (cr.step >= 2) return;
    ctx.fillStyle = cr.step === 1 ? 'rgba(251,146,60,0.45)' : 'rgba(148,163,184,0.34)';
    ctx.fillRect(cr.x*cell+2, cr.y*cell+2, cell-4, cell-4);
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.5;
    ctx.strokeRect(cr.x*cell+2.5, cr.y*cell+2.5, cell-5, cell-5);
  });

  /* پورتال‌های دوقلوی انتقال */
  portals.forEach(function(pt){
    var icoName = pt.color === 'b' ? 'portal_b' : 'portal';
    var sp = PX_ICONS[icoName];
    var pulse = 0.88 + 0.12 * Math.sin(t / 140);
    var sz = Math.round(cell * 0.96 * pulse);
    var px = Math.round((pt.x + 0.5) * cell - sz / 2);
    var py = Math.round((pt.y + 0.5) * cell - sz / 2);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (sp) ctx.drawImage(sp, px, py, sz, sz);
    ctx.restore();
  });

  /* دیوارهای صلب */
  walls.forEach(function(wl){
    var wx = wl.x*cell, wy = wl.y*cell;
    ctx.fillStyle = wo.wall;
    ctx.fillRect(wx+1, wy+1, cell-2, cell-2);
    ctx.fillStyle = wo.wallHi;
    ctx.fillRect(wx+2, wy+2, cell-4, Math.max(2, Math.round(cell*0.16)));
    ctx.strokeStyle = '#09120e'; ctx.lineWidth = 2;
    ctx.strokeRect(wx+1, wy+1, cell-2, cell-2);
  });

  /* دیوارهای مخفی (ظاهری شبیه دیوار ولی با درخشش ریز قابل کشف) */
  secretWalls.forEach(function(sw){
    var wx = sw.x*cell, wy = sw.y*cell;
    ctx.fillStyle = wo.wall;
    ctx.fillRect(wx+1, wy+1, cell-2, cell-2);
    ctx.fillStyle = 'rgba(168,85,247,'+(0.25 + 0.25*Math.sin(t/180))+')';
    ctx.fillRect(wx+Math.round(cell*0.3), wy+Math.round(cell*0.3), Math.max(2, Math.round(cell*0.4)), 2);
    ctx.strokeStyle = '#09120e'; ctx.lineWidth = 2;
    ctx.strokeRect(wx+1, wy+1, cell-2, cell-2);
  });

  /* کلیدهای زمینی معمای محیطی */
  switches.forEach(function(pz){
    var px = pz.x*cell, py = pz.y*cell;
    if (PX_ICONS.switch_pad) ctx.drawImage(PX_ICONS.switch_pad, px+1, py+1, cell-2, cell-2);
    ctx.fillStyle = pz.active ? '#46f88f' : '#ffd43b';
    ctx.fillRect(px+Math.round(cell*0.36), py+Math.round(cell*0.36), Math.max(3, Math.round(cell*0.28)), Math.max(3, Math.round(cell*0.28)));
  });

  /* دیوارهای تخریب‌پذیر با نمایش ترک */
  dWalls.forEach(function(dw){
    var dx = dw.x*cell, dy = dw.y*cell;
    var spB = PX_ICONS.brick;
    if (spB){
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(spB, dx+1, dy+1, cell-2, cell-2);
      if (dw.hp < dw.maxHp){
        ctx.fillStyle = 'rgba(255,212,59,0.55)';
        ctx.fillRect(dx+Math.round(cell*0.42), dy+3, 2, cell-6);
      }
      ctx.restore();
    }
  });

  /* دروازه خروجی مرحله‌ای / معمایی */
  if (doorCell){
    var open = items.filter(function(it){ return it.type === 'key'; }).length === 0;
    var dx2 = doorCell.x*cell, dy2 = doorCell.y*cell;
    ctx.fillStyle = open ? 'rgba(70,248,143,0.34)' : 'rgba(255,71,87,0.28)';
    ctx.fillRect(dx2+1, dy2+1, cell-2, cell-2);
    var dIco = open ? PX_ICONS.portal : PX_ICONS.brick;
    if (dIco) ctx.drawImage(dIco, dx2+2, dy2+2, cell-4, cell-4);
  }

  /* ورودی یا خروجی اتاق مخفی */
  if (!inSecretRoom && secretEntrance){
    var sxE = secretEntrance.x * cell, syE = secretEntrance.y * cell;
    ctx.fillStyle = 'rgba(168,85,247,' + (0.25 + 0.16 * Math.sin(t/140)) + ')';
    ctx.fillRect(sxE+1, syE+1, cell-2, cell-2);
    if (PX_ICONS.secret_door) ctx.drawImage(PX_ICONS.secret_door, sxE+1, syE+1, cell-2, cell-2);
  }
  if (inSecretRoom && secretExit){
    var exS = secretExit.x * cell, eyS = secretExit.y * cell;
    ctx.fillStyle = 'rgba(70,248,143,' + (0.28 + 0.18 * Math.sin(t/130)) + ')';
    ctx.fillRect(exS+1, eyS+1, cell-2, cell-2);
    if (PX_ICONS.portal) ctx.drawImage(PX_ICONS.portal, exS+1, eyS+1, cell-2, cell-2);
  }

  /* نشانگر چشم شبح روی هدف بعدی */
  if (phantomTarget){
    var pxT = (phantomTarget.x + 0.5) * cell, pyT = (phantomTarget.y + 0.5) * cell;
    ctx.save();
    ctx.strokeStyle = 'rgba(168,85,247,' + (0.5 + 0.4 * Math.sin(t/120)) + ')';
    ctx.lineWidth = 2;
    ctx.strokeRect(Math.round(pxT - cell*0.42), Math.round(pyT - cell*0.42), Math.round(cell*0.84), Math.round(cell*0.84));
    ctx.restore();
  }

  /* پیش‌نمایش مسیر بازگشت زمان (نقاط آبی محو پشت مار) */
  if (rewindsLeft > 0 && historyBuf.length > 2 && !isLowFx()){
    var previewIdx = Math.max(0, historyBuf.length - 12);
    var snap = historyBuf[previewIdx];
    if (snap && snap.snake && snap.snake.length){
      var rx = (snap.snake[0].x + 0.5) * cell;
      var ry = (snap.snake[0].y + 0.5) * cell;
      ctx.save();
      ctx.strokeStyle = 'rgba(56,189,248,'+(0.35 + 0.2*Math.sin(t/150))+')';
      ctx.lineWidth = 2;
      ctx.strokeRect(Math.round(rx - cell*0.32), Math.round(ry - cell*0.32), Math.round(cell*0.64), Math.round(cell*0.64));
      ctx.restore();
    }
  }

  /* ردپای ژن و نوار انرژی */
  trailCells.forEach(function(tr){
    var alpha = Math.max(0.22, tr.ms / 5000);
    ctx.fillStyle = tr.kind === 'fire'   ? 'rgba(255,107,43,'+alpha+')' :
                    tr.kind === 'frost'  ? 'rgba(56,189,248,'+alpha+')' :
                    tr.kind === 'toxic'  ? 'rgba(163,230,53,'+alpha+')' :
                    tr.kind === 'energy' ? 'rgba(34,211,238,'+alpha+')' :
                                           'rgba(253,224,71,'+alpha+')';
    ctx.fillRect(tr.x*cell+3, tr.y*cell+3, cell-6, cell-6);
  });

  if (boss && boss.hazardTiles && boss.hazardTiles.length){
    boss.hazardTiles.forEach(function(hz){
      ctx.fillStyle = 'rgba(239,68,68,'+(0.25 + 0.15*Math.sin(t/120))+')';
      ctx.fillRect(hz.x*cell+1, hz.y*cell+1, cell-2, cell-2);
    });
  }

  /* خطوط حاشیه زمین با نمایش حالت جنون (×۵) و طلایی (×۱۰) */
  var borderCol = inSecretRoom ? '#a855f7' : (combo >= 10 ? '#ffd43b' : (combo >= 5 ? '#46f88f' : (dashTimer > 0 ? '#38bdf8' : (fx.double > 0 ? '#ffd43b' : wo.accent))));
  ctx.strokeStyle = borderCol;
  ctx.globalAlpha = (combo >= 5 || dashTimer > 0 || inSecretRoom) ? (0.55 + 0.25*Math.sin(t/110)) : 0.22;
  ctx.lineWidth = (combo >= 10 || inSecretRoom) ? 3 : 2;
  ctx.strokeRect(1, 1, w-2, h-2);
  ctx.globalAlpha = 1;
}

function drawItems(t){
  var fogOn = isFogActive();
  var fastFx = isLowFx() || perfLowMode || particles.length > 26;
  items.forEach(function(it){
    if (fogOn && !fogRevealAll && !isCellExplored(it.x, it.y)) return;
    var def = TYPES[it.type] || TYPES.apple;
    var bob = Math.sin(t/190 + it.x) * (cell * 0.08);
    var cx = (it.x + 0.5) * cell;
    var cy = (it.y + 0.5) * cell + bob;
    if (!fastFx){
      var g = ctx.createRadialGradient(cx, cy, cell*0.06, cx, cy, cell*0.58);
      g.addColorStop(0, def.color + '44'); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, cell*0.58, 0, Math.PI*2); ctx.fill();
    }
    var sp = PX_ICONS[def.ico];
    if (sp){
      var sz = Math.round(cell * 0.96);
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

function drawWorldEffects(t){
  /* مه جنگ هزارتو (Fog of War) */
  if (isFogActive() && !fogRevealAll && snake.length){
    var hxG = snake[0].x, hyG = snake[0].y;
    var visR = hasRelic('phantom_eye') ? 5.2 : 3.6;
    for (var fy=0; fy<ROWS; fy++){
      for (var fx2=0; fx2<COLS; fx2++){
        var d = Math.abs(fx2 - hxG) + Math.abs(fy - hyG);
        if (d <= visR) continue;
        ctx.fillStyle = isCellExplored(fx2, fy) ? 'rgba(8,6,18,0.48)' : 'rgba(6,8,16,0.90)';
        ctx.fillRect(fx2*cell, fy*cell, cell, cell);
      }
    }
  } else if (fogActiveMs > 0 && snake.length){
    var hx = (snake[0].x + 0.5) * cell;
    var hy = (snake[0].y + 0.5) * cell;
    var rad = ctx.createRadialGradient(hx, hy, cell * 1.4, hx, hy, cell * 4.0);
    rad.addColorStop(0, 'rgba(10,5,24,0)');
    rad.addColorStop(0.65, 'rgba(10,5,24,0.45)');
    rad.addColorStop(1, 'rgba(8,4,18,0.88)');
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, COLS * cell, ROWS * cell);
  }
  /* طوفان شن در بیابان */
  if (world === 'desert' && sandstormMs > 0 && !isLowFx() && !perfLowMode){
    ctx.fillStyle = 'rgba(245,158,11,0.16)';
    ctx.fillRect(0, 0, COLS*cell, ROWS*cell);
    ctx.fillStyle = 'rgba(254,243,199,0.45)';
    for (var i=0;i<14;i++){
      var sx = ((t*0.35 + i*47) % (COLS*cell));
      var sy = ((i*31 + Math.sin(t/200+i)*8) % (ROWS*cell));
      ctx.fillRect(sx, sy, 8, 2);
    }
  }
}

function render(t){
  var dpr = Math.min(window.devicePixelRatio||1, 2);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  var w = COLS*cell, h = ROWS*cell;
  ctx.clearRect(0, 0, w, h);

  ctx.save();
  if (shakeMag > 0.01 && !isLowFx()){
    var sx = (Math.random()-0.5)*shakeMag*cell*0.45;
    var sy = (Math.random()-0.5)*shakeMag*cell*0.45;
    ctx.translate(sx, sy);
    shakeMag *= 0.85;
  } else {
    shakeMag = 0;
  }

  drawBoard(t);
  drawItems(t);

  var interp = (state === 'play' && tickAcc >= 0) ? Math.min(1, tickAcc / Math.max(40, currentStepMs())) : 1;

  /* شبح رقیب (مسابقه زنده با بهترین رکورد) */
  if (!inSecretRoom && !isReplay && rivalGhostSnake && rivalGhostSnake.length > 1){
    ctx.save();
    ctx.globalAlpha = 0.34;
    var rgPts = rivalGhostSnake.map(function(p, idx){
      var nxt = rivalGhostSnake[idx+1];
      var wn = nxt ? (Math.abs(p.x-nxt.x)>1 || Math.abs(p.y-nxt.y)>1) : false;
      return { x:(p.x+0.5)*cell, y:(p.y+0.5)*cell, wrapNext:wn };
    });
    drawSeamlessSnake(ctx, rgPts, 'right', { id:'rival_ghost', head:'#7dd3fc', body:'#0ea5e9', spot:'#0369a1', belly:'#e0f2fe', dark:'#0c4a6e' }, cell, t, {});
    ctx.restore();
  }

  /* سایه شبح بازیکن (سایه جهان تاریکی) */
  if (shadowSnake && shadowSnake.length > 1){
    ctx.save();
    ctx.globalAlpha = 0.52;
    var sPts = shadowSnake.map(function(p, idx){
      var nxt = shadowSnake[idx+1];
      var wn = nxt ? (Math.abs(p.x-nxt.x)>1 || Math.abs(p.y-nxt.y)>1) : false;
      return { x:(p.x+0.5)*cell, y:(p.y+0.5)*cell, wrapNext:wn };
    });
    drawSeamlessSnake(ctx, sPts, 'right', { id:'shadow_echo', head:'#c084fc', body:'#581c87', spot:'#3b0764', belly:'#ddd6fe', dark:'#2e1065' }, cell, t, {});
    ctx.restore();
  }

  /* مارهای دشمن هوشمند */
  rivals.forEach(function(rv){
    if (!rv.body || !rv.body.length) return;
    var rPts = interpolateBodyPts(rv.body, rv.prev, interp);
    ctx.save();
    if (rv.frozenMs > 0) ctx.globalAlpha = 0.72;
    drawSeamlessSnake(ctx, rPts, rv.dir, rv.skinObj, cell, t, {});
    ctx.restore();
  });

  /* پرتابه‌های بازیکن */
  pShots.forEach(function(p){
    var px = (p.x+0.5)*cell, py = (p.y+0.5)*cell;
    var sp = PX_ICONS[p.super ? 'superfire' : 'fireball'];
    if (sp){
      var s = Math.round(cell * (p.super ? 1.1 : 0.85));
      ctx.drawImage(sp, Math.round(px-s/2), Math.round(py-s/2), s, s);
    }
  });

  /* پرتابه‌های باس */
  bossShots.forEach(function(b){
    var bx = b.x*cell, by = b.y*cell;
    var icoName = b.isRock ? 'brick' : (b.isIce ? 'orb' : (b.isLightning ? 'lightning' : 'fireball'));
    var sp = PX_ICONS[icoName];
    if (sp){
      var s = Math.round(cell * 0.92);
      ctx.drawImage(sp, Math.round(bx-s/2), Math.round(by-s/2), s, s);
    }
  });

  /* مار اصلی بازیکن */
  if (snake.length){
    var pts = interpolateBodyPts(snake, prevSnake, interp);
    var sk = getSkinObj(save.skin);
    ctx.save();
    if (fx.ghost > 0) ctx.globalAlpha = 0.65;
    if (invulnT > 0 && Math.floor(t/90)%2===0) ctx.globalAlpha = 0.35;
    if (dashTimer > 0 && !isLowFx()){
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
    }
    var overrideBody = null, overrideBelly = null;
    if (fx.shield > 0){ overrideBody = '#60a5fa'; overrideBelly = '#dbeafe'; }
    drawSeamlessSnake(ctx, pts, dir, sk, cell, t, {
      rainbow: (sk.body === 'rainbow'),
      overrideBody: overrideBody,
      overrideBelly: overrideBelly,
      accId: save.acc,
      evoForm: getEffectiveEvoForm(),
      goldenCombo: (combo >= 10)
    });
    ctx.restore();
  }

  /* باس ۳ فازه (اژدها یا غول سنگی) */
  if (boss){
    var bx = boss.x * w, by = boss.y * h;
    var bs = cell * (DRAGON_STYLE[boss.key] ? DRAGON_STYLE[boss.key].size : 2.1);
    var stage = boss.fireShow > 0 ? 'fire' : 'idle';
    ctx.save();
    if (boss.hitFlash > 0 && Math.floor(t/55)%2===0) ctx.globalAlpha = 0.55;
    drawPixelDragonOn(ctx, t, bx, by, bs, boss.key, stage, boss.faceL);
    ctx.restore();

    /* نوار جان و فاز باس */
    var bw = Math.min(w*0.56, 175), bh = 8;
    var barX = bx - bw/2, barY = Math.max(8, by - bs*0.92);
    ctx.fillStyle = '#090d16';
    ctx.fillRect(barX-2, barY-2, bw+4, bh+4);
    ctx.fillStyle = boss.phase === 3 ? '#ef4444' : (boss.phase === 2 ? '#f97316' : '#46f88f');
    ctx.fillRect(barX, barY, Math.max(0, bw * (boss.hp / boss.maxHp)), bh);
    ctx.strokeStyle = '#ffd43b'; ctx.lineWidth = 1.5;
    ctx.strokeRect(barX-1, barY-1, bw+2, bh+2);
  }

  drawWorldEffects(t);

  /* موج شوک و ذرات */
  if (!isLowFx()){
    for (var si=shockwaves.length-1;si>=0;si--){
      var sw = shockwaves[si];
      sw.life -= 0.04; sw.r += (sw.maxR - sw.r)*0.16;
      if (sw.life <= 0){ shockwaves.splice(si,1); continue; }
      ctx.strokeStyle = sw.color; ctx.globalAlpha = Math.max(0, sw.life);
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI*2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    for (var pi=particles.length-1;pi>=0;pi--){
      var pt = particles[pi];
      pt.x += pt.vx; pt.y += pt.vy; pt.life -= pt.decay || 0.032;
      if (pt.life <= 0){ particles.splice(pi,1); continue; }
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.fillStyle = pt.color;
      var sz = Math.max(2, Math.round(pt.size));
      ctx.fillRect(Math.round(pt.x-sz/2), Math.round(pt.y-sz/2), sz, sz);
      ctx.globalAlpha = 1;
    }
  } else {
    shockwaves.length = 0; particles.length = 0;
  }

  for (var fi=floatTexts.length-1;fi>=0;fi--){
    var ft = floatTexts[fi];
    ft.y += ft.vy; ft.life -= 0.024;
    if (ft.life <= 0){ floatTexts.splice(fi,1); continue; }
    ctx.globalAlpha = Math.max(0, ft.life);
    ctx.fillStyle = ft.color || '#ffd43b';
    ctx.font = 'bold ' + Math.max(10, Math.round(cell*0.56)) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

/* پیش‌نمایش زنده مار در تب خانه */
function renderMenuPreview(t){
  if (pCtx && previewCanvas && $('#menuScreen') && $('#menuScreen').classList.contains('active')){
    pCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    pCtx.imageSmoothingEnabled = false;
    var sk = getSkinObj(save.skin);
    var wo = getWorldObj(save.world);
    pCtx.fillStyle = wo.bg;
    pCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
    pCtx.fillStyle = wo.bg2;
    for (var gx=0; gx<previewCanvas.width; gx+=14){
      for (var gy=0; gy<previewCanvas.height; gy+=14){
        if (((gx+gy)/14) % 2 === 0) pCtx.fillRect(gx, gy, 14, 14);
      }
    }
    var bob = Math.sin(t/280) * 3;
    var pts = [
      {x:108, y:48+bob}, {x:92, y:48+bob*0.7}, {x:76, y:48+bob*0.3},
      {x:60, y:48-bob*0.3}, {x:44, y:48-bob*0.7}, {x:28, y:48-bob}
    ];
    drawSeamlessSnake(pCtx, pts, 'right', sk, 20, t, { rainbow:(sk.body==='rainbow'), accId:save.acc, evoForm:getEffectiveEvoForm() });
  }
  requestAnimationFrame(renderMenuPreview);
}
requestAnimationFrame(renderMenuPreview);

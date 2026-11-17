'use strict';
/* ═══════════════ اژدهاهای پیکسلی (۴ لایه) + غول سنگی دژ ═══════════════ */
var DRAGON_STYLE = {
  1: { hue:222, size:1.7,  name:'اژدهای آبی' },
  2: { hue:14,  size:2.0,  name:'اژدهای آتشین' },
  3: { hue:278, size:2.25, name:'اژدهای برقی' },
  4: { hue:140, size:2.45, name:'غول سنگی' }
};

var PAL_ORIGINAL = ['#000000','#101024','#2b5ce6','#1c3fae','#142e85','#4a80ff','#7ea6ff',
  '#ffd83e','#dfa21c','#fff3b0','#ffffff','#7a0e0e','#e63214','#ff7d1a','#ffc31f','#fff6c8'];
var PAL_GOLEM = ['#000000','#14181f','#64748b','#475569','#334155','#94a3b8','#cbd5e1',
  '#22d3ee','#0891b2','#cffafe','#ffffff','#9f1239','#e11d48','#f97316','#fde047','#fefce8'];

function hslHex(h,s,l){
  s/=100; l/=100;
  var k=function(n){ return (n+h/30)%12; };
  var a=s*Math.min(l,1-l);
  var f=function(n){ return l - a*Math.max(-1, Math.min(k(n)-3, Math.min(9-k(n),1))); };
  var to=function(v){ var c=Math.round(v*255).toString(16); return c.length<2?'0'+c:c; };
  return '#'+to(f(0))+to(f(8))+to(f(4));
}

function dragonPalette(hue){
  if (hue === 222) return PAL_ORIGINAL;
  var p = PAL_ORIGINAL.slice();
  p[2]=hslHex(hue,78,52); p[3]=hslHex(hue,74,38); p[4]=hslHex(hue,74,28);
  p[5]=hslHex(hue,98,64); p[6]=hslHex(hue,98,74);
  return p;
}

function buildDragonSet(pal){
  var fw=newBuf();
  bpoly(fw,[[60,44],[66,30],[74,19],[84,11],[92,7],[95,10],[91,14],[96,18],[89,22],[93,27],[85,29],[88,34],[79,35],[81,40],[72,42],[66,46]],3);
  bline(fw,63,43,92,7,4); bline(fw,63,43,96,18,4); bline(fw,63,43,93,27,4); bline(fw,63,43,88,34,4);
  bpx(fw,76,24,8); bpx(fw,82,18,8); bpx(fw,78,30,8); bpx(fw,86,26,8); bpx(fw,72,34,8); bpx(fw,84,33,8);
  outlineBuf(fw);

  var bd=newBuf();
  bell(bd,28,63,4.5,4,2); bell(bd,21,66,4,3.6,2); bell(bd,15,63,3.5,3.2,2); bell(bd,12,57,3,2.8,2);
  bell(bd,13,51,2.7,2.5,2); bell(bd,17,47,2.4,2.2,2); bell(bd,21,45,2,1.9,2);
  bpx(bd,27,60,5); bpx(bd,20,63,5); bpx(bd,13,61,5); bpx(bd,11,55,5); bpx(bd,13,49,5); bpx(bd,17,45,5);
  bpoly(bd,[[24,67],[20,72],[27,69]],7); bpoly(bd,[[15,66],[10,70],[17,68]],7);
  bpoly(bd,[[9,60],[5,64],[11,63]],7); bpoly(bd,[[10,52],[7,48],[13,54]],7);
  bpoly(bd,[[15,45],[13,39],[20,44]],7);
  bell(bd,30,66,5,5,3); bline(bd,29,70,27,76,3,5);
  bpoly(bd,[[22,76],[31,76],[32,79],[22,79]],4); brect(bd,22,78,10,1,8);
  bell(bd,60,66,5,5,3); bline(bd,62,70,64,75,3,5);
  bpoly(bd,[[62,76],[70,76],[71,79],[62,79]],4); brect(bd,62,78,9,1,8);
  bpoly(bd,[[40,48],[37,42],[43,49]],7); bpoly(bd,[[47,46],[44,40],[50,47]],7);
  bell(bd,44,57,14,11,2); bell(bd,46,64,12,5,3); bell(bd,38,50,7,4,5); bell(bd,50,60,6,8.5,7);
  bline(bd,46,54,54,54,8); bline(bd,45,57,55,57,8); bline(bd,45,60,55,60,8);
  bline(bd,45,63,55,63,8); bline(bd,46,66,54,66,8); bline(bd,48,68,52,68,8);
  bell(bd,36,63,7,6,2); bell(bd,33,60,3,2,5); bline(bd,35,68,33,75,2,6);
  bpoly(bd,[[27,76],[38,76],[40,78],[39,80],[27,80]],2);
  bline(bd,31,77,31,79,3); bline(bd,35,77,35,79,3); brect(bd,27,79,12,1,9);
  bpoly(bd,[[39,76],[42,77],[39,78]],9);
  bpoly(bd,[[50,50],[60,30],[68,32],[62,52]],2); bline(bd,54,48,61,34,3);
  bpoly(bd,[[58,36],[53,31],[60,38]],7); bpoly(bd,[[54,44],[49,40],[56,46]],7);
  bpoly(bd,[[66,26],[61,11],[62,10],[63,14],[70,25]],7); bline(bd,64,20,63,15,8); bline(bd,67,23,65,18,8);
  bpoly(bd,[[70,25],[67,10],[68,9],[69,13],[75,24]],7); bline(bd,70,20,68,15,8); bline(bd,72,22,70,17,8);
  bell(bd,72,28,7,6,2); bell(bd,72,32,5,2.5,3); bell(bd,73,25,3.5,1.8,5);
  bpoly(bd,[[74,23],[86,26],[88,31],[86,35],[74,34]],2); bline(bd,75,24,86,27,5); bpx(bd,85,30,3);
  brect(bd,67,26,5,4,7); bline(bd,69,26,69,29,1); bpx(bd,70,27,10); bline(bd,65,25,74,26,4,2);
  bpoly(bd,[[66,31],[59,36],[67,35]],7); bell(bd,71,37,3,2,3);
  bpoly(bd,[[75,33],[88,31],[88,36],[85,42],[74,41]],11);
  bpoly(bd,[[77,37],[83,37],[80,41]],14);
  bpoly(bd,[[77,33],[79,33],[78,38]],10); bpoly(bd,[[81,32],[83,33],[82,37]],10); bpoly(bd,[[85,32],[87,33],[86,36]],10);
  bpoly(bd,[[74,41],[85,42],[83,47],[72,44]],2); bline(bd,74,43,82,44,3);
  bpoly(bd,[[76,41],[78,41],[77,39]],10); bpoly(bd,[[82,42],[84,42],[83,40]],10);
  bell(bd,52,64,6,5.5,2); bline(bd,54,68,56,75,2,5);
  bpoly(bd,[[50,76],[60,76],[62,78],[61,80],[50,80]],2);
  bline(bd,54,77,54,79,3); bline(bd,58,77,58,79,3); brect(bd,50,79,11,1,9);
  bpoly(bd,[[61,76],[64,77],[61,78]],9);
  outlineBuf(bd);

  var nw=newBuf();
  bpoly(nw,[[46,50],[40,34],[31,20],[19,10],[10,5],[5,9],[8,15],[3,21],[10,26],[6,33],[14,37],[10,44],[20,47],[16,54],[28,55],[25,62],[40,58],[44,54]],2);
  bline(nw,43,52,10,5,5); bline(nw,43,52,3,21,5); bline(nw,43,52,6,33,5); bline(nw,43,52,10,44,5); bline(nw,43,52,16,54,5);
  bpx(nw,28,24,7); bpx(nw,34,30,7); bpx(nw,22,30,7); bpx(nw,30,38,7); bpx(nw,18,24,7); bpx(nw,26,46,7); bpx(nw,36,42,7); bpx(nw,20,40,7); bpx(nw,32,50,7); bpx(nw,24,20,7);
  bell(nw,42,50,3,2.5,5);
  outlineBuf(nw);

  var fr=newBuf();
  bpoly(fr,[[86,30],[92,24],[97,29],[103,21],[108,28],[114,22],[118,29],[125,24],[127,31],[133,29],[134,35],[128,37],[134,42],[127,43],[130,50],[123,46],[124,53],[117,48],[118,55],[111,49],[112,44],[105,45],[107,39],[99,41],[100,35],[93,38],[90,34],[86,36]],12);
  bpoly(fr,[[87,31],[92,26],[97,30],[103,24],[108,30],[114,25],[118,31],[124,27],[126,33],[131,32],[131,36],[126,38],[130,43],[124,42],[126,47],[120,44],[121,49],[115,45],[116,42],[108,43],[110,38],[102,39],[103,34],[95,36],[92,33],[88,34]],13);
  bpoly(fr,[[88,32],[93,29],[98,32],[104,28],[109,32],[114,29],[118,33],[123,31],[124,35],[128,35],[127,38],[122,39],[124,43],[118,41],[119,44],[112,41],[110,38],[103,38],[104,34],[96,35],[93,33],[89,33]],14);
  bell(fr,90,33,4,2.5,15); bpx(fr,94,33,15); bpx(fr,133,18,12); bpx(fr,129,54,13); bpx(fr,135,40,14);
  outlineBuf(fr);

  return { body:bakeBuf(bd,pal), wingFar:bakeBuf(fw,pal), wingNear:bakeBuf(nw,pal), fire:bakeBuf(fr,pal) };
}

/* ساخت اسپرایت غول سنگی پیکسلی با هسته نئونی و مشت‌های سنگی شناور */
function buildGolemSet(){
  var pal = PAL_GOLEM;
  var bd = newBuf();
  /* پاها */
  brect(bd, 33, 66, 12, 14, 3); brect(bd, 55, 66, 12, 14, 3);
  brect(bd, 31, 77, 15, 4, 4);  brect(bd, 54, 77, 15, 4, 4);
  /* تنه سنگی چندتکه */
  bpoly(bd, [[28,36],[72,36],[68,68],[32,68]], 2);
  bpoly(bd, [[32,38],[68,38],[64,62],[36,62]], 5);
  /* شانه‌های بزرگ */
  bell(bd, 27, 38, 10, 8, 3); bell(bd, 73, 38, 10, 8, 3);
  brect(bd, 21, 31, 10, 5, 6); brect(bd, 69, 31, 10, 5, 6);
  /* سر سنگی تاج‌دار */
  brect(bd, 40, 20, 20, 17, 2);
  brect(bd, 43, 17, 4, 4, 7); brect(bd, 53, 17, 4, 4, 7);
  brect(bd, 44, 26, 4, 4, 7); brect(bd, 52, 26, 4, 4, 7);
  bpx(bd, 45, 27, 10); bpx(bd, 53, 27, 10);
  /* هسته کریستالی سینه */
  bpoly(bd, [[50,42],[57,49],[50,57],[43,49]], 7);
  bpoly(bd, [[50,45],[54,49],[50,53],[46,49]], 9);
  outlineBuf(bd);

  /* مشت‌های معلق غول */
  var fw = newBuf();
  brect(fw, 80, 44, 15, 16, 3); brect(fw, 82, 46, 11, 5, 6); brect(fw, 84, 52, 7, 4, 7);
  outlineBuf(fw);

  var nw = newBuf();
  brect(nw, 6, 46, 15, 16, 2); brect(nw, 8, 48, 11, 5, 6); brect(nw, 10, 54, 7, 4, 7);
  outlineBuf(nw);

  var fr = newBuf();
  bell(fr, 95, 34, 8, 8, 7); bell(fr, 95, 34, 4, 4, 10);
  outlineBuf(fr);

  return { body:bakeBuf(bd,pal), wingFar:bakeBuf(fw,pal), wingNear:bakeBuf(nw,pal), fire:bakeBuf(fr,pal), isGolem:true };
}

var dragonCache = {};
function dragonSet(key){
  if (!dragonCache[key]){
    dragonCache[key] = (Number(key) === 4) ? buildGolemSet() : buildDragonSet(dragonPalette(DRAGON_STYLE[key].hue));
  }
  return dragonCache[key];
}

function drawLayerCv(cctx, cv, u0, v0, ang, sc){
  cctx.save();
  cctx.translate((u0-SP_AX)*sc, (v0-SP_AY)*sc);
  if (ang) cctx.rotate(ang);
  cctx.drawImage(cv, -(SP_OX+u0)*sc, -(SP_OY+v0)*sc, cv.width*sc, cv.height*sc);
  cctx.restore();
}

function drawFireCv(cctx, cv, u0, v0, sc, len, alpha, t){
  var sx = len*(0.88 + 0.1*Math.sin(t/37) + Math.random()*0.1);
  var sy = 0.92 + 0.08*Math.sin(t/29+2) + Math.random()*0.08;
  cctx.save();
  cctx.translate((u0-SP_AX)*sc, (v0-SP_AY)*sc);
  cctx.rotate((Math.random()-.5)*0.07);
  cctx.scale(sx, sy);
  cctx.globalAlpha = alpha*(0.8+Math.random()*0.2);
  cctx.drawImage(cv, -(SP_OX+u0)*sc, -(SP_OY+v0)*sc, cv.width*sc, cv.height*sc);
  cctx.restore();
  cctx.globalAlpha = 1;
}

function drawPixelDragonOn(cctx, t, x, y, S, key, stage, faceL){
  var set = dragonSet(key);
  var sc = S/50;
  var spd = (stage==='fire') ? 85 : 125;
  var flap = Math.sin(t/spd);
  cctx.save();
  cctx.imageSmoothingEnabled = false;
  cctx.translate(x, y + Math.sin(t/300)*S*0.06);
  if (faceL) cctx.scale(-1,1);
  if (set.isGolem){
    drawLayerCv(cctx, set.wingFar, 87, 50, Math.sin(t/190)*0.12, sc);
    drawLayerCv(cctx, set.body, 0, 0, 0, sc);
    drawLayerCv(cctx, set.wingNear, 13, 52, -Math.sin(t/190)*0.12, sc);
  } else {
    drawLayerCv(cctx, set.wingFar, 63,43, Math.sin(t/spd-0.8)*0.13, sc);
    drawLayerCv(cctx, set.body, 0,0, 0, sc);
    drawLayerCv(cctx, set.wingNear, 43,52, flap*0.16, sc);
    if (stage === 'fire'){
      drawFireCv(cctx, set.fire, 86,33, sc, 1.0, 0.95, t);
      drawFireCv(cctx, set.fire, 86,33, sc, 0.62, 1.0, t);
    }
  }
  cctx.restore();
}

function pixelMouthPoint(x, y, S, faceL){
  var sc = S/50;
  var dx = (87-SP_AX)*sc, dy = (34-SP_AY)*sc;
  if (faceL) dx = -dx;
  return { x:x+dx, y:y+dy };
}

/* ═══════════════ ۳ رفتار دشمن هوشمند (شکارچی، رقیب، نگهبان) ═══════════════ */
var ENEMY_TYPES = {
  hunter:   { id:'hunter',   name:'مار شکارچی', body:'#ef4444', belly:'#fecaca', dark:'#991b1b', spot:'#450a0a', head:'#f87171', hp:2 },
  rival:    { id:'rival',    name:'مار رقیب',   body:'#f59e0b', belly:'#fef3c7', dark:'#92400e', spot:'#78350f', head:'#fbbf24', hp:2 },
  guardian: { id:'guardian', name:'مار نگهبان', body:'#8b5cf6', belly:'#ede9fe', dark:'#4c1d95', spot:'#2e1065', head:'#a78bfa', hp:3 }
};

function spawnEnemySnake(aiType, gx, gy){
  var spec = ENEMY_TYPES[aiType] || ENEMY_TYPES.rival;
  return {
    aiType: spec.id,
    body: [{x:gx,y:gy}, {x:(gx+1)%COLS,y:gy}, {x:(gx+2)%COLS,y:gy}],
    prev: [{x:gx,y:gy}, {x:(gx+1)%COLS,y:gy}, {x:(gx+2)%COLS,y:gy}],
    anchor: {x:gx, y:gy},
    dir: 'left',
    hp: spec.hp,
    frozenMs: 0,
    grow: 0,
    skinObj: { id:'enemy_'+spec.id, head:spec.head, body:spec.body, spot:spec.spot, belly:spec.belly, dark:spec.dark }
  };
}

function chooseEnemyTarget(e, playerHead, itemsList){
  if (e.aiType === 'hunter'){
    var dv = DIRS[dir] || {x:1, y:0};
    return { x: (playerHead.x + dv.x * 2 + COLS) % COLS, y: (playerHead.y + dv.y * 2 + ROWS) % ROWS };
  }
  if (e.aiType === 'guardian'){
    var bestG = null, bestD = 999;
    for (var i=0;i<itemsList.length;i++){
      var it = itemsList[i];
      if (it.type === 'key' || it.type === 'crystal' || it.type === 'gold' || it.type === 'fireball'){
        var dd = Math.abs(it.x - e.body[0].x) + Math.abs(it.y - e.body[0].y);
        if (dd < bestD){ bestD = dd; bestG = it; }
      }
    }
    var pd = Math.abs(playerHead.x - e.body[0].x) + Math.abs(playerHead.y - e.body[0].y);
    if (pd <= 4) return playerHead;
    return bestG || e.anchor;
  }
  /* rival: جمع‌کردن سریع‌ترین غذا */
  var tgt = null, minDist = 999;
  for (var j=0;j<itemsList.length;j++){
    var f = itemsList[j];
    if (f.type === 'apple' || f.type === 'gold' || f.type === 'crystal'){
      var d2 = Math.abs(f.x - e.body[0].x) + Math.abs(f.y - e.body[0].y);
      if (d2 < minDist){ minDist = d2; tgt = f; }
    }
  }
  return tgt || playerHead;
}

/* ═══════════════ ماشین وضعیت باس‌های ۳ فازه ═══════════════ */
function createBossInstance(key, maxHp, xNorm){
  return {
    key: key,
    x: xNorm || 0.72,
    y: 0.25,
    hp: maxHp,
    maxHp: maxHp,
    phase: 1,
    vy: 1,
    vx: 1,
    fireTimer: 1600,
    specialTimer: 3800,
    phaseFlash: 0,
    fireShow: 0,
    hitFlash: 0,
    faceL: true
  };
}

function updateBossPhase(b, addFloatFn){
  var ratio = b.hp / b.maxHp;
  var nextPhase = ratio <= 0.34 ? 3 : (ratio <= 0.67 ? 2 : 1);
  if (nextPhase > b.phase){
    b.phase = nextPhase;
    b.phaseFlash = 900;
    sfx.roar();
    addShake(0.8);
    if (addFloatFn){
      addFloatFn(Math.floor(COLS/2), 2, 'فاز ' + faNum(nextPhase) + ' خشم باس!', '#ff4757');
    }
  }
}

'use strict';
/* ═══════════════ هسته گیم‌پلی ساده و متمرکز SNAKE: PIXEL RUSH ═══════════════ */
var cell = 20, state = 'menu';
var currentStageNum = 1, activeStage = null;
var snake = [], prevSnake = [], dir = 'right', dirQueue = [], items = [];
var score = 0, tickAcc = 0, lastT = 0;
var particles = [], floatTexts = [];
var foodsRun = 0, runStartTs = 0, runTookHit = false;
var applesEaten = 0, stageGoal = 5;
var hasKey = true, exitUnlocked = false, secretOpened = false;
var boss = null, pShots = [], bossShots = [];
var playerHp = 3, maxPlayerHp = 3, invulnT = 0;
var shakeMag = 0;

var walls = [], secretWalls = [], switches = [], secretReserved = {}, doorCell = null;
var rivals = [];
var MAX_PARTICLES = 36, MAX_FLOATS = 8;
var hintTimer = null;

function spawnParticles(gx, gy, color, n){
  if (isLowFx()) return;
  var avail = MAX_PARTICLES - particles.length;
  if (avail <= 0) return;
  var count = Math.min(n || 8, avail);
  for (var i=0;i<count;i++){
    var ang = Math.random()*Math.PI*2, spd = 1.0 + Math.random()*2.0;
    particles.push({ x:(gx+0.5)*cell, y:(gy+0.5)*cell, vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd, color:color, size:Math.max(2, cell*0.18), life:1, decay:0.045 });
  }
}
function addFloat(gx, gy, txt, color){
  if (floatTexts.length >= MAX_FLOATS) floatTexts.shift();
  floatTexts.push({ x:(gx+0.5)*cell, y:gy*cell, vy:-0.55, text:txt, color:color, life:1 });
}

function showHudHint(msg, persistMs){
  var el = $('#hudHintPill');
  if (!el) return;
  if (hintTimer) clearTimeout(hintTimer);
  if (!msg){
    el.style.display = 'none';
    el.textContent = '';
    return;
  }
  el.textContent = msg;
  el.style.display = 'block';
  if (persistMs > 0){
    hintTimer = setTimeout(function(){
      if (el) el.style.display = 'none';
    }, persistMs);
  }
}

function currentStepMs(){
  var base = 158 - Math.min(34, currentStageNum * 2);
  if (save.settings && save.settings.speed === 'fast') base *= 0.82;
  else if (save.settings && save.settings.speed === 'chill') base *= 1.18;
  return Math.max(92, Math.round(base));
}

function resize(){
  var wrap = $('#stage-wrap');
  if (!wrap) return;
  var r = wrap.getBoundingClientRect();
  if (r.width < 10 || r.height < 10) return;
  var size = Math.max(140, Math.floor(Math.min(r.width, r.height) - 8));
  var stage = $('#stage');
  stage.style.width = size+'px'; stage.style.height = size+'px';
  var dpr = Math.min(window.devicePixelRatio||1, 2);
  canvas.width = size*dpr; canvas.height = size*dpr;
  canvas.style.width = size+'px'; canvas.style.height = size+'px';
  cell = size / COLS;
}
window.addEventListener('resize', resize);

function showScreen(id){
  $$('.screen').forEach(function(s){ s.classList.remove('active'); });
  var el = $('#'+id);
  if (el) el.classList.add('active');
}
function showOv(id){
  $$('.overlay').forEach(function(o){ o.classList.remove('show'); });
  if (id && $('#'+id)) $('#'+id).classList.add('show');
}
function pauseGame(){
  if (state === 'play'){
    state = 'paused';
    stopMusic();
    showOv('ovPause');
  }
}

function cellBlockedByWall(x, y){
  for (var i=0;i<walls.length;i++) if (walls[i].x===x && walls[i].y===y) return true;
  for (var k=0;k<secretWalls.length;k++) if (secretWalls[k].x===x && secretWalls[k].y===y) return true;
  return false;
}

function isFreeCell(x, y){
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return false;
  if (cellBlockedByWall(x, y)) return false;
  if (!secretOpened && secretReserved[keyOf(x, y)]) return false;
  if (doorCell && doorCell.x === x && doorCell.y === y) return false;
  for (var i=0;i<snake.length;i++) if (snake[i].x===x && snake[i].y===y) return false;
  for (var j=0;j<items.length;j++) if (items[j].x===x && items[j].y===y) return false;
  for (var sw=0;sw<switches.length;sw++) if (switches[sw].x===x && switches[sw].y===y) return false;
  for (var r=0;r<rivals.length;r++){
    for (var s=0;s<rivals[r].body.length;s++) if (rivals[r].body[s].x===x && rivals[r].body[s].y===y) return false;
  }
  return true;
}

function findFreeCell(){
  var free = [];
  for (var y=0; y<ROWS; y++){
    for (var x=0; x<COLS; x++){
      if (isFreeCell(x, y)) free.push({x:x, y:y});
    }
  }
  if (free.length) return free[Math.floor(Math.random() * free.length)];
  return { x: Math.floor(COLS/2), y: Math.floor(ROWS/2) };
}

function spawnItem(type){
  var p = findFreeCell();
  items.push({ x:p.x, y:p.y, type:type });
  return p;
}

function ensureGoalItemsPresent(){
  if (!activeStage) return;
  if (activeStage.hasBoss){
    if (boss && boss.hp > 0 && !items.some(function(it){ return it.type === 'fireball'; })){
      spawnItem('fireball');
    }
    return;
  }
  if (applesEaten < stageGoal && !items.some(function(it){ return it.type === 'apple'; })){
    spawnItem('apple');
  }
}

function initHudHearts(){
  var box = $('#hudHearts');
  if (!box) return;
  box.innerHTML = '';
  for (var i=0;i<maxPlayerHp;i++){
    var img = document.createElement('img');
    img.className = 'px-img'; img.width = 15; img.height = 15;
    img.src = (i < playerHp) ? PX_URLS.heart_full : PX_URLS.heart_empty;
    box.appendChild(img);
  }
}

function updateExitState(){
  if (!activeStage) return false;
  var prev = exitUnlocked;
  if (activeStage.hasBoss){
    exitUnlocked = (!boss || boss.hp <= 0);
  } else {
    exitUnlocked = (applesEaten >= stageGoal) && hasKey;
  }
  if (!prev && exitUnlocked){
    sfx.portal();
    showHudHint('در سبز باز شد! به سمت خروجی برو.', 2800);
    if (doorCell) spawnParticles(doorCell.x, doorCell.y, '#46f88f', 12);
  }
  return exitUnlocked;
}

function updateHUD(){
  if ($('#hudStageBadge')) $('#hudStageBadge').textContent = 'مرحله ' + faNum(currentStageNum);
  if ($('#hudScore')) $('#hudScore').textContent = 'امتیاز: ' + faNum(score);

  if ($('#hudGoalText') && activeStage){
    $('#hudGoalText').textContent = activeStage.goalText;
  }
  if ($('#hudProgressText') && activeStage){
    var parts = [];
    if (activeStage.hasBoss){
      var leftHp = boss ? boss.hp : 0;
      var hitDone = activeStage.bossHp - leftHp;
      parts.push('ضربه به اژدها: ' + faNum(hitDone) + ' از ' + faNum(activeStage.bossHp));
    } else {
      if (stageGoal > 0){
        parts.push('سیب‌ها: ' + faNum(Math.min(applesEaten, stageGoal)) + ' از ' + faNum(stageGoal));
      }
      if (activeStage.needKey){
        parts.push('کلید: ' + (hasKey ? '۱/۱' : '۰/۱'));
      }
    }
    if (exitUnlocked) parts.push('در سبز باز است');
    $('#hudProgressText').textContent = parts.join('  •  ');
  }
}

function resetSnakeToSpawn(){
  snake = [{x:4,y:9},{x:3,y:9},{x:2,y:9}];
  prevSnake = snake.map(function(p){ return {x:p.x, y:p.y}; });
  dir = 'right';
  dirQueue = [];
}

function spawnGuardianEnemy(){
  var gSkin = { id:'guardian', head:'#f87171', body:'#dc2626', spot:'#7f1d1d', belly:'#fecaca', dark:'#991b1b' };
  rivals = [{
    type: 'guardian',
    dir: 'down',
    hp: 99,
    frozenMs: 0,
    skinObj: gSkin,
    body: [{x:14,y:6},{x:14,y:5},{x:14,y:4}],
    prev: [{x:14,y:6},{x:14,y:5},{x:14,y:4}],
    tickSkip: 0
  }];
}

function startStage(stageNum){
  currentStageNum = Math.max(1, Number(stageNum || 1));
  save.currentStage = currentStageNum;
  persist();

  activeStage = generateForestStage(currentStageNum);
  state = 'play';
  showScreen('gameScreen');
  showOv(null);
  resize();
  applyControlLayout();

  walls = activeStage.walls.slice();
  secretWalls = activeStage.secretWalls.slice();
  switches = activeStage.switches.map(function(s){ return {x:s.x, y:s.y, order:s.order, active:false}; });
  secretReserved = activeStage.secretReserved || {};
  doorCell = { x: activeStage.doorPos.x, y: activeStage.doorPos.y };

  resetSnakeToSpawn();
  items = [];
  particles = [];
  floatTexts = [];
  pShots = [];
  bossShots = [];
  rivals = [];
  boss = null;

  score = 0;
  foodsRun = 0;
  applesEaten = 0;
  stageGoal = activeStage.applesGoal;
  hasKey = !activeStage.needKey;
  exitUnlocked = false;
  secretOpened = false;
  playerHp = 3; maxPlayerHp = 3; invulnT = 0;
  runTookHit = false;
  runStartTs = Date.now();
  tickAcc = 0;

  if (activeStage.keyPos){
    items.push({ x: activeStage.keyPos.x, y: activeStage.keyPos.y, type: 'key' });
  }
  if (activeStage.hasGuardian){
    spawnGuardianEnemy();
  }
  if (activeStage.hasBoss){
    boss = {
      key: 1,
      hp: activeStage.bossHp,
      maxHp: activeStage.bossHp,
      x: 0.5,
      y: 0.22,
      vx: 0.16,
      faceL: false,
      fireShow: 0,
      hitFlash: 0,
      shootCd: 2200
    };
  }

  ensureGoalItemsPresent();
  updateExitState();
  initHudHearts();
  updateHUD();

  /* پیام آموزشی کوتاه فقط در مراحل ۱ تا ۳ و فقط قبل از یادگیری */
  if (currentStageNum <= 3 && (save.tutorialStepDone || 0) < currentStageNum && activeStage.tutorialHint){
    showHudHint(activeStage.tutorialHint, 4500);
  } else if (activeStage.isSpecial){
    showHudHint(activeStage.hasBoss ? 'از گلوله‌های آبی دوری کن و گوی قرمز بردار!' : 'مرحله ویژه: سنگ معما مسیر مخفی را باز می‌کند!', 3600);
  } else {
    showHudHint('', 0);
  }

  save.stats.gamesPlayed++;
  persist();
  startMusic();
}

function takePlayerHit(reason){
  if (invulnT > 0 || state !== 'play') return false;
  runTookHit = true;
  playerHp--;
  initHudHearts();
  sfx.hit();
  vibrate(80);
  shakeMag = 0.5;
  invulnT = 1400;
  addFloat(snake[0].x, snake[0].y, reason || 'برخورد!', '#ff4757');
  if (playerHp <= 0){
    endStageOver();
    return true;
  }
  resetSnakeToSpawn();
  return false;
}

function stepGuardian(){
  rivals.forEach(function(rv){
    rv.tickSkip = (rv.tickSkip + 1) % 2;
    if (rv.tickSkip !== 0) return; /* حرکت آرام‌تر و قابل پیش‌بینی برای نگهبان */
    rv.prev = rv.body.map(function(p){ return {x:p.x, y:p.y}; });
    var h = rv.body[0];
    var candDirs = [rv.dir, 'down', 'left', 'up', 'right'];
    var chosen = null;
    for (var i=0;i<candDirs.length;i++){
      var d = candDirs[i];
      if (d === OPPO[rv.dir]) continue;
      var nx = h.x + DIRS[d].x, ny = h.y + DIRS[d].y;
      if (nx < 9 || nx >= COLS - 1 || ny < 2 || ny >= ROWS - 2) continue;
      if (cellBlockedByWall(nx, ny)) continue;
      if (doorCell && doorCell.x===nx && doorCell.y===ny) continue;
      chosen = { x:nx, y:ny, d:d };
      break;
    }
    if (!chosen){
      rv.dir = OPPO[rv.dir];
      return;
    }
    rv.dir = chosen.d;
    rv.body.unshift({ x:chosen.x, y:chosen.y });
    rv.body.pop();
    if (snake.length && snake[0].x === chosen.x && snake[0].y === chosen.y){
      takePlayerHit('نگهبان!');
    }
  });
}

function stepBossLogic(dt){
  if (!boss) return;
  if (boss.fireShow > 0) boss.fireShow = Math.max(0, boss.fireShow - dt);
  if (boss.hitFlash > 0) boss.hitFlash = Math.max(0, boss.hitFlash - dt);

  /* حرکت افقی قابل یادگیری باس */
  boss.x += boss.vx * (dt / 1000);
  if (boss.x < 0.22){ boss.x = 0.22; boss.vx = Math.abs(boss.vx); }
  if (boss.x > 0.78){ boss.x = 0.78; boss.vx = -Math.abs(boss.vx); }
  boss.faceL = boss.vx < 0;

  boss.shootCd -= dt;
  if (boss.shootCd <= 0 && snake.length){
    boss.shootCd = Math.max(1500, 2500 - currentStageNum * 25);
    boss.fireShow = 350;
    var bx = boss.x * COLS, by = boss.y * ROWS;
    var tx = snake[0].x + 0.5, ty = snake[0].y + 0.5;
    var ang = Math.atan2(ty - by, tx - bx);
    var spd = 4.6;
    bossShots.push({ x:bx, y:by, vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd });
  }

  for (var i=bossShots.length-1; i>=0; i--){
    var s = bossShots[i];
    s.x += s.vx * (dt / 1000);
    s.y += s.vy * (dt / 1000);
    if (s.x < 0 || s.x >= COLS || s.y < 0 || s.y >= ROWS){
      bossShots.splice(i, 1); continue;
    }
    var gx = Math.floor(s.x), gy = Math.floor(s.y);
    if (walls.some(function(w){ return w.x===gx && w.y===gy; })){
      bossShots.splice(i, 1); continue;
    }
    if (snake.length && Math.hypot(s.x - (snake[0].x+0.5), s.y - (snake[0].y+0.5)) < 0.75){
      bossShots.splice(i, 1);
      takePlayerHit('پرتابه اژدها!');
    }
  }

  for (var pi=pShots.length-1; pi>=0; pi--){
    var p = pShots[pi];
    var txB = boss.x * COLS, tyB = boss.y * ROWS;
    var dAng = Math.atan2(tyB - p.y, txB - p.x);
    p.x += Math.cos(dAng) * 14 * (dt / 1000);
    p.y += Math.sin(dAng) * 14 * (dt / 1000);
    if (Math.hypot(p.x - txB, p.y - tyB) < 1.25){
      pShots.splice(pi, 1);
      boss.hp--;
      boss.hitFlash = 450;
      score += 60;
      sfx.hit();
      spawnParticles(txB, tyB, '#ffd43b', 14);
      addFloat(txB, tyB, 'ضربه! -۱', '#ffd43b');
      if (boss.hp <= 0){
        save.stats.bossWins++;
        score += 150;
        bossShots = [];
        boss = null;
        updateExitState();
        updateHUD();
        break;
      }
      updateHUD();
    }
  }
}

function awardPickup(type, nx, ny){
  var sk = getSkinObj(save.skin);
  if (type === 'apple'){
    foodsRun++;
    applesEaten++;
    save.stats.totalApples++;
    score += Math.round(20 * (sk.bonusScore || 1));
    snake.push({ x:snake[snake.length-1].x, y:snake[snake.length-1].y });
    sfx.eat();
    vibrate(14);
    spawnParticles(nx, ny, '#ff4757', 8);
    addFloat(nx, ny, '+۲۰', '#46f88f');
  } else if (type === 'key'){
    hasKey = true;
    score += 40;
    sfx.key();
    vibrate(25);
    spawnParticles(nx, ny, '#ffd43b', 12);
    addFloat(nx, ny, 'کلید زرد!', '#ffd43b');
    if (!exitUnlocked) showHudHint('کلید را گرفتی! حالا سیب‌ها را کامل کن و به در سبز برو.', 2500);
  } else if (type === 'crystal'){
    save.crystals += 1;
    score += 50;
    sfx.chest();
    spawnParticles(nx, ny, '#c084fc', 12);
    addFloat(nx, ny, '+۱ کریستال', '#c084fc');
  } else if (type === 'gold'){
    save.gold += 15;
    score += 35;
    sfx.gold();
    spawnParticles(nx, ny, '#ffd43b', 10);
    addFloat(nx, ny, '+۱۵ سکه', '#ffd43b');
  } else if (type === 'fireball'){
    pShots.push({ x:nx, y:ny });
    sfx.fire();
    spawnParticles(nx, ny, '#ff9800', 8);
    addFloat(nx, ny, 'شلیک!', '#ff9800');
  }

  ensureGoalItemsPresent();
  updateExitState();
}

function stepSnakeTick(){
  if (state !== 'play' || !snake.length) return;
  prevSnake = snake.map(function(p){ return {x:p.x, y:p.y}; });

  if (dirQueue.length){
    var nd = dirQueue.shift();
    if (nd !== OPPO[dir]) dir = nd;
  }

  var nx = snake[0].x + DIRS[dir].x;
  var ny = snake[0].y + DIRS[dir].y;

  /* دیوار مرزی یا دیوار سنگی */
  if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS || cellBlockedByWall(nx, ny)){
    takePlayerHit('برخورد با دیوار!');
    return;
  }

  /* برخورد با بدن خود مار */
  for (var s=0; s<snake.length-1; s++){
    if (snake[s].x === nx && snake[s].y === ny){
      takePlayerHit('برخورد با خود!');
      return;
    }
  }

  /* برخورد با مار نگهبان */
  for (var ri=0; ri<rivals.length; ri++){
    var rb = rivals[ri].body;
    for (var rs=0; rs<rb.length; rs++){
      if (rb[rs].x === nx && rb[rs].y === ny){
        takePlayerHit('نگهبان!');
        return;
      }
    }
  }

  /* حرکت مار */
  snake.unshift({ x:nx, y:ny });
  snake.pop();

  /* بررسی کلید فشاری معما و باز شدن مسیر مخفی */
  for (var si=0; si<switches.length; si++){
    var sw = switches[si];
    if (!sw.active && sw.x === nx && sw.y === ny){
      sw.active = true;
      secretOpened = true;
      secretWalls = [];
      if (activeStage && activeStage.secretItems){
        activeStage.secretItems.forEach(function(sit){
          items.push({ x:sit.x, y:sit.y, type:sit.type });
        });
      }
      score += 45;
      sfx.wallBreak();
      vibrate([15,20,15]);
      spawnParticles(nx, ny, '#46f88f', 12);
      showHudHint('مسیر مخفی در گوشه نقشه باز شد!', 2800);
      addFloat(nx, ny, 'مسیر مخفی!', '#46f88f');
    }
  }

  /* جمع‌آوری آیتم‌ها */
  for (var ii=items.length-1; ii>=0; ii--){
    var it = items[ii];
    if (it.x === nx && it.y === ny){
      items.splice(ii, 1);
      awardPickup(it.type, nx, ny);
    }
  }

  /* بررسی خروج از در سبز */
  if (doorCell && doorCell.x === nx && doorCell.y === ny && exitUnlocked){
    endStageWin();
    return;
  }

  stepGuardian();
  updateHUD();
}

function checkStageSkinUnlocks(unlockedStage){
  var newly = [];
  SKINS.forEach(function(sk){
    if (save.ownedSkins.indexOf(sk.id) === -1 && unlockedStage >= (sk.needStage || 999)){
      save.ownedSkins.push(sk.id);
      newly.push(sk.name);
    }
  });
  return newly;
}

function endStageWin(){
  state = 'win';
  stopMusic();
  sfx.win();
  vibrate([25,35,25]);

  var durMs = Math.max(1000, Date.now() - runStartTs);
  var sk = getSkinObj(save.skin);
  var rewardGold = Math.round((15 + currentStageNum * 3 + (secretOpened ? 12 : 0) + (!runTookHit ? 8 : 0)) * (sk.bonusGold || 1));
  var rewardCrystals = (activeStage && activeStage.isSpecial) ? 1 : 0;

  save.gold += rewardGold;
  save.crystals += rewardCrystals;
  save.stats.stagesCleared = (save.stats.stagesCleared || 0) + 1;

  if (score > save.best) save.best = score;
  if (!save.bestTimeMs || durMs < save.bestTimeMs) save.bestTimeMs = durMs;

  var prevBestSt = save.stageBestScores[currentStageNum] || 0;
  if (score > prevBestSt) save.stageBestScores[currentStageNum] = score;

  if (!runTookHit){
    save.stats.noHitWins = (save.stats.noHitWins || 0) + 1;
    if (save.noHitStages.indexOf(currentStageNum) === -1) save.noHitStages.push(currentStageNum);
  }
  if (secretOpened){
    save.stats.secretsFound = (save.stats.secretsFound || 0) + 1;
    if (save.secretsFoundStages.indexOf(currentStageNum) === -1) save.secretsFoundStages.push(currentStageNum);
  }
  if (currentStageNum <= 3 && save.tutorialStepDone < currentStageNum){
    save.tutorialStepDone = currentStageNum;
  }

  var nextSt = currentStageNum + 1;
  if (nextSt > save.maxStageUnlocked) save.maxStageUnlocked = nextSt;
  save.currentStage = nextSt;

  var unlockedSkins = checkStageSkinUnlocks(save.maxStageUnlocked);
  persist();

  if ($('#ovWinTitle')) $('#ovWinTitle').textContent = 'مرحله ' + faNum(currentStageNum) + ' تکمیل شد!';
  if ($('#ovWS')) $('#ovWS').textContent = faNum(score);
  if ($('#ovWTime')) $('#ovWTime').textContent = fmtDuration(durMs);
  if ($('#ovWinGold')){
    var rTxt = '+' + faNum(rewardGold) + ' سکه' + (rewardCrystals ? ' و +' + faNum(rewardCrystals) + ' کریستال' : '');
    $('#ovWinGold').textContent = rTxt;
  }
  if ($('#ovWinNotice')){
    var notes = [];
    if (!runTookHit) notes.push('پاک‌سازی بدون برخورد!');
    if (secretOpened) notes.push('مسیر مخفی کشف شد!');
    if (unlockedSkins.length) notes.push('اسکین جدید باز شد: ' + unlockedSkins[0]);
    $('#ovWinNotice').textContent = notes.join('  •  ');
  }
  showOv('ovWin');
}

function endStageOver(){
  state = 'over';
  stopMusic();
  sfx.die();
  vibrate([60,40,60]);
  var durMs = Math.max(1000, Date.now() - runStartTs);
  if (score > save.best) save.best = score;
  persist();

  if ($('#ovS')) $('#ovS').textContent = faNum(score);
  if ($('#ovOTime')) $('#ovOTime').textContent = fmtDuration(durMs);
  if ($('#ovB')) $('#ovB').textContent = faNum(save.best);
  showOv('ovOver');
}

/* کنترل‌های لمسی، کیبورد و D-Pad */
function queueDir(nd){
  if (state !== 'play') return;
  var last = dirQueue[dirQueue.length - 1] || dir;
  if (nd !== last && nd !== OPPO[last] && dirQueue.length < 3){
    dirQueue.push(nd);
  }
}

document.addEventListener('keydown', function(e){
  if (state !== 'play') return;
  var k = e.key;
  if (k==='ArrowUp'||k==='w'||k==='W'){ e.preventDefault(); queueDir('up'); }
  else if (k==='ArrowDown'||k==='s'||k==='S'){ e.preventDefault(); queueDir('down'); }
  else if (k==='ArrowLeft'||k==='a'||k==='A'){ e.preventDefault(); queueDir('left'); }
  else if (k==='ArrowRight'||k==='d'||k==='D'){ e.preventDefault(); queueDir('right'); }
  else if (k==='Escape'||k==='p'||k==='P'){ e.preventDefault(); pauseGame(); }
});

$$('.dpad-btn').forEach(function(btn){
  btn.addEventListener('pointerdown', function(e){
    e.preventDefault();
    queueDir(btn.getAttribute('data-dir'));
  });
});

var touchStart = null;
var stageWrapEl = $('#stage-wrap');
if (stageWrapEl){
  stageWrapEl.addEventListener('pointerdown', function(e){
    if (save.settings && save.settings.control === 'dpad') return;
    touchStart = { x:e.clientX, y:e.clientY };
  });
  stageWrapEl.addEventListener('pointermove', function(e){
    if (!touchStart || (save.settings && save.settings.control === 'dpad')) return;
    var dx = e.clientX - touchStart.x, dy = e.clientY - touchStart.y;
    if (Math.abs(dx) < 16 && Math.abs(dy) < 16) return;
    if (Math.abs(dx) > Math.abs(dy)) queueDir(dx > 0 ? 'right' : 'left');
    else queueDir(dy > 0 ? 'down' : 'up');
    touchStart = { x:e.clientX, y:e.clientY };
  });
  stageWrapEl.addEventListener('pointerup', function(){ touchStart = null; });
}

function applyControlLayout(){
  var nav = $('#controls');
  if (!nav) return;
  var ctrl = (save.settings && save.settings.control) || 'both';
  nav.style.display = (ctrl === 'swipe') ? 'none' : 'grid';
}

/* حلقه اصلی ۶۰ فریم */
function loop(t){
  var dt = Math.min(60, lastT ? (t - lastT) : 16);
  lastT = t;

  if (state === 'play'){
    if (invulnT > 0) invulnT = Math.max(0, invulnT - dt);
    stepBossLogic(dt);

    tickAcc += dt;
    var stepMs = currentStepMs();
    if (tickAcc >= stepMs){
      tickAcc -= stepMs;
      stepSnakeTick();
    }
    render(t);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* قلاب‌های اندروید */
window.getGameState = function(){ return state; };
window.pauseFromAndroid = function(){ pauseGame(); stopMusic(); };
window.handleAndroidBack = function(){
  if ($('#settingsModal') && $('#settingsModal').classList.contains('show')){ $('#settingsModal').classList.remove('show'); return 'handled'; }
  if ($('#guideModal') && $('#guideModal').classList.contains('show')){ $('#guideModal').classList.remove('show'); return 'handled'; }
  if (state === 'play'){ pauseGame(); return 'handled'; }
  if (state === 'paused' || state === 'over' || state === 'win'){
    state = 'menu'; stopMusic(); showScreen('menuScreen'); renderMenu(); return 'handled';
  }
  return 'exit';
};

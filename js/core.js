'use strict';
/* ═══════════════ هسته گیم‌پلی SNAKE: PIXEL RUSH ═══════════════ */
var cell = 20, state = 'menu';
var mode = 'endless', world = 'forest', level = 1;
var snake = [], prevSnake = [], dir = 'right', dirQueue = [], items = [];
var score = 0, tickAcc = 0, lastT = 0;
var particles = [], floatTexts = [], shockwaves = [];
var combo = 0, comboTimer = 0, maxComboRun = 0, foodsRun = 0, runStartTs = 0, runTookHit = false;
var fx = { ghost:0, slow:0, double:0, shield:0, magnet:0, trailType:'', trailMs:0 };
var applesEaten = 0, stageGoal = 8;
var boss = null, pShots = [], bossShots = [];
var playerHp = 3, maxPlayerHp = 3, invulnT = 0;
var shakeMag = 0;

var walls = [], dWalls = [], hotTiles = [], iceTiles = [], sandTiles = [], crumbleTiles = [];
var portals = [], doorCell = null, trailCells = [];
var rivals = [], historyBuf = [], shadowSnake = [];
var runTrace = [], lastRunTrace = null, replayIdx = 0, replayTrace = null, isReplay = false, replaySpeed = 1;

var dashTimer = 0, dashCd = 0, dashMaxCd = 3500;
var energyPct = 0;
var skillCd = 0, skillMaxCd = 8500, rewindsLeft = 2;
var roguePerks = {}, dungeonFloor = 1, bossRushStage = 1, levelRushIdx = 0;
var arenaTimeLeft = 60000, shrinkBorder = 0, onIce = false, onSand = false, hotStayTicks = 0;
var envEvent = null, envCd = 9000, fogActiveMs = 0, sandstormMs = 0, portalCdTicks = 0, closeCallCd = 0;
var rngFn = Math.random;
var activeChallenge = null;

function addShake(amount){ shakeMag = Math.max(shakeMag, amount); }
function addShockwave(gx, gy, color, maxR){
  if (isLowFx()) return;
  shockwaves.push({ x:(gx+0.5)*cell, y:(gy+0.5)*cell, r:cell*0.2, maxR:maxR||cell*2.4, color:color, life:1 });
}
function spawnParticles(gx, gy, color, n){
  if (isLowFx()) return;
  var count = n || 8;
  for (var i=0;i<count;i++){
    var ang = Math.random()*Math.PI*2, spd = 1.2 + Math.random()*2.5;
    particles.push({ x:(gx+0.5)*cell, y:(gy+0.5)*cell, vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd, color:color, size:Math.max(2, cell*0.2), life:1, decay:0.032 });
  }
}
function addFloat(gx, gy, txt, color){
  floatTexts.push({ x:(gx+0.5)*cell, y:gy*cell, vy:-0.6, text:txt, color:color, life:1 });
}

function currentStepMs(){
  var wo = getWorldObj(world);
  var base = 152 * wo.speedMult;
  if (save.settings && save.settings.speed === 'fast') base *= 0.82;
  else if (save.settings && save.settings.speed === 'chill') base *= 1.18;

  if (mode === 'endless') base -= Math.min(48, Math.floor(score / 40) * 3);
  else if (mode === 'timeattack') base -= Math.min(35, Math.floor(foodsRun * 1.4));
  else if (mode === 'dungeon') base -= Math.min(35, dungeonFloor * 5);

  base = Math.max(76, base);
  if (dashTimer > 0) base *= 0.56;
  else if (onIce) base *= 0.72;
  else if (onSand) base *= 1.25;
  if (fx.slow > 0) base *= 1.32;
  return Math.max(52, Math.round(base));
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
  for (var j=0;j<dWalls.length;j++) if (dWalls[j].x===x && dWalls[j].y===y) return true;
  return false;
}

function isFreeCell(x, y){
  if (x < shrinkBorder || x >= COLS - shrinkBorder || y < shrinkBorder || y >= ROWS - shrinkBorder) return false;
  if (cellBlockedByWall(x, y)) return false;
  if (doorCell && doorCell.x === x && doorCell.y === y) return false;
  for (var i=0;i<snake.length;i++) if (snake[i].x===x && snake[i].y===y) return false;
  for (var j=0;j<items.length;j++) if (items[j].x===x && items[j].y===y) return false;
  for (var p=0;p<portals.length;p++) if (portals[p].x===x && portals[p].y===y) return false;
  for (var r=0;r<rivals.length;r++){
    for (var s=0;s<rivals[r].body.length;s++) if (rivals[r].body[s].x===x && rivals[r].body[s].y===y) return false;
  }
  return true;
}

function findFreeCell(){
  var free = [];
  for (var y=shrinkBorder; y<ROWS-shrinkBorder; y++){
    for (var x=shrinkBorder; x<COLS-shrinkBorder; x++){
      if (isFreeCell(x, y)) free.push({x:x, y:y});
    }
  }
  if (free.length) return free[Math.floor(rngFn() * free.length)];
  return { x: Math.floor(COLS/2), y: Math.floor(ROWS/2) };
}

function spawnItem(type){
  var p = findFreeCell();
  items.push({ x:p.x, y:p.y, type:type });
  return p;
}

function ensureApplesPresent(){
  if (boss) return;
  var hasApple = items.some(function(it){ return it.type === 'apple'; });
  if (!hasApple) spawnItem('apple');
}

function initHudHearts(){
  var box = $('#hudHearts');
  if (!box) return;
  box.innerHTML = '';
  for (var i=0;i<maxPlayerHp;i++){
    var img = document.createElement('img');
    img.className = 'px-img'; img.width = 16; img.height = 16;
    img.src = (i < playerHp) ? PX_URLS.heart_full : PX_URLS.heart_empty;
    box.appendChild(img);
  }
}

function updateHUD(){
  if ($('#hudScore')) $('#hudScore').textContent = faNum(score);
  if ($('#hudCombo')){
    $('#hudCombo').textContent = '×' + faNum(Math.max(1, combo));
    $('#hudCombo').style.color = combo >= 5 ? '#ffd43b' : (combo >= 3 ? '#46f88f' : '#e2e8f0');
  }
  if ($('#hudEnergyBar')){
    $('#hudEnergyBar').style.width = Math.min(100, Math.round(energyPct)) + '%';
  }

  var stageEl = $('#hudStageBadge');
  if (stageEl){
    if (isReplay) stageEl.textContent = 'بازپخش (' + faNum(replaySpeed) + 'x)';
    else if (mode === 'timeattack') stageEl.textContent = faNum(Math.max(0, Math.ceil(arenaTimeLeft/1000))) + 'ث';
    else if (mode === 'bossrush') stageEl.textContent = 'باس ' + faNum(bossRushStage) + '/۴';
    else if (mode === 'dungeon') stageEl.textContent = 'طبقه ' + faNum(dungeonFloor);
    else if (mode === 'levelrush'){
      var st = LEVEL_RUSH_STAGES[levelRushIdx] || LEVEL_RUSH_STAGES[0];
      if (st.type === 'puzzle'){
        var remKeys = items.filter(function(it){ return it.type==='key'; }).length;
        stageEl.textContent = 'کلید: ' + faNum(remKeys);
      } else if (boss){
        stageEl.textContent = 'باس جهان';
      } else {
        stageEl.textContent = 'مرحله ' + faNum(levelRushIdx+1) + ': ' + faNum(applesEaten) + '/' + faNum(stageGoal);
      }
    } else {
      stageEl.textContent = getWorldObj(world).name + (save.dailySeedMode ? ' • بذر' : '');
    }
  }

  /* دکمه‌های اکشن: دش، مهارت، بازگشت زمان */
  var bDash = $('#btnDash');
  if (bDash){
    var dTxt = dashTimer > 0 ? 'دش!' : (dashCd > 0 ? faNum(Math.ceil(dashCd/1000))+'ث' : 'دش');
    $('#txtDashBtn').textContent = dTxt;
    bDash.disabled = dashCd > 0 && dashTimer <= 0;
    bDash.classList.toggle('ready', dashCd <= 0);
  }
  var bSkill = $('#btnSkill');
  if (bSkill){
    var sTxt = skillCd > 0 ? faNum(Math.ceil(skillCd/1000))+'ث' : (energyPct >= 100 ? 'انرژی!' : 'مهارت');
    $('#txtSkillBtn').textContent = sTxt;
    bSkill.disabled = skillCd > 0 && energyPct < 100;
    bSkill.classList.toggle('ready', skillCd <= 0 || energyPct >= 100);
  }
  var bRew = $('#btnRewind');
  if (bRew){
    $('#txtRewindBtn').textContent = 'زمان (' + faNum(rewindsLeft) + ')';
    bRew.disabled = rewindsLeft <= 0 || historyBuf.length < 3;
    bRew.classList.toggle('ready', rewindsLeft > 0 && historyBuf.length >= 3);
  }

  initHudHearts();
}

function resetStageArrays(){
  items = []; walls = []; dWalls = []; hotTiles = []; iceTiles = []; sandTiles = [];
  crumbleTiles = []; portals = []; doorCell = null; trailCells = [];
  rivals = []; pShots = []; bossShots = []; boss = null; shadowSnake = [];
  particles = []; floatTexts = []; shockwaves = [];
  fx = { ghost:0, slow:0, double:0, shield:0, magnet:0, trailType:'', trailMs:0 };
  dashTimer = 0; dashCd = 0; hotStayTicks = 0; onIce = false; onSand = false; portalCdTicks = 0;
  shrinkBorder = 0; fogActiveMs = 0; sandstormMs = 0;
}

function spawnSnakeAt(sx, sy){
  snake = [{x:sx,y:sy}, {x:sx-1,y:sy}, {x:sx-2,y:sy}, {x:sx-3,y:sy}];
  prevSnake = snake.map(function(p){ return {x:p.x, y:p.y}; });
  dir = 'right'; dirQueue = ['right'];
  historyBuf = [];
}

function setupStageContent(){
  resetStageArrays();
  spawnSnakeAt(4, 9);
  var wo = getWorldObj(world);

  if (mode === 'bossrush'){
    var bHp = 6 + bossRushStage * 3;
    boss = createBossInstance(bossRushStage, bHp, 0.72);
    boss.hazardTiles = [];
    discover('d' + bossRushStage);
    spawnItem('fireball');
    spawnItem('fireball');
    if (bossRushStage >= 2) spawnItem('superfire');
    if (bossRushStage >= 3) spawnItem('shield');
    updateHUD();
    return;
  }

  if (mode === 'levelrush'){
    var st = LEVEL_RUSH_STAGES[levelRushIdx] || LEVEL_RUSH_STAGES[0];
    if (st.walls) st.walls.forEach(function(w){ walls.push({x:w[0], y:w[1]}); });
    if (st.dWalls) st.dWalls.forEach(function(dw){ dWalls.push({x:dw[0], y:dw[1], hp:2, maxHp:2}); });
    if (st.crumble) st.crumble.forEach(function(c){ crumbleTiles.push({x:c[0], y:c[1], step:0}); });
    if (st.portals) st.portals.forEach(function(p){
      portals.push({x:p[0], y:p[1], tx:p[2], ty:p[3], color:'a'});
      portals.push({x:p[2], y:p[3], tx:p[0], ty:p[1], color:'a'});
    });
    if (st.keys) st.keys.forEach(function(k){ items.push({x:k[0], y:k[1], type:'key'}); });
    if (st.door) doorCell = { x:st.door[0], y:st.door[1] };
    stageGoal = st.goalApples || 8;
    applesEaten = 0;

    if (st.type === 'boss'){
      boss = createBossInstance(wo.bossKey, 8 + wo.bossKey * 2, 0.74);
      boss.hazardTiles = [];
      discover('d' + wo.bossKey);
      spawnItem('fireball');
      spawnItem('fireball');
      spawnItem('superfire');
    } else {
      spawnItem('apple');
      if (st.type === 'goal') spawnItem('gold');
      if (st.enemies){
        st.enemies.forEach(function(et, idx){
          var pos = idx === 0 ? {x:15, y:4} : {x:15, y:14};
          rivals.push(spawnEnemySnake(et, pos.x, pos.y));
          discover(et);
        });
      }
    }
    updateHUD();
    return;
  }

  /* حالت‌های Endless, TimeAttack, Dungeon از ژنراتور BFS-Verified استفاده می‌کنند */
  var stageScale = (mode === 'dungeon') ? dungeonFloor : (1 + Math.floor(score / 250));
  var lay = generateWorldLayout(world, stageScale, rngFn);
  walls = lay.walls;
  dWalls = lay.dWalls;
  hotTiles = lay.hotTiles;
  iceTiles = lay.iceTiles;
  sandTiles = lay.sandTiles;
  crumbleTiles = lay.crumbleTiles;
  portals = lay.portals;
  if (portals.length) discover('portal');
  if (dWalls.length) discover('dwall');

  spawnItem('apple');
  spawnItem('apple');
  spawnItem('gold');
  if (mode === 'timeattack') spawnItem('timer');

  /* اسپاون دشمن هوشمند بر اساس نوع حالت */
  if (mode === 'dungeon'){
    var aiPool = ['hunter', 'rival', 'guardian'];
    rivals.push(spawnEnemySnake(aiPool[dungeonFloor % aiPool.length], 15, 4));
    if (dungeonFloor >= 2) rivals.push(spawnEnemySnake('guardian', 15, 14));
    doorCell = { x:17, y:9 };
    items.push({ x:14, y:9, type:'key' });
    if (dungeonFloor >= 3) items.push({ x:9, y:3, type:'key' });
    spawnItem('crystal');
  } else if (mode === 'timeattack'){
    rivals.push(spawnEnemySnake('rival', 15, 4));
    rivals.push(spawnEnemySnake('hunter', 15, 14));
  } else if (mode === 'endless'){
    rivals.push(spawnEnemySnake('rival', 15, 14));
  }
  updateHUD();
}

function startGame(chosenMode, chosenWorld, challengeObj){
  mode = chosenMode || save.mode || 'endless';
  world = chosenWorld || save.world || 'forest';
  save.mode = mode;
  save.world = world;
  activeChallenge = challengeObj || null;
  isReplay = false;

  if (mode === 'endless' && save.dailySeedMode){
    var dk = todayKey();
    if (save.dailySeedKey !== dk){ save.dailySeedKey = dk; save.dailySeedBest = 0; }
    rngFn = mulberry32(hashStr('pixel-rush-' + dk + '-' + world));
  } else {
    rngFn = Math.random;
  }

  save.stats.gamesPlayed++;
  save.dailyProgress.games++;
  persist();

  level = 1; dungeonFloor = 1; bossRushStage = 1; levelRushIdx = 0;
  score = 0; combo = 0; comboTimer = 0; maxComboRun = 0; foodsRun = 0;
  runStartTs = Date.now(); runTookHit = false;
  energyPct = 0; skillCd = 0; envCd = 8500; closeCallCd = 0;
  roguePerks = {};
  maxPlayerHp = 3; playerHp = 3; invulnT = 0;
  rewindsLeft = 1 + Math.floor((save.skills.reflex || 1) / 2);
  arenaTimeLeft = (save.timeAttackSec || 60) * 1000;
  runTrace = [];

  setupStageContent();
  applyControlLayout();
  state = 'play';
  showScreen('gameScreen');
  showOv(null);
  resize();
  startMusic();
  sfx.start();

  if (activeChallenge) showToast(activeChallenge.title);
  else showToast(getWorldObj(world).name + ' — ' + getModeObj(mode).name);
}

function triggerDash(){
  if (state !== 'play' || isReplay) return;
  if (dashCd > 0 || dashTimer > 0) return;
  var cdReduc = roguePerks.rg_bolt ? 0.6 : Math.max(0.65, 1 - (save.skills.reflex - 1) * 0.07);
  dashTimer = 520;
  dashCd = Math.round(dashMaxCd * cdReduc);
  save.dailyProgress.dashes++;
  sfx.dash();
  vibrate(14);
  if (snake.length){
    addShockwave(snake[0].x, snake[0].y, '#38bdf8', cell*2.2);
    spawnParticles(snake[0].x, snake[0].y, '#38bdf8', 10);
  }
  updateHUD();
}

function triggerSkill(){
  if (state !== 'play' || isReplay) return;
  if (skillCd > 0 && energyPct < 100) return;
  var usedFullEnergy = (energyPct >= 100);
  if (usedFullEnergy) energyPct = 0;
  else {
    var cdMult = roguePerks.rg_bolt ? 0.6 : Math.max(0.6, 1 - (save.skills.power - 1) * 0.08);
    skillCd = Math.round(skillMaxCd * cdMult);
  }

  var g1 = save.genes[0] || 'fire';
  var g2 = save.genes[1] || g1;
  var dur = 3600 + (save.skills.power - 1) * 550;
  var h = snake[0];
  sfx.power();
  vibrate(18);
  addShockwave(h.x, h.y, getGeneObj(g1).color, cell*3.2);

  [g1, g2].forEach(function(gid){
    if (gid === 'fire' || gid === 'toxic' || gid === 'electric'){
      fx.trailType = usedFullEnergy ? 'energy' : gid;
      fx.trailMs = Math.max(fx.trailMs, dur);
      if (gid === 'electric'){
        /* موج شوک دیوارهای شکننده نزدیک را خرد می‌کند */
        for (var i=dWalls.length-1;i>=0;i--){
          var dw = dWalls[i];
          if (Math.abs(dw.x-h.x)+Math.abs(dw.y-h.y) <= 3){
            dWalls.splice(i,1);
            save.stats.wallsBroken++;
            score += 25;
            spawnParticles(dw.x, dw.y, '#fde047', 10);
          }
        }
        rivals.forEach(function(rv){
          if (rv.body.length && Math.abs(rv.body[0].x-h.x)+Math.abs(rv.body[0].y-h.y) <= 5){
            rv.hp--; rv.frozenMs = 1500;
          }
        });
      }
    }
    if (gid === 'frost'){
      rivals.forEach(function(rv){ rv.frozenMs = 4200; });
      fx.slow = Math.max(fx.slow, 2500);
    }
    if (gid === 'magnet'){ fx.magnet = Math.max(fx.magnet, dur + 2000); }
    if (gid === 'armor'){ fx.shield = Math.max(fx.shield, roguePerks.rg_ghost ? dur*2 : dur); }
    if (gid === 'ghost'){ fx.ghost = Math.max(fx.ghost, roguePerks.rg_ghost ? dur*2 : dur); }
    if (gid === 'shadow'){ fx.double = Math.max(fx.double, dur); }
  });

  if (boss){
    pShots.push({ x:h.x, y:h.y, vx:0.38, vy:0, super:usedFullEnergy, dmg: usedFullEnergy ? 2 : 1 });
    sfx.shoot();
  }
  updateHUD();
}

function triggerRewind(){
  if (state !== 'play' || isReplay || rewindsLeft <= 0 || historyBuf.length < 3) return;
  rewindsLeft--;
  var idx = Math.max(0, historyBuf.length - 12);
  var snap = historyBuf[idx];
  historyBuf.length = idx;
  snake = snap.snake.map(function(p){ return {x:p.x, y:p.y}; });
  prevSnake = snake.map(function(p){ return {x:p.x, y:p.y}; });
  dir = snap.dir;
  dirQueue = [dir];
  invulnT = 1400;
  hotStayTicks = 0;
  sfx.rewind();
  vibrate([12,30,12]);
  if (snake.length){
    addShockwave(snake[0].x, snake[0].y, '#38bdf8', cell*2.8);
    addFloat(snake[0].x, snake[0].y, 'بازگشت زمان!', '#7dd3fc');
  }
  updateHUD();
}

function takePlayerHit(reason){
  if (invulnT > 0 || dashTimer > 0) return false;
  if (fx.shield > 0){
    fx.shield = 0;
    invulnT = 1300;
    sfx.hit();
    addShake(0.45);
    if (snake.length) addFloat(snake[0].x, snake[0].y, 'سپر شکست!', '#60a5fa');
    updateHUD();
    return false;
  }
  runTookHit = true;
  playerHp--;
  invulnT = 1700;
  combo = 0;
  sfx.hit();
  vibrate([30,30,30]);
  addShake(0.75);
  if (snake.length) addFloat(snake[0].x, snake[0].y, reason || '-۱ قلب!', '#ff4757');
  updateHUD();
  if (playerHp <= 0){
    endRunGameOver();
    return true;
  }
  return false;
}

function awardFood(type, gx, gy){
  combo = (comboTimer > 0) ? Math.min(15, combo + 1) : 1;
  comboTimer = 3900;
  if (combo > maxComboRun) maxComboRun = combo;
  if (combo > save.stats.maxComboEver) save.stats.maxComboEver = combo;
  if (combo === 3) save.dailyProgress.combos++;
  if (combo >= 3) sfx.combo(combo);

  var sk = getSkinObj(save.skin);
  var mult = (fx.double > 0 ? 2 : 1) * (roguePerks.rg_combo ? 1.5 : 1) * (sk.bonusScore || 1);
  var cMult = 1 + Math.min(1.5, (combo - 1) * 0.15);

  foodsRun++;
  save.stats.totalApples++;
  save.dailyProgress.foods++;
  energyPct = Math.min(100, energyPct + 14);

  if (type === 'apple'){
    var pts = Math.round(15 * mult * cMult);
    score += pts;
    applesEaten++;
    sfx.eat();
    spawnParticles(gx, gy, '#ff4757', 8);
    addFloat(gx, gy, '+'+faNum(pts) + (combo>=3 ? ' ×'+faNum(combo):''), '#46f88f');
    snake.push({x:snake[snake.length-1].x, y:snake[snake.length-1].y});
  } else if (type === 'gold' || type === 'coin_drop'){
    var ptsG = Math.round(35 * mult * cMult);
    var gCoin = Math.round((2 + Math.floor(combo/3)) * (sk.bonusGold || 1));
    score += ptsG; save.gold += gCoin;
    sfx.gold();
    spawnParticles(gx, gy, '#ffd43b', 10);
    addFloat(gx, gy, '+'+faNum(gCoin)+' سکه', '#ffd43b');
  } else if (type === 'crystal'){
    save.crystals += 1;
    score += Math.round(50 * mult);
    sfx.crystal();
    spawnParticles(gx, gy, '#c084fc', 12);
    addFloat(gx, gy, '+۱ کریستال!', '#e9d5ff');
  } else if (type === 'orb'){
    score += Math.round(40 * mult);
    energyPct = Math.min(100, energyPct + 35);
    sfx.power();
    spawnParticles(gx, gy, '#38bdf8', 10);
    addFloat(gx, gy, '+انرژی!', '#7dd3fc');
  } else if (type === 'ghost'){
    fx.ghost = 5000 + (sk.ghostExtra || 0);
    sfx.power();
    addFloat(gx, gy, 'حالت روح!', '#93c5fd');
  } else if (type === 'slow'){
    fx.slow = 4500;
    sfx.power();
    addFloat(gx, gy, 'آرامش!', '#38bdf8');
  } else if (type === 'double'){
    fx.double = 6000;
    sfx.power();
    addFloat(gx, gy, 'امتیاز ×۲!', '#ffd43b');
  } else if (type === 'shield'){
    fx.shield = 7500;
    sfx.power();
    addFloat(gx, gy, 'سپر فعال!', '#60a5fa');
  } else if (type === 'heart'){
    if (playerHp < maxPlayerHp) playerHp++;
    else score += 45;
    sfx.win();
    addFloat(gx, gy, '+۱ قلب', '#ff4757');
  } else if (type === 'timer'){
    arenaTimeLeft += 4000;
    score += 20;
    sfx.gold();
    addFloat(gx, gy, '+۴ ثانیه!', '#46f88f');
  } else if (type === 'fireball' || type === 'superfire'){
    var isSup = (type === 'superfire');
    if (boss){
      pShots.push({ x:gx, y:gy, vx:0.42, vy:0, super:isSup, dmg: (isSup?2:1) * (sk.dmg||1) });
      sfx.shoot();
      addFloat(gx, gy, isSup ? 'شلیک ویژه!' : 'شلیک!', '#ff9800');
    } else {
      score += 30;
      energyPct = Math.min(100, energyPct + 25);
      sfx.power();
    }
  } else if (type === 'key'){
    sfx.gold();
    spawnParticles(gx, gy, '#ffd43b', 12);
    var leftK = items.filter(function(it){ return it.type==='key'; }).length;
    addFloat(gx, gy, leftK === 0 ? 'دروازه باز شد!' : 'کلید گرفته شد!', '#ffd43b');
  } else if (type === 'bomb' || type === 'acid'){
    sfx.bomb();
    spawnParticles(gx, gy, '#ef4444', 12);
    takePlayerHit('تله!');
  }

  /* مدیریت اسپاون مداوم آیتم‌ها */
  if (type === 'apple'){
    ensureApplesPresent();
    if (rngFn() < 0.28) spawnItem('gold');
    if (rngFn() < 0.08) spawnItem('crystal');
    if (rngFn() < 0.14) spawnItem(pick(['ghost','slow','double','shield','orb']));
    if (mode === 'timeattack' && rngFn() < 0.18) spawnItem('timer');
  } else if ((type === 'fireball' || type === 'superfire') && boss){
    if (items.filter(function(x){ return x.type==='fireball'||x.type==='superfire'; }).length < 2){
      spawnItem(rngFn() < 0.25 ? 'superfire' : 'fireball');
    }
  }

  /* بررسی ارتقای مرحله در حالت مرحله‌ای */
  if (mode === 'levelrush' && !boss){
    var st = LEVEL_RUSH_STAGES[levelRushIdx];
    if (st && st.type === 'goal' && applesEaten >= stageGoal){
      advanceStageFlow();
    }
  }
  updateHUD();
}

function advanceStageFlow(){
  if (mode === 'levelrush'){
    if (levelRushIdx < LEVEL_RUSH_STAGES.length - 1){
      levelRushIdx++;
      sfx.win();
      showToast(LEVEL_RUSH_STAGES[levelRushIdx].title);
      setupStageContent();
    } else {
      endRunWin();
    }
  } else if (mode === 'dungeon'){
    dungeonFloor++;
    if (dungeonFloor > 4){
      endRunWin();
    } else {
      openRogueDraft();
    }
  } else if (mode === 'bossrush'){
    bossRushStage++;
    if (bossRushStage > 4){
      endRunWin();
    } else {
      if (playerHp < maxPlayerHp) playerHp++;
      sfx.win();
      showToast('باس بعدی: ' + DRAGON_STYLE[bossRushStage].name);
      setupStageContent();
    }
  }
}

function openRogueDraft(){
  state = 'paused';
  var box = $('#draftOptions');
  if (!box) return;
  box.innerHTML = '';
  var pool = ROGUE_CARDS.slice().sort(function(){ return Math.random()-0.5; }).slice(0, 3);
  pool.forEach(function(c){
    var card = document.createElement('div');
    card.className = 'draft-card';
    card.innerHTML = pxImgTag(c.ico, 28) + '<b>'+c.title+'</b><span>'+c.desc+'</span>';
    card.onclick = function(){
      sfx.power();
      roguePerks[c.id] = true;
      if (c.id === 'rg_hp'){ maxPlayerHp++; playerHp = Math.min(maxPlayerHp, playerHp + 1); }
      if (c.id === 'rg_rewind'){ rewindsLeft += 2; }
      $('#draftModal').classList.remove('show');
      state = 'play';
      setupStageContent();
      showToast('قدرت سیاهچال: ' + c.title);
    };
    box.appendChild(card);
  });
  $('#draftModal').classList.add('show');
}

function triggerWorldEvent(){
  var wo = getWorldObj(world);
  if (world === 'forest'){
    spawnItem('apple'); spawnItem('gold');
    addFloat(9, 2, 'شکوفه بارانی!', '#46f88f');
  } else if (world === 'lava'){
    var p = findFreeCell();
    hotTiles.push({x:p.x, y:p.y});
    addFloat(p.x, p.y, 'فوران مذاب!', '#ff6b2b');
  } else if (world === 'ice'){
    spawnItem('crystal');
    addFloat(9, 2, 'تلالو کریستال یخ!', '#38bdf8');
  } else if (world === 'shadow'){
    fogActiveMs = 4500; fx.double = Math.max(fx.double, 4500);
    addFloat(9, 2, 'کسوف سایه (×۲ امتیاز)!', '#c084fc');
  } else if (world === 'desert'){
    sandstormMs = 5000;
    spawnItem('gold'); spawnItem('gold');
    addFloat(9, 2, 'واحه طوفان شن!', '#ffd43b');
  } else if (world === 'digital'){
    spawnItem('crystal');
    addFloat(9, 2, 'بسته داده جدید!', '#22d3ee');
  }
}

function stepRivals(){
  rivals.forEach(function(rv, idx){
    if (rv.frozenMs > 0) return;
    if (!rv.body.length) return;
    rv.prev = rv.body.map(function(p){ return {x:p.x, y:p.y}; });
    var head = rv.body[0];
    var tgt = chooseEnemyTarget(rv, snake[0], items);

    var opts = ['up','down','left','right'].filter(function(d){ return d !== OPPO[rv.dir]; });
    var bestD = rv.dir, bestScore = 1e9;
    opts.forEach(function(d){
      var v = DIRS[d];
      var nx = (head.x + v.x + COLS) % COLS, ny = (head.y + v.y + ROWS) % ROWS;
      if (cellBlockedByWall(nx, ny)) return;
      var selfHit = rv.body.some(function(s){ return s.x===nx && s.y===ny; });
      if (selfHit) return;
      var sc = Math.abs(nx - tgt.x) + Math.abs(ny - tgt.y);
      if (sc < bestScore){ bestScore = sc; bestD = d; }
    });
    rv.dir = bestD;
    var mv = DIRS[rv.dir];
    var nh = { x:(head.x+mv.x+COLS)%COLS, y:(head.y+mv.y+ROWS)%ROWS };
    rv.body.unshift(nh);
    var ate = false;
    for (var i=items.length-1;i>=0;i--){
      var it = items[i];
      if (it.x===nh.x && it.y===nh.y && (it.type==='apple'||it.type==='gold')){
        items.splice(i,1); ate = true;
        if (it.type==='apple') ensureApplesPresent();
        break;
      }
    }
    if (!ate) rv.body.pop();

    /* برخورد رقیب با ردپای انرژی یا ژن */
    trailCells.forEach(function(tr){
      if (tr.x===nh.x && tr.y===nh.y){
        rv.hp--; rv.frozenMs = 900;
        spawnParticles(nh.x, nh.y, '#ffd43b', 6);
      }
    });
    if (rv.hp <= 0){
      items.push({x:nh.x, y:nh.y, type:'coin_drop'});
      save.stats.rivalsDefeated++;
      save.weeklyProgress.rivals++;
      score += 65;
      addFloat(nh.x, nh.y, 'شکار رقیب +۶۵!', '#46f88f');
      rivals.splice(idx, 1);
    }
  });
}

function stepBossLogic(dt){
  if (!boss) return;
  boss.hitFlash = Math.max(0, boss.hitFlash - dt);
  boss.fireShow = Math.max(0, boss.fireShow - dt);
  boss.phaseFlash = Math.max(0, boss.phaseFlash - dt);

  var spdMult = boss.phase === 3 ? 1.55 : (boss.phase === 2 ? 1.25 : 1.0);
  boss.y += boss.vy * 0.00018 * dt * spdMult;
  if (boss.y < 0.16){ boss.y = 0.16; boss.vy = 1; }
  if (boss.y > 0.84){ boss.y = 0.84; boss.vy = -1; }

  boss.fireTimer -= dt;
  if (boss.fireTimer <= 0){
    boss.fireTimer = Math.max(680, (1750 - boss.phase * 280));
    boss.fireShow = 380;
    sfx.fire();
    var m = pixelMouthPoint(boss.x * COLS, boss.y * ROWS, 2.0, boss.faceL);
    var isRock = (boss.key === 4);
    var isIce = (boss.key === 1 && boss.phase >= 2);
    var isLight = (boss.key === 3);

    var shotsCount = boss.phase === 3 ? 3 : (boss.phase === 2 ? 2 : 1);
    for (var s=0; s<shotsCount; s++){
      var spread = (s - (shotsCount - 1)/2) * 0.055;
      bossShots.push({
        x: boss.x * COLS - 1.2,
        y: boss.y * ROWS,
        vx: -0.011 * spdMult,
        vy: spread,
        isRock: isRock,
        isIce: isIce,
        isLightning: isLight
      });
    }
  }

  /* الگوی خاص فاز ۲ و ۳ باس (مثل مناطق خطر یا بلوک سنگی غول) */
  boss.specialTimer -= dt;
  if (boss.specialTimer <= 0 && boss.phase >= 2){
    boss.specialTimer = 4200;
    if (boss.key === 4 && dWalls.length < 10){
      var p = findFreeCell();
      dWalls.push({x:p.x, y:p.y, hp:2, maxHp:2});
      addFloat(p.x, p.y, 'سنگ غول!', '#94a3b8');
    } else if (boss.key === 2){
      boss.hazardTiles = [];
      for (var k=0;k<4;k++){
        var hp = findFreeCell();
        boss.hazardTiles.push({x:hp.x, y:hp.y});
      }
    }
  }

  /* حرکت پرتابه‌های بازیکن به باس */
  for (var pi=pShots.length-1;pi>=0;pi--){
    var ps = pShots[pi];
    ps.x += ps.vx * dt * 0.03;
    ps.y += ps.vy * dt * 0.03;
    if (Math.abs(ps.x - boss.x * COLS) < 1.6 && Math.abs(ps.y - boss.y * ROWS) < 1.8){
      boss.hp -= ps.dmg;
      boss.hitFlash = 350;
      sfx.bosshit();
      addShake(0.5);
      spawnParticles(ps.x, ps.y, '#ffd43b', 12);
      pShots.splice(pi, 1);
      updateBossPhase(boss, addFloat);
      if (boss.hp <= 0){
        boss = null;
        save.stats.bossWins++;
        save.weeklyProgress.bossWins++;
        score += 250;
        save.gold += 30;
        save.crystals += 2;
        sfx.win();
        advanceStageFlow();
        return;
      }
    } else if (ps.x > COLS + 1){
      pShots.splice(pi, 1);
    }
  }

  /* حرکت پرتابه‌های باس */
  for (var bi=bossShots.length-1;bi>=0;bi--){
    var bs = bossShots[bi];
    bs.x += bs.vx * dt;
    bs.y += bs.vy * dt;
    if (bs.x < -1 || bs.y < -1 || bs.y > ROWS + 1){ bossShots.splice(bi, 1); continue; }
    var hx = snake[0].x, hy = snake[0].y;
    if (Math.abs(bs.x - (hx+0.5)) < 0.72 && Math.abs(bs.y - (hy+0.5)) < 0.72){
      bossShots.splice(bi, 1);
      takePlayerHit('اصابت باس!');
    }
  }
}

function stepSnakeTick(){
  if (!snake.length) return;
  prevSnake = snake.map(function(p){ return {x:p.x, y:p.y}; });

  /* ثبت تاریخچه برای Rewind و Shadow Snake */
  historyBuf.push({ snake: snake.map(function(p){ return {x:p.x, y:p.y}; }), dir: dir });
  if (historyBuf.length > 40) historyBuf.shift();

  if (world === 'shadow' && historyBuf.length >= 16){
    shadowSnake = historyBuf[historyBuf.length - 16].snake;
  } else {
    shadowSnake = [];
  }

  if (dirQueue.length > 1) dirQueue.shift();
  dir = dirQueue[0] || dir;
  var mv = DIRS[dir];
  var nx = (snake[0].x + mv.x + COLS) % COLS;
  var ny = (snake[0].y + mv.y + ROWS) % ROWS;

  /* کاهش قفل پورتال */
  if (portalCdTicks > 0) portalCdTicks--;

  /* جفت پورتال دوقلو */
  if (portalCdTicks === 0){
    for (var pti=0;pti<portals.length;pti++){
      var pt = portals[pti];
      if (pt.x === nx && pt.y === ny){
        nx = pt.tx; ny = pt.ty;
        portalCdTicks = 3;
        save.stats.portalsUsed++;
        sfx.portal();
        addShockwave(nx, ny, '#22d3ee', cell*2.5);
        break;
      }
    }
  }

  /* دروازه خروجی مرحله‌ای / سیاهچال */
  if (doorCell && doorCell.x === nx && doorCell.y === ny){
    var remKeys = items.filter(function(it){ return it.type==='key'; }).length;
    if (remKeys === 0){
      advanceStageFlow();
      return;
    } else {
      takePlayerHit('دروازه قفل است!');
      return;
    }
  }

  /* دیوار تخریب‌پذیر (با دش می‌شکند!) */
  for (var dwi=dWalls.length-1;dwi>=0;dwi--){
    var dw = dWalls[dwi];
    if (dw.x === nx && dw.y === ny){
      if (dashTimer > 0 || fx.ghost > 0){
        if (dashTimer > 0){
          dWalls.splice(dwi, 1);
          save.stats.wallsBroken++;
          score += 30;
          sfx.wallBreak();
          spawnParticles(nx, ny, '#94a3b8', 12);
          addFloat(nx, ny, 'شکست! +۳۰', '#ffd43b');
        }
      } else {
        if (takePlayerHit('برخورد به بلوک!')) return;
        return;
      }
    }
  }

  /* دیوار صلب و محدوده */
  var outBounds = (nx < shrinkBorder || nx >= COLS - shrinkBorder || ny < shrinkBorder || ny >= ROWS - shrinkBorder);
  var hitSolidWall = walls.some(function(w){ return w.x===nx && w.y===ny; });
  if ((outBounds || hitSolidWall) && fx.ghost <= 0){
    takePlayerHit('دیوار!');
    return;
  }

  /* برخورد با بدنه خود یا سایه یا دشمن */
  if (fx.ghost <= 0){
    var selfHit = false;
    for (var s=0;s<snake.length-1;s++) if (snake[s].x===nx && snake[s].y===ny) selfHit = true;
    if (selfHit){ takePlayerHit('برخورد به خود!'); return; }
  }

  for (var sh=0;sh<shadowSnake.length;sh++){
    if (shadowSnake[sh].x===nx && shadowSnake[sh].y===ny && fx.ghost <= 0){
      takePlayerHit('همزاد سایه!');
      return;
    }
  }

  for (var ri=0;ri<rivals.length;ri++){
    var rv = rivals[ri];
    for (var rs=0;rs<rv.body.length;rs++){
      if (rv.body[rs].x===nx && rv.body[rs].y===ny){
        if (dashTimer > 0){
          /* با دش دشمن ضربه می‌خورد! */
          rv.hp--; rv.frozenMs = 1000;
          spawnParticles(nx, ny, '#ef4444', 10);
          if (rv.hp <= 0){
            items.push({x:nx, y:ny, type:'coin_drop'});
            rivals.splice(ri, 1);
            save.stats.rivalsDefeated++; save.weeklyProgress.rivals++;
            score += 80;
            addFloat(nx, ny, 'ضربه دش! +۸۰', '#ffd43b');
          }
        } else {
          takePlayerHit('مار دشمن!');
          return;
        }
        break;
      }
    }
  }

  /* حرکت مار */
  snake.unshift({x:nx, y:ny});
  snake.pop();

  /* کاشی‌های ویژه جهان */
  onIce = iceTiles.some(function(t){ return t.x===nx && t.y===ny; });
  onSand = sandTiles.some(function(t){ return t.x===nx && t.y===ny; });
  var onHot = hotTiles.some(function(t){ return t.x===nx && t.y===ny; }) ||
              (boss && boss.hazardTiles && boss.hazardTiles.some(function(t){ return t.x===nx && t.y===ny; }));
  if (onHot){
    hotStayTicks++;
    if (hotStayTicks >= 2){
      hotStayTicks = 0;
      takePlayerHit('مذاب سوزان!');
    }
  } else {
    hotStayTicks = 0;
  }

  for (var ci=crumbleTiles.length-1;ci>=0;ci--){
    var cr = crumbleTiles[ci];
    if (cr.x===nx && cr.y===ny){
      cr.step++;
      if (cr.step >= 2){ walls.push({x:cr.x, y:cr.y}); crumbleTiles.splice(ci, 1); }
    }
  }

  /* پاداش نزدیک به مرگ (Close Call) */
  if (closeCallCd <= 0){
    var nearDanger = false;
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(function(off){
      var ax = (nx+off[0]+COLS)%COLS, ay = (ny+off[1]+ROWS)%ROWS;
      if (walls.some(function(w){ return w.x===ax && w.y===ay; })) nearDanger = true;
      if (items.some(function(it){ return it.x===ax && it.y===ay && it.type==='bomb'; })) nearDanger = true;
    });
    if (nearDanger && dirQueue.length >= 1){
      closeCallCd = 3200;
      score += 25;
      save.stats.closeCalls++;
      sfx.closeCall();
      addFloat(nx, ny, 'فرار میلی‌متری! +۲۵', '#38bdf8');
    }
  }

  /* ردپای فعال انرژی/ژن */
  if (fx.trailMs > 0){
    trailCells.push({ x:snake[snake.length-1].x, y:snake[snake.length-1].y, kind:fx.trailType||'energy', ms:3500 });
  }

  /* جذب خودکار با زنجیره کمبو + ژن مغناطیس */
  var magRange = 0;
  if (fx.magnet > 0 || roguePerks.rg_magnet) magRange = 3;
  else if (combo >= 3) magRange = 1 + Math.floor(combo / 4);
  if (save.skills.greed > 1) magRange += Math.floor((save.skills.greed - 1) / 2);

  for (var ii=items.length-1;ii>=0;ii--){
    var it = items[ii];
    var dist = Math.abs(it.x - nx) + Math.abs(it.y - ny);
    if (it.x===nx && it.y===ny){
      items.splice(ii, 1);
      awardFood(it.type, nx, ny);
    } else if (magRange > 0 && dist <= magRange && (it.type==='apple'||it.type==='gold'||it.type==='crystal'||it.type==='coin_drop')){
      it.x += Math.sign(nx - it.x);
      it.y += Math.sign(ny - it.y);
      if (it.x===nx && it.y===ny){
        items.splice(ii, 1);
        awardFood(it.type, nx, ny);
      }
    }
  }

  /* ذخیره فریم بازپخش */
  runTrace.push({
    snake: snake.map(function(p){ return {x:p.x, y:p.y}; }),
    dir: dir,
    items: items.map(function(i){ return {x:i.x, y:i.y, type:i.type}; }),
    score: score
  });
  if (runTrace.length > 600) runTrace.shift();

  stepRivals();
  updateHUD();
}

function finalizeRewards(isVictory){
  stopMusic();
  var sk = getSkinObj(save.skin);
  var durMs = Date.now() - runStartTs;
  if (score > save.best) save.best = score;
  if (mode === 'endless' && save.dailySeedMode && score > save.dailySeedBest) save.dailySeedBest = score;

  updateModeRecord(world, mode, score, durMs, maxComboRun, foodsRun);
  save.weeklyProgress.scoreSum += score;
  if (!runTookHit && isVictory) save.stats.noHitWins++;

  /* بررسی استادی جهان و چالش اختصاصی */
  var mast = getWorldMastery(world);
  if (score >= 400) mast.scoreBadge = true;
  if (maxComboRun >= 5) mast.comboBadge = true;
  if (!runTookHit && (isVictory || score >= 350)) mast.noHitBadge = true;

  var chRewardTxt = '';
  if (activeChallenge && !mast.challengeDone){
    var ch = activeChallenge;
    var okScore = score >= (ch.targetScore || 0);
    var okNoHit = !ch.requireNoHit || !runTookHit;
    var okCombo = !ch.minCombo || maxComboRun >= ch.minCombo;
    if (okScore && okNoHit && okCombo){
      mast.challengeDone = true;
      save.gold += ch.rewardGold;
      save.crystals += ch.rewardCrystals;
      chRewardTxt = 'تکمیل چالش جهان! +' + faNum(ch.rewardGold) + ' سکه و +' + faNum(ch.rewardCrystals) + ' کریستال';
    }
  }

  var earnedGold = Math.round((Math.floor(score / 18) + (isVictory ? 25 : 4)) * (sk.bonusGold || 1));
  var earnedCrystals = isVictory ? 2 : (score >= 450 ? 1 : 0);
  var earnedXp = Math.max(12, Math.floor(score / 12) + (isVictory ? 35 : 0));

  save.gold += earnedGold;
  save.crystals += earnedCrystals;
  var xpRes = addXP(earnedXp);
  evaluateAchievements();

  /* اختصاص صندوق به تک‌جایگاه در صورت خالی بودن */
  var chestNotice = '';
  if (save.slot === null && (isVictory || score >= 120)){
    var cType = (isVictory && Math.random() < 0.2) ? 'gold' : ((isVictory || score >= 320) ? 'silver' : 'bronze');
    if (setSingleChest(cType)){
      chestNotice = 'صندوق ' + CHEST_TYPES[cType].name + ' دریافت شد!';
    }
  }

  if (runTrace.length > 5) lastRunTrace = runTrace.slice();
  persist();
  return { gold:earnedGold, crystals:earnedCrystals, xpRes:xpRes, chestNotice:chestNotice, chRewardTxt:chRewardTxt };
}

function endRunGameOver(){
  state = 'over';
  sfx.die();
  vibrate([60, 40, 60]);
  var r = finalizeRewards(false);
  if ($('#ovS')) $('#ovS').textContent = faNum(score);
  if ($('#ovB')) $('#ovB').textContent = faNum(save.best);
  if ($('#ovOverGold')) $('#ovOverGold').textContent = '+' + faNum(r.gold);
  if ($('#ovOverCrystals')) $('#ovOverCrystals').textContent = '+' + faNum(r.crystals);
  if ($('#btnReplayLast')) $('#btnReplayLast').style.display = lastRunTrace ? 'inline-block' : 'none';
  if (r.chRewardTxt) showToast(r.chRewardTxt);
  else if (r.xpRes.newGenes.length) showToast('ژن جدید باز شد: ' + r.xpRes.newGenes[0]);
  showOv('ovOver');
}

function endRunWin(){
  state = 'win';
  sfx.win();
  vibrate([30,40,30,40,60]);
  var r = finalizeRewards(true);
  if ($('#ovWS')) $('#ovWS').textContent = faNum(score);
  if ($('#ovWinGold')) $('#ovWinGold').textContent = '+' + faNum(r.gold);
  if ($('#ovWinCrystals')) $('#ovWinCrystals').textContent = '+' + faNum(r.crystals);
  if ($('#ovWinChestNotice')) $('#ovWinChestNotice').textContent = r.chRewardTxt || r.chestNotice || 'پیروزی ثبت شد!';
  showOv('ovWin');
}

function startReplay(spd){
  if (!lastRunTrace || !lastRunTrace.length){ showToast('بازپخشی ذخیره نشده است'); return; }
  replayTrace = lastRunTrace;
  replayIdx = 0;
  replaySpeed = spd || 1;
  isReplay = true;
  state = 'play';
  showScreen('gameScreen');
  showOv(null);
  resize();
  tickAcc = 0;
  updateHUD();
}

function cycleReplaySpeed(){
  replaySpeed = replaySpeed === 1 ? 2 : (replaySpeed === 2 ? 0.5 : 1);
  updateHUD();
}

/* کنترل‌ها: کیبورد، سوایپ لمسی و D-pad */
function queueDir(nd){
  if (state !== 'play' || isReplay) return;
  if (onIce) return; /* روی یخ تغییر جهت موقتاً سخت‌تر است تا لغزش حس شود */
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
  else if (k===' '){ e.preventDefault(); triggerDash(); }
  else if (k==='e'||k==='E'||k==='Shift'){ e.preventDefault(); triggerSkill(); }
  else if (k==='r'||k==='R'){ e.preventDefault(); triggerRewind(); }
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
    if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
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
    if (isReplay && replayTrace){
      tickAcc += dt * replaySpeed;
      var rStep = 135;
      while (tickAcc >= rStep){
        tickAcc -= rStep;
        if (replayIdx < replayTrace.length){
          var f = replayTrace[replayIdx++];
          prevSnake = snake.length ? snake : f.snake;
          snake = f.snake; dir = f.dir; items = f.items; score = f.score;
          updateHUD();
        } else {
          isReplay = false;
          state = 'menu';
          showScreen('menuScreen');
          renderMenu();
          showToast('پایان بازپخش');
          break;
        }
      }
    } else {
      if (dashTimer > 0) dashTimer = Math.max(0, dashTimer - dt);
      if (dashCd > 0) dashCd = Math.max(0, dashCd - dt);
      if (skillCd > 0) skillCd = Math.max(0, skillCd - dt);
      if (invulnT > 0) invulnT = Math.max(0, invulnT - dt);
      if (closeCallCd > 0) closeCallCd = Math.max(0, closeCallCd - dt);
      if (fogActiveMs > 0) fogActiveMs = Math.max(0, fogActiveMs - dt);
      if (sandstormMs > 0) sandstormMs = Math.max(0, sandstormMs - dt);
      if (comboTimer > 0){ comboTimer = Math.max(0, comboTimer - dt); if (comboTimer === 0) combo = 0; }
      for (var fk in fx) if (typeof fx[fk] === 'number' && fx[fk] > 0) fx[fk] = Math.max(0, fx[fk] - dt);
      for (var ti=trailCells.length-1;ti>=0;ti--){ trailCells[ti].ms -= dt; if (trailCells[ti].ms <= 0) trailCells.splice(ti,1); }
      rivals.forEach(function(r){ if (r.frozenMs > 0) r.frozenMs = Math.max(0, r.frozenMs - dt); });

      envCd -= dt;
      if (envCd <= 0){ envCd = 11000; triggerWorldEvent(); }

      if (mode === 'timeattack'){
        arenaTimeLeft -= dt;
        if (arenaTimeLeft <= 0){ arenaTimeLeft = 0; endRunWin(); }
      }

      stepBossLogic(dt);

      tickAcc += dt;
      var stepMs = currentStepMs();
      if (tickAcc >= stepMs){
        tickAcc -= stepMs;
        stepSnakeTick();
      }
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
  if ($('#chestModal') && $('#chestModal').classList.contains('show')){ $('#chestModal').classList.remove('show'); return 'handled'; }
  if ($('#settingsModal') && $('#settingsModal').classList.contains('show')){ $('#settingsModal').classList.remove('show'); return 'handled'; }
  if ($('#guideModal') && $('#guideModal').classList.contains('show')){ $('#guideModal').classList.remove('show'); return 'handled'; }
  if ($('#draftModal') && $('#draftModal').classList.contains('show')){ return 'handled'; }
  if (state === 'play'){ pauseGame(); return 'handled'; }
  if (state === 'paused'){ state = 'menu'; stopMusic(); showScreen('menuScreen'); renderMenu(); return 'handled'; }
  if (state === 'over' || state === 'win'){ state = 'menu'; stopMusic(); showScreen('menuScreen'); renderMenu(); return 'handled'; }
  return 'exit';
};

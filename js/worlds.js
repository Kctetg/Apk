'use strict';
var COLS = 19, ROWS = 19;
var DIRS = { up:{x:0,y:-1}, down:{x:0,y:1}, left:{x:-1,y:0}, right:{x:1,y:0} };
var OPPO = { up:'down', down:'up', left:'right', right:'left' };

/* محیط اصلی: جنگل پیکسلی (سایر جهان‌ها فعلاً غیرفعال برای تمرکز کامل گیم‌پلی) */
var WORLDS_ORDER = ['forest'];
var WORLDS = {
  forest: {
    id: 'forest',
    arenaNum: 1,
    lvRange: 'جنگل پیکسلی',
    name: 'جنگل پیکسلی',
    subtitle: 'هزارتوی آرام جنگلی، کشف مسیرهای مخفی و دروازه سبز',
    bg: '#0c1f16',
    bg2: '#10261b',
    wall: '#2f6346',
    wallHi: '#54a36f',
    accent: '#46f88f',
    bossKey: 1,
    bossName: 'اژدهای آبی جنگل',
    speedMult: 1.0,
    hazards: ['دیوارهای سنگی جنگل'],
    specialItem: 'کلید زرد و کریستال مخفی',
    eventDesc: 'مسیرهای خزه‌ای مخفی',
    challenge: { title: 'عبور بی‌خطا', targetScore: 300, requireNoHit: true, rewardGold: 40, rewardCrystals: 2 }
  }
};

function getWorldObj(){
  return WORLDS.forest;
}

function keyOf(x, y){ return x + ',' + y; }

function validateReachable(wallsArr, startX, startY, targets){
  var blocked = {};
  for (var i=0;i<wallsArr.length;i++) blocked[keyOf(wallsArr[i].x, wallsArr[i].y)] = true;
  if (blocked[keyOf(startX, startY)]) return false;
  var vis = {};
  var q = [{x:startX, y:startY}];
  vis[keyOf(startX, startY)] = true;
  var count = 0;
  var dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  while (q.length){
    var cur = q.shift();
    count++;
    for (var d=0;d<4;d++){
      var nx = cur.x + dirs[d][0];
      var ny = cur.y + dirs[d][1];
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
      var k = keyOf(nx, ny);
      if (!blocked[k] && !vis[k]){
        vis[k] = true;
        q.push({x:nx, y:ny});
      }
    }
  }
  var totalFree = COLS * ROWS - wallsArr.length;
  if (count < totalFree * 0.80) return false;
  if (targets){
    for (var t=0;t<targets.length;t++){
      if (!vis[keyOf(targets[t].x, targets[t].y)]) return false;
    }
  }
  return true;
}

/* تولید مراحل جنگل پیکسلی با پیشرفت واضح:
   مراحل ۱ تا ۳ آموزش گام‌به‌گام،
   از مرحله ۴ مسیرهای مخفی و کلید فشاری،
   هر ۵ مرحله یک مرحله ویژه (۵، ۱۵: هزارتوی مخفی با نگهبان؛ ۱۰، ۲۰: باس ساده جنگل) */
function generateForestStage(stageNum){
  stageNum = Math.max(1, Number(stageNum || 1));
  var rand = mulberry32(stageNum * 4099 + 17);
  var isSpecial = (stageNum % 5 === 0);
  var isBossStage = (stageNum % 10 === 0);
  var isGuardianMaze = (stageNum % 10 === 5);

  var st = {
    stageNum: stageNum,
    title: 'مرحله ' + faNum(stageNum),
    isSpecial: isSpecial,
    specialKind: isBossStage ? 'boss' : (isGuardianMaze ? 'secret_maze' : 'normal'),
    goalText: '',
    tutorialHint: '',
    applesGoal: 5,
    needKey: false,
    hasBoss: isBossStage,
    bossHp: isBossStage ? Math.min(5, 2 + Math.floor(stageNum / 10)) : 0,
    hasGuardian: false,
    walls: [],
    secretWalls: [],
    switches: [],
    secretItems: [],
    secretReserved: {},
    keyPos: null,
    doorPos: { x: 17, y: 9 },
    appleCountOnBoard: 1
  };

  var used = {};
  for (var sx=1; sx<=6; sx++) for (var sy=7; sy<=11; sy++) used[keyOf(sx, sy)] = true;
  used[keyOf(st.doorPos.x, st.doorPos.y)] = true;
  used[keyOf(st.doorPos.x - 1, st.doorPos.y)] = true;

  function addWall(x, y){
    var k = keyOf(x, y);
    if (used[k] || x < 1 || x >= COLS - 1 || y < 1 || y >= ROWS - 1) return false;
    used[k] = true;
    st.walls.push({ x:x, y:y });
    return true;
  }

  /* مرحله ۱: آموزش حرکت و خوردن سیب قرمز */
  if (stageNum === 1){
    st.title = 'مرحله ۱: نخستین شکار';
    st.applesGoal = 5;
    st.goalText = '۵ سیب قرمز بخور و به در سبز برو';
    st.tutorialHint = 'برای حرکت، صفحه را به جهت دلخواه بکش.';
    return st;
  }

  /* مرحله ۲: آموزش دیوارهای سنگی جنگل */
  if (stageNum === 2){
    st.title = 'مرحله ۲: دیوارهای جنگل';
    st.applesGoal = 6;
    st.goalText = '۶ سیب قرمز بخور و به در سبز برو';
    st.tutorialHint = 'به دیوارهای سنگی و بدن خودت برخورد نکنی!';
    var w2 = [[6,4],[6,5],[6,6],[12,4],[12,5],[12,6],[6,12],[6,13],[6,14],[12,12],[12,13],[12,14]];
    w2.forEach(function(p){ addWall(p[0], p[1]); });
    return st;
  }

  /* مرحله ۳: آموزش کلید زرد و در سبز */
  if (stageNum === 3){
    st.title = 'مرحله ۳: کلید دروازه';
    st.applesGoal = 3;
    st.needKey = true;
    st.keyPos = { x: 15, y: 3 };
    used[keyOf(15, 3)] = true;
    st.goalText = '۳ سیب و کلید زرد را بردار، سپس به در سبز برو';
    st.tutorialHint = 'کلید زرد را پیدا کن تا در سبز باز شود.';
    var w3 = [[9,2],[9,3],[9,4],[9,5],[9,6],[9,12],[9,13],[9,14],[9,15],[9,16],[13,7],[13,8],[13,10],[13,11]];
    w3.forEach(function(p){ addWall(p[0], p[1]); });
    return st;
  }

  /* مرحله ۴: اولین اتاقک مخفی با کلید فشاری */
  if (stageNum === 4){
    st.title = 'مرحله ۴: راز خزه‌ها';
    st.applesGoal = 4;
    st.needKey = true;
    st.keyPos = { x: 15, y: 15 };
    used[keyOf(15, 15)] = true;
    st.goalText = 'کلید زرد و ۴ سیب را بردار (مسیر مخفی را کشف کن!)';
    /* اتاقک مخفی بالا-چپ (خانه ۱..۲، ۱..۲) */
    [[3,1],[3,3],[1,3],[2,3]].forEach(function(p){ addWall(p[0], p[1]); });
    st.secretWalls.push({ x:3, y:2 });
    used[keyOf(3, 2)] = true;
    for (var rx=1; rx<=2; rx++) for (var ry=1; ry<=2; ry++){
      st.secretReserved[keyOf(rx, ry)] = true;
      used[keyOf(rx, ry)] = true;
    }
    st.secretItems.push({ x:1, y:1, type:'crystal' });
    st.secretItems.push({ x:2, y:2, type:'gold' });
    st.switches.push({ x:10, y:15, order:1, active:false });
    used[keyOf(10, 15)] = true;
    [[8,3],[8,4],[8,5],[8,6],[8,12],[8,13],[8,14],[13,5],[13,6],[13,12],[13,13]].forEach(function(p){ addWall(p[0], p[1]); });
    return st;
  }

  /* مرحله ویژه باس (۱۰، ۲۰، ۳۰...) */
  if (isBossStage){
    st.title = 'مرحله ویژه ' + faNum(stageNum) + ': نبرد باس جنگل';
    st.applesGoal = 0;
    st.needKey = false;
    st.goalText = 'با گوی‌های آتشین به اژدها ضربه بزن (' + faNum(st.bossHp) + ' ضربه)';
    [[4,4],[5,4],[4,5],[14,4],[13,4],[14,5],[4,14],[5,14],[4,13],[14,14],[13,14],[14,13]].forEach(function(p){ addWall(p[0], p[1]); });
    return st;
  }

  /* هزارتوی ویژه با نگهبان و مسیر مخفی (۵، ۱۵، ۲۵...) یا مراحل عادی ۶ به بعد */
  st.applesGoal = Math.min(9, 4 + Math.floor(stageNum / 3));
  st.needKey = true;
  st.hasGuardian = isGuardianMaze || (stageNum >= 8 && stageNum % 2 === 0);

  if (isGuardianMaze){
    st.title = 'مرحله ویژه ' + faNum(stageNum) + ': هزارتوی نگهبان';
    st.goalText = 'از نگهبان دوری کن، کلید زرد را بردار و به در سبز برو';
  } else {
    st.title = 'مرحله ' + faNum(stageNum) + ': هزارتوی جنگل';
    st.goalText = faNum(st.applesGoal) + ' سیب و کلید زرد را بردار تا در سبز باز شود';
  }

  /* اتاقک مخفی قابل باز شدن در تمام مراحل ۶+ و ۵+ */
  if (stageNum >= 5){
    var pocketTop = (stageNum % 2 === 1);
    var pyBase = pocketTop ? 1 : 16;
    var wallYEdge = pocketTop ? 3 : 15;
    var secretDoorY = pocketTop ? 2 : 16;
    [[3,wallYEdge],[1,wallYEdge],[2,wallYEdge],[3, pocketTop?1:17]].forEach(function(p){ addWall(p[0], p[1]); });
    st.secretWalls.push({ x:3, y:secretDoorY });
    used[keyOf(3, secretDoorY)] = true;
    for (var srx=1; srx<=2; srx++){
      for (var sry=pyBase; sry<=pyBase+1; sry++){
        st.secretReserved[keyOf(srx, sry)] = true;
        used[keyOf(srx, sry)] = true;
      }
    }
    st.secretItems.push({ x:1, y:pocketTop?1:17, type:'crystal' });
    st.secretItems.push({ x:2, y:pocketTop?2:16, type:'gold' });

    /* کلید فشاری معما در سمت مقابل زمین */
    var swX = 8 + Math.floor(rand() * 5);
    var swY = pocketTop ? 15 : 3;
    st.switches.push({ x:swX, y:swY, order:1, active:false });
    used[keyOf(swX, swY)] = true;
  }

  /* مکان کلید زرد */
  var kx = 14 + Math.floor(rand() * 3);
  var ky = (stageNum % 2 === 0) ? 15 : 3;
  st.keyPos = { x:kx, y:ky };
  used[keyOf(kx, ky)] = true;

  /* ساخت دیوارهای هزارتوی تضمینی باز با بررسی BFS */
  var wallBudget = Math.min(26, 10 + stageNum);
  var tries = 0;
  var targets = [st.doorPos, st.keyPos];
  while (st.walls.length < wallBudget && tries < 180){
    tries++;
    var wx = 2 + Math.floor(rand() * (COLS - 4));
    var wy = 1 + Math.floor(rand() * (ROWS - 2));
    var k = keyOf(wx, wy);
    if (used[k]) continue;
    /* نگه داشتن فاصله امن اطراف کلید و دروازه */
    if (Math.abs(wx - st.doorPos.x) + Math.abs(wy - st.doorPos.y) <= 1) continue;
    if (Math.abs(wx - kx) + Math.abs(wy - ky) <= 1) continue;
    st.walls.push({ x:wx, y:wy });
    if (validateReachable(st.walls.concat(st.secretWalls), 4, 9, targets)){
      used[k] = true;
    } else {
      st.walls.pop();
    }
  }

  return st;
}

/* توابع سازگاری عقب‌رو برای تست‌ها یا فراخوانی‌های قدیمی */
function generateWorldLayout(worldId, stageNum, rand){
  var st = generateForestStage(stageNum || 1);
  return {
    walls: st.walls,
    dWalls: [],
    secretWalls: st.secretWalls,
    switches: st.switches,
    hotTiles: [],
    iceTiles: [],
    sandTiles: [],
    crumbleTiles: [],
    portals: []
  };
}

function generateSecretRoom(rand){
  rand = rand || Math.random;
  var kinds = ['treasure', 'guardian', 'vault', 'shrine', 'merchant', 'secret_boss'];
  var kind = kinds[Math.min(kinds.length - 1, Math.floor(rand() * kinds.length))];
  return {
    kind: kind,
    walls: [{x:3,y:3},{x:15,y:3},{x:3,y:15},{x:15,y:15}],
    dWalls: [],
    items: [{x:9,y:9,type:'crystal'},{x:8,y:7,type:'gold'},{x:10,y:7,type:'apple'}],
    exit: { x: 16, y: 9 },
    timerMs: 0,
    enemy: null,
    bossKey: 0
  };
}

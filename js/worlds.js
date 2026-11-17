'use strict';
var COLS = 19, ROWS = 19;
var DIRS = { up:{x:0,y:-1}, down:{x:0,y:1}, left:{x:-1,y:0}, right:{x:1,y:0} };
var OPPO = { up:'down', down:'up', left:'right', right:'left' };

var WORLDS_ORDER = ['forest', 'lava', 'ice', 'shadow', 'desert', 'digital'];

var WORLDS = {
  forest: {
    id: 'forest',
    arenaNum: 1,
    lvRange: 'سطح ۱ تا ۴',
    name: 'جنگل سبز',
    subtitle: 'آغاز ماجراجویی با موانع سنگی و میوه‌های نئونی',
    bg: '#0c1f17',
    bg2: '#112a20',
    wall: '#3b6e52',
    wallHi: '#68c962',
    accent: '#46f88f',
    bossKey: 1,
    bossName: 'اژدهای آبی جنگل',
    speedMult: 1.0,
    hazards: ['سنگ‌های جنگلی', 'تله‌های بمب و اسید'],
    specialItem: 'گوی سبز (امتیاز ×۲)',
    eventDesc: 'شکوفه بارانی: رگبار سیب و سرعت لحظه‌ای',
    challenge: { title: 'چالش جنگل: ۴۵۰ امتیاز بدون آسیب', targetScore: 450, requireNoHit: true, rewardGold: 60, rewardCrystals: 3 }
  },
  lava: {
    id: 'lava',
    arenaNum: 2,
    lvRange: 'سطح ۵ تا ۸',
    name: 'غار مذاب',
    subtitle: 'کاشی‌های گداخته و شهاب‌سنگ‌های آتشین',
    bg: '#230c0a',
    bg2: '#2e110d',
    wall: '#8c2d19',
    wallHi: '#f97316',
    accent: '#ff6b2b',
    bossKey: 2,
    bossName: 'اژدهای آتشین غار',
    speedMult: 0.94,
    hazards: ['کاشی‌های مذاب سوزان', 'ریزش شهاب‌سنگ'],
    specialItem: 'گلوله آتشین تقویتی',
    eventDesc: 'فوران آتشفشان: شکاف‌های مذاب موقت روی نقشه',
    challenge: { title: 'چالش مذاب: ۶۰۰ امتیاز و کمبوی ×۶', targetScore: 600, minCombo: 6, rewardGold: 80, rewardCrystals: 4 }
  },
  ice: {
    id: 'ice',
    arenaNum: 3,
    lvRange: 'سطح ۹ تا ۱۲',
    name: 'قلمرو یخ',
    subtitle: 'مسیرهای لغزنده پرسرعت و پل‌های شکننده',
    bg: '#091b2c',
    bg2: '#0f253b',
    wall: '#2c699a',
    wallHi: '#7dd3fc',
    accent: '#38bdf8',
    bossKey: 1,
    bossName: 'اژدهای یخی قطب',
    speedMult: 0.92,
    hazards: ['کاشی یخی پرشتاب', 'یخ‌های سست شکننده'],
    specialItem: 'حلزون کنترل سرعت',
    eventDesc: 'بوران یخ: افزایش لغزندگی و اسپاون کریستال',
    challenge: { title: 'چالش یخ: ۵۵۰ امتیاز بدون برخورد', targetScore: 550, requireNoHit: true, rewardGold: 85, rewardCrystals: 4 }
  },
  shadow: {
    id: 'shadow',
    arenaNum: 4,
    lvRange: 'سطح ۱۳ تا ۱۶',
    name: 'جهان سایه',
    subtitle: 'مه تاریک هزارتو با نور مار و همزاد سایه',
    bg: '#110a21',
    bg2: '#170f2e',
    wall: '#4c2882',
    wallHi: '#c084fc',
    accent: '#a855f7',
    bossKey: 3,
    bossName: 'اژدهای برقی سایه',
    speedMult: 0.90,
    hazards: ['مه هزارتو و دید محدود', 'مار همزاد تعقیب‌گر'],
    specialItem: 'روح عبور از دیوار',
    eventDesc: 'کسوف سایه: تاریکی کوتاه با امتیاز دو برابر',
    challenge: { title: 'چالش سایه: ۷۰۰ امتیاز در تاریکی', targetScore: 700, minCombo: 5, rewardGold: 100, rewardCrystals: 5 }
  },
  desert: {
    id: 'desert',
    arenaNum: 5,
    lvRange: 'سطح ۱۷ تا ۲۰',
    name: 'بیابان طلایی',
    subtitle: 'شن‌های روان کُندکننده و توفان شن دوره‌ای',
    bg: '#241a08',
    bg2: '#2e220c',
    wall: '#a16207',
    wallHi: '#fbbf24',
    accent: '#ffd43b',
    bossKey: 2,
    bossName: 'اژدهای طوفان شن',
    speedMult: 0.93,
    hazards: ['باتلاق شن روان کُندکننده', 'توفان شن کاهش‌دهنده دید'],
    specialItem: 'ساعت و سکه طلایی واحه',
    eventDesc: 'توفان شن: ظاهر شدن واحه پر از طلا',
    challenge: { title: 'چالش بیابان: ۶۵۰ امتیاز بدون آسیب', targetScore: 650, requireNoHit: true, rewardGold: 95, rewardCrystals: 5 }
  },
  digital: {
    id: 'digital',
    arenaNum: 6,
    lvRange: 'سطح ۲۱ به بالا',
    name: 'دژ دیجیتال',
    subtitle: 'پورتال‌های انتقال دوقلو و بلوک‌های تخریب‌پذیر',
    bg: '#07141f',
    bg2: '#0b1d2c',
    wall: '#0e7490',
    wallHi: '#22d3ee',
    accent: '#22d3ee',
    bossKey: 4,
    bossName: 'غول سنگی ماتریکس',
    speedMult: 0.88,
    hazards: ['دیوارهای تخریب‌پذیر متراکم', 'تغییر گلیچ نقشه'],
    specialItem: 'پورتال جفتی و کریستال داده',
    eventDesc: 'گلیچ سیستم: جابه‌جایی بلوک‌ها و پورتال جدید',
    challenge: { title: 'چالش دیجیتال: ۸۰۰ امتیاز با پورتال', targetScore: 800, minCombo: 7, rewardGold: 120, rewardCrystals: 6 }
  }
};

function getWorldObj(id){
  return WORLDS[id] || WORLDS.forest;
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
      var nx = (cur.x + dirs[d][0] + COLS) % COLS;
      var ny = (cur.y + dirs[d][1] + ROWS) % ROWS;
      var k = keyOf(nx, ny);
      if (!blocked[k] && !vis[k]){
        vis[k] = true;
        q.push({x:nx, y:ny});
      }
    }
  }
  var totalFree = COLS * ROWS - wallsArr.length;
  if (count < totalFree * 0.85) return false;
  if (targets){
    for (var t=0;t<targets.length;t++){
      if (!vis[keyOf(targets[t].x, targets[t].y)]) return false;
    }
  }
  return true;
}

/* ساخت چیدمان تضمینی بدون بن‌بست برای هر جهان */
function generateWorldLayout(worldId, stageNum, rand){
  rand = rand || Math.random;
  var layout = {
    walls: [],
    dWalls: [],
    secretWalls: [],
    switches: [],
    hotTiles: [],
    iceTiles: [],
    sandTiles: [],
    crumbleTiles: [],
    portals: []
  };
  var used = {};
  function reserveSpawnZone(){
    for (var x=1;x<=7;x++) for (var y=7;y<=11;y++) used[keyOf(x,y)] = true;
  }
  reserveSpawnZone();

  function canPlace(x, y){
    if (x < 1 || x > COLS - 2 || y < 1 || y > ROWS - 2) return false;
    return !used[keyOf(x, y)];
  }

  /* دیوارهای صلب با بررسی BFS */
  var wallBudget = Math.min(18, 4 + Math.floor((stageNum || 1) * 1.5));
  if (worldId === 'forest') wallBudget = Math.min(12, 3 + stageNum);
  var attempts = 0;
  while (layout.walls.length < wallBudget && attempts < 140){
    attempts++;
    var wx = 1 + Math.floor(rand() * (COLS - 2));
    var wy = 1 + Math.floor(rand() * (ROWS - 2));
    if (!canPlace(wx, wy)) continue;
    var cand = { x: wx, y: wy };
    layout.walls.push(cand);
    if (validateReachable(layout.walls, 4, 9)){
      used[keyOf(wx, wy)] = true;
    } else {
      layout.walls.pop();
    }
  }

  /* دیوارهای تخریب‌پذیر (با دش می‌شکنند!) */
  var dwCount = (worldId === 'digital') ? 9 : (worldId === 'lava' ? 6 : 4);
  for (var di=0; di<dwCount*4 && layout.dWalls.length<dwCount; di++){
    var dx = 2 + Math.floor(rand() * (COLS - 4));
    var dy = 2 + Math.floor(rand() * (ROWS - 4));
    if (!canPlace(dx, dy)) continue;
    used[keyOf(dx, dy)] = true;
    layout.dWalls.push({ x:dx, y:dy, hp:2, maxHp:2 });
  }

  /* ویژگی خاص هر جهان */
  if (worldId === 'lava'){
    var hc = 10 + Math.min(8, stageNum);
    for (var hi=0; hi<hc*4 && layout.hotTiles.length<hc; hi++){
      var hx = 1 + Math.floor(rand() * (COLS - 2));
      var hy = 1 + Math.floor(rand() * (ROWS - 2));
      if (!canPlace(hx, hy)) continue;
      used[keyOf(hx, hy)] = true;
      layout.hotTiles.push({ x:hx, y:hy });
    }
  }
  if (worldId === 'ice'){
    var ic = 14 + Math.min(10, stageNum);
    for (var ii=0; ii<ic*4 && layout.iceTiles.length<ic; ii++){
      var ix = 1 + Math.floor(rand() * (COLS - 2));
      var iy = 1 + Math.floor(rand() * (ROWS - 2));
      if (!canPlace(ix, iy)) continue;
      used[keyOf(ix, iy)] = true;
      layout.iceTiles.push({ x:ix, y:iy });
    }
    for (var ci=0; ci<12 && layout.crumbleTiles.length<4; ci++){
      var cx = 2 + Math.floor(rand() * (COLS - 4));
      var cy = 2 + Math.floor(rand() * (ROWS - 4));
      if (!canPlace(cx, cy)) continue;
      used[keyOf(cx, cy)] = true;
      layout.crumbleTiles.push({ x:cx, y:cy, step:0 });
    }
  }
  if (worldId === 'desert'){
    var sc = 12 + Math.min(8, stageNum);
    for (var si=0; si<sc*4 && layout.sandTiles.length<sc; si++){
      var sx = 1 + Math.floor(rand() * (COLS - 2));
      var sy = 1 + Math.floor(rand() * (ROWS - 2));
      if (!canPlace(sx, sy)) continue;
      used[keyOf(sx, sy)] = true;
      layout.sandTiles.push({ x:sx, y:sy });
    }
  }
  if (worldId === 'digital' || stageNum >= 2){
    var pairCount = (worldId === 'digital') ? 2 : 1;
    for (var pi=0; pi<pairCount; pi++){
      var p1 = null, p2 = null, tries = 0;
      while ((!p1 || !p2) && tries < 60){
        tries++;
        var px = 2 + Math.floor(rand() * (COLS - 4));
        var py = 2 + Math.floor(rand() * (ROWS - 4));
        if (!canPlace(px, py)) continue;
        if (!p1){ p1 = {x:px, y:py}; used[keyOf(px, py)] = true; }
        else if (Math.abs(px-p1.x)+Math.abs(py-p1.y) >= 6){ p2 = {x:px, y:py}; used[keyOf(px, py)] = true; }
      }
      if (p1 && p2){
        layout.portals.push({ x:p1.x, y:p1.y, tx:p2.x, ty:p2.y, color: pi===0?'a':'b', cd:0 });
        layout.portals.push({ x:p2.x, y:p2.y, tx:p1.x, ty:p1.y, color: pi===0?'a':'b', cd:0 });
      }
    }
  }

  /* دیوارهای مخفی شکننده با دش (شبیه دیوار عادی ولی دارای درخشش خفیف) */
  for (var swi=0; swi<10 && layout.secretWalls.length<2; swi++){
    var swx = 2 + Math.floor(rand() * (COLS - 4));
    var swy = 2 + Math.floor(rand() * (ROWS - 4));
    if (!canPlace(swx, swy)) continue;
    used[keyOf(swx, swy)] = true;
    layout.secretWalls.push({ x:swx, y:swy, reward: swi === 0 ? 'crystal' : 'map_piece' });
  }

  /* معمای محیطی کلیدهای زمینی به ترتیب (۱ -> ۲) برای پاداش گنج */
  for (var pzi=0; pzi<20 && layout.switches.length<2; pzi++){
    var pzx = 2 + Math.floor(rand() * (COLS - 4));
    var pzy = 2 + Math.floor(rand() * (ROWS - 4));
    if (!canPlace(pzx, pzy)) continue;
    used[keyOf(pzx, pzy)] = true;
    layout.switches.push({ x:pzx, y:pzy, order:layout.switches.length + 1, active:false });
  }

  layout.secretEntrance = null;
  if (rand() < 0.7){
    for (var sei=0; sei<40; sei++){
      var sx2 = 2 + Math.floor(rand() * (COLS - 4));
      var sy2 = 2 + Math.floor(rand() * (ROWS - 4));
      if (canPlace(sx2, sy2)){
        used[keyOf(sx2, sy2)] = true;
        layout.secretEntrance = { x:sx2, y:sy2 };
        break;
      }
    }
  }

  return layout;
}

/* تولید ۶ نوع اتاق مخفی (گنج، نگهبان، خزانه ۱۵ث، محراب رلیک، فروشگاه، باس مخفی) */
function generateSecretRoom(rand){
  rand = rand || Math.random;
  var kinds = ['treasure', 'guardian', 'vault', 'shrine', 'merchant', 'secret_boss'];
  var kind = kinds[Math.min(kinds.length - 1, Math.floor(rand() * kinds.length))];
  var sr = {
    kind: kind,
    walls: [],
    dWalls: [],
    items: [],
    exit: { x: 16, y: 9 },
    timerMs: kind === 'vault' ? 15000 : 0,
    enemy: kind === 'guardian' ? { type:'guardian', x:14, y:5 } : null,
    bossKey: kind === 'secret_boss' ? 3 : 0
  };

  for (var x=3; x<=15; x++){
    if (x !== 9){
      sr.walls.push({x:x, y:3});
      sr.walls.push({x:x, y:15});
    }
  }
  if (kind === 'treasure'){
    sr.items.push({x:9, y:9, type:'relic_orb'});
    sr.items.push({x:8, y:7, type:'gold'});
    sr.items.push({x:10, y:7, type:'gold'});
    sr.items.push({x:9, y:11, type:'crystal'});
    sr.items.push({x:12, y:9, type:'map_piece'});
  } else if (kind === 'guardian'){
    sr.items.push({x:11, y:9, type:'relic_orb'});
    sr.items.push({x:10, y:6, type:'crystal'});
    sr.items.push({x:10, y:12, type:'gold'});
    sr.items.push({x:7, y:9, type:'apple'});
  } else if (kind === 'vault'){
    sr.dWalls.push({x:8, y:9, hp:1, maxHp:1});
    sr.dWalls.push({x:11, y:7, hp:1, maxHp:1});
    sr.dWalls.push({x:11, y:11, hp:1, maxHp:1});
    sr.items.push({x:10, y:9, type:'gold'});
    sr.items.push({x:12, y:6, type:'gold'});
    sr.items.push({x:12, y:12, type:'gold'});
    sr.items.push({x:13, y:9, type:'crystal'});
    sr.items.push({x:9, y:5, type:'relic_orb'});
  } else if (kind === 'shrine'){
    sr.items.push({x:9, y:9, type:'relic_orb'});
    sr.items.push({x:11, y:7, type:'heart'});
    sr.items.push({x:11, y:11, type:'map_piece'});
  } else if (kind === 'merchant'){
    sr.items.push({x:9, y:7, type:'shop_heart'});
    sr.items.push({x:11, y:9, type:'shop_shield'});
    sr.items.push({x:9, y:11, type:'shop_relic'});
  } else {
    sr.items.push({x:7, y:7, type:'fireball'});
    sr.items.push({x:7, y:11, type:'superfire'});
    sr.items.push({x:10, y:9, type:'crystal'});
  }
  return sr;
}

'use strict';
/* ═══════════════ حالت‌های ۵گانه بازی + رکورد هر جهان و مرحله‌های معمایی-سرعتی ═══════════════ */
var GAME_MODES = [
  { id:'endless',    name:'رکوردزنی',  ico:'trophy',     hint:'سرعت افزایشی، خطرات و رقابت بی‌پایان' },
  { id:'timeattack', name:'حمله زمانی',ico:'timer',      hint:'۶۰ یا ۱۲۰ ثانیه برای ساخت بیشترین کمبو' },
  { id:'levelrush',  name:'مرحله‌ای',   ico:'key',        hint:'مراحل کوتاه + معما و کلید تا باس جهان' },
  { id:'bossrush',   name:'نبرد باس',   ico:'fireball',   hint:'جنگ پشت‌سرهم با ۴ باس ۳ فازه پیکسلی' },
  { id:'dungeon',    name:'سیاهچال',   ico:'chest_gold', hint:'اتاق‌های تصادفی با انتخاب قدرت روگ‌لایک' }
];

function getModeObj(id){
  for (var i=0;i<GAME_MODES.length;i++) if (GAME_MODES[i].id===id) return GAME_MODES[i];
  return GAME_MODES[0];
}

function getRecordKey(worldId, modeId){
  return (worldId || 'forest') + '_' + (modeId || 'endless');
}

function getModeRecord(worldId, modeId){
  var k = getRecordKey(worldId, modeId);
  return save.worldRecords[k] || { bestScore:0, bestTimeMs:0, maxCombo:0, totalFoods:0 };
}

function updateModeRecord(worldId, modeId, runScore, durationMs, maxComboRun, foodsRun){
  var k = getRecordKey(worldId, modeId);
  var prev = save.worldRecords[k] || { bestScore:0, bestTimeMs:0, maxCombo:0, totalFoods:0 };
  var isNewBest = runScore > prev.bestScore;
  if (isNewBest) prev.bestScore = runScore;
  if (durationMs > 0 && (prev.bestTimeMs === 0 || (modeId === 'levelrush' ? durationMs < prev.bestTimeMs : durationMs > prev.bestTimeMs))){
    prev.bestTimeMs = durationMs;
  }
  if (maxComboRun > prev.maxCombo) prev.maxCombo = maxComboRun;
  prev.totalFoods += foodsRun;
  save.worldRecords[k] = prev;
  return isNewBest;
}

/* مراحل تلفیقی Level Rush (اهداف کوتاه، پازل کلید و دیوار، و باس آخر جهان) */
var LEVEL_RUSH_STAGES = [
  {
    type: 'goal',
    title: 'مرحله ۱: شکار سریع',
    goalApples: 7,
    walls: [[6,5],[6,6],[12,12],[12,13]],
    dWalls: [[9,6],[9,12]],
    keys: [],
    enemies: ['rival']
  },
  {
    type: 'puzzle',
    title: 'مرحله ۲: معمای کلید سنگی',
    goalApples: 4,
    walls: [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,13],[8,14],[8,15],[8,16],[8,17],[8,18]],
    dWalls: [[8,7],[8,11]],
    keys: [[3,3],[15,15],[15,3]],
    crumble: [[8,8],[8,9],[8,10]],
    door: [17,9],
    enemies: []
  },
  {
    type: 'goal',
    title: 'مرحله ۳: شکارچی و پورتال',
    goalApples: 9,
    walls: [[5,5],[6,5],[12,5],[13,5],[5,13],[6,13],[12,13],[13,13]],
    dWalls: [[9,5],[9,13]],
    keys: [],
    portals: [[3,9,15,9]],
    enemies: ['hunter','rival']
  },
  {
    type: 'puzzle',
    title: 'مرحله ۴: تالار نگهبان',
    goalApples: 5,
    walls: [[4,3],[4,4],[4,5],[4,6],[4,12],[4,13],[4,14],[4,15],[14,3],[14,4],[14,5],[14,6],[14,12],[14,13],[14,14],[14,15]],
    dWalls: [[4,9],[14,9]],
    keys: [[2,2],[9,2],[9,16],[16,16]],
    crumble: [[9,8],[9,10]],
    door: [17,2],
    enemies: ['guardian']
  },
  {
    type: 'boss',
    title: 'مرحله نهایی: نگهبان جهان',
    goalApples: 0,
    walls: [[6,4],[6,14]],
    dWalls: [[8,8],[8,10]],
    keys: [],
    enemies: []
  }
];

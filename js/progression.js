'use strict';
/* ═══════════════ صندوق‌ها، پیشرفت گیم‌پلی، ژن‌ها و مأموریت‌ها ═══════════════ */
var CHEST_TYPES = {
  bronze: { id:'bronze', name:'صندوق برنزی', ico:'chest_bronze', unlockSec:300,  crystalSkip:2, shopGold:85,  shopCrystals:0,  gold:[14,24],  crystals:[0,1], xp:22 },
  silver: { id:'silver', name:'صندوق نقره‌ای', ico:'chest_silver', unlockSec:600,  crystalSkip:5, shopGold:190, shopCrystals:0,  gold:[30,50],  crystals:[2,3], xp:45 },
  gold:   { id:'gold',   name:'صندوق طلایی', ico:'chest_gold',   unlockSec:1200, crystalSkip:9, shopGold:0,   shopCrystals:12, gold:[70,115], crystals:[4,7], xp:90 }
};

var DAILY_REWARDS = [
  { day:1, gold:20, crystals:0, chest:null,     label:'۲۰ سکه' },
  { day:2, gold:25, crystals:1, chest:null,     label:'۲۵ سکه + ۱ کریستال' },
  { day:3, gold:20, crystals:1, chest:'bronze', label:'صندوق برنزی' },
  { day:4, gold:35, crystals:2, chest:null,     label:'۳۵ سکه + ۲ کریستال' },
  { day:5, gold:25, crystals:2, chest:'silver', label:'صندوق نقره‌ای' },
  { day:6, gold:50, crystals:3, chest:null,     label:'۵۰ سکه + ۳ کریستال' },
  { day:7, gold:75, crystals:5, chest:'gold',   label:'صندوق طلایی' }
];

/* ژن‌ها از طریق مهارت، لِوِل و شکست باس باز می‌شوند (بدون Pay-to-Win!) */
var GENES = [
  { id:'fire',     name:'ژن آتشین',   ico:'fireball',  rarity:'common', unlockText:'باز از ابتدا',         needLv:1, needBoss:0, desc:'ردپای شعله‌ور برای آسیب به رقبا و شکستن یخ', color:'#ff6b2b' },
  { id:'frost',    name:'ژن یخی',     ico:'slow',      rarity:'common', unlockText:'لِوِل ۲',              needLv:2, needBoss:0, desc:'موج یخی کندکننده دشمنان و پرتابه‌ها',        color:'#38bdf8' },
  { id:'electric', name:'ژن برقی',    ico:'lightning', rarity:'rare',   unlockText:'لِوِل ۳',              needLv:3, needBoss:0, desc:'موج شوک الکتریکی + تخریب دیوار ضعیف',      color:'#fde047' },
  { id:'magnet',   name:'ژن مغناطیس', ico:'magnet',    rarity:'rare',   unlockText:'لِوِل ۴',              needLv:4, needBoss:0, desc:'جذب سریع غذا، سکه و کریستال‌های اطراف',     color:'#60a5fa' },
  { id:'armor',    name:'ژن زرهی',    ico:'shield',    rarity:'epic',   unlockText:'۱ پیروزی باس یا لول ۵', needLv:5, needBoss:1, desc:'سپر اضطراری محافظ هنگام برخورد',           color:'#cbd5e1' },
  { id:'toxic',    name:'ژن سمی',     ico:'acid',      rarity:'epic',   unlockText:'۲ پیروزی باس یا لول ۶', needLv:6, needBoss:2, desc:'ابر سمی آسیب‌زننده به مارهای دشمن',          color:'#a3e635' },
  { id:'ghost',    name:'ژن روحی',    ico:'ghost',     rarity:'epic',   unlockText:'۳ پیروزی باس یا لول ۷', needLv:7, needBoss:3, desc:'عبور موقت از دیوارها و موانع',               color:'#93c5fd' },
  { id:'shadow',   name:'ژن سایه',    ico:'acc_ninja', rarity:'legend', unlockText:'۵ پیروزی باس یا لول ۹', needLv:9, needBoss:5, desc:'موج سایه و امتیاز کمبوی دو برابر',           color:'#c084fc' }
];

var FUSIONS = {
  'electric+fire':   { name:'طوفان پلاسما', desc:'ردپای آتشین + شوک الکتریکی و تخریب دیوار' },
  'fire+frost':      { name:'انفجار بخار',  desc:'آتش و یخ همزمان + کندی شدید دشمنان' },
  'fire+toxic':      { name:'باران مذاب',   desc:'منطقه سمی شعله‌ور طولانی' },
  'electric+magnet': { name:'میدان مغناطیس',desc:'جذب خودکار وسیع + موج شوک' },
  'frost+ghost':     { name:'شبح یخ‌زده',  desc:'عبور از دیوار و انجماد رقبا' },
  'magnet+toxic':    { name:'جذب سمی',     desc:'جذب غنیمت + ابر سمی محافظ' },
  'armor+shadow':    { name:'شوالیه سایه',  desc:'سپر و امتیاز دوبرابر کمبو' },
  'ghost+shadow':    { name:'طیف ناپدید',   desc:'عبور از موانع + کمبوی سریع' }
};

function getGeneObj(id){
  for (var i=0;i<GENES.length;i++) if (GENES[i].id===id) return GENES[i];
  return GENES[0];
}
function getFusionInfo(g1, g2){
  if (!g1 || !g2 || g1 === g2) return null;
  var k = [g1, g2].sort().join('+');
  return FUSIONS[k] || { name:'ترکیب '+getGeneObj(g1).name.replace('ژن ','')+' + '+getGeneObj(g2).name.replace('ژن ',''), desc:'اجرای هم‌زمان هر دو مهارت ژنتیکی' };
}

/* ارتقای مهارت با امتیاز تکامل حاصل از لول‌آپ */
var SKILLS = [
  { id:'reflex', name:'چابکی و زمان', desc:'بازگشت زمان بیشتر و زمان شارژ سریع‌تر دش', maxLv:5 },
  { id:'power',  name:'قدرت ژن',      desc:'دوام طولانی‌تر مهارت و تخریب بیشتر',        maxLv:5 },
  { id:'greed',  name:'جاذبه کمبو',   desc:'شعاع جذب بیشتر با زنجیره کمبو و پاداش طلا',  maxLv:5 }
];

var DAILY_MISSIONS = [
  { id:'dm_games',  title:'۳ دست بازی کن',          stat:'games',  target:3,  gold:25, crystals:1 },
  { id:'dm_foods',  title:'۲۵ غذا و سیب جمع کن',    stat:'foods',  target:25, gold:30, crystals:1 },
  { id:'dm_dashes', title:'۱۰ بار از دش استفاده کن', stat:'dashes', target:10, gold:25, crystals:2 },
  { id:'dm_combos', title:'۵ زنجیره کمبوی ×۳ بساز',  stat:'combos', target:5,  gold:35, crystals:2 }
];

var WEEKLY_MISSIONS = [
  { id:'wm_boss',   title:'۳ باس را شکست بده',      stat:'bossWins', target:3,    gold:90,  crystals:4 },
  { id:'wm_rivals', title:'۸ مار دشمن را از بین ببر',stat:'rivals',   target:8,    gold:75,  crystals:3 },
  { id:'wm_chests', title:'۴ صندوق باز کن',          stat:'chests',   target:4,    gold:70,  crystals:3 },
  { id:'wm_score',  title:'۳۰۰۰ امتیاز مجموع بگیر',  stat:'scoreSum', target:3000, gold:100, crystals:5 }
];

var SECRET_MISSIONS = [
  { id:'sm_close',  title:'۲۰ فرار نزدیک به مرگ!',    stat:'closeCalls',  target:20, gold:60, crystals:4 },
  { id:'sm_walls',  title:'۱۵ دیوار با دش بشکن',      stat:'wallsBroken', target:15, gold:55, crystals:3 },
  { id:'sm_nohit',  title:'۳ برد بدون خوردن حتی ۱ ضربه', stat:'noHitWins', target:3,  gold:95, crystals:6 }
];

var ACHIEVEMENTS = [
  { id:'ach_lv3',     name:'مار تازه‌نفس',    desc:'به لِوِل ۳ برس',                  check:function(s){ return s.level >= 3; }, rewardCrystals:2 },
  { id:'ach_combo8',  name:'استاد زنجیره',    desc:'به کمبوی ×۸ برس',                 check:function(s){ return s.stats.maxComboEver >= 8; }, rewardCrystals:3 },
  { id:'ach_boss1',   name:'شکارچی اژدها',    desc:'اولین باس را شکست بده',           check:function(s){ return s.stats.bossWins >= 1; }, rewardCrystals:3 },
  { id:'ach_walls',   name:'دیوارشکن',        desc:'۱۰ دیوار تخریب‌پذیر بشکن',         check:function(s){ return s.stats.wallsBroken >= 10; }, rewardCrystals:2 },
  { id:'ach_portal',  name:'مسافر بعد',       desc:'۱۰ بار از پورتال عبور کن',         check:function(s){ return s.stats.portalsUsed >= 10; }, rewardCrystals:2 },
  { id:'ach_master',  name:'فاتح جهان‌ها',     desc:'حداقل ۳ مدال استادی جهان بگیر',   check:function(s){ return countMasteryBadges() >= 3; }, rewardCrystals:5 },
  { id:'ach_secret',  name:'کاشف اتاق مخفی',   desc:'وارد یک اتاق مخفی شو',            check:function(s){ return s.stats.secretsFound >= 1; }, rewardCrystals:3 },
  { id:'ach_ghost',   name:'شکارچی شبح',       desc:'از شبح رکورد قبلی جلو بزن',      check:function(s){ return s.stats.ghostWins >= 1; }, rewardCrystals:4 }
];

/* ۵ رلیک دائمی در طول یک Run */
var RELICS = [
  { id:'golden_fang',  name:'دندان طلایی',  ico:'relic_fang',   desc:'+۶۰٪ امتیاز و سکه بیشتر از غذاهای طلایی' },
  { id:'phantom_eye',  name:'چشم شبح',      ico:'relic_eye',    desc:'نمایش مکان آیتم بعدی و +۱.۲ ثانیه پنجره کمبو' },
  { id:'broken_clock', name:'ساعت شکسته',   ico:'relic_clock',  desc:'۲۸٪ کاهش زمان شارژ دش/مهارت و +۱ بازگشت زمان' },
  { id:'dragon_scale', name:'پولک اژدها',   ico:'relic_scale',  desc:'یک‌بار نجات قطعی از مرگ هنگام تمام شدن قلب‌ها' },
  { id:'magnet_core',  name:'هسته مغناطیس', ico:'relic_magnet', desc:'جذب خودکار غذاها و کریستال‌ها از فاصله +۲ خانه' }
];
function getRelicObj(id){
  for (var i=0;i<RELICS.length;i++) if (RELICS[i].id===id) return RELICS[i];
  return RELICS[0];
}

/* ۵ فرم تکامل بصری مار بر اساس لول */
var EVO_FORMS = [
  { id:'basic',       name:'فرم کلاسیک',     needLv:1,  desc:'مار پیکسلی اصیل' },
  { id:'glow_eyes',   name:'چشمان درخشان',   needLv:5,  desc:'چشمان نئونی نورانی (لول ۵)' },
  { id:'armored',     name:'مار زرهی',       needLv:10, desc:'صفحات زره نقره‌ای روی بدن (لول ۱۰)' },
  { id:'energy_tail', name:'دم انرژی',       needLv:15, desc:'انتهای دم با شعله انرژی (لول ۱۵)' },
  { id:'legend',      name:'فرم افسانه‌ای',  needLv:20, desc:'ترکیب کامل زره، هاله و دم انرژی (لول ۲۰)' }
];
function getEffectiveEvoForm(){
  var chosen = save.activeEvoForm || 'basic';
  for (var i=0;i<EVO_FORMS.length;i++){
    if (EVO_FORMS[i].id === chosen && save.level >= EVO_FORMS[i].needLv) return chosen;
  }
  return 'basic';
}

/* ۵ رویداد آرکید در طول Run */
var ARCADE_EVENTS = [
  { id:'golden_rush',    name:'هجوم طلا',      desc:'غذاهای طلایی فراوان روی نقشه ظاهر می‌شوند!' },
  { id:'darkness',       name:'تاریکی ناگهانی',desc:'بخشی از نقشه تاریک می‌شود و امتیاز افزایش می‌یابد' },
  { id:'meteor_rain',    name:'بارش شهاب',     desc:'شهاب‌سنگ‌ها دیوارهای شکننده می‌سازند' },
  { id:'double_trouble', name:'دشمن مضاعف',    desc:'یک مار شکارچی اضافه وارد میدان می‌شود' },
  { id:'treasure_hunt',  name:'شکار گنج',      desc:'صندوق یا کریستال‌های مخفی در میدان می‌درخشند' }
];

var ROGUE_CARDS = [
  { id:'rg_magnet', title:'مغناطیس دائمی', ico:'magnet',     desc:'جذب خودکار سیب‌ها به سمت سر' },
  { id:'rg_hp',     title:'+۱ قلب زرهی',  ico:'heart_full', desc:'یک جان اضافی در سیاهچال' },
  { id:'rg_bolt',   title:'دش برق‌آسا',    ico:'dash_ico',   desc:'کاهش ۴۰٪ زمان انتظار دش و مهارت' },
  { id:'rg_combo',  title:'کمبوی طلایی',  ico:'gold',       desc:'+۵۰٪ امتیاز برای هر غذا' },
  { id:'rg_ghost',  title:'قدم روح',      ico:'ghost',      desc:'دوام دو برابر قدرت روح و سپر' },
  { id:'rg_rewind', title:'ساعت شنی',     ico:'rewind',     desc:'+۲ شارژ اضافه برای بازگشت زمان' }
];

var BESTIARY = [
  { id:'hunter',   name:'مار شکارچی',    ico:'snake_ico',   desc:'مسیر حرکت تو را پیش‌بینی و قطع می‌کند' },
  { id:'rival',    name:'مار رقیب',      ico:'gold',        desc:'برای تصاحب سیب‌ها و کریستال‌ها مسابقه می‌دهد' },
  { id:'guardian', name:'مار نگهبان',    ico:'shield',      desc:'از گنج‌ها و کلیدها محافظت می‌کند' },
  { id:'dwall',    name:'دیوار شکننده',  ico:'brick',       desc:'با فعال کردن دش می‌توانی آن را بشکنی' },
  { id:'portal',   name:'پورتال دوقلو',  ico:'portal',      desc:'مار را بی‌وقفه به پورتال جفت منتقل می‌کند' },
  { id:'secret',   name:'اتاق مخفی',     ico:'secret_door', desc:'ورودی پنهان به گنج، رلیک و چالش کمیاب' },
  { id:'d1',       name:'اژدهای آبی',    ico:'orb',         desc:'باس ۳ فازه با پرتابه‌های مستقیم و موج یخی' },
  { id:'d2',       name:'اژدهای آتشین',  ico:'fireball',    desc:'باس ۳ فازه با مناطق سوزان و رگبار شعله' },
  { id:'d3',       name:'اژدهای برقی',   ico:'lightning',   desc:'باس ۳ فازه با رعدهای خطی سریع' },
  { id:'d4',       name:'غول سنگی',      ico:'golem_ico',   desc:'غول دژ دیجیتال که دیوارهای سنگی می‌سازد' }
];

function checkLevelGeneUnlocks(){
  var unlockedNew = [];
  GENES.forEach(function(g){
    if (save.ownedGenes.indexOf(g.id) !== -1) return;
    var okLv = save.level >= g.needLv;
    var okBoss = g.needBoss > 0 && save.stats.bossWins >= g.needBoss;
    if (okLv || okBoss){
      save.ownedGenes.push(g.id);
      unlockedNew.push(g.name);
    }
  });
  return unlockedNew;
}

function addXP(amt){
  save.xp += amt;
  var leveled = false;
  while (save.xp >= save.level * 100){
    save.xp -= save.level * 100;
    save.level++;
    save.evoPoints = (save.evoPoints || 0) + 1;
    leveled = true;
  }
  var newGenes = checkLevelGeneUnlocks();
  return { leveled: leveled, newGenes: newGenes };
}

function evaluateAchievements(){
  var newly = [];
  ACHIEVEMENTS.forEach(function(a){
    if (save.achievements.indexOf(a.id) === -1 && a.check(save)){
      save.achievements.push(a.id);
      save.crystals += a.rewardCrystals;
      newly.push(a);
    }
  });
  return newly;
}

function getWorldMastery(worldId){
  if (!save.worldMastery[worldId]){
    save.worldMastery[worldId] = { scoreBadge:false, noHitBadge:false, comboBadge:false, challengeDone:false };
  }
  return save.worldMastery[worldId];
}

function countMasteryBadges(){
  var total = 0;
  WORLDS_ORDER.forEach(function(w){
    var m = save.worldMastery[w];
    if (m){
      if (m.scoreBadge) total++;
      if (m.noHitBadge) total++;
      if (m.comboBadge) total++;
    }
  });
  return total;
}

function setSingleChest(type){
  if (save.slot !== null) return false;
  save.slot = { type: type, unlockAt: 0, ready: false };
  return true;
}

function discover(id){
  if (!id || save.discovered.indexOf(id) !== -1) return;
  save.discovered.push(id);
  persist();
}

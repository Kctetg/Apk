'use strict';
/* ═══════════════ رابط کاربری ۵ تبه SNAKE: PIXEL RUSH ═══════════════ */
var toastTimer = null;
var activeTab = 'tabPlay';
var colSubTab = 'skins';
var misSubTab = 'missions';

function showToast(msg){
  var el = $('#crToast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ el.classList.remove('show'); }, 2200);
}

function fmtRemain(ms){
  if (ms <= 0) return 'آماده!';
  var s = Math.ceil(ms/1000);
  var h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  var mm = m < 10 ? '0'+m : ''+m;
  var ss = sec < 10 ? '0'+sec : ''+sec;
  if (h > 0) return faNum(h)+':'+faNum(mm)+':'+faNum(ss);
  return faNum(m)+':'+faNum(ss);
}

function fmtDuration(ms){
  if (!ms) return '—';
  var s = Math.round(ms/1000);
  if (s < 60) return faNum(s) + ' ثانیه';
  return faNum(Math.floor(s/60)) + 'د ' + faNum(s%60) + 'ث';
}

function applyUiScale(){
  var sz = (save.settings && save.settings.uiSize) || 'md';
  document.documentElement.setAttribute('data-uisize', sz);
}

function renderTopBar(){
  var needXp = save.level * 100;
  if ($('#tbLevel')) $('#tbLevel').textContent = faNum(save.level);
  if ($('#tbXpBar')) $('#tbXpBar').style.width = Math.min(100, Math.round((save.xp / needXp) * 100)) + '%';
  if ($('#tbGold')) $('#tbGold').textContent = faNum(save.gold);
  if ($('#tbCrystals')) $('#tbCrystals').textContent = faNum(save.crystals);
  if ($('#btnMute')){
    var snd = !save.settings || save.settings.sound !== false;
    $('#btnMute').innerHTML = pxImgTag(snd ? 'sound_on' : 'sound_off', 18);
  }
}

/* ═══════════════ تب ۱: بازی و شروع سریع ═══════════════ */
function renderHomeTab(){
  var wo = getWorldObj(save.world);
  var rec = getModeRecord(save.world, save.mode);
  if ($('#homeWorldTitle')){
    $('#homeWorldTitle').innerHTML = pxImgTag('badge', 16) + ' جهان فعال: <b>' + wo.name + '</b>';
  }
  if ($('#homeRecordTxt')){
    $('#homeRecordTxt').textContent = 'بهترین رکورد: ' + faNum(rec.bestScore) +
      '  •  کمبو: ×' + faNum(rec.maxCombo || 0) +
      '  •  زمان: ' + fmtDuration(rec.bestTimeMs);
  }

  /* گرید ۵ حالت */
  var grid = $('#homeModeGrid');
  if (grid){
    grid.innerHTML = '';
    GAME_MODES.forEach(function(m){
      var d = document.createElement('div');
      d.className = 'mode-pill' + (save.mode === m.id ? ' active' : '');
      d.innerHTML = pxImgTag(m.ico, 20) + '<span>' + m.name + '</span>';
      d.onclick = function(){
        sfx.click();
        save.mode = m.id;
        persist();
        renderHomeTab();
      };
      grid.appendChild(d);
    });
  }

  /* گزینه‌های سریع حالت انتخاب‌شده */
  var optBox = $('#homeModeOpts');
  if (optBox){
    var mObj = getModeObj(save.mode);
    var html = '<div class="mode-hint">' + mObj.hint + '</div>';
    if (save.mode === 'timeattack'){
      html += '<div class="opt-row">' +
        '<button class="mini-pill-btn'+(save.timeAttackSec===60?' on':'')+'" id="btnTa60">۶۰ ثانیه</button>' +
        '<button class="mini-pill-btn'+(save.timeAttackSec===120?' on':'')+'" id="btnTa120">۱۲۰ ثانیه</button>' +
        '</div>';
    } else if (save.mode === 'endless'){
      html += '<div class="opt-row">' +
        '<button class="mini-pill-btn'+(!save.dailySeedMode?' on':'')+'" id="btnEndFree">آزاد</button>' +
        '<button class="mini-pill-btn'+(save.dailySeedMode?' on':'')+'" id="btnEndDaily">بذر روزانه ('+faNum(save.dailySeedBest||0)+')</button>' +
        '</div>';
    }
    optBox.innerHTML = html;
    if ($('#btnTa60')) $('#btnTa60').onclick = function(){ sfx.click(); save.timeAttackSec = 60; persist(); renderHomeTab(); };
    if ($('#btnTa120')) $('#btnTa120').onclick = function(){ sfx.click(); save.timeAttackSec = 120; persist(); renderHomeTab(); };
    if ($('#btnEndFree')) $('#btnEndFree').onclick = function(){ sfx.click(); save.dailySeedMode = false; persist(); renderHomeTab(); };
    if ($('#btnEndDaily')) $('#btnEndDaily').onclick = function(){ sfx.click(); save.dailySeedMode = true; persist(); renderHomeTab(); };
  }

  if ($('#btnLastReplay')){
    $('#btnLastReplay').style.display = lastRunTrace ? 'inline-flex' : 'none';
  }

  renderSingleChestSlot();
}

function renderSingleChestSlot(){
  var box = $('#singleChestSlot');
  if (!box) return;
  if (!save.slot){
    box.className = 'chest-card empty';
    box.innerHTML = '<div class="chest-meta"><b>جایگاه صندوق خالی است</b><span>با پیروزی یا ثبت امتیاز بالا صندوق بگیر!</span></div>';
    box.onclick = null;
    return;
  }
  var cDef = CHEST_TYPES[save.slot.type] || CHEST_TYPES.bronze;
  var now = Date.now();
  if (!save.slot.unlockAt && !save.slot.ready){
    box.className = 'chest-card';
    box.innerHTML = pxImgTag(cDef.ico, 34) +
      '<div class="chest-meta"><b>'+cDef.name+'</b><span>آماده شروع شمارش ('+faNum(Math.round(cDef.unlockSec/60))+' دقیقه)</span></div>' +
      '<span class="chest-cta">شروع</span>';
    box.onclick = function(){
      sfx.click();
      save.slot.unlockAt = Date.now() + cDef.unlockSec * 1000;
      persist();
      renderSingleChestSlot();
    };
  } else {
    var rem = save.slot.ready ? 0 : Math.max(0, save.slot.unlockAt - now);
    if (rem <= 0){
      save.slot.ready = true;
      box.className = 'chest-card ready';
      box.innerHTML = pxImgTag(cDef.ico, 34) +
        '<div class="chest-meta"><b>'+cDef.name+' آماده باز شدن!</b><span>برای دریافت جایزه ضربه بزن</span></div>' +
        '<span class="chest-cta gold">باز کن</span>';
      box.onclick = function(){ openActiveChest(); };
    } else {
      box.className = 'chest-card counting';
      box.innerHTML = pxImgTag(cDef.ico, 34) +
        '<div class="chest-meta"><b>در حال باز شدن...</b><span>'+fmtRemain(rem)+'</span></div>' +
        '<span class="chest-cta crystal">'+pxImgTag('crystal',13)+' '+faNum(cDef.crystalSkip)+' باز کردن فوری</span>';
      box.onclick = function(){
        if (save.crystals < cDef.crystalSkip){ showToast('کریستال کافی نداری!'); return; }
        save.crystals -= cDef.crystalSkip;
        openActiveChest();
      };
    }
  }
}

function openActiveChest(){
  if (!save.slot) return;
  var cDef = CHEST_TYPES[save.slot.type] || CHEST_TYPES.bronze;
  var g = cDef.gold[0] + Math.floor(Math.random() * (cDef.gold[1] - cDef.gold[0] + 1));
  var cr = cDef.crystals[0] + Math.floor(Math.random() * (cDef.crystals[1] - cDef.crystals[0] + 1));
  save.gold += g;
  save.crystals += cr;
  save.stats.chestsOpened++;
  save.weeklyProgress.chests++;
  addXP(cDef.xp);
  save.slot = null;
  evaluateAchievements();
  persist();
  sfx.chest();
  vibrate([20,30,20]);

  if ($('#modalChestArt')) $('#modalChestArt').innerHTML = pxImgTag(cDef.ico, 56);
  if ($('#modalChestTitle')) $('#modalChestTitle').textContent = cDef.name + ' باز شد!';
  if ($('#modalLootList')){
    $('#modalLootList').innerHTML =
      '<div class="loot-row">' + pxImgTag('coin',20) + ' +' + faNum(g) + ' سکه</div>' +
      (cr > 0 ? '<div class="loot-row">' + pxImgTag('crystal',20) + ' +' + faNum(cr) + ' کریستال</div>' : '') +
      '<div class="loot-row">' + pxImgTag('dna',20) + ' +' + faNum(cDef.xp) + ' XP</div>';
  }
  $('#chestModal').classList.add('show');
  renderMenu();
}

/* ═══════════════ تب ۲: جهان‌ها و استادی نقشه ═══════════════ */
function renderWorldsTab(){
  var box = $('#worldsList');
  if (!box) return;
  box.innerHTML = '';
  WORLDS_ORDER.forEach(function(wid){
    var wo = WORLDS[wid];
    var mast = getWorldMastery(wid);
    var rec = getModeRecord(wid, save.mode);
    var selected = (save.world === wid);
    var card = document.createElement('div');
    card.className = 'world-card' + (selected ? ' active' : '');
    card.style.borderColor = selected ? wo.accent : 'rgba(255,255,255,0.12)';
    card.innerHTML =
      '<div class="wc-head">' +
        '<div><b>' + wo.name + '</b><div class="wc-sub">' + wo.subtitle + '</div></div>' +
        '<span class="wc-boss">' + wo.bossName + '</span>' +
      '</div>' +
      '<div class="wc-rules">' +
        '<span>خطرها: ' + wo.hazards.join(' • ') + '</span>' +
        '<span>آیتم ویژه: ' + wo.specialItem + '</span>' +
        '<span>رویداد: ' + wo.eventDesc + '</span>' +
      '</div>' +
      '<div class="wc-badges">' +
        '<span class="mbadge'+(mast.scoreBadge?' on':'')+'">' + pxImgTag('trophy',13) + ' امتیاز</span>' +
        '<span class="mbadge'+(mast.noHitBadge?' on':'')+'">' + pxImgTag('shield',13) + ' بی‌خطا</span>' +
        '<span class="mbadge'+(mast.comboBadge?' on':'')+'">' + pxImgTag('lightning',13) + ' کمبو</span>' +
        '<span class="wc-best">رکورد: ' + faNum(rec.bestScore) + '</span>' +
      '</div>' +
      '<div class="wc-actions">' +
        '<button class="btn-sm'+(selected?' on':'')+'" data-sel="'+wid+'">'+(selected?'جهان انتخاب‌شده':'انتخاب جهان')+'</button>' +
        '<button class="btn-sm chall'+(mast.challengeDone?' done':'')+'" data-ch="'+wid+'">'+(mast.challengeDone?'چالش تکمیل شد':'شروع چالش')+'</button>' +
      '</div>';

    card.querySelector('[data-sel]').onclick = function(){
      sfx.click();
      save.world = wid;
      persist();
      renderMenu();
      showToast('جهان فعال: ' + wo.name);
    };
    card.querySelector('[data-ch]').onclick = function(){
      sfx.click();
      save.world = wid;
      persist();
      startGame('endless', wid, wo.challenge);
    };
    box.appendChild(card);
  });
}

/* ═══════════════ تب ۳: تکامل، ژن‌ها و ترکیب ۲ ژن ═══════════════ */
function renderEvoTab(){
  if ($('#evoPointsBadge')) $('#evoPointsBadge').textContent = 'امتیاز تکامل: ' + faNum(save.evoPoints || 0);
  var fusBox = $('#activeFusionBox');
  if (fusBox){
    var g1 = getGeneObj(save.genes[0]);
    var g2 = getGeneObj(save.genes[1]);
    var fInfo = getFusionInfo(g1.id, g2.id);
    fusBox.innerHTML =
      '<div class="fus-row">' +
        '<div class="fus-slot">' + pxImgTag(g1.ico, 22) + '<span>' + g1.name + '</span></div>' +
        '<span class="fus-plus">+</span>' +
        '<div class="fus-slot">' + pxImgTag(g2.ico, 22) + '<span>' + g2.name + '</span></div>' +
      '</div>' +
      (fInfo ? '<div class="fus-res"><b>ترکیب فعال: ' + fInfo.name + '</b><span>' + fInfo.desc + '</span></div>' : '<div class="fus-res"><span>۲ ژن متفاوت انتخاب کن تا ترکیب ویژه بسازی!</span></div>');
  }

  var gList = $('#genesList');
  if (gList){
    gList.innerHTML = '';
    GENES.forEach(function(g){
      var unlocked = save.ownedGenes.indexOf(g.id) !== -1;
      var slotIdx = save.genes.indexOf(g.id);
      var card = document.createElement('div');
      card.className = 'evo-card' + (slotIdx !== -1 ? ' active' : '') + (!unlocked ? ' locked' : '');
      card.innerHTML =
        pxImgTag(g.ico, 26) +
        '<div class="evo-info"><b>'+g.name+'</b><span>'+g.desc+'</span>' +
        (!unlocked ? '<small class="req-tag">باز شدن در: '+g.unlockText+'</small>' :
          '<small class="req-tag ok">'+(slotIdx===0?'اسلات ۱':(slotIdx===1?'اسلات ۲':'آماده نصب'))+'</small>') +
        '</div>';
      if (unlocked){
        card.onclick = function(){
          sfx.click();
          if (save.genes[0] === g.id || save.genes[1] === g.id) return;
          save.genes = [g.id, save.genes[0]];
          persist();
          renderEvoTab();
          showToast(g.name + ' نصب شد!');
        };
      }
      gList.appendChild(card);
    });
  }

  var sList = $('#skillsList');
  if (sList){
    sList.innerHTML = '';
    SKILLS.forEach(function(sk){
      var lv = save.skills[sk.id] || 1;
      var maxed = lv >= sk.maxLv;
      var card = document.createElement('div');
      card.className = 'skill-row';
      card.innerHTML =
        '<div><b>'+sk.name+' (سطح '+faNum(lv)+'/'+faNum(sk.maxLv)+')</b><span>'+sk.desc+'</span></div>' +
        '<button class="btn-sm" '+(maxed||!save.evoPoints?'disabled':'')+'>'+(maxed?'حداکثر':'ارتقا (۱ امتیاز)')+'</button>';
      card.querySelector('button').onclick = function(){
        if (maxed || !save.evoPoints) return;
        sfx.power();
        save.evoPoints--;
        save.skills[sk.id] = lv + 1;
        persist();
        renderEvoTab();
      };
      sList.appendChild(card);
    });
  }
}

/* ═══════════════ تب ۴: مجموعه (اسکین، اکسسوری، آلبوم، دستاوردها) ═══════════════ */
function renderCollectionTab(){
  $$('#colSubTabs .sub-pill').forEach(function(b){
    b.classList.toggle('on', b.getAttribute('data-sub') === colSubTab);
  });
  var box = $('#colContent');
  if (!box) return;
  box.innerHTML = '';

  if (colSubTab === 'skins'){
    SKINS.forEach(function(sk){
      var owned = save.ownedSkins.indexOf(sk.id) !== -1;
      var eq = save.skin === sk.id;
      var isCrys = sk.currency === 'crystals';
      var card = document.createElement('div');
      card.className = 'item-card' + (eq ? ' eq' : '');
      card.innerHTML =
        '<div class="swatch" style="background:'+(sk.body==='rainbow'?'linear-gradient(90deg,#ef4444,#eab308,#22c55e,#3b82f6)':sk.body)+'"></div>' +
        '<div class="ic-info"><b>'+sk.name+'</b><span>'+sk.desc+'</span></div>' +
        '<button class="btn-sm'+(eq?' on':'')+'">'+(eq?'نصب‌شده':(owned?'انتخاب':faNum(sk.price)+' '+(isCrys?'کریستال':'سکه')))+'</button>';
      card.querySelector('button').onclick = function(){
        if (owned){ sfx.click(); save.skin = sk.id; persist(); renderMenu(); return; }
        if (isCrys){
          if (save.crystals < sk.price){ showToast('کریستال کافی نیست'); return; }
          save.crystals -= sk.price;
        } else {
          if (save.gold < sk.price){ showToast('سکه کافی نیست'); return; }
          save.gold -= sk.price;
        }
        sfx.chest(); save.ownedSkins.push(sk.id); save.skin = sk.id; persist(); renderMenu();
      };
      box.appendChild(card);
    });
  } else if (colSubTab === 'acc'){
    ACCESSORIES.forEach(function(ac){
      var owned = save.ownedAcc.indexOf(ac.id) !== -1;
      var eq = save.acc === ac.id;
      var isCrys = ac.currency === 'crystals';
      var card = document.createElement('div');
      card.className = 'item-card' + (eq ? ' eq' : '');
      card.innerHTML =
        pxImgTag(ac.ico, 28) +
        '<div class="ic-info"><b>'+ac.name+'</b><span>'+ac.desc+'</span></div>' +
        '<button class="btn-sm'+(eq?' on':'')+'">'+(eq?'نصب‌شده':(owned?'انتخاب':faNum(ac.price)+' '+(isCrys?'کریستال':'سکه')))+'</button>';
      card.querySelector('button').onclick = function(){
        if (owned){ sfx.click(); save.acc = ac.id; persist(); renderMenu(); return; }
        if (isCrys){
          if (save.crystals < ac.price){ showToast('کریستال کافی نیست'); return; }
          save.crystals -= ac.price;
        } else {
          if (save.gold < ac.price){ showToast('سکه کافی نیست'); return; }
          save.gold -= ac.price;
        }
        sfx.chest(); save.ownedAcc.push(ac.id); save.acc = ac.id; persist(); renderMenu();
      };
      box.appendChild(card);
    });
  } else if (colSubTab === 'bestiary'){
    BESTIARY.forEach(function(b){
      var seen = save.discovered.indexOf(b.id) !== -1;
      var card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML =
        pxImgTag(b.ico, 28) +
        '<div class="ic-info"><b>'+(seen?b.name:'مورد ناشناخته')+'</b><span>'+(seen?b.desc:'در طول بازی با آن روبه‌رو شو تا ثبت شود!')+'</span></div>';
      box.appendChild(card);
    });
  } else {
    ACHIEVEMENTS.forEach(function(a){
      var done = save.achievements.indexOf(a.id) !== -1;
      var card = document.createElement('div');
      card.className = 'item-card' + (done ? ' eq' : '');
      card.innerHTML =
        pxImgTag(done ? 'badge' : 'trophy', 26) +
        '<div class="ic-info"><b>'+a.name+'</b><span>'+a.desc+'</span></div>' +
        '<span class="ach-rew">'+(done?'دریافت‌شده':'+'+faNum(a.rewardCrystals)+' کریستال')+'</span>';
      box.appendChild(card);
    });
  }
}

/* ═══════════════ تب ۵: مأموریت‌ها، جایزه روزانه و فروشگاه ═══════════════ */
function renderMissionsTab(){
  $$('#misSubTabs .sub-pill').forEach(function(b){
    b.classList.toggle('on', b.getAttribute('data-sub') === misSubTab);
  });
  var box = $('#misContent');
  if (!box) return;
  box.innerHTML = '';

  if (misSubTab === 'missions'){
    function addSection(title, list, srcObj, claimedArr){
      var h = document.createElement('div');
      h.className = 'sec-hdr'; h.textContent = title;
      box.appendChild(h);
      list.forEach(function(m){
        var cur = Math.min(m.target, srcObj[m.stat] || 0);
        var claimed = claimedArr.indexOf(m.id) !== -1;
        var ready = !claimed && cur >= m.target;
        var row = document.createElement('div');
        row.className = 'mis-card';
        row.innerHTML =
          '<div class="mis-meta"><b>'+m.title+'</b><span>'+faNum(cur)+' / '+faNum(m.target)+'</span></div>' +
          '<button class="btn-sm'+(ready?' on':'')+'" '+(ready?'':'disabled')+'>' +
            (claimed ? 'گرفته‌شد' : (ready ? 'دریافت +' + faNum(m.gold) + 'س' : faNum(m.crystals)+' کریستال')) +
          '</button>';
        row.querySelector('button').onclick = function(){
          if (!ready) return;
          sfx.chest();
          claimedArr.push(m.id);
          save.gold += m.gold; save.crystals += m.crystals;
          persist(); renderMenu();
        };
        box.appendChild(row);
      });
    }
    addSection('مأموریت‌های روزانه', DAILY_MISSIONS, save.dailyProgress, save.claimedDailyMissions);
    addSection('مأموریت‌های هفتگی', WEEKLY_MISSIONS, save.weeklyProgress, save.claimedWeeklyMissions);
    addSection('مأموریت‌های مخفی', SECRET_MISSIONS, save.stats, save.claimedSecretMissions);
  } else if (misSubTab === 'daily'){
    var now = Date.now();
    var canClaim = (now - (save.lastDailyTs || 0)) >= 20 * 3600 * 1000;
    DAILY_REWARDS.forEach(function(d){
      var isToday = (d.day === save.dailyDay);
      var row = document.createElement('div');
      row.className = 'mis-card' + (isToday && canClaim ? ' eq' : '');
      row.innerHTML =
        pxImgTag(d.chest ? 'chest_'+d.chest : 'gift', 24) +
        '<div class="mis-meta"><b>روز '+faNum(d.day)+'</b><span>'+d.label+'</span></div>' +
        '<button class="btn-sm'+(isToday && canClaim ? ' on' : '')+'" '+(isToday && canClaim ? '' : 'disabled')+'>' +
          (d.day < save.dailyDay ? 'دریافت‌شده' : (isToday ? (canClaim ? 'دریافت' : 'فردا') : 'قفل')) +
        '</button>';
      row.querySelector('button').onclick = function(){
        if (!isToday || !canClaim) return;
        sfx.chest();
        save.gold += d.gold; save.crystals += d.crystals;
        if (d.chest && !save.slot) setSingleChest(d.chest);
        save.lastDailyTs = Date.now();
        save.dailyDay = (save.dailyDay % 7) + 1;
        persist(); renderMenu();
      };
      box.appendChild(row);
    });
  } else {
    /* فروشگاه صندوق‌ها و هدیه روزانه */
    ['bronze','silver','gold'].forEach(function(cid){
      var c = CHEST_TYPES[cid];
      var isCrys = c.shopCrystals > 0;
      var card = document.createElement('div');
      card.className = 'mis-card';
      card.innerHTML =
        pxImgTag(c.ico, 28) +
        '<div class="mis-meta"><b>'+c.name+'</b><span>جایزه سکه، کریستال و XP</span></div>' +
        '<button class="btn-sm">'+(isCrys ? faNum(c.shopCrystals)+' کریستال' : faNum(c.shopGold)+' سکه')+'</button>';
      card.querySelector('button').onclick = function(){
        if (save.slot !== null){ showToast('اول صندوق فعلی را باز کن!'); return; }
        if (isCrys){
          if (save.crystals < c.shopCrystals){ showToast('کریستال کافی نیست'); return; }
          save.crystals -= c.shopCrystals;
        } else {
          if (save.gold < c.shopGold){ showToast('سکه کافی نیست'); return; }
          save.gold -= c.shopGold;
        }
        setSingleChest(cid);
        sfx.gold(); persist(); renderMenu();
        showToast(c.name + ' به جایگاه اضافه شد!');
      };
      box.appendChild(card);
    });
  }
}

/* ═══════════════ تنظیمات و راهنما ═══════════════ */
function openSettingsModal(){
  var st = save.settings;
  var body = $('#settingsBody');
  if (!body) return;
  body.innerHTML =
    '<div class="set-row"><span>نوع کنترل</span><div>' +
      '<button class="mini-pill-btn'+(st.control==='both'?' on':'')+'" data-ctrl="both">هر دو</button>' +
      '<button class="mini-pill-btn'+(st.control==='swipe'?' on':'')+'" data-ctrl="swipe">سوایپ</button>' +
      '<button class="mini-pill-btn'+(st.control==='dpad'?' on':'')+'" data-ctrl="dpad">دکمه</button>' +
    '</div></div>' +
    '<div class="set-row"><span>سرعت بازی</span><div>' +
      '<button class="mini-pill-btn'+(st.speed==='chill'?' on':'')+'" data-spd="chill">آرام</button>' +
      '<button class="mini-pill-btn'+(st.speed==='normal'?' on':'')+'" data-spd="normal">عادی</button>' +
      '<button class="mini-pill-btn'+(st.speed==='fast'?' on':'')+'" data-spd="fast">تند</button>' +
    '</div></div>' +
    '<div class="set-row"><span>اندازه رابط</span><div>' +
      '<button class="mini-pill-btn'+(st.uiSize==='sm'?' on':'')+'" data-sz="sm">کوچک</button>' +
      '<button class="mini-pill-btn'+(st.uiSize==='md'?' on':'')+'" data-sz="md">متوسط</button>' +
      '<button class="mini-pill-btn'+(st.uiSize==='lg'?' on':'')+'" data-sz="lg">بزرگ</button>' +
    '</div></div>' +
    '<div class="set-row"><span>افکت‌ها و صدا</span><div>' +
      '<button class="mini-pill-btn'+(st.sound?' on':'')+'" id="tglSound">صدا</button>' +
      '<button class="mini-pill-btn'+(st.music?' on':'')+'" id="tglMusic">موسیقی</button>' +
      '<button class="mini-pill-btn'+(st.vibrate?' on':'')+'" id="tglVib">لرزش</button>' +
      '<button class="mini-pill-btn'+(st.lowFx?' on':'')+'" id="tglLowFx">حالت سبک</button>' +
    '</div></div>' +
    '<div class="set-row" style="flex-direction:column;align-items:stretch;gap:6px;">' +
      '<span>پشتیبان‌گیری و بازیابی (کد ذخیره)</span>' +
      '<textarea id="backupArea" rows="2" placeholder="کد پشتیبان را اینجا جای‌گذاری کن..."></textarea>' +
      '<div style="display:flex;gap:6px;">' +
        '<button class="btn-sm" id="btnExportSave">ساخت کد</button>' +
        '<button class="btn-sm" id="btnImportSave">بازیابی</button>' +
      '</div>' +
    '</div>';

  $$('[data-ctrl]').forEach(function(b){ b.onclick = function(){ st.control = b.getAttribute('data-ctrl'); persist(); applyControlLayout(); openSettingsModal(); }; });
  $$('[data-spd]').forEach(function(b){ b.onclick = function(){ st.speed = b.getAttribute('data-spd'); persist(); openSettingsModal(); }; });
  $$('[data-sz]').forEach(function(b){ b.onclick = function(){ st.uiSize = b.getAttribute('data-sz'); persist(); applyUiScale(); openSettingsModal(); }; });
  $('#tglSound').onclick = function(){ st.sound = !st.sound; persist(); syncAudioSettings(); renderTopBar(); openSettingsModal(); };
  $('#tglMusic').onclick = function(){ st.music = !st.music; persist(); syncAudioSettings(); openSettingsModal(); };
  $('#tglVib').onclick = function(){ st.vibrate = !st.vibrate; persist(); openSettingsModal(); };
  $('#tglLowFx').onclick = function(){ st.lowFx = !st.lowFx; persist(); openSettingsModal(); };
  $('#btnExportSave').onclick = function(){
    $('#backupArea').value = exportBackupJson();
    $('#backupArea').select();
    try{ document.execCommand('copy'); }catch(e){}
    showToast('کد ذخیره آماده و کپی شد');
  };
  $('#btnImportSave').onclick = function(){
    if (importBackupJson($('#backupArea').value)){
      renderMenu(); applyUiScale(); showToast('ذخیره با موفقیت بازیابی شد!');
      $('#settingsModal').classList.remove('show');
    } else {
      showToast('کد پشتیبان نامعتبر است');
    }
  };
  $('#settingsModal').classList.add('show');
}

function renderMenu(){
  renderTopBar();
  if (activeTab === 'tabPlay') renderHomeTab();
  else if (activeTab === 'tabWorlds') renderWorldsTab();
  else if (activeTab === 'tabEvo') renderEvoTab();
  else if (activeTab === 'tabCollection') renderCollectionTab();
  else if (activeTab === 'tabMissions') renderMissionsTab();
}

/* تایمر زنده تک‌جایگاه صندوق در پس‌زمینه */
setInterval(function(){
  if (state === 'menu' && activeTab === 'tabPlay' && save.slot && save.slot.unlockAt && !save.slot.ready){
    renderSingleChestSlot();
  }
}, 1000);

/* اتصال رویدادهای ثابت */
function wireEvents(){
  $$('.nav-tab').forEach(function(btn){
    btn.onclick = function(){
      sfx.click();
      activeTab = btn.getAttribute('data-tab');
      $$('.nav-tab').forEach(function(x){ x.classList.remove('active'); });
      btn.classList.add('active');
      $$('.tab-page').forEach(function(p){ p.classList.remove('active'); });
      if ($('#'+activeTab)) $('#'+activeTab).classList.add('active');
      renderMenu();
    };
  });
  $$('#colSubTabs .sub-pill').forEach(function(b){
    b.onclick = function(){ sfx.click(); colSubTab = b.getAttribute('data-sub'); renderCollectionTab(); };
  });
  $$('#misSubTabs .sub-pill').forEach(function(b){
    b.onclick = function(){ sfx.click(); misSubTab = b.getAttribute('data-sub'); renderMissionsTab(); };
  });

  if ($('#btnQuickPlay')) $('#btnQuickPlay').onclick = function(){ startGame(save.mode, save.world); };
  if ($('#btnLastReplay')) $('#btnLastReplay').onclick = function(){ startReplay(1); };
  if ($('#hudStageBadge')) $('#hudStageBadge').onclick = function(){ if (isReplay) cycleReplaySpeed(); };

  if ($('#btnDash')) $('#btnDash').onclick = function(){ triggerDash(); };
  if ($('#btnSkill')) $('#btnSkill').onclick = function(){ triggerSkill(); };
  if ($('#btnRewind')) $('#btnRewind').onclick = function(){ triggerRewind(); };

  if ($('#btnPause')) $('#btnPause').onclick = function(){ pauseGame(); };
  if ($('#btnResume')) $('#btnResume').onclick = function(){ state = 'play'; showOv(null); startMusic(); };
  if ($('#btnQuitMenu')) $('#btnQuitMenu').onclick = function(){ state = 'menu'; isReplay = false; stopMusic(); showScreen('menuScreen'); renderMenu(); };
  if ($('#btnRetry')) $('#btnRetry').onclick = function(){ startGame(mode, world, activeChallenge); };
  if ($('#btnReplayLast')) $('#btnReplayLast').onclick = function(){ startReplay(1); };
  if ($('#btnBackMenuOver')) $('#btnBackMenuOver').onclick = function(){ state = 'menu'; stopMusic(); showScreen('menuScreen'); renderMenu(); };
  if ($('#btnAgain')) $('#btnAgain').onclick = function(){ startGame(mode, world, activeChallenge); };
  if ($('#btnBackMenuWin')) $('#btnBackMenuWin').onclick = function(){ state = 'menu'; stopMusic(); showScreen('menuScreen'); renderMenu(); };

  if ($('#btnMute')) $('#btnMute').onclick = function(){ save.settings.sound = !save.settings.sound; persist(); syncAudioSettings(); renderTopBar(); };
  if ($('#btnSettings')) $('#btnSettings').onclick = function(){ sfx.click(); openSettingsModal(); };
  if ($('#btnCloseSettings')) $('#btnCloseSettings').onclick = function(){ $('#settingsModal').classList.remove('show'); };
  if ($('#btnGuide')) $('#btnGuide').onclick = function(){ sfx.click(); $('#guideModal').classList.add('show'); };
  if ($('#btnCloseGuide')) $('#btnCloseGuide').onclick = function(){ $('#guideModal').classList.remove('show'); };
  if ($('#btnCloseChestModal')) $('#btnCloseChestModal').onclick = function(){ $('#chestModal').classList.remove('show'); };

  /* آیکون‌های پیکسلی HUD */
  if ($('#icoDashBtn')) $('#icoDashBtn').innerHTML = pxImgTag('dash_ico', 18);
  if ($('#icoSkillBtn')) $('#icoSkillBtn').innerHTML = pxImgTag('dna', 18);
  if ($('#icoRewindBtn')) $('#icoRewindBtn').innerHTML = pxImgTag('rewind', 18);
  if ($('#icoHudCombo')) $('#icoHudCombo').innerHTML = pxImgTag('lightning', 14);
  if ($('#btnSettings')) $('#btnSettings').innerHTML = pxImgTag('gear', 18);
  if ($('#btnGuide')) $('#btnGuide').innerHTML = pxImgTag('book', 18);
  if ($('#btnPause')) $('#btnPause').innerHTML = pxImgTag('pause_ico', 18);
  if ($('#tbCoinIco')) $('#tbCoinIco').innerHTML = pxImgTag('coin', 15);
  if ($('#tbCryIco')) $('#tbCryIco').innerHTML = pxImgTag('crystal', 15);
  if ($('#navIcoPlay')) $('#navIcoPlay').innerHTML = pxImgTag('snake_ico', 20);
  if ($('#navIcoWorlds')) $('#navIcoWorlds').innerHTML = pxImgTag('portal', 20);
  if ($('#navIcoEvo')) $('#navIcoEvo').innerHTML = pxImgTag('dna', 20);
  if ($('#navIcoCol')) $('#navIcoCol').innerHTML = pxImgTag('trophy', 20);
  if ($('#navIcoMis')) $('#navIcoMis').innerHTML = pxImgTag('gift', 20);
}

wireEvents();
applyUiScale();
renderMenu();

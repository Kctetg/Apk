'use strict';
/* ═══════════════ رابط کاربری ۳ تبه و خلوت SNAKE: PIXEL RUSH ═══════════════ */
var toastTimer = null;
var activeTab = 'tabPlay';
var skinSubTab = 'skins';
var selectedStage = save.currentStage || 1;

function showToast(msg){
  var el = $('#crToast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ el.classList.remove('show'); }, 2200);
}

function applyUiScale(){
  var sz = (save.settings && save.settings.uiSize) || 'md';
  document.documentElement.setAttribute('data-uisize', sz);
}

function switchTab(tabId){
  activeTab = tabId;
  $$('.nav-tab').forEach(function(x){
    x.classList.toggle('active', x.getAttribute('data-tab') === tabId);
  });
  $$('.tab-page').forEach(function(p){
    p.classList.toggle('active', p.id === tabId);
  });
  renderMenu();
}

function renderTopBar(){
  if ($('#tbStage')) $('#tbStage').textContent = 'مرحله ' + faNum(save.maxStageUnlocked || 1);
  if ($('#tbGold')) $('#tbGold').textContent = faNum(save.gold);
  if ($('#tbCrystals')) $('#tbCrystals').textContent = faNum(save.crystals);
  if ($('#btnMute')){
    var snd = !save.settings || save.settings.sound !== false;
    $('#btnMute').innerHTML = pxImgTag(snd ? 'sound_on' : 'sound_off', 18);
  }
}

/* ═══════════════ تب ۱: مرحله‌ها و شروع بازی ═══════════════ */
function renderHomeTab(){
  var maxSt = Math.max(1, save.maxStageUnlocked || 1);
  if (selectedStage > maxSt) selectedStage = maxSt;
  if (selectedStage < 1) selectedStage = 1;

  var stPreview = generateForestStage(selectedStage);
  if ($('#homeStageSub')){
    $('#homeStageSub').textContent = stPreview.title + ' — ' + stPreview.goalText;
  }
  if ($('#btnPlayStage')){
    $('#btnPlayStage').textContent = 'شروع مرحله ' + faNum(selectedStage);
  }

  var grid = $('#stageGrid');
  if (!grid) return;
  grid.innerHTML = '';
  var totalShown = Math.max(15, Math.ceil((maxSt + 2) / 3) * 3);
  for (var i=1; i<=totalShown; i++){
    (function(stNum){
      var unlocked = stNum <= maxSt;
      var cleared = stNum < maxSt;
      var isSpec = (stNum % 5 === 0);
      var noHit = save.noHitStages.indexOf(stNum) !== -1;
      var secretOk = save.secretsFoundStages.indexOf(stNum) !== -1;

      var tile = document.createElement('div');
      tile.className = 'stage-tile' + (selectedStage === stNum ? ' active' : '') + (isSpec ? ' special' : '') + (!unlocked ? ' locked' : '');
      tile.innerHTML =
        '<b>مرحله ' + faNum(stNum) + '</b>' +
        '<span>' + (isSpec ? (stNum % 10 === 0 ? 'باس ویژه' : 'هزارتوی ویژه') : (cleared ? 'تکمیل‌شده' : (unlocked ? 'آماده بازی' : 'قفل'))) + '</span>' +
        '<div class="tile-marks">' +
          (noHit ? pxImgTag('shield', 12) : '') +
          (secretOk ? pxImgTag('crystal', 12) : '') +
        '</div>';
      if (unlocked){
        tile.onclick = function(){
          sfx.click();
          selectedStage = stNum;
          renderHomeTab();
        };
      }
      grid.appendChild(tile);
    })(i);
  }
}

/* ═══════════════ تب ۲: ظاهر مار (اسکین و اکسسوری) ═══════════════ */
function renderSkinsTab(){
  $$('#skinSubTabs .sub-pill').forEach(function(b){
    b.classList.toggle('on', b.getAttribute('data-sub') === skinSubTab);
  });
  var box = $('#skinListContent');
  if (!box) return;
  box.innerHTML = '';

  if (skinSubTab === 'skins'){
    SKINS.forEach(function(sk){
      var owned = save.ownedSkins.indexOf(sk.id) !== -1 || (save.maxStageUnlocked >= (sk.needStage || 999));
      if (owned && save.ownedSkins.indexOf(sk.id) === -1) save.ownedSkins.push(sk.id);
      var eq = save.skin === sk.id;
      var isCrys = sk.currency === 'crystals';
      var card = document.createElement('div');
      card.className = 'item-card' + (eq ? ' eq' : '');
      card.innerHTML =
        '<div class="swatch" style="background:'+(sk.body==='rainbow'?'linear-gradient(90deg,#ef4444,#eab308,#22c55e,#3b82f6)':sk.body)+'"></div>' +
        '<div class="ic-info"><b>'+sk.name+'</b><span>'+sk.desc+'</span></div>' +
        '<button class="btn-sm'+(eq?' on':'')+'">'+(eq?'انتخاب‌شده':(owned?'انتخاب':faNum(sk.price)+' '+(isCrys?'کریستال':'سکه')))+'</button>';
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
  } else {
    ACCESSORIES.forEach(function(ac){
      var owned = save.ownedAcc.indexOf(ac.id) !== -1;
      var eq = save.acc === ac.id;
      var isCrys = ac.currency === 'crystals';
      var card = document.createElement('div');
      card.className = 'item-card' + (eq ? ' eq' : '');
      card.innerHTML =
        pxImgTag(ac.ico, 28) +
        '<div class="ic-info"><b>'+ac.name+'</b><span>'+ac.desc+'</span></div>' +
        '<button class="btn-sm'+(eq?' on':'')+'">'+(eq?'انتخاب‌شده':(owned?'انتخاب':faNum(ac.price)+' '+(isCrys?'کریستال':'سکه')))+'</button>';
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
  }
}

/* ═══════════════ تب ۳: رکوردها ═══════════════ */
function renderRecordsTab(){
  var box = $('#recordsGrid');
  if (!box) return;
  box.innerHTML =
    '<div class="rec-card">' + pxImgTag('trophy', 24) + '<b>' + faNum(save.best || 0) + '</b><span>بهترین امتیاز</span></div>' +
    '<div class="rec-card">' + pxImgTag('timer', 24) + '<b>' + fmtDuration(save.bestTimeMs) + '</b><span>سریع‌ترین زمان مرحله</span></div>' +
    '<div class="rec-card">' + pxImgTag('shield', 24) + '<b>' + faNum(save.noHitStages.length) + '</b><span>مرحله بدون برخورد</span></div>' +
    '<div class="rec-card">' + pxImgTag('crystal', 24) + '<b>' + faNum(save.secretsFoundStages.length) + '</b><span>مسیر مخفی کشف‌شده</span></div>';
}

/* ═══════════════ تنظیمات ═══════════════ */
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
    '<div class="set-row"><span>سرعت حرکت</span><div>' +
      '<button class="mini-pill-btn'+(st.speed==='chill'?' on':'')+'" data-spd="chill">آرام</button>' +
      '<button class="mini-pill-btn'+(st.speed==='normal'?' on':'')+'" data-spd="normal">عادی</button>' +
      '<button class="mini-pill-btn'+(st.speed==='fast'?' on':'')+'" data-spd="fast">تند</button>' +
    '</div></div>' +
    '<div class="set-row"><span>اندازه رابط</span><div>' +
      '<button class="mini-pill-btn'+(st.uiSize==='sm'?' on':'')+'" data-sz="sm">کوچک</button>' +
      '<button class="mini-pill-btn'+(st.uiSize==='md'?' on':'')+'" data-sz="md">متوسط</button>' +
      '<button class="mini-pill-btn'+(st.uiSize==='lg'?' on':'')+'" data-sz="lg">بزرگ</button>' +
    '</div></div>' +
    '<div class="set-row"><span>صدا و لرزش</span><div>' +
      '<button class="mini-pill-btn'+(st.sound?' on':'')+'" id="tglSound">صدا</button>' +
      '<button class="mini-pill-btn'+(st.music?' on':'')+'" id="tglMusic">موسیقی</button>' +
      '<button class="mini-pill-btn'+(st.vibrate?' on':'')+'" id="tglVib">لرزش</button>' +
    '</div></div>' +
    '<div class="set-row" style="flex-direction:column;align-items:stretch;gap:6px;">' +
      '<span>پشتیبان‌گیری ذخیره</span>' +
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
  $('#btnExportSave').onclick = function(){
    $('#backupArea').value = exportBackupJson();
    $('#backupArea').select();
    try{ document.execCommand('copy'); }catch(e){}
    showToast('کد ذخیره کپی شد');
  };
  $('#btnImportSave').onclick = function(){
    if (importBackupJson($('#backupArea').value)){
      selectedStage = save.currentStage || 1;
      renderMenu(); applyUiScale(); showToast('ذخیره بازیابی شد!');
      $('#settingsModal').classList.remove('show');
    } else {
      showToast('کد نامعتبر است');
    }
  };
  $('#settingsModal').classList.add('show');
}

function renderMenu(){
  renderTopBar();
  if (activeTab === 'tabPlay') renderHomeTab();
  else if (activeTab === 'tabSkins') renderSkinsTab();
  else if (activeTab === 'tabRecords') renderRecordsTab();
}

function wireEvents(){
  $$('.nav-tab').forEach(function(btn){
    btn.onclick = function(){
      sfx.click();
      switchTab(btn.getAttribute('data-tab'));
    };
  });
  $$('#skinSubTabs .sub-pill').forEach(function(b){
    b.onclick = function(){ sfx.click(); skinSubTab = b.getAttribute('data-sub'); renderSkinsTab(); };
  });

  if ($('#btnPlayStage')) $('#btnPlayStage').onclick = function(){ sfx.click(); startStage(selectedStage); };
  if ($('#btnPause')) $('#btnPause').onclick = function(){ pauseGame(); };
  if ($('#btnPauseBottom')) $('#btnPauseBottom').onclick = function(){ pauseGame(); };
  if ($('#btnResume')) $('#btnResume').onclick = function(){ state = 'play'; showOv(null); startMusic(); };
  if ($('#btnRestartPause')) $('#btnRestartPause').onclick = function(){ startStage(currentStageNum); };
  if ($('#btnQuitMenu')) $('#btnQuitMenu').onclick = function(){ state = 'menu'; stopMusic(); showScreen('menuScreen'); selectedStage = save.currentStage || currentStageNum; renderMenu(); };

  if ($('#btnRetry')) $('#btnRetry').onclick = function(){ startStage(currentStageNum); };
  if ($('#btnBackMenuOver')) $('#btnBackMenuOver').onclick = function(){ state = 'menu'; stopMusic(); showScreen('menuScreen'); renderMenu(); };

  if ($('#btnNextStage')) $('#btnNextStage').onclick = function(){ selectedStage = currentStageNum + 1; startStage(selectedStage); };
  if ($('#btnAgain')) $('#btnAgain').onclick = function(){ startStage(currentStageNum); };
  if ($('#btnBackMenuWin')) $('#btnBackMenuWin').onclick = function(){ state = 'menu'; stopMusic(); showScreen('menuScreen'); selectedStage = save.currentStage || 1; renderMenu(); };

  if ($('#btnMute')) $('#btnMute').onclick = function(){ save.settings.sound = !save.settings.sound; persist(); syncAudioSettings(); renderTopBar(); };
  if ($('#btnSettings')) $('#btnSettings').onclick = function(){ sfx.click(); openSettingsModal(); };
  if ($('#btnOpenSettingsTab')) $('#btnOpenSettingsTab').onclick = function(){ sfx.click(); openSettingsModal(); };
  if ($('#btnCloseSettings')) $('#btnCloseSettings').onclick = function(){ $('#settingsModal').classList.remove('show'); };
  if ($('#btnGuide')) $('#btnGuide').onclick = function(){ sfx.click(); $('#guideModal').classList.add('show'); };
  if ($('#btnOpenGuideTab')) $('#btnOpenGuideTab').onclick = function(){ sfx.click(); $('#guideModal').classList.add('show'); };
  if ($('#btnCloseGuide')) $('#btnCloseGuide').onclick = function(){ $('#guideModal').classList.remove('show'); };

  /* آیکون‌های پیکسلی */
  if ($('#btnSettings')) $('#btnSettings').innerHTML = pxImgTag('gear', 18);
  if ($('#btnGuide')) $('#btnGuide').innerHTML = pxImgTag('book', 18);
  if ($('#btnPause')) $('#btnPause').innerHTML = pxImgTag('pause_ico', 18);
  if ($('#icoPauseBottom')) $('#icoPauseBottom').innerHTML = pxImgTag('pause_ico', 16);
  if ($('#tbCoinIco')) $('#tbCoinIco').innerHTML = pxImgTag('coin', 15);
  if ($('#tbCryIco')) $('#tbCryIco').innerHTML = pxImgTag('crystal', 15);
  if ($('#navIcoPlay')) $('#navIcoPlay').innerHTML = pxImgTag('snake_ico', 20);
  if ($('#navIcoSkins')) $('#navIcoSkins').innerHTML = pxImgTag('badge', 20);
  if ($('#navIcoRec')) $('#navIcoRec').innerHTML = pxImgTag('trophy', 20);
}

wireEvents();
checkStageSkinUnlocks(save.maxStageUnlocked || 1);
applyUiScale();
renderMenu();

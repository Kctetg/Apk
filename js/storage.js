'use strict';
var $ = function(s){ return document.querySelector(s); };
var $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
function faNum(n){ return String(n).replace(/\d/g, function(d){ return '۰۱۲۳۴۵۶۷۸۹'[d]; }); }
function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
function clamp01(v){ return Math.max(0, Math.min(1, v)); }
function hashStr(str){
  var h = 2166136261;
  for (var i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(a){
  return function(){
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function vibrate(ms){
  if (typeof save !== 'undefined' && save.settings && !save.settings.vibrate) return;
  if (window.AndroidBridge && window.AndroidBridge.vibrate) {
    try { window.AndroidBridge.vibrate(JSON.stringify(ms)); return; } catch(e){}
  }
  if (navigator.vibrate) try{ navigator.vibrate(ms); }catch(e){}
}
function lsGet(k){
  if (window.AndroidBridge && window.AndroidBridge.getPref) {
    try { var v = window.AndroidBridge.getPref(k); if (v !== null && v !== undefined && v !== '') return v; } catch(e){}
  }
  try{ return window.localStorage.getItem(k); }catch(e){ return null; }
}
function lsSet(k,v){
  if (window.AndroidBridge && window.AndroidBridge.setPref) {
    try { window.AndroidBridge.setPref(k, String(v)); } catch(e){}
  }
  try{ window.localStorage.setItem(k,v); }catch(e){}
}
function todayKey(){
  var d = new Date();
  return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
}
function weekKey(){
  var d = new Date();
  var start = new Date(d.getFullYear(), 0, 1);
  var wk = Math.ceil((((d - start) / 86400000) + start.getDay() + 1) / 7);
  return d.getFullYear() + '-W' + wk;
}

var SAVE_KEY = 'snake-pixel-rush-v3';
var LEGACY_KEY = 'neon-snake-royale-v2';

function defaultSettings(){
  return {
    control: 'both',   /* 'both' | 'swipe' | 'dpad' */
    speed: 'normal',   /* 'chill' | 'normal' | 'fast' */
    vibrate: true,
    sound: true,
    music: true,
    lowFx: false,
    uiSize: 'md'       /* 'sm' | 'md' | 'lg' */
  };
}

function defaultSave(){
  return {
    version: 3,
    gold: 40,
    crystals: 3,
    xp: 0,
    level: 1,
    evoPoints: 1,
    best: Number(lsGet('neon-snake-plus-best') || 0),
    skin: 'neon',
    acc: 'none',
    ownedSkins: ['neon'],
    ownedAcc: ['none'],
    mode: 'endless',
    world: 'forest',
    timeAttackSec: 60,
    dailySeedMode: false,
    genes: ['fire', 'frost'],
    ownedGenes: ['fire'],
    skills: { reflex: 1, power: 1, greed: 1 },
    worldRecords: {},
    worldMastery: {},
    bestTraces: {},
    rivalGhostEnabled: true,
    activeEvoForm: 'basic',
    levelRushIdx: 0,
    dailySeedKey: '',
    dailySeedBest: 0,
    discovered: [],
    achievements: [],
    slot: { type: 'bronze', unlockAt: 0, ready: false },
    dailyDay: 1,
    lastDailyTs: 0,
    lastShopGiftTs: 0,
    missionDayKey: todayKey(),
    missionWeekKey: weekKey(),
    dailyProgress: { games: 0, foods: 0, dashes: 0, combos: 0 },
    weeklyProgress: { bossWins: 0, chests: 0, rivals: 0, scoreSum: 0 },
    claimedDailyMissions: [],
    claimedWeeklyMissions: [],
    claimedSecretMissions: [],
    stats: {
      gamesPlayed: 0,
      totalApples: 0,
      bellyVisits: 0,
      bossWins: 0,
      chestsOpened: 0,
      rivalsDefeated: 0,
      wallsBroken: 0,
      closeCalls: 0,
      maxComboEver: 0,
      noHitWins: 0,
      portalsUsed: 0,
      secretsFound: 0,
      ghostWins: 0
    },
    settings: defaultSettings()
  };
}

var save = (function(){
  var def = defaultSave();
  try {
    var raw = lsGet(SAVE_KEY);
    if (!raw){
      var oldRaw = lsGet(LEGACY_KEY);
      if (oldRaw){
        var oldP = JSON.parse(oldRaw);
        def.gold = Math.max(def.gold, Number(oldP.gold || 0));
        def.crystals = Math.max(def.crystals, Number(oldP.gems || 0));
        def.xp = Number(oldP.xp || 0);
        def.level = Math.max(1, Number(oldP.level || 1));
        def.best = Math.max(def.best, Number(oldP.best || 0));
        if (Array.isArray(oldP.ownedSkins)) def.ownedSkins = oldP.ownedSkins;
        if (Array.isArray(oldP.ownedAcc)) def.ownedAcc = oldP.ownedAcc;
        if (oldP.skin) def.skin = oldP.skin;
        if (oldP.acc) def.acc = oldP.acc;
        if (oldP.stats){
          for (var sk in oldP.stats) if (def.stats[sk] !== undefined) def.stats[sk] = oldP.stats[sk];
        }
        return def;
      }
      return def;
    }
    var parsed = JSON.parse(raw);
    for (var k in def) if (parsed[k] === undefined) parsed[k] = def[k];
    if (!parsed.stats) parsed.stats = def.stats;
    for (var sk2 in def.stats) if (parsed.stats[sk2] === undefined) parsed.stats[sk2] = def.stats[sk2];
    if (!parsed.skills) parsed.skills = def.skills;
    if (!parsed.settings) parsed.settings = defaultSettings();
    for (var st in def.settings) if (parsed.settings[st] === undefined) parsed.settings[st] = def.settings[st];
    if (!parsed.worldRecords) parsed.worldRecords = {};
    if (!parsed.worldMastery) parsed.worldMastery = {};
    if (!parsed.bestTraces) parsed.bestTraces = {};
    if (!parsed.activeEvoForm) parsed.activeEvoForm = 'basic';
    if (parsed.rivalGhostEnabled === undefined) parsed.rivalGhostEnabled = true;
    if (!parsed.dailyProgress) parsed.dailyProgress = def.dailyProgress;
    if (!parsed.weeklyProgress) parsed.weeklyProgress = def.weeklyProgress;
    if (parsed.missionDayKey !== todayKey()){
      parsed.missionDayKey = todayKey();
      parsed.dailyProgress = { games: 0, foods: 0, dashes: 0, combos: 0 };
      parsed.claimedDailyMissions = [];
    }
    if (parsed.missionWeekKey !== weekKey()){
      parsed.missionWeekKey = weekKey();
      parsed.weeklyProgress = { bossWins: 0, chests: 0, rivals: 0, scoreSum: 0 };
      parsed.claimedWeeklyMissions = [];
    }
    return parsed;
  } catch(e){
    return def;
  }
})();

function persist(){
  lsSet('neon-snake-plus-best', save.best);
  lsSet(SAVE_KEY, JSON.stringify(save));
}

function exportBackupJson(){
  return JSON.stringify(save, null, 2);
}

function importBackupJson(raw){
  try {
    var parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || typeof parsed.gold !== 'number') return false;
    var def = defaultSave();
    for (var k in def) if (parsed[k] === undefined) parsed[k] = def[k];
    if (!parsed.settings) parsed.settings = defaultSettings();
    save = parsed;
    persist();
    return true;
  } catch(e){
    return false;
  }
}

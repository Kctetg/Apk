'use strict';
var $ = function(s){ return document.querySelector(s); };
var $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
function faNum(n){ return String(n).replace(/\d/g, function(d){ return '۰۱۲۳۴۵۶۷۸۹'[d]; }); }
function fmtDuration(ms){
  if (!ms) return '—';
  var s = Math.round(ms/1000);
  if (s < 60) return faNum(s) + ' ثانیه';
  return faNum(Math.floor(s/60)) + 'د ' + faNum(s%60) + 'ث';
}
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

var SAVE_KEY = 'snake-forest-v4';
var PREV_KEY = 'snake-pixel-rush-v3';
var LEGACY_KEY = 'neon-snake-royale-v2';

function defaultSettings(){
  return {
    control: 'both',   /* 'both' | 'swipe' | 'dpad' */
    speed: 'normal',   /* 'chill' | 'normal' | 'fast' */
    vibrate: true,
    sound: true,
    music: true,
    lowFx: false,
    uiSize: 'md'
  };
}

function defaultSave(){
  return {
    version: 4,
    currentStage: 1,
    maxStageUnlocked: 1,
    tutorialStepDone: 0,
    gold: 20,
    crystals: 0,
    level: 1,
    xp: 0,
    best: Number(lsGet('neon-snake-plus-best') || 0),
    bestTimeMs: 0,
    stageBestScores: {},
    noHitStages: [],
    secretsFoundStages: [],
    skin: 'neon',
    acc: 'none',
    ownedSkins: ['neon'],
    ownedAcc: ['none'],
    world: 'forest',
    mode: 'stage',
    /* فیلدهای خنثی‌شده برای سازگاری عقب‌رو */
    worldRecords: {},
    worldMastery: {},
    bestTraces: {},
    skills: { reflex: 1, power: 1, greed: 1 },
    genes: ['fire', 'frost'],
    ownedGenes: ['fire'],
    deck: ['fire_dash', 'ice_trap', 'magnet_storm'],
    ownedCards: ['fire_dash', 'ice_trap', 'magnet_storm'],
    cardLevels: { fire_dash: 1, ice_trap: 1, magnet_storm: 1 },
    discovered: [],
    achievements: [],
    stats: {
      gamesPlayed: 0,
      totalApples: 0,
      bossWins: 0,
      noHitWins: 0,
      secretsFound: 0,
      stagesCleared: 0
    },
    settings: defaultSettings()
  };
}

var save = (function(){
  var def = defaultSave();
  try {
    var raw = lsGet(SAVE_KEY) || lsGet(PREV_KEY) || lsGet(LEGACY_KEY);
    if (!raw) return def;
    var parsed = JSON.parse(raw);
    for (var k in def) if (parsed[k] === undefined) parsed[k] = def[k];
    if (!parsed.stats) parsed.stats = def.stats;
    for (var sk in def.stats) if (parsed.stats[sk] === undefined) parsed.stats[sk] = def.stats[sk];
    if (!parsed.settings) parsed.settings = defaultSettings();
    for (var st in def.settings) if (parsed.settings[st] === undefined) parsed.settings[st] = def.settings[st];
    if (!Array.isArray(parsed.ownedSkins) || !parsed.ownedSkins.length) parsed.ownedSkins = ['neon'];
    if (!Array.isArray(parsed.ownedAcc) || !parsed.ownedAcc.length) parsed.ownedAcc = ['none'];
    if (!Array.isArray(parsed.noHitStages)) parsed.noHitStages = [];
    if (!Array.isArray(parsed.secretsFoundStages)) parsed.secretsFoundStages = [];
    if (!parsed.stageBestScores || typeof parsed.stageBestScores !== 'object') parsed.stageBestScores = {};
    parsed.currentStage = Math.max(1, Number(parsed.currentStage || 1));
    parsed.maxStageUnlocked = Math.max(parsed.currentStage, Number(parsed.maxStageUnlocked || 1));
    parsed.tutorialStepDone = Math.max(0, Number(parsed.tutorialStepDone || 0));
    parsed.world = 'forest';
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
    parsed.world = 'forest';
    save = parsed;
    persist();
    return true;
  } catch(e){
    return false;
  }
}

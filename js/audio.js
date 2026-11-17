'use strict';
var audioCtx = null;
var musicTimer = null;
var musicStep = 0;

function ensureAudio(){
  if (!audioCtx){
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function isSoundEnabled(){
  return !save || !save.settings || save.settings.sound !== false;
}
function isMusicEnabled(){
  return isSoundEnabled() && (!save || !save.settings || save.settings.music !== false);
}

function tone(f, dur, delay, vol, wave){
  if (!isSoundEnabled()) return;
  try {
    var ac = ensureAudio();
    var t0 = ac.currentTime + (delay || 0);
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = wave || 'square';
    o.frequency.value = f;
    g.gain.setValueAtTime(vol || 0.055, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  } catch(e){}
}

function noiseBurst(dur, vol){
  if (!isSoundEnabled()) return;
  try {
    var ac = ensureAudio();
    var len = Math.floor(ac.sampleRate * dur);
    var buf = ac.createBuffer(1, len, ac.sampleRate);
    var data = buf.getChannelData(0);
    for (var i=0;i<len;i++) data[i] = (Math.random()*2 - 1) * (1 - i/len);
    var src = ac.createBufferSource(); src.buffer = buf;
    var g = ac.createGain(); g.gain.value = vol || 0.09;
    src.connect(g); g.connect(ac.destination); src.start();
  } catch(e){}
}

var sfx = {
  eat:      function(){ tone(640, .055); tone(960, .07, .045, .045); },
  gold:     function(){ tone(784, .08); tone(988, .08, .06); tone(1175, .09, .12); },
  crystal:  function(){ tone(880, .08, 0, .05, 'triangle'); tone(1320, .11, .06, .05, 'triangle'); },
  dash:     function(){ tone(420, .06, 0, .05, 'sawtooth'); tone(820, .08, .04, .04, 'square'); noiseBurst(.07, .04); },
  portal:   function(){ [380,570,850,1240].forEach(function(f,i){ tone(f, .07, i*.05, .05, 'triangle'); }); },
  wallBreak:function(){ noiseBurst(.18, .11); tone(140, .14, 0, .09, 'sawtooth'); },
  rewind:   function(){ [1040,820,640,460].forEach(function(f,i){ tone(f, .06, i*.045, .05); }); },
  combo:    function(n){ var base = 520 + Math.min(n||1, 10)*45; tone(base, .06, 0, .05); tone(base*1.25, .08, .05, .05); },
  closeCall:function(){ tone(920, .05, 0, .05, 'triangle'); tone(1380, .08, .04, .05, 'triangle'); },
  power:    function(){ tone(523, .08); tone(659, .08, .07); tone(784, .1, .14); },
  bomb:     function(){ tone(110, .25, 0, .1); noiseBurst(.22, .11); },
  die:      function(){ tone(392, .14); tone(330, .14, .12); tone(262, .18, .24); },
  click:    function(){ tone(520, .035, 0, .025); },
  start:    function(){ tone(523, .08); tone(659, .08, .08); tone(784, .11, .16); },
  roar:     function(){ noiseBurst(.6, .12); tone(64, .7, 0, .12); tone(48, .8, .18, .12); },
  fire:     function(){ noiseBurst(.4, .1); },
  chomp:    function(){ tone(180, .08, 0, .09); tone(120, .1, .05, .07); },
  gulp:     function(){ tone(300, .14, 0, .08); tone(150, .22, .12, .08); },
  warp:     function(){ [400,600,900,1300].forEach(function(f,i){ tone(f,.07,i*.06,.06); }); },
  shoot:    function(){ tone(880, .06, 0, .06); tone(1200, .05, .04, .04); },
  hit:      function(){ tone(200, .12, 0, .09); noiseBurst(.14, .07); },
  bosshit:  function(){ tone(150, .18, 0, .11); tone(90, .22, .07, .09); },
  chest:    function(){ [523,659,784,1047].forEach(function(f,i){ tone(f,.1,i*.08,.06); }); },
  win:      function(){ [523,659,784,1047,1319].forEach(function(f,i){ tone(f,.14,i*.11,.07); }); }
};

/* موسیقی ۸بیتی سبک و قابل قطع */
var BGM_NOTES = [261.6, 329.6, 392.0, 523.3, 392.0, 329.6, 293.7, 349.2, 440.0, 392.0, 329.6, 293.7, 261.6, 392.0, 329.6, 246.9];
function startMusic(){
  if (!isMusicEnabled() || musicTimer) return;
  musicTimer = setInterval(function(){
    if (!isMusicEnabled() || (typeof state !== 'undefined' && state !== 'play')) return;
    var f = BGM_NOTES[musicStep % BGM_NOTES.length];
    musicStep++;
    tone(f, 0.14, 0, 0.016, 'triangle');
    if (musicStep % 4 === 0) tone(f * 0.5, 0.18, 0, 0.014, 'square');
  }, 240);
}
function stopMusic(){
  if (musicTimer){ clearInterval(musicTimer); musicTimer = null; }
}
function syncAudioSettings(){
  if (!isMusicEnabled()) stopMusic();
  else if (typeof state !== 'undefined' && state === 'play') startMusic();
}

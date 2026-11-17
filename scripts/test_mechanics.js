#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');

function makeSandbox() {
  const lsStore = new Map();
  const dummyCtx = {
    fillStyle: '#000',
    strokeStyle: '#000',
    globalAlpha: 1,
    lineWidth: 1,
    font: '12px sans-serif',
    textAlign: 'center',
    fillRect() {},
    strokeRect() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    arc() {},
    fill() {},
    stroke() {},
    closePath() {},
    fillText() {},
    save() {},
    restore() {},
    drawImage() {},
    translate() {},
    rotate() {},
    scale() {},
    createRadialGradient() {
      return { addColorStop() {} };
    },
    clearRect() {}
  };
  function makeCanvas() {
    return {
      width: 300,
      height: 300,
      style: {},
      getContext() { return dummyCtx; },
      toDataURL() { return 'data:image/png;base64,stub'; }
    };
  }
  function makeEl() {
    return {
      style: {},
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      setAttribute() {},
      getAttribute() { return ''; },
      addEventListener() {},
      appendChild() {},
      querySelector() { return makeEl(); },
      querySelectorAll() { return []; },
      getBoundingClientRect() { return { width: 320, height: 320 }; },
      textContent: '',
      innerHTML: '',
      value: '',
      select() {}
    };
  }

  const sandbox = {
    console,
    Math,
    Date,
    JSON,
    Number,
    String,
    Array,
    Object,
    Set,
    Map,
    Uint8Array,
    setTimeout,
    clearTimeout,
    setInterval() { return 1; },
    clearInterval() {},
    requestAnimationFrame() { return 1; },
    navigator: { vibrate() {} },
    localStorage: {
      getItem(k) { return lsStore.has(k) ? lsStore.get(k) : null; },
      setItem(k, v) { lsStore.set(k, String(v)); }
    },
    document: {
      visibilityState: 'visible',
      documentElement: { setAttribute() {} },
      createElement(tag) { return tag === 'canvas' ? makeCanvas() : makeEl(); },
      querySelector(sel) {
        if (sel === '#game' || sel === '#previewCanvas') return makeCanvas();
        return makeEl();
      },
      querySelectorAll() { return []; },
      addEventListener() {},
      execCommand() {}
    },
    window: null
  };
  sandbox.window = sandbox;
  sandbox.addEventListener = function() {};
  return sandbox;
}

function loadEngine() {
  const sandbox = makeSandbox();
  vm.createContext(sandbox);
  const files = [
    'js/storage.js',
    'js/audio.js',
    'js/snake.js',
    'js/worlds.js',
    'js/enemies.js',
    'js/modes.js',
    'js/progression.js',
    'js/renderer.js',
    'js/core.js'
  ];
  for (const rel of files) {
    const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    vm.runInContext(code, sandbox, { filename: rel });
  }
  return sandbox;
}

function runTests() {
  const g = loadEngine();
  let passed = 0;

  // 1. Rival Ghost Uniform Downsampling (Bug Fix verification)
  const rawTrace = [];
  for (let i = 0; i < 600; i++) {
    rawTrace.push({ snake: [{ x: i % 19, y: Math.floor(i / 19) % 19 }], score: i * 5 });
  }
  const sampled = g.downsampleFrames(rawTrace, 240);
  assert.strictEqual(sampled.length, 240, 'Sampled ghost trace must have 240 frames');
  assert.strictEqual(sampled[0].score, 0, 'Sampled ghost must start at tick 0 (score 0), not tail');
  assert.strictEqual(sampled[sampled.length - 1].score, 599 * 5, 'Sampled ghost must preserve final frame');
  assert.ok(sampled[120].score > 1400 && sampled[120].score < 1600, 'Midpoint must align proportionally');
  passed++;

  // 2. BFS Reachability & Maze Layout across all 6 Ranked Arenas
  assert.strictEqual(g.WORLDS_ORDER.length, 6, 'Must have 6 arenas');
  for (let a = 0; a < g.WORLDS_ORDER.length; a++) {
    const wid = g.WORLDS_ORDER[a];
    const wo = g.getWorldObj(wid);
    assert.strictEqual(wo.arenaNum, a + 1, 'Arena number must match index');
    assert.ok(wo.lvRange && wo.lvRange.length > 0, 'Arena must define level range');
    for (let seed = 1; seed <= 3; seed++) {
      const rand = g.mulberry32(seed * 1337 + a * 97);
      const layout = g.generateWorldLayout(wid, seed, rand);
      assert.ok(g.validateReachable(layout.walls, 4, 9), `Arena ${wid} seed ${seed} failed BFS reachability`);
      assert.strictEqual(layout.secretWalls.length, 2, 'Each arena layout generates 2 secret breakable walls');
      assert.strictEqual(layout.switches.length, 2, 'Each arena layout generates 2 ordered puzzle switches');
      assert.strictEqual(layout.switches[0].order, 1);
      assert.strictEqual(layout.switches[1].order, 2);
    }
  }
  passed++;

  // 3. All 6 Secret Room types generate validly
  const seenKinds = new Set();
  for (let r = 0; r < 6; r++) {
    const sr = g.generateSecretRoom(() => r / 6 + 0.01);
    seenKinds.add(sr.kind);
    assert.ok(sr.exit && typeof sr.exit.x === 'number', 'Secret room must have exit coordinate');
    assert.ok(sr.items.length >= 3, `Secret room ${sr.kind} must contain items`);
  }
  assert.strictEqual(seenKinds.size, 6, 'All 6 secret room kinds must be reachable');
  passed++;

  // 4. Fog of War radius & state toggle
  g.save.fogEnabled = true;
  g.inSecretRoom = false;
  assert.strictEqual(g.isFogActive(), true, 'Fog must activate when save.fogEnabled is true');
  g.exploredMap = {};
  g.snake = [{ x: 9, y: 9 }, { x: 8, y: 9 }];
  g.updateFogVisibility();
  assert.strictEqual(g.isCellExplored(9, 9), true, 'Head cell must be explored');
  assert.strictEqual(g.isCellExplored(12, 9), true, 'Cell within Manhattan distance 4 must be explored');
  assert.strictEqual(g.isCellExplored(0, 0), false, 'Distant cell must remain in fog');
  passed++;

  // 5. Tactical Cards Lv 1-3 & Unlocks + Arena Rank Tiers
  assert.strictEqual(g.TACTICAL_CARDS.length, 8, 'Must define 8 tactical cards');
  assert.strictEqual(g.getCardLevel('fire_dash'), 1);
  g.save.cardLevels.fire_dash = 5;
  assert.strictEqual(g.getCardLevel('fire_dash'), 3, 'Card level clamps cleanly to max Lv 3');
  g.save.level = 10;
  g.checkCardUnlocks();
  assert.strictEqual(g.save.ownedCards.length, 8, 'All 8 cards unlock through level progression');

  const mast = g.getWorldMastery('forest');
  mast.scoreBadge = false; mast.noHitBadge = false; mast.comboBadge = false; mast.challengeDone = false;
  assert.strictEqual(g.getArenaRankTier('forest').id, 'none');
  mast.scoreBadge = true;
  assert.strictEqual(g.getArenaRankTier('forest').id, 'bronze');
  mast.comboBadge = true;
  assert.strictEqual(g.getArenaRankTier('forest').id, 'silver');
  mast.noHitBadge = true; mast.challengeDone = true;
  assert.strictEqual(g.getArenaRankTier('forest').id, 'gold');
  passed++;

  // 6. Visual Evolution Forms & Relics
  assert.strictEqual(g.EVO_FORMS.length, 5, 'Must define 5 evolution forms');
  g.save.level = 20;
  g.save.activeEvoForm = 'legend';
  assert.strictEqual(g.getEffectiveEvoForm(), 'legend', 'Level 20 activates legend form');
  g.save.level = 4;
  assert.strictEqual(g.getEffectiveEvoForm(), 'basic', 'Low level gracefully falls back to basic form');

  assert.strictEqual(g.RELICS.length, 5, 'Must define 5 run relics');
  g.activeRelics = ['dragon_scale'];
  assert.strictEqual(g.hasRelic('dragon_scale'), true);
  passed++;

  console.log(`ALL ${passed} MECHANICS TEST SUITES PASSED`);
}

runTests();

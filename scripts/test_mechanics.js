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

  // 1. 3-Stage Onboarding Tutorial Progression
  const s1 = g.generateForestStage(1);
  assert.strictEqual(s1.applesGoal, 5);
  assert.strictEqual(s1.needKey, false);
  assert.strictEqual(s1.walls.length, 0, 'Stage 1 has zero internal walls');
  assert.ok(s1.tutorialHint.length > 0);

  const s2 = g.generateForestStage(2);
  assert.strictEqual(s2.applesGoal, 6);
  assert.strictEqual(s2.needKey, false);
  assert.ok(s2.walls.length > 0, 'Stage 2 introduces walls');

  const s3 = g.generateForestStage(3);
  assert.strictEqual(s3.needKey, true, 'Stage 3 introduces yellow key');
  assert.ok(s3.keyPos && typeof s3.keyPos.x === 'number');
  passed++;

  // 2. Stage 4 Secret Switch Chamber & BFS Reachability Across Stages 1..20
  const s4 = g.generateForestStage(4);
  assert.strictEqual(s4.secretWalls.length, 1);
  assert.strictEqual(s4.switches.length, 1);
  assert.ok(s4.secretItems.length >= 2, 'Secret alcove contains reward items');

  for (let st = 1; st <= 20; st++) {
    const def = g.generateForestStage(st);
    const targets = [def.doorPos];
    if (def.keyPos) targets.push(def.keyPos);
    assert.ok(
      g.validateReachable(def.walls.concat(def.secretWalls), 4, 9, targets),
      `Stage ${st} failed BFS reachability to key & green exit`
    );
  }
  passed++;

  // 3. Every 5th Stage Special Milestone (5 = Guardian Secret Maze, 10 = Forest Dragon Boss)
  const s5 = g.generateForestStage(5);
  assert.strictEqual(s5.isSpecial, true);
  assert.strictEqual(s5.specialKind, 'secret_maze');
  assert.strictEqual(s5.hasGuardian, true);

  const s10 = g.generateForestStage(10);
  assert.strictEqual(s10.isSpecial, true);
  assert.strictEqual(s10.specialKind, 'boss');
  assert.strictEqual(s10.hasBoss, true);
  assert.ok(s10.bossHp >= 3);
  passed++;

  // 4. Strict Red Apple / Key / Exit Gate Unlock & End-to-End Pickup Invariant
  g.startStage(3);
  assert.strictEqual(g.exitUnlocked, false, 'Exit stays locked before goal + key');
  g.awardPickup('apple', 5, 9);
  g.awardPickup('apple', 6, 9);
  g.awardPickup('apple', 7, 9);
  g.awardPickup('key', 15, 3);
  assert.strictEqual(g.exitUnlocked, true, 'Exit unlocks green once apples & key collected');
  g.ensureGoalItemsPresent();
  assert.ok(g.doorCell && g.doorCell.x === 17);
  g.endStageWin();
  assert.strictEqual(g.save.maxStageUnlocked >= 4, true, 'Winning stage 3 unlocks stage 4');
  passed++;

  // 5. Stage-based Skin Unlocks & Records Tracking
  const unlocked = g.checkStageSkinUnlocks(5);
  assert.ok(g.save.ownedSkins.indexOf('viper') !== -1, 'Stage 3 skin unlocked');
  assert.ok(g.save.ownedSkins.indexOf('frost') !== -1, 'Stage 5 skin unlocked');
  assert.ok(unlocked.length >= 1, 'Stage 5 unlocks frost skin');
  passed++;

  console.log(`ALL ${passed} PIXEL FOREST LABYRINTH TEST SUITES PASSED`);
}

runTests();

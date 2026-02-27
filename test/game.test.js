import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialDeck, createGameState, createTestHarness } from '../src/game.js';

function findPairIndexes(state) {
  const map = new Map();
  for (let i = 0; i < state.deck.length; i += 1) {
    const card = state.deck[i];
    if (card.kind !== 'pair') continue;
    const arr = map.get(card.symbol) || [];
    arr.push(i);
    map.set(card.symbol, arr);
  }
  return [...map.values()].filter((arr) => arr.length === 2);
}

test('createInitialDeck returns 16 cards including one power and one filler card', () => {
  const deck = createInitialDeck();
  assert.equal(deck.length, 16);
  const powerCards = deck.filter((card) => card.kind === 'power-reveal');
  const fillerCards = deck.filter((card) => card.kind === 'filler');
  assert.equal(powerCards.length, 1);
  assert.equal(fillerCards.length, 1);
});

test('game state starts with deterministic scoring fields', () => {
  const state = createGameState();
  assert.equal(state.score, 0);
  assert.equal(state.moves, 0);
  assert.equal(state.matchedPairs, 0);
  assert.equal(state.totalPairs, 7);
});

test('tutorial progresses through start, first flip, and first match', () => {
  const harness = createTestHarness(20260226, 'classic');
  harness.start();
  let state = harness.getState();
  assert.equal(state.tutorialStep >= 1, true);

  const firstPair = findPairIndexes(state)[0];
  harness.flip(firstPair[0]);
  state = harness.getState();
  assert.equal(state.tutorialStep >= 2, true);

  harness.flip(firstPair[1]);
  state = harness.getState();
  assert.equal(state.matchedPairs, 1);
  assert.equal(state.tutorialStep >= 3, true);
});

test('classic mode enforces hint limit and score cost', () => {
  const harness = createTestHarness(20260226, 'classic');
  harness.start();
  const state = harness.getState();
  state.score = 30;

  harness.useHint();
  harness.advance(1300);
  harness.useHint();
  harness.advance(1300);
  harness.useHint();

  assert.equal(harness.getState().hintsUsed, 2);
  assert.equal(harness.getState().score, 20);
  assert.match(harness.getState().message, /No hints remaining/);
});

test('zen mode allows unlimited hints with zero score cost', () => {
  const harness = createTestHarness(20260226, 'zen');
  harness.start();
  const state = harness.getState();
  state.score = 4;

  harness.useHint();
  harness.advance(1300);
  harness.useHint();
  harness.advance(1300);
  harness.useHint();

  assert.equal(harness.getState().hintsUsed, 3);
  assert.equal(harness.getState().score, 4);
  assert.equal(harness.getState().modeId, 'zen');
});

test('sprint mode ends with time_up when timer reaches zero', () => {
  const harness = createTestHarness(20260226, 'sprint');
  harness.start();
  harness.advance(90000);

  assert.equal(harness.getState().mode, 'time_up');
  assert.equal(harness.getState().phase, 'time_up');
  assert.equal(harness.getState().sprintTimeRemainingMs, 0);
});

test('sprint mode awards streak bonuses on consecutive matches', () => {
  const harness = createTestHarness(20260226, 'sprint');
  harness.start();

  const pairs = findPairIndexes(harness.getState());
  harness.flip(pairs[0][0]);
  harness.flip(pairs[0][1]);
  assert.equal(harness.getState().score, 10);
  assert.equal(harness.getState().streak, 1);

  harness.flip(pairs[1][0]);
  harness.flip(pairs[1][1]);
  assert.equal(harness.getState().score, 24);
  assert.equal(harness.getState().streak, 2);
  assert.equal(harness.getState().maxStreak, 2);
});

test('serialize output contains extended clarity fields', () => {
  const harness = createTestHarness(20260226, 'sprint');
  harness.start();
  const payload = JSON.parse(harness.serialize());

  assert.equal(typeof payload.modeId, 'string');
  assert.equal(typeof payload.modeLabel, 'string');
  assert.equal(typeof payload.phase, 'string');
  assert.equal(typeof payload.tutorialVisible, 'boolean');
  assert.equal(typeof payload.tutorialStep, 'number');
  assert.equal(typeof payload.tutorialStepTitle, 'string');
  assert.equal(payload.hintActive, false);
  assert.equal(Array.isArray(payload.controlsLegend), true);
  assert.equal(typeof payload.sprintTimeRemainingMs, 'number');
  assert.equal(typeof payload.streak, 'number');
  assert.equal(typeof payload.maxStreak, 'number');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialDeck, createGameState } from '../src/game.js';

test('createInitialDeck returns 16 cards including one power card', () => {
  const deck = createInitialDeck();
  assert.equal(deck.length, 16);
  const powerCards = deck.filter((card) => card.kind === 'power-reveal');
  assert.equal(powerCards.length, 1);
});

test('game state starts with deterministic scoring fields', () => {
  const state = createGameState();
  assert.equal(state.score, 0);
  assert.equal(state.moves, 0);
  assert.equal(state.matchedPairs, 0);
  assert.equal(state.totalPairs, 7);
});

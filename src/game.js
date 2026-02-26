export function createInitialDeck() {
  return [];
}

export function createGameState() {
  return {
    mode: 'start',
    deck: createInitialDeck(),
    score: 0,
    moves: 0,
    matchedPairs: 0,
    totalPairs: 8,
    paused: false,
    message: 'Press start'
  };
}

export function createGame() {
  return createGameState();
}

const GRID_SIZE = 4;
const CARD_COUNT = GRID_SIZE * GRID_SIZE;
const PAIR_SYMBOLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const STEP_MS = 1000 / 60;
const DEFAULT_MODE_ID = 'classic';

export const MODE_CONFIGS = {
  classic: {
    id: 'classic',
    label: 'Classic',
    missPenalty: 2,
    hintCost: 5,
    hintLimit: 2,
    sprintDurationMs: null
  },
  zen: {
    id: 'zen',
    label: 'Zen',
    missPenalty: 0,
    hintCost: 0,
    hintLimit: null,
    sprintDurationMs: null
  },
  sprint: {
    id: 'sprint',
    label: 'Sprint',
    missPenalty: 2,
    hintCost: 5,
    hintLimit: 2,
    sprintDurationMs: 90000
  }
};

const TUTORIAL_STEPS = [
  {
    id: 'start',
    title: 'Step 1: Start Round',
    body: 'Press Start (or Enter) to begin this round.',
    check: (state) => state.tutorialFlags.started
  },
  {
    id: 'flip',
    title: 'Step 2: Flip A Card',
    body: 'Flip any hidden card to reveal its symbol.',
    check: (state) => state.tutorialFlags.firstFlip
  },
  {
    id: 'match',
    title: 'Step 3: Match A Pair',
    body: 'Match two identical symbols to lock your first pair.',
    check: (state) => state.tutorialFlags.firstMatch
  },
  {
    id: 'power',
    title: 'Step 4: Trigger ★',
    body: 'Reveal the ★ card once to peek a hidden pair.',
    check: (state) => state.tutorialFlags.powerUsed
  },
  {
    id: 'finish',
    title: 'Step 5: Clear The Board',
    body: 'Match all seven pairs to win the round.',
    check: (state) => state.tutorialFlags.won
  }
];

function mulberry32(seed) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function deterministicShuffle(items, seed) {
  const output = [...items];
  const rand = mulberry32(seed);
  for (let i = output.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [output[i], output[j]] = [output[j], output[i]];
  }
  return output;
}

function cardPosition(index) {
  return {
    col: index % GRID_SIZE,
    row: Math.floor(index / GRID_SIZE)
  };
}

function createDeckTemplate() {
  const pairs = PAIR_SYMBOLS.flatMap((symbol) => [
    { kind: 'pair', symbol },
    { kind: 'pair', symbol }
  ]);
  return [...pairs, { kind: 'power-reveal', symbol: '★' }, { kind: 'filler', symbol: '?' }];
}

export function createInitialDeck(seed = 20260226) {
  const shuffled = deterministicShuffle(createDeckTemplate(), seed);
  return shuffled.slice(0, CARD_COUNT).map((card, index) => ({
    id: `card-${index}`,
    kind: card.kind,
    symbol: card.symbol,
    faceUp: false,
    matched: false,
    tempReveal: false,
    ...cardPosition(index)
  }));
}

function resolveMode(modeId) {
  return MODE_CONFIGS[modeId] || MODE_CONFIGS[DEFAULT_MODE_ID];
}

export function createGameState(seed = 20260226, modeId = DEFAULT_MODE_ID) {
  const deck = createInitialDeck(seed);
  const mode = resolveMode(modeId);
  return {
    seed,
    mode: 'start',
    modeId: mode.id,
    modeLabel: mode.label,
    modeRules: mode,
    deck,
    score: 0,
    moves: 0,
    matchedPairs: 0,
    totalPairs: PAIR_SYMBOLS.length,
    paused: false,
    phase: 'start',
    message: 'Press Start or Enter',
    tutorialVisible: true,
    tutorialCompleted: false,
    tutorialStep: 0,
    tutorialFlags: {
      started: false,
      firstFlip: false,
      firstMatch: false,
      powerUsed: false,
      won: false
    },
    selected: [],
    cursorIndex: 0,
    inputLocked: false,
    timers: [],
    elapsedMs: 0,
    restartCount: 0
  };
}

function addTimer(state, durationMs, callback) {
  state.timers.push({ remaining: durationMs, callback });
}

function getTutorialStep(state) {
  return TUTORIAL_STEPS[state.tutorialStep] || null;
}

function syncTutorialProgress(state) {
  if (state.tutorialCompleted) {
    return;
  }

  while (state.tutorialStep < TUTORIAL_STEPS.length) {
    const step = TUTORIAL_STEPS[state.tutorialStep];
    if (!step.check(state)) {
      break;
    }
    state.tutorialStep += 1;
  }

  if (state.tutorialStep >= TUTORIAL_STEPS.length) {
    state.tutorialCompleted = true;
    state.tutorialVisible = false;
  }
}

function setCardFace(card, nextFaceUp) {
  if (!card.matched) {
    card.faceUp = nextFaceUp;
  }
}

function findHiddenPair(state) {
  const bucket = new Map();
  for (const card of state.deck) {
    if (card.kind !== 'pair' || card.matched || card.faceUp) {
      continue;
    }
    const group = bucket.get(card.symbol) ?? [];
    group.push(card);
    bucket.set(card.symbol, group);
  }
  for (const group of bucket.values()) {
    if (group.length >= 2) {
      return [group[0], group[1]];
    }
  }
  return null;
}

function consumePowerReveal(state) {
  const pair = findHiddenPair(state);
  if (!pair) {
    state.message = 'Power card flipped: no hidden pair left.';
    return;
  }

  for (const card of pair) {
    card.faceUp = true;
    card.tempReveal = true;
  }

  addTimer(state, 850, () => {
    for (const card of pair) {
      if (!card.matched && card.tempReveal) {
        card.faceUp = false;
      }
      card.tempReveal = false;
    }
  });

  state.tutorialFlags.powerUsed = true;
  syncTutorialProgress(state);
  state.message = `Power reveal: peeked pair ${pair[0].symbol}.`;
}

function resolvePair(state) {
  if (state.selected.length !== 2) {
    return;
  }

  const [aIndex, bIndex] = state.selected;
  const a = state.deck[aIndex];
  const b = state.deck[bIndex];
  state.moves += 1;

  if (a.symbol === b.symbol && a.kind === 'pair' && b.kind === 'pair') {
    a.matched = true;
    b.matched = true;
    state.matchedPairs += 1;
    state.score += 10;
    state.tutorialFlags.firstMatch = true;
    syncTutorialProgress(state);
    state.selected = [];
    state.phase = 'waiting_first';
    state.message = `Match: ${a.symbol}`;

    if (state.matchedPairs >= state.totalPairs) {
      state.mode = 'won';
      state.phase = 'won';
      state.tutorialFlags.won = true;
      syncTutorialProgress(state);
      state.message = 'All pairs matched. Press R to reset.';
    }
    return;
  }

  state.score = Math.max(0, state.score - state.modeRules.missPenalty);
  state.inputLocked = true;
  state.phase = 'resolving';
  state.message = 'Miss: cards will flip back.';

  addTimer(state, 700, () => {
    setCardFace(a, false);
    setCardFace(b, false);
    state.selected = [];
    state.inputLocked = false;
    state.phase = 'waiting_first';
  });
}

function flipCard(state, index) {
  if (state.mode !== 'playing' || state.paused || state.inputLocked) {
    return;
  }

  const card = state.deck[index];
  if (!card || card.faceUp || card.matched) {
    return;
  }

  card.faceUp = true;
  state.tutorialFlags.firstFlip = true;
  syncTutorialProgress(state);

  if (card.kind === 'power-reveal') {
    state.score += 2;
    consumePowerReveal(state);
    addTimer(state, 550, () => {
      if (!card.matched) {
        card.faceUp = false;
      }
    });
    return;
  }

  if (card.kind !== 'pair') {
    state.message = 'Wildcard card: no score effect.';
    addTimer(state, 500, () => {
      if (!card.matched) {
        card.faceUp = false;
      }
    });
    return;
  }

  state.selected.push(index);
  state.phase = state.selected.length === 1 ? 'waiting_second' : 'resolving';
  if (state.selected.length === 2) {
    resolvePair(state);
  }
}

function advanceTimers(state, deltaMs) {
  if (state.paused || state.mode === 'start') {
    return;
  }

  for (const timer of state.timers) {
    timer.remaining -= deltaMs;
  }

  const ready = state.timers.filter((timer) => timer.remaining <= 0);
  state.timers = state.timers.filter((timer) => timer.remaining > 0);

  for (const timer of ready) {
    timer.callback();
  }
}

function serializeState(state) {
  const tutorialStep = getTutorialStep(state);
  const visibleCards = state.deck
    .filter((card) => card.faceUp || card.matched)
    .map((card) => ({
      id: card.id,
      kind: card.kind,
      symbol: card.symbol,
      col: card.col,
      row: card.row,
      matched: card.matched
    }));

  return JSON.stringify({
    coordinate_system: 'origin top-left, col grows right, row grows down',
    mode: state.mode,
    modeId: state.modeId,
    modeLabel: state.modeLabel,
    phase: state.phase,
    tutorialVisible: state.tutorialVisible,
    tutorialStep: state.tutorialStep,
    tutorialStepTitle: tutorialStep ? tutorialStep.title : 'Completed',
    paused: state.paused,
    score: state.score,
    moves: state.moves,
    matchedPairs: state.matchedPairs,
    totalPairs: state.totalPairs,
    selected: [...state.selected],
    cursorIndex: state.cursorIndex,
    visibleCards,
    hiddenCount: state.deck.length - visibleCards.length,
    message: state.message,
    timersPending: state.timers.length
  });
}

function resetState(baseSeed, restartCount) {
  const nextSeed = baseSeed + restartCount;
  const next = createGameState(nextSeed, DEFAULT_MODE_ID);
  next.mode = 'playing';
  next.message = 'Find all matching pairs.';
  next.phase = 'waiting_first';
  next.restartCount = restartCount;
  next.cursorIndex = 0;
  return next;
}

export function createGame(root) {
  let state = createGameState();

  root.innerHTML = `
    <main class="shell">
      <header>
        <h1>Memory Power Reveals</h1>
        <p class="sub">Match pairs, then use ★ to peek one hidden pair.</p>
      </header>
      <section class="hud">
        <div>Score: <strong id="score">0</strong></div>
        <div>Moves: <strong id="moves">0</strong></div>
        <div>Pairs: <strong id="pairs">0</strong>/<span id="pairs-total">7</span></div>
      </section>
      <section class="controls">
        <button id="start-btn" type="button">Start</button>
        <button id="pause-btn" type="button">Pause (P)</button>
        <button id="reset-btn" type="button">Reset (R)</button>
      </section>
      <section id="tutorial" class="tutorial" aria-live="polite"></section>
      <section id="board" class="board" aria-label="game board"></section>
      <p id="message" class="message"></p>
      <p class="hint">Keys: P pause, R reset, 1-16 flips slots.</p>
    </main>
  `;

  const scoreNode = root.querySelector('#score');
  const movesNode = root.querySelector('#moves');
  const pairsNode = root.querySelector('#pairs');
  const pairsTotalNode = root.querySelector('#pairs-total');
  const messageNode = root.querySelector('#message');
  const tutorialNode = root.querySelector('#tutorial');
  const boardNode = root.querySelector('#board');
  const startBtn = root.querySelector('#start-btn');
  const pauseBtn = root.querySelector('#pause-btn');
  const resetBtn = root.querySelector('#reset-btn');

  function render() {
    scoreNode.textContent = String(state.score);
    movesNode.textContent = String(state.moves);
    pairsNode.textContent = String(state.matchedPairs);
    pairsTotalNode.textContent = String(state.totalPairs);
    messageNode.textContent = state.message;
    pauseBtn.textContent = state.paused ? 'Resume (P)' : 'Pause (P)';

    const tutorialStep = getTutorialStep(state);
    if (state.tutorialVisible && tutorialStep) {
      tutorialNode.hidden = false;
      tutorialNode.innerHTML = `
        <h2>${tutorialStep.title}</h2>
        <p>${tutorialStep.body}</p>
      `;
    } else {
      tutorialNode.hidden = true;
      tutorialNode.innerHTML = '';
    }

    boardNode.innerHTML = '';
    for (let i = 0; i < state.deck.length; i += 1) {
      const card = state.deck[i];
      const button = document.createElement('button');
      button.className = 'card';
      button.dataset.index = String(i);
      button.setAttribute('type', 'button');

      if (card.matched) {
        button.classList.add('matched');
      }
      if (card.faceUp || card.matched) {
        button.classList.add('face-up');
        button.textContent = card.symbol;
      } else {
        button.textContent = '•';
      }

      if (card.kind === 'power-reveal') {
        button.classList.add('power');
      }
      if (i === state.cursorIndex && state.mode === 'playing') {
        button.classList.add('cursor');
      }

      if (state.mode !== 'playing' || state.paused || state.inputLocked || card.matched) {
        button.disabled = true;
      }

      button.addEventListener('click', () => {
        flipCard(state, i);
        render();
      });

      boardNode.appendChild(button);
    }
  }

  function startGame() {
    if (state.mode === 'start') {
      state.mode = 'playing';
      state.phase = 'waiting_first';
      state.tutorialFlags.started = true;
      syncTutorialProgress(state);
      state.message = 'Find all matching pairs.';
      render();
    }
  }

  function togglePause() {
    if (state.mode !== 'playing') {
      return;
    }
    state.paused = !state.paused;
    state.phase = state.paused ? 'paused' : state.selected.length ? 'waiting_second' : 'waiting_first';
    state.message = state.paused ? 'Paused' : 'Resumed';
    render();
  }

  function resetGame() {
    const restartCount = state.restartCount + 1;
    state = resetState(20260226, restartCount);
    render();
  }

  function advanceTime(ms) {
    const clamped = Math.max(0, Number(ms) || 0);
    let remaining = clamped;
    while (remaining > 0) {
      const delta = Math.min(remaining, STEP_MS);
      advanceTimers(state, delta);
      state.elapsedMs += delta;
      remaining -= delta;
    }
    render();
  }

  startBtn.addEventListener('click', () => {
    startGame();
  });

  pauseBtn.addEventListener('click', () => {
    togglePause();
  });

  resetBtn.addEventListener('click', () => {
    resetGame();
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      if (state.mode === 'start') {
        startGame();
      } else if (state.mode === 'playing') {
        flipCard(state, state.cursorIndex);
        render();
      }
      return;
    }

    if (event.key.toLowerCase() === 'p') {
      togglePause();
      return;
    }

    if (event.key.toLowerCase() === 'r') {
      resetGame();
      return;
    }

    if (event.key === 'ArrowLeft' && state.mode === 'playing') {
      state.cursorIndex = (state.cursorIndex + state.deck.length - 1) % state.deck.length;
      render();
      return;
    }
    if (event.key === 'ArrowRight' && state.mode === 'playing') {
      state.cursorIndex = (state.cursorIndex + 1) % state.deck.length;
      render();
      return;
    }
    if (event.key === 'ArrowUp' && state.mode === 'playing') {
      state.cursorIndex = (state.cursorIndex + state.deck.length - GRID_SIZE) % state.deck.length;
      render();
      return;
    }
    if (event.key === 'ArrowDown' && state.mode === 'playing') {
      state.cursorIndex = (state.cursorIndex + GRID_SIZE) % state.deck.length;
      render();
      return;
    }

    const n = Number(event.key);
    if (Number.isInteger(n) && n >= 1) {
      const index = n - 1;
      if (index >= 0 && index < state.deck.length) {
        flipCard(state, index);
        render();
      }
    }
  });

  window.advanceTime = (ms) => {
    advanceTime(ms);
  };

  window.render_game_to_text = () => serializeState(state);

  state.message = 'Press Start or Enter';
  render();

  return {
    getState: () => state,
    flip: (index) => {
      flipCard(state, index);
      render();
    },
    advanceTime,
    reset: resetGame,
    serialize: () => serializeState(state)
  };
}

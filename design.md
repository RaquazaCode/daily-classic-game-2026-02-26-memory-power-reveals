# Design: Memory Power Reveals

## Goal
Build a deterministic Memory (Concentration) MVP with a single twist (`power card reveals`) that remains automation-safe for unattended nightly runs.

## Core Loop
1. Start round on a 4x4 board.
2. Flip two cards to attempt a symbol match.
3. Resolve match/miss with deterministic timers.
4. Repeat until all 7 symbol pairs are matched.

## Twist Implementation
- A single `★` power card exists in the deck.
- Flipping `★` reveals one currently hidden pair for ~850ms.
- Player receives `+2` bonus score for activation.

## Determinism Strategy
- Deck order uses a fixed seeded shuffle.
- Timer progression is driven by explicit `advanceTime` stepping.
- Automation can assert gameplay state via `render_game_to_text` without visual ambiguity.

## Input Surface
- Mouse: click card buttons.
- Keyboard: arrows move cursor, `Space`/`Enter` flips selected card.
- Global controls: `P` pause/resume, `R` reset.

## Win/Loss and Scoring
- Win when `matchedPairs === 7`.
- No loss state; play continues until solved.
- Scoring: `+10` match, `-2` miss (floor 0), `+2` power card use.

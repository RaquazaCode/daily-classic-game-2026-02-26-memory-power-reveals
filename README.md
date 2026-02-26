# daily-classic-game-2026-02-26-memory-power-reveals

<div align="center">
  <p><strong>Memory (Concentration)</strong> rebuilt as a deterministic 4x4 card puzzle with a <em>power card reveal</em> twist.</p>
</div>

<div align="center">
  <img src="assets/images/hero.png" alt="Memory Power Reveals hero" width="720" />
  <p>Automated run artifacts captured with deterministic hooks and Playwright.</p>
</div>

## Quick Start

```bash
pnpm install
pnpm dev
```

## How To Play

- Press `Start` (or `Enter`).
- Flip cards to find matching symbol pairs.
- Use arrow keys plus `Space`/`Enter` for deterministic keyboard play, or click cards directly.
- Press `P` to pause/resume and `R` to reset.

## Rules

- Board size is fixed at 4x4.
- Seven symbol pairs are matchable.
- One `★` power card reveals one hidden pair briefly.
- One filler `?` card appears and never matches.
- Round ends when all seven symbol pairs are matched.

## Scoring

- `+10` for each matched pair.
- `-2` for each mismatch (never below 0).
- `+2` when the power card is activated.

## Twist

The `power card reveals` twist exposes one hidden pair for a short timed window, letting you route your next move with perfect information if you react before the cards hide.

## Verification

```bash
pnpm test
pnpm build
```

Deterministic automation hooks:
- `window.advanceTime(ms)`
- `window.render_game_to_text()`

Playwright solver evidence (`playwright/main-actions/solver-final-state.json`):
- `mode: "won"`
- `score: 72`
- `matchedPairs: 7`
- `powerTriggered: true`

## Project Layout

- `src/` core deterministic game logic and UI
- `test/` Node test coverage for deck/state invariants
- `playwright/main-actions/` action payloads, captures, and state snapshots
- `assets/` hero image and named capture clips
- `docs/plans/` implementation plan for this run

## GIF Captures

- Opening Sequence: `assets/gifs/opening-sequence.png`
- Power Reveal Sequence: `assets/gifs/power-reveal-sequence.png`
- Finale Sequence: `assets/gifs/finale-sequence.png`

# Design: Memory Clarity Overhaul

## Goal
Make the game understandable for first-time players in under 30 seconds while preserving deterministic automation hooks and replayable depth.

## UX Clarity Pillars
1. Guided onboarding with trigger-based tutorial steps.
2. Persistent in-game help drawer with controls, rules, and card legend.
3. Explicit mode selection with readable, mode-specific behavior.
4. Phase-aware next-action guidance so players always know what to do next.

## Mode Model

- **Classic**
  - Miss penalty: `-2`
  - Hint limit: `2`
  - Hint cost: `5`
  - Timer: none

- **Zen**
  - Miss penalty: `0`
  - Hint limit: unlimited
  - Hint cost: `0`
  - Timer: none

- **Sprint**
  - Miss penalty: `-2`
  - Hint limit: `2`
  - Hint cost: `5`
  - Timer: `90s`
  - Streak scoring: `+4` per consecutive match after first

## Tutorial State Machine

Tutorial progression is derived from explicit gameplay triggers:
- `started`
- `firstFlip`
- `firstMatch`
- `powerUsed`
- `won`

The overlay advances automatically when each trigger is satisfied.

## Phase Model

Primary phase values:
- `start`
- `waiting_first`
- `waiting_second`
- `resolving`
- `paused`
- `won`
- `time_up`

The UI computes next-action guidance from this phase model.

## Card Semantics

- `pair`: matchable cards worth points.
- `power-reveal` (`★`): temporary reveal of one hidden pair.
- `filler` (`?`): flips but cannot match.

## Determinism and Automation Hooks

- Deterministic deck shuffle from fixed seed.
- Deterministic timer stepping via `window.advanceTime(ms)`.
- Readable full game snapshot via `window.render_game_to_text()`.
- Internal helper for solver automation: `window.__game.getState()`.

## Extended Output Contract

`render_game_to_text()` includes:
- mode data: `modeId`, `modeLabel`
- interaction state: `phase`
- tutorial state: `tutorialVisible`, `tutorialStep`, `tutorialStepTitle`
- hint state: `hintsRemaining`, `hintActive`
- sprint state: `sprintTimeRemainingMs`
- momentum state: `streak`, `maxStreak`
- controls metadata: `controlsLegend`

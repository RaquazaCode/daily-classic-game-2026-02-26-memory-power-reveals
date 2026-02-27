Original prompt: unattended nightly daily classic game automation run for 2026-02-26 with fresh folder/repo, full verification, deploy, and record updates.

## Progress
- Implemented memory clarity overhaul on branch `codex/memory-clarity-overhaul`.
- Added 3-mode gameplay (`classic`, `zen`, `sprint`) with explicit UI mode selection.
- Added trigger-based tutorial overlay with 5 guided steps.
- Added persistent How To Play drawer and in-game controls legend.
- Added card-type legend and slot index chips on every card.
- Added contextual hint engine:
  - Classic/Sprint: 2 hints, cost 5 score each.
  - Zen: unlimited hints, no score cost.
- Added Sprint timer (`90s`) with time-up state and streak scoring.
- Added phase-driven next-action guidance (`waiting_first`, `waiting_second`, `resolving`, `paused`, `won`, `time_up`).
- Expanded test suite for tutorial progression, mode behavior, hint constraints, sprint timeout, and serialization fields.
- Updated Playwright action payload and deterministic solver for Classic/Zen/Sprint validation.
- Rewrote README with detailed step-by-step gameplay, strategy, and FAQ.

## Verification Log
- `pnpm test`: pass (8 tests)
- `pnpm build`: pass
- `node .../web_game_playwright_client.js --actions-file playwright/main-actions/actions.json`: pass
- `node playwright/main-actions/solver.mjs`: pass
- Solver summary:
  - `classicWon=true`
  - `classicPowerTriggered=true`
  - `zenHintNoPenalty=true`
  - `sprintTimedOut=true`
  - `tutorialFieldPresent=true`

## Artifact Refresh
- Updated captures:
  - `playwright/main-actions/clip-1-opening.png`
  - `playwright/main-actions/clip-2-midgame.png`
  - `playwright/main-actions/clip-3-finale.png`
- Synced media assets:
  - `assets/images/hero.png`
  - `assets/gifs/opening-sequence.png`
  - `assets/gifs/power-reveal-sequence.png`
  - `assets/gifs/finale-sequence.png`

## TODO
- Open PR from `codex/memory-clarity-overhaul` to `main` and merge with merge commit.
- Run post-merge `pnpm test` and `pnpm build` on `main`.
- Redeploy preview and verify named URL policy.

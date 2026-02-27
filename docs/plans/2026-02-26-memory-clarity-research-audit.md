# Memory Clarity Research + UX Gap Audit

Date: 2026-02-27
Project: daily-classic-game-2026-02-26-memory-power-reveals

## Research Sources

1. Bicycle Cards - Concentration: https://bicyclecards.com/how-to-play/concentration
2. Memozor - How to Play Memory: https://www.memozor.com/memory-games/for-adults/how-to-play-memory
3. Memory Match - How to Play: https://www.memorymatch.app/how-to-play
4. Pairs.one - How to Play: https://www.pairs.one/how-to-play
5. Lumosity - Memory Matrix: https://lumosity.knowledgeowl.com/help/memory-matrix

## Key Findings

- First-time comprehension improves when rules are progressive (start simple, then special cards/mechanics).
- A visible move/timer model increases player confidence and perceived fairness.
- Explicit mode choice (relaxed vs challenge) reduces confusion around scoring expectations.
- Persistent help access is important; one-time instructions are easy to forget mid-round.
- Step-by-step onboarding with completion triggers (not just text) lowers early drop-off.

## Current UX Gaps

- No guided onboarding flow with required action checkpoints.
- Controls and quick-hint text are inconsistent (numeric hint vs arrow navigation cues).
- Special card behavior (`★`, `?`) lacks always-visible legend in-game.
- No user-selectable mode model (single rule set only).
- Missing next-action guidance during key phases (first pick, second pick, resolve lock).
- No in-round hint affordance with explicit cost/limit communication.

## Integration Targets

- Add three-mode ruleset: Classic, Zen, Sprint.
- Add tutorial overlay that requires concrete actions to progress.
- Add persistent How To Play drawer with controls + legend + strategy snippets.
- Add hint engine with mode-sensitive limits/cost and deterministic timers.
- Expand deterministic state output for full test observability.

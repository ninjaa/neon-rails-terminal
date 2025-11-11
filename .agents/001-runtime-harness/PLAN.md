# 001 — Runtime Survey & Harness Plan

## Metadata
- **Owner:** Codex (GPT-5)
- **Created:** 2025-11-11
- **Last Updated:** 2025-11-11
- **Agent / Module:** neon-rails-terminal CLI
- **Related Plans:** _Planned 002 — Death Rally Build_

## Goal
Inventory the existing CLI racer, capture its quirks, and stand up the testing/harness infrastructure (TTY driving script + unit test surfaces) so future feature work—especially the Death-Rally pivot—can proceed with TDD and reproducible demos.

## Purpose / Big Picture
This plan tightens our feedback loop before we attempt the big redesign. By documenting the current behavior, extracting reusable primitives (Braille canvas, RNG, math helpers), and building a scripted runner that can feed keyboard input + capture frames, we’ll have the confidence to refactor aggressively in Plan 002 while still honoring the “tests first” rule.

## Context and Orientation
- Repository currently holds `package.json` and `bin/neon-rails.js` (monolithic CLI script).
- Game renders neon rails with Unicode braille blocks, raw keyboard input, HUD, score, crash state. No pause, no persistence, no modular structure yet.
- No build tooling or tests; everything runs via `npx .`.
- Future asks: pause, high scores, potential multiplayer/music hooks—so isolating math/render logic now will pay off.
- Testing constraints: real-time rendering + raw terminal control is hard to unit-test; need to carve out deterministic pieces (BrailleCanvas, track math, obstacle recycling, HUD generation) and a PTY harness for smoke tests.

## Plan of Work
1. **Runtime survey** — Run `npx .` (manual + PTY script), record FPS, responsiveness, flicker, resize behavior, crash UX. _Validation:_ add a “Findings” subsection with bullet notes + optional screenshot reference.
2. **Reusable module map** — Break `bin/neon-rails.js` into conceptual chunks (terminal control, BrailleCanvas, math helpers, game loop). Note which pieces can move into `src/lib` and what contracts they need. _Validation:_ documented map + TODO list.
3. **Harness design** — Specify the PTY automation script, logging, and capture strategy (e.g., `scripts/run-demo.js` that pipes keys, saves frames, exposes a “smoke test” npm script). _Validation:_ harness spec + PoC command recorded here.
4. **Unit-test surface** — Choose runner (Vitest), list the first tests we’ll write (BrailleCanvas plotting, RNG determinism, obstacle recycling). Include acceptance criteria for user approval. _Validation:_ prioritized list + explanation of any necessary refactors.
5. **Execution checklist** — Outline the sequence to implement harness + tests (create `src/` modules, wire `npm test`, document manual smoke instructions). This becomes the handoff into Plan 002. _Validation:_ final checklist appended to this plan.

## Progress
- [ ] (2025-11-11 00:00 Z) Runtime inventory documented.
- [ ] Module map drafted and stored alongside this plan.
- [ ] Harness design captured.
- [ ] Unit-test list + tooling proposal ready for approval.
- [ ] Execution checklist finalized / handed to Plan 002.

## Surprises & Discoveries
- _None yet._

## Decision Log
- _None yet._

## Outcomes & Retrospective
- _TBD._

## Risks / Open Questions
- Terminal graphics are hard to snapshot for automated assertions—need strategy (off-screen buffer?).
- Performance: adding instrumentation/tests must not reduce frame rate noticeably.
- Need to confirm acceptable dependencies (is adding Vitest okay for hackathon timeline?).

## Next Steps / Handoff Notes
- Deliverables from this plan (notes, harness scripts, test list) roll directly into Plan 002 for the Death-Rally gameplay build.

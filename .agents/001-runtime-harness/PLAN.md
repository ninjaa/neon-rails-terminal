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
4. **Unit-test surface** — Choose runner (Node’s built-in `node:test`), list the first tests we’ll write (BrailleCanvas plotting, RNG determinism, obstacle recycling). Include acceptance criteria for user approval. _Validation:_ prioritized list + explanation of any necessary refactors.
5. **Execution checklist** — Outline the sequence to implement harness + tests (create `src/` modules, wire `npm test`, document manual smoke instructions). This becomes the handoff into Plan 002. _Validation:_ final checklist appended to this plan.

## Progress
- [x] (2025-11-11 01:15 Z) Runtime inventory documented (manual + PTY harness run).
- [x] (2025-11-11 02:05 Z) Module map drafted and stored alongside this plan.
- [x] (2025-11-11 02:20 Z) Harness design captured.
- [x] (2025-11-11 02:35 Z) Unit-test list + tooling proposal ready for approval.
- [x] (2025-11-11 02:45 Z) Execution checklist finalized / handed to Plan 002.

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

---

## Runtime Findings (2025-11-11)
- **Command:** `python - <<'PY' ...` harness spawned `npx .`, injected `→`, `←`, `r`, `q` (script logged in shell history). Confirms we can automate keystrokes via PTY for future smoke tests.
- **Visuals:** On a full-screen 3592×2184 Terminal (screenshot `inspiration/neon-rails-current.png`), only the magenta obstacle cluster renders near the bottom center; rails and player rarely enter view because camera aims far down the spline. Creates the “floating blob” bug you reported.
- **HUD:** `NEON RAILS — score 0 lanes: ←/→` renders in pale blue/white with no crash/pause messaging. Score increments slowly even when idle (~60 pts / sec), so you can farm points without moving.
- **Controls:** Arrow and WASD inputs register (verified by logging) but player feedback is invisible because the player sprite is off-screen; restart (`r`) works instantly, `q` exits cleanly, and terminal state resets (cursor + alt screen) as expected.
- **Performance:** Frame loop runs unrestricted (setImmediate), causing 100% CPU on one core; no FPS cap or delta smoothing, so harness logs ~150k ANSI writes over 5 seconds.
- **Resilience gaps:** No pause, no high-score, no resize debouncing (resizes clear screen but reallocate canvas synchronously, causing stutter), and no error handling if terminal lacks truecolor.

Screenshots + raw harness logs are available in local terminal scrollback; we can capture canonical images once the renderer looks better.

---

## Module Map & Reuse Targets
| Segment | Current responsibility (in `bin/neon-rails.js`) | Future module & notes |
| --- | --- | --- |
| Terminal control | Raw mode toggles, alt-screen enter/exit, resize handler | `src/terminal/io.js` exporting `enterAltScreen(out)` + `restoreTerminal()` helpers so both CLI + harness can reuse without duplicating escape codes. |
| Braille canvas | `BrailleCanvas` class with `plot`, `clear`, `toFrameString` | Move wholesale to `src/render/braille-canvas.js`, add ability to inject color policy (needed for future lighting themes) and expose a `drawStamp(points, color)` helper. |
| Math / track | `trackPoint`, `frameAt`, `offsetPoint`, `projectPoint` | Relocate to `src/math/geometry.js`. These are deterministic and perfect for unit tests (tangents normalized, projections positive). Later we can swap spline definitions without touching renderer. |
| Game state | `speed`, `u`, `obstacles` array management, `resetGame` | Wrap in `src/game/state.js` so top-down racer can evolve state transitions independent of rendering. Add RNG injection + deterministic obstacle queue for tests. |
| Input | Two `stdin` listeners handling raw characters + escape buffering | Extract into `src/input/keyboard.js` that exposes a small observable/handler interface (subscribe to `laneChange`, `restart`, `quit`, `pause`). Makes it easier to simulate input from harness. |
| Loop/timing | `nowNs`, `clock`, `frame()` recursion | Create `src/runtime/loop.js` with dependency-injected clock (so tests can step frames). Allows future FPS cap. |
| Colors/HUD | Hardcoded palette / string builder | Move to `src/theme/neon.js` so we can hot-swap palettes (Death Rally neon variant) and unit-test HUD formatting separately. |

Refactor order: terminal helpers → canvas/math (low risk) → state/input runtime. CLI entry (`bin/neon-rails.js`) will shrink to wiring code referencing those modules; Plan 002 then swaps the gameplay layer.

---

## Harness Design (PTY Smoke Tests)
- **Tooling:** Add a small dev-only script `scripts/smoke-run.js` that uses Node’s built-in `node:child_process` + the `script` POSIX utility _or_ `python - <<'PY'` fallback to guarantee a PTY. Because we want zero native deps, we’ll default to invoking `python` (present on macOS/Linux) with the PTY snippet already prototyped. Script will stream stdout to console and optionally capture frames to `tmp/frames.txt`.
- **API:** `node scripts/smoke-run.js --macro lanes --duration 8 --output tmp/run.txt`
  - `--macro`: named key sequences (e.g., `lanes` = right,right,left,reset,quit).
  - `--record`: dumps ANSI output plus timestamps for diffing.
  - On completion, script exits with CLI’s code so CI can fail if the game crashes.
- **Integration:** Add `npm run smoke` that calls `node scripts/smoke-run.js`. Later we can teach CI (or humans) to run `npm run smoke -- --macro pause`.
- **Artifacts:** script optionally strips ANSI and writes final HUD line to prove deterministic score progression.
- **Manual override:** still easy to run `npx .` interactively; harness is only for regression checks + gifs.

---

## Unit-Test Surface & Tooling Proposal
- **Runner:** use Node 18’s built-in `node:test` + `node:assert/strict`. No extra deps; integrates with `npm test`.
- **Focus areas (initial suite):**
  1. `BrailleCanvas` — `plot` sets the correct bitmask for each pixel location, `clear` resets buffers, and `toFrameString` outputs spaces when `bits=0`. Accept criterion: tests cover both halves of braille cell (dx/dy mapping).
  2. `geometry.projectPoint` — ensures points behind camera return `null` and visible points map within screen bounds given known camera orientation. Acceptance: test uses fake camera + simple point.
  3. `resetGame/obstacle recycling` — when an obstacle’s `s` falls behind `u - 2`, it respawns ahead; tests assert no values remain behind the player.
  4. `keyboard` handler — given ESC sequence, emits `laneChange` events exactly once (simulate `ESC [ C`). Accept: no duplicate events when partial sequences occur.
  5. `loop` step integration — when provided a fake clock delta, state increments score and clamps speed <= 0.28. Accept: ensures deterministic behavior for future top-down integrator.
- **Test data:** we’ll add fixtures under `test/` that import from `src/` modules (post refactor). CLI file will remain CommonJS but modules can also be CommonJS to avoid ESM friction.
- **TDD plan:** each new module extracted in Plan 001 is immediately covered by the tests above before we modify gameplay logic. Plan 002 will add more (physics, AI, HUD formatting).

---

## Execution Checklist → feeds Plan 002
1. **Create `src/` tree** with modules noted above; move code + update CLI entry to import them (CommonJS `require`).
2. **Add `scripts/smoke-run.js`** (Python PTY helper inline) and `npm run smoke`.
3. **Configure tests:** add `test/` folder, write `node:test` suites for canvas, geometry, obstacles, keyboard, loop. Wire `npm test` to `node --test`.
4. **Document harness/tests** in README (usage snippet) and in Plan 002’s prerequisites.
5. **Verify manual run** still works (interactive `npx .`), then run `npm test` + `npm run smoke` to baseline.
6. **Update AGENTS** with any deviations (none yet) and mark this plan complete, unblocking Plan 002.

Once these items are implemented, Plan 002 can safely start refactoring the renderer/physics knowing the base harness + tests are available.

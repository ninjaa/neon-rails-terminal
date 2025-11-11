# Neon Rails Terminal

A Node-only terminal game experiment that renders neon “braille pixels” with 24-bit ANSI color.  
Current prototype: forward-runner rails; upcoming pivot: a top-down Death Rally homage with weighty physics, AI rivals, pause/high-score UX, and juicy combat.

## Quick start

```bash
# run the published CLI from the repo root
npx .

# or link once and play anywhere
npm link
neon-rails
```

Controls today: `←/→` or `A/D` to switch lanes, `R` to restart, `Q` to quit.

## Development workflow

- We follow the ExecPlan/TDD guidance in `AGENTS.md`.
- Active plans live under `.agents/` and are numbered chronologically:
  - `001-runtime-harness`: inventory the current build, break out reusable modules, and define test/harness tooling.
  - `002-death-rally-build`: refactor into modules and implement the new top-down racer.
- Run tests / harness scripts once they land via `npm test` or `npm run smoke -- --macro lanes`.

### Testing & smoke harness

- `npm test` runs the Node built-in `node --test` suites covering Braille canvas helpers, geometry projections, keyboard decoding, and state recycling.
- `npm run smoke -- --macro lanes --duration 5 --output tmp/smoke.txt`
  - Spawns `npx .` inside a pseudo-terminal, feeds a scripted key macro, and writes the ANSI output to `tmp/smoke.txt` (create `tmp/` beforehand).
  - Macros (`lanes`, `pause`) are defined in `scripts/smoke-run.js`; add more to reproduce bugs or demo flows.
- Run the smoke command before publishing to ensure the CLI still enters/exits the alt-screen cleanly and responds to scripted input.

## Status & next steps

1. Finish Plan 001: capture runtime observations, spec the PTY harness + unit test surfaces, and outline the execution checklist. (In progress now!)
2. Execute Plan 002: build the Death Rally experience (renderer, physics, HUD, combat, pause/high-scores) while keeping the game runnable with `npx neon-rails`.
3. Polish for npm publish (README gifs, demo script, version bump).

Style references, palette ideas, and gameplay notes are welcome—drop them in future plan sections or issues.

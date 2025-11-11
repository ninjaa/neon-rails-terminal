# Neon Rails Terminal

A Node-only terminal racer that renders neon “braille pixels” with 24-bit ANSI color.  
Current build: **Neon Death Rally** — a top-down SOMA night sprint with GPU pickups, rival cars, ram damage, and a HUD inspired by the classic Death Rally sidebar.

## Quick start

```bash
# play the published build
npx @ninjaa/neon-rails

# or run from source
npx .
```

Controls:  
- `←/→` or `A/D` — steer  
- `↑/↓` or `W/S` — throttle up/down  
- `P` — pause/resume  
- `R` — restart race  
- `ENTER` / `SPACE` — start race (from splash)  
- `Q` — quit (also `Ctrl+C`)

## Development workflow

- We follow the ExecPlan/TDD guidance in `AGENTS.md`.
- Active plans live under `.agents/` and are numbered chronologically:
  - `001-runtime-harness`: ✅ complete — modularized the CLI, added PTY harness + unit tests.
  - `002-death-rally-build`: 🚧 executing — adds the neon Death Rally renderer, physics, combat, and UX polish.
- Run tests / harness scripts via `npm test` or `npm run smoke -- --macro lanes`.

### Testing & smoke harness

- `npm test` runs the Node built-in `node --test` suites covering Braille canvas helpers, geometry projections, keyboard decoding, and state recycling.
- `npm run smoke -- --macro lanes --duration 5 --output tmp/smoke.txt`
  - Spawns `npx .` inside a pseudo-terminal, feeds a scripted key macro, and writes the ANSI output to `tmp/smoke.txt` (create `tmp/` beforehand).
  - Macros (`lanes`, `pause`) are defined in `scripts/smoke-run.js`; add more to reproduce bugs or demo flows.
- Run the smoke command before publishing to ensure the CLI still enters/exits the alt-screen cleanly and responds to scripted input.

## Status & next steps

1. Plan 002 in progress: finish physics/combat polish (damage FX, boosts), add basic scoring persistence, and tighten AI.  
2. Capture gameplay GIF + README gallery for the new splash + race loop.  
3. Publish via `npm publish --access public` (package name `@ninjaa/neon-rails`).

Style references, palette ideas, and gameplay notes are welcome—drop them in future plan sections or issues.

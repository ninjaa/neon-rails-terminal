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

## What you get

- **Neon splash screen** with lore recap and control list. Nothing renders until you “jack in”, so the terminal stays clean.
- **Top-down SOMA circuit** inspired by Death Rally: GPU pickups, boosts, hazards, rival AI (Bogus Bill & Cher Stone), lap counting.
- **Weighty driving** with heading-based drift, throttle/brake, bump damage, and speed boosts when you steal GPUs.
- **HUD side panel** showing damage bar, speed, GPU credits, lap count, and rival standings.
- **Status toasts** (“GPU secured”, “Wall scrape”, “Race complete”) plus pause/restart flow.
- **Harness + test suite** (`npm test`, `npm run smoke`) so every change stays reliable.

The render loop now locks to 60 FPS, greatly reducing flicker on both the splash and gameplay frames.

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

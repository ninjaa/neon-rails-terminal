# 002 — Death Rally Build Plan

## Metadata
- **Owner:** Codex (GPT-5)
- **Created:** 2025-11-11
- **Last Updated:** 2025-11-11
- **Agent / Module:** neon-rails-terminal CLI
- **Related Plans:** 001 Runtime Survey & Harness

## Goal
Ship a playable top-down “Death Rally”-style terminal racer with weighty physics, pause/high-score UX, basic AI rivals, and juicy combat cues (damage meter, explosions) while keeping `npx neon-rails` as the entry point.

## Purpose / Big Picture
This is the marquee hackathon deliverable: a 90s-inspired combat racer in the terminal that feels polished despite no art assets. By the end, players should be able to start a race, steer with arrows/WASD, ram or avoid rival cars, manage damage, finish laps, and see their high score persist for the session (future-proofed for disk storage). The look should evoke the golden screenshot you shared: moody lighting, bold HUD, responsive controls.

## Context and Orientation
- Plan 001 will hand us: runtime notes, reusable modules (BrailleCanvas, terminal control helpers), a PTY harness, and a Vitest-ready structure.
- Current CLI is still the neon rail runner; we’ll refactor into `src/` modules while preserving the CLI entrypoint.
- Key constraints: zero native deps, Node ≥18, must run smoothly in 24-bit terminals yet degrade gracefully.
- Features in scope for this plan: single track (loop), 1–2 AI opponents, collision/bumping, damage meter, pause toggle, score/lap tracking, and simple explosions/flash feedback.
- Future hooks (not necessarily shipping here but design-aware): multiplayer, music-reactive shaders, theme packs.

## Plan of Work
1. **Refactor scaffold** — Move shared utilities from `bin/neon-rails.js` into `src/terminal`, `src/render/braille`, `src/math`, exporting a clean game loop interface. _Validation:_ lint/tests from Plan 001 still pass; CLI still launches old game behind a flag.
2. **Renderer overhaul** — Implement a top-down tile renderer: track bitmap, lighting masks, car sprites (multi-dot stamps), HUD side panel with damage/speed/position. _Validation:_ deterministic frame capture via harness + manual playtest GIF.
3. **Physics & controls** — Build car state (pos, heading, velocity, angular velocity), integrate forces for acceleration, drift, collision response, and enemy AI path following. _Validation:_ unit tests for integrator + harness script verifying lane change + bump.
4. **Combat & feedback** — Track damage per car, implement collision damage, flashing/explosion effect (color pulses, particle splats), and respawn/finish logic. _Validation:_ tests for damage math and manual smoke showing explosions trigger.
5. **Gameplay loop & UX** — Add pause (`P`), restart (`R`), scoreboard (session best), lap progression, finish screen, and CLI help output. _Validation:_ harness script simulating pause/resume + scoreboard update; manual acceptance pass.
6. **Polish & packaging** — Write README snippet, update package metadata, ensure `npm test` + `npm run demo` instructions exist, and prep notes for future multiplayer/audio plans. _Validation:_ final playtest + user approval.

## Progress
- [ ] Scaffold refactor complete.
- [ ] Renderer implemented.
- [ ] Physics & controls implemented/tested.
- [ ] Combat feedback done.
- [ ] Gameplay loop UX done.
- [ ] Polish & packaging done.

## Surprises & Discoveries
- _None yet._

## Decision Log
- _None yet._

## Outcomes & Retrospective
- _TBD._

## Risks / Open Questions
- Ensuring good performance while ray-marching lighting in pure JS.
- AI pathing complexity vs. tight schedule—may need spline-follow with noise.
- High-score persistence: session memory vs. file storage (needs decision).

## Next Steps / Handoff Notes
- Blocked until Plan 001 delivers harness + module map.
- Once scaffolding lands, start with renderer + physics to get a drivable greybox, then layer combat/HUD.

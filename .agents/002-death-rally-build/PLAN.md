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
1. **Experience vision & level spec** — Lock the neon-Death Rally fantasy: SOMA night sprint, GPU credit pickups, rival AI archetypes, HUD layout. Deliverables: written spec + ASCII layout for the single track referencing `inspiration/` art + `inspiration/backstory.md`. _Validation:_ spec reviewed/approved.
2. **Core renderer build** — Implement top-down renderer on the braille canvas (tile atlas, light masks, HUD sidebar). _Validation:_ harness frame capture + screenshot stored in `docs/`.
3. **Physics & controls** — Introduce car state (pos/vel/heading), weighty drift, boost, AI path following, and deterministic stepping for tests. _Validation:_ node:test suite for integrator + harness macro verifying steering.
4. **Combat & damage loop** — Add ramming damage, GPU credit pickups, explosions, damage meter, and simple death/respawn. _Validation:_ tests for damage math + smoke macro verifying damage HUD updates.
5. **Gameplay UX & scoring** — Wire pause, restart, finish conditions, lap timer, high-score memory (in-session) and CLI help. _Validation:_ harness macro exercising pause/resume + scoreboard tests.
6. **Polish & ship prep** — README updates, animated gif (optional), version bump, publish checklist. _Validation:_ manual playtest + `npm test`/`npm run smoke` clean.

## Progress
- [x] (2025-11-11 03:10 Z) Experience vision & level spec captured.
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

---

## Experience Vision (Neon Death Rally)
- **Setting:** 2025 SOMA night circuit inspired by the backstory—neon-washed streets, drone spotlights, GPU crates to collect. Track loops through alleys and underpasses; player competes for GPU credits to build their own AGI.
- **Palette:** retain cyan/magenta core but add sodium vapor golds + oily greens from `inspiration/*.webp`. Plan: `neon-dirt` palette (background deep navy `#060612`, asphalt gradient, fuchsia tail lights, cyan headlights, hazard yellow for pickups).
- **Camera:** 3/4 overhead with slight isometric skew (top-left -> far). Use braille canvas as 160×80 virtual grid. Car sprites: 3×4 stamps with heading-based shading (front brighter). Light pools drawn as semi-transparent circles (approx via alpha blending on color buffer).
- **HUD:** Left sidebar mimicking Death Rally: damage meter (stacked bars), speed gauge, rank list (player + 2 AI), GPU credits counter, lap/total. Top center shows track name + mission (“Steal more GPUs than Bogus Bill”).
- **Mechanics:** 
  - Player car with drift (turning reduces grip, use acceleration/brake keys). 
  - Two AI rivals: “Bogus Bill” (aggressive), “Cher Stone” (defensive). AI follows spline path with random lane offsets; engages in bumping if player near.
  - Pickups: GPU crates spawn along shortcuts; hitting them yields score + temporary speed buff.
  - Damage: collisions reduce armor; at 0, car explodes (pulse effect) and respawns after delay with score penalty.
  - Pause (`P`), restart (`R`), quit (`Q`), toggled scoreboard overlay.
- **Future hooks:** audio-reactive glow (tie into theme), multiplayer lanes, file-based high scores. Not shipping now but inform architecture (e.g., deterministic RNG, state serialization).

### Track Sketch (ASCII)

```
        ┌────────── Drone Yard ─────────┐
        │                                │
   ┌────┘    ╭─────╮          ╭─────╮    └────┐
   │         │GPU ◇│  Alley   │ ⚡  │         │
Start╶──pit──╯     ╰──────────╯     ╰───╮  Finish
   │                         ╭───╮       │
   │      Underpass          │## │        │
   └───────────────╮   ╭─────╯##╰─────────┘
                   │   │  SoMa Dock
```

- `◇` GPU pickup, `⚡` speed pad, `##` construction hazard (narrow lanes).
- Player starts near pit; AI spawn staggered 0.3 lap behind/ ahead.

#!/usr/bin/env node
/* Neon Rails — terminal edition (no deps)
   Controls: ← / → to switch lanes, R to restart, Q to quit
*/
const out = process.stdout;
const min = Math.min;
const abs = Math.abs;

const { SEQS, TRUECOLOR } = require("../src/terminal/io");
const { BrailleCanvas } = require("../src/render/braille-canvas");
const { frameAt, offsetPoint, projectPoint } = require("../src/math/geometry");
const {
  createGameState,
  resetGame,
  recycleObstacle,
  LANES,
} = require("../src/game/state");
const { createKeyboardController } = require("../src/input/keyboard");
const { createFrameLoop } = require("../src/runtime/loop");
const { palette: C, formatHud } = require("../src/theme/neon");

const state = createGameState();
const { obstacles, laneOffset } = state;

let keyboard;

function clampLane(value) {
  return Math.max(-1, Math.min(1, value));
}

function cleanExit(code = 0) {
  try {
    keyboard?.dispose();
    out.write(SEQS.reset + SEQS.showCursor + SEQS.altScreenOff);
  } catch {}
  process.exit(code);
}

function setupInput() {
  keyboard = createKeyboardController({
    onLaneChange(dir) {
      state.targetLane = clampLane(state.targetLane + dir);
    },
    onRestart() {
      resetGame(state);
    },
    onPause() {
      state.alive = !state.alive;
    },
    onQuit() {
      cleanExit(0);
    },
  });
}

process.on("SIGINT", () => cleanExit(0));
process.on("SIGTERM", () => cleanExit(0));
process.on("uncaughtException", (e) => {
  out.write(SEQS.reset + SEQS.showCursor + SEQS.altScreenOff);
  console.error(e);
  process.exit(1);
});

function main() {
  setupInput();
  out.write(SEQS.altScreenOn + SEQS.hideCursor);

  let cols = Math.max(40, out.columns || 80);
  let rows = Math.max(20, (out.rows || 24) - 2);
  let canvas = new BrailleCanvas(cols, rows);

  function handleResize() {
    cols = Math.max(40, out.columns || 80);
    rows = Math.max(20, (out.rows || 24) - 2);
    canvas = new BrailleCanvas(cols, rows);
  }
  process.stdout.on("resize", handleResize);

  const fovDeg = 70;
  const f = (0.5 * canvas.ph) / Math.tan((fovDeg * Math.PI) / 360);
  const X = { x: 0, y: 0, z: 0 };
  const scr = { x: 0, y: 0, z: 0 };

  function step(dt) {
    if (state.alive) {
      state.u += dt * state.speed;
      state.speed = min(0.28, state.speed + dt * 0.003);
      state.score += dt * 60;
    } else {
      state.u += dt * state.speed * 0.2;
    }
    state.laneSmooth += (state.targetLane - state.laneSmooth) * (state.alive ? 0.18 : 0.04);

    const f0 = frameAt(state.u);
    const playerPos = offsetPoint(state.u, state.laneSmooth * laneOffset, {
      x: 0,
      y: 0,
      z: 0,
    });
    const camLocal = { x: 0.0, y: 1.2, z: -4.8 };
    const camPos = {
      x: playerPos.x + f0.n.x * camLocal.x + f0.b.x * camLocal.y + f0.t.x * camLocal.z,
      y: playerPos.y + f0.n.y * camLocal.x + f0.b.y * camLocal.y + f0.t.y * camLocal.z,
      z: playerPos.z + f0.n.z * camLocal.x + f0.b.z * camLocal.y + f0.t.z * camLocal.z,
    };
    const cam = { pos: camPos, right: f0.n, up: f0.b, fwd: f0.t };

    canvas.clear();
    const W = canvas.pw;
    const H = canvas.ph;

    const laneColors = [C.railL, C.railC, C.railR];
    const lookAhead = 80;
    const stepSize = 0.15;
    for (let li = 0; li < LANES.length; li++) {
      const color = laneColors[li];
      for (let s = state.u; s < state.u + lookAhead; s += stepSize) {
        offsetPoint(s, LANES[li] * laneOffset, X);
        if (!projectPoint(cam, X, W, H, f, scr)) continue;
        const px = scr.x | 0;
        const py = scr.y | 0;
        canvas.plot(px, py, color);
        canvas.plot(px + 1, py, color);
        canvas.plot(px, py + 1, color);
      }
    }

    if (projectPoint(cam, playerPos, W, H, f, scr)) {
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          canvas.plot((scr.x | 0) + dx, (scr.y | 0) + dy, C.player);
        }
    }

    let hit = false;
    for (let i = 0; i < obstacles.length; i++) {
      const o = obstacles[i];
      recycleObstacle(o, state.u, state.rng);
      offsetPoint(o.s, o.lane * laneOffset, X);
      if (projectPoint(cam, X, W, H, f, scr)) {
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++) {
            canvas.plot((scr.x | 0) + dx, (scr.y | 0) + dy, C.obstacle);
          }
      }
      const d = abs(o.s - state.u);
      const wrap = Math.min(d % 100, 100 - (d % 100));
      const playerLane = Math.round(state.laneSmooth);
      if (state.alive && o.lane === playerLane && wrap < 0.22) hit = true;
    }
    if (hit) state.alive = false;

    const hudLine = formatHud({
      score: state.score,
      alive: state.alive,
      message: state.alive ? "" : "CRASH — press R",
      truecolor: Boolean(TRUECOLOR),
    });

    out.write(canvas.toFrameString(hudLine));
  }

  createFrameLoop(step);
}

main();

#!/usr/bin/env node
/* Neon Rails — Neon Death Rally edition.
   Controls: A/D or ←/→ steer, W/S or ↑/↓ throttle, P pause, R restart, Enter to start, Q quit. */

const out = process.stdout;

const { SEQS, TRUECOLOR, fg24 } = require("../src/terminal/io");
const { BrailleCanvas } = require("../src/render/braille-canvas");
const { createKeyboardController } = require("../src/input/keyboard");
const { createFrameLoop } = require("../src/runtime/loop");
const { palette: C, formatHud } = require("../src/theme/neon");
const { buildTrackLayout } = require("../src/render/track");
const { drawCarSprite } = require("../src/render/sprites");
const { renderHudPanel } = require("../src/ui/hud");

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const lerp = (a, b, t) => a + (b - a) * t;

const layout = buildTrackLayout();
const TILE_PX = 4;
const defaultStatus = "Steal GPUs, fund your outlaw AGI.";
const splashPrompt = "Press ENTER to jack in.";

const pathPoints = [
  { x: 1.5, y: 1.5 },
  { x: 6.5, y: 1.2 },
  { x: 9.5, y: 1.3 },
  { x: 9.8, y: 7.3 },
  { x: 12.2, y: 8.6 },
  { x: 12.2, y: 10.5 },
  { x: 6.4, y: 10.8 },
  { x: 1.4, y: 10.3 },
  { x: 1.3, y: 4.8 },
  { x: 1.5, y: 1.5 },
];

const pathSegments = buildPathSegments(pathPoints);
const totalPathLength = pathSegments.reduce((acc, seg) => acc + seg.length, 0);

const pickupKeys = layout.pickups.map((pos) => keyFor(pos.x, pos.y));
let activePickups = new Set(pickupKeys);

const laps = { current: 1, total: 3 };

const player = {
  name: "YOU",
  x: layout.start ? layout.start.x + 0.5 : 1.5,
  y: layout.start ? layout.start.y + 0.5 : 1.5,
  heading: 0,
  speed: 0,
  targetSpeed: 4,
  maxSpeed: 7.5,
  damage: 0,
  credits: 0,
  progress: 0,
  prevProgress: 0,
};

const rivals = [
  createRival("Bogus Bill", 0.22),
  createRival("Cher Stone", 0.62),
];

let status = {
  message: splashPrompt,
  timer: 0,
  paused: true,
  finished: false,
  splash: true,
};
let steerInput = 0;
let keyboard;
let canvas;
let trackOffsetX = 0;
let trackOffsetY = 0;

process.on("SIGINT", () => cleanExit(0));
process.on("SIGTERM", () => cleanExit(0));
process.on("uncaughtException", (e) => {
  out.write(SEQS.reset + SEQS.showCursor + SEQS.altScreenOff);
  console.error(e);
  process.exit(1);
});

function cleanExit(code = 0) {
  try {
    keyboard?.dispose();
    out.write(SEQS.reset + SEQS.showCursor + SEQS.altScreenOff);
  } catch {}
  process.exit(code);
}

function createCanvas() {
  const cols = Math.max(60, out.columns || 100);
  const rows = Math.max(25, (out.rows || 32) - 2);
  canvas = new BrailleCanvas(cols, rows);
  recomputeTrackOffset();
}

function recomputeTrackOffset() {
  if (!canvas) return;
  const trackPixelWidth = layout.width * TILE_PX;
  const trackPixelHeight = layout.height * TILE_PX;
  trackOffsetX = Math.max(0, Math.floor((canvas.pw - trackPixelWidth) / 2));
  trackOffsetY = Math.max(0, Math.floor((canvas.ph - trackPixelHeight) / 2));
}

function setupInput() {
  keyboard = createKeyboardController({
    onLaneChange(delta) {
      steerInput = clamp(steerInput + delta, -3, 3);
    },
    onThrottle(delta) {
      player.targetSpeed = clamp(
        player.targetSpeed + delta * 0.7,
        1,
        player.maxSpeed,
      );
      setStatus(delta > 0 ? "Throttle up" : "Throttle down", 1.2);
    },
    onRestart() {
      if (status.splash) {
        startRace();
      } else {
        resetRace();
      }
    },
    onPause() {
      status.paused = !status.paused;
      setStatus(status.paused ? "Paused" : "Back to racing", 1.5);
    },
    onQuit() {
      cleanExit(0);
    },
    onStart() {
      if (status.splash || status.finished) {
        startRace();
      }
    },
  });
}

function startRace() {
  status.splash = false;
  resetRace();
}

function enterSplash() {
  status = {
    message: splashPrompt,
    timer: 0,
    paused: true,
    finished: false,
    splash: true,
  };
  laps.current = 1;
  player.speed = 0;
  player.targetSpeed = 0;
}

function resetRace() {
  activePickups = new Set(pickupKeys);
  laps.current = 1;
  status = {
    message: "Race start — grab the GPUs!",
    timer: 2.2,
    paused: false,
    finished: false,
    splash: false,
  };
  player.x = layout.start ? layout.start.x + 0.5 : 1.5;
  player.y = layout.start ? layout.start.y + 0.5 : 1.5;
  player.heading = 0;
  player.speed = 0;
  player.targetSpeed = 4;
  player.damage = 0;
  player.credits = 0;
  const proj = projectOnPath(player.x, player.y);
  player.progress = proj;
  player.prevProgress = proj;
  rivals.forEach((rival, idx) => {
    rival.progress = (idx * 0.35 + 0.2) % 1;
    rival.prevProgress = rival.progress;
    rival.lap = 1;
    rival.damage = 0;
    updateRivalPosition(rival, 0);
  });
}

function setStatus(message, ttl = 2.5) {
  status.message = message;
  status.timer = ttl;
}

function buildPathSegments(points) {
  const segments = [];
  let cumulative = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    segments.push({ start, end, length, cumulative });
    cumulative += length;
  }
  return segments;
}

function samplePath(u) {
  const normalized = ((u % 1) + 1) % 1;
  let distance = normalized * totalPathLength;
  for (const seg of pathSegments) {
    if (distance <= seg.length) {
      const t = seg.length === 0 ? 0 : distance / seg.length;
      const x = lerp(seg.start.x, seg.end.x, t);
      const y = lerp(seg.start.y, seg.end.y, t);
      const heading = Math.atan2(seg.end.x - seg.start.x, seg.start.y - seg.end.y);
      return { x, y, heading };
    }
    distance -= seg.length;
  }
  const last = pathSegments[pathSegments.length - 1];
  return {
    x: last.end.x,
    y: last.end.y,
    heading: Math.atan2(
      last.end.x - last.start.x,
      last.start.y - last.end.y,
    ),
  };
}

function projectOnPath(x, y) {
  let best = { dist2: Infinity, progress: 0 };
  for (const seg of pathSegments) {
    const ax = seg.start.x;
    const ay = seg.start.y;
    const bx = seg.end.x;
    const by = seg.end.y;
    const abx = bx - ax;
    const aby = by - ay;
    const apx = x - ax;
    const apy = y - ay;
    const abLen2 = abx * abx + aby * aby;
    const t = abLen2 === 0 ? 0 : clamp((apx * abx + apy * aby) / abLen2, 0, 1);
    const projX = ax + abx * t;
    const projY = ay + aby * t;
    const dist2 = (x - projX) ** 2 + (y - projY) ** 2;
    if (dist2 < best.dist2) {
      best = {
        dist2,
        progress: (seg.cumulative + seg.length * t) / totalPathLength,
      };
    }
  }
  return best.progress;
}

function createRival(name, offset) {
  const sample = samplePath(offset);
  return {
    name,
    progress: ((offset % 1) + 1) % 1,
    prevProgress: offset,
    lap: 1,
    damage: 0,
    credits: 0,
    speed: 0.035 + Math.random() * 0.01,
    x: sample.x,
    y: sample.y,
    heading: sample.heading,
  };
}

function updateRivalPosition(rival, dt) {
  const prev = rival.progress;
  rival.progress = (rival.progress + dt * rival.speed) % 1;
  if (rival.progress < prev) {
    rival.lap += 1;
  }
  const sample = samplePath(rival.progress);
  rival.x = sample.x;
  rival.y = sample.y;
  rival.heading = sample.heading;
}

function tileAt(x, y) {
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  if (ty < 0 || ty >= layout.grid.length) return null;
  const row = layout.grid[ty];
  if (!row) return null;
  return row[tx] || null;
}

function keyFor(x, y) {
  return `${x},${y}`;
}

function fillRect(canvasInstance, x, y, w, h, color) {
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      canvasInstance.plot(x + px, y + py, color);
    }
  }
}

function drawTrack(canvasInstance) {
  const colors = {
    road: 0x13142d,
    start: 0x22f4ff,
    finish: 0xff77ff,
    pickup: 0xffd447,
    boost: 0x0fffb0,
    hazard: 0xff3b6b,
    wall: 0x04040b,
  };
  for (let y = 0; y < layout.height; y++) {
    for (let x = 0; x < layout.width; x++) {
      const tile = layout.grid[y][x];
      let color = tile.walkable ? colors.road : colors.wall;
      if (tile.kind === "start") color = colors.start;
      if (tile.kind === "finish") color = colors.finish;
      if (tile.kind === "hazard") color = colors.hazard;
      if (tile.kind === "boost") color = colors.boost;
      if (tile.kind === "pickup") {
        const key = keyFor(x, y);
        color = activePickups.has(key) ? colors.pickup : colors.road;
      }
      fillRect(
        canvasInstance,
        trackOffsetX + x * TILE_PX,
        trackOffsetY + y * TILE_PX,
        TILE_PX,
        TILE_PX,
        color,
      );
    }
  }
}

function applyDamage(car, amount) {
  car.damage = clamp(car.damage + amount, 0, 1);
  if (car === player && car.damage >= 1) {
    handleCrash();
  }
}

function handleCrash() {
  setStatus("You wrecked it! Respawning...", 2.5);
  player.damage = 0.2;
  player.speed = 0;
  player.targetSpeed = 3.5;
  player.credits = Math.max(0, player.credits - 1);
  player.x = layout.start ? layout.start.x + 0.5 : 1.5;
  player.y = layout.start ? layout.start.y + 0.5 : 1.5;
  const proj = projectOnPath(player.x, player.y);
  player.progress = proj;
  player.prevProgress = proj;
}

function updatePlayer(dt) {
  const prevX = player.x;
  const prevY = player.y;
  player.heading += steerInput * 2.2 * dt;
  steerInput *= 0.85;
  player.speed += (player.targetSpeed - player.speed) * 0.8 * dt;
  player.speed = clamp(player.speed, 0, player.maxSpeed);
  player.x += Math.sin(player.heading) * player.speed * dt;
  player.y -= Math.cos(player.heading) * player.speed * dt;

  const tile = tileAt(player.x, player.y);
  if (!tile || !tile.walkable) {
    player.x = prevX;
    player.y = prevY;
    player.speed *= 0.2;
    applyDamage(player, 0.15);
    setStatus("Wall scrape!", 0.8);
  } else {
    if (tile.kind === "hazard") {
      applyDamage(player, 0.05);
    }
    if (tile.kind === "pickup") {
      const key = keyFor(Math.floor(player.x), Math.floor(player.y));
      if (activePickups.has(key)) {
        activePickups.delete(key);
        player.credits += 1;
        player.targetSpeed = clamp(player.targetSpeed + 0.4, 1, player.maxSpeed + 1);
        setStatus("GPU secured!", 1.5);
        if (activePickups.size === 0) {
          activePickups = new Set(pickupKeys);
          setStatus("Drops respawned!", 1.8);
        }
      }
    }
  }

  const proj = projectOnPath(player.x, player.y);
  if (player.prevProgress !== null && proj < player.prevProgress - 0.6) {
    laps.current += 1;
    if (laps.current > laps.total) {
      status.finished = true;
      status.paused = true;
      setStatus("Race complete! Press R to run again.", 6);
    } else {
      setStatus(`Lap ${laps.current}/${laps.total}`, 1.4);
    }
  }
  player.prevProgress = proj;
  player.progress = proj;
}

function updateRivals(dt) {
  rivals.forEach((rival) => {
    updateRivalPosition(rival, dt);
    const dx = player.x - rival.x;
    const dy = player.y - rival.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0 && dist < 0.7) {
      const nx = dx / dist;
      player.x += nx * 0.05;
      player.y += (dy / dist) * 0.05;
      applyDamage(player, 0.02);
      applyDamage(rival, 0.02);
      setStatus("Bump! Hold your line.", 0.8);
    }
  });
}

function computeStandings() {
  const racers = [
    {
      id: "player",
      name: "YOU",
      metric: (laps.current - 1) + player.progress,
      damage: player.damage,
      credits: player.credits,
    },
    ...rivals.map((rival) => ({
      id: rival.name,
      name: rival.name.toUpperCase(),
      metric: (rival.lap - 1) + rival.progress,
      damage: rival.damage,
      credits: rival.credits,
    })),
  ].sort((a, b) => b.metric - a.metric);
  racers.forEach((entry, idx) => {
    entry.position = idx + 1;
  });
  return racers;
}

function renderCars(canvasInstance) {
  const playerPix = worldToPixel(player.x, player.y);
  drawCarSprite(canvasInstance, {
    x: playerPix.x,
    y: playerPix.y,
    heading: player.heading,
    colors: { body: C.railC, front: C.player, glow: C.railL },
  });

  rivals.forEach((rival, idx) => {
    const pix = worldToPixel(rival.x, rival.y);
    const color = idx === 0 ? C.railR : C.obstacle;
    drawCarSprite(canvasInstance, {
      x: pix.x,
      y: pix.y,
      heading: rival.heading,
      colors: { body: color, front: 0xffffff, glow: 0xffffff },
    });
  });
}

function worldToPixel(wx, wy) {
  return {
    x: Math.round(trackOffsetX + wx * TILE_PX),
    y: Math.round(trackOffsetY + wy * TILE_PX),
  };
}

function renderSplash() {
  canvas.clear();
  // diagonal neon streaks
  for (let y = 0; y < canvas.ph; y += 2) {
    for (let x = 0; x < canvas.pw; x += 2) {
      const glow = (Math.sin((x + y) * 0.05) + 1) * 0.5;
      const color = glow > 0.5 ? C.railL : C.railR;
      if (Math.random() < 0.35) {
        canvas.plot(x, y, color);
      }
    }
  }
  const splashHud = `${fg24(200, 210, 255)}NEON RAILS${SEQS.reset} — ${fg24(170, 230, 255)}${splashPrompt}${SEQS.reset}`;
  const info = `

  ██╗  ██╗███████╗ ██████╗ ███╗   ██╗    ██████╗ ███████╗ █████╗ ██╗     ██╗   ██╗
  ██║  ██║██╔════╝██╔═══██╗████╗  ██║    ██╔══██╗██╔════╝██╔══██╗██║     ██║   ██║
  ███████║█████╗  ██║   ██║██╔██╗ ██║    ██████╔╝█████╗  ███████║██║     ██║   ██║
  ██╔══██║██╔══╝  ██║   ██║██║╚██╗██║    ██╔═══╝ ██╔══╝  ██╔══██║██║     ██║   ██║
  ██║  ██║███████╗╚██████╔╝██║ ╚████║    ██║     ███████╗██║  ██║███████╗╚██████╔╝
  ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝    ╚═╝     ╚══════╝╚═╝  ╚═╝╚══════╝ ╚═════╝

  Nightfall in SOMA. Hack a hovercar, race for GPU crates, dodge drone spotlights.

  Controls:
    • ←/→ or A/D — steer
    • ↑/↓ or W/S — throttle & brake
    • P — pause / resume
    • R — restart run
    • ENTER / SPACE — start race
    • Q — bail out

  Objective: grab GPUs, ram rivals, finish 3 laps, and bank the credits.
`;
  out.write(canvas.toFrameString(splashHud) + info);
}

function renderFrame() {
  canvas.clear();
  drawTrack(canvas);
  renderCars(canvas);
  canvas.clear();
  drawTrack(canvas);
  renderCars(canvas);

  const standings = computeStandings();
  const playerEntry = standings.find((r) => r.id === "player") || standings[0];
  const rivalsForHud = standings
    .filter((r) => r.id !== "player")
    .map((r) => ({
      name: r.name,
      position: r.position,
      damage: r.damage,
      credits: r.credits,
    }));

  const hudLine = formatHud({
    score: player.credits * 100 + (laps.current - 1) * 200,
    alive: !status.finished,
    message: status.message,
    truecolor: Boolean(TRUECOLOR),
  });
  const panel = renderHudPanel({
    playerName: player.name,
    damage: player.damage,
    speed: player.speed * 12,
    maxSpeed: player.maxSpeed * 12,
    credits: player.credits,
    laps,
    position: playerEntry.position,
    rivals: rivalsForHud,
  });
  out.write(canvas.toFrameString(hudLine) + "\n" + panel + "\n");
}

function update(dt) {
  if (status.splash) {
    renderSplash();
    return;
  }
  if (status.timer > 0) {
    status.timer = Math.max(0, status.timer - dt);
    if (status.timer === 0 && !status.finished) {
      status.message = defaultStatus;
    }
  }
  if (!status.paused && !status.finished) {
    updatePlayer(dt);
    updateRivals(dt);
  }
  renderFrame();
}

function main() {
  out.write(SEQS.altScreenOn + SEQS.hideCursor);
  createCanvas();
  setupInput();
  enterSplash();

  process.stdout.on("resize", () => {
    createCanvas();
  });

  createFrameLoop(update, { fps: 60 });
}

main();

#!/usr/bin/env node
/* Neon Rails — terminal edition (no deps)
   Controls: ← / → to switch lanes, R to restart, Q to quit
*/
const out = process.stdout;
const sin = Math.sin, cos = Math.cos, sqrt = Math.sqrt, max = Math.max, min = Math.min, abs = Math.abs;
const nowNs = () => process.hrtime.bigint();
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);

// ---------- terminal control ----------
const CSI = "\x1b[";
const hideCursor = CSI + "?25l";
const showCursor = CSI + "?25h";
const altScreenOn  = CSI + "?1049h";
const altScreenOff = CSI + "?1049l";
const clearToEnd = CSI + "0J";
const home = CSI + "H";
const resetSGR = CSI + "0m";
const fg24 = (r,g,b) => `${CSI}38;2;${r|0};${g|0};${b|0}m`;

// truecolor check (most modern terminals support this)
const TRUECOLOR = process.env.FORCE_COLOR || process.env.COLORTERM === 'truecolor' || process.env.TERM?.includes("direct");

// ---------- braille canvas (2×4 dots per cell) ----------
class BrailleCanvas {
  constructor(cols, rows) {
    this.cols = cols; this.rows = rows;
    this.bits = new Uint16Array(cols * rows);
    this.color = new Uint32Array(cols * rows); // 0xRRGGBB
    this.pw = cols * 2;  // pixel width
    this.ph = rows * 4;  // pixel height
  }
  clear() {
    this.bits.fill(0);
    this.color.fill(0);
  }
  // map a pixel (x,y) to braille cell and set its bit + color
  plot(px, py, rgb) {
    if (px < 0 || py < 0 || px >= this.pw || py >= this.ph) return;
    const cx = px >> 1, dx = px & 1;
    const cy = py >> 2, dy = py & 3;
    const idx = cy * this.cols + cx;
    const mask = (dx === 0)
      ? (dy === 0 ? 1 : dy === 1 ? 2 : dy === 2 ? 4 : 64)
      : (dy === 0 ? 8 : dy === 1 ? 16 : dy === 2 ? 32 : 128);
    this.bits[idx] |= mask;
    this.color[idx] = rgb; // latest wins; looks fine for thin lines
  }
  toFrameString(hudLine) {
    const N = this.cols * this.rows;
    let s = home + clearToEnd;
    if (hudLine) s += resetSGR + hudLine + "\n";
    let prev = -1; // previous color
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const i = r * this.cols + c;
        const bits = this.bits[i];
        if (bits === 0) {
          if (prev !== -1) { s += resetSGR; prev = -1; }
          s += " ";
          continue;
        }
        const rgb = this.color[i] >>> 0;
        if (TRUECOLOR) {
          if (rgb !== prev) {
            const R = (rgb >>> 16) & 255, G = (rgb >>> 8) & 255, B = rgb & 255;
            s += fg24(R, G, B);
            prev = rgb;
          }
        }
        s += String.fromCharCode(0x2800 + bits);
      }
      if (prev !== -1) { s += resetSGR; prev = -1; }
      s += "\n";
    }
    return s;
  }
}

// ---------- tiny vec utils ----------
function dot(a,b){ return a.x*b.x + a.y*b.y + a.z*b.z; }
function len(a){ return Math.hypot(a.x, a.y, a.z); }
function norm(a){ const L = len(a) || 1; a.x/=L; a.y/=L; a.z/=L; return a; }
function sub(a,b,out){ out.x=a.x-b.x; out.y=a.y-b.y; out.z=a.z-b.z; return out; }
function add(a,b,out){ out.x=a.x+b.x; out.y=a.y+b.y; out.z=a.z+b.z; return out; }
function mul(a,s,out){ out.x=a.x*s; out.y=a.y*s; out.z=a.z*s; return out; }
function cross(a,b,out){ out.x=a.y*b.z - a.z*b.y; out.y=a.z*b.x - a.x*b.z; out.z=a.x*b.y - a.y*b.x; return out; }
function copy(a){ return {x:a.x,y:a.y,z:a.z}; }
const UP = {x:0,y:1,z:0};

// ---------- “track” (procedural spline-ish) ----------
function trackPoint(s, out){ // world p(s) forward along +x
  const x = s;
  const y = sin(s*0.17)*3 + sin(s*0.05)*1.4;
  const z = cos(s*0.11)*4 + sin(s*0.031)*2.2;
  out.x=x; out.y=y; out.z=z; return out;
}
function frameAt(s){ // Frenet-ish frame from finite diff
  const p = {x:0,y:0,z:0}, q = {x:0,y:0,z:0};
  trackPoint(s, p); trackPoint(s+0.001, q);
  const t = norm(sub(q,p,{x:0,y:0,z:0}));           // tangent
  const b = norm(cross(t, UP, {x:0,y:0,z:0}));      // binormal
  const n = norm(cross(b, t, {x:0,y:0,z:0}));       // normal (left/right)
  return { p, t, n, b };
}
function offsetPoint(s, offN, out){
  const f = frameAt(s);
  out.x = f.p.x + f.n.x*offN;
  out.y = f.p.y + f.n.y*offN;
  out.z = f.p.z + f.n.z*offN;
  return out;
}

// ---------- world → camera → screen ----------
function projectPoint(cam, X, pixW, pixH, f, out){ // returns null if behind
  const v = {x:0,y:0,z:0};
  sub(X, cam.pos, v);
  const x = dot(v, cam.right);
  const y = dot(v, cam.up);
  const z = dot(v, cam.fwd); // forward
  if (z <= 0.05) return null;
  const sx = (x / z) * f + (pixW * 0.5);
  const sy = (-y / z) * f + (pixH * 0.5);
  out.x = sx; out.y = sy; out.z = z; return out;
}

// ---------- game state ----------
let score = 0;
let speed = 0.12;          // units per second (s increases)
let u = 0;                 // param along track
let targetLane = 0;        // -1,0,1
let laneSmooth = 0;
let alive = true;
const laneOffset = 1.6;

const OBST = 80;
const obstacles = new Array(OBST);
for (let i=0;i<OBST;i++) obstacles[i] = { s: 5 + i*1.2 + Math.random()*3, lane: [-1,0,1][(Math.random()*3)|0] };

function resetGame() {
  score = 0; speed = 0.12; u = 0; targetLane = 0; laneSmooth = 0; alive = true;
  for (let i=0;i<OBST;i++) {
    obstacles[i].s = 5 + i*1.2 + Math.random()*4;
    obstacles[i].lane = [-1,0,1][(Math.random()*3)|0];
  }
}

// ---------- colors ----------
const RGB = (r,g,b)=>((r&255)<<16)|((g&255)<<8)|(b&255);
const C = {
  bg: RGB(3,3,12),
  railL: RGB(0,255,255),
  railC: RGB(255,255,255),
  railR: RGB(255,0,255),
  obstacle: RGB(255,98,155),
  player: RGB(255,255,255),
  hud: RGB(201,208,255)
};

// ---------- input ----------
process.stdin.setRawMode?.(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', (ch) => {
  if (!ch) return;
  const code = ch.charCodeAt(0);
  if (ch === 'q' || ch === 'Q' || code === 3) return cleanExit(0); // ^C
  if (ch === 'r' || ch === 'R') resetGame();
  if (ch === '\x1b') {
    // read possible escape sequence for arrows
    pendingEsc = true;
    escTime = nowNs();
    escBuf = ch;
    return;
  }
  // WASD
  if (ch === 'a' || ch === 'A') targetLane = Math.max(-1, targetLane-1);
  if (ch === 'd' || ch === 'D') targetLane = Math.min(1, targetLane+1);
});

let pendingEsc = false, escBuf = "", escTime = 0n;
process.stdin.on('data', (ch) => {
  if (!pendingEsc) return;
  escBuf += ch;
  // Common arrow codes: ESC [ D / ESC [ C
  if (escBuf.startsWith("\x1b[")) {
    const last = escBuf.slice(-1);
    if (last === 'C') { // right
      targetLane = Math.min(1, targetLane+1); pendingEsc = false; escBuf = "";
    } else if (last === 'D') { // left
      targetLane = Math.max(-1, targetLane-1); pendingEsc = false; escBuf = "";
    } else if (/[ABCD]/.test(last)) { pendingEsc = false; escBuf = ""; }
  }
  // timeout
  if (nowNs() - escTime > 5_000_000n) { pendingEsc = false; escBuf = ""; }
});

// ---------- lifecycle ----------
function cleanExit(code=0){
  try {
    out.write(resetSGR + showCursor + altScreenOff);
  } catch {}
  process.stdin.setRawMode?.(false);
  process.exit(code);
}
process.on('SIGINT', ()=>cleanExit(0));
process.on('SIGTERM', ()=>cleanExit(0));
process.on('uncaughtException', (e)=>{ out.write(resetSGR + showCursor + altScreenOff); console.error(e); process.exit(1); });

// ---------- main render loop ----------
function main(){
  out.write(altScreenOn + hideCursor);

  let cols = Math.max(40, out.columns || 80);
  let rows = Math.max(20, (out.rows || 24) - 2); // leave a line for HUD
  let canvas = new BrailleCanvas(cols, rows);

  function handleResize(){
    cols = Math.max(40, out.columns || 80);
    rows = Math.max(20, (out.rows || 24) - 2);
    canvas = new BrailleCanvas(cols, rows);
  }
  process.stdout.on('resize', handleResize);

  const fovDeg = 70;
  const f = 0.5 * (canvas.ph) / Math.tan(fovDeg * Math.PI / 360);

  let last = nowNs();
  const pTmp = {x:0,y:0,z:0}, ahead = {x:0,y:0,z:0}, X = {x:0,y:0,z:0}, scr = {x:0,y:0,z:0};

  function frame(){
    // time step
    const t = nowNs();
    const dt = Number(t - last) / 1e9;
    last = t;

    // update
    if (alive) {
      u += dt * (speed);
      speed = min(0.28, speed + dt * 0.003);
      score += dt * 60;
    } else {
      u += dt * speed * 0.2;
    }
    laneSmooth += (targetLane - laneSmooth) * (alive ? 0.18 : 0.04);

    // camera frame at player
    const f0 = frameAt(u);
    const playerPos = offsetPoint(u, laneSmooth * laneOffset, {x:0,y:0,z:0});
    // camera offset in local frame (n,b,t)
    const camLocal = {x:0.0, y:1.2, z:-4.8}; // x=along normal, y=binormal(up), z=backwards
    const camPos = {
      x: playerPos.x + f0.n.x*camLocal.x + f0.b.x*camLocal.y + f0.t.x*camLocal.z,
      y: playerPos.y + f0.n.y*camLocal.x + f0.b.y*camLocal.y + f0.t.y*camLocal.z,
      z: playerPos.z + f0.n.z*camLocal.x + f0.b.z*camLocal.y + f0.t.z*camLocal.z
    };
    const cam = { pos: camPos, right: f0.n, up: f0.b, fwd: f0.t };

    // draw
    canvas.clear();
    const W = canvas.pw, H = canvas.ph;

    // draw rails
    const lanes = [-1, 0, 1];
    const laneColors = [C.railL, C.railC, C.railR];
    const lookAhead = 80;   // world units to sample ahead
    const step = 0.15;      // sampling step (smaller = denser line)
    for (let li=0; li<3; li++){
      const color = laneColors[li];
      for (let s=u; s< u + lookAhead; s+= step){
        offsetPoint(s, lanes[li]*laneOffset, X);
        if (!projectPoint(cam, X, W, H, f, scr)) continue;
        // small glow: draw a 2x2 stamp around the pixel
        const px = scr.x|0, py = scr.y|0;
        canvas.plot(px, py, color);
        canvas.plot(px+1, py, color);
        canvas.plot(px, py+1, color);
      }
    }

    // draw player (bigger dot)
    if (projectPoint(cam, playerPos, W, H, f, scr)) {
      for (let dy=-1; dy<=1; dy++) for (let dx=-1; dx<=1; dx++) {
        canvas.plot((scr.x|0)+dx, (scr.y|0)+dy, C.player);
      }
    }

    // obstacles and collision
    let hit = false;
    for (let i=0;i<OBST;i++){
      const o = obstacles[i];
      if (o.s < u - 2) { // recycle
        o.s += 85 + Math.random()*15;
        o.lane = [-1,0,1][(Math.random()*3)|0];
      }
      offsetPoint(o.s, o.lane*laneOffset, X);
      if (projectPoint(cam, X, W, H, f, scr)) {
        // make them chunky
        for (let dy=-2; dy<=2; dy++) for (let dx=-2; dx<=2; dx++) {
          canvas.plot((scr.x|0)+dx, (scr.y|0)+dy, C.obstacle);
        }
      }
      // cheap collision in param space
      const d = Math.abs(o.s - u);
      const wrap = Math.min(d % 100, 100 - (d % 100)); // harmless here, keep it small
      const playerLane = Math.round(laneSmooth);
      if (alive && o.lane === playerLane && wrap < 0.22) hit = true;
    }
    if (hit) alive = false;

    // HUD
    const sHUD = `${fg24(200,210,255)}NEON RAILS${resetSGR} — score ${fg24(255,255,255)}${Math.floor(score)}${resetSGR}  ` +
                 `lanes: ←/→  ${alive ? '' : fg24(255,120,120)+'CRASH — press R'+resetSGR}  ${TRUECOLOR?'':'(no truecolor)'}`;

    out.write(canvas.toFrameString(sHUD));

    // continue
    setImmediate(frame);
  }
  frame();
}

main();

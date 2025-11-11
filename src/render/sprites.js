"use strict";

function normalize(v) {
  const len = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / len, y: v.y / len };
}

function scale(v, s) {
  return { x: v.x * s, y: v.y * s };
}

function drawCarSprite(canvas, car, opts = {}) {
  const {
    x,
    y,
    heading = 0,
    colors = { body: 0xffffff, front: 0xffffff, glow: 0xffffff },
  } = car;
  const debug = opts.debugPoints;

  const dir = normalize({
    x: Math.sin(heading),
    y: -Math.cos(heading),
  });
  const side = normalize({
    x: Math.sin(heading + Math.PI / 2),
    y: -Math.cos(heading + Math.PI / 2),
  });

  const points = [
    { offset: { x: 0, y: 0 }, color: colors.body },
    { offset: scale(dir, 2), color: colors.front },
    { offset: scale(dir, -1.5), color: colors.body },
    { offset: scale(side, 1.2), color: colors.body },
    { offset: scale(side, -1.2), color: colors.body },
    { offset: scale(dir, 0.5), color: colors.glow || colors.body },
  ];

  points.forEach((p) => {
    const px = Math.round(x + p.offset.x);
    const py = Math.round(y + p.offset.y);
    canvas.plot(px, py, p.color);
    if (debug) debug.push({ x: px, y: py, color: p.color });
  });
}

module.exports = { drawCarSprite };

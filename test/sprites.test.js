const test = require("node:test");
const assert = require("node:assert/strict");

const { BrailleCanvas } = require("../src/render/braille-canvas");
const { drawCarSprite } = require("../src/render/sprites");

const colors = {
  body: 0xff00ff,
  front: 0xffffff,
  glow: 0x00ffff,
};

test("car sprite marks front cell ahead of heading (up)", () => {
  const canvas = new BrailleCanvas(8, 8);
  const debug = [];
  drawCarSprite(
    canvas,
    { x: 6, y: 10, heading: 0, colors },
    { debugPoints: debug },
  );
  const front = debug.find((p) => p.color === colors.front);
  assert.ok(front, "front highlight missing");
  assert.ok(front.y < 10, "front should be above center when heading up");
});

test("car sprite front shifts for downward heading", () => {
  const canvas = new BrailleCanvas(8, 8);
  const debug = [];
  drawCarSprite(
    canvas,
    { x: 6, y: 10, heading: Math.PI, colors },
    { debugPoints: debug },
  );
  const front = debug.find((p) => p.color === colors.front);
  assert.ok(front, "front highlight missing");
  assert.ok(front.y > 10, "front should be below center when heading down");
});

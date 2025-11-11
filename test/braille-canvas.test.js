const test = require("node:test");
const assert = require("node:assert/strict");

const { BrailleCanvas } = require("../src/render/braille-canvas");

test("BrailleCanvas plot sets dot bits", () => {
  const canvas = new BrailleCanvas(1, 1);
  canvas.plot(0, 0, 0xffffff);
  assert.equal(canvas.bits[0], 1);
  canvas.plot(1, 3, 0xffffff);
  // right column bottom dot -> bit 128
  assert.equal(canvas.bits[0], 1 | 128);
});

test("BrailleCanvas clear resets buffers", () => {
  const canvas = new BrailleCanvas(1, 1);
  canvas.plot(0, 0, 0xff00ff);
  canvas.clear();
  assert.equal(canvas.bits[0], 0);
  assert.equal(canvas.color[0], 0);
});

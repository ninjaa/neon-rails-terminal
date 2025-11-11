const test = require("node:test");
const assert = require("node:assert/strict");

const { projectPoint } = require("../src/math/geometry");

test("projectPoint returns screen coordinates for visible point", () => {
  const cam = {
    pos: { x: 0, y: 0, z: 0 },
    right: { x: 1, y: 0, z: 0 },
    up: { x: 0, y: 1, z: 0 },
    fwd: { x: 0, y: 0, z: 1 },
  };
  const out = { x: 0, y: 0, z: 0 };
  const res = projectPoint(
    cam,
    { x: 0, y: 0, z: 5 },
    80,
    40,
    1,
    out,
  );
  assert.ok(res, "expected point to be visible");
  assert.equal(Math.round(out.x), 40);
  assert.equal(Math.round(out.y), 20);
});

test("projectPoint returns null for points behind camera", () => {
  const cam = {
    pos: { x: 0, y: 0, z: 0 },
    right: { x: 1, y: 0, z: 0 },
    up: { x: 0, y: 1, z: 0 },
    fwd: { x: 0, y: 0, z: 1 },
  };
  const out = { x: 0, y: 0, z: 0 };
  const res = projectPoint(
    cam,
    { x: 0, y: 0, z: -1 },
    80,
    40,
    1,
    out,
  );
  assert.equal(res, null);
});

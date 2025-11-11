const test = require("node:test");
const assert = require("node:assert/strict");

const { buildTrackLayout } = require("../src/render/track");

test("track layout exposes start/finish and pickups", () => {
  const layout = buildTrackLayout();
  assert.ok(layout.width > 0 && layout.height > 0, "layout dimensions missing");
  assert.ok(layout.start, "start missing");
  assert.ok(layout.finish, "finish missing");
  assert.equal(typeof layout.start.x, "number");
  assert.equal(typeof layout.finish.y, "number");
  assert.ok(layout.grid, "grid missing");
  const startTile = layout.grid[layout.start.y][layout.start.x];
  const finishTile = layout.grid[layout.finish.y][layout.finish.x];
  assert.equal(startTile.kind, "start");
  assert.equal(finishTile.kind, "finish");
  assert.ok(startTile.walkable, "start should be walkable");
  assert.ok(finishTile.walkable, "finish should be walkable");

  assert.equal(layout.pickups.length, 3, "expect three GPU pickups");
  layout.pickups.forEach((pos) => {
    const tile = layout.grid[pos.y][pos.x];
    assert.equal(tile.kind, "pickup");
    assert.ok(tile.walkable);
  });
});

test("hazard tiles are flagged non-walkable", () => {
  const layout = buildTrackLayout();
  assert.ok(layout.hazards.length > 0, "need hazards defined");
  layout.hazards.forEach((pos) => {
    const tile = layout.grid[pos.y][pos.x];
    assert.equal(tile.kind, "hazard");
    assert.equal(tile.walkable, false);
  });
});

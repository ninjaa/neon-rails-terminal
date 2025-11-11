const test = require("node:test");
const assert = require("node:assert/strict");

const { renderHudPanel } = require("../src/ui/hud");

const baseState = {
  playerName: "YOU",
  damage: 0.25,
  speed: 38,
  maxSpeed: 60,
  credits: 10,
  laps: { current: 1, total: 3 },
  position: 1,
  rivals: [
    { name: "Bogus Bill", position: 2, damage: 0.6, credits: 5 },
    { name: "Cher Stone", position: 3, damage: 0.2, credits: 2 },
  ],
};

test("HUD panel renders damage bar and sorted rivals", () => {
  const panel = renderHudPanel(baseState);
  assert.match(panel, /Damage\s+\[███/);
  assert.ok(panel.includes("GPU 10"));
  const idxBogus = panel.indexOf("Bogus Bill");
  const idxCher = panel.indexOf("Cher Stone");
  assert.ok(idxBogus > -1 && idxCher > -1);
  assert.ok(idxBogus < idxCher, "rivals should be sorted by position");
});

test("HUD highlights critical damage", () => {
  const panel = renderHudPanel({
    ...baseState,
    damage: 0.92,
  });
  assert.match(panel, /CRITICAL/);
});

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createGameState,
  resetGame,
  recycleObstacle,
} = require("../src/game/state");

const rng = () => 0.5;

test("createGameState builds expected obstacle count", () => {
  const state = createGameState({ rng, obstacleCount: 5 });
  assert.equal(state.obstacles.length, 5);
  assert.equal(state.laneOffset, 1.6);
  assert.equal(state.score, 0);
});

test("resetGame reinitializes score and speed", () => {
  const state = createGameState({ rng, obstacleCount: 2 });
  state.score = 100;
  state.speed = 0.25;
  state.alive = false;
  resetGame(state, rng);
  assert.equal(state.score, 0);
  assert.equal(state.speed, 0.12);
  assert.equal(state.alive, true);
});

test("recycleObstacle pushes obstacle forward", () => {
  const state = createGameState({ rng, obstacleCount: 1 });
  const obstacle = state.obstacles[0];
  obstacle.s = -10;
  recycleObstacle(obstacle, 0, rng);
  assert.ok(obstacle.s > 0);
});

const LANES = [-1, 0, 1];

function randomLane(rng) {
  return LANES[(rng() * LANES.length) | 0];
}

function createObstacle(index, rng) {
  return {
    s: 5 + index * 1.2 + rng() * 3,
    lane: randomLane(rng),
  };
}

function createGameState({
  rng = Math.random,
  obstacleCount = 80,
  laneOffset = 1.6,
} = {}) {
  const obstacles = Array.from({ length: obstacleCount }, (_, i) =>
    createObstacle(i, rng),
  );
  return {
    score: 0,
    speed: 0.12,
    u: 0,
    targetLane: 0,
    laneSmooth: 0,
    alive: true,
    laneOffset,
    obstacles,
    rng,
  };
}

function resetGame(state, rng = state.rng || Math.random) {
  state.score = 0;
  state.speed = 0.12;
  state.u = 0;
  state.targetLane = 0;
  state.laneSmooth = 0;
  state.alive = true;
  const { obstacles } = state;
  for (let i = 0; i < obstacles.length; i++) {
    obstacles[i].s = 5 + i * 1.2 + rng() * 4;
    obstacles[i].lane = randomLane(rng);
  }
}

function recycleObstacle(obstacle, playerU, rng = Math.random) {
  if (obstacle.s < playerU - 2) {
    obstacle.s += 85 + rng() * 15;
    obstacle.lane = randomLane(rng);
  }
}

module.exports = {
  createGameState,
  resetGame,
  recycleObstacle,
  randomLane,
  LANES,
};

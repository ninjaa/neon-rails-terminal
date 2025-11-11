const nowNs = () => process.hrtime.bigint();
const nowMs = () => Number(nowNs()) / 1e6;

function createFrameLoop(step, { fps = 60 } = {}) {
  const frameDurationMs = 1000 / fps;
  let running = true;
  let last = nowMs();

  function tick() {
    if (!running) return;
    const before = nowMs();
    const dt = Math.min((before - last) / 1000, 0.1);
    last = before;
    try {
      step(dt);
    } catch (err) {
      running = false;
      throw err;
    }
    const after = nowMs();
    const workTime = after - before;
    const delay = Math.max(0, frameDurationMs - workTime);
    setTimeout(tick, delay);
  }

  setTimeout(tick, frameDurationMs);

  return () => {
    running = false;
  };
}

module.exports = { nowNs, createFrameLoop };

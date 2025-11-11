const nowNs = () => process.hrtime.bigint();

function createFrameLoop(step) {
  let running = true;
  let last = nowNs();

  function frame() {
    if (!running) return;
    const t = nowNs();
    const dt = Math.min(Number(t - last) / 1e9, 0.033);
    last = t;
    try {
      step(dt);
    } catch (err) {
      running = false;
      throw err;
    }
    setImmediate(frame);
  }

  frame();

  return () => {
    running = false;
  };
}

module.exports = { nowNs, createFrameLoop };

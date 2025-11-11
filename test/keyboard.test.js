const test = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");

const { createKeyboardController } = require("../src/input/keyboard");

class MockStdin extends EventEmitter {
  constructor() {
    super();
    this.rawMode = false;
    this.encoding = null;
    this.resumed = false;
  }
  setRawMode(val) {
    this.rawMode = val;
  }
  resume() {
    this.resumed = true;
  }
  setEncoding(enc) {
    this.encoding = enc;
  }
  off(event, handler) {
    this.removeListener(event, handler);
  }
  emitChunk(chunk) {
    this.emit("data", chunk);
  }
}

test("keyboard controller handles arrow lane changes", () => {
  const stdin = new MockStdin();
  let lane = 0;
  const controller = createKeyboardController({
    stdin,
    onLaneChange(delta) {
      lane += delta;
    },
  });

  stdin.emitChunk("\x1b");
  stdin.emitChunk("[");
  stdin.emitChunk("C");

  assert.equal(lane, 1);
  controller.dispose();
  assert.equal(stdin.rawMode, false);
});

test("keyboard controller triggers restart and quit handlers", () => {
  const stdin = new MockStdin();
  let restarted = false;
  let quitCode = null;
  const controller = createKeyboardController({
    stdin,
    onRestart() {
      restarted = true;
    },
    onQuit(code) {
      quitCode = code;
    },
  });

  stdin.emitChunk("r");
  stdin.emitChunk("q");

  assert.ok(restarted);
  assert.equal(quitCode, "q".charCodeAt(0));

  controller.dispose();
});

test("keyboard controller emits throttle events for keys and arrows", () => {
  const stdin = new MockStdin();
  let throttle = 0;
  const controller = createKeyboardController({
    stdin,
    onThrottle(delta) {
      throttle += delta;
    },
  });
  stdin.emitChunk("w");
  assert.equal(throttle, 1);
  stdin.emitChunk("s");
  assert.equal(throttle, 0);

  stdin.emitChunk("\x1b");
  stdin.emitChunk("[");
  stdin.emitChunk("A");
  assert.equal(throttle, 1);
  stdin.emitChunk("\x1b");
  stdin.emitChunk("[");
  stdin.emitChunk("B");
  assert.equal(throttle, 0);

  controller.dispose();
});

test("keyboard controller triggers start handler on space/enter", () => {
  const stdin = new MockStdin();
  let started = 0;
  const controller = createKeyboardController({
    stdin,
    onStart() {
      started += 1;
    },
  });
  stdin.emitChunk(" ");
  stdin.emitChunk("\r");
  stdin.emitChunk("\x1b");
  stdin.emitChunk("[");
  stdin.emitChunk("Z");
  assert.equal(started, 3);
  controller.dispose();
});

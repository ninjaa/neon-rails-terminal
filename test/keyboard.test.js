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

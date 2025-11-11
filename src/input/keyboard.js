const { nowNs } = require("../runtime/loop");

const ESC = "\x1b";

function createKeyboardController({
  stdin = process.stdin,
  onLaneChange = () => {},
  onRestart = () => {},
  onQuit = () => {},
  onPause = () => {},
  onThrottle = () => {},
} = {}) {
  stdin.setRawMode?.(true);
  stdin.resume();
  stdin.setEncoding("utf8");

  let pendingEsc = false;
  let escBuf = "";
  let escTime = 0n;

  function handleChunk(ch) {
    if (!ch) return;
    const code = ch.charCodeAt(0);
    if (ch === ESC) {
      pendingEsc = true;
      escBuf = ch;
      escTime = nowNs();
      return;
    }
    if (pendingEsc) {
      escBuf += ch;
      if (escBuf.startsWith("\x1b[")) {
        const last = escBuf.slice(-1);
        if (last === "C") {
          onLaneChange(1);
          pendingEsc = false;
          escBuf = "";
        } else if (last === "D") {
          onLaneChange(-1);
          pendingEsc = false;
          escBuf = "";
        } else if (last === "A") {
          onThrottle(1);
          pendingEsc = false;
          escBuf = "";
        } else if (last === "B") {
          onThrottle(-1);
          pendingEsc = false;
          escBuf = "";
        } else if (/[ABCD]/.test(last)) {
          pendingEsc = false;
          escBuf = "";
        }
      }
      if (nowNs() - escTime > 5_000_000n) {
        pendingEsc = false;
        escBuf = "";
      }
      return;
    }
    switch (ch) {
      case "a":
      case "A":
        onLaneChange(-1);
        break;
      case "d":
      case "D":
        onLaneChange(1);
        break;
      case "w":
      case "W":
        onThrottle(1);
        break;
      case "s":
      case "S":
        onThrottle(-1);
        break;
      case "r":
      case "R":
        onRestart();
        break;
      case "p":
      case "P":
        onPause();
        break;
      case "q":
      case "Q":
      case "\u0003": // ^C
        onQuit(code);
        break;
      default:
        break;
    }
  }

  stdin.on("data", handleChunk);

  function dispose() {
    stdin.off?.("data", handleChunk);
    stdin.setRawMode?.(false);
  }

  return { dispose };
}

module.exports = { createKeyboardController };

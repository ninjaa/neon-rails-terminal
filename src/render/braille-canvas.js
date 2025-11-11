const { SEQS, fg24, TRUECOLOR } = require("../terminal/io");

class BrailleCanvas {
  constructor(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.bits = new Uint16Array(cols * rows);
    this.color = new Uint32Array(cols * rows); // 0xRRGGBB
    this.pw = cols * 2;
    this.ph = rows * 4;
  }

  clear() {
    this.bits.fill(0);
    this.color.fill(0);
  }

  plot(px, py, rgb) {
    if (px < 0 || py < 0 || px >= this.pw || py >= this.ph) return;
    const cx = px >> 1;
    const dx = px & 1;
    const cy = py >> 2;
    const dy = py & 3;
    const idx = cy * this.cols + cx;
    const mask =
      dx === 0
        ? dy === 0
          ? 1
          : dy === 1
            ? 2
            : dy === 2
              ? 4
              : 64
        : dy === 0
          ? 8
          : dy === 1
            ? 16
            : dy === 2
              ? 32
              : 128;
    this.bits[idx] |= mask;
    this.color[idx] = rgb;
  }

  toFrameString(hudLine) {
    let s = SEQS.home + SEQS.clearToEnd;
    if (hudLine) s += SEQS.reset + hudLine + "\n";
    let prev = -1;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const i = r * this.cols + c;
        const bits = this.bits[i];
        if (bits === 0) {
          if (prev !== -1) {
            s += SEQS.reset;
            prev = -1;
          }
          s += " ";
          continue;
        }
        const rgb = this.color[i] >>> 0;
        if (TRUECOLOR) {
          if (rgb !== prev) {
            const R = (rgb >>> 16) & 255;
            const G = (rgb >>> 8) & 255;
            const B = rgb & 255;
            s += fg24(R, G, B);
            prev = rgb;
          }
        }
        s += String.fromCharCode(0x2800 + bits);
      }
      if (prev !== -1) {
        s += SEQS.reset;
        prev = -1;
      }
      s += "\n";
    }
    return s;
  }
}

module.exports = { BrailleCanvas };

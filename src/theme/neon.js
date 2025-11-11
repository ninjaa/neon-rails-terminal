const { fg24, SEQS } = require("../terminal/io");

const RGB = (r, g, b) => ((r & 255) << 16) | ((g & 255) << 8) | (b & 255);

const palette = {
  bg: RGB(3, 3, 12),
  railL: RGB(0, 255, 255),
  railC: RGB(255, 255, 255),
  railR: RGB(255, 0, 255),
  obstacle: RGB(255, 98, 155),
  player: RGB(255, 255, 255),
  hud: RGB(201, 208, 255),
};

function formatHud({ score, alive, message, truecolor }) {
  const tc = truecolor ? "" : " (no truecolor)";
  const base = `${fg24(200, 210, 255)}NEON RAILS${SEQS.reset} — score ${fg24(255, 255, 255)}${Math.floor(
    score,
  )}${SEQS.reset}  lanes: ←/→${tc}`;
  if (!alive) {
    return `${base}  ${fg24(255, 120, 120)}${message || "CRASH — press R"}${SEQS.reset}`;
  }
  if (message) {
    return `${base}  ${fg24(170, 230, 255)}${message}${SEQS.reset}`;
  }
  return base;
}

module.exports = { palette, formatHud, RGB };

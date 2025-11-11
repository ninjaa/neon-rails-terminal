const CSI = "\x1b[";

const SEQS = {
  hideCursor: `${CSI}?25l`,
  showCursor: `${CSI}?25h`,
  altScreenOn: `${CSI}?1049h`,
  altScreenOff: `${CSI}?1049l`,
  clearToEnd: `${CSI}0J`,
  home: `${CSI}H`,
  reset: `${CSI}0m`,
};

const fg24 = (r, g, b) => `${CSI}38;2;${r | 0};${g | 0};${b | 0}m`;

const TRUECOLOR =
  process.env.FORCE_COLOR ||
  process.env.COLORTERM === "truecolor" ||
  process.env.TERM?.includes("direct");

module.exports = {
  CSI,
  SEQS,
  fg24,
  TRUECOLOR,
};

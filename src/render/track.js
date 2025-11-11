"use strict";

const LEGEND = {
  "#": { kind: "wall", walkable: false },
  ".": { kind: "road", walkable: true },
  " ": { kind: "void", walkable: false },
  "S": { kind: "start", walkable: true },
  "F": { kind: "finish", walkable: true },
  "P": { kind: "pickup", walkable: true },
  "B": { kind: "boost", walkable: true },
  "H": { kind: "hazard", walkable: false },
};

const TRACK_ASCII = [
  "###########     ",
  "#S..P..###     ",
  "#..##..#B#     ",
  "#..##..#.#     ",
  "#..##..#.#     ",
  "#..##..#.#     ",
  "#..##..#.#     ",
  "#..####H.#     ",
  "#..P....F#     ",
  "#..#######     ",
  "#P........     ",
  "###############",
];

function buildTrackLayout() {
  const grid = [];
  const pickups = [];
  const hazards = [];
  const boosts = [];
  let start = null;
  let finish = null;

  const height = TRACK_ASCII.length;
  const width = Math.max(...TRACK_ASCII.map((row) => row.length));

  for (let y = 0; y < height; y++) {
    const row = TRACK_ASCII[y].padEnd(width, " ");
    const gridRow = [];
    for (let x = 0; x < width; x++) {
      const ch = row[x] ?? " ";
      const tileDef = LEGEND[ch] || LEGEND[" "];
      const tile = {
        kind: tileDef.kind,
        walkable: tileDef.walkable,
      };
      gridRow.push(tile);
      if (tile.kind === "pickup") pickups.push({ x, y });
      if (tile.kind === "hazard") hazards.push({ x, y });
      if (tile.kind === "boost") boosts.push({ x, y });
      if (tile.kind === "start") start = { x, y };
      if (tile.kind === "finish") finish = { x, y };
    }
    grid.push(gridRow);
  }

  return {
    width,
    height,
    grid,
    start,
    finish,
    pickups,
    hazards,
    boosts,
    legend: LEGEND,
  };
}

module.exports = { buildTrackLayout };

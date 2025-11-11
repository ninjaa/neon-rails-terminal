"use strict";

const SEGMENTS = 10;

function clamp(val, min = 0, max = 1) {
  return Math.min(max, Math.max(min, val));
}

function makeBar(ratio) {
  const clamped = clamp(ratio);
  const filled = Math.round(clamped * SEGMENTS);
  return "█".repeat(filled).padEnd(SEGMENTS, "░");
}

function ordinal(position) {
  const suffix = ["th", "st", "nd", "rd"];
  const v = position % 100;
  return position + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
}

function renderHudPanel(state) {
  const {
    playerName = "You",
    damage = 0,
    speed = 0,
    maxSpeed = 1,
    credits = 0,
    laps = { current: 0, total: 0 },
    position = 1,
    rivals = [],
  } = state;

  const dmgPct = Math.round(clamp(damage) * 100);
  const damageBar = makeBar(damage);
  const critical = dmgPct >= 75;

  const standings = [
    { name: playerName, position, tag: "YOU", damage, credits },
    ...rivals.map((r) => ({
      name: r.name,
      position: r.position,
      tag: r.name,
      damage: r.damage ?? 0,
      credits: r.credits ?? 0,
    })),
  ].sort((a, b) => a.position - b.position);

  const lines = [];
  lines.push("╔════ NEON STATUS ════╗");
  lines.push(
    `║ Damage [${damageBar}] ${String(dmgPct).padStart(3, " ")}%${
      critical ? " CRITICAL" : "         "
    }║`,
  );
  const speedStr = `${speed.toFixed(0)} / ${maxSpeed.toFixed(0)}`.padEnd(13, " ");
  lines.push(`║ Speed  ${speedStr}║`);
  lines.push(`║ GPU ${String(credits).padEnd(11, " ")}║`);
  const lapStr = `${laps.current}/${laps.total}`;
  lines.push(`║ Lap ${lapStr.padEnd(12, " ")}║`);
  lines.push("║ Rivals             ║");
  standings.forEach((racer, idx) => {
    const place = ordinal(idx + 1).padEnd(4, " ");
    const name = racer.tag.padEnd(10, " ");
    lines.push(`║ ${place}${name}║`);
  });
  lines.push("╚═════════════════════╝");
  return lines.join("\n");
}

module.exports = { renderHudPanel };

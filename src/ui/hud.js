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
    raceTime = 0,
  } = state;

  const health = Math.max(0, 1 - damage);
  const healthPct = Math.round(health * 100);
  const healthBar = makeBar(health);
  const critical = healthPct <= 25;

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
  lines.push("╔═══════════════════════════════════════╗");
  lines.push("║           NEON RAILS v0.1             ║");
  lines.push("║        SOMA UNDERGROUND 2025          ║");
  lines.push("╠═══════════════════════════════════════╣");
  lines.push(`║ GPU CREDITS: ${String(credits).padStart(3, " ")}                      ║`);
  lines.push(
    `║ HP: ${healthBar} ${String(healthPct).padStart(3, " ")}%${
      critical ? " ⚠" : "  "
    }            ║`,
  );
  const timeSeconds = Math.floor((raceTime || 0) / 20);
  lines.push(`║ TIME: ${String(timeSeconds).padStart(3, " ")}s                           ║`);
  const speedStr = `${speed.toFixed(0)}/${maxSpeed.toFixed(0)} km/h`;
  lines.push(`║ SPEED: ${speedStr.padEnd(10, " ")}                 ║`);
  const lapStr = `${laps.current}/${laps.total}`;
  lines.push(`║ LAP: ${lapStr.padEnd(7, " ")}                        ║`);
  lines.push("╠═══════════════════════════════════════╣");
  lines.push("║ STANDINGS:                            ║");
  standings.forEach((racer, idx) => {
    const place = ordinal(idx + 1).padEnd(4, " ");
    const name = racer.tag === "YOU" ? "▶ YOU" : `  ${racer.tag}`;
    const entry = `${place} ${name.padEnd(15, " ")}`;
    lines.push(`║ ${entry.padEnd(37, " ")} ║`);
  });
  lines.push("╚═══════════════════════════════════════╝");
  if (critical) {
    lines.push("    SURVEILLANCE DRONES DETECTED...");
  }
  return lines.join("\n");
}

module.exports = { renderHudPanel };

#!/usr/bin/env node
const { spawn } = require("node:child_process");
const path = require("node:path");

const args = process.argv.slice(2);

function readFlag(name, fallback) {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx === args.length - 1) return fallback;
  return args[idx + 1];
}

const macros = {
  lanes: [
    { time: 0.2, seq: "\r" },
    { time: 0.9, seq: "\u001b[C" },
    { time: 1.5, seq: "\u001b[C" },
    { time: 2.1, seq: "\u001b[D" },
    { time: 2.7, seq: "r" },
  ],
  pause: [
    { time: 0.2, seq: "\r" },
    { time: 0.9, seq: "p" },
    { time: 1.6, seq: "p" },
    { time: 2.2, seq: "r" },
  ],
};

const macroName = readFlag("macro", "lanes");
const macro = macros[macroName] || macros.lanes;
const duration = Number(readFlag("duration", "5")) || 5;
const outputFlag = readFlag("output", "");
const outputPath = outputFlag ? path.resolve(process.cwd(), outputFlag) : "";

const pythonScript = `
import os, pty, time, select, sys, json

cmd = ${JSON.stringify(["npx", "."])}
macro = json.loads(${JSON.stringify(JSON.stringify(macro))})
duration = ${duration}
output_path = ${JSON.stringify(outputPath)}

pid, fd = pty.fork()
if pid == 0:
    os.execvp(cmd[0], cmd)

start = time.time()
end_time = start + duration
deadline = end_time + 2
idx = 0
quit_sent = False
log = None
if output_path:
    log = open(output_path, "w", encoding="utf-8")

def write_data(data):
    sys.stdout.buffer.write(data)
    sys.stdout.flush()
    if log:
        log.write(data.decode("utf-8", "ignore"))

try:
    while True:
        now = time.time()
        if idx < len(macro) and now - start >= macro[idx]["time"]:
            os.write(fd, macro[idx]["seq"].encode("utf-8"))
            idx += 1
        if not quit_sent and now >= end_time:
            try:
                os.write(fd, b"q")
            except OSError:
                pass
            quit_sent = True
        r, _, _ = select.select([fd], [], [], 0.05)
        if fd in r:
            data = os.read(fd, 4096)
            if not data:
                break
            write_data(data)
        if quit_sent and now >= deadline:
            break
finally:
    if log:
        log.close()

_, status = os.waitpid(pid, 0)
sys.exit(os.WEXITSTATUS(status))
`;

function runWith(interpreters) {
  if (!interpreters.length) {
    console.error("python3 or python is required to run the smoke harness.");
    process.exit(1);
  }
  const interpreter = interpreters[0];
  const child = spawn(interpreter, ["-c", pythonScript], {
    stdio: "inherit",
    env: process.env,
  });
  let forwarded = false;
  child.once("error", (err) => {
    if (err.code === "ENOENT") {
      runWith(interpreters.slice(1));
      forwarded = true;
      return;
    }
    console.error(err);
    process.exit(1);
  });
  child.once("exit", (code, signal) => {
    if (forwarded) return;
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code ?? 0);
    }
  });
}

runWith(["python3", "python"]);

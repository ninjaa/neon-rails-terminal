const sin = Math.sin;
const cos = Math.cos;

const UP = { x: 0, y: 1, z: 0 };

function trackPoint(s, out) {
  const x = s;
  const y = sin(s * 0.17) * 3 + sin(s * 0.05) * 1.4;
  const z = cos(s * 0.11) * 4 + sin(s * 0.031) * 2.2;
  out.x = x;
  out.y = y;
  out.z = z;
  return out;
}

function len(a) {
  return Math.hypot(a.x, a.y, a.z);
}

function norm(a) {
  const L = len(a) || 1;
  a.x /= L;
  a.y /= L;
  a.z /= L;
  return a;
}

function sub(a, b, out) {
  out.x = a.x - b.x;
  out.y = a.y - b.y;
  out.z = a.z - b.z;
  return out;
}

function cross(a, b, out) {
  out.x = a.y * b.z - a.z * b.y;
  out.y = a.z * b.x - a.x * b.z;
  out.z = a.x * b.y - a.y * b.x;
  return out;
}

function frameAt(s) {
  const p = { x: 0, y: 0, z: 0 };
  const q = { x: 0, y: 0, z: 0 };
  trackPoint(s, p);
  trackPoint(s + 0.001, q);
  const t = norm(sub(q, p, { x: 0, y: 0, z: 0 }));
  const b = norm(cross(t, UP, { x: 0, y: 0, z: 0 }));
  const n = norm(cross(b, t, { x: 0, y: 0, z: 0 }));
  return { p, t, n, b };
}

function offsetPoint(s, offN, out) {
  const f = frameAt(s);
  out.x = f.p.x + f.n.x * offN;
  out.y = f.p.y + f.n.y * offN;
  out.z = f.p.z + f.n.z * offN;
  return out;
}

function projectPoint(cam, X, pixW, pixH, f, out) {
  const v = { x: 0, y: 0, z: 0 };
  sub(X, cam.pos, v);
  const x = v.x * cam.right.x + v.y * cam.right.y + v.z * cam.right.z;
  const y = v.x * cam.up.x + v.y * cam.up.y + v.z * cam.up.z;
  const z = v.x * cam.fwd.x + v.y * cam.fwd.y + v.z * cam.fwd.z;
  if (z <= 0.05) return null;
  const sx = (x / z) * f + pixW * 0.5;
  const sy = (-y / z) * f + pixH * 0.5;
  out.x = sx;
  out.y = sy;
  out.z = z;
  return out;
}

module.exports = {
  trackPoint,
  frameAt,
  offsetPoint,
  projectPoint,
  len,
  norm,
  sub,
  cross,
  UP,
};

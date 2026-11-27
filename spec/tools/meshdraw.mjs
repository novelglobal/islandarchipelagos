/* A drawing as one mesh message (format ng1, read by kit/island/mesh.go): strokes on a grid 64 cells across, each move a nibble pair,
   so a sketch of about 150 moves fits a LoRa message (about 230 bytes) as text any Meshtastic app can send.
   encode(strokes, h)  strokes: [[[x, y], [x, y], ...], ...] in cells (0 to 63 across, 0 to h-1 down) -> 'ng1:...'
   fromPoints(lines, w, h, maxH)  lines in any units (a canvas's pixels) -> the same, laid on the grid, simplified to fit
   node tools/meshdraw.mjs        writes the shared cases (fixtures/mesh.json) the island's tests read */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const MAX = 240;
const b64 = u => Buffer.from(u).toString('base64url');

export function encode(strokes, h) {
  const out = [h];
  for (const s of strokes) { if (!s.length) continue;
    let [x, y] = s[0]; const moves = [];
    for (const [tx, ty] of s.slice(1)) { while (x !== tx || y !== ty) { const dx = Math.max(-8, Math.min(7, tx - x)), dy = Math.max(-8, Math.min(7, ty - y)); moves.push(((dx & 15) << 4) | (dy & 15)); x += dx; y += dy; } }
    for (let i = 0; i < Math.max(1, moves.length); i += 255) { const part = moves.slice(i, i + 255), at = i ? null : s[0];
      out.push(...(at || [x, y]), part.length, ...part); }
  }
  return 'ng1:' + b64(out);
}

/* lines in pixels to the grid: snapped, repeats dropped, then thinned (every other point) until the message fits */
export function fromPoints(lines, w, h, maxH = 160) {
  const k = 64 / w, H = Math.max(1, Math.min(maxH, Math.ceil(h * k)));
  let st = lines.map(l => l.map(([x, y]) => [Math.max(0, Math.min(63, Math.round(x * k))), Math.max(0, Math.min(H - 1, Math.round(y * k)))]).filter((p, i, a) => !i || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1])).filter(l => l.length);
  let m = encode(st, H);
  while (m.length > MAX && st.some(l => l.length > 2)) { st = st.map(l => l.length > 2 ? l.filter((p, i) => i % 2 === 0 || i === l.length - 1) : l); m = encode(st, H); }
  return m.length > MAX ? null : m;
}

if (import.meta.url === 'file://' + process.argv[1]) {
  const circle = Array.from({ length: 25 }, (_, i) => [32 + Math.round(20 * Math.cos(i / 24 * 2 * Math.PI)), 24 + Math.round(20 * Math.sin(i / 24 * 2 * Math.PI))]);
  const cases = [
    { name: 'a line across', h: 8, strokes: [[[0, 4], [63, 4]]] },
    { name: 'a circle and a cross', h: 48, strokes: [circle, [[24, 16], [40, 32]], [[40, 16], [24, 32]]] },
    { name: 'a dot', h: 4, strokes: [[[10, 2]]] }
  ].map(c => ({ ...c, msg: encode(c.strokes, c.h) }));
  const f = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'mesh.json');
  fs.writeFileSync(f, JSON.stringify({ cases, bad: ['ng1:', 'ng1:AA', 'ng1:' + b64([8, 70, 0, 0]), 'ng1:' + b64([8, 0, 0, 2, 0x10])] }, null, 1) + '\n');
  for (const c of cases) console.log(c.name, c.msg.length, 'characters');
}

/* The print engine held still: web/src/base/thermal.js (the one engine, in every browser and on every island's page) run on fixed
   pictures with fixed settings, its printer bytes fingerprinted. A change that moves a print fails here until it is meant:
   node tools/engine.mjs           check against fixtures/engine.json
   node tools/engine.mjs --write   take the new prints as the fixtures (after looking: --see writes each one as a PNG)
   node tools/engine.mjs --see DIR the prints, as the paper they would make (tools/see.mjs) */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { see, png } from './see.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..', '..');
const ENGINE = path.join(ROOT, 'web/src/base/thermal.js'), FIX = path.join(HERE, '..', 'fixtures', 'engine.json');

export function engine(file = ENGINE) {
  const ctx = { window: {}, btoa: s => Buffer.from(s, 'latin1').toString('base64'), Math, Float32Array, Uint8Array, Uint32Array, Int32Array, Array, Object, String, Number, JSON, isFinite, parseInt, RegExp };
  vm.createContext(ctx); vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file });
  return ctx.window.THERMAL;
}

/* a canvas as far as T.raster reads one: its size, and its pixels grey */
const canvasOf = (L, W, H) => { const d = new Uint8ClampedArray(W * H * 4); for (let i = 0; i < W * H; i++) { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = L[i]; d[i * 4 + 3] = 255; }
  return { width: W, height: H, getContext: () => ({ getImageData: () => ({ data: d }) }) }; };

/* the pictures: each made from numbers alone, the same on every machine */
const rng = s => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
const W = 512;
const PICS = {
  /* a ramp, dark to light, with a band of the sixteen steps under it: where greys band or crush */
  ramp: (() => { const H = 160, L = new Float32Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) L[y * W + x] = y < 100 ? x / (W - 1) * 255 : Math.floor(x / W * 16) * 17; return { L, H }; })(),
  /* a lit sphere on a shadowed ground: smooth tones, one hard edge */
  sphere: (() => { const H = 320, L = new Float32Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const dx = (x - 256) / 120, dy = (y - 150) / 120, r = dx * dx + dy * dy;
    L[y * W + x] = r < 1 ? 40 + 200 * Math.max(0, -dx * 0.5 - dy * 0.6 + Math.sqrt(1 - r) * 0.62) : 120 + 100 * (y / H) - 60 * Math.exp(-((x - 300) ** 2 + (y - 290) ** 2) / 4000); } return { L, H }; })(),
  /* grain: a soft field with fine noise, the way a phone photograph is */
  grain: (() => { const H = 240, L = new Float32Array(W * H), r = rng(7); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) L[y * W + x] = Math.max(0, Math.min(255, 128 + 90 * Math.sin(x / 40) * Math.cos(y / 30) + (r() - 0.5) * 40)); return { L, H }; })(),
  /* drawn art: black shapes on paper, few mid-tones (laid black or white, never grey) */
  art: (() => { const H = 160, L = new Float32Array(W * H).fill(255); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if ((x > 40 && x < 200 && y > 30 && y < 130) || ((x - 360) ** 2 + (y - 80) ** 2 < 2500)) L[y * W + x] = 0; return { L, H }; })()
};
/* the settings: the house default, its three tones, and each way to lay a photograph */
const SETTINGS = (T) => ({
  house: T.settle(null, null),
  light: T.settle({ tone: 'light' }, null),
  dark: T.settle({ tone: 'dark' }, null),
  ...Object.fromEntries(T.QUALITY.map(q => ['way-' + q.key, T.settle({ dither: q.id, order: q.order }, null)]))
});

export function prints(T) {
  const out = {}, S = SETTINGS(T);
  for (const [p, pic] of Object.entries(PICS)) for (const [s, Q] of Object.entries(S)) {
    const L = Float32Array.from(pic.L), how = T.ready(L, W, pic.H, Q), grey = T.isGrey(how);
    const bytes = Buffer.from(T.raster(canvasOf(L, W, pic.H), Object.assign(T.opts(Q), { grey }), null), 'base64');
    out[p + '/' + s] = { how, grey, bytes };
  }
  return out;
}

if (import.meta.url === 'file://' + process.argv[1]) {
  const args = process.argv.slice(2), T = engine(), got = prints(T), now = {};
  for (const [k, v] of Object.entries(got)) now[k] = { how: v.how, bytes: v.bytes.length, sha256: crypto.createHash('sha256').update(v.bytes).digest('hex').slice(0, 32) };
  if (args.includes('--see')) { const dir = args[args.indexOf('--see') + 1]; fs.mkdirSync(dir, { recursive: true });
    for (const [k, v] of Object.entries(got)) { const r = see(v.bytes); fs.writeFileSync(path.join(dir, k.replace('/', '-') + '.png'), png(r.rows, r.width)); } console.log('the prints: ' + dir); }
  if (args.includes('--write')) { fs.writeFileSync(FIX, JSON.stringify(now, null, 1) + '\n'); console.log(`${Object.keys(now).length} prints held in ${path.relative(ROOT, FIX)}`); process.exit(0); }
  const was = fs.existsSync(FIX) ? JSON.parse(fs.readFileSync(FIX, 'utf8')) : {}, bad = [];
  for (const k of new Set([...Object.keys(was), ...Object.keys(now)])) if (JSON.stringify(was[k]) !== JSON.stringify(now[k])) bad.push(`${k}: was ${JSON.stringify(was[k])}, now ${JSON.stringify(now[k])}`);
  /* and every print the engine makes is one an island takes: no stored settings, nothing but pictures, speed, parts and a cut */
  for (const [k, v] of Object.entries(got)) { const r = see(v.bytes); if (r.unknown.length) bad.push(`${k}: bytes the pretend printer does not know: ${r.unknown.join(' ')}`); if (r.cuts !== 1) bad.push(`${k}: ${r.cuts} cuts`); }
  if (bad.length) { console.error('the engine moved:\n  ' + bad.join('\n  ') + '\nif it is meant: node tools/engine.mjs --see /tmp/prints, look, then --write'); process.exit(1); }
  console.log(`engine: ${Object.keys(now).length} prints as held`);
}

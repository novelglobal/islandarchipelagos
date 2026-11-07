/* The shared test of matching bytes. Each case in fixtures/golden is a whole input (board, mods, what each mod gives now,
   settings, connections, printer) and the bytes it must make, as hex. tools/slip.mjs, engine/slip (go test) and front's
   worker all run the same cases.
   node tools/golden.mjs           checks every case against tools/slip.mjs
   node tools/golden.mjs --write   makes the cases again from mods/ and the column, and writes what slip.mjs gives */
import fs from 'node:fs';
import path from 'node:path';
import { compile, hex } from './slip.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const dir = path.join(root, 'fixtures', 'golden');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));

if (process.argv.includes('--write')) write();
let bad = 0, n = 0;
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
  const want = fs.readFileSync(path.join(dir, f.replace(/\.json$/, '.hex')), 'utf8').replace(/\s+/g, '');
  const got = hex(compile(read(path.join(dir, f)))).replace(/\s+/g, '');
  n++;
  if (got !== want) { bad++; console.log(`  ✗ ${f}: differs at byte ${[...got].findIndex((c, i) => c !== want[i]) >> 1}`); }
}
console.log(bad ? `\n${bad} of ${n} slips differ` : `${n} slips match, byte for byte`);
process.exit(bad ? 1 : 0);

function write() {
  /* every mod, with its slip read in */
  const mods = fs.readdirSync(path.join(root, 'mods')).map(d => {
    const m = read(path.join(root, 'mods', d, 'mod.json'));
    const { $schema, about, licence, mark, ...rest } = m;
    const { $schema: _, ...slip } = read(path.join(root, 'mods', d, m.slip));
    return { ...rest, slip };
  });
  const column = read(path.join(root, 'islands', 'novel-global', 'cards.json'));
  const jacks = Object.fromEntries(column.cards.filter(c => c.jack).map(c => [c.jack, c.mod]));
  const profile = id => { const p = read(path.join(root, 'profiles', id + '.json')); return { dpi: p.dpi, dots: p.papers[0].dots, cutter: p.cutter }; };
  /* small grey pictures, made the same way every time */
  const pic = (w, h, f) => { const b = Buffer.alloc(w * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) b[y * w + x] = f(x, y); return { w, h, grey: b.toString('base64') }; };
  const slope = pic(48, 32, (x, y) => Math.floor((x * 5 + y * 3) * 255 / 328));
  const moon = pic(32, 32, (x, y) => (x - 16) * (x - 16) + (y - 16) * (y - 16) < 144 ? 40 : 220);
  const reef = pic(40, 24, (x, y) => (x + y) % 6 < 2 || y > 20 ? 30 : 235);
  const state = {
    'novel-global-wish': { WORDS: 'the drain that holds', CODE: { code: 'DA-7Q2K', url: 'https://novel.global/#x=DA-7Q2K' } },
    'novel-global-radio': { SOUND: { title: 'FOG ON THE CREEK', code: 'T-3', url: 'https://novel.global/#t=T-3' }, CODE: { code: 'T-3', url: 'https://novel.global/#t=T-3' } },
    'pickles-zine': { LENGTH: 'strip', PICTURE: slope },
    'novel-global-kit': { LIST: [{ text: 'a TM-T88V, second-hand', done: true }, 'a Pi 3 and its card', 'write the card', 'plug in and print'] },
    'novel-global-space': { WORDS: 'brunswick east', CODE: 'BE-2K7QF' },
    'novel-global-reef': { PICTURE: reef },
    'novel-global-eye': { PICTURE: moon, SOUND: { title: 'FOG HORN', code: 'E-1' } }
  };
  const all = { 'novel-global': ['wish', 'radio', 'art', 'words', 'cards', 'codes'], pickles: ['wish', 'radio', 'art', 'words', 'cards', 'codes'] };
  const base = { jacks, mods, state, settings: {}, on: all, printer: profile('tm-t88v') };
  const cases = {
    '01-wish-alone': { board: '', press: 'novel-global-wish' },
    '02-radio-into-wish': { board: 'RW', press: 'novel-global-wish' },
    '03-zine-makes-wish-a-strip': { board: 'RW/ZW', press: 'novel-global-wish' },
    '04-wish-and-radio-into-zine': { board: 'RW/ZW/RZ', press: 'pickles-zine', settings: { 'pickles-zine': { ink: true } } },
    '05-kit-into-wish': { board: 'KW', press: 'novel-global-wish' },
    '06-eye-needs-the-reef': { board: '', press: 'novel-global-eye' },
    '07-zine-connection-off': { board: 'ZW', press: 'novel-global-wish', on: { 'novel-global': all['novel-global'], pickles: [] } },
    '08-nothing-to-print': { board: 'XY', press: 'novel-global-reef', state: { ...state, 'novel-global-reef': {} } },
    '09-space-on-58mm': { board: 'SK/KW', press: 'novel-global-space', settings: { 'novel-global-space': { name: 'pickles corner' } }, printer: profile('generic-58') },
    '10-messy-board-code': { board: ' rw / zw/ww/ab/cd/ef ', press: 'novel-global-wish' },
    '11-four-cables-full': { board: 'RW/ZW/KW/EW', press: 'novel-global-wish', printer: profile('generic-80') }
  };
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, c] of Object.entries(cases)) {
    const input = { ...base, ...c };
    fs.writeFileSync(path.join(dir, name + '.json'), JSON.stringify(input) + '\n');
    fs.writeFileSync(path.join(dir, name + '.hex'), hex(compile(input)));
  }
  console.log(`wrote ${Object.keys(cases).length} cases`);
}

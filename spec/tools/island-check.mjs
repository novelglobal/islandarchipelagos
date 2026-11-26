/* An island, checked against the island connection (spec/connection.md): run it against any island, the Pi on its own Wi-Fi, a
   pretend one on a laptop, or one someone else built, and it says what answers as the page says and what does not.
   node tools/island-check.mjs http://10.42.0.1            the checks that print nothing
   node tools/island-check.mjs http://10.42.0.1 --print    and one small print (a short black bar), then a second at once (one at a time) */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verify, mark } from './entry.mjs';
import { see } from './see.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const base = (process.argv[2] || '').replace(/\/$/, ''), printing = process.argv.includes('--print');
if (!/^https?:\/\//.test(base)) { console.error('node tools/island-check.mjs http://<island> [--print]'); process.exit(2); }

const results = [];
const check = async (name, fn) => { try { const r = await fn(); results.push([true, name, r || '']); } catch (e) { results.push([false, name, e.message]); } };
const must = (ok, why) => { if (!ok) throw new Error(why); };
const get = p => fetch(base + p, { redirect: 'manual' });
const stories = body => fetch(base + '/api/stories', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
const b64 = bytes => Buffer.from(bytes).toString('base64');

/* a print: a bar 8 dots high across the middle, then a cut */
const bar = (() => { const w = 64, h = 8, out = [0x1B, 0x40, 0x1D, 0x76, 0x30, 0x00, w, 0, h, 0]; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out.push(x >= 16 && x < 48 ? 0xFF : 0); return out.concat([0x1B, 0x64, 0x02, 0x1D, 0x56, 0x42, 0x00]); })();

await check('the page', async () => { const r = await get('/'); must(r.status === 200 && /html/.test(r.headers.get('content-type')), 'GET / gave ' + r.status); });

await check('the print engine', async () => { const r = await get('/thermal.js'), t = await r.text(); must(r.status === 200 && /window\.THERMAL/.test(t), 'GET /thermal.js gave ' + r.status);
  const site = path.join(HERE, '..', '..', 'web', 'src', 'base', 'thermal.js');
  if (fs.existsSync(site)) { must(fs.readFileSync(site, 'utf8') === t, 'not the same engine as web/src/base/thermal.js'); return 'the same file as the site\'s'; } return 'served'; });

await check('its signed entry', async () => { const r = await get('/entry.json'); must(r.status === 200, 'GET /entry.json gave ' + r.status);
  must(r.headers.get('access-control-allow-origin') === '*', 'any page may not read it'); const v = verify(await r.json()); must(v.why === 'ok', 'the entry does not check: ' + v.why);
  return `${v.e.name} ${mark(v.e.key)}, ${v.e.printer || 'no printer found'}${v.e.greys ? ' (' + v.e.greys + ' greys)' : ''}, ${v.e.open ? 'open' : 'closed'}`; });

await check('a card prints to this island alone', async () => { const r = await get('/api/partners'), j = await r.json(); must(r.status === 200 && Array.isArray(j.partners) && j.partners.length === 1, 'GET /api/partners: ' + JSON.stringify(j)); });

await check('a feed it does not keep', async () => { const r = await get('/api/no-such-feed'); must(r.status === 404, 'gave ' + r.status); });

await check('bytes that would change the printer are refused', async () => {
  const stored = [0x1B, 0x40, 0x1D, 0x28, 0x45, 0x03, 0x00, 0x01, 0x49, 0x4E, 0x1D, 0x56, 0x42, 0x00]; // GS ( E: into its settings
  for (const [what, bytes] of [['stored settings', stored], ['an unknown command', [0x1B, 0x40, 0x1B, 0x70, 0x00, 0x19, 0xFA, 0x1D, 0x56, 0x42, 0x00]], ['words alone, no GS', [0x41, 0x0A]]]) {
    const r = await stories({ escpos: b64(bytes) }); must(r.status === 400, `${what} gave ${r.status}`); } });

if (printing) await check('a print, and one at a time', async () => {
  must(see(bar).unknown.length === 0, 'the test print is not plain');
  const r = await stories({ escpos: b64(bar), from: 'check' }), j = await r.json().catch(() => ({}));
  if (r.status === 503) return 'not printed: ' + j.error;
  must(r.status === 200 && j.ok, 'a plain print gave ' + r.status + ' ' + JSON.stringify(j));
  const r2 = await stories({ escpos: b64(bar), from: 'check' }); must(r2.status === 429, 'a second print at once gave ' + r2.status);
  return 'printed; a second at once was asked to wait'; });

for (const [ok, name, note] of results) console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${note ? ' · ' + note : ''}`);
const failed = results.filter(r => !r[0]).length;
console.log(failed ? `\n${failed} of ${results.length} do not answer as spec/connection.md says` : `\n${base}: answers as spec/connection.md says`);
process.exit(failed ? 1 : 0);

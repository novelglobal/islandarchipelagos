/* Nothing disappears by accident: every option a card offers, every page of the approval page, every control on the paper,
   every card on the home and every key of the book club, held against test/features.json. Something new is fine (it is
   added to the list when written with --write); something gone fails until the list is written again on purpose.
   node test/features.mjs           check
   node test/features.mjs --write   take what is there now as the list (only when a removal was asked for) */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const all = (s, re) => [...s.matchAll(re)].map(m => m[1]);

function now() {
  const cart = read('repo-static/cart.js'), admin = read('repo-static/admin.js'), paper = read('repo-static/paper.html'), home = read('src/base/home.js'), club = read('repo-static/bookclub.js');
  const cards = {};
  /* each kind of card and the options it offers (var name = { ... opts: [['a', ...], ['b', ...]] }) */
  for (const m of cart.matchAll(/var (\w+) = \{[\s\S]*?\n {4}opts: \[([\s\S]*?)\],\n/g)) cards[m[1]] = all(m[2], /\['([a-z0-9]+)'/g);
  return {
    cards,
    book: all(cart.slice(cart.indexOf('var book = {'), cart.indexOf('var book = {') + 1200), /\['([a-z]+)', '/g),
    admin: [...new Set(all(admin, /P\('([a-z0-9-]+)'/g))],
    paper: all(paper, /id="([a-z0-9-]+)"/g),
    home: [...new Set(all(home, /\{ id: '([a-z0-9-]+)', [^}]*?(?:title|skin): /g))],
    bookclub: { modes: all(club.slice(club.indexOf('var MODES'), club.indexOf('var KINDS')), /\['([a-z]+)'/g), genres: all(club.slice(club.indexOf('var GENRES'), club.indexOf('var MODES')), /\['([a-z]+)'/g), kinds: all(club.slice(club.indexOf('var KINDS'), club.indexOf('var NAME')), /'([A-Z ]+)'/g) },
    lines: Object.keys(JSON.parse(read('repo-static/lines.json')))
  };
}

const FILE = path.join(ROOT, 'test/features.json'), have = now();
if (process.argv.includes('--write')) { fs.writeFileSync(FILE, JSON.stringify(have, null, 1) + '\n'); console.log('features: the list written'); process.exit(0); }
const was = JSON.parse(fs.readFileSync(FILE, 'utf8')), gone = [];
const walk = (a, b, at) => { if (Array.isArray(a)) { for (const x of a) if (!(b || []).includes(x)) gone.push(`${at}: ${x}`); return; }
  for (const k of Object.keys(a)) { if (!b || !(k in b)) { gone.push(`${at}${at ? '.' : ''}${k}`); continue; } walk(a[k], b[k], (at ? at + '.' : '') + k); } };
walk(was, have, '');
if (gone.length) { console.error('features gone (fine only if the owner asked for them to be removed; then: node test/features.mjs --write):\n  ' + gone.join('\n  ')); process.exit(1); }
console.log('features: nothing gone');

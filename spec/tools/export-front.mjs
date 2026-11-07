/* Writes novel.global's data packs from its own repository, read only: the lives, the stories, the listed places.
   novel.global's files stay the source until extraction stage E1 (docs/extraction.md); run this again whenever they change.
   node tools/export-front.mjs [path to the front repository, ../web by default] */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const front = path.resolve(process.argv[2] || path.join(here, '..', '..', 'web'));
const out = path.join(here, '..', 'islands', 'novel-global', 'packs');

/* the data files are plain scripts that set window.DA_*: run them in a sandbox with nothing else in it */
const win = {}; win.window = win; vm.createContext(win);
for (const f of ['config', 'places', 'field', 'briefs']) vm.runInContext(fs.readFileSync(path.join(front, 'src', f + '.js'), 'utf8'), win, { filename: f + '.js' });

const write = (rel, data) => { const p = path.join(out, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(data, null, 1) + '\n'); return data.length ?? data.features?.length; };
const pick = (o, keys) => Object.fromEntries(keys.filter(k => o[k] !== undefined && o[k] !== '').map(k => [k, o[k]]));
const id = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 63);

/* lives: the field list, each with its kind's threat and statement */
const species = win.DA_FIELD.map(f => ({
  ...pick(f, ['id', 'n', 'cn', 'g', 'st', 'where', 'act', 'brd', 'time', 'heat', 'water', 'event', 'aware', 'harm', 'help', 'call', 'note']),
  ...(win.DA_THREAT[f.g] ? { threat: win.DA_THREAT[f.g] } : {}),
  ...(win.DA_STATEMENT[f.g] ? { statement: win.DA_STATEMENT[f.g] } : {}),
  src: f.src || [],
}));

/* stories: what worked elsewhere (the briefs), the groups already caring for ground here, the five in greatest need */
const cases = win.DA_BRIEFS.map(b => ({ id: b.id, t: b.t, what: [b.after, b.city, b.yr, b.fact].filter(Boolean).join(' · '), url: b.url, g: b.g, th: b.th, roles: b.roles, m: b.m, i: b.i, s: b.s, h: b.h }));
const centre = z => { const a = z && (z.area || z.pts || z); if (!Array.isArray(a) || !a.length) return undefined; const pts = Array.isArray(a[0]) ? a : [a];
  return [+(pts.reduce((s, p) => s + p[0], 0) / pts.length).toFixed(5), +(pts.reduce((s, p) => s + p[1], 0) / pts.length).toFixed(5)]; };
const groups = win.DA_TRIBES.map(t => ({ id: t.id, t: t.n, what: [t.what, t.when].filter(Boolean).join(' '), url: t.link, g: t.g, ...(centre(t.zone) ? { at: centre(t.zone) } : {}) }));
const heroes = win.DA_HEROES.map(h => ({ id: h.id, t: h.cn, what: h.why, n: h.n, brief: h.brief }));

/* the listed places, as GeoJSON for the map pack: every one linked to its own site */
const places = { type: 'FeatureCollection', features: win.DA_PLACES.map(p => ({
  type: 'Feature', geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
  properties: { id: id(p.n), name: p.n, kind: p.cat, role: p.role, note: p.what, url: p.url, addr: p.addr, sub: p.sub, ...(p.partner ? { partner: p.partner } : {}) },
})) };

console.log('species', write('lives/species.json', species));
console.log('cases', write('lives/cases.json', cases));
console.log('groups', write('lives/groups.json', groups));
console.log('heroes', write('lives/heroes.json', heroes));
console.log('seasons', write('lives/seasons.json', win.DA_OUTLOOK) ?? 1);
console.log('places', write('map/places.geojson', places));

/* Checks every island in islands/: its manifest and packs against schemas/, every file a pack names, and that the parts
   agree with each other (a template reads only fields that exist, a print step names only templates that exist, ...).
   node tools/check.mjs [island folder ...] */
import fs from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
for (const f of fs.readdirSync(path.join(root, 'schemas'))) ajv.addSchema(JSON.parse(fs.readFileSync(path.join(root, 'schemas', f), 'utf8')));
const schema = ref => ajv.getSchema(ref) || (() => { throw new Error('no schema ' + ref); })();

let bad = 0;
const fail = (where, msg) => { bad++; console.log(`  ✗ ${where}: ${msg}`); };
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const check = (where, ref, data) => { const v = schema(ref); if (!v(data)) v.errors.slice(0, 8).forEach(e => fail(where, `${e.instancePath || '/'} ${e.message}${e.params && e.params.additionalProperty ? ' (' + e.params.additionalProperty + ')' : ''}`)); };
const profiles = new Map();
const mods = new Map();
const exists = (where, dir, rel) => { if (!fs.existsSync(path.join(dir, rel))) { fail(where, `missing file ${rel}`); return false; } return true; };

function island(dir) {
  const name = path.basename(dir), m = read(path.join(dir, 'island.json'));
  console.log(`${name}`);
  check(`${name}/island.json`, 'urn:island:0.1:island', m);
  const packs = {};
  for (const [kind, ref] of Object.entries(m.packs || {})) for (const r of [].concat(ref)) {
    if (typeof r !== 'string') continue; /* fetched packs are checked when fetched */
    const pd = path.join(dir, r), where = `${name}/${r}`;
    if (!exists(where, pd, 'pack.json')) continue;
    const p = read(path.join(pd, 'pack.json'));
    if (p.pack !== kind) fail(where, `is a ${p.pack} pack, named as ${kind}`);
    check(where, `urn:island:0.1:${p.pack}`, p);
    (packs[kind] = packs[kind] || []).push({ p, dir: pd, where });
    files(p, pd, where);
  }
  agree(name, m, packs);
  if (m.cards) cards(name, dir, m, packs);
  return m;
}

/* the files a pack names: there, and their rows in shape */
function files(p, dir, where) {
  if (p.pack === 'map') for (const l of p.layers || []) {
    const s = l.source || {}, f = s.file || s.offline; if (!f || !exists(where, dir, f)) continue;
    if (s.type === 'geojson') { const g = read(path.join(dir, f)); if (g.type !== 'FeatureCollection') fail(`${where}/${f}`, 'not a FeatureCollection'); }
    else if (s.type === 'cells' || s.type === 'live') { const c = read(path.join(dir, f)); if (!Array.isArray(c)) fail(`${where}/${f}`, 'not a list of cells'); else c.forEach((x, i) => check(`${where}/${f}[${i}]`, 'urn:island:0.1:map#/$defs/cell', x)); }
  }
  if (p.pack === 'map' && p.basemap && p.basemap.pmtiles) exists(where, dir, p.basemap.pmtiles);
  if (p.pack === 'lives') {
    if (p.species && exists(where, dir, p.species.file)) check(`${where}/${p.species.file}`, 'urn:island:0.1:lives#/$defs/species', read(path.join(dir, p.species.file)));
    for (const s of p.stories || []) if (exists(where, dir, s.file)) check(`${where}/${s.file}`, 'urn:island:0.1:lives#/$defs/stories', read(path.join(dir, s.file)));
    if (p.seasons) exists(where, dir, p.seasons.file);
  }
  if (p.pack === 'sound') for (const v of p.voices || []) if (v.sample) exists(where, dir, v.sample);
  if (p.pack === 'style') for (const s of p.styles || []) for (const fr of s.frames || []) if (fr.file) exists(where, dir, fr.file);
}

/* the parts agree */
function agree(name, m, packs) {
  const one = k => (packs[k] || [])[0];
  const tpl = one('templates'), map = one('map'), sound = one('sound'), lives = one('lives'), board = one('board');
  /* every journey: its fields by step.field, both for the whole island and for each steps pack */
  const fields = new Map(), byPack = new Map(), stepIds = [];
  for (const steps of packs.steps || []) {
    const own = new Map(); byPack.set(steps.p.id, own);
    for (const s of steps.p.journey.steps) { stepIds.push(s.id); for (const f of s.fields) { fields.set(`${s.id}.${f.id}`, f); own.set(`${s.id}.${f.id}`, f); } }
    const ids = steps.p.journey.steps.map(s => s.id), ph = (steps.p.journey.phases || []).map(x => x.id);
    for (const s of steps.p.journey.steps) if (s.phase && !ph.includes(s.phase)) fail(steps.where, `step ${s.id}: no phase ${s.phase}`);
    if (new Set(ids).size !== ids.length) fail(steps.where, 'two steps share an id');
    /* rule: every journey ends in a direct action */
    const last = steps.p.journey.steps[steps.p.journey.steps.length - 1];
    if (!last.fields.some(f => f.type === 'print')) fail(steps.where, 'the journey ends without a direct action (its last step prints or pledges nothing)');
    for (const s of steps.p.journey.steps) for (const f of s.fields) if (f.type === 'combine') for (const o of f.of || []) if (!own.has(o)) fail(steps.where, `${s.id}.${f.id} combines ${o}, which no step asks for`);
  }
  if (m.client && m.client.start && !stepIds.includes(m.client.start)) fail(name, `client.start ${m.client.start} is not a step`);
  const tplIds = tpl ? tpl.p.templates.map(t => t.id) : [];
  for (const [k, f] of fields) if (f.type === 'print') for (const t of f.templates || []) if (!tplIds.includes(t)) fail(name, `${k} names template ${t}, which is not in the templates pack`);
  const piece = (from, within = fields) => {
    if (!from || /^(island|read)\./.test(from) || /^'/.test(from)) return true;
    const [s, f, line] = from.split('.'); const fd = within.get(`${s}.${f}`); if (!fd) return false;
    return !line || (fd.type === 'lines' && fd.lines.some(l => l.id === line));
  };
  if (tpl) for (const t of tpl.p.templates) {
    for (const b of t.blocks) for (const k of ['from', 'when']) if (b[k] && !piece(b[k])) fail(tpl.where, `template ${t.id}: ${b.type} reads ${b[k]}, which no step asks for`);
    for (const f of (t.mesh && t.mesh.fields) || []) if (!piece(f)) fail(tpl.where, `template ${t.id}: the mesh line reads ${f}, which no step asks for`);
    if (t.blocks[t.blocks.length - 1].type !== 'cut') console.log(`  · ${tpl.where}: template ${t.id} does not end with a cut`);
    /* rule: every receipt carries a way on, a code to scan */
    if (!t.blocks.some(b => b.type === 'qr')) fail(tpl.where, `template ${t.id} has no code to scan: every receipt carries a way on to a direct action`);
  }
  /* story boxes: five receipts at most, each a template of the island, filled only with what its journey asks for */
  const stageIds = board ? board.p.stages.map(s => s.id) : [];
  for (const st of packs.story || []) for (const b of st.p.stories) {
    const own = byPack.get(b.journey); if (!own) { fail(st.where, `box ${b.id}: journey ${b.journey} is not one of the island's steps packs`); continue; }
    for (const r of b.receipts) {
      if (!tplIds.includes(r.template)) fail(st.where, `box ${b.id}: no template ${r.template}`);
      for (const k of Object.keys(r.fill)) if (!piece(k, own)) fail(st.where, `box ${b.id}: ${k} is not asked for in ${b.journey}`);
    }
    for (const u of b.unlocks || []) if (!stageIds.includes(u)) fail(st.where, `box ${b.id}: no board stage ${u}`);
    if (b.headline.checked === false) console.log(`  · ${st.where}: box ${b.id}'s headline is not checked against its source yet`);
    if (b.cover.file) exists(st.where, st.dir, b.cover.file);
  }
  /* the board: stages that come first exist, nothing comes before itself, nature's share adds up to the target at most */
  if (board) {
    const B = board.p, ids = new Set(stageIds);
    for (const s of B.stages) for (const a of [...(s.after || []), ...(s.then || [])]) if (!ids.has(a)) fail(board.where, `stage ${s.id}: no stage ${a}`);
    const seen = new Set(), walk = (id, path) => { if (path.includes(id)) { fail(board.where, `stage ${id} comes before itself`); return; } if (seen.has(id)) return; seen.add(id); const s = B.stages.find(x => x.id === id); for (const a of (s && s.after) || []) walk(a, [...path, id]); };
    for (const s of B.stages) walk(s.id, []);
    const tones = B.ground.tones.map(t => t.id);
    for (const s of B.stages) for (const d of [...s.draw, ...(s.acts || [])]) if (d.tone && !tones.includes(d.tone)) fail(board.where, `stage ${s.id}: no tone ${d.tone}`);
    for (const s of B.stages) for (const e of s.by || []) { const [k, v] = e.split(':'); if (k === 'step' && !stepIds.includes(v)) fail(board.where, `stage ${s.id}: no step ${v}`); }
    const half = (B.balance ? B.balance.start || 0 : 0) + B.stages.reduce((n, s) => n + (s.nature || 0), 0);
    if (B.balance && Math.abs(half - B.balance.target) > 0.001) console.log(`  · ${board.where}: the stages give nature ${half.toFixed(2)}, the target is ${B.balance.target}`);
    if (B.first) exists(board.where, board.dir, B.first.file);
    if (B.ground.file) exists(board.where, board.dir, B.ground.file);
  }
  if (map) {
    const kinds = Object.keys(map.p.kinds || {});
    for (const l of map.p.layers) if (l.kind && !kinds.includes(l.kind)) fail(map.where, `layer ${l.id}: no kind ${l.kind}`);
    const sounds = sound ? sound.p.voices.map(v => v.id) : null;
    if (sounds) for (const [k, v] of Object.entries(map.p.kinds || {})) if (v.sound && !sounds.includes(v.sound)) fail(map.where, `kind ${k}: no voice ${v.sound}`);
    for (const l of map.p.layers) if (l.source.type === 'live' && !m.network.online) console.log(`  · ${map.where}: layer ${l.id} is live on an offline island; only its offline file is used`);
  }
  if (sound) {
    const v = sound.p.voices.map(x => x.id);
    for (const md of sound.p.moods || []) for (const x of md.voices || []) if (!v.includes(x)) fail(sound.where, `mood ${md.id}: no voice ${x}`);
    for (const [k, x] of Object.entries(sound.p.bind || {})) if (!v.includes(x)) fail(sound.where, `bind ${k}: no voice ${x}`);
  }
  if (lives && lives.p.species) {
    const sp = read(path.join(lives.dir, lives.p.species.file)), g = Object.keys(lives.p.groups || {}), calls = (lives.p.calls || []).map(c => c.id);
    const ug = [...new Set(sp.map(s => s.g).filter(x => !g.includes(x)))]; if (ug.length) fail(lives.where, `species in groups not listed: ${ug.join(', ')}`);
    const uc = [...new Set(sp.map(s => s.call).filter(x => x && !calls.includes(x)))]; if (uc.length) console.log(`  · ${lives.where}: calls named by species but not listed: ${uc.join(', ')}`);
  }
  /* rule: one way, always: novel.global may publish to and print on every device of an island it can reach; the island reaches only its own */
  if ((m.network.online || m.network.mesh) && m.network.hub !== 'https://novel.global') fail(name, 'its devices are closed to novel.global: an island with a way in names novel.global as its hub (network.hub), one way');
  /* an offline island asks nothing outside */
  if (!m.network.online && (m.network.hosts || []).length) fail(name, 'an offline island lists outside hosts');
  const ids = m.printers.map(p => p.id); if (new Set(ids).size !== ids.length) fail(name, 'two printers share an id');
  /* each printer: its profile, and a paper and darkness that profile prints */
  for (const p of m.printers) {
    if (!p.profile) continue;
    const f = profiles.get(p.profile); if (!f) { fail(name, `printer ${p.id}: no profile ${p.profile}`); continue; }
    const paper = f.papers.find(x => x.paper === (p.paper || f.papers[0].paper));
    if (!paper) fail(name, `printer ${p.id}: ${f.name} takes no ${p.paper} mm paper`);
    else if (p.dots && p.dots !== paper.dots) fail(name, `printer ${p.id}: ${f.name} prints ${paper.dots} dots across ${paper.paper} mm, not ${p.dots}`);
    if (p.dpi && p.dpi !== f.dpi) fail(name, `printer ${p.id}: ${f.name} is ${f.dpi} dpi, not ${p.dpi}`);
    if (p.darkness && f.darkness && (p.darkness < f.darkness.min || p.darkness > f.darkness.max)) fail(name, `printer ${p.id}: darkness ${p.darkness} is outside ${f.darkness.min} to ${f.darkness.max}`);
  }
  if (m.from && m.from.id === m.id) fail(name, 'an island cannot start as a copy of itself');
  for (const k of ['in', 'out']) if (((m.partners || {})[k] || []).includes(m.id)) fail(name, `partners.${k} names the island itself`);
  for (const k of ['in', 'out']) if (((m.partners || {})[k] || []).includes('novel-global')) fail(name, `partners.${k} names novel.global, which is never a partner: it can always reach an island, and an island never reaches it`);
}

/* the column: cards that open something, cables between cards that are there, and what each starting cable does */
function cards(name, dir, m, packs) {
  const where = `${name}/${m.cards}`;
  if (!exists(name, dir, m.cards)) return;
  const f = read(path.join(dir, m.cards));
  check(where, 'urn:island:0.1:card', f);
  if (!Array.isArray(f.cards)) return;
  const ids = f.cards.map(c => c.id), stacks = new Map();
  for (const st of packs.steps || []) stacks.set(st.p.id, st.p);
  if (new Set(ids).size !== ids.length) fail(where, 'two cards share an id');
  const orders = f.cards.map(c => c.order); if (new Set(orders).size !== orders.length) fail(where, 'two cards share a place in the column');
  for (const c of f.cards) if (c.opens.includes('/') && c.opens.split('/')[0] === m.id && !stacks.has(c.opens)) fail(where, `card ${c.id} opens ${c.opens}, which is not one of the island's stacks`);
  const missing = f.cards.flatMap(c => (c.art || []).map(a => a.src)).filter(s => !/^https:/.test(s) && !fs.existsSync(path.join(dir, s)));
  if (missing.length) console.log(`  · ${where}: ${missing.length} picture${missing.length > 1 ? 's' : ''} still to come`);
  /* each jack one character, each plugging a mod that is there; the starting board only uses jacks in the column */
  const jacks = f.cards.filter(c => c.jack).map(c => c.jack);
  if (new Set(jacks).size !== jacks.length) fail(where, 'two cards share a jack');
  for (const c of f.cards) if (c.mod && !modRef(c.mod)) fail(where, `card ${c.id} plugs ${c.mod}, which is not in mods/`);
  for (const pr of (f.board || '').split('/').filter(Boolean)) for (const j of pr) if (!jacks.includes(j)) fail(where, `the board uses jack ${j}, which no card has`);
}

/* a mod by id@major: the newest of that major */
function modRef(ref) {
  const [id, major] = ref.split('@'), m = mods.get(id);
  return m && m.version.split('.')[0] === major ? m : null;
}

/* the mods: each a mod.json and its slip, data only, its id the island's, its needs there, its settings used as they are meant */
for (const d of fs.readdirSync(path.join(root, 'mods'))) {
  const dir = path.join(root, 'mods', d), where = `mods/${d}`;
  if (!exists(where, dir, 'mod.json')) continue;
  const m = read(path.join(dir, 'mod.json'));
  check(`${where}/mod.json`, 'urn:island:0.1:mod', m);
  if (m.id !== d) fail(where, `its id is ${m.id}`);
  if (m.island && m.id && !m.id.startsWith(m.island + '-')) fail(where, `its id does not start with its island, ${m.island}-`);
  if (m.mark) exists(where, dir, m.mark);
  if (m.slip && exists(where, dir, m.slip)) {
    const sl = read(path.join(dir, m.slip));
    check(`${where}/${m.slip}`, 'urn:island:0.1:slip', sl);
    const kind = k => ((m.settings || []).find(x => x.key === k) || {}).kind;
    const own = new Set([...(m.gives || []), ...(m.takes || [])]);
    for (const b of sl.blocks || []) {
      for (const [f, want] of [['if', 'switch'], ['ink', 'switch'], ['setting', 'field']]) if (b[f] && kind(b[f]) !== want) fail(where, `a ${b.block} block's ${f} is ${b[f]}, which is not a ${want} setting`);
      const e = { picture: 'PICTURE', words: 'WORDS', list: 'LIST', code: b.take || 'CODE' }[b.block];
      if (e && !(b.block === 'words' && b.fixed) && !own.has(e)) console.log(`  · ${where}: a ${b.block} block fills from ${e}, which the mod neither gives nor takes`);
    }
  }
  const keys = (m.settings || []).map(x => x.key); if (new Set(keys).size !== keys.length) fail(where, 'two settings share a key');
  mods.set(m.id, m);
}
for (const m of mods.values()) for (const n of m.needs || []) {
  if (!modRef(n)) fail(`mods/${m.id}`, `it needs ${n}, which is not in mods/`);
  if (n.split('@')[0] === m.id) fail(`mods/${m.id}`, 'it needs itself');
}

/* the printer profiles */
for (const f of fs.readdirSync(path.join(root, 'profiles'))) {
  const p = read(path.join(root, 'profiles', f)), where = `profiles/${f}`;
  check(where, 'urn:island:0.1:profile', p);
  if (p.id + '.json' !== f) fail(where, `its id is ${p.id}`);
  if (p.darkness && (p.darkness.default < p.darkness.min || p.darkness.default > p.darkness.max)) fail(where, 'its darkness starts outside its range');
  profiles.set(p.id, p);
}

const dirs = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(path.join(root, 'islands')).map(d => path.join(root, 'islands', d));
const all = new Map();
for (const d of dirs) { const m = island(path.resolve(d)); all.set(m.id, m); }
/* partners: an island prints to another only when that one lets it in */
for (const m of all.values()) for (const o of (m.partners || {}).out || []) {
  const t = all.get(o);
  if (t && !((t.partners || {}).in || []).includes(m.id)) fail(m.id, `prints to ${o}, which does not let it in (partners.in)`);
}
console.log(bad ? `\n${bad} problem${bad > 1 ? 's' : ''}` : '\nall islands check');
process.exit(bad ? 1 : 0);

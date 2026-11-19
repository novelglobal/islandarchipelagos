/* Direct Action · the Worker. Cloudflare serves any file in dist/ before this runs; everything else arrives here.

   /api/ is the app's own server, on one small database (D1):
   · stories people send: each waits for approval before anyone else sees it, or any printer prints it
   · the print queue of each partner place, which the receiver there (a Raspberry Pi) pulls from
   · the approval page's requests, behind the ADMIN_KEY secret

   Kept to a minimum: no accounts, no addresses kept. A sender's network address is only ever counted, hashed with a
   salt that changes each day, and forgotten within the hour. A story not approved within 30 days is deleted; a print
   job waits a day at most, and once printed only its status is kept, for a week. A preview build has its own database. */
import { BUILD, PREVIEW, PARTNERS } from './stamp.js';
import { FIRST_PLAY } from './first-play.js';
import { LABEL, WELCOME, NOTES, BASE_TEXTS } from './label.js';

const JSON_H = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
const TEXT_H = { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: JSON_H });
const fail = (status, error) => json({ error }, status);
const now = () => Date.now();
const H = 3600e3, DAY = 24 * H;
const LIMIT = { example: 700e3, body: 4.2e6, sig: 9000, record: 20e3, cells: 60e3, cellsN: 200, photo: 420e3, full: 14e6, bodyBig: 20e6, escpos: 900e3, mesh: 240, waiting: 2000, perPrinter: 10, sends: 20, gap: 60e3 };
/* a pack of cells: up to 200, each with a place on the ground and a short name */
const cellsOk = t => { if (typeof t !== 'string' || t.length > LIMIT.cells) return false; let d; try { d = JSON.parse(t); } catch (e) { return false; }
  return !!d && Array.isArray(d.cells) && d.cells.length >= 1 && d.cells.length <= LIMIT.cellsN && d.cells.every(c => c && Number.isFinite(c.lat) && Number.isFinite(c.lng) && Math.abs(c.lat) <= 90 && Math.abs(c.lng) <= 180 && typeof c.n === 'string' && c.n.length <= 80); };
const CODE = /^DA-[0-9A-HJKMNP-TV-Z]{4}$/;
/* a maker's own three characters (no I, O, 0 or 1), printed on what they make: with it they find and take down their own things */
/* a maker's code; 888 is the master's, the main board's, reserved on every island: it opens the showcase on a phone and is never
   anyone's (no phone makes it, since every code mixes letters and numbers, and none may talk, post or claim with it) */
const SHOWCASE = '888', WHO0 = /^(?:[A-HJ-NP-Z2-9]{3}|[A-HJ-NP-Z2-9]{6})$/, WHO = { test: s => WHO0.test(s) && s !== SHOWCASE };

/* ───────── the database: made on first use, the same in a preview's database and the live one ───────── */
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS stories (id TEXT PRIMARY KEY, code TEXT NOT NULL, kind TEXT NOT NULL, status TEXT NOT NULL, body TEXT NOT NULL,
     photo BLOB, lat REAL, lng REAL, dest TEXT, created INTEGER NOT NULL, decided INTEGER)`,
  `CREATE INDEX IF NOT EXISTS stories_status ON stories(status, decided)`,
  `CREATE INDEX IF NOT EXISTS stories_code ON stories(code)`,
  /* a maker by their three characters: when first and last seen, how many sent, the stage they were at (for the approval page only) */
  `CREATE TABLE IF NOT EXISTS makers (who TEXT PRIMARY KEY, first INTEGER NOT NULL, last INTEGER NOT NULL, posts INTEGER NOT NULL DEFAULT 0, stage TEXT)`,
  /* the board: a few words by a maker (shown by their kin, never their code), in one of the journey's four sections, or a reply to one */
  `CREATE TABLE IF NOT EXISTS talk (id TEXT PRIMARY KEY, sec TEXT NOT NULL, who TEXT NOT NULL, text TEXT NOT NULL, re TEXT, at INTEGER NOT NULL, hidden INTEGER)`,
  `CREATE INDEX IF NOT EXISTS talk_sec ON talk(sec, at)`,
  `CREATE TABLE IF NOT EXISTS printers (id TEXT PRIMARY KEY, name TEXT, paper TEXT, mesh INTEGER DEFAULT 0, auto INTEGER DEFAULT 0, token TEXT, seen INTEGER, created INTEGER)`,
  `CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, printer TEXT NOT NULL, story TEXT, code TEXT, escpos TEXT, mesh TEXT, status TEXT NOT NULL,
     lease INTEGER, tries INTEGER DEFAULT 0, error TEXT, created INTEGER NOT NULL, done INTEGER)`,
  `CREATE INDEX IF NOT EXISTS jobs_queue ON jobs(printer, status, created)`,
  `CREATE TABLE IF NOT EXISTS hits (k TEXT NOT NULL, t INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS settings (k TEXT PRIMARY KEY, v TEXT)`,
  `CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY, slug TEXT UNIQUE, title TEXT NOT NULL, summary TEXT, body TEXT, cat TEXT, links TEXT, day TEXT, status TEXT NOT NULL DEFAULT 'draft', cover BLOB, created INTEGER, updated INTEGER)`,
  `CREATE INDEX IF NOT EXISTS hits_k ON hits(k, t)`,
  /* OpenStreetMap as asked of Overpass, kept a tile at a time for everyone: a tile's elements as JSON, and when they came */
  `CREATE TABLE IF NOT EXISTS osm (k TEXT PRIMARY KEY, body TEXT NOT NULL, at INTEGER NOT NULL)`,
  /* stage 5: the listed places of the human ecology, beyond the ones written into places.js: added on the approval page, or
     suggested by anyone and waiting there until shown */
  `CREATE TABLE IF NOT EXISTS places (id TEXT PRIMARY KEY, n TEXT NOT NULL, cat TEXT, role TEXT, addr TEXT, sub TEXT, url TEXT, what TEXT,
     lat REAL NOT NULL, lng REAL NOT NULL, status TEXT NOT NULL, src TEXT, created INTEGER NOT NULL, decided INTEGER)`,
  `CREATE INDEX IF NOT EXISTS places_status ON places(status, decided)`,
  /* traffic: how many of each thing happened on a day, nothing more (no addresses, no visitors told apart) */
  `CREATE TABLE IF NOT EXISTS traffic (day TEXT NOT NULL, k TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, k))`,
  /* species: every kind of life the devices have met, told once by the first device to meet it (iNaturalist's id, names, group, mark, a photograph) */
  `CREATE TABLE IF NOT EXISTS species (id INTEGER PRIMARY KEY, n TEXT NOT NULL, cn TEXT, ic TEXT, g TEXT, ph TEXT, first INTEGER NOT NULL)`,
  /* tapes: a loop recorded on the radio, its file kept in R2 for half a moon to be saved from any phone, then cleared */
  /* a card's own pictures, kept in R2 (card/<card>/<slot>): up to ten to turn through, or one behind it; and how fast they turn, how strongly it shows */
  `CREATE TABLE IF NOT EXISTS cardpics (card TEXT NOT NULL, slot INTEGER NOT NULL, type TEXT NOT NULL, bytes INTEGER NOT NULL, at INTEGER NOT NULL, PRIMARY KEY (card, slot))`,
  `CREATE TABLE IF NOT EXISTS cardset (card TEXT PRIMARY KEY, speed REAL, shade REAL)`,
  `CREATE TABLE IF NOT EXISTS tapes (id TEXT PRIMARY KEY, who TEXT, name TEXT NOT NULL, type TEXT NOT NULL, bytes INTEGER NOT NULL, at INTEGER NOT NULL)`,
];
/* SCHEMA_V: the database's version. Raise it by one whenever a table or a column is added below: each database (the live one and the
   preview's) then makes the changes once and keeps the number, and every start after is one read */
const SCHEMA_V = 14;
const readied = new WeakMap();
function ready(db) {
  if (!readied.has(db)) readied.set(db, (async () => {
    const at = await db.prepare("SELECT v FROM settings WHERE k = '~schema'").first().catch(() => null);
    if (!at || +at.v < SCHEMA_V) await upgrade(db);
    /* every partner place has a print queue from the start; a printer joins it when its token is made on the approval page */
    if (PARTNERS.length) await db.batch(PARTNERS.map(p => db.prepare('INSERT OR IGNORE INTO printers (id, name, paper, created, links, two) VALUES (?, ?, ?, ?, ?, 1)').bind(p.id, p.n, p.paper, now(), '*')));
    /* a copy of the site from before the second island's new id may have put its old queue back: an unpaired one goes */
    await db.prepare('DELETE FROM printers WHERE id = ? AND token IS NULL').bind(['pic', 'kles'].join('')).run();
    await numberPrinters(db);
  })().catch(e => { readied.delete(db); throw e; }));
  return readied.get(db);
}
async function upgrade(db) {
    await db.batch(SCHEMA.map(q => db.prepare(q)));
    /* live: shown online on the map, switched on the approval page (a column added after the first release) */
    try { await db.prepare('ALTER TABLE printers ADD COLUMN live INTEGER DEFAULT 0').run(); } catch (e) { /* already there */ }
    /* star: a story the approval page holds up, first on the board */
    try { await db.prepare('ALTER TABLE stories ADD COLUMN star INTEGER DEFAULT 0').run(); } catch (e) { /* already there */ }
    /* who: the maker's three characters; gone: when its maker took it down (off the site, still all here on the approval page) */
    try { await db.prepare('ALTER TABLE stories ADD COLUMN who TEXT').run(); } catch (e) { /* already there */ }
    try { await db.prepare('ALTER TABLE stories ADD COLUMN gone INTEGER').run(); } catch (e) { /* already there */ }
    /* thumb: a small one-bit picture of the print, "w,h,base64", for the touch screen to show while it waits */
    try { await db.prepare('ALTER TABLE jobs ADD COLUMN thumb TEXT').run(); } catch (e) { /* already there */ }
    /* origin: where a story came from, for the approval page only: the page, the city and country Cloudflare saw (never the address), phone or computer, the stage, its mesh line */
    try { await db.prepare('ALTER TABLE stories ADD COLUMN origin TEXT').run(); } catch (e) { /* already there */ }
    /* full: its full-size photograph is kept in Cloudflare's storage (R2, bound as MEDIA), for the approval page only */
    try { await db.prepare('ALTER TABLE stories ADD COLUMN full INTEGER').run(); } catch (e) { /* already there */ }
    /* lv: the furthest a maker's journey has reached (0 to 4), so a code typed on another phone brings it back */
    try { await db.prepare('ALTER TABLE makers ADD COLUMN lv INTEGER DEFAULT 0').run(); } catch (e) { /* already there */ }
    /* kin: each maker's own species and mark, handed out in turn so no two share one (0, 1, 2 ...) */
    try { await db.prepare('ALTER TABLE makers ADD COLUMN kin INTEGER').run(); } catch (e) { /* already there */ }
    /* printed: when a printer first printed something of this maker's. Only a code a printer has given opens the talk (a save never
       does). Those already printed for, by what is still kept, keep it */
    try { await db.prepare('ALTER TABLE makers ADD COLUMN printed INTEGER').run();
      await db.prepare("UPDATE makers SET printed = last WHERE printed IS NULL AND who IN (SELECT s.who FROM stories s WHERE s.who IS NOT NULL AND (s.stage = 'booth' OR s.id IN (SELECT story FROM jobs WHERE status = 'printed') OR (s.dest != '' AND s.dest != 'mesh' AND s.status = 'shown')))").run(); } catch (e) { /* already there */ }
    /* k: what a word in the talk is for: said, a swap, or sharing */
    try { await db.prepare('ALTER TABLE talk ADD COLUMN k TEXT').run(); } catch (e) { /* already there */ }
    /* art: the poster as designed, kept in R2 (its size), for the wall of posters; quiet: its talk closed on the approval page */
    try { await db.prepare('ALTER TABLE stories ADD COLUMN art INTEGER').run(); } catch (e) { /* already there */ }
    try { await db.prepare('ALTER TABLE stories ADD COLUMN quiet INTEGER').run(); } catch (e) { /* already there */ }
    /* version 3. grp: the portfolio group a piece is filed under on the approval page (kept here; not on the site yet) */
    try { await db.prepare('ALTER TABLE stories ADD COLUMN grp TEXT').run(); } catch (e) { /* already there */ }
    /* can: what a printer's receiver says it can do besides print ('off'); off: when TURN OFF was pressed for it */
    try { await db.prepare('ALTER TABLE printers ADD COLUMN can TEXT').run(); } catch (e) { /* already there */ }
    /* warm: when someone last set out towards a print (the make step), so the printers ask quickly for a while */
    try { await db.prepare('ALTER TABLE printers ADD COLUMN warm INTEGER').run(); } catch (e) { /* already there */ }
    try { await db.prepare('ALTER TABLE printers ADD COLUMN off INTEGER').run(); } catch (e) { /* already there */ }
    /* touch: the hash of a small touch screen's token; while set, that screen is where a held slip is printed or squashed */
    try { await db.prepare('ALTER TABLE printers ADD COLUMN touch TEXT').run(); } catch (e) { /* already there */ }
    try { await db.prepare('ALTER TABLE printers ADD COLUMN touch_seen INTEGER').run(); } catch (e) { /* already there */ }
    /* the Wi-Fi each is on and how strongly, as each last said (JSON: { n, rssi, at }); and a Wi-Fi setup asked for */
    for (const col of ['net TEXT', 'touch_net TEXT', 'wifi INTEGER', 'upd INTEGER', 'rst INTEGER']) { try { await db.prepare(`ALTER TABLE printers ADD COLUMN ${col}`).run(); } catch (e) { /* already there */ } }
    try { await db.prepare('ALTER TABLE printers ADD COLUMN refused TEXT').run(); } catch (e) { /* already there */ }
    /* two: an island granted two-way. novel.global may always use an island's printer; two-way lets the island's own experiences print on novel.global's too */
    try { await db.prepare('ALTER TABLE printers ADD COLUMN two INTEGER DEFAULT 0').run(); } catch (e) { /* already there */ }
    /* version 6. number: its island number on the novel.global network (numberPrinters) */
    try { await db.prepare('ALTER TABLE printers ADD COLUMN number INTEGER').run(); } catch (e) { /* already there */ }
    /* version 7. owner: the hash of the island keeper's key (handed over once, at pairing); self: it joined by itself, while joining was open */
    try { await db.prepare('ALTER TABLE printers ADD COLUMN owner TEXT').run(); } catch (e) { /* already there */ }
    try { await db.prepare('ALTER TABLE printers ADD COLUMN self INTEGER DEFAULT 0').run(); } catch (e) { /* already there */ }
    /* version 8. links: the connections it has switched on (LINKS, or * for all). novel.global's printers and the starting ones have every one, and two-way */
    try { await db.prepare('ALTER TABLE printers ADD COLUMN links TEXT').run(); } catch (e) { /* already there */ }
    await db.prepare("UPDATE printers SET links = '*', two = 1 WHERE links IS NULL AND COALESCE(self, 0) = 0").run();
    /* version 2. pic, cov: a photograph or a portfolio cover kept in R2 (its size), no longer inside the database */
    try { await db.prepare('ALTER TABLE stories ADD COLUMN pic INTEGER').run(); } catch (e) { /* already there */ }
    try { await db.prepare('ALTER TABLE posts ADD COLUMN cov INTEGER').run(); } catch (e) { /* already there */ }
    /* version 11. the second island takes its new id and name, wherever either was written down, and the first three their names and numbers */
    { const was = ['pic', 'kles'].join(''), Was = was[0].toUpperCase() + was.slice(1), to = 'milkbar', run = async (q, ...a) => { try { await db.prepare(q).bind(...a).run(); } catch (e) { /* no such table yet */ } };
      if (await db.prepare('SELECT 1 FROM printers WHERE id = ?').bind(was).first()) {
        await run('DELETE FROM printers WHERE id = ? AND token IS NULL', to);
        if (!(await db.prepare('SELECT 1 FROM printers WHERE id = ?').bind(to).first())) {
          await run('UPDATE printers SET id = ? WHERE id = ?', to, was);
          for (const [t, c] of [['jobs', 'printer'], ['stories', 'dest'], ['cardpics', 'card'], ['cardset', 'card'], ['passes', 'island'], ['asks', 'island'], ['pairs', 'printer']]) await run(`UPDATE ${t} SET ${c} = ? WHERE ${c} = ?`, to, was); } }
      await run("UPDATE printers SET name = 'Milk Bar' WHERE id = ?", to);
      await run("UPDATE printers SET name = 'Dead Tree' WHERE name = 'ISLAND CE40'");
      await run("UPDATE settings SET v = REPLACE(REPLACE(REPLACE(v, ?, 'Milk Bar'), ?, 'Milk Bar'), ?, ?) WHERE k IN ('pops', 'isles', 'cards', 'printq', 'curations')", Was + ' Milk Bar', Was, was, to);
      await run('UPDATE stories SET origin = REPLACE(origin, ?, ?) WHERE origin LIKE ?', `"pop":"${was}"`, `"pop":"${to}"`, `{"pop":"${was}"%`);
      await run("UPDATE places SET n = 'Milk Bar', url = '' WHERE n = ?", Was + ' Milk Bar');
      const dead = await db.prepare("SELECT id FROM printers WHERE name = 'Dead Tree' ORDER BY created LIMIT 1").first().catch(() => null);
      for (const [id, n] of [[to, 2], [dead && dead.id, 3]]) { if (!id || !(await db.prepare('SELECT 1 FROM printers WHERE id = ? AND token IS NOT NULL').bind(id).first().catch(() => null))) continue;
        const top = (await db.prepare('SELECT max(number) AS n FROM printers').first()).n || 3;
        await run('UPDATE printers SET number = ? WHERE number = ? AND id != ?', Math.max(top, 3) + 1, n, id); await run('UPDATE printers SET number = ? WHERE id = ?', n, id); } }
    /* version 13. keep: until when a maker's code is kept. New, two weeks; each thing made or saved, a month from then. Codes already
       here are given a month from this upgrade, so none is lost the day it lands */
    try { await db.prepare('ALTER TABLE makers ADD COLUMN keep INTEGER').run(); await db.prepare('UPDATE makers SET keep = ? WHERE keep IS NULL').bind(now() + KEEP.made).run(); } catch (e) { /* already there */ }
    /* version 14. Each island's own: gap (seconds between one person's prints; empty, the site's), pack (which cards), ways (how its passes
       are given), mods (codes that help run it). Each maker's animal (their second key, never shown) and when their home key was first given */
    for (const q of ['ALTER TABLE printers ADD COLUMN gap INTEGER', 'ALTER TABLE printers ADD COLUMN pack TEXT', 'ALTER TABLE printers ADD COLUMN ways TEXT', 'ALTER TABLE printers ADD COLUMN mods TEXT', 'ALTER TABLE makers ADD COLUMN animal INTEGER', 'ALTER TABLE makers ADD COLUMN claimed INTEGER']) { try { await db.prepare(q).run(); } catch (e) { /* already there */ } }
    await db.prepare("INSERT INTO settings (k, v) VALUES ('~schema', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v").bind(String(SCHEMA_V)).run();
}
/* each printer's island number, given the first time it is paired, in that order: novel.global's own is 1, the islands 2 and up. It stays
   through unpairing and is never given again; ISLAND N on the approval page sets it by hand */
async function numberPrinters(db) {
  await db.prepare("UPDATE printers SET number = 1 WHERE id = 'novelglobal' AND number IS NULL").run();
  const { results } = await db.prepare("SELECT id FROM printers WHERE number IS NULL AND token IS NOT NULL AND id != 'novelglobal' ORDER BY created, id").all(); if (!results.length) return;
  let n = Math.max(1, (await db.prepare('SELECT max(number) AS n FROM printers').first()).n || 0);
  await db.batch(results.map(r => db.prepare('UPDATE printers SET number = ? WHERE id = ?').bind(++n, r.id)));
}
/* a preview keeps to its own database, so testing never reaches real stories or a real printer */
/* ───────── staying inside Cloudflare's free allowances. Each copy of the Worker counts its requests and the rows it writes, and adds
   them to the day's count about once a minute (one write, not one a request). Past six tenths of a day's allowance the site goes
   calm (the printers ask less often); past eight and a half it rests (talk and new places wait for tomorrow, printing goes on) ───────── */
const CAP = { req: 100e3, w: 100e3, r2: 10e9 };   // the Workers free plan's requests a day, D1's rows written a day, R2's free storage
const USE = { day: '', req: 0, w: 0, keys: {}, at: 0, sum: { req: 0, w: 0 }, level: 0, warmAt: 0 };
const levelOf = () => { const r = Math.max((USE.sum.req + USE.req) / CAP.req, (USE.sum.w + USE.w) / CAP.w); return r >= 0.85 ? 2 : r >= 0.6 ? 1 : 0; };
const metered = new WeakMap();
function meterOf(db) {
  if (!db) return db; if (metered.has(db)) return metered.get(db);
  const add = r => { USE.w += (r && r.meta && r.meta.rows_written) || 0; return r; };
  try { const SP = Object.getPrototypeOf(db.prepare('SELECT 1')); if (!SP.__ng) { const run = SP.run; SP.run = async function (...a) { return add(await run.apply(this, a)); }; SP.__ng = true; } } catch (e) { /* uncounted */ }
  const m = new Proxy(db, { get(t, k) { if (k === 'batch') return async s => { const r = await t.batch(s); (r || []).forEach(add); return r; }; const v = t[k]; return typeof v === 'function' ? v.bind(t) : v; } });
  metered.set(db, m); return m;
}
const dbOf = env => meterOf((PREVIEW && env.DB_PREVIEW) || env.DB);
function settle(env, ctx, force) {
  const db = dbOf(env), t = now(), day = new Date(t).toISOString().slice(0, 10);
  if (USE.day !== day) { if (USE.day) force = true; }
  if (!db || (!force && (!ctx || t - USE.at < 60e3))) return;
  const d = USE.day || day, rows = { ...USE.keys, '~req': USE.req, '~w': USE.w }; USE.keys = {}; USE.req = 0; USE.w = 0; USE.at = t;
  if (USE.day !== day) { USE.day = day; USE.sum = { req: 0, w: 0 }; }
  const p = (async () => { try { await ready(db);
    const up = Object.entries(rows).filter(([, n]) => n > 0).map(([k, n]) => db.prepare('INSERT INTO traffic (day, k, n) VALUES (?, ?, ?) ON CONFLICT(day, k) DO UPDATE SET n = n + excluded.n').bind(d, k, n));
    if (up.length) await db.batch(up);
    const { results } = await db.prepare("SELECT k, n FROM traffic WHERE day = ? AND k IN ('~req', '~w')").bind(day).all();
    for (const r of results) USE.sum[r.k.slice(1)] = r.n; USE.level = levelOf();
  } catch (e) { /* counted next time */ } })();
  if (ctx) ctx.waitUntil(p); return p;
}
/* how long a printer or its screen waits before asking again: quick while someone is on their way to print (or a slip waits), slow otherwise */
const waitOf = (p, busy) => { const L = Math.max(USE.level, levelOf()), warm = busy || (p.warm && now() - p.warm < 5 * 60e3); return warm ? [2, 4, 8][L] : [20, 60, 120][L]; };

/* ───────── small tools ───────── */
const enc = new TextEncoder();
async function sha256(s) { const d = await crypto.subtle.digest('SHA-256', enc.encode(s)); return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join(''); }
const rid = (n = 16) => { const a = crypto.getRandomValues(new Uint8Array(n)); return [...a].map(b => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join(''); };
async function same(a, b) { const [x, y] = await Promise.all([sha256(String(a)), sha256(String(b))]); return crypto.subtle.timingSafeEqual ? crypto.subtle.timingSafeEqual(enc.encode(x), enc.encode(y)) : x === y; }
const bearer = req => (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
const b64ok = (s, max) => typeof s === 'string' && s.length <= max && /^[A-Za-z0-9+/=_-]*$/.test(s);
/* an upload's original file, as it came (a photograph of any of the usual kinds), with its kind */
function dataFile(s, max) { const m = typeof s === 'string' && s.match(/^data:(image\/(?:jpeg|png|webp|heic|heif|gif|avif));base64,([A-Za-z0-9+/=]+)$/); if (!m || m[2].length > max) return null; const bin = atob(m[2]); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return { bytes: out, type: m[1] }; }
function dataURL(s, max = LIMIT.photo) { const m = typeof s === 'string' && s.match(/^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/); if (!m || m[1].length > max) return null; const bin = atob(m[1]); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out[0] === 0xFF && out[1] === 0xD8 ? out : null; }
async function body(req, max = LIMIT.body) {
  const n = +(req.headers.get('content-length') || 0); if (n > max) throw Object.assign(new Error('too large'), { status: 413 });
  const t = await req.text(); if (t.length > max) throw Object.assign(new Error('too large'), { status: 413 });
  try { return JSON.parse(t || '{}'); } catch (e) { throw Object.assign(new Error('not json'), { status: 400 }); }
}
/* one print a minute for each person: it takes time to make, and the paper is for art. Their code if they have one, else their address under the daily hash. The seconds left, or 0 */
async function printGap(db, env, req, who, set, P) { const sec = P && P.gap != null ? +P.gap : +(await settingsOf(db)).printGap || 0; if (!sec) return 0; const GAP = sec * 1000;
  const ip = req.headers.get('cf-connecting-ip') || 'local'; const day = new Date().toISOString().slice(0, 10); const t0 = now();
  const sk = typeof set === 'string' && /^[A-Za-z0-9]{6,24}$/.test(set) ? `gapset:${set}` : null;
  if (sk) { const g = await db.prepare('SELECT count(*) AS n, min(t) AS t FROM hits WHERE k = ? AND t > ?').bind(sk, t0 - 600e3).first(); if (g && g.n > 0 && g.n < 12 && g.t > t0 - 180e3) { await db.prepare('INSERT INTO hits (k, t) VALUES (?, ?)').bind(sk, t0).run(); return 0; } }
  const ks = [`gap:${(await sha256(`${ip}|${day}|${env.ADMIN_KEY || ''}|gap`)).slice(0, 24)}`]; if (who) ks.push(`gap:${who}`); const t = now();
  const r = await db.prepare(`SELECT max(t) AS t FROM hits WHERE k IN (${ks.map(() => '?').join(',')}) AND t > ?`).bind(...ks, t - GAP).first(); if (r && r.t) return Math.ceil((r.t + GAP - t) / 1000);
  if (sk) ks.push(sk); await db.batch(ks.map(k => db.prepare('INSERT INTO hits (k, t) VALUES (?, ?)').bind(k, t))); return 0; }
/* how often a visitor has asked: counted under a hash that changes daily, kept an hour */
async function tooMany(db, env, req, kind, max, windowMs) {
  const ip = req.headers.get('cf-connecting-ip') || 'local'; const day = new Date().toISOString().slice(0, 10);
  const k = `${kind}:${(await sha256(`${ip}|${day}|${env.ADMIN_KEY || ''}|direct-action`)).slice(0, 24)}`; const t = now();
  const { n } = await db.prepare('SELECT count(*) AS n FROM hits WHERE k = ? AND t > ?').bind(k, t - windowMs).first();
  if (n >= max) return true;
  await db.prepare('INSERT INTO hits (k, t) VALUES (?, ?)').bind(k, t).run(); return false;
}
/* the housekeeping, now and then: what has waited too long goes, and what was printed keeps only its status */
async function tidy(db, env) {
  const t = now(); await tapesGo(db, env); await codesGo(db, t);
  await db.batch([
    db.prepare('DELETE FROM hits WHERE t < ?').bind(t - H),
    db.prepare("UPDATE jobs SET status = 'expired', escpos = NULL, mesh = NULL, done = ? WHERE status IN ('held', 'queued') AND created < ?").bind(t, t - DAY),
    db.prepare("UPDATE jobs SET escpos = NULL, mesh = NULL WHERE status IN ('printed', 'failed', 'expired') AND escpos IS NOT NULL"),
    db.prepare('DELETE FROM jobs WHERE done IS NOT NULL AND done < ?').bind(t - 7 * DAY),
    db.prepare("DELETE FROM stories WHERE status IN ('waiting', 'refused', 'deleted') AND created < ?").bind(t - 365 * DAY),
    db.prepare('DELETE FROM traffic WHERE day < ?').bind(new Date(t - 400 * DAY).toISOString().slice(0, 10)),
    db.prepare('DELETE FROM osm WHERE at < ?').bind(t - 45 * DAY),
    db.prepare("DELETE FROM places WHERE status IN ('waiting', 'refused', 'deleted') AND created < ?").bind(t - 365 * DAY),
  ]);
}

async function codesGo(db, t) {
  const { results } = await db.prepare('SELECT who FROM makers WHERE COALESCE(keep, first + ?) < ? LIMIT 200').bind(KEEP.fresh, t).all(); if (!results.length) return 0;
  const ops = []; for (const { who } of results) { ops.push(db.prepare('UPDATE stories SET who = NULL WHERE who = ?').bind(who), db.prepare('UPDATE tapes SET who = NULL WHERE who = ?').bind(who), db.prepare('DELETE FROM makers WHERE who = ?').bind(who)); }
  await db.batch(ops); try { await linkTable(db); await db.batch(results.map(({ who }) => db.prepare('DELETE FROM links WHERE who = ?').bind(who))); } catch (e) { /* no links */ }
  await stampTable(db); await db.batch(results.map(({ who }) => db.prepare('DELETE FROM stamps WHERE who = ?').bind(who)));
  return results.length; }
/* ───────── what the public sees ───────── */
const storyOut = r => ({ id: r.id, code: r.code, kind: r.kind, body: r.body, photo: !!r.has_photo, dest: r.dest || '', at: r.decided || r.created, star: !!r.star, printed: r.printed || 0 });
const PUBLIC_COLS = "id, code, kind, body, dest, created, decided, (photo IS NOT NULL OR pic IS NOT NULL) AS has_photo, star, (SELECT count(*) FROM jobs j WHERE j.story = stories.id AND j.status = 'printed') AS printed";

async function listStories(db, url) {
  if (!(await madeOn(db))) return json({ stories: [], at: now() });
  const since = Math.max(0, +(url.searchParams.get('since') || 0));
  const { results } = await db.prepare(`SELECT ${PUBLIC_COLS} FROM stories WHERE status = 'shown' AND gone IS NULL AND kind NOT IN ('example', 'message', 'play') AND decided > ? ORDER BY decided DESC LIMIT 200`).bind(since).all();
  return json({ stories: results.map(storyOut), at: now() });
}
/* the example board everyone sees: the latest one approved, or none (then the example built into the site stands) */
async function exampleBoard(db) {
  const r = await db.prepare("SELECT body, decided FROM stories WHERE kind = 'example' AND status = 'shown' ORDER BY decided DESC LIMIT 1").first();
  let board = null; try { board = r ? JSON.parse(r.body) : null; } catch (e) { board = null; }
  return json({ board, at: r ? r.decided : 0 });
}
async function oneStory(db, code) {
  if (!(await madeOn(db))) return fail(404, 'not found');
  const r = await db.prepare(`SELECT ${PUBLIC_COLS} FROM stories WHERE status = 'shown' AND gone IS NULL AND kind NOT IN ('message', 'play') AND code = ? ORDER BY decided DESC LIMIT 1`).bind(code).first();
  return r ? json({ story: storyOut(r) }) : fail(404, 'not found');
}
async function photo(db, env, id, any) {
  const r = await db.prepare(`SELECT photo, pic, status, kind, gone FROM stories WHERE id = ?`).bind(id).first();
  if (!r || !(r.photo || r.pic) || (!any && (r.status !== 'shown' || r.gone || r.kind === 'message' || !(await madeOn(db))))) return fail(404, 'not found');
  const o = !r.photo && env.MEDIA ? await env.MEDIA.get(photoKey(id)) : null; if (!r.photo && !o) return fail(404, 'not found');
  return new Response(o ? o.body : new Uint8Array(r.photo), { headers: { 'content-type': 'image/jpeg', 'cache-control': any ? 'no-store' : 'public, max-age=3600', 'x-content-type-options': 'nosniff' } });
}
/* a maker's own, by their three characters: what they sent (the words only of what is on the site), and taking one down.
   Taken down is off the site only: the approval page keeps it as it was. Asked too often from one place, it waits */
/* a maker's kin, given if they have none yet (makers from before kin, or one only known by a code typed) */
async function kinOf(db, who) {
  let mk = await db.prepare('SELECT lv, kin, printed FROM makers WHERE who = ?').bind(who).first(); if (!mk) return null;
  if (mk.kin == null) { await db.prepare('UPDATE makers SET kin = (SELECT COALESCE(MAX(kin), -1) + 1 FROM makers) WHERE who = ? AND kin IS NULL').bind(who).run(); mk = await db.prepare('SELECT lv, kin, printed FROM makers WHERE who = ?').bind(who).first(); }
  return mk;
}
/* the board: the latest of a section (or all), each by its maker's kin; written only with a code a print gave (a maker the site knows) */
const SECS = ['notice', 'story', 'make', 'print'];
const POSTER_SEC = /^p\.DA-[0-9A-HJKMNP-TV-Z]{4}$/, SONG_SEC = /^p\.S-[0-9a-z]{6}$/, CARD_SEC = /^c\.[a-z0-9-]{1,24}\.(open|help|show|make)$/;
/* a talk's place: a step, or a poster shown on the site (never a private message, never one taken down); its own maker can
   always talk on it, shown or still a draft */
async function secOf(db, s, who) {
  if (SECS.includes(s) || SONG_SEC.test(s || '') || CARD_SEC.test(s || '')) return s;   // every card's own rooms, the steps and a song's art: anyone with a code
  if (!POSTER_SEC.test(s || '')) return null;
  if (who && (await db.prepare("SELECT 1 AS k FROM stories WHERE code = ? AND who = ? AND gone IS NULL AND kind != 'message'").bind(s.slice(2), who).first())) return s;
  if (!(await madeOn(db))) return null;
  return (await db.prepare("SELECT 1 AS k FROM stories WHERE code = ? AND status = 'shown' AND gone IS NULL AND quiet IS NULL AND kind != 'message'").bind(s.slice(2)).first()) ? s : null;
}
const TALK_K = ['swap', 'share', 'spot'];
/* a code a printer has given: the talk is read and written only with one */
/* a code unused is let go: two weeks from when it was given, unless something is made or saved with it (each one keeps it a month from then) */
const KEEP = { fresh: 14 * DAY, made: 30 * DAY };
const keepMade = (db, who) => db.prepare('UPDATE makers SET keep = max(COALESCE(keep, 0), ?) WHERE who = ?').bind(now() + KEEP.made, who);
async function coded(db, who) { return !!(await db.prepare('SELECT 1 AS k FROM makers WHERE who = ? AND printed IS NOT NULL').bind(who).first()); }
async function talkList(db, env, req, url) {
  const s = url.searchParams.get('s'), who = url.searchParams.get('who') || ''; if (!WHO.test(who)) return fail(400, 'talk');
  if (await tooMany(db, env, req, 'talkr', 120, 10 * 60e3)) return fail(429, 'too many');
  const sec = await secOf(db, s, who); if (!sec) return fail(400, 'talk');
  if (!(await coded(db, who))) return fail(401, 'code');
  const { results } = await db.prepare(`SELECT t.id, t.sec, t.text, t.re, t.at, t.k, m.kin FROM talk t LEFT JOIN makers m ON m.who = t.who WHERE t.hidden IS NULL${sec ? ' AND t.sec = ?' : ''} ORDER BY t.at DESC LIMIT 80`).bind(...(sec ? [sec] : [])).all();
  return json({ talk: results });
}
/* bot protection (Cloudflare Turnstile, free): a person's token checked once the TURNSTILE_SECRET secret is set; until then everyone passes */
async function human(env, req, tok) {
  if (!env.TURNSTILE_SECRET) return true; if (typeof tok !== 'string' || !tok || tok.length > 2048) return false;
  const f = new FormData(); f.append('secret', env.TURNSTILE_SECRET); f.append('response', tok); const ip = req.headers.get('cf-connecting-ip'); if (ip) f.append('remoteip', ip);
  try { const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: f }); return !!(await r.json()).success; } catch (e) { return false; }
}
/* where a story's full photograph is kept in R2; a preview build keeps its own apart */
const mediaKey = id => `${PREVIEW ? 'preview/' : ''}full/${id}.jpg`;
const photoKey = id => `${PREVIEW ? 'preview/' : ''}photo/${id}.jpg`, coverKey = id => `${PREVIEW ? 'preview/' : ''}cover/${id}.jpg`;
/* a photograph into R2 while there is room under the 8 GB kept for it: true once it is there */
async function toR2(db, env, key, bytes) { if (!env.MEDIA || !bytes || (await r2Bytes(db)) + bytes.length >= CAP.r2 * 0.8) return false; try { await env.MEDIA.put(key, bytes, { httpMetadata: { contentType: 'image/jpeg' } }); return true; } catch (e) { return false; } }
/* the photographs still inside the database moved to R2, a few at a time (the approval page's overview asks for it as it refreshes) */
async function movePhotos(db, env, n = 10) {
  if (!env.MEDIA) return 0; let moved = 0;
  const { results: st } = await db.prepare('SELECT id, photo FROM stories WHERE photo IS NOT NULL LIMIT ?').bind(n).all();
  for (const r of st) { const b = new Uint8Array(r.photo); if (await toR2(db, env, photoKey(r.id), b)) { await db.prepare('UPDATE stories SET photo = NULL, pic = ? WHERE id = ?').bind(b.length, r.id).run(); moved++; } }
  const { results: po } = await db.prepare('SELECT id, cover FROM posts WHERE cover IS NOT NULL LIMIT ?').bind(n).all();
  for (const r of po) { const b = new Uint8Array(r.cover); if (await toR2(db, env, coverKey(r.id), b)) { await db.prepare('UPDATE posts SET cover = NULL, cov = ? WHERE id = ?').bind(b.length, r.id).run(); moved++; } }
  return moved;
}
async function talkSay(db, env, req) {
  const b = await body(req); const who = typeof b.who === 'string' ? b.who : '', text = typeof b.text === 'string' ? b.text.trim().slice(0, 280) : '';
  const sec = WHO.test(who) && text ? await secOf(db, b.s, who) : null; if (!sec) return fail(400, 'talk');
  if (levelOf() >= 2) return fail(503, 'resting');
  if (await tooMany(db, env, req, 'talk', 20, 10 * 60e3)) return fail(429, 'too many');
  if (!(await human(env, req, b.cf))) return fail(403, 'human');
  /* only those who have a code already may talk: one a printer has given (kept in check by the limits, the hours and the approval page, which can hide a word) */
  if (!(await coded(db, who))) return fail(401, 'code');
  const mk = await kinOf(db, who); if (!mk) return fail(400, 'talk');
  const re = typeof b.re === 'string' && /^[a-z0-9]{6,24}$/.test(b.re) ? b.re : null, id = rid(), t = now();
  await db.batch([db.prepare('INSERT INTO talk (id, sec, who, text, re, at, k) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(id, sec, who, text, re, t, TALK_K.includes(b.k) ? b.k : null), db.prepare('UPDATE makers SET last = ? WHERE who = ?').bind(t, who)]);
  return json({ id, kin: mk.kin, at: t }, 201);
}
/* a tape: the loop as recorded (WAV, or what the phone made), up to 16 MB, from a maker's code; kept half a moon, then cleared.
   Its name is the one it is saved under, the same wherever it is saved from */
const TAPE = { bytes: 16e6, keep: 14 * DAY, types: /^audio\/(wav|x-wav|webm|mp4|ogg)$/ };
const tapeKey = id => `${PREVIEW ? 'preview/' : ''}tape/${id}`;
async function tapeUp(db, env, req, url) {
  const who = url.searchParams.get('who') || '', type = String(req.headers.get('content-type') || '').split(';')[0].trim();
  const name = String(url.searchParams.get('name') || '').toLowerCase().replace(/[^a-z0-9.-]+/g, '-').slice(0, 80);
  if (!WHO.test(who) || !TAPE.types.test(type) || !/^novel-global-[a-z0-9-]+\.(wav|webm|m4a|ogg)$/.test(name)) return fail(400, 'tape');
  if (!env.MEDIA) return fail(503, 'no room');
  const n = +(req.headers.get('content-length') || 0); if (n > TAPE.bytes) return fail(413, 'too big');
  if (await tooMany(db, env, req, 'tape', 12, H)) return fail(429, 'too many');
  const b = new Uint8Array(await req.arrayBuffer()); if (!b.length || b.length > TAPE.bytes) return fail(413, 'too big');
  if ((await r2Bytes(db)) + b.length >= CAP.r2 * 0.8) return fail(503, 'no room');
  const id = rid(12), t = now(); await env.MEDIA.put(tapeKey(id), b, { httpMetadata: { contentType: type } });
  await db.batch([db.prepare('INSERT INTO tapes (id, who, name, type, bytes, at) VALUES (?, ?, ?, ?, ?, ?)').bind(id, who, name, type, b.length, t), keepMade(db, who)]);
  return json({ id, url: `/api/tapes/${id}`, name, until: t + TAPE.keep }, 201);
}
async function tapeGet(db, env, id) {
  if (!/^[a-z0-9]{6,24}$/.test(id)) return fail(404, 'not found');
  const r = await db.prepare('SELECT name, type, at FROM tapes WHERE id = ?').bind(id).first(); if (!r || now() - r.at > TAPE.keep || !env.MEDIA) return fail(404, 'not found');
  const o = await env.MEDIA.get(tapeKey(id)); if (!o) return fail(404, 'not found');
  return new Response(o.body, { headers: { 'content-type': r.type, 'content-disposition': `attachment; filename="${r.name}"`, 'cache-control': 'private, max-age=3600', 'x-content-type-options': 'nosniff' } });
}
/* the tapes older than half a moon: their files cleared from R2 and their rows gone, a few at a time */
async function tapesGo(db, env) {
  const { results } = await db.prepare('SELECT id FROM tapes WHERE at < ? LIMIT 50').bind(now() - TAPE.keep).all().catch(() => ({ results: [] }));
  for (const r of results) { if (env && env.MEDIA) await env.MEDIA.delete(tapeKey(r.id)).catch(() => {}); await db.prepare('DELETE FROM tapes WHERE id = ?').bind(r.id).run(); }
}
/* one's own printed poster put live by its maker's code: shown on the site's wall for everyone at once, no approval first (the
   approval page can still take it down); never one refused or taken down, never a message */
async function live(db, env, req) {
  const b = await body(req), who = typeof b.who === 'string' ? b.who : '';
  if (!WHO.test(who) || !CODE.test(b.code || '')) return fail(400, 'live');
  if (await tooMany(db, env, req, 'live', 12, 10 * 60e3)) return fail(429, 'too many');
  if (!(await madeOn(db))) return fail(503, 'closed');
  const s = await db.prepare("SELECT id, status, art FROM stories WHERE code = ? AND who = ? AND gone IS NULL AND kind NOT IN ('message', 'example') ORDER BY created DESC LIMIT 1").bind(b.code, who).first();
  if (!s || ['refused', 'deleted', 'expired'].includes(s.status)) return fail(404, 'not found');
  if (!s.art) return fail(409, 'no picture');
  if (s.status !== 'shown') await db.prepare("UPDATE stories SET status = 'shown', decided = ? WHERE id = ?").bind(now(), s.id).run();
  return json({ ok: true, id: s.id });
}
async function mine(db, env, req, who, id) {
  if (!WHO.test(who || '')) return fail(400, 'who');
  if (await tooMany(db, env, req, 'mine', 60, 10 * 60e3)) return fail(429, 'too many');
  await db.prepare('UPDATE makers SET last = ? WHERE who = ?').bind(now(), who).run();
  if (id) { const r = await db.prepare('UPDATE stories SET gone = ? WHERE id = ? AND who = ? AND gone IS NULL').bind(now(), id, who).run(); return r.meta && r.meta.changes ? json({ ok: true }) : fail(404, 'not found'); }
  const { results } = await db.prepare(`SELECT id, code, kind, status, body, created, decided, (photo IS NOT NULL OR pic IS NOT NULL) AS has_photo FROM stories WHERE who = ? AND gone IS NULL AND kind NOT IN ('example', 'play', 'message') ORDER BY created DESC LIMIT 100`).bind(who).all();
  const mk = await kinOf(db, who), kp = await db.prepare('SELECT COALESCE(keep, first + ?) AS k FROM makers WHERE who = ?').bind(KEEP.fresh, who).first();
  const hk = new URL(req.url).searchParams.get('k'), st = hk && codeKey(env) && hk === await homeKey(env, who) ? await stampsOf(db, who) : null;
  const own = st ? { stamps: st, animal: ((await db.prepare('SELECT animal FROM makers WHERE who = ?').bind(who).first()) || {}).animal != null, mods: (await db.prepare('SELECT id, name, number FROM printers WHERE mods LIKE ?').bind('%"' + who + '"%').all()).results.map(p => ({ id: p.id, name: p.name || p.id, number: p.number || null })) } : null;
  return json({ ...(own || {}), keep: (kp && kp.k) || 0, lv: (mk && mk.lv) || 0, kin: mk ? mk.kin : null, printed: !!(mk && mk.printed), mine: results.map(r => ({ id: r.id, code: r.code, kind: r.kind, shown: r.status === 'shown', at: r.created, photo: r.status === 'shown' && !!r.has_photo, body: r.status === 'shown' ? r.body : '' })) });
}
/* a story sent: it waits for approval. A job for the partner's printer waits with it, unless that printer prints without approval.
   dest 'mesh': no print, only its mesh line, to every paired printer whose radio is on (MESH), to go out over the local mesh */
async function send(db, env, req) {
  const b = await body(req, LIMIT.bodyBig);
  /* a send refused for a printer is noted on it, for the approval page to show */
  const refuse = async (code, why) => { if (typeof b.dest === 'string' && b.dest && b.dest !== 'mesh') { try { await db.prepare('UPDATE printers SET refused = ? WHERE id = ?').bind(JSON.stringify({ why, at: now() }), b.dest).run(); } catch (e) { /* no such printer */ } } return fail(code, why); };
  if (await tooMany(db, env, req, 'send', LIMIT.sends, 10 * 60e3)) return refuse(429, 'too many sends from one place in ten minutes');
  const kind = ['record', 'cells', 'example', 'message'].includes(b.kind) ? b.kind : 'story';
  /* a pop-up's own link: open only while the pop-up is, and its prints go straight out on its printer (or novel.global's) unless it asks for approval */
  /* a phone that came in by the pop-up's link carries its key (a cookie): with FREE PRINTING on, every card it prints goes straight out too */
  const popCk = (/(?:^|;\s*)pop=([a-z0-9]{6,40})/.exec(req.headers.get('cookie') || '') || [])[1] || '';
  const popP = b.from === 'pop' ? await popFind(db, env, b.pop, b.popId) : popCk ? await popFind(db, env, popCk, '') : null; if (b.from === 'pop' && !popP) return fail(403, 'closed');
  const popAuto = !!(popP && popP.auto !== false && (b.from === 'pop' || popP.free === true) && typeof b.dest === 'string' && (b.dest === (popP.to || '') || b.dest === popP.id || b.dest === 'novelglobal'));
  if (!CODE.test(b.code || '')) return fail(400, 'code');
  /* a message to novel.global (the portfolio's send message) is a story kept private: printed once approved, never listed */
  if ((kind === 'story' || kind === 'message') && !(typeof b.body === 'string' && /^[A-Za-z0-9_-]{20,}$/.test(b.body) && b.body.length <= LIMIT.sig)) return fail(400, 'story');
  if (kind === 'record' && !(typeof b.body === 'string' && b.body.length <= LIMIT.record && (() => { try { return typeof JSON.parse(b.body) === 'object'; } catch (e) { return false; } })())) return refuse(400, 'record too long');
  if (kind === 'cells' && (!cellsOk(b.body) || b.dest || b.photo)) return fail(400, 'cells');
  /* BOARD 00, the example, rewritten: only while it is open to editing on the approval page, and shown only once approved */
  if (kind === 'example' && !(await settingsOf(db)).exampleEdit) return fail(403, 'locked');
  if (kind === 'example' && (b.dest || b.photo || !(typeof b.body === 'string' && b.body.length <= LIMIT.example && (() => { try { const j = JSON.parse(b.body); return !!j && Array.isArray(j.objects); } catch (e) { return false; } })()))) return fail(400, 'example');
  const lat = +b.lat, lng = +b.lng; if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return fail(400, 'where');
  const pic = b.photo ? dataURL(b.photo) : null;   // a photograph too large or of another kind is left off; the print still goes
  const dest = typeof b.dest === 'string' && b.dest ? b.dest : ''; const toMesh = dest === 'mesh';
  const P = dest && !toMesh ? await db.prepare('SELECT * FROM printers WHERE id = ?').bind(dest).first() : null;
  if (dest && !toMesh && !P) return fail(400, 'dest');
  if (P && P.id !== 'novelglobal' && b.stage !== 'stack' && !linksOf(P.links).includes('wish')) return refuse(403, 'this island has not switched on W.I.S.H.');
  if (toMesh && !(typeof b.mesh === 'string' && b.mesh)) return fail(400, 'mesh');
  if (dest && b.escpos != null && !b64ok(b.escpos, LIMIT.escpos)) return refuse(400, 'the print is too long');
  /* a private pop-up (as each is, until its place chooses to keep its prints): the print waits for its printer and nothing else is written:
     no story, no picture, no maker, no place, no approval. The print itself is wiped the moment it is printed, or after six hours unprinted */
  if (popP && b.from === 'pop' && (popP.private !== false || b.keep === false)) {
    if (!P || !b.escpos || !(dest === (popP.to || '') || dest === popP.id || dest === 'novelglobal')) return fail(400, 'dest');
    const tp = now(); await db.prepare("UPDATE jobs SET status = 'failed', error = 'not printed in time', escpos = NULL, done = ? WHERE story IS NULL AND status IN ('queued', 'held') AND created < ?").bind(tp, tp - 6 * 36e5).run();
    const { q } = await db.prepare("SELECT count(*) AS q FROM jobs WHERE printer = ? AND status IN ('held', 'queued', 'printing')").bind(dest).first(); if (q >= LIMIT.perPrinter) return fail(503, 'its queue is full');
    const gap = await printGap(db, env, req, typeof b.who === 'string' && WHO.test(b.who) ? b.who : null, b.set, P); if (gap) return json({ error: 'wait', wait: gap }, 429);
    const jb = { id: rid(), status: 'queued' };
    await db.batch([db.prepare('INSERT INTO jobs (id, printer, story, code, escpos, mesh, status, created) VALUES (?, ?, NULL, ?, ?, NULL, ?, ?)').bind(jb.id, dest, b.code, b.escpos, jb.status, tp), db.prepare('UPDATE printers SET warm = ? WHERE id = ?').bind(tp, dest)]);
    return json({ id: null, status: 'private', job: jb, straight: true }, 201);
  }
  /* FREE PRINTING (on to begin with): every print goes straight out. PRINT PASS (off to begin with): a printed pass is neither asked for nor used up */
  const SP = await settingsOf(db), free = !!SP.freePrint;
  let passed = false, pf = null; if (P && typeof b.pass === 'string' && codeKey(env)) pf = await passFind(db, env, b.pass, P.id);
  if (pf && SP.passOn && (b.escpos || b.mesh)) passed = await passUse(db, pf.code, pf.day, P.id);
  if (b.mesh != null && (typeof b.mesh !== 'string' || enc.encode(b.mesh).length > LIMIT.mesh)) return fail(400, 'mesh');
  const { n } = await db.prepare("SELECT count(*) AS n FROM stories WHERE status = 'waiting'").first(); if (n >= LIMIT.waiting) return refuse(503, 'too many stories waiting for approval');
  const who = typeof b.who === 'string' && WHO.test(b.who) ? b.who : null;
  if (pf && who) await stampPut(db, env, who, pf);
  const cf = req.cf || {}, ua = req.headers.get('user-agent') || '', str = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');
  const origin = JSON.stringify({ ...(popP && b.from === 'pop' ? { pop: String(popP.id).slice(0, 24) } : {}), from: str(b.from, 24), stage: str(b.stage, 60), city: str(cf.city, 40), region: str(cf.region, 40), country: str(cf.country, 4), dev: /Mobi|Android|iPhone|iPad/i.test(ua) ? 'phone' : 'computer', mesh: str(b.mesh, 240) });
  const id = rid(); const t = now(); const inR2 = pic ? await toR2(db, env, photoKey(id), pic) : false;
  const live = !dest && kind === 'record' && !!(await settingsOf(db)).sendLive, st0 = live ? 'shown' : 'waiting';
  const ops = [db.prepare('INSERT INTO stories (id, code, kind, status, body, photo, pic, lat, lng, dest, created, decided, who, origin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(id, b.code, kind, st0, b.body, inR2 ? null : pic, inR2 ? pic.length : null, lat, lng, dest || null, t, live ? t : null, who, origin)];
  let job = null;
  if (P && (b.escpos || b.mesh)) {
    const { q } = await db.prepare("SELECT count(*) AS q FROM jobs WHERE printer = ? AND status IN ('held', 'queued', 'printing')").bind(dest).first(); if (q >= LIMIT.perPrinter) return refuse(503, 'its queue is full');
    const gap = await printGap(db, env, req, who, b.set, P); if (gap) return json({ error: 'wait', wait: gap }, 429);
    /* held for the touch screen only while it is there: a screen not heard from for two and a half minutes is passed by */
    /* touch screens are off unless the owner turns them on (touchOn): then nothing waits on one */
    const touchOn = !!(await settingsOf(db)).touchOn, screenGone = P.touch && (!touchOn || !P.touch_seen || t - P.touch_seen > 150e3);
    job = { id: rid(), status: free || P.auto || screenGone || passed || popAuto ? 'queued' : 'held' };
    const thumb = typeof b.thumb === 'string' && /^\d{1,3},\d{1,3},[A-Za-z0-9+/=]{1,2400}$/.test(b.thumb) ? b.thumb : null;
    ops.push(db.prepare('INSERT INTO jobs (id, printer, story, code, escpos, mesh, status, created, thumb) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(job.id, dest, id, b.code, b.escpos || null, P.mesh ? (b.mesh || null) : null, job.status, t, thumb));
  }
  if (toMesh) { const gm = await printGap(db, env, req, who); if (gm) return json({ error: 'wait', wait: gm }, 429);
    const { results: radios } = await db.prepare(`SELECT p.id, p.auto, (SELECT count(*) FROM jobs j WHERE j.printer = p.id AND j.status IN ('held', 'queued', 'printing')) AS q
      FROM printers p WHERE p.mesh = 1 AND p.token IS NOT NULL`).all();
    for (const r of radios) { if (r.q >= LIMIT.perPrinter) continue; const jb = { id: rid(), status: 'queued' }; job = job || jb;
      ops.push(db.prepare('INSERT INTO jobs (id, printer, story, code, escpos, mesh, status, created) VALUES (?, ?, ?, ?, NULL, ?, ?, ?)').bind(jb.id, r.id, id, b.code, b.mesh, jb.status, t)); }
  }
  const lv = Math.max(0, Math.min(4, Math.round(+b.lv || 0)));
  if (who) ops.push(db.prepare('INSERT INTO makers (who, first, last, posts, stage, lv, kin) VALUES (?, ?, ?, 1, ?, ?, (SELECT COALESCE(MAX(kin), -1) + 1 FROM makers)) ON CONFLICT(who) DO UPDATE SET last = excluded.last, posts = posts + 1, stage = COALESCE(excluded.stage, stage), lv = max(COALESCE(lv, 0), excluded.lv)').bind(who, t, t, typeof b.stage === 'string' && b.stage ? b.stage.slice(0, 60) : null, lv));
  if (dest && !toMesh) ops.push(db.prepare('UPDATE printers SET warm = ? WHERE id = ?').bind(t, dest));
  if (who) ops.push(keepMade(db, who));
  await db.batch(ops);
  /* the full photograph, kept in R2 when it is bound; the print and the site never need it */
  const lowRes = (await settingsOf(db)).lowRes, full = env.MEDIA && b.full && !lowRes ? dataFile(b.full, LIMIT.full) : null, art = env.MEDIA && b.art ? dataURL(b.art, LIMIT.full) : null;
  if (art && (await r2Bytes(db)) + art.length < CAP.r2 * 0.8) { try { await env.MEDIA.put(`art/${id}`, art, { httpMetadata: { contentType: 'image/jpeg' } }); await db.prepare('UPDATE stories SET art = ? WHERE id = ?').bind(art.length, id).run(); } catch (e) { /* kept without it */ } }
  if (full && (await r2Bytes(db)) + full.bytes.length < CAP.r2 * 0.8) { try { await env.MEDIA.put(mediaKey(id), full.bytes, { httpMetadata: { contentType: full.type } }); await db.prepare('UPDATE stories SET full = ? WHERE id = ?').bind(full.bytes.length, id).run(); } catch (e) { /* the story is kept without it */ } }
  const home = who ? await homeGive(db, env, req, who, b) : null; let gift = null;
  { const pw = P && who && codeKey(env) ? waysOf(P) : null; if (pw && pw.includes('random') && crypto.getRandomValues(new Uint8Array(1))[0] < 52) { const m = await passMake(db, env, P.id, 1); gift = { code: m.passes[0], island: P.id, day: m.day }; } }
  return json({ id, status: st0, job, ...(home ? { home } : {}), ...(gift ? { gift } : {}), ...(passed ? { passed: true } : {}), ...((popAuto || free) && job && job.status === 'queued' ? { straight: true } : {}) }, 201);
}
/* the sender's receipt: where their story is, and where its print is in the queue */
async function receipt(db, id) {
  const s = await db.prepare('SELECT id, code, status, dest FROM stories WHERE id = ?').bind(id).first(); if (!s) return fail(404, 'not found');
  const j = await db.prepare('SELECT id, printer, status, created, done, error FROM jobs WHERE story = ? ORDER BY created DESC LIMIT 1').bind(id).first();
  let ahead = 0; if (j && j.status === 'queued') ({ ahead } = await db.prepare("SELECT count(*) AS ahead FROM jobs WHERE printer = ? AND status IN ('queued', 'printing') AND created < ?").bind(j.printer, j.created).first());
  return json({ id, code: s.code, status: s.status, dest: s.dest || '', job: j ? { status: j.status, ahead, done: j.done || null, error: j.status === 'failed' ? String(j.error || '').slice(0, 60) : null } : null });
}
/* every pull adds to the engine: a device tells the kinds of life it has met for the first time, and those new here are kept (an
   insert that finds one already kept writes nothing). Resting, they wait for the device's next pull */
const PH_OK = /^https:\/\/(inaturalist-open-data\.s3\.amazonaws\.com|static\.inaturalist\.org)\/[\w./-]{1,240}$/;
async function learnKinds(db, env, req) {
  if (levelOf() >= 2) return fail(503, 'resting');
  const b = await body(req), list = Array.isArray(b.kinds) ? b.kinds.slice(0, 60) : []; if (!list.length) return fail(400, 'kinds');
  if (await tooMany(db, env, req, 'kinds', 12, 10 * 60e3)) return fail(429, 'too many');
  const s = (v, n, re) => (typeof v === 'string' && v.length <= n && (!re || re.test(v)) ? v : ''), t = now();
  const ok = list.filter(k => k && Number.isInteger(k.id) && k.id > 0 && k.id < 1e10 && s(k.n, 120));
  if (!ok.length) return fail(400, 'kinds');
  const r = await db.batch(ok.map(k => db.prepare('INSERT OR IGNORE INTO species (id, n, cn, ic, g, ph, first) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(k.id, s(k.n, 120), s(k.cn, 120), s(k.ic, 30, /^[A-Za-z]+$/), s(k.g, 24, /^[a-z-]+$/), s(k.ph, 300, PH_OK), t)));
  return json({ added: r.reduce((n, x) => n + ((x && x.meta && x.meta.changes) || 0), 0) });
}
/* the site's own settings, for everyone: whether the nature station stays on for every visitor (lifeLock, on unless unlocked);
   whether BOARD 00, the example, can be rewritten and sent here for approval (exampleEdit, off unless switched on) */
/* lowRes: keep only the print-sized photograph, never the full-size one (off: full size in R2) */
/* madeShow: what people make (stories, posters, packs, their photographs and talk) shown to visitors; off, every one of them stays a
   draft, decided on here and seen by no one else. exampleShow: the example poster and BOARD 00 shown to visitors */
/* buoyScrap: the radio card's buoy built from found things, drawn by hand; off, the clean one */
/* moonShow: the moon tonight beside SOUND in the dark, and the moon each thing was made under in the corner of every print and piece kept */
/* sendLive: a piece sent to novel.global with no printer (and no mesh) shown on the site at once; off, it waits here for approval. A print
   is the only thing that opens the devices, either way */
const SETTINGS = { openJoin: true, lifeLock: true, exampleEdit: false, phreak: false, lowRes: false, madeShow: false, exampleShow: true, moonShow: true, sendLive: false, buoyScrap: true, blogShow: false, smallTalk: false, smallFind: false, oneIsland: true, jellyStamp: false, sandbox: true, cartridges: false, popOn: false, passOn: true, freePrint: true, touchOn: false };
/* choices, one of a few: how long a new code is (3 or 6), and what an island's touch screen does with passes (nothing, shows one, takes one typed) */
const CHOICES = { codeLen: [3, 6], touchPass: ['', 'show', 'type'], printGap: [0, 30, 60, 120, 300, 600] };
/* what an island may set for itself: its cards (a pack), how its passes are given, the gap between one person's prints, and who helps run it */
const PACKS = { full: null, builder: ['intro', 'wish', 'research', 'zine', 'kit', 'space', 'slot-3'], utilities: ['intro', 'weather', 'news', 'events', 'fiction', 'nonfiction', 'survival', 'cards', 'tarot'] };
const WAYS = ['touch', 'print', 'intro', 'random'];
const jsonOf = v => { try { return JSON.parse(v || 'null'); } catch (e) { return null; } };
const waysOf = p => { const w = jsonOf(p && p.ways); return Array.isArray(w) ? w.filter(x => WAYS.includes(x)) : null; };
const modsOf = p => { const m = jsonOf(p && p.mods); return Array.isArray(m) ? m.filter(x => WHO.test(String(x))) : []; };
/* an island's own setup, as sent by its keeper or the approval page: only what is known is kept; mods only from the keeper or the approval page */
function isleSetup(b, withMods) { const o = {};
  if (b.gap === null || b.gap === '') o.gap = null; else if (b.gap !== undefined && CHOICES.printGap.includes(+b.gap)) o.gap = +b.gap;
  if (typeof b.pack === 'string' && b.pack in PACKS) o.pack = b.pack === 'full' ? null : b.pack;
  if (b.ways === null) o.ways = null; else if (Array.isArray(b.ways)) o.ways = JSON.stringify([...new Set(b.ways.map(String).filter(x => WAYS.includes(x)))]);
  if (withMods && Array.isArray(b.mods)) o.mods = JSON.stringify([...new Set(b.mods.map(x => String(x).toUpperCase().replace(/[^A-Z0-9]/g, '')).filter(x => WHO.test(x)))].slice(0, 8));
  return o; }
async function isleSet(db, id, o) { const ks = Object.keys(o); if (!ks.length) return; await db.prepare(`UPDATE printers SET ${ks.map(k => k + ' = ?').join(', ')} WHERE id = ?`).bind(...ks.map(k => o[k]), id).run(); }
const isleOut = p => ({ gap: p.gap == null ? null : p.gap, pack: p.pack || 'full', ways: waysOf(p), packs: Object.keys(PACKS), allWays: WAYS, gaps: CHOICES.printGap });
const madeOn = async db => !!(await settingsOf(db)).madeShow;
/* and words: the first board's template, as rewritten on the approval page (empty: the site's own, in config.js) */
/* gates: how the devices are earned (JSON: mode earn | open | closed, at: the posters for each); fx: the aura's motion (calm | base | chaos);
   curations: the portfolio's twelve groups (JSON: [{ k, name, about }]) */
/* start: the start page and the booth (JSON: discWords, checklist, printNight paper | day | night, boothHome s, boothGap minutes between prints from one phone) */
/* notice: the words above the rings on a first visit (JSON: off, head, text; empty: the site's own); country: the words over El Niño's
   map the first time it opens on a phone (JSON: off, head, text; empty: the Country and its sovereignty from config.js) */
/* printq: how prints are made (JSON: preset soft | crisp | bold | screen | graphic, and any of its tweaks set apart: clip, gamma, contrast,
   sharpen, dither (auto: chosen for each picture), lineCut, bolden, minText, heat; and cal { b, m, w }, the curve read off the printed
   calibration strip; empty: crisp as it is) */
/* styles: the artists' mod packs added on the approval page (JSON: { packs: [{ name, by, styles: [...], off: [style ids not shown] }] };
   every style is checked again on each phone by thermal.js before it is used) */
/* groups: the portfolio's groups a piece can be filed under on the approval page, one to a line (kept here; not on the site yet) */
const TEXTS = { template: 6000, words: 4000, cities: 40000, gates: 300, fx: 20, curations: 6000, start: 600, notice: 1500, country: 600, groups: 600, printq: 800, sources: 8000, epoch: 40, styles: 100000, cards: 8000, opener: 3000, bizcard: 2000, species: 2000, showcase: 600, photos: 3000, events: 3000, popKey: 40, pops: 600000, note: 80000, noteKey: 40, noteSlip: 700, notePub: 2, label: 8000, welcome: 3000, notes: 12000, isles: 400000 };
/* texts the public settings never show: the pop-up's private link */
const HIDDEN_TEXTS = ['popKey', 'pops', 'note', 'noteKey', 'noteSlip', 'notePub', 'isles'];
/* what the full-size photographs take in R2: full holds each one's size (1, for those kept before sizes were, counts as the largest) */
async function r2Bytes(db) { const r = await db.prepare(`SELECT coalesce(sum(CASE WHEN full = 1 THEN ${LIMIT.full} ELSE coalesce(full, 0) END), 0) + coalesce(sum(art), 0) + coalesce(sum(pic), 0) AS b FROM stories WHERE full IS NOT NULL OR art IS NOT NULL OR pic IS NOT NULL`).first(); const c = await db.prepare('SELECT coalesce(sum(cov), 0) AS b FROM posts').first().catch(() => null); const tp = await db.prepare('SELECT coalesce(sum(bytes), 0) AS b FROM tapes').first().catch(() => null); const cp = await db.prepare('SELECT coalesce(sum(bytes), 0) AS b FROM cardpics').first().catch(() => null); return ((r && r.b) || 0) + ((c && c.b) || 0) + ((tp && tp.b) || 0) + ((cp && cp.b) || 0); }
/* the wall of posters: every poster shown on the site, as designed, the starred first; each with how much its talk has said */
async function posters(db) {
  if (!(await madeOn(db))) return json({ posters: [] });
  const { results } = await db.prepare("SELECT s.id, s.code, s.created AS at, s.star, s.quiet IS NOT NULL AS quiet, m.kin, (SELECT count(*) FROM talk t WHERE t.sec = 'p.' || s.code AND t.hidden IS NULL) AS said FROM stories s LEFT JOIN makers m ON m.who = s.who WHERE s.status = 'shown' AND s.gone IS NULL AND s.art IS NOT NULL AND s.kind != 'message' ORDER BY s.star DESC, s.created DESC LIMIT 120").all();
  return new Response(JSON.stringify({ posters: results.map(r => ({ ...r, star: !!r.star, quiet: !!r.quiet })) }), { headers: { ...JSON_H, 'cache-control': 'public, max-age=120' } });
}
async function posterArt(db, env, id, any) {
  if (!any && !(await madeOn(db))) return fail(404, 'not found');
  const s = await db.prepare(`SELECT id FROM stories WHERE id = ? AND art IS NOT NULL${any ? '' : " AND status = 'shown' AND gone IS NULL AND kind != 'message'"}`).bind(id).first(); if (!s || !env.MEDIA) return fail(404, 'not found');
  const o = await env.MEDIA.get(`art/${id}`); if (!o) return fail(404, 'not found');
  return new Response(o.body, { headers: { 'content-type': 'image/jpeg', 'cache-control': any ? 'no-store' : 'public, max-age=86400', 'x-content-type-options': 'nosniff' } });
}
async function settingsOf(db) { const { results } = await db.prepare('SELECT k, v FROM settings').all(); const out = { ...SETTINGS, ...Object.fromEntries(Object.keys(TEXTS).map(k => [k, ''])) }; for (const k in CHOICES) out[k] = CHOICES[k][0]; for (const r of results) { if (r.k in CHOICES) { const v = CHOICES[r.k].find(x => String(x) === r.v); if (v !== undefined) out[r.k] = v; } else if (r.k in SETTINGS) out[r.k] = r.v === '1'; else if (r.k in TEXTS) out[r.k] = r.v; } const had = new Set(results.map(r => r.k)); for (const k in BASE_TEXTS) if (!had.has(k)) out[k] = BASE_TEXTS[k]; if (!out.label) out.label = LABEL_TEXT; if (!out.notes) out.notes = NOTES_TEXT; return out; }
const LABEL_TEXT = JSON.stringify(LABEL), NOTES_TEXT = JSON.stringify(NOTES);
/* the partner places: whether a printer is there and listening, and how much it has printed */
async function partners(db) {
  const { results } = await db.prepare(`SELECT p.id, p.name, p.paper, p.mesh, p.live, p.two, p.links, p.pack, p.token IS NOT NULL AS paired, p.seen,
      (SELECT count(*) FROM jobs j WHERE j.printer = p.id AND j.status IN ('queued', 'printing')) AS queued,
      (SELECT count(*) FROM jobs j WHERE j.printer = p.id AND j.status = 'printed') AS printed FROM printers p ORDER BY p.created`).all();
  return json({ partners: results.map(p => ({ id: p.id, name: p.name, ...(p.pack && PACKS[p.pack] ? { pack: p.pack, cards: PACKS[p.pack] } : {}), paper: p.paper, paired: !!p.paired, mesh: !!p.mesh && !!p.paired, live: !!p.live, two: !!p.two, links: p.id === 'novelglobal' ? LINKS : linksOf(p.links), ready: !!p.seen && now() - p.seen < 2 * 60e3, queued: p.queued, printed: p.printed })) });
}

/* the film under the label: one file from the films bucket, played in the page and nowhere else. A play is asked for first and counted: so
   many a day in all, so many a day from one place, both set on the approval page. What comes back is an address signed for a few hours,
   which answers a player on this site, a piece at a time: never a tab, a save, or another site */
const FILM = { file: /^\w[\w.-]{0,79}\.(mp4|webm|mov)$/, life: 4 * 3600e3, piece: 4 << 20 };
const hex = u => [...u].map(b => b.toString(16).padStart(2, '0')).join('');
/* k: a card note's film (its file set on the approval page, LABEL, CARD NOTES), under the label film's limits; none: the label's own */
async function filmOf(db, k) { const s = await settingsOf(db); let L = {}, N = {}; try { L = JSON.parse(s.label || '{}') || {}; } catch (e) { L = {}; }
  if (!k) { const f = L.film; return f && f.on && FILM.file.test(f.file || '') ? f : null; }
  try { N = JSON.parse(s.notes || '{}') || {}; } catch (e) { N = {}; } const f = /^[a-z]{2,12}$/.test(k) && N.films && N.films[k];
  return f && FILM.file.test(f.file || '') ? { ...f, max: (L.film || {}).max, each: (L.film || {}).each } : null; }
const filmSig = async (env, file, exp) => hex(await mac(codeKey(env), `film|${file}|${exp}`)).slice(0, 32);
const filmToday = async db => { const r = await db.prepare("SELECT n FROM traffic WHERE day = ? AND k = 'film'").bind(melDay()).first(); return r ? r.n : 0; };
async function filmAsk(db, env, req) {
  const k = new URL(req.url).searchParams.get('k') || '', f = await filmOf(db, k); if (!f || !env.FILMS || !codeKey(env)) return fail(404, 'none');
  const max = Math.max(1, Math.min(1e6, Math.round(+f.max) || 300)), each = Math.max(1, Math.min(500, Math.round(+f.each) || 6));
  if ((await filmToday(db)) >= max || await tooMany(db, env, req, 'film', each, DAY)) return fail(429, 'rest');
  await db.prepare("INSERT INTO traffic (day, k, n) VALUES (?, 'film', 1) ON CONFLICT(day, k) DO UPDATE SET n = n + 1").bind(melDay()).run();
  const exp = now() + FILM.life; return json({ u: `/api/film/${exp}.${await filmSig(env, f.file, exp)}${k ? '.' + k : ''}` });
}
async function filmPlay(db, env, req, tok) {
  const m = /^(\d{13})\.([0-9a-f]{32})(?:\.([a-z]{2,12}))?$/.exec(tok || ''), f = await filmOf(db, m ? m[3] : ''); if (!f || !env.FILMS || !codeKey(env) || !m || +m[1] < now()) return fail(404, 'none');
  if (!(await same(m[2], await filmSig(env, f.file, m[1])))) return fail(404, 'none');
  const dest = req.headers.get('sec-fetch-dest'), site = req.headers.get('sec-fetch-site'), r = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get('range') || '');
  if ((dest && dest !== 'video') || (site && site !== 'same-origin') || !r || (!r[1] && !r[2])) return fail(403, 'no');
  const head = await env.FILMS.head(f.file); if (!head) return fail(404, 'none');
  const size = head.size; let a = 0, b = size - 1; if (r[1]) { a = +r[1]; if (r[2]) b = Math.min(b, +r[2]); } else a = Math.max(0, size - +r[2]);
  if (a > b || a >= size) return new Response(null, { status: 416, headers: { 'content-range': `bytes */${size}` } });
  b = Math.min(b, a + FILM.piece - 1); const o = await env.FILMS.get(f.file, { range: { offset: a, length: b - a + 1 } }); if (!o) return fail(404, 'none');
  return new Response(o.body, { status: 206, headers: { 'content-type': (head.httpMetadata && head.httpMetadata.contentType) || (/\.webm$/.test(f.file) ? 'video/webm' : 'video/mp4'), 'accept-ranges': 'bytes', 'content-range': `bytes ${a}-${b}/${size}`, 'content-length': String(b - a + 1),
    'cache-control': 'private, no-store', 'content-disposition': 'inline', 'x-content-type-options': 'nosniff', 'cross-origin-resource-policy': 'same-origin', 'x-robots-tag': 'noindex, noarchive' } });
}
/* the islands, for someone looking for one: each printer that is paired, whether it is on, whether a pop-up is open on it, and, while it is
   open, where it is (as the approval page set it down: its address, its place on the map, a few words, a picture) */
async function isles(db) {
  const st = await settingsOf(db); let pl = {}; try { pl = st.isles ? JSON.parse(st.isles) : {}; } catch (e) { pl = {}; }
  const pops = (await popsOf(db)).filter(p => p && p.on);
  const { results } = await db.prepare('SELECT id, name, number, seen, net FROM printers WHERE token IS NOT NULL ORDER BY number, created').all();
  const out = results.filter(p => !(pl[p.id] && pl[p.id].hide)).map(p => { const d = pl[p.id] || {}, open = pops.some(q => q.to === p.id || q.id === p.id || (!q.to && p.id === 'novelglobal')) || d.open === true, o = { id: p.id, name: p.name || p.id, number: p.number || null, on: !!p.seen && now() - p.seen < 2 * 60e3 && !/"p":0\b/.test(p.net || ''), open };
    if (open) { ['addr', 'words', 'pic'].forEach(k => { if (typeof d[k] === 'string' && d[k]) o[k] = d[k]; }); if (Number.isFinite(+d.lat) && Number.isFinite(+d.lng) && (d.lat || d.lng)) { o.lat = +d.lat; o.lng = +d.lng; } }
    return o; });
  return json({ isles: out, paired: results.length });
}

/* ───────── a printer's receiver: it asks for the next job, prints it, and says how it went ───────── */
async function printerAuth(db, req, id, can) {
  const p = await db.prepare('SELECT * FROM printers WHERE id = ?').bind(id).first(); const tok = bearer(req);
  if (!p || !p.token || !tok || !(await same(await sha256(tok), p.token))) return null;
  if (!p.seen || now() - p.seen > 60e3 || (can !== undefined && can !== p.can)) await (can === undefined ? db.prepare('UPDATE printers SET seen = ? WHERE id = ?').bind(now(), id) : db.prepare('UPDATE printers SET seen = ?, can = ? WHERE id = ?').bind(now(), can, id)).run(); return p;
}
async function next(db, env, req, id) {
  const can = (new URL(req.url).searchParams.get('can') || '').slice(0, 40);
  const p = await printerAuth(db, req, id, can); if (!p) return fail(401, 'token');
  const pk = new URL(req.url).searchParams.get('pk') === '1' && codeKey(env) ? await isleKey(env, id) : '';
  const t = now();
  { const pn = netOf(new URL(req.url), req.cf); if (pn) { const o = JSON.parse(pn), was = (() => { try { return JSON.parse(p.net || 'null'); } catch (e) { return null; } })();
      /* moved: it asks from another town or network than before; kept on its line for a week */
      if (was && was.w && o.w && was.w !== o.w) o.moved = { from: was.w, at: o.at }; else if (was && was.moved && o.at - was.moved.at < 7 * DAY) o.moved = was.moved;
      if (!was || was.n !== o.n || was.w !== o.w || was.p !== o.p || was.g !== o.g || was.c !== o.c || Math.abs((was.rssi || 0) - (o.rssi || 0)) > 6 || o.at - was.at > 60e3) await db.prepare('UPDATE printers SET net = ? WHERE id = ?').bind(JSON.stringify(o), id).run(); } }
  /* UPDATE, pressed on the approval page in the last two minutes: the receiver fetches its latest self (only one that says it can) */
  if (p.upd) { await db.prepare('UPDATE printers SET upd = NULL WHERE id = ?').bind(id).run(); if (t - p.upd < 2 * 60e3 && /\bupdate\b/.test(can)) return json({ update: true }); }
  /* CHANGE WI-FI, pressed on the approval page in the last two minutes: the receiver opens its setup Wi-Fi (only one that says it can) */
  if (p.wifi) { await db.prepare('UPDATE printers SET wifi = NULL WHERE id = ?').bind(id).run(); if (t - p.wifi < 2 * 60e3 && /\bwifi\b/.test(can)) return json({ wifi: true }); }
  /* RESTART, pressed in the last two minutes: the Pi turns off and on again by itself (only one that says it can) */
  if (p.rst) { await db.prepare('UPDATE printers SET rst = NULL WHERE id = ?').bind(id).run(); if (t - p.rst < 2 * 60e3 && /\brestart\b/.test(can)) return json({ restart: true }); }
  /* TURN OFF, pressed on the approval page in the last two minutes, comes before any slip. An older one is dropped, so a
     printer moved and switched on days later is never turned off by it; a receiver that cannot turn off is never sent it */
  if (p.off) { await db.prepare('UPDATE printers SET off = NULL WHERE id = ?').bind(id).run(); if (t - p.off < 2 * 60e3 && /\boff\b/.test(can)) return json({ off: true }); }
  /* the oldest job waiting, or one whose printer went quiet while printing it: taken for a minute. Paper always first: a line for the
     mesh alone waits until no print does, since the radio can take most of a minute to answer and a print should never wait on it */
  if (p.touch && (!(await settingsOf(db)).touchOn || !p.touch_seen || t - p.touch_seen > 150e3)) await db.prepare("UPDATE jobs SET status = 'queued' WHERE printer = ? AND status = 'held' AND created < ?").bind(id, t - 20e3).run();
  const j = await db.prepare("SELECT * FROM jobs WHERE printer = ? AND (status = 'queued' OR (status = 'printing' AND lease < ?)) ORDER BY (escpos IS NULL), created LIMIT 1").bind(id, t).first();
  const hint = { 'x-wait': String(waitOf(p, !!j)), 'x-island': String(p.number || ''), ...(pk ? { 'x-pk': pk } : {}) };
  if (!j) return new Response(null, { status: 204, headers: { ...TEXT_H, ...hint } });
  if (j.tries >= 5) { await db.prepare("UPDATE jobs SET status = 'failed', error = 'tried five times', escpos = NULL, done = ? WHERE id = ?").bind(t, j.id).run(); return new Response(null, { status: 204, headers: TEXT_H }); }
  /* a slip with both paper and a mesh line: the line goes on as a job of its own, taken next, so a print that fails never keeps it off the mesh */
  if (j.escpos && j.mesh) { await db.batch([db.prepare("INSERT INTO jobs (id, printer, story, code, mesh, status, created) VALUES (?, ?, ?, ?, ?, 'queued', ?)").bind(rid(), id, j.story, j.code, j.mesh, j.created), db.prepare('UPDATE jobs SET mesh = NULL WHERE id = ?').bind(j.id)]); j.mesh = null; }
  await db.prepare("UPDATE jobs SET status = 'printing', lease = ?, tries = tries + 1 WHERE id = ?").bind(t + 60e3, j.id).run();
  const r = json({ job: j.id, code: j.code, escpos: j.escpos || null, mesh: j.mesh || null }); for (const k in hint) r.headers.set(k, hint[k]); return r;
}
async function usedOff(db, env, req, id) {
  if (!(await printerAuth(db, req, id))) return fail(401, 'token'); const b = await body(req, 8192), day = String(b.day || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Array.isArray(b.codes)) return fail(400, 'used');
  let n = 0; for (const c of b.codes.slice(0, 60)) { const k = passNorm(c); if (PASS.test(k)) { await passUse(db, k.length === 6 ? k.slice(0, 3) + '-' + k.slice(3) : k, day, id); n++; } }
  return json({ ok: true, n });
}
/* ───────── a printer's touch screen: the slips held for it, each shown with the jellyfish; one press prints it, a long press squashes it ───────── */
async function touchAuth(db, req, id) {
  const p = await db.prepare('SELECT * FROM printers WHERE id = ?').bind(id).first(); const tok = bearer(req);
  if (!p || !p.touch || !tok || !(await same(await sha256(tok), p.touch))) return null;
  if (!p.touch_seen || now() - p.touch_seen > 60e3) await db.prepare('UPDATE printers SET touch_seen = ? WHERE id = ?').bind(now(), id).run(); return p;
}
const netOf = (url, cf) => { const n = (url.searchParams.get('net') || '').slice(0, 40), r = +url.searchParams.get('rssi'), ip = url.searchParams.get('ip') || '', w = cf ? [cf.city, cf.region, cf.country, cf.asOrganization].filter(x => typeof x === 'string' && x).join(', ').slice(0, 90) : ''; return n ? JSON.stringify({ n, ...(w ? { w } : {}), rssi: Number.isFinite(r) ? Math.max(-120, Math.min(0, Math.round(r))) : null, ...(/^\d{1,3}(\.\d{1,3}){3}$/.test(ip) ? { ip } : {}), ...(/^[\w .·:-]{1,24}$/.test(url.searchParams.get('v') || '') ? { v: url.searchParams.get('v') } : {}), ...(/^[01]$/.test(url.searchParams.get('prn') || '') ? { p: +url.searchParams.get('prn') } : {}), ...(/^(2\.4|5)$/.test(url.searchParams.get('ghz') || '') ? { g: url.searchParams.get('ghz') } : {}), ...(/^(2\.4|5)$/.test(url.searchParams.get('can') || '') ? { c: url.searchParams.get('can') } : {}), at: now() }) : null; };
async function touchList(db, req, id, env) {
  const p0 = await touchAuth(db, req, id); if (!p0) return fail(401, 'token');
  { const tn = netOf(new URL(req.url)); if (tn) { const o = JSON.parse(tn), was = (() => { try { return JSON.parse(p0.touch_net || 'null'); } catch (e) { return null; } })(); if (!was || was.n !== o.n || Math.abs((was.rssi || 0) - (o.rssi || 0)) > 6 || o.at - was.at > 60e3) await db.prepare('UPDATE printers SET touch_net = ? WHERE id = ?').bind(tn, id).run(); } }
  const { results } = await db.prepare(`SELECT j.id, j.code, j.created, j.escpos IS NOT NULL AS paper, j.thumb, s.body FROM jobs j LEFT JOIN stories s ON s.id = j.story WHERE j.printer = ? AND j.status = 'held' ORDER BY j.created LIMIT 5`).bind(id).all();
  const c = await db.prepare("SELECT sum(status = 'held') AS w, sum(status IN ('queued', 'printing')) AS q FROM jobs WHERE printer = ?").bind(id).first();
  const pw = waysOf(p0), tp0 = (await settingsOf(db)).touchPass, tp = pw ? (pw.includes('touch') ? tp0 || 'show' : '') : tp0; let pass = null;
  if (tp === 'show' && codeKey(env)) { const day = melDay(), key = await isleKey(env, id); await passTable(db);
    for (let n = PASS_SLOTS.screen[0]; n < PASS_SLOTS.screen[1] && !pass; n++) { const c = await pass3(key, day, n); if (!(await db.prepare('SELECT 1 FROM passes WHERE code = ? AND day = ?').bind(id + ':' + c, day).first())) pass = c; } }
  return json({ ...(tp ? { pass: tp === 'show' ? pass : 'type' } : {}), mark: codeKey(env) ? await markOf(env, id) : null, wait: waitOf(p0, !!(c && (c.w || c.q))), waiting: (c && c.w) || 0, printing: (c && c.q) || 0, held: results.map((r, i) => { let b = {}; try { b = JSON.parse(r.body || '{}'); } catch (e) { /* none */ }
    return { job: r.id, code: r.code || '', at: r.created, say: String(b.text || '').slice(0, 140), wish: (Array.isArray(b.wish) ? b.wish : []).map(w => String(w).slice(0, 90)).slice(0, 4), life: b.tx && b.tx.cn ? String(b.tx.cn).slice(0, 40) : '', paper: !!r.paper, ...(i === 0 && r.thumb ? { img: r.thumb } : {}) }; }) });
}
async function touchAct(db, env, req, id, job) {
  if (!(await touchAuth(db, req, id))) return fail(401, 'token');
  const b = await body(req);
  /* the screen's hidden menu: the printer's Pi asked to turn off, as TURN OFF on the approval page does */
  if (job === 'off' && b.action === 'off') { await db.prepare('UPDATE printers SET off = ? WHERE id = ? AND token IS NOT NULL').bind(now(), id).run(); return json({ ok: true }); }
  /* a pass typed on the screen (when the approval page lets it): today's, from this island, once */
  if (job === 'pass' && b.action === 'type') { if ((await settingsOf(db)).touchPass !== 'type') return fail(403, 'off'); const f = await passFind(db, env, String(b.code || ''), id); if (!f) return fail(404, 'not found');
    return (await passUse(db, f.code, f.day, id)) ? json({ ok: true, code: f.code, mark: await markOf(env, id, f.day) }) : fail(409, 'used'); }
  if (b.action === 'print') { await db.batch([db.prepare("UPDATE jobs SET status = 'queued' WHERE id = ? AND printer = ? AND status = 'held'").bind(job, id), db.prepare("UPDATE stories SET status = 'shown', decided = ? WHERE id = (SELECT story FROM jobs WHERE id = ?) AND status = 'waiting'").bind(now(), job), db.prepare('UPDATE printers SET warm = ? WHERE id = ?').bind(now(), id)]); return json({ ok: true }); }
  if (b.action === 'squash') { await db.batch([db.prepare("UPDATE stories SET status = 'refused', decided = ? WHERE id = (SELECT story FROM jobs WHERE id = ?) AND status = 'waiting'").bind(now(), job), db.prepare("DELETE FROM jobs WHERE id = ? AND printer = ? AND status = 'held'").bind(job, id)]); return json({ ok: true }); }
  return fail(400, 'action');
}
async function report(db, req, id, job) {
  if (!(await printerAuth(db, req, id))) return fail(401, 'token');
  const b = await body(req); const ok = b.status === 'printed'; if (!ok && b.status !== 'failed') return fail(400, 'status');
  await db.prepare(`UPDATE jobs SET status = ?, error = ?, done = ?, escpos = NULL, mesh = NULL WHERE id = ? AND printer = ? AND status = 'printing'`).bind(ok ? 'printed' : 'failed', ok ? null : String(b.error || '').slice(0, 200), now(), job, id).run();
  if (ok) await db.prepare('UPDATE makers SET printed = ? WHERE printed IS NULL AND who = (SELECT s.who FROM jobs j JOIN stories s ON s.id = j.story WHERE j.id = ?)').bind(now(), job).run();
  return json({ ok: true });
}

/* ───────── an island pairs without a token typed: it asks for a code, prints it, and asks again until the code is approved on the
   approval page; then it is handed its printer and a token, once. A code lasts a quarter of an hour; only its hash of the island's
   own secret is kept, and no token is kept at all (it is made at the moment it is handed over). The table is made on first use ───────── */
const PAIR_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', PAIR_FOR = 15 * 60e3;
const pairsReady = new WeakMap();
const pairs = db => { if (!pairsReady.has(db)) pairsReady.set(db, db.prepare('CREATE TABLE IF NOT EXISTS pairs (code TEXT PRIMARY KEY, device TEXT NOT NULL, name TEXT, printer TEXT, created INTEGER NOT NULL)').run().then(() => db.prepare('ALTER TABLE pairs ADD COLUMN paper TEXT').run().catch(() => {})).catch(e => { pairsReady.delete(db); throw e; })); return pairsReady.get(db); };
const pairCode = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
async function pairAsk(db, env, req) {
  if (await tooMany(db, env, req, 'pair', 12, H)) return fail(429, 'too many');
  await pairs(db); const b = await body(req, 2048), t = now();
  const a = crypto.getRandomValues(new Uint8Array(8)), code = [...a].map(x => PAIR_ABC[x % 32]).join(''), device = rid(32);
  const name = String(b.name || '').replace(/[^\w .·'&-]/g, '').trim().slice(0, 40), paper = ['58', '80'].includes(String(b.paper)) ? String(b.paper) : null;
  await db.batch([db.prepare('DELETE FROM pairs WHERE created < ?').bind(t - PAIR_FOR), db.prepare('INSERT INTO pairs (code, device, name, paper, created) VALUES (?, ?, ?, ?, ?)').bind(code, await sha256(device), name, paper, t)]);
  return json({ code, device, every: 5, expires: t + PAIR_FOR }, 201);
}
const ISLANDS_MAX = 160;
/* the connections a printer can switch on: each lets one kind of thing from the network work on it, or its own be shared out.
   wish: W.I.S.H. pieces and their codes print here; radio: songs; art: styles, stamps and icons; words: copy; cards: its experiences
   shown and wired on the switchboard; codes: its find-codes open the other islands in the same connections */
const LINKS = ['wish', 'radio', 'art', 'words', 'cards', 'codes'];
const linksOf = v => v === '*' || v == null ? LINKS.slice() : String(v || '').split(',').filter(x => LINKS.includes(x));
const linksIn = a => { const l = LINKS.filter(x => (a || []).includes(x)); return l.length === LINKS.length ? '*' : l.join(','); };
async function newPrinter(db, name, paper, self) {
  const base = String(name || 'island').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'island';
  let id = base; for (let i = 2; await db.prepare('SELECT 1 FROM printers WHERE id = ?').bind(id).first(); i++) id = `${base}-${i}`;
  await db.prepare('INSERT INTO printers (id, name, paper, created, self, links, two) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(id, String(name || id).slice(0, 40), paper || '80', now(), self ? 1 : 0, self ? '' : '*', self ? 0 : 1).run();
  return id;
}
async function pairPoll(db, env, req) {
  await pairs(db); const b = await body(req, 2048); if (typeof b.device !== 'string' || b.device.length > 64) return fail(400, 'device');
  const r = await db.prepare('SELECT * FROM pairs WHERE device = ? AND created > ?').bind(await sha256(b.device), now() - PAIR_FOR).first();
  if (!r) return fail(404, 'gone');
  if (!r.printer) {
    const open = (await settingsOf(db)).openJoin, n = await db.prepare('SELECT count(*) AS n FROM printers').first();
    if (!open || (n && n.n >= ISLANDS_MAX)) return json({ waiting: true, every: 5 }, 202);
    r.printer = await newPrinter(db, r.name || 'island', r.paper, true);
  }
  const tok = rid(32), key = rid(32);
  await db.batch([db.prepare('UPDATE printers SET token = ?, owner = ?, seen = NULL, can = NULL, off = NULL, paper = COALESCE(?, paper) WHERE id = ?').bind(await sha256(tok), await sha256(key), r.paper || null, r.printer), db.prepare('DELETE FROM pairs WHERE code = ?').bind(r.code)]);
  await numberPrinters(db); const p = await db.prepare('SELECT number FROM printers WHERE id = ?').bind(r.printer).first();
  return json({ printer: r.printer, token: tok, key, number: (p && p.number) || null, ...(codeKey(env) ? { pass: await isleKey(env, r.printer) } : {}) });
}
/* ───────── a card's own pictures: the approval page sets novel.global's cards; an island keeper sets their own island's card (its printer's id) ───────── */
const CARD_ID = /^[a-z0-9-]{1,24}$/, PICS = 10, PIC_MAX = 1.6e6;
const picType = b => b[0] === 0xFF && b[1] === 0xD8 ? 'image/jpeg' : b[0] === 0x89 && b[1] === 0x50 ? 'image/png' : b[0] === 0x52 && b[1] === 0x49 && b[8] === 0x57 && b[9] === 0x45 ? 'image/webp' : null;
async function cardSet(db, card, b) {
  const was = (await db.prepare('SELECT speed, shade FROM cardset WHERE card = ?').bind(card).first()) || {};
  const speed = b.speed != null && isFinite(+b.speed) ? Math.max(1, Math.min(60, +b.speed)) : was.speed == null ? null : was.speed;
  const shade = b.shade != null && isFinite(+b.shade) ? Math.max(0, Math.min(1, +b.shade)) : was.shade == null ? null : was.shade;
  await db.prepare('INSERT INTO cardset (card, speed, shade) VALUES (?, ?, ?) ON CONFLICT(card) DO UPDATE SET speed = excluded.speed, shade = excluded.shade').bind(card, speed, shade).run();
  return { ok: true, card, speed, shade };
}
async function cardPut(db, env, req, card, slot) {
  const n = +slot; if (!/^\d$/.test(String(slot)) || n >= PICS) return fail(400, 'slot');
  if (req.method === 'DELETE') { if (env.MEDIA) await env.MEDIA.delete(`card/${card}/${n}`).catch(() => {}); await db.prepare('DELETE FROM cardpics WHERE card = ? AND slot = ?').bind(card, n).run(); return json({ ok: true }); }
  if (!env.MEDIA) return fail(503, 'no media');
  const b = new Uint8Array(await req.arrayBuffer()); if (!b.length || b.length > PIC_MAX) return fail(413, 'too big'); const type = picType(b); if (!type) return fail(415, 'not a picture');
  if ((await r2Bytes(db)) + b.length >= CAP.r2 * 0.8) return fail(507, 'full');
  await env.MEDIA.put(`card/${card}/${n}`, b, { httpMetadata: { contentType: type } });
  await db.prepare('INSERT INTO cardpics (card, slot, type, bytes, at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(card, slot) DO UPDATE SET type = excluded.type, bytes = excluded.bytes, at = excluded.at').bind(card, n, type, b.length, now()).run();
  return json({ ok: true, card, slot: n });
}
async function cardList(db) {
  const { results: pics } = await db.prepare('SELECT card, slot, at FROM cardpics ORDER BY card, slot').all(), { results: set } = await db.prepare('SELECT card, speed, shade FROM cardset').all();
  const out = {}; const of = c => out[c] || (out[c] = { pics: [], speed: null, shade: null });
  for (const r of pics) of(r.card).pics.push(`/api/cards/${r.card}/${r.slot}?v=${r.at}`);
  for (const r of set) { const o = of(r.card); o.speed = r.speed; o.shade = r.shade; }
  return new Response(JSON.stringify({ cards: out }), { headers: { ...JSON_H, 'cache-control': 'public, max-age=60' } });
}
async function cardPic(db, env, card, slot) {
  if (!CARD_ID.test(card) || !/^\d$/.test(slot) || !env.MEDIA) return fail(404, 'not found');
  const o = await env.MEDIA.get(`card/${card}/${slot}`); if (!o) return fail(404, 'not found');
  return new Response(o.body, { headers: { 'content-type': (o.httpMetadata && o.httpMetadata.contentType) || 'image/jpeg', 'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' } });
}
async function keeperPic(db, env, req, slot) {
  if (await tooMany(db, env, req, 'keeper', 60, 10 * 60e3)) return fail(429, 'too many');
  const k = bearer(req); if (!/^[A-Za-z0-9_-]{16,64}$/.test(k)) return fail(401, 'key');
  const p = await db.prepare('SELECT id FROM printers WHERE owner = ?').bind(await sha256(k)).first(); if (!p || p.id === 'novelglobal' || !CARD_ID.test(p.id)) return fail(401, 'key');
  return cardPut(db, env, req, p.id, slot);
}
/* the island keeper's own door: their key opens their one printer's row, never novel.global's, another island's, or any story */
async function keeper(db, env, req) {
  if (await tooMany(db, env, req, 'keeper', 60, 10 * 60e3)) return fail(429, 'too many');
  const k = bearer(req), cols = 'id, name, paper, number, two, links, seen, gap, pack, ways, mods, (SELECT count(*) FROM jobs j WHERE j.printer = printers.id AND j.status IN (\'queued\', \'held\')) AS queued, (SELECT count(*) FROM jobs j WHERE j.printer = printers.id AND j.status = \'printed\') AS printed FROM printers';
  let p = null, mod = null;
  if (/^[A-HJ-NP-Z2-9]{3,6}\.[0-9a-f]{16}$/.test(k)) { const [w, hk] = k.split('.'); if (!codeKey(env) || hk !== await homeKey(env, w)) return fail(401, 'key'); mod = w;
    const want = new URL(req.url).searchParams.get('id') || ''; p = (await db.prepare(`SELECT ${cols} WHERE mods LIKE ? ORDER BY number`).bind('%"' + w + '"%').all()).results.find(x => !want || x.id === want) || null;
  } else { if (!/^[A-Za-z0-9_-]{16,64}$/.test(k)) return fail(401, 'key'); p = await db.prepare(`SELECT ${cols} WHERE owner = ?`).bind(await sha256(k)).first(); }
  if (!p || p.id === 'novelglobal') return fail(401, 'key');
  if (req.method === 'POST') { const b = await body(req, LIMIT.escpos + 4096); if (b.action === 'picks') return islePick(db, p, b); if (b.action) return passDo(db, env, p, b); const name = String(b.name || '').replace(/[^\w .·'&-]/g, '').trim().slice(0, 40); if (name) { await db.prepare('UPDATE printers SET name = ? WHERE id = ?').bind(name, p.id).run(); p.name = name; }
    if (b.speed != null) await cardSet(db, p.id, { speed: b.speed });
    if (Array.isArray(b.links)) { p.links = linksIn(b.links.map(String)); await db.prepare('UPDATE printers SET links = ? WHERE id = ?').bind(p.links, p.id).run(); }
    const su = isleSetup(b, !mod); await isleSet(db, p.id, su); Object.assign(p, su); }
  const cps = (await db.prepare('SELECT slot, at FROM cardpics WHERE card = ? ORDER BY slot').bind(p.id).all()).results, cst = (await db.prepare('SELECT speed FROM cardset WHERE card = ?').bind(p.id).first()) || {};
  return json({ id: p.id, name: p.name, paper: p.paper, number: p.number, two: !!p.two, links: linksOf(p.links), all: LINKS, ...isleOut(p), ...(mod ? { mod: true } : { mods: modsOf(p) }), pics: cps.map(r => ({ slot: r.slot, url: `/api/cards/${p.id}/${r.slot}?v=${r.at}` })), speed: cst.speed == null ? null : cst.speed, mark: codeKey(env) ? await markOf(env, p.id) : null, ready: !!p.seen && now() - p.seen < 120e3, queued: p.queued, printed: p.printed });
}
/* passes made for one island, and its own slips sent straight to it */
async function passDo(db, env, p, b) {
  if (!codeKey(env)) return fail(503, 'passes');
  if (b.action === 'look') return json({ island: p.id, name: p.name || p.id, mark: await markOf(env, p.id) });
  if (b.action === 'passes') { const n = Math.max(1, Math.min(10, Math.round(+b.n || 1)));
    let head = null; if (b.escpos != null) { if (!b64ok(b.escpos, LIMIT.escpos)) return fail(400, 'head'); const h = [...atob(b.escpos)].map(c => c.charCodeAt(0)); if (h[0] !== 0x1B || h[1] !== 0x40) return fail(400, 'head'); head = h.slice(-7).join() === '27,100,4,29,86,66,0' ? h.slice(0, -7) : h; }
    const { q } = await db.prepare("SELECT count(*) AS q FROM jobs WHERE printer = ? AND status IN ('held', 'queued', 'printing')").bind(p.id).first(); if (q + n > LIMIT.perPrinter) return fail(503, 'its queue is full');
    const m = await passMake(db, env, p.id, n), t = now();
    await db.batch([...m.passes.map((c, i) => db.prepare("INSERT INTO jobs (id, printer, code, escpos, status, created) VALUES (?, ?, 'DA-PASS', ?, 'queued', ?)").bind(rid(), p.id, passSlip(p.name || p.id, m.mark, c, head), t + i)), db.prepare('UPDATE printers SET warm = ? WHERE id = ?').bind(t, p.id)]);
    return json({ ok: true, n, island: p.id, name: p.name || p.id, mark: m.mark }); }
  return fail(400, 'action');
}
/* the approval page: a code looked up (from the island's slip, scanned), then approved for a printer here or a new one by the island's name */
async function adminPair(db, req, code) {
  await pairs(db); code = pairCode(code);
  const r = code.length === 8 && await db.prepare('SELECT code, name, paper, printer, created FROM pairs WHERE code = ? AND created > ?').bind(code, now() - PAIR_FOR).first();
  if (!r) return fail(404, 'no such code, or it is older than a quarter of an hour');
  if (req.method === 'GET') return json(r);
  const b = await body(req); let id = String(b.printer || '');
  if (!id) id = await newPrinter(db, b.name || r.name || 'island', r.paper, false); else if (!(await db.prepare('SELECT 1 FROM printers WHERE id = ?').bind(id).first())) return fail(404, 'no such printer');
  await db.prepare('UPDATE pairs SET printer = ? WHERE code = ?').bind(id, code).run();
  return json({ ok: true, printer: id });
}

/* ───────── the approval page: everything waiting, shown, refused; the printers and their tokens ───────── */
async function adminAuth(db, env, req) {
  if (!env.ADMIN_KEY) return fail(503, 'set the ADMIN_KEY secret in Cloudflare first');
  if (await same(bearer(req), env.ADMIN_KEY)) return null;
  if (await tooMany(db, env, req, 'admin', 10, 10 * 60e3)) return fail(429, 'too many');
  return fail(401, 'password');
}
async function admin(db, env, req, parts) {
  const no = await adminAuth(db, env, req); if (no) return no;
  const [what, id] = parts;
  /* the owner marks a code as printed (their own phone, or a maker they know) */
  if (what === 'makers' && !id && req.method === 'POST') { const b = await body(req); if (typeof b.who !== 'string' || !WHO.test(b.who)) return fail(400, 'who'); await makerPrinted(db, b.who); return json({ ok: true }); }
  if (what === 'links' && !id && req.method === 'GET') { await linkTable(db); const { results } = await db.prepare('SELECT who, k, v, at FROM links ORDER BY at DESC LIMIT 500').all(); return json({ links: results }); }
  if (what === 'links' && id && parts[2] && req.method === 'DELETE') { await linkTable(db); await db.prepare('DELETE FROM links WHERE who = ? AND k = ?').bind(id, parts[2]).run(); return json({ ok: true }); }
  if (what === 'cards' && id && CARD_ID.test(id)) { if (parts[2] != null && !parts[3] && (req.method === 'PUT' || req.method === 'DELETE')) return cardPut(db, env, req, id, parts[2]); if (!parts[2] && req.method === 'POST') { const b = await body(req, 1024); return json(await cardSet(db, id, b)); } }
  if (what === 'stories' && !id && req.method === 'GET') {
    const st = ['waiting', 'shown', 'refused', 'deleted'].includes(new URL(req.url).searchParams.get('status')) ? new URL(req.url).searchParams.get('status') : 'waiting';
    const { results } = await db.prepare(`SELECT s.id, s.code, s.kind, s.status, s.body, s.lat, s.lng, s.dest, s.created, s.decided, (s.photo IS NOT NULL OR s.pic IS NOT NULL) AS has_photo, s.full, s.star, s.who, s.gone, s.origin, s.art, s.quiet, s.grp, (SELECT count(*) FROM talk t WHERE t.sec = 'p.' || s.code) AS said,
        (SELECT j.printer || ' ' || j.status || COALESCE(' ' || j.error, '') FROM jobs j WHERE j.story = s.id ORDER BY j.created DESC LIMIT 1) AS jobat,
        (SELECT j.thumb FROM jobs j WHERE j.story = s.id AND j.thumb IS NOT NULL LIMIT 1) AS thumb,
        (SELECT j.status FROM jobs j WHERE j.story = s.id ORDER BY j.created DESC LIMIT 1) AS job FROM stories s WHERE s.status = ? ORDER BY s.created DESC LIMIT 1000`).bind(st).all();
    return json({ stories: results.map(r => ({ ...r, photo: !!r.has_photo, has_photo: undefined })) });
  }
  if (what === 'stories' && id === 'clear' && req.method === 'POST') {   // everything waiting refused at once, its held prints with it
    await db.batch([db.prepare("DELETE FROM jobs WHERE status = 'held' AND story IN (SELECT id FROM stories WHERE status = 'waiting')"), db.prepare("UPDATE stories SET status = 'refused', decided = ? WHERE status = 'waiting'").bind(now())]);
    return json({ ok: true });
  }
  if (what === 'stories' && id && req.method === 'POST') {
    const b = await body(req); const t = now();
    if (b.action === 'show') { await db.batch([db.prepare("UPDATE stories SET status = 'shown', decided = ? WHERE id = ?").bind(t, id), db.prepare("UPDATE jobs SET status = 'queued' WHERE story = ? AND status = 'held'").bind(id), db.prepare('UPDATE printers SET warm = ? WHERE id IN (SELECT printer FROM jobs WHERE story = ?)').bind(t, id)]); return json({ ok: true }); }
    if (b.action === 'refuse') { await db.batch([db.prepare("UPDATE stories SET status = 'refused', decided = ? WHERE id = ?").bind(t, id), db.prepare("DELETE FROM jobs WHERE story = ? AND status IN ('held', 'queued')").bind(id)]); return json({ ok: true }); }
    if (b.action === 'big' || b.action === 'small') { const r = await db.prepare("SELECT body FROM stories WHERE id = ? AND kind = 'play'").bind(id).first(); if (!r) return fail(404, 'not found'); let j = {}; try { j = JSON.parse(r.body) || {}; } catch (e) { return fail(400, 'play'); }
      if (b.action === 'big') j.big = 'yes'; else delete j.big; await db.prepare('UPDATE stories SET body = ? WHERE id = ?').bind(JSON.stringify(j), id).run(); return json({ ok: true, big: j.big || '' }); }
    /* the showcase, curated: a star stands first; a shelf groups it; off keeps its link but out of the showcase */
    const pr = ['star', 'unstar', 'off', 'on', 'shelf'].includes(b.action) ? await db.prepare("SELECT body FROM stories WHERE id = ? AND kind = 'play'").bind(id).first() : null;
    if (!pr && ['off', 'on', 'shelf'].includes(b.action)) return fail(404, 'not found');
    if (pr) { const r = pr; let j = {}; try { j = JSON.parse(r.body) || {}; } catch (e) { return fail(400, 'play'); }
      if (b.action === 'star') j.star = 1; if (b.action === 'unstar') delete j.star; if (b.action === 'off') j.off = 1; if (b.action === 'on') delete j.off;
      if (b.action === 'shelf') { const v = shelfName(b.shelf); if (v) j.shelf = v; else delete j.shelf; }
      await db.prepare('UPDATE stories SET body = ? WHERE id = ?').bind(JSON.stringify(j), id).run(); return json({ ok: true, star: !!j.star, off: !!j.off, shelf: j.shelf || '' }); }
    if (b.action === 'ungone') { await db.prepare('UPDATE stories SET gone = NULL WHERE id = ?').bind(id).run(); return json({ ok: true }); }   // taken down by its maker, put back
    /* its words changed on the approval page (a record's words; a packed story is left as it was sent) */
    if (b.action === 'edit') { const text = typeof b.text === 'string' ? b.text.trim().slice(0, 280) : null; const r = await db.prepare('SELECT kind, body FROM stories WHERE id = ?').bind(id).first(); if (text == null || !r || r.kind === 'story' || r.kind === 'message') return fail(400, 'edit');
      let j = {}; try { j = JSON.parse(r.body) || {}; } catch (e) { return fail(400, 'edit'); } j.text = text; await db.prepare('UPDATE stories SET body = ? WHERE id = ?').bind(JSON.stringify(j), id).run(); return json({ ok: true }); }
    /* a reply from novel.global, said in the piece's own talk */
    if (b.action === 'reply') { const text = typeof b.text === 'string' ? b.text.trim().slice(0, 280) : ''; const r = await db.prepare('SELECT code FROM stories WHERE id = ?').bind(id).first(); if (!text || !r || !r.code) return fail(400, 'reply');
      const tid = rid(); await db.prepare("INSERT INTO talk (id, sec, who, text, re, at, k) VALUES (?, ?, 'NG', ?, NULL, ?, 'ng')").bind(tid, 'p.' + r.code, text, t).run(); return json({ ok: true, id: tid }); }
    /* filed under a portfolio group, or under none */
    if (b.action === 'group') { const g = typeof b.grp === 'string' && b.grp.trim() ? b.grp.trim().slice(0, 40) : null; await db.prepare('UPDATE stories SET grp = ? WHERE id = ?').bind(g, id).run(); return json({ ok: true }); }
    /* a poster's talk closed (nothing more said or read there) or opened again */
    if (b.action === 'quiet' || b.action === 'unquiet') { await db.prepare('UPDATE stories SET quiet = ? WHERE id = ?').bind(b.action === 'quiet' ? now() : null, id).run(); return json({ ok: true }); }
    if (b.action === 'star' || b.action === 'unstar') { await db.prepare('UPDATE stories SET star = ? WHERE id = ?').bind(b.action === 'star' ? 1 : 0, id).run(); return json({ ok: true }); }
    /* deleted is archived: off the site and out of every queue, still here on the approval page, and brought back as waiting */
    if (b.action === 'delete') { await db.batch([db.prepare("DELETE FROM jobs WHERE story = ? AND status IN ('held', 'queued')").bind(id), db.prepare("UPDATE stories SET status = 'deleted', decided = ? WHERE id = ?").bind(t, id)]); return json({ ok: true }); }
    if (b.action === 'restore') { await db.prepare("UPDATE stories SET status = 'waiting', decided = NULL WHERE id = ?").bind(id).run(); return json({ ok: true }); }
    if (b.action === 'purge') { if (env.MEDIA) { await env.MEDIA.delete(mediaKey(id)).catch(() => {}); await env.MEDIA.delete(`art/${id}`).catch(() => {}); await env.MEDIA.delete(photoKey(id)).catch(() => {}); } await db.batch([db.prepare('DELETE FROM jobs WHERE story = ?').bind(id), db.prepare("DELETE FROM stories WHERE id = ? AND status = 'deleted'").bind(id)]); return json({ ok: true }); }
    return fail(400, 'action');
  }
  if (what === 'photos' && id) return photo(db, env, id, true);
  if (what === 'full' && id) { const o = env.MEDIA ? await env.MEDIA.get(mediaKey(id)) : null; if (!o) return fail(404, 'not found'); return new Response(o.body, { headers: { 'content-type': (o.httpMetadata && o.httpMetadata.contentType) || 'image/jpeg', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } }); }
  if (what === 'art' && id && req.method === 'GET') return posterArt(db, env, id, true);
  if (what === 'species' && !id && req.method === 'GET') { const { results } = await db.prepare('SELECT * FROM species ORDER BY first DESC LIMIT 5000').all(); return json({ species: results }); }
  if (what === 'species' && id && req.method === 'POST') { await db.prepare('DELETE FROM species WHERE id = ?').bind(+id || 0).run(); return json({ ok: true }); }
  if (what === 'talk' && !id && req.method === 'GET') { const { results } = await db.prepare('SELECT t.*, m.kin FROM talk t LEFT JOIN makers m ON m.who = t.who ORDER BY t.at DESC LIMIT 300').all(); return json({ talk: results }); }
  if (what === 'talk' && id && req.method === 'POST') { const b = await body(req); if (b.action === 'hide' || b.action === 'show') { await db.prepare('UPDATE talk SET hidden = ? WHERE id = ?').bind(b.action === 'hide' ? now() : null, id).run(); return json({ ok: true }); } if (b.action === 'delete') { await db.prepare('DELETE FROM talk WHERE id = ?').bind(id).run(); return json({ ok: true }); } return fail(400, 'action'); }
  /* one maker: everything they did (what they sent, in every state, and what they said on the board), and deleting them:
     their stories to the archive (still kept, to purge from there), their board posts and their record gone */
  if (what === 'makers' && id && req.method === 'GET') {
    const m = await db.prepare('SELECT * FROM makers WHERE who = ?').bind(id).first(); if (!m) return fail(404, 'not found');
    const { results: st } = await db.prepare("SELECT s.id, s.code, s.kind, s.status, s.body, s.created, s.decided, s.gone, s.origin, (s.photo IS NOT NULL OR s.pic IS NOT NULL) AS has_photo, (SELECT j.thumb FROM jobs j WHERE j.story = s.id AND j.thumb IS NOT NULL LIMIT 1) AS thumb FROM stories s WHERE s.who = ? ORDER BY s.created DESC LIMIT 500").bind(id).all();
    const { results: tk } = await db.prepare('SELECT id, sec, text, re, at, hidden FROM talk WHERE who = ? ORDER BY at DESC LIMIT 500').bind(id).all();
    return json({ maker: m, stories: st.map(r => ({ ...r, photo: !!r.has_photo, has_photo: undefined })), talk: tk });
  }
  if (what === 'makers' && id && req.method === 'POST') { const b = await body(req); if (b.action !== 'delete') return fail(400, 'action');
    await db.batch([db.prepare("DELETE FROM jobs WHERE status IN ('held', 'queued') AND story IN (SELECT id FROM stories WHERE who = ?)").bind(id), db.prepare("UPDATE stories SET status = 'deleted', decided = ? WHERE who = ? AND status != 'deleted'").bind(now(), id), db.prepare('DELETE FROM talk WHERE who = ?').bind(id), db.prepare('DELETE FROM makers WHERE who = ?').bind(id)]);
    return json({ ok: true }); }
  if (what === 'makers' && !id && req.method === 'GET') { const { results } = await db.prepare(`SELECT m.who, m.first, m.last, m.posts, m.stage, m.kin, m.lv, (SELECT count(*) FROM talk t WHERE t.who = m.who) AS said, (SELECT count(*) FROM stories s WHERE s.who = m.who AND s.status = 'shown' AND s.gone IS NULL) AS shown, (SELECT count(*) FROM stories s WHERE s.who = m.who AND s.gone IS NOT NULL) AS gone FROM makers m ORDER BY m.last DESC LIMIT 500`).all(); return json({ makers: results }); }
  /* the portfolio's posts: every one, drafts too; one to edit; saved; deleted */
  if (what === 'posts' && !id && req.method === 'GET') { const { results } = await db.prepare(`SELECT ${POST_COLS} FROM posts ORDER BY day DESC, created DESC LIMIT 500`).all(); return json({ posts: results.map(postOut) }); }
  if (what === 'posts' && !id && req.method === 'POST') return savePost(db, env, req);
  if (what === 'posts' && id && parts[2] === 'cover') return postCover(db, env, id, true);
  if (what === 'posts' && id && req.method === 'GET') return onePost(db, id, true);
  if (what === 'posts' && id && req.method === 'POST') { const b = await body(req); if (b.action !== 'delete') return fail(400, 'action'); await db.prepare("UPDATE posts SET status = 'deleted', updated = ? WHERE id = ?").bind(now(), id).run(); return json({ ok: true }); }
  if (what === 'settings' && req.method === 'POST') { const b = await body(req); const put = (k, v) => db.prepare('INSERT INTO settings (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v').bind(k, v).run();
    for (const k of Object.keys(SETTINGS)) if (typeof b[k] === 'boolean') await put(k, b[k] ? '1' : '0');
    for (const k in CHOICES) if (b[k] !== undefined && CHOICES[k].some(x => String(x) === String(b[k]))) await put(k, String(b[k]));
    for (const [k, max] of Object.entries(TEXTS)) if (typeof b[k] === 'string') await put(k, b[k].replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '').slice(0, max));
    return json(await settingsOf(db)); }
  if (what === 'settings' && req.method === 'GET') return json(await settingsOf(db));
  if (what === 'places' && id === 'import' && req.method === 'POST') return importPlaces(db, req);
  if (what === 'places') return adminPlaces(db, req, id);
  /* the counts read here include this copy's, not yet added */
  if ((what === 'overview' || what === 'traffic') && req.method === 'GET') await settle(env, null, true);
  if (what === 'overview' && req.method === 'GET') { await movePhotos(db, env).catch(() => 0); return overview(db); }
  if (what === 'traffic' && req.method === 'GET') { const { results } = await db.prepare('SELECT day, k, n FROM traffic WHERE day >= ? ORDER BY day DESC, k').bind(new Date(now() - 60 * DAY).toISOString().slice(0, 10)).all(); return json({ traffic: results }); }
  if (what === 'export' && req.method === 'GET') return exportAll(db);
  if (what === 'restore' && req.method === 'POST') return restoreAll(db, req);
  if (what === 'reset' && req.method === 'POST') return resetSite(db, env, req);
  if (what === 'pair' && id && (req.method === 'GET' || req.method === 'POST')) return adminPair(db, req, id);
  if (what === 'film' && !id && req.method === 'GET') { const f = await filmOf(db); return json({ today: await filmToday(db), bucket: !!env.FILMS, found: !!(f && env.FILMS && await env.FILMS.head(f.file)) }); }
  if (what === 'printers' && !id) {
    const { results } = await db.prepare(`SELECT p.id, p.name, p.number, p.paper, p.mesh, p.auto, p.live, p.two, p.links, p.self, p.token IS NOT NULL AS paired, p.touch IS NOT NULL AS touch, p.touch_seen, p.refused, p.seen, p.can, p.off, p.rst, p.net, p.touch_net, p.wifi, p.upd, p.gap, p.pack, p.ways, p.mods,
        (SELECT count(*) FROM jobs j WHERE j.printer = p.id AND j.status = 'printed' AND j.done > (strftime('%s', 'now') - 86400) * 1000) AS day,
        (SELECT json_object('code', j.code, 'status', j.status, 'at', j.created, 'error', j.error, 'mesh', j.mesh IS NOT NULL, 'paper', j.escpos IS NOT NULL) FROM jobs j WHERE j.printer = p.id ORDER BY j.created DESC LIMIT 1) AS last,
        (SELECT count(*) FROM jobs j WHERE j.printer = p.id AND j.status = 'held') AS held,
        (SELECT count(*) FROM jobs j WHERE j.printer = p.id AND j.status IN ('queued', 'printing')) AS queued,
        (SELECT count(*) FROM jobs j WHERE j.printer = p.id AND j.status = 'printed') AS printed,
        (SELECT count(*) FROM jobs j WHERE j.printer = p.id AND j.status = 'failed') AS failed FROM printers p ORDER BY p.created`).all();
    return json({ printers: results.map(p => ({ ...p, pack: p.pack || 'full', ways: waysOf(p), mods: modsOf(p) })), packs: Object.keys(PACKS), allWays: WAYS, gaps: CHOICES.printGap });
  }
  if (what === 'printers' && id && req.method === 'POST') {
    const b = await body(req); const p = await db.prepare('SELECT id FROM printers WHERE id = ?').bind(id).first(); if (!p) return fail(404, 'not found');
    /* a printer's token is shown once, here, and kept only as a hash */
    if (b.action === 'token') { const tok = rid(32); await db.prepare('UPDATE printers SET token = ? WHERE id = ?').bind(await sha256(tok), id).run(); await numberPrinters(db); return json({ token: tok }); }
    if (b.action === 'number') { const n = +b.number; if (!Number.isInteger(n) || n < 2 || id === 'novelglobal') return fail(400, 'number');
      if (await db.prepare('SELECT 1 FROM printers WHERE number = ? AND id != ?').bind(n, id).first()) return fail(409, 'that number is taken');
      await db.prepare('UPDATE printers SET number = ? WHERE id = ?').bind(n, id).run(); return json({ ok: true, number: n }); }
    /* the touch screen's own token, shown once; a printer with one holds every slip for its screen */
    if (b.action === 'touch') { if (!b.on) { await db.prepare('UPDATE printers SET touch = NULL WHERE id = ?').bind(id).run(); return json({ ok: true }); } const tok = rid(24); await db.prepare('UPDATE printers SET touch = ?, auto = 0 WHERE id = ?').bind(await sha256(tok), id).run(); return json({ token: tok }); }
    if (b.action === 'setup') { await isleSet(db, id, isleSetup(b, true)); const q = await db.prepare('SELECT gap, pack, ways, mods FROM printers WHERE id = ?').bind(id).first(); return q ? json({ ...isleOut(q), mods: modsOf(q) }) : fail(404, 'not found'); }
    if (b.action === 'unpair') { await db.prepare('UPDATE printers SET token = NULL, seen = NULL, can = NULL, off = NULL WHERE id = ?').bind(id).run(); return json({ ok: true }); }
    /* TURN OFF: the receiver is handed it the next time it asks, if that is within two minutes */
    if (b.action === 'wifi') { await db.prepare('UPDATE printers SET wifi = ? WHERE id = ? AND token IS NOT NULL').bind(now(), id).run(); return json({ ok: true }); }
    if (b.action === 'update') { await db.prepare('UPDATE printers SET upd = ? WHERE id = ? AND token IS NOT NULL').bind(now(), id).run(); return json({ ok: true }); }
    if (b.action === 'restart') { await db.prepare('UPDATE printers SET rst = ? WHERE id = ? AND token IS NOT NULL').bind(now(), id).run(); return json({ ok: true }); }
    if (b.action === 'off') { await db.prepare('UPDATE printers SET off = ? WHERE id = ? AND token IS NOT NULL').bind(now(), id).run(); return json({ ok: true }); }
    if (b.action === 'links' && Array.isArray(b.links)) { await db.prepare('UPDATE printers SET links = ? WHERE id = ?').bind(linksIn(b.links.map(String)), id).run(); return json({ ok: true }); }
    if (b.action === 'auto' || b.action === 'mesh' || b.action === 'live' || b.action === 'two') { await db.prepare(`UPDATE printers SET ${b.action} = ? WHERE id = ?`).bind(b.on ? 1 : 0, id).run(); return json({ ok: true }); }
    /* its name, said everywhere it is shown (the site shows its first word); its id, and so every link and token, stays as it is */
    if (b.action === 'name') { const n = String(b.name || '').replace(/\s+/g, ' ').trim().slice(0, 40); if (!n) return fail(400, 'name'); await db.prepare('UPDATE printers SET name = ? WHERE id = ?').bind(n, id).run(); return json({ ok: true, name: n }); }
    if (b.action === 'paper' && ['58', '80'].includes(String(b.paper))) { await db.prepare('UPDATE printers SET paper = ? WHERE id = ?').bind(String(b.paper), id).run(); return json({ ok: true }); }
    /* the calibration strip, drawn on the approval page as the printer's own dots */
    if (b.action === 'passes' || b.action === 'look') return passDo(db, env, { id, name: (await db.prepare('SELECT name FROM printers WHERE id = ?').bind(id).first() || {}).name }, b);
    if (b.action === 'strip') { if (!b64ok(b.escpos, LIMIT.escpos)) return fail(400, 'strip'); await db.batch([db.prepare("INSERT INTO jobs (id, printer, code, escpos, status, created) VALUES (?, ?, 'DA-STRIP', ?, 'queued', ?)").bind(rid(), id, b.escpos, now()), db.prepare('UPDATE printers SET warm = ? WHERE id = ?').bind(now(), id)]); return json({ ok: true }); }
    if (b.action === 'test') { await db.batch([db.prepare("INSERT INTO jobs (id, printer, code, mesh, status, created) VALUES (?, ?, 'DA-TEST', ?, 'queued', ?)").bind(rid(), id, 'DIRECT ACTION - test print', now()), db.prepare('UPDATE printers SET warm = ? WHERE id = ?').bind(now(), id)]); return json({ ok: true }); }
    return fail(400, 'action');
  }
  return fail(404, 'not found');
}

/* ───────── a photograph passed through, so the page may read its pixels: to dither it for a slip, a PNG or a printer.
   iNaturalist's photographs only; kept a day at the edge ───────── */
const IMG_HOSTS = ['inaturalist-open-data.s3.amazonaws.com', 'static.inaturalist.org'];
async function imgThrough(url) {
  let t; try { t = new URL(url.searchParams.get('u') || ''); } catch (e) { return fail(400, 'u'); }
  if (t.protocol !== 'https:' || !IMG_HOSTS.includes(t.hostname) || !t.pathname.startsWith('/photos/')) return fail(400, 'u');
  const r = await fetch(t.toString(), { cf: { cacheEverything: true, cacheTtl: 86400 } }); const type = r.headers.get('content-type') || '';
  if (!r.ok || !type.startsWith('image/') || +(r.headers.get('content-length') || 0) > 8e6) return fail(502, 'img');
  return new Response(r.body, { headers: { 'content-type': type, 'cache-control': 'public, max-age=86400', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' } });
}

/* a sound from iNaturalist passed through the same way, so the radio can lay an album's track onto a recording */
async function sndThrough(url) {
  let t; try { t = new URL(url.searchParams.get('u') || ''); } catch (e) { return fail(400, 'u'); }
  if (t.protocol !== 'https:' || !IMG_HOSTS.includes(t.hostname) || !t.pathname.startsWith('/sounds/')) return fail(400, 'u');
  const r = await fetch(t.toString(), { cf: { cacheEverything: true, cacheTtl: 604800 } }); const type = r.headers.get('content-type') || '';
  if (!r.ok || !/^(audio\/|video\/mp4)/.test(type) || +(r.headers.get('content-length') || 0) > 16e6) return fail(502, 'snd');
  return new Response(r.body, { headers: { 'content-type': type, 'cache-control': 'public, max-age=604800', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' } });
}

/* ───────── live data through novel.global (stage 4): iNaturalist and OpenStreetMap are asked here, once for everyone, and never by
   a visitor's browser. What comes back is kept: iNaturalist's answers at the edge for minutes (sightings) to a week (names), and
   OpenStreetMap's a tile at a time in the database for two weeks (places) or a month (water). A failure is never kept ───────── */
const UA = { 'user-agent': 'novel.global (https://novel.global)', accept: 'application/json' };
/* the iNaturalist routes the site uses, and how long each answer is good for, in seconds */
const INAT_PATHS = [[/^observations$/, 180], [/^observations\/histogram$/, 86400], [/^observations\/\d{1,12}$/, 3600], [/^taxa$/, 604800], [/^taxa\/\d{1,10}$/, 604800]];
let inatRest = 0;   // while iNaturalist turns novel.global away: answered at once, so the browser goes round
async function inatThrough(url) {
  const path = url.pathname.slice('/api/inat/'.length), rule = INAT_PATHS.find(r => r[0].test(path));
  if (!rule || url.search.length > 2000) return fail(400, 'inat');
  if (Date.now() < inatRest) return fail(429, 'inat');
  let r; try { r = await fetch(`https://api.inaturalist.org/v1/${path}${url.search}`, { headers: UA, cf: { cacheEverything: true, cacheTtlByStatus: { '200-299': rule[1], '300-599': 0 } } }); } catch (e) { return fail(502, 'inat'); }
  if (!r.ok) { if (r.status === 429 || r.status === 403) inatRest = Date.now() + 60e3; return fail(r.status === 429 ? 429 : 502, 'inat'); }
  return new Response(r.body, { headers: { ...JSON_H, 'cache-control': `public, max-age=${Math.min(rule[1], 300)}` } });
}
/* weather cart feed, kept an hour */
const WX_D = 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,uv_index_max';
const WXC = new Map();
async function wxThrough(url) {
  const pair = k => { const a = (url.searchParams.get(k) || '').split(',').map(Number); return a.length === 2 && a.every(Number.isFinite) && Math.abs(a[0]) <= 90 && Math.abs(a[1]) <= 180 ? a.map(v => v.toFixed(2)) : null; };
  const at = pair('at'), sea = pair('sea'); if (!at || (url.searchParams.has('sea') && !sea)) return fail(400, 'at');
  const key = at + '|' + sea, hit = WXC.get(key); if (hit && Date.now() - hit.t < 3600e3) return new Response(hit.s, { headers: { ...JSON_H, 'cache-control': 'public, max-age=1800' } });
  const get = u => fetch(u, { headers: UA, cf: { cacheEverything: true, cacheTtlByStatus: { '200-299': 3600, '300-599': 0 } } }).then(r => (r.ok ? r.json() : null)).catch(() => null);
  const [f, m] = await Promise.all([get(`https://api.open-meteo.com/v1/forecast?latitude=${at[0]}&longitude=${at[1]}&daily=${WX_D}&timezone=auto&forecast_days=7`),
    sea ? get(`https://marine-api.open-meteo.com/v1/marine?latitude=${sea[0]}&longitude=${sea[1]}&hourly=sea_level_height_msl&timezone=auto&forecast_days=7`) : null]);
  if (!f || !f.daily) return hit ? new Response(hit.s, { headers: { ...JSON_H, 'cache-control': 'no-store' } }) : fail(502, 'wx');
  const s = JSON.stringify({ daily: f.daily, tide: m && m.hourly && Array.isArray(m.hourly.sea_level_height_msl) && m.hourly.sea_level_height_msl.every(Number.isFinite) ? m.hourly.sea_level_height_msl : null });
  if (WXC.size > 200) WXC.clear(); WXC.set(key, { t: Date.now(), s });
  return new Response(s, { headers: { ...JSON_H, 'cache-control': 'public, max-age=1800' } });
}
/* news cart feed: Wikipedia's In the news and On this day, kept an hour */
const NEWS = { t: 0, s: '' };
const plain = h => String(h || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n === 160 ? 32 : +n)).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const ECO = /\b(climate|ecolog\w*|environment\w*|species|wildlife|animals?|biodivers\w*|extinct\w*|conservation\w*|deforest\w*|forests?|coral|reefs?|oceans?|marine|whales?|dolphins?|sharks?|birds?|insects?|bees|turtles?|elephants?|tigers?|wolf|wolves|koalas?|habitats?|national parks?|emissions?|carbon|fossil fuels?|droughts?|wildfires?|bushfires?|heatwaves?|glaciers?|ice sheets?|pollution|endangered|livestock|pesticides?)\b/i;
async function ceDay(d) {
  try { const r = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=Portal:Current_events/${d.getUTCFullYear()}_${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][d.getUTCMonth()]}_${d.getUTCDate()}&prop=text&format=json&formatversion=2`, { headers: UA, cf: { cacheEverything: true, cacheTtlByStatus: { '200-299': 3600, '300-599': 0 } } });
    if (!r.ok) return []; const h = String(((await r.json()).parse || {}).text || ''), b = h.slice(Math.max(0, h.indexOf('current-events-content'))), out = [];
    for (const m of b.matchAll(/<li>((?:(?!<li>|<ul>|<\/li>)[\s\S])*?)<\/li>/g)) { const t = plain(m[1]).replace(/[\u200b-\u200d]/g, '').replace(/(\s*\([^()]*\))+\s*$/, '').trim(); if (t.length > 40 && t.length < 400) out.push(t); }
    return out; } catch (e) { return []; }
}
async function moreNews(day, news) {
  const a = day.split('-').map(Number), d0 = Date.UTC(a[0], a[1] - 1, a[2]), seen = new Set(news.map(s => s.slice(0, 40)));
  let pool = []; for (let i = 0; i < 3 && pool.length < 12; i++) pool = pool.concat(await ceDay(new Date(d0 - i * 864e5)));
  pool = pool.filter(s => { const k = s.slice(0, 40); if (seen.has(k)) return false; seen.add(k); return true; });
  const more = pool.slice(0, 5);
  if (![...news, ...more].some(s => ECO.test(s))) { let eco = pool.find(s => ECO.test(s)); for (let i = 2; !eco && i < 5; i++) eco = (await ceDay(new Date(d0 - i * 864e5))).find(s => ECO.test(s)); if (eco) more.splice(Math.min(4, more.length), 1, eco); }
  return more.map(s => s.slice(0, 320));
}
async function newsThrough() {
  if (NEWS.s && Date.now() - NEWS.t < 3600e3) return new Response(NEWS.s, { headers: { ...JSON_H, 'cache-control': 'public, max-age=1800' } });
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Melbourne' }).format(new Date());
  let j = null; try { const r = await fetch(`https://api.wikimedia.org/feed/v1/wikipedia/en/featured/${day.replace(/-/g, '/')}`, { headers: UA, cf: { cacheEverything: true, cacheTtlByStatus: { '200-299': 3600, '300-599': 0 } } }); if (r.ok) j = await r.json(); } catch (e) { /* none */ }
  if (!j) return NEWS.s ? new Response(NEWS.s, { headers: { ...JSON_H, 'cache-control': 'no-store' } }) : fail(502, 'news');
  /* the day's own events lead (In the news keeps its stories for a week or more); In the news follows */
  const itn = (j.news || []).slice(0, 5).map(n => plain(n.story).slice(0, 320)).filter(Boolean), fresh = await moreNews(day, []);
  const fk = new Set(fresh.map(s => s.slice(0, 40))), news = fresh.length ? fresh : itn, more = fresh.length ? itn.filter(s => !fk.has(s.slice(0, 40))) : [];
  NEWS.s = JSON.stringify({ day, news, more,
    otd: (j.onthisday || []).slice(0, 3).map(o => ({ y: +o.year || 0, t: plain(o.text).slice(0, 240) })).filter(o => o.t) }); NEWS.t = Date.now();
  return new Response(NEWS.s, { headers: { ...JSON_H, 'cache-control': 'public, max-age=1800' } });
}
/* book cart feed: one public-domain book, a page at a time */
/* twenty public-domain books, a page a print; always opens on page 1 */
const BOOKS = [
  [4341, 'Mutual Aid', 'Peter Kropotkin', 1902, 'Evolution read as cooperation: ants, birds, villages and guilds that last by helping each other. A field guide for anyone building a commons.', '^INTRODUCTION$'],
  [23428, 'The Conquest of Bread', 'Peter Kropotkin', 1892, 'A working plan for a city that feeds, houses and warms everyone first. Read it for the arithmetic of enough.', '^THE CONQUEST OF BREAD$'],
  [3261, 'News from Nowhere', 'William Morris', 1890, 'A man wakes in a future London of gardens, craft and no money. Work turns to pleasure and the Thames runs clean.', '^CHAPTER I: DISCUSSION'],
  [32, 'Herland', 'Charlotte Perkins Gilman', 1915, 'Three explorers find a country of women who have run it well for two thousand years. A sharp, funny audit of what passes for normal.', '^CHAPTER 1\\.'],
  [18247, 'The Last Man', 'Mary Shelley', 1826, 'A plague empties the world one city at a time. Shelley on grief, politics and who is left to remember.'],
  [21970, 'The Scarlet Plague', 'Jack London', 1912, 'Sixty years after the sickness, an old man tells boys on a wild coast what the cities were. Short, bleak and clear.'],
  [1906, 'Erewhon', 'Samuel Butler', 1872, 'A country that jails the sick, nurses the criminal and once smashed its machines in case they evolved. The Book of the Machines still reads as news.', '^CHAPTER I\\. WASTE LANDS$'],
  [10002, 'The House on the Borderland', 'William Hope Hodgson', 1908, 'A recluse\u2019s journal from a house at the edge of time. He watches the sun die from his study chair.', '^THE FINDING OF THE MANUSCRIPT$'],
  [8492, 'The King in Yellow', 'Robert W. Chambers', 1895, 'Stories around a play that unmakes whoever reads it. Art as contagion; the first four are the ones to keep.'],
  [769, 'The Book of Tea', 'Kakuzo Okakura', 1906, 'A small case for the imperfect, made through a cup of tea. On rooms, flowers and living lightly.', '^I\\. The Cup of Humanity'],
  [216, 'Tao Teh King', 'Laozi, tr. James Legge', 1891, 'Eighty-one short chapters on yielding, emptiness and the strength of water. Small enough to carry, deep enough to keep returning to.', '^Ch\\. 1\\.'],
  [59709, 'Chuang Tzu', 'Zhuangzi, tr. Herbert Giles', 1889, 'A butterfly dream, a useless tree that lives long, a cook whose knife never dulls. Philosophy told as jokes and parables.'],
  [1017, 'The Soul of Man under Socialism', 'Oscar Wilde', 1891, 'Wilde argues for socialism so that everyone can become an individual. Machines take the dull work; people make art.', '^THE chief advantage'],
  [833, 'The Theory of the Leisure Class', 'Thorstein Veblen', 1899, 'Where conspicuous consumption was named. A dry, exact anatomy of status, waste and display.', '^Chapter One'],
  [1022, 'Walking', 'Henry David Thoreau', 1862, 'An essay on sauntering toward the wild. The line about wildness preserving the world begins here.', '^I wish to speak'],
  [201, 'Flatland', 'Edwin A. Abbott', 1884, 'A square in a flat world is shown a third dimension. A satire of rank and a lesson in seeing past your own plane.', '^PART I\\b'],
  [408, 'The Souls of Black Folk', 'W. E. B. Du Bois', 1903, 'Essays that named double consciousness and the colour line. History, sociology and song in one book.', '^The Forethought$'],
  [1408, 'The Natural History of Selborne', 'Gilbert White', 1789, 'Letters from a parish naturalist who watched swifts, tortoises and earthworms for decades. The root text of attending to one place.', '^LETTERS to THOMAS PENNANT'],
  [36541, 'Unto This Last', 'John Ruskin', 1862, 'Four essays against an economics of pure profit. There is no wealth but life.', '^UNTO THIS LAST:$'],
  [11438, 'The Willows', 'Algernon Blackwood', 1907, 'Two men canoe the Danube into a marsh where the land itself seems to watch. Nature as presence, past the edge of the known.', '^I\\.$']
];
/* three shelves: made up, true, and how to get by */
BOOKS.push(
  [34607, 'Woodcraft and Camping', 'George Washington Sears', 1884, 'Nessmuk, a small man in a light canoe, on travelling light, cooking simply and sleeping dry.', ''],
  [29558, 'Boy Scouts Handbook', 'Boy Scouts of America', 1911, 'Knots, fires, first aid, tracking, and finding north without a compass.', ''],
  [28255, 'Shelters, Shacks and Shanties', 'Daniel Carter Beard', 1914, 'A roof from what is to hand: lean-tos, bark huts and log cabins, drawn step by step.', ''],
  [44215, 'The Book of Camp-Lore and Woodcraft', 'Daniel Carter Beard', 1920, 'Fires for every weather, packs, camp tools and the old knots.', ''],
  [54138, 'Camp Cookery', 'Maria Parloa', 1878, 'Bread, fish and stews over a fire, and what to pack, from a teacher of cooking.', ''],
  [48929, 'Backwoods Surgery & Medicine', 'Charles Stuart Moody', 1910, 'Care far from a doctor, as it was done in 1910. Read it as history.', '']);
const SHELF = { fic: [3261, 32, 18247, 21970, 1906, 10002, 8492, 201, 11438], how: [34607, 29558, 28255, 44215, 54138, 48929] };
const shelfOf = s => s === 'fic' || s === 'how' ? BOOKS.filter(b => SHELF[s].includes(b[0])) : s === 'non' ? BOOKS.filter(b => !SHELF.fic.includes(b[0]) && !SHELF.how.includes(b[0])) : BOOKS;
const BOOKP = new Map();
async function bookPages(bk) {
  if (BOOKP.has(bk[0])) return BOOKP.get(bk[0]);
  let t = ''; try { const r = await fetch(`https://www.gutenberg.org/cache/epub/${bk[0]}/pg${bk[0]}.txt`, { headers: UA, cf: { cacheEverything: true, cacheTtlByStatus: { '200-299': 30 * 86400, '300-599': 0 } } }); if (r.ok) t = await r.text(); } catch {}
  const a = t.indexOf('*** START'), b = t.indexOf('*** END'); if (a < 0 || b < 0) return null;
  const body = t.slice(t.indexOf('\n', a) + 1, b).replace(/\r/g, '').replace(/^Produced by.*$/m, '');
  const paras = body.split(/\n\s*\n/).map(p => p.replace(/\s+/g, ' ').replace(/_/g, '').replace(/--/g, '\u2014').trim()).filter(p => p && !/^\[Illustration/.test(p));
  let s = bk[5] ? paras.findIndex(p => new RegExp(bk[5]).test(p)) : -1;
  if (s < 0) { s = paras.findIndex(p => p.length >= 300); if (s < 0) s = 0; let k = 0; while (s > 0 && k < 2 && paras[s - 1].length < 70) { s--; k++; } }
  paras.splice(0, s);
  const pages = []; let cur = '';
  const add = x => { if (cur && cur.length + x.length > 4800) { pages.push(cur); cur = ''; } cur = cur ? cur + '\n\n' + x : x; };
  paras.forEach(p => { if (p.length <= 4800) return add(p); let bit = ''; p.split(/(?<=[.;:!?])\s+/).forEach(x => { if (bit && bit.length + x.length > 4000) { add(bit); bit = ''; } bit = bit ? bit + ' ' + x : x; }); if (bit) add(bit); });
  if (cur) pages.push(cur); if (pages.length) BOOKP.set(bk[0], pages); return pages;
}
async function bookThrough(url) {
  const q = url.searchParams, L = shelfOf(q.get('s')), bi = Math.max(1, Math.min(L.length, Math.round(+q.get('b') || 1))), bk = L[bi - 1];
  const pages = await bookPages(bk); if (!pages || !pages.length) return fail(502, 'book');
  const n = pages.length, p0 = Math.max(1, Math.min(1e6, Math.round(+q.get('p') || 1))), p = ((p0 - 1) % n) + 1;
  return json({ b: bi, books: L.length, all: L.map(x => x[1] + ' · ' + x[2]), title: bk[1], author: bk[2], year: bk[3], review: p === 1 ? bk[4] : '', p, of: n, text: pages[p - 1] });
}
/* the two things asked of OpenStreetMap: the places with a name (as the radar's knots), and the water. Built here from a box of
   whole tiles, so nothing else can be asked through novel.global */
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const OSM_Q = {
  places: { tile: 0.01, most: 8, keep: 14 * DAY, q: bb => `[out:json][timeout:25];(nwr["shop"]["name"](${bb});nwr["amenity"~"^(cafe|restaurant|fast_food|bar|pub|ice_cream|food_court|biergarten|fuel|car_wash|car_rental|pharmacy|bank|veterinary|marketplace|nightclub|theatre|arts_centre|music_venue|cinema|community_centre|events_venue|library|social_centre|townhall|coworking_space|studio)$"]["name"](${bb});nwr["craft"]["name"](${bb});nwr["office"]["name"](${bb});nwr["leisure"~"^(hackerspace|swimming_pool|sports_centre|garden)$"]["name"](${bb});nwr["tourism"~"^(gallery|museum)$"]["name"](${bb}););out center tags qt;` },
  water: { tile: 0.05, most: 1, keep: 30 * DAY, q: bb => `[out:json][timeout:25];(way["waterway"~"^(river|stream|canal)$"](${bb});way["natural"="water"](${bb});way["waterway"="riverbank"](${bb});relation["natural"="water"](${bb}););out geom(${bb}) qt;` },
};
const osmOut = elements => new Response(JSON.stringify({ elements }), { headers: { ...JSON_H, 'cache-control': 'public, max-age=3600' } });
async function osmThrough(db, env, req, url) {
  const kind = url.searchParams.get('q'), K = OSM_Q[kind], bb = (url.searchParams.get('bb') || '').split(',').map(Number);
  if (!K || bb.length !== 4 || !bb.every(Number.isFinite)) return fail(400, 'bb');
  const ix = bb.map(v => Math.round(v / K.tile)); if (bb.some((v, i) => Math.abs(v / K.tile - ix[i]) > 1e-6)) return fail(400, 'bb');
  const [i0, j0, i1, j1] = ix; if (i1 <= i0 || j1 <= j0 || i1 - i0 > K.most || j1 - j0 > K.most || Math.abs(bb[0]) > 90 || Math.abs(bb[2]) > 90 || Math.abs(bb[1]) > 180 || Math.abs(bb[3]) > 180) return fail(400, 'bb');
  const keyOf = (i, j) => `${kind}:${i},${j}`, keys = []; for (let i = i0; i < i1; i++) for (let j = j0; j < j1; j++) keys.push(keyOf(i, j));
  const { results } = await db.prepare(`SELECT k, body, at FROM osm WHERE k IN (${keys.map(() => '?').join(',')})`).bind(...keys).all();
  const have = new Map(results.map(r => [r.k, r])), t = now(), stale = keys.filter(k => !have.has(k) || t - have.get(k).at > K.keep);
  const all = () => keys.flatMap(k => (have.has(k) ? JSON.parse(have.get(k).body) : []));
  if (!stale.length) return osmOut(all());
  /* asked of Overpass only for the tiles missing, at most so often from one place; meanwhile what is kept, even if old, still serves */
  if (await tooMany(db, env, req, 'osm', 40, 10 * 60e3)) return have.size ? osmOut(all()) : fail(429, 'osm');
  const sq = stale.map(k => k.split(':')[1].split(',').map(Number)), box = [Math.min(...sq.map(q => q[0])), Math.min(...sq.map(q => q[1])), Math.max(...sq.map(q => q[0])) + 1, Math.max(...sq.map(q => q[1])) + 1].map(v => (v * K.tile).toFixed(4)).join(',');
  for (const u of OVERPASS) {
    let j; try { const r = await fetch(`${u}?data=${encodeURIComponent(K.q(box))}`, { headers: UA, signal: AbortSignal.timeout(20000) }); if (!r.ok) continue; j = await r.json(); } catch (e) { continue; }
    if (!j || !Array.isArray(j.elements) || (j.remark && /error|time/i.test(j.remark))) continue;
    /* each element kept with the tile it stands in (water: its one tile, whole); a tile with nothing in it is kept too, as empty */
    const by = new Map(stale.map(k => [k, []]));
    for (const el of j.elements) { if (K.most === 1) { by.get(stale[0]).push(el); continue; } const la = el.lat != null ? el.lat : el.center && el.center.lat, ln = el.lon != null ? el.lon : el.center && el.center.lon; if (la == null) continue;
      const k = keyOf(Math.floor(la / K.tile), Math.floor(ln / K.tile)); if (by.has(k)) by.get(k).push(el); }
    const ops = []; for (const [k, els] of by) { const body = JSON.stringify(els); have.set(k, { k, body, at: t }); if (body.length < 1.5e6) ops.push(db.prepare('INSERT OR REPLACE INTO osm (k, body, at) VALUES (?, ?, ?)').bind(k, body, t)); }
    if (ops.length) await db.batch(ops);
    return osmOut(all());
  }
  return have.size ? osmOut(all()) : fail(502, 'osm');
}

/* ───────── stage 5, places and people: a place is its name, what kind of place (cat), what it does near a life (role), where it is
   (address, suburb, lat, lng), its own site and a line on what it does. Shown ones are read by every visitor and join the listed
   places on the map, in search and on the radar; a suggestion waits on the approval page like a story ───────── */
const PLACE_CATS = ['brand', 'circular', 'service', 'artists', 'third', 'network'];
const PLACE_COLS = 'id, n, cat, role, addr, sub, url, what, lat, lng, status, src, created, decided';
function placeOf(b) {
  const n = str(b.n, 80), lat = +b.lat, lng = +b.lng, url = str(b.url, 300);
  if (!n || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { n, cat: PLACE_CATS.includes(b.cat) ? b.cat : 'service', role: /^[a-z]{1,20}$/.test(b.role || '') ? b.role : '', addr: str(b.addr, 120), sub: str(b.sub, 60),
    url: /^https:\/\/[^\s<>"]+$/.test(url) ? url : '', what: str(b.what, 200), lat: +lat.toFixed(6), lng: +lng.toFixed(6) };
}
async function listPlaces(db) {
  const { results } = await db.prepare("SELECT id, n, cat, role, addr, sub, url, what, lat, lng FROM places WHERE status = 'shown' ORDER BY n LIMIT 2000").all();
  return new Response(JSON.stringify({ places: results }), { headers: { ...JSON_H, 'cache-control': 'public, max-age=300' } });
}
async function suggestPlace(db, env, req) {
  if (levelOf() >= 2) return fail(503, 'resting');
  if (await tooMany(db, env, req, 'place', 6, 10 * 60e3)) return fail(429, 'too many places from one place in ten minutes');
  const p = placeOf(await body(req)); if (!p) return fail(400, 'place');
  const { n } = await db.prepare("SELECT count(*) AS n FROM places WHERE status = 'waiting'").first(); if (n >= 500) return fail(503, 'too many places waiting');
  const id = rid(); await db.prepare('INSERT INTO places (id, n, cat, role, addr, sub, url, what, lat, lng, status, src, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, p.n, p.cat, p.role, p.addr, p.sub, p.url, p.what, p.lat, p.lng, 'waiting', 'suggested', now()).run();
  return json({ id, status: 'waiting' }, 201);
}
async function adminPlaces(db, req, id) {
  if (req.method === 'GET') { const st = ['waiting', 'shown', 'refused', 'deleted'].includes(new URL(req.url).searchParams.get('status')) ? new URL(req.url).searchParams.get('status') : 'waiting';
    const { results } = await db.prepare(`SELECT ${PLACE_COLS} FROM places WHERE status = ? ORDER BY created DESC LIMIT 1000`).bind(st).all(); return json({ places: results }); }
  if (req.method !== 'POST') return fail(405, 'method');
  const b = await body(req), t = now();
  /* added here: shown at once */
  if (!id) { const p = placeOf(b); if (!p) return fail(400, 'place'); const nid = rid();
    await db.prepare('INSERT INTO places (id, n, cat, role, addr, sub, url, what, lat, lng, status, src, created, decided) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(nid, p.n, p.cat, p.role, p.addr, p.sub, p.url, p.what, p.lat, p.lng, 'shown', 'admin', t, t).run(); return json({ id: nid, status: 'shown' }, 201); }
  if (b.action === 'show' || b.action === 'refuse') { await db.prepare('UPDATE places SET status = ?, decided = ? WHERE id = ?').bind(b.action === 'show' ? 'shown' : 'refused', t, id).run(); return json({ ok: true }); }
  if (b.action === 'delete') { await db.prepare("UPDATE places SET status = 'deleted', decided = ? WHERE id = ?").bind(t, id).run(); return json({ ok: true }); }
  if (b.action === 'restore') { await db.prepare("UPDATE places SET status = 'waiting', decided = NULL WHERE id = ?").bind(id).run(); return json({ ok: true }); }
  if (b.action === 'purge') { await db.prepare("DELETE FROM places WHERE id = ? AND status = 'deleted'").bind(id).run(); return json({ ok: true }); }
  if (b.action === 'edit') { const p = placeOf(b); if (!p) return fail(400, 'place');
    await db.prepare('UPDATE places SET n = ?, cat = ?, role = ?, addr = ?, sub = ?, url = ?, what = ?, lat = ?, lng = ? WHERE id = ?').bind(p.n, p.cat, p.role, p.addr, p.sub, p.url, p.what, p.lat, p.lng, id).run(); return json({ ok: true }); }
  return fail(400, 'action');
}

/* ───────── the approval page's own: the whole site at a glance, everything as one file, places brought in by the hundred, and the
   site set back to its base. A reset archives (nothing is lost: it can be brought back from the archive) and never touches the
   printers, their tokens, or the password ───────── */
const COUNT = async (db, table, extra = '') => { const { results } = await db.prepare(`SELECT status, count(*) AS n FROM ${table} ${extra} GROUP BY status`).all(); return Object.fromEntries(results.map(r => [r.status, r.n])); };
async function overview(db) {
  const day = new Date().toISOString().slice(0, 10), wk = new Date(now() - 7 * DAY).toISOString().slice(0, 10);
  const [stories, places, posts, jobs] = await Promise.all([COUNT(db, 'stories'), COUNT(db, 'places'), COUNT(db, 'posts'), COUNT(db, 'jobs', `WHERE created > ${now() - 7 * DAY}`)]);
  const { results: pr } = await db.prepare('SELECT id, name, seen, token IS NOT NULL AS paired, mesh, auto, touch IS NOT NULL AS touch FROM printers ORDER BY id').all();
  const { results: tr } = await db.prepare('SELECT k, sum(n) AS n, max(day = ?) AS today FROM traffic WHERE day >= ? GROUP BY k').bind(day, wk).all();
  const { results: td } = await db.prepare('SELECT k, n FROM traffic WHERE day = ?').bind(day).all(); const today = Object.fromEntries(td.map(r => [r.k, r.n]));
  const r2 = await r2Bytes(db), use = { req: (today['~req'] || 0) + USE.req, w: (today['~w'] || 0) + USE.w, r2, cap: CAP, level: levelOf() };
  return json({ use, stories, places, posts, jobs, printers: pr, week: Object.fromEntries(tr.map(r => [r.k, r.n])), today, at: now() });
}
async function exportAll(db) {
  const q = async s => (await db.prepare(s).all()).results;
  const out = { site: 'novel.global', build: BUILD, at: new Date().toISOString(),
    talk: await q('SELECT * FROM talk ORDER BY at DESC'), makers: await q('SELECT * FROM makers ORDER BY first'),
    stories: await q('SELECT id, code, kind, status, body, lat, lng, dest, created, decided, star, who, gone, origin, full, (photo IS NOT NULL OR pic IS NOT NULL) AS has_photo FROM stories ORDER BY created DESC'),
    places: await q(`SELECT ${PLACE_COLS} FROM places ORDER BY created DESC`), posts: await q('SELECT id, slug, title, summary, body, cat, links, day, status, created, updated FROM posts ORDER BY created DESC'),
    printers: await q('SELECT id, name, paper, mesh, auto, live, seen, token IS NOT NULL AS paired FROM printers ORDER BY id'), settings: await settingsOf(db).then(x => { delete x.note; delete x.noteKey; delete x.noteSlip; delete x.notePub; return x; }), species: await q('SELECT * FROM species ORDER BY first'), traffic: await q('SELECT day, k, n FROM traffic ORDER BY day DESC, k') };
  return new Response(JSON.stringify(out, null, 1), { headers: { ...JSON_H, 'content-disposition': `attachment; filename="novel-global-${out.at.slice(0, 10)}.json"` } });
}
/* a backup brought back (the file DATA downloads): settings set as they were; places, posts, makers, the talk and the stories put back
   where they are missing, nothing here overwritten. Photographs stay in the backup's zip; printers are paired again, by hand */
async function restoreAll(db, req) {
  const t = await req.text(); if (t.length > 60e6) return fail(413, 'too large'); let j; try { j = JSON.parse(t); } catch (e) { return fail(400, 'not json'); }
  if (!j || j.site !== 'novel.global') return fail(400, 'not a backup');
  const v = x => (typeof x === 'string' || typeof x === 'number' ? x : x === true ? 1 : x === false ? 0 : null), ops = [], n = {};
  const put = (tab, cols, rows) => { const ok = (Array.isArray(rows) ? rows : []).filter(r => r && typeof r === 'object' && v(r[cols[0]]) != null).slice(0, 20000); n[tab] = ok.length;
    for (const r of ok) ops.push(db.prepare(`INSERT OR IGNORE INTO ${tab} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`).bind(...cols.map(c => v(r[c])))); };
  const set = (k, x) => ops.push(db.prepare('INSERT INTO settings (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v').bind(k, x));
  for (const [k, x] of Object.entries(j.settings || {})) { if (k in SETTINGS && typeof x === 'boolean') set(k, x ? '1' : '0'); else if (k in TEXTS && typeof x === 'string') set(k, x.slice(0, TEXTS[k])); }
  put('places', PLACE_COLS.split(', '), j.places);
  put('posts', ['id', 'slug', 'title', 'summary', 'body', 'cat', 'links', 'day', 'status', 'created', 'updated'], j.posts);
  put('makers', ['who', 'first', 'last', 'posts', 'stage', 'lv', 'kin'], j.makers);
  put('talk', ['id', 'sec', 'who', 'text', 're', 'at', 'hidden'], j.talk);
  put('stories', ['id', 'code', 'kind', 'status', 'body', 'lat', 'lng', 'dest', 'created', 'decided', 'star', 'who', 'gone', 'origin'], j.stories);
  for (let i = 0; i < ops.length; i += 50) await db.batch(ops.slice(i, i + 50));
  return json({ ok: true, ...n });
}
async function importPlaces(db, req) {
  const b = await body(req); const list = Array.isArray(b.places) ? b.places.slice(0, 2000) : []; const t = now(); const ops = []; let bad = 0;
  for (const raw of list) { const p = placeOf(raw || {}); if (!p) { bad++; continue; } ops.push(db.prepare('INSERT INTO places (id, n, cat, role, addr, sub, url, what, lat, lng, status, src, created, decided) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(rid(), p.n, p.cat, p.role, p.addr, p.sub, p.url, p.what, p.lat, p.lng, 'shown', 'import', t, t)); }
  for (let i = 0; i < ops.length; i += 50) await db.batch(ops.slice(i, i + 50));
  return json({ added: ops.length, bad });
}
async function resetSite(db, env, req) {
  const b = await body(req), t = now(), ops = [];
  /* a fresh start, for good: every maker, poster (BOARD 00 aside), word of talk, tape, print and first sighting gone, their photographs
     and recordings with them; the epoch moved, so every phone lets go of what it kept on its next visit. 888 is no maker, so it stays */
  if (b.fresh) { if (env.MEDIA) { const { results } = await db.prepare("SELECT id FROM stories WHERE kind != 'example'").all(); for (const r of results) for (const k of [mediaKey(r.id), photoKey(r.id), `art/${r.id}`]) await env.MEDIA.delete(k).catch(() => {});
      const tp = await db.prepare('SELECT id FROM tapes').all(); for (const r of tp.results) await env.MEDIA.delete(tapeKey(r.id)).catch(() => {}); }
    ops.push(db.prepare('DELETE FROM jobs'), db.prepare("DELETE FROM stories WHERE kind != 'example'"), db.prepare('DELETE FROM makers'), db.prepare('DELETE FROM talk'), db.prepare('DELETE FROM tapes'), db.prepare('DELETE FROM hits'), db.prepare('DELETE FROM species'),
      db.prepare("INSERT INTO settings (k, v) VALUES ('epoch', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v").bind('e' + t.toString(36))); }
  if (b.stories) ops.push(db.prepare("DELETE FROM jobs WHERE status IN ('held', 'queued')"), db.prepare("UPDATE stories SET status = 'deleted', decided = ? WHERE status != 'deleted' AND kind != 'example'").bind(t));
  if (b.example) ops.push(db.prepare("UPDATE stories SET status = 'deleted', decided = ? WHERE kind = 'example'").bind(t));
  if (b.places) ops.push(db.prepare("UPDATE places SET status = 'deleted', decided = ? WHERE status != 'deleted'").bind(t));
  if (b.posts) ops.push(db.prepare("UPDATE posts SET status = 'draft', updated = ? WHERE status = 'published'").bind(t));
  if (b.words) ops.push(db.prepare("DELETE FROM settings WHERE k IN ('template', 'words', 'cities')"));
  if (b.settings) ops.push(db.prepare("DELETE FROM settings WHERE k IN ('lifeLock', 'exampleEdit', 'phreak', 'sendLive', 'gates', 'fx', 'start', 'notice', 'country')"));
  if (b.traffic) ops.push(db.prepare('DELETE FROM traffic'));
  if (!ops.length) return fail(400, 'nothing');
  await db.batch(ops); return json({ ok: true });
}
/* traffic: a day's count of each kind of thing, added after the answer has gone */
const BEATS = ['open-aura', 'open-studio', 'open-portfolio', 'begin', 'print', 'wall', 'song', 'device'];
/* the journey, counted step by step (never who): levels reached, discs and the eye pressed, steps opened, devices, the booth, the desk */
const JOURNEY = /^(lv[1-6]|disc-[0-2]|eye|step-[0-3]|dev-[0-3]|booth-(open|print|save)|desk-(open|play|keep)|yours|talk|plain-(asked|ddg|still)|showcase)$/;
function trafficKey(url, m) {
  const p = url.pathname.replace(/^\/api\//, '').split('/')[0];
  if (p === 'beat') { const k = url.searchParams.get('k'); return BEATS.includes(k) || JOURNEY.test(k || '') ? k : null; }
  if (['inat', 'osm', 'img', 'wx', 'news', 'book', 'c', 'places', 'stories', 'posts', 'receipts'].includes(p)) return p + (m === 'POST' ? ':sent' : '');
  return null;
}
function tally(url, m) { USE.req++; const k = trafficKey(url, m); if (k) USE.keys[k] = (USE.keys[k] || 0) + 1; }

/* ───────── the portfolio: posts written on the approval page, drafts until published. Only published posts are read here ───────── */
const POST_COLS = 'id, slug, title, summary, cat, day, status, (cover IS NOT NULL OR cov IS NOT NULL) AS has_cover, updated';
const postOut = r => ({ ...r, cover: !!r.has_cover, has_cover: undefined, links: r.links ? JSON.parse(r.links) : undefined });
async function listPosts(db) { const { results } = await db.prepare(`SELECT ${POST_COLS} FROM posts WHERE status = 'published' ORDER BY day DESC, created DESC LIMIT 300`).all(); return json({ posts: results.map(postOut) }); }
async function onePost(db, slug, any) {
  const r = await db.prepare(`SELECT ${POST_COLS}, body, links FROM posts WHERE ${any ? 'id' : 'slug'} = ?${any ? '' : " AND status = 'published'"}`).bind(slug).first();
  return r ? json({ post: postOut(r) }) : fail(404, 'not found');
}
async function postCover(db, env, key, any) {
  const r = await db.prepare(`SELECT id, cover, cov FROM posts WHERE ${any ? 'id' : 'slug'} = ?${any ? '' : " AND status = 'published'"}`).bind(key).first();
  if (!r || !(r.cover || r.cov)) return fail(404, 'not found');
  const o = !r.cover && env.MEDIA ? await env.MEDIA.get(coverKey(r.id)) : null; if (!r.cover && !o) return fail(404, 'not found');
  return new Response(o ? o.body : new Uint8Array(r.cover), { headers: { 'content-type': 'image/jpeg', 'cache-control': any ? 'no-store' : 'public, max-age=600', 'x-content-type-options': 'nosniff' } });
}
const slugOf = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'post';
const str = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
async function savePost(db, env, req) {
  const b = await body(req); const title = str(b.title, 140); if (!title) return fail(400, 'title');
  const links = (Array.isArray(b.links) ? b.links : []).map(u => str(u, 300)).filter(u => /^https:\/\/[^\s]+$/.test(u)).slice(0, 12);
  const day = /^\d{4}-\d{2}-\d{2}$/.test(b.day || '') ? b.day : new Date().toISOString().slice(0, 10);
  const status = b.status === 'published' ? 'published' : 'draft'; const t = now();
  const pic = b.cover ? dataURL(b.cover) : null; if (b.cover && !pic) return fail(400, 'cover');
  const id = typeof b.id === 'string' && /^[A-Za-z0-9_-]{8,40}$/.test(b.id) ? b.id : rid();
  const was = await db.prepare('SELECT id, slug FROM posts WHERE id = ?').bind(id).first();
  /* a post keeps its address once made; a new one takes its title's, numbered if that is taken */
  let slug = was ? was.slug : slugOf(str(b.slug, 60) || title); if (!was) for (let i = 2; await db.prepare('SELECT 1 FROM posts WHERE slug = ?').bind(slug).first(); i++) slug = `${slugOf(title).slice(0, 55)}-${i}`;
  const f = [title, str(b.summary, 400), str(b.body, 40000), str(b.cat, 40).toUpperCase(), JSON.stringify(links), day, status, t];
  /* the cover into R2 when it can (its old one there let go when it is changed or taken off), else kept in the database */
  const inR2 = pic ? await toR2(db, env, coverKey(id), pic) : false; if (!inR2 && (pic || b.cover === null) && env.MEDIA) await env.MEDIA.delete(coverKey(id)).catch(() => {});
  const cv = pic || b.cover === null ? [inR2 ? null : pic, inR2 ? pic.length : null] : null;
  if (was) await db.prepare(`UPDATE posts SET title = ?, summary = ?, body = ?, cat = ?, links = ?, day = ?, status = ?, updated = ?${cv ? ', cover = ?, cov = ?' : ''} WHERE id = ?`).bind(...f, ...(cv || []), id).run();
  else await db.prepare('INSERT INTO posts (title, summary, body, cat, links, day, status, updated, cover, cov, id, slug, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(...f, inR2 ? null : pic, inR2 ? pic.length : null, id, slug, t).run();
  return json({ id, slug, status }, was ? 200 : 201);
}

/* ───────── the router ───────── */
/* plays: small things made in the builder's LIVE bench; they wait for approval, then stand as small cards. Their code runs only in a
   sandbox with no network, on the phone that opens it */
const PLAY_TH = ['dots', 'lilac', 'cyan', 'coral', 'pink', 'print'], PLAY_OPEN = 40, PLAY_MONTH = 150, PLAY_CODE = 5;
/* a play's card art: one picture kept with it (jpeg, webp or png, as a data URL under 200 kB); big is asked for by its maker and given by novel.global */
const playArt = v => typeof v === 'string' && v.length <= 200e3 && /^data:image\/(jpeg|webp|png);base64,[A-Za-z0-9+/=]+$/.test(v) ? v : null;
const playPicV = j => j && j.art ? String(j.art.length % 100000) : '';
async function playPic(db, c) {
  if (!/^PL-[A-Z2-9]{4}$/.test(c)) return fail(400, 'code');
  const r = await db.prepare("SELECT body FROM stories WHERE kind = 'play' AND status = 'shown' AND gone IS NULL AND code = ?").bind(c).first(); if (!r) return fail(404, 'not found');
  let j = {}; try { j = JSON.parse(r.body); } catch (e) { return fail(404, 'not found'); }
  const m = /^data:(image\/(?:jpeg|webp|png));base64,(.+)$/.exec(j.art || ''); if (!m) return fail(404, 'none');
  const bin = atob(m[2]), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return new Response(u, { headers: { 'content-type': m[1], 'cache-control': 'public, max-age=600', 'x-content-type-options': 'nosniff' } });
}
async function playSend(db, env, req) {
  if (await tooMany(db, env, req, 'play', 6, 10 * 60e3)) return fail(429, 'slow down');
  const b = await body(req, 300e3); const n = typeof b.n === 'string' ? b.n.trim().toUpperCase().slice(0, 24) : '', src = typeof b.src === 'string' ? b.src : '';
  if (!n || !src.trim() || src.length > 40e3) return fail(400, 'play');
  const who = typeof b.who === 'string' && WHO.test(b.who) ? b.who : null; if (!who) return fail(400, 'who');
  /* only a code a print gave (proof a person stood at a printer), or the owner's own key; while the sandbox is on, it goes up at once */
  const own = !!env.ADMIN_KEY && !!bearer(req) && await same(bearer(req), env.ADMIN_KEY);
  if (!own && !(await coded(db, who))) return fail(401, 'code');
  /* open, within a month's measure: sized for about ten makers a month. A printed code puts its first three of a month straight up while
     the site has put up fewer than forty; past that they wait for approval; five a code and a hundred and fifty in all is the ceiling */
  const since = now() - 30 * 864e5;
  const { m } = await db.prepare("SELECT count(*) AS m FROM stories WHERE kind = 'play' AND created > ?").bind(since).first();
  const { k } = await db.prepare("SELECT count(*) AS k FROM stories WHERE kind = 'play' AND who = ? AND created > ?").bind(who, since).first();
  if (!own && m >= PLAY_MONTH) return fail(503, 'full'); if (!own && k >= PLAY_CODE) return fail(429, 'enough');
  const up = own || (!!(await settingsOf(db)).sandbox && m < PLAY_OPEN && k < 3);
  const { w } = await db.prepare("SELECT count(*) AS w FROM stories WHERE kind = 'play' AND status = 'waiting'").first(); if (!up && w >= 200) return fail(503, 'full');
  const code = 'PL-' + rid(4).toUpperCase(), th = PLAY_TH.includes(b.th) ? b.th : 'print', fr = ['dots', 'steps', 'stripe', 'coral', 'lunch', 'print'].includes(b.fr) ? b.fr : '';
  const t = now();
  await keepMade(db, who).run();
  await db.prepare('INSERT INTO stories (id, code, kind, status, body, created, decided, who) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(rid(), code, 'play', up ? 'shown' : 'waiting', JSON.stringify({ n, th, fr, src, ...(playArt(b.art) ? { art: playArt(b.art) } : {}), ...(b.sz === 'big' ? { big: 'ask' } : {}) }), t, up ? t : null, who).run();
  return json({ code, shown: up }, 201);
}
/* a pass from a printer's slip makes this phone's code a printed one: one use, the day it was printed */
async function makerPass(db, env, req) {
  if (await tooMany(db, env, req, 'maker', 12, 10 * 60e3)) return fail(429, 'too many');
  const b = await body(req); const who = typeof b.who === 'string' && WHO.test(b.who) ? b.who : null, pass = typeof b.pass === 'string' ? b.pass.toUpperCase().replace(/\s+/g, '') : '';
  if (!who || !PASS.test(pass) || !codeKey(env)) return fail(400, 'pass');
  const f = await passFind(db, env, pass); if (!f) return fail(404, 'not found');
  if (!(await passUse(db, f.code, f.day, f.p.id))) return fail(409, 'used');
  await makerPrinted(db, who); await stampPut(db, env, who, f); const home = await homeGive(db, env, req, who, b); return json({ ok: true, island: f.p.id, ...(home ? { home } : {}) }, 201);
}
/* v0.7 C. A stamp: a pass from a printer kept on a code, the proof its holder was there. A pass stamps one code only, the first to keep it.
   What a code's stamps are is told only with its home key, handed to the phone that kept one: a short code alone never shows where its holder has been */
const stampsReady = new WeakMap();
const stampTable = db => { if (!stampsReady.has(db)) stampsReady.set(db, db.batch([db.prepare('CREATE TABLE IF NOT EXISTS stamps (pass TEXT PRIMARY KEY, who TEXT NOT NULL, island TEXT NOT NULL, day TEXT NOT NULL, at INTEGER NOT NULL)'), db.prepare('CREATE INDEX IF NOT EXISTS stamps_who ON stamps (who)')]).catch(e => { stampsReady.delete(db); throw e; })); return stampsReady.get(db); };
async function homeGive(db, env, req, who, b) { if (!codeKey(env)) return null; const key = await homeKey(env, who); if ((req.headers.get('x-home') || '') === key) return key;
  if (!b || !b.home) return null;   // only a page that keeps the key asks for it
  const r = await db.prepare('UPDATE makers SET claimed = ? WHERE who = ? AND claimed IS NULL').bind(now(), who).run(); return r.meta && r.meta.changes ? key : null; }
/* small lasting notes: an intro pass given, wrong animals tried */
const giftsReady = new WeakMap();
const giftTable = db => { if (!giftsReady.has(db)) giftsReady.set(db, db.prepare('CREATE TABLE IF NOT EXISTS gifts (k TEXT PRIMARY KEY, n INTEGER NOT NULL, at INTEGER NOT NULL)').run().catch(e => { giftsReady.delete(db); throw e; })); return giftsReady.get(db); };
/* the animal: a code's second key, chosen (or given at random) on the phone that holds the home key. A code and its animal open the home on
   another phone; three wrong animals lock the code's home for a week */
const ANIMALS = 64, TRIES = { n: 3, for: 7 * DAY };
async function homePost(db, env, req) {
  if (await tooMany(db, env, req, 'home', 12, 10 * 60e3)) return fail(429, 'too many');
  const b = await body(req), who = typeof b.who === 'string' && WHO.test(b.who.toUpperCase()) ? b.who.toUpperCase() : null; if (!who || !codeKey(env)) return fail(400, 'who');
  const mk = await db.prepare('SELECT animal FROM makers WHERE who = ?').bind(who).first(); if (!mk) return fail(404, 'not found');
  const key = await homeKey(env, who), a = Number.isInteger(b.animal) && b.animal >= 0 && b.animal < ANIMALS ? b.animal : null;
  if (b.k != null) { if (b.k !== key) return fail(401, 'key');
    if (a != null) await db.prepare('UPDATE makers SET animal = ? WHERE who = ?').bind(a, who).run();
    return json({ ok: true, animal: a != null ? a : mk.animal }); }
  await giftTable(db); const tk = 'try:' + who, t = now(), tr = await db.prepare('SELECT n, at FROM gifts WHERE k = ?').bind(tk).first(), live = tr && t - tr.at < TRIES.for;
  if (live && tr.n >= TRIES.n) return fail(423, 'locked');
  if (a == null || mk.animal == null || a !== mk.animal) { await db.prepare('INSERT INTO gifts (k, n, at) VALUES (?, 1, ?) ON CONFLICT(k) DO UPDATE SET n = CASE WHEN ? - at < ? THEN n + 1 ELSE 1 END, at = CASE WHEN ? - at < ? THEN at ELSE ? END').bind(tk, t, t, TRIES.for, t, TRIES.for, t).run(); return fail(403, 'no'); }
  await db.prepare('DELETE FROM gifts WHERE k = ?').bind(tk).run(); await db.prepare('UPDATE makers SET last = ? WHERE who = ?').bind(t, who).run();
  return json({ ok: true, home: key, animal: a }); }
/* a pass for finishing an island's intro, where the island gives them so: once for each code at each island */
async function giftPost(db, env, req) {
  if (await tooMany(db, env, req, 'gift', 6, 60 * 60e3)) return fail(429, 'too many');
  const b = await body(req), who = typeof b.who === 'string' && WHO.test(b.who) ? b.who : null, id = String(b.island || '');
  if (!who || b.why !== 'intro' || !/^[a-z0-9-]{1,40}$/.test(id) || !codeKey(env)) return fail(400, 'gift');
  const p = await db.prepare("SELECT id, ways FROM printers WHERE id = ? AND (token IS NOT NULL OR id = 'novelglobal')").bind(id).first(); if (!p) return fail(404, 'no such island');
  const w = waysOf(p); if (!w || !w.includes('intro')) return fail(403, 'not here');
  await giftTable(db); const r = await db.prepare('INSERT OR IGNORE INTO gifts (k, n, at) VALUES (?, 1, ?)').bind('intro:' + p.id + ':' + who, now()).run(); if (!(r.meta && r.meta.changes)) return fail(409, 'given');
  const m = await passMake(db, env, p.id, 1); return json({ code: m.passes[0], island: p.id, day: m.day }, 201); }
async function homeKey(env, who) { return hex(await mac(codeKey(env), 'home:' + who)).slice(0, 16); }
async function stampPut(db, env, who, f) { await stampTable(db);
  await db.prepare('INSERT OR IGNORE INTO stamps (pass, who, island, day, at) VALUES (?, ?, ?, ?, ?)').bind(f.p.id + ':' + f.code + ':' + f.day, who, f.p.id, f.day, now()).run();
  const r = await db.prepare('SELECT who FROM stamps WHERE pass = ?').bind(f.p.id + ':' + f.code + ':' + f.day).first(); if (!r || r.who !== who) return false;
  await makerPrinted(db, who); await keepMade(db, who).run(); return true; }
async function stampPost(db, env, req) {
  if (await tooMany(db, env, req, 'stamp', 12, 10 * 60e3)) return fail(429, 'too many');
  const b = await body(req); const who = typeof b.who === 'string' && WHO.test(b.who) ? b.who : null;
  if (!who || typeof b.pass !== 'string' || !codeKey(env)) return fail(400, 'pass');
  const f = await passFind(db, env, b.pass); if (!f) return fail(404, 'not found');
  if (!(await stampPut(db, env, who, f))) return fail(409, 'taken');
  const home = await homeGive(db, env, req, who, b); return json({ ok: true, island: f.p.id, name: f.p.name || f.p.id, ...(home ? { home } : {}) }, 201); }
async function stampsOf(db, who) { await stampTable(db);
  const { results } = await db.prepare('SELECT s.island AS id, p.name AS name, p.number AS number, count(*) AS n FROM stamps s LEFT JOIN printers p ON p.id = s.island WHERE s.who = ? GROUP BY s.island ORDER BY min(s.at)').bind(who).all();
  return results.map(x => ({ id: x.id, name: x.name || x.id, number: x.number || null, n: x.n })); }
async function makerPrinted(db, who) { const t = now();
  await db.prepare('INSERT INTO makers (who, first, last, posts, kin) VALUES (?, ?, ?, 0, (SELECT COALESCE(MAX(kin), -1) + 1 FROM makers)) ON CONFLICT(who) DO NOTHING').bind(who, t, t).run();
  await db.prepare('UPDATE makers SET printed = COALESCE(printed, ?) WHERE who = ?').bind(t, who).run(); }
/* a printed code, linked by its maker to a way back to them: mesh, email, mobile or Steam. Optional; seen only on the admin page */
const LINK_K = { mesh: /^[!A-Za-z0-9 ._-]{2,40}$/, email: /^[^\s@<>"]{1,64}@[^\s@<>"]{1,120}\.[a-z]{2,24}$/i, mobile: /^\+?[0-9 ()-]{6,22}$/, steam: /^[A-Za-z0-9_:/.-]{2,80}$/ };
const linksReady = new WeakMap();
const linkTable = db => { if (!linksReady.has(db)) linksReady.set(db, db.prepare('CREATE TABLE IF NOT EXISTS links (who TEXT NOT NULL, k TEXT NOT NULL, v TEXT NOT NULL, at INTEGER NOT NULL, PRIMARY KEY (who, k))').run().catch(e => { linksReady.delete(db); throw e; })); return linksReady.get(db); };
async function linkSet(db, env, req) {
  if (await tooMany(db, env, req, 'link', 10, 10 * 60e3)) return fail(429, 'too many');
  const b = await body(req); const who = typeof b.who === 'string' && WHO.test(b.who) ? b.who : null, k = typeof b.k === 'string' ? b.k : '', v = typeof b.v === 'string' ? b.v.trim() : '';
  if (!who || !LINK_K[k] || (v && !LINK_K[k].test(v))) return fail(400, 'link');
  if (!(await coded(db, who))) return fail(401, 'code'); await linkTable(db);
  if (!v) await db.prepare('DELETE FROM links WHERE who = ? AND k = ?').bind(who, k).run();
  else await db.prepare('INSERT INTO links (who, k, v, at) VALUES (?, ?, ?, ?) ON CONFLICT(who, k) DO UPDATE SET v = excluded.v, at = excluded.at').bind(who, k, v, now()).run();
  return json({ ok: true }, 201);
}
/* the showcase: nine at a time, by what is liked, what is fresh, or from the start (archive); the first play stands first */
const playTables = new WeakMap();
const playTable = db => { if (!playTables.has(db)) playTables.set(db, db.batch([db.prepare('CREATE TABLE IF NOT EXISTS play_likes (code TEXT NOT NULL, who TEXT NOT NULL, at INTEGER NOT NULL, PRIMARY KEY (code, who))'), db.prepare('CREATE TABLE IF NOT EXISTS play_stats (code TEXT PRIMARY KEY, opens INTEGER NOT NULL DEFAULT 0)')]).catch(e => { playTables.delete(db); throw e; })); return playTables.get(db); };
const PLAY_ORDER = { fresh: 's.decided DESC', archive: 's.decided ASC', liked: 'lk DESC, s.decided DESC' };
/* the island's own picks: a keeper's shelf of plays, shown as its own group */
const islePlays = new WeakMap();
const islePlayTable = db => { if (!islePlays.has(db)) islePlays.set(db, db.prepare('CREATE TABLE IF NOT EXISTS isle_plays (isle TEXT NOT NULL, code TEXT NOT NULL, at INTEGER NOT NULL, PRIMARY KEY (isle, code))').run().catch(e => { islePlays.delete(db); throw e; })); return islePlays.get(db); };
/* how the showcase stands, set by novel.global: how many it shows at most, starred only, the shelves in order */
function showcaseOf(st) { let j = {}; try { j = JSON.parse(st.showcase || '{}') || {}; } catch (e) { j = {}; }
  return { cap: Math.max(0, Math.min(5000, Math.round(+j.cap || 0))), star: !!j.star, shelves: Array.isArray(j.shelves) ? j.shelves.map(x => String(x).toUpperCase().replace(/[^A-Z0-9 &-]/g, '').trim().slice(0, 16)).filter(Boolean).slice(0, 12) : [], heroes: Math.max(0, Math.min(6, j.heroes == null ? 3 : Math.round(+j.heroes))) }; }
const shelfName = v => String(v || '').toUpperCase().replace(/[^A-Z0-9 &-]/g, '').trim().slice(0, 16);
const playOut = (r, j) => ({ c: r.code, n: j.n, th: j.th, fr: j.fr || '', lk: r.lk, pic: playPicV(j), big: j.big === 'yes', ...(j.star ? { star: true } : {}), ...(j.shelf ? { sh: j.shelf } : {}) });
async function playList(db, url) {
  await playTable(db); await islePlayTable(db); const q0 = url.searchParams, o = PLAY_ORDER[q0.get('o')] ? q0.get('o') : 'fresh', pg = Math.max(0, Math.min(500, Math.round(+q0.get('pg') || 0)));
  const SC = showcaseOf(await settingsOf(db)), q = String(q0.get('q') || '').trim().slice(0, 24), sh = shelfName(q0.get('sh')), isle = /^[a-z0-9-]{1,40}$/.test(q0.get('isle') || '') ? q0.get('isle') : '', all = !q && !sh && !isle;
  /* a page from where the phone says (the cards of its own take the first places), or nine at a time */
  const n = q0.has('n') ? Math.max(1, Math.min(9, Math.round(+q0.get('n') || 9))) : (pg || !all ? 9 : 8), off = q0.has('off') ? Math.max(0, Math.min(5000, Math.round(+q0.get('off') || 0))) : all ? Math.max(0, pg * 9 - 1) : pg * 9;
  const w = ["s.kind = 'play'", "s.status = 'shown'", 's.gone IS NULL', 's.code != ?', "json_extract(s.body, '$.off') IS NULL", "COALESCE(json_extract(s.body, '$.big'), '') != 'yes'"], b = [FIRST_PLAY.code];
  if (q) { w.push("(upper(json_extract(s.body, '$.n')) LIKE ? OR s.code = ?)"); b.push('%' + q.toUpperCase().replace(/[%_]/g, '') + '%', q.toUpperCase()); }
  if (sh) { w.push("json_extract(s.body, '$.shelf') = ?"); b.push(sh); }
  if (isle) { w.push('s.code IN (SELECT code FROM isle_plays WHERE isle = ?)'); b.push(isle); }
  if (SC.star && all) w.push("json_extract(s.body, '$.star') IS NOT NULL");
  const W0 = w.join(' AND '), { t } = await db.prepare(`SELECT count(*) AS t FROM stories s WHERE ${W0}`).bind(...b).first(), total = SC.cap && all ? Math.min(SC.cap, t) : t;
  const lim = Math.max(0, Math.min(n, total - off));
  const { results } = lim ? await db.prepare(`SELECT s.code, s.body, (SELECT count(*) FROM play_likes l WHERE l.code = s.code) AS lk FROM stories s WHERE ${W0} ORDER BY (json_extract(s.body, '$.star') IS NOT NULL) DESC, ${PLAY_ORDER[o]} LIMIT ? OFFSET ?`).bind(...b, lim, off).all() : { results: [] };
  const l = results.map(r => { try { return playOut(r, JSON.parse(r.body)); } catch (e) { return null; } }).filter(Boolean);
  const more = off + l.length < total;
  if (!pg && !off && all) { const fl = await db.prepare('SELECT count(*) AS n FROM play_likes WHERE code = ?').bind(FIRST_PLAY.code).first(); l.unshift({ c: FIRST_PLAY.code, n: FIRST_PLAY.n, th: FIRST_PLAY.th, fr: FIRST_PLAY.fr, first: true, lk: fl ? fl.n : 0 }); }
  /* the heroes stand with the big cards whatever the page; the shelves and islands to group by, with how many each holds */
  const hr = SC.heroes ? (await db.prepare(`SELECT s.code, s.body, 0 AS lk FROM stories s WHERE s.kind = 'play' AND s.status = 'shown' AND s.gone IS NULL AND json_extract(s.body, '$.off') IS NULL AND json_extract(s.body, '$.big') = 'yes' ORDER BY (json_extract(s.body, '$.star') IS NOT NULL) DESC, s.decided DESC LIMIT ?`).bind(SC.heroes).all()).results : [];
  const heroes = hr.map(r => { try { return playOut(r, JSON.parse(r.body)); } catch (e) { return null; } }).filter(Boolean);
  const shc = (await db.prepare("SELECT json_extract(body, '$.shelf') AS sh, count(*) AS n FROM stories WHERE kind = 'play' AND status = 'shown' AND gone IS NULL AND json_extract(body, '$.off') IS NULL AND json_extract(body, '$.shelf') IS NOT NULL GROUP BY sh").all()).results;
  const shelves = shc.sort((x, y) => { const a = SC.shelves.indexOf(x.sh), c = SC.shelves.indexOf(y.sh); return (a < 0 ? 99 : a) - (c < 0 ? 99 : c) || y.n - x.n; }).slice(0, 12).map(r => ({ sh: r.sh, n: r.n }));
  const isles = (await db.prepare("SELECT i.isle AS id, COALESCE(p.name, i.isle) AS name, count(*) AS n FROM isle_plays i JOIN stories s ON s.code = i.code AND s.kind = 'play' AND s.status = 'shown' AND s.gone IS NULL LEFT JOIN printers p ON p.id = i.isle GROUP BY i.isle ORDER BY n DESC LIMIT 8").all()).results;
  return json({ plays: l, o, pg, more, total, off, heroes, shelves, isles, q, sh, isle });
}
/* an island's keeper picks plays for its own shelf, or takes them off: forty at most */
async function islePick(db, p, b) { await islePlayTable(db);
  if (b.play != null) { const c = String(b.play).toUpperCase(); if (!/^PL-[A-Z2-9]{4}$/.test(c)) return fail(400, 'code');
    if (b.on === false) await db.prepare('DELETE FROM isle_plays WHERE isle = ? AND code = ?').bind(p.id, c).run();
    else { if (!(await db.prepare("SELECT 1 AS y FROM stories WHERE kind = 'play' AND status = 'shown' AND gone IS NULL AND code = ?").bind(c).first())) return fail(404, 'not found');
      const { k } = await db.prepare('SELECT count(*) AS k FROM isle_plays WHERE isle = ?').bind(p.id).first(); if (k >= 40) return fail(429, 'enough');
      await db.prepare('INSERT OR IGNORE INTO isle_plays (isle, code, at) VALUES (?, ?, ?)').bind(p.id, c, now()).run(); } }
  const { results } = await db.prepare("SELECT i.code AS c, json_extract(s.body, '$.n') AS n FROM isle_plays i JOIN stories s ON s.code = i.code AND s.kind = 'play' WHERE i.isle = ? ORDER BY i.at DESC").bind(p.id).all();
  return json({ picks: results }); }
/* a like: one for each code, on each play */
async function playLike(db, env, req, c) {
  if (!/^PL-[A-Z2-9]{4}$/.test(c)) return fail(400, 'code'); if (await tooMany(db, env, req, 'like', 40, 10 * 60e3)) return fail(429, 'slow down');
  const b = await body(req); const who = typeof b.who === 'string' && WHO.test(b.who) ? b.who : null; if (!who) return fail(400, 'who'); await playTable(db);
  if (c !== FIRST_PLAY.code && !(await db.prepare("SELECT 1 AS y FROM stories WHERE kind = 'play' AND status = 'shown' AND gone IS NULL AND code = ?").bind(c).first())) return fail(404, 'not found');
  await db.prepare('INSERT OR IGNORE INTO play_likes (code, who, at) VALUES (?, ?, ?)').bind(c, who, now()).run();
  const { n } = await db.prepare('SELECT count(*) AS n FROM play_likes WHERE code = ?').bind(c).first(); return json({ n }, 201);
}
/* a maker's own: what they made, how often it was opened and liked; theirs to change */
async function playMine(db, url) {
  const who = url.searchParams.get('who') || ''; if (!WHO.test(who)) return fail(400, 'who'); await playTable(db);
  const { results } = await db.prepare("SELECT s.code, s.body, s.status, (SELECT count(*) FROM play_likes l WHERE l.code = s.code) AS lk, (SELECT opens FROM play_stats t WHERE t.code = s.code) AS op FROM stories s WHERE s.kind = 'play' AND s.who = ? AND s.gone IS NULL ORDER BY s.created DESC LIMIT 20").bind(who).all();
  return json({ plays: results.map(r => { try { const j = JSON.parse(r.body); return { c: r.code, n: j.n, th: j.th, fr: j.fr || '', src: j.src, up: r.status === 'shown', lk: r.lk || 0, op: r.op || 0, pic: playPicV(j), big: j.big || '' }; } catch (e) { return null; } }).filter(Boolean) });
}
async function playEdit(db, env, req, c) {
  if (!/^PL-[A-Z2-9]{4}$/.test(c)) return fail(400, 'code'); if (await tooMany(db, env, req, 'play', 20, 10 * 60e3)) return fail(429, 'slow down');
  const b = await body(req, 300e3); const who = typeof b.who === 'string' && WHO.test(b.who) ? b.who : null; if (!who) return fail(400, 'who');
  const r = await db.prepare("SELECT id, body FROM stories WHERE kind = 'play' AND code = ? AND who = ? AND gone IS NULL").bind(c, who).first(); if (!r) return fail(404, 'not found');
  const j = JSON.parse(r.body);
  if (typeof b.n === 'string' && b.n.trim()) j.n = b.n.trim().toUpperCase().slice(0, 24);
  if (PLAY_TH.includes(b.th)) j.th = b.th;
  if (typeof b.fr === 'string' && ['', 'dots', 'steps', 'stripe', 'coral', 'lunch', 'print'].includes(b.fr)) j.fr = b.fr;
  if (typeof b.src === 'string') { if (!b.src.trim() || b.src.length > 40e3) return fail(400, 'play'); j.src = b.src; }
  if (b.art === '') delete j.art; else if (b.art !== undefined) { if (!playArt(b.art)) return fail(400, 'art'); j.art = b.art; }
  if (b.sz === 'small') delete j.big; else if (b.sz === 'big' && j.big !== 'yes') j.big = 'ask';
  await db.prepare('UPDATE stories SET body = ? WHERE id = ?').bind(JSON.stringify(j), r.id).run(); return json({ code: c, ok: true }, 201);
}
async function playOne(db, c) {
  if (!/^PL-[A-Z2-9]{4}$/.test(c)) return fail(400, 'code'); if (c === FIRST_PLAY.code) return json({ n: FIRST_PLAY.n, th: FIRST_PLAY.th, fr: FIRST_PLAY.fr, src: FIRST_PLAY.src, first: true, by: FIRST_PLAY.by });
  const r = await db.prepare("SELECT body, created FROM stories WHERE kind = 'play' AND status = 'shown' AND gone IS NULL AND code = ?").bind(c).first(); if (!r) return fail(404, 'not found');
  try { await playTable(db); await db.prepare('INSERT INTO play_stats (code, opens) VALUES (?, 1) ON CONFLICT(code) DO UPDATE SET opens = opens + 1').bind(c).run(); } catch (e) { /* counted next time */ }
  const j = JSON.parse(r.body), nm = String(j.n || '').toLowerCase().replace(/(^|\s)\S/g, x => x.toUpperCase()), a = ((r.created / 864e5 - Date.UTC(2000, 0, 6, 18, 14) / 864e5) / 29.530588853 % 1 + 1) % 1, ph = a < 0.03 || a > 0.97 ? 'new moon' : a < 0.22 ? 'waxing crescent' : a < 0.28 ? 'first quarter' : a < 0.47 ? 'waxing gibbous' : a < 0.53 ? 'full moon' : a < 0.72 ? 'waning gibbous' : a < 0.78 ? 'last quarter' : 'waning crescent';
  return json({ ...j, art: undefined, pic: playPicV(j), by: `${nm ? nm + '. ' : ''}${ph[0].toUpperCase() + ph.slice(1)}, ${new Date(r.created).toLocaleString('en-AU', { month: 'long', year: 'numeric', timeZone: 'Australia/Melbourne' })}.` });
}
/* ───────── codes: one reader for every family; carts keep a 3-letter code a moon quarter; passes last a day at one island ───────── */
const ABC = 'ABCDEFGHJKMNPQRSTVWXYZ';
const MARKS = [['🌊', 'WAVE'], ['🐚', 'SHELL'], ['🦀', 'CRAB'], ['🐙', 'OCTOPUS'], ['🌙', 'MOON'], ['☀️', 'SUN'], ['🌿', 'FERN'], ['🍄', 'MUSHROOM'],
  ['🐝', 'BEE'], ['🦋', 'BUTTERFLY'], ['🌵', 'CACTUS'], ['🌻', 'SUNFLOWER'], ['🐟', 'FISH'], ['🦉', 'OWL'], ['🐢', 'TURTLE'], ['⭐', 'STAR']];
const melDay = (t = now()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Melbourne' }).format(new Date(t));
const quarterOf = (t = now()) => Math.floor((t / 864e5 - Date.UTC(2000, 0, 6, 18, 14) / 864e5) / (29.530588853 / 4));
const codeKey = env => env.PASS_KEY || env.ADMIN_KEY || '';
async function mac(key, s) { const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); return new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(s))); }
const letters = (b, n) => [...b.slice(0, n)].map(x => ABC[x % 22]).join('');
const cartCode = async (env, id, q = quarterOf()) => letters(await mac(codeKey(env), `cart:${q}:${id}`), 3);
/* each island its own key, worked out from the site's (never kept anywhere), handed to the island when it pairs or asks: the island and the
   site then make and check the same passes and the same mark of the day, the island with no internet */
const isleKeys = new Map();
async function isleKey(env, island) { const k = codeKey(env) + '|' + island; if (!isleKeys.has(k)) { if (isleKeys.size > 400) isleKeys.clear(); isleKeys.set(k, hex(await mac(codeKey(env), `island:${island}`))); } return isleKeys.get(k); }
async function markOf(env, island, day = melDay()) { const m = MARKS[(await mac(await isleKey(env, island), `mark:${day}`))[0] % MARKS.length]; return { e: m[0], w: m[1] }; }
const passMac = async (env, island, day, n) => letters(await mac(await isleKey(env, island), `pass:${day}:${n}`), 3);
/* a short pass: 3 of PC, a letter and a number always (so never a cart's 3 letters or the keypad's 3 digits), one of PASS_N a day per island:
   0 to 29 handed out here, 30 to 49 by the island itself with no internet, 50 to 59 shown on its touch screen */
const PC = 'ABCDEFGHJKMNPQRSTVWXYZ23456789', PASS_N = 60, PASS_SLOTS = { site: [0, 30], island: [30, 50], screen: [50, 60] };
async function pass3(key, day, n) { const b = await mac(key, `p3:${day}:${n}`); const c = [PC[b[0] % 22], PC[22 + b[1] % 8], PC[b[2] % 30]]; if (b[3] & 1) [c[0], c[1]] = [c[1], c[0]]; return c.join(''); }
const pass3s = new Map();
async function pass3Day(env, island, day) { const k = island + ':' + day; if (!pass3s.has(k)) { if (pass3s.size > 400) pass3s.clear(); const key = await isleKey(env, island), m = new Map(); for (let n = 0; n < PASS_N; n++) { const c = await pass3(key, day, n); if (!m.has(c)) m.set(c, n); } pass3s.set(k, m); } return pass3s.get(k); }
const PASS = /^(?:(?=[A-HJKMNP-TV-Z2-9]*[2-9])(?=[A-HJKMNP-TV-Z2-9]*[A-HJKMNP-TV-Z])[A-HJKMNP-TV-Z2-9]{3}|[A-HJKMNP-TV-Z]{3}-?[A-HJKMNP-TV-Z]{3})$/;
const passNorm = c => String(c || '').toUpperCase().replace(/[\s-]+/g, '');
const passesReady = new WeakMap();
const passTable = db => { if (!passesReady.has(db)) passesReady.set(db, db.prepare('CREATE TABLE IF NOT EXISTS passes (code TEXT NOT NULL, day TEXT NOT NULL, island TEXT NOT NULL, used INTEGER NOT NULL, PRIMARY KEY (code, day))').run().catch(e => { passesReady.delete(db); throw e; })); return passesReady.get(db); };
async function cartIds(env) { try { const r = await env.ASSETS.fetch(new Request('https://x/stacks/index.json')); if (!r.ok) return []; const j = await r.json(); return (Array.isArray(j) ? j : j.stacks || []).map(s => typeof s === 'string' ? s : s && s.id).filter(s => /^[a-z0-9-]{1,40}$/.test(String(s))); } catch (e) { return []; } }
async function cartFor(env, url) { const id = url.searchParams.get('for') || ''; if (!/^[a-z0-9-]{1,40}$/.test(id) || !codeKey(env)) return fail(400, 'for'); return json({ code: await cartCode(env, id) }); }
/* passes made for an island: as long as the approval page says (3, or 6 as before), the short ones each from the day's next slot */
const passNs = new WeakMap();
const passNTable = db => { if (!passNs.has(db)) passNs.set(db, db.prepare('CREATE TABLE IF NOT EXISTS passn (island TEXT NOT NULL, day TEXT NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (island, day))').run().catch(e => { passNs.delete(db); throw e; })); return passNs.get(db); };
async function passMake(db, env, island, n) { const day = melDay(), out = [], len = +(await settingsOf(db)).codeLen === 6 ? 6 : 3;
  if (len === 3) { await passNTable(db); const [a0, a1] = PASS_SLOTS.site, key = await isleKey(env, island);
    const r = await db.prepare('INSERT INTO passn (island, day, n) VALUES (?, ?, ?) ON CONFLICT(island, day) DO UPDATE SET n = n + ? RETURNING n').bind(island, day, n, n).first(), top = a0 + ((r && r.n) || n);
    for (let s = top - n; s < top && s < a1; s++) out.push(await pass3(key, day, s)); }
  while (out.length < n) { const a = crypto.getRandomValues(new Uint8Array(3)), nn = letters(a, 3); out.push(nn + '-' + await passMac(env, island, day, nn)); }
  return { day, mark: await markOf(env, island, day), passes: out }; }
/* the pop-up (a card for one place and one weekend): open only by its private link on the poster there, or a pass that place's printer printed */
/* every pop-up lives in the pops text: {pops:[{id, name, on, key, to, logos, donate, tips, animals}], tpl:[...]}; the first one, Milk Bar, may still be the old popOn/popKey pair */
async function popsOf(db) { const s = await settingsOf(db); let d = {}; try { d = s.pops ? JSON.parse(s.pops) : {}; } catch (e) { d = {}; } const l = Array.isArray(d.pops) ? d.pops : [];
  if (s.popKey && !l.some(p => p.id === 'milkbar')) l.unshift({ id: 'milkbar', name: 'Milk Bar', on: !!s.popOn, key: s.popKey }); return l; }
async function popFind(db, env, k, id) { if (typeof k !== 'string' || !k) return null; const l = (await popsOf(db)).filter(p => p && p.on);
  for (const p of l) if (typeof p.key === 'string' && p.key && k.length === p.key.length && await same(k, p.key)) return p;
  const ps = k.toUpperCase().replace(/\s+/g, ''); if (PASS.test(ps) && codeKey(env)) { const want = l.filter(p => p.id === id)[0] || (l.length === 1 ? l[0] : null); if (want && await passFind(db, env, ps)) return want; } return null; }
async function popOk(db, env, k, id) { return !!(await popFind(db, env, k, id)); }
/* the desk: the place hosting a pop-up looks after it by its own private link (p.desk), with no approval-page key: its words, logos, picture,
   tips, animals, open or closed, and whether prints are kept. Kept prints show there in colour; private ones are never written at all */
const POP_AN = ['frill', 'roo', 'dingo', 'emu', 'quokka', 'wombat', 'echidna', 'none'];
const popImg = (v, max) => typeof v === 'string' && v.length <= max && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v);
async function deskFind(db, d) { if (typeof d !== 'string' || !/^[a-z0-9]{12,40}$/.test(d)) return null; const s = await settingsOf(db); let doc = {}; try { doc = s.pops ? JSON.parse(s.pops) : {}; } catch (e) { doc = {}; }
  const l = Array.isArray(doc.pops) ? doc.pops : []; for (const p of l) if (p && typeof p.desk === 'string' && p.desk.length === d.length && await same(d, p.desk)) return { doc, p }; return null; }
/* the printers a place may choose between and look after from its desk: those the approval page ticked for it (p.allow), or the one it was given */
const deskAllow = p => { const l = (Array.isArray(p.allow) ? p.allow : []).filter(x => typeof x === 'string' && /^[a-z0-9-]{1,40}$/.test(x)); if (p.to && !l.includes(p.to)) l.unshift(p.to); return l.length ? l : ['novelglobal']; };
async function deskPrinters(db, p) { const out = []; for (const id of deskAllow(p)) { const r = await db.prepare(`SELECT id, name, seen, can, net, off, wifi, rst, token IS NOT NULL AS paired,
      (SELECT count(*) FROM jobs j WHERE j.printer = printers.id AND j.status IN ('queued', 'printing')) AS queued,
      (SELECT count(*) FROM jobs j WHERE j.printer = printers.id AND j.status = 'printed' AND j.done > ?) AS day FROM printers WHERE id = ?`).bind(now() - DAY, id).first(); if (!r) continue;
    let n = null; try { n = r.net ? JSON.parse(r.net) : null; } catch (e) { n = null; }
    out.push({ id: r.id, name: r.name || r.id, paired: !!r.paired, seen: r.seen || null, can: r.can || '', queued: r.queued || 0, day: r.day || 0, net: n ? { n: n.n, rssi: n.rssi == null ? null : n.rssi, at: n.at, ...(n.p === 0 || n.p === 1 ? { p: n.p } : {}) } : null, off: r.off || null, wifi: r.wifi || null, rst: r.rst || null }); } return out; }
const deskPosts = (db, id) => db.prepare("SELECT id, created FROM stories WHERE origin LIKE ? AND art IS NOT NULL AND gone IS NULL ORDER BY created DESC LIMIT 80").bind('{"pop":"' + String(id).replace(/[%_"\\]/g, '') + '"%').all();
async function deskGet(db, env, req, url) { if (await tooMany(db, env, req, 'desk', 120, 10 * 60e3)) return fail(429, 'too many');
  const f = await deskFind(db, url.searchParams.get('d') || ''); if (!f) return fail(404, 'closed'); const p = f.p, pub = {};
  ['id', 'name', 'on', 'key', 'to', 'logos', 'donate', 'tips', 'animals', 'promo', 'pimg', 'about'].forEach(k => { if (p[k] !== undefined) pub[k] = p[k]; }); pub.private = p.private !== false;
  const { results } = pub.private ? { results: [] } : await deskPosts(db, p.id);
  /* the private page, where there is one: its link and the few words that go on a slip with it, for the place to print and hand over */
  const st = await settingsOf(db), page = st.noteKey && st.note ? { k: st.noteKey, words: st.noteSlip || '' } : null;
  return json({ ok: true, pop: pub, posts: results.map(r => ({ id: r.id, at: r.created })), printers: await deskPrinters(db, p), now: now(), page }); }
async function deskArt(db, env, req, url, id) { const f = await deskFind(db, url.searchParams.get('d') || ''); if (!f || !env.MEDIA) return fail(404, 'closed');
  const r = await db.prepare('SELECT origin FROM stories WHERE id = ? AND gone IS NULL').bind(id).first(); let o = {}; try { o = JSON.parse((r && r.origin) || '{}'); } catch (e) { o = {}; } if (o.pop !== f.p.id) return fail(404, 'not found');
  const a = await env.MEDIA.get(`art/${id}`); if (!a) return fail(404, 'not found');
  return new Response(a.body, { headers: { 'content-type': 'image/jpeg', 'cache-control': 'private, max-age=3600', 'x-content-type-options': 'nosniff' } }); }
async function deskSet(db, env, req) { if (await tooMany(db, env, req, 'desk', 120, 10 * 60e3)) return fail(429, 'too many');
  const b = await body(req, 700e3), f = await deskFind(db, b.d || ''); if (!f) return fail(404, 'closed'); const p = f.p, v = b.set && typeof b.set === 'object' ? b.set : {}, txt = (x, n) => String(x == null ? '' : x).replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, n), web = x => typeof x === 'string' && /^https:\/\/[^\s<>"']{3,300}$/.test(x);
  /* TURN OFF and CHANGE WI-FI for one of its printers: handed to that printer's Pi the next time it asks, within two minutes */
  if (b.act === 'off' || b.act === 'wifi' || b.act === 'restart') { if (!deskAllow(p).includes(b.printer)) return fail(403, 'printer'); await db.prepare(`UPDATE printers SET ${b.act === 'restart' ? 'rst' : b.act} = ? WHERE id = ? AND token IS NOT NULL`).bind(now(), b.printer).run(); return json({ ok: true }); }
  if (typeof v.to === 'string') { if (!deskAllow(p).includes(v.to)) return fail(403, 'printer'); p.to = v.to; }
  if (typeof v.name === 'string' && txt(v.name, 40)) p.name = txt(v.name, 40);
  if (typeof v.on === 'boolean') p.on = v.on;
  if (typeof v.private === 'boolean') p.private = v.private;
  if (typeof v.promo === 'string') p.promo = txt(v.promo, 140);
  if (typeof v.about === 'string') p.about = txt(v.about, 400);
  if (v.pimg === '') delete p.pimg; else if (v.pimg !== undefined) { if (!popImg(v.pimg, 160e3)) return fail(400, 'picture'); p.pimg = v.pimg; }
  if (Array.isArray(v.logos)) { const L = []; for (const g of v.logos.slice(0, 4)) { const src = g && g.src; if (!(typeof src === 'string' && (/^pop\/[a-z0-9-]+\.png$/.test(src) || popImg(src, 90e3)))) return fail(400, 'logo'); L.push({ src, href: web(g.href) ? g.href : '' }); } p.logos = L; }
  if (v.donate === null) p.donate = null; else if (v.donate && typeof v.donate === 'object') { if (!web(v.donate.url)) return fail(400, 'link'); p.donate = { url: v.donate.url, label: txt(v.donate.label, 24) || 'DONATE' }; }
  if (v.tips === null) p.tips = null; else if (v.tips && typeof v.tips === 'object') { const by = {}; POP_AN.forEach(a => { const t = txt(v.tips.by && v.tips.by[a], 200); if (t) by[a] = t; }); p.tips = Object.keys(by).length ? { title: txt(v.tips.title, 24), by } : null; }
  if (Array.isArray(v.animals)) { const A = POP_AN.filter(a => v.animals.includes(a)); p.animals = A.length ? A : POP_AN.slice(); }
  /* WIPE: every print it kept, and each one's picture, gone for good */
  let wiped = 0; if (b.wipe === true) { const { results } = await db.prepare("SELECT id FROM stories WHERE origin LIKE ?").bind('{"pop":"' + String(p.id).replace(/[%_"\\]/g, '') + '"%').all();
    for (const r of results) { if (env.MEDIA) { try { await env.MEDIA.delete([`art/${r.id}`, photoKey(r.id), mediaKey(r.id)]); } catch (e) { /* none kept */ } } await db.batch([db.prepare('DELETE FROM jobs WHERE story = ?').bind(r.id), db.prepare('DELETE FROM stories WHERE id = ?').bind(r.id)]); wiped++; } }
  const out = JSON.stringify(f.doc); if (out.length > TEXTS.pops) return fail(413, 'too large');
  await db.prepare("INSERT INTO settings (k, v) VALUES ('pops', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v").bind(out).run();
  return json({ ok: true, wiped }); }
async function popGet(db, env, req, url) { if (await tooMany(db, env, req, 'pop', 40, 10 * 60e3)) return fail(429, 'too many');
  const p = await popFind(db, env, url.searchParams.get('k') || '', url.searchParams.get('p') || ''); if (!p) return fail(404, 'closed');
  const pub = {}; ['id', 'name', 'to', 'logos', 'donate', 'tips', 'animals', 'home', 'card', 'free', 'promo', 'pimg'].forEach(f => { if (p[f] !== undefined) pub[f] = p[f]; });
  pub.keep = p.private === false;
  const r = json({ ok: true, pop: pub }); if (typeof p.key === 'string' && /^[a-z0-9]{6,40}$/.test(p.key)) r.headers.append('set-cookie', 'pop=' + p.key + '; Path=/api; Max-Age=259200; HttpOnly; Secure; SameSite=Lax'); return r; }
/* a pass looked up: today's, at any island (or only the one named); its slot says where it was given out */
async function passFind(db, env, code, only) { const c = passNorm(code), day = melDay(); if (!PASS.test(c)) return null;
  const { results } = await (only ? db.prepare('SELECT id, name, number FROM printers WHERE id = ?').bind(only) : db.prepare("SELECT id, name, number FROM printers WHERE token IS NOT NULL OR id = 'novelglobal'")).all();
  for (const p of results) {
    if (c.length === 3) { const n = (await pass3Day(env, p.id, day)).get(c); if (n != null) return { p, day, code: c, slot: n }; }
    else if (await passMac(env, p.id, day, c.slice(0, 3)) === c.slice(3)) return { p, day, code: c.slice(0, 3) + '-' + c.slice(3) }; }
  return null; }
async function passUse(db, code, day, island) { await passTable(db); const r = await db.prepare('INSERT OR IGNORE INTO passes (code, day, island, used) VALUES (?, ?, ?, ?)').bind(island + ':' + code, day, island, now()).run(); return !!(r.meta && r.meta.changes); }
/* a pass asked for from a phone: the printer's own text and QR, so the code is only ever on the paper; 5 to 10 minutes apart, 10 a day per island */
const asksReady = new WeakMap();
const askTable = db => { if (!asksReady.has(db)) asksReady.set(db, db.prepare('CREATE TABLE IF NOT EXISTS asks (island TEXT NOT NULL, day TEXT NOT NULL, n INTEGER NOT NULL, next INTEGER NOT NULL, PRIMARY KEY (island, day))').run().catch(e => { asksReady.delete(db); throw e; })); return asksReady.get(db); };
function passSlip(name, mark, code, head) {
  const o = [], put = (...b) => o.push(...b), txt = s => put(...enc.encode(String(s).replace(/[^\x20-\x7E]/g, '')), 10), size = n => put(0x1D, 0x21, n);
  if (head) { o.push(...head); put(0x1B, 0x61, 1); } else { put(0x1B, 0x40, 0x1B, 0x61, 1); size(0x11); txt('PASS'); size(0); txt(String(name).toUpperCase().slice(0, 32)); txt('-'.repeat(32)); put(10); size(0x22); txt(mark.w); }
  put(10); size(0x33); txt(code); size(0); put(10);
  const d = enc.encode('https://novel.global/c#' + code.replace('-', '')), n = d.length + 3;
  put(0x1D, 0x28, 0x6B, 4, 0, 0x31, 0x41, 0x32, 0, 0x1D, 0x28, 0x6B, 3, 0, 0x31, 0x43, 6, 0x1D, 0x28, 0x6B, 3, 0, 0x31, 0x45, 0x31, 0x1D, 0x28, 0x6B, n & 0xFF, n >> 8, 0x31, 0x50, 0x30, ...d, 0x1D, 0x28, 0x6B, 3, 0, 0x31, 0x51, 0x30);
  put(10); size(0x01); txt('novel.global/c'); size(0); put(0x1B, 0x64, 4, 0x1D, 0x56, 0x42, 0);
  let s = ''; for (let i = 0; i < o.length; i += 0x8000) s += String.fromCharCode(...o.slice(i, i + 0x8000)); return btoa(s);
}
async function passAsk(db, env, req) {
  if (!codeKey(env)) return fail(503, 'passes');
  const b = await body(req, 512), id = String(b.ask || ''); if (!/^[a-z0-9-]{1,40}$/.test(id)) return fail(400, 'ask');
  const p = await db.prepare("SELECT id, name, seen, ways FROM printers WHERE id = ? AND (token IS NOT NULL OR id = 'novelglobal')").bind(id).first(); if (!p) return fail(404, 'no such island');
  { const pw = waysOf(p); if (pw && !pw.includes('print')) return fail(403, 'not here'); }
  await askTable(db); const t = now(), day = melDay(t), a = await db.prepare('SELECT n, next FROM asks WHERE island = ? AND day = ?').bind(id, day).first();
  if (a && a.n >= 10) return fail(429, 'today');
  if (a && t < a.next) return fail(429, 'just printed');
  if (await tooMany(db, env, req, 'passask', 4, 60 * 60e3)) return fail(429, 'too many');
  const { q } = await db.prepare("SELECT count(*) AS q FROM jobs WHERE printer = ? AND status IN ('held', 'queued', 'printing')").bind(id).first(); if (q >= LIMIT.perPrinter) return fail(503, 'its queue is full');
  const m = await passMake(db, env, id, 1);
  await db.batch([db.prepare('INSERT INTO asks (island, day, n, next) VALUES (?, ?, 1, ?) ON CONFLICT(island, day) DO UPDATE SET n = n + 1, next = excluded.next').bind(id, day, t + Math.round((5 + Math.random() * 5) * 60e3)), db.prepare("INSERT INTO jobs (id, printer, code, escpos, status, created) VALUES (?, ?, 'DA-PASS', ?, 'queued', ?)").bind(rid(), id, passSlip(p.name || id, m.mark, m.passes[0]), t), db.prepare('UPDATE printers SET warm = ? WHERE id = ?').bind(t, id)]);
  return json({ ok: true, name: p.name || id, ready: !!p.seen && t - p.seen < 120e3 });
}
async function codeRead(db, env, req, raw) {
  if (await tooMany(db, env, req, 'code', 40, 10 * 60e3)) return fail(429, 'too many');
  const c = String(raw || '').toUpperCase().replace(/\s+/g, '').slice(0, 12), at = /^[a-z0-9-]{1,40}$/.test(new URL(req.url).searchParams.get('at') || '') ? new URL(req.url).searchParams.get('at') : '';
  if (/^DA-?[0-9A-HJKMNP-TV-Z]{4}$/.test(c)) { const code = 'DA-' + c.replace(/^DA-?/, ''); const r = await db.prepare("SELECT 1 FROM stories WHERE code = ? AND status = 'shown' AND gone IS NULL").bind(code).first();
    return r ? json({ kind: 'wish', code, go: '/#n=' + code }) : fail(404, 'not found'); }
  if (/^PL-?[A-Z2-9]{4}$/.test(c)) { const code = 'PL-' + c.replace(/^PL-?/, ''); const r = await db.prepare("SELECT 1 FROM stories WHERE kind = 'play' AND status = 'shown' AND gone IS NULL AND code = ?").bind(code).first();
    return r || code === FIRST_PLAY.code ? json({ kind: 'play', code, go: '/play.html?c=' + code }) : fail(404, 'not found'); }
  if (PASS.test(passNorm(c)) && codeKey(env)) { const f = await passFind(db, env, c, at); if (!f) return fail(404, 'not found'); await passTable(db);
    const u = await db.prepare('SELECT used FROM passes WHERE code = ? AND day = ?').bind(f.p.id + ':' + f.code, f.day).first();
    return json({ kind: 'pass', code: f.code, island: f.p.id, name: f.p.name || f.p.id, number: f.p.number || null, used: !!u, mark: await markOf(env, f.p.id, f.day) }); }
  if (/^[A-HJKMNP-TV-Z]{3}$/.test(c) && codeKey(env)) { const q = quarterOf();
    for (const id of await cartIds(env)) if (await cartCode(env, id, q) === c) return json({ kind: 'cart', code: c, id, go: '/x#' + id });
    return fail(404, 'not found'); }
  if (/^\d{3}$/.test(c)) return fail(404, 'type it on the island');
  return fail(404, 'not found');
}
async function api(req, env, url, ctx) {
  tally(url, req.method); settle(env, ctx);
  if (url.pathname === '/api/beat') return new Response(null, { status: 204, headers: TEXT_H });
  if (url.pathname === '/api/img' && req.method === 'GET') return imgThrough(url);
  if (url.pathname === '/api/snd' && req.method === 'GET') return sndThrough(url);
  if (url.pathname.startsWith('/api/inat/') && req.method === 'GET') return inatThrough(url);
  if (url.pathname === '/api/wx' && req.method === 'GET') return wxThrough(url);
  if (url.pathname === '/api/news' && req.method === 'GET') return newsThrough();
  if (url.pathname === '/api/book' && req.method === 'GET') return bookThrough(url);
  if (url.pathname === '/api/c' && req.method === 'GET') return cartFor(env, url);
  const db = dbOf(env); if (!db) return fail(503, 'no database');
  await ready(db); if (Math.random() < 0.05) await tidy(db, env);
  const p = url.pathname.replace(/^\/api\//, '').split('/').filter(Boolean).map(decodeURIComponent); const m = req.method;
  if (p[0] === 'stories' && !p[1] && m === 'GET') return listStories(db, url);
  if (p[0] === 'stories' && !p[1] && m === 'POST') return send(db, env, req);
  if (p[0] === 'stories' && p[1] && m === 'GET') return CODE.test(p[1]) ? oneStory(db, p[1]) : fail(400, 'code');
  if (p[0] === 'receipts' && p[1] && m === 'GET') return receipt(db, p[1]);
  if (p[0] === 'c' && p[1] && !p[2] && m === 'GET') return codeRead(db, env, req, p[1]);
  if (p[0] === 'c' && !p[1] && m === 'POST') return passAsk(db, env, req);
  if (p[0] === 'plays' && !p[1] && m === 'GET') return playList(db, url);
  if (p[0] === 'plays' && p[1] === 'mine' && !p[2] && m === 'GET') return playMine(db, url);
  if (p[0] === 'plays' && p[1] && p[2] === 'like' && m === 'POST') return playLike(db, env, req, p[1]);
  if (p[0] === 'plays' && p[1] && p[2] === 'edit' && m === 'POST') return playEdit(db, env, req, p[1]);
  if (p[0] === 'plays' && !p[1] && m === 'POST') return playSend(db, env, req);
  if (p[0] === 'maker' && !p[1] && m === 'POST') return makerPass(db, env, req);
  if (p[0] === 'stamp' && !p[1] && m === 'POST') return stampPost(db, env, req);
  if (p[0] === 'home' && !p[1] && m === 'POST') return homePost(db, env, req);
  if (p[0] === 'gift' && !p[1] && m === 'POST') return giftPost(db, env, req);
  if (p[0] === 'link' && !p[1] && m === 'POST') return linkSet(db, env, req);
  if (p[0] === 'plays' && p[1] && !p[2] && m === 'GET') return playOne(db, p[1]);
  if (p[0] === 'plays' && p[1] && p[2] === 'art' && m === 'GET') return playPic(db, p[1]);
  if (p[0] === 'talk' && !p[1] && m === 'GET') return talkList(db, env, req, url);
  if (p[0] === 'talk' && !p[1] && m === 'POST') return talkSay(db, env, req);
  if (p[0] === 'live' && !p[1] && m === 'POST') return live(db, env, req);
  if (p[0] === 'tapes' && !p[1] && m === 'POST') return tapeUp(db, env, req, url);
  if (p[0] === 'tapes' && p[1] && !p[2] && m === 'GET') return tapeGet(db, env, p[1]);
  if (p[0] === 'mine' && p[1] && !p[3] && (m === 'GET' && !p[2] || m === 'POST' && p[2])) return mine(db, env, req, p[1], p[2]);
  if (p[0] === 'photos' && p[1] && m === 'GET') return photo(db, env, p[1], false);
  if (p[0] === 'partners' && m === 'GET') return partners(db);
  if (p[0] === 'isles' && m === 'GET') return isles(db);
  /* the joined slip's words, for a printer that has just joined a Wi-Fi: plain lines a receipt can print */
  if (p[0] === 'welcome' && m === 'GET') { let w = null; try { w = JSON.parse((await settingsOf(db)).welcome || 'null'); } catch (e) { w = null; } w = w && typeof w === 'object' ? w : WELCOME;
    const a = s => String(s == null ? '' : s).normalize('NFKD').replace(/[^\x20-\x7e]/g, '').slice(0, 42);
    return json({ on: w.on !== false, head: a(w.head || ''), url: /^https:\/\/[^\s]{1,200}$/.test(w.url || '') ? w.url : '', lines: (Array.isArray(w.lines) ? w.lines : []).slice(0, 40).map(a) }); }
  if (p[0] === 'osm' && !p[1] && m === 'GET') return osmThrough(db, env, req, url);
  if (p[0] === 'places' && !p[1] && m === 'GET') return listPlaces(db);
  if (p[0] === 'places' && !p[1] && m === 'POST') return suggestPlace(db, env, req);
  if (p[0] === 'posts' && !p[1] && m === 'GET') return listPosts(db);
  if (p[0] === 'posts' && p[1] && p[2] === 'cover' && m === 'GET') return postCover(db, env, p[1], false);
  if (p[0] === 'posts' && p[1] && !p[2] && m === 'GET') return onePost(db, p[1], false);
  if (p[0] === 'settings' && m === 'GET') { const s = await settingsOf(db), noteK = s.notePub === '1' && s.note && s.noteKey ? s.noteKey : ''; HIDDEN_TEXTS.forEach(k => { delete s[k]; }); return json({ ...s, ...(noteK ? { noteK } : {}), cfsite: env.TURNSTILE_SITE || '', media: !!env.MEDIA, calm: levelOf() }); }
  /* a private page: words kept on the approval page, read only by their own link; never kept by a browser, never in a backup, never listed */
  if (p[0] === 'note' && !p[1] && m === 'GET') { if (await tooMany(db, env, req, 'note', 40, 10 * 60e3)) return fail(429, 'too many'); const st = await settingsOf(db), k = url.searchParams.get('k') || '';
    if (!st.noteKey || !st.note || k.length !== st.noteKey.length || !(await same(k, st.noteKey))) return fail(404, 'not found');
    return new Response(st.note, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow, noarchive', 'x-content-type-options': 'nosniff' } }); }
  if (p[0] === 'pop' && !p[1] && m === 'GET') return popGet(db, env, req, url);
  if (p[0] === 'pop' && p[1] === 'desk' && !p[2] && m === 'GET') return deskGet(db, env, req, url);
  if (p[0] === 'pop' && p[1] === 'desk' && !p[2] && m === 'POST') return deskSet(db, env, req);
  if (p[0] === 'pop' && p[1] === 'desk' && p[2] === 'art' && p[3] && m === 'GET') return deskArt(db, env, req, url, p[3]);
  if (p[0] === 'example' && m === 'GET') return exampleBoard(db);
  if (p[0] === 'species' && !p[1] && m === 'POST') return learnKinds(db, env, req);
  if (p[0] === 'posters' && !p[1] && m === 'GET') return posters(db);
  if (p[0] === 'posters' && p[1] && !p[2] && m === 'GET') return posterArt(db, env, p[1], false);
  /* someone has set out towards a print: every printer asks quickly for the next few minutes (at most one write a minute from each copy) */
  if (p[0] === 'warm' && !p[1] && m === 'POST') { if (now() - USE.warmAt > 60e3) { USE.warmAt = now(); await db.prepare('UPDATE printers SET warm = ? WHERE token IS NOT NULL OR touch IS NOT NULL').bind(now()).run(); } return new Response(null, { status: 204, headers: TEXT_H }); }
  if (p[0] === 'film' && !p[1] && m === 'POST') return filmAsk(db, env, req);
  if (p[0] === 'film' && p[1] && !p[2] && m === 'GET') return filmPlay(db, env, req, p[1]);
  /* a receiver set up under an id its printer no longer goes by is known by its token */
  if ((p[0] === 'printers' || p[0] === 'touch') && p[1] && bearer(req) && !(await db.prepare('SELECT 1 FROM printers WHERE id = ?').bind(p[1]).first())) { const r = await db.prepare(`SELECT id FROM printers WHERE ${p[0] === 'touch' ? 'touch' : 'token'} = ?`).bind(await sha256(bearer(req))).first(); if (r) p[1] = r.id; }
  if (p[0] === 'printers' && p[1] && p[2] === 'next' && m === 'GET') return next(db, env, req, p[1]);
  if (p[0] === 'printers' && p[1] && p[2] === 'used' && !p[3] && m === 'POST') return usedOff(db, env, req, p[1]);
  if (p[0] === 'printers' && p[1] && p[2] === 'jobs' && p[3] && m === 'POST') return report(db, req, p[1], p[3]);
  if (p[0] === 'pair' && !p[1] && m === 'POST') return pairAsk(db, env, req);
  if (p[0] === 'pair' && p[1] === 'poll' && !p[2] && m === 'POST') return pairPoll(db, env, req);
  if (p[0] === 'island' && !p[1] && (m === 'GET' || m === 'POST')) return keeper(db, env, req);
  if (p[0] === 'island' && p[1] === 'pics' && p[2] && !p[3] && (m === 'PUT' || m === 'DELETE')) return keeperPic(db, env, req, p[2]);
  if (p[0] === 'cards' && !p[1] && m === 'GET') return cardList(db);
  if (p[0] === 'cards' && p[1] && p[2] && !p[3] && m === 'GET') return cardPic(db, env, p[1], p[2]);
  if (p[0] === 'touch' && p[1] && !p[2] && m === 'GET') return touchList(db, req, p[1], env);
  if (p[0] === 'touch' && p[1] && p[2] && m === 'POST') return touchAct(db, env, req, p[1], p[2]);
  if (p[0] === 'admin') return admin(db, env, req, p.slice(1));
  return fail(404, 'not found');
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/health') return new Response(`ok ${BUILD}${PREVIEW ? ' preview' : ''}`, { headers: TEXT_H });
    if (url.pathname.startsWith('/api/')) {
      /* the app's own pages only: a request from another site is refused */
      const origin = request.headers.get('origin'); if (origin && request.method !== 'GET' && origin !== url.origin) return fail(403, 'origin');
      try { return await api(request, env, url, ctx); } catch (e) { return fail(e.status || 500, e.status ? e.message : 'error'); }
    }
    /* a pop-up's link under an address that is no longer a page still opens the pop-up */
    const res = await env.ASSETS.fetch(request);
    if (res.status === 404 && request.method === 'GET' && url.searchParams.get('k') && /^\/[a-z0-9-]{1,40}$/.test(url.pathname)) return Response.redirect(url.origin + '/popup' + url.search, 302);
    return res;
  },
};

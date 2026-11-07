/* A board to a slip: the engine's print steps, in plain JavaScript, as front's worker runs them.
   engine/slip (Go) does the same, byte for byte; fixtures/golden holds what both must give.
   compile({ board, press, jacks, mods, state, settings, on, printer }) -> Uint8Array of ESC/POS
   mods: [{ ...mod.json, slip: <the slip itself> }], jacks: { letter: 'id@major' }, printer: { dpi, dots, cutter } */

const BAYER = [
  [0, 32, 8, 40, 2, 34, 10, 42], [48, 16, 56, 24, 50, 18, 58, 26], [12, 44, 4, 36, 14, 46, 6, 38], [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41], [51, 19, 59, 27, 49, 17, 57, 25], [15, 47, 7, 39, 13, 45, 5, 37], [63, 31, 55, 23, 61, 29, 53, 21]];
/* bytes a QR of each version holds, byte mode, error level M; the printer picks the smallest that fits */
const QR_CAP = [14, 26, 42, 62, 84, 106, 122, 152, 180, 213, 251, 287, 331, 362, 412, 450, 504, 560, 624, 666];
const LINE = 30, BIG = 54, HOME = 'https://novel.global/#b=';
const LENGTH_MM = { poster: 150, strip: 300 };
const TAKES = { picture: 'PICTURE', words: 'WORDS', list: 'LIST' };

/* printable ASCII only, spaces folded, cut to n */
export function clean(s, n) {
  let out = '';
  for (const ch of typeof s === 'string' ? s : '') { const c = ch.codePointAt(0); out += c === 9 || c === 10 || c === 13 ? ' ' : c >= 32 && c <= 126 ? ch : '?'; }
  out = out.split(' ').filter(Boolean).join(' ');
  return out.slice(0, n);
}

export function boardCode(s) {
  const pairs = (typeof s === 'string' ? s : '').replace(/[a-z]/g, c => c.toUpperCase()).replace(/[ \t\r\n\f\v]/g, '').split('/').filter(p => /^[A-Z0-9]{2}$/.test(p));
  return pairs.slice(0, 4).join('/');
}

function wrap(text, w) {
  const lines = []; let line = '';
  for (let word of text.split(' ')) {
    while (word.length > w) { if (line) { lines.push(line); line = ''; } lines.push(word.slice(0, w)); word = word.slice(w); }
    if (!word) continue;
    if (!line) line = word; else if (line.length + 1 + word.length <= w) line += ' ' + word; else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

const byId = (mods, ref) => {
  const [id, major] = ref.split('@');
  return mods.filter(m => m.id === id && (!major || m.version.split('.')[0] === major)).sort((a, b) => cmp(b.version, a.version))[0];
};
const cmp = (a, b) => { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };

/* what arrives at the pressed mod, element by element: its own, then its needs, then each cable in the board's order */
export function arrivals(input) {
  const { board, press, jacks = {}, mods, state = {}, on = {} } = input;
  const me = mods.find(m => m.id === press);
  const q = { WORDS: [], PICTURE: [], SOUND: [], CODE: [], LIST: [], LENGTH: [] };
  if (!me) return { me, q };
  const own = state[me.id] || {};
  for (const e of Object.keys(q)) if (own[e] != null) q[e].push(own[e]);
  const seen = new Set([me.id]);
  const open = m => m.island === me.island || (on[m.island] || []).includes(m.connection);
  const hand = m => { for (const e of Object.keys(q)) if (m.gives.includes(e) && me.takes.includes(e) && (state[m.id] || {})[e] != null) q[e].push(state[m.id][e]); };
  const need = m => { for (const r of m.needs || []) { const n = byId(mods, r); if (!n || seen.has(n.id)) continue; seen.add(n.id); if (!open(n)) continue; hand(n); need(n); } };
  need(me);
  const mine = Object.keys(jacks).filter(k => { const m = byId(mods, jacks[k]); return m && m.id === me.id; });
  for (const p of boardCode(board).split('/').filter(Boolean)) {
    const [a, b] = p; if (a === b) continue;
    const far = mine.includes(a) ? b : mine.includes(b) ? a : null; if (!far || !jacks[far]) continue;
    const m = byId(mods, jacks[far]); if (!m || seen.has(m.id)) continue;
    seen.add(m.id); if (open(m)) hand(m);
  }
  return { me, q };
}

export function compile(input) {
  const { board, settings = {}, printer } = input;
  const { me, q } = arrivals(input);
  const out = [], put = (...b) => { for (const x of b) if (typeof x === 'string') for (let i = 0; i < x.length; i++) out.push(x.charCodeAt(i)); else if (Array.isArray(x)) out.push(...x); else out.push(x); };
  const D = printer.dots, C = Math.floor(D / 12);
  let h = 0;
  put(0x1b, 0x40, 0x1b, 0x33, LINE);
  const set = me ? (k) => { const s = (settings[me.id] || {})[k]; if (s !== undefined) return s; const d = (me.settings || []).find(x => x.key === k); return d ? d.default : undefined; } : () => undefined;
  const slip = me ? me.slip : { blocks: [] };
  const length = ['slip', 'poster', 'strip'].includes(q.LENGTH[0]) ? q.LENGTH[0] : slip.length || 'slip';
  const large = length !== 'slip';
  const qr = (data, m) => {
    const d = clean(data, 250); if (!d) return false;
    const n = d.length + 3;
    put(0x1b, 0x61, 1, 0x1d, 0x28, 0x6b, 4, 0, 0x31, 0x41, 0x32, 0, 0x1d, 0x28, 0x6b, 3, 0, 0x31, 0x43, m, 0x1d, 0x28, 0x6b, 3, 0, 0x31, 0x45, 0x31,
      0x1d, 0x28, 0x6b, n & 255, n >> 8, 0x31, 0x50, 0x30, d, 0x1d, 0x28, 0x6b, 3, 0, 0x31, 0x51, 0x30, 0x0a);
    let v = QR_CAP.findIndex(c => c >= d.length) + 1; if (v < 1) v = QR_CAP.length;
    h += (17 + 4 * v) * m + LINE;
    return true;
  };
  const centre = t => { put(0x1b, 0x61, 1, t, 0x0a); h += LINE; };
  let shown = 0;
  for (const b of slip.blocks) {
    if (b.if && set(b.if) !== true) continue;
    if (b.block === 'rule') { put(0x1b, 0x61, 0, '-'.repeat(C), 0x0a); h += LINE; continue; }
    if (b.block === 'space') { const n = b.lines || 1; put(0x1b, 0x64, n); h += n * LINE; continue; }
    const e = b.block === 'code' ? b.take || 'CODE' : TAKES[b.block];
    if (!e) continue;
    const typed = b.block === 'words' && b.setting && typeof set(b.setting) === 'string' ? clean(set(b.setting), 22) : '';
    const v = b.block === 'words' && (b.fixed || typed) ? undefined : q[e].shift();
    if (b.block === 'words') {
      const t = typed || clean(typeof v === 'string' ? v : '', 22) || clean(b.text, 22);
      if (!t) continue;
      const big = large || b.size === 'big';
      put(0x1b, 0x61, b.align === 'left' ? 0 : 1);
      if (big) put(0x1d, 0x21, 0x11, 0x1b, 0x33, BIG);
      for (const l of wrap(t, big ? Math.floor(C / 2) : C)) { put(l, 0x0a); h += big ? BIG : LINE; }
      if (big) put(0x1d, 0x21, 0, 0x1b, 0x33, LINE);
      shown++;
    } else if (b.block === 'picture') {
      if (!v || typeof v !== 'object' || !Number.isInteger(v.w) || !Number.isInteger(v.h) || v.w < 1 || v.h < 1 || v.w > 2048 || v.h > 2048 || typeof v.grey !== 'string') continue;
      if (v.grey.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(v.grey)) continue;
      const grey = Uint8Array.from(atob(v.grey), c => c.charCodeAt(0)); if (grey.length < v.w * v.h) continue;
      const tw = Math.floor(D * (b.width || 1) / 8) * 8, th = Math.min(1200, Math.floor(v.h * tw / v.w)); if (!th) continue;
      const heavy = b.ink && set(b.ink) === true, wb = tw / 8;
      put(0x1b, 0x61, 1);
      for (let y0 = 0; y0 < th; y0 += 128) {
        const rows = Math.min(128, th - y0);
        put(0x1d, 0x76, 0x30, 0, wb & 255, wb >> 8, rows & 255, rows >> 8);
        for (let y = y0; y < y0 + rows; y++) {
          const sy = Math.floor(y * v.h / th);
          for (let xb = 0; xb < wb; xb++) {
            let byte = 0;
            for (let bit = 0; bit < 8; bit++) {
              const x = xb * 8 + bit, g0 = grey[sy * v.w + Math.floor(x * v.w / tw)], g = heavy ? Math.floor(g0 * 3 / 4) : g0;
              if (g < BAYER[y % 8][x % 8] * 4 + 2) byte |= 0x80 >> bit;
            }
            put(byte);
          }
        }
      }
      h += th; shown++;
    } else if (b.block === 'list') {
      if (!Array.isArray(v)) continue;
      const w = C - 4, items = v.slice(0, b.max || 5).map(x => typeof x === 'string' ? { text: x } : x && typeof x === 'object' && !Array.isArray(x) && typeof x.text === 'string' ? x : { text: '' }).filter(x => clean(x.text, w));
      if (!items.length) continue;
      put(0x1b, 0x61, 0);
      for (const x of items) { put((x.done === true ? '[x] ' : '[ ] ') + clean(x.text, w), 0x0a); h += LINE; }
      shown++;
    } else if (b.block === 'code') {
      const o = typeof v === 'string' ? { code: v } : v && typeof v === 'object' && !Array.isArray(v) ? v : null;
      if (!o) continue;
      const title = e === 'SOUND' ? clean(o.title, C) : '';
      if (title) centre(title);
      const drawn = qr(typeof o.url === 'string' && o.url ? o.url : o.code, 4);
      const c = drawn ? clean(o.code, C) : ''; if (c) centre(c);
      if (title || drawn) shown++;
    }
  }
  if (!shown) centre('*  *  *');
  const target = LENGTH_MM[length] ? Math.floor(LENGTH_MM[length] * printer.dpi * 10 / 254) : 0;
  for (let rem = target - h; rem > 0; rem -= 255) put(0x1b, 0x4a, Math.min(255, rem));
  const code = boardCode(board);
  if (code) { put(0x1b, 0x61, 1, 0x0a); qr(HOME + code, 3); put(0x1b, 0x61, 1, code, 0x0a); }
  if (printer.cutter === 'none') put(0x1b, 0x64, 4); else put(0x1d, 0x56, printer.cutter === 'full' ? 0x41 : 0x42, 0);
  return Uint8Array.from(out);
}

export const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').replace(/(.{64})/g, '$1\n').trim() + '\n';

/* A pretend printer: ESC/POS bytes in, the paper they would make out, as a greyscale PNG. No printer, no packages.
   Reads what islands print: one-bit raster (GS v 0), the sixteen greys (GS ( L: four one-bit layers stored, then printed), feeds,
   cuts, and text (drawn as pale blocks, so the layout shows; the printer's own font is not copied here).
   node tools/see.mjs slip.bin [out.png] [--order a|b]     (order: how the greys' four layers carry the darkness; b as the engine sends) */
import fs from 'node:fs';
import zlib from 'node:zlib';

const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = b => { let c = 0xFFFFFFFF; for (const x of b) c = CRC[(c ^ x) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
const chunk = (type, data) => { const t = Buffer.from(type, 'latin1'), len = Buffer.alloc(4), crc = Buffer.alloc(4);
  len.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([t, data]))); return Buffer.concat([len, t, data, crc]); };

/* a greyscale PNG of rows (0 black to 255 paper) */
export function png(rows, W) {
  const raw = Buffer.alloc(rows.length * (W + 1)); rows.forEach((r, y) => { raw[y * (W + 1)] = 0; Buffer.from(r).copy(raw, y * (W + 1) + 1); });
  const hd = Buffer.alloc(13); hd.writeUInt32BE(W, 0); hd.writeUInt32BE(rows.length, 4); hd[8] = 8; hd[9] = 0;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), chunk('IHDR', hd), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

/* the paper: rows of darkness made white-is-255, the width the printer's grid (512 for 80 mm at 180 dpi), and what was not understood */
export function see(bytes, { width = 512, order = 'b' } = {}) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes), rows = [], unknown = [];
  let i = 0, x = 0, align = 0, store = null, cuts = 0;
  const blank = () => new Uint8Array(width).fill(255);
  const line = h => { for (let k = 0; k < h; k++) rows.push(blank()); };
  let text = [];
  const flushText = () => { if (!text.length) return; const n = text.length, cw = 12, w = Math.min(width, n * cw), x0 = align === 1 ? (width - w) >> 1 : align === 2 ? width - w : 0;
    for (let y = 0; y < 24; y++) { const r = blank(); if (y >= 4 && y < 20) for (let c = 0; c < n; c++) if (text[c] !== 0x20) for (let k = 1; k < cw - 1; k++) { const xx = x0 + c * cw + k; if (xx < width) r[xx] = 200; } rows.push(r); }
    text = []; x = 0; };
  const put = (w, h, dark) => { /* dark(x, y) 0 to 15 */ const x0 = align === 1 ? Math.max(0, (width - w) >> 1) : align === 2 ? Math.max(0, width - w) : 0;
    for (let y = 0; y < h; y++) { const r = blank(); for (let xx = 0; xx < w && x0 + xx < width; xx++) r[x0 + xx] = 255 - Math.round(dark(xx, y) * 17); rows.push(r); } };
  while (i < b.length) {
    const c = b[i];
    if (c === 0x0A) { if (text.length) flushText(); else line(30); i++; continue; }
    if (c === 0x0D || c === 0x00) { i++; continue; }
    if (c >= 0x20 && c < 0x7F) { text.push(c); i++; if (text.length * 12 >= width) flushText(); continue; }
    if (c === 0x1B) { const d = b[i + 1];
      if (d === 0x40) { align = 0; i += 2; continue; }                      // ESC @ reset
      if (d === 0x61) { align = b[i + 2] % 48; i += 3; continue; }           // ESC a align
      if (d === 0x64) { flushText(); line(30 * b[i + 2]); i += 3; continue; } // ESC d feed n lines
      if (d === 0x4A) { flushText(); line(b[i + 2]); i += 3; continue; }      // ESC J feed n dots
      if (d === 0x33 || d === 0x74 || d === 0x21 || d === 0x45 || d === 0x2D || d === 0x4D || d === 0x47 || d === 0x20) { i += 3; continue; }
      if (d === 0x32) { i += 2; continue; }
      unknown.push('ESC ' + d.toString(16)); i += 2; continue; }
    if (c === 0x1D) { const d = b[i + 1];
      if (d === 0x76 && b[i + 2] === 0x30) {                                   // GS v 0: one-bit raster
        flushText(); const bw = b[i + 4] | b[i + 5] << 8, h = b[i + 6] | b[i + 7] << 8, at = i + 8;
        put(bw * 8, h, (xx, y) => (b[at + y * bw + (xx >> 3)] >> (7 - (xx & 7)) & 1) * 15); i = at + bw * h; continue; }
      if (d === 0x28 && b[i + 2] === 0x4C) {                                   // GS ( L graphics
        const n = b[i + 3] | b[i + 4] << 8, at = i + 5, fn = b[at + 1];
        if (fn === 0x70) { const tone = b[at + 2], col = b[at + 5], w = b[at + 6] | b[at + 7] << 8, h = b[at + 8] | b[at + 9] << 8, bw = (w + 7) >> 3;
          if (!store || store.w !== w || store.h !== h) store = { w, h, layers: {} };
          store.layers[col] = b.subarray(at + 10, at + 10 + bw * h); store.tone = tone; }
        else if (fn === 0x32 && store) { flushText(); const s = store, bw = (s.w + 7) >> 3;
          if (s.tone === 0x34) put(s.w, s.h, (xx, y) => { let v = 0; for (let k = 0; k < 4; k++) { const L = s.layers[0x31 + k]; if (L && (L[y * bw + (xx >> 3)] >> (7 - (xx & 7)) & 1)) v |= 1 << (order === 'a' ? k : 3 - k); } return v; });
          else { const L = s.layers[0x31]; put(s.w, s.h, (xx, y) => L && (L[y * bw + (xx >> 3)] >> (7 - (xx & 7)) & 1) ? 15 : 0); }
          store = null; }
        i = at + n; continue; }
      if (d === 0x28) { const n = b[i + 3] | b[i + 4] << 8; i += 5 + n; continue; }  // GS ( K speed and parts, and the rest of the GS ( family
      if (d === 0x56) { flushText(); cuts++; const m = b[i + 2]; if (m === 0x41 || m === 0x42) { line(b[i + 3]); i += 4; } else i += 3; continue; } // GS V cut
      if (d === 0x21 || d === 0x42 || d === 0x48 || d === 0x66 || d === 0x68 || d === 0x77 || d === 0x4C && false) { i += 3; continue; }
      unknown.push('GS ' + d.toString(16)); i += 2; continue; }
    unknown.push('0x' + c.toString(16)); i++;
  }
  flushText();
  return { rows, width, cuts, unknown };
}

if (import.meta.url === 'file://' + process.argv[1]) {
  const args = process.argv.slice(2), order = args.includes('--order') ? args[args.indexOf('--order') + 1] : 'b', files = args.filter((a, k) => !a.startsWith('--') && args[k - 1] !== '--order');
  const [inp, out = inp.replace(/\.[a-z]+$/i, '') + '.png'] = files, r = see(fs.readFileSync(inp), { order });
  fs.writeFileSync(out, png(r.rows, r.width));
  console.log(`${out}: ${r.width} x ${r.rows.length} dots (${(r.rows.length / 180 * 25.4).toFixed(0)} mm), ${r.cuts} cut${r.cuts === 1 ? '' : 's'}${r.unknown.length ? ', not understood: ' + [...new Set(r.unknown)].join(' ') : ''}`);
}

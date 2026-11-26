/* An island's signed entry, checked: a second making of kit/island/ident.go's check, in plain JavaScript, so anyone can check
   an entry with nothing but this file (node, or any browser on a secure page, with Web Crypto's Ed25519).
   node tools/entry.mjs                       the shared cases (fixtures/entry.json): both makings must agree
   node tools/entry.mjs http://10.42.0.1      an island's own entry, fetched and checked
   node tools/entry.mjs entry.json            one kept as a file (a copy from any site, or read off a slip's QR)
   The format, island/entry/0: { entry: "<JSON, exactly the bytes signed>", sig: "<Ed25519 signature, base64url>" }, the entry holding
   v, key (the island's public key, base64url), name, printer, greys, paper, cards, open, at and until (seconds; until at most 90 days on) */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const FORMAT = 'island/entry/0';
const d64 = s => Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64');

/* 'ok', 'sig' (not this key's), 'format' (not an entry, or holds too long) or 'expired', and the entry */
export function verify(signed, now = Date.now() / 1000) {
  let e; try { e = JSON.parse(signed.entry); } catch { return { why: 'format' }; }
  if (!e || e.v !== FORMAT || typeof e.key !== 'string' || typeof signed.sig !== 'string') return { why: 'format', e };
  const pub = d64(e.key), sig = d64(signed.sig);
  if (pub.length !== 32 || sig.length !== 64) return { why: 'format', e };
  const key = crypto.createPublicKey({ key: { kty: 'OKP', crv: 'Ed25519', x: e.key }, format: 'jwk' });
  if (!crypto.verify(null, Buffer.from(signed.entry, 'utf8'), key, sig)) return { why: 'sig', e };
  if (!(e.until > e.at) || e.until - e.at > 90 * 24 * 3600) return { why: 'format', e };
  if (now > e.until) return { why: 'expired', e };
  return { why: 'ok', e };
}

/* the eight letters a slip shows for a key: the same key, the same mark */
export function mark(key) { const h = crypto.createHash('sha256').update(d64(key)).digest().subarray(0, 5); let bits = '', s = '';
  for (const b of h) bits += b.toString(2).padStart(8, '0'); for (let i = 0; i < 40; i += 5) s += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[parseInt(bits.slice(i, i + 5), 2)]; return s.slice(0, 4) + '-' + s.slice(4); }

if (import.meta.url === 'file://' + process.argv[1]) {
  const arg = process.argv[2];
  if (!arg) {
    const f = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'entry.json'), 'utf8')), bad = [];
    for (const c of f.cases) { const now = c.name === 'run out' ? f.now + 30 * 24 * 3600 : f.now, got = verify(c.signed, now).why; if (got !== c.want) bad.push(`${c.name}: ${got}, want ${c.want}`); }
    const good = f.cases.find(c => c.want === 'ok'); if (mark(JSON.parse(good.signed.entry).key) !== f.mark) bad.push(`the key's mark: ${mark(JSON.parse(good.signed.entry).key)}, the island says ${f.mark}`);
    if (bad.length) { console.error('entries:\n  ' + bad.join('\n  ')); process.exit(1); }
    console.log(`entries: ${f.cases.length} cases, as the island checks them`);
  } else {
    const s = /^https?:/.test(arg) ? await (await fetch(arg.replace(/\/$/, '') + (/entry\.json$/.test(arg) ? '' : '/entry.json'))).json() : JSON.parse(fs.readFileSync(arg, 'utf8'));
    const r = verify(s);
    console.log(r.why === 'ok' ? `OK  ${r.e.name}  ${mark(r.e.key)}  ${r.e.printer || 'no printer'}${r.e.greys ? ', ' + r.e.greys + ' greys' : ''}  ${r.e.open ? 'open' : 'closed'}  until ${new Date(r.e.until * 1000).toISOString().slice(0, 10)}` : `NOT AN ENTRY TO TRUST: ${r.why}`);
    process.exit(r.why === 'ok' ? 0 : 1);
  }
}

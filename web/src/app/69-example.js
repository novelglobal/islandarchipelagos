/* ════════════════════════════════════════════════════════════════════
   THE EXAMPLE — DA-0RNG, opened up, as the lesson the rest is learned from. Its sound: the radio over Royal Park, pressed before
   anywhere is chosen, a small choir with bubbles and glass, the orangutan's own constellation sung with the lives around it.
   BOARD 00: everything behind its W.I.S.H., laid out as the three steps, NOTICED, RESPONSE, DIRECT ACTION, every fact with its
   source. Its zine: the receipt and what was made around it, placed on the strip from the drawer, and the portfolio's hero.
   BOARD 00 stands as built here, or as last approved on the approval page (/api/example). It can be rewritten only while the
   approval page has it open to editing; what is sent from here waits there, to be shown.
   ════════════════════════════════════════════════════════════════════ */
const EXK = window.DA_EXAMPLE_KIT || null;
const EXR = store.get('da.exr.v1', { at: 0, board: null });   /* the example as last approved, from the server */
const exSignal = () => (EXK ? S.signals.find(s => s.key === 'ex:' + EXK.code) : null) || null;
const exEditable = () => !!CFG.exampleEdit;
const exLocked = () => boardId === 'b00' && !exEditable();
/* the board to work on: never the example while it is locked */
async function workBoard() { if (!exLocked()) return; const b = BOARDS.find(x => !x.ex); if (b) await switchBoard(b.id); }

/* ───────── the sound ───────── */
function exampleMix() {
  const s = exSignal(); const k = (EXK && EXK.mix) || { r: 700, layers: {} }; const p = { ...((s && s.pin) || { lat: -37.7841, lng: 144.9515, place: 'PARKVILLE' }), ...(k.where || {}) };
  return { v: MIX_V, id: 'mx-ex', at: Date.now(), loop: CONFIG.SCAN.turn || 8, where: { lat: p.lat, lng: p.lng, r: k.r || 600, place: p.place || suburbAt(p.lat, p.lng) }, layers: JSON.parse(JSON.stringify(k.layers || {})) };
}
/* play pressed before anywhere is chosen: the radar goes to Royal Park, between the zoo and the wetlands, and the layers take the
   example's levels and moods, deep and slow; what sounds is what the hand finds there */
function playExample() { tuneMix(exampleMix(), true); }

/* ───────── BOARD 00 ───────── */
const EXB_V = 3;
const viaProxy = u => (/^https?:/.test(location.protocol) && /^https?:\/\//.test(u) ? `/api/img?u=${encodeURIComponent(u)}` : u);
/* sources kept as addresses on this site, so the board loads the same on the preview and the live site */
const relSrc = json => { for (const o of (json && json.objects) || []) if (o.type === 'image' && typeof o.src === 'string' && o.src.startsWith(location.origin)) o.src = o.src.slice(location.origin.length); return json; };
async function exampleBoardJSON() {
  const f = await loadFabric(); const K = EXK; const s = exSignal(); if (!K || !s) return { version: f.version, objects: [] };
  try { await Promise.all(['20px VT323', '11px "IBM Plex Mono"', '600 22px Poppins'].map(q => document.fonts.load(q))); } catch (e) { /* the fallback faces */ }
  const back = [], links = [], front = []; const put = o => { front.push(o); return o; };
  const card = (kind, text, x, y, o = {}) => put(textCard(f, uid(kind[0]), kind, text, x, y, o));
  const sect = (x, y, w, h, title) => { back.push(new f.Rect({ left: x, top: y, width: w, height: h, fill: 'rgba(143,169,196,.07)', stroke: '#8FA9C4', strokeDashArray: [2, 4], rx: 2, ry: 2, daId: uid('s'), daKind: 'section' })); back.push(textCard(f, uid('st'), 'note', title, x + 4, y - 44, { backgroundColor: 'transparent', fill: '#8FA9C4', fontSize: 28, width: w - 8, padding: 4 })); };
  const img = (url, x, y, w, o = {}) => new Promise(res => { let done = false; const fin = v => { if (!done) { done = true; res(v); } }; setTimeout(() => fin(null), 9000);
    f.Image.fromURL(url, im => { if (!im || !im.width) return fin(null); im.set({ left: x, top: y, daId: uid('i'), daKind: 'image', ...o }); im.scaleToWidth(w); fin(put(im)); }, { crossOrigin: 'anonymous' }); });
  const link = (a, b) => { if (!a || !b) return; const ca = a.getCenterPoint(), cb = b.getCenterPoint(); links.push(new f.Line([ca.x, ca.y, cb.x, cb.y], { stroke: '#FF5A1F', strokeWidth: 1.6, strokeDashArray: [5, 4], selectable: false, evented: true, hoverCursor: 'pointer', daFrom: a.daId, daTo: b.daId, daKind: 'link' })); };
  const bottom = o => (o ? o.top + (o.getScaledHeight ? o.getScaledHeight() : o.height) : 0);
  /* THE NEST: a hero across the top, the wish at its heart; under it three threads in their own colours, one to each step,
     FOREST to NOTICED, PARK to RESPONSE, LOOM to DIRECT ACTION, each tied back to the wish */
  const ST = K.story || { t: 'THE NEST', at: 'ROYAL PARK', threads: [] }, TH = ST.threads, P = K.photos.map(p => viaProxy(p.u)), L = s.lines || {};
  const big = (text, x, y, w, size, o = {}) => card('note', text, x, y, { width: w, fontFamily: 'Poppins, Arial, sans-serif', fontWeight: 600, fontSize: size, lineHeight: 0.95, backgroundColor: '#F4F1E8', fill: '#0C0E0E', padding: 6, ...o });
  const hero = await img(P[0], 10, 10, 380, { stroke: '#F4F1E8', strokeWidth: 6 });
  const title = big(ST.t, 410, 6, 760, 112, { charSpacing: -30 });
  const place = big(ST.at, 414, bottom(title) + 2, 600, 22, { fontWeight: 500, charSpacing: 60 });
  let y = bottom(place) + 14;
  const wish = WKEYS.map((k, i) => { const c = card('slip', `${k.toUpperCase()}  ${L[k] || ''}`, 414 + (i % 2) * 380, y + Math.floor(i / 2) * 62, { width: 368, fontSize: 19 }); return c; });
  const song = await img(mixArt(exampleMix(), mixURL(exampleMix())), 1060, 10, 110, { daKind: 'image', angle: 4 });
  big(ST.song ? ST.song.t : '', 1040, bottom(song) - 4, 140, 16, { fontWeight: 600, charSpacing: 80 });
  const top = Math.max(bottom(hero), ...wish.map(bottom)) + 70, X = [10, 402, 794], CW = 372;
  const heads = [], colEnd = [];
  /* each thread: its name in its colour, where it is, its line, its cast (STORY), and the cart it opens onto */
  TH.forEach((T, i) => { const x = X[i] + 12;
    heads[i] = big(T.t, x, top + 10, CW - 24, 64, { backgroundColor: T.col, fill: T.ink, padding: 10 });
    const at = big(T.at, x, bottom(heads[i]) + 8, CW - 24, 15, { fontWeight: 500, charSpacing: 60 });
    const ln = big(T.line, x, bottom(at) + 8, CW - 24, 24, { fontWeight: 500, lineHeight: 1.1 });
    let yy = bottom(ln) + 12;
    T.cast.forEach(c => { const cc = card('fig', `STORY · ${c[0]}\n${c[1]}`, x, yy, { width: CW - 24, fontSize: 11, backgroundColor: '#F4F1E8' }); yy = bottom(cc) + 6; });
    colEnd[i] = card('cell', `→ ${T.to[0]}\n↗ ${T.to[1]}`, x, yy + 4, { width: 170, fontSize: 10.5, backgroundColor: T.col, fill: T.ink });
    link(wish[i], heads[i]); });
  /* FOREST · NOTICED: the forest photographed, and what is true now */
  let y1 = bottom(colEnd[0]) + 16;
  const p1 = await img(P[1], 22, y1, 170, { stroke: '#FFFFFF', strokeWidth: 5, angle: -2 }); const p2 = await img(P[2], 202, y1 + 10, 168, { stroke: '#FFFFFF', strokeWidth: 5, angle: 2 });
  y1 = Math.max(bottom(p1), bottom(p2)) + 10;
  const credit = card('cell', `PHOTOGRAPHS · iNaturalist · ${[...new Set(K.photos.map(p => p.by))].join(' · ')}`, 22, y1, { fontSize: 8.5, width: 348, padding: 4 }); y1 = bottom(credit) + 8;
  const facts = K.noticed.map(n => { const c = card('cell', `${n.t}\n${n.d}\n↗ ${hostOf(n.src)}`, 22, y1, { width: 348, fontSize: 10.5 }); y1 = bottom(c) + 8; return c; });
  link(heads[0], p1); link(p1, facts[0]); link(hero, heads[0]);
  /* PARK · RESPONSE: the research, the principle and the cases each line came from */
  let y2 = bottom(colEnd[1]) + 16;
  const from = K.response.map((r, i) => card('fig', `${r.t}\n${r.d}${r.src ? `\n↗ ${hostOf(r.src)}` : ''}`, 414 + (i % 2) * 178, y2 + Math.floor(i / 2) * 124, { width: 170, fontSize: 9.5 }));
  y2 = Math.max(...from.map(bottom)) + 12;
  const cases = K.cases.map((c, i) => card('note', `${c.t}\n${c.by}\n${c.d}\n↗ ${hostOf(c.src)}`, 414 + (i % 2) * 178, y2 + Math.floor(i / 2) * 176, { width: 170, fontSize: 14, lineHeight: 1.05 }));
  link(heads[1], from[0]); wish.forEach((l, i) => link(l, from[i])); link(from[3], cases[2]); link(from[1], cases[0]); link(from[1], cases[1]); link(facts[1], wish[0]);
  /* LOOM · DIRECT ACTION: the receipt, the made thing, the art and the song, and its strings */
  let y3 = bottom(colEnd[2]) + 16;
  const slip = await slipCanvas(s, 384, 2, false, false).catch(() => null);
  const rc = slip ? await img(slip.toDataURL('image/png'), 806, y3, 170, { daKind: 'receipt' }) : null;
  const art = await img(ST.art || '/cards/zine.jpg', 990, y3, 172, { stroke: '#FFFFFF', strokeWidth: 5, angle: 2 });
  const kit = card('note', `${K.action.t}\n${K.action.d}`, 990, bottom(art) + 12, { width: 172, fontSize: 15, lineHeight: 1.05, backgroundColor: TH[2] ? TH[2].col : '#E6F84A' });
  y3 = Math.max(bottom(rc), bottom(kit)) + 16;
  const pin = card('cell', `${(s.pin.cn || '').toUpperCase()}\n${s.pin.place || ''} · ${(+s.pin.lat).toFixed(4)} ${(+s.pin.lng).toFixed(4)}`, 806, y3, { width: 176, fontSize: 10 });
  const nodes = {}; (s.nodes || []).forEach((n, i) => { nodes[n.k] = card('fig', `${n.n}\n${String((ROLES[n.role] || {}).w || (n.t === 'group' ? 'GROUP' : 'STORY')).toUpperCase()}`, i === 2 ? 806 : 994, i === 2 ? y3 + 96 : y3 + i * 80, { width: 168, fontSize: 10 }); });
  for (const [a2, b2] of s.edges || []) link(a2 === 'pin' ? pin : nodes[a2], b2 === 'pin' ? pin : nodes[b2]);
  const p3 = await img(P[3], 994, y3 + 176, 120, { stroke: '#FFFFFF', strokeWidth: 5, angle: -3 });
  link(heads[2], rc); link(wish[3], kit); link(song, pin); link(pin, p3); link(art, kit);
  const intel = card('cell', K.intel, 806, Math.max(bottom(p3), y3 + 210) + 14, { width: 356, fontSize: 9.5 });
  /* the three steps behind the threads, as tall as what each holds */
  const end = Math.max(bottom(facts[facts.length - 1]), ...cases.map(bottom), bottom(intel)) + 18;
  sect(10, top, 372, end - top, 'NOTICED'); sect(402, top, 372, end - top, 'RESPONSE'); sect(794, top, 380, end - top, 'DIRECT ACTION');
  /* stickers, as on any board: the muse and the life */
  await img(sticker({ j: 1, col: '#F07A3E' }), 330, 250, 72, { angle: 8 }); await img(sticker({ g: 'ape', col: '#F07A3E' }), 1100, top - 66, 58, { angle: -6 });
  return relSrc({ version: f.version, objects: [...back, ...links, ...front].map(o => o.toObject(BOARD_PROPS)) });
}
/* BOARD 00 as it should stand now: approved on the server, rewritten here while editing is on, or built from the kit */
async function ensureExample() {
  if (!EXK) return; const kept = boardOf('b00');
  if (EXR.board && (!kept || !kept.json || (kept.at || 0) < EXR.at)) { store.set('da.board.b00', { v: BOARD_V, ex: 'remote', at: EXR.at, json: EXR.board }); return; }
  if (kept && kept.json && (kept.ex === 'remote' || kept.ex === 'edit' || kept.exv === EXB_V)) return;
  const json = await exampleBoardJSON(); store.set('da.board.b00', { v: BOARD_V, ex: 'built', exv: EXB_V, at: 0, json });
}
/* the example everyone sees, as last approved */
async function loadExample() {
  try { const j = await apiJSON('/example'); if (j && j.board && j.at > (EXR.at || 0)) { EXR.at = j.at; EXR.board = j.board; store.set('da.exr.v1', EXR); EXZ.url = ''; if (boardId === 'b00' && cv) loadBoard(); } } catch (e) { /* as last heard */ }
}
/* the example, rewritten here while the approval page allows it, sent there to be shown */
async function sendExample() {
  if (!exEditable() || boardId !== 'b00' || !cv) { tick(600); return; }
  saveBoard(false); const json = relSrc(JSON.parse(JSON.stringify(cv.toJSON(BOARD_PROPS)))); const s = exSignal(); const p = (s && s.pin) || { lat: -37.7841, lng: 144.9515 };
  try { await apiJSON('/stories', { method: 'POST', body: JSON.stringify({ kind: 'example', code: 'DA-EX00', body: JSON.stringify(json), lat: p.lat, lng: p.lng }) }); toast('SENT · WAITING FOR APPROVAL'); snd.tear(); }
  catch (e) { toast(e.status === 403 ? 'LOCKED ON THE APPROVAL PAGE' : e.status === 413 ? 'TOO LARGE TO SEND' : 'NOT SENT'); }
}

/* ───────── the example zine: the receipt at the head of the strip, and under it what was made around it ───────── */
const EXZ = { url: '' };
const fImg = url => new Promise(res => window.fabric.Image.fromURL(url, im => res(im && im.width ? im : null), { crossOrigin: 'anonymous' }));
async function exampleZinePieces(y0, W = 320) {
  const f = await loadFabric(); const K = EXK; const out = []; let y = y0; if (!K) return { out, y };
  const ph = await loadImage(K.photos[0].u, true).catch(() => null);
  if (ph) { const u = await inkPhoto(photoFrame(ph, 'polaroid'), 200 * 1.6); const im = await fImg(u); if (im) { im.set({ left: 22, top: y, angle: -3, daKind: 'image' }); im.scaleToWidth(200); out.push(im); } }
  const jel = await fImg(sticker({ j: 1, col: '#0C0E0E' })); if (jel) { jel.set({ left: 222, top: y + 26, angle: 9, daKind: 'sticker' }); jel.scaleToWidth(84); out.push(jel); }
  y += 236;
  const ST = K.story || { t: 'NEST KIT', threads: [] };
  const head = new f.Textbox(ST.t, { left: 14, top: y, width: W - 28, fontFamily: 'UnifrakturMaguntia, serif', fontSize: 52, lineHeight: 0.9, fill: '#0C0E0E', daKind: 'head' }); out.push(head); y += 60;
  if (ST.at) { out.push(new f.Textbox(ST.at, { left: 14, top: y, width: W - 28, fontFamily: '"IBM Plex Mono", monospace', fontWeight: 600, fontSize: 12, charSpacing: 120, fill: '#0C0E0E', daKind: 'text' })); y += 28; }
  for (const T of ST.threads || []) {
    out.push(new f.Rect({ left: 14, top: y, width: W - 28, height: 3, fill: '#0C0E0E', daKind: 'rule' }));
    out.push(new f.Textbox(T.t, { left: 14, top: y + 10, width: 120, fontFamily: 'Poppins, Arial, sans-serif', fontWeight: 600, fontSize: 30, lineHeight: 0.9, fill: '#0C0E0E', daKind: 'text' }));
    const ln = new f.Textbox(T.line, { left: 134, top: y + 12, width: W - 148, fontFamily: 'Poppins, Arial, sans-serif', fontSize: 12, lineHeight: 1.15, fill: '#0C0E0E', daKind: 'text' }); out.push(ln);
    const cs = new f.Textbox(T.cast.map(c => c[0]).join(' · '), { left: 134, top: y + 16 + ln.height, width: W - 148, fontFamily: '"IBM Plex Mono", monospace', fontWeight: 600, fontSize: 10, charSpacing: 60, fill: '#0C0E0E', daKind: 'text' }); out.push(cs);
    y += Math.max(54, 26 + ln.height + cs.height) + 6; }
  y += 8;
  const mix = exampleMix(); const mx = await fImg(mixArt(mix, mixURL(mix))); if (mx) { mx.set({ left: (W - 230) / 2, top: y, daKind: 'art' }); mx.scaleToWidth(230); out.push(mx); y += mx.getScaledHeight() + 16; }
  if (ST.song) { out.push(new f.Textbox(ST.song.t, { left: 14, top: y - 8, width: W - 28, textAlign: 'center', fontFamily: '"IBM Plex Mono", monospace', fontWeight: 700, fontSize: 13, charSpacing: 200, fill: '#0C0E0E', daKind: 'text' })); y += 24; }
  if (boardId === 'b00' && cv) saveBoard(false); await ensureExample(); const bu = await boardImage('b00');
  if (bu) { const u = await inkPhoto(bu, 300 * 1.6); const bi = await fImg(u); if (bi) { bi.set({ left: 10, top: y, daKind: 'board' }); bi.scaleToWidth(300); out.push(bi); y += bi.getScaledHeight() + 14; } }
  const intel = new f.Textbox(K.intel, { left: 12, top: y, width: W - 24, fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, fill: '#0C0E0E', daKind: 'text' }); out.push(intel); y += 34;
  const t = new f.Text('EX · BOARD 00', { fontFamily: '"IBM Plex Mono", monospace', fontWeight: 700, fontSize: 16, fill: '#0C0E0E', opacity: 0.82, padding: 8 });
  const r = new f.Rect({ width: t.width + 22, height: t.height + 16, left: -11, top: -8, fill: 'transparent', stroke: '#0C0E0E', strokeWidth: 3, rx: 4, ry: 4, opacity: 0.82 });
  out.push(new f.Group([r, t], { left: W - t.width - 40, top: y, angle: -7, daKind: 'stamp' })); y += 56;
  return { out, y };
}
/* chosen from the drawer: the strip becomes the example (what was on it can come back with undo) */
async function placeExampleZine() {
  if (!EXK) return; PRESS.fmt = 'r80'; PRESS.story = 'ex:' + EXK.code; const c = await showZine(true); if (!c) return;
  for (const o of c.getObjects().filter(o => o.daKind !== 'base')) c.remove(o);
  await setBase(true); const base = c.getObjects().find(o => o.daKind === 'base'); const y0 = base ? base.top + base.getScaledHeight() + 18 : 20;
  const { out, y } = await exampleZinePieces(y0); for (const o of out) c.add(o);
  if (c.getHeight() < y + 30) c.setHeight(y + 30); fitZ(); c.renderAll(); saveZine(); snd.printer(600); refreshPanel();
}
/* the same zine as a picture, for the portfolio's hero: made once a visit, on paper, apart from the strip */
async function exampleZineImage() {
  if (EXZ.url) return EXZ.url; if (EXZ.busy) return EXZ.busy;
  EXZ.busy = (async () => {
    const f = await loadFabric().catch(() => null); const s = exSignal(); if (!f || !s) return '';
    const W = 320; const slip = await slipCanvas(s, 512, 2, false, false).catch(() => null); if (!slip) return '';
    const sc = new f.StaticCanvas(null, { width: W, height: 3000, backgroundColor: '#FFFFFF' });
    const base = await fImg(slip.toDataURL('image/png')); if (base) { base.set({ left: 0, top: 0 }); base.scaleToWidth(W); sc.add(base); }
    const { out, y } = await exampleZinePieces((base ? base.getScaledHeight() : 0) + 18, W); for (const o of out) sc.add(o);
    sc.setHeight(Math.ceil(y + 24)); sc.renderAll(); const url = sc.toDataURL({ format: 'png', multiplier: 1.6 }); sc.dispose(); EXZ.url = url; return url;
  })().catch(() => '').finally(() => { EXZ.busy = null; });
  return EXZ.busy;
}

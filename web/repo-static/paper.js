/* novel.global, the paper. The screen is a strip of 80 mm receipt paper: as wide as the phone (or a column of a computer's screen),
   as long as what is on it. Paste, drop or pick photographs, draw, write; it stays in colour on the screen and in the file it saves.
   Printed, it goes through the site's one print setting (thermal.js, put in front of this file by build.mjs, with the settings the
   approval page keeps), at the printer's own dots: photographs in the printer's greys, words and lines solid.
   Nothing to read on the page; everything has an aria-label.

   On the paper: tap empty paper writes; long press empty paper pastes a copied picture, or picks photographs (or paste or drop them
   anywhere); drag a piece to move it; two fingers on a piece size and turn it; drag a piece off the paper to take it off.
   The marks: the nib turns the pen on and off (on, a drag draws; long press for the next size, then white); the arrow undoes (long press
   redoes); the cross, tapped twice, clears the paper. The tick: tap to open, tap again to print; the printer's name beside it changes
   printer; the arrow saves. The bar at the foot, swiped up, goes to the wall; up again, the three cards. */
(function () {
  'use strict';
  var D = document, T = window.THERMAL, $ = function (s) { return D.querySelector(s); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };
  var buzz = function (n) { try { if (navigator.vibrate) navigator.vibrate(n || 8); } catch (e) { /* none */ } };
  var INK = '#1A1E24', PAPER = '#EEF1F1';

  /* ───────── the paper, in dots: W across (80 mm at 180 dpi), L long ───────── */
  var W = 512, PAD = 20, MAXL = 4200, L = 600, Lmin = 600;
  var PEN = [3, 7, 14], TXT = [28, 40, 64];
  var S = { items: [], pen: 0, white: false, ink: false, done: [], undone: [], nid: 1 };
  var strip = $('#strip'), pv = $('#pv'), px = pv.getContext('2d'), type = $('#type');
  var Q = T.settle(null, null), scale = 1, IMGS = {};

  function snap() { return JSON.stringify(S.items, function (k, v) { return k === 'img' || k === 'hide' ? undefined : v; }); }
  function mark() { S.done.push(snap()); if (S.done.length > 60) S.done.shift(); S.undone = []; }
  function restore(js) { S.items = JSON.parse(js); S.items.forEach(function (it) { if (it.k === 'im') it.img = IMGS[it.src]; }); draw(); }
  function undo() { if (!S.done.length) return buzz(30); S.undone.push(snap()); restore(S.done.pop()); buzz(); }
  function redo() { if (!S.undone.length) return buzz(30); S.done.push(snap()); restore(S.undone.pop()); buzz(); }

  /* the lowest thing on the paper, and a breath: the paper is never shorter than the screen, and grows past it */
  function bottomOf(it) {
    if (it.k === 'st') return it.pts.reduce(function (m, p) { return Math.max(m, p[1]); }, 0) + it.w;
    if (it.k === 'tx') return it.y + it.h;
    if (it.k === 'im') { var c = Math.abs(Math.cos(it.r)), s = Math.abs(Math.sin(it.r)); return it.y + (it.w * s + it.h * c) / 2; }
    return 0; }
  function used() { return S.items.reduce(function (m, it) { return Math.max(m, bottomOf(it)); }, 0); }
  function lengthFor() { return Math.min(MAXL, Math.max(Lmin, Math.ceil((used() + PAD) / 8) * 8)); }
  function fit() {
    var vw = innerWidth, vh = innerHeight, sw = Math.min(vw, 480), s0 = sw / W;
    Lmin = Math.floor(vh / s0); L = lengthFor();
    scale = L * s0 > vh ? vh / L : s0; var w = Math.round(W * scale), h = Math.round(L * scale);
    strip.style.width = w + 'px'; strip.style.height = h + 'px';
    /* the marks keep to the paper's own edges, wherever the paper stands on the screen */
    var left = Math.round((vw - w) / 2); $('#marks').style.left = left ? left + 6 + 'px' : ''; $('#home').style.left = left ? left + 4 + 'px' : ''; $('#ends').style.right = left ? left + 6 + 'px' : ''; $('.pull').style.top = left ? (h - 22) + 'px' : '';
    var dpr = Math.min(3, devicePixelRatio || 1); pv.width = Math.round(w * dpr); pv.height = Math.round(h * dpr); pv.k = dpr;
    if (editing) typeAt(); paint();
  }

  /* ───────── drawing: in colour on the screen and in the file; the same pieces laid for the printer ───────── */
  function drawItem(x, it, print) {
    if (it.hide) return; x.save();
    if (it.k === 'im' && it.img) { x.translate(it.x, it.y); x.rotate(it.r); x.drawImage(it.img, -it.w / 2, -it.h / 2, it.w, it.h); }
    else if (it.k === 'st') { x.strokeStyle = it.white ? (print ? '#fff' : PAPER) : (print ? '#000' : INK); x.lineWidth = it.w; x.lineCap = x.lineJoin = 'round'; x.beginPath();
      it.pts.forEach(function (p, i) { if (i) x.lineTo(p[0], p[1]); else x.moveTo(p[0], p[1]); }); if (it.pts.length === 1) x.lineTo(it.pts[0][0] + 0.1, it.pts[0][1]); x.stroke(); }
    else if (it.k === 'tx') { x.font = T.font(null, 'sans', it.size, true); x.textBaseline = 'top'; var lh = Math.round(it.size * 1.12);
      it.lines.forEach(function (ln, i) { if (print) { x.lineJoin = 'round'; x.lineWidth = Math.max(3, it.size * 0.16); x.strokeStyle = '#fff'; x.strokeText(ln, it.x, it.y + i * lh); }
        x.fillStyle = it.white ? (print ? '#fff' : PAPER) : (print ? '#000' : INK); x.fillText(ln, it.x, it.y + i * lh); }); }
    x.restore();
  }
  /* on the screen */
  function paint() { var k = scale * (pv.k || 1); px.setTransform(1, 0, 0, 1, 0, 0); px.clearRect(0, 0, pv.width, pv.height); px.setTransform(k, 0, 0, k, 0, 0);
    px.imageSmoothingQuality = 'high'; S.items.forEach(function (it) { drawItem(px, it, false); }); }
  var queued = false;
  function draw() { var nl = lengthFor(); if (nl !== L) { fit(); return; } if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; paint(); }); }

  /* for the printer: photographs through the site's one setting, then words and lines laid over them solid */
  function render(w, len, items) {
    var ph = D.createElement('canvas'), ink = D.createElement('canvas'), out = D.createElement('canvas'); ph.width = ink.width = out.width = w; ph.height = ink.height = out.height = len;
    var px2 = ph.getContext('2d'), ix = ink.getContext('2d'); px2.fillStyle = '#fff'; px2.fillRect(0, 0, w, len);
    var anyPhoto = false; items.forEach(function (it) { if (it.k === 'im') { drawItem(px2, it, true); anyPhoto = true; } else drawItem(ix, it, true); });
    var n = w * len, Lm = T.luma(px2.getImageData(0, 0, w, len).data, n), grey = false;
    if (anyPhoto) { var how = T.tone(Lm, w, len, Q); T.dots(Lm, w, len, how); grey = T.isGrey(how); }
    var id = ix.getImageData(0, 0, w, len).data, cut = +Q.lineCut || 215, l, i;
    for (l = 0, i = 0; l < n; l++, i += 4) if (id[i + 3] > 110) Lm[l] = (id[i] * 0.299 + id[i + 1] * 0.587 + id[i + 2] * 0.114) < cut ? 0 : 255;
    var o = out.getContext('2d'), im = o.createImageData(w, len), d = im.data; for (l = 0, i = 0; l < n; l++, i += 4) { d[i] = d[i + 1] = d[i + 2] = Lm[l]; d[i + 3] = 255; }
    o.putImageData(im, 0, 0); out.grey = grey; return out;
  }
  /* the pieces laid out again at another width (a printer's own dots, or a larger file): never a picture shrunk after it is made */
  function at(dots) { var k = dots / W, len = Math.ceil(Math.max(used() + PAD, 120) * k / 8) * 8;
    var items = S.items.map(function (it) { var c = {}, q; for (q in it) c[q] = it[q];
      if (c.k === 'im') { c.x *= k; c.y *= k; c.w *= k; c.h *= k; } else if (c.k === 'st') { c.w *= k; c.pts = c.pts.map(function (p) { return [p[0] * k, p[1] * k]; }); }
      else if (c.k === 'tx') { c.x *= k; c.y *= k; c.size = Math.max(8, Math.round(c.size * k)); measure(c, dots); } delete c.hide; return c; });
    return { items: items, len: len }; }
  function colour(dots) { var a = at(dots), c = D.createElement('canvas'); c.width = dots; c.height = a.len; var x = c.getContext('2d'); x.fillStyle = PAPER; x.fillRect(0, 0, dots, a.len); x.imageSmoothingQuality = 'high'; a.items.forEach(function (it) { drawItem(x, it, false); }); return c; }
  function forPrinter(dots) { var a = at(dots); return render(dots, a.len, a.items); }

  /* ───────── where a touch lands, in dots ───────── */
  function spot(e) { var r = strip.getBoundingClientRect(); return [(e.clientX - r.left) / scale, (e.clientY - r.top) / scale]; }
  function onPaper(p) { return p[0] >= -8 && p[0] <= W + 8 && p[1] >= -8 && p[1] <= L + 8; }
  function hit(p) {
    for (var i = S.items.length - 1; i >= 0; i--) { var it = S.items[i];
      if (it.k === 'im') { var dx = p[0] - it.x, dy = p[1] - it.y, c = Math.cos(-it.r), s = Math.sin(-it.r), u = dx * c - dy * s, v = dx * s + dy * c; if (Math.abs(u) <= it.w / 2 && Math.abs(v) <= it.h / 2) return it; }
      if (it.k === 'tx' && p[0] >= it.x - 6 && p[0] <= it.x + it.wd + 6 && p[1] >= it.y - 6 && p[1] <= it.y + it.h + 6) return it; }
    return null; }

  /* ───────── photographs: picked, pasted or dropped, each laid full width below what is there ───────── */
  function addImage(file) {
    if (!file || !/^image\//.test(file.type)) return; var img = new Image();
    img.onload = function () { var src = 'i' + (S.nid++); IMGS[src] = img; mark(); var w = W - PAD * 2, h = Math.round(img.naturalHeight * w / img.naturalWidth), top = S.items.length ? used() + PAD : PAD;
      S.items.push({ k: 'im', src: src, img: img, x: W / 2, y: top + h / 2, w: w, h: h, r: 0, ar: img.naturalHeight / img.naturalWidth }); buzz(12); draw(); };
    img.src = URL.createObjectURL(file); }
  function addFiles(list) { for (var i = 0; list && i < list.length; i++) addImage(list[i]); }
  $('#pick').addEventListener('change', function (e) { addFiles(e.target.files); e.target.value = ''; });
  D.addEventListener('paste', function (e) { var dt = e.clipboardData; if (!dt) return; var got = false;
    for (var i = 0; i < dt.items.length; i++) if (dt.items[i].kind === 'file' && /^image\//.test(dt.items[i].type)) { if (!got && editing) endType(); got = true; addImage(dt.items[i].getAsFile()); }
    if (got) { e.preventDefault(); return; } if (editing) return; var t = dt.getData('text/plain'); if (t && t.trim()) { e.preventDefault(); mark(); addText(t.trim(), PAD, S.items.length ? used() + PAD / 2 : PAD); } });
  D.addEventListener('dragover', function (e) { e.preventDefault(); });
  D.addEventListener('drop', function (e) { e.preventDefault(); addFiles(e.dataTransfer && e.dataTransfer.files); });
  /* what was copied, if it is a picture (the phone asks once to paste); else the photographs on the phone */
  function pasteOrPick() {
    var pick = function () { $('#pick').click(); };
    if (!(navigator.clipboard && navigator.clipboard.read)) return pick();
    navigator.clipboard.read().then(function (items) { var got = false;
      items.forEach(function (it) { var t = (it.types || []).filter(function (x) { return /^image\//.test(x); })[0]; if (!t) return; got = true; it.getType(t).then(function (b) { addImage(new File([b], 'pasted', { type: t })); }); });
      if (!got) pick(); }, pick); }

  /* ───────── words: typed where the paper was touched ───────── */
  var editing = null, mc = D.createElement('canvas').getContext('2d');
  function measure(it, w) { w = w || W; mc.font = T.font(null, 'sans', it.size, true); var max = w - it.x - PAD / 2, lines = [];
    String(it.s).split('\n').forEach(function (para) { var line = ''; para.split(/(\s+)/).forEach(function (wd) { var t = line + wd; if (mc.measureText(t).width > max && line.trim()) { lines.push(line.trimEnd()); line = wd.trimStart(); } else line = t; }); lines.push(line); });
    it.lines = lines; it.wd = Math.max.apply(null, lines.map(function (l) { return mc.measureText(l).width; }).concat([8])); it.h = Math.round(it.size * 1.12) * lines.length; return it; }
  function addText(s, x, y) { var it = measure({ k: 'tx', s: s, x: Math.round(x), y: Math.round(y), size: TXT[S.pen], white: S.white }); S.items.push(it); draw(); return it; }
  function typeAt() { var it = editing; type.style.left = it.x * scale + 'px'; type.style.top = it.y * scale + 'px'; type.style.width = Math.max(40, (W - it.x - PAD / 2) * scale) + 'px';
    type.style.font = T.font(null, 'sans', it.size * scale, true); type.style.lineHeight = '1.12'; type.style.color = it.white ? PAPER : INK; type.style.height = 'auto'; type.style.height = type.scrollHeight + 'px'; }
  function startType(it) { editing = it; it.hide = true; type.value = it.s; type.hidden = false; typeAt(); paint(); setTimeout(function () { type.focus(); type.setSelectionRange(type.value.length, type.value.length); }, 0); }
  function endType() { if (!editing) return; var it = editing; editing = null; type.hidden = true; type.blur(); delete it.hide; it.s = type.value.replace(/\s+$/, '');
    if (!it.s) S.items.splice(S.items.indexOf(it), 1); else measure(it); draw(); }
  type.addEventListener('input', typeAt);
  type.addEventListener('keydown', function (e) { if (e.key === 'Escape' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) { e.preventDefault(); endType(); } });
  type.addEventListener('blur', function () { setTimeout(function () { endType(); window.scrollTo(0, 0); }, 0); });

  /* ───────── touches on the paper ───────── */
  var P = {}, G = null, hold = 0;
  function cancelHold() { clearTimeout(hold); hold = 0; }
  strip.addEventListener('pointerdown', function (e) {
    if (e.target === type) return; e.preventDefault(); strip.setPointerCapture(e.pointerId); if (editing) endType(); open(false);
    var p = spot(e); P[e.pointerId] = p; var ids = Object.keys(P);
    if (ids.length === 2 && G && G.it && G.it.k === 'im') { var a = P[ids[0]], b = P[ids[1]];
      G = { kind: 'pinch', it: G.it, d0: Math.hypot(b[0] - a[0], b[1] - a[1]), a0: Math.atan2(b[1] - a[1], b[0] - a[0]), w0: G.it.w, r0: G.it.r, moved: true }; cancelHold(); return; }
    if (ids.length > 1) return;
    var it = hit(p); G = { kind: it ? 'move' : S.ink ? 'pen' : 'idle', it: it, p0: p, t0: Date.now(), moved: false, ox: it ? it.x - p[0] : 0, oy: it ? it.y - p[1] : 0 };
    /* a long press on empty paper: let go and it pastes a photograph, or picks one (done on the release, which phones count as a tap) */
    hold = setTimeout(function () { hold = 0; if (!G || G.moved || G.it) return; G.kind = 'held'; buzz(12); }, 480);
  });
  strip.addEventListener('pointermove', function (e) {
    if (!P[e.pointerId] || !G) return; var p = spot(e); P[e.pointerId] = p;
    if (G.kind === 'pinch') { var ids = Object.keys(P); if (ids.length < 2) return; var a = P[ids[0]], b = P[ids[1]], d = Math.hypot(b[0] - a[0], b[1] - a[1]), ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      var it = G.it, w = Math.max(48, Math.min(W * 1.6, G.w0 * d / (G.d0 || 1))), r = G.r0 + ang - G.a0, sn = Math.round(r / (Math.PI / 2)) * (Math.PI / 2);
      if (Math.abs(r - sn) < 0.06) { if (it.r !== sn) buzz(4); r = sn; } if (Math.abs(w - (W - PAD * 2)) < 10) w = W - PAD * 2; else if (Math.abs(w - W) < 10) w = W; it.w = w; it.h = w * it.ar; it.r = r; draw(); return; }
    if (!G.moved && Math.hypot(p[0] - G.p0[0], p[1] - G.p0[1]) < 6 / scale) return;
    if (G.kind === 'idle' || G.kind === 'held') { G.moved = true; G.kind = 'idle'; cancelHold(); return; }   /* a drag with the pen off is never a tap */
    if (!G.moved) { G.moved = true; cancelHold(); mark(); if (G.kind === 'pen') { G.st = { k: 'st', pts: [G.p0], w: PEN[S.pen], white: S.white }; S.items.push(G.st); } }
    if (G.kind === 'pen') { (e.getCoalescedEvents ? e.getCoalescedEvents() : [e]).forEach(function (c) { var q = spot(c); G.st.pts.push([Math.round(q[0] * 10) / 10, Math.round(q[1] * 10) / 10]); }); draw(); }
    else if (G.kind === 'move') { G.it.x = Math.round(p[0] + G.ox); G.it.y = Math.round(p[1] + G.oy); strip.classList.toggle('off', !onPaper(p) || p[0] < 0 || p[0] > W); draw(); }
  });
  function up(e) {
    if (!P[e.pointerId]) return; delete P[e.pointerId]; cancelHold(); if (Object.keys(P).length) return;
    var g = G; G = null; strip.classList.remove('off'); if (!g) return; var p = spot(e);
    if (g.kind === 'move' && g.moved && (p[0] < 0 || p[0] > W || p[1] < 0)) { S.items.splice(S.items.indexOf(g.it), 1); buzz(20); draw(); return; }
    if (g.kind === 'held') return pasteOrPick();
    if (!g.moved && g.kind !== 'pinch' && Date.now() - g.t0 < 400) {
      if (g.it && g.it.k === 'tx') { mark(); return startType(g.it); }
      if (!g.it) { mark(); var sz = TXT[S.pen]; return startType(addText('', Math.min(W - PAD * 3, Math.max(PAD / 2, g.p0[0])), Math.max(PAD / 2, g.p0[1] - sz * 0.55))); } }
    draw();
  }
  strip.addEventListener('pointerup', up); strip.addEventListener('pointercancel', up);

  /* ───────── the marks: a tap, and a long press for the other way ───────── */
  function press(el, tap, long) { var t = 0, longed = false;
    el.addEventListener('pointerdown', function () { longed = false; t = setTimeout(function () { longed = true; buzz(14); long(); }, 480); });
    el.addEventListener('pointerup', function () { clearTimeout(t); if (!longed) tap(); });
    el.addEventListener('pointerleave', function () { clearTimeout(t); });
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(); } }); }
  function nibDraw() { var b = $('#nib'), c = b.querySelector('circle'); c.setAttribute('r', [1.8, 3.2, 5][S.pen]); c.style.fill = S.white ? 'none' : ''; c.style.stroke = S.white ? 'currentColor' : ''; c.style.strokeWidth = S.white ? '1.4' : '';
    b.classList.toggle('on', S.ink); b.setAttribute('aria-pressed', String(S.ink)); b.setAttribute('aria-label', S.ink ? 'Pen on' : 'Pen off'); }
  press($('#nib'), function () { S.ink = !S.ink; buzz(6); nibDraw(); }, function () { var k = S.pen + (S.white ? 3 : 0); k = (k + 1) % 4; S.white = k === 3; S.pen = S.white ? 0 : k; S.ink = true; nibDraw(); });
  press($('#back'), undo, redo);
  var armed = 0;
  function shiver() { strip.classList.remove('shiver'); void strip.offsetWidth; strip.classList.add('shiver'); }
  press($('#wipe'), function () {
    if (!armed) { armed = setTimeout(function () { armed = 0; $('#wipe').classList.remove('armed'); }, 2200); $('#wipe').classList.add('armed'); shiver(); buzz(10); return; }
    clearTimeout(armed); armed = 0; $('#wipe').classList.remove('armed'); if (!S.items.length) return; mark(); S.items = []; buzz([10, 40, 20]); draw(); }, function () { /* none */ });

  /* ───────── printers: every one it can print on, now and as more come on ───────── */
  var ISL = [], TO = store.get('da.paper.to', '');
  function word(p) { var w = String((p && (p.name || p.id)) || '').trim().split(/\s+/); return w.length <= 2 ? w.join(' ') : w[0]; }
  function hdr() { var k = store.get('da.hm.key', ''); return /^[A-Za-z0-9_-]{16,64}$/.test(k) ? { authorization: 'Bearer ' + k } : {}; }
  function live(p) { return !!(p && (p.ready || p.ghost)); }
  function printers() {
    return fetch('/api/partners', { headers: hdr(), cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : {}; }).then(function (j) {
      ISL = ((j && j.partners) || []).filter(function (p) { return p.id === 'novelglobal' || p.ghost || (p.paired && (p.links || []).indexOf('wish') >= 0); })
        .sort(function (a, b) { return live(b) - live(a); });
      if (!ISL.some(function (p) { return p.id === TO; })) TO = ISL.length ? ISL[0].id : 'novelglobal'; toDraw(); }).catch(toDraw); }
  function toNow() { return ISL.filter(function (p) { return p.id === TO; })[0] || null; }
  function toDraw() { var p = toNow(), b = $('#to'); b.querySelector('b').textContent = p ? word(p) : 'novel.global'; b.classList.toggle('on', live(p)); b.setAttribute('aria-label', 'Prints on ' + (p ? word(p) : 'novel.global') + (live(p) ? ', on now' : '')); }
  $('#to').addEventListener('click', function () { open(true); if (ISL.length < 2) return buzz(30); var i = ISL.findIndex(function (p) { return p.id === TO; }); TO = ISL[(i + 1) % ISL.length].id; store.set('da.paper.to', TO); buzz(6); toDraw(); });
  setInterval(function () { if (!D.hidden) printers(); }, 30e3);

  /* ───────── the tick: open, then print ───────── */
  var outT = 0;
  function open(on) { D.body.classList.toggle('out', on); clearTimeout(outT); if (on) outT = setTimeout(function () { open(false); }, 6000); }
  $('#tick').addEventListener('click', function () { if (!S.items.length) { shiver(); return buzz(30); } if (!D.body.classList.contains('out')) { open(true); buzz(6); return; } print(); });
  $('#keep').addEventListener('click', function () { keep(); });

  function say(t) { var s = $('#say'); s.textContent = t; s.classList.add('on'); clearTimeout(say.t); say.t = setTimeout(function () { s.classList.remove('on'); }, 2600); }
  /* this phone's code, as the rest of the site keeps it (made here if there is none yet) */
  function me() { var c = store.get('da.who', ''); if (/^(?:[A-HJ-NP-Z2-9]{3}|[A-HJ-NP-Z2-9]{6})$/.test(c)) return c; var ch = 'ABCDEFGHJKMNPQRSTVWXYZ23456789', r = new Uint8Array(3), s;
    do { crypto.getRandomValues(r); s = ''; for (var i = 0; i < 3; i++) s += ch[r[i] % 30]; } while (!(/[A-Z]/.test(s) && /[2-9]/.test(s))); store.set('da.who', s); store.set('da.who.at', Date.now()); return s; }
  function code() { var CR = '0123456789ABCDEFGHJKMNPQRSTVWXYZ', r = new Uint8Array(4), s = 'DA-'; crypto.getRandomValues(r); for (var i = 0; i < 4; i++) s += CR[r[i] % 32]; return s; }
  /* the portfolio on the home (the same store the rest of the site keeps its art in) */
  function folioAdd(c, codeT) { try { var src = c.toDataURL('image/jpeg', 0.86), item = { id: 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), at: Date.now(), src: src, cap: '', code: codeT || '' };
    var q = indexedDB.open('novelglobal', 2); q.onupgradeneeded = function () { var d0 = q.result; ['folio', 'piece'].forEach(function (n) { if (!d0.objectStoreNames.contains(n)) d0.createObjectStore(n, { keyPath: 'id' }); }); };
    q.onsuccess = function () { try { q.result.transaction('folio', 'readwrite').objectStore('folio').put(item); } catch (e) { /* kept on the wall here */ } }; } catch (e) { /* kept on the wall here */ } }
  function wallAdd(c) { var w = store.get('da.paper.wall', []) || [], u; try { u = c.toDataURL('image/jpeg', 0.82); } catch (e) { return; } w.unshift(u); while (w.length && !store.set('da.paper.wall', w.slice(0, 24))) w.pop(); }
  function away() { strip.classList.add('feed'); buzz([8, 30, 8]); S.items = []; S.done = []; S.undone = []; editing = null; type.hidden = true; setTimeout(function () { strip.classList.remove('feed'); fit(); }, 720); }

  function print() {
    open(false); var p = toNow(), dots = p && +p.paper === 58 ? 384 : 512, cd = code(), body = null, shot = null;
    try { var c = forPrinter(dots), isle = (store.get('da.hm.isle', null) || {}).id; shot = colour(W);
      body = { kind: 'record', code: cd, body: JSON.stringify({ type: 'paper', w: c.width, h: c.height }), lat: -37.8136, lng: 144.9631, dest: p ? p.id : 'novelglobal',
        escpos: T.raster(c, Object.assign(T.opts(Q), { grey: !!c.grey })), thumb: T.thumb(c), who: me(), from: 'paper', stage: 'paper' };
      if (isle && isle !== body.dest) body.isle = isle; } catch (e) { body = null; }
    if (shot) { wallAdd(shot); folioAdd(shot, cd); } away();
    if (!body) return say('×');
    fetch('/api/stories', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (r) { var st = r.j && (r.j.job ? r.j.job.status : r.j.status); say(!r.ok ? '×' : (p ? word(p) : 'novel.global') + (st === 'held' ? ' · ···' : ' · ✓')); }, function () { say('×'); });
  }
  /* saved: in colour, twice the dots across, as it looks */
  function keep() { if (!S.items.length) { shiver(); return buzz(30); } open(false); var c = colour(W * 2), sm = colour(W); wallAdd(sm); folioAdd(sm, '');
    c.toBlob(function (b) { if (!b) return; var a = D.createElement('a'), u = URL.createObjectURL(b); a.href = u; a.download = 'paper-' + new Date().toISOString().slice(0, 10) + '.png'; D.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); });
    away(); }

  /* ───────── the floors: the paper, the wall, the three cards ───────── */
  var AT = 0, sw = null;
  function go(n) { n = Math.max(0, Math.min(2, n)); if (n === AT) return; AT = n; D.body.dataset.at = AT; if (AT === 1) wallDraw(); buzz(6); }
  var pull = $('.pull');
  pull.addEventListener('click', function () { go(1); }); pull.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(1); } });
  D.addEventListener('pointerdown', function (e) { var onPull = e.target === pull; if (!onPull && (AT === 0 || e.target.closest('button, #site, textarea'))) { sw = null; return; } sw = { x: e.clientX, y: e.clientY, t: Date.now() }; });
  D.addEventListener('pointerup', function (e) { if (!sw) return; var dx = e.clientX - sw.x, dy = e.clientY - sw.y, quick = Date.now() - sw.t < 800; sw = null; if (!quick) return;
    if (Math.abs(dy) > 40 && Math.abs(dy) > Math.abs(dx) * 1.3) return go(AT + (dy < 0 ? 1 : -1));
    if (AT === 1 && Math.abs(dx) > 40) wallStep(dx < 0 ? 1 : -1); });
  addEventListener('keydown', function (e) { if (editing || $('#site').classList.contains('on')) return;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); return e.shiftKey ? redo() : undo(); }
    if (e.key === 'PageDown' || (AT && e.key === 'ArrowUp')) go(AT + 1); else if (e.key === 'PageUp' || e.key === 'ArrowDown') go(AT - 1);
    else if (AT === 1 && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) wallStep(e.key === 'ArrowRight' ? 1 : -1); });
  addEventListener('wheel', function (e) { if (AT === 0 || Math.abs(e.deltaY) < 30 || go.wait) return; go.wait = setTimeout(function () { go.wait = 0; }, 600); go(AT + (e.deltaY > 0 ? 1 : -1)); }, { passive: true });

  var WI = 0;
  function wallDraw() { var w = store.get('da.paper.wall', []) || [], el = $('#wall');
    el.innerHTML = w.length ? '<div class="row">' + w.map(function (u, i) { return '<figure><img alt="Piece ' + (i + 1) + '" src="' + u + '"></figure>'; }).join('') + '</div>' : '<div class="none" aria-hidden="true"><span></span></div>';
    WI = Math.min(WI, Math.max(0, w.length - 1)); wallStep(0);
    Array.prototype.forEach.call(el.querySelectorAll('figure'), function (f) { var last = 0; f.addEventListener('pointerup', function () { var t = Date.now(); if (t - last < 300) f.classList.toggle('near'); last = t; }); }); }
  function wallStep(k) { var row = $('#wall .row'); if (!row) return; WI = Math.max(0, Math.min(row.children.length - 1, WI + k)); row.style.transform = 'translateX(' + (-WI * 100) + '%)'; }

  /* ───────── the three cards, a line each, and the small site each opens ───────── */
  var THREE = [
    { line: 'A second-hand receipt printer and a Raspberry Pi, made into an island.', label: 'Island',
      site: [[['TM-T88V or TM-T88VI', null], ['Raspberry Pi', null], ['SD card', null], ['Build it on the bench', '/twin#bench'], ['The island kit', '/kit'], ['The island software', 'https://github.com/novelglobal/islandarchipelagos/tree/main/kit']]] },
    { line: 'Make a card, share it, and find every island that is open.', label: 'Archipelagos',
      site: [[['Every open island', '/islands'], ['Make a card', '/play'], ['The archipelagos', '/archipelagos'], ['This paper', '/paper']]] },
    { line: 'Stories, quests and workshops, told on paper.', label: 'novel.global',
      site: [[['novel.global', '/'], ['The wall', '/art'], ['Research', '/research']]] }
  ];
  /* every line as the approval page changed it (EVERY LINE; empty: as built) */
  var SAY = {}, say = function (t) { return Object.prototype.hasOwnProperty.call(SAY, t) && SAY[t] ? SAY[t] : t; }, esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var three = $('#three'), drawThree = function () { three.innerHTML = THREE.map(function (c, i) { return '<button data-i="' + i + '" aria-label="' + esc(say(c.label)) + '">' + esc(say(c.line)) + '</button>'; }).join(''); }; drawThree();
  three.addEventListener('click', function (e) { var b = e.target.closest('[data-i]'); if (!b) return; var c = THREE[+b.dataset.i], s = $('#site');
    s.setAttribute('aria-label', say(c.label)); s.querySelector('.in').innerHTML = '<ul>' + c.site[0].map(function (l) { return '<li>' + (l[1] ? '<a href="' + l[1] + '"' + (/^https:/.test(l[1]) ? ' target="_blank" rel="noopener"' : '') + '>' + esc(say(l[0])) + '</a>' : '<span>' + esc(say(l[0])) + '</span>') + '</li>'; }).join('') + '</ul>';
    s.classList.add('on'); buzz(6); s.querySelector('.x').focus(); });
  $('#site .x').addEventListener('click', function () { $('#site').classList.remove('on'); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') $('#site').classList.remove('on'); });

  /* ───────── start: the site's one print setting, the printers, the paper ───────── */
  fetch('/api/settings', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : {}; }).then(function (j) { var o = null; try { o = j && j.printq ? JSON.parse(j.printq) : null; } catch (e) { o = null; } Q = T.settle(o, null); try { SAY = j && j.say ? JSON.parse(j.say) || {} : {}; } catch (e) { SAY = {}; } drawThree(); }).catch(function () { /* the house setting */ });
  printers(); nibDraw(); addEventListener('resize', fit); if (window.visualViewport) visualViewport.addEventListener('resize', function () { if (!editing) { window.scrollTo(0, 0); fit(); } }); fit();
  /* back to the cards: where this came from on the site, else the home */
  $('#home').addEventListener('click', function (e) { e.preventDefault(); try { if (document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1) return history.back(); } catch (x) { /* home */ } location.href = '/'; });
  /* the first visit: the paper comes up and the tick nods, nothing more */
  if (!store.get('da.paper.seen', 0)) { store.set('da.paper.seen', 1); if (strip.animate) strip.animate([{ transform: 'translateY(24px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 600, easing: 'cubic-bezier(.2,.8,.2,1)' });
    setTimeout(function () { var t = $('#tick'); if (t.animate) t.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 520 }); }, 800); }
})();

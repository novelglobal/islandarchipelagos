/* the Pickles card: your face in an Australian animal, or your photo in a zine frame; a pledge for animals this El Niño; printed at the café.
   Open only by the private link on the poster there, or a pass that printer printed. The print carries the code that opens novel.global */
(function () {
  'use strict';
  var T = window.THERMAL, D = document, $ = function (s) { return D.querySelector(s); }, $$ = function (s) { return [].slice.call(D.querySelectorAll(s)); };
  var AW = 512, AH = 680, SC = 2, INK = '#161412', PAPER = '#F4EFE3', HOLE = { x: 256, y: 236, rx: 92, ry: 112 }, WIN = { x: 46, y: 46, w: 420, h: 588 };
  var WHERE = [-37.7845, 144.9727], DONATE = 'https://www.melbournefoe.org.au/climatedonate#10';
  var S = { mode: 'animal', animal: 'koala', pat: 0, pledge: 'hot', img: null, x: HOLE.x, y: HOLE.y, s: 1, r: 0, to: null, busy: false, key: '' };
  var store = { get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* this visit */ } } };
  var api = function (p, o) { return fetch('/api' + p, Object.assign({ headers: { 'content-type': 'application/json' } }, o || {})).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || r.status); e.status = r.status; throw e; } return j; }); }); };

  var PLEDGES = {
    hot: ['HOT', 'When it is hot, I will leave shallow water out for wildlife.'],
    wet: ['WET', 'When it floods, I will look out for animals on the move.'],
    shade: ['SHADE', 'I will plant for shade and shelter, so animals can ride out the heat.']
  };
  /* hand-cut patterns, the site's own (maze, spots, waves, worms, eyes), in inks that sit beside Pickles without copying it */
  var PATS = [['spots', '#E2552E', '#F4EFE3', 'SPOTS'], ['worms', '#F4EFE3', '#1F5A3A', 'WORMS'], ['eyes', '#161412', '#F2B6C6', 'EYES'], ['lines', '#2350B8', '#F4EFE3', 'WAVES'], ['maze', '#161412', '#F4EFE3', 'MAZE']];

  function rnd(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function noise2(seed) { var r = rnd(seed), G = []; for (var i = 0; i < 64 * 64; i++) G.push(r());
    var at = function (x, y) { return G[((y & 63) * 64) + (x & 63)]; }, sm = function (t) { return t * t * (3 - 2 * t); };
    return function (x, y) { var xi = Math.floor(x), yi = Math.floor(y), fx = sm(x - xi), fy = sm(y - yi), a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1); return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy; }; }
  function pattern(g, w, h, kind, fg, bg, seed) { var r = rnd(seed || 3); g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.strokeStyle = fg;
    if (kind === 'maze') { var S2 = 2, W = Math.ceil(w / S2), H = Math.ceil(h / S2), n1 = noise2(seed), n2 = noise2(seed + 9); for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) { var v = n1(x / 14, y / 14) * 0.7 + n2(x / 6, y / 6) * 0.3, f = (v * 9) % 1; if (f < 0.13) g.fillRect(x * S2, y * S2, S2, S2); } return; }
    if (kind === 'spots') { for (var i = 0; i < w * h / 160; i++) { g.beginPath(); g.ellipse(r() * w, r() * h, 3 + r() * 7, 2.4 + r() * 6, r() * 3, 0, 7); g.fill(); } return; }
    if (kind === 'lines') { g.lineWidth = 3; for (var yy = 4; yy < h; yy += 11) { g.beginPath(); for (var xx = 0; xx <= w; xx += 6) { var yv = yy + Math.sin(xx * 0.02 + yy * 0.13) * 3; if (xx) g.lineTo(xx, yv); else g.moveTo(xx, yv); } g.stroke(); } return; }
    if (kind === 'worms') { g.lineCap = 'round'; for (var j = 0; j < w * h / 900; j++) { var x0 = r() * w, y0 = r() * h, a = r() * 6.3, L = 14 + r() * 26; g.lineWidth = 9; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + Math.cos(a + 1) * L, y0 + Math.sin(a + 1) * L, x0 + Math.cos(a) * L * 1.6, y0 + Math.sin(a) * L * 1.6); g.stroke(); g.save(); g.strokeStyle = bg; g.lineWidth = 3; g.stroke(); g.restore(); } return; }
    if (kind === 'eyes') { for (var e = 0; e < w * h / 1300; e++) { var ex = 10 + r() * (w - 20), ey = 8 + r() * (h - 16), s = 6 + r() * 4; g.beginPath(); g.moveTo(ex - s, ey); g.quadraticCurveTo(ex, ey - s * 0.9, ex + s, ey); g.quadraticCurveTo(ex, ey + s * 0.9, ex - s, ey); g.fill(); g.save(); g.fillStyle = bg; g.beginPath(); g.arc(ex + (r() - 0.5) * s * 0.6, ey, s * 0.32, 0, 7); g.fill(); g.restore(); } } }

  /* a hand-drawn shape: an ellipse that wobbles a little, or fluffs at its edge (an ear) */
  function blob(g, cx, cy, rx, ry, o) { o = o || {}; var r = rnd(o.seed || 1), n = 64, p = [r() * 6, r() * 6, r() * 6], wob = o.wob == null ? 0.035 : o.wob, c = Math.cos(o.rot || 0), s = Math.sin(o.rot || 0); g.beginPath();
    for (var i = 0; i <= n; i++) { var a = i / n * Math.PI * 2, k = 1 + wob * (Math.sin(a * 3 + p[0]) * 0.5 + Math.sin(a * 5 + p[1]) * 0.3 + Math.sin(a * 9 + p[2]) * 0.2) + (o.fluff || 0) * Math.abs(Math.sin(a * 11 + p[0]));
      var px = Math.cos(a) * rx * k, py = Math.sin(a) * ry * k, X = cx + px * c - py * s, Y = cy + px * s + py * c; if (i) g.lineTo(X, Y); else g.moveTo(X, Y); } g.closePath(); }
  function ink(g, fill, w) { if (fill) { g.fillStyle = fill; g.fill(); } g.lineWidth = w || 7; g.strokeStyle = INK; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
  function line(g, x0, y0, x1, y1, w, col) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineWidth = w; g.strokeStyle = col || INK; g.lineCap = 'round'; g.stroke(); }
  function branch(g, x0, y0, x1, y1) { line(g, x0, y0, x1, y1, 40); line(g, x0, y0, x1, y1, 27, '#8A6544'); }
  function claws(g, x, y, k) { for (var i = -1; i <= 1; i++) line(g, x + i * 13, y, x + i * 15, y + 14 * (k || 1), 4); }

  /* the sky behind the animal follows the pledge: sun, rain, or leaves */
  function scene(g) { g.fillStyle = PAPER; g.fillRect(0, 0, AW, AH); var r = rnd(7);
    if (S.pledge === 'hot') { g.beginPath(); g.arc(420, 96, 52, 0, 7); ink(g, '#F6C445', 5); for (var i = 0; i < 12; i++) { var a = i / 12 * Math.PI * 2; line(g, 420 + Math.cos(a) * 66, 96 + Math.sin(a) * 66, 420 + Math.cos(a) * 88, 96 + Math.sin(a) * 88, 5); } }
    else if (S.pledge === 'wet') { blob(g, 418, 78, 76, 34, { seed: 5, wob: 0.12 }); ink(g, '#CFD8DE', 5); blob(g, 92, 60, 58, 26, { seed: 6, wob: 0.12 }); ink(g, '#CFD8DE', 5); for (var j = 0; j < 46; j++) { var x = r() * AW, y = 120 + r() * 520; line(g, x, y, x - 6, y + 18, 4, '#2350B8'); } }
    else { for (var k = 0; k < 18; k++) { blob(g, r() * AW, r() * AH, 20, 9, { seed: 30 + k, rot: r() * 3 }); ink(g, '#7FA86A', 4); } }
    g.lineWidth = 6; g.strokeStyle = INK; g.beginPath(); for (var xx = 0; xx <= AW; xx += 8) { var yv = 470 + Math.sin(xx * 0.018) * 12; if (xx) g.lineTo(xx, yv); else g.moveTo(xx, yv); } g.stroke(); }

  var ANIMALS = {
    koala: ['KOALA', function (g) {
      blob(g, 256, 610, 196, 150, { seed: 2 }); ink(g, '#A3A9AD'); blob(g, 256, 640, 104, 100, { seed: 5 }); ink(g, '#EEE8DC', 5);
      branch(g, -30, 520, 550, 470); [[60, 500], [130, 486], [420, 458], [490, 448], [300, 478]].forEach(function (q, i) { blob(g, q[0], q[1] - 26, 30, 13, { seed: 40 + i, rot: -0.7 + i * 0.35 }); ink(g, '#7FA86A', 5); });
      blob(g, 150, 488, 48, 36, { seed: 7 }); ink(g, '#A3A9AD'); claws(g, 150, 512); blob(g, 362, 478, 48, 36, { seed: 8 }); ink(g, '#A3A9AD'); claws(g, 362, 502);
      blob(g, 102, 150, 88, 80, { seed: 11, fluff: 0.1 }); ink(g, '#A3A9AD'); blob(g, 108, 158, 48, 44, { seed: 12, fluff: 0.14 }); ink(g, '#EEE8DC', 4);
      blob(g, 410, 150, 88, 80, { seed: 13, fluff: 0.1 }); ink(g, '#A3A9AD'); blob(g, 404, 158, 48, 44, { seed: 14, fluff: 0.14 }); ink(g, '#EEE8DC', 4);
      blob(g, 256, 252, 168, 150, { seed: 3 }); ink(g, '#A3A9AD'); }],
    roo: ['ROO', function (g) {
      blob(g, 256, 620, 166, 190, { seed: 21 }); ink(g, '#C9875A'); blob(g, 256, 650, 104, 128, { seed: 22 }); ink(g, '#EFCFA8', 5);
      blob(g, 256, 628, 32, 27, { seed: 26 }); ink(g, '#C9875A', 5); blob(g, 236, 600, 9, 19, { seed: 27, rot: -0.4 }); ink(g, '#C9875A', 4); blob(g, 276, 600, 9, 19, { seed: 28, rot: 0.4 }); ink(g, '#C9875A', 4);
      g.fillStyle = INK; [[245, 624], [267, 624]].forEach(function (q) { g.beginPath(); g.arc(q[0], q[1], 3.6, 0, 7); g.fill(); }); g.beginPath(); g.ellipse(256, 636, 6, 4, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(256, 652, 84, 46, 0, 0, Math.PI); g.closePath(); ink(g, '#EFCFA8', 6);
      g.beginPath(); g.ellipse(256, 520, 72, 42, 0, 0, Math.PI); g.closePath(); ink(g, '#F4EFE3', 6); g.beginPath(); g.ellipse(256, 520, 72, 20, 0, 0, 7); ink(g, '#7CC0E3', 6);
      blob(g, 178, 520, 30, 24, { seed: 29 }); ink(g, '#C9875A'); blob(g, 334, 520, 30, 24, { seed: 30 }); ink(g, '#C9875A');
      blob(g, 176, 96, 36, 96, { seed: 23, rot: -0.35 }); ink(g, '#C9875A'); blob(g, 180, 104, 16, 62, { seed: 31, rot: -0.35 }); ink(g, '#EFCFA8', 4);
      blob(g, 336, 96, 36, 96, { seed: 24, rot: 0.35 }); ink(g, '#C9875A'); blob(g, 332, 104, 16, 62, { seed: 32, rot: 0.35 }); ink(g, '#EFCFA8', 4);
      blob(g, 256, 244, 142, 154, { seed: 25 }); ink(g, '#C9875A'); blob(g, 256, 384, 66, 42, { seed: 33 }); ink(g, '#C9875A'); blob(g, 256, 374, 20, 13, { seed: 34, wob: 0.02 }); ink(g, INK, 3); }],
    wombat: ['WOMBAT', function (g) {
      line(g, 430, 650, 430, 120, 9); g.beginPath(); g.moveTo(330, 130); g.quadraticCurveTo(430, -16, 530, 130); for (var i = 3; i >= 0; i--) g.quadraticCurveTo(330 + (i + 0.5) * 50, 152, 330 + i * 50, 130); ink(g, '#F29BB8', 6);
      for (var j = 1; j < 4; j++) line(g, 430, 26, 330 + j * 50, 130, 4);
      blob(g, 256, 620, 232, 150, { seed: 31 }); ink(g, '#8C7563'); blob(g, 150, 664, 54, 34, { seed: 35 }); ink(g, '#8C7563'); claws(g, 150, 684, 0.7); blob(g, 362, 664, 54, 34, { seed: 36 }); ink(g, '#8C7563'); claws(g, 362, 684, 0.7);
      blob(g, 108, 150, 42, 40, { seed: 33 }); ink(g, '#8C7563'); blob(g, 110, 154, 22, 20, { seed: 37 }); ink(g, '#C9B29C', 4); blob(g, 404, 150, 42, 40, { seed: 34 }); ink(g, '#8C7563'); blob(g, 402, 154, 22, 20, { seed: 38 }); ink(g, '#C9B29C', 4);
      blob(g, 256, 264, 196, 158, { seed: 39 }); ink(g, '#8C7563'); blob(g, 256, 384, 52, 27, { seed: 40, wob: 0.02 }); ink(g, '#2A221D', 5); }],
    cocky: ['COCKY', function (g) {
      branch(g, -20, 650, 540, 640);
      blob(g, 256, 560, 150, 172, { seed: 41 }); ink(g, '#FBF9F3'); blob(g, 118, 560, 64, 152, { seed: 42, rot: 0.18 }); ink(g, '#FBF9F3'); blob(g, 394, 560, 64, 152, { seed: 43, rot: -0.18 }); ink(g, '#FBF9F3');
      claws(g, 214, 626); claws(g, 298, 626);
      for (var i = -2; i <= 2; i++) { var a = -Math.PI / 2 + i * 0.34; blob(g, 256 + Math.cos(a) * 112, 132 + Math.sin(a) * 100, 22, 78, { seed: 50 + i, rot: a + Math.PI / 2 }); ink(g, '#F6C445', 6); }
      blob(g, 256, 252, 154, 150, { seed: 44 }); ink(g, '#FBF9F3');
      g.beginPath(); g.moveTo(218, 356); g.quadraticCurveTo(256, 334, 294, 356); g.quadraticCurveTo(288, 414, 256, 426); g.quadraticCurveTo(230, 404, 218, 356); ink(g, '#4A4744', 6); }]
  };
  function hole(g) { g.save(); g.globalCompositeOperation = 'destination-out'; blob(g, HOLE.x, HOLE.y, HOLE.rx, HOLE.ry, { seed: 99, wob: 0.025 }); g.fill(); g.restore(); blob(g, HOLE.x, HOLE.y, HOLE.rx, HOLE.ry, { seed: 99, wob: 0.025 }); ink(g, null, 8); }
  /* a window torn into the pattern, held up with tape, a few stars drawn on */
  function frame(g) { var p = PATS[S.pat]; pattern(g, AW, AH, p[0], p[1], p[2], 11);
    var r = rnd(4), pts = [], x0 = WIN.x, y0 = WIN.y, x1 = WIN.x + WIN.w, y1 = WIN.y + WIN.h, step = 14;
    for (var x = x0; x < x1; x += step) pts.push([x, y0 + (r() - 0.5) * 6]); for (var y = y0; y < y1; y += step) pts.push([x1 + (r() - 0.5) * 6, y]);
    for (x = x1; x > x0; x -= step) pts.push([x, y1 + (r() - 0.5) * 6]); for (y = y1; y > y0; y -= step) pts.push([x0 + (r() - 0.5) * 6, y]);
    var path = function () { g.beginPath(); pts.forEach(function (q, i) { if (i) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); }); g.closePath(); };
    g.save(); g.globalCompositeOperation = 'destination-out'; path(); g.fill(); g.restore(); path(); ink(g, null, 7);
    [[150, 40, -0.12], [360, 40, 0.1]].forEach(function (t) { g.save(); g.translate(t[0], t[1]); g.rotate(t[2]); g.fillStyle = 'rgba(244, 232, 196, .92)'; g.fillRect(-56, -17, 112, 34); g.lineWidth = 3; g.strokeStyle = INK; g.strokeRect(-56, -17, 112, 34); g.restore(); });
    [[30, 640, 22], [486, 92, 17], [482, 600, 14]].forEach(function (s, k) { g.beginPath(); for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? s[2] * 0.45 : s[2]; g.lineTo(s[0] + Math.cos(a) * rr, s[1] + Math.sin(a) * rr); } g.closePath(); ink(g, k ? '#F2B6C6' : '#F6C445', 4); }); }

  function overlay(sc) { var c = D.createElement('canvas'); c.width = AW * sc; c.height = AH * sc; var g = c.getContext('2d'); g.scale(sc, sc);
    if (S.mode === 'animal') { scene(g); ANIMALS[S.animal][1](g); hole(g); } else frame(g); return c; }
  function photo(sc) { var c = D.createElement('canvas'); c.width = AW * sc; c.height = AH * sc; var g = c.getContext('2d'); g.scale(sc, sc); g.fillStyle = '#E4DCCB'; g.fillRect(0, 0, AW, AH);
    if (S.img) { g.save(); g.translate(S.x, S.y); g.rotate(S.r); g.scale(S.s, S.s); g.drawImage(S.img, -S.img.width / 2, -S.img.height / 2); g.restore(); }
    else { var cx = S.mode === 'animal' ? HOLE.x : AW / 2, cy = S.mode === 'animal' ? HOLE.y : AH / 2; g.fillStyle = '#CFC4AE'; g.beginPath(); g.arc(cx, cy - 18, 40, 0, 7); g.fill(); g.beginPath(); g.ellipse(cx, cy + 74, 70, 42, 0, Math.PI, 0); g.fill();
      g.fillStyle = INK; g.font = "600 18px 'IBM Plex Mono', monospace"; g.textAlign = 'center'; g.fillText('PHOTO', cx, cy + (S.mode === 'animal' ? 100 : 140)); }
    return c; }

  /* ───────── the screen ───────── */
  var cv, cx2, OV = null;
  function paint() { if (!cv) return; if (!OV) OV = overlay(SC); cx2.clearRect(0, 0, cv.width, cv.height); cx2.drawImage(photo(SC), 0, 0); cx2.drawImage(OV, 0, 0); }
  function redo() { OV = null; paint(); }
  function fit() { if (!S.img) return; var w = S.img.width, h = S.img.height;
    if (S.mode === 'animal') { S.x = HOLE.x; S.y = HOLE.y + 10; S.s = HOLE.ry * 2 * 2.3 / h; if (w * S.s < HOLE.rx * 2.4) S.s = HOLE.rx * 2.4 / w; }
    else { S.x = WIN.x + WIN.w / 2; S.y = WIN.y + WIN.h / 2; S.s = Math.max(WIN.w / w, WIN.h / h); } S.r = 0; }
  function take(f) { if (!f) return; var u = URL.createObjectURL(f), im = new Image();
    im.onload = function () { var k = Math.min(1, 1400 / Math.max(im.width, im.height)), c = D.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); S.img = c; fit(); paint(); say(''); };
    im.onerror = function () { say('×'); }; im.src = u; }
  function pick() { var f = D.createElement('input'); f.type = 'file'; f.accept = 'image/*'; f.addEventListener('change', function () { take(f.files && f.files[0]); }); f.click(); }
  function zoom(k, ax, ay) { if (!S.img) return; ax = ax == null ? S.x : ax; ay = ay == null ? S.y : ay; S.x = ax + (S.x - ax) * k; S.y = ay + (S.y - ay) * k; S.s = Math.max(0.02, Math.min(20, S.s * k)); paint(); }
  function gestures() { var P = {}, last = null, moved = 0;
    var at = function (e) { var r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * AW / r.width, (e.clientY - r.top) * AH / r.height]; };
    var two = function () { var k = Object.keys(P); if (k.length < 2) return null; var a = P[k[0]], b = P[k[1]]; return { m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], d: Math.hypot(a[0] - b[0], a[1] - b[1]), a: Math.atan2(b[1] - a[1], b[0] - a[0]) }; };
    cv.addEventListener('pointerdown', function (e) { P[e.pointerId] = at(e); cv.setPointerCapture(e.pointerId); last = two(); moved = 0; });
    cv.addEventListener('pointermove', function (e) { if (!P[e.pointerId] || !S.img) return; var p0 = P[e.pointerId], p1 = at(e); P[e.pointerId] = p1; var t = two();
      if (t && last) { S.x += t.m[0] - last.m[0]; S.y += t.m[1] - last.m[1]; zoom(t.d / Math.max(1, last.d), t.m[0], t.m[1]); var da = t.a - last.a, dx = S.x - t.m[0], dy = S.y - t.m[1], c = Math.cos(da), s = Math.sin(da); S.x = t.m[0] + dx * c - dy * s; S.y = t.m[1] + dx * s + dy * c; S.r += da; last = t; moved += 9; paint(); return; }
      S.x += p1[0] - p0[0]; S.y += p1[1] - p0[1]; moved += Math.abs(p1[0] - p0[0]) + Math.abs(p1[1] - p0[1]); paint(); });
    var up = function (e) { var was = !!P[e.pointerId]; delete P[e.pointerId]; last = two(); if (was && !S.img && moved < 6 && e.type === 'pointerup') pick(); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', function (e) { if (!S.img) return; e.preventDefault(); var p = at(e); zoom(Math.exp(-e.deltaY * 0.0015), p[0], p[1]); }, { passive: false }); }

  /* ───────── the print: the photograph dithered, the drawing in solid ink and screened greys, the pledge, the code ───────── */
  function wrap(g, s, w) { var out = [], cur = ''; s.split(' ').forEach(function (x) { var t = cur ? cur + ' ' + x : x; if (g.measureText(t).width > w && cur) { out.push(cur); cur = x; } else cur = t; }); out.push(cur); return out; }
  function whoNow() { var c = store.get('da.who', ''), at = +store.get('da.who.at', 0) || 0; if (/^[A-HJ-NP-Z2-9]{3}$/.test(c) && at && Date.now() - at < 29.53 * 864e5) return c;
    var A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = new Uint8Array(3); crypto.getRandomValues(r); c = ''; for (var i = 0; i < 3; i++) c += A[r[i] % A.length]; store.set('da.who', c); store.set('da.who.at', Date.now()); return c; }
  function paper(who) { var W = AW, pad = 26, out = D.createElement('canvas'), m = out.getContext('2d'); m.font = "600 30px Poppins, sans-serif"; var lines = wrap(m, PLEDGES[S.pledge][1], W - pad * 2);
    var TH = 30 + 60 + lines.length * 38 + 56 + 30 + 56 + 46 + 30; out.width = W; out.height = AH + TH; m = out.getContext('2d'); m.fillStyle = '#FFF'; m.fillRect(0, 0, W, out.height);
    var ph = photo(1).getContext('2d').getImageData(0, 0, W, AH), ov = overlay(1).getContext('2d').getImageData(0, 0, W, AH), n = W * AH, L = new Float32Array(n), O = new Float32Array(n), i, v;
    for (i = 0; i < n; i++) { v = ph.data[i * 4] * 0.299 + ph.data[i * 4 + 1] * 0.587 + ph.data[i * 4 + 2] * 0.114; L[i] = Math.max(0, Math.min(255, (v - 128) * 1.38 + 124)); O[i] = ov.data[i * 4] * 0.299 + ov.data[i * 4 + 1] * 0.587 + ov.data[i * 4 + 2] * 0.114; O[i] = O[i] < 70 ? 0 : O[i] > 236 ? 255 : O[i] * 0.66 + 82; }
    var how = T.pick(L, W, AH); T.dots(L, W, AH, how === 'none' ? 'atkinson' : how); T.dots(O, W, AH, 'bayer');
    var img = m.createImageData(W, AH); for (i = 0; i < n; i++) { v = ov.data[i * 4 + 3] > 128 ? O[i] : L[i]; v = v < 128 ? 0 : 255; img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; } m.putImageData(img, 0, 0);
    var y = AH + 30; m.fillStyle = '#000'; m.strokeStyle = '#000'; m.lineWidth = 4; m.beginPath(); for (var x = pad; x <= W - pad; x += 6) { var yy = y + Math.sin(x * 0.08) * 4; if (x === pad) m.moveTo(x, yy); else m.lineTo(x, yy); } m.stroke();
    y += 60; m.font = "700 54px Poppins, sans-serif"; m.fillText('I PLEDGE', pad, y);
    m.font = "600 30px Poppins, sans-serif"; lines.forEach(function (l) { y += 38; m.fillText(l, pad, y); });
    y += 56; m.font = "600 22px 'IBM Plex Mono', monospace"; m.fillText('WE ADAPT TOGETHER', pad, y);
    y += 30; for (x = pad; x < W - pad; x += 12) m.fillRect(x, y, 6, 2);
    y += 56; m.font = "700 40px Poppins, sans-serif"; m.fillText('novel.global', pad, y);
    m.font = "600 30px 'IBM Plex Mono', monospace"; var cw = m.measureText(who).width; m.textAlign = 'right'; m.fillText(who, W - pad, y); m.textAlign = 'left'; m.lineWidth = 3; m.strokeRect(W - pad - cw - 12, y - 32, cw + 24, 44);
    var d = m.getImageData(0, AH, W, out.height - AH); for (i = 0; i < d.data.length; i += 4) { v = d.data[i] < 140 ? 0 : 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } m.putImageData(d, 0, AH);
    return out; }
  function code() { var A = '0123456789ABCDEFGHJKMNPQRSTVWXYZ', s = 'DA-', r = new Uint8Array(4); crypto.getRandomValues(r); for (var i = 0; i < 4; i++) s += A[r[i] % 32]; return s; }
  function today() { return new Date(Date.now() + 10 * 36e5).toISOString().slice(0, 10); }
  function print() { if (S.busy) return; if (!S.img) { pick(); return; } if (!S.to) { say('NO PRINTER'); return; } S.busy = true; $('#go').disabled = true; say('· · ·');
    var who = whoNow(), ps = store.get('da.pass', null); if (ps && (ps.island !== S.to || ps.day !== today())) ps = null;
    fonts().then(function () { var c = paper(who);
      return api('/stories', { method: 'POST', body: JSON.stringify({ kind: 'record', code: code(), body: JSON.stringify({ type: 'stack', stack: 'pickles', lat: WHERE[0], lng: WHERE[1] }), lat: WHERE[0], lng: WHERE[1], dest: S.to, escpos: T.raster(c, 0), from: 'pop', stage: 'stack', who: who, pop: S.key, pass: ps ? ps.code : undefined }) }); })
      .then(function (j) { if (j && j.passed) try { localStorage.removeItem('da.pass'); } catch (e) { /* none */ } say(j && j.passed ? 'PRINTING' : 'SENT'); $('#st').title = j && j.passed ? '' : 'It prints once the café says yes'; $('#code b').textContent = who; $('#code').hidden = false; },
        function (e) { say(e.status === 429 ? 'WAIT' : e.status === 403 ? 'CLOSED' : e.status === 503 ? 'BUSY' : 'UNSENT'); })
      .then(function () { S.busy = false; $('#go').disabled = false; }); }
  function fonts() { return D.fonts && D.fonts.load ? Promise.all(["700 54px Poppins", "600 30px Poppins", "600 22px 'IBM Plex Mono'"].map(function (f) { return D.fonts.load(f); })).catch(function () {}) : Promise.resolve(); }

  /* to keep and send: the colour picture, the pledge under it, both logos */
  function keepsake() { var W = AW * SC, c = D.createElement('canvas'), band = 470; c.width = W; c.height = AH * SC + band; var g = c.getContext('2d'); g.drawImage(cv, 0, 0); g.fillStyle = PAPER; g.fillRect(0, AH * SC, W, band);
    var y = AH * SC + 84; g.fillStyle = INK; g.font = "700 72px Poppins, sans-serif"; g.fillText('I pledge', 52, y); g.font = "600 40px Poppins, sans-serif"; wrap(g, PLEDGES[S.pledge][1], W - 104).forEach(function (l) { y += 52; g.fillText(l, 52, y); });
    var lg = [$('#lg-p'), $('#lg-f')], x = 52; lg.forEach(function (im) { if (!im || !im.naturalWidth) return; var h = 120, w = im.naturalWidth * h / im.naturalHeight; g.drawImage(im, x, c.height - h - 40, w, h); x += w + 28; });
    g.font = "700 44px Poppins, sans-serif"; g.textAlign = 'right'; g.fillText('novel.global', W - 52, c.height - 70); return c; }
  function save(share) { fonts().then(function () { keepsake().toBlob(function (b) { if (!b) return; var f = new File([b], 'adapt-together.png', { type: 'image/png' });
    if (share && navigator.canShare && navigator.canShare({ files: [f] })) { navigator.share({ files: [f], title: 'Adapt together' }).catch(function () { /* closed */ }); return; }
    var a = D.createElement('a'); a.href = URL.createObjectURL(b); a.download = f.name; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000); }, 'image/png'); }); }

  function say(t) { var s = $('#st'); if (s) { s.textContent = t; s.title = ''; } }
  function printers() { return api('/partners').then(function (j) { var l = j.partners || [], want = new URLSearchParams(location.search).get('to'), ok = function (p) { return p && (p.paired || p.id === 'novelglobal'); };
      var p = l.filter(function (q) { return q.id === want && ok(q); })[0] || l.filter(function (q) { return q.id === 'pickles' && ok(q); })[0] || l.filter(function (q) { return q.id === 'novelglobal'; })[0];
      S.to = p ? p.id : null; $('#led').classList.toggle('on', !!(p && p.ready)); $('#led').title = p ? (p.name || p.id) + (p.ready ? ' · listening' : ' · asleep') : ''; }, function () { S.to = null; }); }

  function picks() { var el = $('#picks');
    el.innerHTML = S.mode === 'animal' ? Object.keys(ANIMALS).map(function (k) { return '<button type="button" data-an="' + k + '" aria-pressed="' + (S.animal === k) + '">' + ANIMALS[k][0] + '</button>'; }).join('')
      : PATS.map(function (p, i) { return '<button type="button" data-pt="' + i + '" aria-pressed="' + (S.pat === i) + '" style="--a:' + p[1] + ';--b:' + p[2] + '"><i></i>' + p[3] + '</button>'; }).join(''); }
  function pledges() { $$('[data-pl]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.pl === S.pledge)); }); $('#pl').textContent = PLEDGES[S.pledge][1]; }

  function open() { $('#gate').hidden = true; $('#card').hidden = false; cv = $('#stage'); cv.width = AW * SC; cv.height = AH * SC; cx2 = cv.getContext('2d'); gestures(); picks(); pledges(); fonts().then(redo); printers();
    $('#donate').href = DONATE;
    D.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.mode) { S.mode = b.dataset.mode; $$('[data-mode]').forEach(function (q) { q.setAttribute('aria-pressed', String(q === b)); }); picks(); fit(); redo(); }
      else if (b.dataset.an) { S.animal = b.dataset.an; picks(); redo(); }
      else if (b.dataset.pt != null) { S.pat = +b.dataset.pt; picks(); redo(); }
      else if (b.dataset.pl) { S.pledge = b.dataset.pl; pledges(); redo(); }
      else if (b.id === 'ph') pick(); else if (b.id === 'zin') zoom(1.12); else if (b.id === 'zout') zoom(1 / 1.12);
      else if (b.id === 'rl') { S.r -= 0.07; paint(); } else if (b.id === 'rr') { S.r += 0.07; paint(); }
      else if (b.id === 'go') print(); else if (b.id === 'sv') save(false); else if (b.id === 'sh') save(true); }); }
  function closed(why) { $('#gate').hidden = false; $('#card').hidden = true; $('#gst').textContent = why || ''; }
  function check(k) { return api('/pop?k=' + encodeURIComponent(k)).then(function () { S.key = k; store.set('da.pop.k', k); open(); return true; }, function (e) { return e.status === 429 ? 'WAIT' : false; }); }

  window.POP = { paper: paper, state: S, take: take };
  D.addEventListener('DOMContentLoaded', function () {
    var q = new URLSearchParams(location.search), k = q.get('k') || store.get('da.pop.k', '');
    if (q.get('k')) { q.delete('k'); history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '')); }
    $('#gform').addEventListener('submit', function (e) { e.preventDefault(); var v = $('#gin').value.trim().toUpperCase().replace(/[^A-Z0-9]/g, ''); if (v.length !== 6) { $('#gst').textContent = '×'; return; } $('#gst').textContent = '· · ·'; check(v.slice(0, 3) + '-' + v.slice(3)).then(function (ok) { if (ok !== true) $('#gst').textContent = ok || '×'; }); });
    if (!k) return closed(''); check(k).then(function (ok) { if (ok !== true) { store.set('da.pop.k', ''); closed(ok || ''); } });
  });
})();

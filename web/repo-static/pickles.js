/* a pop-up card: your face in an Australian animal's, placed by hand, printed at the place hosting it. Open only by its private link (the poster QR)
   or a pass that printer printed. Each pop-up's logos, printer, donation, tips and animals come from the POP-UPS page in admin; these defaults are Pickles' */
(function () {
  'use strict';
  var T = window.THERMAL, D = document, $ = function (s) { return D.querySelector(s); };
  var AW = 512, AH = 640, SC = 2, INK = '#161412', CREAM = '#F4EFE3', FACE = 250;
  var WHERE = [-37.7845, 144.9727];
  /* each animal, and where its face is: centre and radii as parts of the photo's width and height */
  var ANIMALS = [
    ['frill', 'frilled lizard', 0.49, 0.30, 0.125, 0.15],
    ['roo', 'kangaroo', 0.505, 0.455, 0.17, 0.125],
    ['dingo', 'dingo', 0.465, 0.52, 0.2, 0.19],
    ['emu', 'emu', 0.515, 0.44, 0.29, 0.165],
    ['quokka', 'quokka', 0.635, 0.43, 0.16, 0.135],
    ['wombat', 'wombat', 0.515, 0.385, 0.125, 0.17],
    ['echidna', 'echidna', 0.56, 0.40, 0.12, 0.12]
  ];
  /* what each pop-up can change, from the POP-UPS page in admin; these are Pickles' */
  var CFG = { id: 'pickles', to: '', logos: ['pop/pickles.png', 'pop/foe.png'], donate: { url: 'https://www.melbournefoe.org.au/climatedonate#10', label: 'DONATE $10' }, animals: null,
    tips: { title: 'El Niño', lines: [
      'El Niño often brings south-east Australia a hotter, drier summer: more fire danger, less rain.',
      'Put a shallow bowl of water in the shade, with a stick or stones so bees, birds and lizards can climb out.',
      'On hot days, check on neighbours, elders and pets. Cats inside keeps them and wildlife safer.',
      'Plant local natives: shade and food for birds, insects and people, on very little water.',
      'Found heat-stressed wildlife? Call Wildlife Victoria on 03 8400 7300.',
      'Know your fire danger rating, and make a plan with everyone you live with, animals too.'] } };
  var S = { a: -1, an: null, img: null, x: 0, y: 0, s: 1, r: 0, hole: null, to: null, busy: false, key: '', IM: {}, drag: false };
  var store = { get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* this visit */ } } };
  var api = function (p, o) { return fetch('/api' + p, Object.assign({ headers: { 'content-type': 'application/json' } }, o || {})).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || r.status); e.status = r.status; throw e; } return j; }); }); };
  function rnd(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function canvas(sc) { var c = D.createElement('canvas'); c.width = AW * sc; c.height = AH * sc; var g = c.getContext('2d'); g.scale(sc, sc); return [c, g]; }

  /* the animal photo laid over the page: big enough that the face is about a third of the print, the face hole a little above the middle */
  function lay(an, im) { var W = im.naturalWidth, H = im.naturalHeight, k = FACE / (2 * an[5] * H); k = Math.max(k, AW / W, AH / H);
    var ox = Math.min(0, Math.max(AW - W * k, AW / 2 - an[2] * W * k)), oy = Math.min(0, Math.max(AH - H * k, AH * 0.42 - an[3] * H * k));
    return { ox: ox, oy: oy, k: k, x: ox + an[2] * W * k, y: oy + an[3] * H * k, rx: an[4] * W * k, ry: an[5] * H * k }; }
  /* a hole cut by hand: a wobbly oval, never quite round */
  function wob(g, h, seed, grow) { var r = rnd(seed), p = [r() * 6, r() * 6, r() * 6], n = 72; g.beginPath();
    for (var i = 0; i <= n; i++) { var a = i / n * Math.PI * 2, k = 1 + 0.05 * (Math.sin(a * 2 + p[0]) * 0.5 + Math.sin(a * 3 + p[1]) * 0.35 + Math.sin(a * 7 + p[2]) * 0.15), X = h.x + Math.cos(a) * (h.rx + grow) * k, Y = h.y + Math.sin(a) * (h.ry + grow) * k; if (i) g.lineTo(X, Y); else g.moveTo(X, Y); } g.closePath(); }
  function animal(sc) { var cg = canvas(sc), c = cg[0], g = cg[1], an = S.an, im = an && S.IM[an[0]]; if (!im) return c;
    var L = lay(an, im); g.drawImage(im, L.ox, L.oy, im.naturalWidth * L.k, im.naturalHeight * L.k); S.hole = L;
    g.save(); g.globalCompositeOperation = 'destination-out'; wob(g, L, 17, 0); g.fill(); g.restore();
    /* the pen goes round twice and never quite meets itself */
    g.lineJoin = g.lineCap = 'round'; wob(g, L, 17, 3); g.lineWidth = 9; g.strokeStyle = CREAM; g.stroke(); wob(g, L, 23, 1); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
    var sx = L.x + L.rx * 0.86, sy = L.y - L.ry * 0.9; [[-0.5, 26], [-0.05, 30], [0.4, 24]].forEach(function (q) { g.beginPath(); g.moveTo(sx + Math.cos(q[0] - 1.2) * 12, sy + Math.sin(q[0] - 1.2) * 12); g.lineTo(sx + Math.cos(q[0] - 1.2) * q[1], sy + Math.sin(q[0] - 1.2) * q[1]); g.lineWidth = 4.5; g.strokeStyle = INK; g.stroke(); });
    return c; }
  function you(g) { g.save(); g.translate(S.x, S.y); g.rotate(S.r); g.scale(S.s, S.s); g.drawImage(S.img, -S.img.width / 2, -S.img.height / 2); g.restore(); }
  function face(sc) { var cg = canvas(sc), c = cg[0], g = cg[1], h = S.hole; g.fillStyle = CREAM; g.fillRect(0, 0, AW, AH);
    if (S.img) you(g);
    else if (h) { g.strokeStyle = INK; g.fillStyle = INK; g.lineWidth = 5; g.lineCap = 'round'; var e = Math.min(h.rx, h.ry);
      [[-0.32, -0.12], [0.3, -0.16]].forEach(function (q) { g.beginPath(); g.ellipse(h.x + q[0] * e, h.y + q[1] * e, e * 0.06, e * 0.09, 0, 0, 7); g.fill(); });
      g.beginPath(); g.moveTo(h.x - e * 0.3, h.y + e * 0.22); g.quadraticCurveTo(h.x, h.y + e * 0.5, h.x + e * 0.32, h.y + e * 0.18); g.stroke(); }
    return c; }
  /* exactly what the printer makes of the picture: one photograph, dithered */
  function inked() { var F = face(1), A = animal(1), h = S.hole, n = AW * AH, i, v;
    var fd = F.getContext('2d').getImageData(0, 0, AW, AH).data, ad = A.getContext('2d').getImageData(0, 0, AW, AH).data, Lf = new Float32Array(n), La = new Float32Array(n);
    for (i = 0; i < n; i++) { Lf[i] = fd[i * 4] * 0.299 + fd[i * 4 + 1] * 0.587 + fd[i * 4 + 2] * 0.114; v = ad[i * 4] * 0.299 + ad[i * 4 + 1] * 0.587 + ad[i * 4 + 2] * 0.114; La[i] = v; }
    /* the animal stretched to its own range, kept a touch lighter than the face */
    (function () { var hs = new Uint32Array(256), t = 0, j, lo = 0, hi = 255, c = 0; for (j = 0; j < n; j++) if (ad[j * 4 + 3] > 127) { hs[La[j] | 0]++; t++; } for (j = 0; j < 256; j++) { c += hs[j]; if (c > t * 0.02) { lo = j; break; } } c = 0; for (j = 255; j >= 0; j--) { c += hs[j]; if (c > t * 0.02) { hi = j; break; } }
      var q = 225 / Math.max(40, hi - lo); for (j = 0; j < n; j++) La[j] = Math.max(0, Math.min(255, 22 + (La[j] - lo) * q)); })();
    /* the face gets its own levels, from what shows in the hole, so it reads clearly against the fur */
    if (S.img && h) { var hist = new Uint32Array(256), cnt = 0, x0 = Math.max(0, h.x - h.rx | 0), x1 = Math.min(AW, h.x + h.rx | 0), y0 = Math.max(0, h.y - h.ry | 0), y1 = Math.min(AH, h.y + h.ry | 0), x, y;
      for (y = y0; y < y1; y++) for (x = x0; x < x1; x++) { i = y * AW + x; if (ad[i * 4 + 3] < 20) { hist[Lf[i] | 0]++; cnt++; } }
      var lo = 0, hi = 255, c = 0; for (v = 0; v < 256; v++) { c += hist[v]; if (c > cnt * 0.02) { lo = v; break; } } c = 0; for (v = 255; v >= 0; v--) { c += hist[v]; if (c > cnt * 0.02) { hi = v; break; } }
      var k = 255 / Math.max(40, hi - lo); for (i = 0; i < n; i++) Lf[i] = Math.max(0, Math.min(255, Math.pow(Math.max(0, Math.min(1, (Lf[i] - lo) * k / 255)), 0.85) * 255)); }
    T.dots(Lf, AW, AH, 'atkinson'); var how = T.pick(La, AW, AH); T.dots(La, AW, AH, how === 'none' ? 'atkinson' : how);
    var cg = canvas(1), cc = cg[0], m = cg[1], d = m.createImageData(AW, AH);
    for (i = 0; i < n; i++) { v = (ad[i * 4 + 3] > 127 ? La[i] : Lf[i]) < 128 ? 0 : 255; d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255; } m.putImageData(d, 0, 0); return cc; }
  /* ───────── the stage: colour, or the print itself; while a finger is down the whole photo shows faintly so it is easy to fit ───────── */
  var cv, cx2, OV = null, raf = 0;
  function paint() { if (!cv || raf) return; raf = requestAnimationFrame(draw); }
  function draw() { raf = 0; if (!OV) OV = animal(SC); cx2.setTransform(1, 0, 0, 1, 0, 0); cx2.clearRect(0, 0, cv.width, cv.height);
    cx2.drawImage(face(SC), 0, 0); cx2.drawImage(OV, 0, 0);
    if (S.drag && S.img) { cx2.save(); cx2.scale(SC, SC); cx2.globalAlpha = 0.35; you(cx2); cx2.globalAlpha = 1; cx2.setLineDash([7, 7]); cx2.lineWidth = 2; cx2.strokeStyle = '#E2552E'; wob(cx2, S.hole, 17, 0); cx2.stroke(); cx2.restore(); } }
  function fit() { var h = S.hole; if (!S.img || !h) return; S.x = h.x; S.y = h.y + h.ry * 0.08; S.s = h.ry * 2 * 2.1 / S.img.height; if (S.img.width * S.s < h.rx * 2.3) S.s = h.rx * 2.3 / S.img.width; S.r = 0; }
  function load(an) { return S.IM[an[0]] ? Promise.resolve() : new Promise(function (res) { var im = new Image(); im.onload = function () { S.IM[an[0]] = im; res(); }; im.onerror = res; im.src = 'pop/animals/' + an[0] + '.jpg'; }); }
  function pool() { var l = CFG.animals && CFG.animals.length ? ANIMALS.filter(function (a) { return CFG.animals.indexOf(a[0]) >= 0; }) : ANIMALS; return l.length ? l : ANIMALS; }
  function another() { var L = pool(), i; do { i = Math.floor(Math.random() * L.length); } while (L[i] === S.an && L.length > 1); S.an = L[i];
    var nm = $('#nm'); nm.textContent = S.an[1]; nm.style.transform = 'rotate(' + (Math.random() * 6 - 3).toFixed(1) + 'deg)';
    return load(S.an).then(function () { OV = null; OV = animal(SC); fit(); paint(); }); }
  function take(f) { if (!f) return; var u = URL.createObjectURL(f), im = new Image();
    im.onload = function () { var k = Math.min(1, 1400 / Math.max(im.width, im.height)), c = D.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); S.img = c; fit(); paint(); $('#go').disabled = false; $('#rm').hidden = false; say(''); };
    im.onerror = function () { say('×'); }; im.src = u; }
  function drop() { S.img = null; $('#go').disabled = true; $('#rm').hidden = true; paint(); }
  function pick() { var f = D.createElement('input'); f.type = 'file'; f.accept = 'image/*'; f.addEventListener('change', function () { take(f.files && f.files[0]); }); f.click(); }
  function zoom(k, ax, ay) { if (!S.img) return; ax = ax == null ? S.x : ax; ay = ay == null ? S.y : ay; S.x = ax + (S.x - ax) * k; S.y = ay + (S.y - ay) * k; S.s = Math.max(0.02, Math.min(20, S.s * k)); paint(); }
  function turn(da) { if (!S.img) return; S.r += da; paint(); }
  function gestures() { var P = {}, last = null, moved = 0;
    var at = function (e) { var r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * AW / r.width, (e.clientY - r.top) * AH / r.height]; };
    var two = function () { var k = Object.keys(P); if (k.length < 2) return null; var a = P[k[0]], b = P[k[1]]; return { m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], d: Math.hypot(a[0] - b[0], a[1] - b[1]), a: Math.atan2(b[1] - a[1], b[0] - a[0]) }; };
    cv.addEventListener('pointerdown', function (e) { P[e.pointerId] = at(e); cv.setPointerCapture(e.pointerId); last = two(); moved = 0; });
    cv.addEventListener('pointermove', function (e) { if (!P[e.pointerId] || !S.img) return; var p0 = P[e.pointerId], p1 = at(e); P[e.pointerId] = p1; var t = two();
      if (moved > 4) S.drag = true;
      if (t && last) { S.drag = true; S.x += t.m[0] - last.m[0]; S.y += t.m[1] - last.m[1]; zoom(t.d / Math.max(1, last.d), t.m[0], t.m[1]); var da = t.a - last.a, dx = S.x - t.m[0], dy = S.y - t.m[1], c = Math.cos(da), s = Math.sin(da); S.x = t.m[0] + dx * c - dy * s; S.y = t.m[1] + dx * s + dy * c; S.r += da; last = t; moved += 9; paint(); return; }
      S.x += p1[0] - p0[0]; S.y += p1[1] - p0[1]; moved += Math.abs(p1[0] - p0[0]) + Math.abs(p1[1] - p0[1]); paint(); });
    var up = function (e) { var was = !!P[e.pointerId]; delete P[e.pointerId]; last = two(); if (!Object.keys(P).length && S.drag) { S.drag = false; paint(); } if (was && !S.img && moved < 6 && e.type === 'pointerup') pick(); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    /* on a computer: the wheel sizes it, with shift it turns */
    cv.addEventListener('wheel', function (e) { if (!S.img) return; e.preventDefault(); if (e.shiftKey) { turn((e.deltaY || e.deltaX) * 0.002); return; } var p = at(e); zoom(Math.exp(-e.deltaY * 0.0015), p[0], p[1]); }, { passive: false });
  }

  /* ───────── the print: the picture as it shows in PRINT, then novel.global and the code ───────── */
  function whoNow() { var c = store.get('da.who', ''), at = +store.get('da.who.at', 0) || 0; if (/^[A-HJ-NP-Z2-9]{3}$/.test(c) && at && Date.now() - at < 29.53 * 864e5) return c;
    var A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = new Uint8Array(3); crypto.getRandomValues(r); c = ''; for (var i = 0; i < 3; i++) c += A[r[i] % A.length]; store.set('da.who', c); store.set('da.who.at', Date.now()); return c; }
  function paper(who) { var W = AW, pad = 26, FH = 104, out = D.createElement('canvas'); out.width = W; out.height = AH + FH; var m = out.getContext('2d'), i, v;
    m.drawImage(inked(), 0, 0);
    m.fillStyle = '#FFF'; m.fillRect(0, AH, W, FH); m.fillStyle = '#000'; m.strokeStyle = '#000'; m.lineWidth = 4; m.beginPath();
    for (var x = pad; x <= W - pad; x += 6) { var yy = AH + 22 + Math.sin(x * 0.08) * 4; if (x === pad) m.moveTo(x, yy); else m.lineTo(x, yy); } m.stroke();
    var y = AH + 80; m.font = "700 40px Poppins, sans-serif"; m.fillText('novel.global', pad, y);
    m.font = "600 30px 'IBM Plex Mono', monospace"; var cw = m.measureText(who).width; m.textAlign = 'right'; m.fillText(who, W - pad - 12, y); m.textAlign = 'left'; m.lineWidth = 3; m.strokeRect(W - pad - cw - 24, y - 32, cw + 24, 44);
    var t = m.getImageData(0, AH, W, FH); for (i = 0; i < t.data.length; i += 4) { v = t.data[i] < 140 ? 0 : 255; t.data[i] = t.data[i + 1] = t.data[i + 2] = v; t.data[i + 3] = 255; } m.putImageData(t, 0, AH);
    return out; }
  function code() { var A = '0123456789ABCDEFGHJKMNPQRSTVWXYZ', s = 'DA-', r = new Uint8Array(4); crypto.getRandomValues(r); for (var i = 0; i < 4; i++) s += A[r[i] % 32]; return s; }
  function today() { return new Date(Date.now() + 10 * 36e5).toISOString().slice(0, 10); }
  function fonts() { return D.fonts && D.fonts.load ? Promise.all(["700 40px Poppins", "600 30px 'IBM Plex Mono'"].map(function (f) { return D.fonts.load(f); })).catch(function () {}) : Promise.resolve(); }
  function print() { if (S.busy) return; if (!S.img) { pick(); return; } if (!S.to) { say('NO PRINTER'); return; } S.busy = true; $('#go').disabled = true; say('· · ·');
    var who = whoNow(), ps = store.get('da.pass', null); if (ps && (ps.island !== S.to || ps.day !== today())) ps = null;
    fonts().then(function () { var c = paper(who);
      return api('/stories', { method: 'POST', body: JSON.stringify({ kind: 'record', code: code(), body: JSON.stringify({ type: 'stack', stack: 'pickles', lat: WHERE[0], lng: WHERE[1] }), lat: WHERE[0], lng: WHERE[1], dest: S.to, escpos: T.raster(c, 0), from: 'pop', stage: 'stack', who: who, pop: S.key, popId: CFG.id, pass: ps ? ps.code : undefined }) }); })
      .then(function (j) { if (j && j.passed) try { localStorage.removeItem('da.pass'); } catch (e) { /* none */ } say(''); done(!!(j && j.passed)); },
        function (e) { say(e.status === 429 ? 'WAIT' : e.status === 403 ? 'CLOSED' : e.status === 503 ? 'BUSY' : 'UNSENT'); })
      .then(function () { S.busy = false; $('#go').disabled = false; }); }

  /* the print in colour, as it comes out: the picture, a wavy rule, novel.global and the logos */
  function receipt() { var W = AW * SC, FH = 150, c = D.createElement('canvas'); c.width = W; c.height = AH * SC + FH; var g = c.getContext('2d'); g.fillStyle = '#FFF'; g.fillRect(0, 0, W, c.height);
    g.drawImage(face(SC), 0, 0); g.drawImage(animal(SC), 0, 0); var y0 = AH * SC, pad = 44;
    g.strokeStyle = INK; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); for (var x = pad; x <= W - pad; x += 8) { var yy = y0 + 34 + Math.sin(x * 0.04) * 6; if (x === pad) g.moveTo(x, yy); else g.lineTo(x, yy); } g.stroke();
    g.fillStyle = INK; g.font = "700 52px Poppins, sans-serif"; g.textBaseline = 'middle'; g.fillText('novel.global', pad, y0 + 98);
    var x2 = W - pad; [].slice.call(D.querySelectorAll('header img')).reverse().forEach(function (im) { if (!im.naturalWidth) return; var h = 74, w = im.naturalWidth * h / im.naturalHeight; x2 -= w; try { g.drawImage(im, x2, y0 + 98 - h / 2, w, h); } catch (e) { /* a logo from elsewhere */ } x2 -= 16; });
    return c; }
  function done(passed) { var c = receipt(); $('#out').src = c.toDataURL('image/jpeg', 0.9); $('#st2').textContent = passed ? 'PRINTING' : 'SENT'; $('#st2').title = passed ? '' : 'It prints once the café says yes';
    $('#make').hidden = true; $('#after').hidden = false; window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function save() { fonts().then(function () { receipt().toBlob(function (b) { if (!b) return; var f = new File([b], (S.an ? S.an[0] : 'me') + '-me.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [f] })) { navigator.share({ files: [f] }).catch(function () { /* closed */ }); return; }
    var a = D.createElement('a'); a.href = URL.createObjectURL(b); a.download = f.name; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000); }, 'image/png'); }); }
  /* El Niño: one tip at a time, tap for the next */
  function tips() { var t = CFG.tips || {}, L = t.lines || [], i = 0; if (!L.length) return; var w = D.createElement('div'); w.id = 'tips'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true');
    w.innerHTML = '<div class="sh hd"><button type="button" class="x" aria-label="Close">×</button><h2></h2><p aria-live="polite"></p><div class="ft"><span></span><button type="button" class="nx">NEXT</button></div></div>';
    var sh = w.querySelector('.sh'), show = function () { w.querySelector('p').textContent = L[i]; w.querySelector('.ft span').textContent = (i + 1) + ' / ' + L.length; sh.style.transform = 'rotate(' + (i % 2 ? 0.8 : -0.8) + 'deg)'; };
    w.querySelector('h2').textContent = t.title || ''; show();
    var shut = function () { w.remove(); D.removeEventListener('keydown', key); }, key = function (e) { if (e.key === 'Escape') shut(); };
    w.addEventListener('click', function (e) { if (e.target === w || e.target.closest('.x')) return shut(); i = (i + 1) % L.length; show(); }); D.addEventListener('keydown', key); D.body.appendChild(w); w.querySelector('.nx').focus(); }

  function say(t) { var s = $('#st'); if (s) { s.textContent = t; s.title = ''; } }
  function printers() { return api('/partners').then(function (j) { var l = j.partners || [], want = new URLSearchParams(location.search).get('to'), ok = function (p) { return p && (p.paired || p.id === 'novelglobal'); };
      var p = l.filter(function (q) { return q.id === want && ok(q); })[0] || l.filter(function (q) { return CFG.to && q.id === CFG.to && ok(q); })[0] || l.filter(function (q) { return q.id === 'pickles' && ok(q); })[0] || l.filter(function (q) { return q.id === 'novelglobal'; })[0];
      S.to = p ? p.id : null; $('#led').classList.toggle('on', !!(p && p.ready)); $('#led').title = p ? (p.name || p.id) + (p.ready ? ' · listening' : ' · asleep') : ''; }, function () { S.to = null; }); }

  function dress() { if (Array.isArray(CFG.logos)) { var hd = $('header'); hd.replaceChildren(); hd.hidden = !CFG.logos.length; CFG.logos.forEach(function (src, i) { if (i) { var x = D.createElement('span'); x.setAttribute('aria-hidden', 'true'); x.textContent = '×'; hd.appendChild(x); } var im = D.createElement('img'); if (!/^data:/.test(src)) im.crossOrigin = 'anonymous'; im.src = src; im.alt = ''; hd.appendChild(im); }); }
    var dn = CFG.donate; if (dn && dn.url) { $('#donate').href = dn.url; $('#donate').textContent = dn.label || 'DONATE'; $('#dn-u').textContent = dn.url.replace(/^https?:\/\/(www\.)?/, '').replace(/[#?].*$/, ''); } else $('.give').hidden = true;
    if (!CFG.tips || !CFG.tips.lines || !CFG.tips.lines.length) $('#tip').hidden = true; else { $('#tip').setAttribute('aria-label', CFG.tips.title || ''); $('#tip').title = CFG.tips.title || ''; } }
  function open() { dress(); $('#gate').hidden = true; $('#card').hidden = false; cv = $('#stage'); cv.width = AW * SC; cv.height = AH * SC; cx2 = cv.getContext('2d'); gestures(); another(); printers();
    $('#an').addEventListener('click', another); $('#ph').addEventListener('click', pick); $('#go').addEventListener('click', print); $('#sv').addEventListener('click', save); $('#rm').addEventListener('click', drop); $('#tip').addEventListener('click', tips); }
  function closed(why) { $('#gate').hidden = false; $('#card').hidden = true; $('#gst').textContent = why || ''; }
  function check(k) { var pid = new URLSearchParams(location.search).get('p') || store.get('da.pop.p', ''); return api('/pop?k=' + encodeURIComponent(k) + (pid ? '&p=' + encodeURIComponent(pid) : '')).then(function (j) { var pp = (j && j.pop) || {}; Object.keys(pp).forEach(function (f) { if (pp[f] !== '') CFG[f] = pp[f]; }); if (CFG.tips && !CFG.tips.lines) CFG.tips = null; S.key = k; store.set('da.pop.k', k); store.set('da.pop.p', CFG.id); open(); return true; }, function (e) { return e.status === 429 ? 'WAIT' : false; }); }

  window.POP = { paper: paper, state: S, take: take, another: another, pick: function (n) { for (var i = 0; i < ANIMALS.length; i++) if (ANIMALS[i][0] === n) { S.a = i; S.an = ANIMALS[i]; $('#nm').textContent = S.an[1]; return load(S.an).then(function () { OV = null; OV = animal(SC); fit(); paint(); }); } } };
  D.addEventListener('DOMContentLoaded', function () {
    var q = new URLSearchParams(location.search), k = q.get('k') || store.get('da.pop.k', '');
    if (q.get('k')) { q.delete('k'); history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '')); }
    $('#gform').addEventListener('submit', function (e) { e.preventDefault(); var v = $('#gin').value.trim().toUpperCase().replace(/[^A-Z0-9]/g, ''); if (v.length !== 6) { $('#gst').textContent = '×'; return; } $('#gst').textContent = '· · ·'; check(v.slice(0, 3) + '-' + v.slice(3)).then(function (ok) { if (ok !== true) $('#gst').textContent = ok || '×'; }); });
    if (!k) return closed(''); check(k).then(function (ok) { if (ok !== true) { store.set('da.pop.k', ''); closed(ok || ''); } });
  });
})();

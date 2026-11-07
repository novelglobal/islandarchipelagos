/* island archipelagos: the bench */
(function () {
  'use strict';
  var D = document, H = D.documentElement, $ = function (s) { return D.querySelector(s); }, q = location.search;
  if (/[?&]in=1/.test(q)) H.classList.add('in');
  if (/[?&]night=1/.test(q)) H.classList.add('night');
  var NG = (function () { try { return window.parent !== window ? window.parent.NG : null; } catch (e) { return null; } })();
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var W = 512, MMPX = 0.125, MAXMM = 457, MAXH = Math.round(MAXMM / MMPX);

  /* parts: g is in (a source), do (a change) or out (what prints) */
  var PART = {
    title: { g: 'out', n: 'TITLE', f: [['t', 'line']] },
    text: { g: 'out', n: 'TEXT', f: [['t', 'area']] },
    list: { g: 'out', n: 'LIST', f: [['t', 'area']] },
    steps: { g: 'out', n: 'STEPS', f: [['t', 'area']] },
    form: { g: 'out', n: 'FORM', f: [['t', 'area']] },
    rule: { g: 'out', n: 'RULE', f: [] },
    qr: { g: 'out', n: 'QR', f: [['t', 'line']] },
    photo: { g: 'in', n: 'PHOTO', f: [], file: 'image/*' },
    moon: { g: 'in', n: 'MOON', f: [], mod: 'moon-clock' },
    place: { g: 'in', n: 'PLACE', f: [], mod: 'where-stamp' },
    sensor: { g: 'in', n: 'SENSOR', f: [['nm', 'line'], ['v', 'line']], mod: 'lilygo-bridge' },
    route: { g: 'in', n: 'ROUTE', f: [], file: '.gpx,application/gpx+xml', mod: 'trail-strip' },
    prompt: { g: 'do', n: 'PROMPT', f: [], mod: 'story-dice' },
    code: { g: 'do', n: 'CODE', f: [['t', 'line']], mod: 'slip-code' },
    mesh: { g: 'out', n: 'MESH', f: [['t', 'line']], mod: 'mesh-slips' },
    card: { g: 'mod', n: 'CARD', f: [], file: '.json,application/json', mod: 'card-bridge' }
  };
  /* the modules: each one a small open-source project, plugged in as the archipelago grows */
  var MODS = [
    { id: 'island-kit', ins: ['CODE'], outs: ['LIST'], need: 0, on: 1 },
    { id: 'thermal-dither', ins: ['PICTURE'], outs: ['PICTURE'], need: 0, on: 1 },
    { id: 'slip-qr', ins: ['WORDS'], outs: ['CODE'], need: 0, on: 1 },
    { id: 'moon-clock', ins: [], outs: ['PICTURE', 'WORDS'], need: 0 },
    { id: 'story-dice', ins: [], outs: ['WORDS'], need: 0 },
    { id: 'slip-code', ins: ['WORDS', 'LIST'], outs: ['WORDS'], need: 0 },
    { id: 'where-stamp', ins: [], outs: ['WORDS'], need: 0 },
    { id: 'lilygo-bridge', ins: ['SOUND'], outs: ['WORDS', 'LIST'], need: 1 },
    { id: 'trail-strip', ins: ['LIST'], outs: ['PICTURE', 'LENGTH'], need: 1 },
    { id: 'mesh-slips', ins: ['WORDS', 'CODE'], outs: ['WORDS'], need: 2 },
    { id: 'card-bridge', ins: ['CODE'], outs: ['WORDS', 'PICTURE'], need: 3 },
    { id: 'lost-found-ring', ins: ['WORDS', 'PICTURE'], outs: ['LIST'], need: 5 }
  ];
  var STARTS = {
    STORY: [['title', { t: 'THE LAST FERRY' }], ['prompt', {}], ['text', { t: '' }], ['rule', {}], ['moon', {}], ['qr', { t: 'novel.global' }]],
    RECIPE: [['title', { t: 'LEMON MYRTLE DAMPER' }], ['photo', {}], ['list', { t: 'SELF-RAISING FLOUR 3 CUPS\nBUTTER 60 G\nMILK 1 1/2 CUPS\nLEMON MYRTLE 1 TSP' }], ['steps', { t: 'RUB BUTTER INTO FLOUR\nADD MILK, MIX TO A DOUGH\nBAKE 25 MIN, 200°' }], ['code', { t: 'SERVES {2*4}' }]],
    HIKE: [['title', { t: 'YOU YANGS' }], ['place', {}], ['moon', {}], ['list', { t: 'WATER 2 L\nHAT\nFIRST AID' }], ['route', {}], ['sensor', { nm: 'TEMP', v: '' }], ['qr', { t: 'novel.global' }]],
    'LOST + FOUND': [['title', { t: 'FOUND' }], ['photo', {}], ['form', { t: 'WHAT\nWHERE\nCONTACT' }], ['place', {}], ['moon', {}], ['qr', { t: 'novel.global' }]],
    BLANK: [['title', { t: '' }]]
  };
  var PROMPTS = ['A KEY THAT OPENS NOTHING', 'THE TIDE CAME IN WRONG', 'A LETTER UNDER THE FLOOR', 'TWO RADIOS, ONE SONG', 'THE BIRD THAT STAYED', 'A LIGHT ON THE FAR ISLAND', 'THE MAP WAS UPSIDE DOWN', 'SALT ON THE WINDOW'];

  var KEY = 'da.bench.v1', S = { start: 'STORY', at: '', builds: {} };
  try { var s0 = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s0 && s0.builds) S = s0; } catch (e) { /* a fresh bench */ }
  var uid = function () { return Math.random().toString(36).slice(2, 8); };
  var mk = function (a) { return Object.assign({ id: uid(), k: a[0] }, JSON.parse(JSON.stringify(a[1] || {}))); };
  var build = function () { var b = S.builds[S.at || '_']; if (!b) { b = S.builds[S.at || '_'] = STARTS[S.start].map(mk); } return b; };
  var save = function () { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* this visit only */ } };
  var ISL = 1;
  var modOn = function (id) { var m = MODS.filter(function (x) { return x.id === id; })[0]; return !m || m.on || ISL >= m.need; };
  var partOn = function (k) { return !PART[k].mod || modOn(PART[k].mod); };

  /* ───── the board ───── */
  function ui() {
    $('#starts').innerHTML = Object.keys(STARTS).map(function (k) { return '<button type="button" data-s="' + k + '" class="' + (k === S.start ? 'on' : '') + '">' + k + '</button>'; }).join('');
    $('#parts').innerHTML = Object.keys(PART).map(function (k) { var p = PART[k]; return '<button type="button" data-add="' + k + '" data-g="' + p.g + '"' + (partOn(k) ? '' : ' disabled') + '><i></i>' + p.n + '</button>'; }).join('');
    $('#isl').textContent = ISL;
    $('#mods').innerHTML = MODS.map(function (m) { var on = m.on || ISL >= m.need;
      return '<div class="md' + (on ? '' : ' off') + '"><b>' + m.id + '</b><div class="io">' + (m.ins.length ? m.ins.map(function (x) { return '<span>' + x + '</span>'; }).join('') : '<span>·</span>') + '<span class="to">→</span>' + m.outs.map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</div>' +
        '<span class="need">' + (on ? 'ON' : '●'.repeat(Math.min(ISL, m.need)) + '○'.repeat(Math.max(0, m.need - ISL))) + '</span></div>'; }).join('');
    board();
  }
  function board() {
    var b = build();
    $('#bb').innerHTML = b.map(function (p, i) { var d = PART[p.k] || PART.text;
      var fs = d.f.map(function (f) { var v = esc(p[f[0]] || ''), ph = f[0] === 'nm' ? 'NAME' : f[0] === 'v' ? 'VALUE' : '';
        return f[1] === 'area' ? '<textarea data-f="' + f[0] + '" placeholder="' + ph + '">' + v + '</textarea>' : '<input type="text" data-f="' + f[0] + '" value="' + v + '" placeholder="' + ph + '">'; }).join('');
      var ex = '';
      if (d.file) ex += '<button type="button" class="pill" data-file="' + d.file + '">' + (p.src || p.pts || p.m ? 'CHANGE' : 'ADD') + '</button>';
      if (p.k === 'place') ex += '<button type="button" class="pill" data-gps>HERE</button><span class="val">' + (p.lat != null ? p.lat.toFixed(4) + ', ' + p.lng.toFixed(4) : '') + '</span>';
      if (p.k === 'sensor' && navigator.serial) ex += '<button type="button" class="pill" data-ser>' + (p.live ? 'LISTENING' : 'USB') + '</button>';
      if (p.k === 'prompt') ex += '<button type="button" class="pill" data-roll>ROLL</button><span class="val">' + esc(p.t || '') + '</span>';
      if (p.k === 'moon') ex += '<span class="val">' + moon().n + '</span>';
      if (p.k === 'card') ex += '<span class="val">' + esc(p.m ? p.m.name || p.m.title || p.m.id : '') + '</span>';
      return '<div class="pt" data-i="' + i + '" data-g="' + d.g + '"><b>' + d.n + '</b><span class="ks"><button type="button" data-mv="-1" aria-label="Up">↑</button><button type="button" data-mv="1" aria-label="Down">↓</button><button type="button" data-rm aria-label="Remove">×</button></span>' +
        (fs || ex ? '<div class="fs">' + fs + (ex ? '<div class="row">' + ex + '</div>' : '') + '</div>' : '') + '</div>';
    }).join('');
    draw();
  }

  /* ───── the slip ───── */
  var IMGS = {};
  var img = function (src) { if (!src) return null; if (IMGS[src]) return IMGS[src].complete ? IMGS[src] : null; var im = new Image(); im.onload = draw; im.src = src; IMGS[src] = im; return null; };
  function moon() { var d = (Date.now() - Date.UTC(2000, 0, 6, 18, 14)) / 864e5, f = ((d % 29.530588853) + 29.530588853) % 29.530588853 / 29.530588853, i = Math.round(f * 8) % 8;
    return { f: f, n: ['NEW MOON', 'WAXING CRESCENT', 'FIRST QUARTER', 'WAXING GIBBOUS', 'FULL MOON', 'WANING GIBBOUS', 'LAST QUARTER', 'WANING CRESCENT'][i] }; }
  /* basic code: {name} or {sum}, numbers, + - * / and brackets, nothing else */
  function calc(src, v) {
    var t = String(src).match(/\d+(\.\d+)?|[a-z_][a-z0-9_]*|[-+*/()]/gi) || [], i = 0;
    var atom = function () { var x = t[i++]; if (x === '(') { var r = sum(); i++; return r; } if (x === '-') return -atom(); if (/^[a-z_]/i.test(x || '')) { var n = parseFloat(v[x.toLowerCase()]); return isFinite(n) ? n : NaN; } return parseFloat(x); };
    var prod = function () { var r = atom(); while (t[i] === '*' || t[i] === '/') { var o = t[i++], b = atom(); r = o === '*' ? r * b : r / b; } return r; };
    var sum = function () { var r = prod(); while (t[i] === '+' || t[i] === '-') { var o = t[i++], b = prod(); r = o === '+' ? r + b : r - b; } return r; };
    var r = sum(); return isFinite(r) ? String(Math.round(r * 100) / 100) : '';
  }
  function code(s) { var v = {}; build().forEach(function (p) { if (p.k === 'sensor') { v.sensor = p.v; if (p.nm) v[String(p.nm).toLowerCase().replace(/[^a-z0-9_]/g, '')] = p.v; } });
    return String(s || '').replace(/\{([^}]{1,60})\}/g, function (m, e) { return calc(e, v); }); }

  var g = null, cv = $('#cv');
  function wrap(t, maxW) { var out = []; String(t || '').split('\n').forEach(function (ln) { var w = ln.split(' '), cur = ''; w.forEach(function (x) { var tr = cur ? cur + ' ' + x : x; if (g.measureText(tr).width > maxW && cur) { out.push(cur); cur = x; } else cur = tr; }); out.push(cur); }); return out; }
  function draw() {
    var parts = build(), ops = [], y = 28, P = 24, iw = W - P * 2;
    var tmp = D.createElement('canvas'); tmp.width = W; tmp.height = 10; g = tmp.getContext('2d');
    var add = function (h, fn) { ops.push([y, fn]); y += h; };
    parts.forEach(function (p) {
      var k = p.k;
      if (k === 'title') { g.font = '600 64px "Archivo Narrow", Arial'; var L = wrap((p.t || ' ').toUpperCase(), iw); add(L.length * 58 + 16, function (c, y0) { c.font = '600 64px "Archivo Narrow", Arial'; L.forEach(function (l, j) { c.fillText(l, P, y0 + 54 + j * 58); }); }); }
      else if (k === 'text' || k === 'mesh' || k === 'code' || k === 'prompt' || k === 'card') { var tx = k === 'code' ? code(p.t) : k === 'card' ? (p.m && (p.m.name || p.m.title || p.m.id) || '') : p.t; if (!tx) return; g.font = '400 24px "Departure Mono", monospace'; var L2 = wrap(String(tx).toUpperCase(), iw); add(L2.length * 32 + 14 + (k === 'mesh' ? 16 : 0), function (c, y0) { c.font = '400 24px "Departure Mono", monospace'; if (k === 'mesh') { c.fillRect(P, y0 + 4, iw, 3); y0 += 16; } L2.forEach(function (l, j) { c.fillText(l, P, y0 + 26 + j * 32); }); }); }
      else if (k === 'list' || k === 'steps') { var ls = String(p.t || '').split('\n').filter(Boolean); g.font = '400 24px "Departure Mono", monospace'; var rows = []; ls.forEach(function (l, j) { wrap(l.toUpperCase(), iw - 44).forEach(function (w, m) { rows.push([m ? '' : (k === 'steps' ? String(j + 1) : '□'), w]); }); });
        add(rows.length * 34 + 12, function (c, y0) { c.font = '400 24px "Departure Mono", monospace'; rows.forEach(function (r, j) { c.fillText(r[0], P, y0 + 26 + j * 34); c.fillText(r[1], P + 44, y0 + 26 + j * 34); }); }); }
      else if (k === 'form') { var fl = String(p.t || '').split('\n').filter(Boolean); add(fl.length * 64 + 8, function (c, y0) { c.font = '400 20px "Departure Mono", monospace'; fl.forEach(function (l, j) { var yy = y0 + j * 64; c.fillText(l.toUpperCase(), P, yy + 24); c.fillRect(P, yy + 56, iw, 2); }); }); }
      else if (k === 'rule') add(26, function (c, y0) { c.fillRect(P, y0 + 10, iw, 5); });
      else if (k === 'photo') { var im = img(p.src); if (!im) { if (!p.src) add(150, function (c, y0) { c.strokeRect(P + 1, y0 + 1, iw - 2, 140); c.font = '400 20px "Departure Mono", monospace'; c.fillText('PHOTO', P + 14, y0 + 34); }); return; } var h = Math.round(iw * im.naturalHeight / im.naturalWidth); add(h + 14, function (c, y0) { c.filter = 'grayscale(1) contrast(1.15)'; c.drawImage(im, P, y0, iw, h); c.filter = 'none'; }); }
      else if (k === 'qr') { if (!p.t || !window.qrcode) return; var m = window.qrcode(0, 'M'); m.addData(String(p.t)); m.make(); var n = m.getModuleCount(), px = Math.floor(176 / n), sz = n * px;
        add(sz + 22, function (c, y0) { for (var r = 0; r < n; r++) for (var cc = 0; cc < n; cc++) if (m.isDark(r, cc)) c.fillRect(W - P - sz + cc * px, y0 + r * px, px, px); c.font = '400 18px "Departure Mono", monospace'; c.fillText(String(p.t).slice(0, 22).toUpperCase(), P, y0 + sz - 4); }); }
      else if (k === 'moon') { var mo = moon(); add(96, function (c, y0) { var cx = P + 40, cy = y0 + 44, R = 36; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.lineWidth = 3; c.stroke(); c.save(); c.beginPath(); c.arc(cx, cy, R, 0, 7); c.clip(); var lit = mo.f < 0.5 ? 1 : -1, off = Math.cos(mo.f * 2 * Math.PI) * R; c.beginPath(); c.ellipse(cx, cy, Math.abs(off), R, 0, 0, 7); c.fill(); c.fillRect(lit > 0 ? cx - R : cx, cy - R, R, R * 2); c.restore(); c.font = '400 24px "Departure Mono", monospace'; c.fillText(mo.n, P + 96, cy + 9); }); }
      else if (k === 'place') { if (p.lat == null) return; add(44, function (c, y0) { c.font = '400 24px "Departure Mono", monospace'; c.beginPath(); c.arc(P + 10, y0 + 18, 9, 0, 7); c.fill(); c.fillText(p.lat.toFixed(4) + ', ' + p.lng.toFixed(4), P + 32, y0 + 26); }); }
      else if (k === 'sensor') { if (!p.nm && !p.v) return; add(64, function (c, y0) { c.font = '400 20px "Departure Mono", monospace'; c.fillText(String(p.nm || '').toUpperCase(), P, y0 + 18); c.font = '600 44px "Archivo Narrow", Arial'; c.fillText(String(p.v || '—').toUpperCase(), P, y0 + 58); }); }
      else if (k === 'route') { if (!p.pts || p.pts.length < 2) return; var la = p.pts.map(function (a) { return a[0]; }), lo = p.pts.map(function (a) { return a[1]; }), n0 = Math.min.apply(0, la), n1 = Math.max.apply(0, la), e0 = Math.min.apply(0, lo), e1 = Math.max.apply(0, lo), k2 = Math.cos(n0 * Math.PI / 180), sw = (e1 - e0) * k2 || 1e-6, sh = (n1 - n0) || 1e-6, sc = Math.min(iw / sw, 560 / sh), rh = sh * sc;
        add(rh + 24, function (c, y0) { c.lineWidth = 4; c.lineJoin = 'round'; c.beginPath(); p.pts.forEach(function (a, j) { var x = P + (a[1] - e0) * k2 * sc, yy = y0 + 8 + (n1 - a[0]) * sc; if (j) c.lineTo(x, yy); else c.moveTo(x, yy); }); c.stroke(); [p.pts[0], p.pts[p.pts.length - 1]].forEach(function (a, j) { var x = P + (a[1] - e0) * k2 * sc, yy = y0 + 8 + (n1 - a[0]) * sc; c.beginPath(); c.arc(x, yy, j ? 10 : 7, 0, 7); c.fill(); }); }); }
    });
    var H2 = Math.min(MAXH, Math.max(200, y + 40));
    cv.width = W; cv.height = H2; var c = cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, W, H2); c.fillStyle = '#0B0B0B'; c.strokeStyle = '#0B0B0B';
    ops.forEach(function (o) { if (o[0] < H2) o[1](c, o[0]); });
    var mm = Math.round(H2 * MMPX), full = y + 40 > MAXH; $('#len').textContent = mm + ' / ' + MAXMM + ' MM'; $('#meter i').style.width = Math.min(100, mm / MAXMM * 100) + '%'; $('#meter').classList.toggle('full', full);
  }

  /* ───── doing ───── */
  var cur = function (el) { var pt = el.closest('.pt'); return pt ? build()[+pt.dataset.i] : null; };
  $('#starts').addEventListener('click', function (e) { var b = e.target.closest('[data-s]'); if (!b) return; S.start = b.dataset.s; S.builds[S.at || '_'] = STARTS[S.start].map(mk); save(); ui(); });
  $('#parts').addEventListener('click', function (e) { var b = e.target.closest('[data-add]'); if (!b || b.disabled) return; build().push(mk([b.dataset.add, b.dataset.add === 'prompt' ? { t: PROMPTS[Math.floor(Math.random() * PROMPTS.length)] } : {}])); save(); board(); });
  $('#bb').addEventListener('input', function (e) { var f = e.target.dataset.f, p = cur(e.target); if (!f || !p) return; p[f] = e.target.value; save(); draw(); });
  $('#bb').addEventListener('click', function (e) {
    var b = e.target.closest('button'), p = b && cur(b); if (!p) return; var list = build(), i = list.indexOf(p);
    if (b.dataset.mv) { var j = i + +b.dataset.mv; if (j < 0 || j >= list.length) return; list.splice(i, 1); list.splice(j, 0, p); save(); board(); }
    else if (b.hasAttribute('data-rm')) { list.splice(i, 1); save(); board(); }
    else if (b.hasAttribute('data-roll')) { p.t = PROMPTS[Math.floor(Math.random() * PROMPTS.length)]; save(); board(); }
    else if (b.hasAttribute('data-gps')) { if (!navigator.geolocation) return; b.textContent = '…'; navigator.geolocation.getCurrentPosition(function (r) { p.lat = r.coords.latitude; p.lng = r.coords.longitude; save(); board(); }, function () { b.textContent = 'HERE'; }, { timeout: 9000 }); }
    else if (b.hasAttribute('data-ser')) serial(p, b);
    else if (b.dataset.file) { var fi = $('#fi'); fi.accept = b.dataset.file; fi.onchange = function () { var f = fi.files && fi.files[0]; fi.value = ''; if (f) take(p, f); }; fi.click(); }
  });
  function take(p, f) {
    var rd = new FileReader();
    if (p.k === 'photo') { rd.onload = function () { var im = new Image(); im.onload = function () { var k = Math.min(1, 1024 / Math.max(im.width, im.height)), c = D.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); p.src = c.toDataURL('image/jpeg', 0.8); save(); board(); }; im.src = rd.result; }; rd.readAsDataURL(f); }
    else if (p.k === 'route') { rd.onload = function () { var pts = []; String(rd.result).replace(/<(?:trkpt|rtept|wpt)[^>]*?lat="([-\d.]+)"[^>]*?lon="([-\d.]+)"|<(?:trkpt|rtept|wpt)[^>]*?lon="([-\d.]+)"[^>]*?lat="([-\d.]+)"/g, function (m, a, b, c2, d2) { pts.push(a ? [+a, +b] : [+d2, +c2]); return m; }); var step = Math.max(1, Math.floor(pts.length / 800)); p.pts = pts.filter(function (x, j) { return j % step === 0; }); save(); board(); }; rd.readAsText(f); }
    else if (p.k === 'card') { rd.onload = function () { try { var m = JSON.parse(rd.result); p.m = { id: String(m.id || '').slice(0, 63), name: String(m.name || m.title || '').slice(0, 40), ins: m.ins || m.takes || [], outs: m.outs || m.gives || [] }; save(); board(); } catch (e) { /* not a card */ } }; rd.readAsText(f); }
  }
  /* a LilyGo or any board on USB: the last number it prints, as the value */
  function serial(p, b) {
    if (!navigator.serial) return; navigator.serial.requestPort().then(function (port) { return port.open({ baudRate: 115200 }).then(function () { return port; }); }).then(function (port) {
      p.live = 1; b.textContent = 'LISTENING'; var rd = port.readable.pipeThrough(new TextDecoderStream()).getReader(), buf = '';
      (function pump() { rd.read().then(function (r) { if (r.done) return; buf += r.value; var ls = buf.split(/\r?\n/); buf = ls.pop(); var last = ls.filter(function (l) { return /-?\d/.test(l); }).pop(); if (last) { var n = last.match(/-?\d+(\.\d+)?/); p.v = n ? n[0] : last.trim().slice(0, 12); save(); draw(); var v = D.querySelector('.pt[data-i="' + build().indexOf(p) + '"] input[data-f="v"]'); if (v && D.activeElement !== v) v.value = p.v; } pump(); }); })();
    }).catch(function () { b.textContent = 'USB'; });
  }

  /* ───── printers: each island keeps its own build ───── */
  function printers() {
    return fetch('/api/partners').then(function (r) { return r.ok ? r.json() : { partners: [] }; }).then(function (j) {
      var l = (j.partners || []); ISL = Math.max(1, l.length);
      var on = l.filter(function (p) { return p.ready || p.id === 'novelglobal'; }), last = S.at || (NG && NG.store ? NG.store.get('da.base.printer', '') : '');
      $('#to').innerHTML = on.length ? on.map(function (p) { return '<option value="' + esc(p.id) + '"' + (p.id === last ? ' selected' : '') + '>' + esc(String(p.name || p.id).toUpperCase()) + (p.ready ? '' : ' · WAITS') + '</option>'; }).join('') : '<option value="">NO PRINTER ON</option>';
      $('#pr').disabled = !on.length || !(NG && NG.printAgain); if (!S.at && on.length) { S.at = $('#to').value; if (!S.builds[S.at] && S.builds._) S.builds[S.at] = S.builds._; }
      ui();
    }).catch(function () { ui(); });
  }
  $('#to').addEventListener('change', function () { S.at = this.value; save(); board(); });
  $('#pr').addEventListener('click', function () { var b = this, st = $('#st'); if (!NG || !NG.printAgain) return; b.disabled = true; try { NG.store.set('da.base.printer', $('#to').value); } catch (e) { /* the first on */ }
    st.innerHTML = NG.pips ? NG.pips('sending') : '…';
    NG.printAgain(cv.toDataURL('image/png'), 'bench').then(function (s) { st.innerHTML = NG.pips ? NG.pips(s) : s; }).catch(function (e) { st.innerHTML = NG.pips ? NG.pips(e && e.status ? 'failed' : 'outbox') : '✕'; }).then(function () { b.disabled = false; }); });
  $('#set').addEventListener('click', function () { try { window.parent.postMessage({ hm: 'panel' }, location.origin); } catch (e) { /* alone */ } });
  if (!NG) $('#set').hidden = true;
  $('#tabs').addEventListener('click', function (e) { var b = e.target.closest('[data-t]'); if (!b) return; H.classList.toggle('show-slip', b.dataset.t === 'slip'); [].forEach.call(this.children, function (x) { x.classList.toggle('on', x === b); }); });
  if (D.fonts && D.fonts.load) Promise.all([D.fonts.load('600 64px "Archivo Narrow"'), D.fonts.load('400 24px "Departure Mono"')]).then(draw, draw);
  ui(); printers();
})();

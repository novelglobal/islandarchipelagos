/* island archipelagos: the bench */
(function () {
  'use strict';
  var D = document, H = D.documentElement, $ = function (s, r) { return (r || D).querySelector(s); }, q = location.search;
  if (/[?&]in=1/.test(q)) H.classList.add('in');
  /* inside novel.global the install key opens the island's own page there */
  document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('#inst'); if (a && parent !== window && /[?&]in=1/.test(q)) { e.preventDefault(); parent.postMessage({ hm: 'open', id: 'kit' }, location.origin); } });
  if (/[?&]night=1/.test(q)) H.classList.add('night');
  var NG = (function () { try { return window.parent !== window ? window.parent.NG : null; } catch (e) { return null; } })();
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var W = 512, MMPX = 0.125, MAXMM = 457, MAXH = Math.round(MAXMM / MMPX);
  var I = function (d) { return '<svg class="i" viewBox="0 0 24 24">' + d + '</svg>'; };
  var ICON = {
    title: I('<path d="M5 6h14M12 6v13"/>'), text: I('<path d="M5 7h14M5 12h14M5 17h9"/>'), list: I('<path d="M4 6h3v3H4zM4 15h3v3H4zM11 7.5h9M11 16.5h9"/>'),
    steps: I('<path d="M5 5v5M4 5h1M11 7.5h9M4.5 15h2.5l-2.5 3.5H7M11 16.5h9"/>'), form: I('<path d="M4 9h16M4 15h16M4 21h10M4 3h6"/>'), rule: I('<path d="M3 12h18" stroke-width="4"/>'),
    qr: I('<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2"/>'), photo: I('<path d="M3 6h18v13H3z"/><path d="M3 16l5-5 4 4 3-3 6 6"/><circle cx="16" cy="9.5" r="1.5" class="f"/>'),
    moon: I('<path d="M15 3a9 9 0 1 0 6 13A7 7 0 0 1 15 3z"/>'), place: I('<path d="M12 21s-6-6.2-6-11a6 6 0 0 1 12 0c0 4.8-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>'),
    sensor: I('<path d="M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/>'), route: I('<path d="M5 19c3-1 2-6 6-7s4-6 8-7"/><circle cx="5" cy="19" r="2" class="f"/><circle cx="19" cy="5" r="2"/>'),
    prompt: I('<path d="M4 4h16v16H4z"/><circle cx="8.5" cy="8.5" r="1.3" class="f"/><circle cx="15.5" cy="15.5" r="1.3" class="f"/><circle cx="12" cy="12" r="1.3" class="f"/>'),
    code: I('<path d="M9 4c-3 0-2 4-2 6s-2 2-2 2 2 0 2 2-1 6 2 6M15 4c3 0 2 4 2 6s2 2 2 2-2 0-2 2 1 6-2 6"/>'), mesh: I('<circle cx="5" cy="17" r="2.2"/><circle cx="19" cy="17" r="2.2"/><circle cx="12" cy="5" r="2.2"/><path d="M6.5 15.4L10.7 7M13.3 7l4.2 8.4M7.2 17h9.6"/>'),
    card: I('<path d="M4 4h12l4 4v12H4z"/><path d="M16 4v4h4M8 13h8M8 17h5"/>'),
    up: I('<path d="M12 19V5M6 11l6-6 6 6"/>'), down: I('<path d="M12 5v14M6 13l6 6 6-6"/>'), rm: I('<path d="M6 6l12 12M18 6L6 18"/>'),
    gps: I('<circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>'), usb: I('<path d="M12 3v14M8 7l4-4 4 4M7 12v3h10v-3"/><circle cx="12" cy="19" r="2"/>'), add: I('<path d="M12 5v14M5 12h14"/>')
  };
  /* parts: g is in (a source), do (a change) or out (what prints) */
  var PART = {
    title: { g: 'out', n: 'title' }, text: { g: 'out', n: 'text' }, list: { g: 'out', n: 'list' }, steps: { g: 'out', n: 'steps' },
    form: { g: 'out', n: 'form' }, rule: { g: 'out', n: 'rule' }, qr: { g: 'out', n: 'qr' }, photo: { g: 'in', n: 'photo', file: 'image/*' },
    moon: { g: 'in', n: 'moon', mod: 'moon-clock' }, place: { g: 'in', n: 'place', mod: 'where-stamp' }, prompt: { g: 'do', n: 'prompt', mod: 'story-dice' },
    code: { g: 'do', n: 'code', mod: 'slip-code' }, sensor: { g: 'in', n: 'sensor', mod: 'lilygo-bridge' }, route: { g: 'in', n: 'route', file: '.gpx,application/gpx+xml', mod: 'trail-strip' },
    mesh: { g: 'out', n: 'mesh', mod: 'mesh-slips' }, card: { g: 'mod', n: 'card', file: '.json,application/json', mod: 'card-bridge' }
  };
  /* the modules: each a small open-source project, plugged in as the archipelago grows */
  var NEED = { 'moon-clock': 0, 'story-dice': 0, 'slip-code': 0, 'where-stamp': 0, 'lilygo-bridge': 1, 'trail-strip': 1, 'mesh-slips': 2, 'card-bridge': 3 };
  var STARTS = {
    story: { i: I('<path d="M3 5c3-1 6-1 9 1 3-2 6-2 9-1v14c-3-1-6-1-9 1-3-2-6-2-9-1z"/><path d="M12 6v14"/>'), p: ['title', 'prompt', 'text', 'rule', 'moon', 'qr'] },
    recipe: { i: I('<path d="M4 11h16a8 8 0 0 1-16 0zM8 7c0-2 2-2 2-4M13 7c0-2 2-2 2-4"/>'), p: ['title', 'photo', 'list', 'steps', 'code'] },
    hike: { i: I('<path d="M2 20l7-12 4 6 3-4 6 10z"/>'), p: ['title', 'place', 'moon', 'list', 'route', 'sensor', 'qr'] },
    found: { i: I('<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5" class="f"/>'), p: ['title', 'photo', 'form', 'place', 'moon', 'qr'] },
    blank: { i: I('<path d="M5 3h14v18H5z"/>'), p: ['title'] }
  };
  var PROMPTS = ['A KEY THAT OPENS NOTHING', 'THE TIDE CAME IN WRONG', 'A LETTER UNDER THE FLOOR', 'TWO RADIOS, ONE SONG', 'THE BIRD THAT STAYED', 'A LIGHT ON THE FAR ISLAND', 'THE MAP WAS UPSIDE DOWN', 'SALT ON THE WINDOW'];

  var KEY = 'da.bench.v2', S = { start: 'story', at: '', builds: {} };
  try { var s0 = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s0 && s0.builds) S = s0; } catch (e) { /* a fresh bench */ }
  if (!STARTS[S.start]) S.start = 'story';
  var uid = function () { return Math.random().toString(36).slice(2, 8); };
  var mk = function (k) { return { id: uid(), k: k }; };
  var build = function () { var b = S.builds[S.at || '_']; if (!b) b = S.builds[S.at || '_'] = STARTS[S.start].p.map(mk); return b; };
  var save = function () { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* this visit only */ } };
  var ISL = 1, SEL = -1, AT = -1;
  var partOn = function (k) { var m = PART[k].mod; return !m || ISL >= (NEED[m] || 0); };
  var filled = function () { return build().some(function (p) { return p.t || p.src || p.pts || p.m || p.lat != null || p.v || p.nm; }); };

  /* ───── the paper ───── */
  function tops() { $('#starts').innerHTML = Object.keys(STARTS).map(function (k) { return '<button type="button" data-s="' + k + '" aria-label="' + k + '" class="' + (k === S.start ? 'on' : '') + '">' + STARTS[k].i + '</button>'; }).join(''); }
  function tray() {
    $('#tray .grid').innerHTML = Object.keys(PART).map(function (k) { var p = PART[k], need = p.mod ? NEED[p.mod] || 0 : 0, on = partOn(k);
      return '<button type="button" data-add="' + k + '" data-g="' + p.g + '"' + (on ? '' : ' disabled') + '>' + (on || !need ? '' : '<span class="pp">' + '●'.repeat(Math.min(ISL, need)) + '○'.repeat(Math.max(0, need - ISL)) + '</span>') + ICON[k] + p.n + '</button>'; }).join('');
  }
  function field(p, f, cls, multi) { var v = esc(p[f] || '');
    return multi ? '<textarea data-f="' + f + '" rows="1" placeholder=" "' + (cls ? ' class="' + cls + '"' : '') + '>' + v + '</textarea>' : '<input type="text" data-f="' + f + '" placeholder=" " value="' + v + '"' + (cls ? ' class="' + cls + '"' : '') + '>'; }
  function inner(p) {
    var k = p.k;
    if (k === 'title' || k === 'text') return field(p, 't', '', 1);
    if (k === 'list' || k === 'steps') return '<span class="mk" aria-hidden="true"></span>' + field(p, 't', '', 1);
    if (k === 'form') return field(p, 't', '', 1);
    if (k === 'rule') return '<hr>';
    if (k === 'mesh') return field(p, 't', 'ln');
    if (k === 'code') return field(p, 't', 'ln') + '<div class="res">' + esc(code(p.t)) + '</div>';
    if (k === 'qr') return '<div class="row"><div style="flex:1">' + field(p, 't', 'ln') + '</div><canvas class="qr" width="1" height="1"></canvas></div>';
    if (k === 'photo') return p.src ? '<img class="pic" data-file alt="" src="' + p.src + '">' : '<button type="button" class="box" data-file aria-label="Photo">' + ICON.photo + '</button>';
    if (k === 'moon') return '<canvas class="moon" width="128" height="128" aria-label="The moon tonight"></canvas>';
    if (k === 'place') return '<div class="row"><button type="button" class="ic" data-gps aria-label="Here">' + ICON.gps + '</button><span class="val">' + (p.lat != null ? p.lat.toFixed(4) + ', ' + p.lng.toFixed(4) : '') + '</span></div>';
    if (k === 'sensor') return '<div class="row">' + (navigator.serial ? '<button type="button" class="ic' + (p.live ? ' live' : '') + '" data-ser aria-label="USB">' + ICON.usb + '</button>' : '') + '<div style="flex:1">' + field(p, 'nm', 'nm') + field(p, 'v', 'v') + '</div></div>';
    if (k === 'route') return p.pts ? routeSvg(p.pts) : '<button type="button" class="box low" data-file aria-label="Route">' + ICON.route + '</button>';
    if (k === 'prompt') return '<div class="row"><button type="button" class="ic" data-roll aria-label="Roll">' + ICON.prompt + '</button><span class="val">' + esc(p.t || '') + '</span></div>';
    if (k === 'card') return '<div class="row"><button type="button" class="ic" data-file aria-label="Card">' + ICON.card + '</button><span class="val">' + esc(p.m ? p.m.name || p.m.id : '') + '</span></div>';
    return '';
  }
  function routeSvg(pts) { var la = pts.map(function (a) { return a[0]; }), lo = pts.map(function (a) { return a[1]; }), n0 = Math.min.apply(0, la), n1 = Math.max.apply(0, la), e0 = Math.min.apply(0, lo), e1 = Math.max.apply(0, lo), k2 = Math.cos(n0 * Math.PI / 180);
    var d = pts.map(function (a, j) { return (j ? 'L' : 'M') + ((a[1] - e0) * k2).toFixed(6) + ' ' + (n1 - a[0]).toFixed(6); }).join('');
    return '<svg class="route" data-file viewBox="0 0 ' + (((e1 - e0) * k2) || 1e-4) + ' ' + ((n1 - n0) || 1e-4) + '" preserveAspectRatio="xMidYMid meet"><path d="' + d + '"/></svg>'; }
  function paper() {
    var b = build(), sk = function (i) { return '<button type="button" class="sk' + (i === AT ? ' on' : '') + '" data-at="' + i + '" aria-label="Add here"></button>'; };
    $('#paper').innerHTML = b.map(function (p, i) { var d = PART[p.k] || PART.text; return (i ? sk(i) : '') + '<div class="pt' + (i === SEL ? ' sel' : '') + '" data-i="' + i + '" data-k="' + p.k + '" data-g="' + d.g + '">' + inner(p) + '</div>'; }).join('') +
      '<button type="button" class="sk end" data-at="' + b.length + '" aria-label="Add a part"></button>';
    [].forEach.call(D.querySelectorAll('#paper textarea'), grow); marks();
    [].forEach.call(D.querySelectorAll('#paper canvas.moon'), moonDraw);
    [].forEach.call(D.querySelectorAll('#paper .pt[data-k="qr"]'), function (el) { qrDraw(el, b[+el.dataset.i]); });
    keys(); draw();
  }
  var grow = function (t) { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; };
  function marks() { [].forEach.call(D.querySelectorAll('#paper .pt[data-k="list"], #paper .pt[data-k="steps"]'), function (el) { var p = build()[+el.dataset.i], n = String(p.t || '').split('\n').length;
    $('.mk', el).innerHTML = Array.apply(null, Array(n)).map(function (x, j) { return '<span>' + (p.k === 'steps' ? j + 1 : '□') + '</span>'; }).join(''); }); }
  function qrDraw(el, p) { var c = $('canvas.qr', el); if (!c) return; if (!p.t || !window.qrcode) { c.style.visibility = 'hidden'; return; } c.style.visibility = '';
    var m = window.qrcode(0, 'M'); m.addData(String(p.t)); m.make(); var n = m.getModuleCount(); c.width = n; c.height = n; var g2 = c.getContext('2d'); g2.fillStyle = '#fff'; g2.fillRect(0, 0, n, n); g2.fillStyle = '#111';
    for (var r = 0; r < n; r++) for (var cc = 0; cc < n; cc++) if (m.isDark(r, cc)) g2.fillRect(cc, r, 1, 1); }
  /* the moon as it is tonight: drawn, never named, never another night */
  function moonPhase() { var d = (Date.now() - Date.UTC(2000, 0, 6, 18, 14)) / 864e5; return ((d % 29.530588853) + 29.530588853) % 29.530588853 / 29.530588853; }
  /* as seen from the south: waxing lit on the left */
  function moonAt(c, cx, cy, R) { var f = moonPhase(), left = f < 0.5, k = Math.cos(f * 2 * Math.PI), r = R - 2.5;
    c.save(); c.fillStyle = '#111'; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(cx, cy, r, Math.PI / 2, Math.PI * 1.5, !left); c.closePath(); c.fill();
    c.fillStyle = k > 0 ? '#111' : '#fff'; c.beginPath(); c.ellipse(cx, cy, Math.abs(k) * r + 0.5, r, 0, 0, 7); c.fill();
    c.restore(); }
  function moonDraw(cv0) { var c = cv0.getContext('2d'); c.clearRect(0, 0, 128, 128); moonAt(c, 64, 64, 60); }

  /* the part chosen: up, down, out */
  function keys() { var k = $('#ks'), el = SEL >= 0 ? $('#paper .pt[data-i="' + SEL + '"]') : null; if (!el) { k.hidden = true; return; }
    var n = build().length; k.innerHTML = '<button type="button" data-mv="-1" aria-label="Up"' + (SEL ? '' : ' disabled') + '>' + ICON.up + '</button><button type="button" data-mv="1" aria-label="Down"' + (SEL < n - 1 ? '' : ' disabled') + '>' + ICON.down + '</button><button type="button" data-rm aria-label="Remove">' + ICON.rm + '</button>';
    k.hidden = false; var pr = $('#paper').getBoundingClientRect(), r = el.getBoundingClientRect(), m = $('main').getBoundingClientRect();
    k.style.top = (r.top - m.top - 46) + 'px'; k.style.left = (pr.right - m.left - k.offsetWidth) + 'px'; }

  /* the islands behind: one dot for each, joined */
  function isles() { var s = $('#isles'), w = innerWidth, h = innerHeight, r = (function (n) { return function () { n = (n * 16807) % 2147483647; return n / 2147483647; }; })(7), pts = [];
    for (var i = 0; i < Math.max(3, ISL); i++) pts.push([w * (0.08 + r() * 0.84), h * (0.12 + r() * 0.76)]);
    s.innerHTML = pts.slice(1).map(function (p, i) { var a = pts[i]; return '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + p[0] + '" y2="' + p[1] + '"' + (i >= ISL - 1 ? ' style="opacity:.25"' : '') + '/>'; }).join('') +
      pts.map(function (p, i) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (i ? 2.5 : 4) + '"' + (i ? (i >= ISL ? ' style="opacity:.3"' : '') : ' class="me"') + '/>'; }).join(''); }

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

  /* ───── the slip as it prints ───── */
  var IMGS = {}, g = null, cv = $('#cv');
  var img = function (src) { if (!src) return null; if (IMGS[src]) return IMGS[src].complete ? IMGS[src] : null; var im = new Image(); im.onload = draw; im.src = src; IMGS[src] = im; return null; };
  var TF = '700 56px Poppins, Arial', MF = '500 24px "IBM Plex Mono", monospace';
  function wrap(t, maxW) { var out = []; String(t || '').split('\n').forEach(function (ln) { var w = ln.split(' '), cur = ''; w.forEach(function (x) { var tr = cur ? cur + ' ' + x : x; if (g.measureText(tr).width > maxW && cur) { out.push(cur); cur = x; } else cur = tr; }); out.push(cur); }); return out; }
  function draw() {
    var parts = build(), ops = [], y = 28, P = 24, iw = W - P * 2;
    var tmp = D.createElement('canvas'); tmp.width = W; tmp.height = 10; g = tmp.getContext('2d');
    var add = function (h, fn) { ops.push([y, fn]); y += h; };
    parts.forEach(function (p) {
      var k = p.k;
      if (k === 'title') { if (!p.t) return; g.font = TF; var L = wrap(p.t, iw); add(L.length * 58 + 16, function (c, y0) { c.font = TF; L.forEach(function (l, j) { c.fillText(l, P, y0 + 52 + j * 58); }); }); }
      else if (k === 'text' || k === 'mesh' || k === 'code' || k === 'prompt' || k === 'card') { var tx = k === 'code' ? code(p.t) : k === 'card' ? (p.m && (p.m.name || p.m.id) || '') : p.t; if (!tx) return; g.font = MF; var L2 = wrap(String(tx), iw); add(L2.length * 32 + 14 + (k === 'mesh' ? 16 : 0), function (c, y0) { c.font = MF; if (k === 'mesh') { c.fillRect(P, y0 + 4, iw, 3); y0 += 16; } L2.forEach(function (l, j) { c.fillText(l, P, y0 + 26 + j * 32); }); }); }
      else if (k === 'list' || k === 'steps') { var ls = String(p.t || '').split('\n').filter(Boolean); if (!ls.length) return; g.font = MF; var rows = []; ls.forEach(function (l, j) { wrap(l, iw - 44).forEach(function (w, m) { rows.push([m ? '' : (k === 'steps' ? String(j + 1) : '□'), w]); }); });
        add(rows.length * 34 + 12, function (c, y0) { c.font = MF; rows.forEach(function (r, j) { c.fillText(r[0], P, y0 + 26 + j * 34); c.fillText(r[1], P + 44, y0 + 26 + j * 34); }); }); }
      else if (k === 'form') { var fl = String(p.t || '').split('\n').filter(Boolean); if (!fl.length) return; add(fl.length * 64 + 8, function (c, y0) { c.font = '500 20px "IBM Plex Mono", monospace'; fl.forEach(function (l, j) { var yy = y0 + j * 64; c.fillText(l, P, yy + 24); c.fillRect(P, yy + 56, iw, 2); }); }); }
      else if (k === 'rule') add(26, function (c, y0) { c.fillRect(P, y0 + 10, iw, 5); });
      else if (k === 'photo') { var im = img(p.src); if (!im) return; var h = Math.round(iw * im.naturalHeight / im.naturalWidth); add(h + 14, function (c, y0) { c.filter = 'grayscale(1) contrast(1.15)'; c.drawImage(im, P, y0, iw, h); c.filter = 'none'; }); }
      else if (k === 'qr') { if (!p.t || !window.qrcode) return; var m = window.qrcode(0, 'M'); m.addData(String(p.t)); m.make(); var n = m.getModuleCount(), px = Math.floor(176 / n), sz = n * px;
        add(sz + 22, function (c, y0) { for (var r = 0; r < n; r++) for (var cc = 0; cc < n; cc++) if (m.isDark(r, cc)) c.fillRect(W - P - sz + cc * px, y0 + r * px, px, px); }); }
      else if (k === 'moon') add(96, function (c, y0) { moonAt(c, P + 40, y0 + 44, 38); c.fillStyle = '#0B0B0B'; });
      else if (k === 'place') { if (p.lat == null) return; add(44, function (c, y0) { c.font = MF; c.beginPath(); c.arc(P + 10, y0 + 18, 9, 0, 7); c.fill(); c.fillText(p.lat.toFixed(4) + ', ' + p.lng.toFixed(4), P + 32, y0 + 26); }); }
      else if (k === 'sensor') { if (!p.nm && !p.v) return; add(68, function (c, y0) { c.font = '500 20px "IBM Plex Mono", monospace'; c.fillText(String(p.nm || '').toUpperCase(), P, y0 + 18); c.font = '700 44px Poppins, Arial'; c.fillText(String(p.v || '—'), P, y0 + 62); }); }
      else if (k === 'route') { if (!p.pts || p.pts.length < 2) return; var la = p.pts.map(function (a) { return a[0]; }), lo = p.pts.map(function (a) { return a[1]; }), n0 = Math.min.apply(0, la), n1 = Math.max.apply(0, la), e0 = Math.min.apply(0, lo), e1 = Math.max.apply(0, lo), k2 = Math.cos(n0 * Math.PI / 180), sw = (e1 - e0) * k2 || 1e-6, sh = (n1 - n0) || 1e-6, sc = Math.min(iw / sw, 560 / sh), rh = sh * sc;
        add(rh + 24, function (c, y0) { c.lineWidth = 4; c.lineJoin = 'round'; c.beginPath(); p.pts.forEach(function (a, j) { var x = P + (a[1] - e0) * k2 * sc, yy = y0 + 8 + (n1 - a[0]) * sc; if (j) c.lineTo(x, yy); else c.moveTo(x, yy); }); c.stroke(); [p.pts[0], p.pts[p.pts.length - 1]].forEach(function (a, j) { var x = P + (a[1] - e0) * k2 * sc, yy = y0 + 8 + (n1 - a[0]) * sc; c.beginPath(); c.arc(x, yy, j ? 10 : 7, 0, 7); c.fill(); }); }); }
    });
    var H2 = Math.min(MAXH, Math.max(200, y + 40));
    cv.width = W; cv.height = H2; var c = cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, W, H2); c.fillStyle = '#0B0B0B'; c.strokeStyle = '#0B0B0B';
    ops.forEach(function (o) { if (o[0] < H2) o[1](c, o[0]); });
    var mm = Math.round(H2 * MMPX); $('#len span').textContent = mm + ' / ' + MAXMM + ' mm'; $('#len b').style.width = Math.min(100, mm / MAXMM * 100) + '%'; $('#len').classList.toggle('full', y + 40 > MAXH);
  }

  /* ───── doing ───── */
  var cur = function (el) { var pt = el.closest('.pt'); return pt ? build()[+pt.dataset.i] : null; };
  var armT = 0;
  $('#starts').addEventListener('click', function (e) { var b = e.target.closest('[data-s]'); if (!b) return; var k = b.dataset.s;
    if (filled() && !b.classList.contains('arm')) { [].forEach.call(this.children, function (x) { x.classList.remove('arm'); }); b.classList.add('arm'); clearTimeout(armT); armT = setTimeout(function () { b.classList.remove('arm'); }, 2200); return; }
    S.start = k; S.builds[S.at || '_'] = STARTS[k].p.map(mk); SEL = -1; save(); tops(); paper(); });
  function openTray(at) { AT = at; $('#tray').classList.add('on'); $('#veil').hidden = false; [].forEach.call(D.querySelectorAll('#paper .sk'), function (s) { s.classList.toggle('on', +s.dataset.at === at); }); }
  function shutTray() { AT = -1; $('#tray').classList.remove('on'); $('#veil').hidden = true; [].forEach.call(D.querySelectorAll('#paper .sk.on'), function (s) { s.classList.remove('on'); }); }
  $('#veil').addEventListener('click', shutTray);
  $('#tray').addEventListener('click', function (e) { var b = e.target.closest('[data-add]'); if (!b || b.disabled) return; var p = mk(b.dataset.add), at = AT < 0 ? build().length : AT;
    if (p.k === 'prompt') p.t = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    build().splice(at, 0, p); SEL = at; shutTray(); save(); paper(); var f = $('#paper .pt[data-i="' + at + '"] textarea, #paper .pt[data-i="' + at + '"] input'); if (f) f.focus(); });
  $('#paper').addEventListener('input', function (e) { var f = e.target.dataset.f, el = e.target.closest('.pt'), p = cur(e.target); if (!f || !p) return; p[f] = e.target.value; save();
    if (e.target.tagName === 'TEXTAREA') grow(e.target); if (p.k === 'list' || p.k === 'steps') marks(); if (p.k === 'qr') qrDraw(el, p); if (p.k === 'code' || p.k === 'sensor') [].forEach.call(D.querySelectorAll('#paper .pt[data-k="code"]'), function (x) { $('.res', x).textContent = code(build()[+x.dataset.i].t); });
    draw(); keys(); });
  $('#paper').addEventListener('click', function (e) {
    var s = e.target.closest('[data-at]'); if (s) { openTray(+s.dataset.at); return; }
    var el = e.target.closest('.pt'); if (!el) return; var i = +el.dataset.i, p = build()[i];
    if (SEL !== i) { SEL = i; [].forEach.call(D.querySelectorAll('#paper .pt'), function (x) { x.classList.toggle('sel', x === el); }); keys(); }
    var b = e.target.closest('[data-roll],[data-gps],[data-ser],[data-file]'); if (!b) return;
    if (b.hasAttribute('data-roll')) { p.t = PROMPTS[Math.floor(Math.random() * PROMPTS.length)]; save(); paper(); }
    else if (b.hasAttribute('data-gps')) { if (!navigator.geolocation) return; b.classList.add('live'); navigator.geolocation.getCurrentPosition(function (r) { p.lat = r.coords.latitude; p.lng = r.coords.longitude; save(); paper(); }, function () { b.classList.remove('live'); }, { timeout: 9000 }); }
    else if (b.hasAttribute('data-ser')) serial(p, b);
    else { var fi = $('#fi'); fi.accept = PART[p.k].file || ''; fi.onchange = function () { var f = fi.files && fi.files[0]; fi.value = ''; if (f) take(p, f); }; fi.click(); }
  });
  $('#ks').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b || SEL < 0) return; var list = build(), p = list[SEL];
    if (b.dataset.mv) { var j = SEL + +b.dataset.mv; if (j < 0 || j >= list.length) return; list.splice(SEL, 1); list.splice(j, 0, p); SEL = j; }
    else if (b.hasAttribute('data-rm')) { list.splice(SEL, 1); SEL = -1; }
    save(); paper(); });
  D.addEventListener('click', function (e) { if (SEL >= 0 && !e.target.closest('#paper,#ks,#tray')) { SEL = -1; paper(); } });
  addEventListener('resize', function () { keys(); isles(); });
  function take(p, f) {
    var rd = new FileReader();
    if (p.k === 'photo') { rd.onload = function () { var im = new Image(); im.onload = function () { var k = Math.min(1, 1024 / Math.max(im.width, im.height)), c = D.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); p.src = c.toDataURL('image/jpeg', 0.8); save(); paper(); }; im.src = rd.result; }; rd.readAsDataURL(f); }
    else if (p.k === 'route') { rd.onload = function () { var pts = []; String(rd.result).replace(/<(?:trkpt|rtept|wpt)[^>]*?lat="([-\d.]+)"[^>]*?lon="([-\d.]+)"|<(?:trkpt|rtept|wpt)[^>]*?lon="([-\d.]+)"[^>]*?lat="([-\d.]+)"/g, function (m, a, b, c2, d2) { pts.push(a ? [+a, +b] : [+d2, +c2]); return m; }); var step = Math.max(1, Math.floor(pts.length / 800)); p.pts = pts.filter(function (x, j) { return j % step === 0; }); if (p.pts.length < 2) delete p.pts; save(); paper(); }; rd.readAsText(f); }
    else if (p.k === 'card') { rd.onload = function () { try { var m = JSON.parse(rd.result); p.m = { id: String(m.id || '').slice(0, 63), name: String(m.name || m.title || '').slice(0, 40), ins: m.ins || m.takes || [], outs: m.outs || m.gives || [] }; save(); paper(); } catch (e) { /* not a card */ } }; rd.readAsText(f); }
  }
  /* a LilyGo or any board on USB: the last number it prints, as the value */
  function serial(p, b) {
    if (!navigator.serial) return; navigator.serial.requestPort().then(function (port) { return port.open({ baudRate: 115200 }).then(function () { return port; }); }).then(function (port) {
      p.live = 1; b.classList.add('live'); var rd = port.readable.pipeThrough(new TextDecoderStream()).getReader(), buf = '';
      (function pump() { rd.read().then(function (r) { if (r.done) return; buf += r.value; var ls = buf.split(/\r?\n/); buf = ls.pop(); var last = ls.filter(function (l) { return /-?\d/.test(l); }).pop(); if (last) { var n = last.match(/-?\d+(\.\d+)?/); p.v = n ? n[0] : last.trim().slice(0, 12); save(); draw(); var v = $('#paper .pt[data-i="' + build().indexOf(p) + '"] input.v'); if (v && D.activeElement !== v) v.value = p.v; } pump(); }); })();
    }).catch(function () { b.classList.remove('live'); });
  }

  /* ───── printers: each island keeps its own build ───── */
  function printers() {
    return fetch('/api/partners').then(function (r) { return r.ok ? r.json() : { partners: [] }; }).then(function (j) {
      var l = (j.partners || []); ISL = Math.max(1, l.length);
      var on = l.filter(function (p) { return p.ready || p.id === 'novelglobal'; }), last = S.at || (NG && NG.store ? NG.store.get('da.base.printer', '') : '');
      $('#to').innerHTML = on.length ? on.map(function (p) { return '<option value="' + esc(p.id) + '"' + (p.id === last ? ' selected' : '') + '>' + esc(String(p.name || p.id).toUpperCase()) + (p.ready ? '' : ' · WAITS') + '</option>'; }).join('') : '<option value="">—</option>';
      $('#pr').disabled = !on.length || !(NG && NG.printAgain); if (!S.at && on.length) { S.at = $('#to').value; if (!S.builds[S.at] && S.builds._) S.builds[S.at] = S.builds._; }
      tray(); isles(); paper();
    }).catch(function () { tray(); isles(); });
  }
  $('#to').addEventListener('change', function () { S.at = this.value; SEL = -1; save(); paper(); });
  $('#pr').addEventListener('click', function () { var b = this, st = $('#st'); if (!NG || !NG.printAgain) return; b.disabled = true; try { NG.store.set('da.base.printer', $('#to').value); } catch (e) { /* the first on */ }
    st.innerHTML = NG.pips ? NG.pips('sending') : '…';
    NG.printAgain(cv.toDataURL('image/png'), 'bench').then(function (s) { st.innerHTML = NG.pips ? NG.pips(s) : s; }).catch(function (e) { st.innerHTML = NG.pips ? NG.pips(e && e.status ? 'failed' : 'outbox') : '✕'; }).then(function () { b.disabled = false; }); });
  $('#set').addEventListener('click', function () { try { window.parent.postMessage({ hm: 'panel' }, location.origin); } catch (e) { /* alone */ } });
  if (!NG) $('#set').hidden = true;
  if (H.classList.contains('in')) $('#mark').removeAttribute('href');
  if (D.fonts && D.fonts.load) Promise.all([D.fonts.load(TF), D.fonts.load(MF)]).then(draw, draw);
  tops(); tray(); isles(); paper(); printers();
})();

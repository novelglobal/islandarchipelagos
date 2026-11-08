/* the home of cards (brief 1.1): one column of art cards, a card to a screen, with the Irukandji's banner over it (the reef under
   the banner when it is pressed) and the switchboard under it, where cards are wired together. Every experience opens from its
   card and comes back to it: the aura (I W.I.S.H.), the radio, an island's stack, the island kit, the control panel */
(function () {
  'use strict';
  var D = document, H = D.documentElement;
  if (!H.classList.contains('aura-on') || (window.__LH && /[?&](aura|base)\b/.test(location.search))) return;
  H.classList.add('hm-on');
  var NG = window.NG || {}, AU = function () { return window.AURA || null; };
  var store = { get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private window */ } } };
  var RM = matchMedia('(prefers-reduced-motion: reduce)');
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var $ = function (s, r) { return (r || D).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || D).querySelectorAll(s)); };
  var INK = '#F4F1E8';

  var BLUE = '#17457F';

  /* ───────── the cards, as data: the same shape the engine's card takes (title, line, art, what it opens, its island) ───────── */
  /* each card is mostly black and white, a quarter blueprint blue (the one band that flows down through every card, each time in that
     card's own medium), and one small colour it owns: the strategy's dark green, the radio's lavender, the zine's tomato, the island's
     amber, the archipelagos' coral */
  var CARDS = [
    { id: 'portfolio', size: 'full', title: 'PORTFOLIO', opens: 'portfolio', island: 'novelglobal', art: 'receipt', motion: 'shadow', where: [-37.8136, 144.9631] },
    { id: 'wish', size: 'full', title: 'CIRCULAR STRATEGY', opens: 'aura', island: 'novelglobal', art: 'photos', motion: 'shadow', where: [-37.8136, 144.9631] },
    { id: 'radio', size: 'full', title: 'DIRECT ACTION RADIO', opens: 'radio', island: 'novelglobal', art: 'blocks', motion: 'speed', where: [-37.8136, 144.9631] },
    { id: 'zine', size: 'full', title: 'DESIGN AND PRINT', opens: 'press', island: 'pickles', art: 'dots', motion: 'shadow', where: [-37.8136, 144.9631] },
    { id: 'research', size: 'full', title: 'RESEARCH BOARD', opens: 'research', island: 'novelglobal', art: 'board', motion: 'speed', where: [-37.8136, 144.9631] },
    { id: 'kit', size: 'full', title: 'ISLAND', tag: 'ONE CLICK INSTALL', opens: 'kit', island: 'novelglobal', art: 'printer', motion: 'speed', where: [-37.8136, 144.9631] },
    { id: 'space', size: 'full', title: 'ISLAND ARCHIPELAGOS', hub: 'https://github.com/novelglobal/islandarchipelagos', opens: 'bench', island: 'novelglobal', art: 'forms', motion: 'shadow', where: [-37.8136, 144.9631] }
  ];
  var SKINS = ['portfolio', 'wish', 'radio', 'zine', 'research', 'kit', 'space'];
  var MOTION = store.get('da.hm.motion', null);   // null: each card's own; or 'shadow' / 'speed' for all
  var OWN = { portfolio: '#143D71', wish: '#3D7BE0', radio: '#FF6B1A', zine: '#FF5436', research: '#D9F24A', kit: '#FFB000', space: '#F59878' };
  var OWNPICS = { novelglobal: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (n) { return '/cards/chair-' + n + '.jpg'; }), radio: ['/cards/radio.jpg'], zine: ['/cards/zine.jpg'] };
  var CPICS = {};   // each card's own pictures, from /api/cards: { pics: [url], speed, shade }

  /* ───────── the art: three layers to a card (back, middle, front), painted to the card's size ───────── */
  var rnd = function (seed) { var s = seed || 1; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; };
  /* grain and flaws: the paper's tooth, a few specks knocked out, a scratch or two */
  function grain(g, w, h, n, col, seed, rmax) { var r = rnd(seed || 5); g.fillStyle = col; for (var i = 0; i < n; i++) { g.globalAlpha = 0.25 + r() * 0.6; g.fillRect(r() * w, r() * h, 0.6 + r() * (rmax || 1.1), 0.6 + r() * (rmax || 1.1)); } g.globalAlpha = 1; }
  function flaws(g, w, h, seed, k) { var r = rnd(seed); g.save(); g.globalCompositeOperation = 'destination-out';
    for (var i = 0; i < 260 * (k || 1); i++) { g.globalAlpha = 0.3 + r() * 0.7; g.beginPath(); g.arc(r() * w, r() * h, 0.4 + r() * r() * 2.6, 0, 7); g.fill(); }
    g.lineCap = 'round'; for (var s = 0; s < 6 * (k || 1); s++) { var x = r() * w, y = r() * h, a = r() * 7, L = 20 + r() * 120; g.globalAlpha = 0.25 + r() * 0.4; g.lineWidth = 0.4 + r() * 1.1; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 0.3) * L * 0.5, y + Math.sin(a + 0.3) * L * 0.5, x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
    g.restore(); }
  /* the flowing band: where it comes in at the top of each card and leaves at the foot, so the column holds one band from end to end */
  var FLOW = [0.2, 0.78, 0.26, 0.72, 0.32, 0.7, 0.24, 0.8];
  function bandPts(w, h, i) { var a = FLOW[i % FLOW.length] * w, b = FLOW[(i + 1) % FLOW.length] * w, P = [[a, -0.06 * h], [a, 0.42 * h], [b, 0.58 * h], [b, 1.06 * h]], out = [];
    for (var k = 0; k <= 80; k++) { var u = k / 80, v = 1 - u, c = [v * v * v, 3 * v * v * u, 3 * v * u * u, u * u * u]; out.push([0, 1].map(function (j) { return c[0] * P[0][j] + c[1] * P[1][j] + c[2] * P[2][j] + c[3] * P[3][j]; })); }
    return out; }
  function trace(g, pts) { g.beginPath(); pts.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); }
  function band(g, w, h, i, how) {
    var pts = bandPts(w, h, i), bw = Math.min(w, h) * 0.17, r = rnd(60 + i);
    var nrm = function (k) { var a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1; return [-dy / d, dx / d]; };
    g.save(); g.lineCap = 'butt'; g.lineJoin = 'round';
    if (how === 'dots') { g.fillStyle = BLUE; for (var k = 0; k < pts.length; k++) for (var q = -2; q <= 2; q++) { var n = nrm(k), off = q * bw * 0.2 + (r() - 0.5) * 3; if (k % 1 === 0) { g.beginPath(); g.arc(pts[k][0] + n[0] * off + (r() - 0.5) * 2, pts[k][1] + n[1] * off + (r() - 0.5) * 2, bw * (0.07 + r() * 0.04), 0, 7); g.fill(); } } }
    else if (how === 'blocks') { g.fillStyle = BLUE; for (var k2 = 0; k2 < pts.length; k2 += 3) { var p = pts[k2]; g.fillRect(Math.round(p[0] - bw * 0.62), Math.round(p[1] - bw * 0.3), Math.round(bw * 1.24), Math.round(bw * 0.62)); } }
    else if (how === 'tube') { [[1, '#0B2547'], [0.86, '#123A6B'], [0.62, BLUE], [0.36, '#3F72B5'], [0.12, '#B9D2F2']].forEach(function (s, j) { g.strokeStyle = s[1]; g.lineWidth = bw * s[0]; g.lineCap = 'round'; g.save(); g.translate(-j * bw * 0.04, -j * bw * 0.05); trace(g, pts); g.stroke(); g.restore(); }); g.restore(); return; }
    else { g.strokeStyle = BLUE; g.lineWidth = bw; trace(g, pts); g.stroke();
      if (how === 'tape') { g.fillStyle = BLUE; for (var e = 0; e < pts.length; e += 2) for (var sd = -1; sd <= 1; sd += 2) { var n2 = nrm(e); g.beginPath(); g.arc(pts[e][0] + n2[0] * bw * 0.5 * sd, pts[e][1] + n2[1] * bw * 0.5 * sd, 1 + r() * 3.2, 0, 7); g.fill(); } } }
    g.restore();
    /* its grain: lighter specks and a few darker, then the flaws knocked through */
    g.save(); g.globalCompositeOperation = 'source-atop'; grain(g, w, h, Math.round(w * h / 180), 'rgba(255,255,255,.22)', 70 + i, 1.4); grain(g, w, h, Math.round(w * h / 320), 'rgba(4,14,30,.35)', 80 + i, 1.6); g.restore();
    flaws(g, w, h, 90 + i, 0.3);
  }

  /* reef forms: fan, chrome, glass, disc, honey */
  /* a sea fan: a flat lattice on one stem */
  function fan(g, x, y, s, col, seed) {
    var r = rnd(seed), br = [], grow = function (px, py, a, L, d) { var ex = px + Math.cos(a) * L, ey = py + Math.sin(a) * L; br.push([px, py, ex, ey, d]); if (d < 5) { grow(ex, ey, a - 0.32 - r() * 0.2, L * 0.74, d + 1); grow(ex, ey, a + 0.32 + r() * 0.2, L * 0.74, d + 1); } };
    grow(x, y, -Math.PI / 2, s * 0.26, 0); g.lineCap = 'round';
    br.forEach(function (b) { g.strokeStyle = shade(col, -0.3); g.lineWidth = Math.max(0.8, (6 - b[4]) * s * 0.008); g.beginPath(); g.moveTo(b[0] + 1, b[1] + 1); g.lineTo(b[2] + 1, b[3] + 1); g.stroke(); g.strokeStyle = col; g.beginPath(); g.moveTo(b[0], b[1]); g.lineTo(b[2], b[3]); g.stroke(); });
    var tips = br.filter(function (b) { return b[4] >= 3; }); g.strokeStyle = shade(col, 0.25); g.lineWidth = 0.7; g.globalAlpha = 0.7;
    for (var k = 0; k < tips.length - 1; k++) { var a = tips[k], b = tips[k + 1]; if (Math.hypot(a[2] - b[2], a[3] - b[3]) < s * 0.18) { g.beginPath(); g.moveTo(a[2], a[3]); g.lineTo(b[2], b[3]); g.stroke(); } } g.globalAlpha = 1;
  }
  function chrome(g, x, y, R, rot) {
    [1, 0.72, 0.46].forEach(function (k, lv) { var n = [26, 20, 14][lv], rr = R * k;
      for (var i = 0; i < n; i++) { var a0 = rot + lv * 0.4 + i / n * Math.PI * 2, a1 = a0 + Math.PI * 2 / n, v = (Math.sin(a0 * 3 + lv) + 1) / 2;
        g.fillStyle = ['#1C1C1E', '#F4F4F2', '#7A7A7E', '#FFFFFF', '#3A3A3E'][(i + lv) % 5]; g.globalAlpha = 0.75 + v * 0.25;
        g.beginPath(); g.moveTo(x, y); g.arc(x, y, rr, a0, a1); g.closePath(); g.fill();
        g.beginPath(); g.arc(x + Math.cos((a0 + a1) / 2) * rr, y + Math.sin((a0 + a1) / 2) * rr * 0.98, rr * Math.PI / n * 0.9, 0, 7); g.fill(); }
      g.globalAlpha = 1; g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1; g.beginPath(); g.arc(x, y, rr * 0.98, rot, rot + 2); g.stroke(); });
  }
  function glass(g, x, y, R, bead, seed) {
    var r = rnd(seed || 11);
    for (var i = 0; i < 6; i++) { var a = i / 6 * Math.PI * 2 + r(), d = R * (i ? 0.55 : 0), bx = x + Math.cos(a) * d, by = y + Math.sin(a) * d * 0.8, br = R * (0.42 + r() * 0.16);
      g.fillStyle = 'rgba(255,255,255,.10)'; g.beginPath(); g.arc(bx, by, br, 0, 7); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.1; g.stroke();
      g.strokeStyle = 'rgba(10,20,40,.22)'; g.lineWidth = 2; g.beginPath(); g.arc(bx + br * 0.06, by + br * 0.08, br * 0.9, 0.3, 2.6); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.ellipse(bx - br * 0.38, by - br * 0.42, br * 0.16, br * 0.07, -0.7, 0, 7); g.fill(); }
    if (bead) for (var b = 0; b < 26; b++) { var ba = r() * 7, bd = r() * R * 0.7, bb = 1 + r() * R * 0.07; g.fillStyle = r() < 0.7 ? bead : '#FFF6D0'; g.beginPath(); g.arc(x + Math.cos(ba) * bd, y + Math.sin(ba) * bd * 0.8, bb, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(x + Math.cos(ba) * bd - bb * 0.3, y + Math.sin(ba) * bd * 0.8 - bb * 0.3, bb * 0.3, 0, 7); g.fill(); }
  }
  function disc(g, x, y, R, col) {
    for (var i = 0; i < 28; i++) { var a0 = i / 28 * Math.PI * 2, a1 = a0 + Math.PI * 2 / 28; g.fillStyle = i % 2 ? col : shade(col, 0.22); g.beginPath(); g.moveTo(x, y); g.arc(x, y, R * (0.94 + (i % 2) * 0.06), a0, a1); g.closePath(); g.fill(); }
    g.fillStyle = shade(col, -0.35); g.beginPath(); g.arc(x, y, R * 0.05, 0, 7); g.fill();
  }
  function honey(g, x, y, R, seed) {
    var r = rnd(seed || 21); g.fillStyle = 'rgba(244,196,92,.78)'; g.beginPath(); for (var i = 0; i <= 14; i++) { var a = i / 14 * Math.PI * 2, rr = R * (0.85 + r() * 0.25); g[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8); } g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,240,200,.5)'; for (var b = 0; b < 7; b++) { g.beginPath(); g.arc(x + (r() - 0.5) * R, y + (r() - 0.6) * R * 0.7, R * (0.08 + r() * 0.1), 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1.4; g.beginPath(); g.arc(x - R * 0.2, y - R * 0.25, R * 0.5, 3.6, 4.6); g.stroke();
  }
  function shade(hex, k) { var n = parseInt(hex.slice(1), 16), c = [n >> 16 & 255, n >> 8 & 255, n & 255].map(function (v) { return Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)); }); return 'rgb(' + c.join(',') + ')'; }
  /* black type set as dots, the way a dot-matrix poster sets it: the letters drawn once, then read back as blobs along their strokes */
  function dotText(g, text, x, y, size, col, seed) {
    var c = D.createElement('canvas'), cg = c.getContext('2d'); cg.font = '600 ' + size + 'px "Archivo Narrow", Arial, sans-serif'; var tw = Math.ceil(cg.measureText(text).width) + 8;
    c.width = tw; c.height = Math.ceil(size * 1.2); cg.font = '600 ' + size + 'px "Archivo Narrow", Arial, sans-serif'; cg.textBaseline = 'top'; cg.fillText(text, 4, size * 0.08);
    var d = cg.getImageData(0, 0, c.width, c.height).data, st = Math.max(3, Math.round(size / 13)), r = rnd(seed || 3); g.fillStyle = col;
    for (var yy = 0; yy < c.height; yy += st) for (var xx = 0; xx < c.width; xx += st) if (d[(yy * c.width + xx) * 4 + 3] > 140) { g.beginPath(); g.arc(x + xx + (r() - 0.5) * st * 0.5, y + yy + (r() - 0.5) * st * 0.5, st * (0.55 + r() * 0.35), 0, 7); g.fill(); }
    return tw;
  }
  /* novel.global's mark: the square and the sun */
  var MARK = '<svg class="ng-mark" viewBox="0 0 237 112" aria-hidden="true"><rect x="10" y="10" width="91.6" height="92" fill="currentColor" transform="rotate(-.34 56 56)"/><circle cx="178.3" cy="56.5" r="48.8" fill="#E25C40"/></svg>';
  /* CIRCULAR STRATEGY: a chart over the photographs, its course walked slowly */
  var CHART = '<svg class="st-chart" viewBox="0 0 100 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g class="ct">' +
    '<path d="M-5 112c14-6 22 4 34-2s18-14 30-10 22 12 46 4"/><path d="M-5 124c16-6 24 6 38-1s20-12 32-8 20 10 40 3"/><path d="M-5 138c18-4 26 5 40 0s22-10 34-6 18 8 36 2"/></g>' +
    '<g class="gr"><path d="M20 4v3M20 153v3M50 4v3M50 153v3M80 4v3M80 153v3M3 40h3M94 40h3M3 80h3M94 80h3M3 120h3M94 120h3"/></g>' +
    '<path id="st-way" class="way" d="M14 146C22 128 34 132 40 118S46 96 62 94 84 80 86 62 72 36 80 22"/>' +
    '<g class="wp"><circle cx="14" cy="146" r="1.6"/><circle cx="40" cy="118" r="1.2"/><circle cx="62" cy="94" r="1.2"/><circle cx="86" cy="62" r="1.2"/><circle cx="80" cy="22" r="1.8" class="to"/></g>' +
    '<circle class="me" r="1.4"><animateMotion dur="26s" repeatCount="indefinite" rotate="auto"><mpath href="#st-way"/></animateMotion></circle>' +
    '<g class="rose" transform="translate(88 12)"><circle r="5"/><path d="M0-7v14M-7 0h14"/><path class="n" d="M0-5l1.4 4h-2.8z"/></g></svg>';
  var DRIFT = '<svg class="st-tent" viewBox="0 0 100 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + [[12, 0, 34], [20, 0, 22], [83, 0, 40], [90, 0, 26]].map(function (t, k) { return '<path style="--k:' + k + '" d="M' + t[0] + ' ' + t[1] + 'c3 ' + t[2] * 0.25 + ' -3 ' + t[2] * 0.5 + ' 0 ' + t[2] * 0.75 + 's-2 ' + t[2] * 0.2 + ' 0 ' + t[2] * 0.25 + '"/>'; }).join('') + '</svg>';
  /* CIRCULAR STRATEGY: the photographs as evidence in an open case, pinned and strung; a knight's move between them */
  var EVID = '<div class="st-ev" aria-hidden="true"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path class="str" d="M31 8.4L79 18.2L53 38.6L31 8.4"/></svg>' +
    '<figure class="ev ev-b"><img alt="" decoding="async" loading="lazy" src="/cards/chair-4.jpg"><b>B</b></figure><figure class="ev ev-c"><img alt="" decoding="async" loading="lazy" src="/cards/chair-8.jpg"><b>C</b></figure>' +
    '<i class="pin" style="left:31%;top:8.4%"></i><i class="pin w" style="left:79%;top:18.2%"></i><i class="pin" style="left:53%;top:38.6%"></i><b class="tag">A</b><b class="case">CASE 07 · OPEN</b><b class="q">?</b></div>';
  /* DIRECT ACTION RADIO: a radar no one sees, sweeping the radio in the photograph; its play key breathing */
  var SWEEP = '<div class="rd-fx" aria-hidden="true"><svg viewBox="-50 -50 100 100"><defs><linearGradient id="rd-sw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FF6B1A" stop-opacity="0"/><stop offset="1" stop-color="#FF6B1A" stop-opacity=".7"/></linearGradient><pattern id="rd-px" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="3.3" height="3.3" fill="#0B0B0B" fill-opacity=".07" stroke="none"/></pattern></defs><circle r="46" fill="url(#rd-px)" stroke="none"/>' +
    '<circle r="16"/><circle r="30"/><circle r="46"/><path class="ax" d="M-48 0h96M0-48v96"/><g class="sw"><path d="M0 0L46 0A46 46 0 0 0 32.5 -32.5Z" fill="url(#rd-sw)"/></g><path class="pl" d="M-3.5 -5L5.5 0L-3.5 5Z"/></svg></div>';
  /* DESIGN AND PRINT: marks drawn by hand, one after another; its frame drawn by hand too */
  var DRAWN = '<svg class="zn-draw" viewBox="0 0 100 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
    '<path pathLength="1" class="fr" style="--d:0s" d="M3 4C30 2.4 70 3.4 97 3.2 96.4 50 97.6 110 96.8 156.6 66 157.4 34 156.2 3.4 157 4 110 2.6 50 3 4z"/>' +
    '<path pathLength="1" class="o" style="--d:.4s" d="M70 20l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>' +
    '<path pathLength="1" class="o b" style="--d:1.4s" d="M36.7 66A10.5 10.5 0 1 1 26.4 64.1 M28.5 63.6l1.2 -1.6 M22 86L30.6 61L39 86.5 M17 77L44 75.6"/>' +
    '<path pathLength="1" class="b" style="--d:2.6s" d="M78 54.63A6.5 6.5 0 1 1 70 54.63A4.42 4.42 0 0 0 78 54.63z M81.85 75.15A6.5 6.5 0 1 1 85.85 68.22A4.42 4.42 0 0 0 81.85 75.15z M62.15 68.22A6.5 6.5 0 1 1 66.15 75.15A4.42 4.42 0 0 0 62.15 68.22z M82 66A8 8 0 1 1 66 66A8 8 0 1 1 82 66 M75.7 66A1.7 1.7 0 1 1 72.3 66A1.7 1.7 0 1 1 75.7 66"/>' +
    '<path pathLength="1" class="b dm" style="--d:3.8s" d="M12 101L17 101L21 106L17 111L12 111z M14 97.5V114.5 M28.5 101L33 106L28.5 111L24 106z M28.5 101v-3.5M28.5 111v3.5M24 106h-2.5M33 106h2.5 M40.5 101L45 106L40.5 111L36 106z M40.5 101v-3.5M40.5 111v3.5M36 106h-2.5M45 106h2.5 M48 111V101L52.5 107L57 101V111 M48 101l-1.6 -3.4M57 101l1.6 -3.4M48 111l-1.2 3.4M57 111l1.2 3.4 M8 118L62 117.4 M18 117.9v3.4M31 117.8v5M43 117.6v2.2M55 117.5v4.2"/>' +
    '<path pathLength="1" class="o" style="--d:5.2s" d="M25 126.1A8.9 8.9 0 1 1 24.8 126.1 M25 127.5L29.4 141.1L17.9 132.7L32.1 132.7L20.6 141.1L25 127.5"/>' +
    '</svg>';
  /* RESEARCH BOARD: three of novel.global's reference pictures pinned up */
  var REFAT = [[4, 2, 44, 635 / 521], [56, 8, 36, 700 / 501], [26, 60, 40, 300 / 450]];
  var REFC = REFAT.map(function (p) { return [p[0] + p[2] / 2, p[1] + p[2] * p[3] / 2]; });
  var THEMES = ['RANGIWAHIA', 'SYNERGY', 'PRAXIS', 'SPECULATIVE FICTION', 'SPECULATIVE PRAXIS', 'RANGIWAHIA FUTURES', 'SYNERGY AS PRAXIS', 'FICTIONS OF PLACE', 'PRAXIS OF PLAY'];
  function refs() { var R = Math.random, N = REFC.slice(), k, e = [];
    for (k = 0; k < 15; k++) N.push([3 + R() * 94, -6 + R() * (k < 9 ? 104 : 134)]);
    N.forEach(function (p, i) { var d = N.map(function (q, j) { return [Math.hypot(q[0] - p[0], q[1] - p[1]), j]; }).sort(function (x, y) { return x[0] - y[0]; }); [1, 2, 3].forEach(function (m) { var j = d[m][1]; if (!e.some(function (x) { return (x[0] === i && x[1] === j) || (x[0] === j && x[1] === i); })) e.push([i, j]); }); });
    for (k = 0; k < 4; k++) e.push([Math.floor(R() * 3), 3 + Math.floor(R() * 13)]);
    var path = e.map(function (q, n) { var a = N[q[0]], b = N[q[1]], mx = (a[0] + b[0]) / 2 + (R() - 0.5) * 14, my = (a[1] + b[1]) / 2 + (R() - 0.5) * 14;
      return '<path pathLength="1" class="' + (n % 4 === 1 ? 'ds' : n % 5 === 2 ? 'lm' : '') + '" style="--d:' + (n * 0.06).toFixed(2) + 's" d="M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + 'Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1) + '"/>'; }).join('');
    var dots = N.slice(3).map(function (p, n) { return n % 3 ? '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (n % 2 ? 1 : 1.6) + '"/>' : '<path class="x" d="M' + (p[0] - 1.6).toFixed(1) + ' ' + (p[1] - 1.6).toFixed(1) + 'l3.2 3.2m0 -3.2l-3.2 3.2"/>'; }).join('');
    var th = THEMES[Math.floor(R() * THEMES.length)], low = N.slice(3).filter(function (p) { return p[1] > 84 && p[1] < 124; }), wp = low.length ? low[Math.floor(R() * low.length)] : N[3];
    return '<div class="rb-refs" aria-hidden="true"><svg viewBox="0 0 100 100">' + path + dots + '</svg>' + ['moa', 'cathaya', 'cells'].map(function (n, k) { var p = REFAT[k]; return '<i style="left:' + p[0] + '%;top:' + p[1] + 'cqw;width:' + p[2] + '%;--r:' + [-2.2, 1.6, -0.8][k] + 'deg"><img alt="" decoding="async" loading="lazy" src="/cards/ref-' + n + '.jpg"></i>'; }).join('') +
      '<b class="rb-word" style="left:' + Math.min(52, Math.max(4, wp[0] - 18)).toFixed(1) + '%;top:' + Math.min(122, Math.max(30, wp[1])).toFixed(1) + 'cqw;--r:' + ((R() - 0.5) * 9).toFixed(1) + 'deg">' + th + '</b></div>'; }
  /* ISLAND ARCHIPELAGOS: the coast from above in the sea's blue, its cells drifting, islands joined */
  var SEA = '<div class="sp-sea" aria-hidden="true"><img class="sp-coast" alt="" decoding="async" loading="lazy" src="/cards/ref-coast.jpg"><img class="sp-cells" alt="" decoding="async" loading="lazy" src="/cards/ref-cells.jpg">' +
    '<svg class="sp-isles" viewBox="0 0 100 160" preserveAspectRatio="xMidYMid slice"><path d="M22 30L48 52L78 40M48 52L36 84L66 96L84 74M36 84L18 112L50 128"/>' +
    [[22, 30], [48, 52], [78, 40], [36, 84], [66, 96], [84, 74], [18, 112], [50, 128]].map(function (p, k) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (k ? 1.2 : 1.9) + '"' + (k ? '' : ' class="me"') + ' style="--k:' + k + '"/>'; }).join('') + '</svg></div>';
  var ART = {
    /* CIRCULAR STRATEGY: photographs above, turning; under them a dark patchy green with nothing on it; the band across both */
    photos: function (L, w, h, i) { var g = L.b, seam = h * 0.14 / 1.28 + w / 1.08 * 4 / 3;
      g.fillStyle = '#123866'; g.fillRect(0, seam, w, h - seam); var r = rnd(14);
      for (var k = 0; k < 90; k++) { var px = r() * w, py = seam + r() * (h - seam), pr = 20 + r() * Math.min(w, h) * 0.22; g.fillStyle = ['#17457F', '#0F2E57', '#1E5596', '#0B2342'][k % 4]; g.globalAlpha = 0.18 + r() * 0.3; g.beginPath(); g.ellipse(px, py, pr, pr * (0.5 + r() * 0.5), r() * 3, 0, 7); g.fill(); }
      g.globalAlpha = 1; grain(g, w, h, Math.round(w * h / 60), 'rgba(255,255,255,.08)', 15); flaws(g, w, h, 16, 0.4);
      g.clearRect(0, 0, w, seam); },
    /* RADIO: its photograph, the band in stepped blocks */
    blocks: function (L, w, h, i) { var g = L.b; grain(g, w, h, Math.round(w * h / 80), 'rgba(0,0,0,.12)', 31); },
    /* DESIGN AND PRINT: the wall photograph, the title in dots */
    dots: function (L, w, h, i) { var m = L.m, cx = w * 0.8, cy = h * 0.2, R = Math.min(w, h) * 0.32, st = R / 7; m.fillStyle = '#FF5436'; for (var yy = cy - R; yy <= cy + R; yy += st) for (var xx = cx - R; xx <= cx + R; xx += st) { var dd = Math.hypot(xx - cx, yy - cy) / R; if (dd > 1) continue; m.beginPath(); m.arc(xx, yy, st * 0.48 * (1 - dd * dd * 0.85), 0, 7); m.fill(); } var t = L.t, s = Math.min(w * 0.16, h * 0.1), ox = w * 0.08, oy = h * 0.16;
      dotText(t, 'DESIGN', ox, oy, s, '#0A0A0A', 44); dotText(t, 'AND', ox, oy + s * 0.98, s, '#0A0A0A', 45); dotText(t, 'PRINT', ox, oy + s * 1.96, s, '#0A0A0A', 46); },
    /* ISLAND: the printer on pale paper, the band as torn tape behind it */
    printer: function (L, w, h, i) { var g = L.b; g.fillStyle = '#EEEDEA'; g.fillRect(0, 0, w, h); grain(g, w, h, Math.round(w * h / 50), 'rgba(0,0,0,.1)', 51); },
    /* ISLAND ARCHIPELAGOS: rounded forms on soft grey, all in greys but the coral, which is its own; the band a glossy tube */
    forms: function (L, w, h, i) { var g = L.b; g.fillStyle = '#0C2546'; g.fillRect(0, 0, w, h); grain(g, w, h, Math.round(w * h / 70), 'rgba(255,255,255,.06)', 61); },
    receipt: function (L, w, h, i) { },
    board: function (L, w, h, i) { var g = L.b, s = Math.max(14, w / 22); g.fillStyle = '#ECEBE7'; g.fillRect(0, 0, w, h); grain(g, w, h, Math.round(w * h / 90), 'rgba(0,0,0,.1)', 141);
      g.fillStyle = 'rgba(11,11,11,.3)'; for (var y = s / 2; y < h; y += s) for (var x = s / 2; x < w; x += s) { g.beginPath(); g.arc(x, y, 1.1, 0, 7); g.fill(); }
    },
    plain: function (L, w, h, i) { var g = L.b; g.fillStyle = '#ECEBE7'; g.fillRect(0, 0, w, h); grain(g, w, h, Math.round(w * h / 60), 'rgba(0,0,0,.08)', 71); }
  };
  ART.isles = ART.plain;

  /* ───────── the page ───────── */
  var SNORKEL = '<svg viewBox="0 0 24 24"><path d="M3 10.5c0-1.4 1.1-2.5 2.5-2.5h7c1.4 0 2.5 1.1 2.5 2.5v1c0 1.4-1.1 2.5-2.5 2.5H11l-1.5-1.6L8 14H5.5C4.1 14 3 12.9 3 11.5z"/><path d="M18.5 3v11.5a4.5 4.5 0 0 1-4.5 4.5h-3"/></svg>';
  var root = D.createElement('div'); root.id = 'hm';
  root.innerHTML = '<header id="hm-top" aria-label="The sea" aria-expanded="false"><canvas aria-hidden="true"></canvas><nav>' +
    '<button id="hm-snork" aria-label="Back up to the surface" hidden>' + SNORKEL + '</button>' +
    '<button id="hm-theme" aria-label="Light or dark"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" class="f"/></svg></button></nav></header><canvas id="hm-jf" aria-hidden="true"></canvas>' +
    '<main id="hm-col">' + CARDS.map(cardHTML).join('') + '</main><nav class="hm-dots" aria-hidden="true">' + CARDS.map(function () { return '<i></i>'; }).join('') + '</nav>' +
    '<section id="hm-x" role="dialog" aria-modal="true" aria-label=""><header><button class="hm-back" aria-label="Back"></button></header><div class="hm-body"></div></section>' +
    '<section id="hm-sb" class="low" aria-label="Switchboard"><button class="grab" aria-label="The switchboard, larger or smaller"></button><span class="cb" aria-hidden="true"></span><button class="rs">RESET</button><ol class="oc" aria-live="polite" hidden></ol><div class="jk"></div><canvas class="cab" aria-hidden="true"></canvas></section>';
  D.body.appendChild(root);
  var col = $('#hm-col'), xv = $('#hm-x'), cards = $$('.hm-card', col);
  /* the cards as novel.global writes them on the approval page (CARDS): # a card, then its lines; the order they are written in */
  var OPENS = /^(aura|radio|kit|panel|bench|portfolio|press|research|stack:[a-z0-9-]{1,24})$/, KEYS = ['title', 'line', 'tag', 'island', 'opens', 'where', 'motion', 'art', 'size'];
  function applyCards(text) {
    if (text) { var order = [], hide = {};
      String(text).split(/\n(?=\s*#)/).forEach(function (blk) { var ls = blk.split('\n'), m = /^\s*#\s*([a-z0-9-]{1,24})\s*$/i.exec(ls[0] || ''); if (!m) return; var id = m[1].toLowerCase(), c = byId(id);
        if (!c) { c = { id: id, size: 'full', title: id.toUpperCase(), opens: 'panel', island: 'novelglobal', art: 'plain', motion: 'shadow', where: [-37.8136, 144.9631] }; CARDS.push(c); } order.push(id);
        ls.slice(1).forEach(function (l) { var kv = /^\s*([a-z]+)\s*(?::\s*(.*))?$/i.exec(l); if (!kv) return; var k = kv[1].toLowerCase(), v = (kv[2] || '').trim().slice(0, 120);
          if (k === 'hide') hide[id] = 1; else if (k === 'where') { var ll = v.split(',').map(Number); if (ll.length === 2 && ll.every(isFinite)) c.where = ll; }
          else if (k === 'opens') { if (OPENS.test(v)) c.opens = v; } else if (k === 'motion') { if (/^(shadow|speed)$/.test(v)) c.motion = v; } else if (k === 'art') { if (ART[v]) c.art = v; } else if (k === 'size') { if (/^(full|half)$/.test(v)) c.size = v; }
          else if (k === 'hub') { if (/^https:\/\/[^\s"<>]+$/.test(v)) c.hub = v; } else if (k === 'skin') { if (SKINS.indexOf(v) >= 0) c.skin = v; } else if (k === 'island') c.island = v.toLowerCase().replace(/[^a-z0-9-]/g, ''); else if (KEYS.indexOf(k) >= 0) c[k] = v; }); });
      CARDS.sort(function (a, b) { var i = order.indexOf(a.id), j = order.indexOf(b.id); return (i < 0 ? 99 : i) - (j < 0 ? 99 : j); });
      for (var i = CARDS.length - 1; i >= 0; i--) if (hide[CARDS[i].id]) CARDS.splice(i, 1); }
    col.innerHTML = CARDS.map(cardHTML).join(''); cards = $$('.hm-card', col); receipt(); lastPrint(); $('.hm-dots').innerHTML = CARDS.map(function () { return '<i></i>'; }).join(''); paintAll(); pics(); radars(); lamps(); parallax();
  }
  var CARDS_TXT = null;
  fetch('/api/settings').then(function (r) { return r.ok ? r.json() : {}; }).then(function (j) { CARDS_TXT = j.cards || ''; if (CARDS_TXT) applyCards(CARDS_TXT); }).catch(function () { /* the cards as they started */ });

  function cardHTML(c, i) {
    var mo = MOTION || c.motion || 'shadow', sk = c.skin || (SKINS.indexOf(c.id) >= 0 ? c.id : c.isle ? 'isle' : 'plain');
    var keys = '<button class="hm-rk" data-radar="' + c.id + '" hidden aria-label="Find its printer"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/></svg></button>' +
      (c.hub ? '<a class="hm-rk" href="' + esc(c.hub) + '" target="_blank" rel="noopener" aria-label="The building hub"><svg viewBox="0 0 24 24"><path d="M7 17L17 7M9 7h8v8"/></svg></a>' : '');
    var t = esc(c.title), inner;
    if (sk === 'portfolio') inner = '<div class="hm-rc"><img class="rc-art" alt="" src="/cards/portfolio.webp" decoding="async"><img class="rc-kept" alt="" hidden><b class="rc-code">DA-YZ07</b><div class="rc-txt"><h2 class="hm-t vh">' + t + '</h2></div><b class="rc-lbl" aria-hidden="true">' + 'stories'.split('').map(function (ch, j) { return '<i style="--j:' + [0.6, -0.8, 0.3, -0.4, 0.9, -0.2, 0.5][j % 7] + '">' + ch + '</i>'; }).join('') + '</b><canvas class="rc-qr" aria-hidden="true"></canvas></div><span class="hm-lamps"></span>';
    else if (sk === 'radio') { var ks = [1, 0.78, 0.6, 0.47, 0.37, 0.29, 0.23, 0.18, 0.14, 0.11];
      inner = '<h2 class="hm-t kas"><span>' + t + '</span></h2><div class="kas" aria-hidden="true">' + ks.slice(1).map(function (k, j) { return '<span style="--fk:' + k + '"' + (j === 2 ? ' class="own"' : '') + '>' + t + '</span>'; }).join('') + '</div><span class="hm-lamps"></span>'; }
    else if (sk === 'zine') inner = '<h2 class="hm-t vh">' + t + '</h2>' + DRAWN + '<span class="hm-lamps"></span>';
    else if (sk === 'research') inner = '<h2 class="hm-t">' + t.split(' ').map(function (w) { return '<span>' + w + '</span>'; }).join('') + '</h2><span class="hm-lamps"></span>';
    else if (sk === 'kit') inner = (c.tag ? '<p class="hm-tag"><i></i>' + esc(c.tag) + '</p>' : '') + '<h2 class="hm-t">' + esc(c.line || c.title) + '</h2><span class="hm-sp"></span><span class="hm-lamps"></span>';
    else if (sk === 'space') inner = '<span class="hm-sp"></span>' + MARK + '<h2 class="hm-t">' + esc(c.title.toLowerCase()) + '</h2><p class="sp-sub">THERMAL PRINTER ISLAND COMMUNITIES</p><span class="hm-lamps"></span>';
    else if (sk === 'wish') inner = '<span class="hm-sp"></span><div class="st-name">' + MARK + '<h2 class="hm-t">' + esc(c.title.toLowerCase()) + '</h2></div><span class="hm-lamps"></span>';
    else inner = '<h2 class="hm-t">' + t + '</h2>' + (c.line ? '<p class="hm-line">' + esc(c.line) + '</p>' : '') + '<span class="hm-sp"></span><span class="hm-lamps"></span>';
    var extra = sk === 'wish' ? CHART + DRIFT + '<div class="hm-pics"></div>' + EVID : c.art === 'photos' ? '<div class="hm-pics"></div>' : sk === 'radio' ? '<div class="hm-bgimg"></div>' + SWEEP : sk === 'zine' ? '<div class="hm-bgimg"></div>' : sk === 'research' ? refs() : sk === 'space' ? SEA : '';
    var front = sk === 'kit' ? '<div class="hm-prn" aria-hidden="true"><div class="ph"></div><i class="led l-pwr"></i><i class="led l-act"></i><i class="led l-prn"></i><span class="slot"><span class="paper"></span></span></div>' : '';
    return '<section class="hm-slot su-' + sk + '"><div class="hm-sur" aria-hidden="true"></div><article class="hm-card ' + (c.size || 'full') + ' ' + mo + ' sk-' + sk + '" data-id="' + c.id + '" data-i="' + i + '" aria-label="' + t + '">' +
      '<div class="hm-art">' + extra + '<div class="hm-l b"><canvas></canvas></div><div class="hm-l m"><canvas></canvas></div><div class="hm-l t"><canvas></canvas>' + front + '</div></div>' +
      '<button class="hm-open" data-open="' + c.id + '" aria-label="Open ' + t + '"></button>' +
      '<div class="hm-keys">' + keys + '</div><div class="hm-in">' + inner + '</div><div class="hm-bcn" hidden></div></article></section>';
  }
  /* each card painted to its own size; again when the size changes */
  function paint(el) {
    var c = byId(el.dataset.id); if (!c) return; var i = +el.dataset.i, L = {}, w = 0, h = 0, k = Math.min(1.5, devicePixelRatio || 1);
    ['b', 'm', 't'].forEach(function (n) { var cv = el.querySelector('.hm-l.' + n + ' > canvas'), lw = cv.parentNode.clientWidth, lh = cv.parentNode.clientHeight; w = lw; h = lh;
      cv.width = Math.round(lw * k); cv.height = Math.round(lh * k); var g = cv.getContext('2d'); g.setTransform(k, 0, 0, k, 0, 0); L[n] = g; });
    if (!w || !h) return; el.dataset.pw = w + 'x' + h; (ART[c.art] || ART.plain)(L, w, h, i);
  }
  function paintAll(force) { cards.forEach(function (el) { var l = el.querySelector('.hm-l.b'); if (force || el.dataset.pw !== l.clientWidth + 'x' + l.clientHeight) paint(el); }); }
  var FONTS = D.fonts && D.fonts.ready ? D.fonts.ready : Promise.resolve(); FONTS.then(function () { paintAll(true); });
  var pT = 0; addEventListener('resize', function () { clearTimeout(pT); pT = setTimeout(paintAll, 180); });

  /* ───────── each card's own pictures: the strategy's photographs turning, the picture behind the radio ───────── */
  var TURN = [];
  function pics() {
    TURN.forEach(clearInterval); TURN = [];
    cards.forEach(function (el) { var id = el.dataset.id, cp = CPICS[id] || {}, own = OWNPICS[id === 'wish' ? 'novelglobal' : id];
      if (own && !(cp.pics && cp.pics.length)) cp = { pics: id === 'wish' ? own.filter(function (u) { return !/chair-[48]\./.test(u); }) : own, speed: cp.speed, shade: cp.shade };
      var box = el.querySelector('.hm-pics'), bg = el.querySelector('.hm-bgimg');
      if (box) { var ls = (cp.pics || []).slice(0, 10); box.innerHTML = ls.map(function (u, j) { return '<img alt="" decoding="async" fetchpriority="' + (j ? 'low' : 'high') + '" src="' + esc(u) + '"' + (j === 0 ? ' class="on"' : '') + '>'; }).join(''); box.classList.toggle('none', !ls.length);
        /* every photograph is fetched and decoded before it is shown, and one not yet ready is passed over, so each change is instant */
        if (ls.length > 1 && !RM.matches) { (function (box, ms) { var at = 0, ims = $$('img', box), ok = ims.map(function () { return false; });
          ims.forEach(function (im, j) { (im.decode ? im.decode() : Promise.resolve()).then(function () { ok[j] = true; }, function () {}); });
          TURN.push(setInterval(function () { if (D.hidden || away) return; var n = at; do { n = (n + 1) % ims.length; } while (!ok[n] && n !== at); if (n === at) return; ims[at].classList.remove('on'); at = n; ims[at].classList.add('on'); }, ms)); })(box, Math.max(1, cp.speed || 2) * 1000); } }
      if (bg) { var u = (cp.pics || [])[0]; bg.style.backgroundImage = u ? 'url("' + u.replace(/"/g, '') + '")' : ''; bg.style.opacity = u ? String(cp.shade == null ? 1 : cp.shade) : '0'; } });
  }
  /* an island whose keeper has given it pictures, with CARDS switched on, stands in the column too */
  function isleCards() { var add = false;
    PRN.forEach(function (p) { if (!p.links || p.links.indexOf('cards') < 0 || p.id === 'novelglobal' || byId(p.id) || !(CPICS[p.id] && CPICS[p.id].pics.length)) return;
      CARDS.push({ id: p.id, size: 'full', title: String(p.name || p.id).toUpperCase().slice(0, 40), opens: 'panel', island: p.id, art: 'photos', isle: 1, motion: 'shadow', where: [-37.8136, 144.9631] }); add = true; });
    if (add) applyCards(''); }
  /* PORTFOLIO: the last print kept on this phone, its code, how many; a QR to the portfolio */
  function receipt() {
    var el = col.querySelector('[data-id="portfolio"]'); if (!el) return; var a = AU();
    var st = store.get('da.hm.stories', 'moa'), k = el.querySelector('.rc-kept'); k.hidden = true; el.querySelector('.rc-code').textContent = 'DA-YZ07';
    if (/^data:image\//.test(st)) { k.src = st; k.hidden = false; }
    else if (st === 'last') (a && a.folio ? a.folio() : Promise.resolve([])).then(function (l) { l = l || []; var last = l[0];
      if (last && last.src) { k.src = last.src; k.hidden = false; } if (last && last.code) el.querySelector('.rc-code').textContent = last.code; }).catch(function () {});
    var q = el.querySelector('.rc-qr'); (window.qrcode ? Promise.resolve(window.qrcode) : new Promise(function (ok, no) { var s = D.createElement('script'); s.src = 'vendor/qrcode.js'; s.onload = function () { ok(window.qrcode); }; s.onerror = no; D.head.appendChild(s); })).then(function (qr) {
      var m = qr(0, 'M'); m.addData('https://novel.global/?stories'); m.make(); var n = m.getModuleCount(), px = 4, pad = 2; q.width = q.height = (n + pad * 2) * px; var g = q.getContext('2d'); g.fillStyle = '#F4F1E8'; g.fillRect(0, 0, q.width, q.height); g.fillStyle = '#143D71';
      for (var r = 0; r < n; r++) for (var cc = 0; cc < n; cc++) if (m.isDark(r, cc)) g.fillRect((cc + pad) * px, (r + pad) * px, px, px); }).catch(function () {});
  }
  /* the last print, hanging from ISLAND's slot */
  function lastPrint() { var el = col.querySelector('[data-id="kit"] .paper'); if (!el) return; var pt = store.get('da.pt.v1', null), a = AU(), put = function (u) { if (u) el.innerHTML = '<img alt="" src="' + esc(u) + '">'; };
    if (pt && pt.img) put(pt.img); else (a && a.folio ? a.folio() : Promise.resolve([])).then(function (l) { put((l && l[0] && l[0].src) || '/cards/portfolio.webp'); }).catch(function () { put('/cards/portfolio.webp'); }); }
  fetch('/api/cards').then(function (r) { return r.ok ? r.json() : { cards: {} }; }).then(function (j) { CPICS = j.cards || {}; pics(); partners().then(isleCards); }).catch(function () { /* none yet */ });

  var byId = function (id) { return CARDS.filter(function (c) { return c.id === id; })[0]; };

  /* ───────── motion: the three layers move at three speeds as the column scrolls, inside the card's own art ───────── */
  /* three layers to every card: the picture stays put; the words drift down a little as the card goes by; the top layer (band, dots, forms) runs fastest. On ISLAND the printer is the picture, so its layer stays put too */
  var DEPTH = { shadow: [0, 0.1, 0.18], speed: [0, 0.18, 0.32] }, WORDS = 0.035, tick = 0;
  function parallax() {
    tick = 0; var vh = innerHeight;
    cards.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.bottom < -40 || r.top > vh + 40) return;
      var p = Math.max(-1.2, Math.min(1.2, (r.top + r.height / 2 - vh / 2) / vh)), d = DEPTH[el.classList.contains('speed') ? 'speed' : 'shadow'], ls = el.querySelectorAll('.hm-l');
      var still = !!el.querySelector('.hm-prn'), inn = el.querySelector('.hm-in');
      for (var i = 0; i < ls.length; i++) ls[i].style.transform = RM.matches || (still && i === 2) ? '' : 'translate3d(0,' + (p * d[i] * r.height).toFixed(1) + 'px,0)';
      if (inn) inn.style.transform = RM.matches ? '' : 'translate3d(0,' + (-p * WORDS * r.height).toFixed(1) + 'px,0)'; });
    var at = Math.round(col.scrollTop / Math.max(1, cards[0].offsetHeight)), n = 0, best = 1e9; cards.forEach(function (el, i) { var dd = Math.abs(el.getBoundingClientRect().top - col.getBoundingClientRect().top); if (dd < best) { best = dd; n = i; } });
    CUR = cards[n] ? cards[n].dataset.id : ''; $$('.hm-dots i').forEach(function (d, i) { d.classList.toggle('on', i === (at >= 0 ? n : 0)); });
  }
  col.addEventListener('scroll', function () { if (!tick) tick = requestAnimationFrame(parallax); }, { passive: true });
  addEventListener('resize', function () { if (!tick) tick = requestAnimationFrame(parallax); });
  /* a key turns the page, as a swipe does */
  addEventListener('keydown', function (e) { if (H.classList.contains('hm-away') || xv.classList.contains('on') || /INPUT|TEXTAREA/.test((e.target || {}).tagName || '')) return;
    var d = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1 }[e.key]; if (!d) { if (e.key === 'Escape' && root.classList.contains('reef')) reef(false); return; } e.preventDefault();
    var c0 = col.getBoundingClientRect().top, pad = parseFloat(getComputedStyle(col).scrollPaddingTop || 0), box = function (el) { return getComputedStyle(el.parentNode).display === 'contents' ? el : el.parentNode; };
    var tops = cards.map(function (el) { return box(el).getBoundingClientRect().top - c0 + col.scrollTop; }), y = col.scrollTop + pad + 12, i = 0; while (i < tops.length - 1 && tops[i + 1] <= y) i++;
    col.scrollTo({ top: tops[Math.max(0, Math.min(cards.length - 1, i + d))] - pad, behavior: RM.matches ? 'auto' : 'smooth' }); });

  /* ───────── away and back: every experience leaves from its card and returns to it ───────── */
  var away = false;
  function goAway(then) {
    away = true; H.classList.add('hm-away'); history.pushState({ hm: 'away' }, ''); var a = AU();
    if (a && a.wake) { a.wake(); } if (then) setTimeout(then, 60);
  }
  function home() {
    if (xv.classList.contains('on')) shut(true); if (!away) return; away = false; H.classList.remove('hm-away'); var a = AU(); if (a && a.sleep) a.sleep(); lamps(); parallax();
  }
  addEventListener('popstate', function () { if (xv.classList.contains('on')) shut(true); else if (away) home(); });
  setTimeout(function () { var a = AU(); if (location.hash && a && a.wake) { away = true; H.classList.add('hm-away'); } else if (a && a.sleep) a.sleep(); }, 0);

  function open(id, opt) {
    var c = byId(id); if (!c) return; beep(660, 0.06);
    if (c.opens === 'aura') return goAway(function () { var a = AU(); if (a && a.home) a.home(); });
    if (c.opens === 'radio') return sheet(c.title, inFrame('studio?from=aura&only=radio' + (wired('radio', 'wish') ? '' : '&solo=1') + '#radio'));
    if (c.opens === 'portfolio') { vent(); return sheet(c.title, inFrame('studio?from=aura&only=portfolio#portfolio')); }
    if (c.opens === 'press') return sheet(c.title, inFrame('studio?from=aura&only=print&fmt=long#print'));
    if (c.opens === 'research') return sheet(c.title, function (b) { var w = wired('wish', 'research'); inFrame('research?in=1' + (w ? '&wish=1' : '') + '#b')(b); var fr = xv.querySelector('iframe');
      if (w) fr.addEventListener('load', function () { var a = AU(), p = a && a.piece ? a.piece() : null; fr.contentWindow.postMessage({ hm: 'form', img: (p && p.photo) || '', words: ((p && p.say) || '').slice(0, 140) }, location.origin); }); });
    if (/^stack:/.test(c.opens)) return sheet(c.title, function (b) { stackIn(b, c.opens.slice(6), opt); });
    if (c.opens === 'kit') return sheet(c.title, kitIn);
    if (c.opens === 'panel') return sheet(c.title, panelIn);
    if (c.opens === 'bench') return sheet(c.title, inFrame('bench?in=1#b'));
  }
  /* the sheet: an experience in the column's own place, the back key to the card it came from */
  function inFrame(src) { return function (b) { b.hidden = true; var fr = D.createElement('iframe'); fr.title = xv.getAttribute('aria-label'); fr.src = src.replace('#', '&night=' + (NIGHT ? 1 : 0) + '#'); xv.appendChild(fr); }; }
  function sheet(title, fill) {
    xv.setAttribute('aria-label', title); H.classList.add('hm-sheet'); var body = xv.querySelector('.hm-body');
    [].slice.call(xv.children).forEach(function (n) { if (n.tagName === 'IFRAME') n.remove(); }); body.hidden = false; body.innerHTML = ''; body.className = 'hm-body';
    fill(body); xv.classList.add('on'); history.pushState({ hm: 'x' }, ''); setTimeout(function () { xv.querySelector('.hm-back').focus(); }, 50);
  }
  function shut(fromPop) { xv.classList.remove('on'); H.classList.remove('hm-sheet'); setTimeout(function () { [].slice.call(xv.children).forEach(function (n) { if (n.tagName === 'IFRAME') n.remove(); }); }, 460); if (!fromPop) history.back(); }
  addEventListener('message', function (e) { if (e.origin === location.origin && e.data && e.data.hm === 'panel' && xv.classList.contains('on')) { shut(true); setTimeout(function () { sheet('ISLAND ARCHIPELAGOS', panelIn); }, 480); } });
  xv.querySelector('.hm-back').addEventListener('click', function () { shut(false); beep(330, 0.05); });
  root.addEventListener('click', function (e) {
    var o = e.target.closest('[data-open]'); if (o) { e.preventDefault(); open(o.dataset.open); return; }
    var r = e.target.closest('[data-radar]'); if (r) { beacon(r.dataset.radar, r); return; }
  });

  /* an island's experience (a stack) played in the sheet; wired to W.I.S.H., it starts from W.I.S.H.'s photograph and intention */
  function stackIn(body, id, opt) {
    body.hidden = true; var fr = D.createElement('iframe'); fr.title = id; fr.src = 'x.html?in=1#' + id.replace(/[^a-z0-9-]/g, ''); xv.appendChild(fr);
    if (opt && opt.fill || (wired('wish', 'zine') && carry('wish', 'zine').length)) fr.addEventListener('load', function () { var a = AU(), p = a && a.piece ? a.piece() : null; if (p && (p.photo || p.say)) fr.contentWindow.postMessage({ hm: 'fill', img: p.photo || '', words: (p.say || '').toUpperCase().slice(0, 22) }, location.origin); });
  }
  /* the island kit: the checklist, kept with the aura's, and printed as a slip */
  function kitIn(body) {
    var a = AU(), list = (a && a.isle ? a.isle() : []) || [], got = store.get('da.isle.v1', []) || [];
    var GH = 'https://github.com/novelglobal/islandarchipelagos/tree/main/kit';
    var spec = [['PAPER', '80 MM ROLL'], ['PRINTER', 'EPSON TM-T88V'], ['COMPUTER', 'RASPBERRY PI'], ['POWER', '24 V OR SOLAR'], ['WORKS', 'OFFLINE']];
    body.classList.add('kt');
    body.innerHTML = '<div class="kt-bar"><b>ISLAND</b><a href="' + GH + '" target="_blank" rel="noopener">INSTALL</a></div>' +
      '<img class="kt-hero" alt="" decoding="async" src="/printer-top.jpg">' +
      spec.map(function (s) { return '<div class="kt-row"><span>' + s[0] + '</span><b>' + s[1] + '</b></div>'; }).join('') +
      '<div class="kt-row"><a href="/build-a-solar-printer.txt" download>PARTS LIST</a><b>TXT</b></div>' +
      '<div class="kt-row"><span>PARTS</span><button class="kt-pr" id="hm-kprint" aria-label="Print the parts">PRINT</button></div><ol class="hm-list">' + list.map(function (s) { if (!s) return '<li class="gap" aria-hidden="true"></li>';
      return '<li role="checkbox" tabindex="0" data-k="' + s[0] + '" aria-checked="' + (got.indexOf(s[0]) >= 0) + '"><i></i><span>' + (s[2] ? '<a href="' + s[2] + '" rel="noopener" target="_blank">' + esc(s[1]) + ' ↗</a>' : esc(s[1])) + '</span></li>'; }).join('') + '</ol><p class="hm-say" aria-live="polite"></p>';
    $$('[data-k]', body).forEach(function (li) { var flip = function () { var on = li.getAttribute('aria-checked') !== 'true'; li.setAttribute('aria-checked', String(on)); store.set('da.isle.v1', $$('[aria-checked="true"]', body).map(function (q) { return q.dataset.k; })); beep(on ? 880 : 440, 0.05); };
      li.addEventListener('click', function (e) { if (!e.target.closest('a')) flip(); }); li.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } }); });
    $('#hm-kprint', body).addEventListener('click', function () { var say = $('.hm-say', body), ticks = store.get('da.isle.v1', []) || [];
      var cv = window.SLIPS && SLIPS.checklist ? SLIPS.checklist(ticks, 512) : listSlip(list, ticks); say.textContent = '· · ·'; printCanvas(cv, 'kit').then(function (s) { say.textContent = s === 'held' ? 'WAITING FOR THE PRINTER’S YES' : s ? 'PRINTING' : '×'; }, function () { say.textContent = '× NO PRINTER ONLINE'; }); });
  }
  function listSlip(list, ticks) {
    var W = 512, rows = list.filter(Boolean), c = D.createElement('canvas'); c.width = W; c.height = 120 + rows.length * 58; var g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, c.height); g.fillStyle = '#000'; g.strokeStyle = '#000'; g.lineWidth = 3; g.font = '700 34px "Archivo Narrow", Arial, sans-serif'; g.fillText('AN ISLAND', 24, 60);
    g.font = '26px "Archivo Narrow", Arial, sans-serif'; rows.forEach(function (s, i) { var y = 110 + i * 58; g.strokeRect(24, y - 24, 28, 28); if (ticks.indexOf(s[0]) >= 0) g.fillRect(30, y - 18, 16, 16); g.fillText(s[1].slice(0, 30), 68, y); });
    return c;
  }
  /* the control panel: this phone's settings and the network behind the site; island keepers' controls arrive with their key (stage H3) */
  function panelIn(body) {
    var dark = NIGHT, mo = MOTION || 'own';
    body.innerHTML = '<div class="hm-row"><a class="hm-btn big" href="https://github.com/novelglobal/islandarchipelagos" target="_blank" rel="noopener">SOURCE CODE ↗</a></div><p class="hm-h">MOTION</p><div class="hm-row">' + [['own', 'EACH CARD'], ['shadow', 'SHADOW'], ['speed', 'SPEED']].map(function (m) { return '<button class="hm-btn' + (mo === m[0] ? ' on' : '') + '" data-mo="' + m[0] + '">' + m[1] + '</button>'; }).join('') + '</div>' +
      '<p class="hm-h">LIGHT</p><div class="hm-row"><button class="hm-btn' + (dark ? '' : ' on') + '" data-dk="0">DAY</button><button class="hm-btn' + (dark ? ' on' : '') + '" data-dk="1">NIGHT</button></div>' +
      '<p class="hm-h">SWITCHBOARD</p><div class="hm-row"><button class="hm-btn" id="hm-rewire">RESET</button><button class="hm-btn" id="hm-sbw" aria-expanded="false">WORDS</button></div><div class="hm-sbw" hidden></div>' +
      '<p class="hm-h">STORIES CARD</p><div class="hm-row">' + [['moa', 'MOA'], ['last', 'LAST PRINT'], ['own', 'MY PICTURE']].map(function (m) { var v = store.get('da.hm.stories', 'moa'); return '<button class="hm-btn' + ((v === m[0] || (m[0] === 'own' && /^data:/.test(v))) ? ' on' : '') + '" data-st="' + m[0] + '">' + m[1] + '</button>'; }).join('') + '<input type="file" accept="image/*" id="hm-stf" hidden></div>' +
      '<div id="hm-keeper"></div><p class="hm-h">ISLANDS</p><ol class="hm-list hm-isles"><li>· · ·</li></ol>';
    $$('[data-mo]', body).forEach(function (b) { b.addEventListener('click', function () { MOTION = b.dataset.mo === 'own' ? null : b.dataset.mo; store.set('da.hm.motion', MOTION); find('style'); cards.forEach(function (el) { var c = byId(el.dataset.id); el.classList.remove('shadow', 'speed'); el.classList.add(MOTION || c.motion); }); $$('[data-mo]', body).forEach(function (q) { q.classList.toggle('on', q === b); }); beep(550, 0.05); }); });
    $$('[data-dk]', body).forEach(function (b) { b.addEventListener('click', function () { setNight(b.dataset.dk === '1'); $$('[data-dk]', body).forEach(function (q) { q.classList.toggle('on', q === b); }); }); });
    $$('[data-st]', body).forEach(function (b) { b.addEventListener('click', function () { var set = function (v) { store.set('da.hm.stories', v); $$('[data-st]', body).forEach(function (q) { q.classList.toggle('on', q === b); }); receipt(); beep(550, 0.05); };
      if (b.dataset.st !== 'own') return set(b.dataset.st); var fi = $('#hm-stf', body); fi.onchange = function () { var f = fi.files && fi.files[0]; if (!f) return; var im = new Image(), u = URL.createObjectURL(f); im.onload = function () { var k = Math.min(1, 900 / Math.max(im.width, im.height)), cv = D.createElement('canvas'); cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); URL.revokeObjectURL(u); set(cv.toDataURL('image/jpeg', 0.8)); }; im.src = u; }; fi.click(); }); });
    $('#hm-sbw', body).addEventListener('click', function () { var w = $('.hm-sbw', body), op = w.hidden; w.hidden = !op; this.setAttribute('aria-expanded', String(op)); if (!op) return;
      var rows = []; Object.keys(PORTS).filter(function (id) { return !/^isle/.test(id); }).forEach(function (id) { rows.push(['n.' + id, 'NAME', nameOf(id)]); Object.keys(PORTS[id].ins).forEach(function (e) { rows.push(['i.' + id + '.' + e, GETS[e] + ' IN', PORTS[id].ins[e]]); }); });
      w.innerHTML = rows.map(function (r) { return '<label' + (r[1] === 'NAME' ? ' class="nm"' : '') + '><span>' + esc(r[1]) + '</span><input data-k="' + r[0] + '" value="' + esc(r[2]) + '" maxlength="40" spellcheck="false"></label>'; }).join('') + '<button class="hm-btn" id="hm-sbw0">AS THEY WERE</button>';
      w.addEventListener('change', function (e) { var k = e.target.dataset && e.target.dataset.k; if (!k) return; var o = store.get('da.sb.words', {}) || {}; o[k] = e.target.value.trim().toUpperCase().slice(0, 40); if (!o[k]) delete o[k]; store.set('da.sb.words', o); sbWords(); board(); });
      $('#hm-sbw0', w).addEventListener('click', function () { store.set('da.sb.words', {}); location.reload(); }); });
    $('#hm-rewire', body).addEventListener('click', function () { WIRES = START.slice(); saveWires(); board(); beep(440, 0.08); });
    keeperIn($('#hm-keeper', body));
    partners(true).then(function (l) { var ol = $('.hm-isles', body); if (ol) ol.innerHTML = l.length ? l.map(function (p) { return '<li class="' + (p.ready ? 'on' : '') + '"><i></i><span>' + esc(p.name || p.id) + (p.number ? ' · ' + p.number : '') + '</span></li>'; }).join('') : '<li>—</li>'; });
  }

  /* a picture made small enough to send: at most 1600 on its long side, as a JPEG (which also drops where it was taken) */
  function shrinkPic(file) { return new Promise(function (ok, no) { var u = URL.createObjectURL(file), im = new Image(); im.onload = function () { var k = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight)), c = D.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); c.toBlob(function (b) { if (b) ok(b); else no(new Error('shrink')); }, 'image/jpeg', 0.84); }; im.onerror = no; im.src = u; }); }
  /* an island keeper's own controls: their key (from the welcome slip) opens their one island, nothing else */
  function keeperIn(box) {
    var key = store.get('da.hm.key', ''); if (!key || !box) return;
    var call = function (o) { return fetch('/api/island', Object.assign({ headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' } }, o || {})).then(function (r) { if (r.status === 401) { store.set('da.hm.key', ''); throw new Error('key'); } return r.json(); }); };
    var fill = function (p) { box.innerHTML = '<p class="hm-h">YOUR ISLAND' + (p.number ? ' · ' + p.number : '') + '</p><ol class="hm-list hm-isles"><li class="' + (p.ready ? 'on' : '') + '"><i></i><span>' + esc(p.name) + ' · ' + p.queued + ' WAITING · ' + p.printed + ' PRINTED</span></li></ol>' +
      '<p class="hm-h">CONNECTIONS</p><div class="hm-row">' + (p.all || []).map(function (k) { return '<button class="hm-btn' + ((p.links || []).indexOf(k) >= 0 ? ' on' : '') + '" data-ln="' + k + '" aria-pressed="' + ((p.links || []).indexOf(k) >= 0) + '">' + ({ wish: 'W.I.S.H.', radio: 'RADIO', art: 'ART', words: 'WORDS', cards: 'CARDS', codes: 'CODES' }[k] || k.toUpperCase()) + '</button>'; }).join('') + '</div>' +
      '<p class="hm-h">ITS CARD · UP TO TEN PICTURES</p><div class="hm-pgrid">' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (n) { var q = (p.pics || []).filter(function (x) { return x.slot === n; })[0]; return '<button class="hm-pslot' + (q ? ' on' : '') + '" data-ps="' + n + '" aria-label="' + (q ? 'Take this picture away' : 'Add a picture') + '">' + (q ? '<img alt="" src="' + esc(q.url) + '">' : '+') + '</button>'; }).join('') + '</div>' +
      '<div class="hm-row">' + [2, 3, 5, 8].map(function (n) { return '<button class="hm-btn' + ((p.speed || 2) === n ? ' on' : '') + '" data-sp="' + n + '">' + n + ' S</button>'; }).join('') + '</div>' +
      '<div class="hm-row"><button class="hm-btn" data-rn>RENAME</button><button class="hm-btn" data-out>FORGET THIS KEY</button></div>';
      $$('[data-ln]', box).forEach(function (b) { b.addEventListener('click', function () { var l = (p.links || []).slice(), k = b.dataset.ln, i = l.indexOf(k); if (i >= 0) l.splice(i, 1); else l.push(k); call({ method: 'POST', body: JSON.stringify({ links: l }) }).then(fill); beep(i >= 0 ? 330 : 660, 0.05); }); });
      $$('[data-ps]', box).forEach(function (b) { b.addEventListener('click', function () { var n = +b.dataset.ps;
        if (b.classList.contains('on')) { if (confirm('Take this picture off your card?')) fetch('/api/island/pics/' + n, { method: 'DELETE', headers: { authorization: 'Bearer ' + key } }).then(function () { return call(); }).then(fill); return; }
        var fi = D.createElement('input'); fi.type = 'file'; fi.accept = 'image/*'; fi.addEventListener('change', function () { var file = fi.files && fi.files[0]; if (!file) return; b.textContent = '·'; shrinkPic(file).then(function (bl) { return fetch('/api/island/pics/' + n, { method: 'PUT', headers: { authorization: 'Bearer ' + key, 'content-type': 'image/jpeg' }, body: bl }); }).then(function () { return call(); }).then(fill, function () { b.textContent = '×'; }); }); fi.click(); }); });
      $$('[data-sp]', box).forEach(function (b) { b.addEventListener('click', function () { call({ method: 'POST', body: JSON.stringify({ speed: +b.dataset.sp }) }).then(fill); beep(550, 0.05); }); });
      $('[data-rn]', box).addEventListener('click', function () { var n = prompt('Its name', p.name); if (n && n.trim()) call({ method: 'POST', body: JSON.stringify({ name: n.trim() }) }).then(fill); });
      $('[data-out]', box).addEventListener('click', function () { if (confirm('Forget this island’s key on this phone? The slip still has it.')) { store.set('da.hm.key', ''); box.innerHTML = ''; } }); };
    box.innerHTML = '<p class="hm-h">YOUR ISLAND</p><p class="hm-say">· · ·</p>'; call().then(fill, function () { box.innerHTML = '<p class="hm-h">YOUR ISLAND</p><p class="hm-say">THE KEY DID NOT OPEN IT</p>'; });
  }

  /* ───────── printing from the home: a canvas to the printer that is listening ───────── */
  function printCanvas(cv, was) { if (!NG.printAgain) return Promise.reject(new Error('no base')); return NG.printAgain(cv.toDataURL('image/png'), was); }
  function quickPrint() {
    var f = D.createElement('input'); f.type = 'file'; f.accept = 'image/*'; f.setAttribute('capture', 'environment');
    f.addEventListener('change', function () { var file = f.files && f.files[0]; if (!file) return; find('booth'); var u = URL.createObjectURL(file), im = new Image();
      im.onload = function () { var W = 512, c; if (window.SLIPS && SLIPS.quick) c = SLIPS.quick(im, W); else { c = D.createElement('canvas'); c.width = W; c.height = Math.round(W * im.naturalHeight / im.naturalWidth); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); }
        URL.revokeObjectURL(u); horn(0.6); printCanvas(c, 'quick').then(function () { if (NG.toast) NG.toast('PRINTING'); }, function () { if (NG.toast) NG.toast('NO PRINTER ONLINE'); }); };
      im.src = u; });
    f.click();
  }

  /* ───────── the printers: who is listening, for the radar keys ───────── */
  var PRN = [], PRN_AT = 0;
  function partners(force) { if (!force && Date.now() - PRN_AT < 60e3) return Promise.resolve(PRN); return fetch('/api/partners').then(function (r) { return r.ok ? r.json() : { partners: [] }; }).then(function (j) { PRN = j.partners || []; PRN_AT = Date.now(); radars(); return PRN; }).catch(function () { return PRN; }); }
  function radars() { cards.forEach(function (el) { var c = byId(el.dataset.id), p = PRN.filter(function (q) { return q.id === c.island; })[0], k = el.querySelector('[data-radar]'); if (k) k.hidden = !(p && p.ready); el.classList.toggle('live', !!(p && p.ready)); }); }
  partners(); setInterval(function () { if (!D.hidden && !away) partners(true); }, 60e3);

  /* ───────── the beacon: a card turned into a compass to its printer, from this phone's place ───────── */
  var HEAD = null, BCN = null;
  function beacon(id, key) {
    var el = col.querySelector('[data-id="' + id + '"]'), b = el.querySelector('.hm-bcn'), c = byId(id);
    if (!b.hidden) { b.hidden = true; key.classList.remove('on'); BCN = null; return; }
    key.classList.add('on'); find('map'); b.hidden = false; b.innerHTML = '<svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="92"/><circle cx="100" cy="100" r="60" stroke-dasharray="1 5"/><path d="M100 4v10M100 186v10M4 100h10M186 100h10"/><text x="100" y="30" text-anchor="middle" font-size="12" fill="currentColor" stroke="none">N</text><g class="ndl"><path d="M100 22L108 100L100 110L92 100Z"/></g></svg>' +
      '<dl><div><dt>DISTANCE</dt><dd data-d>…</dd></div><div><dt>BEARING</dt><dd data-b>…</dd></div><div><dt>PRINTER</dt><dd>' + esc((PRN.filter(function (q) { return q.id === c.island; })[0] || {}).ready ? 'ON' : 'OFF') + '</dd></div></dl>';
    BCN = { el: b, c: c, brg: 0 };
    var ask = window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission ? DeviceOrientationEvent.requestPermission().catch(function () { return 'denied'; }) : Promise.resolve('granted');
    ask.then(function (ok) { if (ok === 'granted') addEventListener('deviceorientation', orient, true); });
    if (!navigator.geolocation) { b.querySelector('[data-d]').textContent = '—'; return; }
    navigator.geolocation.getCurrentPosition(function (pos) { if (!BCN) return; var la = pos.coords.latitude, ln = pos.coords.longitude, t = c.where, R = 6371e3, r1 = la * Math.PI / 180, r2 = t[0] * Math.PI / 180, dl = (t[1] - ln) * Math.PI / 180, df = (t[0] - la) * Math.PI / 180;
      var h = Math.sin(df / 2) * Math.sin(df / 2) + Math.cos(r1) * Math.cos(r2) * Math.sin(dl / 2) * Math.sin(dl / 2), d = 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
      var brg = (Math.atan2(Math.sin(dl) * Math.cos(r2), Math.cos(r1) * Math.sin(r2) - Math.sin(r1) * Math.cos(r2) * Math.cos(dl)) * 180 / Math.PI + 360) % 360;
      BCN.brg = brg; b.querySelector('[data-d]').textContent = d < 1000 ? Math.round(d) + ' M' : (d / 1000).toFixed(d < 10e3 ? 1 : 0) + ' KM'; b.querySelector('[data-b]').textContent = Math.round(brg) + '° ' + ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(brg / 45) % 8]; needle(); beep(990, 0.05);
    }, function () { b.querySelector('[data-d]').textContent = '—'; }, { enableHighAccuracy: true, timeout: 12e3, maximumAge: 60e3 });
  }
  function orient(e) { HEAD = e.webkitCompassHeading != null ? e.webkitCompassHeading : e.alpha != null ? 360 - e.alpha : null; needle(); }
  function needle() { if (!BCN) return; var n = BCN.el.querySelector('.ndl'); if (n) n.style.transform = 'rotate(' + (BCN.brg - (HEAD || 0)) + 'deg)'; }

  /* ───────── sound: only what a touch causes ───────── */
  var AC = null; function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } } if (AC.state === 'suspended') AC.resume(); return AC; }
  function beep(f, len) { var c = ac(); if (!c) return; var o = c.createOscillator(), g = c.createGain(), t = c.currentTime; o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.08); o.connect(g).connect(c.destination); o.start(t); o.stop(t + len + 0.1); }
  /* a thermal vent: a low rumble rising, then the printer's chatter */
  function vent() { var c = ac(); if (!c) return; var t = c.currentTime, n = c.createBuffer(1, c.sampleRate * 1.2, c.sampleRate), d = n.getChannelData(0), last = 0;
    for (var i = 0; i < d.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
    var s = c.createBufferSource(), lp = c.createBiquadFilter(), gn = c.createGain(); s.buffer = n; lp.type = 'lowpass'; lp.frequency.setValueAtTime(90, t); lp.frequency.exponentialRampToValueAtTime(420, t + 0.9);
    gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.5, t + 0.3); gn.gain.exponentialRampToValueAtTime(0.0001, t + 1.15); s.connect(lp).connect(gn).connect(c.destination); s.start(t);
    for (var k = 0; k < 7; k++) setTimeout(function () { beep(1400 + Math.random() * 300, 0.012); }, 820 + k * 46); }
  /* the fog horn: two low reeds a little apart and a sub under them, through a closing filter */
  function horn(len) { var c = ac(); if (!c) return; var t = c.currentTime, L = len || 2.2, out = c.createGain(), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(180, t); lp.frequency.linearRampToValueAtTime(520, t + 0.3); lp.frequency.linearRampToValueAtTime(240, t + L); lp.Q.value = 3;
    out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(0.22, t + 0.25); out.gain.setValueAtTime(0.22, t + L - 0.5); out.gain.exponentialRampToValueAtTime(0.0001, t + L + 0.6); lp.connect(out).connect(c.destination);
    [[73.4, 'sawtooth'], [73.9, 'sawtooth'], [36.7, 'sine']].forEach(function (v) { var o = c.createOscillator(); o.type = v[1]; o.frequency.value = v[0]; o.frequency.setValueAtTime(v[0] * 0.97, t); o.frequency.linearRampToValueAtTime(v[0], t + 0.4); o.connect(lp); o.start(t); o.stop(t + L + 0.7); }); }


  /* ───────── the sea: the banner is its surface; pressed, the sea opens down into the reef, one water with no line between ───────── */
  var top = $('#hm-top'), tcv = top.querySelector('canvas'), tx = tcv.getContext('2d'), dpr = 1, TOPH = 52, CH = 52, VW = 360;
  var NIGHT = store.get('da.hm.night', null); if (NIGHT == null) { var a0 = AU(); NIGHT = !!(a0 && a0.dark && a0.dark()); }
  function setNight(on, quiet) { NIGHT = !!on; store.set('da.hm.night', NIGHT); root.classList.toggle('night', NIGHT); var a = AU(); if (a && a.dark && a.dark() !== NIGHT) a.dark(NIGHT); RB = null; if (!quiet) beep(NIGHT ? 392 : 523, 0.05); }
  setNight(NIGHT, true);
  function reefH() { return Math.round(Math.min(innerHeight * 0.68, 640)); }
  function seaSize() {
    dpr = Math.min(2, devicePixelRatio || 1); TOPH = parseFloat(getComputedStyle(top).getPropertyValue('--hm-top')) || top.clientHeight || 52; VW = top.clientWidth || innerWidth; CH = TOPH + reefH();
    tcv.style.height = CH + 'px'; tcv.width = Math.round(VW * dpr); tcv.height = Math.round(CH * dpr); RB = null;
  }

  /* ───────── the Irukandji, as it was first drawn: the box bell in one line with its shadow line, the eye in dots, four dots where the
     tentacles leave, four fine tentacles beaded with stinging cells. What is new: the eye is faint, the beads stop a fifth of the way
     down, and it swims slowly, crown first, with a pulse and a long glide; open the sea and it goes down into it ───────── */
  var jcv = $('#hm-jf'), jx = jcv.getContext('2d'), CUR = '';
  var J = { x: 150, y: 26, vx: -3, vy: 0, a: Math.PI - 0.25, ph: Math.random(), p: 0, blink: 0, s: 1, tx: 0, ty: 0, until: 0 }, NTJ = 40, NRJ = 40;
  var noise = function (a, b, c) { return Math.sin(a * 1.7 + b * 2.3 + c) * 0.5 + Math.sin(a * 0.9 - b * 1.3 + c * 1.9) * 0.3 + Math.sin(b * 3.1 + c * 0.7) * 0.2; };
  function swim(dt, t, open) {
    J.ph += dt / 5.4; var c = J.ph % 1; J.p = c < 0.28 ? Math.sin(c / 0.28 * Math.PI / 2) : Math.cos((c - 0.28) / 0.72 * Math.PI / 2);
    var S = J.s, lo = TOPH * 0.5, O = J.orbit, far = O || J.back;
    if (O) { J.th += dt * 0.13; J.tx = O.x + Math.cos(J.th) * O.rx; J.ty = O.y + Math.sin(J.th) * O.ry; }
    else if (J.back) { J.tx = VW * 0.5; J.ty = lo; if (J.y < lo + 10) J.back = false; }
    else if (open) { if (t > J.until || Math.hypot(J.tx - J.x, J.ty - J.y) < 40) { J.tx = VW * (0.12 + Math.random() * 0.76); J.ty = TOPH + (CH - TOPH) * (0.12 + Math.random() * 0.6); J.until = t + 16 + Math.random() * 12; } }
    else { J.tx = J.x - 80; J.ty = lo + Math.sin(t * 0.07) * TOPH * 0.12; }
    var want = Math.atan2(J.ty - J.y, J.tx - J.x), d = Math.atan2(Math.sin(want - J.a), Math.cos(want - J.a)); J.a += d * Math.min(1, dt * (far ? 2.4 : open ? 0.7 : 0.3));
    if (c < 0.28) { var th = (far ? 40 : open ? 22 : 11) * S * dt; J.vx += Math.cos(J.a) * th; J.vy += Math.sin(J.a) * th; }
    J.vx *= Math.pow(0.5, dt); J.vy *= Math.pow(0.5, dt); J.vy += 0.5 * dt;
    J.x += J.vx * dt; J.y += J.vy * dt;
    if (far) { J.x = Math.max(-30, Math.min(VW + 30, J.x)); J.y = Math.max(8, Math.min((root.clientHeight || innerHeight) - 20, J.y)); }
    else if (!open) { J.y += (lo - J.y) * Math.min(1, dt * 0.6); if (J.x < -50) { J.x = VW + 50; J.y = lo; } if (J.x > VW + 60) J.x = -40; }
    else { J.x = Math.max(-30, Math.min(VW + 30, J.x)); J.y = Math.max(8, Math.min(CH - 40, J.y)); }
    var ws = (open && !far ? 1.45 : 1) * (VW > 900 ? 1.25 : 1); J.s += (ws - J.s) * Math.min(1, dt * 0.8);
  }
  function drawJelly(g, t) {
    var S = J.s, ink = function (a) { return 'rgba(244,241,232,' + a.toFixed(3) + ')'; };
    var line = function (pts, w, a) { g.strokeStyle = ink(a); g.lineWidth = w; trace(g, pts); g.stroke(); };
    var dot = function (x, y, r, a) { g.fillStyle = ink(a); g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
    var bw = 15 * S, bh = 12.5 * S, p = RM.matches ? 0 : J.p, w = bw * (1 - 0.07 * p) / 2, h = bh * (1 + 0.045 * p), topY = -h * 0.55 + (bh - h) * 0.3, bot = topY + h;
    g.save(); g.translate(J.x, J.y); g.rotate(J.a + Math.PI / 2); g.lineCap = 'round'; g.lineJoin = 'round';
    /* its sideways drift, seen from the bell: the tentacles lean away from it */
    var ca = Math.cos(-(J.a + Math.PI / 2)), sa = Math.sin(-(J.a + Math.PI / 2)), lvx = J.vx * ca - J.vy * sa, lvy = J.vx * sa + J.vy * ca;
    var TL = bh * (S > 1.2 ? 4.6 : 3.4), ts = RM.matches ? 0 : t * 0.6, ph = J.ph * Math.PI * 2;
    for (var i = 0; i < 4; i++) {
      var rx = (i - 1.5) / 1.5 * w * 0.82, pts = [];
      for (var j = 0; j < NTJ; j++) { var s = j / (NTJ - 1), env = Math.min(1, j / 4);
        /* alive: a slow wave runs down each one, a drift of its own, and every stroke of the bell sends a ripple after it */
        var x = rx + (i - 1.5) * s * TL * 0.05 + (noise(i * 3.3, s * 2.2, ts * 0.8) * bh * 0.65 + Math.sin(s * (6 + i) - ts * 2.6 + i * 1.7) * bh * 0.3 + Math.sin(ph - s * 4.5 + i) * bh * 0.16) * s * env - lvx * 0.5 * s * s * S;
        var y = bot - 1 + s * TL * (1 - Math.min(0.25, Math.abs(lvy) * 0.01)) * (1 - 0.07 * p * (1 - s * 0.6)) + noise(i * 7.1, s * 3, ts * 0.6) * bh * 0.22 * s;
        pts.push([x, y]); }
      var far = i === 1 || i === 2;
      line(pts, 0.8, far ? 0.4 : 0.55); line(pts.map(function (q) { return [q[0] + 1.3, q[1] - 0.8]; }).slice(0, NTJ - 6), 0.3, 0.16);
      /* the beads of stinging cells: only the first fifth, below the bell */
      for (var b = 1; b < NTJ * 0.2; b++) dot(pts[b][0], pts[b][1], b % 3 === 0 ? 1.15 * Math.sqrt(S) : 0.75 * Math.sqrt(S), 0.32 + 0.22 * Math.sin(t * 1.4 - b * 0.5 + i));
    }
    /* the bell: the arch of the first drawing, its lip nearly straight */
    var B = [];
    for (var k = 0; k < NRJ; k++) { var u = k / NRJ, X, Y; if (u < 0.8) { var an = Math.PI * (1 - u / 0.8), cu = Math.cos(an), su = Math.sin(an); X = Math.pow(Math.abs(cu), 0.55) * (cu < 0 ? -1 : 1) * w; Y = bot - Math.pow(su, 0.42) * h * (0.94 + 0.06 * su); } else { var q2 = (u - 0.8) / 0.2; X = w - 2 * w * q2; Y = bot - Math.sin(q2 * Math.PI) * h * 0.09; } B.push([X, Y]); }
    B.push(B[0]); g.fillStyle = 'rgba(244,241,232,.06)'; trace(g, B); g.fill();
    line(B, 1.1 * Math.sqrt(S), 0.92); line(B.map(function (q) { return [q[0] + 1, q[1] + 0.7]; }), 0.35, 0.22);
    /* the eye, faint, in dots: it sees everything, and blinks */
    var bk = J.blink > 0 ? 0.08 : Math.min(1, Math.abs(((t + 2.2) % 8.3) - 0.14) / 0.14), eh = h * 0.27 * Math.max(0.08, bk), ew = w * 0.74, ey = topY + h * 0.52;
    for (var e = 0; e < 26; e++) { var ue = e / 26 * Math.PI * 2, ce = Math.cos(ue), se = Math.sin(ue); dot(ce * ew, ey + se * eh * (0.35 + 0.65 * Math.abs(se)), 0.6 * Math.sqrt(S), 0.34); }
    var pr = h * 0.25 * Math.max(0.08, bk); g.strokeStyle = ink(0.3); g.lineWidth = 0.5; g.beginPath(); g.arc(0, ey, pr, 0, 7); g.stroke(); dot(0, ey, pr * 0.42, 0.38);
    [-0.62, -0.22, 0.22, 0.62].forEach(function (f) { dot(f * w, bot - bh * 0.1, 0.9 * Math.sqrt(S), 0.8); });
    g.restore();
  }
  function bellHit(cx, cy) { var r = tcv.getBoundingClientRect(); return Math.hypot(cx - r.left - J.x, cy - r.top - J.y) < 20 * J.s; }
  /* the eye: the fog horn. Held: a quick photograph, printed */
  var hold = null, held = false;
  top.addEventListener('pointerdown', function (e) { if (e.target.closest('nav')) return; held = false; if (bellHit(e.clientX, e.clientY)) hold = setTimeout(function () { held = true; hold = null; J.blink = 0.4; quickPrint(); }, 650);
    else if (root.classList.contains('reef')) { var p = pt(e); PT.x = p[0]; PT.y = p[1]; RIP.push({ x: p[0], y: p[1], r: 2, a: 0.8 }); beep(180 + Math.random() * 120, 0.08); } });
  top.addEventListener('pointerup', function () { if (hold) { clearTimeout(hold); hold = null; } });
  top.addEventListener('pointerleave', function () { if (hold) { clearTimeout(hold); hold = null; } PT.x = PT.y = -999; });
  top.addEventListener('click', function (e) { if (e.target.closest('nav')) return; if (held) { held = false; return; }
    if (bellHit(e.clientX, e.clientY)) { J.blink = 0.25; horn(); J.vx += Math.cos(J.a) * 6; J.vy += Math.sin(J.a) * 6; return; }
    if (away) { history.back(); return; } if (!root.classList.contains('reef')) reef(true); });
  $('#hm-theme').addEventListener('click', function (e) { e.stopPropagation(); setNight(!NIGHT); });
  $('#hm-snork').addEventListener('click', function (e) { e.stopPropagation(); reef(false); });

  /* ───────── the reef: the forms rounded and lit, in their own colours; the life on it in white line, alive to a touch ───────── */
  var RB = null, PT = { x: -999, y: -999, vx: 0, vy: 0 };
  var FISH = [], SNOW = [], WORMS = [], SNAKE = { x: -120, y: 0, t: 0 }, SLUG = { u: 0.15, gill: 1 }, RIP = [], STAR = null;
  function reef(on) { root.classList.toggle('reef', on); top.setAttribute('aria-expanded', String(on)); $('#hm-snork').hidden = !on; if (on) { beep(220, 0.12); J.until = 0; } else beep(330, 0.08); }
  function reefBuild() {
    var w = VW, h = CH, y0 = TOPH, rh = h - y0; RB = D.createElement('canvas'); RB.width = tcv.width; RB.height = tcv.height; var g = RB.getContext('2d'), r = rnd(77), sea = y0 + rh * 0.86, s = Math.min(w, rh);
    g.scale(dpr, dpr);
    /* light from above: a few soft shafts */
    g.save(); g.globalCompositeOperation = 'lighter'; for (var k = 0; k < 5; k++) { var x0 = w * (0.1 + r() * 0.8); g.fillStyle = 'rgba(160,200,255,' + (NIGHT ? 0.025 : 0.05) + ')'; g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + 40, 0); g.lineTo(x0 + 160 + r() * 80, h); g.lineTo(x0 + 60, h); g.closePath(); g.fill(); } g.restore();
    /* the floor: sand in a few soft bands */
    g.fillStyle = NIGHT ? 'rgba(20,34,56,.9)' : 'rgba(214,200,170,.92)'; g.beginPath(); g.moveTo(0, sea); for (var x = 0; x <= w; x += 12) g.lineTo(x, sea + Math.sin(x * 0.02) * 4 + (r() - 0.5) * 3); g.lineTo(w, h); g.lineTo(0, h); g.closePath(); g.fill();
    grain(g, w, h, Math.round(w * rh / 30), NIGHT ? 'rgba(255,255,255,.06)' : 'rgba(80,60,30,.18)', 78);
    /* the forms, back to front */
    disc(g, w * 0.5, sea + 4, s * 0.16, '#3A63C8');
    fan(g, w * 0.18, sea + 6, s * 0.62, '#F7B58C', 79); fan(g, w * 0.86, sea + 8, s * 0.46, '#F4A07C', 80); disc(g, w * 0.78, sea + 2, s * 0.08, '#E9C46A');
    chrome(g, w * 0.36, sea - s * 0.02, s * 0.12, 0.2);
    honey(g, w * 0.66, sea - s * 0.04, s * 0.11, 81);
    glass(g, w * 0.58, sea - s * 0.16, s * 0.1, '#F2C230', 82);
    /* the white-line life sits on the forms */
    WORMS = []; for (var wi = 0; wi < 5; wi++) WORMS.push({ x: w * 0.58 + (wi - 2) * s * 0.035, y: sea - s * 0.24 - Math.abs(wi - 2) * -s * 0.01, out: 1 });
    STAR = { x: w * 0.3, y: sea + 18 };
    FISH = []; for (var fi = 0; fi < 9; fi++) FISH.push({ x: r() * w, y: y0 + rh * (0.15 + r() * 0.45), a: r() < 0.5 ? 0 : Math.PI, v: 14 + r() * 10, s: 0.7 + r() * 0.6, w: r() * 6 });
    SNOW = []; for (var si2 = 0; si2 < 90; si2++) SNOW.push({ x: r() * w, y: y0 + r() * rh, vx: 0, vy: 4 + r() * 6, r: 0.4 + r() * 1 });
    SNAKE.y = y0 + rh * 0.45; SLUG.sea = sea; SLUG.w = w;
  }
  function drawReef(dt, t) {
    var g = tx, w = VW, h = CH, y0 = TOPH; g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(RB, 0, 0); g.restore();
    g.lineCap = 'round'; g.lineJoin = 'round'; PT.vx *= 0.9; PT.vy *= 0.9; var near = function (x, y, d) { return Math.hypot(x - PT.x, y - PT.y) < d; };
    g.fillStyle = 'rgba(244,241,232,.55)'; SNOW.forEach(function (s) { var dx = s.x - PT.x, dy = s.y - PT.y, d = Math.hypot(dx, dy); if (d < 90) { s.vx += PT.vx * 0.02 + dx / d * 0.6; s.vy += PT.vy * 0.02 + dy / d * 0.6; } s.vx *= 0.96; s.vy += (5 - s.vy) * 0.02; s.x += s.vx * dt; s.y += s.vy * dt; if (s.y > h) { s.y = y0 - 10; s.x = Math.random() * w; } if (s.x < 0) s.x += w; if (s.x > w) s.x -= w; g.beginPath(); g.arc(s.x, s.y, s.r, 0, 7); g.fill(); });
    g.strokeStyle = 'rgba(244,241,232,.92)'; g.lineWidth = 1.1;
    WORMS.forEach(function (o) { var want = near(o.x, o.y, 70) ? 0 : 1; o.out += (want - o.out) * (want ? 0.02 : 0.25); if (o.out < 0.05) return; g.beginPath(); for (var i = 0; i < 6; i++) { var yy = o.y - i * 3.2 * o.out, ww = (6 - i) * 1.3 * o.out; g.moveTo(o.x - ww, yy); g.lineTo(o.x + ww, yy - 2 * o.out); } g.stroke(); });
    if (STAR) { g.beginPath(); for (var s2 = 0; s2 <= 10; s2++) { var an = s2 / 10 * Math.PI * 2 - Math.PI / 2 + Math.sin(t * 0.2) * 0.05, rr = s2 % 2 ? 4 : 11; g[s2 ? 'lineTo' : 'moveTo'](STAR.x + Math.cos(an) * rr, STAR.y + Math.sin(an) * rr); } g.closePath(); g.stroke(); }
    FISH.forEach(function (f) { if (near(f.x, f.y, 100)) { var aw = Math.atan2(f.y - PT.y, f.x - PT.x); f.a += Math.atan2(Math.sin(aw - f.a), Math.cos(aw - f.a)) * 0.2; f.v = Math.min(80, f.v + 6); } else { f.v += (16 - f.v) * 0.02; f.a += Math.sin(t * 0.7 + f.w) * 0.004; }
      if (f.y < y0 + 20) f.a += 0.05; if (f.y > y0 + (h - y0) * 0.62) f.a -= 0.05; f.x += Math.cos(f.a) * f.v * dt; f.y += Math.sin(f.a) * f.v * dt * 0.5; if (f.x < -20) f.x = w + 20; if (f.x > w + 20) f.x = -20;
      g.save(); g.translate(f.x, f.y); g.rotate(f.a); g.scale(f.s, f.s); var wag = Math.sin(t * 9 + f.w) * 2.5; g.beginPath(); g.moveTo(9, 0); g.quadraticCurveTo(0, -5, -8, 0); g.quadraticCurveTo(0, 5, 9, 0); g.moveTo(-8, 0); g.lineTo(-14, -4 + wag); g.lineTo(-13, 4 + wag); g.lineTo(-8, 0); g.stroke(); g.beginPath(); g.arc(5, -1, 0.9, 0, 7); g.fillStyle = INK; g.fill(); g.restore(); });
    SNAKE.t += dt; SNAKE.x += dt * 16; if (SNAKE.x > w + 200) SNAKE.x = -200; var sy0 = SNAKE.y + Math.sin(SNAKE.t * 0.3) * 20;
    g.lineWidth = 2.2; for (var b = 0; b < 22; b++) { var x0 = SNAKE.x - b * 6, yA = sy0 + Math.sin(SNAKE.t * 3 - b * 0.45) * 6, x1 = x0 - 6, y1 = sy0 + Math.sin(SNAKE.t * 3 - (b + 1) * 0.45) * 6; g.globalAlpha = b % 2 ? 0.95 : 0.35; g.beginPath(); g.moveTo(x0, yA); g.lineTo(x1, y1); g.stroke(); } g.globalAlpha = 1; g.lineWidth = 1.1;
    if (SLUG.sea) { SLUG.u += dt * 0.004; if (SLUG.u > 0.95) SLUG.u = 0.05; var ux = SLUG.u * SLUG.w, uy = SLUG.sea + 8; SLUG.gill += ((near(ux, uy, 60) ? 0 : 1) - SLUG.gill) * 0.1;
      g.beginPath(); g.ellipse(ux, uy, 10, 3.2, 0, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(ux + 8, uy - 2); g.lineTo(ux + 11, uy - 7); g.moveTo(ux + 6, uy - 2); g.lineTo(ux + 7, uy - 7); for (var gi = 0; gi < 4; gi++) { g.moveTo(ux - 6, uy - 2); g.lineTo(ux - 6 + Math.cos(-2 - gi * 0.35) * 6 * SLUG.gill, uy - 2 + Math.sin(-2 - gi * 0.35) * 6 * SLUG.gill); } g.stroke(); }
    RIP = RIP.filter(function (q) { q.r += dt * 120; q.a -= dt * 1.4; if (q.a <= 0) return false; g.globalAlpha = q.a; g.beginPath(); g.arc(q.x, q.y, q.r, 0, 7); g.stroke(); g.globalAlpha = 1; return true; });
  }
  var pt = function (e) { var r = tcv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  top.addEventListener('pointermove', function (e) { if (!root.classList.contains('reef')) return; var p = pt(e); PT.vx = (p[0] - PT.x) * 2; PT.vy = (p[1] - PT.y) * 2; PT.x = p[0]; PT.y = p[1]; });

  /* ───────── the switchboard: one jack to each thing, each by its own mark; the starting ones lit, the rest dark holes until found ───────── */
  var G = function (s) { return s; };
  var SLOTS = [
    /* the starting eight */
    ['portfolio', 'PORTFOLIO', 1, G('<path d="M6 2.5h12v19l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4z"/><path d="M8.5 7h7M8.5 10h7M8.5 13h4"/>')],
    ['wish', 'I W.I.S.H.', 1, G('<path d="M2 12h20"/><circle cx="5.5" cy="12" r="1.9" class="f"/><circle cx="10" cy="12" r="1.9" class="f"/><circle cx="14.5" cy="12" r="1.9" class="f"/><circle cx="19" cy="12" r="1.9" class="f"/>')],
    ['radio', 'DIRECT ACTION RADIO', 1, G('<path d="M12 21a9 9 0 1 1 9-9"/><path d="M12 12l6.4-6.4"/><circle cx="12" cy="12" r="1.6" class="f"/><circle cx="7" cy="15" r=".9" class="f"/>')],
    ['zine', 'DESIGN AND PRINT', 1, G('<path d="M9 2h6v20H9z"/><path d="M9 15l2-4 1.3 2 1.2-3.5L15 13"/>')],
    ['research', 'RESEARCH BOARD', 1, G('<path d="M3 4h7v5H3zM14 4h7v8h-7zM3 14h8v6H3z"/><path d="M10 6.5h4M7 9v5M17.5 12v5h-6.5"/><circle cx="17.5" cy="17" r="1.3" class="f"/>')],
    ['kit', 'ISLAND KIT', 1, G('<path d="M3 7h18v11H3z"/><path d="M6 10h4v4H6z"/><path d="M13 10h5M13 13h5" stroke-dasharray="1 1.6"/><circle cx="5" cy="16.3" r=".7" class="f"/><circle cx="19" cy="16.3" r=".7" class="f"/>')],
    ['space', 'ARCHIPELAGOS ENGINE', 1, G('<path d="M4.5 9.5c0-2 1.6-3 3.2-2.6 1.4.4 1.8 2.2.8 3.3-1.2 1.2-4 .9-4-.7zM14 6.5c.6-1.6 3.2-1.8 4-.3.7 1.3-.5 2.6-2 2.5-1.3 0-2.4-1-2-2.2zM12.5 17c.2-2.4 3.6-3 5-1.4 1.3 1.6-.4 3.8-2.6 3.6-1.5-.1-2.5-1-2.4-2.2z"/><path d="M8.8 10.5l4.6 5M11 8.6l3-1.2" stroke-dasharray=".2 2"/>')],
    ['reef', 'THE REEF', 1, G('<path d="M12 22V13M12 16l-4-5V7M12 14l4-4V5M8 11l-2.5-2"/><path d="M3 22h18"/>')],
    ['eye', 'THE EYE', 1, G('<path d="M2.5 12C6 7 9 5.5 12 5.5S18 7 21.5 12C18 17 15 18.5 12 18.5S6 17 2.5 12z"/><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="1.1" class="f"/>')],
    /* found by doing: each lights the first time it is done here */
    ['moon', 'THE MOON', 0, G('<path d="M15 3.5a8.5 8.5 0 1 0 5.5 14A7 7 0 0 1 15 3.5z"/>')],
    ['stamp', 'A PRINT MADE', 0, G('<path d="M5 4h14v16H5z" stroke-dasharray="1.2 1.4"/><path d="M8 8h8v6H8z"/>')],
    ['signal', 'KIN', 0, G('<path d="M4 9c2-2 4-2 6 0s4 2 6 0 4-2 4-2M4 15c2-2 4-2 6 0s4 2 6 0 4-2 4-2" stroke-dasharray=".2 2.2"/>')],
    ['map', 'A BEACON FOLLOWED', 0, G('<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>')],
    ['style', 'A MOTION CHOSEN', 0, G('<path d="M4 4h10v10H4z"/><path d="M10 10h10v10H10z"/>')],
    ['booth', 'A PHOTO HELD', 0, G('<circle cx="12" cy="12" r="8"/><path d="M12 4l3 6M20 12l-6 1M14 19l-3-5M5 16l5-3M5 7l4 4"/>')],
    ['folio', 'A SONG KEPT', 0, G('<path d="M6 3h11v15H6z"/><path d="M8.5 20.5h11v-15" />')]
  ];
  /* the third row: islands, each found by a code from its print or a visit; their marks are islands of their own shape */
  for (var si3 = 0; si3 < 7; si3++) (function (n) { var r = rnd(90 + n), pts = []; for (var q = 0; q < 9; q++) { var an = q / 9 * Math.PI * 2, rr = 5 + r() * 3.5; pts.push((12 + Math.cos(an) * rr).toFixed(1) + ' ' + (12 + Math.sin(an) * rr * 0.8).toFixed(1)); }
    SLOTS.push(['isle' + n, 'AN ISLAND', 0, '<path d="M' + pts.join('L') + 'Z"/>' + '<circle cx="12" cy="12" r="1" class="f"/>']); })(si3);
  var FOUND = store.get('da.sb.found', []) || [], jk = null;
  function found(id) { var s = SLOTS.filter(function (q) { return q[0] === id; })[0]; return !!s && (s[2] === 1 || FOUND.indexOf(id) >= 0); }
  function find(id) { if (found(id) || !SLOTS.some(function (q) { return q[0] === id; })) return; FOUND.push(id); store.set('da.sb.found', FOUND); if (jk) { buildJacks(); board(); var sl = jk.querySelector('[data-s="' + id + '"]'); if (sl) { sl.classList.add('new'); setTimeout(function () { sl.classList.remove('new'); }, 2400); } } beep(784, 0.08); setTimeout(function () { beep(1175, 0.1); }, 110); }
  /* what is found already, from what this phone has done */
  (function () { var h = new Date().getHours(); if (h >= 19 || h < 6) FOUND.indexOf('moon') < 0 && FOUND.push('moon'); if (store.get('da.aura.printed', 0)) FOUND.indexOf('stamp') < 0 && FOUND.push('stamp'); if ((store.get('da.kin', []) || []).length) FOUND.indexOf('signal') < 0 && FOUND.push('signal'); if ((store.get('da.aura.songs', []) || []).length) FOUND.indexOf('folio') < 0 && FOUND.push('folio'); store.set('da.sb.found', FOUND); })();

  /* ports: outs, ins and the outcome of each in */
  var PORTS = {
    wish: { outs: ['WORDS', 'CODE'], ins: { PICTURE: 'PHOTO ON THE SLIP', SOUND: 'SONG CODE ON THE SLIP', LIST: 'NEXT STEP AT ITS FOOT', LENGTH: 'PRINTS LONG' } },
    radio: { outs: ['SOUND', 'CODE'], ins: { WORDS: 'WORDS ON THE TAPE', PICTURE: 'COVER ON THE TAPE' } },
    zine: { outs: ['LENGTH', 'PICTURE'], ins: { WORDS: 'WORDS ON THE ZINE', PICTURE: 'PHOTO IN THE ZINE', CODE: 'QR ON THE ZINE' } },
    kit: { outs: ['LIST'], ins: { CODE: 'ISLAND CODE ON THE LIST' } },
    space: { outs: ['WORDS', 'CODE'], ins: { PICTURE: 'PICTURE ON ITS CARD', LIST: 'BUILD LIST IN THE PANEL' } },
    reef: { outs: ['PICTURE'], ins: { SOUND: 'THE REEF PLAYS IT' } },
    portfolio: { outs: ['PICTURE', 'CODE'], ins: { PICTURE: 'KEPT IN THE PORTFOLIO', SOUND: 'SONG KEPT WITH IT' } },
    research: { outs: ['LIST', 'PICTURE'], ins: { WORDS: 'PINNED AS A BLOCK', CODE: 'THE W.I.S.H. FORM BEHIND IT', PICTURE: 'PINNED AS A PICTURE' } },
    eye: { outs: ['PICTURE', 'SOUND'], ins: { WORDS: 'WORDS UNDER THE PHOTO', PICTURE: 'PHOTO HELD' } },
    moon: { outs: ['PICTURE'], ins: {} }, stamp: { outs: ['CODE'], ins: {} }, signal: { outs: ['WORDS'], ins: { CODE: 'CODE SENT TO KIN' } },
    map: { outs: ['CODE'], ins: { WORDS: 'WORDS ON THE MAP' } }, style: { outs: ['LENGTH'], ins: {} }, booth: { outs: ['PICTURE'], ins: {} }, folio: { outs: ['SOUND'], ins: {} }
  };
  for (var pi = 0; pi < 7; pi++) PORTS['isle' + pi] = { outs: ['CODE'], ins: { WORDS: 'PRINTS ON THAT ISLAND', PICTURE: 'PRINTS ON THAT ISLAND' } };
  var SHORT = { portfolio: 'PORTFOLIO', wish: 'W.I.S.H.', radio: 'RADIO', zine: 'DESIGN', kit: 'ISLAND', space: 'ENGINE', reef: 'REEF', eye: 'EYE', moon: 'MOON', stamp: 'PRINT', signal: 'KIN', map: 'MAP', style: 'MOTION', booth: 'PHOTO', folio: 'SONG' };
  var GETS = { WORDS: 'WORDS', PICTURE: 'PHOTO', SOUND: 'SONG', CODE: 'QR', LIST: 'LIST', LENGTH: 'LONG' };
  /* the owner's own words for the switchboard, set in settings */
  function sbWords() { var o = store.get('da.sb.words', {}) || {}; Object.keys(o).forEach(function (k) { var p = k.split('.'); if (p[0] === 'n' && PORTS[p[1]]) SHORT[p[1]] = o[k]; else if (p[0] === 'i' && PORTS[p[1]] && PORTS[p[1]].ins[p[2]] != null) PORTS[p[1]].ins[p[2]] = o[k]; }); }
  sbWords();
  function carry(a, b) { var A = PORTS[a], B = PORTS[b]; if (!A || !B || a === b) return []; return A.outs.filter(function (e) { return !!B.ins[e]; }); }
  function fits(a, b) { return carry(a, b).length > 0 || carry(b, a).length > 0; }

  /* OKLab mix */
  function lin(v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  function gam(v) { v = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055; return Math.round(Math.max(0, Math.min(1, v)) * 255); }
  function toLab(hex) { var n = parseInt(hex.slice(1), 16), r = lin(n >> 16 & 255), g = lin(n >> 8 & 255), b = lin(n & 255);
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s]; }
  function fromLab(L) { var l = Math.pow(L[0] + 0.3963377774 * L[1] + 0.2158037573 * L[2], 3), m = Math.pow(L[0] - 0.1055613458 * L[1] - 0.0638541728 * L[2], 3), s = Math.pow(L[0] - 0.0894841775 * L[1] - 1.2914855480 * L[2], 3);
    var r = gam(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), g = gam(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), b = gam(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase(); }
  function mix(a, b, t) { var A = toLab(a), B = toLab(b), k = t == null ? 0.5 : t; return fromLab([0, 1, 2].map(function (i) { return A[i] + (B[i] - A[i]) * k; })); }

  /* wires: four */
  var START = [['radio', 'wish']], MAXW = 4;
  var WIRES = store.get('da.sb.v2', null);
  if (!WIRES) { var old = store.get('da.sb.v1', null); WIRES = old ? old.map(function (w) { return w.map(function (x) { x = String(x).split('.')[0]; return x === 'iruk' ? 'eye' : x; }); }).filter(function (w) { return w[0] !== w[1]; }) : START.slice(); }
  WIRES = WIRES.filter(function (w) { return w && found(w[0]) && found(w[1]) && fits(w[0], w[1]); }).slice(-MAXW);
  var sb = $('#hm-sb'); jk = sb.querySelector('.jk'); var oc = sb.querySelector('.oc');
  var SC = { portfolio: '#6FA8FF', wish: '#3D7BE0', radio: '#FF6B1A', zine: '#FF5436', research: '#D9F24A', kit: '#FFB000', space: '#F59878', reef: '#4FC3F7', eye: '#F4F1E8', moon: '#E9E4FF', stamp: '#FF8A5B', signal: '#5CE07A', map: '#FFD84D', style: '#FF6FB5', booth: '#9AE6FF', folio: '#C9F27C' };
  SLOTS.forEach(function (s, n) { if (!SC[s[0]]) SC[s[0]] = ['#FF6FB5', '#9AE6FF', '#FFD84D', '#7CF2B0', '#FF8A5B', '#B9B2F6', '#4FC3F7'][n % 7]; });
  var nameOf = function (id) { return SHORT[id] || (SLOTS.filter(function (q) { return q[0] === id; })[0] || [0, String(id).toUpperCase()])[1]; };
  var wireCol = function (w) { return mix(SC[w[0]], SC[w[1]]); };
  /* found jacks only */
  function buildJacks() {
    jk.innerHTML = SLOTS.filter(function (s) { return found(s[0]); }).map(function (s) { return '<div class="sl" style="--sc:' + SC[s[0]] + '" data-s="' + s[0] + '" data-n="' + s[1] + '" title="' + s[1] + '"><span class="g" aria-hidden="true"><svg viewBox="0 0 24 24">' + s[3] + '</svg><i class="led"></i></span><button class="j" data-j="' + s[0] + '" aria-label="' + s[1] + '"></button></div>'; }).join('');
  }
  buildJacks();
  var cab = sb.querySelector('canvas.cab'), cg = cab.getContext('2d'), ckr = 1;
  function cabSize() { ckr = Math.min(2, devicePixelRatio || 1); cab.width = Math.round(sb.clientWidth * ckr); cab.height = Math.round(sb.clientHeight * ckr); }
  function saveWires() { store.set('da.sb.v2', WIRES); }
  function wired(a, b) { return WIRES.some(function (w) { return (w[0] === a && w[1] === b) || (w[0] === b && w[1] === a); }); }
  function jpos(id) { var j = jk.querySelector('[data-j="' + id + '"]'); if (!j) return null; var r = j.getBoundingClientRect(), o = sb.getBoundingClientRect(); return [r.left + r.width / 2 - o.left, r.top + r.height / 2 - o.top]; }
  /* a cable as a tentacle */
  function tentacle(a, b, ca, cb, t, seed, alpha) {
    var A0 = alpha == null ? 0.95 : alpha, d = Math.hypot(b[0] - a[0], b[1] - a[1]), s = 18 + d * 0.28, P = [a, [a[0], a[1] + s], [b[0], b[1] + s], b], N = 30, pts = [];
    for (var k = 0; k <= N; k++) { var u = k / N, v = 1 - u, c = [v * v * v, 3 * v * v * u, 3 * v * u * u, u * u * u], x = 0, y = 0; for (var q = 0; q < 4; q++) { x += c[q] * P[q][0]; y += c[q] * P[q][1]; }
      var env = Math.sin(u * Math.PI), wv = RM.matches ? 0 : (Math.sin(u * 7 - t * 1.4 + seed) * 2.4 + noise(seed, u * 2, t * 0.5) * 2) * env; pts.push([x + wv * 0.6, y + wv]); }
    var gr = cg.createLinearGradient(a[0], a[1], b[0] + 0.01, b[1]); [0, 0.25, 0.5, 0.75, 1].forEach(function (k) { gr.addColorStop(k, k === 0 ? ca : k === 1 ? cb : mix(ca, cb, k)); });
    cg.lineCap = 'round'; cg.lineJoin = 'round'; cg.strokeStyle = gr; cg.globalAlpha = A0; cg.lineWidth = 2.6; trace(cg, pts); cg.stroke();
    cg.globalAlpha = A0 * 0.35; cg.lineWidth = 0.7; trace(cg, pts.map(function (p) { return [p[0] + 1.6, p[1] - 1]; })); cg.stroke();
    cg.fillStyle = gr; for (var e = 1; e < N * 0.2; e++) [e, N - e].forEach(function (i, side) { cg.globalAlpha = A0 * (0.45 + 0.35 * Math.sin(t * 1.4 - e * 0.5 + side + seed)); cg.beginPath(); cg.arc(pts[i][0], pts[i][1], e % 3 === 0 ? 1.7 : 1.15, 0, 7); cg.fill(); });
    cg.globalAlpha = A0; [[a, ca], [b, cb]].forEach(function (p) { cg.fillStyle = p[1]; cg.beginPath(); cg.arc(p[0][0], p[0][1], 4, 0, 7); cg.fill(); }); cg.globalAlpha = 1;
  }
  var LOOSE = null;
  function drawCables(t) {
    if (t == null) t = performance.now() / 1000; if (cab.width !== Math.round(sb.clientWidth * ckr) || cab.height !== Math.round(sb.clientHeight * ckr)) cabSize();
    cg.setTransform(1, 0, 0, 1, 0, 0); cg.clearRect(0, 0, cab.width, cab.height); cg.setTransform(ckr, 0, 0, ckr, 0, 0);
    WIRES.forEach(function (w, i) { var a = jpos(w[0]), b = jpos(w[1]); if (a && b) tentacle(a, b, SC[w[0]], SC[w[1]], t, i * 2.1 + 1); });
    if (LOOSE) { var a = jpos(LOOSE.from), to = LOOSE.to ? jpos(LOOSE.to) : null; if (a) tentacle(a, to || [LOOSE.x, LOOSE.y], SC[LOOSE.from], to ? SC[LOOSE.to] : INK, t, 9, LOOSE.fall != null ? Math.max(0, LOOSE.fall) : 0.9); }
  }
  /* outcomes, stacks, board, lamps */
  function outcomes() {
    var out = []; WIRES.forEach(function (w) { [[w[0], w[1]], [w[1], w[0]]].forEach(function (d) { carry(d[0], d[1]).forEach(function (e) { out.push({ from: d[0], to: d[1], el: e, line: PORTS[d[1]].ins[e], col: wireCol(w) }); }); }); });
    return out; }
  function stacks() { var g = []; WIRES.forEach(function (w) { var hit = g.filter(function (s) { return s.ids.indexOf(w[0]) >= 0 || s.ids.indexOf(w[1]) >= 0; }), s = hit[0];
      if (!s) { s = { ids: [], wires: [] }; g.push(s); } hit.slice(1).forEach(function (o) { o.ids.forEach(function (x) { if (s.ids.indexOf(x) < 0) s.ids.push(x); }); s.wires = s.wires.concat(o.wires); g.splice(g.indexOf(o), 1); });
      [w[0], w[1]].forEach(function (x) { if (s.ids.indexOf(x) < 0) s.ids.push(x); }); s.wires.push(w); });
    return g; }
  function board() {
    $$('.sl', jk).forEach(function (sl) { var id = sl.dataset.s, ws = WIRES.filter(function (w) { return w[0] === id || w[1] === id; }); sl.classList.toggle('on', ws.length > 0); sl.style.setProperty('--mx', ws.length ? wireCol(ws[ws.length - 1]) : SC[id]); });
    var cb = sb.querySelector('.cb'); if (cb) cb.innerHTML = [0, 1, 2, 3].map(function (i) { return '<i' + (i < WIRES.length ? ' class="in"' : '') + '></i>'; }).join('');
    var outs = outcomes();
    oc.innerHTML = stacks().map(function (s) { var lines = outs.filter(function (o) { return s.wires.some(function (w) { return (w[0] === o.from && w[1] === o.to) || (w[1] === o.from && w[0] === o.to); }); });
      return '<li style="--mx:' + wireCol(s.wires[0]) + '"><b>' + s.ids.map(nameOf).map(esc).join(' · ') + '</b>' + lines.map(function (o) { return '<span style="--mx:' + o.col + '">' + esc(o.line) + '</span>'; }).join('') + '</li>'; }).join('');
    oc.hidden = !WIRES.length;
    lamps(); drawCables();
  }
  function lamps() {
    var outs = outcomes();
    cards.forEach(function (el) { var id = el.dataset.id, l = el.querySelector('.hm-lamps'), ws = WIRES.filter(function (w) { return w[0] === id || w[1] === id; });
      el.classList.toggle('wired', ws.length > 0); if (ws.length) el.style.setProperty('--mx', wireCol(ws[0])); else el.style.removeProperty('--mx');
      if (!l) return; var got = outs.filter(function (o) { return o.to === id; });
      l.innerHTML = ws.map(function (w) { return '<i style="color:' + wireCol(w) + '"></i>'; }).join('') + got.map(function (o) { return '<b style="--mx:' + o.col + '">+ ' + GETS[o.el] + '</b>'; }).join(''); });
  }
  /* fits lit, the rest dull */
  function fitsShow(from) { $$('.sl', jk).forEach(function (q) { var id = q.dataset.s; q.classList.toggle('ok', !!from && id !== from && fits(from, id)); q.classList.toggle('dl', !!from && id !== from && !fits(from, id)); }); }
  /* a preview of what a cable would do, while it is held over a jack */
  var pv = D.createElement('p'); pv.className = 'pv'; pv.hidden = true; pv.setAttribute('aria-live', 'polite'); sb.appendChild(pv);
  function preview(from, to) { if (!from) { pv.hidden = true; return; } var lines = [];
    if (to && to !== from) { carry(from, to).forEach(function (e) { lines.push(nameOf(to) + ' GETS ' + PORTS[to].ins[e]); }); carry(to, from).forEach(function (e) { lines.push(nameOf(from) + ' GETS ' + PORTS[from].ins[e]); }); if (!lines.length) lines.push(nameOf(from) + ' AND ' + nameOf(to) + ' DO NOT JOIN'); else if (wired(from, to)) lines.push('JOINED ALREADY'); }
    else { var P0 = PORTS[from] || { outs: [], ins: {} }; lines.push(nameOf(from) + ' GIVES ' + P0.outs.map(function (e) { return GETS[e]; }).join(', ')); }
    pv.style.setProperty('--mx', to ? mix(SC[from], SC[to] || INK) : SC[from]); pv.innerHTML = lines.map(esc).join('<br>'); pv.hidden = false; }
  jk.addEventListener('pointerover', function (e) { if (drag || e.pointerType !== 'mouse' || sb.classList.contains('low')) return; var sl = e.target.closest('.sl'); preview(sl ? sl.dataset.s : null); });
  jk.addEventListener('pointerleave', function () { if (!drag) preview(null); });
  var drag = null, showT = 0;
  jk.addEventListener('pointerdown', function (e) { var j = e.target.closest('.j'); if (!j) return; e.preventDefault(); ac(); if (sb.classList.contains('low')) { rise(); return; }
    clearTimeout(showT); drag = { from: j.dataset.j, x: e.clientX, y: e.clientY, moved: false }; try { j.setPointerCapture(e.pointerId); } catch (x) { /* none */ } j.parentNode.classList.add('hot'); fitsShow(drag.from); preview(drag.from); beep(330, 0.04); });
  jk.addEventListener('pointermove', function (e) { if (!drag) return; if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6) drag.moved = true; if (!drag.moved) return;
    var o = sb.getBoundingClientRect(), over = D.elementFromPoint(e.clientX, e.clientY), osl = over && over.closest && over.closest('.sl'), to = osl && osl.dataset.s !== drag.from && fits(drag.from, osl.dataset.s) ? osl.dataset.s : null;
    LOOSE = { from: drag.from, x: e.clientX - o.left, y: e.clientY - o.top, to: to }; preview(drag.from, osl ? osl.dataset.s : null); $$('.sl', jk).forEach(function (q) { q.classList.toggle('hot', q.dataset.s === drag.from || q.dataset.s === to); }); });
  function up(e) { if (!drag) return; var from = drag.from, moved = drag.moved; drag = null; preview(null); $$('.sl', jk).forEach(function (q) { q.classList.remove('hot'); }); idleSoon();
    if (!moved) { LOOSE = null; var at = -1; WIRES.forEach(function (w, i) { if (w[0] === from || w[1] === from) at = i; });
      if (at >= 0) { WIRES.splice(at, 1); saveWires(); fitsShow(null); board(); beep(196, 0.1); } else { say(from); showT = setTimeout(function () { fitsShow(null); }, 1800); } return; }
    fitsShow(null); var t = D.elementFromPoint(e.clientX, e.clientY), sl = t && t.closest && t.closest('.sl'), to = sl && sl.dataset.s;
    if (to && to !== from && fits(from, to) && !wired(from, to) && WIRES.length >= MAXW) { sb.classList.remove('full'); void sb.offsetWidth; sb.classList.add('full'); to = null; }
    if (!to || to === from || !fits(from, to)) { if (to && to !== from) spark(to); var o = sb.getBoundingClientRect(), f0 = performance.now(); LOOSE = { from: from, x: e.clientX - o.left, y: o.height + 40, fall: 0.9 };
      (function fade() { if (!LOOSE || LOOSE.fall == null) return; LOOSE.fall = 0.9 - (performance.now() - f0) / 520; if (LOOSE.fall <= 0) LOOSE = null; else requestAnimationFrame(fade); })(); beep(150, 0.12); return; }
    LOOSE = null; if (!wired(from, to)) { WIRES.push([from, to]); saveWires(); } board();
    beep(660, 0.06); setTimeout(function () { beep(880, 0.08); }, 80); }
  jk.addEventListener('pointerup', up); jk.addEventListener('pointercancel', up);
  /* spark */
  function spark(id) { var sl = jk.querySelector('[data-s="' + id + '"]'); if (!sl) return; sl.classList.remove('zap'); void sl.offsetWidth; sl.classList.add('zap'); beep(220 * Math.pow(2, (SLOTS.map(function (c) { return c[0]; }).indexOf(id) % 12) / 12), 0.18); }
  function say(id) { var sl = jk.querySelector('[data-s="' + id + '"]'); if (!sl) return; $$('.sl.say', jk).forEach(function (q) { if (q !== sl) q.classList.remove('say'); }); sl.classList.add('say'); clearTimeout(sl.__t); sl.__t = setTimeout(function () { sl.classList.remove('say'); }, 1800); beep(440, 0.04); }
  /* idle: low */
  var idleT = 0;
  function rise() { clearTimeout(idleT); if (sb.classList.contains('low')) { sb.classList.remove('low'); beep(392, 0.04); } }
  function idleSoon(ms) { clearTimeout(idleT); idleT = setTimeout(function () { if (!drag && !sb.classList.contains('big')) sb.classList.add('low'); }, ms || 3600); }
  sb.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') rise(); });
  sb.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && !drag) idleSoon(1400); });
  sb.addEventListener('pointerdown', function (e) { if (sb.classList.contains('low')) { if (!e.target.closest('.j')) e.preventDefault(); rise(); } idleSoon(); }, true);
  sb.addEventListener('focusin', rise); sb.addEventListener('focusout', function () { idleSoon(); });
  col.addEventListener('scroll', function () { if (!drag && !sb.classList.contains('big')) { clearTimeout(idleT); sb.classList.add('low'); } }, { passive: true });
  sb.querySelector('.grab').addEventListener('click', function () { rise(); sb.classList.toggle('big'); if (!sb.classList.contains('big')) idleSoon(); beep(sb.classList.contains('big') ? 440 : 330, 0.05); });
  sb.querySelector('.rs').addEventListener('click', function () { WIRES = START.slice(); saveWires(); board(); beep(440, 0.08); });
  addEventListener('resize', cabSize);
  cabSize(); board();

  /* ───────── one loop for everything that moves ───────── */
  var last = performance.now(), wasOpen = false;
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now; requestAnimationFrame(frame); if (D.hidden) return;
    if (Math.round((top.clientWidth || innerWidth) * dpr) !== tcv.width || Math.abs(TOPH + reefH() - CH) > 1) seaSize();
    var open = root.classList.contains('reef') && !away, t = now / 1000;
    var jr = tcv.getBoundingClientRect(), rr = root.getBoundingClientRect();
    if (CUR === 'portfolio' && !open && !away && !xv.classList.contains('on')) { var lb = col.querySelector('[data-id="portfolio"] .rc-lbl'), lr = lb && lb.getBoundingClientRect();
      if (lr && lr.width) { var ox = lr.left + lr.width / 2 - jr.left, oy = lr.top + lr.height / 2 - jr.top; if (!J.orbit) { J.th = Math.atan2(J.y - oy, J.x - ox) + 0.5; J.back = false; } J.orbit = { x: ox, y: oy, rx: Math.max(78, lr.width * 0.9), ry: Math.max(52, lr.height * 2.6) }; } }
    else if (J.orbit) { J.orbit = null; J.back = true; }
    if (!RM.matches) swim(dt * (J.orbit ? 5 : J.back ? 4 : 1), t, open); J.blink = Math.max(0, J.blink - dt);
    /* only as much of the sea as shows is cleared and drawn */
    var showH = open || wasOpen ? CH : TOPH + 4 + 60 * J.s; wasOpen = open || top.clientHeight > TOPH + 2;
    tx.setTransform(1, 0, 0, 1, 0, 0); tx.clearRect(0, 0, tcv.width, Math.min(tcv.height, Math.ceil(showH * dpr)));
    tx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (wasOpen) { if (!RB) reefBuild(); drawReef(RM.matches ? 0 : dt, t); }
    var jw = Math.round(rr.width * dpr), jh = Math.round(rr.height * dpr); if (jcv.width !== jw || jcv.height !== jh) { jcv.width = jw; jcv.height = jh; }
    jx.setTransform(1, 0, 0, 1, 0, 0); jx.clearRect(0, 0, jcv.width, jcv.height);
    if (!away) { jx.save(); jx.setTransform(dpr, 0, 0, dpr, (jr.left - rr.left) * dpr, (jr.top - rr.top) * dpr); if (!J.orbit && !J.back) { jx.beginPath(); jx.rect(0, 0, jr.width, jr.height); jx.clip(); } drawJelly(jx, t); jx.restore(); }
    if (WIRES.length || LOOSE) drawCables(RM.matches ? 0 : t);
  }
  seaSize(); requestAnimationFrame(frame);
  receipt(); lastPrint();
  if (/[?&]stories\b/.test(location.search)) { history.replaceState(null, '', location.pathname); setTimeout(function () { open('portfolio'); }, 400); }
  requestAnimationFrame(function () { paintAll(); parallax(); board(); if (window.__LH && /[?&]panel\b/.test(location.search)) { history.replaceState(null, '', location.pathname); open('space'); } });
  window.HOME = { open: open, home: home, wired: wired, find: find, carry: carry, fits: fits, outcomes: outcomes, mix: mix, wires: function () { return WIRES.slice(); }, reef: reef, cards: CARDS, night: setNight, J: J };
})();

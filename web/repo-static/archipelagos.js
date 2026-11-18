/* island archipelagos: three ways in (the hardware, the software, the stories), each sketched by hand as it comes into view */
(function () {
  'use strict';
  var D = document, H = D.documentElement, q = location.search, IN = /[?&]in=1/.test(q);
  var nm = /[?&]night=([01])/.exec(q); H.classList.toggle('night', nm ? nm[1] === '1' : !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches));
  var $ = function (s, r) { return (r || D).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || D).querySelectorAll(s)); };
  var NS = 'http://www.w3.org/2000/svg', GH = 'https://github.com/novelglobal/islandarchipelagos/';
  var store = { get: function (k) { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch (e) { return []; } }, set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private */ } } };

  /* ───────── the sketches, as lines: each a list of strokes, [path, accent?] ───────── */
  function ell(cx, cy, rx, ry) { return 'M' + (cx - rx) + ' ' + cy + ' A' + rx + ' ' + ry + ' 0 1 0 ' + (cx + rx) + ' ' + cy + ' A' + rx + ' ' + ry + ' 0 1 0 ' + (cx - rx) + ' ' + cy; }
  function rect(x, y, w, h) { return 'M' + x + ' ' + y + ' h' + w + ' v' + h + ' h' + (-w) + ' Z'; }
  function poly(p) { return 'M' + p.map(function (a) { return a[0].toFixed(1) + ' ' + a[1].toFixed(1); }).join(' L'); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* a rattan basket: the rim, the body, the weave, the handle wrapped */
  function basket() { var s = [[ell(100, 54, 70, 13)], ['M33 56 C38 96 50 121 68 128 L132 128 C150 121 162 96 167 56'], ['M68 128 C88 135 112 135 132 128']];
    var side = function (y) { var t = (y - 56) / 72; return [33 + 35 * Math.pow(t, 1.7), 167 - 35 * Math.pow(t, 1.7)]; };
    [74, 92, 110].forEach(function (y) { var e = side(y); s.push(['M' + e[0].toFixed(1) + ' ' + y + ' Q100 ' + (y + 13) + ' ' + e[1].toFixed(1) + ' ' + y]); });
    for (var i = 1; i < 8; i++) { var tx = 30 + 140 * i / 8, ty = 54 + 13 * Math.sqrt(Math.max(0, 1 - Math.pow((tx - 100) / 70, 2))), bx = 68 + 64 * i / 8, by = 128 + 6 * Math.sqrt(Math.max(0, 1 - Math.pow((bx - 100) / 32, 2)));
      s.push(['M' + tx.toFixed(1) + ' ' + ty.toFixed(1) + ' Q' + lerp(tx, bx, .5).toFixed(1) + ' ' + ((ty + by) / 2 + 2) + ' ' + bx.toFixed(1) + ' ' + by.toFixed(1)]); }
    s.push(['M44 51 C50 -6 150 -6 156 51'], ['M53 50 C60 6 140 6 147 50']);
    for (var k = 0; k < 5; k++) { var x = 74 + k * 13; s.push(['M' + x + ' ' + (11 + Math.abs(x - 100) * .16).toFixed(1) + ' l7 ' + (9 - Math.abs(x - 100) * .03).toFixed(1), 1]); }
    return s; }

  /* a rope tied on itself: a loop in the middle, the twist hatched, the ends whipped */
  function rope() { var c = [], r = 19, dd = 44, x0 = 40 - r * Math.PI, Y = 42, N = 90;
    c.push([6, Y + r + dd]); for (var i = 0; i <= N; i++) { var th = Math.PI + 2 * Math.PI * i / N; c.push([x0 + r * th - dd * Math.sin(th), Y + r - dd * Math.cos(th)]); } c.push([194, Y + r + dd]);
    var pts = []; for (var j = 0; j < c.length - 1; j++) { var a = c[j], b = c[j + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / 2)); for (var k = 0; k < n; k++) pts.push([lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)]); } pts.push(c[c.length - 1]);
    var off = function (w) { return pts.map(function (p, i) { var a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [p[0] - dy / l * w, p[1] + dx / l * w]; }); };
    var L1 = off(3.6), L2 = off(-3.6), s = [[poly(L1.filter(function (p, i) { return i % 3 === 0; }))], [poly(L2.filter(function (p, i) { return i % 3 === 0; }))]];
    for (var h = 6; h < pts.length - 6; h += 4) { var A = L1[h], B = L2[h + 2]; s.push(['M' + A[0].toFixed(1) + ' ' + A[1].toFixed(1) + ' L' + B[0].toFixed(1) + ' ' + B[1].toFixed(1)]); }
    [10, pts.length - 14].forEach(function (h0) { for (var w = 0; w < 3; w++) { var A = L1[h0 + w * 2], B = L2[h0 + w * 2]; s.push(['M' + A[0].toFixed(1) + ' ' + A[1].toFixed(1) + ' L' + B[0].toFixed(1) + ' ' + B[1].toFixed(1), 1]); } });
    s.push(['M6 ' + (Y + r + dd - 3) + ' l-4 -3 M6 ' + (Y + r + dd) + ' l-5 0 M6 ' + (Y + r + dd + 3) + ' l-4 3'], ['M194 ' + (Y + r + dd - 3) + ' l4 -3 M194 ' + (Y + r + dd) + ' l5 0 M194 ' + (Y + r + dd + 3) + ' l4 3']);
    return s; }

  /* a spider web, and caught in it the Irukandji (the one drawing of it, as it is) */
  function web() { var cx = 84, cy = 70, sp = [], s = [], n = 9;
    for (var i = 0; i < n; i++) { var a = -Math.PI / 2 + i * 2 * Math.PI / n + Math.sin(i * 7.3) * .12, R = 66 + Math.sin(i * 3.1) * 8; sp.push([a, R]); s.push(['M' + cx + ' ' + cy + ' L' + (cx + Math.cos(a) * R).toFixed(1) + ' ' + (cy + Math.sin(a) * R).toFixed(1)]); }
    [9, 18, 28, 39, 51, 62].forEach(function (rr) { var p = sp.map(function (q) { var r2 = Math.min(rr, q[1]); return [cx + Math.cos(q[0]) * r2, cy + Math.sin(q[0]) * r2]; }), d = 'M' + p[0][0].toFixed(1) + ' ' + p[0][1].toFixed(1);
      for (var k = 1; k <= n; k++) { var b = p[k % n], a2 = p[k - 1], mx = (a2[0] + b[0]) / 2, my = (a2[1] + b[1]) / 2; d += ' Q' + lerp(cx, mx, .9).toFixed(1) + ' ' + lerp(cy, my, .9).toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1); } s.push([d]); });
    s.push(['M' + cx + ' ' + (cy - 70) + ' L' + cx + ' 0'], ['M' + (cx + 60) + ' ' + (cy - 30) + ' L196 10']);
    return s; }
  var IRUK = ['M12.6 31C12.2 18.2 21.2 9.4 32.3 9.6c10.8.2 19.4 8.8 19 21.1', 'M12.4 31.2c7.6 3 31.4 3.1 39-.5', 'M15.4 21.6c8.4 2.4 25 2.5 33.2-.4', 'M32.1 9.9c-6.2 5.8-6.9 15.6-5.6 22.6', 'M32.6 9.8c6.1 6.2 6.6 16 5.3 22.8'];
  var IRUK_T = ['M18.8 33.2c-1.9 5.4 1.9 9.4-.6 15.2 1.4 2.8.5 5-.4 7', 'M27 34.3c.9 5.6-1.1 9.6.4 15.6-.7 2.4-.2 4.4.6 6.4', 'M37 34.4c-.9 5.5 1.2 9.6-.3 15.4.8 2.5.2 4.6-.6 6.5', 'M45.4 33c1.8 5.5-1.8 9.5.7 15.3-1.4 2.8-.4 5 .4 7'];

  /* the hardware, as plates: 120 by 90 */
  var KIT = {
    t88: function () { return [['M14 80 L14 38 Q14 22 30 20 L92 18 Q106 18 106 34 L106 80 Z'], ['M14 48 L106 46'], ['M30 30 L90 29'], ['M38 29 C42 12 76 10 82 29', 1], [ell(95, 64, 3, 3)], ['M22 64 h4 M30 64 h4']]; },
    t20: function () { return [[rect(12, 34, 96, 46)], ['M12 34 L22 22 L98 22 L108 34'], ['M30 28 L90 28'], ['M36 28 C40 12 78 12 84 28', 1], [ell(96, 60, 3, 3)]]; },
    t70: function () { return [[rect(18, 18, 84, 64)], ['M18 30 L102 30'], ['M34 42 L86 42'], ['M38 42 L38 64 Q60 69 82 64 L82 42', 1], [ell(92, 74, 2.5, 2.5)]]; },
    p: function () { return [['M36 80 L36 40 Q36 32 44 32 L76 32 Q84 32 84 40 L84 80 Z'], ['M45 39 L75 39'], ['M48 39 C50 24 70 24 72 39', 1], [ell(60, 64, 6, 6)]]; },
    b: function () { return [[rect(12, 24, 92, 56)], [ell(17, 29, 2, 2)], [ell(65, 29, 2, 2)], [ell(17, 75, 2, 2)], [ell(65, 75, 2, 2)], [rect(40, 42, 16, 16), 1], [rect(96, 30, 16, 12)], [rect(96, 46, 16, 12)], [rect(98, 62, 14, 14)], ['M20 27 L84 27', 0, 'pins']]; },
    a: function () { return [[rect(26, 24, 66, 56)], [ell(31, 29, 2, 2)], [ell(87, 29, 2, 2)], [ell(31, 75, 2, 2)], [ell(87, 75, 2, 2)], [rect(48, 44, 16, 16), 1], [rect(84, 48, 18, 13)], ['M34 27 L84 27', 0, 'pins']]; },
    z: function () { return [[rect(14, 36, 92, 30)], [ell(19, 41, 2, 2)], [ell(101, 41, 2, 2)], [ell(19, 61, 2, 2)], [ell(101, 61, 2, 2)], [rect(50, 45, 14, 14), 1], [rect(30, 63, 9, 5)], [rect(74, 63, 9, 5)], ['M26 39 L94 39', 0, 'pins']]; },
    brick: function () { return [['M24 40 Q24 34 30 34 L90 34 Q96 34 96 40 L96 70 Q96 76 90 76 L30 76 Q24 76 24 70 Z'], ['M34 48 L70 48 M34 56 L60 56'], ['M96 55 C112 55 106 28 116 24', 1]]; },
    panel: function () { var s = [['M14 66 L30 20 L108 20 L98 66 Z']]; for (var i = 1; i < 4; i++) s.push(['M' + lerp(30, 108, i / 4).toFixed(1) + ' 20 L' + lerp(14, 98, i / 4).toFixed(1) + ' 66']); for (var j = 1; j < 3; j++) s.push(['M' + lerp(30, 14, j / 3).toFixed(1) + ' ' + lerp(20, 66, j / 3).toFixed(1) + ' L' + lerp(108, 98, j / 3).toFixed(1) + ' ' + lerp(20, 66, j / 3).toFixed(1)]); s.push(['M40 66 L36 84 M84 66 L88 84'], ['M60 4 l0 8 M48 8 l4 6 M72 8 l-4 6', 1]); return s; },
    bat: function () { return [[rect(22, 30, 76, 50)], [rect(32, 24, 10, 6)], [rect(78, 24, 10, 6)], ['M33 44 h8 M37 40 v8', 1], ['M79 44 h8'], ['M32 62 L88 62']]; }
  };
  var SKETCH = { basket: [basket, '0 0 200 150'], rope: [rope, '0 0 200 150'], web: [web, '0 0 200 150'] };

  var seed = 7;
  function paint(host, strokes, box, extra) { host.innerHTML = ''; var svg = D.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', box); svg.setAttribute('class', 'sk'); svg.setAttribute('aria-hidden', 'true'); host.appendChild(svg);
    var rc = window.rough ? rough.svg(svg) : null, all = [];
    strokes.forEach(function (st, i) { var g;
      if (st[2] === 'pins' || !rc) { g = D.createElementNS(NS, 'path'); g.setAttribute('d', st[0]); if (st[2] === 'pins') { g.setAttribute('stroke-dasharray', '1.2 2.4'); g.style.strokeWidth = '3'; } }
      else g = rc.path(st[0], { roughness: .9, bowing: .7, strokeWidth: 1.15, seed: seed + i, preserveVertices: true });
      if (st[1]) g.setAttribute('class', 'ac'); svg.appendChild(g); all.push([g, i / strokes.length]); });
    if (extra) extra(svg, all);
    all.forEach(function (p) { var ps = p[0].tagName === 'path' ? [p[0]] : $$('path', p[0]); ps.forEach(function (el) { if (el.getAttribute('stroke-dasharray')) { el.style.opacity = 0; el.style.transition = 'opacity .8s ease ' + (.6 + p[1]).toFixed(2) + 's'; requestAnimationFrame(function () { requestAnimationFrame(function () { el.style.opacity = 1; }); }); return; }
      var l = 0; try { l = el.getTotalLength(); } catch (e) { /* not drawn */ } if (!l) return; el.style.setProperty('--l', Math.ceil(l + 2)); el.style.setProperty('--d', (p[1] * 1.1).toFixed(2) + 's'); el.classList.add('draw'); }); }); }
  function irukIn(svg, all) { var g = D.createElementNS(NS, 'g'); g.setAttribute('transform', 'translate(104 66) scale(1.02)'); g.setAttribute('class', 'ac');
    IRUK.concat(IRUK_T).forEach(function (d, i) { var p = D.createElementNS(NS, 'path'); p.setAttribute('d', d); p.style.strokeWidth = '2.6'; if (i >= IRUK.length) p.setAttribute('stroke-dasharray', '.2 3.6'); g.appendChild(p); all.push([p, .55 + i * .03]); }); svg.appendChild(g); }
  function sketch(host) { var k = host.dataset.sk, s = SKETCH[k]; if (!s) return; paint(host, s[0](), s[1], k === 'web' ? irukIn : null); }

  /* ───────── the plates ───────── */
  var PLATES = {
    printers: [['TM-T88V', 'Epson · 80 mm', 't88', 'printer-top.jpg', 'TESTED'], ['TM-T88IV', 'Epson · 80 mm', 't88'], ['TM-T20', 'Epson · 80 mm', 't20'], ['TM-T70', 'Epson · 80 mm', 't70'], ['SRP-350', 'Bixolon · 80 mm', 't20'], ['TM-P20', 'Epson · 58 mm', 'p'], ['MTP-2', '58 mm', 'p'], ['PT-210', '58 mm', 'p']],
    pi: [['Pi 3 A+', '2018', 'a'], ['Pi 3 B+', '2018', 'b'], ['Pi 3 B', '2016', 'b'], ['Zero 2 W', '2021', 'z']],
    power: [['PS-180', 'Epson · 24 V', 'brick'], ['Solar', '100 W · 12 V', 'panel'], ['LiFePO4', '12.8 V · 50 Ah', 'bat']]
  };
  var HOVER = { printers: 'USB, ESC/POS', pi: 'Raspberry Pi', power: 'From the parts list' };
  function plates(tab) { var box = $('#plates'); box.innerHTML = ''; box.scrollLeft = 0;
    $$('.tabs [data-tab]').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.tab === tab)); });
    PLATES[tab].forEach(function (p, i) { var f = D.createElement('figure'); f.className = 'plate'; f.title = HOVER[tab]; var pic = D.createElement('div'); pic.className = 'pic'; f.appendChild(pic);
      if (p[3]) { var im = D.createElement('img'); im.src = p[3]; im.alt = p[0]; im.loading = 'lazy'; pic.appendChild(im); } else { seed = 11 + i * 5; paint(pic, KIT[p[2]](), '0 0 120 90'); }
      var c = D.createElement('figcaption'); c.innerHTML = '<span class="n"></span><span class="m mono"></span>'; c.firstChild.textContent = p[0]; c.lastChild.textContent = p[1]; f.appendChild(c);
      if (p[4]) { var t = D.createElement('span'); t.className = 't mono'; t.textContent = p[4]; f.appendChild(t); } box.appendChild(f); }); }
  $$('.tabs [data-tab]').forEach(function (b) { b.addEventListener('click', function () { plates(b.dataset.tab); }); });

  /* ───────── the files: everything for a complete build ───────── */
  var FILES = [['ISLAND OS', 'IMG', 'releases/latest'], ['IMAGER LIST', 'JSON', 'releases/latest/download/os-list.json', 1], ['SOURCE', 'ZIP', 'archive/refs/heads/main.zip', 1], ['ISLAND', 'GO', 'tree/main/kit/island'], ['IMAGE', 'PI-GEN', 'tree/main/kit/image'], ['RECEIVER', 'PY', 'tree/main/web/receiver'], ['ENGINE', 'GO', 'tree/main/engine'], ['SPEC', 'JSON', 'tree/main/spec'], ['SITE', 'JS', 'tree/main/web'], ['PARTS', 'TXT', 'build-a-solar-printer.txt', 2]];
  $('#files').innerHTML = FILES.map(function (f) { var href = f[3] === 2 ? f[2] : GH + f[2]; return '<li><a href="' + href + '"' + (f[3] === 2 ? ' download' : ' target="_blank" rel="noopener"') + '><span>' + f[0] + '</span><span class="kd">' + f[1] + '</span><span>' + (f[3] ? '↓' : '↗') + '</span></a></li>'; }).join('');

  /* the builder: inside novel.global it opens in this same sheet, so the back key comes home */
  $$('[data-bench]').forEach(function (a) { a.href = 'bench?' + (IN ? 'in=1&' : '') + 'm=' + a.dataset.bench + (nm ? '&night=' + nm[1] : '') + '#b'; });

  /* ───────── the three ways ───────── */
  var WAYS = ['hardware', 'software', 'stories'];
  function show(id) { if (WAYS.indexOf(id) < 0) id = '';
    $$('main > section').forEach(function (s) { s.hidden = s.id !== (id || 'pick'); });
    var on = $('#' + (id || 'pick')); $$('[data-sk]', on).forEach(function (h, i) { seed = 3 + i; sketch(h); });
    if (id === 'hardware') plates('printers');
    if (id) { var seen = store.get('da.archi.seen'); if (seen.indexOf(id) < 0) { seen.push(id); store.set('da.archi.seen', seen); } }
    var was = store.get('da.archi.seen'); $$('.way').forEach(function (w) { w.classList.toggle('was', was.indexOf(w.dataset.go) >= 0); });
    history.replaceState(null, '', location.pathname + location.search + '#' + (id || 'a')); scrollTo(0, 0); }
  $$('[data-go]').forEach(function (b) { b.addEventListener('click', function () { show(b.dataset.go); }); });
  show(location.hash.slice(1));
})();

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

  /* ───────── the story in three: a basket (make it right), two baskets joined by a rope (make it work), and the Irukandji
     spinning a web between them (make it beautiful). All in a 200 by 150 box ───────── */
  /* a rattan basket at (x, y), scale s: the rim, the body, the weave, the handle wrapped */
  function basket(o) { o = o || { x: 0, y: 0, s: 1 }; var X = function (x) { return (o.x + x * o.s).toFixed(1); }, Y = function (y) { return (o.y + y * o.s).toFixed(1); }, P = function (x, y) { return X(x) + ' ' + Y(y); };
    var s = [[ell(+X(100), +Y(54), 70 * o.s, 13 * o.s)], ['M' + P(33, 56) + ' C' + P(38, 96) + ' ' + P(50, 121) + ' ' + P(68, 128) + ' L' + P(132, 128) + ' C' + P(150, 121) + ' ' + P(162, 96) + ' ' + P(167, 56)], ['M' + P(68, 128) + ' C' + P(88, 135) + ' ' + P(112, 135) + ' ' + P(132, 128)]];
    var side = function (y) { var t = (y - 56) / 72; return [33 + 35 * Math.pow(t, 1.7), 167 - 35 * Math.pow(t, 1.7)]; };
    [74, 92, 110].forEach(function (y) { var e = side(y); s.push(['M' + P(e[0], y) + ' Q' + P(100, y + 13) + ' ' + P(e[1], y)]); });
    for (var i = 1; i < 8; i++) { var tx = 30 + 140 * i / 8, ty = 54 + 13 * Math.sqrt(Math.max(0, 1 - Math.pow((tx - 100) / 70, 2))), bx = 68 + 64 * i / 8, by = 128 + 6 * Math.sqrt(Math.max(0, 1 - Math.pow((bx - 100) / 32, 2)));
      s.push(['M' + P(tx, ty) + ' Q' + P(lerp(tx, bx, .5), (ty + by) / 2 + 2) + ' ' + P(bx, by)]); }
    s.push(['M' + P(44, 51) + ' C' + P(50, -6) + ' ' + P(150, -6) + ' ' + P(156, 51)], ['M' + P(53, 50) + ' C' + P(60, 6) + ' ' + P(140, 6) + ' ' + P(147, 50)]);
    if (o.s > .6) for (var k = 0; k < 5; k++) { var x = 74 + k * 13; s.push(['M' + P(x, 11 + Math.abs(x - 100) * .16) + ' l' + (7 * o.s).toFixed(1) + ' ' + ((9 - Math.abs(x - 100) * .03) * o.s).toFixed(1), 1]); }
    return s; }
  /* a rope along a centre line: its two edges, the twist hatched, the ends whipped in the accent */
  function ropeAlong(c, w, step) { var pts = [];
    for (var j = 0; j < c.length - 1; j++) { var a = c[j], b = c[j + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / 1.5)); for (var k = 0; k < n; k++) pts.push([lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)]); } pts.push(c[c.length - 1]);
    var off = function (d) { return pts.map(function (p, i) { var a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [p[0] - dy / l * d, p[1] + dx / l * d]; }); };
    var L1 = off(w), L2 = off(-w), s = [[poly(L1.filter(function (p, i) { return i % 3 === 0; }))], [poly(L2.filter(function (p, i) { return i % 3 === 0; }))]];
    for (var h = 4; h < pts.length - 4; h += step) { var A = L1[h], B = L2[Math.min(pts.length - 1, h + 2)]; s.push(['M' + A[0].toFixed(1) + ' ' + A[1].toFixed(1) + ' L' + B[0].toFixed(1) + ' ' + B[1].toFixed(1)]); }
    [2, pts.length - 8].forEach(function (h0) { for (var q = 0; q < 3; q++) { var A = L1[h0 + q * 2], B = L2[h0 + q * 2]; if (A && B) s.push(['M' + A[0].toFixed(1) + ' ' + A[1].toFixed(1) + ' L' + B[0].toFixed(1) + ' ' + B[1].toFixed(1), 1]); } });
    return s; }
  /* the two baskets, and the rope tied round both handles, slack between them */
  var BA = { x: -6, y: 54, s: .44 }, BB = { x: 106, y: 54, s: .44 }, HA = [38, 57.5], HB = [150, 57.5];
  function tie(h, from) { var p = [], r = 4.2; for (var i = 0; i <= 24; i++) { var a = from + i / 24 * Math.PI * 2.15; p.push([h[0] + Math.cos(a) * r, h[1] - r * .6 + Math.sin(a) * r]); } return p; }
  function ropeLine() { var c = [[HA[0] - 10, HA[1] + 20], [HA[0] - 3, HA[1] + 6]].concat(tie(HA, Math.PI * .6));
    var a = c[c.length - 1], e = [HB[0] - 4, HB[1] + 2];
    for (var i = 1; i < 30; i++) { var t = i / 30; c.push([lerp(lerp(a[0], 94, t), lerp(94, e[0], t), t), lerp(lerp(a[1], 100, t), lerp(100, e[1], t), t)]); }
    c = c.concat(tie(HB, Math.PI * .9)); c.push([HB[0] + 3, HB[1] + 6], [HB[0] + 10, HB[1] + 20]); return c; }
  function one() { return basket(); }
  function two() { return basket(BA).concat(basket(BB), ropeAlong(ropeLine(), 1.7, 5)); }
  /* the web, half made: held by the two handles and the rope below, never the sky. Its top is the Irukandji's four tentacles,
     reaching down from the bell, which floats clear above it. The inner turns go round, the outer ones stop part way */
  var HUB = [94, 58], LOW = [[147, 56.5], [130, 72], [94, 80], [58, 72], [41, 56.5]], TIPS = [-150, -110, -70, -30].map(function (d) { var a = d * Math.PI / 180; return [HUB[0] + Math.cos(a) * 22, HUB[1] + Math.sin(a) * 22]; });
  var BELL = [94, 13];
  function polar(a) { return [Math.atan2(a[1] - HUB[1], a[0] - HUB[0]), Math.hypot(a[0] - HUB[0], a[1] - HUB[1])]; }
  function ring(pts, r) { var q = pts.map(function (a) { var o = polar(a), rr = Math.min(r, o[1]); return [HUB[0] + Math.cos(o[0]) * rr, HUB[1] + Math.sin(o[0]) * rr]; }), d = 'M' + q[0][0].toFixed(1) + ' ' + q[0][1].toFixed(1);
    for (var k = 1; k < q.length; k++) { var a = q[k - 1], b = q[k]; d += ' Q' + lerp(HUB[0], (a[0] + b[0]) / 2, .92).toFixed(1) + ' ' + lerp(HUB[1], (a[1] + b[1]) / 2, .92).toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1); } return d; }
  var ALL = LOW.concat(TIPS, [LOW[0]]);
  function three() { var s = two();
    LOW.concat(TIPS).forEach(function (a) { s.push(['M' + HUB[0] + ' ' + HUB[1] + ' L' + a[0].toFixed(1) + ' ' + a[1].toFixed(1), 0, 'thin']); });
    s.push([ring(ALL, 7), 0, 'thin'], [ring(ALL, 14), 0, 'thin'], [ring(LOW.concat([TIPS[0]]), 22), 0, 'thin'], [ring(LOW.slice(0, 3), 31), 0, 'thin']);
    return s; }
  /* the thread it is spinning now: the outer turn, carried on from where it stopped */
  var GROW = (function () { var out = [], pts = LOW.slice(2); for (var k = 0; k < pts.length - 1; k++) { var a = polar(pts[k]), b = polar(pts[k + 1]); if (b[0] - a[0] < -Math.PI) b[0] += Math.PI * 2;
    for (var j = 0; j <= 20; j++) { var t = j / 20, an = lerp(a[0], b[0], t), rr = 31 * (1 - .08 * Math.sin(t * Math.PI)); out.push([HUB[0] + Math.cos(an) * rr, HUB[1] + Math.sin(an) * rr]); } } return out; })();

  /* ───────── the Irukandji, the main one, as it swims on the banner: the box bell in one line with its shadow line, the eye in
     dots, four dots where the tentacles leave, four fine tentacles beaded at the top. Here it floats above the web it is
     making, its tentacles the web's top threads ───────── */
  var NTJ = 40, NRJ = 40, RM = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var noise = function (a, b, c) { return Math.sin(a * 1.7 + b * 2.3 + c) * 0.5 + Math.sin(a * 0.9 - b * 1.3 + c * 1.9) * 0.3 + Math.sin(b * 3.1 + c * 0.7) * 0.2; };
  function trace(g, pts) { g.beginPath(); pts.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); }
  function rgb(v) { v = String(v).trim(); var m = /^#([0-9a-f]{6})$/i.exec(v); if (!m) return '43,42,40'; var n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(','); }
  function drawJelly(g, J, t, inkRGB, paper) {
    var S = J.s, ink = function (a) { return 'rgba(' + inkRGB + ',' + a.toFixed(3) + ')'; };
    var line = function (pts, w, a) { g.strokeStyle = ink(a); g.lineWidth = w; trace(g, pts); g.stroke(); };
    var dot = function (x, y, r, a) { g.fillStyle = ink(a); g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
    var bw = 15 * S, bh = 12.5 * S, p = RM.matches ? 0 : J.p, w = bw * (1 - 0.07 * p) / 2, h = bh * (1 + 0.045 * p), topY = -h * 0.55 + (bh - h) * 0.3, bot = topY + h;
    g.save(); g.translate(J.x, J.y); g.rotate(J.a + Math.PI / 2); g.lineCap = 'round'; g.lineJoin = 'round';
    var ca = Math.cos(-(J.a + Math.PI / 2)), sa = Math.sin(-(J.a + Math.PI / 2)), lvx = J.vx * ca - J.vy * sa, lvy = J.vx * sa + J.vy * ca;
    var TL = bh * 2.5, ts = RM.matches ? 0 : t * 0.6, ph = J.ph * Math.PI * 2;
    for (var i = 0; i < 4; i++) {
      var rx = (i - 1.5) / 1.5 * w * 0.82, pts = [], tip = J.tips ? [J.tips[i][0] - J.x, J.tips[i][1] - J.y] : null;
      for (var j = 0; j < NTJ; j++) { var s = j / (NTJ - 1), env = Math.min(1, j / 4), x, y;
        if (tip) { var sw = Math.sin(s * Math.PI); x = lerp(rx, tip[0], s) + (noise(i * 3.3, s * 2.2, ts * 0.8) * bh * 0.22 + Math.sin(ph - s * 4.5 + i) * bh * 0.07) * sw; y = lerp(bot - 1, tip[1], s) + noise(i * 7.1, s * 3, ts * 0.6) * bh * 0.08 * sw; pts.push([x, y]); continue; }
        x = rx + (i - 1.5) * s * TL * 0.05 + (noise(i * 3.3, s * 2.2, ts * 0.8) * bh * 0.65 + Math.sin(s * (6 + i) - ts * 2.6 + i * 1.7) * bh * 0.3 + Math.sin(ph - s * 4.5 + i) * bh * 0.16) * s * env - lvx * 0.5 * s * s * S;
        y = bot - 1 + s * TL * (1 - Math.min(0.25, Math.abs(lvy) * 0.01)) * (1 - 0.07 * p * (1 - s * 0.6)) + noise(i * 7.1, s * 3, ts * 0.6) * bh * 0.22 * s;
        pts.push([x, y]); }
      var far = i === 1 || i === 2;
      line(pts, 0.8, J.tips ? 0.75 : far ? 0.4 : 0.55); line(pts.map(function (q) { return [q[0] + 1.3, q[1] - 0.8]; }).slice(0, NTJ - 6), 0.3, 0.16);
      for (var b = 1; b < NTJ * 0.2; b++) dot(pts[b][0], pts[b][1], b % 3 === 0 ? 1.15 * Math.sqrt(S) : 0.75 * Math.sqrt(S), 0.32 + 0.22 * Math.sin(t * 1.4 - b * 0.5 + i));
    }
    var B = [];
    for (var k = 0; k < NRJ; k++) { var u = k / NRJ, X, Y; if (u < 0.8) { var an = Math.PI * (1 - u / 0.8), cu = Math.cos(an), su = Math.sin(an); X = Math.pow(Math.abs(cu), 0.55) * (cu < 0 ? -1 : 1) * w; Y = bot - Math.pow(su, 0.42) * h * (0.94 + 0.06 * su); } else { var q2 = (u - 0.8) / 0.2; X = w - 2 * w * q2; Y = bot - Math.sin(q2 * Math.PI) * h * 0.09; } B.push([X, Y]); }
    B.push(B[0]); g.fillStyle = paper; trace(g, B); g.fill(); g.fillStyle = ink(0.06); g.fill();
    line(B, 1.1 * Math.sqrt(S), 0.92); line(B.map(function (q) { return [q[0] + 1, q[1] + 0.7]; }), 0.35, 0.22);
    var bk = Math.min(1, Math.abs(((t + 2.2) % 8.3) - 0.14) / 0.14), eh = h * 0.27 * Math.max(0.08, bk), ew = w * 0.74, ey = topY + h * 0.52;
    for (var e = 0; e < 26; e++) { var ue = e / 26 * Math.PI * 2, ce = Math.cos(ue), se = Math.sin(ue); dot(ce * ew, ey + se * eh * (0.35 + 0.65 * Math.abs(se)), 0.6 * Math.sqrt(S), 0.34); }
    var pr = h * 0.25 * Math.max(0.08, bk); g.strokeStyle = ink(0.3); g.lineWidth = 0.5; g.beginPath(); g.arc(0, ey, pr, 0, 7); g.stroke(); dot(0, ey, pr * 0.42, 0.38);
    [-0.62, -0.22, 0.22, 0.62].forEach(function (f) { dot(f * w, bot - bh * 0.1, 0.9 * Math.sqrt(S), 0.8); });
    g.restore();
  }
  /* one loop for every spinner on the page: the bell holds its place and breathes, the outer thread grows, holds, fades, again */
  var SPIN = [], LAST = 0, RUN = 7, HOLD = 2.5, FADE = 1.2;
  function spinner(host) { var cv = D.createElement('canvas'); cv.className = 'spin'; cv.setAttribute('aria-hidden', 'true'); host.appendChild(cv);
    SPIN.push({ cv: cv, t0: performance.now() / 1000, J: { x: BELL[0], y: BELL[1], a: -Math.PI / 2, ph: Math.random(), p: 0, vx: 0, vy: 0, s: 1.1, tips: TIPS } }); if (SPIN.length === 1) requestAnimationFrame(frame); }
  function frame(ms) { var now = ms / 1000, dt = Math.min(0.05, LAST ? now - LAST : 0.016); LAST = now;
    SPIN = SPIN.filter(function (o) { return o.cv.isConnected; }); if (!SPIN.length) { LAST = 0; return; }
    var cs = getComputedStyle(H), inkC = rgb(cs.getPropertyValue('--ink')), acc = cs.getPropertyValue('--acc').trim() || '#E07A57', paper = cs.getPropertyValue('--card').trim() || '#FBFAF7';
    SPIN.forEach(function (o) { var cv = o.cv, W = cv.clientWidth, Hh = cv.clientHeight; if (!W || !Hh) return; var dpr = Math.min(2, window.devicePixelRatio || 1);
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(Hh * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(Hh * dpr); }
      var k = Math.min(W / 200, Hh / 150), ox = (W - 200 * k) / 2, oy = (Hh - 150 * k) / 2, g = cv.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, Hh); g.setTransform(dpr * k, 0, 0, dpr * k, dpr * ox, dpr * oy);
      var age = RM.matches ? RUN : (now - o.t0) % (RUN + HOLD + FADE), f = Math.min(1, age / RUN), al = age > RUN + HOLD ? 1 - (age - RUN - HOLD) / FADE : 1, n = Math.max(1, Math.round(f * (GROW.length - 1)));
      g.globalAlpha = Math.max(0, al); g.strokeStyle = acc; g.lineWidth = .8; g.lineCap = 'round'; g.lineJoin = 'round'; trace(g, GROW.slice(0, n + 1)); g.stroke(); g.globalAlpha = 1;
      var J = o.J; J.ph += dt / 3.2; var c = J.ph % 1; J.p = c < 0.28 ? Math.sin(c / 0.28 * Math.PI / 2) : Math.cos((c - 0.28) / 0.72 * Math.PI / 2);
      drawJelly(g, J, now, inkC, paper); });
    requestAnimationFrame(frame); }

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
  var SKETCH = { basket: one, rope: two, web: three };

  var seed = 7;
  function paint(host, strokes, box, extra) { host.innerHTML = ''; var svg = D.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', box); svg.setAttribute('class', 'sk'); svg.setAttribute('aria-hidden', 'true'); host.appendChild(svg);
    var rc = window.rough ? rough.svg(svg) : null, all = [];
    strokes.forEach(function (st, i) { var g;
      if (st[2] === 'pins' || !rc) { g = D.createElementNS(NS, 'path'); g.setAttribute('d', st[0]); if (st[2] === 'pins') { g.setAttribute('stroke-dasharray', '1.2 2.4'); g.style.strokeWidth = '3'; } }
      else g = rc.path(st[0], { roughness: .9, bowing: .7, strokeWidth: 1.15, seed: seed + i, preserveVertices: true });
      if (st[1]) g.setAttribute('class', 'ac'); else if (st[2] === 'thin') g.setAttribute('class', 'th'); svg.appendChild(g); all.push([g, i / strokes.length]); });
    if (extra) extra(svg, all);
    all.forEach(function (p) { var ps = p[0].tagName === 'path' ? [p[0]] : $$('path', p[0]); ps.forEach(function (el) { if (el.getAttribute('stroke-dasharray')) { el.style.opacity = 0; el.style.transition = 'opacity .8s ease ' + (.6 + p[1]).toFixed(2) + 's'; requestAnimationFrame(function () { requestAnimationFrame(function () { el.style.opacity = 1; }); }); return; }
      var l = 0; try { l = el.getTotalLength(); } catch (e) { /* not drawn */ } if (!l) return; el.style.setProperty('--l', Math.ceil(l + 2)); el.style.setProperty('--d', (p[1] * 1.1).toFixed(2) + 's'); el.classList.add('draw'); }); }); }
  function sketch(host) { var k = host.dataset.sk, f = SKETCH[k]; if (!f) return; paint(host, f(), '0 0 200 150'); if (k === 'web') spinner(host); }

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
  $$('[data-bench]').forEach(function (a) { a.href = 'bench?' + (IN ? 'in=1&' : '') + 'm=' + a.dataset.bench + (a.dataset.s ? '&s=' + a.dataset.s : '') + (nm ? '&night=' + nm[1] : '') + '#b'; });

  /* ───────── the starts, half built: a receipt, a phone page, a game, some code, each with its gaps marked ───────── */
  var ZIG = 'M22 6 L78 6 L78 96' + ' l-4 4 l-4 -4'.repeat(7) + ' Z', HILL = function (x, y, w, h) { return 'M' + x + ' ' + (y + h) + ' l' + w * .32 + ' ' + (-h * .45) + ' l' + w * .2 + ' ' + h * .25 + ' l' + w * .2 + ' ' + (-h * .35) + ' l' + w * .28 + ' ' + h * .55; };
  var BASE = {
    receipt: [[[ZIG], [rect(30, 22, 40, 20)], [HILL(30, 22, 40, 20)], ['M30 56 h40'], ['M30 62 h40'], ['M30 68 h24'], [ell(36, 82, 5, 5)], [rect(55, 76, 12, 12), 1], ['M57 78 h3 v3 h-3 Z M62 83 h3 v3 h-3 Z', 1]], [[50, 16, 'TITLE HERE'], [50, 51, 'PLACE WORDS HERE']]],
    phone: [[['M21 6 Q21 2 25 2 L75 2 Q79 2 79 6 L79 104 Q79 108 75 108 L25 108 Q21 108 21 104 Z'], ['M45 6.5 h10'], [rect(28, 12, 44, 24)], [HILL(28, 12, 44, 24)], ['M29 52 h42'], ['M29 58 h30'], [rect(34, 70, 32, 11), 1], [ell(50, 95, 4, 4)]], [[50, 46, 'PLACE COPY HERE'], [50, 77.5, 'PRINT', 1]]],
    game: [[[ZIG], ['M30 24 h40'], ['M30 30 h30'], [rect(33, 42, 14, 14)], [rect(53, 42, 14, 14)], [rect(44, 68, 12, 12), 1], [ell(47.5, 71.5, .8, .8), 1], [ell(52.5, 76.5, .8, .8), 1]], [[50, 16, 'YOUR GAME'], [40, 51.5, 'A'], [60, 51.5, 'B']]],
    code: [[[rect(14, 20, 72, 70)], ['M14 29 h72'], [ell(19.5, 24.5, 1.4, 1.4)], [ell(24.5, 24.5, 1.4, 1.4)], [ell(29.5, 24.5, 1.4, 1.4)], ['M33 42 Q27 42 28 49 Q29 55 24 55 Q29 55 28 61 Q27 68 33 68'], ['M67 42 Q73 42 72 49 Q71 55 76 55 Q71 55 72 61 Q73 68 67 68'], ['M42 62 h16', 1]], [[50, 56.5, 'CODE HERE']]]
  };
  function baseSketch(host) { var b = BASE[host.dataset.base]; if (!b) return; seed = 29;
    paint(host, b[0], '0 0 100 110', function (svg) { b[1].forEach(function (t, i) { var x = D.createElementNS(NS, 'text'); x.setAttribute('x', t[0]); x.setAttribute('y', t[1]); x.setAttribute('text-anchor', 'middle'); if (t[3]) x.setAttribute('class', 'ac'); x.textContent = t[2];
      x.style.opacity = 0; x.style.transition = 'opacity .6s ease ' + (.5 + i * .25) + 's'; svg.appendChild(x); requestAnimationFrame(function () { requestAnimationFrame(function () { x.style.opacity = 1; }); }); }); }); }

  /* ───────── the three ways ───────── */
  var WAYS = ['hardware', 'software', 'stories'];
  function show(id) { if (WAYS.indexOf(id) < 0) id = '';
    $$('main > section').forEach(function (s) { s.hidden = s.id !== (id || 'pick'); });
    var on = $('#' + (id || 'pick')); $$('[data-sk]', on).forEach(function (h, i) { seed = 3 + i; sketch(h); }); $$('[data-base]', on).forEach(baseSketch);
    if (id === 'hardware') plates('printers');
    if (id) { var seen = store.get('da.archi.seen'); if (seen.indexOf(id) < 0) { seen.push(id); store.set('da.archi.seen', seen); } }
    var was = store.get('da.archi.seen'); $$('.way').forEach(function (w) { w.classList.toggle('was', was.indexOf(w.dataset.go) >= 0); });
    history.replaceState(null, '', location.pathname + location.search + '#' + (id || 'a')); scrollTo(0, 0); }
  $$('[data-go]').forEach(function (b) { b.addEventListener('click', function () { show(b.dataset.go); }); });
  show(location.hash.slice(1));
})();

/* the island, one drawing. The twin draws it as it is made (a sandbank cleaned and built, stage by stage); an island's home draws it
   as it lives, with what it does standing on it. Needs rough.js first */
(function () {
  'use strict';
  var D = document, NS = 'http://www.w3.org/2000/svg';
  function el(n, a, kids) { var e = D.createElementNS(NS, n); Object.keys(a || {}).forEach(function (k) { e.setAttribute(k, a[k]); }); (kids || []).forEach(function (c) { if (c) e.appendChild(c); }); return e; }
  var WC = { yellow: ['#F2C94C', '#E6B53A', '#F7DB7E'], orange: ['#E2552E', '#EE7D48', '#D24A22'], pink: ['#E890B0', '#F2AECA', '#D9789E'], blue: ['#5D8FD6', '#86AFE6', '#4677C2'], sky: ['#9CC2EE', '#B9D5F4', '#86B1E6'] };
  function wash(rc, shape, a, col, seed, op) { var g = el('g', { 'class': 'wc' }), tn = WC[col] || WC.blue;
    for (var i = 0; i < 3; i++) { var o2 = { stroke: 'none', fill: tn[i], fillStyle: 'solid', roughness: 2.2 + i * .5, bowing: 2.5, seed: seed + i * 7 }, dx = (i - 1) * 1.6, dy = (i % 2) * 1.3 - .6,
        n = shape === 'path' ? rc.path(a[0], o2) : shape === 'ellipse' ? rc.ellipse(a[0] + dx, a[1] + dy, a[2] * (1 - i * .1), a[3] * (1 + i * .06), o2) : rc.rectangle(a[0] + dx, a[1] + dy, a[2] * (1 - i * .07), a[3] * (1 + i * .05), o2);
      if (shape === 'path' && i) n.setAttribute('transform', 'translate(' + dx + ' ' + dy + ')'); n.setAttribute('opacity', ((op || .4) * (1 - i * .25)).toFixed(2)); [].forEach.call(n.querySelectorAll('path'), function (q) { q.style.fill = tn[i]; q.style.stroke = 'none'; }); g.appendChild(n); }
    return g; }
  function IRK(tl) { var w = 15, h = 25, top = -h * .55, bot = top + h, TL = h * tl, B = [], o = '', f = function (n) { return n.toFixed(1); }, ln = function (a) { return 'M' + a.map(function (q) { return f(q[0]) + ' ' + f(q[1]); }).join(' L'); };
    for (var k = 0; k < 48; k++) { var u = k / 48, X, Y; if (u < .8) { var an = Math.PI * (1 - u / .8), cu = Math.cos(an), su = Math.sin(an); X = Math.pow(Math.abs(cu), .55) * (cu < 0 ? -1 : 1) * w; Y = bot - Math.pow(su, .42) * h * (.94 + .06 * su); } else { var q2 = (u - .8) / .2; X = w - 2 * w * q2; Y = bot - Math.sin(q2 * Math.PI) * h * .09; } B.push([X, Y]); }
    for (var i = 0; i < 4; i++) { var rx = (i - 1.5) / 1.5 * w * .82, T = []; for (var j = 0; j < 24; j++) { var s = j / 23, env = Math.min(1, j / 4); T.push([rx + (i - 1.5) * s * TL * .05 + (Math.sin(s * (6 + i) + i * 1.7) * h * .3 + Math.sin(s * 3.1 + i * 2.3) * h * .2) * s * env, bot - 1 + s * TL]); }
      o += '<path class="tn" d="' + ln(T) + '"/>'; for (var b = 1; b < 5; b++) o += '<circle class="ey" cx="' + f(T[b][0]) + '" cy="' + f(T[b][1]) + '" r="' + (b % 3 === 0 ? 1.6 : 1.05) + '"/>'; }
    o += '<path class="bl" d="' + ln(B) + 'Z"/>'; var ew = w * .74, eh = h * .27, ey = top + h * .52;
    for (var e = 0; e < 26; e++) { var ue = e / 26 * Math.PI * 2, se = Math.sin(ue); o += '<circle class="ey" cx="' + f(Math.cos(ue) * ew) + '" cy="' + f(ey + se * eh * (.35 + .65 * Math.abs(se))) + '" r=".85"/>'; }
    o += '<circle class="pu" cx="0" cy="' + f(ey) + '" r="' + f(h * .25) + '"/><circle class="ey" cx="0" cy="' + f(ey) + '" r="' + f(h * .1) + '"/>';
    [-.62, -.22, .22, .62].forEach(function (q) { o += '<circle class="ey" cx="' + f(q * w) + '" cy="' + f(bot - h * .1) + '" r="1.3"/>'; }); return o; }
  /* the island, drawn as it is made: a sandbank in murky water with the sea's rubbish on it. Each stage lit cleans a piece away and
     raises something found and mended (a mast, a hut, a panel), until the lamp is lit, the water clears and the Irukandji comes */
  function draw(s, n, sd) { if (!s || !window.rough || s.dataset.n === String(n)) return; sd = sd || 0; var was = s.dataset.n == null ? n : +s.dataset.n; s.dataset.n = n; s.innerHTML = '';
    var rc = rough.svg(s), o = function (x) { var b = { stroke: 'currentColor', strokeWidth: 1, roughness: 1.3, seed: 5 }; for (var k in x) b[k] = x[k]; b.seed += sd; return b; },
      put = function (k, cls, nodes) { var g = el('g', { 'class': cls + (k > was ? ' grow' : '') }); nodes.forEach(function (q) { g.appendChild(q); }); s.appendChild(g); return g; };
    s.appendChild(el('rect', { 'class': 'deep', x: -40, y: 58, width: 400, height: 60 }));
    put(0, 'sea', [rc.line(0, 58, 320, 58, o({ roughness: .7, seed: 1 }))].concat([[18, 66], [70, 84], [238, 70], [292, 82], [150, 80]].map(function (q, i) { return rc.path('M' + q[0] + ' ' + q[1] + ' q5 -3 10 0 t10 0', o({ roughness: .6, seed: 20 + i, strokeWidth: .7 })); })));
    var mk = Math.max(0, .55 - n * .14); if (mk) { var mu = rc.path('M14 62 L306 62 L290 90 L30 90 Z', o({ stroke: 'none', fill: 'currentColor', fillStyle: 'hachure', hachureGap: 5.5, hachureAngle: 88, fillWeight: .6, roughness: 2.4, seed: 9 })); mu.setAttribute('class', 'murk'); mu.style.opacity = mk.toFixed(2); s.appendChild(mu); }
    if (n >= 4) s.appendChild(wash(rc, 'path', ['M86 58 Q112 46 160 46 T238 58 Z'], 'yellow', 60, .5));
    put(0, 'sand', [rc.path('M84 59 Q112 45 160 45 T240 59', o({ fill: 'currentColor', fillStyle: 'hachure', hachureGap: 3.6, hachureAngle: -32, fillWeight: .45, seed: 2 }))]);
    /* what the sea left: a bottle, a tyre, a net, a can, a crate. One goes with each stage */
    var junk = [function () { return rc.path('M32 72 l10 -3 l1 3 l-10 3 z M43 69.6 l3 -1', o({ seed: 31 })); }, function () { return rc.ellipse(262, 76, 13, 6, o({ seed: 32 })); }, function () { return rc.path('M196 70 l5 4 l5 -4 l5 4 l5 -4 M198 73 l16 0', o({ seed: 33, strokeWidth: .7 })); }, function () { return rc.rectangle(96, 80, 6, 8, o({ seed: 34 })); }, function () { return rc.rectangle(122, 63, 12, 7, o({ seed: 35, fill: 'currentColor', fillStyle: 'cross-hatch', hachureGap: 2.6, fillWeight: .3 })); }];
    junk.forEach(function (j, i) { if (i >= n) put(0, 'junk', [j()]); });
    if (n >= 1) s.appendChild(wash(rc, 'rect', [136, 39, 17, 10], 'orange', 61, .55));
    if (n >= 1) put(1, 'relic', [rc.line(126, 50, 124, 12, o({ seed: 41 })), rc.line(115, 21, 135, 20, o({ seed: 42 })), rc.rectangle(136, 39, 17, 10, o({ seed: 43 }))]);
    if (n >= 2) s.appendChild(wash(rc, 'path', ['M172 33 L195 21 L218 33 Z'], 'pink', 62, .6));
    if (n >= 2) put(2, 'relic', [rc.line(178, 51, 180, 31, o({ seed: 44 })), rc.line(212, 51, 210, 31, o({ seed: 45 })), rc.path('M171 33 L195 20 L219 33', o({ seed: 46, fill: 'currentColor', fillStyle: 'hachure', hachureGap: 2.4, hachureAngle: 70, fillWeight: .4 }))]);
    if (n >= 3) { s.appendChild(wash(rc, 'path', ['M184 25 L203 15 L211 22 L192 32 Z'], 'sky', 63, .65)); s.appendChild(wash(rc, 'ellipse', [284, 18, 19, 18], 'yellow', 64, .6)); }
    if (n >= 3) put(3, 'relic', [rc.path('M184 25 L203 15 L211 22 L192 32 Z', o({ seed: 47, fill: 'currentColor', fillStyle: 'cross-hatch', hachureGap: 3, fillWeight: .35 }))]).appendChild(el('circle', { 'class': 'sun', cx: 284, cy: 18, r: 8.5 }));
    if (n >= 4) { s.appendChild(wash(rc, 'ellipse', [124.5, 12, 12, 11], 'orange', 65, .55)); put(4, 'relic', [rc.rectangle(91, 46, 15, 8, o({ seed: 51 })), rc.path('M95 46 q3.5 -4 7 0', o({ seed: 52, strokeWidth: .8 }))]);
      put(4, 'live', [rc.arc(125, 12, 16, 16, Math.PI * 1.1, Math.PI * 1.9, false, o({ seed: 48, strokeWidth: .8 })), rc.arc(125, 12, 30, 30, Math.PI * 1.15, Math.PI * 1.85, false, o({ seed: 49, strokeWidth: .7 })), el('rect', { 'class': 'flag', x: 116, y: 22, width: 8, height: 11, transform: 'rotate(4 120 22)' }), el('circle', { 'class': 'lamp', cx: 124.5, cy: 12, r: 2.4 })]);
      put(4, 'jl', []).innerHTML = '<g transform="translate(54 76) rotate(-96) scale(.5)">' + IRK(1.6) + '</g>'; }
    if (n >= 4) put(4, 'live', [rc.path('M282 58 Q292 52 304 58', o({ seed: 50 })), el('path', { 'class': 'tie', d: 'M126 14 Q210 -2 293 54' })]);
    /* alive, its two ends are dots: the lamp here, the island it can reach there */
    if (n >= 4) put(4, 'live', [el('circle', { 'class': 'node hot', cx: 124.5, cy: 12, r: 1.4 }), el('circle', { 'class': 'node', cx: 293, cy: 54, r: 2 })]); }

  /* ───────── the island's home: the same island, lived in. What it does stands on it; what it could do is drawn in pencil where it would
     go. A ghost is all pencil on graph paper; a real island inked on its sea, washed in colour. Returns where each thing stands ───────── */
  var AT = { use: [125, 7], home: [113, 29], cards: [145, 43], picks: [97, 50], printer: [196, 36], pics: [229, 47], gang: [171, 52],
    passes: [136, 80], links: [40, 90], gap: [284, 18], test: [292, 84] };
  function home(s, o) { if (!s || !window.rough) return AT; o = o || {}; var has = o.has || {}, cnt = o.n || {}, sd = o.seed || 0;
    s.setAttribute('viewBox', '20 -30 280 140'); delete s.dataset.n; draw(s, 5, sd);
    var rc = rough.svg(s), p = function (x) { var b = { stroke: 'currentColor', strokeWidth: 1, roughness: 1.2, seed: 70 + sd }; for (var k in x) b[k] = x[k]; return b; },
      g = function (k, on, nodes) { if (o.show && !o.show[k]) return null; var q = el('g', { 'class': 'th th-' + k + (on ? ' on' : ' maybe') }); nodes.forEach(function (x) { if (x) q.appendChild(x); }); s.appendChild(q); return q; };
    /* pictures: frames on a line from the hut, one for each picture up to three */
    var pn = Math.min(3, cnt.pics || 0), fr = [rc.line(213, 36, 241, 44, p({ seed: 71, strokeWidth: .7 }))];
    [[218, 37], [226, 39.4], [234, 41.6]].forEach(function (q, i) { var on = i < pn; if (on) fr.push(wash(rc, 'rect', [q[0], q[1], 6, 7], ['blue', 'pink', 'yellow'][i], 80 + i, .7)); fr.push(rc.rectangle(q[0], q[1], 6, 7, p({ seed: 72 + i, strokeWidth: .8 }))); });
    g('pics', has.pics, fr);
    /* picks: the basket on the sand filled */
    g('picks', has.picks, has.picks ? [wash(rc, 'rect', [91, 46, 15, 8], 'yellow', 84, .6)] : [rc.rectangle(90, 45, 17, 10, p({ seed: 85, strokeWidth: .6 }))]);
    /* the gang: a figure each on the beach, up to four */
    var gn = Math.max(1, Math.min(4, cnt.gang || 0)), fig = [];
    for (var i = 0; i < (has.gang ? gn : 2); i++) { var x = 164 + i * 6.5, y = 51 - (i % 2) * 1.2; fig.push(el('circle', { 'class': 'hd', cx: x, cy: y - 7, r: 1.5 })); fig.push(rc.path('M' + x + ' ' + (y - 5.4) + ' L' + x + ' ' + (y - 1.2) + ' M' + (x - 2) + ' ' + (y + 1.4) + ' L' + x + ' ' + (y - 1.2) + ' L' + (x + 2) + ' ' + (y + 1.4) + ' M' + (x - 2.2) + ' ' + (y - 4) + ' L' + (x + 2.2) + ' ' + (y - 4), p({ seed: 90 + i, strokeWidth: .8, roughness: .6 }))); }
    g('gang', has.gang, fig);
    /* passes: a small boat off the shore that takes people out to it */
    g('passes', has.passes, [has.passes ? wash(rc, 'path', ['M128 82 L144 82 L141 86 L131 86 Z'], 'orange', 95, .6) : null, rc.path('M126 82 L146 82 L142 86.5 L130 86.5 Z', p({ seed: 96 })), rc.line(136, 81.6, 136, 69, p({ seed: 97, strokeWidth: .8 })), rc.path('M136.6 70 L144 79 L136.6 79 Z', p({ seed: 98, strokeWidth: .7 }))]);
    /* links: cables out under the sea to the west, lit where it is linked */
    var lk = o.links || [], cab = [];
    for (var c = 0; c < Math.max(3, lk.length); c++) { var x0 = 88 + c * 2.5, y1 = 94 + c * 2.6, q = rc.path('M' + x0 + ' 60 C ' + (x0 - 4) + ' 80 ' + (x0 - 22) + ' ' + y1 + ' 18 ' + (y1 + 1), p({ seed: 100 + c, strokeWidth: .55, roughness: .7 })); if (lk[c]) q.setAttribute('class', 'lit'); cab.push(q); }
    g('links', lk.some(Boolean), cab);
    /* the test: a pencil sandbank beside it, with a mast */
    g('test', has.test, [rc.path('M276 88 Q292 80 308 88', p({ seed: 104, fill: 'currentColor', fillStyle: 'hachure', hachureGap: 3.2, fillWeight: .35 })), rc.line(291, 83, 291, 72, p({ seed: 105, strokeWidth: .7 })), rc.rectangle(291.5, 72.5, 5, 3.5, p({ seed: 106, strokeWidth: .6 }))]);
    /* joins: an islet on the horizon for each island its prints reach, a lane to each from the lamp */
    var jn = Math.min(3, cnt.joins || 0), jl = [];
    for (var j = 0; j < jn; j++) { var jx = 246 + j * 20, jy = 57 - (j % 2) * 3; jl.push(rc.path('M' + (jx - 7) + ' ' + jy + ' Q' + jx + ' ' + (jy - 4) + ' ' + (jx + 7) + ' ' + jy, p({ seed: 110 + j, strokeWidth: .8 }))); jl.push(el('path', { 'class': 'lane', d: 'M125 12 Q' + ((125 + jx) / 2) + ' ' + (-6 - j * 4) + ' ' + jx + ' ' + (jy - 2) })); }
    if (jn) g('joins', true, jl);
    s.classList.toggle('lamp-off', !has.use); s.classList.toggle('flag-off', !has.home);
    return AT; }
  window.ISLE = { el: el, wash: wash, WC: WC, IRK: IRK, draw: draw, home: home, AT: AT };
})();

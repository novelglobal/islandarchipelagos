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
  /* the island, drawn as it is made: a sandbank in murky water with the sea's rubbish on it. Each stage lit cleans a piece away and
     raises something found and mended (a mast, a hut, a panel), until the lamp is lit and the water clears */
  function draw(s, n, sd) { if (!s || !window.rough || s.dataset.n === String(n)) return; sd = sd || 0; var was = s.dataset.n == null ? n : +s.dataset.n; s.dataset.n = n; s.innerHTML = '';
    var rc = rough.svg(s), o = function (x) { var b = { stroke: 'currentColor', strokeWidth: 1, roughness: 1.3, seed: 5 }; for (var k in x) b[k] = x[k]; b.seed += sd; return b; },
      put = function (k, cls, nodes) { var g = el('g', { 'class': cls + (k > was ? ' grow' : '') }); nodes.forEach(function (q) { g.appendChild(q); }); s.appendChild(g); return g; };
    s.appendChild(el('rect', { 'class': 'deep', x: -40, y: 58, width: 400, height: 60 }));
    put(0, 'sea', [rc.line(0, 58, 320, 58, o({ roughness: .7, seed: 1 }))].concat([[18, 66], [70, 84], [238, 70], [292, 82], [150, 80]].map(function (q, i) { return rc.path('M' + q[0] + ' ' + q[1] + ' q5 -3 10 0 t10 0', o({ roughness: .6, seed: 20 + i, strokeWidth: .7 })); })));
    var mk = Math.max(0, .55 - n * .14); if (mk) { var mu = rc.path('M14 62 L306 62 L290 90 L30 90 Z', o({ stroke: 'none', fill: 'currentColor', fillStyle: 'hachure', hachureGap: 5.5, hachureAngle: 88, fillWeight: .6, roughness: 2.4, seed: 9 })); mu.setAttribute('class', 'murk'); mu.style.opacity = mk.toFixed(2); s.appendChild(mu); }
    if (n >= 4) s.appendChild(wash(rc, 'path', ['M86 58 Q112 46 160 46 T238 58 Z'], 'yellow', 60, .5)).classList.add('sandw');
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
      put(4, 'live', [rc.arc(125, 12, 16, 16, Math.PI * 1.1, Math.PI * 1.9, false, o({ seed: 48, strokeWidth: .8 })), rc.arc(125, 12, 30, 30, Math.PI * 1.15, Math.PI * 1.85, false, o({ seed: 49, strokeWidth: .7 })), el('rect', { 'class': 'flag', x: 116, y: 22, width: 8, height: 11, transform: 'rotate(4 120 22)' }), el('circle', { 'class': 'lamp', cx: 124.5, cy: 12, r: 2.4 })]); }
    if (n >= 4) put(4, 'live', [rc.path('M282 58 Q292 52 304 58', o({ seed: 50 })), el('path', { 'class': 'tie', d: 'M126 14 Q210 -2 293 54' })]);
    /* alive, its two ends are dots: the lamp here, the island it can reach there */
    if (n >= 4) put(4, 'live', [el('circle', { 'class': 'node hot', cx: 124.5, cy: 12, r: 1.4 }), el('circle', { 'class': 'node', cx: 293, cy: 54, r: 2 })]); }

  /* ───────── the island's home: the same island, lived in. What it does stands on it; what it could do is drawn in pencil where it would
     go. A ghost is all pencil on graph paper; a real island inked on its sea, washed in colour. Returns where each thing stands ───────── */
  /* the paint under the ink: the reef's own sea, washed by hand. Soft pools of colour with bled edges, laid under the drawing */
  var WCN = 0;
  function under(s, sd) { var id = 'iwc' + (++WCN), ti = 'iwt' + WCN, f = el('filter', { id: id, x: '-20%', y: '-20%', width: '140%', height: '140%' }, [
      el('feTurbulence', { type: 'fractalNoise', baseFrequency: '.045', numOctaves: '3', seed: String(3 + sd), result: 'n' }),
      el('feDisplacementMap', { 'in': 'SourceGraphic', in2: 'n', scale: '9', xChannelSelector: 'R', yChannelSelector: 'G', result: 'd' }),
      el('feGaussianBlur', { 'in': 'd', stdDeviation: '1.6' })]),
      t = el('filter', { id: ti }, [el('feTurbulence', { type: 'fractalNoise', baseFrequency: '.7', numOctaves: '2', seed: String(9 + sd) }), el('feColorMatrix', { values: '0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .5 -.18' }), el('feComposite', { in2: 'SourceGraphic', operator: 'in' })]),
      g = el('g', { 'class': 'paint', filter: 'url(#' + id + ')' }), pool = function (d, c, op) { g.appendChild(el('path', { d: d, style: 'fill:' + c + ';stroke:none', opacity: op })); };
    s.insertBefore(el('defs', {}, [f, t]), s.firstChild);
    pool('M-10 -40 L330 -40 L330 26 Q250 34 160 30 T-10 34 Z', '#2C64A8', .55);
    pool('M-10 60 Q80 64 160 62 T330 60 L330 120 L-10 120 Z', '#0B2F5E', .6);
    pool('M-10 56 Q60 64 120 60 T250 66 T330 60 L330 76 Q240 84 150 78 T-10 82 Z', '#3F7BC2', .35);
    pool('M-10 -40 L330 -40 L330 -6 Q240 4 150 -2 T-10 2 Z', '#4F88CC', .35);
    pool('M30 6 Q60 -2 96 4 Q70 12 30 6 Z M196 -8 Q226 -16 252 -6 Q224 0 196 -8 Z', '#F4F1E8', .12);
    pool('M76 61 Q100 41 160 40 T248 61 Q200 68 160 66 T76 61 Z', '#5E8FCB', .55);
    pool('M80 60 Q102 43 160 42 T244 60 Q200 65 160 63 T80 60 Z', '#7FA8DA', .55);
    pool('M96 58 Q130 48 168 48 T228 58 Q190 61 160 60 T96 58 Z', '#B4CEEC', .3);
    pool('M262 30 Q284 8 306 24 Q300 40 280 38 T262 30 Z', '#F2C94C', .18);
    g.appendChild(el('rect', { x: -10, y: -40, width: 340, height: 160, fill: '#fff', filter: 'url(#' + ti + ')', opacity: .5 }));
    s.insertBefore(g, s.firstChild.nextSibling); }
  var AT = { use: [125, 7], home: [113, 29], cards: [145, 43], picks: [97, 50], printer: [196, 36], pics: [229, 47], gang: [171, 52],
    passes: [136, 80], links: [40, 90], gap: [284, 18], test: [292, 84] };
  function home(s, o) { if (!s || !window.rough) return AT; o = o || {}; var has = o.has || {}, cnt = o.n || {}, sd = o.seed || 0;
    s.setAttribute('viewBox', '20 -30 280 140'); delete s.dataset.n; draw(s, 5, sd); under(s, sd);
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
  window.ISLE = { el: el, wash: wash, WC: WC, draw: draw, home: home, under: under, AT: AT };
})();

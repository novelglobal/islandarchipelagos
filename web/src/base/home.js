/* the home of cards (brief 1.1): one column of art cards, a card to a screen, with the Irukandji's banner over it (the reef under
   the banner when it is pressed) and the switchboard under it, where cards are wired together. Every experience opens from its
   card and comes back to it: the aura (I W.I.S.H.), the radio, an island's stack, the island kit, the control panel */
(function () {
  'use strict';
  var D = document, H = D.documentElement;
  if (!H.classList.contains('aura-on') || (window.__LH && /[?&](aura|base)\b/.test(location.search))) return;
  H.classList.add('hm-on');
  var NG = window.NG || {}, AU = function () { return window.AURA || null; };
  /* a browser's own bar floating over the foot of the page (Safari on a phone): the page stops above it, so nothing at the bottom is hidden */
  (function () { var vv = window.visualViewport; if (!vv) return; var set = function () { var b = Math.max(0, Math.round(innerHeight - vv.height - vv.offsetTop)); document.documentElement.style.setProperty('--hm-vvb', (b > 4 && b < 140 && vv.scale <= 1.01 ? b : 0) + 'px'); };
    vv.addEventListener('resize', set); vv.addEventListener('scroll', set); addEventListener('orientationchange', set); set(); })();
  /* the ad on the stories card sized from its own height, the same in every browser */
  (function () { var fit = function (el) { var h = el.getBoundingClientRect().height; if (h) el.style.setProperty('--adu', (h / 100).toFixed(3) + 'px'); };
    var ro = 'ResizeObserver' in window ? new ResizeObserver(function (es) { es.forEach(function (e) { fit(e.target); }); }) : null;
    var look = function () { document.querySelectorAll('.rc-tp').forEach(function (el) { if (el.__adu) return; el.__adu = 1; fit(el); if (ro) ro.observe(el); }); };
    new MutationObserver(look).observe(document.documentElement, { childList: true, subtree: true }); addEventListener('resize', function () { document.querySelectorAll('.rc-tp').forEach(fit); }); look(); })();
  /* a link on a card going out: a tentacle holds out where it goes, a thumb up to go, a thumb down to stay */
  (function () { var box = null, go = null;
    var shut = function () { if (box) { box.remove(); box = null; go = null; } };
    document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('#hm-col a[href]'); if (!a || e.defaultPrevented) return; var u; try { u = new URL(a.href, location.href); } catch (er) { return; } if (u.origin === location.origin) return;
      e.preventDefault(); e.stopPropagation(); shut(); go = u.href; box = document.createElement('div'); box.className = 'hm-tl'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Leaving for ' + u.hostname);
      box.innerHTML = '<svg viewBox="0 0 40 60" aria-hidden="true"><path d="M20 0c-9 10 9 16 0 26s9 16 0 26"/></svg><span>' + u.hostname.replace(/^www[.]/, '').replace(/[<>&]/g, '') + '</span><button type="button" class="up" aria-label="Go">&#128077;</button><button type="button" class="dn" aria-label="Stay">&#128078;</button>';
      var x = Math.max(12, Math.min(innerWidth - 212, e.clientX - 100)), y = Math.max(70, Math.min(innerHeight - 120, e.clientY - 20)); box.style.left = x + 'px'; box.style.top = y + 'px'; document.getElementById('hm').appendChild(box);
      box.querySelector('.up').addEventListener('click', function (ev) { ev.stopPropagation(); var h = go; shut(); window.open(h, '_blank', 'noopener'); });
      box.querySelector('.dn').addEventListener('click', function (ev) { ev.stopPropagation(); shut(); }); box.querySelector('.up').focus({ preventScroll: true }); }, true);
    document.addEventListener('pointerdown', function (e) { if (box && !box.contains(e.target)) shut(); }, true);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') shut(); }); })();
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
    { id: 'intro', size: 'small', title: 'ISLAND ARCHIPELAGOS', skin: 'intro', opens: 'none', island: 'novelglobal', art: 'plain', motion: 'shadow', where: [-37.8136, 144.9631] },
    { id: 'radio', size: 'small', title: 'DIRECT ACTION RADIO', opens: 'radio', island: 'novelglobal', art: 'blocks', motion: 'speed', where: [-37.8136, 144.9631] },
    { id: 'wish', size: 'small', title: 'CIRCULAR STRATEGY', opens: 'aura', island: 'novelglobal', art: 'photos', motion: 'shadow', where: [-37.8136, 144.9631] },
    { id: 'research', size: 'small', title: 'RESEARCH BOARD', opens: 'research', island: 'novelglobal', art: 'board', motion: 'speed', where: [-37.8136, 144.9631] },
    { id: 'zine', size: 'small', title: 'DESIGN PRINT', opens: 'press', island: 'pickles', art: 'dots', motion: 'shadow', where: [-37.8136, 144.9631] },
    { id: 'kit', size: 'small', title: 'ISLAND', tag: 'ONE CLICK INSTALL', opens: 'kit', island: 'novelglobal', art: 'printer', motion: 'speed', where: [-37.8136, 144.9631] },
    { id: 'space', size: 'small', title: 'ISLAND ARCHIPELAGOS', hub: 'https://github.com/novelglobal/islandarchipelagos', opens: 'bench', island: 'novelglobal', art: 'forms', motion: 'shadow', where: [-37.8136, 144.9631] },

    /* the small cards: three themes, three ways each. THIS WEEK, READ, CARDS */
    { id: 'weather', size: 'small', title: 'WEATHER', opens: 'stack:weather', cart: 'week', g: 'week', tag: 'THIS WEEK', skin: 'wx', island: 'novelglobal', art: 'slot', motion: 'shadow', where: [-37.77, 144.96] },
    { id: 'news', size: 'small', title: 'NEWS', opens: 'stack:news', cart: 'news', g: 'week', tag: 'THIS WEEK', skin: 'wx', island: 'novelglobal', art: 'slot', motion: 'shadow', where: [-37.77, 144.96] },
    { id: 'events', size: 'small', title: 'EVENTS', opens: 'stack:events', cart: 'events', g: 'week', tag: 'THIS WEEK', skin: 'wx', island: 'novelglobal', art: 'slot', motion: 'shadow', where: [-37.77, 144.96] },
    { id: 'fiction', size: 'small', title: 'FICTION', opens: 'stack:fiction', cart: 'read', shelf: 'fic', g: 'read', tag: 'READ', skin: 'wx', island: 'novelglobal', art: 'slot', motion: 'shadow', where: [-37.77, 144.96] },
    { id: 'nonfiction', size: 'small', title: 'NON-FICTION', opens: 'stack:nonfiction', cart: 'read', shelf: 'non', g: 'read', tag: 'READ', skin: 'wx', island: 'novelglobal', art: 'slot', motion: 'shadow', where: [-37.77, 144.96] },
    { id: 'survival', size: 'small', title: 'SURVIVAL', opens: 'stack:survival', cart: 'read', shelf: 'how', g: 'read', tag: 'READ', skin: 'wx', island: 'novelglobal', art: 'slot', motion: 'shadow', where: [-37.77, 144.96] },
    { id: 'cards', size: 'small', title: 'PLAYING', opens: 'stack:cards', cart: 'cards', g: 'deck', tag: 'CARDS', skin: 'wx', island: 'novelglobal', art: 'slot', motion: 'shadow', where: [-37.77, 144.96] },
    { id: 'tarot', size: 'small', title: 'TAROT', opens: 'stack:tarot', cart: 'tarot', g: 'deck', tag: 'CARDS', skin: 'wx', island: 'novelglobal', art: 'slot', motion: 'shadow', where: [-37.77, 144.96] },
    { id: 'pl-pl-2uqn', size: 'small', title: 'SESAME', opens: 'play', play: 'PL-2UQN', cart: 'recipes', g: 'deck', tag: 'CARDS', skin: 'wx', island: 'novelglobal', art: 'slot', motion: 'shadow', where: [-37.77, 144.96] },
    { id: 'portfolio', off: true, size: 'small', title: 'PORTFOLIO', opens: 'portfolio', island: 'novelglobal', art: 'receipt', motion: 'shadow', where: [-37.8136, 144.9631] },
    { id: 'slot-2', off: true, size: 'small', title: 'OPEN ISLAND', ph: 2, skin: 'slot', opens: 'unlock', island: '', art: 'slot', motion: 'shadow', where: [-37.8136, 144.9631] },
    { id: 'slot-3', off: true, size: 'small', title: 'MAKE', ph: 3, skin: 'slot', opens: 'bench', mode: 'live', island: '', art: 'slot', motion: 'shadow', where: [-37.8136, 144.9631] }
  ];
  /* small line drawings: blue on THIS WEEK, ink on CARDS */
  var PRN_HTML = '<div class="hm-prn" aria-hidden="true"><div class="ph"></div><i class="led l-pwr"></i><i class="led l-act"></i><i class="led l-prn"></i><span class="slot"><span class="paper"></span></span></div>';
  var SMALL = {
    radio: '', wish: '', research: '', zine: '',
    kit: '',
    space: '<div class="sm-o sm-prn">' + PRN_HTML + '<b class="sm-inst"><i></i>ONE CLICK INSTALL</b></div><p class="sm-sub">THERMAL PRINTER COMMUNITIES</p>',
    portfolio: '<div class="sm-o sm-slip"><img alt="" decoding="async" loading="lazy" src="/cards/found-tap.jpg"><b>DA-ISL1</b></div>'
  };
  var SMALL_T = { radio: 'Direct action radio', wish: 'Circular strategy', research: 'Research board', zine: 'Design print', kit: 'Island', space: 'Island archipelagos', portfolio: 'Portfolio' };
  var JACKED = ['portfolio', 'wish', 'radio', 'zine', 'research', 'kit', 'space'];
  var SKINS = ['intro', 'portfolio', 'wish', 'radio', 'zine', 'research', 'kit', 'space', 'slot', 'play', 'wx'];
  /* small cards stand three to a page; a page of them always ends in an open slot for the next printer */
  /* the owner's switches (Settings): keys on the small cards, ISLAND folded into ISLAND ARCHIPELAGOS, the second jellyfish's look */
  var OPT = { talk: false, find: false, one: true, stamp: false, carts: false };
  /* a cartridge: a small card, three to a screen. With EVERY CARD on, the big ones stand that way too */
  var MINE = store.get('da.hm.mine', null);
  /* a place's own novel.global (a pop-up's, from its link): its order, sizes and its card. A person's own choices sit over it */
  var PLACE = store.get('da.pop.home', null); if (PLACE && !(PLACE.at && Date.now() - PLACE.at < 30 * 864e5)) PLACE = null;
  var PH = (PLACE && PLACE.home) || {};
  if (PLACE && PLACE.card) (function () { var at = CARDS.findIndex(function (c) { return c.id === 'portfolio'; }); CARDS.splice(at < 0 ? CARDS.length : at, 0, { id: 'pop-' + PLACE.id, pop: PLACE.id, size: 'small', title: String(PLACE.name || PLACE.id).toUpperCase().slice(0, 24), opens: 'pop', skin: 'play', art: 'slot', pal: 5, motion: 'shadow', where: [-37.8136, 144.9631] }); })();
  function lay(k) { var m = MINE && MINE[k]; return m != null && !(Array.isArray(m) && !m.length && k === 'order') ? m : PH[k]; }
  /* a set (the week ahead, the books, the decks) stands at one size: a size given to any of them is the size of all */
  function setOf(c) { return c.join != null ? c.join : (c.g || ''); }
  function kin(c) { var j = setOf(c); return j ? CARDS.filter(function (x) { return setOf(x) === j; }) : [c]; }
  function sizeIn(m, c) { if (!m) return null; var k = kin(c), v = m[c.id]; for (var j = 0; !v && j < k.length; j++) v = m[k[j].id]; return v; }
  function ownSize(c) { var m = sizeIn(MINE && MINE.size, c) || sizeIn(PH.size, c); return m === 'small' || m === 'full' ? m : c.size || 'full'; }
  function sizeOf(c) { return OPT.carts ? 'small' : ownSize(c); }
  /* the cards as this person stands them: [card, its place in CARDS] */
  function view() { var l = CARDS.map(function (c, i) { return [c, i]; }).filter(function (x) { return x[0].id === 'intro' || (!x[0].off && !(OPT.one && x[0].id === 'kit') && !((lay('hide') || []).indexOf(x[0].id) >= 0)); }), o = lay('order');
    if (o && o.length) { var at = function (x) { var k = o.indexOf(x[0].id); return k < 0 ? 1000 + x[1] : k; }; l.sort(function (a, b) { return at(a) - at(b); }); }
    /* the opener stands first, always */
    l.sort(function (a, b) { return (b[0].id === 'intro') - (a[0].id === 'intro'); }); return l; }
  var WIDE = matchMedia('(min-width: 900px)');
  function perPage() { var n = +lay('per'); return n === 3 || n === 6 || n === 9 ? n : 9; }
  function tierOf(c) { if (sizeOf(c) !== 'small') return 'full'; if (OPT.carts && (c.size || 'full') !== 'small') return 'trio'; if (c.trio) return 'trio'; return c.lib || c.g || c.ph || c.opens === 'play' ? 'nine' : 'trio'; }
  function colHTML() { var out = '', run = [], P9 = perPage(), P = P9, free = !!((lay('order') || []).length);
    var flush = function () { for (var k = 0; k < run.length; k += P) { var ch = run.slice(k, k + P); if (k && ch.every(function (r) { return r[1]; })) break;
        /* a band behind each row, in its theme's grey */
        var rows = [], m = 0; ch.forEach(function (r, j) { if (!j || r[3] || m === 3) { rows.push(r[2]); m = 0; } m++; });
        var bands = P === 9 ? ' hm-bands" style="' + rows.slice(0, 3).map(function (g, j) { return '--r' + (j + 1) + ':var(--th-' + g + ')'; }).join(';') : '';
        out += '<section class="hm-trio p' + P + ' n' + Math.min(3, ch.length) + bands + '">' + ch.map(function (r) { return r[0]; }).join('') + '</section>'; } run = []; };
    var was = null, wasT = null, wasG = null; view().forEach(function (x) { var c = x[0], i = x[1], tr = tierOf(c), th = !!c.g, g1 = false; if (was !== null && tr !== was) flush(); was = tr; P = tr === 'nine' ? P9 : 3;
      if (tr === 'full') { flush(); wasT = wasG = null; out += cardHTML(c, i); return; }
      if (tr === 'nine' && !free) { if (wasT !== null && th !== wasT) flush(); if (th && c.g !== wasG) { if (P === 3) flush(); g1 = true; } } wasT = th; wasG = c.g || null;
      run.push([cardHTML(c, i, g1), !!c.ph, c.g || (c.ph ? 'slot' : 'app'), g1]); }); flush(); return out + FOOT; }
  /* the page's foot: a torn length of crumpled receipt paper, the mark on it */
  var FOOT_T = [['maze', '#0B0B0B', '#F1EEE6'], ['crack', '#8A6A4A', '#F1EEE6'], ['eyes', '#0B0B0B', '#F1EEE6'], ['spots', '#2350B8', '#F1EEE6'], ['lines', '#1F6B4F', '#0B0B0B'], ['crack', '#FF6B3D', '#F1EEE6'], ['maze', '#F2B6B0', '#0B0B0B'], ['worms', '#F1EEE6', '#0B0B0B']];
  var FOOT = '<footer class="hm-foot" aria-hidden="true"><div class="hf-grid">' + FOOT_T.map(function (t, k) { return '<canvas class="hf-t t' + k + '" data-pat="' + t.join(',') + '"></canvas>'; }).join('') +
    '<b class="hf-pill">' + 'novel.global'.split('').map(function (c) { return '<i>' + c + '</i>'; }).join('') + '</b></div><b class="hf-m"></b></footer>';
  function pages() { return $$('#hm-col > .hm-slot > .hm-card, #hm-col > .hm-trio'); }
  function dotsHTML() { return pages().map(function () { return '<i></i>'; }).join(''); }
  var MOTION = store.get('da.hm.motion', null);   // null: each card's own; or 'shadow' / 'speed' for all
  var OWN = { portfolio: '#143D71', wish: '#3D7BE0', radio: '#FF6B1A', zine: '#FF5436', research: '#D9F24A', kit: '#FFB000', space: '#F59878' };
  var FOUNDPICS = ['pigeon', 'puddle', 'lora', 'dog', 'grille', 'gutter', 'cooler'].map(function (n) { return '/cards/found-' + n + '.jpg'; });
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
  /* crumpled receipt paper: a jittered mesh of facets, each lit by its tilt, softened; creases drawn along a few folds */
  function crumple(g, w, h, seed, base) {
    var r = rnd(seed || 7), cs = Math.max(18, Math.min(w, h) / 9), nx = Math.ceil(w / cs) + 2, ny = Math.ceil(h / cs) + 2, P = [];
    for (var y = 0; y < ny; y++) { P.push([]); for (var x = 0; x < nx; x++) P[y].push([(x - 0.5) * cs + (r() - 0.5) * cs * 0.9, (y - 0.5) * cs + (r() - 0.5) * cs * 0.9, (r() - 0.5) * cs * 0.55]); }
    g.save(); g.fillStyle = base || '#F6F5F0'; g.fillRect(0, 0, w, h); try { g.filter = 'blur(' + Math.max(0.6, cs / 30) + 'px)'; } catch (e) { /* old */ }
    var L = [-0.55, -0.7, 0.45], tri = function (a, b, c) { var ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      var nx2 = uy * vz - uz * vy, ny2 = uz * vx - ux * vz, nz = ux * vy - uy * vx, d = Math.hypot(nx2, ny2, nz) || 1; if (nz < 0) { nx2 = -nx2; ny2 = -ny2; nz = -nz; }
      var k = (nx2 * L[0] + ny2 * L[1] + nz * L[2]) / d - 0.45; g.fillStyle = k > 0 ? 'rgba(255,255,255,' + Math.min(0.55, k * 1.1).toFixed(3) + ')' : 'rgba(70,66,58,' + Math.min(0.16, -k * 0.32).toFixed(3) + ')';
      g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.closePath(); g.fill(); };
    for (var y2 = 0; y2 < ny - 1; y2++) for (var x2 = 0; x2 < nx - 1; x2++) { var A = P[y2][x2], B = P[y2][x2 + 1], C = P[y2 + 1][x2], E = P[y2 + 1][x2 + 1]; if ((x2 + y2) % 2) { tri(A, B, E); tri(A, E, C); } else { tri(A, B, C); tri(B, E, C); } }
    try { g.filter = 'none'; } catch (e) { /* old */ }
    g.lineCap = 'round'; for (var f = 0; f < 9; f++) { var fx = r() * w, fy = r() * h, an = r() * 6.3, len = (0.3 + r() * 0.7) * Math.max(w, h); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx + Math.cos(an) * len, fy + Math.sin(an) * len); g.stroke(); g.strokeStyle = 'rgba(60,56,50,.1)'; g.beginPath(); g.moveTo(fx + 1, fy + 1); g.lineTo(fx + 1 + Math.cos(an) * len, fy + 1 + Math.sin(an) * len); g.stroke(); }
    g.restore(); grain(g, w, h, Math.round(w * h / 70), 'rgba(0,0,0,.06)', (seed || 7) + 1);
  }
  window.NG_CRUMPLE = function (cv, seed) { var k = Math.min(2, devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return; cv.width = Math.round(w * k); cv.height = Math.round(h * k); var g = cv.getContext('2d'); g.setTransform(k, 0, 0, k, 0, 0); crumple(g, w, h, seed); };
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
  /* novel.global's mark: the square and the sun */
  var MARK = '<svg class="ng-mark" viewBox="0 0 237 112" aria-hidden="true"><rect x="10" y="10" width="91.6" height="92" fill="currentColor" transform="rotate(-.34 56 56)"/><circle cx="178.3" cy="56.5" r="48.8" fill="#E25C40"/></svg>';
  /* 888 in fat pixels, stood up in three dimensions, die-cut and stuck on */
  var STICK888 = (function () { var P = '.###.#...##...#.###.#...##...#.###.', o = '';
    for (var d = 0; d < 3; d++) for (var r = 0; r < 7; r++) for (var c = 0; c < 5; c++) if (P[r * 5 + c] === '#') { var x = 2 + d * 6 + c, y = 2 + r;
      o += '<rect x="' + (x + 0.9) + '" y="' + (y + 0.9) + '" width="1" height="1" fill="#2A1450"/><rect x="' + (x + 0.45) + '" y="' + (y + 0.45) + '" width="1" height="1" fill="#6B2FB3"/><rect x="' + x + '" y="' + y + '" width="1" height="1" fill="url(#rc8g)"/>' + (r === 0 || (c === 0 && r < 3) ? '<rect x="' + x + '" y="' + y + '" width=".34" height=".34" fill="#FFFFFF" opacity=".85"/>' : ''); }
    return '<i class="rc-888" aria-hidden="true"><svg viewBox="0 0 21 11" shape-rendering="crispEdges"><defs><linearGradient id="rc8g" x1="0" y1="2" x2="0" y2="9" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFE45C"/><stop offset=".45" stop-color="#FF4FB3"/><stop offset="1" stop-color="#3FD3FF"/></linearGradient></defs>' + o + '</svg></i>'; })();
  var DRIFT = '<svg class="st-tent" viewBox="0 0 100 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + [[12, 0, 34], [20, 0, 22], [83, 0, 40], [90, 0, 26]].map(function (t, k) { return '<path style="--k:' + k + '" d="M' + t[0] + ' ' + t[1] + 'c3 ' + t[2] * 0.25 + ' -3 ' + t[2] * 0.5 + ' 0 ' + t[2] * 0.75 + 's-2 ' + t[2] * 0.2 + ' 0 ' + t[2] * 0.25 + '"/>'; }).join('') + '</svg>';
  /* CIRCULAR STRATEGY: a loop, never a line. Chairs ride round it through four stops (picked up, mended, used again, home), each stop changing them; a touch or a scroll spins it */
  var ORBIT = '<div class="st-orb" aria-hidden="true"><svg viewBox="-50 -50 100 100"><defs><filter id="st-ink" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale=".75"/></filter></defs><circle class="lp" r="40"/><path class="pn" d="M-9 -39C14 -43 41 -24 40.4 2S16 41.6 -2 40.2S-41 21 -40.3 -1.5S-27 -38.5 -3 -40.6S12 -39.5 16 -37.2"/><circle class="lp2" r="40"/><path class="cv" transform="rotate(45) translate(0 -40) rotate(90)" d="M-1.6 -2.2L1.2 0L-1.6 2.2"/><path class="cv" transform="rotate(135) translate(0 -40) rotate(90)" d="M-1.6 -2.2L1.2 0L-1.6 2.2"/><path class="cv" transform="rotate(225) translate(0 -40) rotate(90)" d="M-1.6 -2.2L1.2 0L-1.6 2.2"/><path class="cv" transform="rotate(315) translate(0 -40) rotate(90)" d="M-1.6 -2.2L1.2 0L-1.6 2.2"/><g class="st-nd n0" transform="translate(0 -40)"><g class="nd-in" style="--dx:0px;--dy:-20px;--k:0"><circle r="7.4"/><text>W</text></g></g><g class="st-nd n1" transform="translate(40 0)"><g class="nd-in" style="--dx:20px;--dy:0px;--k:1"><circle r="7.4"/><text>I</text></g></g><g class="st-nd n2" transform="translate(0 40)"><g class="nd-in" style="--dx:0px;--dy:20px;--k:2"><circle r="7.4"/><text>S</text></g></g><g class="st-nd n3" transform="translate(-40 0)"><g class="nd-in" style="--dx:-20px;--dy:0px;--k:3"><circle r="7.4"/><text>H</text></g></g></svg>' +
    '<div class="hm-pics"></div><i class="st-th" data-q="0"><img alt="" decoding="async" loading="lazy" src="/cards/chair-4-t.jpg"></i><i class="st-th" data-q="0"><img alt="" decoding="async" loading="lazy" src="/cards/chair-8-t.jpg"></i><i class="st-th" data-q="0"><img alt="" decoding="async" loading="lazy" src="/cards/chair-2-t.jpg"></i><i class="st-th" data-q="0"><img alt="" decoding="async" loading="lazy" src="/cards/chair-6-t.jpg"></i><b class="st-wd" aria-hidden="true"></b><b class="st-stg"><i>theories</i><i>beliefs</i><i>principles</i><i>behaviours</i></b></div>';
  /* DIRECT ACTION RADIO: a radar no one sees, sweeping the radio in the photograph; its play key breathing */
  /* a line in a made-up hand, written, crossed out, rubbed away, and another tried: the doubt before the poem, small, in the gap */
  var SWEEP = '<div class="rd-fx"><svg viewBox="-50 -50 100 100" aria-hidden="true"><defs><linearGradient id="rd-sw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="1" stop-color="#FFFFFF" stop-opacity=".75"/></linearGradient><pattern id="rd-px" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="3.3" height="3.3" fill="#FFFFFF" fill-opacity=".12" stroke="none"/></pattern></defs><circle r="46" fill="url(#rd-px)" stroke="none"/>' +
    '<circle r="16"/><circle r="30"/><circle r="46"/><path class="ax" d="M-48 0h96M0-48v96"/><g class="sw"><path d="M0 0L46 0A46 46 0 0 0 32.5 -32.5Z" fill="url(#rd-sw)"/></g></svg><button type="button" class="rd-mute" aria-pressed="false" aria-label="Sound" title="Sound"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="sp" d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path class="wv" d="M15.5 9.5c1.2 1.4 1.2 3.6 0 5M18 7c2.4 2.8 2.4 7.2 0 10"/><path class="x" d="M16 10l4.5 4.5M20.5 10L16 14.5"/></svg></button></div>';
  /* DESIGN PRINT: a big street poster pasted up on the white wall in the photograph, piece by piece, torn paper and glitched type */
  /* the poster's hero, pasted last: Design in a blackletter, acid lime, standing off the paper in depth. Its own layer, so the paper's
     multiply never dulls it; it glitches and is torn down with the rest */
  var ZHERO = '<svg class="zp-hero" viewBox="0 0 100 128" aria-hidden="true"><g class="zh-g" font-family="UnifrakturMaguntia, &#39;Old English Text MT&#39;, serif" font-size="27">' +
    [2.4, 2, 1.6, 1.2, 0.8, 0.4].map(function (d) { return '<text x="' + (24 + d * 0.6) + '" y="' + (20 + d) + '" fill="' + (d > 2 ? '#0B0B0B' : '#3D4A08') + '">Design</text>'; }).join('') +
    '<text x="24" y="20" fill="#DCFF1F" stroke="#0B0B0B" stroke-width=".35" paint-order="stroke">Design</text><text x="24" y="20" fill="none" stroke="#F6FFB8" stroke-width=".18" opacity=".55" transform="translate(-.25 -.3)">Design</text></g></svg>';
  var ZPOST = '<svg class="zp" viewBox="0 0 100 128" aria-hidden="true"><defs><filter id="zp-tx" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .1  0 0 0 0 .09  0 0 0 0 .08  0 0 0 -1.6 1.05"/></filter><filter id="zp-cr" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".035 .06" numOctaves="3" seed="9" result="n"/><feDiffuseLighting in="n" surfaceScale="2.4" lighting-color="#fff"><feDistantLight azimuth="235" elevation="52"/></feDiffuseLighting></filter><clipPath id="zp-ck"><path d="M4.0 64.0 9.9 63.6 20.0 63.6 26.3 61.2 33.6 61.1 40.0 60.0 49.8 61.7 58.7 62.0 68.5 62.1 79.9 61.5 90.0 63.0 90.2 68.8 89.6 75.9 88.0 78.8 87.8 86.8 88.0 92.0 81.4 93.3 78.1 97.3 71.0 100.5 65.0 102.1 60.0 104.0 53.0 105.0 49.0 107.7 43.2 107.2 36.3 108.2 30.0 110.0 24.4 108.0 22.3 107.1 17.5 105.4 11.7 100.9 8.0 100.0 7.0 92.1 5.5 85.3 6.0 78.4 4.2 72.3Z"/></clipPath><clipPath id="zp-pp"><path d="M0.0 0.0 9.9 0.1 20.6 -0.0 30.0 0.1 39.6 0.0 50.2 0.4 59.4 -0.3 69.4 0.4 80.3 -0.6 90.7 0.7 100.0 0.0 100.2 13.0 99.5 24.9 100.0 37.8 99.6 50.8 99.3 63.9 99.9 77.3 100.0 89.8 100.0 102.6 99.9 114.9 100.0 128.0 90.7 128.7 80.5 128.3 69.7 127.6 59.7 127.4 50.4 127.9 40.5 127.8 30.6 128.5 19.3 127.6 10.6 128.0 0.0 128.0 0.7 115.1 -0.6 102.6 0.4 89.3 -0.6 76.6 0.6 64.4 -0.5 50.8 -0.6 37.8 0.4 25.1 0.1 12.7Z"/></clipPath></defs><g clip-path="url(#zp-pp)"><path class="zp-p" style="--k:0" d="M0.0 0.0 9.9 0.1 20.6 -0.0 30.0 0.1 39.6 0.0 50.2 0.4 59.4 -0.3 69.4 0.4 80.3 -0.6 90.7 0.7 100.0 0.0 100.2 13.0 99.5 24.9 100.0 37.8 99.6 50.8 99.3 63.9 99.9 77.3 100.0 89.8 100.0 102.6 99.9 114.9 100.0 128.0 90.7 128.7 80.5 128.3 69.7 127.6 59.7 127.4 50.4 127.9 40.5 127.8 30.6 128.5 19.3 127.6 10.6 128.0 0.0 128.0 0.7 115.1 -0.6 102.6 0.4 89.3 -0.6 76.6 0.6 64.4 -0.5 50.8 -0.6 37.8 0.4 25.1 0.1 12.7Z" fill="#D7D3CA"/><g class="zp-p" style="--k:1" fill="#EF4A2C"><rect x="0" y="0" width="22" height="6"/><rect x="22" y="0.7" width="4.4" height="1.2"/><rect x="22" y="1.3" width="3.0" height="0.9"/><rect x="22" y="3.3" width="4.2" height="0.6"/><rect x="78" y="0" width="22" height="6"/><rect x="100" y="4.8" width="4.8" height="0.6"/><rect x="100" y="0.4" width="4.3" height="1.2"/><rect x="100" y="3.3" width="2.2" height="1.0"/><rect x="0" y="20" width="6" height="7"/><rect x="6" y="21.4" width="3.2" height="0.8"/><rect x="6" y="23.6" width="3.5" height="0.6"/><rect x="6" y="20.1" width="4.3" height="0.7"/><rect x="90" y="22" width="10" height="6"/><rect x="100" y="23.2" width="1.4" height="0.9"/><rect x="100" y="22.8" width="1.3" height="0.9"/><rect x="100" y="26.6" width="4.2" height="1.2"/><rect x="0" y="54" width="12" height="6"/><rect x="12" y="57.1" width="4.0" height="1.2"/><rect x="12" y="58.7" width="4.0" height="1.3"/><rect x="12" y="54.1" width="2.9" height="1.3"/><rect x="84" y="56" width="16" height="7"/><rect x="100" y="60.8" width="4.3" height="0.9"/><rect x="100" y="57.6" width="1.0" height="1.1"/><rect x="100" y="58.8" width="4.0" height="0.8"/><rect x="0" y="86" width="8" height="6"/><rect x="8" y="87.6" width="1.6" height="1.1"/><rect x="8" y="86.4" width="3.1" height="0.8"/><rect x="8" y="86.3" width="3.0" height="0.5"/><rect x="88" y="96" width="12" height="7"/><rect x="100" y="97.4" width="4.8" height="0.6"/><rect x="100" y="100.2" width="1.3" height="0.7"/><rect x="100" y="102.0" width="1.8" height="1.1"/><rect x="0" y="118" width="30" height="10"/><rect x="30" y="122.2" width="2.5" height="0.6"/><rect x="30" y="125.8" width="1.0" height="1.0"/><rect x="30" y="126.1" width="1.3" height="1.0"/><rect x="66" y="120" width="34" height="8"/><rect x="100" y="124.0" width="2.7" height="1.0"/><rect x="100" y="121.4" width="4.3" height="1.2"/><rect x="100" y="124.6" width="1.6" height="1.0"/></g><path class="zp-p" style="--k:2" d="M4.0 14.0 8.2 14.1 13.2 13.3 18.4 11.9 23.9 10.9 30.0 11.0 37.1 13.0 40.6 14.2 45.9 13.7 53.5 15.5 58.0 16.0 57.1 26.8 57.9 33.6 60.1 43.1 58.9 51.4 60.0 62.0 54.3 61.9 50.4 61.5 46.4 60.7 43.9 60.3 38.0 60.0 32.6 62.0 25.8 60.5 22.5 63.4 14.8 62.2 10.0 64.0 9.8 60.6 7.0 55.8 8.2 49.9 5.7 43.5 5.0 40.0 3.3 36.3 3.8 30.3 3.6 25.4 4.5 18.5Z" fill="#E4BD0C"/><path class="zp-p" style="--k:3" d="M26.0 3.0 33.8 4.3 42.3 3.4 52.6 5.9 61.5 4.7 70.0 6.0 76.5 4.7 78.9 4.5 85.4 3.5 89.8 4.0 96.0 4.0 96.6 8.1 96.4 15.6 98.6 20.1 98.2 25.1 98.0 30.0 96.1 34.2 95.0 42.4 96.2 48.2 93.4 52.8 94.0 58.0 86.3 59.5 78.3 61.1 69.9 60.5 64.3 62.4 56.0 62.0 50.9 61.8 45.3 61.6 38.2 60.2 34.0 59.9 27.0 58.0 26.6 47.9 27.7 36.2 26.8 24.6 26.4 14.3Z" fill="#1C3A96"/><path class="zp-p" style="--k:4" d="M4.0 64.0 9.9 63.6 20.0 63.6 26.3 61.2 33.6 61.1 40.0 60.0 49.8 61.7 58.7 62.0 68.5 62.1 79.9 61.5 90.0 63.0 90.2 68.8 89.6 75.9 88.0 78.8 87.8 86.8 88.0 92.0 81.4 93.3 78.1 97.3 71.0 100.5 65.0 102.1 60.0 104.0 53.0 105.0 49.0 107.7 43.2 107.2 36.3 108.2 30.0 110.0 24.4 108.0 22.3 107.1 17.5 105.4 11.7 100.9 8.0 100.0 7.0 92.1 5.5 85.3 6.0 78.4 4.2 72.3Z" fill="#1C3A96"/><g class="zp-p zp-ck" style="--k:5" clip-path="url(#zp-ck)"><circle cx="44" cy="103" r="24" fill="#D7D3CA"/><path class="zp-sp" d="M68.0 103.0 67.4 108.3 63.2 107.4 63.7 103.0ZM65.6 113.4 62.8 118.0 59.4 115.3 61.7 111.5ZM59.0 121.8 54.4 124.6 52.5 120.7 56.3 118.4ZM49.3 126.4 44.0 127.0 44.0 122.7 48.4 122.2ZM38.7 126.4 33.6 124.6 35.5 120.7 39.6 122.2ZM29.0 121.8 25.2 118.0 28.6 115.3 31.7 118.4ZM22.4 113.4 20.6 108.3 24.8 107.4 26.3 111.5ZM20.0 103.0 20.6 97.7 24.8 98.6 24.3 103.0ZM22.4 92.6 25.2 88.0 28.6 90.7 26.3 94.5ZM29.0 84.2 33.6 81.4 35.5 85.3 31.7 87.6ZM38.7 79.6 44.0 79.0 44.0 83.3 39.6 83.8ZM49.3 79.6 54.4 81.4 52.5 85.3 48.4 83.8ZM59.0 84.2 62.8 88.0 59.4 90.7 56.3 87.6ZM65.6 92.6 67.4 97.7 63.2 98.6 61.7 94.5ZM62.5 109.6 60.6 113.6 57.6 111.7 59.2 108.4ZM57.8 117.0 54.3 119.7 52.5 116.7 55.3 114.5ZM50.4 121.6 46.1 122.6 45.7 119.0 49.2 118.3ZM41.6 122.5 37.4 121.5 38.6 118.2 42.1 119.0ZM33.4 119.6 30.0 116.8 32.5 114.3 35.3 116.6ZM27.3 113.3 25.4 109.4 28.7 108.2 30.3 111.5ZM24.4 105.1 24.5 100.6 28.0 101.1 28.0 104.7ZM25.5 96.4 27.4 92.4 30.4 94.3 28.8 97.6ZM30.2 89.0 33.7 86.3 35.5 89.3 32.7 91.5ZM37.6 84.4 41.9 83.4 42.3 87.0 38.8 87.7ZM46.4 83.5 50.6 84.5 49.4 87.8 45.9 87.0ZM54.6 86.4 58.0 89.2 55.5 91.7 52.7 89.4ZM60.7 92.7 62.6 96.6 59.3 97.8 57.7 94.5ZM63.6 100.9 63.5 105.4 60.0 104.9 60.0 101.3ZM59.7 106.8 58.4 110.2 55.8 108.9 56.9 106.1ZM56.5 113.3 53.9 115.8 52.1 113.5 54.2 111.4ZM50.8 117.6 47.3 118.8 46.7 115.9 49.6 115.0ZM43.7 119.1 40.2 118.7 40.9 115.9 43.8 116.2ZM36.8 117.4 33.7 115.5 35.6 113.2 38.1 114.8ZM31.2 112.9 29.4 109.8 32.0 108.6 33.5 111.1ZM28.2 106.3 27.9 102.7 30.8 102.8 31.1 105.7ZM28.3 99.2 29.6 95.8 32.2 97.1 31.1 99.9ZM31.5 92.7 34.1 90.2 35.9 92.5 33.8 94.6ZM37.2 88.4 40.7 87.2 41.3 90.1 38.4 91.0ZM44.3 86.9 47.8 87.3 47.1 90.1 44.2 89.8ZM51.2 88.6 54.3 90.5 52.4 92.8 49.9 91.2ZM56.8 93.1 58.6 96.2 56.0 97.4 54.5 94.9ZM59.8 99.7 60.1 103.3 57.2 103.2 56.9 100.3ZM55.0 110.3 53.1 112.6 51.5 110.9 53.1 109.0ZM50.8 114.4 48.1 115.6 47.3 113.3 49.6 112.3ZM45.2 116.2 42.2 116.1 42.5 113.8 45.0 113.8ZM39.3 115.4 36.7 114.0 38.0 112.1 40.2 113.2ZM34.4 112.1 32.6 109.8 34.7 108.6 36.1 110.5ZM31.4 107.1 30.8 104.2 33.2 104.0 33.7 106.3ZM30.9 101.2 31.6 98.3 33.8 99.2 33.2 101.5ZM33.0 95.7 34.9 93.4 36.5 95.1 34.9 97.0ZM37.2 91.6 39.9 90.4 40.7 92.7 38.4 93.7ZM42.8 89.8 45.8 89.9 45.5 92.2 43.0 92.2ZM48.7 90.6 51.3 92.0 50.0 93.9 47.8 92.8ZM53.6 93.9 55.4 96.2 53.3 97.4 51.9 95.5ZM56.6 98.9 57.2 101.8 54.8 102.0 54.3 99.7ZM57.1 104.8 56.4 107.7 54.2 106.8 54.8 104.5ZM53.6 108.0 52.3 110.0 50.8 108.8 51.9 107.1ZM50.5 111.7 48.4 112.9 47.6 111.1 49.3 110.1ZM46.1 113.6 43.7 113.8 43.7 111.9 45.7 111.7ZM41.3 113.5 39.0 112.6 39.9 110.9 41.8 111.6ZM37.0 111.3 35.3 109.5 36.9 108.3 38.2 109.8ZM34.1 107.4 33.4 105.1 35.3 104.7 35.9 106.6ZM33.2 102.7 33.5 100.3 35.4 100.8 35.1 102.7ZM34.4 98.0 35.7 96.0 37.2 97.2 36.1 98.9ZM37.5 94.3 39.6 93.1 40.4 94.9 38.7 95.9ZM41.9 92.4 44.3 92.2 44.3 94.1 42.3 94.3ZM46.7 92.5 49.0 93.4 48.1 95.1 46.2 94.4ZM51.0 94.7 52.7 96.5 51.1 97.7 49.8 96.2ZM53.9 98.6 54.6 100.9 52.7 101.3 52.1 99.4ZM54.8 103.3 54.5 105.7 52.6 105.2 52.9 103.3ZM50.0 109.5 48.4 110.7 47.6 109.3 49.0 108.4ZM46.6 111.5 44.7 111.9 44.5 110.3 46.1 110.0ZM42.7 111.8 40.7 111.3 41.3 109.8 42.9 110.2ZM39.0 110.3 37.5 109.0 38.6 108.0 39.9 109.0ZM36.3 107.4 35.5 105.6 37.0 105.1 37.7 106.6ZM35.1 103.7 35.2 101.7 36.8 101.9 36.7 103.5ZM35.7 99.7 36.7 98.0 38.0 98.9 37.2 100.3ZM38.0 96.5 39.6 95.3 40.4 96.7 39.0 97.6ZM41.4 94.5 43.3 94.1 43.5 95.7 41.9 96.0ZM45.3 94.2 47.3 94.7 46.7 96.2 45.1 95.8ZM49.0 95.7 50.5 97.0 49.4 98.0 48.1 97.0ZM51.7 98.6 52.5 100.4 51.0 100.9 50.3 99.4ZM52.9 102.3 52.8 104.3 51.2 104.1 51.3 102.5ZM52.3 106.3 51.3 108.0 50.0 107.1 50.8 105.7ZM49.5 107.8 48.3 108.9 47.5 107.8 48.5 106.9ZM46.9 109.7 45.3 110.2 45.1 108.9 46.3 108.5ZM43.7 110.3 42.0 110.0 42.4 108.8 43.7 109.0ZM40.5 109.4 39.2 108.5 40.1 107.5 41.2 108.3ZM38.1 107.3 37.3 105.9 38.5 105.3 39.2 106.5ZM36.8 104.3 36.7 102.7 38.0 102.7 38.1 104.1ZM37.0 101.0 37.6 99.5 38.7 100.2 38.2 101.4ZM38.5 98.2 39.7 97.1 40.5 98.2 39.5 99.1ZM41.1 96.3 42.7 95.8 42.9 97.1 41.7 97.5ZM44.3 95.7 46.0 96.0 45.6 97.2 44.3 97.0ZM47.5 96.6 48.8 97.5 47.9 98.5 46.8 97.7ZM49.9 98.7 50.7 100.1 49.5 100.7 48.8 99.5ZM51.2 101.7 51.3 103.3 50.0 103.3 49.9 101.9ZM51.0 105.0 50.4 106.5 49.3 105.8 49.8 104.6ZM46.9 108.2 45.7 108.7 45.4 107.7 46.4 107.3ZM44.3 109.0 43.0 108.9 43.2 107.8 44.3 107.9ZM41.7 108.5 40.5 107.9 41.2 107.0 42.1 107.5ZM39.5 107.0 38.8 105.9 39.7 105.4 40.3 106.3ZM38.3 104.7 38.0 103.3 39.1 103.3 39.3 104.4ZM38.1 102.0 38.5 100.7 39.5 101.1 39.2 102.2ZM39.1 99.5 40.0 98.5 40.7 99.3 40.0 100.2ZM41.1 97.8 42.3 97.3 42.6 98.3 41.6 98.7ZM43.7 97.0 45.0 97.1 44.8 98.2 43.7 98.1ZM46.3 97.5 47.5 98.1 46.8 99.0 45.9 98.5ZM48.5 99.0 49.2 100.1 48.3 100.6 47.7 99.7ZM49.7 101.3 50.0 102.7 48.9 102.7 48.7 101.6ZM49.9 104.0 49.5 105.3 48.5 104.9 48.8 103.8ZM48.9 106.5 48.0 107.5 47.3 106.7 48.0 105.8ZM46.8 107.0 45.8 107.5 45.5 106.7 46.3 106.3ZM44.8 107.8 43.7 107.9 43.7 107.0 44.6 107.0ZM42.6 107.7 41.6 107.3 42.0 106.5 42.9 106.9ZM40.7 106.6 40.0 105.8 40.7 105.3 41.3 106.0ZM39.5 104.8 39.2 103.8 40.0 103.6 40.3 104.5ZM39.1 102.7 39.3 101.6 40.1 101.9 40.0 102.7ZM39.7 100.6 40.4 99.7 41.0 100.3 40.5 101.0ZM41.2 99.0 42.2 98.5 42.5 99.3 41.7 99.7ZM43.2 98.2 44.3 98.1 44.3 99.0 43.4 99.0ZM45.4 98.3 46.4 98.7 46.0 99.5 45.1 99.1ZM47.3 99.4 48.0 100.2 47.3 100.7 46.7 100.0ZM48.5 101.2 48.8 102.2 48.0 102.4 47.7 101.5ZM48.9 103.3 48.7 104.4 47.9 104.1 48.0 103.3ZM48.3 105.4 47.6 106.3 47.0 105.7 47.5 105.0ZM45.1 106.9 44.2 107.0 44.1 106.3 44.9 106.2ZM43.3 107.0 42.4 106.7 42.7 106.0 43.4 106.2ZM41.6 106.2 41.0 105.6 41.5 105.2 42.1 105.7ZM40.5 104.9 40.1 104.1 40.8 103.9 41.1 104.6ZM40.0 103.2 40.0 102.3 40.8 102.4 40.7 103.1ZM40.3 101.4 40.8 100.6 41.3 101.1 41.0 101.7ZM41.4 100.0 42.1 99.5 42.4 100.1 41.8 100.5ZM42.9 99.1 43.8 99.0 43.9 99.7 43.1 99.8ZM44.7 99.0 45.6 99.3 45.3 100.0 44.6 99.8ZM46.4 99.8 47.0 100.4 46.5 100.8 45.9 100.3ZM47.5 101.1 47.9 101.9 47.2 102.1 46.9 101.4ZM48.0 102.8 48.0 103.7 47.2 103.6 47.3 102.9ZM47.7 104.6 47.2 105.4 46.7 104.9 47.0 104.3ZM46.6 106.0 45.9 106.5 45.6 105.9 46.2 105.5ZM45.2 106.1 44.5 106.3 44.4 105.7 45.0 105.5ZM43.7 106.3 43.0 106.1 43.2 105.6 43.8 105.7ZM42.3 105.9 41.7 105.4 42.2 105.0 42.6 105.3ZM41.3 104.8 40.9 104.2 41.5 104.0 41.8 104.5ZM40.7 103.5 40.7 102.7 41.3 102.8 41.3 103.4ZM40.9 102.0 41.1 101.3 41.7 101.6 41.4 102.2ZM41.6 100.7 42.2 100.3 42.5 100.8 42.0 101.2ZM42.8 99.9 43.5 99.7 43.6 100.3 43.0 100.5ZM44.3 99.7 45.0 99.9 44.8 100.4 44.2 100.3ZM45.7 100.1 46.3 100.6 45.8 101.0 45.4 100.7ZM46.7 101.2 47.1 101.8 46.5 102.0 46.2 101.5ZM47.3 102.5 47.3 103.3 46.7 103.2 46.7 102.6ZM47.1 104.0 46.9 104.7 46.3 104.4 46.6 103.8ZM46.4 105.3 45.8 105.7 45.5 105.2 46.0 104.8ZM44.1 105.7 43.5 105.7 43.6 105.2 44.1 105.2ZM42.9 105.5 42.4 105.2 42.7 104.8 43.1 105.0ZM41.9 104.7 41.6 104.2 42.0 104.0 42.3 104.4ZM41.4 103.7 41.3 103.1 41.8 103.1 41.9 103.6ZM41.3 102.5 41.5 101.9 42.0 102.1 41.8 102.6ZM41.8 101.4 42.3 100.9 42.6 101.3 42.2 101.7ZM42.8 100.6 43.3 100.4 43.4 100.9 43.0 101.0ZM43.9 100.3 44.5 100.3 44.4 100.8 43.9 100.8ZM45.1 100.5 45.6 100.8 45.3 101.2 44.9 101.0ZM46.1 101.3 46.4 101.8 46.0 102.0 45.7 101.6ZM46.6 102.3 46.7 102.9 46.2 102.9 46.1 102.4ZM46.7 103.5 46.5 104.1 46.0 103.9 46.2 103.4ZM46.2 104.6 45.7 105.1 45.4 104.7 45.8 104.3ZM45.2 105.4 44.7 105.6 44.6 105.1 45.0 105.0Z" fill="#EF4A2C"/></g><g class="zp-p zp-ty" style="--k:6" font-family="&#39;Times New Roman&#39;,Times,&#39;Nimbus Roman&#39;,serif" font-size="19" letter-spacing="-1.1"><text x="27" y="33" fill="#CFC8B3" textLength="66" lengthAdjust="spacingAndGlyphs">print it</text><text x="27" y="49" fill="#CFC8B3" textLength="56" lengthAdjust="spacingAndGlyphs">paste it</text></g><g class="zp-p" style="--k:7"><text x="26" y="60" font-family="&#39;Arial Black&#39;,&#39;Helvetica Neue&#39;,Arial,sans-serif" font-weight="900" font-style="italic" font-size="13" fill="#CFC8B3" stroke="#0B0B0B" stroke-width=".25" textLength="70" lengthAdjust="spacingAndGlyphs" transform="skewX(-8) translate(8 0)">ZINE</text></g><g class="zp-p zp-gl" style="--k:8" font-family="&#39;Helvetica Neue&#39;,Helvetica,Arial,sans-serif" font-size="8.4" letter-spacing="-.25"><rect x="18" y="67" width="76" height="9" fill="#CFC8B3"/><rect x="84" y="67" width="16" height="9" fill="#0B0B0B"/><text x="20" y="74.6" fill="#1C3A96" textLength="78" lengthAdjust="spacingAndGlyphs">80 mm thermal</text><rect x="18" y="79" width="76" height="9" fill="#CFC8B3"/><rect x="84" y="79" width="16" height="9" fill="#0B0B0B"/><text x="20" y="86.6" fill="#1C3A96" textLength="78" lengthAdjust="spacingAndGlyphs">80 mm thermal</text></g><g class="zp-p" style="--k:9" font-family="&#39;Times New Roman&#39;,Times,&#39;Nimbus Roman&#39;,serif" font-size="10" letter-spacing="-.5" fill="#0B0B0B"><text x="3" y="114" textLength="34" lengthAdjust="spacingAndGlyphs">novel</text><text x="3" y="123" textLength="38" lengthAdjust="spacingAndGlyphs">.global</text><text x="58" y="123" font-family="&#39;Arial Black&#39;,&#39;Helvetica Neue&#39;,Arial,sans-serif" font-weight="900" font-style="italic" font-size="9.4" letter-spacing="-.4" textLength="39" lengthAdjust="spacingAndGlyphs">DA·0080</text></g><g class="zp-sl" fill="#EF4A2C"><rect x="0" y="40" width="100" height="1.6"/><rect x="0" y="92" width="100" height="1.2" fill="#1C3A96"/></g><rect class="zp-cr" width="100" height="128" filter="url(#zp-cr)"/><rect class="zp-tx" width="100" height="128" filter="url(#zp-tx)"/></g></svg>';
  /* RESEARCH BOARD: three of novel.global's reference pictures pinned up */
  var REFAT = [[4, 2, 44, 635 / 521], [56, 8, 36, 700 / 501], [26, 60, 40, 300 / 450]];
  var REFC = REFAT.map(function (p) { return [p[0] + p[2] / 2, p[1] + p[2] * p[3] / 2]; });
  var THEMES = ['RANGIWAHIA', 'SYNERGY', 'PRAXIS', 'SPECULATIVE', 'FUTURES', 'KINSHIP', 'COMMONS'];
  /* each reference picture: a word on hover, and where a touch takes you; novel.global can rewrite these (PHOTOS: a name, a link, the word) */
  var PLINK0 = { cathaya: { u: 'https://www.erinforsyth.com', w: 'Erin Forsyth' }, moa: { w: 'reenactment' }, cells: { u: 'https://en.wikipedia.org/wiki/Cargo_cult', w: 'memory' } }, PLINK = PLINK0;
  function photoLinks(txt) { var o = {}; Object.keys(PLINK0).forEach(function (k) { o[k] = PLINK0[k]; });
    String(txt || '').split('\n').forEach(function (l) { var m = /^\s*([a-z0-9-]{1,24})\s*(https:\/\/[^\s"<>]+)?\s*(.*)$/i.exec(l); if (!m || (!m[2] && !m[3].trim())) return; o[m[1].toLowerCase()] = { u: m[2] || '', w: m[3].trim().slice(0, 60) }; }); PLINK = o; }
  function refs() { var R = Math.random, P = REFC, path = '';
    [[0, 1], [0, 2], [1, 2]].forEach(function (q, n) { var a = P[q[0]], b = P[q[1]], k = 1 + Math.floor(R() * 2);
      for (var j = 0; j < k; j++) { var bow = (R() - 0.5) * 26, mx = (a[0] + b[0]) / 2 + bow, my = (a[1] + b[1]) / 2 + bow * 0.6;
        path += '<path pathLength="1" class="' + (j ? 'ds' : n === 1 ? 'lm' : '') + '" style="--d:' + (n * 0.3 + j * 0.2).toFixed(2) + 's" d="M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + 'Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1) + '"/>'; } });
    var th = THEMES[Math.floor(R() * THEMES.length)];
    return '<div class="rb-refs"><svg viewBox="0 0 100 100" aria-hidden="true">' + path + '</svg>' + ['moa', 'cathaya', 'cells'].map(function (n, k) { var p = REFAT[k], L = PLINK[n] || {}, st = 'left:' + p[0] + '%;top:' + p[1] + 'cqw;width:' + p[2] + '%;--r:' + [-2.2, 1.6, -0.8][k] + 'deg', im = '<img alt="" decoding="async" loading="lazy" src="/cards/ref-' + n + '.jpg">';
      return L.u ? '<a class="rf" href="' + esc(L.u) + '" target="_blank" rel="noopener" title="' + esc(L.w || '') + '" aria-label="' + esc(L.w || L.u) + '" style="' + st + '">' + im + '</a>' : '<i class="rf" data-open="research" title="' + esc(L.w || '') + '" style="' + st + '">' + im + '</i>'; }).join('') +
      '<b class="rb-word" style="right:' + (5 + R() * 8).toFixed(1) + '%;top:' + (-11 + R() * 3).toFixed(1) + 'cqw;--r:' + ((R() - 0.5) * 9).toFixed(1) + 'deg">' + th + '</b></div>'; }
  /* ISLAND ARCHIPELAGOS: the coast from above in the sea's blue, its cells drifting, islands joined */
  var SEA = '<div class="sp-sea" aria-hidden="true"><img class="sp-coast" alt="" decoding="async" loading="lazy" src="/cards/ref-coast.jpg"><img class="sp-cells" alt="" decoding="async" loading="lazy" src="/cards/ref-cells.jpg">' +
    '<svg class="sp-isles" viewBox="0 0 100 160" preserveAspectRatio="xMidYMid slice"><path d="M22 30L48 52L78 40M48 52L36 84L66 96L84 74M36 84L18 112L50 128"/>' +
    [[22, 30], [48, 52], [78, 40], [36, 84], [66, 96], [84, 74], [18, 112], [50, 128]].map(function (p, k) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (k ? 1.2 : 1.9) + '"' + (k ? '' : ' class="me"') + ' style="--k:' + k + '"/>'; }).join('') + '</svg></div>';
  /* DIRECT ACTION RADIO: the reef's water painted on down into the card, and a solar beacon riding it: a panel, its wires, the two radios strapped to its mast, a lamp that calls */
  var RS = { muted: true, scrap: true, cv: null, io: null, on: true, w: 0, h: 0, k: 1, E: 1, base: null, nt: null, snow: [], rip: [], rt: 0, drawn: false };
  function rrect(g, x, y, w, h, r) { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); }
  function rsBase(w, h, E) {
    var c = D.createElement('canvas'), k = RS.k; c.width = Math.round(w * k); c.height = Math.round(h * k); var g = c.getContext('2d'), r = rnd(301), sea = NIGHT ? '#06152A' : '#17457F', lit = NIGHT ? '#0E2B52' : '#1E58A8', bw = E * 0.34;
    g.scale(k, k); g.fillStyle = sea; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, 0); for (var fx = w + 8; fx >= -8; fx -= 8) g.lineTo(fx, E - bw * 0.2 + Math.sin(fx * 0.0042 + 1.3) * bw * 0.22); g.closePath(); g.fill(); g.lineCap = 'round';
    /* one wide stroke of paint along its foot: full bristles above, dry and broken below */
    for (var b = 0; b < 72; b++) { var q = b / 71, y = E - bw * 0.5 + q * bw * 0.95, dry = q > 0.6, x0 = -14 + r() * 4, xe = w + 8 - (dry ? r() * w * 0.45 : r() * 10), pen = false;
      g.strokeStyle = r() < 0.2 ? lit : sea; g.lineWidth = 1.2 + r() * 2.4; g.globalAlpha = dry ? 0.4 + r() * 0.55 : 1; g.beginPath();
      for (var x = x0; x <= xe; x += 9) { var yy = y + Math.sin(x * 0.011 + b * 0.07) * 2.4 + Math.sin(x * 0.0042 + 1.3) * bw * 0.22;
        if (dry && r() < 0.07) { pen = false; continue; } if (pen) g.lineTo(x, yy); else { g.moveTo(x, yy); pen = true; } }
      g.stroke(); }
    g.globalAlpha = 1; g.fillStyle = sea;
    for (var d = 0; d < 2; d++) { var dx = w * (0.6 + r() * 0.32), dy = E + Math.sin(dx * 0.0042 + 1.3) * bw * 0.22 + bw * 0.3, L = 6 + r() * 14; g.beginPath(); g.moveTo(dx - 2, dy - 4); g.quadraticCurveTo(dx - 1.6, dy + L * 0.6, dx, dy + L); g.quadraticCurveTo(dx + 1.6, dy + L * 0.6, dx + 2, dy - 4); g.fill(); g.beginPath(); g.arc(dx, dy + L, 1.6, 0, 7); g.fill(); }
    g.globalCompositeOperation = 'source-atop';
    for (var s = 0; s < 4; s++) { var sx = w * (0.05 + r() * 0.9); g.fillStyle = 'rgba(160,200,255,' + (NIGHT ? 0.03 : 0.06) + ')'; g.beginPath(); g.moveTo(sx, 0); g.lineTo(sx + 26, 0); g.lineTo(sx + 90 + r() * 50, E * 1.3); g.lineTo(sx + 40, E * 1.3); g.closePath(); g.fill(); }
    grain(g, w, h, Math.round(w * E / 40), 'rgba(255,255,255,.16)', 302, 1.4); grain(g, w, h, Math.round(w * E / 90), 'rgba(4,14,30,.3)', 303, 1.6);
    g.globalCompositeOperation = 'source-over'; flaws(g, w, h, 304, 0.22);
    return c;
  }
  addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('.rd-nino'); if (!b) return; e.preventDefault(); e.stopPropagation(); RS.nino = !RS.nino; RS.drawn = false; b.setAttribute('aria-pressed', String(RS.nino)); beep(RS.nino ? 196 : 523, RS.nino ? 0.18 : 0.06); if (RS.nino) muteSet(false); if (!RS.song) songOn(); }, true);
  /* the sound key: the song turns on the radar always; this lets it be heard. El Niño unmutes it and doubles its pace to 120 */
  function muteSet(m) { RS.muted = m; if (!m) ac(); $$('.rd-mute').forEach(function (b) { b.setAttribute('aria-pressed', String(!m)); b.title = m ? 'Sound' : 'Mute'; }); }
  addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('.rd-mute'); if (!b) return; e.preventDefault(); e.stopPropagation(); muteSet(!RS.muted); if (!RS.song) songOn(); }, true);
  /* El Niño on the buoy: a small song dropped at random on the radar, the hand at its fast turn (two bars of 120, a note on a sixteenth as the hand
     crosses it), timed by the sound's own clock; off, it stops and the radar is as it was. Off screen or behind an experience it waits */
  var SONG_TURN = 4, PENTA = [0, 3, 5, 7, 10, 12, 15, 17];
  function songOn() { var svg = col.querySelector('.sk-radio .rd-fx svg'); if (!svg) return; songOff(); var at = {}, n = 6 + Math.floor(Math.random() * 4), notes = [];
    while (notes.length < n) { var k = Math.floor(Math.random() * 32); if (at[k]) continue; at[k] = 1; notes.push({ k: k, a: k / 32 * 360, r: 14 + Math.random() * 30, f: 110 * Math.pow(2, PENTA[Math.floor(Math.random() * PENTA.length)] / 12), d: Math.random() < 0.3 ? 2 : 1 }); }
    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('class', 'sg');
    g.innerHTML = notes.map(function (o, i) { var x = (o.r * Math.cos(o.a * Math.PI / 180)).toFixed(2), y = (o.r * Math.sin(o.a * Math.PI / 180)).toFixed(2); return '<rect x="' + (x - 1.6 * o.d) + '" y="' + (y - 1.6 * o.d) + '" width="' + (3.2 * o.d) + '" height="' + (3.2 * o.d) + '" style="animation-delay:' + (i * 0.07) + 's"/>'; }).join('');
    svg.appendChild(g); RS.song = { notes: notes, g: g, sw: svg.querySelector('.sw'), ph: 0, lt: 0, lk: -1 }; }
  function songOff() { var S = RS.song; if (!S) return; RS.song = null; S.g.remove(); S.sw.style.animation = ''; S.sw.style.transform = ''; }
  function songNote(c, f, t, d) { var o = c.createOscillator(), o2 = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain(), len = 0.22 * d + 0.12;
    o.type = 'triangle'; o.frequency.value = f; o2.type = 'sine'; o2.frequency.value = f / 2; lp.type = 'lowpass'; lp.frequency.setValueAtTime(2600, t); lp.frequency.exponentialRampToValueAtTime(500, t + len);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(lp); o2.connect(lp); lp.connect(g).connect(c.destination); o.start(t); o2.start(t); o.stop(t + len + 0.05); o2.stop(t + len + 0.05); }
  /* the hand's turn: 8 s at rest, 4 s (two bars of 120) in El Niño; the notes sound as it crosses them, only while unmuted */
  function songTick() { var S = RS.song; if (!S) return; if (!S.g.isConnected) { songOn(); return; } var now = performance.now() / 1000, T = RS.nino ? SONG_TURN : SONG_TURN * 2;
    if (S.lt) S.ph += Math.min(0.1, now - S.lt) / T; S.lt = now; var f = S.ph % 1, k = Math.floor(f * 32);
    if (k !== S.lk) { if (!RS.muted && !(AIR.kept && AIR.on) && !(SND && SND.a)) { var c = ac(); if (c && c.state === 'running') S.notes.forEach(function (o) { if (o.k === k) songNote(c, o.f, c.currentTime + 0.02, o.d * (RS.nino ? 1 : 1.6)); }); } S.lk = k; }
    var th = f * 360; S.sw.style.animation = 'none'; S.sw.style.transform = 'rotate(' + th.toFixed(1) + 'deg)';
    var rs = S.g.children; for (var i = 0; i < rs.length; i++) { var d = (th - S.notes[i].a + 360) % 360; rs[i].classList.toggle('on', d < 40); } }
  /* the buoy as found things: a jerrycan for its float, a bent pole, a cracked panel tied on, a jar for its lamp, a coat hanger for an aerial; drawn by hand, nothing quite straight */
  function hand(g, P, seed, n) { var r = rnd(seed); for (var p = 0; p < (n || 2); p++) { g.beginPath(); P.forEach(function (q, i) { var x = q[0] + (r() - 0.5) * 1.3, y = q[1] + (r() - 0.5) * 1.3; if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.globalAlpha = p ? 0.4 : 1; g.stroke(); } g.globalAlpha = 1; }
  function specks(g, x, y, w, h, n, cols, seed, rs) { var r = rnd(seed); for (var i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; g.globalAlpha = 0.35 + r() * 0.5; g.beginPath(); g.arc(x + r() * w, y + r() * h, (0.3 + r() * 0.8) * rs, 0, 7); g.fill(); } g.globalAlpha = 1; }
  function scrapBuoy(g, u, t, sw, heat) {
    var RU = '#8C4A26', RL = '#C77A48', VG = '#6FA595', RP = '#B9A47A', TP = '#CDBD8C', PL = '#DCD6C4';
    g.lineCap = 'round'; g.lineJoin = 'round';
    /* the banner: a long strip of black cloth on a driftwood staff, flying off the can, the card's name set along it */
    var fx = 26 * u, fy = -64 * u, FW = Math.max(60 * u, Math.min(160 * u, (RS.w || 300) - fx + 5 * u - 14)), FH = 15 * u, N = 24, wv = function (k) { return Math.sin(t * 1.9 - k * 0.42) * k / N * 3.2 * u + Math.sin(t * 3.1 - k * 0.9) * k / N * 0.9 * u; }, dy = function (k) { return k / N * 3 * u; };
    g.strokeStyle = '#8A6A44'; g.lineWidth = 1.7 * u; hand(g, [[15 * u, -4 * u], [21 * u, -50 * u], [fx, fy - 3 * u]], 420);
    g.fillStyle = '#121212'; g.beginPath(); g.moveTo(fx, fy);
    for (var k = 1; k <= N; k++) g.lineTo(fx + FW * k / N, fy + wv(k) + dy(k));
    g.lineTo(fx + FW - 7 * u, fy + FH / 2 + wv(N - 1) + dy(N));
    for (var k2 = N; k2 >= 0; k2--) g.lineTo(fx + FW * k2 / N, fy + FH + wv(k2) + dy(k2) * 0.8);
    g.closePath(); g.fill();
    var ttl = String(((typeof byId === 'function' && byId('radio')) || {}).title || 'DIRECT ACTION RADIO').toUpperCase(), n = ttl.length, x0 = fx + 3 * u, span = FW - 12 * u, fs = Math.min(FH * 0.68, span / n * 1.75);
    g.font = '600 ' + fs.toFixed(1) + 'px "Archivo Narrow", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    var tw = g.measureText(ttl).width, sc = Math.min(1, span / tw), cx0 = x0 + (span - tw * sc) / 2, last = ttl.lastIndexOf(' ');
    var tan = t * 0.85, tcs = Math.cos(tan), TBL = 190 * u * Math.abs(tcs) + 8 * u, lit = function (x) { if (!NIGHT) return 1; var d = x - 2 * u; return tcs > 0 ? Math.max(0.03, Math.min(1, (TBL - d) / (24 * u)) * (0.5 + 0.5 * tcs)) : 0.03; };
    for (var ci = 0, acc = 0; ci < n; ci++) { var ch = ttl[ci], cw = g.measureText(ch).width * sc, lx2 = cx0 + acc + cw / 2, kk = (lx2 - fx) / FW * N; acc += cw; if (ch === ' ') continue;
      var sl = (wv(kk + 0.5) - wv(kk - 0.5)) / (FW / N); g.save(); g.translate(lx2, fy + FH / 2 + wv(kk) + dy(kk) * 0.9); g.rotate(Math.atan(sl)); g.scale(sc, 1); g.fillStyle = ci > last ? '#FF6B1A' : '#F1F0EC'; g.globalAlpha = lit(lx2); g.fillText(ch, 0, 0); g.restore(); }
    g.textAlign = 'start'; g.textBaseline = 'alphabetic';
    /* a rope down to a brick */
    g.strokeStyle = RP; g.lineWidth = 0.9 * u; hand(g, [[0, 8 * u], [-1.2 * u, 15 * u], [-0.6 * u, 22 * u]], 401);
    g.fillStyle = '#8E4A32'; g.save(); g.translate(-0.6 * u, 24 * u); g.rotate(0.08); g.fillRect(-4.5 * u, -2 * u, 9 * u, 4 * u); g.strokeStyle = 'rgba(230,220,200,.5)'; g.lineWidth = 0.4 * u; g.beginPath(); g.moveTo(-4.5 * u, 0); g.lineTo(4.5 * u, 0); g.moveTo(0, -2 * u); g.lineTo(0, 0); g.stroke(); g.restore();
    /* a driftwood strut, the bent pole, rust and verdigris on it */
    g.strokeStyle = '#A08058'; g.lineWidth = 1.5 * u; hand(g, [[-15 * u, -6 * u], [-8 * u, -18 * u], [-1 * u, -31 * u]], 402);
    var pole = [[0, -6 * u], [0.5 * u, -24 * u], [1.8 * u, -38 * u], [1.2 * u, -52 * u], [1.6 * u, -66 * u]];
    g.strokeStyle = RU; g.lineWidth = 2.4 * u; hand(g, pole, 403, 1); g.strokeStyle = RL; g.lineWidth = 0.7 * u; hand(g, pole.map(function (q) { return [q[0] - 0.7 * u, q[1]]; }), 404, 1);
    specks(g, -1 * u, -64 * u, 3.4 * u, 58 * u, 26, [VG, '#5A2E18', RL], 405, u);
    g.fillStyle = RU; g.globalAlpha = 0.7; g.beginPath(); g.moveTo(1.4 * u, -38 * u); g.quadraticCurveTo(2.4 * u, -34 * u, 1.9 * u, -32 * u); g.quadraticCurveTo(1.2 * u, -34 * u, 1.4 * u, -38 * u); g.fill(); g.globalAlpha = 1;
    /* the panel: salvaged, one cell gone, a crack across another, cable-tied to a bent bar */
    g.strokeStyle = '#6B5A4A'; g.lineWidth = 1 * u; hand(g, [[1.5 * u, -64 * u], [-4 * u, -68 * u], [-9 * u, -73 * u]], 406);
    g.save(); g.translate(-12 * u, -76 * u); g.rotate(-0.38 + sw * 0.012); g.transform(1, 0.04, -0.06, 1, 0, 0); var pw = 36 * u, ph = 14 * u;
    g.fillStyle = '#7A4A2E'; g.fillRect(-pw / 2 - 1.3 * u, -ph / 2 - 1.3 * u, pw + 2.6 * u, ph + 2.6 * u);
    var pg = g.createLinearGradient(0, -ph / 2, 0, ph / 2); pg.addColorStop(0, '#22345C'); pg.addColorStop(1, '#0D1428'); g.fillStyle = pg; g.fillRect(-pw / 2, -ph / 2, pw, ph);
    var cw = pw / 6; g.fillStyle = '#2A2622'; g.fillRect(-pw / 2 + cw * 4, -ph / 2, cw, ph / 2);
    g.strokeStyle = 'rgba(140,175,230,.45)'; g.lineWidth = Math.max(0.5, 0.35 * u); g.beginPath(); for (var c = 1; c < 6; c++) { g.moveTo(-pw / 2 + cw * c, -ph / 2); g.lineTo(-pw / 2 + cw * c, ph / 2); } g.moveTo(-pw / 2, 0); g.lineTo(pw / 2, 0); g.stroke();
    g.strokeStyle = 'rgba(240,235,220,.7)'; g.lineWidth = 0.4 * u; g.beginPath(); g.moveTo(-pw / 2 + cw * 1.2, -ph / 2); g.lineTo(-pw / 2 + cw * 1.6, -ph * 0.1); g.lineTo(-pw / 2 + cw * 1.3, ph * 0.2); g.lineTo(-pw / 2 + cw * 1.9, ph / 2); g.stroke();
    g.save(); g.beginPath(); g.rect(-pw / 2, -ph / 2, pw, ph); g.clip(); var gl = ((t * 0.09) % 1.8 - 0.4) * pw * 1.4 - pw / 2; g.fillStyle = 'rgba(255,250,235,.22)'; g.beginPath(); g.moveTo(gl, -ph / 2); g.lineTo(gl + 5 * u, -ph / 2); g.lineTo(gl - 2 * u, ph / 2); g.lineTo(gl - 7 * u, ph / 2); g.closePath(); g.fill(); g.restore();
    specks(g, -pw / 2 - 1.3 * u, -ph / 2 - 1.3 * u, pw + 2.6 * u, 2 * u, 10, [VG, RL], 407, u);
    g.restore();
    /* the wires: odd ones, one taped where it was mended */
    var wire = function (col, a, b, c2, lw) { g.strokeStyle = col; g.lineWidth = lw * u; g.beginPath(); g.moveTo(a[0] * u, a[1] * u); g.quadraticCurveTo(c2[0] * u, (c2[1] + sw * 1.4) * u, b[0] * u, b[1] * u); g.stroke(); };
    wire('#B23A2E', [-4, -71], [12, -50], [6, -58], 0.8); wire('#2B2B2B', [7, -39], [-9, -29], [4, -30], 0.8); wire('#D8A23A', [-17, -22], [-12, -7], [-28, -12], 0.9); wire('#4C6E9E', [14, -39], [9, -7], [20, -18], 0.7);
    g.fillStyle = TP; g.save(); g.translate(4.6 * u, (-58.6 + sw * 0.7) * u); g.rotate(0.9); g.fillRect(-1.8 * u, -1 * u, 3.6 * u, 2 * u); g.restore();
    /* the float: an old jerrycan lying on its side, grimed below, a tape patch, roped round */
    var can = function () { rrect(g, -20 * u, -7 * u, 40 * u, 16 * u, 3.2 * u); };
    var cg2 = g.createLinearGradient(-20 * u, 0, 20 * u, 0); cg2.addColorStop(0, '#A9A393'); cg2.addColorStop(0.35, PL); cg2.addColorStop(0.55, '#ECE7D8'); cg2.addColorStop(1, '#9A9483'); g.fillStyle = cg2; can(); g.fill();
    g.save(); can(); g.clip(); var gr2 = g.createLinearGradient(0, 2 * u, 0, 9 * u); gr2.addColorStop(0, 'rgba(110,90,50,0)'); gr2.addColorStop(1, 'rgba(96,78,40,.55)'); g.fillStyle = gr2; g.fillRect(-21 * u, 2 * u, 42 * u, 8 * u);
    g.strokeStyle = 'rgba(0,0,0,.13)'; g.lineWidth = 0.8 * u; [-6, 2, 10].forEach(function (x) { g.beginPath(); g.moveTo(x * u, -7 * u); g.quadraticCurveTo((x + 1) * u, 1 * u, x * u, 9 * u); g.stroke(); });
    specks(g, -20 * u, -2 * u, 40 * u, 11 * u, 22, ['#6F6A55', '#4F6B48', '#8A7A55'], 408, u); g.restore();
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 0.6 * u; can(); g.stroke();
    g.strokeStyle = PL; g.lineWidth = 1.6 * u; g.beginPath(); g.moveTo(-13 * u, -7 * u); g.quadraticCurveTo(-9 * u, -12 * u, -4 * u, -7 * u); g.stroke();
    g.fillStyle = '#3B5E8C'; g.fillRect(16.5 * u, -9.5 * u, 3.4 * u, 3 * u);
    g.save(); g.translate(6 * u, 2.4 * u); g.rotate(-0.12); g.fillStyle = TP; g.globalAlpha = 0.92; g.fillRect(-4.5 * u, -1.6 * u, 9 * u, 3.2 * u); g.globalAlpha = 1; g.restore();
    g.strokeStyle = RP; g.lineWidth = 0.8 * u; [-12, 11].forEach(function (x, k) { hand(g, [[x * u, -7.5 * u], [(x + 0.6) * u, 1 * u], [x * u, 9.4 * u]], 409 + k); for (var q = -6; q < 9; q += 2.4) { g.beginPath(); g.moveTo((x - 0.6) * u, q * u); g.lineTo((x + 0.8) * u, (q + 1) * u); g.stroke(); } });
    /* the El Niño switch: an old light switch screwed onto the can */
    g.fillStyle = '#E7E1CF'; rrect(g, 9 * u, -12.4 * u, 8 * u, 5.4 * u, 0.8 * u); g.fill(); g.fillStyle = '#8A8170'; [[10.2, -11.2], [15.8, -8.2]].forEach(function (s2) { g.beginPath(); g.arc(s2[0] * u, s2[1] * u, 0.45 * u, 0, 7); g.fill(); });
    var lv = RS.nino ? 1 : -1; g.strokeStyle = '#3A3630'; g.lineWidth = 1.1 * u; g.beginPath(); g.moveTo(13 * u, -9.6 * u); g.lineTo((13 + lv * 2.4) * u, -14.4 * u); g.stroke(); g.fillStyle = RS.nino ? '#FF2E1F' : '#3A3630'; g.beginPath(); g.arc((13 + lv * 2.4) * u, -14.4 * u, 1.2 * u, 0, 7); g.fill();
    if (!RS.small) { g.fillStyle = '#F1F0EC'; g.font = '600 ' + Math.max(7, 4.2 * u).toFixed(1) + 'px "Departure Mono", ui-monospace, monospace'; g.fillText('EL NIÑO', 20 * u, -8.5 * u); }
    /* the little radio, roped on; the other in a cut-down tub, its board showing */
    var gx = -20 * u, gy = -33 * u; g.fillStyle = '#3B3A36'; g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx + 10.5 * u, gy); g.lineTo(gx + 12 * u, gy + 1.6 * u); g.lineTo(gx + 12 * u, gy + 10 * u); g.lineTo(gx, gy + 10 * u); g.closePath(); g.fill();
    g.fillStyle = '#B23A2E'; g.beginPath(); g.arc(gx + 8.4 * u, gy + 5.6 * u, 2 * u, 0, 7); g.fill(); g.strokeStyle = '#F1F0EC'; g.lineWidth = 0.5 * u; g.beginPath(); g.moveTo(gx + 8.4 * u, gy + 5.6 * u); g.lineTo(gx + 8.4 * u + Math.cos(t * 0.3) * 1.6 * u, gy + 5.6 * u + Math.sin(t * 0.3) * 1.6 * u); g.stroke();
    g.fillStyle = 'rgba(241,240,236,.35)'; for (var gi = 0; gi < 3; gi++) for (var gj = 0; gj < 3; gj++) { g.beginPath(); g.arc(gx + (2.2 + gi * 1.5) * u, gy + (4.6 + gj * 1.5) * u, 0.42 * u, 0, 7); g.fill(); }
    g.strokeStyle = RP; g.lineWidth = 0.7 * u; hand(g, [[gx + 12 * u, gy + 3 * u], [-1 * u, gy + 2.6 * u]], 411); hand(g, [[gx + 12 * u, gy + 7.5 * u], [-0.6 * u, gy + 7.8 * u]], 412);
    var cx = 5 * u, cy = -50 * u, cw2 = 13 * u, ch = 11 * u; g.fillStyle = '#1F5C3B'; g.fillRect(cx + 1.2 * u, cy + 1.4 * u, cw2 - 2.4 * u, ch - 2.6 * u); g.fillStyle = '#0B0B0B'; g.fillRect(cx + 2.4 * u, cy + 2.8 * u, 3.6 * u, 2.4 * u); g.strokeStyle = '#C98A4A'; g.lineWidth = 0.6 * u; g.beginPath(); g.arc(cx + 9.4 * u, cy + 4 * u, 1.4 * u, 0, 7); g.stroke();
    g.fillStyle = 'rgba(236,231,214,.42)'; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + cw2, cy); g.lineTo(cx + cw2 - 1 * u, cy + ch); g.lineTo(cx + 1 * u, cy + ch); g.closePath(); g.fill(); g.strokeStyle = 'rgba(236,231,214,.85)'; g.lineWidth = 0.6 * u; g.stroke();
    g.fillStyle = 'rgba(236,231,214,.7)'; g.beginPath(); g.moveTo(cx + cw2, cy - 0.4 * u); g.lineTo(cx + cw2 + 4.2 * u, cy - 3 * u + sw * 0.4 * u); g.lineTo(cx + cw2 + 4.8 * u, cy - 1.6 * u + sw * 0.4 * u); g.lineTo(cx + cw2 + 0.4 * u, cy + 0.8 * u); g.closePath(); g.fill();
    g.strokeStyle = RP; g.lineWidth = 0.7 * u; hand(g, [[cx, cy + 3 * u], [2 * u, cy + 3.2 * u]], 413);
    /* the lamp: a jar, its lid rusted, an aerial bent from a coat hanger */
    var per = heat > 0.5 ? 0.45 : AIR.on ? 1.4 : 3.2, pp = (t % per) / per, fl = Math.max(0, 1 - pp * 3.2), lx = 2 * u, ly = -82 * u;
    g.strokeStyle = RU; g.lineWidth = 1.4 * u; hand(g, [[1.6 * u, -66 * u], [lx, ly + 4 * u]], 414);
    var gw2 = (NIGHT ? 24 : 16) * u, lg = g.createRadialGradient(lx, ly, 0, lx, ly, gw2); lg.addColorStop(0, 'rgba(255,190,110,' + (0.15 + fl * 0.6 + (NIGHT ? 0.15 : 0)).toFixed(2) + ')'); lg.addColorStop(1, 'rgba(255,140,50,0)'); g.fillStyle = lg; g.beginPath(); g.arc(lx, ly, gw2, 0, 7); g.fill();
    g.fillStyle = fl > 0.15 ? 'rgba(255,226,170,.95)' : 'rgba(255,255,255,.2)'; rrect(g, lx - 3.2 * u, ly - 3.4 * u, 6.4 * u, 7.6 * u, 1.6 * u); g.fill(); g.strokeStyle = 'rgba(241,240,236,.85)'; g.lineWidth = 0.6 * u; g.stroke();
    g.fillStyle = '#7A4A2E'; g.fillRect(lx - 3.4 * u, ly - 5 * u, 6.8 * u, 1.8 * u); specks(g, lx - 3.4 * u, ly - 5 * u, 6.8 * u, 1.8 * u, 5, [RL, VG], 415, u);
    g.save(); g.translate(lx, ly - 5 * u); g.rotate(sw * 0.05); g.strokeStyle = '#B9B4A6'; g.lineWidth = 0.6 * u;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -3 * u); g.lineTo(-7 * u, -3.4 * u); g.lineTo(0.6 * u, -9 * u); g.lineTo(8 * u, -3.2 * u); g.lineTo(0, -3 * u); g.moveTo(0.6 * u, -9 * u); g.lineTo(0.6 * u, -11 * u); g.arc(1.8 * u, -11 * u, 1.2 * u, Math.PI, Math.PI * 2.2); g.stroke(); g.restore();
    g.strokeStyle = '#F1F0EC'; [pp, (pp + 0.5) % 1].forEach(function (p2) { var R = (6 + p2 * 44) * u; g.globalAlpha = (1 - p2) * 0.45; g.lineWidth = 1; g.beginPath(); g.arc(lx, ly, R, -0.75, 0.75); g.stroke(); g.beginPath(); g.arc(lx, ly, R, Math.PI - 0.75, Math.PI + 0.75); g.stroke(); }); g.globalAlpha = 1;
  }
  function rsWash(w, h) { var c = D.createElement('canvas'), k = RS.k; c.width = Math.round(w * k); c.height = Math.round(h * k); var g = c.getContext('2d'), r = rnd(611); g.scale(k, k);
    var P = NIGHT ? ['46,64,110', '84,70,118', '30,86,98'] : ['64,104,164', '188,150,96', '118,138,150', '164,96,74'];
    for (var i = 0; i < 28; i++) { var x = r() * w, y = r() * h * 0.8, R = (0.12 + r() * 0.3) * w, cl = P[i % P.length], a = 0.05 + r() * 0.07;
      g.save(); g.translate(x, y); g.rotate(r() * 6.28); g.scale(1, 0.45 + r() * 0.6);
      var gr = g.createRadialGradient(0, 0, R * 0.15, 0, 0, R); gr.addColorStop(0, 'rgba(' + cl + ',' + (a * 0.5).toFixed(3) + ')'); gr.addColorStop(0.84, 'rgba(' + cl + ',' + a.toFixed(3) + ')'); gr.addColorStop(1, 'rgba(' + cl + ',0)'); g.fillStyle = gr;
      g.beginPath(); for (var q = 0; q <= 28; q++) { var an = q / 28 * 6.2832, rr = R * (0.84 + r() * 0.16); if (q) g.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); else g.moveTo(Math.cos(an) * rr, Math.sin(an) * rr); } g.closePath(); g.fill();
      g.strokeStyle = 'rgba(' + cl + ',' + (a * 1.3).toFixed(3) + ')'; g.lineWidth = 1.1; g.stroke(); g.restore(); }
    grain(g, w, h, Math.round(w * h / 26), 'rgba(70,58,44,.16)', 612, 1.2);
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-in'; g.drawImage(RS.base, 0, 0); return c; }
  function rdSea(t, dt) {
    var cv = RS.cv;
    if (!cv || !cv.isConnected) { cv = RS.cv = col.querySelector('.sk-radio .rd-sea'); RS.w = 0; if (RS.io) RS.io.disconnect(); if (!cv) return;
      if ('IntersectionObserver' in window) { RS.io = new IntersectionObserver(function (es) { RS.on = es[es.length - 1].isIntersecting; }); RS.io.observe(cv); } }
    if (!RS.on || xv.classList.contains('on')) return;
    var w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
    RS.small = !!cv.closest('.small');
    if (w !== RS.w || h !== RS.h || RS.nt !== NIGHT) { RS.w = w; RS.h = h; RS.nt = NIGHT; RS.k = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(w * RS.k); cv.height = Math.round(h * RS.k); RS.E = h / 1.4; RS.base = rsBase(w, h, RS.E); RS.wash = rsWash(w, h);
      var r = rnd(305); RS.snow = []; for (var i = 0; i < 26; i++) RS.snow.push({ x: r() * w, y: r() * RS.E, r: 0.5 + r() * 1.1, v: 2 + r() * 4, p: r() * 7 }); RS.drawn = false; }
    if (RM.matches) { if (RS.drawn) return; t = 2; dt = 0; } RS.drawn = true;
    var g = cv.getContext('2d'), E = RS.E, k = RS.k, O = '#FF6B1A', ink = NIGHT ? 'rgba(200,225,255,.92)' : '#F1F0EC', Fy = E * 0.83;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.drawImage(RS.base, 0, 0); g.setTransform(k, 0, 0, k, 0, 0);
    /* in the water only: the snow drifting, the surface shining, the air above it a shade lighter */
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = NIGHT ? 'rgba(150,255,205,.85)' : 'rgba(244,241,232,.6)';
    RS.snow.forEach(function (s) { s.y += s.v * dt; s.x += Math.sin(t * 0.4 + s.p) * 3 * dt; if (s.y > E * 1.12) { s.y = -4; s.x = Math.random() * w; } g.globalAlpha = NIGHT ? 0.35 + 0.65 * Math.abs(Math.sin(t * 1.2 + s.p)) : 0.9; g.beginPath(); g.arc(s.x, s.y, s.r, 0, 7); g.fill(); }); g.globalAlpha = 1;
    g.fillStyle = 'rgba(255,255,255,' + (NIGHT ? 0.025 : 0.05) + ')'; g.fillRect(0, 0, w, Fy);
    g.strokeStyle = NIGHT ? 'rgba(160,220,255,.4)' : 'rgba(244,241,232,.45)'; g.lineWidth = 1; g.setLineDash([14, 9, 3, 9]); g.lineDashOffset = -t * 6; g.beginPath();
    for (var x = 0; x <= w; x += 6) { var yy = Fy + Math.sin(x * 0.035 + t * 0.8) * 1.6 + Math.sin(x * 0.011 - t * 0.5) * 1.2; if (x) g.lineTo(x, yy); else g.moveTo(x, yy); } g.stroke(); g.setLineDash([]);
    g.globalCompositeOperation = 'source-over';
    /* the beacon: it bobs and leans on a slow swell */
    var heat = RS.heat = (RS.heat || 0) + ((RS.nino ? 1 : 0) - (RS.heat || 0)) * Math.min(1, (dt || 1) * 0.6);
    var u = E / 118, bx = -5 * u, by = Fy + (Math.sin(t * 0.85) * 2.2 + Math.sin(t * 0.37) * 1.2 + Math.sin(t * 23) * heat * 0.9) * u, roll = (Math.sin(t * 0.6 + 0.8) * 0.055 + Math.sin(t * 0.23) * 0.03) * (1 + heat * 2.6), sw = Math.sin(t * 1.1);
    var cr = cv.getBoundingClientRect(); RS.sx = cr.left + bx; RS.sy = cr.top + by - 36 * u; RS.su = u; RS.sky = { x: cr.left + w * 0.58, y: cr.top + E * 0.3, rx: w * 0.3, ry: E * 0.1 };
    if (heat > 0.01) { if (!RS.boil) { RS.boil = []; RS.puff = []; } g.globalCompositeOperation = 'source-atop';
      g.fillStyle = 'rgba(255,110,24,' + (0.46 * heat).toFixed(3) + ')'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(92,80,28,' + (0.34 * heat).toFixed(3) + ')'; g.fillRect(0, Fy, w, h);
      if (Math.random() < heat * (dt || 0) * 36) RS.boil.push({ x: Math.random() * w, y: E * 1.08, r: 1 + Math.random() * 3, v: 20 + Math.random() * 40 });
      g.strokeStyle = 'rgba(255,240,220,.8)'; g.lineWidth = 1; RS.boil = RS.boil.filter(function (b) { b.y -= b.v * dt; b.x += Math.sin(t * 6 + b.r * 9) * 0.4; if (b.y < Fy) { if (RS.puff.length < 14 && Math.random() < 0.5) RS.puff.push({ x: b.x, y: Fy - 2, r: 2, a: 0.7 }); return false; } g.beginPath(); g.arc(b.x, b.y, b.r, 0, 7); g.stroke(); return true; });
      g.fillStyle = 'rgba(244,241,232,1)'; RS.puff = RS.puff.filter(function (q) { q.y -= 9 * dt; q.r += 5 * dt; q.a -= 0.35 * dt; if (q.a <= 0) return false; g.globalAlpha = q.a * heat; g.beginPath(); g.arc(q.x + Math.sin(t * 3 + q.r) * 2, q.y, q.r, 0, 7); g.fill(); return true; }); g.globalAlpha = 1;
      for (var lt = 0; lt < 6; lt++) { if (lt / 6 > heat) break; g.save(); g.translate(w * (0.08 + lt * 0.16) + Math.sin(t * 0.6 + lt) * 6, Fy + 1 + Math.sin(t * 1.3 + lt * 2) * 1.5); g.rotate(Math.sin(t + lt) * 0.4); g.fillStyle = ['#8A8F86', '#6E5B3E', '#C9C1A8'][lt % 3]; g.fillRect(-3.5, -1.5, 7, 3); g.restore(); }
      g.globalCompositeOperation = 'source-over'; }
    if ((RS.rt -= dt) < 0) { RS.rt = 2.6 + Math.random() * 1.4; RS.rip.push({ r: 0, a: 0.5 }); }
    g.strokeStyle = ink; g.lineWidth = 1; RS.rip = RS.rip.filter(function (p) { p.r += dt * 9 * u; p.a -= dt * 0.16; if (p.a <= 0) return false; var R = 24 * u + p.r; g.globalAlpha = p.a; g.beginPath(); g.ellipse(bx, Fy + 1, R, R * 0.14, 0, 0, 7); g.stroke(); return true; }); g.globalAlpha = 1;
    /* what floats: a few pieces of packaging riding the surface, drifting by */
    if (!RS.lit) { RS.lit = []; for (var li = 0; li < 3; li++) RS.lit.push({ x: Math.random(), k: Math.floor(Math.random() * 10), v: 0.006 + Math.random() * 0.008, p: Math.random() * 7 }); }
    RS.lit.forEach(function (o) { o.x += o.v * (dt || 0) * (1 + heat * 2); if (o.x > 1.08) { o.x = -0.08; o.k = Math.floor(Math.random() * 10); }
      g.save(); g.translate(o.x * w, Fy + 1.2 * u + (Math.sin(t * 0.9 + o.p) * 1.3 + Math.sin(t * 0.85) * 0.6) * u); g.rotate(Math.sin(t * 0.7 + o.p) * 0.3 + (o.k % 3 - 1) * 0.5); litter(g, o.k, u * 0.5); g.restore(); });
    /* its mooring, dropping out of the paint */
    var kx = bx - Math.sin(roll) * 24 * u, ky = by + Math.cos(roll) * 24 * u, mg = g.createLinearGradient(0, ky, 0, h); mg.addColorStop(0, 'rgba(244,241,232,.55)'); mg.addColorStop(1, 'rgba(244,241,232,0)');
    g.strokeStyle = mg; g.setLineDash([2, 3]); g.beginPath(); g.moveTo(kx, ky); g.quadraticCurveTo(kx + (10 + Math.sin(t * 0.5) * 3) * u, ky + (h - ky) * 0.5, kx + 4 * u, h); g.stroke(); g.setLineDash([]);
    g.save(); g.translate(bx, by); g.rotate(roll); g.lineCap = 'round'; g.lineJoin = 'round';
    if (RS.scrap) { scrapBuoy(g, u, t, sw, heat); g.restore(); } else {
    /* keel and its weight */
    g.strokeStyle = '#1A1B1E'; g.lineWidth = 2.2 * u; g.beginPath(); g.moveTo(0, 9 * u); g.lineTo(0, 23 * u); g.stroke(); g.fillStyle = '#1A1B1E'; g.beginPath(); g.ellipse(0, 24 * u, 6 * u, 2 * u, 0, 0, 7); g.fill();
    /* the solar panel, out on an arm, tilted to the light */
    g.strokeStyle = ink; g.lineWidth = Math.max(1, 0.9 * u); g.beginPath(); g.moveTo(0, -64 * u); g.lineTo(-9 * u, -73 * u); g.stroke();
    g.save(); g.translate(-11 * u, -76 * u); g.rotate(-0.46 + sw * 0.01); var pw = 38 * u, ph = 14 * u;
    g.fillStyle = ink; rrect(g, -pw / 2 - 1.2 * u, -ph / 2 - 1.2 * u, pw + 2.4 * u, ph + 2.4 * u, 1 * u); g.fill();
    var pg = g.createLinearGradient(0, -ph / 2, 0, ph / 2); pg.addColorStop(0, '#1B2F5E'); pg.addColorStop(1, '#0A142C'); g.fillStyle = pg; g.fillRect(-pw / 2, -ph / 2, pw, ph);
    g.strokeStyle = 'rgba(140,180,255,.55)'; g.lineWidth = Math.max(0.5, 0.35 * u); g.beginPath(); for (var c = 1; c < 6; c++) { g.moveTo(-pw / 2 + pw * c / 6, -ph / 2); g.lineTo(-pw / 2 + pw * c / 6, ph / 2); } g.moveTo(-pw / 2, 0); g.lineTo(pw / 2, 0); g.stroke();
    g.save(); g.beginPath(); g.rect(-pw / 2, -ph / 2, pw, ph); g.clip(); var gl = ((t * 0.09) % 1.8 - 0.4) * pw * 1.4 - pw / 2; g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(gl, -ph / 2); g.lineTo(gl + 5 * u, -ph / 2); g.lineTo(gl - 2 * u, ph / 2); g.lineTo(gl - 7 * u, ph / 2); g.closePath(); g.fill(); g.restore();
    g.restore();
    /* the wires, hanging slack between them */
    var wire = function (col, a, b, c2, lw) { g.strokeStyle = col; g.lineWidth = lw * u; g.beginPath(); g.moveTo(a[0] * u, a[1] * u); g.quadraticCurveTo(c2[0] * u, (c2[1] + sw * 1.4) * u, b[0] * u, b[1] * u); g.stroke(); };
    wire('#E5262B', [-4, -71], [12, -50], [6, -58], 0.8);
    wire('#0B0B0B', [7, -39], [-9, -29], [4, -30], 0.8);
    wire('#FF9A3C', [-17, -22], [-12, -6], [-28, -12], 0.9);
    wire('#E5262B', [14, -39], [9, -6], [20, -18], 0.7);
    /* the mast: a light lattice */
    g.strokeStyle = ink; g.lineWidth = Math.max(1, 0.9 * u); var rail = function (s, f) { return [s * (6 - 4 * f) * u, (-6 - 60 * f) * u]; };
    g.beginPath(); [-1, 1].forEach(function (s) { var a = rail(s, 0), b = rail(s, 1); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); });
    for (var q = 0; q < 8; q++) { var a1 = rail(q % 2 ? 1 : -1, q / 8), b1 = rail(q % 2 ? -1 : 1, (q + 1) / 8); g.moveTo(a1[0], a1[1]); g.lineTo(b1[0], b1[1]); } g.stroke();
    /* the float: radio orange, a band of reflective tape, its deck */
    var fg = g.createLinearGradient(-22 * u, 0, 22 * u, 0); fg.addColorStop(0, shade(O, -0.42)); fg.addColorStop(0.3, O); fg.addColorStop(0.44, shade(O, 0.35)); fg.addColorStop(0.62, O); fg.addColorStop(1, shade(O, -0.48));
    var hull = function () { g.beginPath(); g.moveTo(-22 * u, -5 * u); g.lineTo(22 * u, -5 * u); g.quadraticCurveTo(24 * u, 6 * u, 15 * u, 11 * u); g.lineTo(-15 * u, 11 * u); g.quadraticCurveTo(-24 * u, 6 * u, -22 * u, -5 * u); g.closePath(); };
    g.fillStyle = fg; hull(); g.fill(); g.save(); hull(); g.clip(); g.fillStyle = 'rgba(244,241,232,.92)'; g.fillRect(-25 * u, 0.5 * u, 50 * u, 2.6 * u); g.fillStyle = 'rgba(11,11,11,.5)'; for (var tk = -20; tk < 22; tk += 7) g.fillRect(tk * u, 0.5 * u, 1.2 * u, 2.6 * u); g.restore();
    g.fillStyle = shade(O, 0.22); g.beginPath(); g.ellipse(0, -5 * u, 22 * u, 4.4 * u, 0, 0, 7); g.fill(); g.fillStyle = shade(O, -0.18); g.beginPath(); g.ellipse(0, -5.3 * u, 13 * u, 2.4 * u, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.1 * u; g.beginPath(); g.moveTo(-16 * u, -1.5 * u); g.quadraticCurveTo(-18 * u, 4 * u, -13 * u, 8 * u); g.stroke();
    g.fillStyle = '#1A1B1E'; rrect(g, 9 * u, -12 * u, 8 * u, 5 * u, 1 * u); g.fill(); var lv = RS.nino ? 1 : -1; g.strokeStyle = '#F1F0EC'; g.lineWidth = 1 * u; g.beginPath(); g.moveTo(13 * u, -9.5 * u); g.lineTo((13 + lv * 2.6) * u, -14.5 * u); g.stroke();
    g.fillStyle = RS.nino ? '#FF2E1F' : '#F1F0EC'; g.beginPath(); g.arc((13 + lv * 2.6) * u, -14.5 * u, 1.3 * u, 0, 7); g.fill();
    if (!RS.small) { g.fillStyle = ink; g.font = '600 ' + Math.max(7, 4.2 * u).toFixed(1) + 'px "Departure Mono", ui-monospace, monospace'; g.fillText('EL NIÑO', 20 * u, -8.5 * u); }
    /* the simple radio: a smoked matte box, one dial, one lamp */
    var gx = -20 * u, gy = -33 * u, gw = 12 * u, gh = 10 * u, sg = g.createLinearGradient(0, gy, 0, gy + gh); sg.addColorStop(0, '#3C3E43'); sg.addColorStop(1, '#141518');
    g.fillStyle = sg; rrect(g, gx, gy, gw, gh, 1.3 * u); g.fill(); g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(gx + 1.2 * u, gy + 0.8 * u, gw - 2.4 * u, 0.6 * u);
    g.strokeStyle = '#F1F0EC'; g.lineWidth = 0.55 * u; g.beginPath(); g.arc(gx + 8.4 * u, gy + 5.6 * u, 2.3 * u, 0, 7); g.stroke(); g.beginPath(); g.moveTo(gx + 8.4 * u, gy + 5.6 * u); g.lineTo(gx + 8.4 * u + Math.cos(t * 0.3) * 1.8 * u, gy + 5.6 * u + Math.sin(t * 0.3) * 1.8 * u); g.stroke();
    g.fillStyle = 'rgba(241,240,236,.35)'; for (var gi = 0; gi < 3; gi++) for (var gj = 0; gj < 3; gj++) { g.beginPath(); g.arc(gx + (2.2 + gi * 1.5) * u, gy + (4.6 + gj * 1.5) * u, 0.42 * u, 0, 7); g.fill(); }
    g.strokeStyle = ink; g.lineWidth = 0.6 * u; g.beginPath(); g.moveTo(gx + gw, gy + 2.5 * u); g.lineTo(rail(-1, 0.43)[0], gy + 2.5 * u); g.moveTo(gx + gw, gy + gh - 2.5 * u); g.lineTo(rail(-1, 0.4)[0], gy + gh - 2.5 * u); g.stroke();
    /* the full radio: its back taken off and hung open, the board inside, kept plain */
    var cx = 5 * u, cy = -50 * u, cw = 13 * u, ch = 11 * u;
    g.fillStyle = '#1A1B1E'; rrect(g, cx, cy, cw, ch, 1 * u); g.fill(); g.fillStyle = '#1F5C3B'; g.fillRect(cx + 1.2 * u, cy + 1.2 * u, cw - 2.4 * u, ch - 2.4 * u);
    g.fillStyle = '#0B0B0B'; g.fillRect(cx + 2.4 * u, cy + 2.6 * u, 3.6 * u, 2.4 * u); g.fillRect(cx + 7.4 * u, cy + 6.4 * u, 2.6 * u, 2 * u);
    g.strokeStyle = '#C98A4A'; g.lineWidth = 0.6 * u; g.beginPath(); g.arc(cx + 9.4 * u, cy + 3.6 * u, 1.4 * u, 0, 7); g.stroke();
    g.strokeStyle = 'rgba(241,240,236,.5)'; g.lineWidth = 0.35 * u; g.beginPath(); g.moveTo(cx + 4.2 * u, cy + 5 * u); g.lineTo(cx + 4.2 * u, cy + 7.4 * u); g.lineTo(cx + 7.4 * u, cy + 7.4 * u); g.moveTo(cx + 6 * u, cy + 3.8 * u); g.lineTo(cx + 8 * u, cy + 3.8 * u); g.stroke();
    g.fillStyle = '#2A2C30'; g.beginPath(); g.moveTo(cx + cw, cy + 0.6 * u); g.lineTo(cx + cw + 4.4 * u, cy - 1.6 * u + sw * 0.4 * u); g.lineTo(cx + cw + 4.4 * u, cy + ch - 3 * u + sw * 0.4 * u); g.lineTo(cx + cw, cy + ch - 0.6 * u); g.closePath(); g.fill();
    g.strokeStyle = ink; g.lineWidth = 0.6 * u; g.beginPath(); g.moveTo(cx, cy + 2.5 * u); g.lineTo(rail(1, 0.7)[0], cy + 2.5 * u); g.moveTo(cx, cy + ch - 2.5 * u); g.lineTo(rail(1, 0.66)[0], cy + ch - 2.5 * u); g.stroke();
    /* the lamp on its post, calling out on a slow beat, quicker while the radio plays; an aerial whipping above */
    var per = heat > 0.5 ? 0.45 : AIR.on ? 1.4 : 3.2, pp = (t % per) / per, fl = Math.max(0, 1 - pp * 3.2), lx = 2 * u, ly = -84 * u;
    g.strokeStyle = ink; g.lineWidth = Math.max(1, 0.9 * u); g.beginPath(); g.moveTo(0, -66 * u); g.lineTo(lx, ly + 3 * u); g.moveTo(lx, ly - 3 * u); g.quadraticCurveTo(lx + 2 * u, -90 * u, lx + (6 + sw * 1.6) * u, -97 * u); g.stroke();
    g.fillStyle = ink; g.beginPath(); g.arc(lx + (6 + sw * 1.6) * u, -97 * u, 1 * u, 0, 7); g.fill();
    var gw2 = (NIGHT ? 24 : 16) * u, lg = g.createRadialGradient(lx, ly, 0, lx, ly, gw2); lg.addColorStop(0, 'rgba(255,170,90,' + (0.15 + fl * 0.6 + (NIGHT ? 0.15 : 0)).toFixed(2) + ')'); lg.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = lg; g.beginPath(); g.arc(lx, ly, gw2, 0, 7); g.fill();
    g.fillStyle = fl > 0.15 ? '#FFE2B0' : shade(O, NIGHT ? 0.1 : -0.1); g.beginPath(); g.arc(lx, ly, 3 * u, Math.PI, 0); g.lineTo(lx + 3 * u, ly + 2 * u); g.lineTo(lx - 3 * u, ly + 2 * u); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(lx - 1.2 * u, ly - 1.2 * u, 0.9 * u, 0.4 * u, -0.7, 0, 7); g.fill();
    g.strokeStyle = ink; [pp, (pp + 0.5) % 1].forEach(function (p2) { var R = (6 + p2 * 44) * u; g.globalAlpha = (1 - p2) * 0.5; g.lineWidth = 1; g.beginPath(); g.arc(lx, ly, R, -0.75, 0.75); g.stroke(); g.beginPath(); g.arc(lx, ly, R, Math.PI - 0.75, Math.PI + 0.75); g.stroke(); }); g.globalAlpha = 1;
    g.restore(); }
    /* its lights: two small LEDs blinking out of step; after dark a torch on the lamp turns, its beam sweeping the water, a flash as it faces out */
    g.save(); g.translate(bx, by); g.rotate(roll); var bl = Math.floor(t * 1.6) % 2;
    [[-18.2, -31.2, '#FF3B2E', bl], [6.6, -48.6, '#5CE07A', 1 - bl]].forEach(function (L) { g.fillStyle = L[3] ? L[2] : 'rgba(30,30,30,.8)'; if (L[3]) { g.shadowColor = L[2]; g.shadowBlur = NIGHT ? 9 : 4; } g.beginPath(); g.arc(L[0] * u, L[1] * u, 0.8 * u, 0, 7); g.fill(); g.shadowBlur = 0; });
    if (NIGHT) { var ly2 = (RS.scrap ? -82 : -84) * u, an = t * 0.85, cs = Math.cos(an), BL = 190 * u * Math.abs(cs) + 8 * u, sp = 8 * u * (0.4 + 0.6 * Math.abs(Math.sin(an))), dr = cs > 0 ? 1 : -1;
      var bg = g.createLinearGradient(2 * u, ly2, 2 * u + dr * BL, ly2 + BL * 0.1); bg.addColorStop(0, 'rgba(255,228,160,.5)'); bg.addColorStop(1, 'rgba(255,228,160,0)'); g.globalCompositeOperation = 'lighter'; g.fillStyle = bg;
      g.beginPath(); g.moveTo(2 * u, ly2 - 1.2 * u); g.lineTo(2 * u + dr * BL, ly2 - sp); g.lineTo(2 * u + dr * BL, ly2 + sp + BL * 0.2); g.lineTo(2 * u, ly2 + 1.2 * u); g.closePath(); g.fill();
      var fa = Math.max(0, 1 - Math.abs(cs) / 0.22); if (fa > 0) { var fg2 = g.createRadialGradient(2 * u, ly2, 0, 2 * u, ly2, 30 * u); fg2.addColorStop(0, 'rgba(255,240,200,' + (0.7 * fa).toFixed(2) + ')'); fg2.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = fg2; g.beginPath(); g.arc(2 * u, ly2, 30 * u, 0, 7); g.fill(); }
      g.globalCompositeOperation = 'source-over'; }
    g.restore();
    /* below the surface the water holds it a little dimmer */
    g.save(); g.beginPath(); g.rect(0, Fy + 2, w, h); g.clip(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = NIGHT ? 'rgba(6,21,42,.45)' : 'rgba(23,69,127,.42)'; g.fillRect(0, Fy, w, h); g.restore();
    if (RS.wash) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'multiply'; g.drawImage(RS.wash, 0, 0); g.globalCompositeOperation = 'source-over'; g.setTransform(k, 0, 0, k, 0, 0); }
    /* hot water, lo-fi: the whole picture read back in big pixels */
    if (heat > 0.04) { var f = Math.round(1 + heat * 4), pw2 = Math.ceil(cv.width / f), ph2 = Math.ceil(cv.height / f), pc = RS.px || (RS.px = D.createElement('canvas')); if (pc.width !== pw2 || pc.height !== ph2) { pc.width = pw2; pc.height = ph2; }
      var px = pc.getContext('2d'); px.clearRect(0, 0, pw2, ph2); px.drawImage(cv, 0, 0, pw2, ph2); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.imageSmoothingEnabled = false; g.drawImage(pc, 0, 0, cv.width, cv.height); g.imageSmoothingEnabled = true; }
  }
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
    dots: function () { },
    /* ISLAND: the printer on pale paper, the band as torn tape behind it */
    printer: function (L, w, h, i) { crumple(L.b, w, h, 51, '#F7F6F1'); },
    /* ISLAND ARCHIPELAGOS: rounded forms on soft grey, all in greys but the coral, which is its own; the band a glossy tube */
    forms: function (L, w, h, i) { var g = L.b; g.fillStyle = '#0C2546'; g.fillRect(0, 0, w, h); grain(g, w, h, Math.round(w * h / 70), 'rgba(255,255,255,.06)', 61); },
    receipt: function (L, w, h, i) { },
    board: function (L, w, h, i) { var g = L.b, s = Math.max(14, w / 22); g.fillStyle = '#ECEBE7'; g.fillRect(0, 0, w, h); grain(g, w, h, Math.round(w * h / 90), 'rgba(0,0,0,.1)', 141);
      g.fillStyle = 'rgba(11,11,11,.3)'; for (var y = s / 2; y < h; y += s) for (var x = s / 2; x < w; x += s) { g.beginPath(); g.arc(x, y, 1.1, 0, 7); g.fill(); }
    },
    plain: function (L, w, h, i) { var g = L.b; g.fillStyle = '#ECEBE7'; g.fillRect(0, 0, w, h); grain(g, w, h, Math.round(w * h / 60), 'rgba(0,0,0,.08)', 71); }
  };
  ART.isles = ART.plain;
  /* an open slot, in one of the posters' palettes: dotted bitmap, lilac steps, cyan zig-zag, pink and green, coral and primaries, blueprint */
  ART.slot = function (L, w, h, i, c) { var g = L.b, m = L.m, n = ((c && (c.pal || c.ph) || 1) - 1) % 6, r = rnd(200 + n), k, x, y;
    var BG = ['#0B0B0B', '#C9C1F7', '#1EA0E0', '#F2B6C6', '#E9E4DC', '#17457F'][n]; g.fillStyle = BG; g.fillRect(0, 0, w, h);
    if (n === 0) { var st = Math.max(7, w / 36); g.fillStyle = '#F4F1E8'; for (y = st / 2; y < h; y += st) for (x = st / 2; x < w; x += st) { var v = 0.5 + 0.5 * Math.sin(x / w * 5 + y / h * 3.2) * Math.cos(y / h * 2.4 - x / w); if (v < 0.18) continue; g.beginPath(); g.arc(x, y, st * 0.46 * v, 0, 7); g.fill(); } }
    else if (n === 1) { var sw = w / 9; m.fillStyle = '#0B0B0B'; for (k = 0; k < 9; k++) m.fillRect(k * sw, h - (k + 1) * h / 13, sw + 1, (k + 1) * h / 13); }
    else if (n === 2) { m.strokeStyle = '#0B0B0B'; m.lineWidth = Math.max(10, h / 9); m.lineJoin = 'miter'; for (var b = 0; b < 2; b++) { m.beginPath(); var yy = h * (0.55 + b * 0.28), a = h / 9; for (x = -a, k = 0; x <= w + a; x += a * 1.4, k++) m.lineTo(x, yy + (k % 2 ? -a : a) * 0.6); m.stroke(); } }
    else if (n === 3) { m.fillStyle = '#1F7A3E'; for (k = 0; k < 7; k++) { m.beginPath(); m.ellipse(w * r(), h * (0.35 + r() * 0.65), w * (0.08 + r() * 0.16), h * (0.05 + r() * 0.1), r() * 3, 0, 7); m.fill(); } }
    else if (n === 4) { [['#F4C542', 0.72, 0.38, 0.22], ['#4A6FE0', 0.28, 0.7, 0.18], ['#E5262B', 0.78, 0.82, 0.1], ['#F0B39A', 0.38, 0.32, 0.12]].forEach(function (o) { m.fillStyle = o[0]; m.beginPath(); m.arc(w * o[1], h * o[2], Math.min(w, h) * o[3] * 1.4, 0, 7); m.fill(); }); }
    else { g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 0.7; var gs = w / 12; for (x = 0; x < w; x += gs) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (y = 0; y < h; y += gs) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } m.strokeStyle = '#F2B6C6'; m.lineWidth = 2; m.beginPath(); m.arc(w * 0.68, h * 0.5, Math.min(w, h) * 0.3, 0, 7); m.stroke(); }
    grain(g, w, h, Math.round(w * h / 70), n === 0 || n === 5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.09)', 210 + n); };

  /* ───────── the page ───────── */
  var SNORKEL = '<svg viewBox="0 0 24 24"><path d="M3 10.5c0-1.4 1.1-2.5 2.5-2.5h7c1.4 0 2.5 1.1 2.5 2.5v1c0 1.4-1.1 2.5-2.5 2.5H11l-1.5-1.6L8 14H5.5C4.1 14 3 12.9 3 11.5z"/><path d="M18.5 3v11.5a4.5 4.5 0 0 1-4.5 4.5h-3"/></svg>';
  var root = D.createElement('div'); root.id = 'hm';
  root.innerHTML = '<header id="hm-top" aria-label="The sea" aria-expanded="false"><canvas aria-hidden="true"></canvas><nav>' +
    '<button id="hm-snork" aria-label="Back up to the surface" hidden>' + SNORKEL + '</button>' +
    '<button id="hm-mine" aria-label="Home" title="Your home: your code, your pass, your cards"><svg viewBox="0 0 24 24"><path d="M5 7h9M5 12h14M5 17h6"/><circle cx="17" cy="7" r="1.6"/><circle cx="14" cy="17" r="1.6"/></svg></button>' + '<button id="hm-snd" aria-label="Sounds" title="Sounds" aria-expanded="false"><svg viewBox="0 0 24 24"><path d="M5 6v12M9.5 9v6M14 4v16M18.5 8v8"/></svg><i class="led"></i></button>' + '<button id="hm-theme" aria-label="Light or dark" title="Light or dark"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" class="f"/></svg></button></nav><div id="hm-care" role="toolbar" aria-label="Care for the reef" hidden></div></header><canvas id="hm-jf" aria-hidden="true"></canvas>' +
    '<main id="hm-col">' + colHTML() + '</main><nav class="hm-dots" aria-hidden="true"></nav>' +
    '<section id="hm-x" role="dialog" aria-modal="true" aria-label=""><header><button class="hm-back" aria-label="Back"></button></header><div class="hm-body"></div></section>' +
    '<section id="hm-sb" class="low" aria-label="Switchboard"><button class="grab" aria-label="The switchboard, larger or smaller"></button><span class="cb" aria-hidden="true"></span><button class="rs">RESET</button><ol class="oc" aria-live="polite" hidden></ol><div class="jk"></div><canvas class="cab" aria-hidden="true"></canvas></section>';
  D.body.appendChild(root);
  var col = $('#hm-col'), xv = $('#hm-x'), cards = $$('.hm-card', col); $('.hm-dots').innerHTML = dotsHTML();
  /* the page dots stand in the middle of the light margin beside the cards, wherever the scrollbar is */
  function dotsAt() { var d = $('.hm-dots'), op = d && d.offsetParent; if (!op) return; var r = col.getBoundingClientRect(), pr = parseFloat(getComputedStyle(col).paddingRight) || 0, mid = r.left + col.clientWidth - pr / 2;
    d.style.right = Math.max(0, op.getBoundingClientRect().right - mid - d.offsetWidth / 2) + 'px'; }
  dotsAt(); addEventListener('resize', dotsAt);
  /* the cards as novel.global writes them on the approval page (CARDS): # a card, then its lines; the order they are written in */
  var OPENS = /^(aura|radio|kit|panel|bench|portfolio|press|research|unlock|stack:[a-z0-9-]{1,24})$/, KEYS = ['title', 'line', 'tag', 'island', 'opens', 'where', 'motion', 'art', 'size', 'sea'];
  var SZN = 0;
  function logosOf(c) { var l = c.logos || []; if (!l.length) return '';
    return '<span class="hm-pl" aria-label="Made with">' + l.map(function (u) { return u === 'mark' ? '<i class="pl-ng">' + MARK + '<b>novel.global</b></i>' : '<img alt="" decoding="async" loading="lazy" class="pl-' + esc(u.replace(/^.*\//, '').replace(/\..*$/, '')) + '" src="' + esc(u) + '">'; }).join('') + '</span>'; }
  function logosCheck() { $$('.hm-pl img', col).forEach(function (im) { var gone = function () { var pl = im.parentNode; im.remove(); if (pl && !pl.children.length) pl.remove(); }; if (im.complete && !im.naturalWidth) gone(); else im.addEventListener('error', gone); }); }
  function applyCards(text) {
    if (text) { var order = [], hide = {};
      String(text).split(/\n(?=\s*#)/).forEach(function (blk) { var ls = blk.split('\n'), m = /^\s*#\s*([a-z0-9-]{1,24})\s*$/i.exec(ls[0] || ''); if (!m) return; var id = m[1].toLowerCase(), c = byId(id);
        if (!c) { c = { id: id, size: 'full', title: id.toUpperCase(), opens: 'panel', island: 'novelglobal', art: 'plain', motion: 'shadow', where: [-37.8136, 144.9631] }; CARDS.push(c); } order.push(id);
        ls.slice(1).forEach(function (l) { var kv = /^\s*([a-z]+)\s*(?::\s*(.*))?$/i.exec(l); if (!kv) return; var k = kv[1].toLowerCase(), v = (kv[2] || '').trim().slice(0, 120);
          if (k === 'hide') hide[id] = 1; else if (k === 'show') c.off = false; else if (k === 'where') { var ll = v.split(',').map(Number); if (ll.length === 2 && ll.every(isFinite)) c.where = ll; }
          else if (k === 'opens') { if (OPENS.test(v)) c.opens = v; } else if (k === 'motion') { if (/^(shadow|speed)$/.test(v)) c.motion = v; } else if (k === 'art') { if (ART[v]) c.art = v; } else if (k === 'size') { if (v === 'nine') { c.size = 'small'; c.lib = true; c.trio = false; } else if (/^(full|half|small)$/.test(v)) { c.size = v; c.trio = v === 'small'; c.lib = false; } c.szAt = ++SZN; }
          else if (k === 'logos') c.logos = /^none$/i.test(v) ? [] : v.split(/[\s,]+/).filter(function (u) { return u === 'mark' || /^\/[a-z0-9\/._-]+\.(png|jpg|jpeg|webp|svg)$/i.test(u); }).slice(0, 4);
          else if (k === 'join') c.join = /^none$/i.test(v) ? '' : v.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20);
          else if (k === 'hub') { if (/^https:\/\/[^\s"<>]+$/.test(v)) c.hub = v; } else if (k === 'skin') { if (SKINS.indexOf(v) >= 0) c.skin = v; } else if (k === 'island') c.island = v.toLowerCase().replace(/[^a-z0-9-]/g, ''); else if (KEYS.indexOf(k) >= 0) c[k] = v; }); });
      /* a set stands at the size novel.global gave last to any of its cards */
      CARDS.forEach(function (c) { if (!c.szAt) return; kin(c).forEach(function (x) { if ((x.szAt || 0) < c.szAt) { x.size = c.size; x.trio = c.trio; x.lib = c.lib; } }); });
      CARDS.sort(function (a, b) { var i = order.indexOf(a.id), j = order.indexOf(b.id); return (i < 0 ? 99 : i) - (j < 0 ? 99 : j); });
      for (var i = CARDS.length - 1; i >= 0; i--) if (hide[CARDS[i].id] && CARDS[i].id !== 'intro') CARDS.splice(i, 1); }
    col.innerHTML = colHTML(); cards = $$('.hm-card', col); logosCheck(); if (INTRO_TXT) introCopy(INTRO_TXT); if ('ResizeObserver' in window) { if (introArc.ro) introArc.ro.disconnect(); introArc.ro = new ResizeObserver(function () { requestAnimationFrame(introArc); }); $$('.sk-intro .in-arc', col).forEach(function (cv) { introArc.ro.observe(cv); }); } requestAnimationFrame(introFit); ((D.fonts && D.fonts.ready) || Promise.resolve()).then(introFit); idleWatch(); wxCard(); receipt(); lastPrint(); $('.hm-dots').innerHTML = dotsHTML(); paintAll(); pics(); radars(); lamps(); parallax(); zpStart(); rnStart(); paperEdges(); topo();
  }
  var CARDS_TXT = null;
  /* cart cards: today on each */
  var WXD = null, NWD = null, EVT = null;
  var SUITS = ['<path d="M12 3c-2.9 4-7 6.3-7 10a3.4 3.4 0 0 0 6 2.2L10 21h4l-1-5.8A3.4 3.4 0 0 0 19 13c0-3.7-4.1-6-7-10z"/>', '<path d="M12 20.5C8 17 3.5 13.3 3.5 8.8A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 8.5 1.8c0 4.5-4.5 8.2-8.5 11.7z"/>', '<path d="M12 2.5 18.5 12 12 21.5 5.5 12z"/>', '<circle cx="12" cy="7.3" r="3.6"/><circle cx="7.4" cy="13.4" r="3.6"/><circle cx="16.6" cy="13.4" r="3.6"/><path d="M11 13l-1.2 8h4.4L13 13"/>'];
  /* the first book on each shelf */
  var SHELF1 = { fic: ['News from Nowhere', 'WILLIAM MORRIS'], non: ['Mutual Aid', 'PETER KROPOTKIN'], how: ['Woodcraft and Camping', 'GEORGE WASHINGTON SEARS'] };
  var cartDay = function () { try { return new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Melbourne' }); } catch (e) { return new Date().toISOString().slice(0, 10); } };
  var cartSeed = function (s, n) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) % n; };
  var ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];
  var ARCANA = ['THE FOOL', 'THE MAGICIAN', 'THE HIGH PRIESTESS', 'THE EMPRESS', 'THE EMPEROR', 'THE HIEROPHANT', 'THE LOVERS', 'THE CHARIOT', 'STRENGTH', 'THE HERMIT', 'WHEEL OF FORTUNE', 'JUSTICE', 'THE HANGED MAN', 'DEATH', 'TEMPERANCE', 'THE DEVIL', 'THE TOWER', 'THE STAR', 'THE MOON', 'THE SUN', 'JUDGEMENT', 'THE WORLD'];
  function wxCard() { $$('.sk-wx', col).forEach(function (el) { var c = CARDS.filter(function (x) { return x.id === el.dataset.id; })[0]; if (c) cartFace(el, c.cart || 'week'); }); }
  /* the moon as it is this week, drawn: lit from the right while it waxes, the left while it wanes */
  function moonSVG() { var ph = (((Date.now() / 864e5 - 10962.76) / 29.530588853) % 1 + 1) % 1, a = Math.cos(ph * 2 * Math.PI), sw = ph < 0.5 ? 1 : 0, rx = (Math.abs(a) * 10).toFixed(2);
    return '<svg viewBox="0 0 24 24"><circle class="mo-d" cx="12" cy="12" r="10"/><path class="mo-l" d="M12 2A10 10 0 0 ' + sw + ' 12 22A' + rx + ' 10 0 0 ' + (a > 0 ? 1 - sw : sw) + ' 12 2Z"/></svg>'; }
  function cartFace(el, k) {
    var set = function (h, l, s, tx) { $('.wx-h', el).textContent = h; var L = $('.wx-l', el); if (L) L.textContent = l || ''; $('.wx-s', el).textContent = s || ''; el.classList.toggle('wx-txt', !!tx); };
    var day = cartDay();
    if (k === 'events') { var mk = $('.wx-wk', el); if (mk && !mk.firstChild) mk.innerHTML = moonSVG(); }
    if (k === 'read') { var sh = SHELF1[el.classList.contains('r-fic') ? 'fic' : el.classList.contains('r-how') ? 'how' : 'non']; return set(sh[0], '', sh[1]); }
    if (k === 'recipes') { $('.wx-s', el).innerHTML = '<em>strawberry</em><em>black olive</em><em>chilli</em>'; return; }
    if (k === 'events') { if (EVT === null) return set('', '', '');
      var e1 = String(EVT).split('\n').map(function (x) { return x.split('|').map(function (q) { return q.trim(); }); }).filter(function (x) { return x[1]; })[0];
      return e1 ? set(e1[1], '', [e1[0], e1[2]].filter(Boolean).join(' · ').toUpperCase(), true) : set('Soon', '', '', true); }
    if (k === 'tarot') { var i = cartSeed(day + 'tarot', 22); return set(ROMAN[i], '', ARCANA[i]); }
    if (k === 'cards') { var n = cartSeed(day + 'cards0', 52), r = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'][n % 13], s = Math.floor(n / 13);
      $('.wx-ic svg', el).innerHTML = SUITS[s]; el.classList.toggle('wx-red', s === 1 || s === 2); el.title = ({ A: 'Ace', J: 'Jack', Q: 'Queen', K: 'King' }[r] || r) + ' of ' + ['spades', 'hearts', 'diamonds', 'clubs'][s]; return set(r, '', ''); }
    if (k === 'news') { var putN = function (d) { if (d && d.news && d.news[0]) { set(d.news[0], '', '', true); el.title = 'From Wikipedia, in the news'; } };
      if (NWD) return putN(NWD); return fetch('/api/news').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { NWD = d; putN(d); }).catch(function () {}); }
    var put = function (d) { var D = d && d.daily; if (!D || !D.time) return; var c = D.weather_code[0], sky = c === 0 ? 'CLEAR' : c <= 2 ? 'SOME CLOUD' : c === 3 ? 'CLOUD' : c <= 48 ? 'FOG' : c <= 57 ? 'DRIZZLE' : c <= 67 ? 'RAIN' : c <= 77 ? 'SNOW' : c <= 82 ? 'SHOWERS' : c <= 86 ? 'SNOW' : 'STORM';
      set(Math.round(D.temperature_2m_max[0]) + '°', Math.round(D.temperature_2m_min[0]) + '°', sky + ' · RAIN ' + D.precipitation_probability_max[0] + '%'); el.title = 'Today in Melbourne, from Open-Meteo'; el.classList.toggle('wx-wet', D.precipitation_probability_max[0] >= 60);
      var wk = $('.wx-wk', el), mx = (D.temperature_2m_max || []).slice(0, 7); if (wk && mx.length > 2) { var lo = Math.min.apply(null, mx) - 3, hi = Math.max.apply(null, mx) + 1; wk.innerHTML = mx.map(function (v, j) { var pr = (D.precipitation_probability_max || [])[j] || 0; return '<i style="--h:' + Math.round((v - lo) / (hi - lo) * 100) + '%;--p:' + (pr / 100).toFixed(2) + '"></i>'; }).join(''); } };
    if (WXD) return put(WXD);
    fetch('/api/wx?at=-37.77,144.96&sea=-37.86,144.9').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { WXD = d; put(d); }).catch(function () {}); }
  /* idle cards */
  var IDLE = null; var WAKE = null;
  function idleWatch() { if (!('IntersectionObserver' in window)) { $$('.hm-pics img[data-src]', col).forEach(function (im) { im.src = im.dataset.src; im.removeAttribute('data-src'); }); return; } if (IDLE) IDLE.disconnect(); if (WAKE) WAKE.disconnect();
    WAKE = new IntersectionObserver(function (es) { es.forEach(function (e) { if (!e.isIntersecting) return; var bx = e.target.querySelector('.hm-pics'); if (bx && bx._wake) { bx._wake.splice(0).forEach(function (f) { f(); }); } }); }, { threshold: 0.2 }); IDLE = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle('hm-idle', !e.isIntersecting); }); }, { rootMargin: '120px 0px' }); $$('.hm-card', col).forEach(function (c) { IDLE.observe(c); WAKE.observe(c); }); }
  idleWatch(); wxCard();
  fetch('/api/settings').then(function (r) { return r.ok ? r.json() : {}; }).then(function (j) { if (j.opener) introCopy(j.opener); if (j.photos) { photoLinks(j.photos); var rr = col.querySelector('.rb-refs'); if (rr) rr.outerHTML = refs(); } CARDS_TXT = j.cards || ''; if (CARDS_TXT) applyCards(CARDS_TXT); EVT = j.events || ''; $$('.sk-wx[data-id="events"]', col).forEach(function (el) { cartFace(el, 'events'); }); RS.scrap = j.buoyScrap !== false; RS.drawn = false;
    var o2 = { talk: j.smallTalk === true, find: j.smallFind === true, one: j.oneIsland !== false, stamp: j.jellyStamp === true, carts: j.cartridges === true }, re = o2.talk !== OPT.talk || o2.find !== OPT.find || o2.one !== OPT.one || o2.carts !== OPT.carts; OPT = o2; if (re) applyCards(null); }).catch(function () { /* the cards as they started */ });

  /* a label-maker strip: each letter pressed a little off its line */
  function tape(w, cls) { return '<b class="' + cls + '" aria-hidden="true">' + w.split('').map(function (ch, j) { return '<i style="--j:' + [0.6, -0.8, 0.3, -0.4, 0.9, -0.2, 0.5][j % 7] + '">' + ch + '</i>'; }).join('') + '</b>'; }
  /* THE OPENER: what novel.global and Island Archipelagos are, in the owner's words. Nothing opens from it; × puts it away (the HOME panel brings it back) */
  /* THE OPENER: receipt 00, the first one. Aged thermal paper, black ink only: the mark at its head, the owner's words, an archipelago printed
     in dots at its foot. Nothing opens from it; × puts it away (the HOME panel brings it back). Everything here is made inside functions:
     the first cards are drawn before this part of the file has run */
  function introP() { return [
    'Each unique printer creates a new point of connection and distribution in public, professional, and third spaces.']; }
  /* the seal of the archipelagos: a stamp in the margin of the form. Two rings, a sun of twenty-four rays, the islands as five dots round it */
  function introSeal() { var r = '', d = ''; for (var k = 0; k < 24; k++) { var a = k * Math.PI / 12, l = k % 2 ? 25 : 29; r += 'M' + (50 + 15 * Math.cos(a)).toFixed(1) + ' ' + (50 + 15 * Math.sin(a)).toFixed(1) + 'L' + (50 + l * Math.cos(a)).toFixed(1) + ' ' + (50 + l * Math.sin(a)).toFixed(1); }
    for (k = 0; k < 5; k++) { var b = -Math.PI / 2 + k * Math.PI * 2 / 5; d += '<circle cx="' + (50 + 38.5 * Math.cos(b)).toFixed(1) + '" cy="' + (50 + 38.5 * Math.sin(b)).toFixed(1) + '" r="2.6"/>'; }
    return '<svg class="in-seal" viewBox="0 0 100 100" aria-hidden="true"><circle class="o" cx="50" cy="50" r="47"/><circle class="o" cx="50" cy="50" r="43.5"/><circle class="o t" cx="50" cy="50" r="33"/><path class="ry" d="' + r + '"/><circle class="sn" cx="50" cy="50" r="10"/>' + d + '</svg>'; }
  function introMark() { return '<svg class="in-mk" viewBox="0 0 237 112" role="img" aria-label="novel.global"><defs><pattern id="in-dot" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="1.9" fill="#161514"/></pattern></defs><rect x="10" y="10" width="91.6" height="92" transform="rotate(-.34 56 56)"/><circle cx="178.3" cy="56.5" r="48.8"/></svg>'; }
  function introHTML(c, i, g1) {
    return '<section class="hm-slot su-intro"><div class="hm-sur" aria-hidden="true"></div><article class="hm-card ' + sizeOf(c) + ' shadow sk-intro' + (g1 ? ' g1' : '') + '" data-id="intro" data-i="' + i + '" aria-label="Island Archipelagos">' +
      '<div class="hm-art"><div class="hm-l b"><canvas></canvas></div><div class="hm-l m"><canvas></canvas></div><div class="hm-l t"><canvas></canvas></div></div>' +
      '<div class="in-f"><div class="in-hd">' + introMark() + '</div><h2 class="in-t">A new safe, creative, physical internet</h2>' +
      '<p class="in-l">A local area network of independent publishing islands, built from discarded printers and open-source technology.</p>' +
      '<div class="in-b">' + introP().map(function (q) { return '<p>' + q + '</p>'; }).join('') + '<p class="in-ia"><span>Island Archipelagos</span>' + introSeal() + '</p></div>' +
      '<p class="in-s"><strong>novel.global provides the operating system, software and blueprints to make your own.</strong></p>' +
      '<div class="in-ft"><canvas class="in-arc" aria-hidden="true"></canvas></div></div>' +
      '</article></section>'; }
  /* the archipelago at the receipt's foot: islands from a few octaves of noise, printed the way the T88V prints, black dots on a 4×4 order;
     the coasts ringed, the sea a sparse tone */
  function introArc() { $$('.sk-intro .in-arc', col).forEach(function (cv) { var w = cv.clientWidth, h = cv.clientHeight; if (!w || !h || cv.dataset.pw === w + 'x' + h) return; cv.dataset.pw = w + 'x' + h;
    var px = w > 420 ? 2 : 1.5, W2 = Math.round(w / px), H2 = Math.round(h / px); cv.width = W2; cv.height = H2; var g = cv.getContext('2d'), im = g.createImageData(W2, H2), d = im.data;
    var hs = function (x, y) { var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };
    var vn = function (x, y) { var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      return (hs(xi, yi) * (1 - u) + hs(xi + 1, yi) * u) * (1 - v) + (hs(xi, yi + 1) * (1 - u) + hs(xi + 1, yi + 1) * u) * v; };
    var B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], sc = 7 / W2;
    for (var y = 0; y < H2; y++) for (var x = 0; x < W2; x++) { var X = x * sc, Y = y * sc * 1.15, e = vn(X, Y) * 0.55 + vn(X * 2.1 + 7, Y * 2.1 + 3) * 0.3 + vn(X * 4.7 + 1, Y * 4.7 + 9) * 0.15;
      e += 0.1 * Math.sin(y / H2 * Math.PI) - 0.05; var t, th = B[(y % 4) * 4 + (x % 4)] / 16;
      if (e > 0.58) t = 0.62 + (e - 0.58) * 2.4; else if (Math.abs(e - 0.545) < 0.006 || Math.abs(e - 0.5) < 0.0045) t = 1; else t = 0.07 + Math.max(0, e - 0.3) * 0.25;
      var k = (y * W2 + x) * 4, on = t > th; d[k] = d[k + 1] = d[k + 2] = 20; d[k + 3] = on ? 235 : 0; }
    g.putImageData(im, 0, 0); }); }
  /* the opener's words from admin (HOME, OPENER): headline, lede, paragraphs (a blank line between), signature, closing line; an empty field keeps its own */
  function introCopy(txt) { var o; try { o = JSON.parse(txt); } catch (e) { return; } if (!o || typeof o !== 'object') return;
    $$('.sk-intro', col).forEach(function (cd) { var put = function (q, v) { var e = cd.querySelector(q); if (e && typeof v === 'string' && v.trim()) e.textContent = v.trim(); };
      put('.in-t', o.head); put('.in-l', o.lede); put('.in-ia > span', o.sign); put('.in-s strong', o.bar);
      if (typeof o.body === 'string' && o.body.trim()) { var b = cd.querySelector('.in-b'), ia = b && b.querySelector('.in-ia'); if (b) { $$('p:not(.in-ia)', b).forEach(function (p) { p.remove(); });
        o.body.trim().split(/\n\s*\n/).forEach(function (t) { var p = D.createElement('p'); p.textContent = t.trim(); b.insertBefore(p, ia); }); } } });
    INTRO_TXT = txt; requestAnimationFrame(introFit); }
  var INTRO_TXT = '';
  /* the opener stood small: the type steps down until every word is in */
  function introFit() { $$('.sk-intro.small .in-f', col).forEach(function (f) { var px = 19; f.style.fontSize = px + 'px'; while (px > 5.5 && (f.scrollHeight > f.clientHeight + 1 || f.scrollWidth > f.clientWidth + 1)) { px -= 0.25; f.style.fontSize = px + 'px'; } }); introArc(); }
  addEventListener('resize', function () { requestAnimationFrame(introFit); });
  addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-introx]'); if (!b) return; e.preventDefault(); e.stopPropagation(); MINE = MINE || {}; MINE.hide = (MINE.hide || []).concat(['intro']); store.set('da.hm.mine', MINE); applyCards(null); }, true);
  function cardHTML(c, i, g1) { if (c.skin === 'intro') return introHTML(c, i, g1);
    var mo = MOTION || c.motion || 'shadow', sk = c.skin || (SKINS.indexOf(c.id) >= 0 ? c.id : c.isle ? 'isle' : 'plain');
    var sm = sizeOf(c) === 'small', noT = c.ph || (sm && !OPT.talk), noF = c.ph || (sm && !OPT.find);
    var keys = (noT ? '' : '<button class="hm-rk hm-tb" data-talk="' + c.id + '" aria-label="Talk" title="Talk about this"><svg viewBox="0 0 24 24"><path d="M4 5.5h16v10.5h-8.5L7 20v-4H4z"/><path d="M8 9.5h8M8 12.5h5"/></svg></button>') + (noF ? '' : '<button class="hm-rk" data-radar="' + c.id + '" aria-label="Find a printer" title="Find a printer"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/></svg></button>') +
      (c.hub ? '<a class="hm-rk" href="' + esc(c.hub) + '" target="_blank" rel="noopener" aria-label="The building hub"><svg viewBox="0 0 24 24"><path d="M7 17L17 7M9 7h8v8"/></svg></a>' : '');
    var t = esc(c.title), inner;
    if (sk === 'portfolio') inner = '<div class="hm-rc"><img class="rc-art" alt="" src="/cards/portfolio.webp" decoding="async">' + '' + '<img class="rc-tap" alt="" src="/cards/found-tap.jpg" decoding="async"><img class="rc-kept" alt="" hidden><i class="rc-hide" aria-hidden="true"></i><b class="rc-code">DA-ISL1</b>' +
      '<div class="rc-tp"><span class="tp-pr"><small>ONLY</small><b>$15<sup>.90</sup></b></span><span class="tp-tx"><i>AD · bunnings.com.au</i><b>Brasshards Vandal Proof Tap 4 Way &amp; Belt Clip</b><em>I/N 0524216</em></span><a class="tp-go" href="https://www.bunnings.com.au/brasshards-vandal-proof-tap-4-way-belt-clip_p0524216" target="_blank" rel="noopener">SHOP NOW ↗</a></div>' +
      '<div class="rc-txt"><h2 class="hm-t vh">' + t + '</h2></div><b class="rc-ng" aria-hidden="true">' + MARK + '<span>novel.global</span></b>' + STICK888 + '<div class="rc-low"><img class="rc-art rc-art2" alt="" src="/cards/portfolio.webp" decoding="async">' + tape('stories', 'rc-lbl') + tape('WORK', 'rc-lbl rc-work') +
      '<a class="rc-eco" href="https://en.wikipedia.org/wiki/Deep_ecology" target="_blank" rel="noopener" aria-label="Deep ecology"><svg viewBox="0 0 100 100" aria-hidden="true"><defs><path id="rc-eco-r" d="M50 50m-37 0a37 37 0 1 1 74 0a37 37 0 1 1 -74 0"/></defs><circle cx="50" cy="50" r="48" class="bg"/><circle cx="50" cy="50" r="28" class="in"/><text><textPath href="#rc-eco-r">DEEP ECOLOGY · DEEP ECOLOGY ·</textPath></text><path class="lf" d="M50 70C38 60 38 42 50 30C62 42 62 60 50 70ZM50 74V40M50 52l-6-6M50 60l7-7"/></svg></a>' +
      '<canvas class="rc-qr" aria-hidden="true"></canvas></div></div><span class="hm-lamps"></span>';
    else if (sk === 'radio') { var ks = [1]; for (var q = 0; q < 13; q++) ks.push(+(0.84 * Math.pow(0.885, q)).toFixed(3));
      inner = '<h2 class="hm-t vh">' + t + '</h2><span class="hm-lamps"></span>'; }
    else if (sk === 'zine') inner = '<h2 class="hm-t vh">' + t + '</h2><i class="zt-sw" aria-hidden="true"><b></b><b></b><b></b><b></b><b></b></i><span class="hm-lamps"></span>';
    else if (sk === 'research') inner = '<h2 class="hm-t">' + t.split(' ').map(function (w) { return '<span>' + w + '</span>'; }).join('') + '</h2><span class="hm-lamps"></span>';
    else if (sk === 'kit') inner = (c.tag ? '<p class="hm-tag"><i></i>' + esc(c.tag) + '</p>' : '') + '<h2 class="hm-t">' + esc(c.line || c.title) + '</h2><p class="kt-fz">build a solar thermal<br>printer from e-waste</p><span class="hm-sp"></span><span class="hm-lamps"></span>';
    else if (sk === 'space') inner = (OPT.one ? '<div class="sp-prn">' + PRN_HTML + '<button type="button" class="hm-tag sp-inst" data-kitopen title="The install and its checklist"><i></i>ONE CLICK INSTALL</button></div><p class="kt-fz sp-fz">build a solar thermal<br>printer from e-waste</p>' : '') + '<span class="hm-sp"></span>' + MARK + '<h2 class="hm-t">' + esc(c.title.toLowerCase()) + '</h2><p class="sp-sub">THERMAL PRINTER COMMUNITIES</p><span class="hm-lamps"></span>';
    else if (sk === 'play') inner = '<span class="hm-sp"></span><h2 class="hm-t pl-t">' + t + '</h2><b class="sl-un pl-go"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg></b>';
    else if (sk === 'wx') { var nm = t.charAt(0) + t.slice(1).toLowerCase();
      inner = '<h2 class="hm-t vh">' + t + '</h2><div class="wx-f"><i class="wx-a" aria-hidden="true"></i><i class="wx-b" aria-hidden="true"></i>' + (c.g === 'week' ? '<span class="wx-wk" aria-hidden="true"></span>' : '') + '<b class="wx-k">' + nm + '</b>' +
        (c.g === 'read' ? '<div class="wx-bk" aria-hidden="true"><i></i><i></i><p><b class="wx-h"></b><span class="wx-s"></span></p></div>' :
          c.g === 'deck' ? '<div class="wx-pc" aria-hidden="true"><i></i><p><b class="wx-h"></b><i class="wx-ic"><svg viewBox="0 0 24 24"></svg></i><span class="wx-s"></span></p></div>' :
            '<p class="wx-v"><b class="wx-h"></b><span class="wx-l"></span></p><p class="wx-s"></p>') + '</div>'; }
    else if (sk === 'slot' && c.opens === 'bench') inner = '<h2 class="hm-t vh">' + t + '</h2><span class="hm-sp"></span><b class="sl-un sl-mk" title="Make an app: it stands here, in the library"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>MAKE</b>';
    else if (sk === 'slot') inner = '<h2 class="hm-t vh">' + t + '</h2><span class="hm-sp"></span><b class="sl-un"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0"/></svg>UNLOCK</b>';
    else if (sk === 'wish') inner = '<span class="hm-sp"></span><div class="st-name">' + MARK + '<h2 class="hm-t">' + esc(c.title.toLowerCase()) + '</h2><p class="st-alert"><i></i>EL NIÑO · CLIMATE DIRECT ACTION</p></div><span class="hm-lamps"></span>';
    else inner = '<h2 class="hm-t">' + t + '</h2>' + (c.line ? '<p class="hm-line">' + esc(c.line) + '</p>' : '') + '<span class="hm-sp"></span><span class="hm-lamps"></span>';
    var extra = sk === 'wish' ? DRIFT + ORBIT + '<canvas class="st-hud" aria-hidden="true"></canvas><i class="st-grain" aria-hidden="true"></i>' : c.art === 'photos' ? '<div class="hm-pics"></div>' : sk === 'radio' ? '<div class="hm-bgimg"></div><canvas class="rd-sea" aria-hidden="true"></canvas><canvas class="rd-topo" aria-hidden="true"></canvas>' + SWEEP : sk === 'zine' ? '<div class="hm-bgimg"></div>' + ZPOST + ZHERO : sk === 'research' ? refs() : sk === 'space' ? SEA + '<b class="sp-lan" aria-hidden="true"><i></i>LOCAL AREA NETWORK<i></i></b>' : '';
    var front = sk === 'kit' ? '<div class="hm-prn" aria-hidden="true"><div class="ph"></div><i class="led l-pwr"></i><i class="led l-act"></i><i class="led l-prn"></i><span class="slot"><span class="paper"></span></span></div>' : '';
    var smf = sizeOf(c) === 'small' && SMALL[sk] != null ? '<div class="sm-f" aria-hidden="true"><b class="sm-k"><span>' + SMALL_T[sk] + '</span></b>' + SMALL[sk] + '</div>' : ''; if (smf) sk += ' sm';
    return '<section class="hm-slot su-' + sk + '"><div class="hm-sur" aria-hidden="true"></div><article class="hm-card ' + sizeOf(c) + ' ' + mo + ' sk-' + sk + (c.ph || c.pal ? ' pl-' + (((c.pal || c.ph) - 1) % 6 + 1) : '') + (c.fr ? ' fr-' + c.fr : '') + (g1 ? ' g1' : '') + (c.g ? ' g-' + c.g + (c.shelf ? ' r-' + c.shelf : '') : '') + '" data-id="' + c.id + '" data-i="' + i + '" aria-label="' + t + '">' +
      '<div class="hm-art">' + extra + '<div class="hm-l b"><canvas></canvas></div><div class="hm-l m"><canvas></canvas></div><div class="hm-l t"><canvas></canvas>' + front + '</div></div>' +
      '<button class="hm-open" data-open="' + c.id + '" aria-label="Open ' + t + '"></button>' +
      '<div class="hm-keys">' + keys + '</div>' + (sk === 'radio' ? '<button class="rd-nino" aria-pressed="false" aria-label="El Niño" title="El Niño"></button>' : '') + (sk === 'research' ? '<svg class="hm-rune" viewBox="0 0 160 40" aria-hidden="true"><g class="rn-w"></g><g class="rn-fx"></g><rect class="rn-er" x="-30" y="4" width="14" height="32" rx="3"/></svg>' : '') + '<div class="hm-in">' + inner + '</div>' + smf + '<div class="hm-bcn" hidden></div><i class="hm-fr" aria-hidden="true"></i>' + logosOf(c) + '</article></section>';
  }
  /* the street poster on DESIGN PRINT pastes itself up a piece at a time, holds with a glitch now and then, is painted over and goes up again.
     Only while the card is in view and nothing is open over the cards; still and whole for reduced motion */
  var ZP = { t: 0, k: 0, seen: false };
  function zpTick() { clearTimeout(ZP.t); var el = col.querySelector('.sk-zine .zp'); if (!el) return;
    var hero = el.parentNode.querySelector('.zp-hero'), both = function (m, c2) { el.classList[m](c2); if (hero) hero.classList[m](c2); }, ps = $$('.zp-p', el).concat(hero ? [hero] : []); if (RM.matches) { ps.forEach(function (p) { p.classList.add('on'); }); return; }
    if (!ZP.seen || D.hidden || away || xv.classList.contains('on')) { ZP.t = setTimeout(zpTick, 900); return; }
    var n = ps.length, k = ZP.k;
    if (k < n) { ps[k].classList.add('on'); ZP.k++; ZP.t = setTimeout(zpTick, k === 0 ? 500 : 220 + Math.random() * 200); return; }
    if (k < n + 9) { if (Math.random() < 0.6) { both('add', 'gl'); setTimeout(function () { both('remove', 'gl'); }, 330); } ZP.k++; ZP.t = setTimeout(zpTick, 1600 + Math.random() * 1400); return; }
    both('add', 'wipe'); ZP.t = setTimeout(function () { ps.forEach(function (p) { p.classList.remove('on'); }); both('remove', 'wipe'); ZP.k = 0; ZP.t = setTimeout(zpTick, 1400); }, 900); }
  function zpStart() { var el = col.querySelector('.sk-zine'); if (!el) return; /* first seen already up on the wall; then torn down and pasted again */ var ps0 = $$('.sk-zine .zp .zp-p, .sk-zine .zp-hero', col); ps0.forEach(function (p) { p.classList.add('on'); }); ZP.k = ps0.length; if ('IntersectionObserver' in window) { if (ZP.io) ZP.io.disconnect(); ZP.io = new IntersectionObserver(function (es) { ZP.seen = es[es.length - 1].isIntersecting; }, { threshold: 0.25 }); ZP.io.observe(el); } else ZP.seen = true; zpTick(); }
  /* RESEARCH BOARD: a hand writing runes and made-up symbols between the photographs and the name, one after another, then rubbing them out
     and starting again. Now and then a rune finished lights up */
  var RUNES = ['M10 2V26M10 8L17 3M10 14L17 9', 'M6 2V26M6 8L14 14L6 20', 'M4 2V26M16 2V26M4 10L16 18', 'M10 2V26M3 8L10 14L17 8', 'M4 2L16 26M16 2L4 26', 'M10 2V26M4 20L10 14L16 20',
    'M3 26L10 2L17 26', 'M10 2L17 9L10 16L3 9ZM10 16V26', 'M10 14m-1 0a1 1 0 1 1 2 0a3 3 0 1 1-5 0a5 5 0 1 1 9 0a7 7 0 1 1-12 1', 'M2 14Q10 4 18 14Q10 24 2 14ZM7.5 14a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0',
    'M10 2L12.5 11L20 14L12.5 17L10 26L7.5 17L0 14L7.5 11Z', 'M13 3A11 11 0 1 0 13 25A8 8 0 1 1 13 3Z', 'M2 6H18M10 6V26M5 14H15', 'M4 4L16 24M4 24L10 14M16 4L12 11',
    'M2 14a8 8 0 1 0 16 0a8 8 0 1 0-16 0M10 2V26M2 14H18', 'M10 3L18 25H2ZM10 17V19', 'M3 4C9 10 11 18 17 24M17 4C11 10 9 18 3 24M10 2V6', 'M5 26V2L15 9L5 16L15 23'];
  var RN = { t: 0, n: 0, seen: false, last: 0, call: null };
  var SVGNS = 'http://www.w3.org/2000/svg';
  function rnTick() { clearTimeout(RN.t); var sv = col.querySelector('.sk-research .hm-rune'); if (!sv) return; var w = sv.querySelector('.rn-w');
    if (RM.matches) { if (!w.childNodes.length) for (var q = 0; q < 6; q++) rnAdd(sv, q, true); return; }
    if (!RN.seen || D.hidden || away || xv.classList.contains('on')) { RN.t = setTimeout(rnTick, 900); return; }
    if (RN.n < 6) { var g = rnAdd(sv, RN.n, false); RN.n++;
      if (Date.now() - RN.last > 30000) { RN.last = Date.now(); setTimeout(function () { rnMagic(sv, g); }, 900); }
      RN.t = setTimeout(rnTick, 1100 + Math.random() * 700); return; }
    rnErase(sv, function () { RN.n = 0; RN.t = setTimeout(rnTick, 900); }); }
  function rnAdd(sv, k, still) { var g = D.createElementNS(SVGNS, 'g'), d = RUNES[Math.floor(Math.random() * RUNES.length)], x = 6 + k * 25.5 + (Math.random() - 0.5) * 2, y = 5 + (Math.random() - 0.5) * 2, sc = 1.02 + Math.random() * 0.12, rot = (Math.random() - 0.5) * 10;
    g.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + rot.toFixed(1) + ' 10 14) scale(' + sc.toFixed(2) + ')');
    var pa = D.createElementNS(SVGNS, 'path'); pa.setAttribute('d', d); pa.setAttribute('pathLength', '1'); pa.setAttribute('class', 'rn-p' + (still ? ' on' : '')); g.appendChild(pa); sv.querySelector('.rn-w').appendChild(g);
    if (!still) { pa.getBoundingClientRect(); requestAnimationFrame(function () { pa.classList.add('on'); }); } return g; }
  /* the eraser drawn across: each rune smudged out as it passes, a ghost of it left on the paper */
  function rnErase(sv, done) { var er = sv.querySelector('.rn-er'), gs = [].slice.call(sv.querySelectorAll('.rn-w > g'));
    er.classList.add('go'); gs.forEach(function (g, k) { setTimeout(function () { g.classList.add('gone'); }, 200 + k * 260); });
    setTimeout(function () { er.classList.remove('go'); gs.forEach(function (g) { g.remove(); }); [].slice.call(sv.querySelectorAll('.rn-fx > *')).forEach(function (n) { n.remove(); }); done(); }, 200 + gs.length * 260 + 600); }
  /* the magic: sparks off the rune, and the jellyfish called to it from the banner for a few seconds */
  function rnMagic(sv, g) { if (!g.isConnected) return; var fx = sv.querySelector('.rn-fx'), bb = g.getBBox(), cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2, m = g.getCTM && g.getCTM();
    if (m) { cx = m.a * cx + m.c * cy + m.e; cy = m.b * (bb.x + bb.width / 2) + m.d * cy + m.f; }
    for (var i = 0; i < 7; i++) { var a = i / 7 * 6.28 + Math.random() * 0.5, r = 10 + Math.random() * 8, s = D.createElementNS(SVGNS, 'path'); s.setAttribute('class', 'rn-sp'); s.setAttribute('d', 'M0 -2.4V2.4M-2.4 0H2.4'); s.setAttribute('style', '--x:' + (Math.cos(a) * r).toFixed(1) + 'px;--y:' + (Math.sin(a) * r).toFixed(1) + 'px;animation-delay:' + (i * 0.04) + 's'); s.setAttribute('transform', 'translate(' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ')'); fx.appendChild(s); }
    g.classList.add('lit'); }
  function rnStart() { var el = col.querySelector('.sk-research'); if (!el) return; RN.n = 0; var w = el.querySelector('.rn-w'); if (w) w.innerHTML = '';
    if ('IntersectionObserver' in window) { if (RN.io) RN.io.disconnect(); RN.io = new IntersectionObserver(function (es) { RN.seen = es[es.length - 1].isIntersecting; }, { threshold: 0.3 }); RN.io.observe(el); } else RN.seen = true; rnTick(); }
  /* receipt paper at the top and foot of the page: crumpled, torn, the mark set on the foot */
  /* hand-cut patterns, after a sheet of printed textures: maze lines, cracked mosaic, spots, wavy rules, worms, eyes. Drawn here, never loaded */
  function noise2(seed) { var r = rnd(seed), G = []; for (var i = 0; i < 64 * 64; i++) G.push(r());
    var at = function (x, y) { return G[((y & 63) * 64) + (x & 63)]; }, sm = function (t) { return t * t * (3 - 2 * t); };
    return function (x, y) { var xi = Math.floor(x), yi = Math.floor(y), fx = sm(x - xi), fy = sm(y - yi), a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1); return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy; }; }
  function pattern(g, w, h, kind, fg, bg, seed) { var r = rnd(seed || 3); g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.strokeStyle = fg;
    if (kind === 'maze' || kind === 'crack') { var S = 2, W = Math.ceil(w / S), H = Math.ceil(h / S);
      if (kind === 'maze') { var n1 = noise2(seed), n2 = noise2(seed + 9); for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) { var v = n1(x / 9, y / 9) * 0.7 + n2(x / 4, y / 4) * 0.3, f = (v * 9) % 1; if (f < 0.13) g.fillRect(x * S, y * S, S, S); } return; }
      var P = []; for (var k = 0; k < Math.round(w * h / 420); k++) P.push([r() * w, r() * h]);
      for (var y2 = 0; y2 < H; y2++) for (var x2 = 0; x2 < W; x2++) { var px = x2 * S, py = y2 * S, d1 = 1e9, d2 = 1e9; for (var q = 0; q < P.length; q++) { var dx = P[q][0] - px, dy = P[q][1] - py, d = dx * dx + dy * dy; if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
        if (Math.sqrt(d2) - Math.sqrt(d1) > 2.6) g.fillRect(px, py, S, S); } return; }
    if (kind === 'spots') { for (var i = 0; i < w * h / 90; i++) { g.beginPath(); g.ellipse(r() * w, r() * h, 1.5 + r() * 4, 1.2 + r() * 3.4, r() * 3, 0, 7); g.fill(); } return; }
    if (kind === 'lines') { g.lineWidth = 1.6; for (var yy = 3; yy < h; yy += 5.2) { g.beginPath(); for (var xx = 0; xx <= w; xx += 4) { var yv = yy + Math.sin(xx * 0.03 + yy * 0.2) * 1.4; if (xx) g.lineTo(xx, yv); else g.moveTo(xx, yv); } g.stroke(); } return; }
    if (kind === 'worms') { g.lineCap = 'round'; for (var j = 0; j < w * h / 520; j++) { var x0 = r() * w, y0 = r() * h, a = r() * 6.3, L = 8 + r() * 16; g.lineWidth = 4.6; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + Math.cos(a + 1) * L, y0 + Math.sin(a + 1) * L, x0 + Math.cos(a) * L * 1.6, y0 + Math.sin(a) * L * 1.6); g.stroke(); g.save(); g.strokeStyle = bg; g.lineWidth = 1.6; g.stroke(); g.restore(); } return; }
    if (kind === 'eyes') { for (var e = 0; e < w * h / 700; e++) { var ex = 6 + r() * (w - 12), ey = 5 + r() * (h - 10), s = 3 + r() * 2.2; g.beginPath(); g.moveTo(ex - s, ey); g.quadraticCurveTo(ex, ey - s * 0.9, ex + s, ey); g.quadraticCurveTo(ex, ey + s * 0.9, ex - s, ey); g.fill(); g.save(); g.fillStyle = bg; g.beginPath(); g.arc(ex + (r() - 0.5) * s * 0.6, ey, s * 0.32, 0, 7); g.fill(); g.restore(); } } }
  function patCanvas(cv, kind, fg, bg, seed) { var k = Math.min(2, devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return; cv.width = Math.round(w * k); cv.height = Math.round(h * k); var g = cv.getContext('2d'); g.setTransform(k, 0, 0, k, 0, 0); pattern(g, w, h, kind, fg, bg, seed); }
  /* DIRECT ACTION RADIO: contour lines over the photograph, the sea's long swells at the top easing into the rings of hills, soft blue to white,
     gone by halfway down so the picture has its white space */
  function topo() { var cv = col.querySelector('.sk-radio .rd-topo'); if (!cv) return; var w = cv.clientWidth, h = cv.clientHeight; if (!w || !h || cv.dataset.pw === w + 'x' + h) return; cv.dataset.pw = w + 'x' + h;
    var k = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(w * k); cv.height = Math.round(h * k); var g = cv.getContext('2d'); g.setTransform(k, 0, 0, k, 0, 0);
    var sea = noise2(301), land = noise2(302), hill = [[0.22, 0.62, 0.2], [0.74, 0.78, 0.24], [0.5, 0.95, 0.16]], S = 1.5;
    
    for (var y = 0; y < h; y += S) { var t = Math.min(1, Math.max(0, (y / h - 0.05) / 0.55)), e = t * t * (3 - 2 * t);
      for (var x = 0; x < w; x += S) { var o = sea(x / 70, y / 16) * 0.8 + sea(x / 22, y / 9) * 0.2, l = land(x / 46, y / 46) * 0.6;
        for (var q = 0; q < hill.length; q++) { var dx = x / w - hill[q][0], dy = y / h - hill[q][1]; l += Math.exp(-(dx * dx + dy * dy) / (hill[q][2] * hill[q][2])) * 0.9; }
        var f = (o * (1 - e) + l * e) * 13, fr = f - Math.floor(f); if (fr < 0.07) { g.fillStyle = 'rgba(' + Math.round(62 + 80 * e) + ',' + Math.round(112 + 66 * e) + ',' + Math.round(190 + 36 * e) + ',' + (0.6 - 0.2 * e).toFixed(2) + ')'; g.fillRect(x, y, S, S); } } } }
  /* CIRCULAR STRATEGY: a quiet field-study layer over the photographs, no words: a flow of fine marks drifting, thin orange paths with points
     travelling along them, and a few tracker frames that settle on something, hold, and move on. About twenty frames a second, only in view */
  var HUD = { cv: null, g: null, w: 0, h: 0, seen: false, last: 0, paths: [], boxes: [], fl: null };
  function hudInit() { var cv = col.querySelector('.sk-wish .st-hud'); if (!cv) return; HUD.cv = cv; HUD.fl = noise2(511);
    if ('IntersectionObserver' in window) { if (HUD.io) HUD.io.disconnect(); HUD.io = new IntersectionObserver(function (es) { HUD.seen = es[es.length - 1].isIntersecting; }, { threshold: 0.2 }); HUD.io.observe(cv); } else HUD.seen = true;
    HUD.w = 0; HUD.boxes = []; }
  function hudSize() { var cv = HUD.cv, w = cv.clientWidth, h = cv.clientHeight; if (w === HUD.w && h === HUD.h) return; var k = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(w * k); cv.height = Math.round(h * k); HUD.g = cv.getContext('2d'); HUD.g.setTransform(k, 0, 0, k, 0, 0); HUD.w = w; HUD.h = h;
    var r = rnd(97); HUD.paths = [0, 1, 2].map(function (i) { var y0 = h * (0.12 + r() * 0.5), y1 = h * (0.15 + r() * 0.55); return [[-10, y0], [w * (0.25 + r() * 0.2), y0 + (r() - 0.5) * h * 0.4], [w * (0.55 + r() * 0.2), y1 + (r() - 0.5) * h * 0.4], [w + 10, y1]]; }); }
  function bez(P, t) { var u = 1 - t; return [0, 1].map(function (j) { return u * u * u * P[0][j] + 3 * u * u * t * P[1][j] + 3 * u * t * t * P[2][j] + t * t * t * P[3][j]; }); }
  function hudDraw(now) { if (!HUD.cv || !HUD.cv.isConnected) { hudInit(); if (!HUD.cv) return; } if (!HUD.seen || RM.matches || away || xv.classList.contains('on') || now - HUD.last < 48) return; HUD.last = now; hudSize();
    var g = HUD.g, w = HUD.w, h = HUD.h, t = now / 1000; if (!g || !w) return; g.clearRect(0, 0, w, h);
    /* the flow: a grid of short marks turning with a slow field */
    g.strokeStyle = 'rgba(244,241,232,.24)'; g.fillStyle = 'rgba(244,241,232,.34)'; g.lineWidth = 0.6; var st = 17;
    for (var y = st / 2; y < h; y += st) for (var x = st / 2; x < w; x += st) { var a = HUD.fl(x / 90 + t * 0.05, y / 90) * 6.28 * 1.4, dx = Math.cos(a) * 3.2, dy = Math.sin(a) * 3.2; g.beginPath(); g.moveTo(x - dx, y - dy); g.lineTo(x + dx, y + dy); g.stroke(); g.fillRect(x + dx - 0.6, y + dy - 0.6, 1.2, 1.2); }
    /* the paths, and points riding them */
    g.lineWidth = 0.8; HUD.paths.forEach(function (P, i) { g.strokeStyle = 'rgba(255,138,64,.5)'; g.beginPath(); g.moveTo(P[0][0], P[0][1]); g.bezierCurveTo(P[1][0], P[1][1], P[2][0], P[2][1], P[3][0], P[3][1]); g.stroke();
      for (var k = 0; k < 5; k++) { var q = bez(P, ((t * 0.05 * (1 + i * 0.3) + k / 5) % 1)); g.fillStyle = 'rgba(255,150,80,.85)'; g.beginPath(); g.arc(q[0], q[1], 1.3, 0, 7); g.fill(); }
      var n = bez(P, 0.5 + i * 0.12); g.strokeStyle = 'rgba(255,120,60,.7)'; g.beginPath(); g.arc(n[0], n[1], 3, 0, 7); g.stroke(); });
    /* the trackers: a thin frame finds a spot, holds with its little linkage inside, and fades */
    if (HUD.boxes.length < 3 && Math.random() < 0.02) { var bw = w * (0.14 + Math.random() * 0.12), bh = bw * (1 + Math.random() * 0.5); HUD.boxes.push({ x: Math.random() * (w - bw), y: h * 0.06 + Math.random() * (h * 0.6 - bh), w: bw, h: bh, t0: t, life: 5 + Math.random() * 4, j: [0, 1, 2, 3].map(function () { return [Math.random(), Math.random()]; }) }); }
    HUD.boxes = HUD.boxes.filter(function (b) { var age = t - b.t0; if (age > b.life) return false; var al = Math.min(1, age / 0.6, (b.life - age) / 0.8), sc = 1 + Math.max(0, 0.6 - age) * 0.25;
      g.save(); g.globalAlpha = al; var cx = b.x + b.w / 2, cy = b.y + b.h / 2, bw2 = b.w * sc, bh2 = b.h * sc; g.strokeStyle = 'rgba(244,241,232,.75)'; g.lineWidth = 0.8; g.strokeRect(cx - bw2 / 2, cy - bh2 / 2, bw2, bh2);
      g.fillStyle = '#E5262B'; g.beginPath(); g.arc(cx + bw2 * 0.3, cy - bh2 / 2, 2.2, 0, 7); g.fill();
      g.strokeStyle = 'rgba(229,38,43,.75)'; g.beginPath(); b.j.forEach(function (p, k) { var px = b.x + b.w * (0.2 + p[0] * 0.6) + Math.sin(t * 1.3 + k) * 1.5, py = b.y + b.h * (0.15 + k * 0.22); if (k) g.lineTo(px, py); else g.moveTo(px, py); }); g.stroke();
      b.j.forEach(function (p, k) { g.fillStyle = 'rgba(255,170,150,.9)'; g.beginPath(); g.arc(b.x + b.w * (0.2 + p[0] * 0.6) + Math.sin(t * 1.3 + k) * 1.5, b.y + b.h * (0.15 + k * 0.22), 1.3, 0, 7); g.fill(); });
      g.fillStyle = 'rgba(244,241,232,.85)'; g.fillRect(b.x + b.w * 0.55, b.y + b.h * 0.12, b.w * 0.14, b.h * 0.2); g.fillStyle = 'rgba(11,11,11,.85)'; g.fillRect(b.x + b.w * 0.69, b.y + b.h * 0.12, b.w * 0.1, b.h * 0.2);
      g.restore(); return true; }); }
  function paperEdges() { var f = col.querySelector('.hm-foot'); if (f) { var m = f.querySelector('.hf-m'); if (m && !m.innerHTML) m.innerHTML = MARK + '<span>novel.global</span>';
      $$('canvas[data-pat]', f).forEach(function (cv, k) { var t = cv.dataset.pat.split(','); patCanvas(cv, t[0], t[1], t[2], 40 + k * 7); }); }
    var te = root.querySelector('.hm-tear canvas'); if (te) patCanvas(te, 'maze', '#F1EEE6', '#0B0B0B', 21); }
  addEventListener('resize', function () { clearTimeout(paperEdges.t); paperEdges.t = setTimeout(function () { paperEdges(); topo(); }, 240); });
  /* each card painted to its own size; again when the size changes */
  function paint(el) {
    var c = byId(el.dataset.id); if (!c) return; var i = +el.dataset.i, L = {}, w = 0, h = 0, k = Math.min(1.5, devicePixelRatio || 1);
    ['b', 'm', 't'].forEach(function (n) { var cv = el.querySelector('.hm-l.' + n + ' > canvas'), lw = cv.parentNode.clientWidth, lh = cv.parentNode.clientHeight; w = lw; h = lh;
      cv.width = Math.round(lw * k); cv.height = Math.round(lh * k); var g = cv.getContext('2d'); g.setTransform(k, 0, 0, k, 0, 0); L[n] = g; });
    if (!w || !h) return; el.dataset.pw = w + 'x' + h; (ART[c.art] || ART.plain)(L, w, h, i, c);
  }
  function paintAll(force) { cards.forEach(function (el) { var l = el.querySelector('.hm-l.b'); if (force || el.dataset.pw !== l.clientWidth + 'x' + l.clientHeight) paint(el); }); }
  var FONTS = D.fonts && D.fonts.ready ? D.fonts.ready : Promise.resolve(); FONTS.then(function () { paintAll(true); });
  var pT = 0; addEventListener('resize', function () { clearTimeout(pT); pT = setTimeout(paintAll, 180); });

  /* ───────── each card's own pictures: the strategy's photographs turning, the picture behind the radio ───────── */
  var TURN = [];
  function pics() {
    TURN.forEach(clearInterval); TURN = [];
    cards.forEach(function (el) { var id = el.dataset.id, cp = CPICS[id] || {}, own = OWNPICS[id === 'wish' ? 'novelglobal' : id];
      if (id === 'wish') cp = { pics: FOUNDPICS, speed: cp.speed || 3, shade: cp.shade }; else if (own && !(cp.pics && cp.pics.length)) cp = { pics: own, speed: cp.speed, shade: cp.shade };
      var box = el.querySelector('.hm-pics'), bg = el.querySelector('.hm-bgimg');
      if (box) { var ls = (cp.pics || []).slice(0, 10); box.innerHTML = ls.map(function (u, j) { return '<img alt="" decoding="async" fetchpriority="' + (j ? 'low' : 'high') + '" ' + (j ? 'data-src' : 'src') + '="' + esc(u) + '"' + (j === 0 ? ' class="on"' : '') + '>'; }).join(''); box._wake = []; box.classList.toggle('none', !ls.length);
        /* every photograph is fetched and decoded before it is shown, and one not yet ready is passed over, so each change is instant */
        if (ls.length > 1 && !RM.matches) { (function (box, ms) { var at = 0, ims = $$('img', box), ok = ims.map(function () { return false; });
          ims.forEach(function (im, j) { var go = function () { if (im.dataset.src) { im.src = im.dataset.src; im.removeAttribute('data-src'); } (im.decode ? im.decode() : Promise.resolve()).then(function () { ok[j] = true; }, function () {}); }; if (j === 0) go(); else box._wake.push(go); });
          TURN.push(setInterval(function () { if (D.hidden || away || xv.classList.contains('on')) return; var n = at; do { n = (n + 1) % ims.length; } while (!ok[n] && n !== at); if (n === at) return; ims[at].classList.remove('on'); at = n; ims[at].classList.add('on'); }, ms)); })(box, Math.max(1, cp.speed || 2) * 1000); } }
      if (bg) { var u = (cp.pics || [])[0]; bg.style.backgroundImage = u ? 'url("' + u.replace(/"/g, '') + '")' : ''; bg.style.opacity = u ? String(cp.shade == null ? 1 : cp.shade) : '0'; } });
  }
  /* an island whose keeper has given it pictures, with CARDS switched on, stands in the column too */
  function isleCards() { var add = false;
    PRN.forEach(function (p) { if (!p.links || p.links.indexOf('cards') < 0 || p.id === 'novelglobal' || byId(p.id) || !(CPICS[p.id] && CPICS[p.id].pics.length)) return;
      var at = CARDS.findIndex(function (c) { return c.ph; }); CARDS.splice(at < 0 ? CARDS.length : at, 0, { id: p.id, size: 'small', title: String(p.name || p.id).toUpperCase().slice(0, 40), opens: 'panel', island: p.id, art: 'photos', isle: 1, motion: 'shadow', where: [-37.8136, 144.9631] }); add = true; });
    if (!add) return; var real = CARDS.filter(function (c) { return c.size === 'small' && !c.ph; }).length, want = Math.ceil((real + 1) / 3) * 3 - real, k = 0;
    for (var j = CARDS.length - 1; j >= 0; j--) if (CARDS[j].ph && ++k > want) CARDS.splice(j, 1);
    applyCards(''); }
  var PLAY_TH = ['dots', 'lilac', 'cyan', 'coral', 'pink', 'print'];
  function playCards(l) { var add = false;
    (l || []).slice(0, 12).forEach(function (p) { var id = 'pl-' + String(p.c).toLowerCase(); if (!/^PL-[A-Z2-9]{4}$/.test(p.c) || byId(id)) return;
      var at = CARDS.findIndex(function (c) { return c.ph; }); CARDS.splice(at < 0 ? CARDS.length : at, 0, { id: id, size: 'small', title: String(p.n || '').toUpperCase().slice(0, 24), opens: 'play', play: p.c, skin: 'play', art: 'slot', pal: PLAY_TH.indexOf(p.th) + 1 || 6, fr: /^(dots|steps|stripe|coral|lunch|print)$/.test(p.fr || '') ? p.fr : '', motion: 'shadow', where: [-37.8136, 144.9631] }); add = true; });
    if (!add) return; var real = CARDS.filter(function (c) { return c.size === 'small' && !c.ph; }).length, want = Math.ceil((real + 1) / 3) * 3 - real, k = 0;
    for (var j = CARDS.length - 1; j >= 0; j--) if (CARDS[j].ph && ++k > want) CARDS.splice(j, 1);
    applyCards(''); }
  fetch('/api/plays').then(function (r) { return r.ok ? r.json() : { plays: [] }; }).then(function (j) { playCards(j.plays); }).catch(function () { /* none yet */ });
  /* PORTFOLIO: the last print kept on this phone, its code, how many; a QR to the portfolio */
  function receipt() {
    var el = col.querySelector('[data-id="portfolio"]'); if (!el) return; var a = AU();
    var st = store.get('da.hm.stories', 'tap'), k = el.querySelector('.rc-kept'), rc = el.querySelector('.hm-rc'); k.hidden = true; rc.classList.remove('kept'); el.querySelector('.rc-code').textContent = 'DA-ISL1';
    var keep = function (u) { k.src = u; k.hidden = false; rc.classList.add('kept'); };
    if (/^data:image\//.test(st)) keep(st);
    else if (st === 'last') (a && a.folio ? a.folio() : Promise.resolve([])).then(function (l) { l = l || []; var last = l[0];
      if (last && last.src) keep(last.src); if (last && last.code) el.querySelector('.rc-code').textContent = last.code; }).catch(function () {});
    var q = el.querySelector('.rc-qr'); (window.qrcode ? Promise.resolve(window.qrcode) : new Promise(function (ok, no) { var s = D.createElement('script'); s.src = 'vendor/qrcode.js'; s.onload = function () { ok(window.qrcode); }; s.onerror = no; D.head.appendChild(s); })).then(function (qr) {
      var m = qr(0, 'M'); m.addData('https://novel.global/?stories'); m.make(); var n = m.getModuleCount(), px = 4, pad = 2; q.width = q.height = (n + pad * 2) * px; var g = q.getContext('2d'); g.fillStyle = '#F4F1E8'; g.fillRect(0, 0, q.width, q.height); g.fillStyle = '#143D71';
      for (var r = 0; r < n; r++) for (var cc = 0; cc < n; cc++) if (m.isDark(r, cc)) g.fillRect((cc + pad) * px, (r + pad) * px, px, px); }).catch(function () {});
  }
  /* the last print, hanging from ISLAND's slot */
  function lastPrint() { var el = col.querySelector('.hm-prn .paper'); if (!el) return; var pt = store.get('da.pt.v1', null), a = AU(), put = function (u) { if (u) el.innerHTML = '<img alt="" src="' + esc(u) + '">'; };
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
    var pg = pages(), n = 0, best = 1e9, c0 = col.getBoundingClientRect().top; pg.forEach(function (el, i) { var dd = Math.abs(el.getBoundingClientRect().top - c0); if (dd < best) { best = dd; n = i; } });
    var cur = pg[n] ? (pg[n].classList.contains('hm-trio') ? pg[n].querySelector('.hm-card') : pg[n]) : null; CUR = cur ? cur.dataset.id : ''; $$('.hm-dots i').forEach(function (d, i) { d.classList.toggle('on', i === n); });
  }
  col.addEventListener('scroll', function () { if (!tick) tick = requestAnimationFrame(parallax); }, { passive: true });
  addEventListener('resize', function () { if (!tick) tick = requestAnimationFrame(parallax); });
  /* a key turns the page, as a swipe does */
  addEventListener('keydown', function (e) { if (H.classList.contains('hm-away') || xv.classList.contains('on') || /INPUT|TEXTAREA/.test((e.target || {}).tagName || '')) return;
    var d = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1 }[e.key]; if (!d) { if (e.key === 'Escape' && root.classList.contains('reef')) reef(false); return; } e.preventDefault();
    var c0 = col.getBoundingClientRect().top, pad = parseFloat(getComputedStyle(col).scrollPaddingTop || 0), box = function (el) { return el.classList.contains('hm-trio') || getComputedStyle(el.parentNode).display === 'contents' ? el : el.parentNode; }, pg = pages();
    var tops = pg.map(function (el) { return box(el).getBoundingClientRect().top - c0 + col.scrollTop; }), y = col.scrollTop + pad + 12, i = 0; while (i < tops.length - 1 && tops[i + 1] <= y) i++;
    col.scrollTo({ top: tops[Math.max(0, Math.min(pg.length - 1, i + d))] - pad, behavior: RM.matches ? 'auto' : 'smooth' }); });

  /* ───────── away and back: every experience leaves from its card and returns to it ───────── */
  var away = false;
  function goAway(then) {
    away = true; H.classList.add('hm-away'); history.pushState({ hm: 'away' }, ''); var a = AU();
    if (a && a.wake) { a.wake(); } if (then) setTimeout(then, 60);
  }
  function home() {
    if (xv.classList.contains('on')) shut(true); if (IN.id === 'wish') { intro(false); IN.id = null; } if (!away) return; away = false; H.classList.remove('hm-away'); var a = AU(); if (a && a.sleep) a.sleep(); lamps(); parallax();
  }
  addEventListener('popstate', function () { if (xv.classList.contains('on')) shut(true); else if (away) home(); });
  setTimeout(function () { var a = AU(); if (location.hash && a && a.wake) { away = true; H.classList.add('hm-away'); } else if (a && a.sleep) a.sleep(); }, 0);

  function open(id, opt) {
    var c = byId(id); if (!c) return; H.classList.toggle('hm-nosea', c.sea === 'off'); careEarn(id); beep(660, 0.06); intro(false); IN.id = id; IN.quiet = !!(opt && opt.talk); tkHide(); IN.run = null; TKH.card = c.opens === 'aura' ? null : id; if (TKH.card) tkCount();
    if (c.opens === 'aura') { setTimeout(intro, 1600); return goAway(function () { var a = AU(); if (a && a.home) a.home(); }); }
    if (c.opens === 'radio' && AIR.fr && AIR.kept) return sheet(c.title, function (b) { b.hidden = true; AIR.kept = false; AIR.fr.classList.remove('hm-air'); });
    if (c.opens === 'radio') return sheet(c.title, inFrame('studio?from=aura&only=radio' + (wired('radio', 'wish') ? '' : '&solo=1') + '#radio'));
    if (c.opens === 'portfolio') { return sheet(c.title, inFrame('art?in=1&one=1')); }
    if (c.opens === 'press') return sheet(c.title, inFrame('studio?from=aura&only=print#print'));
    if (c.opens === 'research') return sheet(c.title, function (b) { var w = wired('wish', 'research'); inFrame('research?in=1' + (w ? '&wish=1' : '') + '#b')(b); var fr = xv.querySelector('iframe:not(.hm-air):not(.hm-warm)');
      if (w) fr.addEventListener('load', function () { var a = AU(), p = a && a.piece ? a.piece() : null; fr.contentWindow.postMessage({ hm: 'form', img: (p && p.photo) || '', words: ((p && p.say) || '').slice(0, 140) }, location.origin); }); });
    if (/^stack:/.test(c.opens)) return sheet(c.title, function (b) { stackIn(b, c.opens.slice(6), opt); });
    if (c.opens === 'pop') return sheet(c.title, inFrame((c.pop === 'pickles' ? 'pickles' : 'popup') + '?in=1#p'));
    if (c.opens === 'kit') return sheet(c.title, kitIn);
    if (c.opens === 'panel') return sheet(c.title, panelIn);
    if (c.opens === 'bench') { var bm = (opt && opt.mode) || c.mode; return sheet(c.title, inFrame('bench?in=1' + (bm ? '&m=' + bm : '') + '#b')); }
    if (c.opens === 'unlock') return sheet('YOUR PRINTER', unlockIn);
    if (c.opens === 'play') return sheet(c.title, inFrame('play.html?c=' + encodeURIComponent(c.play) + '#p'));
  }
  /* the sheet: an experience in the column's own place, the back key to the card it came from */
  var WARM = [];
  function warmDrop() { if (!WARM) return; WARM.forEach(function (f) { f.remove(); }); WARM = []; }
  function warmable(f) { return !!(f && f.dataset.src && f.dataset.ld && !/only=radio|wish=1|remix=1/.test(f.dataset.src)); }
  function remixIn(img) { var c = byId('zine'); if (!c || !/^\/[^/]/.test(img)) return; careEarn('zine'); beep(660, 0.06); intro(false); IN.id = null; TKH.card = 'zine'; tkCount();
    sheet(c.title, inFrame('studio?from=aura&only=print&fmt=long&remix=1#print')); var fr = xv.querySelector('iframe:not(.hm-air):not(.hm-warm)'); if (!fr) return;
    var tell = function () { try { fr.contentWindow.postMessage({ ng: 'remix', img: img }, location.origin); } catch (e) { /* gone */ } };
    fr.addEventListener('load', function () { [600, 1800, 3600].forEach(function (t) { setTimeout(tell, t); }); }); }
  addEventListener('message', function (e) { if (e.origin === location.origin && e.data && e.data.hm === 'remix' && typeof e.data.img === 'string') { SH.swap = true; remixIn(e.data.img); } });
  function inFrame(src) { return function (b) { b.hidden = true; var url = src.replace('#', '&night=' + (NIGHT ? 1 : 0) + '#'), w = WARM.filter(function (f) { return f.dataset.src === url && f.isConnected; })[0];
    if (w) { WARM = WARM.filter(function (f) { return f !== w; }); w.classList.remove('hm-warm'); w.title = xv.getAttribute('aria-label'); return; }
    var fr = D.createElement('iframe'); fr.title = xv.getAttribute('aria-label'); fr.src = url; fr.dataset.src = url; fr.addEventListener('load', function () { fr.dataset.ld = 1; }); if (/only=radio/.test(src)) { AIR.fr = fr; AIR.on = false; } xv.appendChild(fr); }; }
  /* the radio on air: once playing, it keeps playing under the home and every other card until stopped, and waits under any other sound */
  var AIR = { fr: null, on: false, kept: false, held: {} };
  function airTell() { if (!AIR.fr || !AIR.fr.contentWindow) return; var h = Object.keys(AIR.held).some(function (k) { return AIR.held[k]; }); try { AIR.fr.contentWindow.postMessage({ ng: 'hush', on: h }, location.origin); } catch (e) { /* gone */ } }
  function airSound(on, k) { if (!!AIR.held[k] === !!on) return; AIR.held[k] = !!on; airTell(); }
  function airDrop() { if (AIR.fr) { AIR.fr.remove(); } AIR.fr = null; AIR.on = false; AIR.kept = false; AIR.held = {}; }
  addEventListener('message', function (e) { if (e.origin !== location.origin || !e.data) return; var d = e.data;
    if (d.ng === 'radio' && AIR.fr && e.source === AIR.fr.contentWindow) { AIR.on = !!d.on; if (!AIR.on && AIR.kept && !Object.keys(AIR.held).some(function (k) { return AIR.held[k]; })) airDrop(); return; }
    if (d.ng === 'sound' && !(AIR.fr && e.source === AIR.fr.contentWindow)) airSound(d.on, 'f-' + (d.k || 's')); });
  addEventListener('ng-sound', function (e) { var d = e.detail || {}; airSound(d.on, d.k || 'aura'); });
  /* the sheet slides up once its experience has drawn (or after a beat), and the banner goes only once the sheet covers it */
  var SH = { up: 0, top: 0, gone: [] };
  function sheet(title, fill) {
    clearTimeout(SH.up); clearTimeout(SH.top); SH.gone.forEach(function (n) { n.remove(); }); SH.gone = [];
    xv.setAttribute('aria-label', title); var body = xv.querySelector('.hm-body');
    if (AIR.fr && !AIR.kept) { if (AIR.on) { AIR.kept = true; AIR.fr.classList.add('hm-air'); } else { AIR.fr = null; AIR.on = false; } }
    [].slice.call(xv.children).forEach(function (n) { if (n.tagName === 'IFRAME' && n !== AIR.fr && WARM.indexOf(n) < 0) n.remove(); }); body.hidden = false; body.innerHTML = ''; body.className = 'hm-body';
    fill(body); var fr = xv.querySelector('iframe:not(.hm-air):not(.hm-warm)'), done = false;
    var go = function () { if (done) return; done = true; clearTimeout(SH.up); H.classList.add('hm-sheet'); xv.classList.add('on'); SH.top = setTimeout(function () { H.classList.add('hm-up'); intro(); }, 470); };
    if (fr && fr.dataset.ld) go(); else if (fr) { fr.addEventListener('load', function () { setTimeout(go, 80); }); SH.up = setTimeout(go, 1400); } else go();
    if (SH.swap) { SH.swap = false; history.replaceState({ hm: 'x' }, ''); } else history.pushState({ hm: 'x' }, ''); setTimeout(function () { xv.querySelector('.hm-back').focus(); }, 50);
  }
  function shut(fromPop) { tkHide(); TKH.card = null; clearTimeout(SH.up); clearTimeout(SH.top); intro(false); IN.id = null; xv.classList.remove('on'); H.classList.remove('hm-sheet', 'hm-up', 'hm-nosea');
    var old = [].slice.call(xv.children).filter(function (n) { return n.tagName === 'IFRAME' && WARM.indexOf(n) < 0; });
    if (AIR.fr && old.indexOf(AIR.fr) >= 0) { if (AIR.on) { old = old.filter(function (n) { return n !== AIR.fr; }); var af = AIR.fr; AIR.kept = true; setTimeout(function () { if (AIR.fr === af && AIR.kept) af.classList.add('hm-air'); }, 460); } else { AIR.fr = null; AIR.on = false; AIR.kept = false; } }
    old = old.filter(function (n) { if (n === AIR.fr || !warmable(n)) return true; WARM.push(n); setTimeout(function () { if (WARM.indexOf(n) >= 0) n.classList.add('hm-warm'); }, 460); return false; });
    while (WARM.length > 2) WARM.shift().remove();
    SH.gone = SH.gone.concat(old);
    setTimeout(function () { old.forEach(function (n) { n.remove(); }); SH.gone = SH.gone.filter(function (n) { return old.indexOf(n) < 0; }); }, 460); if (!fromPop) history.back(); }
  addEventListener('message', function (e) { if (e.origin === location.origin && e.data && e.data.hm === 'panel' && xv.classList.contains('on')) { shut(true); setTimeout(function () { sheet('ISLAND ARCHIPELAGOS', panelIn); }, 480); } });
  /* an experience asking to go to another card (the radio's species card sent to the research board): the sheet turns to it */
  /* SOUNDS: one small key in the banner, on every card. What sounds now (the radio on air, El Niño on the buoy), every loop recorded on
     the radio and every mixtape, played here one after another; MIX picks loops and keeps them as a mixtape, the same list the radio keeps.
     Small grey tiles in a pixel face, after a mixer's screens */
  var SND = { el: null, rows: [], i: -1, q: null, a: null, mix: false, pick: {} };
  var sndLoops = function () { return (store.get('da.loops.v1', []) || []).filter(function (l) { return l && l.id && l.rec; }); };
  var sndTapes = function () { return store.get('da.tapes.v1', []) || []; };
  var sndLen = function (s2) { s2 = Math.round(s2 || 0); return Math.floor(s2 / 60) + ':' + ('0' + s2 % 60).slice(-2); };
  function sndList() { var ls = sndLoops(), rows = [];
    sndTapes().forEach(function (t) { var ids = (t.ids || []).filter(function (id) { return ls.some(function (l) { return l.id === id; }); }); if (ids.length) rows.push({ k: 'tape', id: t.id, ids: ids, n: t.name || 'MIXTAPE', s: ids.reduce(function (n, id) { var l = ls.filter(function (q) { return q.id === id; })[0]; return n + ((l && l.rec.s) || 0); }, 0) }); });
    ls.forEach(function (l) { rows.push({ k: 'rec', id: l.id, ids: [l.id], n: String((l.where && l.where.place) || 'RADIO').toUpperCase(), s: l.rec.s }); });
    return rows; }
  function sndBlob(id) { return new Promise(function (res) { try { var q = indexedDB.open('novelglobal-kept', 1); q.onupgradeneeded = function () { q.result.createObjectStore('kv'); };
    q.onsuccess = function () { try { var g = q.result.transaction('kv').objectStore('kv').get('rec:' + id); g.onsuccess = function () { res(g.result || null); }; g.onerror = function () { res(null); }; } catch (e) { res(null); } }; q.onerror = function () { res(null); }; } catch (e) { res(null); } }); }
  function sndStop() { if (SND.a) { try { SND.a.pause(); URL.revokeObjectURL(SND.a.src); } catch (e) { /* gone */ } } SND.a = null; SND.q = null; airSound(false, 'snd'); sndDraw(); }
  function sndRec(id) { sndBlob(id).then(function (b) { if (!b) { sndNext(); return; } if (SND.a) { try { SND.a.pause(); URL.revokeObjectURL(SND.a.src); } catch (e) { /* gone */ } }
    var a = new Audio(URL.createObjectURL(b)); SND.a = a; airSound(true, 'snd'); a.onended = sndNext; a.play().catch(function () { sndStop(); }); sndDraw(); }); }
  function sndNext() { if (SND.q && SND.q.length) { sndRec(SND.q.shift()); return; } if (SND.a === null) return; var n = SND.rows.length; if (n > 1) sndPlay((SND.i + 1) % n); else sndStop(); }
  function sndPlay(i) { var r = SND.rows[i]; if (!r) return; SND.i = i; SND.q = r.ids.slice(1); sndRec(r.ids[0]); }
  function sndKeep() { var ids = SND.rows.filter(function (r) { return r.k === 'rec' && SND.pick[r.id]; }).map(function (r) { return r.id; }); if (!ids.length) return;
    var inp = SND.el.querySelector('.sn-nm'), ts = sndTapes(), first = SND.rows.filter(function (r) { return r.id === ids[0]; })[0];
    ts.unshift({ id: 'tp' + Date.now().toString(36), at: Date.now(), name: ((inp && inp.value.trim()) || (first ? first.n : 'MIX')).slice(0, 32).toUpperCase(), ids: ids, sp: null, pub: false }); ts.splice(12);
    store.set('da.tapes.v1', ts); SND.mix = false; SND.pick = {}; beep(880, 0.06); sndDraw(); }
  var sndIc = { radio: '<svg viewBox="0 0 24 24"><path d="M12 13v8M8 21h8M8.5 9.5a5 5 0 0 1 7 0M5.6 6.6a9 9 0 0 1 12.8 0"/><circle cx="12" cy="12" r="1.3" class="f"/></svg>',
    sea: '<svg viewBox="0 0 24 24"><path d="M2 15c2.5-3 5-3 7.5 0s5 3 7.5 0 3.5-2 5-1M2 20c2.5-3 5-3 7.5 0s5 3 7.5 0 3.5-2 5-1"/><path d="M12 3v7M9 6l3-3 3 3"/></svg>',
    mix: '<svg viewBox="0 0 24 24"><circle cx="7" cy="12" r="4"/><circle cx="17" cy="12" r="4"/><path d="M7 16h10"/></svg>' };
  function sndDraw() { if (!SND.el) return; SND.rows = sndList(); var on = !!SND.a, r0 = SND.rows[SND.i], el = SND.el, nino = col.querySelector('.rd-nino');
    $('#hm-snd').classList.toggle('on', on || AIR.on || !!RS.nino);
    el.querySelector('.sn-air').classList.toggle('on', AIR.on); el.querySelector('.sn-air small').textContent = AIR.on ? 'ON AIR' : 'TUNE IN';
    el.querySelector('.sn-sea').classList.toggle('on', !!RS.nino); el.querySelector('.sn-sea').hidden = !nino || away; el.querySelector('.sn-sea small').textContent = RS.nino ? 'ON' : 'OFF';
    el.querySelector('.sn-mx').classList.toggle('on', SND.mix); el.querySelector('.sn-mx small').textContent = SND.mix ? Object.keys(SND.pick).filter(function (k) { return SND.pick[k]; }).length + ' IN' : 'TAPE';
    el.classList.toggle('playing', on); el.querySelector('.sn-ttl').textContent = on && r0 ? r0.n : SND.rows.length ? 'LISTEN' : 'EMPTY';
    el.querySelector('[data-sn="go"]').textContent = on ? '■' : '▶';
    var ol = el.querySelector('.sn-pl'), rows = SND.mix ? SND.rows.filter(function (r) { return r.k === 'rec'; }) : SND.rows;
    ol.innerHTML = rows.length ? rows.map(function (r) { var i = SND.rows.indexOf(r), pk = !!SND.pick[r.id];
      return '<li class="' + (on && i === SND.i ? 'on' : '') + (r.k === 'tape' ? ' tp' : '') + '"><button data-snp="' + i + '"' + (SND.mix ? ' aria-pressed="' + pk + '"' : '') + '><b>' + (SND.mix ? (pk ? '■' : '□') : ('0' + (i + 1)).slice(-2)) + '</b><span>' + esc(r.n) + '</span><i>' + (r.k === 'tape' ? r.ids.length + '× ' : '') + sndLen(r.s) + '</i></button>' +
        (r.k === 'tape' && !SND.mix ? '<button class="x" data-snx="' + esc(r.id) + '" aria-label="Let this mixtape go">×</button>' : '') + '</li>'; }).join('')
      : '<li class="none"><button data-sn="rec"><b>●</b><span>RECORD A LOOP ON THE RADIO</span><i>→</i></button></li>';
    var kp = el.querySelector('.sn-keep'); kp.hidden = !SND.mix; kp.querySelector('button').disabled = !Object.keys(SND.pick).some(function (k) { return SND.pick[k]; }); }
  function sndOpen(on) { if (on && !SND.el) { var el = D.createElement('section'); el.id = 'hm-sounds'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Sounds'); el.hidden = true;
      el.innerHTML = '<div class="sn-row"><b class="sn-t sn-id">SND<br>-01</b><button class="sn-t sn-air">' + sndIc.radio + '<span>RADIO</span><small></small></button><button class="sn-t sn-sea">' + sndIc.sea + '<span>EL NIÑO</span><small></small></button><button class="sn-t sn-mx">' + sndIc.mix + '<span>MIX</span><small></small></button></div>' +
        '<div class="sn-tp"><i class="sn-vu" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></i><b class="sn-ttl"></b><button data-sn="prev" aria-label="Before">⏮</button><button data-sn="go" aria-label="Play or stop">▶</button><button data-sn="next" aria-label="Next">⏭</button></div>' +
        '<ol class="sn-pl" aria-label="Loops and mixtapes"></ol><div class="sn-keep" hidden><input class="sn-nm" maxlength="32" autocomplete="off" placeholder="NAME" aria-label="Its name"><button>KEEP TAPE</button></div>';
      root.appendChild(el); SND.el = el;
      el.addEventListener('click', function (e) { e.stopPropagation(); var b = e.target.closest('button'); if (!b) return; var n = SND.rows.length;
        if (b.classList.contains('sn-air')) { if (AIR.on) { sndOpen(false); airDrop(); beep(392, 0.06); sndDraw(); } else { sndOpen(false); if (xv.classList.contains('on')) { shut(false); setTimeout(function () { open('radio'); }, 480); } else open('radio'); } return; }
        if (b.classList.contains('sn-sea')) { var nb = col.querySelector('.rd-nino'); if (nb) nb.click(); sndDraw(); return; }
        if (b.classList.contains('sn-mx')) { SND.mix = !SND.mix; SND.pick = {}; beep(SND.mix ? 740 : 520, 0.04); sndDraw(); return; }
        if (b.parentNode.classList.contains('sn-keep')) { sndKeep(); return; }
        if (b.dataset.snx) { var ts = sndTapes().filter(function (t) { return t.id !== b.dataset.snx; }); store.set('da.tapes.v1', ts); if (SND.a && SND.rows[SND.i] && SND.rows[SND.i].id === b.dataset.snx) sndStop(); sndDraw(); return; }
        if (b.dataset.snp != null) { var i = +b.dataset.snp, r = SND.rows[i]; if (SND.mix) { SND.pick[r.id] = !SND.pick[r.id]; beep(SND.pick[r.id] ? 990 : 660, 0.03); sndDraw(); return; } if (SND.a && i === SND.i) sndStop(); else sndPlay(i); return; }
        var q = b.dataset.sn; if (q === 'rec') { b.closest('.none') && (sndOpen(false), xv.classList.contains('on') ? (shut(false), setTimeout(function () { open('radio'); }, 480)) : open('radio')); return; }
        if (!n) return; if (q === 'go') { if (SND.a) sndStop(); else sndPlay(Math.max(0, SND.i)); } else sndPlay(((SND.i < 0 ? 0 : SND.i) + (q === 'next' ? 1 : -1) + n) % n); });
      el.querySelector('.sn-nm').addEventListener('keydown', function (e) { if (e.key === 'Enter') sndKeep(); }); }
    if (!SND.el) return; SND.el.hidden = !on; $('#hm-snd').setAttribute('aria-expanded', String(!!on)); if (on) { beep(1320, 0.03); sndDraw(); } }
  $('#hm-snd').addEventListener('click', function (e) { e.stopPropagation(); sndOpen(!SND.el || SND.el.hidden); });
  addEventListener('click', function (e) { if (SND.el && !SND.el.hidden && !e.target.closest('#hm-sounds, #hm-snd')) sndOpen(false); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && SND.el && !SND.el.hidden) sndOpen(false); });
  /* the key's lamp follows what sounds, and the list follows the radio as it keeps loops */
  setInterval(function () { var b = $('#hm-snd'); if (b) b.classList.toggle('on', !!SND.a || AIR.on || !!RS.nino); if (SND.el && !SND.el.hidden) sndDraw(); }, 1500);
  addEventListener('storage', function (e) { if (/^da\.(loops|tapes)\.v1$/.test(e.key || '')) sndDraw(); });
  addEventListener('message', function (e) { var d = e.data; if (e.origin !== location.origin || !d || d.hm !== 'go' || !/^(research|zine|portfolio)$/.test(d.id) || !byId(d.id)) return; if (xv.classList.contains('on')) { shut(false); setTimeout(function () { open(d.id); }, 480); } else open(d.id); });
  xv.querySelector('.hm-back').addEventListener('click', function () { shut(false); beep(330, 0.05); });
  root.addEventListener('contextmenu', function (e) { if (e.target.closest && e.target.closest('.hm-open')) e.preventDefault(); });
  root.addEventListener('click', function (e) {
    var o = e.target.closest('[data-open]'); if (o) { e.preventDefault(); open(o.dataset.open); return; }
    var r = e.target.closest('[data-radar]'); if (r) { beacon(r.dataset.radar, r); return; }
    var ki = e.target.closest('[data-kitopen]'); if (ki) { e.preventDefault(); e.stopPropagation(); open('kit'); return; }
    var pg = e.target.closest('[data-plug]'); if (pg) { e.preventDefault(); e.stopPropagation(); plugOut(pg.dataset.plug); return; }
    var tb = e.target.closest('[data-talk]'); if (tb) { e.preventDefault(); e.stopPropagation(); cardTalk(tb.dataset.talk); beep(620, 0.04); return; }
  });

  /* the first visit to each experience: three notes in pen, an arrow from each to the thing it means. Each waits until its thing is on screen.
     A tap on the thing works as normal; a tap anywhere else only turns the note. Seen once in light and once again in dark */
  var INTRO = {
    radio: [['.rd-play', 'play'], ['.rd-knob[data-knob="water"]', 'each key adds a layer'], ['.flip-b', 'the full studio', 1], ['^#hm-tk', 'talk']],
    portfolio: [['#track', 'swipe. pinch to look closer'], ['#keys [data-k="colour"]', 'colour it'], ['#keys [data-k="print"]', 'print it', 1], ['^#hm-tk', 'talk']],
    zine: [['[data-zt="wild"]', 'three loud marks', 1], ['.zn-tabs [data-zslot="1"]', 'three designs, one per tab'], ['[data-pick="strip"]', 'stickers and pixel animals'], ['^#hm-tk', 'show and talk']],
    research: [['#tools [data-t="paste"]', 'paste a picture'], ['#tools [data-t="link"]', 'tie two things together'], ['#tools [data-t="out"]', 'print or keep'], ['^#hm-tk', 'talk']],
    kit: [['#hm-x .kt-bar a', 'the install guide'], ['#hm-x .hm-list li:not(.gap)', 'tick parts as you find them'], ['#hm-kprint', 'print the parts list'], ['^#hm-tk', 'ask for help']],
    space: [['#modes', 'slip, page, game, live, card, set'], ['#modes [data-m="game"]', 'test a paper game', 1], ['^#hm-tk', 'share or ask']],
    wish: [['#au-seed', 'tap the light to begin'], ['.au-wish textarea', 'four short lines'], ['[data-add="p"]', 'the pixel jellyfish', 1]]
  };
  var IN = { id: null, k: 0, t: 0, el: null, eat: 0, hit: null, cur: null };
  function introStore() { var s = store.get('da.hm.intro', null) || {}; s.seen = s.seen || {}; return s; }
  function introDoc() { if (IN.id === 'wish' || IN.id === 'kit') return D; var f = xv.querySelector('iframe:not(.hm-air):not(.hm-warm)'); try { return f && f.contentDocument && f.contentDocument.readyState !== 'loading' ? f.contentDocument : null; } catch (e) { return null; } }
  function intro(on) {
    clearTimeout(IN.t); clearInterval(IN.fw); if (IN.el) { IN.el.remove(); IN.el = null; } IN.hit = null;
    if (on === false || !IN.id || !INTRO[IN.id] || IN.quiet) return;
    var s = introStore(); if (s.all || (navigator.webdriver && !s.force)) return;
    if (IN.run !== IN.id) { if (s.seen[IN.id]) return; IN.run = IN.id; IN.k = 0; s.seen[IN.id] = INTRO[IN.id].length; store.set('da.hm.intro', s); } if (IN.k >= INTRO[IN.id].length) return;
    var id = IN.id, look = function () { if (IN.id !== id) return; var st = INTRO[id][IN.k], top = st[0].charAt(0) === '^', d = top ? D : introDoc(), el = d && pick(d, top ? st[0].slice(1) : st[0]);
      var r = el && el.getBoundingClientRect(), vh = d && d.defaultView.innerHeight;
      if (r && r.width && !look.moved && (r.top < 0 || r.bottom > vh || r.left < 0 || r.right > d.defaultView.innerWidth)) { look.moved = 1; reveal(el); IN.t = setTimeout(look, 550); return; }
      look.moved = 0;
      var A = r && absOf(d, r), shown = A && r.width && r.height && A.bottom > 0 && A.top < innerHeight && A.right > 0 && A.left < innerWidth && getComputedStyle(el).visibility !== 'hidden';
      if (!shown) { look.at = null; IN.t = setTimeout(look, 250); return; }
      if (!look.at || Math.abs(look.at.top - A.top) + Math.abs(look.at.left - A.left) > 2) { look.at = A; IN.t = setTimeout(look, 160); return; }
      IN.cur = [d, el, st]; IN.at = A; note(d, r, st); follow(); };
    IN.t = setTimeout(look, IN.k ? 80 : 300);
  }
  /* where a thing is on the main screen, through the frame it sits in */
  function absOf(d, r) { var x = 0, y = 0; if (d !== D) { var fe = d.defaultView.frameElement; if (!fe) return null; var b = fe.getBoundingClientRect(); x = b.left; y = b.top; }
    return { top: r.top + y, left: r.left + x, bottom: r.bottom + y, right: r.right + x }; }
  /* the note keeps up with its thing while the sheet settles or the page moves */
  function follow() { clearInterval(IN.fw); IN.fw = setInterval(function () { if (!IN.el || !IN.cur || !IN.cur[1].isConnected) { clearInterval(IN.fw); return; }
    var A = absOf(IN.cur[0], IN.cur[1].getBoundingClientRect()); if (A && IN.at && Math.abs(A.top - IN.at.top) + Math.abs(A.left - IN.at.left) > 3) { IN.at = A; renote(); } }, 300); }
  /* of everything that matches, the first one on show, and of those the first on screen */
  function pick(d, sel) { var w = d.defaultView, all = [].slice.call(d.querySelectorAll(sel)).filter(function (e) { var r = e.getBoundingClientRect(); return r.width && r.height && w.getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden],[aria-hidden="true"]'); });
    return all.filter(function (e) { var r = e.getBoundingClientRect(); return r.bottom > 0 && r.top < w.innerHeight && r.right > 0 && r.left < w.innerWidth; })[0] || all[0] || null; }
  /* bring a thing into view by scrolling only the boxes it sits in; the home itself never moves */
  function reveal(el) { var d = el.ownerDocument, w = d.defaultView, p = el.parentElement, r, b, cs;
    while (p && p !== d.body && p !== d.documentElement) { cs = w.getComputedStyle(p); r = el.getBoundingClientRect(); b = p.getBoundingClientRect();
      if (/(auto|scroll)/.test(cs.overflowY) && p.scrollHeight > p.clientHeight) p.scrollTop += (r.top + r.height / 2) - (b.top + b.height / 2);
      if (/(auto|scroll)/.test(cs.overflowX) && p.scrollWidth > p.clientWidth && (r.left < b.left || r.right > b.right)) p.scrollLeft += (r.left + r.width / 2) - (b.left + b.width / 2);
      p = p.parentElement; }
    if (d !== D) { r = el.getBoundingClientRect(); if (r.top < 0 || r.bottom > w.innerHeight) w.scrollBy(0, r.top + r.height / 2 - w.innerHeight / 2); } }
  function note(d, r, st, still) {
    var off = { x: 0, y: 0 }; if (d !== D) { var fr = (d.defaultView.frameElement || xv.querySelector('iframe:not(.hm-air):not(.hm-warm)')).getBoundingClientRect(); off.x = fr.left; off.y = fr.top; }
    hook(d.defaultView); hook(window);
    var W = innerWidth, Hh = innerHeight, tx = r.left + r.width / 2 + off.x, ty = r.top + r.height / 2 + off.y, rx = Math.min(150, r.width / 2 + 11), ry = Math.min(64, r.height / 2 + 11), tr = ry;
    IN.hit = { x: r.left + off.x - 8, y: r.top + off.y - 8, w: r.width + 16, h: r.height + 16 };
    var g = D.createElement('div'); g.id = 'hm-guide'; g.className = (NIGHT ? 'dk' : '') + (st[2] ? ' key' : '') + (still ? ' on still' : ''); g.setAttribute('aria-live', 'polite');
    g.style.cssText = '--gx:' + tx + 'px;--gy:' + ty + 'px;--rx:' + (rx + 6) + 'px;--ry:' + (ry + 6) + 'px';
    var nw = Math.min(260, W - 48), nx = Math.max(24, Math.min(W - 24 - nw, tx - nw / 2 + (tx < W / 2 ? 40 : -40)));
    g.innerHTML = '<p style="left:' + nx + 'px;width:' + nw + 'px">' + st[1] + '</p><b>' + (IN.k + 1) + ' / ' + INTRO[IN.id].length + '</b>';
    D.body.appendChild(g); IN.el = g;
    var p = g.querySelector('p'), ph = p.offsetHeight, below = ty < Hh * 0.52, ny = below ? Math.min(Hh - ph - 40, ty + tr + 64) : Math.max(56, ty - tr - 64 - ph);
    p.style.top = ny + 'px';
    var sx = nx + nw / 2 + (tx < nx + nw / 2 ? -nw / 5 : nw / 5), sy = below ? ny - 8 : ny + ph + 8, a = Math.atan2(sy - ty, sx - tx), ex = tx + Math.cos(a) * (rx + 6), ey = ty + Math.sin(a) * (ry + 6);
    var bend = (IN.k % 2 ? 1 : -1) * Math.min(60, Math.hypot(sx - ex, sy - ey) * 0.35), mx = (sx + ex) / 2 - Math.sin(a) * bend, my = (sy + ey) / 2 + Math.cos(a) * bend;
    var ha = Math.atan2(ey - my, ex - mx), h1 = [ex - Math.cos(ha - 0.5) * 13, ey - Math.sin(ha - 0.5) * 13], h2 = [ex - Math.cos(ha + 0.5) * 13, ey - Math.sin(ha + 0.5) * 13];
    var ring = '', R = rnd(7 + IN.k); for (var i = 0; i <= 44; i++) { var t = i / 40 * Math.PI * 2 + 0.4, w = 1 + Math.sin(t * 3 + R() * 2) * 0.035; ring += (i ? 'L' : 'M') + (tx + Math.cos(t) * (rx + 2) * w).toFixed(1) + ' ' + (ty + Math.sin(t) * (ry + 2) * w).toFixed(1); }
    g.insertAdjacentHTML('afterbegin', '<svg aria-hidden="true"><path class="ring" d="' + ring + '"/><path d="M' + sx.toFixed(1) + ' ' + sy.toFixed(1) + 'Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + ex.toFixed(1) + ' ' + ey.toFixed(1) + '"/><path class="hd" d="M' + h1[0].toFixed(1) + ' ' + h1[1].toFixed(1) + 'L' + ex.toFixed(1) + ' ' + ey.toFixed(1) + 'L' + h2[0].toFixed(1) + ' ' + h2[1].toFixed(1) + '"/></svg>');
    if (!still) requestAnimationFrame(function () { g.classList.add('on'); });
  }
  function renote() { if (!IN.el || !IN.cur || !IN.cur[1].isConnected) return; var old = IN.el, r = IN.cur[1].getBoundingClientRect(); note(IN.cur[0], r, IN.cur[2], true); old.remove(); }
  function introNext() { IN.k++; var g = IN.el; IN.el = null; IN.hit = null;
    if (g) { g.classList.remove('on'); setTimeout(function () { g.remove(); }, 260); } if (IN.k < INTRO[IN.id].length) intro(); }
  function hook(w) { if (!w || w.__hmIntro) return; w.__hmIntro = 1; var raf = 0, again = function () { if (IN.el && !raf) raf = requestAnimationFrame(function () { raf = 0; renote(); }); };
    w.addEventListener('scroll', again, true); w.addEventListener('resize', again);
    var stop = function (e) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); };
    w.addEventListener('pointerdown', function (e) { if (!IN.el || !IN.hit) return; var x = e.clientX, y = e.clientY;
      if (w !== window) { var fr = w.frameElement || xv.querySelector('iframe:not(.hm-air):not(.hm-warm)'); if (fr) { var b = fr.getBoundingClientRect(); x += b.left; y += b.top; } }
      var h = IN.hit, onIt = x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h;
      if (onIt || (w === window && e.target.closest && e.target.closest('.hm-back'))) { introNext(); return; }
      IN.eat = Date.now(); stop(e); introNext(); }, true);
    ['mousedown', 'touchstart', 'click'].forEach(function (k) { w.addEventListener(k, function (e) { if (Date.now() - IN.eat < 650) stop(e); }, { capture: true, passive: false }); });
  }
  /* an island's experience (a stack) played in the sheet; wired to W.I.S.H., it starts from W.I.S.H.'s photograph and intention */
  function stackIn(body, id, opt) {
    body.hidden = true; var fr = D.createElement('iframe'); fr.title = id; fr.src = 'x.html?in=1#' + id.replace(/[^a-z0-9-]/g, ''); xv.appendChild(fr);
    if (opt && opt.fill || (wired('wish', 'zine') && carry('wish', 'zine').length)) fr.addEventListener('load', function () { var a = AU(), p = a && a.piece ? a.piece() : null; if (p && (p.photo || p.say)) fr.contentWindow.postMessage({ hm: 'fill', img: p.photo || '', words: (p.say || '').toUpperCase().slice(0, 22) }, location.origin); });
  }
  /* the island kit: the checklist, kept with the aura's, and printed as a slip */
  /* an open slot: how a printer gets a card of its own here, in three moves */
  function unlockIn(body) { body.classList.add('ul');
    var GH = 'https://github.com/novelglobal/islandarchipelagos';
    body.innerHTML = '<div class="ul-art" aria-hidden="true"><i></i><i></i><i></i></div><h2 class="ul-h" title="A card for your printer">JOIN</h2><ol class="ul-st">' +
      [['BUILD', 'From e-waste', 'kit', 'PARTS'], ['ON', 'It joins by itself', '', ''], ['MAKE', 'Test it, send it', 'space', 'BENCH']].map(function (s, k) {
        return '<li title="' + esc(s[1]) + '"><b>0' + (k + 1) + '</b><span><em>' + s[0] + '</em></span>' + (s[2] ? '<button type="button" data-go="' + s[2] + '" title="Open ' + s[3].toLowerCase() + '">' + s[3] + ' →</button>' : '<i class="ul-led"></i>') + '</li>'; }).join('') +
      '</ol><a class="ul-gh" href="' + GH + '" target="_blank" rel="noopener" title="The code, open to build on">CODE ↗</a>';
    $$('[data-go]', body).forEach(function (b) { b.addEventListener('click', function () { var id = b.dataset.go; shut(true); setTimeout(function () { open(id, id === 'space' ? { mode: 'card' } : null); }, 480); }); }); }
  /* ───────── every card's talk: four rooms of its own, open to everyone (open talk, help, show and tell, make together); a piece's own talk too ───────── */
  var ROOMS = [['open', 'OPEN', 'Open talk, anything about this', '<path d="M4 5.5h16v10.5h-8.5L7 20v-4H4z"/>'], ['help', 'HELP', 'Ask for help, or give it', '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.6a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.6"/><circle cx="12" cy="16.8" r=".6" class="f"/>'],
    ['show', 'SHOW', 'Show what you made with it', '<path d="M3.5 7.5h4l1.5-2h6l1.5 2h4v11h-17z"/><circle cx="12" cy="13" r="3.4"/>'], ['make', 'MAKE', 'Find people to make it with', '<circle cx="8.5" cy="9" r="2.6"/><circle cx="15.5" cy="9" r="2.6"/><path d="M3.5 19c.6-3 2.6-4.6 5-4.6s4.4 1.6 5 4.6M10.5 19c.6-3 2.6-4.6 5-4.6s4.4 1.6 5 4.6"/>']];
  var TKH = { card: null, sec: null, re: null, n: {} }, TKWHY = { 400: 'UNSENT', 429: 'WAIT', 503: 'RESTING' };
  var tkp = D.createElement('section'); tkp.id = 'hm-talk'; tkp.setAttribute('aria-label', 'Talk'); tkp.hidden = true;
  tkp.innerHTML = '<header><button type="button" class="tk-bk" aria-label="Back to the card"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M15 5l-7 7 7 7\"/></svg><span>BACK</span></button><b class="tk-t"></b><button class="x" aria-label="Close the talk" title="Close">' + '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></header>' +
    '<nav class="tk-rooms">' + ROOMS.map(function (r) { return '<button type="button" data-room="' + r[0] + '" title="' + r[2] + '"><svg viewBox="0 0 24 24">' + r[3] + '</svg><span>' + r[1] + '</span><i></i></button>'; }).join('') + '<button type="button" data-room="piece" title="This piece" hidden><svg viewBox="0 0 24 24"><path d="M6 3h12v18l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4z"/></svg><span>THIS</span><i></i></button></nav>' +
    '<ol class="tk-l" aria-live="polite"></ol><form class="tk-f"><input maxlength="280" autocomplete="off" placeholder="say something" aria-label="Say something"><button aria-label="Send" title="Send"><svg viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6"/></svg></button></form><p class="tk-say" aria-live="polite"></p>';
  root.appendChild(tkp);
  var tkk = D.createElement('button'); tkk.id = 'hm-tk'; tkk.setAttribute('aria-label', 'Talk about this'); tkk.title = 'Talk about this'; tkk.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 5.5h16v10.5h-8.5L7 20v-4H4z"/><path d="M8 9.5h8M8 12.5h5"/></svg><b>TALK</b><i></i>'; root.appendChild(tkk);
  function tkWho() { try { return window.NG && NG.me ? NG.me() : ''; } catch (e) { return ''; } }
  /* the talk is only for those who have a code already, one a printer gave: without one the rooms stay shut, a field for a code from a print */
  var TKOK = false;
  function tkOk() { try { if (!store.get('da.who', '')) return Promise.resolve(TKOK = false); return (window.NG && NG.proof ? NG.proof() : Promise.resolve(false)).then(function (ok) { return (TKOK = !!ok); }); } catch (e) { return Promise.resolve(false); } }
  var KEY_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="12" r="3.6"/><path d="M11.6 12H21M17.5 12v3M20 12v2.2"/></svg>';
  function tkLock(on) { tkp.classList.toggle('locked', on); var i = tkp.querySelector('input'); i.maxLength = on ? 3 : 280; i.placeholder = on ? 'code' : 'say something'; i.setAttribute('aria-label', on ? 'Your code from a print' : 'Say something'); i.autocapitalize = on ? 'characters' : 'sentences';
    if (on) tkp.querySelector('.tk-l').innerHTML = '<li class="none lock">' + KEY_SVG + '</li>'; }
  function tkGet(sec) { if (!TKOK) return Promise.resolve([]); var who = tkWho(); if (!who) return Promise.resolve([]); return fetch('/api/talk?s=' + encodeURIComponent(sec) + '&who=' + encodeURIComponent(who)).then(function (r) { return r.ok ? r.json() : { talk: [] }; }).then(function (j) { return j.talk || []; }).catch(function () { return store.get('da.talk.' + sec, []) || []; }); }
  /* how many have spoken in each of the card's rooms, on the key and on each room */
  function tkCount() { var id = TKH.card; if (!id) return; tkk.querySelector('i').textContent = ''; if (!TKOK) { tkk.classList.remove('live'); return; }
    Promise.all(ROOMS.map(function (r) { return tkGet('c.' + id + '.' + r[0]); })).then(function (ls) { if (TKH.card !== id) return; var all = 0;
      ROOMS.forEach(function (r, k) { TKH.n[r[0]] = ls[k].length; all += ls[k].length; var b = tkp.querySelector('[data-room="' + r[0] + '"] i'); if (b) b.textContent = ls[k].length || ''; });
      tkk.querySelector('i').textContent = all || ''; tkk.classList.toggle('live', all > 0); }); }
  function tkFill(l) { var ol = tkp.querySelector('.tk-l'), top = l.filter(function (t) { return !t.re; }), kids = function (id) { return l.filter(function (t) { return t.re === id; }).reverse(); };
    var li = function (t, sub) { var kk = t.k === 'ng' ? { n: 'novel.global', m: 0 } : (window.NG && NG.kin ? NG.kin(t.kin) : null) || { n: '', m: 0 };
      return '<li data-id="' + esc(t.id) + '"' + (sub ? ' class="sub"' : '') + ' style="--m:' + (kk.m || 0) + '"><i></i><b>' + esc(kk.n || 'someone') + '</b><small>' + (window.NG && NG.moonTag ? NG.moonTag(t.at, -37.8) : '') + '</small><span>' + esc(t.text) + '</span></li>'; };
    ol.innerHTML = top.length ? top.map(function (t) { return li(t) + kids(t.id).map(function (c) { return li(c, 1); }).join(''); }).join('') : '<li class="none"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h16v10.5h-8.5L7 20v-4H4z"/></svg><span>be the first</span></li>';
    $$('li[data-id]:not(.sub)', ol).forEach(function (e) { e.addEventListener('click', function () { TKH.re = TKH.re === e.dataset.id ? null : e.dataset.id; $$('li', ol).forEach(function (q) { q.classList.toggle('re', q.dataset.id === TKH.re); }); var i = tkp.querySelector('input'); i.placeholder = TKH.re ? 'reply' : 'say something'; i.focus(); }); }); }
  function tkShow(sec) { if (!sec) return; var piece = /^p\./.test(sec); TKH.sec = sec; TKH.re = null; var c = TKH.card && byId(TKH.card);
    tkp.querySelector('.tk-t').textContent = c ? c.title : 'TALK'; var pb = tkp.querySelector('[data-room="piece"]'); if (piece) { pb.hidden = false; pb.dataset.sec = sec; } else if (!pb.dataset.sec) pb.hidden = true;
    $$('[data-room]', tkp).forEach(function (b) { b.setAttribute('aria-pressed', String(piece ? b.dataset.room === 'piece' : sec === 'c.' + TKH.card + '.' + b.dataset.room)); });
    tkp.hidden = false; requestAnimationFrame(function () { tkp.classList.add('on'); }); tkk.classList.add('open'); tkp.querySelector('.tk-say').textContent = '';
    tkp.querySelector('.tk-l').innerHTML = '<li class="none"><span>· · ·</span></li>'; tkLock(!TKOK);
    tkOk().then(function (ok) { if (TKH.sec !== sec) return; tkLock(!ok); if (ok) tkGet(sec).then(function (l) { if (TKH.sec === sec) tkFill(l); }); }); }
  function tkHome() { var el = tkp.closest('.hm-card'); if (!el) return; el.classList.remove('talking'); tkp.classList.remove('in-card', 'on'); tkp.hidden = true; root.appendChild(tkp); TKH.card = null; }
  function cardTalk(id) { var el = col.querySelector('.hm-card[data-id="' + id + '"]'); if (!el) return; if (el.classList.contains('talking')) { turn(el, -1, tkHome); return; }
    tkHome(); var bc = el.querySelector('.hm-bcn'), rk = el.querySelector('[data-radar].on'); if (bc && !bc.hidden) { bc.hidden = true; BCN = null; if (rk) rk.classList.remove('on'); }
    turn(el, 1, function () { TKH.card = id; el.appendChild(tkp); tkp.classList.add('in-card'); el.classList.add('talking'); tkShow('c.' + id + '.open'); tkCount(); }); }
  function tkHide() { if (tkp.classList.contains('in-card')) { tkHome(); tkk.classList.remove('open'); return; } tkp.classList.remove('on'); tkk.classList.remove('open'); var pb = tkp.querySelector('[data-room="piece"]'); pb.hidden = true; pb.dataset.sec = ''; setTimeout(function () { if (!tkp.classList.contains('on')) tkp.hidden = true; }, 300); }
  tkOk();
  tkk.addEventListener('click', function (e) { e.stopPropagation(); if (tkp.classList.contains('on')) tkHide(); else if (TKH.card) tkShow('c.' + TKH.card + '.open'); beep(620, 0.04); });
  tkp.querySelector('.x').addEventListener('click', function () { tkHide(); });
  tkp.querySelector('.tk-bk').addEventListener('click', function (e) { e.stopPropagation(); var el = tkp.closest('.hm-card'); if (el) turn(el, -1, tkHome); else tkHide(); beep(330, 0.05); });
  $$('[data-room]', tkp).forEach(function (b) { b.addEventListener('click', function () { if (b.dataset.room === 'piece') tkShow(b.dataset.sec); else if (TKH.card) tkShow('c.' + TKH.card + '.' + b.dataset.room); beep(540 + ROOMS.length * 20, 0.03); }); });
  tkp.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); var i = tkp.querySelector('input'), t = i.value.trim(), sec = TKH.sec, re = TKH.re, say = tkp.querySelector('.tk-say'); if (!t || i.disabled || !sec) return;
    if (tkp.classList.contains('locked')) { if (!window.NG || !NG.useCode) return; i.disabled = true; say.textContent = '· · ·';
      NG.useCode(t).then(function (ok) { return ok ? tkOk() : false; }).then(function (ok) { i.disabled = false; i.value = ''; say.textContent = ok ? '✓' : '∅'; beep(ok ? 880 : 220, 0.05); if (ok) { tkShow(sec); tkCount(); } }).catch(function () { i.disabled = false; say.textContent = 'OFFLINE'; }); return; }
    var who = tkWho(); if (!who) return;
    i.disabled = true; say.textContent = '· · ·';
    (window.NG && NG.human ? NG.human() : Promise.resolve('')).then(function (cf) { return fetch('/api/talk', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ s: sec, who: who, text: t, re: re, cf: cf }) }); })
      .then(function (r) { i.disabled = false; if (r.status === 401) { TKOK = false; store.set('da.who.ok', 0); tkLock(true); return; } if (r.status !== 201) { say.textContent = TKWHY[r.status] || 'NOT SENT'; return; }
        return r.json().then(function (j) { var l = [{ id: j.id, sec: sec, text: t, re: re, at: j.at, kin: j.kin }].concat(store.get('da.talk.' + sec, []) || []); store.set('da.talk.' + sec, l.slice(0, 40)); careEarn('talk'); i.value = ''; say.textContent = '✓'; beep(880, 0.05); tkGet(sec).then(function (l2) { if (TKH.sec === sec) tkFill(l2); }); tkCount(); }); })
      .catch(function () { i.disabled = false; say.textContent = 'OFFLINE'; }); });
  /* a piece's own talk, asked for from inside an experience */
  addEventListener('message', function (e) { var d = e.data; if (e.origin !== location.origin || !d || d.ng !== 'talk' || !xv.classList.contains('on')) return;
    if (/^(c\.[a-z0-9-]{1,24}\.(open|help|show|make)|p\.(DA-[0-9A-Z]{4}|S-[0-9a-z]{6}))$/.test(d.sec || '')) tkShow(d.sec); });
  addEventListener('message', function (e) { var d = e.data; if (e.origin === location.origin && d && d.hm === 'open' && d.id === 'kit') { SH.swap = true; open('kit'); } });
  function kitIn(body) {
    var a = AU(), list = (a && a.isle ? a.isle() : []) || [], got = store.get('da.isle.v1', []) || [];
    var GH = 'https://github.com/novelglobal/islandarchipelagos/tree/main/kit';
    var spec = [['PAPER', '80 MM ROLL'], ['PRINTER', 'EPSON TM-T88V (USB) OR COMPATIBLE'], ['COMPUTER', 'RASPBERRY PI'], ['POWER', '24 V OR SOLAR'], ['WORKS', 'OFFLINE']];
    body.classList.add('kt');
    body.innerHTML = '<div class="kt-bar"><b>ISLAND</b><a href="' + GH + '" target="_blank" rel="noopener">INSTALL</a></div>' +
      '<div class="kt-row"><span>BENCH</span><button class="kt-pr" id="hm-kbench" title="Island Archipelagos: the bench, for the printer you build">ISLAND ARCHIPELAGOS</button></div>' +
      '<img class="kt-hero" alt="" decoding="async" src="/printer-top.jpg">' +
      spec.map(function (s) { return '<div class="kt-row"><span>' + s[0] + '</span><b>' + s[1] + '</b></div>'; }).join('') +
      '<div class="kt-row"><a href="/build-a-solar-printer.txt" download>PARTS LIST</a><b>TXT</b></div>' +
      '<div class="kt-row"><span>PARTS</span><button class="kt-pr" id="hm-kprint" aria-label="Print the parts">PRINT</button></div><ol class="hm-list">' + list.map(function (s) { if (!s) return '<li class="gap" aria-hidden="true"></li>';
      return '<li role="checkbox" tabindex="0" data-k="' + s[0] + '" aria-checked="' + (got.indexOf(s[0]) >= 0) + '"><i></i><span>' + (s[2] ? '<a href="' + s[2] + '" rel="noopener" target="_blank">' + esc(s[1]) + ' ↗</a>' : esc(s[1])) + '</span></li>'; }).join('') + '</ol><p class="hm-say" aria-live="polite"></p>';
    $$('[data-k]', body).forEach(function (li) { var flip = function () { var on = li.getAttribute('aria-checked') !== 'true'; li.setAttribute('aria-checked', String(on)); store.set('da.isle.v1', $$('[aria-checked="true"]', body).map(function (q) { return q.dataset.k; })); beep(on ? 880 : 440, 0.05); };
      li.addEventListener('click', function (e) { if (!e.target.closest('a')) flip(); }); li.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } }); });
    $('#hm-kbench', body).addEventListener('click', function () { SH.swap = true; open('space'); });
    $('#hm-kprint', body).addEventListener('click', function () { var say = $('.hm-say', body), ticks = store.get('da.isle.v1', []) || [];
      var cv = window.SLIPS && SLIPS.checklist ? SLIPS.checklist(ticks, 512) : listSlip(list, ticks); say.textContent = '· · ·'; printCanvas(cv, 'kit').then(function (s) { say.textContent = s === 'held' ? 'WAITING' : s ? 'PRINTING' : '×'; say.title = s === 'held' ? 'Waiting for the printer’s yes' : ''; }, function () { say.textContent = '× NO PRINTER ONLINE'; }); });
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
    body.innerHTML = '<div class="hm-row"><a class="hm-btn big" href="https://github.com/novelglobal/islandarchipelagos" target="_blank" rel="noopener" title="Source code">SOURCE ↗</a></div><p class="hm-h">MOTION</p><div class="hm-row">' + [['own', 'EACH'], ['shadow', 'SHADOW'], ['speed', 'SPEED']].map(function (m) { return '<button class="hm-btn' + (mo === m[0] ? ' on' : '') + '" data-mo="' + m[0] + '">' + m[1] + '</button>'; }).join('') + '</div>' +
      '<p class="hm-h">LIGHT</p><div class="hm-row"><button class="hm-btn' + (dark ? '' : ' on') + '" data-dk="0">DAY</button><button class="hm-btn' + (dark ? ' on' : '') + '" data-dk="1">NIGHT</button></div>' +
      '<p class="hm-h">SWITCHBOARD</p><div class="hm-row"><button class="hm-btn" id="hm-rewire">RESET</button><button class="hm-btn" id="hm-sbw" aria-expanded="false">WORDS</button><button class="hm-btn' + (CX.on ? ' on' : '') + '" id="hm-cxo" aria-pressed="' + CX.on + '" title="Cables on cards">CABLES</button></div><div class="hm-sbw" hidden></div>' +
      '<p class="hm-h" title="The stories card">STORIES</p><div class="hm-row">' + [['tap', 'TAP'], ['last', 'LAST'], ['own', 'MINE']].map(function (m) { var v = store.get('da.hm.stories', 'tap'); if (v === 'moa') v = 'tap'; return '<button class="hm-btn' + ((v === m[0] || (m[0] === 'own' && /^data:/.test(v))) ? ' on' : '') + '" data-st="' + m[0] + '">' + m[1] + '</button>'; }).join('') + '<input type="file" accept="image/*" id="hm-stf" hidden></div>' +
      '<div id="hm-keeper"></div><p class="hm-h">ISLANDS</p><ol class="hm-list hm-isles"><li>· · ·</li></ol>' +
      '<p class="hm-h">THIS DEVICE</p><div class="hm-row"><button class="hm-btn" id="hm-hints" title="Hints again">HINTS</button><button class="hm-btn hm-wipe" id="hm-wipe" title="Start again: everything made on this device goes">WIPE</button></div><p class="hm-note" id="hm-wipe-say" hidden title="Everything made on this device goes: prints, boards, W.I.S.H.es, songs, cables, settings. Tap WIPE once more">SURE?</p>';
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
    $('#hm-cxo', body).addEventListener('click', function () { var x = sb.querySelector('.ex'); if (x) x.click(); this.classList.toggle('on', CX.on); this.setAttribute('aria-pressed', String(CX.on)); });
    /* the first-visit notes and hints, seen again */
    $('#hm-hints', body).addEventListener('click', function () { ['da.hm.intro', 'da.sb.ghost', 'da.rb.guide', 'da.bench.tips', 'da.kinds.told', 'da.journey.v1'].forEach(function (k) { try { localStorage.removeItem(k); } catch (e) { /* none */ } }); beep(523, 0.05); this.textContent = 'ON'; });
    /* start again: asked once, then the whole site on this device */
    var wipeT = 0; $('#hm-wipe', body).addEventListener('click', function () { var say = $('#hm-wipe-say', body);
      if (!this.classList.contains('sure')) { this.classList.add('sure'); say.hidden = false; beep(220, 0.1); clearTimeout(wipeT); var b = this; wipeT = setTimeout(function () { b.classList.remove('sure'); say.hidden = true; }, 6000); return; }
      beep(160, 0.2); if (NG.wipe) NG.wipe(); });
    keeperIn($('#hm-keeper', body));
    partners(true).then(function (l) { var ol = $('.hm-isles', body); if (ol) ol.innerHTML = l.length ? l.map(function (p) { return '<li class="' + (p.ready ? 'on' : '') + '"><i></i><span>' + esc(p.name || p.id) + (p.number ? ' · ' + p.number : '') + '</span></li>'; }).join('') : '<li>—</li>'; });
  }

  /* a picture made small enough to send: at most 1600 on its long side, as a JPEG (which also drops where it was taken) */
  function shrinkPic(file) { return new Promise(function (ok, no) { var u = URL.createObjectURL(file), im = new Image(); im.onload = function () { var k = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight)), c = D.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); c.toBlob(function (b) { if (b) ok(b); else no(new Error('shrink')); }, 'image/jpeg', 0.84); }; im.onerror = no; im.src = u; }); }
  /* an island keeper's own controls: their key (from the welcome slip) opens their one island, nothing else */
  function keeperIn(box) {
    var key = store.get('da.hm.key', ''); if (!key || !box) return;
    var call = function (o) { return fetch('/api/island', Object.assign({ headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' } }, o || {})).then(function (r) { if (r.status === 401) { store.set('da.hm.key', ''); throw new Error('key'); } return r.json(); }); };
    var fill = function (p) { box.innerHTML = '<p class="hm-h">ISLAND' + (p.number ? ' · ' + p.number : '') + '</p><ol class="hm-list hm-isles"><li class="' + (p.ready ? 'on' : '') + '"><i></i><span>' + esc(p.name) + ' · ' + p.queued + ' WAITING · ' + p.printed + ' PRINTED</span></li></ol>' +
      '<p class="hm-h">CONNECTIONS</p><div class="hm-row">' + (p.all || []).map(function (k) { return '<button class="hm-btn' + ((p.links || []).indexOf(k) >= 0 ? ' on' : '') + '" data-ln="' + k + '" aria-pressed="' + ((p.links || []).indexOf(k) >= 0) + '">' + ({ wish: 'W.I.S.H.', radio: 'RADIO', art: 'ART', words: 'WORDS', cards: 'CARDS', codes: 'CODES' }[k] || k.toUpperCase()) + '</button>'; }).join('') + '</div>' +
      '<p class="hm-h" title="Up to ten pictures on its card">PICTURES</p><div class="hm-pgrid">' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (n) { var q = (p.pics || []).filter(function (x) { return x.slot === n; })[0]; return '<button class="hm-pslot' + (q ? ' on' : '') + '" data-ps="' + n + '" aria-label="' + (q ? 'Take this picture away' : 'Add a picture') + '">' + (q ? '<img alt="" src="' + esc(q.url) + '">' : '+') + '</button>'; }).join('') + '</div>' +
      '<div class="hm-row">' + [2, 3, 5, 8].map(function (n) { return '<button class="hm-btn' + ((p.speed || 2) === n ? ' on' : '') + '" data-sp="' + n + '">' + n + ' S</button>'; }).join('') + '</div>' +
      '<p class="hm-h">PASSES</p><div class="hm-row"><button class="hm-btn" data-pass title="Passes for today' + (p.mark ? ', ' + esc(p.mark.w.toLowerCase()) : '') + '">' + (p.mark ? esc(p.mark.e) + ' ' : '') + 'PRINT</button></div>' +
      '<div class="hm-row"><button class="hm-btn" data-rn>RENAME</button><button class="hm-btn" data-out title="Forget this island’s key on this phone">FORGET</button></div>';
      $$('[data-ln]', box).forEach(function (b) { b.addEventListener('click', function () { var l = (p.links || []).slice(), k = b.dataset.ln, i = l.indexOf(k); if (i >= 0) l.splice(i, 1); else l.push(k); call({ method: 'POST', body: JSON.stringify({ links: l }) }).then(fill); beep(i >= 0 ? 330 : 660, 0.05); }); });
      $$('[data-ps]', box).forEach(function (b) { b.addEventListener('click', function () { var n = +b.dataset.ps;
        if (b.classList.contains('on')) { if (confirm('Take this picture off your card?')) fetch('/api/island/pics/' + n, { method: 'DELETE', headers: { authorization: 'Bearer ' + key } }).then(function () { return call(); }).then(fill); return; }
        filePick(false, function (file) { b.textContent = '·'; shrinkPic(file).then(function (bl) { return fetch('/api/island/pics/' + n, { method: 'PUT', headers: { authorization: 'Bearer ' + key, 'content-type': 'image/jpeg' }, body: bl }); }).then(function () { return call(); }).then(fill, function () { b.textContent = '×'; }); }); }); });
      $$('[data-sp]', box).forEach(function (b) { b.addEventListener('click', function () { call({ method: 'POST', body: JSON.stringify({ speed: +b.dataset.sp }) }).then(fill); beep(550, 0.05); }); });
      $('[data-pass]', box).addEventListener('click', function () { sheet('PASS', function (b) { stackIn(b, 'pass'); }); });
      $('[data-rn]', box).addEventListener('click', function () { var n = prompt('Its name', p.name); if (n && n.trim()) call({ method: 'POST', body: JSON.stringify({ name: n.trim() }) }).then(fill); });
      $('[data-out]', box).addEventListener('click', function () { if (confirm('Forget this island’s key on this phone? The slip still has it.')) { store.set('da.hm.key', ''); box.innerHTML = ''; } }); };
    box.innerHTML = '<p class="hm-h">ISLAND</p><p class="hm-say">· · ·</p>'; call().then(fill, function () { box.innerHTML = '<p class="hm-h">ISLAND</p><p class="hm-say" title="The key did not open it">LOCKED</p>'; });
  }

  /* one file picker kept in the page (a phone drops the choice of one that never was); the camera first when asked */
  var FPK = null;
  function filePick(cam, cb) { if (!FPK) { FPK = D.createElement('input'); FPK.type = 'file'; FPK.accept = 'image/*'; FPK.setAttribute('aria-hidden', 'true'); FPK.tabIndex = -1; FPK.style.cssText = 'position:fixed;left:-300px;top:0;width:1px;height:1px;opacity:0'; D.body.appendChild(FPK);
      FPK.addEventListener('change', function () { var f = FPK.files && FPK.files[0], c = FPK._cb; FPK.value = ''; if (f && c) c(f); }); }
    if (cam) FPK.setAttribute('capture', 'environment'); else FPK.removeAttribute('capture'); FPK._cb = cb; FPK.click(); }
  /* ───────── printing from the home: a canvas to the printer that is listening ───────── */
  function printCanvas(cv, was) { if (!NG.printAgain) return Promise.reject(new Error('no base')); return NG.printAgain(cv.toDataURL('image/png'), was); }
  function quickPrint() { careEarn('print');
    filePick(true, function (file) { find('booth'); var u = URL.createObjectURL(file), im = new Image();
      im.onload = function () { var W = 512, c; if (window.SLIPS && SLIPS.quick) c = SLIPS.quick(im, W); else { c = D.createElement('canvas'); c.width = W; c.height = Math.round(W * im.naturalHeight / im.naturalWidth); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); }
        URL.revokeObjectURL(u); horn(0.6); printCanvas(c, 'quick').then(function () { if (NG.toast) NG.toast('PRINTING'); }, function () { if (NG.toast) NG.toast('NO PRINTER ONLINE'); }); };
      im.src = u; });
  }

  /* ───────── the printers: who is listening, for the radar keys ───────── */
  var PRN = [], PRN_AT = 0;
  function partners(force) { if (!force && Date.now() - PRN_AT < 60e3) return Promise.resolve(PRN); return fetch('/api/partners').then(function (r) { return r.ok ? r.json() : { partners: [] }; }).then(function (j) { PRN = j.partners || []; PRN_AT = Date.now(); radars(); return PRN; }).catch(function () { return PRN; }); }
  function turn(el, dir, mid) { if (RM.matches || !el.animate) { mid(); return; } var p = 'perspective(1400px) rotateY(';
    var a = el.animate([{ transform: p + '0deg)' }, { transform: p + (dir * -90) + 'deg)' }], { duration: 170, easing: 'cubic-bezier(.5,0,.9,.6)' });
    var done = false, half = function () { if (done) return; done = true; mid(); el.animate([{ transform: p + (dir * 90) + 'deg)' }, { transform: p + '0deg)' }], { duration: 210, easing: 'cubic-bezier(.1,.4,.4,1)' }); }; a.onfinish = half; setTimeout(half, 220); }
  function radars() { cards.forEach(function (el) { var c = byId(el.dataset.id), p = PRN.filter(function (q) { return q.id === c.island; })[0], k = el.querySelector('[data-radar]'); if (k) k.hidden = !!(c && c.ph); el.classList.toggle('live', !!(p && p.ready)); }); }
  partners(); setInterval(function () { if (!D.hidden && !away) partners(true); }, 60e3);

  /* ───────── the beacon: a card turned into a compass to its printer, from this phone's place ───────── */
  var HEAD = null, BCN = null;
  function beacon(id, key) {
    var el = col.querySelector('[data-id="' + id + '"]'), b = el.querySelector('.hm-bcn'), c = byId(id);
    if (!b.hidden) { turn(el, -1, function () { b.hidden = true; key.classList.remove('on'); BCN = null; }); return; }
    if (el.classList.contains('talking')) tkHide(); key.classList.add('on'); find('map'); turn(el, 1, function () { b.hidden = false; });
    b.innerHTML = '<div class="bc-top"><button type="button" class="bc-bk" data-bk aria-label="Back to the card"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><b>PRINTERS</b><i class="led" data-on title="Online now"></i></div>' +
      '<div class="bc-dial"><svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="88"/><circle cx="100" cy="100" r="64" stroke-dasharray="1 6"/><path d="M100 6v12M100 182v12M6 100h12M182 100h12"/><text x="100" y="36" text-anchor="middle">N</text><g class="ndl"><path d="M100 30L107 100L100 108L93 100Z"/></g><circle cx="100" cy="100" r="3"/></svg>' +
      '<p class="bc-to"><b data-name></b><span data-d title="Distance and bearing from here"></span></p></div><ol class="bc-list" data-list></ol>' +
      '<button type="button" class="bc-go" data-go title="Open this card, printing here">OPEN</button>';
    var mine = c.island || 'novelglobal', list = [{ id: mine, name: mine === 'novelglobal' ? 'novel.global' : mine, ready: false }];
    BCN = { el: b, c: c, brg: 0, list: list, k: 0, at: null };
    var whereOf = function (pid) { var cc = CARDS.filter(function (q) { return q.island === pid && q.where; })[0]; return cc ? cc.where : null; };
    var far = function (p) { var t = whereOf(p.id); if (!BCN.at || !t) return null; var la = BCN.at[0], ln = BCN.at[1], R = 6371e3, r1 = la * Math.PI / 180, r2 = t[0] * Math.PI / 180, dl = (t[1] - ln) * Math.PI / 180, df = (t[0] - la) * Math.PI / 180;
      var h = Math.sin(df / 2) * Math.sin(df / 2) + Math.cos(r1) * Math.cos(r2) * Math.sin(dl / 2) * Math.sin(dl / 2);
      return { d: 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)), brg: (Math.atan2(Math.sin(dl) * Math.cos(r2), Math.cos(r1) * Math.sin(r2) - Math.sin(r1) * Math.cos(r2) * Math.cos(dl)) * 180 / Math.PI + 360) % 360 }; };
    var km = function (d) { return d < 1000 ? Math.round(d) + ' M' : (d / 1000).toFixed(d < 10e3 ? 1 : 0) + ' KM'; };
    var nm = function (p) { return String(p.name || p.id || '').toUpperCase().slice(0, 22); };
    /* online first, then the card's own, then nearest */
    var order = function (l) { return l.slice().sort(function (x, y) { if (!!y.ready !== !!x.ready) return y.ready ? 1 : -1; if ((x.id === mine) !== (y.id === mine)) return x.id === mine ? -1 : 1; var fx = far(x), fy = far(y); return (fx ? fx.d : 1e12) - (fy ? fy.d : 1e12); }); };
    var draw = function () { if (!BCN) return; var p = BCN.list[BCN.k] || {}, f = far(p);
      b.querySelector('[data-name]').textContent = nm(p); b.querySelector('[data-on]').classList.toggle('on', !!p.ready); b.querySelector('[data-on]').title = p.ready ? 'Online now' : 'Not seen in the last two minutes';
      b.querySelector('[data-d]').textContent = f ? km(f.d) + ' · ' + ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(f.brg / 45) % 8] : BCN.at ? '' : '· · ·';
      BCN.brg = f ? f.brg : 0; b.querySelector('.bc-dial').classList.toggle('lost', !f);
      b.querySelector('[data-list]').innerHTML = BCN.list.map(function (q, i) { var g = far(q); return '<li><button type="button" data-k="' + i + '" aria-pressed="' + (i === BCN.k) + '"><i class="led' + (q.ready ? ' on' : '') + '"></i><span>' + esc(nm(q)) + '</span><em>' + (g ? km(g.d) : '') + '</em></button></li>'; }).join('');
      var go = b.querySelector('[data-go]'); go.disabled = !p.ready; go.title = p.ready ? 'Open this card, printing to ' + (p.name || p.id) : 'This printer is not online'; needle(); };
    b.onclick = function (e) { e.stopPropagation(); if (!BCN) return;
      if (e.target.closest('[data-bk]')) { beacon(id, key); return; }
      var r = e.target.closest('[data-k]'); if (r) { BCN.k = +r.dataset.k; draw(); return; }
      if (e.target.closest('[data-go]')) { var p = BCN.list[BCN.k]; if (!p || !p.ready) return; try { localStorage.setItem('da.to', p.id); } catch (er) { /* this visit */ } beacon(id, key); setTimeout(function () { open(id); }, 260); } };
    draw(); partners(true).then(function (l) { if (!BCN || !l || !l.length) return; var cur = (BCN.list[BCN.k] || {}).id; BCN.list = order(l.filter(function (q) { return q.paired || q.id === 'novelglobal'; })); if (!BCN.list.length) BCN.list = list;
      var on = BCN.list.findIndex(function (q) { return q.ready; }); BCN.k = on >= 0 ? on : Math.max(0, BCN.list.findIndex(function (q) { return q.id === cur; })); draw(); });
    var ask = window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission ? DeviceOrientationEvent.requestPermission().catch(function () { return 'denied'; }) : Promise.resolve('granted');
    ask.then(function (ok) { if (ok === 'granted') addEventListener('deviceorientation', orient, true); });
    if (!navigator.geolocation) { BCN.at = null; draw(); return; }
    navigator.geolocation.getCurrentPosition(function (pos) { if (!BCN) return; BCN.at = [pos.coords.latitude, pos.coords.longitude]; BCN.list = order(BCN.list); draw(); }, function () { if (BCN) { b.querySelector('[data-d]').textContent = ''; } }, { enableHighAccuracy: true, timeout: 12e3, maximumAge: 60e3 });
  }
  function orient(e) { HEAD = e.webkitCompassHeading != null ? e.webkitCompassHeading : e.alpha != null ? 360 - e.alpha : null; needle(); }
  function needle() { if (!BCN) return; var n = BCN.el.querySelector('.ndl'); if (n) n.style.transform = 'rotate(' + (BCN.brg - (HEAD || 0)) + 'deg)'; }

  /* ───────── sound: only what a touch causes ───────── */
  var AC = null, ACZ = 0; function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } } if (AC.state === 'suspended') AC.resume(); clearTimeout(ACZ); ACZ = setTimeout(function () { try { if (AC && AC.state === 'running') AC.suspend(); } catch (e) { /* gone */ } }, 4000); return AC; }
  var SFX = false;
  function beep(f, len) { if (!SFX) return; var c = ac(); if (!c) return; var o = c.createOscillator(), g = c.createGain(), t = c.currentTime; o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.08); o.connect(g).connect(c.destination); o.start(t); o.stop(t + len + 0.1); }
  /* the fog horn: two low reeds a little apart and a sub under them, through a closing filter */
  function horn(len) { if (!SFX) return; var c = ac(); if (!c) return; var t = c.currentTime, L = len || 2.2, out = c.createGain(), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(180, t); lp.frequency.linearRampToValueAtTime(520, t + 0.3); lp.frequency.linearRampToValueAtTime(240, t + L); lp.Q.value = 3;
    out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(0.22, t + 0.25); out.gain.setValueAtTime(0.22, t + L - 0.5); out.gain.exponentialRampToValueAtTime(0.0001, t + L + 0.6); lp.connect(out).connect(c.destination);
    [[73.4, 'sawtooth'], [73.9, 'sawtooth'], [36.7, 'sine']].forEach(function (v) { var o = c.createOscillator(); o.type = v[1]; o.frequency.value = v[0]; o.frequency.setValueAtTime(v[0] * 0.97, t); o.frequency.linearRampToValueAtTime(v[0], t + 0.4); o.connect(lp); o.start(t); o.stop(t + L + 0.7); }); }


  /* ───────── the sea: the banner is its surface; pressed, the sea opens down into the reef, one water with no line between ───────── */
  var top = $('#hm-top'), tcv = top.querySelector('canvas'), tx = tcv.getContext('2d'), dpr = 1, TOPH = 52, CH = 52, VW = 360;
  var NIGHT = store.get('da.hm.night', null); if (NIGHT == null) { var a0 = AU(); NIGHT = !!(a0 && a0.dark && a0.dark()); }
  function setNight(on, quiet) { NIGHT = !!on; store.set('da.hm.night', NIGHT); root.classList.toggle('night', NIGHT); D.documentElement.classList.toggle('hm-night', NIGHT); var tm = D.querySelector('meta[name="theme-color"]'); if (tm) tm.content = NIGHT ? '#06152A' : '#17457F'; warmDrop(); var a = AU(); if (a && a.dark && a.dark() !== NIGHT) a.dark(NIGHT); RB = null; if (!quiet) beep(NIGHT ? 392 : 523, 0.05); }
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
  /* the other one: hidden in the portfolio, and now and then up to the banner to find the first; they circle, follow, and part */
  var J2 = { x: 300, y: 900, vx: 0, vy: 0, a: -Math.PI / 2, ph: 0.5, p: 0, blink: 0, s: 0.85, tx: 0, ty: 0, until: 0, th: 0, on: false, al: 0 }, LOVE = { next: 0, until: 0 };
  var noise = function (a, b, c) { return Math.sin(a * 1.7 + b * 2.3 + c) * 0.5 + Math.sin(a * 0.9 - b * 1.3 + c * 1.9) * 0.3 + Math.sin(b * 3.1 + c * 0.7) * 0.2; };
  function swim(dt, t, open) {
    J.ph += dt / 5.4; var c = J.ph % 1; J.p = c < 0.28 ? Math.sin(c / 0.28 * Math.PI / 2) : Math.cos((c - 0.28) / 0.72 * Math.PI / 2);
    var S = J.s, lo = TOPH * 0.5, O = J.orbit, far = O || J.back;
    if (O) { J.th += dt * 0.09; J.tx = O.x + Math.cos(J.th) * O.rx; J.ty = O.y + Math.sin(J.th) * O.ry; }
    else if (J.back) { J.tx = VW * 0.5; J.ty = lo; if (J.y < lo + 10) J.back = false; }
    else if (open && J.goal && t - J.goal.t < 30 && Math.hypot(J.goal.x - J.x, J.goal.y - J.y) > 26) { J.tx = J.goal.x; J.ty = J.goal.y; }
    else if (open) { J.goal = null; if (t > J.until || Math.hypot(J.tx - J.x, J.ty - J.y) < 40) { J.tx = VW * (0.12 + Math.random() * 0.76); J.ty = TOPH + (CH - TOPH) * (0.12 + Math.random() * 0.6); J.until = t + 16 + Math.random() * 12; } }
    else { J.tx = J.x - 80; J.ty = lo + Math.sin(t * 0.07) * TOPH * 0.12; }
    var want = Math.atan2(J.ty - J.y, J.tx - J.x), d = Math.atan2(Math.sin(want - J.a), Math.cos(want - J.a)), near = Math.min(1, Math.hypot(J.tx - J.x, J.ty - J.y) / 70), turn = d * Math.min(1, dt * (far ? 0.9 : open ? (J.goal ? 0.22 : 0.4) : 0.3)) * (0.25 + 0.75 * near), cap = dt * (far ? 0.5 : 0.32); J.a += Math.max(-cap, Math.min(cap, turn));
    if (c < 0.28) { var th = (far ? 40 : open ? (J.goal ? 13 : 22) : 11) * S * dt; J.vx += Math.cos(J.a) * th; J.vy += Math.sin(J.a) * th; }
    J.vx *= Math.pow(0.5, dt); J.vy *= Math.pow(0.5, dt); J.vy += 0.5 * dt;
    J.x += J.vx * dt; J.y += J.vy * dt;
    if (far) { J.x = Math.max(-30, Math.min(VW + 30, J.x)); J.y = Math.max(8, Math.min((root.clientHeight || innerHeight) - 20, J.y)); }
    else if (!open) { J.y += (lo - J.y) * Math.min(1, dt * 0.6); if (J.x < -50) { J.x = VW + 50; J.y = lo; } if (J.x > VW + 60) J.x = -40; }
    else { J.x = Math.max(-30, Math.min(VW + 30, J.x)); J.y = Math.max(8, Math.min(CH - 40, J.y)); }
    var ws = (O && O.sky ? 0.85 : open && !far ? 1.45 : 1) * (VW > 900 ? 1.25 : 1); J.s += (ws - J.s) * Math.min(1, dt * 0.8);
  }
  /* the other one, drawn as the Irukandji was first drawn: the round bell in lines, its four strings in dots, lighter and smaller */
  var IRUK2 = null;
  /* the second one as the novel.global mark draws it: a box bell with its gut and ridges, two eyes, flecks, four beaded threads */
  var JM = null;
  function drawJelly3(g, t, Q) {
    if (!JM) JM = { bell: new Path2D('M18.6 31.4C16.6 10.4 47.4 10.4 45.4 31.4l1.9 5.6Q32 41 16.7 37z'), gut: new Path2D('M28.6 22.6q3.4-2.6 6.8 0l.6 9.6q-4 2.2-8 0z'), ridge: new Path2D('M23.4 21q-1.6 8 .2 16.6M40.6 21q1.6 8-.2 16.6'),
      eyes: [[22.8, 32.4], [41.2, 32.4]], fl: [[25.4, 19.6], [30, 16.8], [35.6, 17.6], [39.2, 22.6], [27.4, 27.4], [37, 28.4], [24.6, 25.6], [32, 34.6], [38.4, 34], [26.2, 34.2]],
      th: ['M17.6 37.4q-2.6 6.4-.2 10.2t-1.6 8.6q-1.4 3.6.4 6.6', 'M25 39.6q-1.2 7.6 1.4 12.2t-.6 10.8', 'M39 39.6q1.2 7.6-1.4 12.2t.6 10.8', 'M46.4 37.4q2.6 6.4.2 10.2t1.6 8.6q1.4 3.6-.4 6.6'].map(function (q) { return new Path2D(q); }) };
    var m = RM.matches ? 0 : 1, a = (Q.p || 0) * m, s = 0.52, ink = 'rgba(178,222,246,.95)';
    g.save(); g.translate(Q.x, Q.y); g.rotate(Q.a + Math.PI / 2 + Math.sin(t * 0.5 + 1) * 0.12 * m); g.scale(s, s); g.translate(-32, -30); g.lineCap = 'round'; g.lineJoin = 'round';
    g.save(); g.translate(32, 30); g.scale(1 + a * 0.06, 1 - a * 0.08); g.translate(-32, -30);
    g.fillStyle = 'rgba(178,222,246,.16)'; g.fill(JM.bell); g.strokeStyle = ink; g.lineWidth = 1.6; g.stroke(JM.bell);
    g.globalAlpha *= 0.6; g.lineWidth = 0.8; g.stroke(JM.gut); g.stroke(JM.ridge); g.globalAlpha /= 0.6;
    g.fillStyle = ink; JM.eyes.forEach(function (e) { g.beginPath(); g.arc(e[0], e[1], 1.5, 0, 7); g.fill(); });
    g.globalAlpha *= 0.55; JM.fl.forEach(function (e) { g.beginPath(); g.arc(e[0], e[1], 0.75, 0, 7); g.fill(); }); g.globalAlpha /= 0.55; g.restore();
    g.save(); g.translate(32, 38); g.scale(1, 1 + a * 0.05); g.translate(-32, -38); g.strokeStyle = ink;
    JM.th.forEach(function (q, i) { g.save(); g.translate(Math.sin(t * 1.2 + i * 1.7) * 0.9 * m, 0); g.lineWidth = 0.7; g.setLineDash([]); g.stroke(q); g.lineWidth = 2.1; g.setLineDash([0.01, 3.2]); g.stroke(q); g.restore(); });
    g.setLineDash([]); g.restore(); g.restore(); }
  function drawJelly2(g, t, Q) {
    if (!IRUK2) IRUK2 = ['M12.6 31C12.2 18.2 21.2 9.4 32.3 9.6c10.8.2 19.4 8.8 19 21.1', 'M12.4 31.2c7.6 3 31.4 3.1 39-.5', 'M15.4 21.6c8.4 2.4 25 2.5 33.2-.4', 'M32.1 9.9c-6.2 5.8-6.9 15.6-5.6 22.6', 'M32.6 9.8c6.1 6.2 6.6 16 5.3 22.8',
      'M18.8 33.2c-1.9 5.4 1.9 9.4-.6 15.2 1.4 2.8.5 5-.4 7', 'M27 34.3c.9 5.6-1.1 9.6.4 15.6-.7 2.4-.2 4.4.6 6.4', 'M37 34.4c-.9 5.5 1.2 9.6-.3 15.4.8 2.5.2 4.6-.6 6.5', 'M45.4 33c1.8 5.5-1.8 9.5.7 15.3-1.4 2.8-.4 5 .4 7'].map(function (q) { return new Path2D(q); });
    var m = RM.matches ? 0 : 1, s = 0.68 * (1 + 0.06 * Math.sin(t * 1.3 + Q.ph * 6) * m);
    g.save(); g.translate(Q.x, Q.y); g.rotate(Q.a + Math.PI / 2 + Math.sin(t * 0.7) * 0.18 * m); g.scale(s, s); g.translate(-32, -28);
    g.strokeStyle = 'rgba(244,241,232,.88)'; g.lineWidth = 2.4; g.lineCap = 'round'; g.lineJoin = 'round';
    IRUK2.forEach(function (q, i) { if (i < 5) { g.stroke(q); return; } g.save(); g.setLineDash([0.2, 3.6]); g.translate(Math.sin(t * 1.8 + i) * 1.4 * m, 0); g.stroke(q); g.restore(); });
    g.restore(); }
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
  top.addEventListener('pointerdown', function (e) { if (e.target.closest('nav') || e.target.closest('#hm-care')) return; held = false; if (bellHit(e.clientX, e.clientY)) hold = setTimeout(function () { held = true; hold = null; J.blink = 0.4; quickPrint(); }, 650);
    else if (root.classList.contains('reef')) { var p = pt(e);
      if (CARE.sel && careUse(p[0], p[1])) return;
      var pc = pieceAt(p[0], p[1]);
      if (pc) { HELD = { p: pc, x: p[0], y: p[1], sx: p[0], sy: p[1], t0: performance.now(), vx: 0, dx: pc.x - p[0], dy: (pc.fall ? pc.cy : pc.y) - p[1] }; pc.held = true; pc.fall = 0; try { top.setPointerCapture(e.pointerId); } catch (x) { /* none */ } return; }
      PT.x = p[0]; PT.y = p[1]; RIP.push({ x: p[0], y: p[1], r: 2, a: 0.8 }); beep(180 + Math.random() * 120, 0.08);
      J.goal = { x: p[0], y: p[1], t: performance.now() / 1000 }; snakeNudge(p[0], p[1]); if (BIO.live) bio(p[0], p[1], 18); } });
  top.addEventListener('pointerup', function () { if (hold) { clearTimeout(hold); hold = null; }
    if (!HELD) return; var pc = HELD.p, moved = Math.hypot(HELD.x - HELD.sx, HELD.y - HELD.sy), quick = performance.now() - HELD.t0 < 380; pc.held = false;
    if (moved < 8 && quick) { HELD = null; touchPiece(pc); return; }
    var nx = Math.max(12, Math.min(REEF.w - 12, HELD.x + HELD.dx)), ny = HELD.y + HELD.dy, hi = REEF.sea + REEF.s * 0.06; pc.x = nx; pc.cy = ny;
    if (pc === STAR) { pc.fy = Math.max(REEF.sea + 6, Math.min(hi + 10, ny)); pc.fall = 1; pc.vy = 0; }
    else { pc.y = restY(pc); pc.cy = Math.min(ny, pc.y); pc.fall = 1; pc.vy = 0; pc.vx = Math.max(-320, Math.min(320, HELD.vx * 0.5)); }
    beep(330, 0.05); HELD = null; keepReef(); });
  top.addEventListener('pointerleave', function () { if (hold) { clearTimeout(hold); hold = null; } PT.x = PT.y = -999; });
  top.addEventListener('click', function (e) { if (e.target.closest('nav')) return; if (held) { held = false; return; }
    if (bellHit(e.clientX, e.clientY)) { J.blink = 0.25; horn(); J.vx += Math.cos(J.a) * 6; J.vy += Math.sin(J.a) * 6; return; }
    if (away) { history.back(); return; } if (!root.classList.contains('reef')) reef(true); });
  $('#hm-theme').addEventListener('click', function (e) { e.stopPropagation(); setNight(!NIGHT); });
  /* the cards' frames, from the posters: none, dotted bitmap, lilac steps, cyan stripes, coral double rule, pink and green, blueprint */
  addEventListener('message', function (e) { var d = e.data; if (e.origin === location.origin && d && d.hm === 'wires' && Array.isArray(d.w)) { WIRES = d.w.filter(function (w) { return w && found(w[0]) && found(w[1]) && fits(w[0], w[1]); }).slice(-MAXW); saveWires(); if (jk) board(); else lamps(); } });
  /* the strategy's loop: a slow turn of its own, faster for a touch or a scroll; each chair takes on the stop it last passed */
  var ORB = { a: 0, v: 0.16, t: 0, top: 0 }, TAU = Math.PI * 2;
  function orbit(now) { requestAnimationFrame(orbit); var el = col.querySelector('.st-orb'), dt = Math.min(0.05, (now - (ORB.t || now)) / 1000); ORB.t = now;
    if (!el || D.hidden || away || xv.classList.contains('on')) return; if (!ORB.r || now - ORB.rt > 1000 || col.scrollTop !== ORB.top) { ORB.r = el.getBoundingClientRect(); ORB.rt = now; ORB.w = ORB.r.width; } var r = ORB.r; if (r.bottom < 0 || r.top > innerHeight) return;
    var y = col.scrollTop; ORB.v += Math.max(-1.5, Math.min(1.5, (y - ORB.top) * 0.004)); ORB.top = y; ORB.v += (0.16 - ORB.v) * Math.min(1, dt * 1.2); ORB.v = Math.max(-4, Math.min(4, ORB.v)); if (!RM.matches) ORB.a += ORB.v * dt;
    var hit = [0, 0, 0, 0]; if (!ORB.pre) { ORB.pre = 1; for (var pc = 1; pc <= 10; pc++) new Image().src = '/cards/chair-' + pc + '-t.jpg'; }
    $$('.st-th', el).forEach(function (t, k) { var a = ORB.a + k * TAU / 4 + TAU / 8, A = ((a % TAU) + TAU) % TAU, s = (A + Math.PI / 2) / (Math.PI / 2), q = Math.floor(s) % 4, near = Math.abs(s - Math.round(s));
      t.style.translate = (0.4 * ORB.w * Math.cos(a)).toFixed(1) + 'px ' + (0.4 * ORB.w * Math.sin(a)).toFixed(1) + 'px'; if (t.dataset.q !== String(q)) t.dataset.q = q; if (!k && el.dataset.st !== String(q)) { el.dataset.st = q; var wd = el.querySelector('.st-wd'); if (wd) { wd.textContent = ['theories', 'beliefs', 'principles', 'behaviours'][q]; wd.classList.remove('in'); void wd.offsetWidth; wd.classList.add('in'); }
        /* each letter reached stays lit; once all four are, they go out together and the round begins again */
        var dn = el._dn || (el._dn = {}); if (Object.keys(dn).length >= 4) { el._dn = dn = {}; el.classList.add('clr'); clearTimeout(el._ct); el._ct = setTimeout(function () { el.classList.remove('clr'); }, 1300); } dn[q] = 1;
        $$('.st-nd', el).forEach(function (nd, j) { nd.classList.toggle('on', !!dn[j]); }); } if (near < 0.09) hit[Math.round(s) % 4] = 1; if (near < 0.09 && !t.classList.contains('pop') && !RM.matches) nextChair(el, t); t.classList.toggle('pop', near < 0.09); });
    $$('.st-nd', el).forEach(function (n, k) { n.classList.toggle('hit', !!hit[k]); }); }
  requestAnimationFrame(orbit);
  /* a chair reaching a stop comes out of it as another of the ten, never one already on the loop */
  var ORBC = 6; function nextChair(el, th) { var im = th.querySelector('img'), on = $$('.st-th img', el).map(function (m) { return m.getAttribute('src'); });
    for (var i = 0; i < 10; i++) { ORBC = ORBC % 10 + 1; var u = '/cards/chair-' + ORBC + '-t.jpg'; if (on.indexOf(u) < 0) { im.src = u; return; } } }
  col.addEventListener('pointermove', function (e) { if (!e.target.closest || !e.target.closest('.sk-wish')) return; ORB.v = Math.max(-4, Math.min(4, ORB.v + (e.movementX || 0) * 0.012 - (e.movementY || 0) * 0.006)); }, { passive: true });
  $('#hm-snork').addEventListener('click', function (e) { e.stopPropagation(); reef(false); });
  /* your home: for anyone with a code (they have printed here). Kept on this phone only */
  function mineIn(body) { body.classList.add('mn');
    var who = store.get('da.who', ''), ok = !!store.get('da.who.ok', 0), ps = store.get('da.pass', null), today = cartDay(); if (ps && (ps.day !== today || !ps.code)) ps = null;
    var rows = function () { var h = MINE && MINE.hide; if (h) MINE.hide = null; var l = view().map(function (x) { return x[0]; }).filter(function (c) { return !c.ph; }); if (h) MINE.hide = h; return l; };
    var keep = function (l) { MINE = MINE || {}; if (l) MINE.order = l.map(function (c) { return c.id; }); store.set('da.hm.mine', MINE); applyCards(null); draw(); };
    var draw = function () { var l = rows(), P = perPage();
      body.innerHTML = '<dl class="mn-id"><div title="' + (who ? (ok ? 'Your code, printed at a printer' : 'Your code: it becomes yours for good once a print carries it') : 'A code comes with your first print') + '"><dt>CODE</dt><dd' + (who ? '' : ' class="no"') + '>' + (who ? esc(who) : '—') + (who && ok ? '<i>PRINTED</i>' : '') + '</dd></div>' +
        '<div title="' + (ps ? 'A print pass for today: your next print goes straight out' : 'A print pass comes from the printer, for the day') + '"><dt>PASS</dt><dd' + (ps ? '' : ' class="no"') + '>' + (ps ? esc(ps.code) + '<i>TODAY' + (ps.island ? ' · ' + esc(String(ps.island).toUpperCase()) : '') + '</i>' : '—') + '</dd></div></dl>' +
        (who ? '<p class="mn-per" role="group" aria-label="Small cards to a screen" title="Small cards to a screen"><span>SCREEN</span>' + [3, 6, 9].map(function (n) { return '<button type="button" data-per="' + n + '" aria-pressed="' + (P === n) + '">' + n + '</button>'; }).join('') + '</p>' +
        '<ol class="mn-l">' + l.map(function (c, i) { var off = MINE && MINE.hide && MINE.hide.indexOf(c.id) >= 0, sz = ownSize(c), t = c.id === 'intro' ? 'Opener' : SMALL_T[c.id] || (c.title.charAt(0) + c.title.slice(1).toLowerCase());
        var js = setOf(c), jp = js && i > 0 && setOf(l[i - 1]) === js, jn = js && i < l.length - 1 && setOf(l[i + 1]) === js, jc = jp || jn ? ' jn' + (jp ? '' : ' jn-a') + (jn ? '' : ' jn-z') : '';
        return '<li data-id="' + esc(c.id) + '"' + (off || jc ? ' class="' + (off ? 'off' : '') + jc + '"' : '') + (jc ? ' title="Joined: one size for the set"' : '') + '><button type="button" data-mv="-1" aria-label="Earlier" title="Earlier"' + (i ? '' : ' disabled') + '>↑</button><button type="button" data-mv="1" aria-label="Later" title="Later"' + (i < l.length - 1 ? '' : ' disabled') + '>↓</button><b>' + esc(t) + '</b>' +
          '<button type="button" class="mn-sz" data-sz title="Big fills the screen; small shares it">' + (sz === 'small' ? 'SMALL' : 'BIG') + '</button><button type="button" class="mn-on" data-on role="switch" aria-checked="' + !off + '" aria-label="Shown" title="Shown"><i></i></button></li>'; }).join('') +
        '</ol><p class="mn-ft"><button type="button" data-reset title="The home as the site sets it">RESET</button></p>' : ''); };
    body.onclick = function (e) { var b = e.target.closest('button'); if (!b) return; if (b.hasAttribute('data-reset')) { MINE = null; store.set('da.hm.mine', null); applyCards(null); draw(); return; }
      if (b.dataset.per) { MINE = MINE || {}; MINE.per = +b.dataset.per; return keep(null); }
      var li = b.closest('li'), id = li && li.dataset.id, l = rows(), i = l.findIndex(function (c) { return c.id === id; }); if (i < 0) return; MINE = MINE || {};
      if (b.dataset.mv) { var j = i + +b.dataset.mv; if (j < 0 || j >= l.length) return; l.splice(j, 0, l.splice(i, 1)[0]); }
      else if (b.hasAttribute('data-sz')) { MINE.size = MINE.size || {}; var nz = ownSize(l[i]) === 'small' ? 'full' : 'small'; kin(l[i]).forEach(function (x) { MINE.size[x.id] = nz; }); return keep(null); }
      else if (b.hasAttribute('data-on')) { if (id === 'intro') return; MINE.hide = MINE.hide || []; var k = MINE.hide.indexOf(id); if (k >= 0) MINE.hide.splice(k, 1); else if (l.length - MINE.hide.length > 1) MINE.hide.push(id); return keep(null); }
      keep(l); };
    draw(); }
  WIDE.addEventListener('change', function () { if (!(MINE && MINE.per)) applyCards(null); });
  $('#hm-mine').addEventListener('click', function (e) { e.stopPropagation(); beep(520, 0.05); sheet('HOME', mineIn); });


  /* ───────── the reef: the forms rounded and lit, in their own colours; the life on it in white line, alive to a touch ───────── */
  var RB = null, PT = { x: -999, y: -999, vx: 0, vy: 0 };
  var FISH = [], SNOW = [], WORMS = [], SNAKE = { x: -120, y: 0, t: 0, wig: 0 }, SLUG = { u: 0.15, gill: 1 }, RIP = [], STAR = null, BUB = [], FIRE = [], GLOW = [], BIO = { live: false, on: 0, next: 0 }, SHD = null, SHN = 0;
  /* the sea snake does not flee: a touch near it only sets it wiggling */
  function snakeNudge(x, y) { var d = Math.abs(y - (SNAKE.sy || SNAKE.y)), inside = x < SNAKE.x + 20 && x > SNAKE.x - 150; SNAKE.wig = Math.max(SNAKE.wig, inside && d < 60 ? 1 : d < 160 ? 0.45 : 0.15); }
  /* the giants: every half minute to a minute something huge passes far back in the water, never clear (a whale, a squid, a ray),
     drawn small and soft and laid in large; while it passes every fish clears out of the sea */
  function giantArt(kind, L) {
    var q = 0.16, W = Math.ceil(L * 1.3 * q), H = Math.ceil(L * 0.85 * q), c = D.createElement('canvas'); c.width = W; c.height = H; var g = c.getContext('2d');
    g.shadowColor = '#000'; g.shadowBlur = 9; g.shadowOffsetX = 4000; g.scale(q, q); g.translate(L * 0.72 - 4000 / q, L * 0.42); g.fillStyle = '#000'; g.strokeStyle = '#000';
    var E = function (x, y, rx, ry, a) { g.beginPath(); g.ellipse(x, y, rx, ry, a || 0, 0, 7); g.fill(); };
    if (kind === 0) { E(0, 0, L * 0.42, L * 0.085); E(L * 0.26, L * 0.012, L * 0.17, L * 0.1); g.beginPath(); g.moveTo(-L * 0.3, -L * 0.05); g.quadraticCurveTo(-L * 0.5, -L * 0.01, -L * 0.53, 0); g.quadraticCurveTo(-L * 0.5, L * 0.02, -L * 0.3, L * 0.05); g.fill();
      g.beginPath(); g.moveTo(-L * 0.5, 0); g.quadraticCurveTo(-L * 0.6, -L * 0.15, -L * 0.66, -L * 0.13); g.quadraticCurveTo(-L * 0.58, -L * 0.02, -L * 0.56, 0); g.quadraticCurveTo(-L * 0.58, L * 0.02, -L * 0.66, L * 0.13); g.quadraticCurveTo(-L * 0.6, L * 0.15, -L * 0.5, 0); g.fill(); E(L * 0.1, L * 0.1, L * 0.11, L * 0.025, 0.5); }
    else if (kind === 1) { E(L * 0.24, 0, L * 0.22, L * 0.07); g.beginPath(); g.moveTo(L * 0.44, 0); g.lineTo(L * 0.36, -L * 0.1); g.lineTo(L * 0.3, 0); g.lineTo(L * 0.36, L * 0.1); g.fill(); g.lineCap = 'round';
      for (var i = 0; i < 9; i++) { var o = (i - 4) * L * 0.012, len = i === 2 || i === 6 ? 0.66 : 0.42; g.lineWidth = L * (i === 2 || i === 6 ? 0.016 : 0.03); g.beginPath(); g.moveTo(L * 0.04, o); g.bezierCurveTo(-L * 0.12, o * 3 + L * 0.04, -L * 0.25, o * 5 - L * 0.05, -L * len, o * 7 + Math.sin(i) * L * 0.06); g.stroke(); } }
    else { g.beginPath(); g.moveTo(L * 0.22, 0); g.bezierCurveTo(L * 0.12, -L * 0.12, L * 0.02, -L * 0.36, -L * 0.04, -L * 0.4); g.bezierCurveTo(-L * 0.08, -L * 0.2, -L * 0.14, -L * 0.06, -L * 0.14, 0); g.bezierCurveTo(-L * 0.14, L * 0.06, -L * 0.08, L * 0.2, -L * 0.04, L * 0.4); g.bezierCurveTo(L * 0.02, L * 0.36, L * 0.12, L * 0.12, L * 0.22, 0); g.fill();
      g.lineWidth = L * 0.01; g.beginPath(); g.moveTo(-L * 0.12, 0); g.quadraticCurveTo(-L * 0.4, L * 0.03, -L * 0.62, -L * 0.02); g.stroke(); }
    return { c: c, q: q, ox: L * 0.72, oy: L * 0.42 };
  }
  function giants(g, dt, t, w, h, y0) {
    if (!SHN) SHN = t + 20 + Math.random() * 15;
    if (!SHD && t > SHN) { var L = w * (1.1 + Math.random() * 0.6), k = Math.floor(Math.random() * 3), dir = Math.random() < 0.5 ? 1 : -1, dur = 24 + Math.random() * 8;
      SHD = { k: k, L: L, art: giantArt(k, L), dir: dir, dur: dur, t0: t, y: y0 + (h - y0) * (0.2 + Math.random() * 0.28), p: 0 }; beep(46, 1.6); }
    if (!SHD) return; var S = SHD; S.p = (t - S.t0) / S.dur; if (S.p >= 1) { SHD = null; SHN = t + 30 + Math.random() * 30; return; }
    var x = S.dir > 0 ? -S.L * 0.7 + S.p * (w + S.L * 1.4) : w + S.L * 0.7 - S.p * (w + S.L * 1.4), a = Math.min(1, S.p * 5, (1 - S.p) * 5) * (NIGHT ? 0.62 : 0.42), A = S.art;
    g.save(); g.globalAlpha = a; g.translate(x, S.y + Math.sin(t * 0.25) * 10); g.scale(S.dir, 1); g.rotate(Math.sin(t * 0.18) * 0.04); g.imageSmoothingEnabled = true; g.drawImage(A.c, -A.ox, -A.oy, A.c.width / A.q, A.c.height / A.q); g.restore();
  }
  /* the water clouds slowly as the reef is let go, and clears as it is cared for */
  /* the murk tints the whole sea, the banner and the reef below it as one water, day or night */
  function murk() { var m = CARE.murk < 0.02 ? 0 : +(CARE.murk * 0.34).toFixed(3); if (m === murk.m) return; murk.m = m; top.style.setProperty('--murk', m); }
  /* by night: the fireworms' circles near the top, and now and then (every few minutes) the sea lit by whatever touches, moves or drops */
  function nightSea(t) { if (!NIGHT) { BIO.live = false; return; } if (!BIO.next) BIO.next = t + 15 + Math.random() * 30; if (t > BIO.next) { BIO.on = t + 40; BIO.next = t + 120 + Math.random() * 120; } BIO.live = t < BIO.on; }
  function bio(x, y, n) { if (GLOW.length > 280) return; for (var i = 0; i < n; i++) { var a = Math.random() * 7, v = 6 + Math.random() * (n > 2 ? 36 : 8); GLOW.push({ x: x + (Math.random() - 0.5) * 6, y: y + (Math.random() - 0.5) * 6, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 4, a: 1, r: 0.7 + Math.random() * 1.5 }); } }
  function glow(g, dt) { if (!GLOW.length) return; g.save(); g.globalCompositeOperation = 'lighter';
    GLOW = GLOW.filter(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(0.3, dt); p.vy *= Math.pow(0.3, dt); p.a -= dt * 0.55; if (p.a <= 0) return false;
      g.fillStyle = 'rgba(95,243,255,' + (p.a * 0.18).toFixed(3) + ')'; g.beginPath(); g.arc(p.x, p.y, p.r * 4, 0, 7); g.fill(); g.fillStyle = 'rgba(190,252,255,' + p.a.toFixed(3) + ')'; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill(); return true; });
    g.restore(); }
  function fireworms(g, dt, t) { if (!NIGHT || !FIRE.length) return; g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    FIRE.forEach(function (f) { f.a += f.w * dt; f.cx += Math.sin(t * 0.05 + f.r) * 3 * dt; var x = f.cx + Math.cos(f.a) * f.r, y = f.cy + Math.sin(f.a) * f.r * 0.55; f.k -= dt; if (f.k < 0) { f.k = 0.06; f.tr.push([x, y, 1]); if (f.tr.length > 60) f.tr.shift(); }
      f.tr.forEach(function (q) { q[2] -= dt * 0.4; if (q[2] <= 0) return; g.fillStyle = 'rgba(150,255,120,' + (q[2] * 0.35).toFixed(3) + ')'; g.beginPath(); g.arc(q[0], q[1], 1.6, 0, 7); g.fill(); });
      f.tr = f.tr.filter(function (q) { return q[2] > 0; });
      var b = f.tr.slice(-6); g.strokeStyle = 'rgba(200,255,150,.95)'; g.lineWidth = 1.6; g.beginPath(); b.forEach(function (q, i) { g[i ? 'lineTo' : 'moveTo'](q[0], q[1]); }); g.lineTo(x, y); g.stroke(); });
    g.restore(); }

  /* ───────── caring for the reef: slow needs on a real clock (litter settling, crown-of-thorns on the coral, algae over it, the water
     clouding), and the tools to meet them, one earned for each card opened in a day, a word said, a print. Kept on this phone ───────── */
  var TOOLS = [['net', 'A litter net', '<path d="M5 3l7 7M12 10c3-1 6 0 7 3s-1 7-5 7-6-3-5-6"/><path d="M10 13l6 5M13 11l3 7M9.5 16l7-2"/>'],
    ['pick', 'Crown-of-thorns tongs', '<path d="M6 21l7-9M10 21l5-9"/><path d="M13 12l3-7M15 12l4-6"/><circle cx="17" cy="5" r="1.5"/>'],
    ['urchin', 'An urchin to graze the algae', '<circle cx="12" cy="13" r="4"/><path d="M12 9V4M12 17v4M8 13H3M16 13h5M9 10L5.5 6.5M15 10l3.5-3.5M9 16l-3.5 3.5M15 16l3.5 3.5"/>'],
    ['vial', 'A water test', '<path d="M9 3h6M10 3v13a2 2 0 0 0 4 0V3"/><path d="M10 11h4"/>'],
    ['oyster', 'An oyster to filter the water', '<path d="M4 14c0-5 4-9 9-9 4 0 7 3 7 6 0 5-6 8-11 8-3 0-5-2-5-5z"/><path d="M8 13c2-3 5-4 8-3M9 16c2-1 4-1 6 0"/>']];
  var GIVE = { radio: 'vial', research: 'vial', wish: 'pick', zine: 'net', kit: 'net', portfolio: 'oyster', space: 'urchin', talk: 'urchin', print: 'oyster' };
  var CARE = (function () { var c = store.get('da.reef.care.v1', null) || {}; c.at = c.at || Date.now(); c.trash = c.trash || []; c.cots = c.cots || []; c.algae = c.algae || {}; c.murk = c.murk || 0;
    c.items = c.items || { net: 1 }; c.got = c.got || {}; c.oys = c.oys || []; c.acc = c.acc || { t: 0.6, c: 0.3 }; c.sel = null; return c; })();
  var NIB = [], VIAL = null;
  function careSave() { var o = {}; for (var k in CARE) if (k !== 'sel' && k !== 'tk') o[k] = CARE[k]; store.set('da.reef.care.v1', o); }
  function careTick() { var now = Date.now(), hrs = Math.min(96, Math.max(0, (now - CARE.at) / 36e5)); if (hrs < 0.001) return; CARE.at = now;
    CARE.acc.t += hrs / 0.8; while (CARE.acc.t >= 1) { CARE.acc.t -= 1; if (CARE.trash.length < 8) CARE.trash.push([+(0.06 + Math.random() * 0.88).toFixed(3), Math.floor(Math.random() * 10), 1]); }
    CARE.acc.c += hrs / 2; while (CARE.acc.c >= 1) { CARE.acc.c -= 1; if (CARE.cots.length < 4) CARE.cots.push([FDEF[Math.floor(Math.random() * FDEF.length)][0], +(Math.random() - 0.5).toFixed(2)]); }
    FDEF.forEach(function (d) { CARE.algae[d[0]] = Math.min(1, (CARE.algae[d[0]] || 0) + hrs * 0.06); });
    CARE.murk = Math.max(0, Math.min(0.85, CARE.murk + hrs * (0.02 + CARE.trash.length * 0.008) - hrs * CARE.oys.length * 0.05)); careSave(); }
  function careEarn(why) { var tool = GIVE[why]; if (!tool) return; var day = new Date().toDateString(), key = day + ':' + why; if (CARE.got[key]) return;
    var g2 = {}; for (var k in CARE.got) if (k.indexOf(day) === 0) g2[k] = 1; g2[key] = 1; CARE.got = g2; CARE.items[tool] = (CARE.items[tool] || 0) + 1; careSave(); trayDraw(tool); }
  /* what each tool does, said in a few pixel words under it while a pointer rests there */
  var CARE_SAY = { net: 'PICKS UP LITTER', pick: 'LIFTS CROWN-OF-THORNS', urchin: 'GRAZES THE ALGAE', vial: 'TESTS THE WATER', oyster: 'FILTERS THE WATER' };
  function trayDraw(got) { var el = $('#hm-care'); if (!el) return;
    el.innerHTML = TOOLS.filter(function (q) { return CARE.items[q[0]] > 0; }).map(function (q) { return '<button type="button" data-tool="' + q[0] + '" aria-label="' + q[1] + '" aria-pressed="' + (CARE.sel === q[0]) + '"' + (got === q[0] ? ' class="got"' : '') + '><svg viewBox="0 0 24 24">' + q[2] + '</svg><b>' + CARE.items[q[0]] + '</b><i class="ct" aria-hidden="true">' + (CARE_SAY[q[0]] || '') + '</i></button>'; }).join(''); }
  D.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('#hm-care [data-tool]'); if (!b) return; e.stopPropagation(); CARE.sel = CARE.sel === b.dataset.tool ? null : b.dataset.tool; trayDraw(); beep(CARE.sel ? 620 : 420, 0.04); }, true);
  /* where each need is, this frame */
  var TR = [];
  function trashAt(i) { var q = CARE.trash[i], x = q[0] * REEF.w, rest = REEF.sea + 5 + (q[1] * 3) % 7; return [x, rest]; }
  function cotsAt(q) { var f = FORMS.filter(function (o) { return o.d[0] === q[0]; })[0]; if (!f) return null; var R = radOf(f), X = f.dx0 != null ? f.dx0 : f.x, Y = f.dy0 != null ? f.dy0 : f.y; return [X + q[1] * R, Y - (f.d[1] === 'fan' ? R * 1.25 : R * 0.7)]; }
  function careUse(x, y) { var tool = CARE.sel, done = false, i;
    if (tool === 'net') { for (i = 0; i < CARE.trash.length; i++) { var tp = TR[i] || trashAt(i); if (Math.hypot(tp[0] - x, tp[1] - y) < 34) { CARE.trash.splice(i, 1); TR.splice(i, 1); done = true; break; } } }
    else if (tool === 'pick') { for (i = 0; i < CARE.cots.length; i++) { var cp = cotsAt(CARE.cots[i]); if (cp && Math.hypot(cp[0] - x, cp[1] - y) < 30) { CARE.cots.splice(i, 1); done = true; break; } } }
    else if (tool === 'urchin') { var f = pieceAt(x, y); if (f && f !== STAR && (CARE.algae[f.d[0]] || 0) > 0.08 && !NIB.some(function (n) { return n.f === f; })) { NIB.push({ f: f, t: 8 }); done = true; } }
    else if (tool === 'vial') { if (y < REEF.sea) { VIAL = { x: x, y: y, t: 4.5, m: CARE.murk }; done = true; } }
    else if (tool === 'oyster') { if (y > REEF.sea - 30 && CARE.oys.length < 6) { CARE.oys.push(+(x / REEF.w).toFixed(3)); done = true; } }
    if (!done) return false;
    CARE.items[tool]--; if (CARE.items[tool] <= 0) { delete CARE.items[tool]; CARE.sel = null; } careSave(); trayDraw(); RIP.push({ x: x, y: y, r: 3, a: 0.9 }); beep(740, 0.05); setTimeout(function () { beep(988, 0.06); }, 90); if (BIO.live) bio(x, y, 20); return true; }
  /* ten kinds of throwaway packaging, small and in colour: a soft-drink bottle, a can, a chip packet, a chocolate wrapper, a milk bottle, a water bottle, a coffee cup, a noodle cup, a bar wrapper, a bag */
  function litter(g, k, s) { g.save(); g.scale(s, s); g.lineWidth = 0.7; g.strokeStyle = 'rgba(11,11,11,.5)'; var f = function (c) { g.fillStyle = c; g.fill(); g.stroke(); }, box = function (x, y, w, h, r) { g.beginPath(); rrect(g, x, y, w, h, r); };
    if (k === 0 || k === 5) { box(-7, -2.6, 11, 5.2, 2); f(k ? 'rgba(200,230,245,.9)' : 'rgba(150,200,225,.9)'); g.fillStyle = k ? '#2FA4E0' : '#D62A2A'; g.fillRect(-3, -2.6, 4, 5.2); box(4, -1.4, 2.4, 2.8, 0.4); f('rgba(200,230,245,.9)'); box(6.2, -1.7, 1.8, 3.4, 0.4); f(k ? '#F4F4EF' : '#D62A2A'); }
    else if (k === 1) { box(-3, -5, 6, 10, 1.2); f('#C8202A'); g.fillStyle = '#C9CDD2'; g.fillRect(-3, -5, 6, 1.5); g.fillRect(-3, 3.6, 6, 1.4); g.fillStyle = '#F4F1E8'; g.fillRect(-3, -0.4, 6, 0.9); }
    else if (k === 2) { g.beginPath(); g.moveTo(-6, -5); for (var i = 0; i <= 6; i++) g.lineTo(-6 + i * 2, i % 2 ? -4.2 : -5); g.quadraticCurveTo(7.4, 0, 6, 5); for (var j = 6; j >= 0; j--) g.lineTo(-6 + j * 2, j % 2 ? 4.2 : 5); g.quadraticCurveTo(-7.4, 0, -6, -5); f('#F2C230'); g.fillStyle = '#2A62C9'; g.beginPath(); g.ellipse(0, 0.3, 3, 2, 0, 0, 7); g.fill(); }
    else if (k === 3) { box(-6, -2.2, 12, 4.4, 0.6); f('#5B2A86'); g.fillStyle = '#E8C25A'; g.fillRect(-2, -2.2, 1.2, 4.4); g.fillStyle = '#8E5BC0'; g.fillRect(-7.4, -1.8, 1.4, 3.6); g.fillRect(6, -1.8, 1.4, 3.6); }
    else if (k === 4) { box(-3.6, -3.8, 7.2, 9, 2); f('#F4F4EF'); box(-1.6, -6, 3.2, 2.2, 0.4); f('#2A62C9'); g.fillStyle = '#2A62C9'; g.fillRect(-3.6, 1, 7.2, 1.3); }
    else if (k === 6) { g.beginPath(); g.moveTo(-3.6, -4); g.lineTo(3.6, -4); g.lineTo(2.6, 5); g.lineTo(-2.6, 5); g.closePath(); f('#F1EDE4'); g.fillStyle = '#8A5A3B'; g.fillRect(-3.1, -0.6, 6.2, 2.6); box(-4.2, -5.4, 8.4, 1.6, 0.6); f('#222222'); }
    else if (k === 7) { g.beginPath(); g.moveTo(-4.4, -4); g.lineTo(4.4, -4); g.lineTo(3.2, 4.6); g.lineTo(-3.2, 4.6); g.closePath(); f('#E23B2E'); g.fillStyle = '#F6D046'; g.fillRect(-4, -2.6, 8, 2); g.fillStyle = '#F4F1E8'; g.fillRect(-4.6, -4.8, 9.2, 0.9); }
    else if (k === 8) { box(-5, -1.7, 10, 3.4, 0.4); f('#F07A1A'); g.fillStyle = '#F4F1E8'; g.fillRect(-2.6, -0.4, 5.2, 0.8); g.fillStyle = '#C45A0E'; g.fillRect(-6.2, -1.4, 1.2, 2.8); g.fillRect(5, -1.4, 1.2, 2.8); }
    else { g.beginPath(); g.moveTo(-4.6, -2); g.quadraticCurveTo(-5.6, 5.4, 0, 5.6); g.quadraticCurveTo(5.6, 5.4, 4.6, -2); g.lineTo(2.6, -2); g.quadraticCurveTo(2.4, -6, 1, -2); g.lineTo(-1, -2); g.quadraticCurveTo(-2.4, -6, -2.6, -2); g.closePath(); f('rgba(244,241,232,.6)'); }
    g.restore(); }
  function careDraw(g, dt, t, w, h, y0) {
    var ink = NIGHT ? 'rgba(200,225,255,.85)' : 'rgba(244,241,232,.92)';
    /* algae over the coral, as fine green strands; an urchin set on one grazes it away */
    FORMS.forEach(function (f) { var a = CARE.algae[f.d[0]] || 0; if (a < 0.05) return; var R = radOf(f), X = f.dx0, Y = f.dy0, top = f.d[1] === 'fan' ? R * 1.1 : R * 0.65, n = Math.round(4 + a * 14);
      g.strokeStyle = 'rgba(126,190,64,' + (0.55 + a * 0.45).toFixed(2) + ')'; g.lineWidth = 1.4; g.beginPath();
      for (var i = 0; i < n; i++) { var u = (i / (n - 1) - 0.5) * 1.3, bx = X + u * R, by = Y - top * (1 - u * u * 0.6), l = 6 + a * 9; g.moveTo(bx, by); g.quadraticCurveTo(bx + Math.sin(t * 1.3 + i) * 3, by - l * 0.6, bx + Math.sin(t + i * 2) * 2, by - l); } g.stroke(); });
    NIB = NIB.filter(function (n) { n.t -= dt; var id = n.f.d[0]; CARE.algae[id] = Math.max(0, (CARE.algae[id] || 0) - dt * 0.14); var R = radOf(n.f), X = n.f.dx0 + R * 0.25, Y = n.f.dy0 - R * 0.5;
      g.strokeStyle = ink; g.lineWidth = 1; g.beginPath(); g.arc(X, Y, 4, 0, 7); for (var k = 0; k < 12; k++) { var an = k / 12 * 6.283 + t * 0.4; g.moveTo(X + Math.cos(an) * 4, Y + Math.sin(an) * 4); g.lineTo(X + Math.cos(an) * 8, Y + Math.sin(an) * 8); } g.stroke();
      if (n.t <= 0) { careSave(); return false; } return true; });
    /* crown-of-thorns, dark and spiny, on the coral */
    CARE.cots.forEach(function (q) { var p = cotsAt(q); if (!p) return; g.save(); g.translate(p[0], p[1]); g.rotate(Math.sin(t * 0.1 + q[1] * 5) * 0.1);
      g.fillStyle = NIGHT ? 'rgba(120,70,140,.9)' : 'rgba(92,52,104,.92)'; g.beginPath(); for (var k = 0; k <= 26; k++) { var an = k / 26 * 6.283, rr = k % 2 ? 6.5 : 13; g[k ? 'lineTo' : 'moveTo'](Math.cos(an) * rr, Math.sin(an) * rr * 0.7); } g.closePath(); g.fill();
      g.fillStyle = 'rgba(244,241,232,.7)'; for (var m = 0; m < 13; m++) { var a2 = m / 13 * 6.283; g.beginPath(); g.arc(Math.cos(a2) * 10, Math.sin(a2) * 7, 0.8, 0, 7); g.fill(); } g.restore(); });
    /* litter: new pieces drift down from the surface and settle; the oysters set on the sand */
    g.strokeStyle = ink; g.lineWidth = 1.1;
    CARE.trash.forEach(function (q, i) { var p = trashAt(i), cur = TR[i]; if (!cur) cur = TR[i] = [p[0], q[2] ? y0 + 6 : p[1]]; if (q[2]) { cur[1] += dt * 12; cur[0] = p[0] + Math.sin(t * 0.6 + i) * 10 * (1 - (cur[1] - y0) / (p[1] - y0)); if (cur[1] >= p[1]) { cur[1] = p[1]; cur[0] = p[0]; q[2] = 0; careSave(); } }
      var x = cur[0], y = cur[1]; g.save(); g.translate(x, y); g.rotate(q[2] ? Math.sin(t + i) * 0.6 : ((q[1] % 4) - 1.5) * 0.3); litter(g, q[1] % 10, 1.1); g.restore(); });
    TR.length = CARE.trash.length;
    CARE.oys.forEach(function (u, i) { var x = u * w, y = REEF.sea + 7; g.beginPath(); g.ellipse(x, y, 7, 3.6, -0.15, 0, 7); g.moveTo(x - 5, y); g.quadraticCurveTo(x, y - 3, x + 5, y + 0.5); g.stroke(); if (Math.sin(t * 0.7 + i * 2) > 0.97) BUB.push({ x: x + 3, y: y - 4, vy: -18, a: 0.7, r: 0.8 }); });
    /* a water test: a small tube, clear blue to cloudy green with the water as it is */
    if (VIAL) { VIAL.t -= dt; var va = Math.min(1, VIAL.t), m = VIAL.m, cr = Math.round(127 - 5 * m * 10), cg = Math.round(216 - 70 * m), cb = Math.round(255 - 200 * m);
      g.save(); g.globalAlpha = va; g.translate(VIAL.x, VIAL.y - 26); g.fillStyle = 'rgb(' + cr + ',' + cg + ',' + cb + ')'; g.beginPath(); g.moveTo(-4, -4); g.lineTo(-4, 12); g.arc(0, 12, 4, Math.PI, 0, true); g.lineTo(4, -4); g.closePath(); g.fill();
      g.strokeStyle = INK; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-5, -14); g.lineTo(5, -14); g.moveTo(-4, -14); g.lineTo(-4, 12); g.arc(0, 12, 4, Math.PI, 0, true); g.lineTo(4, -14); g.stroke(); g.restore(); if (VIAL.t <= 0) VIAL = null; }
  }

  function reef(on) { root.classList.toggle('reef', on); if (on && SND.el && !SND.el.hidden) sndOpen(false); top.setAttribute('aria-expanded', String(on)); $('#hm-snork').hidden = !on; $('#hm-care').hidden = !on; if (on) { beep(220, 0.12); J.until = 0; careTick(); trayDraw(); } else { beep(330, 0.08); CARE.sel = null; J.goal = null; } }
  function reefBuild() {
    var w = VW, h = CH, y0 = TOPH, rh = h - y0; RB = D.createElement('canvas'); RB.width = tcv.width; RB.height = tcv.height; var g = RB.getContext('2d'), r = rnd(77), sea = y0 + rh * 0.86, s = Math.min(w, rh);
    g.scale(dpr, dpr);
    /* light from above: a few soft shafts */
    g.save(); g.globalCompositeOperation = 'lighter'; for (var k = 0; k < 5; k++) { var x0 = w * (0.1 + r() * 0.8); g.fillStyle = 'rgba(160,200,255,' + (NIGHT ? 0.025 : 0.05) + ')'; g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + 40, 0); g.lineTo(x0 + 160 + r() * 80, h); g.lineTo(x0 + 60, h); g.closePath(); g.fill(); } g.restore();
    /* the floor: sand in a few soft bands */
    g.fillStyle = NIGHT ? 'rgba(66,84,116,.96)' : 'rgba(214,200,170,.92)'; g.beginPath(); g.moveTo(0, sea); for (var x = 0; x <= w; x += 12) g.lineTo(x, sea + Math.sin(x * 0.02) * 4 + (r() - 0.5) * 3); g.lineTo(w, h); g.lineTo(0, h); g.closePath(); g.fill();
    grain(g, w, h, Math.round(w * rh / 30), NIGHT ? 'rgba(200,225,255,.16)' : 'rgba(80,60,30,.18)', 78);
    /* the forms: each its own piece, where it was last planted */
    REEF = { sea: sea, s: s, w: w }; var kept = store.get('da.reef.v1', {}) || {}, kf = kept.forms || {};
    FORMS = FDEF.map(function (d) { var p = kf[d[0]], f = { d: d, x: (p ? p[0] : d[2]) * w, y: 0, k: 1, vy: 0, vx: 0, fall: 0, rot: 0, sq: 0, wob: 0, spin: 0, glint: 0, ph: Math.random() * 6 }; f.y = restY(f); f.cy = f.y; f.sp = sprite(d, s, NIGHT); return f; });
    FIRE = []; for (var fw = 0; fw < 5; fw++) FIRE.push({ cx: w * (0.12 + r() * 0.76), cy: y0 + rh * (0.08 + r() * 0.3), r: 10 + r() * 14, a: r() * 6, w: (r() < 0.5 ? -1 : 1) * (1.6 + r()), tr: [], k: 0 });
    careTick();
    /* the white-line life sits on the forms */
    WORMS = []; for (var wi = 0; wi < 5; wi++) WORMS.push({ dx: (wi - 2) * s * 0.035, dy: -s * 0.08 + Math.abs(wi - 2) * s * 0.01, x: 0, y: 0, out: 1 });
    STAR = kept.star ? { x: kept.star[0] * w, y: sea + kept.star[1] * s } : { x: w * 0.3, y: sea + 18 }; STAR.cy = STAR.y; STAR.vy = 0; STAR.fall = 0;
    FISH = []; for (var fi = 0; fi < 9; fi++) FISH.push({ x: r() * w, y: y0 + rh * (0.15 + r() * 0.45), a: r() < 0.5 ? 0 : Math.PI, v: 14 + r() * 10, s: 0.7 + r() * 0.6, w: r() * 6 });
    SNOW = []; for (var si2 = 0; si2 < 90; si2++) SNOW.push({ x: r() * w, y: y0 + r() * rh, vx: 0, vy: 4 + r() * 6, r: 0.4 + r() * 1 });
    SNAKE.y = y0 + rh * 0.45; SLUG.sea = sea; SLUG.w = w;
  }
  /* the reef's pieces: where each starts, its size, its colour by day and by night */
  var FDEF = [['disc0', 'disc', 0.5, 0.011, 0.16, '#3A63C8', '#5C8BFF'], ['fan0', 'fan', 0.18, 0.016, 0.62, '#F7B58C', '#FF4FD8', 79], ['fan1', 'fan', 0.86, 0.021, 0.46, '#F4A07C', '#B45CFF', 80],
    ['disc1', 'disc', 0.78, 0.005, 0.08, '#E9C46A', '#FFE24F'], ['chrome', 'chrome', 0.36, -0.02, 0.12, '', '#7CF2FF'], ['honey', 'honey', 0.66, -0.04, 0.11, '', '#FFB13D', 81], ['glass', 'glass', 0.58, -0.16, 0.1, '#F2C230', '#3DFFC5', 82]];
  var FORMS = [], HELD = null, PUFF = [], QK = { x: 0, y: 0, t: 0 }, REEF = { sea: 0, s: 1, w: 1 };
  /* each piece drawn once to its own canvas; by night tinted in its own light and glowing */
  function sprite(d, s, night) {
    var R = d[4] * s, isFan = d[1] === 'fan', bw = isFan ? R * 1.7 : R * 2.6, bh = isFan ? R * 1.05 : R * 2.6, ax = bw / 2, ay = isFan ? bh - R * 0.06 : bh / 2, pad = 22;
    var c = D.createElement('canvas'); c.width = Math.ceil((bw + pad * 2) * dpr); c.height = Math.ceil((bh + pad * 2) * dpr); var g = c.getContext('2d'); g.scale(dpr, dpr); g.translate(pad, pad);
    var col = night && d[5] ? d[6] : d[5];
    if (d[1] === 'fan') fan(g, ax, ay, R, col, d[7]); else if (d[1] === 'disc') disc(g, ax, ay, R, col); else if (d[1] === 'chrome') chrome(g, ax, ay, R, 0.2); else if (d[1] === 'honey') honey(g, ax, ay, R, d[7]); else glass(g, ax, ay, R, col, d[7]);
    if (night) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = 0.42; g.fillStyle = d[6]; g.fillRect(0, 0, c.width, c.height);
      var o = D.createElement('canvas'); o.width = c.width; o.height = c.height; var og = o.getContext('2d'); og.shadowColor = d[6]; og.shadowBlur = 16 * dpr; og.drawImage(c, 0, 0); og.shadowBlur = 0; og.drawImage(c, 0, 0); c = o; }
    return { c: c, ax: ax + pad, ay: ay + pad };
  }
  /* a piece set down: sand thrown up, the water rings, the fish dart off, the worms pull in */
  function land(x, y, k, tone) { if (BIO.live) bio(x, y, Math.round(16 * (k || 1))); var n = Math.round(14 * (k || 1)); for (var i = 0; i < n; i++) { var a = -Math.PI * (0.1 + Math.random() * 0.8); PUFF.push({ x: x + (Math.random() - 0.5) * 20, y: y, vx: Math.cos(a) * (30 + Math.random() * 60), vy: Math.sin(a) * (40 + Math.random() * 70), a: 0.9, r: 0.8 + Math.random() * 1.8 }); }
    RIP.push({ x: x, y: y, r: 4, a: 0.7 }); QK.x = x; QK.y = y; QK.t = 2.2; FISH.forEach(function (f) { var d = Math.hypot(f.x - x, f.y - y); if (d < 180) { f.a = Math.atan2(f.y - y, f.x - x); f.v = 90; } }); beep((tone || 90) + Math.random() * 30, 0.12); }
  /* each piece its own weight in the water: the disc heavy and rolling, the fan a leaf that sways down, chrome a stone that thuds,
     honey a jelly that bounces, glass a slow glint. It comes to rest on the sand (or where its makers set it), never in mid-water,
     and eases aside from what it lands against */
  var TY = { disc: { g: 2600, term: 900, b: 0.22, land: 1, tone: 120 }, fan: { g: 420, term: 115, b: 0, sway: 1, land: 0.4, tone: 300 },
    chrome: { g: 3400, term: 1500, b: 0.1, land: 1.7, tone: 70 }, honey: { g: 1700, term: 800, b: 0.55, land: 0.8, tone: 170 }, glass: { g: 560, term: 170, b: 0.12, spin: 1, land: 0.5, tone: 880 } };
  var REST = { glass: -0.075 };
  function restY(f) { var o = REST[f.d[0]]; return REEF.sea + (o != null ? o : f.d[3]) * REEF.s; }
  function radOf(f) { return f.d[4] * REEF.s * (f.d[1] === 'fan' ? 0.62 : 0.95); }
  /* a touch without a drag: each answers in its own way */
  function touchPiece(f) { if (f === STAR) { STAR.spin = 5; beep(640, 0.05); return; } var k = f.d[1], R = radOf(f);
    if (k === 'disc') { f.spin = (Math.random() < 0.5 ? -1 : 1) * 7; beep(240, 0.06); }
    else if (k === 'fan') { f.wob = 1; for (var i = 0; i < 10; i++) BUB.push({ x: f.x + (Math.random() - 0.5) * R, y: f.y - R * (0.4 + Math.random() * 0.8), vy: -(16 + Math.random() * 20), a: 0.9, r: 0.7 + Math.random() }); beep(300, 0.07); }
    else if (k === 'chrome') { RIP.push({ x: f.x, y: f.y, r: R * 0.6, a: 0.8 }, { x: f.x, y: f.y, r: R * 0.2, a: 0.6 }); beep(70, 0.2); setTimeout(function () { beep(140, 0.1); }, 120); }
    else if (k === 'honey') { f.sq = 1; beep(170, 0.1); }
    else { f.glint = 0.9; beep(1320, 0.04); setTimeout(function () { beep(1760, 0.03); }, 90); }
    if (BIO.live) bio(f.x, f.y - R * 0.5, 14); }
  function drawForms(g, dt, t) {
    FORMS.forEach(function (f) { var T = TY[f.d[1]] || TY.disc; if (f.held) return;
      if (f.fall) { f.vy = Math.min(T.term, f.vy + T.g * dt); f.cy += f.vy * dt; f.x += f.vx * dt; f.vx *= Math.pow(0.4, dt);
        if (T.sway) { f.x += Math.sin(t * 2.4 + f.ph) * 38 * dt; f.rot = Math.sin(t * 2.4 + f.ph) * 0.22; }
        if (T.spin) f.rot += dt * 1.6;
        if (BIO.live && Math.random() < 0.3) bio(f.x, f.cy, 1);
        if (f.cy >= f.y) { f.cy = f.y;
          if (T.b && f.vy > 240) { f.vy *= -T.b; if (f.d[1] === 'honey') f.sq = 1; land(f.x, f.y, T.land * 0.4, T.tone); }
          else { f.fall = 0; f.vy = 0; f.k = f.d[1] === 'chrome' ? 0.8 : 0.88; if (f.d[1] === 'honey') f.sq = 1; if (f.d[1] === 'disc') f.vx += (Math.random() < 0.5 ? -1 : 1) * 70; land(f.x, f.y, T.land, T.tone); f.wake = 2.5; } } }
      else { if (f.d[1] === 'disc' && Math.abs(f.vx) > 1) { f.x += f.vx * dt; f.rot += f.vx * dt / Math.max(8, radOf(f)); f.vx *= Math.pow(0.15, dt); } else f.vx = 0;
        if (f.d[1] !== 'disc') f.rot *= Math.pow(0.02, dt); f.cy = f.y; }
      f.rot += f.spin * dt; f.spin *= Math.pow(0.25, dt); f.sq *= Math.pow(0.05, dt); f.wob *= Math.pow(0.12, dt);
      if (f.wake > 0) { f.wake -= dt; FORMS.forEach(function (o) { if (o === f || o.held || o.fall) return; var dx = f.x - o.x, need = (radOf(f) + radOf(o)) * 0.6;
          if (Math.abs(dx) < need && Math.abs(f.y - o.y) < need * 1.4) f.x += (need - Math.abs(dx)) * Math.min(1, dt * 5) * (dx < 0 ? -1 : 1) + (dx ? 0 : need * dt); });
        var rr = radOf(f) * 0.5; f.x = Math.max(rr, Math.min(REEF.w - rr, f.x)); if (f.wake <= 0) keepReef(); }
    });
    FORMS.slice().sort(function (a, b) { return a.y - b.y; }).forEach(function (f) { var X = f.x, Y = f.fall ? f.cy : f.y, sp = f.sp, k, R = radOf(f);
      if (f.held) { X = HELD.x + HELD.dx; Y = HELD.y + HELD.dy; }
      f.k += ((f.held ? 1.1 : 1) - f.k) * Math.min(1, dt * 7); k = f.k; f.dx0 = X; f.dy0 = Y;
      var q = f.sq * Math.cos(t * 18), sx = 1 + 0.22 * q, sy = 1 - 0.22 * q;
      g.save(); g.translate(X, Y); g.rotate((f.held ? Math.sin(t * 5) * 0.07 : 0) + f.rot + Math.sin(t * 7) * 0.12 * f.wob); g.scale(k * sx, k * sy); if (f.held) g.globalAlpha = 0.92;
      g.drawImage(sp.c, -sp.ax, -sp.ay, sp.c.width / dpr, sp.c.height / dpr); g.restore();
      if (f.glint > 0) { f.glint -= dt; var gx = X + R * 0.3, gy = Y - R * 0.5, gs = 10 * Math.sin(f.glint / 0.9 * Math.PI); g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(gx - gs, gy); g.lineTo(gx + gs, gy); g.moveTo(gx, gy - gs); g.lineTo(gx, gy + gs); g.stroke(); } });
    PUFF = PUFF.filter(function (p) { p.vy += 120 * dt; p.vx *= 0.96; p.x += p.vx * dt; p.y += p.vy * dt; p.a -= dt * 0.8; if (p.a <= 0) return false; g.globalAlpha = p.a; g.fillStyle = NIGHT ? '#AFC3E8' : '#D9C79E'; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill(); g.globalAlpha = 1; return true; });
    BUB = BUB.filter(function (b) { b.y += b.vy * dt; b.x += Math.sin(t * 3 + b.y * 0.1) * 6 * dt; b.a -= dt * 0.4; if (b.a <= 0) return false; g.globalAlpha = b.a; g.strokeStyle = INK; g.lineWidth = 0.7; g.beginPath(); g.arc(b.x, b.y, b.r, 0, 7); g.stroke(); g.globalAlpha = 1; return true; });
  }
  /* what is under a finger: a piece of the reef (by its own shape, not its box), or the starfish */
  function pieceAt(x, y) { if (STAR && Math.hypot(x - STAR.x, y - STAR.y) < 18) return STAR;
    var l = FORMS.slice().sort(function (a, b) { return b.y - a.y; }); for (var i = 0; i < l.length; i++) { var f = l[i], sp = f.sp, px = Math.round((x - f.x + sp.ax) * dpr), py = Math.round((y - f.y + sp.ay) * dpr);
      if (px < 0 || py < 0 || px >= sp.c.width || py >= sp.c.height) continue; try { if (sp.c.getContext('2d').getImageData(px, py, 1, 1).data[3] > 30) return f; } catch (e) { return f; } } return null; }
  function keepReef() { var o = { forms: {} }; FORMS.forEach(function (f) { o.forms[f.d[0]] = [+(f.x / REEF.w).toFixed(4), +((f.y - REEF.sea) / REEF.s).toFixed(4)]; }); if (STAR) o.star = [+(STAR.x / REEF.w).toFixed(4), +(((STAR.fy || STAR.y) - REEF.sea) / REEF.s).toFixed(4)]; store.set('da.reef.v1', o); }
  function drawReef(dt, t) {
    var g = tx, w = VW, h = CH, y0 = TOPH; g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(RB, 0, 0); g.restore();
    if ((CARE.tk = (CARE.tk || 0) - dt) < 0) { CARE.tk = 5; careTick(); }
    giants(g, dt, t, w, h, y0); nightSea(t);
    g.lineCap = 'round'; g.lineJoin = 'round'; PT.vx *= 0.9; PT.vy *= 0.9; var near = function (x, y, d) { return Math.hypot(x - PT.x, y - PT.y) < d || (QK.t > 0 && Math.hypot(x - QK.x, y - QK.y) < d * 1.6); }; QK.t -= dt;
    var gl = FORMS.filter(function (f) { return f.d[0] === 'glass'; })[0]; if (gl) WORMS.forEach(function (o) { var gx = gl.held ? HELD.x + HELD.dx : gl.x, gy = gl.held ? HELD.y + HELD.dy : gl.fall ? gl.cy : gl.y; o.x = gx + o.dx; o.y = gy + o.dy; });
    drawForms(g, dt, t);
    g.fillStyle = NIGHT ? 'rgba(150,255,205,.8)' : 'rgba(244,241,232,.55)'; SNOW.forEach(function (s) { if (NIGHT) g.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.3 + s.r * 9 + s.x * 0.05)); var dx = s.x - PT.x, dy = s.y - PT.y, d = Math.hypot(dx, dy); if (d < 90) { s.vx += PT.vx * 0.02 + dx / d * 0.6; s.vy += PT.vy * 0.02 + dy / d * 0.6; } s.vx *= 0.96; s.vy += (5 - s.vy) * 0.02; s.x += s.vx * dt; s.y += s.vy * dt; if (s.y > h) { s.y = y0 - 10; s.x = Math.random() * w; } if (s.x < 0) s.x += w; if (s.x > w) s.x -= w; g.beginPath(); g.arc(s.x, s.y, s.r * (NIGHT ? 1.3 : 1), 0, 7); g.fill(); }); g.globalAlpha = 1;
    g.strokeStyle = NIGHT ? '#FF8BEA' : 'rgba(244,241,232,.92)'; g.lineWidth = 1.1;
    WORMS.forEach(function (o) { var want = near(o.x, o.y, 70) ? 0 : 1; o.out += (want - o.out) * (want ? 0.02 : 0.25); if (o.out < 0.05) return; g.beginPath(); for (var i = 0; i < 6; i++) { var yy = o.y - i * 3.2 * o.out, ww = (6 - i) * 1.3 * o.out; g.moveTo(o.x - ww, yy); g.lineTo(o.x + ww, yy - 2 * o.out); } g.stroke(); });
    if (STAR) { STAR.spin = (STAR.spin || 0) * Math.pow(0.3, dt); if (STAR.held) { STAR.x = HELD.x + HELD.dx; STAR.y = HELD.y + HELD.dy; } else if (STAR.fall) { STAR.vy += 2200 * dt; STAR.cy += STAR.vy * dt; if (STAR.cy >= STAR.fy) { STAR.cy = STAR.fy; STAR.fall = 0; land(STAR.x, STAR.cy, 0.5); } STAR.y = STAR.cy; }
      g.strokeStyle = NIGHT ? '#FFE15A' : 'rgba(244,241,232,.92)'; if (NIGHT) { g.fillStyle = 'rgba(255,225,90,' + (0.25 + 0.2 * Math.sin(t * 2)).toFixed(2) + ')'; } g.beginPath(); for (var s2 = 0; s2 <= 10; s2++) { var an = s2 / 10 * Math.PI * 2 - Math.PI / 2 + Math.sin(t * 0.2) * 0.05 + (STAR.rot = (STAR.rot || 0) + (STAR.spin || 0) * dt / 11), rr = s2 % 2 ? 4 : 11; g[s2 ? 'lineTo' : 'moveTo'](STAR.x + Math.cos(an) * rr, STAR.y + Math.sin(an) * rr); } g.closePath(); if (NIGHT) g.fill(); g.stroke(); g.strokeStyle = NIGHT ? '#7DFFE6' : 'rgba(244,241,232,.92)'; }
    var scare = SHD && SHD.p > 0.06 && SHD.p < 0.94;
    FISH.forEach(function (f) {
      if (scare) { if (!f.flee) { f.flee = 1; f.a = f.x < w / 2 ? Math.PI + (Math.random() - 0.5) * 0.5 : (Math.random() - 0.5) * 0.5; } f.v = Math.min(140, f.v + 8); }
      else if (f.flee) { f.flee = 0; }
      if (f.off) { if (scare || Math.random() > 0.006) return; f.off = 0; f.x = f.ex < 0 ? -20 : w + 20; f.a = f.ex < 0 ? 0 : Math.PI; f.v = 22; }
      if (f.flee) { f.x += Math.cos(f.a) * f.v * dt; f.y += Math.sin(f.a) * f.v * dt * 0.5; if (f.x < -40 || f.x > w + 40) { f.off = 1; f.ex = f.x < 0 ? -1 : 1; return; } }
      else if (near(f.x, f.y, 100)) { var aw = Math.atan2(f.y - PT.y, f.x - PT.x); f.a += Math.atan2(Math.sin(aw - f.a), Math.cos(aw - f.a)) * 0.2; f.v = Math.min(80, f.v + 6); } else { f.v += (16 - f.v) * 0.02; f.a += Math.sin(t * 0.7 + f.w) * 0.004; }
      if (f.y < y0 + 20) f.a += 0.05; if (f.y > y0 + (h - y0) * 0.62) f.a -= 0.05; if (!f.flee) { f.x += Math.cos(f.a) * f.v * dt; f.y += Math.sin(f.a) * f.v * dt * 0.5; if (f.x < -20) f.x = w + 20; if (f.x > w + 20) f.x = -20; }
      if (BIO.live && Math.random() < 0.05) bio(f.x - Math.cos(f.a) * 12 * f.s, f.y, 1);
      g.save(); g.translate(f.x, f.y); g.rotate(f.a); g.scale(f.s, f.s); var wag = Math.sin(t * 9 + f.w) * 2.5; g.beginPath(); g.moveTo(9, 0); g.quadraticCurveTo(0, -5, -8, 0); g.quadraticCurveTo(0, 5, 9, 0); g.moveTo(-8, 0); g.lineTo(-14, -4 + wag); g.lineTo(-13, 4 + wag); g.lineTo(-8, 0); g.stroke(); g.beginPath(); g.arc(5, -1, NIGHT ? 1.4 : 0.9, 0, 7); g.fillStyle = NIGHT ? '#FFE15A' : INK; g.fill(); g.restore(); });
    SNAKE.t += dt * (1 + SNAKE.wig * 1.6); SNAKE.wig *= Math.pow(0.35, dt); SNAKE.x += dt * 16; if (SNAKE.x > w + 200) SNAKE.x = -200; var sy0 = SNAKE.y + Math.sin(SNAKE.t * 0.3) * 20, samp = 6 * (1 + SNAKE.wig * 2.2); SNAKE.sy = sy0;
    g.strokeStyle = NIGHT ? '#8FD3FF' : 'rgba(244,241,232,.92)'; g.lineWidth = 2.2; for (var b = 0; b < 22; b++) { var x0 = SNAKE.x - b * 6, yA = sy0 + Math.sin(SNAKE.t * 3 - b * 0.45) * samp, x1 = x0 - 6, y1 = sy0 + Math.sin(SNAKE.t * 3 - (b + 1) * 0.45) * samp; if (BIO.live && Math.random() < 0.01) bio(x0, yA, 1); g.globalAlpha = b % 2 ? 0.95 : 0.35; g.beginPath(); g.moveTo(x0, yA); g.lineTo(x1, y1); g.stroke(); } g.globalAlpha = 1; g.lineWidth = 1.1;
    if (SLUG.sea) { SLUG.u += dt * 0.004; if (SLUG.u > 0.95) SLUG.u = 0.05; var ux = SLUG.u * SLUG.w, uy = SLUG.sea + 8; SLUG.gill += ((near(ux, uy, 60) ? 0 : 1) - SLUG.gill) * 0.1;
      g.beginPath(); g.ellipse(ux, uy, 10, 3.2, 0, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(ux + 8, uy - 2); g.lineTo(ux + 11, uy - 7); g.moveTo(ux + 6, uy - 2); g.lineTo(ux + 7, uy - 7); for (var gi = 0; gi < 4; gi++) { g.moveTo(ux - 6, uy - 2); g.lineTo(ux - 6 + Math.cos(-2 - gi * 0.35) * 6 * SLUG.gill, uy - 2 + Math.sin(-2 - gi * 0.35) * 6 * SLUG.gill); } g.stroke(); }
    RIP = RIP.filter(function (q) { q.r += dt * 120; q.a -= dt * 1.4; if (q.a <= 0) return false; g.globalAlpha = q.a; g.beginPath(); g.arc(q.x, q.y, q.r, 0, 7); g.stroke(); g.globalAlpha = 1; return true; });
    careDraw(g, dt, t, w, h, y0); fireworms(g, dt, t); glow(g, dt);
  }
  var pt = function (e) { var r = tcv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  top.addEventListener('pointermove', function (e) { if (!root.classList.contains('reef')) return; var p = pt(e); PT.vx = (p[0] - PT.x) * 2; PT.vy = (p[1] - PT.y) * 2; PT.x = p[0]; PT.y = p[1]; if (HELD) { HELD.vx = HELD.vx * 0.5 + (p[0] - HELD.x) * 30; HELD.x = p[0]; HELD.y = p[1]; } });

  /* ───────── the switchboard: one jack to each thing, each by its own mark; the starting ones lit, the rest dark holes until found ───────── */
  var G = function (s) { return s; };
  var SLOTS = [
    /* the starting eight */
    ['portfolio', 'PORTFOLIO', 1, G('<path d="M6 2.5h12v19l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4z"/><path d="M8.5 7h7M8.5 10h7M8.5 13h4"/>')],
    ['wish', 'I W.I.S.H.', 1, G('<path d="M2 12h20"/><circle cx="5.5" cy="12" r="1.9" class="f"/><circle cx="10" cy="12" r="1.9" class="f"/><circle cx="14.5" cy="12" r="1.9" class="f"/><circle cx="19" cy="12" r="1.9" class="f"/>')],
    ['radio', 'DIRECT ACTION RADIO', 1, G('<path d="M12 21a9 9 0 1 1 9-9"/><path d="M12 12l6.4-6.4"/><circle cx="12" cy="12" r="1.6" class="f"/><circle cx="7" cy="15" r=".9" class="f"/>')],
    ['zine', 'DESIGN PRINT', 1, G('<path d="M9 2h6v20H9z"/><path d="M9 15l2-4 1.3 2 1.2-3.5L15 13"/>')],
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
    research: { outs: ['LIST', 'PICTURE'], ins: { WORDS: 'PINNED AS A BLOCK', CODE: 'THE W.I.S.H. POEM BEHIND IT', PICTURE: 'PINNED AS A PICTURE' } },
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
  var START = [['radio', 'wish'], ['wish', 'research'], ['wish', 'zine'], ['kit', 'space']], MAXW = 4;
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
  /* the cables let out onto the cards: a switch on the board, then each cable down its own path, plugged into the cards it joins, hanging and swinging as they move */
  var CX = { on: !!store.get('da.sb.out', false), cv: null, g: null, rope: {}, k: 1 };
  (function () { var cv = D.createElement('canvas'); cv.id = 'hm-cx'; cv.setAttribute('aria-hidden', 'true'); root.insertBefore(cv, $('#hm-jf')); CX.cv = cv; CX.g = cv.getContext('2d');
    var b = D.createElement('button'); b.className = 'ex'; b.title = 'Cables out on the cards'; b.setAttribute('aria-label', 'Cables out on the cards'); b.setAttribute('aria-pressed', String(CX.on)); b.innerHTML = '<span>CABLES</span><i></i>'; sb.insertBefore(b, sb.querySelector('.rs'));
    b.addEventListener('click', function (e) { e.stopPropagation(); CX.on = !CX.on; store.set('da.sb.out', CX.on); b.setAttribute('aria-pressed', String(CX.on)); root.classList.toggle('cx', CX.on); CX.rope = {}; beep(CX.on ? 523 : 262, 0.05); if (!CX.on) CX.g.clearRect(0, 0, CX.cv.width, CX.cv.height); });
    root.classList.toggle('cx', CX.on); })();
  function chaikin(P, n) { for (var it = 0; it < n; it++) { var o = [P[0]]; for (var i = 0; i < P.length - 1; i++) { var a = P[i], b = P[i + 1]; o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } o.push(P[P.length - 1]); P = o; } return P; }
  function resample(P, N) { var L = [0]; for (var i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); var tot = L[L.length - 1] || 1, out = [], j = 0;
    for (var k = 0; k < N; k++) { var d = tot * k / (N - 1); while (j < L.length - 2 && L[j + 1] < d) j++; var f = (d - L[j]) / ((L[j + 1] - L[j]) || 1); out.push([P[j][0] + (P[j + 1][0] - P[j][0]) * f, P[j][1] + (P[j + 1][1] - P[j][1]) * f]); } return out; }
  /* where a cable meets a thing: the card's edge (a small card from its top), the reef from under the sea, anything else down in the board */
  function cxEnd(id, lane, lx, ref) { var el = col.querySelector('.hm-card[data-id="' + id + '"]'), left = lane % 2 === 0;
    if (el) { var r = el.getBoundingClientRect(); if (!r.width) return null; var small = r.width < ref.width * 0.8, fy = [0.34, 0.47, 0.6, 0.73][lane % 4] + (lane >= 4 ? 0.05 : 0);
      if (small) { var px = r.left + r.width * (0.3 + 0.13 * (lane % 4)), gy = r.top - 7; return { p: [px, r.top + 9], path: [[px, gy], [lx, gy]], y: gy }; }
      var ex = left ? r.left + 9 : r.right - 9, ey = r.top + r.height * fy; return { p: [ex, ey], path: [[lx, ey]], y: ey }; }
    if (id === 'reef') { var t = $('#hm-top').getBoundingClientRect(); return { p: [lx, t.bottom - 6], path: [], y: t.bottom - 6, hid: 1 }; }
    var s = sb.getBoundingClientRect(); return { p: [lx, s.top + 24], path: [], y: s.top + 24, hid: 1 }; }
  function cxPlug(g, p, q, c) { var a = Math.atan2(p[1] - q[1], p[0] - q[0]); g.save(); g.translate(p[0], p[1]); g.rotate(a);
    g.fillStyle = '#C9C6BE'; g.fillRect(-1, -1.2, 6, 2.4); g.fillStyle = '#B08A3E'; g.fillRect(-4, -3.2, 3, 6.4);
    g.fillStyle = '#16171A'; rrect(g, -15, -3.6, 11.5, 7.2, 2); g.fill(); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(-14, -2.8, 9.5, 1.2); g.fillStyle = c; g.fillRect(-11, -3.6, 1.6, 7.2); g.restore(); }
  function cxDraw(t, dt) {
    var cv = CX.cv, g = CX.g, rr = root.getBoundingClientRect(), k = Math.min(2, devicePixelRatio || 1), W = rr.width, H = rr.height;
    if (cv.width !== Math.round(W * k) || cv.height !== Math.round(H * k)) { cv.width = Math.round(W * k); cv.height = Math.round(H * k); }
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); if (xv.classList.contains('on')) return; g.setTransform(k, 0, 0, k, -rr.left * k, -rr.top * k);
    var refEl = col.querySelector('.hm-card.full'); if (!refEl) return; var ref = refEl.getBoundingClientRect(), seen = {};
    WIRES.forEach(function (w, i) {
      var lane = i, left = lane % 2 === 0, kk = Math.floor(lane / 2) % 2, xo = lane >= 4 ? 3 : 0;
      var lx = left ? Math.max(4 + kk * 7 + xo, ref.left - 10 - kk * 13 - xo * 2) : Math.min(W - 4 - kk * 7 - xo, ref.right + 10 + kk * 13 + xo * 2);
      var A = cxEnd(w[0], lane, lx, ref), B = cxEnd(w[1], lane, lx, ref); if (!A || !B) return;
      if ((A.y < -60 && B.y < -60) || (A.y > H + 60 && B.y > H + 60)) return;
      /* the route: out of the plug, to its path, along it, back in; the short runs across sag a little */
      var C = [A.p].concat(A.path, B.path.slice().reverse(), [B.p]), R = [C[0]];
      for (var c = 1; c < C.length; c++) { var a = C[c - 1], b = C[c], hz = Math.abs(b[0] - a[0]) > 24 && Math.abs(b[1] - a[1]) < 8; if (hz) R.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + Math.abs(b[0] - a[0]) * 0.09]); R.push(b); }
      var T = resample(chaikin(R, 3), 54), key = w.join('-') + i, rope = CX.rope[key];
      if (!rope || rope.p.length !== T.length) rope = CX.rope[key] = { p: T.map(function (q) { return q.slice(); }), v: T.map(function () { return [0, 0]; }) }; seen[key] = 1;
      var P = rope.p, V = rope.v, n = T.length, sd = i * 1.7 + 0.4;
      for (var j = 0; j < n; j++) { var e = Math.sin(j / (n - 1) * Math.PI), tx = T[j][0] + (RM.matches ? 0 : Math.sin(t * 1.1 + j * 0.31 + sd) * 1.4 * e), ty = T[j][1] + (RM.matches ? 0 : Math.cos(t * 0.8 + j * 0.23 + sd) * 1.1 * e);
        if (j === 0 || j === n - 1 || RM.matches || !dt) { P[j][0] = tx; P[j][1] = ty; V[j][0] = V[j][1] = 0; continue; }
        var K = 34 + 50 * (1 - e); V[j][0] += ((tx - P[j][0]) * K - V[j][0] * 7) * dt; V[j][1] += ((ty - P[j][1]) * K - V[j][1] * 7 + 40 * e) * dt; P[j][0] += V[j][0] * dt; P[j][1] += V[j][1] * dt; }
      var ca = SC[w[0]] || INK, cb = SC[w[1]] || INK, gr = g.createLinearGradient(P[0][0], P[0][1], P[n - 1][0] + 0.01, P[n - 1][1] + 0.01); [0, 0.25, 0.5, 0.75, 1].forEach(function (q) { gr.addColorStop(q, q === 0 ? ca : q === 1 ? cb : mix(ca, cb, q)); });
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.save(); g.shadowColor = 'rgba(0,0,0,.38)'; g.shadowBlur = 5; g.shadowOffsetX = 2; g.shadowOffsetY = 4; g.strokeStyle = gr; g.lineWidth = 3.4; trace(g, P); g.stroke(); g.restore();
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 0.8; trace(g, P.map(function (q) { return [q[0] - 0.8, q[1] - 0.9]; })); g.stroke();
      g.fillStyle = gr; for (var s = 2; s < 9; s++) [s, n - 1 - s].forEach(function (ix, side) { g.globalAlpha = 0.5 + 0.35 * Math.sin(t * 1.4 - s * 0.5 + side + sd); g.beginPath(); g.arc(P[ix][0], P[ix][1], s % 3 === 0 ? 2.1 : 1.4, 0, 7); g.fill(); }); g.globalAlpha = 1;
      /* what it carries, a bead of the mixed colour running along it */
      if (!RM.matches) { var mc = mix(ca, cb), ph = ((t * 0.16 + i * 0.27) % 1), ix2 = Math.floor(ph * (n - 1)), q2 = P[ix2]; g.fillStyle = mc; g.shadowColor = mc; g.shadowBlur = 10; g.beginPath(); g.arc(q2[0], q2[1], 2.6, 0, 7); g.fill(); g.shadowBlur = 0; }
      if (!A.hid) cxPlug(g, P[0], P[3], ca); if (!B.hid) cxPlug(g, P[n - 1], P[n - 4], cb);
    });
    Object.keys(CX.rope).forEach(function (q) { if (!seen[q]) delete CX.rope[q]; });
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
    var cb = sb.querySelector('.cb'); if (cb) cb.innerHTML = START.map(function (q, i) { return '<i' + (i < WIRES.length ? ' class="in"' : '') + '></i>'; }).join('');
    /* no list of what the wiring does: it shows in the things made, never as a read-out */
    oc.hidden = true; oc.innerHTML = '';
    lamps(); drawCables();
  }
  function lamps() {
    cards.forEach(function (el) { var id = el.dataset.id, l = el.querySelector('.hm-lamps'), ws = WIRES.filter(function (w) { return w[0] === id || w[1] === id; });
      el.classList.toggle('wired', ws.length > 0); if (ws.length) el.style.setProperty('--mx', wireCol(ws[0])); else el.style.removeProperty('--mx');
      /* what a card takes in shows in what it makes, never as tags on the card: the engine stays out of sight */
      if (l) l.innerHTML = ''; });
  }
  /* fits lit, the rest dull */
  function fitsShow(from) { $$('.sl', jk).forEach(function (q) { var id = q.dataset.s; q.classList.toggle('ok', !!from && id !== from && fits(from, id)); q.classList.toggle('dl', !!from && id !== from && !fits(from, id)); }); }
  /* a preview of what a cable would do, while it is held over a jack */
  var pv = D.createElement('p'); pv.className = 'pv'; pv.hidden = true; pv.setAttribute('aria-live', 'polite'); sb.appendChild(pv);
  /* no read-out of the wiring: the jacks lighting up say what fits, the cards show what it made */
  function preview(from, to) { pv.hidden = true; if (pv) return; var lines = [];
    if (to && to !== from && WIRES.length >= MAXW && !wired(from, to) && fits(from, to)) lines.push('FOUR CABLES IN · TAP A LIT JACK TO LIFT ONE');
    else if (to && to !== from) { carry(from, to).forEach(function (e) { lines.push(nameOf(to) + ' GETS ' + PORTS[to].ins[e]); }); carry(to, from).forEach(function (e) { lines.push(nameOf(from) + ' GETS ' + PORTS[from].ins[e]); }); if (!lines.length) lines.push(nameOf(from) + ' AND ' + nameOf(to) + ' DO NOT JOIN'); else if (wired(from, to)) lines.push('JOINED ALREADY'); }
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
  /* a card's jack key: the board comes up, what this card can join lights, and the most useful pair not yet made is read out */
  var plugT = 0;
  function plugOut(id) { ghostGone(); clearTimeout(plugT); rise(); idleSoon(9000); fitsShow(id); var best = null;
    $$('.sl', jk).forEach(function (q) { var o = q.dataset.s; if (!best && o !== id && fits(id, o) && !wired(id, o)) best = o; q.classList.toggle('say', o === best); });
    preview(id, best); beep(392, 0.05); plugT = setTimeout(function () { fitsShow(null); preview(null); $$('.sl.say', jk).forEach(function (q) { q.classList.remove('say'); }); }, 5200); }
  /* once, as a hint: a ghost jack rises from the sunk board on the second card; a touch brings the board up */
  var ghost = null;
  function ghostGone() { if (!ghost) return; var g0 = ghost; ghost = null; g0.classList.add('out'); setTimeout(function () { g0.remove(); }, 500); }
  function ghostOnce() { if (ghost || store.get('da.sb.ghost', 0) || !sb.classList.contains('low') || xv.classList.contains('on') || away) return; store.set('da.sb.ghost', 1);
    ghost = D.createElement('button'); ghost.className = 'hm-ghost'; ghost.setAttribute('aria-label', 'Cables'); ghost.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="5"/><circle cx="12" cy="9" r="1.6" class="f"/><path d="M12 14v3.5c0 1.8 1.5 3 3.5 3"/></svg>';
    ghost.addEventListener('click', function () { var id = CUR && JACKED.indexOf(CUR) >= 0 ? CUR : 'radio'; plugOut(id); }); root.appendChild(ghost); setTimeout(ghostGone, 9000); }
  col.addEventListener('scroll', function () { if (CUR && CUR !== 'radio' && !ghost) setTimeout(ghostOnce, 1200); }, { passive: true });
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
    requestAnimationFrame(frame); if (D.hidden) return;
    /* behind an open experience only the jellyfish shows: half the frames, and nothing the sheet covers is drawn (the studio shares this thread and its sound) */
    var sheet = xv.classList.contains('on'); if (sheet && (H.classList.contains('hm-nosea') || now - last < 31)) return;
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (Math.round((top.clientWidth || innerWidth) * dpr) !== tcv.width || Math.abs(TOPH + reefH() - CH) > 1) seaSize();
    var open = root.classList.contains('reef') && !away, t = now / 1000;
    var jr = tcv.getBoundingClientRect(), rr = root.getBoundingClientRect();
    var orb = null;
    if (!open && !away && !xv.classList.contains('on')) {
      if (CUR === 'portfolio') { var lb = col.querySelector('[data-id="portfolio"]'), lr = lb && lb.getBoundingClientRect(); if (lr && lr.width) orb = { x: lr.left + lr.width / 2 - jr.left, y: lr.top + lr.height / 2 - jr.top, rx: lr.width * 0.34, ry: lr.height * 0.26 }; }
      else if (CUR === 'radio' && RS.on && RS.sky) orb = { x: RS.sky.x - jr.left, y: RS.sky.y - jr.top, rx: RS.sky.rx, ry: RS.sky.ry, slow: 1, sky: 1 }; }
    if (RN.call) { if (now > RN.call.until || away || xv.classList.contains('on')) RN.call = null; else { var rr0 = col.querySelector('.sk-research .hm-rune'), rb0 = rr0 && rr0.getBoundingClientRect(); if (rb0 && rb0.bottom > 0 && rb0.top < innerHeight) orb = { x: RN.call.x - jr.left, y: RN.call.y - jr.top, rx: 34, ry: 18, slow: 1 }; } }
    if (!LOVE.next) LOVE.next = t + 20;
    if (!RM.matches && !open && !away && !xv.classList.contains('on') && CUR === 'portfolio') { if (!LOVE.until && t > LOVE.next) LOVE.until = t + 16; if (LOVE.until && t > LOVE.until) { LOVE.until = 0; LOVE.next = t + 50 + Math.random() * 40; } } else LOVE.until = 0;
    if (!orb && LOVE.until && J2.on && t > LOVE.until - 7) orb = { x: J2.x, y: J2.y, rx: 30, ry: 12 };
    if (orb) { if (!J.orbit) { J.th = Math.atan2(J.y - orb.y, J.x - orb.x) + 0.5; J.back = false; } J.orbit = orb; }
    else if (J.orbit) { J.orbit = null; J.back = true; }
    if (!RM.matches) swim(dt * (J.orbit ? (J.orbit.slow ? 1.4 : 2.6) : J.back ? 3.2 : 1), t, open); J.blink = Math.max(0, J.blink - dt);
    if (!RM.matches && !open && !away) { var pf = col.querySelector('[data-id="portfolio"]'), pr2 = pf && pf.getBoundingClientRect(), seen = pr2 && pr2.width && pr2.bottom > 0 && pr2.top < innerHeight, low = (root.clientHeight || innerHeight) - 26, aim = null;
      /* the second one lives with the novel.global card: there only while it is the card in view, and gone quickly when it is not */
      var here = seen && CUR === 'portfolio';
      if (here && LOVE.until) aim = { x: J.x, y: J.y, rx: 30, ry: 12 }; else if (here) aim = J.orbit ? { x: J.x, y: J.y, rx: 26, ry: 18 } : { x: pr2.left + pr2.width * 0.66 - jr.left, y: pr2.top + pr2.height * 0.3 - jr.top, rx: 22, ry: 26, slow: 1 };
      if (aim) { if (!J2.on) { J2.on = true; J2.x = aim.x + (Math.random() - 0.5) * 120; J2.y = low; J2.a = -Math.PI / 2; } if (!J2.orbit) J2.th = Math.atan2(J2.y - aim.y, J2.x - aim.x); J2.orbit = aim; J2.al = Math.min(1, J2.al + dt * 0.8); }
      else if (J2.on) { if (!J2.gone) J2.gone = { x: J2.x < VW / 2 ? -90 : VW + 90, y: J2.y + 60 }; J2.orbit = { x: J2.gone.x, y: J2.gone.y, rx: 1, ry: 1 }; J2.al = Math.max(0, J2.al - dt * 1.4); if (J2.al <= 0 || J2.x < -60 || J2.x > VW + 60) { J2.on = false; J2.orbit = null; J2.gone = null; J2.al = 0; } }
      if (aim) J2.gone = null;
      if (J2.on) { var J0 = J; J = J2; swim(dt * (J2.gone ? 3.4 : aim && aim.slow ? 1.1 : 1.7), t, false); J = J0; J2.x += Math.sin(t * 0.55 + 1.3) * 18 * dt; J2.y += Math.cos(t * 0.8) * 9 * dt; J2.blink = Math.max(0, J2.blink - dt); } }
    /* only as much of the sea as shows is cleared and drawn */
    var showH = open || wasOpen ? CH : TOPH + 4 + 60 * J.s; wasOpen = open || top.clientHeight > TOPH + 2;
    tx.setTransform(1, 0, 0, 1, 0, 0); tx.clearRect(0, 0, tcv.width, Math.min(tcv.height, Math.ceil(showH * dpr)));
    tx.setTransform(dpr, 0, 0, dpr, 0, 0);
    murk();
    if (wasOpen) { if (!RB) reefBuild(); drawReef(RM.matches ? 0 : dt, t); }
    var jw = Math.round(rr.width * dpr), jh = Math.round(rr.height * dpr); if (jcv.width !== jw || jcv.height !== jh) { jcv.width = jw; jcv.height = jh; }
    var wide = J.orbit || J.back || J.wide || J2.on || J2.was; J.wide = !!(J.orbit || J.back); J2.was = J2.on; jx.setTransform(1, 0, 0, 1, 0, 0);
    if (wide) jx.clearRect(0, 0, jcv.width, jcv.height); else jx.clearRect(Math.floor((jr.left - rr.left) * dpr) - 1, Math.floor((jr.top - rr.top) * dpr) - 1, Math.ceil(jr.width * dpr) + 2, Math.ceil(jr.height * dpr) + 2);
    if (!away) { jx.save(); jx.setTransform(dpr, 0, 0, dpr, (jr.left - rr.left) * dpr, (jr.top - rr.top) * dpr); if (!J.orbit && !J.back && !J2.on) { jx.beginPath(); jx.rect(0, 0, jr.width, jr.height); jx.clip(); } drawJelly(jx, t); if (J2.on) { jx.globalAlpha = J2.al; if (OPT.stamp) drawJelly2(jx, t, J2); else drawJelly3(jx, t, J2); jx.globalAlpha = 1; } jx.restore(); }
    if (sheet) return;
    /* the buoy's song plays on while the cards are looked through; an experience opened over them has the sound to itself, and the radio on air takes over from it */
    if (!away && RS.on) { if (!RS.song) songOn(); songTick(); }
    if (WIRES.length || LOOSE) drawCables(RM.matches ? 0 : t);
    if (!away) rdSea(t, dt);
    if (!away) hudDraw(now);
    if (CX.on && !away) cxDraw(t, RM.matches ? 0 : dt);
  }
  seaSize(); requestAnimationFrame(frame);
  receipt(); lastPrint();
  if (/[?&]stories\b/.test(location.search)) { history.replaceState(null, '', location.pathname); setTimeout(function () { open('portfolio'); }, 400); }
  requestAnimationFrame(function () { paintAll(); parallax(); board(); zpStart(); rnStart(); paperEdges(); topo(); if (window.__LH && /[?&]panel\b/.test(location.search)) { history.replaceState(null, '', location.pathname); open('space'); } });
  (function () { var c = $('#hm-col'), on = false, chk = function () { var e = c.scrollTop + c.clientHeight >= c.scrollHeight - 80; if (e !== on) { on = e; H.classList.toggle('hm-end', e); } };
    c.addEventListener('scroll', chk, { passive: true }); addEventListener('resize', chk); })();
  window.HOME = { open: open, home: home, wired: wired, find: find, carry: carry, fits: fits, outcomes: outcomes, mix: mix, wires: function () { return WIRES.slice(); }, reef: reef, cards: CARDS, night: setNight, J: J, buoy: function (k) { RS.scrap = !!k; RS.drawn = false; } };
})();

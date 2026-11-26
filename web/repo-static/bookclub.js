/* Book Club: another island's card, built on the archipelagos the way any island could build its own. A terminal for books: a hundred
   titles a genre (Open Library, most printed first, kept for offline), lists a keeper writes (the approval page, BOOK CLUB LISTS), a
   book's preview (its first line, its description), and its sample slip, printed one at a time or a stack at once. PUBLISH sets a
   reader's own essay, zine, story or poem as a slip; it stays on the phone. Nothing is bought or sold, and nothing leaves but a print.
   The print engine (thermal.js) is put in front of this file by build.mjs. */
(function () {
  'use strict';
  var T = window.THERMAL, D = document, $ = function (s) { return D.querySelector(s); };
  var keep = { get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* full or private: as it was */ } } };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var pad = function (n) { return ('00' + n).slice(-3); };

  /* every word as built, each changeable on the approval page (EVERY LINE · BOOK CLUB) */
  var SAY = {}, w = function (t) { return SAY[t] || t; };
  var GENRES = [['fiction', 'FICTION'], ['crime', 'CRIME'], ['sf', 'SCIENCE FICTION'], ['fantasy', 'FANTASY'], ['romance', 'ROMANCE'], ['horror', 'HORROR'], ['historical', 'HISTORICAL'],
    ['short', 'SHORT STORIES'], ['poetry', 'POETRY'], ['drama', 'PLAYS'], ['essays', 'ESSAYS'], ['biography', 'LIVES'], ['history', 'HISTORY'], ['philosophy', 'PHILOSOPHY'],
    ['art', 'ART'], ['nature', 'NATURE'], ['food', 'FOOD'], ['travel', 'TRAVEL'], ['young', 'YOUNG ADULT'], ['children', 'CHILDREN'], ['graphic', 'GRAPHIC NOVELS']];
  var MODES = [['genres', 'GENRES'], ['lists', 'LISTS'], ['publish', 'PUBLISH'], ['picked', 'SELECTED']];
  var KINDS = ['ESSAY', 'ZINE', 'SHORT STORY', 'POEM', 'REVIEW'];
  var NAME = 'EFTPOS BOOK CLUB';

  var S = { mode: keep.get('da.club.mode', 'genres'), g: keep.get('da.club.g', 'fiction'), books: [], open: null, picked: keep.get('da.club.picked', []), mine: keep.get('da.club.mine', []),
    lists: [], li: 0, kind: 'ESSAY', find: '', Q: T.settle(null, null), to: 'novelglobal', prns: [] };
  if (!MODES.some(function (m) { return m[0] === S.mode; })) S.mode = 'genres';

  /* ───────── what is asked of the site, kept on the phone: shown at once from what is kept, then made fresh ───────── */
  function ask(q) { var k = 'da.club.' + q, was = keep.get(k, null);
    var fresh = fetch('/api/bookclub?' + q, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (j) { j.kept = Date.now(); if (!j.fallback) keep.set(k, j); return j; });
    return { now: was, fresh: fresh }; }

  /* ───────── the display, the keys ───────── */
  function lcd(a, b) { $('#lcd1').textContent = a || ' '; $('#lcd2').textContent = b || ' '; }
  function key(n, label, on, data) { return '<button class="k" type="button" data-n="' + pad(n).slice(1) + '"' + (data || '') + ' aria-pressed="' + !!on + '">' + esc(label) + '</button>'; }
  function drawKeys() {
    $('#modes').innerHTML = MODES.map(function (m, i) { return key(i + 1, m[0] === 'picked' ? w(m[1]) + ' ' + S.picked.length : w(m[1]), S.mode === m[0], ' data-m="' + m[0] + '"'); }).join('');
    var ks = S.mode === 'genres' ? GENRES.map(function (g, i) { return key(i + 1, w(g[1]), S.g === g[0], ' data-g="' + g[0] + '"'); })
      : S.mode === 'lists' ? S.lists.map(function (l, i) { return key(i + 1, l.name, S.li === i, ' data-l="' + i + '"'); })
      : S.mode === 'publish' ? KINDS.map(function (k, i) { return key(i + 1, w(k), S.kind === k, ' data-kind="' + k + '"'); }) : [];
    $('#keys').innerHTML = ks.join(''); $('#keys').hidden = !ks.length;
    var all = $('#all'); if (S.mode === 'publish') { all.textContent = w('PRINT'); all.disabled = !pubText().body; }
    else { all.textContent = w('PRINT SELECTED') + ' · ' + S.picked.length; all.disabled = !S.picked.length; }
  }
  $('#modes').addEventListener('click', function (e) { var b = e.target.closest('[data-m]'); if (!b) return; S.mode = b.dataset.m; S.open = null; S.find = ''; $('#find').value = ''; keep.set('da.club.mode', S.mode); show(); });
  $('#keys').addEventListener('click', function (e) { var b = e.target.closest('.k'); if (!b) return;
    if (b.dataset.g) { S.g = b.dataset.g; keep.set('da.club.g', S.g); S.open = null; show(); }
    else if (b.dataset.l) { S.li = +b.dataset.l; S.open = null; show(); }
    else if (b.dataset.kind) { S.kind = b.dataset.kind; drawKeys(); pubSlip(); } });

  /* ───────── the catalogue: a genre, a list, or what is selected ───────── */
  var cat = $('#cat');
  function bookOf(a, g, n) { return { id: a[0] || '', t: a[1], a: a[2] || '', y: a[3] || '', e: a[4] || 0, ia: a[5] || '', g: g, n: n }; }
  function genreName(g) { var x = GENRES.filter(function (q) { return q[0] === g; })[0]; return x ? w(x[1]) : ''; }
  function isPicked(b) { return S.picked.some(function (p) { return p.t === b.t && p.a === b.a; }); }
  function row(b, i) { var on = S.open === i;
    return '<li class="' + (on ? 'on' : '') + '" data-i="' + i + '"><button class="it" type="button" aria-expanded="' + on + '"><span class="n">' + pad(b.n || i + 1) + '</span><span class="t">' + esc(b.t) + '</span><span class="y">' + esc(b.y || '') + '</span><span class="a">' + esc(b.a) + '</span>' + (isPicked(b) ? '<span class="sel">' + esc(w('SELECTED')) + '</span>' : '') + '</button>' + (on ? '<div class="pre" id="pre"></div>' : '') + '</li>'; }
  function listHTML(l) { var f = S.find.toLowerCase(), shown = l.map(function (b, i) { return [b, i]; }).filter(function (x) { return !f || (x[0].t + ' ' + x[0].a).toLowerCase().indexOf(f) >= 0; });
    return shown.length ? '<ol class="list">' + shown.map(function (x) { return row(x[0], x[1]); }).join('') + '</ol>' : '<p class="none">' + esc(w('NOTHING HERE')) + '</p>'; }
  function head(h, sub) { return '<h1>' + esc(h) + '</h1><p class="sub">' + esc(sub) + '</p>'; }
  function show() { drawKeys();
    if (S.mode === 'genres') return showGenre();
    if (S.mode === 'lists') return showList();
    if (S.mode === 'publish') return showPublish();
    S.books = S.picked.slice(); lcd(w('SELECTED'), S.books.length + ' · ' + w('READY TO PRINT')); cat.innerHTML = head(w('SELECTED'), S.books.length + ' ' + w('TITLES')) + listHTML(S.books); }
  function showGenre() { var g = S.g, r = ask('g=' + g), put = function (j) { if (S.mode !== 'genres' || S.g !== g) return;
      S.books = (j.books || []).map(function (a, i) { return bookOf(a, g, i + 1); });
      lcd(genreName(g), S.books.length + ' ' + w('TITLES') + (j.fallback ? ' · ' + w('PUBLIC DOMAIN') : ''));
      cat.innerHTML = head(genreName(g), S.books.length + ' ' + w('TITLES') + ' · ' + (j.fallback ? w('THE PUBLIC DOMAIN') : w('MOST PRINTED FIRST · OPEN LIBRARY'))) + listHTML(S.books); if (S.open != null) preview(); };
    if (r.now) put(r.now); else { lcd(genreName(g), '· · ·'); cat.innerHTML = head(genreName(g), '· · ·') + '<p class="wait">· · ·</p>'; }
    r.fresh.then(function (j) { if (!r.now || JSON.stringify(r.now.books) !== JSON.stringify(j.books)) put(j); }, function () { if (!r.now) { lcd(genreName(g), w('OFFLINE')); cat.innerHTML = head(genreName(g), w('OFFLINE')) + '<p class="none">' + esc(w('NOTHING KEPT YET')) + '</p>'; } }); }
  function showList() { var l = S.lists[S.li];
    if (!l) { lcd(w('LISTS'), '0'); cat.innerHTML = head(w('LISTS'), '') + '<p class="none">' + esc(w('NO LISTS YET')) + '</p>'; return; }
    S.books = l.books; lcd(w('LISTS'), l.name); cat.innerHTML = head(l.name, l.books.length + ' ' + w('TITLES')) + listHTML(S.books); }

  /* a book opened: its preview, its slip, and what can be done with it */
  cat.addEventListener('click', function (e) { var it = e.target.closest('.it'); if (it) { var i = +it.parentNode.dataset.i; S.open = S.open === i ? null : i; rerow(); if (S.open != null) preview(); return; }
    var a = e.target.closest('[data-do]'); if (!a) return; var b = S.books[S.open]; if (!b) return;
    if (a.dataset.do === 'print') printBooks([b], a); else if (a.dataset.do === 'pick') { togglePick(b); preview(); } });
  function rerow() { var f = S.mode === 'publish' ? null : cat.querySelector('.list'); if (!f) return; var keepY = scrollY; f.outerHTML = listHTML(S.books); scrollTo(0, keepY); }
  function togglePick(b) { if (isPicked(b)) S.picked = S.picked.filter(function (p) { return !(p.t === b.t && p.a === b.a); }); else S.picked.push({ id: b.id, t: b.t, a: b.a, y: b.y, e: b.e, ia: b.ia, g: b.g, n: b.n, f: b.f || '', d: b.d || '', note: b.note || '', pp: b.pp || '' });
    keep.set('da.club.picked', S.picked); drawKeys(); rerow(); }
  function preview() { var b = S.books[S.open], box = $('#pre'); if (!b || !box) return;
    var paint = function () { if (!$('#pre') || S.books[S.open] !== b) return;
      var meta = [b.y, b.pp ? b.pp + ' ' + w('PAGES') : '', b.e ? b.e + ' ' + w('EDITIONS') : '', genreName(b.g)].filter(Boolean);
      $('#pre').innerHTML = (b.note ? '<p class="note">' + esc(b.note) + '</p>' : '') + (b.f ? '<p class="first">' + esc(b.f) + '</p>' : '') + (b.d ? '<p class="desc">' + esc(b.d) + '</p>' : '') + '<div class="meta">' + meta.map(function (m) { return '<span>' + esc(m) + '</span>'; }).join('') + '</div>' +
        '<div class="slip"><canvas aria-label="' + esc(w('SAMPLE')) + '"></canvas></div>' +
        '<div class="acts"><button class="print" type="button" data-do="print">' + esc(w('PRINT')) + '</button><button type="button" data-do="pick">' + esc(isPicked(b) ? w('SELECTED') : w('SELECT')) + '</button>' +
        (b.ia ? '<a href="https://archive.org/details/' + encodeURIComponent(b.ia) + '" target="_blank" rel="noopener">' + esc(w('READ')) + '</a>' : '') + (b.id ? '<a href="https://openlibrary.org/works/' + b.id + '" target="_blank" rel="noopener">' + esc(w('MORE')) + '</a>' : '') + '</div>';
      fontsReady.then(function () { var c = $('#pre canvas'); if (!c) return; var s = slipOf(b, 512); c.width = s.width; c.height = s.height; c.getContext('2d').drawImage(s, 0, 0); }); };
    paint();
    /* what the list does not carry: the book itself (a list names a title and author; it is looked up), then its description and first line */
    var find = b.id || b.looked ? Promise.resolve() : (function () { var r = ask('q=' + encodeURIComponent(b.t + ' ' + b.a)); return (r.now ? Promise.resolve(r.now) : r.fresh).then(function (j) { b.looked = 1; if (j && j.book) { b.id = j.book[0]; b.y = b.y || j.book[3] || ''; b.e = j.book[4] || 0; if (j.f) b.f = j.f; } }, function () {}); })();
    find.then(function () { if (!b.id || b.got) return paint(); var r = ask('w=' + b.id), put = function (j) { b.got = 1; b.d = j.d || ''; b.f = j.f || b.f || ''; b.pp = j.pp || ''; if (j.ia) b.ia = j.ia; paint(); };
      if (r.now) put(r.now); paint(); r.fresh.then(put, function () {}); }); }

  /* ───────── the slip: the terminal's receipt, set like a page from a press ───────── */
  var fontsReady = (D.fonts && D.fonts.load ? Promise.all(['600 20px Plex', '500 20px Plex', 'italic 700 40px Play', 'italic 400 24px Play', '400 22px Play'].map(function (f) { return D.fonts.load(f); })) : Promise.resolve()).catch(function () {});
  function wrap(x, t, X, y, max, lh) { var words = String(t || '').split(/\s+/).filter(Boolean), line = '', n = 0;
    words.forEach(function (wd) { var test = line ? line + ' ' + wd : wd; if (x.measureText(test).width > max && line) { x.fillText(line, X, y + n * lh); n++; line = wd; } else line = test;
      while (x.measureText(line).width > max && line.length > 1) { var k = line.length; while (k > 1 && x.measureText(line.slice(0, k)).width > max) k--; x.fillText(line.slice(0, k), X, y + n * lh); n++; line = line.slice(k); } });
    if (line) { x.fillText(line, X, y + n * lh); n++; } return n * lh; }
  function slipBase(W, H) { var c = D.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.fillStyle = '#000'; x.textBaseline = 'top'; return { c: c, x: x }; }
  function rule(x, y, W, M, h) { x.fillRect(M, y, W - 2 * M, h); }
  function trim(c, h) { var o = D.createElement('canvas'); o.width = c.width; o.height = Math.ceil(h / 8) * 8; o.getContext('2d').drawImage(c, 0, 0); return o; }
  function today() { var d = new Date(); return d.getDate() + ' ' + ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][d.getMonth()] + ' ' + d.getFullYear(); }
  function slipOf(b, W) { var k = W / 512, M = Math.round(22 * k), s = slipBase(W, 2600), x = s.x, y = Math.round(10 * k), f = function (n) { return Math.round(n * k); };
    x.font = '600 ' + f(17) + 'px Plex'; x.fillText(w(NAME), M, y); var dt = today(); x.fillText(dt, W - M - x.measureText(dt).width, y); y += f(28); rule(x, y, W, M, f(3)); y += f(16);
    x.font = '500 ' + f(17) + 'px Plex'; x.fillText([genreName(b.g), b.n ? pad(b.n) : ''].filter(Boolean).join(' · '), M, y); y += f(34);
    x.font = 'italic 700 ' + f(40) + 'px Play'; y += wrap(x, b.t, M, y, W - 2 * M, f(46)) + f(8);
    x.font = '600 ' + f(19) + 'px Plex'; y += wrap(x, String(b.a || '').toUpperCase(), M, y, W - 2 * M, f(26));
    var meta = [b.y, b.pp ? b.pp + ' ' + w('PAGES') : ''].filter(Boolean).join(' · '); if (meta) { x.font = '500 ' + f(17) + 'px Plex'; x.fillText(meta, M, y + f(2)); y += f(28); }
    if (b.note) { y += f(6); x.font = 'italic 700 ' + f(23) + 'px Play'; y += wrap(x, b.note, M, y, W - 2 * M, f(31)); }
    y += f(10); rule(x, y, W, M, f(1)); y += f(22);
    if (b.f) { x.font = 'italic 400 ' + f(25) + 'px Play'; y += wrap(x, '“' + b.f + '”', M, y, W - 2 * M, f(34)) + f(16); }
    if (b.d) { var d = b.d.length > 620 ? b.d.slice(0, 620).replace(/\s+\S*$/, '') + ' …' : b.d; x.font = '400 ' + f(22) + 'px Play'; y += wrap(x, d.replace(/\s*\n+\s*/g, ' '), M, y, W - 2 * M, f(31)) + f(16); }
    rule(x, y, W, M, f(1)); y += f(18);
    var url = b.id ? 'https://openlibrary.org/works/' + b.id : '', qh = 0;
    if (url && window.qrcode) { try { var q = window.qrcode(0, 'M'); q.addData(url); q.make(); var n = q.getModuleCount(), m = Math.max(2, Math.floor(f(132) / n)); for (var r = 0; r < n; r++) for (var cc = 0; cc < n; cc++) if (q.isDark(r, cc)) x.fillRect(M + cc * m, y + r * m, m, m); qh = n * m; } catch (e) { qh = 0; } }
    x.font = '600 ' + f(17) + 'px Plex'; var sx = qh ? M + qh + f(18) : M, code = (b.g ? b.g.slice(0, 3).toUpperCase() : 'LST') + '-' + pad(b.n || 0);
    x.fillText(code, sx, y + f(4)); x.font = '500 ' + f(15) + 'px Plex'; if (b.e) x.fillText(b.e + ' ' + w('EDITIONS'), sx, y + f(30));
    y += Math.max(qh, f(56)) + f(18); return trim(s.c, y); }
  function pubSlipOf(p, W) { var k = W / 512, M = Math.round(22 * k), s = slipBase(W, 9000), x = s.x, y = Math.round(10 * k), f = function (n) { return Math.round(n * k); };
    x.font = '600 ' + f(17) + 'px Plex'; x.fillText(w(NAME), M, y); var kd = w(p.kind); x.fillText(kd, W - M - x.measureText(kd).width, y); y += f(28); rule(x, y, W, M, f(3)); y += f(26);
    x.font = 'italic 700 ' + f(42) + 'px Play'; y += wrap(x, p.title || w('UNTITLED'), M, y, W - 2 * M, f(48)) + f(6);
    if (p.by) { x.font = '600 ' + f(19) + 'px Plex'; y += wrap(x, (w('BY') + ' ' + p.by).toUpperCase(), M, y, W - 2 * M, f(26)); }
    y += f(12); rule(x, y, W, M, f(1)); y += f(24);
    x.font = (p.kind === 'POEM' ? 'italic ' : '') + '400 ' + f(23) + 'px Play';
    String(p.body || '').split(/\n/).forEach(function (para) { if (!para.trim()) { y += f(18); return; } if (y < 8800) y += wrap(x, para, M, y, W - 2 * M, f(33)); });
    y += f(18); rule(x, y, W, M, f(3)); y += f(14); x.font = '500 ' + f(16) + 'px Plex'; x.fillText(today(), M, y); y += f(36); return trim(s.c, y); }

  /* ───────── PUBLISH: a reader's own, set as a slip; kept on this phone, never sent anywhere but a printer ───────── */
  function pubText() { var t = $('#p-t'), b = $('#p-b'), by = $('#p-by'); return { kind: S.kind, title: t ? t.value.trim() : '', by: by ? by.value.trim() : '', body: b ? b.value.replace(/\s+$/, '') : '' }; }
  function showPublish() { lcd(w('PUBLISH'), w(S.kind)); var d = keep.get('da.club.draft', {});
    cat.innerHTML = head(w('PUBLISH'), w('ESSAYS · ZINES · SHORT STORIES · POEMS')) + '<div class="pub"><div style="display:grid;gap:12px"><label>' + esc(w('TITLE')) + '<input id="p-t" maxlength="120"></label><label>' + esc(w('BY')) + '<input id="p-by" maxlength="80"></label><label>' + esc(w('TEXT')) + '<textarea id="p-b" maxlength="20000"></textarea></label>' +
      '<div class="row"><button class="thin" type="button" id="p-keep">' + esc(w('KEEP')) + '</button></div></div><div class="slip"><canvas id="p-c" aria-label="' + esc(w('SAMPLE')) + '"></canvas></div></div>' +
      (S.mine.length ? '<p class="sub" style="margin-top:28px">' + esc(w('MY SHELF')) + '</p><ol class="list" id="mine">' + S.mine.map(function (m, i) { return '<li><button class="it" type="button" data-m="' + i + '"><span class="n">' + pad(i + 1) + '</span><span class="t">' + esc(m.title || w('UNTITLED')) + '</span><span class="y">' + esc(w(m.kind)) + '</span><span class="a">' + esc(m.by || '') + '</span></button></li>'; }).join('') + '</ol>' : '');
    $('#p-t').value = d.title || ''; $('#p-by').value = d.by || ''; $('#p-b').value = d.body || '';
    ['#p-t', '#p-by', '#p-b'].forEach(function (s) { $(s).addEventListener('input', function () { keep.set('da.club.draft', pubText()); clearTimeout(showPublish.t); showPublish.t = setTimeout(pubSlip, 160); drawKeys(); }); });
    $('#p-keep').addEventListener('click', function () { var p = pubText(); if (!p.body) return say(w('NOTHING TO KEEP')); p.at = Date.now(); S.mine.unshift(p); S.mine = S.mine.slice(0, 40); keep.set('da.club.mine', S.mine); say(w('KEPT')); showPublish(); });
    var mine = $('#mine'); if (mine) mine.addEventListener('click', function (e) { var b = e.target.closest('[data-m]'); if (!b) return; var m = S.mine[+b.dataset.m]; S.kind = m.kind || 'ESSAY'; keep.set('da.club.draft', m); showPublish(); scrollTo(0, 0); });
    pubSlip(); }
  function pubSlip() { var c = $('#p-c'); if (!c) return; fontsReady.then(function () { var s = pubSlipOf(pubText(), 512); c.width = s.width; c.height = s.height; c.getContext('2d').drawImage(s, 0, 0); }); }

  /* ───────── printing: to the island chosen at the top; a stack goes as few jobs as it can, a cut between each slip ───────── */
  function say(t) { $('#say').textContent = t; clearTimeout(say.t); say.t = setTimeout(function () { $('#say').textContent = ''; }, 4000); }
  function word(p) { var x = String((p && (p.name || p.id)) || '').trim().split(/\s+/); return x.length <= 2 ? x.join(' ') : x[0]; }
  function toDraw() { var p = S.prns.filter(function (q) { return q.id === S.to; })[0], b = $('#to'); b.classList.toggle('on', !!(p && (p.ready || p.ghost))); b.querySelector('span').textContent = p ? word(p) : 'novel.global'; }
  function printers() { var k = keep.get('da.hm.key', ''); return fetch('/api/partners', { headers: /^[A-Za-z0-9_-]{16,64}$/.test(k) ? { authorization: 'Bearer ' + k } : {}, cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : {}; }).then(function (j) {
    S.prns = ((j && j.partners) || []).filter(function (p) { return p.id === 'novelglobal' || p.ghost || (p.paired && (p.links || []).indexOf('wish') >= 0); }).sort(function (a, b) { return !!(b.ready || b.ghost) - !!(a.ready || a.ghost); });
    if (!S.prns.some(function (p) { return p.id === S.to; })) S.to = S.prns.length ? S.prns[0].id : 'novelglobal'; toDraw(); }).catch(toDraw); }
  $('#to').addEventListener('click', function () { if (S.prns.length < 2) return printers(); var i = S.prns.map(function (p) { return p.id; }).indexOf(S.to); S.to = S.prns[(i + 1) % S.prns.length].id; toDraw(); });
  function who() { var c = keep.get('da.who', ''); return typeof c === 'string' && /^(?:[A-HJ-NP-Z2-9]{3}|[A-HJ-NP-Z2-9]{6})$/.test(c) ? c : undefined; }
  function code() { var CR = '0123456789ABCDEFGHJKMNPQRSTVWXYZ', r = new Uint8Array(4), s = 'DA-'; crypto.getRandomValues(r); for (var i = 0; i < 4; i++) s += CR[r[i] % 32]; return s; }
  function dots() { var p = S.prns.filter(function (q) { return q.id === S.to; })[0]; return p && +p.paper === 58 ? 384 : 512; }
  function sendSlips(slips, kind) { var opts = Object.assign(T.opts(S.Q), { grey: false }), jobs = [], i;
    for (i = 0; i < slips.length; i += 12) jobs.push(slips.slice(i, i + 12));
    var sent = 0, one = function (cs) { var bytes = cs.map(function (c) { return atob(T.raster(T.solid(c, 150), opts)); }).join('');
      var body = { kind: 'record', code: code(), body: JSON.stringify({ type: kind, n: cs.length }), lat: -37.8136, lng: 144.9631, dest: S.to, escpos: btoa(bytes), thumb: T.thumb(cs[0]), who: who(), from: 'bookclub', stage: 'bookclub' };
      return fetch('/api/stories', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) { if (!r.ok) throw new Error(r.status); sent += cs.length; say(w('PRINTING') + ' · ' + sent + ' / ' + slips.length); }); };
    return jobs.reduce(function (p, cs) { return p.then(function () { return one(cs); }); }, Promise.resolve()).then(function () { say(w('SENT') + ' · ' + slips.length); }, function () { say(sent ? w('SENT') + ' · ' + sent + ' / ' + slips.length : w('NOT SENT')); }); }
  function printBooks(list, btn) { if (btn) btn.disabled = true; say('· · ·');
    return fontsReady.then(function () { return sendSlips(list.map(function (b) { return slipOf(b, dots()); }), 'bookclub'); }).then(function () { if (btn) btn.disabled = false; }); }
  $('#all').addEventListener('click', function () { var b = $('#all');
    if (S.mode === 'publish') { var p = pubText(); if (!p.body) return; b.disabled = true; say('· · ·'); return fontsReady.then(function () { return sendSlips([pubSlipOf(p, dots())], 'publish'); }).then(function () { b.disabled = false; }); }
    if (S.picked.length) printBooks(S.picked, b).then(drawKeys); });

  /* FIND: narrows what is shown; ENTER looks a title up when nothing shown has it */
  $('#find').addEventListener('input', function (e) { S.find = e.target.value.trim(); S.open = null; rerow(); });
  $('#find').addEventListener('keydown', function (e) { if (e.key !== 'Enter' || !S.find || S.mode === 'publish') return; if (cat.querySelector('.list li')) return;
    var r = ask('q=' + encodeURIComponent(S.find)); (r.now ? Promise.resolve(r.now) : r.fresh).then(function (j) { if (!j || !j.book) return say(w('NOT FOUND')); S.mode = 'picked'; var b = bookOf(j.book, '', 0); b.f = j.f || ''; S.find = ''; $('#find').value = '';
      if (!isPicked(b)) { S.picked.push(b); keep.set('da.club.picked', S.picked); } show(); }, function () { say(w('OFFLINE')); }); });

  /* ───────── the lists a keeper writes on the approval page: "# NAME", then a book a line: title | author | a note ───────── */
  function parseLists(t) { var out = [], cur = null; String(t || '').split(/\r?\n/).forEach(function (l) { l = l.trim(); if (!l) return;
      if (/^#/.test(l)) { cur = { name: l.replace(/^#+\s*/, '').toUpperCase().slice(0, 40) || '·', books: [] }; out.push(cur); return; }
      if (!cur) { cur = { name: w('LIST'), books: [] }; out.push(cur); } var p = l.split('|').map(function (x) { return x.trim(); });
      if (p[0]) cur.books.push({ id: '', t: p[0].slice(0, 160), a: (p[1] || '').slice(0, 80), y: '', e: 0, ia: '', g: '', n: cur.books.length + 1, f: '', d: '', note: (p[2] || '').slice(0, 300) }); });
    return out.filter(function (x) { return x.books.length; }); }

  /* the site's settings: the words as changed, the house print setting, the lists */
  fetch('/api/settings', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : {}; }).then(function (j) { keep.set('da.club.settings', { say: j.say || '', printq: j.printq || '', bookclub: j.bookclub || '' }); return j; }, function () { return keep.get('da.club.settings', {}); })
    .then(function (j) { try { SAY = j.say ? JSON.parse(j.say) || {} : {}; } catch (e) { SAY = {}; } var o = null; try { o = j.printq ? JSON.parse(j.printq) : null; } catch (e) { o = null; } S.Q = T.settle(o, null);
      S.lists = parseLists(j.bookclub); $('#find').placeholder = w('FIND'); $('#nm').textContent = w(NAME); D.title = w(NAME); show(); });
  $('#find').placeholder = w('FIND'); $('#nm').textContent = w(NAME); show(); printers(); setInterval(printers, 30000);
  window.__club = S;
})();

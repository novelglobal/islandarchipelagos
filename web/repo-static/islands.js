/* the islands, as a live list: each printer, its number, its place, how far and which way, and at a glance whether it is on, its paper, its Wi-Fi,
   a radio and how many prints wait. Opened: its picture and words, PRINT at it (its pop-up, which asks its code), make it HOME (novel.global opens
   with its card and its own order), MAP. Where the visitor stands is asked for only when they press NEAR, and never leaves the phone */
(function () {
  'use strict';
  var D = document, $ = function (s) { return D.querySelector(s); }, LIST = [], ME = null, HEAD = null, OPEN = {}, WAS = {}, SORT = 'n', LAST = 0;
  var mem = { get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set: function (k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* this visit */ } } };
  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, cls, txt) { var e = D.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function svg(cls, box, inner) { var s = D.createElementNS(NS, 'svg'); s.setAttribute('viewBox', box); s.setAttribute('aria-hidden', 'true'); if (cls) s.setAttribute('class', cls); s.innerHTML = inner; return s; }
  function far(a, b) { var R = 6371000, r = Math.PI / 180, dl = (b.lat - a.lat) * r, dn = (b.lng - a.lng) * r, x = Math.sin(dl / 2) * Math.sin(dl / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dn / 2) * Math.sin(dn / 2); return 2 * R * Math.asin(Math.sqrt(x)); }
  function way(a, b) { var r = Math.PI / 180, y = Math.sin((b.lng - a.lng) * r) * Math.cos(b.lat * r), x = Math.cos(a.lat * r) * Math.sin(b.lat * r) - Math.sin(a.lat * r) * Math.cos(b.lat * r) * Math.cos((b.lng - a.lng) * r); return (Math.atan2(y, x) / r + 360) % 360; }
  function metres(m) { return m < 950 ? Math.round(m / 10) * 10 + ' m' : m < 9500 ? (m / 1000).toFixed(1) + ' km' : Math.round(m / 1000) + ' km'; }
  /* the suburb from an address: the part after the street, without the state and postcode */
  function place(a) { var p = String(a || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean); var s = p.length > 1 ? p[1] : p[0] || ''; return s.replace(/\s+(VIC|NSW|QLD|SA|WA|TAS|NT|ACT)\b.*$/i, '').replace(/\s+\d{4}$/, ''); }
  function pad(n) { return n == null ? '—' : (n < 10 ? '0' : '') + n; }

  /* the intel, one glyph each */
  function intel(p) { var b = el('span', 'in'), pw = el('i', 'pw' + (p.on ? ' y' : '')); pw.title = p.on ? 'On' : 'Asleep';
    var pp = svg('pp' + (p.paper === 0 ? ' no' : p.paper == null ? ' un' : ''), '0 0 14 14', '<rect x="3" y="1.5" width="8" height="11" rx="1"/>' + (p.paper === 1 ? '<rect class="f" x="5" y="4" width="4" height="6"/>' : p.paper === 0 ? '<path d="M3 13L11 1" stroke="currentColor" stroke-width="1.6"/>' : ''));
    var ppw = el('span'); ppw.title = p.paper === 1 ? 'Paper in' : p.paper === 0 ? 'Out of paper' : 'Paper not known'; ppw.appendChild(pp);
    var bars = '', h = [4, 7.5, 11]; for (var k = 0; k < 3; k++) bars += '<rect' + (p.sig != null && p.sig > k ? ' class="y"' : '') + ' x="' + (1 + k * 4.5) + '" y="' + (13 - h[k]) + '" width="3" height="' + h[k] + '"/>';
    var wf = el('span'); wf.title = p.sig == null ? 'Wi-Fi not known' : ['Wi-Fi weak', 'Wi-Fi fair', 'Wi-Fi good', 'Wi-Fi strong'][p.sig]; wf.appendChild(svg('wf', '0 0 14 14', bars));
    var rd = el('span'); rd.title = p.mesh ? 'Radio: sends by mesh' : 'No radio'; rd.appendChild(svg('rd' + (p.mesh ? ' y' : ''), '0 0 14 14', '<circle cx="7" cy="7" r="1.4"/><path d="M4 4a4.3 4.3 0 0 0 0 6M10 4a4.3 4.3 0 0 1 0 6' + (p.mesh ? 'M2 2a7.2 7.2 0 0 0 0 10M12 2a7.2 7.2 0 0 1 0 10' : '') + '"/>'));
    var q = el('span', 'q' + (p.queue ? '' : ' z'), String(Math.min(99, p.queue || 0))); q.title = (p.queue || 0) + ' waiting to print';
    b.append(pw, ppw, wf, rd, q); return b; }

  function homeOf() { var h = mem.get('da.pop.home', null); return h && h.pick ? h : null; }
  function homeBar() { var h = homeOf(), b = $('#home'); b.hidden = !h; if (h) $('#homet').textContent = 'HOME · ' + String(h.name || h.id).toUpperCase(); }
  function setHome(p) { var h = homeOf(); if (h && h.isle === p.id) { mem.set('da.pop.home', null); } else mem.set('da.pop.home', { id: p.pop, isle: p.id, name: p.name, home: p.home || null, card: true, pick: true, at: Date.now() }); homeBar(); draw(); }

  function sorted() { var l = LIST.slice(), d = function (p) { return ME && p.lat != null ? far(ME, p) : 1e12; }, n = function (p) { return p.number == null ? 1e6 : p.number; };
    if (SORT === 'near') l.sort(function (a, b) { return d(a) - d(b) || n(a) - n(b); });
    else if (SORT === 'on') l.sort(function (a, b) { return (b.on + b.open * 2) - (a.on + a.open * 2) || n(a) - n(b); });
    else l.sort(function (a, b) { return n(a) - n(b); }); return l; }

  function draw() { var box = $('#list'), h = homeOf(); box.replaceChildren(); $('#none').hidden = !!LIST.length;
    var on = LIST.filter(function (p) { return p.on; }).length, op = LIST.filter(function (p) { return p.open; }).length;
    $('#tally').textContent = ' ' + on + ' ON · ' + op + ' OPEN · ' + LIST.length;
    sorted().forEach(function (p) { var li = el('li', p.open ? '' : 'shut'), row = el('button', 'row'), nm = el('span', 'nm'), sub = el('span'), d = el('span', 'd'), id = 'i-' + p.id, sig = [p.on, p.open, p.paper, p.sig, p.queue].join();
      if (WAS[p.id] != null && WAS[p.id] !== sig) li.classList.add('flash'); WAS[p.id] = sig;
      row.type = 'button'; row.setAttribute('aria-expanded', String(!!OPEN[p.id])); row.setAttribute('aria-controls', id);
      nm.appendChild(el('b', '', p.name)); var st = el('em', '', p.open ? 'OPEN' : 'CLOSED'); sub.appendChild(st); var pl = place(p.addr); if (pl) sub.appendChild(D.createTextNode(' · ' + pl)); if (h && h.isle === p.id) sub.appendChild(D.createTextNode(' · HOME')); nm.appendChild(sub);
      if (ME && p.lat != null) { var bg = way(ME, p), ar = svg('', '0 0 24 24', '<path d="M12 21V4M6 10l6-6 6 6"/>'); ar.style.transform = 'rotate(' + (bg - (HEAD == null ? 0 : HEAD)).toFixed(0) + 'deg)'; ar.dataset.b = bg; d.append(ar, metres(far(ME, p))); d.title = HEAD == null ? ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(bg / 45) % 8] : ''; }
      else d.appendChild(el('i', '', p.lat != null ? 'NEAR?' : '—'));
      row.append(el('span', 'n', pad(p.number)), nm, d, intel(p)); li.appendChild(row);
      var more = el('div', 'more'); more.id = id; more.hidden = !OPEN[p.id];
      var ch = el('div', 'chips'), chip = function (t, c) { ch.appendChild(el('span', c || '', t)); };
      chip(p.on ? 'ON' : 'ASLEEP', p.on ? 'y' : ''); chip(p.open ? 'OPEN' : 'CLOSED', p.open ? 'y' : ''); chip(p.paper === 1 ? 'PAPER' : p.paper === 0 ? 'NO PAPER' : 'PAPER ?', p.paper === 0 ? 'no' : p.paper === 1 ? 'y' : ''); chip('WI-FI ' + (p.sig == null ? '?' : ['▂', '▂▄', '▂▄▆', '▂▄▆█'][p.sig]), p.sig ? 'y' : ''); if (p.mesh) chip('RADIO', 'y'); chip('QUEUE ' + (p.queue || 0), p.queue ? 'y' : '');
      more.appendChild(ch);
      if (p.pic && /^data:image\//.test(p.pic)) { var im = el('img', 'pic'); im.alt = ''; im.loading = 'lazy'; im.src = p.pic; more.appendChild(im); }
      if (p.addr) more.appendChild(el('p', 'ad', p.addr)); if (p.words) more.appendChild(el('p', 'wd', p.words));
      var acts = el('div', 'acts'), pr = el('a', 'go'), hm = el('button'), mp = el('a');
      pr.appendChild(svg('', '0 0 24 24', '<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z"/>')); pr.appendChild(D.createTextNode('PRINT')); pr.title = 'Print at ' + p.name + ': its pop-up asks its code';
      if (p.pop) pr.href = '/popup?p=' + encodeURIComponent(p.pop); else pr.setAttribute('aria-disabled', 'true');
      var mine = !!(h && h.isle === p.id); hm.type = 'button'; hm.setAttribute('aria-pressed', String(mine)); hm.appendChild(svg('', '0 0 24 24', '<path d="M4 11l8-7 8 7M6 9.5V20h12V9.5"/>')); hm.appendChild(D.createTextNode('HOME'));
      hm.title = mine ? 'novel.global opens with ' + p.name + ': press to undo' : 'Open novel.global with ' + p.name + ': its card, its order'; if (!p.pop) hm.setAttribute('aria-disabled', 'true'); hm.onclick = function () { setHome(p); };
      mp.appendChild(svg('', '0 0 24 24', '<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>')); mp.appendChild(D.createTextNode('MAP')); mp.title = 'Where it is, on OpenStreetMap';
      if (p.lat != null) { mp.href = 'https://www.openstreetmap.org/?mlat=' + p.lat + '&mlon=' + p.lng + '#map=18/' + p.lat + '/' + p.lng; mp.target = '_blank'; mp.rel = 'noopener'; } else mp.setAttribute('aria-disabled', 'true');
      acts.append(pr, hm, mp); more.appendChild(acts);
      if (mine) { var gh = el('a', '', 'GO'); gh.href = '/'; gh.prepend(svg('', '0 0 24 24', '<path d="M5 12h14M13 6l6 6-6 6"/>')); gh.title = 'novel.global, as ' + p.name; acts.appendChild(gh); }
      row.onclick = function () { OPEN[p.id] = !OPEN[p.id]; more.hidden = !OPEN[p.id]; row.setAttribute('aria-expanded', String(!!OPEN[p.id])); };
      li.appendChild(more); box.appendChild(li); }); }

  function turn() { [].forEach.call(D.querySelectorAll('.row .d svg'), function (s) { s.style.transform = 'rotate(' + (+s.dataset.b - (HEAD || 0)).toFixed(0) + 'deg)'; }); }
  function compass() { var on = function (e) { var h = e.webkitCompassHeading != null ? e.webkitCompassHeading : (e.absolute && e.alpha != null ? 360 - e.alpha : null); if (h == null) return; var first = HEAD == null; HEAD = h; if (first) draw(); else turn(); };
    try { var DO = window.DeviceOrientationEvent; if (DO && typeof DO.requestPermission === 'function') DO.requestPermission().then(function (r) { if (r === 'granted') addEventListener('deviceorientation', on); }, function () { /* north stays up */ }); else { addEventListener('deviceorientationabsolute', on); addEventListener('deviceorientation', on); } } catch (e) { /* north stays up */ } }
  function near() { compass(); if (!navigator.geolocation) { $('#say').textContent = 'NO LOCATION ON THIS PHONE'; return; } $('#say').textContent = '· · ·';
    navigator.geolocation.getCurrentPosition(function (p) { ME = { lat: p.coords.latitude, lng: p.coords.longitude }; $('#say').textContent = ''; draw(); }, function () { $('#say').textContent = 'NOT ALLOWED · SORTED BY NUMBER'; sortBy('n'); }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }); }
  function sortBy(s) { SORT = s; [].forEach.call(D.querySelectorAll('[data-sort]'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.sort === s)); }); mem.set('da.isl.sort', s === 'near' ? 'n' : s); if (s === 'near' && !ME) near(); else draw(); }
  [].forEach.call(D.querySelectorAll('[data-sort]'), function (b) { b.onclick = function () { sortBy(b.dataset.sort); }; });
  $('#unhome').onclick = function () { mem.set('da.pop.home', null); homeBar(); draw(); };

  function stale() { $('#live').classList.toggle('stale', !LAST || Date.now() - LAST > 70000); }
  function load() { return fetch('/api/isles', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (j) { LIST = j.isles || []; LAST = Date.now(); stale(); draw(); }, stale); }
  var s0 = mem.get('da.isl.sort', 'n'); SORT = s0 === 'on' ? 'on' : 'n'; [].forEach.call(D.querySelectorAll('[data-sort]'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.sort === SORT)); });
  homeBar(); load(); setInterval(function () { if (!D.hidden) load(); else stale(); }, 15000);
  D.addEventListener('visibilitychange', function () { if (!D.hidden) load(); });
})();

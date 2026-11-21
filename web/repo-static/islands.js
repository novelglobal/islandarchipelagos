/* the finder: the islands as a radar. You at the middle, each island a dot by its way and distance, the needle to the one picked. It opens
   already pointing at the best one (a card's own island, your home, else the nearest open one). One tap picks an island: its art, how to
   find it, its words, MAP and ISLAND (go to it: it becomes your home island). Walk there: within 40 m it says HERE. Where you stand is asked for once (LOCATE), and never leaves
   the phone. Opened over the site (in=1), the sheet's own back returns you; on its own, the back key does */
(function () {
  'use strict';
  var D = document, $ = function (s) { return D.querySelector(s); }, Q = new URLSearchParams(location.search), EMB = Q.get('in') === '1';
  var LIST = [], ME = null, HEAD = null, PICK = Q.get('i') || null, WAS = {}, LAST = 0, ALL = false, BUZZ = null, WATCH = null, MAXN = 5, HERE_M = 40;
  var mem = { get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set: function (k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* this visit */ } } };
  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, cls, txt) { var e = D.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function svg(cls, box, inner) { var s = D.createElementNS(NS, 'svg'); s.setAttribute('viewBox', box); s.setAttribute('aria-hidden', 'true'); if (cls) s.setAttribute('class', cls); s.innerHTML = inner; return s; }
  function far(a, b) { var R = 6371000, r = Math.PI / 180, dl = (b.lat - a.lat) * r, dn = (b.lng - a.lng) * r, x = Math.sin(dl / 2) * Math.sin(dl / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dn / 2) * Math.sin(dn / 2); return 2 * R * Math.asin(Math.sqrt(x)); }
  function way(a, b) { var r = Math.PI / 180, y = Math.sin((b.lng - a.lng) * r) * Math.cos(b.lat * r), x = Math.cos(a.lat * r) * Math.sin(b.lat * r) - Math.sin(a.lat * r) * Math.cos(b.lat * r) * Math.cos((b.lng - a.lng) * r); return (Math.atan2(y, x) / r + 360) % 360; }
  function metres(m) { return m < 950 ? Math.round(m / 10) * 10 + ' M' : m < 9500 ? (m / 1000).toFixed(1) + ' KM' : Math.round(m / 1000) + ' KM'; }
  var POINT = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  function place(a) { var p = String(a || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean); var s = p.length > 1 ? p[1] : p[0] || ''; return s.replace(/\s+(VIC|NSW|QLD|SA|WA|TAS|NT|ACT)\b.*$/i, '').replace(/\s+\d{4}$/, ''); }
  function pad(n) { return n == null ? '—' : (n < 10 ? '0' : '') + n; }
  function has(p) { return p.lat != null && p.lng != null; }
  /* an island with no place set is known only by its town (where its printer asks from): a distance with ~, never HERE */
  function rough(p) { return !has(p) && Array.isArray(p.near) && p.near.length === 2; }
  function spot(p) { return has(p) ? p : rough(p) ? { lat: p.near[0], lng: p.near[1] } : null; }
  function dist(p) { var a = spot(p); return ME && a ? far(ME, a) : null; }
  function bear(p) { return way(ME, spot(p)); }
  function say(p, m) { return rough(p) ? '~' + metres(Math.max(1000, m)) : m < HERE_M ? 'HERE' : metres(m); }

  if (Q.get('night') === '1') D.documentElement.classList.add('night'); else if (Q.get('night') === '0') D.documentElement.classList.add('day');
  if (EMB) $('#bk').hidden = true; else $('#bk').onclick = function (e) { if (history.length > 1 && D.referrer.indexOf(location.origin) === 0) { e.preventDefault(); history.back(); } };

  /* the glance strip: on, paper, Wi-Fi, mesh, waiting. Icons on every row; picked, the same strip says its words */
  function glance(p) { var g = el('span', 'gl'), it = function (cls, icon, word, title) { var s = el('span', cls); s.title = title; s.appendChild(icon); s.appendChild(el('b', '', word)); g.appendChild(s); };
    it(p.on ? 'y' : 'x', el('i', 'pw'), p.on ? 'ON' : 'ASLEEP', p.on ? 'On now' : 'Asleep: not seen in two minutes');
    it(p.paper === 0 ? 'no' : p.paper == null ? 'x' : '', svg('pp', '0 0 14 14', '<rect x="3" y="1.5" width="8" height="11" rx="1"/>' + (p.paper === 1 ? '<rect class="f" x="5" y="4" width="4" height="6"/>' : p.paper === 0 ? '<path d="M3 13L11 1" stroke="currentColor" stroke-width="1.6"/>' : '')), p.paper === 1 ? 'HAS PAPER' : p.paper === 0 ? 'NO PAPER' : 'PAPER ?', p.paper === 1 ? 'Has paper' : p.paper === 0 ? 'Out of paper' : 'Paper not known');
    var bars = '', h = [4, 7.5, 11]; for (var k = 0; k < 3; k++) bars += '<rect' + (p.sig != null && p.sig > k ? ' class="y"' : '') + ' x="' + (1 + k * 4.5) + '" y="' + (13 - h[k]) + '" width="3" height="' + h[k] + '"/>';
    it(p.sig == null ? 'x' : '', svg('wf', '0 0 14 14', bars), 'WI-FI', p.sig == null ? 'Wi-Fi not known' : ['Wi-Fi weak', 'Wi-Fi fair', 'Wi-Fi good', 'Wi-Fi strong'][p.sig]);
    it(p.mesh ? '' : 'x', svg('ms', '0 0 14 14', '<circle cx="7" cy="7" r="1.4"/><path d="M4 4a4.3 4.3 0 0 0 0 6M10 4a4.3 4.3 0 0 1 0 6M2 2a7.2 7.2 0 0 0 0 10M12 2a7.2 7.2 0 0 1 0 10"/>'), p.mesh ? 'MESH' : 'NO MESH', p.mesh ? 'On the mesh: reached by radio, with no internet' : 'Not on the mesh');
    var q = el('span', 'q', String(Math.min(99, p.queue || 0))); it(p.queue ? '' : 'x', q, 'WAITING', (p.queue || 0) + ' waiting to print');
    return g; }

  /* ISLAND: go to it. novel.global opens as that island (its card, its order) from then on; novel.global's own key goes back to it as it comes */
  /* the home island: the one set here, else the first island joined (a pass kept there), else novel.global */
  function homeOf() { var h = mem.get('da.pop.home', null); return h && h.pick ? h : null; }
  function homeId() { var h = homeOf(), j = mem.get('da.who.places', null) || []; return h ? h.isle : j.length && j[0].id ? j[0].id : 'novelglobal'; }
  function isHome(p) { return homeId() === p.id; }
  function goIsle(p) { if (p.id === 'novelglobal') mem.set('da.pop.home', { id: null, isle: 'novelglobal', name: p.name, home: null, card: false, pick: true, at: Date.now() }); else mem.set('da.pop.home', { id: p.pop, isle: p.id, name: p.name, home: p.home || null, ihome: p.ih || null, card: true, pick: true, at: Date.now() });
    if (EMB) { try { parent.postMessage({ hm: 'isle-go' }, location.origin); return; } catch (e) { /* alone */ } } location.href = '/'; }

  /* the order: open first; then nearest when you are located, else by number. Home leads among equals */
  function sorted() { var n = function (p) { return p.number == null ? 1e6 : p.number; };
    return LIST.slice().sort(function (a, b) { if (!!b.open !== !!a.open) return b.open ? 1 : -1; var da = dist(a), db = dist(b);
      if (da != null || db != null) return (da == null ? 1e12 : da) - (db == null ? 1e12 : db); if (isHome(a) !== isHome(b)) return isHome(a) ? -1 : 1; if (!!b.on !== !!a.on) return b.on ? 1 : -1; return n(a) - n(b); }); }
  function picked() { return LIST.filter(function (p) { return p.id === PICK; })[0] || null; }

  function draw() { var l = sorted(), box = $('#list'); $('#none').hidden = !!LIST.length;
    if (!picked() && l.length) { var hid = homeId(); PICK = (LIST.some(function (p) { return p.id === hid && p.open; }) ? hid : (l.filter(function (p) { return p.open; })[0] || l[0]).id); }
    var on = LIST.filter(function (p) { return p.on; }).length, op = LIST.filter(function (p) { return p.open; }).length; $('#tally').textContent = on + ' ON · ' + op + ' OPEN';
    var shown = ALL ? l : l.filter(function (p, i) { return i < MAXN || p.id === PICK; }); $('#all').hidden = ALL || shown.length >= l.length;
    box.replaceChildren(); shown.forEach(function (p) { box.appendChild(item(p)); }); scope(); }

  function item(p) { var me = p.id === PICK, li = el('li', (p.open ? '' : 'shut') + (me ? ' pick' : '')), row = el('button', 'row'), nm = el('span', 'nm'), sub = el('span'), d = el('span', 'd'), sig = [p.on, p.open, p.paper, p.sig, p.queue, p.mesh].join(), m = dist(p);
    if (WAS[p.id] != null && WAS[p.id] !== sig) li.classList.add('flash'); WAS[p.id] = sig; li.dataset.id = p.id;
    row.type = 'button'; row.setAttribute('aria-expanded', String(me)); row.title = me ? '' : 'Point the way to ' + p.name;
    nm.appendChild(el('b', '', p.name)); sub.appendChild(el('em', '', p.open ? 'OPEN' : 'CLOSED')); var pl = place(p.addr); if (pl) sub.appendChild(D.createTextNode(' · ' + pl)); if (isHome(p)) sub.appendChild(D.createTextNode(' · HOME ISLAND')); nm.appendChild(sub); if (p.line) nm.appendChild(el('span', 'ln', p.line));
    if (m != null) { var bg = bear(p), ar = svg('', '0 0 24 24', '<path d="M12 21V4M6 10l6-6 6 6"/>'); ar.style.transform = 'rotate(' + (bg - (HEAD || 0)).toFixed(0) + 'deg)'; ar.dataset.b = bg; d.append(ar, say(p, m)); }
    else d.appendChild(el('i', '', '—'));
    row.append(el('span', 'n', pad(p.number)), nm, d, glance(p)); li.appendChild(row);
    row.onclick = function () { if (PICK === p.id) return; PICK = p.id; BUZZ = null; draw(); };
    if (me) li.appendChild(more(p)); return li; }

  function more(p) { var mo = el('div', 'more');
    if (p.pics && p.pics.length) { var ps = el('div', 'pics'); p.pics.forEach(function (u) { if (!/^\/api\/cards\//.test(u)) return; var im = el('img'); im.alt = ''; im.loading = 'lazy'; im.decoding = 'async'; im.src = u; ps.appendChild(im); }); mo.appendChild(ps); }
    if (p.pic && /^data:image\//.test(p.pic)) { var im = el('img', 'pic'); im.alt = ''; im.src = p.pic; mo.appendChild(im); }
    if (p.find) mo.appendChild(el('p', 'fd', p.find)); if (p.words) mo.appendChild(el('p', 'wd', p.words)); if (p.addr) mo.appendChild(el('p', 'ad', p.addr));
    var acts = el('div', 'acts'), mp = el('a', 'go'), hm = el('button');
    mp.appendChild(svg('', '0 0 24 24', '<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>')); mp.appendChild(D.createTextNode('MAP')); mp.target = '_blank'; mp.rel = 'noopener';
    if (has(p)) { mp.href = 'https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=%3B' + p.lat + '%2C' + p.lng + '#map=17/' + p.lat + '/' + p.lng; mp.title = 'Walking directions, on OpenStreetMap'; }
    else if (p.addr) { mp.href = 'https://www.openstreetmap.org/search?query=' + encodeURIComponent(p.addr); mp.title = 'Its address, on OpenStreetMap'; }
    else { mp.setAttribute('aria-disabled', 'true'); mp.title = 'Not on the map yet'; }
    var can = p.open && (!!p.pop || p.id === 'novelglobal'); hm.type = 'button'; hm.className = 'isl';
    hm.appendChild(D.createTextNode('ISLAND')); hm.appendChild(svg('', '0 0 24 24', '<path d="M5 12h13M13 6l6 6-6 6"/>'));
    hm.title = !can ? 'Closed' : 'Go to ' + p.name + ' and make it your home island: its card, its order. You can still use every island';
    if (!can) hm.setAttribute('aria-disabled', 'true'); hm.onclick = function () { goIsle(p); };
    acts.append(mp, hm); mo.appendChild(acts); return mo; }

  /* the dial: dots by way and distance (a log scale, out to 20 km at the rim); an island with no place, or you not located, rides the rim */
  function scope() { var g = $('#dots'), p = picked(), sc = $('#scope'), rd = $('#read'), ndl = $('#ndl'); g.replaceChildren();
    var rim = LIST.filter(function (q) { return dist(q) == null; }), at = {};
    LIST.forEach(function (q) { var m = dist(q), a, r; if (m != null) { a = bear(q); r = 14 + 128 * Math.min(1, Math.log(1 + m / 40) / Math.log(1 + 20000 / 40)); } else { a = 360 * rim.indexOf(q) / Math.max(1, rim.length) + 20; r = 142; }
      var x = 150 + r * Math.sin(a * Math.PI / 180), y = 150 - r * Math.cos(a * Math.PI / 180), d = D.createElementNS(NS, 'g'); at[q.id] = [x, y];
      d.setAttribute('class', 'isl' + (q.open ? '' : ' shut') + (q.id === PICK ? ' pick' : '')); d.innerHTML = '<circle class="ring" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="9"/><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (q.id === PICK ? 6 : 4.5) + '"/><circle class="hit" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="16"/>';
      var t = D.createElementNS(NS, 'title'); t.textContent = q.name; d.appendChild(t); d.addEventListener('click', function () { if (PICK !== q.id) { PICK = q.id; BUZZ = null; draw(); } var li = D.querySelector('li[data-id="' + q.id + '"]'); if (li) li.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }); g.appendChild(d); });
    var m = p ? dist(p) : null, xy = p && at[p.id]; sc.classList.toggle('lost', m == null); $('#loc').hidden = !!ME;
    if (xy && m != null) { ndl.setAttribute('x2', xy[0].toFixed(1)); ndl.setAttribute('y2', xy[1].toFixed(1)); }
    var here = m != null && m < HERE_M && !rough(p); sc.classList.toggle('here', here); rd.className = 'read' + (here ? ' here' : m == null ? ' dim' : '');
    if (here) { rd.textContent = 'HERE'; if (BUZZ !== PICK) { BUZZ = PICK; try { navigator.vibrate && navigator.vibrate([60, 60, 120]); } catch (e) { /* no buzz */ } } }
    else if (m != null) { rd.textContent = say(p, m); rd.appendChild(el('small', '', POINT[Math.round(bear(p) / 45) % 8])); }
    else rd.textContent = !p ? '' : !ME ? (LOC || '') : 'UNMAPPED';
    rose(); }
  function rose() { $('#rose').style.transform = HEAD == null ? '' : 'rotate(' + (-HEAD).toFixed(1) + 'deg)';
    [].forEach.call(D.querySelectorAll('.row .d svg'), function (s) { s.style.transform = 'rotate(' + (+s.dataset.b - (HEAD || 0)).toFixed(0) + 'deg)'; }); }

  /* the phone's heading turns the dial so up is the way you face; and where you stand, watched while the finder is open */
  /* an iPhone gives its heading only when asked from a tap: asked again on the next tap until it answers */
  var CMP = 0;
  function compass() { if (CMP) return; var on = function (e) { var h = e.webkitCompassHeading != null ? e.webkitCompassHeading : (e.absolute && e.alpha != null ? 360 - e.alpha : null); if (h == null) return; HEAD = h; rose(); };
    try { var DO = window.DeviceOrientationEvent; if (DO && typeof DO.requestPermission === 'function') DO.requestPermission().then(function (r) { if (r === 'granted' && !CMP) { CMP = 1; addEventListener('deviceorientation', on); } else if (r === 'denied') CMP = 2; }, function () { /* no tap yet */ }); else { CMP = 1; addEventListener('deviceorientationabsolute', on); addEventListener('deviceorientation', on); } } catch (e) { /* north stays up */ } }
  D.addEventListener('click', function () { if (!CMP) compass(); }, true);
  var LOC = '';
  function fix(p) { var first = !ME; ME = { lat: p.coords.latitude, lng: p.coords.longitude }; LOC = ''; $('#read').title = ''; return first; }
  function locate(asked) { if (!navigator.geolocation || WATCH != null) return; if (asked) compass(); $('#loc').textContent = '· · ·';
    /* a quick rough place first (a phone can take a while to find a close one), then the close one as it comes */
    navigator.geolocation.getCurrentPosition(function (p) { if (ME) return; fix(p); draw(); }, function () { /* the watch goes on */ }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 });
    WATCH = navigator.geolocation.watchPosition(function (p) { var first = fix(p); if (first) { var b = sorted().filter(function (q) { return q.open && has(q); })[0]; if (b && !Q.get('i') && !LIST.some(function (q) { return q.id === homeId() && q.open; })) PICK = b.id; draw(); } else { scope(); [].forEach.call(D.querySelectorAll('li[data-id]'), function (li) { var q = LIST.filter(function (x) { return x.id === li.dataset.id; })[0], d = li.querySelector('.d'), m = q && dist(q); if (m != null && d) d.lastChild.textContent = m < HERE_M ? 'HERE' : metres(m); }); } },
      function (e) { if (ME) return; if (e && e.code === 1) { try { navigator.geolocation.clearWatch(WATCH); } catch (x) { /* gone */ } WATCH = null; LOC = 'NOT ALLOWED'; $('#loc').textContent = 'LOCATE'; }
        else LOC = 'FINDING'; $('#read').className = 'read dim'; $('#read').textContent = LOC; $('#read').title = LOC === 'NOT ALLOWED' ? 'Location is off for novel.global: on an iPhone, Settings › Privacy › Location Services › Safari Websites, or the aA menu › Website Settings' : ''; }, { enableHighAccuracy: true, timeout: 30000, maximumAge: 30000 }); }
  $('#loc').onclick = function () { locate(true); };
  $('#all').onclick = function () { ALL = true; draw(); };
  try { navigator.permissions.query({ name: 'geolocation' }).then(function (s) { if (s.state === 'granted') { locate(false); compass(); } }, function () { /* ask on LOCATE */ }); } catch (e) { /* ask on LOCATE */ }

  function stale() { $('#live').classList.toggle('stale', !LAST || Date.now() - LAST > 70000); }
  function load() { return fetch('/api/isles', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (j) { LIST = j.isles || []; LAST = Date.now(); stale(); draw(); }, stale); }
  load(); setInterval(function () { if (!D.hidden) load(); else stale(); }, 15000);
  D.addEventListener('visibilitychange', function () { if (!D.hidden) load(); });
})();

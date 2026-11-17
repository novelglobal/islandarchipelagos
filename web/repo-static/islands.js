/* the islands, for someone looking for one: each printer, whether it is on, whether it is open, and while it is open where it is, how far and which way.
   Where the visitor stands is asked for only when they press the key, and never leaves the phone */
(function () {
  'use strict';
  var D = document, $ = function (s) { return D.querySelector(s); }, LIST = [], ME = null, HEAD = null;
  function el(tag, cls, txt) { var e = D.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function far(a, b) { var R = 6371000, r = Math.PI / 180, dl = (b.lat - a.lat) * r, dn = (b.lng - a.lng) * r, x = Math.sin(dl / 2) * Math.sin(dl / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dn / 2) * Math.sin(dn / 2); return 2 * R * Math.asin(Math.sqrt(x)); }
  function way(a, b) { var r = Math.PI / 180, y = Math.sin((b.lng - a.lng) * r) * Math.cos(b.lat * r), x = Math.cos(a.lat * r) * Math.sin(b.lat * r) - Math.sin(a.lat * r) * Math.cos(b.lat * r) * Math.cos((b.lng - a.lng) * r); return (Math.atan2(y, x) / r + 360) % 360; }
  function metres(m) { return m < 950 ? Math.round(m / 10) * 10 + ' m' : m < 9500 ? (m / 1000).toFixed(1) + ' km' : Math.round(m / 1000) + ' km'; }
  function draw() { var box = $('#list'); box.replaceChildren(); $('#none').hidden = !!LIST.length;
    var l = LIST.slice(); if (ME) l.sort(function (a, b) { var da = a.lat != null ? far(ME, a) : 1e12, db = b.lat != null ? far(ME, b) : 1e12; return da - db; });
    l.forEach(function (p) { var li = el('li'), st = el('p', 'st'), a = el('span', p.on ? 'y' : ''), b = el('span', p.open ? 'y' : '');
      li.appendChild(el('h2', '', p.name)); a.append(el('i'), p.on ? 'On' : 'Asleep'); b.append(el('i'), p.open ? 'Open' : 'Closed'); st.append(a, b); if (p.number) st.appendChild(el('span', '', 'Island ' + p.number)); li.appendChild(st);
      if (p.open) { if (p.pic && /^data:image\//.test(p.pic)) { var im = el('img', 'pic'); im.alt = ''; im.loading = 'lazy'; im.src = p.pic; li.appendChild(im); }
        if (p.addr) li.appendChild(el('p', 'ad', p.addr)); if (p.words) li.appendChild(el('p', 'wd', p.words));
        if (p.lat != null) { var go = el('div', 'go'), w = el('span', 'way'), ln = el('a', '', 'Map'); ln.href = 'https://www.openstreetmap.org/?mlat=' + p.lat + '&mlon=' + p.lng + '#map=18/' + p.lat + '/' + p.lng; ln.target = '_blank'; ln.rel = 'noopener';
          if (ME) { var bg = way(ME, p), sv = D.createElementNS('http://www.w3.org/2000/svg', 'svg'), pa = D.createElementNS('http://www.w3.org/2000/svg', 'path'); sv.setAttribute('viewBox', '0 0 24 24'); pa.setAttribute('d', 'M12 21V4M6 10l6-6 6 6'); sv.appendChild(pa); sv.style.transform = 'rotate(' + (bg - (HEAD == null ? 0 : HEAD)).toFixed(0) + 'deg)'; sv.dataset.b = bg;
            w.append(sv, metres(far(ME, p)) + (HEAD == null ? ' ' + ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(bg / 45) % 8] : '')); }
          go.append(w, ln); li.appendChild(go); } }
      box.appendChild(li); }); }
  function turn() { [].forEach.call(D.querySelectorAll('.way svg'), function (s) { s.style.transform = 'rotate(' + (+s.dataset.b - (HEAD || 0)).toFixed(0) + 'deg)'; }); }
  function compass() { var on = function (e) { var h = e.webkitCompassHeading != null ? e.webkitCompassHeading : (e.absolute && e.alpha != null ? 360 - e.alpha : null); if (h == null) return; var first = HEAD == null; HEAD = h; if (first) draw(); else turn(); };
    try { var DO = window.DeviceOrientationEvent; if (DO && typeof DO.requestPermission === 'function') DO.requestPermission().then(function (r) { if (r === 'granted') addEventListener('deviceorientation', on); }, function () { /* north stays up */ }); else { addEventListener('deviceorientationabsolute', on); addEventListener('deviceorientation', on); } } catch (e) { /* north stays up */ } }
  function load() { return fetch('/api/isles', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : { isles: [] }; }).then(function (j) { LIST = j.isles || []; draw(); }, function () { /* later */ }); }
  $('#near').onclick = function () { compass(); if (!navigator.geolocation) { $('#say').textContent = 'This phone cannot say where it is.'; return; } $('#say').textContent = '· · ·';
    navigator.geolocation.getCurrentPosition(function (p) { ME = { lat: p.coords.latitude, lng: p.coords.longitude }; $('#say').textContent = ''; draw(); }, function () { $('#say').textContent = 'Not allowed. The list still works.'; }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }); };
  load(); setInterval(function () { if (!D.hidden) load(); }, 30000);
})();

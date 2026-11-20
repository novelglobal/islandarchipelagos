/* the twin: an island's paper as a page. A ghost island (no printer yet) prints here; any island's keeper sees what came out.
   The roll is drawn from the same ESC/POS bytes a printer is sent, dot for dot. A printer beside the screen (USB or serial, in Chrome)
   makes the page itself the island's receiver; a Raspberry Pi added by its pair code takes over as the same island */
(function () {
  'use strict';
  var D = document, $ = function (s) { return D.querySelector(s); }, $$ = function (s) { return [].slice.call(D.querySelectorAll(s)); };
  var store = { get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } } };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  /* a key in the address (#k=...) is kept on this screen and taken out of the address */
  var hk = /(?:^#|&)k=([A-Za-z0-9_-]{16,64})/.exec(location.hash); if (hk) { store.set('da.hm.key', hk[1]); history.replaceState(null, '', location.pathname); }
  var KEY = store.get('da.hm.key', ''), T = null, ISLE = null, ROLL = store.get('da.twin.roll', []) || [], SEEN = {}, RADIO = store.get('da.twin.radio', []) || [], OUT = null, timer = 0;
  var api = function (path, o) { o = o || {}; o.headers = Object.assign({ authorization: 'Bearer ' + KEY, 'content-type': 'application/json' }, o.headers || {});
    return fetch(path, o).then(function (r) { if (r.status === 401) { KEY = ''; store.set('da.hm.key', ''); gate('LOCKED'); throw new Error('key'); } return r.json().then(function (j) { if (!r.ok) { var e = new Error(j.error || r.status); e.status = r.status; throw e; } return j; }); }); };

  /* ───────── ESC/POS to dots: what a TM-T88V would put on paper ───────── */
  var b64 = function (s) { var bin = atob(s), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };
  function run(u, W, g) {
    var y = 0, i = 0, align = 0, bold = false, under = false, rev = false, sw = 1, sh = 1, lsp = 30, line = '', qrData = null, qrMod = 3, lineH = function () { return Math.max(lsp, 24 * sh + 6); };
    var flush = function (nl) { if (line || nl) { if (g && line) { var cw = 12 * sw, w = line.length * cw, x0 = align === 1 ? (W - w) / 2 : align === 2 ? W - w : 0, base = y + 22 * sh;
        g.save(); g.font = (bold ? '700 ' : '600 ') + (22 * sh) + "px 'IBM Plex Mono', ui-monospace, monospace"; var m = g.measureText(line).width || 1;
        if (rev) { g.fillRect(x0, y, w, 24 * sh); g.fillStyle = '#fff'; }
        g.translate(x0, base); g.scale(w / m, 1); g.fillText(line, 0, 0); g.restore(); if (under) g.fillRect(x0, base + 3, w, 2); }
      line = ''; y += lineH(); } };
    while (i < u.length) { var c = u[i];
      if (c === 0x0A) { flush(true); i++; continue; }
      if (c === 0x0D || c === 0x09) { i++; continue; }
      if (c === 0x1B) { var n = u[i + 1];
        if (n === 0x40) { align = 0; bold = under = rev = false; sw = sh = 1; lsp = 30; i += 2; continue; }
        if (n === 0x61) { flush(false); align = u[i + 2] % 48 % 3; i += 3; continue; }
        if (n === 0x45) { bold = !!(u[i + 2] & 1); i += 3; continue; }
        if (n === 0x2D) { under = !!(u[i + 2] & 3); i += 3; continue; }
        if (n === 0x21) { var f = u[i + 2]; bold = !!(f & 8); sh = f & 16 ? 2 : 1; sw = f & 32 ? 2 : 1; under = !!(f & 128); i += 3; continue; }
        if (n === 0x64) { flush(false); y += u[i + 2] * lineH(); i += 3; continue; }
        if (n === 0x4A) { flush(false); y += u[i + 2]; i += 3; continue; }
        if (n === 0x32) { lsp = 30; i += 2; continue; }
        if (n === 0x33) { lsp = u[i + 2]; i += 3; continue; }
        if (n === 0x24 || n === 0x5C) { i += 4; continue; }
        if (n === 0x70) { i += 5; continue; }
        if (n === 0x2A) { var bm = u[i + 2], bn = u[i + 3] | u[i + 4] << 8, bh = bm >= 32 ? 3 : 1; i += 5 + bn * bh; continue; }
        if (n === 0x63) { i += 4; continue; }
        i += 3; continue; }
      if (c === 0x1D) { var k = u[i + 1];
        if (k === 0x76 && u[i + 2] === 0x30) { flush(false); var bw = u[i + 4] | u[i + 5] << 8, h = u[i + 6] | u[i + 7] << 8, p = i + 8;
          if (g) { var x0 = align === 1 ? (W - bw * 8) >> 1 : align === 2 ? W - bw * 8 : 0, im = g.createImageData(bw * 8, h), d = im.data;
            for (var r = 0; r < h; r++) for (var xb = 0; xb < bw; xb++) { var v = u[p + r * bw + xb]; for (var bt = 0; bt < 8; bt++) { var q = ((r * bw * 8) + xb * 8 + bt) * 4, on = v & (0x80 >> bt); if (on) { d[q] = d[q + 1] = 27; d[q + 2] = 25; } else { d[q] = d[q + 1] = 250; d[q + 2] = 244; } d[q + 3] = 255; } }
            g.putImageData(im, Math.max(0, x0), y); }
          y += h; i = p + bw * h; continue; }
        if (k === 0x28) { var fn = u[i + 2], len = u[i + 3] | u[i + 4] << 8, a = i + 5;
          if (fn === 0x6B && u[a] === 0x31) { var op = u[a + 1]; if (op === 0x43) qrMod = u[a + 2] || 3; if (op === 0x50) qrData = String.fromCharCode.apply(null, u.subarray(a + 3, a + len));
            if (op === 0x51 && qrData != null) { flush(false); var Q = null; try { if (window.qrcode) { Q = window.qrcode(0, 'L'); Q.addData(qrData); Q.make(); } } catch (e) { Q = null; }
              var mc = Q ? Q.getModuleCount() : 25, sz = mc * qrMod, qx = align === 1 ? (W - sz) >> 1 : align === 2 ? W - sz : 0;
              if (g) { g.fillStyle = '#1B1B19'; for (var my = 0; my < mc; my++) for (var mx = 0; mx < mc; mx++) if (Q ? Q.isDark(my, mx) : (mx * 7 + my * 3) % 5 < 2) g.fillRect(qx + mx * qrMod, y + my * qrMod, qrMod, qrMod); }
              y += sz + 6; } }
          i = a + len; continue; }
        if (k === 0x21) { var s2 = u[i + 2]; sw = (s2 >> 4) + 1; sh = (s2 & 15) + 1; i += 3; continue; }
        if (k === 0x42) { rev = !!(u[i + 2] & 1); i += 3; continue; }
        if (k === 0x56) { flush(false); y += 24; i += u[i + 2] >= 65 ? 4 : 3; continue; }
        if (k === 0x4C || k === 0x57) { i += 4; continue; }
        if (k === 0x6B) { var km = u[i + 2]; if (km < 32) { var e2 = i + 3; while (e2 < u.length && u[e2]) e2++; i = e2 + 1; } else i += 4 + u[i + 3]; y += 80; continue; }
        if (k === 0x48 || k === 0x66 || k === 0x68 || k === 0x77 || k === 0x61) { i += 3; continue; }
        i += 3; continue; }
      if (c === 0x10) { i += 3; continue; }
      if (c >= 0x20) { line += String.fromCharCode(c > 126 ? 0x2E : c); if (line.length * 12 * sw >= W) flush(true); }
      i++; }
    flush(false); return y; }
  /* bytes to a canvas the width of the paper: 512 dots on 80 mm, 384 on 58 */
  function draw(bytes, paper) { var W = String(paper) === '58' ? 384 : 512, u = typeof bytes === 'string' ? b64(bytes) : bytes, H = Math.min(30000, Math.max(40, run(u, W, null) + 18));
    var c = D.createElement('canvas'); c.width = W; c.height = H; var g = c.getContext('2d'); g.fillStyle = '#FAF9F4'; g.fillRect(0, 0, W, H); g.fillStyle = '#1B1B19'; run(u, W, g); return c; }
  /* a print's small picture, kept by the site once its bytes are wiped */
  function thumb(t) { var m = /^(\d+),(\d+),(.+)$/.exec(t || ''); if (!m) return null; var w = +m[1], h = +m[2], bin = atob(m[3]), rb = Math.ceil(w / 8), c = D.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d'), im = x.createImageData(w, h);
    for (var yy = 0; yy < h; yy++) for (var xx = 0; xx < w; xx++) { var on = bin.charCodeAt(yy * rb + (xx >> 3)) & (0x80 >> (xx & 7)), i = (yy * w + xx) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = on ? 27 : 250; im.data[i + 3] = 255; } x.putImageData(im, 0, 0); return c; }
  /* a few lines set as a printer would, for a test or a line meant for the radio */
  function textSlip(lines) { var o = [0x1B, 0x40, 0x1B, 0x61, 0x01, 0x1B, 0x45, 0x01], put = function (s) { for (var i = 0; i < s.length; i++) o.push(s.charCodeAt(i) & 0x7F); o.push(0x0A); };
    put(lines[0]); o.push(0x1B, 0x45, 0x00); lines.slice(1).forEach(put); o.push(0x1B, 0x61, 0x00, 0x1B, 0x64, 0x04, 0x1D, 0x56, 0x42, 0x00); return new Uint8Array(o); }

  /* ───────── the roll: the newest slip under the printer, fed out at the printer's pace ───────── */
  var lamp = function (on) { var l = $('#lamp'); if (l) l.setAttribute('fill', on ? '#E2552E' : '#4A4843'); };
  function slipEl(cv, tag, feed) { var s = D.createElement('div'); s.className = 'slip'; s.appendChild(cv); if (tag) { var t = D.createElement('span'); t.className = 'tag'; t.textContent = tag; s.appendChild(t); }
    var roll = $('#roll'); roll.insertBefore(s, roll.firstChild); $('#none').hidden = true;
    if (feed && !matchMedia('(prefers-reduced-motion: reduce)').matches) { var h = s.getBoundingClientRect().height, ms = Math.max(500, Math.min(4000, cv.height / 0.6)); s.style.transitionDuration = ms + 'ms'; s.style.height = '0px'; lamp(true);
      requestAnimationFrame(function () { requestAnimationFrame(function () { s.style.height = h + 'px'; }); }); setTimeout(function () { s.style.height = ''; lamp(false); }, ms + 60); }
    while (roll.children.length > 24) roll.removeChild(roll.lastChild); return s; }
  function keep(id, cv, tag) { var u = ''; try { u = cv.toDataURL('image/png'); } catch (e) { u = ''; } if (!u) return; ROLL.unshift({ id: id, u: u, tag: tag || '' }); ROLL = ROLL.slice(0, 12);
    while (!store.set('da.twin.roll', ROLL) && ROLL.length > 1) ROLL.pop(); }
  function shown(id, cv, tag, feed, kept) { if (SEEN[id]) return; SEEN[id] = 1; slipEl(cv, tag, feed); if (kept) keep(id, cv, tag); }
  function radio(line, from) { RADIO.unshift({ t: String(line).slice(0, 240), f: from || '' }); RADIO = RADIO.slice(0, 40); store.set('da.twin.radio', RADIO); radioDraw(); }
  function radioDraw() { $('#rlog').innerHTML = RADIO.length ? RADIO.map(function (r) { return '<li><i>' + (r.f === 'in' ? '←' : '→') + '</i><span>' + esc(r.t) + '</span></li>'; }).join('') : '<li><i>·</i><span>—</span></li>';
    $('#rs').textContent = T && T.mesh ? 'MESH · ' + RADIO.length : RADIO.length ? String(RADIO.length) : 'QUIET'; }
  /* what this screen kept, first, so the roll is there with no signal */
  ROLL.slice().reverse().forEach(function (r) { var im = new Image(); im.alt = ''; im.src = r.u; SEEN[r.id] = 1; slipEl(im, r.tag, false); });

  /* ───────── the printer beside the screen: USB or serial, in Chrome ───────── */
  var hasUsb = !!(navigator.usb && navigator.usb.requestDevice), hasSer = !!(navigator.serial && navigator.serial.requestPort);
  function usbOpen() { return navigator.usb.requestDevice({ filters: [{ vendorId: 0x04B8 }, { classCode: 7 }] }).then(function (d) {
    return d.open().then(function () { return d.configuration ? null : d.selectConfiguration(1); }).then(function () {
      var ifc = d.configuration.interfaces.filter(function (f) { return f.alternates[0].endpoints.some(function (e) { return e.direction === 'out'; }); })[0]; if (!ifc) throw new Error('no way in');
      var ep = ifc.alternates[0].endpoints.filter(function (e) { return e.direction === 'out'; })[0];
      return d.claimInterface(ifc.interfaceNumber).then(function () { OUT = { name: 'USB', write: function (u) { var p = Promise.resolve(); for (var i = 0; i < u.length; i += 16384) (function (a) { p = p.then(function () { return d.transferOut(ep.endpointNumber, u.subarray(a, a + 16384)); }); })(i); return p; } }; }); }); }); }
  function serOpen() { return navigator.serial.requestPort().then(function (port) { return port.open({ baudRate: 38400 }).then(function () { var w = port.writable.getWriter(); OUT = { name: 'SERIAL', write: function (u) { return w.write(u); } }; }); }); }
  function attach(open, b) { $('#bsay').textContent = '· · ·'; open().then(function () { b.classList.add('on'); bodyDraw(); $('#bsay').textContent = OUT.name + ' · READY'; tick(); }, function (e) { $('#bsay').textContent = (e && e.name === 'NotFoundError') ? '—' : '× ' + String(e && e.message || e).slice(0, 60).toUpperCase(); }); }
  $('#usb').hidden = !hasUsb; $('#ser').hidden = !hasSer;
  $('#usb').addEventListener('click', function () { attach(usbOpen, this); });
  $('#ser').addEventListener('click', function () { attach(serOpen, this); });

  /* ───────── the island ───────── */
  function bodyDraw() { if (!T) return; var w = T.paired ? 'PI' : OUT ? OUT.name : 'GHOST', on = T.paired ? T.ready : true;
    $('#bodyw').textContent = w + (T.number ? ' · ' + T.number : '') + ' · ' + T.paper + ' MM'; $('#led').className = 'led' + (on ? ' on' : '');
    $('#body').title = T.paired ? (T.ready ? 'Its Raspberry Pi is listening' : 'Its Raspberry Pi has not asked lately') : OUT ? 'Prints here and on the printer beside this screen' : 'Prints come out on this page';
    $('#bs').textContent = w + (T.paired ? (T.ready ? ' · ON' : ' · QUIET') : ''); $('#pf').hidden = !T.ghost; $('#usb').hidden = !hasUsb || !T.ghost; $('#ser').hidden = !hasSer || !T.ghost; }
  function take(j) { var cv = j.escpos ? draw(j.escpos, T.paper) : j.mesh != null ? draw(textSlip(['DIRECT ACTION', j.code || '', j.mesh || '']), T.paper) : null;
    if (j.mesh) radio(j.mesh, 'out');
    if (cv) shown(j.id, cv, j.code === 'DA-PASS' ? 'PASS' : '', true, true);
    if (OUT && j.escpos) return OUT.write(b64(j.escpos)).then(function () { return api('/api/twin', { method: 'POST', body: JSON.stringify({ job: j.id, ok: true }) }); }, function (e) { return api('/api/twin', { method: 'POST', body: JSON.stringify({ job: j.id, ok: false, error: String(e && e.message || e) }) }); });
    return Promise.resolve(); }
  function tick() { clearTimeout(timer); if (!KEY) return;
    api('/api/twin' + (OUT ? '?usb=1' : '')).then(function (j) { var first = !T; T = j; $('#nm').textContent = j.name; D.title = j.name + ' · Twin'; bodyDraw(); joinsDraw();
      var p = Promise.resolve(); (j.took || []).forEach(function (x) { p = p.then(function () { return take(x); }); });
      /* the rest of the roll, oldest first: a print still waiting is drawn from its bytes, one already out from its small picture */
      (j.roll || []).slice().reverse().forEach(function (x) { if (SEEN[x.id] || (j.took || []).some(function (y) { return y.id === x.id; })) return;
        var cv = x.escpos ? draw(x.escpos, j.paper) : thumb(x.thumb); if (!cv) return; shown(x.id, cv, x.status === 'held' || x.status === 'queued' ? 'WAITING' : '', !first, false); });
      if (!$('#roll').children.length) $('#none').hidden = false;
      if (first && !ISLE) island(); }, function (e) { if (e && e.message === 'key') return; $('#led').className = 'led'; $('#bodyw').textContent = 'OFFLINE'; })
      .then(function () { timer = setTimeout(tick, D.hidden ? 30e3 : T && T.ghost ? 4e3 : 15e3); }); }
  D.addEventListener('visibilitychange', function () { if (!D.hidden && T) tick(); });

  /* ───────── joins: echo, only there, mirror ───────── */
  function island() { return api('/api/island').then(function (p) { ISLE = p; joinsDraw(); }, function () { ISLE = { build: [] }; joinsDraw(); }); }
  function joinsSave(j) { $('#jsay').textContent = '· · ·'; return api('/api/island', { method: 'POST', body: JSON.stringify({ joins: j }) }).then(function (p) { ISLE = p; $('#jsay').textContent = 'SAVED'; tick(); joinsDraw(); }, function (e) { $('#jsay').textContent = '× ' + String(e.message || '').toUpperCase(); }); }
  function joinsDraw() { if (!T) return; var J = (ISLE && ISLE.joins) || null, can = !!J;
    var to = J ? J.to : (T.joins.to || []).map(function (x) { return x.id; }), only = J ? J.only : T.joins.only, mir = J ? J.mirror : T.joins.mirror && T.joins.mirror.id;
    var nameOf = function (id) { var a = (J && J.isles || []).filter(function (x) { return x.id === id; })[0] || (T.joins.to || []).concat(T.joins.mirror ? [T.joins.mirror] : []).filter(function (x) { return x.id === id; })[0]; return a ? a.name : id; };
    $('#js').textContent = to.length || mir ? (to.length ? (only ? 'ONLY → ' : '→ ') + to.map(nameOf).join(' · ').toUpperCase() : '') + (mir ? (to.length ? ' · ' : '') + '⟲ ' + nameOf(mir).toUpperCase() : '') : 'NONE';
    /* the map: here in the middle, the islands it prints at on the right, the island it mirrors on the left */
    var S = [], cy = 75, hx = 160, node = function (x, y, r, label, sub, dash, cross) { S.push('<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="none" stroke="currentColor" stroke-width="1.4"' + (dash ? ' stroke-dasharray="3 3"' : '') + '/>');
      if (cross) S.push('<path d="M' + (x - r * .6) + ' ' + (y - r * .6) + 'L' + (x + r * .6) + ' ' + (y + r * .6) + '" stroke="#E2552E" stroke-width="1.6"/>');
      S.push('<text x="' + x + '" y="' + (y + r + 13) + '" text-anchor="middle">' + esc(String(label).toUpperCase().slice(0, 12)) + '</text>'); if (sub) S.push('<text class="sub" x="' + x + '" y="' + (y + r + 24) + '" text-anchor="middle">' + sub + '</text>'); };
    var arrow = function (x1, y1, x2, y2, hot) { var a = Math.atan2(y2 - y1, x2 - x1), hx2 = x2 - Math.cos(a) * 7, hy2 = y2 - Math.sin(a) * 7; S.push('<path d="M' + x1 + ' ' + y1 + 'L' + hx2 + ' ' + hy2 + '" stroke="' + (hot ? '#E2552E' : 'currentColor') + '" stroke-width="1.4" fill="none"/>');
      S.push('<path d="M' + x2 + ' ' + y2 + 'L' + (x2 - Math.cos(a - .45) * 8) + ' ' + (y2 - Math.sin(a - .45) * 8) + 'L' + (x2 - Math.cos(a + .45) * 8) + ' ' + (y2 - Math.sin(a + .45) * 8) + 'z" fill="' + (hot ? '#E2552E' : 'currentColor') + '"/>'); };
    to.forEach(function (id, i) { var y = to.length === 1 ? cy : 26 + i * (98 / Math.max(1, to.length - 1)); arrow(hx + 22, cy, 250, y, only); node(266, y, 14, nameOf(id), only ? 'ONLY' : 'ECHO'); });
    if (mir) { arrow(68, cy, hx - 24, cy, false); node(54, cy, 14, nameOf(mir), 'CARDS · ART', true); }
    node(hx, cy, 20, T.name, T.ghost ? 'GHOST' : 'HERE', !!T.ghost, only && to.length);
    if (!to.length && !mir) S.push('<text class="sub" x="160" y="24" text-anchor="middle">ON ITS OWN</text>');
    var m = $('#jmap'); m.style.color = 'var(--ink)'; m.innerHTML = S.join('');
    /* the choices: only the islands that take prints (W.I.S.H. on) or share cards and art; none at all outside this island's build */
    var L = J ? J.isles || [] : []; ['#jto', '#jmode', '#jmir'].forEach(function (s) { $(s).previousElementSibling.hidden = $(s).hidden = !can; });
    $('#jto').innerHTML = L.filter(function (x) { return x.takes || to.indexOf(x.id) >= 0; }).map(function (x) { var on = to.indexOf(x.id) >= 0; return '<button type="button" class="' + (x.ghost ? 'gh' : '') + '" data-to="' + esc(x.id) + '" aria-pressed="' + on + '"' + (!on && to.length >= 3 ? ' disabled' : '') + ' title="' + (x.ghost ? 'A ghost island' : 'Island ' + (x.number || '')) + '">' + esc(String(x.name).toUpperCase()) + '</button>'; }).join('') || '<span class="say">—</span>';
    $$('#jmode [data-only]').forEach(function (b) { b.setAttribute('aria-pressed', String((b.dataset.only === '1') === !!only)); b.disabled = !to.length; });
    $('#jmir').innerHTML = '<button type="button" data-mir="" aria-pressed="' + !mir + '">NONE</button>' + L.filter(function (x) { return x.cards || x.art || x.id === mir; }).map(function (x) { return '<button type="button" class="' + (x.ghost ? 'gh' : '') + '" data-mir="' + esc(x.id) + '" aria-pressed="' + (mir === x.id) + '" title="' + [x.art ? 'its pictures' : '', x.cards ? 'its picks' : ''].filter(Boolean).join(' and ') + '">' + esc(String(x.name).toUpperCase()) + '</button>'; }).join('');
    $('#jd').hidden = !can && !to.length && !mir; }
  $('#jd').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b || b.disabled || !ISLE || !ISLE.joins) return; var J = ISLE.joins, to = J.to.slice(), only = J.only, mir = J.mirror;
    if (b.dataset.to != null) { var i = to.indexOf(b.dataset.to); if (i >= 0) to.splice(i, 1); else to.push(b.dataset.to); }
    else if (b.dataset.only != null) only = b.dataset.only === '1';
    else if (b.dataset.mir != null) mir = b.dataset.mir || null; else return;
    joinsSave({ to: to, only: only && to.length > 0, mirror: mir }); });

  /* ───────── a printer added: the pair code a Pi prints ───────── */
  $('#pf').addEventListener('submit', function (e) { e.preventDefault(); var c = $('#pc').value.toUpperCase().replace(/[^A-Z0-9]/g, ''); if (c.length !== 8) { $('#bsay').textContent = '× 8 LETTERS'; return; } $('#bsay').textContent = '· · ·';
    api('/api/twin', { method: 'POST', body: JSON.stringify({ pair: c }) }).then(function (j) { $('#bsay').textContent = j.waiting ? 'WAIT LIST' : 'PAIRED · THE PI TAKES OVER'; $('#pc').value = ''; setTimeout(tick, 6e3); }, function (er) { $('#bsay').textContent = er.status === 404 ? '× NO SUCH CODE' : er.status === 409 ? '× TAKEN' : '× ' + String(er.message || '').toUpperCase(); }); });
  $('#test').addEventListener('click', function () { var id = 't' + Date.now(); shown(id, draw(textSlip(['DIRECT ACTION', T ? String(T.name).toUpperCase() : 'TWIN', 'TEST', T && T.number ? 'ISLAND ' + T.number : 'GHOST']), T ? T.paper : '80'), 'TEST', true, false);
    if (OUT) OUT.write(textSlip(['DIRECT ACTION', 'TEST'])).catch(function () { $('#bsay').textContent = '× ' + OUT.name; }); });
  $('#kcopy').addEventListener('click', function () { var b = this; if (navigator.clipboard) navigator.clipboard.writeText(KEY).then(function () { b.textContent = 'COPIED'; }); });
  $('#kout').addEventListener('click', function () { if (!confirm('Forget this island’s key on this screen?')) return; store.set('da.hm.key', ''); store.set('da.twin.roll', []); store.set('da.twin.radio', []); location.reload(); });

  /* ───────── no key here: start a ghost, or open an island by its key ───────── */
  function gate(say) { $('#twin').hidden = true; $('#gate').hidden = false; if (say) $('#gsay').textContent = say; clearTimeout(timer); }
  $('#gf').addEventListener('submit', function (e) { e.preventDefault(); var n = $('#gn').value.trim(); if (!n) { $('#gn').focus(); return; } $('#gsay').textContent = '· · ·';
    fetch('/api/ghost', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: n }) }).then(function (r) { return r.json().then(function (j) { return { s: r.status, j: j }; }); }).then(function (x) {
      if (x.s === 201 && x.j.key) { KEY = x.j.key; store.set('da.hm.key', KEY); open(); } else $('#gsay').textContent = x.s === 202 ? 'WAIT LIST' : x.s === 429 ? 'LATER' : x.s === 403 ? 'CLOSED' : '×'; }, function () { $('#gsay').textContent = 'OFFLINE'; }); });
  $('#kf').addEventListener('submit', function (e) { e.preventDefault(); var k = $('#kk').value.trim(); if (!/^[A-Za-z0-9_-]{16,64}$/.test(k)) return; KEY = k; store.set('da.hm.key', k); open(); });
  function open() { $('#gate').hidden = true; $('#twin').hidden = false; radioDraw(); tick(); }
  if (KEY) open(); else gate('');
})();

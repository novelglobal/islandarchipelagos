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
    var y = 0, i = 0, align = 0, bold = false, under = false, rev = false, sw = 1, sh = 1, lsp = 30, line = '', qrData = null, qrMod = 3, tone = [], lineH = function () { return Math.max(lsp, 24 * sh + 6); };
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
          /* the sixteen greys: four one-bit layers stored (colours 1 to 4, read here as the low bit first), then printed as one */
          if (fn === 0x4C && u[a] === 0x30 && u[a + 1] === 0x70 && len > 10) { var tc = u[a + 5] - 0x31; if (tc >= 0 && tc < 4) tone[tc] = { w: u[a + 6] | u[a + 7] << 8, h: u[a + 8] | u[a + 9] << 8, p: a + 10 }; }
          if (fn === 0x4C && u[a] === 0x30 && u[a + 1] === 0x32 && tone[0]) { flush(false); var t0 = tone[0], tb = (t0.w + 7) >> 3;
            if (g) { var tim = g.createImageData(t0.w, t0.h), td = tim.data; for (var ty = 0; ty < t0.h; ty++) for (var tx = 0; tx < t0.w; tx++) { var lv = 0, off = ty * tb + (tx >> 3), tm = 0x80 >> (tx & 7), tq = (ty * t0.w + tx) * 4;
                for (var tl = 0; tl < 4; tl++) if (tone[tl] && u[tone[tl].p + off] & tm) lv |= 1 << tl; td[tq] = td[tq + 1] = Math.round(250 - lv * 223 / 15); td[tq + 2] = Math.round(244 - lv * 219 / 15); td[tq + 3] = 255; }
              g.putImageData(tim, 0, y); }
            y += t0.h; tone = []; }
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
    api('/api/twin' + (OUT ? '?usb=1' : '')).then(function (j) { var first = !T; T = j; $('#nm').textContent = j.name; D.title = j.name + ' · Twin'; bodyDraw(); joinsDraw(); benchLoad(j);
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

  /* ───────── the bench: a ghost's parts (spec/parts, as parts.js), drawn by hand; tap a port, then another, for a cable. A wrong
     join stays, dull and dashed, and says why. Power as one word: ENOUGH or SHORT, the sums in its hover ───────── */
  var PARTS = window.PARTS || [], PART = {}; PARTS.forEach(function (p) { PART[p.id] = p; });
  var BN = null, SEL = null, ADDK = '', bnTimer = 0, NS = 'http://www.w3.org/2000/svg';
  var GROUPS = [['PI', ['pi', 'sd']], ['PRINTER', ['printer']], ['POWER', ['power', 'solar', 'battery', 'charger', 'converter']], ['MORE', ['radio', 'screen']]];
  var COL = { power: 0, solar: 0, battery: 0, charger: 0, converter: 0, pi: 1, sd: 1, printer: 2, radio: 2, screen: 2 };
  var PLUG = { 'usb-a': 'USB-A', 'usb-b': 'USB-B', 'micro-usb': 'micro-USB', 'micro-sd': 'microSD', dsi: 'DSI ribbon', 'power-din': 'round power plug', barrel: 'barrel', mc4: 'MC4', screw: 'screw terminal' };
  var STRAIGHT = ['micro-sd', 'dsi', 'power-din'], GIVE = { out: 1, host: 1, store: 1 }, TAKE = { 'in': 1, device: 1, store: 1 };
  var ROLE = { host: 'A host', device: 'A device', 'in': 'A power input', out: 'A power output', slot: 'A card slot', card: 'A card', store: 'A battery terminal' };
  var OK = { 'host device': 1, 'out in': 1, 'host in': 1, 'slot card': 1, 'store store': 1 };
  var TWO = { host: 'Two hosts: one end must be a device', device: 'Two devices: one end must be a Pi', 'in': 'Two inputs: one end must give power', out: 'Two outputs: one end must take power', slot: 'Two slots: one end must be a card', card: 'Two cards: one end must be a slot' };
  function portOf(end) { var a = String(end).split('.'), x = (BN.p.filter(function (q) { return q[0] === a[0]; })[0] || []), p = PART[x[1]]; return p ? { iid: a[0], part: p, port: (p.ports || []).filter(function (o) { return o.id === a[1]; })[0] } : null; }
  var vs = function (v) { return Array.isArray(v) ? v[0] + '–' + v[1] : String(v); }, inside = function (v, r) { var a = Array.isArray(v) ? v[0] : v; return Array.isArray(r) ? a >= r[0] - 0.01 && a <= r[1] + 0.01 : Math.abs(a - r) < 0.5; };
  /* a join, checked: the two roles fit, a cable has the two plugs (or one plugs straight in), and what one gives the other takes */
  function joinOf(e1, e2) { var A = portOf(e1), B = portOf(e2); if (!A || !B || !A.port || !B.port) return { ok: false, why: 'That part is gone' };
    var a = A.port, b = B.port, ab = a.role + ' ' + b.role, ba = b.role + ' ' + a.role;
    if (!OK[ab] && !OK[ba]) return { ok: false, why: a.role === b.role ? TWO[a.role] : (ROLE[a.role] + ' and ' + ROLE[b.role].toLowerCase() + ' do not join') };
    var g = OK[ab] ? a : b, t = g === a ? b : a, cable = null;
    if (!(a.plug === b.plug && STRAIGHT.indexOf(a.plug) >= 0)) { cable = PARTS.filter(function (p) { return p.kind === 'cable' && p.ends && ((p.ends[0] === a.plug && p.ends[1] === b.plug) || (p.ends[1] === a.plug && p.ends[0] === b.plug)); })[0];
      if (!cable) return { ok: false, why: 'No cable from ' + PLUG[a.plug] + ' to ' + PLUG[b.plug] }; }
    if (g.volts != null && t.volts != null && !inside(g.volts, t.volts)) return { ok: false, why: vs(g.volts) + ' V into ' + vs(t.volts) + ' V' };
    return { ok: true, cable: cable, give: g === a ? A : B, take: g === a ? B : A }; }
  /* the power: from the wall, the sun or a battery, along good cables, through each part that passes it on */
  function power() { var on = {}, from = {}; BN.p.forEach(function (x) { var p = PART[x[1]]; if (p && p.source) { on[x[0]] = 1; from[x[0]] = {}; from[x[0]][p.source] = 1; } });
    var J = BN.j.map(function (j) { return joinOf(j[0], j[1]); });
    for (var k = 0; k < 12; k++) { var more = false; J.forEach(function (r) { if (!r.ok || !on[r.give.iid] || !GIVE[r.give.port.role] || !TAKE[r.take.port.role]) return; var d = r.take, p = d.part;
      if (p.source || (d.port.role === 'device' && d.port.volts == null)) return; if (!on[d.iid]) { on[d.iid] = 1; from[d.iid] = {}; more = true; }
      Object.keys(from[r.give.iid]).forEach(function (s) { if (!from[d.iid][s]) { from[d.iid][s] = 1; more = true; } }); }); if (!more) break; }
    var need = 0, cold = [], sun = 0, sunH = 0, kept = 0, used = 0, wall = false;
    BN.p.forEach(function (x) { var p = PART[x[1]]; if (!p || !p.watts || p.source) return; used++; if (!on[x[0]]) { cold.push(p.name); return; } if (from[x[0]].wall) wall = true; else need += p.watts.avg; });
    /* the sun and the battery count only into a charger */
    J.forEach(function (r) { if (!r.ok || r.take.part.kind !== 'charger') return; var p = r.give.part;
      if (p.make && r.take.port.role === 'in') { sun += p.make.watts * p.make.sun * 0.75; sunH = Math.max(sunH, p.make.sun); } if (p.store) kept += p.store.wh * (p.store.use || 1); });
    var day = need * 24, r0 = function (v) { return Math.round(v); }, say = 'Uses ' + r0(day) + ' Wh a day · the sun gives ' + r0(sun) + ' Wh (' + sunH + ' h) · the battery holds ' + r0(kept) + ' Wh';
    var res = !used ? { w: '—', t: 'Nothing here draws power yet' } : cold.length ? { w: 'SHORT', t: cold.join(', ') + (cold.length > 1 ? ' have' : ' has') + ' no power in' }
      : !need ? { w: 'ENOUGH', t: wall ? 'From the wall' : '' } : sun < day ? { w: 'SHORT', t: sun ? say : 'Uses ' + r0(day) + ' Wh a day, and no sun comes in' }
      : kept < need * (24 - sunH) ? { w: 'SHORT', t: kept ? say + ': not enough for a night' : 'Nothing kept for the night: a battery on the charger' } : { w: 'ENOUGH', t: say + ', ' + r0(kept / need) + ' h with no sun' + (wall ? ' · the rest from the wall' : '') };
    res.on = on; res.J = J; return res; }
  function el(n, a, kids) { var e = D.createElementNS(NS, n); Object.keys(a || {}).forEach(function (k) { e.setAttribute(k, a[k]); }); (kids || []).forEach(function (c) { if (c) e.appendChild(c); }); return e; }
  function tt(s) { var t = el('title'); t.textContent = s; return t; }
  function benchDraw() { if (!BN) return; var svg = $('#bnv'), rc = window.rough ? rough.svg(svg) : null, P = power(), cols = [[], [], []], at = {}, cw = 100, ch = 122;
    BN.p.forEach(function (x) { var p = PART[x[1]]; if (p) cols[COL[p.kind] == null ? 2 : COL[p.kind]].push(x); });
    var Hh = Math.max(140, Math.max(cols[0].length, cols[1].length, cols[2].length) * ch + 30); svg.setAttribute('viewBox', '0 0 320 ' + Hh); svg.innerHTML = ''; var cg = el('g'); svg.appendChild(cg);
    var used = {}; BN.j.forEach(function (j) { used[j[0]] = used[j[1]] = 1; });
    cols.forEach(function (c, ci) { c.forEach(function (x, ri) { var p = PART[x[1]], X = ci * 110, Y = ri * ch + 4, g = el('g', { 'class': 'pt' + (p.watts && !p.source && !P.on[x[0]] ? ' off' : '') }, [tt(p.name + (p.about ? ' · ' + p.about : '') + (p.watts && !p.source && !P.on[x[0]] ? ' · No power in' : '')), el('rect', { 'class': 'bk', x: X, y: Y, width: cw, height: 89, rx: 6 })]);
      var sk = el('g', { transform: 'translate(' + X + ' ' + Y + ') scale(' + (cw / 120) + ')' }); (p.draw || []).forEach(function (st, i) { var n = rc ? rc.path(st[0], { roughness: .9, bowing: .7, strokeWidth: 1.3, seed: 7 + i + x[1].length, stroke: 'currentColor' }) : el('path', { d: st[0], stroke: 'currentColor' }); if (st[1]) n.setAttribute('class', 'ac'); sk.appendChild(n); }); g.appendChild(sk);
      var nm = el('text', { x: X + cw / 2, y: Y + 84, 'text-anchor': 'middle' }); nm.textContent = String(p.name).toUpperCase(); g.appendChild(nm);
      var fv = p.kind === 'sd' && flashedOf(x[0]); if (fv) { var vt = el('text', { 'class': 'fv', x: X + cw - 6, y: Y + 14, 'text-anchor': 'end' }, [tt('Island OS ' + fv[1] + ' · ' + fv[2])]); vt.appendChild(D.createTextNode(fv[1])); g.appendChild(vt); }
      var ps = p.ports || []; ps.forEach(function (o, k) { var px = X + cw * (k + 1) / (ps.length + 1), py = Y + 97, id = x[0] + '.' + o.id; at[id] = [px, py];
        var fit = SEL && SEL !== id && SEL.split('.')[0] !== x[0] && joinOf(SEL, id).ok;
        var po = el('g', { 'class': 'po' + (SEL === id ? ' sel' : used[id] ? ' used' : '') + (fit ? ' fit' : ''), 'data-port': id, tabindex: '0', role: 'button', 'aria-label': p.name + ' ' + o.label }, [tt(o.label + ' · ' + PLUG[o.plug] + ' · ' + o.role.toUpperCase() + (o.volts != null ? ' · ' + vs(o.volts) + ' V' : '')), el('circle', { 'class': 'ph', cx: px, cy: py + 4, r: 12 }), el('circle', { cx: px, cy: py, r: 5.5 })]);
        var lb = el('text', { 'class': 'pl', x: px, y: py + 15, 'text-anchor': 'middle' }); lb.textContent = o.label; po.appendChild(lb); g.appendChild(po); }); svg.appendChild(g); }); });
    /* the cables behind the parts, hanging a little, as cables do */
    BN.j.forEach(function (j, i) { var a = at[j[0]], b = at[j[1]], r = P.J[i]; if (!a || !b) return; var sag = 26 + Math.abs(a[0] - b[0]) * .15, d = 'M' + a[0] + ' ' + a[1] + ' C' + a[0] + ' ' + (a[1] + sag) + ' ' + b[0] + ' ' + (b[1] + sag) + ' ' + b[0] + ' ' + b[1];
      var label = r.ok ? (r.cable ? r.cable.name : 'Straight in') : r.why; cg.appendChild(el('path', { d: d, 'class': 'cb' + (r.ok ? '' : ' bad') }));
      cg.appendChild(el('path', { d: d, 'class': 'hit', 'data-cut': String(i), role: 'button', 'aria-label': label + ': tap to take it out' }, [tt(label + ' · tap to take it out')])); });
    var pw = $('#bnp'); pw.textContent = P.w; pw.title = P.t; pw.className = 'pw' + (P.w === 'SHORT' ? ' short' : '') + (P.t ? ' more' : ''); if ($('#bnw').dataset.of === 'bnp') $('#bnw').textContent = P.t;
    var lack = P.w === 'SHORT' && /no power in|no sun|battery|night/.test(P.t) ? 'POWER' : '';
    $('#bns').textContent = BN.p.length ? BN.p.length + ' PARTS · ' + P.w + ((BN.f || []).length ? ' · FLASHED' : '') : 'EMPTY'; flDraw();
    $('#bnk').innerHTML = GROUPS.map(function (g) { return '<button type="button" data-kind="' + g[0] + '" aria-pressed="' + (ADDK === g[0]) + '"' + (lack === g[0] && ADDK !== g[0] ? ' class="hint" title="What it lacks is here"' : '') + '>' + g[0] + '</button>'; }).join('');
    var G = GROUPS.filter(function (g) { return g[0] === ADDK; })[0], has = function (id) { return BN.p.some(function (x) { return x[1] === id; }); };
    $('#bnl').innerHTML = G ? PARTS.filter(function (p) { return G[1].indexOf(p.kind) >= 0; }).map(function (p) { return '<button type="button" data-part="' + esc(p.id) + '" aria-pressed="' + has(p.id) + '" title="' + esc(p.about || p.name) + '"' + (!has(p.id) && BN.p.length >= 12 ? ' disabled' : '') + '>' + esc(String(p.name).toUpperCase()) + '</button>'; }).join('') : ''; }
  function why(id) { var w = $('#bnw'), e = $('#' + id); if (w.dataset.of === id || !e.title) { w.textContent = ''; w.dataset.of = ''; return; } w.textContent = e.title; w.dataset.of = id; }
  $('#bnp').addEventListener('click', function () { why('bnp'); }); $('#bnsay').addEventListener('click', function () { why('bnsay'); });
  function benchSave(say) { $('#bnsay').textContent = say || ''; $('#bnsay').classList.toggle('more', !!$('#bnsay').title); if ($('#bnw').dataset.of === 'bnsay') { $('#bnw').textContent = ''; $('#bnw').dataset.of = ''; } clearTimeout(bnTimer); bnTimer = setTimeout(function () { api('/api/twin', { method: 'POST', body: JSON.stringify({ bench: BN }) }).then(function () { if (!SEL) $('#bnsay').textContent = say ? say : 'SAVED'; }, function (e) { $('#bnsay').textContent = '× ' + String(e.message || '').toUpperCase(); }); }, 500); }
  function partAdd(id) { var n = 1; BN.p.forEach(function (x) { n = Math.max(n, +x[0].slice(1) + 1); }); BN.p.push(['p' + n, id]); }
  /* the first time a ghost opens, its bench starts with the parts picked on ISLAND ARCHIPELAGOS (and an SD for its Pi) */
  function benchLoad(j) { var gb = $('#bnd'); gb.hidden = !j.ghost; if (!j.ghost || BN) return; BN = j.bench && Array.isArray(j.bench.p) ? { p: j.bench.p.slice(), j: (j.bench.j || []).slice(), f: (j.bench.f || []).slice() } : { p: [], j: [], f: [] };
    var tray = store.get('da.ghost.build', null), done = store.get('da.ghost.seeded', '');
    if (!BN.p.length && tray && done !== j.id) { var nameTo = function (n) { if (PART[n]) return n; var m = PARTS.filter(function (p) { return p.kind !== 'cable' && String(p.name).toUpperCase() === String(n).toUpperCase(); })[0]; return m ? m.id : /^(TM-P20|MTP-2|PT-210)$/.test(n) ? 'printer-58' : n === 'SRP-350' ? 'tm-t20' : null; };
      [tray.pi, tray.printers].concat(Array.isArray(tray.power) ? tray.power : []).forEach(function (n) { var id = n && nameTo(n); if (id && !BN.p.some(function (x) { return x[1] === id; })) partAdd(id); });
      if (BN.p.some(function (x) { return PART[x[1]] && PART[x[1]].kind === 'pi'; })) partAdd('sd-32');
      store.set('da.ghost.seeded', j.id); if (BN.p.length) benchSave(); }
    benchDraw(); if (location.hash === '#bench') { gb.open = true; setTimeout(function () { gb.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 300); } }
  $('#bnd').addEventListener('click', function (e) { if (!BN) return; var t = e.target.closest('[data-port],[data-cut],[data-kind],[data-part]'); if (!t) return;
    if (t.dataset.kind) { ADDK = ADDK === t.dataset.kind ? '' : t.dataset.kind; benchDraw(); return; }
    if (t.dataset.part) { var id = t.dataset.part, x = BN.p.filter(function (q) { return q[1] === id; })[0];
      if (x) { BN.p = BN.p.filter(function (q) { return q !== x; }); BN.j = BN.j.filter(function (j) { return j[0].split('.')[0] !== x[0] && j[1].split('.')[0] !== x[0]; }); BN.f = (BN.f || []).filter(function (q) { return q[0] !== x[0]; }); if (SEL && SEL.split('.')[0] === x[0]) SEL = null; }
      else if (BN.p.length < 12) partAdd(id); benchDraw(); benchSave(); return; }
    if (t.dataset.cut) { BN.j.splice(+t.dataset.cut, 1); benchDraw(); benchSave(); return; }
    var pid = t.dataset.port;
    if (!SEL || SEL.split('.')[0] === pid.split('.')[0]) { SEL = SEL === pid ? null : pid; benchDraw(); $('#bnsay').title = ''; $('#bnsay').classList.remove('more'); $('#bnsay').textContent = SEL ? 'TAP ANOTHER PORT' : ''; return; }
    var a = SEL, there = BN.j.filter(function (j) { return (j[0] === a && j[1] === pid) || (j[1] === a && j[0] === pid); })[0]; SEL = null;
    if (there) { BN.j = BN.j.filter(function (j) { return j !== there; }); benchDraw(); benchSave(); return; }
    if (BN.j.length >= 24) { benchDraw(); $('#bnsay').textContent = 'FULL'; return; }
    BN.j.push([a, pid]); var r = joinOf(a, pid); benchDraw(); $('#bnsay').title = r.ok ? '' : r.why; benchSave(r.ok ? (r.cable ? String(r.cable.name).toUpperCase() : 'IN') : 'WRONG'); });
  $('#bnd').addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('[data-port],[data-cut]')) { e.preventDefault(); e.target.closest('[data-port],[data-cut]').dispatchEvent(new MouseEvent('click', { bubbles: true })); } });

  /* ───────── FLASH: an SD on the bench written with Island OS as the Raspberry Pi Imager writes it. DEVICE, OS, STORAGE, SETTINGS,
     WRITE (then VERIFY, then EJECT). The OS is the latest release as the real Imager lists it (/api/os); the write takes the time a
     real one would at 20 MB/s, and its check 40 MB/s, both twenty times faster, with a skip. The Wi-Fi stays on this screen ───────── */
  var FL = { step: 0, dev: '', sd: '', name: '', ssid: '', pw: '', cc: 'AU', run: null, done: '' }, OS, STEPS = ['DEVICE', 'OS', 'STORAGE', 'SETTINGS', 'WRITE'];
  var gb = function (n) { return n >= 1e9 ? (n / 1e9).toFixed(1) + ' GB' : Math.round(n / 1e6) + ' MB'; };
  function osGet() { if (OS !== undefined) return; OS = null; var kept = store.get('da.os', null);
    fetch('/api/os').then(function (r) { return r.json(); }).then(function (j) { OS = j.os || (kept ? Object.assign({}, kept, { kept: true }) : false); if (j.os) store.set('da.os', j.os); flDraw(); }, function () { OS = kept ? Object.assign({}, kept, { kept: true }) : false; flDraw(); }); }
  function flashedOf(iid) { return (BN.f || []).filter(function (x) { return x[0] === iid; })[0]; }
  function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32) || 'island'; }
  function flDraw() { var host = $('#fl'); if (!host || !BN) return; var of = function (k) { return BN.p.filter(function (x) { return PART[x[1]] && PART[x[1]].kind === k; }); }, pis = of('pi'), sds = of('sd');
    if (FL.dev && !pis.some(function (x) { return x[0] === FL.dev; })) FL.dev = ''; if (FL.sd && !sds.some(function (x) { return x[0] === FL.sd; })) FL.sd = '';
    if (pis.length === 1 && !FL.dev) FL.dev = pis[0][0]; if (sds.length === 1 && !FL.sd) FL.sd = sds[0][0];
    var can = [true, !!FL.dev, !!FL.dev && !!OS, !!FL.dev && !!OS && !!FL.sd, !!FL.dev && !!OS && !!FL.sd && !!FL.name], nm = function (iid) { var x = BN.p.filter(function (q) { return q[0] === iid; })[0]; return x ? String(PART[x[1]].name).toUpperCase() : '—'; };
    var said = [nm(FL.dev), OS ? 'ISLAND OS ' + OS.version : OS === false ? 'OFFLINE' : '· · ·', nm(FL.sd), FL.name || '—', FL.done ? 'FLASHED' : ''];
    $('#fls').innerHTML = STEPS.map(function (s, i) { return '<button type="button" data-step="' + i + '" aria-pressed="' + (FL.step === i) + '"' + (can[i] && !FL.run ? '' : ' disabled') + ' title="' + esc(said[i]) + '">' + s + '</button>'; }).join('');
    var P = '', sdP = function (x) { var p = PART[x[1]], g = +(/(\d+)/.exec(p.id) || [])[1] || 0, small = OS && g * 1e9 * 0.93 < OS.size, f = flashedOf(x[0]); return '<button type="button" data-sd="' + x[0] + '" aria-pressed="' + (FL.sd === x[0]) + '"' + (small ? ' disabled title="Too small for ' + gb(OS.size) + '"' : ' title="' + (f ? 'Has Island OS ' + esc(f[1]) + ': writing again erases it' : 'Empty') + '"') + '>' + esc(String(p.name).toUpperCase()) + (f ? ' · ' + esc(f[1]) : '') + '</button>'; };
    if (!pis.length || !sds.length) P = '<p class="say">NEEDS ' + (!pis.length ? 'A PI' : '') + (!pis.length && !sds.length ? ' + ' : '') + (!sds.length ? 'AN SD' : '') + '</p>';
    else if (FL.step === 0) P = '<div class="opts">' + pis.map(function (x) { return '<button type="button" data-dev="' + x[0] + '" aria-pressed="' + (FL.dev === x[0]) + '" title="' + esc(PART[x[1]].about || '') + '">' + esc(String(PART[x[1]].name).toUpperCase()) + '</button>'; }).join('') + '</div>';
    else if (FL.step === 1) P = OS ? '<div class="opts"><button type="button" data-os="1" aria-pressed="' + (FL.step > 1 || !!FL.sd) + '" title="' + gb(OS.download) + ' to download, ' + gb(OS.size) + ' written · for ' + esc((OS.devices || []).join(', ')) + (OS.kept ? ' · offline: the last one seen' : '') + '">ISLAND OS ' + esc(OS.version) + '</button></div>' : '<p class="say">' + (OS === false ? 'OFFLINE' : '· · ·') + '</p>';
    else if (FL.step === 2) P = '<div class="opts">' + sds.map(sdP).join('') + '</div>';
    else if (FL.step === 3) P = '<form class="flf" id="flf"><label><span class="lbl">NAME</span><input name="name" maxlength="32" autocomplete="off" spellcheck="false" value="' + esc(FL.name || slug(T && T.name)) + '" title="Its name on the network"></label>' +
      '<label><span class="lbl" title="The network it joins on first start. Kept on this screen only, never sent">WI-FI</span><input name="ssid" maxlength="32" autocomplete="off" spellcheck="false" value="' + esc(FL.ssid) + '"></label>' +
      '<label><span class="lbl" title="Never sent or kept: a ghost joins no network">PASSWORD</span><input name="pw" type="password" maxlength="63" autocomplete="off" value="' + esc(FL.pw) + '"></label>' +
      '<label><span class="lbl">COUNTRY</span><input name="cc" maxlength="2" autocomplete="off" autocapitalize="characters" value="' + esc(FL.cc) + '"></label><button class="on">NEXT</button></form>';
    else if (FL.step === 4) P = FL.run ? '<div class="bar"><i style="width:' + Math.round(FL.run.pc) + '%"></i></div><div class="row"><p class="say" id="flsay">' + FL.run.say + '</p><button type="button" data-skip="1" title="Straight to the end">SKIP</button></div>'
      : FL.done ? '<div class="row"><p class="say">FLASHED · ' + esc(FL.done) + '</p><button type="button" data-eject="1" title="Take the SD out: it goes in the Pi">EJECT</button></div>'
      : '<div class="row"><button type="button" class="on" data-write="1" title="Everything on ' + esc(nm(FL.sd)) + ' is erased">WRITE</button><p class="say">' + esc(nm(FL.sd)) + ' · ' + gb(OS ? OS.size : 0) + '</p></div>';
    $('#flp').innerHTML = P; }
  /* the write, as long as a real one at 20 MB/s, its check at 40 MB/s, each twenty times faster */
  function flWrite() { var size = OS.size || 3e9, w = size / 20e6 / 20 * 1000, v = size / 40e6 / 20 * 1000, t0 = performance.now(), sd = FL.sd, ver = OS.version, name = FL.name;
    FL.run = { pc: 0, say: 'WRITING 0%' }; flDraw();
    var tick = function () { if (!FL.run) return; var t = performance.now() - t0 + FL.run.skip;
      if (t < w) { FL.run.pc = t / w * 100; FL.run.say = 'WRITING ' + Math.floor(FL.run.pc) + '% · ' + gb(size * t / w) + ' · 20 MB/S'; }
      else if (t < w + v) { FL.run.pc = (t - w) / v * 100; FL.run.say = 'VERIFYING ' + Math.floor(FL.run.pc) + '%'; }
      else { FL.run = null; FL.done = ver; BN.f = (BN.f || []).filter(function (x) { return x[0] !== sd; }).concat([[sd, ver, name]]); benchDraw(); benchSave('FLASHED'); flSlip(sd, ver); return; }
      var b = $('#flp .bar i'), s = $('#flsay'); if (b && s) { b.style.width = FL.run.pc.toFixed(1) + '%'; s.textContent = FL.run.say; } else flDraw(); setTimeout(tick, 100); };
    FL.run.skip = 0; FL.run.end = w + v; tick(); }
  /* the settings, printed on the twin as the island will print them on its first start */
  function flSlip(sd, ver) { var x = BN.p.filter(function (q) { return q[0] === sd; })[0], d = BN.p.filter(function (q) { return q[0] === FL.dev; })[0];
    var L = ['ISLAND OS ' + ver, 'NAME ' + FL.name, 'WI-FI ' + (FL.ssid || '-'), 'PASSWORD ' + (FL.pw ? '********' : '-'), 'COUNTRY ' + FL.cc, (x ? PART[x[1]].name : 'SD') + ' VERIFIED', 'FOR ' + (d ? PART[d[1]].name : 'PI'), 'SHA ' + (OS.sha || '')];
    var u = textSlip(L.map(function (s) { return String(s).replace(/[^\x20-\x7E]/g, ''); })); shown('f' + Date.now(), draw(u, T ? T.paper : '80'), 'FLASH', true, true); if (OUT) OUT.write(u).catch(function () { /* the screen keeps it */ }); }
  $('#fl').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b || b.disabled || !BN) return; var d = b.dataset;
    if (d.step != null) { FL.step = +d.step; if (FL.step === 1) osGet(); }
    else if (d.dev) { FL.dev = d.dev; FL.step = 1; osGet(); }
    else if (d.os) FL.step = 2;
    else if (d.sd) { FL.sd = d.sd; FL.step = 3; }
    else if (d.write) { if (!confirm('Everything on the SD is erased. Write Island OS ' + OS.version + '?')) return; FL.done = ''; flWrite(); return; }
    else if (d.skip) { if (FL.run) FL.run.skip = FL.run.end; return; }
    else if (d.eject) { FL.done = ''; FL.step = 0; $('#bnsay').textContent = 'EJECTED'; }
    else return; flDraw(); });
  $('#fl').addEventListener('submit', function (e) { e.preventDefault(); var f = e.target; var v = function (n) { return String(f.elements.namedItem(n).value || ''); }; FL.name = slug(v('name')); FL.ssid = v('ssid').slice(0, 32); FL.pw = v('pw'); FL.cc = (v('cc') || 'AU').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || 'AU'; FL.step = 4; flDraw(); });

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

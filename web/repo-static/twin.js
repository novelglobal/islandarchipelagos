/* the twin: an island's paper as a page. A ghost island (no printer yet) prints here; any island's keeper sees what came out.
   The roll is drawn from the same ESC/POS bytes a printer is sent, dot for dot. A printer beside the screen (USB or serial, in Chrome)
   makes the page itself the island's receiver; a Raspberry Pi added by its pair code takes over as the same island */
(function () {
  'use strict';
  var D = document, IN = D.documentElement.classList.contains('in'), $ = function (s) { return D.querySelector(s); }, $$ = function (s) { return [].slice.call(D.querySelectorAll(s)); };
  var ART = window.ISLE, el = ART.el, wash = ART.wash, WC = ART.WC, isleDraw = ART.draw;
  var store = { get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } } };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  /* a key in the address (#k=...) is kept on this screen and taken out of the address */
  var hk = /(?:^#|&)k=([A-Za-z0-9_-]{16,64})/.exec(location.hash); if (hk) { store.set('da.hm.key', hk[1]); history.replaceState(null, '', location.pathname + location.search); }
  /* a real island's TEST opens on the twin by the real key, with ?isle=test (it never opens the real one); its paper kept apart */
  var TESTQ = /[?&]isle=test/.test(location.search), TS = TESTQ ? '.test' : '';
  var KEY = store.get('da.hm.key', ''), T = null, ISLE = null, ROLL = store.get('da.twin.roll' + TS, []) || [], SEEN = {}, RADIO = [], OUT = null, timer = 0;
  var api = function (path, o) { o = o || {}; if (TESTQ && /^\/api\/(twin|island)/.test(path)) path += (path.indexOf('?') < 0 ? '?' : '&') + 'isle=test'; o.headers = Object.assign({ authorization: 'Bearer ' + KEY, 'content-type': 'application/json' }, o.headers || {});
    return fetch(path, o).then(function (r) { if (r.status === 401) { if (!TESTQ) { KEY = ''; store.set('da.hm.key', ''); } gate('LOCKED'); throw new Error('key'); } return r.json().then(function (j) { if (!r.ok) { var e = new Error(j.error || r.status); e.status = r.status; throw e; } return j; }); }); };

  /* ───────── ESC/POS to dots: what a TM-T88V would put on paper ───────── */
  var b64 = function (s) { var bin = atob(s), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };
  function run(u, W, g, qrs) {
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
              if (g && qrs) qrs.push([qx, y, sz]); if (g) { g.fillStyle = '#1B1B19'; for (var my = 0; my < mc; my++) for (var mx = 0; mx < mc; mx++) if (Q ? Q.isDark(my, mx) : (mx * 7 + my * 3) % 5 < 2) g.fillRect(qx + mx * qrMod, y + my * qrMod, qrMod, qrMod); }
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
    var c = D.createElement('canvas'); c.width = W; c.height = H; var g = c.getContext('2d'); g.fillStyle = '#FAF9F4'; g.fillRect(0, 0, W, H); g.fillStyle = '#1B1B19'; c.qrs = []; run(u, W, g, c.qrs); return c; }
  /* a set-up slip's code is done, not a way anywhere: a thick tick painted over it, dry-brushed */
  function tickOver(cv) { var g = cv.getContext('2d'), qs = cv.qrs || [], sd = 9, r = function () { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
    qs.forEach(function (q) { var x = q[0], y = q[1], s = q[2], P = [[.1, .56], [.4, .86], [.94, .08]], j = function (v) { return v + (r() - .5) * s * .03; };
      g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#1B1B19';
      for (var p = 0; p < 4; p++) { g.globalAlpha = p ? .8 : 1; g.lineWidth = s * (.19 - p * .025); g.beginPath(); g.moveTo(j(x + P[0][0] * s), j(y + P[0][1] * s));
        g.quadraticCurveTo(j(x + .27 * s), j(y + .76 * s), j(x + P[1][0] * s), j(y + P[1][1] * s)); g.quadraticCurveTo(j(x + .6 * s), j(y + .44 * s), j(x + P[2][0] * s), j(y + P[2][1] * s)); g.stroke(); }
      g.strokeStyle = '#FAF9F4'; for (var b = 0; b < 7; b++) { var o = (r() - .5) * s * .13, t0 = .1 + r() * .3, t1 = t0 + .25 + r() * .4; g.globalAlpha = .35 + r() * .45; g.lineWidth = .8 + r() * 1.4; g.beginPath();
        for (var t = t0; t <= Math.min(1, t1); t += .04) { var a = t < .35 ? t / .35 : (t - .35) / .65, A = t < .35 ? P[0] : P[1], B = t < .35 ? P[1] : P[2], px = x + (A[0] + (B[0] - A[0]) * a) * s + o * .7, py = y + (A[1] + (B[1] - A[1]) * a) * s + o; if (t === t0) g.moveTo(px, py); else g.lineTo(px, py); } g.stroke(); }
      g.restore(); }); cv.dataset.tick = String(qs.length); }
  /* a print's small picture, kept by the site once its bytes are wiped */
  function thumb(t) { var m = /^(\d+),(\d+),(.+)$/.exec(t || ''); if (!m) return null; var w = +m[1], h = +m[2], bin = atob(m[3]), rb = Math.ceil(w / 8), c = D.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d'), im = x.createImageData(w, h);
    for (var yy = 0; yy < h; yy++) for (var xx = 0; xx < w; xx++) { var on = bin.charCodeAt(yy * rb + (xx >> 3)) & (0x80 >> (xx & 7)), i = (yy * w + xx) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = on ? 27 : 250; im.data[i + 3] = 255; } x.putImageData(im, 0, 0); return c; }
  /* a few lines set as a printer would, for a test or a line meant for the radio */
  function textSlip(lines) { var o = [0x1B, 0x40, 0x1B, 0x61, 0x01, 0x1B, 0x45, 0x01], put = function (s) { for (var i = 0; i < s.length; i++) o.push(s.charCodeAt(i) & 0x7F); o.push(0x0A); };
    put(lines[0]); o.push(0x1B, 0x45, 0x00); lines.slice(1).forEach(put); o.push(0x1B, 0x61, 0x00, 0x1B, 0x64, 0x04, 0x1D, 0x56, 0x42, 0x00); return new Uint8Array(o); }

  /* ───────── the roll: the newest slip under the printer, fed out at the printer's pace ───────── */
  var LAMP = false, RM = matchMedia('(prefers-reduced-motion: reduce)');
  var lamp = function (on) { LAMP = on; var l = $('#lamp'); if (l) l.setAttribute('fill', on ? '#E2552E' : '#4A4843'); $$('.bench .la').forEach(function (a) { a.classList.toggle('rd', on); }); var dv = $('#dev'); if (dv) dv.classList.toggle('on', on); };
  var look = function (e, at) { if (e) e.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: at || 'nearest' }); };
  function slipEl(cv, tag, feed, cap) { var s = D.createElement('div'); s.className = 'slip'; s.appendChild(cv); cap = String(cap || '').toUpperCase().replace(/[^\x20-\x7E]/g, '').trim().slice(0, 36); if (cap) s.dataset.cap = cap; if (tag === 'WAITING') { var t = D.createElement('span'); t.className = 'tag'; t.textContent = tag; s.appendChild(t); }
    var roll = $('#roll'); roll.insertBefore(s, roll.firstChild); $('#none').hidden = true; $('#stage').hidden = false;
    if (feed && !matchMedia('(prefers-reduced-motion: reduce)').matches) { var h = s.getBoundingClientRect().height, ms = Math.max(500, Math.min(4000, cv.height / 0.6)); s.style.transitionDuration = ms + 'ms'; s.style.height = '0px'; lamp(true);
      requestAnimationFrame(function () { requestAnimationFrame(function () { s.style.height = h + 'px'; }); }); setTimeout(function () { s.style.height = ''; lamp(false); }, ms + 60); }
    [].forEach.call(roll.children, function (c) { c.classList.toggle('open', c === s); }); while (roll.children.length > 24) roll.removeChild(roll.lastChild);
    /* past the last three, a slip is kept as a picture and its canvas let go: a phone holds only so much canvas */
    [].slice.call(roll.children, 3).forEach(function (c) { var v = c.querySelector('canvas'); if (!v) return; var im = new Image(); im.alt = ''; try { im.src = v.toDataURL('image/png'); } catch (e) { return; } c.replaceChild(im, v); v.width = 0; v.height = 0; });
    rollMore(); return s; }
  function rollMore() { var r = $('#roll'), b = $('#rall'), n = r.children.length, all = r.classList.contains('all'); if (!b) return; b.hidden = n <= 3; b.textContent = all ? 'FEWER' : (n - 3) + ' MORE'; b.title = all ? 'Only the last three' : 'Every print'; b.setAttribute('aria-expanded', String(all)); }
  function keep(id, cv, tag, cap) { var u = ''; try { u = cv.toDataURL('image/png'); } catch (e) { u = ''; } if (!u) return; ROLL.unshift({ id: id, u: u, tag: tag || '', cap: cap || '' }); ROLL = ROLL.slice(0, 12);
    while (!store.set('da.twin.roll' + TS, ROLL) && ROLL.length > 1) ROLL.pop(); }
  function shown(id, cv, tag, feed, kept, label) { if (SEEN[id]) return; SEEN[id] = 1; var e = slipEl(cv, tag, feed, label || tag); e.setAttribute('role', 'img'); e.setAttribute('aria-label', label || tag || 'A slip'); if (kept) keep(id, cv, tag, label); }
  var BACK = 0;
  function seen(cv) { look($('.stage'), 'start'); clearTimeout(BACK); BACK = setTimeout(function () { if (BT.run) return; look($('.bench .pt.want') || $('.bench .gh') || $('#dock'), 'center'); }, (RM.matches ? 300 : Math.max(500, Math.min(4000, cv.height / 0.6))) + 900); }
  var rkey = function () { return 'da.twin.radio.' + (T ? T.id : '') + TS; };
  function radio(line, from, who) { RADIO.unshift({ t: String(line).slice(0, 240), f: from || '', w: who ? String(who).slice(0, 12) : '' }); RADIO = RADIO.slice(0, 40); if (T) store.set(rkey(), RADIO.filter(function (r) { return r.f !== 'in'; })); radioDraw(); }
  /* on air: a ghost's radio on its bench with power in; a real island's MESH; or a radio linked to this screen */
  var ML = window.MESH || { link: {}, usb: false, bt: false }, TX = 0, MSEEN = {};
  function benchRadio() { var r = BN && T && T.ghost ? ofKind('radio')[0] : null; return r && power().on[r[0]] ? r : null; }
  function radioWay(r) { return portIds(r, 'device').some(function (e) { return BN.j.some(function (j) { var o = j[0] === e ? j[1] : j[1] === e ? j[0] : null, q = o && portOf(o); return q && q.part.kind === 'pi' && joinOf(j[0], j[1]).ok; }); }) ? 'USB' : 'WI-FI'; }
  function onAir() { return !!ML.link.on || (T && T.ghost ? !!benchRadio() : !!(T && T.mesh)); }
  /* where a line typed here really goes: a radio linked to this screen, or the ghost's own radio on its bench */
  function canSay() { return !!ML.link.on || !!(T && T.ghost && benchRadio()); }
  function radioDraw() { $('#rlog').innerHTML = RADIO.length ? RADIO.map(function (r) { return '<li' + (r.f === 'in' ? ' class="in"' : '') + '><i>' + (r.f === 'in' ? '←' : '→') + '</i><span>' + (r.w ? '<b>' + esc(r.w) + '</b> ' : '') + esc(r.t) + '</span></li>'; }).join('') : '';
    var air = onAir(), lk = !!ML.link.on; $('#rs').textContent = air ? 'MESH · ' + RADIO.length : RADIO.length ? String(RADIO.length) : ''; $('#rd').classList.toggle('air', air); $('#xd').classList.toggle('air', air);
    $('#mf').hidden = !canSay(); $('#madd').hidden = !(T && T.ghost && BN && !ofKind('radio').length);
    [['#mu', 'USB', ML.usb], ['#mb', 'BLUETOOTH', ML.bt]].forEach(function (b) { var e = $(b[0]), mine = lk && ML.link.name === b[1]; e.hidden = !b[2] || (lk && !mine); e.classList.toggle('on', mine); e.setAttribute('aria-pressed', String(mine)); }); }
  /* a line out: in the log, through a radio linked here, the bench radio's waves */
  function meshOut(line, mine) { line = String(line || '').trim(); if (!line) return; if (ML.cut) line = ML.cut(line); radio(line, 'out'); clearTimeout(TX); TX = setTimeout(function () { TX = 0; benchDraw(); }, 2400); benchDraw();
    if (ML.link.on && (mine || !T || !T.ghost)) ML.say(line).catch(function (e) { $('#msay').textContent = '× ' + String(e && e.message || e).slice(0, 40).toUpperCase(); }); }
  /* every slip folds or opens on a tap, the last printed too */
  $('#roll').addEventListener('click', function (e) { var s = e.target.closest('.slip'); if (s) s.classList.toggle('open'); });
  $('#rall').addEventListener('click', function () { $('#roll').classList.toggle('all'); rollMore(); });
  /* what this screen kept, first, so the roll is there with no signal */
  ROLL.slice().reverse().forEach(function (r) { var im = new Image(); im.alt = ''; im.src = r.u; SEEN[r.id] = 1; slipEl(im, r.tag, false, r.cap || r.tag); });

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
    $('#bodyw').textContent = $('#twin').classList.contains('dv') ? (T.paired && !T.ready ? 'ASLEEP' : '') : w + (T.number ? ' · ' + T.number : '') + ' · ' + paperOf() + ' MM'; $('#led').className = 'led' + (on ? ' on' : '');
    $('#body').title = T.paired ? (T.ready ? 'Its Raspberry Pi is listening' : 'Its Raspberry Pi has not asked lately') : OUT ? 'Prints here and on the printer beside this screen' : 'Prints come out on this page';
    $('#bs').textContent = w + (T.paired ? (T.ready ? ' · ON' : ' · QUIET') : ''); $('#body').disabled = !T.ghost; $('#body').classList.toggle('gh', !!T.ghost); if (T.ghost) $('#body').title = 'Prints come out on this page · tap: offline, as when its Wi-Fi drops'; $('#pf').hidden = !T.ghost; $('#test').hidden = !!T.ghost; $('#usb').hidden = !hasUsb || !T.ghost; $('#ser').hidden = !hasSer || !T.ghost; }
  /* the plate at the top, painted by the cards' own hand; again only when its width or its island changes */
  function plateDraw() { var cv = D.querySelector('#face canvas'); if (!cv || !window.CARDART) return; var s = CARDART.seedOf(T ? T.id : 'island'), k = s + 'x' + cv.clientWidth;
    if (cv.dataset.k !== k && CARDART.plate(cv, s)) cv.dataset.k = k; }
  addEventListener('resize', function () { clearTimeout(plateDraw.t); plateDraw.t = setTimeout(plateDraw, 200); }); setTimeout(plateDraw, 0);
  function take(j) { var cv = j.escpos ? draw(j.escpos, paperOf()) : j.mesh != null ? draw(textSlip(['DIRECT ACTION', j.code || '', j.mesh || '']), paperOf()) : null;
    if (j.mesh && !MSEEN[j.id]) { MSEEN[j.id] = 1; meshOut(j.mesh); }
    if (cv) { shown(j.id, cv, j.code === 'DA-PASS' ? 'PASS' : '', true, true, j.code || ''); paperUse(cv); }
    if (OUT) return (j.escpos ? OUT.write(b64(j.escpos)) : Promise.resolve()).then(function () { return api('/api/twin', { method: 'POST', body: JSON.stringify({ job: j.id, ok: true }) }); }, function (e) { return api('/api/twin', { method: 'POST', body: JSON.stringify({ job: j.id, ok: false, error: String(e && e.message || e) }) }); });
    return Promise.resolve(); }
  function tick() { clearTimeout(timer); if (!KEY || (OFF && T)) return;
    api('/api/twin' + (OUT ? '?usb=1' : '')).then(function (j) { var first = !T; T = j; if (first) RADIO = (store.get(rkey(), []) || []).concat(RADIO.filter(function (r) { return r.f === 'in'; })).slice(0, 40); $('#nm').textContent = j.name; $('#ptn').textContent = j.name; plateDraw(); D.title = j.name + ' · Twin'; benchLoad(j); bodyDraw(); joinsDraw(); radioDraw();
      var p = Promise.resolve(); (j.took || []).forEach(function (x) { p = p.then(function () { return take(x); }); });
      /* the rest of the roll, oldest first: a print still waiting is drawn from its bytes, one already out from its small picture */
      (j.roll || []).slice().reverse().forEach(function (x) { if (SEEN[x.id] || (j.took || []).some(function (y) { return y.id === x.id; })) return;
        var cv = x.escpos ? draw(x.escpos, j.paper) : thumb(x.thumb); if (!cv && x.off) cv = draw(textSlip([x.code || 'PRINT', 'OFFLINE']), j.paper); if (!cv) return;
        shown(x.id, cv, x.status === 'held' || x.status === 'queued' ? 'WAITING' : x.off ? 'OFFLINE' : '', !first, false, x.code || ''); });
      if (!$('#roll').children.length && !j.ghost) $('#none').hidden = false;
      /* the birth slip once, on the first open after START; a ghost seen real at last prints its REAL slip once */
      var gk = 'da.twin.g.' + j.id; if (j.ghost && !TESTQ) { if (!store.get(gk, false)) store.set(gk, true); if (first && store.get('da.twin.born', '') === j.id) { store.set('da.twin.born', ''); bootSlip('born'); }
        /* a ghost switched on and paired before (here or on another phone) still gives its code, once */
        if (first && j.bench && j.bench.o && j.bench.o[2] === 3 && !store.get('da.twin.rw.' + j.id, '')) setTimeout(reward, 900); }
      else if (j.paired && store.get(gk, false)) { store.set(gk, false); bootSlip('real'); }
      if (first && !ISLE) island(); }, function (e) { if (e && e.message === 'key') return; $('#led').className = 'led'; $('#bodyw').textContent = 'OFFLINE'; })
      .then(function () { if (!OFF) timer = setTimeout(tick, D.hidden ? 30e3 : T && T.ghost ? 4e3 : 15e3); else offDraw(); }); }
  D.addEventListener('visibilitychange', function () { if (!D.hidden && T) tick(); });

  /* ───────── joins: echo, only there, mirror ───────── */
  function island() { return api('/api/island').then(function (p) { ISLE = p; joinsDraw(); riteDraw(); }, function () { ISLE = { build: [] }; joinsDraw(); riteDraw(); }); }
  function joinsSave(j) { $('#jsay').textContent = '· · ·'; return api('/api/island', { method: 'POST', body: JSON.stringify({ joins: j }) }).then(function (p) { ISLE = p; $('#jsay').textContent = 'SAVED'; tick(); joinsDraw(); }, function (e) { $('#jsay').textContent = '× ' + String(e.message || '').toUpperCase(); }); }
  function joinsDraw() { if (!T) return; var J = (ISLE && ISLE.joins) || null, can = !!J;
    var to = J ? J.to : (T.joins.to || []).map(function (x) { return x.id; }), only = J ? J.only : T.joins.only, mir = J ? J.mirror : T.joins.mirror && T.joins.mirror.id;
    var nameOf = function (id) { var a = (J && J.isles || []).filter(function (x) { return x.id === id; })[0] || (T.joins.to || []).concat(T.joins.mirror ? [T.joins.mirror] : []).filter(function (x) { return x.id === id; })[0]; return a ? a.name : id; };
    $('#js').textContent = to.length || mir ? (to.length ? (only ? 'ONLY → ' : '→ ') + to.map(nameOf).join(' · ').toUpperCase() : '') + (mir ? (to.length ? ' · ' : '') + '⟲ ' + nameOf(mir).toUpperCase() : '') : '';
    /* the map: here in the middle, the islands it prints at on the right, the island it mirrors on the left */
    var S = [], cy = 75, hx = 160, node = function (x, y, r, label, sub, dash, cross) { S.push('<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="none" stroke="currentColor" stroke-width="1.4"' + (dash ? ' stroke-dasharray="3 3"' : '') + '/>');
      if (cross) S.push('<path d="M' + (x - r * .6) + ' ' + (y - r * .6) + 'L' + (x + r * .6) + ' ' + (y + r * .6) + '" stroke="#E2552E" stroke-width="1.6"/>');
      S.push('<text x="' + x + '" y="' + (y + r + 13) + '" text-anchor="middle">' + esc(String(label).toUpperCase().slice(0, 12)) + '</text>'); if (sub) S.push('<text class="sub" x="' + x + '" y="' + (y + r + 24) + '" text-anchor="middle">' + sub + '</text>'); };
    var arrow = function (x1, y1, x2, y2, hot) { var a = Math.atan2(y2 - y1, x2 - x1), hx2 = x2 - Math.cos(a) * 7, hy2 = y2 - Math.sin(a) * 7; S.push('<path d="M' + x1 + ' ' + y1 + 'L' + hx2 + ' ' + hy2 + '" stroke="' + (hot ? '#E2552E' : 'currentColor') + '" stroke-width="1.4" fill="none"/>');
      S.push('<path d="M' + x2 + ' ' + y2 + 'L' + (x2 - Math.cos(a - .45) * 8) + ' ' + (y2 - Math.sin(a - .45) * 8) + 'L' + (x2 - Math.cos(a + .45) * 8) + ' ' + (y2 - Math.sin(a + .45) * 8) + 'z" fill="' + (hot ? '#E2552E' : 'currentColor') + '"/>'); };
    to.forEach(function (id, i) { var y = to.length === 1 ? cy : 26 + i * (98 / Math.max(1, to.length - 1)); arrow(hx + 22, cy, 250, y, only); node(266, y, 14, nameOf(id), only ? 'ONLY' : 'ECHO'); });
    if (mir) { arrow(68, cy, hx - 24, cy, false); node(54, cy, 14, nameOf(mir), 'CARDS · ART', true); }
    node(hx, cy, 20, T.name, T.ghost ? 'GHOST' : 'HERE', !!T.ghost, only && to.length);
    var m = $('#jmap'); m.style.color = 'var(--ink)'; m.innerHTML = S.join(''); m.style.display = to.length || mir ? '' : 'none';
    /* the choices: only the islands that take prints (W.I.S.H. on) or share cards and art; none at all outside this island's build */
    var L = J ? J.isles || [] : []; ['#jto', '#jmode', '#jmir'].forEach(function (s) { $(s).previousElementSibling.hidden = $(s).hidden = !can; });
    $('#jto').innerHTML = L.filter(function (x) { return x.takes || to.indexOf(x.id) >= 0; }).map(function (x) { var on = to.indexOf(x.id) >= 0; return '<button type="button" class="' + (x.ghost ? 'gh' : '') + '" data-to="' + esc(x.id) + '" aria-pressed="' + on + '"' + (!on && to.length >= 3 ? ' disabled' : '') + ' title="' + (x.ghost ? 'A ghost island' : 'Island ' + (x.number || '')) + '">' + esc(String(x.name).toUpperCase()) + '</button>'; }).join('');
    $$('#jmode [data-only]').forEach(function (b) { b.setAttribute('aria-pressed', String((b.dataset.only === '1') === !!only)); b.disabled = !to.length; });
    $('#jmir').innerHTML = (mir ? '<button type="button" data-mir="" aria-pressed="false">NONE</button>' : '') + L.filter(function (x) { return x.cards || x.art || x.id === mir; }).map(function (x) { return '<button type="button" class="' + (x.ghost ? 'gh' : '') + '" data-mir="' + esc(x.id) + '" aria-pressed="' + (mir === x.id) + '" title="' + [x.art ? 'its pictures' : '', x.cards ? 'its picks' : ''].filter(Boolean).join(' and ') + '">' + esc(String(x.name).toUpperCase()) + '</button>'; }).join('');
    var hide = function (s, h) { $(s).hidden = $(s).previousElementSibling.hidden = h; };
    if (can) { hide('#jto', !$('#jto [data-to]')); hide('#jmode', !to.length); hide('#jmir', !$('#jmir [data-mir]')); }
    $('#jd').hidden = !(can && ($('#jto [data-to]') || $('#jmir [data-mir]'))) && !to.length && !mir; }
  $('#jd').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b || b.disabled || !ISLE || !ISLE.joins) return; var J = ISLE.joins, to = J.to.slice(), only = J.only, mir = J.mirror;
    if (b.dataset.to != null) { var i = to.indexOf(b.dataset.to); if (i >= 0) to.splice(i, 1); else to.push(b.dataset.to); }
    else if (b.dataset.only != null) only = b.dataset.only === '1';
    else if (b.dataset.mir != null) mir = b.dataset.mir || null; else return;
    joinsSave({ to: to, only: only && to.length > 0, mirror: mir }); });

  /* ───────── the bench: a ghost's parts (spec/parts, as parts.js), drawn by hand; pull a cable from one port to another (or tap one, then the other). A wrong
     join stays, dull and dashed, and says why. Power as one word: ENOUGH or SHORT, the sums in its hover ───────── */
  var PARTS = window.PARTS || [], PART = {}; PARTS.forEach(function (p) { PART[p.id] = p; });
  var BN = null, SEL = null, NOPE = null, bnTimer = 0, NS = 'http://www.w3.org/2000/svg';
  var PLUG = { 'usb-a': 'USB-A', 'usb-b': 'USB-B', 'micro-usb': 'micro-USB', 'micro-sd': 'microSD', dsi: 'DSI ribbon', 'power-din': 'round power plug', barrel: 'barrel', mc4: 'MC4', screw: 'screw terminal' };
  var STRAIGHT = ['micro-sd', 'dsi', 'power-din'], GIVE = { out: 1, host: 1, store: 1 }, TAKE = { 'in': 1, device: 1, store: 1 };
  var ROLE = { host: 'A host', device: 'A device', 'in': 'A power input', out: 'A power output', slot: 'A card slot', card: 'A card', store: 'A battery terminal' };
  var OK = { 'host device': 1, 'out in': 1, 'host in': 1, 'slot card': 1, 'store store': 1, 'out device': 1 };
  var dataOnly = function (g, t) { return g.role === 'out' && t.role === 'device' && t.volts == null; };
  var TWO = { host: 'Two hosts: one end must be a device', device: 'Two devices: one end must be a Pi', 'in': 'Two inputs: one end must give power', out: 'Two outputs: one end must take power', slot: 'Two slots: one end must be a card', card: 'Two cards: one end must be a slot' };
  function portOf(end) { var a = String(end).split('.'), x = (BN.p.filter(function (q) { return q[0] === a[0]; })[0] || []), p = PART[x[1]]; return p ? { iid: a[0], part: p, port: (p.ports || []).filter(function (o) { return o.id === a[1]; })[0] } : null; }
  var vs = function (v) { return Array.isArray(v) ? v[0] + '–' + v[1] : String(v); }, inside = function (v, r) { var a = Array.isArray(v) ? v[0] : v; return Array.isArray(r) ? a >= r[0] - 0.01 && a <= r[1] + 0.01 : Math.abs(a - r) < 0.5; };
  /* a join, checked: the two roles fit, a cable has the two plugs (or one plugs straight in), and what one gives the other takes */
  function joinOf(e1, e2) { var A = portOf(e1), B = portOf(e2); if (!A || !B || !A.port || !B.port) return { ok: false, why: 'That part is gone' };
    var a = A.port, b = B.port, ab = a.role + ' ' + b.role, ba = b.role + ' ' + a.role;
    if ((!OK[ab] && !OK[ba]) || dataOnly(a, b) || dataOnly(b, a)) return { ok: false, why: a.role === b.role ? TWO[a.role] : (ROLE[a.role] + ' and ' + ROLE[b.role].toLowerCase() + ' do not join') };
    var g = a.role === 'store' && b.role === 'store' ? (B.part.source ? b : a) : OK[ab] ? a : b, t = g === a ? b : a, cable = null;   // a battery gives to its charger, whichever end was first
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
    /* a battery and its charger join either way round: whichever end the cable was started from */
    J.forEach(function (r) { if (!r.ok) return; var ch = r.take.part.kind === 'charger' ? r.take : r.give.part.kind === 'charger' && r.take.part.store ? r.give : null; if (!ch) return; var p = (ch === r.take ? r.give : r.take).part;
      if (p.make && ch.port.role === 'in') { sun += p.make.watts * p.make.sun * 0.75; sunH = Math.max(sunH, p.make.sun); } if (p.store) kept += p.store.wh * (p.store.use || 1); });
    var bank = 0; BN.p.forEach(function (x) { var p = PART[x[1]]; if (p && p.store && on[x[0]] && (p.ports || []).some(function (o) { return o.role === 'out' && inUse(x[0] + '.' + o.id); })) bank += p.store.wh * (p.store.use || 1); });
    var day = need * 24, r0 = function (v) { return Math.round(v); }, say = 'Uses ' + r0(day) + ' Wh a day · the sun gives ' + r0(sun) + ' Wh (' + sunH + ' h) · the battery holds ' + r0(kept) + ' Wh';
    var res = !used ? { w: '—', t: 'Nothing here draws power yet' } : cold.length ? { w: 'SHORT', t: cold.join(', ') + (cold.length > 1 ? ' have' : ' has') + ' no power in' }
      : !need ? { w: 'ENOUGH', t: wall ? 'From the wall' : '' } : !sun && bank ? { w: bank >= day ? 'ENOUGH' : 'CHARGED', t: 'Uses ' + r0(day) + ' Wh a day · the bank holds ' + r0(bank) + ' Wh: about ' + r0(bank / need) + ' h, then it wants charging' } : sun < day ? { w: 'SHORT', t: sun ? say : 'Uses ' + r0(day) + ' Wh a day, and no sun comes in' }
      : kept < need * (24 - sunH) ? { w: 'SHORT', t: kept ? say + ': not enough for a night' : 'Nothing kept for the night: a battery on the charger' } : { w: 'ENOUGH', t: say + ', ' + r0(kept / need) + ' h with no sun' + (wall ? ' · the rest from the wall' : '') };
    res.on = on; res.J = J; res.need = need; res.sun = sun; res.sunH = sunH; res.kept = kept; res.wall = wall; return res; }
  function tt(s) { var t = el('title'); t.textContent = s; return t; }
  /* a part's colour, once it lives: the sun's things yellow, what changes power orange, the brain and its memory pink, what it makes blue */
  var WCK = { solar: 'yellow', battery: 'yellow', power: 'yellow', charger: 'orange', converter: 'orange', pi: 'pink', sd: 'pink', printer: 'blue', radio: 'blue', screen: 'blue' };
  var rnd = function (seed) { var x = seed * 9301 + 49297; return function () { x = (x * 9301 + 49297) % 233280; return x / 233280; }; };
  /* what a part is for, in one word: its plaque */
  var JOBW = { printer: 'PRINTER', pi: 'BRAIN', sd: 'MEMORY', power: 'PLUG', solar: 'SUN', battery: 'BATTERY', charger: 'CHARGER', radio: 'RADIO', screen: 'SCREEN' }, POWERS = ['wall-strip', 'solar-100w', 'power-bank'];
  function job(p) { if (!p) return ''; if (p.id === 'power-bank') return 'BANK'; if (p.kind === 'converter' || (p.kind === 'power' && p.id !== 'wall-strip')) { var o = (p.ports || []).filter(function (r) { return r.role === 'out'; }); return o.length === 1 && o[0].volts != null ? vs(o[0].volts) + ' V' : p.kind === 'power' ? 'PLUG' : 'ADAPTER'; } return JOBW[p.kind] || String(p.name).toUpperCase(); }
  function nameN(x) { if (!BN) return PART[x[1]].name; var same = BN.p.filter(function (q) { return q[1] === x[1]; }), i = same.indexOf(x); return PART[x[1]].name + (i > 0 ? ' #' + (i + 1) : ''); }
  /* the bench reads top to bottom as the power runs: what gives it (sun, battery, wall), the charger, the converters, the Pi, then
     what it drives (the printer, the SD, the radio, the screen). Each row ordered under what it is joined to, so cables cross least.
     A part takes at its top edge and gives at its bottom edge */
  var ROWK = { power: 0, solar: 0, battery: 0, charger: 1, converter: 2, pi: 3, printer: 4, sd: 4, radio: 4, screen: 4 }, RH = 136, CW = 100, TH = 96;
  var topSide = function (p, o) { return o.role === 'in' || o.role === 'device' || o.role === 'card' || (o.role === 'store' && !p.source); };
  function layout() { var rows = {}, nb = {}, cx = {}, out = [], pos = {};
    BN.j.forEach(function (j) { var a = j[0].split('.')[0], b = j[1].split('.')[0]; (nb[a] = nb[a] || []).push(b); (nb[b] = nb[b] || []).push(a); });
    BN.p.forEach(function (x, i) { var p = PART[x[1]]; if (!p) return; var r = ROWK[p.kind] == null ? 4 : ROWK[p.kind]; (rows[r] = rows[r] || []).push([x, i]); });
    Object.keys(rows).map(Number).sort(function (a, b) { return a - b; }).forEach(function (r) {
      var row = rows[r].map(function (e) { var n = (nb[e[0][0]] || []).filter(function (id) { return cx[id] != null; }); return { x: e[0], k: n.length ? n.reduce(function (s, id) { return s + cx[id]; }, 0) / n.length : 1e3 + e[1] }; }).sort(function (a, b) { return a.k - b.k; });
      /* each part sits under what feeds it, nudged apart so none overlap; a row that hangs from nothing spreads evenly */
      for (var s = 0; s < row.length; s += 3) { var part = row.slice(s, s + 3), Y = out.length * RH + 18, xs = part.length === 1 ? [110] : part.length === 2 ? [55, 165] : [0, 110, 220];
        if (part.some(function (e) { return e.k < 1e3; })) { xs = part.map(function (e, i) { return Math.max(0, Math.min(220, e.k < 1e3 ? e.k - CW / 2 : xs[i])); });
          for (var i = 1; i < xs.length; i++) xs[i] = Math.max(xs[i], xs[i - 1] + 110); for (i = xs.length - 1; i >= 0; i--) xs[i] = Math.min(xs[i], i === xs.length - 1 ? 220 : xs[i + 1] - 110); }
        part.forEach(function (e, i) { pos[e.x[0]] = [xs[i], Y]; cx[e.x[0]] = xs[i] + CW / 2; }); out.push(part); } });
    var ks = Object.keys(pos), lo = Math.min.apply(null, ks.map(function (k) { return pos[k][0]; })), hi = Math.max.apply(null, ks.map(function (k) { return pos[k][0]; })), dx = Math.round((220 - lo - hi) / 2);
    if (ks.length && dx) ks.forEach(function (k) { pos[k][0] += dx; });
    return { pos: pos, rows: out.length }; }
  /* ───────── the build: the island says what it wants next, in the order a real one is built ─────────
     The printer first; then its brain (a Pi), the Pi's memory (an SD, in its slot), the cable between them; then power, asked for
     backwards from what is cold: the printer wants 24 V, so whatever gives 24 V is offered; that wants 12 V, so the charger; the
     charger wants the sun, and a battery for the night. Then the SD is written, and the island prints. Each want is drawn where it
     goes: a ghost of the part (tap it for the parts that fit), or two ports breathing for the cable between them. No menus */
  var ROLLMM = 80000, MMDOT = 512 / 72, WANT = null, TRAY = null, FLOPEN = false;
  /* what answers a want for power: the power parts only (a Pi's USB gives 5 V, but never to the Pi or the printer it serves) */
  var FEEDS = { power: 1, solar: 1, battery: 1, charger: 1, converter: 1 }, BRAIN = { pi: 1, printer: 1 };
  var ofKind = function (k) { return BN.p.filter(function (x) { return PART[x[1]] && PART[x[1]].kind === k; }); };
  var portIds = function (x, role) { return ((PART[x[1]] || {}).ports || []).filter(function (o) { return o.role === role; }).map(function (o) { return x[0] + '.' + o.id; }); };
  var inUse = function (id) { return BN.j.some(function (j) { return j[0] === id || j[1] === id; }); };
  var idsOf = function (k) { return PARTS.filter(function (p) { return p.kind === k; }).map(function (p) { return p.id; }); };
  /* a part (not yet on the bench) that could give what this port takes: the roles fit, the volts fit, a cable has both plugs */
  function canGive(p, o) { return (p.ports || []).some(function (g) { if (!OK[g.role + ' ' + o.role] || dataOnly(g, o)) return false; if (g.volts != null && o.volts != null && !inside(g.volts, o.volts)) return false;
    return (g.plug === o.plug && STRAIGHT.indexOf(g.plug) >= 0) || PARTS.some(function (c) { return c.kind === 'cable' && c.ends && ((c.ends[0] === g.plug && c.ends[1] === o.plug) || (c.ends[1] === g.plug && c.ends[0] === o.plug)); }); }); }
  function wantOf(P) { var pr = ofKind('printer')[0], pi = ofKind('pi')[0], i, k;
    if (!pr) return { k: 'part', ids: idsOf('printer'), near: null, s: 0 };
    if (!pi) return { k: 'part', ids: idsOf('pi'), near: pr[0], s: 0 };
    var link = P.J.some(function (r) { return r.ok && ((r.give.iid === pi[0] && r.take.iid === pr[0]) || (r.give.iid === pr[0] && r.take.iid === pi[0])); });
    if (!link) { var hs = portIds(pi, 'host').filter(function (h) { return !inUse(h); }), ds = portIds(pr, 'device');
      for (i = 0; i < hs.length; i++) for (k = 0; k < ds.length; k++) if (joinOf(hs[i], ds[k]).ok) return { k: 'join', a: hs[i], b: ds[k], s: 0 }; }
    var slot = portIds(pi, 'slot')[0]; if (slot && !inUse(slot)) { var sd = ofKind('sd').filter(function (x) { return !portIds(x, 'card').some(inUse); })[0];
      return !sd ? { k: 'part', ids: idsOf('sd'), near: pi[0], s: 1 } : !flashedOf(sd[0]) ? { k: 'flash', iid: sd[0], s: 1 } : { k: 'join', a: slot, b: portIds(sd, 'card')[0], s: 1 }; }
    /* power, from what is cold, backwards: an unfed input is joined to a part already here with a free output, or a part is asked for */
    var order = [pr, pi].concat(BN.p.filter(function (x) { return x !== pr && x !== pi; }));
    for (i = 0; i < order.length; i++) { var x = order[i], p = PART[x[1]]; if (!p || !p.watts || p.source || P.on[x[0]]) continue;
      var ins = (p.ports || []).filter(function (o) { return (o.role === 'in' || (o.role === 'device' && o.volts != null)) && !inUse(x[0] + '.' + o.id); }); if (!ins.length) continue; var o = ins[0], to = x[0] + '.' + o.id;
      /* a screw terminal takes a second wire, as a real one does; every other output feeds one thing. A Pi's USB (power and data) before a supply */
      var gv = []; for (k = 0; k < BN.p.length; k++) { var y = BN.p[k]; if (y === x) continue; ((PART[y[1]] || {}).ports || []).forEach(function (g) { if (GIVE[g.role] && g.role !== 'store' && (g.role !== 'host' || !BRAIN[p.kind]) && (g.plug === 'screw' || !inUse(y[0] + '.' + g.id))) gv.push([y[0] + '.' + g.id, g.role === 'host' ? 0 : 1]); }); }
      gv.sort(function (a, b) { return a[1] - b[1]; }); for (k = 0; k < gv.length; k++) if (joinOf(gv[k][0], to).ok) return { k: 'join', a: gv[k][0], b: to, s: 2 };
      /* the parts that could feed it, the island's own (sun, battery, converters) before the wall */
      var c = PARTS.filter(function (q) { return FEEDS[q.kind] && q.id !== x[1] && canGive(q, o); }).sort(function (a, b) { var w = function (q) { return q.source === 'wall' ? 2 : q.source ? 1 : 0; }; return w(a) - w(b); }).map(function (q) { return q.id; });
      if (c.length) return BN.p.some(function (y) { return PART[y[1]] && PART[y[1]].source; }) ? { k: 'part', ids: c, near: x[0], port: to, s: 2 } : { k: 'part', ids: POWERS.filter(function (id) { return PART[id]; }), near: x[0], port: to, power: true, s: 2 }; }
    /* the night: a charger with nothing kept asks for a battery */
    var ch = ofKind('charger')[0]; if (ch) { var bt = portIds(ch, 'store').filter(function (s) { return !inUse(s); })[0];
      if (bt && P.need && P.kept < P.need * (24 - P.sunH)) { var have = BN.p.filter(function (y) { return PART[y[1]].kind === 'battery' && !portIds(y, 'store').some(inUse); })[0];
        return have ? { k: 'join', a: portIds(have, 'store')[0], b: bt, s: 2 } : { k: 'part', ids: idsOf('battery'), near: ch[0], port: bt, s: 2 }; } }
    var sd2 = ofKind('sd').filter(function (y) { return portIds(y, 'card').some(inUse); })[0], f2 = sd2 && flashedOf(sd2[0]); if (sd2 && !f2) return { k: 'flash', iid: sd2[0], s: 1 };
    if ((+BN.m || 0) >= ROLLMM) return { k: 'paper', iid: pr[0] };
    /* the first start, on the Pi: power on, its setup Wi-Fi, its pair code */
    var O = BN.o, st = f2 && O && O[0] === sd2[0] && O[1] === f2[1] ? O[2] : 0; if (sd2 && st < 3) return { k: ['boot', 'wifi', 'pair'][st], iid: pi[0] };
    return { k: 'done', iid: pr[0] }; }
  /* a small sketch of a part, for the tray */
  function mini(p) { return '<svg viewBox="0 0 120 90" aria-hidden="true">' + (p.draw || []).map(function (st) { return '<path d="' + st[0] + '"' + (st[1] ? ' class="ac"' : '') + '/>'; }).join('') + '</svg>'; }
  function trayDraw() { var t = $('#bnl'); if (!TRAY) { t.innerHTML = ''; t.hidden = true; return; } t.hidden = false; t.classList.toggle('swap', !!TRAY.iid);
    var here = TRAY.iid ? BN.p.filter(function (q) { return q[0] === TRAY.iid; })[0] : null;
    var ids = TRAY.all || TRAY.ids.length <= 4 ? TRAY.ids : TRAY.ids.slice(0, 3), head = TRAY.power ? 'POWER' : job(PART[here ? here[1] : TRAY.ids[0]]);
    t.innerHTML = '<p class="th">' + esc(head) + '</p>' + ids.map(function (id) { var p = PART[id]; return '<button type="button" class="tile' + (here && here[1] === id ? ' on' : '') + '" data-part="' + esc(id) + '" title="' + esc(p.about || p.name) + '">' + mini(p) + '<b>' + esc(TRAY.power ? job(p) : String(p.name).toUpperCase()) + '</b><span>' + esc(String(TRAY.power ? p.name : p.sub || '').toUpperCase()) + '</span>' + (p.tested ? '<i>TESTED</i>' : '') + '</button>'; }).join('') +
      (ids.length < TRAY.ids.length ? '<button type="button" class="tile x" data-more="1" title="Every part that fits">+' + (TRAY.ids.length - ids.length) + '</button>' : '') +
      (here ? '<button type="button" class="tile x" data-off="' + esc(here[0]) + '" title="Take it off the bench">×</button>' : ''); }
  /* power through a day: the sun's arc, what the battery holds hour by hour, and the hours the island sleeps. No clock, just the day */
  function dayDraw(P) { var s = $('#bnday'); if (!s) return; var W = 320, H = 46, h, out = '';
    if (!P.need || (!P.sun && !P.wall) || $('#bnw').dataset.of !== 'bnp') { s.innerHTML = ''; s.setAttribute('hidden', ''); return; } s.removeAttribute('hidden');   /* an svg has no .hidden of its own */
    if (P.wall && !P.sun) { s.innerHTML = '<line x1="0" y1="10" x2="' + W + '" y2="10" class="dk"/><title>From the wall: never dark</title>'; return; }
    var sh = P.sunH || 1, rise = 12 - sh / 2, kWh = P.kept, lv = kWh, sun = [], lvl = [], dark = [];
    for (var day = 0; day < 3; day++) for (h = 0; h < 96; h++) { var t = (h + .5) / 4, z = P.sun && t > rise && t < rise + sh ? Math.sin(Math.PI * (t - rise) / sh) : 0, gain = z * P.sun * Math.PI / 2 / sh;
      lv = Math.max(0, Math.min(kWh, lv + (gain - P.need) / 4)); if (day === 2) { sun.push(z); lvl.push(kWh ? lv / kWh : 0); dark.push(lv <= 0 && gain < P.need); } }
    var X = function (i) { return (i + .5) * W / 96; };
    out += '<path class="sun" d="M' + sun.map(function (z, i) { return X(i) + ' ' + (H - 6 - z * (H - 14)); }).join(' L') + '"/>';
    out += '<path class="lv" d="M0 ' + (H - 2) + ' L' + lvl.map(function (v, i) { return X(i) + ' ' + (H - 2 - v * (H - 10)); }).join(' L') + ' L' + W + ' ' + (H - 2) + 'Z"/>';
    dark.forEach(function (d, i) { if (d) out += '<rect class="nt" x="' + (i * W / 96) + '" y="0" width="' + (W / 96 + .5) + '" height="' + H + '"/>'; });
    var asleep = dark.filter(Boolean).length; s.innerHTML = out + '<title>' + (asleep ? 'Asleep ' + Math.round(asleep / 96 * 100) + '% of the day: more sun or a bigger battery' : 'Awake all day and night') + '</title>'; }
  function benchDraw() { if (!BN) return; var svg = $('#bnv'), rc = window.rough ? rough.svg(svg) : null, P = power(), W0 = wantOf(P), at = {}, cw = CW; WANT = W0;
    /* a part wanted is laid out with the rest, as a ghost beside what wants it */
    var gid = null; if (W0.k === 'part') { gid = 'p999'; BN.p.push([gid, W0.ids[0]]); if (W0.near) BN.j.push([gid + '.x', W0.near + '.x']); }
    var L = layout(); if (gid) { BN.p.pop(); if (W0.near) BN.j.pop(); }
    var Hh = Math.max(150, L.rows * RH + 6); svg.setAttribute('viewBox', '0 0 320 ' + Hh); svg.setAttribute('class', 'bench' + (stageOf(W0) >= 2 ? ' pw-on' : '')); svg.innerHTML = ''; var cg = el('g'); svg.appendChild(cg);
    var used = {}; BN.j.forEach(function (j) { used[j[0]] = used[j[1]] = 1; }); var want = {}; if (W0.k === 'join') want[W0.a] = want[W0.b] = 1;
    var sketch = function (p, X, Y, seed, ro) { var sk = el('g', { 'class': 'sk', transform: 'translate(' + (X + cw * .07) + ' ' + (Y + 6) + ') scale(' + (cw * .72 / 100) + ')' }); (p.draw || []).forEach(function (st, i) { var n = rc ? rc.path(st[0], { roughness: ro == null ? .9 : ro, bowing: ro > 1.5 ? 1.6 : .7, strokeWidth: ro > 1.5 ? 1.1 : 1.3, seed: seed + i, stroke: 'currentColor' }) : el('path', { d: st[0], stroke: 'currentColor' }); if (st[1]) n.setAttribute('class', 'ac'); sk.appendChild(n); }); return sk; };
    if (gid && L.pos[gid]) { var gp = PART[W0.ids[0]], gx = L.pos[gid][0], gy = L.pos[gid][1];
      var gc = gx + cw / 2, gh = el('g', { 'class': 'gh', 'data-want': '1', role: 'button', tabindex: '0', 'aria-label': 'Wanted here: ' + (W0.power ? 'power' : String(gp.kind)) }, [tt(W0.power ? 'Power: from the wall, the sun or a bank · tap to choose' : 'Wanted here · tap for the parts that fit')]),
        sc = el('g', { 'class': 'scr', transform: 'rotate(-1.6 ' + gc + ' ' + (gy + TH / 2) + ')' }, [el('rect', { 'class': 'bk', x: gx, y: gy, width: cw, height: TH, rx: 1.5 })]);
      if (rc) { var pen = rc.rectangle(gx + 5, gy + 5, cw - 10, TH - 10, { roughness: 2.4, bowing: 2.2, strokeWidth: .8, stroke: 'currentColor', seed: 11 }); pen.setAttribute('class', 'pen'); sc.appendChild(pen); }
      sc.appendChild(sketch(gp, gx, gy, 3, 2.4));
      var gj = el('text', { 'class': 'jb hw', x: gc, y: gy + TH - 9, 'text-anchor': 'middle' }); gj.textContent = (W0.power ? 'power' : job(gp).toLowerCase()) + '?'; sc.appendChild(gj);
      var gb = el('g', { 'class': 'gb' }); if (rc) { [rc.ellipse(gx + cw - 15, gy + 16, 21, 19, { roughness: 1.7, strokeWidth: 1.5, stroke: 'currentColor', seed: 4 }), rc.line(gx + cw - 19.5, gy + 16.4, gx + cw - 10.5, gy + 15.6, { roughness: .8, strokeWidth: 1.7, stroke: 'currentColor', seed: 5 }), rc.line(gx + cw - 15.2, gy + 11.6, gx + cw - 14.8, gy + 20.6, { roughness: .8, strokeWidth: 1.7, stroke: 'currentColor', seed: 6 })].forEach(function (n) { gb.appendChild(n); }); }
      sc.appendChild(gb); gh.appendChild(sc);
      gh.appendChild(el('rect', { 'class': 'tp', x: gc - 17, y: gy - 6, width: 34, height: 12, transform: 'rotate(5 ' + gc + ' ' + gy + ')' })); svg.appendChild(gh); }
    BN.p.forEach(function (x) { var p = PART[x[1]], xy = L.pos[x[0]]; if (!p || !xy) return; var X = xy[0], Y = xy[1], cold = p.watts && !p.source && !P.on[x[0]];
      var wt = /^(flash|paper|done|boot|wifi|pair)$/.test(W0.k) && W0.iid === x[0], wk = wt && !BT.run && W0.k !== 'done', WT = { flash: 'tap to write Island OS onto it', done: 'tap: a print', paper: 'out of paper: tap for a new roll', boot: 'tap: power on', wifi: 'tap: join its setup Wi-Fi', pair: 'tap: approve its pair code' };
      var joined = (p.ports || []).some(function (o) { return used[x[0] + '.' + o.id]; }),
        /* a part that draws nothing (an SD in its slot) holds once what it is joined to has power */
        held = !p.watts && !p.source && BN.j.some(function (j) { var a = j[0].split('.')[0], b = j[1].split('.')[0]; return (a === x[0] && P.on[b]) || (b === x[0] && P.on[a]); }), lv = !joined ? 0 : P.on[x[0]] || held ? 2 : 1;
      var g = el('g', { 'class': 'pt l' + lv + (cold ? ' off' : '') + (wk ? ' want ' + W0.k : ''), 'data-body': x[0], tabindex: '0' }, [tt(p.name + (p.about ? ' · ' + p.about : '') + (cold ? ' · No power in' : '') + (wt ? ' · ' + WT[W0.k] : ' · tap to swap or take off')), el('rect', { 'class': 'sh', x: X + 2, y: Y + 3, width: cw, height: TH, rx: 8 }), el('rect', { 'class': 'bk', x: X, y: Y, width: cw, height: TH, rx: 8 })]);
      var sk = sketch(p, X, Y, 7 + x[1].length, [1.9, .9, .3][lv]);
      /* an SD being written fills from the bottom; being checked, a line runs down it */
      if (p.kind === 'sd' && FL.run && FL.sd === x[0]) sk.appendChild(el('rect', { id: 'sdf', 'class': 'sdf', x: 46, y: 74, width: 32, height: 0 }));
      if (!lv) { var R = rnd(x[1].length * 13 + X), gm = el('g', { 'class': 'grm' }); for (var gi = 0; gi < 11; gi++) gm.appendChild(el('circle', { cx: (X + 6 + R() * (cw - 12)).toFixed(1), cy: (Y + 6 + R() * (TH - 26)).toFixed(1), r: (.5 + R() * 1.1).toFixed(2) }));
        var cx1 = X + cw * (.55 + R() * .3); gm.appendChild(el('path', { d: 'M' + cx1.toFixed(1) + ' ' + Y + ' l-4 7 l5 4 l-6 9 l3 5', 'stroke-width': '.7' })); g.appendChild(gm); }
      if (lv === 2 && rc) g.appendChild(wash(rc, 'ellipse', [X + cw / 2 + 3, Y + 34, cw * .74, 46], WCK[p.kind] || 'blue', 30 + x[1].length, +(getComputedStyle(D.documentElement).getPropertyValue('--wco')) || .42));
      g.appendChild(sk);
      if (lv) { g.appendChild(el('g', { 'class': 'mod' }, [el('circle', { cx: X + 4.5, cy: Y + TH - 4.5, r: 1.6 }), el('circle', { cx: X + cw - 4.5, cy: Y + 4.5, r: 1.6 }), el('path', { d: 'M' + (X + 3.4) + ' ' + (Y + TH - 5.6) + ' l2.2 2.2 M' + (X + cw - 5.6) + ' ' + (Y + 3.4) + ' l2.2 2.2 M' + (X + 6) + ' ' + (Y + TH - 22) + ' v6 M' + (X + 9) + ' ' + (Y + TH - 22) + ' v6 M' + (X + 12) + ' ' + (Y + TH - 22) + ' v6' })]));
        if (p.kind === 'pi') { var sx = X + cw - 27, sy = Y + 8, scl = [el('rect', { x: sx, y: sy, width: 22, height: 19, rx: 1.5 })]; for (var si = 0; si < 6; si++) scl.push(el('path', { d: 'M' + (sx + 1) + ' ' + (sy + 2.5 + si * 3) + ' h20' }));
          if (P.on[x[0]] && !wk) scl.push(el('rect', { 'class': 'cur', x: sx + 3, y: sy + 12, width: 3.5, height: 4.5 })); g.appendChild(el('g', { 'class': 'scn' }, scl)); } }
      if (lv) g.appendChild(el('rect', { 'class': 'tp', x: X - 5, y: Y + 3, width: 26, height: 9, transform: 'rotate(-38 ' + (X + 8) + ' ' + (Y + 7) + ')' }));
      /* alive: the island's own mark pressed into its corner, the square and the sun in dots */
      if (lv === 2) { var mx = X + cw - 21, my = Y + TH - 3.5; g.appendChild(el('g', { 'class': 'stmp', transform: 'rotate(-9 ' + (mx + 8) + ' ' + (my + 4) + ')' }, [el('rect', { x: mx, y: my, width: 7.5, height: 7.5 }), el('circle', { cx: mx + 13.5, cy: my + 3.75, r: 3.8 })])); }
      /* the printer's roll: 80 mm × 80 m, smaller with every print */
      if (p.kind === 'printer') { var left = Math.max(0, 1 - (+BN.m || 0) / ROLLMM), rr = 3 + 9 * Math.sqrt(left);
        g.appendChild(el('g', { 'class': 'roll' }, [tt(Math.round(left * ROLLMM / 1000) + ' m of paper left · about ' + Math.round(left * ROLLMM / 160) + ' receipts'), el('circle', { cx: X + cw - 14, cy: Y + 16, r: 12.5, 'class': 'rl0' }), el('circle', { cx: X + cw - 14, cy: Y + 16, r: rr, 'class': 'rl' + (left < .1 ? ' low' : '') }), el('circle', { cx: X + cw - 14, cy: Y + 16, r: 2.2, 'class': 'rc' })])); }
      /* the Pi's two lights: red while it has power, the other flickering as it reads its SD; and what it waits for, drawn above it */
      if (p.kind === 'pi' && P.on[x[0]]) { var bo = W0.k === 'done' || W0.k === 'paper'; g.appendChild(el('g', { 'class': 'leds' }, [tt(BT.run ? 'Starting' : bo ? 'On' : 'Power: red light on'), el('circle', { 'class': 'lp', cx: X + 11, cy: Y + 30, r: 2.4 }), el('circle', { 'class': 'la' + (BT.run ? ' run' : bo ? ' idle' : '') + (LAMP ? ' rd' : ''), cx: X + 11, cy: Y + 38, r: 2.4 })])); }
      if (p.kind === 'radio' && P.on[x[0]]) { var ax = X + 80 * cw / 120, ay = Y + 8 + 6 * cw / 120; g.appendChild(el('g', { 'class': 'air' + (TX ? ' tx' : '') }, [tt('On air · ' + (radioWay(x) === 'USB' ? 'by USB to the Pi' : 'by the island’s Wi-Fi')), el('path', { d: 'M' + (ax - 6) + ' ' + (ay + 1) + ' Q' + ax + ' ' + (ay - 7) + ' ' + (ax + 6) + ' ' + (ay + 1) }), el('path', { d: 'M' + (ax - 11) + ' ' + (ay + 2) + ' Q' + ax + ' ' + (ay - 13) + ' ' + (ax + 11) + ' ' + (ay + 2) })])); }
      if (wk && /^(boot|wifi|pair)$/.test(W0.k)) { var cx0 = X + cw - 14, cy0 = Y + 18, CUE = { boot: 'M' + (cx0 - 4.6) + ' ' + (cy0 - 3.4) + ' A6 6 0 1 0 ' + (cx0 + 4.6) + ' ' + (cy0 - 3.4) + ' M' + cx0 + ' ' + (cy0 - 7) + ' V' + (cy0 - 0.5),
          wifi: 'M' + (cx0 - 8) + ' ' + (cy0 - 1) + ' Q' + cx0 + ' ' + (cy0 - 9) + ' ' + (cx0 + 8) + ' ' + (cy0 - 1) + ' M' + (cx0 - 4.6) + ' ' + (cy0 + 2.4) + ' Q' + cx0 + ' ' + (cy0 - 2.6) + ' ' + (cx0 + 4.6) + ' ' + (cy0 + 2.4) + ' M' + cx0 + ' ' + (cy0 + 5.6) + ' v.1',
          pair: 'M' + (cx0 - 7) + ' ' + (cy0 - 7) + ' h5 v5 h-5 Z M' + (cx0 + 2) + ' ' + (cy0 - 7) + ' h5 v5 h-5 Z M' + (cx0 - 7) + ' ' + (cy0 + 2) + ' h5 v5 h-5 Z M' + (cx0 + 3) + ' ' + (cy0 + 3) + ' h3 v3' };
        g.appendChild(el('path', { 'class': 'cue', d: CUE[W0.k] })); }
      var nm = el('text', { 'class': 'jb', x: X + cw / 2, y: Y + TH - 15, 'text-anchor': 'middle' }), md = el('text', { 'class': 'md', x: X + cw / 2, y: Y + TH - 7, 'text-anchor': 'middle' }); nm.textContent = job(p); md.textContent = nameN(x).toUpperCase() === nm.textContent ? String(p.sub || '').toUpperCase() : nameN(x).toUpperCase(); g.appendChild(nm); g.appendChild(md);
      /* a bolt in the corner: filled with power in, hollow and hot with none */
      if (p.watts && !p.source) { var bx = X + 8, by = Y + 8; g.appendChild(el('path', { 'class': 'bolt' + (cold ? ' no' : ''), d: 'M' + (bx + 5) + ' ' + by + ' L' + bx + ' ' + (by + 8) + ' H' + (bx + 4) + ' L' + (bx + 3) + ' ' + (by + 14) + ' L' + (bx + 8) + ' ' + (by + 6) + ' H' + (bx + 4) + ' Z' })); }
      var fv = p.kind === 'sd' && flashedOf(x[0]); if (fv) { var vt = el('text', { 'class': 'fv', x: X + cw - 6, y: Y + 22, 'text-anchor': 'end' }, [tt('Island OS ' + fv[1] + ' · ' + fv[2])]); vt.appendChild(D.createTextNode(fv[1])); g.appendChild(vt); }
      var ps = p.ports || [], tops = ps.filter(function (o) { return topSide(p, o); }), bots = ps.filter(function (o) { return !topSide(p, o); });
      [[tops, Y, -1], [bots, Y + TH, 1]].forEach(function (side) { side[0].forEach(function (o, k) { var px = X + cw * (k + 1) / (side[0].length + 1), py = side[1], id = x[0] + '.' + o.id; at[id] = [px, py, side[2]];
        var fit = SEL && SEL !== id && SEL.split('.')[0] !== x[0] && joinOf(SEL, id).ok, no = SEL && SEL !== id && !fit;
        var po = el('g', { 'class': 'po' + (SEL === id ? ' sel' : used[id] ? ' used' : '') + (fit ? ' fit' : '') + (no ? ' no' : '') + (NOPE === id ? ' nope' : '') + (want[id] && !SEL ? ' want' : ''), 'data-port': id, tabindex: '0', role: 'button', 'aria-label': nameN(x) + ' ' + o.label }, [tt(o.label + ' · ' + PLUG[o.plug] + ' · ' + o.role.toUpperCase() + (o.volts != null ? ' · ' + vs(o.volts) + ' V' : '')), el('circle', { 'class': 'ph', cx: px, cy: py + side[2] * 4, r: 17 }), el('circle', { cx: px, cy: py, r: 5.5 })]);
        var lb = el('text', { 'class': 'pl', x: px, y: side[2] < 0 ? py - 9 : py + 15, 'text-anchor': 'middle' }); lb.textContent = o.label; po.appendChild(lb); g.appendChild(po); }); });
      svg.appendChild(g); });
    /* the cables behind the parts, from what gives to what takes. Power that is there runs along its cable; power that is not stays grey */
    var curve = function (a, b) { var k = Math.max(30, Math.abs(b[1] - a[1]) * .5); return 'M' + a[0] + ' ' + a[1] + ' C' + a[0] + ' ' + (a[1] + a[2] * k) + ' ' + b[0] + ' ' + (b[1] + b[2] * k) + ' ' + b[0] + ' ' + b[1]; };
    BN.j.forEach(function (j, i) { var r = P.J[i], e = r.ok ? [r.give.iid + '.' + r.give.port.id, r.take.iid + '.' + r.take.port.id] : j, a = at[e[0]], b = at[e[1]]; if (!a || !b) return;
      var d = curve(a, b), pw = r.ok && (r.give.port.role === 'out' || r.give.port.role === 'store' || (r.give.port.role === 'host' && (r.take.port.role === 'in' || (r.take.port.role === 'device' && r.take.port.volts != null))));
      var label = r.ok ? (r.cable ? r.cable.name : 'Straight in') + (pw ? (P.on[r.give.iid] ? ' · power' : ' · no power yet') : '') : r.why;
      cg.appendChild(el('path', { d: d, 'class': 'cb' + (!r.ok ? ' bad' : pw ? ' pwr' + (P.on[r.give.iid] ? ' on' : '') : ' dat') }));
      cg.appendChild(el('path', { d: d, 'class': 'hit', 'data-cut': String(i), role: 'button', 'aria-label': label + ': tap to take it out' }, [tt(label + ' · tap to take it out')])); });
    /* the cable wanted, dotted where it will go */
    if (W0.k === 'join' && at[W0.a] && at[W0.b] && !SEL) { var jr = joinOf(W0.a, W0.b), wa = at[jr.ok ? jr.give.iid + '.' + jr.give.port.id : W0.a], wb = at[jr.ok ? jr.take.iid + '.' + jr.take.port.id : W0.b]; cg.appendChild(el('path', { d: curve(wa, wb), 'class': 'cbg' }, [tt((jr.cable ? jr.cable.name : 'Straight in') + ' wanted here')])); }
    var pw = $('#bnp'); pw.textContent = P.w; pw.title = P.t; pw.className = 'pw' + (P.w === 'SHORT' ? ' short' : ''); if ($('#bnw').dataset.of === 'bnp') $('#bnw').textContent = P.t;
    /* the printer at the foot of the page: the one on the bench, once there is one */
    var live = stageOf(W0) >= 4; $('#bnd').classList.toggle('folded', live && !BOPEN); $('#twin').classList.toggle('live', live); devDraw(P, live);
    var prx = ofKind('printer')[0]; $('#pnm').textContent = prx ? String(PART[prx[1]].name).toUpperCase() : 'TWIN'; $('#stage').hidden = !$('#roll').children.length;
    trayDraw(); dockDraw(P, W0); flDraw(); dayDraw(P); riteDraw(); }
  /* ───────── the dock: what the island wants now, in plain words, and the one thing to press. Wrong is said as wrong, with why ───────── */
  var FB = '', HINT = '', fbT = 0, KN = { printer: 'A PRINTER', pi: 'A BRAIN', sd: 'A MEMORY CARD', charger: 'A CHARGER', battery: 'A BATTERY', radio: 'A RADIO', screen: 'A SCREEN' };
  function jobN(p) { return p.kind === 'converter' ? job(p) + ' ADAPTER' : job(p); }
  function wantSay(W) {
    if (W.k === 'part') { var p = PART[W.ids[0]]; return W.power ? 'CHOOSE POWER' : 'ADD ' + (KN[p.kind] || 'A ' + jobN(p)); }
    if (W.k === 'join') { var r = joinOf(W.a, W.b); if (!r.ok) return 'A CABLE'; var g = r.give, t = r.take;
      if (g.port.role === 'slot') return 'CARD INTO THE ' + job(g.part); if (g.port.role === 'host' && t.port.role === 'device' && t.port.volts == null) return 'CABLE ' + job(g.part) + ' TO ' + job(t.part);
      return g.part.source ? job(g.part) + ' INTO THE ' + jobN(t.part) : 'POWER THE ' + jobN(t.part); }
    return { flash: 'WRITE THE CARD', paper: 'OUT OF PAPER', boot: 'SWITCH ON', wifi: 'JOIN ITS WI-FI', pair: 'APPROVE ' + showCode(pairCode()), done: 'LIVE' }[W.k] || ''; }
  /* only what is wrong is said out loud; the rest (a hint, a tick) is there for a screen reader and is otherwise the thing itself */
  function sayDraw() { var b = $('#bnsay'), t = FB || HINT; b.textContent = t; b.classList.toggle('err', /^×/.test(t)); }
  function dockDraw(P, W) { var c = stageOf(W), bad = -1, acts = []; P.J.forEach(function (r, i) { if (!r.ok) bad = i; });
    if (BT.run) acts = [];
    else if (bad >= 0) acts = [['undo', 'UNDO', 'Take the wrong cable out']];
    else if (W.k === 'part') acts = TRAY && !TRAY.iid ? [] : [['add', W.power ? 'CHOOSE' : 'ADD', 'The parts that fit']];
    else if (W.k === 'paper') acts = [['roll', 'NEW ROLL', '80 m of fresh paper']];
    else if (W.k === 'boot') acts = [['on', 'ON', 'Power it on']];
    else if (W.k === 'wifi') acts = [['wifi', 'JOIN', 'Join the setup Wi-Fi its slip shows, from a phone']];
    else if (W.k === 'pair') acts = [['pair', 'APPROVE', 'Approve the code it printed, as on novel.global']];
    else if (W.k === 'done') acts = TESTQ ? [['home', 'MOVE', 'What works here, moved to its real island']] : [['home', 'HOME', 'Its home: everything it can do']];
    var nw = $('#nw'); nw.textContent = BT.run ? 'STARTING' : bad >= 0 ? 'WRONG CABLE' : wantSay(W); nw.classList.toggle('bad', bad >= 0 && !BT.run);
    /* the words go quiet when the thing says it: a button with the verb, the scrap on the bench, the writer, the log running */
    nw.classList.toggle('so', bad < 0 && (BT.run || W.k === 'part' || W.k === 'flash' || W.k === 'done' || (acts.length > 0 && W.k !== 'pair')));
    $('#na').innerHTML = acts.map(function (a, i) { return '<button type="button" data-act="' + a[0] + '" title="' + esc(a[2]) + '"' + (i ? '' : ' class="on"') + '>' + a[1] + '</button>'; }).join('');
    var w = $('#bnw'); if (bad >= 0) { w.textContent = P.J[bad].why; w.dataset.of = 'bad'; } else if (w.dataset.of === 'bad') { w.textContent = ''; w.dataset.of = ''; }
    $('#bnp').hidden = c < 2 || P.w === '—';
    HINT = SEL ? ($$('.bench .po.fit').length ? 'NOW ITS OTHER END' : 'NOTHING HERE FITS') : bad < 0 && W.k === 'join' && BN.j.length < 3 ? 'TAP THE TWO GLOWING ENDS' : ''; sayDraw();
    $('#fl').hidden = !(FLOPEN || FL.run || FL.ok || (W.k === 'flash' && !BT.run)); }
  $('#na').addEventListener('click', function (e) { var b = e.target.closest('[data-act]'); if (!b || !BN) return; var a = b.dataset.act;
    if (a === 'add') { TRAY = { ids: WANT.ids, power: !!WANT.power }; benchDraw(); return; }
    if (a === 'undo') { var i = power().J.map(function (r) { return r.ok; }).lastIndexOf(false); if (i >= 0) BN.j.splice(i, 1); benchDraw(); benchSave(''); return; }
    if (a === 'on' || a === 'wifi') { bootStep(a === 'on' ? 'boot' : 'wifi'); return; }
    if (a === 'pair') { bootStep('pair'); return; }
    if (a === 'roll') { BN.m = 0; benchDraw(); benchSave('✓ NEW ROLL'); return; }
    if (a === 'print') { $('#test').click(); return; }
    if (a === 'home') { homeGo(); return; }
    if (a === 'real') { $('#xd').open = true; $('#bd').open = true; look($('#bd'), 'center'); } });
  function why(id) { var w = $('#bnw'), e = $('#' + id); if (w.dataset.of === id || !e.title) { w.textContent = ''; w.dataset.of = ''; } else { w.textContent = e.title; w.dataset.of = id; } if (BN) dayDraw(power()); }
  $('#bnp').addEventListener('click', function () { why('bnp'); });
  function benchSave(say) { if (say != null) { FB = say; clearTimeout(fbT); if (say) fbT = setTimeout(function () { FB = ''; sayDraw(); }, 3500); } sayDraw(); clearTimeout(bnTimer); bnTimer = setTimeout(function () { api('/api/twin', { method: 'POST', body: JSON.stringify({ bench: BN }) }).then(function (r) { if (T && r && r.mesh != null) T.mesh = r.mesh; radioDraw(); }, function (e) { FB = '× ' + String(e.message || '').toUpperCase(); sayDraw(); }); }, 500); }
  function partAdd(id) { var n = 1; BN.p.forEach(function (x) { n = Math.max(n, +x[0].slice(1) + 1); }); BN.p.push(['p' + n, id]); return 'p' + n; }
  function partOff(iid) { var ko0 = (PART[(BN.p.filter(function (q) { return q[0] === iid; })[0] || [])[1]] || {}).kind; if (BN.o && (BN.o[0] === iid || ko0 === 'pi' || ko0 === 'printer')) BN.o = null; BN.p = BN.p.filter(function (q) { return q[0] !== iid; }); BN.j = BN.j.filter(function (j) { return j[0].split('.')[0] !== iid && j[1].split('.')[0] !== iid; }); BN.f = (BN.f || []).filter(function (q) { return q[0] !== iid; }); if (SEL && SEL.split('.')[0] === iid) SEL = null; }
  /* paper: each print on a ghost's twin takes its length off the roll */
  function paperUse(cv) { if (!BN || !T || !T.ghost || !cv) return; BN.m = Math.min(ROLLMM, (+BN.m || 0) + Math.round(cv.height / MMDOT)); benchDraw(); benchSave(); }
  /* the first time a ghost opens, its bench starts with the parts picked on ISLAND ARCHIPELAGOS; the SD is left for the build to ask for */
  function benchLoad(j) { var gb = $('#bnd'); gb.hidden = !j.ghost; if (!j.ghost || BN) return; BN = j.bench && Array.isArray(j.bench.p) ? { p: j.bench.p.slice(), j: (j.bench.j || []).slice(), f: (j.bench.f || []).slice(), m: +j.bench.m || 0, o: Array.isArray(j.bench.o) ? j.bench.o.slice() : null } : { p: [], j: [], f: [], m: 0, o: null };
    var tray = store.get('da.ghost.build', null), done = store.get('da.ghost.seeded', '');
    if (!TESTQ && !BN.p.length && tray && done !== j.id) { var nameTo = function (n) { if (PART[n]) return n; var m = PARTS.filter(function (p) { return p.kind !== 'cable' && String(p.name).toUpperCase() === String(n).toUpperCase(); })[0]; return m ? m.id : /^(TM-P20|MTP-2|PT-210)$/.test(n) ? 'printer-58' : n === 'SRP-350' ? 'tm-t20' : null; };
      [tray.printers, tray.pi].concat(Array.isArray(tray.power) ? tray.power : []).forEach(function (n) { var id = n && nameTo(n); if (id && !BN.p.some(function (x) { return x[1] === id; })) partAdd(id); });
      store.set('da.ghost.seeded', j.id); if (BN.p.length) benchSave(); }
    benchDraw(); if (location.hash === '#bench') setTimeout(function () { gb.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 300); }
  /* a join made: by two taps, or by dragging from one port to another */
  function joinTo(a, pid) { var there = BN.j.filter(function (j) { return (j[0] === a && j[1] === pid) || (j[1] === a && j[0] === pid); })[0]; SEL = null;
    if (there) { BN.j = BN.j.filter(function (j) { return j !== there; }); benchDraw(); benchSave(); return; }
    if (BN.j.length >= 24) { benchDraw(); FB = 'FULL'; sayDraw(); return; }
    var r = joinOf(a, pid); if (!r.ok) { SEL = a; NOPE = pid; var w = $('#bnw'); w.textContent = r.why; w.dataset.of = 'no'; FB = '× NO FIT'; clearTimeout(fbT); fbT = setTimeout(function () { FB = ''; NOPE = null; if (w.dataset.of === 'no') { w.textContent = ''; w.dataset.of = ''; } sayDraw(); }, 3200); benchDraw(); return; }
    BN.j.push([a, pid]); if ($('#bnw').dataset.of === 'no') { $('#bnw').textContent = ''; $('#bnw').dataset.of = ''; } NOPE = null; benchDraw(); benchSave('✓ ' + (r.cable ? String(r.cable.name).toUpperCase() : 'IN')); }
  $('#bnd').addEventListener('click', function (e) { if (!BN) return; if (DRAG && DRAG.moved) return; var t = e.target.closest('[data-port],[data-cut],[data-part],[data-off],[data-want],[data-body],[data-more]'); if (!t) return; if (t.dataset.more) { TRAY.all = true; trayDraw(); return; }
    if (t.dataset.want) { TRAY = TRAY && !TRAY.iid ? null : { ids: WANT.ids, power: !!WANT.power }; $('#bnw').textContent = ''; $('#bnw').dataset.of = ''; benchDraw(); return; }
    if (t.dataset.off) { partOff(t.dataset.off); TRAY = null; benchDraw(); benchSave(); return; }
    if (t.dataset.part) { var id = t.dataset.part;
      if (TRAY && TRAY.iid) { var here = BN.p.filter(function (q) { return q[0] === TRAY.iid; })[0]; if (here && here[1] !== id) { if (/^(pi|printer|sd)$/.test(PART[here[1]].kind)) BN.o = null; here[1] = id; BN.j = BN.j.filter(function (j) { return j[0].split('.')[0] !== here[0] && j[1].split('.')[0] !== here[0]; }); } }
      else if (BN.p.length < 12) { partAdd(id); if (id === 'wall-strip' && ofKind('printer').some(function (y) { return (PART[y[1]].ports || []).some(function (o) { return o.role === 'in' && o.volts === 24; }); }) && !BN.p.some(function (y) { return y[1] === 'ps-180'; })) partAdd('ps-180'); }
      TRAY = null; benchDraw(); benchSave('✓ ' + String(PART[id].name).toUpperCase()); return; }
    if (t.dataset.cut) { BN.j.splice(+t.dataset.cut, 1); benchDraw(); benchSave(); return; }
    if (t.dataset.body) { var x = BN.p.filter(function (q) { return q[0] === t.dataset.body; })[0], p = x && PART[x[1]]; if (!p) return;
      if (WANT.k === 'paper' && WANT.iid === x[0]) { BN.m = 0; benchDraw(); benchSave('✓ NEW ROLL'); return; }
      if (WANT.k === 'done' && WANT.iid === x[0]) { $('#test').click(); return; }
      if (WANT.k === 'pair' && WANT.iid === x[0]) { bootStep('pair'); return; }
      if (/^(boot|wifi)$/.test(WANT.k) && WANT.iid === x[0]) { bootStep(WANT.k); return; }
      if (BT.run) return;
      if (p.kind === 'sd') { if (WANT.k === 'flash' && WANT.iid === x[0]) { FLOPEN = true; FL.sd = x[0]; } else FLOPEN = !FLOPEN; TRAY = null; benchDraw(); if (FLOPEN) setTimeout(function () { look($('#fl')); }, 50); return; }
      TRAY = TRAY && TRAY.iid === x[0] ? null : { ids: idsOf(p.kind), iid: x[0] }; benchDraw(); var bw = $('#bnw'); bw.textContent = TRAY ? job(p) + ' · ' + (p.about || p.name) : ''; bw.dataset.of = TRAY ? 'part' : ''; return; }
    var pid = t.dataset.port;
    if (!SEL || SEL.split('.')[0] === pid.split('.')[0]) { SEL = SEL === pid ? null : pid; FB = ''; benchDraw(); return; }
    joinTo(SEL, pid); });
  $('#bnd').addEventListener('keydown', function (e) { var t = (e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('[data-port],[data-cut],[data-want],[data-body]'); if (!t) return; e.preventDefault();
    var k = ['port', 'body', 'want'].filter(function (a) { return t.dataset[a]; })[0], v = k && t.dataset[k]; t.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    if (k && !D.activeElement.closest('#bnd .bench')) { var n = D.querySelector('#bnv [data-' + k + '="' + v + '"]') || D.querySelector('#bnv .gh') || D.querySelector('#bnv .pt.want'); if (n) n.focus(); } });
  /* a cable drawn by hand: press on a port, pull to another, let go */
  var DRAG = null, SNAPPX = 48;
  var nearPort = function (x, y, from) { var best = null, bd = SNAPPX; $$('#bnv [data-port]').forEach(function (t) { if (t.dataset.port.split('.')[0] === from.split('.')[0]) return; var c = t.querySelector('circle:not(.ph)'), r = c && c.getBoundingClientRect(); if (!r || !r.width) return;
      var d = Math.hypot(r.left + r.width / 2 - x, r.top + r.height / 2 - y); if (d < bd) { bd = d; best = t; } }); return best; };
  $('#bnv').addEventListener('pointerdown', function (e) { var t = e.target.closest('[data-port]'); if (!t || !BN) return; var svg = $('#bnv'), m = svg.getScreenCTM(); if (!m) return; var c = t.querySelector('circle:not(.ph)');
    DRAG = { from: t.dataset.port, x0: e.clientX, y0: e.clientY, moved: false, a: [+c.getAttribute('cx'), +c.getAttribute('cy')], line: null, id: e.pointerId }; });
  $('#bnv').addEventListener('pointermove', function (e) { if (!DRAG || e.pointerId !== DRAG.id) return; if (!DRAG.moved && Math.hypot(e.clientX - DRAG.x0, e.clientY - DRAG.y0) < 8) return;
    var svg = $('#bnv'), m = svg.getScreenCTM().inverse(), p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; p = p.matrixTransform(m);
    if (!DRAG.moved) { DRAG.moved = true; try { svg.setPointerCapture(e.pointerId); } catch (er) { /* fine */ } SEL = DRAG.from; benchDraw(); DRAG.line = el('path', { 'class': 'cbd' }); svg.appendChild(DRAG.line); }
    var nt = nearPort(e.clientX, e.clientY, DRAG.from), nc = nt && nt.querySelector('circle:not(.ph)'); if (nc) { p = { x: +nc.getAttribute('cx'), y: +nc.getAttribute('cy') }; }
    if (DRAG.near !== nt) { if (DRAG.near) DRAG.near.classList.remove('near'); if (nt) nt.classList.add('near'); DRAG.near = nt; }
    DRAG.line.setAttribute('d', 'M' + DRAG.a[0] + ' ' + DRAG.a[1] + ' Q' + DRAG.a[0] + ' ' + ((DRAG.a[1] + p.y) / 2 + 20) + ' ' + p.x + ' ' + p.y); e.preventDefault(); });
  var dragEnd = function (e) { if (!DRAG || e.pointerId !== DRAG.id) return; var d = DRAG; if (d.line) d.line.remove();
    if (d.moved) { var over = D.elementFromPoint(e.clientX, e.clientY), t = (over && over.closest && over.closest('[data-port]')) || nearPort(e.clientX, e.clientY, d.from); SEL = null; if (d.near) d.near.classList.remove('near'); if (t && t.dataset.port.split('.')[0] !== d.from.split('.')[0]) { joinTo(d.from, t.dataset.port); if (SEL) { SEL = null; benchDraw(); } } else benchDraw(); setTimeout(function () { DRAG = null; }, 0); }
    else DRAG = null; };
  $('#bnv').addEventListener('pointerup', dragEnd); $('#bnv').addEventListener('pointercancel', function (e) { if (DRAG && DRAG.line) DRAG.line.remove(); DRAG = null; SEL = null; benchDraw(); });

  /* ───────── FLASH: an SD on the bench written with Island OS as the Raspberry Pi Imager writes it. DEVICE, OS, STORAGE, SETTINGS,
     WRITE (then VERIFY, then EJECT). The OS is the latest release as the real Imager lists it (/api/os); the write takes the time a
     real one would at 20 MB/s, and its check 40 MB/s, both twenty times faster, with a skip. The Wi-Fi stays on this screen ───────── */
  var FL = { dev: '', sd: '', name: '', ssid: '', pw: '', cc: 'AU', run: null, ok: '' }, OS;
  var gb = function (n) { return n >= 1e9 ? (n / 1e9).toFixed(1) + ' GB' : Math.round(n / 1e6) + ' MB'; };
  function osGet() { if (OS !== undefined) return; OS = null; var kept = store.get('da.os', null);
    fetch('/api/os').then(function (r) { return r.json(); }).then(function (j) { OS = j.os || (kept ? Object.assign({}, kept, { kept: true }) : false); if (j.os) store.set('da.os', j.os); flDraw(); }, function () { OS = kept ? Object.assign({}, kept, { kept: true }) : false; flDraw(); }); }
  function flashedOf(iid) { return (BN.f || []).filter(function (x) { return x[0] === iid; })[0]; }
  function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32) || 'island'; }
  var sdSize = function (iid) { var x = BN.p.filter(function (q) { return q[0] === iid; })[0]; return x ? (+(/(\d+)/.exec(PART[x[1]].id) || [])[1] || 0) * 1e9 : 0; };
  function flDraw() { var host = $('#fl'); if (!host || !BN || host.hidden) return; osGet(); var of = function (k) { return BN.p.filter(function (x) { return PART[x[1]] && PART[x[1]].kind === k; }); }, pis = of('pi'), sds = of('sd');
    if (FL.dev && !pis.some(function (x) { return x[0] === FL.dev; })) FL.dev = ''; if (FL.sd && !sds.some(function (x) { return x[0] === FL.sd; })) FL.sd = '';
    if (!FL.dev && pis.length) FL.dev = pis[0][0]; if ((!FL.sd || (WANT && WANT.k === 'flash' && WANT.iid !== FL.sd)) && sds.length) FL.sd = WANT && WANT.k === 'flash' ? WANT.iid : sds[0][0];
    var nm = function (iid) { var x = BN.p.filter(function (q) { return q[0] === iid; })[0]; return x ? String(PART[x[1]].name).toUpperCase() : '—'; };
    var had = FL.sd && flashedOf(FL.sd), small = !!(OS && FL.sd && sdSize(FL.sd) * 0.93 < OS.size);
    var row = function (k, lab, val, n, bad, tip) { return '<button type="button" data-pick="' + k + '"' + (n > 1 && !FL.run ? '' : ' disabled') + (bad ? ' class="x"' : '') + ' title="' + esc(tip) + '"><i>' + lab + '</i><b>' + esc(val) + '</b></button>'; };
    $('#fls').innerHTML = row('dev', 'DEVICE', nm(FL.dev), pis.length, false, 'The Pi it is for') +
      row('os', 'OS', OS ? 'ISLAND OS ' + OS.version : OS === false ? 'OFFLINE' : '· · ·', 1, OS === false, OS ? gb(OS.download) + ' to download, ' + gb(OS.size) + ' written · for ' + (OS.devices || []).join(', ') + (OS.kept ? ' · offline: the last one seen' : '') : 'Island OS, as the Raspberry Pi Imager lists it') +
      row('sd', 'STORAGE', nm(FL.sd) + (had ? ' · ' + had[1] : ''), sds.length, small, small ? 'Too small for ' + gb(OS.size) : had ? 'Has Island OS ' + had[1] + ': writing again erases it' : 'Empty');
    var fm = $('#flf'), nf = fm.elements.namedItem('name'); fm.hidden = !!(FL.run || FL.ok); if (!nf.value) nf.value = FL.name || slug(T && T.name);
    var wr = fm.querySelector('[data-write]'); wr.disabled = !OS || !FL.dev || !FL.sd || small; wr.textContent = had ? 'WRITE AGAIN' : 'WRITE';
    $('#flp').innerHTML = FL.run ? '<div class="bar' + (FL.run.v ? ' v' : '') + '"><i style="width:' + Math.round(FL.run.pc) + '%"></i></div><div class="row"><p class="say" id="flsay">' + FL.run.say + '</p><button type="button" data-skip="1" title="Straight to the end">SKIP</button></div>'
      : FL.ok ? '<p class="ok">WRITTEN · ' + esc(FL.ok) + '</p>' : ''; }
  /* the write, as long as a real one at 20 MB/s, its check at 40 MB/s, each twenty times faster */
  function flWrite() { var size = OS.size || 3e9, w = size / 20e6 / 20 * 1000, v = size / 40e6 / 20 * 1000, t0 = performance.now(), sd = FL.sd, ver = OS.version, name = FL.name;
    FL.run = { pc: 0, say: 'WRITING 0%' }; benchDraw();
    var tick = function () { if (!FL.run) return; var t = performance.now() - t0 + FL.run.skip;
      if (t < w) { FL.run.pc = t / w * 100; FL.run.say = 'WRITING ' + Math.floor(FL.run.pc) + '% · ' + gb(size * t / w) + ' · 20 MB/S'; }
      else if (t < w + v) { FL.run.pc = (t - w) / v * 100; FL.run.say = 'CHECKING ' + Math.floor(FL.run.pc) + '%'; if (!FL.run.v) { FL.run.v = true; var br = $('#flp .bar'); if (br) br.classList.add('v'); } }
      else { FL.run = null; FL.ok = ver; FLOPEN = false; BN.f = (BN.f || []).filter(function (x) { return x[0] !== sd; }).concat([[sd, ver, name]]); if (BN.o && BN.o[0] === sd) BN.o = null; benchDraw(); benchSave('✓ WRITTEN'); flSlip(sd, ver);
        setTimeout(function () { FL.ok = ''; benchDraw(); }, 1800); return; }
      var sf = $('#sdf'); if (sf) { var wr = t < w, h = 54 * FL.run.pc / 100; sf.setAttribute('class', 'sdf' + (wr ? '' : ' v')); sf.setAttribute('y', wr ? 74 - h : 20 + h); sf.setAttribute('height', wr ? h : 1.6); }
      var b = $('#flp .bar i'), s = $('#flsay'); if (b && s) { b.style.width = FL.run.pc.toFixed(1) + '%'; s.textContent = FL.run.say; } else flDraw(); setTimeout(tick, 100); };
    FL.run.skip = 0; FL.run.end = w + v; tick(); }
  /* the settings, printed on the twin as the island will print them on its first start */
  function flSlip(sd, ver) { var x = BN.p.filter(function (q) { return q[0] === sd; })[0], d = BN.p.filter(function (q) { return q[0] === FL.dev; })[0];
    var L = ['ISLAND OS ' + ver, 'NAME ' + FL.name, 'WI-FI ' + (FL.ssid || '-'), 'PASSWORD ' + (FL.pw ? '********' : '-'), 'COUNTRY ' + FL.cc, (x ? PART[x[1]].name : 'SD') + ' VERIFIED', 'FOR ' + (d ? PART[d[1]].name : 'PI'), 'SHA ' + (OS.sha || '')];
    var u = textSlip(L.map(function (s) { return String(s).replace(/[^\x20-\x7E]/g, ''); })), cv = draw(u, paperOf()); shown('f' + Date.now(), cv, 'FLASH', true, true, 'Island OS ' + ver + ' written'); paperUse(cv); seen(cv); if (OUT) OUT.write(u).catch(function () { /* the screen keeps it */ }); }
  $('#fl').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b || b.disabled || !BN) return; var d = b.dataset;
    var next = function (k, cur) { var xs = BN.p.filter(function (x) { return PART[x[1]] && PART[x[1]].kind === k; }).map(function (x) { return x[0]; }); return xs[(xs.indexOf(cur) + 1) % xs.length] || cur; };
    if (d.pick === 'dev') FL.dev = next('pi', FL.dev); else if (d.pick === 'sd') FL.sd = next('sd', FL.sd);
    else if (d.skip) { if (FL.run) FL.run.skip = FL.run.end; return; } else return; flDraw(); });
  $('#flf').addEventListener('submit', function (e) { e.preventDefault(); if (FL.run || !OS || !FL.sd) return; var f = e.target, v = function (n) { return String(f.elements.namedItem(n).value || ''); };
    FL.name = slug(v('name')); FL.ssid = v('ssid').slice(0, 32); FL.pw = v('pw'); FL.cc = (v('cc') || 'AU').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || 'AU';
    var had = flashedOf(FL.sd); if (had && !confirm('Everything on the card is erased. Write Island OS ' + OS.version + ' again?')) return; FL.ok = ''; flWrite(); });

  /* ───────── BOOT: the first start, as a real island makes it (kit/island). The red light, the green one reading the SD, the lines it
     logs, the slips it prints: its test strip, the setup Wi-Fi with its QR, then on Wi-Fi its pair code. A ghost's code pairs nothing ───────── */
  var BT = { run: null, lines: [] }, ABC = 'abcdefghijkmnpqrstuvwxyz23456789';
  function seeded(n, salt) { var h = 2166136261, s = String(T ? T.id : 'ghost') + salt, o = '', i; for (i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    for (i = 0; i < n; i++) { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; o += ABC[h % ABC.length]; } return o; }
  var showCode = function (c) { return c.slice(0, 4) + '-' + c.slice(4); }, isleNm = function () { return String(T ? T.name : 'island').toUpperCase(); };
  var setupSSID = function () { return isleNm().slice(0, 26) + ' SETUP'; }, setupPass = function () { return seeded(10, 'setup'); }, pairCode = function () { return seeded(8, 'pair').toUpperCase(); };
  /* a slip set as the island sets it: centred, bold name, big lines, QR codes and the test strip's dots */
  function paperOf() { var pr = BN && T && T.ghost ? ofKind('printer')[0] : null, p = pr && PART[pr[1]]; return p && p.paper ? String(p.paper) : T ? String(T.paper || '80') : '80'; }
  function Slip() { var o = [0x1B, 0x40], W = paperOf() === '58' ? 384 : 512, S = {
    t: function (s) { s = String(s); for (var i = 0; i < s.length; i++) o.push(s.charCodeAt(i) & 0x7F); o.push(0x0A); return S; },
    c: function () { o.push(0x1B, 0x61, 1); return S; }, l: function () { o.push(0x1B, 0x61, 0); return S; },
    b: function (on) { o.push(0x1B, 0x45, on ? 1 : 0); return S; }, big: function (on) { o.push(0x1D, 0x21, on ? 0x11 : 0); return S; }, feed: function (n) { o.push(0x1B, 0x64, n); return S; },
    head: function (name) { return S.c().b(true).t(name).b(false).feed(1); },
    qr: function (d, m) { var L = d.length + 3; o.push(0x1D, 0x28, 0x6B, 3, 0, 0x31, 0x43, m, 0x1D, 0x28, 0x6B, L & 255, L >> 8, 0x31, 0x50, 0x30); for (var i = 0; i < d.length; i++) o.push(d.charCodeAt(i) & 0x7F); o.push(0x1D, 0x28, 0x6B, 3, 0, 0x31, 0x51, 0x30); return S; },
    img: function (h, black) { var bw = W >> 3; o.push(0x1D, 0x76, 0x30, 0, bw & 255, bw >> 8, h & 255, h >> 8); for (var y = 0; y < h; y++) for (var xb = 0; xb < bw; xb++) { var v = 0; for (var k = 0; k < 8; k++) if (black(xb * 8 + k, y, W)) v |= 0x80 >> k; o.push(v); } return S; },
    rule: function (h) { return S.img(h, function () { return true; }); },
    cut: function () { o.push(0x1B, 0x64, 4, 0x1D, 0x56, 0x42, 0); return new Uint8Array(o); } }; return S; }
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function stripDots(x, y, w) { if (y < 40) return x < w / 4 || (x < w / 2 && x % 2 === 0) || (x < 3 * w / 4 && x % 4 < 2) || (x >= 3 * w / 4 && x % 8 < 4); if (y < 44) return false;
    if (y < 84) { var band = Math.floor(x * 8 / w); return (x + y) % (8 - band) === 0; } if (y < 88) return false; return BAYER[(y % 4) * 4 + x % 4] * 16 + 8 < x * 255 / w; }
  var SLIPS = {
    strip: function () { return Slip().head(isleNm()).t('TEST STRIP').img(160, stripDots).feed(1).l().t('A  abcdefghijklmnopqrstuvwxyz 0123456789').b(true).t('BOLD  ABCDEFGHIJ').b(false).big(true).t('BIG  ABC').big(false).c().qr('https://novel.global', 6).t("A CRISP CODE SCANS FROM ARM'S LENGTH").cut(); },
    welcome: function () { return Slip().feed(1).c().t('novel.global').feed(1).rule(6).b(true).big(true).t(isleNm().slice(0, 20)).big(false).b(false).rule(6).feed(2).b(true).big(true).t(setupPass()).big(false).b(false).feed(1).t('IP: 10.42.0.1').qr('GHOST ' + setupSSID(), 7).rule(2).feed(1).cut(); },
    wifi: function (net) { return Slip().head(isleNm()).t('ON WI-FI').t(net).cut(); },
    pair: function () { return Slip().head(isleNm()).big(true).t(showCode(pairCode())).big(false).feed(1).t('SCAN TO APPROVE ON NOVEL.GLOBAL').feed(1).qr('GHOST ' + showCode(pairCode()), 6).cut(); },
    paired: function () { return Slip().head(isleNm()).t('PAIRED').t(String(T.id).toUpperCase() + ' ON NOVEL.GLOBAL').t('READY TO PRINT').cut(); },
    /* the birth: the first slip a ghost prints, its name, its number and its key (the key opens it on any screen; the site keeps only its hash) */
    born: function () { return Slip().feed(1).c().t('novel.global').feed(1).rule(6).b(true).big(true).t(isleNm().slice(0, 20)).big(false).t('GHOST' + (T.number ? ' ' + T.number : '')).b(false).rule(6).feed(1).qr(location.origin + '/twin#k=' + KEY, 6).feed(1).t(KEY).cut(); },
    /* the set-up's reward: this phone's code, now its own */
    reward: function (who) { return Slip().feed(1).c().t('novel.global').feed(1).rule(6).t('YOUR CODE').b(true).big(true).t(who).big(false).b(false).t(isleNm().slice(0, 20).toUpperCase() + ' IS ON').rule(6).cut(); },
    /* a ghost become real: its printer took over */
    real: function () { return Slip().feed(1).c().t('novel.global').feed(1).rule(6).b(true).big(true).t(isleNm().slice(0, 20)).big(false).t('ISLAND' + (T.number ? ' ' + T.number : '')).b(false).rule(6).feed(1).t('REAL').cut(); } };
  var SAY = { reward: function (w) { return 'Your code ' + w; }, strip: 'Test strip', welcome: function () { return 'Setup Wi-Fi ' + setupSSID() + ', slip key ' + setupPass(); }, wifi: function (n) { return 'On Wi-Fi ' + n; }, pair: function () { return 'Pair code ' + showCode(pairCode()); }, paired: 'Paired, ready to print', born: function () { return isleNm() + ' · ghost' + (T.number ? ' ' + T.number : ''); }, real: function () { return isleNm() + ' · real'; } };
  var TICKED = { born: 1, strip: 1, welcome: 1, pair: 1 };
  /* ───────── the reward: a ghost built, switched on and paired gives this phone's code, made real (the site says GHOST beside it). With
     proof of presence on, the code waits for a printer. Either way it is shown to keep: a screenshot, or a picture downloaded ───────── */
  var SITE = null; function site() { return SITE || (SITE = fetch('/api/settings', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })); }
  var WHO_RE = /^(?:[A-HJ-NP-Z2-9]{3}|[A-HJ-NP-Z2-9]{6})$/, RWB = false;
  function whoNew(n) { var C = 'ABCDEFGHJKMNPQRSTVWXYZ23456789', c = '', r = new Uint8Array(n);
    for (var t = 0; t < 50; t++) { crypto.getRandomValues(r); c = ''; for (var i = 0; i < n; i++) c += C[r[i] % 30]; if (/[A-Z]/.test(c) && /[2-9]/.test(c) && c !== '888') break; } return c; }
  function reward(again) { if (!T || !T.ghost || TESTQ || RWB) return; RWB = true;
    site().then(function (st) { var who = store.get('da.who', ''); if (!WHO_RE.test(who) || who === '888') { who = whoNew(+st.codeLen === 6 ? 6 : 3); store.set('da.who', who); store.set('da.who.at', Date.now()); }
      return api('/api/twin', { method: 'POST', body: JSON.stringify({ reward: who }) }).then(function (j) { RWB = false; store.set('da.twin.rw.' + T.id, who);
        store.set('da.who.ok', 1); store.set('da.who.via', j.via || 'ghost'); if (j.home) store.set('da.who.home', j.home); if (j.kin != null) store.set('da.kin', j.kin);
        bootSlip('reward', who); keepShow('code', who, j.via); }, function (e) { RWB = false;
        if (e.status === 409 && e.message === 'not on' && !again) { setTimeout(function () { reward(true); }, 2500); return; }
        if (e.status === 403) { store.set('da.twin.rw.' + T.id, who); keepShow('pop', who); }
        if (e.status === 409 && e.message === 'given') store.set('da.twin.rw.' + T.id, '-'); }); }); }
  function keepShow(k, who, via) { var box = $('#keep'); if (!box || !T) return;
    site().then(function (st) { var N = window.CARDART ? CARDART.notes(st) : { key: '', keep: '', reward: '', pop: '' }, key = k === 'key';
      box.classList.toggle('long', key); $('#kh').textContent = key ? 'YOUR ISLAND’S KEY' : 'YOUR CODE' + (k === 'code' ? ' · ' + (via === 'print' ? 'PRINTED' : 'GHOST') : '');
      $('#kb').textContent = key ? KEY : who; $('#kt').textContent = key ? N.key : k === 'pop' ? N.pop : N.reward; $('#kk').textContent = N.keep;
      box.hidden = false; box.dataset.k = k; box._o = key ? { label: 'Island key', big: KEY, sub: [isleNm().toUpperCase() + (T.number ? ' · GHOST ' + T.number : ''), 'Opens the island on novel.global'], file: 'novel-global-key-' + String(T.id).slice(0, 24) }
        : { label: 'Your code', big: who, sub: [k === 'pop' ? 'BRING IT TO A PRINTER' : 'GHOST · ' + isleNm().toUpperCase(), 'Opens your home on novel.global'], file: 'novel-global-code-' + who };
      setTimeout(function () { look(box, 'start'); }, 300); }); }
  $('#kdl').addEventListener('click', function () { var o = $('#keep')._o; if (o && window.CARDART) CARDART.save(o); });
  $('#kx').addEventListener('click', function () { $('#keep').hidden = true; });
  function bootSlip(name) { var a = [].slice.call(arguments, 1), u = SLIPS[name].apply(null, a), cv = draw(u, paperOf()), tk = TICKED[name] && tickOver(cv), say = typeof SAY[name] === 'function' ? SAY[name].apply(null, a) : SAY[name];
    shown('b' + name + Date.now(), cv, '', true, true, say); paperUse(cv); seen(cv); if (OUT) OUT.write(u).catch(function () { /* the screen keeps it */ }); }
  /* the log: the last five lines, like the island's own journal */
  var stamp = function (s) { return s; };
  function bootLog(s) { BT.lines.push(s); BT.lines = BT.lines.slice(-40); var l = $('#bnlog'); l.hidden = false; l.innerHTML = BT.lines.slice(-5).map(function (x, i, a) { return '<li' + (i === a.length - 1 ? ' class="nl"' : '') + (/^×/.test(x) ? ' data-err="1"' : '') + '>' + esc(x.replace(/^× /, '')) + '</li>'; }).join(''); }
  /* the steps play at their own pace (a real Pi 3 A+ takes about 25 s to its island; here a fifth of that), a tap on the log skips */
  function bootRun(steps, done) { var i = 0; BT.run = {}; benchDraw(); riteDraw(); var lg = $('#bnlog'); lg.hidden = false; setTimeout(function () { look(lg); }, 60);
    var next = function () { if (i >= steps.length) { BT.run = null; benchDraw(); riteDraw(); setTimeout(function () { if (!BT.run) $('#bnlog').hidden = true; }, 2600); if (!LAMP) look($('.bench .pt.want') || $('#dock'), 'center'); if (done) done(); return; } var s = steps[i++];
      BT.run.go = function () { BT.run.go = null; var bad = bootBad(); if (bad) { bootLog('× ' + bad); BT.run = null; benchDraw(); riteDraw(); return; } if (s[1] === false) { BT.run = null; benchDraw(); riteDraw(); return; } if (typeof s[1] === 'string') bootLog(/^K:/.test(s[1]) ? stamp(s[1].slice(2)) : s[1]); else s[1](); next(); };
      BT.run.t = setTimeout(BT.run.go, BT.run.skip ? 40 : s[0]); };
    next(); }
  /* what stops a start: the Pi without power, its SD out of the slot or not written */
  function bootBad() { var P = power(), pi = ofKind('pi')[0], sd = ofKind('sd').filter(function (y) { return portIds(y, 'card').some(inUse); })[0];
    return !pi || !P.on[pi[0]] ? 'power lost' : !sd || !flashedOf(sd[0]) ? 'no SD in the slot' : ''; }
  function bootStep(k) { if (BT.run || !BN) return; FLOPEN = false; var P = power(), sd = ofKind('sd').filter(function (y) { return portIds(y, 'card').some(inUse); })[0], f = sd && flashedOf(sd[0]), nm = f ? f[2] : slug(T && T.name), ver = f ? f[1] : '';
    var keep = function (n) { BN.o = [sd[0], ver, n]; benchSave(n === 3 ? 'ON' : ''); if (n === 3) setTimeout(reward, 1400); };
    if (k === 'boot') { BT.lines = []; BT.t0 = 0; var bad = P.J.filter(function (r, i) { return !r.ok && [BN.j[i][0], BN.j[i][1]].some(function (e) { var q = portOf(e); return q && /^(pi|printer)$/.test(q.part.kind); }); })[0];
      var S = [[200, 'K:Booting Linux on physical CPU 0x0'], [700, 'K:mmc0: new high speed SDHC card at address aaaa'], [600, 'K:EXT4-fs (mmcblk0p2): mounted filesystem']];
      /* what is wrong on the bench stops it here, as it would stop the real one */
      if (bad) S.push([500, '[  OK  ] Started island.service'], [400, 'island ' + ver + ': ' + nm + ', not set up yet'], [300, '× no slip: ' + bad.why.toLowerCase()], [0, false]);
      else S.push([500, '[  OK  ] Started island.service'], [400, 'island ' + ver + ': ' + nm + ', not set up yet'], [300, 'paper ' + (T.paper || '80') + ' mm'],
        [500, function () { bootSlip('strip'); }], [1600, 'the setup Wi-Fi is open: ' + setupSSID()], [400, function () { bootSlip('welcome'); keep(1); }]);
      bootRun(S); }
    if (k === 'wifi') { var net = FL.ssid || nm + ' home';
      bootRun([[300, 'chosen: ' + nm + ', online, Wi-Fi "' + net + '"'], [1400, function () { bootSlip('wifi', net); }], [900, 'pairing code ' + showCode(pairCode()) + ' for https://novel.global'], [500, function () { bootSlip('pair'); keep(2); }]]); }
    if (k === 'pair') bootRun([[300, 'paired as ' + T.id + ' on https://novel.global'], [700, function () { bootSlip('paired'); keep(3); }]]); }
  $('#bnlog').addEventListener('click', function () { if (BT.run && BT.run.go) { BT.run.skip = true; clearTimeout(BT.run.t); BT.run.go(); } });
  $('#bnlog').addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.click(); } });

  /* ───────── the rite: five stations on the sun's path, lit as the island is made ───────── */
  var RITE = [['PARTS', 'A printer, its brain (a Pi) and the cable between them'], ['SD', 'Island OS written on its memory card, the card in the Pi'], ['POWER', 'Power to every part'], ['START', 'Switched on, on Wi-Fi, its code approved'], TESTQ ? ['MOVE', 'What works here, moved to its real island'] : ['HOME', 'Its home: its connections, its cards, what it makes']];
  var RLIT = null, BOPEN = false;
  /* the finished island: a small smoked device. Its name and its light on the glass (a word only when it is asleep or offline; a ghost's,
     tapped, goes offline). PRINT prints, HOME goes home; RADIO and JOINS open what they are just under it, and close again */
  var DRW = null, PANES = ['jd', 'rd'];
  var KEYS = [['print', 'PRINT', 'A test strip'], ['radio', 'RADIO', 'Lines in and out'], ['joins', 'JOINS', 'Islands that echo its prints, or lend it cards'], ['home', 'HOME', 'Its home']];
  function devDraw(P, live) { var d = $('#dev'), tw = $('#twin'), bd = $('#body'), top = $('.top .id'); if (!d) return;
    if (!live || !BN || !T) { d.hidden = true; tw.classList.remove('dv'); if (bd.parentNode !== top) top.appendChild(bd); if (DRW) { DRW = null; drawerDraw(); } return; }
    var L = layout(), left = Math.max(0, 1 - (+BN.m || 0) / ROLLMM), gain = { print: Math.round(left * ROLLMM / 1000) + ' m of paper · about ' + Math.round(left * ROLLMM / 160) + ' receipts' };
    if (!d.dataset.built) { d.innerHTML = '<div class="dtop"><div class="dsc"><b class="dnm"></b></div></div>' +
      '<div class="dkeys">' + KEYS.map(function (k) { return '<button type="button" class="ky" data-go="' + k[0] + '"' + (k[0] === 'radio' || k[0] === 'joins' ? ' aria-expanded="false"' : '') + '><i aria-hidden="true"></i><b>' + k[1] + '</b></button>'; }).join('') + '</div><i class="slot" aria-hidden="true"></i>'; d.dataset.built = '1'; }
    var sc = d.querySelector('.dsc'); if (bd.parentNode !== sc) sc.appendChild(bd);
    d.querySelector('.dnm').textContent = T.name; BOPEN = false;
    d.hidden = false; tw.classList.add('dv'); d.dataset.parts = BN.p.filter(function (x) { return PART[x[1]] && L.pos[x[0]]; }).length; d.classList.remove('back');
    KEYS.forEach(function (k) { var g = d.querySelector('[data-go=' + k[0] + ']'); g.title = k[2] + (gain[k[0]] ? ' · ' + gain[k[0]] : ''); });
    d.querySelector('[data-go=home]').classList.toggle('lit', !store.get('da.twin.home.' + T.id, 0));
    var jk = d.querySelector('[data-go=joins]'); jk.hidden = $('#jd').hidden; d.querySelector('.dkeys').style.gridTemplateColumns = 'repeat(' + (jk.hidden ? 3 : 4) + ', 1fr)';
    if (DRW === 'joins' && jk.hidden) DRW = null; drawerDraw(); }
  /* RADIO or JOINS, the thing itself, moved in under the device */
  function drawerDraw() { var r = $('#ddr'), home = $('#xd .parts'); if (!r) return;
    PANES.forEach(function (id) { var e = $('#' + id); if (e && e.parentNode !== home) home.appendChild(e); });
    $$('#dev .ky[aria-expanded]').forEach(function (g) { g.setAttribute('aria-expanded', String(DRW === g.dataset.go)); });
    var e = DRW && $(DRW === 'radio' ? '#rd' : '#jd'); r.hidden = !e || e.hidden; if (r.hidden) return; e.open = true; r.appendChild(e); }
  /* home: the island's own keeper section; inside the home's sheet, the home itself turns to it */
  function homeGo() { if (T) store.set('da.twin.home.' + T.id, 1); if (IN) { try { window.top.location.hash = 'keeper'; return; } catch (e) { /* not ours */ } } location.href = '/#keeper'; }
  function stageOf(W) { return !W ? 0 : W.k === 'done' || W.k === 'paper' ? 4 : /^(boot|wifi|pair)$/.test(W.k) ? 3 : W.s != null ? W.s : 2; }
  function riteLit() { if (!T) return [false, false, false, false, false]; if (!BN || !WANT) return [true, true, true, true, !!T.paired]; var c = stageOf(WANT); return RITE.map(function (r, i) { return i < 4 ? i < c : TESTQ ? !!T.paired : c >= 4; }); }
  /* the rite's five stations, lit stage by stage (the one Irukandji stays in the home's top bar) */
  function riteDraw() { var s = $('#rite'); if (!s || !T) return; if (!T.ghost) { s.hidden = true; return; } s.hidden = false;
    if (!s.dataset.built) { s.innerHTML = RITE.map(function (r, i) { return '<li class="st" data-rite="' + i + '"><button type="button" title="' + r[0] + ' · ' + r[1] + '"><i></i><b>' + r[0] + '</b></button></li>'; }).join(''); s.dataset.built = '1'; }
    var lit = riteLit(), cur = lit.indexOf(false), n = lit.filter(Boolean).length, was = RLIT || store.get('da.twin.rite.' + T.id + TS, null);
    $$('#rite .st').forEach(function (g, i) { var seal = lit[i] && was && !was[i]; g.className = 'st' + (lit[i] ? ' lit' : '') + (i === cur ? ' now' : '') + (seal ? ' seal' : '');
      g.querySelector('button').setAttribute('aria-label', RITE[i][0] + (lit[i] ? ', done' : i === cur ? ', now' : '')); if (seal) setTimeout(function () { g.classList.remove('seal'); }, 900); });
    var is = $('#isle'); if (is) isleDraw(is, n);
    RLIT = lit; store.set('da.twin.rite.' + T.id + TS, lit); }
  isleDraw($('#isle'), 0);
  function goTo(k) { if (k === 'print') { $('#test').click(); return; } if (k === 'home') { homeGo(); return; }
    if (k === 'radio' || k === 'joins') { DRW = DRW === k ? null : k; drawerDraw(); if (DRW) look($('#ddr'), 'nearest'); return; }
    if (k === 'bench') { BOPEN = !BOPEN; var dv = $('#dev'); dv.classList.remove('turn'); void dv.offsetWidth; dv.classList.add('turn'); benchDraw(); if (BOPEN) look($('#bnd'), 'start'); return; }
  }
  $('#dev').addEventListener('click', function (e) { var g = e.target.closest('[data-go]'); if (g) goTo(g.dataset.go); });
  $('#rite').addEventListener('click', function (e) { var g = e.target.closest('[data-rite]'); if (!g) return; var i = +g.dataset.rite;
    if (i === 4) { homeGo(); return; }
    look($('#bnd'), 'start'); });

  /* ───────── OFFLINE: the island with no internet, as a real one goes when its Wi-Fi drops. The twin stops asking; what is sent waits
     on the site, and comes out once each when it is back ───────── */
  var OFF = false;
  function offDraw() { var b = $('#body'); b.setAttribute('aria-pressed', String(OFF)); b.classList.toggle('off', OFF); if (OFF) { $('#bodyw').textContent = 'OFFLINE'; $('#led').className = 'led'; } else bodyDraw(); }
  $('#body').addEventListener('click', function () { if (!T || !T.ghost) return; OFF = !OFF; clearTimeout(timer); offDraw(); if (!OFF) tick(); });

  /* ───────── the mesh: a T-Beam for the bench; a real Meshtastic radio linked to this screen (mesh.js); a line out ───────── */
  $('#madd').addEventListener('click', function () { if (!BN || ofKind('radio').length || BN.p.length >= 12) return; partAdd('t-beam'); TRAY = null; benchDraw(); benchSave('T-BEAM'); radioDraw(); setTimeout(function () { look($('.bench .po.want') || $('#bnv'), 'center'); }, 60); });
  var mlink = function (how, name) { if (ML.link.on) { if (ML.link.name === name) ML.link.close(); return; } $('#msay').textContent = '· · ·';
    ML[how]().then(function () { $('#msay').textContent = ''; radioDraw(); }, function (e) { $('#msay').textContent = e && e.name === 'NotFoundError' ? '' : '× ' + String(e && e.message || e).slice(0, 48).toUpperCase(); radioDraw(); }); };
  $('#mu').addEventListener('click', function () { mlink('serial', 'USB'); }); $('#mb').addEventListener('click', function () { mlink('ble', 'BLUETOOTH'); });
  if (ML.hear) ML.hear(function (text, who) { if (text == null) { radioDraw(); return; } radio(text, 'in', who); var d = $('#rd'); d.classList.remove('rx'); void d.offsetWidth; d.classList.add('rx'); });
  $('#mf').addEventListener('submit', function (e) { e.preventDefault(); var l = $('#ml').value.trim(); if (!l || !canSay()) return; meshOut(l, true); $('#ml').value = ''; });

  /* ───────── a printer added: the pair code a Pi prints ───────── */
  $('#pf').addEventListener('submit', function (e) { e.preventDefault(); var c = $('#pc').value.toUpperCase().replace(/[^A-Z0-9]/g, ''); if (c.length !== 8) { $('#bsay').textContent = '× 8 LETTERS'; return; }
    /* a ghost's own code, the one its Pi printed: paired here, and nowhere else */
    if (T && T.ghost && BN && c === pairCode()) { $('#pc').value = ''; if (WANT && WANT.k === 'pair') { $('#bsay').textContent = 'PAIRED'; bootStep('pair'); } else $('#bsay').textContent = BN.o && BN.o[2] === 3 ? 'PAIRED' : '× NOT YET'; return; }
    $('#bsay').textContent = '· · ·';
    api('/api/twin', { method: 'POST', body: JSON.stringify({ pair: c }) }).then(function (j) { $('#bsay').textContent = j.waiting ? 'WAIT LIST' : 'PAIRED · THE PI TAKES OVER'; $('#pc').value = ''; setTimeout(tick, 6e3); }, function (er) { $('#bsay').textContent = er.status === 404 ? '× NO SUCH CODE' : er.status === 409 ? '× TAKEN' : '× ' + String(er.message || '').toUpperCase(); }); });
  $('#test').addEventListener('click', function () { var id = 't' + Date.now(), u = SLIPS.strip(), cv = draw(u, paperOf()); shown(id, cv, '', true, false, 'Test strip'); paperUse(cv);
    if (OUT) OUT.write(u).catch(function () { $('#bsay').textContent = '× ' + OUT.name; }); if (canSay()) meshOut('DA-TEST ' + isleNm()); });
  $('#kcopy').addEventListener('click', function () { var b = this; if (navigator.clipboard) navigator.clipboard.writeText(KEY).then(function () { b.textContent = 'COPIED'; }); });
  $('#kout').addEventListener('click', function () { if (!confirm('Forget this island’s key on this screen?')) return; store.set('da.hm.key', ''); store.set('da.twin.roll', []); if (T) { store.set('da.twin.radio.' + T.id, []); store.set('da.twin.radio.' + T.id + '.test', []); } store.set('da.twin.roll.test', []); location.reload(); });

  /* ───────── no key here: start a ghost, or open an island by its key ───────── */
  function gate(say) { $('#twin').hidden = true; $('#gate').hidden = false; if (say) $('#gsay').textContent = say; clearTimeout(timer); }
  $('#gf').addEventListener('submit', function (e) { e.preventDefault(); var n = $('#gn').value.trim(); if (!n) { $('#gn').focus(); return; } $('#gsay').textContent = '· · ·';
    fetch('/api/ghost', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: n }) }).then(function (r) { return r.json().then(function (j) { return { s: r.status, j: j }; }); }).then(function (x) {
      if (x.s === 201 && x.j.key) { KEY = x.j.key; store.set('da.hm.key', KEY); store.set('da.twin.born', x.j.id); open(); } else $('#gsay').textContent = x.s === 202 ? 'WAIT LIST' : x.s === 429 ? 'LATER' : x.s === 403 ? 'CLOSED' : '×'; }, function () { $('#gsay').textContent = 'OFFLINE'; }); });
  $('#kf').addEventListener('submit', function (e) { e.preventDefault(); var k = $('#kk').value.trim(); if (!/^[A-Za-z0-9_-]{16,64}$/.test(k)) return; KEY = k; store.set('da.hm.key', k); open(); });
  function themeSet(on) { var h = D.documentElement; h.classList.toggle('night', on); store.set('da.hm.night', on); var m = $('meta[name="theme-color"]'); if (m) m.content = on ? '#06152A' : '#17457F'; }
  themeSet(D.documentElement.classList.contains('night'));
  $('#theme').addEventListener('click', function () { themeSet(!D.documentElement.classList.contains('night')); });
  var SCQ = 0; addEventListener('scroll', function () { if (SCQ) return; SCQ = requestAnimationFrame(function () { SCQ = 0; var y = scrollY || 0, h = D.documentElement.style; h.setProperty('--sc', y.toFixed(0)); h.setProperty('--gy', (y * .18 % 24).toFixed(1)); }); }, { passive: true });
  function open() { $('#gate').hidden = true; $('#twin').hidden = false; $('#kd').hidden = TESTQ; radioDraw(); tick(); }
  if (KEY) open(); else gate('');
})();

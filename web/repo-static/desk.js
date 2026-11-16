/* the desk: the place hosting a pop-up looks after it here, by its own private link. Its words, logos and picture, open or closed,
   and whether prints are kept (then they show here in colour) or private (then nothing is kept anywhere) */
(function () {
  'use strict';
  var T = window.THERMAL, D = document, $ = function (s) { return D.querySelector(s); };
  var KEY = '', POP = null, POSTS = [], TO = null, PRS = [], NOW = 0;
  var ANIMALS = [['frill', 'FRILLED LIZARD'], ['roo', 'KANGAROO'], ['dingo', 'DINGO'], ['emu', 'EMU'], ['quokka', 'QUOKKA'], ['wombat', 'WOMBAT'], ['echidna', 'ECHIDNA']];
  var ABOUT = 'novel.global is an independent web2print publishing platform built with e-waste and open source technology. It allows you to make and share art, or build your own. This device is on loan from the RMIT Sustainable Innovation Strategies (Fashion and Textiles) school.';
  var store = { get: function (k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* this visit */ } } };
  var api = function (p, o) { return fetch('/api' + p, Object.assign({ headers: { 'content-type': 'application/json' } }, o || {})).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || r.status); e.status = r.status; e.wait = j.wait; throw e; } return j; }); }); };
  function say(t) { $('#say').textContent = t || ''; }
  function link() { return 'https://novel.global/' + (POP.id === 'pickles' ? 'pickles' : 'popup') + '?k=' + encodeURIComponent(POP.key || '') + (POP.id === 'pickles' ? '' : '&p=' + encodeURIComponent(POP.id)); }
  function qr(url, px, m) { var q = window.qrcode(0, 'M'); q.addData(url); q.make(); var n = q.getModuleCount(), c = D.createElement('canvas'); c.width = c.height = (n + m * 2) * px; var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#000';
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) if (q.isDark(y, x)) g.fillRect((x + m) * px, (y + m) * px, px, px); return c; }
  /* a picture made small enough to keep: png for logos (their edges), jpeg for the rest */
  function shrink(file, max, type, cap) { return new Promise(function (res) { var u = URL.createObjectURL(file), im = new Image();
    im.onload = function () { var k = Math.min(1, max / Math.max(im.width, im.height)), c = D.createElement('canvas'), q = 0.84, d; URL.revokeObjectURL(u);
      for (;;) { c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k)); var g = c.getContext('2d'); if (type === 'image/jpeg') { g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); } g.drawImage(im, 0, 0, c.width, c.height); d = c.toDataURL(type, q); if (d.length <= cap || k < 0.08) break; k *= 0.8; q = Math.max(0.5, q - 0.08); }
      res(d.length <= cap ? d : null); };
    im.onerror = function () { res(null); }; im.src = u; }); }
  function pickFile(cb) { var f = D.createElement('input'); f.type = 'file'; f.accept = 'image/*'; f.onchange = function () { if (f.files[0]) cb(f.files[0]); }; f.click(); }

  function logos() { var box = $('#logos'); box.replaceChildren(); (POP.logos || []).forEach(function (lg, i) { var r = D.createElement('div'); r.className = 'lg';
      var im = D.createElement('img'); im.alt = ''; im.src = /^data:/.test(lg.src) ? lg.src : '/' + lg.src; var inp = D.createElement('input'); inp.type = 'url'; inp.placeholder = 'https://'; inp.title = 'Where a tap on it goes'; inp.value = lg.href || ''; inp.oninput = function () { lg.href = inp.value.trim(); };
      var x = D.createElement('button'); x.type = 'button'; x.textContent = '×'; x.title = 'Take it off'; x.onclick = function () { POP.logos.splice(i, 1); logos(); }; r.append(im, inp, x); box.appendChild(r); });
    $('#addlg').hidden = (POP.logos || []).length >= 4; }
  function pim() { var has = /^data:image\//.test(POP.pimg || ''); $('#pim').hidden = !has; if (has) $('#pim').src = POP.pimg; $('#rmpi').hidden = !has; }
  function prints() { var pv = POP.private !== false; [].forEach.call(D.querySelectorAll('[data-pv]'), function (b) { b.setAttribute('aria-pressed', String((b.dataset.pv === '1') === pv)); });
    $('#pnote').textContent = pv ? 'Nothing is kept.' : POSTS.length ? '' : 'None yet.'; $('#wipe').hidden = !POSTS.length;
    var box = $('#posts'); box.replaceChildren(); if (pv) return;
    POSTS.forEach(function (p) { var a = D.createElement('a'), im = D.createElement('img'), t = D.createElement('time'), u = '/api/pop/desk/art/' + encodeURIComponent(p.id) + '?d=' + encodeURIComponent(KEY);
      a.href = u; a.target = '_blank'; a.rel = 'noopener'; im.loading = 'lazy'; im.alt = ''; im.src = u; t.textContent = new Date(p.at).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); a.append(im, t); box.appendChild(a); }); }
  function fill() { D.title = (POP.name || 'Desk') + ' · desk'; $('#nm').textContent = POP.name || POP.id; $('#name').value = POP.name || ''; $('#promo').value = POP.promo || ''; $('#about').value = POP.about || ABOUT;
    $('#dlab').value = (POP.donate && POP.donate.label) || ''; $('#durl').value = (POP.donate && POP.donate.url) || ''; $('#ttl').value = (POP.tips && POP.tips.title) || '';
    var tb = $('#tips'); tb.replaceChildren(); ANIMALS.forEach(function (a) { var l = D.createElement('label'), t = D.createElement('textarea'); l.textContent = a[1]; t.maxLength = 200; t.rows = 2; t.dataset.tip = a[0]; t.value = (POP.tips && POP.tips.by && POP.tips.by[a[0]]) || ''; l.appendChild(t); tb.appendChild(l); });
    $('#open').setAttribute('aria-pressed', String(!!POP.on)); $('#open').textContent = POP.on ? 'OPEN' : 'CLOSED';
    $('#url').textContent = link().replace(/^https:\/\//, ''); var c = qr(link(), 6, 2); $('#qr').replaceChildren(c); logos(); pim(); prints(); }
  function read() { var by = {}; [].forEach.call(D.querySelectorAll('[data-tip]'), function (t) { var v = t.value.trim(); if (v) by[t.dataset.tip] = v; });
    var du = $('#durl').value.trim(), ab = $('#about').value.trim();
    return { name: $('#name').value.trim(), to: POP.to || undefined, on: !!POP.on, private: POP.private !== false, promo: $('#promo').value.trim(), about: ab === ABOUT ? '' : ab, pimg: POP.pimg || '', logos: POP.logos || [],
      donate: du ? { url: du, label: $('#dlab').value.trim() || 'DONATE' } : null, tips: Object.keys(by).length ? { title: $('#ttl').value.trim(), by: by } : null }; }
  function save(extra) { say('· · ·'); $('#save').disabled = true; return api('/pop/desk', { method: 'POST', body: JSON.stringify(Object.assign({ d: KEY, set: read() }, extra || {})) }).then(function () { return load(); }).then(function () { say('SAVED'); }, function (e) { say(e.status === 413 ? 'TOO LARGE' : e.status === 400 ? '× ' + String(e.message).toUpperCase() : 'UNSAVED'); }).then(function () { $('#save').disabled = false; }); }
  function load() { return api('/pop/desk?d=' + encodeURIComponent(KEY)).then(function (j) { POP = j.pop; POSTS = j.posts || []; PRS = j.printers || []; NOW = j.now || Date.now(); fill(); printer(); }); }
  /* the printer: which one, whether it is on, its Wi-Fi and how strong, what it has printed; and the two things a place needs: another Wi-Fi, and off */
  function ago(t) { if (!t) return 'never'; var s = Math.max(0, Math.round((NOW - t) / 1000)); return s < 90 ? 'now' : s < 5400 ? Math.round(s / 60) + ' min ago' : s < 129600 ? Math.round(s / 3600) + ' h ago' : Math.round(s / 86400) + ' days ago'; }
  function printer() { var want = POP.to || POP.id, p = PRS.filter(function (q) { return q.id === want; })[0] || PRS[0] || null, on = !!(p && p.seen && NOW - p.seen < 2 * 60e3);
    TO = p ? p.id : null; $('#led').classList.toggle('on', on); $('#pst').textContent = p ? (on ? 'ON' : 'ASLEEP') : 'NONE';
    var box = $('#prs'); box.replaceChildren(); if (PRS.length > 1) PRS.forEach(function (q) { var b = D.createElement('button'); b.type = 'button'; b.textContent = String(q.name).toUpperCase().slice(0, 18); b.title = 'Print here'; b.setAttribute('aria-pressed', String(!!p && q.id === p.id)); b.onclick = function () { POP.to = q.id; save(); }; box.appendChild(b); });
    var dl = $('#pd'); dl.replaceChildren(); if (!p) { $('#wifi').hidden = $('#off').hidden = true; $('#phelp').textContent = 'No printer yet.'; return; }
    var sig = function (r) { return r == null ? '' : r > -60 ? 'strong' : r > -70 ? 'good' : r > -78 ? 'weak' : 'too weak'; };
    [['NAME', p.name], ['HEARD', ago(p.seen)], ['WI-FI', p.net ? p.net.n + (p.net.rssi == null ? '' : ' · ' + sig(p.net.rssi)) : 'not said'], ['TODAY', p.day + ' printed' + (p.queued ? ' · ' + p.queued + ' waiting' : '')]].forEach(function (r) { var dt = D.createElement('dt'), dd = D.createElement('dd'); dt.textContent = r[0]; dd.textContent = r[1]; dl.append(dt, dd); });
    var asked = function (t) { return t && NOW - t < 2 * 60e3; };
    $('#wifi').hidden = !/\bwifi\b/.test(p.can); $('#off').hidden = !/\boff\b/.test(p.can); $('#wifi').disabled = $('#off').disabled = !on; $('#wifi').textContent = asked(p.wifi) ? 'OPENING' : 'WI-FI'; $('#off').textContent = asked(p.off) ? 'TURNING OFF' : 'OFF';
    $('#phelp').textContent = on ? '' : 'Asleep: check it is plugged in. With no Wi-Fi it prints a slip after a minute: scan it with a phone and choose the Wi-Fi.'; }
  function act(what, ask) { if (!TO || !confirm(ask)) return; say('· · ·'); api('/pop/desk', { method: 'POST', body: JSON.stringify({ d: KEY, act: what, printer: TO }) }).then(function () { return load(); }).then(function () { say('ASKED'); }, function () { say('UNSENT'); }); }

  /* the counter slip: the mark, the place, the code to scan, what this is, in a few lines */
  function wrap(g, txt, w) { var out = [], line = ''; String(txt).split(/\s+/).forEach(function (wd) { var tr = line ? line + ' ' + wd : wd; if (g.measureText(tr).width > w && line) { out.push(line); line = wd; } else line = tr; }); if (line) out.push(line); return out; }
  function slipCanvas() { var W = 512, pad = 28, c = D.createElement('canvas'), g = c.getContext('2d'), about = ($('#about').value.trim() || ABOUT), q = qr(link(), 8, 2), F = "600 22px Poppins, sans-serif";
    g.font = F; var L = wrap(g, about, W - pad * 2), qs = Math.min(q.width, 336), H = 96 + 54 + qs + 54 + L.length * 30 + 30 + 78 + 16; c.width = W; c.height = H; g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.fillStyle = '#000'; g.textBaseline = 'alphabetic';
    g.fillRect(pad, 26, 46, 46); /* the sun half ink, in dots: never both solid black */ for (var my = 25; my <= 73; my += 2) for (var mx = pad + 62; mx <= pad + 110; mx += 2) if (((mx >> 1) + (my >> 1)) % 2 === 0 && (mx - pad - 86) * (mx - pad - 86) + (my - 49) * (my - 49) <= 576) g.fillRect(mx, my, 2, 2); g.font = '700 40px Poppins, sans-serif'; g.fillText('novel.global', pad + 126, 64);
    var y = 96; g.fillRect(pad, y, W - pad * 2, 3); y += 44; g.font = '700 30px Poppins, sans-serif'; g.textAlign = 'center'; g.fillText(String(POP.name || '').toUpperCase(), W / 2, y); y += 14;
    g.imageSmoothingEnabled = false; g.drawImage(q, (W - qs) / 2, y, qs, qs); y += qs + 34; g.font = "600 20px 'IBM Plex Mono', monospace"; g.fillText('S C A N  ·  M A K E  ·  P R I N T', W / 2, y); y += 40;
    g.textAlign = 'left'; g.font = F; L.forEach(function (l) { g.fillText(l, pad, y); y += 30; }); y += 12; g.fillRect(pad, y, W - pad * 2, 3); y += 36;
    g.font = "600 19px 'IBM Plex Mono', monospace"; g.fillText('PHOTOS  NEWS  WEATHER  TAROT', pad, y); y += 28; g.fillText('CARDS  BOOKS  MAKE YOUR OWN', pad, y);
    var d = g.getImageData(0, 0, W, H), i, v; for (i = 0; i < d.data.length; i += 4) { v = d.data[i] < 140 ? 0 : 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); return c; }
  function code() { var A = '0123456789ABCDEFGHJKMNPQRSTVWXYZ', s = 'DA-', r = new Uint8Array(4); crypto.getRandomValues(r); for (var i = 0; i < 4; i++) s += A[r[i] % 32]; return s; }
  function slip() { if (!POP.on) { say('OPEN IT FIRST'); return; } if (!TO) { say('NO PRINTER'); return; } var b = $('#slip'); b.disabled = true; say('· · ·');
    var fonts = D.fonts && D.fonts.load ? Promise.all(['700 40px Poppins', '600 22px Poppins', "600 20px 'IBM Plex Mono'"].map(function (f) { return D.fonts.load(f); })).catch(function () {}) : Promise.resolve();
    fonts.then(function () { return api('/stories', { method: 'POST', body: JSON.stringify({ kind: 'record', code: code(), body: JSON.stringify({ type: 'stack', stack: POP.id }), lat: 0, lng: 0, dest: TO, escpos: T.raster(slipCanvas(), 0), from: 'pop', stage: 'stack', pop: POP.key, popId: POP.id, keep: false }) }); })
      .then(function () { say('PRINTING'); }, function (e) { say(e.status === 429 ? (e.wait ? 'WAIT ' + e.wait + 's' : 'WAIT') : e.status === 403 ? 'CLOSED' : 'UNSENT'); }).then(function () { b.disabled = false; }); }

  window.DESK = { slip: slipCanvas };
  D.addEventListener('DOMContentLoaded', function () {
    var q = new URLSearchParams(location.search); KEY = q.get('d') || store.get('da.desk');
    if (q.get('d')) history.replaceState(null, '', location.pathname);
    if (!KEY) { $('#gate').hidden = false; return; }
    load().then(function () { store.set('da.desk', KEY); $('#desk').hidden = false; setInterval(function () { if (!D.hidden && D.activeElement === D.body) load().catch(function () { /* later */ }); }, 30e3); }, function () { $('#gate').hidden = false; });
    $('#save').onclick = function () { save(); };
    $('#copy').onclick = function () { if (navigator.clipboard) navigator.clipboard.writeText(link()).then(function () { say('COPIED'); }); };
    $('#try').onclick = function () { window.open(link().replace('https://novel.global', location.origin), '_blank', 'noopener'); };
    $('#open').onclick = function () { POP.on = !POP.on; save(); };
    $('#slip').onclick = slip;
    $('#wifi').onclick = function () { act('wifi', 'Move the printer to another Wi-Fi? It leaves this one and prints a slip with a code. Scan it with a phone, then choose the new Wi-Fi on the page that opens.'); };
    $('#off').onclick = function () { act('off', 'Turn the printer off? Unplug it once its green light stops. To start it again, plug it back in.'); };
    [].forEach.call(D.querySelectorAll('[data-pv]'), function (b) { b.onclick = function () { POP.private = b.dataset.pv === '1'; save(); }; });
    $('#wipe').onclick = function () { if (confirm('Delete every print kept here? This cannot be undone.')) save({ wipe: true }); };
    $('#addlg').onclick = function () { pickFile(function (f) { shrink(f, 360, 'image/png', 88e3).then(function (d) { if (!d) { say('TOO LARGE'); return; } POP.logos = (POP.logos || []).concat([{ src: d, href: '' }]); logos(); }); }); };
    $('#addpi').onclick = function () { pickFile(function (f) { shrink(f, 900, 'image/jpeg', 150e3).then(function (d) { if (!d) { say('TOO LARGE'); return; } POP.pimg = d; pim(); }); }); };
    $('#rmpi').onclick = function () { POP.pimg = ''; pim(); };
  });
})();

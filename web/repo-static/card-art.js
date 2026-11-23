/* the archipelagos' own hand: hand-cut potato stamps in watercolour ink on archival paper. Two stamps, pressed again and again, never
   twice the same: a squared bell trailing four tentacles (the Irukandji, only ever as a cut shape, never drawn) and a pod with a small
   four-tentacle bell cut into it. Violet and sea blue, full, faded and ghosted, the paper's tooth and age under them. CARDART.plate(canvas, seed) paints a
   canvas to its size */
(function () {
  var PAPER = '#EEEAE0', INK = ['#4B2C7F', '#4F78B8', '#5E3E96', '#3F67A8'], TEXT = '#241B45';
  var rnd = function (seed) { var s = (seed % 2147483646) || 1; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; };
  var mk = function (w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
  var blur = function (g, px) { try { g.filter = px ? 'blur(' + px + 'px)' : 'none'; } catch (e) { /* older phones: crisp */ } };
  function grain(g, w, h, n, col, seed, rmax) { var r = rnd(seed || 5); g.fillStyle = col; for (var i = 0; i < n; i++) { g.globalAlpha = 0.25 + r() * 0.6; g.fillRect(r() * w, r() * h, 0.6 + r() * (rmax || 1.1), 0.6 + r() * (rmax || 1.1)); } g.globalAlpha = 1; }
  /* a cut edge: a shape's outline, a little off true, as a knife leaves it */
  function blob(g, cx, cy, rx, ry, p, r) { g.beginPath(); for (var k = 0; k <= 48; k++) { var a = k / 48 * Math.PI * 2, c = Math.cos(a), s2 = Math.sin(a), j = 1 + (r() - 0.5) * 0.06,
      x = cx + rx * j * Math.sign(c) * Math.pow(Math.abs(c), 2 / p), y = cy + ry * j * Math.sign(s2) * Math.pow(Math.abs(s2), 2 / p); if (k) g.lineTo(x, y); else g.moveTo(x, y); } g.closePath(); }
  var ring = function (g, x, y, rr, lw) { g.lineWidth = lw; g.beginPath(); g.arc(x, y, rr, 0, 7); g.stroke(); };
  /* one stamp, inked: its shape filled, the cuts taken out, the ink pressed unevenly (thin in patches, dragged with the potato's grain,
     lighter where the hand pressed less), its edge a little darker where the watercolour pooled */
  function stamp(kind, ink, sz, seed) { var r = rnd(seed), W = sz * 1.15, H = kind === 'bell' ? sz * 1.95 : sz * 1.7, c = mk(W, H), g = c.getContext('2d'), out = [];
    g.fillStyle = ink; g.strokeStyle = ink; g.lineCap = 'round'; g.lineJoin = 'round';
    if (kind === 'bell') { blob(g, W / 2, sz * 0.4, sz * 0.42, sz * 0.34, 3.4, r); g.fill();
      for (var t = 0; t < 4; t++) { var x0 = W / 2 + (t - 1.5) * sz * 0.2, L = sz * (0.85 + r() * 0.6), ph = r() * 6, amp = sz * (0.04 + r() * 0.05);
        for (var k = 0; k <= 30; k++) { var u = k / 30, y = sz * 0.68 + u * L, x = x0 + Math.sin(ph + u * 5) * amp * u, rr = sz * (0.075 - u * 0.045) * (0.9 + r() * 0.2); g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); if (k % 10 === 5 && r() < 0.6) out.push([x, y, rr * 0.5]); } }
      g.globalCompositeOperation = 'destination-out'; g.strokeStyle = '#000';
      var ox = (r() < 0.5 ? -1 : 1) * sz * 0.14; ring(g, W / 2 + ox, sz * 0.3, sz * 0.09, sz * 0.04);
      g.lineWidth = sz * 0.03; [-0.1, 0.1].forEach(function (dx) { g.beginPath(); g.moveTo(W / 2 - ox * 0.4 + dx * sz, sz * 0.42); g.lineTo(W / 2 - ox * 0.4 + dx * sz + (r() - 0.5) * sz * 0.03, sz * 0.66); g.stroke(); });
      out.forEach(function (o) { ring(g, o[0], o[1], o[2], sz * 0.018); }); }
    /* the pod: an oval with a small four-tentacle bell cut into it, each one its own (cut as an outline, cut solid with a dot left in, or
       tilted with rings at the tentacle ends) */
    else { blob(g, W / 2, H / 2, sz * 0.5, sz * 0.8, 2.1, r); g.fill(); g.globalCompositeOperation = 'destination-out'; g.strokeStyle = '#000'; g.fillStyle = '#000';
      var vt = Math.floor(r() * 3), bx = W / 2 + (r() - 0.5) * sz * 0.1, by = H * (0.3 + r() * 0.06), bw = sz * (0.2 + r() * 0.06), bh = sz * (0.15 + r() * 0.05), tl = r() < 0.5 && vt === 2 ? 0.14 : (r() - 0.5) * 0.06;
      g.save(); g.translate(bx, by); g.rotate(tl); g.globalAlpha = 0.6 + r() * 0.3; g.setLineDash([sz * (0.25 + r() * 0.3), sz * (0.015 + r() * 0.03), sz * (0.1 + r() * 0.2), sz * 0.02]); blob(g, 0, 0, bw, bh, 2.6 + r() * 1.2, r);
      if (vt === 1) { g.fill(); g.globalCompositeOperation = 'source-over'; g.fillStyle = ink; g.beginPath(); g.arc(-bw * 0.2 + r() * bw * 0.4, -bh * 0.15, sz * 0.035, 0, 7); g.fill(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; }
      else { g.lineWidth = sz * (0.03 + r() * 0.02); g.stroke(); }
      g.lineWidth = sz * (0.035 + r() * 0.015); var len = sz * (0.5 + r() * 0.35);
      for (var q = 0; q < 4; q++) { var tx = (q - 1.5) * bw * 0.42, ph2 = r() * 6, am = sz * (0.02 + r() * 0.04), L2 = len * (0.75 + r() * 0.35); g.beginPath();
        for (var k2 = 0; k2 <= 14; k2++) { var u2 = k2 / 14, xx = tx + Math.sin(ph2 + u2 * 4.5) * am * u2 + (r() - 0.5) * sz * 0.014, yy = bh * 0.9 + u2 * L2; if (k2) g.lineTo(xx, yy); else g.moveTo(xx, yy); } g.stroke();
        if (vt === 2) ring(g, tx + Math.sin(ph2 + 4.5) * am, bh * 0.9 + L2 + sz * 0.04, sz * 0.035, sz * 0.022); }
      g.setLineDash([]); g.restore(); }
    /* the uneven press */
    for (var m = 0; m < 70; m++) { var mx = r() * W, my = r() * H, mr = sz * (0.05 + r() * 0.22), gr = g.createRadialGradient(mx, my, 0, mx, my, mr); gr.addColorStop(0, 'rgba(0,0,0,' + (r() * 0.45).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(mx - mr, my - mr, mr * 2, mr * 2); }
    g.fillStyle = '#000'; for (var v2 = 0; v2 < 220; v2++) { g.globalAlpha = 0.2 + r() * 0.5; g.beginPath(); g.arc(r() * W, r() * H, 0.3 + r() * r() * sz * 0.016, 0, 7); g.fill(); } g.globalAlpha = 1;
    for (var bt = 0, nb = Math.floor(r() * 3); bt < nb; bt++) { var ea = r() * 7, ex = W / 2 + Math.cos(ea) * W * 0.42, ey = H / 2 + Math.sin(ea) * H * 0.4, er = sz * (0.05 + r() * 0.08), eg2 = g.createRadialGradient(ex, ey, 0, ex, ey, er);
      eg2.addColorStop(0, 'rgba(0,0,0,.85)'); eg2.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = eg2; g.fillRect(ex - er, ey - er, er * 2, er * 2); }
    g.lineWidth = 0.8; for (var d = 0; d < 80; d++) { var dx = r() * W, dy = r() * H; g.strokeStyle = 'rgba(0,0,0,' + (0.1 + r() * 0.35).toFixed(3) + ')'; g.beginPath(); g.moveTo(dx, dy); g.lineTo(dx + (r() - 0.5) * 3, dy + sz * (0.1 + r() * 0.3)); g.stroke(); }
    var an = r() * 7, lg = g.createLinearGradient(W / 2 - Math.cos(an) * W, H / 2 - Math.sin(an) * H, W / 2 + Math.cos(an) * W, H / 2 + Math.sin(an) * H); lg.addColorStop(0, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(0,0,0,' + (0.2 + r() * 0.3).toFixed(3) + ')'); g.fillStyle = lg; g.fillRect(0, 0, W, H);
    /* the pooled edge */
    var e = mk(W, H), eg = e.getContext('2d'); blur(eg, Math.max(1, sz * 0.02)); eg.drawImage(c, 0, 0); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = 0.35; blur(g, 0);
    g.drawImage(e, -sz * 0.01, -sz * 0.01); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    var o = mk(W, H), og = o.getContext('2d'); blur(og, sz * (0.004 + r() * 0.008)); og.drawImage(c, 0, 0); blur(og, 0); og.globalAlpha = 0.5; og.drawImage(c, 0, 0); og.globalAlpha = 1; return o; }
  /* the paper: its colour, a water stain or two of sea wash, its tooth and the brown spots of its age */
  function paper(g, w, h, r) { g.fillStyle = PAPER; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 3; i++) { var x = r() * w, y = r() * h, rr = Math.max(w, h) * (0.25 + r() * 0.35); g.save(); blur(g, rr * 0.08); g.fillStyle = 'rgba(79,120,184,' + (0.018 + r() * 0.025).toFixed(3) + ')'; blob(g, x, y, rr, rr * (0.5 + r() * 0.4), 2, r); g.fill();
      blur(g, 1.2); g.strokeStyle = 'rgba(63,103,168,.05)'; g.lineWidth = 1.5; g.stroke(); g.restore(); }
    for (var f = 0; f < 5; f++) { var fx = r() * w, fy = r() * h, fr = 2 + r() * 9, fg = g.createRadialGradient(fx, fy, 0, fx, fy, fr); fg.addColorStop(0, 'rgba(150,108,58,.13)'); fg.addColorStop(1, 'rgba(150,108,58,0)'); g.fillStyle = fg; g.fillRect(fx - fr, fy - fr, fr * 2, fr * 2); }
    grain(g, w, h, Math.round(w * h / 60), 'rgba(60,48,30,.07)', Math.floor(r() * 9999) + 1); }
  /* the stamps, pressed in rows across the paper, each row half a step along; full, faded, ghosted; a few pressed twice, off register */
  function press(g, w, h, seed, sz) { var r = rnd(seed), pool = [];
    for (var v = 0; v < 9; v++) pool.push(stamp(v % 3 === 2 ? 'pod' : 'bell', INK[v % INK.length], sz, seed + 101 * (v + 1)));
    var sx = sz * 1.05, sy = sz * 1.7, row = 0; g.save(); g.globalCompositeOperation = 'multiply';
    for (var y = -sz * 0.9; y < h + sz * 0.2; y += sy, row++) for (var x = -sx * 0.6 + (row % 2) * sx / 2; x < w + sx * 0.4; x += sx) { if (r() < 0.4) continue;
      var st = pool[Math.floor(r() * pool.length)], q = r(), a = q < 0.14 ? 0.72 + r() * 0.16 : q < 0.42 ? 0.3 + r() * 0.14 : 0.08 + r() * 0.08, rot = (r() - 0.5) * 0.22, jx = (r() - 0.5) * sz * 0.12, jy = (r() - 0.5) * sz * 0.12;
      for (var twice = 0; twice < (r() < 0.22 ? 2 : 1); twice++) { g.save(); g.globalAlpha = twice ? a * 0.45 : a; g.translate(x + jx + twice * sz * 0.07, y + jy + twice * sz * 0.05); g.rotate(rot); g.drawImage(st, -st.width / 2, 0); g.restore(); } }
    g.restore(); }
  function plate(cv, seed) { var k = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return false;
    cv.width = Math.round(w * k); cv.height = Math.round(h * k); var g = cv.getContext('2d'); g.setTransform(k, 0, 0, k, 0, 0); paint(g, w, h, seed || 61); return true; }
  function paint(g, w, h, seed, sz) { var r = rnd(seed + 7); paper(g, w, h, r); press(g, w, h, seed, sz || Math.max(34, Math.min(120, h * 0.42))); grain(g, w, h, Math.round(w * h / 160), 'rgba(238,234,224,.5)', seed + 11, 1.4); }
  /* the words to keep a code or a key, and the reward's note: the owner's own from the approval page (codeNotes), else these */
  var NOTES = { key: 'Your island’s key opens it on any phone.', keep: 'Keep it safe: take a screenshot, or download it.', reward: 'Your island is on. Your reward is this code, and it’s yours. With it you can save what you make, talk on the board, keep passes and open your home on another phone.', pop: 'Bring this code to a printer to make it yours.' };
  function notes(set) { var o = {}; try { o = JSON.parse((set && set.codeNotes) || '{}') || {}; } catch (e) { o = {}; } return { key: o.key || NOTES.key, keep: o.keep || NOTES.keep, reward: o.reward || NOTES.reward, pop: o.pop || NOTES.pop }; }
  /* a code or a key as a picture to keep: the card's face, its label, the thing itself large, a line under it */
  function keepCard(o) { var W = 1080, H = 1350, c = mk(W, H), g = c.getContext('2d'), sd = seedOf(o.big), r = rnd(sd + 3);
    paper(g, W, H, r); g.save(); g.beginPath(); g.rect(0, 0, W, H * 0.47); g.clip(); press(g, W, H * 0.47, sd, 150); g.restore();
    g.fillStyle = TEXT; g.font = '600 34px "IBM Plex Mono", ui-monospace, monospace'; g.textBaseline = 'alphabetic'; g.fillText(String(o.label || '').toUpperCase().split('').join(String.fromCharCode(8202)), 72, H * 0.47 + 110);
    var big = String(o.big || ''), fs = big.length <= 6 ? 300 : 62, ff = function () { g.font = big.length <= 6 ? '700 ' + fs + 'px Poppins, Arial, sans-serif' : '500 ' + fs + 'px "IBM Plex Mono", ui-monospace, monospace'; }; ff();
    while (big.length <= 6 && fs > 100 && g.measureText(big).width > W - 144) { fs -= 10; ff(); }
    var y = H * 0.47 + 140 + fs * 0.9, line = '', lines = []; big.split('').forEach(function (ch) { if (g.measureText(line + ch).width > W - 144) { lines.push(line); line = ch; } else line += ch; }); lines.push(line);
    lines.forEach(function (l, i) { g.fillText(l, 72, y + i * fs * 1.02); }); y += (lines.length - 1) * fs * 1.02 + 90;
    g.font = '500 32px "IBM Plex Mono", ui-monospace, monospace'; g.fillStyle = 'rgba(36,27,69,.7)'; (o.sub || []).forEach(function (l, i) { g.fillText(String(l), 72, y + i * 46); });
    g.fillText('novel.global', 72, H - 72); return c; }
  /* saved to the phone: shared as a picture where the phone can (to Photos), else downloaded */
  function save(o) { var c = keepCard(o), name = (o.file || 'novel-global') + '.png', d = c.toDataURL('image/png'), b = atob(d.split(',')[1]), u8 = new Uint8Array(b.length);
    for (var i = 0; i < b.length; i++) u8[i] = b.charCodeAt(i); var bl = new Blob([u8], { type: 'image/png' }), f = null; try { f = new File([bl], name, { type: 'image/png' }); } catch (e) { f = null; }
    if (f && navigator.canShare && navigator.canShare({ files: [f] })) return navigator.share({ files: [f] }).then(function () { return true; }, function () { return false; });
    var a = document.createElement('a'), u = URL.createObjectURL(bl); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); return Promise.resolve(true); }
  /* a seed from a name, so each island keeps its own plate */
  function seedOf(s) { var h = 7; s = String(s || ''); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 2147483646; return h + 1; }
  /* the title type, asked for early so a picture made on a tap has it */
  try { if (document.fonts && document.fonts.load) { document.fonts.load('700 40px Poppins'); document.fonts.load('500 40px "IBM Plex Mono"'); } } catch (e) { /* drawn in the fallback */ }
  window.CARDART = { plate: plate, seedOf: seedOf, keepCard: keepCard, save: save, notes: notes, PAPER: PAPER, TEXT: TEXT };
})();

/* the cards' own hand, for the pages a card opens: the same paper tooth, the same flaws, the one blue band (here the archipelagos
   card's glossy tube) and the coral that is that card's own colour. CARDART.plate(canvas, seed) paints a canvas to its size */
(function () {
  var BLUE = '#17457F', CORAL = '#F59878';
  var rnd = function (seed) { var s = seed || 1; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; };
  function grain(g, w, h, n, col, seed, rmax) { var r = rnd(seed || 5); g.fillStyle = col; for (var i = 0; i < n; i++) { g.globalAlpha = 0.25 + r() * 0.6; g.fillRect(r() * w, r() * h, 0.6 + r() * (rmax || 1.1), 0.6 + r() * (rmax || 1.1)); } g.globalAlpha = 1; }
  function flaws(g, w, h, seed, k) { var r = rnd(seed); g.save(); g.globalCompositeOperation = 'destination-out';
    for (var i = 0; i < 260 * (k || 1); i++) { g.globalAlpha = 0.3 + r() * 0.7; g.beginPath(); g.arc(r() * w, r() * h, 0.4 + r() * r() * 2.6, 0, 7); g.fill(); }
    g.lineCap = 'round'; for (var s = 0; s < 6 * (k || 1); s++) { var x = r() * w, y = r() * h, a = r() * 7, L = 20 + r() * 120; g.globalAlpha = 0.25 + r() * 0.4; g.lineWidth = 0.4 + r() * 1.1; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 0.3) * L * 0.5, y + Math.sin(a + 0.3) * L * 0.5, x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
    g.restore(); }
  /* the band runs across a wide plate, in at the left and out at the right, as it flows down the cards */
  function tube(g, w, h, seed) { var r = rnd(seed), a = (0.25 + r() * 0.5) * h, b = (0.25 + r() * 0.5) * h, P = [[-0.06 * w, a], [0.4 * w, a], [0.6 * w, b], [1.06 * w, b]], pts = [];
    for (var k = 0; k <= 80; k++) { var u = k / 80, v = 1 - u, c = [v * v * v, 3 * v * v * u, 3 * v * u * u, u * u * u]; pts.push([0, 1].map(function (j) { return c[0] * P[0][j] + c[1] * P[1][j] + c[2] * P[2][j] + c[3] * P[3][j]; })); }
    var bw = Math.min(h * 0.34, w * 0.17); g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    [[1, '#0B2547'], [0.86, '#123A6B'], [0.62, BLUE], [0.36, '#3F72B5'], [0.12, '#B9D2F2']].forEach(function (s, j) { g.strokeStyle = s[1]; g.lineWidth = bw * s[0]; g.save(); g.translate(-j * bw * 0.04, -j * bw * 0.05);
      g.beginPath(); pts.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.stroke(); g.restore(); }); g.restore(); }
  /* the rounded forms: soft grey pebbles, one coral */
  function forms(g, w, h, seed) { var r = rnd(seed), n = Math.max(3, Math.round(w / 90)), hot = Math.floor(r() * n);
    for (var i = 0; i < n; i++) { var x = (i + 0.2 + r() * 0.6) * w / n, y = h * (0.3 + r() * 0.45), rx = Math.min(h * 0.3, w / n * 0.38) * (0.6 + r() * 0.5), ry = rx * (0.55 + r() * 0.35), col = i === hot ? CORAL : ['#8E949B', '#B5BAC0', '#6F757D'][i % 3];
      var gr = g.createRadialGradient(x - rx * 0.35, y - ry * 0.45, rx * 0.1, x, y, rx * 1.1); gr.addColorStop(0, i === hot ? '#FFD2BF' : '#E4E6E9'); gr.addColorStop(0.45, col); gr.addColorStop(1, i === hot ? '#9E4A33' : '#2E343B');
      g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(x + rx * 0.12, y + ry * 0.9, rx * 0.9, ry * 0.25, 0, 0, 7); g.fill();
      g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rx, ry, (r() - 0.5) * 0.6, 0, 7); g.fill(); } }
  function plate(cv, seed) { var k = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return false;
    cv.width = Math.round(w * k); cv.height = Math.round(h * k); var g = cv.getContext('2d'); g.setTransform(k, 0, 0, k, 0, 0); paint(g, w, h, seed || 61); return true; }
  function paint(g, w, h, seed) {
    g.fillStyle = '#0C2546'; g.fillRect(0, 0, w, h); grain(g, w, h, Math.round(w * h / 70), 'rgba(255,255,255,.06)', seed);
    forms(g, w, h, seed + 3); tube(g, w, h, seed + 7);
    g.save(); g.globalCompositeOperation = 'source-atop'; grain(g, w, h, Math.round(w * h / 180), 'rgba(255,255,255,.18)', seed + 9, 1.4); grain(g, w, h, Math.round(w * h / 320), 'rgba(4,14,30,.35)', seed + 11, 1.6); g.restore();
    flaws(g, w, h, seed + 13, 0.3); }
  /* the words to keep a code or a key, and the reward's note: the owner's own from the approval page (codeNotes), else these */
  var NOTES = { key: 'Your island’s key opens it on any phone.', keep: 'Keep it safe: take a screenshot, or download it.', reward: 'Your island is on. Your reward is this code, and it’s yours. With it you can save what you make, talk on the board, keep passes and open your home on another phone.', pop: 'Bring this code to a printer to make it yours.' };
  function notes(set) { var o = {}; try { o = JSON.parse((set && set.codeNotes) || '{}') || {}; } catch (e) { o = {}; } return { key: o.key || NOTES.key, keep: o.keep || NOTES.keep, reward: o.reward || NOTES.reward, pop: o.pop || NOTES.pop }; }
  /* a code or a key as a picture to keep: the card's face, its label, the thing itself large, a line under it */
  function keepCard(o) { var W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H; var g = c.getContext('2d');
    paint(g, W, H * 0.46, seedOf(o.big)); g.fillStyle = '#F4F1E8'; g.fillRect(0, H * 0.46, W, H * 0.54); g.fillStyle = '#0C2546';
    g.fillStyle = '#F4F1E8'; g.fillRect(72, 72, 92, 92); g.fillStyle = '#E2552E'; g.beginPath(); g.arc(240, 118, 47, 0, 7); g.fill();
    g.fillStyle = '#0C2546'; g.font = '600 34px "IBM Plex Mono", ui-monospace, monospace'; g.textBaseline = 'alphabetic'; g.fillText(String(o.label || '').toUpperCase().split('').join(String.fromCharCode(8202)), 72, H * 0.46 + 110);
    var big = String(o.big || ''), fs = big.length <= 6 ? 300 : 62; g.font = big.length <= 6 ? '700 ' + fs + 'px Poppins, Arial, sans-serif' : '500 ' + fs + 'px "IBM Plex Mono", ui-monospace, monospace';
    var y = H * 0.46 + 140 + fs * 0.9, line = '', lines = []; big.split('').forEach(function (ch) { if (g.measureText(line + ch).width > W - 144) { lines.push(line); line = ch; } else line += ch; }); lines.push(line);
    lines.forEach(function (l, i) { g.fillText(l, 72, y + i * fs * 1.02); }); y += (lines.length - 1) * fs * 1.02 + 90;
    g.font = '500 32px "IBM Plex Mono", ui-monospace, monospace'; g.fillStyle = 'rgba(12,37,70,.7)'; (o.sub || []).forEach(function (l, i) { g.fillText(String(l), 72, y + i * 46); });
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
  window.CARDART = { plate: plate, seedOf: seedOf, keepCard: keepCard, save: save, notes: notes, CORAL: CORAL, BLUE: BLUE };
})();

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
    cv.width = Math.round(w * k); cv.height = Math.round(h * k); var g = cv.getContext('2d'); g.setTransform(k, 0, 0, k, 0, 0); seed = seed || 61;
    g.fillStyle = '#0C2546'; g.fillRect(0, 0, w, h); grain(g, w, h, Math.round(w * h / 70), 'rgba(255,255,255,.06)', seed);
    forms(g, w, h, seed + 3); tube(g, w, h, seed + 7);
    g.save(); g.globalCompositeOperation = 'source-atop'; grain(g, w, h, Math.round(w * h / 180), 'rgba(255,255,255,.18)', seed + 9, 1.4); grain(g, w, h, Math.round(w * h / 320), 'rgba(4,14,30,.35)', seed + 11, 1.6); g.restore();
    flaws(g, w, h, seed + 13, 0.3); return true; }
  /* a seed from a name, so each island keeps its own plate */
  function seedOf(s) { var h = 7; s = String(s || ''); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 2147483646; return h + 1; }
  window.CARDART = { plate: plate, seedOf: seedOf, CORAL: CORAL, BLUE: BLUE };
})();

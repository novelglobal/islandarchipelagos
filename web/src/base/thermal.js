/* novel.global, thermal-first: what the receipt printer can lay down, and the styles a receipt is set in. Shared by the base, the aura
   and the approval page (build.mjs puts it in front of base.js and admin.js), plain script for old phones.
   The TM-T88V lays 512 dots across 72 mm of 80 mm paper (180 dpi); a 203 dpi printer lays 576. Every word is drawn on that grid and
   made solid ink (a hot dot or none, never grey, never dithered). Only photographs are dithered, after a curve measured on the printer
   itself (the calibration strip), with the dots chosen for each picture. */
(function () {
  'use strict';
  var T = {};
  /* the printer's own grid: its dots across, its dots to the inch */
  T.grid = function (dots) { dots = +dots || 512; return { dots: dots - dots % 8, dpi: dots >= 576 ? 203 : 180 }; };

  /* ───────── the measured curve ─────────
     The strip prints eleven patches, 0 (black) to 10 (paper), each as the dither lays it with nothing else done (Floyd-Steinberg, which
     keeps every level; Atkinson would make 1 black and 9 paper by itself). Three are read by eye:
     b the lightest that still looks solid black, m the one that looks half way between black and paper, w the darkest that looks like
     bare paper. The curve sends a tone wanted on paper to the level that prints it: black to b, half grey to m, paper to w */
  T.CAL = { b: 1, m: 6, w: 10 };
  T.cal = function (c) { c = c || {}; var b = Math.max(0, Math.min(8, +c.b)), m = +c.m, w = Math.max(2, Math.min(10, +c.w)); if (!isFinite(b)) b = T.CAL.b; if (!isFinite(w)) w = T.CAL.w; if (w <= b + 1) w = Math.min(10, b + 2);
    if (!isFinite(m) || m <= b || m >= w) m = (b + w) / 2; return { b: b, m: m, w: w }; };
  /* a table of 256: the lightness wanted (0 black) to the lightness given to the dots */
  T.curve = function (c) {
    var k = T.cal(c), lut = new Uint8Array(256), i, t, v;
    for (i = 0; i < 256; i++) { t = i / 255; v = t < 0.5 ? k.b + (k.m - k.b) * (t / 0.5) : k.m + (k.w - k.m) * ((t - 0.5) / 0.5); lut[i] = Math.round(Math.max(0, Math.min(1, v / 10)) * 255); }
    return lut;
  };

  /* ───────── the dots ───────── */
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  T.BAYER = BAYER;
  /* L: lightness, a Float32Array, made 0 or 255 in place. atkinson (clean, bright), floyd (fuller, holds the darks), bayer (an even
     screen), none (black or white at half) */
  T.dots = function (L, W, H, how) {
    var n = W * H, g = L, i, x, y, e, o;
    if (T.DOTS_MORE && T.DOTS_MORE[how]) return T.DOTS_MORE[how](L, W, H);
    if (how === 'none') { for (i = 0; i < n; i++) g[i] = g[i] < 128 ? 0 : 255; return g; }
    if (how === 'bayer') { for (y = 0; y < H; y++) for (x = 0; x < W; x++) { i = y * W + x; g[i] = g[i] < (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) * 16 ? 0 : 255; } return g; }
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) { i = y * W + x; o = g[i] < 128 ? 0 : 255; e = g[i] - o; g[i] = o;
      if (how === 'floyd') { if (x + 1 < W) g[i + 1] += e * 7 / 16; if (y + 1 < H) { if (x > 0) g[i + W - 1] += e * 3 / 16; g[i + W] += e * 5 / 16; if (x + 1 < W) g[i + W + 1] += e / 16; } }
      else { e /= 8; if (x + 1 < W) g[i + 1] += e; if (x + 2 < W) g[i + 2] += e; if (y + 1 < H) { if (x > 0) g[i + W - 1] += e; g[i + W] += e; if (x + 1 < W) g[i + W + 1] += e; } if (y + 2 < H) g[i + 2 * W] += e; } }
    return g;
  };
  /* the dots for this picture: a graphic (few mid-tones) black or white; a busy one Atkinson, so its edges stay clean; a dark one or a
     soft one Floyd-Steinberg, so the shadows and the gradients hold */
  T.pick = function (L, W, H) {
    var n = W * H, step = Math.max(1, Math.floor(n / 40000)), mid = 0, sum = 0, edge = 0, k = 0, i, v;
    for (i = 0; i < n - 1; i += step) { v = L[i]; sum += v; if (v > 56 && v < 200) mid++; if ((i + 1) % W) edge += Math.abs(L[i + 1] - v); k++; }
    if (!k) return 'atkinson'; var mean = sum / k, ms = mid / k, ed = edge / k;
    if (ms < 0.16) return 'none';
    if (ed > 18) return 'atkinson';
    if (mean < 105) return 'floyd';
    if (mean > 175) return 'atkinson';
    return 'floyd';
  };

  /* ───────── five ways to lay a photograph, for quality (not looks) ─────────
     Each is a different method, each tuned to get the most out of a thermal head, where a hot dot spreads into the paper around it
     (dot gain) and isolated dots print less steadily than clustered ones:
     fs    error diffusion, Floyd-Steinberg, run both ways along the rows (serpentine): every grey kept, no drift to one side
     jjn   error diffusion spread wide (Jarvis-Judice-Ninke, 12 neighbours), serpentine: the smoothest gradients, fewest worms
     model error diffusion that knows the head: a white dot beside black ones prints darker than white, so the error is taken from what
           will really print (after Pappas and Neuhoff): shadows stay open, mid-tones do not clog
     blue  a threshold of blue noise (void and cluster, 64 × 64): an even, fine, patternless texture; nothing travels between areas
     am    clustered dots on a 45° screen, grown round from each cell's middle, a touch of blue noise to break the steps: the steadiest
           when the head runs hot or the paper is cheap */
  function ser(L, W, H, taps, div) {
    for (var y = 0; y < H; y++) { var rev = y & 1, x0 = rev ? W - 1 : 0, dx = rev ? -1 : 1;
      for (var k = 0, x = x0; k < W; k++, x += dx) { var i = y * W + x, v = L[i], o = v < 128 ? 0 : 255, e = v - o; L[i] = o; if (!e) continue;
        for (var t = 0; t < taps.length; t += 3) { var xx = x + taps[t] * dx, yy = y + taps[t + 1]; if (xx >= 0 && xx < W && yy < H) L[yy * W + xx] += e * taps[t + 2] / div; } } }
    return L; }
  var FS = [1, 0, 7, -1, 1, 3, 0, 1, 5, 1, 1, 1], JJN = [1, 0, 7, 2, 0, 5, -2, 1, 3, -1, 1, 5, 0, 1, 7, 1, 1, 5, 2, 1, 3, -2, 2, 1, -1, 2, 3, 0, 2, 5, 1, 2, 3, 2, 2, 1];
  /* the head's spread: how much a black neighbour darkens a white dot, beside it (a) and on the diagonal (b) */
  var GAIN = { a: 0.13, b: 0.04 };
  function model(L, W, H) { var out = new Uint8Array(W * H);
    for (var y = 0; y < H; y++) { var rev = y & 1, x0 = rev ? W - 1 : 0, dx = rev ? -1 : 1;
      for (var k = 0, x = x0; k < W; k++, x += dx) { var i = y * W + x, v = Math.max(-64, Math.min(320, L[i])), bk = function (xx, yy) { return xx >= 0 && xx < W && yy >= 0 && out[yy * W + xx] ? 1 : 0; };
        var s = GAIN.a * (bk(x - dx, y) + bk(x, y - 1)) + GAIN.b * (bk(x - 1, y - 1) + bk(x + 1, y - 1)), wv = 255 * Math.max(0, 1 - s), black = Math.abs(v) < Math.abs(v - wv), got = black ? 0 : wv, e = v - got;
        out[i] = black ? 1 : 0; L[i] = black ? 0 : 255;
        for (var t = 0; t < FS.length; t += 3) { var xx = x + FS[t] * dx, yy = y + FS[t + 1]; if (xx >= 0 && xx < W && yy < H) L[yy * W + xx] += e * FS[t + 2] / 16; } } }
    return L; }
  /* the blue noise: made once, 64 × 64, by void and cluster (Ulichney): ranks 0 to 4095, each placed where the pattern is emptiest */
  var BLUE = null;
  T.blue = function () { if (BLUE) return BLUE; var N = 64, n = N * N, R = 6, sg = 1.5, K = [], i, x, y, dx, dy;
    for (dy = -R; dy <= R; dy++) for (dx = -R; dx <= R; dx++) K.push(dx, dy, Math.exp(-(dx * dx + dy * dy) / (2 * sg * sg)));
    var on = new Uint8Array(n), E = new Float32Array(n), rank = new Uint16Array(n), seed = 1, rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    var add = function (p, s) { var px = p % N, py = (p / N) | 0; for (var q = 0; q < K.length; q += 3) E[((py + K[q + 1] + N) % N) * N + (px + K[q] + N) % N] += s * K[q + 2]; };
    var most = function (v) { var b = -1, bv = v ? -1e9 : 1e9; for (var p = 0; p < n; p++) if (on[p] === v && (v ? E[p] > bv : E[p] < bv)) { bv = E[p]; b = p; } return b; };
    var m0 = Math.round(n / 10); while (m0) { i = (rnd() * n) | 0; if (!on[i]) { on[i] = 1; add(i, 1); m0--; } }
    for (var g = 0; g < 4096; g++) { var c = most(1); on[c] = 0; add(c, -1); var v0 = most(0); if (v0 === c) { on[c] = 1; add(c, 1); break; } on[v0] = 1; add(v0, 1); }
    var ones = 0; for (i = 0; i < n; i++) ones += on[i]; var keep = on.slice(), KE = E.slice();
    for (var r = ones - 1; r >= 0; r--) { var cc = most(1); on[cc] = 0; add(cc, -1); rank[cc] = r; }
    on.set(keep); E.set(KE); for (r = ones; r < n; r++) { var vv = most(0); on[vv] = 1; add(vv, 1); rank[vv] = r; }
    BLUE = { N: N, t: new Float32Array(n) }; for (i = 0; i < n; i++) BLUE.t[i] = (rank[i] + 0.5) / n * 255; return BLUE; };
  function blue(L, W, H) { var B = T.blue(), N = B.N; for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) { var i = y * W + x; L[i] = L[i] < B.t[(y % N) * N + x % N] ? 0 : 255; } return L; }
  /* the screen: a cell of p dots on the diagonal, a round dot grown from its middle */
  /* the round spot does not grow evenly with the grey, so each grey is first sent to the level that covers as much of the cell as it should
     (measured once over a patch of whole cells) */
  var AMQ = {};
  function amTh(x, y, p, B) { var N = B.N, k = Math.PI / (p * Math.SQRT2), s = (Math.cos((x + y) * k * 2) + Math.cos((x - y) * k * 2)) / 2; return 255 * (s + 1) / 2 + (B.t[(y % N) * N + x % N] - 127.5) * 0.06; }
  function amLut(p, B) { if (AMQ[p]) return AMQ[p]; var S = 96, th = new Float32Array(S * S), x, y, g, cov = new Float32Array(256), lut = new Uint8Array(256);
    for (y = 0; y < S; y++) for (x = 0; x < S; x++) th[y * S + x] = amTh(x, y, p, B);
    for (g = 0; g < 256; g++) { var b = 0; for (x = 0; x < th.length; x++) if (g < th[x]) b++; cov[g] = b / th.length; }
    for (var v = 0; v < 256; v++) { var want = 1 - v / 255, best = 0, bd = 9; for (g = 0; g < 256; g++) { var dd = Math.abs(cov[g] - want); if (dd < bd) { bd = dd; best = g; } } lut[v] = best; }
    return (AMQ[p] = lut); }
  function am(L, W, H, p) { p = p || 6; var B = T.blue(), lut = amLut(p, B);
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) { var i = y * W + x, v = L[i]; L[i] = v >= 255 ? 255 : v <= 0 ? 0 : lut[v | 0] < amTh(x, y, p, B) ? 0 : 255; } return L; }
  T.DOTS_MORE = { fs: function (L, W, H) { return ser(L, W, H, FS, 16); }, jjn: function (L, W, H) { return ser(L, W, H, JJN, 48); }, model: model, blue: blue, am: function (L, W, H) { return am(L, W, H, 4); } };

  /* each way with the tones that suit it: how far the mid-tones are lifted against the dot gain (under 1 lighter), and how much the edges
     are lifted. The model counts the gain itself, so it lifts nothing; the screen gains least, so it lifts little */
  T.QUALITY = [
    { id: 'fs', name: 'FLOYD-STEINBERG, BOTH WAYS', how: 'Error to 4 neighbours, rows both ways', gamma: 0.78, sharpen: 0.6 },
    { id: 'jjn', name: 'JARVIS-JUDICE-NINKE', how: 'Error spread wide, 12 neighbours', gamma: 0.8, sharpen: 0.9 },
    { id: 'model', name: 'DOT GAIN MODEL', how: 'Counts how a hot dot spreads', gamma: 1, sharpen: 0.6 },
    { id: 'blue', name: 'BLUE NOISE', how: 'Fine, even, no pattern', gamma: 0.76, sharpen: 0.7 },
    { id: 'am', name: 'CLUSTERED DOTS, 45°', how: 'Round dots, steadiest when hot', gamma: 0.9, sharpen: 0.4 }
  ];
  /* a photograph (an image or a canvas) laid one way at W dots across: scaled down in halves (no shimmer), stretched to its own black and
     white, its edges lifted, its mid-tones set for the way, through the measured curve when there is one, then the dots */
  T.lay = function (src, W, q, cal, maxH) { return T.photo(src, W, { clip: 0.5, gamma: q.gamma, contrast: 0, sharpen: q.sharpen, dither: q.id, cal: cal || null }, maxH); };

  /* ───────── the sets the approval page chooses from, and how a print's settings are settled ─────────
     clip: how much of the darkest and lightest is let go when the tones are stretched (%); gamma: the mid-tones (higher darker, under 1 lifted); contrast: an
     S-curve on top (0 to 1); sharpen: the edges lifted (0 to 2.5); dither: the dots; lineCut: words and lines below this lightness print
     black; bolden: dots added round words and lines (0 to 2); minText: the smallest words, in dots at 512 wide; heat: the head's darkness */
  T.SETS = {
    soft: { clip: 1, gamma: 0.8, contrast: 0, sharpen: 0.7, dither: 'atkinson', lineCut: 200, bolden: 0, minText: 14, heat: 0 },
    crisp: { clip: 2, gamma: 0.72, contrast: 0.25, sharpen: 1.1, dither: 'auto', lineCut: 215, bolden: 0, minText: 18, heat: 2 },
    bold: { clip: 3, gamma: 0.62, contrast: 0.4, sharpen: 1.3, dither: 'floyd', lineCut: 225, bolden: 1, minText: 20, heat: 4 },
    screen: { clip: 2, gamma: 0.7, contrast: 0.3, sharpen: 0.9, dither: 'bayer', lineCut: 215, bolden: 0, minText: 18, heat: 2 },
    graphic: { clip: 4, gamma: 0.75, contrast: 0.7, sharpen: 1.6, dither: 'none', lineCut: 230, bolden: 1, minText: 20, heat: 3 }
  };
  /* o: what the approval page saved (printq); photo: the style's own photograph settings. The set first, then the style's photograph,
     then a way from the photo test with its own mid-tones and edges (as the test laid it), then every tweak the approval page set apart:
     the owner's word is always last, so it always shows. With the curve and no mid-tones set, the curve stands for them */
  T.settle = function (o, photo) { o = o || {}; photo = photo || {}; var b = T.SETS[o.preset] || T.SETS.crisp, out = {}, k, has = function (k2) { return o[k2] != null && o[k2] !== ''; };
    for (k in b) out[k] = b[k]; for (k in photo) if (photo[k] != null) out[k] = photo[k];
    if (has('dither')) out.dither = o.dither;
    var qw = T.QUALITY.filter(function (q) { return q.id === out.dither; })[0]; if (qw) { out.gamma = qw.gamma; out.sharpen = qw.sharpen; out.clip = 0.5; out.contrast = 0; }
    out.cal = o.cal ? T.cal(o.cal) : null; if (out.cal && !qw && photo.gamma == null) out.gamma = 1;
    for (k in b) if (k !== 'dither' && has(k) && isFinite(+o[k])) out[k] = +o[k];
    out.preset = T.SETS[o.preset] ? o.preset : 'crisp'; return out; };
  /* a photograph's tones made ready for the dots, in place (L: lightness 0 to 255): stretched to its own black and white, mid-tones,
     contrast, edges, then through the measured curve. Gives back the dots to lay it with (auto: chosen for this picture) */
  T.tone = function (L, W, H, Q) {
    var n = W * H, hist = new Uint32Array(256), l, i, cut = n * Math.max(0, Math.min(10, +Q.clip || 0)) / 100;
    for (l = 0; l < n; l++) hist[Math.max(0, Math.min(255, L[l] | 0))]++;
    var lo = 0, hi = 255, acc = 0; for (i = 0; i < 256; i++) { acc += hist[i]; if (acc > cut) { lo = i; break; } } acc = 0; for (i = 255; i >= 0; i--) { acc += hist[i]; if (acc > cut) { hi = i; break; } } if (hi - lo < 40) { lo = 0; hi = 255; }
    var span = hi - lo, gm = Math.max(0.3, Math.min(1.6, +Q.gamma || 0.8)), ct = Math.max(0, Math.min(1, +Q.contrast || 0)), sh = Math.max(0, Math.min(2.5, +Q.sharpen || 0));
    for (l = 0; l < n; l++) { var t = Math.pow(Math.max(0, Math.min(1, (L[l] - lo) / span)), gm); if (ct) t = t + ct * (t - 0.5) * (1 - Math.abs(2 * t - 1)) * 2; L[l] = 255 * Math.max(0, Math.min(1, t)); }
    if (sh) { var B = new Float32Array(n), y, x, dy, dx; for (y = 0; y < H; y++) for (x = 0; x < W; x++) { var s = 0, m = 0; for (dy = -1; dy <= 1; dy++) for (dx = -1; dx <= 1; dx++) { var y2 = y + dy, x2 = x + dx; if (y2 >= 0 && y2 < H && x2 >= 0 && x2 < W) { s += L[y2 * W + x2]; m++; } } B[y * W + x] = s / m; }
      for (l = 0; l < n; l++) L[l] = L[l] + sh * (L[l] - B[l]); }
    for (l = 0; l < n; l++) L[l] = L[l] < 10 ? 0 : L[l] > 245 ? 255 : L[l];
    var how = !Q.dither || Q.dither === 'auto' ? T.pick(L, W, H) : Q.dither, lut = Q.cal ? T.curve(Q.cal) : null;
    if (lut) for (l = 0; l < n; l++) L[l] = L[l] ? lut[L[l] | 0] : 0;
    return how; };
  /* lightness of an image's pixels (sRGB weights) */
  T.luma = function (d, n) { var L = new Float32Array(n); for (var l = 0, i = 0; l < n; l++, i += 4) L[l] = d[i] * 0.2126 + d[i + 1] * 0.7152 + d[i + 2] * 0.0722; return L; };
  /* an image (or a part of it: crop [x, y, w, h] as fractions) scaled to W dots across, no taller than maxH, in halves (no shimmer) */
  T.fit = function (src, W, maxH, crop) {
    var iw = src.naturalWidth || src.width, ih = src.naturalHeight || src.height, cr = crop || [0, 0, 1, 1], sx = iw * cr[0], sy = ih * cr[1], sw = iw * cr[2], sh = ih * cr[3];
    var k = Math.min(W / sw, (maxH || 1e9) / sh), w = Math.max(8, Math.round(sw * k)), h = Math.max(8, Math.round(sh * k)), cur = src;
    while (sw / 2 > w * 1.05) { var t = document.createElement('canvas'); t.width = Math.round(sw / 2); t.height = Math.round(sh / 2); var tx = t.getContext('2d'); tx.imageSmoothingQuality = 'high'; tx.drawImage(cur, sx, sy, sw, sh, 0, 0, t.width, t.height); cur = t; sx = 0; sy = 0; sw = t.width; sh = t.height; }
    var c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(cur, sx, sy, sw, sh, 0, 0, w, h); return c; };
  /* a photograph laid with settled settings Q, exactly as the site lays it: fitted, toned, dotted. c.how: the dots it was given */
  T.photo = function (src, W, Q, maxH, crop) { var c = T.fit(src, W, maxH, crop), w = c.width, h = c.height, x = c.getContext('2d'), im = x.getImageData(0, 0, w, h), d = im.data, n = w * h, L = T.luma(d, n);
    var how = T.tone(L, w, h, Q); T.dots(L, w, h, how); for (var l = 0, i = 0; l < n; l++, i += 4) { d[i] = d[i + 1] = d[i + 2] = L[l]; d[i + 3] = 255; } x.putImageData(im, 0, 0); c.how = how; return c; };
  /* sixteen steps black to paper, laid with Q (no stretch, no edges: the tones alone) */
  T.wedge = function (w, h, Q, n) { n = n || 16; var q = {}, k; for (k in Q) q[k] = Q[k]; q.clip = 0; q.sharpen = 0; var L = new Float32Array(w * h), x, y;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) L[y * w + x] = Math.min(255, Math.floor(x * n / w) * 255 / (n - 1)); var how = T.tone(L, w, h, q); if (q.dither === 'auto' || !q.dither) how = 'floyd'; T.dots(L, w, h, how);
    var c = document.createElement('canvas'); c.width = w; c.height = h; var g = c.getContext('2d'), im = g.createImageData(w, h); for (var p = 0; p < L.length; p++) { im.data[p * 4] = im.data[p * 4 + 1] = im.data[p * 4 + 2] = L[p]; im.data[p * 4 + 3] = 255; } g.putImageData(im, 0, 0); return c; };

  /* ───────── TUNE: the saved settings, and one step either side of each, on one slip ─────────
     The photograph as the site prints it now (its settings written above it), then the same close-up three times for each of mid-tones,
     contrast and edges (one step under, as saved, one step over), then three bands at three heats: the printer is told a new darkness at
     the start of each band, so one slip shows what heat does. o: { dots, q (settled), heat, crop }. Gives back { c, steps } for T.raster */
  T.tune = function (img, o) { o = o || {}; var g0 = T.grid(o.dots), W = g0.dots, u = W / 512, sz = function (n) { return Math.max(1, Math.round(n * u)); }, pad = sz(10), Q = o.q || T.settle({}), heat = Math.round(+o.heat || 0), crop = o.crop || [0.18, 0.12, 0.64, 0.6];
    var r2 = function (v) { return Math.round(v * 100) / 100; }, three = function (v, d, a, b) { v = +v || 0; var lo = v - d, hi = v + d; if (lo < a) return [v, v + d, v + 2 * d].map(function (z) { return r2(Math.min(b, z)); }); if (hi > b) return [v - 2 * d, v - d, v].map(function (z) { return r2(Math.max(a, z)); }); return [r2(lo), r2(v), r2(hi)]; };
    var withQ = function (k, v) { var q = {}, j; for (j in Q) q[j] = Q[j]; q[k] = v; return q; }, hasCurve = !!Q.cal;
    var pw = Math.floor((W - pad * 4) / 3), ph = Math.round(pw * 1.2), first = T.photo(img, W - pad * 2, Q, sz(360));
    var ladders = [['MID-TONES', 'gamma', three(Q.gamma, 0.15, 0.3, 1.6)], ['CONTRAST', 'contrast', three(Q.contrast, 0.25, 0, 1)], ['EDGES', 'sharpen', three(Q.sharpen, 0.6, 0, 2.5)]].map(function (L0) {
      return { name: L0[0], k: L0[1], vals: L0[2], pics: L0[2].map(function (v) { return T.photo(img, pw, withQ(L0[1], v), ph, crop); }) }; });
    var hs = three(heat, 3, -6, 8).map(Math.round), bandH = sz(130), bw = Math.floor((W - pad * 3) * 0.5);
    var bands = hs.map(function (h) { return { h: h, pic: T.photo(img, bw, Q, bandH, crop), wedge: T.wedge(W - pad * 3 - bw, sz(70), Q) }; });
    var lab = sz(30), H = pad + sz(76) + first.height + sz(8) + sz(24) + sz(30) + ladders.length * (sz(34) + ph + lab) + sz(34) + bands.length * (bandH + sz(14)) + sz(40) + pad;
    var c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.fillStyle = '#000'; x.textBaseline = 'top';
    var put = function (t, fam, px, x0, y0, mw) { var f = px; do { x.font = T.font(null, fam, sz(f)); f -= 1; } while (f > 8 && x.measureText(t).width > mw); x.fillText(t, x0, y0); };
    var rule = function (y0) { for (var dx = pad; dx < W - pad; dx += sz(8)) x.fillRect(dx, y0, sz(3), 1); };
    var y = pad, dn = function (h) { return String(h).toUpperCase(); };
    put('TUNE', 'sans', 24, pad, y, W - pad * 2);
    put('SET ' + dn(Q.preset || 'crisp') + ' · DOTS ' + dn(Q.dither || 'auto') + (Q.dither === 'auto' || !Q.dither ? ' (' + dn(first.how) + ')' : '') + ' · CURVE ' + (hasCurve ? Q.cal.b + '/' + Q.cal.m + '/' + Q.cal.w : 'OFF'), 'mono', 13, pad, y + sz(32), W - pad * 2);
    put('MID ' + r2(Q.gamma) + ' · CONTRAST ' + r2(Q.contrast) + ' · EDGES ' + r2(Q.sharpen) + ' · STRETCH ' + r2(Q.clip) + ' · HEAT ' + heat, 'mono', 13, pad, y + sz(52), W - pad * 2);
    y += sz(76); x.drawImage(first, Math.round((W - first.width) / 2), y); y += first.height + sz(8);
    x.drawImage(T.wedge(W - pad * 2, sz(24), Q), pad, y); y += sz(24); put('AS SAVED · BLACK → PAPER', 'mono', 12, pad, y + sz(8), W - pad * 2); y += sz(30);
    ladders.forEach(function (Ld) { rule(y + sz(4)); put(Ld.name, 'sans', 18, pad, y + sz(12), W - pad * 2); y += sz(34);
      Ld.pics.forEach(function (p, i) { var x0 = pad + i * (pw + pad); x.drawImage(p, x0 + Math.round((pw - p.width) / 2), y); put(String(Ld.vals[i]) + (Ld.vals[i] === r2(+Q[Ld.k] || 0) ? ' SAVED' : ''), 'mono', 13, x0, y + ph + sz(6), pw); });
      y += ph + lab; });
    rule(y + sz(4)); put('HEAT', 'sans', 18, pad, y + sz(12), W - pad * 2); y += sz(34);
    var steps = [];
    bands.forEach(function (b) { steps.push({ y: y, heat: b.h }); x.drawImage(b.pic, pad, y); var wx = pad * 2 + bw; x.drawImage(b.wedge, wx, y); put('HEAT ' + b.h + (b.h === heat ? ' SAVED' : ''), 'mono', 14, wx, y + sz(80), W - wx - pad); y += bandH + sz(14); });
    steps.push({ y: y, heat: heat });
    put('SAME BANDS: SET DARKNESS ON THE PRINTER', 'mono', 12, pad, y + sz(10), W - pad * 2);
    return { c: T.solid(c, 128), steps: steps }; };
  /* the chart beside each: sixteen steps black to paper, a smooth ramp, and pairs of lines one, two and three dots wide */
  T.chart = function (w, h, q, cal) { var c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
    var sw = Math.floor(w * 0.42), st = Math.floor(h * 0.62 / 16), lut = cal ? T.curve(cal) : null, put = function (L, ww, hh, ox, oy) { T.dots(L, ww, hh, q.id); var im = x.createImageData(ww, hh); for (var p = 0; p < L.length; p++) { im.data[p * 4] = im.data[p * 4 + 1] = im.data[p * 4 + 2] = L[p]; im.data[p * 4 + 3] = 255; } x.putImageData(im, ox, oy); };
    var tone = function (v) { v = 255 * Math.pow(v / 255, q.gamma); return lut ? lut[v | 0] : v; };
    var L = new Float32Array(sw * st * 16); for (var s = 0; s < 16; s++) { var v = tone(s * 17); for (var p = s * sw * st; p < (s + 1) * sw * st; p++) L[p] = v; } put(L, sw, st * 16, 0, 0);
    var rw = Math.floor(w * 0.22), rh = st * 16, L2 = new Float32Array(rw * rh); for (var y = 0; y < rh; y++) for (var xx = 0; xx < rw; xx++) L2[y * rw + xx] = tone(255 * y / (rh - 1)); put(L2, rw, rh, sw + 6, 0);
    x.fillStyle = '#000'; var lx = sw + rw + 12, ly = 0, lw = w - lx; [1, 2, 3].forEach(function (k) { for (var j = 0; j < 6; j++) x.fillRect(lx, ly + j * k * 2, lw, k); ly += k * 12 + 8; });
    [1, 2, 3].forEach(function (k) { for (var j = 0; j < Math.floor(lw / (k * 2)); j++) x.fillRect(lx + j * k * 2, ly, k, 28); ly += 36; });
    var y0 = st * 16 + 10; x.font = T.font(null, 'mono', 13); x.textBaseline = 'top'; x.fillText('0', 0, y0); x.fillText('15', sw - 16, y0); x.fillText('BLACK → PAPER', 0, y0 + 16);
    return c; };
  /* the test: the photograph laid each way (all five, or the ones asked for), its chart beside it, the way named under; one slip */
  T.photoTest = function (img, o) { o = o || {}; var g0 = T.grid(o.dots), W = g0.dots, u = W / 512, pad = Math.round(10 * u), ways = (o.ways || T.QUALITY.map(function (q) { return q.id; })).map(function (id) { return T.QUALITY.filter(function (q) { return q.id === id; })[0]; }).filter(Boolean);
    var pw = Math.round(W * 0.6), ph = Math.round(pw * 1.5), cw = W - pad * 2 - pw - pad, parts = ways.map(function (q) { return { q: q, p: T.lay(img, pw, q, o.cal, ph), c: T.chart(cw, Math.round(ph * 0.9), q, o.cal) }; });
    var H = pad + Math.round(70 * u) + parts.reduce(function (a, s) { return a + s.p.height + Math.round(64 * u); }, 0) + pad, c = document.createElement('canvas'); c.width = W; c.height = H;
    var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.fillStyle = '#000'; x.textBaseline = 'top'; var y = pad, sz = function (n) { return Math.round(n * u); };
    x.font = T.font(null, 'sans', sz(24)); x.fillText('PHOTO TEST', pad, y); x.font = T.font(null, 'mono', sz(14)); var r = W + ' DOTS · ' + g0.dpi + ' DPI · HEAT ' + (o.heat || 0) + ' · CURVE ' + (o.cal ? o.cal.b + '/' + o.cal.m + '/' + o.cal.w : 'OFF'); x.fillText(r, pad, y + sz(32));
    y += sz(70);
    parts.forEach(function (s, k) { x.drawImage(s.p, pad, y); x.drawImage(s.c, pad + pw + pad, y);
      x.font = T.font(null, 'sans', sz(20)); x.fillText((T.QUALITY.indexOf(s.q) + 1) + '  ' + s.q.name, pad, y + s.p.height + sz(8));
      x.font = T.font(null, 'mono', sz(13)); var tl = ' · MID ' + s.q.gamma + ' · EDGE ' + s.q.sharpen, hw = s.q.how.toUpperCase(); while (hw.length > 8 && x.measureText(hw + tl).width > W - pad * 2) hw = hw.slice(0, -2).replace(/[\s,:;]+$/, '') + '…'; x.fillText(hw + tl, pad, y + s.p.height + sz(34));
      y += s.p.height + sz(64); if (k < parts.length - 1) { for (var dx = pad; dx < W - pad; dx += sz(8)) x.fillRect(dx, y - sz(10), sz(3), 1); } });
    return T.solid(c, 128); };

  /* ───────── to the printer ─────────
     heat: the head's darkness (GS ( K, function 49: under 0 lighter, over 0 darker and slower) */
  T.raster = function (cv, heat, steps) {
    var W = cv.width, H = cv.height, bw = W >> 3, d = cv.getContext('2d').getImageData(0, 0, W, H).data, out = [0x1B, 0x40], clamp = function (v) { return Math.max(-6, Math.min(8, Math.round(+v || 0))); }, ht = clamp(heat), now = 0;
    var dark = function (v) { out.push(0x1D, 0x28, 0x4B, 0x02, 0x00, 0x31, v < 0 ? 256 + v : v); now = v; };
    /* steps: [{ y, heat }] a new darkness from row y down (the TUNE slip's heat bands); the printer is told at each change */
    var cuts = [0, H], st = (steps || []).filter(function (s) { return s && s.y > 0 && s.y < H; }).sort(function (a, b) { return a.y - b.y; }); st.forEach(function (s) { cuts.push(Math.round(s.y)); });
    cuts = cuts.filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; });
    var heatAt = function (y) { var v = ht; st.forEach(function (s) { if (s.y <= y) v = clamp(s.heat); }); return v; };
    if (ht) dark(ht);
    for (var ci = 0; ci < cuts.length - 1; ci++) { var a = cuts[ci], b = cuts[ci + 1], hv = heatAt(a); if (hv !== now) dark(hv);
      for (var y0 = a; y0 < b; y0 += 255) {
        var h = Math.min(255, b - y0); out.push(0x1D, 0x76, 0x30, 0x00, bw & 0xFF, bw >> 8, h & 0xFF, h >> 8);
        for (var y = y0; y < y0 + h; y++) for (var xb = 0; xb < bw; xb++) { var v = 0; for (var bit = 0; bit < 8; bit++) if (d[(y * W + xb * 8 + bit) * 4] < 128) v |= 0x80 >> bit; out.push(v); }
      } }
    out.push(0x1B, 0x64, 0x04, 0x1D, 0x56, 0x42, 0x00);
    var s = ''; for (var i = 0; i < out.length; i += 0x8000) s += String.fromCharCode.apply(null, out.slice(i, i + 0x8000)); return btoa(s);
  };
  /* a canvas made solid ink: every dot below the cut black, the rest paper */
  T.solid = function (c, cut) {
    var g = c.getContext('2d'), im = g.getImageData(0, 0, c.width, c.height), d = im.data, k = cut || 128;
    for (var i = 0; i < d.length; i += 4) { var v = (d[i + 3] < 128 ? 255 : d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) < k ? 0 : 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    g.putImageData(im, 0, 0); return c;
  };

  /* ───────── the fonts that print clean at one bit: heavy enough that no stroke is thinner than a dot ─────────
     [weight, family]. hand is the poster's own on screen; on paper it is set in sans */
  T.FONTS = {
    sans: ['700', '"Helvetica Neue", Helvetica, Arial, sans-serif'],
    narrow: ['600', '"Archivo Narrow", "Arial Narrow", "Helvetica Neue", Arial, sans-serif'],
    serif: ['900', 'Fraunces, "Cooper Black", Georgia, serif'],
    mono: ['700', 'ui-monospace, Menlo, Consolas, "Courier New", monospace'],
    hand: ['400', '"Architects Daughter", "Comic Sans MS", "Bradley Hand", cursive']
  };
  T.PAPER_FONTS = ['sans', 'narrow', 'serif', 'mono'];
  /* a font key as a CSS font: "sans", "narrow:500", or "asset:<name>" (a font the style carries); px already on the grid */
  T.font = function (st, key, px, paper) {
    var k = String(key || 'sans'), wt = null, m = k.match(/^(\w+):(\d{3})$/); if (m) { k = m[1]; wt = m[2]; }
    var a = /^asset:([\w-]{1,24})$/.exec(String(key || ''));
    if (a && st && st.assets && st.assets[a[1]] && /^data:font\//.test(st.assets[a[1]])) return '400 ' + px + 'px "' + famOf(st, a[1]) + '", ' + T.FONTS.sans[1];
    if (!T.FONTS[k] || (paper && k === 'hand')) k = 'sans'; var f = T.FONTS[k]; return (wt || f[0]) + ' ' + px + 'px ' + f[1];
  };
  var famOf = function (st, name) { return 'ngs-' + String(st.id || 's').replace(/[^\w-]/g, '') + '-' + name; };
  var LOADED = {};
  /* the fonts a style carries, made ready once (a promise; never fails) */
  T.fontsOf = function (st) {
    if (!st || !st.assets || !window.FontFace || !document.fonts) return Promise.resolve();
    return Promise.all(Object.keys(st.assets).filter(function (n) { return /^data:font\//.test(st.assets[n]); }).map(function (n) {
      var fam = famOf(st, n); if (LOADED[fam]) return LOADED[fam];
      try { var ff = new FontFace(fam, 'url(' + st.assets[n] + ')'); return (LOADED[fam] = ff.load().then(function (f) { document.fonts.add(f); }).catch(function () {})); } catch (e) { return Promise.resolve(); }
    })).then(function () {});
  };

  /* ───────── styles: one JSON (and its assets) sets the whole receipt ─────────
     fonts { head, body, small } on paper; screen { head, body, small } on screen (else the same); size: the words on paper against the
     poster as drawn (1.3: a third bigger); lead: line spacing; margin; photo { dither (auto | atkinson | floyd | bayer | none),
     contrast, sharpen, gamma }; frame (hand | rule | box | none) round the picture; rule (dots | solid | none) under the words;
     top (mark | band | none): the mark and the name, or the same reversed out of a solid black band; night (solid | shade): a dark
     print solid black, or a fine shade; colours { paper, ink } on screen (the paper key swaps them); mark: an asset (a small image)
     printed at the foot; assets { name: data URL } fonts (woff2) and images (png) */
  T.HOUSE = [
    { id: 'house', name: 'HOUSE', by: 'novel.global', fonts: { head: 'sans', body: 'sans', small: 'sans' }, screen: { head: 'hand', body: 'narrow', small: 'sans:500' },
      size: 1.3, lead: 1, margin: 1, photo: {}, frame: 'hand', rule: 'dots', top: 'mark', night: 'solid' },
    { id: 'press', name: 'PRESS', by: 'novel.global', fonts: { head: 'mono', body: 'mono', small: 'mono' }, size: 1.25, lead: 1.05, margin: 0.8,
      photo: { dither: 'floyd', contrast: 0.5, sharpen: 1.3, gamma: 0.7 }, frame: 'box', rule: 'solid', top: 'band', night: 'solid', colours: { paper: '#0E0F11', ink: '#E8E6DF' } },
    { id: 'quiet', name: 'QUIET', by: 'novel.global', fonts: { head: 'narrow', body: 'narrow', small: 'narrow:500' }, size: 1.2, lead: 1.15, margin: 1.25,
      photo: { dither: 'atkinson', contrast: 0.15, sharpen: 0.8 }, frame: 'none', rule: 'none', top: 'mark', night: 'solid', colours: { paper: '#F7F5EE', ink: '#1B1B1B' } },
    { id: 'loud', name: 'LOUD', by: 'novel.global', fonts: { head: 'serif', body: 'sans', small: 'sans' }, size: 1.5, lead: 0.95, margin: 0.7,
      photo: { dither: 'auto', contrast: 0.65, sharpen: 1.5, gamma: 0.66 }, frame: 'rule', rule: 'solid', top: 'band', night: 'solid' }
  ];
  var ONE = { frame: ['hand', 'rule', 'box', 'none'], rule: ['dots', 'solid', 'none'], top: ['mark', 'band', 'none'], night: ['solid', 'shade'], dither: ['auto', 'atkinson', 'floyd', 'bayer', 'fs', 'jjn', 'model', 'blue', 'am', 'none'] };
  var num = function (v, lo, hi, d) { v = +v; return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; };
  var word = function (v, n) { return String(v == null ? '' : v).replace(/[^\w .·'&+-]/g, '').trim().slice(0, n); };
  var col = function (v) { return /^#[0-9a-f]{6}$/i.test(String(v || '')) ? String(v).toLowerCase() : null; };
  var fkey = function (v, assets) { var s = String(v || ''); if (/^asset:[\w-]{1,24}$/.test(s) && assets && assets[s.slice(6)]) return s; return /^(sans|narrow|serif|mono|hand)(:[1-9]00)?$/.test(s) ? s : null; };
  /* a style as it may be used: every field checked and kept within its bounds, anything else let go. An artist's pack is never trusted */
  T.clean = function (s) {
    if (!s || typeof s !== 'object') return null; var o = { id: word(s.id, 32).replace(/[^\w-]/g, '') || 's' + Math.abs(hash(JSON.stringify(s))).toString(36), name: word(s.name, 24).toUpperCase() || 'STYLE', by: word(s.by, 40) };
    var A = {}, tot = 0; if (s.assets && typeof s.assets === 'object') Object.keys(s.assets).slice(0, 6).forEach(function (n) { var v = String(s.assets[n] || ''), nm = String(n).replace(/[^\w-]/g, '').slice(0, 24);
      if (nm && /^data:(font\/(woff2|woff|ttf|otf)|image\/(png|jpeg|webp));base64,[A-Za-z0-9+/=]+$/.test(v) && tot + v.length <= 90000) { A[nm] = v; tot += v.length; } });
    if (Object.keys(A).length) o.assets = A;
    var F = function (f) { var r = {}; if (!f || typeof f !== 'object') return null; ['head', 'body', 'small'].forEach(function (k) { var v = fkey(f[k], A); if (v) r[k] = v; }); return Object.keys(r).length ? r : null; };
    o.fonts = F(s.fonts) || { head: 'sans', body: 'sans', small: 'sans' }; ['head', 'body', 'small'].forEach(function (k) { if (!o.fonts[k]) o.fonts[k] = o.fonts.body || o.fonts.head || 'sans'; }); var sc = F(s.screen); if (sc) o.screen = sc;
    o.size = num(s.size, 0.8, 2, 1.3); o.lead = num(s.lead, 0.8, 1.6, 1); o.margin = num(s.margin, 0.5, 1.8, 1);
    var p = s.photo && typeof s.photo === 'object' ? s.photo : {}; o.photo = {}; if (ONE.dither.indexOf(p.dither) >= 0) o.photo.dither = p.dither;
    if (p.contrast != null) o.photo.contrast = num(p.contrast, 0, 1, 0.25); if (p.sharpen != null) o.photo.sharpen = num(p.sharpen, 0, 2.5, 1); if (p.gamma != null) o.photo.gamma = num(p.gamma, 0.3, 1.6, 0.8);
    ['frame', 'rule', 'top', 'night'].forEach(function (k) { o[k] = ONE[k].indexOf(s[k]) >= 0 ? s[k] : ONE[k][0]; });
    if (s.colours && col(s.colours.paper) && col(s.colours.ink)) o.colours = { paper: col(s.colours.paper), ink: col(s.colours.ink) };
    if (s.mark && A[String(s.mark)] && /^data:image\//.test(A[String(s.mark)])) o.mark = String(s.mark);
    return o;
  };
  /* a mod pack: { name, by, styles: [...] }, or one style alone */
  T.pack = function (j) {
    if (typeof j === 'string') { try { j = JSON.parse(j); } catch (e) { return null; } }
    if (!j || typeof j !== 'object') return null; var list = Array.isArray(j.styles) ? j.styles : j.fonts || j.photo ? [j] : [];
    var styles = list.slice(0, 12).map(T.clean).filter(Boolean); if (!styles.length) return null;
    return { name: word(j.name, 40).toUpperCase() || styles[0].name, by: word(j.by, 40), styles: styles };
  };
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
  T.hash = hash;
  T.HOUSE = T.HOUSE.map(T.clean);
  /* the darker of a style's two colours is its dark paper */
  T.lum = function (hex) { var n = parseInt(String(hex).slice(1), 16); return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114; };
  T.rgb = function (hex) { var n = parseInt(String(hex).slice(1), 16); return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255); };

  /* ───────── the calibration strip ─────────
     W dots wide. Eleven patches as the printer lays them (nothing done but the dots), numbered 0 to 10; the same through the curve as
     it is now (an even ramp once tuned); a solid black block (stripes or grey in it: more heat); words at four sizes in each paper font;
     lines one, two and three dots thick */
  T.strip = function (o) {
    o = o || {}; var g0 = T.grid(o.dots), W = g0.dots, how = o.dither === 'bayer' ? 'bayer' : 'floyd', lut = T.curve(o.cal), u = W / 512, pad = Math.round(16 * u);
    var pw = Math.floor((W - pad * 2) / 11), ph = Math.round(64 * u), H = Math.round(980 * u), c = document.createElement('canvas'); c.width = W; c.height = H;
    var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.fillStyle = '#000'; x.textBaseline = 'top';
    var sz = function (n) { return Math.round(n * u); }, y = pad;
    x.font = T.font(null, 'sans', sz(26)); x.fillText('CALIBRATION', pad, y); x.font = T.font(null, 'sans', sz(16)); var r = g0.dots + ' DOTS · ' + g0.dpi + ' DPI · HEAT ' + (o.heat || 0); x.fillText(r, W - pad - x.measureText(r).width, y + sz(8)); y += sz(44);
    var row = function (label, map) {
      x.font = T.font(null, 'sans', sz(16)); x.fillText(label, pad, y); y += sz(24);
      var L = new Float32Array(pw * ph); for (var i = 0; i <= 10; i++) { var v = map(Math.round(i * 25.5)); for (var q = 0; q < L.length; q++) L[q] = v; T.dots(L, pw, ph, how);
        var im = x.createImageData(pw, ph); for (q = 0; q < L.length; q++) { im.data[q * 4] = im.data[q * 4 + 1] = im.data[q * 4 + 2] = L[q]; im.data[q * 4 + 3] = 255; } x.putImageData(im, pad + i * pw, y);
        x.fillStyle = '#000'; x.font = T.font(null, 'mono', sz(18)); var t = String(i); x.fillText(t, pad + i * pw + (pw - x.measureText(t).width) / 2, y + ph + sz(4)); }
      y += ph + sz(34);
    };
    row('AS IT PRINTS  ·  ' + how.toUpperCase(), function (v) { return v; });
    var k = T.cal(o.cal); row('THROUGH THE CURVE  ·  ' + k.b + ' / ' + k.m + ' / ' + k.w, function (v) { return lut[v]; });
    x.font = T.font(null, 'sans', sz(16)); x.fillText('SOLID BLACK', pad, y); y += sz(24); x.fillRect(pad, y, W - pad * 2, sz(90)); y += sz(90) + sz(22);
    T.PAPER_FONTS.forEach(function (f) { var xx = pad; [14, 18, 24, 32].forEach(function (n) { x.font = T.font(null, f, sz(n)); var t = f + ' ' + n; x.fillText(t, xx, y + sz(32 - n)); xx += x.measureText(t).width + sz(14); }); y += sz(44); });
    y += sz(6); [1, 2, 3].forEach(function (n) { x.fillRect(pad, y, W - pad * 2, n); y += sz(14); });
    x.font = T.font(null, 'sans', sz(14)); ['b: the lightest patch still solid black', 'm: the patch half way to paper', 'w: the darkest patch that looks like paper'].forEach(function (t) { y += sz(4); x.fillText(t, pad, y); y += sz(20); });
    var out = document.createElement('canvas'); out.width = W; out.height = Math.min(H, y + pad); out.getContext('2d').drawImage(c, 0, 0);
    return T.solid(out, 128);
  };

  window.THERMAL = T;
})();

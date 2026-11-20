/* novel.global, thermal-first: what the receipt printer can lay down, and the styles a receipt is set in. Shared by the base, the aura
   and the approval page (build.mjs puts it in front of base.js and admin.js), plain script for old phones.
   The TM-T88V lays 512 dots across 72 mm of 80 mm paper (180 dpi); a 203 dpi printer lays 576. Every word is drawn on that grid and
   made solid ink (a hot dot or none, never grey, never dithered). Only photographs are dotted, after a curve measured on the printer
   itself (the calibration strip), with the dots chosen for each picture, or given the printer's own sixteen greys. */
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

  /* ───────── the ways to lay a photograph, for quality (not looks) ─────────
     grey      the printer's own sixteen greys (multi-tone graphics, GS ( L): no dots at all, each dot of the head given one of sixteen
               heats. The tones are rounded to the sixteen and the small error spread on (both ways along the rows), so no bands
     fs        dots by error diffusion, Floyd-Steinberg, run both ways along the rows (serpentine): every grey kept, no drift to one side
     jjn       dots by error spread wide (Jarvis-Judice-Ninke, 12 neighbours), serpentine: the smoothest gradients in dots
     atkinson  dots, three quarters of the error kept: clean and bright
     am        clustered dots on a 45° screen, grown round from each cell's middle: the steadiest when the head runs hot */
  /* error diffusion both ways along the rows; lv: round to steps of lv (17: the sixteen greys) instead of to black or paper */
  function ser(L, W, H, taps, div, lv) {
    for (var y = 0; y < H; y++) { var rev = y & 1, x0 = rev ? W - 1 : 0, dx = rev ? -1 : 1;
      for (var k = 0, x = x0; k < W; k++, x += dx) { var i = y * W + x, v = L[i], o = lv ? Math.max(0, Math.min(255, Math.round(v / lv) * lv)) : v < 128 ? 0 : 255, e = v - o; L[i] = o; if (!e) continue;
        for (var t = 0; t < taps.length; t += 3) { var xx = x + taps[t] * dx, yy = y + taps[t + 1]; if (xx >= 0 && xx < W && yy < H) L[yy * W + xx] += e * taps[t + 2] / div; } } }
    return L; }
  var FS = [1, 0, 7, -1, 1, 3, 0, 1, 5, 1, 1, 1], JJN = [1, 0, 7, 2, 0, 5, -2, 1, 3, -1, 1, 5, 0, 1, 7, 1, 1, 5, 2, 1, 3, -2, 2, 1, -1, 2, 3, 0, 2, 5, 1, 2, 3, 2, 2, 1];
  /* a fixed 64 × 64 of small noise (made the same every time) to break the screen's steps */
  var NOISE = (function () { var n = new Float32Array(4096), s = 7; for (var i = 0; i < 4096; i++) { s = (s * 16807) % 2147483647; n[i] = s / 2147483647 * 255 - 127.5; } return n; })();
  /* the screen: a cell of p dots on the diagonal, a round dot grown from its middle. The round spot does not grow evenly with the grey, so
     each grey is first sent to the level that covers as much of the cell as it should (measured once over a patch of whole cells) */
  var AMQ = {};
  function amTh(x, y, p) { var k = Math.PI / (p * Math.SQRT2), s = (Math.cos((x + y) * k * 2) + Math.cos((x - y) * k * 2)) / 2; return 255 * (s + 1) / 2 + NOISE[(y & 63) * 64 + (x & 63)] * 0.06; }
  function amLut(p) { if (AMQ[p]) return AMQ[p]; var S = 96, th = new Float32Array(S * S), x, y, g, cov = new Float32Array(256), lut = new Uint8Array(256);
    for (y = 0; y < S; y++) for (x = 0; x < S; x++) th[y * S + x] = amTh(x, y, p);
    for (g = 0; g < 256; g++) { var b = 0; for (x = 0; x < th.length; x++) if (g < th[x]) b++; cov[g] = b / th.length; }
    for (var v = 0; v < 256; v++) { var want = 1 - v / 255, best = 0, bd = 9; for (g = 0; g < 256; g++) { var dd = Math.abs(cov[g] - want); if (dd < bd) { bd = dd; best = g; } } lut[v] = best; }
    return (AMQ[p] = lut); }
  function am(L, W, H, p) { p = p || 6; var lut = amLut(p);
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) { var i = y * W + x, v = L[i]; L[i] = v >= 255 ? 255 : v <= 0 ? 0 : lut[v | 0] < amTh(x, y, p) ? 0 : 255; } return L; }
  T.DOTS_MORE = { fs: function (L, W, H) { return ser(L, W, H, FS, 16); }, jjn: function (L, W, H) { return ser(L, W, H, JJN, 48); }, am: function (L, W, H) { return am(L, W, H, 4); },
    grey: function (L, W, H) { return ser(L, W, H, FS, 16, 17); } };

  /* each way with the tones that suit it: how far the mid-tones are lifted against the dot gain (under 1 lighter), and how much the edges
     are lifted. The greys spread least, so they lift nothing. A and B are the same greys with their four layers sent in the two orders
     the printer might want (the GREY CHECK on the photo test shows which is right) */
  T.QUALITY = [
    { key: 'A', id: 'grey', order: 'a', name: 'GREY 16 · ORDER 1', how: 'The printer\'s own greys, no dots', gamma: 1, sharpen: 0.6, local: 0.3 },
    { key: 'B', id: 'grey', order: 'b', name: 'GREY 16 · ORDER 2', how: 'The same greys, layers the other way', gamma: 1, sharpen: 0.6, local: 0.3 },
    { key: 'C', id: 'fs', name: 'FLOYD-STEINBERG, BOTH WAYS', how: 'Dots, error to 4 neighbours', gamma: 0.78, sharpen: 0.6, local: 0.2 },
    { key: 'D', id: 'jjn', name: 'JARVIS-JUDICE-NINKE', how: 'Dots, error spread to 12', gamma: 0.8, sharpen: 0.9, local: 0.2 },
    { key: 'E', id: 'atkinson', name: 'ATKINSON', how: 'Dots, clean and bright', gamma: 0.8, sharpen: 0.8, local: 0.15 },
    { key: 'F', id: 'am', name: 'CLUSTERED DOTS, 45°', how: 'Round dots, steadiest when hot', gamma: 0.9, sharpen: 0.4, local: 0.15 }
  ];
  /* the ways the old photo test had that are gone, sent to the nearest kept */
  var OLD = { blue: 'fs', model: 'fs' };
  T.dotName = function (id) { return id === 'grey' ? 'GREY 16' : String(id || 'auto').toUpperCase(); };
  /* a photograph (an image or a canvas) laid one way at W dots across: scaled down in halves (no shimmer), stretched to its own black and
     white, its edges lifted, its mid-tones set for the way, through the measured curve when there is one (dots only), then the dots */
  T.lay = function (src, W, q, cal, maxH, crop) { return T.photo(src, W, { clip: 0.5, gamma: q.gamma, contrast: 0, local: q.local || 0, sharpen: q.sharpen, dither: q.id, cal: cal || null }, maxH, crop); };

  /* ───────── the sets the approval page chooses from, and how a print's settings are settled ─────────
     clip: how much of the darkest and lightest is let go when the tones are stretched (%); gamma: the mid-tones (higher darker, under 1 lifted); contrast: an
     S-curve on top (0 to 1); local: detail lifted against what is near it (0 to 1); sharpen: the edges lifted (0 to 2.5); dither: the dots (or grey: none); lineCut: words and lines below this
     lightness print black; bolden: dots added round words and lines (0 to 2); minText: the smallest words, in dots at 512 wide; speed:
     the printer's speed (1 slowest and darkest to 13; 0 as the printer is set); parts: the head heated in 1, 2 or 4 parts (0 as set) */
  T.SETS = {
    soft: { clip: 1, gamma: 0.8, contrast: 0, local: 0, sharpen: 0.7, dither: 'atkinson', lineCut: 200, bolden: 0, minText: 14, speed: 0, parts: 0 },
    crisp: { clip: 2, gamma: 0.72, contrast: 0.25, local: 0, sharpen: 1.1, dither: 'auto', lineCut: 215, bolden: 0, minText: 18, speed: 0, parts: 0 },
    bold: { clip: 3, gamma: 0.62, contrast: 0.4, local: 0, sharpen: 1.3, dither: 'floyd', lineCut: 225, bolden: 1, minText: 20, speed: 0, parts: 0 },
    screen: { clip: 2, gamma: 0.7, contrast: 0.3, local: 0, sharpen: 0.9, dither: 'bayer', lineCut: 215, bolden: 0, minText: 18, speed: 0, parts: 0 },
    graphic: { clip: 4, gamma: 0.75, contrast: 0.7, local: 0, sharpen: 1.6, dither: 'none', lineCut: 230, bolden: 1, minText: 20, speed: 0, parts: 0 }
  };
  /* o: what the approval page saved (printq); photo: the style's own photograph settings. The set first, then the style's photograph,
     then a way the owner chose with its own mid-tones and edges (as the photo test laid it), then every tweak the approval page set apart:
     the owner's word is always last, so it always shows. With the curve and no mid-tones set, the curve stands for them.
     order: how the sixteen greys' four layers are sent (a or b, from the GREY CHECK) */
  T.settle = function (o, photo) { o = o || {}; photo = photo || {}; var b = T.SETS[o.preset] || T.SETS.crisp, out = {}, k, qw = null, has = function (k2) { return o[k2] != null && o[k2] !== ''; };
    for (k in b) out[k] = b[k]; for (k in photo) if (photo[k] != null) out[k] = photo[k];
    if (has('dither')) { out.dither = OLD[o.dither] || o.dither; qw = T.QUALITY.filter(function (q) { return q.id === out.dither; })[0]; if (qw) { out.gamma = qw.gamma; out.sharpen = qw.sharpen; out.clip = 0.5; out.contrast = 0; out.local = qw.local || 0; } }
    out.cal = o.cal ? T.cal(o.cal) : null; if (out.cal && !qw && photo.gamma == null) out.gamma = 1;
    for (k in b) if (k !== 'dither' && has(k) && isFinite(+o[k])) out[k] = +o[k];
    out.order = o.order === 'b' ? 'b' : 'a';
    out.preset = T.SETS[o.preset] ? o.preset : 'crisp'; return out; };
  /* what the printer is told before a picture, from settled settings */
  T.opts = function (Q) { Q = Q || {}; return { speed: +Q.speed || 0, parts: +Q.parts || 0, order: Q.order === 'b' ? 'b' : 'a' }; };
  /* a photograph's tones made ready for the dots, in place (L: lightness 0 to 255): stretched to its own black and white, mid-tones,
     contrast, edges, then through the measured curve (the curve is measured in dots, so the greys skip it). Gives back the way to lay it
     (auto: chosen for this picture) */
  /* a soft blur of radius r (two running sums, across then down) */
  function soft(L, W, H, r) { var A = new Float32Array(W * H), B = new Float32Array(W * H), x, y, s, k, m = 2 * r + 1;
    for (y = 0; y < H; y++) { var o = y * W; s = 0; for (k = -r; k <= r; k++) s += L[o + Math.max(0, Math.min(W - 1, k))]; for (x = 0; x < W; x++) { A[o + x] = s / m; s += L[o + Math.min(W - 1, x + r + 1)] - L[o + Math.max(0, x - r)]; } }
    for (x = 0; x < W; x++) { s = 0; for (k = -r; k <= r; k++) s += A[Math.max(0, Math.min(H - 1, k)) * W + x]; for (y = 0; y < H; y++) { B[y * W + x] = s / m; s += A[Math.min(H - 1, y + r + 1) * W + x] - A[Math.max(0, y - r) * W + x]; } }
    return B; }
  T.tone = function (L, W, H, Q) {
    var n = W * H, hist = new Uint32Array(256), l, i, cut = n * Math.max(0, Math.min(10, +Q.clip || 0)) / 100;
    for (l = 0; l < n; l++) hist[Math.max(0, Math.min(255, L[l] | 0))]++;
    var lo = 0, hi = 255, acc = 0; for (i = 0; i < 256; i++) { acc += hist[i]; if (acc > cut) { lo = i; break; } } acc = 0; for (i = 255; i >= 0; i--) { acc += hist[i]; if (acc > cut) { hi = i; break; } } if (hi - lo < 40) { lo = 0; hi = 255; }
    var span = hi - lo, gm = Math.max(0.3, Math.min(1.6, +Q.gamma || 0.8)), ct = Math.max(0, Math.min(1, +Q.contrast || 0)), sh = Math.max(0, Math.min(2.5, +Q.sharpen || 0));
    for (l = 0; l < n; l++) { var t = Math.pow(Math.max(0, Math.min(1, (L[l] - lo) / span)), gm); if (ct) t = t + ct * (t - 0.5) * (1 - Math.abs(2 * t - 1)) * 2; L[l] = 255 * Math.max(0, Math.min(1, t)); }
    var lc = Math.max(0, Math.min(1, +Q.local || 0)); if (lc) { var Bl = soft(L, W, H, Math.max(3, Math.round(Math.min(W, H) / 24))); for (l = 0; l < n; l++) L[l] = L[l] + lc * (L[l] - Bl[l]); }
    if (sh) { var B = new Float32Array(n), y, x, dy, dx; for (y = 0; y < H; y++) for (x = 0; x < W; x++) { var s = 0, m = 0; for (dy = -1; dy <= 1; dy++) for (dx = -1; dx <= 1; dx++) { var y2 = y + dy, x2 = x + dx; if (y2 >= 0 && y2 < H && x2 >= 0 && x2 < W) { s += L[y2 * W + x2]; m++; } } B[y * W + x] = s / m; }
      for (l = 0; l < n; l++) L[l] = L[l] + sh * (L[l] - B[l]); }
    for (l = 0; l < n; l++) L[l] = L[l] < 10 ? 0 : L[l] > 245 ? 255 : L[l];
    var how = !Q.dither || Q.dither === 'auto' ? T.pick(L, W, H) : Q.dither, lut = Q.cal && how !== 'grey' ? T.curve(Q.cal) : null;
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
  /* lightness back onto a canvas */
  function paint(c, L) { var x = c.getContext('2d'), im = x.createImageData(c.width, c.height); for (var p = 0; p < L.length; p++) { im.data[p * 4] = im.data[p * 4 + 1] = im.data[p * 4 + 2] = L[p]; im.data[p * 4 + 3] = 255; } x.putImageData(im, 0, 0); return c; }
  /* a photograph laid with settled settings Q, exactly as the site lays it: fitted, toned, dotted (or greyed). c.how: the way it was given */
  T.photo = function (src, W, Q, maxH, crop) { var c = T.fit(src, W, maxH, crop), w = c.width, h = c.height, x = c.getContext('2d'), L = T.luma(x.getImageData(0, 0, w, h).data, w * h);
    var how = T.tone(L, w, h, Q); T.dots(L, w, h, how); paint(c, L); c.how = how; return c; };
  /* sixteen steps black to paper, laid with Q (no stretch, no edges: the tones alone) */
  T.wedge = function (w, h, Q, n) { n = n || 16; var q = {}, k; for (k in Q) q[k] = Q[k]; q.clip = 0; q.sharpen = 0; var L = new Float32Array(w * h), x, y;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) L[y * w + x] = Math.min(255, Math.floor(x * n / w) * 255 / (n - 1)); var how = T.tone(L, w, h, q); if (q.dither === 'auto' || !q.dither) how = 'floyd'; T.dots(L, w, h, how);
    var c = document.createElement('canvas'); c.width = w; c.height = h; paint(c, L); c.how = how; return c; };
  /* the sixteen greys exactly, black (15) to paper (0), nothing done to them: the GREY CHECK */
  T.steps16 = function (w, h) { var L = new Float32Array(w * h), x, y; for (y = 0; y < h; y++) for (x = 0; x < w; x++) L[y * w + x] = Math.floor(x * 16 / w) * 17;
    var c = document.createElement('canvas'); c.width = w; c.height = h; paint(c, L); c.how = 'grey'; return c; };
  /* words and lines made pure: black below the cut, then a dot or two bolder (as the site does to every receipt's words) */
  T.ink = function (c, cut, bolden) { var x = c.getContext('2d'), W = c.width, H = c.height, im = x.getImageData(0, 0, W, H), d = im.data, n = W * H, k = new Uint8Array(n), l, i;
    cut = Math.max(120, Math.min(250, +cut || 200)); var bo = Math.max(0, Math.min(2, Math.round(+bolden || 0)));
    for (l = 0, i = 0; l < n; l++, i += 4) k[l] = (d[i + 3] < 128 ? 255 : d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) < cut ? 1 : 0;
    for (var r = 0; r < bo; r++) { var k2 = new Uint8Array(k); for (l = 0; l < n; l++) if (!k[l]) { var px = l % W; if ((px > 0 && k[l - 1]) || (px < W - 1 && k[l + 1]) || (l >= W && k[l - W]) || (l < n - W && k[l + W])) k2[l] = 1; } k = k2; }
    for (l = 0, i = 0; l < n; l++, i += 4) { d[i] = d[i + 1] = d[i + 2] = k[l] ? 0 : 255; d[i + 3] = 255; } x.putImageData(im, 0, 0); return c; };

  /* a slip being drawn: words and lines first, made solid ink at the end, and only then the greys laid on (so the words never print grey) */
  function slip(W, H) { var c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d'), later = [], u = W / 512;
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.fillStyle = '#000'; x.textBaseline = 'top';
    var s = { c: c, x: x, u: u, sz: function (n) { return Math.max(1, Math.round(n * u)); },
      pic: function (p, x0, y0) { if (p.how === 'grey') later.push([p, x0, y0]); else x.drawImage(p, x0, y0); },
      put: function (t, fam, px, x0, y0, mw) { var f = px; do { x.font = T.font(null, fam, s.sz(f)); f -= 1; } while (f > 8 && x.measureText(t).width > mw); x.fillText(t, x0, y0); },
      rule: function (y0) { for (var dx = s.sz(10); dx < W - s.sz(10); dx += s.sz(8)) x.fillRect(dx, y0, s.sz(3), 1); },
      done: function (h) { T.solid(c, 128); later.forEach(function (l) { x.drawImage(l[0], l[1], l[2]); }); if (!h || h >= H) return c; var o = document.createElement('canvas'); o.width = W; o.height = h; o.getContext('2d').drawImage(c, 0, 0); return o; } };
    return s; }
  var r2 = function (v) { return Math.round(v * 100) / 100; };
  /* n steps d apart that hold v, moved whole to stay between a and b */
  function around(v, d, n, a, b) { var lo = -Math.floor((n - 1) / 2); while (lo < 0 && v + lo * d < a - 1e-9) lo++; while (lo > -(n - 1) && v + (lo + n - 1) * d > b + 1e-9) lo--;
    var r = []; for (var i = 0; i < n; i++) r.push(r2(Math.max(a, Math.min(b, v + (lo + i) * d)))); return r; }
  var own = function (v) { return +v ? String(v) : 'OWN'; };
  /* every setting in two lines, for the top of a slip */
  function said(Q, how) { return ['SET ' + String(Q.preset || 'crisp').toUpperCase() + ' · DOTS ' + T.dotName(Q.dither) + (Q.dither === 'auto' || !Q.dither ? ' (' + T.dotName(how) + ')' : '') + (how === 'grey' || Q.dither === 'grey' ? ' · ORDER ' + (Q.order === 'b' ? 2 : 1) : '') + ' · CURVE ' + (Q.cal ? Q.cal.b + '/' + Q.cal.m + '/' + Q.cal.w : 'OFF'),
    'MID ' + r2(+Q.gamma || 0) + ' · CONTRAST ' + r2(+Q.contrast || 0) + ' · LOCAL ' + r2(+Q.local || 0) + ' · EDGES ' + r2(+Q.sharpen || 0) + ' · STRETCH ' + r2(+Q.clip || 0) + ' · SPEED ' + own(Q.speed) + ' · PARTS ' + own(Q.parts)]; }

  /* ───────── TUNE: the saved settings, and clear steps either side, on one slip ─────────
     Every sample big, two to a row, each with a letter and its number under it: the photograph as the site prints it now (every setting
     written above it), four mid-tones, two contrasts, two edges, then three bands at three speeds (the printer is told each speed as it
     reaches the band). o: { dots, q (settled), crop }. Gives back { c, steps } for T.raster */
  T.tune = function (img, o) { o = o || {}; var W = T.grid(o.dots).dots, Q = o.q || T.settle({}), crop = o.crop || [0.18, 0.12, 0.64, 0.6], u = W / 512, sz = function (n) { return Math.max(1, Math.round(n * u)); }, pad = sz(10);
    var withQ = function (k, v) { var q = {}, j; for (j in Q) q[j] = Q[j]; q[k] = v; return q; };
    var pw = Math.floor((W - pad * 3) / 2), ph = Math.round(pw * 0.9), lab = sz(30), first = T.photo(img, W - pad * 2, Q, sz(380));
    var groups = [['MID-TONES', 'gamma', 'MID', around(+Q.gamma || 0.8, 0.25, 4, 0.3, 1.6)], ['CONTRAST', 'contrast', 'CONTRAST', around(+Q.contrast || 0, 0.5, 2, 0, 1)], ['LOCAL CONTRAST', 'local', 'LOCAL', around(+Q.local || 0, 0.3, 2, 0, 1)], ['EDGES', 'sharpen', 'EDGES', around(+Q.sharpen || 0, 1.2, 2, 0, 2.5)]];
    var speeds = [13, 6, 1], bandH = sz(150), wl = W - pad * 3 - pw;
    var H = pad + sz(76) + first.height + sz(8) + sz(24) + sz(30) + groups.reduce(function (a, g) { return a + sz(34) + Math.ceil(g[3].length / 2) * (ph + lab); }, 0) + sz(34) + speeds.length * (bandH + sz(14)) + sz(40) + pad;
    var S = slip(W, H), y = pad, n = 0, L = function () { return String.fromCharCode(65 + n++); }, said2 = said(Q, first.how), keys = [], key = function (t) { keys.push(t); return t; };
    S.put('TUNE' + (o.n ? ' · TEST ' + o.n : ''), 'sans', 24, pad, y, W - pad * 2); S.put(said2[0], 'mono', 13, pad, y + sz(32), W - pad * 2); S.put(said2[1], 'mono', 13, pad, y + sz(52), W - pad * 2);
    y += sz(76); S.pic(first, Math.round((W - first.width) / 2), y); y += first.height + sz(8);
    S.pic(T.wedge(W - pad * 2, sz(24), Q), pad, y); y += sz(24); S.put('AS SAVED · BLACK → PAPER', 'mono', 12, pad, y + sz(8), W - pad * 2); y += sz(30);
    groups.forEach(function (g) { S.rule(y + sz(4)); S.put(g[0], 'sans', 18, pad, y + sz(12), W - pad * 2); y += sz(34);
      g[3].forEach(function (v, i) { var x0 = pad + (i % 2) * (pw + pad), p = T.photo(img, pw, withQ(g[1], v), ph, crop); S.pic(p, x0 + Math.round((pw - p.width) / 2), y);
        S.put(key(L() + '  ' + g[2] + ' ' + v + (v === r2(+Q[g[1]] || 0) ? '  SAVED' : '')), 'mono', 15, x0, y + ph + sz(6), pw);
        if (i % 2 || i === g[3].length - 1) y += ph + lab; }); });
    S.rule(y + sz(4)); S.put('SPEED', 'sans', 18, pad, y + sz(12), W - pad * 2); y += sz(34);
    var steps = [];
    speeds.forEach(function (sp) { steps.push({ y: y, speed: sp }); S.pic(T.photo(img, pw, Q, bandH, crop), pad, y); var wx = pad * 2 + pw; S.pic(T.wedge(wl, sz(70), Q), wx, y);
      S.put(key(L() + '  SPEED ' + sp + (sp === +Q.speed ? '  SAVED' : '')), 'mono', 15, wx, y + sz(84), wl); y += bandH + sz(14); });
    steps.push({ y: y, speed: +Q.speed || 0 });
    S.put('1 SLOWEST AND DARKEST · 13 FASTEST', 'mono', 12, pad, y + sz(10), W - pad * 2);
    return { c: S.done(), steps: steps, said: said2, keys: keys }; };

  /* the photo test: first the GREY CHECK (the sixteen greys sent both orders: the one that steps evenly from black to paper is how this
     printer reads them), then the photograph laid each way, big, its letter and every number under it and its steps beside. Gives back
     { c, steps } for T.raster: each grey part is sent in its own order */
  T.photoTest = function (img, o) { o = o || {}; var g0 = T.grid(o.dots), W = g0.dots, u = W / 512, sz = function (n) { return Math.max(1, Math.round(n * u)); }, pad = sz(10);
    var ways = T.QUALITY.filter(function (q) { return !o.ways || o.ways.indexOf(q.key) >= 0 || o.ways.indexOf(q.id) >= 0; }), pw = W - pad * 2, ph = sz(420), wh = sz(40), sh = sz(22);
    var parts = ways.map(function (q) { return { q: q, p: T.lay(img, pw, q, q.id === 'grey' ? null : o.cal, ph), w: T.wedge(pw, sh, { gamma: 1, contrast: 0, dither: q.id, cal: q.id === 'grey' ? null : o.cal }) }; });
    var H = pad + sz(60) + sz(30) + (wh + sz(24)) * 2 + sz(30) + parts.reduce(function (a, s) { return a + sz(10) + s.p.height + sh + sz(62); }, 0) + pad;
    var S = slip(W, H), y = pad, steps = [];
    var head = W + ' DOTS · ' + g0.dpi + ' DPI · SPEED ' + own(o.speed) + ' · PARTS ' + own(o.parts) + ' · CURVE ' + (o.cal ? o.cal.b + '/' + o.cal.m + '/' + o.cal.w : 'OFF'), keys = [];
    S.put('PHOTO TEST' + (o.n ? ' · TEST ' + o.n : ''), 'sans', 24, pad, y, W - pad * 2); S.put(W + ' DOTS · ' + g0.dpi + ' DPI · SPEED ' + own(o.speed) + ' · PARTS ' + own(o.parts) + ' · CURVE ' + (o.cal ? o.cal.b + '/' + o.cal.m + '/' + o.cal.w : 'OFF'), 'mono', 13, pad, y + sz(32), W - pad * 2);
    y += sz(60); S.rule(y); S.put('GREY CHECK · PICK THE EVEN ONE', 'sans', 18, pad, y + sz(8), W - pad * 2); y += sz(30);
    ['a', 'b'].forEach(function (ord, k) { steps.push({ y: y, order: ord }); S.pic(T.steps16(pw, wh), pad, y);
      S.put('ORDER ' + (k + 1) + '   15 BLACK → 0 PAPER', 'mono', 13, pad, y + wh + sz(5), pw); y += wh + sz(24); });
    y += sz(30);
    parts.forEach(function (s) { S.rule(y); y += sz(10); steps.push({ y: y, order: s.q.order || 'a' }); S.pic(s.p, pad + Math.round((pw - s.p.width) / 2), y); y += s.p.height; S.pic(s.w, pad, y); y += sh;
      S.put(s.q.key + '  ' + s.q.name, 'sans', 20, pad, y + sz(8), pw); var nums = 'MID ' + s.q.gamma + ' · LOCAL ' + (s.q.local || 0) + ' · EDGES ' + s.q.sharpen; keys.push(s.q.key + '  ' + s.q.name + ' · ' + nums);
      S.put(s.q.how.toUpperCase() + ' · ' + nums, 'mono', 13, pad, y + sz(36), pw); y += sz(62); });
    return { c: S.done(), steps: steps, said: [head], keys: ['ORDER 1: LOW BIT FIRST · ORDER 2: HIGH BIT FIRST'].concat(keys) }; };

  /* the text test: the site's words in each paper font at six sizes, set four ways (two cuts, bolder or not, each with a letter), lines one
     to three dots, then the printer's own letters sent as text (it draws those itself), to choose WORDS AND LINES CUT, BOLDER and the
     smallest words. Gives back { c, after }: after goes to T.raster */
  T.textTest = function (o) { o = o || {}; var W = T.grid(o.dots).dots, u = W / 512, sz = function (n) { return Math.max(1, Math.round(n * u)); }, pad = sz(10), sizes = [12, 14, 16, 18, 20, 24];
    var ways = [[200, 0], [230, 0], [200, 1], [230, 1]], lineH = sz(34), blockH = sz(30) + T.PAPER_FONTS.length * lineH + sz(10);
    var H = pad + sz(60) + ways.length * blockH + sz(30) + sz(60) + sz(30) + pad, S = slip(W, H), y = pad;
    S.put('TEXT TEST' + (o.n ? ' · TEST ' + o.n : ''), 'sans', 24, pad, y, W - pad * 2); S.put('SIZES IN DOTS · ' + W + ' WIDE · SPEED ' + own(o.speed), 'mono', 13, pad, y + sz(32), W - pad * 2); y += sz(60);
    ways.forEach(function (w, k) { S.rule(y); S.put(String.fromCharCode(65 + k) + '  CUT ' + w[0] + ' · BOLDER ' + w[1], 'mono', 15, pad, y + sz(8), W - pad * 2); y += sz(30);
      var b = document.createElement('canvas'); b.width = W; b.height = T.PAPER_FONTS.length * lineH; var bx = b.getContext('2d'); bx.fillStyle = '#fff'; bx.fillRect(0, 0, W, b.height); bx.fillStyle = '#000'; bx.textBaseline = 'top';
      T.PAPER_FONTS.forEach(function (f, i) { var xx = pad; sizes.forEach(function (n) { bx.font = T.font(null, f, sz(n)); var t = 'Kelp ' + n; if (xx + bx.measureText(t).width < W - pad) bx.fillText(t, xx, i * lineH + sz(26 - n)); xx += bx.measureText(t).width + sz(10); }); });
      S.x.drawImage(T.ink(b, w[0], w[1]), 0, y); y += b.height + sz(10); });
    S.rule(y); S.put('LINES 1 · 2 · 3 DOTS', 'mono', 13, pad, y + sz(8), W - pad * 2); y += sz(30);
    [1, 2, 3].forEach(function (n) { S.x.fillRect(pad, y, W - pad * 2, n); y += sz(14); }); y += sz(18);
    S.put('BELOW: THE PRINTER\'S OWN LETTERS', 'mono', 13, pad, y, W - pad * 2); y += sz(30);
    var after = [], txt = function (s) { for (var i = 0; i < s.length; i++) after.push(s.charCodeAt(i) & 127); after.push(10); };
    after.push(0x1B, 0x61, 0x00, 0x1B, 0x4D, 0x00); txt('E  FONT A  The island prints 12345');
    after.push(0x1B, 0x4D, 0x01); txt('F  FONT B  The island prints 12345 small');
    after.push(0x1B, 0x4D, 0x00, 0x1B, 0x45, 0x01); txt('G  FONT A BOLD  The island prints');
    after.push(0x1B, 0x45, 0x00, 0x1D, 0x21, 0x11); txt('H  DOUBLE');
    after.push(0x1D, 0x21, 0x00);
    return { c: S.done(y + pad), after: after, said: ['SIZES 12 14 16 18 20 24 · FONTS ' + T.PAPER_FONTS.join(' ').toUpperCase()], keys: ways.map(function (w, k) { return String.fromCharCode(65 + k) + '  CUT ' + w[0] + ' · BOLDER ' + w[1]; }).concat(['E  FONT A', 'F  FONT B', 'G  FONT A BOLD', 'H  FONT A DOUBLE']) }; };
  /* a small picture of a slip for the test log, one bit, "w,h,base64" (as the site keeps a print's picture) */
  T.thumb = function (cv, w) { w = w || 160; var h = Math.max(1, Math.round(cv.height * w / cv.width)), c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(cv, 0, 0, w, h);
    var L = T.luma(x.getImageData(0, 0, w, h).data, w * h), rb = Math.ceil(w / 8), out = new Uint8Array(rb * h); T.dots(L, w, h, 'fs'); for (var yy = 0; yy < h; yy++) for (var xx = 0; xx < w; xx++) if (L[yy * w + xx] < 128) out[yy * rb + (xx >> 3)] |= 0x80 >> (xx & 7);
    var bin = ''; for (var k = 0; k < out.length; k += 0x8000) bin += String.fromCharCode.apply(null, out.subarray(k, k + 0x8000)); return w + ',' + h + ',' + btoa(bin); };

  /* ───────── to the printer ─────────
     o: { speed (1 slowest and darkest to 13; 0 as the printer is set), parts (the head heated in 1, 2 or 4 parts; 0 as set), order ('a' or
     'b': how the sixteen greys' four layers are sent), after (bytes sent after the picture, before the cut) }. A number (the old heat,
     which the TM-T88V never took) is let go; grey: true lets rows with greys go as greys (only a slip made for them: elsewhere a
     soft edge is not a grey, and every row goes one-bit). steps: [{ y, speed, parts, order }] a change from row y down.
     Rows of black and paper alone go as one-bit raster (GS v 0, 255 rows a time); rows with a grey in them as multi-tone graphics (GS ( L:
     four one-bit layers, together the sixteen greys, up to 400 rows a time, then printed) */
  T.raster = function (cv, o, steps) { o = o && typeof o === 'object' ? o : {};
    var W = cv.width, H = cv.height, bw = W >> 3, d = cv.getContext('2d').getImageData(0, 0, W, H).data, out = [0x1B, 0x40], y, x, p, v, xb, bit;
    var spd = function (s) { s = Math.round(+s || 0); return s >= 1 && s <= 13 ? s : 0; }, prt = function (s) { s = +s; return s === 1 || s === 2 || s === 4 ? s : 0; }, now = { speed: 0, parts: 0 };
    var tell = function (s) { var sp = spd(s.speed), pa = prt(s.parts); if (sp !== now.speed) { out.push(0x1D, 0x28, 0x4B, 0x02, 0x00, 0x32, sp); now.speed = sp; } if (pa !== now.parts) { out.push(0x1D, 0x28, 0x4B, 0x02, 0x00, 0x61, pa); now.parts = pa; } };
    var st = (steps || []).filter(function (s) { return s && s.y >= 0 && s.y < H; }).sort(function (a, b) { return a.y - b.y; }), cut = {};
    st.forEach(function (s) { cut[Math.round(s.y)] = 1; });
    var at = function (y0) { var r = { speed: o.speed, parts: o.parts, order: o.order }; st.forEach(function (s) { if (s.y <= y0) for (var k in r) if (s[k] != null) r[k] = s[k]; }); return r; };
    /* which rows hold a grey; a short run of black-and-paper rows between greys goes with them */
    var g = new Uint8Array(H); if (o.grey) for (y = 0; y < H; y++) for (x = 0, p = y * W * 4; x < W; x++, p += 4) { v = d[p]; if (v > 8 && v < 247) { g[y] = 1; break; } }
    for (y = 0; y < H;) { if (g[y]) { y++; continue; } var e = y; while (e < H && !g[e]) e++; if (y > 0 && e < H && e - y < 24) for (var q = y; q < e; q++) g[q] = 1; y = e; }
    for (var a = 0; a < H;) { var grey = g[a], lim = grey ? 400 : 255, b = a + 1; while (b < H && g[b] === grey && !cut[b] && b - a < lim) b++;
      var s = at(a), h = b - a; tell(s);
      if (!grey) { out.push(0x1D, 0x76, 0x30, 0x00, bw & 0xFF, bw >> 8, h & 0xFF, h >> 8);
        for (y = a; y < b; y++) for (xb = 0; xb < bw; xb++) { v = 0; for (bit = 0; bit < 8; bit++) if (d[(y * W + xb * 8 + bit) * 4] < 128) v |= 0x80 >> bit; out.push(v); } }
      else { var n = bw * h + 10, lv = new Uint8Array(bw * 8 * h);
        for (y = a; y < b; y++) for (x = 0; x < bw * 8; x++) lv[(y - a) * bw * 8 + x] = 15 - Math.max(0, Math.min(15, Math.round(d[(y * W + x) * 4] / 17)));
        for (var c = 0; c < 4; c++) { var sh = s.order === 'b' ? 3 - c : c; /* layer c (colour 49 + c) carries this bit of the darkness, 0 to 15 */
          out.push(0x1D, 0x28, 0x4C, n & 0xFF, n >> 8, 0x30, 0x70, 0x34, 0x01, 0x01, 0x31 + c, (bw * 8) & 0xFF, (bw * 8) >> 8, h & 0xFF, h >> 8);
          for (p = 0; p < lv.length; p += 8) { v = 0; for (bit = 0; bit < 8; bit++) if ((lv[p + bit] >> sh) & 1) v |= 0x80 >> bit; out.push(v); } }
        out.push(0x1D, 0x28, 0x4C, 0x02, 0x00, 0x30, 0x32); }
      a = b; }
    if (o.after) for (var k2 = 0; k2 < o.after.length; k2++) out.push(o.after[k2] & 0xFF);
    out.push(0x1B, 0x64, 0x04, 0x1D, 0x56, 0x42, 0x00);
    var str = ''; for (var i = 0; i < out.length; i += 0x8000) str += String.fromCharCode.apply(null, out.slice(i, i + 0x8000)); return btoa(str);
  };
  /* the printer's own darkness, kept in it (GS ( E: into its settings, the darkness for one-bit and for greys, out again; it restarts).
     v: -6 lightest to 6 darkest, 0 standard; 'dip': back to its switches. A job on its own */
  T.darkness = function (v) { var w = function (n) { n = n & 0xFFFF; return [n & 0xFF, n >> 8]; }, mono = v === 'dip' ? 100 : Math.max(-6, Math.min(6, Math.round(+v || 0))), tone = v === 'dip' ? 0 : mono;
    var out = [0x1D, 0x28, 0x45, 0x03, 0x00, 0x01, 0x49, 0x4E, 0x1D, 0x28, 0x45, 0x07, 0x00, 0x05, 0x05].concat(w(mono), [0x75], w(tone), [0x1D, 0x28, 0x45, 0x04, 0x00, 0x02, 0x4F, 0x55, 0x54]);
    return btoa(String.fromCharCode.apply(null, out)); };
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
  var ONE = { frame: ['hand', 'rule', 'box', 'none'], rule: ['dots', 'solid', 'none'], top: ['mark', 'band', 'none'], night: ['solid', 'shade'], dither: ['auto', 'grey', 'atkinson', 'floyd', 'bayer', 'fs', 'jjn', 'am', 'none'] };
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
    x.font = T.font(null, 'sans', sz(26)); x.fillText('CALIBRATION' + (o.n ? ' · TEST ' + o.n : ''), pad, y); x.font = T.font(null, 'sans', sz(16)); var r = g0.dots + ' DOTS · ' + g0.dpi + ' DPI · SPEED ' + (+o.speed || 'OWN'); x.fillText(r, W - pad - x.measureText(r).width, y + sz(8)); y += sz(44);
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

/* carts */
(function () {
  'use strict';
  var T = window.THERMAL, $ = function (s) { return document.querySelector(s); };
  var SANS = 'Poppins, "Helvetica Neue", Arial, sans-serif', MONO = '"IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace', TTY = 'VT323, ui-monospace, monospace';
  var DAY = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  var R = Math.round, W = 512, M = 8;

  /* today, where the island is */
  var today = function () { try { return new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Melbourne' }); } catch (e) { return new Date().toISOString().slice(0, 10); } };
  var ymd = function (s) { return String(s).split('-').map(Number); };
  var dayNo = function (s) { var a = ymd(s); return R(Date.UTC(a[0], a[1] - 1, a[2]) / 864e5); };
  var seed = function (s, n) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) % n; };
  var age = function (s) { var a = ymd(s), t = Date.UTC(a[0], a[1] - 1, a[2], 2) / 864e5, n0 = Date.UTC(2000, 0, 6, 18, 14) / 864e5; return (((t - n0) / 29.530588853) % 1 + 1) % 1; };
  var phase = function (a) { return a < 0.03 || a > 0.97 ? 'NEW MOON' : a < 0.22 ? 'WAXING CRESCENT' : a < 0.28 ? 'FIRST QUARTER' : a < 0.47 ? 'WAXING GIBBOUS' : a < 0.53 ? 'FULL MOON' : a < 0.72 ? 'WANING GIBBOUS' : a < 0.78 ? 'LAST QUARTER' : 'WANING CRESCENT'; };

  /* drawing kit */
  function kit(cv) {
    var g = cv.getContext('2d', { willReadFrequently: true }), k = { g: g };
    k.txt = function (s, x, y, font, al) { g.font = font; g.textAlign = al || 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = '#000'; g.fillText(s, x, y); return g.measureText(s).width; };
    k.fit = function (s, x, y, wt, px, max, fam, al) { g.font = wt + ' ' + px + 'px ' + fam; while (px > 12 && g.measureText(s).width > max) { px--; g.font = wt + ' ' + px + 'px ' + fam; } return k.txt(s, x, y, g.font, al); };
    k.box = function (x, y, w, h) { g.fillStyle = '#000'; g.fillRect(x, y, w, h); };
    k.wrap = function (s, x, y, font, max, lh) { g.font = font; var words = String(s).split(/\s+/), line = '', n = 0;
      words.forEach(function (w) { var t = line ? line + ' ' + w : w; if (g.measureText(t).width > max && line) { k.txt(line, x, y + n * lh, font); n++; line = w; } else line = t; });
      if (line) { k.txt(line, x, y + n * lh, font); n++; } return n * lh; };
    k.chip = function (s, xr, y) { g.font = '600 19px ' + MONO; var w = g.measureText(s).width + 14; k.box(xr - w, y - 19, w, 26); g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText(s, xr - w + 7, y); return w; };
    k.dots = function (x, y, w, h) { g.fillStyle = '#000'; for (var py = y; py < y + h; py++) for (var px = x; px < x + w; px++) if ((px + py) % 2 === 0) g.fillRect(px, py, 1, 1); };
    k.moon = function (cx, cy, r, a) {
      g.fillStyle = '#000'; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, cy, r - 2, 0, 7); g.fill(); g.fillStyle = '#000';
      for (var dy = -r + 2; dy < r - 1; dy++) { var hw = Math.sqrt((r - 2) * (r - 2) - dy * dy); for (var dx = Math.ceil(-hw); dx < hw; dx++) if ((cx + dx + cy + dy) % 2 === 0) g.fillRect(cx + dx, cy + dy, 1, 1); }
      var c = Math.cos(2 * Math.PI * a); g.fillStyle = '#fff';
      for (dy = -r + 1; dy < r; dy++) { var w = Math.sqrt(r * r - dy * dy) - 2.5; if (w <= 0) continue; var x0 = a < 0.5 ? c * w : -w, x1 = a < 0.5 ? w : -c * w, s0 = -x1, s1 = -x0;   // southern sky
        if (s1 - s0 > 0.5) g.fillRect(R(cx + s0), cy + dy, R(s1 - s0), 1); }
    };
    /* head */
    k.head = function (name, right1, right2) {
      k.txt(name, M - 2, 66, '400 86px ' + TTY);
      k.fit(String(right1 || '').toUpperCase(), W - M, 34, '600', 22, 210, MONO, 'right');
      k.fit(String(right2 || '').toUpperCase(), W - M, 60, '500', 17, 210, MONO, 'right');
      k.box(M, 84, W - 2 * M, 5); k.box(M, 93, W - 2 * M, 1); return 93;
    };
    /* foot */
    k.foot = function (y, link, l1, l2) {
      y += 18; var fx = M;
      if (window.qrcode && link) { var q = window.qrcode(0, 'M'); q.addData(link); q.make(); var qn = q.getModuleCount(), s = 4; g.fillStyle = '#000';
        for (var r = 0; r < qn; r++) for (var c = 0; c < qn; c++) if (q.isDark(r, c)) g.fillRect(M + c * s, y + r * s, s, s); fx = M + qn * s + 18; }
      k.txt(l1 || 'PLAY ON CARD', fx, y + 26, '600 20px ' + MONO);
      k.txt('novel.global', fx, y + 64, '700 30px ' + SANS);
      if (l2) k.fit(l2, fx, y + 96, '500', 15, W - M - fx, MONO);
      y += 132; k.box(M, y, W - 2 * M, 1); y += 4; k.box(M, y, W - 2 * M, 5); return y + 14;
    };
    return k;
  }
  /* one bit */
  function oneBit(cv, h) {
    var g = cv.getContext('2d', { willReadFrequently: true }), im = g.getImageData(0, 0, W, h), p = im.data;
    for (var k = 0; k < p.length; k += 4) { var on = p[k] * 0.3 + p[k + 1] * 0.59 + p[k + 2] * 0.11 < 140 ? 0 : 255; p[k] = p[k + 1] = p[k + 2] = on; p[k + 3] = 255; }
    cv.height = h; g.putImageData(im, 0, 0); return cv;
  }

  /* ───────── weather ───────── */
  var sky = function (n) { return n === 0 ? 'CLEAR' : n <= 2 ? 'SOME CLOUD' : n === 3 ? 'CLOUD' : n <= 48 ? 'FOG' : n <= 57 ? 'DRIZZLE' : n <= 67 ? 'RAIN' : n <= 77 ? 'SNOW' : n <= 82 ? 'SHOWERS' : n <= 86 ? 'SNOW' : 'STORM'; };
  var pt = function (d) { return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][R((+d || 0) / 45) % 8]; };
  var hr = function (h) { h = R(h) % 24; return (h % 12 || 12) + (h < 12 ? 'AM' : 'PM'); };
  function flags(D, i) {
    var f = [], rp = D.precipitation_probability_max[i], rs = D.precipitation_sum[i], c = D.weather_code[i], hi = D.temperature_2m_max[i], lo = D.temperature_2m_min[i], uv = D.uv_index_max[i], gu = (D.wind_gusts_10m_max || [])[i] || 0, wn = D.wind_speed_10m_max[i];
    if (c >= 95) f.push('STORM'); else if (rs >= 10) f.push('HEAVY RAIN'); else if (rp >= 60) f.push('RAIN LIKELY');
    if (hi >= 35) f.push('VERY HOT'); else if (hi >= 30) f.push('HOT'); else if (lo <= 2) f.push('FROST');
    if (gu >= 60 || wn >= 40) f.push('WINDY');
    if (uv >= 8) f.push('UV ' + R(uv));
    return f.slice(0, 2);
  }
  function highs(v) {
    var out = []; for (var i = 1; i < v.length - 1; i++) if (v[i] > v[i - 1] && v[i] >= v[i + 1]) { var a = v[i - 1], b = v[i], c = v[i + 1], q = a - 2 * b + c, dx = q ? (a - c) / (2 * q) : 0; if (i + dx < 24) out.push(i + dx); }
    return out.slice(0, 2);
  }
  var week = {
    feed: function (s) { var w = s.where || [-37.77, 144.96], sea = s.sea; return '/wx?at=' + w[0] + ',' + w[1] + (sea ? '&sea=' + sea[0] + ',' + sea[1] : ''); },
    draw: function (k, d, s) {
      var g = k.g, D = d.daily, TD = d.tide || null, n = Math.min(7, D.time.length), BH = 168, tlo = TD ? Math.min.apply(null, TD) : 0, thi = TD ? Math.max.apply(null, TD) : 1;
      var tide = function (x, y, w, h, v) {
        var Y = function (q) { return y + h - 2 - (q - tlo) / ((thi - tlo) || 1) * (h - 6); }, X = function (i) { return x + i / (v.length - 1) * w; };
        g.fillStyle = '#000';
        for (var i = 0; i < v.length - 1; i++) for (var px = Math.floor(X(i)); px < X(i + 1); px++) { var t = (px - X(i)) / (X(i + 1) - X(i)), yy = R(Y(v[i] + (v[i + 1] - v[i]) * t)); for (var py = yy + 3; py < y + h; py++) if ((px + py) % 2 === 0) g.fillRect(px, py, 1, 1); }
        g.lineWidth = 2; g.strokeStyle = '#000'; g.beginPath(); v.forEach(function (q, i) { if (i) g.lineTo(X(i), Y(q)); else g.moveTo(X(i), Y(q)); }); g.stroke();
        for (i = 6; i < 24; i += 6) k.box(R(X(i)) - 1, y + h, 2, 5);
      };
      k.head('WEATHER', s.place, phase(age(D.time[0])));
      var y = 123; k.txt('THE WEEK AHEAD', M, y, '600 18px ' + MONO); k.txt('°C · KM/H · MM', W - M, y, '500 16px ' + MONO, 'right');
      y = 130;
      for (var i = 0; i < n; i++) {
        var y0 = y, a = ymd(D.time[i]), name = DAY[new Date(a[0], a[1] - 1, a[2]).getDay()];
        k.box(M, y0, W - 2 * M, 3);
        k.txt(i ? name : 'TODAY', M, y0 + 40, '700 32px ' + SANS);
        var xr = W - M; flags(D, i).forEach(function (f) { xr -= k.chip(f, xr, y0 + 34) + 6; });
        var hw = k.fit(R(D.temperature_2m_max[i]) + '°', M - 2, y0 + 146, '700', 78, 150, SANS), lx = M + hw + 6;
        k.txt('HIGH', M, y0 + 66, '600 15px ' + MONO); k.txt('LOW', lx, y0 + 66, '600 15px ' + MONO);
        k.fit(R(D.temperature_2m_min[i]) + '°', lx, y0 + 146, '600', 42, 226 - lx, SANS);
        var bx = 232, bw = 140;
        k.fit(sky(D.weather_code[i]), bx, y0 + 82, '700', 26, bw, SANS);
        k.fit('RAIN ' + D.precipitation_probability_max[i] + '%' + (D.precipitation_sum[i] >= 0.5 ? ' ' + Math.max(1, R(D.precipitation_sum[i])) + 'MM' : ''), bx, y0 + 110, '600', 20, bw, MONO);
        k.fit('WIND ' + pt(D.wind_direction_10m_dominant[i]) + ' ' + R(D.wind_speed_10m_max[i]), bx, y0 + 134, '500', 20, bw, MONO);
        k.fit('UV ' + R(D.uv_index_max[i] || 0), bx, y0 + 158, '500', 20, bw, MONO);
        var cx = 384; k.moon(W - M - 26, y0 + 76, 24, age(D.time[i]));
        if (TD && TD.length >= (i + 1) * 24) { var v = TD.slice(i * 24, i * 24 + 25), hs = highs(v);
          k.txt('TIDE', cx, y0 + 66, '600 15px ' + MONO); tide(cx, y0 + 104, W - M - cx, 34, v);
          if (hs.length) k.fit('HIGH ' + hs.map(hr).join(' '), cx, y0 + 160, '500', 16, W - M - cx, MONO); }
        y += BH;
      }
      k.box(M, y, W - 2 * M, 3);
      return k.foot(y, 'https://novel.global/x#' + s.id, 'PLAY ON CARD', 'DATA OPEN-METEO.COM');
    }
  };

  /* ───────── news ───────── */
  var news = {
    feed: function () { return '/news'; },
    opts: [['otd', 'ON THIS DAY', true]],
    draw: function (k, d, s, o) {
      var y = k.head('NEWS', 'IN THE NEWS', phase(age(d.day || today()))) + 8;
      (d.news || []).slice(0, 5).forEach(function (t, i) {
        k.box(M, y, W - 2 * M, i ? 1 : 3); y += 10;
        k.txt(('0' + (i + 1)).slice(-2), M, y + 34, '700 34px ' + SANS);
        y += Math.max(44, k.wrap(t, M + 62, y + 26, '600 22px ' + SANS, W - 2 * M - 62, 29)) + 10;
      });
      if (o.otd && (d.otd || []).length) {
        k.box(M, y, W - 2 * M, 3); y += 34; k.txt('ON THIS DAY', M, y, '600 18px ' + MONO); y += 12;
        d.otd.slice(0, 3).forEach(function (e) { k.box(M, y, W - 2 * M, 1); y += 10;
          k.txt(String(e.y), M, y + 22, '700 22px ' + MONO);
          y += Math.max(30, k.wrap(e.t, M + 80, y + 22, '500 19px ' + SANS, W - 2 * M - 80, 25)) + 10; });
      }
      k.box(M, y, W - 2 * M, 3);
      return k.foot(y, 'https://novel.global/x#' + s.id, 'PLAY ON CARD', 'WIKIPEDIA · CC BY-SA 4.0');
    }
  };

  /* ───────── book: one page a day ───────── */
  var bookPage = function (s) { return dayNo(today()) - dayNo(s.from || '2026-11-12') + 1; };
  var book = {
    feed: function (s, o) { return '/book?p=' + Math.max(1, (o.p || bookPage(s))); },
    opts: [['prev', '‹ PAGE'], ['next', 'PAGE ›'], ['today', 'TODAY']],
    act: function (a, s, o) { var p = o.p || bookPage(s); o.p = a === 'today' ? 0 : Math.max(1, p + (a === 'next' ? 1 : -1)); return true; },
    draw: function (k, d, s) {
      k.head('BOOK', 'PAGE ' + d.p + ' / ' + d.of, phase(age(today())));
      var y = 128; k.fit(String(d.title || '').toUpperCase(), M, y, '700', 28, W - 2 * M, SANS);
      k.txt(String(d.author || '').toUpperCase(), M, y + 26, '500 17px ' + MONO); y += 44; k.box(M, y, W - 2 * M, 3); y += 34;
      String(d.text || '').split(/\n\n+/).forEach(function (par) { y += k.wrap(par, M, y, '400 22px ' + SANS, W - 2 * M, 31) + 12; });
      y += 4; k.box(M, y, W - 2 * M, 3);
      return k.foot(y, 'https://novel.global/x#' + s.id, 'ONE PAGE A DAY', 'PROJECT GUTENBERG · PUBLIC DOMAIN');
    }
  };

  /* ───────── tarot: the major cards ───────── */
  var MAJOR = [['0', 'THE FOOL', 'BEGINNINGS · LEAP · TRUST'], ['I', 'THE MAGICIAN', 'WILL · SKILL · FOCUS'], ['II', 'THE HIGH PRIESTESS', 'INTUITION · QUIET · INNER VOICE'], ['III', 'THE EMPRESS', 'GROWTH · CARE · PLENTY'],
    ['IV', 'THE EMPEROR', 'STRUCTURE · ORDER · STEADINESS'], ['V', 'THE HIEROPHANT', 'TRADITION · TEACHING · BELONGING'], ['VI', 'THE LOVERS', 'CHOICE · UNION · VALUES'], ['VII', 'THE CHARIOT', 'DRIVE · DIRECTION · RESOLVE'],
    ['VIII', 'STRENGTH', 'COURAGE · PATIENCE · GENTLENESS'], ['IX', 'THE HERMIT', 'SOLITUDE · SEARCH · INNER LIGHT'], ['X', 'WHEEL OF FORTUNE', 'CYCLES · CHANGE · CHANCE'], ['XI', 'JUSTICE', 'FAIRNESS · TRUTH · BALANCE'],
    ['XII', 'THE HANGED MAN', 'PAUSE · SURRENDER · NEW VIEW'], ['XIII', 'DEATH', 'ENDINGS · RELEASE · RENEWAL'], ['XIV', 'TEMPERANCE', 'BALANCE · MIXING · MODERATION'], ['XV', 'THE DEVIL', 'HABITS · TIES · DESIRE'],
    ['XVI', 'THE TOWER', 'UPHEAVAL · SUDDEN TRUTH · CLEARING'], ['XVII', 'THE STAR', 'HOPE · HEALING · CALM'], ['XVIII', 'THE MOON', 'DREAMS · THE UNKNOWN · INSTINCT'], ['XIX', 'THE SUN', 'JOY · CLARITY · WARMTH'],
    ['XX', 'JUDGEMENT', 'CALLING · RECKONING · REBIRTH'], ['XXI', 'THE WORLD', 'COMPLETION · WHOLENESS · ARRIVAL']];
  var tarot = {
    opts: [['again', 'DRAW AGAIN'], ['today', 'TODAY']],
    act: function (a, s, o) { if (a === 'today') o.i = null; else { var i; do { i = Math.floor(Math.random() * 22); } while (i === o.i); o.i = i; } return true; },
    draw: function (k, d, s, o) {
      var day = today(), i = o.i == null ? seed(day + s.id, 22) : o.i, c = MAJOR[i];
      k.head('TAROT', o.i == null ? 'CARD OF THE DAY' : 'DRAWN', phase(age(day)));
      var x = 56, y = 124, w = W - 112, h = 560;
      k.box(x, y, w, h); k.g.fillStyle = '#fff'; k.g.fillRect(x + 5, y + 5, w - 10, h - 10); k.box(x + 14, y + 14, w - 28, h - 28); k.g.fillStyle = '#fff'; k.g.fillRect(x + 16, y + 16, w - 32, h - 32);
      k.fit(c[0], W / 2, y + 270, '700', 190, w - 70, SANS, 'center');
      k.box(x + 40, y + 340, w - 80, 2);
      k.fit(c[1], W / 2, y + 400, '700', 36, w - 60, SANS, 'center');
      k.fit(c[2], W / 2, y + 450, '600', 19, w - 60, MONO, 'center');
      k.txt('MAJOR ' + (i + 1) + ' / 22', W / 2, y + h - 36, '500 16px ' + MONO, 'center');
      y += h + 20; k.box(M, y, W - 2 * M, 3);
      return k.foot(y, 'https://novel.global/x#' + s.id, 'PLAY ON CARD', 'A CARD A DAY');
    }
  };

  /* ───────── playing cards ───────── */
  var RANK = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'], SUIT = ['SPADES', 'HEARTS', 'DIAMONDS', 'CLUBS'];
  function suit(g, kind, cx, cy, s) {
    g.save(); g.translate(cx, cy); g.scale(s, s); g.beginPath();
    if (kind === 1 || kind === 0) { var f = kind === 0 ? -1 : 1; g.scale(1, f); g.moveTo(0, 0.9); g.bezierCurveTo(-0.2, 0.6, -1, 0.15, -1, -0.35); g.bezierCurveTo(-1, -0.9, -0.25, -1.05, 0, -0.55); g.bezierCurveTo(0.25, -1.05, 1, -0.9, 1, -0.35); g.bezierCurveTo(1, 0.15, 0.2, 0.6, 0, 0.9); g.scale(1, f); }
    if (kind === 2) { g.moveTo(0, -1); g.lineTo(0.72, 0); g.lineTo(0, 1); g.lineTo(-0.72, 0); g.closePath(); }
    if (kind === 3) { g.arc(0, -0.5, 0.42, 0, 7); g.moveTo(-0.45 + 0.42, 0.12); g.arc(-0.45, 0.12, 0.42, 0, 7); g.moveTo(0.45 + 0.42, 0.12); g.arc(0.45, 0.12, 0.42, 0, 7); }
    if (kind === 0 || kind === 3) { g.moveTo(-0.12, 0.2); g.lineTo(-0.35, 1); g.lineTo(0.35, 1); g.lineTo(0.12, 0.2); }
    g.restore();
    if (kind === 1 || kind === 2) { g.lineWidth = 3; g.strokeStyle = '#000'; g.stroke(); } else { g.fillStyle = '#000'; g.fill(); }
  }
  function playCard(k, c, x, y, w, h) {
    var g = k.g, r = RANK[c % 13], st = Math.floor(c / 13);
    k.box(x, y, w, h); g.fillStyle = '#fff'; g.fillRect(x + 3, y + 3, w - 6, h - 6);
    var px = R(w * 0.2); k.txt(r, x + 10, y + 10 + px, '700 ' + px + 'px ' + SANS); suit(g, st, x + 10 + px * 0.32, y + 30 + px * 1.25, px * 0.3);
    g.save(); g.translate(x + w, y + h); g.rotate(Math.PI); k.txt(r, 10, 10 + px, '700 ' + px + 'px ' + SANS); suit(g, st, 10 + px * 0.32, 30 + px * 1.25, px * 0.3); g.restore();
    suit(g, st, x + w / 2, y + h / 2, w * 0.2);
  }
  var cards = {
    opts: [['one', 'ONE'], ['five', 'FIVE'], ['again', 'DEAL AGAIN']],
    act: function (a, s, o) { if (a === 'one') { o.n = 1; o.deal = null; } else if (a === 'five') { o.n = 5; o.deal = null; } else { var l = [], d = []; for (var i = 0; i < 52; i++) l.push(i); for (i = 0; i < (o.n || 1); i++) d.push(l.splice(Math.floor(Math.random() * l.length), 1)[0]); o.deal = d; } return true; },
    draw: function (k, d, s, o) {
      var day = today(), n = o.n || 1, hand = o.deal || (function () { var l = [], h = []; for (var i = 0; i < 52; i++) l.push(i); for (i = 0; i < n; i++) h.push(l.splice(seed(day + s.id + i, l.length), 1)[0]); return h; })();
      k.head('CARDS', o.deal ? 'DEALT' : n > 1 ? 'HAND OF THE DAY' : 'CARD OF THE DAY', phase(age(day)));
      var y = 124;
      if (n === 1) { playCard(k, hand[0], 96, y, 320, 448); y += 448 + 16; k.fit(RANK[hand[0] % 13].replace('A', 'ACE').replace('J', 'JACK').replace('Q', 'QUEEN').replace('K', 'KING') + ' OF ' + SUIT[Math.floor(hand[0] / 13)], W / 2, y + 30, '700', 28, W - 2 * M, SANS, 'center'); y += 50; }
      else { hand.forEach(function (c, i) { var row = i < 3 ? 0 : 1, col = row ? i - 3 : i, cw = 150, ch = 210, x0 = row ? (W - 2 * cw - 16) / 2 : (W - 3 * cw - 32) / 2; playCard(k, c, R(x0 + col * (cw + 16)), y + row * (ch + 16), cw, ch); }); y += 2 * 226 + 4; }
      k.box(M, y, W - 2 * M, 3);
      return k.foot(y, 'https://novel.global/x#' + s.id, 'PLAY ON CARD', n > 1 ? 'FIVE CARDS · ANY GAME' : 'A CARD A DAY');
    }
  };

  var KINDS = { week: week, news: news, book: book, tarot: tarot, cards: cards };
  function draw(cv, kind, data, stack, o) {
    var K = KINDS[kind]; cv.width = W; cv.height = 4200; var k = kit(cv); k.g.fillStyle = '#fff'; k.g.fillRect(0, 0, W, cv.height);
    return oneBit(cv, Math.min(cv.height, K.draw(k, data || {}, stack, o || {})));
  }
  window.CARTS = { draw: draw, kinds: KINDS, today: today, seed: seed, major: MAJOR, bookPage: bookPage };

  /* page */
  if (!T) return;
  var CROCK = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  var code = function () { var s = 'DA-', r = new Uint8Array(4); crypto.getRandomValues(r); for (var i = 0; i < 4; i++) s += CROCK[r[i] % 32]; return s; };
  var api = function (p, o) { return fetch('/api' + p, Object.assign({ headers: { 'content-type': 'application/json' } }, o || {})).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || r.status); return j; }); }); };
  var word = function (p) { return String(p.name || p.id).trim().split(/\s+/)[0].toUpperCase(); };
  var S = { stack: null, K: null, data: null, o: {}, to: null, prns: [], ready: false }, cv = null, IN = /[?&]in=1/.test(location.search);
  var FONTS = ['400 40px VT323', '700 40px Poppins', '600 40px Poppins', '400 40px Poppins', '600 20px "IBM Plex Mono"', '500 20px "IBM Plex Mono"'];

  function keys() { var go = $('#go'); if (go) go.disabled = !S.ready || !S.to; [].forEach.call(document.querySelectorAll('#to button'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.p === S.to)); });
    [].forEach.call(document.querySelectorAll('#opts button[data-t]'), function (b) { b.setAttribute('aria-pressed', String(!!S.o[b.dataset.t])); }); }
  function paint() { draw(cv, S.stack.kind, S.data, S.stack, S.o); $('#paper').classList.add('has'); S.ready = true; $('#st').textContent = ''; keys(); }
  function load() {
    var st = $('#st'); S.ready = false; keys(); st.textContent = '· · ·';
    var got = S.K.feed ? api(S.K.feed(S.stack, S.o)) : Promise.resolve({});
    var fonts = document.fonts && document.fonts.load ? Promise.all(FONTS.map(function (f) { return document.fonts.load(f); })) : Promise.resolve();
    Promise.all([got, fonts.catch(function () {})]).then(function (r) { S.data = r[0]; paint(); }, function () { st.textContent = 'NOT REACHED · TRY AGAIN SOON'; });
  }
  function printers() {
    return api('/partners').then(function (j) {
      var l = j.partners || [], to = ((S.stack.blocks || []).filter(function (b) { return b.k === 'print'; })[0] || {}).to || ['novelglobal'];
      S.prns = l.filter(function (p) { return to.indexOf(p.id) >= 0 || (to.indexOf('island') >= 0 && p.id === S.stack.island); }).filter(function (p) { return p.paired || p.id === 'novelglobal'; });
      S.to = S.prns.length ? S.prns[0].id : null; $('#led').classList.toggle('on', S.prns.some(function (p) { return p.ready; }));
      $('#to').innerHTML = S.prns.length > 1 ? S.prns.map(function (p) { return '<button type="button" data-p="' + p.id + '"><i class="led' + (p.ready ? ' on' : '') + '"></i>' + word(p) + '</button>'; }).join('') : '';
      keys();
    }).catch(function () { S.prns = []; S.to = null; keys(); });
  }
  function print() {
    var go = $('#go'), st = $('#st'); if (!S.ready || !S.to) return; go.disabled = true;
    var w = S.stack.where || [0, 0], c = code(), body = { type: 'stack', stack: S.stack.id, lat: w[0], lng: w[1] };
    st.textContent = '· · ·';
    api('/stories', { method: 'POST', body: JSON.stringify({ kind: 'record', code: c, body: JSON.stringify(body), lat: w[0], lng: w[1], dest: S.to, escpos: T.raster(cv, 0), from: S.stack.id, stage: 'stack' }) })
      .then(function () { st.textContent = 'SENT · ' + c; }, function (e) { st.textContent = /429|too many/i.test(e.message) ? 'TRY AGAIN SOON' : 'NOT SENT'; }).then(function () { go.disabled = false; keys(); });
  }
  function opts() {
    var el = $('#opts'), l = S.K.opts || []; S.o = {}; l.forEach(function (x) { if (x[2] !== undefined) S.o[x[0]] = x[2]; });
    el.innerHTML = l.map(function (x) { return '<button type="button" data-a="' + x[0] + '"' + (x[2] !== undefined ? ' data-t="' + x[0] + '"' : '') + '>' + x[1] + '</button>'; }).join('');
    el.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; var a = b.dataset.a;
      if (b.dataset.t) { S.o[a] = !S.o[a]; paint(); return; }
      if (S.K.act && S.K.act(a, S.stack, S.o)) { if (S.K.feed && a !== 'again' && a !== 'one' && a !== 'five') load(); else paint(); } });
  }
  document.addEventListener('DOMContentLoaded', function () {
    if (!$('#cart')) return; if (IN) document.documentElement.className = 'in';
    cv = $('#paper canvas');
    var id = (location.hash.slice(1) || new URLSearchParams(location.search).get('c') || 'weather').replace(/[^a-z0-9-]/g, '');
    fetch('stacks/' + id + '.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (s) {
      if (!KINDS[s.kind]) throw new Error('kind'); S.stack = s; S.K = KINDS[s.kind]; $('#nm').textContent = s.name || id;
      opts(); load(); printers();
      $('#to').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { S.to = b.dataset.p; keys(); } });
      $('#go').addEventListener('click', print);
    }).catch(function () { $('#nm').textContent = '—'; $('#st').textContent = ''; });
  });
})();

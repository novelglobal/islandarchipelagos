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
      k.txt((l1 || 'PLAY ON CARD') + (k.code ? ' · ' + k.code : ''), fx, y + 26, '600 20px ' + MONO);
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
      var y = k.head('NEWS', 'WIKIPEDIA', phase(age(d.day || today()))) + 8;
      (d.news || []).slice(0, 5).concat((d.more || []).slice(0, 5)).forEach(function (t, i) {
        k.box(M, y, W - 2 * M, i ? 1 : 3); y += 10;
        k.txt(('0' + (i + 1)).slice(-2), M, y + 34, '700 34px ' + SANS);
        y += Math.max(44, k.wrap(t, M + 62, y + 26, '600 22px ' + SANS, W - 2 * M - 62, 29)) + 10;
      });
      if (o.otd && (d.otd || []).length) {
        k.box(M, y, W - 2 * M, 3); y += 4; k.box(M, y, W - 2 * M, 1); y += 8;
        d.otd.slice(0, 3).forEach(function (e) { k.box(M, y, W - 2 * M, 1); y += 10;
          k.txt(String(e.y), M, y + 22, '700 22px ' + MONO);
          y += Math.max(30, k.wrap(e.t, M + 80, y + 22, '500 19px ' + SANS, W - 2 * M - 80, 25)) + 10; });
      }
      k.box(M, y, W - 2 * M, 3);
      return k.foot(y, 'https://novel.global/x#' + s.id, 'PLAY ON CARD', 'WIKIPEDIA · CC BY-SA 4.0');
    }
  };

  /* ───────── book: one page a day ───────── */
  var book = {
    feed: function (s, o) { return '/book?b=' + (o.b || 1) + '&p=' + (o.p || 1); },
    opts: [['bprev', '‹ BOOK'], ['bnext', 'BOOK ›'], ['prev', '‹ PAGE'], ['next', 'PAGE ›']],
    act: function (a, s, o) {
      var b = o.b || 1, p = o.p || 1;
      if (a === 'bprev' || a === 'bnext') { o.b = ((b - 1 + (a === 'bnext' ? 1 : 19)) % 20) + 1; o.p = 1; }
      else o.p = Math.max(1, p + (a === 'next' ? 1 : -1));
      return true;
    },
    draw: function (k, d, s) {
      k.head('BOOK', d.b + ' / ' + d.books, 'PAGE ' + d.p + ' / ' + d.of);
      var y = 128; k.fit(String(d.title || '').toUpperCase(), M, y, '700', 28, W - 2 * M, SANS);
      k.txt((String(d.author || '') + ' · ' + d.year).toUpperCase(), M, y + 26, '500 17px ' + MONO); y += 44; k.box(M, y, W - 2 * M, 3); y += 34;
      if (d.review) { y += k.wrap(d.review, M, y, 'italic 400 22px ' + SANS, W - 2 * M, 30) + 8; k.box(M, y, W - 2 * M, 1); y += 34; }
      String(d.text || '').split(/\n\n+/).forEach(function (par) { y += k.wrap(par, M, y, '400 21px ' + SANS, W - 2 * M, 29) + 10; });
      y += 4; k.box(M, y, W - 2 * M, 3);
      return k.foot(y, 'https://novel.global/x#' + s.id, 'PLAY ON CARD', 'PROJECT GUTENBERG · PUBLIC DOMAIN');
    }
  };

  /* ───────── tarot: the major cards ───────── */
  var MAJOR = [['0', 'THE FOOL', 'BEGINNINGS · LEAP · TRUST'], ['I', 'THE MAGICIAN', 'WILL · SKILL · FOCUS'], ['II', 'THE HIGH PRIESTESS', 'INTUITION · QUIET · INNER VOICE'], ['III', 'THE EMPRESS', 'GROWTH · CARE · PLENTY'],
    ['IV', 'THE EMPEROR', 'STRUCTURE · ORDER · STEADINESS'], ['V', 'THE HIEROPHANT', 'TRADITION · TEACHING · BELONGING'], ['VI', 'THE LOVERS', 'CHOICE · UNION · VALUES'], ['VII', 'THE CHARIOT', 'DRIVE · DIRECTION · RESOLVE'],
    ['VIII', 'STRENGTH', 'COURAGE · PATIENCE · GENTLENESS'], ['IX', 'THE HERMIT', 'SOLITUDE · SEARCH · INNER LIGHT'], ['X', 'WHEEL OF FORTUNE', 'CYCLES · CHANGE · CHANCE'], ['XI', 'JUSTICE', 'FAIRNESS · TRUTH · BALANCE'],
    ['XII', 'THE HANGED MAN', 'PAUSE · SURRENDER · NEW VIEW'], ['XIII', 'DEATH', 'ENDINGS · RELEASE · RENEWAL'], ['XIV', 'TEMPERANCE', 'BALANCE · MIXING · MODERATION'], ['XV', 'THE DEVIL', 'HABITS · TIES · DESIRE'],
    ['XVI', 'THE TOWER', 'UPHEAVAL · SUDDEN TRUTH · CLEARING'], ['XVII', 'THE STAR', 'HOPE · HEALING · CALM'], ['XVIII', 'THE MOON', 'DREAMS · THE UNKNOWN · INSTINCT'], ['XIX', 'THE SUN', 'JOY · CLARITY · WARMTH'],
    ['XX', 'JUDGEMENT', 'CALLING · RECKONING · REBIRTH'], ['XXI', 'THE WORLD', 'COMPLETION · WHOLENESS · ARRIVAL']];
  var TSUIT = ['WANDS', 'CUPS', 'SWORDS', 'PENTACLES'], TRANK = ['ACE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'PAGE', 'KNIGHT', 'QUEEN', 'KING'];
  var TPAGE = [[0, 20], [20, 40], [40, 59], [59, 78]];
  function tsuit(g, st, cx, cy, r) { g.fillStyle = '#000'; g.strokeStyle = '#000'; g.lineWidth = Math.max(2, r * 0.12); g.beginPath();
    if (st === 0) { g.fillRect(cx - r * 0.1, cy - r, r * 0.2, r * 2); g.ellipse(cx + r * 0.32, cy - r * 0.35, r * 0.28, r * 0.12, -0.6, 0, 7); g.fill(); }
    if (st === 1) { g.moveTo(cx - r * 0.7, cy - r * 0.8); g.lineTo(cx + r * 0.7, cy - r * 0.8); g.quadraticCurveTo(cx + r * 0.7, cy + r * 0.15, cx, cy + r * 0.15); g.quadraticCurveTo(cx - r * 0.7, cy + r * 0.15, cx - r * 0.7, cy - r * 0.8); g.fill(); g.fillRect(cx - r * 0.08, cy + r * 0.1, r * 0.16, r * 0.6); g.fillRect(cx - r * 0.45, cy + r * 0.7, r * 0.9, r * 0.16); }
    if (st === 2) { g.fillRect(cx - r * 0.08, cy - r, r * 0.16, r * 1.5); g.fillRect(cx - r * 0.5, cy + r * 0.45, r, r * 0.14); g.fillRect(cx - r * 0.1, cy + r * 0.55, r * 0.2, r * 0.35); g.arc(cx, cy + r * 0.95, r * 0.14, 0, 7); g.fill(); }
    if (st === 3) { g.arc(cx, cy, r * 0.85, 0, 7); g.stroke(); g.beginPath(); for (var i = 0; i <= 5; i++) { var a = -Math.PI / 2 + i * 4 * Math.PI / 5; if (i) g.lineTo(cx + Math.cos(a) * r * 0.75, cy + Math.sin(a) * r * 0.75); else g.moveTo(cx + Math.cos(a) * r * 0.75, cy + Math.sin(a) * r * 0.75); } g.stroke(); }
  }
  function tarotCard(k, n, x, y, w, h) {
    var g = k.g, mj = n < 22, st = mj ? -1 : Math.floor((n - 22) / 14), rk = mj ? 0 : (n - 22) % 14;
    k.box(x, y, w, h); g.fillStyle = '#fff'; g.fillRect(x + 3, y + 3, w - 6, h - 6); k.box(x + 7, y + 7, w - 14, h - 14); g.fillStyle = '#fff'; g.fillRect(x + 8, y + 8, w - 16, h - 16);
    k.fit(mj ? MAJOR[n][0] : (rk < 10 ? String(rk + 1).replace(/^1$/, 'A') : (rk === 11 ? 'KN' : TRANK[rk].slice(0, 1))), x + w / 2, y + 30, '700', 18, w - 24, SANS, 'center');
    var pw = w - 28, ph = h * 0.6, own = panel(k, 't' + n, mj ? ['maze', 'crack', 'spots', 'lines', 'worms', 'eyes'][n % 6] : ['lines', 'spots', 'crack', 'eyes'][st], x + 14, y + 40, pw, ph, n + 5);
    if (!own) { disc(g, x + w / 2, y + 40 + ph / 2, Math.min(pw, ph) * 0.24); if (mj) k.fit(MAJOR[n][0] === '0' ? '0' : MAJOR[n][0], x + w / 2, y + 40 + ph / 2 + 9, '700', 26, Math.min(pw, ph) * 0.4, SANS, 'center'); else tsuit(g, st, x + w / 2, y + 40 + ph / 2, Math.min(pw, ph) * 0.14); }
    k.fit(mj ? MAJOR[n][1] : TRANK[rk] + ' OF ' + TSUIT[st], x + w / 2, y + h - 18, '600', 13, w - 30, SANS, 'center');
  }
  var tarot = {
    opts: [['again', 'AGAIN'], ['today', 'TODAY'], ['deck', 'DECK'], ['art', 'ART', false]],
    pages: 4,
    act: function (a, s, o) { if (a === 'deck') { o.page = o.deck ? (o.page + 1) % 4 : 0; o.deck = true; return true; } o.deck = false; if (a === 'today') o.i = null; else { var i; do { i = Math.floor(Math.random() * 22); } while (i === o.i); o.i = i; } return true; },
    draw: function (k, d, s, o) {
      if (o.deck) { var pg = o.page || 0, r0 = TPAGE[pg], y0 = k.head('TAROT', 'DECK', (pg + 1) + '/4') + 14, cw = 156, ch = 252;
        for (var n = r0[0]; n < r0[1]; n++) { var j = n - r0[0]; tarotCard(k, n, 12 + (j % 3) * (cw + 10), y0 + Math.floor(j / 3) * (ch + 10), cw, ch); }
        y0 += Math.ceil((r0[1] - r0[0]) / 3) * (ch + 10) + 4; k.box(M, y0, W - 2 * M, 3); return k.foot(y0, 'https://novel.global/x#' + s.id, 'PLAY ON CARD', ''); }
      var day = today(), i = o.i == null ? seed(day + s.id, 22) : o.i, c = MAJOR[i];
      k.head('TAROT', o.i == null ? '' : 'DRAWN', phase(age(day)));
      var x = 56, y = 124, w = W - 112, h = 560;
      k.box(x, y, w, h); k.g.fillStyle = '#fff'; k.g.fillRect(x + 5, y + 5, w - 10, h - 10); k.box(x + 14, y + 14, w - 28, h - 28); k.g.fillStyle = '#fff'; k.g.fillRect(x + 16, y + 16, w - 32, h - 32);
      if (!panel(k, 't' + i, ['maze', 'crack', 'spots', 'lines', 'worms', 'eyes'][i % 6], x + 30, y + 30, w - 60, 290, i + 5)) { disc(k.g, W / 2, y + 175, 112); k.fit(c[0], W / 2, y + 218, '700', 120, 190, SANS, 'center'); }
      k.box(x + 40, y + 340, w - 80, 2);
      k.fit(c[1], W / 2, y + 400, '700', 36, w - 60, SANS, 'center');
      k.fit(c[2], W / 2, y + 450, '600', 19, w - 60, MONO, 'center');
      k.txt('MAJOR ' + (i + 1) + ' / 22', W / 2, y + h - 36, '500 16px ' + MONO, 'center');
      y += h + 20; k.box(M, y, W - 2 * M, 3);
      return k.foot(y, 'https://novel.global/x#' + s.id, 'PLAY ON CARD', '');
    }
  };

  /* ───────── card art: the hand-cut textures, or a person's own picture, dithered to dots ───────── */
  var rnd = function (sd) { var s = sd || 1; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; };
  function noise2(seed) { var r = rnd(seed), G = []; for (var i = 0; i < 64 * 64; i++) G.push(r());
    var at = function (x, y) { return G[((y & 63) * 64) + (x & 63)]; }, sm = function (t) { return t * t * (3 - 2 * t); };
    return function (x, y) { var xi = Math.floor(x), yi = Math.floor(y), fx = sm(x - xi), fy = sm(y - yi), a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1); return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy; }; }
  function pattern(g, w, h, kind, fg, bg, seed) { var r = rnd(seed || 3); g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.strokeStyle = fg;
    if (kind === 'maze' || kind === 'crack') { var S = 2, W = Math.ceil(w / S), H = Math.ceil(h / S);
      if (kind === 'maze') { var n1 = noise2(seed), n2 = noise2(seed + 9); for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) { var v = n1(x / 9, y / 9) * 0.7 + n2(x / 4, y / 4) * 0.3, f = (v * 9) % 1; if (f < 0.13) g.fillRect(x * S, y * S, S, S); } return; }
      var P = []; for (var k = 0; k < Math.round(w * h / 420); k++) P.push([r() * w, r() * h]);
      for (var y2 = 0; y2 < H; y2++) for (var x2 = 0; x2 < W; x2++) { var px = x2 * S, py = y2 * S, d1 = 1e9, d2 = 1e9; for (var q = 0; q < P.length; q++) { var dx = P[q][0] - px, dy = P[q][1] - py, d = dx * dx + dy * dy; if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
        if (Math.sqrt(d2) - Math.sqrt(d1) > 2.6) g.fillRect(px, py, S, S); } return; }
    if (kind === 'spots') { for (var i = 0; i < w * h / 90; i++) { g.beginPath(); g.ellipse(r() * w, r() * h, 1.5 + r() * 4, 1.2 + r() * 3.4, r() * 3, 0, 7); g.fill(); } return; }
    if (kind === 'lines') { g.lineWidth = 1.6; for (var yy = 3; yy < h; yy += 5.2) { g.beginPath(); for (var xx = 0; xx <= w; xx += 4) { var yv = yy + Math.sin(xx * 0.03 + yy * 0.2) * 1.4; if (xx) g.lineTo(xx, yv); else g.moveTo(xx, yv); } g.stroke(); } return; }
    if (kind === 'worms') { g.lineCap = 'round'; for (var j = 0; j < w * h / 520; j++) { var x0 = r() * w, y0 = r() * h, a = r() * 6.3, L = 8 + r() * 16; g.lineWidth = 4.6; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + Math.cos(a + 1) * L, y0 + Math.sin(a + 1) * L, x0 + Math.cos(a) * L * 1.6, y0 + Math.sin(a) * L * 1.6); g.stroke(); g.save(); g.strokeStyle = bg; g.lineWidth = 1.6; g.stroke(); g.restore(); } return; }
    if (kind === 'eyes') { for (var e = 0; e < w * h / 700; e++) { var ex = 6 + r() * (w - 12), ey = 5 + r() * (h - 10), s = 3 + r() * 2.2; g.beginPath(); g.moveTo(ex - s, ey); g.quadraticCurveTo(ex, ey - s * 0.9, ex + s, ey); g.quadraticCurveTo(ex, ey + s * 0.9, ex - s, ey); g.fill(); g.save(); g.fillStyle = bg; g.beginPath(); g.arc(ex + (r() - 0.5) * s * 0.6, ey, s * 0.32, 0, 7); g.fill(); g.restore(); } } }
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], ART = {}, ARTK = '', HITS = [];
  function artLoad(id, done) { ARTK = 'da.art.' + id; ART = {}; var m = {}; try { m = JSON.parse(localStorage.getItem(ARTK) || '{}') || {}; } catch (e) { m = {}; }
    Object.keys(m).forEach(function (key) { var im = new Image(); im.onload = function () { ART[key] = im; if (done) done(); }; im.src = m[key]; }); }
  function artSave(key, url) { var m = {}; try { m = JSON.parse(localStorage.getItem(ARTK) || '{}') || {}; } catch (e) { m = {}; } if (url) m[key] = url; else delete m[key];
    try { localStorage.setItem(ARTK, JSON.stringify(m)); return true; } catch (e) { return false; } }
  function panel(k, key, kind, x, y, w, h, sd) {
    var g = k.g; x = R(x); y = R(y); w = R(w); h = R(h); if (k.hits) k.hits.push({ key: key, x: x, y: y, w: w, h: h });
    var im = ART[key];
    if (im) { var c = document.createElement('canvas'); c.width = w; c.height = h; var q = c.getContext('2d', { willReadFrequently: true }), s = Math.max(w / im.width, h / im.height);
      q.fillStyle = '#fff'; q.fillRect(0, 0, w, h); q.drawImage(im, (w - im.width * s) / 2, (h - im.height * s) / 2, im.width * s, im.height * s);
      var p = q.getImageData(0, 0, w, h).data; g.fillStyle = '#fff'; g.fillRect(x, y, w, h); g.fillStyle = '#000';
      for (var yy = 0; yy < h; yy++) for (var xx = 0; xx < w; xx++) { var i = (yy * w + xx) * 4, l = (p[i] * 0.3 + p[i + 1] * 0.59 + p[i + 2] * 0.11) / 255; if (l * 16 < BAYER[(yy % 4) * 4 + (xx % 4)] + 0.5) g.fillRect(x + xx, y + yy, 1, 1); }
      return true; }
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.translate(x, y); pattern(g, w, h, kind, '#000', '#fff', sd || 3); g.restore(); return false;
  }
  function disc(g, cx, cy, r) { g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); g.strokeStyle = '#000'; g.lineWidth = 2; g.stroke(); }

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
    var pw = w * 0.62, ph = h * 0.56, own = panel(k, 'c' + c, ['maze', 'spots', 'crack', 'worms'][st], x + (w - pw) / 2, y + (h - ph) / 2, pw, ph, c + 11);
    if (!own) { disc(g, x + w / 2, y + h / 2, w * 0.2); suit(g, st, x + w / 2, y + h / 2, w * 0.12); }
  }
  var cards = {
    opts: [['one', 'ONE'], ['five', 'FIVE'], ['deck', 'DECK'], ['again', 'AGAIN'], ['art', 'ART', false]],
    pages: 4,
    act: function (a, s, o) { if (a === 'deck') { o.page = o.deck ? (o.page + 1) % 4 : 0; o.deck = true; return true; } o.deck = false;
      if (a === 'one') { o.n = 1; o.deal = null; } else if (a === 'five') { o.n = 5; o.deal = null; } else { var l = [], d = []; for (var i = 0; i < 52; i++) l.push(i); for (i = 0; i < (o.n || 1); i++) d.push(l.splice(Math.floor(Math.random() * l.length), 1)[0]); o.deal = d; } return true; },
    draw: function (k, d, s, o) {
      if (o.deck) { var pg = o.page || 0, y0 = k.head('CARDS', SUIT[pg], (pg + 1) + '/4') + 14, cw = 156, ch = 218;
        for (var c = 0; c < 13; c++) playCard(k, pg * 13 + c, 12 + (c % 3) * (cw + 10), y0 + Math.floor(c / 3) * (ch + 10), cw, ch);
        y0 += 5 * (ch + 10) + 4; k.box(M, y0, W - 2 * M, 3); return k.foot(y0, 'https://novel.global/x#' + s.id, 'PLAY ON CARD', ''); }
      var day = today(), n = o.n || 1, hand = o.deal || (function () { var l = [], h = []; for (var i = 0; i < 52; i++) l.push(i); for (i = 0; i < n; i++) h.push(l.splice(seed(day + s.id + i, l.length), 1)[0]); return h; })();
      k.head('CARDS', o.deal ? 'DEALT' : '', phase(age(day)));
      var y = 124;
      if (n === 1) { playCard(k, hand[0], 96, y, 320, 448); y += 448 + 16; k.fit(RANK[hand[0] % 13].replace('A', 'ACE').replace('J', 'JACK').replace('Q', 'QUEEN').replace('K', 'KING') + ' OF ' + SUIT[Math.floor(hand[0] / 13)], W / 2, y + 30, '700', 28, W - 2 * M, SANS, 'center'); y += 50; }
      else { hand.forEach(function (c, i) { var row = i < 3 ? 0 : 1, col = row ? i - 3 : i, cw = 150, ch = 210, x0 = row ? (W - 2 * cw - 16) / 2 : (W - 3 * cw - 32) / 2; playCard(k, c, R(x0 + col * (cw + 16)), y + row * (ch + 16), cw, ch); }); y += 2 * 226 + 4; }
      k.box(M, y, W - 2 * M, 3);
      return k.foot(y, 'https://novel.global/x#' + s.id, 'PLAY ON CARD', '');
    }
  };

  /* ───────── the pass: today's mark and a one-use code, left by the printer ───────── */
  var EMO = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  function markDots(k, e, cx, cy, s) {
    var c = document.createElement('canvas'); c.width = c.height = s; var g = c.getContext('2d', { willReadFrequently: true });
    g.font = R(s * 0.82) + 'px ' + EMO; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, s / 2, s * 0.54);
    var p = g.getImageData(0, 0, s, s).data, B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]; k.g.fillStyle = '#000';
    for (var y = 0; y < s; y++) for (var x = 0; x < s; x++) { var i = (y * s + x) * 4, a = p[i + 3] / 255; if (a < 0.3) continue;
      var l = (p[i] * 0.3 + p[i + 1] * 0.59 + p[i + 2] * 0.11) / 255; if (l * 15.5 < B[(y % 4) * 4 + (x % 4)] + 2) k.g.fillRect(cx - s / 2 + x, cy - s / 2 + y, 1, 1); }
  };
  var pass = {
    opts: [['p1', 'ONE'], ['p5', 'FIVE']],
    act: function (a, s, o) { o.n = a === 'p5' ? 5 : 1; return true; },
    get: function () { return keeper(JSON.stringify({ action: 'look' })); },
    send: function (head, o) { return keeper(JSON.stringify({ action: 'passes', n: o.n || 1, escpos: head })); },
    draw: function (k, d, s, o) {
      var day = today(), m = d.mark || { e: '·', w: '' };
      var y = k.head('PASS', d.name || 'ISLAND', phase(age(day)));
      markDots(k, m.e, W / 2, y + 150, 240);
      y += 310; k.fit(m.w, W / 2, y, '700', 40, W - 60, SANS, 'center');
      y += 26; k.box(M, y, W - 2 * M, 2);
      if (o.head) return y + 12;
      y += 24; k.dots(M + 40, y, W - 2 * M - 80, 120); k.g.fillStyle = '#fff'; k.g.fillRect(M + 48, y + 8, W - 2 * M - 96, 104);
      k.txt('CODE', W / 2, y + 68, '600 20px ' + MONO, 'center');
      y += 140; k.box(M, y, W - 2 * M, 3); return y + 14;
    }
  };
  function keeper(b) {
    var q = new URLSearchParams(location.search), pr = (q.get('p') || '').replace(/[^\w-]/g, ''), adm = '', key = '';
    try { adm = sessionStorage.getItem('da.admin') || ''; } catch (e) { /* none */ }
    try { key = JSON.parse(localStorage.getItem('da.hm.key') || '""') || ''; } catch (e) { /* none */ }
    var url = adm && pr ? '/api/admin/printers/' + pr : key ? '/api/island' : ''; if (!url) return Promise.reject(new Error('key'));
    return fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + (adm && pr ? adm : key) }, body: b })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || r.status); return j; }); });
  }

  var KINDS = { week: week, news: news, book: book, tarot: tarot, cards: cards, pass: pass };
  function draw(cv, kind, data, stack, o) {
    var K = KINDS[kind]; cv.width = W; cv.height = 4200; var k = kit(cv); k.code = o && o.code; k.hits = HITS = []; k.g.fillStyle = '#fff'; k.g.fillRect(0, 0, W, cv.height);
    return oneBit(cv, Math.min(cv.height, K.draw(k, data || {}, stack, o || {})));
  }
  window.CARTS = { draw: draw, kinds: KINDS, today: today, seed: seed, major: MAJOR };

  /* page */
  if (!T) return;
  var CROCK = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  var code = function () { var s = 'DA-', r = new Uint8Array(4); crypto.getRandomValues(r); for (var i = 0; i < 4; i++) s += CROCK[r[i] % 32]; return s; };
  var api = function (p, o) { return fetch('/api' + p, Object.assign({ headers: { 'content-type': 'application/json' } }, o || {})).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || r.status); return j; }); }); };
  var word = function (p) { return String(p.name || p.id).trim().split(/\s+/)[0].toUpperCase(); };
  var S = { stack: null, K: null, data: null, o: {}, to: null, prns: [], ready: false, code: '' }, cv = null, IN = /[?&]in=1/.test(location.search);
  var FONTS = ['400 40px VT323', '700 40px Poppins', '600 40px Poppins', '400 40px Poppins', '600 20px "IBM Plex Mono"', '500 20px "IBM Plex Mono"'];

  function keys() { var go = $('#go'); if (go) go.disabled = !S.ready || !S.to; [].forEach.call(document.querySelectorAll('#to button'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.p === S.to)); });
    [].forEach.call(document.querySelectorAll('#opts button[data-t]'), function (b) { b.setAttribute('aria-pressed', String(!!S.o[b.dataset.t])); }); }
  function paint() { draw(cv, S.stack.kind, S.data, S.stack, Object.assign({}, S.o, { code: S.code })); $('#paper').classList.add('has'); S.ready = true; var st = $('#st'); st.textContent = S.after || (S.o.art ? 'TAP' : ''); st.title = S.o.art ? 'Tap a card to give it your art' : ''; S.after = ''; cv.style.cursor = S.o.art ? 'copy' : ''; keys(); }
  function artTap(e) { if (!S.o.art) return; var r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * cv.width / r.width, y = (e.clientY - r.top) * cv.height / r.height;
    var h = HITS.filter(function (q) { return x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h; })[0]; if (!h) return;
    if (ART[h.key]) { if (confirm('Take this art off?')) { delete ART[h.key]; artSave(h.key, null); paint(); } return; }
    var fi = document.createElement('input'); fi.type = 'file'; fi.accept = 'image/*';
    fi.addEventListener('change', function () { var f = fi.files && fi.files[0]; if (!f) return; var u = URL.createObjectURL(f), im = new Image();
      im.onload = function () { var k = Math.min(1, 360 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = R(im.width * k); c.height = R(im.height * k); var q = c.getContext('2d'); q.fillStyle = '#fff'; q.fillRect(0, 0, c.width, c.height); q.filter = 'grayscale(1) contrast(1.15)'; q.drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
        var url = c.toDataURL('image/jpeg', 0.72), a = new Image(); a.onload = function () { ART[h.key] = a; if (!artSave(h.key, url)) S.after = 'FULL'; paint(); }; a.src = url; }; im.src = u; }); fi.click(); }
  function load() {
    var st = $('#st'); S.ready = false; keys(); st.textContent = '· · ·';
    var got = S.K.get ? S.K.get(S.stack, S.o) : S.K.feed ? api(S.K.feed(S.stack, S.o)) : Promise.resolve({});
    if (!S.K.get && !S.code) api('/c?for=' + S.stack.id).then(function (j) { S.code = j.code || ''; if (S.ready) paint(); }, function () {});
    var fonts = document.fonts && document.fonts.load ? Promise.all(FONTS.map(function (f) { return document.fonts.load(f); })) : Promise.resolve();
    Promise.all([got, fonts.catch(function () {})]).then(function (r) { S.data = r[0]; if (S.K.get) own(r[0]); paint(); }, function (e) { if (S.K.get) { S.data = {}; paint(); S.ready = false; keys(); } st.textContent = S.K.get && /key|401/.test(e.message) ? 'KEEPERS' : 'OFFLINE'; st.title = S.K.get ? 'For island keepers' : ''; });
  }
  function own(d) { S.prns = [{ id: d.island, name: d.name }]; S.to = d.island; $('#to').innerHTML = ''; }
  function printers() { if (S.K.get) return;
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
    st.textContent = '· · ·';
    if (S.K.send) { S.o.head = true; paint(); var hd = T.raster(cv, 0); S.o.head = false; paint();
      return S.K.send(hd, S.o).then(function (j) { st.textContent = 'SENT · ' + j.n + (j.n > 1 ? ' PASSES' : ' PASS'); }, function (e) { st.textContent = /full/.test(e.message) ? 'FULL' : 'UNSENT'; }).then(function () { go.disabled = false; keys(); }); }
    if (S.o.deck && S.K.pages) { var pg0 = S.o.page, n = 0, all = function () { if (n >= S.K.pages) return Promise.resolve(); S.o.page = n++; paint(); return send(T.raster(cv, 0)).then(all); };
      return all().then(function () { S.o.page = pg0; paint(); st.textContent = 'SENT · ' + S.K.pages; }, function (e) { S.o.page = pg0; paint(); st.textContent = /429|too many/i.test(e.message) ? 'WAIT' : 'UNSENT'; }).then(function () { go.disabled = false; keys(); }); }
    send(T.raster(cv, 0)).then(function (c) { st.textContent = c; }, function (e) { st.textContent = /429|too many/i.test(e.message) ? 'WAIT' : 'UNSENT'; }).then(function () { go.disabled = false; keys(); });
  }
  function send(escpos) {
    var w = S.stack.where || [0, 0], c = code(), body = { type: 'stack', stack: S.stack.id, lat: w[0], lng: w[1] }, ps = null;
    try { ps = JSON.parse(localStorage.getItem('da.pass') || 'null'); } catch (e) { ps = null; } if (ps && (ps.island !== S.to || ps.day !== today())) ps = null;
    return api('/stories', { method: 'POST', body: JSON.stringify({ kind: 'record', code: c, body: JSON.stringify(body), lat: w[0], lng: w[1], dest: S.to, escpos: escpos, from: S.stack.id, stage: 'stack', pass: ps ? ps.code : undefined }) })
      .then(function (j) { if (j && j.passed) try { localStorage.removeItem('da.pass'); } catch (e) { /* none */ } return (j && j.passed ? 'PRINTING · ' : 'SENT · ') + c; });
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
      artLoad(s.id, function () { if (S.ready) paint(); }); cv.addEventListener('click', artTap);
      opts(); load(); printers();
      $('#to').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { S.to = b.dataset.p; keys(); } });
      $('#go').addEventListener('click', print);
    }).catch(function () { $('#nm').textContent = '—'; $('#st').textContent = ''; });
  });
})();

/* weather cart */
(function () {
  'use strict';
  var T = window.THERMAL, $ = function (s) { return document.querySelector(s); };
  var DAY = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  var SANS = 'Poppins, "Helvetica Neue", Arial, sans-serif', MONO = '"IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace', TTY = 'VT323, ui-monospace, monospace';
  var sky = function (n) { return n === 0 ? 'CLEAR' : n <= 2 ? 'SOME CLOUD' : n === 3 ? 'CLOUD' : n <= 48 ? 'FOG' : n <= 57 ? 'DRIZZLE' : n <= 67 ? 'RAIN' : n <= 77 ? 'SNOW' : n <= 82 ? 'SHOWERS' : n <= 86 ? 'SNOW' : 'STORM'; };
  var pt = function (d) { return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round((+d || 0) / 45) % 8]; };
  var ymd = function (s) { var a = String(s).split('-').map(Number); return a; };
  var age = function (s) { var a = ymd(s), t = Date.UTC(a[0], a[1] - 1, a[2], 2) / 864e5, n0 = Date.UTC(2000, 0, 6, 18, 14) / 864e5; return (((t - n0) / 29.530588853) % 1 + 1) % 1; };
  var phase = function (a) { return a < 0.03 || a > 0.97 ? 'NEW MOON' : a < 0.22 ? 'WAXING CRESCENT' : a < 0.28 ? 'FIRST QUARTER' : a < 0.47 ? 'WAXING GIBBOUS' : a < 0.53 ? 'FULL MOON' : a < 0.72 ? 'WANING GIBBOUS' : a < 0.78 ? 'LAST QUARTER' : 'WANING CRESCENT'; };
  var hr = function (h) { h = Math.round(h) % 24; return (h % 12 || 12) + (h < 12 ? 'AM' : 'PM'); };
  var R = Math.round;

  /* alerts */
  function flags(D, i) {
    var f = [], rp = D.precipitation_probability_max[i], rs = D.precipitation_sum[i], c = D.weather_code[i], hi = D.temperature_2m_max[i], lo = D.temperature_2m_min[i], uv = D.uv_index_max[i], gu = (D.wind_gusts_10m_max || [])[i] || 0, wn = D.wind_speed_10m_max[i];
    if (c >= 95) f.push('STORM'); else if (rs >= 10) f.push('HEAVY RAIN'); else if (rp >= 60) f.push('RAIN LIKELY');
    if (hi >= 35) f.push('VERY HOT'); else if (hi >= 30) f.push('HOT'); else if (lo <= 2) f.push('FROST');
    if (gu >= 60 || wn >= 40) f.push('WINDY');
    if (uv >= 8) f.push('UV ' + R(uv));
    return f.slice(0, 2);
  }
  /* high tides */
  function highs(v) {
    var out = []; for (var i = 1; i < v.length - 1; i++) if (v[i] > v[i - 1] && v[i] >= v[i + 1]) { var a = v[i - 1], b = v[i], c = v[i + 1], k = a - 2 * b + c, dx = k ? (a - c) / (2 * k) : 0; if (i + dx < 24) out.push(i + dx); }
    return out.slice(0, 2);
  }

  function draw(cv, data, o) {
    o = o || {}; var D = data.daily, TD = data.tide || null, n = Math.min(7, D.time.length), W = cv.width = 512, M = 8, BH = 168;
    var tlo = TD ? Math.min.apply(null, TD) : 0, thi = TD ? Math.max.apply(null, TD) : 1;
    var g = cv.getContext('2d', { willReadFrequently: true });
    cv.height = 130 + n * BH + 170; g.fillStyle = '#fff'; g.fillRect(0, 0, W, cv.height);
    var txt = function (s, x, y, font, al) { g.font = font; g.textAlign = al || 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = '#000'; g.fillText(s, x, y); return g.measureText(s).width; };
    var fit = function (s, x, y, wt, px, max, fam, al) { g.font = wt + ' ' + px + 'px ' + fam; while (px > 12 && g.measureText(s).width > max) { px--; g.font = wt + ' ' + px + 'px ' + fam; } return txt(s, x, y, g.font, al); };
    var box = function (x, y, w, h) { g.fillStyle = '#000'; g.fillRect(x, y, w, h); };
    var chip = function (s, xr, y) { g.font = '600 19px ' + MONO; var w = g.measureText(s).width + 14; box(xr - w, y - 19, w, 26); g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText(s, xr - w + 7, y); return w; };
    var moon = function (cx, cy, r, a) {
      g.fillStyle = '#000'; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, cy, r - 2, 0, 7); g.fill(); g.fillStyle = '#000';
      for (var dy = -r + 2; dy < r - 1; dy++) { var hw = Math.sqrt((r - 2) * (r - 2) - dy * dy); for (var dx = Math.ceil(-hw); dx < hw; dx++) if ((cx + dx + cy + dy) % 2 === 0) g.fillRect(cx + dx, cy + dy, 1, 1); }
      var k = Math.cos(2 * Math.PI * a); g.fillStyle = '#fff';
      for (dy = -r + 1; dy < r; dy++) { var w = Math.sqrt(r * r - dy * dy) - 2.5; if (w <= 0) continue; var x0 = a < 0.5 ? k * w : -w, x1 = a < 0.5 ? w : -k * w, s0 = -x1, s1 = -x0;   // southern sky
        if (s1 - s0 > 0.5) g.fillRect(R(cx + s0), cy + dy, R(s1 - s0), 1); }
    };
    var tide = function (x, y, w, h, v) {
      var Y = function (q) { return y + h - 2 - (q - tlo) / ((thi - tlo) || 1) * (h - 6); }, X = function (i) { return x + i / (v.length - 1) * w; };
      g.fillStyle = '#000';
      for (var i = 0; i < v.length - 1; i++) for (var px = Math.floor(X(i)); px < X(i + 1); px++) { var t = (px - X(i)) / (X(i + 1) - X(i)), yy = R(Y(v[i] + (v[i + 1] - v[i]) * t)); for (var py = yy + 3; py < y + h; py++) if ((px + py) % 2 === 0) g.fillRect(px, py, 1, 1); }
      g.lineWidth = 2; g.strokeStyle = '#000'; g.beginPath(); v.forEach(function (q, i) { if (i) g.lineTo(X(i), Y(q)); else g.moveTo(X(i), Y(q)); }); g.stroke();
      for (i = 6; i < 24; i += 6) box(R(X(i)) - 1, y + h, 2, 5);
    };

    /* head */
    var y = 0;
    txt('WEATHER', M - 2, y + 66, '400 86px ' + TTY);
    fit(String(o.place || '').toUpperCase(), W - M, y + 34, '600', 22, 200, MONO, 'right');
    fit(phase(age(D.time[0])), W - M, y + 60, '500', 17, 200, MONO, 'right');
    y += 84; box(M, y, W - 2 * M, 5); y += 9; box(M, y, W - 2 * M, 1);
    y += 30; txt('THE WEEK AHEAD', M, y, '600 18px ' + MONO); txt('°C · KM/H · MM', W - M, y, '500 16px ' + MONO, 'right');
    y = 130;

    /* days */
    for (var i = 0; i < n; i++) {
      var y0 = y, a = ymd(D.time[i]), name = DAY[new Date(a[0], a[1] - 1, a[2]).getDay()];
      box(M, y0, W - 2 * M, 3);
      txt(i ? name : 'TODAY', M, y0 + 40, '700 32px ' + SANS);
      var xr = W - M; flags(D, i).forEach(function (f) { xr -= chip(f, xr, y0 + 34) + 6; });
      var hw = fit(R(D.temperature_2m_max[i]) + '°', M - 2, y0 + 146, '700', 78, 150, SANS), lx = M + hw + 6;
      txt('HIGH', M, y0 + 66, '600 15px ' + MONO); txt('LOW', lx, y0 + 66, '600 15px ' + MONO);
      fit(R(D.temperature_2m_min[i]) + '°', lx, y0 + 146, '600', 42, 226 - lx, SANS);
      var bx = 232, bw = 140;
      fit(sky(D.weather_code[i]), bx, y0 + 82, '700', 26, bw, SANS);
      fit('RAIN ' + D.precipitation_probability_max[i] + '%' + (D.precipitation_sum[i] >= 0.5 ? ' ' + Math.max(1, R(D.precipitation_sum[i])) + 'MM' : ''), bx, y0 + 110, '600', 20, bw, MONO);
      fit('WIND ' + pt(D.wind_direction_10m_dominant[i]) + ' ' + R(D.wind_speed_10m_max[i]), bx, y0 + 134, '500', 20, bw, MONO);
      fit('UV ' + R(D.uv_index_max[i] || 0), bx, y0 + 158, '500', 20, bw, MONO);
      var cx = 384; moon(W - M - 26, y0 + 76, 24, age(D.time[i]));
      if (TD && TD.length >= (i + 1) * 24) { var v = TD.slice(i * 24, i * 24 + 25), hs = highs(v);
        txt('TIDE', cx, y0 + 66, '600 15px ' + MONO);
        tide(cx, y0 + 104, W - M - cx, 34, v);
        if (hs.length) fit('HIGH ' + hs.map(hr).join(' '), cx, y0 + 160, '500', 16, W - M - cx, MONO); }
      y += BH;
    }
    box(M, y, W - 2 * M, 3);

    /* foot */
    y += 18;
    if (window.qrcode) { var q = window.qrcode(0, 'M'); q.addData(o.link || 'https://novel.global/x#weather'); q.make(); var qn = q.getModuleCount(), s = 4; g.fillStyle = '#000';
      for (var r = 0; r < qn; r++) for (var c2 = 0; c2 < qn; c2++) if (q.isDark(r, c2)) g.fillRect(M + c2 * s, y + r * s, s, s); var fx = M + qn * s + 18; } else fx = M;
    txt('PLAY ON CARD', fx, y + 26, '600 20px ' + MONO);
    txt('novel.global', fx, y + 64, '700 30px ' + SANS);
    txt('DATA OPEN-METEO.COM', fx, y + 96, '500 15px ' + MONO);
    y += 132; box(M, y, W - 2 * M, 1); y += 4; box(M, y, W - 2 * M, 5); y += 14;
    /* one bit */
    var im = g.getImageData(0, 0, W, y), p = im.data;
    for (var k = 0; k < p.length; k += 4) { var on = p[k] * 0.3 + p[k + 1] * 0.59 + p[k + 2] * 0.11 < 140 ? 0 : 255; p[k] = p[k + 1] = p[k + 2] = on; p[k + 3] = 255; }
    cv.height = y; g.putImageData(im, 0, 0);
    return cv;
  }
  window.WXS = { draw: draw, flags: flags };

  /* page */
  if (!document.getElementById || !T) return;
  var CROCK = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  var code = function () { var s = 'DA-', r = new Uint8Array(4); crypto.getRandomValues(r); for (var i = 0; i < 4; i++) s += CROCK[r[i] % 32]; return s; };
  var api = function (p, o) { return fetch('/api' + p, Object.assign({ headers: { 'content-type': 'application/json' } }, o || {})).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || r.status); return j; }); }); };
  var word = function (p) { return String(p.name || p.id).trim().split(/\s+/)[0].toUpperCase(); };
  var S = { stack: null, data: null, to: null, prns: [] }, cv = null, IN = /[?&]in=1/.test(location.search);

  function keys() { var go = $('#go'); if (go) go.disabled = !S.data || !S.to; [].forEach.call(document.querySelectorAll('#to button'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.p === S.to)); }); }
  function printers() {
    return api('/partners').then(function (j) {
      var l = j.partners || [], to = ((S.stack.blocks || []).filter(function (b) { return b.k === 'print'; })[0] || {}).to || ['novelglobal'];
      S.prns = l.filter(function (p) { return to.indexOf(p.id) >= 0 || (to.indexOf('island') >= 0 && p.id === S.stack.island); }).filter(function (p) { return p.paired || p.id === 'novelglobal'; });
      S.to = S.prns.length ? S.prns[0].id : null; $('#led').classList.toggle('on', S.prns.some(function (p) { return p.ready; }));
      $('#to').innerHTML = S.prns.length > 1 ? S.prns.map(function (p) { return '<button type="button" data-p="' + p.id + '"><i class="led' + (p.ready ? ' on' : '') + '"></i>' + word(p) + '</button>'; }).join('') : '';
      keys();
    }).catch(function () { S.prns = []; S.to = null; keys(); });
  }
  function load() {
    var w = S.stack.where || [-37.77, 144.96], sea = S.stack.sea, st = $('#st');
    api('/wx?at=' + w[0] + ',' + w[1] + (sea ? '&sea=' + sea[0] + ',' + sea[1] : '')).then(function (d) {
      S.data = d; var go = function () { draw(cv, d, { place: S.stack.place || '' }); $('#paper').classList.add('has'); st.textContent = ''; keys(); };
      (document.fonts && document.fonts.load ? Promise.all(['400 40px VT323', '700 40px Poppins', '600 40px Poppins', '600 20px "IBM Plex Mono"', '500 20px "IBM Plex Mono"'].map(function (f) { return document.fonts.load(f); })) : Promise.resolve()).then(go, go);
    }, function () { st.textContent = '×'; });
  }
  function print() {
    var go = $('#go'), st = $('#st'); if (!S.data || !S.to) return; go.disabled = true;
    var w = S.stack.where || [0, 0], c = code(), body = { type: 'stack', stack: S.stack.id, lat: w[0], lng: w[1] };
    st.textContent = '· · ·';
    api('/stories', { method: 'POST', body: JSON.stringify({ kind: 'record', code: c, body: JSON.stringify(body), lat: w[0], lng: w[1], dest: S.to, escpos: T.raster(cv, 0), from: S.stack.id, stage: 'stack' }) })
      .then(function () { st.textContent = c; }, function (e) { st.textContent = /429|too many/i.test(e.message) ? 'TRY AGAIN SOON' : '×'; }).then(function () { go.disabled = false; keys(); });
  }
  document.addEventListener('DOMContentLoaded', function () {
    if (!$('#wx')) return; if (IN) document.documentElement.className = 'in';
    cv = $('#paper canvas');
    fetch('stacks/weather.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (s) {
      S.stack = s; $('#nm').textContent = s.name || 'WEATHER'; load(); printers();
      $('#to').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { S.to = b.dataset.p; keys(); } });
      $('#go').addEventListener('click', print);
    }).catch(function () { $('#nm').textContent = '—'; });
  });
})();

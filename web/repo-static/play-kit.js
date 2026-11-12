/* the play kit: a thing made in LIVE runs in a sandbox with no network; what it prints falls onto paper beside it */
(function () {
  var D = document;
  var TH = { dots: ['#0B0B0B', '#F4F1E8', '#F4F1E8'], lilac: ['#C9C1F7', '#0B0B0B', '#0B0B0B'], cyan: ['#1EA0E0', '#0B0B0B', '#F4F1E8'], coral: ['#E9E4DC', '#0B0B0B', '#E5262B'], pink: ['#F2B6C6', '#1F5A33', '#1F7A3E'], print: ['#17457F', '#F4F1E8', '#F2B6C6'] };

  /* what a made thing can call; runs inside the sandbox */
  function kit(STORE, QUICK) {
    window.QUICK = !!QUICK;
    var D = document, q = function (o) { parent.postMessage({ pk: 1, o: o }, '*'); }, S = function (t) { return t == null ? '' : String(t); };
    window.print = function (t) { q({ t: 'text', s: S(t).slice(0, 2000) }); };
    window.big = function (t) { q({ t: 'big', s: S(t).slice(0, 200) }); };
    window.small = function (t) { q({ t: 'small', s: S(t).slice(0, 400) }); };
    window.line = function () { q({ t: 'line' }); };
    window.qr = function (t) { q({ t: 'qr', s: S(t).slice(0, 300) }); };
    window.moon = function () { q({ t: 'moon' }); };
    window.cut = function () { q({ t: 'cut' }); };
    window.pick = function (l) { return l[Math.floor(Math.random() * l.length)]; };
    window.wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
    window.every = function (s, fn) { return setInterval(fn, Math.max(0.2, +s || 1) * 1000); };
    var root = D.getElementById('k');
    window.show = function (h) { root.innerHTML = S(h); };
    window.say = function (t) { var p = D.createElement('p'); p.textContent = S(t); root.appendChild(p); p.scrollIntoView({ block: 'end' }); return p; };
    window.button = function (l, fn) { var b = D.createElement('button'); b.type = 'button'; b.textContent = S(l); b.onclick = function () { if (fn) fn(); }; root.appendChild(b); return b; };
    window.ask = function (l) { return new Promise(function (res) { var f = D.createElement('form'); f.innerHTML = '<label></label><span><input autocomplete="off"><button>→</button></span>'; f.querySelector('label').textContent = S(l); f.onsubmit = function (e) { e.preventDefault(); var v = f.querySelector('input').value; f.remove(); res(v); }; root.appendChild(f); f.querySelector('input').focus(); }); };
    window.choose = function (l) { return new Promise(function (res) { var d = D.createElement('div'); d.className = 'ch'; (l || []).forEach(function (x) { var b = D.createElement('button'); b.type = 'button'; b.textContent = S(x); b.onclick = function () { d.remove(); res(x); }; d.appendChild(b); }); root.appendChild(d); }); };
    window.beep = function (f, d) { try { var A = window.__ac || (window.__ac = new AudioContext()), o = A.createOscillator(), g = A.createGain(); d = d || 0.08; o.type = 'square'; o.frequency.value = f || 660; g.gain.setValueAtTime(0.05, A.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, A.currentTime + d); o.connect(g); g.connect(A.destination); o.start(); o.stop(A.currentTime + d + 0.02); } catch (e) { /* silent */ } };
    window.phase = function () { var d = (Date.now() - Date.UTC(2000, 0, 6, 18, 14)) / 864e5, f = ((d % 29.530588853) + 29.530588853) % 29.530588853 / 29.530588853; return ['NEW MOON', 'WAXING CRESCENT', 'FIRST QUARTER', 'WAXING GIBBOUS', 'FULL MOON', 'WANING GIBBOUS', 'LAST QUARTER', 'WANING CRESCENT'][Math.round(f * 8) % 8]; };
    window.keep = function (k, v) { k = S(k).slice(0, 40); if (v === undefined) return STORE[k]; STORE[k] = v; q({ t: 'keep', k: k, v: JSON.stringify(v).slice(0, 4000) }); return v; };
    window.onerror = function (m, u, l) { q({ t: 'err', s: S(m) + (l ? ' · ' + l : '') }); };
    window.addEventListener('unhandledrejection', function (e) { q({ t: 'err', s: S(e.reason && e.reason.message || e.reason) }); });
  }
  var KIT = '(' + kit.toString() + ')';

  function doc(src, th, store, quick) { var t = TH[th] || TH.print;
    var css = 'html,body{margin:0;height:100%}body{background:' + t[0] + ';color:' + t[1] + ';font:15px/1.45 ui-monospace,Menlo,Consolas,monospace;-webkit-font-smoothing:antialiased}' +
      '#k{min-height:100%;box-sizing:border-box;padding:18px 16px 28px;display:flex;flex-direction:column;gap:10px;align-items:flex-start}#k p{margin:0}' +
      'button{font:inherit;font-weight:600;letter-spacing:.06em;padding:9px 16px;border-radius:999px;border:1.5px solid ' + t[1] + ';background:transparent;color:inherit;cursor:pointer}button:active{background:' + t[2] + ';color:' + t[0] + '}' +
      'form{display:flex;flex-direction:column;gap:6px;width:100%}form span{display:flex;gap:6px}input{flex:1;min-width:0;font:inherit;padding:9px 12px;border-radius:10px;border:1.5px solid ' + t[1] + ';background:transparent;color:inherit}input:focus{outline:2px solid ' + t[2] + '}' +
      '.ch{display:flex;flex-wrap:wrap;gap:6px}h1,h2{margin:0;font-family:system-ui,sans-serif;letter-spacing:-.02em}img{max-width:100%}';
    var csp = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob:; font-src data:";
    var body = String(src || '').replace(/<\/(script)/gi, '<\\/$1');
    return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="' + csp + '"><style>' + css + '</style></head><body><main id="k"></main>' +
      '<script>' + KIT + '(' + JSON.stringify(store || {}).replace(/</g, '\\u003c') + ',' + (quick ? 'true' : 'false') + ')<\/script><script>(async function () {\n' + body + '\n})().catch(function (e) { onerror(e && e.message || String(e)); });<\/script></body></html>';
  }

  /* the paper: what was printed, drawn as a thermal slip 512 dots wide */
  function moonAt(c, cx, cy, R) { var d = (Date.now() - Date.UTC(2000, 0, 6, 18, 14)) / 864e5, f = ((d % 29.530588853) + 29.530588853) % 29.530588853 / 29.530588853, k = Math.cos(f * 2 * Math.PI);
    c.save(); c.beginPath(); c.arc(cx, cy, R, 0, 7); c.lineWidth = 2; c.stroke(); c.beginPath(); c.arc(cx, cy, R, -Math.PI / 2, Math.PI / 2, f >= 0.5); c.ellipse(cx, cy, Math.abs(k) * R, R, 0, Math.PI / 2, -Math.PI / 2, (f < 0.5) === (k > 0)); c.fill(); c.restore(); }
  function draw(cv, ops) { var W = 512, P = 24, iw = W - P * 2, t = D.createElement('canvas').getContext('2d'), y = 20, todo = [];
    var wrap = function (s, font) { t.font = font; var out = []; String(s).split('\n').forEach(function (ln) { var cur = ''; ln.split(' ').forEach(function (x) { var tr = cur ? cur + ' ' + x : x; if (t.measureText(tr).width > iw && cur) { out.push(cur); cur = x; } else cur = tr; }); out.push(cur); }); return out; };
    var add = function (h, fn) { todo.push([y, fn]); y += h; };
    ops.forEach(function (o) { var f, L;
      if (o.t === 'text') { f = '500 24px ui-monospace, Menlo, monospace'; L = wrap(o.s, f); add(L.length * 30 + 10, function (c, y0) { c.font = f; L.forEach(function (l, j) { c.fillText(l, P, y0 + 24 + j * 30); }); }); }
      if (o.t === 'big') { f = '800 46px system-ui, Arial, sans-serif'; L = wrap(o.s, f); add(L.length * 48 + 14, function (c, y0) { c.font = f; L.forEach(function (l, j) { c.fillText(l, P, y0 + 42 + j * 48); }); }); }
      if (o.t === 'small') { f = '500 17px ui-monospace, Menlo, monospace'; L = wrap(o.s, f); add(L.length * 22 + 8, function (c, y0) { c.font = f; L.forEach(function (l, j) { c.fillText(l, P, y0 + 17 + j * 22); }); }); }
      if (o.t === 'line') add(22, function (c, y0) { for (var x = P; x < W - P; x += 10) c.fillRect(x, y0 + 10, 5, 2); });
      if (o.t === 'moon') add(96, function (c, y0) { moonAt(c, W / 2, y0 + 46, 40); });
      if (o.t === 'cut') add(34, function (c, y0) { c.save(); c.globalCompositeOperation = 'destination-out'; for (var x = 0; x < W; x += 16) { c.beginPath(); c.moveTo(x, y0 + 17); c.lineTo(x + 8, y0 + 9); c.lineTo(x + 16, y0 + 17); c.lineTo(x + 8, y0 + 25); c.fill(); } c.restore(); });
      if (o.t === 'qr' && window.qrcode) { var m; try { m = window.qrcode(0, 'M'); m.addData(o.s); m.make(); } catch (e) { m = null; } if (m) { var n = m.getModuleCount(), s = Math.floor(200 / n); add(n * s + 20, function (c, y0) { var x0 = (W - n * s) / 2; for (var r = 0; r < n; r++) for (var q = 0; q < n; q++) if (m.isDark(r, q)) c.fillRect(x0 + q * s, y0 + 10 + r * s, s, s); }); } } });
    y += 24; cv.width = W; cv.height = Math.max(y, 10); var c = cv.getContext('2d'); c.fillStyle = '#FBFAF6'; c.fillRect(0, 0, W, cv.height); c.fillStyle = '#0B0B0B'; c.strokeStyle = '#0B0B0B';
    todo.forEach(function (d) { d[1](c, d[0]); }); return cv.height; }

  /* a screen and its paper, in one host */
  function mount(host, opt) { opt = opt || {};
    host.classList.add('pk'); host.innerHTML = '<div class="pk-scr"><iframe title="It, running" src="about:blank"></iframe></div><div class="pk-pap" aria-label="Its paper"><div class="pk-roll"><canvas width="512" height="10"></canvas></div></div>';
    var scr = host.querySelector('.pk-scr'), roll = host.querySelector('.pk-roll'), cv = host.querySelector('canvas'), fr = host.querySelector('iframe'), ops = [], last = { src: '', th: '' }, html = '';
    var paint = function () { draw(cv, ops); host.classList.toggle('inked', ops.length > 0); roll.scrollTop = roll.scrollHeight; };
    addEventListener('message', function (e) { if (e.source !== fr.contentWindow || e.origin !== location.origin || !e.data) return; if (e.data.pkready === 1 && html) { fr.contentWindow.postMessage({ pkrun: html }, location.origin); html = ''; return; } if (e.data.pk !== 1) return; var o = e.data.o || {};
      if (o.t === 'keep') { if (opt.keep) opt.keep(o.k, o.v); return; }
      if (o.t === 'err') { if (opt.err) opt.err(String(o.s || '').slice(0, 160)); return; }
      if (ops.length > 400 || !/^(text|big|small|line|qr|moon|cut)$/.test(o.t)) return; ops.push({ t: o.t, s: String(o.s == null ? '' : o.s) }); paint(); if (opt.ink) opt.ink(o); });
    function run(src, th, store) { last = { src: src, th: th }; ops = []; paint(); if (opt.err) opt.err(''); var nf = fr.cloneNode(); html = doc(src, th, store, opt.quick); nf.src = 'play-box.html'; fr.replaceWith(nf); fr = nf; var t = TH[th] || TH.print; scr.style.background = t[0]; }
    return { run: run, again: function (store) { run(last.src, last.th, store); }, paper: function () { return ops.length ? cv.toDataURL('image/png') : null; }, inked: function () { return ops.length; } };
  }

  /* the brief to hand to any AI, so it writes for this kit */
  var BRIEF = 'Write plain JavaScript (no HTML, no imports, no network) for a tiny experience that runs on a phone screen next to a thermal receipt printer. Top-level await works. Available functions:\n' +
    'print(text) big(text) small(text) line() qr(text) moon() cut()  -> put things on the paper\n' +
    'say(text) show(html) button(label, fn) await ask(label) await choose([..])  -> the screen\n' +
    'pick(list) await wait(ms) every(seconds, fn) beep(freq) phase() (moon phase name) keep(key) / keep(key, value) (remembered)\n' +
    'QUICK is true when it is opened for a quick print: put one thing on the paper at once\n' +
    'Keep it short and playful. Reply with only the code.\n\nWhat I want: ';
  window.PK = { mount: mount, doc: doc, draw: draw, TH: TH, BRIEF: BRIEF };
})();

/* island archipelagos: the bench's other benches. SLIP (bench.js) makes a receipt; PAGE makes a phone page that links to it;
   GAME makes a game for the printer and plays it on a console here; CARD sends any of them to the front page */
(function () {
  'use strict';
  var D = document, H = D.documentElement, $ = function (s, r) { return (r || D).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || D).querySelectorAll(s)); };
  var NG = (function () { try { return window.parent !== window ? window.parent.NG : null; } catch (e) { return null; } })();
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var I = function (d) { return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>'; };
  var K = 'da.bench.plus.v2', P = { m: 'slip', page: null, game: null, card: {} };
  try { var p0 = JSON.parse(localStorage.getItem(K) || 'null'); if (p0) P = Object.assign(P, p0); } catch (e) { /* fresh */ }
  var save = function () { try { localStorage.setItem(K, JSON.stringify(P)); } catch (e) { /* this visit only */ } };
  var mq = /[?&]m=(slip|page|game|live|card|set)/.exec(location.search); if (mq) P.m = mq[1];

  /* a little sound for each thing done */
  var AC = null, SFX = false; function beep(f, d, type) { if (!SFX) return; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); var o = AC.createOscillator(), g = AC.createGain(); o.type = type || 'square'; o.frequency.value = f; g.gain.setValueAtTime(0.05, AC.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + (d || 0.06)); o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime + (d || 0.06) + 0.02); } catch (e) { /* silent */ } }

  /* the posters' palettes, for pages, games and cards alike */
  var THEMES = {
    dots: { n: 'DOTS', bg: '#0B0B0B', ink: '#F4F1E8', acc: '#F4F1E8', pat: 'radial-gradient(#F4F1E8 1.3px, transparent 1.6px) 0 0 / 9px 9px' },
    lilac: { n: 'LILAC', bg: '#C9C1F7', ink: '#0B0B0B', acc: '#0B0B0B', pat: 'linear-gradient(transparent 70%, #0B0B0B 70%) 0 0 / 100% 100%' },
    cyan: { n: 'CYAN', bg: '#1EA0E0', ink: '#0B0B0B', acc: '#F4F1E8', pat: 'repeating-linear-gradient(135deg, transparent 0 14px, rgba(11,11,11,.9) 14px 22px)' },
    coral: { n: 'CORAL', bg: '#E9E4DC', ink: '#0B0B0B', acc: '#E5262B', pat: 'radial-gradient(circle at 80% 20%, #F4C542 0 18%, transparent 18.5%), radial-gradient(circle at 15% 85%, #4A6FE0 0 14%, transparent 14.5%)' },
    pink: { n: 'PINK', bg: '#F2B6C6', ink: '#1F5A33', acc: '#1F7A3E', pat: 'radial-gradient(ellipse at 70% 90%, #1F7A3E 0 22%, transparent 22.5%)' },
    print: { n: 'BLUEPRINT', bg: '#17457F', ink: '#F4F1E8', acc: '#F2B6C6', pat: 'linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px) 0 0 / 22px 22px, linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px) 0 0 / 22px 22px' }
  };
  var swatches = function (cur, attr) { return Object.keys(THEMES).map(function (k) { var t = THEMES[k]; return '<button type="button" ' + attr + '="' + k + '" title="' + t.n.toLowerCase() + ' palette" aria-pressed="' + (k === cur) + '" style="--a:' + t.bg + ';--b:' + t.ink + ';--p:' + t.pat + '"><i></i></button>'; }).join(''); };

  /* ───────── the mode bar ───────── */
  var MODES = [['slip', 'SLIP', 'Design a receipt, part by part, and print it', I('<path d="M6 3h12v18l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4z"/><path d="M9 8h6M9 11h6M9 14h3"/>')],
    ['page', 'PAGE', 'Design a phone page that links to your receipt', I('<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10 18.5h4M9 7h6M9 10h6M9 13h4"/>')],
    ['game', 'GAME', 'Make a game that plays on paper, and test it here', I('<rect x="3" y="7" width="18" height="11" rx="3"/><path d="M7.5 10.5v4M5.5 12.5h4"/><circle cx="15.5" cy="11.5" r="1" class="f"/><circle cx="17.8" cy="13.8" r="1" class="f"/>')],
    ['live', 'LIVE', 'Write it, or paste past code, and it runs here', I('<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 5l-3 14"/>')],
    ['card', 'CARD', 'Send what you made to the front page as a card', I('<path d="M5 3h14v18H5z"/><path d="M12 7l1.4 2.9 3.1.4-2.3 2.2.6 3.1L12 14l-2.8 1.6.6-3.1-2.3-2.2 3.1-.4z"/>')],
    ['set', 'SET', 'Choose what joins what on the front page, and its frames', I('<circle cx="6" cy="6" r="2.2"/><circle cx="18" cy="6" r="2.2"/><circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="18" r="2.2"/><path d="M8 6h8M6 8v8M8 7.5l8.5 9"/>')]];
  var MI = function (k) { return MODES.filter(function (m) { return m[0] === k; })[0][3]; };
  var hd = $('header'), bar = D.createElement('nav'); bar.id = 'modes'; bar.setAttribute('aria-label', 'What to make');
  bar.innerHTML = MODES.map(function (m) { return '<button type="button" data-m="' + m[0] + '" title="' + m[2] + '">' + m[3] + '<span>' + m[1] + '</span></button>'; }).join('') + '<i class="mb-ink" aria-hidden="true"></i>';
  hd.insertBefore(bar, $('#starts'));
  var host = D.createElement('div'); host.id = 'plus'; $('main').after(host);
  host.innerHTML = '<section id="pg" class="mode" aria-label="Page"></section><section id="gm" class="mode" aria-label="Game"></section><section id="cd" class="mode" aria-label="Card"></section><section id="st" class="mode" aria-label="Set-up"></section><section id="lv" class="mode" aria-label="Live"></section>';
  function mode(m, quiet) { P.m = m; save(); H.dataset.m = m; $$('#modes [data-m]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.m === m)); });
    var on = $('#modes [data-m="' + m + '"]'), ink = $('#modes .mb-ink'); if (on && ink) { ink.style.left = on.offsetLeft + 'px'; ink.style.width = on.offsetWidth + 'px'; }
    if (m === 'page') page(); if (m === 'game') game(); if (m === 'card') card(); if (m === 'set') setup(); if (m === 'live') live(); if (!quiet) coach(m); if (!quiet) beep(520 + MODES.map(function (x) { return x[0]; }).indexOf(m) * 120, 0.05); tipsAll(); }
  bar.addEventListener('click', function (e) { var b = e.target.closest('[data-m]'); if (b) mode(b.dataset.m); });
  addEventListener('resize', function () { var on = $('#modes [aria-pressed="true"]'), ink = $('#modes .mb-ink'); if (on && ink) { ink.style.left = on.offsetLeft + 'px'; ink.style.width = on.offsetWidth + 'px'; } });

  /* every button says what it does when hovered: its title, drawn as a tip */
  var TIPS = { story: 'Start from a story', recipe: 'Start from a recipe', hike: 'Start from a walk', found: 'Start from something found', blank: 'Start from nothing',
    title: 'A big title', text: 'Words', list: 'A tick list', steps: 'Numbered steps', form: 'Lines to write on', rule: 'A thick line', qr: 'A QR code to a link', photo: 'A photo, printed in dots',
    moon: 'Tonight’s moon', place: 'Where you are', prompt: 'A story prompt, rolled', code: 'Sums from a sensor', sensor: 'A live number from a board on USB', route: 'A walk from a GPX file', mesh: 'A line sent on by mesh', card: 'Another island’s card' };
  function tipsAll() {
    $$('#starts [data-s]').forEach(function (b) { b.title = TIPS[b.dataset.s] || ''; });
    $$('#tray [data-add]').forEach(function (b) { b.title = (TIPS[b.dataset.add] || '') + (b.disabled ? ' (opens as more islands join)' : ''); });
    $$('#paper .sk').forEach(function (b) { b.title = 'Add a part here'; });
    var tp = { '#pr': 'Print it on the printer chosen', '#set': 'Settings', '#to': 'Which printer', '#mark': 'novel.global' }; Object.keys(tp).forEach(function (s) { var el = $(s); if (el) el.title = tp[s]; });
    $$('#ks [data-mv="-1"]').forEach(function (b) { b.title = 'Move up'; }); $$('#ks [data-mv="1"]').forEach(function (b) { b.title = 'Move down'; }); $$('#ks [data-rm]').forEach(function (b) { b.title = 'Remove'; });
    $$('#paper [data-roll]').forEach(function (b) { b.title = 'Roll another prompt'; }); $$('#paper [data-gps]').forEach(function (b) { b.title = 'Use where you are'; }); $$('#paper [data-file]').forEach(function (b) { b.title = 'Choose a file'; }); $$('#paper [data-ser]').forEach(function (b) { b.title = 'Connect a board on USB'; });
  }
  var tipEl = D.createElement('b'); tipEl.id = 'tip'; tipEl.setAttribute('role', 'tooltip'); D.body.appendChild(tipEl); var tipT = 0;
  D.addEventListener('pointerover', function (e) { var t = e.target.closest && e.target.closest('[title],[data-tip]'); if (!t || e.pointerType === 'touch') return; if (t.title) { t.dataset.tip = t.title; t.removeAttribute('title'); if (!t.getAttribute('aria-label')) t.setAttribute('aria-label', t.dataset.tip); }
    clearTimeout(tipT); tipT = setTimeout(function () { var r = t.getBoundingClientRect(); tipEl.textContent = t.dataset.tip; tipEl.classList.add('on'); var w = tipEl.offsetWidth, x = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)), y = r.top - tipEl.offsetHeight - 8; tipEl.style.left = x + 'px'; tipEl.style.top = (y < 6 ? r.bottom + 8 : y) + 'px'; }, 260); });
  D.addEventListener('pointerout', function (e) { if (e.target.closest && e.target.closest('[data-tip]')) { clearTimeout(tipT); tipEl.classList.remove('on'); } });
  new MutationObserver(function () { clearTimeout(tipsAll.t); tipsAll.t = setTimeout(tipsAll, 60); }).observe($('main'), { childList: true, subtree: true });

  /* the moon as it is tonight, drawn, never named */
  function moonF() { var d = (Date.now() - Date.UTC(2000, 0, 6, 18, 14)) / 864e5; return ((d % 29.530588853) + 29.530588853) % 29.530588853 / 29.530588853; }
  function moonAt(c, cx, cy, R, f) { f = f == null ? moonF() : f; var left = f < 0.5, k = Math.cos(f * 2 * Math.PI), r = R - 2.5; c.save(); c.fillStyle = '#111'; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(cx, cy, r, Math.PI / 2, Math.PI * 1.5, !left); c.closePath(); c.fill(); c.fillStyle = k > 0 ? '#111' : '#fff'; c.beginPath(); c.ellipse(cx, cy, Math.abs(k) * r + 0.5, r, 0, 0, 7); c.fill(); c.restore(); }
  var moonSvg = function (f) { f = f == null ? moonF() : f; var k = Math.cos(f * 2 * Math.PI), left = f < 0.5; return '<svg class="mn" viewBox="-10 -10 20 20" aria-hidden="true"><circle r="9.5" fill="currentColor" opacity=".18"/><path fill="currentColor" d="M0 -9A9 9 0 0 ' + (left ? 0 : 1) + ' 0 9A' + (Math.abs(k) * 9).toFixed(2) + ' 9 0 0 ' + ((k > 0) === left ? 1 : 0) + ' 0 -9z"/></svg>'; };

  /* ───────── PAGE: a phone page, block by block, in a poster's palette; it links to the receipt and plugs into flows ───────── */
  var BLOCKS = {
    cover: ['COVER', 'A big photo with the title over it', I('<path d="M3 5h18v14H3z"/><path d="M3 15l5-4 4 3 3-2 6 4"/>')], head: ['HEADING', 'A heading', I('<path d="M6 5v14M18 5v14M6 12h12"/>')],
    text: ['TEXT', 'A few lines of words', I('<path d="M5 7h14M5 12h14M5 17h9"/>')], receipt: ['RECEIPT', 'A button that prints your slip', I('<path d="M6 3h12v18l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4z"/><path d="M9 9h6M9 12h6"/>')],
    slip: ['SLIP', 'A picture of your slip, as it prints', I('<path d="M7 2h10v20H7z"/><path d="M9.5 6h5M9.5 9h5M9.5 12h3"/>')], gallery: ['PHOTOS', 'A row of photos', I('<path d="M3 6h8v8H3zM13 6h8v8h-8zM3 16h18"/>')],
    map: ['MAP', 'Where it is, as a pin', I('<path d="M12 21s-6-6.2-6-11a6 6 0 0 1 12 0c0 4.8-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>')], qr: ['QR', 'A QR code to a link', I('<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2z"/>')],
    moon: ['MOON', 'Tonight’s moon', I('<path d="M15 3a9 9 0 1 0 6 13A7 7 0 0 1 15 3z"/>')], link: ['LINK', 'A button to anywhere', I('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>')],
    sound: ['SOUND', 'A key that plays a chord', I('<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/>')], game: ['GAME', 'Your game’s cartridge, to play', I('<rect x="3" y="7" width="18" height="11" rx="3"/><path d="M7.5 10.5v4M5.5 12.5h4"/>')]
  };
  var MODS = [['mesh', 'MESH', 'Send slips on by LoRa mesh between islands', I('<circle cx="5" cy="17" r="2.2"/><circle cx="19" cy="17" r="2.2"/><circle cx="12" cy="5" r="2.2"/><path d="M6.5 15.4L10.7 7M13.3 7l4.2 8.4M7.2 17h9.6"/>')],
    ['sensor', 'SENSOR', 'A live number from a LilyGo or any board', I('<path d="M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4"/>')], ['scan', 'SCAN', 'A QR on the slip that opens this page', I('<path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M7 12h10"/>')],
    ['moon', 'MOON CLOCK', 'Change with the moon’s phase', I('<path d="M15 3a9 9 0 1 0 6 13A7 7 0 0 1 15 3z"/>')], ['hook', 'WEBHOOK', 'Tell another service when it prints', I('<path d="M9 18a3 3 0 1 1-1-5.8L11 7M15 6a3 3 0 1 1 1.7 5.5L13 17h-4M18 18a3 3 0 1 1-3-3"/>')],
    ['git', 'GITHUB', 'Keep it in a GitHub repository', I('<path d="M9 19c-4 1.3-4-2-6-2.5M15 21v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>')]];
  function pageState() { if (!P.page) P.page = { th: 'print', mods: { scan: 1 }, hook: '', git: '', b: [{ k: 'cover', t: '', src: '' }, { k: 'receipt', t: '', u: '' }, { k: 'slip' }, { k: 'moon' }] }; return P.page; }
  var slipURL = function () { var c = $('#cv'); try { return c && c.height > 10 ? c.toDataURL('image/png') : ''; } catch (e) { return ''; } };
  function pageHTML(pg, live) { var t = THEMES[pg.th] || THEMES.print;
    var body = pg.b.map(function (b, i) { var a = live ? ' data-pi="' + i + '"' : '';
      if (b.k === 'cover') return '<header class="pv-cov"' + a + (b.src ? ' style="background-image:url(' + b.src + ')"' : '') + '><h1>' + esc(b.t || '') + '</h1></header>';
      if (b.k === 'head') return '<h2' + a + '>' + esc(b.t || '') + '</h2>';
      if (b.k === 'text') return '<p' + a + '>' + esc(b.t || '').replace(/\n/g, '<br>') + '</p>';
      if (b.k === 'receipt') return '<a class="pv-btn pv-rc"' + a + ' href="' + esc(b.u || 'https://novel.global/') + '"' + (live ? ' data-print' : '') + '><span>' + esc(b.t || 'PRINT MY SLIP') + '</span><i></i></a>';
      if (b.k === 'link') return '<a class="pv-btn"' + a + ' href="' + esc(b.u || '#') + '">' + esc(b.t || 'OPEN') + ' ↗</a>';
      if (b.k === 'slip') { var u = slipURL(); return u ? '<figure class="pv-slip"' + a + '><img alt="The slip" src="' + u + '"></figure>' : ''; }
      if (b.k === 'gallery') return '<div class="pv-gal"' + a + '>' + (b.srcs || []).map(function (s) { return '<img alt="" src="' + s + '">'; }).join('') + ((b.srcs || []).length ? '' : '<i></i><i></i><i></i>') + '</div>';
      if (b.k === 'map') return '<div class="pv-map"' + a + '><svg viewBox="0 0 100 60"><path d="M0 40C20 30 30 48 50 36S80 20 100 28" /><path d="M0 52C25 44 35 58 60 48S90 40 100 44" /><circle cx="56" cy="30" r="4"/></svg><small>' + (b.lat != null ? b.lat.toFixed(3) + ', ' + b.lng.toFixed(3) : '') + '</small></div>';
      if (b.k === 'qr') return '<div class="pv-qr"' + a + '>' + qrSvg(b.u || 'https://novel.global/') + '</div>';
      if (b.k === 'moon') return '<div class="pv-moon"' + a + '>' + moonSvg() + '</div>';
      if (b.k === 'sound') return '<button class="pv-btn pv-snd"' + a + (live ? ' data-chord' : ' onclick="(function(){var A=new AudioContext();[0,4,7].forEach(function(s,i){var o=A.createOscillator(),g=A.createGain();o.frequency.value=262*Math.pow(2,s/12);g.gain.value=.05;g.gain.exponentialRampToValueAtTime(.0001,A.currentTime+1.2);o.connect(g);g.connect(A.destination);o.start(A.currentTime+i*.08);o.stop(A.currentTime+1.3)})})()"') + '>♪ ' + esc(b.t || 'PLAY') + '</button>';
      if (b.k === 'game') { var gs = gameState(), c = CARTS[gs.cart] || CARTS.fortune; return '<div class="pv-game"' + a + '><b>' + c.n + '</b><span>' + esc(gs.title || c.n) + '</span></div>'; }
      return ''; }).join('');
    var css = ':root{--bg:' + t.bg + ';--ink:' + t.ink + ';--acc:' + t.acc + '}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:400 15px/1.45 Poppins,Arial,sans-serif}.pv{min-height:100%;padding:0 0 28px;background:' + t.pat + ', var(--bg)}' +
      '.pv>*{margin:0 18px 16px}.pv-cov{margin:0 0 18px;min-height:240px;display:flex;align-items:flex-end;padding:18px;background:var(--ink) center/cover;color:var(--bg)}.pv-cov h1{margin:0;font:700 34px/.95 Poppins,Arial;letter-spacing:-.03em;color:#fff;text-shadow:0 2px 18px rgba(0,0,0,.4)}' +
      'h2{font:700 22px/1.05 Poppins,Arial;letter-spacing:-.02em}p{background:var(--bg);padding:2px 0}.pv-btn{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:14px 16px;border-radius:10px;background:var(--ink);color:var(--bg);font:600 12px/1 "IBM Plex Mono",monospace;letter-spacing:.14em;text-decoration:none;border:0;width:calc(100% - 36px);cursor:pointer}' +
      '.pv-rc i{width:22px;height:14px;background:linear-gradient(var(--bg),var(--bg)) 50% 0/14px 2px no-repeat,linear-gradient(var(--bg),var(--bg)) 50% 5px/14px 2px no-repeat,linear-gradient(var(--bg),var(--bg)) 50% 10px/9px 2px no-repeat}' +
      '.pv-slip{background:#fff;padding:10px;box-shadow:0 14px 30px -14px rgba(0,0,0,.6);transform:rotate(-1.4deg)}.pv-slip img{display:block;width:100%}.pv-gal{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.pv-gal img,.pv-gal i{aspect-ratio:1;width:100%;object-fit:contain;background:rgba(0,0,0,.2);border-radius:6px}' +
      '.pv-map{border:1.5px solid var(--ink);border-radius:10px;padding:8px}.pv-map svg{display:block;width:100%;fill:none;stroke:var(--ink);stroke-width:.8}.pv-map circle{fill:var(--acc);stroke:none}.pv-map small{font:500 10px "IBM Plex Mono",monospace}' +
      '.pv-qr svg{width:120px;height:120px;background:#fff;padding:6px;display:block}.pv-moon .mn{width:54px;height:54px;color:var(--ink)}.pv-game{display:flex;justify-content:space-between;padding:16px;border:2px dashed var(--ink);border-radius:12px;font:600 12px/1 "IBM Plex Mono",monospace;letter-spacing:.12em}';
    return { css: css, body: '<main class="pv">' + body + '</main>' };
  }
  function qrSvg(t) { if (!window.qrcode) return ''; try { var m = window.qrcode(0, 'M'); m.addData(String(t)); m.make(); var n = m.getModuleCount(), d = ''; for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (m.isDark(r, c)) d += 'M' + c + ' ' + r + 'h1v1h-1z'; return '<svg viewBox="0 0 ' + n + ' ' + n + '" shape-rendering="crispEdges"><path d="' + d + '" fill="#111"/></svg>'; } catch (e) { return ''; } }
  function page() { var pg = pageState(), el = $('#pg');
    if (!el.dataset.on) { el.dataset.on = 1;
      el.innerHTML = '<div class="pg-stage"><div class="pg-phone" title="Your page, live"><i class="pg-cam"></i><iframe id="pg-scr" title="Your page"></iframe></div><div class="pg-flow" aria-hidden="true"><svg viewBox="0 0 320 70"></svg></div></div>' +
        '<div class="pg-side"><div class="pg-row pg-th">' + swatches(pg.th, 'data-th') + '</div><ol class="pg-bl"></ol>' +
        '<div class="pg-add">' + Object.keys(BLOCKS).map(function (k) { return '<button type="button" data-blk="' + k + '" title="' + BLOCKS[k][1] + '">' + BLOCKS[k][2] + '<span>' + BLOCKS[k][0] + '</span></button>'; }).join('') + '</div>' +
        '<h3 class="pg-h">FLOWS</h3><div class="pg-mods">' + MODS.map(function (m) { return '<button type="button" data-mod="' + m[0] + '" title="' + m[2] + '">' + m[3] + '<span>' + m[1] + '</span></button>'; }).join('') + '</div>' +
        '<div class="pg-cfg"><label data-for="hook"><span>WEBHOOK</span><input data-cfg="hook" placeholder="https://" inputmode="url"></label><label data-for="git"><span>REPOSITORY</span><input data-cfg="git" placeholder="you/your-island"></label></div>' +
        '<div class="pg-out"><button type="button" id="pg-dl" title="Download the page as one HTML file">' + I('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>') + '<span>DOWNLOAD</span></button><button type="button" id="pg-pr" title="Print the receipt it links to">' + I('<path d="M6 9V3h12v6"/><path d="M4 9h16v8H4z"/><path d="M7 14h10v7H7z"/>') + '<span>TEST PRINT</span></button><button type="button" data-go="card" title="Send this page to the front page as a card">' + MI('card') + '<span>MAKE IT A CARD</span></button></div></div>';
      el.addEventListener('click', pageClick); el.addEventListener('input', pageInput); }
    $$('[data-th]', el).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.th === pg.th)); });
    $$('[data-mod]', el).forEach(function (b) { b.setAttribute('aria-pressed', String(!!pg.mods[b.dataset.mod])); });
    $$('.pg-cfg label', el).forEach(function (l) { l.hidden = !pg.mods[l.dataset.for]; var i = $('input', l); if (D.activeElement !== i) i.value = pg[l.dataset.for] || ''; });
    $('.pg-bl', el).innerHTML = pg.b.map(function (b, i) { var B = BLOCKS[b.k] || BLOCKS.text, f = '';
      if (/^(cover|head|text|receipt|link|sound)$/.test(b.k)) f += b.k === 'text' ? '<textarea data-bf="t" rows="2" placeholder="words">' + esc(b.t || '') + '</textarea>' : '<input data-bf="t" placeholder="' + (b.k === 'receipt' ? 'PRINT MY SLIP' : 'words') + '" value="' + esc(b.t || '') + '">';
      if (/^(receipt|link|qr)$/.test(b.k)) f += '<input data-bf="u" placeholder="https://" inputmode="url" value="' + esc(b.u || '') + '">';
      if (b.k === 'cover' || b.k === 'gallery') f += '<button type="button" data-pic title="Choose ' + (b.k === 'cover' ? 'a photo' : 'photos') + '">' + BLOCKS.cover[2] + '</button>';
      if (b.k === 'map') f += '<button type="button" data-here title="Use where you are">' + BLOCKS.map[2] + '</button>';
      return '<li data-bi="' + i + '"><b title="' + B[1] + '">' + B[2] + '</b><div>' + (f || '<span class="pg-auto">' + B[0] + '</span>') + '</div><nav><button type="button" data-bmv="-1" title="Move up"' + (i ? '' : ' disabled') + '>↑</button><button type="button" data-bmv="1" title="Move down"' + (i < pg.b.length - 1 ? '' : ' disabled') + '>↓</button><button type="button" data-brm title="Remove">×</button></nav></li>'; }).join('');
    pagePaint(); flow(); }
  function pagePaint() { var pg = pageState(), h = pageHTML(pg, true), fr = $('#pg-scr'); if (!fr) return; var d = fr.contentDocument; if (!d) return;
    d.open(); d.write('<!doctype html><meta name="viewport" content="width=device-width"><style>@font-face{font-family:Poppins;src:url(/vendor/fonts/poppins-latin-700-normal.woff2) format("woff2");font-weight:700}@font-face{font-family:Poppins;src:url(/vendor/fonts/poppins-latin-400-normal.woff2) format("woff2");font-weight:400}@font-face{font-family:"IBM Plex Mono";src:url(/vendor/fonts/ibm-plex-mono-latin-500-normal.woff2) format("woff2");font-weight:500}' + h.css + '</style>' + h.body); d.close();
    $$('[data-print]', d).forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); testPrint(a); }); });
    $$('[data-chord]', d).forEach(function (a) { a.addEventListener('click', function () { [0, 4, 7].forEach(function (s, i) { setTimeout(function () { beep(262 * Math.pow(2, s / 12), 0.9, 'triangle'); }, i * 80); }); }); });
    $$('[data-pi]', d).forEach(function (n) { n.addEventListener('click', function () { var li = $('.pg-bl [data-bi="' + n.dataset.pi + '"]'); if (li) { li.classList.remove('hi'); void li.offsetWidth; li.classList.add('hi'); li.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } }); }); }
  /* the page's flow: page, the flows switched on, the island, the printer; a dot runs along it */
  function flow() { var pg = pageState(), nodes = ['PAGE'].concat(MODS.filter(function (m) { return pg.mods[m[0]]; }).map(function (m) { return m[1].split(' ')[0]; })).concat(['ISLAND', 'PRINTER']), n = nodes.length, w = 320, st = (w - 40) / (n - 1);
    $('.pg-flow svg').innerHTML = '<path class="fl" d="M20 30H' + (w - 20) + '"/>' + nodes.map(function (t, i) { var x = 20 + i * st; return '<g transform="translate(' + x + ' 30)"><circle r="' + (i === 0 || i === n - 1 ? 7 : 5) + '" class="' + (i === 0 ? 'a' : i === n - 1 ? 'z' : '') + '"/><text y="24">' + t + '</text></g>'; }).join('') +
      '<circle class="pk" r="3"><animateMotion dur="' + (1.2 + n * 0.35) + 's" repeatCount="indefinite" path="M20 30H' + (w - 20) + '"/></circle>'; }
  function testPrint(btn) { var u = slipURL(), say = function (s) { var o = $('#pg-pr span'); if (o) o.textContent = s; setTimeout(function () { if (o) o.textContent = 'TEST PRINT'; }, 2600); };
    if (!u) { say('MAKE A SLIP FIRST'); return; } if (!NG || !NG.printAgain) { say('NO PRINTER HERE'); return; } say('SENDING'); beep(700, 0.05);
    NG.printAgain(u, 'page').then(function (s) { say(String(s || 'SENT').toUpperCase()); beep(990, 0.08); }).catch(function (e) { say(e && e.status === 400 ? 'NO PRINTER ONLINE' : 'NOT SENT'); }); }
  function pickFiles(multi, then) { var fi = $('#fi'); fi.accept = 'image/*'; fi.multiple = !!multi; fi.onchange = function () { var fs = [].slice.call(fi.files || [], 0, 6); fi.value = ''; fi.multiple = false; Promise.all(fs.map(shrink)).then(then); }; fi.click(); }
  function shrink(f) { return new Promise(function (res) { var rd = new FileReader(); rd.onload = function () { var im = new Image(); im.onload = function () { var k = Math.min(1, 900 / Math.max(im.width, im.height)), c = D.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.78)); }; im.onerror = function () { res(''); }; im.src = rd.result; }; rd.readAsDataURL(f); }); }
  function pageClick(e) { var pg = pageState(), b;
    if ((b = e.target.closest('[data-th]'))) { pg.th = b.dataset.th; save(); page(); beep(660, 0.04); return; }
    if ((b = e.target.closest('[data-blk]'))) { var nb = { k: b.dataset.blk }; if (nb.k === 'receipt') { nb.t = 'PRINT MY SLIP'; nb.u = 'https://novel.global/'; } if (nb.k === 'qr') nb.u = 'https://novel.global/'; pg.b.push(nb); save(); page(); beep(880, 0.04); var l = $('.pg-bl li:last-child'); if (l) { l.classList.add('hi'); l.scrollIntoView({ block: 'nearest' }); } return; }
    if ((b = e.target.closest('[data-mod]'))) { var k = b.dataset.mod; pg.mods[k] = pg.mods[k] ? 0 : 1; save(); page(); beep(pg.mods[k] ? 990 : 440, 0.05); return; }
    if (e.target.closest('#pg-dl')) { var h = pageHTML(pg, false), meta = { flows: Object.keys(pg.mods).filter(function (m) { return pg.mods[m]; }), hook: pg.mods.hook ? pg.hook : '', repo: pg.mods.git ? pg.git : '', made: 'novel.global bench' };
      var doc = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + esc(((pg.b.filter(function (x) { return x.k === 'cover' || x.k === 'head'; })[0]) || {}).t || 'My island') + '</title><style>' + h.css + '</style><script type="application/json" id="island-flow">' + JSON.stringify(meta).replace(/</g, '\\u003c') + '</script></head><body>' + h.body + '</body></html>';
      dl(new Blob([doc], { type: 'text/html' }), 'my-island-page.html'); beep(1100, 0.06); return; }
    if (e.target.closest('#pg-pr')) { testPrint(); return; }
    var li = e.target.closest('[data-bi]'); if (!li) return; var i = +li.dataset.bi, bl = pg.b[i];
    if ((b = e.target.closest('[data-bmv]'))) { var j = i + +b.dataset.bmv; if (j < 0 || j >= pg.b.length) return; pg.b.splice(i, 1); pg.b.splice(j, 0, bl); save(); page(); return; }
    if (e.target.closest('[data-brm]')) { pg.b.splice(i, 1); save(); page(); beep(220, 0.06); return; }
    if (e.target.closest('[data-pic]')) { pickFiles(bl.k === 'gallery', function (us) { us = us.filter(Boolean); if (bl.k === 'cover') bl.src = us[0] || bl.src; else bl.srcs = us; save(); page(); }); return; }
    if (e.target.closest('[data-here]')) { if (!navigator.geolocation) return; navigator.geolocation.getCurrentPosition(function (r) { bl.lat = r.coords.latitude; bl.lng = r.coords.longitude; save(); page(); }, function () { /* none */ }, { timeout: 9000 }); }
  }
  var pT = 0; function pageInput(e) { var pg = pageState(), t = e.target; if (t.dataset.cfg) { pg[t.dataset.cfg] = t.value.slice(0, 200); save(); return; } var li = t.closest('[data-bi]'); if (!li || !t.dataset.bf) return; pg.b[+li.dataset.bi][t.dataset.bf] = t.value.slice(0, 600); save(); clearTimeout(pT); pT = setTimeout(pagePaint, 120); }
  function dl(blob, name) { var a = D.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; D.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000); }

  /* ───────── GAME: cartridges for a printer; one plays on the console here, a slip at a time ───────── */
  var CARTS = {
    fortune: { n: 'FORTUNE', th: 'coral', tip: 'A fortune on every press', ed: [['lines', 'One fortune to a line', 'A STRANGER BRINGS A SPARE PART\nTHE TIDE RETURNS WHAT IT TOOK\nFIX ONE THING TODAY\nSOMEONE NEEDS YOUR SPARE CHAIR']] },
    paths: { n: 'PATHS', th: 'print', tip: 'A story that branches: choose A or B, and the next part prints', ed: [['lines', 'words | A > part | B > part', 'You find a radio on the beach. | Turn it on > 2 | Leave it > 3\nIt plays a song from the far island. | Answer it > 4 | Keep walking > 3\nThe tide takes it. The end.\nThe far island answers back. The end.']] },
    hunt: { n: 'HUNT', th: 'cyan', tip: 'Clues hidden around a place; each found code prints the next', ed: [['lines', 'One clue to a line', 'WHERE THE BENCH FACES THE WATER\nUNDER THE THIRD TREE\nBEHIND THE COUNTER, ASK FOR THE MOON']] },
    dice: { n: 'DICE', th: 'dots', tip: 'Two players roll; the paper keeps score', ed: [['lines', 'Six faces, one to a line', 'REPAIR\nREUSE\nSHARE\nGROW\nRETURN\nRESIST']] },
    oracle: { n: 'ORACLE', th: 'lilac', tip: 'Eight answers, one for each phase of the moon', ed: [['lines', 'Eight lines, new moon to waning crescent', 'BEGIN QUIETLY\nGATHER WHAT YOU NEED\nASK FOR HELP\nKEEP GOING\nSHOW IT TO SOMEONE\nGIVE SOME AWAY\nMEND WHAT BROKE\nREST']] },
    pet: { n: 'PET', th: 'pink', tip: 'A pet that lives on paper and asks for things', ed: [['name', 'Its name', 'MOTH'], ['lines', 'What it asks for, one to a line', 'A STORY\nA SONG\nA WALK BY THE WATER\nSOMETHING YOU FIXED']] },
    bingo: { n: 'BINGO', th: 'cyan', tip: 'A card of 25 things to spot, different every print', ed: [['lines', 'Things to spot, one to a line', 'A BIRD\nA BROKEN CHAIR\nSOMEONE SINGING\nA BIKE\nA DOG\nGRAFFITI\nA SOLAR PANEL\nA TREE IN FLOWER\nRAIN\nA RADIO\nA HAT\nA SPARE PART\nA SHELL\nA SIGN\nA BOAT\nA GARDEN\nA FRIEND\nA CAT\nA KITE\nA TOOL\nA SEAT\nSMOKE\nA MAP\nA STAR']] }
  };
  var CART_ART = function (k) { var t = THEMES[CARTS[k].th]; return 'style="--a:' + t.bg + ';--b:' + t.ink + ';--p:' + t.pat + '"'; };
  function gameState() { if (!P.game) P.game = { cart: 'fortune', title: '', d: {}, be: 'pi', chk: {}, run: {} }; return P.game; }
  var gd = function (k, f) { var gs = gameState(), d = gs.d[k] || {}, e = CARTS[k].ed.filter(function (x) { return x[0] === f; })[0]; return d[f] ? d[f] : e ? e[2] : ''; };
  var gv = function (k, f) { return (gameState().d[k] || {})[f] || ''; };
  var lines = function (k) { return String(gd(k, 'lines')).split('\n').map(function (s) { return s.trim(); }).filter(Boolean); };
  var hash = function (s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
  var codeOf = function (s) { var A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', h = hash(s), o = ''; for (var i = 0; i < 4; i++) { o += A[h % A.length]; h = Math.floor(h / A.length) + 7 * i; } return o; };
  var BEST = [['wide', '80 mm paper: 512 dots across'], ['long', 'Under 457 mm a slip'], ['off', 'Works with no internet'], ['one', 'One press to play'], ['moon', 'Time as the moon, never dates'], ['yes', 'No names or faces without a yes'], ['t88', 'Tested on the TM-T88V'], ['open', 'An open licence']];
  var BACK = { pi: ['ON THE PI', 'Runs on the island’s own Raspberry Pi, next to the printer. Works offline.', ['PRESS', 'PI', 'ESC/POS', 'PRINTER']], worker: ['ON THE WEB', 'A Cloudflare Worker and D1, like novel.global. Plays from any phone.', ['PHONE', 'WORKER', 'ISLAND', 'PRINTER']], mesh: ['ON THE MESH', 'Slips travel by LoRa between islands, no internet at all.', ['ISLAND', 'LORA', 'ISLAND', 'PRINTER']] };
  var STARTERS = [['novelglobal/islandarchipelagos', 'This site, the engine and the island kit'], ['python-escpos/python-escpos', 'Print from Python'], ['song940/node-escpos', 'Print from Node'], ['mike42/escpos-php', 'Print from PHP'], ['receiptline/receiptline', 'Receipts written as text'], ['meshtastic/firmware', 'LoRa mesh radios'], ['RPi-Distro/pi-gen', 'Build a Raspberry Pi image'], ['cloudflare/workers-sdk', 'Workers, for the web side']];
  function game() { var gs = gameState(), el = $('#gm');
    if (!el.dataset.on) { el.dataset.on = 1;
      el.innerHTML = '<div class="gm-shelf" role="list">' + Object.keys(CARTS).map(function (k) { return '<button type="button" role="listitem" data-cart="' + k + '" title="' + CARTS[k].tip + '" ' + CART_ART(k) + '><i></i><b>' + CARTS[k].n + '</b></button>'; }).join('') + '</div>' +
        '<div class="gm-main"><div class="gm-con" title="The console: press PLAY to print a turn"><div class="gm-top"><i class="led l1"></i><i class="led l2"></i><i class="led l3"></i><b class="gm-lcd">READY</b></div><div class="gm-slot"><div class="gm-cart"></div></div><div class="gm-paper"><canvas id="gm-cv" width="512" height="10"></canvas></div>' +
        '<div class="gm-keys"><button type="button" data-g="a" title="Choose A">A</button><button type="button" data-g="play" class="pl" title="Play: print the next turn">' + I('<path d="M8 5l11 7-11 7z" class="f"/>') + '</button><button type="button" data-g="b" title="Choose B">B</button></div><div class="gm-in"><input id="gm-code" maxlength="4" placeholder="CODE" aria-label="A code you found" autocomplete="off"><button type="button" data-g="code" title="Check the code">OK</button></div>' +
        '<div class="gm-run"><button type="button" data-g="print" title="Print this turn on the real printer">' + I('<path d="M6 9V3h12v6"/><path d="M4 9h16v8H4z"/><path d="M7 14h10v7H7z"/>') + '</button><button type="button" data-g="again" title="Start the game again">' + I('<path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v5h5"/>') + '</button></div></div>' +
        '<div class="gm-ed"><input class="gm-title" data-gt placeholder="NAME YOUR GAME" title="Your game’s name"><div class="gm-fields"></div></div></div>' +
        '<div class="gm-dev"><nav class="gm-tabs">' + [['tree', 'STRUCTURE', 'How the cartridge is laid out'], ['back', 'BACKEND', 'Where the game runs'], ['best', 'CHECKS', 'Good practice for printer games'], ['git', 'STARTERS', 'Open projects to build from']].map(function (t, i) { return '<button type="button" data-tab="' + t[0] + '" title="' + t[2] + '" aria-pressed="' + !i + '">' + t[1] + '</button>'; }).join('') + '</nav><div class="gm-pane"></div>' +
        '<div class="gm-out"><button type="button" id="gm-dl" title="Download the cartridge as a file">' + I('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>') + '<span>CARTRIDGE</span></button><button type="button" data-go="card" title="Send this game to the front page as a card">' + MI('card') + '<span>MAKE IT A CARD</span></button></div></div>';
      el.addEventListener('click', gameClick); el.addEventListener('input', gameInput); }
    $$('[data-cart]', el).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.cart === gs.cart)); });
    var c = CARTS[gs.cart]; $('.gm-cart', el).setAttribute('style', CART_ART(gs.cart).slice(7, -1)); $('.gm-cart', el).textContent = c.n; $('.gm-title', el).value = gs.title || '';
    $('.gm-fields', el).innerHTML = c.ed.map(function (f) { return '<label><span>' + f[1] + '</span>' + (f[0] === 'lines' ? '<textarea data-gf="' + f[0] + '" rows="6">' + esc(gv(gs.cart, f[0])) + '</textarea>' : '<input data-gf="' + f[0] + '" value="' + esc(gv(gs.cart, f[0])) + '">') + '</label>'; }).join('');
    el.dataset.kind = gs.cart; $('.gm-in', el).hidden = gs.cart !== 'hunt'; $$('[data-g="a"],[data-g="b"]', el).forEach(function (b) { b.disabled = gs.cart !== 'paths' && gs.cart !== 'dice'; });
    devPane(); }
  function devPane() { var gs = gameState(), el = $('#gm'), tab = ($('.gm-tabs [aria-pressed="true"]', el) || {}).dataset; tab = tab ? tab.tab : 'tree'; var p = $('.gm-pane', el), id = (gs.title || CARTS[gs.cart].n).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'my-game';
    if (tab === 'tree') p.innerHTML = '<pre class="gm-tree">' + esc(id + '/\n├─ cart.json      what it is, its lines\n├─ play.js        one turn: state in, slip out\n├─ slips/         each slip as a picture\n├─ README.md      how to play, how to build\n└─ LICENSE        open, so others can build on it') + '</pre><pre class="gm-json">' + esc(JSON.stringify(cartJSON(), null, 1).slice(0, 900)) + '</pre>';
    if (tab === 'back') { var be = BACK[gs.be] || BACK.pi; p.innerHTML = '<div class="gm-be">' + Object.keys(BACK).map(function (k) { return '<button type="button" data-be="' + k + '" aria-pressed="' + (k === gs.be) + '" title="' + BACK[k][1] + '">' + BACK[k][0] + '</button>'; }).join('') + '</div><p class="gm-note">' + be[1] + '</p><svg class="gm-arch" viewBox="0 0 320 60" aria-hidden="true"><path d="M30 30H290"/>' + be[2].map(function (t, i) { var x = 30 + i * 86.7; return '<g transform="translate(' + x + ' 30)"><rect x="-26" y="-13" width="52" height="26" rx="5"/><text y="4">' + t + '</text></g>'; }).join('') + '<circle class="pk" r="3"><animateMotion dur="2.4s" repeatCount="indefinite" path="M30 30H290"/></circle></svg>'; }
    if (tab === 'best') p.innerHTML = '<ul class="gm-best">' + BEST.map(function (b) { return '<li><label><input type="checkbox" data-chk="' + b[0] + '"' + (gs.chk[b[0]] ? ' checked' : '') + '><span>' + b[1] + '</span></label></li>'; }).join('') + '</ul><div class="gm-meter"><i style="width:' + Math.round(BEST.filter(function (b) { return gs.chk[b[0]]; }).length / BEST.length * 100) + '%"></i></div>';
    if (tab === 'git') p.innerHTML = '<ul class="gm-git">' + STARTERS.map(function (s) { return '<li><a href="https://github.com/' + s[0] + '" target="_blank" rel="noopener" title="' + s[1] + '"><b>' + s[0] + '</b><span>' + s[1] + '</span></a></li>'; }).join('') + '</ul>'; }
  function cartJSON() { var gs = gameState(), c = CARTS[gs.cart], o = { format: 'cart/1', kind: gs.cart, name: gs.title || c.n, backend: gs.be, paper: 80 }; c.ed.forEach(function (f) { o[f[0]] = f[0] === 'lines' ? lines(gs.cart) : gd(gs.cart, f[0]); }); return o; }
  /* one turn of the game, drawn as the printer will print it */
  function turn(input) { var gs = gameState(), k = gs.cart, run = gs.run[k] || (gs.run[k] = {}), L = lines(k), ops = [], name = gs.title || CARTS[k].n;
    var R = function (n) { return Math.floor(Math.random() * n); };
    ops.push({ t: 'head', s: name });
    if (k === 'fortune') { ops.push({ t: 'big', s: L[R(L.length)] || '…' }); ops.push({ t: 'small', s: 'LUCKY NUMBER ' + (1 + R(88)) }); ops.push({ t: 'moon' }); }
    if (k === 'paths') { var parts = L.map(function (l) { var x = l.split('|').map(function (s) { return s.trim(); }); return { s: x[0], ch: x.slice(1).map(function (c) { var m = /(.*)>\s*(\d+)/.exec(c); return m ? { s: m[1].trim(), to: +m[2] } : null; }).filter(Boolean) }; });
      if (input === 'a' || input === 'b') { var cur = parts[(run.at || 1) - 1], ch = cur && cur.ch[input === 'a' ? 0 : 1]; if (!ch) return null; run.at = ch.to; } else if (input !== 'keep') run.at = 1;
      var pt = parts[(run.at || 1) - 1] || { s: 'THE END', ch: [] }; ops.push({ t: 'small', s: 'PART ' + (run.at || 1) }); ops.push({ t: 'text', s: pt.s }); pt.ch.forEach(function (c, i) { ops.push({ t: 'choice', s: (i ? 'B' : 'A') + '  ' + c.s }); }); if (!pt.ch.length) ops.push({ t: 'small', s: '— THE END —' }); }
    if (k === 'hunt') { if (input === 'code') { var want = codeOf(name + (run.at || 0)); if (String($('#gm-code').value || '').toUpperCase() !== want) return 'NOT THAT ONE'; run.at = (run.at || 0) + 1; $('#gm-code').value = ''; } else if (input !== 'keep') run.at = 0;
      var cl = L[run.at || 0]; if (cl == null) { ops.push({ t: 'big', s: 'ALL FOUND' }); ops.push({ t: 'moon' }); } else { ops.push({ t: 'small', s: 'CLUE ' + ((run.at || 0) + 1) + ' OF ' + L.length }); ops.push({ t: 'big', s: cl }); ops.push({ t: 'small', s: 'ITS CODE IS HIDDEN THERE: ' + codeOf(name + ((run.at || 0) + 1)) .replace(/./g, '□') }); ops.push({ t: 'tiny', s: 'TEST CODE ' + codeOf(name + ((run.at || 0) + 1)) }); } }
    if (k === 'dice') { var a1 = 1 + R(6), b1 = 1 + R(6); run.a = (run.a || 0) + (a1 > b1 ? 1 : 0); run.b = (run.b || 0) + (b1 > a1 ? 1 : 0); ops.push({ t: 'dice', a: a1, b: b1 }); ops.push({ t: 'text', s: 'A: ' + (L[a1 - 1] || a1) + '   B: ' + (L[b1 - 1] || b1) }); ops.push({ t: 'big', s: a1 === b1 ? 'A DRAW' : (a1 > b1 ? 'A' : 'B') + ' TAKES IT' }); ops.push({ t: 'small', s: 'SCORE  A ' + run.a + ' · B ' + run.b }); }
    if (k === 'oracle') { var f = moonF(), ph = Math.floor(((f * 8) + 0.5) % 8); ops.push({ t: 'moon' }); ops.push({ t: 'big', s: L[ph] || '…' }); }
    if (k === 'pet') { run.n = (run.n || 0) + 1; var mood = ['HAPPY', 'SLEEPY', 'HUNGRY', 'CURIOUS'][R(4)]; ops.push({ t: 'pet', mood: mood }); ops.push({ t: 'big', s: String(gd(k, 'name') || 'MOTH').toUpperCase() + ' IS ' + mood }); ops.push({ t: 'text', s: 'BRING IT ' + (L[R(L.length)] || 'A STORY') }); ops.push({ t: 'small', s: 'VISIT ' + run.n }); }
    if (k === 'bingo') { var pool = L.slice(); for (var i = pool.length - 1; i > 0; i--) { var j = R(i + 1), tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp; } var cells = pool.slice(0, 24); cells.splice(12, 0, '☾'); ops.push({ t: 'grid', c: cells }); }
    ops.push({ t: 'code', s: codeOf(name + Date.now()) }); return ops; }
  function slipDraw(ops) { var W = 512, Pd = 24, iw = W - Pd * 2, cv = $('#gm-cv'), tmp = D.createElement('canvas').getContext('2d'), y = 24, todo = [];
    var wrapT = function (s, font, mw) { tmp.font = font; var out = []; String(s).split('\n').forEach(function (ln) { var w = ln.split(' '), cur = ''; w.forEach(function (x) { var tr = cur ? cur + ' ' + x : x; if (tmp.measureText(tr).width > mw && cur) { out.push(cur); cur = x; } else cur = tr; }); out.push(cur); }); return out; };
    var add = function (h, fn) { todo.push([y, fn]); y += h; };
    ops.forEach(function (o) { var f, L;
      if (o.t === 'head') { f = '500 20px "IBM Plex Mono", monospace'; add(44, function (c, y0) { c.fillRect(Pd, y0, iw, 30); c.fillStyle = '#fff'; c.font = f; c.fillText(String(o.s).toUpperCase().slice(0, 34), Pd + 10, y0 + 21); c.fillStyle = '#0B0B0B'; }); }
      if (o.t === 'big') { f = '700 44px Poppins, Arial'; L = wrapT(o.s, f, iw); add(L.length * 46 + 14, function (c, y0) { c.font = f; L.forEach(function (l, j) { c.fillText(l, Pd, y0 + 40 + j * 46); }); }); }
      if (o.t === 'text' || o.t === 'choice') { f = '500 24px "IBM Plex Mono", monospace'; L = wrapT(o.s, f, iw - (o.t === 'choice' ? 20 : 0)); add(L.length * 30 + (o.t === 'choice' ? 22 : 12), function (c, y0) { c.font = f; if (o.t === 'choice') { c.lineWidth = 2; c.strokeRect(Pd, y0 + 2, iw, L.length * 30 + 12); } L.forEach(function (l, j) { c.fillText(l, Pd + (o.t === 'choice' ? 10 : 0), y0 + 28 + j * 30); }); }); }
      if (o.t === 'small' || o.t === 'tiny') { f = (o.t === 'tiny' ? '500 14px' : '500 18px') + ' "IBM Plex Mono", monospace'; add(o.t === 'tiny' ? 22 : 30, function (c, y0) { c.font = f; c.fillText(o.s, Pd, y0 + 20); }); }
      if (o.t === 'moon') add(100, function (c, y0) { moonAt(c, Pd + 44, y0 + 46, 42); });
      if (o.t === 'code') add(46, function (c, y0) { c.fillRect(Pd, y0 + 8, iw, 2); c.font = '500 16px "IBM Plex Mono", monospace'; c.fillText(o.s, W - Pd - 52, y0 + 34); moonAt(c, Pd + 12, y0 + 28, 10); });
      if (o.t === 'dice') add(150, function (c, y0) { [o.a, o.b].forEach(function (n, k) { var x = Pd + 40 + k * 230, s = 110; c.lineWidth = 5; c.strokeRect(x, y0 + 10, s, s); c.font = '700 22px Poppins, Arial'; c.fillText(k ? 'B' : 'A', x - 34, y0 + 30);
        var P6 = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] }[n]; P6.forEach(function (p) { c.beginPath(); c.arc(x + 25 + p[0] * 30, y0 + 35 + p[1] * 30, 9, 0, 7); c.fill(); }); }); });
      if (o.t === 'pet') add(170, function (c, y0) { var px = 10, m = ['....XXXX....', '..XX....XX..', '.X..X..X..X.', 'X..........X', 'X..X....X..X', 'X...XXXX...X', '.X........X.', '..XX....XX..', '.X..XXXX..X.', 'X..........X'];
        if (o.mood === 'SLEEPY') m[2] = '.X........X.', m[4] = 'X.XX....XX.X'; if (o.mood === 'HUNGRY') m[5] = 'X...X..X...X'; m.forEach(function (r, j) { for (var i = 0; i < r.length; i++) if (r[i] === 'X') c.fillRect(W / 2 - 60 + i * px, y0 + 10 + j * px * 1.4, px, px * 1.4); }); });
      if (o.t === 'grid') { var cs = (iw) / 5; add(cs * 5 + 16, function (c, y0) { c.lineWidth = 2; for (var r = 0; r < 5; r++) for (var q = 0; q < 5; q++) { var x = Pd + q * cs, yy = y0 + r * cs; c.strokeRect(x, yy, cs, cs); var tx = o.c[r * 5 + q] || ''; c.font = (tx === '☾' ? '700 40px Poppins' : '500 13px "IBM Plex Mono", monospace');
        wrapT(tx, c.font, cs - 10).slice(0, 4).forEach(function (l, j, a) { c.fillText(l, x + 6, yy + cs / 2 - (a.length - 1) * 8 + j * 16 + 5); }); } }); }
    });
    var Ht = Math.min(3656, y + 20); cv.width = W; cv.height = Ht; var c = cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, W, Ht); c.fillStyle = '#0B0B0B'; c.strokeStyle = '#0B0B0B'; c.textBaseline = 'alphabetic'; todo.forEach(function (t) { t[1](c, t[0]); }); return cv; }
  /* the paper feeds out of the slot, a line at a time, ticking */
  var feedT = 0; function feed() { var pp = $('#gm .gm-paper'), cv = $('#gm-cv'), lcd = $('#gm .gm-lcd'), sh = Math.round(cv.height * (pp.clientWidth / 512)), t0 = performance.now(), dur = Math.min(2600, 500 + sh * 3);
    cancelAnimationFrame(feedT); $('#gm').classList.add('busy'); lcd.textContent = 'PRINTING';
    (function step(now) { var k = Math.min(1, (now - t0) / dur); pp.style.height = Math.round(sh * k) + 'px'; if (Math.random() < 0.5) beep(1800 + Math.random() * 400, 0.012); if (k < 1) feedT = requestAnimationFrame(step); else { $('#gm').classList.remove('busy'); lcd.textContent = 'READY'; beep(660, 0.05); beep(990, 0.08); } })(t0); }
  function gameClick(e) { var gs = gameState(), b;
    if ((b = e.target.closest('[data-cart]'))) { if (gs.cart === b.dataset.cart) return; gs.cart = b.dataset.cart; save(); var s = $('#gm .gm-slot'); s.classList.remove('in'); void s.offsetWidth; s.classList.add('in'); game(); beep(330, 0.05); setTimeout(function () { beep(495, 0.07); }, 160); $('#gm .gm-paper').style.height = '0px'; return; }
    if ((b = e.target.closest('[data-tab]'))) { $$('#gm .gm-tabs [data-tab]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); devPane(); beep(600, 0.03); return; }
    if ((b = e.target.closest('[data-be]'))) { gs.be = b.dataset.be; save(); devPane(); beep(740, 0.04); return; }
    if (e.target.closest('#gm-dl')) { dl(new Blob([JSON.stringify(cartJSON(), null, 2)], { type: 'application/json' }), 'cart.json'); beep(1100, 0.06); return; }
    if ((b = e.target.closest('[data-g]'))) { var g = b.dataset.g, lcd = $('#gm .gm-lcd');
      if (g === 'print') { var cv = $('#gm-cv'); if (cv.height < 20) { lcd.textContent = 'PLAY FIRST'; return; } if (!NG || !NG.printAgain) { lcd.textContent = 'NO PRINTER'; return; } lcd.textContent = 'SENDING'; NG.printAgain(cv.toDataURL('image/png'), 'game').then(function (s) { lcd.textContent = String(s || 'SENT').toUpperCase().slice(0, 12); }).catch(function (er) { lcd.textContent = er && er.status === 400 ? 'NO PRINTER' : 'NOT SENT'; }); return; }
      if (g === 'again') { gs.run[gs.cart] = {}; save(); $('#gm .gm-paper').style.height = '0px'; lcd.textContent = 'READY'; beep(300, 0.08); return; }
      var ops = turn(g === 'play' ? (gs.cart === 'paths' || gs.cart === 'hunt' ? 'keep' : 'play') : g); save();
      if (ops === null) { lcd.textContent = 'NO CHOICE'; beep(200, 0.1); return; } if (typeof ops === 'string') { lcd.textContent = ops; beep(200, 0.12); return; }
      slipDraw(ops); feed(); }
  }
  function gameInput(e) { var gs = gameState(), t = e.target; if (t.hasAttribute('data-gt')) { gs.title = t.value.slice(0, 40); save(); return; } if (t.dataset.chk) { gs.chk[t.dataset.chk] = t.checked ? 1 : 0; save(); devPane(); return; } if (t.dataset.gf) { (gs.d[gs.cart] = gs.d[gs.cart] || {})[t.dataset.gf] = t.value.slice(0, 2000); save(); } }

  /* ───────── CARD: what you made, as a card on the front page; sent to the archipelagos' SHOW room, where novel.global picks it up ───────── */
  function card() { var cd = P.card, el = $('#cd'); cd.what = cd.what || (P.game ? 'game' : P.page ? 'page' : 'slip'); cd.th = cd.th || 'print';
    if (!el.dataset.on) { el.dataset.on = 1;
      el.innerHTML = '<div class="cd-pick">' + [['slip', 'YOUR SLIP', 'The receipt from SLIP'], ['page', 'YOUR PAGE', 'The phone page from PAGE'], ['game', 'YOUR GAME', 'The game from GAME']].map(function (w) { return '<button type="button" data-what="' + w[0] + '" title="' + w[2] + '">' + MODES.filter(function (m) { return m[0] === w[0]; })[0][3] + '<span>' + w[1] + '</span></button>'; }).join('') + '</div>' +
        '<div class="cd-main"><article class="cd-card" aria-label="How the card will look"><div class="cd-art"></div><b class="cd-new">NEW</b><h2 class="cd-t"></h2><p class="cd-l"></p><i class="cd-shine" aria-hidden="true"></i></article>' +
        '<div class="cd-form"><label><span>NAME</span><input data-cf="name" maxlength="28"></label><label><span>ONE LINE</span><input data-cf="line" maxlength="60"></label>' +
        '<div class="cd-th">' + swatches(cd.th, 'data-cth') + '</div>' + frameRow() + '<button type="button" id="cd-send" title="Send it to novel.global to go on the front page">' + MI('card') + '<span>SEND TO THE FRONT PAGE</span></button><p class="cd-say" aria-live="polite"></p></div></div>';
      el.addEventListener('click', cardClick); el.addEventListener('input', function (e) { var f = e.target.dataset.cf; if (!f) return; cd[f] = e.target.value; save(); cardPaint(); });
      $('.cd-card', el).addEventListener('pointermove', function (e) { var r = this.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; this.style.transform = 'perspective(700px) rotateY(' + (x * 14) + 'deg) rotateX(' + (-y * 14) + 'deg)'; this.style.setProperty('--sx', (x + 0.5) * 100 + '%'); this.style.setProperty('--sy', (y + 0.5) * 100 + '%'); });
      $('.cd-card', el).addEventListener('pointerleave', function () { this.style.transform = ''; }); }
    $$('[data-cf]', el).forEach(function (i) { if (D.activeElement !== i) i.value = cd[i.dataset.cf] || ''; }); cardPaint(); }
  function cardPaint() { var cd = P.card, el = $('#cd'), t = THEMES[cd.th] || THEMES.print, k = $('.cd-card', el), def = { slip: 'MY SLIP', page: 'MY PAGE', game: (P.game && P.game.title) || 'MY GAME' }[cd.what];
    $$('[data-what]', el).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.what === cd.what)); }); $$('[data-cth]', el).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.cth === cd.th)); });
    k.style.setProperty('--a', t.bg); k.style.setProperty('--b', t.ink); k.style.setProperty('--p', t.pat); $('.cd-t', el).textContent = (cd.name || def).toUpperCase(); $('.cd-l', el).textContent = cd.line || '';
    var u = cd.what === 'slip' ? slipURL() : ''; $('.cd-art', el).innerHTML = u ? '<img alt="" src="' + u + '">' : cd.what === 'game' ? '<b class="cd-cart">' + (CARTS[(P.game || {}).cart || 'fortune'] || CARTS.fortune).n + '</b>' : '<i class="cd-ph"></i>'; }
  /* ───────── the code a print gave: what puts a thing up. Asked for when the site wants it; a pass from a printer's slip makes this phone's code a printed one ───────── */
  function whoNow() { try { if (NG && NG.me) return NG.me(); } catch (e) { /* away */ } try { var c = JSON.parse(localStorage.getItem('da.who') || '""'); return /^[A-HJ-NP-Z2-9]{3}$/.test(c) ? c : ''; } catch (e) { return ''; } }
  function codeAsk(host, again) {
    var box = host.querySelector('.ng-code'); if (!box) { box = D.createElement('div'); box.className = 'ng-code'; host.appendChild(box); }
    box.hidden = false; box.innerHTML = '<b title="Put things up with a code from a print: the three on any slip, or a pass a printer left">CODE</b><input maxlength="7" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABC or ABC-DEF" aria-label="The code from a print"><button type="button" title="Use it">OK</button><span aria-live="polite"></span>';
    var inp = box.querySelector('input'), sp = box.querySelector('span'), done = function () { box.hidden = true; again(); };
    var go = function () { var v = inp.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (/^[A-HJKMNP-TV-Z]{6}$/.test(v)) { var w = whoNow(); if (!w) { sp.textContent = '×'; return; } sp.textContent = '···';
        fetch('/api/maker', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ who: w, pass: v.slice(0, 3) + '-' + v.slice(3) }) })
          .then(function (r) { if (r.status === 201) done(); else { sp.textContent = r.status === 409 ? 'USED' : r.status === 404 ? 'UNKNOWN' : r.status === 429 ? 'WAIT' : '×'; sp.title = r.status === 409 ? 'This pass was used already' : r.status === 404 ? 'Not a pass from today' : ''; } }, function () { sp.textContent = 'OFFLINE'; }); return; }
      if (/^[A-HJ-NP-Z2-9]{3}$/.test(v)) { sp.textContent = '···';
        var p = NG && NG.useCode ? NG.useCode(v) : (function () { try { localStorage.setItem('da.who', JSON.stringify(v)); localStorage.setItem('da.who.at', JSON.stringify(Date.now())); } catch (e) { /* this visit */ } return Promise.resolve(true); })();
        p.then(done, function () { sp.textContent = '×'; }); return; }
      sp.textContent = '×'; sp.title = 'Three from a print, or six from a pass'; };
    box.querySelector('button').onclick = go; inp.onkeydown = function (e) { if (e.key === 'Enter') go(); }; inp.focus(); }
  /* after something goes up: a way back to its maker, if they like. Only the owner sees it */
  var LINKS = [['mesh', 'MESH', 'A mesh node or name'], ['email', 'EMAIL', 'An email address'], ['mobile', 'MOBILE', 'A mobile number'], ['steam', 'STEAM', 'A Steam name or profile']];
  function linkAsk(host) {
    var cb = host.querySelector('.ng-code'); if (cb) cb.hidden = true;
    var box = host.querySelector('.ng-link'); if (!box) { box = D.createElement('div'); box.className = 'ng-link'; host.appendChild(box); }
    box.hidden = false; box.innerHTML = '<b title="Link your code to a way back to you, if you like. Only the owner sees it">LINK</b>' + LINKS.map(function (l) { return '<button type="button" data-lk="' + l[0] + '" title="' + l[2] + '">' + l[1] + '</button>'; }).join('') + '<input hidden maxlength="80" autocomplete="off" spellcheck="false"><button type="button" data-lok hidden title="Link it">OK</button><span aria-live="polite"></span>';
    var inp = box.querySelector('input'), ok = box.querySelector('[data-lok]'), sp = box.querySelector('span'), k = '';
    box.onclick = function (e) { var b = e.target.closest('[data-lk]'); if (b) { k = b.dataset.lk; $$('[data-lk]', box).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); inp.hidden = ok.hidden = false; inp.placeholder = b.title.toUpperCase(); inp.type = k === 'email' ? 'email' : k === 'mobile' ? 'tel' : 'text'; inp.value = ''; inp.focus(); sp.textContent = ''; return; }
      if (!e.target.closest('[data-lok]') || !k) return; var w = whoNow(); sp.textContent = '···';
      fetch('/api/link', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ who: w, k: k, v: inp.value.trim() }) })
        .then(function (r) { sp.textContent = r.status === 201 ? 'LINKED' : r.status === 400 ? 'CHECK IT' : r.status === 401 ? 'CODE' : '×'; }, function () { sp.textContent = 'OFFLINE'; }); };
    inp.onkeydown = function (e) { if (e.key === 'Enter') ok.click(); }; }
  function cardClick(e) { var cd = P.card, b;
    if ((b = e.target.closest('[data-what]'))) { cd.what = b.dataset.what; save(); cardPaint(); beep(560, 0.04); return; }
    if ((b = e.target.closest('[data-cth]'))) { cd.th = b.dataset.cth; save(); cardPaint(); beep(660, 0.04); return; }
    if (!e.target.closest('#cd-send')) return; var say = $('#cd .cd-say'), btn = $('#cd-send'), name = (cd.name || '').trim().toUpperCase();
    if (!name) { say.textContent = 'GIVE IT A NAME FIRST'; $('#cd [data-cf="name"]').focus(); return; }
    var who = whoNow();
    var at = ($('#to') && $('#to').value) || 'novelglobal', kind = cd.what === 'game' ? 'GAME ' + ((CARTS[(P.game || {}).cart] || {}).n || '') : cd.what.toUpperCase();
    var text = ('NEW CARD · ' + name + ' · ' + kind + ' · ' + (THEMES[cd.th] || {}).n + ' · FROM ' + at.toUpperCase() + (cd.line ? ' · ' + cd.line : '')).slice(0, 280);
    if (!who) { say.textContent = 'CODE'; codeAsk($('#cd'), function () { $('#cd-send').click(); }); return; } btn.disabled = true; say.textContent = 'SENDING'; beep(700, 0.05);
    (NG.human ? NG.human() : Promise.resolve('')).then(function (cf) { return fetch('/api/talk', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ s: 'c.space.show', who: who, text: text, cf: cf }) }); })
      .then(function (r) { btn.disabled = false; if (r.status !== 201) { say.textContent = r.status === 429 ? 'SLOW DOWN A LITTLE' : r.status === 401 ? 'CODE' : 'NOT SENT'; if (r.status === 401) codeAsk($('#cd'), function () { $('#cd-send').click(); }); return; } say.textContent = 'SENT'; say.title = 'It goes up once it is checked'; linkAsk($('#cd')); confetti(); beep(880, 0.06); setTimeout(function () { beep(1320, 0.1); }, 120); })
      .catch(function () { btn.disabled = false; say.textContent = 'OFFLINE. TRY AGAIN SOON'; }); }
  /* sent: torn paper bits fly out of the card */
  function confetti() { var k = $('#cd .cd-card'), r = k.getBoundingClientRect(); for (var i = 0; i < 26; i++) { var s = D.createElement('i'); s.className = 'bit'; var a = Math.random() * Math.PI * 2, d = 80 + Math.random() * 180;
    s.style.cssText = 'left:' + (r.left + r.width / 2) + 'px;top:' + (r.top + r.height / 2) + 'px;--x:' + Math.cos(a) * d + 'px;--y:' + (Math.sin(a) * d - 60) + 'px;--r:' + (Math.random() * 540 - 270) + 'deg;background:' + ['#F4F1E8', '#FF5436', '#F4C542', '#1EA0E0', '#C9C1F7', '#F2B6C6'][i % 6];
    D.body.appendChild(s); setTimeout(function (n) { n.remove(); }.bind(null, s), 1300); } }
  D.addEventListener('click', function (e) { var g = e.target.closest('[data-go]'); if (g) { var cd = P.card; cd.what = P.m === 'page' ? 'page' : P.m === 'game' ? 'game' : cd.what; mode(g.dataset.go); } });


  /* ───────── LIVE ───────── */
  var LV = null;
  function liveState() { if (!P.live) P.live = { src: '', th: 'print', n: '', keep: {} }; return P.live; }
  function live() { var ls = liveState(), el = $('#lv');
    if (!el.dataset.on) { el.dataset.on = 1;
      var B = function (id, tip, path, cls) { return '<button type="button" id="' + id + '" title="' + tip + '"' + (cls ? ' class="' + cls + '"' : '') + '>' + I(path) + '</button>'; };
      el.innerHTML = '<div class="lv-ed"><div class="lv-bar">' +
        B('lv-ai', 'Copy the brief', '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>', 'ai') +
        B('lv-paste', 'Paste code', '<path d="M8 4h8v3H8z"/><path d="M6 5.5H4.5v15h15v-15H18"/>') +
        B('lv-run', 'Run again', '<path d="M8 5l11 7-11 7z" class="f"/>') +
        B('lv-clr', 'Clear', '<path d="M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13"/>') +
        '<i class="lv-sp"></i>' +
        B('lv-pr', 'Print its paper', '<path d="M6 9V3h12v6"/><path d="M4 9h16v8H4z"/><path d="M7 14h10v7H7z"/>') +
        B('lv-up', 'Make it a small card', '<path d="M5 3h14v18H5z"/><path d="M12 16V8M8.5 11.5L12 8l3.5 3.5"/>', 'up') + '</div>' +
        '<textarea id="lv-src" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" aria-label="Code"></textarea><p class="lv-err" aria-live="polite"></p>' +
        '<div class="lv-pub" hidden><input data-ln maxlength="24" aria-label="Name" placeholder="NAME"><div class="lv-th">' + swatches(ls.th, 'data-lth') + '</div>' + frameRow() + '<button type="button" id="lv-send" title="Put it up">' + I('<path d="M4 12l16-8-6 16-3-7z"/>') + '</button><p class="lv-say" aria-live="polite"></p></div></div>' +
        '<div class="lv-dev"><div id="lv-kit"></div></div>';
      LV = PK.mount($('#lv-kit'), { keep: function (k, v) { try { ls.keep[k] = JSON.parse(v); save(); } catch (e) { /* skipped */ } }, err: function (s) { $('#lv .lv-err').textContent = s; }, ink: function () { beep(1400 + Math.random() * 300, 0.012); } });
      var ta = $('#lv-src'), t0 = 0; ta.value = ls.src;
      ta.addEventListener('input', function () { ls.src = ta.value.slice(0, 40000); save(); el.classList.toggle('empty', !ls.src.trim()); clearTimeout(t0); t0 = setTimeout(liveRun, 900); });
      ta.addEventListener('keydown', function (e) { if (e.key === 'Tab') { e.preventDefault(); var a = ta.selectionStart; ta.setRangeText('  ', a, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input')); } if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') liveRun(); });
      el.addEventListener('click', liveClick); el.addEventListener('input', function (e) { if (e.target.hasAttribute('data-ln')) { ls.n = e.target.value; save(); } }); }
    el.classList.toggle('empty', !ls.src.trim()); $('[data-ln]', el).value = ls.n || ''; $$('[data-lth]', el).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lth === ls.th)); }); liveRun(); }
  function liveRun() { var ls = liveState(); if (LV) LV.run(ls.src, ls.th, ls.keep); }
  function flash(id, ok) { var b = $('#' + id); if (!b) return; b.classList.remove('ok', 'no'); void b.offsetWidth; b.classList.add(ok ? 'ok' : 'no'); setTimeout(function () { b.classList.remove('ok', 'no'); }, 1200); }
  var unfence = function (t) { t = String(t || ''); var m = /```[a-zA-Z]*\n([\s\S]*?)```/.exec(t); return m ? m[1] : t; };
  function liveClick(e) { var ls = liveState(), b, ta = $('#lv-src');
    if (e.target.closest('#lv-ai')) { var t = PK.BRIEF + (ls.src.trim() ? '\n\nChange this:\n' + ls.src : ''); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { flash('lv-ai', 1); beep(990, 0.05); }, function () { ta.value = t; ta.select(); flash('lv-ai', 0); }); return; }
    if (e.target.closest('#lv-paste')) { (navigator.clipboard && navigator.clipboard.readText ? navigator.clipboard.readText() : Promise.reject()).then(function (t) { t = unfence(t); if (!t.trim()) return; ta.value = t; ta.dispatchEvent(new Event('input')); liveRun(); flash('lv-paste', 1); }, function () { ta.focus(); flash('lv-paste', 0); }); return; }
    if (e.target.closest('#lv-run')) { ls.keep = {}; save(); liveRun(); beep(520, 0.05); return; }
    if (e.target.closest('#lv-clr')) { if (ls.src.trim() && !confirm('Clear it?')) return; ta.value = ''; ls.keep = {}; ta.dispatchEvent(new Event('input')); liveRun(); return; }
    if (e.target.closest('#lv-pr')) { var u = LV && LV.paper(); if (!u || !NG || !NG.printAgain) { flash('lv-pr', 0); return; } NG.printAgain(u, 'play').then(function () { flash('lv-pr', 1); beep(880, 0.06); }, function () { flash('lv-pr', 0); }); return; }
    if (e.target.closest('#lv-up')) { var pb = $('#lv .lv-pub'); pb.hidden = !pb.hidden; if (!pb.hidden) $('[data-ln]', pb).focus(); return; }
    if ((b = e.target.closest('[data-lth]'))) { ls.th = b.dataset.lth; save(); $$('[data-lth]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); liveRun(); beep(660, 0.04); return; }
    if (e.target.closest('#lv-send')) { var say = $('#lv .lv-say'), n = String(ls.n || '').trim(), who = whoNow(), pub = $('#lv .lv-pub'), again = function () { $('#lv-send').click(); };
      if (!n) { $('#lv [data-ln]').focus(); flash('lv-send', 0); return; } if (!ls.src.trim()) { ta.focus(); flash('lv-send', 0); return; } if (!who) { say.textContent = 'CODE'; codeAsk(pub, again); return; }
      say.textContent = '···'; fetch('/api/plays', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ who: who, n: n, th: ls.th, fr: P.fr || 'none', src: ls.src }) })
        .then(function (r) { if (r.status !== 201) { say.textContent = r.status === 429 ? 'SLOW DOWN' : r.status === 401 ? 'CODE' : 'NOT SENT'; say.title = r.status === 401 ? 'A code from a print puts it up' : ''; if (r.status === 401) codeAsk(pub, again); flash('lv-send', 0); return; }
          r.json().then(function (j) { say.textContent = j.shown ? 'UP · ' + j.code : 'WAITING · ' + j.code; say.title = j.shown ? 'On novel.global now, as a small card' : 'Waiting for approval'; }, function () { say.textContent = 'SENT'; }); linkAsk(pub); flash('lv-send', 1); beep(880, 0.06); setTimeout(function () { beep(1320, 0.1); }, 120); })
        .catch(function () { say.textContent = 'OFFLINE'; flash('lv-send', 0); }); } }

  /* ───────── SET: the front page's set-up, switched in one press, and its card frames ───────── */
  var HOME = function () { try { return window.parent !== window ? window.parent.HOME : null; } catch (e) { return null; } };
  var SETS = [
    ['full', 'EVERYTHING', 'Every card joined', [['radio', 'wish'], ['wish', 'research'], ['wish', 'zine'], ['zine', 'space'], ['kit', 'space'], ['portfolio', 'research']]],
    ['radio', 'RADIO', 'Songs onto slips and into the portfolio', [['radio', 'wish'], ['radio', 'portfolio']]],
    ['shop', 'PRINT SHOP', 'Words and pictures into the zine, framed here', [['wish', 'zine'], ['zine', 'space'], ['portfolio', 'research']]],
    ['build', 'ISLAND BUILD', 'The kit list and the zine into the builder', [['kit', 'space'], ['zine', 'space'], ['radio', 'wish']]],
    ['bare', 'BARE', 'Nothing joined', []]];
  var FRAMES = [['none', 'NONE'], ['dots', 'DOTS'], ['steps', 'LILAC'], ['stripe', 'CYAN'], ['coral', 'CORAL'], ['lunch', 'PINK'], ['print', 'BLUEPRINT']];
  var frameRow = function () { return '<div class="bf-row" role="group" aria-label="Frame">' + FRAMES.map(function (f) { return '<button type="button" data-bfr="' + f[0] + '" class="fr-' + f[0] + '" title="' + f[1].toLowerCase() + ' frame" aria-pressed="' + (f[0] === (P.fr || 'none')) + '"><i></i></button>'; }).join('') + '</div>'; };
  var frameSet = function (f) { P.fr = f; save(); FRAMES.forEach(function (x) { H.classList.toggle('bf-' + x[0], x[0] === f); }); $$('[data-bfr]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.bfr === f)); }); };
  D.addEventListener('click', function (e) { var b = e.target.closest('[data-bfr]'); if (b) { frameSet(b.dataset.bfr); beep(560, 0.04); } });
  frameSet(P.fr || 'none');
  var NAMES = { radio: 'RADIO', wish: 'STRATEGY', research: 'RESEARCH', zine: 'PRINT', kit: 'ISLAND', space: 'BUILDER', portfolio: 'STORIES', reef: 'REEF', eye: 'EYE' };
  var same = function (a, b) { var k = function (l) { return l.map(function (w) { return w.slice().sort().join('-'); }).sort().join(); }; return k(a) === k(b); };
  function setup() { var el = $('#st'), h = HOME(), w = h ? h.wires() : [];
    if (!el.dataset.on) { el.dataset.on = 1; el.addEventListener('click', setClick); }
    el.innerHTML = '<div class="st-sets">' + SETS.map(function (q) { return '<button type="button" data-set="' + q[0] + '" title="' + q[2] + '" aria-pressed="' + same(w, q[3]) + '"><svg viewBox="0 0 60 36" aria-hidden="true">' + net(q[3]) + '</svg><span>' + q[1] + '</span></button>'; }).join('') + '</div>' +
      '<ul class="st-w">' + (w.length ? w.map(function (x, i) { return '<li><b>' + esc(NAMES[x[0]] || x[0]) + '</b><i></i><b>' + esc(NAMES[x[1]] || x[1]) + '</b><button type="button" data-cut="' + i + '" title="Unplug">×</button></li>'; }).join('') : '<li class="none">·</li>') + '</ul>' +
      (h ? '' : '<p class="st-say">OPEN THIS FROM NOVEL.GLOBAL</p>'); }
  var SPOT = { radio: [8, 8], wish: [30, 6], research: [52, 8], zine: [52, 28], kit: [8, 28], space: [30, 30], portfolio: [30, 18] };
  function net(l) { var o = ''; l.forEach(function (w) { var a = SPOT[w[0]], b = SPOT[w[1]]; if (a && b) o += '<path d="M' + a + 'L' + b + '"/>'; }); Object.keys(SPOT).forEach(function (k) { var on = l.some(function (w) { return w[0] === k || w[1] === k; }); o += '<circle cx="' + SPOT[k][0] + '" cy="' + SPOT[k][1] + '" r="3"' + (on ? ' class="f"' : '') + '/>'; }); return o; }
  function setClick(e) { var b, h = HOME(); if (!h) return;
    if ((b = e.target.closest('[data-set]'))) { var q = SETS.filter(function (x) { return x[0] === b.dataset.set; })[0]; parent.postMessage({ hm: 'wires', w: q[3] }, location.origin); q[3].forEach(function (x, i) { setTimeout(function () { beep(440 + i * 110, 0.05); }, i * 70); }); setTimeout(setup, 120); return; }
    if ((b = e.target.closest('[data-cut]'))) { var w = h.wires(); w.splice(+b.dataset.cut, 1); parent.postMessage({ hm: 'wires', w: w }, location.origin); beep(220, 0.06); setTimeout(setup, 120); return; }
  }

  /* one tip for each bench's main thing, the first time it is opened here, and never again */
  var COACH = { slip: ['#paper', 'tap a part of the slip to change it'], page: ['#pg-scr', 'your page, live as you build it'], game: ['.gm-con', 'press play and it prints a turn'], live: ['#lv-ai', 'copy the brief, paste code, it runs'], card: ['#cd-send', 'send it up to the front page'], set: ['.st-sets', 'one press rewires the front page'] };
  function coach(m) { var seen = {}; try { seen = JSON.parse(localStorage.getItem('da.bench.tips') || '{}') || {}; } catch (e) { seen = {}; } if (seen[m] || !COACH[m] || navigator.webdriver) return;
    setTimeout(function () { if (P.m !== m) return; var t = $(COACH[m][0]); if (!t || !t.getBoundingClientRect().width) return; seen[m] = 1; try { localStorage.setItem('da.bench.tips', JSON.stringify(seen)); } catch (e) { /* this visit */ }
      var r = t.getBoundingClientRect(), c = D.createElement('div'); c.className = 'coach'; c.setAttribute('role', 'status'); c.textContent = COACH[m][1]; D.body.appendChild(c);
      var top = r.bottom + 10 + c.offsetHeight > innerHeight ? r.top - c.offsetHeight - 10 : r.bottom + 10; c.style.top = Math.max(8, top) + 'px'; c.style.left = Math.max(8, Math.min(innerWidth - c.offsetWidth - 8, r.left + r.width / 2 - c.offsetWidth / 2)) + 'px'; c.classList.toggle('up', top < r.top);
      t.classList.add('coached'); var go = function () { c.classList.remove('on'); t.classList.remove('coached'); setTimeout(function () { c.remove(); }, 300); D.removeEventListener('pointerdown', go, true); };
      requestAnimationFrame(function () { c.classList.add('on'); }); setTimeout(go, 5200); D.addEventListener('pointerdown', go, true); }, 700); }

  var go0 = function () { if (go0.d) return; go0.d = 1; mode(P.m, true); }; H.dataset.m = P.m; requestAnimationFrame(go0); setTimeout(go0, 150);
})();

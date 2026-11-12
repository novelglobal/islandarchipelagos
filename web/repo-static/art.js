/* ART: every published piece and the site's own art, one at a time, full size. Swipe, pinch, colour, remix, share, print */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var IN = /[?&]in=1/.test(location.search), ONE = /[?&]one=1/.test(location.search), H = document.documentElement;
  var OWN = ['ref-moa.jpg'].concat([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (n) { return 'chair-' + n + '.jpg'; }),
    ['cooler', 'dog', 'grille', 'gutter', 'lora', 'pigeon', 'puddle', 'tap'].map(function (n) { return 'found-' + n + '.jpg'; })).map(function (f) { return { u: '/cards/' + f, k: 'ART' }; });
  if (ONE) OWN = OWN.slice(0, 1);
  var COLS = ['', 'ink', 'blue', 'tomato', 'lime', 'night'];
  var S = { list: [], at: 0, col: 0, z: 1, x: 0, y: 0, busy: false };

  function say(t) { $('#st').textContent = t || ''; }
  function api(p, o) { return fetch('/api' + p, Object.assign({ headers: { 'content-type': 'application/json' } }, o || {})).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || r.status); return j; }); }); }

  function build() {
    var tr = $('#track');
    if (!S.list.length) { tr.innerHTML = '<p class="none">·</p>'; return; }
    tr.innerHTML = S.list.map(function (x, i) { return '<section class="sl" data-i="' + i + '"><figure><img alt="" draggable="false" decoding="async" loading="' + (i < 2 ? 'eager' : 'lazy') + '" src="' + x.u + '"></figure></section>'; }).join('');
    $('#dots').innerHTML = S.list.length <= 30 ? S.list.map(function () { return '<i></i>'; }).join('') : '';
    var i0 = Math.max(0, Math.min(S.list.length - 1, (parseInt(location.hash.slice(1), 10) || 1) - 1));
    tr.scrollLeft = i0 * tr.clientWidth; S.at = i0; read();
    var q = 0; tr.addEventListener('scroll', function () { cancelAnimationFrame(q); q = requestAnimationFrame(function () { var i = Math.round(tr.scrollLeft / Math.max(1, tr.clientWidth)); if (i !== S.at) { unzoom(); S.at = i; read(); } }); });
  }
  function read() {
    var x = S.list[S.at]; if (!x) return;
    $('#kind').textContent = x.k;
    [].forEach.call(document.querySelectorAll('#dots i'), function (d, i) { d.classList.toggle('on', i === S.at); });
    try { history.replaceState(null, '', location.pathname + location.search + '#' + (S.at + 1)); } catch (e) { /* framed */ }
    say('');
  }
  function go(d) { var tr = $('#track'); tr.scrollTo({ left: Math.max(0, Math.min(S.list.length - 1, S.at + d)) * tr.clientWidth, behavior: 'smooth' }); }
  function img() { var s = document.querySelector('.sl[data-i="' + S.at + '"] img'); return s; }

  /* close-up: two fingers pinch, one drags once closer, a double tap goes in and out; a trackpad pinch too */
  function setZ() { var im = img(); if (!im) return; im.style.transform = S.z > 1 ? 'translate(' + S.x + 'px,' + S.y + 'px) scale(' + S.z + ')' : ''; $('#track').classList.toggle('lock', S.z > 1); }
  function unzoom() { var im = img(); if (im) im.style.transform = ''; S.z = 1; S.x = 0; S.y = 0; $('#track').classList.remove('lock'); }
  function zoomAt(z, cx, cy) { var im = img(); if (!im) return; var r = im.getBoundingClientRect(), ox = r.left - S.x, oy = r.top - S.y;
    z = Math.max(1, Math.min(5, z)); var px = (cx - r.left) / S.z, py = (cy - r.top) / S.z; S.z = z;
    if (z === 1) { unzoom(); return; } S.x = cx - ox - px * z; S.y = cy - oy - py * z; setZ(); }
  function touches() {
    var tr = $('#track'), P = {}, pinch = null, drag = null, lastTap = 0;
    tr.addEventListener('pointerdown', function (e) { if (!e.target.closest('img')) return; P[e.pointerId] = { x: e.clientX, y: e.clientY }; var ids = Object.keys(P);
      if (ids.length === 2) { var a = P[ids[0]], b = P[ids[1]]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: S.z }; drag = null; }
      else if (S.z > 1) { drag = { x: e.clientX - S.x, y: e.clientY - S.y }; try { tr.setPointerCapture(e.pointerId); } catch (er) { /* none */ } }
      var now = Date.now(); if (ids.length === 1 && now - lastTap < 300) { zoomAt(S.z > 1 ? 1 : 2.5, e.clientX, e.clientY); lastTap = 0; } else lastTap = now; });
    tr.addEventListener('pointermove', function (e) { if (!P[e.pointerId]) return; P[e.pointerId] = { x: e.clientX, y: e.clientY }; var ids = Object.keys(P);
      if (pinch && ids.length === 2) { var a = P[ids[0]], b = P[ids[1]]; zoomAt(pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / Math.max(1, pinch.d), (a.x + b.x) / 2, (a.y + b.y) / 2); e.preventDefault(); return; }
      if (drag && S.z > 1) { S.x = e.clientX - drag.x; S.y = e.clientY - drag.y; setZ(); e.preventDefault(); } }, { passive: false });
    var up = function (e) { delete P[e.pointerId]; if (Object.keys(P).length < 2) pinch = null; if (!Object.keys(P).length) drag = null; };
    tr.addEventListener('pointerup', up); tr.addEventListener('pointercancel', up);
    tr.addEventListener('wheel', function (e) { if (!e.ctrlKey) return; e.preventDefault(); zoomAt(S.z * Math.exp(-e.deltaY / 120), e.clientX, e.clientY); }, { passive: false });
    addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); if (e.key === 'Escape') unzoom(); });
  }

  /* the piece as the paper will have it: 512 dots wide, the colour chosen, dithered to black and white */
  function paper(done) {
    var im = img(); if (!im || !im.complete || !im.naturalWidth) { done(null); return; }
    var W = 512, h = Math.round(im.naturalHeight * W / im.naturalWidth), c = document.createElement('canvas'); c.width = W; c.height = Math.min(h, 2400);
    var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, W, c.height);
    g.filter = COLS[S.col] === 'night' ? 'grayscale(1) invert(1) contrast(1.1)' : 'grayscale(1) contrast(1.15)'; g.drawImage(im, 0, 0, W, c.height); g.filter = 'none';
    var d = g.getImageData(0, 0, W, c.height), p = d.data, L = new Float32Array(W * c.height);
    for (var i = 0; i < L.length; i++) L[i] = p[i * 4];
    for (var y = 0; y < c.height; y++) for (var x = 0; x < W; x++) { var k = y * W + x, o = L[k], n = o < 128 ? 0 : 255, e = o - n; L[k] = n;
      if (x + 1 < W) L[k + 1] += e * 7 / 16; if (y + 1 < c.height) { if (x > 0) L[k + W - 1] += e * 3 / 16; L[k + W] += e * 5 / 16; if (x + 1 < W) L[k + W + 1] += e / 16; } }
    for (var j = 0; j < L.length; j++) { p[j * 4] = p[j * 4 + 1] = p[j * 4 + 2] = L[j]; p[j * 4 + 3] = 255; }
    g.putImageData(d, 0, 0); done(c);
  }
  var CROCK = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  function code() { var s = 'DA-', r = new Uint8Array(4); crypto.getRandomValues(r); for (var i = 0; i < 4; i++) s += CROCK[r[i] % 32]; return s; }
  function today() { var d = new Date(Date.now() + 10 * 36e5); return d.toISOString().slice(0, 10); }
  function print() {
    if (S.busy) return; var T = window.THERMAL; if (!T) { say('OFFLINE'); return; }
    S.busy = true; say('· · ·');
    paper(function (c) {
      if (!c) { S.busy = false; say('WAIT'); return; }
      var ps = null; try { ps = JSON.parse(localStorage.getItem('da.pass') || 'null'); } catch (e) { ps = null; } if (ps && (ps.island !== 'novelglobal' || ps.day !== today())) ps = null;
      var cd = code(), w = [-37.8136, 144.9631];
      api('/stories', { method: 'POST', body: JSON.stringify({ kind: 'record', code: cd, body: JSON.stringify({ type: 'stack', stack: 'art', lat: w[0], lng: w[1] }), lat: w[0], lng: w[1], dest: 'novelglobal', escpos: T.raster(c, 0), from: 'art', stage: 'stack', pass: ps ? ps.code : undefined }) })
        .then(function (j) { if (j && j.passed) try { localStorage.removeItem('da.pass'); } catch (e) { /* none */ } say((j && j.passed ? 'PRINTING · ' : 'SENT · ') + cd); },
          function (e) { say(/429|too many/i.test(e.message) ? 'WAIT' : 'UNSENT'); })
        .then(function () { S.busy = false; });
    });
  }
  function share() {
    var u = location.origin + '/art#' + (S.at + 1);
    if (navigator.share) { navigator.share({ url: u, title: 'novel.global' }).catch(function () { /* closed */ }); return; }
    (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { say('COPIED'); }, function () { say(u); });
  }
  /* remix: the piece carried into the zine maker, here, over the art; ← brings it back */
  function remix() {
    var x = S.list[S.at]; if (!x) return; var f = document.createElement('iframe'); f.title = 'Remix'; f.src = 'x.html?in=1';
    f.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0;z-index:5;background:var(--bg)';
    var b = document.createElement('button'); b.type = 'button'; b.textContent = '←'; b.title = 'Back to the art';
    b.style.cssText = 'position:fixed;left:12px;top:calc(env(safe-area-inset-top) + 10px);z-index:6;min-width:34px;min-height:34px;border-radius:999px;border:1px solid currentColor;background:var(--paper);color:var(--ink);font:inherit;cursor:pointer';
    b.addEventListener('click', function () { f.remove(); b.remove(); });
    f.addEventListener('load', function () { setTimeout(function () { try { f.contentWindow.postMessage({ hm: 'fill', img: x.u }, location.origin); } catch (e) { /* none */ } }, 400); });
    document.body.appendChild(f); document.body.appendChild(b);
  }
  function colour(b) { H.classList.remove('c-' + COLS[S.col]); S.col = (S.col + 1) % COLS.length; if (COLS[S.col]) H.classList.add('c-' + COLS[S.col]); b.classList.toggle('on', !!COLS[S.col]); b.title = 'Colour · ' + (COLS[S.col] || 'as made'); }

  document.addEventListener('DOMContentLoaded', function () {
    var dk = false; try { dk = IN ? JSON.parse(localStorage.getItem('da.hm.night') || 'false') === true : matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { dk = false; }
    H.className = (IN ? 'in' : '') + (dk ? ' dk' : '');
    $('#keys').addEventListener('click', function (e) { var b = e.target.closest('[data-k]'); if (!b) return; var k = b.dataset.k;
      if (k === 'print') print(); else if (k === 'share') share(); else if (k === 'remix') remix(); else if (k === 'colour') colour(b); });
    touches();
    api('/posters').then(function (j) { return (j.posters || []).map(function (p) { return { u: '/api/posters/' + encodeURIComponent(p.id), k: 'WORK' }; }); }, function () { return []; })
      .then(function (work) { var seen = {}; S.list = (ONE ? [] : work).concat(OWN).filter(function (x) { if (seen[x.u]) return false; seen[x.u] = 1; return true; }); build(); });
    addEventListener('resize', function () { var tr = $('#track'); unzoom(); tr.scrollLeft = S.at * tr.clientWidth; });
    fetch('/api/beat?k=open-art', { keepalive: true }).catch(function () {});
  });
})();

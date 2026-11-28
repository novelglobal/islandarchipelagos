/* the i's sections: what anyone's own card (an island's, or one made in the builder) shows behind its small i. Sections, not templates:
   words, a link, a film, a picture, a count toward an amount, a countdown to a day. Each said in a few words of its maker's; nothing here
   takes money or sends anything. INFO.view(el, parts) draws them; INFO.edit(el, parts, done) lets a maker lay them out. The worker keeps
   them to the same rules (partsOf, src/worker/index.js) */
(function () {
  'use strict';
  var D = document, MAX = 12;
  var KINDS = [['text', 'WORDS'], ['link', 'LINK'], ['film', 'FILM'], ['pic', 'PICTURE'], ['goal', 'AMOUNT'], ['count', 'COUNTDOWN']];
  var https = function (u) { return /^https:\/\/[^\s"<>]{3,300}$/.test(String(u || '')); };
  var num = function (v) { var n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : null; };
  var mk = function (tag, cls, txt, to) { var e = D.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; if (to) to.appendChild(e); return e; };
  /* a film: a file anywhere on https (mp4, webm), or a YouTube or Vimeo page shown in their own no-cookie player */
  function filmOf(u) { var m = /^https:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,20})/.exec(u); if (m) return { kind: 'frame', src: 'https://www.youtube-nocookie.com/embed/' + m[1] };
    m = /^https:\/\/(?:www\.)?vimeo\.com\/(\d{4,12})/.exec(u); if (m) return { kind: 'frame', src: 'https://player.vimeo.com/video/' + m[1] + '?dnt=1' };
    return /\.(mp4|webm|m4v)(\?|$)/i.test(u) ? { kind: 'file', src: u } : null; }
  function clean(parts) { return (Array.isArray(parts) ? parts : []).filter(function (p) { return p && typeof p === 'object' && KINDS.some(function (k) { return k[0] === p.k; }); }).slice(0, MAX); }
  /* ───────── the view ───────── */
  function left(at) { var ms = Date.parse(at) - Date.now(); if (!isFinite(ms)) return null; if (ms <= 0) return [0, 0, 0, 0]; var s = Math.floor(ms / 1000); return [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60]; }
  function view(el, parts) { var box = mk('div', 'if-v', null, el), clocks = [];
    clean(parts).forEach(function (p) { var t = String(p.t || '').trim();
      if (p.k === 'text' && t) mk('p', 'if-t', t, box);
      else if (p.k === 'link' && https(p.u)) { var a = mk('a', 'if-l', t || String(p.u).replace(/^https:\/\//, '').slice(0, 40), box); a.href = p.u; a.target = '_blank'; a.rel = 'noopener'; }
      else if (p.k === 'pic' && https(p.u)) { var f = mk('figure', 'if-p', null, box), im = mk('img', '', null, f); im.alt = t; im.loading = 'lazy'; im.src = p.u; if (t) mk('figcaption', '', t, f); }
      else if (p.k === 'film' && https(p.u)) { var fm = filmOf(p.u); if (!fm) return; var w = mk('div', 'if-f', null, box);
        if (fm.kind === 'file') { var v = mk('video', '', null, w); v.src = fm.src; v.controls = true; v.preload = 'none'; v.playsInline = true; v.setAttribute('playsinline', ''); }
        else { var fr = mk('iframe', '', null, w); fr.src = fm.src; fr.loading = 'lazy'; fr.allow = 'fullscreen; picture-in-picture'; fr.setAttribute('allowfullscreen', ''); fr.title = t || 'Film'; }
        if (t) mk('p', 'if-c', t, box); }
      else if (p.k === 'goal') { var have = num(p.have), of = num(p.of); if (of == null || of <= 0 || have == null) return; var g = mk('div', 'if-g', null, box), u = String(p.unit || '').slice(0, 4), pc = Math.max(0, Math.min(100, have / of * 100));
        mk('b', '', u + Math.round(have).toLocaleString('en-AU') + ' / ' + u + Math.round(of).toLocaleString('en-AU'), g); var bar = mk('i', '', null, g); mk('u', '', null, bar).style.width = pc.toFixed(1) + '%'; if (t) mk('span', '', t, g); }
      else if (p.k === 'count' && isFinite(Date.parse(p.at))) { var c = mk('div', 'if-n', null, box), n = mk('b', '', null, c); if (t) mk('span', '', t, c); clocks.push([n, p.at]); } });
    var tick = function () { if (!box.isConnected && clocks.length) return clearInterval(iv); clocks.forEach(function (q) { var l = left(q[1]); q[0].textContent = !l ? '' : l.every(function (x) { return !x; }) ? 'NOW' : l[0] + 'D ' + String(l[1]).padStart(2, '0') + ':' + String(l[2]).padStart(2, '0') + ':' + String(l[3]).padStart(2, '0'); }); };
    var iv = clocks.length ? setInterval(tick, 1000) : 0; tick(); return box; }
  /* ───────── the editor: a row a section, its kind's few fields; + adds, ↑ moves, × takes away ───────── */
  var FIELDS = { text: [['t', 'WORDS', 'area']], link: [['t', 'WORDS'], ['u', 'https://', 'url']], film: [['u', 'https:// FILM, YOUTUBE OR VIMEO', 'url'], ['t', 'CAPTION']], pic: [['u', 'https:// PICTURE', 'url'], ['t', 'CAPTION']],
    goal: [['have', 'SO FAR', 'num'], ['of', 'OF', 'num'], ['unit', '$'], ['t', 'WHAT FOR']], count: [['at', '', 'datetime-local'], ['t', 'TO WHAT']] };
  function edit(el, parts, done) { var P = clean(parts).map(function (p) { return Object.assign({}, p); }), box = mk('div', 'if-e', null, el);
    var draw = function () { box.innerHTML = '';
      P.forEach(function (p, i) { var row = mk('div', 'if-r', null, box), hd = mk('div', 'if-h', null, row); mk('b', '', (KINDS.filter(function (k) { return k[0] === p.k; })[0] || [0, ''])[1], hd);
        var up = mk('button', '', '↑', hd); up.type = 'button'; up.setAttribute('aria-label', 'Up'); up.disabled = !i; up.onclick = function () { P.splice(i - 1, 0, P.splice(i, 1)[0]); draw(); done(P); };
        var x = mk('button', '', '×', hd); x.type = 'button'; x.setAttribute('aria-label', 'Take away'); x.onclick = function () { P.splice(i, 1); draw(); done(P); };
        FIELDS[p.k].forEach(function (f) { var inp = f[2] === 'area' ? mk('textarea', '', null, row) : mk('input', '', null, row); if (f[2] !== 'area') inp.type = f[2] === 'num' ? 'text' : f[2] === 'url' ? 'url' : f[2] || 'text'; if (f[2] === 'num') inp.inputMode = 'decimal';
          inp.placeholder = f[1]; inp.setAttribute('aria-label', f[1] || 'When'); inp.maxLength = f[0] === 'u' ? 300 : f[0] === 'unit' ? 4 : f[2] === 'area' ? 600 : 80; if (f[2] === 'area') inp.rows = 3;
          inp.value = f[0] === 'at' && p.at ? String(p.at).slice(0, 16) : p[f[0]] == null ? '' : p[f[0]];
          inp.addEventListener('change', function () { var v = inp.value.trim(); p[f[0]] = f[0] === 'at' && v ? new Date(v).toISOString() : v; done(P); }); }); });
      if (P.length < MAX) { var add = mk('div', 'if-add', null, box); KINDS.forEach(function (k) { var b = mk('button', '', '+ ' + k[1], add); b.type = 'button'; b.onclick = function () { P.push({ k: k[0] }); draw(); }; }); } };
    draw(); return { get: function () { return P; } }; }
  /* the look, once: plain, in the page's own ink */
  if (!D.getElementById('if-css')) { var st = D.createElement('style'); st.id = 'if-css'; st.textContent =
    '.if-v{display:grid;gap:12px;margin:12px 0 0}.if-t{margin:0;white-space:pre-line}.if-l{font-weight:600;text-decoration:underline;text-underline-offset:3px;color:inherit}' +
    '.if-p{margin:0}.if-p img{display:block;max-width:100%;border-radius:4px}.if-p figcaption,.if-c,.if-g span,.if-n span{font:400 11px/1.4 "IBM Plex Mono",monospace;letter-spacing:.06em;opacity:.7;margin:4px 0 0}' +
    '.if-f{position:relative;aspect-ratio:16/9}.if-f iframe,.if-f video{position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:4px;background:#000}' +
    '.if-g{display:grid;gap:6px}.if-g b,.if-n b{font:600 14px/1 "IBM Plex Mono",monospace;letter-spacing:.04em}.if-g i{display:block;height:6px;border-radius:3px;background:color-mix(in srgb,currentColor 18%,transparent);overflow:hidden}.if-g u{display:block;height:100%;background:currentColor}' +
    '.if-n b{font:400 28px/1 VT323,"IBM Plex Mono",monospace}' +
    '.if-e{display:grid;gap:8px}.if-r{display:grid;gap:6px;padding:8px;border:1px dashed color-mix(in srgb,currentColor 35%,transparent);border-radius:6px}.if-h{display:flex;gap:6px;align-items:center}.if-h b{flex:1;font:600 10px/1 "IBM Plex Mono",monospace;letter-spacing:.14em}' +
    '.if-h button,.if-add button{min-height:30px;padding:0 10px;border:1px solid currentColor;border-radius:15px;background:none;color:inherit;font:600 10px/1 "IBM Plex Mono",monospace;letter-spacing:.1em;cursor:pointer}.if-h button:disabled{opacity:.3}' +
    '.if-r input,.if-r textarea{width:100%;box-sizing:border-box;font:inherit;padding:6px 8px;border:1px solid color-mix(in srgb,currentColor 30%,transparent);border-radius:4px;background:transparent;color:inherit}.if-add{display:flex;flex-wrap:wrap;gap:6px}';
    D.head.appendChild(st); }
  window.INFO = { view: view, edit: edit, clean: clean, KINDS: KINDS };
})();

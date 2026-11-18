/* AWAY: one player for the whole page. What plays goes round as a sound file in an audio element, so it keeps playing with the
   screen locked or another app in front (a phone pauses sound made live, never a file already playing). Its name and keys show on
   the lock screen. A frame inside the page uses the page's own, so only one ever sounds */
(function () {
  try { if (window.parent !== window && window.parent.NGAWAY) { window.NGAWAY = window.parent.NGAWAY; return; } } catch (e) { /* its own */ }
  var el = null, url = '', cur = null, SIL = '';
  /* a tenth of a second of quiet, to wake the player inside a touch, as a phone asks */
  function silence() { if (SIL) return SIL; var n = 800, b = new ArrayBuffer(44 + n), v = new DataView(b), s = function (o, t) { for (var i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
    s(0, 'RIFF'); v.setUint32(4, 36 + n, true); s(8, 'WAVE'); s(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); s(36, 'data'); v.setUint32(40, n, true);
    for (var i = 0; i < n; i++) v.setUint8(44 + i, 128); SIL = URL.createObjectURL(new Blob([b], { type: 'audio/wav' })); return SIL; }
  function tell() { var on = !!cur && !!el && !el.paused; try { window.dispatchEvent(new CustomEvent('ng-away', { detail: { on: on, id: cur ? cur.id : '' } })); } catch (e) { /* old */ } try { var fs = document.querySelectorAll('iframe'); for (var i = 0; i < fs.length; i++) { try { fs[i].contentWindow.dispatchEvent(new CustomEvent('ng-away', { detail: { on: on, id: cur ? cur.id : '' } })); } catch (e2) { /* elsewhere */ } } } catch (e) { /* none */ } }
  function make() { if (el) return el; el = document.createElement('audio'); el.setAttribute('playsinline', ''); el.setAttribute('aria-hidden', 'true'); el.preload = 'auto'; el.style.display = 'none'; (document.body || document.documentElement).appendChild(el);
    ['play', 'pause', 'playing'].forEach(function (k) { el.addEventListener(k, function () { if (navigator.mediaSession && cur) try { navigator.mediaSession.playbackState = el.paused ? 'paused' : 'playing'; } catch (e) { /* none */ } tell(); }); });
    /* an album's track ended: the next, already made ready, straight away */
    el.addEventListener('ended', function () { if (cur && cur.lib) go(LIB.i + 1); }); return el; }
  /* woken inside the touch that asks for sound; the file it plays may come a moment later */
  function unlock() { try { if (window.navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback'; } catch (e) { /* not here */ }
    var a = make(); if (cur || !a.paused) return; try { a.loop = false; a.src = silence(); var p = a.play(); if (p && p.catch) p.catch(function () {}); } catch (e) { /* later */ } }
  function act(k, fn) { try { navigator.mediaSession.setActionHandler(k, fn || null); } catch (e) { /* not on this phone */ } }
  function meta() { var ms = navigator.mediaSession; if (!ms || !cur || !window.MediaMetadata) return;
    try { ms.metadata = new MediaMetadata({ title: cur.title, artist: 'novel.global', album: cur.album || 'RADIO', artwork: (cur.art ? [{ src: cur.art, sizes: '512x512', type: 'image/svg+xml' }] : []).concat([{ src: '/icon-512.png', sizes: '512x512', type: 'image/png' }, { src: '/icon-192.png', sizes: '192x192', type: 'image/png' }]) }); } catch (e) { /* none */ }
    act('play', function () { if (el) el.play().catch(function () {}); }); act('pause', function () { if (el) el.pause(); }); act('stop', function () { stop(); });
    act('nexttrack', cur.next ? function () { if (cur && cur.next) cur.next(); } : null); act('previoustrack', cur.prev ? function () { if (cur && cur.prev) cur.prev(); } : null); }
  function let_go(why) { var c = cur; cur = null; if (url) { var u = url; url = ''; setTimeout(function () { URL.revokeObjectURL(u); }, 1500); } if (c && c.stop) { try { c.stop(why); } catch (e) { /* gone */ } } }
  /* a file going round from `at` seconds: o.id who it is, o.title its name, o.next / o.prev for the lock screen's keys, o.stop told when it ends or another takes its place */
  function play(blob, o) {
    o = o || {}; var a = make(); let_go('replaced');
    url = URL.createObjectURL(blob); cur = { id: o.id || '', title: o.title || 'novel.global', album: o.album, next: o.next, prev: o.prev, stop: o.stop };
    a.loop = o.loop !== false; a.src = url; if (o.at) { var at = +o.at; a.addEventListener('loadedmetadata', function f() { a.removeEventListener('loadedmetadata', f); try { a.currentTime = a.duration ? at % a.duration : at; } catch (e) { /* from the top */ } }); }
    meta(); var p; try { p = a.play(); } catch (e) { p = null; }
    return p && p.then ? p.then(function () { tell(); return true; }, function () { tell(); return false; }) : Promise.resolve(true);
  }
  function stop(why) { if (!el) return; var had = !!cur; let_go(why || 'stop'); try { el.pause(); el.removeAttribute('src'); el.load(); } catch (e) { /* gone */ } if (had && navigator.mediaSession) { try { navigator.mediaSession.playbackState = 'none'; navigator.mediaSession.metadata = null; } catch (e) { /* none */ } } tell(); }
  /* recordings one after another as one file, so a mixtape goes round whole, never waiting on the next to start */
  function parse(ab) { var v = new DataView(ab), o = 12, f = null, d = null; while (o + 8 <= ab.byteLength) { var id = String.fromCharCode(v.getUint8(o), v.getUint8(o + 1), v.getUint8(o + 2), v.getUint8(o + 3)), n = v.getUint32(o + 4, true);
      if (id === 'fmt ') f = { ch: v.getUint16(o + 10, true), sr: v.getUint32(o + 12, true), bits: v.getUint16(o + 22, true) }; else if (id === 'data') d = new Uint8Array(ab, o + 8, Math.min(n, ab.byteLength - o - 8)); o += 8 + n + (n % 2); }
    return f && d ? { f: f, d: d } : null; }
  function head(f, n) { var b = new ArrayBuffer(44), v = new DataView(b), s = function (o, t) { for (var i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); }, ba = f.ch * f.bits / 8;
    s(0, 'RIFF'); v.setUint32(4, 36 + n, true); s(8, 'WAVE'); s(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, f.ch, true); v.setUint32(24, f.sr, true); v.setUint32(28, f.sr * ba, true); v.setUint16(32, ba, true); v.setUint16(34, f.bits, true); s(36, 'data'); v.setUint32(40, n, true); return b; }
  function join(blobs) { blobs = (blobs || []).filter(Boolean); if (blobs.length < 2) return Promise.resolve(blobs[0] || null);
    return Promise.all(blobs.map(function (b) { return b.arrayBuffer(); })).then(function (abs) { var ps = abs.map(parse).filter(Boolean); if (!ps.length) return blobs[0]; var f = ps[0].f;
      ps = ps.filter(function (p) { return p.f.ch === f.ch && p.f.sr === f.sr && p.f.bits === f.bits; }); var n = ps.reduce(function (a, p) { return a + p.d.length; }, 0);
      return new Blob([head(f, n)].concat(ps.map(function (p) { return p.d; })), { type: 'audio/wav' }); }); }
  /* sound made ahead (an AudioBuffer) as a file: 16-bit, as it was made */
  function wavOf(buf) { var ch = Math.min(2, buf.numberOfChannels), N = buf.length, n = N * ch * 2, b = new ArrayBuffer(44 + n), v = new DataView(b), cs = [];
    new Uint8Array(b).set(new Uint8Array(head({ ch: ch, sr: buf.sampleRate, bits: 16 }, n)), 0); for (var c = 0; c < ch; c++) cs.push(buf.getChannelData(c));
    for (var i = 0, o = 44; i < N; i++) for (c = 0; c < ch; c++, o += 2) { var x = Math.max(-1, Math.min(1, cs[c][i])); v.setInt16(o, x < 0 ? x * 0x8000 : x * 0x7FFF, true); }
    return new Blob([b], { type: 'audio/wav' }); }
  /* ───────── the library: one set of albums for every player on the site (the small one on every card, the radio, the sound desk).
     NIGHT FIELD, each mixtape, the W.I.S.H. songs, the radio's loops. An album plays track after track through the one player, the next
     made ready while this one plays, so it goes on with the screen locked; the lock screen's keys move inside the album ───────── */
  var NF = null, NFW = null, LIB = { v: '', i: -1, g: 0, pre: null, list: [] };
  var get = function (k, d) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } };
  function nfLoad() { if (NF || NFW) return NFW; NFW = fetch('/tapes/night-field.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { NF = d && d.tracks ? d : null; tell(); return NF; }, function () { NFW = null; return null; }); return NFW; }
  var up = function (s) { return String(s || '').toUpperCase(); };
  function loops() { return (get('da.loops.v1', []) || []).filter(function (l) { return l && l.id && l.rec; }); }
  function aura() { try { return window.AURA || null; } catch (e) { return null; } }
  /* an album's cover, drawn as NIGHT FIELD's is: rings out from the city, a line to each place a track was made, its number there */
  function cover(pts) { var c = [-37.8136, 144.9631], kx = Math.cos(c[0] * Math.PI / 180), P = (pts || []).map(function (p, i) { return [((+p.lng || c[1]) - c[1]) * kx, c[0] - (+p.lat || c[0]), i + 1]; }), x0 = 0, x1 = 0, y0 = 0, y1 = 0;
    P.forEach(function (p) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
    var sc = Math.min(440 / Math.max(0.004, x1 - x0), 520 / Math.max(0.004, y1 - y0)), ox = 300 - (x0 + x1) / 2 * sc, oy = 400 - (y0 + y1) / 2 * sc, f = function (n) { return n.toFixed(1); };
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800"><rect width="600" height="800" fill="#161718"/>', step = Math.max(40, 1 / 111.32 * sc);
    for (var r = step; r < 900; r += step) s += '<circle cx="' + f(ox) + '" cy="' + f(oy) + '" r="' + f(r) + '" fill="none" stroke="#4a4b4d" stroke-width="3" stroke-dasharray="3 12"/>';
    P.forEach(function (p) { s += '<line x1="' + f(ox) + '" y1="' + f(oy) + '" x2="' + f(ox + p[0] * sc) + '" y2="' + f(oy + p[1] * sc) + '" stroke="#9a9b9d" stroke-width="4"/>'; });
    P.forEach(function (p) { var x = f(ox + p[0] * sc), y = oy + p[1] * sc; s += '<circle cx="' + x + '" cy="' + f(y) + '" r="21" fill="#E8913A"/><text x="' + x + '" y="' + f(y + 7) + '" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="20" font-weight="700" fill="#161718">' + p[2] + '</text>'; });
    return 'data:image/svg+xml,' + encodeURIComponent(s + '<rect x="' + f(ox - 10) + '" y="' + f(oy - 10) + '" width="20" height="20" fill="#f2f1ec"/></svg>'); }
  function recRow(l) { return { k: 'rec', id: l.id, n: up((l.where && l.where.place) || 'RADIO'), s: (l.rec && l.rec.s) || 0, lat: l.where && l.where.lat, lng: l.where && l.where.lng }; }
  /* every album and its tracks, read afresh each time: what the radio or the desk keeps shows on every player at once */
  function albums() { nfLoad(); var ls = loops(), out = [], A = aura();
    if (NF) out.push({ v: 'nf', n: up(NF.name || 'NIGHT FIELD'), art: '/tapes/night-field.svg', tracks: NF.tracks.map(function (t) { return { k: 'url', id: 'nf' + t.n, n: up(t.cn), src: t.src, st: +t.st || 0, sci: t.sci, by: t.by, lic: t.lic, s: 0 }; }) });
    (get('da.tapes.v1', []) || []).forEach(function (t) { if (!t || !t.id) return; var tr = (t.ids || []).map(function (id) { var l = ls.filter(function (q) { return q.id === id; })[0]; return l ? recRow(l) : null; }).filter(Boolean);
      if (tr.length) out.push({ v: 't:' + t.id, n: up(t.name || 'MIXTAPE'), tape: t.id, art: cover(tr), tracks: tr }); });
    if (A && A.songFile) { var sg = (get('da.aura.songs', []) || []).filter(function (q) { return q && q.code; }).map(function (q) { return { k: 'song', id: 'sg-' + q.code, code: q.code, rec: q.rec || '', n: up(q.name || (A.songName ? A.songName(q.code) : 'SONG')), s: 0 }; });
      if (sg.length) out.push({ v: 'wish', n: 'W.I.S.H.', tracks: sg }); }
    if (ls.length) { var rr = ls.map(recRow); out.push({ v: 'radio', n: 'RADIO', art: cover(rr), tracks: rr }); }
    return out; }
  function album(v) { return albums().filter(function (a) { return a.v === v; })[0] || null; }
  function recBlob(id) { return new Promise(function (res) { try { var q = indexedDB.open('novelglobal-kept', 1); q.onupgradeneeded = function () { q.result.createObjectStore('kv'); };
    q.onsuccess = function () { try { var g = q.result.transaction('kv').objectStore('kv').get('rec:' + id); g.onsuccess = function () { res(g.result || null); }; g.onerror = function () { res(null); }; } catch (e) { res(null); } }; q.onerror = function () { res(null); }; } catch (e) { res(null); } }); }
  /* a track as something the player can sound: a sound from its place as it is (tuned), a loop as recorded, a song made ahead */
  function srcOf(t) { if (!t) return Promise.resolve(null); if (t.k === 'url') return Promise.resolve({ u: t.src, rate: Math.pow(2, (t.st || 0) / 12) });
    var A = aura(), b = t.k === 'rec' ? recBlob(t.id) : t.rec ? recBlob(t.rec).then(function (x) { return x || (A && A.songFile ? A.songFile(t.code) : null); }) : A && A.songFile ? A.songFile(t.code) : Promise.resolve(null);
    return b.then(function (x) { return x ? { u: URL.createObjectURL(x), blob: 1, rate: 1 } : null; }, function () { return null; }); }
  function free(s) { if (s && s.blob) { var u = s.u; setTimeout(function () { URL.revokeObjectURL(u); }, 1500); } }
  /* the next track made ready while this one plays, so the turn to it needs no waiting (a locked phone will not wait) */
  function ahead() { var n = LIB.list.length; if (n < 2) return; var j = (LIB.i + 1) % n, g = LIB.g; if (LIB.pre && LIB.pre.j === j) return; free(LIB.pre && LIB.pre.s); LIB.pre = null;
    srcOf(LIB.list[j]).then(function (s) { if (g !== LIB.g || !s) { free(s); return; } LIB.pre = { j: j, s: s }; }); }
  function sound(s, i) { var t = LIB.list[i], a = make(), ab = album(LIB.v); let_go('replaced'); LIB.i = i;
    url = s.blob ? s.u : ''; cur = { id: 'lib:' + LIB.v + ':' + t.id, title: t.n, album: ab ? ab.n : 'novel.global', art: ab && ab.art, next: function () { step(1); }, prev: function () { step(-1); }, stop: null, lib: 1 };
    a.loop = LIB.list.length < 2; a.src = s.u; a.preservesPitch = a.mozPreservesPitch = a.webkitPreservesPitch = s.rate === 1; a.defaultPlaybackRate = s.rate; a.playbackRate = s.rate;
    meta(); try { var p = a.play(); if (p && p.catch) p.catch(function () { tell(); }); } catch (e) { /* asked again by a touch */ } tell(); ahead(); }
  function go(i) { var n = LIB.list.length; if (!n) return; i = ((i % n) + n) % n; var g = ++LIB.g; LIB.i = i; LIB.wait = true; tell();
    if (LIB.pre && LIB.pre.j === i) { var s0 = LIB.pre.s; LIB.pre = null; LIB.wait = false; sound(s0, i); return; } free(LIB.pre && LIB.pre.s); LIB.pre = null;
    srcOf(LIB.list[i]).then(function (s) { if (g !== LIB.g) { free(s); return; } LIB.wait = false; if (!s) { if (n > 1 && (LIB.skip = (LIB.skip || 0) + 1) < n) go(i + 1); else { LIB.skip = 0; tell(); } return; } LIB.skip = 0; sound(s, i); }); }
  /* an album from a track (from the first when none is said); the same album and track asked again stops it */
  function playAlbum(v, i) { var ab = album(v); if (!ab || !ab.tracks.length) return false; unlock(); LIB.v = v; LIB.list = ab.tracks; try { localStorage.setItem('da.snd.alb', JSON.stringify(v)); } catch (e) { /* none */ } go(i || 0); return true; }
  function step(d) { if (!LIB.v) return; var ab = album(LIB.v); if (ab) LIB.list = ab.tracks; go(LIB.i + d); }
  function libStop() { LIB.g++; LIB.wait = false; free(LIB.pre && LIB.pre.s); LIB.pre = null; if (cur && cur.lib) stop('stop'); else tell(); }
  function now() { var on = !!cur && !!cur.lib && !!el && !el.paused, t = LIB.list[LIB.i]; return { v: LIB.v, i: LIB.i, id: t ? t.id : '', n: t ? t.n : '', on: on, wait: !!LIB.wait, live: on || !!LIB.wait }; }
  window.NGAWAY = { unlock: unlock, play: play, stop: stop, join: join, wavOf: wavOf, id: function () { return cur ? cur.id : ''; }, on: function () { return !!cur && !!el && !el.paused; }, title: function () { return cur ? cur.title : ''; },
    lib: { albums: albums, album: album, cover: cover, play: playAlbum, step: step, stop: libStop, now: now, ready: nfLoad,
      pick: function (v) { if (v !== undefined) { try { localStorage.setItem('da.snd.alb', JSON.stringify(v)); } catch (e) { /* none */ } tell(); } var p = get('da.snd.alb', ''); return album(p) ? p : (albums()[0] || { v: '' }).v; } } };
})();

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
    ['play', 'pause', 'playing'].forEach(function (k) { el.addEventListener(k, function () { if (navigator.mediaSession && cur) try { navigator.mediaSession.playbackState = el.paused ? 'paused' : 'playing'; } catch (e) { /* none */ } tell(); }); }); return el; }
  /* woken inside the touch that asks for sound; the file it plays may come a moment later */
  function unlock() { try { if (window.navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback'; } catch (e) { /* not here */ }
    var a = make(); if (cur || !a.paused) return; try { a.loop = false; a.src = silence(); var p = a.play(); if (p && p.catch) p.catch(function () {}); } catch (e) { /* later */ } }
  function act(k, fn) { try { navigator.mediaSession.setActionHandler(k, fn || null); } catch (e) { /* not on this phone */ } }
  function meta() { var ms = navigator.mediaSession; if (!ms || !cur || !window.MediaMetadata) return;
    try { ms.metadata = new MediaMetadata({ title: cur.title, artist: 'novel.global', album: cur.album || 'RADIO', artwork: [{ src: '/icon-512.png', sizes: '512x512', type: 'image/png' }, { src: '/icon-192.png', sizes: '192x192', type: 'image/png' }] }); } catch (e) { /* none */ }
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
  window.NGAWAY = { unlock: unlock, play: play, stop: stop, join: join, wavOf: wavOf, id: function () { return cur ? cur.id : ''; }, on: function () { return !!cur && !!el && !el.paused; } };
})();

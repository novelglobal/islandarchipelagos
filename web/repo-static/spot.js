/* what this phone has spotted, and the list it is out to find: one store for the radio, the species cards and SPECIES LIST */
(function () {
  if (window.SPOT) return;
  var KS = 'da.spotted.v1', KH = 'da.hunt.v1';
  var get = function (k, d) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } };
  var put = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* this visit only */ } };
  var M = function () { try { return +new Date().toLocaleString('en-AU', { timeZone: 'Australia/Melbourne', month: 'numeric' }) - 1; } catch (e) { return new Date().getMonth(); } };
  var MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  var BIRD = /^(bird|parrot|waterbird|owl|raptor)$/;
  var SEASONS = { spring: [8, 9, 10], summer: [11, 0, 1], autumn: [2, 3, 4], winter: [5, 6, 7] };
  /* a small seeded shuffle: the same month, the same challenge for everyone */
  var rnd = function (s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return function () { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; };
  var out = function (f, m) { return f.act && f.act[m] === '.'; };
  var score = function (f, m) { return (f.act && f.act[m] === 'A' ? 2 : f.act && f.act[m] === 'a' ? 1 : 0) + (f.brd && f.brd[m] === 'B' ? 1.5 : 0); };
  function inSeason(f, m) {
    var e = String(f.event || ''), r = e.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*[–-]\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/);
    if (r) { var a = MON.indexOf(r[1].toUpperCase()), b = MON.indexOf(r[2].toUpperCase()); return a <= b ? m >= a && m <= b : m >= a || m <= b; }
    for (var k in SEASONS) if (new RegExp('\\b' + k + '\\b', 'i').test(e) && SEASONS[k].indexOf(m) >= 0) return !out(f, m);
    return f.brd && f.brd[m] === 'B';
  }
  /* the lists: the month's birds (one challenge for all), what is in season, ten about now picked at random, the curated, and what is spotted */
  function list(k, F, cur) {
    var m = M(), r = rnd(MON[m] + new Date().getFullYear() + k), n = 10;
    if (k === 'birds') return F.filter(function (f) { return BIRD.test(f.g) && !out(f, m); }).map(function (f) { return [f, score(f, m) + r() * 1.6]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, n).map(function (x) { return x[0]; });
    if (k === 'season') return F.filter(function (f) { return inSeason(f, m); }).sort(function (a, b) { return score(b, m) - score(a, m); }).slice(0, n);
    if (k === 'local') { var l = F.filter(function (f) { return !out(f, m) && f.st !== 'I'; }).slice(); for (var i = l.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = l[i]; l[i] = l[j]; l[j] = t; } return l.slice(0, n); }
    if (k === 'curated') { var want = (cur && cur.length ? cur : CURATED).map(function (s) { return String(s).trim().toLowerCase(); }).filter(Boolean);
      return want.map(function (w) { return F.filter(function (f) { return f.id === w || String(f.cn).toLowerCase() === w; })[0]; }).filter(Boolean).slice(0, 20); }
    if (k === 'mine') { var s = get(KS, {}); return F.filter(function (f) { return s[f.id]; }).sort(function (a, b) { return s[b.id].at - s[a.id].at; }); }
    return F.slice();
  }
  var CURATED = ['tawny-frogmouth', 'superb-fairywren', 'kookaburra', 'powerful-owl', 'rainbow-lorikeet', 'black-swan', 'eastern-spinebill', 'sc-cockatoo', 'wf-heron', 'nankeen-kestrel'];
  var NAMES = { birds: 'BIRDS', season: 'SEASON', local: 'LOCAL 10', curated: 'CURATED', mine: 'SPOTTED', all: 'GUIDE' };
  window.SPOT = {
    month: M, mon: function () { return MON[M()]; }, names: NAMES, list: list, inSeason: inSeason,
    all: function () { return get(KS, {}); },
    has: function (id) { return !!get(KS, {})[id]; },
    set: function (id, cn, on, at) { var s = get(KS, {}); if (on === undefined) on = !s[id]; if (on) s[id] = { cn: String(cn || id).slice(0, 60), at: Date.now(), lat: at && +(+at[0]).toFixed(3), lng: at && +(+at[1]).toFixed(3) }; else delete s[id]; put(KS, s);
      try { window.dispatchEvent(new CustomEvent('da-spot', { detail: { id: id, on: on } })); } catch (e) { /* old browser */ } return on; },
    count: function () { return Object.keys(get(KS, {})).length; },
    /* the list being looked for: which, and its names; set from the radio's guide or the card, read by both */
    hunt: function (h) { if (h === undefined) return get(KH, null); put(KH, h); return h; }
  };
  /* a change on another page of the same site (the radio in its frame, the card in its own) reaches this one */
  addEventListener('storage', function (e) { if (e.key === KS || e.key === KH) try { window.dispatchEvent(new CustomEvent('da-spot', { detail: {} })); } catch (er) { /* old browser */ } });
})();

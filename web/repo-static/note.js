/* a private page: its words come by its own link (the part after #), are set as plain text, and are never kept on the device */
(function () {
  'use strict';
  var D = document, k = (location.hash || '').slice(1).replace(/[^a-z0-9]/g, ''), pg = D.getElementById('pg'), no = D.getElementById('no');
  function put(tag, txt, to) { var e = D.createElement(tag); e.textContent = txt; (to || pg).appendChild(e); return e; }
  function show(t) { var par = [], ul = null, flush = function () { if (par.length) { put('p', par.join(' ')); par = []; } };
    t.replace(/\r/g, '').split('\n').forEach(function (l) { var s = l.trim();
      if (!s) { flush(); ul = null; return; }
      if (/^## /.test(s)) { flush(); ul = null; put('h2', s.slice(3)); return; }
      if (/^# /.test(s)) { flush(); ul = null; put('h1', s.slice(2)); return; }
      if (/^- /.test(s)) { flush(); if (!ul) ul = pg.appendChild(D.createElement('ul')); put('li', s.slice(2), ul); return; }
      if (/^> /.test(s)) { flush(); ul = null; put('blockquote', s.slice(2)); return; }
      ul = null; par.push(s); }); flush(); }
  if (!k) { no.hidden = false; return; }
  fetch('/api/note?k=' + encodeURIComponent(k), { cache: 'no-store' }).then(function (r) { if (!r.ok) throw 0; return r.text(); }).then(show, function () { no.hidden = false; });
})();

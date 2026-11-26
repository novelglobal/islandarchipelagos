/* The island browser: every island that is on and open, on any site, with one line:
     <div data-islands></div><script src="https://novel.global/browser.js" defer></script>
   It draws a plain list in the page's own type and colours (white label: no look of its own). Each item carries data-on, data-open,
   data-lat and data-lng (only when its keeper has set it open), so a site can style it or draw it as a map or a compass instead.
   Archipelagos.islands() gives the list itself; Archipelagos.draw(el) draws it again. Asks novel.global only for /api/isles. */
(function () {
  'use strict';
  var me = document.currentScript, base = 'https://novel.global';
  try { if (me && me.src) base = new URL(me.src).origin; } catch (e) { /* the default */ }
  function islands() { return fetch(base + '/api/isles', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : { isles: [] }; }).then(function (j) { return (j && j.isles) || []; }, function () { return []; }); }
  function draw(el) {
    return islands().then(function (list) {
      var ul = document.createElement('ul'); ul.className = 'islands';
      list.forEach(function (i) { var li = document.createElement('li'); li.textContent = i.name; li.dataset.id = i.id; li.dataset.on = i.on ? '1' : '0'; li.dataset.open = i.open ? '1' : '0';
        if (i.open && i.lat != null && i.lng != null) { li.dataset.lat = i.lat; li.dataset.lng = i.lng; } ul.appendChild(li); });
      el.replaceChildren(ul); return list; });
  }
  window.Archipelagos = window.Archipelagos || {}; window.Archipelagos.islands = islands; window.Archipelagos.draw = draw;
  var go = function () { Array.prototype.forEach.call(document.querySelectorAll('[data-islands]'), draw); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();

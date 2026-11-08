/* research board */
(function () {
  'use strict';
  var D = document, H = D.documentElement, $ = function (s) { return D.querySelector(s); }, q = location.search, F = window.fabric;
  if (/[?&]in=1/.test(q)) H.classList.add('in');
  if (/[?&]night=1/.test(q)) H.classList.add('night');
  var WISH = /[?&]wish=1/.test(q);
  var NG = (function () { try { return window.parent !== window ? window.parent.NG : null; } catch (e) { return null; } })();
  var INK = '#0B0B0B', PAPER = '#ECEBE7', BLUE = '#143D71', LIME = '#D9F24A', CORAL = '#F59878', WHITE = '#FFFFFF';
  var NOTES = [[INK, PAPER], [BLUE, '#F1F0EC'], [LIME, INK], [WHITE, INK], [CORAL, INK]];
  var PROPS = ['daId', 'daKind', 'daFrom', 'daTo', 'daC', 'pad'];
  var uid = function () { return Math.random().toString(36).slice(2, 10); };

  /* a note: words on a plate with room round them */
  F.Note = F.util.createClass(F.Textbox, {
    type: 'note',
    _renderBackground: function (ctx) { if (!this.backgroundColor) return; var p = this.pad || 0, d = this._getNonTransformedDimensions(); ctx.fillStyle = this.backgroundColor; ctx.fillRect(-d.x / 2 - p, -d.y / 2 - p, d.x + p * 2, d.y + p * 2); this._removeShadow(ctx); }
  });
  F.Note.fromObject = function (o, cb) { return F.Object._fromObject('Note', o, cb, 'text'); };

  /* ───── the boards, kept in this browser (IndexedDB: pictures are large) ───── */
  var db = null;
  var idb = function () { if (db) return Promise.resolve(db); return new Promise(function (ok, no) { var r = indexedDB.open('novelglobal-research', 1); r.onupgradeneeded = function () { r.result.createObjectStore('b', { keyPath: 'id' }); }; r.onsuccess = function () { db = r.result; ok(db); }; r.onerror = no; }); };
  var tx = function (mode, fn) { return idb().then(function (d) { return new Promise(function (ok, no) { var t = d.transaction('b', mode), s = t.objectStore('b'), out = fn(s); t.oncomplete = function () { ok(out && out.result); }; t.onerror = no; }); }); };
  var LIST = [], at = '';
  try { LIST = JSON.parse(localStorage.getItem('da.rb.list') || '[]'); at = localStorage.getItem('da.rb.at') || ''; } catch (e) { /* none yet */ }
  var keepList = function () { try { localStorage.setItem('da.rb.list', JSON.stringify(LIST)); localStorage.setItem('da.rb.at', at); } catch (e) { /* this visit */ } };

  /* ───── the canvas ───── */
  var wrap = $('#wrap'), cv = new F.Canvas('c', { preserveObjectStacking: true, selection: true, stopContextMenu: true, fireRightClick: false, enableRetinaScaling: true, targetFindTolerance: 8 });
  F.Object.prototype.set({ transparentCorners: false, cornerColor: LIME, cornerStrokeColor: INK, borderColor: INK, cornerSize: 14, touchCornerSize: 34, cornerStyle: 'circle', borderScaleFactor: 2, padding: 6 });
  function size() { cv.setWidth(wrap.clientWidth); cv.setHeight(wrap.clientHeight); grid(); cv.requestRenderAll(); }
  function grid() { var v = cv.viewportTransform, s = 22 * v[0]; wrap.style.backgroundSize = s + 'px ' + s + 'px'; wrap.style.backgroundPosition = v[4] + 'px ' + v[5] + 'px'; }
  addEventListener('resize', size);
  var byId = function (id) { return cv.getObjects().filter(function (o) { return o.daId === id; })[0]; };
  var mid = function () { var v = cv.viewportTransform, n = cv.getObjects().filter(function (o) { return o.daKind && o.daKind !== 'link'; }).length % 9; return { x: (cv.getWidth() * (0.14 + (n % 3) * 0.28) - v[4]) / v[0], y: (cv.getHeight() * (0.14 + Math.floor(n / 3) * 0.26) - v[5]) / v[0] }; };

  /* ───── undo and keeping ───── */
  var HIST = [], quiet = false, sT = 0;
  var snap = function () { return JSON.stringify(cv.toDatalessJSON(PROPS).objects.filter(function (o) { return o.daKind !== 'tpl'; })); };
  var last = '[]';
  function changed() { if (quiet) return; var s = snap(); if (s === last) return; HIST.push(last); if (HIST.length > 40) HIST.shift(); last = s; $('[data-t="undo"]').disabled = false; clearTimeout(sT); sT = setTimeout(save, 500); }
  function save() { var b = LIST.filter(function (x) { return x.id === at; })[0]; if (!b) return; b.t = Date.now(); keepList();
    tx('readwrite', function (s) { s.put({ id: at, objects: JSON.parse(last), v: cv.viewportTransform.slice() }); }).then(function () { $('#saved').textContent = 'SAVED'; setTimeout(function () { $('#saved').textContent = ''; }, 1200); }, function () { $('#saved').textContent = 'FULL'; }); }
  function load(objs, done) { quiet = true; var keep = cv.getObjects().filter(function (o) { return o.daKind === 'tpl'; });
    cv.loadFromJSON({ objects: objs || [] }, function () { keep.forEach(function (o) { cv.add(o); cv.sendToBack(o); }); cv.getObjects().forEach(dress); follow(); quiet = false; last = snap(); cv.requestRenderAll(); if (done) done(); }); }
  ['object:added', 'object:removed', 'object:modified', 'text:changed', 'path:created'].forEach(function (e) { cv.on(e, function () { if (e === 'path:created') { var p = cv.getObjects('path').slice(-1)[0]; if (p && !p.daId) p.set({ daId: uid(), daKind: 'ink' }); } changed(); }); });
  function dress(o) { if (o.daKind === 'link') o.set({ selectable: false, evented: true, hoverCursor: 'pointer' }); if (o.daKind === 'note' || o.daKind === 'sect') o.set({ splitByGrapheme: false }); if (LOCKED && o.daKind !== 'tpl') o.set({ selectable: false, evented: o.daKind === 'link' }); }

  /* ───── things on the board ───── */
  function note(t, x, y) { var c = NOTES[0]; var n = new F.Note(t || '', { left: x, top: y, width: 200, fontSize: 24, lineHeight: 1.05, fontFamily: 'Archivo Narrow', fontWeight: 600, fill: c[1], backgroundColor: c[0], pad: 12, padding: 16, daId: uid(), daKind: 'note', daC: 0, editable: true, textAlign: 'left' }); cv.add(n); return n; }
  function sect(t, x, y) { var n = new F.Note(t || '', { left: x, top: y, width: 360, fontSize: 56, lineHeight: .9, fontFamily: 'Archivo Narrow', fontWeight: 600, fill: INK, backgroundColor: '', pad: 0, daId: uid(), daKind: 'sect', daC: -1 }); cv.add(n); return n; }
  function dot(x, y) { var d = new F.Circle({ left: x, top: y, radius: 14, fill: INK, daId: uid(), daKind: 'dot', daC: 0, originX: 'center', originY: 'center' }); cv.add(d); return d; }
  function pic(url, x, y) { return new Promise(function (ok) { F.Image.fromURL(url, function (im) { if (!im || !im.width) return ok(null); var k = Math.min(1, 260 / Math.max(im.width, im.height)); im.set({ left: x, top: y, scaleX: k, scaleY: k, daId: uid(), daKind: 'img' }); cv.add(im); cv.setActiveObject(im); look(im); ok(im); }, { crossOrigin: 'anonymous' }); }); }
  /* a picture from anywhere made smaller first, never cropped */
  function shrink(blob) { return new Promise(function (ok, no) { var u = URL.createObjectURL(blob), im = new Image(); im.onload = function () { var k = Math.min(1, 1400 / Math.max(im.naturalWidth, im.naturalHeight)), c = D.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); ok(c.toDataURL('image/jpeg', 0.84)); }; im.onerror = no; im.src = u; }); }
  function addFiles(files, x, y) { var p = mid(); x = x == null ? p.x : x; y = y == null ? p.y : y; [].slice.call(files || []).filter(function (f) { return /^image\//.test(f.type); }).slice(0, 12).forEach(function (f, i) { shrink(f).then(function (u) { pic(u, x + i * 24, y + i * 24); }); }); }
  function addText(t) { t = String(t || '').trim(); if (!t) return; var p = mid(); if (/^https?:\/\/\S+$/i.test(t)) { var h = t.replace(/^https?:\/\/(www\.)?/i, '').split('/')[0]; var n = note(h.toUpperCase() + '\n' + t, p.x, p.y); n.set({ fontSize: 20 }); } else note(t.slice(0, 600).toUpperCase(), p.x, p.y); cv.requestRenderAll(); }

  /* ───── strings ───── */
  function follow() { cv.getObjects('line').forEach(function (l) { var a = byId(l.daFrom), b = byId(l.daTo); if (!a || !b) { if (l.daKind === 'link') cv.remove(l); return; } var ca = a.getCenterPoint(), cb = b.getCenterPoint(); l.set({ x1: ca.x, y1: ca.y, x2: cb.x, y2: cb.y }); l.setCoords(); }); }
  function join(a, b) { var was = cv.getObjects('line').filter(function (l) { return (l.daFrom === a.daId && l.daTo === b.daId) || (l.daFrom === b.daId && l.daTo === a.daId); })[0]; if (was) { cv.remove(was); return; }
    var ca = a.getCenterPoint(), cb = b.getCenterPoint(), l = new F.Line([ca.x, ca.y, cb.x, cb.y], { stroke: INK, strokeWidth: 3, selectable: false, evented: true, hoverCursor: 'pointer', daId: uid(), daKind: 'link', daFrom: a.daId, daTo: b.daId });
    cv.add(l); cv.sendToBack(l); cv.getObjects().filter(function (o) { return o.daKind === 'tpl'; }).forEach(function (o) { cv.sendToBack(o); }); }
  cv.on('text:editing:exited', function (e) { var o = e.target; if (o && o.daKind === 'sect' && !String(o.text || '').trim()) { cv.remove(o); cv.requestRenderAll(); } });
  cv.on('object:moving', follow); cv.on('object:scaling', follow); cv.on('object:rotating', follow);

  /* ───── tools ───── */
  var mode = '', from = null, LOCKED = false;
  var key = function (t) { return $('[data-t="' + t + '"]'); };
  function setMode(m) { mode = mode === m ? '' : m; from = null; cv.isDrawingMode = mode === 'pencil'; if (cv.isDrawingMode) { cv.freeDrawingBrush.color = H.classList.contains('night') ? '#F1F0EC' : INK; cv.freeDrawingBrush.width = 4; }
    key('link').setAttribute('aria-pressed', String(mode === 'link')); key('pencil').setAttribute('aria-pressed', String(mode === 'pencil')); cv.discardActiveObject(); cv.requestRenderAll(); }
  function sel() { var a = cv.getActiveObject(); var on = !!a && a.daKind !== 'tpl'; ['colour', 'del', 'front'].forEach(function (t) { key(t).disabled = !on; }); }
  cv.on('selection:created', sel); cv.on('selection:updated', sel); cv.on('selection:cleared', sel);
  cv.on('mouse:down', function (e) {
    if (mode === 'link') { var t = e.target; if (!t || !t.daId || t.daKind === 'link' || t.daKind === 'tpl') return; if (!from) { from = t; t.set({ shadow: '0 0 0 ' + LIME }); return; } if (from !== t) join(from, t); from = null; setMode('link'); return; }
    if (e.target && e.target.daKind === 'link' && !mode) { cv.remove(e.target); return; }
  });
  $('#tools').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || b.disabled) return; var t = b.dataset.t, p = mid(), a = cv.getActiveObject();
    if (t === 'note') { var n = note('', p.x, p.y); cv.setActiveObject(n); look(n); n.enterEditing(); n.hiddenTextarea && n.hiddenTextarea.focus(); }
    else if (t === 'sect') { var s = sect('', p.x, p.y); cv.setActiveObject(s); look(s); s.enterEditing(); s.hiddenTextarea && s.hiddenTextarea.focus(); }
    else if (t === 'dot') { var d0 = dot(p.x, p.y); cv.setActiveObject(d0); look(d0); }
    else if (t === 'link' || t === 'pencil') setMode(t);
    else if (t === 'img') $('#fi').click();
    else if (t === 'paste') paste();
    else if (t === 'colour' && a) { (a.type === 'activeSelection' ? a.getObjects() : [a]).forEach(colour); cv.fire('object:modified'); }
    else if (t === 'front' && a) { cv.bringToFront(a); changed(); }
    else if (t === 'del' && a) { (a.type === 'activeSelection' ? a.getObjects() : [a]).forEach(function (o) { if (o.daKind !== 'tpl') cv.remove(o); }); cv.discardActiveObject(); follow(); }
    else if (t === 'undo') { var prev = HIST.pop(); if (prev == null) return; quiet = true; last = prev; load(JSON.parse(prev), function () { save(); }); b.disabled = !HIST.length; }
    else if (t === 'lock') { LOCKED = !LOCKED; b.setAttribute('aria-pressed', String(LOCKED)); cv.discardActiveObject(); cv.getObjects().forEach(function (o) { if (o.daKind !== 'tpl' && o.daKind !== 'link') o.set({ selectable: !LOCKED, evented: !LOCKED }); }); cv.selection = !LOCKED; }
    else if (t === 'fit') fit();
    else if (t === 'form') { var on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on)); cv.getObjects().forEach(function (o) { if (o.daKind === 'tpl') o.visible = on; }); }
    else if (t === 'out') { var pr = $('#pr'); pr.hidden = !pr.hidden; if (!pr.hidden) printers(); }
    cv.requestRenderAll();
  });
  function colour(o) { if (o.daKind === 'note') { o.daC = ((o.daC || 0) + 1) % NOTES.length; o.set({ backgroundColor: NOTES[o.daC][0], fill: NOTES[o.daC][1] }); }
    else if (o.daKind === 'sect' || o.daKind === 'dot' || o.daKind === 'ink') { var C = [INK, BLUE, LIME, CORAL]; o.daC = ((o.daC || 0) + 1) % C.length; o.set(o.daKind === 'ink' ? { stroke: C[o.daC] } : { fill: C[o.daC] }); } }
  $('#fi').addEventListener('change', function () { addFiles(this.files); this.value = ''; });

  /* PASTE: a picture copied anywhere goes on as a picture; a link or words as a note */
  function paste() {
    if (navigator.clipboard && navigator.clipboard.read) navigator.clipboard.read().then(function (items) { var got = false; items.forEach(function (it) { var im = it.types.filter(function (t) { return /^image\//.test(t); })[0]; if (im) { got = true; it.getType(im).then(function (bl) { addFiles([new File([bl], 'p', { type: im })]); }); } else if (it.types.indexOf('text/plain') >= 0) { got = true; it.getType('text/plain').then(function (bl) { return bl.text(); }).then(addText); } }); }).catch(textOnly);
    else textOnly();
  }
  function textOnly() { if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(addText).catch(function () {}); }
  D.addEventListener('paste', function (e) { var a = cv.getActiveObject(); if (a && a.isEditing) return; var cd = e.clipboardData; if (!cd) return; var fs = [].slice.call(cd.files || []); if (fs.length) { e.preventDefault(); addFiles(fs); return; } var t = cd.getData('text/plain'); if (t) { e.preventDefault(); addText(t); } });
  /* dropped on: pictures, or words */
  var dragN = 0;
  addEventListener('dragenter', function (e) { e.preventDefault(); dragN++; H.classList.add('dragging'); });
  addEventListener('dragleave', function () { if (--dragN <= 0) { dragN = 0; H.classList.remove('dragging'); } });
  addEventListener('dragover', function (e) { e.preventDefault(); });
  addEventListener('drop', function (e) { e.preventDefault(); dragN = 0; H.classList.remove('dragging'); var pt = cv.restorePointerVpt({ x: e.clientX, y: e.clientY }); if (e.dataTransfer.files && e.dataTransfer.files.length) addFiles(e.dataTransfer.files, pt.x, pt.y); else addText(e.dataTransfer.getData('text/plain')); });
  D.addEventListener('keydown', function (e) { var a = cv.getActiveObject(); if (a && a.isEditing) return; if (/INPUT|SELECT|TEXTAREA/.test((D.activeElement || {}).tagName || '')) return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && a) { e.preventDefault(); key('del').click(); } if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); key('undo').click(); } if (e.key === 'Escape') { setMode(''); cv.discardActiveObject(); cv.requestRenderAll(); } });

  /* ───── the view: drag the bare ground, wheel or pinch to zoom; two fingers on a chosen piece size it ───── */
  var pan = null;
  var ptOf = function (e) { var t = (e.touches && e.touches[0]) || e; return { x: t.clientX, y: t.clientY }; };
  cv.on('mouse:down', function (e) { if (cv.isDrawingMode || mode === 'link' || (e.target && e.target.selectable !== false && !LOCKED)) return; if (e.e.touches && e.e.touches.length > 1) return; if (!LOCKED && cv.selection && !e.e.touches && e.e.shiftKey) return; pan = ptOf(e.e); cv.selection = false; });
  cv.on('mouse:move', function (e) { if (!pan) return; var p = ptOf(e.e), v = cv.viewportTransform; v[4] += p.x - pan.x; v[5] += p.y - pan.y; pan = p; grid(); cv.requestRenderAll(); });
  cv.on('mouse:up', function () { if (!pan) return; pan = null; cv.selection = !LOCKED; cv.setViewportTransform(cv.viewportTransform); saveView(); });
  var zoomTo = function (z, x, y) { cv.zoomToPoint(new F.Point(x, y), Math.max(0.15, Math.min(5, z))); grid(); cv.requestRenderAll(); };
  cv.on('mouse:wheel', function (o) { var e = o.e; e.preventDefault(); e.stopPropagation(); if (e.ctrlKey || !e.deltaX) zoomTo(cv.getZoom() * Math.pow(0.998, e.deltaY), e.offsetX, e.offsetY); else { var v = cv.viewportTransform; v[4] -= e.deltaX; v[5] -= e.deltaY; grid(); cv.requestRenderAll(); } saveView(); });
  var up = cv.upperCanvasEl, pin = null;
  var two = function (e) { var r = up.getBoundingClientRect(), a = e.touches[0], b = e.touches[1]; return { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), an: Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX), x: (a.clientX + b.clientX) / 2 - r.left, y: (a.clientY + b.clientY) / 2 - r.top }; };
  up.addEventListener('touchstart', function (e) { if (e.touches.length !== 2) return; var t = two(e), a = cv.getActiveObject();
    var on = a && a.daKind !== 'tpl' && !a.isEditing && a.containsPoint(cv.restorePointerVpt(new F.Point(t.x, t.y)));
    pin = Object.assign(t, { z: cv.getZoom(), o: on ? a : null, sx: on ? a.scaleX : 0, sy: on ? a.scaleY : 0, ang: on ? a.angle : 0 }); pan = null; e.preventDefault(); }, { passive: false });
  up.addEventListener('touchmove', function (e) { if (!pin || e.touches.length !== 2) return; e.preventDefault(); var n = two(e), k = n.d / Math.max(1, pin.d);
    if (pin.o) { var c = pin.o.getCenterPoint(); pin.o.set({ scaleX: Math.max(0.05, pin.sx * k), scaleY: Math.max(0.05, pin.sy * k), angle: pin.ang + (n.an - pin.an) * 180 / Math.PI }); pin.o.setPositionByOrigin(c, 'center', 'center'); pin.o.setCoords(); follow(); cv.requestRenderAll(); return; }
    zoomTo(pin.z * k, n.x, n.y); var v = cv.viewportTransform; v[4] += n.x - pin.x; v[5] += n.y - pin.y; pin.x = n.x; pin.y = n.y; grid(); }, { passive: false });
  up.addEventListener('touchend', function (e) { if (pin && e.touches.length < 2) { if (pin.o) cv.fire('object:modified', { target: pin.o }); pin = null; cv.setViewportTransform(cv.viewportTransform); saveView(); } });
  var vT = 0; function saveView() { clearTimeout(vT); vT = setTimeout(function () { tx('readwrite', function (s) { s.put({ id: at, objects: JSON.parse(last), v: cv.viewportTransform.slice() }); }); }, 600); }
  function bounds() { var os = cv.getObjects().filter(function (o) { return o.visible && o.daKind !== 'link'; }); if (!os.length) return null; var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; os.forEach(function (o) { var r = o.getBoundingRect(true, true); x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.left + r.width); y1 = Math.max(y1, r.top + r.height); }); return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; }
  /* the view moved, gently, so what was just added sits in the middle of the screen */
  function look(o) { if (!o) return; var c = o.getCenterPoint(), v = cv.viewportTransform.slice(), tx = cv.getWidth() / 2 - c.x * v[0], ty = cv.getHeight() * 0.42 - c.y * v[3], x0 = v[4], y0 = v[5], t0 = performance.now();
    (function step(t) { var k = Math.min(1, (t - t0) / 320), e = 1 - Math.pow(1 - k, 3); v[4] = x0 + (tx - x0) * e; v[5] = y0 + (ty - y0) * e; cv.setViewportTransform(v.slice()); grid(); if (k < 1) requestAnimationFrame(step); })(t0); }
  function fit() { var b = bounds(); if (!b) { cv.setViewportTransform([1, 0, 0, 1, 0, 0]); grid(); return; } var z = Math.min(2, Math.min((cv.getWidth() - 60) / b.w, (cv.getHeight() - 120) / b.h)); cv.setViewportTransform([z, 0, 0, z, (cv.getWidth() - b.w * z) / 2 - b.x * z, (cv.getHeight() - b.h * z) / 2 - b.y * z + 20]); grid(); saveView(); }

  /* ───── the boards: several, named, each kept ───── */
  function openBoard(id) { at = id; keepList(); var b = LIST.filter(function (x) { return x.id === id; })[0]; $('#bname').textContent = b ? b.n : 'BOARD';
    HIST = []; key('undo').disabled = true; tx('readonly', function (s) { return s.get(id); }).then(function (r) { load(r && r.objects, function () { if (r && r.v) { cv.setViewportTransform(r.v); grid(); } else if (!r || !(r.objects || []).length) { cv.setViewportTransform([1, 0, 0, 1, 0, 0]); grid(); } }); }).catch(function () { load([]); }); }
  function newBoard() { var n = 'BOARD ' + String(LIST.length + 1).padStart(2, '0'), id = uid(); LIST.push({ id: id, n: n, t: Date.now() }); keepList(); openBoard(id); }
  $('#bname').addEventListener('click', function (e) { e.stopPropagation(); var m = $('#menu'); if (!m.hidden) { m.hidden = true; return; }
    m.innerHTML = LIST.map(function (b) { return '<button type="button" data-b="' + b.id + '" class="' + (b.id === at ? 'on' : '') + '">' + b.n.replace(/[<>&]/g, '') + '</button>'; }).join('') + '<hr><button type="button" data-b="+">NEW BOARD</button><button type="button" data-b="rn">RENAME</button>' + (LIST.length > 1 ? '<button type="button" data-b="x">TAKE THIS BOARD AWAY</button>' : '');
    m.hidden = false; });
  $('#menu').addEventListener('click', function (e) { var b = e.target.closest('[data-b]'); if (!b) return; var k = b.dataset.b; this.hidden = true;
    if (k === '+') newBoard(); else if (k === 'rn') { var cur = LIST.filter(function (x) { return x.id === at; })[0], n = prompt('Name', cur ? cur.n : ''); if (n && n.trim() && cur) { cur.n = n.trim().toUpperCase().slice(0, 24); keepList(); $('#bname').textContent = cur.n; } }
    else if (k === 'x') { if (!confirm('Take this board away? Its pieces go with it.')) return; tx('readwrite', function (s) { s.delete(at); }); LIST = LIST.filter(function (x) { return x.id !== at; }); keepList(); openBoard(LIST[0].id); }
    else openBoard(k); });
  D.addEventListener('click', function (e) { if (!e.target.closest('#menu, #bname')) $('#menu').hidden = true; if (!e.target.closest('#pr, [data-t="out"]')) $('#pr').hidden = true; });

  /* ───── OUT: the board as a picture, saved or printed on a printer that is on ───── */
  function picture(w) { var b = bounds(); if (!b) return null; var hide = cv.getObjects().filter(function (o) { return o.daKind === 'tpl' && !o.visible; }); var v = cv.viewportTransform.slice(), pad = 24, k = Math.min(3, w / (b.w + pad * 2));
    cv.discardActiveObject(); cv.setViewportTransform([1, 0, 0, 1, 0, 0]); var bg = cv.backgroundColor; cv.backgroundColor = '#FFFFFF'; var u = cv.toDataURL({ left: b.x - pad, top: b.y - pad, width: b.w + pad * 2, height: b.h + pad * 2, multiplier: k, format: 'png' }); cv.backgroundColor = bg; cv.setViewportTransform(v); hide.length; return u; }
  function empty() { $('#prst').textContent = 'ADD SOMETHING FIRST'; }
  /* alone: the phone's own print, to any printer it knows */
  function here(u) { var w = window.open('', '_blank'); if (!w) { $('#prst').textContent = 'ALLOW POP-UPS'; return; } w.document.write('<title>board</title><style>@page{margin:0}body{margin:0}img{width:100%}</style><img src="' + u + '" onload="setTimeout(function(){print()},200)">'); w.document.close(); }
  $('#prpng').addEventListener('click', function () { var u = picture(2400); if (!u) return empty(); var a = D.createElement('a'); a.href = u; a.download = ($('#bname').textContent || 'board').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.png'; D.body.appendChild(a); a.click(); a.remove(); });
  function printers() { var sel2 = $('#prto'); $('#prst').textContent = ''; if (!NG || !NG.printAgain) { sel2.innerHTML = '<option>THIS PHONE</option>'; sel2.disabled = true; $('#prgo').disabled = false; return; }
    fetch('/api/partners').then(function (r) { return r.json(); }).then(function (j) { var last0 = NG.store ? NG.store.get('da.base.printer', '') : ''; var on = (j.partners || []).filter(function (p) { return p.ready || p.id === 'novelglobal'; });
      sel2.innerHTML = on.length ? on.map(function (p) { return '<option value="' + p.id + '"' + (p.id === last0 ? ' selected' : '') + '>' + String(p.name || p.id).toUpperCase().replace(/[<>&]/g, '') + (p.ready ? '' : ' · WAITS') + '</option>'; }).join('') : '<option value="">NO PRINTER ON</option>'; $('#prgo').disabled = !on.length; }).catch(function () {}); }
  $('#prgo').addEventListener('click', function () { var b = this, st = $('#prst'), u = picture(1024); if (!u) return empty(); if (!NG || !NG.printAgain) return here(u); b.disabled = true; try { NG.store.set('da.base.printer', $('#prto').value); } catch (e) { /* first on */ }
    st.innerHTML = NG.pips ? NG.pips('sending') : '…'; NG.printAgain(u, 'board').then(function (s) { st.innerHTML = NG.pips ? NG.pips(s) : s; }).catch(function (e) { st.innerHTML = NG.pips ? NG.pips(e && e.status ? 'failed' : 'outbox') : '✕'; }).then(function () { b.disabled = false; }); });

  /* ───── wired to W.I.S.H.: its form is the ground the board is built on ───── */
  function form(words, img) {
    cv.getObjects().filter(function (o) { return o.daKind === 'tpl'; }).forEach(function (o) { cv.remove(o); });
    var parts = [new F.Rect({ left: 0, top: 0, width: 720, height: 1000, fill: '#FFFFFF', stroke: INK, strokeWidth: 2 }), new F.Rect({ left: 0, top: 210, width: 720, height: 5, fill: INK })];
    for (var i = 0; i < 16; i++) parts.push(new F.Rect({ left: 24, top: 270 + i * 44, width: 672, height: 1, fill: INK, opacity: 0.35 }));
    parts.push(new F.Rect({ left: 170, top: 230, width: 1, height: 750, fill: INK, opacity: 0.35 }));
    parts.push(new F.Textbox(String(words || '').toUpperCase(), { left: 24, top: 24, width: img ? 470 : 672, fontSize: 44, lineHeight: .95, fontFamily: 'Archivo Narrow', fontWeight: 600, fill: INK }));
    var g = new F.Group(parts, { left: -40, top: -40, selectable: false, evented: false, daKind: 'tpl', daId: 'tpl', excludeFromExport: false });
    cv.add(g); cv.sendToBack(g); key('form').hidden = false;
    if (img) F.Image.fromURL(img, function (im) { if (!im || !im.width) return; var k = Math.min(180 / im.width, 180 / im.height); im.set({ left: -40 + 720 - 24 - im.width * k, top: -16, scaleX: k, scaleY: k, selectable: false, evented: false, daKind: 'tpl' }); cv.add(im); cv.sendToBack(im); cv.sendToBack(g); cv.requestRenderAll(); });
    cv.requestRenderAll();
  }
  addEventListener('message', function (e) { if (e.origin !== location.origin || !e.data || e.data.hm !== 'form') return; form(e.data.words, e.data.img); });
  if (WISH) form('', '');

  /* start */
  size();
  if (!LIST.length) { LIST.push({ id: uid(), n: 'BOARD 01', t: Date.now() }); keepList(); }
  if (!LIST.some(function (b) { return b.id === at; })) at = LIST[0].id;
  if (D.fonts && D.fonts.load) D.fonts.load('600 24px "Archivo Narrow"').then(function () { cv.getObjects().forEach(function (o) { if (o.initDimensions) o.initDimensions(); }); cv.requestRenderAll(); });
  openBoard(at);
  /* the first time: three taps, written and drawn by hand, each pointing at what it means (inside novel.global the home draws them) */
  var TIPS = [['paste', 'copy a picture anywhere, then paste it here'], ['link', 'tap two things to tie a string between them'], ['out', 'print the board, or keep it as a picture']];
  function guide(i) { var g = $('#guide'); if (i >= TIPS.length) { if (g) g.remove(); try { localStorage.setItem('da.rb.guide', '1'); } catch (e) { /* this visit */ } return; }
    if (!g) { g = D.createElement('div'); g.id = 'guide'; D.body.appendChild(g); g.addEventListener('click', function () { guide(+g.dataset.i + 1); }); }
    g.dataset.i = i; var b = TIPS[i][0] && $('#tools [data-t="' + TIPS[i][0] + '"]'), r = b ? b.getBoundingClientRect() : null, W = innerWidth, Hh = innerHeight;
    if (b) b.scrollIntoView({ inline: 'center', block: 'nearest' }); r = b ? b.getBoundingClientRect() : null;
    var tx = r ? r.left + r.width / 2 : W / 2, ty = r ? r.top - 6 : Hh * 0.5, sx = Math.min(W - 40, Math.max(40, W * 0.5)), sy = Hh * 0.42;
    g.innerHTML = '<svg width="' + W + '" height="' + Hh + '">' + (r ? '<path d="M' + sx + ' ' + (sy + 34) + ' Q' + ((sx + tx) / 2 + 40) + ' ' + ((sy + ty) / 2) + ' ' + tx + ' ' + ty + '"/><path d="M' + (tx - 9) + ' ' + (ty - 14) + ' L' + tx + ' ' + ty + ' L' + (tx + 11) + ' ' + (ty - 12) + '"/>' : '<path d="M' + (W / 2 - 70) + ' ' + (sy + 70) + ' l40 -30 M' + (W / 2 + 70) + ' ' + (sy + 70) + ' l-40 -30"/><circle cx="' + (W / 2 - 74) + '" cy="' + (sy + 74) + '" r="12"/><circle cx="' + (W / 2 + 74) + '" cy="' + (sy + 74) + '" r="12"/>') + '</svg>' +
      '<p style="top:' + (sy - 30) + 'px">' + TIPS[i][1] + '</p><b>' + (i + 1) + ' / ' + TIPS.length + '</b>'; }
  try { if (!/[?&]in=1/.test(location.search) && !localStorage.getItem('da.rb.guide')) setTimeout(function () { guide(0); }, 500); } catch (e) { /* no storage */ }
})();

/* a Meshtastic radio by USB or Bluetooth: text lines only. Own code from the public client API, MIT */
(function () {
  'use strict';
  var SVC = '6ba1b218-15a8-461f-9fa8-5dcae273eafd', TO = 'f75c76d2-129e-4dad-a1dd-7866124401e7', FROM = '2c55e69e-4993-11ed-b878-0242ac120002', NUM = 'ed9da18b-a800-4f66-a670-aa7547e34453';
  var TEXT = 1, ALL = 0xFFFFFFFF, MAX = 200;
  var enc = new TextEncoder(), dec = new TextDecoder();

  /* ───────── protobuf, the few pieces used ───────── */
  function varint(n, o) { n = n >>> 0; while (n > 127) { o.push((n & 127) | 128); n >>>= 7; } o.push(n); return o; }
  function fixed32(n, o) { o.push(n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255); return o; }
  function bytes(field, b, o) { varint(field << 3 | 2, o); varint(b.length, o); for (var i = 0; i < b.length; i++) o.push(b[i]); return o; }
  /* a message as {field: [wire, value]}: wire 0 a varint, 2 bytes, 5 a fixed32 */
  function read(u) { var i = 0, out = {}, v = function () { var r = 0, s = 0, c; do { c = u[i++]; r += (c & 127) * Math.pow(2, s); s += 7; } while (c & 128 && i < u.length); return r; };
    while (i < u.length) { var k = v(), f = Math.floor(k / 8), w = k & 7, val;
      if (w === 0) val = v(); else if (w === 2) { var n = v(); val = u.subarray(i, i + n); i += n; } else if (w === 5) { val = (u[i] | u[i + 1] << 8 | u[i + 2] << 16 | u[i + 3] << 24) >>> 0; i += 4; } else if (w === 1) { val = u.subarray(i, i + 8); i += 8; } else break;
      (out[f] = out[f] || []).push(val); }
    return out; }
  var one = function (m, f) { return m[f] ? m[f][0] : undefined; };

  /* ToRadio { packet: MeshPacket { to: all, id, hop_limit: 3, decoded: Data { portnum: TEXT, payload } } } */
  /* a line cut to what one packet holds, on a whole character */
  function cut(line) { var b = enc.encode(String(line)), n = Math.min(b.length, MAX); if (n < b.length) while (n > 0 && (b[n] & 0xC0) === 0x80) n--; return b.subarray(0, n); }
  function textOut(line) { var b = cut(line);
    var data = bytes(2, b, varint(1 << 3, []).concat(varint(TEXT, []))), pk = [];
    varint(2 << 3 | 5, pk); fixed32(ALL, pk); bytes(4, data, pk); varint(6 << 3 | 5, pk); fixed32((Math.random() * 0xFFFFFFFF) >>> 0, pk); varint(9 << 3, pk); varint(3, pk);
    return new Uint8Array(bytes(1, pk, [])); }
  /* ToRadio { want_config_id }: the radio then sends who it is, the nodes it knows, and every packet after */
  var hello = function () { return new Uint8Array(varint(3 << 3, []).concat(varint((Math.random() * 0x7FFFFFFF) >>> 0, []))); };
  var frame = function (p) { var o = new Uint8Array(p.length + 4); o[0] = 0x94; o[1] = 0xC3; o[2] = p.length >> 8; o[3] = p.length & 255; o.set(p, 4); return o; };

  /* ───────── the link ───────── */
  var L = { name: '', me: 0, nodes: {}, on: false, send: null, close: null }, hear = [];
  /* FromRadio: 2 a packet, 3 my info, 4 a node's info */
  function got(u) { var m = read(u), pk = one(m, 2), me = one(m, 3), ni = one(m, 4); if (one(m, 8) && L.again) L.again();
    if (me) L.me = one(read(me), 1) || 0;
    if (ni) { var n = read(ni), num = one(n, 1), us = one(n, 2); if (num != null && us) { var x = read(us), sn = one(x, 3); if (sn) L.nodes[num] = dec.decode(sn); } }
    if (pk) { var p = read(pk), d = one(p, 4), from = one(p, 1); if (!d || from === L.me) return; var dd = read(d); if (one(dd, 1) !== TEXT) return; var pl = one(dd, 2); if (!pl) return;
      var who = L.nodes[from] || ('!' + ('00000000' + (from >>> 0).toString(16)).slice(-8)); hear.forEach(function (f) { f(dec.decode(pl), who); }); } }
  function up(name, send, close, again) { L.name = name; L.on = true; L.send = send; L.close = close; L.again = again; }
  function down() { if (!L.on && !L.send) return; L.on = false; L.send = L.close = L.again = null; L.name = ''; clearInterval(L.beat); hear.forEach(function (f) { f(null); }); }
  /* ToRadio { heartbeat }: a serial client says it is still there, or the radio stops passing it packets */
  var beat = new Uint8Array([7 << 3 | 2, 0]), noop = function () {};

  /* USB: frames on a serial line; whatever else the radio prints (its own log) is passed over */
  function serial() { return navigator.serial.requestPort().then(function (port) { var op = port.open({ baudRate: 115200, bufferSize: 4096 }).catch(function (e) { if (e && e.name === 'InvalidStateError') return port.close().catch(noop).then(function () { return port.open({ baudRate: 115200, bufferSize: 4096 }); }); throw e; });
    return op.then(function () {
    var w = port.writable.getWriter(), r = port.readable.getReader(), buf = [], live = true;
    var put = function (p) { return w.write(frame(p)); };
    var end = function () { if (!live) return Promise.resolve(); live = false; clearInterval(L.beat); return r.cancel().catch(noop).then(function () { try { r.releaseLock(); } catch (e) { /* gone */ } try { w.releaseLock(); } catch (e) { /* gone */ } return port.close(); }).catch(noop).then(down); };
    (function pump() { r.read().then(function (x) { if (x.done || !live) { end(); return; } var v = x.value; for (var i = 0; i < v.length; i++) buf.push(v[i]);
      for (;;) { var s = -1; for (var j = 0; j + 1 < buf.length; j++) if (buf[j] === 0x94 && buf[j + 1] === 0xC3) { s = j; break; }
        if (s < 0) { buf = buf.slice(-1); break; } if (s) buf = buf.slice(s); if (buf.length < 4) break; var n = buf[2] << 8 | buf[3]; if (n > 512) { buf = buf.slice(2); continue; }
        if (buf.length < 4 + n) break; got(new Uint8Array(buf.slice(4, 4 + n))); buf = buf.slice(4 + n); }
      pump(); }, end); })();
    var wake = new Uint8Array(32); wake.fill(0xC3);
    return w.write(wake).then(function () { return put(hello()); }).then(function () {
      up('USB', function (line) { return put(textOut(line)); }, end, function () { return put(hello()); }); L.beat = setInterval(function () { if (live) w.write(frame(beat)).catch(noop); }, 300e3); }); }); }); }

  /* Bluetooth: the protobuf alone, written to ToRadio; FromRadio read until empty whenever FromNum says there is more */
  function ble() { return navigator.bluetooth.requestDevice({ filters: [{ services: [SVC] }] }).then(function (dev) { return dev.gatt.connect().then(function (g) { return g.getPrimaryService(SVC); }).then(function (s) {
    return Promise.all([s.getCharacteristic(TO), s.getCharacteristic(FROM), s.getCharacteristic(NUM)]).then(function (c) { var to = c[0], from = c[1], num = c[2], busy = false, again = false, q = Promise.resolve();
      var gatt = function (op) { var p = q.then(op); q = p.catch(noop); return p; }, put = function (u) { return gatt(function () { return to.writeValueWithResponse ? to.writeValueWithResponse(u) : to.writeValue(u); }); };
      var drain = function () { if (busy) { again = true; return; } busy = true; again = false; (function next() { gatt(function () { return from.readValue(); }).then(function (v) { if (!v.byteLength) { if (again) { again = false; return next(); } busy = false; return; } got(new Uint8Array(v.buffer, v.byteOffset, v.byteLength)); next(); }, function () { busy = false; }); })(); };
      dev.addEventListener('gattserverdisconnected', down);
      return num.startNotifications().then(function () { num.addEventListener('characteristicvaluechanged', drain); return put(hello()); }).then(function () { drain();
        up('BLUETOOTH', function (line) { return put(textOut(line)).then(drain); }, function () { try { dev.gatt.disconnect(); } catch (e) { /* gone */ } down(); return Promise.resolve(); }, function () { return put(hello()).then(drain); }); }); }); }); }); }

  window.MESH = { link: L, max: MAX, usb: !!(navigator.serial && navigator.serial.requestPort), bt: !!(navigator.bluetooth && navigator.bluetooth.requestDevice),
    serial: serial, ble: ble, cut: function (line) { return dec.decode(cut(line)); }, hear: function (f) { hear.push(f); }, say: function (line) { return L.send ? L.send(line) : Promise.reject(new Error('no radio')); },
    /* for the checks: the bytes a line goes out as, and a packet read back */
    _out: function (line) { return frame(textOut(line)); }, _read: read };
})();

/* the radio anywhere: an island's own place, as its keeper sets it (its home's radio: a centre, how far, whose Country), or ?at=lat,lng,km
   in the link; with neither, the site's own place in config.js. Run after config.js and before the radio reads it */
(function (C) {
  try {
    var q = /[?&]at=(-?\d{1,2}(?:\.\d{1,6})?),(-?\d{1,3}(?:\.\d{1,6})?)(?:,(\d{1,2}(?:\.\d{1,2})?))?/.exec(location.search), a = null;
    if (q) a = { lat: +q[1], lng: +q[2], km: q[3] ? +q[3] : 3 };
    else { try { a = JSON.parse(localStorage.getItem('da.radio.at') || 'null'); } catch (e) { a = null; } }
    if (!a || !isFinite(a.lat) || !isFinite(a.lng) || Math.abs(a.lat) > 85 || Math.abs(a.lng) > 180) return;
    var km = Math.max(0.5, Math.min(30, +a.km || 3)), dy = km / 111.32, dx = km / (111.32 * Math.max(0.1, Math.cos(a.lat * Math.PI / 180)));
    var B = C.BBOX, home = a.lat > B.s - 0.3 && a.lat < B.n + 0.3 && a.lng > B.w - 0.3 && a.lng < B.e + 0.3;
    C.BBOX = { s: a.lat - dy, w: a.lng - dx, n: a.lat + dy, e: a.lng + dx };
    C.SCAN.lat = a.lat; C.SCAN.lng = a.lng; C.SCAN.r = Math.round(Math.max(C.SCAN.min, Math.min(C.SCAN.max, km * 1000 / 6)));
    C.WEATHER_URL = C.WEATHER_URL.replace(/latitude=[^&]*/, 'latitude=' + a.lat.toFixed(3)).replace(/longitude=[^&]*/, 'longitude=' + a.lng.toFixed(3)).replace(/timezone=[^&]*/, 'timezone=auto');
    /* away from the site's own place: no city data that is only Melbourne's, and the Country its keeper names (none until they do) */
    if (!home) {
      C.OVERLAYS = []; C.COUNTRY = String(a.country || '').toUpperCase().slice(0, 60); C.SOVEREIGNTY = String(a.sov || '').toUpperCase().slice(0, 60);
      C.COUNTRIES = C.COUNTRY ? [{ id: 'here', n: String(a.country).slice(0, 60), s: String(a.sov || '').slice(0, 60) }] : [{ id: 'here', n: '', s: '' }];
      if (a.lat < -33 && a.lat > -48 && a.lng > 165 && a.lng < 179) C.PLACE_PREF = 6803;   // Aotearoa New Zealand's common names
    }
    C.AT = { lat: a.lat, lng: a.lng, km: km, home: home };
  } catch (e) { /* the site's own place */ }
})(window.DA_CONFIG);

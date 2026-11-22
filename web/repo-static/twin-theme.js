/* the twin opens in the site's own day or night, before it draws */
try { var n0 = JSON.parse(localStorage.getItem('da.hm.night')); if (n0 == null) n0 = matchMedia('(prefers-color-scheme: dark)').matches; if (n0) document.documentElement.className = 'night'; } catch (e) { /* day */ }

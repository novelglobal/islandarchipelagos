/* the twin lives inside the home, under its top bar: opened on its own (a link, a slip's code) it keeps the key and goes there; a local build stays */
try { var h0 = location.hostname; if (window.top === window && !(h0 === 'localhost' || h0 === '127.0.0.1' || h0.slice(-5) === '.test')) { var k0 = /(?:^#|&)k=([A-Za-z0-9_-]{16,64})/.exec(location.hash); if (k0) localStorage.setItem('da.hm.key', JSON.stringify(k0[1]));
  location.replace('/#twin' + (/[?&]isle=test/.test(location.search) ? '=test' : '')); } } catch (e) { /* stays */ }
try { var q0 = location.search, m0 = /[?&]night=([01])/.exec(q0), n0 = m0 ? m0[1] === '1' : JSON.parse(localStorage.getItem('da.hm.night')); if (n0 == null) n0 = matchMedia('(prefers-color-scheme: dark)').matches;
  var c0 = n0 ? 'night' : ''; if (/[?&]in=1/.test(q0) && window.top !== window) c0 += ' in'; document.documentElement.className = c0.trim(); } catch (e) { /* day */ }

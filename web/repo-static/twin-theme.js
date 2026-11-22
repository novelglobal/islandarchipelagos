try { var q0 = location.search, m0 = /[?&]night=([01])/.exec(q0), n0 = m0 ? m0[1] === '1' : JSON.parse(localStorage.getItem('da.hm.night')); if (n0 == null) n0 = matchMedia('(prefers-color-scheme: dark)').matches;
  var c0 = n0 ? 'night' : ''; if (/[?&]in=1/.test(q0) && window.top !== window) c0 += ' in'; document.documentElement.className = c0.trim(); } catch (e) { /* day */ }

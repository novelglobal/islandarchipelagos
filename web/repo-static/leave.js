/* a link that leaves novel.global asks first, then opens in a tab of its own */
(function () {
  if (window.__leave) return; window.__leave = 1;
  var D = document, OWN = /(^|\.)novel\.global$|^localhost$|^127\.0\.0\.1$|\.workers\.dev$|\.pages\.dev$/;
  var css = '#lv-ask{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;background:rgba(8,10,12,.42);padding:16px}' +
    '#lv-ask>div{width:min(320px,100%);padding:18px 18px 14px;border-radius:12px;background:#F4F1E8;color:#0B0B0B;box-shadow:0 22px 48px -18px rgba(0,0,0,.6);font:500 12px/1.4 "IBM Plex Mono",ui-monospace,Menlo,monospace;letter-spacing:.06em}' +
    '#lv-ask b{display:block;font-size:11px;letter-spacing:.16em;opacity:.6}#lv-ask p{margin:6px 0 14px;word-break:break-all;font-size:13px}' +
    '#lv-ask span{display:flex;gap:8px;justify-content:flex-end}#lv-ask button{font:inherit;letter-spacing:.12em;padding:9px 16px;border-radius:999px;border:1.5px solid #0B0B0B;background:transparent;color:inherit;cursor:pointer}' +
    '#lv-ask button.go{background:#0B0B0B;color:#F4F1E8}';
  function ask(url) {
    var old = D.getElementById('lv-ask'); if (old) old.remove();
    if (!D.getElementById('lv-css')) { var st = D.createElement('style'); st.id = 'lv-css'; st.textContent = css; D.head.appendChild(st); }
    var el = D.createElement('div'); el.id = 'lv-ask'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Leaving novel.global');
    el.innerHTML = '<div><b>LEAVING</b><p></p><span><button type="button" class="no">STAY</button><button type="button" class="go">OPEN</button></span></div>';
    el.querySelector('p').textContent = url.hostname.replace(/^www\./, '');
    var shut = function () { el.remove(); removeEventListener('keydown', key, true); }, key = function (e) { if (e.key === 'Escape') { e.stopPropagation(); shut(); } };
    el.addEventListener('click', function (e) { if (e.target.closest('.go')) { window.open(url.href, '_blank', 'noopener,noreferrer'); shut(); return; } if (e.target.closest('.no') || e.target === el) shut(); });
    addEventListener('keydown', key, true); D.body.appendChild(el); el.querySelector('.go').focus();
  }
  /* a toolbar wider than a phone: its far edge fades while there is more, and the first two times it is met it leans along and says so */
  window.swipeHint = function (el, key) {
    if (!el || el.__sw || !matchMedia('(max-width: 759px)').matches) return; el.__sw = 1;
    var edge = function () { var more = el.scrollWidth - el.clientWidth - el.scrollLeft > 8; el.style.webkitMaskImage = el.style.maskImage = more ? 'linear-gradient(to right, #000 82%, transparent)' : ''; };
    el.addEventListener('scroll', edge, { passive: true }); addEventListener('resize', edge); edge();
    var n = 0; try { n = +localStorage.getItem('da.swipe.' + key) || 0; } catch (e) { n = 2; } if (n >= 2 || el.scrollWidth - el.clientWidth < 24) return;
    try { localStorage.setItem('da.swipe.' + key, n + 1); } catch (e) { /* this visit only */ }
    var r = el.getBoundingClientRect(), p = D.createElement('div'); p.textContent = 'SWIPE ›';
    p.style.cssText = 'position:fixed;z-index:2147482000;right:10px;top:' + Math.round(r.top + r.height / 2 - 13) + 'px;height:26px;padding:0 12px;display:flex;align-items:center;border-radius:999px;background:#0B0B0B;color:#F4F1E8;font:500 10px/1 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.14em;pointer-events:none;opacity:0;transition:opacity .3s ease';
    D.body.appendChild(p); requestAnimationFrame(function () { p.style.opacity = 1; });
    var room = el.scrollWidth - el.clientWidth; setTimeout(function () { el.scrollTo({ left: Math.min(120, room), behavior: 'smooth' }); setTimeout(function () { el.scrollTo({ left: 0, behavior: 'smooth' }); }, 900); }, 500);
    var go = function () { p.style.opacity = 0; setTimeout(function () { p.remove(); }, 320); }; setTimeout(go, 3200); el.addEventListener('scroll', function () { setTimeout(go, 900); }, { once: true, passive: true });
  };
  D.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]'); if (!a || a.hasAttribute('download')) return;
    var u; try { u = new URL(a.getAttribute('href'), location.href); } catch (er) { return; }
    if (!/^https?:$/.test(u.protocol) || u.origin === location.origin || OWN.test(u.hostname)) return;
    e.preventDefault(); e.stopImmediatePropagation(); ask(u);
  }, true);
})();

/* the way home from any page reached on its own (a printed code, a link): a small mark top left back to the home, which opens on the
   island its visitor set as theirs, as they left it. Not shown inside the home's own sheet, which has its own way back */
(function () {
  try { if (window.top !== window) return; } catch (e) { return; }
  if (/[?&]in=1\b/.test(location.search)) return;
  /* data-top: a page with its own mark in the corner puts this one under it; data-pad: a page that starts in the corner moves down for it */
  var me = document.currentScript, top = me && +me.dataset.top || 0, pad = me && me.hasAttribute('data-pad');
  var go = function () {
    if (document.querySelector('[data-home-back]')) return;
    var a = document.createElement('a'); a.href = '/'; a.setAttribute('data-home-back', ''); a.setAttribute('aria-label', 'novel.global'); a.textContent = '←';
    if (pad) document.body.style.paddingTop = 'calc(' + (getComputedStyle(document.body).paddingTop || '0px') + ' + 36px)';
    a.style.cssText = 'position:fixed;top:calc(max(8px,env(safe-area-inset-top)) + ' + top + 'px);left:max(8px,env(safe-area-inset-left));z-index:2147483000;min-width:36px;min-height:36px;display:grid;place-items:center;'
      + 'font:600 16px/1 "IBM Plex Mono",ui-monospace,monospace;color:#fff;mix-blend-mode:difference;text-decoration:none;opacity:.85;-webkit-tap-highlight-color:transparent';
    document.body.appendChild(a);
  };
  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
})();

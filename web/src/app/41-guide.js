/* ════════════════════════════════════════════════════════════════════
   THE GUIDE KEY — a modded key beside the jellyfish on the radio, both faces. It opens the guide over the radio's own screen:
   every species met here, and lists to go out and find (ten local at random, the season, the month's birds, the curated, what is
   spotted). A tick is a sighting, kept on this phone (spot.js) and shown on the SPECIES LIST card, where it is printed and shared
   ════════════════════════════════════════════════════════════════════ */
const SP = window.SPOT || null;
const GD = { k: 'birds', q: '', open: null, ids: null };
const GD_TABS = ['local', 'season', 'birds', 'curated', 'mine', 'all'];
const gdCur = () => { try { return JSON.parse(localStorage.getItem('da.species.cur') || 'null'); } catch (e) { return null; } };
const huntLeft = () => { const h = SP && SP.hunt(), got = SP ? SP.all() : {}; return h && Array.isArray(h.ids) ? h.ids.filter(id => !got[id]).length : 0; };
const guideKey = () => (SP ? `<button type="button" class="gd-k${huntLeft() ? ' on' : ''}" data-guide aria-label="The guide: species to find" data-tip="Guide"><i class="gd-led" aria-hidden="true"></i><b>GUIDE</b></button>` : '');
const KIND_W = { bird: 'bird', parrot: 'parrot', waterbird: 'waterbird', owl: 'owl', raptor: 'raptor', macropod: 'kangaroo', possum: 'possum', flyingfox: 'flying-fox', bat: 'microbat', frog: 'frog', lizard: 'lizard', snake: 'snake', butterfly: 'butterfly', bee: 'bee', spider: 'spider', dragonfly: 'dragonfly' };
/* the list on show: a hunt kept keeps its own names, so a random ten stays the same ten until asked for again */
function gdList() {
  if (!SP) return [];
  if (GD.k === 'all') { const q = GD.q.trim().toLowerCase(); const l = FIELD.slice().sort((a, b) => String(a.cn).localeCompare(b.cn)); return q.length > 1 ? l.filter(f => [f.cn, f.n, f.g, f.where].join(' ').toLowerCase().includes(q)) : l; }
  const h = SP.hunt(); if (h && h.k === GD.k && Array.isArray(h.ids) && GD.k !== 'mine') { const by = new Map(FIELD.map(f => [f.id, f])); const l = h.ids.map(id => by.get(id)).filter(Boolean); if (l.length) return l; }
  if (GD.k === 'local' && GD.ids) { const by = new Map(FIELD.map(f => [f.id, f])); return GD.ids.map(id => by.get(id)).filter(Boolean); }
  const l = SP.list(GD.k, FIELD, gdCur()); if (GD.k === 'local') GD.ids = l.map(f => f.id); return l;
}
function gdHTML() {
  const l = gdList(), got = SP.all(), n = l.filter(f => got[f.id]).length, h = SP.hunt(), on = h && h.k === GD.k;
  return `<div class="gd-in" role="dialog" aria-label="Guide"><header><b>GUIDE</b><span class="gd-n mono" title="Spotted on this list">${n}/${l.length}</span><button type="button" class="gd-x" data-gd-x aria-label="Close the guide">×</button></header>`
    + `<nav class="gd-t">${GD_TABS.map(k => `<button type="button" data-gd-tab="${k}" aria-pressed="${GD.k === k}"${k === 'birds' ? ` title="The ${SP.mon()} challenge: the same ten for everyone"` : ''}>${k === 'birds' ? `BIRDS · ${SP.mon()}` : SP.names[k]}</button>`).join('')}</nav>`
    + (GD.k === 'all' ? `<input class="gd-q" type="search" autocomplete="off" aria-label="Search the guide" placeholder="search" value="${esc(GD.q)}">` : '')
    + `<ol class="gd-l">${l.map(f => gdRow(f, got)).join('') || '<li class="none">—</li>'}</ol>`
    + `<footer>${GD.k === 'local' ? '<button type="button" data-gd-again title="Ten more, at random">AGAIN</button>' : ''}${GD.k !== 'all' ? `<button type="button" data-gd-hunt aria-pressed="${!!on}" title="Look for this list: it turns on the radio's screen">${on ? 'HUNTING' : 'HUNT'}</button>` : ''}<button type="button" class="go" data-gd-print title="Print it on the SPECIES LIST card">PRINT</button></footer></div>`;
}
function gdRow(f, got) {
  const op = GD.open === f.id, on = !!got[f.id];
  return `<li class="${on ? 'got' : ''}${op ? ' op' : ''}"><button type="button" class="gd-c" role="checkbox" aria-checked="${on}" data-gd-spot="${esc(f.id)}" aria-label="Spotted: ${esc(f.cn)}"><i></i></button>`
    + `<button type="button" class="gd-o" data-gd-open="${esc(f.id)}" aria-expanded="${op}"><b>${esc(f.cn)}</b><small>${esc(KIND_W[f.g] || f.g)}${f.event ? ' · ' + esc(f.event) : ''}</small></button>`
    + (op ? `<div class="gd-d"><i>${esc(f.n)}</i>${f.where ? `<p>${esc(cap(f.where))}</p>` : ''}${f.help ? `<p>${esc(cap(f.help))}</p>` : ''}</div>` : '') + '</li>';
}
function gdPaint(keepScroll) {
  const ov = $('#gd-ov'); if (!ov) return; const l = ov.querySelector('.gd-l'), y = l ? l.scrollTop : 0, q = document.activeElement && document.activeElement.classList.contains('gd-q');
  ov.innerHTML = gdHTML(); if (keepScroll) { const l2 = ov.querySelector('.gd-l'); if (l2) l2.scrollTop = y; }
  if (q) { const i = ov.querySelector('.gd-q'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }
}
function guideOpen(k) {
  if (!SP) return; const h = SP.hunt(); GD.k = k || (h && h.k) || GD.k; GD.open = null;
  let ov = $('#gd-ov'); if (!ov) { ov = document.createElement('div'); ov.id = 'gd-ov'; document.body.appendChild(ov); }
  ov.hidden = false; gdPaint(); requestAnimationFrame(() => ov.classList.add('on')); try { snd.tick(1500); } catch (e) { /* quiet */ }
}
function guideShut() { const ov = $('#gd-ov'); if (!ov) return; ov.classList.remove('on'); setTimeout(() => { if (!ov.classList.contains('on')) ov.hidden = true; }, 220); paintGuideKeys(); }
/* the list being looked for: kept, so the radio's screen and the card show it too */
function gdHunt() { const l = gdList(); SP.hunt({ k: GD.k, ids: l.map(f => f.id), at: Date.now() }); }
function gdPrint() {
  gdHunt();
  /* inside novel.global's page: the SPECIES LIST card opens with this list on it, ready to print; alone, its own page */
  if (IN_AURA) { try { parent.postMessage({ hm: 'open', id: 'species' }, location.origin); guideShut(); return; } catch (e) { /* alone */ } }
  location.href = 'cart.html?c=species';
}
/* the key's light: on while a hunt has names still to find */
function paintGuideKeys() { if (!SP) return; const left = huntLeft(); document.querySelectorAll('.gd-k').forEach(b => b.classList.toggle('on', left > 0)); }
document.addEventListener('click', e => {
  const t = e.target; if (!t.closest) return;
  if (t.closest('[data-guide]')) { e.preventDefault(); guideOpen(); return; }
  const ov = t.closest('#gd-ov'); if (!ov) return;
  if (t === ov || t.closest('[data-gd-x]')) { guideShut(); return; }
  const tb = t.closest('[data-gd-tab]'); if (tb) { GD.k = tb.dataset.gdTab; GD.open = null; gdPaint(); return; }
  const sp = t.closest('[data-gd-spot]'); if (sp) { const f = FIELD.find(x => x.id === sp.dataset.gdSpot); const on = SP.set(sp.dataset.gdSpot, f && f.cn); try { snd.tick(on ? 1900 : 900); } catch (er) { /* quiet */ } gdPaint(true); paintGuideKeys(); return; }
  const op = t.closest('[data-gd-open]'); if (op) { GD.open = GD.open === op.dataset.gdOpen ? null : op.dataset.gdOpen; gdPaint(true); return; }
  if (t.closest('[data-gd-again]')) { GD.ids = null; const h = SP.hunt(); if (h && h.k === 'local') SP.hunt(null); gdPaint(); return; }
  if (t.closest('[data-gd-hunt]')) { const h = SP.hunt(); if (h && h.k === GD.k) SP.hunt(null); else gdHunt(); gdPaint(true); paintGuideKeys(); return; }
  if (t.closest('[data-gd-print]')) { gdPrint(); }
});
document.addEventListener('input', e => { if (e.target.classList && e.target.classList.contains('gd-q')) { GD.q = e.target.value; gdPaint(); } });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#gd-ov.on')) { e.stopPropagation(); guideShut(); } }, true);
addEventListener('da-spot', () => { paintGuideKeys(); if ($('#gd-ov.on')) gdPaint(true); });
/* the radio's screen, on its turn: one name still to find from the hunt (or the month's birds), SPOT · NAME; a touch opens the guide */
function spotWords() {
  if (!SP || !FIELD.length) return ''; const got = SP.all(), h = SP.hunt();
  let ids = h && Array.isArray(h.ids) ? h.ids : SP.list('birds', FIELD).map(f => f.id); ids = ids.filter(id => !got[id]); if (!ids.length) return '';
  const f = FIELD.find(x => x.id === ids[Math.floor(Date.now() / 12000) % ids.length]); if (!f) return '';
  const nm = String(f.cn).toUpperCase(); const w = nm.split(' '), two = w.slice(-2).join(' '); return `SPOT · ${nm.length <= 13 ? nm : two.length <= 13 ? two : w.pop()}`;
}
document.addEventListener('click', e => { const c = e.target.closest && e.target.closest('#sec-heat .cd.gd'); if (!c) return; e.preventDefault(); e.stopImmediatePropagation(); guideOpen(); }, true);

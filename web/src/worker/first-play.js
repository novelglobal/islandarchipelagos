/* the first play put on an island with the engine (PL-2UQN), kept here so it can grow */
export const FIRST_PLAY = { code: 'PL-2UQN', n: 'SESAME', th: 'print', fr: 'stripe', first: true, by: 'Rehe. Sesame, No. 001. Third Island, waxing crescent, November 2026.', src: String.raw`const BY = "Rehe. Sesame, No. 001. Third Island, waxing crescent, November 2026.";
const plates = [
  ["strawberry", "black olive", "bird's-eye chilli"],
  ["sweet corn", "miso butter", "dark chocolate"],
  ["milk chocolate", "white miso", "cream"],
  ["dark chocolate", "black garlic", "cream cheese"],
  ["calamansi", "white miso", "cold cucumber"],
  ["cucumber", "nori", "roasted peanut"],
  ["fermented black bean", "dark chocolate", "orange"],
  ["ripe tomato", "elderflower", "sea salt"],
  ["cinnamon", "gruyère", "burnt onion"],
  ["ricotta", "taleggio", "hot honey"],
  ["cucumber", "green chilli", "lime"],
  ["cherry", "rose", "black pepper"]
];

const no = (i) => String(i + 1).padStart(2, "0");
const N = plates.length;
const names = () => keep("sesame_names") || {};
const nameOf = (i) => names()[i] || "";
const saved = () => keep("sesame_kept") || [];
const esc = (s) => String(s).replace(/[<>&"]/g, "");
const on = (s, fn) => { const b = document.querySelector(s); if (b) b.onclick = fn; };

function plate(i) {
  print(no(i));
  if (nameOf(i)) big(nameOf(i).toUpperCase());
  plates[i].forEach((x) => big(x));
  line();
}
function foot(all) {
  if (all) small(BY);
  qr("https://novel.global/play.html?c=PL-2UQN");
  small("novel.global");
  cut();
}

/* the menu as a printed card: cream type on the blue, pink for what is kept and named */
const CSS = "<style>" +
  "#k{padding:0;gap:0;align-items:stretch;font-family:ui-monospace,Menlo,Consolas,monospace}" +
  ".ss{display:flex;flex-direction:column;min-height:100vh;box-sizing:border-box;padding:16px 14px 18px}" +
  ".hd{display:flex;flex-direction:column;align-items:flex-start;gap:12px;padding-bottom:12px;margin-bottom:12px;border-bottom:1px solid rgba(244,241,232,.35)}" +
  ".hd h1{margin:0;font:700 clamp(34px,11vw,54px)/.9 Georgia,serif;letter-spacing:-.01em}" +
  ".row{display:flex;gap:6px;flex-wrap:wrap}" +
  "button{padding:8px 13px;font-size:11px;letter-spacing:.14em}" +
  "button.on{background:#F2B6C6;border-color:#F2B6C6;color:#17457F}" +
  ".grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;align-content:start}" +
  ".tile{display:flex;flex-direction:column;align-items:stretch;gap:6px;padding:9px 8px 10px;border-radius:8px;border:1px solid rgba(244,241,232,.28);min-height:86px;text-align:left;letter-spacing:0;font-weight:400}" +
  ".tile:hover,.tile:focus-visible{border-color:#F4F1E8;background:rgba(244,241,232,.07)}" +
  ".tile:active{background:rgba(244,241,232,.14);color:inherit}" +
  ".tile b{display:flex;justify-content:space-between;align-items:center;font:600 10px/1 ui-monospace,Menlo,monospace;letter-spacing:.2em;opacity:.75}" +
  ".tile.kept b::after{content:'';width:7px;height:7px;border-radius:50%;background:#F2B6C6}" +
  ".tile u{text-decoration:none;font:italic 400 12px/1.15 Georgia,serif;color:#F2B6C6}" +
  ".tile i{font:400 12.5px/1.2 Georgia,serif;font-style:normal}" +
  ".top{display:flex;align-items:center;justify-content:space-between;gap:8px}" +
  ".top b{font:600 11px/1 ui-monospace,monospace;letter-spacing:.24em;opacity:.75}" +
  ".ar{width:40px;height:40px;padding:0;display:grid;place-items:center;font-size:16px;letter-spacing:0}" +
  ".pl{flex:1;display:flex;flex-direction:column;justify-content:center;padding:14px 0;touch-action:pan-y;user-select:none}" +
  ".nm{margin:0 0 10px;min-height:26px;font:italic 400 clamp(18px,5.4vw,24px)/1.15 Georgia,serif;color:#F2B6C6}" +
  ".nm input{width:100%;box-sizing:border-box;font:italic 400 20px Georgia,serif;color:#F2B6C6;border-color:#F2B6C6}" +
  ".x{margin:0;padding:12px 0;font:700 clamp(28px,9.6vw,50px)/1.04 Georgia,serif;border-top:1px solid rgba(244,241,232,.3)}" +
  ".x:last-child{border-bottom:1px solid rgba(244,241,232,.3)}" +
  ".bar{display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap}" +
  "</style>";

function cover() {
  const k = saved();
  show(CSS + '<div class="ss"><div class="hd"><h1>SESAME</h1><div class="row">' +
    '<button data-s title="A plate at random">SURPRISE</button><button data-i title="Print all twelve">ISSUE</button></div></div><div class="grid">' +
    plates.map((p, i) => '<button class="tile' + (k.includes(i) ? " kept" : "") + '" data-p="' + i + '"><b>' + no(i) + "</b>" +
      (nameOf(i) ? "<u>" + esc(nameOf(i)) + "</u>" : "") + "<i>" + p.map(esc).join("<br>") + "</i></button>").join("") +
    "</div></div>");
  on("[data-s]", () => view(Math.floor(Math.random() * N)));
  on("[data-i]", () => { big("SESAME"); line(); plates.forEach((p, i) => plate(i)); foot(true); });
  document.querySelectorAll("[data-p]").forEach((b) => { b.onclick = () => view(+b.dataset.p); });
  document.onkeydown = null;
}

function view(i) {
  const kept = saved().includes(i);
  show(CSS + '<div class="ss"><div class="top"><button class="ar" data-b aria-label="All twelve" title="All twelve">&#8592;</button><b>' + no(i) + " / " + N + "</b></div>" +
    '<div class="pl"><p class="nm">' + esc(nameOf(i)) + "</p>" + plates[i].map((x) => '<p class="x">' + esc(x) + "</p>").join("") + "</div>" +
    '<div class="bar"><div class="row"><button class="ar" data-v aria-label="Before" title="Before">&#8249;</button><button class="ar" data-n aria-label="Next" title="Next">&#8250;</button></div>' +
    '<div class="row"><button data-k' + (kept ? ' class="on"' : "") + ' title="Keep it on this phone">' + (kept ? "KEPT" : "KEEP") + "</button>" +
    '<button data-m title="Give this plate a name">NAME</button><button class="on" data-pr title="Print this plate">PRINT</button></div></div></div>');
  const go = (d) => view((i + d + N) % N);
  on("[data-b]", cover);
  on("[data-v]", () => go(-1));
  on("[data-n]", () => go(1));
  on("[data-pr]", () => { big("SESAME"); line(); plate(i); foot(); });
  on("[data-k]", () => { const l = saved(), j = l.indexOf(i); if (j < 0) l.push(i); else l.splice(j, 1); keep("sesame_kept", l); view(i); });
  on("[data-m]", () => {
    const p = document.querySelector(".nm"); p.innerHTML = '<input maxlength="24" aria-label="Name" autocomplete="off">';
    const f = p.firstChild; f.value = nameOf(i); f.focus(); let done = false;
    const end = (ok) => { if (done) return; done = true; if (ok) { const n = f.value.trim().slice(0, 24), all = names(); if (n) all[i] = n; else delete all[i]; keep("sesame_names", all); } view(i); };
    f.onkeydown = (e) => { if (e.key === "Enter") end(true); if (e.key === "Escape") end(false); e.stopPropagation(); };
    f.onblur = () => end(true);
  });
  const pl = document.querySelector(".pl"); let x0 = null;
  pl.onpointerdown = (e) => { x0 = e.clientX; };
  pl.onpointerup = (e) => { if (x0 == null) return; const d = e.clientX - x0; x0 = null; if (Math.abs(d) > 48) go(d < 0 ? 1 : -1); };
  document.onkeydown = (e) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); if (e.key === "Escape") cover(); };
}

cover();
` };

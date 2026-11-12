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
const names = () => keep("sesame_names") || {};
const nameOf = (i) => names()[i] || "";
const saved = () => keep("sesame_kept") || [];

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

const h = (s) => '<p style="margin:0;font-size:11px;letter-spacing:.24em;opacity:.7">' + s + '</p>';
const t1 = (s) => '<h1 style="margin:4px 0 12px;font:700 clamp(30px,9vw,46px)/1 Georgia,serif;letter-spacing:-.01em">' + s + '</h1>';
const esc = (s) => String(s).replace(/[<>&"]/g, "");

function view(i) {
  show(h(no(i)) + t1(esc(nameOf(i)) || "&nbsp;") +
    '<p style="margin:0 0 14px;font:600 22px/1.35 Georgia,serif">' + plates[i].map(esc).join("<br>") + '</p>');
  button("PRINT", () => { big("SESAME"); line(); plate(i); foot(); });
  button(nameOf(i) ? "RENAME" : "NAME", async () => {
    const n = String((await ask("NAME")) || "").trim().slice(0, 24);
    const all = names(); if (n) all[i] = n; else delete all[i]; keep("sesame_names", all); beep(660); view(i);
  });
  button(saved().includes(i) ? "KEPT" : "KEEP", () => {
    const l = saved(); if (!l.includes(i)) { l.push(i); keep("sesame_kept", l); beep(880); } view(i);
  });
  button("NEXT", () => view((i + 1) % plates.length));
  button("←", cover);
}

function cover() {
  show(t1("SESAME"));
  button("SURPRISE", () => view(Math.floor(Math.random() * plates.length)));
  button("ISSUE", () => { big("SESAME"); line(); plates.forEach((p, i) => plate(i)); foot(true); });
  plates.forEach((p, i) => button(nameOf(i) ? nameOf(i).toUpperCase() : no(i), () => view(i)));
  const k = saved().filter((i) => plates[i]);
  if (k.length) button("KEPT", () => { show(t1("KEPT")); k.forEach((i) => button(nameOf(i) ? nameOf(i).toUpperCase() : no(i), () => view(i))); button("←", cover); });
}

cover();
` };

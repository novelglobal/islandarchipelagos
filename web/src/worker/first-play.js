/* the first play put on an island with the engine (PL-2UQN), kept here so it can grow */
export const FIRST_PLAY = { code: 'PL-2UQN', n: 'SESAME', th: 'print', fr: 'stripe', first: true, by: 'Rehe. Sesame, No. 001. Third Island, waxing crescent, November 2026.', src: String.raw`const ISSUE = "No. 001";
const BY = "Rehe. Sesame, No. 001. Third Island, waxing crescent, November 2026.";
const plates = [
  ["STRAWBERRY CRIME", ["strawberry", "black olive", "bird's-eye chilli"], "Fruit with a record. Sweet, then brine, then a flash of heat."],
  ["CORN AFTER DARK", ["sweet corn", "miso butter", "dark chocolate"], "Summer, salted, sent to bed with bitter cocoa."],
  ["KOJI CUSTARD", ["milk chocolate", "white miso", "cream"], "The mould that makes soy sauce is making dessert now."],
  ["FUNKY CHEESECAKE", ["dark chocolate", "black garlic", "cream cheese"], "Garlic left warm for weeks turns to liquorice and fig."],
  ["CALAMANSI MISO", ["calamansi", "white miso", "cold cucumber"], "A sour fruit and a salt paste, introduced over ice."],
  ["OCEAN GREENS", ["cucumber", "nori", "roasted peanut"], "Cold, crisp, and the tide on the finish."],
  ["BLACK BEAN BROWNIE", ["fermented black bean", "dark chocolate", "orange"], "Cocoa meets its older, saltier cousin."],
  ["TOMATO ELDERFLOWER", ["ripe tomato", "elderflower", "sea salt"], "Fruit and flower doing sugar's old job."],
  ["SAVOURY SCROLL", ["cinnamon", "gruyère", "burnt onion"], "The breakfast pastry crosses over to dinner."],
  ["THE CHEESECAKE INCIDENT", ["ricotta", "taleggio", "hot honey"], "Mild. Then funk. Then the sting."],
  ["CUCUMBER HEAT", ["cucumber", "green chilli", "lime"], "Cool going in. Warm going down."],
  ["ROSE AND CHERRY", ["cherry", "rose", "black pepper"], "Perfume, stone, spark."]
];

const saved = () => keep("sesame_saved") || [];

function mast() {
  big("SESAME");
  print(ISSUE + " · " + phase());
  line();
}
function plate(p, n) {
  print(String(n).padStart(2, "0"));
  big(p[0]);
  p[1].forEach((x, i) => big((i ? "× " : "") + x));
  print(p[2]);
  line();
}
function foot() {
  small(BY);
  qr("https://novel.global/play.html?c=PL-2UQN");
  small("novel.global");
  cut();
}

const h = (s) => '<p style="margin:0;font-size:11px;letter-spacing:.24em;opacity:.7">' + s + '</p>';
const t1 = (s) => '<h1 style="margin:4px 0 12px;font:700 clamp(30px,9vw,46px)/1 Georgia,serif;letter-spacing:-.01em">' + s + '</h1>';

function view(p) {
  const n = plates.indexOf(p) + 1;
  show(h(ISSUE + " · " + String(n).padStart(2, "0")) + t1(p[0]) +
    '<p style="margin:0 0 14px;font:600 22px/1.35 Georgia,serif">' + p[1].map((x, i) => (i ? "× " : "") + x).join("<br>") + '</p>' +
    '<p style="margin:0 0 6px;max-width:30ch;opacity:.8">' + p[2] + '</p>');
  button("PRINT", () => { mast(); plate(p, n); foot(); });
  button(saved().includes(p[0]) ? "KEPT" : "KEEP", () => {
    const l = saved();
    if (!l.includes(p[0])) { l.push(p[0]); keep("sesame_saved", l); beep(880); }
    view(p);
  });
  button("NEXT", () => view(plates[n % plates.length]));
  button("←", cover);
}

function cover() {
  show(h("FIRST · " + ISSUE) + t1("SESAME") + '<p style="margin:0 0 8px;opacity:.8">Twelve plates. Three things each.</p>');
  button("SURPRISE", () => view(pick(plates)));
  button("ISSUE", () => { mast(); plates.forEach((p, i) => plate(p, i + 1)); foot(); });
  plates.forEach(p => button(p[0], () => view(p)));
  const k = saved().map(n => plates.find(p => p[0] === n)).filter(Boolean);
  if (k.length) button("KEPT", () => { show(h("KEPT")); k.forEach(p => button(p[0], () => view(p))); button("←", cover); });
}

cover();
` };

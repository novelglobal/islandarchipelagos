/* starters for the cards still to be made. Each runs as it is: change what sits under CHANGE, then put it up */
window.STARTERS = {

  ghost: { n: 'GHOST CAPTURE', th: 'dots', src: `// ── CHANGE ──────────
const NAME = 'GHOST CAPTURE'
const SAY = 'Same spot. Same frame.'
const EVERY = 10              // minutes between photos
// ────────────────────

show('<h1>' + NAME + '</h1>')
say(SAY)
button('SNAP', go)
every(EVERY * 60, function () { beep(660); say('NEXT') })

async function go() {
  const pic = await snap('PHOTO')
  if (!pic) return
  const n = keep('frame', (keep('frame') || 0) + 1)
  image(pic)
  small(NAME + ' · ' + n + ' · ' + phase())
  cut()
  beep(880)
  button('SNAP', go)
}
` },

  armband: { n: 'ARMBAND', th: 'pink', src: `// ── CHANGE ──────────
const WORDS = 'HOLD FAST'
const NAME = 'YOUR NAME'
const PATTERNS = {
  ZIGZAG: '/\\\\/\\\\/\\\\/\\\\/\\\\/\\\\/\\\\/\\\\/\\\\/\\\\/\\\\/\\\\/\\\\/\\\\',
  DOTS: 'o o o o o o o o o o o o o o o',
  STRIPES: '= = = = = = = = = = = = = = =',
}
const LENGTH = 5              // repeats: about one wrist
// ────────────────────

show('<h1>ARMBAND</h1>')
const words = (await ask('WORDS')) || WORDS
const name = (await ask('NAME')) || NAME
say('PATTERN')
const p = PATTERNS[await choose(Object.keys(PATTERNS))]

button('PRINT', function () {
  for (let i = 0; i < LENGTH; i++) { print(p); big(words.toUpperCase()); print(p) }
  small(name.toUpperCase())
  cut()
})
` },

  quest: { n: 'TEXT GAME', th: 'lilac', src: `// ── CHANGE ──────────
const NAME = 'QUEST'
const QUESTS = [
  'Find the oldest tree. Bring a leaf.',
  'Ask the way to somewhere you know.',
  'Walk until three red things.',
]
const EVERY = 24              // hours per quest: 1 for hourly
// ────────────────────

const at = Math.floor(Date.now() / (EVERY * 36e5))
const q = QUESTS[at % QUESTS.length]
const xp = keep('xp') || 0

show('<h1>' + NAME + '</h1>')
say(q)
say('XP ' + xp)
button('PRINT', function () { big(NAME); print(q); small(phase()); cut() })
button('DONE', function () {
  if (keep('done') === at) return
  keep('done', at); keep('xp', xp + 1); say('XP ' + (xp + 1)); beep(880)
})
` },

  comic: { n: 'COMICS', th: 'coral', src: `// ── CHANGE ──────────
const TITLE = 'MY COMIC'
const PANELS = 3              // photos in the strip
const BY = 'BY YOU'
// ────────────────────

show('<h1>' + TITLE + '</h1>')
const strip = []
for (let i = 1; i <= PANELS; i++) {
  const pic = await snap('PANEL ' + i)
  if (!pic) break
  strip.push([pic, await ask('WORDS')])
}

button('PRINT', function () {
  big(TITLE)
  strip.forEach(function (s) { image(s[0]); if (s[1]) print(s[1]); line() })
  small(BY + ' · ' + phase())
  cut()
})
` },

  memo: { n: 'SPEECH PRINT', th: 'cyan', src: `// ── CHANGE ──────────
const TITLE = 'MEMO'
const TIP = 'Tap the mic on your keyboard'
// ────────────────────

show('<h1>' + TITLE + '</h1>')
while (true) {
  const said = await ask(TIP)
  if (!said.trim()) continue
  big(TITLE)
  print(said)
  small(phase())
  cut()
  beep(880)
}
` },

  pobox: { n: 'PO BOX', th: 'print', src: `// ── CHANGE ──────────
const NAME = 'PO BOX'
const KEY = 'CHANGEME'        // only codes made with this key open here
// ────────────────────

const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ', B = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-'
const turn = function (t, from, to, dir) {
  return t.split('').filter(function (c) { return from.indexOf(c) >= 0 }).map(function (c, i) { const k = from.indexOf(c); return to[(k + dir * A.indexOf(KEY[i % KEY.length]) + 37 * 9) % 37] }).join('')
}

show('<h1>' + NAME + '</h1>')
const way = await choose(['SEND', 'OPEN'])
if (way === 'SEND') {
  const m = (await ask('MESSAGE')).toUpperCase().slice(0, 80)
  show('<h1>' + NAME + '</h1><p>CODE</p><h1>' + (turn(m, A, B, 1).match(/.{1,4}/g) || []).join(' ') + '</h1>')
} else {
  const c = (await ask('CODE')).toUpperCase().replace(/ /g, '')
  big(NAME)
  print(turn(c, B, A, -1))
  small(phase())
  cut()
}
` },

  album: { n: 'PHOTO SEND', th: 'dots', src: `// ── CHANGE ──────────
const NAME = 'ALBUM'
const MAX = 6                 // photos per print
// ────────────────────

show('<h1>' + NAME + '</h1>')
const pics = []
const add = async function () {
  const p = await snap('ADD')
  if (p && pics.length < MAX) { pics.push(p); say(pics.length + ' / ' + MAX) }
  if (pics.length < MAX) add()
}
add()
button('PRINT', function () {
  if (!pics.length) return
  big(NAME)
  pics.forEach(function (p) { image(p); line() })
  small(phase())
  cut()
})
` },

  link: { n: 'LINK PLAY', th: 'cyan', src: `// ── CHANGE ──────────
const ISLAND = 'YOUR ISLAND'
const SHAPES = ['O', 'X', '/', '#', '+']
const LONG = 5                // shapes in a call
// ────────────────────

const L = 'ABCDE'
show('<h1>LINK</h1>')
const way = await choose(['CALL', 'ANSWER'])

if (way === 'ANSWER') {
  const got = (await ask('CODE')).toUpperCase().split('').filter(function (c) { return L.indexOf(c) >= 0 })
  big('COPY')
  print(got.map(function (c) { return SHAPES[L.indexOf(c)] }).join('  '))
  line()
}
const mine = []
for (let i = 0; i < LONG; i++) mine.push(Math.floor(Math.random() * SHAPES.length))
big('CALL')
print(mine.map(function (k) { return SHAPES[k] }).join('  '))
small(ISLAND + ' · CODE ' + mine.map(function (k) { return L[k] }).join(''))
cut()
` },

  sky: { n: 'ASTRONOMY', th: 'print', src: `// ── CHANGE ──────────
const NAME = 'SKY'
const EVENTS = [              // [date, what]
  ['2026-11-17', 'LEONIDS'],
  ['2026-12-14', 'GEMINIDS'],
  ['2026-12-22', 'SOLSTICE'],
  ['2027-01-03', 'QUADRANTIDS'],
  ['2027-04-22', 'LYRIDS'],
  ['2027-05-06', 'ETA AQUARIIDS'],
  ['2027-08-02', 'TOTAL SOLAR ECLIPSE'],
  ['2027-08-12', 'PERSEIDS'],
]
const NEWS = []               // your own lines, printed each week
// ────────────────────

const now = Date.now(), week = 7 * 864e5
const soon = EVENTS.filter(function (e) { const t = Date.parse(e[0]); return t >= now - week / 2 && t < now + week }).map(function (e) { return e[1] })

show('<h1>' + NAME + '</h1>')
say(soon.length ? soon.join(' · ') : phase())
button('PRINT', function () {
  big(NAME)
  moon()
  print(phase())
  soon.forEach(function (s) { print(s) })
  NEWS.forEach(function (s) { small(s) })
  cut()
})
` },
};

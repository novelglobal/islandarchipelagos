# HACKING

## Run

- `npm ci`
- `npm run dev`: build, then `wrangler dev` on :8787
- `npm test`: build, API checks, browser checks
- `npm run test:api`: build, API checks only
- `npm run build && ONLY=<group> npm run test:one`: one browser group
- browser groups: `bench`, `base`, `aura`, `portfolio`, and the rest named in `test/run.mjs` (`run('<name>')`)
- screenshots: `test/shots/` (`KEEP=1` keeps old ones)

## Files

| path | what |
| --- | --- |
| `build.mjs` | builds `dist/`: joins `src/app/*`, copies `repo-static/`, writes `parts.js` from `../spec/parts` |
| `src/worker/index.js` | the Worker: every `/api/*` route, D1 schema and versions, settings |
| `src/worker/label.js` | the island label |
| `src/worker/stamp.js` | stamps |
| `src/worker/first-play.js` | the first play |
| `src/base/` | the home: `base.js`, `home.js` (keeper panel, TEST / MOVE), `aura.js`, `thermal.js` (photo to dots) |
| `src/app/` | the map app, joined in name order |
| `repo-static/twin.html`, `twin.js` | the twin: a ghost's paper, BENCH, FLASH, BOOT, the rite, OFFLINE, RADIO |
| `repo-static/mesh.js` | Meshtastic by USB or Bluetooth, text lines |
| `repo-static/parts.js` | generated: never edit, edit `../spec/parts/*.json` |
| `repo-static/sw.js` | service worker: bump `V` on every change |
| `receiver/` | the Python receiver (`pull.py`) |
| `test/api.mjs` | API checks (wrangler test harness) |
| `test/run.mjs` | browser checks (Playwright) |
| `dist/` | build output: never edit |

## Pages

`/` home · `/twin` twin (Chrome: USB, serial, Bluetooth) (`?isle=test` a real island's TEST) · `/twin#bench` its bench · `/admin` approval page · `/islands` · `/island` · `/archipelagos` · `/bench` · `/kit` · `/desk` · `/art` · `/play` · `/play-box` · `/research` · `/note` · `/c` · `/cart` · `/t` · `/x` · `/popup`

## Routes (`/api/…`)

| route | methods |
| --- | --- |
| `health`, `beat` | GET |
| `img`, `snd`, `wx`, `news`, `book`, `osm`, `os` | GET (proxied, cached) |
| `settings`, `welcome`, `example`, `partners`, `isles`, `places`, `species` | GET / POST as listed in `index.js` |
| `ghost` | POST: a new ghost |
| `twin` | GET, POST: a ghost's paper; POST `{bench}`, `{job}`, `{pair}` |
| `island` | GET, POST: keeper panel; POST `{action:'test'|'move'|'undo', what}` |
| `island/pics/<n>` | PUT, DELETE |
| `pair`, `pair/poll` | POST: a Pi pairing |
| `printers/<id>/next`, `printers/<id>/jobs/<job>`, `printers/<id>/used` | the receiver |
| `touch/<id>`, `touch/<id>/<x>` | the touch screen |
| `stories`, `stories/<id>` | GET, POST |
| `cards`, `cards/<id>/<slot>` | GET |
| `posters`, `posts`, `receipts`, `photos`, `film`, `tapes` | GET (POST where listed) |
| `plays`, `plays/<id>`, `plays/<id>/art|edit|like`, `plays/mine` | play |
| `pop`, `pop/desk`, `pop/desk/art/<x>` | pop |
| `talk`, `note`, `gift`, `home`, `link`, `live`, `maker`, `mine/<x>`, `stamp`, `warm`, `c`, `c/<id>` | as named |
| `admin/*` | the approval page (ADMIN_KEY) |

## Tables (D1)

`printers` · `jobs` · `pairs` · `stories` · `settings` · `cardpics` · `cardset` · `passes` · `passn` · `gifts` · `hits` · `links` · `makers` · `places` · `species` · `stamps` · `talk` · `tapes` · `posts` · `osm` · `asks` · `isle_plays` · `play_likes` · `play_stats` · `traffic`

- schema: `SCHEMA_V` in `index.js`; a new column is an `ALTER TABLE` in a try, under a new version
- `printers.ghost`: 1 for a ghost
- `printers.mesh`: radio on; a ghost's from its bench
- `printers.test_of`: a TEST's real island
- `printers.moves`: the last 5 MOVEs, each with what it replaced
- `printers.bench`: JSON `{p, j, f, m, o}`
  - `p`: parts `[own id, part id]`, at most 12
  - `j`: cables `["p1.usb", "p2.usb"]`, at most 24
  - `f`: flashed SDs `[sd, version, name]`
  - `m`: mm of the 80 m roll used
  - `o`: first start `[sd, version, 1 setup Wi-Fi | 2 on Wi-Fi | 3 paired]`

## The ghost flow

| stage | where | file |
| --- | --- | --- |
| SWITCH | ISLAND ARCHIPELAGOS card, GHOST key | `repo-static/archipelagos.*`, `src/base/base.js` |
| BENCH | `/twin#bench` | `twin.js` `wantOf`, `power`, `layout`, `benchDraw` |
| FLASH | the SD on the bench | `twin.js` `flDraw`, `flWrite`; `/api/os` |
| BOOT | the Pi on the bench | `twin.js` `bootStep`, `SLIPS` (lines from `../kit/island`) |
| HOME | keeper panel | `src/base/home.js` |
| TEST + MOVE | keeper panel of a real island | `src/base/home.js`; `index.js` `action:'test'|'move'|'undo'` |
| OFFLINE | the GHOST light on the twin | `twin.js` `OFF` |
| MESH | RADIO on the twin: T-BEAM, USB, BLUETOOTH, LINE | `twin.js` `meshOut`, `radioDraw`; `mesh.js` |
| the rite | the five stations on the twin | `twin.js` `riteDraw` |

## Privacy rules (checked in `test/api.mjs`)

- a ghost: never in `/api/partners`, `/api/cards`, the map or join pickers
- a ghost's stories: status `ghost`, never shown
- a ghost relays only to ghosts; a TEST takes echo only from its own real island
- the Wi-Fi typed in FLASH stays on the screen
- a ghost's pair code pairs nothing
- a ghost's mesh lines: its own screen's radio only
- `/twin`: own CSP, self only

## Add a part

1. `../spec/parts/<id>.json` (schema `../spec/schemas/part.schema.json`): `id`, `name`, `kind`, `ports`, `watts`, `draw`, `licence`
2. `npm run build`: it is in `parts.js` and the worker's `PART_IDS`
3. kinds the build asks for: `printer`, `pi`, `sd`, `power`, `solar`, `battery`, `charger`, `converter`; others sit on the bench

## Add a cart

1. `repo-static/stacks/<id>.json`: `id`, `name`, `kind`, `island`, `where`; list it in `repo-static/stacks/index.json`
2. a new kind: a drawing in `repo-static/cart.js` (`KINDS`): `draw(k, data, stack, o)`, and `feed(stack, o)` (an `/api` path) or `local()`
3. `npm run build`: it is on `/cart#<id>` and in `shelf.json` (kinds the island can run offline: `OFFLINE` in `build.mjs`)

## The offline island (`../kit/island`)

- `shelf.json` (written by `build.mjs`): `files` (path, sha-256, bytes), `feeds` (`/api` paths), `carts`
- online, every 6 h: the island copies changed files to `/var/lib/island/shelf/files`, a snapshot of each feed to `shelf/feeds` (`shelf.go`)
- on its own Wi-Fi: listed files served; `/api/partners` (this island), `/api/c`, feeds from the snapshot, `POST /api/stories` prints at once
- prints taken: pictures (`GS v 0`, `GS ( L` working memory), text, feeds, alignment, speed, cut; never stored settings or stored pictures (`rasterOnly`)
- each print kept in `shelf/outbox.jsonl` with its own id and a one-bit picture; online again, the island sends forty at a time to `POST /api/printers/<id>/outbox`, the site keeps each id once and the twin roll shows them as OFFLINE
- try it on a computer: `ISLAND_LISTEN=127.0.0.1:8088 ISLAND_SHELF=./shelf ISLAND_SHELF_FROM=http://localhost:8787 ISLAND_DRY_DIR=./dry go run . -config ./island.json -demo island`
- tests: `go test ./...` in `kit/island`

## Release

1. staging → preview: staging-front.novelglobal.workers.dev
2. owner merges to `main` (GitHub Desktop)
3. live: novel.global; its build id is `<meta name="build">`
4. Island OS: tag `v*` → `.github/workflows/release.yml`
5. SAFE: tag `safe-<sw version>` once live

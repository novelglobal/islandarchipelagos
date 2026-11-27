# The island connection, v0

What every island answers, on its own Wi-Fi, with no internet. Described from `kit/island` as it runs; a second island built from this page alone should pass `node spec/tools/island-check.mjs http://<island>`.

## Reaching it

- The island is `10.42.0.1` on its own Wi-Fi. Its DNS answers every name with that address, and any request for another host is redirected to `http://10.42.0.1/`, so a phone's sign-in check opens the island's page.
- Plain HTTP. Browsers treat it as not secure, so pages served here cannot use a live camera, clipboard reads, service workers, WebUSB or Web Crypto. They use file pickers (which can open the camera), the paste event and forms.

## Routes

| Route | Takes | Answers |
|---|---|---|
| `GET /` | | The island's page |
| `GET /thermal.js` | | The print engine: byte for byte `web/src/base/thermal.js` |
| `GET /entry.json` | | The island's signed entry (below); `access-control-allow-origin: *` |
| `POST /api/stories` | JSON `{escpos: base64, code?, from?}` | `200 {ok, passed, code}`; `400` not bytes it takes; `429 {error: "too many", wait}` or `{error: "full"}`; `503 {error: "paused"}` or `{error: "the printer did not answer"}` |
| `POST /print` | form `w i s h`: words only | Text; with `x-island: 1` the answer alone |
| `GET /api/partners` | | `{partners: [this island]}`: the one island a card on it prints to |
| `GET /api/*` | | A feed the island kept while online, else `404 {error: "offline"}` |
| `GET /<file>` | | A file of the shelf (the cards it carries), listed in its manifest; anything else 404 |
| `GET, POST /pass` | | Presence passes (off until presence is switched on) |
| `POST /mesh` | text: words, or `ng1:` a drawing (`spec/tools/meshdraw.mjs`); from the Pi itself only (`kit/mesh/bridge.py`) | `printed`; `400`, `403` not from the Pi, `429` full, `503` paused or no printer |
| `GET, POST /setup` | form `pass` (the slip key), `do=pause` | The keeper's page: reopens setup, or pauses and starts the island |

## Printer bytes an island takes

Anything else is refused whole (`400`), so no print can change what the printer keeps (its stored settings wear its memory):

- `ESC @`; `ESC a d M E ! - J` with one argument; printable ASCII, `LF`, `CR`
- `GS v 0`: one-bit raster, up to 1024 dots across
- `GS ( L` functions `p` (store a picture in working memory, one-bit or four layers for sixteen greys) and `2` (print it)
- `GS ( K` speed (`2`) and head parts (`a`); `GS !` size; `GS V` cut
- at most 1400 KB, and at least one `GS` command

`ESC d`, `GS V` and friends: Epson's ESC/POS reference. The sixteen greys: `GS ( L` with tone `4` and colours `1` to `4`, each a bit of a dot's darkness (order `b`: colour `1` the highest bit).

## Limits

One print per phone every 20 seconds; 300 a day. While paused: none, from any phone or site.

## The entry: `island/entry/0`

```json
{ "entry": "<JSON, exactly the bytes signed>", "sig": "<Ed25519 signature of those bytes, base64url>" }
```

The entry holds `v` (`island/entry/0`), `key` (the island's Ed25519 public key, base64url), `name`, `printer`, `greys`, `paper` (`80` or `58`), `cards`, `open`, `at` and `until` (Unix seconds; `until` after `at`, at most 90 days on).

The key is made on the island the first time it starts and never leaves it. A slip shows it as eight letters: base32 of the first five bytes of its SHA-256, `ABCD-EFGH`.

A valid entry proves only that this key signed these bytes. It does not prove the island exists now, is where it says, or that its keeper is honest. A copy holds until `until`, judged by the checker's own clock (an island's clock can be wrong after time offline).

Checked by `kit/island/ident.go` and `spec/tools/entry.mjs`, against the same cases in `spec/fixtures/entry.json`.

## The keeper

- The setup slip prints the slip key. Whoever holds it runs the island: setup, pause, start.
- Holding the button for 3 seconds prints the status slip: mode, paper, printer, prints made and not made, paused or not, version, the key's eight letters, and the entry as a QR code.
- A short press turns the island off safely.

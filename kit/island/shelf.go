// SPDX-License-Identifier: AGPL-3.0-or-later

package main

// The shelf: the site's carts, kept on the island so they work on its own Wi-Fi with no internet.
// Online, the island copies shelf.json, every file it lists (checked by sha-256) and a snapshot of each feed.
// On its own Wi-Fi it serves those files and answers the few /api calls a cart makes; a print goes straight
// to the printer, raster only, and is noted in the outbox.

import (
	"bytes"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"log"
	"mime"
	"net"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

type shelfFile struct {
	P string `json:"p"`
	H string `json:"h"`
	N int64  `json:"n"`
}

type shelfCart struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type shelfList struct {
	V     string      `json:"v"`
	Files []shelfFile `json:"files"`
	Feeds []string    `json:"feeds"`
	Carts []shelfCart `json:"carts"`
}

const (
	shelfMax   = 40 << 20 // the whole shelf
	shelfOne   = 8 << 20  // one file
	feedMax    = 2 << 20  // one feed snapshot
	shelfEvery = 6 * time.Hour
	escposMax  = 1400 << 10
)

var shelfBusy sync.Mutex

func (a *App) shelfDir() string {
	if d := os.Getenv("ISLAND_SHELF"); d != "" {
		return d
	}
	return filepath.Join(filepath.Dir(a.path), "shelf")
}

// a published path: plain letters, digits, dots, dashes and slashes; no way out of the shelf
func shelfPath(p string) bool {
	if p == "" || len(p) > 120 || strings.HasPrefix(p, "/") || strings.Contains(p, "..") || path.Clean(p) != p {
		return false
	}
	for _, r := range p {
		if !(r >= 'a' && r <= 'z' || r >= 'A' && r <= 'Z' || r >= '0' && r <= '9' || r == '.' || r == '-' || r == '_' || r == '/') {
			return false
		}
	}
	return true
}

func feedOK(f string) bool {
	return strings.HasPrefix(f, "/api/") && len(f) <= 300 && !strings.ContainsAny(f, " \r\n#")
}

func feedName(f string) string {
	h := sha256.Sum256([]byte(f))
	return hex.EncodeToString(h[:12]) + ".json"
}

func fetch(url string, max int64) ([]byte, int, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, 0, err
	}
	req.Header.Set("user-agent", "island/"+version)
	res, err := client.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer res.Body.Close()
	b, err := io.ReadAll(io.LimitReader(res.Body, max+1))
	if err != nil {
		return nil, res.StatusCode, err
	}
	if int64(len(b)) > max {
		return nil, res.StatusCode, errors.New("too large")
	}
	return b, res.StatusCode, nil
}

func writeAtomic(name string, b []byte) error {
	if err := os.MkdirAll(filepath.Dir(name), 0o755); err != nil {
		return err
	}
	tmp := name + ".part"
	if err := os.WriteFile(tmp, b, 0o644); err != nil {
		return err
	}
	return os.Rename(tmp, name)
}

func sumOf(name string) string {
	b, err := os.ReadFile(name)
	if err != nil {
		return ""
	}
	h := sha256.Sum256(b)
	return hex.EncodeToString(h[:])
}

// shelfSync copies the shelf from a site: only what changed, each file checked, the list written last
func (a *App) shelfSync(server string) error {
	if !shelfBusy.TryLock() {
		return nil
	}
	defer shelfBusy.Unlock()
	dir := a.shelfDir()
	raw, st, err := fetch(server+"/shelf.json", 1<<20)
	if err != nil || st != 200 {
		return fmt.Errorf("no shelf from %s: %d %v", server, st, err)
	}
	var l shelfList
	if err := json.Unmarshal(raw, &l); err != nil {
		return fmt.Errorf("the shelf could not be read: %v", err)
	}
	var total int64
	keep := map[string]bool{}
	for _, f := range l.Files {
		if !shelfPath(f.P) || len(f.H) != 64 || f.N < 0 || f.N > shelfOne {
			return fmt.Errorf("the shelf lists a file it may not: %q", f.P)
		}
		total += f.N
		keep[filepath.FromSlash(f.P)] = true
	}
	if total > shelfMax {
		return fmt.Errorf("the shelf is too large: %d bytes", total)
	}
	got := 0
	for _, f := range l.Files {
		name := filepath.Join(dir, "files", filepath.FromSlash(f.P))
		if sumOf(name) == f.H {
			continue
		}
		b, st, err := fetch(server+"/"+f.P, f.N)
		if err != nil || st != 200 {
			return fmt.Errorf("%s: %d %v", f.P, st, err)
		}
		if h := sha256.Sum256(b); hex.EncodeToString(h[:]) != f.H {
			return fmt.Errorf("%s changed on the way", f.P)
		}
		if err := writeAtomic(name, b); err != nil {
			return err
		}
		got++
	}
	feeds := 0
	kept := map[string]bool{}
	for _, f := range l.Feeds {
		if !feedOK(f) {
			continue
		}
		kept[feedName(f)] = true
		b, st, err := fetch(server+f, feedMax)
		if err != nil || st != 200 || !json.Valid(b) {
			continue // the last snapshot stays
		}
		if writeAtomic(filepath.Join(dir, "feeds", feedName(f)), b) == nil {
			feeds++
		}
	}
	if err := writeAtomic(filepath.Join(dir, "shelf.json"), raw); err != nil {
		return err
	}
	prune(filepath.Join(dir, "files"), keep)
	prune(filepath.Join(dir, "feeds"), kept)
	log.Printf("the shelf %s: %d carts, %d files new, %d feeds", l.V, len(l.Carts), got, feeds)
	return nil
}

// prune takes away what the shelf no longer lists
func prune(root string, keep map[string]bool) {
	filepath.WalkDir(root, func(p string, d fs.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return nil
		}
		if rel, e := filepath.Rel(root, p); e == nil && !keep[rel] {
			os.Remove(p)
		}
		return nil
	})
}

func (a *App) shelf() *shelfList {
	raw, err := os.ReadFile(filepath.Join(a.shelfDir(), "shelf.json"))
	if err != nil {
		return nil
	}
	var l shelfList
	if json.Unmarshal(raw, &l) != nil {
		return nil
	}
	return &l
}

var shelfTypes = map[string]string{".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json",
	".woff2": "font/woff2", ".css": "text/css; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml"}

// serveShelf answers a request from the shelf, if it is one; false leaves it to the island page
func (p *portal) serveShelf(w http.ResponseWriter, r *http.Request) bool {
	if strings.HasPrefix(r.URL.Path, "/api/") {
		p.shelfAPI(w, r)
		return true
	}
	if r.Method != "GET" && r.Method != "HEAD" {
		return false
	}
	rel := strings.TrimPrefix(r.URL.Path, "/")
	l := p.a.shelf()
	if l == nil || !shelfPath(rel) {
		return false
	}
	listed := false
	for _, f := range l.Files {
		listed = listed || f.P == rel
	}
	if !listed {
		return false
	}
	f, err := os.Open(filepath.Join(p.a.shelfDir(), "files", filepath.FromSlash(rel)))
	if err != nil {
		return false
	}
	defer f.Close()
	st, _ := f.Stat()
	ct := shelfTypes[path.Ext(rel)]
	if ct == "" {
		ct = mime.TypeByExtension(path.Ext(rel))
	}
	w.Header().Set("content-type", ct)
	w.Header().Set("cache-control", "no-cache")
	w.Header().Set("x-content-type-options", "nosniff")
	http.ServeContent(w, r, rel, st.ModTime(), f)
	return true
}

func jsonOut(w http.ResponseWriter, status int, v any) {
	w.Header().Set("content-type", "application/json")
	w.Header().Set("cache-control", "no-store")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

// the few /api calls a cart makes, answered by the island itself
func (p *portal) shelfAPI(w http.ResponseWriter, r *http.Request) {
	c := p.a.conf()
	switch {
	case r.URL.Path == "/api/partners" && r.Method == "GET":
		// a cart prints only to an island named in its stack: every name it may use is this island
		jsonOut(w, 200, map[string]any{"partners": []map[string]any{{"id": "novelglobal", "name": c.Name, "paired": true, "ready": true}}})
	case r.URL.Path == "/api/c" && r.Method == "GET":
		jsonOut(w, 200, map[string]any{"code": ""})
	case r.URL.Path == "/api/stories" && r.Method == "POST":
		p.shelfPrint(w, r)
	case r.Method == "GET":
		if f := r.URL.RequestURI(); feedOK(f) {
			if b, err := os.ReadFile(filepath.Join(p.a.shelfDir(), "feeds", feedName(f))); err == nil {
				w.Header().Set("content-type", "application/json")
				w.Header().Set("cache-control", "no-store")
				w.Write(b)
				return
			}
		}
		jsonOut(w, 404, map[string]any{"error": "offline"})
	default:
		jsonOut(w, 404, map[string]any{"error": "offline"})
	}
}

// allow: one print at a time from a phone, and a day's limit for the island
func (p *portal) allow(r *http.Request) (busy, full bool) {
	ip, _, _ := net.SplitHostPort(r.RemoteAddr)
	p.mu.Lock()
	defer p.mu.Unlock()
	if p.last == nil || time.Since(p.dayFrom) > 24*time.Hour {
		p.last, p.today, p.dayFrom = map[string]time.Time{}, 0, time.Now()
	}
	busy = time.Since(p.last[ip]) < 20*time.Second
	full = p.today >= 300
	if !busy && !full {
		p.last[ip] = time.Now()
		p.today++
	}
	return
}

func (p *portal) shelfPrint(w http.ResponseWriter, r *http.Request) {
	var b struct {
		Escpos string `json:"escpos"`
		Code   string `json:"code"`
		From   string `json:"from"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, escposMax*4/3+8<<10)).Decode(&b); err != nil || b.Escpos == "" {
		jsonOut(w, 400, map[string]any{"error": "nothing to print"})
		return
	}
	raw, err := base64.StdEncoding.DecodeString(b.Escpos)
	if err != nil || len(raw) > escposMax || !rasterOnly(raw) {
		jsonOut(w, 400, map[string]any{"error": "not a print this island takes"})
		return
	}
	if busy, full := p.allow(r); busy || full {
		e := map[string]any{"error": "too many", "wait": 20}
		if full {
			e = map[string]any{"error": "full"}
		}
		jsonOut(w, 429, e)
		return
	}
	if err := p.a.pr.Print(raw); err != nil {
		log.Printf("a cart not printed: %v", err)
		jsonOut(w, 503, map[string]any{"error": "the printer did not answer"})
		return
	}
	p.a.update(func(c *Config) { c.Printed++ })
	p.a.outbox(clean(b.Code, 12), clean(b.From, 40), raw)
	jsonOut(w, 200, map[string]any{"ok": true, "passed": true, "code": clean(b.Code, 12)})
}

// outbox notes each print made on the island's own Wi-Fi, one line each, for the island's own record
// (sent to the site in a later stage)
func (a *App) outbox(code, from string, raw []byte) {
	h := sha256.Sum256(raw)
	line, _ := json.Marshal(map[string]any{"id": hex.EncodeToString(h[:8]) + fmt.Sprintf("%x", time.Now().UnixNano()&0xffffff), "at": time.Now().Unix(), "code": code, "from": from, "n": len(raw)})
	name := filepath.Join(a.shelfDir(), "outbox.jsonl")
	if err := os.MkdirAll(filepath.Dir(name), 0o755); err != nil {
		return
	}
	if fi, err := os.Stat(name); err == nil && fi.Size() > 1<<20 {
		return // full: kept as it is until it is sent
	}
	f, err := os.OpenFile(name, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o644)
	if err != nil {
		return
	}
	defer f.Close()
	f.Write(append(line, '\n'))
}

// rasterOnly: a print, and nothing that changes the printer. Pictures (GS v 0, or the greys of GS ( L kept in
// its working memory and printed), plain text, feeds, alignment, speed and head parts, a cut. Never stored settings
// (GS ( E) or stored pictures.
func rasterOnly(b []byte) bool {
	for i := 0; i < len(b); {
		c := b[i]
		switch {
		case c == 0x0A || c == 0x0D || (c >= 0x20 && c < 0x7F):
			i++
		case c == 0x1B:
			if i+1 >= len(b) {
				return false
			}
			switch b[i+1] {
			case 0x40:
				i += 2
			case 0x61, 0x64, 0x4D, 0x45, 0x21, 0x2D, 0x4A:
				if i+2 >= len(b) {
					return false
				}
				i += 3
			default:
				return false
			}
		case c == 0x1D:
			if i+2 >= len(b) {
				return false
			}
			switch b[i+1] {
			case 0x76: // GS v 0 m xL xH yL yH d…
				if i+8 > len(b) || b[i+2] != 0x30 || (b[i+3] > 3 && (b[i+3] < 0x30 || b[i+3] > 0x33)) {
					return false
				}
				x, y := int(b[i+4])|int(b[i+5])<<8, int(b[i+6])|int(b[i+7])<<8
				if x == 0 || x > 128 || y == 0 {
					return false
				}
				i += 8 + x*y
				if i > len(b) {
					return false
				}
			case 0x56: // GS V m [n]
				switch m := b[i+2]; {
				case m == 0 || m == 1 || m == 0x30 || m == 0x31:
					i += 3
				case m == 0x41 || m == 0x42:
					if i+3 >= len(b) {
						return false
					}
					i += 4
				default:
					return false
				}
			case 0x21: // GS ! n: size
				i += 3
			case 0x28: // GS ( K speed / head parts; GS ( L store in working memory, or print it
				if i+5 > len(b) {
					return false
				}
				n := int(b[i+3]) | int(b[i+4])<<8
				body := i + 5
				if n < 2 || body+n > len(b) {
					return false
				}
				switch b[i+2] {
				case 0x4B:
					if n != 2 || (b[body] != 0x32 && b[body] != 0x61) {
						return false
					}
				case 0x4C:
					if b[body] != 0x30 || (b[body+1] != 0x70 && b[body+1] != 0x32) {
						return false
					}
				default:
					return false
				}
				i = body + n
			default:
				return false
			}
		default:
			return false
		}
	}
	return len(b) > 0 && bytes.Contains(b, []byte{0x1D})
}

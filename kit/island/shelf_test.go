// SPDX-License-Identifier: AGPL-3.0-or-later

package main

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func raster() []byte {
	b := []byte{0x1B, 0x40, 0x1D, 0x28, 0x4B, 0x02, 0x00, 0x32, 0x06, 0x1D, 0x76, 0x30, 0x00, 0x02, 0x00, 0x02, 0x00, 0xF0, 0x0F, 0xAA, 0x55}
	b = append(b, 0x1D, 0x28, 0x4C, 0x06, 0x00, 0x30, 0x70, 0x34, 0x01, 0x01, 0x31) // greys into working memory
	b = append(b, 0x1D, 0x28, 0x4C, 0x02, 0x00, 0x30, 0x32)                         // and printed
	return append(b, 0x1B, 0x64, 0x04, 0x1D, 0x56, 0x42, 0x00)
}

func TestRasterOnly(t *testing.T) {
	if !rasterOnly(raster()) {
		t.Fatal("a cart's print refused")
	}
	bad := map[string][]byte{
		"stored settings":  append(raster(), 0x1D, 0x28, 0x45, 0x03, 0x00, 0x01, 0x49, 0x4E),
		"a stored picture": append(raster(), 0x1D, 0x28, 0x4C, 0x02, 0x00, 0x30, 0x43),
		"cut short":        raster()[:14],
		"a cash drawer":    append(raster(), 0x1B, 0x70, 0x00, 0x19, 0xFA),
		"text only":        []byte("HELLO\n"),
	}
	for k, b := range bad {
		if rasterOnly(b) {
			t.Fatalf("%s taken", k)
		}
	}
}

type shelfSite struct {
	files map[string][]byte
	feeds map[string]string
}

func (s *shelfSite) list() []byte {
	l := shelfList{V: "abc1234", Carts: []shelfCart{{"tarot", "TAROT"}, {"weather", "WEATHER"}}}
	for p, b := range s.files {
		h := sha256.Sum256(b)
		l.Files = append(l.Files, shelfFile{p, hex.EncodeToString(h[:]), int64(len(b))})
	}
	for f := range s.feeds {
		l.Feeds = append(l.Feeds, f)
	}
	b, _ := json.Marshal(l)
	return b
}

func (s *shelfSite) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path == "/shelf.json" {
		w.Write(s.list())
		return
	}
	if f, ok := s.feeds[r.URL.RequestURI()]; ok {
		w.Header().Set("content-type", "application/json")
		io.WriteString(w, f)
		return
	}
	if b, ok := s.files[strings.TrimPrefix(r.URL.Path, "/")]; ok {
		w.Write(b)
		return
	}
	w.WriteHeader(404)
}

func TestShelf(t *testing.T) {
	s := &shelfSite{files: map[string][]byte{"cart.html": []byte("<!doctype html>cart"), "stacks/tarot.json": []byte(`{"kind":"tarot"}`), "vendor/fonts/vt323.woff2": []byte("wOF2")},
		feeds: map[string]string{"/api/wx?at=-37.77,144.96": `{"days":[1,2]}`, "/api/settings": `{"events":""}`}}
	srv := httptest.NewServer(s)
	defer srv.Close()
	a, dir := testApp(t, srv.URL)
	t.Setenv("ISLAND_SHELF", filepath.Join(dir, "shelf"))
	if err := a.shelfSync(srv.URL); err != nil {
		t.Fatal(err)
	}
	p := &portal{a: a}
	get := func(u string) (int, string, string) {
		w := httptest.NewRecorder()
		p.ServeHTTP(w, httptest.NewRequest("GET", u, nil))
		return w.Code, w.Body.String(), w.Header().Get("content-type")
	}
	t.Setenv("ISLAND_LISTEN", "127.0.0.1:0")
	if c, b, ct := get("/cart.html"); c != 200 || b != "<!doctype html>cart" || !strings.HasPrefix(ct, "text/html") {
		t.Fatalf("cart page: %d %q %q", c, b, ct)
	}
	if c, _, ct := get("/vendor/fonts/vt323.woff2"); c != 200 || ct != "font/woff2" {
		t.Fatalf("font: %d %q", c, ct)
	}
	if c, b, _ := get("/api/wx?at=-37.77,144.96"); c != 200 || b != `{"days":[1,2]}` {
		t.Fatalf("feed: %d %q", c, b)
	}
	if c, b, _ := get("/api/news"); c != 404 || !strings.Contains(b, "offline") {
		t.Fatalf("a feed not kept: %d %q", c, b)
	}
	if c, _, _ := get("/island.json"); c != 404 {
		t.Fatalf("an unlisted file served: %d", c)
	}
	if c, b, _ := get("/api/partners"); c != 200 || !strings.Contains(b, `"name":"LAUNDROMATE"`) {
		t.Fatalf("partners: %d %q", c, b)
	}
	if c, b, _ := get("/"); c != 200 || !strings.Contains(b, `href="/cart.html#tarot"`) {
		t.Fatalf("island page has no carts: %d", c)
	}

	post := func(esc []byte, ip string) (int, string) {
		body, _ := json.Marshal(map[string]any{"escpos": base64.StdEncoding.EncodeToString(esc), "code": "DA-7K2Q", "from": "tarot"})
		r := httptest.NewRequest("POST", "/api/stories", strings.NewReader(string(body)))
		r.RemoteAddr = ip + ":5000"
		w := httptest.NewRecorder()
		p.ServeHTTP(w, r)
		return w.Code, w.Body.String()
	}
	if c, b := post(raster(), "10.42.0.7"); c != 200 || !strings.Contains(b, `"passed":true`) {
		t.Fatalf("print: %d %q", c, b)
	}
	if sl := slips(t, dir); len(sl) != 1 || sl[0] != string(raster()) {
		t.Fatalf("slip: %d", len(sl))
	}
	if c, _ := post(raster(), "10.42.0.7"); c != 429 {
		t.Fatalf("a second print at once: %d", c)
	}
	if c, _ := post(append(raster(), 0x1D, 0x28, 0x45, 0x03, 0x00, 0x01, 0x49, 0x4E), "10.42.0.8"); c != 400 {
		t.Fatalf("stored settings taken: %d", c)
	}
	ob, _ := os.ReadFile(filepath.Join(dir, "shelf", "outbox.jsonl"))
	if strings.Count(string(ob), "\n") != 1 || !strings.Contains(string(ob), `"from":"tarot"`) {
		t.Fatalf("outbox: %q", ob)
	}
	if a.conf().Printed != 1 {
		t.Fatalf("printed %d", a.conf().Printed)
	}

	// the site changes: a file new, one gone; the island follows
	s.files["cart.html"] = []byte("<!doctype html>cart 2")
	delete(s.files, "vendor/fonts/vt323.woff2")
	if err := a.shelfSync(srv.URL); err != nil {
		t.Fatal(err)
	}
	if _, b, _ := get("/cart.html"); b != "<!doctype html>cart 2" {
		t.Fatalf("not updated: %q", b)
	}
	if _, err := os.Stat(filepath.Join(dir, "shelf", "files", "vendor", "fonts", "vt323.woff2")); err == nil {
		t.Fatal("a file the shelf dropped is kept")
	}
	// a shelf that names a way out is refused whole
	s.files["../island.json"] = []byte("x")
	if err := a.shelfSync(srv.URL); err == nil {
		t.Fatal("a path out of the shelf taken")
	}
}

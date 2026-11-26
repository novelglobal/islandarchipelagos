// SPDX-License-Identifier: AGPL-3.0-or-later

package main

import (
	"net/http/httptest"
	"net/url"
	"path/filepath"
	"strings"
	"testing"
)

// the keeper pauses the island with the slip key, from any phone on its Wi-Fi; nothing a stranger starts prints until they start it again
func TestKeeperPause(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "island.json")
	c, _ := loadConfig(path)
	c.Mode = "offline"
	a := &App{cfg: c, path: path, pr: &Printer{dry: dir}, asks: make(chan string, 4)}
	p := &portal{a: a}
	post := func(target, ct, body string) *httptest.ResponseRecorder {
		r := httptest.NewRequest("POST", "http://10.42.0.1"+target, strings.NewReader(body))
		r.Header.Set("content-type", ct)
		r.Header.Set("x-island", "1")
		r.RemoteAddr = "10.42.0.9:5000"
		w := httptest.NewRecorder()
		p.ServeHTTP(w, r)
		return w
	}
	form := "application/x-www-form-urlencoded"
	if w := post("/setup", form, url.Values{"pass": {"WRONGWRONG"}, "do": {"pause"}}.Encode()); a.paused() || !strings.Contains(w.Body.String(), "SLIP KEY") {
		t.Fatal("paused without the slip key")
	}
	post("/setup", form, url.Values{"pass": {c.SetupPass}, "do": {"pause"}}.Encode())
	if !a.paused() {
		t.Fatal("the slip key did not pause the island")
	}
	if w := post("/print", form, "w=HELLO"); w.Body.String() != "PAUSED." {
		t.Fatalf("a W.I.S.H. while paused: %q", w.Body.String())
	}
	if w := post("/api/stories", "application/json", `{"escpos":"G0AdVkIA"}`); w.Code != 503 || !strings.Contains(w.Body.String(), "paused") {
		t.Fatalf("a print from a card while paused: %d %s", w.Code, w.Body.String())
	}
	if w := post("/pass", form, ""); !strings.Contains(w.Body.String(), "PAUSED") {
		t.Fatalf("a pass while paused: %q", w.Body.String())
	}
	if d, _ := a.pullStep(0); d == 0 {
		t.Fatal("the island asked the site for prints while paused")
	}
	if !strings.Contains(string(statusSlip(a)), "PAUSED") {
		t.Fatal("the status slip does not say paused")
	}
	if n, _ := filepath.Glob(filepath.Join(dir, "slip-*.bin")); len(n) != 0 {
		t.Fatalf("printed while paused: %d", len(n))
	}
	post("/setup", form, url.Values{"pass": {c.SetupPass}, "do": {"pause"}}.Encode())
	if a.paused() {
		t.Fatal("the slip key did not start the island again")
	}
	if w := post("/print", form, "w=HELLO"); !strings.HasPrefix(w.Body.String(), "PRINTED") {
		t.Fatalf("a W.I.S.H. after: %q", w.Body.String())
	}
	if c2, _ := loadConfig(path); c2.Paused {
		t.Fatal("the pause was not let go in the settings")
	}
}

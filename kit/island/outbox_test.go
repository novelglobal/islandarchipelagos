// SPDX-License-Identifier: AGPL-3.0-or-later

package main

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
	"time"
)

// a receipt as a cart sends it: a black band, then a grey band in four layers, then the cut
func receipt() []byte {
	b := []byte{0x1B, 0x40, 0x1D, 0x76, 0x30, 0x00, 72, 0, 200, 0}
	b = append(b, make([]byte, 72*200)...)
	for k := 10; k < len(b); k++ {
		b[k] = 0xFF
	}
	w, h := 576, 100
	n := 72*h + 10
	for c := 0; c < 4; c++ {
		b = append(b, 0x1D, 0x28, 0x4C, byte(n), byte(n>>8), 0x30, 0x70, 0x34, 0x01, 0x01, byte(0x31+c), byte(w), byte(w>>8), byte(h), 0)
		b = append(b, make([]byte, 72*h)...)
	}
	b = append(b, 0x1D, 0x28, 0x4C, 0x02, 0x00, 0x30, 0x32)
	return append(b, 0x1B, 0x64, 0x04, 0x1D, 0x56, 0x42, 0x00)
}

func TestThumb(t *testing.T) {
	r := receipt()
	if !rasterOnly(r) {
		t.Fatal("the receipt itself refused")
	}
	p := strings.SplitN(thumbOf(r), ",", 3)
	if len(p) != 3 {
		t.Fatalf("no picture: %v", p)
	}
	w, _ := strconv.Atoi(p[0])
	h, _ := strconv.Atoi(p[1])
	bits, err := base64.StdEncoding.DecodeString(p[2])
	if err != nil || w > 96 || h > 150 || w < 40 || len(bits) != (w+7)/8*h || len(p[2]) > 2400 {
		t.Fatalf("thumb %dx%d, %d bytes, %d chars, %v", w, h, len(bits), len(p[2]), err)
	}
	rb := (w + 7) / 8
	if bits[0] != 0xFF || bits[(h-1)*rb] != 0 {
		t.Fatalf("the black band on top and the blank grey under it: %x %x", bits[0], bits[(h-1)*rb])
	}
	if thumbOf([]byte("HELLO\n")) != "" {
		t.Fatal("a picture of no picture")
	}
}

func TestOutboxSend(t *testing.T) {
	var got [][]map[string]any
	status := 200
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/printers/isle/outbox" || r.Header.Get("authorization") != "Bearer tok" {
			w.WriteHeader(404)
			return
		}
		var b struct{ Prints []map[string]any }
		json.NewDecoder(r.Body).Decode(&b)
		got = append(got, b.Prints)
		w.WriteHeader(status)
		w.Write([]byte(`{"ok":true}`))
	}))
	defer srv.Close()
	a, dir := testApp(t, srv.URL)
	t.Setenv("ISLAND_SHELF", filepath.Join(dir, "shelf"))
	outboxNext = time.Time{}
	for k := 0; k < 45; k++ {
		a.outbox("DA-7K2Q", "tarot", receipt())
	}
	l := Link{Server: srv.URL, Printer: "isle", Token: "tok"}
	lines := func() int {
		b, _ := os.ReadFile(a.outboxName())
		return strings.Count(string(b), "\n")
	}
	if lines() != 45 {
		t.Fatalf("kept %d", lines())
	}
	a.sendOutbox(l)
	if len(got) != 1 || len(got[0]) != 40 || lines() != 5 {
		t.Fatalf("first forty: %d sends, %d left", len(got), lines())
	}
	x := got[0][0]
	if x["code"] != "DA-7K2Q" || x["from"] != "tarot" || !strings.Contains(x["thumb"].(string), ",") || len(x["id"].(string)) != 24 {
		t.Fatalf("a print sent as %v", x)
	}
	ids := map[any]bool{}
	for _, p := range got[0] {
		ids[p["id"]] = true
	}
	if len(ids) != 40 {
		t.Fatalf("ids not one each: %d", len(ids))
	}
	status = 500
	a.sendOutbox(l)
	if lines() != 5 || outboxNext.IsZero() {
		t.Fatalf("a failed send lost prints: %d left", lines())
	}
	a.sendOutbox(l)
	if len(got) != 2 {
		t.Fatalf("tried again at once: %d", len(got))
	}
	status, outboxNext = 200, time.Time{}
	a.sendOutbox(l)
	if lines() != 0 || len(got[2]) != 5 {
		t.Fatalf("the rest: %d left", lines())
	}
}

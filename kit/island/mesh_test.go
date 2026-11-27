// SPDX-License-Identifier: AGPL-3.0-or-later

package main

import (
	"encoding/json"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// the drawings spec/tools/meshdraw.mjs encodes are the drawings the island reads: every stroke, every point, and nothing it should refuse
func TestMeshDrawingsAsEncoded(t *testing.T) {
	raw, err := os.ReadFile("../../spec/fixtures/mesh.json")
	if err != nil {
		t.Skip("the mesh cases are not beside this island's code")
	}
	var f struct {
		Cases []struct {
			Name    string     `json:"name"`
			H       int        `json:"h"`
			Strokes [][][2]int `json:"strokes"`
			Msg     string     `json:"msg"`
		} `json:"cases"`
		Bad []string `json:"bad"`
	}
	json.Unmarshal(raw, &f)
	for _, c := range f.Cases {
		h, st, err := decodeMesh(c.Msg)
		if err != nil || h != c.H {
			t.Fatalf("%s: %v %d", c.Name, err, h)
		}
		got := [][2]int{}
		for _, s := range st {
			got = append(got, s.pts...)
		}
		for _, s := range c.Strokes {
			for _, p := range s {
				found := false
				for _, q := range got {
					found = found || q == p
				}
				if !found {
					t.Errorf("%s: the point %v is not on the drawing", c.Name, p)
				}
			}
		}
		if img := meshImage(h, st); img.Bounds().Dx() != dots || img.Bounds().Dy() != h*dots/64 {
			t.Errorf("%s: drawn at %v", c.Name, img.Bounds())
		}
	}
	for _, b := range f.Bad {
		if _, _, err := decodeMesh(b); err == nil {
			t.Errorf("a broken drawing was read: %q", b)
		}
	}
}

// what the mesh hears prints, from the bridge on this machine only; words print as words; pause holds it
func TestMeshIn(t *testing.T) {
	dir := t.TempDir()
	c, _ := loadConfig(filepath.Join(dir, "island.json"))
	c.Mode = "offline"
	a := &App{cfg: c, path: filepath.Join(dir, "island.json"), pr: &Printer{dry: dir}, asks: make(chan string, 4)}
	p := &portal{a: a}
	send := func(from, body string) int {
		r := httptest.NewRequest("POST", "http://127.0.0.1/mesh", strings.NewReader(body))
		r.RemoteAddr = from
		w := httptest.NewRecorder()
		p.ServeHTTP(w, r)
		return w.Code
	}
	if send("10.42.0.9:5000", "hello") != 403 {
		t.Fatal("a phone on the island's Wi-Fi reached the mesh door")
	}
	if send("127.0.0.1:5000", "A NOTE FROM THE RIVER") != 200 || send("127.0.0.1:5000", "ng1:CAAEAT8") != 200 {
		t.Fatal("words or a drawing from the mesh did not print")
	}
	if send("127.0.0.1:5000", "ng1:!!") != 400 {
		t.Fatal("a broken drawing printed")
	}
	a.update(func(c *Config) { c.Paused = true })
	if send("127.0.0.1:5000", "hello") != 503 {
		t.Fatal("printed while paused")
	}
	if n, _ := filepath.Glob(filepath.Join(dir, "slip-*.bin")); len(n) != 2 {
		t.Fatalf("%d slips", len(n))
	}
}

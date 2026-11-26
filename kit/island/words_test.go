// SPDX-License-Identifier: AGPL-3.0-or-later

package main

import (
	"encoding/json"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

// every island line on the approval page's list (web/repo-static/lines.json) is one the island shows through words(), and the
// island shows none the list leaves out: a line changed there is never a line nobody sees
func TestEveryIslandLineIsListed(t *testing.T) {
	b, err := os.ReadFile("../../web/repo-static/lines.json")
	if err != nil {
		t.Skip("the site's list of lines is not beside this island's code")
	}
	var L map[string][]string
	if err := json.Unmarshal(b, &L); err != nil {
		t.Fatal(err)
	}
	src := pageHTML
	for _, f := range []string{"portal.go", "presence.go", "main.go"} {
		g, _ := os.ReadFile(f)
		src += string(g)
	}
	listed := map[string]bool{}
	for _, g := range []string{"ISLAND", "ISLAND ANSWERS", "ISLAND KEEPER"} {
		for _, l := range L[g] {
			listed[l] = true
			if !strings.Contains(src, `words "`+l+`"`) && !strings.Contains(src, `words("`+l+`")`) && !strings.Contains(src, `false: "`+l+`"`) && !strings.Contains(src, `true: "`+l+`"`) {
				t.Errorf("listed but not shown through words(): %q", l)
			}
		}
	}
	for _, m := range strings.Split(src, `words "`)[1:] {
		if l := m[:strings.Index(m, `"`)]; !listed[l] {
			t.Errorf("shown through words() but not on the list: %q", l)
		}
	}
}

// a line changed on the approval page reaches the island's page and its answers from its kept copy of the site's settings
func TestALineChangedReachesTheIsland(t *testing.T) {
	dir := t.TempDir()
	t.Setenv("ISLAND_SHELF", dir)
	path := filepath.Join(dir, "island.json")
	c, _ := loadConfig(path)
	c.Mode = "offline"
	a := &App{cfg: c, path: path, pr: &Printer{dry: dir}, asks: make(chan string, 4)}
	a.keepWords()
	defer func() { wordsNow.Lock(); wordsNow.file = ""; wordsNow.Unlock() }()
	p := &portal{a: a}
	page := func() string {
		w := httptest.NewRecorder()
		p.ServeHTTP(w, httptest.NewRequest("GET", "http://10.42.0.1/", nil))
		return w.Body.String()
	}
	if !strings.Contains(page(), ">PRINT<") {
		t.Fatal("as built, with nothing kept")
	}
	say, _ := json.Marshal(map[string]string{"PRINT": "PRINT IT", "WRITE A LINE FIRST.": "A LINE, PLEASE.", "PRINTED. TAKE IT FROM THE PRINTER.": "THERE IT IS."})
	set, _ := json.Marshal(map[string]any{"say": string(say), "allOpen": true})
	os.MkdirAll(filepath.Join(dir, "feeds"), 0o755)
	f := filepath.Join(dir, "feeds", feedName("/api/settings"))
	os.WriteFile(f, set, 0o644)
	os.Chtimes(f, time.Now(), time.Now().Add(time.Second))
	b := page()
	if !strings.Contains(b, ">PRINT IT<") || !strings.Contains(b, `"THERE IT IS."`) || !strings.Contains(b, ">PASS<") {
		t.Fatal("the changed lines are not on the island's page")
	}
	r := httptest.NewRequest("POST", "http://10.42.0.1/print", strings.NewReader(url.Values{"w": {""}}.Encode()))
	r.Header.Set("content-type", "application/x-www-form-urlencoded")
	r.Header.Set("x-island", "1")
	w := httptest.NewRecorder()
	p.ServeHTTP(w, r)
	if w.Body.String() != "A LINE, PLEASE." {
		t.Fatalf("an answer: %q", w.Body.String())
	}
}

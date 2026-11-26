// SPDX-License-Identifier: AGPL-3.0-or-later

package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"time"
)

// Every line the island shows, as the site's approval page changed it (EVERY LINE, web/repo-static/lines.json). The island keeps
// the site's settings while it is online (a shelf feed) and finds each line there by the line as built; with none kept, or a
// line not changed, it is as built. Nothing is fetched to show a line: offline, the last kept copy stands.

var wordsNow struct {
	sync.Mutex
	file string
	mod  time.Time
	say  map[string]string
}

func (a *App) keepWords() {
	wordsNow.Lock()
	wordsNow.file = filepath.Join(a.shelfDir(), "feeds", feedName("/api/settings"))
	wordsNow.Unlock()
}

func words(s string) string {
	wordsNow.Lock()
	defer wordsNow.Unlock()
	if wordsNow.file == "" {
		return s
	}
	if st, err := os.Stat(wordsNow.file); err != nil {
		wordsNow.say, wordsNow.mod = nil, time.Time{}
	} else if !st.ModTime().Equal(wordsNow.mod) {
		wordsNow.mod, wordsNow.say = st.ModTime(), nil
		var set struct {
			Say string `json:"say"`
		}
		if b, err := os.ReadFile(wordsNow.file); err == nil && json.Unmarshal(b, &set) == nil && set.Say != "" {
			json.Unmarshal([]byte(set.Say), &wordsNow.say)
		}
	}
	if v := wordsNow.say[s]; v != "" {
		return v
	}
	return s
}

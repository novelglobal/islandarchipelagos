package slip

import (
	"encoding/hex"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// TestGolden runs every case in fixtures/golden: the same bytes as tools/slip.mjs and front's worker.
func TestGolden(t *testing.T) {
	files, _ := filepath.Glob(filepath.Join("..", "..", "spec", "fixtures", "golden", "*.json"))
	if len(files) == 0 {
		t.Fatal("no golden cases")
	}
	for _, f := range files {
		raw, err := os.ReadFile(f)
		if err != nil {
			t.Fatal(err)
		}
		var in Input
		if err := json.Unmarshal(raw, &in); err != nil {
			t.Fatalf("%s: %v", f, err)
		}
		h, _ := os.ReadFile(strings.TrimSuffix(f, ".json") + ".hex")
		want, err := hex.DecodeString(strings.Join(strings.Fields(string(h)), ""))
		if err != nil {
			t.Fatalf("%s: %v", f, err)
		}
		got := Compile(in)
		if string(got) != string(want) {
			at := 0
			for at < len(got) && at < len(want) && got[at] == want[at] {
				at++
			}
			t.Errorf("%s: differs at byte %d (got %d bytes, want %d)", filepath.Base(f), at, len(got), len(want))
		}
	}
}

func TestBoardCode(t *testing.T) {
	for in, want := range map[string]string{"rw/zw": "RW/ZW", " rw / zw/ww/ab/cd/ef ": "RW/ZW/WW/AB", "R/ZWX/ß1": "", "": ""} {
		if got := BoardCode(in); got != want {
			t.Errorf("BoardCode(%q) = %q, want %q", in, got, want)
		}
	}
}

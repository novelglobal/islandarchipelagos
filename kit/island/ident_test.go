// SPDX-License-Identifier: AGPL-3.0-or-later

package main

import (
	"bytes"
	"crypto/ed25519"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestIdentMadeOnceAndKept(t *testing.T) {
	p := filepath.Join(t.TempDir(), "island.json")
	a, err := loadConfig(p)
	if err != nil || a.privateKey() == nil {
		t.Fatalf("no key made: %v", err)
	}
	b, _ := loadConfig(p)
	if a.Ident != b.Ident {
		t.Fatal("the key changed when the island started again")
	}
	if c, _ := loadConfig(filepath.Join(t.TempDir(), "island.json")); c.Ident == a.Ident {
		t.Fatal("two islands made the same key")
	}
}

func TestEntrySignedAndChecked(t *testing.T) {
	c := &Config{Name: "BENCH"}
	c.ensureIdent()
	a := &App{cfg: c}
	s, err := a.entry()
	if err != nil {
		t.Fatal(err)
	}
	e, err := verifyEntry(s, time.Now())
	if err != nil || e.Name != "BENCH" || e.Open || e.V != entryFormat {
		t.Fatalf("its own entry: %v %+v", err, e)
	}
	// one byte changed, anywhere in the entry, and it is not the island's any more
	for i := 0; i < len(s.Entry); i += 7 {
		b := []byte(s.Entry)
		b[i] ^= 1
		if _, err := verifyEntry(Signed{string(b), s.Sig}, time.Now()); err == nil {
			t.Fatalf("a changed entry passed (byte %d)", i)
		}
	}
	if _, err := verifyEntry(s, time.Now().Add(entryLife+time.Hour)); err != errExpired {
		t.Fatalf("an old entry held: %v", err)
	}
	// another island's key cannot sign for this one
	o := &Config{}
	o.ensureIdent()
	var en Entry
	json.Unmarshal([]byte(s.Entry), &en)
	forged, _ := signEntry(o.privateKey(), en)
	var fe Entry
	json.Unmarshal([]byte(forged.Entry), &fe)
	if fe.Key == en.Key {
		t.Fatal("a key signed as another")
	}
}

func TestStatusSlipShowsTheKey(t *testing.T) {
	c := &Config{Name: "BENCH", Mode: "offline", SetupPass: "ABCDEFGHJK"}
	c.ensureIdent()
	b := statusSlip(&App{cfg: c, pr: &Printer{dry: t.TempDir()}})
	if !bytes.Contains(b, []byte("KEY  "+keyMark(c.privateKey().Public().(ed25519.PublicKey)))) {
		t.Fatal("the status slip does not show the island's key")
	}
}

// spec/fixtures/entry.json: entries made with a known key at a known time, and what any checker must say of each. The island
// checks them here; spec/tools/entry.mjs checks the same in JavaScript, so two makings agree. ENTRY_WRITE=1 makes them again.
type entryCase struct {
	Name   string `json:"name"`
	Signed Signed `json:"signed"`
	Want   string `json:"want"`
}
type entryFixtures struct {
	Now   int64       `json:"now"`
	Mark  string      `json:"mark"`
	Cases []entryCase `json:"cases"`
}

func TestEntryFixtures(t *testing.T) {
	path := "../../spec/fixtures/entry.json"
	if os.Getenv("ENTRY_WRITE") != "" {
		seed := bytes.Repeat([]byte{7}, ed25519.SeedSize)
		k := ed25519.NewKeyFromSeed(seed)
		at := int64(1795700000)
		e := Entry{Name: "BENCH", Printer: "TM-T88V", Greys: 16, Paper: "80", Cards: []string{"paper"}, Open: true, At: at, Until: at + int64(entryLife/time.Second)}
		good, _ := signEntry(k, e)
		tampered := Signed{strings.Replace(good.Entry, `"BENCH"`, `"BENCX"`, 1), good.Sig}
		other := ed25519.NewKeyFromSeed(bytes.Repeat([]byte{9}, ed25519.SeedSize))
		var en Entry
		json.Unmarshal([]byte(good.Entry), &en)
		b, _ := json.Marshal(en)
		swapped := Signed{string(b), b64.EncodeToString(ed25519.Sign(other, b))}
		long := e
		long.Until = at + 400*24*3600
		toolong, _ := signEntry(k, long)
		f := entryFixtures{Now: at + 3600, Mark: keyMark(k.Public().(ed25519.PublicKey)), Cases: []entryCase{
			{"good", good, "ok"}, {"one letter changed", tampered, "sig"}, {"signed by another key", swapped, "sig"},
			{"holds for over 90 days", toolong, "format"}, {"not an entry", Signed{`{"v":"x"}`, good.Sig}, "format"}}}
		f.Cases = append(f.Cases, entryCase{"run out", good, "expired"})
		out, _ := json.MarshalIndent(f, "", " ")
		os.WriteFile(path, append(out, '\n'), 0o644)
	}
	raw, err := os.ReadFile(path)
	if err != nil {
		t.Skip("the fixtures are not beside this island's code")
	}
	var f entryFixtures
	if err := json.Unmarshal(raw, &f); err != nil {
		t.Fatal(err)
	}
	if k := ed25519.NewKeyFromSeed(bytes.Repeat([]byte{7}, ed25519.SeedSize)); keyMark(k.Public().(ed25519.PublicKey)) != f.Mark {
		t.Errorf("the key's mark: %s, the fixtures say %s", keyMark(k.Public().(ed25519.PublicKey)), f.Mark)
	}
	for _, c := range f.Cases {
		now := time.Unix(f.Now, 0)
		if c.Name == "run out" {
			now = now.Add(entryLife)
		}
		_, err := verifyEntry(c.Signed, now)
		got := map[error]string{nil: "ok", errSig: "sig", errFormat: "format", errExpired: "expired"}[err]
		if got != c.Want {
			t.Errorf("%s: %s, want %s (%v)", c.Name, got, c.Want, err)
		}
	}
}

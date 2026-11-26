// SPDX-License-Identifier: AGPL-3.0-or-later

package main

import (
	"crypto/ed25519"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base32"
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"
)

// An island's own key: made on the island the first time it starts, kept with its settings, never sent anywhere and never
// issued by a site. It signs the island's entry (/entry.json), so a copy of the entry (fetched from any site, carried on paper, passed
// on by another island) can be checked against the island that made it, by anyone, with no one to ask.
//
// What a signed entry proves: this island's key made these bytes, unchanged. What it does not: that the island still
// exists, that it is where it says, or that its keeper is honest. The until date bounds how long a copy holds.

const entryFormat = "island/entry/0"

// how long a signed entry holds; a copy older than this is let go wherever it is
const entryLife = 30 * 24 * time.Hour

type Entry struct {
	V       string   `json:"v"`
	Key     string   `json:"key"`
	Name    string   `json:"name"`
	Printer string   `json:"printer,omitempty"`
	Greys   int      `json:"greys,omitempty"`
	Paper   string   `json:"paper"`
	Cards   []string `json:"cards,omitempty"`
	Open    bool     `json:"open"`
	At      int64    `json:"at"`
	Until   int64    `json:"until"`
}

// Signed: the entry exactly as signed (a string, so no one has to agree on how to write JSON), and its signature
type Signed struct {
	Entry string `json:"entry"`
	Sig   string `json:"sig"`
}

var b64 = base64.RawURLEncoding

// ensureIdent: the island's key, made once
func (c *Config) ensureIdent() bool {
	if seed, err := b64.DecodeString(c.Ident); err == nil && len(seed) == ed25519.SeedSize {
		return false
	}
	seed := make([]byte, ed25519.SeedSize)
	if _, err := rand.Read(seed); err != nil {
		panic(err)
	}
	c.Ident = b64.EncodeToString(seed)
	return true
}

func (c *Config) privateKey() ed25519.PrivateKey {
	seed, err := b64.DecodeString(c.Ident)
	if err != nil || len(seed) != ed25519.SeedSize {
		return nil
	}
	return ed25519.NewKeyFromSeed(seed)
}

// keyMark: the key as people read it off a slip, eight letters (a fingerprint: the same key, the same mark)
func keyMark(pub ed25519.PublicKey) string {
	h := sha256.Sum256(pub)
	s := base32.StdEncoding.EncodeToString(h[:5])
	return s[:4] + "-" + s[4:8]
}

// greysOf: the greys a printer is known to lay. Only models benched as islands are listed; the rest lay dots
func greysOf(model string) int {
	switch m := strings.ToUpper(strings.TrimSpace(model)); {
	case m == "":
		return 0
	case m == "TM-T88V" || m == "TM-T88VI":
		return 16
	default:
		return 2
	}
}

func signEntry(priv ed25519.PrivateKey, e Entry) (Signed, error) {
	if priv == nil {
		return Signed{}, errors.New("no key")
	}
	e.V, e.Key = entryFormat, b64.EncodeToString(priv.Public().(ed25519.PublicKey))
	b, err := json.Marshal(e)
	if err != nil {
		return Signed{}, err
	}
	return Signed{Entry: string(b), Sig: b64.EncodeToString(ed25519.Sign(priv, b))}, nil
}

var (
	errSig     = errors.New("the signature is not this entry's key's")
	errFormat  = errors.New("not an island entry")
	errExpired = errors.New("the entry has run out")
)

// verifyEntry: an entry's own key signed exactly these bytes, and it holds at now
func verifyEntry(s Signed, now time.Time) (Entry, error) {
	var e Entry
	if err := json.Unmarshal([]byte(s.Entry), &e); err != nil || e.V != entryFormat {
		return e, errFormat
	}
	pub, err := b64.DecodeString(e.Key)
	sig, err2 := b64.DecodeString(s.Sig)
	if err != nil || err2 != nil || len(pub) != ed25519.PublicKeySize || len(sig) != ed25519.SignatureSize {
		return e, errFormat
	}
	if !ed25519.Verify(ed25519.PublicKey(pub), []byte(s.Entry), sig) {
		return e, errSig
	}
	if e.Until <= e.At || time.Duration(e.Until-e.At)*time.Second > 90*24*time.Hour {
		return e, errFormat
	}
	if t := now.Unix(); t > e.Until {
		return e, errExpired
	}
	return e, nil
}

// the island's entry as it is now
func (a *App) entry() (Signed, error) {
	c := a.conf()
	e := Entry{Name: c.Name, Paper: paper, Open: c.Open, At: time.Now().Unix()}
	e.Until = e.At + int64(entryLife/time.Second)
	if a.pr != nil {
		e.Printer = a.pr.Model()
		e.Greys = greysOf(e.Printer)
	}
	if l := a.shelf(); l != nil {
		for _, ct := range l.Carts {
			e.Cards = append(e.Cards, ct.ID)
		}
	}
	return signEntry(c.privateKey(), e)
}

// GET /entry.json: the island's signed entry, for any page that asks
func (p *portal) serveEntry(w http.ResponseWriter) {
	s, err := p.a.entry()
	if err != nil {
		jsonOut(w, 503, map[string]any{"error": "no key"})
		return
	}
	w.Header().Set("access-control-allow-origin", "*")
	jsonOut(w, 200, s)
}

// SPDX-License-Identifier: AGPL-3.0-or-later

package main

// The outbox: every print made on the island's own Wi-Fi is kept here, one line each with its own id and a small
// picture of it. Once the island is online again it sends them to the site, forty at a time; the site keeps each id
// once, so a line sent twice is dropped there, and its twin's roll shows them.

import (
	"bytes"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"sync"
	"time"
)

const (
	outboxMax  = 4 << 20 // about 1,600 prints; past that the newest wait until some are sent
	outboxSend = 40
)

var (
	outboxMu   sync.Mutex
	outboxNext time.Time // after a failed send, the next try waits
	outboxSeq  uint32
)

func (a *App) outboxName() string { return filepath.Join(a.shelfDir(), "outbox.jsonl") }

func (a *App) outbox(code, from string, raw []byte) {
	h, th := sha256.Sum256(raw), thumbOf(raw)
	name := a.outboxName()
	outboxMu.Lock()
	defer outboxMu.Unlock()
	// its id: the print, the second, and a count, so two alike in one second are still two
	outboxSeq++
	now := time.Now()
	line, _ := json.Marshal(map[string]any{"id": hex.EncodeToString(h[:6]) + fmt.Sprintf("%08x%04x", uint32(now.Unix()), outboxSeq&0xffff), "at": now.Unix(), "code": code, "from": from, "n": len(raw), "thumb": th})
	if err := os.MkdirAll(filepath.Dir(name), 0o755); err != nil {
		return
	}
	if fi, err := os.Stat(name); err == nil && fi.Size() > outboxMax {
		return
	}
	f, err := os.OpenFile(name, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o644)
	if err != nil {
		return
	}
	defer f.Close()
	f.Write(append(line, '\n'))
}

// sendOutbox: the oldest forty sent home; once the site has them they leave the file
func (a *App) sendOutbox(l Link) {
	name := a.outboxName()
	if fi, err := os.Stat(name); err != nil || fi.Size() == 0 || l.Token == "" || l.Printer == "" {
		return
	}
	outboxMu.Lock()
	if time.Now().Before(outboxNext) {
		outboxMu.Unlock()
		return
	}
	b, err := os.ReadFile(name)
	outboxMu.Unlock()
	if err != nil {
		return
	}
	var batch []json.RawMessage
	cut := 0
	for k := 0; k < outboxSend && cut < len(b); k++ {
		e := bytes.IndexByte(b[cut:], '\n')
		if e < 0 {
			break // a line still being written
		}
		if ln := b[cut : cut+e]; json.Valid(ln) {
			batch = append(batch, json.RawMessage(ln))
		}
		cut += e + 1
	}
	if cut == 0 {
		return
	}
	if len(batch) > 0 {
		r, err := call("POST", l.Server+"/api/printers/"+url.PathEscape(l.Printer)+"/outbox", l.Token, map[string]any{"prints": batch})
		if err != nil || r.Status != 200 {
			outboxMu.Lock()
			outboxNext = time.Now().Add(10 * time.Minute)
			outboxMu.Unlock()
			if err == nil {
				log.Printf("outbox: the site answered %d", r.Status)
			}
			return
		}
		log.Printf("outbox: %d prints made offline sent home", len(batch))
	}
	outboxMu.Lock()
	defer outboxMu.Unlock()
	cur, err := os.ReadFile(name)
	if err != nil || !bytes.HasPrefix(cur, b[:cut]) {
		return
	}
	if err := writeAtomic(name, cur[cut:]); err != nil {
		log.Printf("outbox: %v", err)
	}
}

// thumbOf: a small one-bit picture of a print, "w,h,base64" rows of bits, as the site keeps one for its twin's roll.
// The print's pictures (GS v 0, and the four grey layers of GS ( L) are stacked as the paper would show them and shrunk
// to fit 1,800 bytes. The bytes have passed rasterOnly.
func thumbOf(b []byte) string {
	type band struct {
		w, h int
		dk   []uint16
	}
	var bands []band
	var grey *band
	u16 := func(i int) int { return int(b[i]) | int(b[i+1])<<8 }
	for i := 0; i < len(b); {
		switch {
		case b[i] == 0x1B && i+1 < len(b):
			if b[i+1] == 0x40 {
				i += 2
			} else {
				i += 3
			}
		case b[i] == 0x1D && i+2 < len(b) && b[i+1] == 0x76 && i+8 <= len(b):
			bw, h := u16(i+4), u16(i+6)
			d := i + 8
			if bw == 0 || d+bw*h > len(b) {
				return ""
			}
			bd := band{bw * 8, h, make([]uint16, bw*8*h)}
			for k := 0; k < bw*h; k++ {
				for bit := 0; bit < 8; bit++ {
					if b[d+k]&(0x80>>bit) != 0 {
						bd.dk[k*8+bit] = 255
					}
				}
			}
			bands = append(bands, bd)
			i = d + bw*h
		case b[i] == 0x1D && i+2 < len(b) && b[i+1] == 0x56:
			if b[i+2] == 0x41 || b[i+2] == 0x42 {
				i += 4
			} else {
				i += 3
			}
		case b[i] == 0x1D && i+4 < len(b) && b[i+1] == 0x28:
			n, p := u16(i+3), i+5
			if p+n > len(b) {
				return ""
			}
			if b[i+2] == 0x4C && n >= 10 && b[p+1] == 0x70 {
				w, h, d := u16(p+6), u16(p+8), p+10
				rb := (w + 7) / 8
				if w > 0 && d+rb*h <= p+n {
					if b[p+5] == 0x31 || grey == nil || grey.w != w || grey.h != h {
						grey = &band{w, h, make([]uint16, w*h)}
					}
					for y := 0; y < h; y++ {
						for x := 0; x < w; x++ {
							if b[d+y*rb+x/8]&(0x80>>(x%8)) != 0 {
								grey.dk[y*w+x] += 64
							}
						}
					}
				}
			} else if b[i+2] == 0x4C && b[p+1] == 0x32 && grey != nil {
				bands = append(bands, *grey)
				grey = nil
			}
			i = p + n
		case b[i] == 0x1D:
			i += 3
		default:
			i++
		}
	}
	W, H := 0, 0
	for _, bd := range bands {
		W, H = max(W, bd.w), H+bd.h
	}
	if W == 0 || H == 0 {
		return ""
	}
	s := max((W+95)/96, (H+149)/150, 1)
	tw, th := (W+s-1)/s, (H+s-1)/s
	sum, cnt := make([]int, tw*th), make([]int, tw*th)
	y0 := 0
	for _, bd := range bands {
		for y := 0; y < bd.h; y++ {
			for x := 0; x < W; x++ {
				v := 0
				if x < bd.w {
					v = int(min(bd.dk[y*bd.w+x], 255))
				}
				k := ((y0+y)/s)*tw + x/s
				sum[k] += v
				cnt[k]++
			}
		}
		y0 += bd.h
	}
	rb := (tw + 7) / 8
	out := make([]byte, rb*th)
	for y := 0; y < th; y++ {
		for x := 0; x < tw; x++ {
			if k := y*tw + x; cnt[k] > 0 && sum[k]/cnt[k] > 60 {
				out[y*rb+x/8] |= 0x80 >> (x % 8)
			}
		}
	}
	return strconv.Itoa(tw) + "," + strconv.Itoa(th) + "," + base64.StdEncoding.EncodeToString(out)
}

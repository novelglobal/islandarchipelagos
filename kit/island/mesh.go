// SPDX-License-Identifier: AGPL-3.0-or-later

package main

import (
	"encoding/base64"
	"errors"
	"image"
	"image/color"
	"io"
	"log"
	"net"
	"net/http"
	"strings"
	"unicode/utf8"
)

// The mesh: a phone with no Wi-Fi and no internet sends a text message over a LoRa radio (the Meshtastic app, on any phone, to its
// own small radio by Bluetooth); the island's radio hears it, and a bridge on the Pi (kit/mesh/bridge.py) hands the text to
// POST /mesh here, from this machine only. A LoRa message holds about 230 bytes, so what travels is never a picture but what
// makes one:
//
//	plain words          a slip of words, as a W.I.S.H. prints
//	ng1:<base64url>      a drawing, as its strokes (meshSlip below), redrawn here at the printer's own dots and printed
//
// Pause and the day's limit hold here as for every other print.

const meshMax = 240

// mesh drawing, format 1 (ng1): bytes after base64url decoding
//
//	byte 0      the grid's height in cells (the width is always 64 cells, the paper's width)
//	then strokes, each: a start cell (x 1 byte, y 1 byte), a count n (1 byte), then n moves, each one byte: dx in the high
//	            nibble, dy in the low nibble, both -8 to 7 (two's complement nibbles). A stroke is a pen line through its cells
//
// 64 cells across 512 dots is 8 dots a cell: a line drawing, a signature, a map, a sketch; about 150 moves fit in one message.
var errMesh = errors.New("not a mesh drawing")

type meshStroke struct{ pts [][2]int }

func decodeMesh(s string) (h int, strokes []meshStroke, err error) {
	b, err := base64.RawURLEncoding.DecodeString(strings.TrimRight(strings.TrimPrefix(s, "ng1:"), "="))
	if err != nil || len(b) < 1 {
		return 0, nil, errMesh
	}
	h = int(b[0])
	if h < 1 || h > 160 {
		return 0, nil, errMesh
	}
	nib := func(v byte) int {
		x := int(v & 0xF)
		if x > 7 {
			x -= 16
		}
		return x
	}
	for i := 1; i < len(b); {
		if i+3 > len(b) {
			return 0, nil, errMesh
		}
		x, y, n := int(b[i]), int(b[i+1]), int(b[i+2])
		i += 3
		if x >= 64 || y >= h || i+n > len(b) {
			return 0, nil, errMesh
		}
		st := meshStroke{pts: [][2]int{{x, y}}}
		for k := 0; k < n; k++ {
			x += nib(b[i+k] >> 4)
			y += nib(b[i+k])
			if x < 0 || x >= 64 || y < 0 || y >= h {
				return 0, nil, errMesh
			}
			st.pts = append(st.pts, [2]int{x, y})
		}
		i += n
		strokes = append(strokes, st)
	}
	return h, strokes, nil
}

// meshImage: the strokes at the printer's own dots, a pen a cell wide
func meshImage(h int, strokes []meshStroke) *image.Gray {
	c := dots / 64
	img := image.NewGray(image.Rect(0, 0, 64*c, h*c))
	for i := range img.Pix {
		img.Pix[i] = 255
	}
	pen := func(x, y int) {
		for dy := 0; dy < c; dy++ {
			for dx := 0; dx < c; dx++ {
				img.SetGray(x+dx, y+dy, color.Gray{0})
			}
		}
	}
	for _, s := range strokes {
		for k, p := range s.pts {
			x1, y1 := p[0]*c, p[1]*c
			if k == 0 {
				pen(x1, y1)
				continue
			}
			x0, y0 := s.pts[k-1][0]*c, s.pts[k-1][1]*c
			n := max(abs(x1-x0), abs(y1-y0))
			for t := 0; t <= n; t++ {
				pen(x0+(x1-x0)*t/max(n, 1), y0+(y1-y0)*t/max(n, 1))
			}
		}
	}
	return img
}

func abs(v int) int {
	if v < 0 {
		return -v
	}
	return v
}

// meshPrint: one message heard on the mesh, made into a slip
func meshSlip(name, text string) ([]byte, error) {
	text = strings.TrimSpace(text)
	if text == "" || len(text) > meshMax || !utf8.ValidString(text) {
		return nil, errMesh
	}
	if strings.HasPrefix(text, "ng1:") {
		h, st, err := decodeMesh(text)
		if err != nil {
			return nil, err
		}
		return head(NewSlip(), name).Center().Image(meshImage(h, st)).Feed(1).Cut().Bytes(), nil
	}
	return wishSlip(name, []string{clean(text, meshMax)}), nil
}

// POST /mesh: from this machine only (the bridge), the message's text as the body
func (p *portal) meshIn(w http.ResponseWriter, r *http.Request) {
	ip, _, _ := net.SplitHostPort(r.RemoteAddr)
	if a := net.ParseIP(ip); a == nil || !a.IsLoopback() {
		http.Error(w, "this machine only", http.StatusForbidden)
		return
	}
	if p.a.paused() {
		http.Error(w, "paused", http.StatusServiceUnavailable)
		return
	}
	b, _ := io.ReadAll(http.MaxBytesReader(w, r.Body, 1024))
	slip, err := meshSlip(p.a.conf().Name, string(b))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if _, full := p.allow(r); full {
		http.Error(w, "full", http.StatusTooManyRequests)
		return
	}
	if err := p.a.pr.Print(slip); err != nil {
		p.a.failedOne()
		log.Printf("a mesh print not printed: %v", err)
		http.Error(w, "the printer did not answer", http.StatusServiceUnavailable)
		return
	}
	p.a.update(func(c *Config) { c.Printed++ })
	io.WriteString(w, "printed")
}

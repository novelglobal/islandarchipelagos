// Package slip turns a board into a slip: the engine's print steps, giving the same ESC/POS bytes as tools/slip.mjs
// and front's worker. fixtures/golden holds what all of them must give.
package slip

import (
	"encoding/base64"
	"math"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

type Printer struct {
	DPI    int    `json:"dpi"`
	Dots   int    `json:"dots"`
	Cutter string `json:"cutter"`
}

type Setting struct {
	Key     string `json:"key"`
	Kind    string `json:"kind"`
	Default any    `json:"default"`
}

type Block struct {
	Block   string  `json:"block"`
	If      string  `json:"if"`
	Width   float64 `json:"width"`
	Ink     string  `json:"ink"`
	Fixed   bool    `json:"fixed"`
	Setting string  `json:"setting"`
	Text    string  `json:"text"`
	Size    string  `json:"size"`
	Align   string  `json:"align"`
	Max     int     `json:"max"`
	Take    string  `json:"take"`
	Lines   int     `json:"lines"`
}

type Layout struct {
	Length string  `json:"length"`
	Blocks []Block `json:"blocks"`
}

// Mod is a mod.json with its slip read in.
type Mod struct {
	ID         string    `json:"id"`
	Version    string    `json:"version"`
	Island     string    `json:"island"`
	Connection string    `json:"connection"`
	Gives      []string  `json:"gives"`
	Takes      []string  `json:"takes"`
	Needs      []string  `json:"needs"`
	Settings   []Setting `json:"settings"`
	Slip       Layout    `json:"slip"`
}

type Input struct {
	Board    string                    `json:"board"`
	Press    string                    `json:"press"`
	Jacks    map[string]string         `json:"jacks"`
	Mods     []Mod                     `json:"mods"`
	State    map[string]map[string]any `json:"state"`
	Settings map[string]map[string]any `json:"settings"`
	On       map[string][]string       `json:"on"`
	Printer  Printer                   `json:"printer"`
}

var bayer = [8][8]int{
	{0, 32, 8, 40, 2, 34, 10, 42}, {48, 16, 56, 24, 50, 18, 58, 26}, {12, 44, 4, 36, 14, 46, 6, 38}, {60, 28, 52, 20, 62, 30, 54, 22},
	{3, 35, 11, 43, 1, 33, 9, 41}, {51, 19, 59, 27, 49, 17, 57, 25}, {15, 47, 7, 39, 13, 45, 5, 37}, {63, 31, 55, 23, 61, 29, 53, 21}}

// bytes a QR of each version holds, byte mode, error level M; the printer picks the smallest that fits
var qrCap = []int{14, 26, 42, 62, 84, 106, 122, 152, 180, 213, 251, 287, 331, 362, 412, 450, 504, 560, 624, 666}

const line, big, home = 30, 54, "https://novel.global/#b="

var elements = []string{"WORDS", "PICTURE", "SOUND", "CODE", "LIST", "LENGTH"}
var lengthMM = map[string]int{"poster": 150, "strip": 300}
var takes = map[string]string{"picture": "PICTURE", "words": "WORDS", "list": "LIST"}
var pair = regexp.MustCompile(`^[A-Z0-9]{2}$`)
var b64 = regexp.MustCompile(`^[A-Za-z0-9+/]*={0,2}$`)

func str(v any) string { s, _ := v.(string); return s }
func has(l []string, s string) bool {
	for _, x := range l {
		if x == s {
			return true
		}
	}
	return false
}

// Clean keeps printable ASCII, folds spaces, and cuts to n.
func Clean(s string, n int) string {
	var b strings.Builder
	for _, r := range s {
		switch {
		case r == 9 || r == 10 || r == 13:
			b.WriteByte(' ')
		case r >= 32 && r <= 126:
			b.WriteRune(r)
		default:
			b.WriteByte('?')
		}
	}
	var parts []string
	for _, p := range strings.Split(b.String(), " ") {
		if p != "" {
			parts = append(parts, p)
		}
	}
	out := strings.Join(parts, " ")
	if len(out) > n {
		out = out[:n]
	}
	return out
}

func BoardCode(s string) string {
	s = strings.Map(func(r rune) rune {
		switch {
		case r >= 'a' && r <= 'z':
			return r - 32
		case r == ' ' || r == '\t' || r == '\r' || r == '\n' || r == '\f' || r == '\v':
			return -1
		}
		return r
	}, s)
	var pairs []string
	for _, p := range strings.Split(s, "/") {
		if pair.MatchString(p) && len(pairs) < 4 {
			pairs = append(pairs, p)
		}
	}
	return strings.Join(pairs, "/")
}

func wrap(text string, w int) []string {
	var lines []string
	cur := ""
	for _, word := range strings.Split(text, " ") {
		for len(word) > w {
			if cur != "" {
				lines = append(lines, cur)
				cur = ""
			}
			lines = append(lines, word[:w])
			word = word[w:]
		}
		if word == "" {
			continue
		}
		if cur == "" {
			cur = word
		} else if len(cur)+1+len(word) <= w {
			cur += " " + word
		} else {
			lines = append(lines, cur)
			cur = word
		}
	}
	if cur != "" {
		lines = append(lines, cur)
	}
	return lines
}

func semver(v string) [3]int {
	var o [3]int
	for i, p := range strings.SplitN(v, ".", 3) {
		o[i], _ = strconv.Atoi(p)
	}
	return o
}

func byID(mods []Mod, ref string) *Mod {
	id, major, _ := strings.Cut(ref, "@")
	var found []*Mod
	for i := range mods {
		if mods[i].ID == id && (major == "" || strings.Split(mods[i].Version, ".")[0] == major) {
			found = append(found, &mods[i])
		}
	}
	if len(found) == 0 {
		return nil
	}
	sort.SliceStable(found, func(a, b int) bool {
		x, y := semver(found[a].Version), semver(found[b].Version)
		for i := 0; i < 3; i++ {
			if x[i] != y[i] {
				return x[i] > y[i]
			}
		}
		return false
	})
	return found[0]
}

// Arrivals: what reaches the pressed mod, element by element: its own, then its needs, then each cable in the board's order.
func Arrivals(in Input) (*Mod, map[string][]any) {
	q := map[string][]any{}
	var me *Mod
	for i := range in.Mods {
		if in.Mods[i].ID == in.Press {
			me = &in.Mods[i]
			break
		}
	}
	if me == nil {
		return nil, q
	}
	value := func(id, e string) (any, bool) {
		v, ok := in.State[id][e]
		return v, ok && v != nil
	}
	for _, e := range elements {
		if v, ok := value(me.ID, e); ok {
			q[e] = append(q[e], v)
		}
	}
	seen := map[string]bool{me.ID: true}
	open := func(m *Mod) bool { return m.Island == me.Island || has(in.On[m.Island], m.Connection) }
	hand := func(m *Mod) {
		for _, e := range elements {
			if v, ok := value(m.ID, e); ok && has(m.Gives, e) && has(me.Takes, e) {
				q[e] = append(q[e], v)
			}
		}
	}
	var need func(m *Mod)
	need = func(m *Mod) {
		for _, r := range m.Needs {
			n := byID(in.Mods, r)
			if n == nil || seen[n.ID] {
				continue
			}
			seen[n.ID] = true
			if !open(n) {
				continue
			}
			hand(n)
			need(n)
		}
	}
	need(me)
	mine := map[string]bool{}
	for k, ref := range in.Jacks {
		if m := byID(in.Mods, ref); m != nil && m.ID == me.ID {
			mine[k] = true
		}
	}
	if code := BoardCode(in.Board); code != "" {
		for _, p := range strings.Split(code, "/") {
			a, b := p[:1], p[1:]
			if a == b {
				continue
			}
			far := ""
			if mine[a] {
				far = b
			} else if mine[b] {
				far = a
			}
			if far == "" || in.Jacks[far] == "" {
				continue
			}
			m := byID(in.Mods, in.Jacks[far])
			if m == nil || seen[m.ID] {
				continue
			}
			seen[m.ID] = true
			if open(m) {
				hand(m)
			}
		}
	}
	return me, q
}

func Compile(in Input) []byte {
	me, q := Arrivals(in)
	var out []byte
	put := func(b ...byte) { out = append(out, b...) }
	text := func(s string) { out = append(out, s...) }
	shift := func(e string) any {
		if len(q[e]) == 0 {
			return nil
		}
		v := q[e][0]
		q[e] = q[e][1:]
		return v
	}
	D := in.Printer.Dots
	C := D / 12
	h := 0
	put(0x1b, 0x40, 0x1b, 0x33, line)
	set := func(k string) any {
		if s, ok := in.Settings[me.ID][k]; ok {
			return s
		}
		for _, s := range me.Settings {
			if s.Key == k {
				return s.Default
			}
		}
		return nil
	}
	var slip Layout
	if me != nil {
		slip = me.Slip
	}
	length := slip.Length
	if length == "" {
		length = "slip"
	}
	if len(q["LENGTH"]) > 0 {
		if l := str(q["LENGTH"][0]); l == "slip" || l == "poster" || l == "strip" {
			length = l
		}
	}
	large := length != "slip"
	qr := func(data string, m byte) bool {
		d := Clean(data, 250)
		if d == "" {
			return false
		}
		n := len(d) + 3
		put(0x1b, 0x61, 1, 0x1d, 0x28, 0x6b, 4, 0, 0x31, 0x41, 0x32, 0, 0x1d, 0x28, 0x6b, 3, 0, 0x31, 0x43, m, 0x1d, 0x28, 0x6b, 3, 0, 0x31, 0x45, 0x31,
			0x1d, 0x28, 0x6b, byte(n&255), byte(n>>8), 0x31, 0x50, 0x30)
		text(d)
		put(0x1d, 0x28, 0x6b, 3, 0, 0x31, 0x51, 0x30, 0x0a)
		v := len(qrCap)
		for i, c := range qrCap {
			if c >= len(d) {
				v = i + 1
				break
			}
		}
		h += (17+4*v)*int(m) + line
		return true
	}
	centre := func(t string) { put(0x1b, 0x61, 1); text(t); put(0x0a); h += line }
	shown := 0
	for _, b := range slip.Blocks {
		if b.If != "" && set(b.If) != true {
			continue
		}
		switch b.Block {
		case "rule":
			put(0x1b, 0x61, 0)
			text(strings.Repeat("-", C))
			put(0x0a)
			h += line
			continue
		case "space":
			n := b.Lines
			if n == 0 {
				n = 1
			}
			put(0x1b, 0x64, byte(n))
			h += n * line
			continue
		}
		e := takes[b.Block]
		if b.Block == "code" {
			e = b.Take
			if e == "" {
				e = "CODE"
			}
		}
		if e == "" {
			continue
		}
		typed := ""
		if b.Block == "words" && b.Setting != "" {
			typed = Clean(str(set(b.Setting)), 22)
		}
		var v any
		if !(b.Block == "words" && (b.Fixed || typed != "")) {
			v = shift(e)
		}
		switch b.Block {
		case "words":
			t := typed
			if t == "" {
				t = Clean(str(v), 22)
			}
			if t == "" {
				t = Clean(b.Text, 22)
			}
			if t == "" {
				continue
			}
			isBig := large || b.Size == "big"
			var align byte = 1
			if b.Align == "left" {
				align = 0
			}
			put(0x1b, 0x61, align)
			w := C
			if isBig {
				put(0x1d, 0x21, 0x11, 0x1b, 0x33, big)
				w = C / 2
			}
			for _, l := range wrap(t, w) {
				text(l)
				put(0x0a)
				if isBig {
					h += big
				} else {
					h += line
				}
			}
			if isBig {
				put(0x1d, 0x21, 0, 0x1b, 0x33, line)
			}
			shown++
		case "picture":
			o, ok := v.(map[string]any)
			if !ok {
				continue
			}
			fw, okw := o["w"].(float64)
			fh, okh := o["h"].(float64)
			g, okg := o["grey"].(string)
			if !okw || !okh || !okg || fw != math.Trunc(fw) || fh != math.Trunc(fh) || fw < 1 || fh < 1 || fw > 2048 || fh > 2048 {
				continue
			}
			if len(g)%4 != 0 || !b64.MatchString(g) {
				continue
			}
			grey, err := base64.StdEncoding.DecodeString(g)
			vw, vh := int(fw), int(fh)
			if err != nil || len(grey) < vw*vh {
				continue
			}
			width := b.Width
			if width == 0 {
				width = 1
			}
			tw := int(math.Floor(float64(D)*width/8)) * 8
			th := vh * tw / vw
			if th > 1200 {
				th = 1200
			}
			if th == 0 {
				continue
			}
			heavy := b.Ink != "" && set(b.Ink) == true
			wb := tw / 8
			put(0x1b, 0x61, 1)
			for y0 := 0; y0 < th; y0 += 128 {
				rows := th - y0
				if rows > 128 {
					rows = 128
				}
				put(0x1d, 0x76, 0x30, 0, byte(wb&255), byte(wb>>8), byte(rows&255), byte(rows>>8))
				for y := y0; y < y0+rows; y++ {
					sy := y * vh / th
					for xb := 0; xb < wb; xb++ {
						var by byte
						for bit := 0; bit < 8; bit++ {
							x := xb*8 + bit
							gv := int(grey[sy*vw+x*vw/tw])
							if heavy {
								gv = gv * 3 / 4
							}
							if gv < bayer[y%8][x%8]*4+2 {
								by |= 0x80 >> bit
							}
						}
						put(by)
					}
				}
			}
			h += th
			shown++
		case "list":
			l, ok := v.([]any)
			if !ok {
				continue
			}
			max := b.Max
			if max == 0 {
				max = 5
			}
			if len(l) > max {
				l = l[:max]
			}
			w := C - 4
			type item struct {
				text string
				done bool
			}
			var items []item
			for _, x := range l {
				it := item{}
				switch t := x.(type) {
				case string:
					it.text = t
				case map[string]any:
					it.text = str(t["text"])
					it.done = t["done"] == true
				}
				if Clean(it.text, w) != "" {
					items = append(items, it)
				}
			}
			if len(items) == 0 {
				continue
			}
			put(0x1b, 0x61, 0)
			for _, it := range items {
				mark := "[ ] "
				if it.done {
					mark = "[x] "
				}
				text(mark + Clean(it.text, w))
				put(0x0a)
				h += line
			}
			shown++
		case "code":
			var o map[string]any
			switch t := v.(type) {
			case string:
				o = map[string]any{"code": t}
			case map[string]any:
				o = t
			default:
				continue
			}
			title := ""
			if e == "SOUND" {
				title = Clean(str(o["title"]), C)
			}
			if title != "" {
				centre(title)
			}
			data := str(o["code"])
			if u := str(o["url"]); u != "" {
				data = u
			}
			drawn := qr(data, 4)
			if drawn {
				if c := Clean(str(o["code"]), C); c != "" {
					centre(c)
				}
			}
			if title != "" || drawn {
				shown++
			}
		}
	}
	if shown == 0 {
		centre("*  *  *")
	}
	if mm, ok := lengthMM[length]; ok {
		target := mm * in.Printer.DPI * 10 / 254
		for rem := target - h; rem > 0; rem -= 255 {
			n := rem
			if n > 255 {
				n = 255
			}
			put(0x1b, 0x4a, byte(n))
		}
	}
	if code := BoardCode(in.Board); code != "" {
		put(0x1b, 0x61, 1, 0x0a)
		qr(home+code, 3)
		put(0x1b, 0x61, 1)
		text(code)
		put(0x0a)
	}
	switch in.Printer.Cutter {
	case "none":
		put(0x1b, 0x64, 4)
	case "full":
		put(0x1d, 0x56, 0x41, 0)
	default:
		put(0x1d, 0x56, 0x42, 0)
	}
	return out
}

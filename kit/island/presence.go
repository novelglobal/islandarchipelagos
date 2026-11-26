package main

// Passes made and checked on the island itself, with or without internet. The island's key comes from
// novel.global when it pairs (or on its next ask); the site and the island work out the same codes and
// the same mark of the day from it, so neither needs the other to check one.

import (
	"crypto/hmac"
	"crypto/sha256"
	"net/http"
	"strings"
	"time"
	_ "time/tzdata"
)

const (
	passABC  = "ABCDEFGHJKMNPQRSTVWXYZ" // no I, L, O or U
	passPC   = passABC + "23456789"
	passN    = 60
	islandLo = 30 // slots 30 to 49 are the island's own, given out with no internet
	islandHi = 50
	keepDays = 2
)

var marks = []string{"WAVE", "SHELL", "CRAB", "OCTOPUS", "MOON", "SUN", "FERN", "MUSHROOM", "BEE", "BUTTERFLY", "CACTUS", "SUNFLOWER", "FISH", "OWL", "TURTLE", "STAR"}

func macOf(key, s string) []byte {
	m := hmac.New(sha256.New, []byte(key))
	m.Write([]byte(s))
	return m.Sum(nil)
}

var melbourne = func() *time.Location {
	if l, err := time.LoadLocation("Australia/Melbourne"); err == nil {
		return l
	}
	return time.FixedZone("AEST", 10*3600)
}()

func passDay(t time.Time) string { return t.In(melbourne).Format("2006-01-02") }

// pass3 is the short code for one slot of a day: a letter and a number always
func pass3(key, day string, n int) string {
	b := macOf(key, "p3:"+day+":"+itoa(n))
	c := []byte{passPC[int(b[0])%22], passPC[22+int(b[1])%8], passPC[int(b[2])%30]}
	if b[3]&1 == 1 {
		c[0], c[1] = c[1], c[0]
	}
	return string(c)
}

// pass6 checks the longer code: three letters chosen at random, three that follow from them
func pass6(key, day, first string) string {
	b := macOf(key, "pass:"+day+":"+first)
	out := make([]byte, 3)
	for i := range out {
		out[i] = passABC[int(b[i])%22]
	}
	return string(out)
}

func markOf(key, day string) string { return marks[int(macOf(key, "mark:"+day)[0])%len(marks)] }

func normPass(c string) string {
	c = strings.ToUpper(c)
	out := make([]byte, 0, 6)
	for i := 0; i < len(c); i++ {
		if strings.IndexByte(passPC, c[i]) >= 0 {
			out = append(out, c[i])
		}
	}
	return string(out)
}

// checkPass says whether code is one of today's from this island, and as what it was written
func checkPass(key, day, code string) (string, bool) {
	c := normPass(code)
	switch len(c) {
	case 3:
		for n := 0; n < passN; n++ {
			if pass3(key, day, n) == c {
				return c, true
			}
		}
	case 6:
		if pass6(key, day, c[:3]) == c[3:] {
			return c[:3] + "-" + c[3:], true
		}
	}
	return c, false
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	s := ""
	for n > 0 {
		s = string(rune('0'+n%10)) + s
		n /= 10
	}
	return s
}

// usePass takes a pass once: false when it is not today's or was used here already
func (a *App) usePass(code string, now time.Time) (string, string, bool) {
	c := a.conf()
	if c.PassKey == "" {
		return "", "", false
	}
	day := passDay(now)
	norm, ok := checkPass(c.PassKey, day, code)
	if !ok {
		return norm, "", false
	}
	k := day + " " + norm
	for _, u := range c.Used {
		if u == k {
			return norm, "", false
		}
	}
	a.update(func(c *Config) {
		keep := c.Used[:0]
		for _, u := range c.Used {
			if u >= passDay(now.AddDate(0, 0, -keepDays)) {
				keep = append(keep, u)
			}
		}
		c.Used = append(keep, k)
		c.Unsent = append(c.Unsent, k)
	})
	return norm, markOf(c.PassKey, day), true
}

// nextPass gives out the island's next own pass for today, or "" when its twenty are gone
func (a *App) nextPass(now time.Time) (string, string) {
	c := a.conf()
	if c.PassKey == "" {
		return "", ""
	}
	day, n := passDay(now), islandLo
	if c.IssueDay == day {
		n = c.IssueN
	}
	if n >= islandHi {
		return "", ""
	}
	a.update(func(c *Config) { c.IssueDay, c.IssueN = day, n+1 })
	return pass3(c.PassKey, day, n), markOf(c.PassKey, day)
}

// whoOK: a person's code, three or six of the pass letters and numbers
func whoOK(w string) bool {
	if len(w) != 3 && len(w) != 6 {
		return false
	}
	for i := 0; i < len(w); i++ {
		if strings.IndexByte(passPC, w[i]) < 0 {
			return false
		}
	}
	return true
}

// stampHere keeps a pass used here on a person's code, with no internet; the site stamps the code when told
func (a *App) stampHere(who, pass string, now time.Time) bool {
	w := strings.ToUpper(strings.TrimSpace(who))
	if !whoOK(w) || pass == "" {
		return false
	}
	day := passDay(now)
	a.update(func(c *Config) {
		keep := c.Stamps[:0]
		for _, s := range c.Stamps {
			if s >= passDay(now.AddDate(0, 0, -keepDays)) {
				keep = append(keep, s)
			}
		}
		c.Stamps = append(keep, day+" "+pass+" "+w)
	})
	return true
}

// sendUsed tells the site which passes were used here with no internet, so none is good twice, and the codes they were kept on
func (a *App) sendUsed(l Link) {
	c := a.conf()
	if (len(c.Unsent) == 0 && len(c.Stamps) == 0) || l.Token == "" {
		return
	}
	byDay, stamps := map[string][]string{}, map[string][]map[string]string{}
	for _, u := range c.Unsent {
		if p := strings.SplitN(u, " ", 2); len(p) == 2 {
			byDay[p[0]] = append(byDay[p[0]], p[1])
		}
	}
	for _, s := range c.Stamps {
		if p := strings.SplitN(s, " ", 3); len(p) == 3 {
			stamps[p[0]] = append(stamps[p[0]], map[string]string{"code": p[1], "who": p[2]})
			if _, ok := byDay[p[0]]; !ok {
				byDay[p[0]] = []string{}
			}
		}
	}
	for day, codes := range byDay {
		body := map[string]any{"day": day, "codes": codes}
		if len(stamps[day]) > 0 {
			body["stamps"] = stamps[day]
		}
		r, err := call("POST", l.Server+"/api/printers/"+l.Printer+"/used", l.Token, body)
		if err != nil || r.Status != 200 {
			return
		}
	}
	a.update(func(c *Config) { c.Unsent, c.Stamps = nil, nil })
}

// the island's page: a pass typed and checked here, once
func (p *portal) passCheck(w http.ResponseWriter, r *http.Request) {
	now := time.Now()
	code, mark, ok := p.a.usePass(r.URL.Query().Get("c"), now)
	note := "PASS · NO"
	if ok {
		note = "PASS · " + code + " · " + mark
		if p.a.stampHere(r.URL.Query().Get("w"), code, now) {
			note += " · STAMPED"
		}
	}
	p.passSay(w, r, note)
}

// the island's page: the next pass of the island's own printed (twenty a day)
func (p *portal) passPrint(w http.ResponseWriter, r *http.Request) {
	if p.a.paused() {
		p.passSay(w, r, words("PAUSED."))
		return
	}
	code, mark := p.a.nextPass(time.Now())
	if code == "" {
		p.passSay(w, r, words("PASS · NONE LEFT"))
		return
	}
	p.a.print(textSlip(p.a.conf().Name, "PASS", mark, code))
	p.passSay(w, r, words("PASS · PRINTED"))
}

func (p *portal) passSay(w http.ResponseWriter, r *http.Request, note string) {
	if r.Header.Get("x-island") != "" {
		w.Header().Set("content-type", "text/plain; charset=utf-8")
		w.Write([]byte(note))
		return
	}
	p.render(w, view{Island: true, Note: note})
}

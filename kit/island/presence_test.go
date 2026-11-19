package main

import (
	"testing"
	"time"
)

// the same key gives the same codes and mark as the site's (worked out there with the same key and day)
func TestPassesMatchTheSite(t *testing.T) {
	key, day := "k3y-island", "2026-11-19"
	for n, want := range map[int]string{0: "3K4", 31: "V6Q", 59: "X3N"} {
		if got := pass3(key, day, n); got != want {
			t.Fatalf("slot %d: %s, the site says %s", n, got, want)
		}
	}
	if got := pass6(key, day, "ABC"); got != "VFY" {
		t.Fatalf("long pass: %s", got)
	}
	if got := markOf(key, day); got != "WAVE" {
		t.Fatalf("mark: %s", got)
	}
	if c, ok := checkPass(key, day, "abc-vfy"); !ok || c != "ABC-VFY" {
		t.Fatalf("long pass not taken: %s %v", c, ok)
	}
	if _, ok := checkPass(key, "2026-11-20", "3K4"); ok {
		t.Fatal("yesterday's pass taken")
	}
}

func TestPassOnceOffline(t *testing.T) {
	a := &App{cfg: &Config{PassKey: "k3y-island"}, path: t.TempDir() + "/c.json"}
	now := time.Date(2026, 11, 19, 3, 0, 0, 0, time.UTC) // the 19th in Melbourne
	code, mark := a.nextPass(now)
	if code != pass3("k3y-island", "2026-11-19", 30) || mark == "" {
		t.Fatalf("first own pass: %s", code)
	}
	if _, _, ok := a.usePass(code, now); !ok {
		t.Fatal("own pass refused")
	}
	if _, _, ok := a.usePass(code, now); ok {
		t.Fatal("used twice")
	}
	if len(a.conf().Unsent) != 1 {
		t.Fatal("not kept to tell the site")
	}
	if !a.stampHere("qx9", code, now) || a.stampHere("bad!", code, now) || len(a.conf().Stamps) != 1 || a.conf().Stamps[0] != "2026-11-19 "+code+" QX9" {
		t.Fatalf("stamp not kept: %v", a.conf().Stamps)
	}
	for i := 0; i < 25; i++ {
		a.nextPass(now)
	}
	if c, _ := a.nextPass(now); c != "" {
		t.Fatal("more than twenty a day")
	}
}

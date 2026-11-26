// SPDX-License-Identifier: AGPL-3.0-or-later

package main

import (
	"bytes"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
)

// one print engine: the island carries the site's own, unchanged (copy web/src/base/thermal.js here when it changes)
func TestThermalIsTheSitesEngine(t *testing.T) {
	site, err := os.ReadFile("../../web/src/base/thermal.js")
	if err != nil {
		t.Skip("the site's engine is not beside this island's code")
	}
	if !bytes.Equal(site, thermalJS) {
		t.Fatal("kit/island/thermal.js is not web/src/base/thermal.js: cp ../../web/src/base/thermal.js thermal.js")
	}
}

// the island's page prints through it, and serves it itself, with or without a shelf
func TestThePageUsesTheEngine(t *testing.T) {
	p := &portal{a: &App{cfg: &Config{Name: "BENCH", Mode: "offline"}}}
	r := httptest.NewRecorder()
	p.ServeHTTP(r, httptest.NewRequest("GET", "http://10.42.0.1/thermal.js", nil))
	if r.Code != 200 || !strings.Contains(r.Body.String(), "window.THERMAL") {
		t.Fatalf("/thermal.js: %d", r.Code)
	}
	r = httptest.NewRecorder()
	p.ServeHTTP(r, httptest.NewRequest("GET", "http://10.42.0.1/", nil))
	b := r.Body.String()
	if !strings.Contains(b, `<script src="/thermal.js">`) || !strings.Contains(b, "T.raster(") || strings.Contains(b, "image/png") {
		t.Fatal("the island page does not print through the engine")
	}
}

// what the engine makes, the island takes: its byte guard holds every kept engine print (spec/fixtures/engine, tools/engine.mjs)
func TestTheIslandTakesTheEnginesPrints(t *testing.T) {
	for _, f := range []string{"greys.bin", "dots.bin", "art.bin"} {
		b, err := os.ReadFile("../../spec/fixtures/engine/" + f)
		if err != nil {
			t.Skip("the engine's prints are not beside this island's code")
		}
		if !rasterOnly(b) {
			t.Errorf("the engine's %s is refused by the island", f)
		}
	}
}

// slip reads one input as JSON on stdin (the shape of a fixtures/golden case) and writes the ESC/POS bytes to stdout.
//
//	slip < fixtures/golden/02-radio-into-wish.json > /dev/usb/lp0
package main

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/novelglobal/islandarchipelagos/engine/slip"
)

func main() {
	var in slip.Input
	if err := json.NewDecoder(os.Stdin).Decode(&in); err != nil {
		fmt.Fprintln(os.Stderr, "slip:", err)
		os.Exit(1)
	}
	os.Stdout.Write(slip.Compile(in))
}

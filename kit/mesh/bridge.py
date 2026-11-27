#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""The island's ear on the mesh: a Meshtastic radio plugged into the Pi (USB), its text messages handed to the island program
(POST http://127.0.0.1/mesh), and a short answer sent back over the radio to whoever sent it.

A phone with no Wi-Fi and no internet sends with the Meshtastic app, through its own small radio, on the island's channel.
Plain words print as a slip; a message starting ng1: is a drawing (spec/tools/meshdraw.mjs) redrawn and printed.

  pip install meshtastic        (Meshtastic's own library, https://github.com/meshtastic/python, GPL-3.0)
  python3 bridge.py             finds the radio on USB; or: python3 bridge.py /dev/ttyUSB0
"""
import sys
import time
import urllib.request

import meshtastic.serial_interface
from pubsub import pub

ISLAND = 'http://127.0.0.1/mesh'


def hand(text):
    """the island's answer to one message: printed, paused, full, or why not"""
    req = urllib.request.Request(ISLAND, data=text.encode('utf-8'), method='POST', headers={'content-type': 'text/plain'})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.read().decode()[:40]
    except urllib.error.HTTPError as e:
        return e.read().decode().strip()[:40] or str(e.code)
    except OSError as e:
        return 'no island: ' + str(e)[:28]


def heard(packet, interface):
    d = packet.get('decoded') or {}
    if d.get('portnum') != 'TEXT_MESSAGE_APP':
        return
    text, frm = d.get('text') or '', packet.get('from')
    answer = hand(text)
    print(time.strftime('%H:%M:%S'), frm, len(text), answer, flush=True)
    try:
        interface.sendText(answer, destinationId=frm, channelIndex=packet.get('channel', 0))
    except Exception as e:  # the print stands whether or not the answer goes
        print('no answer sent:', e, flush=True)


def main():
    dev = sys.argv[1] if len(sys.argv) > 1 else None
    pub.subscribe(heard, 'meshtastic.receive')
    iface = meshtastic.serial_interface.SerialInterface(devPath=dev)
    print('listening on the mesh', flush=True)
    try:
        while True:
            time.sleep(60)
    finally:
        iface.close()


if __name__ == '__main__':
    main()

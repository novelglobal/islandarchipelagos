#!/usr/bin/env python3
"""Direct Action · the receiver's pull bridge, for a Raspberry Pi beside a partner place's printer.

It asks novel.global for the next slip sent to this printer, prints it, and says how it went. It pulls: nothing reaches
in, so it needs no open ports and works behind any shop's Wi-Fi.

  · each slip's ESC/POS bytes go straight to the printer (/dev/usb/lp0, opened fresh each time, so a printer that wakes after
    the Pi, or is plugged in again, is found at once); where that cannot be opened, through printd
    (https://github.com/HansF/printd, MIT) at 127.0.0.1:8080, POST /print/raw as {"bytes_b64": ...}
  · while the printer is away nothing is lost: the READY slip and every slip wait until it answers, and the site is told
    (prn=0), so the approval page and the desk can say so. /run/da-pull/state says the same to wifi.py, which shows it
    on the Pi's green light
  · a slip's mesh line can also go out over a Meshtastic radio plugged into this Pi, through Meshtastic's own Python
    library (https://github.com/meshtastic/python, GPL-3.0), when DA_MESH is set and the printer's MESH is on
  · TURN OFF on the approval page: this bridge prints a slip and leaves a note in /run/da-pull, and da-off.path, a
    systemd unit, turns the Pi off safely. It is offered only where da-off.path is installed (receiver/setup/install.sh)
  · CHANGE WI-FI on the approval page: a note in /run/da-pull/wifi, which wifi.py (receiver/setup) sees and opens its setup
    Wi-Fi. Each ask also says which Wi-Fi this Pi is on, how strongly and at which address, for the approval page to show

Standard library only, apart from the optional meshtastic package. Settings come from the environment
(see da-pull.env.example). Logs go to standard output, which systemd keeps in the journal.
"""
import base64
import json
import logging
import os
import signal
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime

def env(k, d=''):
    # a value as typed: spaces, quotes and a pasted line end (from a phone or a Windows file) taken off, so the token still matches
    return os.environ.get(k, d).strip().strip('"\'').strip()


SERVER = env('DA_SERVER', 'https://novel.global').rstrip('/')
PRINTER = env('DA_PRINTER')
TOKEN = env('DA_TOKEN')
VERSION = 'bridge 18 Nov'   # said to the site beside its Wi-Fi, for the approval page
PRINTD = os.environ.get('PRINTD_URL', 'http://127.0.0.1:8080').rstrip('/')
PRINTD_KEY = os.environ.get('PRINTD_API_KEY', '')
MESH = os.environ.get('DA_MESH', '')        # '' for none; 'auto' (plugged in); a serial device such as /dev/ttyUSB0; tcp:auto (found
                                             # by name on whatever Wi-Fi this is); or tcp:192.168.1.20
POLL = float(os.environ.get('DA_POLL', '3'))  # seconds between asks when the queue is empty
DRY = os.environ.get('DA_DRY', '') == '1'     # write each slip to DA_DRY_DIR instead of printing it: for testing
DRY_DIR = os.environ.get('DA_DRY_DIR', '/tmp')
COLS = int(os.environ.get('DA_COLS', '42'))   # characters a line holds, for the slips this bridge sets itself
OFF_FILE = os.environ.get('DA_OFF_FILE', '/run/da-pull/off')   # the note da-off.path waits for
CAN_OFF = os.path.exists('/etc/systemd/system/da-off.path') or 'DA_OFF_FILE' in os.environ
WIFI_FILE = os.environ.get('DA_WIFI_FILE', '/run/da-pull/wifi')   # the note wifi.py waits for
CAN_WIFI = os.path.exists('/etc/systemd/system/wifi-setup.service') or 'DA_WIFI_FILE' in os.environ
DEVICES = list(dict.fromkeys(d for d in (os.environ.get('DA_DEVICE', ''), '/dev/usb/lp0', '/dev/usb/lp1') if d))   # the printer itself
STATE_FILE = os.environ.get('DA_STATE_FILE', '/run/da-pull/state')   # ok / noprinter / nonet, for the green light
UPDATE_FILE = os.environ.get('DA_UPDATE_FILE', '/run/da-pull/update')   # the note da-update.path waits for
CAN_UPDATE = os.path.exists('/etc/systemd/system/da-update.path') or 'DA_UPDATE_FILE' in os.environ

log = logging.getLogger('da-pull')
running = True


def stop(*_):
    global running
    running = False


class Away(RuntimeError):
    """the printer is not answering: off, unplugged, out of paper or still waking. Nothing is lost: it is asked again"""


PAPER = {'ok': None, 'ready': False}   # whether the printer last took a slip; whether this start's READY slip has printed


def state(s):
    """what the green light shows, through wifi.py"""
    try:
        with open(STATE_FILE, 'w') as f:
            f.write(s)
    except OSError:
        pass


HINT = {'wait': None}  # how long the site asks this bridge to wait before asking again (quick while someone is on their way to print)


def http(method, url, body=None, headers=None, timeout=35):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={'content-type': 'application/json', 'user-agent': 'da-pull/1', **(headers or {})})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        raw = r.read()
        try:
            w = float(r.headers.get('x-wait') or 0)
            HINT['wait'] = w if 1 <= w <= 300 else None
        except ValueError:
            HINT['wait'] = None
        return r.status, (json.loads(raw) if raw else None)


# ───────── the printer, through printd ─────────
def to_device(data):
    """straight to the printer; True once written, False where no printer can be opened"""
    for dev in DEVICES:
        try:
            with open(dev, 'wb', buffering=0) as f:
                f.write(data)
            return True
        except OSError:
            continue
    return False


def print_bytes(data):
    """the slip to the printer, or Away. The device first, then printd"""
    if DRY:
        path = os.path.join(DRY_DIR, f'da-slip-{int(time.time() * 1000)}.bin')
        with open(path, 'wb') as f:
            f.write(data)
        log.info('dry run: %d bytes to %s', len(data), path)
        return
    if to_device(data):
        return printed(True)
    headers = {'authorization': f'Bearer {PRINTD_KEY}'} if PRINTD_KEY else {}
    try:
        status, _ = http('POST', f'{PRINTD}/print/raw', {'bytes_b64': base64.b64encode(data).decode()}, headers, timeout=60)
    except (urllib.error.URLError, OSError) as e:
        printed(False)
        seen = os.path.exists('/dev/usb/lp0') or os.path.exists('/dev/usb/lp1')
        raise Away('the printer is plugged in but this Pi may not write to it (sudo usermod -aG lp da)' if seen else 'no printer seen: check it is on, has paper and its cable is in') from e
    if status >= 300:
        printed(False); raise Away(f'printd answered {status}')
    printed(True)


def printed(ok):
    """the printer took a slip, or did not: said once in the log, to the light, and to the site at the next ask"""
    if ok != PAPER['ok']:
        log.info('the printer is answering' if ok else 'the printer is not answering: slips wait for it')
        HERE['at'] = 0
    PAPER['ok'] = ok
    state('ok' if ok else 'noprinter')


def text_slip(lines):
    """A short slip set here: a READY slip at boot, or a test print. ESC/POS: initialise, the lines, feed, cut."""
    out = bytearray(b'\x1b@\x1bt\x00\x1ba\x01\x1bE\x01')
    out += (lines[0] + '\n').encode('ascii', 'replace') + b'\x1bE\x00'
    for line in lines[1:]:
        while len(line) > COLS:
            out += (line[:COLS] + '\n').encode('ascii', 'replace')
            line = line[COLS:]
        out += (line + '\n').encode('ascii', 'replace')
    out += b'\x1ba\x00\x1bd\x04\x1dVB\x00'
    return bytes(out)


# ───────── the mesh, through Meshtastic ─────────
def mesh_host():
    """a Meshtastic radio on this Wi-Fi, by the name it announces (mDNS), so its address can change from place to place"""
    try:
        out = subprocess.run(['avahi-browse', '-rtp', '_meshtastic._tcp'], capture_output=True, text=True, timeout=8).stdout
    except (OSError, subprocess.SubprocessError):
        return ''
    for line in out.splitlines():
        f = line.split(';')
        if len(f) > 8 and f[0] == '=' and f[2] == 'IPv4':
            return f[7]
    return ''



def mesh_send(text):
    if not MESH:
        return
    if DRY:
        log.info('dry run: mesh line %r', text)
        return
    import meshtastic.serial_interface  # installed only where a radio is plugged in
    if MESH.startswith('tcp:'):
        import meshtastic.tcp_interface
        host = MESH[4:]
        if host in ('', 'auto'):
            host = mesh_host() or 'meshtastic.local'
        iface = meshtastic.tcp_interface.TCPInterface(hostname=host)
    else:
        iface = meshtastic.serial_interface.SerialInterface(devPath=None if MESH == 'auto' else MESH)
    try:
        iface.sendText(text[:200])
    finally:
        iface.close()


# ───────── the queue on novel.global ─────────
def auth():
    return {'authorization': f'Bearer {TOKEN}'}


HERE = {'at': 0, 'q': ''}


def here():
    """this Pi's Wi-Fi, its strength in dBm (from NetworkManager's percent), and its address on it, as a query string"""
    if time.time() - HERE['at'] < 60:
        return HERE['q']
    q = {} if PAPER['ok'] is None else {'prn': '1' if PAPER['ok'] else '0'}
    try:
        out = subprocess.run(['nmcli', '-t', '-f', 'ACTIVE,SSID,SIGNAL', 'device', 'wifi', 'list', '--rescan', 'no'], capture_output=True, text=True, timeout=10).stdout
        for line in out.splitlines():
            if line.startswith('yes:'):
                name, _, sig = line[4:].replace('\\:', '\0').rpartition(':')
                q['net'] = name.replace('\0', ':')[:40]
                if sig.isdigit():
                    q['rssi'] = str(int(sig) // 2 - 100)
                break
    except (OSError, subprocess.SubprocessError):
        pass
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('1.1.1.1', 53))   # nothing is sent: this only asks which address the way out uses
        q['ip'] = s.getsockname()[0]
        q['v'] = VERSION
        s.close()
    except OSError:
        pass
    HERE['at'], HERE['q'] = time.time(), urllib.parse.urlencode(q)
    return HERE['q']


def next_job():
    can = ' '.join(c for c, on in (('off', CAN_OFF), ('wifi', CAN_WIFI), ('update', CAN_UPDATE)) if on)
    q = '&'.join(x for x in ((f'can={urllib.parse.quote(can)}' if can else ''), here()) if x)
    status, j = http('GET', f'{SERVER}/api/printers/{PRINTER}/next' + (f'?{q}' if q else ''), headers=auth())
    return j if status == 200 else None


def wifi_name():
    """the Wi-Fi this Pi is on, for the READY slip; '' on a cable, or where NetworkManager is not asked"""
    try:
        out = subprocess.run(['nmcli', '-t', '-f', 'ACTIVE,SSID', 'device', 'wifi', 'list', '--rescan', 'no'], capture_output=True, text=True, timeout=10).stdout
    except (OSError, subprocess.SubprocessError):
        return ''
    for line in out.splitlines():
        if line.startswith('yes:'):
            return line[4:].replace('\\:', ':')
    return ''


def ready_slip():
    """the slip at a start: on which Wi-Fi. Tried at each ask until the printer takes it, however long it takes to wake"""
    if PAPER['ready']:
        return
    net = wifi_name()
    lines = ['NOVEL.GLOBAL', 'READY', PRINTER.upper()] + ([f'WI-FI {net}'] if net else []) + ['', datetime.now().strftime('%d.%m.%y %H:%M')]
    try:
        print_bytes(text_slip(lines))
        PAPER['ready'] = True
        log.info('READY slip printed')
    except Away as e:
        if PAPER['ok'] is not False:
            log.warning('no READY slip yet: %s', e)


def turn_off():
    """TURN OFF from the approval page: a slip to say so, then the note that has systemd turn the Pi off safely"""
    try:
        print_bytes(text_slip(['NOVEL.GLOBAL', 'TURNING OFF', PRINTER.upper(), 'UNPLUG ONCE THE GREEN LIGHT STOPS', 'TO START: PLUG IT BACK IN', datetime.now().strftime('%d.%m.%y %H:%M')]))
    except Exception as e:  # turned off all the same
        log.warning('no TURNING OFF slip: %s', e)
    with open(OFF_FILE, 'w') as f:
        f.write(datetime.now().isoformat())
    log.info('turning off, as asked on the approval page')


def report(job, ok, error=''):
    http('POST', f'{SERVER}/api/printers/{PRINTER}/jobs/{job}', {'status': 'printed' if ok else 'failed', 'error': error[:200]}, auth())


def handle(j):
    if not j.get('job'):
        return
    code = j.get('code') or ''
    try:
        if j.get('escpos'):
            print_bytes(base64.b64decode(j['escpos']))
        elif code == 'DA-TEST':   # a test prints a few lines; a slip sent only to the mesh is not printed
            print_bytes(text_slip(['DIRECT ACTION', code, j.get('mesh') or 'test print', datetime.now().strftime('%d.%m.%y %H:%M')]))
        if j.get('mesh'):
            try:
                mesh_send(j['mesh'])
            except Exception as e:  # the print stands even if the radio does not answer
                log.warning('%s: mesh not sent: %s', code, e)
        report(j['job'], True)
        log.info('%s printed', code)
    except Away as e:
        # not reported: the site hands it back in a minute, and it prints once the printer answers
        log.warning('%s waits for the printer: %s', code, e)
        return False
    except Exception as e:
        log.error('%s not printed: %s', code, e)
        report(j['job'], False, str(e))


def main():
    logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s', stream=sys.stdout)
    if not PRINTER or not TOKEN:
        log.error('set DA_PRINTER and DA_TOKEN (from the approval page, PRINTERS, PAIR A PRINTER)')
        return 2
    once = '--once' in sys.argv
    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    PAPER['ready'] = '--no-ready' in sys.argv
    state('nonet')
    wait = POLL
    while running:
        try:
            ready_slip()
            j = next_job()
            if PAPER['ok'] is not False:
                state('ok')
            wait = HINT['wait'] or POLL
            if j and j.get('wifi'):
                try:
                    with open(WIFI_FILE, 'w') as f:
                        f.write(datetime.now().isoformat())
                    log.info('opening the Wi-Fi setup, as asked on the approval page')
                except OSError as e:
                    log.warning('could not ask for the Wi-Fi setup: %s', e)
                continue
            if j and j.get('update'):
                try:
                    with open(UPDATE_FILE, 'w') as f:
                        f.write(datetime.now().isoformat())
                    log.info('updating, as asked on the approval page')
                except OSError as e:
                    log.warning('could not ask for the update: %s', e)
                continue
            if j and j.get('off'):
                turn_off()
                if once:
                    return 0
                for _ in range(60):  # systemd stops this bridge as the Pi turns off; if that has not come, carry on
                    if not running:
                        return 0
                    time.sleep(1)
                log.error('asked to turn off, but the Pi is still on: is da-off.path installed?')
                continue
            if j:
                if handle(j) is False:
                    time.sleep(10)
                if once:
                    return 0
                continue
            if once:
                return 0
        except urllib.error.HTTPError as e:
            if e.code == 401:
                log.error('the token was refused by %s for printer %s: make a new one on that site’s approval page (PRINTERS, NEW TOKEN) and put it in /etc/da-pull.env', SERVER, PRINTER)
                wait = 60
            else:
                log.warning('the server answered %s', e.code)
                wait = min(60, wait * 2)
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            log.warning('no signal: %s', getattr(e, 'reason', e))
            state('nonet')
            wait = min(60, wait * 2)  # the Wi-Fi dropped: ask less often, and keep asking
        time.sleep(wait)
    return 0


if __name__ == '__main__':
    sys.exit(main())

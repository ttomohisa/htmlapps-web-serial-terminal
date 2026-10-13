# Browser Kitty Web Serial Terminal - Raspberry Pi Pico USB CDC test
# Save this file on the Pico as main.py, then close Thonny before using Web Serial.

import gc
import sys
import time
from machine import Pin, freq
import select

VERSION = "1.0.0"
MAX_LINE = 1024
MAX_RAW = 4096
MAX_BURST_LINES = 50000
MAX_BURST_PAYLOAD = 240
MAX_FLOOD_KIB = 4096

try:
    led = Pin("LED", Pin.OUT)
except Exception:
    led = Pin(25, Pin.OUT)

stdin_stream = getattr(sys.stdin, "buffer", sys.stdin)
poller = select.poll()
poller.register(stdin_stream, select.POLLIN)

line_buf = bytearray()
pending_cr = False
pending_cr_at = 0
trace_bytes = False
raw_remaining = 0
raw_buf = bytearray()
stream_interval_ms = 0
stream_next_ms = 0
stream_seq = 0


def write_line(text=""):
    sys.stdout.write(str(text) + "\n")


def hex_bytes(data):
    return " ".join("%02X" % b for b in data)


def decode_text(data):
    try:
        return data.decode("utf-8")
    except Exception:
        return data.decode("utf-8", "replace")


def led_state():
    try:
        return int(led.value())
    except Exception:
        return -1


def print_help():
    write_line("COMMANDS:")
    write_line("  PING")
    write_line("  INFO")
    write_line("  UTF8")
    write_line("  LED ON | LED OFF | LED TOGGLE")
    write_line("  TRACE ON | TRACE OFF")
    write_line("  RAW <bytes>        # capture next N raw bytes, max %d" % MAX_RAW)
    write_line("  BURST <lines> [payload_size]")
    write_line("  FLOOD <KiB>        # emit deterministic text, max %d KiB" % MAX_FLOOD_KIB)
    write_line("  STREAM <interval_ms> | STREAM STOP")
    write_line("  GC")
    write_line("  HELP")


def emit_burst(count, payload_size):
    count = max(1, min(int(count), MAX_BURST_LINES))
    payload_size = max(0, min(int(payload_size), MAX_BURST_PAYLOAD))
    pattern = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    payload = (pattern * ((payload_size // len(pattern)) + 1))[:payload_size]
    write_line("BURST BEGIN count=%d payload=%d" % (count, payload_size))
    for i in range(count):
        write_line("BURST %06d %s" % (i, payload))
    write_line("BURST END count=%d" % count)


def emit_flood(kib):
    target = max(1, min(int(kib), MAX_FLOOD_KIB)) * 1024
    pattern = "0123456789ABCDEF" * 7
    sent = 0
    seq = 0
    write_line("FLOOD BEGIN target=%d" % target)
    while sent < target:
        line = "FLOOD %08d %s" % (seq, pattern)
        write_line(line)
        sent += len(line) + 1
        seq += 1
    write_line("FLOOD END approx=%d" % sent)


def handle_command(text, eol, raw_line):
    global trace_bytes, raw_remaining, raw_buf
    global stream_interval_ms, stream_next_ms

    write_line("RXLINE eol=%s bytes=%d hex=%s" % (eol, len(raw_line), hex_bytes(raw_line)))
    stripped = text.strip()
    upper = stripped.upper()

    if upper == "PING":
        write_line("PONG ticks=%d led=%d" % (time.ticks_ms(), led_state()))
    elif upper == "INFO":
        write_line("INFO version=%s platform=%s freq=%d free=%d" % (
            VERSION, sys.platform, freq(), gc.mem_free()
        ))
    elif upper == "UTF8":
        write_line("UTF8 日本語 café Ω")
    elif upper == "HELP":
        print_help()
    elif upper == "GC":
        gc.collect()
        write_line("GC free=%d" % gc.mem_free())
    elif upper == "TRACE ON":
        trace_bytes = True
        write_line("TRACE ON")
    elif upper == "TRACE OFF":
        trace_bytes = False
        write_line("TRACE OFF")
    elif upper.startswith("LED "):
        arg = upper[4:].strip()
        if arg == "ON":
            led.on()
        elif arg == "OFF":
            led.off()
        elif arg == "TOGGLE":
            led.value(0 if led.value() else 1)
        else:
            write_line("ERR LED expects ON/OFF/TOGGLE")
            return
        write_line("LED %d" % led_state())
    elif upper.startswith("RAW "):
        try:
            count = int(stripped.split()[1])
        except Exception:
            write_line("ERR RAW expects byte count")
            return
        if count < 1 or count > MAX_RAW:
            write_line("ERR RAW range=1..%d" % MAX_RAW)
            return
        raw_remaining = count
        raw_buf = bytearray()
        write_line("RAW READY bytes=%d" % count)
    elif upper.startswith("BURST "):
        parts = stripped.split()
        try:
            count = int(parts[1])
            payload_size = int(parts[2]) if len(parts) >= 3 else 80
            emit_burst(count, payload_size)
        except Exception:
            write_line("ERR BURST expects: BURST <lines> [payload_size]")
    elif upper.startswith("FLOOD "):
        try:
            emit_flood(int(stripped.split()[1]))
        except Exception:
            write_line("ERR FLOOD expects KiB")
    elif upper == "STREAM STOP":
        stream_interval_ms = 0
        write_line("STREAM STOP")
    elif upper.startswith("STREAM "):
        try:
            interval = int(stripped.split()[1])
        except Exception:
            write_line("ERR STREAM expects interval_ms or STOP")
            return
        interval = max(1, min(interval, 1000))
        stream_interval_ms = interval
        stream_next_ms = time.ticks_add(time.ticks_ms(), interval)
        write_line("STREAM START interval_ms=%d" % interval)
    elif stripped:
        write_line("UNKNOWN %s" % stripped)


def finish_line(eol):
    global line_buf
    data = bytes(line_buf)
    line_buf = bytearray()
    handle_command(decode_text(data), eol, data)


def handle_byte(value):
    global pending_cr, pending_cr_at
    global raw_remaining, raw_buf, line_buf

    if raw_remaining:
        raw_buf.append(value)
        raw_remaining -= 1
        if raw_remaining == 0:
            write_line("RAW bytes=%d hex=%s" % (len(raw_buf), hex_bytes(raw_buf)))
        return

    if trace_bytes:
        write_line("RXBYTE 0x%02X" % value)

    if pending_cr:
        pending_cr = False
        if value == 10:
            finish_line("CRLF")
            return
        finish_line("CR")

    if value == 13:
        pending_cr = True
        pending_cr_at = time.ticks_ms()
    elif value == 10:
        finish_line("LF")
    else:
        if len(line_buf) < MAX_LINE:
            line_buf.append(value)
        else:
            write_line("ERR line too long; buffer cleared")
            line_buf = bytearray()


def read_available():
    while poller.poll(0):
        data = stdin_stream.read(1)
        if not data:
            return
        if isinstance(data, str):
            handle_byte(ord(data[0]))
        else:
            handle_byte(data[0])


def run():
    global pending_cr, stream_next_ms, stream_seq

    write_line("BK-PICO-USB-TEST %s" % VERSION)
    write_line("READY platform=%s freq=%d" % (sys.platform, freq()))
    write_line("Send HELP with LF, CR, or CRLF.")

    while True:
        read_available()

        now = time.ticks_ms()
        if pending_cr and time.ticks_diff(now, pending_cr_at) >= 40:
            pending_cr = False
            finish_line("CR")

        if stream_interval_ms and time.ticks_diff(now, stream_next_ms) >= 0:
            write_line("STREAM %08d ticks=%d" % (stream_seq, now))
            stream_seq += 1
            stream_next_ms = time.ticks_add(now, stream_interval_ms)

        time.sleep_ms(1)


while True:
    try:
        run()
    except KeyboardInterrupt:
        # MicroPython's USB REPL path may intercept Ctrl+C before the script can
        # treat it as ordinary data. Keep the test fixture alive and report it.
        write_line("CONTROL Ctrl+C intercepted by MicroPython; restarting test loop")
        time.sleep_ms(50)

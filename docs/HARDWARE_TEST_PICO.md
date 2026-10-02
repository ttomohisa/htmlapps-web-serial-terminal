# Raspberry Pi Pico hardware test

This guide provides repeatable Raspberry Pi Pico hardware checks for Web Serial Terminal.

## Test layers

Use `examples/pico-usb-web-serial-test.py` first. It runs over the Pico MicroPython USB serial interface and covers Web Serial connection, Text/HEX TX/RX, line endings, UTF-8, macros, logging, high-volume receive, search/follow UX, and disconnect/reconnect.

USB CDC is a virtual serial interface, so it does not prove physical UART baud, parity, data-bit, or stop-bit behavior. For those checks use a separate 3.3 V USB-UART adapter with `examples/pico-uart-echo-test.py`.

MicroPython's USB REPL path can interpret control characters such as Ctrl+C, so exact control-byte, BREAK, DTR, and RTS checks should also use the adapter path.

## Pico USB setup

1. Install the current Raspberry Pi Pico MicroPython UF2 using BOOTSEL.
2. Open `examples/pico-usb-web-serial-test.py` in Thonny.
3. Save it on the Pico as `main.py`.
4. Confirm it runs, then disconnect Thonny from the Pico serial port or close Thonny before Web Serial testing.
5. Open the PR Preview or built Web Serial Terminal in a supported browser.
6. Choose the Pico USB serial device and connect using the default 115200 / 8-N-1 / no-flow-control profile.

The 115200 value does not validate a physical baud rate on this USB CDC path.

## Core checks

Text / LF:

```
PING
```

Expected:

```
RXLINE eol=LF bytes=4 hex=50 49 4E 47
PONG ticks=... led=...
```

Repeat with CR and CRLF and verify `eol=CR` / `eol=CRLF`.

For None, send `TRACE ON` with LF, switch to None, and send `ABC`. Expect byte reports for 41 / 42 / 43.

For exact HEX, send `RAW 4` in Text/LF mode, then switch to HEX and send:

```
00 01 7F FF
```

Expected:

```
RAW bytes=4 hex=00 01 7F FF
```

Other useful fixture commands:

- `UTF8`
- `LED ON`, `LED OFF`, `LED TOGGLE`
- `BURST 300 80`
- `STREAM 10`, then `STREAM STOP`
- `FLOOD 2048`

Use these to verify terminal follow/pause, Latest, search, typed-command history, macros, TXT/JSONL export, log limits, and reconnect after USB removal.

## Real UART check

Use a 3.3 V USB-UART adapter.

Wiring:

| USB-UART | Pico |
| --- | --- |
| TXD | GP1 / UART0 RX |
| RXD | GP0 / UART0 TX |
| GND | GND |

Power the Pico separately over USB and do not connect adapter VCC.

Save `examples/pico-uart-echo-test.py` on the Pico as `main.py`. Browser Kitty connects to the USB-UART adapter, not the Pico USB serial port.

The initial profile is 115200 / 8-N-1. The fixture echoes received UART bytes exactly. Change `BAUD`, `BITS`, `PARITY`, and `STOP` in the fixture and match the Web Serial Terminal settings for physical-UART tests.

MicroPython RP2 and the USB-UART adapter determine which less-common framing and flow-control combinations can actually be exercised; record unsupported combinations instead of treating them as application failures.

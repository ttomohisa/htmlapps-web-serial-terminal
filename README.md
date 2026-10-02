# Web Serial Terminal

A small Browser Kitty tool for connecting to a serial device, inspecting Text or HEX data, sending commands, saving reusable local macros, and explicitly exporting session logs.

Current development version: v0.7.0

[日本語 README](README.ja.md)

## Current milestone

v0.7.0 adds reusable local command macros on top of the terminal and logging workflow:

- Web Serial feature detection
- device selection through the browser chooser
- discovery of previously permitted ports without auto-connecting
- configurable baud rate, including standard presets and a custom positive integer
- configurable 7/8 data bits, 1/2 stop bits, none/even/odd parity, and none/hardware flow control
- Text / HEX receive display
- independent Text / HEX transmit mode
- selectable None / LF / CR / CRLF line endings for Text transmit
- strict HEX validation before raw-byte transmit
- optional millisecond timestamps
- optional Local echo with explicit RX / TX distinction
- DTR / RTS controls that remain untouched until the user changes them
- short BREAK pulse
- CTS / DSR / DCD / RI inspection where available
- ESC / Ctrl+C / Ctrl+D / Ctrl+Z / Tab one-byte control keys
- explicit reconnect flow after unexpected USB disconnect
- RX / TX raw-byte counters
- terminal Copy and display-only Clear with safe Undo
- Auto-scroll that pauses when you scroll up, with a new-line counter and Latest action
- session-only Up / Down command history
- up to 12 locally stored Text / HEX command macros
- per-macro Text line-ending settings, editing, deletion confirmation, and one-tap send
- case-insensitive terminal search with previous / next navigation
- approximately 32 ms batched display rendering
- display buffer capped at 50,000 line breaks / approximately 5 MiB without deleting the session log
- live connection duration
- in-memory session log with explicit TXT / JSONL file export
- separate bounded terminal-display history and exportable session-log history
- approximate 20 MiB session-log memory budget with a near-limit warning
- automatic log-recording stop at the budget while serial communication and display continue
- confirmed Clear log action that leaves the terminal display and RX / TX counters intact and resumes logging
- per-record Blob-part TXT / JSONL export for long sessions
- local persistence of connection/display preferences, but not communication records
- explicit disconnect
- recoverable errors for open, read, write, and unexpected disconnect
- Japanese / English UI
- no runtime CDN or external API

Mobile/compatibility finish work and other advanced features remain scheduled for later milestones.

## Usage

1. Connect a serial device to the computer.
2. Open Web Serial Terminal in a browser that supports Web Serial.
3. Choose Device.
4. Open Connection settings if you need to change baud rate, framing, or flow control.
5. Connect.
6. Choose Text or HEX display. Timestamp and Local echo are optional.
7. Choose Text or HEX for sending. Text uses the selected line ending; HEX sends the exact byte sequence.
8. Open Device control when you need DTR / RTS, BREAK, input signals, or control keys.
9. Scroll upward to read older output; follow mode pauses automatically. Use Search or Up / Down command history when needed.
10. Add frequently used Text / HEX sends under Command macros. Macro definitions stay on this browser/device and can be run only while connected.
11. Watch the log-usage indicator during long sessions. If logging stops at the approximate 20 MiB budget, save TXT or JSONL, then use Clear log to start a fresh saved-session log without clearing the terminal.
12. Disconnect when finished.

The app never connects automatically on page load.

## Privacy

Serial RX and TX data are handled in the browser and are not sent to a Browser Kitty server.

The standalone build keeps runtime network connections blocked with Content Security Policy. There is no analytics, telemetry, remote font, or runtime CDN dependency.

v0.7.0 keeps communication records only in memory while the page is open and bounds the exportable session log to an approximate 20 MiB memory budget. TXT / JSONL files are written only when you explicitly save them. Language, serial/display preferences, and user-created command macros may be stored locally on this browser/device.

## Browser support

Web Serial support is feature-detected at runtime. Unsupported browsers show an explanatory state instead of attempting to connect.

Desktop Chromium browsers are the primary initial implementation target. Firefox desktop and Android compatibility are part of the planned compatibility work and must be verified with the actual release before strong support claims are made. Safari environments without Web Serial are unsupported.

## Limitations in v0.7.0

- The 20 MiB log limit is an approximate in-memory estimate rather than a precise JavaScript heap measurement.
- Macro import/export and synchronization are not included; clearing browser site data can remove locally saved macros.
- Custom baud rates are accepted as positive integers, but actual support depends on the OS, driver, browser, and device.
- No ANSI / VT100 emulation.
- The browser may expose VID / PID but not a user-friendly COM port name.

See APP_SPEC.md for the v0.7.0 acceptance criteria and the remaining roadmap to v1.0.0.

## Build

On Windows:

    build-standalone.bat

The repository check performs PowerShell preflight, builds the readable and self-extracting standalone files, verifies CSP and embedding rules, and creates the repository-root readable HTML copy.

Generated files must not be edited directly. Edit src/index.template.html and rebuild.

## License

MIT. See LICENSE.

There are no third-party runtime libraries in v0.7.0.

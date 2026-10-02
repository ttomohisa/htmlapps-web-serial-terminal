# Web Serial Terminal

A small Browser Kitty tool for connecting to a serial device, inspecting Text or HEX data, sending commands, and explicitly saving local session logs.

Current development version: v0.4.0

[日本語 README](README.ja.md)

## Current milestone

v0.4.0 adds serial device-control operations on top of the HEX/logging foundation:

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
- terminal Copy, display-only Clear with safe Undo, and manual Auto-scroll ON/OFF
- in-memory session log with explicit TXT / JSONL file export
- local persistence of connection/display preferences, but not communication records
- explicit disconnect
- recoverable errors for open, read, write, and unexpected disconnect
- Japanese / English UI
- no runtime CDN or external API

Command history, search, completed long-session logging controls, macros, and other advanced features remain scheduled for later milestones.

## Usage

1. Connect a serial device to the computer.
2. Open Web Serial Terminal in a browser that supports Web Serial.
3. Choose Device.
4. Open Connection settings if you need to change baud rate, framing, or flow control.
5. Connect.
6. Choose Text or HEX display. Timestamp and Local echo are optional.
7. Choose Text or HEX for sending. Text uses the selected line ending; HEX sends the exact byte sequence.
8. Open Device control when you need DTR / RTS, BREAK, input signals, or control keys.
9. Use TXT log or JSONL to explicitly save the in-memory session when needed.
10. Disconnect when finished.

The app never connects automatically on page load.

## Privacy

Serial RX and TX data are handled in the browser and are not sent to a Browser Kitty server.

The standalone build keeps runtime network connections blocked with Content Security Policy. There is no analytics, telemetry, remote font, or runtime CDN dependency.

v0.3.0 keeps communication records only in memory while the page is open. TXT / JSONL files are written only when you explicitly save them. Language, serial, and display preferences may be stored locally.

## Browser support

Web Serial support is feature-detected at runtime. Unsupported browsers show an explanatory state instead of attempting to connect.

Desktop Chromium browsers are the primary initial implementation target. Firefox desktop and Android compatibility are part of the planned compatibility work and must be verified with the actual release before strong support claims are made. Safari environments without Web Serial are unsupported.

## Limitations in v0.4.0

- Session logs are kept in memory; complete log-size limits and explicit session-log reset are scheduled for v0.6.0.
- Custom baud rates are accepted as positive integers, but actual support depends on the OS, driver, browser, and device.
- No ANSI / VT100 emulation.
- The browser may expose VID / PID but not a user-friendly COM port name.

See APP_SPEC.md for the v0.4.0 acceptance criteria and the remaining roadmap to v1.0.0.

## Build

On Windows:

    build-standalone.bat

The repository check performs PowerShell preflight, builds the readable and self-extracting standalone files, verifies CSP and embedding rules, and creates the repository-root readable HTML copy.

Generated files must not be edited directly. Edit src/index.template.html and rebuild.

## License

MIT. See LICENSE.

There are no third-party runtime libraries in v0.4.0.

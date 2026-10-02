# Web Serial Terminal

A small Browser Kitty tool for connecting to a serial device, reading incoming text, and sending commands directly from the browser.

Current development version: v0.1.0

[日本語 README](README.ja.md)

## Current milestone

v0.1.0 implements the Serial Foundation:

- Web Serial feature detection
- device selection through the browser chooser
- discovery of previously permitted ports without auto-connecting
- fixed 115200 / 8-N-1 connection profile
- streaming UTF-8 text receive
- text command send with LF appended
- explicit disconnect
- recoverable errors for open, read, write, and unexpected disconnect
- Japanese / English UI
- no runtime CDN or external API

HEX mode, configurable serial settings, timestamps, local echo, DTR/RTS, logging, macros, and other advanced features are intentionally scheduled for later milestones.

## Usage

1. Connect a serial device to the computer.
2. Open Web Serial Terminal in a browser that supports Web Serial.
3. Choose Device.
4. Confirm the selected device and the 115200 / 8-N-1 profile.
5. Connect.
6. Read incoming text in the terminal.
7. Type a command and press Enter or Send. v0.1.0 appends LF.
8. Disconnect when finished.

The app never connects automatically on page load.

## Privacy

Serial RX and TX data are handled in the browser and are not sent to a Browser Kitty server.

The standalone build keeps runtime network connections blocked with Content Security Policy. There is no analytics, telemetry, remote font, or runtime CDN dependency.

v0.1.0 does not persist terminal communication. Only the language preference may be stored locally.

## Browser support

Web Serial support is feature-detected at runtime. Unsupported browsers show an explanatory state instead of attempting to connect.

Desktop Chromium browsers are the primary initial implementation target. Firefox desktop and Android compatibility are part of the planned compatibility work and must be verified with the actual release before strong support claims are made. Safari environments without Web Serial are unsupported.

## Limitations in v0.1.0

- Serial settings are fixed to 115200 baud, 8 data bits, no parity, 1 stop bit, and no flow control.
- Send appends LF.
- Text mode only.
- No log export yet.
- No DTR / RTS / BREAK controls yet.
- No ANSI / VT100 emulation.
- The browser may expose VID / PID but not a user-friendly COM port name.

See APP_SPEC.md for the v0.1.0 acceptance criteria and the v0.2.0 to v1.0.0 roadmap.

## Build

On Windows:

    build-standalone.bat

The repository check performs PowerShell preflight, builds the readable and self-extracting standalone files, verifies CSP and embedding rules, and creates the repository-root readable HTML copy.

Generated files must not be edited directly. Edit src/index.template.html and rebuild.

## License

MIT. See LICENSE.

There are no third-party runtime libraries in v0.1.0.

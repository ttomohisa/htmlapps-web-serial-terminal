# Web Serial Terminal — Application Specification

## 1. Product identity

- Product: Browser Kitty Web Serial Terminal
- Japanese label: Web Serial Terminal / シリアル通信ターミナル
- Repository: ttomohisa/htmlapps-web-serial-terminal
- Target stable release: v1.0.0
- Current implementation milestone: v0.1.0
- Primary color: #16624F
- Distribution: readable single HTML, self-extracting single HTML, and repository-root readable HTML copy

## 2. Purpose

Web Serial Terminal connects a browser directly to a serial device through the Web Serial API.

The product is intentionally focused on three jobs:

1. See data received from a serial device.
2. Send data to a serial device.
3. Record or export the communication when that feature is introduced in later milestones.

It is not intended to become a full embedded-development IDE.

## 3. Primary users

- Arduino, ESP32, STM32, Raspberry Pi Pico, and other microcontroller users.
- Developers checking debug output from USB CDC or USB-UART devices.
- Engineers using USB-RS232 or USB-RS485 adapters.
- Network or equipment technicians who occasionally need a serial console.
- Learners experimenting with UART and serial communication.

## 4. Core user flow

1. Open the application.
2. Select a serial device using the browser device chooser.
3. Review the selected device and the current communication settings.
4. Connect.
5. Read incoming text in the terminal.
6. Enter a command and send it.
7. Disconnect explicitly, or recover from an unexpected device disconnect.

No connection starts automatically on page load.

## 5. Privacy and trust boundary

- Serial RX and TX data remain in the browser.
- The app performs no runtime HTTP, WebSocket, analytics, telemetry, font, or CDN request.
- Serial communication is device I/O and does not require a Browser Kitty server.
- User communication content is not persisted by v0.1.0.
- Language preference may be stored locally.
- Later log export must occur only after an explicit user action.
- Runtime CSP keeps connect-src 'none'.

## 6. Browser and device constraints

The application requires a browser environment that exposes navigator.serial and permits Web Serial.

The UI must feature-detect Web Serial. Unsupported browsers must show a clear explanation and keep connection actions disabled rather than failing with a generic error.

The application must not claim a COM port name or device name that the API did not provide. When available, USB vendor and product IDs may be shown.

Direct file opening remains a release target, but browser-specific Web Serial permission behavior must be verified before stable-release compatibility claims are made.

## 7. v0.1.0 functional requirements — Serial Foundation

### 7.1 Feature detection

On startup:

- Detect whether navigator.serial exists.
- Detect whether the page is in a secure context.
- If Web Serial is unavailable, show an unsupported state.
- Do not show a permission prompt automatically.

### 7.2 Previously permitted ports

- Call navigator.serial.getPorts() after startup when Web Serial is available.
- If at least one previously permitted port is returned, select the first one as the current device.
- Do not open it automatically.
- The user can still choose another device.

### 7.3 Device selection

The Choose device action calls navigator.serial.requestPort() only from a user gesture.

When the chooser is cancelled:

- Do not show a destructive or alarming error state.
- Keep the previous selected device when one exists.
- Show a small neutral message.

### 7.4 Communication settings

v0.1.0 uses a fixed connection profile:

- Baud rate: 115200
- Data bits: 8
- Stop bits: 1
- Parity: none
- Flow control: none

The current profile must be visible in the UI.

Changing these values is deferred to v0.2.0.

### 7.5 Connect

Connect is enabled only when a device is selected and no connection is active.

Connection uses SerialPort.open() with the v0.1.0 profile.

State progression:

- idle
- device-selected
- connecting
- connected
- disconnecting
- disconnected
- error
- unsupported

The UI uses human-readable localized labels rather than exposing these internal state names.

### 7.6 Receive text

- Read SerialPort.readable through a reader.
- Decode received bytes with streaming UTF-8 TextDecoder behavior.
- Append decoded text to the terminal without interpreting it as HTML.
- Automatically keep the latest received content visible in v0.1.0.
- Keep a provisional display limit so a runaway stream cannot grow the DOM and string state indefinitely.
- v0.5.0 will replace this provisional behavior with the full buffered terminal design.

### 7.7 Send text

- Send UTF-8 text through SerialPort.writable.
- v0.1.0 appends LF to each submitted command.
- The UI must state that LF is appended.
- Enter sends from the single-line command field.
- Sending is disabled while disconnected or while the field is empty.
- CR, CRLF, and no-line-ending selection are deferred to v0.2.0.

### 7.8 Disconnect

Explicit Disconnect must:

- stop the read loop,
- release reader and writer locks,
- close the serial port when possible,
- return the UI to a selected-device state.

Unexpected disconnect must:

- stop enabling send controls,
- preserve already displayed terminal text,
- explain that the cable or device may have become unavailable,
- allow the user to select or reconnect a device.

### 7.9 Errors

At minimum distinguish:

- Web Serial unsupported.
- Insecure context.
- Device chooser cancelled.
- Port open failure.
- Read failure.
- Write failure.
- Unexpected disconnect.

Technical exception names may be included as secondary detail, but the primary user-facing message must describe the likely next action.

## 8. v0.1.0 UX requirements

### Desktop

One primary workspace:

- connection controls at the top,
- terminal as the largest area,
- command composer directly below the terminal.

### Smartphone

- No horizontal page scrolling.
- Controls wrap without overlap.
- Terminal remains useful at 320px width and above.
- Connection and send buttons have touch-friendly targets.
- Help dialog remains fully scrollable.
- The app does not require a fixed bottom bar in v0.1.0.

### Accessibility

- Visible focus.
- Keyboard-operable controls.
- Status uses aria-live.
- Connected state is not communicated by color alone.
- Help opens as a dialog and closes with its close control, Escape, or backdrop click.
- Motion honors prefers-reduced-motion.

## 9. Localization

Japanese and English are included in the same HTML.

The language switch changes:

- visible labels,
- status text,
- help content,
- title and accessible labels.

Technical terms such as Web Serial, USB, baud rate, VID, and PID may remain technical when translation would reduce clarity.

## 10. v0.1.0 non-goals

Not included yet:

- configurable baud rate and framing,
- CR / CRLF / no-ending selection,
- HEX RX or TX,
- timestamps,
- local echo,
- DTR / RTS / BREAK,
- control-key palette,
- command history,
- terminal search,
- log file export,
- macros,
- ANSI / VT100 interpretation,
- serial plotting,
- Modbus,
- firmware flashing,
- multiple simultaneous ports.

## 11. v0.1.0 acceptance criteria

- The repository metadata identifies Web Serial Terminal v0.1.0.
- The starter app UI and starter copy are fully removed from the runtime app.
- Web Serial support is feature-detected.
- A user can choose a port from a user gesture.
- Previously permitted ports can be discovered without auto-connecting.
- A selected port can be opened at 115200 / 8-N-1.
- Received UTF-8 text appears in the terminal.
- A typed command plus LF can be sent.
- A connection can be closed cleanly.
- An unexpected disconnect results in a recoverable state.
- Japanese and English UI are present.
- Runtime network access remains blocked by CSP.
- No third-party runtime dependency is required.
- The canonical favicon and header icon use the same SVG.
- The standard repository build and standalone verification pass.
- Hardware communication remains an explicit manual test item unless a real serial device was actually used.

## 12. Development plan

### v0.1.0 — Serial Foundation

Implement Web Serial feature detection, device selection, getPorts discovery, fixed 115200 / 8-N-1 connection, Text RX, Text TX with LF, explicit disconnect, and basic errors.

### v0.2.0 — Terminal Core

Add configurable baud rate, data bits, stop bits, parity, flow control, selectable line endings, improved terminal controls, Copy, Clear, and the first deliberate auto-scroll behavior.

### v0.3.0 — HEX / Logging Basics

Add Text / HEX RX and TX, HEX validation, timestamp display, RX/TX distinction, local echo, byte counters, and initial TXT / JSONL session logging.

### v0.4.0 — Device Control

Add DTR, RTS, BREAK, ESC, Ctrl+C, Ctrl+D, Ctrl+Z, Tab, signal inspection where available, and stronger reconnect handling.

### v0.5.0 — Terminal UX

Add paused auto-scroll while reading history, new-log indicator, command history, search, proper display-buffer limits, batched rendering, and connection duration.

### v0.6.0 — Logging / Session

Complete TXT and JSONL exports, raw-byte preservation, session-size handling, log limits, and clear separation between display clear and log clear.

### v0.7.0 — Command Macros

Add locally stored Text / HEX macros with line-ending settings, editing, deletion, empty states, and desktop/mobile layouts.

### v0.8.0 — Mobile / Compatibility

Finish smartphone interaction, software-keyboard handling, compact settings presentation, supported-browser messaging, Firefox desktop verification, and Android Web Serial experiments on available hardware.

### v0.9.0 — Release Candidate

Stop adding features. Perform high-rate and long-session tests, device-unplug tests, occupied-port tests, invalid-input tests, memory review, accessibility review, Japanese/English review, CSP/network review, and standalone HTML checks.

### v1.0.0 — Stable Release

Finalize README, screenshots, favicon, browser-support statements, real-device regression coverage, release artifacts, repository checks, and version consistency.

## 13. Post-v1.0 candidates

Potential additions to this app:

- ANSI / VT100 mode.
- macro import/export.
- saved device profiles.
- advanced log filtering.
- binary file transfer where a clear user need exists.

Prefer separate Browser Kitty applications for:

- Web Serial Plotter.
- Modbus RTU Tester.

## 14. In-app help contract

The header help button must explain:

- how to choose and connect a device,
- the fixed v0.1.0 serial settings,
- that Send appends LF,
- that communication stays in the browser,
- that no connection starts automatically,
- browser support limitations,
- unexpected disconnect recovery.

Help must be updated in the same change whenever user-visible behavior changes.

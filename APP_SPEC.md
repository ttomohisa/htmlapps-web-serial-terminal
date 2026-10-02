# Web Serial Terminal — Application Specification

## 1. Product identity

- Product: Browser Kitty Web Serial Terminal
- Japanese label: Web Serial Terminal / シリアル通信ターミナル
- Repository: ttomohisa/htmlapps-web-serial-terminal
- Target stable release: v1.0.0
- Current implementation milestone: v0.7.0
- Primary color: #16624F
- Distribution: readable single HTML, self-extracting single HTML, and repository-root readable HTML copy

## 2. Purpose

Web Serial Terminal connects a browser directly to a serial device through the Web Serial API.

The product is intentionally focused on three jobs:

1. See Text or raw HEX data received from a serial device.
2. Send Text or raw HEX data to a serial device.
3. Keep an in-memory session record and explicitly export it when needed.

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
- Serial communication content is never sent to a Browser Kitty server.
- v0.6.0 keeps the session log only in memory while the page is open and bounds its estimated memory usage.
- Language, serial connection preferences, display preferences, and send-mode preferences may be stored locally.
- TXT / JSONL files are written only after an explicit user save action.
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

v0.2.0 replaces this fixed profile with configurable values. The v0.1.0 behavior is retained here as historical context.

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
- v0.2.0 adds None, LF, CR, and CRLF line-ending selection.

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

## 7A. v0.2.0 functional requirements — Terminal Core

### 7A.1 Communication settings

Before connecting, the user can configure:

- Baud rate presets: 300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200, 230400, 460800, and 921600.
- A custom positive integer baud rate.
- Data bits: 7 or 8.
- Stop bits: 1 or 2.
- Parity: none, even, or odd.
- Flow control: none or hardware.

The selected settings are passed directly to `SerialPort.open()`.

Connection settings are disabled while connecting, connected, or disconnecting. The user must disconnect before changing them.

The last valid connection settings are stored locally and restored on the next load. They are not sent anywhere.

### 7A.2 Line endings

Text transmit supports:

- None
- LF
- CR
- CRLF

The selected line ending is shown next to the command field and is stored locally.

Changing the line ending does not require disconnecting because it affects only outgoing text framing.

### 7A.3 Terminal toolbar

The terminal provides:

- Copy all displayed terminal text.
- Clear displayed terminal text.
- Undo for Clear while no newer received data has arrived.
- A character count for the current display buffer.
- Manual Auto-scroll ON/OFF.

Copy uses the Clipboard API when available and a local fallback otherwise.

Clear affects only the current display. v0.2.0 still does not create or persist a session log.

If new RX arrives after Clear, Undo must not overwrite the newer received text.

### 7A.4 Auto-scroll

Auto-scroll defaults to ON.

When ON, incoming text keeps the terminal at the latest content.

When OFF, incoming text does not change the user's scroll position.

Automatic pause based on manual upward scrolling and a new-log indicator remain scheduled for v0.5.0.

### 7A.5 Settings validation

Custom baud rate must be an integer greater than zero.

Invalid custom baud values:

- must prevent connection,
- must keep the settings panel available,
- must show a field-local explanation.

Whether a numerically valid baud rate is actually supported is determined by the OS, driver, browser, and device.

## 7B. v0.3.0 functional requirements — HEX / Logging Basics

### 7B.1 Display modes

The terminal supports two receive display modes:

- Text
- HEX

Text mode uses streaming UTF-8 decoding for the live receive view.

HEX mode renders the original received bytes as uppercase two-digit hexadecimal values separated by spaces.

The display mode is a view preference only. Switching display mode does not alter the underlying session bytes.

### 7B.2 Timestamp and direction display

Timestamp display can be toggled independently.

When timestamp display is enabled, terminal records include local time with millisecond precision.

When structured terminal records are shown, RX and TX are labeled explicitly.

With the default Text display, timestamps OFF, and Local echo OFF, RX text remains visually close to a conventional serial monitor rather than forcing direction prefixes onto every receive chunk.

### 7B.3 Local echo

Local echo defaults to OFF.

When ON, TX session entries are also displayed in the terminal and are labeled TX.

Local echo changes display behavior only. TX bytes are recorded in the in-memory session log regardless of the Local echo setting.

### 7B.4 HEX transmit

Transmit mode supports:

- Text
- HEX

Text mode retains the v0.2.0 selectable line ending.

HEX mode sends the entered bytes exactly and does not append a Text line ending.

Accepted HEX examples include:

- `01 03 00 00`
- `01030000`
- `0x01 0x03 0x00 0x00`

Incomplete bytes, non-hexadecimal characters, or otherwise invalid input must not be sent and must produce an inline explanation.

### 7B.5 Byte counters

The session UI tracks:

- RX byte count
- TX byte count

Counts represent the raw bytes received from or written to the SerialPort.

Display Clear does not reset byte counters.

### 7B.6 Session log model

Each communication record kept in memory includes at minimum:

- timestamp
- direction: RX or TX
- raw bytes
- decoded Text representation used by the live view where applicable

The session log is not written to localStorage or another persistent browser database.

Closing or reloading the page discards it unless the user explicitly saves a file first.

### 7B.7 TXT export

TXT export is a human-readable session log.

Each exported record includes:

- local date and time with millisecond precision
- RX / TX
- readable escaped Text when the exact record bytes form suitable Text
- otherwise an explicit HEX byte sequence

Control newlines and tabs are escaped so one communication record remains one TXT line.

### 7B.8 JSONL export

JSONL export stores one JSON object per communication record.

Each object includes:

- ISO timestamp
- direction
- raw bytes as compact hexadecimal
- a UTF-8 decoded Text field derived from those exact bytes

The raw byte field is authoritative when Text decoding is lossy.

### 7B.9 Display Clear versus session log

Clear removes only the visible terminal history.

It does not remove:

- session records
- byte counters
- data included in later TXT / JSONL export

Undo restores the prior display only when no newer communication record arrived after Clear.

Full session-log clearing and session-size controls are deferred to v0.6.0.

### 7B.10 Initial logging limits

v0.3.0 introduces the session-log data model and export path, but complete session-size handling, explicit log reset, and long-session limits remain part of v0.6.0.

The existing terminal display-size guard remains in place independently from the session log.

## 7C. v0.4.0 functional requirements — Device Control

### 7C.1 Output control signals

While connected, the application exposes:

- DTR / Data Terminal Ready
- RTS / Request To Send
- BREAK

DTR and RTS are not set merely because the serial port is opened.

Their initial application state is shown as unchanged. The application calls `SerialPort.setSignals()` only after an explicit user action.

The UI warns that changing DTR / RTS can reset or otherwise affect some target devices.

BREAK is sent as a short pulse:

1. assert BREAK,
2. wait approximately 250 ms,
3. de-assert BREAK.

The application attempts to de-assert BREAK even if an error occurs after assertion.

BREAK does not increment TX byte count because it is a control signal rather than transmitted payload bytes.

### 7C.2 Input signal inspection

When supported by the open port, `SerialPort.getSignals()` is used to display:

- CTS / Clear To Send
- DSR / Data Set Ready
- DCD / Data Carrier Detect
- RI / Ring Indicator

Input signals are read after connection and can be refreshed manually.

Failure to read input signals does not terminate the serial connection.

### 7C.3 Control keys

While connected, the application provides touch-friendly buttons for:

- ESC: `0x1B`
- Ctrl+C: `0x03`
- Ctrl+D: `0x04`
- Ctrl+Z: `0x1A`
- Tab: `0x09`

Each control key sends exactly one raw byte.

No Text line ending is appended.

Successful control-key transmit:

- increments TX byte count,
- is stored in the same in-memory session log as other TX data,
- appears in Local echo when Local echo is enabled.

The Text display may use a readable control-key label while the underlying raw byte remains authoritative.

### 7C.4 Unexpected disconnect and reconnect

If the selected device disconnects unexpectedly:

- active stream locks are released,
- the current session display and log remain available,
- send and device-control actions are disabled,
- the selected port reference is retained,
- the primary connection action changes to Reconnect.

While the browser reports that the physical device is unavailable, Reconnect remains disabled.

When a matching Web Serial `connect` event indicates that the selected port is available again:

- Reconnect becomes available,
- the application does not automatically reopen the port,
- the user must explicitly press Reconnect.

The same connection settings are reused unless the user changes them before reconnecting.

### 7C.5 Device-control errors

The application distinguishes signal-control failures from normal serial payload write failures.

A failure to change or inspect control signals must not silently terminate the connection.

DTR / RTS / BREAK controls are disabled while disconnected.

Control-key buttons are disabled unless the serial writer is available.

## 7D. v0.5.0 functional requirements — Terminal UX

### 7D.1 Follow-latest behavior

Auto-scroll defaults to ON.

When the user manually scrolls upward far enough to read older content:

- Auto-scroll pauses automatically.
- Incoming data continues to be read and recorded normally.
- The terminal does not pull the viewport back to the bottom.
- A compact indicator shows how many new logical lines arrived while follow mode was paused.
- A Latest action restores follow mode and moves to the newest content.

If the user manually scrolls back to the bottom, follow mode resumes and the new-line counter resets.

Manual Auto-scroll ON / OFF remains available.

### 7D.2 Command history

Successful typed Text or HEX sends are added to session-only command history.

History:

- is not persisted across page reloads,
- keeps up to 100 entries,
- suppresses consecutive duplicates with the same send mode and Text line-ending setting,
- is navigated with Arrow Up and Arrow Down in the command field,
- restores the send mode and line-ending setting associated with the recalled command,
- preserves the current draft so Arrow Down past the newest history item restores what the user had been typing.

Control-key buttons do not enter command history.

### 7D.3 Terminal search

Search operates on the currently visible terminal display buffer.

Search:

- is case-insensitive,
- supports previous / next navigation,
- shows the current match index and total matches,
- highlights the active match using the browser selection range,
- does not stop RX processing,
- pauses follow mode when the user jumps to an older match.

Search work is triggered by search interaction or explicit display rebuild rather than every RX render batch, so high-rate input is not repeatedly rescanned on every chunk.

The stored match index list is capped at 5,000 matches for UI responsiveness.

### 7D.4 Display buffer limits

The terminal display buffer is independent from the full in-memory session log.

The visible display keeps at most:

- 50,000 logical line breaks, and
- approximately 5 MiB of display text.

When the display limit is reached, older visible content is omitted while:

- RX / TX byte counters remain correct,
- the in-memory session log remains intact,
- TXT / JSONL export still includes the session records that were omitted from the display.

The UI explains that older log content was omitted from the display.

Session-log memory limits are handled separately in v0.6.0.

### 7D.5 Batched rendering

High-rate incoming display updates are batched on an approximately 32 ms interval.

Normal receive processing and the session model remain immediate; only DOM display work is batched.

When the display does not need trimming or a complete rebuild, new text is appended to the existing terminal text node instead of replacing the full DOM text on every RX chunk.

Changing display mode, timestamp mode, Local echo, language, or display Clear may perform a full bounded display rebuild because those are deliberate user actions.

### 7D.6 Connection duration

While connected, the status row displays elapsed connection time in `HH:MM:SS`.

The timer:

- starts after the port is successfully opened,
- resets on a later explicit reconnect,
- stops on explicit disconnect,
- stops on unexpected disconnect,
- does not continue running merely because the selected port remains remembered.

## 7E. v0.6.0 functional requirements — Logging / Session

### 7E.1 Separate display history and saved-session log

The terminal display history and the exportable session log are separate in-memory structures.

Every successful RX or TX operation can continue to update:

- the terminal display history,
- RX / TX byte counters,
- connection behavior,

even when saved-session logging has stopped.

Display history is separately bounded for terminal reconstruction and does not require the exportable session log to keep growing.

### 7E.2 Session-log memory budget

The exportable session log has an approximate 20 MiB in-memory budget.

The estimate includes:

- raw payload bytes,
- decoded Text stored for the record,
- optional display label text,
- a fixed per-record overhead allowance.

At approximately 16 MiB, the UI gives a one-time warning.

When the next complete record would exceed the 20 MiB budget:

- that record is not added to the exportable session log,
- log recording stops,
- serial communication continues,
- terminal display continues,
- RX / TX byte counters continue,
- the UI clearly shows that log recording has stopped.

Records are never partially stored merely to fit the remaining budget.

### 7E.3 Log status

The status row shows approximate current saved-session log usage and the 20 MiB limit.

The state is visually distinguishable as:

- recording,
- approaching limit,
- recording stopped.

The state must not be communicated by color alone; text such as Log stopped / ログ停止 remains visible.

### 7E.4 TXT and JSONL export

TXT and JSONL continue to export only records that are present in the exportable session log.

Long-session export is assembled as Blob parts per record instead of first concatenating the entire log into one giant output string.

TXT keeps the established human-readable format.

JSONL keeps one object per communication record with:

- timestamp,
- direction,
- raw HEX bytes,
- UTF-8 decoded Text from the exact record bytes.

Export filenames use the existing `serial-log-YYYYMMDD-HHMMSS` form.

Save failure produces a user-visible message.

### 7E.5 Session-log clear

Clear log / ログ消去 is separate from terminal Clear.

Clear log:

- requires explicit confirmation,
- removes only the exportable session records,
- resets the approximate session-log usage to zero,
- resumes log recording if it had stopped,
- does not clear the terminal display,
- does not reset RX / TX byte counters,
- does not disconnect the serial device.

This operation is intentionally destructive and has no Undo.

### 7E.6 Behavior after the log limit

After log recording stops at the budget:

- the user can continue communicating normally,
- the terminal remains usable,
- save buttons export the records captured before the stop,
- the user can save the current log,
- the user can then Clear log to begin recording a new in-memory log.

Saving does not automatically clear or resume the log.

### 7E.7 Display-history retention

The display-history entry list has its own approximate memory budget and entry-count guard in addition to the v0.5.0 visible text limits.

Dropping old display-history records:

- may reduce what can be reconstructed after a display-mode change,
- does not delete records still referenced by the exportable session log,
- does not alter RX / TX byte counters.

The visible terminal remains bounded by the v0.5.0 display-text limits.

## 7F. v0.7.0 functional requirements — Command Macros

### 7F.1 Macro model

The application supports up to 12 user-defined command macros.

Each macro stores:

- a stable local identifier,
- a user-visible name,
- a payload,
- send mode: Text or HEX,
- Text line ending: None, LF, CR, or CRLF.

HEX macros always use no additional Text line ending.

Macro names are limited to 40 characters and payloads to 8,192 characters.

### 7F.2 Local persistence

Macros are stored only in localStorage on the current browser/device.

The macro store contains macro definitions only. It does not contain:

- serial RX data,
- serial TX session records,
- exported logs,
- device contents.

If localStorage is unavailable or a save fails, the UI must not claim that the macro was saved.

Clearing browser site data may remove saved macros.

### 7F.3 Add and edit

Macro management is available even while disconnected.

The editor supports:

- name,
- payload,
- Text / HEX mode,
- Text line ending.

The editor validates required name and payload fields.

HEX payloads use the same strict HEX parser as ordinary HEX transmit. Invalid HEX cannot be saved.

No vendor-specific or device-specific macro presets are bundled by default.

### 7F.4 Delete

Deleting a macro is a destructive operation and requires confirmation.

Deletion updates localStorage immediately after confirmation.

A storage failure leaves the previous in-memory macro collection unchanged and produces user-visible feedback.

### 7F.5 Execute

Macro execution is enabled only while a writable serial connection is active.

Text macro execution:

1. encodes the payload as UTF-8,
2. appends exactly the macro's configured Text line ending,
3. writes the resulting bytes once through the current SerialPort writer.

HEX macro execution:

1. parses the stored HEX payload,
2. sends the exact parsed raw bytes,
3. appends no Text line ending.

Successful macro TX:

- increments TX byte count,
- enters the same display-history path as normal TX,
- enters the saved-session log while session logging is active,
- appears in Local echo when Local echo is enabled.

Macro execution does not add an entry to the Arrow Up / Arrow Down typed-command history.

### 7F.6 Empty and limit states

With no macros configured, the panel shows an explicit empty state explaining how to add one.

The UI shows the current count out of 12.

At 12 macros:

- Add is disabled,
- existing macros remain editable, executable, and deletable.

### 7F.7 Desktop and smartphone layout

Macros are shown as compact cards containing:

- name,
- Text / HEX framing summary,
- a shortened payload preview,
- a primary execute target,
- a separate Edit action.

On narrow screens the list becomes a single column.

Macro execution and Edit remain separate touch targets.

The editor uses the existing scrollable dialog pattern and remains usable with a software keyboard.

## 8. v0.7.0 UX requirements

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
- The app does not require a fixed bottom bar in v0.5.0.

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

## 10. v0.7.0 non-goals

Not included yet:

- ANSI / VT100 interpretation,
- serial plotting,
- Modbus,
- firmware flashing,
- multiple simultaneous ports.

## 11. v0.7.0 acceptance criteria

All earlier milestone acceptance criteria remain applicable, plus:

- app metadata identifies v0.7.0.
- up to 12 macros can be stored locally.
- a macro stores name, payload, Text / HEX mode, and Text line ending.
- macro definitions are stored in localStorage, while serial session contents remain non-persistent.
- Add is disabled at 12 macros without disabling edit, execute, or delete for existing macros.
- an explicit empty state is shown when no macros exist.
- invalid HEX macro payloads cannot be saved.
- Text macro TX appends exactly the configured line ending.
- HEX macro TX sends exactly the parsed bytes with no added Text line ending.
- successful macro TX uses the normal TX byte counter, display-history, Local echo, and saved-session logging paths.
- macro execution does not enter typed-command history.
- macro Run is disabled while no writable serial connection is active.
- macros can still be added, edited, or deleted while disconnected.
- delete requires confirmation.
- a localStorage save failure does not replace the in-memory macro collection and produces visible feedback.
- no vendor-specific macro presets are bundled.
- the macro list becomes a single-column layout on narrow screens.
- Japanese and English UI/help explain macro storage and use.
- repository build and standalone verification pass.

### Historical v0.6.0 acceptance criteria



- app metadata identifies v0.6.0.
- terminal display history and exportable session records are separate structures.
- saved-session logging has an approximate 20 MiB memory budget.
- the UI warns once when the log approaches the limit.
- when a complete next record would exceed the limit, log recording stops without stopping serial RX/TX.
- no communication record is partially stored to fit the remaining log budget.
- RX / TX byte counters continue after saved-session logging stops.
- terminal display continues after saved-session logging stops.
- status text clearly identifies recording, near-limit, and stopped states.
- TXT and JSONL export only the records captured in the current saved-session log.
- TXT / JSONL export is created from per-record Blob parts rather than one pre-concatenated output string.
- Clear log requires confirmation.
- Clear log does not clear the terminal display or reset RX / TX byte counters.
- Clear log resumes logging after a limit stop.
- saving a log does not automatically clear or resume it.
- save failures produce user-visible feedback.
- Japanese and English help explain the 20 MiB approximate log budget and Clear versus Clear log.
- repository build and standalone verification pass.

### Historical v0.5.0 acceptance criteria



- app metadata identifies v0.5.0.
- manually scrolling upward pauses follow mode without pausing RX.
- new logical lines received while follow mode is paused are counted.
- Latest resumes follow mode and moves to the bottom.
- manually scrolling back to the bottom resumes follow mode.
- successful typed sends are available through session-only Arrow Up / Arrow Down history.
- command history keeps at most 100 entries and suppresses consecutive duplicates with the same send framing.
- command history restores the associated Text / HEX send mode and Text line ending.
- terminal search finds previous / next matches in the current display buffer.
- search does not run a full-buffer scan on every RX render batch.
- the display buffer is bounded to 50,000 line breaks and approximately 5 MiB of display text.
- omitting old display content does not delete session records or alter byte counters.
- terminal DOM rendering is batched at approximately 32 ms rather than rewritten for every incoming chunk.
- connection duration is visible only while the serial connection is active.
- Japanese and English help describe follow mode, search, and command history.
- repository build and standalone verification pass.

### Historical v0.4.0 acceptance criteria



- app metadata identifies v0.4.0.
- DTR and RTS remain untouched by the application until the user explicitly changes them.
- DTR / RTS can be asserted and de-asserted with `setSignals()`.
- BREAK is sent as a short assert/de-assert pulse and is not counted as TX payload bytes.
- CTS / DSR / DCD / RI are displayed when `getSignals()` succeeds.
- failure to read input signals does not terminate the connection.
- ESC, Ctrl+C, Ctrl+D, Ctrl+Z, and Tab send their exact one-byte control values.
- control-key TX is counted and recorded in the normal session log.
- device-control actions are disabled while disconnected.
- unexpected USB removal leaves the visible terminal and in-memory session intact.
- after unexpected disconnect the primary action clearly becomes Reconnect.
- the application does not automatically reopen a reattached device.
- a matching Web Serial connect event re-enables explicit Reconnect.
- Japanese and English help warn about DTR / RTS / BREAK effects.
- repository build and standalone verification pass.

### Historical v0.3.0 acceptance criteria



- app metadata identifies v0.3.0.
- receive display can switch between Text and HEX without changing the recorded raw bytes.
- Text display uses streaming UTF-8 decoding.
- timestamp display can be toggled and includes millisecond precision.
- Local echo can be toggled and TX remains hidden from the terminal when Local echo is OFF.
- RX and TX remain distinct in structured display and session data.
- Text and HEX transmit modes are independently selectable from the receive display mode.
- HEX transmit sends the exact parsed byte sequence with no Text line ending appended.
- invalid HEX is blocked with an inline explanation.
- RX and TX raw-byte counters update correctly and are not reset by display Clear.
- every successful RX and TX operation is recorded in the in-memory session model.
- display Clear does not delete the session log.
- TXT export includes timestamp, direction, and readable Text or HEX fallback.
- JSONL export includes timestamp, direction, compact raw HEX bytes, and Text decoded from those exact bytes.
- log files are created only after an explicit user action.
- communication records are not written to localStorage.
- Japanese and English help explain Text / HEX, timestamp, Local echo, and log saving.
- repository build and standalone verification pass.

### Historical v0.2.0 acceptance criteria

- app metadata identifies v0.2.0.
- baud rate can be selected from presets or entered as a custom positive integer.
- data bits, stop bits, parity, and flow control can be changed before connection.
- connection settings are locked while a serial connection is active.
- valid serial settings are stored locally and restored on reload.
- None / LF / CR / CRLF can be selected independently of the connection state.
- Text send appends exactly the selected line ending.
- terminal display can be copied.
- terminal display can be cleared.
- Clear offers Undo, but Undo does not replace data received after the Clear operation.
- Auto-scroll can be toggled ON/OFF manually.
- when Auto-scroll is OFF, new RX does not force the terminal to the bottom.
- communication text is still not persisted by the app.
- Japanese and English help describe the configurable settings and line-ending behavior.
- repository build and standalone verification pass.

### Historical v0.1.0 acceptance criteria

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

Add paused auto-scroll while reading history, new-log indicator, command history, search, proper display-buffer limits, batched rendering, and connection duration. Implemented in v0.5.0.

### v0.6.0 — Logging / Session

Complete long-session TXT and JSONL handling, session-size controls, log limits, explicit session-log reset, and the remaining logging UX. Implemented in v0.6.0.

### v0.7.0 — Command Macros

Add locally stored Text / HEX macros with line-ending settings, editing, deletion, empty states, and desktop/mobile layouts. Implemented in v0.7.0.

### v0.8.0 — Mobile / Compatibility

Finish smartphone interaction, software-keyboard handling, compact settings presentation, control-key ergonomics, supported-browser messaging, Firefox desktop verification, and Android Web Serial experiments on available hardware.

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
- how and when connection settings can be changed,
- how DTR / RTS / BREAK and the control-key row behave,
- that DTR / RTS are not changed automatically on connect,
- how explicit Reconnect behaves after USB reattachment,
- the selectable transmit line endings and Text / HEX send modes,
- Text / HEX receive display, timestamp, and Local echo behavior,
- Copy / Clear / Auto-scroll behavior, including automatic follow pause and Latest,
- terminal search and session-only command history,
- locally stored Text / HEX command macros and their deletion behavior,
- that Clear does not erase the in-memory session log,
- explicit TXT / JSONL save behavior and the approximate 20 MiB log budget,
- the difference between terminal Clear and Clear log,
- that macro definitions are stored only on the current device while communication stays in the browser,
- that no connection starts automatically,
- browser support limitations,
- unexpected disconnect recovery.

Help must be updated in the same change whenever user-visible behavior changes.

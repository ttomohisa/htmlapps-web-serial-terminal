# Changelog

All notable changes to Web Serial Terminal are documented here.

## 0.8.0 - 2026-10-03

### Added

- Added smartphone quick actions for Connection settings, Device control, and Command macros.
- Added Visual Viewport-aware mobile sizing for the terminal and dialogs.
- Added software-keyboard detection that can reduce terminal height and keep focused inputs visible.
- Added environment-specific unsupported guidance for Firefox, Safari/iPhone/iPad, and Android.
- Added an Android caution state when the browser exposes Web Serial but device / transport support may be limited.
- Added a five-column control-key layout and larger touch targets on narrow screens.

### Changed

- Very narrow layouts move Choose device to its own row and let Connect / Disconnect share the next row.
- Connection settings fall back to one column at approximately 390 px and below.
- Mobile text-entry controls use a larger font size to reduce unwanted browser zoom.
- Help and macro dialogs use the current visual viewport height and safe-area insets.
- Programmatic mobile scrolling respects reduced-motion preferences.
- Web Serial capability detection remains authoritative; user-agent detection is used only for better guidance.

### Compatibility

- Firefox Desktop 151+ is reflected in the compatibility guidance.
- Android remains transport- and device-dependent; wired USB serial support is not claimed.
- Environments without `navigator.serial` remain unable to connect.

## 0.7.0 - 2026-10-03

### Added

- Added up to 12 user-defined command macros stored locally on the current browser/device.
- Added Text and HEX macro modes.
- Added per-macro None / LF / CR / CRLF settings for Text sends.
- Added macro create/edit dialog, empty state, count/limit display, and confirmed deletion.
- Added one-tap macro execution while a writable serial connection is active.
- Added single-column macro layout on narrow screens.

### Changed

- Successful macro sends use the normal TX byte counter, display-history, Local echo, and saved-session logging paths.
- Macro execution does not enter the session-only typed-command history.
- Macro management remains available while disconnected, while Run is disabled until connected.
- Invalid HEX macro payloads are rejected before they can be saved.
- A localStorage failure no longer allows the UI to claim that a macro was saved or deleted.

### Privacy

- Only macro definitions are persisted in localStorage.
- Serial RX/TX session records remain in memory and are not added to macro storage.
- Runtime network connections remain blocked by CSP.

## 0.6.0 - 2026-10-02

### Added

- Added separate in-memory histories for terminal display reconstruction and exportable session logging.
- Added an approximate 20 MiB saved-session log memory budget.
- Added a one-time near-limit warning around 16 MiB.
- Added explicit Log recording / warning / stopped status text with approximate usage.
- Added confirmed Clear log behavior that leaves terminal display and RX / TX counters intact.
- Added automatic log-recording resume after Clear log.

### Changed

- When the saved-session log reaches its memory budget, only log recording stops; serial RX/TX, terminal display, and byte counters continue.
- A communication record is never partially stored merely to fit the remaining log budget.
- TXT and JSONL exports are assembled from per-record Blob parts rather than first creating one fully concatenated output string.
- Save failure now produces visible feedback.
- Terminal Clear and Clear log are explicitly separate operations.
- Display-history records use an additional bounded in-memory guard independently from the exportable session log.

### Privacy

- Session records still remain only in page memory until the user explicitly saves a file.
- Clearing the saved-session log does not write or transmit its contents anywhere.
- Runtime network connections remain blocked by CSP.

## 0.5.0 - 2026-10-02

### Added

- Added automatic follow pause when the user scrolls upward.
- Added a new-line counter and Latest action while follow mode is paused.
- Added session-only Arrow Up / Arrow Down command history with draft restoration.
- Added case-insensitive terminal search with previous / next navigation and active-match selection.
- Added live connection duration in HH:MM:SS.
- Added a 50,000-line-break / approximately 5 MiB terminal display budget.

### Changed

- Terminal DOM updates are batched at approximately 32 ms instead of rewriting the full display for every incoming serial chunk.
- New display text is appended to the existing text node when no rebuild or trimming is required.
- Display trimming omits only old visible content; RX / TX counters and the in-memory session log remain intact.
- Search rescans on search interaction and display rebuilds rather than on every RX render batch.
- Scrolling back to the bottom resumes follow mode automatically.

### Privacy

- Command history is session-only and is not written to localStorage.
- Terminal search operates only on the in-memory visible display buffer.
- Runtime network connections remain blocked by CSP.

## 0.4.0 - 2026-10-02

### Added

- Added explicit DTR and RTS control without changing either signal automatically on connect.
- Added a short BREAK pulse control with best-effort de-assertion after errors.
- Added CTS, DSR, DCD, and RI input-signal inspection through getSignals().
- Added ESC, Ctrl+C, Ctrl+D, Ctrl+Z, and Tab one-byte control-key buttons.
- Added control-key TX to the existing byte counters and session log.
- Added an explicit Reconnect state after unexpected USB disconnect.
- Added handling for a matching Web Serial connect event when the selected device is reattached.

### Changed

- Device controls are grouped in a collapsible Device control section.
- DTR / RTS begin in an explicit Unchanged state to avoid implying or forcing an initial output value.
- Unexpected disconnect keeps the selected device, terminal display, and in-memory session while disabling send and device-control actions.
- Reattaching a device never reopens the serial port automatically; the user must press Reconnect.

### Privacy

- Device-control operations communicate only with the selected local serial port.
- Control-key TX is handled like other session TX and is not sent to a Browser Kitty server.
- Runtime network connections remain blocked by CSP.

## 0.3.0 - 2026-10-02

### Added

- Added independent Text / HEX receive-display and transmit modes.
- Added strict HEX parsing before raw-byte transmit.
- Added optional millisecond timestamp display.
- Added optional Local echo with explicit RX / TX records.
- Added RX / TX raw-byte counters.
- Added an in-memory session record model for successful RX and TX.
- Added explicit TXT session-log export.
- Added explicit JSONL export with timestamp, direction, raw HEX bytes, and Text decoded from the exact bytes.

### Changed

- Clear now affects only the terminal display and does not delete the session log or byte counters.
- Terminal rendering preserves conventional raw RX Text by default, while structured RX / TX records appear when Timestamp, Local echo, or HEX display is used.
- Text line endings are disabled for HEX transmit because HEX sends the entered bytes exactly.
- Display and send-mode preferences are stored locally with the existing connection preferences.

### Privacy

- Communication records remain only in page memory until explicitly saved to a local file.
- Communication records are not written to localStorage.
- Runtime network connections remain blocked by CSP.

## 0.2.0 - 2026-10-02

### Added

- Added configurable baud rate presets and a custom positive-integer baud rate.
- Added configurable data bits, stop bits, parity, and hardware flow control.
- Added None / LF / CR / CRLF transmit line endings.
- Added terminal Copy and Clear controls.
- Added safe Undo for Clear without overwriting newer received data.
- Added manual Auto-scroll ON/OFF.
- Added current terminal character count.
- Added local persistence for serial connection preferences.

### Changed

- Connection settings are grouped in a collapsible panel and locked while the port is active.
- In-app help and bilingual documentation now describe the v0.2.0 terminal workflow.

### Privacy

- Communication content is still not persisted.
- Only language and serial connection preferences may be stored locally.
- Runtime network connections remain blocked by CSP.

## 0.1.0 - 2026-10-02

### Added

- Replaced the starter UI with the first Web Serial Terminal implementation.
- Added Web Serial feature and secure-context detection.
- Added explicit serial-device selection using requestPort().
- Added discovery of previously permitted ports using getPorts() without automatic connection.
- Added a fixed 115200 / 8-N-1 connection profile for the first milestone.
- Added streaming UTF-8 receive and text command transmit with LF.
- Added explicit disconnect and basic unexpected-disconnect recovery.
- Added Japanese / English UI and in-app help.
- Added an app-specific Browser Kitty icon using #16624F and white.
- Added the product specification and v0.1.0 to v1.0.0 development plan.

### Privacy

- No runtime third-party dependency.
- Serial communication stays in the browser.
- Runtime network connections remain blocked by CSP.

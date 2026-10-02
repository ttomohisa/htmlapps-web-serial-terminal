# Changelog

All notable changes to Web Serial Terminal are documented here.

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

# Changelog

All notable changes to Web Serial Terminal are documented here.

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

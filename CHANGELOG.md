# Changelog

All notable changes to Web Serial Terminal are documented here.

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

# Offline and Standalone Verification — Web Serial Terminal

1. Build with `build-standalone.bat` or download a verified CI Artifact.
2. Open `dist/index.html` and `dist/index.self-extract.html` directly. Confirm v1.0.0 and identical favicon/header SVGs. The build-generated `web-serial-terminal.html` should be identical to `dist/index.html`.
3. Check both HTML files in a browser with the network disconnected. No CDN, external fonts, API, or analytics requests should be required. CSP includes `connect-src 'none'`.
4. Feature-detect Web Serial: local `file://` permissions differ from HTTPS. An unsupported state is expected when the browser does not expose `navigator.serial`; this is not a failed download.
5. On a supported browser, connect a Raspberry Pi Pico USB CDC device and test Text/LF `PING` → `PONG` and HEX `RAW 4` → `00 01 7F FF`.
6. Test a stream using `STREAM 10` / `STREAM STOP`, scrolling pause/Latest, search, Text/HEX macros, TXT/JSONL export, unplug/replug and explicit Reconnect.
7. Verify that the Help dialog allows internal scrolling but locks background scrolling. Close, Escape and backdrop click must restore the previous page position.
8. Confirm that only user-created macros and preferences persist across reload; serial RX/TX records should not persist.
9. Repeat Japanese and English UI checks, including the mobile 320–390px layout, portrait/landscape, long labels, and software keyboard on real hardware.
10. On GitHub Pages, distinguish the initial HTTPS HTML transfer from serial-data operations. Verify in DevTools Network that user RX/TX content is not transmitted.

USB CDC tests do not establish physical UART baud/parity/stop bits, control-signal electrical behavior, or all browser compatibility. See `docs/RELEASE_VERIFICATION.md`.

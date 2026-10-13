# Web Serial Terminal v1.0.0 release verification

Target: `release/v1.0.0-finalize`. GitHub Actions checks PowerShell preflight, readable/self-extract/root HTML artifacts, CSP, canonical icon, reconnect regression, Help modal scroll lock, EN/JA, TXT/JSONL error feedback, release metadata and images. Cloudflare Preview is deployed/probed on the PR.

## Screenshots

- `assets/screenshot.png`: Japanese desktop
- `assets/screenshot-en.png`: English desktop
- `assets/screenshot-mobile.png`: Japanese simulated mobile viewport
- `assets/screenshot-mobile-en.png`: English simulated mobile viewport

These show the actual built single-HTML app running in Chromium, disconnected and without fabricated device data. Simulated mobile viewport screenshots are **not** physical-device compatibility tests.

## Passed via Raspberry Pi Pico USB CDC (user report, 2026-10-13)

Text PING/PONG, exact 4-byte HEX RAW, 300 consecutive burst lines, 10ms stream follow/search, Text/HEX macros, TXT/JSONL export, persisted macros, explicit reconnect after USB replug, and the approximate 20MiB log memory budget/reset. See `docs/HARDWARE_TEST_PICO.md` for the detailed test protocol.

## Open hardware/browser gates

Real physical UART baud/parity/stop bits, DTR/RTS/BREAK and raw control-key electrical accuracy; Firefox 151+ hardware with its generated site-permission add-on; Android transports and actual mobile keyboard/orientation tests; quantified 30–60 minute high-rate tests; several identical USB devices. v1.0.0 does not imply these were tested.

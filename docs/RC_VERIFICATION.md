# v0.9.0 release candidate verification

Branch: `release/v0.9.0-rc-hardening`. Verify the PR Preview and generated standalone files.

**Status definitions:** Pass = actual tested outcome or explicit user hardware report. Automated = code/CI assertion, not a physical-device pass. Open = requires device/browser/visual review.

## Raspberry Pi Pico USB CDC — user-reported passes (2026-10-13)

| Test | Status | Evidence |
| --- | --- | --- |
| Text TX/RX | Pass | `PING` / `PONG` |
| Exact HEX bytes | Pass | `RAW 4` / `00 01 7F FF` |
| 300-line receive | Pass | `BURST 300 80`, 000000–000299 |
| Continuous RX UI | Pass | `STREAM 10`: pause, count, Latest, search, stop |
| Command macros | Pass | Text and HEX; persisted across reload |
| File logging | Pass | TXT and JSONL exported |
| USB unplug/reconnect | Pass | Revised explicit Reconnect worked |
| Approximate 20 MiB log limit | Pass | Warning, recording stop with continued RX, save and reset |

These results do not prove physical UART framing, all browser support, or exhaustive high-rate performance.

## Automated release candidate checks

| Test | Method | Status |
| --- | --- | --- |
| Standalone builds and CSP | `scripts/check-repository.ps1` | CI |
| USB reconnect regression | `tests/reconnect-regression.mjs` | CI |
| Help modal background lock/restore | `tests/rc-hardening.mjs` | CI |
| EN/JA label | Same tests | CI |
| Local-processing basis | CSP, build flags, no runtime network API, explicit help scope | CI |
| TXT/JSONL serialization failures | Same tests | CI |
| Cloudflare Preview | Deployment and probe | PR CI |
| favicon / header icon | Shared embedded SVG verification | Build |

## Open gates for v1.0.0

- Real browser: scroll page, open Help, ensure only dialog content scrolls; Close/Escape/backdrop restore page position.
- Mobile 320/360/390px portrait/landscape, long device names and macro payloads, on-screen keyboard/dialog sizing.
- Firefox Desktop with Pico USB CDC; Android feature detection/transport; iPhone/iPad unsupported state.
- Real UART with a 3.3 V adapter: baud, data bits, parity, stop bits, and control-key byte accuracy.
- DTR/RTS/BREAK and input signals on hardware that exposes them.
- Busy port error state, invalid HEX, save failures, file:// standalone behavior.
- Quantified 921600-baud and 30–60-minute memory/high-throughput tests.
- DevTools Network audit on the deployed site to distinguish initial HTML transfer from local serial data operations.

## Local-processing claim

"Fully local processing" means serial RX/TX payloads are handled locally between browser and selected device. Hosted HTML still requires an initial HTTPS page download. Logs stay in memory until explicitly exported to local files; settings and authored macros can remain in localStorage. The standalone CSP blocks `connect-src`, and no external runtime API, CDN, analytics, or telemetry calls are implemented.

Mark open gates as passed only after observed testing.

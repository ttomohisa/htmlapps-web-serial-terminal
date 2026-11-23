# Web Serial Terminal v1.1.0 — pre-release verification

Target: v1.1.0 candidate in [PR #14](https://github.com/ttomohisa/htmlapps-web-serial-terminal/pull/14). Reviewed: 2026-11-24.

This record separates source/browser verification from tests that still require physical serial hardware. Passing results for an older build are not treated as v1.1.0 hardware passes.

## Automated verification scope

| Area | Check |
| --- | --- |
| Source and standalone files | PowerShell syntax, readable/self-extracting builds, CSP, embedded icon, artifact consistency |
| Received text | Split CR / LF / CRLF, streamed UTF-8, Text / HEX, RX/TX, local echo |
| Filtering and search | Matching-line view, highlights, literal special characters and Unicode, preserved selections, unread indicator |
| Markers and logs | Notes are not transmitted, TXT / JSONL export, original RX bytes, Clear/Undo |
| Sending and export | Text/HEX payloads, byte count, invalid HEX, editable sanitized download names |
| Layout | Japanese/English, PC, 320–393px phones, short screens, dialogs and horizontal overflow |
| Network | Generated `connect-src 'none'` CSP and zero external HTTP requests in the mocked-port browser tests |

Checks run via GitHub Actions [Validate standalone HTML](../.github/workflows/build-standalone.yml) and [Deploy PR preview](../.github/workflows/preview.yml). After merge, [Pages deployment and Release](../.github/workflows/deploy-pages.yml) reruns browser tests before creating a tag. Consult the checks on the exact commit for pass/fail results.

The four desktop/mobile and Japanese/English README screenshots use **sample data from a mocked serial device**, not a physical hardware test.

## Not verified on v1.1.0 hardware

- Physical-device round trips, sustained receive traffic, unplug and manual reconnect (including Raspberry Pi Pico)
- Real UART baud/data/parity/stop bits and flow control, DTR/RTS/BREAK signals and control bytes
- Firefox site permissions and hardware Web Serial, Android device/transport compatibility, iPhone/iPad guidance on real devices
- Long-duration or high-rate throughput, memory use, scrolling and filter/search behavior
- Physical phone keyboard, rotation, dialogs and touch targets
- Initial HTML transfer versus serial payload traffic in the live hosted page's DevTools
- The **v1.1.0 tag and GitHub Release** (only generated after the PR is merged)

Historical Pico USB CDC results from 2026-10-13 remain in the [older release-candidate record](RC_VERIFICATION.md), but do not replace these pending tests.

## Suggested manual checks

1. Choose a port, review connection settings, connect explicitly and verify that no automatic connection occurs.
2. Send and receive unterminated text, CR, LF and CRLF; compare logical Text lines with HEX/raw bytes.
3. During streaming, search, filter, pause follow, return to Latest and test Clear/Undo.
4. Add timestamped markers, verify nothing is sent to the device, and compare TXT/JSONL output.
5. Change Filename, check safe filename characters and correct TXT/JSONL extensions.
6. Check desktop/mobile, both languages, readable/self-extracting variants, offline usage, saving and errors.

See [hardware instructions](HARDWARE_TEST_PICO.md) and the [offline verification checklist](../VERIFY_OFFLINE.md) for more detail.
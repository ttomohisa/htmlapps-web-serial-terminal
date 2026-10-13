#!/usr/bin/env python3
"""Capture real Web Serial Terminal UI screenshots from verified standalone HTML or a release preview.

Development helper only. Playwright is not bundled with the application.
Usage: python scripts/capture-screenshots.py --url file:///absolute/path/to/dist/index.html
Requires: pip install playwright && python -m playwright install chromium
"""
import argparse
import hashlib
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / "assets"
SHOTS = [
    ("ja", False, "screenshot.png"),
    ("en", False, "screenshot-en.png"),
    ("ja", True, "screenshot-mobile.png"),
    ("en", True, "screenshot-mobile-en.png"),
]


def capture(browser, url: str, lang: str, mobile: bool, filename: str) -> None:
    context = browser.new_context(
        viewport={"width": 390 if mobile else 1440, "height": 844 if mobile else 900},
        device_scale_factor=1,
        is_mobile=mobile,
        has_touch=mobile,
        locale="ja-JP" if lang == "ja" else "en-US",
        color_scheme="light",
        reduced_motion="reduce",
    )
    try:
        page = context.new_page()
        page.goto(url, wait_until="domcontentloaded", timeout=60000)
        page.locator("#versionBadge").wait_for(timeout=20000)
        page.wait_for_function(
            "() => document.querySelector('#versionBadge')?.textContent.trim() === 'v1.0.0'",
            timeout=20000,
        )
        assert page.locator("#chooseButton").count() == 1, "Not the Web Serial Terminal UI"
        assert page.locator("#commandInput").count() == 1, "Missing terminal composer"
        assert page.locator("#terminal").count() == 1, "Missing terminal"
        assert "starter" not in page.title().lower(), "Captured a starter app"
        current = page.evaluate("document.documentElement.lang")
        if current != lang:
            page.locator("#languageButton").click()
            page.wait_for_function(
                "(target) => document.documentElement.lang === target",
                arg=lang,
                timeout=5000,
            )
        if not mobile:
            page.locator("#settingsPanel").evaluate("(element) => { element.open = true; }")
        page.wait_for_timeout(500)
        DEST.mkdir(exist_ok=True)
        out = DEST / filename
        page.screenshot(path=str(out), full_page=True, animations="disabled")
        data = out.read_bytes()
        if not data.startswith(b"\x89PNG\r\n\x1a\n") or len(data) < 15000:
            raise RuntimeError("Invalid or unexpectedly small screenshot: " + str(out))
        print(f"{filename}: {len(data)} bytes, SHA256 {hashlib.sha256(data).hexdigest()}")
    finally:
        context.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True, help="Built standalone file:// or preview URL")
    args = parser.parse_args()
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, args=["--no-sandbox"])
        try:
            for lang, mobile, filename in SHOTS:
                capture(browser, args.url, lang, mobile, filename)
        finally:
            browser.close()


if __name__ == "__main__":
    main()

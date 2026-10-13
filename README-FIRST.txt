Web Serial Terminal v1.0.0
==========================

Browser Kitty's browser-only serial terminal: Text/HEX transmit and receive, command macros, local session logging.

Live app: https://ttomohisa.github.io/htmlapps-web-serial-terminal/

Read README.ja.md (日本語) or README.md (English) to learn the browser and device requirements.

Windows build: build-standalone.bat
Generated artifacts:
  dist/index.html              Readable single HTML
  dist/index.self-extract.html Self-extracting single HTML
  web-serial-terminal.html     Repository-root copy of dist/index.html

Edit src/index.template.html, never generated HTML. The app never connects to a device automatically.

Pico USB CDC test: docs/HARDWARE_TEST_PICO.ja.md
Release verification matrix: docs/RELEASE_VERIFICATION.ja.md

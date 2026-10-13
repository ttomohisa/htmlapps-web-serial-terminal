# Third-Party Notices

Web Serial Terminal v1.0.0 is implemented using native browser APIs, HTML/CSS/JavaScript, the user-approved SVG icon, and system fonts.

**No bundled third-party runtime JavaScript, CSS, or WebAssembly dependencies** are declared by the current `dependencies.json` and `dependencies.lock.json` files.

GitHub Actions and the build-time screenshot capture tool use independently licensed build tools and actions, including Playwright and Chromium, but **none is bundled in or loaded by the distributed application HTML**. The generic Toast and other reusable UI components are included as project source.

If runtime dependencies are added later, record their package names, exact versions, licenses, required copyright notices, and URLs here and in the dependency lockfile before shipping them.

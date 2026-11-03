# HackIt Global

The live [HackIt Global website](https://www.hackit.global) and its [public source](https://github.com/HackIt-Taiwan/hackit-global), with complete prerendered content in `zh-TW`, `zh-HK`, `zh-CN`, and `en`.

The framework-free enhanced view moves from an interactive map through an ASCII/photo transition, a responsive photo and reflection wall, the full nine-paragraph mission and formula, and a join dialog. Only Taiwan is active on the map. Reduced-motion and no-JavaScript views retain the substantive content and full participant stories.

Production verification on 2026-11-03 covered the deployed [application revision `814583ca`](https://github.com/HackIt-Taiwan/hackit-global/commit/814583ca6aa75b3bc7f1cbd951dd96b79e76a7cf), successful [CI](https://github.com/HackIt-Taiwan/hackit-global/actions/runs/41569406033), both HTTPS hostnames, redirects to canonical www, exact delivered content/assets, security headers, and desktop/mobile browser flows. See the dated [release evidence](docs/RELEASE-EVIDENCE.md) for results and limits.

The owner authorized publication of the current curated photographs, participant feedback, and source on 2026-11-03. This approval covers the current curated release, not raw submissions or a blanket reuse license. No code reuse license has been selected. See [content rights](docs/CONTENT-RIGHTS.md) and the [deployment runbook](docs/DEPLOYMENT.md).

## Local setup

Use Node.js **22.12.0 or later**, npm, and Python 3 with `venv` and a compatible binary `lxml` wheel. The Docker runtime uses a digest-pinned Google distroless Node 24 LTS image with no shell or package manager. There are no npm runtime dependencies; npm installs the locked development and test tools.

The locked development tools are Playwright 1.64.1, axe 4.14.0, and Prettier 3.9.10. Build-only `lxml` is pinned to 6.1.3 with accepted artifact hashes.

```sh
python3 -m venv .venv
. .venv/bin/activate
python -m pip install --require-hashes --only-binary=:all: -r requirements.txt
npm ci --ignore-scripts
npm run build
npm test
npx --no-install playwright install chromium webkit
npm run test:browser
npm run test:load
npm run format:check
HOST=127.0.0.1 PORT=3000 npm start
```

Open `http://127.0.0.1:3000/`. `npm run dev` uses the same Node server. Rebuild and restart after source changes; this is not a live-reload server. The process does not automatically load `.env` files. `HOST` and `PORT` configure its listener; canonical origin, visibility, and indexing come from explicit build configuration.

The build composes the maintained template, prerenders four locale routes, fingerprints public scripts/styles/images, and writes `dist/public`, `dist/site-config.json`, and an integrity manifest. `npm start` serves the built public tree. The source-tree fallback is for local development after page composition, not the production artifact.

## Maintained files

| Location                                                                       | Purpose                                                                      |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `source/page.html`, `source/world-map.svg`, `source/wall.html`                 | Base document, geometry, and wall markup                                     |
| `source/static/entry.js`, `entry.css`                                          | Initial paint, resource readiness, and readable failure fallback             |
| `source/static/app.js`, `masonry.js`, `style.css`                              | Motion, map/dialog interaction, measured layout, and presentation            |
| `source/static/i18n.js`                                                        | Four locale dictionaries, complete content, metadata, and language selection |
| `source/mission-locales.json`, `feedback-locales.json`, `wall-provenance.json` | Content regression fixtures; these are not permission records                |
| `source/static/assets/`                                                        | Approved curated site media; downstream reuse terms remain separate          |
| `source/site-config.json`                                                      | Explicit canonical origin, visibility, and indexing                          |
| `scripts/`                                                                     | Composition, prerendering, artifact generation, and regression checks        |
| `server/`                                                                      | Dependency-free Node routing, locale negotiation, and HTTP policies          |
| `tests/`, `playwright.config.mjs`                                              | Browser interaction, content, accessibility, and CSP coverage                |

Do not hand-edit generated `source/static/index.html`, its locale subdirectories, or `dist/`. Keep template copy, runtime dictionaries, reference fixtures, image dimensions, and indexed photo descriptions aligned. Preserve complete mission paragraphs, the formula, all 16 curated quotations, all three full stories, and their rendering labels. Layout accommodates their natural text height.

The wall has 42 photo slots and 40 distinct photographs. Two originals containing visible venue credentials were replaced with safe authentic images from the same events. Their replacements and localized descriptions are regression-checked. Do not restore the originals or include credentials in documentation or evidence.

## Runtime and verification

Server locale precedence is a valid `?lang` override, an explicit locale path, the saved manual-choice cookie, weighted `Accept-Language`, then `zh-TW`. The browser also stores a validated manual choice in local storage. Country metadata is unavailable: `/api/locale` returns `{"country":null}`. Country and forwarded IP/host/protocol headers are not trusted.

Each locale page includes full content, canonical/hreflang links, structured data, and social metadata before JavaScript runs. The Node process serves only allowlisted public files and provides `/healthz`, robots/sitemap responses, compression, validators, and security headers. Public responses use an initial one-day HSTS policy, and HTML includes `no-transform` to preserve native email links and document bytes through the CDN. It has no database, forms backend, visitor request logging, required runtime secrets, or external geolocation service.

`npm test` covers HTTP, prerendered content, locale, ASCII, masonry, scroll, dialog, HTML-parity, and publication boundaries. `npm run test:browser` runs ten cases across desktop Chromium, mobile Chromium, and mobile WebKit, including popover motion reversals, keyboard focus, localized accessibility, and short viewports. Browser downloads are separate from `npm ci --ignore-scripts`. `npm run test:load` makes a bounded 1,200-request, 16-concurrency check against its own local server; client and server share a process, so this is not a capacity benchmark.

The [live release evidence](docs/RELEASE-EVIDENCE.md) records the completed DNS/TLS, redirect, content-fidelity, and browser checks. The [earlier local baseline](docs/RELEASE-READINESS.md) remains historical evidence. Neither establishes physical-device performance, production traffic capacity, continuous availability, search-engine discovery, or rights outside the authorized publication scope. Consult [architecture](docs/ARCHITECTURE.md) for trust boundaries, [deployment](docs/DEPLOYMENT.md) for operations/rollback, [security](SECURITY.md) for reporting and limitations, and [dependency advisories](docs/DEPENDENCY-ADVISORIES.md) for the remaining native-library findings.

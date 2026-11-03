# Architecture

The site separates maintained source, a generated public artifact, and a small Node HTTP runtime. It has no application database, user accounts, npm runtime dependencies, or required external API calls.

## Build and artifact boundary

```text
page.html + world-map.svg + wall.html
                 │ Python standard-library composition
                 ▼
source/static/index.html + i18n.js + site-config.json
                 │ Node payload + Python/lxml locale rendering
                 ▼
source/static/{zh-TW,zh-HK,zh-CN,en}/index.html
                 │ Node fingerprinting and reference rewriting
                 ▼
dist/public/ + dist/site-config.json + dist/build-manifest.json
                 │ Node startup allowlist and in-memory variants
                 ▼
four localized documents and supported public assets
```

`source/build-page.py` composes the maintained markup with Python's standard library. `scripts/build-locales.mjs` reads the trusted locale module in a Node VM and passes structured data to `scripts/render-locales.py`; `lxml` is pinned to 6.1.3 with accepted wheel hashes. This VM is a build helper, not a sandbox for untrusted contributions.

`scripts/build.mjs` reconstructs `dist/`, emits four documents, and names assets with the first 12 hexadecimal characters of their SHA-256 digest. It rewrites document references and fails on unexpected nested asset dependencies. Text assets and HTML receive gzip/Brotli sidecars. The integrity manifest and site configuration remain outside `dist/public`.

Docker's final stage copies only `dist/public`, `dist/site-config.json`, and `server/`. It runs as unprivileged UID/GID `65532:65532` in a digest-pinned Google distroless Node 24 Debian 13 image. The runtime has no shell, package manager, Python, or npm packages. Generated HTML and output directories are ignored by Git.

Map data comes from the verified Natural Earth v5.1.1 input. See [map provenance](MAP-PROVENANCE.md) for its pinned identity and geometry pipeline. The application build consumes maintained SVGs and performs no map-data download or geometry regeneration.

## Browser enhancement

Every locale document already contains the full nine-paragraph mission and formula, 16 curated quotations, 42 photo slots, and three full participant stories. Native details and language links remain usable without JavaScript. Only Taiwan has an active map control.

`entry.js` coordinates resource readiness and a readable failure fallback. `app.js` adds scroll-linked scenes, Canvas2D ASCII framing, map controls, and native dialogs. `masonry.js` measures natural content heights while preserving source reading order. Geometry refreshes are separate from frame updates; transforms carry the scroll motion. Dialog exit animation retains native modal behavior until closing completes. Reduced motion uses the reading view, and restoring motion recomputes map geometry.

`i18n.js` renders using text nodes and DOM construction. Supported locale codes are allowlisted. Manual selection updates the URL, a validated cookie, and local storage; blocked storage does not prevent rendering. Canonical metadata retains the configured public origin, while internal skip links stay on the current host. Browser APIs expose only frontend-required calls, not render counters or mutable layout debug helpers.

## Runtime modules and trust

| Module               | Responsibility                                                                         |
| -------------------- | -------------------------------------------------------------------------------------- |
| `server/config.mjs`  | Select built assets and validate explicit configuration and bind settings              |
| `server/locale.mjs`  | Validate locale/cookie values and negotiate weighted browser languages                 |
| `server/runtime.mjs` | Load allowlisted files, prepare representations, route requests, and set HTTP policies |
| `server/index.mjs`   | Start the process and drain connections on SIGTERM/SIGINT                              |

Templates, locale code, fixtures, media, Dockerfile, and build configuration are trusted release inputs. Review changes before building. User-controlled URLs and headers are never filesystem paths or site configuration. Startup loads only admitted regular files, rejects symlinks, and caps individual source files at 16 MiB and total source bytes at 128 MiB. Compressed variants and process overhead require additional memory.

Requests resolve an already-loaded asset map; they do not select arbitrary filesystem reads. Malformed encoding, traversal/dot segments, unsupported methods, request bodies, and oversized targets/headers are rejected. Source notes, manifests, configuration, dotfiles, directory listings, and unknown extensions are not public routes.

Canonical origin is not derived from request headers. Public exact-apex Host requests redirect to the configured www origin; arbitrary Host values cannot choose an external redirect target. Forwarded host, protocol, IP, and country headers are untrusted. HTTPS enforcement belongs at the separately verified ingress. Public production responses set an initial one-day HSTS policy from explicit configuration; private builds omit HSTS.

## Locale routing

Server precedence is valid `?lang`, explicit locale path, one valid `hackit-locale` cookie, weighted `Accept-Language`, then `zh-TW`. Root/language-override redirects use `no-store` and `Vary: Cookie, Accept-Language`. Explicit locale documents retain their path's language.

Country detection is deliberately absent. `/api/locale` returns `{"country":null}`, and browser-language fallback remains available. Pure country-to-locale helper tests do not establish a trusted runtime country source. Adding one requires verifying the complete proxy chain and header-overwrite behavior first.

## HTTP policies and operations

The Node runtime prepares its own identity/gzip/Brotli variants at startup; build sidecars are not independent public routes. ETags identify each representation. HTML revalidation includes `no-transform` for public and private builds, preserving document bytes and native email links through intermediaries. Verified fingerprinted assets cache for one year with `immutable`; unversioned assets revalidate after at most one hour. Private builds require private revalidation. Health, locale metadata, errors, and negotiated redirects are uncached. Robots and sitemap follow explicit indexing configuration.

Public responses send `Strict-Transport-Security: max-age=86400` without `includeSubDomains` or `preload`. The initial 24-hour lifetime limits persistent browser policy while live HTTPS/redirect behavior is verified; increasing it is a separate deployment decision. Browsers ignore the header over plain HTTP, and no forwarded-protocol header controls it. Keep CDN Origin Cache Control enabled and disable HTML transformations such as email obfuscation, then verify the actual edge document.

CSP limits resources to the same origin, hashes inline script blocks, and denies inline event handlers, eval, embedding, forms, objects, and workers. Inline styles remain permitted because the approved animation and masonry code writes CSSOM properties. Additional headers restrict framing, MIME sniffing, cross-origin resources, referrers, and unnecessary browser capabilities.

The process logs startup/shutdown and generic failures, not visitor URLs, IPs, cookies, or request details. Ingress logging must be configured separately. `/healthz` establishes process liveness, not public reachability or full content correctness. Assets are immutable for a process lifetime: rebuild and restart to change them.

Tests cover HTTP/publication boundaries, complete content, localization, layout, motion, dialogs, and browser accessibility/CSP behavior. The bounded local mixed-request test shares a process between client and server and is not a production-capacity measurement. See [deployment](DEPLOYMENT.md) for monitoring, ingress verification, and rollback.

# Node runtime

Run `npm run build`, then `node server/index.mjs`. Node serves `dist/public` and
reads `dist/site-config.json`; an unbuilt checkout falls back to `source/static`
and `source/site-config.json`. No npm dependencies, secrets, runtime writes, or
external requests are required. `PORT` defaults to 3000 and `HOST` to 0.0.0.0.
Site origin, visibility, and indexing come only from the explicit build config.
The public production origin is `https://www.hackit.global`.

Only the four locale documents, named frontend scripts/styles, and supported
images/fonts inside `assets` are admitted to the in-memory static map at startup.
Source files, JSON notes, dotfiles, unknown extensions, directory listings,
symlinks, malformed paths and traversal requests cannot become static routes.
Startup caps each file at 16 MiB and total source asset bytes at 128 MiB. Assets
are immutable for the process lifetime; rebuild/restart to change content.

The root redirects using explicit `?lang`, explicit locale path, the manual
`hackit-locale` cookie, weighted `Accept-Language`, then `zh-TW`. Country is unknown;
`/api/locale` always returns `{"country":null}`. No IP is read and no country,
forwarded host, forwarded protocol, or forwarded IP header is trusted. Adding a
country integration requires separately verifying its entire proxy chain and
header overwrite rules; there is deliberately no switch that trusts such headers.
Redirects that vary by cookie/language are not cacheable. Localized documents
always honor their explicit locale path. `hackit.global` Host requests redirect
to the configured www production origin; arbitrary Host values cannot change
canonical metadata or create an external redirect.

The server supports only GET and HEAD, rejects request bodies, bounds URL/header
size and connection lifetime, and has no visitor/request/error-detail logging.
`/healthz` is a small uncached liveness check. SIGTERM/SIGINT stop accepting
connections, close idle connections, and allow 10 seconds for active work.
HTTP validators use representation-specific SHA-256 ETags; HTML revalidates,
unversioned public assets cache for at most one hour and revalidate, and private
builds retain private revalidation plus noindex. Gzip and Brotli are prepared at
startup. Range requests receive a complete 200 representation.

CSP hashes shipped inline script blocks, denies inline event handlers/eval,
restricts resources to the same origin, and denies frames, objects, forms and
workers. Inline styles remain permitted because the approved animations and
masonry layout write CSSOM properties. No external fonts/scripts/images are
needed. Framing, MIME sniffing, cross-origin resources, referrer handling, and
unneeded browser capabilities also have explicit response policies.

Coolify should build this Dockerfile, route `https://www.hackit.global` to port
3000, and use `/healthz` for health checks. Terminate HTTPS and configure HTTP
redirects/HSTS at Coolify's verified ingress. The app cannot authenticate incoming
forwarded-protocol headers, so it does not infer HTTPS from them. The container
runs as distroless `nonroot` (UID/GID 65532) with root-owned app files. Recommended runtime
options are a read-only filesystem, dropped Linux capabilities, no-new-privileges,
and resource limits. No persistent volume is needed. The final image excludes
Python, pip, source notes, original templates, build dependencies, shells, npm,
yarn, apt, and other package managers. The explicit entrypoint and health check
execute `/nodejs/bin/node` directly; shell-based container commands are unavailable.

The build stage uses the exact official Node 24 LTS multi-platform index digest
retrieved from Docker Hub's official registry on 2026-11-02. The final stage uses
the official maintained Google `gcr.io/distroless/nodejs24-debian13:nonroot` image,
pinned to its exact multi-platform index digest retrieved from Google's primary
registry on the same date. Security updates require an intentional digest refresh
and rebuild. Builder Debian packages follow the pinned image's distribution
repositories; lxml is separately pinned by version and artifact hashes in
`requirements.txt`. Builder tools and their package trees are absent from the
final image. Review actual image scan findings against the final image, including
the Node binary and its linked libraries; minimal packaging does not establish
that a runtime has no vulnerabilities.

Run `node scripts/test-server.mjs` for local HTTP tests. These checks exercise
runtime behavior on ephemeral loopback ports; they do not establish live Coolify
TLS/redirect/DNS behavior or third-party proxy geolocation delivery.

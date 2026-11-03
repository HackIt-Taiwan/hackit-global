# Security

This is a release candidate. Local hardening and automated checks do not establish a successful production deployment. The owner's authorization dated 2026-11-03 covers publication of the current curated source, photographs, and participant feedback; see [content rights](docs/CONTENT-RIGHTS.md). Live infrastructure verification remains required under the [deployment runbook](docs/DEPLOYMENT.md).

## Report a vulnerability

Contact the maintainers privately through the existing general contact, [hello@hackit.one](mailto:hello@hackit.one), and identify the message as a security report. This is not a dedicated security inbox, and no response-time commitment has been established. Include the affected revision or URL, impact, and minimal reproduction steps. Do not include passwords, access tokens, participant data, or private infrastructure details in a public issue.

The maintainers should acknowledge the report, reproduce it in an isolated environment, agree on disclosure timing with the reporter, and record the fix and verification. No formal supported-version or vulnerability-response policy has yet been adopted; evaluate reports against the current release candidate and any deployed revision.

## Runtime baseline

Development and tests require Node.js 22.12.0 or later. Production uses the Google distroless Node 24 Debian 13 runtime pinned by digest in `Dockerfile`; the reviewed image reported Node 24.22.2. These requirements are not a claim that every later Node release has been tested. Keep the deployed revision and its exact runtime digest in the release record.

## Current protections

- The Node runtime has no npm dependencies. It loads admitted public files into memory at startup, then serves only `GET` and `HEAD` requests. Request bodies, unsupported methods, malformed paths, traversal paths, dotfiles, symlinks, and unlisted source files cannot become static routes. Header, connection, timeout, and asset-size limits are explicit in `server/runtime.mjs`.
- The public file allowlist is separate from trusted build inputs. JSON source records, configuration files, repository metadata, raw research material, and test artifacts are not public routes. Keep credentials out of both source inputs and public assets.
- The Content Security Policy restricts scripts to the same origin and generated hashes for inline data blocks; inline script handlers and `eval` are not allowed. Frames, forms, plugins, workers, and media are disabled. Inline **styles** remain allowed because the approved animation and masonry code writes CSS properties at runtime. This is a deliberate tradeoff, not a policy that prohibits every form of inline content.
- Responses also set MIME-sniffing, framing, referrer, permissions, and cross-origin protections. HTML revalidates and includes `no-transform` to preserve document bytes and native email links through intermediaries. Verified fingerprinted assets can use immutable caching. Locale redirects, errors, `/healthz`, and `/api/locale` are not cacheable.
- The server does not trust forwarded host, protocol, IP, or country headers. `/api/locale` returns `{"country":null}`. Locale selection uses validated URL values, the locale preference cookie, browser language, and a fallback; it does not call an external geolocation service.
- The frontend uses text insertion for localized content and validates locale choices. Its only application preference storage is the locale value. The application has no account, upload, payment, or message-submission endpoint, and makes no runtime credential lookup.
- The Docker runtime runs as unprivileged UID/GID `65532:65532` with root-owned application files. Its Google distroless Node 24 Debian 13 base is pinned by digest and excludes shells, npm, and OS package managers. Build-only `lxml` is pinned to `6.1.3` with hashes; development tools are locked in `package-lock.json`. Use `npm ci --ignore-scripts` and the documented hash-checked Python installation procedure.

The remaining native-library findings and their current fix/reachability status are recorded in the [dependency advisory assessment](docs/DEPENDENCY-ADVISORIES.md). Scanner severity counts are source-specific; no finding was suppressed.

## Deployment responsibilities

TLS termination, HTTPS redirects, edge request limits, and network access controls belong to the verified reverse proxy or hosting layer. Public production responses send `Strict-Transport-Security: max-age=86400`; private builds omit it. The initial 24-hour lifetime limits rollback persistence while live HTTPS and redirects are verified, without `includeSubDomains` or `preload` commitments. Browsers ignore HSTS over plain HTTP. The application selects this policy from explicit public configuration, never visitor-supplied forwarding headers. Verify the live edge response before increasing the policy.

Keep CDN body transformations disabled. In particular, disable Cloudflare Email Address Obfuscation and keep Origin Cache Control enabled so HTML `no-transform` is honored. Verify the actual document retains native `mailto:` links, original bytes, and the expected script set; an origin unit test cannot establish CDN behavior. See [Cloudflare's documented exclusion](https://developers.cloudflare.com/waf/tools/scrape-shield/email-address-obfuscation/#troubleshoot-email-obfuscation) and [cache-directive behavior](https://developers.cloudflare.com/cache/concepts/cache-control/#directives).

The `visibility` and `indexing` build settings control metadata, caching, and crawling behavior. They do not authenticate visitors. A private preview needs access control at the hosting layer; `noindex` and `robots.txt` do not restrict access. The checked-in build configuration selects the authorized public origin `https://www.hackit.global` with indexing enabled. The publication authorization does not establish a successful live deployment; verify the deployed revision and infrastructure separately.

Keep deployment credentials in the hosting provider's secret store. The site itself requires no application secrets. Do not place credentials in Git, build arguments, public URLs, generated artifacts, logs, screenshots, or support reports. Review proxy and platform logging separately: the application does not log visitor requests, but infrastructure may do so.

Dependency pins make inputs reviewable; they do not guarantee continued safety. Review advisories and refresh the Node image digest, Python hashes, and development lockfile deliberately, then rebuild and rerun the documented checks. Preserve a verified previous artifact for rollback. Connection limits and compression are not evidence of capacity under production traffic; monitor and test the actual deployment without promising an unmeasured traffic level.

## Media and incident handling

Image metadata removal does not remove information visible in pixels. Two credential-bearing event-photo originals were replaced with safe authentic photos from the same respective events; do not restore those originals from an archive or old revision. Keep review evidence private and never reproduce the credential values in documentation.

If sensitive material is published, restrict access or roll back first, preserve only the minimum private evidence needed to investigate, remove it from artifacts and caches, and arrange credential rotation with the responsible owner when relevant. Review repository history and downstream copies before republishing. See the [deployment runbook](docs/DEPLOYMENT.md) for release and rollback steps.

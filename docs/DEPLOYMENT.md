# Deployment and rollback

This runbook describes the candidate deployment to `https://www.hackit.global`. It records no live deployment success. On 2026-11-03, the owner authorized official website deployment and public source publication of the current curated content, including photographs and participant feedback. Final revision/CI checks and public DNS/TLS/ingress verification remain operational release gates. Publication approval does not grant a blanket downstream reuse license.

## Prepare a candidate

1. Publish the current curated release within the owner's recorded [publication scope](CONTENT-RIGHTS.md) to `HackIt-Taiwan/hackit-global`. Exclude raw feedback, consent records, private provenance, credentials, and internal QA artifacts. Retain third-party notices; do not add a reuse license by assumption.
2. Review `source/site-config.json`. Production requires origin `https://www.hackit.global`, explicit `visibility: "public"`, and an intentional indexing setting. For private staging use an HTTPS staging origin, `visibility: "private"`, and `indexing: false`, then rebuild. These settings are not authentication; restrict staging access at the ingress.
3. Install and verify from the repository root:

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
   ```

4. Record the source revision, lockfile, manifest, site configuration, final test results, and candidate image digest. Keep rights records and private infrastructure details in controlled records, not public source or build artifacts.

The suites cover HTTP routing/security, complete prerendered content, locales, ASCII, masonry, scroll timing, dialog races, HTML parity, publication boundaries, and 24 browser cases across three projects. Record final outcomes rather than inferring them from this document. The 1,200-request, 16-concurrency local check shares a process between client and server; it is not production capacity evidence. Physical-device and realistic traffic checks remain separate.

## Build and run the container

```sh
docker build -t hackit-global:release-candidate .
docker run --rm --name hackit-global-candidate \
  --read-only --cap-drop=ALL --security-opt=no-new-privileges \
  --memory=256m --cpus=1 \
  -p 127.0.0.1:3000:3000 hackit-global:release-candidate
```

In another terminal:

```sh
curl --fail --silent --show-error http://127.0.0.1:3000/healthz
curl --head http://127.0.0.1:3000/en/
```

Example resource limits are a starting point, not demonstrated capacity. Measure startup/steady-state memory, CPU, and latency before choosing production limits. No persistent volume, migration, API key, or application secret is required. The image runs Node as a non-root user with root-owned files. Its exec-form Node health check uses `/healthz`; shutdown permits ten seconds of connection draining. Preserve the Dockerfile health check. A platform override that invokes a shell, curl, or wget will fail in the distroless runtime.

The Dockerfile pins an official Node 24 build image and a Google distroless Node 24 Debian 13 non-root runtime by digest. The reviewed runtime reported Node 24.22.2. The final image has no shell, npm, or OS package manager. Python/lxml exists only in the build stage. Debian build packages still come from distribution repositories. Refresh base/dependency pins deliberately, rebuild, and repeat validation for security updates. Local development/tests support Node 22.12.0 or later.

## Create an isolated deployment

In the authorized Coolify environment, create a **new project and application**. Do not repurpose another project's application, network, volume, or domain binding.

Configure the application to build this Dockerfile, listen on container port `3000`, and use `/healthz`. Pass optional listener variables through the host environment; the process does not load `.env` files. Keep deployment/registry credentials in the hosting secret store, never in source, build arguments, URLs, screenshots, or archives.

Route www to this new application only after rechecking current DNS records and domain bindings. Read-only discovery is not a reservation: repeat conflict checks immediately before changes. Record prior DNS values and the previous image/configuration before cutover. Keep private IDs, addresses, and credentials out of this runbook.

The verified ingress must terminate TLS and redirect HTTP to HTTPS. Public production responses include the initial HSTS policy `max-age=86400`; private builds omit it. The 24-hour lifetime limits rollback persistence while live HTTPS and redirect behavior is verified, and deliberately excludes `includeSubDomains` and `preload`. Browsers ignore HSTS received over plain HTTP; Node chooses this policy from explicit configuration, without trusting forwarded headers. Review a longer or broader policy only after verification. Configure apex-to-www without a loop; the app already redirects exact apex Host requests to the configured www origin. Restrict direct origin access where practical and apply ingress request/connection limits.

## Verify the public route

After an authorized deployment, collect evidence from outside the origin network:

- DNS reaches the intended ingress, the certificate covers the hostname, and HTTP redirects to HTTPS without loops.
- `/healthz` returns 200; `/zh-TW/`, `/zh-HK/`, `/zh-CN/`, and `/en/` return matching full documents and canonical metadata.
- Root negotiation honors manual cookies and weighted browser language; `?lang` and explicit locale paths take precedence. Spoofed country/forwarded headers do not create country metadata.
- Resources and CSP load correctly. Map controls, full stories, keyboard dialogs, reduced motion, and no-JavaScript reading work on desktop and physical mobile devices.
- Headers, compression, validators, robots, and sitemap match the intended settings. Verify public HSTS is exactly `max-age=86400`, with no subdomain/preload directives, and HTML includes `no-transform`. Source/config/fixture paths return 404.
- Contact/Taiwan links reach their destinations. The approved publication scope, rollback ownership, and operational alerts are recorded.

Keep failed checks as unresolved blockers. Local tests do not replace these live checks.

## Cache and monitor

Node works without a CDN. CDN caching, replication, load balancing, and monitoring are operational choices to configure and verify, not capabilities proven by this handoff.

For a CDN, preserve `Content-Encoding`, representation ETags, and `Vary: Accept-Encoding`. Honor HTML revalidation and use immutable caching only for verified fingerprinted assets. Bypass cache for locale-negotiation redirects (`/`, `/index.html`, valid `?lang`), `/api/locale`, `/healthz`, and errors. Respect private/no-store responses; never reuse a manual-choice redirect across visitors. Verify using different cookies and language headers.

HTML also includes `Cache-Control: no-transform`. For Cloudflare, keep Origin Cache Control enabled and explicitly turn off Email Address Obfuscation for the site. Its [email-obfuscation documentation](https://developers.cloudflare.com/waf/tools/scrape-shield/email-address-obfuscation/#troubleshoot-email-obfuscation) lists `no-transform` as an exclusion, while the [cache-control table](https://developers.cloudflare.com/cache/concepts/cache-control/#directives) allows transformations when Origin Cache Control is disabled. After redeploying, compare delivered locale HTML with the build, check raw native `mailto:` links without JavaScript, and confirm no injected email-decoding scripts or `/cdn-cgi/l/email-protection` links remain. An edge setting alone is not proof of byte preservation.

Alert on external health/locale failures, elevated 5xx rates, latency, restarts, memory/CPU pressure, certificate expiry, and cache/origin bandwidth. Minimize ingress logging; the app does not log visitors. Test alerts and escalation ownership before launch. Measure realistic payloads/concurrency before sizing instances or making traffic-capacity claims.

## Roll back

1. Select the last known-good **image digest and matching site configuration** from the release record. Stop automatic promotion of the failing candidate.
2. Redeploy that immutable image to the dedicated application, leaving unrelated services untouched. No application database or persistent-state migration needs reversal.
3. Drain the old process and confirm replacement health before routing traffic.
4. Revalidate health, four locale routes, assets, headers, links, and keyboard dialogs externally. Revalidate/purge cached HTML or redirects where needed; never serve changed bytes under old fingerprinted URLs.
5. Restore recorded previous DNS/ingress bindings only if necessary. Account for DNS TTL, then verify TLS and redirects again.
6. Record the trigger, candidate, rollback outcome, and follow-up actions without visitor data or secrets. Fix and reproduce the regression before another promotion.

# Public release evidence

Verification date: **2026-11-03 UTC**. This dated record describes the verified application revision; subsequent documentation-only revisions may follow.

## Source, CI, and deployment

- Public repository: [HackIt-Taiwan/hackit-global](https://github.com/HackIt-Taiwan/hackit-global).
- Verified application revision: [`814583ca6aa75b3bc7f1cbd951dd96b79e76a7cf`](https://github.com/HackIt-Taiwan/hackit-global/commit/814583ca6aa75b3bc7f1cbd951dd96b79e76a7cf).
- [CI run 41569406033](https://github.com/HackIt-Taiwan/hackit-global/actions/runs/41569406033) completed successfully, including all configured steps.
- The isolated Coolify v4.5.3 service was healthy at **03:06:01 UTC**. It serves [www.hackit.global](https://www.hackit.global), the canonical public origin; the apex hostname also has a valid HTTPS certificate.

The owner authorized publication of the current curated source, photographs, and participant feedback on 2026-11-03. This does not grant a blanket downstream reuse license or authorize publication of raw submissions. No code reuse license has been invented. See [content rights](CONTENT-RIGHTS.md).

## Public routing and TLS

Normal DNS resolution and certificate validation were used. The final redirect probe completed at **03:07:16 UTC**:

| Request                                        | Observed result                                                                   |
| ---------------------------------------------- | --------------------------------------------------------------------------------- |
| HTTP www, `/en/?ref=launch%20check&keep=a%2Fb` | `301` to HTTPS www with the tested path/query retained; one redirect, final `200` |
| HTTP apex, same path/query                     | `301` to HTTPS apex, then `301` to HTTPS www; two redirects, final `200`, no loop |
| HTTPS apex, same path/query                    | `301` to HTTPS www with the tested path/query retained                            |
| HTTPS apex `/healthz`                          | `301` to www `/healthz`                                                           |

The proxy normalizes the percent-encoded unreserved path `/%65n/` to `/en/`. Reserved query encoding `%2F` remained intact in the tested requests. These observations do not establish arbitrary raw-URI byte preservation.

Cloudflare **Full (strict)** encryption and minimum TLS **1.2** were verified active. The www application responses delivered `Strict-Transport-Security: max-age=86400`, without `includeSubDomains` or `preload`; HTML delivered `Cache-Control` with `no-transform`. The one-day HSTS lifetime is the documented initial policy, not a long-term preload commitment.

## Delivered content and browser behavior

Live checks used desktop Chromium, mobile Chromium, and mobile WebKit with normal certificate validation. Initial Chromium checks used an explicit public DNS answer while the local resolver retained an earlier negative cache entry. Final HTML checks and the WebKit retry used normal system DNS after that entry expired.

| Area                  | Verified result                                                                                                      |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Four complete locales | Exact nine-paragraph mission, 16 curated quotations, three full stories, and 42 photo slots per locale               |
| Content integrity     | All four delivered locale HTML files and all 55 fingerprinted assets matched the build manifest: 59 public files     |
| Native contact links  | Four native `mailto:` links per locale; no injected Cloudflare email decoder or email-protection links               |
| Interaction           | Map keyboard controls, mobile map pan, modal focus/close behavior, reduced motion, and no-JavaScript reading passed  |
| Search metadata       | Canonical www URLs, hreflang and x-default, truthful Organization/WebPage/WebSite schema, robots, and sitemap passed |

Nine screenshots support the private visual review and are excluded from public source. Browser emulation and desktop automation are not physical-device measurements.

An earlier live check detected CDN email obfuscation rewriting native contact links and injecting a decoding script. The release added origin HTML `no-transform`; final delivered HTML matched the manifest. The Cloudflare Email Address Obfuscation setting itself was not changed. This records the observed exclusion behavior, not a claim that every CDN transformation setting was disabled.

Public indexing directives are enabled. One default Python HTTP-client user agent received Cloudflare error `1010`, while browser-style verification requests returned `200`. Browser Integrity Check was observed enabled, and the two sampled block events at the diagnostic request times were attributed to that service. Cloudflare [documents error 1010 as browser-signature denial](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/error-1010/). Verified search-crawler access and actual search-engine discovery remain unproven. No security controls were weakened to accommodate the blocked client.

## Runtime and security evidence

The final HTTP/security regression suite passed **443 assertions**. The core content, locale, layout, motion, ASCII, dialog, publication-boundary, and HTML-parity checks passed. Earlier local browser, concurrency, container, and performance measurements are retained as the [historical local baseline](RELEASE-READINESS.md), not relabeled as production-capacity measurements.

Effective production configuration was inspected: non-root UID/GID `65532:65532`, read-only filesystem, all Linux capabilities dropped, no-new-privileges, PID limit 64, memory limit 512 MiB, and one CPU. The service had no host-published application ports or persistent mounts and reported healthy. These are observed controls, not proof of continuous availability or a tested failover architecture.

The verified local runtime image's fresh residual scan retained **0 Critical, 0 High, 36 Medium, and 8 Low scanner rows**, with no suppression. Production uses the same pinned runtime base; the running production image was not separately rescanned. The 44 package/CVE rows represent 29 unique CVEs. Severity differs by authority: two scanner-Medium advisories have upstream/CNA High scores. All native-library disclosures, supported-fix availability, and conditional reachability limits remain in the [dependency advisory assessment](DEPENDENCY-ADVISORIES.md). Zero scanner High/Critical rows does not mean every dependency is fixed or every native path is unreachable.

## Remaining limits

- The bounded local concurrency check does not establish large-scale production capacity, sustained latency, or a ten-million-user traffic capability.
- Physical-device behavior, continuous uptime, operational alert delivery, failover, direct-origin restrictions, and a production rollback exercise are separate operational checks.
- Robots and metadata checks do not establish successful crawler access, search listing, or ranking.
- Country inference remains unavailable; explicit/manual locale preferences and browser-language fallback work without processing visitor IPs in the application.

Private infrastructure identifiers, raw scan reports, and QA captures are excluded from this public record. See [deployment and rollback](DEPLOYMENT.md), [security](../SECURITY.md), and [architecture](ARCHITECTURE.md) for procedures and trust boundaries.

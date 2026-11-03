# Release readiness evidence

Local verification baseline: 2026-11-02. Publication authorization updated: 2026-11-03. This document records a release candidate, not a completed production launch. The owner authorized public source publication with the current curated photographs and participant feedback, together with official website deployment. The intended repository is `HackIt-Taiwan/hackit-global`; remote revision/CI and live deployment evidence must be recorded when verified. No blanket reuse license is granted.

## Resolved findings

- Replaced two event photographs that exposed venue credentials in their pixels with safe authentic images from the same respective events. Source, fixtures, generated output, and the final image use the replacements. Credential values are not reproduced.
- Replaced the preview-only hosting adapter with a dependency-free Node runtime for Coolify. It rejects malformed/traversal paths, source files, request bodies, unsupported methods, and oversized requests; it minimizes logs and handles graceful shutdown.
- Added a tested CSP and security headers. Executable entry code and resource handlers are external files; localized DOM writes use text nodes. Untrusted location and forwarding headers are ignored.
- Corrected keyboard modal behavior, focus cycling in WebKit, reduced-motion restoration, contrast, canonical-origin handling, internal skip links, image dimensions, and English display-heading spacing/wrapping. Approved animation and complete historical content remain.
- Updated and hash-pinned build-only lxml 6.1.3, locked test tools, pinned official build/runtime image digests, and prepared CI with immutable GitHub Action commits and read-only permissions.
- Moved the runtime to Google distroless Node 24 Debian 13 with UID/GID 65532, no shell/package manager, and an exec-form health check. This removed the unused global npm and OS tools responsible for the initial high-severity package findings.
- Added a strictly lossless WebP logo with identical decoded RGBA and dimensions. It is 642,036 bytes versus the original PNG's 989,609 bytes. The PNG remains for social metadata; normal page loads use WebP.

## Completed verification

| Check                              | Result                                                                                                                                 |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Actual HTTP/security/routing suite | 381 assertions passed on the host and inside the final Node 24 image                                                                   |
| Prerendered complete-content suite | 112 complete-content assertions passed across four locales                                                                             |
| Locale/fixture suite               | 1,176 assertions passed, including all nine mission paragraphs, 16 curated quotes, three full stories, and photo descriptions          |
| Layout/motion/ASCII/dialog suites  | Passed natural-height masonry, scroll displacement, canvas sample safety, dialog races, and HTML parity regressions                    |
| Browser integration                | All 24 cases passed across desktop Chromium, mobile Chromium, and mobile WebKit                                                        |
| Automated accessibility/CSP        | No tested WCAG violations or CSP violations in the covered hero, reading, and dialog flows                                             |
| Hardened container smoke           | 31 checks passed, including non-root/read-only execution, capabilities, health, graceful shutdown, and every public-file hash          |
| npm advisory scan                  | Zero reported advisories for the locked graph; zero npm runtime dependencies                                                           |
| Container scan                     | Trivy 0.76.1: 0 Critical, 0 High, 36 Medium, 8 Low, 0 Unknown rows; no ignore filters or severity suppression                          |
| Bounded local concurrency          | 1,200 mixed requests, 16 concurrent clients, zero failures; client/server shared one process                                           |
| Visual QA                          | Six desktop/mobile hero, wall, and mission captures inspected; no blocking layout issue observed                                       |
| Source review                      | Heuristic secret/private-reference scans and asset metadata/pixel review completed; this is not a universal secret-detection guarantee |

The tested local image ID is `sha256:21168cc2dd960082facdfb3eb1a5f15ae9f947e94148ed00f05d0199089ad545`, tagged `hackit-global:local-verified`. This identifies the local verification artifact, not a verified registry or deployment revision. It contains 59 uncompressed public files totaling 4,927,240 bytes. Their full SHA-256 manifest is emitted outside the public tree during build.

The scanner database was internally updated at 2026-11-02 13:15:56 UTC. The remaining 44 Medium/Low package/CVE rows represent 29 unique CVEs, with no fixed versions recorded in that database snapshot. Continue monitoring and refresh the pinned base when fixes arrive. A manifest scan does not comprehensively inspect Node's statically embedded dependencies; actual Node 24.22.2 and its embedded-library versions were separately inspected against current official release information. Zero High/Critical rows is not an absolute security guarantee. The [residual advisory assessment](DEPENDENCY-ADVISORIES.md) records current fix availability and observed application prerequisites for all 29 CVEs, including two scanner-Medium advisories whose upstream scores are High. No supported stable upgrade was available; all raw rows remain visible.

## Local performance scope

Three cold-browser samples were measured per profile against an ephemeral loopback server. Desktop medians were 92 ms FCP / 132 ms LCP; mobile viewport medians were 88 ms / 88 ms. A Chromium mobile profile with 4x CPU slowdown, 80 ms latency, and 10 Mbps download measured 272 ms FCP / 1,460 ms LCP. Its initial transfer was 1.565 MB, down 18.17%; measured emulated LCP improved 16.48% after the logo change.

These are local laboratory observations, not physical-device, production-CDN, availability, or user-capacity measurements. The LCP element is the small brand image, not the entire decorative map. A 107 ms startup task remained under CPU emulation. No navigation layout shifts, external requests, failed requests, or page errors were observed in those samples. Browser PNG/WebP alpha rounding differs by at most 1/255 per channel on the tested opaque backgrounds despite exact raw decoded RGBA equality.

## Remaining launch gates

1. Verify that the source release matches the authorized current curated content and excludes raw feedback, private consent/provenance records, credentials, and internal QA. The owner's publication approval is recorded in [content rights](CONTENT-RIGHTS.md); no broad reuse license has been invented.
2. Publish the authorized repository and create the separate Coolify application, verify remote CI/build/deployed revision, and configure only the intended domain after repeating conflict checks. Record the resulting repository revision and public verification evidence without private service identifiers.
3. Verify external DNS, HTTPS certificate/redirects/HSTS, actual CDN/cache behavior, origin controls, links, all locale flows, and rollback on `www.hackit.global`.
4. Establish operational alerting, incident ownership, resource limits, cache policy, realistic traffic measurements, and any replication/availability requirements. A single shared origin and local concurrency smoke do not prove readiness for millions of users.
5. Country inference remains deliberately unavailable until a trusted proxy chain is established. Browser language and explicit/manual preferences work; no visitor IP is processed by the application.

Map-data provenance is resolved: Natural Earth 1:110m Admin-0 Countries v5.1.1 is identified by a pinned public revision and exact source checksum. Independent regeneration matched all 176 non-Antarctica feature paths in both maintained and shipped SVGs. The original download timestamp is unknown, and current accessibility/style/viewport markup differs from the historical output; see [map provenance](MAP-PROVENANCE.md) and [third-party notices](../THIRD_PARTY_NOTICES.md). The owner's separate 2026-11-03 approval covers publication of the current curated photography and participant content; third-party terms and downstream reuse restrictions remain separate.

See [deployment and rollback](DEPLOYMENT.md), [security](../SECURITY.md), [architecture](ARCHITECTURE.md), and [content rights](CONTENT-RIGHTS.md) for the corresponding boundaries and procedures. Private raw scan reports and QA captures are excluded from public source and deployment artifacts.

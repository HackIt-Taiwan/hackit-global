# Content and publication rights

On 2026-11-03, the owner authorized public publication of the current curated website source, included photographs, and participant feedback, including source download through the intended official repository `HackIt-Taiwan/hackit-global`. This records the owner's publication decision; it is not independent verification of every underlying permission or a blanket reuse license for downstream users.

The current checkout contains the actual website content within that authorized scope. It remains a release candidate; this document does not claim a successful live deployment. No blanket license is granted by this repository, no code license has been selected, and no `LICENSE` file has been added. The authorization is distinct from the build setting that enables public indexing.

## Included material

| Material                                            | Source records                                                                 | Current publication status                                                                                                                                                                                                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| HackIt name, logo, visual identity, and event names | Templates, styles, and `source/static/assets/`                                 | Approved website identity; no separate reusable brand license is granted here.                                                                                                                                                                                                 |
| Event photographs                                   | `source/wall.html`, `source/wall-provenance.json`, and `source/static/assets/` | Owner-authorized for the current website and public source download on 2026-11-03. The wall has 42 slots containing 40 distinct photographs; no general photo reuse license is granted here.                                                                                   |
| Participant feedback                                | `source/feedback-locales.json` and embedded frontend content                   | Sixteen curated quotations and three full stories, with four locale renderings. The current curated renderings are authorized for website and public source publication; raw feedback and consent records remain excluded.                                                     |
| Mission and formula                                 | `source/mission-locales.json`, templates, and `source/static/i18n.js`          | The complete nine-paragraph mission and formula remain included in the authorized curated source. Approved wording and locale renderings are preserved; no blanket reuse grant is made.                                                                                        |
| Geographic data                                     | `source/world-map.svg` and the generated map asset                             | Natural Earth v5.1.1 source identity and geometry correspondence are verified in [map provenance](MAP-PROVENANCE.md). Its [official terms](https://www.naturalearthdata.com/about/terms-of-use/) place the data in the public domain; this does not cover other site material. |
| Application code                                    | JavaScript, Python, CSS, HTML templates, build scripts, and runtime modules    | Current source publication is owner-authorized. No reuse license has been selected, so no LICENSE file is added by assumption. Third-party package and container terms remain separate.                                                                                        |

The supported locales are `zh-TW`, `zh-HK`, `zh-CN`, and `en`; only the Taiwan map destination is active. Locale support does not imply additional local teams or publication permissions.

The content fixtures check what the site displays. They are not a rights registry. A source reference, accessible event album, event attendance, private repository, or permission to review a local handoff does not by itself establish permission to redistribute its contents.

## Preserve the approved content

Keep complete participant quotations, all three full stories, the nine mission paragraphs, and the formula intact. Preserve the existing distinctions between original excerpts, localized or translated text, and editorial story titles and summaries. Photographs illustrate events; they do not identify quotation authors unless separately documented and authorized.

Two photographs containing visible credentials were replaced with safe authentic photographs from the same respective events. The replacements intentionally reuse existing photos, producing 40 distinct photographs across 42 wall slots. Their descriptions were updated in all four locales. Do not restore the credential-bearing originals, and do not copy credential values into a rights ledger or issue. Removing image metadata does not clear information visible in the photograph itself.

## Publication scope and future changes

1. Keep the dated owner authorization and existing permission records privately. Do not place raw feedback, participant consent records, or private source provenance in Git.
2. Publish the current curated source and media within the approved scope. Public access and source download do not grant downstream users unrestricted rights to branding, photographs, or participant text.
3. If the owner selects a code reuse license, define its scope explicitly. Otherwise omit a license rather than invent one. Do not automatically extend a code license to branding, photographs, participant testimony, mission text, or third-party material.
4. Review permissions for newly added material, expanded publication channels, or broader reuse requests separately. If a future distribution needs code and content separated, prepare clearly labelled replacement content and review templates, dictionaries, generated pages, container images, and archives as well as image files. That separation has **not** been implemented in this checkout and is not required by the current owner authorization.
5. Review the final artifact and repository history and retain required third-party notices. A successful build or test run is evidence of behavior, not an additional grant of rights.

For a removal request, contact the maintainers through [hello@hackit.one](mailto:hello@hackit.one), the site's general contact. Identify the affected work and requested action without submitting private credentials or unnecessary personal information. Follow the [security guidance](../SECURITY.md) and [deployment runbook](DEPLOYMENT.md) if removal also involves sensitive material or a live rollback.

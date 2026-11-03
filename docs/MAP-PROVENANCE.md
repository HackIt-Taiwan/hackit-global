# Map data and geometry provenance

The maintained map uses **Natural Earth 1:110m Admin-0 Countries, version 5.1.1**. Its GeoJSON has **177 features** in **CRS84** longitude/latitude coordinates. Natural Earth's [official terms](https://www.naturalearthdata.com/about/terms-of-use/) place the geographic data in the public domain; this does not license branding, photographs, participant statements, or other site content.

## Pinned source identity

- Public repository revision: `9380cca83db5f9aef52d5e762765100745f84b27`.
- [Exact GeoJSON](https://raw.githubusercontent.com/nvkelso/natural-earth-vector/9380cca83db5f9aef52d5e762765100745f84b27/geojson/ne_110m_admin_0_countries.geojson).
- [Version record](https://raw.githubusercontent.com/nvkelso/natural-earth-vector/9380cca83db5f9aef52d5e762765100745f84b27/110m_cultural/ne_110m_admin_0_countries.VERSION.txt): `5.1.1`.
- GeoJSON size: **838,726 bytes**.
- GeoJSON SHA-256: `6866c877d39cba9c357620878839b336d569f8c662d3cfab4cb1dbe2d39c977f`.

An independent provenance check established byte identity between this pinned public GeoJSON and the original map input. The original download timestamp is unknown; the conclusion is based on verified content identity, not a reconstructed timestamp.

## Verified geometry pipeline

The recovered map pipeline uses Equal Earth projection with coefficients `1.340264`, `-0.081106`, `0.000893`, and `0.003796`, a scale of `265`, an SVG origin of `(720, 365)`, and inverted SVG y coordinates. Polygon paths use two-decimal `M`, `L`, and `Z` coordinates. Antarctica is excluded from this illustrative view.

Independent regeneration matched every one of the **176 non-Antarctica feature paths** against both `source/world-map.svg` and the shipped `source/static/assets/world-map.svg`. Taiwan is rendered as a separate highlight, with its interaction point derived from longitude/latitude `(120.97, 23.7)`. Only the Taiwan destination is active; the underlying geographic geometry remains intact.

This verification concerns the data-derived feature paths. Current accessibility attributes, styling, and viewport configuration differ from the historical generator output, so complete SVG-file byte identity is not claimed.

## Maintenance boundary

The normal application build uses the maintained SVG files; it does not download the dataset or regenerate the map. A standalone map generator is not included in this candidate. The pinned source, checksum, projection parameters, and verified path correspondence document the established pipeline without changing current presentation or adding a network build dependency.

For a geographic update, verify the intended dataset version and bytes, compare feature paths separately from presentation/accessibility markup, and preserve consistent highlight/interaction coordinates. Review both maintained and shipped SVGs. These map-data rights are separate from the owner-authorized publication of current curated photography and participant content described in [content rights](CONTENT-RIGHTS.md); no blanket downstream reuse license is granted.

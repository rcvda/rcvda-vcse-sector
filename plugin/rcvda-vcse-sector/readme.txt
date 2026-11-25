=== RCVDA VCSE Sector ===
Contributors: RCVDA
Requires at least: 6.0
Tested up to: 6.6
Stable tag: 0.5.15
License: GPLv2 or later

"State of the Sector" — a living, weekly-updated dashboard of the registered VCSE sector size across the five Tees Valley authorities.

== Description ==
Renders the Tees Valley registered-VCSE sector as a weekly-updated time series via the
[rcvda_vcse_sector] shortcode: KPI tiles, two over-time line charts (sector size by authority,
and the four segments — charities/CIOs, CICs, registered societies, CASCs) and a latest-snapshot
matrix. The headline measure is "based-in" (the organisation's registered office is in the borough).

Data is read live from the public open-data repo rcvda/tees-valley-vcse-sector over the jsDelivr CDN,
with a bundled copy inside the plugin as an automatic fallback. The repo is rebuilt weekly from Find
That Charity by a GitHub Actions runner, so new points appear without any change to the site.

Borough colours come from rcvda-core's shared Tees Valley colour tokens (so the scale is consistent
estate-wide and tracks dark mode). No external JavaScript libraries are used.

== Shortcode ==
[rcvda_vcse_sector]                      — the Tees Valley dashboard, live
[rcvda_vcse_sector source="bundled"]     — self-contained from the bundled copy (no external request)
[rcvda_vcse_sector ref="v1.0.0"]         — pin live data to a specific git ref
[rcvda_vcse_sector title="State of the Sector"]  — override the heading

== Changelog ==
= 0.3.0 =
New masthead intro and VCFSE house terminology across the dashboard. The KPI strip is rebuilt as two data-basis groups — "All VCFSE · whole registered sector" (active count + NAVCA whole-sector estimate) as white grey-edged tiles, and "Registered charities only" (turnover, median income, top-10 share, website) as filled charity-indigo tiles, with a caption explaining that income and websites exist only on the Charity Commission register. The website figure is now charities-denominated (declared a website divided by registered charities) rather than diluted across the non-charity segments. No change to the data spine, over-time charts or snapshot-detail sections.

= 0.2.1 =
Light-mode fix: panels now read as white cards. The card fill is a --card token that resolves to the theme's own `base` in light and `surface` in dark, instead of using the light-blue `surface` tint for every panel. `surface` is kept for the single callout note. Bar rails repointed to `divider` so they stay visible on the white cards. No data or behaviour change.

= 0.2.0 =
Added the full current-snapshot analysis beside the over-time trends (type, legal structure, decade founded, income/turnover, size, concentration, digital, NAVCA projection, ten largest, glossary), read from a second living dataset (aggregates JSON) with a bundled fallback.

= 0.1.0 =
Initial release.

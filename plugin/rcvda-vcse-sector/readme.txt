=== RCVDA VCSE Sector ===
Contributors: RCVDA
Requires at least: 6.0
Tested up to: 6.6
Stable tag: 0.1.0
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
= 0.1.0 =
Initial release.

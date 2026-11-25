# Changelog — RCVDA VCSE Sector

All notable changes to this plugin, most recent first. Format: `## YYYY-MM-DD — vX.Y.Z — description`.

## 2026-11-25 — v0.5.0 — Move Measure and Range to the trend charts

- The Measure and Range controls move out of the top filter bar (which now holds only the global borough pills) into a controls row directly under the “Sector size over time” heading — beside the over-time charts they actually drive. The headline KPIs and detail panels respond only to the borough pills, so the controls now sit at the level they affect.
- Measure is now a row of segment-coloured pills (All VCFSE, Registered Charities, CICs, Societies, CASCs) in the segment colours, matching the borough pills, instead of a dropdown; the Range buttons are rounded to match.
- A “Headline Figures” section heading (with a gauge glyph) now sits above the KPI strip, giving it the same wayfinding as the other sections.

## 2026-11-25 — v0.4.9 — Smart time-range default; label fixes

- The over-time charts open on a new **Recent** range that fits the dense, regular-cadence run of whatever series are shown (snapshots within 120 days of each other), so sparse historical seed points no longer stretch the axis. **All** still shows the full back-history (now to 2020), and the scale fits the selected borough — a borough with earlier data shows more under All. Replaced the 13-week button with Recent.
- Masthead intro now expands the abbreviations on first use: “Charitable Incorporated Organisations (CIOs)” and “Community Interest Companies (CICs)”.
- The Charities segment now reads “Registered Charities” wherever it appears as a label (active-sector bars, the segment legend, the founded-chart legend); the data keys and the compact matrix header are unchanged.

## 2026-11-25 — v0.4.8 — Lucide wayfinding glyphs + borough scope tag

- Section band headings carry a 20px Lucide marker in brand blue (trending-up, chart-pie, calendar, pound-sterling, globe, building, book-open), using the band’s existing `h3 svg` hook.
- Six panel heads carry an 18px inline Lucide glyph (Turnover/pound-sterling, Large vs small/scale, Income concentration/chart-pie, Digital presence/globe, Projected whole sector/users, Ten largest/building) — money is always pound-sterling, organisation always building.
- When a borough is selected, each scoped panel gains a top-right scope tag: a map-pin plus the borough name, in the borough colour (an AA-safe shade on light — Middlesbrough #ac6300, Stockton #1a79bd — and the dark-mode variants on dark). Hidden for “Tees Valley (all five)”, and not shown on the all-authority panels (authority chart, latest-snapshot matrix) or the glossary.
- Glyphs are inline Lucide paths (1.5 stroke, currentColor, aria-hidden), consistent with WEB.md → Iconography.

## 2026-11-25 — v0.4.7 — Founded chart: Societies lead the stack

- In “When the sector was founded” the stack order is now Societies, Charities, CICs, CASCs — so registered societies always sit at the front (left) of each bar and the legend matches. Only the founded chart is affected; other charts and tables keep their order.

## 2026-11-25 — v0.4.6 — Founded chart: horizontal bars coloured by type

- “When the sector was founded” is now a horizontal bar per decade, each bar stacked in the four segment colours (Charities, CICs, Societies, CASCs) with a legend, so the type mix within each decade is visible — e.g. the pre-1960 base is all registered societies and the 2020s are CIC-led. Falls back to a single-colour bar if the data still carries the old flat shape.
- Needs the data repo’s decade breakdown by type: build_snapshot.py now emits decades as decade->{segment:count}, and the bundled aggregates are regenerated to match. Push the tees-valley-vcse-sector data repo so the live jsDelivr feed carries the new shape; until then the live feed shows single-colour bars and the bundled copy is the coloured fallback.
- Sub-label notes that CASCs carry no registration date and are not shown.

## 2026-11-25 — v0.4.5 — Borough-coloured card outlines on selection

- Selecting a borough pill now outlines all six KPI cards in that borough’s colour (DESIGN.md Tees Valley borough scale, resolved from rcvda-core’s --la-* tokens): a 2px border on the white whole-sector cards and a 2px ring on the filled charity cards. “Tees Valley (all five)” returns the cards to their default grey edge. The outline tracks dark mode with the rest of the palette.

## 2026-11-25 — v0.4.4 — Split the KPI caption under its blocks

- The strip caption is split in two on the same six-column grid: the NAVCA whole-sector note sits under the two whole-sector tiles (columns 1–2), and the charities-only note under the four charity tiles (columns 3–6). Below 680px the two notes stack full width.

## 2026-11-25 — v0.4.3 — KPI tiles exactly equal width

- The six KPI tiles now sit on one shared six-column grid (each an equal 1fr), so every tile is exactly the same width across both groups — the 2:4 flex in v0.4.2 left them a few pixels apart. The two group headings span two and four columns above the tiles; below 680px the strip drops to two columns and the group super-labels are hidden (tile colour still distinguishes the groups).

## 2026-11-25 — v0.4.2 — KPI tiles fill the full width

- The six KPI tiles now grow to span the full strip width instead of sitting at a fixed 165px with trailing dead space. The two groups flex 2:4 by tile count and the tiles flex within them, so all six stay the same size and the strip is balanced edge to edge (height still 116px; wraps on narrow screens).

## 2026-11-25 — v0.4.1 — Est. Whole Sector sublabel; full-width caption

- The “Est. Whole Sector” tile now shows “inc. unregistered” on its sublabel line (was blank).
- The KPI-strip caption runs full width (the 92ch cap is removed) and opens with “Whole sector count” in bold.

## 2026-11-25 — v0.4.0 — Borough location pills; uniform KPI tiles; label tidy-up

- Authority filter is now a row of borough-coloured location pills (the cycle-map model) in place of the dropdown: a “Tees Valley (all five)” pill in TVCA navy plus one per borough, each a 2px-outline chip that fills when selected; colours resolve from rcvda-core’s --la-*/--tv-navy tokens with the DESIGN.md borough hexes as fallback (dark text on Middlesbrough and Stockton). Selection drives every scope exactly as the dropdown did.
- “The sector by type” now pairs Active sector by type with Projected whole sector; Charity legal structure moves into the “Digital & projection” row for the moment (panels swapped — each still reads its own data).
- KPI tiles render at a uniform 165×116 (fixed height, was min-height), so all six cards match in width and height regardless of label length.
- Whole-sector tile relabelled “Est. Whole Sector” (was “Estimated whole sector / incl. unregistered (NAVCA)”); the NAVCA/unregistered explanation moves into the strip caption.
- Active-count tile relabelled “Registered Orgs” (was “Active organisations”).
- Strip caption now opens with “Whole sector count includes unregistered organisations projected through the NAVCA model.” ahead of the existing charities-only note.
- No change to the data spine, the computed figures or the chart logic.

## 2026-11-24 — v0.3.0 — Intro rewrite, VCFSE terminology, two-group KPI strip

- New masthead intro: "State of the Sector is a timed series produced by RCVDA that records the registered Voluntary, Community, Faith and Social-Enterprise (VCFSE) sector based-in and trading from the five Tees Valley Authorities", naming the three families — Registered Charities (incl. CIOs); Social Enterprises (incl. CICs, registered societies / mutuals); and CASCs.
- House terminology moved from VCSE to VCFSE across the dashboard chrome (eyebrow, measure control, chart titles, glossary). Plugin slug, shortcode and admin name are unchanged.
- KPI strip rebuilt as two data-basis groups. "All VCFSE · whole registered sector" (active organisations; NAVCA whole-sector estimate) renders as white, grey-edged tiles; "Registered charities only" (sector turnover, median income, top-10 share, website) renders as filled charity-indigo tiles, under a caption noting that income and websites exist only on the Charity Commission register, so the whole-sector figures are higher than shown. Six uniform tiles (165×116); the group divider is hidden via a container query when the strip wraps.
- The website figure is now charities-denominated — declared a website divided by registered charities (64%) — rather than the previous all-active denominator (43%), which understated it because CICs, societies and CASCs cannot file a website through their registers.
- New component tokens: `--greyedge` (whole-sector tile edge) and `--char-ink`/`-2`/`-3` (charity-tile text), each with a dark-mode value so the charity tiles stay legible (dark text on the lightened charity fill) in dark mode.
- No change to the data spine, the over-time charts or the snapshot-detail sections. Verified in light and dark, wide and wrapped.

## 2026-11-24 — v0.2.1 — Light-mode card surfaces

- Panels now read as white cards in light mode. Previously every panel (KPI tiles, chart boxes, filter bar) was filled with the theme's `--wp--preset--color--surface` tint (`#a7c1d9` Light Blue), which — correct for an occasional badge — turned the whole dashboard Light-Blue-on-Light-Blue when used as the fill behind every element.
- Introduced one component-scoped token, `--card`, that is a *mapping* rather than a colour: it resolves to the theme's own `base` in light (white) and `surface` in dark (`#16284a`), so panels are white cards in light mode and proper dark panels in dark mode, while still tracking any future change to the rcvda-base palette. `--surface` is retained for the single "living measure" callout note, which is its intended badge/callout use.
- Bar rails (`.track`, `.conc-bar`) repointed from `base` to `divider` so they stay visible now that the cards themselves are `base`.
- Verified in both light and dark against the real rcvda-base token values. No data, markup or behaviour change.

## 2026-11-24 — v0.2.0 — Detailed snapshot analytics

- Added the full current-snapshot analysis beside the over-time trends: active sector by type, charity legal structure, decade founded, turnover/income bands, large-vs-small by value, income concentration, digital presence, the NAVCA whole-sector projection, the ten largest organisations, and a glossary. Every section responds to the Authority filter.
- Reads a second living dataset — `data/tees-valley-vcse-aggregates.json` — from the data repo over jsDelivr, with a bundled fallback. The runner computes it weekly from the same FTC pull (no extra fetches), per borough and Tees Valley.
- KPI tiles now summarise the selected scope (active, estimated whole sector, turnover, median income, top-10 share, website %).

## 2026-11-24 — v0.1.0 — Initial release

- `[rcvda_vcse_sector]` shortcode renders the "State of the Sector" living dashboard: KPI tiles, two over-time line charts (sector size by authority; the four segments) and a latest-snapshot matrix, built from the Tees Valley based-in VCSE time series.
- Reads the spine live from the public data repo (`rcvda/tees-valley-vcse-sector`) over the jsDelivr CDN, with the bundled copy as an automatic fallback.
- Chrome (text, panels, borders, links, backgrounds and dark mode) is inherited from the active `rcvda-base` skin via its `--wp--preset--color--*` tokens — the plugin defines no palette or dark mode of its own for chrome.
- Borough colours resolve from `rcvda-core`'s shared `--la-*`/`--tv-navy` tokens (DESIGN.md hex as fallback); the four segment colours are a brand-derived categorical scale with its own dark variants. Data colours are resolved to concrete values for cross-browser SVG, and the dashboard re-renders on dark-mode change.

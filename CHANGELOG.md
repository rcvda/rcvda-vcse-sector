# Changelog — RCVDA VCSE Sector

All notable changes to this plugin, most recent first. Format: `## YYYY-MM-DD — vX.Y.Z — description`.

## 2026-11-25 — v0.4.0 — Borough location pills; uniform KPI tiles; label tidy-up

- Authority filter is now a row of borough-coloured location pills (the cycle-map model) in place of the dropdown: a “Tees Valley (all five)” pill in TVCA navy plus one per borough, each a 2px-outline chip that fills when selected; colours resolve from rcvda-core’s --la-*/--tv-navy tokens with the DESIGN.md borough hexes as fallback (dark text on Middlesbrough and Stockton). Selection drives every scope exactly as the dropdown did.
- KPI tiles render at a uniform 165×116 (fixed height, was min-height), so all six cards match in width and height regardless of label length.
- Whole-sector tile relabelled “Est. Whole Sector” (was “Estimated whole sector / incl. unregistered (NAVCA)”); the NAVCA/unregistered explanation moves into the strip caption.
- Active-count tile relabelled “Registered Orgs” (was “Active organisations”).
- Strip caption now opens with “Whole sector count includes unregistered organisations projected through the NAVCA model.” ahead of the existing charities-only note.
- No data, chart or behaviour change.

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

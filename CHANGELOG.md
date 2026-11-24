# Changelog — RCVDA VCSE Sector

All notable changes to this plugin, most recent first. Format: `## YYYY-MM-DD — vX.Y.Z — description`.

## 2026-11-24 — v0.2.0 — Detailed snapshot analytics

- Added the full current-snapshot analysis beside the over-time trends: active sector by type, charity legal structure, decade founded, turnover/income bands, large-vs-small by value, income concentration, digital presence, the NAVCA whole-sector projection, the ten largest organisations, and a glossary. Every section responds to the Authority filter.
- Reads a second living dataset — `data/tees-valley-vcse-aggregates.json` — from the data repo over jsDelivr, with a bundled fallback. The runner computes it weekly from the same FTC pull (no extra fetches), per borough and Tees Valley.
- KPI tiles now summarise the selected scope (active, estimated whole sector, turnover, median income, top-10 share, website %).

## 2026-11-24 — v0.1.0 — Initial release

- `[rcvda_vcse_sector]` shortcode renders the "State of the Sector" living dashboard: KPI tiles, two over-time line charts (sector size by authority; the four segments) and a latest-snapshot matrix, built from the Tees Valley based-in VCSE time series.
- Reads the spine live from the public data repo (`rcvda/tees-valley-vcse-sector`) over the jsDelivr CDN, with the bundled copy as an automatic fallback.
- Chrome (text, panels, borders, links, backgrounds and dark mode) is inherited from the active `rcvda-base` skin via its `--wp--preset--color--*` tokens — the plugin defines no palette or dark mode of its own for chrome.
- Borough colours resolve from `rcvda-core`'s shared `--la-*`/`--tv-navy` tokens (DESIGN.md hex as fallback); the four segment colours are a brand-derived categorical scale with its own dark variants. Data colours are resolved to concrete values for cross-browser SVG, and the dashboard re-renders on dark-mode change.

# Changelog — RCVDA VCSE Sector

All notable changes to this plugin, most recent first. Format: `## YYYY-MM-DD — vX.Y.Z — description`.

## 2026-11-27 — v0.5.31 — Standardise the “Societies” label to “Registered Societies”

- `segLabel()` now renders the Societies segment as **Registered Societies** everywhere it appears — the When the Sector Was Founded legend, the Active Sector by Type panel and the by-authority chart titles and legend — matching the Registered Charities treatment; the by-authority measure chip label is updated to match. The data keys (`by_segment.Societies` and the colour tokens) are unchanged.
- Dashboard-only; no data, runner or aggregates change.

## 2026-11-27 — v0.5.30 — Turnover list subtitle reworded

- The **Turnover of the Active Sector** subtitle now reads “% of all N registered charities · reporting: avg £… · median £…”. The percentages are of all registered charities in scope (the list carries a No income recorded row), while the average and median are labelled as being of those reporting — so neither basis is overstated. Drops the inline “with no income recorded” count, shown as its own row since v0.5.28.
- Dashboard-only; no data, runner or aggregates change.

## 2026-11-27 — v0.5.29 — Median income shown beside the mean in the turnover list

- The **Turnover of the Active Sector** subtitle now shows the **median** income beside the mean (Tees Valley: avg £364,589 · median £22,871), of those reporting. Charity income is heavily right-skewed — a few large charities pull the mean well above the typical figure — so the median gives the truer sense of a typical charity’s income. (A Median income tile already existed; this puts both at the income breakdown.)
- Dashboard-only; no data, runner or aggregates change.

## 2026-11-27 — v0.5.28 — Charities with no income recorded shown in the turnover list

- The **Turnover of the Active Sector** list now carries a **No income recorded** row — the active based-in registered charities with no income figure on the register (charities minus those reporting) — set off below Under 10k. Every row’s percentage is now out of all registered charities in scope, so the list sums to 100%.
- Subtitle rebased: “% of all N registered charities · M with no income recorded · avg £… (of those reporting)”, replacing the earlier wording that set the all-VCFSE no-income count (which includes CICs, societies and CASCs that carry no income) against the charity list.
- Money → ONS turnover panel note: the “report none and are not shown” figure now counts charities with no income (charities minus those reporting), not the all-VCFSE no-income total.
- Dashboard-only; no data, runner or aggregates change.

## 2026-11-26 — v0.5.27 — Money: Turnover Compared With the Business Base (ONS turnover bands)

- New full-width panel at the end of **Money**: the ten ONS UK Business Counts turnover bands (£0–£49k to £50m+), with three groups side by side — **All Businesses** and **Non-profit Bodies** (ONS legal status "Non-profit body or mutual association") from Nomis NM_199_1, March 2026, then our **Registered Charities** by latest annual income. Each band shows count · % for each group, with a Total row at 100%, plus summary lines for £100k, £500k and £1m and over (Tees Valley: 69% / 75% / 28%; 20% / 26% / 10%; 11% / 12% / 5%).
- Follows the borough filter: ONS figures are held per local authority (`ONS_TB`, fixed in the JS like `GVA_M`; Tees Valley = sum of the five). ONS rounds counts to the nearest 5, so totals are the sum of the bands. Refresh annually.
- Charity counts come from the new aggregates field `income_bands_ons` (runner from 26/11/2026; 24/11 and 25/11 backfilled). Without it the panel says "Not available for this selection".
- Colours: All Businesses neutral grey `--ons-all` (#7A8494 light / #8C97A8 dark); Non-profit Bodies a Tees Valley navy tint `--ons-np` (#6B7BB8 light, 4.1:1 on white / #5A6BA8 dark); charities keep the charity segment colour. On narrow screens the bars drop and percentages only are shown.
- Bundled fallback data refreshed from the data repo (includes `income_bands_ons`).
- Existing Money panels unchanged.

## 2026-11-26 — v0.5.26 — Percentages beside counts across the dashboard

- Every breakdown now shows each count with its share, using the same `pct()` rounding (whole numbers, `<1%` for small non-zero items):
  - **Active Sector by Type**, **When the Sector Was Founded** and **Turnover of the Active Sector** bar rows: count and percentage in their own aligned columns (new `.val .cn` / `.val .pc` grid; value column widened to 94px, 84px under 560px).
  - **Projected Whole Sector** rows (`1,050 · 26%`, `~2,746 · 68%`, `~242 · 6%`), with **100%** beside the Estimated whole sector total that they break down.
  - **Digital Presence** rows (`677 · 43%`, `910 · 57%`); the donut now rounds to a whole number (42.7% → 43%) to match.
  - Legal-structure and social-enterprise split-bar labels (`Incorporated 516 · 49%`).
  - **Large vs Small** money shares use the same rounding, so Small reads `<1%` instead of `0%`.
- Each panel's sub-line names the base its percentages are of: "% of 1,587 active", "% of the 1,537 with a registration date" (CASCs carry no date), "% of the 963 charities reporting income".
- Fixed a latent name clash: the digital donut's local `pct` variable shadowed the `pct()` helper; renamed to `wp`.

## 2026-11-26 — v0.5.25 — Structure panels full width: overall split + two groups with shares and percentages; CIC legal form; AA split-bar labels

- **Registered Charities’ Legal Structure** and **Social Enterprise Types** are now full width and stacked. Each opens with its overall split bar, then two groups side by side (one column on narrow screens), each with its own bar and list:
  - Social Enterprise Types — **Community Interest Companies** (Limited by Guarantee / Limited by Shares / Converted / Closed at Companies House, from the new `social_enterprise.cic_structure`) and **Registered Societies** (Community Benefit Societies, Co-operative Societies, Credit Unions, Working Men’s Clubs, Friendly Societies, Other Registered Societies).
  - Registered Charities’ Legal Structure — **Incorporated** (CIO — Foundation, CIO — Association, Charitable Company, Other Incorporated) and **Unincorporated** (Trust, Other Unincorporated (Mainly Associations)).
- Rows show the count and its share of the group (`349 · 91%`, `<1%` for a single small item); group headings show their share of the whole (`385 · 79%`). Items are ordered largest first; zero rows hidden; a group without its breakdown says so.
- Sub-types use the new DESIGN.md *Sub-type shades* of each group colour (CSS `--sh-cic-*`, `--sh-soc-*`, `--sh-chr-*`, `--sh-unc-*`, light and dark), each ≥3:1 against the panel; shade 1 is the group colour and goes to the largest item.
- CIC legal form from each CIC's public Companies House page (lookup 26/11/2026, all 706 based-in CICs); Tees Valley 25/11: 349 guarantee, 35 shares, 1 listed active by FTC but converted/closed at Companies House.
- List labels in Title Case.
- Split-bar labels meet AA: light-mode CIC segment uses the DESIGN.md chip-safe shade `#E02C13` (white 4.6:1, was 4.45:1); dark-mode split labels are navy `#1B1740` (5.0:1 or better; white was 2.4–3.4:1).
- Verified by running the plugin script against the bundled data in light and dark: no script errors.

## 2026-11-26 — v0.5.24 — Headings in Title Case; Registered Charities’ Legal Structure

- Every section band and panel heading moved from sentence case to Title Case (articles, "and", "vs" and prepositions of three letters or fewer stay lower case), including the three headings built in code (by authority, in a borough, over time). E.g. *When the Sector Was Founded*, *Turnover of the Active Sector*, *Ten Largest Active Organisations by Income*.
- *Charity legal structure* renamed **Registered Charities’ Legal Structure**.
- Headings only — no tile labels, glossary terms, data or layout changed.

## 2026-11-25 — v0.5.23 — Filter pills: standard shape, category-colour hover, Tees Valley navy range

- Authority and Measure pills take the estate's standard pill shape (10px corners, padding .5em 1em) and keep the dashboard's colour scheme: white chip, 2px outline in the category colour, filled when selected. Text size unchanged (.82rem) so the authority row stays on one line.
- Hover now shows the pill's own colour: a tint of its borough / organisation-type colour (Tees Valley navy for the whole-area and All pills). Previously a 6% brightness change, invisible on the white chips. Selected pills darken slightly on hover.
- Dark mode: selected organisation-type pills use navy text (`#1B1740`) on their light dark-mode fills — white failed AA (3.1–3.4:1); now 5.0–7.1:1.
- Range buttons (Recent / 12 mths / All): selected state moves from brand-light blue to **Tees Valley navy** (`#2A3B72`; dark `#5A6BA8`, white text 5.1:1), with a matching hover; 10px corners.
- Legend toggles: underline on hover and a keyboard focus outline.
- Follows DESIGN.md *Filter pills / tabs* as amended 25/11/2026 (category-colour pills for data tools).

## 2026-11-25 — v0.5.22 — Employees and Volunteers tiles read live data

- The Employees and Volunteers tiles now read `workforce` from the weekly aggregates (from the 25/11/2026 snapshot), summed from each active charity's latest annual return, with the reporting count in the sub-line. The fixed 08/09/2026 figures remain only as a fallback for snapshots without `workforce`.
- Live Tees Valley figures differ from September: employees 5,100 (94 reporting) vs 5,134; volunteers 19,365 (669) vs 25,851 — mostly newer annual returns from a few large bodies (e.g. Freemasons Charity Yorkshire North & East Ridings 3,000 → 0; Middlesbrough Diocesan Trust 2,000 → 100), plus three organisations whose full record failed to fetch on 25/11 (fixed in the runner).
- Footnote updated: figures come from latest annual returns, where reported.

## 2026-11-25 — v0.5.21 — Founded chart: segment seam in dark mode too

- The 1px seam between stacked segments in *When the sector was founded* now applies in dark mode as well as light. It uses the card colour (`--card`), so it is white in light mode and the dark panel colour in dark mode. Segment widths unchanged.

## 2026-11-25 — v0.5.20 — Structure & age: charity legal structure beside new Social enterprise types panel

- *Charity legal structure* moves from Digital & projection into Structure & age, under the founded chart.
- New *Social enterprise types* panel beside it: a CICs vs registered societies split bar, and a list of CICs plus society sub-types (community benefit, co-operative, credit union, working men's club, friendly society, other registered society; zero rows hidden). Reads `social_enterprise` from the aggregates (added to the data runner the same day); until a snapshot carries it, shows the CIC and society totals with a note that sub-types follow. CASCs are counted separately, as in the intro.
- *Digital presence* now sits on its own under Digital & projection.

## 2026-11-25 — v0.5.19 — Founded chart: 1px seam between stacked segments in light mode

- In *When the sector was founded*, each segment after the first in a stacked bar now carries a 1px card-coloured (white) seam on its left edge in light mode, so neighbouring segment colours no longer merge. Drawn as an inset shadow, so segment widths and totals are unchanged. Dark mode unchanged.

## 2026-11-25 — v0.5.18 — KPI strip: group keys move below the tiles

- The two group keys (All VCFSE · whole registered sector / Registered charities only) now sit below the tiles and directly above their matching footnotes, so each key heads its own note rather than floating above the strip. Still aligned to the 2 + 4 tile split; spacing adjusted (key 14px below the tiles, note 6px below the key). Employees/Volunteers sub-lines shortened to "N reporting · Sep 2026" so they stay on one line (full date is in the footnote). No other change to the tiles or the narrow-width behaviour.

## 2026-11-25 — v0.5.17 — KPI strip: restore Sector turnover; Income vs GVA second; Employees and Volunteers tiles

- Sector turnover is back as the first charity tile (v0.5.16 had replaced it). Income vs GVA moves to second, replacing Median income; its sub-line now reads "of £Xbn GVA (2024)" since turnover sits beside it. Falls back to Median income if an area has no GVA figure.
- Top-10 share and Declared a website tiles replaced by **Employees** and **Volunteers** — a fixed snapshot from 08/09/2026 (Size of the Voluntary Sector FTC pull), summed across active charities that report the field, with the reporting count in each sub-line (Tees Valley: 5,134 employees from 93; 25,851 volunteers from 672). Not yet in the weekly runner — backfill is a follow-up. Both removed figures remain in the detail sections (Income concentration, Digital presence).
- Charity-group footnote updated to cover workforce and the 08/09/2026 snapshot.

## 2026-11-25 — v0.5.16 — KPI strip: replace Sector turnover with Income vs GVA

- The first charity tile now shows active charities' latest-year income as a share of the selected area's gross value added, with the income and GVA in the sub-line (e.g. Tees Valley 2.1% — £351m of £17.0bn).
- GVA is ONS *Regional gross domestic product: local authorities* (1998 to 2024 edition, released 23/09/2026), Table 1, balanced GVA at current basic prices, 2024 (provisional); Tees Valley is the sum of the five authorities. Held as a constant in the JS until the data runner carries it.
- Each authority is now divided by its own GVA; the September aggregates used one fixed denominator for every area.
- Glossary entry added, noting income is turnover rather than value added, so this is a scale comparison, not a share of the economy.

## 2026-11-25 — v0.5.15 — Latest snapshot matrix: one line per row; fix misaligned row rules

- Number cells no longer wrap, so each change arrow sits beside its figure instead of dropping below it; tightened cell padding and arrow width so the table fits the existing col-5 panel without widening it.
- The Authority cell was `display:flex`, which took it out of table layout: its rule sat at its own content height rather than the row's, and the Tees Valley total rule broke at that column. It is a normal table cell again, with the colour chip inline.

## 2026-11-25 — v0.5.14 — Add up/stable/down change arrows to the Latest snapshot matrix (vs the previous snapshot)

## 2026-11-25 — v0.5.13 — Show the snapshot date on hover over the timeline range points

## 2026-11-25 — v0.5.12 — Add a data-point timeline range control (tick per snapshot, draggable start handle) alongside the Recent/12m/All presets

## 2026-11-25 — v0.5.11 — Move the Measure control onto the by-authority chart it drives; keep Range as the section-level time control

## 2026-11-25 — v0.5.10 — Keep the Ten-largest table neutral; theme only standalone data charts, not table chrome

## 2026-11-25 — v0.5.9 — Keep section headers and their glyphs fixed; theme only the chart data fills to the selected authority

## 2026-11-25 — v0.5.8 — Theme borough-sensitive section headers and default-blue chart fills to the selected authority's colour

## 2026-11-25 — v0.5.7 — Show the end-of-line value on every series line, not just the top line

## 2026-11-25 — v0.5.6 — Restore authority comparators on the by-authority chart when a borough is selected

## 2026-11-25 — v0.5.5 — Enlarge section and panel headings to the DESIGN.md heading scale

## 2026-11-25 — v0.5.4 — Restructure the over-time charts; total line on its own chart

- The whole-sector total returns — on the right chart. “Active VCFSE over time” (the former four-segments chart) now leads the section and carries a Total VCFSE line alongside the four segment lines, where the total (~1,587) and Registered Charities (~1,050) share a sensible single axis — no misleading second axis. The “Active VCFSE by authority” borough comparison sits below it.
- The Measure and Range controls are wrapped in a boxed control bar, matching the borough pills.

## 2026-11-25 — v0.5.3 — Remove the Tees Valley total line from the authority chart

- The “Active … by authority” chart no longer draws the Tees Valley total as a line. The total is ~3× the largest borough, so it forced a second, tightly-zoomed right axis that made a tiny real change (e.g. 1,563 → 1,587, +24) look like a steep climb while the boroughs sat flat — misleading. The chart now shows the five boroughs on one sensible scale; the whole-Tees-Valley total remains in the headline figures and the Latest-snapshot table.

## 2026-11-25 — v0.5.2 — Drop partial snapshots from the trend charts

- The over-time charts no longer plot partial snapshots (dates where the “All VCFSE” total was built from an incomplete set of segments). These produced misleading dots — e.g. a borough appearing to drop to a third of its size and back — because the counts weren’t comparable. Only complete snapshots are charted now. Individual-measure trends (Registered Charities, CICs, etc.) are unaffected and keep their full history, since single-segment readings are always complete.

## 2026-11-25 — v0.5.1 — Trend chart scopes to borough; total leads the legend

- The “Sector size over time” authority chart now responds to the borough pills: “Tees Valley (all five)” shows every borough line plus the total (legend toggles still let you compare any subset); selecting a borough scopes the chart to that borough’s single trend line, with the title and borough scope tag updating to match.
- Tees Valley total now leads the chart legend instead of trailing it.

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

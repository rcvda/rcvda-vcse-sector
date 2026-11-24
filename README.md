# RCVDA VCSE Sector

A WordPress plugin that renders RCVDA's **"State of the Sector"** living dashboard — the size of the
registered VCSE sector **based in** each of the five Tees Valley authorities, as a weekly-updated time
series — via the `[rcvda_vcse_sector]` shortcode.

- **KPI tiles** — latest based-in active totals, Tees Valley and per borough.
- **Sector size over time** — one line per authority (and a toggleable Tees Valley total).
- **The four segments over time** — charities/CIOs, CICs, registered societies, CASCs.
- **Latest-snapshot matrix** — authority × segment, with totals.

## Data

The dashboard reads the time-series spine from the public repo
[`rcvda/tees-valley-vcse-sector`](https://github.com/rcvda/tees-valley-vcse-sector) over the
**jsDelivr CDN** (`cdn.jsdelivr.net/gh/…`), falling back to the copy bundled in the plugin. That repo
is rebuilt **weekly** from Find That Charity by a GitHub Actions runner, so the dashboard stays current
with no change to the site. jsDelivr caches a branch for up to ~12h, well inside the weekly cadence.

The headline is the **based-in** (registered-office) measure; the wider "operating-from" reach measure
is tracked separately.

## Install / update

Built as a Git-Updater-compatible plugin (Release Asset mode). Tag a version to publish a release zip:

```
git tag v0.1.0 && git push origin v0.1.0
```

Until Git Updater is wired up estate-wide, install by uploading `dist/rcvda-vcse-sector.zip`
(Plugins → Add New → Upload). The zip's single top-level folder is `rcvda-vcse-sector/` (zip-root rule).

## Licence

Code: GPL-2.0-or-later. Data: CC BY-NC-SA 4.0 © RCVDA; underlying register data under OGL v3.0.

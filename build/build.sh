#!/usr/bin/env bash
# Refresh the plugin's bundled time-series copy from the data repo, then repackage the plugin zip.
#
# Data source, in order of preference:
#   1. RCVDA_SKIP_FETCH=1  -> keep the existing bundled copy (offline / no refresh)
#   2. a sibling checkout  -> ../tees-valley-vcse-sector/data/tees-valley-vcse-timeseries.csv
#   3. jsDelivr/raw        -> the public data repo over the network
#   4. otherwise           -> keep the existing bundled copy, with a warning
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLUG="$ROOT/plugin/rcvda-vcse-sector"
BUNDLED="$PLUG/assets/data/tees-valley-vcse-timeseries.csv"
DATA_REF="${RCVDA_DATA_REF:-main}"
SIBLING="$ROOT/../tees-valley-vcse-sector/data/tees-valley-vcse-timeseries.csv"
CDN_URL="https://cdn.jsdelivr.net/gh/rcvda/tees-valley-vcse-sector@${DATA_REF}/data/tees-valley-vcse-timeseries.csv"

valid_csv() { head -1 "$1" 2>/dev/null | grep -q '^segment,borough,snapshot_date'; }

if [ "${RCVDA_SKIP_FETCH:-}" = "1" ]; then
  echo "RCVDA_SKIP_FETCH=1 — using existing bundled data."
elif [ -f "$SIBLING" ] && valid_csv "$SIBLING"; then
  cp "$SIBLING" "$BUNDLED"; echo "Bundled data refreshed from sibling checkout ($SIBLING)."
elif command -v curl >/dev/null 2>&1 && curl -fsSL "$CDN_URL" -o "$BUNDLED.tmp" && valid_csv "$BUNDLED.tmp"; then
  mv "$BUNDLED.tmp" "$BUNDLED"; echo "Bundled data refreshed from $CDN_URL"
else
  rm -f "$BUNDLED.tmp" 2>/dev/null || true
  echo "WARNING: could not source fresh data — keeping existing bundled copy."
fi

mkdir -p "$ROOT/dist"
( cd "$ROOT/plugin" && rm -f "$ROOT/dist/rcvda-vcse-sector.zip" && zip -rq "$ROOT/dist/rcvda-vcse-sector.zip" rcvda-vcse-sector )
echo "Build complete: dist/rcvda-vcse-sector.zip"

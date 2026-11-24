#!/usr/bin/env bash
# Refresh the plugin's bundled data (spine CSV + analytics JSON) from the data
# repo, then repackage the plugin zip.
#   1. RCVDA_SKIP_FETCH=1  -> keep the existing bundled copies
#   2. a sibling checkout  -> ../tees-valley-vcse-sector/data/<file>
#   3. jsDelivr            -> the public data repo over the network
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLUG="$ROOT/plugin/rcvda-vcse-sector"
DATA_REF="${RCVDA_DATA_REF:-main}"
SIB="$ROOT/../tees-valley-vcse-sector/data"
CDN="https://cdn.jsdelivr.net/gh/rcvda/tees-valley-vcse-sector@${DATA_REF}/data"

refresh() { # <filename> <validator-grep>
  local f="$1" pat="$2" dst="$PLUG/assets/data/$1"
  if [ "${RCVDA_SKIP_FETCH:-}" = "1" ]; then echo "skip $f (RCVDA_SKIP_FETCH)"; return; fi
  if [ -f "$SIB/$f" ] && grep -q "$pat" "$SIB/$f"; then cp "$SIB/$f" "$dst"; echo "$f from sibling"; return; fi
  if command -v curl >/dev/null 2>&1 && curl -fsSL "$CDN/$f" -o "$dst.tmp" && grep -q "$pat" "$dst.tmp"; then mv "$dst.tmp" "$dst"; echo "$f from CDN"; return; fi
  rm -f "$dst.tmp" 2>/dev/null || true; echo "WARNING: could not refresh $f — keeping bundled copy."
}
refresh "tees-valley-vcse-timeseries.csv" "^segment,borough,snapshot_date"
refresh "tees-valley-vcse-aggregates.json" "snapshots"

mkdir -p "$ROOT/dist"
( cd "$ROOT/plugin" && rm -f "$ROOT/dist/rcvda-vcse-sector.zip" && zip -rq "$ROOT/dist/rcvda-vcse-sector.zip" rcvda-vcse-sector )
echo "Build complete: dist/rcvda-vcse-sector.zip"

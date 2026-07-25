#!/usr/bin/env bash
# Agent-friendly: poke the docs hub to full-rebuild now (no polling, no extra CI).
# Usage:
#   ./scripts/notify-docs-hub.sh
#   ./scripts/notify-docs-hub.sh extension-updated
#   HUB=other-org/docs ./scripts/notify-docs-hub.sh docs-source-updated

set -euo pipefail
EVENT_TYPE="${1:-docs-source-updated}"
HUB="${HUB:-antora-supplemental/docs}"
SOURCE="${SOURCE:-$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo unknown)}"
REF="${REF:-$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)}"
SHA="${SHA:-$(git rev-parse HEAD 2>/dev/null || echo unknown)}"

gh api "repos/${HUB}/dispatches" \
  -f "event_type=${EVENT_TYPE}" \
  -f "client_payload[source]=${SOURCE}" \
  -f "client_payload[ref]=${REF}" \
  -f "client_payload[sha]=${SHA}"

echo "Dispatched ${EVENT_TYPE} → ${HUB} (source=${SOURCE} sha=${SHA})"

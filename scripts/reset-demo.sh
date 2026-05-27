#!/usr/bin/env bash
# Reset Helix demo to a clean, presentation-ready state.
# Run this right before the playback session (or after any test runs that
# left state drifted). Reads LAUNCHDARKLY_API_TOKEN from app/.env.local.
#
# What it does:
#   1. Resets applied-perk-allocation.current → BUILD_PLAN baseline (3/8/10)
#   2. Turns all four flags ON in the `test` environment
#      (the demo toggles release-incentives-v2 OFF mid-session; this turns it back)
#
# What it does NOT need to touch:
#   - Per-perk Activate pills + Upgrade button states are client-side React
#     state. They reset on any page refresh — no server action needed.
#
# Usage:  bash scripts/reset-demo.sh

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$HERE/../app/.env.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE not found. Run from the LaunchDarkly project folder." >&2
  exit 1
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

if [[ -z "${LAUNCHDARKLY_API_TOKEN:-}" ]]; then
  echo "ERROR: LAUNCHDARKLY_API_TOKEN missing from $ENV_FILE" >&2
  exit 1
fi

PROJ="default"
ENVKEY="test"
API="https://app.launchdarkly.com/api/v2"
H_AUTH="Authorization: $LAUNCHDARKLY_API_TOKEN"
H_VER="LD-API-Version: 20240415"

BASELINE='{"premium":["spotify-individual","deliveroo-plus-5","headspace-annual"],"pro":["apple-music","calm-annual","classpass-20","audible-monthly","travel-insurance-basic","tastecard","priority-pass","fx-interbank"],"ultra":["spotify-family","deliveroo-plus-25","disney-plus","vue-cinema-4","sky-premium","travel-insurance-premium","mobile-phone-insurance","boots-advantage-3x","isa-bonus-rate","concierge-24-7"]}'

echo "1/2 · Resetting applied-perk-allocation → baseline (3/8/10)…"
code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$API/flags/$PROJ/applied-perk-allocation" \
  -H "$H_AUTH" -H "Content-Type: application/json" -H "$H_VER" \
  -d "[{\"op\":\"replace\",\"path\":\"/variations/0/value\",\"value\":$BASELINE}]")
echo "    HTTP $code"

echo "2/2 · Turning all four flags ON in '$ENVKEY'…"
for flag in release-incentives-v2 targeting-vulnerable-customer-mode experiment-premium-bundle applied-perk-allocation; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$API/flags/$PROJ/$flag" \
    -H "$H_AUTH" \
    -H "Content-Type: application/json; domain-model=launchdarkly.semanticpatch" \
    -H "$H_VER" \
    -d "{\"environmentKey\":\"$ENVKEY\",\"instructions\":[{\"kind\":\"turnFlagOn\"}]}")
  echo "    $flag → HTTP $code"
done

echo ""
echo "Done. Verify the live surface opens clean:"
echo "  https://helix-bank-ld-homework.vercel.app/"
echo "  (Premium should show: Spotify Premium, Deliveroo Plus £5/mo, Headspace)"

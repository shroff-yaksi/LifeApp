#!/bin/bash
set -e

# Load env vars
[ -f .env ] && export $(grep -v '^#' .env | xargs)

if [ -z "$DEVICE_UDID" ]; then
  echo "ERROR: DEVICE_UDID not set in .env"
  exit 1
fi

echo ""
echo "  Building RELEASE (no dev tools, no Metro needed)"
echo "  Device: $DEVICE_UDID"
echo ""

npx expo run:ios --device "$DEVICE_UDID" --configuration Release

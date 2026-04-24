#!/bin/bash
set -e

# Load env vars
[ -f .env ] && export $(grep -v '^#' .env | xargs)

if [ -z "$DEVICE_UDID" ]; then
  echo "ERROR: DEVICE_UDID not set in .env"
  exit 1
fi

IP=$(ipconfig getifaddr en0)
if [ -z "$IP" ]; then
  echo "ERROR: Could not detect LAN IP. Make sure you're on WiFi."
  exit 1
fi

echo ""
echo "  Building for device : $DEVICE_UDID"
echo "  Metro host          : $IP"
echo ""

REACT_NATIVE_PACKAGER_HOSTNAME=$IP npx expo run:ios --device "$DEVICE_UDID"

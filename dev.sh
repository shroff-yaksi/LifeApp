#!/bin/bash
set -e

# Load env vars
[ -f .env ] && export $(grep -v '^#' .env | xargs)

IP=$(ipconfig getifaddr en0)
if [ -z "$IP" ]; then
  echo "ERROR: Could not detect LAN IP. Make sure you're on WiFi."
  exit 1
fi

echo ""
echo "  Dev server : http://$IP:8081"
echo "  Manual URL : exp://$IP:8081"
echo ""

REACT_NATIVE_PACKAGER_HOSTNAME=$IP npx expo start

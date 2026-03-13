#!/usr/bin/env bash
# =============================================================
# NullShift — Update contract addresses in common/constants.ts
# =============================================================
# Reads a deployment JSON file and patches the addresses in
# packages/common/src/constants.ts for the matching chainId.
#
# Usage:
#   ./scripts/update-addresses.sh packages/contracts/deployments/sepolia.json
#   ./scripts/update-addresses.sh packages/contracts/deployments/local.json
# =============================================================

set -euo pipefail

CONFIG="${1:?Usage: $0 <deployment-json>}"

if [ ! -f "$CONFIG" ]; then
  echo "[ERR] File not found: $CONFIG"
  exit 1
fi

CHAIN_ID=$(jq -r '.chainId' "$CONFIG")
POOL=$(jq -r '.contracts.shieldedPool' "$CONFIG")
RELAYER=$(jq -r '.contracts.relayer' "$CONFIG")
RPC_URL=$(jq -r '.rpcUrl // empty' "$CONFIG")

CONSTANTS="packages/common/src/constants.ts"

if [ ! -f "$CONSTANTS" ]; then
  echo "[ERR] Constants file not found: $CONSTANTS"
  exit 1
fi

echo "=== Update Contract Addresses ==="
echo "Config:   $CONFIG"
echo "Chain ID: $CHAIN_ID"
echo "Pool:     $POOL"
echo "Relayer:  $RELAYER"
echo ""

# Use node to update the addresses (more reliable than sed for nested objects)
node -e "
const fs = require('fs');
const src = fs.readFileSync('$CONSTANTS', 'utf8');

// Replace shieldedPool address for the matching chainId block
let updated = src;

// Find the block for this chainId and update addresses
const chainBlock = new RegExp(
  '(${CHAIN_ID}:\\s*\\{[\\s\\S]*?shieldedPool:\\s*)' + \"'[^']*'\" + '([\\s\\S]*?relayer:\\s*)' + \"'[^']*'\",
);

if (chainBlock.test(updated)) {
  updated = updated.replace(chainBlock, \"\\\$1'$POOL'\\\$2'$RELAYER'\");
  fs.writeFileSync('$CONSTANTS', updated);
  console.log('[OK] Updated constants.ts for chainId $CHAIN_ID');
} else {
  console.error('[ERR] Could not find chainId $CHAIN_ID block in constants.ts');
  process.exit(1);
}
"

echo ""
echo "Done. Rebuild packages: pnpm build"

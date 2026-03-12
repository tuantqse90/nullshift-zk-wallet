#!/usr/bin/env bash
# =============================================================
# NullShift — Deploy Contracts to Sepolia via Foundry
# =============================================================
# Usage:
#   ./deploy/deploy.sh              # Dry run (simulation)
#   ./deploy/deploy.sh --broadcast  # Real deployment
#
# Required env vars (set in .env):
#   DEPLOYER_PRIVATE_KEY   - Private key of deployer
#   SEPOLIA_RPC_URL        - Sepolia RPC endpoint
#   UNISWAP_ROUTER_ADDRESS - Uniswap V3 router on Sepolia
#   ETHERSCAN_API_KEY      - For contract verification
# =============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load .env if exists
if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  source "$ROOT_DIR/.env"
  set +a
fi

# Defaults
SEPOLIA_RPC_URL="${SEPOLIA_RPC_URL:-https://rpc.sepolia.org}"
UNISWAP_ROUTER_ADDRESS="${UNISWAP_ROUTER_ADDRESS:-0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E}"

# Check required vars
if [ -z "${DEPLOYER_PRIVATE_KEY:-}" ]; then
  echo "[ERR] DEPLOYER_PRIVATE_KEY not set. Copy .env.example to .env and fill in values."
  exit 1
fi

echo "=== NullShift Contract Deployment ==="
echo "Network: Sepolia (chainId: 11155111)"
echo "RPC: $SEPOLIA_RPC_URL"
echo ""

# Build first
echo "> forge build"
cd "$ROOT_DIR"
forge build

echo ""
echo "> forge script Deploy"

BROADCAST_FLAG=""
VERIFY_FLAG=""

if [[ "${1:-}" == "--broadcast" ]]; then
  BROADCAST_FLAG="--broadcast"
  echo "[!] BROADCASTING — this will deploy real contracts"

  if [ -n "${ETHERSCAN_API_KEY:-}" ]; then
    VERIFY_FLAG="--verify --etherscan-api-key $ETHERSCAN_API_KEY"
    echo "[+] Will verify on Etherscan"
  fi
else
  echo "[i] Dry run — add --broadcast to deploy for real"
fi

echo ""

forge script script/Deploy.s.sol:Deploy \
  --rpc-url "$SEPOLIA_RPC_URL" \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  $BROADCAST_FLAG \
  $VERIFY_FLAG \
  -vvv

echo ""
echo "=== Done ==="

if [[ "${1:-}" == "--broadcast" ]]; then
  echo ""
  echo "Deployment artifacts saved to: broadcast/"
  echo "To verify manually:"
  echo "  forge verify-contract <ADDRESS> <CONTRACT> --chain sepolia --etherscan-api-key \$ETHERSCAN_API_KEY"
fi

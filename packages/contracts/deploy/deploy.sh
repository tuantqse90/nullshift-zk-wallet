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
#   ETHERSCAN_API_KEY      - For contract verification (optional)
# =============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DEPLOY_DIR="$ROOT_DIR/deployments"

mkdir -p "$DEPLOY_DIR"

# Load .env if exists
if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  source "$ROOT_DIR/.env"
  set +a
fi

# Defaults
SEPOLIA_RPC_URL="${SEPOLIA_RPC_URL:-https://rpc.sepolia.org}"

# Check required vars
if [ -z "${DEPLOYER_PRIVATE_KEY:-}" ]; then
  echo "[ERR] DEPLOYER_PRIVATE_KEY not set. Copy .env.example to .env and fill in values."
  exit 1
fi

# Derive deployer address
DEPLOYER_ADDR=$(cast wallet address "$DEPLOYER_PRIVATE_KEY" 2>/dev/null || echo "unknown")

echo "=== NullShift Contract Deployment ==="
echo "Network:  Sepolia (chainId: 11155111)"
echo "RPC:      $SEPOLIA_RPC_URL"
echo "Deployer: $DEPLOYER_ADDR"
echo ""

# Check balance
if [ "$DEPLOYER_ADDR" != "unknown" ]; then
  BALANCE=$(cast balance "$DEPLOYER_ADDR" --rpc-url "$SEPOLIA_RPC_URL" 2>/dev/null || echo "0")
  BALANCE_ETH=$(cast from-wei "$BALANCE" 2>/dev/null || echo "unknown")
  echo "Balance:  $BALANCE_ETH ETH"

  if [ "$BALANCE" = "0" ]; then
    echo ""
    echo "[ERR] Deployer has 0 ETH. Fund the wallet first:"
    echo "  Address: $DEPLOYER_ADDR"
    echo "  Faucets:"
    echo "    - https://www.alchemy.com/faucets/ethereum-sepolia"
    echo "    - https://faucets.chain.link/sepolia"
    echo "    - https://sepolia-faucet.pk910.de (PoW mining)"
    exit 1
  fi
fi

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
  else
    echo "[i] No ETHERSCAN_API_KEY — skipping verification"
  fi
else
  echo "[i] Dry run — add --broadcast to deploy for real"
fi

echo ""

OUTPUT=$(forge script script/Deploy.s.sol:Deploy \
  --rpc-url "$SEPOLIA_RPC_URL" \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  $BROADCAST_FLAG \
  $VERIFY_FLAG \
  -vvv 2>&1) || {
    echo "$OUTPUT"
    echo ""
    echo "[ERR] Deployment failed"
    exit 1
  }

echo "$OUTPUT"

# ── Parse addresses ──────────────────────────────────────
parse_addr() {
  echo "$OUTPUT" | grep "$1=" | sed "s/.*$1=//" | tr -d ' '
}

DEPOSIT_VERIFIER=$(parse_addr "DEPOSIT_VERIFIER")
TRANSFER_VERIFIER=$(parse_addr "TRANSFER_VERIFIER")
WITHDRAW_VERIFIER=$(parse_addr "WITHDRAW_VERIFIER")
SWAP_VERIFIER=$(parse_addr "SWAP_VERIFIER")
SHIELDED_POOL=$(parse_addr "SHIELDED_POOL")
RELAYER=$(parse_addr "RELAYER")

# Only write config on real broadcast
if [[ "${1:-}" == "--broadcast" ]] && [ -n "$SHIELDED_POOL" ]; then
  cat > "$DEPLOY_DIR/sepolia.json" << EOF
{
  "network": "sepolia",
  "chainId": 11155111,
  "rpcUrl": "$SEPOLIA_RPC_URL",
  "blockExplorer": "https://sepolia.etherscan.io",
  "contracts": {
    "depositVerifier": "$DEPOSIT_VERIFIER",
    "transferVerifier": "$TRANSFER_VERIFIER",
    "withdrawVerifier": "$WITHDRAW_VERIFIER",
    "swapVerifier": "$SWAP_VERIFIER",
    "shieldedPool": "$SHIELDED_POOL",
    "relayer": "$RELAYER"
  },
  "deployer": "$DEPLOYER_ADDR",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

  echo ""
  echo "=== Deployment Complete ==="
  echo ""
  echo "  ShieldedPool: $SHIELDED_POOL"
  echo "  Relayer:      $RELAYER"
  echo ""
  echo "  Config saved: deployments/sepolia.json"
  echo "  Explorer:     https://sepolia.etherscan.io/address/$SHIELDED_POOL"
  echo ""

  if [ -z "${ETHERSCAN_API_KEY:-}" ]; then
    echo "  To verify manually:"
    echo "    forge verify-contract $SHIELDED_POOL ShieldedPool --chain sepolia --etherscan-api-key \$ETHERSCAN_API_KEY"
    echo "    forge verify-contract $RELAYER Relayer --chain sepolia --etherscan-api-key \$ETHERSCAN_API_KEY"
  fi
else
  echo ""
  echo "=== Dry Run Complete ==="
  echo "  Add --broadcast to deploy for real"
fi

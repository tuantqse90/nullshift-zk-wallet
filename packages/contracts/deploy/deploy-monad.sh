#!/usr/bin/env bash
# =============================================================
# NullShift — Deploy Contracts to Monad Mainnet via Foundry
# =============================================================
# Usage:
#   ./deploy/deploy-monad.sh              # Dry run (simulation)
#   ./deploy/deploy-monad.sh --broadcast  # Real deployment
#
# Required env vars (set in .env):
#   DEPLOYER_PRIVATE_KEY   - Private key of deployer
#   MONAD_RPC_URL          - Monad RPC endpoint (default: https://rpc.monad.xyz)
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
MONAD_RPC_URL="${MONAD_RPC_URL:-https://rpc.monad.xyz}"

# Check required vars
if [ -z "${DEPLOYER_PRIVATE_KEY:-}" ]; then
  echo "[ERR] DEPLOYER_PRIVATE_KEY not set. Copy .env.example to .env and fill in values."
  exit 1
fi

# Derive deployer address
DEPLOYER_ADDR=$(cast wallet address "$DEPLOYER_PRIVATE_KEY" 2>/dev/null || echo "unknown")

echo "=== NullShift Contract Deployment ==="
echo "Network:  Monad Mainnet (chainId: 143)"
echo "RPC:      $MONAD_RPC_URL"
echo "Deployer: $DEPLOYER_ADDR"
echo ""

# Check balance
if [ "$DEPLOYER_ADDR" != "unknown" ]; then
  BALANCE=$(cast balance "$DEPLOYER_ADDR" --rpc-url "$MONAD_RPC_URL" 2>/dev/null || echo "0")
  BALANCE_MON=$(cast from-wei "$BALANCE" 2>/dev/null || echo "unknown")
  echo "Balance:  $BALANCE_MON MON"

  if [ "$BALANCE" = "0" ]; then
    echo ""
    echo "[ERR] Deployer has 0 MON. Fund the wallet first:"
    echo "  Address: $DEPLOYER_ADDR"
    echo "  Bridge: https://monad.xyz/bridge"
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
  echo "[!] BROADCASTING — this will deploy real contracts on Monad Mainnet"

  if [ -n "${MONAD_EXPLORER_API_KEY:-}" ]; then
    VERIFY_FLAG="--verify --verifier-url https://api.monadscan.com/api --etherscan-api-key $MONAD_EXPLORER_API_KEY"
    echo "[+] Will verify on Monadscan"
  else
    echo "[i] No MONAD_EXPLORER_API_KEY — skipping verification"
  fi
else
  echo "[i] Dry run — add --broadcast to deploy for real"
fi

echo ""

OUTPUT=$(forge script script/Deploy.s.sol:Deploy \
  --rpc-url "$MONAD_RPC_URL" \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  --chain-id 143 \
  --legacy \
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
  cat > "$DEPLOY_DIR/monad.json" << EOF
{
  "network": "monad",
  "chainId": 143,
  "rpcUrl": "$MONAD_RPC_URL",
  "blockExplorer": "https://monadscan.com",
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
  echo "  Config saved: deployments/monad.json"
  echo "  Explorer:     https://monadscan.com/address/$SHIELDED_POOL"
  echo ""
  echo "  Update extension:"
  echo "    pnpm run update-addresses packages/contracts/deployments/monad.json"
  echo "    pnpm build"
else
  echo ""
  echo "=== Dry Run Complete ==="
  echo "  Add --broadcast to deploy for real"
fi

#!/usr/bin/env bash
# =============================================================
# NullShift — Local Development Environment
# =============================================================
# Starts Anvil (Foundry local chain) and deploys all contracts.
# Outputs contract addresses to deployments/local.json
#
# Usage:
#   ./deploy/dev.sh          # Start Anvil + deploy
#   ./deploy/dev.sh --no-anvil  # Deploy only (Anvil already running)
# =============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DEPLOY_DIR="$ROOT_DIR/deployments"

mkdir -p "$DEPLOY_DIR"

RPC_URL="http://127.0.0.1:8545"
ANVIL_PID=""

cleanup() {
  if [ -n "$ANVIL_PID" ]; then
    echo ""
    echo "[i] Stopping Anvil (PID: $ANVIL_PID)"
    kill "$ANVIL_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# ── Start Anvil ──────────────────────────────────────────
if [[ "${1:-}" != "--no-anvil" ]]; then
  echo "=== NullShift Local Dev ==="
  echo ""
  echo "> Starting Anvil..."

  # Kill any existing Anvil on port 8545
  lsof -ti:8545 | xargs kill -9 2>/dev/null || true

  anvil --block-time 1 --silent &
  ANVIL_PID=$!
  echo "[+] Anvil started (PID: $ANVIL_PID)"
  echo "[+] RPC: $RPC_URL"
  echo "[+] Chain ID: 31337"
  echo ""

  # Wait for Anvil to be ready
  for i in $(seq 1 10); do
    if cast chain-id --rpc-url "$RPC_URL" 2>/dev/null; then
      break
    fi
    sleep 0.5
  done
else
  echo "=== NullShift Deploy (Anvil already running) ==="
fi

# ── Build + Deploy ───────────────────────────────────────
echo ""
echo "> forge build"
cd "$ROOT_DIR"
forge build --silent

echo "> Deploying contracts..."
echo ""

OUTPUT=$(forge script script/DeployLocal.s.sol:DeployLocal \
  --rpc-url "$RPC_URL" \
  --broadcast \
  -vv 2>&1)

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

# ── Write JSON config ────────────────────────────────────
cat > "$DEPLOY_DIR/local.json" << EOF
{
  "network": "local",
  "chainId": 31337,
  "rpcUrl": "$RPC_URL",
  "blockExplorer": null,
  "contracts": {
    "depositVerifier": "$DEPOSIT_VERIFIER",
    "transferVerifier": "$TRANSFER_VERIFIER",
    "withdrawVerifier": "$WITHDRAW_VERIFIER",
    "swapVerifier": "$SWAP_VERIFIER",
    "shieldedPool": "$SHIELDED_POOL",
    "relayer": "$RELAYER"
  },
  "deployer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "  ShieldedPool: $SHIELDED_POOL"
echo "  Relayer:      $RELAYER"
echo ""
echo "  Config saved: deployments/local.json"
echo ""

# ── Keep Anvil running ───────────────────────────────────
if [ -n "$ANVIL_PID" ]; then
  echo "  Anvil running on $RPC_URL (Ctrl+C to stop)"
  echo ""
  echo "  Test accounts (10000 ETH each):"
  echo "    #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  echo "    #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  echo "    #2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
  echo ""
  wait "$ANVIL_PID"
fi

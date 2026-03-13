#!/usr/bin/env bash
# =============================================================
# NullShift — Verify Deployed Contracts on Sepolia
# =============================================================
# Usage:
#   ./deploy/verify.sh                         # Verify from sepolia.json
#   ./deploy/verify.sh deployments/sepolia.json # Custom config path
# =============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load .env
if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  source "$ROOT_DIR/.env"
  set +a
fi

# Config file
CONFIG="${1:-$ROOT_DIR/deployments/sepolia.json}"

if [ ! -f "$CONFIG" ]; then
  echo "[ERR] Config file not found: $CONFIG"
  echo "  Run ./deploy/deploy.sh --broadcast first"
  exit 1
fi

# Parse addresses from JSON
SHIELDED_POOL=$(jq -r '.contracts.shieldedPool' "$CONFIG")
RELAYER=$(jq -r '.contracts.relayer' "$CONFIG")
DEPOSIT_VERIFIER=$(jq -r '.contracts.depositVerifier' "$CONFIG")
TRANSFER_VERIFIER=$(jq -r '.contracts.transferVerifier' "$CONFIG")
WITHDRAW_VERIFIER=$(jq -r '.contracts.withdrawVerifier' "$CONFIG")
SWAP_VERIFIER=$(jq -r '.contracts.swapVerifier' "$CONFIG")
RPC_URL=$(jq -r '.rpcUrl' "$CONFIG")
CHAIN_ID=$(jq -r '.chainId' "$CONFIG")

echo "=== NullShift Contract Verification ==="
echo "Config:   $CONFIG"
echo "Chain ID: $CHAIN_ID"
echo ""

# Determine chain name for forge
CHAIN_NAME="sepolia"
if [ "$CHAIN_ID" = "1" ]; then
  CHAIN_NAME="mainnet"
fi

check_contract() {
  local name=$1
  local addr=$2

  # Check if contract exists
  CODE=$(cast code "$addr" --rpc-url "$RPC_URL" 2>/dev/null || echo "0x")
  if [ "$CODE" = "0x" ] || [ -z "$CODE" ]; then
    echo "  [FAIL] $name ($addr) — no code at address"
    return 1
  fi
  CODE_LEN=${#CODE}
  echo "  [OK]   $name ($addr) — code length: $CODE_LEN"
  return 0
}

echo "> Checking contract deployments..."
echo ""

PASS=0
FAIL=0

for pair in \
  "DepositVerifier :$DEPOSIT_VERIFIER" \
  "TransferVerifier:$TRANSFER_VERIFIER" \
  "WithdrawVerifier:$WITHDRAW_VERIFIER" \
  "SwapVerifier    :$SWAP_VERIFIER" \
  "ShieldedPool    :$SHIELDED_POOL" \
  "Relayer         :$RELAYER"; do
  name="${pair%%:*}"
  addr="${pair#*:}"
  if check_contract "$name" "$addr"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
  fi
done

echo ""

# Call view functions on ShieldedPool
echo "> Calling ShieldedPool view functions..."
echo ""

ROOT=$(cast call "$SHIELDED_POOL" "getMerkleRoot()(bytes32)" --rpc-url "$RPC_URL" 2>/dev/null || echo "ERROR")
echo "  getMerkleRoot():      $ROOT"

NEXT_INDEX=$(cast call "$SHIELDED_POOL" "getNextLeafIndex()(uint256)" --rpc-url "$RPC_URL" 2>/dev/null || echo "ERROR")
echo "  getNextLeafIndex():   $NEXT_INDEX"

VK_HASH=$(cast call "$DEPOSIT_VERIFIER" "getVerificationKeyHash()(bytes32)" --rpc-url "$RPC_URL" 2>/dev/null || echo "ERROR")
echo "  DepositVerifier VK:   $VK_HASH"

echo ""
echo "=== Verification Complete: $PASS passed, $FAIL failed ==="

# Etherscan verification
if [ -n "${ETHERSCAN_API_KEY:-}" ] && [[ "${2:-}" == "--etherscan" ]]; then
  echo ""
  echo "> Verifying source on Etherscan..."
  echo ""

  cd "$ROOT_DIR"

  forge verify-contract "$DEPOSIT_VERIFIER" DepositVerifier --chain "$CHAIN_NAME" --etherscan-api-key "$ETHERSCAN_API_KEY" || true
  forge verify-contract "$TRANSFER_VERIFIER" TransferVerifier --chain "$CHAIN_NAME" --etherscan-api-key "$ETHERSCAN_API_KEY" || true
  forge verify-contract "$WITHDRAW_VERIFIER" WithdrawVerifier --chain "$CHAIN_NAME" --etherscan-api-key "$ETHERSCAN_API_KEY" || true
  forge verify-contract "$SWAP_VERIFIER" SwapVerifier --chain "$CHAIN_NAME" --etherscan-api-key "$ETHERSCAN_API_KEY" || true
  forge verify-contract "$SHIELDED_POOL" ShieldedPool --chain "$CHAIN_NAME" --etherscan-api-key "$ETHERSCAN_API_KEY" || true
  forge verify-contract "$RELAYER" Relayer --chain "$CHAIN_NAME" --etherscan-api-key "$ETHERSCAN_API_KEY" || true

  echo ""
  echo "=== Etherscan Verification Done ==="
fi

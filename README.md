# NullShift — ZK Privacy Wallet

> Shielded transfers, private balances, anonymous DeFi — powered by Noir ZK proofs on Monad.

Chrome MV3 extension wallet using UTXO commitment model with Pedersen/Poseidon hashing.
Client-side proof generation via Barretenberg WASM. No tracking, no analytics, dark mode only.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Chrome Extension (MV3)                              │
│  ┌──────────┐ ┌─────────┐ ┌───────────┐            │
│  │  Popup   │ │Dashboard│ │ SidePanel │   React UI  │
│  └────┬─────┘ └────┬────┘ └─────┬─────┘            │
│       │            │            │                    │
│       └────────────┼────────────┘                    │
│                    │                                 │
│           ┌────────▼────────┐                        │
│           │   Background    │  KeyManager, Provider  │
│           │ Service Worker  │  Note storage, Tx exec │
│           └────────┬────────┘                        │
│                    │                                 │
│           ┌────────▼────────┐                        │
│           │   Offscreen     │  Barretenberg WASM     │
│           │   Document      │  ZK proof generation   │
│           └─────────────────┘                        │
└─────────────────────────────────────────────────────┘
                     │
          ┌──────────▼──────────┐
          │   Monad (EVM)        │
          │  ┌────────────────┐  │
          │  │  ShieldedPool  │  │  Merkle tree, deposits,
          │  │                │  │  transfers, withdrawals
          │  └────────────────┘  │
          │  ┌────────────────┐  │
          │  │    Relayer     │  │  Anonymous DEX swaps
          │  └────────────────┘  │
          │  ┌────────────────┐  │
          │  │  4x Verifiers  │  │  UltraPlonk on-chain
          │  └────────────────┘  │
          └──────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| ZK Circuits | Noir (Aztec) → ACIR → UltraPlonk |
| Proof Engine | Barretenberg WASM (bb.js) |
| Contracts | Solidity 0.8.24, Foundry |
| Chain | Monad (chainId: 143) — 10k TPS EVM |
| Extension | Chrome MV3, React 18, TypeScript, Zustand, Tailwind |
| SDK | ethers.js v6, bb.js, vitest |
| Build | Turborepo + pnpm workspaces, Webpack 5 |

## Monorepo Structure

```
packages/
  circuits/     # 4 Noir ZK circuits (deposit, transfer, withdraw, swap)
  contracts/    # Solidity: ShieldedPool, Relayer, 4 UltraPlonk verifiers
  sdk/          # Core TS library: KeyManager, NoteManager, Prover, crypto
  extension/    # Chrome Extension MV3 (7 entry points)
  common/       # Shared types, constants, message protocol
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Build everything
pnpm build

# Run all tests (48+ tests)
pnpm run test:all

# Local development (Anvil + contracts)
pnpm run dev:local

# E2E demo (deposit + ZK proof)
pnpm run demo
```

## Load Extension

1. `pnpm build`
2. Open `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" → select `packages/extension/dist/`

## Deploy to Monad

```bash
cd packages/contracts
cp .env.example .env
# Set DEPLOYER_PRIVATE_KEY (fund with MON first)

# Dry run
pnpm run deploy:monad:dry-run

# Real deployment
pnpm run deploy:monad

# Verify contracts
pnpm run verify:monad

# Update extension addresses
pnpm run update-addresses packages/contracts/deployments/monad.json
pnpm build
```

## Deploy to Sepolia

```bash
cd packages/contracts
cp .env.example .env
# Set DEPLOYER_PRIVATE_KEY, ETHERSCAN_API_KEY (optional)

# Dry run
pnpm run deploy:dry-run

# Real deployment
pnpm run deploy:sepolia

# Verify contracts
pnpm run verify:sepolia

# Update extension addresses
pnpm run update-addresses packages/contracts/deployments/sepolia.json
pnpm build
```

## Test Summary

| Package | Framework | Tests | Status |
|---------|-----------|-------|--------|
| Circuits | nargo test | 11 | All pass |
| Contracts | Foundry | 20 | All pass |
| SDK | vitest | 17 | All pass |
| Extension | webpack | builds clean | All pass |
| E2E Demo | tsx script | deposit + ZK proof | Working |

## Security

- ZK circuits: Nullifier uniqueness constraint prevents double-spend
- Contracts: DuplicateNullifier check, InvalidRecipient validation
- Extension: Privileged message validation, encrypted note storage (AES-256-GCM)
- Vault: PBKDF2 600k iterations + AES-256-GCM
- Events: Privacy-preserving (no amounts/recipients leaked on-chain)
- CSP: `wasm-unsafe-eval` for Barretenberg WASM only

## Supported Networks

| Network | Chain ID | RPC | Status |
|---------|----------|-----|--------|
| Monad | 143 | rpc.monad.xyz | Default — ready to deploy |
| Anvil Local | 31337 | localhost:8545 | Deployed |
| Ethereum Sepolia | 11155111 | rpc.sepolia.org | Ready to deploy |
| Ethereum Mainnet | 1 | — | Planned |

## License

MIT

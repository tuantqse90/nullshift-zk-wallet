# NullShift ZK Privacy Wallet

> **Version**: 0.1.0
> **Last Updated**: 2026-03-12
> **Status**: [BUILDING]
> **Pillar**: Privacy + ZK + Blockchain

Privacy-focused EVM browser extension wallet with zero-knowledge proofs. Shield your funds, transfer privately, swap anonymously — all client-side, no trusted third party.

## One-liner

A Chrome Extension crypto wallet that uses Noir ZK circuits for shielded transfers, private balances, and anonymous DeFi on EVM chains.

## Features

- **Shielded Transfers** — Send tokens without revealing sender, recipient, or amount on-chain
- **Private Balances** — Shield/unshield funds between public and private pools
- **Anonymous Swaps** — Interact with Uniswap-style AMMs without exposing your identity
- **Client-side Proofs** — All ZK proofs generated locally via Barretenberg WASM
- **dApp Integration** — EIP-1193 compatible provider with privacy extensions
- **UTXO Note Model** — Pedersen commitments + Poseidon nullifiers on Merkle tree
- **Multi-chain** — Ethereum + Monad support

## Tech Stack

| Layer | Technology |
|-------|-----------|
| ZK Circuits | Noir (Aztec) → ACIR → UltraPlonk |
| Prover | Barretenberg (bb.js/WASM) |
| Smart Contracts | Solidity 0.8.x (Foundry + Hardhat) |
| Extension | Chrome MV3, React 18, TypeScript |
| SDK | @nullshift/sdk — proof gen, note mgmt, key derivation |
| Build | Turborepo + Webpack |

## Quick Start

```bash
# Clone and install
git clone <repo-url>
cd nullshift-wallet
pnpm install

# Build circuits
cd packages/circuits
nargo compile
nargo test

# Build contracts
cd packages/contracts
forge build
forge test

# Build extension
cd packages/extension
pnpm dev

# Load in Chrome: chrome://extensions -> Load unpacked -> packages/extension/dist
```

## Architecture

```
nullshift-wallet/
├── packages/
│   ├── circuits/       # Noir ZK circuits
│   ├── contracts/      # Solidity smart contracts
│   ├── sdk/            # Core TypeScript library
│   ├── extension/      # Chrome Extension MV3
│   └── common/         # Shared types & utils
├── turbo.json
└── package.json
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for full system design.

## Related Docs

- [Architecture](ARCHITECTURE.md) — System design & data flow
- [Tech Stack](TECH_STACK.md) — All dependencies & decisions
- [Dev Guide](DEV_GUIDE.md) — Setup, conventions, workflow
- [Testing Plan](TESTING_PLAN.md) — Test strategy & coverage
- [Deployment](DEPLOYMENT.md) — CI/CD & deployment config
- [Security](SECURITY.md) — Threat model & audit checklist
- [Roadmap](ROADMAP.md) — Phases & milestones
- [Contract Spec](CONTRACT_SPEC.md) — Smart contract specification
- [UI Spec](UI_SPEC.md) — Extension UI design
- [Integration](INTEGRATION.md) — Third-party integrations
- [Brand Tokens](BRAND_TOKENS.md) — Design system tokens

---

*NullShift Labs — "Privacy is not a feature, it's a foundation."*

# Tech Stack — NullShift ZK Privacy Wallet

> **Version**: 0.1.0
> **Last Updated**: 2026-03-12

## Overview

| Layer | Primary | Version | Purpose |
|-------|---------|---------|---------|
| ZK Circuits | Noir | latest | ZK-SNARK circuit DSL |
| Prover/Verifier | Barretenberg (bb.js) | latest | UltraPlonk prover, WASM client-side |
| Smart Contracts | Solidity | 0.8.x | On-chain shielded pool, verifier |
| Contract Tooling | Foundry + Hardhat | latest | Testing (Foundry), deployment (Hardhat) |
| Extension | Chrome MV3 | MV3 | Browser extension platform |
| Frontend | React 18 | 18.x | Popup, dashboard, side panel UI |
| Language | TypeScript | 5.x | Strict mode, all packages |
| State Management | Zustand | 4.x | Lightweight store for extension |
| Styling | Tailwind CSS | 3.x | Utility-first with NullShift theme |
| Chain Interaction | ethers.js | 6.x | EVM provider, contract calls |
| Monorepo | Turborepo | latest | Build orchestration |
| Package Manager | pnpm | 8.x | Workspace management |
| Bundler | Webpack | 5.x | Multi-entry extension build |
| Testing (TS) | Vitest | latest | SDK & extension unit tests |
| Testing (Contracts) | Forge (Foundry) | latest | Solidity tests |
| CI/CD | GitHub Actions | — | Build, test, lint pipeline |

## ZK Layer

### Noir (Aztec)
- **Why**: Purpose-built ZK DSL, compiles to ACIR, great dev experience, active ecosystem
- **Alternatives considered**: Circom (more mature but less ergonomic), Halo2 (too low-level), SP1 (overkill for our circuits)
- **Usage**: All privacy circuits — shielded transfer, deposit, withdraw, anonymous swap

### Barretenberg (bb.js)
- **Why**: Native Noir backend, UltraPlonk proof system, WASM support for browser
- **Key constraint**: Must run in Offscreen Document (not service worker) due to WASM limitations in MV3
- **Proving time target**: <15s for shielded transfer on mid-range hardware

## Smart Contract Layer

### Solidity 0.8.x
- **Why**: Standard EVM contract language, mature tooling
- **Contracts**: ShieldedPool, MerkleTree (library), UltraVerifier (auto-generated), Relayer

### Foundry
- **Why**: Fast Solidity testing, fuzzing, gas reports
- **Usage**: Primary test framework for contracts

### Hardhat
- **Why**: Deployment scripts, network management, Monad RPC compatibility
- **Usage**: Deployment only (Foundry handles testing)

## Extension Layer

### Chrome Manifest V3
- **Why**: Required for Chrome Web Store, modern extension architecture
- **Key patterns**: Service worker (background), Offscreen Document (WASM), Side Panel API

### React 18
- **Why**: Component model, hooks, concurrent features for proof loading states
- **Alternatives considered**: Svelte (smaller bundle but less ecosystem), Solid (similar tradeoff)

### Zustand
- **Why**: Minimal boilerplate, works great in extension context, <1kb
- **Alternatives considered**: Redux (too heavy), Jotai (atomic but more complex setup)

### Tailwind CSS
- **Why**: Utility-first, easy to enforce NullShift dark theme, small production bundle with purge
- **Custom config**: NullShift color palette, JetBrains Mono font, terminal-style components

### Webpack 5
- **Why**: Multiple entry points needed for extension (popup, dashboard, sidepanel, background, content, inpage)
- **Alternatives considered**: Vite (poor multi-entry support for extensions), esbuild (lacks plugin ecosystem for MV3)

## SDK Layer

### ethers.js v6
- **Why**: Lightweight, TypeScript-first, good provider abstraction
- **Alternatives considered**: viem (newer but less battle-tested for complex contract interactions)

### bb.js (Barretenberg WASM)
- **Why**: Only compatible prover for Noir/ACIR circuits in browser
- **Integration**: Loaded in Offscreen Document, communicates with background via message passing

## Crypto Libraries

| Library | Purpose |
|---------|---------|
| `@noble/hashes` | Poseidon, Pedersen hash implementations |
| `@noble/curves` | Elliptic curve operations for key derivation |
| `bip39` | Mnemonic generation/validation |
| `@scure/bip32` | HD key derivation (BIP-44) |

## Build & Dev

### Turborepo
- **Why**: Incremental builds, task dependencies across packages
- **Pipeline**: circuits → contracts → sdk → extension

### pnpm
- **Why**: Strict dependency resolution, workspace support, disk efficient
- **Workspaces**: packages/*

## Target Chains

| Chain | RPC | Status |
|-------|-----|--------|
| Ethereum Sepolia | Infura/Alchemy | Primary testnet |
| Ethereum Mainnet | Infura/Alchemy | Production target |
| Monad Testnet | Monad RPC | Secondary target |

## Related Docs

- [Architecture](ARCHITECTURE.md) — How these fit together
- [Dev Guide](DEV_GUIDE.md) — Setup instructions
- [Deployment](DEPLOYMENT.md) — CI/CD pipeline

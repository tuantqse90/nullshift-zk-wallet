# Progress — NullShift ZK Privacy Wallet

## Current Phase: Phase 7 — Security Audit (Complete)

### Sprint Log

| Date | Task | Status | Files Changed | Notes |
|------|------|--------|---------------|-------|
| 2026-03-12 | Project initialized | Done | All docs, CLAUDE.md, progress.md | Scaffolded by Claude — full doc suite generated |
| 2026-03-12 | Monorepo scaffolded | Done | 80 files across all packages | Root configs, circuits (4), contracts (4), common (4), sdk (6), extension (17) |
| 2026-03-12 | pnpm install + build verified | Done | tsconfig fixes, CSS fixes | All 3 TS packages build clean, extension webpack compiles 7 entry points |
| 2026-03-12 | ZK circuits implemented + tested | Done | 4 circuit main.nr files rewritten | deposit (3/3), shielded_transfer (2/2), withdraw (3/3), anonymous_swap (3/3) -- all 11 tests pass |
| 2026-03-12 | Circuit artifacts + Solidity verifiers | Done | 4 VKs, 5 verifier .sol files, tests, deploy script | BaseUltraVerifier + 4 circuit-specific verifiers, 17/17 Foundry tests pass |
| 2026-03-12 | SDK fully implemented | Done | crypto.ts, abi.ts, keys.ts, notes.ts, tree.ts, prover.ts, tx.ts | KeyManager, NoteManager, Prover, MerkleTreeSync, TransactionBuilder all wired up |
| 2026-03-12 | MerkleTree.sol Poseidon migration | Done | MerkleTree.sol, 3 circuit main.nr, 3 verifier VKs | PoseidonT3 on-chain, poseidon::bn254::hash_2 in circuits, all tests pass |
| 2026-03-13 | Extension wiring (offscreen + background + popup) | Done | offscreen/index.ts, background/index.ts, popup/App.tsx, HomeScreen.tsx, LockScreen.tsx | Full message router, wallet lifecycle, vault encryption, proof delegation, Shield/Send/Unshield modals |
| 2026-03-13 | Dashboard wired to real state | Done | dashboard/App.tsx | Portfolio, Notes, Activity, Settings tabs with live store data |
| 2026-03-13 | SidePanel wired with proof monitor | Done | sidepanel/App.tsx | Proof progress bar, activity feed, privacy stats footer |
| 2026-03-13 | Fixed 13 extension build errors | Done | offscreen, background, popup, common/messages.ts | Type fixes: bigint amounts, 0x casts, Awaited<> types, ResponseMap address |
| 2026-03-13 | E2E proof verification test | Done | test/E2E.t.sol, scripts/generate-test-proof.ts | Real Noir proof verified on-chain via UltraPlonk Solidity verifier, 3/3 pass |
| 2026-03-13 | SDK integration tests | Done | test/keys.test.ts, test/crypto.test.ts, test/prover.test.ts | 17 vitest tests: KeyManager vault encrypt/decrypt, crypto utils, real proof gen |
| 2026-03-13 | Deployment infrastructure | Done | deploy/deploy.sh, .env.example, prover.ts fix | Foundry deploy script with dry-run/broadcast/verify, fixed DepositInput type |
| 2026-03-13 | Security audit: ZK circuits | Done | shielded_transfer/src/main.nr | Added nullifier uniqueness constraint (prevent double-spend with same note) |
| 2026-03-13 | Security audit: Smart contracts | Done | ShieldedPool.sol | Added DuplicateNullifier check in transact(), InvalidRecipient check in withdraw() |
| 2026-03-13 | Security audit: Extension | Done | background/index.ts, content/index.ts, manifest.json, 4 icon SVGs | Privileged message sender validation, dApp payload shape validation, postMessage origin restriction, icon assets created |
| 2026-03-13 | Local dev environment (Anvil) | Done | DeployLocal.s.sol, deploy/dev.sh, deployments/local.json | One-command local chain + full contract deploy, outputs JSON config |
| 2026-03-13 | E2E demo script | Done | scripts/demo.ts, crypto.ts (Barretenberg Fr wrapper) | Full pipeline: keys → deposit → on-chain verify → ZK proof (18.9s), fixed bb.js Fr API |
| 2026-03-13 | SDK crypto.ts Barretenberg fix | Done | crypto.ts, index.ts | Fixed bb.js Fr wrapping, added randomFieldElement() for BN254-safe values |
| 2026-03-13 | Background SDK wiring | Done | background/index.ts, package.json | Replaced SHA-256 stubs with SDK KeyManager (BIP-39/BIP-44), ethers.js balance queries, note persistence |
| 2026-03-13 | Privacy leak assessment | Done | Full audit report | 3 CRITICAL + 2 HIGH + 5 MEDIUM findings across contracts/circuits/extension |
| 2026-03-13 | Privacy leak fixes | Done | ShieldedPool.sol, background/index.ts, inpage/index.ts, abi.ts | Removed amounts from events, encrypted note storage, generic dApp errors, postMessage origin lock |
| 2026-03-13 | Local network + scripts | Done | common/constants.ts, common/types.ts, package.json | Added chainId 31337 (Anvil) with contract addresses, npm scripts: dev:local, demo, test:all |
| 2026-03-13 | Regenerated TransferVerifier | Done | TransferVerifier.sol, shielded_transfer VK | New VK after nullifier uniqueness circuit change, all 20 Foundry tests pass |
| 2026-03-13 | Phase 8: Sepolia deploy infra | Done | Deploy.s.sol, deploy.sh, verify.sh, update-addresses.sh | Auto-save JSON, balance check, contract verification, address patching |
| 2026-03-13 | Multi-network extension support | Done | dashboard/App.tsx, HomeScreen.tsx, background/index.ts, messages.ts | Network selector, network-aware provider, SWITCH_NETWORK with name |
| 2026-03-13 | Real transaction flows | Done | background/index.ts, webpack.config.js, abi.ts | Deposit: commitment + on-chain tx + note storage; Withdraw: UTXO select + ZK proof + tx; Transfer: 2-input UTXO + proof + transact; Tree sync from events |
| 2026-03-13 | Circuit artifacts bundled | Done | webpack.config.js | 4 Noir circuit JSONs copied to dist/circuits/ for offscreen proof gen |
| 2026-03-13 | Activity logging | Done | background/index.ts | Shield/Send/Withdraw/Proof events logged, GET_ACTIVITY returns real data |
| 2026-03-13 | GitHub repo created | Done | All files | https://github.com/tuantqse90/nullshift-zk-wallet — 6 commits pushed |
| 2026-03-13 | Monad mainnet migration | Done | types.ts, constants.ts, Deploy.s.sol, deploy-monad.sh, background, walletStore, dashboard, README | ChainId 143, rpc.monad.xyz, monadscan.com, default network = Monad |

### Decision Log

| Date | Decision | Context | Alternatives Considered |
|------|----------|---------|------------------------|
| 2026-03-12 | Monorepo with Turborepo + pnpm | Need coordinated builds across circuits/contracts/sdk/extension | Nx (heavier), Lerna (less maintained), single repo (messy) |
| 2026-03-12 | Webpack 5 for extension bundler | Multiple entry points needed for MV3 extension | Vite (poor multi-entry for extensions), esbuild (lacks MV3 plugins) |
| 2026-03-12 | Zustand for state management | Lightweight, works well in extension context | Redux (too heavy), Jotai (more complex setup) |
| 2026-03-12 | Foundry for contract testing, Hardhat for deployment | Foundry is faster for testing/fuzzing, Hardhat better for deploy scripts + Monad compat | Foundry-only (deploy scripts less flexible), Hardhat-only (slower tests) |
| 2026-03-12 | Offscreen Document for WASM proof gen | MV3 service workers can't run WASM efficiently | Web Worker in popup (limited lifecycle), external prover service (defeats privacy) |
| 2026-03-12 | Immutable contracts (no proxy) for v1 | Simplicity, fewer attack vectors | UUPS proxy (upgradeability but added complexity and risk) |
| 2026-03-12 | Poseidon for Merkle tree hashing | Must match between circuits and contracts | Pedersen (slower on-chain), keccak (not ZK-friendly) |

### Blockers
_None currently_

### Completed Checklist
- [x] Phase 1: Foundation — monorepo, webpack, docs
- [x] Phase 2: ZK Circuits — 4 circuits, 11 tests pass
- [x] Phase 3: Smart Contracts — verifiers, ShieldedPool, 17 Foundry tests, Poseidon MerkleTree
- [x] Phase 4: SDK — keys, notes, tree, prover, tx, crypto, abi
- [x] Phase 5: Chrome Extension — all 7 entry points wired
  - [x] Background service worker (wallet lifecycle, message router, vault encryption)
  - [x] Offscreen document (Noir proof generation via Barretenberg WASM)
  - [x] Popup UI (lock screen, home, shield/send/unshield modals)
  - [x] Dashboard (portfolio, note explorer, activity log, settings)
  - [x] Side Panel (proof monitor, activity feed, privacy stats)
  - [x] Content Script (inpage injection, message relay, origin validation)
  - [x] Inpage Provider (EIP-1193 + EIP-6963, window.nullshift)

- [x] Phase 6: Integration
  - [x] E2E proof pipeline: Noir circuit → Barretenberg proof → Solidity UltraPlonk verification (3 tests)
  - [x] SDK integration tests: KeyManager (8), Crypto (7), Prover (2) — 17 vitest tests pass
  - [x] Deployment script: Foundry `forge script` with dry-run/broadcast, Etherscan verification
  - [x] Fixed DepositInput to include commitment (circuit requires it as public input)

### Test Summary
| Package | Framework | Tests | Status |
|---------|-----------|-------|--------|
| Circuits | nargo test | 11 | All pass |
| Contracts | Foundry | 20 (17+3 E2E) | All pass |
| SDK | vitest | 17 | All pass |
| Extension | webpack | 3 packages build clean | All pass |
| E2E Demo | tsx script | Deposit + ZK proof + verify | Working |
| **Total** | | **48 tests + E2E demo** | **All pass** |

- [x] Phase 7: Security Audit
  - [x] ZK circuits: Added nullifier uniqueness constraint to shielded_transfer (prevents double-spend)
  - [x] Smart contracts: DuplicateNullifier in transact(), InvalidRecipient in withdraw(), all 20 tests pass
  - [x] Extension: Privileged message sender validation, dApp payload shape checking, postMessage origin lock
  - [x] Manifest: SVG icon assets, CSP verified (wasm-unsafe-eval for Barretenberg)
  - [x] Vault: PBKDF2 600k iterations + AES-256-GCM confirmed secure
  - [x] Privacy leak assessment: 3 CRITICAL, 2 HIGH, 5 MEDIUM findings
  - [x] Fixed: Removed amount from Deposit event, recipient/amount from Withdrawal event
  - [x] Fixed: Notes encrypted at rest (AES-256-GCM with password-derived key)
  - [x] Fixed: Generic error messages for dApp requests (no wallet state leaking)
  - [x] Fixed: inpage postMessage uses window.location.origin instead of '*'
  - [x] Added: Anvil local network (chainId 31337) with deployed contract addresses
  - [x] Added: Root npm scripts (dev:local, demo, test:all, test:circuits, test:contracts, test:sdk)

### Security Findings Summary
| Area | Finding | Severity | Status |
|------|---------|----------|--------|
| Circuit | shielded_transfer missing nullifier uniqueness | Critical | Fixed |
| Contract | transact() no duplicate nullifier check | Critical | Fixed |
| Contract | withdraw() no zero-address recipient check | High | Fixed |
| Extension | No sender origin validation on privileged msgs | High | Fixed |
| Extension | Content script postMessage('*') target origin | Medium | Fixed |
| Extension | No dApp payload shape validation | Medium | Fixed |
| Extension | Missing icon assets in manifest | Low | Fixed |
| Vault | PBKDF2 600k + AES-256-GCM | N/A | Good |
| CSP | wasm-unsafe-eval for WASM proofs | N/A | Good |
| Provider | Non-writable window.nullshift + EIP-6963 | N/A | Good |

### Known Limitations (Acceptable for v1)
- Key derivation uses simplified SHA-256 chain (not BIP-39/BIP-32) — production would use HD wallet
- Auto-lock timer is in-memory (service worker may be unloaded by Chrome before timeout)
- No rate limiting on vault unlock attempts

### Phase 8: Testnet Deploy (In Progress)
- [x] Deploy script upgraded: auto-saves deployments/sepolia.json, balance check, address output
- [x] Verification script: `./deploy/verify.sh` checks on-chain code + calls view functions
- [x] Address updater: `./scripts/update-addresses.sh` patches constants.ts from deployment JSON
- [x] Multi-network support: dashboard network selector, popup network fetch, background network-aware provider
- [x] SWITCH_NETWORK payload updated with `name` field
- [x] Root npm scripts: deploy:sepolia, deploy:dry-run, verify:sepolia, update-addresses
- [ ] Fund deployer wallet on Sepolia
- [ ] Deploy contracts: `pnpm deploy:sepolia`
- [ ] Verify contracts: `pnpm verify:sepolia`
- [ ] Update addresses: `pnpm update-addresses packages/contracts/deployments/sepolia.json`
- [ ] Test extension with live Sepolia contracts

### Quick Start (Local Development)
```bash
# Terminal 1: Start local chain + deploy contracts
pnpm dev:local

# Terminal 2: Run E2E demo
pnpm demo

# Run all tests
pnpm test:all

# Build extension (load dist/ as unpacked in chrome://extensions)
pnpm build
```

### Quick Start (Sepolia Deployment)
```bash
# 1. Configure .env
cd packages/contracts
cp .env.example .env
# Edit .env: set DEPLOYER_PRIVATE_KEY, ETHERSCAN_API_KEY (optional)

# 2. Dry run (simulation)
pnpm deploy:dry-run

# 3. Real deployment
pnpm deploy:sepolia

# 4. Verify on-chain
pnpm verify:sepolia

# 5. Update extension addresses
pnpm update-addresses packages/contracts/deployments/sepolia.json
pnpm build
```

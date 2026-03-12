# CLAUDE.md — NullShift ZK Privacy Wallet

## Project Overview
Privacy-focused EVM browser extension wallet (Chrome MV3) using Noir ZK circuits for shielded transfers, private balances, and anonymous DeFi. UTXO commitment model with Pedersen/Poseidon hashing, client-side proof generation via Barretenberg WASM.

## Tech Stack
- **ZK**: Noir (Aztec) → ACIR → UltraPlonk via Barretenberg (bb.js/WASM)
- **Contracts**: Solidity 0.8.x — Foundry (test) + Hardhat (deploy)
- **Extension**: Chrome MV3, React 18, TypeScript, Zustand, Tailwind CSS
- **SDK**: @nullshift/sdk — ethers.js v6, bb.js, vitest
- **Build**: Turborepo + pnpm workspaces, Webpack 5 (extension)
- **Chains**: Ethereum (Sepolia → Mainnet) + Monad

## Key Documentation
- Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Tech Stack: [docs/TECH_STACK.md](docs/TECH_STACK.md)
- Contract Spec: [docs/CONTRACT_SPEC.md](docs/CONTRACT_SPEC.md)
- UI Spec: [docs/UI_SPEC.md](docs/UI_SPEC.md)
- Testing: [docs/TESTING_PLAN.md](docs/TESTING_PLAN.md)
- Deployment: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- Security: [docs/SECURITY.md](docs/SECURITY.md)
- Roadmap: [docs/ROADMAP.md](docs/ROADMAP.md)
- Integration: [docs/INTEGRATION.md](docs/INTEGRATION.md)
- Brand Tokens: [docs/BRAND_TOKENS.md](docs/BRAND_TOKENS.md)
- Dev Guide: [docs/DEV_GUIDE.md](docs/DEV_GUIDE.md)

## Coding Rules
1. Follow conventions in [docs/DEV_GUIDE.md](docs/DEV_GUIDE.md)
2. Write tests for every new feature (target: >80% coverage)
3. TypeScript strict mode — no `any`, proper types everywhere
4. Solidity: NatSpec docs, custom errors, gas-optimized
5. Noir: snake_case, inline constraint comments, 3+ test cases per circuit
6. All commits follow Conventional Commits format
7. No hardcoded secrets — use .env (never commit .env)

## Progress Tracking
**QUAN TRONG**: Sau MOI task hoan thanh, UPDATE [progress.md](progress.md):
- Ghi ngay, task da lam, files changed
- Update status (Done / In Progress / Blocked)
- Neu co decision quan trong → ghi vao Decision Log

## Workflow
1. Doc docs lien quan TRUOC khi code
2. Implement theo ROADMAP phases
3. Test → Lint → Commit → Update progress.md
4. Moi PR phai reference docs neu thay doi architecture/API

## NullShift Standards
- Privacy-first: Minimize data collection, no tracking/analytics
- Terminal aesthetic: CLI-friendly, clean logs, dark mode only
- Solo builder mindset: Pragmatic > Perfect

## Brand Guidelines
**Reference**: https://humorous-courage-production.up.railway.app/brand-guidelines.html
- Colors: Use CSS variables (--color-primary: #00ff41, --color-secondary: #00ffff, etc.)
- Fonts: JetBrains Mono (headings/code/UI), Inter (body text)
- Tone: Technical, direct, no fluff. Write like a README, not a brochure.
- Syntax: `> prefix` for actions, `// comment` for subtitles, `[STATUS]` for tags
- Pillar colors: Privacy=#00ff41, AI=#00ffff, Blockchain=#ff0080, ZK=#a855f7
- Dark mode ONLY. No light backgrounds. No sunshine metaphors.
- No tracking, no analytics cookies, no third-party scripts.

## Monorepo Structure
```
packages/
  circuits/       # Noir ZK circuits (nargo)
  contracts/      # Solidity (Foundry + Hardhat)
  sdk/            # Core TS library (bb.js, ethers.js)
  extension/      # Chrome Extension MV3 (React, Webpack)
  common/         # Shared types & crypto utils
```

## Build Order
circuits → contracts (needs verifiers) → sdk (needs contract ABIs) → extension (needs sdk)

# Dev Guide — NullShift ZK Privacy Wallet

> **Version**: 0.1.0
> **Last Updated**: 2026-03-12

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | >=18.x | `nvm install 18` |
| pnpm | >=8.x | `npm i -g pnpm` |
| Nargo (Noir) | latest | `noirup` |
| Foundry | latest | `curl -L https://foundry.paradigm.xyz \| bash && foundryup` |
| Chrome | >=120 | For extension development |

## Local Setup

```bash
# 1. Clone
git clone <repo-url>
cd nullshift-wallet

# 2. Install all dependencies
pnpm install

# 3. Setup environment
cp .env.example .env
# Fill in: RPC URLs, deployer private key (testnet only)

# 4. Build circuits
pnpm --filter @nullshift/circuits build

# 5. Build contracts
pnpm --filter @nullshift/contracts build

# 6. Build SDK
pnpm --filter @nullshift/sdk build

# 7. Build extension (dev mode with hot reload)
pnpm --filter @nullshift/extension dev

# 8. Load extension in Chrome
# Navigate to chrome://extensions
# Enable "Developer mode"
# Click "Load unpacked" -> select packages/extension/dist
```

## Project Structure

```
nullshift-wallet/
├── packages/
│   ├── circuits/              # Noir ZK circuits
│   │   ├── shielded_transfer/
│   │   ├── deposit/
│   │   ├── withdraw/
│   │   ├── anonymous_swap/
│   │   └── Nargo.toml
│   ├── contracts/             # Solidity smart contracts
│   │   ├── src/
│   │   │   ├── ShieldedPool.sol
│   │   │   ├── MerkleTree.sol
│   │   │   ├── Relayer.sol
│   │   │   └── interfaces/
│   │   ├── test/
│   │   ├── script/
│   │   └── foundry.toml
│   ├── sdk/                   # Core TypeScript library
│   │   ├── src/
│   │   │   ├── keys.ts
│   │   │   ├── notes.ts
│   │   │   ├── prover.ts
│   │   │   ├── tree.ts
│   │   │   └── tx.ts
│   │   └── package.json
│   ├── extension/             # Chrome Extension MV3
│   │   ├── src/
│   │   │   ├── background/
│   │   │   ├── popup/
│   │   │   ├── dashboard/
│   │   │   ├── sidepanel/
│   │   │   ├── content/
│   │   │   ├── inpage/
│   │   │   ├── shared/
│   │   │   └── assets/
│   │   ├── manifest.json
│   │   └── webpack.config.js
│   └── common/                # Shared types & crypto utils
│       ├── src/
│       │   ├── types.ts
│       │   └── crypto.ts
│       └── package.json
├── .env.example
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

## Coding Conventions

### TypeScript
- **Strict mode**: `"strict": true` in all tsconfig.json
- **No `any`**: Use proper types. `unknown` if truly unknown, then narrow.
- **Naming**: camelCase for variables/functions, PascalCase for types/classes, UPPER_SNAKE for constants
- **Imports**: Named imports, no default exports (except React components)
- **Barrel exports**: Use `index.ts` per module

### Solidity
- **NatSpec**: All public/external functions documented
- **Naming**: camelCase for functions/variables, PascalCase for contracts/events, UPPER_SNAKE for constants
- **Error handling**: Custom errors (not require strings)
- **Gas**: Prefer calldata over memory, pack storage slots

### Noir
- **Comments**: Explain each constraint block
- **Naming**: snake_case for all identifiers
- **Tests**: At least 3 test cases per circuit

### CSS/Tailwind
- **NullShift theme only**: Use configured color tokens (`bg-ns-primary`, `text-ns-green`, etc.)
- **No inline styles**: All styling via Tailwind classes
- **Dark mode only**: No light mode variants

## Git Workflow

### Branch Naming
```
feature/short-description
fix/bug-description
chore/task-description
```

### Commit Convention (Conventional Commits)
```
feat(sdk): add UTXO selection algorithm
fix(circuits): correct range check in shielded transfer
chore(extension): update webpack config for side panel
test(contracts): add fuzz tests for MerkleTree
docs: update ARCHITECTURE.md with new data flow
```

### PR Template
```markdown
## What
[Brief description]

## Why
[Motivation]

## Changes
- [List of changes]

## Testing
- [ ] Unit tests pass
- [ ] Circuit tests pass (if ZK changes)
- [ ] Contract tests pass (if Solidity changes)
- [ ] Extension loads and works in Chrome

## Docs Updated
- [ ] Relevant docs updated if architecture/API changed
```

## Common Commands

```bash
# Build all
pnpm build

# Test all
pnpm test

# Lint all
pnpm lint

# Circuits
cd packages/circuits
nargo compile          # Compile circuits
nargo test             # Run circuit tests
nargo prove            # Generate proof

# Contracts
cd packages/contracts
forge build            # Build contracts
forge test             # Run tests
forge test -vvv        # Verbose test output
forge test --gas-report

# SDK
cd packages/sdk
pnpm test              # vitest
pnpm build             # tsc + bundling

# Extension
cd packages/extension
pnpm dev               # Webpack dev build (watch mode)
pnpm build             # Production build
```

## Debugging

### Extension Debugging
- **Background SW**: chrome://extensions → "Inspect views: service worker"
- **Popup**: Right-click extension icon → "Inspect Popup"
- **Content script**: Regular DevTools console (filter by extension)
- **Offscreen**: chrome://extensions → check offscreen document logs

### Circuit Debugging
- Use `std::println` in Noir for debug output during `nargo test`
- Check constraint count: `nargo info`

### Contract Debugging
- Foundry traces: `forge test -vvvv` for full EVM traces
- Use `console.log` from Hardhat's `hardhat/console.sol` during development

## Related Docs

- [Architecture](ARCHITECTURE.md) — System design
- [Tech Stack](TECH_STACK.md) — Dependencies
- [Testing Plan](TESTING_PLAN.md) — Test strategy

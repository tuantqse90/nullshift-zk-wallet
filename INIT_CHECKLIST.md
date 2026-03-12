# Init Checklist — NullShift ZK Privacy Wallet

## Status: Initializing

### Pre-requisites
- [ ] Node.js >= 18.x installed
- [ ] pnpm >= 8.x installed
- [ ] Nargo (Noir compiler) installed — `noirup`
- [ ] Foundry installed — `foundryup`
- [ ] Chrome >= 120 for extension development
- [ ] RPC API keys obtained (Infura/Alchemy for Sepolia)

### Environment Setup
- [ ] Initialize git repository
- [ ] Scaffold monorepo (turbo.json, pnpm-workspace.yaml, package.json)
- [ ] Create .env.example with all required variables
- [ ] Setup packages/circuits with Nargo.toml
- [ ] Setup packages/contracts with foundry.toml
- [ ] Setup packages/sdk with tsconfig.json + vitest
- [ ] Setup packages/extension with manifest.json + webpack.config.js
- [ ] Setup packages/common with shared types
- [ ] Verify `pnpm install` succeeds
- [ ] Verify `pnpm build` succeeds across all packages

### Documentation
- [x] All core docs generated (README, ARCHITECTURE, TECH_STACK, DEV_GUIDE, TESTING_PLAN, DEPLOYMENT, SECURITY, ROADMAP, CHANGELOG)
- [x] Conditional docs generated (CONTRACT_SPEC, UI_SPEC, INTEGRATION, BRAND_TOKENS)
- [x] CLAUDE.md configured
- [x] progress.md initialized

### First Tasks (Phase 1 → Phase 2)
- [ ] Implement shielded_transfer Noir circuit
- [ ] Implement deposit Noir circuit
- [ ] Implement withdraw Noir circuit
- [ ] Write circuit tests — `nargo test` all pass
- [ ] Generate UltraVerifier.sol from circuits

### Verification
- [ ] All circuit tests pass (`nargo test`)
- [ ] All contract tests pass (`forge test`)
- [ ] SDK tests pass (`pnpm --filter @nullshift/sdk test`)
- [ ] Extension builds and loads in Chrome
- [ ] Linting clean across all packages
- [ ] Docs are accurate and complete

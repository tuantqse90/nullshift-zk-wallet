# Deployment — NullShift ZK Privacy Wallet

> **Version**: 0.1.0
> **Last Updated**: 2026-03-12

## Deployment Targets

| Component | Target | Method |
|-----------|--------|--------|
| Smart Contracts | Ethereum Sepolia → Mainnet, Monad | Hardhat deploy scripts |
| Chrome Extension | Chrome Web Store | Manual upload / CI |
| Relayer Service | Railway / VPS | Docker |

## Smart Contract Deployment

### Environment Variables

```bash
# .env (NEVER commit this)
DEPLOYER_PRIVATE_KEY=0x...        # Testnet deployer key
SEPOLIA_RPC_URL=https://...       # Infura/Alchemy Sepolia
MAINNET_RPC_URL=https://...       # Infura/Alchemy Mainnet
MONAD_RPC_URL=https://...         # Monad testnet RPC
ETHERSCAN_API_KEY=...             # Contract verification
```

### Deploy Flow

```bash
# 1. Compile circuits and generate verifier
cd packages/circuits
nargo compile
bb contract -b ./target/shielded_transfer.json -o ../contracts/src/verifiers/

# 2. Deploy contracts
cd packages/contracts
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify

# Deploy order:
# 1. UltraVerifier (auto-generated)
# 2. MerkleTree (library, linked)
# 3. ShieldedPool (references Verifier + MerkleTree)
# 4. Relayer (references ShieldedPool + Uniswap Router)
```

### Contract Addresses

Track deployed addresses in `packages/contracts/deployments/`:

```json
{
  "sepolia": {
    "UltraVerifier": "0x...",
    "ShieldedPool": "0x...",
    "Relayer": "0x..."
  },
  "monad-testnet": {
    "UltraVerifier": "0x...",
    "ShieldedPool": "0x...",
    "Relayer": "0x..."
  }
}
```

## Extension Build & Publish

### Production Build

```bash
cd packages/extension
pnpm build:prod

# Output: packages/extension/dist/
# Contains: manifest.json, popup.html, dashboard.html, sidepanel.html,
#           background.js, content.js, inpage.js, offscreen.html, assets/
```

### Chrome Web Store

1. `cd packages/extension/dist && zip -r ../nullshift-wallet.zip .`
2. Upload to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. Fill in listing: description, screenshots, privacy policy
4. Submit for review

### Extension Version Bump

Update version in:
- `packages/extension/manifest.json` → `"version"`
- `packages/extension/package.json` → `"version"`

## Relayer Service (Optional)

### Docker

```dockerfile
# packages/relayer/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm i -g pnpm && pnpm install --prod
COPY dist/ ./dist/
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
```

### Railway Deployment

```bash
# Install Railway CLI
railway login
railway link
railway up
```

**Environment Variables (Railway)**:
- `RPC_URL` — EVM RPC endpoint
- `RELAYER_PRIVATE_KEY` — Relayer hot wallet key
- `SHIELDED_POOL_ADDRESS` — Deployed contract address
- `UNISWAP_ROUTER_ADDRESS` — AMM router address
- `FEE_PERCENTAGE` — Relayer fee (basis points)

## CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    tags: ['v*']

jobs:
  deploy-contracts:
    if: contains(github.ref, 'contracts')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: foundry-rs/foundry-toolchain@v1
      - run: forge script script/Deploy.s.sol --rpc-url ${{ secrets.SEPOLIA_RPC_URL }} --broadcast
    env:
      DEPLOYER_PRIVATE_KEY: ${{ secrets.DEPLOYER_PRIVATE_KEY }}

  build-extension:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install && pnpm --filter @nullshift/extension build:prod
      - uses: actions/upload-artifact@v4
        with:
          name: extension-dist
          path: packages/extension/dist/
```

## .env.example

```bash
# Network RPCs
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
MONAD_RPC_URL=https://testnet.monad.xyz/rpc/YOUR_KEY

# Contract deployment (testnet only — NEVER use mainnet key here)
DEPLOYER_PRIVATE_KEY=0x...

# Etherscan verification
ETHERSCAN_API_KEY=...

# Relayer (if running relayer service)
RELAYER_PRIVATE_KEY=0x...
SHIELDED_POOL_ADDRESS=0x...
UNISWAP_ROUTER_ADDRESS=0x...
```

## Related Docs

- [Dev Guide](DEV_GUIDE.md) — Local development
- [Testing Plan](TESTING_PLAN.md) — CI test pipeline
- [Security](SECURITY.md) — Deployment security considerations

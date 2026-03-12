# Testing Plan — NullShift ZK Privacy Wallet

> **Version**: 0.1.0
> **Last Updated**: 2026-03-12

## Coverage Targets

| Package | Target | Framework |
|---------|--------|-----------|
| circuits | 100% constraint paths | nargo test |
| contracts | >90% line coverage | Foundry (forge test) |
| sdk | >80% line coverage | Vitest |
| extension | >70% line coverage | Vitest + Chrome Extension Testing |
| common | >90% line coverage | Vitest |

## Testing by Layer

### 1. ZK Circuits (Noir)

**Framework**: `nargo test`

| Circuit | Test Cases |
|---------|-----------|
| shielded_transfer | Normal 2-in-2-out, single-input with change, max-amount edge case, zero-note input, invalid Merkle proof (should fail), wrong secret key (should fail) |
| deposit | Valid commitment, mismatched commitment (should fail) |
| withdraw | Full withdraw, partial withdraw with change, zero-amount edge case, invalid nullifier (should fail) |
| anonymous_swap | Normal swap, max slippage, zero-fee relayer, insufficient balance (should fail) |

**Verification**:
- All constraints satisfied for valid inputs
- Proof generation completes without error
- Invalid inputs produce constraint failure (not just wrong output)
- Edge cases: max field values, zero amounts, boundary conditions

### 2. Smart Contracts (Solidity)

**Framework**: Foundry (`forge test`)

#### Unit Tests
| Contract | Test Cases |
|----------|-----------|
| MerkleTree | Insert single leaf, insert multiple leaves, root computation matches reference, max depth behavior |
| ShieldedPool | Deposit ETH, deposit ERC-20, transact with valid proof, reject invalid proof, reject spent nullifier, withdraw to recipient |
| Relayer | Execute swap via relayer, fee deduction, reject unauthorized relayer calls |

#### Fuzz Tests
- Random amounts for deposit/withdraw (boundary testing)
- Random Merkle tree insertions (root consistency)
- Nullifier uniqueness under random inputs

#### Integration Tests
- Full deposit → transfer → withdraw cycle
- Anonymous swap end-to-end with mock AMM
- Multi-user scenarios (multiple depositors, concurrent transfers)

#### Gas Reports
- `forge test --gas-report` on every PR
- Budget: deposit <200k gas, transact <500k gas, withdraw <300k gas

### 3. SDK (TypeScript)

**Framework**: Vitest

| Module | Test Cases |
|--------|-----------|
| keys.ts | Mnemonic generation, HD derivation matches reference vectors, ZK key derivation, vault encrypt/decrypt round-trip |
| notes.ts | Note commitment generation, note encryption/decryption, UTXO selection (greedy, optimal), note scanning |
| prover.ts | Mock proof generation, input validation, error handling for invalid circuits |
| tree.ts | Local Merkle tree insert, root matches contract, membership proof generation, incremental sync |
| tx.ts | Transaction building, calldata formatting, gas estimation |

### 4. Extension

**Framework**: Vitest + jest-chrome (mock chrome APIs)

| Component | Test Cases |
|-----------|-----------|
| Background | Message routing, wallet lock/unlock, state management |
| Popup | Screen rendering, user flow (lock → unlock → send), balance display |
| Content Script | Provider injection, message relay, origin validation |
| Inpage | EIP-1193 method handling, event emission |
| Side Panel | Activity feed rendering, proof progress display |

### 5. Integration / E2E

**Manual + Automated**:
1. Install extension → Create wallet → Backup seed
2. Deposit ETH to shielded pool → Verify note created
3. Shielded transfer → Verify sender/recipient balances
4. Withdraw → Verify public balance updated
5. Connect to mock dApp → Execute anonymous swap
6. Extension crash recovery → Verify state consistency

**Tooling**: Puppeteer or Playwright with Chrome extension support

## CI Pipeline

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  circuits:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: noir-lang/noirup@v0.1.0
      - run: cd packages/circuits && nargo test

  contracts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: foundry-rs/foundry-toolchain@v1
      - run: cd packages/contracts && forge test --gas-report

  sdk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install && pnpm --filter @nullshift/sdk test -- --coverage

  extension:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install && pnpm --filter @nullshift/extension test
```

## Related Docs

- [Dev Guide](DEV_GUIDE.md) — Running tests locally
- [Security](SECURITY.md) — Security-specific tests
- [Deployment](DEPLOYMENT.md) — CI/CD details

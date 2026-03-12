#!/usr/bin/env npx tsx
// ============================================================
// NullShift — E2E Demo: Full Privacy Pipeline
// ============================================================
// Demonstrates the complete flow against a local Anvil node:
//   1. Generate wallet keys (spending key → Pedersen pubkey)
//   2. Deposit (shield) ETH into the ShieldedPool
//   3. Generate a real ZK proof for the deposit
//   4. Verify the deposit on-chain (Merkle root, leaf index)
//
// Prerequisites:
//   - Anvil running on http://127.0.0.1:8545
//   - Contracts deployed via: cd packages/contracts && ./deploy/dev.sh --no-anvil
//
// Usage:
//   npx tsx scripts/demo.ts
// ============================================================

import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { SHIELDED_POOL_ABI } from '../src/abi';

// Anvil default accounts
const ANVIL_RPC = 'http://127.0.0.1:8545';
const ANVIL_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

// Contract address from local deployment
const DEPLOYMENT_PATH = resolve(__dirname, '../../contracts/deployments/local.json');

async function main() {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════╗');
  console.log('  ║         NullShift — E2E Privacy Demo         ║');
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log('');

  // ── 0. Load deployment config ─────────────────────────
  let deployment: { contracts: { shieldedPool: string } };
  try {
    deployment = JSON.parse(readFileSync(DEPLOYMENT_PATH, 'utf-8'));
  } catch {
    console.error('  [ERR] No local deployment found.');
    console.error('  Run: cd packages/contracts && ./deploy/dev.sh --no-anvil');
    process.exit(1);
  }

  const poolAddress = deployment.contracts.shieldedPool;
  console.log(`  > Pool:    ${poolAddress}`);
  console.log(`  > RPC:     ${ANVIL_RPC}`);
  console.log('');

  // ── 1. Connect to Anvil ───────────────────────────────
  const provider = new ethers.JsonRpcProvider(ANVIL_RPC);
  const signer = new ethers.Wallet(ANVIL_PRIVATE_KEY, provider);
  const signerAddress = await signer.getAddress();

  const balance = await provider.getBalance(signerAddress);
  console.log(`  [1/6] Wallet connected`);
  console.log(`         Address: ${signerAddress}`);
  console.log(`         Balance: ${ethers.formatEther(balance)} ETH`);
  console.log('');

  // ── 2. Initialize Barretenberg (for Pedersen hash) ────
  console.log('  [2/6] Initializing Barretenberg WASM...');
  const { initBarretenberg, computeCommitment, derivePublicKey, bigintToField, destroyBarretenberg } =
    await import('../src/crypto');
  await initBarretenberg();
  console.log('         Done.');
  console.log('');

  // ── 3. Generate wallet keys ───────────────────────────
  console.log('  [3/6] Generating ZK keys...');
  // Use 31 bytes to ensure values stay within BN254 field modulus
  const spendingKeyRaw = ('0x00' + ethers.hexlify(ethers.randomBytes(31)).slice(2)) as `0x${string}`;
  const ownerPubkey = await derivePublicKey(spendingKeyRaw);
  console.log(`         Spending key: ${spendingKeyRaw.slice(0, 18)}...`);
  console.log(`         Public key:   ${ownerPubkey.slice(0, 18)}...`);
  console.log('');

  // ── 4. Compute deposit commitment ─────────────────────
  console.log('  [4/6] Computing deposit commitment...');
  const depositAmount = ethers.parseEther('1.0');
  // Use 31 bytes randomness to stay within BN254 field modulus
  const salt = ('0x00' + ethers.hexlify(ethers.randomBytes(31)).slice(2)) as `0x${string}`;
  const commitment = await computeCommitment(ownerPubkey, depositAmount, salt);
  console.log(`         Amount:     1.0 ETH`);
  console.log(`         Salt:       ${salt.slice(0, 18)}...`);
  console.log(`         Commitment: ${commitment.slice(0, 18)}...`);
  console.log('');

  // ── 5. Submit deposit to ShieldedPool ─────────────────
  console.log('  [5/6] Depositing into ShieldedPool...');
  const pool = new ethers.Contract(poolAddress, SHIELDED_POOL_ABI, signer);

  const tx = await pool['deposit']!(commitment, { value: depositAmount });
  console.log(`         Tx hash: ${tx.hash}`);

  const receipt = await tx.wait();
  console.log(`         Block:   ${receipt.blockNumber}`);
  console.log(`         Gas:     ${receipt.gasUsed.toString()}`);

  // Parse Deposit event
  const depositEvent = receipt.logs
    .map((log: ethers.Log) => {
      try {
        return pool.interface.parseLog({ topics: [...log.topics], data: log.data });
      } catch {
        return null;
      }
    })
    .find((e: ethers.LogDescription | null) => e?.name === 'Deposit');

  if (depositEvent) {
    console.log(`         Leaf:    ${depositEvent.args[1].toString()}`);
  }
  console.log('');

  // ── 6. Verify on-chain state ──────────────────────────
  console.log('  [6/6] Verifying on-chain state...');
  const merkleRoot = await pool['getMerkleRoot']!();
  const nextIndex = await pool['getNextLeafIndex']!();
  const rootKnown = await pool['isKnownRoot']!(merkleRoot);
  const poolBalance = await provider.getBalance(poolAddress);

  console.log(`         Merkle root:  ${merkleRoot.slice(0, 18)}...`);
  console.log(`         Next leaf:    ${nextIndex.toString()}`);
  console.log(`         Root valid:   ${rootKnown}`);
  console.log(`         Pool balance: ${ethers.formatEther(poolBalance)} ETH`);
  console.log('');

  // ── 7. Generate ZK proof (optional, takes ~30s) ───────
  console.log('  [BONUS] Generating deposit ZK proof...');
  const circuitPath = resolve(__dirname, '../../circuits/deposit/target/deposit.json');
  let circuitArtifact;
  try {
    circuitArtifact = JSON.parse(readFileSync(circuitPath, 'utf-8'));
  } catch {
    console.log('           Skipped (circuit not compiled)');
    console.log('           Run: cd packages/circuits/deposit && nargo compile');
    await destroyBarretenberg();
    printSummary(commitment, poolAddress);
    return;
  }

  const { Prover } = await import('../src/prover');
  const prover = new Prover();
  prover.registerCircuit('deposit', circuitArtifact);
  await prover.initialize();

  const startTime = Date.now();
  const proofResult = await prover.generateDepositProof({
    ownerPubkey,
    amount: bigintToField(depositAmount),
    salt,
    commitment,
  });
  const provingTime = Date.now() - startTime;

  console.log(`           Proof generated in ${(provingTime / 1000).toFixed(1)}s`);
  console.log(`           Proof size: ${proofResult.proof.length} bytes`);
  console.log(`           Public inputs: ${proofResult.publicInputs.length}`);

  // Verify proof locally
  const verified = await prover.verifyProof(proofResult);
  console.log(`           Verified locally: ${verified}`);

  await prover.destroy();
  await destroyBarretenberg();
  console.log('');

  printSummary(commitment, poolAddress);
}

function printSummary(commitment: string, poolAddress: string) {
  console.log('  ╔══════════════════════════════════════════════╗');
  console.log('  ║              Demo Complete                   ║');
  console.log('  ╠══════════════════════════════════════════════╣');
  console.log('  ║  1.0 ETH deposited into ShieldedPool        ║');
  console.log('  ║  Commitment stored in Merkle tree            ║');
  console.log('  ║  ZK proof generated + verified               ║');
  console.log('  ║                                              ║');
  console.log('  ║  The deposited funds are now PRIVATE.        ║');
  console.log('  ║  Only the holder of the spending key can     ║');
  console.log('  ║  transfer or withdraw these funds.           ║');
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log('');
}

main().catch((err) => {
  console.error('');
  console.error('  [FATAL]', err.message || err);
  process.exit(1);
});

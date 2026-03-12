/**
 * Generate a real deposit proof for E2E testing.
 * Outputs proof bytes and public inputs as hex for use in Foundry tests.
 *
 * Usage: npx tsx scripts/generate-test-proof.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

async function main() {
  const { Noir } = await import('@noir-lang/noir_js');
  const { BarretenbergBackend } = await import('@noir-lang/backend_barretenberg');

  // Load deposit circuit artifact
  const artifactPath = resolve(__dirname, '../../circuits/deposit/target/deposit.json');
  const artifact = JSON.parse(readFileSync(artifactPath, 'utf-8'));

  console.log('Initializing backend...');
  const backend = new BarretenbergBackend(artifact);
  const program = new Noir(artifact);

  // Test inputs matching the circuit test
  // Commitment was computed via nargo: pedersen_hash([12345, 1000000, 99999])
  const commitment = '0x2d7e7bb7b8e5019d596924609399db611f0800e269cf7d9cb7134a2b0cb2f895';

  const inputs = {
    owner_pubkey: '12345',
    amount: '1000000',
    salt: '99999',
    commitment,
  };

  console.log('Generating witness...');
  const { witness } = await program.execute(inputs);

  console.log('Generating proof...');
  const proofData = await backend.generateProof(witness);

  console.log('\n=== E2E Test Data ===\n');

  // Proof as hex
  const proofHex = '0x' + Array.from(proofData.proof).map(b => b.toString(16).padStart(2, '0')).join('');
  console.log('PROOF_HEX=' + proofHex);
  console.log('PROOF_LENGTH=' + proofData.proof.length);

  // Public inputs
  console.log('PUBLIC_INPUTS_COUNT=' + proofData.publicInputs.length);
  for (let i = 0; i < proofData.publicInputs.length; i++) {
    console.log(`PUBLIC_INPUT_${i}=${proofData.publicInputs[i]}`);
  }

  // Verify locally
  console.log('\nVerifying proof locally...');
  const valid = await backend.verifyProof(proofData);
  console.log('Local verification:', valid ? 'PASSED' : 'FAILED');

  await backend.destroy();
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
